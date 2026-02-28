"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Plus, FileText, ListTodo, LockKeyhole, 
  ArrowRight, Circle, CalendarClock, User as UserIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { getUserNotes, NoteData } from "@/lib/notes-service";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; // <-- Import Global Modal Hook

type DashboardNote = NoteData & { id: string; isCompleted?: boolean; isHidden?: boolean };

export default function Home() {
  const { user, loading, loginAsGuest } = useAuth();
  const { showAlert } = useModal(); // <-- Panggil fungsi Modal Global
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

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

  // Loading Screen saat menyiapkan sesi Tamu
  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Menyiapkan ruang kerjamu...</p>
      </div>
    );
  }

  // Pengolahan Data untuk Dashboard
  const visibleNotes = notes.filter((note) => !note.isHidden);
  const pendingTodos = visibleNotes.filter((note) => note.isTodo && !note.isCompleted);
  const recentNotes = visibleNotes.filter((note) => !note.isTodo).slice(0, 4);

  return (
    <div className="p-4 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto relative">
      
      {/* Header & Greeting */}
      <div className="flex items-center justify-between mt-2">
        <div>
          <p className="text-sm text-muted-foreground font-medium">Selamat datang kembali,</p>
          <h2 className="text-2xl font-bold">{user.isAnonymous ? "Tamu Nexa" : (user.displayName || "Pengguna")} 👋</h2>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm bg-muted flex items-center justify-center">
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
      </div>

      {loadingNotes ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      ) : (
        <>
          {/* Peringatan Cerdas untuk Pengguna Tamu */}
          {user.isAnonymous && (
            <div className="bg-orange-500/10 border border-orange-500/20 p-3 rounded-xl flex items-start gap-3 relative overflow-hidden group">
              <span className="text-orange-500 mt-0.5 z-10">⚠️</span>
              <div className="z-10">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-0.5">Mode Tamu Aktif</p>
                <p className="text-[11px] text-orange-600/80 dark:text-orange-400/80 leading-relaxed font-medium">
                  Catatanmu belum aman. Daftar sekarang untuk mengunci data.
                </p>
                <Link href="/profile" className="text-[11px] font-bold text-orange-600 dark:text-orange-400 underline mt-1 inline-block">
                  Daftar / Masuk Akun
                </Link>
              </div>
            </div>
          )}

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex flex-col justify-between h-28">
              <FileText className="w-6 h-6 text-blue-500 mb-2" />
              <div>
                <p className="text-2xl font-bold text-foreground">{visibleNotes.filter(n => !n.isTodo).length}</p>
                <p className="text-xs font-medium text-muted-foreground">Catatan Tersimpan</p>
              </div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex flex-col justify-between h-28">
              <ListTodo className="w-6 h-6 text-orange-500 mb-2" />
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingTodos.length}</p>
                <p className="text-xs font-medium text-muted-foreground">Tugas Tertunda</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Link href="/create" className="flex-1">
              <Button variant="outline" className="w-full rounded-xl bg-card border-border hover:bg-primary/5">
                <Plus className="w-4 h-4 mr-2 text-primary" /> Catatan Baru
              </Button>
            </Link>
            <Link href="/notes" className="flex-1">
              <Button variant="outline" className="w-full rounded-xl bg-card border-border hover:bg-purple-500/5 text-purple-600 dark:text-purple-400">
                <LockKeyhole className="w-4 h-4 mr-2" /> Brankas
              </Button>
            </Link>
          </div>

          {/* Prioritas Tugas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-orange-500" /> Prioritas Tugas
              </h3>
              <Link href="/todo" className="text-xs font-medium text-primary hover:underline flex items-center">
                Lihat Semua <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>
            
            {pendingTodos.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">Mantap! Semua tugas sudah selesai 🎉</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTodos.slice(0, 3).map((todo) => (
                  <Link key={todo.id} href={`/edit/${todo.id}`} className="block">
                    <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all group">
                      <Circle className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{todo.title || "Tanpa Judul"}</h4>
                        {todo.dueDate && (
                          <p className="text-[10px] text-orange-500 font-medium mt-0.5">Tenggat: {todo.dueDate}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Catatan Terbaru */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" /> Catatan Terbaru
              </h3>
              <Link href="/notes" className="text-xs font-medium text-primary hover:underline flex items-center">
                Semua Catatan <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>

            {recentNotes.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-border bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">Belum ada catatan yang ditulis.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recentNotes.map((note) => (
                  <Link key={note.id} href={`/edit/${note.id}`} className="block h-full">
                    <div className="p-3 bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all h-full flex flex-col group">
                      <h4 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {note.title || "Tanpa Judul"}
                      </h4>
                      <div 
                        className="text-[11px] text-muted-foreground line-clamp-3 mb-2"
                        dangerouslySetInnerHTML={{ __html: note.content.replace(/<[^>]+>/g, ' ') }} 
                      />
                      {note.tags && note.tags.length > 0 && (
                        <div className="mt-auto flex flex-wrap gap-1">
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] rounded font-medium truncate max-w-full">
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