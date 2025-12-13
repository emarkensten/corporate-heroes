// In-memory store for Suno webhook results
// In production, use Redis or a database

interface SunoResult {
  taskId: string;
  status: "pending" | "processing" | "completed" | "failed";
  streamAudioUrl?: string; // Fast stream URL (30-40 sec)
  audioUrl?: string; // Full download URL (2-3 min)
  musicDetails?: Array<{
    audioUrl: string;
    streamAudioUrl?: string;
    title: string;
    duration: number;
  }>;
  error?: string;
  updatedAt: number;
}

const globalStore = globalThis as unknown as {
  sunoResults: Map<string, SunoResult>;
};

if (!globalStore.sunoResults) {
  globalStore.sunoResults = new Map();
}

export function setSunoResult(taskId: string, result: Partial<SunoResult>) {
  const existing = globalStore.sunoResults.get(taskId) || {
    taskId,
    status: "pending" as const,
    updatedAt: Date.now(),
  };

  globalStore.sunoResults.set(taskId, {
    ...existing,
    ...result,
    updatedAt: Date.now(),
  });
}

export function getSunoResult(taskId: string): SunoResult | undefined {
  return globalStore.sunoResults.get(taskId);
}

export function initSunoTask(taskId: string) {
  setSunoResult(taskId, { status: "pending" });
}
