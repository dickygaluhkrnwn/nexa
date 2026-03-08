"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, History, BrainCircuit, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlashcardViewer, Flashcard } from "./flashcard-viewer";

interface FlashcardModalProps {
  history: any[][]; 
  onClose: () => void;
}

export function FlashcardModal({ history, onClose }: FlashcardModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!history || history.length === 0) return null;

  const currentFlashcards: Flashcard[] = history[currentIndex];

  const handlePrevVersion = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1); 
    }
  };

  const handleNextVersion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1); 
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Latar Belakang Blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      
      {/* Kontainer Utama (Split Layout Desktop) */}
      <div className="relative w-full max-w-5xl bg-card border border-border shadow-2xl rounded-[2rem] overflow-hidden flex flex-col md:flex-row h-[90vh] max-h-[800px] z-10 animate-in zoom-in-95">
        
        {/* Tombol Tutup Global */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 bg-muted/50 md:bg-muted text-muted-foreground rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors z-50"
        >
          <X className="w-5 h-5" />
        </button>

        {/* --- PANEL KIRI (SIDEBAR INFO & HISTORY) --- */}
        <div className="md:w-1/3 bg-muted/20 border-b md:border-b-0 md:border-r border-border/50 p-6 md:p-8 flex flex-col shrink-0 relative overflow-hidden">
          {/* Dekorasi Glow */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-3 mb-6 relative z-10 mt-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-foreground leading-tight">Uji Ingatan</h2>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">Sesi Pembelajaran</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-8 relative z-10">
            Latih pemahamanmu dengan metode <em>Spaced Repetition</em>. Kartu-kartu ini diekstrak otomatis oleh AI dari dokumen catatanmu.
          </p>

          {/* Panel Kontrol Versi */}
          {history.length > 1 ? (
            <div className="bg-background border border-border shadow-sm rounded-2xl p-4 mt-auto relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Versi Dokumen</h3>
                {currentIndex === 0 && (
                  <span className="ml-auto text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Terbaru
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between bg-muted/50 p-1.5 rounded-xl border border-border/50">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 rounded-lg hover:bg-background shadow-sm"
                  onClick={handlePrevVersion}
                  disabled={currentIndex === history.length - 1}
                  title="Versi Lebih Lama"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                <span className="text-sm font-bold">
                  V{history.length - currentIndex} <span className="text-muted-foreground font-medium">/ {history.length}</span>
                </span>

                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-8 h-8 rounded-lg hover:bg-background shadow-sm"
                  onClick={handleNextVersion}
                  disabled={currentIndex === 0}
                  title="Versi Lebih Baru"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-auto p-4 bg-primary/5 border border-primary/10 rounded-2xl relative z-10 text-center">
              <p className="text-xs font-medium text-primary">Tulis lebih banyak catatan untuk menghasilkan versi kuis yang lebih beragam.</p>
            </div>
          )}
        </div>

        {/* --- PANEL KANAN (AREA FLASHCARD) --- */}
        <div className="md:w-2/3 flex-1 bg-background relative overflow-y-auto custom-scrollbar flex items-center justify-center p-6 md:p-12">
           {/* Key prop memaksa React me-reset komponen FlashcardViewer saat versi diganti */}
           <FlashcardViewer 
             key={`viewer-version-${currentIndex}`} 
             cards={currentFlashcards} 
             onComplete={onClose} 
           />
        </div>

      </div>
    </div>
  );
}