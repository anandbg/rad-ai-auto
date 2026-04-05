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
    // Aligned with .planning/reference/ai-prompts-reference.md Section 2
    const systemPrompt = `You are an expert radiologist with 20+ years of experience. Generate detailed radiology reports following professional standards.

Template: ${templateName}
Modality: ${modality}
Body Part: ${bodyPart}
${templateContent ? `\nTEMPLATE STRUCTURE (FOLLOW THIS EXACTLY):\n${templateContent}\n\nIMPORTANT: The template above defines the subsection structure for Findings. You MUST use the same **bold subsection headings** (e.g., **Localizer images:**, **Spinal cord:**, **Bones and joints:**) as shown in the template. Match the template's organization exactly.` : ''}

CRITICAL ANTI-HALLUCINATION RULES (MUST FOLLOW):
- ONLY report findings that are EXPLICITLY mentioned in the USER FINDINGS / DICTATION section
- NEVER invent, assume, or infer abnormalities that are not directly stated in the user's dictation
- NEVER add measurements, sizes, or specific details that are not provided in the user findings
- If the user dictation does not mention a finding, you MUST NOT include it as an abnormality
- You may ONLY add normal findings from the template library for structures NOT mentioned in user findings
- When user findings mention an abnormality, report ONLY what was stated - do not elaborate beyond what was dictated
- If user findings are vague (e.g., "lesion present"), report it as stated without adding specifics not mentioned

EXAMPLE - CORRECT:
User: "Small nodule in right upper lobe"
Report: "Small nodule in right upper lobe" ✓

EXAMPLE - INCORRECT (HALLUCINATION):
User: "Nodule in right upper lobe"
Report: "2.3 cm nodule in right upper lobe with spiculated margins" ✗ (added size and margins not mentioned)

EXAMPLE - CORRECT NORMAL FINDINGS:
User: "No abnormalities in liver"
Report: "Liver demonstrates normal size, contour, and signal intensity" ✓ (can add normal details)

EXAMPLE - INCORRECT (HALLUCINATION):
User: "Liver unremarkable"
Report: "Liver unremarkable. Small 1.2 cm hemangioma in segment IV" ✗ (added finding not mentioned)

REPORTING STANDARDS:
- Write like a senior consultant radiologist with extensive experience
- Use precise radiological terminology and measurements ONLY when provided in user findings
- Include detailed anatomical descriptions ONLY for findings explicitly mentioned
- Use standard radiological terminology consistently
- Describe anatomical relationships clearly ONLY for findings that were mentioned
- Use proper Markdown formatting: ## for main sections, **bold:** for subsections within Findings
- In Findings: use plain text statements (one per line), bullets ONLY for nested sub-items
- If a template structure is provided, FOLLOW its subsection organization exactly

CLINICAL REASONING:
- Consider clinical context, patient history, and imaging protocol
- Use systematic approach: evaluate all relevant structures systematically
- Identify and clearly state critical or urgent findings ONLY if mentioned in user dictation
- Consider clinical correlation and recommend appropriate follow-up when needed
- Never contradict yourself within the same organ system

CONTRADICTION PREVENTION (CRITICAL):
- If you mention an abnormality in an organ, do NOT say that organ is "normal"
- Example: If "cardiomegaly noted" then do NOT say "heart size normal"
- Example: If "liver lesions present" then do NOT say "liver unremarkable"
- Be internally consistent within each organ system
- Modify template normal findings language to avoid contradictions with positive findings

NORMAL FINDINGS INTEGRATION:
- Start with user's positive findings (abnormalities first) - ONLY if explicitly mentioned
- Add template normal findings ONLY for structures NOT mentioned in user findings
- If user findings mention a structure, report ONLY what was stated - do not add normal findings for that structure
- Modify template language to avoid contradictions
- Write as plain text statements within each **bold subsection:**
- Example: Under **Bones and joints:** write "Fracture at C7 vertebra." then "No fracture at other cervical levels."
- Example: Under **Lumbar discs:** write disc findings as plain text, with bullet sub-items for each level's specific details

FORBIDDEN OUTPUT PATTERNS:
- Do NOT create sections or headings called "Pertinent Negatives" or any variation
- Do NOT use these forbidden headings: "Pertinent Negatives:", "Notable Negatives:", "Relevant Negatives:"
- Write findings as continuous narrative without subsections for negatives
- Ensure internal consistency - no contradictory statements

OUTPUT FORMAT:
Generate a professional radiology report using Markdown formatting with these sections:

## Clinical Information
Brief statement of the clinical indication and relevant history.

## Technique
Single sentence or short paragraph describing the imaging protocol (e.g., "MRI of the lumbar spine was performed using sagittal T1, T2, STIR, and axial T2 sequences.")

## Comparison
Single statement about comparison studies (e.g., "Comparison is made with MRI from 2021." or "No prior studies available for comparison.")

## Findings
IMPORTANT: Structure the Findings section with **bold subheadings** for each anatomical region/structure evaluated. Format as:

**Localizer images:**
Plain text findings for this subsection (one statement per line, NOT bullet points).

**Spinal cord:**
The spinal cord terminates normally with no abnormal signal within.
No evidence of demyelination or cord expansion.
No intra or extradural abnormality.

**Bones and joints:**
Curvature and alignment appear normal.
No pars defect.
Small anterior osteophytes are noted, in keeping with degenerative changes.

**Visualized thoracic discs and disc levels:**
Appear unremarkable with normal canal and exit foramina.

**Lumbar discs and disc levels:**
L3-4 and L5-S1 discs appear dehydrated with mild bulges.
- At L3-4, there is flattening of the anterior margin of the thecal sac with mild impingement on the traversing L4 nerves.
- At L4-5, there is mild impingement on the exiting left L5 nerve.
- At L5-S1, there is moderate impingement on both traversing S1 nerves.

KEY FORMATTING RULES FOR FINDINGS:
1. Use **bold text with colon:** for each anatomical subsection heading
2. Use plain text (one statement per line) for findings - NOT bullet points
3. ONLY use bullet points (- ) for nested sub-items under a finding (e.g., disc level details)
4. If the template provides section structure, FOLLOW IT exactly
5. Match the template's subsection organization

## Impression
- Concise summary with one bullet point per key finding
- Keep each bullet to ONE sentence maximum
- No nested sub-bullets in Impression`;

    // Build user prompt with anti-hallucination reminder
    const userPrompt = `USER FINDINGS / DICTATION:
${findings}

⚠️ CRITICAL SOURCE OF TRUTH ⚠️
The text above is the ONLY source of findings. You MUST NOT report any abnormality, measurement, or specific detail that is not explicitly stated in the USER FINDINGS / DICTATION section above.

MANDATORY ANTI-HALLUCINATION CHECKLIST:
- Before reporting any abnormality, verify it was EXPLICITLY mentioned in USER FINDINGS / DICTATION
- Before adding any measurement or size, verify it was provided in user findings
- Before describing any specific characteristic, verify it was mentioned
- If unsure whether something was mentioned, err on the side of NOT including it
- Normal findings are acceptable for structures NOT mentioned in user findings

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
