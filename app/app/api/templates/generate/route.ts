import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { aiGeneratedTemplateSchema } from '@/lib/validation/template-schema';

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

    const { description, modality, bodyPart } = body;

    // Validate required fields
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

    // Build system prompt with template syntax guidance
    const systemPrompt = `You are a radiology report template expert. Create structured templates for radiologists.

${TEMPLATE_SYNTAX_GUIDANCE}

Consider the standard structure for the modality and include all essential sections.`;

    // Build user prompt
    const userPrompt = `Create a radiology report template for ${modality || 'the specified'} imaging of ${bodyPart || 'the specified body part'}.

User requirements: ${description}

Generate a professional template with appropriate sections for this exam type.`;

    // Generate template using GPT-4o with structured output
    const result = await generateText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: userPrompt,
      output: Output.object({ schema: aiGeneratedTemplateSchema }),
      temperature: 0.3, // Deterministic output for consistency
    });

    // Extract the validated output
    const output = result.output;

    // Return the validated template
    return new Response(
      JSON.stringify({
        success: true,
        data: output,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

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
