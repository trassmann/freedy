import { useMemo } from "react";
import { useAppStore } from "../stores/app-store";

interface WordDisplayProps {
  text: string;
}

/**
 * Displays a word/chunk with ORP (Optimal Recognition Point) highlighting.
 * The ORP is roughly 1/3 into the word, highlighted in accent color.
 * The word is positioned so the ORP character is always at the center of the screen.
 */
export function WordDisplay({ text }: WordDisplayProps) {
  const { fontSize, fontFamily } = useAppStore((s) => s.settings);

  const parts = useMemo(() => {
    if (!text) return { before: "", pivot: "", after: "" };

    // For chunks (multiple words), find ORP of the middle word
    const words = text.split(" ");
    if (words.length > 1) {
      // For multi-word chunks, highlight the ORP of each word
      return { before: "", pivot: "", after: "", isChunk: true, words };
    }

    const word = text;
    const len = word.length;

    // ORP position based on word length
    let orpIndex: number;
    if (len <= 1) orpIndex = 0;
    else if (len <= 5) orpIndex = 1;
    else if (len <= 9) orpIndex = 2;
    else if (len <= 13) orpIndex = 3;
    else orpIndex = 4;

    return {
      before: word.slice(0, orpIndex),
      pivot: word[orpIndex] ?? "",
      after: word.slice(orpIndex + 1),
      isChunk: false,
    };
  }, [text]);

  if (!text) {
    return (
      <div
        className="flex items-center justify-center h-full select-none"
        style={{ fontFamily, fontSize: `${fontSize}px` }}
      >
        <span className="text-on-surface-muted opacity-40">
          Press Space to start
        </span>
      </div>
    );
  }

  if ("words" in parts && parts.isChunk && parts.words) {
    return (
      <div
        className="flex items-center justify-center h-full select-none"
        style={{ fontFamily, fontSize: `${fontSize}px` }}
      >
        <span className="text-on-surface tracking-wide">{text}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-full select-none relative">
      {/* Center guide line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-accent/20" />

      <div
        className="flex items-center"
        style={{ fontFamily, fontSize: `${fontSize}px` }}
      >
        <span className="text-on-surface text-right" style={{ minWidth: "2.5em" }}>
          {parts.before}
        </span>
        <span className="text-accent font-bold">{parts.pivot}</span>
        <span className="text-on-surface text-left" style={{ minWidth: "2.5em" }}>
          {parts.after}
        </span>
      </div>
    </div>
  );
}
