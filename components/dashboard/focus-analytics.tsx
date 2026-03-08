"use client";

import { useEffect, useState, useMemo } from "react";
import { format, subDays, addDays, isSameDay } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Brain, Trophy, Loader2, BarChart2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getUserFocusSessions, FocusSession } from "@/lib/notes-service";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export function FocusAnalytics() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const chartData = useMemo(() => {
    const today = new Date();
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
      const minutesOnThisDay = sessions
        .filter(s => s.completedAt.substring(0, 10) === dateStr)
        .reduce((sum, s) => sum + s.durationMinutes, 0);

      totalMinutesThisWeek += minutesOnThisDay;

      return {
        dayName: format(date, 'EEE', { locale: localeId }), // Singkatan hari
        minutes: minutesOnThisDay,
        isToday: isSameDay(date, today),
        fullDate: dateStr
      };
    });

    return { data, totalMinutesThisWeek };
  }, [sessions]);

  const formatTotalTime = (totalMins: number) => {
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hours > 0) return `${hours}j ${mins > 0 ? `${mins}m` : ''}`;
    return `${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="h-64 border border-border rounded-[2rem] bg-card flex flex-col items-center justify-center gap-3 shadow-sm">
        <Loader2 className="w-6 h-6 animate-spin text-primary/50" />
        <p className="text-xs text-muted-foreground font-medium">Memuat Analitik Fokus...</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-border/60 rounded-[2rem] bg-card shadow-sm flex flex-col items-center">
        <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-4">
          <BarChart2 className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-base text-foreground mb-2">Pantau Fokus Kerjamu</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
          Selesaikan tugas menggunakan Timer Pomodoro di menu Tugas, grafik produktivitas mingguanmu akan muncul di sini.
        </p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border text-popover-foreground text-xs font-bold px-3 py-2 rounded-xl shadow-xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>{`${payload[0].value} Menit Fokus`}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-card border border-border rounded-[2rem] p-5 md:p-6 shadow-sm flex flex-col">
      
      {/* Header Analitik Premium */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base md:text-lg text-foreground leading-tight">Analitik Fokus</h3>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5 uppercase tracking-wider">7 Hari Terakhir</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Total Minggu Ini</p>
          <div className="flex items-center justify-end gap-1.5 bg-muted/50 px-3 py-1.5 rounded-xl border border-border/50">
            <Trophy className="w-4 h-4 text-orange-500" />
            <span className="text-lg md:text-xl font-black text-foreground tracking-tight">
              {formatTotalTime(chartData.totalMinutesThisWeek)}
            </span>
          </div>
        </div>
      </div>

      {/* RECHARTS AREA (Ditingkatkan Tinggi & Gradients) */}
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData.data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            {/* Definisikan Gradient Bar */}
            <defs>
              <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              </linearGradient>
              <linearGradient id="colorMuted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="hsl(var(--muted-foreground))" stopOpacity={0.05}/>
              </linearGradient>
            </defs>

            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5, fontWeight: 600 }}
              dx={-5}
            />
            <XAxis 
              dataKey="dayName" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fontWeight: 'bold' }} 
              dy={10}
              padding={{ left: 10, right: 10 }}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ fill: 'currentColor', opacity: 0.05 }} 
            />
            <Bar 
              dataKey="minutes" 
              radius={[8, 8, 8, 8]}
              animationDuration={1500}
              maxBarSize={48}
            >
              {
                chartData.data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isToday ? "url(#colorPrimary)" : "url(#colorMuted)"} 
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