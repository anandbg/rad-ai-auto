/**
 * PDF Document Export Generator
 *
 * This module is dynamically imported only when user triggers PDF export,
 * keeping the ~280KB jsPDF library out of the initial bundle.
 */

import jsPDF from 'jspdf';
import type { SectionListStyle } from '@/lib/preferences/preferences-context';
import { getListPrefix, detectSection, getStyleForSection } from '@/lib/report/list-styles';

// Brand template interface for PDF export styling
interface BrandTemplate {
  primaryColor: string;
  institutionName: string;
  institutionAddress: string;
  footerText: string;
}

// Options for PDF export
export interface PDFExportOptions {
  templateName?: string;
  modality?: string;
  bodyPart?: string;
  brandTemplate?: BrandTemplate | null;
  listStylePreferences?: SectionListStyle;
}

/**
 * Convert hex color to RGB tuple
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result && result[1] && result[2] && result[3]) {
    return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
  }
  return [124, 58, 237]; // default purple
}

/**
 * Generate and download a PDF from markdown report content
 */
export async function generatePDF(
  content: string,
  filename: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    templateName = 'General',
    modality = 'N/A',
    bodyPart = 'N/A',
    brandTemplate,
    listStylePreferences,
  } = options;

  const primaryColor = brandTemplate?.primaryColor || '#7C3AED';
  const institutionName = brandTemplate?.institutionName || 'Medical Center';
  const institutionAddress = brandTemplate?.institutionAddress || '';
  const footerText = brandTemplate?.footerText || 'Generated with AI assistance. User is solely responsible for accuracy. Not medical advice.';

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Create PDF with native jsPDF text rendering for proper page breaks
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  const footerHeight = 25;
  const maxY = pageHeight - margin - footerHeight;
  let y = margin;

  // Helper to check if we need a new page
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > maxY) {
      addFooter();
      pdf.addPage();
      y = margin;
    }
  };

  // Add footer to current page
  const addFooter = () => {
    const footerY = pageHeight - margin;
    pdf.setDrawColor(226, 232, 240); // slate-200
    pdf.line(margin, footerY - 15, pageWidth - margin, footerY - 15);
    pdf.setFontSize(9);
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text(footerText, margin, footerY - 8);
    pdf.setFontSize(8);
    pdf.setTextColor(203, 213, 225); // slate-300
    pdf.text(`AI-Generated Report | Exported: ${now.toISOString()}`, margin, footerY - 2);
  };

  // --- HEADER ---
  const [r, g, b] = hexToRgb(primaryColor);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(r, g, b);
  pdf.text(institutionName, margin, y);
  y += 8;

  if (institutionAddress) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139); // slate-500
    pdf.text(institutionAddress, margin, y);
    y += 6;
  }

  // Header line
  pdf.setDrawColor(r, g, b);
  pdf.setLineWidth(0.8);
  pdf.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 10;

  // --- METADATA BOX ---
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
  y += 5;

  pdf.setFontSize(10);
  pdf.setTextColor(71, 85, 105); // slate-600
  pdf.setFont('helvetica', 'bold');
  pdf.text('Template:', margin + 4, y + 3);
  pdf.setFont('helvetica', 'normal');
  pdf.text(templateName, margin + 26, y + 3);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Modality:', margin + contentWidth / 2, y + 3);
  pdf.setFont('helvetica', 'normal');
  pdf.text(modality, margin + contentWidth / 2 + 22, y + 3);

  y += 7;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Body Part:', margin + 4, y + 3);
  pdf.setFont('helvetica', 'normal');
  pdf.text(bodyPart, margin + 26, y + 3);

  pdf.setFont('helvetica', 'bold');
  pdf.text('Date:', margin + contentWidth / 2, y + 3);
  pdf.setFont('helvetica', 'normal');
  pdf.text(dateStr, margin + contentWidth / 2 + 14, y + 3);

  y += 15;

  // --- DISCLAIMER BANNER ---
  pdf.setFillColor(254, 243, 199); // amber-100
  pdf.roundedRect(margin, y, contentWidth, 12, 2, 2, 'F');
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(180, 83, 9); // amber-700
  pdf.text('AI-GENERATED DRAFT — NOT REVIEWED', pageWidth / 2, y + 8, { align: 'center' });
  y += 18;

  // --- CONTENT ---
  const lines = content.split('\n');

  // Track current section for list style preferences
  let currentSection: keyof SectionListStyle | null = null;
  let listItemIndex = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      y += 3;
      continue;
    }

    // H2 heading - detect section
    if (trimmed.startsWith('## ')) {
      const headingText = trimmed.replace(/^## /, '');
      currentSection = detectSection(headingText);
      listItemIndex = 0; // Reset index for new section
      checkPageBreak(12);
      y += 4;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 41, 59); // slate-800
      pdf.text(headingText, margin, y);
      y += 8;
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
      checkPageBreak(10);
      y += 2;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(51, 65, 85); // slate-700
      pdf.text(headingText, margin, y);
      y += 7;
      continue;
    }

    // Bullet point or numbered list
    if (trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
      const bulletText = trimmed.replace(/^-\s*/, '').replace(/^\d+\.\s*/, '');

      // Get style from user preferences for current section
      const style = listStylePreferences
        ? getStyleForSection(currentSection, listStylePreferences)
        : 'bullet';
      const prefix = getListPrefix(style, listItemIndex);
      listItemIndex++;

      // Parse bold sections within the line
      const parts = bulletText.split(/(\*\*[^*]+\*\*)/g);

      // Calculate wrapped lines
      pdf.setFontSize(10);
      const wrappedLines = pdf.splitTextToSize(bulletText.replace(/\*\*/g, ''), contentWidth - 10);
      checkPageBreak(wrappedLines.length * 5 + 2);

      pdf.setTextColor(71, 85, 105); // slate-600
      pdf.setFont('helvetica', 'normal');

      // Adjust indentation based on whether we have a prefix
      const textIndent = prefix ? margin + 8 : margin + 2;
      if (prefix) {
        pdf.text(prefix, margin + 2, y);
      }

      // Render with bold support
      let xPos = textIndent;
      for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
          pdf.setFont('helvetica', 'bold');
          const boldText = part.slice(2, -2);
          pdf.text(boldText, xPos, y);
          xPos += pdf.getTextWidth(boldText);
        } else if (part) {
          pdf.setFont('helvetica', 'normal');
          // Handle text wrapping for long content
          const partLines = pdf.splitTextToSize(part, contentWidth - (xPos - margin));
          if (partLines.length > 1) {
            // First line at current position
            pdf.text(partLines[0], xPos, y);
            // Remaining lines wrapped
            for (let i = 1; i < partLines.length; i++) {
              y += 5;
              checkPageBreak(5);
              pdf.text(partLines[i], textIndent, y);
            }
            xPos = textIndent + pdf.getTextWidth(partLines[partLines.length - 1]);
          } else {
            pdf.text(part, xPos, y);
            xPos += pdf.getTextWidth(part);
          }
        }
      }
      y += 5;
      continue;
    }

    // Regular paragraph with bold support
    pdf.setFontSize(10);
    pdf.setTextColor(71, 85, 105); // slate-600

    // Handle bold text within paragraph
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    const plainText = trimmed.replace(/\*\*/g, '');
    const wrappedLines = pdf.splitTextToSize(plainText, contentWidth);
    checkPageBreak(wrappedLines.length * 5 + 2);

    let xPos = margin;
    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**')) {
        pdf.setFont('helvetica', 'bold');
        const boldText = part.slice(2, -2);
        pdf.text(boldText, xPos, y);
        xPos += pdf.getTextWidth(boldText);
      } else if (part) {
        pdf.setFont('helvetica', 'normal');
        const partLines = pdf.splitTextToSize(part, contentWidth - (xPos - margin));
        if (partLines.length > 1) {
          pdf.text(partLines[0], xPos, y);
          for (let i = 1; i < partLines.length; i++) {
            y += 5;
            checkPageBreak(5);
            pdf.text(partLines[i], margin, y);
          }
          xPos = margin + pdf.getTextWidth(partLines[partLines.length - 1]);
        } else {
          pdf.text(part, xPos, y);
          xPos += pdf.getTextWidth(part);
        }
      }
    }
    y += 5;
  }

  // Add footer to the last page
  addFooter();

  // Generate filename with timestamp
  const timestamp = now.toISOString().slice(0, 19).replace(/[:-]/g, '');
  const finalFilename = filename || `radiology-report-${timestamp}.pdf`;
  pdf.save(finalFilename.endsWith('.pdf') ? finalFilename : `${finalFilename}.pdf`);
}

/**
 * Generate PDF using browser print dialog (legacy method from generate page)
 * This opens a print-to-PDF dialog with professional styling
 */
export function generatePDFPrintDialog(
  sections: Array<{ name: string; content: string }>,
  options: {
    templateName?: string;
    modality?: string;
    bodyPart?: string;
  } = {}
): Window | null {
  const { templateName = 'Report', modality = 'N/A', bodyPart = 'N/A' } = options;

  const generationDate = new Date();
  const formattedDate = generationDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = generationDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Create a printable HTML document
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return null;
  }

  // Build sections HTML with professional styling
  const sectionsHtml = sections.map(section => {
    if (section.name === 'HEADER') {
      return ''; // Skip header section, we have custom header
    }
    if (section.name === 'FOOTER') {
      return ''; // Skip footer section, we have custom footer
    }
    return `
      <div class="report-section">
        <h3 class="section-header">${section.name}</h3>
        <div class="section-content">${section.content.replace(/\n/g, '<br>')}</div>
      </div>
    `;
  }).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Radiology Report - ${templateName}</title>
        <style>
          /* Base document styling */
          * {
            box-sizing: border-box;
          }
          body {
            font-family: 'Times New Roman', 'Georgia', serif;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            line-height: 1.6;
            color: #000;
            background: #fff;
          }

          /* Header styling */
          .document-header {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .document-header h1 {
            font-size: 28px;
            font-weight: bold;
            margin: 0 0 5px 0;
            text-transform: uppercase;
            letter-spacing: 2px;
          }
          .document-header .subtitle {
            font-size: 16px;
            font-weight: normal;
            margin: 0 0 15px 0;
            color: #333;
          }

          /* Metadata table */
          .metadata {
            width: 100%;
            margin: 15px 0;
            border-collapse: collapse;
            font-size: 12px;
          }
          .metadata td {
            padding: 4px 10px;
            vertical-align: top;
          }
          .metadata .label {
            font-weight: bold;
            width: 120px;
            text-align: right;
            color: #333;
          }
          .metadata .value {
            text-align: left;
          }

          /* AI indicator badge */
          .ai-indicator {
            display: inline-block;
            background: #f0f0f0;
            border: 1px solid #ccc;
            border-radius: 4px;
            padding: 4px 12px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 10px;
          }

          /* Report sections */
          .report-body {
            margin: 30px 0;
          }
          .report-section {
            margin-bottom: 24px;
            page-break-inside: avoid;
          }
          .section-header {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0 0 8px 0;
            padding-bottom: 4px;
            border-bottom: 1px solid #999;
          }
          .section-content {
            font-size: 13px;
            line-height: 1.8;
            margin-left: 0;
            text-align: justify;
          }

          /* Footer styling */
          .document-footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 2px solid #000;
          }
          .disclaimer {
            font-size: 11px;
            color: #333;
            text-align: center;
            font-style: italic;
            line-height: 1.6;
            margin: 0;
            padding: 15px 20px;
            background: #f9f9f9;
            border: 1px solid #ddd;
          }
          .footer-note {
            font-size: 10px;
            color: #666;
            text-align: center;
            margin-top: 15px;
          }

          /* Print optimization */
          @media print {
            body {
              margin: 0;
              padding: 0.75in;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .document-header {
              page-break-after: avoid;
            }
            .report-section {
              page-break-inside: avoid;
            }
            .section-header {
              page-break-after: avoid;
            }
            .document-footer {
              page-break-inside: avoid;
            }
            /* Remove any background colors for print */
            .ai-indicator {
              background: #f0f0f0 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .disclaimer {
              background: #f9f9f9 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }

          @page {
            margin: 0.5in;
            size: letter;
          }
        </style>
      </head>
      <body>
        <div class="document-header">
          <h1>Radiology Report</h1>
          <p class="subtitle">Medical Imaging Documentation</p>
          <table class="metadata">
            <tr>
              <td class="label">Template:</td>
              <td class="value">${templateName}</td>
              <td class="label">Date:</td>
              <td class="value">${formattedDate}</td>
            </tr>
            <tr>
              <td class="label">Modality:</td>
              <td class="value">${modality}</td>
              <td class="label">Time:</td>
              <td class="value">${formattedTime}</td>
            </tr>
            <tr>
              <td class="label">Body Part:</td>
              <td class="value">${bodyPart}</td>
              <td class="label"></td>
              <td class="value"></td>
            </tr>
          </table>
          <span class="ai-indicator">AI-Generated Report</span>
        </div>

        <div class="report-body">
          ${sectionsHtml}
        </div>

        <div class="document-footer">
          <p class="disclaimer">
            This report was generated using AI Radiologist software. All AI-generated findings
            and impressions should be reviewed and verified by a qualified radiologist before
            clinical use. This document is intended to assist, not replace, professional
            medical judgment.
          </p>
          <p class="footer-note">
            Generated by AI Radiologist &bull; ${formattedDate} at ${formattedTime}
          </p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    printWindow.print();
  };

  return printWindow;
}
