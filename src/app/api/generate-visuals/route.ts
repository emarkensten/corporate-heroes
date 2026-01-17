import { NextRequest, NextResponse } from "next/server";
import { generateGTAImage } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Base64 image is required" },
        { status: 400 }
      );
    }

    const gtaImage = await generateGTAImage(image);

    return NextResponse.json({
      success: true,
      image: gtaImage,
    });
  } catch (error) {
    console.error("Image generation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate image: ${errorMessage}` },
      { status: 500 }
    );
  }
}
