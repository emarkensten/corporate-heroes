import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// The Corporate Heroes System Prompt - Power Ballad VERSION (~1:30 min)
const MC_KPI_PROMPT = `Agera som "The Corporate Heroes", ett inspirerande 80s power ballad rockband.
Skriv en KORT power ballad (max 1,5 minut) baserat på orden: {KEYWORDS}.
{CROWD_SECTION}

VIKTIGA INSTRUKTIONER FÖR SUNO V5:
1. KOMPAKT STRUKTUR (max 20 rader totalt):
   - [Intro] (2-4 rader, talad eller mjukt sjungen, sätt stämningen)
   - [Verse] (max 6 rader, bygger känslomässig intensitet)
   - [Chorus] (max 4 rader, anthemisk och kraftfull, lätt att sjunga med i)
   - [Outro] (2 rader, fade out med upprepad hook)

2. AD-LIBS:
   - Använd parenteser () för bakgrundsröster i slutet av rader
   - Exempel: "Vi når våra mål (Yeah!)", "Tillsammans vi står (Ooh!)"
   - ENDAST emotionella utrop som kan sjungas (Yeah!, Ooh!, Hey!, Woah!)
   - ALDRIG ljudeffekter eller instruktioner som "(gitarrsolo)", "(fade out)"

3. INNEHÅLL:
   - Blanda corporate buzzwords med inspirerande, emotionellt laddade metaforer
   - Teman: uthållighet, teamwork, att övervinna motgångar, nå toppen
   - Var EXTREMT dramatisk och emotionell. Allt handlar om att kämpa och vinna
   - Använd INTE asterisker (*) eller markdown-formatering
   - Inkludera upprepade hooks/fraser som är lätta att sjunga med i
   - Håll det KORT - max 20 rader totalt!

4. TONALITET:
   - Inspirerande och hoppfull (inte aggressiv)
   - Emotionell kraft och passion
   - "Vi gör det tillsammans" mentalitet
   - 80-tals power ballad-känsla: episk, dramatisk, anthemisk

Generera BARA texten. Inget annat snack.`;

export async function generateLyrics(
  keywords: string[],
  imageBase64?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

  // Build prompt with optional crowd section - TIDIGT i låten
  const crowdSection = imageBase64
    ? "\n\nTitta på bilden av publiken. VIKTIGT: Nämn publiken DIREKT i introt eller första versen (inte i slutet!). Beskriv något specifikt du ser: antal personer, kläder, energi, eller något unikt. Inkorporera dem som 'heroes' eller 'warriors' i narrativet."
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

  // 80s Power Ballad LP on table - photorealistic scene
  const prompt = `[SCENE COMPOSITION] Create a photorealistic photograph of a vintage vinyl LP record lying on a dark wooden table. The LP sleeve is the main focus, photographed from a slight angle above. Soft natural lighting from a window. The vinyl record is partially slid out of the sleeve, showing the black grooves.

[THE ALBUM COVER ON THE SLEEVE] The LP sleeve shows a classic 1980s glam rock / power ballad album cover featuring the person(s) from this photo transformed:

- PHOTOREALISTIC portrait photography style (like Def Leppard, Bon Jovi, Europe album covers)
- The person(s) styled as 80s rock stars: big teased hair with volume, leather jackets, band t-shirts
- Dramatic studio lighting with purple/pink/gold gels, slight soft focus glow
- Heroic confident poses, intense gazes
- Facial features MUST remain clearly recognizable - this is crucial
- NO sunglasses, NO masks

[ALBUM COVER TEXT ON THE SLEEVE]
- Band name "THE CORPORATE HEROES" in chrome/metallic 80s font at the top
- Album title "POWER ANTHEM" in smaller text below

[PHYSICAL REALISM OF THE SCENE]
- The LP sleeve has slight wear, bent corners - a beloved album
- Realistic paper/cardboard texture of the sleeve
- The wooden table has visible grain
- Soft shadows from the LP
- Perhaps a coffee cup or plant slightly visible at the edge
- The photo should look like it was taken with a nice camera in someone's home

[STYLE] Photorealistic photography of a physical object (the LP), NOT an illustration. The album COVER can have the stylized 80s look, but the SCENE of the LP on the table must be photorealistic.`;

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

  // Debug: Log the full response structure
  console.log("Gemini image response:", JSON.stringify({
    candidates: response.candidates?.length,
    parts: response.candidates?.[0]?.content?.parts?.map(p => ({
      hasText: "text" in p,
      hasInlineData: "inlineData" in p,
      mimeType: "inlineData" in p ? p.inlineData?.mimeType : undefined
    })),
    text: response.text?.() || "no text method"
  }, null, 2));

  // Check if response contains generated image
  const parts = response.candidates?.[0]?.content?.parts;
  if (parts) {
    for (const part of parts) {
      if ("inlineData" in part && part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
  }

  // If no image, log what we got instead
  const textResponse = response.candidates?.[0]?.content?.parts?.find(p => "text" in p);
  if (textResponse && "text" in textResponse) {
    console.log("Gemini returned text instead of image:", textResponse.text);
  }

  throw new Error("No image generated from Gemini");
}
