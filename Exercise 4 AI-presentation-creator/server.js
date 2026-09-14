require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "\n⚠️  No OPENAI_API_KEY found. Copy .env.example to .env and add your key before generating a deck.\n"
  );
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/generated", express.static(path.join(__dirname, "generated")));

function systemPrompt(slideCount) {
  return `You write concise, well-structured presentation content. Respond with ONLY a raw JSON object (no markdown fences). Schema:
{"slides":[{"title":string,"bullets":string[],"notes":string,"image_prompt":string}]}

Rules:
- Produce exactly ${slideCount} slides.
- Slide 1 is a title/intro slide (0-2 short bullets).
- The last slide is a closing/summary or call-to-action slide.
- Each middle slide has 3-4 short bullets (under 12 words each).
- "notes" is a 40-70 word spoken narration script for that slide, natural speaking voice, no bullet formatting, no markdown.
- "image_prompt" describes a clean, tasteful illustration or photo concept for that specific slide's idea (not text-in-image, no words or letters in the image, no logos). Keep each prompt visually distinct from the others.`;
}

async function downloadToFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

app.post("/api/generate", async (req, res) => {
  const { topic, slideCount } = req.body;

  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: "Please provide a topic." });
  }
  const count = Math.min(Math.max(parseInt(slideCount, 10) || 5, 3), 8);

  try {
    // 1. Generate the slide plan (titles, bullets, narration script, image concept)
    const planResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt(count) },
        { role: "user", content: `Topic: ${topic}` },
      ],
    });

    const plan = JSON.parse(planResponse.choices[0].message.content);
    if (!Array.isArray(plan.slides) || plan.slides.length === 0) {
      throw new Error("Model did not return any slides.");
    }

    const deckId = Date.now().toString();
    const imageDir = path.join(__dirname, "generated", "images", deckId);
    const audioDir = path.join(__dirname, "generated", "audio", deckId);
    fs.mkdirSync(imageDir, { recursive: true });
    fs.mkdirSync(audioDir, { recursive: true });

    const slides = [];

    // 2. For each slide, generate an image and a narrated audio clip
    for (let i = 0; i < plan.slides.length; i++) {
      const s = plan.slides[i];

      const imageResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt: s.image_prompt,
        size: "1024x1024",
        n: 1,
      });
      const imagePath = path.join(imageDir, `slide-${i}.png`);
      await downloadToFile(imageResponse.data[0].url, imagePath);

      const speechResponse = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: s.notes,
      });
      const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
      const audioPath = path.join(audioDir, `slide-${i}.mp3`);
      fs.writeFileSync(audioPath, audioBuffer);

      slides.push({
        title: s.title,
        bullets: s.bullets || [],
        notes: s.notes,
        imageUrl: `/generated/images/${deckId}/slide-${i}.png`,
        audioUrl: `/generated/audio/${deckId}/slide-${i}.mp3`,
      });
    }

    res.json({ deckId, topic, slides });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Something went wrong generating the deck." });
  }
});

app.listen(PORT, () => {
  console.log(`AI Presentation Creator running at http://localhost:${PORT}`);
});
