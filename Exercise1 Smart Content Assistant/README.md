# Smart Content Assistant

A Node.js CLI app that turns a topic into a blog post outline, streams the
generation live, summarizes it in two sentences, and then answers follow-up
questions — all backed by the OpenAI API.

## Features

1. **Topic input** — prompts you for a blog topic.
2. **Outline generation** — asks OpenAI for a structured outline (title, hook,
   sections, sub-bullets, conclusion).
3. **Streaming** — the outline is printed token-by-token as it's generated,
   so you see progress instead of waiting on a blocked call.
4. **2-sentence summary** — a follow-up call condenses the outline.
5. **Follow-up Q&A** — an open-ended loop where you can ask anything about
   the topic; the outline is kept in context so answers stay grounded. Type
   `exit` to quit.
6. **Bonus: temperature control** — choose "factual" (temperature `0.2`,
   precise and conservative) or "creative" (temperature `0.9`, more
   exploratory and varied) before generation starts. The same setting is
   reused for follow-up answers.

## Setup

```bash
npm install
cp .env.example .env
# edit .env and add your OPENAI_API_KEY
```

Optionally set `OPENAI_MODEL` in `.env` to override the default
(`gpt-4o-mini`).

## Run

```bash
npm start
```

Example session:

```
=== Smart Content Assistant ===
What topic would you like a blog post outline about? Remote work productivity

Style — (f)actual/precise or (c)reative/exploratory? [f/c, default f]: f
→ Factual mode selected (temperature 0.2)

--- Generating outline (streaming) ---
[...outline streams in live...]

--- Summarizing outline ---
[...2-sentence summary...]

--- Follow-up Q&A ---
Ask anything about the topic or outline. Type 'exit' to quit.

You: Can you expand on section 2?
Assistant: [...streamed answer...]

You: exit

Goodbye!
```

## Project structure

```
index.js         # main CLI application
package.json     # dependencies (openai, dotenv)
.env.example     # copy to .env and add your API key
```

## Notes

- Uses the OpenAI Node SDK's streaming API (`stream: true`) for the outline
  and follow-up answers; the summary uses a plain (non-streamed) call since
  it's short.
- Requires Node.js 18+ (for native `fetch` support used by the OpenAI SDK).
