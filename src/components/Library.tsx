import { BookOpen, Plus, Settings, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";
import { detectFormat, parseFile } from "../lib/parser";
import { tokenize } from "../lib/tokenizer";
import type { BookEntry } from "../lib/types";
import { useAppStore } from "../stores/app-store";

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
  const [showSettings, setShowSettings] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

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

  const handleRemoveBook = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmRemove(id);
  };

  const confirmRemoveBook = () => {
    if (confirmRemove) {
      removeBook(confirmRemove);
      setConfirmRemove(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-surface" onClick={() => setShowSettings(false)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Freedy</h1>
          <p className="text-xs text-on-surface-muted">RSVP Speed Reader</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings((s) => !s);
              }}
              className="p-2 rounded-lg hover:bg-border/50 transition-colors text-on-surface-muted"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
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
                        type="button"
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
            type="button"
            onClick={handleImport}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-soft transition-colors disabled:opacity-50 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
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
            <BookOpen className="w-16 h-16 text-on-surface-muted/30 mb-4" strokeWidth={1} />
            <p className="text-on-surface-muted text-lg mb-2">No books yet</p>
            <p className="text-on-surface-muted/60 text-sm mb-4">
              Import an EPUB, PDF, or text file to start speed reading
            </p>
            <button
              type="button"
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
                const progress = book.totalWords > 0 ? (book.wordIndex / book.totalWords) * 100 : 0;
                return (
                  <div
                    key={book.id}
                    className="relative flex flex-col p-4 rounded-xl bg-surface-dim border border-border hover:border-accent/40 hover:shadow-md transition-all text-left group cursor-pointer"
                    onClick={() => handleOpenBook(book)}
                  >
                    {/* Trash button */}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveBook(e, book.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/10 text-on-surface-muted hover:text-red-500 transition-all"
                      title="Remove from library"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Remove confirmation dialog */}
      {confirmRemove && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setConfirmRemove(null)}
        >
          <div
            className="bg-surface border border-border rounded-xl shadow-2xl p-6 max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-on-surface mb-2">Remove book?</h3>
            <p className="text-sm text-on-surface-muted mb-5">
              This will remove the book from your library. Your reading progress will be saved in
              case you re-add the same file later.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmRemove(null)}
                className="px-4 py-2 rounded-lg text-sm text-on-surface-muted hover:bg-border/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRemoveBook}
                className="px-4 py-2 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
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
