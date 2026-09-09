import fs from 'fs/promises';
import { config } from './config.js';

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function relImagePath(filename) {
  return `images/${filename}`;
}

function frameCard({ filename, provider, model, score, metrics, isBest, isVariation }) {
  return `
    <figure class="frame ${isBest ? 'frame--best' : ''}">
      <div class="frame__inner">
        <img src="${relImagePath(filename)}" alt="${escapeHtml(provider)} generated artwork" loading="lazy" />
        ${isBest ? '<span class="frame__ribbon">Curator\u2019s pick</span>' : ''}
      </div>
      <figcaption class="plaque">
        <span class="plaque__provider">${escapeHtml(provider)}${model && model !== 'mock' ? ` \u00b7 ${escapeHtml(model)}` : ''}</span>
        ${model === 'mock' ? '<span class="plaque__mock">placeholder, no API key set</span>' : ''}
        ${!isVariation ? `<span class="plaque__score">Score ${score}</span>` : ''}
        ${metrics ? `<span class="plaque__metrics">sharpness ${metrics.sharpness} \u00b7 color ${metrics.colorfulness} \u00b7 ${metrics.resolution}</span>` : ''}
      </figcaption>
    </figure>
  `;
}

export async function buildGallery({ theme, candidates, best, variations }) {
  const candidateCards = candidates
    .map((c) => frameCard({ ...c, isBest: c.provider === best.provider && c.label === best.label }))
    .join('\n');

  const variationCards = variations
    .map((v) => frameCard({ ...v, isVariation: true }))
    .join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escapeHtml(theme)} \u2014 AI Art Gallery</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #17140f;
    --panel: #211d17;
    --frame-dark: #2a2419;
    --gold: #c6a15b;
    --gold-dim: #7d6739;
    --bone: #ede6d8;
    --muted: #9c9384;
    --divider: #3a342a;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    background-image: radial-gradient(circle at 50% 0%, rgba(198,161,91,0.07), transparent 60%);
    color: var(--bone);
    font-family: 'Inter', sans-serif;
    line-height: 1.5;
  }
  .hall {
    max-width: 1100px;
    margin: 0 auto;
    padding: 5rem 2rem 6rem;
  }
  header.intro {
    text-align: center;
    margin-bottom: 4.5rem;
  }
  .eyebrow {
    color: var(--gold);
    font-size: 0.85rem;
    letter-spacing: 0.03em;
  }
  h1.theme-title {
    font-family: 'Fraunces', serif;
    font-weight: 500;
    font-size: clamp(2.2rem, 5vw, 3.4rem);
    margin: 0.4rem 0 0.8rem;
    color: var(--bone);
  }
  .intro p {
    color: var(--muted);
    max-width: 46ch;
    margin: 0 auto;
    font-size: 1rem;
  }
  section.wing {
    margin-bottom: 4rem;
  }
  h2.wing-title {
    font-family: 'Fraunces', serif;
    font-weight: 500;
    font-size: 1.5rem;
    border-bottom: 1px solid var(--divider);
    padding-bottom: 0.6rem;
    margin-bottom: 2rem;
    color: var(--bone);
  }
  .wing-note {
    color: var(--muted);
    font-size: 0.9rem;
    margin: -1.4rem 0 2rem;
  }
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 2.2rem;
  }
  .featured {
    display: flex;
    justify-content: center;
  }
  .featured .frame {
    max-width: 480px;
  }
  figure.frame {
    margin: 0;
    position: relative;
  }
  .frame__inner {
    position: relative;
    padding: 10px;
    background: linear-gradient(155deg, var(--frame-dark), var(--divider));
    border: 1px solid var(--gold-dim);
    box-shadow: 0 18px 40px rgba(0,0,0,0.45);
  }
  .frame--best .frame__inner {
    border-color: var(--gold);
    box-shadow: 0 22px 55px rgba(198,161,91,0.18), 0 18px 40px rgba(0,0,0,0.5);
  }
  .frame__inner img {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
    object-fit: cover;
  }
  .frame__ribbon {
    position: absolute;
    top: 18px;
    right: 0px;
    background: var(--gold);
    color: #1b1710;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.3rem 0.7rem 0.3rem 0.9rem;
    letter-spacing: 0.02em;
  }
  .plaque {
    text-align: center;
    padding-top: 0.9rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .plaque__provider {
    font-family: 'Fraunces', serif;
    font-size: 1.05rem;
    color: var(--bone);
  }
  .plaque__mock {
    font-size: 0.75rem;
    color: var(--gold-dim);
    font-style: italic;
  }
  .plaque__score {
    font-size: 0.85rem;
    color: var(--gold);
  }
  .plaque__metrics {
    font-size: 0.78rem;
    color: var(--muted);
  }
  footer {
    text-align: center;
    color: var(--muted);
    font-size: 0.8rem;
    border-top: 1px solid var(--divider);
    padding-top: 2rem;
  }
</style>
</head>
<body>
  <div class="hall">
    <header class="intro">
      <div class="eyebrow">A generated exhibition</div>
      <h1 class="theme-title">${escapeHtml(theme)}</h1>
      <p>Three interpretations of the same brief, judged side by side, with the strongest developed into a small series.</p>
    </header>

    <section class="wing featured">
      ${frameCard({ ...best, isBest: true })}
    </section>

    <section class="wing">
      <h2 class="wing-title">The three interpretations</h2>
      <p class="wing-note">Every candidate, scored on sharpness, colorfulness and resolution.</p>
      <div class="gallery-grid">
        ${candidateCards}
      </div>
    </section>

    ${variations.length ? `
    <section class="wing">
      <h2 class="wing-title">Variations on the winning piece</h2>
      <p class="wing-note">Re-interpretations of the curator's pick, generated by the same model.</p>
      <div class="gallery-grid">
        ${variationCards}
      </div>
    </section>
    ` : ''}

    <footer>Generated locally &mdash; theme: "${escapeHtml(theme)}"</footer>
  </div>
</body>
</html>
`;

  await fs.writeFile(config.output.galleryFile, html, 'utf-8');
  return config.output.galleryFile;
}
