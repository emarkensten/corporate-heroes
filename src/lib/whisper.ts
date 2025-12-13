import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export async function transcribeWithTimestamps(
  audioUrl: string
): Promise<WordTimestamp[]> {
  // Fetch the audio file
  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to fetch audio: ${audioResponse.statusText}`);
  }

  const audioBuffer = await audioResponse.arrayBuffer();
  const audioFile = new File([audioBuffer], "audio.mp3", { type: "audio/mpeg" });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "whisper-1",
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
  });

  // Extract word-level timestamps
  const words: WordTimestamp[] = [];

  if (transcription.words) {
    for (const word of transcription.words) {
      words.push({
        word: word.word,
        start: word.start,
        end: word.end,
      });
    }
  }

  return words;
}
