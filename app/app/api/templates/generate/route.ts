import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { aiGeneratedTemplateSchema } from '@/lib/validation/template-schema';
import { checkRateLimit } from '@/lib/ratelimit/limiters';
import { checkMonthlyUsage, formatUsageHeaders } from '@/lib/usage/limits';
import { recordUsage } from '@/lib/usage/tracker';
import { withRetry } from '@/lib/openai/retry';
import { formatErrorResponse } from '@/lib/openai/errors';
import { checkCostCeiling, formatCostCeilingResponse } from '@/lib/cost/ceiling';
import { trackCost } from '@/lib/cost/tracker';
import { checkAbusePattern } from '@/lib/abuse/detector';
import { logAbuseAlert } from '@/lib/abuse/alerts';
import type { SubscriptionPlan } from '@/types/database';

// Edge runtime for low-latency AI generation
export const runtime = 'edge';

// 30 second timeout for template generation
export const maxDuration = 30;

// Create Supabase client for Edge runtime
async function createEdgeSupabaseClient() {
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
 * Template syntax guidance for AI generation
 */
const TEMPLATE_SYNTAX_GUIDANCE = `
Template syntax rules:
- Use [placeholder] for variable data, e.g., [patient age], [laterality]
- Use (instructions) for conditional guidance, e.g., (describe if abnormal)
- Use "verbatim text" for exact phrases to include
- Section names should be ALL CAPS: TECHNIQUE, COMPARISON, FINDINGS, IMPRESSION
- Include standard sections for the modality
- Be specific to the body part and clinical context
`;

/**
 * Prompt for structuring existing template text
 */
const STRUCTURE_EXISTING_GUIDANCE = `
You are a radiology report template parser. Your task is to:
1. Parse the provided raw template text into structured sections
2. Identify the modality and body part from the content
3. Create a proper template name based on the content
4. Convert checklists and instructions into the template syntax:
   - [placeholder] for variable data
   - (instructions) for conditional guidance or checklists
   - "verbatim text" for phrases that should always be included
5. Preserve all section headers and their content
6. Keep any specific instructions mentioned in the template

Be thorough and preserve all the information from the original template.
`;

/**
 * POST /api/templates/generate
 *
 * Generates a complete radiology report template using AI structured output.
 * Uses Vercel AI SDK Output.object() to guarantee schema compliance.
 */
export async function POST(request: Request) {
  try {
    // Authenticate user via Supabase
    const supabase = await createEdgeSupabaseClient();
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
    const supabaseForSub = await createEdgeSupabaseClient();
    const { data: subscription } = await supabaseForSub
      .from('subscriptions')
      .select('plan, status')
      .eq('user_id', user.id)
      .single();

    const isActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';
    const userPlan: SubscriptionPlan = (isActiveSubscription && subscription?.plan) || 'free';

    const rateLimitResult = await checkRateLimit(user.id, userPlan, 'template');

    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Rate Limit Exceeded',
          message: `Too many requests. Please wait ${retryAfterSeconds} seconds before trying again.`,
          retryAfter: retryAfterSeconds,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(retryAfterSeconds),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
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
    if (costResult.mode === 'warning' || costResult.mode === 'degraded') {
      console.warn(`[Template Generate] Cost ceiling ${costResult.mode}: ${costResult.percentUsed.toFixed(1)}%`);
    }

    // === ABUSE DETECTION: Check for abnormal usage patterns ===
    const abuseResult = await checkAbusePattern(user.id, 'template');

    if (!abuseResult.normal) {
      // Log abuse alert
      await logAbuseAlert(user.id, 'template', abuseResult.hourlyCount, abuseResult.threshold, {
        userEmail: user.email,
        autoBlocked: abuseResult.flagged,
      });

      if (abuseResult.flagged) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Account Suspended',
            message: 'Your account has been temporarily suspended due to unusual activity. Please contact support.',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Not blocked yet, but warn user
      console.warn(`[Template Generate] Abuse warning for user ${user.id}: ${abuseResult.hourlyCount}/${abuseResult.threshold}`);
    }

    // === USAGE LIMITING: Check monthly usage limit ===
    // Note: Template generation counts towards report limits
    const usageResult = await checkMonthlyUsage(user.id, 'reports');

    if (!usageResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Monthly Limit Reached',
          message: `You've used ${usageResult.currentUsage} of ${usageResult.limit} AI generations this month. ` +
            `Your limit resets on ${usageResult.resetDate.toLocaleDateString()}.`,
          currentUsage: usageResult.currentUsage,
          limit: usageResult.limit,
          resetDate: usageResult.resetDate.toISOString(),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...formatUsageHeaders(usageResult),
          },
        }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid Request',
          message: 'Request body must be valid JSON',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { mode = 'describe', description, rawTemplate, modality, bodyPart } = body;

    // Validate based on mode
    if (mode === 'describe') {
      if (!description || typeof description !== 'string' || description.trim().length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Validation Error',
            message: 'Description is required',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else if (mode === 'structure') {
      if (!rawTemplate || typeof rawTemplate !== 'string' || rawTemplate.trim().length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Validation Error',
            message: 'Template text is required',
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation Error',
          message: 'Invalid mode. Use "describe" or "structure".',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Configuration Error',
          message: 'AI service is not configured. Please contact support.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build system and user prompts based on mode
    let systemPrompt: string;
    let userPrompt: string;

    if (mode === 'structure') {
      // Structure existing template mode
      systemPrompt = `You are a radiology report template parser and structurer.

${STRUCTURE_EXISTING_GUIDANCE}

${TEMPLATE_SYNTAX_GUIDANCE}`;

      userPrompt = `Parse and structure the following raw template text into a properly formatted radiology report template:

---RAW TEMPLATE START---
${rawTemplate}
---RAW TEMPLATE END---

${modality ? `Modality hint: ${modality}` : 'Auto-detect the modality from the content.'}
${bodyPart ? `Body part hint: ${bodyPart}` : 'Auto-detect the body part from the content.'}

Important:
1. Extract a clear template name from the content (e.g., "MRI Lumbar Spine Protocol")
2. Identify all section headers and their content
3. Convert any checklists to (checklist items) format
4. Preserve special instructions as [placeholders] or (instructions)
5. Keep any "verbatim text" that should always appear in reports`;
    } else {
      // Describe new template mode (default)
      systemPrompt = `You are a radiology report template expert. Create structured templates for radiologists.

${TEMPLATE_SYNTAX_GUIDANCE}

Consider the standard structure for the modality and include all essential sections.`;

      userPrompt = `Create a radiology report template for ${modality || 'the specified'} imaging of ${bodyPart || 'the specified body part'}.

User requirements: ${description}

Generate a professional template with appropriate sections for this exam type.`;
    }

    // Generate template using GPT-4o with structured output and retry
    try {
      const result = await withRetry(
        async () => generateText({
          model: openai('gpt-4o'),
          system: systemPrompt,
          prompt: userPrompt,
          output: Output.object({ schema: aiGeneratedTemplateSchema }),
          temperature: 0.3, // Deterministic output for consistency
        }),
        { maxRetries: 3, operationName: 'template-generate' }
      );

      // Extract the validated output
      const output = result.output;

      // Record successful usage (non-blocking)
      recordUsage(user.id, 'template', {
        mode,
        modality: modality || output?.modality,
        bodyPart: bodyPart || output?.bodyPart,
      }).catch((err) => console.error('[Usage] Failed to record:', err));

      // Track cost for global ceiling (non-blocking)
      trackCost('template', user.id).catch((err) =>
        console.error('[Cost] Failed to track:', err)
      );

      // Return the validated template with rate limit info
      return new Response(
        JSON.stringify({
          success: true,
          data: output,
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Remaining': String(rateLimitResult.remaining - 1),
            'X-RateLimit-Limit': String(rateLimitResult.limit),
          },
        }
      );
    } catch (error) {
      console.error('[Template Generate] OpenAI error after retries:', error);
      const errorResponse = formatErrorResponse(error);
      return new Response(
        JSON.stringify({
          success: false,
          error: errorResponse.error,
          message: errorResponse.message,
        }),
        { status: errorResponse.statusCode, headers: { 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    // Log detailed error server-side
    console.error('Error in POST /api/templates/generate:', error);

    // Return generic error to client
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred while generating the template. Please try again.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
