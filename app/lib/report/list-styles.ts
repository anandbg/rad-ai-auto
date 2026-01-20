import { ListStyle, SectionListStyle } from '@/lib/preferences/preferences-context';

/**
 * Get the list prefix character(s) for a given style
 * @param style - The list style type
 * @param index - Optional index for numbered lists (0-based)
 * @returns The prefix string
 */
export function getListPrefix(style: ListStyle, index?: number): string {
  switch (style) {
    case 'bullet':
      return '\u2022'; // •
    case 'dash':
      return '-';
    case 'arrow':
      return '\u2192'; // →
    case 'numbered':
      return `${(index ?? 0) + 1}.`;
    case 'none':
      return '';
    default:
      return '\u2022'; // • default
  }
}

type ReportSection = keyof SectionListStyle;

const SECTION_HEADING_MAP: Record<string, ReportSection> = {
  'clinical information': 'clinicalInfo',
  'clinical info': 'clinicalInfo',
  'history': 'clinicalInfo',
  'indication': 'clinicalInfo',
  'technique': 'technique',
  'comparison': 'comparison',
  'findings': 'findings',
  'impression': 'impression',
  'conclusion': 'impression',
};

/**
 * Detect report section from a heading text
 */
export function detectSection(headingText: string): ReportSection | null {
  const normalized = headingText.toLowerCase().trim();
  for (const [key, section] of Object.entries(SECTION_HEADING_MAP)) {
    if (normalized.includes(key)) {
      return section;
    }
  }
  return null;
}

/**
 * Get the list style for a specific section
 */
export function getStyleForSection(
  section: ReportSection | null,
  preferences: SectionListStyle | undefined
): ListStyle {
  if (!section || !preferences) {
    return 'bullet'; // Default
  }
  return preferences[section] || 'bullet';
}

/**
 * Get markdown list prefix for a given style
 * Returns markdown-compatible prefix (- for bullets, 1. for numbered)
 */
function getMarkdownPrefix(style: ListStyle, index: number): string {
  switch (style) {
    case 'bullet':
    case 'dash':
    case 'arrow':
      // All use markdown bullet syntax, visual style handled by CSS/custom rendering
      return '- ';
    case 'numbered':
      return `${index + 1}. `;
    case 'none':
      // For 'none', we use a special marker that we'll handle in rendering
      return '- ';
    default:
      return '- ';
  }
}

/**
 * Transform markdown content to apply list style preferences
 * Converts list items based on section and user preferences
 */
export function transformMarkdownListStyles(
  markdown: string,
  preferences: SectionListStyle | undefined
): string {
  if (!markdown || !preferences) {
    return markdown;
  }

  const lines = markdown.split('\n');
  const result: string[] = [];
  let currentSection: ReportSection | null = null;
  let listItemIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect section from headings (## or ###)
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      const headingText = trimmed.replace(/^##+\s*/, '');
      currentSection = detectSection(headingText);
      listItemIndex = 0; // Reset index for new section
      result.push(line);
      continue;
    }

    // Check if this is a list item (bullet or numbered)
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    const numberedMatch = trimmed.match(/^\d+\.\s+(.*)$/);

    if (bulletMatch || numberedMatch) {
      const itemText = bulletMatch ? bulletMatch[1] : numberedMatch![1];
      const style = getStyleForSection(currentSection, preferences);
      const prefix = getMarkdownPrefix(style, listItemIndex);

      // Preserve original indentation
      const indent = line.match(/^(\s*)/)?.[1] || '';
      result.push(`${indent}${prefix}${itemText}`);
      listItemIndex++;
    } else {
      // Not a list item, check if we should reset index (blank line or new paragraph)
      if (trimmed === '') {
        listItemIndex = 0;
      }
      result.push(line);
    }
  }

  return result.join('\n');
}
