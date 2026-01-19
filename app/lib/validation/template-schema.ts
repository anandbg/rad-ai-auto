import { z } from 'zod';

// Zod schema for template section validation
export const templateSectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Section name is required'),
  content: z.string(),
});

// Zod schema for template form validation
// This schema is used on BOTH client and server to ensure consistent validation
export const templateFormSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .min(3, 'Template name must be at least 3 characters')
    .max(100, 'Template name must be less than 100 characters')
    .refine(
      (val) => val.length === 0 || /^[a-zA-Z0-9\s\-_]+$/.test(val),
      'Template name can only contain letters, numbers, spaces, hyphens, and underscores'
    ),
  modality: z.string().min(1, 'Please select a modality'),
  bodyPart: z.string().min(1, 'Please select a body part'),
  description: z.string()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must be less than 500 characters'),
  content: z.string().max(10000, 'Template content must be less than 10,000 characters').optional(),
  sections: z.array(templateSectionSchema).optional(),
});

export type TemplateFormData = z.infer<typeof templateFormSchema>;
export type TemplateSection = z.infer<typeof templateSectionSchema>;

// Schema for AI template generation with descriptions for LLM guidance
export const aiGeneratedTemplateSchema = z.object({
  name: z.string()
    .min(3)
    .max(100)
    .describe('Template name based on modality and body part, e.g., "CT Chest with Contrast Protocol"'),
  modality: z.string()
    .describe('Imaging modality: X-Ray, CT, MRI, Ultrasound, PET, Mammography, Fluoroscopy, Nuclear Medicine, or Other'),
  bodyPart: z.string()
    .describe('Body region: Head, Neck, Chest, Abdomen, Pelvis, Spine, Upper Extremity, Lower Extremity, Whole Body, or Other'),
  description: z.string()
    .min(10)
    .max(500)
    .describe('When to use this template - clinical indications and scenarios'),
  sections: z.array(z.object({
    id: z.string().describe('Unique identifier, use format "section-1", "section-2", etc.'),
    name: z.string().describe('Section name in ALL CAPS, e.g., TECHNIQUE, COMPARISON, FINDINGS, IMPRESSION'),
    content: z.string().describe('Template content with [placeholders] for variable data and (instructions) for conditional guidance. Use radiology-specific language.')
  }))
    .min(3)
    .max(8)
    .describe('Ordered list of report sections. Include at minimum: TECHNIQUE, FINDINGS, IMPRESSION')
});

export type AIGeneratedTemplate = z.infer<typeof aiGeneratedTemplateSchema>;

// Helper function to format Zod errors into a user-friendly format
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  error.errors.forEach((err) => {
    const field = err.path[0] as string;
    errors[field] = err.message;
  });
  return errors;
}
