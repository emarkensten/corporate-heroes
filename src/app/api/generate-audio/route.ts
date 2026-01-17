import { NextRequest, NextResponse } from "next/server";
import { generateMusic, waitForMusic, separateStems, waitForStems } from "@/lib/suno";
import { transcribeWithTimestamps } from "@/lib/whisper";

export const maxDuration = 300; // 5 minute timeout for this route

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { lyrics, title } = body;

    if (!lyrics || typeof lyrics !== "string") {
      return NextResponse.json(
        { error: "Lyrics are required" },
        { status: 400 }
      );
    }

    // Step 1: Generate music with Suno V5
    console.log("Starting music generation...");
    const { taskId: musicTaskId } = await generateMusic(lyrics, title || "Arena Anthem");

    // Step 2: Wait for music to complete
    console.log("Waiting for music generation...");
    const audioUrl = await waitForMusic(musicTaskId);
    console.log("Music generated:", audioUrl);

    // Step 3: Separate stems
    console.log("Starting stem separation...");
    const { taskId: stemTaskId } = await separateStems(audioUrl);

    // Step 4: Wait for stems and get timestamps in parallel
    console.log("Processing stems and transcription...");
    const [stems, timestamps] = await Promise.all([
      waitForStems(stemTaskId),
      transcribeWithTimestamps(audioUrl),
    ]);

    console.log("Generation complete!");

    return NextResponse.json({
      success: true,
      audioUrl,
      stems,
      timestamps,
      lyrics,
    });
  } catch (error) {
    console.error("Audio generation error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate audio: ${message}` },
      { status: 500 }
    );
  }
}
