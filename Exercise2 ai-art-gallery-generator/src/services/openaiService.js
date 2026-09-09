import axios from 'axios';
import OpenAI from 'openai';
import { config } from '../config.js';
import { generateMockImage } from '../utils/mockImage.js';
import { log } from '../utils/logger.js';

const PROVIDER = 'openai';

export async function generateImage(prompt) {
  if (!config.openai.apiKey) {
    log.warn(`${PROVIDER}: no OPENAI_API_KEY set, using mock image`);
    const buffer = await generateMockImage({ prompt, provider: PROVIDER });
    return { provider: PROVIDER, model: 'mock', buffer, prompt };
  }

  const client = new OpenAI({ apiKey: config.openai.apiKey });

  const response = await client.images.generate({
    model: config.openai.model,
    prompt,
    size: config.openai.size,
    n: 1,
  });

  const imageUrl = response.data[0].url;
  const { data } = await axios.get(imageUrl, { responseType: 'arraybuffer' });

  return {
    provider: PROVIDER,
    model: config.openai.model,
    buffer: Buffer.from(data),
    prompt,
  };
}
