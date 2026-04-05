import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { streamText } from 'ai';
import { getModel } from '@/lib/ai/registry';
import { z } from 'zod';
import { checkRateLimit } from "@/lib/ratelimit/limiters";
import { checkMonthlyUsage, formatUsageHeaders } from "@/lib/usage/limits";
import { recordUsage } from "@/lib/usage/tracker";
import { withStreamRetry } from "@/lib/openai/retry";
import { formatErrorResponse } from "@/lib/openai/errors";
import { checkCostCeiling, formatCostCeilingResponse } from "@/lib/cost/ceiling";
import { trackCost } from "@/lib/cost/tracker";
import { checkAbusePattern } from "@/lib/abuse/detector";
import { logAbuseAlert } from "@/lib/abuse/alerts";

// Edge runtime for low-latency streaming
export const runtime = 'edge';

// 30 second timeout for report generation
export const maxDuration = 30;

// Request body schema
const generateRequestSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  findings: z.string().min(1, 'Clinical findings are required'),
  templateName: z.string().min(1, 'Template name is required'),
  modality: z.string().min(1, 'Modality is required'),
  bodyPart: z.string().min(1, 'Body part is required'),
  templateContent: z.string().optional(),
});

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
 * POST /api/generate
 *
 * Streams an AI-generated radiology report based on clinical findings and template.
 * Uses Server-Sent Events (SSE) for real-time streaming to the client.
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
    // Get user's subscription plan for rate limiting
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .single();

    const isActiveSubscription = subscription?.status === "active" || subscription?.status === "trialing";
    const userPlan = (isActiveSubscription && subscription?.plan) || "free";

    const rateLimitResult = await checkRateLimit(user.id, userPlan, "generate");

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
      console.warn(`[Generate] Cost ceiling ${costResult.mode}: ${costResult.percentUsed.toFixed(1)}%`);
    }

    // === ABUSE DETECTION: Check for abnormal usage patterns ===
    const abuseResult = await checkAbusePattern(user.id, "report");

    if (!abuseResult.normal) {
      // Log abuse alert
      await logAbuseAlert(user.id, "report", abuseResult.hourlyCount, abuseResult.threshold, {
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
      console.warn(`[Generate] Abuse warning for user ${user.id}: ${abuseResult.hourlyCount}/${abuseResult.threshold}`);
    }

    // === USAGE LIMITING: Check monthly usage limit ===
    const usageResult = await checkMonthlyUsage(user.id, "reports");

    if (!usageResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Monthly Limit Reached",
          message: `You've used ${usageResult.currentUsage} of ${usageResult.limit} reports this month. ` +
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

    const validation = generateRequestSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Validation Error',
          message: 'Request validation failed',
          validationErrors: validation.error.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { findings, templateName, modality, bodyPart, templateContent } = validation.data;

    // Build system prompt for radiology report generation
    // Phase 32: Adapted for Groq Llama 4 Scout -- under 2K tokens, numbered constraints, explicit reasoning chain
    const systemPrompt = `You are an expert radiologist. Generate a professional radiology report in Markdown.

Template: ${templateName}
Modality: ${modality}
Body Part: ${bodyPart}
${templateContent ? `\nTEMPLATE STRUCTURE (FOLLOW THIS EXACTLY):\n${templateContent}\n\nUse the same **bold subsection headings** as shown in the template. Match the template's organization exactly.` : ''}

CONSTRAINTS (violations cause report rejection):
CONSTRAINT 1. ONLY report findings explicitly stated in USER FINDINGS. Pass: every abnormality traces to input. Fail: any added finding.
CONSTRAINT 2. Do not add measurements not in input. Pass: all numbers match input. Fail: any invented measurement.
CONSTRAINT 3. Do not elaborate beyond what was dictated. Pass: abnormality descriptions match input detail level. Fail: added specifics.
CONSTRAINT 4. Normal findings MAY be added ONLY for structures NOT mentioned in input.
CONSTRAINT 5. No contradictions within same organ system. Pass: consistent characterization. Fail: "normal" and "abnormal" for same structure.
CONSTRAINT 6. No "Pertinent Negatives" section or similar headings (e.g., "Notable Negatives:", "Relevant Negatives:").

REASONING PROCESS (follow this order):
Step 1: Read all user findings and list the mentioned structures.
Step 2: For each mentioned structure, report ONLY what was stated.
Step 3: For unmentioned structures, add template normal findings.
Step 4: Check for contradictions between findings.
Step 5: Write Impression summarizing key findings only.

FORMATTING RULES:
- Use ## for main sections, **bold:** for subsections within Findings
- In Findings: plain text statements (one per line), bullets ONLY for nested sub-items
- If template structure is provided, FOLLOW its subsection organization exactly
- Use standard radiological terminology consistently

OUTPUT FORMAT:
## Clinical Information
Brief clinical indication and relevant history.

## Technique
Short description of imaging protocol.

## Comparison
Prior studies or "No prior studies available for comparison."

## Findings
Structure with **bold subheadings:** for each anatomical region. Plain text findings per line. Bullets only for nested sub-items (e.g., disc level details).

## Impression
- One bullet per key finding (one sentence each)
- No nested sub-bullets`;

    // Build user prompt with examples (moved from system prompt) and anti-hallucination checklist
    const userPrompt = `REFERENCE EXAMPLES (for formatting guidance):

CORRECT: User says "Small nodule in right upper lobe" -> Report: "Small nodule in right upper lobe."
INCORRECT: User says "Nodule in right upper lobe" -> Report: "2.3 cm nodule in right upper lobe with spiculated margins." (added size and margins not mentioned = CONSTRAINT 1 and 2 violation)
CORRECT NORMAL: User says "No abnormalities in liver" -> Report: "Liver demonstrates normal size, contour, and signal intensity." (adding normal details is acceptable)
INCORRECT: User says "Liver unremarkable" -> Report: "Liver unremarkable. Small 1.2 cm hemangioma in segment IV." (added finding not mentioned = CONSTRAINT 1 violation)

USER FINDINGS / DICTATION:
${findings}

ANTI-HALLUCINATION CHECKLIST (verify before output):
1. Every abnormality in your report is explicitly stated in USER FINDINGS above
2. Every measurement in your report appears in USER FINDINGS above
3. No specific characteristics were added beyond what was dictated
4. Normal findings are only for structures NOT mentioned in USER FINDINGS
5. No contradictions exist within the same organ system

Generate a professional radiology report in Markdown format now.`;

    // Generate report using GPT-4o with streaming and retry
    try {
      const result = await withStreamRetry(
        async () => streamText({
          model: getModel('generate'),
          system: systemPrompt,
          prompt: userPrompt,
          temperature: 0.2, // Low temperature for deterministic, consistent medical reports
          maxOutputTokens: 2000,
        }),
        { operationName: "generate-report" }
      );

      // Record successful usage (non-blocking)
      recordUsage(user.id, "report", {
        templateId: validation.data.templateId,
        modality: validation.data.modality,
      }).catch((err) => console.error("[Usage] Failed to record:", err));

      // Track cost for global ceiling (non-blocking)
      trackCost("report", user.id).catch((err) =>
        console.error("[Cost] Failed to track:", err)
      );

      // Return streaming response with rate limit info
      const response = result.toTextStreamResponse();

      // Add rate limit headers to successful response
      const headers = new Headers(response.headers);
      headers.set("X-RateLimit-Remaining", String(rateLimitResult.remaining - 1));
      headers.set("X-RateLimit-Limit", String(rateLimitResult.limit));

      return new Response(response.body, {
        status: response.status,
        headers,
      });
    } catch (error) {
      // Handle OpenAI errors after retries exhausted
      console.error("[Generate] OpenAI error after retries:", error);
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
    console.error('Error in POST /api/generate:', error);

    // Return generic error to client
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred while generating the report. Please try again.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
