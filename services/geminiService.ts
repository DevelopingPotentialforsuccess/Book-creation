
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryGenre, Language, StoryGenerationResponse, AgeGroup, LanguageTone } from "../types";

/**
 * Generates a book story using Gemini 3 Pro with Table of Contents support.
 */
export const generateBookStory = async (
  titleHint: string,
  genre: StoryGenre,
  ageGroup: AgeGroup,
  level: number,
  characters: string,
  setting: string,
  pageCount: number,
  wordsPerPage: number,
  language: Language,
  tone: LanguageTone,
  contextFiles: { data: string, mimeType: string }[] = [],
  heroAvatars: string[] = []
): Promise<StoryGenerationResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const complexityDesc = [
    "preschool level, extremely easy 3-letter words, very repetitive simple sentences, basic phonics",
    "kindergarten, simple high-frequency words",
    "grade 1, simple narratives, basic sentence structures",
    "grade 2, more adjectives, longer sentences",
    "grade 3-4, standard children book language",
    "grade 5-6, intermediate vocabulary, complex compound sentences",
    "middle school, sophisticated themes, descriptive language",
    "high school, advanced literary vocabulary, symbolism",
    "college level, academic depth, nuanced metaphors",
    "professional/scholar level, maximum linguistic complexity"
  ][Math.min(level - 1, 9)];

  const avatarParts = heroAvatars.map((data, idx) => ({
    inlineData: { data: data.split(',')[1], mimeType: 'image/jpeg' }
  }));

  const parts: any[] = [
    ...contextFiles.map(f => ({
      inlineData: { data: f.data.split(',')[1], mimeType: f.mimeType }
    })),
    ...avatarParts
  ];

  const textPart = {
    text: `Create a professional book titled "${titleHint || 'Untitled'}" in the "${genre}" genre.
    AGE GROUP: ${ageGroup}.
    SETTING: ${setting || 'A magical world'}.
    CHARACTERS: ${characters}${heroAvatars.length > 0 ? ` (Note: The main characters must look exactly like the children in the provided ${heroAvatars.length} reference images).` : ''}.
    READING LEVEL: Level ${level} of 10 (${complexityDesc}).
    LANGUAGE: ${language}.
    LANGUAGE TONE: ${tone} (${tone === LanguageTone.WRITTEN ? 'formal and literary' : 'natural and conversational'}).
    PAGES: Exactly ${pageCount} pages.
    WORDS PER PAGE: Approximately ${wordsPerPage}.
    
    CRITICAL INSTRUCTION: If Reading Level is Level 1, use "very very easy" vocabulary suited for toddlers learning to read.
    
    For each page, provide:
    1. A short, creative Chapter/Page Title (for Table of Contents).
    2. The story text for that page.
    3. A detailed image generation prompt for illustrations that describes the characters consistently based on the provided reference images.
    
    Return valid JSON. Be extremely thorough. Do not truncate the story.`
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts: [...parts, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pageNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING, description: 'Short chapter or page title' },
                  text: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                },
                required: ["pageNumber", "title", "text", "imagePrompt"],
              },
            },
          },
          required: ["title", "pages"],
        },
      },
    });

    if (!response.text) throw new Error("Empty response from Gemini");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Story generation failed, retrying once...", error);
    // Single retry for robustness
    const retry = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: { parts: [...parts, textPart] },
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(retry.text || "{}");
  }
};

/**
 * Generates an illustration. Character consistency is maintained by including reference images.
 */
export const generateIllustration = async (prompt: string, heroAvatars: string[] = []): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [];
  
  heroAvatars.forEach(avatar => {
    parts.push({
      inlineData: {
        data: avatar.split(',')[1],
        mimeType: 'image/jpeg'
      }
    });
  });

  const refNote = heroAvatars.length > 0 ? ` Maintain the exact appearance of the children from the provided reference images as the main characters.` : '';
  parts.push({ text: `Professional artistic book illustration: ${prompt}.${refNote} High artistic quality, vivid lighting, ensure character consistency.` });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { imageConfig: { aspectRatio: "1:1" } }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Image generation failed");
};

export const generateTTS = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) return base64Audio;
  throw new Error("TTS generation failed");
};
