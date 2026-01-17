import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

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
 * Streams a GPT-4o generated radiology report based on clinical findings and template.
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

    // Build system prompt for radiology report generation
    // Aligned with .planning/reference/ai-prompts-reference.md Section 2
    const systemPrompt = `You are an expert radiologist with 20+ years of experience. Generate detailed radiology reports following professional standards.

Template: ${templateName}
Modality: ${modality}
Body Part: ${bodyPart}
${templateContent ? `\nTemplate Structure Reference:\n${templateContent}` : ''}

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
- Use proper Markdown formatting (## for headers, **bold** for emphasis, - or 1. for lists)
- Structure findings logically with sub-sections if needed (### for sub-headers)

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
- Write as experienced radiologist would dictate - flowing narrative, not separate lists
- Example: Template "No fracture" + User "C7 fracture" = "Fracture at C7 vertebra. No fracture at other levels."
- Example: User "L1-L2 normal" + Template "No disc herniation" = "L1-L2 disc space demonstrates normal height and signal. No disc herniation."

FORBIDDEN OUTPUT PATTERNS:
- Do NOT create sections or headings called "Pertinent Negatives" or any variation
- Do NOT use these forbidden headings: "Pertinent Negatives:", "Notable Negatives:", "Relevant Negatives:"
- Write findings as continuous narrative without subsections for negatives
- Ensure internal consistency - no contradictory statements

OUTPUT FORMAT:
Generate a professional radiology report using Markdown formatting with these sections:

## Clinical Indication
Summarize the provided clinical findings.

## Technique
Describe the standard technique for ${modality} examination of ${bodyPart}.

## Findings
Provide detailed findings based on the clinical indication. Be thorough and use standard radiological terminology.

## Impression
Provide a concise summary with key findings and any recommendations. Use a numbered list for multiple impressions.`;

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

    // Generate report using GPT-4o with streaming
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.2, // Low temperature for deterministic, consistent medical reports
      maxOutputTokens: 2000,
    });

    // Return streaming response
    return result.toTextStreamResponse();

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
