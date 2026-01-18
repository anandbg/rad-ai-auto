---
created: 2026-01-18T08:45
title: Template creation UX overhaul with AI-assisted builder
area: ui
files:
  - app/app/(protected)/templates/new/page.tsx
  - app/app/(protected)/templates/[id]/page.tsx
  - app/app/(protected)/templates/page.tsx
  - app/lib/validation/template-schema.ts
  - app/app/api/templates/assist/route.ts
---

## Problem

The current template creation/editing UI needs a significant UX overhaul. Users should have multiple pathways to create templates:

1. **Manual creation** - Current approach, requires understanding template structure
2. **AI-assisted creation** - User describes what they want, AI generates the template
3. **Clone and customize** - Start from existing template, modify as needed
4. **Import from notes** - Paste a sample report, AI converts to template

Key requirements:
- Users can "chuck in their thoughts" and AI builds the template structure
- Always validate before save to ensure correct structure (Zod schema exists)
- Clear UI for adding/editing/deleting sections
- Template versioning and update workflow
- Preview rendered template before saving

## Current State

- **Schema exists**: `app/lib/validation/template-schema.ts` with Zod validation
- **Pages exist**: `/templates/new`, `/templates/[id]`, `/templates` (list)
- **API exists**: `/api/templates/assist` for AI template assistance
- **Modality/body part dropdowns** already in schema

## Solution

### UX Flow Options to Explore

1. **Wizard-style creation**
   - Step 1: Choose creation method (blank, AI-assist, clone, import)
   - Step 2: Gather input based on method
   - Step 3: AI generates/structures template
   - Step 4: User reviews/edits sections
   - Step 5: Validate and save

2. **Single-page with modes**
   - Toggle between "Structured Editor" and "AI Chat" views
   - AI Chat: conversational template building
   - Structured Editor: section-by-section editing
   - Real-time validation feedback

3. **AI-first with manual override**
   - Default to AI description input
   - AI generates draft
   - User can edit any section manually
   - "Regenerate" button per section

### Key Features to Design

- [ ] AI template builder: freeform input → structured template
- [ ] Section editor: add/edit/delete/reorder sections
- [ ] Clone workflow: select source → customize
- [ ] Import from notes: paste text → AI extracts template
- [ ] Live preview: see rendered output as you edit
- [ ] Validation feedback: inline errors, fix suggestions
- [ ] Template versioning: track changes, revert if needed
- [ ] Update existing templates: edit with version history

### Technical Considerations

- Zod schema is source of truth for validation
- Server-side validation required (already in place)
- AI endpoints for generation/conversion exist
- Consider optimistic UI with validation rollback

## Brainstorm Areas

1. **What should the default creation flow be?** (AI-first vs manual-first)
2. **How to handle section ordering?** (drag-drop, up/down arrows, both)
3. **Template preview fidelity** - how close to final report?
4. **Version history UI** - timeline view, diff view, or simple list?
5. **Clone UX** - same page with source selector, or dedicated clone flow?
6. **Mobile considerations** - is template editing mobile-critical?
