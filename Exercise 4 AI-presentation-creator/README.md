# Deckhand — AI Presentation Creator (Node.js + OpenAI)

Generates a full slide deck from a topic: titles and talking points (GPT),
a generated image per slide (DALL·E 3), and narrated audio per slide
(OpenAI TTS) — served through a small Express app with a browser UI.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Add your API key:
   ```
   cp .env.example .env
   ```
   Then open `.env` and paste your OpenAI API key in place of `sk-your-key-here`.
   Get a key at https://platform.openai.com/api-keys — the account needs
   billing enabled, since image and audio generation aren't on the free tier.

3. Run it:
   ```
   npm start
   ```

4. Open http://localhost:3000, type a topic, pick a slide count, and click
   **Generate deck**.

## How it works

- `POST /api/generate` asks `gpt-4o-mini` for structured JSON: each slide's
  title, bullets, a narration script, and an image concept.
- For each slide, the server calls `images.generate` (DALL·E 3) and
  `audio.speech.create` (TTS) and saves the results under `generated/`.
- The browser polls nothing — it just waits for the one response, then
  renders the deck with a thumbnail rail, image, bullets, and a play button
  for the narration.

## Notes on cost and speed

- A deck generates its images and audio sequentially, one slide at a time,
  so an 8-slide deck can take a minute or two — that's normal.
- Every generation calls paid endpoints (chat, DALL·E 3, TTS). Keep an eye on
  usage at https://platform.openai.com/usage if you're testing repeatedly.
- Generated images/audio pile up under `generated/`. Feel free to delete old
  deck folders (named by timestamp) once you're done with them.

## Customizing

- Swap the TTS voice in `server.js` (`voice: "alloy"`) — options include
  `echo`, `fable`, `onyx`, `nova`, `shimmer`.
- Swap the image size/model in `server.js` if you want faster/cheaper drafts
  (e.g. `dall-e-2` at `512x512`) versus higher-quality final output.
- Slide copy rules live in the `systemPrompt()` function in `server.js`.
