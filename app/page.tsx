"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { BrainCircuit, LogIn, Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserNotes, deleteNote, NoteData } from "@/lib/notes-service";
import Link from "next/link";

export default function Home() {
  const { user, loading, loginWithGoogle } = useAuth();
  const [notes, setNotes] = useState<(NoteData & { id: string })[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const fetchNotes = async () => {
    if (!user) return;
    try {
      const data = await getUserNotes(user.uid);
      setNotes(data as (NoteData & { id: string })[]);
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

  const handleDelete = async (id: string) => {
    if (confirm("Apakah kamu yakin ingin menghapus catatan ini?")) {
      await deleteNote(id);
      fetchNotes(); // Refresh data setelah dihapus
    }
  };

  // Tampilan saat masih mengecek status login
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground animate-pulse">Memuat Nexa...</p>
      </div>
    );
  }

  // Tampilan jika user BELUM login (Landing Page)
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <div className="w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <BrainCircuit className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Selamat datang di <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">Nexa</span>
        </h1>
        <p className="text-muted-foreground mb-8 max-w-[280px]">
          Asisten AI cerdas untuk mencatat, merencanakan, dan mengelola tugas harianmu.
        </p>
        <Button 
          size="lg" 
          onClick={loginWithGoogle} 
          className="w-full max-w-xs rounded-full shadow-lg"
        >
          <LogIn className="w-4 h-4 mr-2" />
          Masuk dengan Google
        </Button>
      </div>
    );
  }

  // Tampilan jika user SUDAH login (Dashboard)
  return (
    <div className="p-4 pb-20 space-y-6">
      <div className="flex items-center justify-between mt-4">
        <div>
          <p className="text-sm text-muted-foreground">Halo,</p>
          <h2 className="text-2xl font-bold">{user.displayName} 👋</h2>
        </div>
        {/* Foto Profil */}
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Menampilkan Daftar Catatan */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Catatan Terbaru</h3>
          <Link href="/create">
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
              <Plus className="w-4 h-4 mr-1" /> Buat
            </Button>
          </Link>
        </div>

        {loadingNotes ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : notes.length === 0 ? (
          <div className="p-6 rounded-2xl bg-muted/50 border border-border/50 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              Belum ada catatan. Ayo buat catatan pertamamu!
            </p>
            <Link href="/create">
              <Button size="sm" className="rounded-full">
                <Plus className="w-4 h-4 mr-1"/> Buat Catatan
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {notes.map((note) => (
              <div key={note.id} className="relative group p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all flex flex-col h-48">
                <h4 className="font-bold text-lg mb-2 line-clamp-1">{note.title}</h4>
                {/* Render HTML dari Tiptap (dibatasi 3 baris) */}
                <div 
                  className="text-sm text-muted-foreground line-clamp-3 mb-4 prose prose-sm dark:prose-invert overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
                <div className="mt-auto flex justify-end gap-2">
                  <Link href={`/edit/${note.id}`}>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}