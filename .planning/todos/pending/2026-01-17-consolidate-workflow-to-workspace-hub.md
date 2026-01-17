---
created: 2026-01-17T17:05
title: Consolidate workflow to workspace hub with functional buttons
area: ui
files:
  - app/components/workspace/report-workspace.tsx
  - app/components/layout/sidebar.tsx
  - app/app/(protected)/transcribe/page.tsx
  - app/app/(protected)/generate/page.tsx
  - app/app/api/transcribe/route.ts
  - app/app/api/generate/route.ts
---

## Problem

The current UI has multiple entry points for the same workflow:
1. Sidebar has separate "Transcribe" and "Generate" nav items pointing to standalone pages
2. The main workspace (report-workspace.tsx) also has Voice Input and Report tabs
3. **Buttons in the workspace are not functional** - they don't connect to backend APIs

User wants a consolidated experience:
- The workspace should be the **primary and only** place for the full workflow
- Remove Transcribe/Generate options from the sidebar navigation
- Voice Input tab needs **file upload option** (like the standalone transcribe page has)
- Generate Report button should be inside the "Report" tab
- **All buttons must be wired to backend APIs** so transcription and report generation actually work

## Solution

1. Remove "Transcribe" and "Generate" nav items from sidebar
2. Add file upload capability to Voice Input tab in report-workspace.tsx
3. Ensure "Generate Report" button is in the Report tab (may already be there from 11-07)
4. Wire Voice Input recording/upload to `/api/transcribe` endpoint
5. Wire Generate Report button to `/api/generate` endpoint
6. Handle streaming responses for both APIs
7. Consider removing or redirecting the standalone pages (/transcribe, /generate)
