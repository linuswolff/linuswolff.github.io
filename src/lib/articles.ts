import type { Article } from "@/types";

const BOX_WIDTH = 36;

function createBox(content: string[]): string {
  const w = BOX_WIDTH - 2;
  const pad = (9 - content.length) >> 1;
  
  const row = (s: string) => {
    const text = s.trim();
    const p = (w - text.length) >> 1;
    return `│${' '.repeat(p)}${text}${' '.repeat(w - text.length - p)}│`;
  };
  
  return [
    `╭${'─'.repeat(w)}╮`,
    ...Array(pad).fill(`│${' '.repeat(w)}│`),
    ...content.map(row),
    ...Array(pad).fill(`│${' '.repeat(w)}│`),
    `╰${'─'.repeat(w)}╯`
  ].join('\n');
}

export const asciiArtVariants: string[] = [
  createBox([
    "",
    "   ◆    ◆    ◆   ",
    "      ◆    ◆     ",
    "   ◆    ◆    ◆   ",
    "",
  ]),
  
  createBox([
    "",
    "  ╲    ╱    ╲    ╱  ",
    "   ╲  ╱      ╲  ╱   ",
    "    ╲╱        ╲╱    ",
    "    ╱╲        ╱╲    ",
    "   ╱  ╲      ╱  ╲   ",
    "  ╱    ╲    ╱    ╲  ",
    "",
  ]),
  
  createBox([
    "",
    "    ░░░░      ░░░░    ",
    "    ░░░░      ░░░░    ",
    "    ░░░░      ░░░░    ",
    "",
  ]),
  
  createBox([
    "",
    "   ◯       ◯       ◯   ",
    "       ◯       ◯       ",
    "   ◯       ◯       ◯   ",
    "       ◯       ◯       ",
    "   ◯       ◯       ◯   ",
    "",
  ]),
  
  createBox([
    "",
    "    ▲    ▼    ▲    ▼    ▲    ",
    "    ▼    ▲    ▼    ▲    ▼    ",
    "    ▲    ▼    ▲    ▼    ▲    ",
    "    ▼    ▲    ▼    ▲    ▼    ",
    "",
  ]),
  
  createBox([
    "",
    "    ██████        ██████    ",
    "    ██████        ██████    ",
    "    ██████        ██████    ",
    "",
  ]),
  
  createBox([
    "",
    "    ·    ·    ·    ·    ·    ",
    "    ·    ·         ·    ·    ",
    "    ·         ·         ·    ",
    "    ·    ·         ·    ·    ",
    "    ·    ·    ·    ·    ·    ",
    "",
  ]),
  
  createBox([
    "",
    "    ◈    ◈    ◈    ◈    ",
    "         ◈    ◈    ◈    ",
    "    ◈    ◈    ◈    ◈    ",
    "",
  ]),
];

const API_URL = `${import.meta.env.VITE_API_URL ?? "http://localhost:3001"}/api/article`;

export interface ArticleStreamResult {
  article: Article;
  contentStream: AsyncGenerator<string>;
}

export async function getArticleForWord(word: string): Promise<Article> {
  const normalizedWord = word.toLowerCase().trim();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ word: normalizedWord }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data as Article;
  } catch (error) {
    console.error("Failed to fetch article:", error);
    
    // Fallback: generate deterministic content
    const seed = normalizedWord.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const artIndex = seed % asciiArtVariants.length;
    
    return {
      title: word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
      content: generateFallbackContent(normalizedWord),
      artIndex,
    };
  }
}

export async function* streamArticleForWord(word: string): AsyncGenerator<
  | { type: 'meta'; title: string; artIndex: number }
  | { type: 'content'; chunk: string }
  | { type: 'done' }
  | { type: 'error'; data: string }
> {
  const normalizedWord = word.toLowerCase().trim();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ word: normalizedWord, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            yield data;
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to stream article:", error);
    yield { type: 'error', data: error instanceof Error ? error.message : 'Unknown error' };
  }
}

function generateFallbackContent(word: string): string {
  return `${word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()} is a concept that has fascinated humanity throughout history. The exploration of ${word} reveals deep connections between different fields of knowledge and understanding. Scholars and thinkers across cultures have contemplated its meaning and significance, contributing to a rich tapestry of human thought. The study of ${word} continues to evolve as we gain new perspectives and insights.

In contemporary contexts, ${word} remains relevant and meaningful. It shapes how we understand ourselves and the world around us, influencing our decisions and actions. Whether approached through academic study, personal reflection, or practical application, ${word} offers opportunities for growth and discovery. The ongoing dialogue about ${word} reflects humanity's enduring curiosity and desire to comprehend the complexities of existence.`;
}
