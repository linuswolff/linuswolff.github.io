import { useState } from "react";
import { Search, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";

interface HeaderProps {
  onSearch: (word: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const [searchValue, setSearchValue] = useState("");
  const { isDark, toggleTheme } = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      onSearch(searchValue.trim());
      setSearchValue("");
    }
  };

  return (
    <header className="w-full max-w-[800px] mx-auto border border-border bg-background p-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-1">
        <span className="text-lg font-medium">∞</span>
        <span className="text-sm font-medium">wiki</span>
      </div>

      <div className="flex items-center gap-2">
        <form onSubmit={handleSubmit} className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="wander..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-40 pl-8 h-7 text-xs"
          />
        </form>

        <Button
          variant="outline"
          size="icon-sm"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </header>
  );
}
