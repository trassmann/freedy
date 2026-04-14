export interface BookEntry {
  id: string;
  title: string;
  filePath: string;
  format: "epub" | "pdf" | "txt";
  addedAt: number;
  wordIndex: number;
  totalWords: number;
  lastReadAt: number | null;
}

export interface ReaderSettings {
  wpm: number;
  chunkSize: number;
  fontSize: number;
  fontFamily: string;
  darkMode: "system" | "light" | "dark";
  /** Pause multiplier for sentence-ending punctuation (.!?) */
  sentencePause: number;
  /** Pause multiplier for clause punctuation (,;:) */
  commaPause: number;
}

export type AppView = "library" | "reader";

export interface Chapter {
  title: string;
  text: string;
}
