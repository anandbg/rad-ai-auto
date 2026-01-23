import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkRateLimit } from "@/lib/ratelimit/limiters";
import { checkMonthlyUsage, formatUsageHeaders } from "@/lib/usage/limits";
import { recordUsage } from "@/lib/usage/tracker";
import { withRetry } from "@/lib/openai/retry";
import { formatErrorResponse } from "@/lib/openai/errors";
import type { SubscriptionPlan } from "@/types/database";

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
 * Transcribes audio files using OpenAI Whisper API via Vercel AI SDK.
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

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Configuration Error',
          message: 'AI transcription service is not configured. Please contact support.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
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

    // Call OpenAI Whisper API with retry logic
    try {
      const result = await withRetry(
        async () => {
          const openaiFormData = new FormData();
          openaiFormData.append('model', 'whisper-1');
          openaiFormData.append('file', audioFile, audioFile.name);

          const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: openaiFormData,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(errorData?.error?.message || `OpenAI API error: ${response.status}`);
            // Add status to error for retry detection
            (error as Error & { status: number }).status = response.status;
            throw error;
          }

          return response.json();
        },
        { maxRetries: 3, operationName: "transcribe" }
      );

      const processingTime = (Date.now() - startTime) / 1000;

      // Record successful usage (non-blocking)
      recordUsage(user.id, "transcription", {
        durationMs: processingTime * 1000,
        fileSize: audioFile.size,
        fileName: audioFile.name,
      }).catch((err) => console.error("[Usage] Failed to record:", err));

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
      console.error("[Transcribe] OpenAI error after retries:", error);
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
