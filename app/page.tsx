"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Plus, FileText, ListTodo, LockKeyhole, 
  ArrowRight, Circle, CalendarClock, User as UserIcon,
  Sparkles, Mic, Camera, CheckCircle2, AlertCircle, Clock
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { getUserNotes, NoteData } from "@/lib/notes-service";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal";

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
    <div className="p-4 pb-28 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto relative">
      
      {/* 1. Header & Greeting */}
      <div className="flex items-center justify-between mt-2 mb-2">
        <div className="animate-in slide-in-from-left-4 duration-500">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{todayFormatted}</p>
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            Halo, {user.isAnonymous ? "Tamu" : (user.displayName?.split(" ")[0] || "Pengguna")} 👋
          </h2>
        </div>
        <Link href="/profile">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-md bg-muted flex items-center justify-center transition-transform hover:scale-105 active:scale-95">
            {user.isAnonymous ? (
              <UserIcon className="w-6 h-6 text-muted-foreground" />
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
              <span className="text-xl z-10">🕵️‍♂️</span>
              <div className="z-10">
                <p className="text-sm text-orange-600 dark:text-orange-400 font-bold mb-1">Sedang Mode Eksplorasi</p>
                <p className="text-xs text-foreground/70 leading-relaxed font-medium mb-2">
                  Catatanmu akan hilang jika keluar. Buat akun permanen sekarang untuk mengamankan datamu di awan.
                </p>
                <Link href="/profile" className="text-xs font-bold bg-orange-500 text-white px-3 py-1.5 rounded-lg inline-block shadow-md hover:bg-orange-600 transition-colors">
                  Daftar Gratis
                </Link>
              </div>
            </div>
          )}

          {/* 3. Hero Dashboard (Ringkasan AI) */}
          <div className="bg-card border border-border/60 rounded-[2rem] p-5 shadow-sm relative overflow-hidden group">
            {/* Dekorasi Latar */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors duration-500" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-foreground">Ringkasan Hari Ini</h3>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-muted/50 p-3 rounded-2xl border border-border/50">
                  <p className="text-3xl font-black text-foreground">{pendingTodos.length}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Tugas Aktif</p>
                </div>
                <div className="flex-1 bg-muted/50 p-3 rounded-2xl border border-border/50">
                  <p className="text-3xl font-black text-foreground">{totalNotes}</p>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Total Catatan</p>
                </div>
              </div>
            </div>
          </div>

          {/* 4. AI Quick Actions (Superpowers) */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Jalan Pintas</h3>
            <div className="grid grid-cols-4 gap-2">
              <Link href="/create" className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-blue-500 group-hover:text-white transition-all">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground">Teks</span>
              </Link>
              <Link href="/create-todo" className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 text-orange-600 rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-white transition-all">
                  <ListTodo className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground">Tugas</span>
              </Link>
              <Link href="/create?mode=voice" className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 text-rose-600 rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-rose-500 group-hover:text-white transition-all">
                  <Mic className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground">Suara</span>
              </Link>
              <Link href="/create?mode=camera" className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 bg-purple-500/10 border border-purple-500/20 text-purple-600 rounded-[1.25rem] flex items-center justify-center shadow-sm group-hover:scale-105 group-hover:bg-purple-500 group-hover:text-white transition-all">
                  <Camera className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground group-hover:text-foreground">Pindai</span>
              </Link>
            </div>
          </div>

          {/* 5. Fokus Tugas Hari Ini */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <CalendarClock className="w-4 h-4 text-orange-500" /> Fokus Hari Ini
              </h3>
              <Link href="/todo" className="text-xs font-bold text-primary hover:underline bg-primary/10 px-2 py-1 rounded-md transition-colors">
                Buka Papan
              </Link>
            </div>
            
            {pendingTodos.length === 0 ? (
              <div className="p-6 rounded-3xl border border-dashed border-border bg-muted/20 text-center">
                <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-foreground">Semua Tuntas!</p>
                <p className="text-xs text-muted-foreground mt-1">Kamu bisa beristirahat sekarang.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {urgentTasks.map((todo) => {
                  const isOverdue = todo.dueDate && todo.dueDate < todayStr;
                  return (
                    <Link key={todo.id} href={`/edit-todo/${todo.id}`} className="block">
                      <div className={`flex items-center gap-3 p-3.5 bg-card border rounded-2xl shadow-sm hover:shadow-md transition-all group ${isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-border'}`}>
                        <Circle className={`w-5 h-5 shrink-0 transition-colors ${isOverdue ? 'text-destructive/50' : 'text-muted-foreground/50 group-hover:text-primary'}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">{todo.title || "Tanpa Judul"}</h4>
                          {todo.dueDate && (
                            <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold ${isOverdue ? 'text-destructive' : 'text-orange-500'}`}>
                              {isOverdue ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              <span>{isOverdue ? 'Terlewat!' : 'Hari Ini'}</span>
                            </div>
                          )}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
                      </div>
                    </Link>
                  );
                })}
                {pendingTodos.length > 3 && (
                  <Link href="/todo" className="block text-center text-xs font-bold text-muted-foreground hover:text-primary py-2 transition-colors">
                    + Lihat {pendingTodos.length - 3} tugas lainnya
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* 6. Catatan Terbaru */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <FileText className="w-4 h-4 text-blue-500" /> Catatan Terbaru
              </h3>
              <Link href="/notes" className="text-xs font-bold text-primary hover:underline bg-primary/10 px-2 py-1 rounded-md transition-colors">
                Lihat Semua
              </Link>
            </div>

            {recentNotes.length === 0 ? (
              <div className="p-6 rounded-3xl border border-dashed border-border bg-muted/20 text-center">
                <p className="text-sm font-bold text-muted-foreground">Belum ada ide yang dicatat.</p>
                <Button asChild variant="outline" size="sm" className="mt-3 rounded-xl border-primary/20 text-primary">
                  <Link href="/create">Tulis Sesuatu</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recentNotes.map((note) => (
                  <Link key={note.id} href={`/edit/${note.id}`} className="block h-full">
                    <div className="p-4 bg-card border border-border/60 rounded-[1.5rem] shadow-sm hover:shadow-lg hover:border-primary/30 transition-all h-full flex flex-col group relative overflow-hidden">
                      {/* Gradient aksen halus di sudut */}
                      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <h4 className="font-bold text-sm mb-1.5 line-clamp-2 text-foreground group-hover:text-primary transition-colors relative z-10">
                        {note.title || "Tanpa Judul"}
                      </h4>
                      <div 
                        className="text-xs text-muted-foreground line-clamp-3 mb-3 relative z-10"
                        dangerouslySetInnerHTML={{ __html: note.content.replace(/<[^>]+>/g, ' ') }} 
                      />
                      {note.tags && note.tags.length > 0 && (
                        <div className="mt-auto flex flex-wrap gap-1.5 relative z-10">
                          <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider rounded-lg truncate max-w-full">
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
    </div>
  );
}