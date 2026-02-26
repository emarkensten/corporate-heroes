import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Retry configuration
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

// Exponential backoff retry wrapper
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on certain errors
      const errorMessage = lastError.message.toLowerCase();
      if (
        errorMessage.includes("invalid api key") ||
        errorMessage.includes("quota exceeded") ||
        errorMessage.includes("safety")
      ) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      console.log(
        `[${context}] Attempt ${attempt + 1}/${MAX_RETRIES} failed: ${lastError.message}. Retrying in ${delay}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error(`${context} failed after ${MAX_RETRIES} retries`);
}

// The Corporate Heroes System Prompt - Power Ballad VERSION (~1:30 min) - ENGLISH
const MC_KPI_PROMPT = `You are the songwriter for "The Corporate Heroes", an 80s power ballad rock band.

THE THEME: This is a LOVE SONG and TRIBUTE to the heroes in the audience - people working to make the world better. Core themes:
- Love for humanity and our planet
- Hope for a brighter future
- Fighting climate change, reaching sustainability goals
- Building a better world together (Agenda 2030 spirit)
- The audience ARE the heroes - celebrate them!

TASK: Write a powerful, emotional power ballad (max 15 lines) inspired by these words from the audience: {KEYWORDS}
{CROWD_SECTION}

CREATIVE APPROACH:
- This is a LOVE BALLAD - make it emotional, hopeful, inspiring
- The words are gifts from the heroes in the crowd - weave them in with gratitude
- Transform the words into poetic metaphors about hope, change, and love
- Celebrate the people fighting for a better tomorrow
- Be ORIGINAL - vary openings, perspectives, narratives

STRUCTURE:
- [Verse] - Set the scene, weave in keywords (4-5 lines)
- [Chorus] - The hopeful hook, repeat it (4-5 lines)
- [Outro] - Epic ending, call to action (3-4 lines)
- NO bridge - keep it punchy!

TECHNICAL RULES FOR SUNO:
- Max 15 lines total
- Parentheses () only for backing vocals: (Yeah!), (Ooh!), (Hey!)
- NO asterisks, instructions, or sound effects
- One strong hopeful hook that repeats

FEEL: 80s power ballad - epic, dramatic, HOPEFUL. Think Europe "The Final Countdown", Survivor "Eye of the Tiger", Bonnie Tyler "Holding Out for a Hero" - but about saving the world through love.

Generate ONLY the lyrics. Nothing else.`;

// Word preprocessing prompt - cleans, translates, and selects best words
const WORD_CLEANUP_PROMPT = `You are a word processor. Given a list of words/phrases, you must:

1. FIX SPELLING: Correct any misspelled words
2. TRANSLATE TO ENGLISH: If any words are in Swedish or other languages, translate them to English
3. REMOVE DUPLICATES: Remove duplicate or very similar words
4. SELECT THE BEST: If there are more than 15 words, select the 15 most inspiring/diverse words

IMPORTANT: Do NOT add any new words. Only return words from the input list (cleaned/translated). Never invent or add words that weren't provided.

INPUT WORDS: {WORDS}

RESPOND WITH ONLY a comma-separated list of cleaned English words. No explanations, no numbering, just the words.
Example: If input is "HÅLLBARHET, hope, HOPP" → output: SUSTAINABILITY, HOPE`;

// Preprocess words: translate, fix spelling, limit count
export async function preprocessWords(words: string[]): Promise<string[]> {
  if (words.length === 0) return [];

  // Use gemini-3-flash with minimal thinking for fastest preprocessing
  const model = genAI.getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      // @ts-expect-error - thinkingConfig not in types yet but supported by API
      thinkingConfig: { thinkingLevel: "minimal" }
    }
  });

  const prompt = WORD_CLEANUP_PROMPT.replace("{WORDS}", words.join(", "));

  try {
    const cleanedText = await withRetry(async () => {
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    }, "preprocessWords");

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
  console.log("[generateLyrics] Starting with", keywords.length, "keywords, image:", imageBase64 ? `${Math.round(imageBase64.length / 1024)}KB` : "none");
  // Default thinking (auto/high) for best creative quality - maxDuration=60 in route handles timeout
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-pro-preview" });

  // Build prompt with optional crowd section - extract visual details for the song
  const crowdSection = imageBase64
    ? `

THE HEROES IN THE IMAGE (IMPORTANT - use these details prominently!):
Study the image carefully and identify 3-5 visual details to weave into the song:
- How many people are there? Describe the group (a mighty crowd, a small band of warriors, etc.)
- What's the energy/mood? (determined faces, hopeful smiles, united stance)
- Any notable gestures or poses? (raised hands, arms crossed, leaning in)
- The setting/environment? (office, conference room, outdoor, lighting)
- Any standout features that make this group unique?

These heroes are the SUBJECT of the song - make them feel SEEN and CELEBRATED.
Weave at least 2-3 of these visual observations into different parts of the song.
Example: "Fifteen warriors standing tall" or "In this room of golden light" or "With your hands raised to the sky"`
    : "";

  const prompt = MC_KPI_PROMPT
    .replace("{KEYWORDS}", keywords.join(", "))
    .replace("{CROWD_SECTION}", crowdSection);

  // If image provided, send as multimodal request (one API call)
  if (imageBase64) {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    console.log("[generateLyrics] Sending multimodal request to Gemini, image size:", Math.round(base64Data.length / 1024), "KB");

    return withRetry(async () => {
      console.log("[generateLyrics] API call starting...");
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Data,
          },
        },
      ]);
      console.log("[generateLyrics] API call completed!");
      return result.response.text().replace(/\*+/g, '');
    }, "generateLyrics (with image)");
  }

  // No image - text only
  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    return result.response.text().replace(/\*+/g, '');
  }, "generateLyrics");
}

export async function generateGTAImage(imageBase64: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-image-preview" });

  // 80s Power Ballad LP on table - photorealistic scene
  const prompt = `[SCENE COMPOSITION] Create a photorealistic photograph of a vintage vinyl LP record lying on a dark wooden table. The LP sleeve is the main focus, photographed from a slight angle above. Soft natural lighting from a window. The vinyl record is partially slid out of the sleeve, showing the black grooves.

[THE ALBUM COVER ON THE SLEEVE] The LP sleeve shows a classic 1980s glam rock / power ballad album cover featuring the person(s) from this photo transformed:

- PHOTOREALISTIC portrait photography style (like Def Leppard, Bon Jovi, Europe album covers)
- Keep their original clothing VISIBLE but layer 80s rock accessories ON TOP:
  * Add an open leather/denim vest or unbuttoned jacket over their clothes
  * Add metal studs, chains, pins, patches to their existing outfit
  * Bandanas, wristbands, fingerless gloves, big belt buckles
  * Their original shirt/clothing should still be visible underneath
- Add big, voluminous 80s teased hair with hairspray volume
- Dramatic studio lighting with purple/pink/gold gels, slight soft focus glow
- Bold 80s makeup: defined eyebrows, dramatic eyeshadow, maybe some glitter
- Heroic confident poses, intense gazes
- Facial features MUST remain clearly recognizable - this is crucial
- NO sunglasses, NO masks covering faces

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

  return withRetry(async () => {
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
  }, "generateGTAImage");
}
