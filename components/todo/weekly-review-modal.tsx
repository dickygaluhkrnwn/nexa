"use client";

import { X, Target, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WeeklyReviewModalProps {
  reviewData: any;
  onClose: () => void;
  onSave: () => void;
}

export function WeeklyReviewModal({ reviewData, onClose, onSave }: WeeklyReviewModalProps) {
  if (!reviewData) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-card border border-border p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 relative overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header Modal */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-muted rounded-full hover:bg-muted-foreground/20 transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-4 mb-6 mt-2 shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-purple-500/20">
            {reviewData.grade || "A"}
          </div>
          <div className="flex-1 pr-6">
            <h2 className="font-extrabold text-xl leading-tight text-foreground">{reviewData.title}</h2>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Nexa AI Evaluation</p>
          </div>
        </div>

        {/* Area Scrollable Konten */}
        <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-4">
          <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20">
            <p className="text-sm font-medium leading-relaxed italic text-purple-700 dark:text-purple-300">
              "{reviewData.summary}"
            </p>
          </div>

          <div>
            <h3 className="flex items-center gap-2 font-bold text-sm mb-3 text-foreground">
              <Lightbulb className="w-4 h-4 text-amber-500" /> Wawasan Pola Kerjamu
            </h3>
            <ul className="space-y-2.5">
              {reviewData.insights?.map((item: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2.5 text-muted-foreground font-medium leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="flex items-center gap-2 font-bold text-sm mb-3 text-foreground">
              <Target className="w-4 h-4 text-cyan-500" /> Fokus Minggu Depan
            </h3>
            <ul className="space-y-2.5">
              {reviewData.focusNextWeek?.map((item: string, i: number) => (
                <li key={i} className="text-sm flex items-start gap-2.5 text-muted-foreground font-medium leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="pt-4 mt-auto shrink-0 border-t border-border/50 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-12 font-bold shadow-sm">
            Tutup
          </Button>
          <Button onClick={onSave} className="flex-1 rounded-xl h-12 font-bold shadow-md bg-gradient-to-r from-primary to-purple-600 text-white border-0">
            Simpan ke Arsip
          </Button>
        </div>
        
      </div>
    </div>
  );
}