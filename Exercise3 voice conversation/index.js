import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import 'dotenv/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, 'output');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Define your multi-voice conversation here.
 * Each entry is ONE line of dialogue from ONE speaker, with its own
 * voice, emotion label, and natural-language "instructions" that steer
 * how gpt-4o-mini-tts performs the line (tone, pace, emphasis, mood).
 *
 * Built-in OpenAI voices you can use: alloy, ash, ballad, coral, echo,
 * fable, nova, onyx, sage, shimmer.
 */
const conversation = [
  {
    speaker: 'Alice',
    voice: 'nova',
    emotion: 'excited',
    instructions:
      'Speak with bright, excited energy, like sharing great news with a close friend. Slightly faster pace, upward inflection at the end of sentences.',
    text: "You will not believe what just happened — I got the job!"
  },
  {
    speaker: 'Bob',
    voice: 'onyx',
    emotion: 'skeptical',
    instructions:
      'Speak slowly and skeptically, with a doubtful, measured tone, as if not fully convinced yet. Slight pause before the question.',
    text: "Wait, really? Are you sure it's official? Last time you thought that too."
  },
  {
    speaker: 'Alice',
    voice: 'nova',
    emotion: 'indignant-but-happy',
    instructions:
      'Speak with a mix of playful annoyance and happiness — a bit indignant, slightly faster, but clearly smiling through the words.',
    text: "I have the signed offer letter right here, so yes, I am very sure."
  },
  {
    speaker: 'Bob',
    voice: 'onyx',
    emotion: 'warm-apologetic',
    instructions:
      'Speak warmly and sincerely, softer tone, genuine and a little apologetic, then let real pride come through.',
    text: "Okay, okay — congratulations, that's amazing news. I'm really proud of you."
  }
];

/**
 * Generate one line of dialogue as its own audio file.
 */
async function generateTurn(turn, index) {
  const safeEmotion = turn.emotion.replace(/\s+/g, '-');
  const fileName = `${String(index + 1).padStart(2, '0')}_${turn.speaker}_${safeEmotion}.mp3`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  console.log(`Generating turn ${index + 1}/${conversation.length}: ${turn.speaker} (${turn.emotion})`);

  const response = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: turn.voice,
    input: turn.text,
    instructions: turn.instructions,
    response_format: 'mp3'
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  console.log(`  -> saved ${fileName}`);
  return filePath;
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error('Missing OPENAI_API_KEY. Copy .env.example to .env and add your key.');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const files = [];
  for (let i = 0; i < conversation.length; i++) {
    // Run sequentially so files stay in conversation order and logs stay readable.
    const filePath = await generateTurn(conversation[i], i);
    files.push(filePath);
  }

  console.log(`\nDone. ${files.length} audio files saved to: ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error('Error generating conversation audio:', err);
  process.exit(1);
});
