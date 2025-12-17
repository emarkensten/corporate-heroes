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

  // GTA group portrait prompt - optimized for crowd photos
  const prompt = `[Composition & Zoom - Highest Priority] Re-imagine the wide-angle photo into a tightly composed, zoomed-in group portrait in Grand Theft Auto V loading screen art style. Aggressively crop background dead space. Visually compress and re-arrange people from the original periphery towards the center to create a dense, unified crowd that completely fills the frame. Individuals must be large enough to be clearly recognizable.

[Hardcore Vibe & Attire] Transform the entire tightly packed group into hardcore gangsta characters.

Poses & Attitude: Change passive postures to tough, aggressive hip-hop stances within the dense crowd: crossed arms, leaning with swagger, crouching in the front row. Expressions must be serious scowls and 'mean mugs' – absolutely no smiling.

Gear: Apply heavy accessories: thick gold and diamond chains, oversized watches, rings. Clothing should be open denim vests over hoodies, basketball jerseys, and designer track jackets.

Headwear & Ink: Add many snapback caps, specifying they MUST be worn backwards or sideways so foreheads remain visible. Add bandanas tied as headbands. Add extensive visible tattoos on arms (sleeves) and necks.

[Identity Preservation Constraint] Despite heavy styling and tight packing, individual facial features, hairstyles, and hair colors must remain distinctly recognizable. Crucially: NO sunglasses covering eyes, and NO bandanas or masks covering the lower face.

[Art Style & Setting] Sunny Los Santos background with palm trees and Deco buildings tightly framing the group. Bright, high-contrast California afternoon light with warm golden tones. Bold comic book outlines and cel-shading. No text.`;

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
