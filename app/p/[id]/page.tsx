"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getNote, NoteData } from "@/lib/notes-service";
import { Loader2, Tag as TagIcon, BrainCircuit, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PublicNotePage() {
  const params = useParams();
  const router = useRouter();
  const noteId = params.id as string;
  
  const [note, setNote] = useState<NoteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicNote = async () => {
      if (!noteId) return;
      try {
        const data = await getNote(noteId);
        
        // Proteksi: Jika catatan tidak ada ATAU disembunyikan di Brankas (isHidden)
        if (!data) {
          setError("Catatan tidak ditemukan atau telah dihapus.");
        } else if ((data as any).isHidden) {
          setError("Akses Ditolak. Catatan ini dikunci di dalam Brankas Rahasia pemiliknya.");
        } else {
          setNote(data as NoteData);
        }
      } catch (err) {
        console.error("Gagal memuat catatan publik:", err);
        setError("Gagal memuat catatan. Pastikan tautan benar atau periksa koneksi internetmu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicNote();
  }, [noteId]);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse font-medium">Memuat catatan...</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-background">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Oops! Tidak Dapat Diakses</h1>
        <p className="text-muted-foreground mb-8 max-w-sm leading-relaxed">{error}</p>
        <Button asChild className="rounded-xl px-8 shadow-md">
          <Link href="/">Kembali ke Beranda Nexa</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar Publik */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between h-16 px-4 max-w-3xl mx-auto">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Nexa</span>
          </Link>
          <Button asChild variant="outline" size="sm" className="rounded-full text-xs font-bold border-primary text-primary hover:bg-primary/10">
            <Link href="/">Buat Catatanmu</Link>
          </Button>
        </div>
      </header>

      {/* Konten Catatan */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-6 md:py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 text-foreground leading-tight">
          {note.title || "Tanpa Judul"}
        </h1>

        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {note.tags.map((tag, idx) => (
              <span key={idx} className="px-3 py-1 bg-muted text-muted-foreground text-xs font-medium rounded-md flex items-center gap-1.5">
                <TagIcon className="w-3 h-3" /> {tag}
              </span>
            ))}
          </div>
        )}

        <div className="w-full h-px bg-border/60 mb-8" />

        {/* Area Render Teks HTML. 
          Kita gunakan custom CSS selector ([&>...]) agar tag HTML dari Tiptap/AI tampil rapi.
        */}
        <article 
          className="text-foreground/90 leading-relaxed text-base md:text-lg 
            [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:mb-4 [&>h1]:mt-8
            [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mb-3 [&>h2]:mt-6
            [&>h3]:text-xl [&>h3]:font-bold [&>h3]:mb-3 [&>h3]:mt-6
            [&>p]:mb-4 [&>p]:min-h-[1rem]
            [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:mb-4 [&>ul>li]:mb-1
            [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:mb-4 [&>ol>li]:mb-1
            [&>strong]:font-bold [&>em]:italic 
            [&>blockquote]:border-l-4 [&>blockquote]:border-primary/50 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:mb-4
            [&>pre]:bg-muted [&>pre]:p-4 [&>pre]:rounded-xl [&>pre]:overflow-x-auto [&>pre]:mb-4
            [&>code]:bg-muted [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded-md [&>code]:text-sm"
          dangerouslySetInnerHTML={{ __html: note.content }} 
        />
      </main>

      {/* Footer Minimalis */}
      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/50 mt-12 bg-muted/20">
        <p>Catatan ini dibagikan secara publik menggunakan <Link href="/" className="font-bold text-primary hover:underline">Nexa AI</Link>.</p>
      </footer>
    </div>
  );
}