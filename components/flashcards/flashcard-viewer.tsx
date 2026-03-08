"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Brain, Check, RefreshCw, Trophy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardViewerProps {
  cards: Flashcard[];
  onComplete: () => void;
}

export function FlashcardViewer({ cards, onComplete }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCards, setCompletedCards] = useState<number[]>([]); 
  const [isFinished, setIsFinished] = useState(false);

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    // Beri jeda animasi memutar balik selesai sebelum ganti teks
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setIsFinished(true); // Pindah ke layar perayaan selesai
      }
    }, 150); 
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }, 150);
  };

  const handleScore = (score: "hard" | "good" | "easy") => {
    // Simulasi Spaced Repetition (Untuk direkam ke analitik di masa depan)
    if (!completedCards.includes(currentIndex)) {
        setCompletedCards(prev => [...prev, currentIndex]);
    }
    handleNext();
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setCompletedCards([]);
    setIsFlipped(false);
    setIsFinished(false);
  };

  // --- LAYAR SELESAI (COMPLETION SCREEN) ---
  if (isFinished) {
    return (
      <div className="flex flex-col items-center justify-center text-center max-w-md w-full animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-orange-500/30 mb-8 rotate-12 hover:rotate-0 transition-transform duration-500">
          <Trophy className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-black tracking-tight text-foreground mb-3">Luar Biasa! 🎉</h2>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-10">
          Kamu telah berhasil me-review <strong>{cards.length}</strong> kartu pemahaman. Otakmu semakin tajam!
        </p>
        
        <div className="flex flex-col sm:flex-row w-full gap-3">
          <Button variant="outline" onClick={handleRestart} className="flex-1 h-12 rounded-xl font-bold border-border shadow-sm hover:bg-muted">
            <RotateCcw className="w-4 h-4 mr-2" /> Ulangi Kuis
          </Button>
          <Button onClick={onComplete} className="flex-1 h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md">
            Selesai & Tutup
          </Button>
        </div>
      </div>
    );
  }

  const progress = ((completedCards.length) / cards.length) * 100;

  // --- LAYAR KUIS UTAMA ---
  return (
    <div className="flex flex-col w-full max-w-xl mx-auto h-full justify-center space-y-6 md:space-y-10 py-6 animate-in fade-in duration-300">
      
      {/* Progress Bar Premium */}
      <div className="w-full space-y-3 shrink-0">
         <div className="flex justify-between items-end">
           <div>
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Penguasaan</p>
             <p className="text-sm font-extrabold text-foreground">Kartu {currentIndex + 1} <span className="text-muted-foreground font-medium">/ {cards.length}</span></p>
           </div>
           <span className="text-lg font-black text-primary">{Math.round(progress)}%</span>
         </div>
         <div className="h-2 w-full bg-muted/60 rounded-full overflow-hidden shadow-inner">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-primary transition-all duration-500 ease-out rounded-full" style={{ width: `${progress}%` }} />
         </div>
      </div>

      {/* 3D Flashcard Area */}
      <div className="relative w-full aspect-[4/3] md:aspect-[16/10] perspective-[1200px] cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        {/* Kontainer Putar (Transform) */}
        <div className={cn(
          "w-full h-full relative transition-transform duration-700 [transform-style:preserve-3d]", 
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        )}>
          
          {/* SISI DEPAN (PERTANYAAN) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-card border border-border shadow-xl hover:shadow-2xl hover:border-primary/30 rounded-[2rem] p-8 md:p-10 flex flex-col items-center justify-center text-center transition-all duration-300">
            <div className="absolute top-6 left-6 p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
               <Brain className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <h3 className="text-xl md:text-3xl font-extrabold text-foreground leading-snug max-w-md mx-auto">
              {currentCard?.front}
            </h3>
            <div className="absolute bottom-6 flex items-center gap-2 text-muted-foreground text-[10px] md:text-xs font-bold uppercase tracking-widest animate-pulse bg-muted/50 px-4 py-2 rounded-full">
              <RefreshCw className="w-3.5 h-3.5" /> Klik untuk membalik kartu
            </div>
          </div>

          {/* SISI BELAKANG (JAWABAN) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-indigo-500/5 to-purple-600/5 border border-primary/20 shadow-xl rounded-[2rem] p-8 md:p-10 flex flex-col items-center justify-center text-center">
            <div className="absolute top-6 right-6 p-2.5 bg-green-500/10 text-green-600 rounded-xl">
               <Check className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="overflow-y-auto custom-scrollbar max-h-full w-full px-2 pt-10 pb-6 flex items-center justify-center">
              <h3 className="text-base md:text-xl font-medium text-foreground leading-relaxed max-w-lg mx-auto">
                {currentCard?.back}
              </h3>
            </div>
          </div>

        </div>
      </div>

      {/* Kontrol Navigasi & Spaced Repetition (Penilaian) */}
      <div className="w-full flex flex-col gap-4 shrink-0 h-16">
         {isFlipped ? (
           <div className="grid grid-cols-3 gap-3 md:gap-4 animate-in slide-in-from-bottom-4 duration-300 h-full">
             <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleScore('hard'); }} className="h-full rounded-2xl border-red-500/30 text-red-600 dark:text-red-400 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500 font-bold flex flex-col gap-1 transition-all hover:-translate-y-1">
               <span className="text-lg">😥</span>
               <span className="text-[10px] md:text-xs uppercase tracking-wider">Sulit</span>
             </Button>
             <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleScore('good'); }} className="h-full rounded-2xl border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500 font-bold flex flex-col gap-1 transition-all hover:-translate-y-1">
               <span className="text-lg">🤔</span>
               <span className="text-[10px] md:text-xs uppercase tracking-wider">Lumayan</span>
             </Button>
             <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleScore('easy'); }} className="h-full rounded-2xl border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/5 hover:bg-green-500/10 hover:border-green-500 font-bold flex flex-col gap-1 transition-all hover:-translate-y-1">
               <span className="text-lg">😃</span>
               <span className="text-[10px] md:text-xs uppercase tracking-wider">Mudah</span>
             </Button>
           </div>
         ) : (
           <div className="flex justify-center gap-4 md:gap-6 h-full">
              <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); handlePrev(); }} disabled={currentIndex === 0} className="rounded-full w-14 h-14 md:w-16 md:h-16 shadow-sm border-border hover:bg-muted transition-transform active:scale-95">
                 <ChevronLeft className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
              </Button>
              <div className="flex-1 border border-border bg-card shadow-sm rounded-full flex items-center justify-center font-bold text-muted-foreground text-sm uppercase tracking-widest cursor-pointer hover:bg-muted transition-colors" onClick={() => setIsFlipped(true)}>
                Putar Kartu
              </div>
              <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); handleNext(); }} className="rounded-full w-14 h-14 md:w-16 md:h-16 shadow-sm border-border hover:bg-muted transition-transform active:scale-95">
                 <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
              </Button>
           </div>
         )}
      </div>

    </div>
  );
}