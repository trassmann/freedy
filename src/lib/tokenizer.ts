export interface Token {
  text: string;
  /** Extra pause multiplier (1.0 = normal, 1.5 = sentence end, 1.2 = comma/colon) */
  pauseMultiplier: number;
  /** Whether this token ends a sentence */
  isSentenceEnd: boolean;
  /** Index in the original flat word list */
  index: number;
}

const SENTENCE_ENDERS = /[.!?]$/;
const CLAUSE_PAUSE = /[,;:]$/;
const LONG_WORD_THRESHOLD = 8;
/** Words above this length get split into multiple ticks with hyphens */
const SPLIT_THRESHOLD = 13;
const ABBREVIATIONS = new Set([
  "mr.", "mrs.", "ms.", "dr.", "prof.", "sr.", "jr.", "st.",
  "inc.", "ltd.", "co.", "corp.", "vs.", "etc.", "e.g.", "i.e.",
  "a.m.", "p.m.", "u.s.", "u.k.", "u.s.a.",
]);

function isAbbreviation(word: string): boolean {
  return ABBREVIATIONS.has(word.toLowerCase());
}

function isCurrencyOrNumber(word: string): boolean {
  return /^[\$\€\£]?\d[\d,.]*%?$/.test(word);
}

function computePauseMultiplier(
  word: string,
  sentencePause: number,
  commaPause: number,
): number {
  if (isCurrencyOrNumber(word)) return 1.0;
  if (isAbbreviation(word)) return 1.0;

  let multiplier = 1.0;

  if (SENTENCE_ENDERS.test(word)) {
    multiplier = sentencePause;
  } else if (CLAUSE_PAUSE.test(word)) {
    multiplier = commaPause;
  }

  // Proportional scaling: longer words get more time
  // 1-5 chars: 1.0x, 6-8: 1.1x, 9-12: 1.2x (longer words get split, see below)
  const len = word.replace(/[^a-zA-Z\u00C0-\u024F\u00DF-\u00FF]/g, "").length;
  if (len >= 9) {
    multiplier *= 1.2;
  } else if (len >= LONG_WORD_THRESHOLD) {
    multiplier *= 1.1;
  }

  return multiplier;
}

/**
 * Split a long word into multiple parts with hyphens.
 * Tries to find natural break points (vowel-consonant boundaries)
 * which roughly approximate syllable breaks.
 */
function splitLongWord(word: string): string[] {
  // Strip trailing punctuation, reattach to last part
  const punctMatch = word.match(/^(.+?)([.,;:!?"""'')\]]+)$/);
  const core = punctMatch ? punctMatch[1]! : word;
  const trailing = punctMatch ? punctMatch[2]! : "";

  if (core.length <= SPLIT_THRESHOLD) {
    return [word];
  }

  const parts: string[] = [];
  let remaining = core;

  while (remaining.length > SPLIT_THRESHOLD) {
    // Try to find a good split point around the middle-ish (between 40-60% of remaining)
    const targetLen = Math.ceil(remaining.length * 0.5);
    const splitIdx = findSplitPoint(remaining, targetLen);

    parts.push(remaining.slice(0, splitIdx) + "-");
    remaining = remaining.slice(splitIdx);
  }

  // Reattach trailing punctuation to the last part
  parts.push(remaining + trailing);
  return parts;
}

/**
 * Find a good character position to split a word near the target index.
 * Prefers splitting at vowel-consonant boundaries (rough syllable breaks).
 */
function findSplitPoint(word: string, target: number): number {
  const vowels = /[aeiouyäöü]/i;
  const minLen = 4; // Don't create parts shorter than 4 chars
  const searchRange = Math.min(4, Math.floor(target / 2));

  // Search around the target for a vowel->consonant transition
  for (let offset = 0; offset <= searchRange; offset++) {
    for (const dir of [0, -1, 1]) {
      const idx = target + offset * dir;
      if (idx < minLen || idx >= word.length - minLen) continue;

      const prev = word[idx - 1]!;
      const curr = word[idx]!;

      // Split after a vowel, before a consonant (natural syllable boundary)
      if (vowels.test(prev) && !vowels.test(curr)) {
        return idx;
      }
    }
  }

  // Fallback: just split at target
  return Math.max(minLen, Math.min(target, word.length - minLen));
}

function isSentenceEnd(word: string, nextWord: string | undefined): boolean {
  if (isCurrencyOrNumber(word)) return false;
  if (isAbbreviation(word)) return false;
  if (!SENTENCE_ENDERS.test(word)) return false;
  if (!nextWord) return true;
  // Next word starts with uppercase -> sentence boundary
  return /^[A-Z\u00C0-\u024F"'\u201C\u2018(]/.test(nextWord);
}

export function tokenize(
  text: string,
  sentencePause: number = 3.0,
  commaPause: number = 2.0,
): Token[] {
  // Normalize whitespace, collapse multiple spaces/newlines
  const cleaned = text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  const rawWords = cleaned.split(/\s+/).filter((w) => w.length > 0);
  const tokens: Token[] = [];
  let tokenIndex = 0;

  for (let i = 0; i < rawWords.length; i++) {
    const word = rawWords[i]!;
    const nextWord = rawWords[i + 1];
    const parts = splitLongWord(word);

    if (parts.length === 1) {
      // Normal word, no splitting needed
      tokens.push({
        text: word,
        pauseMultiplier: computePauseMultiplier(word, sentencePause, commaPause),
        isSentenceEnd: isSentenceEnd(word, nextWord),
        index: tokenIndex++,
      });
    } else {
      // Long word split into multiple ticks
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j]!;
        const isLast = j === parts.length - 1;
        tokens.push({
          text: part,
          pauseMultiplier: isLast ? computePauseMultiplier(word, sentencePause, commaPause) : 1.0,
          isSentenceEnd: isLast && isSentenceEnd(word, nextWord),
          index: tokenIndex++,
        });
      }
    }
  }

  return tokens;
}

/**
 * Group tokens into chunks of `chunkSize`, respecting sentence boundaries.
 * A chunk never spans a sentence boundary.
 */
export function chunkTokens(tokens: Token[], chunkSize: number): Token[][] {
  if (chunkSize <= 1) {
    return tokens.map((t) => [t]);
  }

  const chunks: Token[][] = [];
  let current: Token[] = [];

  for (const token of tokens) {
    current.push(token);

    if (current.length >= chunkSize || token.isSentenceEnd) {
      chunks.push(current);
      current = [];
    }
  }

  if (current.length > 0) {
    chunks.push(current);
  }

  return chunks;
}
