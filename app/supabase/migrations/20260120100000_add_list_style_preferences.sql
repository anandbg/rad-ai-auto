-- Migration: Add list_style_preferences to user_preferences table
-- Purpose: Allow users to customize list styles per report section

-- Add JSONB column for list style preferences with default values
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS list_style_preferences JSONB DEFAULT '{
  "clinicalInfo": "bullet",
  "technique": "bullet",
  "comparison": "bullet",
  "findings": "bullet",
  "impression": "bullet"
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN user_preferences.list_style_preferences IS 'JSON object with list style preferences per report section (clinicalInfo, technique, comparison, findings, impression). Values: bullet, dash, arrow, numbered, none';
