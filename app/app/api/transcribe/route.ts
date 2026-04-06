import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkRateLimit } from "@/lib/ratelimit/limiters";
import { checkMonthlyUsage, formatUsageHeaders } from "@/lib/usage/limits";
import { recordUsage } from "@/lib/usage/tracker";
import { withRetry } from "@/lib/openai/retry";
import { formatErrorResponse } from "@/lib/openai/errors";
import { checkCostCeiling, formatCostCeilingResponse } from "@/lib/cost/ceiling";
import { trackCost } from "@/lib/cost/tracker";
import { checkAbusePattern } from "@/lib/abuse/detector";
import { logAbuseAlert } from "@/lib/abuse/alerts";
import type { SubscriptionPlan } from "@/types/database";
import { getTranscriptionConfig } from '@/lib/ai/config';
import { RADIOLOGY_VOCABULARY_HINT } from '@/lib/ai/medical-vocabulary';

// Hardcoded fallback: OpenAI Whisper-1 is the emergency failover when the
// primary (Groq) transcription provider errors after retries are exhausted.
const FALLBACK_PROVIDER = { provider: 'openai', model: 'whisper-1' } as const;

/**
 * Call a Whisper-compatible transcription API (Groq or OpenAI) with the
 * given audio file. Requests verbose_json so the response includes the
 * actual audio `duration` field (in seconds) used for accurate cost tracking.
 *
 * Throws an Error with a `.status` property on non-2xx responses so withRetry
 * can classify retryable vs non-retryable failures.
 */
async function callWhisperAPI(
  provider: string,
  model: string,
  audioFile: File
): Promise<{ text: string; duration?: number }> {
  const whisperFormData = new FormData();
  whisperFormData.append('file', audioFile, audioFile.name);
  whisperFormData.append('prompt', RADIOLOGY_VOCABULARY_HINT);
  whisperFormData.append('model', model);
  whisperFormData.append('response_format', 'verbose_json');

  const { apiUrl, apiKey } =
    provider === 'groq'
      ? {
          apiUrl: 'https://api.groq.com/openai/v1/audio/transcriptions',
          apiKey: process.env.GROQ_API_KEY!,
        }
      : {
          apiUrl: 'https://api.openai.com/v1/audio/transcriptions',
          apiKey: process.env.OPENAI_API_KEY!,
        };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: whisperFormData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error = new Error(
      errorData?.error?.message || `${provider} transcription error: ${response.status}`
    );
    (error as Error & { status: number }).status = response.status;
    throw error;
  }

  return response.json();
}

// Node.js runtime required for FormData file parsing
export const runtime = 'nodejs';

// 120 second timeout for audio transcription (longer files take more time)
export const maxDuration = 120;

// Maximum file size: 25MB (OpenAI Whisper limit)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Supported audio MIME types
const SUPPORTED_MIME_TYPES = [
  'audio/mp3',
  'audio/mpeg',
  'audio/mpga',
  'audio/mp4',
  'audio/m4a',
  'audio/wav',
  'audio/webm',
  'audio/x-wav',
  'audio/x-m4a',
];

// Supported file extensions (fallback check)
const SUPPORTED_EXTENSIONS = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];

// Create Supabase server client for Node.js runtime
async function createNodeSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const cookieStore = await cookies();

  const baseCookieOptions: CookieOptions = {
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options?: CookieOptions) {
        try {
          cookieStore.set({
            name,
            value,
            ...baseCookieOptions,
            ...options,
          });
        } catch {
          // Read-only cookie store during rendering - ignore
        }
      },
      remove(name: string, options?: CookieOptions) {
        try {
          cookieStore.set({
            name,
            value: '',
            ...baseCookieOptions,
            ...options,
            maxAge: 0,
          });
        } catch {
          // Ignore when cookie store cannot be mutated
        }
      },
    },
  });
}

/**
 * Validate file type by MIME type and extension
 */
function isValidAudioFile(file: File): boolean {
  // Check MIME type
  if (SUPPORTED_MIME_TYPES.includes(file.type)) {
    return true;
  }

  // Fallback: check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (extension && SUPPORTED_EXTENSIONS.includes(extension)) {
    return true;
  }

  return false;
}

/**
 * POST /api/transcribe
 *
 * Transcribes audio files using Groq Whisper v3 Turbo (default) or OpenAI Whisper (fallback).
 * Accepts FormData with 'audio' field containing the audio file.
 *
 * Returns:
 * - 200: { success: true, transcript: string, duration: number }
 * - 400: Invalid request (missing file, invalid type)
 * - 401: Unauthorized
 * - 413: File too large
 * - 500: Server error
 */
export async function POST(request: Request) {
  const startTime = Date.now();

  try {
    // Authenticate user via Supabase
    const supabase = await createNodeSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Unauthorized',
          message: 'Authentication required. Please sign in to access this resource.',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // === RATE LIMITING: Check per-minute rate limit ===
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .single();

    const isActiveSubscription = subscription?.status === "active" || subscription?.status === "trialing";
    const userPlan: SubscriptionPlan = (isActiveSubscription && subscription?.plan) || "free";

    const rateLimitResult = await checkRateLimit(user.id, userPlan, "transcribe");

    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate Limit Exceeded",
          message: `Too many requests. Please wait ${retryAfterSeconds} seconds before trying again.`,
          retryAfter: retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSeconds),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Limit": String(rateLimitResult.limit),
          },
        }
      );
    }

    // === COST CEILING: Check global daily cost ceiling ===
    const costResult = await checkCostCeiling(userPlan);

    if (!costResult.allowed) {
      return formatCostCeilingResponse(costResult);
    }

    // Log warning if approaching ceiling
    if (costResult.mode === "warning" || costResult.mode === "degraded") {
      console.warn(`[Transcribe] Cost ceiling ${costResult.mode}: ${costResult.percentUsed.toFixed(1)}%`);
    }

    // === ABUSE DETECTION: Check for abnormal usage patterns ===
    const abuseResult = await checkAbusePattern(user.id, "transcription");

    if (!abuseResult.normal) {
      // Log abuse alert
      await logAbuseAlert(user.id, "transcription", abuseResult.hourlyCount, abuseResult.threshold, {
        userEmail: user.email,
        autoBlocked: abuseResult.flagged,
      });

      if (abuseResult.flagged) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Account Suspended",
            message: "Your account has been temporarily suspended due to unusual activity. Please contact support.",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        );
      }

      // Not blocked yet, but warn user
      console.warn(`[Transcribe] Abuse warning for user ${user.id}: ${abuseResult.hourlyCount}/${abuseResult.threshold}`);
    }

    // === USAGE LIMITING: Check monthly usage limit ===
    const usageResult = await checkMonthlyUsage(user.id, "transcriptions");

    if (!usageResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Monthly Limit Reached",
          message: `You've used ${usageResult.currentUsage} of ${usageResult.limit} transcriptions this month. ` +
            `Your limit resets on ${usageResult.resetDate.toLocaleDateString()}.`,
          currentUsage: usageResult.currentUsage,
          limit: usageResult.limit,
          resetDate: usageResult.resetDate.toISOString(),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...formatUsageHeaders(usageResult),
          },
        }
      );
    }

    // Get transcription provider configuration from environment
    const transcriptionConfig = getTranscriptionConfig();
    const provider = transcriptionConfig.provider;

    // Validate API keys — require at least one usable provider so fallback works.
    // If primary key is missing but fallback key is present, log warning and continue
    // (the primary call will fail fast and we'll route to the fallback).
    const primaryKey = provider === 'groq' ? 'GROQ_API_KEY' : 'OPENAI_API_KEY';
    const fallbackKey = 'OPENAI_API_KEY';
    const hasPrimary = Boolean(process.env[primaryKey]);
    const hasFallback = Boolean(process.env[fallbackKey]);

    if (!hasPrimary && !hasFallback) {
      console.error(
        `[Transcribe] Neither ${primaryKey} nor ${fallbackKey} is configured — transcription unavailable`
      );
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Configuration Error',
          message: 'AI transcription service is not configured. Please contact support.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!hasPrimary) {
      console.warn(
        `[Transcribe] Primary key ${primaryKey} missing; will route directly to OpenAI fallback`
      );
    }

    // Parse FormData
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Request',
          message: 'Request must be multipart/form-data with an audio file.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get audio file from FormData
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing File',
          message: 'No audio file provided. Please include an audio file in the "audio" field.',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      const fileSizeMB = (audioFile.size / (1024 * 1024)).toFixed(1);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'File Too Large',
          message: `File size (${fileSizeMB}MB) exceeds maximum allowed size of 25MB.`,
        }),
        { status: 413, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    if (!isValidAudioFile(audioFile)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid File Type',
          message: `Unsupported audio format. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Call Whisper API with retry + automatic Groq→OpenAI fallback.
    // Happy path: identical to pre-34-03 behavior — primary provider succeeds.
    // Failure path: exhausts primary retries, logs warn, retries against OpenAI
    // Whisper with an independent retry budget. Cost tracking uses the provider
    // that actually served the request so fallback cost amplification (~9x) is
    // accurately recorded against the daily ceiling.
    const primary = { provider: transcriptionConfig.provider, model: transcriptionConfig.model };

    let servedBy: { provider: string; model: string };
    let result: { text: string; duration?: number };

    try {
      try {
        if (!hasPrimary) {
          // Primary key missing — skip straight to fallback (error path
          // inside the inner try triggers the catch below).
          throw new Error(`${primaryKey} not configured; routing to fallback`);
        }
        result = await withRetry(
          () => callWhisperAPI(primary.provider, primary.model, audioFile),
          { maxRetries: 3, operationName: `transcribe:${primary.provider}` }
        );
        servedBy = primary;
      } catch (primaryError) {
        // If primary IS OpenAI, there is no meaningful fallback — rethrow.
        if (primary.provider === 'openai') {
          throw primaryError;
        }
        if (!hasFallback) {
          console.error('[Transcribe] Primary failed and fallback key missing, cannot fail over');
          throw primaryError;
        }
        console.warn(
          `[Transcribe] Primary ${primary.provider} failed, falling back to openai:whisper-1:`,
          primaryError instanceof Error ? primaryError.message : primaryError
        );
        try {
          result = await withRetry(
            () =>
              callWhisperAPI(
                FALLBACK_PROVIDER.provider,
                FALLBACK_PROVIDER.model,
                audioFile
              ),
            { maxRetries: 2, operationName: 'transcribe:openai-fallback' }
          );
          servedBy = { provider: FALLBACK_PROVIDER.provider, model: FALLBACK_PROVIDER.model };
        } catch (fallbackError) {
          console.error('[Transcribe] Both providers failed', {
            primaryError:
              primaryError instanceof Error ? primaryError.message : String(primaryError),
            fallbackError:
              fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
          });
          throw fallbackError;
        }
      }

      const processingTime = (Date.now() - startTime) / 1000;

      // Prefer actual audio duration from verbose_json. Fall back to wall-clock
      // processing time only if the provider did not return a duration field.
      const audioDurationSeconds =
        typeof result.duration === 'number' && result.duration > 0
          ? result.duration
          : processingTime;

      // Record successful usage (non-blocking)
      recordUsage(user.id, "transcription", {
        durationMs: processingTime * 1000,
        fileSize: audioFile.size,
        fileName: audioFile.name,
      }).catch((err) => console.error("[Usage] Failed to record:", err));

      // Track cost for global ceiling (non-blocking) with real provider + duration.
      // Fallback-served requests correctly record the higher OpenAI rate.
      trackCost("transcription", user.id, {
        transcription: {
          provider: servedBy.provider,
          model: servedBy.model,
          durationSeconds: audioDurationSeconds,
        },
      }).catch((err) => console.error("[Cost] Failed to track:", err));

      return new Response(
        JSON.stringify({
          success: true,
          transcript: result.text || '',
          duration: processingTime,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": String(rateLimitResult.remaining - 1),
            "X-RateLimit-Limit": String(rateLimitResult.limit),
          },
        }
      );
    } catch (error) {
      console.error(`[Transcribe] transcription error after retries + fallback:`, error);
      const errorResponse = formatErrorResponse(error);
      return new Response(
        JSON.stringify({
          success: false,
          error: errorResponse.error,
          message: errorResponse.message,
        }),
        { status: errorResponse.statusCode, headers: { "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    // Log detailed error server-side
    console.error('Error in POST /api/transcribe:', error);

    // Return generic error to client
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred while transcribing the audio. Please try again.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
