import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText } from "ai";

interface Env {
  DEEPSEEK_API_KEY: string;
  ALLOWED_ORIGIN: string;
}

function corsHeaders(origin: string | null, allowedOrigin: string): HeadersInit {
  const allowed = allowedOrigin || "*";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function sse(data: object): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#+\s*/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get("Origin");
    const cors = corsHeaders(origin, env.ALLOWED_ORIGIN);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/article") {
      let body: { word?: string; stream?: boolean };
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...cors },
        });
      }

      const { word, stream } = body;

      if (!word || typeof word !== "string") {
        return new Response(JSON.stringify({ error: "Word is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...cors },
        });
      }

      const normalizedWord = word.toLowerCase().trim();
      const artIndex =
        normalizedWord
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 8;
      const title =
        normalizedWord.charAt(0).toUpperCase() + normalizedWord.slice(1);

      const deepseek = createDeepSeek({ apiKey: env.DEEPSEEK_API_KEY });

      const prompt = `Write a Wikipedia-style article about the word "${normalizedWord}".
The article should be 1-2 paragraphs (50-80 words), informative and encyclopedic in tone.
Always start the first sentence with the word itself (e.g., "${normalizedWord} is...").

IMPORTANT: Do NOT use any markdown formatting, return ONLY plain text.`;

      if (stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        (async () => {
          try {
            writer.write(encoder.encode(sse({ type: "meta", title, artIndex })));

            const result = streamText({
              model: deepseek("deepseek-chat"),
              prompt,
            });

            for await (const chunk of result.textStream) {
              if (chunk) {
                writer.write(
                  encoder.encode(sse({ type: "content", chunk: stripMarkdown(chunk) }))
                );
              }
            }

            writer.write(encoder.encode(sse({ type: "done" })));
          } catch (error) {
            writer.write(
              encoder.encode(
                sse({
                  type: "error",
                  message: error instanceof Error ? error.message : "Unknown error",
                })
              )
            );
          } finally {
            writer.close();
          }
        })();

        return new Response(readable, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            ...cors,
          },
        });
      } else {
        // Non-streaming: collect all chunks
        const chunks: string[] = [];
        const result = streamText({
          model: deepseek("deepseek-chat"),
          prompt,
        });

        for await (const chunk of result.textStream) {
          if (chunk) chunks.push(stripMarkdown(chunk));
        }

        return new Response(
          JSON.stringify({ title, content: chunks.join(""), artIndex }),
          { headers: { "Content-Type": "application/json", ...cors } }
        );
      }
    }

    return new Response("Not found", { status: 404, headers: cors });
  },
};
