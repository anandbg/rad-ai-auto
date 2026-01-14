/**
 * Type exports for the application
 */

// Re-export database types
export * from './database';

// API response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Filter and sort types
export interface TemplateFilters {
  modality?: string;
  body_part?: string;
  search?: string;
  tags?: string[];
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

// Report generation types
export interface GenerateReportInput {
  templateId: string;
  findings: string;
  patientContext?: PatientContext;
  options?: GenerationOptions;
}

export interface PatientContext {
  exam_type?: string;
  indication?: string;
  clinical_history?: string;
  comparison?: string;
}

export interface GenerationOptions {
  temperature?: number;
  detail_level?: 'brief' | 'standard' | 'detailed';
}

export interface GeneratedReport {
  sections: ReportSection[];
  metadata: ReportMetadata;
}

export interface ReportSection {
  id: string;
  name: string;
  heading: string;
  content: string;
}

export interface ReportMetadata {
  template_id: string;
  template_name: string;
  generated_at: string;
  model: string;
  duration_ms: number;
}

// Transcription types
export interface TranscriptionResult {
  text: string;
  confidence?: number;
  duration_ms: number;
  language?: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  profile: {
    name: string | null;
    specialty: string | null;
    role: 'radiologist' | 'admin';
  } | null;
}

export interface Session {
  user: AuthUser;
  expiresAt: string;
}

// Usage types
export interface UsageStats {
  reports_this_month: number;
  transcription_minutes_this_month: number;
  remaining_reports: number | 'unlimited';
  remaining_minutes: number | 'unlimited';
  plan: 'free' | 'plus' | 'pro';
}

// Export types
export interface ExportOptions {
  format: 'pdf' | 'docx' | 'text';
  include_metadata: boolean;
  brand_template_id?: string;
}
