import { StoryGenre, Language, StoryGenerationResponse, AgeGroup, LanguageTone } from "../types";

/**
 * Generates a book story via server-side Netlify Function (avoids CORS / API key exposure)
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
  const response = await fetch('/.netlify/functions/generate-story', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      titleHint, genre, ageGroup, level, characters, setting,
      pageCount, wordsPerPage, language, tone, contextFiles, heroAvatars
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Story generation failed' }));
    throw new Error(err.error || 'Story generation failed');
  }

  return response.json();
};

/**
 * Generates an illustration via server-side Netlify Function
 */
export const generateIllustration = async (prompt: string, heroAvatars: string[] = []): Promise<string> => {
  const response = await fetch('/.netlify/functions/generate-illustration', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, heroAvatars })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Image generation failed' }));
    throw new Error(err.error || 'Image generation failed');
  }

  const data = await response.json();
  return data.imageUrl;
};

/**
 * Generates TTS audio via server-side Netlify Function
 */
export const generateTTS = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const response = await fetch('/.netlify/functions/generate-tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voiceName })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'TTS generation failed' }));
    throw new Error(err.error || 'TTS generation failed');
  }

  const data = await response.json();
  return data.audioData;
};
