# AI Art Gallery Generator

Give it a theme, and it:

1. Generates an image from three different providers in parallel — **OpenAI** (DALL·E 3), **Replicate** (SDXL by default), and **fal.ai** (FLUX by default).
2. Scores each image with a lightweight, dependency-free heuristic (sharpness, colorfulness, resolution) and picks the winner automatically.
3. Generates a few variations of the winning image.
4. Saves every image to disk with a descriptive filename.
5. Builds a styled, self-contained HTML gallery page to browse the results.

**No API keys required to try it.** Any provider whose key is missing runs in **mock mode**: instead of failing, it generates a clearly-labeled placeholder image so the whole pipeline (scoring, variation, gallery) still runs end to end. Add real keys whenever you want real art.

## Setup

```bash
npm install
cp .env.example .env
# edit .env and add whichever API keys you have — all are optional
```

## Usage

```bash
# pass the theme as an argument
npm start -- "space exploration"

# or run it and get prompted
npm start
```

Output lands in `output/`:
- `output/images/*.png` — every original and variation, named like `space-exploration_openai_original.png` / `space-exploration_falai_variation-2.png`
- `output/gallery.html` — open this in a browser to view the exhibition

## How the "best image" is picked

`src/utils/qualityScorer.js` computes three signals per image using `sharp`, with no external API call:

- **Sharpness** — variance of a Laplacian-filtered version of the image (a standard cheap focus/blur proxy; blurry images have low edge variance).
- **Colorfulness/contrast** — average per-channel standard deviation.
- **Resolution** — canvas size, capped so it can't dominate the score.

These combine into a single 0–100 score (weighted 50/35/15). It's intentionally simple and has no external dependencies or extra API costs — swap in a perceptual model or a vision-LLM call later if you want a smarter judge; the scorer is isolated in one file specifically so that's easy.

## Variations

True image-to-image "variation" endpoints differ (or don't exist) across these three providers, so variations are produced by re-prompting the **same provider that won**, with small, template-based modifiers (angle, lighting, framing) appended to the original prompt. This works uniformly across all three services and in mock mode.

## Project layout

```
src/
  config.js              # env-driven settings for all three providers
  index.js               # CLI entry point / pipeline orchestration
  variationGenerator.js  # re-prompts the winning provider for variations
  galleryBuilder.js       # renders output/gallery.html
  services/
    openaiService.js
    replicateService.js
    falaiService.js
  utils/
    mockImage.js         # placeholder generator used when a key is missing
    qualityScorer.js      # sharpness/colorfulness/resolution heuristic
    fileManager.js         # descriptive filenames + saving
    logger.js
```

## Notes on provider setup

- **OpenAI**: needs `OPENAI_API_KEY`. Uses `images.generate` with `dall-e-3` at `1024x1024`.
- **Replicate**: needs `REPLICATE_API_TOKEN`. Defaults to `stability-ai/sdxl`; override with `REPLICATE_MODEL` in `.env` if you prefer another model on Replicate.
- **fal.ai**: needs `FAL_KEY`. Defaults to `fal-ai/flux/dev`; override with `FAL_MODEL`.

Each service module is small and self-contained — swapping a model version, or adding a fourth provider, means adding one file under `src/services/` and one entry in the `PROVIDERS` array in `src/index.js`.
