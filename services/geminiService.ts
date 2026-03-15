import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryGenre, Language, StoryGenerationResponse, AgeGroup, LanguageTone } from "../types";

// This line allows the app to see your Netlify keys in the browser
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

/**
 * Generates a book story using Gemini 1.5 Flash (Faster & Higher Free Quota)
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
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
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
      model: "gemini-1.5-flash", // UPDATED TO FLASH 1.5
      contents: { parts: [...parts, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            pages: {
