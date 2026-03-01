"use client";

import { useMemo, useState } from "react";
import { format, isSameDay, getDaysInMonth, startOfMonth, getDay, addMonths, subMonths } from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProductivityHeatmapProps {
  activityDates: Date[]; // Kumpulan tanggal aktivitas (buat catatan, selesaikan tugas)
}

export function ProductivityHeatmap({ activityDates }: ProductivityHeatmapProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Menentukan hari pertama dalam bulan ini (0 = Minggu, 1 = Senin, dst)
  // Kita sesuaikan agar Senin = 0, Minggu = 6 (standar umum kalender kerja)
  let firstDayIndex = getDay(currentMonth) - 1;
  if (firstDayIndex === -1) firstDayIndex = 6; // Jika Minggu, geser ke akhir

  const daysInMonth = getDaysInMonth(currentMonth);

  // 1. Hitung intensitas aktivitas per hari HANYA untuk bulan yang sedang dilihat
  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    const currentMonthStr = format(currentMonth, 'yyyy-MM');
    
    activityDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      // Hanya hitung jika tanggal berada di bulan yang sedang aktif
      if (dateStr.startsWith(currentMonthStr)) {
        map.set(dateStr, (map.get(dateStr) || 0) + 1);
      }
    });
    return map;
  }, [activityDates, currentMonth]);

  // 2. Fungsi penentu warna berdasarkan intensitas
  const getColorClass = (count: number) => {
    if (count === 0) return "bg-muted/50 border-border/50 text-muted-foreground hover:bg-muted";
    if (count === 1) return "bg-green-500/30 border-green-500/20 text-foreground font-bold shadow-sm";
    if (count >= 2 && count <= 3) return "bg-green-500/60 border-green-500/40 text-foreground font-bold shadow-sm";
    if (count >= 4 && count <= 5) return "bg-green-500/80 border-green-500/60 text-white font-bold shadow-md";
    return "bg-green-500 border-green-600 text-white font-bold shadow-md";
  };

  // 3. Susun Grid Kalender (Baris = Minggu, Kolom = Hari)
  const gridDays = [];
  
  // Tambahkan kotak kosong untuk menggeser tanggal 1 ke hari yang tepat
  for (let i = 0; i < firstDayIndex; i++) {
    gridDays.push(null);
  }
  
  // Tambahkan tanggal-tanggal bulan ini
  for (let i = 1; i <= daysInMonth; i++) {
    gridDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
  }

  const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  
  // Hitung total kontribusi bulan ini
  const totalContributionsThisMonth = Array.from(activityMap.values()).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border/60 rounded-[2rem] p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-bold text-sm">Jejak Aktivitas</h3>
            
            {/* Kontrol Navigasi Bulan */}
            <div className="flex items-center gap-2 mt-1">
              <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="h-6 w-6 rounded-full">
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </Button>
              <p className="text-xs text-muted-foreground capitalize font-semibold min-w-[80px] text-center">
                {format(currentMonth, 'MMM yyyy', { locale: id })}
              </p>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleNextMonth} 
                disabled={isSameDay(startOfMonth(currentMonth), startOfMonth(today))} // Cegah maju melebihi bulan ini
                className="h-6 w-6 rounded-full"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>

          </div>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20 shrink-0">
            {totalContributionsThisMonth} Kontribusi
          </span>
        </div>

        {/* Grid Kalender Bulanan */}
        <div className="space-y-2">
          {/* Header Hari */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((day, i) => (
              <div key={i} className="text-[10px] font-bold text-muted-foreground tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Kotak-kotak Tanggal */}
          <div className="grid grid-cols-7 gap-1.5">
            {gridDays.map((date, index) => {
              if (!date) {
                // Render kotak kosong transparan untuk menyelaraskan grid
                return <div key={`empty-${index}`} className="aspect-square" />;
              }
              
              const dateStr = format(date, 'yyyy-MM-dd');
              const count = activityMap.get(dateStr) || 0;
              const isTodayDate = isSameDay(date, today);

              return (
                <div
                  key={index}
                  title={`${format(date, 'd MMM yyyy', { locale: id })}: ${count} aktivitas`}
                  className={`
                    aspect-square rounded-xl border flex items-center justify-center text-xs transition-all duration-300
                    ${getColorClass(count)}
                    ${isTodayDate ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                  `}
                >
                  {date.getDate()}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Legend Bawah */}
        <div className="flex items-center justify-center gap-2 mt-5 text-[10px] text-muted-foreground font-medium pt-4 border-t border-border/50">
          <span>Sedikit</span>
          <div className="flex gap-1.5">
            <div className="w-4 h-4 rounded-md bg-muted/50 border border-border/50" />
            <div className="w-4 h-4 rounded-md bg-green-500/30 border border-green-500/20" />
            <div className="w-4 h-4 rounded-md bg-green-500/60 border border-green-500/40" />
            <div className="w-4 h-4 rounded-md bg-green-500/80 border border-green-500/60" />
            <div className="w-4 h-4 rounded-md bg-green-500 border border-green-600" />
          </div>
          <span>Banyak</span>
        </div>
      </div>

      {/* Keterangan Logika Heatmap */}
      <div className="flex items-start gap-2.5 p-3.5 bg-muted/50 rounded-2xl border border-border/50 text-xs text-muted-foreground leading-relaxed">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary/70" />
        <p>
          <strong className="text-foreground">Logika Jejak Aktivitas:</strong> Grafik ini merekam setiap interaksi produktifmu. Tingkat warna hijau ditentukan oleh jumlah "Kontribusi" harian, yaitu total dari <strong>Catatan Baru yang kamu buat</strong> dan <strong>Tugas (To-Do) yang kamu selesaikan</strong> pada hari tersebut. Makin produktif, makin menyala! 🔥
        </p>
      </div>
    </div>
  );
}