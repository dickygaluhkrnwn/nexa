"use client";

import { X, Target, Lightbulb, Sparkles, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeeklyReviewModalProps {
  reviewData: any;
  onClose: () => void;
  onSave: () => void;
}

export function WeeklyReviewModal({ reviewData, onClose, onSave }: WeeklyReviewModalProps) {
  if (!reviewData) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Container - Diperlebar untuk Desktop */}
      <div className="relative w-full max-w-3xl bg-card border border-border shadow-2xl rounded-[2rem] overflow-hidden flex flex-col z-10 animate-in zoom-in-95 max-h-[90vh]">
        
        {/* Dekorasi Garis Atas */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />
        
        <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-muted/50 rounded-full hover:bg-muted transition-colors z-20">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
          
          {/* BAGIAN KIRI: Nilai & Header (Desktop: Sidebar, Mobile: Top Header) */}
          <div className="md:w-2/5 p-6 md:p-8 bg-muted/20 border-b md:border-b-0 md:border-r border-border/50 flex flex-col items-center md:items-start text-center md:text-left shrink-0">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center text-white text-5xl md:text-6xl font-black shadow-xl shadow-purple-500/20 mb-6">
              {reviewData.grade || "A"}
            </div>
            <h2 className="font-extrabold text-2xl md:text-3xl leading-tight text-foreground mb-2">
              {reviewData.title}
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-1.5 text-xs font-bold text-purple-500 uppercase tracking-widest bg-purple-500/10 px-3 py-1.5 rounded-lg mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Nexa AI Evaluation
            </div>
            
            <p className="text-sm font-medium leading-relaxed italic text-muted-foreground md:mt-auto bg-background p-4 rounded-2xl border border-border shadow-sm relative">
              <span className="absolute -top-3 -left-2 text-3xl text-primary/20 font-serif">"</span>
              {reviewData.summary}
              <span className="absolute -bottom-5 -right-2 text-3xl text-primary/20 font-serif">"</span>
            </p>
          </div>

          {/* BAGIAN KANAN: Detail Analisis */}
          <div className="md:w-3/5 p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar relative">
            <div className="space-y-8 flex-1">
              
              {/* Insight / Wawasan */}
              <div>
                <h3 className="flex items-center gap-2 font-extrabold text-lg mb-4 text-foreground">
                  <div className="p-2 bg-amber-500/10 rounded-xl">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                  </div>
                  Wawasan Pola Kerjamu
                </h3>
                <ul className="space-y-3">
                  {reviewData.insights?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 bg-muted/30 p-3 rounded-xl border border-border/50">
                      <div className="w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-[10px] font-bold text-muted-foreground">
                        {i + 1}
                      </div>
                      <span className="text-sm text-foreground/80 font-medium leading-relaxed pt-0.5">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fokus Minggu Depan */}
              <div>
                <h3 className="flex items-center gap-2 font-extrabold text-lg mb-4 text-foreground">
                  <div className="p-2 bg-cyan-500/10 rounded-xl">
                    <Target className="w-5 h-5 text-cyan-500" />
                  </div>
                  Fokus Minggu Depan
                </h3>
                <ul className="space-y-3">
                  {reviewData.focusNextWeek?.map((item: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 bg-cyan-500/5 p-3 rounded-xl border border-cyan-500/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                      <span className="text-sm text-foreground/90 font-medium leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Footer Actions (Sticky di Bawah) */}
            <div className="pt-6 mt-6 border-t border-border/50 flex gap-3 sticky bottom-0 bg-card">
              <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12 font-bold shadow-sm">
                Tutup
              </Button>
              <Button onClick={onSave} className="flex-1 rounded-xl h-12 font-bold shadow-md bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 text-white border-0 transition-transform active:scale-95">
                Simpan ke Arsip
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}