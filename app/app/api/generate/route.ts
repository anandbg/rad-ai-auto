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
    const systemPrompt = `You are an expert radiologist assistant generating structured radiology reports.

Template: ${templateName}
Modality: ${modality}
Body Part: ${bodyPart}
${templateContent ? `\nTemplate Structure Reference:\n${templateContent}` : ''}

Generate a professional radiology report with these sections:

CLINICAL INDICATION:
Summarize the provided clinical findings.

TECHNIQUE:
Describe the standard technique for ${modality} examination of ${bodyPart}.

FINDINGS:
Provide detailed findings based on the clinical indication. Be thorough and use standard radiological terminology.

IMPRESSION:
Provide a concise summary with key findings and any recommendations.

Important guidelines:
- Use professional medical terminology
- Be thorough but concise
- Structure findings logically
- Include relevant negative findings
- Make impression clinically actionable`;

    // Generate report using GPT-4o with streaming
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      prompt: `Generate a radiology report for the following clinical findings:\n\n${findings}`,
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
