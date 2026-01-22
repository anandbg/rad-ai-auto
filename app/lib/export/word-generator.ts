/**
 * Word Document Export Generator
 *
 * This module is dynamically imported only when user triggers Word export,
 * keeping the ~350KB docx library out of the initial bundle.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  BorderStyle,
  LevelFormat,
} from 'docx';
import { saveAs } from 'file-saver';
import type { SectionListStyle } from '@/lib/preferences/preferences-context';
import { getListPrefix, detectSection, getStyleForSection } from '@/lib/report/list-styles';

// Brand template interface for Word export styling
interface BrandTemplate {
  institutionName: string;
  institutionAddress: string;
  footerText: string;
}

// Options for Word export
export interface WordExportOptions {
  templateName?: string;
  modality?: string;
  bodyPart?: string;
  brandTemplate?: BrandTemplate | null;
  listStylePreferences?: SectionListStyle;
}

/**
 * Parse bold text from markdown to docx TextRun elements
 */
function parseBoldText(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(new TextRun({
        text: part.slice(2, -2),
        bold: true,
      }));
    } else if (part) {
      runs.push(new TextRun({ text: part }));
    }
  }

  return runs.length > 0 ? runs : [new TextRun({ text: '' })];
}

/**
 * Generate and download a Word document from report content
 */
export async function generateWord(
  content: string,
  filename: string,
  options: WordExportOptions = {}
): Promise<void> {
  const {
    templateName = 'General',
    modality = 'N/A',
    bodyPart = 'N/A',
    brandTemplate,
    listStylePreferences,
  } = options;

  const institutionName = brandTemplate?.institutionName || 'Medical Center';
  const institutionAddress = brandTemplate?.institutionAddress || '';
  const footerText = brandTemplate?.footerText || 'Generated with AI assistance. User is solely responsible for accuracy. Not medical advice.';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Parse markdown content into docx paragraphs
  const contentParagraphs: Paragraph[] = [];
  const lines = content.split('\n');

  // Track current section for list style preferences
  let currentSection: keyof SectionListStyle | null = null;
  let listItemIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      contentParagraphs.push(new Paragraph({ text: '' }));
      continue;
    }

    // H2 heading - detect section
    if (trimmed.startsWith('## ')) {
      const headingText = trimmed.replace(/^## /, '');
      currentSection = detectSection(headingText);
      listItemIndex = 0; // Reset index for new section
      contentParagraphs.push(
        new Paragraph({
          text: headingText,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 120 },
        })
      );
      continue;
    }

    // H3 heading - also detect section
    if (trimmed.startsWith('### ')) {
      const headingText = trimmed.replace(/^### /, '');
      const detected = detectSection(headingText);
      if (detected) {
        currentSection = detected;
        listItemIndex = 0;
      }
      contentParagraphs.push(
        new Paragraph({
          text: headingText,
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 80 },
        })
      );
      continue;
    }

    // Bullet point or numbered list in markdown
    if (trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
      const bulletText = trimmed.replace(/^-\s*/, '').replace(/^\d+\.\s*/, '');
      const runs = parseBoldText(bulletText);

      // Get style from user preferences for current section
      const style = listStylePreferences
        ? getStyleForSection(currentSection, listStylePreferences)
        : 'bullet';

      if (style === 'none') {
        // Plain paragraph, no bullet - just slight indent
        contentParagraphs.push(
          new Paragraph({
            children: runs,
            spacing: { before: 40, after: 40 },
            indent: { left: 360 },
          })
        );
      } else if (style === 'numbered') {
        // Use Word's native numbering
        contentParagraphs.push(
          new Paragraph({
            children: runs,
            numbering: { reference: 'numberedList', level: 0 },
            spacing: { before: 40, after: 40 },
          })
        );
      } else {
        // Custom bullet character (bullet, dash, or arrow)
        const prefix = getListPrefix(style, listItemIndex);
        contentParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({ text: prefix + ' ' }),
              ...runs,
            ],
            spacing: { before: 40, after: 40 },
            indent: { left: 360, hanging: 180 },
          })
        );
      }
      listItemIndex++;
      continue;
    }

    // Regular paragraph with bold text support
    const runs = parseBoldText(trimmed);
    contentParagraphs.push(
      new Paragraph({
        children: runs,
        spacing: { before: 80, after: 80 },
      })
    );
  }

  // Create the document with numbering config for numbered lists
  const doc = new Document({
    numbering: {
      config: [{
        reference: 'numberedList',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.START,
          style: { paragraph: { indent: { left: 360, hanging: 180 } } },
        }],
      }],
    },
    sections: [{
      properties: {},
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: institutionName,
                  bold: true,
                  size: 32, // 16pt
                }),
              ],
            }),
            ...(institutionAddress ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: institutionAddress,
                    size: 20, // 10pt
                    color: '666666',
                  }),
                ],
              }),
            ] : []),
            new Paragraph({
              border: {
                bottom: {
                  color: '7C3AED',
                  style: BorderStyle.SINGLE,
                  size: 12,
                },
              },
              spacing: { after: 200 },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: footerText,
                  size: 18, // 9pt
                  color: '999999',
                }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: 'AI-Generated Report',
                  size: 16, // 8pt
                  color: 'BBBBBB',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }),
      },
      children: [
        // Metadata section
        new Paragraph({
          children: [
            new TextRun({ text: 'Template: ', bold: true }),
            new TextRun({ text: templateName }),
            new TextRun({ text: '    Modality: ', bold: true }),
            new TextRun({ text: modality }),
          ],
          spacing: { after: 80 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Body Part: ', bold: true }),
            new TextRun({ text: bodyPart }),
            new TextRun({ text: '    Date: ', bold: true }),
            new TextRun({ text: dateStr }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          border: {
            bottom: {
              color: 'E2E8F0',
              style: BorderStyle.SINGLE,
              size: 6,
            },
          },
          spacing: { after: 200 },
        }),
        // Disclaimer banner
        new Paragraph({
          children: [
            new TextRun({
              text: 'AI-GENERATED DRAFT — NOT REVIEWED',
              bold: true,
              size: 24, // 12pt
              color: 'B45309', // amber-700
            }),
          ],
          alignment: AlignmentType.CENTER,
          shading: {
            fill: 'FEF3C7', // amber-100
          },
          spacing: { before: 200, after: 200 },
        }),
        // Report content
        ...contentParagraphs,
      ],
    }],
  });

  // Generate and download the document
  const blob = await Packer.toBlob(doc);
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
  const finalFilename = filename || `radiology-report-${timestamp}.docx`;
  saveAs(blob, finalFilename.endsWith('.docx') ? finalFilename : `${finalFilename}.docx`);
}

/**
 * Generate Word document for the legacy generate page format
 * (Simpler format without markdown parsing)
 */
export async function generateWordSimple(
  content: string,
  filename: string,
  options: {
    templateName?: string;
    modality?: string;
    bodyPart?: string;
  } = {}
): Promise<void> {
  const { templateName = 'Report' } = options;

  // Parse the generated report into sections
  const lines = content.split('\n');
  const paragraphs: Paragraph[] = [];

  // Add header
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'AI Radiologist',
          bold: true,
          size: 48, // 24pt
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Medical Imaging Report',
          size: 28, // 14pt
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${new Date().toLocaleString()}`,
          size: 22, // 11pt
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      border: {
        bottom: {
          color: '333333',
          size: 12,
          style: BorderStyle.SINGLE,
        },
      },
    })
  );

  // Add blank line after header
  paragraphs.push(new Paragraph({ text: '' }));

  // Process each line of the report
  for (const line of lines) {
    if (!line.trim()) {
      // Empty line - add spacing
      paragraphs.push(new Paragraph({ text: '' }));
    } else if (line.startsWith('RADIOLOGY REPORT') || line.startsWith('Template:') || line.startsWith('Modality:') || line.startsWith('Body Part:')) {
      // Metadata lines - bold
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: true,
              size: 24, // 12pt
            }),
          ],
          spacing: { after: 100 },
        })
      );
    } else if (line.match(/^[A-Z][A-Z\s]+:$/)) {
      // Section headers (e.g., "FINDINGS:", "IMPRESSION:")
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              bold: true,
              size: 26, // 13pt
              color: '0066CC',
            }),
          ],
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (line.startsWith('---')) {
      // Separator line
      paragraphs.push(
        new Paragraph({
          text: '',
          border: {
            top: {
              color: 'CCCCCC',
              size: 6,
              style: BorderStyle.SINGLE,
            },
          },
          spacing: { before: 200 },
        })
      );
    } else if (line.startsWith('Generated by')) {
      // Footer text
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              italics: true,
              size: 22, // 11pt
              color: '666666',
            }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { before: 100 },
        })
      );
    } else {
      // Regular text
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 24, // 12pt
            }),
          ],
          spacing: { after: 80 },
        })
      );
    }
  }

  // Add footer
  paragraphs.push(
    new Paragraph({ text: '' }),
    new Paragraph({
      border: {
        top: {
          color: 'CCCCCC',
          size: 6,
          style: BorderStyle.SINGLE,
        },
      },
      spacing: { before: 400 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'This report was generated using AI Radiologist software.',
          size: 20, // 10pt
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: 'Please review all findings with a qualified radiologist.',
          size: 20, // 10pt
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  // Generate and save the file
  const blob = await Packer.toBlob(doc);
  const finalFilename = filename || `radiology-report-${templateName?.replace(/\s+/g, '-').toLowerCase() || 'report'}-${Date.now()}.docx`;
  saveAs(blob, finalFilename.endsWith('.docx') ? finalFilename : `${finalFilename}.docx`);
}
