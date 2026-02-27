"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, Pencil, Search, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { getUserNotes, deleteNote, NoteData } from "@/lib/notes-service";
import Link from "next/link";

export default function NotesPage() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<(NoteData & { id: string })[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
    } else if (!authLoading) {
      setLoadingNotes(false);
    }
  }, [user, authLoading]);

  const handleDelete = async (id: string) => {
    if (confirm("Apakah kamu yakin ingin menghapus catatan ini?")) {
      await deleteNote(id);
      fetchNotes(); // Refresh data setelah dihapus
    }
  };

  if (authLoading || loadingNotes) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Silakan login untuk melihat catatan.</p>
        <Button asChild><Link href="/">Kembali ke Home</Link></Button>
      </div>
    );
  }

  // Logika pencarian berdasarkan judul, isi teks, atau tags
  const filteredNotes = notes.filter(note => {
    const query = searchQuery.toLowerCase();
    const titleMatch = note.title?.toLowerCase().includes(query);
    const contentMatch = note.content?.toLowerCase().includes(query);
    const tagsMatch = note.tags?.some(tag => tag.toLowerCase().includes(query));
    
    return titleMatch || contentMatch || tagsMatch;
  });

  return (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500">
      {/* Header Halaman */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-500/10 rounded-xl">
          <FileText className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Semua Catatan</h1>
          <p className="text-sm text-muted-foreground">Cari dan kelola semua ide kamu</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Cari judul, isi, atau tag..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
        />
      </div>

      {/* Daftar Catatan */}
      {notes.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-border rounded-2xl bg-muted/20">
          <p className="text-muted-foreground mb-4">Belum ada catatan.</p>
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/create">Buat Catatan Baru</Link>
          </Button>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Tidak ada catatan yang cocok dengan pencarian "{searchQuery}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filteredNotes.map((note) => (
            <div key={note.id} className="relative group p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all flex flex-col h-48">
              <h4 className="font-bold text-lg mb-2 line-clamp-1">{note.title}</h4>
              
              {/* Tampilkan tag jika ada */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {note.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-md font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

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
  );
}