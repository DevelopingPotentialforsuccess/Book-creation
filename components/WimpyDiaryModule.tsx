
import React, { useState } from 'react';
import { generateBookStory, generateIllustration } from '../services/geminiService';
import { Book, StoryGenre, AgeGroup, Language, LanguageTone, BookFont, PaperStyle, BookPage, ImagePosition, PaperSize } from '../types';
import LoadingSpinner from './LoadingSpinner';
import BookViewer from './BookViewer';

const WimpyDiaryModule: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [topic, setTopic] = useState('');
  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState<StoryGenre>(StoryGenre.JOURNAL);
  const [pageCount, setPageCount] = useState(10);
  const [level, setLevel] = useState(4);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [tone, setTone] = useState<LanguageTone>(LanguageTone.SPOKEN);
  const [paperSize, setPaperSize] = useState<PaperSize>(PaperSize.A4);
  const [paperStyle, setPaperStyle] = useState<PaperStyle>(PaperStyle.LINED);
  const [selectedFont, setSelectedFont] = useState<BookFont>(BookFont.HANDWRITTEN);
  const [fontSize, setFontSize] = useState(20);
  const [layoutMode, setLayoutMode] = useState<ImagePosition>(ImagePosition.TOP);
  const [hasTOC, setHasTOC] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');
  const [book, setBook] = useState<Book | null>(null);

  const generateDiary = async () => {
    if (!topic || !title) return alert("Please provide a title and a topic!");
    setLoading(true);
    setProgress(2);
    setMsg('Architecting massive-scale diary narrative...');

    try {
      const story = await generateBookStory(
        `Diary Title: ${title}. Genre Variation: ${genre}. Detailed Daily Life: ${topic}`, 
        genre, 
        AgeGroup.MIDDLE_GRADE, 
        level,
        "A relatable main character writing their personal diary", 
        "Everyday school and home life", 
        pageCount, 
        70,
        language, 
        tone
      );

      const tocStyles: ('classic' | 'modern' | 'minimal' | 'playful')[] = ['classic', 'modern', 'minimal', 'playful'];

      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        title: title, 
        author: 'Diary Chronicler',
        genre: genre, 
        ageGroup: AgeGroup.MIDDLE_GRADE, 
        level: level,
        language: language, 
        languageTone: tone,
        pages: [], 
        font: selectedFont, 
        paperStyle: paperStyle,
        paperSize: paperSize,
        lineSpacing: 2, 
        fontSize: fontSize, 
        hasVoiceover: false, 
        highlightText: false,
        highlightColor: '#fef08a',
        hasTableOfContents: hasTOC,
        tocStyle: tocStyles[Math.floor(Math.random() * tocStyles.length)]
      };

      const pages: BookPage[] = [];
      const layouts: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];

      for (let i = 0; i < story.pages.length; i++) {
        setMsg(`Sketching diary page ${i + 1} of ${story.pages.length}...`);
        setProgress(5 + ((i + 1) / story.pages.length) * 90);
        
        let imageUrl = "";
        if (i < 30) { // Limit image generation for performance while maintaining quality
          const sketchPrompt = `Minimalist black and white hand-drawn charcoal sketch, simple stick figures, white background: ${story.pages[i].imagePrompt}`;
          try { imageUrl = await generateIllustration(sketchPrompt); } catch (e) { console.warn("Illustration failed."); }
        }
        
        pages.push({
          ...story.pages[i],
          imageUrl: imageUrl || undefined,
          layout: layoutMode === ImagePosition.RANDOM ? layouts[Math.floor(Math.random() * layouts.length)] : layoutMode as any
        });
      }

      setBook({ ...newBook, pages });
      setMsg('Designing Stylized Diary Cover...');
      
      let coverUrl = "";
      try {
        const coverPrompt = `Professional artistic diary cover: ${title}. Hand-drawn charcoal and watercolor style, beautiful and expressive masterpiece.`;
        coverUrl = await generateIllustration(coverPrompt);
      } catch (e) {
        console.warn("Cover generation failed.");
      }
      
      setBook(prev => prev ? ({ ...prev, coverImageUrl: coverUrl }) : null);
    } catch (e: any) {
      alert("Large scale generation error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6"><LoadingSpinner progress={Math.round(progress)} message={msg} /></div>;

  return (
    <div className="min-h-screen bg-slate-100/50">
      {book ? (
        <BookViewer book={book} onUpdate={setBook} onReset={() => setBook(null)} />
      ) : (
        <div className="max-w-6xl mx-auto p-6 lg:p-12 space-y-8">
          <button onClick={onBack} className="text-slate-400 hover:text-blue-600 font-bold transition-all flex items-center gap-2 no-print">
            <i className="fa-solid fa-arrow-left"></i> Hub
          </button>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-6 no-print">
              <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Advanced Diary Config</h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Story Genre</label>
                    <select value={genre} onChange={(e) => setGenre(e.target.value as StoryGenre)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(StoryGenre).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Tone</label>
                    <select value={tone} onChange={(e) => setTone(e.target.value as LanguageTone)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(LanguageTone).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Book Font</label>
                    <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value as BookFont)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(BookFont).map(f => <option key={f} value={f}>{f.replace('font-', '').toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Paper Style</label>
                    <select value={paperStyle} onChange={(e) => setPaperStyle(e.target.value as PaperStyle)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(PaperStyle).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Paper Format</label>
                    <select value={paperSize} onChange={(e) => setPaperSize(e.target.value as PaperSize)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(PaperSize).map(s => <option key={s} value={s}>{s} Size</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 py-3 border-y border-slate-50">
                    <input type="checkbox" checked={hasTOC} onChange={(e) => setHasTOC(e.target.checked)} className="w-5 h-5 accent-amber-500" id="diary_toc" />
                    <label htmlFor="diary_toc" className="text-[10px] font-black uppercase text-slate-700 cursor-pointer">Include Diary Index (TOC)</label>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Image Layout</label>
                    <select value={layoutMode} onChange={(e) => setLayoutMode(e.target.value as ImagePosition)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(ImagePosition).map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 flex justify-between">
                      <span>Reading Level</span>
                      <span className="text-amber-600">Level {level}</span>
                    </label>
                    <input type="range" min="1" max="10" value={level} onChange={(e) => setLevel(parseInt(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg accent-amber-600" />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 flex justify-between">
                      <span>Story Length</span>
                      <span className="text-amber-600">{pageCount} Pages</span>
                    </label>
                    <input type="range" min="10" max="300" step="5" value={pageCount} onChange={(e) => setPageCount(parseInt(e.target.value))} className="w-full h-1 bg-slate-200 rounded-lg accent-amber-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border-2 border-slate-200 relative overflow-hidden">
                <div className="mb-10">
                  <h1 className="text-4xl font-handwritten font-black text-slate-800 mb-2 italic tracking-tight">Diary Narrative Studio</h1>
                  <p className="text-slate-500 font-medium">Craft a multi-page journal with automated sketches and stylized indexing.</p>
                </div>
                
                <div className="space-y-6">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Diary Title (e.g., My Secret Summer)..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-xl" />
                  <textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What happens in this diary? e.g. A week at a weird space camp..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 min-h-[220px] outline-none text-lg" />
                  <button onClick={generateDiary} className="w-full py-6 bg-amber-500 text-black rounded-2xl font-black text-2xl hover:bg-amber-600 transition-all shadow-xl italic uppercase tracking-tighter">PUBLISH NARRATIVE</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WimpyDiaryModule;
