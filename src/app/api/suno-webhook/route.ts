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

    // Determine status
    const status = body.status || body.data?.status;
    const isCompleted = status === "completed" || status === "SUCCESS" || body.code === 200;
    const isFailed = status === "failed" || status === "FAILED" || body.code >= 400;

    // Extract audio URLs from nested data structure
    // Suno returns: body.data.data[0].audio_url
    const songsArray = body.data?.data || body.data?.musicDetails || body.musicDetails || [];
    const firstSong = songsArray[0] || {};

    const audioUrl =
      firstSong.audio_url ||
      firstSong.audioUrl ||
      firstSong.source_audio_url ||
      body.data?.audioUrl ||
      body.audioUrl;

    // Convert snake_case to camelCase for consistency
    const musicDetails = songsArray.map((song: any) => ({
      audioUrl: song.audio_url || song.audioUrl,
      title: song.title,
      duration: song.duration,
      imageUrl: song.image_url,
    }));

    setSunoResult(taskId, {
      status: isFailed ? "failed" : isCompleted ? "completed" : "processing",
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
