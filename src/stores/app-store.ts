import { create } from "zustand";
import type { AppView, BookEntry, ReaderSettings } from "../lib/types";
import type { Token } from "../lib/tokenizer";

interface AppState {
  // Navigation
  view: AppView;
  setView: (view: AppView) => void;

  // Library
  library: BookEntry[];
  setLibrary: (library: BookEntry[]) => void;
  addBook: (book: BookEntry) => void;
  removeBook: (id: string) => void;
  updateBookProgress: (id: string, wordIndex: number) => void;

  // Reader
  activeBookId: string | null;
  tokens: Token[];
  currentIndex: number;
  isPlaying: boolean;
  setActiveBook: (id: string, tokens: Token[]) => void;
  setCurrentIndex: (index: number) => void;
  setIsPlaying: (playing: boolean) => void;

  // Settings
  settings: ReaderSettings;
  updateSettings: (partial: Partial<ReaderSettings>) => void;

  // Loading state
  isLoading: boolean;
  loadingMessage: string;
  setLoading: (loading: boolean, message?: string) => void;
}

const DEFAULT_SETTINGS: ReaderSettings = {
  wpm: 300,
  chunkSize: 1,
  fontSize: 48,
  fontFamily: "Georgia, serif",
  darkMode: "system",
  sentencePause: 3.0,
  commaPause: 2.0,
};

export const useAppStore = create<AppState>((set, get) => ({
  view: "library",
  setView: (view) => set({ view }),

  library: [],
  setLibrary: (library) => set({ library }),
  addBook: (book) => set((s) => ({ library: [...s.library, book] })),
  removeBook: (id) =>
    set((s) => ({ library: s.library.filter((b) => b.id !== id) })),
  updateBookProgress: (id, wordIndex) =>
    set((s) => ({
      library: s.library.map((b) =>
        b.id === id ? { ...b, wordIndex, lastReadAt: Date.now() } : b,
      ),
    })),

  activeBookId: null,
  tokens: [],
  currentIndex: 0,
  isPlaying: false,
  setActiveBook: (id, tokens) =>
    set(() => {
      const book = get().library.find((b) => b.id === id);
      return {
        activeBookId: id,
        tokens,
        currentIndex: book?.wordIndex ?? 0,
        isPlaying: false,
        view: "reader" as const,
      };
    }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),

  settings: DEFAULT_SETTINGS,
  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),

  isLoading: false,
  loadingMessage: "",
  setLoading: (loading, message = "") =>
    set({ isLoading: loading, loadingMessage: message }),
}));
