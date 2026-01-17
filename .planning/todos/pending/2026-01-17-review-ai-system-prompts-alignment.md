---
created: 2026-01-17T17:10
title: Review and align AI system prompts with reference documentation
area: api
files:
  - app/app/api/generate/route.ts
  - app/app/api/transcribe/route.ts
  - app/app/api/templates/assist/route.ts
  - app/app/api/templates/validate/route.ts
  - app/lib/shared/report-builder.ts
  - app/lib/shared/template-converter.ts
  - app/lib/shared/template-structurer.ts
  - app/lib/shared/text/macro-expander.ts
  - app/lib/shared/text/postprocess.ts
---

## Problem

The AI processing and system prompts need to be reviewed and aligned with a working reference implementation. The current codebase may have different prompts than the proven-working version documented in the reference.

Key areas requiring review:
1. **Report Generation** (`/api/generate`) - Anti-hallucination rules, template syntax interpretation
2. **Template Assist** (`/api/templates/assist`) - Template creation prompts
3. **Template Conversion** - Note-to-template conversion with PHI redaction
4. **Template Structuring** - Freeform text improvement
5. **Transcription** - Whisper API (no prompt, raw audio)
6. **Post-processing** - Macro expansion, measurement normalization, medical term standardization

## Reference Documentation

A comprehensive reference document has been provided with all working prompts:

### Report Generation System Prompt (Temperature 0.2)
- Anti-hallucination rules (CRITICAL)
- Template syntax interpretation: `[placeholder]`, `(instruction)`, `"verbatim"`
- Section types: Regular, Heading-Only (empty content), Parent Heading (`Guidance:`)
- Contradiction prevention rules
- Normal findings integration logic
- JSON output schema

### Template Creation Prompts (Temperature 0.3)
- Template Assist: Generate templates from user requests
- Template Conversion: Convert clinical notes to templates with PHI redaction
- Template Structuring: Improve freeform text with proper syntax

### Post-Processing Pipeline
- Macro expansion with match modes: exact, word_boundary, contains
- Measurement normalization: `5mm` → `5 mm`
- Medical term capitalization: `ct` → `CT`, `mri` → `MRI`
- Sentence capitalization and punctuation

### Environment Variables
- `OPENAI_MODEL_GENERATE`: `gpt-4o-mini`
- `OPENAI_MODEL_WHISPER`: `whisper-1`

## Solution

1. Compare current prompts in codebase against reference documentation
2. Identify discrepancies in system prompts, temperature settings, model selections
3. Update prompts to match reference (be careful - these are working prompts)
4. Ensure anti-hallucination rules are present and complete
5. Verify template syntax handling matches reference
6. Test each endpoint after changes

**CAUTION**: The reference prompts are documented as working. Changes should align with reference, not deviate from it.

## Reference Document Location

The full reference documentation was provided in the todo creation command. Key files to cross-reference:
- `lib/shared/report-builder.ts` (lines 264-537) for report generation
- `lib/shared/template-converter.ts` for template conversion
- `lib/shared/template-structurer.ts` for template structuring
- `lib/shared/text/postprocess.ts` for normalization pipeline
