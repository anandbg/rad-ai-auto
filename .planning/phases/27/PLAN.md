# Phase 27: Report List Style Preferences

## Objective

Enable users to customize how list items appear in their generated radiology reports. Users can choose from multiple list styles (bullet, dash, arrow, numbered, none) and configure per-section with an "Apply to All" option.

## Context

**Requirements**: FMT-01 through FMT-08

**Existing infrastructure:**
- `profiles.style_preferences` JSONB column exists in database
- `preferences-context.tsx` manages user preferences with API sync
- `/api/preferences` endpoint handles preference CRUD
- Settings page at `app/(protected)/settings/page.tsx`
- Report rendering uses ReactMarkdown in `report-workspace.tsx`
- PDF export uses jsPDF
- Word export uses docx library

## Tasks

### Plan 27-01: Settings UI for List Style Preferences

**Goal**: Add "Report Formatting" section to Settings page with list style configuration

**Files to modify:**
- `app/lib/preferences/preferences-context.tsx` - Add listStylePreferences type
- `app/app/api/preferences/route.ts` - Handle listStylePreferences in API
- `app/app/(protected)/settings/page.tsx` - Add Report Formatting section UI

**Implementation:**

1. **Update preferences-context.tsx**
   ```typescript
   // Add to UserPreferences interface
   export type ListStyle = 'bullet' | 'dash' | 'arrow' | 'numbered' | 'none';
   
   export interface SectionListStyle {
     clinicalInfo: ListStyle;
     technique: ListStyle;
     comparison: ListStyle;
     findings: ListStyle;
     impression: ListStyle;
   }
   
   interface UserPreferences {
     // ... existing
     listStylePreferences: SectionListStyle;
   }
   
   const DEFAULT_LIST_STYLES: SectionListStyle = {
     clinicalInfo: 'bullet',
     technique: 'bullet',
     comparison: 'bullet',
     findings: 'bullet',
     impression: 'bullet',
   };
   ```

2. **Update /api/preferences route**
   - Accept `listStylePreferences` in PUT request
   - Store in `style_preferences` JSONB column

3. **Add Settings UI section**
   - "Report Formatting" card with:
     - Style dropdown for each section
     - "Apply to All" button
     - Preview of each style
   - Style options: • Bullet, - Dash, → Arrow, 1. Numbered, None

**Verification:**
- [ ] Settings page shows "Report Formatting" section
- [ ] User can select style for each section
- [ ] "Apply to All" sets same style for all sections
- [ ] Preferences persist after page refresh
- [ ] Default is "bullet" for new users

### Plan 27-02: Apply List Styles to Report Generation and Exports

**Goal**: Report generation and exports respect user's list style preferences

**Files to modify:**
- `app/components/workspace/report-workspace.tsx` - Apply styles to markdown rendering
- `app/app/api/generate/route.ts` - Pass style preferences to report generation (optional)

**Implementation:**

1. **Create list style utility**
   ```typescript
   // lib/report/list-styles.ts
   export function getListPrefix(style: ListStyle, index?: number): string {
     switch (style) {
       case 'bullet': return '•';
       case 'dash': return '-';
       case 'arrow': return '→';
       case 'numbered': return `${(index ?? 0) + 1}.`;
       case 'none': return '';
     }
   }
   ```

2. **Update ReactMarkdown rendering**
   - Custom `li` renderer that applies user's style
   - Get preferences from context
   - Detect which section the list is in

3. **Update PDF export**
   - Apply list prefix based on preferences
   - Maintain proper indentation

4. **Update Word/DOCX export**
   - Apply list formatting based on preferences
   - Use docx library's bullet/numbering options

**Verification:**
- [ ] Generated reports display correct list styles in UI
- [ ] PDF export shows correct list prefixes
- [ ] Word export shows correct list formatting
- [ ] Changing preference affects only new reports
- [ ] Each section can have different style

## Success Criteria

1. ✅ Settings page has "Report Formatting" section
2. ✅ User can choose from 5 styles: Bullet (•), Dash (-), Arrow (→), Numbered (1.), None
3. ✅ User can configure style per report section
4. ✅ "Apply to All" button works
5. ✅ Default style is Bullet (•) for new users
6. ✅ Preferences stored in database
7. ✅ Report generation applies selected styles
8. ✅ PDF export renders correctly
9. ✅ Word export renders correctly

## Dependencies

- None (can be worked on independently)

## Estimated Effort

- Plan 27-01: Small (Settings UI + preferences infrastructure)
- Plan 27-02: Medium (Report rendering + export modifications)

---
*Plan created: 2026-01-20*
