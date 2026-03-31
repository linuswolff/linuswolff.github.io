import { deepseek } from "@ai-sdk/deepseek";
import { streamText } from "ai";

export async function* generateArticleStream(word: string): AsyncGenerator<string> {
  const prompt = `Write a Wikipedia-style article about the word "${word}". 
The article should be 1-2 paragraphs (50-80 words), informative and encyclopedic in tone.
Always start the first sentence with the word itself (e.g., "${word} is...").

IMPORTANT: Do NOT use any markdown formatting, return ONLY plain text.`;

  try {
    const result = streamText({
      model: deepseek("deepseek-chat"),
      prompt,
    });

    for await (const textPart of result.textStream) {
      if (textPart) {
        let text = textPart;
        text = text.replace(/\*\*(.*?)\*\*/g, "$1");
        text = text.replace(/\*(.*?)\*/g, "$1");
        text = text.replace(/_(.*?)_/g, "$1");
        text = text.replace(/`([^`]+)`/g, "$1");
        text = text.replace(/^#+\s*/gm, "");
        text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
        yield text;
      }
    }
  } catch (error) {
    console.error("Error in generateArticleStream:", error);
    throw error;
  }
}

export async function generateArticle(word: string): Promise<string> {
  const chunks: string[] = [];
  for await (const chunk of generateArticleStream(word)) {
    chunks.push(chunk);
  }
  return chunks.join("");
}
