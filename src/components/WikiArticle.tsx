import { useState, useEffect, useRef } from "react";
import { Word } from "./Word";
import { asciiArtVariants } from "@/lib/articles";
import type { WikiArticleProps } from "@/types";

export function WikiArticle({ article, onWordClick, isLoading }: WikiArticleProps) {
  const [displayedArt, setDisplayedArt] = useState("");
  const indexRef = useRef(0);

  // Typewriter effect for ASCII art - only restart when artIndex changes
  useEffect(() => {
    if (isLoading) {
      setDisplayedArt("");
      return;
    }

    const art = asciiArtVariants[article.artIndex];
    indexRef.current = 0;
    setDisplayedArt("");

    const interval = setInterval(() => {
      if (indexRef.current >= art.length) {
        clearInterval(interval);
        return;
      }
      const nextIndex = Math.min(indexRef.current + 2, art.length);
      setDisplayedArt(art.slice(0, nextIndex));
      indexRef.current = nextIndex;
    }, 10);

    return () => clearInterval(interval);
  }, [article.artIndex, isLoading]);

  // Split content to extract the first word and the rest
  const renderContent = () => {
    const words = article.content.split(/(\s+)/);
    // Use article.title instead of currentWord to avoid mismatches during streaming
    const articleWord = article.title.toLowerCase();
    
    // Find the first occurrence of the article's word
    let firstWordIndex = -1;
    let firstWordRaw = "";
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      if (/^\s+$/.test(word)) continue;
      
      const cleanWord = word.replace(/[^a-zA-Z]/g, "").toLowerCase();
      if (cleanWord === articleWord) {
        firstWordIndex = i;
        firstWordRaw = word;
        break;
      }
    }
    
    if (firstWordIndex === -1) {
      // Fallback: just render all words normally
      return words.map((word, index) => {
        if (/^\s+$/.test(word)) return word;
        return <Word key={index} word={word} onClick={onWordClick} isSearchedWord={false} />;
      });
    }
    
    // Get the rest of the words after the first word
    const wordsAfterFirst = words.slice(firstWordIndex + 1);
    
    // Capitalize the first word for display
    const displayFirstWord = firstWordRaw.charAt(0).toUpperCase() + firstWordRaw.slice(1).toLowerCase();
    const cleanFirstWord = firstWordRaw.replace(/[^a-zA-Z]/g, "");
    
    return (
      <>
        {/* Drop cap whole word */}
        <span 
          className="float-left text-4xl font-bold text-primary mr-2 mt-0.5 mb-0 cursor-pointer"
          onClick={() => onWordClick(cleanFirstWord)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onWordClick(cleanFirstWord);
            }
          }}
        >
          {displayFirstWord}
        </span>
        
        {/* Rest of the content */}
        {wordsAfterFirst.map((word, index) => {
          if (/^\s+$/.test(word)) return word;
          return <Word key={index} word={word} onClick={onWordClick} isSearchedWord={false} />;
        })}
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full border border-border bg-card p-12 flex flex-col items-center justify-center min-h-[500px] gap-6">
        <div className="w-72 h-40 bg-muted animate-pulse rounded-none" />
        <div className="w-48 h-8 bg-muted animate-pulse rounded-none" />
        <div className="w-full max-w-lg space-y-3">
          <div className="w-full h-5 bg-muted animate-pulse rounded-none" />
          <div className="w-full h-5 bg-muted animate-pulse rounded-none" />
          <div className="w-3/4 h-5 bg-muted animate-pulse rounded-none" />
        </div>
      </div>
    );
  }

  return (
    <article className="w-full border border-border bg-card p-12 flex flex-col items-center gap-8">
      <pre className="font-mono text-base leading-tight text-foreground whitespace-pre">
        {displayedArt}
      </pre>

      <p className="text-md text-justify max-w-prose">
        {renderContent()}
      </p>
    </article>
  );
}
