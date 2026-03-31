import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/Header";
import { WikiArticle } from "@/components/WikiArticle";
import { getArticleForWord, streamArticleForWord } from "@/lib/articles";
import type { Article } from "@/types";

const INITIAL_WORD = "knowledge";

export function App() {
  const [currentWord, setCurrentWord] = useState(INITIAL_WORD);
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load initial article
  useEffect(() => {
    const loadInitialArticle = async () => {
      setIsLoading(true);
      try {
        const initialArticle = await getArticleForWord(INITIAL_WORD);
        setArticle(initialArticle);
        setError(null);
      } catch (err) {
        console.error("Failed to load initial article:", err);
        setError("Failed to load initial article");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialArticle();
  }, []);

  const handleWordChange = useCallback(async (word: string) => {
    if (!word.trim()) return;

    setIsLoading(true);
    setIsStreaming(true);
    setStreamedContent("");
    setCurrentWord(word);
    setError(null);

    try {
      let title = "";
      let artIndex = 0;
      let content = "";

      for await (const chunk of streamArticleForWord(word)) {
        if (chunk.type === 'meta') {
          title = chunk.title;
          artIndex = chunk.artIndex;
        } else if (chunk.type === 'content') {
          content += chunk.chunk;
          setStreamedContent(content);
        } else if (chunk.type === 'done') {
          setArticle({ title, content, artIndex });
          setIsStreaming(false);
          setIsLoading(false);
        } else if (chunk.type === 'error') {
          throw new Error(chunk.data as string);
        }
      }
    } catch (err) {
      console.error("Failed to load article:", err);
      setError("Failed to load article");
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, []);

  // Show loading skeleton only for initial load (no article yet)
  if (!article && isLoading && !error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col pt-4">
        <Header onSearch={handleWordChange} />
        <main className="flex-1 p-4 flex justify-center">
          <div className="w-full max-w-[800px]">
            <div className="w-full border border-border bg-card p-12 flex flex-col items-center justify-center min-h-[500px] gap-6">
              <div className="w-72 h-40 bg-muted animate-pulse rounded-none" />
              <div className="w-48 h-8 bg-muted animate-pulse rounded-none" />
              <div className="w-full max-w-lg space-y-3">
                <div className="w-full h-5 bg-muted animate-pulse rounded-none" />
                <div className="w-full h-5 bg-muted animate-pulse rounded-none" />
                <div className="w-3/4 h-5 bg-muted animate-pulse rounded-none" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !article) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center pt-4">
        <div className="text-destructive">{error}</div>
        <button 
          onClick={() => handleWordChange(INITIAL_WORD)}
          className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  // Show streamed content while loading
  const displayArticle = isStreaming && streamedContent 
    ? { title: currentWord.charAt(0).toUpperCase() + currentWord.slice(1).toLowerCase(), content: streamedContent, artIndex: currentWord.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % 8 }
    : article;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col pt-4">
      <Header onSearch={handleWordChange} />

      <main className="flex-1 p-4 flex justify-center">
        <div className="w-full max-w-[800px]">
          {displayArticle && (
            <WikiArticle
              article={displayArticle}
              onWordClick={handleWordChange}
              isLoading={isLoading && !isStreaming}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
