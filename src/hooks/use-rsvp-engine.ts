import { useCallback, useEffect, useRef } from "react";
import { chunkTokens, type Token } from "../lib/tokenizer";
import { useAppStore } from "../stores/app-store";

const SENTENCE_ENDERS = /[.!?]$/;
const CLAUSE_PAUSE = /[,;:]$/;

/** Compute pause multiplier at runtime using current settings */
function getPauseForChunk(chunk: Token[], sentencePause: number, commaPause: number): number {
  let maxPause = 1.0;
  for (const t of chunk) {
    const word = t.text;
    if (SENTENCE_ENDERS.test(word)) {
      maxPause = Math.max(maxPause, sentencePause);
    } else if (CLAUSE_PAUSE.test(word)) {
      maxPause = Math.max(maxPause, commaPause);
    }
    // Keep length-based multiplier from token
    if (t.pauseMultiplier > 1 && t.pauseMultiplier < 2) {
      maxPause = Math.max(maxPause, t.pauseMultiplier);
    }
  }
  return maxPause;
}

export function useRsvpEngine() {
  const {
    tokens,
    currentIndex,
    isPlaying,
    settings,
    setCurrentIndex,
    setIsPlaying,
    updateBookProgress,
    activeBookId,
  } = useAppStore();

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expectedRef = useRef<number>(0);

  const chunks = chunkTokens(tokens, settings.chunkSize);

  // Find which chunk the current index falls into
  let currentChunkIndex = 0;
  let wordCount = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i]!;
    if (wordCount + chunk.length > currentIndex) {
      currentChunkIndex = i;
      break;
    }
    wordCount += chunk.length;
    if (i === chunks.length - 1) {
      currentChunkIndex = i;
    }
  }

  const currentChunk = chunks[currentChunkIndex];
  const currentText = currentChunk ? currentChunk.map((t) => t.text).join(" ") : "";

  // Compute pause from current settings (so slider changes apply immediately)
  const pauseMultiplier = currentChunk
    ? getPauseForChunk(currentChunk, settings.sentencePause, settings.commaPause)
    : 1;

  const baseInterval = 60000 / settings.wpm;

  const totalChunks = chunks.length;
  const progress = totalChunks > 0 ? ((currentChunkIndex + 1) / totalChunks) * 100 : 0;

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, [setIsPlaying]);

  const advance = useCallback(() => {
    const state = useAppStore.getState();
    const allChunks = chunkTokens(state.tokens, state.settings.chunkSize);

    // Find current chunk index from word index
    let ci = 0;
    let wc = 0;
    for (let i = 0; i < allChunks.length; i++) {
      const chunk = allChunks[i]!;
      if (wc + chunk.length > state.currentIndex) {
        ci = i;
        break;
      }
      wc += chunk.length;
      if (i === allChunks.length - 1) ci = i;
    }

    const nextChunkIndex = ci + 1;
    if (nextChunkIndex >= allChunks.length) {
      // Reached the end
      useAppStore.getState().setIsPlaying(false);
      return;
    }

    // Calculate new word index
    let newWordIndex = 0;
    for (let i = 0; i < nextChunkIndex; i++) {
      newWordIndex += allChunks[i]!.length;
    }

    setCurrentIndex(newWordIndex);

    // Schedule next advance with drift correction
    // The timeout controls how long the NEW word (nextChunkIndex) stays on screen,
    // so use its pause multiplier (linger on the word that has the comma/period)
    const displayedChunk = allChunks[nextChunkIndex];
    const displayPause = displayedChunk
      ? getPauseForChunk(displayedChunk, state.settings.sentencePause, state.settings.commaPause)
      : 1;
    const interval = (60000 / state.settings.wpm) * displayPause * state.settings.chunkSize;

    const drift = Date.now() - expectedRef.current;
    expectedRef.current += interval;
    timerRef.current = setTimeout(advance, Math.max(1, interval - drift));
  }, [setCurrentIndex]);

  const play = useCallback(() => {
    setIsPlaying(true);
    const interval = baseInterval * pauseMultiplier * settings.chunkSize;
    expectedRef.current = Date.now() + interval;
    timerRef.current = setTimeout(advance, interval);
  }, [setIsPlaying, advance, baseInterval, pauseMultiplier, settings.chunkSize]);

  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      stop();
    } else {
      play();
    }
  }, [isPlaying, stop, play]);

  const skipForward = useCallback(
    (amount: number = 1) => {
      const ci = currentChunkIndex;
      const targetChunk = Math.min(ci + amount, chunks.length - 1);
      let newIndex = 0;
      for (let i = 0; i < targetChunk; i++) {
        newIndex += chunks[i]!.length;
      }
      setCurrentIndex(newIndex);
    },
    [currentChunkIndex, chunks, setCurrentIndex],
  );

  const skipBackward = useCallback(
    (amount: number = 1) => {
      const ci = currentChunkIndex;
      const targetChunk = Math.max(ci - amount, 0);
      let newIndex = 0;
      for (let i = 0; i < targetChunk; i++) {
        newIndex += chunks[i]!.length;
      }
      setCurrentIndex(newIndex);
    },
    [currentChunkIndex, chunks, setCurrentIndex],
  );

  const adjustWpm = useCallback(
    (delta: number) => {
      const newWpm = Math.min(1500, Math.max(100, settings.wpm + delta));
      useAppStore.getState().updateSettings({ wpm: newWpm });
    },
    [settings.wpm],
  );

  // Auto-save progress periodically
  const saveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeBookId) {
      saveIntervalRef.current = setInterval(() => {
        const state = useAppStore.getState();
        if (state.activeBookId) {
          updateBookProgress(state.activeBookId, state.currentIndex);
        }
      }, 5000);
    }
    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
      }
    };
  }, [activeBookId, updateBookProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Stop playback when isPlaying goes false externally
  useEffect(() => {
    if (!isPlaying && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [isPlaying]);

  return {
    currentText,
    currentChunkIndex,
    totalChunks,
    progress,
    isPlaying,
    togglePlayPause,
    play,
    stop,
    skipForward,
    skipBackward,
    adjustWpm,
  };
}
