
import React, { useState } from 'react';
import { Book, BookPage, PaperStyle, PaperSize, BookFont } from '../types';
import { exportBookToWord } from '../services/wordExportService';

interface BookViewerProps {
  book: Book;
  onUpdate: (updatedBook: Book) => void;
  onReset: () => void;
}

const BookViewer: React.FC<BookViewerProps> = ({ book, onUpdate, onReset }) => {
  const [currentPage, setCurrentPage] = useState(0); 
  const [isEditing, setIsEditing] = useState(false);
  
  const totalPages = book.pages.length + (book.hasTableOfContents ? 2 : 1);

  const goToPrev = () => setCurrentPage((prev) => Math.max(0, prev - 1));
  const goToNext = () => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));

  const updateBookConfig = (key: keyof Book, val: any) => {
    onUpdate({ ...book, [key]: val });
  };

  const handleTextChange = (pageIdx: number, newText: string) => {
    const updatedPages = [...book.pages];
    updatedPages[pageIdx].text = newText;
    onUpdate({ ...book, pages: updatedPages });
  };

  const handleWordExport = async () => {
    try {
      await exportBookToWord(book);
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to export to Word. Please check your connection.");
    }
  };

  const getPageClasses = (layout: string) => {
    switch (layout) {
      case 'top': return 'flex-col';
      case 'bottom': return 'flex-col-reverse';
      case 'left': return 'lg:flex-row';
      case 'right': return 'lg:flex-row-reverse';
      default: return 'lg:flex-row';
    }
  };

  const renderCover = (isPrint = false) => (
    <div className={`mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-white size-${book.paperSize} ${isPrint ? 'print-page' : ''}`}>
      <div className="relative w-full h-full">
        {book.coverImageUrl ? <img src={book.coverImageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400"><i className="fa-solid fa-image text-5xl"></i></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10 text-white">
          <h1 className={`text-4xl lg:text-5xl font-bold mb-4 uppercase tracking-tighter leading-tight ${book.font}`}>{book.title}</h1>
          <p className="text-xl opacity-90 font-medium">By {book.author}</p>
        </div>
        <div className="page-footer !text-white/50">1</div>
      </div>
    </div>
  );

  const renderTOC = (isPrint = false) => {
    const tocStyles = {
      classic: { container: 'border-double border-8 border-slate-900', title: 'font-playfair border-b-2 border-slate-900 pb-4 mb-10' },
      modern: { container: 'bg-slate-50', title: 'font-inter font-black uppercase tracking-[0.5em] text-blue-600 mb-12' },
      minimal: { container: 'bg-white', title: 'font-inter font-light text-slate-400 uppercase tracking-widest mb-16' },
      playful: { container: 'bg-amber-50 rounded-[3rem] border-4 border-dashed border-amber-200', title: 'font-handwritten text-4xl text-amber-600 mb-8' }
    }[book.tocStyle || 'classic'];

    return (
      <div className={`mx-auto bg-white size-${book.paperSize} p-16 flex flex-col items-center overflow-hidden ${isPrint ? 'print-page' : ''}`}>
        <div className={`w-full h-full p-12 flex flex-col ${tocStyles.container} relative`}>
          <h2 className={`text-4xl text-center font-bold ${tocStyles.title}`}>Table of Contents</h2>
          <ul className="toc-list space-y-4 w-full flex-1 overflow-y-auto custom-scrollbar pr-4">
            {book.pages.map((p, i) => (
              <li key={i} className={`text-lg ${book.font} cursor-pointer hover:text-blue-600 transition-colors`} onClick={() => !isPrint && setCurrentPage(book.hasTableOfContents ? i + 2 : i + 1)}>
                <span className="toc-name">{p.title || `Chapter ${i + 1}`}</span>
                <span className="toc-dots"></span>
                <span className="toc-page">{book.hasTableOfContents ? i + 3 : i + 2}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 text-center text-[10px] font-black uppercase text-slate-300 tracking-widest">DPSS AI Publishing</div>
        </div>
        <div className="page-footer">2</div>
      </div>
    );
  };

  const renderPage = (page: BookPage, idx: number, isPrint = false) => (
    <div className={`flex ${getPageClasses(page.layout)} mx-auto bg-white shadow-2xl overflow-hidden border border-slate-200 size-${book.paperSize} ${isPrint ? 'print-page' : ''}`}>
      <div className={`${['top', 'bottom'].includes(page.layout) ? 'w-full h-1/2' : 'lg:w-1/2 h-full'} relative bg-slate-50`}>
        {page.imageUrl ? <img src={page.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-100"><div className="custom-loader"></div></div>}
      </div>

      <div className={`${['top', 'bottom'].includes(page.layout) ? 'w-full h-1/2' : 'lg:w-1/2 h-full'} flex flex-col relative`}>
        <div 
          className={`flex-1 p-10 lg:p-16 paper-${book.paperStyle} relative overflow-y-auto custom-scrollbar`}
          style={{ 
            '--line-height': `${book.lineSpacing}rem`,
            lineHeight: `${book.lineSpacing}rem`,
            fontSize: `${book.fontSize}px` 
          } as React.CSSProperties}
        >
          <div className="absolute top-4 right-4 no-print">
            <button onClick={() => setIsEditing(!isEditing)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-white shadow-sm transition-all">
              <i className={`fa-solid ${isEditing ? 'fa-check' : 'fa-pencil'}`}></i>
            </button>
          </div>

          <div 
            className={`${book.highlightText ? 'px-4 py-2 rounded-lg' : ''} ${book.font} outline-none`} 
            style={{ backgroundColor: book.highlightText ? '#fef08a' : 'transparent' }}
            contentEditable={isEditing}
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange(idx, e.currentTarget.innerText)}
          >
             {page.title && <h3 className="font-bold mb-4 opacity-50 underline decoration-2 underline-offset-8">{page.title}</h3>}
             <p className="text-slate-900 whitespace-pre-wrap">{page.text}</p>
          </div>
        </div>
        <div className="page-footer">{book.hasTableOfContents ? page.pageNumber + 2 : page.pageNumber + 1}</div>
      </div>
    </div>
  );

  const getActiveView = () => {
    if (currentPage === 0) return renderCover();
    if (book.hasTableOfContents && currentPage === 1) return renderTOC();
    const storyIdx = book.hasTableOfContents ? currentPage - 2 : currentPage - 1;
    return renderPage(book.pages[storyIdx], storyIdx);
  };

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      {/* Redesigned Toolbar to match user screenshot */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-8 p-4 flex flex-wrap items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-8 flex-wrap">
          <button onClick={onReset} className="text-slate-400 hover:text-blue-600 font-bold flex items-center gap-2">
            <i className="fa-solid fa-arrow-left"></i> Hub
          </button>

          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Size</label>
            <select 
              value={book.paperSize} 
              onChange={(e) => updateBookConfig('paperSize', e.target.value)}
              className="bg-slate-100 border-none rounded-lg px-3 py-1 text-xs font-bold text-slate-600 outline-none"
            >
              {Object.values(PaperSize).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Text Size</label>
            <input 
              type="range" 
              min="14" 
              max="60" 
              value={book.fontSize} 
              onChange={(e) => updateBookConfig('fontSize', parseInt(e.target.value))} 
              className="accent-blue-600 h-1 bg-slate-100 rounded-full w-24 appearance-none" 
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Space</label>
            <input 
              type="range" 
              min="1.5" 
              max="5" 
              step="0.1"
              value={book.lineSpacing} 
              onChange={(e) => updateBookConfig('lineSpacing', parseFloat(e.target.value))} 
              className="accent-blue-600 h-1 bg-slate-100 rounded-full w-24 appearance-none" 
            />
          </div>

          <button 
            onClick={() => updateBookConfig('highlightText', !book.highlightText)} 
            className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest border-none shadow-sm ${book.highlightText ? 'bg-[#facc15] text-slate-900' : 'bg-slate-100 text-slate-400'}`}
          >
            HIGHLIGHT
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.print()} 
            className="bg-[#1e293b] text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-black transition-all"
          >
            Print PDF
          </button>
          <button 
            onClick={handleWordExport}
            className="bg-[#e0e7ff] text-[#4338ca] px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm hover:bg-white transition-all"
          >
            Export to Word
          </button>
        </div>
      </div>

      <div className="relative min-h-[650px] flex items-center justify-center group mb-12 no-print overflow-hidden">
        <button onClick={goToPrev} disabled={currentPage === 0} className="absolute left-4 z-20 w-12 h-12 rounded-xl bg-white shadow-xl text-slate-800 hover:bg-blue-600 hover:text-white transition-all transform opacity-0 group-hover:opacity-100 disabled:opacity-0"><i className="fa-solid fa-chevron-left"></i></button>
        <div className="transition-all duration-500 scale-95 hover:scale-100">{getActiveView()}</div>
        <button onClick={goToNext} disabled={currentPage === totalPages - 1} className="absolute right-4 z-20 w-12 h-12 rounded-xl bg-white shadow-xl text-slate-800 hover:bg-blue-600 hover:text-white transition-all transform opacity-0 group-hover:opacity-100 disabled:opacity-0"><i className="fa-solid fa-chevron-right"></i></button>
      </div>

      <div className="flex justify-center flex-wrap gap-2 no-print">
        <button onClick={() => setCurrentPage(0)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${currentPage === 0 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400'}`}>COVER</button>
        {book.hasTableOfContents && <button onClick={() => setCurrentPage(1)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${currentPage === 1 ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-400'}`}>TOC</button>}
        {book.pages.map((_, idx) => {
          const actualPage = book.hasTableOfContents ? idx + 2 : idx + 1;
          return (
            <button key={idx} onClick={() => setCurrentPage(actualPage)} className={`w-10 h-10 rounded-lg text-xs font-bold transition-all border ${currentPage === actualPage ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-400'}`}>{idx + 1}</button>
          );
        })}
      </div>
      
      <div className="hidden print:block">
        {renderCover(true)}
        {book.hasTableOfContents && renderTOC(true)}
        {book.pages.map((p, idx) => renderPage(p, idx, true))}
      </div>
    </div>
  );
};

export default BookViewer;
