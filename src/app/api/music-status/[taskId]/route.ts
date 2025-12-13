import { NextRequest, NextResponse } from "next/server";
import { getMusicStatus, separateStems, waitForStems } from "@/lib/suno";
import { getSunoResult } from "@/lib/suno-store";
import { transcribeWithTimestamps } from "@/lib/whisper";

export const maxDuration = 60; // Allow up to 60s for stem/transcription processing

interface RouteContext {
  params: Promise<{ taskId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { taskId } = await context.params;

    if (!taskId) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    // First check our local store (updated by webhook)
    const localResult = getSunoResult(taskId);

    // Also poll Suno API directly
    let apiStatus;
    try {
      apiStatus = await getMusicStatus(taskId);
    } catch (err) {
      console.log("API polling error (using local store):", err);
    }

    // Determine status from local store or API
    // FIRST_SUCCESS = first track ready (stream URL available after 30-40s)
    // SUCCESS = all tracks ready (full URLs available after 2-3 min)
    const isCompleted =
      localResult?.status === "completed" ||
      apiStatus?.status === "completed" ||
      apiStatus?.status === "SUCCESS" ||
      apiStatus?.status === "FIRST_SUCCESS"; // Use first track for faster playback

    const isFailed =
      localResult?.status === "failed" ||
      apiStatus?.status === "failed" ||
      apiStatus?.status === "FAILED" ||
      apiStatus?.status === "GENERATE_AUDIO_FAILED" ||
      apiStatus?.status === "CREATE_TASK_FAILED" ||
      apiStatus?.status === "SENSITIVE_WORD_ERROR";

    if (isFailed) {
      return NextResponse.json({
        status: "failed",
        error: localResult?.error || "Music generation failed",
      });
    }

    if (isCompleted) {
      // Get the audio URL - prioritize stream URL for faster playback
      const streamUrl =
        localResult?.streamAudioUrl ||
        apiStatus?.musicDetails?.[0]?.streamAudioUrl;
      const fullUrl =
        localResult?.audioUrl ||
        apiStatus?.musicDetails?.[0]?.audioUrl ||
        apiStatus?.audioUrl;
      const audioUrl = streamUrl || fullUrl;

      if (!audioUrl) {
        return NextResponse.json({
          status: "processing",
          message: "Waiting for audio URL...",
        });
      }

      // Check if we need to process stems and timestamps
      const needsProcessing = request.nextUrl.searchParams.get("process") === "true";

      if (needsProcessing) {
        try {
          // Start stem separation and transcription in parallel
          console.log("Processing stems and transcription...");
          const { taskId: stemTaskId } = await separateStems(audioUrl);

          const [stems, timestamps] = await Promise.all([
            waitForStems(stemTaskId),
            transcribeWithTimestamps(audioUrl),
          ]);

          return NextResponse.json({
            status: "completed",
            audioUrl,
            stems,
            timestamps,
          });
        } catch (processError) {
          console.error("Processing error:", processError);
          // Return completed with just audio if processing fails
          return NextResponse.json({
            status: "completed",
            audioUrl,
            stems: null,
            timestamps: [],
          });
        }
      }

      // Just return the audio URL without processing
      return NextResponse.json({
        status: "completed",
        audioUrl,
      });
    }

    // Still processing
    return NextResponse.json({
      status: "processing",
      message: "Music is being generated...",
    });
  } catch (error) {
    console.error("Music status error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to get music status: ${message}` },
      { status: 500 }
    );
  }
}
