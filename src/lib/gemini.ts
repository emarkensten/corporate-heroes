import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// MC KPI System Prompt - KORT VERSION (~1:30 min)
const MC_KPI_PROMPT = `Agera som "MC KPI", en hardcore gangsterrappare (mellanchef).
Skriv en KORT rap-låt (max 1,5 minut) baserat på orden: {KEYWORDS}.
{CROWD_SECTION}

VIKTIGA INSTRUKTIONER FÖR SUNO V5:
1. KOMPAKT STRUKTUR (max 20 rader totalt):
   - [Intro] (2-4 rader, talad, sätt stämningen)
   - [Verse] (max 6 rader, aggressivt flow)
   - [Chorus] (max 4 rader, catchy och repeterbar)
   - [Outro] (2 rader, fade out)

2. AD-LIBS:
   - Använd parenteser () för bakgrundsröster i slutet av rader.
   - Exempel: "Budgeten är sprängd (Ka-ching!)"
   - ENDAST korta utrop som kan sjungas (Yeah!, Skrrt!, Pow!, etc.)
   - ALDRIG ljudeffekter eller instruktioner som "(explosion)", "(fade out)", "(ljud av X)"

3. INNEHÅLL:
   - Blanda orten-slang med "Corporate Swenglish".
   - Var extremt dramatisk. Allt är på liv och död.
   - Använd INTE asterisker (*) eller annan markdown-formatering.
   - Håll det KORT - max 20 rader totalt!

Generera BARA texten. Inget annat snack.`;

export async function generateLyrics(
  keywords: string[],
  imageBase64?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

  // Build prompt with optional crowd section - TIDIGT i låten
  const crowdSection = imageBase64
    ? "\n\nTitta på bilden av publiken. VIKTIGT: Nämn publiken DIREKT i introt eller första versen (inte i slutet!). Beskriv något specifikt du ser: antal personer, kläder, stämning, eller något unikt."
    : "";

  const prompt = MC_KPI_PROMPT
    .replace("{KEYWORDS}", keywords.join(", "))
    .replace("{CROWD_SECTION}", crowdSection);

  // If image provided, send as multimodal request (one API call)
  if (imageBase64) {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      },
    ]);
    return result.response.text().replace(/\*+/g, '');
  }

  // No image - text only
  const result = await model.generateContent(prompt);
  return result.response.text().replace(/\*+/g, '');
}

export async function generateGTAImage(imageBase64: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

  // Gemini 3 Pro Image prompt - strukturerad för bästa resultat
  // Struktur: [Subject] doing [Action] in [Location]. [Composition]. [Lighting]. [Style].
  const prompt = `A confident person posing for a character portrait in sunny Los Santos, California. Tight composition on face and upper body, looking directly at camera. Bright afternoon sunlight with warm golden hour glow, palm tree shadows. Grand Theft Auto loading screen art style with high contrast cel-shading and bold outlines. Vibrant color palette: coral pink buildings, turquoise sky, sunset orange accents, lush palm greens. No text or watermarks.`;

  // Remove data URL prefix if present
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

  const result = await model.generateContent([
    prompt,
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64Data,
      },
    },
  ]);

  const response = result.response;

  // Check if response contains generated image
  const parts = response.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if ("inlineData" in part && part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  }

  throw new Error("No image generated from Gemini");
}
