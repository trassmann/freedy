# CLAUDE.md

## What is this?

fReedy is a desktop RSVP (Rapid Serial Visual Presentation) speed reading app. Users import books (EPUB, PDF, TXT) and read them word-by-word at configurable speeds. Built with Tauri v2 + React 19 + TypeScript.

## Tech Stack

- **Runtime:** Tauri v2 (Rust backend, webview frontend)
- **Frontend:** React 19, TypeScript 5.7, Vite 6
- **Styling:** Tailwind CSS v4 (custom theme in `src/index.css`)
- **State:** Zustand (single store in `src/stores/app-store.ts`)
- **Icons:** lucide-react
- **Linting:** Biome (`biome.json` config, run `pnpm lint`)
- **Persistence:** `@tauri-apps/plugin-store` → `freedy-data.json`

## Project Structure

```
src/
  components/     React components (Library, Reader, ReaderControls, WordDisplay)
  hooks/          Custom hooks (use-rsvp-engine, use-keyboard, use-persistence)
  lib/            Utilities (parser, tokenizer, types)
  stores/         Zustand store
  App.tsx         Root component, dark mode management
  index.css       Tailwind theme + custom variants
src-tauri/
  src/            Rust entry point (minimal - just plugin registration)
  Cargo.toml      Rust dependencies
  tauri.conf.json Tauri config (window size, CSP, plugins)
```

## Commands

```bash
pnpm install          # Install dependencies
pnpm tauri dev        # Run dev mode (frontend + Tauri)
pnpm tauri build      # Production build
pnpm lint             # Biome lint check
pnpm lint:fix         # Biome lint + auto-fix
pnpm format           # Biome format
```

## Conventions

- **No raw SVGs** - use lucide-react icons everywhere
- **All buttons** must have `type="button"` (Biome enforces this)
- **Biome** for formatting and linting - run `pnpm lint` before committing
- **Tailwind** for all styling, no CSS modules or inline styles (except dynamic values)
- **Zustand** single store pattern - all state in `app-store.ts`
- Dark/light mode via `.dark` class on `<html>`, custom theme colors in `index.css`
- File parsing is async and uses dynamic imports for Tauri plugins
- Book IDs are SHA-256 hashes; removed book progress is preserved keyed by file path

## CI

GitHub Actions runs on PRs to `main`: Biome lint, TypeScript check, Vite build.
