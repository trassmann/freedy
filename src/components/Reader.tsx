import { useRsvpEngine } from "../hooks/use-rsvp-engine";
import { useKeyboard } from "../hooks/use-keyboard";
import { useAppStore } from "../stores/app-store";
import { WordDisplay } from "./WordDisplay";
import { ReaderControls } from "./ReaderControls";

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
          onClick={handleBack}
          className="flex items-center gap-1.5 text-sm text-on-surface-muted hover:text-on-surface transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
          </svg>
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
