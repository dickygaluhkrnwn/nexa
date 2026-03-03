"use client";

import { useEffect, useState, useMemo } from "react";
import { X, Sun, Moon, CloudSun, Volume2, CheckCircle2, AlertCircle, PlaySquare, SquareSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, getUserHabits, NoteData, HabitData } from "@/lib/notes-service";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// FIX: Buat tipe data gabungan agar TypeScript tidak bingung
type ExtendedNoteData = NoteData & { id: string };

export function DailyBriefingModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Data State
  const [pendingTodos, setPendingTodos] = useState<ExtendedNoteData[]>([]);
  const [missedHabits, setMissedHabits] = useState<HabitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [greetingText, setGreetingText] = useState("");

  // State untuk Kesadaran Waktu (Time Awareness)
  const [timeConfig, setTimeConfig] = useState({
    greeting: "Pagi",
    gradient: "from-amber-400 to-orange-500",
    buttonBg: "bg-amber-500 hover:bg-amber-600",
    buttonActive: "bg-amber-100 text-amber-600 hover:bg-amber-200",
    dotColor: "bg-amber-600",
    Icon: Sun
  });

  useEffect(() => {
    // Tentukan tema waktu saat komponen dimuat
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      setTimeConfig({
        greeting: "Pagi", gradient: "from-amber-400 to-orange-500", 
        buttonBg: "bg-amber-500 hover:bg-amber-600", buttonActive: "bg-amber-100 text-amber-600 hover:bg-amber-200", 
        dotColor: "bg-amber-600", Icon: Sun
      });
    } else if (hour >= 11 && hour < 15) {
      setTimeConfig({
        greeting: "Siang", gradient: "from-orange-400 to-rose-500", 
        buttonBg: "bg-orange-500 hover:bg-orange-600", buttonActive: "bg-orange-100 text-orange-600 hover:bg-orange-200", 
        dotColor: "bg-orange-600", Icon: Sun
      });
    } else if (hour >= 15 && hour < 18) {
      setTimeConfig({
        greeting: "Sore", gradient: "from-rose-400 to-pink-600", 
        buttonBg: "bg-rose-500 hover:bg-rose-600", buttonActive: "bg-rose-100 text-rose-600 hover:bg-rose-200", 
        dotColor: "bg-rose-600", Icon: CloudSun
      });
    } else {
      setTimeConfig({
        greeting: "Malam", gradient: "from-indigo-500 to-purple-600", 
        buttonBg: "bg-indigo-500 hover:bg-indigo-600", buttonActive: "bg-indigo-100 text-indigo-600 hover:bg-indigo-200", 
        dotColor: "bg-indigo-600", Icon: Moon
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkBriefingStatus = async () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const lastBriefing = localStorage.getItem(`nexa_briefing_${user.uid}`);

      // Jika hari ini belum pernah melihat briefing, buka modal
      if (lastBriefing !== todayStr) {
        setIsOpen(true);
        await fetchDataForBriefing();
        // Jangan set localStorage dulu di sini, biarkan diset saat user menutup modal
      }
    };

    checkBriefingStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDataForBriefing = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [notes, habits] = await Promise.all([
        getUserNotes(user.uid),
        getUserHabits(user.uid)
      ]);

      // FIX: Gunakan 'as unknown as ExtendedNoteData[]' untuk meredam error TypeScript
      const todos = (notes as unknown as ExtendedNoteData[]).filter(n => n.isTodo && !n.isCompleted && !n.isHidden);
      setPendingTodos(todos);

      // Cari Habit yang bolong kemarin 
      const yesterdayStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
      const missed = habits.filter(h => !h.completedDates.includes(yesterdayStr));
      setMissedHabits(missed);

      // Susun Teks Sapaan Berdasarkan Waktu
      const userName = user.displayName?.split(" ")[0] || "Bos";
      const hour = new Date().getHours();
      let timeGreeting = "pagi";
      if (hour >= 11 && hour < 15) timeGreeting = "siang";
      else if (hour >= 15 && hour < 18) timeGreeting = "sore";
      else if (hour >= 18 || hour < 4) timeGreeting = "malam";

      let text = `Selamat ${timeGreeting}, ${userName}. Semoga harimu menyenangkan. `;
      
      if (todos.length > 0) {
        text += `Hari ini kamu memiliki ${todos.length} tugas yang menunggu untuk diselesaikan. `;
      } else {
        text += `Jadwal tugasmu kosong hari ini, waktu yang tepat untuk bersantai atau merencanakan hal baru. `;
      }

      if (missed.length > 0 && missed.length < 3) {
         text += `Oh ya, aku perhatikan kemarin kamu melewatkan habit ${missed[0].title}. Jangan lupa dilanjutkan hari ini ya!`;
      } else if (missed.length >= 3) {
         text += `Ada beberapa habit yang terlewat kemarin, mari kita perbaiki rekornya hari ini!`;
      }

      setGreetingText(text);

    } catch (error) {
      console.error("Gagal memuat data briefing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!user) return;
    // Tandai bahwa hari ini sudah melihat briefing
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    localStorage.setItem(`nexa_briefing_${user.uid}`, todayStr);
    
    // Matikan suara jika sedang bicara
    window.speechSynthesis.cancel();
    setIsOpen(false);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert("Maaf, browsermu tidak mendukung Text-to-Speech.");
      return;
    }

    // Stop suara sebelumnya (jika ada)
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(greetingText);
    utterance.lang = 'id-ID'; // Bahasa Indonesia
    utterance.rate = 1.0; // Kecepatan normal
    utterance.pitch = 1.0; 

    // Coba cari suara Google bahasa Indonesia jika ada
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(v => v.lang === 'id-ID' && v.name.includes('Google'));
    if (indonesianVoice) utterance.voice = indonesianVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Pre-load voices (Kebutuhan Chrome)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  if (!isOpen) return null;

  const IconComponent = timeConfig.Icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={handleClose} />
      
      <div className="relative w-full max-w-md bg-card border border-border shadow-2xl rounded-[2rem] overflow-hidden flex flex-col z-10 animate-in zoom-in-95">
        
        {/* Header Dinamis (Mengikuti Waktu) */}
        <div className={`bg-gradient-to-br ${timeConfig.gradient} p-6 text-white text-center relative overflow-hidden transition-all duration-700`}>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col items-center">
            <IconComponent className="w-12 h-12 mb-3 drop-shadow-md animate-pulse" />
            <h2 className="text-2xl font-black tracking-tight drop-shadow-sm">Selamat {timeConfig.greeting}!</h2>
            <p className="text-white/90 font-medium text-sm mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy', { locale: localeId })}</p>
          </div>
        </div>

        {/* Konten Laporan */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-muted-foreground mt-4 font-medium">Menyiapkan laporan harianmu...</p>
            </div>
          ) : (
            <>
              {/* Pesan Sapaan Jarvis */}
              <div className="bg-muted/50 p-4 rounded-2xl border border-border/50 relative">
                <p className="text-sm text-foreground leading-relaxed font-medium">"{greetingText}"</p>
                <div className="absolute -top-3 -left-2 w-6 h-6 bg-background rounded-full flex items-center justify-center border border-border shadow-sm">
                  ✨
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col items-center text-center">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mb-2">
                    <SquareSquare className="w-4 h-4" />
                  </div>
                  <span className="text-2xl font-black text-foreground">{pendingTodos.length}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Tugas Hari Ini</span>
                </div>
                
                <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col items-center text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${missedHabits.length > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {missedHabits.length > 0 ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <span className="text-2xl font-black text-foreground">{missedHabits.length}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-1">Habit Bolong</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 pt-0 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 rounded-xl h-12" 
            onClick={handleClose}
          >
            Tutup
          </Button>
          <Button 
            className={`flex-1 rounded-xl h-12 shadow-lg font-bold transition-all text-white border-0 ${isSpeaking ? timeConfig.buttonActive : timeConfig.buttonBg}`}
            onClick={handleSpeak}
            disabled={isLoading}
          >
            {isSpeaking ? (
              <>
                <div className="flex gap-1 mr-2">
                  <span className={`w-1 h-3 rounded-full animate-bounce ${timeConfig.dotColor}`}></span>
                  <span className={`w-1 h-4 rounded-full animate-bounce delay-75 ${timeConfig.dotColor}`}></span>
                  <span className={`w-1 h-2 rounded-full animate-bounce delay-150 ${timeConfig.dotColor}`}></span>
                </div>
                Membaca...
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 mr-2" /> Dengarkan
              </>
            )}
          </Button>
        </div>

      </div>
    </div>
  );
}