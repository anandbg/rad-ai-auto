---
created: 2026-01-17T17:15
title: Fix PDF export and add Word download option
area: ui
files:
  - app/components/workspace/report-workspace.tsx
  - app/components/workspace/workspace-tabs.tsx
---

## Problem

The current PDF export functionality has issues:
1. **Prints entire screen** - Instead of just the report content, it captures the whole page including sidebar, navigation, and other UI elements
2. **Uses browser print dialog** - User wants direct PDF download, not a print-to-PDF flow
3. **No Word export** - User wants a "Download to Word" option alongside the PDF button

The current implementation (from Phase 07 - PDF Export Enhancement) uses `window.print()` which triggers the browser's print dialog and captures the full viewport.

## Solution

1. Replace browser print approach with programmatic PDF generation
   - Use a library like `jsPDF`, `react-pdf`, or `@react-pdf/renderer`
   - Generate PDF with only report content (sections, impression, header)
   - Trigger direct download (`<a download>` or blob URL)

2. Add Word/DOCX export option
   - Use a library like `docx` (npm: docx) to generate .docx files
   - Same content structure as PDF
   - Add button next to PDF download button

3. Ensure professional formatting in both exports:
   - Report header with study type, patient info
   - Sections with proper headings
   - Impression section
   - Footer with generation timestamp and AI indicator

4. UI: Place "Download PDF" and "Download Word" buttons together in the Report tab
