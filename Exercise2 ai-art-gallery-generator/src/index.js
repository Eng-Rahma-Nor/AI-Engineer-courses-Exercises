import readline from 'readline/promises';
import { stdin, stdout } from 'process';
import { saveImage } from './utils/fileManager.js';
import { scoreImage } from './utils/qualityScorer.js';
import { generateVariations } from './variationGenerator.js';
import { buildGallery } from './galleryBuilder.js';
import { log } from './utils/logger.js';

import { generateImage as openaiGenerate } from './services/openaiService.js';
import { generateImage as replicateGenerate } from './services/replicateService.js';
import { generateImage as falaiGenerate } from './services/falaiService.js';

const PROVIDERS = [
  { name: 'openai', generate: openaiGenerate },
  { name: 'replicate', generate: replicateGenerate },
  { name: 'falai', generate: falaiGenerate },
];

async function getTheme() {
  const cliArg = process.argv.slice(2).join(' ').trim();
  if (cliArg) return cliArg;

  const rl = readline.createInterface({ input: stdin, output: stdout });
  const theme = (await rl.question('Enter a theme for your gallery (e.g. "space exploration"): ')).trim();
  rl.close();
  return theme || 'space exploration';
}

function buildPrompt(theme) {
  return `${theme}, highly detailed digital art, professional illustration, striking composition`;
}

async function generateFromAllProviders(prompt) {
  log.step(`Generating with ${PROVIDERS.length} providers in parallel...`);

  const settled = await Promise.allSettled(
    PROVIDERS.map((p) => p.generate(prompt))
  );

  const results = [];
  settled.forEach((outcome, i) => {
    const providerName = PROVIDERS[i].name;
    if (outcome.status === 'fulfilled') {
      log.success(`${providerName}: image generated`);
      results.push(outcome.value);
    } else {
      log.error(`${providerName}: failed - ${outcome.reason.message}`);
    }
  });

  return results;
}

async function scoreAndSave(theme, results) {
  log.step('Scoring candidates and saving to disk...');
  const scored = [];

  for (const result of results) {
    const { score, metrics } = await scoreImage(result.buffer);
    const { filename } = await saveImage({
      buffer: result.buffer,
      theme,
      provider: result.provider,
      label: 'original',
    });
    scored.push({ ...result, score, metrics, filename, label: 'original' });
    log.info(`${result.provider}: score ${score}  (${filename})`);
  }

  return scored.sort((a, b) => b.score - a.score);
}

async function saveVariations(theme, variations) {
  const saved = [];
  for (const v of variations) {
    const { filename } = await saveImage({
      buffer: v.buffer,
      theme,
      provider: v.provider,
      label: v.label,
    });
    saved.push({ ...v, filename });
  }
  return saved;
}

function printSummary({ theme, scored, best, variations, galleryPath }) {
  log.step('Summary');
  console.log(`Theme:      ${theme}`);
  console.log('Candidates:');
  scored.forEach((c) => {
    const marker = c === best ? '\u2605' : ' ';
    console.log(`  ${marker} ${c.provider.padEnd(10)} score=${String(c.score).padEnd(6)} ${c.filename}`);
  });
  console.log(`Winner:     ${best.provider} (score ${best.score})`);
  console.log(`Variations: ${variations.length} saved`);
  console.log(`Gallery:    ${galleryPath}`);
}

async function main() {
  const theme = await getTheme();
  const prompt = buildPrompt(theme);

  const results = await generateFromAllProviders(prompt);
  if (results.length === 0) {
    log.error('All providers failed to generate an image. Aborting.');
    process.exit(1);
  }

  const scored = await scoreAndSave(theme, results);
  const best = scored[0];
  log.success(`Best result: ${best.provider} with score ${best.score}`);

  log.step(`Generating variations of the winning ${best.provider} image...`);
  const rawVariations = await generateVariations(best);
  const variations = await saveVariations(theme, rawVariations);

  log.step('Building HTML gallery...');
  const galleryPath = await buildGallery({ theme, candidates: scored, best, variations });

  printSummary({ theme, scored, best, variations, galleryPath });
  log.success(`Done. Open ${galleryPath} in a browser to view the gallery.`);
}

main().catch((err) => {
  log.error(`Fatal error: ${err.stack || err.message}`);
  process.exit(1);
});
