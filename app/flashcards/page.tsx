"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, NoteData } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Brain, Layers, Sparkles, BookOpen, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGemini } from "@/hooks/use-gemini";
import { FlashcardViewer, Flashcard } from "@/components/flashcards/flashcard-viewer";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";

export default function FlashcardsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { generateFlashcards, isAiLoading } = useGemini();
  const { showAlert } = useModal();

  const [notes, setNotes] = useState<(NoteData & { id: string })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedNote, setSelectedNote] = useState<string | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isStudying, setIsStudying] = useState(false);

  useEffect(() => {
    const fetchNotes = async () => {
      if (!user) return;
      try {
        const data = await getUserNotes(user.uid);
        // Hanya ambil catatan biasa yang isi kontennya lumayan panjang (>20 huruf)
        const validNotes = data.filter((n: any) => !n.isTodo && !n.isHidden && n.content && n.content.replace(/<[^>]+>/g, '').length > 20);
        setNotes(validNotes as any);
      } catch (error) {
        console.error("Gagal mengambil catatan:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchNotes();
  }, [user]);

  const handleStartStudy = async (noteId: string, content: string) => {
    setSelectedNote(noteId);
    try {
       const plainText = content.replace(/<[^>]+>/g, ' ').trim();
       const generatedCards = await generateFlashcards(plainText);
       
       if (generatedCards && generatedCards.length > 0) {
          setFlashcards(generatedCards);
          setIsStudying(true);
       } else {
          showAlert("Gagal", "AI tidak dapat mengekstrak konsep penting untuk dijadikan kuis dari catatan ini. Pastikan catatan cukup informatif.");
          setSelectedNote(null);
       }
    } catch (error) {
       console.error(error);
       setSelectedNote(null);
    }
  };

  const handleStudyComplete = () => {
     // Karena FlashcardViewer sudah punya layar "Selesai", di sini hanya membersihkan state
     setIsStudying(false);
     setFlashcards([]);
     setSelectedNote(null);
  };

  if (!user) return <div className="flex justify-center items-center min-h-[60vh]"><Button variant="link" onClick={() => router.push('/')}>Kembali ke Home</Button></div>;
  if (isLoading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-background relative pb-24">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-500/5 via-background to-background pointer-events-none z-0" />

      {/* Header Dinamis */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center h-16 px-4 md:px-8 max-w-[1400px] mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors group-hover:-translate-x-1 duration-300">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="font-bold text-base md:text-lg tracking-tight">AI Flashcards</span>
          </Link>
          <div className="ml-auto hidden md:flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Mesin Pembelajaran Pintar</span>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1400px] mx-auto p-4 md:p-8 pt-6 md:pt-10 relative z-10">
        
        {/* TAMPILAN 1: SESI BELAJAR BERLANGSUNG */}
        {isStudying && flashcards.length > 0 ? (
           <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 py-8 flex flex-col items-center max-w-5xl mx-auto">
             <FlashcardViewer cards={flashcards} onComplete={handleStudyComplete} />
             
             <Button variant="ghost" onClick={() => setIsStudying(false)} className="mt-12 text-muted-foreground font-bold hover:text-destructive hover:bg-destructive/10 rounded-xl px-8 h-12 transition-colors">
               Akhiri Sesi Paksa
             </Button>
           </div>
        ) : (
           /* TAMPILAN 2: PILIH MATERI CATATAN (Bento Grid) */
           <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
              
              {/* Premium Hero Banner */}
              <div className="bg-gradient-to-r from-indigo-500/10 via-purple-600/10 to-transparent border border-indigo-500/20 p-8 md:p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center md:justify-between gap-8 text-center md:text-left shadow-sm">
                <div className="flex-1 max-w-2xl space-y-4">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.5rem] flex items-center justify-center mx-auto md:mx-0 shadow-lg shadow-indigo-500/20 mb-6">
                     <Layers className="w-8 h-8 md:w-10 md:h-10 text-white" />
                  </div>
                  <h1 className="font-black text-3xl md:text-5xl text-foreground tracking-tight leading-tight">Pilih Materi Belajar</h1>
                  <p className="text-sm md:text-lg text-muted-foreground leading-relaxed font-medium">
                     Pilih dokumen catatanmu di bawah. AI akan membaca isinya dan menyulapnya menjadi tumpukan kartu tanya-jawab interaktif (<em className="text-foreground">Flashcards</em>) secara instan! ✨
                  </p>
                </div>
              </div>

              {/* Grid Catatan */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <BookOpen className="w-5 h-5 text-muted-foreground" />
                  <h2 className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground">Kumpulan Dokumen</h2>
                </div>

                {notes.length === 0 ? (
                   <div className="text-center p-12 border border-dashed border-border/60 rounded-[2rem] bg-muted/10">
                     <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                     <p className="text-base font-bold text-foreground mb-2">Belum Ada Materi</p>
                     <p className="text-sm font-medium text-muted-foreground max-w-sm mx-auto">Tidak ada catatan yang cukup panjang untuk dipelajari. Buat catatan detail agar AI bisa membuat kuis.</p>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                     {notes.map(note => {
                       const isGeneratingThis = isAiLoading && selectedNote === note.id;
                       return (
                         <div 
                           key={note.id} 
                           className={cn(
                             "p-5 md:p-6 bg-card border rounded-[1.5rem] flex flex-col gap-5 transition-all duration-300 group",
                             isGeneratingThis ? "border-primary shadow-lg ring-4 ring-primary/10" : "border-border/60 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
                           )}
                         >
                            <div className="flex-1 min-w-0">
                               <h3 className="font-extrabold text-base md:text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight mb-2">{note.title || "Tanpa Judul"}</h3>
                               <p className="text-xs md:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                 {note.content.replace(/<[^>]+>/g, ' ')}
                               </p>
                            </div>
                            
                            <Button 
                              onClick={() => handleStartStudy(note.id, note.content)}
                              disabled={isAiLoading}
                              className={cn(
                                "w-full rounded-xl font-bold h-12 text-sm shadow-md transition-all",
                                isGeneratingThis ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground"
                              )}
                            >
                              {isGeneratingThis ? (
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              ) : (
                                <Brain className="w-5 h-5 mr-2" />
                              )}
                              {isGeneratingThis ? "Meracik Kuis..." : "Mulai Kuis AI"}
                            </Button>
                         </div>
                       );
                     })}
                   </div>
                )}
              </div>
           </div>
        )}
      </main>
    </div>
  );
}