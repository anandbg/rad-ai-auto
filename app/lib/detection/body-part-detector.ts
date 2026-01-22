/**
 * Detects body part from transcribed text.
 * Searches for anatomical keywords and patterns.
 */

// Body part detection patterns
const BODY_PART_PATTERNS: { bodyPart: string; keywords: string[] }[] = [
  { bodyPart: 'Head', keywords: ['head', 'brain', 'skull', 'cranial', 'intracranial', 'cerebral'] },
  { bodyPart: 'Neck', keywords: ['neck', 'cervical', 'thyroid', 'carotid', 'larynx'] },
  { bodyPart: 'Chest', keywords: ['chest', 'thorax', 'thoracic', 'lung', 'pulmonary', 'cardiac', 'heart', 'mediastinal', 'pleural'] },
  { bodyPart: 'Abdomen', keywords: ['abdomen', 'abdominal', 'liver', 'spleen', 'kidney', 'renal', 'pancreas', 'gallbladder', 'intestine', 'bowel', 'colon'] },
  { bodyPart: 'Pelvis', keywords: ['pelvis', 'pelvic', 'bladder', 'prostate', 'uterus', 'ovary', 'rectum', 'hip'] },
  { bodyPart: 'Spine', keywords: ['spine', 'spinal', 'vertebra', 'disc', 'lumbar', 'thoracic spine', 'cervical spine', 'sacral'] },
  { bodyPart: 'Upper Extremity', keywords: ['arm', 'shoulder', 'elbow', 'wrist', 'hand', 'humerus', 'radius', 'ulna'] },
  { bodyPart: 'Lower Extremity', keywords: ['leg', 'knee', 'ankle', 'foot', 'femur', 'tibia', 'fibula', 'thigh', 'calf'] },
];

/**
 * Detects body part from transcribed text using keyword matching.
 * @param text - The text to analyze for body part keywords
 * @returns The detected body part name, or null if no match
 */
export function detectBodyPart(text: string): string | null {
  if (!text || text.trim().length < 10) return null;

  const lowerText = text.toLowerCase();
  const results: { bodyPart: string; score: number }[] = [];

  for (const pattern of BODY_PART_PATTERNS) {
    let score = 0;
    for (const keyword of pattern.keywords) {
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    if (score > 0) {
      results.push({ bodyPart: pattern.bodyPart, score });
    }
  }

  if (results.length === 0) return null;
  results.sort((a, b) => b.score - a.score);
  return results[0]?.bodyPart ?? null;
}

/**
 * Returns all supported body parts.
 */
export function getAllBodyParts(): string[] {
  return BODY_PART_PATTERNS.map(p => p.bodyPart);
}
