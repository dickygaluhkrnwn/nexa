"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, NoteData } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Brain, Layers, Sparkles, BookOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGemini } from "@/hooks/use-gemini";
import { FlashcardViewer, Flashcard } from "@/components/flashcards/flashcard-viewer";
import { useModal } from "@/hooks/use-modal";

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
          showAlert("Gagal", "AI tidak dapat mengekstrak konsep penting untuk dijadikan kuis dari catatan ini.");
          setSelectedNote(null);
       }
    } catch (error) {
       console.error(error);
       setSelectedNote(null);
    }
  };

  const handleStudyComplete = () => {
     showAlert("Sesi Selesai! 🎉", "Luar biasa! Kamu telah menyelesaikan sesi pembelajaran flashcard ini. Terus tingkatkan pengetahauanmu!");
     setIsStudying(false);
     setFlashcards([]);
     setSelectedNote(null);
  };

  if (!user) return <div className="flex justify-center items-center min-h-[60vh]"><Button variant="link" onClick={() => router.push('/')}>Kembali ke Home</Button></div>;
  if (isLoading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-lg mx-auto relative pb-24">
      
      {/* Header Statis */}
      <div className="p-4 flex items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-9 w-9 hover:bg-muted">
            <Link href="/"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-base font-bold flex items-center gap-1.5 leading-none">
              <Brain className="w-4 h-4 text-primary" /> AI Flashcards
            </h1>
            <p className="text-[10px] font-medium text-muted-foreground mt-1 uppercase tracking-wider">Mesin Pembelajaran Pintar</p>
          </div>
        </div>
      </div>

      <div className="p-5 flex-1">
        {/* TAMPILAN 1: SESI BELAJAR BERLANGSUNG */}
        {isStudying && flashcards.length > 0 ? (
           <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 py-8">
             <FlashcardViewer cards={flashcards} onComplete={handleStudyComplete} />
             
             <Button variant="ghost" onClick={() => setIsStudying(false)} className="w-full mt-12 text-muted-foreground font-bold hover:text-destructive">
               Akhiri Sesi Paksa
             </Button>
           </div>
        ) : (
           /* TAMPILAN 2: PILIH MATERI CATATAN */
           <div className="space-y-6 animate-in fade-in duration-500">
              
              <div className="bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/20 p-6 rounded-[2rem] text-center shadow-sm">
                <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                   <Layers className="w-7 h-7 text-primary" />
                </div>
                <h2 className="font-extrabold text-foreground mb-2 text-lg">Pilih Materi Belajar</h2>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px] mx-auto font-medium">
                   Pilih catatanmu di bawah. AI akan membacanya dan menyulapnya menjadi tumpukan kartu tanya-jawab (*Flashcard*) interaktif secara instan! ✨
                </p>
              </div>

              <div className="space-y-3">
                {notes.length === 0 ? (
                   <div className="text-center p-8 border border-dashed rounded-3xl bg-muted/20">
                     <BookOpen className="w-8 h-8 text-muted-foreground/50 mx-auto mb-3" />
                     <p className="text-sm font-medium text-muted-foreground">Tidak ada catatan yang cukup panjang untuk dipelajari.</p>
                   </div>
                ) : (
                   notes.map(note => (
                     <div key={note.id} className="p-4 bg-card border border-border/80 rounded-[1.5rem] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-primary/40 hover:shadow-md transition-all">
                        <div className="flex-1 min-w-0">
                           <h3 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">{note.title || "Tanpa Judul"}</h3>
                           <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                             {note.content.replace(/<[^>]+>/g, ' ')}
                           </p>
                        </div>
                        <Button 
                          onClick={() => handleStartStudy(note.id, note.content)}
                          disabled={isAiLoading && selectedNote === note.id}
                          className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white shrink-0 w-full md:w-auto h-11"
                        >
                          {isAiLoading && selectedNote === note.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          {isAiLoading && selectedNote === note.id ? "Meracik Kuis..." : "Mulai Kuis"}
                        </Button>
                     </div>
                   ))
                )}
              </div>
           </div>
        )}
      </div>
    </div>
  );
}