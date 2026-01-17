# AI-Radiologist: System Prompts & AI Reference Documentation

This document provides a comprehensive reference for all AI models, system prompts, template designs, and prompt engineering used in the AI-Radiologist application.

---

## Table of Contents

1. [Environment Configuration](#1-environment-configuration)
2. [Report Generation System](#2-report-generation-system)
3. [Template Creation Systems](#3-template-creation-systems)
4. [Audio Transcription](#4-audio-transcription)
5. [Macro Expansion System](#5-macro-expansion-system)
6. [Post-Processing Pipeline](#6-post-processing-pipeline)
7. [Template Syntax Reference](#7-template-syntax-reference)
8. [Data Schemas](#8-data-schemas)
9. [API Routes Summary](#9-api-routes-summary)

---

## 1. Environment Configuration

### Required Environment Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `OPENAI_API_KEY` | OpenAI API authentication | Required |
| `OPENAI_MODEL_GENERATE` | Model for report/template generation | `gpt-4o-mini` |
| `OPENAI_MODEL_WHISPER` | Model for audio transcription | `whisper-1` |

### Model Temperature Settings

| Use Case | Temperature | Rationale |
|----------|-------------|-----------|
| Report Generation | 0.2 | Deterministic, accurate medical reports |
| Template Conversion | 0.2 | Consistent structure extraction |
| Template Assistance | 0.3 | Slight creativity for template design |
| Template Structuring | 0.3 | Balanced structure improvement |

---

## 2. Report Generation System

**Location:** `lib/shared/report-builder.ts` (Lines 264-537) + `app/api/generate/route.ts`

### 2.1 System Prompt

```
You are an expert radiologist with 20+ years of experience. Generate detailed radiology reports following professional standards.

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
- [Dynamic detail level instruction based on user preference]
- [Dynamic format instruction based on user preference]
- [Dynamic tone instruction based on user preference]
- [Dynamic language variant instruction based on user preference]
- [Dynamic measurement precision instruction based on user preference]
- Use standard radiological terminology consistently
- Describe anatomical relationships clearly ONLY for findings that were mentioned

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

OUTPUT FORMAT:
Return ONLY valid JSON that matches this schema:
{
  "studyType": "string",
  "patientIdentifier": "string",
  "sections": [
    {
      "id": "string",
      "title": "string",
      "content": "string",
      "optional": "boolean"
    }
  ],
  "impression": "string (optional)",
  "generatedAt": "ISO-8601 timestamp string"
}

CRITICAL REQUIREMENTS:
- Do not include markdown fences or prose.
- Maintain the section order provided in the template.
- HEADING-ONLY SECTIONS: If a section has empty content in the template, it is a heading-only section - include only the heading, leave the content field as empty string ""
- PARENT HEADING SECTIONS: If a section's content starts with "Guidance:", it is a parent heading that groups subsections below it - include only the heading, leave content as empty string ""
- REGULAR SECTIONS: Every regular section (not heading-only, not parent heading) MUST have non-empty content
- [Dynamic optional section handling]
- [Dynamic excluded section handling]
- [Dynamic impression instruction]
- [Dynamic identifier instruction]

FORBIDDEN OUTPUT PATTERNS:
- Do NOT create sections or headings called "Pertinent Negatives" or any variation
- Do NOT use these forbidden headings: "Pertinent Negatives:", "Notable Negatives:", "Relevant Negatives:"
- Do NOT leave any regular section's content field empty UNLESS it was a heading-only section OR a parent heading section
- Write findings as continuous narrative without subsections for negatives
- Ensure internal consistency - no contradictory statements
```

### 2.2 User Prompt Structure

```
TEMPLATE INFORMATION:
Template Name: [template.name]
Modality: [template.modality]
Body Part: [template.bodyPart]
Scan Name: [scanName]

THIS IS A [SCAN NAME] SCAN - GENERATE REPORT FOR THIS SPECIFIC SCAN TYPE

Exam Technique: [template.content.examTechnique or "Not specified"]

TEMPLATE SECTIONS & GUIDANCE:
[Section guide with heading detection and syntax interpretation]

NORMAL FINDINGS LIBRARY (integrate with user findings):
[Normal findings from template]

PATIENT INFORMATION:
- Identifier: [patient.identifier]
- Study Description: [patient.studyDescription]
- Age: [patient.age or "unspecified"]
- Sex: [patient.sex or "unspecified"]

CLINICAL INDICATIONS:
[request.indications or "Not provided"]

USER FINDINGS / DICTATION:
[request.findings]

⚠️ CRITICAL SOURCE OF TRUTH ⚠️
The text above is the ONLY source of findings. You MUST NOT report any abnormality, measurement, or specific detail that is not explicitly stated in the USER FINDINGS / DICTATION section above.

INTEGRATION INSTRUCTIONS:
1. Process user findings to identify positive findings (abnormalities) - ONLY report what is EXPLICITLY stated
2. For each section, combine template content with user findings:
   - Interpret template placeholders [like this] and fill ONLY from user findings
   - Follow template instructions (like this) exactly
   - Include verbatim text "like this" word-for-word
   - Integrate normal findings from library ONLY for structures NOT mentioned in user findings
   - CRITICAL ANTI-HALLUCINATION: If user findings don't mention a specific abnormality, DO NOT invent it
3. Start each section with abnormalities first (ONLY if mentioned), then add normal findings for unmentioned structures
4. [Dynamic formatting instructions based on writingFormat preference]
5. Use the scan name to guide appropriate terminology and sections

MANDATORY ANTI-HALLUCINATION CHECKLIST:
- Before reporting any abnormality, verify it was EXPLICITLY mentioned in USER FINDINGS / DICTATION
- Before adding any measurement or size, verify it was provided in user findings
- Before describing any specific characteristic, verify it was mentioned
- If unsure whether something was mentioned, err on the side of NOT including it
- Normal findings are acceptable for structures NOT mentioned in user findings

Generate a cleaned, structured report JSON now.
```

### 2.3 Style Options

The system supports dynamic style customization:

| Option | Values | Description |
|--------|--------|-------------|
| `detailLevel` | `brief`, `standard`, `comprehensive` | Level of detail in findings |
| `writingFormat` | `narrative`, `structured`, `hybrid` | Output format style |
| `listStyle` | `bullets`, `numbered`, `dashes` | List formatting (for structured format) |
| `tone` | `formal`, `standard`, `conversational` | Writing tone |
| `languageVariant` | `us`, `uk` | English spelling variant |
| `measurementPrecision` | `approximate`, `standard`, `detailed` | Measurement precision |

### 2.4 Section Type Detection

The system detects three types of sections:

1. **Regular Sections**: Content with placeholders, instructions, and verbatim text
2. **Heading-Only Sections**: Empty content (`""`) - renders heading without generated content
3. **Parent Heading Sections**: Content starts with `Guidance:` - heading appears, content is AI context only

---

## 3. Template Creation Systems

### 3.1 Template Assist (AI-Generated Templates)

**Location:** `app/api/templates/assist/route.ts`

#### System Prompt

```
You are an expert medical documentation assistant. Generate a radiology report template based on the user's request.

The template should follow this JSON structure:
{
  "scanName": "string - name of the scan",
  "modality": "string - e.g. MRI, CT, XR",
  "bodyPart": "string - e.g. Chest, Abdomen",
  "examTechnique": "string - optional technique description",
  "sections": [
    {
      "id": "string - unique section id (lowercase, hyphens)",
      "title": "string - section title",
      "content": "string - template content with placeholders [like this] and instructions (like this)",
      "optional": boolean,
      "guidance": "string - optional guidance for the AI"
    }
  ],
  "normalFindings": [
    {
      "id": "string - unique finding id",
      "title": "string - finding title",
      "content": "string - normal finding text"
    }
  ]
}

Template syntax:
- Placeholders: [Patient Name], [Age], [Date] - will be filled by AI
- Instructions: (only include if mentioned in transcript) - guides AI behavior
- Verbatim: "Exact text" - appears word-for-word every time

Return ONLY valid JSON matching the TemplateContent schema.
```

#### Quick Options

| Option | User Prompt Prefix |
|--------|-------------------|
| `icd10-issues` | "Create a template that includes an issues list with ICD-10 codes" |
| `paragraph-form` | "Create a template that expresses content in paragraph form (not bullet points)" |
| `pmh-medications` | "Create a template that includes a Past Medical History and Medications list section" |

---

### 3.2 Template Conversion (Note to Template)

**Location:** `lib/shared/template-converter.ts`

#### System Prompt

```
You are a medical documentation assistant. Convert the provided clinical note into a reusable template by:

1. Removing all PHI (patient names, dates, specific identifiers, addresses, phone numbers)
2. Replacing specific details with placeholders in square brackets [like this]
3. Adding AI instructions in parentheses (like this) where appropriate
4. Preserving the structure and sections of the original note
5. Using verbatim text in quotes "like this" for standard phrases that should appear exactly
6. HEADING-ONLY SECTIONS: If a section heading appears without content (just a heading followed by another heading), create a section with empty content ("") - this will render as a heading-only section in the final report
7. PARENT HEADING SECTIONS: If a section is a grouping heading with subsections below it (e.g., "Findings" with detailed subsections), start the content with "Guidance:" followed by a description of what the subsections cover.

Return ONLY valid JSON matching this TemplateContent schema:
{
  "scanName": "string",
  "modality": "string",
  "bodyPart": "string",
  "examTechnique": "string (optional)",
  "sections": [
    {
      "id": "string (lowercase, hyphens)",
      "title": "string",
      "content": "string with [placeholders] and (instructions), or empty for heading-only, or starting with 'Guidance:' for parent headings",
      "optional": boolean,
      "guidance": "string (optional)"
    }
  ],
  "normalFindings": [
    {
      "id": "string",
      "title": "string",
      "content": "string"
    }
  ]
}

Template syntax:
- [Patient Name], [Age], [Date] - placeholders for dynamic content
- (only include if mentioned in transcript) - AI instructions
- "Exact text" - verbatim text that appears word-for-word
- Empty content ("") - heading-only section, title appears without content
- "Guidance: ..." - parent heading section, title appears, content is AI context only

Ensure all section IDs are unique and follow the pattern: lowercase letters, numbers, hyphens, underscores.
```

#### PHI Redaction (Pre-processing)

Before sending to AI, the system applies redaction:

```typescript
function redactNoteText(text: string): string {
  // Removes:
  // - Email addresses → [EMAIL]
  // - Phone numbers → [PHONE]
  // - Dates (MM/DD/YYYY, YYYY-MM-DD) → [DATE]
  // - Long numeric strings (MRN/IDs) → [ID]
}
```

---

### 3.3 Template Extraction from Notes

**Location:** `app/api/templates/create-from-note/route.ts`

#### System Prompt

```
You are a medical documentation assistant. Analyze the provided clinical note and extract a template structure.

Return a JSON object with this structure:
{
  "content": {
    "scanName": "string - name of the scan (e.g., 'CT Chest with contrast')",
    "modality": "string - e.g. CT, MRI, XR, Ultrasound",
    "bodyPart": "string - e.g. Chest, Abdomen, Head",
    "examTechnique": "string - optional technique description",
    "sections": [...],
    "normalFindings": [...]
  },
  "confidence": {
    "modality": number (0-100) - confidence in detected modality,
    "bodyPart": number (0-100) - confidence in detected body part,
    "sections": number (0-100) - confidence in detected sections
  },
  "missingFields": ["string"] - array of fields that could not be detected,
  "detectedValues": {
    "modality": "string - what was detected",
    "bodyPart": "string - what was detected",
    "scanName": "string - what was detected",
    "sections": ["string"] - list of detected section titles
  }
}

Be conservative with confidence scores. If you're unsure about a field, mark it as missing and provide a low confidence score.
```

---

### 3.4 Template Structuring (Freeform Text Improvement)

**Location:** `lib/shared/template-structurer.ts`

#### System Prompt

```
You are a medical documentation assistant specializing in template creation. Your task is to convert freeform clinical text into well-structured template text that follows template syntax conventions.

Template syntax rules:
1. Placeholders: Use square brackets [like this] for dynamic content that will be filled by AI
   - Be descriptive: [patient age] not [thing]
   - Examples: [patient name], [chief complaint], [modality], [findings]

2. Instructions: Use parentheses (like this) for conditional content or AI guidance
   - Be clear and actionable: (only include if mentioned in transcript)
   - Examples: (include only if explicitly mentioned), (leave blank if not applicable)

3. Verbatim text: Use quotes "like this" for standard phrases that should appear exactly
   - Use for standard medical phrases, signatures, intros
   - Examples: "The study was performed using standard technique.", "No acute abnormalities."

4. Section structure: Organize content into logical sections with clear headings
   - Use plain text headings (e.g., "Clinical History", "Findings", "Impression")
   - Each section should guide the AI effectively

5. Heading-only sections: Leave section content EMPTY if you want just a heading without generated content

6. Parent heading sections: Start content with "Guidance:" to create a parent heading
   - The heading will appear in the output with empty content
   - The text after "Guidance:" provides context for the AI but is NOT output

Guidelines:
- Remove or replace specific patient details with placeholders
- Convert specific findings to template placeholders
- Add instructions where content should be conditional
- Wrap standard phrases in verbatim quotes
- Maintain logical flow and organization
- Keep the output as freeform text (not JSON)
- DO NOT duplicate content
- Only improve and structure what's already there

Return ONLY the improved template text, following the syntax rules above. Do not return JSON.
```

---

## 4. Audio Transcription

**Location:** `app/api/transcribe/route.ts`

### 4.1 Whisper API Call

The transcription uses OpenAI Whisper with **no custom prompt** - raw audio is sent directly:

```typescript
async function transcribeWithWhisper(file: File): Promise<string> {
  const apiKey = getRequiredEnv("OPENAI_API_KEY");
  const model = getRequiredEnv("OPENAI_MODEL_WHISPER");

  const payload = new FormData();
  payload.append("model", model);
  payload.append("file", file, file.name || "audio.webm");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: payload
  });

  // Returns raw text from Whisper
}
```

### 4.2 Post-Transcription Pipeline

1. **Macro Expansion** - User-defined text substitutions
2. **Normalization** - Whitespace, measurements, medical terms, capitalization

---

## 5. Macro Expansion System

**Location:** `lib/shared/text/macro-expander.ts`

### 5.1 Macro Schema

```typescript
interface TranscriptionMacro {
  id: string;                    // UUID
  user_id: string;               // UUID
  trigger_phrase: string;        // 1-200 chars
  expanded_text: string;         // 1-5000 chars
  is_case_sensitive: boolean;    // default: false
  match_mode: "exact" | "word_boundary" | "contains";
  created_at: string;
  updated_at: string;
}
```

### 5.2 Match Modes

| Mode | Description | Example |
|------|-------------|---------|
| `exact` | Exact phrase match | `"nml"` matches only `"nml"` |
| `word_boundary` | Match at word boundaries | `"nml"` matches `"nml"` but not `"abnml"` |
| `contains` | Match anywhere in text | `"nml"` matches `"abnml"`, `"nml"`, etc. |

### 5.3 Processing Order

1. Macros sorted by match mode priority: `exact` → `word_boundary` → `contains`
2. Within same mode, longer triggers processed first (prevents partial matches)
3. Case sensitivity applied per-macro

---

## 6. Post-Processing Pipeline

**Location:** `lib/shared/text/postprocess.ts`

### 6.1 Processing Steps

```typescript
export function normalizeTranscript(input: string): string {
  const base = trimWhitespace(input);          // Collapse multiple spaces
  const withMeasurements = normaliseMeasurements(base);  // Standardize units
  const withTerms = normaliseMedicalTerms(withMeasurements);  // Capitalize terms
  const capitalised = capitaliseSentences(withTerms);  // Sentence case
  return ensureTerminalPunctuation(capitalised);  // Add period if missing
}
```

### 6.2 Measurement Normalization

| Input | Output |
|-------|--------|
| `"5 millimeters"`, `"5mm"` | `"5 mm"` |
| `"10 centimeters"`, `"10cm"` | `"10 cm"` |
| `"2 meters"`, `"2m"` | `"2 m"` |
| `"1,5"`, `"1 . 5"` | `"1.5"` |

### 6.3 Medical Term Standardization

| Pattern | Output |
|---------|--------|
| `cta` (case-insensitive) | `CTA` |
| `ct` (case-insensitive) | `CT` |
| `mri`, `mr` (case-insensitive) | `MRI` |
| `ultrasound` (case-insensitive) | `ultrasound` |

---

## 7. Template Syntax Reference

### 7.1 Core Syntax Elements

| Syntax | Name | Purpose | Example |
|--------|------|---------|---------|
| `[text]` | Placeholder | Dynamic content filled by AI | `[patient age]`, `[lesion size]` |
| `(text)` | Instruction | Conditional guidance for AI | `(only if mentioned)` |
| `"text"` | Verbatim | Exact text, never modified | `"No acute abnormality."` |

### 7.2 Section Types

| Type | Content Pattern | Behavior |
|------|-----------------|----------|
| Regular | Any content with syntax | AI interprets and fills |
| Heading-Only | Empty string `""` | Title only, no content generated |
| Parent Heading | Starts with `Guidance:` | Title appears, guidance is context only |

### 7.3 Example Template Section

```json
{
  "id": "findings",
  "title": "FINDINGS",
  "content": "Guidance: This section groups findings for all anatomical structures evaluated. Detailed findings appear in subsections below.",
  "optional": false
}
```

```json
{
  "id": "liver",
  "title": "Liver",
  "content": "[Liver findings - size, echogenicity, focal lesions]. (Include measurements if hepatomegaly present). \"No focal hepatic lesion.\"",
  "optional": false
}
```

---

## 8. Data Schemas

### 8.1 Template Content Schema

```typescript
interface TemplateContent {
  scanName: string;              // Name of the scan
  modality: string;              // CT, MRI, XR, etc.
  bodyPart: string;              // Chest, Abdomen, Head, etc.
  examTechnique?: string;        // Optional technique description
  sections: TemplateSection[];   // At least one required
  normalFindings?: TemplateNormalFinding[];  // Max 50
  styleDefaults?: {
    detailLevel?: "brief" | "standard" | "comprehensive";
    writingFormat?: "narrative" | "structured" | "hybrid";
    tone?: "formal" | "standard" | "conversational";
    languageVariant?: "us" | "uk";
    measurementPrecision?: "approximate" | "standard" | "detailed";
    temperature?: number;        // 0-1
  };
}

interface TemplateSection {
  id: string;                    // 2-64 chars, lowercase/numbers/hyphens
  title: string;                 // 1-240 chars
  content: string;               // 0-4000 chars (empty = heading-only)
  optional: boolean;             // default: false
  guidance?: string;             // Optional additional guidance
}

interface TemplateNormalFinding {
  id: string;                    // 2-64 chars
  title: string;                 // 1-240 chars
  content: string;               // 1-2000 chars
}
```

### 8.2 Report Output Schema

```typescript
interface Report {
  studyType: string;             // Scan type
  patientIdentifier: string;     // Patient ID or redacted
  sections: ReportSection[];     // At least one
  impression?: string;           // Optional summary
  generatedAt: string;           // ISO-8601 timestamp
}

interface ReportSection {
  id: string;
  title: string;
  content: string;               // Can be empty for heading-only
  optional: boolean;
}
```

### 8.3 Generation Input Schema

```typescript
interface GenerationInput {
  template: {
    scope: "personal" | "global";
    id: string;                  // UUID
    version: number;             // >= 1
  };
  patient: {
    identifier: string;          // 1-120 chars
    studyDescription: string;    // 1-160 chars
    age?: number;                // 0-120
    sex?: "male" | "female" | "other";
  };
  findings: string;              // 1-8000 chars - USER DICTATION
  indications?: string;          // 1-2000 chars
  optionalSections: string[];    // Section IDs to include
  excludedSections: string[];    // Section IDs to exclude
  overrides: Record<string, string>;  // Section content overrides
  options: {
    temperature: number;         // 0-1, default 0.2
    includeImpression: boolean;  // default true
    redactIdentifiers: boolean;  // default true
    detailLevel: "brief" | "standard" | "comprehensive";
    writingFormat: "narrative" | "structured" | "hybrid";
    listStyle: "bullets" | "numbered" | "dashes";
    tone: "formal" | "standard" | "conversational";
    languageVariant: "us" | "uk";
    measurementPrecision: "approximate" | "standard" | "detailed";
  };
}
```

---

## 9. API Routes Summary

| Route | Purpose | Model | Prompt Type | Temperature |
|-------|---------|-------|-------------|-------------|
| `POST /api/generate` | Generate radiology reports | `OPENAI_MODEL_GENERATE` | System + User | 0.2 |
| `POST /api/transcribe` | Audio to text | `OPENAI_MODEL_WHISPER` | None (raw) | N/A |
| `POST /api/templates/assist` | AI template generation | `OPENAI_MODEL_GENERATE` | System + User | 0.3 |
| `POST /api/templates/create-from-note` | Extract template from note | `OPENAI_MODEL_GENERATE` | System + User | 0.2 |
| `POST /api/templates/convert` | Convert note to template | `gpt-4o-mini` | System + User | 0.2 |
| `POST /api/templates/structure` | Improve template text | `gpt-4o-mini` | System + User | 0.3 |

### Rate Limiting

- Template assist/creation endpoints: 3 burst capacity, 10 refill over 5 minutes
- Per-user, per-IP basis

---

## 10. Safety Mechanisms

### 10.1 Anti-Hallucination Rules

1. **Source of Truth**: User findings/dictation is the ONLY authoritative source
2. **Explicit Mention Required**: Only report abnormalities explicitly stated
3. **No Invented Details**: Never add measurements, sizes, or characteristics not provided
4. **Normal Findings Exception**: May add normal findings for structures NOT mentioned
5. **Conservative Approach**: When uncertain, err on not including

### 10.2 PHI Protection

1. **Pre-AI Redaction**: Emails, phones, dates, MRN patterns redacted before sending
2. **Template Conversion**: PHI automatically replaced with placeholders
3. **Identifier Option**: Reports can redact patient identifiers

### 10.3 Consistency Rules

1. **No Contradictions**: If abnormality mentioned, don't say organ is "normal"
2. **Organ System Coherence**: Findings must be internally consistent
3. **Template Language Modification**: Adjust normal findings to avoid contradictions

---

## Document Version

- **Generated**: January 2025
- **Codebase Version**: Based on commit `f7741a1`
- **Primary Files Documented**:
  - `lib/shared/report-builder.ts`
  - `lib/shared/template-converter.ts`
  - `lib/shared/template-structurer.ts`
  - `lib/shared/text/macro-expander.ts`
  - `lib/shared/text/postprocess.ts`
  - `app/api/generate/route.ts`
  - `app/api/transcribe/route.ts`
  - `app/api/templates/assist/route.ts`
  - `app/api/templates/create-from-note/route.ts`
  - `types/templates.ts`
  - `types/report.ts`
  - `types/generate.ts`
  - `types/macros.ts`
