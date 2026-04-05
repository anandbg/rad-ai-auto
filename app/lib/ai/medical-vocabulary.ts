/**
 * Medical Vocabulary Hints for Whisper Transcription
 *
 * Passed as the `prompt` parameter to bias Whisper toward correct
 * radiology terminology. Covers anatomical terms, imaging sequences,
 * modalities, medications, measurements, common findings, and spine terms.
 *
 * Keep under 500 characters (Whisper prompt practical limit).
 */
export const RADIOLOGY_VOCABULARY_HINT =
  'pneumothorax, atelectasis, effusion, consolidation, cardiomegaly, hepatomegaly, lymphadenopathy, ' +
  'T1-weighted, T2-weighted, FLAIR, DWI, ADC, STIR, post-gadolinium, fat-saturated, ' +
  'MRI, CT, PET-CT, mammography, fluoroscopy, ' +
  'dexamethasone, gadolinium, iodinated contrast, metformin, ' +
  'Hounsfield units, SUV, millimeters, ' +
  'herniation, stenosis, fracture, metastasis, aneurysm, thrombosis, calcification, ' +
  'L4-L5, C5-C6, T12, foraminal, ligamentum flavum, disc desiccation';
