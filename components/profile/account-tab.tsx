"use client";

import { Button } from "@/components/ui/button";
import { FileText, CheckSquare, LockKeyhole, LogOut } from "lucide-react";
import { ProductivityHeatmap } from "./productivity-heatmap"; 

interface AccountTabProps {
  stats: { notes: number; todos: number; vault: number };
  onLogout: () => void;
  activityDates: Date[]; 
}

export function AccountTab({ stats, onLogout, activityDates }: AccountTabProps) {
  return (
    <div className="space-y-8">
      
      {/* --- STATISTIK --- */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Statistik Workspace</h3>
        <div className="grid grid-cols-3 gap-4 md:gap-6">
          <div className="bg-background border border-border/60 rounded-3xl p-5 md:p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all duration-300 group">
            <div className="p-3 bg-blue-500/10 rounded-2xl mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-foreground">{stats.notes}</h3>
            <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 md:mt-2">Catatan Aktif</p>
          </div>
          <div className="bg-background border border-border/60 rounded-3xl p-5 md:p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all duration-300 group">
            <div className="p-3 bg-orange-500/10 rounded-2xl mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <CheckSquare className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-foreground">{stats.todos}</h3>
            <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 md:mt-2">Tugas Berjalan</p>
          </div>
          <div className="bg-background border border-border/60 rounded-3xl p-5 md:p-6 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all duration-300 group">
            <div className="p-3 bg-purple-500/10 rounded-2xl mb-3 md:mb-4 group-hover:scale-110 transition-transform">
              <LockKeyhole className="w-6 h-6 md:w-8 md:h-8 text-purple-500" />
            </div>
            <h3 className="text-3xl md:text-4xl font-black text-foreground">{stats.vault}</h3>
            <p className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 md:mt-2">Item Terkunci</p>
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-border/50" />

      {/* --- HEATMAP AKTIVITAS --- */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Aktivitas Produktivitas</h3>
        <ProductivityHeatmap activityDates={activityDates} />
      </div>

      <div className="w-full h-px bg-border/50" />

      {/* --- LOGOUT --- */}
      <div className="pt-2">
        <Button onClick={onLogout} variant="outline" className="w-full md:w-auto md:min-w-[250px] h-14 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition-colors font-bold shadow-sm text-base">
          <LogOut className="w-5 h-5 mr-3" /> Keluar dari Akun Nexa
        </Button>
      </div>
    </div>
  );
}