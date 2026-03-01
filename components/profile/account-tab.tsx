"use client";

import { Button } from "@/components/ui/button";
import { FileText, CheckSquare, LockKeyhole, LogOut } from "lucide-react";
import { ProductivityHeatmap } from "./productivity-heatmap"; // <-- IMPORT HEATMAP

interface AccountTabProps {
  stats: { notes: number; todos: number; vault: number };
  onLogout: () => void;
  activityDates: Date[]; // <-- TAMBAHKAN PROPS INI
}

export function AccountTab({ stats, onLogout, activityDates }: AccountTabProps) {
  return (
    <div className="space-y-6">
      
      {/* --- STATISTIK --- */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border/60 rounded-3xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group">
          <div className="p-2.5 bg-blue-500/10 rounded-2xl mb-2 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-xl font-black text-foreground">{stats.notes}</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Catatan</p>
        </div>
        <div className="bg-card border border-border/60 rounded-3xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all duration-300 group">
          <div className="p-2.5 bg-orange-500/10 rounded-2xl mb-2 group-hover:scale-110 transition-transform">
            <CheckSquare className="w-5 h-5 text-orange-500" />
          </div>
          <h3 className="text-xl font-black text-foreground">{stats.todos}</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Tugas</p>
        </div>
        <div className="bg-card border border-border/60 rounded-3xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all duration-300 group">
          <div className="p-2.5 bg-purple-500/10 rounded-2xl mb-2 group-hover:scale-110 transition-transform">
            <LockKeyhole className="w-5 h-5 text-purple-500" />
          </div>
          <h3 className="text-xl font-black text-foreground">{stats.vault}</h3>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Brankas</p>
        </div>
      </div>

      {/* --- HEATMAP AKTIVITAS --- */}
      <ProductivityHeatmap activityDates={activityDates} />

      {/* --- LOGOUT --- */}
      <div className="pt-4">
        <Button onClick={onLogout} variant="outline" className="w-full h-12 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition-colors font-bold shadow-sm">
          <LogOut className="w-4 h-4 mr-2" /> Keluar dari Akun Nexa
        </Button>
      </div>
    </div>
  );
}