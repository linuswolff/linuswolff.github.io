import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateArticleStream } from "./gemini.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post("/api/article", async (req, res) => {
  try {
    const { word, stream } = req.body;

    if (!word || typeof word !== "string") {
      res.status(400).json({ error: "Word is required" });
      return;
    }

    // Deterministic art index based on word
    const artIndex = word
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) % 8;

    const title = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

    if (stream) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Send metadata first
      res.write(`data: ${JSON.stringify({ type: 'meta', title, artIndex })}\n\n`);

      try {
        for await (const chunk of generateArticleStream(word)) {
          res.write(`data: ${JSON.stringify({ type: 'content', chunk })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
      } catch (error) {
        res.write(`data: ${JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'Unknown error' })}\n\n`);
        res.end();
      }
    } else {
      // Non-streaming response (collect all chunks)
      const chunks: string[] = [];
      for await (const chunk of generateArticleStream(word)) {
        chunks.push(chunk);
      }
      
      res.json({
        title,
        content: chunks.join(''),
        artIndex,
      });
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ 
      error: "Failed to generate article",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
