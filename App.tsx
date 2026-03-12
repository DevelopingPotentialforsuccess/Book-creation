
import React, { useState, useRef } from 'react';
import { AppMode, StoryGenre, Language, Book, BookPage, BookFont, PaperStyle, PaperSize, ImagePosition, AgeGroup, LanguageTone } from './types';
import { generateBookStory, generateIllustration } from './services/geminiService';
import LoadingSpinner from './components/LoadingSpinner';
import BookViewer from './components/BookViewer';
import WimpyDiaryModule from './components/WimpyDiaryModule';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  
  const [formData, setFormData] = useState({
    titleHint: '',
    genre: StoryGenre.BEDTIME,
    ageGroup: AgeGroup.PICTURE_BOOK,
    level: 1,
    characters: '',
    setting: '',
    pageCount: 10,
    wordsPerPage: 30,
    language: Language.ENGLISH,
    languageTone: LanguageTone.SPOKEN,
    font: BookFont.HANDWRITTEN,
    paperStyle: PaperStyle.LINED,
    paperSize: PaperSize.A4,
    lineSpacing: 2.5,
    fontSize: 22,
    imagePos: ImagePosition.RANDOM,
    hasVoiceover: false,
    highlightText: true,
    hasTableOfContents: true
  });

  const [avatarImages, setAvatarImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedBook, setGeneratedBook] = useState<Book | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
               (name === 'level' || name === 'pageCount' || name === 'wordsPerPage' || name === 'lineSpacing' || name === 'fontSize') ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      (Array.from(files) as File[]).forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) setAvatarImages(prev => [...prev, event.target!.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeAvatar = (idx: number) => {
    setAvatarImages(prev => prev.filter((_, i) => i !== idx));
  };

  const generateBook = async () => {
    if (!formData.titleHint) return alert("Please describe your story idea!");
    setLoading(true);
    setLoadingProgress(5);
    setLoadingMessage('Initializing DPSS Narrative Engine...');

    try {
      const storyResponse = await generateBookStory(
        formData.titleHint, formData.genre, formData.ageGroup, formData.level,
        formData.characters, formData.setting, formData.pageCount, formData.wordsPerPage,
        formData.language, formData.languageTone, [], avatarImages
      );
      
      if (!storyResponse || !storyResponse.pages) throw new Error("Narrative engine failed to return pages.");
      
      setLoadingProgress(30);

      const layouts: ('left' | 'right' | 'top' | 'bottom')[] = ['left', 'right', 'top', 'bottom'];
      const initialPages: BookPage[] = storyResponse.pages.map((p) => ({
        pageNumber: p.pageNumber, 
        title: p.title,
        text: p.text, 
        imagePrompt: p.imagePrompt,
        layout: formData.imagePos === ImagePosition.RANDOM ? layouts[Math.floor(Math.random() * layouts.length)] : formData.imagePos as any
      }));

      const tocStyles: ('classic' | 'modern' | 'minimal' | 'playful')[] = ['classic', 'modern', 'minimal', 'playful'];

      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        title: storyResponse.title, 
        author: 'DPSS AI Publishing',
        genre: formData.genre, ageGroup: formData.ageGroup, level: formData.level,
        language: formData.language, languageTone: formData.languageTone,
        pages: initialPages, font: formData.font, paperStyle: formData.paperStyle,
        paperSize: formData.paperSize,
        lineSpacing: formData.lineSpacing, fontSize: formData.fontSize, hasVoiceover: formData.hasVoiceover,
        highlightText: formData.highlightText, highlightColor: '#fef08a', heroAvatars: avatarImages,
        hasTableOfContents: formData.hasTableOfContents,
        tocStyle: tocStyles[Math.floor(Math.random() * tocStyles.length)]
      };

      setGeneratedBook(newBook);
      setLoadingMessage('Designing Cinematic Cover...');
      
      let coverUrl = "";
      try {
        coverUrl = await generateIllustration(`Professional cinematic book cover: ${storyResponse.title}. Stylized masterpiece.`, avatarImages);
      } catch (e) {
        console.warn("Cover generation failed, using placeholder");
      }
      
      setGeneratedBook(prev => prev ? ({ ...prev, coverImageUrl: coverUrl }) : null);
      setLoadingProgress(45);

      const updatedPages = [...initialPages];
      for (let i = 0; i < updatedPages.length; i++) {
        setLoadingMessage(`Painting scene ${i + 1} / ${updatedPages.length}...`);
        try {
          const imageUrl = await generateIllustration(updatedPages[i].imagePrompt, avatarImages);
          updatedPages[i].imageUrl = imageUrl;
        } catch (e) {
          console.warn(`Image for page ${i+1} failed.`);
        }
        setLoadingProgress(prev => Math.min(99, prev + (50 / updatedPages.length)));
      }

      setGeneratedBook({ ...newBook, pages: updatedPages, coverImageUrl: coverUrl });
      setLoadingProgress(100);
      setLoadingMessage('Finalizing Publication...');
      setTimeout(() => setLoading(false), 800);
    } catch (error: any) {
      alert("Creation interrupted: " + error.message);
      setLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-[#f8fafc] p-12 lg:p-24 overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-20">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-1 bg-blue-600 rounded-full"></div>
             <p className="text-xs font-black uppercase tracking-[0.3em] text-blue-600">Premium AI Workspace</p>
          </div>
          <h1 className="text-7xl font-playfair font-black text-slate-900 tracking-tighter uppercase italic leading-[0.9]">DPSS STUDIO</h1>
          <p className="text-slate-500 font-medium text-xl max-w-xl">High-performance AI engine for professional storytelling, education, and multi-format publication.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <button onClick={() => setMode(AppMode.BOOK_CREATOR)} className="bg-white rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all p-10 text-left space-y-6 group border border-slate-100">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-blue-100 group-hover:rotate-6 transition-transform"><i className="fa-solid fa-book-open"></i></div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Book Studio</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Story engine with cinematic illustrations and automated TOC.</p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-blue-600 font-black text-xs uppercase tracking-widest">Enter Studio <i className="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-2"></i></div>
          </button>

          <button onClick={() => setMode(AppMode.WIMPY_DIARY)} className="bg-white rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all p-10 text-left space-y-6 group border border-slate-100">
            <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-amber-100 group-hover:rotate-6 transition-transform"><i className="fa-solid fa-note-sticky"></i></div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-slate-800 uppercase italic tracking-tighter">Narrative Studio</h3>
              <p className="text-slate-500 text-sm leading-relaxed">Long-form journals and novels with sketch art and TOC.</p>
            </div>
            <div className="pt-4 flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-widest">Write Novel <i className="fa-solid fa-arrow-right-long transition-transform group-hover:translate-x-2"></i></div>
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-6"><LoadingSpinner progress={Math.round(loadingProgress)} message={loadingMessage} /></div>;

  switch (mode) {
    case AppMode.BOOK_CREATOR: 
      return generatedBook ? <BookViewer book={generatedBook} onUpdate={setGeneratedBook} onReset={() => setGeneratedBook(null)} /> : (
        <div className="min-h-screen bg-slate-100/50 p-6 lg:p-12">
          <button onClick={() => setMode(AppMode.DASHBOARD)} className="text-slate-400 hover:text-blue-600 font-bold transition-all flex items-center gap-2 no-print mb-8">
            <i className="fa-solid fa-arrow-left"></i> Hub
          </button>
          
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 space-y-6 no-print">
              <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-200">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Advanced Book Config</h3>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Language</label>
                    <select name="language" value={formData.language} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Story Genre</label>
                    <select name="genre" value={formData.genre} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(StoryGenre).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Tone</label>
                    <select name="languageTone" value={formData.languageTone} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(LanguageTone).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Book Font</label>
                    <select name="font" value={formData.font} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(BookFont).map(f => <option key={f} value={f}>{f.replace('font-', '').toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Paper Style</label>
                    <select name="paperStyle" value={formData.paperStyle} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(PaperStyle).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-2">Paper Format</label>
                    <select name="paperSize" value={formData.paperSize} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                      {Object.values(PaperSize).map(s => <option key={s} value={s}>{s} Size</option>)}
                    </select>
                  </div>

                  <div className="flex items-center gap-3 py-3 border-y border-slate-50">
                    <input type="checkbox" name="hasTableOfContents" checked={formData.hasTableOfContents} onChange={handleInputChange} className="w-5 h-5 accent-blue-600" id="book_toc" />
                    <label htmlFor="book_toc" className="text-[10px] font-black uppercase text-slate-700 cursor-pointer">Randomize Tables of Content</label>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 flex justify-between">
                      <span>Reading Level</span>
                      <span className="text-blue-600">Level {formData.level}</span>
                    </label>
                    <input type="range" name="level" min="1" max="10" value={formData.level} onChange={handleInputChange} className="w-full h-1 bg-slate-200 rounded-lg accent-blue-600" />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 flex justify-between">
                      <span>Page Count</span>
                      <span className="text-blue-600">{formData.pageCount} Pages</span>
                    </label>
                    <input type="range" name="pageCount" min="1" max="300" value={formData.pageCount} onChange={handleInputChange} className="w-full h-1 bg-slate-200 rounded-lg accent-blue-600" />
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    <label className="text-[10px] font-black text-slate-500 uppercase block mb-3">Hero References</label>
                    <div className="grid grid-cols-4 gap-3">
                      {avatarImages.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group">
                          <img src={img} className="w-full h-full object-cover" />
                          <button onClick={() => removeAvatar(i)} className="absolute inset-0 bg-red-500/80 opacity-0 group-hover:opacity-100 text-white flex items-center justify-center transition-all"><i className="fa-solid fa-trash text-xs"></i></button>
                        </div>
                      ))}
                      <button onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400 transition-all">
                        <i className="fa-solid fa-plus"></i>
                      </button>
                    </div>
                    <input ref={fileInputRef} type="file" multiple className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border-2 border-slate-200 relative overflow-hidden">
                <div className="mb-10">
                  <h1 className="text-4xl font-playfair font-black text-slate-800 mb-2 italic tracking-tight">Book Creation Studio</h1>
                  <p className="text-slate-500 font-medium">Engineer a cinematic narrative with automated high-quality illustrations.</p>
                </div>
                
                <div className="space-y-6">
                  <input name="titleHint" value={formData.titleHint} onChange={handleInputChange} placeholder="Describe your book vision..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 font-bold text-xl" />
                  <textarea name="characters" value={formData.characters} onChange={handleInputChange} placeholder="Describe characters and setting details..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-6 min-h-[220px] outline-none text-lg" />
                  <button onClick={generateBook} className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-2xl hover:bg-blue-700 transition-all shadow-xl italic uppercase tracking-tighter">PUBLISH STORY</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    case AppMode.WIMPY_DIARY: return <WimpyDiaryModule onBack={() => setMode(AppMode.DASHBOARD)} />;
    default: return renderDashboard();
  }
};

export default App;
