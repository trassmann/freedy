import JSZip from "jszip";
import type { Chapter } from "./types";

/**
 * Parse a file into chapters of text.
 * All parsing happens in the browser/webview using JS libraries.
 */
export async function parseFile(
  filePath: string,
  format: "epub" | "pdf" | "txt",
): Promise<Chapter[]> {
  // Read file bytes via Tauri fs
  const { readFile } = await import("@tauri-apps/plugin-fs");
  const bytes = await readFile(filePath);

  switch (format) {
    case "epub":
      return parseEpub(bytes.buffer as ArrayBuffer);
    case "pdf":
      return parsePdf(bytes.buffer as ArrayBuffer);
    case "txt":
      return parseTxt(bytes);
  }
}

/**
 * Parse EPUB by manually unzipping and reading the XML/XHTML content.
 * EPUBs are ZIP archives containing:
 *   META-INF/container.xml -> points to content.opf
 *   content.opf -> lists spine (reading order) of XHTML files
 *   *.xhtml -> actual chapter content
 */
async function parseEpub(buffer: ArrayBuffer): Promise<Chapter[]> {
  const zip = await JSZip.loadAsync(buffer);

  // 1. Find the rootfile from container.xml
  const containerXml = await zip.file("META-INF/container.xml")?.async("text");
  if (!containerXml) {
    throw new Error("Invalid EPUB: missing META-INF/container.xml");
  }

  const rootfilePath = parseRootfilePath(containerXml);
  if (!rootfilePath) {
    throw new Error("Invalid EPUB: could not find rootfile path in container.xml");
  }

  // 2. Parse the OPF file to get the spine order
  const opfContent = await zip.file(rootfilePath)?.async("text");
  if (!opfContent) {
    throw new Error(`Invalid EPUB: could not read ${rootfilePath}`);
  }

  // Base directory of the OPF file (for resolving relative paths)
  const opfDir = rootfilePath.includes("/")
    ? rootfilePath.substring(0, rootfilePath.lastIndexOf("/") + 1)
    : "";

  const { manifest, spineOrder } = parseOpf(opfContent);

  // 3. Read each spine item in order and extract text
  const chapters: Chapter[] = [];

  for (const idref of spineOrder) {
    const item = manifest.get(idref);
    if (!item) continue;

    const href = item.href;
    const fullPath = opfDir + href;

    try {
      const content = await zip.file(fullPath)?.async("text");
      if (!content) continue;

      const text = stripHtml(content).trim();
      if (text.length > 50) {
        // Skip very short "chapters" (title pages, copyright, etc.)
        chapters.push({
          title: item.title || `Chapter ${chapters.length + 1}`,
          text,
        });
      }
    } catch {
      // Skip files that fail to load
    }
  }

  if (chapters.length === 0) {
    // Fallback: try to read ALL xhtml/html files in the zip
    const htmlFiles = Object.keys(zip.files).filter(
      (f) => f.endsWith(".xhtml") || f.endsWith(".html") || f.endsWith(".htm"),
    );

    for (const filePath of htmlFiles.sort()) {
      try {
        const content = await zip.file(filePath)?.async("text");
        if (!content) continue;
        const text = stripHtml(content).trim();
        if (text.length > 50) {
          chapters.push({
            title: `Chapter ${chapters.length + 1}`,
            text,
          });
        }
      } catch {
        // Skip
      }
    }
  }

  if (chapters.length === 0) {
    throw new Error("Could not extract any text from this EPUB file");
  }

  return chapters;
}

interface ManifestItem {
  href: string;
  mediaType: string;
  title: string;
}

function parseRootfilePath(containerXml: string): string | null {
  const match = containerXml.match(/rootfile[^>]+full-path="([^"]+)"/);
  return match?.[1] ?? null;
}

function parseOpf(opfContent: string): {
  manifest: Map<string, ManifestItem>;
  spineOrder: string[];
} {
  const manifest = new Map<string, ManifestItem>();
  const spineOrder: string[] = [];

  // Parse manifest items
  const itemRegex =
    /<item\s[^>]*?id="([^"]+)"[^>]*?href="([^"]+)"[^>]*?media-type="([^"]+)"[^>]*?\/?>/g;
  let match;
  while ((match = itemRegex.exec(opfContent)) !== null) {
    const id = match[1]!;
    const href = decodeURIComponent(match[2]!);
    const mediaType = match[3]!;
    manifest.set(id, { href, mediaType, title: "" });
  }

  // Also try items where attributes are in different order
  const itemRegex2 =
    /<item\s[^>]*?href="([^"]+)"[^>]*?id="([^"]+)"[^>]*?media-type="([^"]+)"[^>]*?\/?>/g;
  while ((match = itemRegex2.exec(opfContent)) !== null) {
    const href = decodeURIComponent(match[1]!);
    const id = match[2]!;
    const mediaType = match[3]!;
    if (!manifest.has(id)) {
      manifest.set(id, { href, mediaType, title: "" });
    }
  }

  // Parse spine order
  const spineItemRegex = /<itemref\s[^>]*?idref="([^"]+)"[^>]*?\/?>/g;
  while ((match = spineItemRegex.exec(opfContent)) !== null) {
    spineOrder.push(match[1]!);
  }

  return { manifest, spineOrder };
}

/**
 * Strip HTML tags and decode entities to get plain text.
 * Uses DOMParser which is available in the webview.
 */
function stripHtml(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Remove script and style elements
  doc.querySelectorAll("script, style, link, meta").forEach((el) => el.remove());

  // Get text content
  const text = doc.body?.textContent ?? "";

  // Normalize whitespace
  return text.replace(/\s+/g, " ").trim();
}

async function parsePdf(buffer: ArrayBuffer): Promise<Chapter[]> {
  // Tauri's WKWebView doesn't implement async iteration on ReadableStream,
  // which pdf.js uses internally (`for await (const v of stream)`), causing
  // "undefined is not a function (near '...value of readableStream...')".
  // Polyfill it before loading pdf.js.
  polyfillReadableStreamAsyncIterator();

  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerUrl = (await import("pdfjs-dist/legacy/build/pdf.worker.mjs?url")).default;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .trim();
    if (pageText.length > 0) {
      pages.push(pageText);
    }
  }

  pdf.destroy();

  if (pages.length === 0) {
    throw new Error("Could not extract any text from this PDF file");
  }

  // Combine all pages into a single chapter (PDFs don't have chapter metadata)
  return [{ title: "Full Document", text: pages.join("\n\n") }];
}

let readableStreamPolyfilled = false;
function polyfillReadableStreamAsyncIterator(): void {
  if (readableStreamPolyfilled) return;
  readableStreamPolyfilled = true;
  if (typeof ReadableStream === "undefined") return;
  const proto = ReadableStream.prototype as ReadableStream<unknown> & {
    [Symbol.asyncIterator]?: () => AsyncIterator<unknown>;
    values?: () => AsyncIterator<unknown>;
  };
  if (proto[Symbol.asyncIterator]) return;

  async function* iterate(this: ReadableStream<unknown>) {
    const reader = this.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) return;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
  }

  proto[Symbol.asyncIterator] = iterate;
  proto.values = iterate;
}

function parseTxt(bytes: Uint8Array): Chapter[] {
  const text = new TextDecoder().decode(bytes).trim();
  if (text.length === 0) {
    throw new Error("The text file is empty");
  }
  return [{ title: "Full Document", text }];
}

export function detectFormat(filePath: string): "epub" | "pdf" | "txt" {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".epub")) return "epub";
  if (lower.endsWith(".pdf")) return "pdf";
  return "txt";
}
