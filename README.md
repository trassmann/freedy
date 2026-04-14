# Freedy - RSVP Speed Reader

A personal desktop RSVP (Rapid Serial Visual Presentation) speed reading app built with Tauri v2, React, and TypeScript.

## Features

- Import EPUB, PDF, and plain text files
- RSVP reading mode with configurable speed (100-1500 WPM)
- Adjustable chunk size (1-5 words at a time)
- ORP (Optimal Recognition Point) highlighting
- Smart punctuation handling (preserves $3.99, U.S.A., etc.)
- Sentence-aware pacing (extra pause at sentence boundaries)
- Library with reading progress tracking
- Auto-saves position across app restarts
- Dark mode (system/light/dark)
- Font size and family customization
- Keyboard shortcuts

## Prerequisites

- [Rust](https://rustup.rs/) (latest stable)
- [Node.js](https://nodejs.org/) (v20+)
- [pnpm](https://pnpm.io/) (v10+)

## Getting Started

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build
```

## Keyboard Shortcuts (Reader View)

| Key | Action |
|---|---|
| Space | Play / Pause |
| Left Arrow | Back 1 word |
| Right Arrow | Forward 1 word |
| Shift+Left | Back 10 words |
| Shift+Right | Forward 10 words |
| Up Arrow | +25 WPM |
| Down Arrow | -25 WPM |
| Escape | Back to library |

## Tech Stack

- **Tauri v2** - Desktop shell
- **React 19** - UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS v4** - Styling
- **Zustand** - State management
- **epub.js** - EPUB parsing
- **pdfjs-dist** - PDF text extraction
- **tauri-plugin-store** - Persistent storage
