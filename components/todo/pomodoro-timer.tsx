"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain, Timer, X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import { useAuth } from "@/lib/auth-context"; 
import { addFocusSession } from "@/lib/notes-service"; 

const WORK_TIME = 25 * 60; // 25 Menit
const BREAK_TIME = 5 * 60; // 5 Menit

export function PomodoroTimer() {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { showAlert } = useModal();
  const wakeLockRef = useRef<any>(null);

  // Menyimpan durasi awal sesi untuk pencatatan
  const initialTimeRef = useRef(WORK_TIME);

  // Fungsi untuk menahan layar agar tidak mati (Wakelock API)
  const requestWakeLock = async () => {
    // FIX: Hanya request wakelock jika tab sedang aktif/dilihat user
    if ('wakeLock' in navigator && document.visibilityState === 'visible') {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch (err: any) {
        console.error(`Wakelock error: ${err.message}`);
      }
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current !== null) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err) {
        console.error(err);
      }
    }
  };

  // FIX: Menyalakan kembali Wakelock jika user pindah tab lalu kembali ke tab aplikasi
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive]);

  // Logika Interval Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isActive && timeLeft > 0) {
      requestWakeLock();
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      releaseWakeLock();
      
      // Getar jika didukung
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }

      if (mode === "work") {
        // --- SIMPAN DATA SESI FOKUS KE DATABASE ---
        if (user && !user.isAnonymous) {
           const durationInMinutes = Math.floor(initialTimeRef.current / 60);
           addFocusSession({
             userId: user.uid,
             durationMinutes: durationInMinutes,
             completedAt: new Date().toISOString()
           }).catch(err => console.error("Gagal menyimpan data fokus", err));
        }
        // ------------------------------------------

        setMode("break");
        initialTimeRef.current = BREAK_TIME;
        setTimeLeft(BREAK_TIME);
        showAlert("Fokus Selesai! 🎉", "Kerja bagus! Sesi fokusmu telah dicatat. Sekarang waktunya istirahat 5 menit. Regangkan badanmu dan minum air.");
      } else {
        setMode("work");
        initialTimeRef.current = WORK_TIME;
        setTimeLeft(WORK_TIME);
        showAlert("Istirahat Selesai!", "Ayo kembali fokus 25 menit. Kamu pasti bisa menyelesaikan tugas ini!");
      }
    } else {
      releaseWakeLock();
    }

    return () => {
      if (interval) clearInterval(interval);
      releaseWakeLock();
    };
  }, [isActive, timeLeft, mode, showAlert, user]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "work" ? WORK_TIME : BREAK_TIME);
  };

  const switchMode = (newMode: "work" | "break") => {
    setMode(newMode);
    const newTime = newMode === "work" ? WORK_TIME : BREAK_TIME;
    initialTimeRef.current = newTime;
    setTimeLeft(newTime);
    setIsActive(false);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercentage = mode === "work"
    ? ((WORK_TIME - timeLeft) / WORK_TIME) * 100
    : ((BREAK_TIME - timeLeft) / BREAK_TIME) * 100;

  return (
    <div className="fixed bottom-32 md:bottom-12 right-4 md:right-8 z-50 flex flex-col items-end gap-3 pointer-events-none">
      
      {/* Panel Expanded (Besar) */}
      {isExpanded && (
        <div className="pointer-events-auto w-64 bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-3xl p-5 animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" /> Pomodoro
            </h3>
            <button onClick={() => setIsExpanded(false)} className="p-1 hover:bg-muted rounded-full text-muted-foreground transition-colors">
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex bg-muted rounded-xl p-1 mb-6 relative">
            <div 
              className="absolute inset-y-1 w-[calc(50%-4px)] bg-background rounded-lg shadow-sm transition-all duration-300 ease-in-out" 
              style={{ left: mode === 'work' ? '4px' : 'calc(50% + 0px)' }}
            />
            <button 
              onClick={() => switchMode("work")} 
              className={`flex-1 relative z-10 py-1.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${mode === 'work' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              <Brain className="w-3.5 h-3.5" /> Fokus
            </button>
            <button 
              onClick={() => switchMode("break")} 
              className={`flex-1 relative z-10 py-1.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${mode === 'break' ? 'text-green-500' : 'text-muted-foreground'}`}
            >
              <Coffee className="w-3.5 h-3.5" /> Rehat
            </button>
          </div>

          <div className="text-center mb-6 relative">
            {/* Circular Progress Background */}
            <svg className="absolute inset-0 w-full h-full -z-10 -rotate-90 transform opacity-20" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" />
            </svg>
            {/* Circular Progress Indicator */}
            <svg className="absolute inset-0 w-full h-full -z-10 -rotate-90 transform" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="45" 
                fill="none" 
                stroke={mode === 'work' ? "hsl(var(--primary))" : "#22c55e"} 
                strokeWidth="8" 
                strokeDasharray="283" 
                strokeDashoffset={283 - (283 * progressPercentage) / 100}
                className="transition-all duration-1000 ease-linear"
                strokeLinecap="round"
              />
            </svg>

            <div className="py-8">
              <h2 className="text-5xl font-black tracking-tighter text-foreground tabular-nums">
                {formatTime(timeLeft)}
              </h2>
              <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-2">
                {mode === "work" ? "Mode Kerja" : "Mode Istirahat"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={toggleTimer} 
              className={`flex-1 rounded-2xl h-12 shadow-lg font-bold border-0 text-white transition-all active:scale-95 ${mode === 'work' ? 'bg-primary hover:bg-primary/90' : 'bg-green-500 hover:bg-green-600'}`}
            >
              {isActive ? <Pause className="w-5 h-5 mr-2 fill-current" /> : <Play className="w-5 h-5 mr-2 fill-current" />}
              {isActive ? "Jeda" : "Mulai"}
            </Button>
            <Button variant="outline" size="icon" onClick={resetTimer} className="h-12 w-12 rounded-2xl shrink-0 border-border bg-transparent hover:bg-muted active:scale-95">
              <RotateCcw className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>
        </div>
      )}

      {/* Tombol Toggle (Kecil) */}
      {!isExpanded && (
        <button 
          onClick={() => setIsExpanded(true)}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl shadow-primary/20 backdrop-blur-md border animate-in zoom-in duration-300 active:scale-95 ${isActive ? (mode === 'work' ? 'bg-primary border-primary text-primary-foreground' : 'bg-green-500 border-green-500 text-white') : 'bg-card border-border text-foreground hover:bg-muted'}`}
        >
          {isActive ? (
            <div className="relative flex items-center justify-center w-5 h-5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-white/40 animate-ping" />
              {mode === 'work' ? <Brain className="w-4 h-4 relative z-10" /> : <Coffee className="w-4 h-4 relative z-10" />}
            </div>
          ) : (
            <Timer className="w-5 h-5 text-primary" />
          )}
          <span className="font-bold tabular-nums tracking-wide">{formatTime(timeLeft)}</span>
          <Maximize2 className={`w-3.5 h-3.5 opacity-50 ml-1 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
        </button>
      )}

    </div>
  );
}