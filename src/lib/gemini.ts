import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// The Corporate Heroes System Prompt - Power Ballad VERSION (~1:30 min) - ENGLISH
const MC_KPI_PROMPT = `You are the songwriter for "The Corporate Heroes", an 80s power ballad rock band.

TASK: Write a powerful, emotional power ballad (max 20 lines) that creatively weaves together these words: {KEYWORDS}
{CROWD_SECTION}

CREATIVE FREEDOM:
- Be ORIGINAL! Each song should feel unique - vary openings, perspectives, and narratives
- Blend the words naturally throughout THE ENTIRE song - don't clump them in one section
- Use the words as inspiration, not a checklist - transform them into poetic metaphors
- Create unexpected connections between corporate language and emotional themes

STRUCTURE (flexible - choose what fits the story):
- Use [Intro], [Verse], [Chorus], [Bridge], [Outro] as needed
- DON'T always start with "I see..." - vary it!
- Opening ideas: in the middle of action, a question, a metaphor, a dream, a memory

TECHNICAL RULES FOR SUNO:
- Max 20 lines total
- Parentheses () only for backing vocals: (Yeah!), (Ooh!), (Hey!)
- NO asterisks, instructions, or sound effects
- One strong hook that repeats

FEEL: 80s power ballad - epic, dramatic, hopeful. Think Europe, Survivor, Bonnie Tyler.

Generate ONLY the lyrics. Nothing else.`;

// Word preprocessing prompt - cleans, translates, and selects best words
const WORD_CLEANUP_PROMPT = `You are a word processor. Given a list of words/phrases, you must:

1. FIX SPELLING: Correct any misspelled words
2. TRANSLATE TO ENGLISH: If any words are in Swedish or other languages, translate them to English
3. REMOVE DUPLICATES: Remove duplicate or very similar words
4. SELECT THE BEST: If there are more than 15 words, select the 15 most interesting/diverse corporate buzzwords that would make a great power ballad

INPUT WORDS: {WORDS}

RESPOND WITH ONLY a comma-separated list of cleaned English words. No explanations, no numbering, just the words.
Example output: SYNERGY, DISRUPTION, INNOVATION, LEADERSHIP, GROWTH`;

// Preprocess words: translate, fix spelling, limit count
export async function preprocessWords(words: string[]): Promise<string[]> {
  if (words.length === 0) return [];

  // If 5 or fewer words, skip preprocessing to save API call
  if (words.length <= 5) {
    return words.map(w => w.trim().toUpperCase());
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = WORD_CLEANUP_PROMPT.replace("{WORDS}", words.join(", "));

  try {
    const result = await model.generateContent(prompt);
    const cleanedText = result.response.text().trim();

    // Parse the comma-separated response
    const cleanedWords = cleanedText
      .split(",")
      .map(w => w.trim().toUpperCase())
      .filter(w => w.length > 0);

    console.log("Word preprocessing:", {
      input: words.length,
      output: cleanedWords.length,
      words: cleanedWords
    });

    return cleanedWords;
  } catch (error) {
    console.error("Word preprocessing failed, using original words:", error);
    // Fallback: just take first 15 words
    return words.slice(0, 15).map(w => w.trim().toUpperCase());
  }
}

export async function generateLyrics(
  keywords: string[],
  imageBase64?: string
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

  // Build prompt with optional crowd section - integrated throughout (ENGLISH)
  const crowdSection = imageBase64
    ? "\n\nTHE CROWD IN THE IMAGE:\nLook at the image and find ONE interesting detail (not clothing!) - it could be an expression, a gesture, number of people, or the energy in the room. Weave this detail SUBTLY somewhere in the song - it doesn't have to be at the beginning. Make it feel natural, not forced."
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
- Keep their EXACT clothing - do NOT change to leather jackets or band shirts
- Add big, voluminous 80s teased hair with hairspray volume
- Dramatic studio lighting with purple/pink/gold gels, slight soft focus glow
- Bold 80s makeup: defined eyebrows, dramatic eyeshadow
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
  console.log("Gemini image response - full structure:", JSON.stringify({
    candidatesLength: response.candidates?.length,
    candidate0: response.candidates?.[0] ? {
      finishReason: response.candidates[0].finishReason,
      hasContent: !!response.candidates[0].content,
      partsLength: response.candidates[0].content?.parts?.length,
      parts: response.candidates[0].content?.parts?.map(p => ({
        hasText: "text" in p,
        textPreview: "text" in p ? (p.text as string).substring(0, 100) : undefined,
        hasInlineData: "inlineData" in p,
        mimeType: "inlineData" in p ? p.inlineData?.mimeType : undefined
      }))
    } : "no candidate",
    promptFeedback: response.promptFeedback
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
