"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Coffee, Brain, Timer, X, GripHorizontal, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useModal } from "@/hooks/use-modal";
import { useAuth } from "@/lib/auth-context"; 
import { addFocusSession } from "@/lib/notes-service"; 
import { cn } from "@/lib/utils";

const WORK_TIME = 25 * 60; // 25 Menit
const BREAK_TIME = 5 * 60; // 5 Menit

interface PomodoroTimerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function PomodoroTimer({ isOpen = false, onClose }: PomodoroTimerProps) {
  const { user } = useAuth();
  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  
  // Karena kita menggunakan prop `isOpen` dari parent, jika parent tidak mengoper `isOpen` (seperti saat digunakan tanpa controller), kita sediakan fallback internal state.
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen);
  
  // Update internal state jika props berubah dari luar
  useEffect(() => {
    setInternalIsOpen(isOpen);
  }, [isOpen]);

  const { showAlert } = useModal();
  const wakeLockRef = useRef<any>(null);
  const initialTimeRef = useRef(WORK_TIME);

  // State untuk fitur Draggable (bisa digeser)
  const [position, setPosition] = useState({ x: 0, y: 0 }); // Posisi akan dihitung dari pojok KANAN ATAS
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  // Set posisi awal di pojok kanan atas saat komponen dimount
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, []);

  // --- LOGIKA DRAG & DROP WIDGET ---
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.drag-handle')) {
      setIsDragging(true);
      dragStart.current = { 
        x: e.clientX + position.x, 
        y: e.clientY - position.y 
      };
      if (widgetRef.current) {
        widgetRef.current.setPointerCapture(e.pointerId);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    
    // Hitung posisi baru
    const newX = dragStart.current.x - e.clientX; 
    const newY = e.clientY - dragStart.current.y;

    setPosition({ 
      x: newX, 
      y: newY 
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (widgetRef.current) {
      widgetRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const requestWakeLock = async () => {
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive]);

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
      
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }

      if (mode === "work") {
        if (user && !user.isAnonymous) {
           const durationInMinutes = Math.floor(initialTimeRef.current / 60);
           addFocusSession({
             userId: user.uid,
             durationMinutes: durationInMinutes,
             completedAt: new Date().toISOString()
           }).catch(err => console.error("Gagal menyimpan data fokus", err));
        }
        setMode("break");
        initialTimeRef.current = BREAK_TIME;
        setTimeLeft(BREAK_TIME);
        showAlert("Fokus Selesai! 🎉", "Kerja bagus! Sesi fokusmu telah dicatat. Sekarang waktunya istirahat 5 menit.");
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

  // Fungsi untuk menutup widget
  const handleClose = () => {
    setInternalIsOpen(false);
    if (onClose) onClose();
  }

  // Jika timer benar-benar tidak aktif (tidak jalan) dan disuruh tutup, return null saja agar hemat memory
  // Namun, JIKA TIMER SEDANG BERJALAN, kita tetap menyembunyikannya secara visual dengan CSS
  // atau kalau mau lebih praktis: render tombol kecil melayang di bawah
  if (!internalIsOpen && !isActive) return null;

  return (
    <>
      {/* 1. WIDGET UTAMA (Besar & Draggable)
          Ditampilkan jika isOpen (dari parent) atau internalIsOpen bernilai true.
      */}
      <div 
        ref={widgetRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ 
          transform: `translate(${-position.x}px, ${position.y}px)`,
          // Hapus pointer events jika tidak kelihatan agar bisa klik di belakangnya
          pointerEvents: internalIsOpen ? 'auto' : 'none'
        }}
        className={cn(
          "fixed top-24 right-4 md:right-8 z-[100] origin-top-right select-none touch-none transition-all duration-300 ease-out",
          internalIsOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
        )}>
        <div className="w-[280px] bg-card/95 backdrop-blur-xl border border-border shadow-2xl rounded-[2rem] p-6 relative overflow-hidden flex flex-col">
          
          {/* Latar Belakang Gradient Aktif */}
          <div className={cn(
            "absolute top-0 left-0 right-0 h-32 opacity-20 pointer-events-none transition-colors duration-1000",
            mode === 'work' ? "bg-gradient-to-b from-primary to-transparent" : "bg-gradient-to-b from-green-500 to-transparent"
          )} />

          {/* Header Pomodoro & Drag Handle */}
          <div className="flex items-center justify-between mb-5 relative z-10 drag-handle cursor-move -mt-2 -mx-2 p-2 rounded-xl hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2 pointer-events-none">
              <GripHorizontal className="w-4 h-4 text-muted-foreground/50" />
              <h3 className="font-extrabold text-sm flex items-center gap-2 tracking-wider uppercase text-foreground">
                <Timer className="w-4 h-4 text-primary" /> Pomodoro
              </h3>
            </div>
            <button onPointerDown={(e) => e.stopPropagation()} onClick={handleClose} className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-full transition-colors cursor-pointer z-20">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="flex bg-muted/80 rounded-xl p-1 mb-6 relative z-10 border border-border/50">
            <div 
              className="absolute inset-y-1 w-[calc(50%-4px)] bg-background rounded-lg shadow-sm border border-border/50 transition-all duration-300 ease-out" 
              style={{ left: mode === 'work' ? '4px' : 'calc(50% + 0px)' }}
            />
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => switchMode("work")} 
              className={cn("flex-1 relative z-10 py-1.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer", mode === 'work' ? 'text-primary' : 'text-muted-foreground')}
            >
              <Brain className="w-3.5 h-3.5" /> Fokus
            </button>
            <button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => switchMode("break")} 
              className={cn("flex-1 relative z-10 py-1.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer", mode === 'break' ? 'text-green-600' : 'text-muted-foreground')}
            >
              <Coffee className="w-3.5 h-3.5" /> Rehat
            </button>
          </div>

          {/* Lingkaran Timer */}
          <div className="text-center mb-6 relative flex justify-center py-4 z-10 pointer-events-none">
            <svg className="absolute inset-0 w-full h-full -z-10 -rotate-90 transform opacity-10" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="6" />
            </svg>
            <svg className="absolute inset-0 w-full h-full -z-10 -rotate-90 transform drop-shadow-md" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="46" 
                fill="none" 
                stroke={mode === 'work' ? "hsl(var(--primary))" : "#22c55e"} 
                strokeWidth="6" 
                strokeDasharray="289" 
                strokeDashoffset={289 - (289 * progressPercentage) / 100}
                className="transition-all duration-1000 ease-linear"
                strokeLinecap="round"
              />
            </svg>

            <div className="py-6">
              <h2 className="text-6xl font-black tracking-tighter text-foreground tabular-nums">
                {formatTime(timeLeft)}
              </h2>
              <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-3">
                {mode === "work" ? "Saatnya Bekerja" : "Waktu Istirahat"}
              </p>
            </div>
          </div>

          {/* Kontrol Aksi */}
          <div className="flex gap-2 relative z-10">
            <Button 
              onPointerDown={(e) => e.stopPropagation()}
              onClick={toggleTimer} 
              className={cn("flex-1 rounded-xl h-12 shadow-md font-bold border-0 text-white transition-all active:scale-95 text-base cursor-pointer", mode === 'work' ? 'bg-primary hover:bg-primary/90' : 'bg-green-600 hover:bg-green-700')}
            >
              {isActive ? <Pause className="w-5 h-5 mr-2 fill-current" /> : <Play className="w-5 h-5 mr-2 fill-current" />}
              {isActive ? "Jeda" : "Mulai"}
            </Button>
            <Button 
              onPointerDown={(e) => e.stopPropagation()}
              variant="outline" size="icon" onClick={resetTimer} className="h-12 w-12 rounded-xl shrink-0 border-border bg-background hover:bg-muted active:scale-95 shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 text-muted-foreground" />
            </Button>
          </div>

        </div>
      </div>

      {/* 2. TOMBOL INDIKATOR KECIL (Mini Floating)
          Muncul DI POJOK BAWAH jika panel besar DITUTUP tapi Timer masih BERJALAN.
          Ini memecahkan masalah timer yang berjalan diam-diam tanpa disadari pengguna.
      */}
      {!internalIsOpen && isActive && (
        <div className="fixed bottom-24 md:bottom-12 right-4 md:right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
           <button 
             onClick={() => setInternalIsOpen(true)}
             className={cn(
              "flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl backdrop-blur-md border border-transparent transition-all active:scale-95 cursor-pointer", 
              mode === 'work' ? 'bg-primary text-primary-foreground shadow-primary/30' : 'bg-green-500 text-white shadow-green-500/30'
             )}
           >
             <div className="relative flex items-center justify-center w-5 h-5">
               <span className="absolute inline-flex h-full w-full rounded-full bg-white/40 animate-ping" />
               {mode === 'work' ? <Brain className="w-4 h-4 relative z-10" /> : <Coffee className="w-4 h-4 relative z-10" />}
             </div>
             <span className="font-bold tabular-nums tracking-wide">{formatTime(timeLeft)}</span>
             <Maximize2 className="w-3.5 h-3.5 opacity-50 ml-1" />
           </button>
        </div>
      )}
    </>
  );
}