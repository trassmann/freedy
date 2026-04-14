import { useAppStore } from "../stores/app-store";
import type { useRsvpEngine } from "../hooks/use-rsvp-engine";

type RsvpEngine = ReturnType<typeof useRsvpEngine>;

interface ReaderControlsProps {
  engine: RsvpEngine;
}

export function ReaderControls({ engine }: ReaderControlsProps) {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);

  return (
    <div className="flex flex-col gap-3 px-6 py-4 bg-surface-dim border-t border-border">
      {/* Playback controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => engine.skipBackward(10)}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-on-surface-muted"
          title="Back 10 (Shift+Left)"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.4 10.6C16.55 9 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16a8.002 8.002 0 0 1 7.6-5.5c1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z" />
          </svg>
        </button>

        <button
          onClick={() => engine.skipBackward(1)}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-on-surface-muted"
          title="Back 1 (Left Arrow)"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>

        <button
          onClick={engine.togglePlayPause}
          className="p-4 rounded-full bg-accent text-white hover:bg-accent-soft transition-colors shadow-lg"
          title="Play/Pause (Space)"
        >
          {engine.isPlaying ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={() => engine.skipForward(1)}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-on-surface-muted"
          title="Forward 1 (Right Arrow)"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
          </svg>
        </button>

        <button
          onClick={() => engine.skipForward(10)}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-on-surface-muted"
          title="Forward 10 (Shift+Right)"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5.6 10.6l3.6-3.6v9h9V7l-3.6 3.6C13.15 9 10.75 8 8.1 8 3.45 8-.48 11.03-1.86 15.22L.5 16a8.002 8.002 0 0 1 7.6-5.5c-1.95 0-3.73.72-5.12 1.88z" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-on-surface-muted mb-1">
          <span>
            {engine.currentChunkIndex + 1} / {engine.totalChunks}
          </span>
          <span>{engine.progress.toFixed(1)}%</span>
        </div>
        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-150"
            style={{ width: `${engine.progress}%` }}
          />
        </div>
      </div>

      {/* Settings row */}
      <div className="flex items-center justify-between gap-6 text-sm">
        {/* WPM control */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => engine.adjustWpm(-25)}
            className="px-2 py-0.5 rounded bg-border/50 hover:bg-border text-on-surface-muted text-xs"
          >
            -
          </button>
          <span className="font-mono text-on-surface min-w-[4.5em] text-center">
            {settings.wpm} WPM
          </span>
          <button
            onClick={() => engine.adjustWpm(25)}
            className="px-2 py-0.5 rounded bg-border/50 hover:bg-border text-on-surface-muted text-xs"
          >
            +
          </button>
        </div>

        {/* Chunk size */}
        <div className="flex items-center gap-2">
          <span className="text-on-surface-muted text-xs">Chunk:</span>
          {[1, 2, 3, 4, 5].map((size) => (
            <button
              key={size}
              onClick={() => updateSettings({ chunkSize: size })}
              className={`w-7 h-7 rounded text-xs font-medium transition-colors ${
                settings.chunkSize === size
                  ? "bg-accent text-white"
                  : "bg-border/50 text-on-surface-muted hover:bg-border"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        {/* Font size */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              updateSettings({
                fontSize: Math.max(24, settings.fontSize - 4),
              })
            }
            className="px-2 py-0.5 rounded bg-border/50 hover:bg-border text-on-surface-muted text-xs"
          >
            A-
          </button>
          <span className="text-on-surface-muted text-xs">
            {settings.fontSize}px
          </span>
          <button
            onClick={() =>
              updateSettings({
                fontSize: Math.min(96, settings.fontSize + 4),
              })
            }
            className="px-2 py-0.5 rounded bg-border/50 hover:bg-border text-on-surface-muted text-xs"
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
}
