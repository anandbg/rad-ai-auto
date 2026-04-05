/**
 * Test fixture types and loader for quality validation of AI report generation.
 *
 * Provides 25 test cases across 5 modality groups (MRI brain, CT chest,
 * X-ray chest, ultrasound abdomen, mixed/edge) for validating model output
 * against expected structural and content standards.
 */

export interface TestFixture {
  /** Unique identifier, e.g. "mri-brain-001" */
  id: string;
  /** Imaging modality, e.g. "MRI", "CT", "X-ray", "Ultrasound" */
  modality: string;
  /** Anatomical region, e.g. "Brain", "Chest", "Abdomen" */
  bodyPart: string;
  /** Template name for report generation */
  templateName: string;
  /** Input findings text (radiologist dictation) */
  findings: string;
  /** Required report sections (## headings) */
  expectedSections: string[];
  /** Expected **bold:** subsection headings in Findings */
  expectedSubheadings: string[];
  /** Key medical concepts from findings (for hallucination checking) */
  inputConcepts: string[];
  /** Complexity classification */
  complexity: 'simple' | 'moderate' | 'complex';
}

import mriBrain from './mri-brain.json';
import ctChest from './ct-chest.json';
import xrayChest from './xray-chest.json';
import ultrasoundAbdomen from './ultrasound-abdomen.json';
import mixedEdge from './mixed-edge.json';

/**
 * Load all 25 test fixtures across all modality groups.
 * Returns a flat array of TestFixture objects.
 */
export function loadAllFixtures(): TestFixture[] {
  return [
    ...(mriBrain as TestFixture[]),
    ...(ctChest as TestFixture[]),
    ...(xrayChest as TestFixture[]),
    ...(ultrasoundAbdomen as TestFixture[]),
    ...(mixedEdge as TestFixture[]),
  ];
}

/**
 * Load fixtures filtered by modality.
 */
export function loadFixturesByModality(modality: string): TestFixture[] {
  return loadAllFixtures().filter(
    (f) => f.modality.toLowerCase() === modality.toLowerCase()
  );
}

/**
 * Load a single fixture by its ID.
 */
export function loadFixtureById(id: string): TestFixture | undefined {
  return loadAllFixtures().find((f) => f.id === id);
}
