/**
 * Detection utilities for radiology transcription analysis.
 * Provides modality and body part detection from transcribed text.
 */

export { detectModality, getAllModalities } from './modality-detector';
export type { ModalityDetection } from './modality-detector';

export { detectBodyPart, getAllBodyParts } from './body-part-detector';
