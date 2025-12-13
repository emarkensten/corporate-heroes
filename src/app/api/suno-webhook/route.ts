import { NextRequest, NextResponse } from "next/server";
import { setSunoResult } from "@/lib/suno-store";

// Suno webhook callback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Suno webhook received:", JSON.stringify(body, null, 2));

    // Extract task ID and status from webhook payload
    const taskId = body.taskId || body.task_id || body.data?.taskId;

    if (!taskId) {
      console.error("Webhook missing taskId:", body);
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    // Determine status
    const status = body.status || body.data?.status;
    const isCompleted = status === "completed" || status === "SUCCESS" || body.code === 200;
    const isFailed = status === "failed" || status === "FAILED" || body.code >= 400;

    // Extract audio URLs
    const musicDetails = body.data?.musicDetails || body.musicDetails || [];
    const audioUrl = musicDetails[0]?.audioUrl || body.data?.audioUrl || body.audioUrl;

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
