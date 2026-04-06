---
status: verifying
trigger: "Template creation and editing section has multiple UI/UX issues"
created: 2026-01-20T00:00:00Z
updated: 2026-01-20T00:35:00Z
---

## Current Focus

hypothesis: Multiple distinct issues:
1. "Choose template first" - Not found in codebase, may be user misremembering or from different context
2. AI structuring - AI Generation Dialog exists but expects DESCRIPTION, not raw template blob
3. Error toasts - Multiple places show error toasts, need to identify which
4. Raw JSON/XML display - Content stored as JSON {sections, rawContent}, rendering depends on data format

test: Fix the AI generation to accept raw template blobs and structure them
expecting: Allow users to paste raw template text for AI to convert into structured format
next_action: Enhance AI Generation Dialog to accept raw template text as input option

## Symptoms

expected:
1. User pastes raw template text blob -> AI structures it -> saves with proper name
2. Edit flow lets user select template and edit smoothly
3. No spurious error messages
4. Template content displays as readable markdown

actual:
1. Unknown - needs testing
2. "Choose the template first" messages appearing incorrectly
3. Error toasts appearing in top-right corner of browser
4. JSON/XML/UML elements appearing raw instead of formatted

errors: "Choose the template first" and other UI toast notifications
reproduction: Create or edit templates in the template section
started: Ongoing issues reported by user

## Eliminated

## Evidence

- timestamp: 2026-01-20T00:10:00Z
  checked: Templates pages codebase
  found: |
    1. /app/(protected)/templates/page.tsx - Template list page, has clone/delete/filter UI
    2. /app/(protected)/templates/new/page.tsx - New template creation with:
       - CreationPathwayModal (4 options: manual, AI, clone, import)
       - AIGenerationDialog for AI template generation from description
       - Form for manual template entry
    3. /app/(protected)/templates/[id]/page.tsx - Template detail/edit page
       - Uses ReactMarkdown with remarkGfm for content display
       - Has edit mode with sections, settings, normal findings tabs
    4. No "Choose the template first" error found in template pages
    5. Toast notifications used for errors - potential source of reported toast issues
  implication: The "Choose template first" error likely from another page (generate?). AI structure feature exists via AIGenerationDialog.

- timestamp: 2026-01-20T00:12:00Z
  checked: Template content rendering
  found: |
    - Template [id] page uses ReactMarkdown with remarkGfm
    - Custom markdownComponents for syntax highlighting: [placeholders], (instructions), "verbatim"
    - Content stored in database as JSON with sections array
    - Template content mapped from templateData.content?.rawContent || ''
  implication: Markdown rendering exists. Raw JSON/XML display could be due to content format mismatch or styling issues

- timestamp: 2026-01-20T00:20:00Z
  checked: AI Generation Dialog and template creation flow
  found: |
    - AIGenerationDialog (ai-generation-dialog.tsx) only accepts a "description" text field
    - User must DESCRIBE what template they want, AI generates structure
    - No option to paste existing raw template blob for AI to parse/structure
    - Template content stored as: {sections: [], rawContent: ''}
    - API routes properly handle this JSON structure
  implication: Gap in UX - user wants to paste raw template text and have AI structure it, but current dialog expects description

- timestamp: 2026-01-20T00:22:00Z
  checked: "Choose the template first" error message
  found: |
    - Searched entire codebase - no match for "Choose.*template.*first"
    - Related messages found:
      * "Please select a modality" (validation)
      * "Please select a body part" (validation)
      * "No template found for {modality}. Please select manually." (generate page YOLO mode)
    - Toast system works correctly (shows in top-right)
  implication: User may have seen different error or from external source. No code fix needed for this specific message.

## Resolution

root_cause: |
  1. AI Generation Dialog only accepts template descriptions, not raw template text blobs
  2. Users want to paste existing unstructured templates and have AI structure them
  3. "Choose template first" error not in codebase - likely misremembered or external
  4. Toast system working correctly - errors shown when appropriate

fix: |
  1. Enhanced AIGenerationDialog with two modes:
     - "Describe New Template" - original behavior, describe what you want
     - "Structure Existing Text" - paste raw template text for AI to structure
  2. Added mode toggle UI with clear visual feedback
  3. Updated /api/templates/generate API to handle both modes:
     - mode='describe' - generates from description (default)
     - mode='structure' - parses and structures raw template text
  4. Added STRUCTURE_EXISTING_GUIDANCE prompt for AI to properly parse raw templates
  5. Raw template input preserves checklists, instructions, and sections

verification: |
  1. TypeScript compiles without errors - PASSED
  2. Production build succeeds - PASSED
  3. Browser testing needed:
     - Open template creation dialog
     - Toggle between modes
     - Paste test template blob in structure mode
     - Verify AI structures it correctly

files_changed:
  - app/components/template-builder/ai-generation-dialog.tsx
  - app/app/api/templates/generate/route.ts
