import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const rl = readline.createInterface({ input, output });

/**
 * Streams a chat completion to stdout as it arrives, and returns the
 * full concatenated text once the stream ends.
 */
async function streamCompletion(messages, temperature) {
  const stream = await openai.chat.completions.create({
    model: MODEL,
    messages,
    temperature,
    stream: true,
  });

  let fullText = "";
  for await (const chunk of stream) {
    const piece = chunk.choices?.[0]?.delta?.content || "";
    if (piece) {
      process.stdout.write(piece);
      fullText += piece;
    }
  }
  process.stdout.write("\n");
  return fullText;
}

/** Non-streamed completion, used for short tasks like the 2-sentence summary. */
async function completion(messages, temperature) {
  const res = await openai.chat.completions.create({
    model: MODEL,
    messages,
    temperature,
  });
  return res.choices[0].message.content.trim();
}

async function chooseTemperature() {
  const answer = (
    await rl.question(
      "\nStyle — (f)actual/precise or (c)reative/exploratory? [f/c, default f]: "
    )
  )
    .trim()
    .toLowerCase();

  if (answer.startsWith("c")) {
    console.log("→ Creative mode selected (temperature 0.9)\n");
    return 0.9;
  }
  console.log("→ Factual mode selected (temperature 0.2)\n");
  return 0.2;
}

async function main() {
  console.log("=== Smart Content Assistant ===");
  console.log("Generate a blog outline, get a quick summary, then ask follow-up questions.\n");

  const topic = await rl.question("What topic would you like a blog post outline about? ");
  if (!topic.trim()) {
    console.log("No topic provided. Exiting.");
    rl.close();
    return;
  }

  const temperature = await chooseTemperature();

  const outlineMessages = [
    {
      role: "system",
      content:
        "You are a skilled content strategist. Produce clear, well-structured blog post outlines with a title, an intro hook, 4-6 main sections (each with 2-3 sub-bullets), and a conclusion.",
    },
    {
      role: "user",
      content: `Create a blog post outline about: "${topic}"`,
    },
  ];

  console.log("--- Generating outline (streaming) ---\n");
  const outline = await streamCompletion(outlineMessages, temperature);

  console.log("\n--- Summarizing outline ---\n");
  const summaryMessages = [
    {
      role: "system",
      content: "Summarize the given blog outline in exactly 2 concise sentences. No preamble.",
    },
    { role: "user", content: outline },
  ];
  const summary = await completion(summaryMessages, 0.3);
  console.log(summary + "\n");

  console.log("--- Follow-up Q&A ---");
  console.log("Ask anything about the topic or outline. Type 'exit' to quit.\n");

  // Conversation history keeps the outline as context so follow-ups stay grounded.
  const history = [
    {
      role: "system",
      content: `You are a helpful assistant answering follow-up questions about the topic "${topic}". Here is the outline you generated earlier for reference:\n\n${outline}\n\nAnswer follow-up questions clearly and concisely, staying consistent with this outline.`,
    },
  ];

  while (true) {
    const question = await rl.question("\nYou: ");
    if (!question.trim() || question.trim().toLowerCase() === "exit") {
      break;
    }
    history.push({ role: "user", content: question });
    process.stdout.write("Assistant: ");
    const answer = await streamCompletion(history, temperature);
    history.push({ role: "assistant", content: answer });
  }

  console.log("\nGoodbye!");
  rl.close();
}

main().catch((err) => {
  console.error("Error:", err.message);
  rl.close();
  process.exit(1);
});
