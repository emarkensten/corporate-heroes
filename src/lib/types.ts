export interface Word {
  id: string;
  text: string;
  timestamp: number;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface Stems {
  vocals: string;
  bass: string;
  drums: string;
  other: string;
}

export type AppState = "LOBBY" | "CAPTURE" | "LOADING" | "IMAGE_REVEAL" | "PERFORMANCE";

export interface GenerationProgress {
  step: string;
  message: string;
  progress: number;
}

export interface AudioResult {
  audioUrl: string;
  stems: Stems;
  timestamps: WordTimestamp[];
  lyrics: string;
}
