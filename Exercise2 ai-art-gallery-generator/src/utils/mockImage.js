import sharp from 'sharp';

// Small deterministic hash so the same prompt+provider always gets the same
// placeholder look (handy for comparing "runs" while wiring things up).
function hashToInt(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function hslColor(hue, sat, light) {
  return `hsl(${hue % 360}, ${sat}%, ${light}%)`;
}

function wrapText(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    if ((current + ' ' + word).trim().length > maxChars) {
      lines.push(current.trim());
      current = word;
    } else {
      current = (current + ' ' + word).trim();
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

/**
 * Builds a 1024x1024 PNG placeholder that clearly identifies itself as a
 * mock image (used whenever the real provider's API key isn't configured).
 * This keeps the whole pipeline (scoring, variations, gallery) runnable
 * without any API keys at all.
 */
export async function generateMockImage({ prompt, provider, seed = '' }) {
  const h = hashToInt(provider + prompt + seed);
  const hue1 = h % 360;
  const hue2 = (hue1 + 40 + (h % 60)) % 360;

  const size = 1024;
  const lines = wrapText(prompt, 34);
  const lineHeight = 46;
  const textStartY = size / 2 - (lines.length * lineHeight) / 2;

  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${hslColor(hue1, 55, 28)}" />
          <stop offset="100%" stop-color="${hslColor(hue2, 60, 14)}" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      ${Array.from({ length: 6 }).map((_, i) => {
        const r = 60 + ((h >> (i * 3)) % 220);
        const cx = (h >> (i * 5)) % size;
        const cy = (h >> (i * 7)) % size;
        return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${hslColor((hue1 + i * 35) % 360, 50, 40)}" opacity="0.12" />`;
      }).join('')}
      <text x="50%" y="10%" font-family="Georgia, serif" font-size="28" fill="rgba(255,255,255,0.85)" text-anchor="middle">MOCK · ${provider.toUpperCase()}</text>
      ${lines.map((line, i) => `
        <text x="50%" y="${textStartY + i * lineHeight}" font-family="Georgia, serif" font-size="34"
          fill="rgba(255,255,255,0.92)" text-anchor="middle">${escapeXml(line)}</text>
      `).join('')}
      <text x="50%" y="93%" font-family="monospace" font-size="18" fill="rgba(255,255,255,0.5)" text-anchor="middle">
        no API key configured — placeholder image
      </text>
    </svg>
  `;

  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return buffer;
}

function escapeXml(str) {
  return str.replace(/[<>&'"]/g, (c) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;',
  }[c]));
}
