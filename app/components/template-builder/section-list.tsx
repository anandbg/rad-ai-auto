'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  type DragCancelEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableSection } from './sortable-section';
import { type TemplateSection } from '@/lib/validation/template-schema';

export interface SectionListProps {
  sections: TemplateSection[];
  onReorder: (sections: TemplateSection[]) => void;
  onUpdateSection: (id: string, field: 'name' | 'content', value: string) => void;
  onRemoveSection: (id: string) => void;
}

export function SectionList({
  sections,
  onReorder,
  onUpdateSection,
  onRemoveSection,
}: SectionListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedSections = arrayMove(sections, oldIndex, newIndex);
        onReorder(reorderedSections);
      }
    }
  }

  // Accessible announcements for screen readers
  const announcements = {
    onDragStart({ active }: DragStartEvent) {
      const section = sections.find((s) => s.id === active.id);
      return `Picked up section ${section?.name || 'untitled'}. Use arrow keys to move.`;
    },
    onDragOver({ active, over }: DragOverEvent) {
      const activeSection = sections.find((s) => s.id === active.id);
      if (over) {
        const overSection = sections.find((s) => s.id === over.id);
        return `Section ${activeSection?.name || 'untitled'} is now over ${overSection?.name || 'untitled'}`;
      }
      return `Section ${activeSection?.name || 'untitled'} is no longer over a droppable area`;
    },
    onDragEnd({ active, over }: DragEndEvent) {
      const activeSection = sections.find((s) => s.id === active.id);
      if (over) {
        const overIndex = sections.findIndex((s) => s.id === over.id);
        return `Section ${activeSection?.name || 'untitled'} was dropped at position ${overIndex + 1}`;
      }
      return `Section ${activeSection?.name || 'untitled'} was dropped`;
    },
    onDragCancel({ active }: DragCancelEvent) {
      const section = sections.find((s) => s.id === active.id);
      return `Dragging was cancelled. Section ${section?.name || 'untitled'} was returned to its original position`;
    },
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements }}
    >
      <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
        {sections.map((section) => (
          <SortableSection
            key={section.id}
            id={section.id}
            section={section}
            onUpdate={onUpdateSection}
            onRemove={onRemoveSection}
          />
        ))}
      </SortableContext>
    </DndContext>
  );
}
