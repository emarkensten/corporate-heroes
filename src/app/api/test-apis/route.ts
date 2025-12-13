import { NextResponse } from "next/server";

export async function GET() {
  const results: Record<string, { success: boolean; message: string; data?: unknown }> = {};

  // Test 1: Check environment variables
  results.env = {
    success: !!(process.env.OPENAI_API_KEY && process.env.GEMINI_API_KEY && process.env.SUNO_API_KEY),
    message: `OPENAI: ${process.env.OPENAI_API_KEY ? "✓" : "✗"}, GEMINI: ${process.env.GEMINI_API_KEY ? "✓" : "✗"}, SUNO: ${process.env.SUNO_API_KEY ? "✓" : "✗"}`,
  };

  // Test 2: Suno API - check auth with required callBackUrl
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://corporate-gangsta.vercel.app";
    const sunoResponse = await fetch("https://api.sunoapi.org/api/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUNO_API_KEY}`,
      },
      body: JSON.stringify({
        customMode: false,
        instrumental: true,
        model: "V4", // Use cheaper model for test
        prompt: "short test beat",
        callBackUrl: `${baseUrl}/api/suno-webhook`,
      }),
    });

    const sunoText = await sunoResponse.text();
    console.log("Suno test response:", sunoText);

    const sunoData = JSON.parse(sunoText);

    // Check for API-level success (code 200 means success)
    if (sunoData.code === 200 && sunoData.data?.taskId) {
      results.suno = {
        success: true,
        message: `Suno API connected! Task started: ${sunoData.data.taskId}`,
        data: sunoData,
      };
    } else {
      results.suno = {
        success: false,
        message: `Suno API error: ${sunoData.msg || JSON.stringify(sunoData)}`,
        data: sunoData,
      };
    }
  } catch (error) {
    results.suno = {
      success: false,
      message: `Suno API error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }

  // Test 3: Gemini API
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // Use fast model for test

    const result = await model.generateContent("Say 'API test successful' in exactly 3 words");
    const text = result.response.text();

    results.gemini = {
      success: true,
      message: "Gemini API connected",
      data: { response: text.substring(0, 100) },
    };
  } catch (error) {
    results.gemini = {
      success: false,
      message: `Gemini API error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }

  // Test 4: OpenAI API (just verify key works)
  try {
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const models = await openai.models.list();
    const hasWhisper = models.data.some((m) => m.id.includes("whisper"));

    results.openai = {
      success: true,
      message: `OpenAI API connected. Whisper available: ${hasWhisper ? "✓" : "✗"}`,
    };
  } catch (error) {
    results.openai = {
      success: false,
      message: `OpenAI API error: ${error instanceof Error ? error.message : "Unknown"}`,
    };
  }

  const allSuccess = Object.values(results).every((r) => r.success);

  return NextResponse.json({
    success: allSuccess,
    results,
  });
}
