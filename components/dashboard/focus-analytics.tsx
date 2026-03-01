"use client";

import { useEffect, useState, useMemo } from "react";
import { format, subDays, startOfWeek, addDays, isSameDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Brain, Timer, Trophy, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getUserFocusSessions, FocusSession } from "@/lib/notes-service";

export function FocusAnalytics() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Ambil data sesi fokus dari Firebase
  useEffect(() => {
    if (!user) return;
    const fetchSessions = async () => {
      try {
        const data = await getUserFocusSessions(user.uid);
        setSessions(data);
      } catch (err) {
        console.error("Gagal mengambil log fokus", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSessions();
  }, [user]);

  // Kalkulasi data untuk 7 hari terakhir (Minggu ini)
  const chartData = useMemo(() => {
    const today = new Date();
    // Mulai dari Senin minggu ini, atau 6 hari ke belakang agar selalu ada 7 hari
    const startDate = subDays(today, 6); 
    
    const daysArray = [];
    let currentDay = startDate;
    for (let i = 0; i < 7; i++) {
      daysArray.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }

    let maxMinutes = 0;
    let totalMinutesThisWeek = 0;

    const data = daysArray.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Jumlahkan menit fokus pada tanggal ini
      const minutesOnThisDay = sessions
        .filter(s => format(new Date(s.completedAt), 'yyyy-MM-dd') === dateStr)
        .reduce((sum, s) => sum + s.durationMinutes, 0);

      if (minutesOnThisDay > maxMinutes) maxMinutes = minutesOnThisDay;
      totalMinutesThisWeek += minutesOnThisDay;

      return {
        date,
        dayName: format(date, 'EE', { locale: localeId }), // Sen, Sel, Rab, dll
        minutes: minutesOnThisDay,
        isToday: isSameDay(date, today)
      };
    });

    // Menghindari pembagian dengan 0 saat chart kosong
    if (maxMinutes === 0) maxMinutes = 60; // Default max 60 menit kalau kosong

    return { data, maxMinutes, totalMinutesThisWeek };
  }, [sessions]);

  // Format jam dan menit untuk tampilan
  const formatTotalTime = (totalMins: number) => {
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours > 0) return `${hours}j ${mins > 0 ? `${mins}m` : ''}`;
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="h-40 border border-border rounded-[2rem] bg-muted/20 flex flex-col items-center justify-center gap-3 animate-pulse">
        <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
        <p className="text-xs text-muted-foreground font-medium">Menghitung fokus...</p>
      </div>
    );
  }

  // Jika belum ada data sama sekali
  if (sessions.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-border rounded-[2rem] bg-card flex flex-col items-center">
        <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-3">
          <Timer className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-sm text-foreground mb-1">Mulai Perjalanan Fokusmu</h3>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-[250px]">
          Selesaikan sesi Pomodoro (25 Menit) di halaman tugas untuk melihat grafik produktivitasmu menyala di sini!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/80 rounded-[2rem] p-5 md:p-6 shadow-sm space-y-6">
      
      {/* Header Analitik */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground leading-tight">Analitik Fokus</h3>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wider">7 Hari Terakhir</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground font-medium mb-0.5">Total Fokus</p>
          <div className="flex items-center gap-1.5 justify-end">
            <span className="text-xl font-black text-foreground tracking-tight">
              {formatTotalTime(chartData.totalMinutesThisWeek)}
            </span>
            {chartData.totalMinutesThisWeek > 0 && <Trophy className="w-4 h-4 text-[#E5B034] -mt-1" />}
          </div>
        </div>
      </div>

      {/* Area Bar Chart (CSS Murni) */}
      <div className="h-32 flex items-end justify-between gap-1.5 pt-4">
        {chartData.data.map((day, i) => {
          // Menghitung tinggi bar dalam persen (dengan minimal tinggi 5% jika ada nilainya agar tetap terlihat)
          const heightPercent = day.minutes > 0 
            ? Math.max((day.minutes / chartData.maxMinutes) * 100, 8) 
            : 0;

          return (
            <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
              {/* Tooltip Hover Murni CSS */}
              <div className="relative flex justify-center w-full h-full items-end">
                <div className="absolute -top-8 bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                  {day.minutes} mnt
                </div>
                
                {/* Bar Kosong (Background) */}
                <div className="absolute inset-0 bg-muted/50 rounded-lg -z-10" />
                
                {/* Bar Isi (Warna) */}
                <div 
                  className={`w-full rounded-lg transition-all duration-1000 ease-out origin-bottom ${day.isToday ? 'bg-gradient-to-t from-primary to-purple-500' : 'bg-primary/50'}`}
                  style={{ height: `${heightPercent}%` }}
                />
              </div>
              
              {/* Label Hari */}
              <span className={`text-[10px] font-bold ${day.isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                {day.dayName}
              </span>
            </div>
          );
        })}
      </div>
      
    </div>
  );
}