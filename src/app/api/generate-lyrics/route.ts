import { NextRequest, NextResponse } from "next/server";
import { generateLyrics } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keywords, image } = body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json(
        { error: "Keywords array is required" },
        { status: 400 }
      );
    }

    // Pass image for crowd analysis if provided
    const lyrics = await generateLyrics(keywords, image);

    return NextResponse.json({
      success: true,
      lyrics,
    });
  } catch (error) {
    console.error("Lyrics generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate lyrics" },
      { status: 500 }
    );
  }
}
