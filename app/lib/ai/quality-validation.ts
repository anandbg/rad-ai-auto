/**
 * Quality validation functions for AI-generated radiology reports.
 *
 * **What the 25 fixtures represent:**
 * 5 modality groups x 5 cases each: MRI brain, CT chest, X-ray chest,
 * ultrasound abdomen, and mixed/edge cases. Each fixture provides input
 * findings, expected section structure, expected subheadings, and key
 * medical concepts for hallucination detection.
 *
 * **How to run live validation (when GROQ_API_KEY is available):**
 * 1. Load fixtures via loadAllFixtures() from ./test-fixtures
 * 2. For each fixture, call the generate API or construct prompt + call Groq directly
 * 3. Pass each response through runFullValidation(report, fixture)
 * 4. Use runBatchValidation() for aggregate statistics
 *
 * **Pass/fail thresholds:**
 * - Structure compliance: 100% (all 5 sections present in every report)
 * - Anti-hallucination: 100% clean (no suspected hallucinations)
 * - Template/subheading adherence: >95% of expected subheadings found
 * - Impression format: informational (does not block overall pass)
 *
 * **Abort criteria:**
 * If anti-hallucination drops below 95% across the batch, abort the migration
 * and revert to OpenAI GPT-4o (set AI_GENERATE_MODEL=openai:gpt-4o).
 *
 * Validates report output against test fixture expectations for:
 * - Structural compliance (all 5 required sections present)
 * - Subheading/template adherence (bold subsection headings match expected)
 * - Anti-hallucination (no findings added beyond input)
 * - Impression format (bullet points)
 *
 * All functions are pure with no side effects or I/O.
 */

import type { TestFixture } from './test-fixtures';

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface StructureResult {
  /** Whether all required sections are present */
  valid: boolean;
  /** Sections that were expected but not found */
  missingSections: string[];
  /** Sections that were found in the report */
  foundSections: string[];
}

export interface SubheadingResult {
  /** Percentage of expected subheadings found (0-100) */
  adherencePercent: number;
  /** Expected subheadings not found in the report */
  missing: string[];
  /** Expected subheadings that were found */
  found: string[];
  /** Subheadings in the report not in the expected list */
  extra: string[];
}

export interface HallucinationResult {
  /** Whether the report is free of suspected hallucinations */
  clean: boolean;
  /** Statements flagged as potential hallucinations */
  suspectedHallucinations: string[];
  /** Input concepts that were covered in the report */
  conceptsCovered: string[];
}

export interface FormatResult {
  /** Whether the Impression section uses proper bullet format */
  valid: boolean;
  /** Number of bullet points found */
  bulletCount: number;
  /** Lines in Impression that are not bullets (excluding empty lines) */
  nonBulletLines: string[];
}

export interface ValidationReport {
  /** Overall pass/fail (all checks must pass) */
  pass: boolean;
  /** Per-check results */
  structure: StructureResult;
  subheadings: SubheadingResult;
  hallucination: HallucinationResult;
  impressionFormat: FormatResult;
}

// ---------------------------------------------------------------------------
// Required sections (## headings)
// ---------------------------------------------------------------------------

const REQUIRED_SECTIONS = [
  'Clinical Information',
  'Technique',
  'Comparison',
  'Findings',
  'Impression',
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract all ## section headings from a report.
 */
function extractSections(report: string): string[] {
  const pattern = /^##\s+(.+)$/gm;
  const sections: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(report)) !== null) {
    sections.push(match[1].trim());
  }
  return sections;
}

/**
 * Extract the content of a named ## section from the report.
 * Returns the text between the section heading and the next ## heading (or EOF).
 */
function extractSectionContent(report: string, sectionName: string): string {
  const escapedName = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `^##\\s+${escapedName}\\s*$([\\s\\S]*?)(?=^##\\s|$(?!\\s))`,
    'gm'
  );
  const match = pattern.exec(report);
  return match ? match[1].trim() : '';
}

/**
 * Extract all bold-colon patterns from a string (subheadings).
 */
function extractBoldSubheadings(text: string): string[] {
  const pattern = /\*\*([^*]+?):\*\*/g;
  const subheadings: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    subheadings.push(`${match[1].trim()}:`);
  }
  return subheadings;
}

/**
 * Check if a line describes an abnormal finding (not a normal/negative statement).
 */
function isAbnormalStatement(line: string): boolean {
  const normalPatterns = [
    /\bnormal\b/i,
    /\bunremarkable\b/i,
    /\bno\s+(evidence|abnormal|acute|focal|significant)/i,
    /\bwithout\b/i,
    /\bpreserved\b/i,
    /\bwithin\s+normal\s+limits\b/i,
    /\bappears?\s+normal\b/i,
    /\bis\s+normal\b/i,
    /\bare\s+normal\b/i,
    /\bclear\b/i,
    /\bpatent\b/i,
    /\bintact\b/i,
    /\bnot?\s+identified\b/i,
    /\bnegative\b/i,
  ];
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('##') || trimmed.startsWith('**')) {
    return false;
  }
  return !normalPatterns.some((p) => p.test(trimmed));
}

/**
 * Extract specific measurements (e.g. "2.3 cm", "15 mm", "4 x 3 cm") from text.
 */
function extractMeasurements(text: string): string[] {
  const pattern = /\d+\.?\d*\s*(?:x\s*\d+\.?\d*\s*(?:x\s*\d+\.?\d*\s*)?)?(?:cm|mm|mL|cc)\b/gi;
  const matches = text.match(pattern);
  return matches ? matches.map((m) => m.trim().toLowerCase()) : [];
}

// ---------------------------------------------------------------------------
// Validation functions
// ---------------------------------------------------------------------------

/**
 * Validate that all 5 required sections exist as ## headings in the report.
 *
 * Pass threshold: 100% -- all sections must be present.
 *
 * @param report - The full report text in Markdown format
 * @returns Structure validation result
 */
export function validateReportStructure(report: string): StructureResult {
  const found = extractSections(report);
  const foundLower = found.map((s) => s.toLowerCase());
  const missingSections: string[] = [];
  const foundSections: string[] = [];

  for (const section of REQUIRED_SECTIONS) {
    if (foundLower.includes(section.toLowerCase())) {
      foundSections.push(section);
    } else {
      missingSections.push(section);
    }
  }

  return {
    valid: missingSections.length === 0,
    missingSections,
    foundSections,
  };
}

/**
 * Validate that the Findings section contains the expected bold subheadings.
 *
 * Extracts bold-colon patterns from the Findings section and compares
 * against the expected subheadings from the fixture.
 *
 * Pass threshold: >95% adherence (at least 95% of expected subheadings found).
 *
 * @param report - The full report text in Markdown format
 * @param expectedSubheadings - Array of expected subheading strings (e.g. "Brain parenchyma:")
 * @returns Subheading adherence result
 */
export function validateSubheadings(
  report: string,
  expectedSubheadings: string[]
): SubheadingResult {
  const findingsContent = extractSectionContent(report, 'Findings');
  const foundRaw = extractBoldSubheadings(findingsContent);
  const foundLower = foundRaw.map((s) => s.toLowerCase());
  const expectedLower = expectedSubheadings.map((s) => s.toLowerCase());

  const found: string[] = [];
  const missing: string[] = [];

  for (const expected of expectedSubheadings) {
    if (foundLower.includes(expected.toLowerCase())) {
      found.push(expected);
    } else {
      missing.push(expected);
    }
  }

  const extra = foundRaw.filter(
    (s) => !expectedLower.includes(s.toLowerCase())
  );

  const adherencePercent =
    expectedSubheadings.length === 0
      ? 100
      : Math.round((found.length / expectedSubheadings.length) * 100);

  return { adherencePercent, missing, found, extra };
}

/**
 * Validate that the report does not hallucinate findings beyond the input.
 *
 * Heuristic approach:
 * 1. Extract abnormal statements from the Findings section.
 * 2. Check that each abnormal statement references at least one input concept.
 * 3. Flag specific measurements in the report that do not appear in the input findings.
 *
 * Pass threshold: 100% clean -- no suspected hallucinations.
 *
 * @param report - The full report text in Markdown format
 * @param inputConcepts - Key medical concepts from the input findings
 * @param findings - The original input findings text
 * @returns Hallucination check result
 */
export function validateAntiHallucination(
  report: string,
  inputConcepts: string[],
  findings: string
): HallucinationResult {
  const findingsContent = extractSectionContent(report, 'Findings');
  const lines = findingsContent.split('\n').filter((l) => l.trim());
  const suspected: string[] = [];
  const covered: Set<string> = new Set();

  const conceptsLower = inputConcepts.map((c) => c.toLowerCase());
  const findingsLower = findings.toLowerCase();

  // Check each abnormal line references at least one input concept
  for (const line of lines) {
    if (!isAbnormalStatement(line)) continue;

    const lineLower = line.toLowerCase().trim();
    const matchesConcept = conceptsLower.some((concept) => {
      // Check if any word from the concept appears in the line
      const words = concept.split(/\s+/).filter((w) => w.length > 2);
      const matched = words.some((word) => lineLower.includes(word.toLowerCase()));
      if (matched) covered.add(concept);
      return matched;
    });

    if (!matchesConcept) {
      suspected.push(line.trim());
    }
  }

  // Check for measurements in the report not present in the input
  const reportMeasurements = extractMeasurements(findingsContent);
  const inputMeasurements = extractMeasurements(findings);
  const inputMeasurementsLower = inputMeasurements.map((m) => m.toLowerCase());

  for (const measurement of reportMeasurements) {
    if (!inputMeasurementsLower.includes(measurement.toLowerCase())) {
      // Check if the measurement text appears anywhere in the original findings
      if (!findingsLower.includes(measurement.replace(/\s+/g, ' '))) {
        suspected.push(`Measurement not in input: ${measurement}`);
      }
    }
  }

  return {
    clean: suspected.length === 0,
    suspectedHallucinations: suspected,
    conceptsCovered: [...covered],
  };
}

/**
 * Validate that the Impression section uses bullet point format.
 *
 * Each non-empty line in Impression should start with "- ".
 *
 * @param report - The full report text in Markdown format
 * @returns Format validation result
 */
export function validateImpressionFormat(report: string): FormatResult {
  const impressionContent = extractSectionContent(report, 'Impression');
  const lines = impressionContent.split('\n').filter((l) => l.trim());
  const bullets = lines.filter((l) => l.trim().startsWith('- '));
  const nonBulletLines = lines.filter((l) => !l.trim().startsWith('- '));

  return {
    valid: nonBulletLines.length === 0 && bullets.length > 0,
    bulletCount: bullets.length,
    nonBulletLines,
  };
}

/**
 * Run all 4 validation checks against a report using a test fixture.
 *
 * Overall pass requires:
 * - Structure: 100% (all 5 sections present)
 * - Anti-hallucination: clean (no suspected hallucinations)
 * - Subheading adherence: >95%
 * - Impression format is informational (does not block overall pass)
 *
 * @param report - The full report text in Markdown format
 * @param fixture - The test fixture with expected values
 * @returns Aggregate validation report
 */
export function runFullValidation(
  report: string,
  fixture: TestFixture
): ValidationReport {
  const structure = validateReportStructure(report);
  const subheadings = validateSubheadings(report, fixture.expectedSubheadings);
  const hallucination = validateAntiHallucination(
    report,
    fixture.inputConcepts,
    fixture.findings
  );
  const impressionFormat = validateImpressionFormat(report);

  const pass =
    structure.valid &&
    hallucination.clean &&
    subheadings.adherencePercent > 95;

  return {
    pass,
    structure,
    subheadings,
    hallucination,
    impressionFormat,
  };
}

// ---------------------------------------------------------------------------
// Prompt structure validation
// ---------------------------------------------------------------------------

export interface PromptStructureResult {
  /** Whether the prompt passes all structural checks */
  valid: boolean;
  /** Approximate token count (words * 1.3) */
  tokenEstimate: number;
  /** Whether numbered CONSTRAINT rules are present */
  hasConstraints: boolean;
  /** Whether REASONING PROCESS steps are present */
  hasReasoningSteps: boolean;
  /** Whether emphatic NEVER/CRITICAL directives remain (should be false) */
  hasEmphatics: boolean;
}

/**
 * Validate that a system prompt is structured for open-source model compatibility.
 *
 * Checks:
 * 1. Contains numbered CONSTRAINT rules (CONSTRAINT 1, CONSTRAINT 2, etc.)
 * 2. Contains REASONING PROCESS with numbered Steps
 * 3. Does NOT contain emphatic "NEVER" or "CRITICAL" directives
 * 4. Token count estimate is under 2K (~1500 words max)
 *
 * @param systemPrompt - The system prompt string to validate
 * @returns Prompt structure validation result
 */
export function validatePromptStructure(systemPrompt: string): PromptStructureResult {
  const words = systemPrompt.split(/\s+/).filter((w) => w.length > 0).length;
  const tokenEstimate = Math.ceil(words * 1.3);

  const hasConstraints = /CONSTRAINT\s+\d+/i.test(systemPrompt);
  const hasReasoningSteps = /REASONING PROCESS/i.test(systemPrompt) && /Step\s+\d+/i.test(systemPrompt);

  // Check for emphatic directives that should have been converted to constraints
  const hasEmphatics =
    /\bNEVER\b/.test(systemPrompt) || /\bCRITICAL\b/.test(systemPrompt);

  const valid =
    hasConstraints &&
    hasReasoningSteps &&
    !hasEmphatics &&
    tokenEstimate < 2000;

  return {
    valid,
    tokenEstimate,
    hasConstraints,
    hasReasoningSteps,
    hasEmphatics,
  };
}

// ---------------------------------------------------------------------------
// Batch validation
// ---------------------------------------------------------------------------

export interface BatchResult {
  /** Total number of reports validated */
  total: number;
  /** Number of reports that passed all checks */
  passed: number;
  /** Number of reports that failed at least one check */
  failed: number;
  /** Per-check pass rates (0-100) */
  passRates: {
    structure: number;
    antiHallucination: number;
    subheadingAdherence: number;
    impressionFormat: number;
  };
  /** Individual results per report (indexed by fixture ID) */
  results: Record<string, ValidationReport>;
}

/**
 * Run full validation on a batch of report-fixture pairs and return aggregate statistics.
 *
 * Use this after generating reports from all 25 fixtures (via live Groq API or saved outputs)
 * to get aggregate pass/fail rates for migration quality assessment.
 *
 * Thresholds for migration approval:
 * - Structure: 100%
 * - Anti-hallucination: 100% (abort if below 95%)
 * - Subheading adherence: >95%
 *
 * @param reports - Array of {report, fixture} pairs to validate
 * @returns Aggregate batch validation result
 */
export function runBatchValidation(
  reports: ReadonlyArray<{ readonly report: string; readonly fixture: TestFixture }>
): BatchResult {
  const results: Record<string, ValidationReport> = {};
  let structurePass = 0;
  let hallucinationPass = 0;
  let subheadingPass = 0;
  let impressionPass = 0;
  let overallPass = 0;

  for (const { report, fixture } of reports) {
    const result = runFullValidation(report, fixture);
    results[fixture.id] = result;

    if (result.structure.valid) structurePass++;
    if (result.hallucination.clean) hallucinationPass++;
    if (result.subheadings.adherencePercent > 95) subheadingPass++;
    if (result.impressionFormat.valid) impressionPass++;
    if (result.pass) overallPass++;
  }

  const total = reports.length;
  const pct = (n: number) => (total === 0 ? 100 : Math.round((n / total) * 100));

  return {
    total,
    passed: overallPass,
    failed: total - overallPass,
    passRates: {
      structure: pct(structurePass),
      antiHallucination: pct(hallucinationPass),
      subheadingAdherence: pct(subheadingPass),
      impressionFormat: pct(impressionPass),
    },
    results,
  };
}
