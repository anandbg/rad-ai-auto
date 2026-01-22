/**
 * Detects imaging modality from transcribed text.
 * Searches for modality-specific keywords and patterns.
 */

// Modality detection result interface
export interface ModalityDetection {
  modality: string;
  confidence: number;
  keywords: string[];
}

// Modality detection keywords and patterns
const MODALITY_PATTERNS: { modality: string; keywords: string[]; weight: number }[] = [
  { modality: 'CT', keywords: ['ct', 'ct scan', 'computed tomography', 'cat scan', 'hounsfield', 'contrast enhanced ct', 'cect', 'non-contrast ct', 'ncct'], weight: 1.0 },
  { modality: 'MRI', keywords: ['mri', 'mr', 'magnetic resonance', 't1', 't2', 'flair', 'dwi', 'diffusion weighted', 'gadolinium', 't1w', 't2w'], weight: 1.0 },
  { modality: 'X-Ray', keywords: ['x-ray', 'xray', 'radiograph', 'plain film', 'chest x-ray', 'cxr', 'pa view', 'lateral view', 'ap view'], weight: 1.0 },
  { modality: 'Ultrasound', keywords: ['ultrasound', 'us', 'sonogram', 'sonography', 'doppler', 'echocardiogram', 'echo', 'transducer'], weight: 1.0 },
  { modality: 'PET', keywords: ['pet', 'pet scan', 'pet-ct', 'positron emission', 'fdg', 'suv', 'metabolic activity'], weight: 1.0 },
  { modality: 'Mammography', keywords: ['mammogram', 'mammography', 'breast imaging', 'birads', 'bi-rads', 'breast screening'], weight: 1.0 },
  { modality: 'Fluoroscopy', keywords: ['fluoroscopy', 'fluoro', 'barium', 'swallow study', 'upper gi', 'lower gi', 'real-time imaging'], weight: 1.0 },
  { modality: 'Nuclear Medicine', keywords: ['nuclear', 'scintigraphy', 'bone scan', 'thyroid scan', 'spect', 'gamma camera', 'radiotracer'], weight: 1.0 },
];

/**
 * Detects modality from transcribed text using keyword matching.
 * @param text - The text to analyze for modality keywords
 * @returns ModalityDetection object with modality, confidence, and matched keywords, or null if no match
 */
export function detectModality(text: string): ModalityDetection | null {
  if (!text || text.trim().length < 10) return null;

  const lowerText = text.toLowerCase();
  const results: { modality: string; score: number; matchedKeywords: string[] }[] = [];

  for (const pattern of MODALITY_PATTERNS) {
    const matchedKeywords: string[] = [];
    let score = 0;

    for (const keyword of pattern.keywords) {
      // Use word boundary matching for more accurate detection
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        score += matches.length * pattern.weight;
        if (!matchedKeywords.includes(keyword)) {
          matchedKeywords.push(keyword);
        }
      }
    }

    if (score > 0) {
      results.push({ modality: pattern.modality, score, matchedKeywords });
    }
  }

  if (results.length === 0) return null;

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  const bestMatch = results[0];
  if (!bestMatch) return null;

  const totalScore = results.reduce((sum, r) => sum + r.score, 0);

  // Calculate confidence as percentage of total score
  const confidence = Math.min(99, Math.round((bestMatch.score / Math.max(totalScore, 1)) * 100));

  return {
    modality: bestMatch.modality,
    confidence,
    keywords: bestMatch.matchedKeywords,
  };
}

/**
 * Returns all supported modalities.
 */
export function getAllModalities(): string[] {
  return MODALITY_PATTERNS.map(p => p.modality);
}
