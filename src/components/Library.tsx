import { useCallback, useState } from "react";
import { useAppStore } from "../stores/app-store";
import { parseFile, detectFormat } from "../lib/parser";
import { tokenize } from "../lib/tokenizer";
import type { BookEntry } from "../lib/types";

export function Library() {
  const library = useAppStore((s) => s.library);
  const addBook = useAppStore((s) => s.addBook);
  const removeBook = useAppStore((s) => s.removeBook);
  const setActiveBook = useAppStore((s) => s.setActiveBook);
  const setLoading = useAppStore((s) => s.setLoading);
  const isLoading = useAppStore((s) => s.isLoading);
  const loadingMessage = useAppStore((s) => s.loadingMessage);
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const [contextMenu, setContextMenu] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const handleImport = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          {
            name: "Books",
            extensions: ["epub", "pdf", "txt", "text", "md"],
          },
        ],
      });

      if (!selected) return;

      const filePath = selected;
      setLoading(true, "Parsing file...");

      const format = detectFormat(filePath);
      const chapters = await parseFile(filePath, format);

      // Combine all chapter text and tokenize
      const fullText = chapters.map((c) => c.text).join("\n\n");
      const tokens = tokenize(fullText);

      // Create book entry
      const fileName = filePath.split("/").pop() ?? filePath;
      const id = await hashString(filePath + Date.now());

      const book: BookEntry = {
        id,
        title: fileName.replace(/\.(epub|pdf|txt|text|md)$/i, ""),
        filePath,
        format,
        addedAt: Date.now(),
        wordIndex: 0,
        totalWords: tokens.length,
        lastReadAt: null,
      };

      addBook(book);
      setLoading(false);
    } catch (err) {
      console.error("Import failed:", err);
      setLoading(false);
      alert(`Failed to import file: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [addBook, setLoading]);

  const handleOpenBook = useCallback(
    async (book: BookEntry) => {
      try {
        setLoading(true, "Loading book...");
        const chapters = await parseFile(book.filePath, book.format);
        const fullText = chapters.map((c) => c.text).join("\n\n");
        const tokens = tokenize(fullText);
        setActiveBook(book.id, tokens);
        setLoading(false);
      } catch (err) {
        console.error("Failed to open book:", err);
        setLoading(false);
        alert(
          `Failed to open file. It may have been moved or deleted.\n\n${err instanceof Error ? err.message : String(err)}`,
        );
      }
    },
    [setActiveBook, setLoading],
  );

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="h-full flex flex-col bg-surface"
      onClick={() => {
        setContextMenu(null);
        setShowSettings(false);
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Freedy</h1>
          <p className="text-xs text-on-surface-muted">RSVP Speed Reader</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings((s) => !s);
              }}
              className="p-2 rounded-lg hover:bg-border/50 transition-colors text-on-surface-muted"
              title="Settings"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>

            {/* Settings dropdown */}
            {showSettings && (
              <div
                className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-xl z-50 p-4 flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-sm font-semibold text-on-surface">Settings</h3>

                {/* Dark mode */}
                <div>
                  <label className="text-xs text-on-surface-muted mb-1.5 block">Appearance</label>
                  <div className="flex gap-1">
                    {(["light", "system", "dark"] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => updateSettings({ darkMode: mode })}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          settings.darkMode === mode
                            ? "bg-accent text-white"
                            : "bg-surface-dim text-on-surface-muted hover:bg-border/50"
                        }`}
                      >
                        {mode === "light" ? "Light" : mode === "dark" ? "Dark" : "System"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default WPM */}
                <div>
                  <label className="text-xs text-on-surface-muted mb-1.5 block">
                    Default speed: {settings.wpm} WPM
                  </label>
                  <input
                    type="range"
                    min={100}
                    max={1500}
                    step={25}
                    value={settings.wpm}
                    onChange={(e) => updateSettings({ wpm: Number(e.target.value) })}
                    className="w-full accent-accent"
                  />
                </div>

                {/* Font family */}
                <div>
                  <label className="text-xs text-on-surface-muted mb-1.5 block">Font</label>
                  <select
                    value={settings.fontFamily}
                    onChange={(e) => updateSettings({ fontFamily: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg text-xs bg-surface-dim border border-border text-on-surface"
                  >
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="-apple-system, sans-serif">System Sans</option>
                    <option value="'SF Mono', 'Fira Code', monospace">Monospace</option>
                    <option value="'Verdana', sans-serif">Verdana</option>
                  </select>
                </div>

                {/* Font size */}
                <div>
                  <label className="text-xs text-on-surface-muted mb-1.5 block">
                    Font size: {settings.fontSize}px
                  </label>
                  <input
                    type="range"
                    min={24}
                    max={96}
                    step={4}
                    value={settings.fontSize}
                    onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
                    className="w-full accent-accent"
                  />
                </div>

                {/* Punctuation pauses */}
                <div>
                  <label className="text-xs text-on-surface-muted mb-1.5 block">
                    Sentence pause (.!?): {settings.sentencePause.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min={1.0}
                    max={5.0}
                    step={0.5}
                    value={settings.sentencePause}
                    onChange={(e) => updateSettings({ sentencePause: Number(e.target.value) })}
                    className="w-full accent-accent"
                  />
                </div>

                <div>
                  <label className="text-xs text-on-surface-muted mb-1.5 block">
                    Comma pause (,;:): {settings.commaPause.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min={1.0}
                    max={4.0}
                    step={0.5}
                    value={settings.commaPause}
                    onChange={(e) => updateSettings({ commaPause: Number(e.target.value) })}
                    className="w-full accent-accent"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleImport}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-soft transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
            Import
          </button>
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="flex items-center justify-center py-4 bg-surface-dim border-b border-border">
          <div className="flex items-center gap-3 text-on-surface-muted text-sm">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            {loadingMessage}
          </div>
        </div>
      )}

      {/* Book grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {library.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg
              className="w-16 h-16 text-on-surface-muted/30 mb-4"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
            </svg>
            <p className="text-on-surface-muted text-lg mb-2">
              No books yet
            </p>
            <p className="text-on-surface-muted/60 text-sm mb-4">
              Import an EPUB, PDF, or text file to start speed reading
            </p>
            <button
              onClick={handleImport}
              className="px-6 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-soft transition-colors text-sm font-medium"
            >
              Import your first book
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {library
              .sort((a, b) => (b.lastReadAt ?? b.addedAt) - (a.lastReadAt ?? a.addedAt))
              .map((book) => {
                const progress =
                  book.totalWords > 0
                    ? (book.wordIndex / book.totalWords) * 100
                    : 0;
                return (
                  <button
                    key={book.id}
                    onClick={() => handleOpenBook(book)}
                    onContextMenu={(e) => handleContextMenu(e, book.id)}
                    className="flex flex-col p-4 rounded-xl bg-surface-dim border border-border hover:border-accent/40 hover:shadow-md transition-all text-left group"
                  >
                    {/* Format badge */}
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-muted/60 mb-2">
                      {book.format}
                    </span>
                    {/* Title */}
                    <span className="text-sm font-medium text-on-surface line-clamp-2 mb-3 flex-1">
                      {book.title}
                    </span>
                    {/* Progress bar */}
                    <div className="w-full">
                      <div className="w-full h-1 bg-border rounded-full overflow-hidden mb-1">
                        <div
                          className="h-full bg-accent rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-on-surface-muted">
                        {progress > 0 ? `${progress.toFixed(0)}%` : "New"}
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed bg-surface border border-border rounded-lg shadow-xl py-1 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              removeBook(contextMenu.id);
              setContextMenu(null);
            }}
            className="w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-border/50 transition-colors"
          >
            Remove from library
          </button>
        </div>
      )}
    </div>
  );
}

async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
}
