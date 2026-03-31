export interface Article {
  title: string;
  content: string;
  artIndex: number;
}

export interface WordProps {
  word: string;
  onClick: (word: string) => void;
  isSearchedWord?: boolean;
}

export interface WikiArticleProps {
  article: Article;
  onWordClick: (word: string) => void;
  isLoading: boolean;
}

export interface HeaderProps {
  onSearch: (word: string) => void;
}
