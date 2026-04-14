import { ArrowLeft } from "lucide-react";
import { useKeyboard } from "../hooks/use-keyboard";
import { useRsvpEngine } from "../hooks/use-rsvp-engine";
import { useAppStore } from "../stores/app-store";
import { ReaderControls } from "./ReaderControls";
import { WordDisplay } from "./WordDisplay";

export function Reader() {
  const engine = useRsvpEngine();
  const setView = useAppStore((s) => s.setView);
  const activeBookId = useAppStore((s) => s.activeBookId);
  const library = useAppStore((s) => s.library);
  const updateBookProgress = useAppStore((s) => s.updateBookProgress);

  useKeyboard(engine);

  const book = library.find((b) => b.id === activeBookId);

  const handleBack = () => {
    engine.stop();
    // Save progress before leaving
    if (activeBookId) {
      updateBookProgress(activeBookId, useAppStore.getState().currentIndex);
    }
    setView("library");
  };

  return (
    <div className="h-full flex flex-col bg-surface">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-dim border-b border-border">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-on-surface-muted hover:text-on-surface transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Library
        </button>
        <span className="text-sm font-medium text-on-surface truncate max-w-[60%]">
          {book?.title ?? "Unknown"}
        </span>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      {/* Word display area */}
      <div className="flex-1 min-h-0">
        <WordDisplay text={engine.currentText} />
      </div>

      {/* Controls */}
      <ReaderControls engine={engine} />
    </div>
  );
}
