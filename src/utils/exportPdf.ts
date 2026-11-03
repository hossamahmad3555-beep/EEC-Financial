import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { FinancialState } from '../types/financial';

/**
 * Resolves any modern CSS color string (including oklch/oklab/color-mix)
 * into standard rgb/hex using an offscreen 2D canvas context so html2canvas
 * never chokes on Tailwind v4 color functions.
 */
const createColorNormalizer = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  return (cssValue: string): string => {
    if (!cssValue || !ctx) return cssValue;
    if (
      !cssValue.includes('oklch') &&
      !cssValue.includes('oklab') &&
      !cssValue.includes('color-mix')
    ) {
      return cssValue;
    }
    try {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = cssValue;
      return ctx.fillStyle;
    } catch {
      return '#3b256e';
    }
  };
};

/**
 * Generates and downloads a professional multi-page A4 PDF report of the current
 * EEC Financial Management Dashboard using html2canvas and jsPDF.
 */
export async function exportDashboardToPdf(
  financialState: FinancialState,
  targetElementId = 'dashboard-export-container'
): Promise<void> {
  const sourceElement =
    document.getElementById(targetElementId) ||
    (document.querySelector('main') as HTMLElement | null);

  if (!sourceElement) {
    throw new Error('Dashboard container element not found for PDF export.');
  }

  const normalizeColor = createColorNormalizer();
  const isAr = financialState.language === 'ar';
  const activeProject =
    financialState.selectedProject === 'ALL'
      ? isAr
        ? 'جميع المشروعات الهندسية (المحفظة المجمعة)'
        : 'All Engineering Projects (Consolidated Portfolio)'
      : (() => {
          const found = financialState.projects.find(
            (p) => p.id === financialState.selectedProject
          );
          return found
            ? `${found.id} - ${isAr ? found.nameAr : found.nameEn}`
            : financialState.selectedProject;
        })();

  // Capture the dashboard DOM into a high-resolution canvas
  const canvas = await html2canvas(sourceElement, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#f6f3fc',
    logging: false,
    windowWidth: Math.max(sourceElement.scrollWidth, 1360),
    onclone: (clonedDoc, clonedEl) => {
      // Force light mode in the clone for crisp executive report legibility
      clonedDoc.documentElement.classList.remove('dark');
      clonedEl.style.backgroundColor = '#f6f3fc';
      clonedEl.style.padding = '20px';
      clonedEl.style.borderRadius = '0px';

      // Remove interactive utility controls marked as no-print
      const noPrintNodes = clonedEl.querySelectorAll('.no-print, .rgl-drag-handle');
      noPrintNodes.forEach((node) => {
        (node as HTMLElement).style.display = 'none';
      });

      // Normalize any modern CSS color functions on elements inside the cloned tree
      const allElements = clonedEl.querySelectorAll('*');
      const colorProps: (keyof CSSStyleDeclaration)[] = [
        'color',
        'backgroundColor',
        'borderTopColor',
        'borderRightColor',
        'borderBottomColor',
        'borderLeftColor',
        'outlineColor',
      ];

      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const win = clonedDoc.defaultView || window;
        const computed = win.getComputedStyle(htmlEl);

        colorProps.forEach((prop) => {
          const val = computed[prop];
          if (
            typeof val === 'string' &&
            (val.includes('oklch') || val.includes('oklab') || val.includes('color-mix'))
          ) {
            (htmlEl.style as any)[prop] = normalizeColor(val);
          }
        });

        // Strip complex background images containing oklch/color-mix if present
        const bgImage = computed.backgroundImage;
        if (
          bgImage &&
          (bgImage.includes('oklch') ||
            bgImage.includes('oklab') ||
            bgImage.includes('color-mix'))
        ) {
          htmlEl.style.backgroundImage = 'none';
          if (
            !htmlEl.style.backgroundColor ||
            htmlEl.style.backgroundColor === 'rgba(0, 0, 0, 0)'
          ) {
            htmlEl.style.backgroundColor = '#ffffff';
          }
        }
      });
    },
  });

  // Create A4 Landscape PDF for wide executive dashboard charts & tables
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 297 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 210 mm
  const marginX = 10;
  const headerHeight = 24;
  const footerHeight = 10;
  const usableWidth = pageWidth - marginX * 2;
  const usableHeight = pageHeight - headerHeight - footerHeight - 6;

  const drawCorporateHeaderAndFooter = (pageNumber: number, totalPages: number) => {
    // Top Royal Purple Banner
    pdf.setFillColor(40, 22, 82); // #281652
    pdf.rect(0, 0, pageWidth, headerHeight, 'F');

    // Golden Accent Ribbon Line
    pdf.setFillColor(217, 155, 38); // #d99b26
    pdf.rect(0, headerHeight - 1.5, pageWidth, 1.5, 'F');

    // EEC Emblem Circle
    pdf.setFillColor(255, 255, 255);
    pdf.circle(marginX + 7, 11.5, 6.2, 'F');
    pdf.setTextColor(40, 22, 82);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.text('EEC', marginX + 7, 12.6, { align: 'center' });

    // Corporate Title & Department
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Egyptian Engineering Company (EEC)', marginX + 16, 9.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(233, 213, 255);
    pdf.text(
      'Financial Management Department  |  Executive Financial Dashboard Report',
      marginX + 16,
      14.8
    );

    // Right Metadata Summary in Header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(253, 224, 71);
    pdf.text(
      `Fiscal Year: ${financialState.fiscalYear}   |   Period: ${financialState.period}`,
      pageWidth - marginX,
      9.5,
      { align: 'right' }
    );

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    const safeProjectLabel =
      financialState.selectedProject === 'ALL'
        ? 'Portfolio: All Engineering Sites (PRJ-01 to PRJ-05)'
        : `Project Filter: ${financialState.selectedProject}`;
    pdf.text(safeProjectLabel, pageWidth - marginX, 14.8, { align: 'right' });

    // Footer Bar
    pdf.setDrawColor(216, 180, 254);
    pdf.setLineWidth(0.3);
    pdf.line(marginX, pageHeight - footerHeight, pageWidth - marginX, pageHeight - footerHeight);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    pdf.text(
      `Generated by EEC Financial Management ERP  •  ${timestamp}  •  Scope: ${
        activeProject.replace(/[^\x20-\x7E]/g, '').trim() || financialState.selectedProject
      }`,
      marginX,
      pageHeight - 4
    );

    pdf.setFont('helvetica', 'bold');
    pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - marginX, pageHeight - 4, {
      align: 'right',
    });
  };

  // Slice tall canvas across multiple A4 pages cleanly
  const imgWidthPx = canvas.width;
  const imgHeightPx = canvas.height;
  const pxPerMm = imgWidthPx / usableWidth;
  const pageSliceHeightPx = Math.floor(usableHeight * pxPerMm);
  const totalPages = Math.max(1, Math.ceil(imgHeightPx / pageSliceHeightPx));

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    if (pageIndex > 0) {
      pdf.addPage('a4', 'landscape');
    }

    const sourceY = pageIndex * pageSliceHeightPx;
    const sliceHeightPx = Math.min(pageSliceHeightPx, imgHeightPx - sourceY);
    const sliceHeightMm = sliceHeightPx / pxPerMm;

    // Create a temporary canvas for this page's vertical slice
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = imgWidthPx;
    pageCanvas.height = sliceHeightPx;
    const pageCtx = pageCanvas.getContext('2d');

    if (pageCtx) {
      pageCtx.fillStyle = '#f6f3fc';
      pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
      pageCtx.drawImage(
        canvas,
        0,
        sourceY,
        imgWidthPx,
        sliceHeightPx,
        0,
        0,
        imgWidthPx,
        sliceHeightPx
      );

      const sliceDataUrl = pageCanvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(
        sliceDataUrl,
        'JPEG',
        marginX,
        headerHeight + 3,
        usableWidth,
        sliceHeightMm,
        undefined,
        'FAST'
      );
    }

    drawCorporateHeaderAndFooter(pageIndex + 1, totalPages);
  }

  const dateStamp = new Date().toISOString().slice(0, 10);
  const filename = `EEC_Financial_Dashboard_Report_${financialState.fiscalYear}_${financialState.period}_${dateStamp}.pdf`;
  pdf.save(filename);
}
