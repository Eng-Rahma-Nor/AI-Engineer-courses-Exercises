# Multi-Voice Conversation Generator

Generates a scripted, multi-speaker conversation using OpenAI's TTS model
(`gpt-4o-mini-tts`). Each line of dialogue has its own speaker, voice, and
natural-language `instructions` describing the emotion/delivery — and is
saved as its own audio file.

## Setup

```bash
npm install
cp .env.example .env
# then edit .env and add your real OPENAI_API_KEY
```

## Run

```bash
npm start
```

Audio files are written to `./output/`, one per line, named like:

```
01_Alice_excited.mp3
02_Bob_skeptical.mp3
03_Alice_indignant-but-happy.mp3
04_Bob_warm-apologetic.mp3
```

## Customizing the conversation

Edit the `conversation` array at the top of `index.js`. Each entry:

```js
{
  speaker: 'Alice',       // label, used in the output filename
  voice: 'nova',          // OpenAI voice: alloy, ash, ballad, coral, echo,
                          // fable, nova, onyx, sage, shimmer
  emotion: 'excited',     // short tag, used in the output filename
  instructions: '...',    // free-text delivery direction (tone, pace, mood)
  text: '...'             // the actual line to be spoken
}
```

Add, remove, or reorder entries to build any conversation and number of
speakers — the script loops over the array and generates one file per
entry automatically.

## Notes

- Requires Node 18+ (native `fetch`/`fileURLToPath` support) and an OpenAI
  API key with access to the audio/speech endpoint.
- Turns are generated sequentially to preserve conversation order in the
  console log; switch to `Promise.all` in `main()` if you want them
  generated in parallel instead.
