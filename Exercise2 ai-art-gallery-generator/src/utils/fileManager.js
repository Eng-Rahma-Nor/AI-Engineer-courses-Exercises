import fs from 'fs/promises';
import path from 'path';
import { config } from '../config.js';

export async function ensureOutputDirs() {
  await fs.mkdir(config.output.imagesDir, { recursive: true });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'untitled';
}

/**
 * Saves an image buffer with a descriptive filename like:
 *   space-exploration_openai_original.png
 *   space-exploration_replicate_variation-2.png
 * Returns the absolute path and the filename (for use in gallery HTML).
 */
export async function saveImage({ buffer, theme, provider, label }) {
  await ensureOutputDirs();
  const filename = `${slugify(theme)}_${provider}_${slugify(label)}.png`;
  const filePath = path.join(config.output.imagesDir, filename);
  await fs.writeFile(filePath, buffer);
  return { filePath, filename };
}
