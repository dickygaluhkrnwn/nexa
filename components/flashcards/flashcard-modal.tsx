"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlashcardViewer, Flashcard } from "./flashcard-viewer";

interface FlashcardModalProps {
  history: any[][]; // Array of Flashcard arrays (Histori)
  onClose: () => void;
}

export function FlashcardModal({ history, onClose }: FlashcardModalProps) {
  // State untuk melacak indeks histori mana yang sedang dilihat
  // 0 adalah versi terbaru (paling depan di array)
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!history || history.length === 0) return null;

  const currentFlashcards: Flashcard[] = history[currentIndex];

  const handlePrevVersion = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1); // Mundur ke versi lebih lama (index bertambah)
    }
  };

  const handleNextVersion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1); // Maju ke versi lebih baru (index berkurang)
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Latar Belakang Blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      
      {/* --- PANEL NAVIGASI RIWAYAT (Hanya tampil jika ada > 1 versi) --- */}
      {history.length > 1 && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3 bg-card/90 backdrop-blur-xl px-2 py-1.5 rounded-full border border-border shadow-lg animate-in slide-in-from-top-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-full hover:bg-muted"
            onClick={handlePrevVersion}
            disabled={currentIndex === history.length - 1}
            title="Versi Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1.5 px-2">
            <History className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-bold whitespace-nowrap">
              Versi {history.length - currentIndex} <span className="text-muted-foreground font-medium">/ {history.length}</span>
            </span>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-full hover:bg-muted"
            onClick={handleNextVersion}
            disabled={currentIndex === 0}
            title="Versi Lebih Baru"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          {/* Indikator "Terbaru" jika berada di index 0 */}
          {currentIndex === 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border border-background"></span>
            </span>
          )}
        </div>
      )}

      {/* Kontainer Utama */}
      <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-[2rem] overflow-hidden flex flex-col h-[85vh] md:h-auto max-h-[800px] z-10 animate-in slide-in-from-bottom-8 mt-12 md:mt-0">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
          <div>
            <h2 className="font-bold text-foreground">Sesi Pembelajaran</h2>
            <p className="text-xs text-muted-foreground font-medium">Uji pemahamanmu dari catatan ini</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Area Konten Flashcard */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center relative">
           
           {/* Menambahkan key berdasarkan currentIndex agar komponen FlashcardViewer ter-reset (kembali ke kartu pertama) saat user mengganti versi */}
           <FlashcardViewer 
             key={`viewer-version-${currentIndex}`} 
             cards={currentFlashcards} 
             onComplete={() => {
                // Apa yang terjadi setelah kartu habis?
                // Untuk sekarang kita biarkan user bisa klik tutup (X) sendiri
             }} 
           />
        </div>

      </div>
    </div>
  );
}