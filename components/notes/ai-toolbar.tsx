"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  Loader2, MessageSquare, Network, Sparkles, 
  Tag as TagIcon, Wand2, Mic, Brain, 
  ChevronDown, ChevronUp, Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AiToolbarProps {
  onOpenChat: () => void;
  onGenerateMindMap: () => void;
  onAutoFormat: () => void;
  onGenerateTags: () => void;
  onSummarize: () => void;
  onGenerateFlashcards?: () => void; 
  isGeneratingMindMap: boolean;
  isFormatting: boolean;
  isGeneratingTags: boolean;
  isSummarizing: boolean;
  isGeneratingFlashcards?: boolean; 
  isContentEmpty: boolean;
  isTitleAndContentEmpty: boolean;
  onVoiceRecord?: () => void;
  isRecording?: boolean;
  isAnalyzingVoice?: boolean;
  onStopRecording?: () => void;
}

export function AiToolbar({
  onOpenChat, onGenerateMindMap, onAutoFormat, onGenerateTags, onSummarize, onGenerateFlashcards,
  isGeneratingMindMap, isFormatting, isGeneratingTags, isSummarizing, isGeneratingFlashcards, 
  isContentEmpty, isTitleAndContentEmpty,
  onVoiceRecord, isRecording, isAnalyzingVoice, onStopRecording
}: AiToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Tutup menu jika klik di luar area menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const anyLoading = isGeneratingMindMap || isFormatting || isGeneratingTags || isSummarizing || isGeneratingFlashcards || isAnalyzingVoice;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      
      {/* Tombol Pemicu Utama */}
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "rounded-full px-4 h-9 font-medium shadow-sm transition-all border-border/60",
          isOpen ? "bg-primary/10 text-primary border-primary/30" : "bg-card hover:bg-muted text-foreground",
          isRecording && "bg-red-500/10 text-red-500 border-red-500/30 animate-pulse"
        )}
      >
        {anyLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin text-primary" />
        ) : isRecording ? (
          <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
        )}
        {isRecording ? "Merekam Suara..." : anyLoading ? "AI Bekerja..." : "Alat AI"}
        {isOpen ? <ChevronUp className="w-3 h-3 ml-2 opacity-50" /> : <ChevronDown className="w-3 h-3 ml-2 opacity-50" />}
      </Button>

      {/* Menu Dropdown Melayang */}
      {isOpen && (
        <div className="absolute right-0 md:left-0 md:right-auto mt-2 w-64 md:w-72 rounded-2xl bg-card border border-border shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden flex flex-col">
          
          <div className="p-3 bg-muted/30 border-b border-border/50 flex items-center gap-2">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tindakan AI Cerdas</span>
          </div>

          <div className="p-2 space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar">
            
            {/* Kategori 1: Dikte & Obrolan */}
            <div className="px-2 pt-2 pb-1">
              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase">Interaksi</p>
            </div>
            {onVoiceRecord && (
              isRecording ? (
                <button onClick={() => { onStopRecording?.(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-red-500 bg-red-500/10 hover:bg-red-500/20 transition-colors text-left font-medium">
                  <div className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-current rounded-sm" />
                  </div>
                  Hentikan Rekaman Suara
                </button>
              ) : (
                <button onClick={() => { onVoiceRecord(); setIsOpen(false); }} disabled={isAnalyzingVoice} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-foreground hover:bg-muted transition-colors text-left disabled:opacity-50">
                  <Mic className="w-4 h-4 text-rose-500" /> Dikte dengan Suara
                </button>
              )
            )}
            <button onClick={() => { onOpenChat(); setIsOpen(false); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-foreground hover:bg-muted transition-colors text-left">
              <MessageSquare className="w-4 h-4 text-green-500" /> Tanya AI soal catatan ini
            </button>

            <div className="h-px bg-border/50 my-1 mx-2" />

            {/* Kategori 2: Modifikasi Konten */}
            <div className="px-2 pt-2 pb-1">
              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase">Modifikasi Teks</p>
            </div>
            <button onClick={() => { onAutoFormat(); setIsOpen(false); }} disabled={isFormatting || isContentEmpty} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-foreground hover:bg-muted transition-colors text-left disabled:opacity-50">
              <Sparkles className="w-4 h-4 text-cyan-500" /> Rapihkan & Perbaiki Tata Bahasa
            </button>
            <button onClick={() => { onSummarize(); setIsOpen(false); }} disabled={isSummarizing || isTitleAndContentEmpty} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-foreground hover:bg-muted transition-colors text-left disabled:opacity-50">
              <Wand2 className="w-4 h-4 text-purple-500" /> Buat Ringkasan Eksekutif
            </button>

            <div className="h-px bg-border/50 my-1 mx-2" />

            {/* Kategori 3: Analisis & Struktur */}
            <div className="px-2 pt-2 pb-1">
              <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase">Analisis Data</p>
            </div>
            <button onClick={() => { onGenerateMindMap(); setIsOpen(false); }} disabled={isGeneratingMindMap || isContentEmpty} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-foreground hover:bg-muted transition-colors text-left disabled:opacity-50">
              <Network className="w-4 h-4 text-rose-400" /> Hasilkan Peta Konsep (Mindmap)
            </button>
            {onGenerateFlashcards && (
              <button onClick={() => { onGenerateFlashcards(); setIsOpen(false); }} disabled={isGeneratingFlashcards || isContentEmpty} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-foreground hover:bg-muted transition-colors text-left disabled:opacity-50">
                <Brain className="w-4 h-4 text-indigo-500" /> Ekstrak Pertanyaan Kuis (Flashcard)
              </button>
            )}
            <button onClick={() => { onGenerateTags(); setIsOpen(false); }} disabled={isGeneratingTags || isTitleAndContentEmpty} className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg text-foreground hover:bg-muted transition-colors text-left disabled:opacity-50">
              <TagIcon className="w-4 h-4 text-primary" /> Tebak Label/Tags Otomatis
            </button>

          </div>
        </div>
      )}
    </div>
  );
}