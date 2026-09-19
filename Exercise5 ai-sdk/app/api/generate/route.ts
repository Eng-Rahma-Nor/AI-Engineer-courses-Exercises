import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

export async function POST(request: Request) {
  const { prompt } = await request.json();

  const { text } = await generateText({
    model: openai("gpt-5-mini"),
    prompt,
  });

  return Response.json({ text });
}
