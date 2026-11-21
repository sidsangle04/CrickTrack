import html2canvas from 'html2canvas';

// Render a DOM node to a PNG and hand it to the user as a download.
export async function downloadNodeAsPng(node, filename) {
  if (!node) return false;
  const canvas = await html2canvas(node, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `${filename}.png`;
  link.click();
  return true;
}

export async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}