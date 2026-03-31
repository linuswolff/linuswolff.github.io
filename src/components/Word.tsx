import type { WordProps } from "@/types";

export function Word({ word, onClick, isSearchedWord }: WordProps) {
  // Remove punctuation for the clickable word
  const cleanWord = word.replace(/[^a-zA-Z]/g, "");

  if (!cleanWord) {
    return <span>{word}</span>;
  }

  // Capitalize first letter for display if it's the searched word
  const displayWord = isSearchedWord 
    ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    : word;

  const baseClasses = "cursor-pointer underline-offset-2 hover:underline transition-all duration-200";
  const searchedWordClasses = isSearchedWord
    ? "text-5xl font-bold text-primary no-underline hover:no-underline inline-block py-2"
    : "";

  return (
    <span
      onClick={() => onClick(cleanWord)}
      className={`${baseClasses} ${searchedWordClasses}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick(cleanWord);
        }
      }}
    >
      {displayWord}
    </span>
  );
}
