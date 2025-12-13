import { NextRequest, NextResponse } from "next/server";
import { setSunoResult } from "@/lib/suno-store";

// Suno webhook callback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Suno webhook received:", JSON.stringify(body, null, 2));

    // Extract task ID from webhook payload (handle both camelCase and snake_case)
    const taskId = body.taskId || body.task_id || body.data?.taskId || body.data?.task_id;

    if (!taskId) {
      console.error("Webhook missing taskId:", body);
      // Still return 200 to acknowledge receipt
      return NextResponse.json({ received: true, error: "Missing taskId" });
    }

    // Determine status - handle all documented Suno status values
    // Callbacks happen at: TEXT_SUCCESS, FIRST_SUCCESS (first track ready), SUCCESS (all ready)
    const status = body.status || body.data?.status;
    const isCompleted =
      status === "completed" ||
      status === "SUCCESS" ||
      status === "FIRST_SUCCESS" || // First track ready - use for faster playback
      body.code === 200;
    const isFailed =
      status === "failed" ||
      status === "FAILED" ||
      status === "GENERATE_AUDIO_FAILED" ||
      status === "CREATE_TASK_FAILED" ||
      status === "SENSITIVE_WORD_ERROR" ||
      body.code >= 400;

    // Extract audio URLs from nested data structure
    // Suno callback format: body.data.response.sunoData[] or body.data.data[]
    const songsArray =
      body.data?.response?.sunoData ||
      body.data?.data ||
      body.data?.musicDetails ||
      body.musicDetails ||
      [];
    const firstSong = songsArray[0] || {};

    // Prioritize stream URL for faster playback (30-40s vs 2-3min)
    const streamAudioUrl =
      firstSong.stream_audio_url ||
      firstSong.streamAudioUrl ||
      firstSong.source_stream_audio_url;

    // Full audio URL as backup
    const audioUrl =
      firstSong.audio_url ||
      firstSong.audioUrl ||
      firstSong.source_audio_url ||
      body.data?.audioUrl ||
      body.audioUrl;

    // Convert snake_case to camelCase for consistency
    const musicDetails = songsArray.map((song: any) => ({
      streamAudioUrl: song.stream_audio_url || song.streamAudioUrl,
      audioUrl: song.audio_url || song.audioUrl,
      title: song.title,
      duration: song.duration,
      imageUrl: song.image_url,
    }));

    setSunoResult(taskId, {
      status: isFailed ? "failed" : isCompleted ? "completed" : "processing",
      streamAudioUrl,
      audioUrl,
      musicDetails,
      error: isFailed ? (body.msg || body.error || "Generation failed") : undefined,
    });

    console.log(`Suno task ${taskId} updated: ${isCompleted ? "completed" : isFailed ? "failed" : "processing"}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Suno webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

// Also handle GET for testing
export async function GET() {
  return NextResponse.json({ status: "Suno webhook endpoint ready" });
}
