/**
 * Database types for Supabase tables
 * Generated from database schema in app_spec.txt
 */

export type UserRole = 'radiologist' | 'admin';

export type SubscriptionPlan = 'free' | 'plus' | 'pro';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete';

export type TemplateType = 'global' | 'personal';

export type TranscribeStatus =
  | 'uploaded'
  | 'processing'
  | 'completed'
  | 'deleted'
  | 'failed';

export type CreditReason = 'allocation' | 'debit' | 'topup' | 'refund';

export type LetterheadPosition = 'top' | 'left' | 'right';

export type InstitutionRole = 'member' | 'admin';

// Database row types
export interface Profile {
  user_id: string;
  name: string | null;
  specialty: string | null;
  institution: string | null;
  institution_id: string | null;
  role: UserRole;
  style_preferences: Record<string, unknown> | null;
  created_at: string;
}

export interface Institution {
  id: string;
  name: string;
  logo_url: string | null;
  address: string | null;
  branding_defaults: Record<string, unknown> | null;
  billing_email: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InstitutionMember {
  institution_id: string;
  user_id: string;
  role: InstitutionRole;
  joined_at: string;
}

export interface TemplateGlobal {
  id: string;
  name: string;
  modality: string;
  body_part: string;
  description: string | null;
  version: number;
  content: TemplateContent;
  tags: string[];
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TemplatePersonal {
  id: string;
  user_id: string;
  origin_global_id: string | null;
  institution_id: string | null;
  is_shared: boolean;
  name: string;
  modality: string;
  body_part: string;
  description: string | null;
  version: number;
  content: TemplateContent;
  tags: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateVersion {
  id: string;
  template_id: string;
  template_type: TemplateType;
  version_number: number;
  content: TemplateContent;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface BrandTemplate {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  letterhead_url: string | null;
  letterhead_position: LetterheadPosition;
  letterhead_size: { width: number; height: number } | null;
  typography: TypographyConfig | null;
  colors: ColorConfig | null;
  footer_config: FooterConfig | null;
  created_at: string;
  updated_at: string;
}

export interface TranscriptionMacro {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  replacement_text: string;
  is_global: boolean;
  is_active: boolean;
  is_smart: boolean;
  smart_context: SmartMacroContext | null;
  created_at: string;
  updated_at: string;
}

export interface MacroCategory {
  id: string;
  user_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
}

export interface Subscription {
  user_id: string;
  stripe_customer_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  period_start: string;
  period_end: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionLimits {
  plan: SubscriptionPlan;
  max_reports_per_month: number;
  max_transcriptions_per_month: number;
  max_transcription_minutes: number;
  max_personal_templates: number;
  max_brand_templates: number;
  features: Record<string, boolean>;
}

export interface CreditsLedger {
  id: string;
  user_id: string;
  delta: number;
  reason: CreditReason;
  meta: Record<string, unknown> | null;
  idempotency_key: string;
  created_at: string;
}

export interface ReportSession {
  id: string;
  user_id: string;
  scan_type: string;
  template_ref: { id: string; name: string; type: TemplateType };
  options: Record<string, unknown> | null;
  model: string;
  duration_ms: number;
  credits_consumed: number;
  created_at: string;
}

export interface TranscribeSession {
  id: string;
  session_id: string;
  user_id: string;
  object_key: string;
  status: TranscribeStatus;
  storage_bytes: number;
  storage_expires_at: string;
  encryption: string;
  nonce_b64: string;
  duration_ms: number;
  error_code: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserPreferences {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  default_template_id: string | null;
  default_brand_template_id: string | null;
  yolo_mode_enabled: boolean;
  keyboard_shortcuts_enabled: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Nested types
export interface TemplateContent {
  sections: TemplateSection[];
  normal_findings?: Record<string, string>;
  style?: TemplateStyle;
}

export interface TemplateSection {
  id: string;
  name: string;
  heading: string;
  prompt: string;
  order: number;
}

export interface TemplateStyle {
  font_family?: string;
  heading_style?: string;
  body_style?: string;
}

export interface TypographyConfig {
  font_family: string;
  heading_size: string;
  body_size: string;
  font_weight: string;
  line_spacing: string;
  letter_spacing?: string;
}

export interface ColorConfig {
  primary: string;
  secondary: string;
  accent?: string;
}

export interface FooterConfig {
  static_text?: string;
  show_radiologist_name: boolean;
  show_date: boolean;
  show_report_id?: boolean;
}

export interface SmartMacroContext {
  body_parts?: string[];
  modalities?: string[];
  conditions?: Record<string, string>;
}
