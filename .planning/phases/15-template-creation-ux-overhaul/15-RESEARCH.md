# Phase 15: Template Creation UX Overhaul - Research

**Researched:** 2026-01-18
**Domain:** Form Builders, Drag-Drop Interfaces, AI-Assisted Content Generation, Live Preview
**Confidence:** HIGH

## Summary

This phase transforms the basic template creation page into a full-featured, AI-assisted template builder with multiple creation pathways. The research reveals that the established stack for this type of interface is **@dnd-kit for drag-drop reordering**, **react-resizable-panels for live preview split views**, and **Vercel AI SDK structured outputs for AI-generated templates**. The existing codebase already has the AI SDK, Zod, and Framer Motion installed, requiring only two new dependencies.

The current implementation has basic section management (add/remove) but lacks reordering, live preview, and proper AI-assisted template generation. The key architectural decision is to use AI SDK's `Output.object()` with Zod schemas to ensure AI-generated templates always conform to the existing `TemplateSection` schema, eliminating validation failures on load.

**Primary recommendation:** Add @dnd-kit/core and @dnd-kit/sortable for section reordering, add react-resizable-panels for editor/preview split view, enhance the existing AI suggest endpoint to return structured template sections using Zod schemas with AI SDK.

## Standard Stack

The established libraries/tools for template builder interfaces in 2026:

### Core (To Install)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @dnd-kit/core | ^6.3.x | Drag-drop core | Modern, accessible, 10kb core, built for React hooks |
| @dnd-kit/sortable | ^10.x | Sortable preset | Thin layer on core for list reordering, useSortable hook |
| react-resizable-panels | ^4.4.x | Resizable split panes | 1,455+ projects using it, accessible, IDE-like layouts |

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| ai (Vercel AI SDK) | ^6.0.39 | AI generation | Already used for suggestions, supports Output.object() |
| zod | ^3.23.8 | Schema validation | Already used for template validation |
| Framer Motion | ^12.23.24 | Animations | Already used for page transitions, reorder animations |
| Radix UI Dialog | ^1.1.15 | Modal dialogs | Already used for delete/clone confirmations |

### Supporting (Existing patterns to leverage)
| Library | Purpose | When to Use |
|---------|---------|-------------|
| `lib/motion/variants.ts` | Animation presets | Section add/remove animations |
| `lib/validation/template-schema.ts` | Template schema | AI output schema, import validation |
| `components/motion/FadeIn` | Entry animations | Section list items |
| `components/motion/StaggerContainer` | List animations | Staggered section appearance |

### Not Needed (Avoid Adding)
| Instead of | Why Not |
|------------|---------|
| react-beautiful-dnd | Deprecated, last release 2022, no longer maintained |
| react-dnd | More complex API, requires backend setup |
| Additional form libraries | Current approach with controlled inputs + Zod works well |
| Monaco editor | Overkill for template content editing, adds 2MB+ |

**Installation:**
```bash
cd app && pnpm add @dnd-kit/core @dnd-kit/sortable react-resizable-panels
```

## Architecture Patterns

### Recommended Project Structure
```
app/
  app/(protected)/templates/
    new/
      page.tsx                    # Refactored template builder
      components/
        section-editor.tsx        # Individual section editing
        sortable-section.tsx      # dnd-kit sortable wrapper
        template-preview.tsx      # Live preview renderer
        ai-template-generator.tsx # AI generation dialog
        import-dialog.tsx         # JSON import modal
  components/
    template-builder/
      section-list.tsx            # DndContext + SortableContext wrapper
      preview-panel.tsx           # Template preview renderer
```

### Pattern 1: Sortable Section List with dnd-kit
**What:** Drag-drop reorderable list using useSortable hook
**When to use:** Section reordering in template builder
**Example:**
```typescript
// Source: dnd-kit documentation
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableSection({ id, section, onUpdate, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <button {...listeners} aria-label="Drag to reorder" className="cursor-grab">
        <GripVertical />
      </button>
      {/* Section content */}
    </div>
  );
}

function SectionList({ sections, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over?.id);
      onReorder(arrayMove(sections, oldIndex, newIndex));
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {sections.map(section => (
          <SortableSection key={section.id} id={section.id} section={section} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### Pattern 2: Editor/Preview Split Pane
**What:** Resizable two-panel layout for live preview
**When to use:** Template builder main view
**Example:**
```typescript
// Source: react-resizable-panels documentation
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

function TemplateBuilder() {
  return (
    <PanelGroup direction="horizontal" className="h-full">
      <Panel defaultSize={60} minSize={40}>
        <EditorPanel sections={sections} onChange={setSections} />
      </Panel>
      <PanelResizeHandle className="w-1.5 bg-border hover:bg-brand transition-colors" />
      <Panel defaultSize={40} minSize={30}>
        <PreviewPanel template={template} />
      </Panel>
    </PanelGroup>
  );
}
```

### Pattern 3: AI Structured Output for Template Generation
**What:** Use AI SDK Output.object() with Zod schema for template generation
**When to use:** AI-assisted template creation
**Example:**
```typescript
// Source: Vercel AI SDK documentation
import { streamText, Output } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

// Use existing schema from lib/validation/template-schema.ts
const templateSectionSchema = z.object({
  id: z.string().describe('Unique identifier for the section'),
  name: z.string().min(1).describe('Section name in ALL CAPS, e.g., FINDINGS, IMPRESSION'),
  content: z.string().describe('Template content with placeholders like [finding] and instructions like (only if mentioned)')
});

const generatedTemplateSchema = z.object({
  name: z.string().describe('Template name based on modality and body part'),
  description: z.string().describe('When to use this template'),
  sections: z.array(templateSectionSchema).min(3).max(8).describe('Ordered list of report sections')
});

// In API route
export async function POST(request: Request) {
  const { modality, bodyPart, userDescription } = await request.json();

  const { output } = await generateText({
    model: openai('gpt-4o'),
    output: Output.object({ schema: generatedTemplateSchema }),
    prompt: `Create a radiology report template for ${modality} ${bodyPart}.
             User requirements: ${userDescription || 'Standard template'}`,
    temperature: 0.3
  });

  // output is typed and validated against generatedTemplateSchema
  return Response.json({ success: true, data: output });
}
```

### Pattern 4: Template Import with Validation
**What:** JSON file import with schema validation
**When to use:** Import template from file
**Example:**
```typescript
// Source: React patterns + existing Zod schema
function ImportDialog({ onImport }) {
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate against existing schema
      const result = templateFormSchema.safeParse(data);
      if (!result.success) {
        showToast('Invalid template format: ' + formatZodErrors(result.error), 'error');
        return;
      }

      onImport(result.data);
    } catch {
      showToast('Failed to parse JSON file', 'error');
    }
  };

  return (
    <input
      type="file"
      accept=".json"
      onChange={handleFileSelect}
      className="hidden"
    />
  );
}
```

### Pattern 5: Live Preview Renderer
**What:** Real-time template preview as user edits
**When to use:** Preview panel in split view
**Example:**
```typescript
// Source: Content preview patterns
function TemplatePreview({ template }) {
  const renderedContent = useMemo(() => {
    // Replace placeholders with styled markers
    return template.sections.map(section => ({
      ...section,
      renderedContent: section.content
        .replace(/\[([^\]]+)\]/g, '<span class="placeholder">[$1]</span>')
        .replace(/\(([^)]+)\)/g, '<span class="instruction">($1)</span>')
        .replace(/"([^"]+)"/g, '<span class="verbatim">"$1"</span>')
    }));
  }, [template.sections]);

  return (
    <div className="p-6 bg-surface-muted rounded-lg">
      <h2 className="text-xl font-bold mb-4">{template.name || 'Untitled Template'}</h2>
      {renderedContent.map(section => (
        <div key={section.id} className="mb-4">
          <h3 className="font-semibold text-sm text-text-secondary">{section.name}</h3>
          <div
            className="prose prose-sm"
            dangerouslySetInnerHTML={{ __html: section.renderedContent }}
          />
        </div>
      ))}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Animating section reorder without dnd-kit's CSS.Transform:** Manually animating position causes jank. Let dnd-kit handle transform.
- **Uncontrolled form inputs in sortable items:** State gets lost during reorder. Keep all state lifted to parent.
- **Synchronous validation on every keystroke:** Debounce validation for content fields.
- **AI output without schema validation:** Never trust raw LLM output. Always validate with Zod.
- **Blocking UI during AI generation:** Always stream responses and show incremental progress.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| List reordering | Manual drag handlers | @dnd-kit/sortable | Handles keyboard, touch, pointer events, collision detection, accessibility |
| Drag-drop accessibility | aria-grabbed attributes | dnd-kit announcements | aria-grabbed deprecated, live regions required |
| Split pane resize | Manual mousedown handlers | react-resizable-panels | Handles keyboard resize, layout persistence, constraints |
| AI schema compliance | Post-hoc validation | AI SDK Output.object() | Enforces schema during generation, type-safe output |
| JSON file parsing | Manual FileReader | File API + schema | Browser handles encoding, Zod validates structure |
| Section animations | Manual CSS transitions | Framer Motion AnimatePresence | Handles mount/unmount, exit animations |

**Key insight:** dnd-kit provides accessibility out of the box including keyboard navigation (arrow keys to move items), screen reader announcements (live regions for drag state), and semantic ARIA attributes. Building this manually is extremely error-prone.

## Common Pitfalls

### Pitfall 1: Inaccessible Drag-Drop Implementation
**What goes wrong:** Users with keyboards or screen readers cannot reorder sections
**Why it happens:** Using mouse-only drag handlers without keyboard alternatives
**How to avoid:** Use dnd-kit which provides KeyboardSensor, aria attributes, and live region announcements by default
**Warning signs:** Cannot tab to drag handles, no screen reader announcements during drag
**Solution:** dnd-kit's useSensor with KeyboardSensor + sortableKeyboardCoordinates

### Pitfall 2: AI-Generated Templates Fail Validation
**What goes wrong:** AI returns malformed templates that crash on load
**Why it happens:** Relying on prompt engineering alone without schema enforcement
**How to avoid:** Use AI SDK's Output.object() with the existing Zod templateSectionSchema
**Warning signs:** Templates created via AI fail to load, missing required fields
**Solution pattern:**
```typescript
// Extend existing schema with AI guidance
const aiTemplateSchema = templateFormSchema.extend({
  sections: z.array(
    templateSectionSchema.extend({
      content: z.string().describe('Use [placeholders] for dynamic content, (instructions) for guidance')
    })
  )
});

const { output } = await generateText({
  model: openai('gpt-4o'),
  output: Output.object({ schema: aiTemplateSchema }),
  // ...
});
// output is GUARANTEED to match schema
```

### Pitfall 3: Lost Section State During Reorder
**What goes wrong:** Edited content disappears after drag-drop
**Why it happens:** Component remounting loses uncontrolled input state
**How to avoid:** Keep all section state in parent component, pass down as props
**Warning signs:** User drags section, edited content reverts to previous value
**Solution:** Lift all state to parent, use section.id as key, never store state in sortable components

### Pitfall 4: Preview Lag on Large Templates
**What goes wrong:** Preview becomes sluggish with many sections
**Why it happens:** Re-rendering preview on every keystroke
**How to avoid:** Debounce preview updates (300ms), memoize rendered content
**Warning signs:** Typing feels laggy, high CPU usage
**Solution pattern:**
```typescript
const debouncedTemplate = useDeferredValue(template);
const preview = useMemo(() => renderTemplate(debouncedTemplate), [debouncedTemplate]);
```

### Pitfall 5: File Import Security Issues
**What goes wrong:** Malicious JSON injected via import
**Why it happens:** Trusting imported file content without sanitization
**How to avoid:** Always validate with Zod schema before use, sanitize HTML in content
**Warning signs:** XSS vulnerabilities, schema violations
**Solution:** Zod validation + DOMPurify for any content rendered with dangerouslySetInnerHTML

### Pitfall 6: Clone Workflow Creates Duplicate Names
**What goes wrong:** Cloned templates have same name as original
**Why it happens:** Not appending "(Copy)" or checking uniqueness
**How to avoid:** Current clone API already appends "(Copy)" - ensure UI matches
**Warning signs:** User confused about which template is which
**Solution:** Show "(Copy)" in clone dialog, allow name customization (already implemented)

## Code Examples

Verified patterns from official sources:

### dnd-kit Accessible Announcements
```typescript
// Source: dnd-kit documentation
const announcements = {
  onDragStart({ active }) {
    return `Picked up section ${active.data.current?.name}. Use arrow keys to move.`;
  },
  onDragOver({ active, over }) {
    if (over) {
      return `Section ${active.data.current?.name} is now over ${over.data.current?.name}`;
    }
    return `Section ${active.data.current?.name} is no longer over a droppable area`;
  },
  onDragEnd({ active, over }) {
    if (over) {
      return `Section ${active.data.current?.name} was dropped at position ${over.data.current?.sortable.index + 1}`;
    }
    return `Section ${active.data.current?.name} was dropped`;
  },
  onDragCancel({ active }) {
    return `Dragging was cancelled. Section ${active.data.current?.name} was returned to its original position`;
  }
};

<DndContext announcements={announcements}>
```

### react-resizable-panels Layout Persistence
```typescript
// Source: react-resizable-panels documentation
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

function TemplateBuilder() {
  return (
    <PanelGroup
      direction="horizontal"
      autoSaveId="template-builder-layout" // Persists to localStorage
    >
      <Panel id="editor" order={1} defaultSize={60}>
        <EditorPanel />
      </Panel>
      <PanelResizeHandle />
      <Panel id="preview" order={2} defaultSize={40}>
        <PreviewPanel />
      </Panel>
    </PanelGroup>
  );
}
```

### AI SDK Streaming Structured Output
```typescript
// Source: Vercel AI SDK documentation
import { streamText, Output } from 'ai';

const result = streamText({
  model: openai('gpt-4o'),
  output: Output.object({ schema: generatedTemplateSchema }),
  prompt: templatePrompt,
});

// Stream partial objects as they're generated
for await (const partial of result.partialOutputStream) {
  // partial is a partially-complete template
  setGeneratingTemplate(partial);
}

// Final validated output
const finalTemplate = await result.output;
```

### Existing Motion Variants for Section Animations
```typescript
// Source: Existing lib/motion/variants.ts
import { fadeInUp, staggerChildren } from '@/lib/motion/variants';
import { AnimatePresence, motion } from 'framer-motion';

// Animate section list
<AnimatePresence mode="popLayout">
  {sections.map((section, index) => (
    <motion.div
      key={section.id}
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      exit="exit"
      layout // Smooth position changes during reorder
    >
      <SortableSection section={section} />
    </motion.div>
  ))}
</AnimatePresence>
```

## State of the Art (2026)

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd | @dnd-kit | 2023 | rbd deprecated, dnd-kit actively maintained |
| Manual AI output parsing | AI SDK Output.object() | 2025 (SDK v6) | Guaranteed schema compliance, no post-hoc validation |
| Prompt-only template gen | Structured outputs + schema | 2024 | 100% schema match rate vs ~70% with prompts alone |
| react-split-pane | react-resizable-panels | 2023 | Modern API, better accessibility, React 18 support |
| Separate preview page | Split-pane live preview | 2024 | Industry standard for editors (VS Code, Notion pattern) |

**New tools/patterns to consider:**
- **AI SDK v6 Output.object():** Unifies generateObject and generateText with end-step structured output
- **Zod 4 with AI SDK:** Standard Schema V1 support means any schema library works
- **dnd-kit/accessibility package:** Standalone live region announcements if needed outside DndContext

**Deprecated/outdated:**
- **react-beautiful-dnd:** Last release Dec 2022, maintainers recommend dnd-kit
- **aria-grabbed/aria-dropeffect:** Deprecated in ARIA 1.1, replaced by live regions
- **generateObject standalone:** Replaced by generateText with Output.object() in AI SDK v6

## Template Builder Creation Pathways

Based on success criteria, implement these creation pathways:

| Pathway | Implementation | Priority |
|---------|----------------|----------|
| Manual Creation | Enhanced version of current form + sections | P0 - Existing |
| AI-Assisted | New endpoint with Output.object() structured generation | P0 - Critical |
| Clone Existing | API exists, add "Clone to Edit" from template list/detail | P1 - API exists |
| Import JSON | File input + schema validation | P1 - Simple |
| From Suggestion | "Apply" button on AI suggestions to create sections | P2 - Enhancement |

### Recommended Workflow
1. User selects creation pathway (modal with options)
2. For AI: Enter freeform description, receive validated template
3. For Manual: Use enhanced section editor with reordering
4. For Clone: Pre-populate form with existing template data
5. For Import: Validate JSON, populate form if valid
6. All pathways merge into same editor interface
7. Live preview shows template as user works
8. Save validates with existing Zod schema

## Open Questions

Things that couldn't be fully resolved:

1. **dnd-kit v7 status**
   - What we know: v6.3.1 is current stable, v7 has been in development
   - What's unclear: When v7 releases, breaking changes
   - Recommendation: Use v6.3.x, migration path should be straightforward

2. **AI generation token limits**
   - What we know: Large templates may hit context limits
   - What's unclear: Exact section count that's safe
   - Recommendation: Limit to 8 sections in schema, chunk if needed

3. **Template content size limits**
   - What we know: Current schema allows 10,000 chars content
   - What's unclear: If sections need individual limits
   - Recommendation: Keep current limit, validate on save

## Sources

### Primary (HIGH confidence)
- [dnd-kit Documentation](https://docs.dndkit.com) - Core concepts, accessibility, sortable preset
- [dnd-kit GitHub](https://github.com/clauderic/dnd-kit) - Modern drag-drop toolkit
- [react-resizable-panels npm](https://www.npmjs.com/package/react-resizable-panels) - Split pane implementation
- [Vercel AI SDK Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) - Output.object() patterns
- [OpenAI Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/) - Schema-constrained generation

### Secondary (MEDIUM confidence)
- [Smashing Magazine: Accessible List Reordering](https://www.smashingmagazine.com/2018/01/dragon-drop-accessible-list-reordering/) - a11y patterns (verified with dnd-kit docs)
- [Top 5 Drag-and-Drop Libraries for React 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) - Library comparison
- [AI Hero: Structured Outputs with Vercel AI SDK](https://www.aihero.dev/structured-outputs-with-vercel-ai-sdk) - Implementation examples

### Tertiary (LOW confidence - needs validation if used)
- WebSearch results on form builder patterns (verified against official docs)
- Medium articles on specific implementations (verified patterns with library docs)

## Metadata

**Confidence breakdown:**
- Drag-drop library choice: HIGH - dnd-kit is clearly the standard, well-documented
- AI structured output: HIGH - Vercel AI SDK official docs, already in project
- Split pane library: HIGH - react-resizable-panels widely used, documented
- Import/export patterns: MEDIUM - Standard file API, Zod validation proven
- Accessibility patterns: HIGH - dnd-kit provides built-in, documented

**Research date:** 2026-01-18
**Valid until:** 2026-04-18 (90 days - stable domain, dnd-kit/AI SDK unlikely to have breaking changes)
