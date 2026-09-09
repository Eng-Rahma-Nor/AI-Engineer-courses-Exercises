import axios from 'axios';
import { fal } from '@fal-ai/client';
import { config } from '../config.js';
import { generateMockImage } from '../utils/mockImage.js';
import { log } from '../utils/logger.js';

const PROVIDER = 'falai';
let configured = false;

function ensureConfigured() {
  if (!configured) {
    fal.config({ credentials: config.falai.apiKey });
    configured = true;
  }
}

export async function generateImage(prompt) {
  if (!config.falai.apiKey) {
    log.warn(`${PROVIDER}: no FAL_KEY set, using mock image`);
    const buffer = await generateMockImage({ prompt, provider: PROVIDER });
    return { provider: PROVIDER, model: 'mock', buffer, prompt };
  }

  ensureConfigured();

  const result = await fal.subscribe(config.falai.model, {
    input: {
      prompt,
      image_size: 'square_hd',
      num_images: 1,
    },
  });

  const imageUrl = result?.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error('fal.ai response did not include an image URL');
  }

  const { data } = await axios.get(imageUrl, { responseType: 'arraybuffer' });

  return {
    provider: PROVIDER,
    model: config.falai.model,
    buffer: Buffer.from(data),
    prompt,
  };
}
