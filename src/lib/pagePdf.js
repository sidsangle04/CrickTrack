// Turns whatever is rendered on the current page into a downloadable PDF.
// The page content is captured as an image and sliced across A4 pages.
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const BACKGROUND = '#0f172a';

export const pdfFilename = (base) => {
  const slug = String(base || 'cricktrack')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || 'cricktrack'}.pdf`;
};

export async function downloadElementPdf(element, filename = 'cricktrack.pdf') {
  if (!element) return false;

  const height = Math.max(element.scrollHeight || 0, 1);
  const scale = Math.min(2, Math.max(1, 8000 / height));

  const canvas = await html2canvas(element, {
    backgroundColor: BACKGROUND,
    scale,
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const imageWidth = pageWidth - margin * 2;
  const ptPerPx = imageWidth / canvas.width;
  const pagePx = Math.max(1, Math.floor((pageHeight - margin * 2) / ptPerPx));

  let offset = 0;
  let page = 0;
  while (offset < canvas.height) {
    const sliceHeight = Math.min(pagePx, canvas.height - offset);
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = sliceHeight;
    const ctx = slice.getContext('2d');
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, offset, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

    if (page > 0) pdf.addPage();
    pdf.addImage(
      slice.toDataURL('image/jpeg', 0.9),
      'JPEG',
      margin,
      margin,
      imageWidth,
      sliceHeight * ptPerPx
    );

    offset += sliceHeight;
    page += 1;
  }

  pdf.save(filename);
  return true;
}