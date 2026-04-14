# fReedy

**Read faster. Read more. Open source.**

Freedy is a free, open-source desktop speed reader that uses RSVP (Rapid Serial Visual Presentation) to help you blast through books, articles, and documents. Drop in an EPUB, PDF, or text file and start reading at up to 1500 words per minute.

[Download the latest release for macOS or Windows HERE](https://github.com/trassmann/freedy/releases/latest)

![Freedy screenshot](screenshot.png)

## Why Freedy?

Most speed reading apps are either web-only, subscription-based, or abandonware. Freedy is a native desktop app that runs on macOS and Windows, works offline, and is completely free. Your books stay on your machine.

## Features

- **Import anything** - EPUB, PDF, plain text, Markdown
- **Adjustable speed** - 100 to 1500 WPM, change on the fly
- **ORP highlighting** - the optimal recognition point is highlighted so your eyes don't have to search for it
- **Smart pacing** - automatically pauses longer at sentence endings and punctuation
- **Multi-word mode** - display 1-5 words at a time
- **Time estimate** - see how much reading time is left
- **Progress tracking** - picks up where you left off, even if you remove and re-add a book
- **Dark mode** - system, light, or dark
- **Keyboard-driven** - full keyboard shortcut support

## Getting Started

You'll need [Rust](https://rustup.rs/), [Node.js](https://nodejs.org/) (v20+), and [pnpm](https://pnpm.io/) (v10+).

```bash
pnpm install
pnpm tauri dev
```

To build for production:

```bash
pnpm tauri build
```

## Keyboard Shortcuts

| Key | Action |
|---|---|
| Space | Play / Pause |
| Left / Right | Skip 1 word |
| Shift+Left / Right | Skip 10 words |
| Up / Down | Adjust WPM |
| Escape | Back to library |

## Built With

Tauri v2, React 19, TypeScript, Tailwind CSS v4, Zustand, Vite, lucide-react, Biome

## License

MIT
