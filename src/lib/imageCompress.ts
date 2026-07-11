const MAX_WIDTH = 1600;
const MAX_HEIGHT = 1200;
const QUALITY = 0.82;

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  if (file.size < 300_000) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: QUALITY,
    });

    return new File([blob], file.name.replace(/\.\w+$/, '.webp'), {
      type: 'image/webp',
    });
  } catch {
    return file;
  }
}

export function buildStoragePath(folder: string, label: string, ext: string | undefined): string {
  const safeExt = ext || 'jpg';
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'image';
  return `${folder}/${slug}-${Date.now()}.${safeExt}`;
}
