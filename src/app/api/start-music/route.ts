import { NextRequest, NextResponse } from "next/server";
import { generateMusic } from "@/lib/suno";

// Start music generation and return taskId immediately
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

    // Start generation - returns taskId immediately
    console.log("Starting music generation...");
    const { taskId } = await generateMusic(lyrics, title || "Arena Anthem");
    console.log("Music task started:", taskId);

    return NextResponse.json({
      success: true,
      taskId,
    });
  } catch (error) {
    console.error("Start music error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to start music: ${message}` },
      { status: 500 }
    );
  }
}
