import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Edge runtime for low-latency streaming
export const runtime = 'edge';

// 30 second timeout for suggestion generation
export const maxDuration = 30;

// Request body schema
const suggestRequestSchema = z.object({
  modality: z.string().min(1, 'Modality is required'),
  bodyPart: z.string().min(1, 'Body part is required'),
  description: z.string().optional(),
  existingSections: z.array(z.object({
    name: z.string(),
    content: z.string(),
  })).optional(),
  requestType: z.enum(['sections', 'improvements', 'normalFindings']),
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
 * Build system prompt based on request type
 */
function buildSystemPrompt(
  requestType: 'sections' | 'improvements' | 'normalFindings',
  modality: string,
  bodyPart: string,
  description?: string,
  existingSections?: Array<{ name: string; content: string }>
): string {
  const baseContext = `You are an expert radiology template specialist with extensive experience in ${modality} imaging of the ${bodyPart}.
${description ? `\nTemplate context: ${description}` : ''}`;

  switch (requestType) {
    case 'sections':
      return `${baseContext}

Your task is to suggest 3-5 standard sections for a radiology report template.

For each section, provide:
1. The section name (in ALL CAPS, e.g., FINDINGS, IMPRESSION)
2. A brief description of what should go in this section
3. Example placeholder content that can be customized

Format your response as follows:
## [SECTION NAME]
**Purpose:** [Brief description]
**Example content:**
[Example template text with placeholders like {{FINDING}}, {{MEASUREMENT}}, etc.]

Consider the standard structure for ${modality} ${bodyPart} reports and include all essential sections.`;

    case 'improvements':
      const sectionsText = existingSections?.map(s =>
        `### ${s.name}\n${s.content || '(empty)'}`
      ).join('\n\n') || 'No sections provided';

      return `${baseContext}

Your task is to analyze the existing template sections and suggest improvements.

**Existing Sections:**
${sectionsText}

For each section, consider:
1. Is the section name clear and standard?
2. Is the content comprehensive for ${modality} ${bodyPart}?
3. Are there missing elements that should be included?
4. Could the structure or wording be improved?

Provide specific, actionable suggestions for improving each section. If a section is well-structured, acknowledge that and suggest minor enhancements if applicable.

Format your response with clear headings for each section's improvements.`;

    case 'normalFindings':
      return `${baseContext}

Your task is to provide standard "normal findings" text for a ${modality} examination of the ${bodyPart}.

This text should:
1. Be comprehensive, covering all standard anatomical structures
2. Use proper radiological terminology
3. Be suitable for studies with no significant abnormalities
4. Be organized in a logical anatomical order
5. Be concise yet thorough

Provide the normal findings text that a radiologist can use as a quick-insert for normal studies.`;

    default:
      return baseContext;
  }
}

/**
 * POST /api/templates/suggest
 *
 * Streams GPT-4o generated suggestions for template creation/improvement.
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

    const validation = suggestRequestSchema.safeParse(body);

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

    const { modality, bodyPart, description, existingSections, requestType } = validation.data;

    // Transform existingSections to ensure proper typing
    const sections = existingSections?.map(s => ({
      name: s.name,
      content: s.content,
    }));

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

    // Build system prompt based on request type
    const systemPrompt = buildSystemPrompt(
      requestType,
      modality,
      bodyPart,
      description,
      sections
    );

    // Build user prompt
    const userPrompt = requestType === 'sections'
      ? `Please suggest standard sections for a ${modality} ${bodyPart} radiology report template.`
      : requestType === 'improvements'
      ? `Please analyze the existing template sections and suggest improvements for ${modality} ${bodyPart}.`
      : `Please provide standard normal findings text for a ${modality} examination of the ${bodyPart}.`;

    // Generate suggestions using GPT-4o with streaming
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.3, // Slightly higher than reports for creativity in suggestions
      maxOutputTokens: 2000,
    });

    // Return streaming response
    return result.toTextStreamResponse();

  } catch (error) {
    // Log detailed error server-side
    console.error('Error in POST /api/templates/suggest:', error);

    // Return generic error to client
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Internal Server Error',
        message: 'An error occurred while generating suggestions. Please try again.',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
