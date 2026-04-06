# Requirements: Report List Style Preferences

**Defined:** 2026-01-20
**Core Value:** Users can customize how list items appear in their generated radiology reports

## v1 Requirements

Requirements for this feature enhancement.

### Report Formatting

- [ ] **FMT-01**: User can access list style preferences in Settings page
- [ ] **FMT-02**: User can choose from 5 list styles: Bullet (•), Dash (-), Arrow (→), Numbered (1.), None
- [ ] **FMT-03**: User can set list style per report section (Clinical Info, Technique, Findings, Impression, etc.)
- [ ] **FMT-04**: User can apply a style to all sections at once ("Apply to All" action)
- [ ] **FMT-05**: Default style is Bullet (•) for new users
- [ ] **FMT-06**: List style preference applies only to newly generated reports
- [ ] **FMT-07**: List style renders correctly in PDF export
- [ ] **FMT-08**: List style renders correctly in Word export

## v2 Requirements

Deferred to future release.

### Enhanced Formatting

- **FMT-09**: User can set list style per template (template-level override)
- **FMT-10**: User can define custom list prefix character
- **FMT-11**: User can choose indentation level for nested lists

## Out of Scope

Explicitly excluded from this feature.

| Feature | Reason |
|---------|--------|
| Per-template style override | Keeping v1 simple with global settings only |
| Custom character input | 5 predefined styles sufficient for v1 |
| Retroactive report update | Complexity - users can regenerate if needed |
| Nested list formatting | Not currently used in radiology reports |

## Traceability

Which phases cover which requirements. Updated after roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FMT-01 | TBD | Pending |
| FMT-02 | TBD | Pending |
| FMT-03 | TBD | Pending |
| FMT-04 | TBD | Pending |
| FMT-05 | TBD | Pending |
| FMT-06 | TBD | Pending |
| FMT-07 | TBD | Pending |
| FMT-08 | TBD | Pending |

**Coverage:**
- v1 requirements: 8 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 8

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-20 after initial definition*
