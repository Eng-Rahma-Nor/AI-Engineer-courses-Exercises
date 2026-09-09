import axios from 'axios';
import Replicate from 'replicate';
import { config } from '../config.js';
import { generateMockImage } from '../utils/mockImage.js';
import { log } from '../utils/logger.js';

const PROVIDER = 'replicate';

export async function generateImage(prompt) {
  if (!config.replicate.apiToken) {
    log.warn(`${PROVIDER}: no REPLICATE_API_TOKEN set, using mock image`);
    const buffer = await generateMockImage({ prompt, provider: PROVIDER });
    return { provider: PROVIDER, model: 'mock', buffer, prompt };
  }

  const replicate = new Replicate({ auth: config.replicate.apiToken });

  const output = await replicate.run(config.replicate.model, {
    input: {
      prompt,
      width: 1024,
      height: 1024,
      num_outputs: 1,
    },
  });

  // Replicate's SDK typically returns an array of URLs (string or object
  // with a .url()/.href depending on model version).
  const first = Array.isArray(output) ? output[0] : output;
  const imageUrl = typeof first === 'string' ? first : first?.url?.() || first?.href || first;

  const { data } = await axios.get(imageUrl, { responseType: 'arraybuffer' });

  return {
    provider: PROVIDER,
    model: config.replicate.model,
    buffer: Buffer.from(data),
    prompt,
  };
}
