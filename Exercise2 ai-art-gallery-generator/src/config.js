import dotenv from 'dotenv';

dotenv.config();

export const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || null,
    model: 'dall-e-3',
    size: '1024x1024',
  },
  replicate: {
    apiToken: process.env.REPLICATE_API_TOKEN || null,
    model: process.env.REPLICATE_MODEL || 'stability-ai/sdxl',
  },
  falai: {
    apiKey: process.env.FAL_KEY || null,
    model: process.env.FAL_MODEL || 'fal-ai/flux/dev',
  },
  output: {
    dir: new URL('../output', import.meta.url).pathname,
    imagesDir: new URL('../output/images', import.meta.url).pathname,
    galleryFile: new URL('../output/gallery.html', import.meta.url).pathname,
  },
  variationsCount: 3,
};
