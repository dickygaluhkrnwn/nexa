"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getNote, updateNote, deleteNote, getUserNotes } from "@/lib/notes-service";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Save, ArrowLeft,
  Tag as TagIcon, Lock, Unlock, 
  Sparkles, X, Download, FileText, File, Printer,
  Camera, Image as ImageIcon,
  Share2, Trash2, Network, FolderTree, Brain
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 
import { useGemini } from "@/hooks/use-gemini"; 
import { useNoteForm } from "@/hooks/use-note-form";
import { useExport } from "@/hooks/use-export";
import { useNoteAi } from "@/hooks/use-note-ai"; 

import { AiToolbar } from "@/components/notes/ai-toolbar";
import { ChatOverlay } from "@/components/notes/chat-overlay";
import { MindMapViewer } from "@/components/notes/mindmap-viewer";
import { FlashcardModal } from "@/components/flashcards/flashcard-modal"; 

export default function EditNotePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;
  
  const { showAlert, showConfirm } = useModal(); 
  const { callAI } = useGemini(); 
  
  // 1. STATE FORM
  const {
    title, setTitle, content, setContent, tags, setTags,
    tagInput, setTagInput, isHidden, setIsHidden,
    parentId, setParentId,
    editorKey, forceRenderEditor, handleKeyDownTag, removeTag
  } = useNoteForm();

  // 2. STATE EKSPOR
  const {
    showExportMenu, setShowExportMenu,
    handleExportTXT, handleExportDOC, handleExportPDF
  } = useExport(title, content);

  // 3. STATE MIND MAP & FLASHCARDS
  const [mindMapHistory, setMindMapHistory] = useState<string[]>([]);
  const [showMindMap, setShowMindMap] = useState(false); 
  
  const [flashcardsHistory, setFlashcardsHistory] = useState<any[][]>([]); 
  const [showFlashcards, setShowFlashcards] = useState(false);

  // 4. STATE AI & HARDWARE
  const {
    isSummarizing, isGeneratingTags, isFormatting, isGeneratingMindMap, isGeneratingFlashcards,
    isScanning, isAnalyzingVoice, isRecording, aiSummary, setAiSummary,
    handleAutoFormat, handleSummarize, handleGenerateTags, handleGenerateMindMap, handleGenerateFlashcards,
    handleImageUpload, handleVoiceRecord
  } = useNoteAi({
    title, setTitle, content, setContent, tags, setTags, forceRenderEditor,
    mindMapHistory, setMindMapHistory, setShowMindMap,
    flashcardsHistory, setFlashcardsHistory, setShowFlashcards 
  });

  // State Halaman
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [availableNotes, setAvailableNotes] = useState<{ id: string; title: string }[]>([]);

  // Referensi Input File
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Fetch Data Catatan
  useEffect(() => {
    const fetchNote = async () => {
      if (!user || !noteId) return;
      try {
        const noteData = await getNote(noteId);
        if (noteData && noteData.userId === user.uid) {
          setTitle(noteData.title);
          setContent(noteData.content);
          setTags(noteData.tags || []);
          setIsHidden((noteData as any).isHidden || false);
          setParentId((noteData as any).parentId || null);
          
          const existingMindMap = (noteData as any).mindmapCode;
          if (Array.isArray(existingMindMap)) setMindMapHistory(existingMindMap);
          else if (typeof existingMindMap === 'string') setMindMapHistory([existingMindMap]);
          else setMindMapHistory([]);

          // FIX: PARSING DATA FLASHCARD DARI FIRESTORE (String -> Array of Arrays)
          const existingFlashcards = (noteData as any).flashcards;
          if (existingFlashcards) {
             try {
                // Jika data yang ditarik berbentuk string (karena kita serialize saat simpan)
                if (typeof existingFlashcards === 'string') {
                   const parsed = JSON.parse(existingFlashcards);
                   setFlashcardsHistory(Array.isArray(parsed) ? parsed : []);
                } 
                // Fallback jika suatu saat ada data lama berbentuk array
                else if (Array.isArray(existingFlashcards)) {
                   setFlashcardsHistory(existingFlashcards);
                }
             } catch (e) {
                console.error("Gagal mem-parsing histori flashcard", e);
                setFlashcardsHistory([]);
             }
          } else {
            setFlashcardsHistory([]);
          }
          
        } else {
          showAlert("Akses Ditolak", "Catatan tidak ditemukan atau kamu tidak memiliki akses.");
          router.push("/");
        }
      } catch (error) {
        console.error("Gagal memuat catatan:", error);
        showAlert("Gagal", "Terjadi kesalahan saat memuat catatan.");
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };
    fetchNote();
  }, [user, noteId, router, showAlert, setTitle, setContent, setTags, setIsHidden, setParentId]); 

  // Fetch Catatan untuk Linking
  useEffect(() => {
    if (user && noteId) {
      getUserNotes(user.uid).then(notes => {
        setAvailableNotes(notes.filter((n: any) => n.id !== noteId).map((n: any) => ({ id: n.id, title: n.title || "Tanpa Judul" })));
      }).catch(err => console.error("Gagal memuat catatan untuk linking", err));
    }
  }, [user, noteId]);

  if (!user) return <div className="flex justify-center items-center min-h-[60vh]"><Button variant="link" onClick={() => router.push('/')}>Kembali ke Home</Button></div>;
  if (isLoading) return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const handleShare = async () => {
    if (isHidden) return showAlert("Tidak Bisa Dibagikan", "Catatan ini berstatus 'Brankas'. Ubah menjadi 'Catatan Publik' terlebih dahulu.");
    
    if (title.trim() || content !== '<p></p>') {
      setIsSaving(true);
      try { 
        // FIX: Serialize Flashcard History saat Auto-Save
        const serializedFlashcards = JSON.stringify(flashcardsHistory);
        await updateNote(noteId, { title: title || "Tanpa Judul", content, tags, isHidden, parentId, flashcards: serializedFlashcards } as any); 
      } 
      catch (e) { console.error("Auto-save sebelum share gagal", e); } 
      finally { setIsSaving(false); }
    }

    const url = `${window.location.origin}/p/${noteId}`;
    try {
      await navigator.clipboard.writeText(url);
      showAlert("Tautan Disalin! 🔗", "Tautan catatan publik berhasil disalin ke clipboard.");
    } catch (err) {
      const textArea = document.createElement("textarea"); textArea.value = url; document.body.appendChild(textArea); textArea.select();
      try { document.execCommand('copy'); showAlert("Tautan Disalin! 🔗", "Tautan catatan publik berhasil disalin ke clipboard."); } 
      catch (err) { showAlert("Gagal", "Gagal menyalin tautan."); }
      document.body.removeChild(textArea);
    }
  };

  const handleDelete = () => {
    showConfirm("Hapus Catatan?", "Apakah kamu yakin ingin menghapus catatan ini selamanya?", async () => {
      try { await deleteNote(noteId); router.push("/notes"); } 
      catch (error) { showAlert("Gagal", "Terjadi kesalahan saat menghapus catatan."); }
    });
  };

  const handleUpdate = async () => {
    const plainText = content.replace(/<[^>]+>/g, ' ').trim();
    if (!title.trim() && !plainText) return; 
    
    setIsSaving(true);
    let finalTags = [...tags];

    try {
      if (finalTags.length === 0 && (title.trim() || plainText)) {
        try {
          const result = await callAI({ action: "auto-tag", content: `Judul: ${title}\n\nIsi: ${plainText}` });
          if (result) finalTags = result.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean);
        } catch (e: any) { console.error("Auto-tagging gagal...", e); }
      }

      // FIX: SERIALIZE FLASHCARDS MENJADI STRING AGAR FIRESTORE TIDAK ERROR
      const serializedFlashcards = JSON.stringify(flashcardsHistory);

      await updateNote(noteId, { 
        title: title || "Tanpa Judul", 
        content, 
        tags: finalTags, 
        isHidden, 
        mindmapCode: mindMapHistory,
        parentId: parentId, 
        flashcards: serializedFlashcards // <-- SIMPAN VERSI STRING JSON
      } as any);
      router.push("/notes"); 
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      showAlert("Gagal Menyimpan", "Terjadi kesalahan saat menyimpan perubahan.");
      setIsSaving(false);
    }
  };

  const plainTextLength = content.replace(/<[^>]+>/g, '').trim().length;

  return (
    <>
      <div className="pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto relative">
        
        {/* Header Statis */}
        <div className="p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <Link href="/notes" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Edit Catatan</span>
          </div>

          <div className="flex items-center gap-1">
            {flashcardsHistory.length > 0 && (
               <Button variant="ghost" size="icon" onClick={() => setShowFlashcards(true)} className="text-indigo-500 hover:bg-indigo-500/10 rounded-full transition-colors" title="Buka Sesi Kuis">
                 <Brain className="w-5 h-5" />
               </Button>
            )}
            {mindMapHistory.length > 0 && (
               <Button variant="ghost" size="icon" onClick={() => setShowMindMap(true)} className="text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors" title="Buka Peta Konsep">
                 <Network className="w-5 h-5" />
               </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleShare} className="text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors" title="Bagikan Link Publik">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 rounded-full transition-colors" title="Hapus Catatan">
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="px-4 space-y-4 print:p-0">
          
          <div>
            <input type="text" placeholder="Judul Catatan..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-4xl font-extrabold tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/30 focus:ring-0 print:text-black print:p-0" />
          </div>

          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {tags.map((tag) => (
              <span key={tag} className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg flex items-center gap-1.5 animate-in zoom-in-95">
                <TagIcon className="w-3 h-3" /> {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </span>
            ))}
            <input type="text" placeholder={tags.length === 0 ? "Ketik tag lalu Enter..." : "+ Tambah tag..."} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleKeyDownTag} className="bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground focus:ring-0 min-w-[120px]" />
          </div>

          <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/50 print:hidden w-full md:w-fit">
            <FolderTree className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
            <select
              value={parentId || ""}
              onChange={(e) => setParentId(e.target.value || null)}
              className="bg-transparent text-sm text-foreground font-medium outline-none border-none focus:ring-0 cursor-pointer pr-8 py-1"
            >
              <option value="" className="bg-background">Catatan Utama (Bukan Sub-Catatan)</option>
              {availableNotes.map(n => (
                <option key={n.id} value={n.id} className="bg-background">Induk: {n.title}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 print:hidden">
            <Button variant={isHidden ? "default" : "outline"} size="sm" onClick={() => setIsHidden(!isHidden)} className={`rounded-xl transition-all ${isHidden ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600" : "bg-card text-muted-foreground hover:bg-purple-500/10 hover:text-purple-500 border-border"}`}>
              {isHidden ? <Lock className="w-4 h-4 mr-2 text-white" /> : <Unlock className="w-4 h-4 mr-2" />} 
              {isHidden ? "Masuk Brankas" : "Catatan Publik"}
            </Button>
            <div className="w-px h-6 bg-border mx-1 shrink-0"></div>
            <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageUpload} className="hidden" />
            <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleImageUpload} className="hidden" />
            <Button variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()} disabled={isScanning || isAnalyzingVoice} className="rounded-xl whitespace-nowrap bg-card text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 border-border">
              {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />} Kamera
            </Button>
            <Button variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()} disabled={isScanning || isAnalyzingVoice} className="rounded-xl whitespace-nowrap bg-card text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 border-border">
              {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />} Galeri
            </Button>
          </div>

          <AiToolbar 
            onOpenChat={() => setIsChatOpen(true)}
            onGenerateMindMap={handleGenerateMindMap}
            onAutoFormat={handleAutoFormat}
            onGenerateTags={handleGenerateTags}
            onSummarize={handleSummarize}
            onGenerateFlashcards={handleGenerateFlashcards} 
            isGeneratingMindMap={isGeneratingMindMap}
            isFormatting={isFormatting}
            isGeneratingTags={isGeneratingTags}
            isSummarizing={isSummarizing}
            isGeneratingFlashcards={isGeneratingFlashcards} 
            isContentEmpty={plainTextLength === 0}
            isTitleAndContentEmpty={!title.trim() && plainTextLength === 0}
            onVoiceRecord={handleVoiceRecord}
            isRecording={isRecording}
            isAnalyzingVoice={isAnalyzingVoice}
            onStopRecording={() => (window as any).stopNexaRecording && (window as any).stopNexaRecording()}
          />

          {aiSummary && (
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-purple-500/10 border border-purple-500/20 animate-in fade-in zoom-in-95 shadow-sm print:hidden">
              <button onClick={() => setAiSummary(null)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full"><X className="w-4 h-4"/></button>
              <div className="flex items-center gap-2 mb-3 text-purple-600 dark:text-purple-400 font-bold text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /><span>Ringkasan Cerdas AI</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">{aiSummary}</p>
            </div>
          )}

          <div className="pt-2 print:text-black">
            <TiptapEditor key={editorKey} content={content} onChange={setContent} availableNotes={availableNotes} />
          </div>
        </div>

        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 z-40 px-4 pointer-events-none print:hidden">
          <div className="max-w-2xl mx-auto flex items-center justify-between pointer-events-auto">
            <div className="relative">
              <Button variant="outline" onClick={() => setShowExportMenu(!showExportMenu)} className="rounded-full px-4 border-border bg-card/95 backdrop-blur shadow-xl hover:bg-muted">
                <Download className="w-4 h-4 mr-2" /> Unduh
              </Button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowExportMenu(false)}></div>
                  <div className="absolute left-0 bottom-full mb-3 w-48 bg-card border border-border rounded-2xl shadow-2xl z-50 p-1.5 animate-in fade-in slide-in-from-bottom-2">
                    <button onClick={handleExportPDF} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-muted font-medium text-red-500 transition-colors"><Printer className="w-4 h-4" /> Simpan PDF</button>
                    <button onClick={handleExportDOC} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-muted font-medium text-blue-500 transition-colors"><FileText className="w-4 h-4" /> Export DOC Word</button>
                    <button onClick={handleExportTXT} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-muted font-medium text-foreground transition-colors"><File className="w-4 h-4" /> Teks Biasa (TXT)</button>
                  </div>
                </>
              )}
            </div>

            <Button onClick={handleUpdate} disabled={isSaving || (!title.trim() && content === '<p></p>')} className="rounded-full px-6 py-6 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-xl text-white font-bold border-0">
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </div>
      </div>

      {showMindMap && mindMapHistory.length > 0 && (
        <MindMapViewer history={mindMapHistory} onClose={() => setShowMindMap(false)} />
      )}

      {showFlashcards && flashcardsHistory.length > 0 && (
        <FlashcardModal history={flashcardsHistory} onClose={() => setShowFlashcards(false)} />
      )}

      <ChatOverlay isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} noteTitle={title} noteContent={content} />
    </>
  );
}