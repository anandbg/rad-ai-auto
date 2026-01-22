/**
 * Canonical Template type definitions.
 * Import from here throughout the codebase.
 *
 * This is the single source of truth for Template-related types.
 * All components and pages should import from '@/types/template'.
 */

/**
 * TemplateSection represents a section within a template.
 * Used for structured template editing and display.
 */
export interface TemplateSection {
  id: string;
  name: string;
  type?: 'header' | 'findings' | 'impression' | 'recommendations' | 'custom';
  content: string;
  order?: number;
  isRequired?: boolean;
}

/**
 * Template represents a radiology report template.
 * Used across templates list, editor, and workspace pages.
 */
export interface Template {
  id: string;
  name: string;
  description?: string;
  modality: string;
  bodyPart: string;
  /** Full template content as markdown/text */
  content?: string;
  /** Structured sections for section-based templates */
  sections?: TemplateSection[];
  /** Whether this is a global (system) template or user-owned */
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
  /** Template version for optimistic locking */
  version?: number;
  /** Tags for categorization */
  tags?: string[];
}

/**
 * TemplateFormData is used for create/edit forms.
 * Omits server-generated fields like id, createdAt, etc.
 */
export interface TemplateFormData {
  name: string;
  description?: string;
  modality: string;
  bodyPart: string;
  content?: string;
  sections?: TemplateSection[];
}

/**
 * TemplateListItem is a lightweight version for list views.
 * Contains only the fields needed for display in cards/lists.
 */
export interface TemplateListItem {
  id: string;
  name: string;
  modality: string;
  bodyPart: string;
  description?: string;
  isGlobal: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Note: TemplateType is not exported as it conflicts with database.ts
// which defines TemplateType = 'global' | 'personal'
// Use Template interface directly instead
