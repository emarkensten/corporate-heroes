import { NextRequest, NextResponse } from "next/server";
import { generateLyrics, preprocessWords } from "@/lib/gemini";

// Allow up to 300 seconds (5 min) for Gemini Pro with full thinking
// Requires Fluid Compute enabled in Vercel dashboard (default on new projects)
export const maxDuration = 300;

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

    // Preprocess words: translate, fix spelling, limit to best 15
    const cleanedKeywords = await preprocessWords(keywords);
    console.log("Cleaned keywords for lyrics:", cleanedKeywords);

    // Pass image for crowd analysis if provided
    const lyrics = await generateLyrics(cleanedKeywords, image);

    return NextResponse.json({
      success: true,
      lyrics,
      cleanedKeywords,
    });
  } catch (error) {
    console.error("Lyrics generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate lyrics: ${errorMessage}` },
      { status: 500 }
    );
  }
}
