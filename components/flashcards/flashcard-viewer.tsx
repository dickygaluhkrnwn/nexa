"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Brain, Check, RefreshCw } from "lucide-react";

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

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    // Beri jeda animasi memutar balik selesai sebelum ganti teks
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        onComplete();
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
    // Simulasi Spaced Repetition (Untuk direkam di backend nantinya)
    if (!completedCards.includes(currentIndex)) {
        setCompletedCards(prev => [...prev, currentIndex]);
    }
    handleNext();
  };

  const progress = ((completedCards.length) / cards.length) * 100;

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto space-y-8">
      
      {/* Progress Bar */}
      <div className="w-full space-y-2">
         <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <span>Penguasaan Materi</span>
            <span className="text-primary">{Math.round(progress)}%</span>
         </div>
         <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
         </div>
         <p className="text-center text-[10px] text-muted-foreground mt-2 font-medium">
           Kartu {currentIndex + 1} dari {cards.length}
         </p>
      </div>

      {/* 3D Flashcard Area */}
      <div className="relative w-full aspect-[4/3] perspective-[1000px] cursor-pointer group" onClick={() => setIsFlipped(!isFlipped)}>
        {/* Kontainer Putar (Transform) */}
        <div className={`w-full h-full relative transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
          
          {/* SISI DEPAN (PERTANYAAN) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] bg-card border-2 border-border/60 rounded-[2rem] p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-xl group-hover:shadow-2xl transition-shadow">
            <div className="absolute top-5 left-5 p-2.5 bg-primary/10 text-primary rounded-xl">
               <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-foreground leading-snug">
              {currentCard?.front}
            </h3>
            <div className="absolute bottom-6 flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase tracking-widest animate-pulse">
              <RefreshCw className="w-3.5 h-3.5" /> Klik untuk putar
            </div>
          </div>

          {/* SISI BELAKANG (JAWABAN) */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-primary/10 to-purple-500/10 border-2 border-primary/30 rounded-[2rem] p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-xl">
            <div className="absolute top-5 right-5 p-2.5 bg-green-500/10 text-green-600 rounded-xl">
               <Check className="w-6 h-6" />
            </div>
            <div className="overflow-y-auto custom-scrollbar max-h-full w-full px-2 pt-8">
              <h3 className="text-base md:text-lg font-medium text-foreground leading-relaxed">
                {currentCard?.back}
              </h3>
            </div>
          </div>

        </div>
      </div>

      {/* Kontrol Navigasi & Spaced Repetition (Penilaian) */}
      <div className="w-full flex flex-col gap-4">
         {isFlipped ? (
           <div className="grid grid-cols-3 gap-3 animate-in slide-in-from-bottom-4 duration-300">
             <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleScore('hard'); }} className="h-14 rounded-2xl border-red-500/30 text-red-500 hover:bg-red-500/10 hover:border-red-500 font-bold">Sulit 😥</Button>
             <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleScore('good'); }} className="h-14 rounded-2xl border-orange-500/30 text-orange-500 hover:bg-orange-500/10 hover:border-orange-500 font-bold">Lumayan 🤔</Button>
             <Button variant="outline" onClick={(e) => { e.stopPropagation(); handleScore('easy'); }} className="h-14 rounded-2xl border-green-500/30 text-green-500 hover:bg-green-500/10 hover:border-green-500 font-bold">Mudah 😃</Button>
           </div>
         ) : (
           <div className="flex justify-center gap-4">
              <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); handlePrev(); }} disabled={currentIndex === 0} className="rounded-full w-14 h-14 shadow-sm border-border hover:bg-muted transition-transform active:scale-95">
                 <ChevronLeft className="w-6 h-6" />
              </Button>
              <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); handleNext(); }} className="rounded-full w-14 h-14 shadow-sm border-border hover:bg-muted transition-transform active:scale-95">
                 <ChevronRight className="w-6 h-6" />
              </Button>
           </div>
         )}
      </div>

    </div>
  );
}