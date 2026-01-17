import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// The Corporate Heroes System Prompt - Power Ballad VERSION (~1:30 min)
const MC_KPI_PROMPT = `Du är låtskrivare för "The Corporate Heroes", ett 80-tals power ballad-band.

UPPGIFT: Skriv en kraftfull, emotionell power ballad (max 20 rader) som kreativt väver samman dessa ord: {KEYWORDS}
{CROWD_SECTION}

KREATIV FRIHET:
- Var ORIGINELL! Varje låt ska kännas unik - variera öppningar, perspektiv och narrativ
- Blanda orden naturligt genom HELA låten - inte klumpat ihop i ett stycke
- Använd orden som inspiration, inte checklista - omforma dem till poetiska metaforer
- Skapa oväntade kopplingar mellan corporate-språk och emotionella teman

STRUKTUR (flexibel - välj vad som passar berättelsen):
- Använd [Intro], [Verse], [Chorus], [Bridge], [Outro] där det passar
- Börja INTE alltid med "Jag ser..." - variera!
- Några idéer för öppningar: mitt i handlingen, en fråga, en metafor, en dröm, ett minne

TEKNISKA REGLER FÖR SUNO:
- Max 20 rader totalt
- Parenteser () endast för bakgrundsutrop: (Yeah!), (Ooh!), (Hey!)
- INGA asterisker, instruktioner eller ljudeffekter
- En stark hook som upprepas

KÄNSLA: 80-tals power ballad - episk, dramatisk, hoppfull. Tänk Europe, Survivor, Bonnie Tyler.

Generera BARA låttexten.`;

export async function generateLyrics(
  keywords: string[],
  imageBase64?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

  // Build prompt with optional crowd section - integrated throughout
  const crowdSection = imageBase64
    ? "\n\nPUBLIKEN I BILDEN:\nTitta på bilden och hitta EN intressant detalj (inte kläder!) - det kan vara ett uttryck, en gest, antal personer, energin i rummet. Väv in denna detalj SUBTILT någonstans i låten - det behöver inte vara i början. Låt det kännas naturligt, inte påtvingat."
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
  const prompt = `[SCENE] Photorealistic photo of a vintage vinyl LP record on a dark wooden table. Soft natural lighting. The vinyl is partially slid out of the sleeve.

[ALBUM COVER ON THE SLEEVE] Transform the person(s) in this photo into a classic 1980s power ballad album cover:

CRITICAL - PRESERVE THESE EXACTLY:
- The EXACT clothing they are wearing (do NOT change to leather jackets or band shirts)
- Their facial features must be clearly recognizable
- Their body position and pose

ADD THESE 80s ROCK STAR ELEMENTS:
- Big, voluminous 80s teased/feathered hair (add hairspray volume!)
- Dramatic studio lighting with purple/pink/gold gels
- Soft focus glow effect around them
- 80s makeup: bold eyeshadow, defined features
- Confident, heroic expression
- Optional: subtle accessories like a bandana, wristbands, or chains

[TEXT ON SLEEVE]
- "THE CORPORATE HEROES" in chrome/metallic 80s font at top
- "POWER ANTHEM" smaller below

[PHYSICAL LP REALISM]
- Worn sleeve with bent corners, loved album look
- Cardboard texture visible
- Wood grain on table
- Soft shadows

[STYLE] The LP scene is photorealistic. The album cover has 80s styling but the person keeps their original clothes.`;

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
