// File name for a saved "sold" card photo.
export const soldCardFilename = (name) => {
  const slug = String(name || 'player')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `cricktrack-sold-${slug || 'player'}`;
};