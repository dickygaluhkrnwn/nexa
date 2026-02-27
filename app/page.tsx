"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { 
  BrainCircuit, LogIn, Loader2, Plus, 
  FileText, ListTodo, LockKeyhole, ArrowRight, 
  Circle, CalendarClock, Mail, Lock, User as UserIcon
} from "lucide-react";
import { useEffect, useState } from "react";
import { getUserNotes, NoteData } from "@/lib/notes-service";
import Link from "next/link";

type DashboardNote = NoteData & { id: string; isCompleted?: boolean; isHidden?: boolean };

export default function Home() {
  const { user, loading, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [notes, setNotes] = useState<DashboardNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // State untuk Form Login/Register
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const fetchNotes = async () => {
    if (!user) return;
    try {
      const data = await getUserNotes(user.uid);
      setNotes(data as DashboardNote[]);
    } catch (error) {
      console.error("Gagal mengambil catatan:", error);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user]);

  // Fungsi Submit Form (Login / Register)
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formPassword) return alert("Email dan Password wajib diisi!");
    if (isRegisterMode && !formName) return alert("Nama wajib diisi untuk mendaftar!");
    if (formPassword.length < 6) return alert("Password minimal 6 karakter!");

    setAuthLoading(true);
    try {
      if (isRegisterMode) {
        await registerWithEmail(formName, formEmail, formPassword);
      } else {
        await loginWithEmail(formEmail, formPassword);
      }
    } catch (error: any) {
      // Menangani pesan error standar Firebase
      if (error.code === 'auth/email-already-in-use') alert("Email ini sudah terdaftar!");
      else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') alert("Email atau Password salah!");
      else alert("Terjadi kesalahan: " + error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      alert("Gagal login dengan Google.");
    } finally {
      setAuthLoading(false);
    }
  };

  // 1. Tampilan saat mengecek status login
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Memuat Nexa...</p>
      </div>
    );
  }

  // 2. Tampilan Landing Page (Belum Login) dengan Form Auth
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 pb-12 pt-6">
        
        {/* Logo & Headline */}
        <div className="text-center mb-8 animate-in slide-in-from-top-4 duration-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Nexa <span className="text-primary text-xl relative -top-2">AI</span>
          </h1>
          <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
            Catat, Rencanakan, dan Selesaikan tugas harianmu dengan cerdas.
          </p>
        </div>

        {/* Card Form Authentication */}
        <div className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-xl animate-in zoom-in-95 duration-500">
          <h2 className="text-xl font-bold mb-6 text-center">
            {isRegisterMode ? "Buat Akun Baru" : "Masuk ke Akunmu"}
          </h2>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Nama Panggilan" 
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="email" 
                placeholder="Email aktif" 
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="password" 
                placeholder="Password (min. 6 karakter)" 
                value={formPassword}
                onChange={e => setFormPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
              />
            </div>

            <Button type="submit" disabled={authLoading} className="w-full rounded-xl py-6 text-base font-bold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-md border-0">
              {authLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegisterMode ? "Daftar Sekarang" : "Masuk")}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60"></div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Atau</span>
            <div className="h-px flex-1 bg-border/60"></div>
          </div>

          <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={authLoading} className="w-full rounded-xl py-6 bg-card border-border hover:bg-muted">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Lanjutkan dengan Google
          </Button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegisterMode ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <button 
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="font-bold text-primary hover:underline outline-none"
            >
              {isRegisterMode ? "Masuk di sini" : "Daftar gratis"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // Pengolahan Data untuk Dashboard
  const visibleNotes = notes.filter((note) => !note.isHidden);
  const pendingTodos = visibleNotes.filter((note) => note.isTodo && !note.isCompleted);
  const recentNotes = visibleNotes.filter((note) => !note.isTodo).slice(0, 4);

  // 3. Tampilan Dashboard Utama
  return (
    <div className="p-4 pb-24 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto">
      
      {/* Header & Greeting */}
      <div className="flex items-center justify-between mt-2">
        <div>
          <p className="text-sm text-muted-foreground font-medium">Selamat datang kembali,</p>
          <h2 className="text-2xl font-bold">{user.displayName || "Pengguna"} 👋</h2>
        </div>
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 shadow-sm">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'User'}`} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {loadingNotes ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
        </div>
      ) : (
        <>
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

          {/* Prioritas Tugas Hari Ini */}
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