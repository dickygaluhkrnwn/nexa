"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Plus, FileText, ListTodo, LockKeyhole, 
  ArrowRight, Circle, CalendarClock, User as UserIcon,
  Sparkles, Mic, Camera, CheckCircle2, AlertCircle, Clock,
  ChevronRight, Brain 
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { getUserNotes, NoteData } from "@/lib/notes-service";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal";
import { HabitTracker } from "@/components/todo/habit-tracker";
import { FocusAnalytics } from "@/components/dashboard/focus-analytics";
import { DailyBriefingModal } from "@/components/ai/daily-briefing-modal"; // <-- IMPORT KOMPONEN DAILY BRIEFING

type DashboardNote = NoteData & { id: string; isCompleted?: boolean; isHidden?: boolean };

// Helper format tanggal lokal
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

  // Otomatis buat sesi Tamu (Guest) jika tidak ada user
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

    if (user) {
      fetchNotes();
    }
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
  
  // Tugas
  const pendingTodos = visibleNotes.filter((n) => n.isTodo && !n.isCompleted);
  const overdueTodos = pendingTodos.filter((n) => n.dueDate && n.dueDate < todayStr);
  const todayTodos = pendingTodos.filter((n) => n.dueDate === todayStr);
  
  // Ringkasan untuk UI
  const urgentTasks = [...overdueTodos, ...todayTodos].slice(0, 3);
  const recentNotes = visibleNotes.filter((n) => !n.isTodo).slice(0, 4);

  return (
    <div className="p-4 pb-32 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto relative">
      
      {/* 1. Header & Greeting */}
      <div className="flex items-center justify-between mt-2 mb-2">
        <div className="animate-in slide-in-from-left-4 duration-500">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-primary" /> {todayFormatted}
          </p>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">
              {user.isAnonymous ? "Tamu" : (user.displayName?.split(" ")[0] || "Pengguna")}
            </span> 👋
          </h2>
        </div>
        <Link href="/profile">
          <div className="w-14 h-14 rounded-[1.25rem] overflow-hidden border-2 border-primary/20 shadow-lg bg-muted flex items-center justify-center transition-all hover:scale-105 active:scale-95 hover:shadow-primary/20 hover:border-primary/50">
            {user.isAnonymous ? (
              <UserIcon className="w-7 h-7 text-muted-foreground" />
            ) : (
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </Link>
      </div>

      {loadingNotes ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      ) : (
        <>
          {/* 2. Banner Guest Mode (Jika Tamu) */}
          {user.isAnonymous && (
            <div className="bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-orange-500/20 p-4 rounded-3xl flex items-start gap-3 relative overflow-hidden group">
              <span className="text-xl z-10 mt-0.5">🕵️‍♂️</span>
              <div className="z-10 flex-1">
                <p className="text-sm text-orange-600 dark:text-orange-400 font-bold mb-1">Sedang Mode Eksplorasi</p>
                <p className="text-xs text-foreground/70 leading-relaxed font-medium mb-3">
                  Catatanmu akan hilang jika keluar. Buat akun permanen sekarang untuk mengamankan datamu di awan.
                </p>
                <Button asChild size="sm" className="h-8 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-xl shadow-md w-full">
                  <Link href="/profile">Daftar Akun Gratis</Link>
                </Button>
              </div>
            </div>
          )}

          {/* 3. Hero Dashboard (Ringkasan Interaktif) */}
          <div className="bg-gradient-to-tr from-primary to-purple-600 rounded-[2rem] p-6 shadow-xl shadow-primary/20 relative overflow-hidden group border-0 text-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-colors duration-700 pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <h3 className="font-bold text-sm text-white/80 uppercase tracking-widest mb-4">Ringkasan Hari Ini</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <Link href="/todo" className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-sm hover:shadow-md hover:bg-white/20 transition-all flex flex-col justify-between group/card">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover/card:scale-110 transition-transform">
                    <ListTodo className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-white">{pendingTodos.length}</p>
                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1">Tugas Aktif</p>
                  </div>
                </Link>
                <Link href="/notes" className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-sm hover:shadow-md hover:bg-white/20 transition-all flex flex-col justify-between group/card">
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3 group-hover/card:scale-110 transition-transform">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-3xl font-black text-white">{totalNotes}</p>
                    <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1">Total Catatan</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* 4. AI Quick Actions (Superpowers) */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-4 gap-3">
              <Link href="/create" className="flex flex-col items-center gap-2.5 group">
                <div className="w-14 h-14 bg-card border border-border/80 text-foreground rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:border-primary group-hover:text-primary transition-all">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground">Teks</span>
              </Link>
              <Link href="/create-todo" className="flex flex-col items-center gap-2.5 group">
                <div className="w-14 h-14 bg-card border border-border/80 text-foreground rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:border-orange-500 group-hover:text-orange-500 transition-all">
                  <ListTodo className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground">Tugas</span>
              </Link>
              <Link href="/create?mode=voice" className="flex flex-col items-center gap-2.5 group">
                <div className="w-14 h-14 bg-card border border-border/80 text-foreground rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:border-rose-500 group-hover:text-rose-500 transition-all">
                  <Mic className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground">Suara</span>
              </Link>
              <Link href="/create?mode=camera" className="flex flex-col items-center gap-2.5 group">
                <div className="w-14 h-14 bg-card border border-border/80 text-foreground rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:border-purple-500 group-hover:text-purple-500 transition-all">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground">Pindai</span>
              </Link>
            </div>
          </div>

          <div className="w-full h-px bg-border/50 my-4" />

          {/* 5. Fokus Tugas Hari Ini */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <CalendarClock className="w-5 h-5 text-orange-500" /> Fokus Hari Ini
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Selesaikan tugas prioritasmu.</p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full font-bold h-9 bg-card">
                <Link href="/todo">Buka Papan</Link>
              </Button>
            </div>
            
            {pendingTodos.length === 0 ? (
              <div className="p-6 rounded-[2rem] border border-dashed border-border bg-muted/20 text-center">
                <div className="w-14 h-14 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <p className="text-sm font-bold text-foreground">Semua Tuntas!</p>
                <p className="text-xs text-muted-foreground mt-1">Kamu bisa beristirahat dengan tenang sekarang.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {urgentTasks.map((todo) => {
                  const isOverdue = todo.dueDate && todo.dueDate < todayStr;
                  return (
                    <Link key={todo.id} href={`/edit-todo/${todo.id}`} className="block">
                      <div className={`flex items-center gap-3 p-4 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all group ${isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-border'}`}>
                        <Circle className={`w-5 h-5 shrink-0 transition-colors ${isOverdue ? 'text-destructive/50' : 'text-muted-foreground/30 group-hover:text-primary'}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors">{todo.title || "Tanpa Judul"}</h4>
                          {todo.dueDate && (
                            <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold ${isOverdue ? 'text-destructive' : 'text-orange-500'}`}>
                              {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              <span>{isOverdue ? 'Terlewat!' : 'Hari Ini'}</span>
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                      </div>
                    </Link>
                  );
                })}
                {pendingTodos.length > 3 && (
                  <Link href="/todo" className="block text-center text-xs font-bold text-muted-foreground hover:text-primary py-3 bg-muted/30 rounded-2xl border border-border/50 transition-colors">
                    Lihat {pendingTodos.length - 3} tugas lainnya
                  </Link>
                )}
              </div>
            )}
          </div>

          <div className="w-full h-px bg-border/50 my-4" />

          {/* --- RENDER FOCUS ANALYTICS DI SINI --- */}
          <FocusAnalytics />
          {/* -------------------------------------- */}

          <div className="w-full h-px bg-border/50 my-4" />

          {/* --- RENDER HABIT TRACKER --- */}
          <HabitTracker />

          <div className="w-full h-px bg-border/50 my-4" />

          {/* 6. Catatan Terbaru */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                  <FileText className="w-5 h-5 text-blue-500" /> Catatan Terbaru
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Akses cepat ke ide dan jurnalmu.</p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full font-bold h-9 bg-card">
                <Link href="/notes">Lihat Semua</Link>
              </Button>
            </div>

            {recentNotes.length === 0 ? (
              <div className="p-6 rounded-[2rem] border border-dashed border-border bg-muted/20 text-center">
                <p className="text-sm font-bold text-muted-foreground">Belum ada ide yang dicatat.</p>
                <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl border-primary/20 text-primary font-bold">
                  <Link href="/create"><Plus className="w-4 h-4 mr-1" /> Tulis Sesuatu</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recentNotes.map((note) => (
                  <Link key={note.id} href={`/edit/${note.id}`} className="block h-full">
                    <div className="p-4 bg-card border border-border/60 rounded-[1.5rem] shadow-sm hover:shadow-lg hover:border-primary/30 transition-all h-full flex flex-col group relative overflow-hidden">
                      {/* Gradient aksen halus di sudut */}
                      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <h4 className="font-bold text-sm mb-1.5 line-clamp-2 text-foreground group-hover:text-primary transition-colors relative z-10 leading-tight">
                        {note.title || "Tanpa Judul"}
                      </h4>
                      <div 
                        className="text-xs text-muted-foreground line-clamp-3 mb-3 relative z-10 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: note.content.replace(/<[^>]+>/g, ' ') }} 
                      />
                      {note.tags && note.tags.length > 0 && (
                        <div className="mt-auto flex flex-wrap gap-1.5 relative z-10">
                          <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider rounded-md truncate max-w-full">
                            #{note.tags[0]}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* --- MOUNTING DAILY BRIEFING MODAL DI SINI --- */}
      <DailyBriefingModal />
      {/* --------------------------------------------- */}

    </div>
  );
}