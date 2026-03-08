"use client";

import { useEffect, useState, useMemo } from "react";
import { X, Sun, Moon, CloudSun, Volume2, CheckCircle2, AlertCircle, PlaySquare, SquareSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, getUserHabits, NoteData, HabitData } from "@/lib/notes-service";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type ExtendedNoteData = NoteData & { id: string };

export function DailyBriefingModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const [pendingTodos, setPendingTodos] = useState<ExtendedNoteData[]>([]);
  const [missedHabits, setMissedHabits] = useState<HabitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [greetingText, setGreetingText] = useState("");

  const [timeConfig, setTimeConfig] = useState({
    greeting: "Pagi",
    gradient: "from-amber-400 to-orange-500",
    buttonBg: "bg-amber-500 hover:bg-amber-600 text-white",
    buttonActive: "bg-amber-100 text-amber-600 hover:bg-amber-200",
    dotColor: "bg-amber-600",
    Icon: Sun
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      setTimeConfig({
        greeting: "Pagi", gradient: "from-amber-400 to-orange-500", 
        buttonBg: "bg-amber-500 hover:bg-amber-600 text-white", buttonActive: "bg-amber-100 text-amber-600 hover:bg-amber-200", 
        dotColor: "bg-amber-600", Icon: Sun
      });
    } else if (hour >= 11 && hour < 15) {
      setTimeConfig({
        greeting: "Siang", gradient: "from-orange-400 to-rose-500", 
        buttonBg: "bg-orange-500 hover:bg-orange-600 text-white", buttonActive: "bg-orange-100 text-orange-600 hover:bg-orange-200", 
        dotColor: "bg-orange-600", Icon: Sun
      });
    } else if (hour >= 15 && hour < 18) {
      setTimeConfig({
        greeting: "Sore", gradient: "from-rose-400 to-pink-600", 
        buttonBg: "bg-rose-500 hover:bg-rose-600 text-white", buttonActive: "bg-rose-100 text-rose-600 hover:bg-rose-200", 
        dotColor: "bg-rose-600", Icon: CloudSun
      });
    } else {
      setTimeConfig({
        greeting: "Malam", gradient: "from-indigo-500 to-purple-600", 
        buttonBg: "bg-indigo-500 hover:bg-indigo-600 text-white", buttonActive: "bg-indigo-100 text-indigo-600 hover:bg-indigo-200", 
        dotColor: "bg-indigo-600", Icon: Moon
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkBriefingStatus = async () => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const lastBriefing = localStorage.getItem(`nexa_briefing_${user.uid}`);

      if (lastBriefing !== todayStr) {
        setIsOpen(true);
        await fetchDataForBriefing();
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

      const todos = (notes as unknown as ExtendedNoteData[]).filter(n => n.isTodo && !n.isCompleted && !n.isHidden);
      setPendingTodos(todos);

      const yesterdayStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
      const missed = habits.filter(h => !h.completedDates.includes(yesterdayStr));
      setMissedHabits(missed);

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
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    localStorage.setItem(`nexa_briefing_${user.uid}`, todayStr);
    
    window.speechSynthesis.cancel();
    setIsOpen(false);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      alert("Maaf, browsermu tidak mendukung Text-to-Speech.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(greetingText);
    utterance.lang = 'id-ID'; 
    utterance.rate = 1.0; 
    utterance.pitch = 1.0; 

    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(v => v.lang === 'id-ID' && v.name.includes('Google'));
    if (indonesianVoice) utterance.voice = indonesianVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

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
      
      {/* Modal Container - Split Layout Desktop */}
      <div className="relative w-full max-w-3xl bg-card border border-border shadow-2xl rounded-[2rem] overflow-hidden flex flex-col md:flex-row z-10 animate-in zoom-in-95 max-h-[90vh]">
        
        <button onClick={handleClose} className="absolute top-4 right-4 md:top-5 md:right-5 p-2 bg-black/10 md:bg-muted rounded-full hover:bg-black/20 md:hover:bg-muted-foreground/20 transition-colors z-20">
          <X className="w-5 h-5 text-white md:text-muted-foreground" />
        </button>

        {/* KIRI: Visual Banner Waktu */}
        <div className={`md:w-2/5 p-8 md:p-10 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-700 bg-gradient-to-br ${timeConfig.gradient} text-white shrink-0`}>
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-black/10 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex flex-col items-center">
            <IconComponent className="w-20 h-20 md:w-24 md:h-24 mb-6 drop-shadow-lg animate-pulse opacity-90" />
            <h2 className="text-3xl md:text-4xl font-black tracking-tight drop-shadow-sm mb-2">Selamat {timeConfig.greeting}!</h2>
            <p className="text-white/90 font-semibold text-sm md:text-base bg-black/10 px-4 py-1.5 rounded-full border border-white/20 backdrop-blur-sm">
              {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: localeId })}
            </p>
          </div>
        </div>

        {/* KANAN: Konten Briefing & Data */}
        <div className="md:w-3/5 p-6 md:p-8 flex flex-col overflow-y-auto custom-scrollbar bg-background">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground mt-4 font-bold tracking-wider uppercase">Menyiapkan Asisten...</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              
              <div className="flex items-center gap-2 mb-4 text-primary font-bold text-xs uppercase tracking-widest bg-primary/10 w-max px-3 py-1.5 rounded-lg border border-primary/20">
                <Sparkles className="w-4 h-4" /> AI Daily Briefing
              </div>

              {/* Pesan Sapaan Jarvis */}
              <div className="bg-muted/40 p-5 rounded-2xl border border-border/60 relative mb-6">
                <p className="text-sm md:text-base text-foreground/90 leading-relaxed font-medium">"{greetingText}"</p>
              </div>

              {/* Grid Mini Stats */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-card border border-border shadow-sm rounded-2xl p-4 flex items-center gap-4 hover:border-blue-500/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                    <SquareSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-2xl font-black text-foreground">{pendingTodos.length}</span>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-0.5">Tugas Aktif</p>
                  </div>
                </div>
                
                <div className="bg-card border border-border shadow-sm rounded-2xl p-4 flex items-center gap-4 hover:border-orange-500/30 transition-colors">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${missedHabits.length > 0 ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {missedHabits.length > 0 ? <AlertCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                  </div>
                  <div>
                    <span className="text-2xl font-black text-foreground">{missedHabits.length}</span>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mt-0.5">Habit Bolong</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex gap-3 pt-4 border-t border-border/50">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-12 font-bold shadow-sm" 
                  onClick={handleClose}
                >
                  Tutup Laporan
                </Button>
                <Button 
                  className={`flex-1 rounded-xl h-12 shadow-md font-bold transition-all border-0 ${isSpeaking ? timeConfig.buttonActive : timeConfig.buttonBg}`}
                  onClick={handleSpeak}
                  disabled={isLoading}
                >
                  {isSpeaking ? (
                    <>
                      <div className="flex gap-1.5 mr-3">
                        <span className={`w-1.5 h-3 rounded-full animate-bounce ${timeConfig.dotColor}`}></span>
                        <span className={`w-1.5 h-4 rounded-full animate-bounce delay-75 ${timeConfig.dotColor}`}></span>
                        <span className={`w-1.5 h-2 rounded-full animate-bounce delay-150 ${timeConfig.dotColor}`}></span>
                      </div>
                      Membacakan...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-5 h-5 mr-2" /> Bacakan Laporan
                    </>
                  )}
                </Button>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}