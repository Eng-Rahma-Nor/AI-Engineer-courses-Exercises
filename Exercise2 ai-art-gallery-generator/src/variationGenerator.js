import { config } from './config.js';
import { log } from './utils/logger.js';

const SERVICES = {
  openai: () => import('./services/openaiService.js'),
  replicate: () => import('./services/replicateService.js'),
  falai: () => import('./services/falaiService.js'),
};

// Lightweight prompt mutations that nudge a fresh generation away from the
// original without changing the subject. Real "image-to-image" variation
// endpoints differ per provider (and some don't offer one at all), so
// re-prompting the *same* provider is the one approach that works
// uniformly across all three services, including mock mode.
const VARIATION_MODIFIERS = [
  'alternate camera angle, different composition',
  'different lighting mood, same subject and style',
  'closer framing, more dramatic atmosphere',
  'wider shot, softer color palette',
];

export async function generateVariations(bestResult, count = config.variationsCount) {
  const { generateImage } = await SERVICES[bestResult.provider]();
  const variations = [];

  for (let i = 0; i < count; i++) {
    const modifier = VARIATION_MODIFIERS[i % VARIATION_MODIFIERS.length];
    const variationPrompt = `${bestResult.prompt}, ${modifier}`;
    log.info(`Generating variation ${i + 1}/${count} via ${bestResult.provider}...`);
    try {
      const result = await generateImage(variationPrompt);
      variations.push({ ...result, label: `variation-${i + 1}`, variationPrompt });
    } catch (err) {
      log.error(`Variation ${i + 1} failed: ${err.message}`);
    }
  }

  return variations;
}
