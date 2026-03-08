"use client";

import { useMemo, useState } from "react";
import { format, isSameDay, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductivityHeatmapProps {
  activityDates: Date[];
}

export function ProductivityHeatmap({ activityDates }: ProductivityHeatmapProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  let firstDayIndex = getDay(currentMonth) - 1;
  if (firstDayIndex === -1) firstDayIndex = 6; 

  const daysInMonth = getDaysInMonth(currentMonth);

  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    const currentMonthStr = format(currentMonth, 'yyyy-MM');
    
    activityDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (dateStr.startsWith(currentMonthStr)) {
        map.set(dateStr, (map.get(dateStr) || 0) + 1);
      }
    });
    return map;
  }, [activityDates, currentMonth]);

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-muted/40 border-border/50 text-muted-foreground/50 hover:bg-muted";
    if (count === 1) return "bg-green-500/30 border-green-500/20 text-foreground font-bold shadow-sm";
    if (count >= 2 && count <= 3) return "bg-green-500/60 border-green-500/40 text-foreground font-bold shadow-sm";
    if (count >= 4 && count <= 5) return "bg-green-500/80 border-green-500/60 text-white font-bold shadow-md";
    return "bg-green-500 border-green-600 text-white font-black shadow-md";
  };

  const gridDays = [];
  
  for (let i = 0; i < firstDayIndex; i++) {
    gridDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    gridDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const totalContributionsThisMonth = Array.from(activityMap.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="bg-background border border-border/60 rounded-[2rem] p-6 md:p-8 shadow-sm">
        
        {/* Header Calendar & Kontrol */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/50">
          <div>
            <h3 className="font-bold text-base md:text-lg flex items-center gap-2">Jejak Kontribusi</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Pantau seberapa aktif kamu di Nexa.</p>
          </div>
          
          <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto bg-muted/30 p-2 rounded-2xl border border-border/50">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-xl bg-background shadow-sm border border-border">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-sm text-foreground capitalize font-bold w-[100px] text-center">
                {format(currentMonth, 'MMM yyyy', { locale: id })}
              </p>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNextMonth} 
                disabled={isSameDay(startOfMonth(currentMonth), startOfMonth(today))} 
                className="h-8 w-8 rounded-xl bg-background shadow-sm border border-border"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="hidden md:block w-px h-6 bg-border mx-2" />
            
            <span className="text-xs font-bold text-green-600 bg-green-500/10 px-3 py-1.5 rounded-lg border border-green-500/20 shrink-0">
              {totalContributionsThisMonth} Total Aktivitas
            </span>
          </div>
        </div>

        {/* Grid Kalender Responsif */}
        <div className="w-full">
          <div className="grid grid-cols-7 gap-2 md:gap-3 text-center mb-3">
            {weekDays.map((day, i) => (
              <div key={i} className="text-[11px] md:text-xs font-bold text-muted-foreground tracking-wider uppercase">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {gridDays.map((date, index) => {
              if (!date) return <div key={`empty-${index}`} className="aspect-square" />;
              
              const dateStr = format(date, 'yyyy-MM-dd');
              const count = activityMap.get(dateStr) || 0;
              const isTodayDate = isSameDay(date, today);

              return (
                <div
                  key={index}
                  title={`${format(date, 'd MMM yyyy', { locale: id })}: ${count} aktivitas`}
                  className={cn(
                    "aspect-square rounded-[0.85rem] border flex items-center justify-center text-sm transition-all duration-300 cursor-default",
                    getColorClass(count),
                    isTodayDate && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                >
                  <span className={cn(isTodayDate && count === 0 && "font-bold text-primary")}>
                    {date.getDate()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center md:justify-end gap-3 mt-8 text-xs text-muted-foreground font-semibold pt-6 border-t border-border/50">
          <span>Sedikit</span>
          <div className="flex gap-2">
            <div className="w-5 h-5 rounded-md bg-muted/40 border border-border/50" />
            <div className="w-5 h-5 rounded-md bg-green-500/30 border border-green-500/20" />
            <div className="w-5 h-5 rounded-md bg-green-500/60 border border-green-500/40" />
            <div className="w-5 h-5 rounded-md bg-green-500/80 border border-green-500/60" />
            <div className="w-5 h-5 rounded-md bg-green-500 border border-green-600" />
          </div>
          <span>Banyak</span>
        </div>
      </div>

      <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-[1.5rem] border border-border/50 text-sm text-muted-foreground leading-relaxed">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-primary/70" />
        <p>
          <strong className="text-foreground">Sistem Heatmap:</strong> Area ini merekam produktivitasmu. Warnanya akan semakin hijau berdasarkan jumlah catatan yang kamu buat dan tugas yang berhasil kamu selesaikan dalam sehari.
        </p>
      </div>
    </div>
  );
}