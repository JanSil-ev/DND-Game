export function isImageSource(image: string): boolean {
  if (!image) return true;
  if (image.length > 700000) return false;
  if (/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(image)) return true;
  if (image.startsWith('/') && !image.startsWith('//') && !image.includes('\\')) return true;
  try { return ['https:', 'http:'].includes(new URL(image).protocol); } catch { return false; }
}
