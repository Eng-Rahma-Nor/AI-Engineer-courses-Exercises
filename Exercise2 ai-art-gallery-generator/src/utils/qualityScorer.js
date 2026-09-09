import sharp from 'sharp';

// A Laplacian kernel highlights edges; the variance of the result is a
// well-known cheap proxy for sharpness/focus (blurry images -> low variance).
const LAPLACIAN_KERNEL = {
  width: 3,
  height: 3,
  kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0],
};

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function variance(arr, avg) {
  return mean(arr.map((v) => (v - avg) ** 2));
}

async function sharpnessScore(image) {
  const { data, info } = await image
    .clone()
    .greyscale()
    .convolve(LAPLACIAN_KERNEL)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = Array.from(data);
  const avg = mean(pixels);
  return { variance: variance(pixels, avg), pixelCount: info.width * info.height };
}

async function colorfulnessScore(image) {
  const stats = await image.clone().stats();
  // Average per-channel standard deviation as a simple colorfulness/contrast proxy.
  const stdevs = stats.channels.map((c) => c.stdev);
  return mean(stdevs);
}

/**
 * Produces a 0-100 composite quality score for an image buffer, combining:
 *  - sharpness (Laplacian variance, normalized)
 *  - contrast/colorfulness (per-channel stdev)
 *  - resolution (bigger canvas = slightly favored, capped)
 * This is a lightweight heuristic, not a perceptual ML model — good enough
 * to auto-rank a handful of candidate generations without any extra API.
 */
export async function scoreImage(buffer) {
  const image = sharp(buffer);
  const metadata = await image.metadata();

  const { variance: sharpVar } = await sharpnessScore(image);
  const colorfulness = await colorfulnessScore(image);
  const resolutionFactor = Math.min((metadata.width * metadata.height) / (1024 * 1024), 1);

  // Empirically-reasonable normalization caps so each component maps to ~0-100.
  const sharpnessNorm = Math.min((sharpVar / 800) * 100, 100);
  const colorfulnessNorm = Math.min((colorfulness / 80) * 100, 100);
  const resolutionNorm = resolutionFactor * 100;

  const score = Number(
    (sharpnessNorm * 0.5 + colorfulnessNorm * 0.35 + resolutionNorm * 0.15).toFixed(1)
  );

  return {
    score,
    metrics: {
      sharpness: Number(sharpnessNorm.toFixed(1)),
      colorfulness: Number(colorfulnessNorm.toFixed(1)),
      resolution: `${metadata.width}x${metadata.height}`,
    },
  };
}
