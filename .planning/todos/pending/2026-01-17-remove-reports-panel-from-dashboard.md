---
created: 2026-01-17T17:03
title: Remove reports panel from dashboard
area: ui
files:
  - app/components/layout/reports-panel.tsx
  - app/components/layout/app-shell.tsx
  - app/components/layout/sidebar.tsx
---

## Problem

The 3-panel application shell (implemented in 11-06) includes a "Reports Panel" as the second/middle column showing recent reports grouped by date (Today, Yesterday, etc.). User wants to remove this panel to simplify the dashboard layout to a 2-panel design (sidebar + main workspace only).

The screenshot shows the reports panel with:
- Date groupings (Today, Yesterday, Jan 15)
- Report cards (CT Chest with Contrast, MRI Brain without Contrast, X-Ray Chest PA/Lateral)
- Draft status badges
- "+ New Report" button at bottom

## Solution

1. Remove or hide ReportsPanel component from AppShell
2. Adjust layout grid to remove the middle column
3. Consider relocating "New Report" button to sidebar or main workspace
4. May need to remove reports-panel.tsx if no longer needed
