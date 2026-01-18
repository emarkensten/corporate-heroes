// In-memory word storage for live demo
// In production, use Vercel KV or similar

type Word = {
  id: string;
  text: string;
  timestamp: number;
};

// Configuration
const MAX_WORDS = 200;
const WORD_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Global store (persists across requests in dev, resets on deploy)
const globalStore = globalThis as unknown as {
  words: Word[];
  wordSet: Set<string>; // For O(1) duplicate detection
};

if (!globalStore.words) {
  globalStore.words = [];
  globalStore.wordSet = new Set();
}

// Clean expired words
function cleanExpiredWords(): void {
  const now = Date.now();
  const expiredIds: string[] = [];

  globalStore.words = globalStore.words.filter((word) => {
    if (now - word.timestamp > WORD_TTL_MS) {
      expiredIds.push(word.id);
      globalStore.wordSet.delete(word.text);
      return false;
    }
    return true;
  });

  if (expiredIds.length > 0) {
    console.log(`Cleaned ${expiredIds.length} expired words`);
  }
}

export function getWords(): Word[] {
  cleanExpiredWords();
  return [...globalStore.words]; // Return copy to prevent mutation
}

export function addWord(text: string): Word | null {
  cleanExpiredWords();

  const normalizedText = text.trim().toUpperCase();

  // Duplicate check (case-insensitive)
  if (globalStore.wordSet.has(normalizedText)) {
    console.log(`Duplicate word rejected: ${normalizedText}`);
    return null;
  }

  // Capacity check - remove oldest if at limit
  if (globalStore.words.length >= MAX_WORDS) {
    const removed = globalStore.words.shift();
    if (removed) {
      globalStore.wordSet.delete(removed.text);
      console.log(`Removed oldest word due to capacity: ${removed.text}`);
    }
  }

  const word: Word = {
    id: crypto.randomUUID(),
    text: normalizedText,
    timestamp: Date.now(),
  };

  // Atomic-like operation: add to both structures
  globalStore.words.push(word);
  globalStore.wordSet.add(normalizedText);

  return word;
}

export function addWords(texts: string[]): Word[] {
  const added: Word[] = [];
  for (const text of texts) {
    const word = addWord(text);
    if (word) {
      added.push(word);
    }
  }
  return added;
}

export function clearWords(): void {
  globalStore.words = [];
  globalStore.wordSet = new Set();
}

export function getWordTexts(): string[] {
  cleanExpiredWords();
  return globalStore.words.map((w) => w.text);
}

export function getWordCount(): number {
  cleanExpiredWords();
  return globalStore.words.length;
}
