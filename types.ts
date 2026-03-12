
export enum AppMode {
  DASHBOARD = 'dashboard',
  BOOK_CREATOR = 'book_creator',
  WIMPY_DIARY = 'wimpy_diary'
}

export enum StoryGenre {
  FANTASY = 'Fantasy',
  SCIENCE_FICTION = 'Science Fiction',
  MORAL = 'Moral',
  MYSTERY = 'Mystery',
  THRILLER = 'Thriller',
  ADVENTURE = 'Adventure',
  EDUCATIONAL = 'Educational',
  JOURNAL = 'Diary/Journal Style',
  FUNNY = 'Funny',
  COMEDY = 'Comedy',
  BEDTIME = 'Bedtime Story'
}

export enum AgeGroup {
  PICTURE_BOOK = '0-5 Years (Picture Book)',
  EARLY_READERS = '6-8 Years (Early Readers)',
  MIDDLE_GRADE = '9-12 Years (Middle Grade)',
  TEENS = '13-18 Years (Teens)',
  ADULTS = '18+ Years (Adults)',
  MATURE = 'Mature (Explicit Content)'
}

export enum LanguageTone {
  WRITTEN = 'Formal/Written',
  SPOKEN = 'Informal/Spoken'
}

export enum PaperStyle {
  LINED = 'lined',
  GRID = 'grid',
  DOTTED = 'dotted',
  PLAIN = 'plain',
  DIARY = 'diary',
  VINTAGE = 'vintage',
  MODERN = 'modern',
  NOTEBOOK = 'notebook'
}

export enum PaperSize {
  A3 = 'A3',
  A4 = 'A4',
  A5 = 'A5',
  A6 = 'A6'
}

export enum ImagePosition {
  LEFT = 'left',
  RIGHT = 'right',
  TOP = 'top',
  BOTTOM = 'bottom',
  RANDOM = 'random'
}

export enum Language {
  ENGLISH = 'English',
  KHMER = 'Khmer',
  SPANISH = 'Spanish',
  FRENCH = 'French',
  GERMAN = 'German',
  HINDI = 'Hindi',
  DUTCH = 'Dutch',
  CHINESE = 'Chinese',
  KOREAN = 'Korean',
  JAPANESE = 'Japanese',
  THAI = 'Thai'
}

export enum BookFont {
  HANDWRITTEN = 'font-handwritten',
  PATRICK = 'font-patrick',
  COMING_SOON = 'font-coming-soon',
  MARKER = 'font-marker',
  CLASSIC = 'font-playfair',
  SANS = 'font-inter',
  SERIF = 'font-serif',
  SCHOOL = 'font-school',
  GOCHI = 'font-gochi',
  KHMER = 'font-khmer',
  KHMER_HAND = 'font-khmer-hand',
  TRACING = 'font-tracing'
}

export interface BookPage {
  pageNumber: number;
  title?: string;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  audioData?: string; 
  layout: 'left' | 'right' | 'top' | 'bottom';
}

export interface Book {
  id: string;
  timestamp: number;
  title: string;
  author: string;
  genre: StoryGenre;
  ageGroup: AgeGroup;
  level: number;
  language: Language;
  languageTone: LanguageTone;
  pages: BookPage[];
  coverImageUrl?: string;
  font: BookFont;
  paperStyle: PaperStyle;
  paperSize: PaperSize;
  lineSpacing: number;
  fontSize: number;
  hasVoiceover: boolean;
  highlightText: boolean;
  highlightColor?: string;
  heroAvatars?: string[];
  hasTableOfContents: boolean;
  tocStyle?: 'classic' | 'modern' | 'minimal' | 'playful';
}

export interface TracingItem {
  id: string;
  text: string;
  repeatCount: number;
}

export interface ColoringCard {
  id: string;
  imageUrl: string;
  tracingItems: TracingItem[];
  paperSize: PaperSize;
  transform: {
    x: number;
    y: number;
    scale: number;
  };
}

export interface StoryGenerationResponse {
  title: string;
  pages: {
    pageNumber: number;
    title?: string;
    text: string;
    imagePrompt: string;
  }[];
}
