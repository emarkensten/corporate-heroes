// In-memory word storage for live demo
// In production, use Vercel KV or similar

type Word = {
  id: string;
  text: string;
  timestamp: number;
};

// Global store (persists across requests in dev, resets on deploy)
const globalStore = globalThis as unknown as {
  words: Word[];
};

if (!globalStore.words) {
  globalStore.words = [];
}

export function getWords(): Word[] {
  return globalStore.words;
}

export function addWord(text: string): Word {
  const word: Word = {
    id: crypto.randomUUID(),
    text: text.trim().toUpperCase(),
    timestamp: Date.now(),
  };
  globalStore.words.push(word);
  return word;
}

export function clearWords(): void {
  globalStore.words = [];
}

export function getWordTexts(): string[] {
  return globalStore.words.map((w) => w.text);
}
