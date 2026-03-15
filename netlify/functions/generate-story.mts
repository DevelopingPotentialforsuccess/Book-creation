import type { Context } from "@netlify/functions";
import { GoogleGenAI, Type } from "@google/genai";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const {
      titleHint, genre, ageGroup, level, characters, setting,
      pageCount, wordsPerPage, language, tone, contextFiles, heroAvatars
    } = body;

    const ai = new GoogleGenAI({ apiKey });

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

    const avatarParts = (heroAvatars || []).map((data: string) => ({
      inlineData: { data: data.split(',')[1], mimeType: 'image/jpeg' }
    }));

    const parts: any[] = [
      ...(contextFiles || []).map((f: { data: string; mimeType: string }) => ({
        inlineData: { data: f.data.split(',')[1], mimeType: f.mimeType }
      })),
      ...avatarParts
    ];

    const textPart = {
      text: `Create a professional book titled "${titleHint || 'Untitled'}" in the "${genre}" genre.
    AGE GROUP: ${ageGroup}.
    SETTING: ${setting || 'A magical world'}.
    CHARACTERS: ${characters}${heroAvatars?.length > 0 ? ` (Note: The main characters must look exactly like the children in the provided ${heroAvatars.length} reference images).` : ''}.
    READING LEVEL: Level ${level} of 10 (${complexityDesc}).
    LANGUAGE: ${language}.
    LANGUAGE TONE: ${tone} (${tone === 'Formal/Written' ? 'formal and literary' : 'natural and conversational'}).
    PAGES: Exactly ${pageCount} pages.
    WORDS PER PAGE: Approximately ${wordsPerPage}.

    CRITICAL INSTRUCTION: If Reading Level is Level 1, use "very very easy" vocabulary suited for toddlers learning to read.

    For each page, provide:
    1. A short, creative Chapter/Page Title (for Table of Contents).
    2. The story text for that page.
    3. A detailed image generation prompt for illustrations that describes the characters consistently based on the provided reference images.

    Return valid JSON. Be extremely thorough. Do not truncate the story.`
    };

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
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
    const result = JSON.parse(response.text);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Story generation failed:", error);
    return new Response(JSON.stringify({ error: error.message || "Story generation failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
