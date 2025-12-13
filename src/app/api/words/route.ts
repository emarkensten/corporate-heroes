import { NextRequest, NextResponse } from "next/server";
import { getWords, addWord, clearWords } from "@/lib/store";

export async function GET() {
  const words = getWords();
  return NextResponse.json({ words });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { word } = body;

    if (!word || typeof word !== "string") {
      return NextResponse.json(
        { error: "Word is required" },
        { status: 400 }
      );
    }

    const trimmed = word.trim();
    if (trimmed.length === 0 || trimmed.length > 50) {
      return NextResponse.json(
        { error: "Word must be 1-50 characters" },
        { status: 400 }
      );
    }

    const newWord = addWord(trimmed);
    return NextResponse.json({ success: true, word: newWord });
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  clearWords();
  return NextResponse.json({ success: true });
}
