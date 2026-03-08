"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getNote, NoteData } from "@/lib/notes-service";
import { Loader2, Tag as TagIcon, BrainCircuit, ShieldAlert, Sparkles, ArrowRight } from "lucide-react";
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
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
        <p className="text-muted-foreground animate-pulse font-bold tracking-widest uppercase text-xs">Memuat Dokumen...</p>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-destructive/5 rounded-full blur-3xl pointer-events-none" />
        <div className="w-24 h-24 bg-destructive/10 border border-destructive/20 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-destructive/20 relative z-10 rotate-12">
          <ShieldAlert className="w-12 h-12 text-destructive" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black mb-3 relative z-10 tracking-tight">Oops! Akses Ditolak</h1>
        <p className="text-muted-foreground mb-10 max-w-md leading-relaxed relative z-10 text-lg">{error}</p>
        <Button asChild className="rounded-xl px-8 h-12 shadow-xl font-bold text-base relative z-10">
          <Link href="/">Kembali ke Beranda Nexa</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] dark:bg-[#0a0a0a] flex flex-col relative selection:bg-primary/20">
      
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-40 dark:opacity-20"
        style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />
      
      <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none z-0" />

      {/* Navbar Publik Premium */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between h-16 px-4 md:px-8 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <BrainCircuit className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight hidden sm:block">Nexa</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="hidden sm:flex rounded-xl font-semibold text-muted-foreground hover:text-foreground">
              <Link href="/">Masuk</Link>
            </Button>
            <Button asChild className="rounded-xl font-bold shadow-md bg-primary hover:bg-primary/90 text-primary-foreground h-9 px-5">
              <Link href="/create">Buat Catatanmu</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Konten Catatan ala Notion/Medium */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-12 relative z-10">
        
        <article className="bg-card border border-border shadow-xl md:shadow-2xl md:shadow-primary/5 rounded-[2rem] md:rounded-[3rem] p-6 sm:p-10 md:p-16 animate-in fade-in slide-in-from-bottom-8 duration-700 mt-4 md:mt-8">
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-foreground leading-[1.15]">
            {note.title || "Tanpa Judul"}
          </h1>

          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-10">
              {note.tags.map((tag, idx) => (
                <span key={idx} className="px-3.5 py-1.5 bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5">
                  <TagIcon className="w-3.5 h-3.5" /> {tag}
                </span>
              ))}
            </div>
          )}

          <div className="w-full h-px bg-border/60 mb-10" />

          {/* Area Render Teks HTML dengan Tipografi Premium */}
          <div 
            className="prose prose-base md:prose-lg lg:prose-xl dark:prose-invert max-w-none text-foreground/90 leading-relaxed marker:text-primary 
            prose-headings:font-bold prose-headings:tracking-tight prose-a:text-primary prose-a:no-underline hover:prose-a:underline 
            prose-p:mb-6 prose-ul:mb-6 prose-ol:mb-6 prose-li:my-2 prose-strong:font-extrabold
            prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/30 prose-blockquote:py-2 prose-blockquote:px-5 prose-blockquote:rounded-r-2xl prose-blockquote:italic prose-blockquote:text-muted-foreground
            prose-pre:bg-[#1e1e1e] prose-pre:text-[#d4d4d4] prose-pre:p-5 prose-pre:rounded-2xl prose-pre:border prose-pre:border-border/50 prose-pre:shadow-inner
            prose-code:bg-muted prose-code:text-foreground prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.9em] prose-code:font-medium
            prose-img:rounded-2xl prose-img:shadow-md"
            dangerouslySetInnerHTML={{ __html: note.content }} 
          />
        </article>

        {/* CTA Footer Bawah Artikel */}
        <div className="mt-12 mb-8 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-rose-500/10 border border-primary/20 rounded-[2rem] p-8 md:p-10 flex flex-col items-center text-center animate-in fade-in duration-1000 delay-500">
          <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center shadow-md mb-5 rotate-3">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Suka dengan tampilan ini?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg leading-relaxed text-sm md:text-base">
            Catatan ini dibuat dan dibagikan menggunakan Nexa. Bergabunglah sekarang untuk mengorganisir ide dan tugasmu dengan asisten AI cerdas.
          </p>
          <Button asChild className="rounded-xl h-12 px-8 font-bold text-base shadow-xl bg-foreground text-background hover:bg-foreground/90 hover:scale-105 transition-all">
            <Link href="/">Buat Ruang Kerjamu <ArrowRight className="w-5 h-5 ml-2" /></Link>
          </Button>
        </div>

      </main>
    </div>
  );
}