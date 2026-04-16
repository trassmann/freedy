export type BookFormat = "epub" | "pdf" | "txt" | "paste";

export interface BookEntry {
  id: string;
  title: string;
  /** Absolute path on disk, or empty string for pasted entries. */
  filePath: string;
  format: BookFormat;
  addedAt: number;
  wordIndex: number;
  totalWords: number;
  lastReadAt: number | null;
  /** For `format === "paste"`: the raw text the user pasted in. */
  pastedText?: string;
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
