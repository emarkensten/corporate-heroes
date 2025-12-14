import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// MC KPI System Prompt (Copy exactly from spec)
const MC_KPI_PROMPT = `Agera som "MC KPI", en hardcore gangsterrappare (mellanchef).
Skriv en rap-låt baserat på orden: {KEYWORDS}.
{CROWD_SECTION}

VIKTIGA INSTRUKTIONER FÖR SUNO V5 (FÖLJ SLAVISKT):
1. STRUKTUR:
   - [Intro] (Kort, talad, sätt stämningen)
   - [Verse 1] (Hårt, aggressivt flow, max 7 ord/rad)
   - [Flow Switch] (Viktig tagg! Lägg in denna mitt i versen)
   - [Chorus] (Catchy, repeterbar)
   - [Break] (Kort paus)
   - [Verse 2] (Aggressivare)
   - [Outro] (Fade out)

2. AD-LIBS:
   - Använd parenteser () för bakgrundsröster i slutet av rader.
   - Exempel: "Budgeten är sprängd (Ka-ching!)"

3. INNEHÅLL:
   - Blanda orten-slang med "Corporate Swenglish".
   - Var extremt dramatisk. Allt är på liv och död.

Generera BARA texten. Inget annat snack.`;

// Analyze crowd photo and return a brief description
async function describeCrowd(imageBase64: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const result = await model.generateContent([
      `Beskriv kort personerna på detta foto. Max 2 meningar på svenska.
       Fokusera på: antal personer, vad de har på sig, deras uttryck/stämning.
       Exempel: "En grupp på 8 personer i business casual, de ser förväntansfulla ut."
       Om du inte kan se några personer tydligt, svara "en publik av corporate warriors".`,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Data,
        },
      },
    ]);

    return result.response.text().trim();
  } catch (error) {
    console.error("Crowd description error:", error);
    return "en publik av corporate warriors";
  }
}

export async function generateLyrics(
  keywords: string[],
  imageBase64?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  // Analyze crowd if image provided
  let crowdSection = "";
  if (imageBase64) {
    const crowdDescription = await describeCrowd(imageBase64);
    crowdSection = `\nPubliken: ${crowdDescription}\nInkludera någon referens till publiken i texten.`;
  }

  const prompt = MC_KPI_PROMPT
    .replace("{KEYWORDS}", keywords.join(", "))
    .replace("{CROWD_SECTION}", crowdSection);

  const result = await model.generateContent(prompt);
  const response = result.response;
  // Strip markdown bold formatting - Suno skips words wrapped in **
  return response.text().replace(/\*\*/g, '');
}

export async function generateGTAImage(imageBase64: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

  const prompt = "Transform this photo into Grand Theft Auto V loading screen art style. High contrast, comic book shading, gangster vibes, bold colors. Make it look like a GTA character portrait. Do not include any text, logos, watermarks, or lettering in the image.";

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
