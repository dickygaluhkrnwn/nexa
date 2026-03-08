"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Plus, FileText, ListTodo, 
  ArrowRight, Circle, CalendarClock, User as UserIcon,
  Sparkles, Mic, Camera, CheckCircle2, AlertCircle, Clock,
  LockKeyhole
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { getUserNotes, NoteData } from "@/lib/notes-service";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal";
import { HabitTracker } from "@/components/todo/habit-tracker";
import { FocusAnalytics } from "@/components/dashboard/focus-analytics";
import { DailyBriefingModal } from "@/components/ai/daily-briefing-modal"; 
import { cn } from "@/lib/utils";

type DashboardNote = NoteData & { id: string; isCompleted?: boolean; isHidden?: boolean };

const getLocalIsoDate = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export default function Home() {
  const { user, loading, loginAsGuest } = useAuth();
  const { showAlert } = useModal(); 
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const todayStr = useMemo(() => getLocalIsoDate(new Date()), []);
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      loginAsGuest();
    }
  }, [user, loading, loginAsGuest]);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;
      try {
        const data = await getUserNotes(user.uid);
        setNotes(data as DashboardNote[]);
      } catch (error) {
        console.error("Gagal mengambil catatan:", error);
        showAlert("Gagal Memuat", "Terjadi kesalahan saat mengambil catatanmu dari server.");
      } finally {
        setLoadingNotes(false);
      }
    };

    if (user) fetchNotes();
  }, [user, showAlert]);

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse font-medium">Menyiapkan ruang kerjamu...</p>
      </div>
    );
  }

  // --- PENGOLAHAN DATA DASHBOARD ---
  const visibleNotes = notes.filter((n) => !n.isHidden);
  const totalNotes = visibleNotes.filter((n) => !n.isTodo).length;
  
  const pendingTodos = visibleNotes.filter((n) => n.isTodo && !n.isCompleted);
  const overdueTodos = pendingTodos.filter((n) => n.dueDate && n.dueDate < todayStr);
  const todayTodos = pendingTodos.filter((n) => n.dueDate === todayStr);
  
  const urgentTasks = [...overdueTodos, ...todayTodos].slice(0, 4);
  const recentNotes = visibleNotes.filter((n) => !n.isTodo).slice(0, 4);

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto relative w-full">
      
      {/* Mobile Header Greeting (Hanya muncul di HP) */}
      <div className="flex items-center justify-between mb-6 md:hidden">
        <div className="animate-in slide-in-from-left-4 duration-500">
          <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> {todayFormatted}
          </p>
          <h1 className="text-2xl font-black tracking-tight text-foreground leading-tight">
            Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">
              {user.isAnonymous ? "Tamu" : (user.displayName?.split(" ")[0] || "Pengguna")}
            </span> 👋
          </h1>
        </div>
        <Link href="/profile" className="shrink-0 relative">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-background shadow-md bg-muted flex items-center justify-center">
            {user.isAnonymous ? <UserIcon className="w-6 h-6 text-muted-foreground" /> : <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} alt="Profile" className="w-full h-full object-cover" />}
          </div>
        </Link>
      </div>

      {loadingNotes ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* =======================================
              KOLOM KIRI (Utama: Banner, Habit, Analytics)
              ======================================= */}
          <div className="xl:col-span-8 flex flex-col gap-6 md:gap-8">
            
            {/* Banner Tamu */}
            {user.isAnonymous && (
              <div className="bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-orange-500/20 p-4 md:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-xl">🕵️‍♂️</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-orange-600 dark:text-orange-400">Mode Eksplorasi (Tamu)</p>
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">Catatanmu akan hilang jika keluar. Daftar akun untuk simpan permanen.</p>
                  </div>
                </div>
                <Button asChild size="sm" className="shrink-0 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold w-full sm:w-auto">
                  <Link href="/profile">Daftar Gratis</Link>
                </Button>
              </div>
            )}

            {/* HERO COMMAND CENTER (Redesigned & Proporsional) */}
            <div className="bg-card border border-border shadow-sm rounded-[2rem] p-6 md:p-8 lg:p-10 relative overflow-hidden group">
              {/* Efek Glow Background */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-primary/10 via-purple-500/5 to-transparent rounded-bl-full pointer-events-none opacity-60" />
              
              {/* Bagian Atas: Greeting (Desktop) & Foto Profil */}
              <div className="hidden md:flex justify-between items-start gap-6 relative z-10 mb-8 border-b border-border/50 pb-8">
                <div>
                  <p className="text-sm font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> {todayFormatted}
                  </p>
                  <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
                    Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">
                      {user.isAnonymous ? "Tamu" : (user.displayName?.split(" ")[0] || "Pengguna")}
                    </span> 👋
                  </h1>
                  <p className="text-muted-foreground font-medium mt-3 text-base">Selamat datang kembali. Apa yang ingin kamu kerjakan hari ini?</p>
                </div>
                
                <Link href="/profile" className="shrink-0 relative group/pic transition-transform hover:scale-105 active:scale-95">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-background shadow-xl ring-2 ring-primary/20 bg-muted flex items-center justify-center">
                    {user.isAnonymous ? <UserIcon className="w-8 h-8 text-muted-foreground" /> : <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} alt="Profile" className="w-full h-full object-cover" />}
                  </div>
                  {!user.isAnonymous && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border-2 border-background shadow-sm whitespace-nowrap">Member</div>}
                </Link>
              </div>

              {/* Bagian Tengah: Statistik Utama (2 Kolom Lebar) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 relative z-10 mb-8">
                <Link href="/todo" className="bg-background border border-border p-5 rounded-3xl flex items-center justify-between group/stat hover:border-orange-500/40 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover/stat:scale-110 group-hover/stat:bg-orange-500 group-hover/stat:text-white transition-all duration-300">
                      <ListTodo className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-3xl md:text-4xl font-black text-foreground">{pendingTodos.length}</p>
                      <p className="text-[11px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Tugas Aktif</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover/stat:bg-orange-500/10 group-hover/stat:text-orange-500 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </Link>

                <Link href="/notes" className="bg-background border border-border p-5 rounded-3xl flex items-center justify-between group/stat hover:border-blue-500/40 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover/stat:scale-110 group-hover/stat:bg-blue-500 group-hover/stat:text-white transition-all duration-300">
                      <FileText className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-3xl md:text-4xl font-black text-foreground">{totalNotes}</p>
                      <p className="text-[11px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Total Catatan</p>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground group-hover/stat:bg-blue-500/10 group-hover/stat:text-blue-500 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </Link>
              </div>

              {/* Bagian Bawah: Jalan Pintas Interaktif */}
              <div className="relative z-10 w-full">
                <h3 className="font-bold text-[11px] text-muted-foreground uppercase tracking-widest mb-4">Jalan Pintas Pembuatan</h3>
                
                {/* FIX: Menggunakan Grid 4 Kolom agar tombol membagi ruang rata kiri-kanan secara proporsional */}
                <div className="grid grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full">
                  <Link href="/create" className="flex flex-col items-center gap-2.5 group/btn w-full">
                    <div className="w-full aspect-square max-w-[80px] bg-muted border border-border text-foreground rounded-2xl flex items-center justify-center shadow-sm group-hover/btn:scale-105 group-hover/btn:bg-primary group-hover/btn:text-primary-foreground group-hover/btn:border-primary transition-all duration-300 mx-auto">
                      <FileText className="w-6 h-6 md:w-7 md:h-7 group-hover/btn:scale-110 transition-transform" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground group-hover/btn:text-foreground transition-colors text-center w-full truncate">Catatan</span>
                  </Link>
                  
                  <Link href="/create-todo" className="flex flex-col items-center gap-2.5 group/btn w-full">
                    <div className="w-full aspect-square max-w-[80px] bg-muted border border-border text-foreground rounded-2xl flex items-center justify-center shadow-sm group-hover/btn:scale-105 group-hover/btn:bg-orange-500 group-hover/btn:text-white group-hover/btn:border-orange-500 transition-all duration-300 mx-auto">
                      <ListTodo className="w-6 h-6 md:w-7 md:h-7 group-hover/btn:scale-110 transition-transform" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground group-hover/btn:text-foreground transition-colors text-center w-full truncate">Tugas</span>
                  </Link>
                  
                  <Link href="/create?mode=voice" className="flex flex-col items-center gap-2.5 group/btn w-full">
                    <div className="w-full aspect-square max-w-[80px] bg-muted border border-border text-foreground rounded-2xl flex items-center justify-center shadow-sm group-hover/btn:scale-105 group-hover/btn:bg-rose-500 group-hover/btn:text-white group-hover/btn:border-rose-500 transition-all duration-300 mx-auto">
                      <Mic className="w-6 h-6 md:w-7 md:h-7 group-hover/btn:scale-110 transition-transform" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground group-hover/btn:text-foreground transition-colors text-center w-full truncate">Suara</span>
                  </Link>
                  
                  <Link href="/create?mode=camera" className="flex flex-col items-center gap-2.5 group/btn w-full">
                    <div className="w-full aspect-square max-w-[80px] bg-muted border border-border text-foreground rounded-2xl flex items-center justify-center shadow-sm group-hover/btn:scale-105 group-hover/btn:bg-purple-500 group-hover/btn:text-white group-hover/btn:border-purple-500 transition-all duration-300 mx-auto">
                      <Camera className="w-6 h-6 md:w-7 md:h-7 group-hover/btn:scale-110 transition-transform" />
                    </div>
                    <span className="text-[10px] md:text-xs font-bold text-muted-foreground group-hover/btn:text-foreground transition-colors text-center w-full truncate">Kamera</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Habit Tracker */}
            <HabitTracker />

            {/* Analitik Fokus */}
            <FocusAnalytics />

          </div>

          {/* =======================================
              KOLOM KANAN (Tugas Hari Ini & Catatan Terbaru)
              ======================================= */}
          <div className="xl:col-span-4 flex flex-col gap-6 md:gap-8">
            
            {/* Fokus Tugas Hari Ini */}
            <div className="bg-card border border-border rounded-[2rem] p-5 md:p-6 shadow-sm flex flex-col h-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground leading-tight">Fokus Hari Ini</h2>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Prioritas yang harus selesai.</p>
                  </div>
                </div>
                <Link href="/todo" className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              
              {pendingTodos.length === 0 ? (
                <div className="py-8 rounded-2xl border border-dashed border-border bg-muted/10 text-center flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-foreground">Semua Tuntas!</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Pekerjaanmu hari ini sudah selesai. Selamat beristirahat!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {urgentTasks.map((todo) => {
                    const isOverdue = todo.dueDate && todo.dueDate < todayStr;
                    return (
                      <Link key={todo.id} href={`/edit-todo/${todo.id}`} className="block">
                        <div className={cn(
                          "flex items-start gap-3 p-3.5 border rounded-2xl transition-all group",
                          isOverdue ? "bg-destructive/5 border-destructive/30 hover:border-destructive/60" : "bg-background border-border hover:border-primary/40 hover:shadow-sm"
                        )}>
                          <Circle className={cn("w-5 h-5 mt-0.5 shrink-0 transition-colors", isOverdue ? "text-destructive/50" : "text-muted-foreground/30 group-hover:text-primary")} />
                          <div className="flex-1 min-w-0">
                            <h4 className={cn("font-bold text-sm truncate transition-colors", isOverdue ? "text-destructive" : "text-foreground group-hover:text-primary")}>
                              {todo.title || "Tanpa Judul"}
                            </h4>
                            {todo.dueDate && (
                              <div className={cn("flex items-center gap-1 mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded w-fit", isOverdue ? "bg-destructive/10 text-destructive" : "bg-orange-500/10 text-orange-600")}>
                                {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                <span>{isOverdue ? 'Terlewat Waktu' : 'Tenggat Hari Ini'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  {pendingTodos.length > 4 && (
                    <Link href="/todo" className="block text-center text-xs font-bold text-primary hover:bg-primary/5 py-3 rounded-xl border border-transparent transition-colors mt-2">
                      Tampilkan {pendingTodos.length - 4} tugas lainnya
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Catatan Terbaru */}
            <div className="bg-card border border-border rounded-[2rem] p-5 md:p-6 shadow-sm flex flex-col h-auto">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground leading-tight">Catatan Terbaru</h2>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">Ide yang baru kamu tulis.</p>
                  </div>
                </div>
                <Link href="/notes" className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {recentNotes.length === 0 ? (
                <div className="py-8 rounded-2xl border border-dashed border-border bg-muted/10 text-center flex flex-col items-center">
                  <p className="text-sm font-bold text-muted-foreground">Belum ada catatan.</p>
                  <Button asChild variant="outline" size="sm" className="mt-3 rounded-xl border-primary/20 text-primary font-bold">
                    <Link href="/create"><Plus className="w-4 h-4 mr-1" /> Buat Baru</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {recentNotes.map((note) => (
                    <Link key={note.id} href={`/edit/${note.id}`} className="block">
                      <div className="p-4 bg-background border border-border/60 rounded-2xl hover:border-primary/40 hover:shadow-sm transition-all group relative overflow-hidden flex flex-col">
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <h4 className="font-bold text-sm mb-1.5 truncate text-foreground group-hover:text-primary transition-colors relative z-10">
                          {note.isHidden && <LockKeyhole className="w-3.5 h-3.5 inline mr-1.5 text-purple-500" />}
                          {note.title || "Tanpa Judul"}
                        </h4>
                        <div 
                          className="text-xs text-muted-foreground line-clamp-2 relative z-10 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: note.content.replace(/<[^>]+>/g, ' ') }} 
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* --- MOUNTING DAILY BRIEFING MODAL --- */}
      <DailyBriefingModal />

    </div>
  );
}