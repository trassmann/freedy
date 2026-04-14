import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import type { useRsvpEngine } from "../hooks/use-rsvp-engine";
import { useAppStore } from "../stores/app-store";

type RsvpEngine = ReturnType<typeof useRsvpEngine>;

interface ReaderControlsProps {
  engine: RsvpEngine;
}

function formatTime(minutes: number): string {
  if (minutes < 1) return "< 1 min left";
  if (minutes < 60) return `${Math.round(minutes)} min left`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m left` : `${h}h left`;
}

export function ReaderControls({ engine }: ReaderControlsProps) {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const tokens = useAppStore((s) => s.tokens);
  const currentIndex = useAppStore((s) => s.currentIndex);

  const remainingWords = Math.max(0, tokens.length - currentIndex);
  const minutesLeft = remainingWords / settings.wpm;

  return (
    <div className="flex flex-col gap-5 px-6 py-5 bg-surface-dim border-t border-border">
      {/* Playback controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => engine.skipBackward(10)}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-on-surface-muted"
          title="Back 10 (Shift+Left)"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => engine.skipBackward(1)}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-on-surface-muted"
          title="Back 1 (Left Arrow)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={engine.togglePlayPause}
          className="p-4 rounded-full bg-accent text-white hover:bg-accent-soft transition-colors shadow-lg"
          title="Play/Pause (Space)"
        >
          {engine.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
        </button>

        <button
          type="button"
          onClick={() => engine.skipForward(1)}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-on-surface-muted"
          title="Forward 1 (Right Arrow)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => engine.skipForward(10)}
          className="p-2 rounded-lg hover:bg-border/50 transition-colors text-on-surface-muted"
          title="Forward 10 (Shift+Right)"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

      {/* Progress + settings wrapper — inline-flex so width is driven by settings row content */}
      <div className="self-center inline-flex flex-col gap-5 w-full min-[800px]:min-w-[75%] min-[800px]:w-auto">
        {/* Progress bar */}
        <div className="w-full">
          <div className="grid grid-cols-3 text-xs text-on-surface-muted mb-1">
            <span className="text-left">
              {engine.currentChunkIndex + 1} / {engine.totalChunks}
            </span>
            <span className="text-center">{formatTime(minutesLeft)}</span>
            <span className="text-right">{engine.progress.toFixed(1)}%</span>
          </div>
          <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-150"
              style={{ width: `${engine.progress}%` }}
            />
          </div>
        </div>

        {/* Settings row */}
        <div className="flex items-center justify-between text-sm">
        {/* WPM control */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => engine.adjustWpm(-25)}
            className="px-2 py-0.5 rounded bg-border/50 hover:bg-border text-on-surface-muted text-xs"
          >
            -
          </button>
          <span className="font-mono text-on-surface min-w-[4.5em] text-center">
            {settings.wpm} WPM
          </span>
          <button
            type="button"
            onClick={() => engine.adjustWpm(25)}
            className="px-2 py-0.5 rounded bg-border/50 hover:bg-border text-on-surface-muted text-xs"
          >
            +
          </button>
        </div>

        {/* Words at once */}
        <div className="flex items-center gap-2">
          <span className="text-on-surface-muted text-xs">Words at once:</span>
          {[1, 2, 3, 4, 5].map((size) => (
            <button
              type="button"
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
            type="button"
            onClick={() =>
              updateSettings({
                fontSize: Math.max(24, settings.fontSize - 4),
              })
            }
            className="px-2 py-0.5 rounded bg-border/50 hover:bg-border text-on-surface-muted text-xs"
          >
            A-
          </button>
          <span className="text-on-surface-muted text-xs">{settings.fontSize}px</span>
          <button
            type="button"
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
    </div>
  );
}
