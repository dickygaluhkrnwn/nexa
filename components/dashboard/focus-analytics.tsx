"use client";

import { useEffect, useState, useMemo } from "react";
import { format, subDays, addDays, isSameDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Brain, Timer, Trophy, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getUserFocusSessions, FocusSession } from "@/lib/notes-service";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

  // Kalkulasi data untuk 7 hari terakhir menggunakan Recharts format
  const chartData = useMemo(() => {
    const today = new Date();
    // Mulai dari 6 hari ke belakang agar selalu ada 7 hari sampai hari ini
    const startDate = subDays(today, 6); 
    
    const daysArray = [];
    let currentDay = startDate;
    for (let i = 0; i < 7; i++) {
      daysArray.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }

    let totalMinutesThisWeek = 0;

    const data = daysArray.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // FIX: Gunakan substring YYYY-MM-DD dari completedAt (asumsi format ISO string dari Firestore)
      // agar tidak terpengaruh perbedaan zona waktu saat konversi Date object lokal vs server
      const minutesOnThisDay = sessions
        .filter(s => s.completedAt.substring(0, 10) === dateStr)
        .reduce((sum, s) => sum + s.durationMinutes, 0);

      totalMinutesThisWeek += minutesOnThisDay;

      return {
        dayName: format(date, 'EE', { locale: localeId }), // Sen, Sel, Rab, dll
        minutes: minutesOnThisDay,
        isToday: isSameDay(date, today),
        fullDate: dateStr
      };
    });

    return { data, totalMinutesThisWeek };
  }, [sessions]);

  // Format jam dan menit untuk tampilan total
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

  // Komponen Custom Tooltip untuk Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-foreground text-background text-xs font-bold px-3 py-2 rounded-lg shadow-xl">
          {`${payload[0].value} Menit`}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border/80 rounded-[2rem] p-5 md:p-6 shadow-sm space-y-6">
      
      {/* Header Analitik */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-400 to-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
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

      {/* RECHARTS AREA */}
      <div className="h-40 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            {/* Sembunyikan garis Y, tapi biarkan angkanya untuk referensi tipis */}
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }}
              dx={-5}
            />
            {/* Garis bawah X */}
            <XAxis 
              dataKey="dayName" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 10, fontWeight: 'bold' }} 
              dy={10}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: 'currentColor', opacity: 0.05 }} // Efek highlight tipis di latar saat hover
            />
            <Bar 
              dataKey="minutes" 
              radius={[6, 6, 6, 6]} // Rounded corners
              animationDuration={1500}
            >
              {
                chartData.data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isToday ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.4)"} 
                  />
                ))
              }
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
    </div>
  );
}