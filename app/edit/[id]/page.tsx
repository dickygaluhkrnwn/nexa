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
  Share2, Trash2, Network, FolderTree, Brain,
  ChevronDown, Settings2, Hash, PanelRightClose, PanelRightOpen
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 
import { useGemini } from "@/hooks/use-gemini"; 
import { useNoteForm } from "@/hooks/use-note-form";
import { useExport } from "@/hooks/use-export";
import { useNoteAi } from "@/hooks/use-note-ai"; 
import { cn } from "@/lib/utils";

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
  const [showProperties, setShowProperties] = useState(true); // Toggle panel properti

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

          const existingFlashcards = (noteData as any).flashcards;
          if (existingFlashcards) {
             try {
                if (typeof existingFlashcards === 'string') {
                   const parsed = JSON.parse(existingFlashcards);
                   setFlashcardsHistory(Array.isArray(parsed) ? parsed : []);
                } 
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

      const serializedFlashcards = JSON.stringify(flashcardsHistory);

      await updateNote(noteId, { 
        title: title || "Tanpa Judul", 
        content, 
        tags: finalTags, 
        isHidden, 
        mindmapCode: mindMapHistory,
        parentId: parentId, 
        flashcards: serializedFlashcards 
      } as any);
      router.push("/notes"); 
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      showAlert("Gagal Menyimpan", "Terjadi kesalahan saat menyimpan perubahan.");
      setIsSaving(false);
    }
  };

  const plainTextLength = content.replace(/<[^>]+>/g, '').trim().length;

  // --- KOMPONEN CUSTOM DROPDOWN FOLDER ---
  const CustomFolderSelect = () => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (ref.current && !ref.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      if (isOpen) document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    return (
      <div className="relative w-full" ref={ref}>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between bg-background p-2 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <FolderTree className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground truncate font-medium">
              {parentId ? availableNotes.find(n => n.id === parentId)?.title || "Folder Utama" : "Folder Utama"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto custom-scrollbar p-1 animate-in fade-in zoom-in-95 duration-100">
            <div 
              onClick={() => { setParentId(null); setIsOpen(false); }}
              className={cn("px-3 py-2 text-sm rounded-md cursor-pointer transition-colors", parentId === null ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground")}
            >
              Folder Utama
            </div>
            {availableNotes.map(n => (
              <div 
                key={n.id}
                onClick={() => { setParentId(n.id); setIsOpen(false); }}
                className={cn("px-3 py-2 text-sm rounded-md cursor-pointer transition-colors truncate", parentId === n.id ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted text-foreground")}
              >
                {n.title}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-[#f8f9fa] dark:bg-background animate-in fade-in duration-500 pb-24 md:pb-0">
        
        {/* HEADER TOP BAR (Sticky & Profesional seperti Google Docs) */}
        <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm px-3 md:px-5 py-2.5 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-muted text-muted-foreground shrink-0 w-9 h-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex flex-col flex-1 max-w-2xl">
              <div className="flex items-center gap-2 w-full">
                <input 
                  type="text" 
                  placeholder="Dokumen Tanpa Judul" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="bg-transparent border-none outline-none font-semibold text-lg md:text-xl text-foreground placeholder:text-muted-foreground/50 focus:ring-0 px-2 py-0.5 rounded hover:bg-muted/50 transition-colors w-full max-w-[600px] truncate"
                />
                {isHidden && (
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-1 rounded-md flex items-center shrink-0 font-bold uppercase tracking-wider">
                    <Lock className="w-3 h-3 mr-1"/> Brankas
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-3">
            <div className="hidden lg:flex items-center gap-1 mr-2">
              {flashcardsHistory.length > 0 && (
                 <Button variant="ghost" size="sm" onClick={() => setShowFlashcards(true)} className="text-indigo-500 font-semibold">
                   <Brain className="w-4 h-4 mr-1.5" /> Kuis
                 </Button>
              )}
              {mindMapHistory.length > 0 && (
                 <Button variant="ghost" size="sm" onClick={() => setShowMindMap(true)} className="text-rose-500 font-semibold">
                   <Network className="w-4 h-4 mr-1.5" /> Peta
                 </Button>
              )}
            </div>

            {/* Tombol Hapus & Bagikan (Khusus di halaman Edit) */}
            <div className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleShare} className="text-blue-500 rounded-full hover:bg-blue-500/10 w-9 h-9" title="Bagikan Link Publik">
                <Share2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive rounded-full hover:bg-destructive/10 w-9 h-9" title="Hapus Dokumen">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            {/* --- AI ASSISTANT DROPDOWN --- */}
            <div className="hidden md:block ml-1">
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
            </div>

            {/* Toggle Panel Kanan */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowProperties(!showProperties)} 
              className={cn("hidden md:flex rounded-full w-9 h-9 transition-colors", showProperties ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}
              title="Panel Alat & Properti"
            >
              {showProperties ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
            </Button>

            <div className="w-px h-6 bg-border mx-1 hidden md:block"></div>

            {/* Export Menu */}
            <div className="relative hidden md:block">
              <Button variant="outline" size="sm" onClick={() => setShowExportMenu(!showExportMenu)} className="rounded-full font-medium shadow-sm bg-card hover:bg-muted">
                <Download className="w-4 h-4 md:mr-2" /> <span className="hidden md:inline">Ekspor</span>
              </Button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-50 p-1 animate-in zoom-in-95">
                    <button onClick={handleExportPDF} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-muted font-medium text-red-500"><Printer className="w-4 h-4" /> Cetak PDF</button>
                    <button onClick={handleExportDOC} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-muted font-medium text-blue-500"><FileText className="w-4 h-4" /> Word (.doc)</button>
                    <button onClick={handleExportTXT} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-muted font-medium text-foreground"><File className="w-4 h-4" /> Teks (.txt)</button>
                  </div>
                </>
              )}
            </div>

            {/* Tombol Simpan Perubahan (Desktop) */}
            <Button 
              onClick={handleUpdate} 
              disabled={isSaving || (!title.trim() && content === '<p></p>')} 
              className="hidden md:flex rounded-full px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md transition-all h-9"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
              {isSaving ? "Menyimpan" : "Perbarui"}
            </Button>
          </div>
        </header>

        {/* WORKSPACE AREA */}
        <div className="flex-1 w-full flex lg:flex-row flex-col max-w-[1500px] mx-auto relative overflow-hidden">
          
          {/* AREA KERTAS TENGAH */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-0 md:p-4 lg:p-6 flex justify-center print:p-0">
            <div className={cn(
              "w-full bg-card md:border border-border md:shadow-lg md:rounded-xl overflow-hidden flex flex-col min-h-[800px] print:border-none print:shadow-none transition-all duration-300",
              showProperties ? "max-w-4xl" : "max-w-6xl"
            )}>
              
              {/* Hasil Ringkasan AI */}
              {aiSummary && (
                <div className="m-4 md:m-8 mb-0 p-5 rounded-xl bg-purple-500/5 border border-purple-500/20 relative animate-in fade-in print:hidden">
                  <Button variant="ghost" size="icon" onClick={() => setAiSummary(null)} className="absolute top-3 right-3 h-6 w-6 text-muted-foreground hover:bg-background rounded-full">
                    <X className="w-3 h-3"/>
                  </Button>
                  <div className="flex items-center gap-2 mb-2 text-purple-600 font-bold text-xs uppercase tracking-widest">
                    <Sparkles className="w-4 h-4" /> Ringkasan AI
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed">{aiSummary}</p>
                </div>
              )}

              {/* Input Media Tersembunyi */}
              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} onChange={handleImageUpload} className="hidden" />
              <input type="file" accept="image/*" ref={galleryInputRef} onChange={handleImageUpload} className="hidden" />

              {/* Tiptap Editor (Kertas) */}
              <div className="flex-1 w-full flex flex-col">
                <TiptapEditor 
                  key={editorKey} 
                  content={content} 
                  onChange={setContent} 
                  availableNotes={availableNotes} 
                />
              </div>
            </div>
          </div>

          {/* SIDEBAR ALAT & PROPERTI (DESKTOP) */}
          {showProperties && (
            <div className="hidden lg:flex w-80 shrink-0 border-l border-border bg-card/50 overflow-y-auto custom-scrollbar flex-col animate-in slide-in-from-right-8 duration-300">
              
              {/* Document Properties */}
              <div className="p-5 border-b border-border space-y-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Settings2 className="w-3.5 h-3.5" /> Pengaturan Dokumen
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Kategori Folder</label>
                  <CustomFolderSelect />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">Visibilitas</label>
                  <Button 
                    variant={isHidden ? "default" : "outline"} 
                    onClick={() => setIsHidden(!isHidden)} 
                    className={cn(
                      "w-full justify-start h-10 rounded-lg transition-all",
                      isHidden ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600 shadow-sm" : "bg-background hover:bg-muted text-foreground border-border"
                    )}
                  >
                    {isHidden ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2 text-muted-foreground" />} 
                    {isHidden ? "Terkunci di Brankas" : "Publik (Normal)"}
                  </Button>
                </div>
              </div>

              {/* Tags Section */}
              <div className="p-5 border-b border-border space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Hash className="w-3.5 h-3.5" /> Label & Metadata
                </h3>
                
                <div className="flex items-center gap-2 bg-background p-1.5 rounded-lg border border-border focus-within:border-primary transition-colors">
                  <TagIcon className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
                  <input 
                    type="text" 
                    placeholder="Ketik tag lalu Enter..." 
                    value={tagInput} 
                    onChange={(e) => setTagInput(e.target.value)} 
                    onKeyDown={handleKeyDownTag} 
                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground focus:ring-0" 
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 text-xs font-medium bg-muted text-foreground border border-border rounded-md flex items-center gap-1.5">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                  {tags.length === 0 && <p className="text-xs text-muted-foreground w-full text-center py-1">Belum ada label tambahan.</p>}
                </div>
              </div>

              {/* Media Insert */}
              <div className="p-5 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5" /> Sisipkan Media
                </h3>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" onClick={() => cameraInputRef.current?.click()} disabled={isScanning} className="w-full justify-start bg-background h-10 rounded-lg">
                    {isScanning ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <Camera className="w-4 h-4 mr-3 text-muted-foreground" />} Kamera
                  </Button>
                  <Button variant="outline" onClick={() => galleryInputRef.current?.click()} disabled={isScanning} className="w-full justify-start bg-background h-10 rounded-lg">
                    {isScanning ? <Loader2 className="w-4 h-4 mr-3 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-3 text-muted-foreground" />} Galeri
                  </Button>
                </div>
              </div>

            </div>
          )}

          {/* PANEL PROPERTI MOBILE (Ditampilkan di bawah editor jika mode HP) */}
          <div className="lg:hidden p-4 space-y-4 print:hidden bg-card border-t border-border mt-auto">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <CustomFolderSelect />
                <Button variant={isHidden ? "default" : "outline"} size="icon" onClick={() => setIsHidden(!isHidden)} className={cn("h-10 w-10 shrink-0 rounded-lg", isHidden ? "bg-purple-600 text-white border-purple-600" : "")}>
                  {isHidden ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4 text-muted-foreground" />} 
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 flex-1 bg-muted/50 px-3 py-2 rounded-xl border border-border min-w-[200px]">
                  <TagIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input type="text" placeholder="Tambah tag lalu enter..." value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleKeyDownTag} className="w-full bg-transparent text-xs outline-none" />
                </div>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 rounded-md flex items-center gap-1">
                      {tag} <button onClick={() => removeTag(tag)}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* FLOATING BOTTOM ACTION BAR (HANYA MUNCUL DI MOBILE) */}
        <div className="md:hidden fixed bottom-20 left-0 right-0 z-40 px-4 pointer-events-none print:hidden animate-in slide-in-from-bottom-10">
          <div className="flex items-center justify-end gap-3 pointer-events-auto">
            
            {/* Tombol Kamera/Galeri Cepat Mobile */}
            <div className="flex items-center gap-2 mr-auto bg-card/90 backdrop-blur border border-border p-1.5 rounded-full shadow-lg">
              <Button variant="ghost" size="icon" onClick={() => cameraInputRef.current?.click()} disabled={isScanning} className="w-10 h-10 rounded-full text-muted-foreground hover:text-foreground">
                {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => galleryInputRef.current?.click()} disabled={isScanning} className="w-10 h-10 rounded-full text-muted-foreground hover:text-foreground">
                {isScanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
              </Button>
            </div>

            {/* Menu Export Mobile */}
            <div className="relative">
              <Button variant="outline" size="icon" onClick={() => setShowExportMenu(!showExportMenu)} className="w-14 h-14 rounded-full border-border bg-card/95 backdrop-blur shadow-2xl hover:bg-muted text-muted-foreground">
                <Download className="w-6 h-6" />
              </Button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowExportMenu(false)}></div>
                  <div className="absolute right-0 bottom-full mb-3 w-48 bg-card border border-border/60 rounded-2xl shadow-2xl z-50 p-1.5 animate-in fade-in zoom-in-95">
                    <p className="text-[10px] font-bold text-muted-foreground px-3 py-2 uppercase tracking-wider text-center">Ekspor</p>
                    <button onClick={handleExportPDF} className="w-full flex items-center gap-3 px-3 py-3 text-sm rounded-xl hover:bg-muted font-medium text-red-500 transition-colors"><Printer className="w-4 h-4" /> PDF</button>
                    <button onClick={handleExportDOC} className="w-full flex items-center gap-3 px-3 py-3 text-sm rounded-xl hover:bg-muted font-medium text-blue-500 transition-colors"><FileText className="w-4 h-4" /> Word</button>
                    <button onClick={handleExportTXT} className="w-full flex items-center gap-3 px-3 py-3 text-sm rounded-xl hover:bg-muted font-medium text-foreground transition-colors"><File className="w-4 h-4" /> Teks</button>
                  </div>
                </>
              )}
            </div>

            <Button 
              onClick={handleUpdate} 
              disabled={isSaving || (!title.trim() && content === '<p></p>')} 
              className="w-14 h-14 rounded-full bg-primary shadow-2xl shadow-primary/30 text-white font-bold border-0 hover:scale-105 transition-transform"
            >
              {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            </Button>
          </div>
        </div>

      </div>

      {/* OVERLAYS & MODALS */}
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