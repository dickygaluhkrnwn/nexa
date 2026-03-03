"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addNote, getUserNotes } from "@/lib/notes-service";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Save, ArrowLeft,
  Tag as TagIcon, Lock, Unlock, 
  Sparkles, X, Download, FileText, File, Printer,
  Camera, Image as ImageIcon, Network, FolderTree
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 
import { useGemini } from "@/hooks/use-gemini"; 
import { useNoteForm } from "@/hooks/use-note-form";
import { useExport } from "@/hooks/use-export";
import { useNoteAi } from "@/hooks/use-note-ai"; // <-- IMPORT HOOK AI

import { AiToolbar } from "@/components/notes/ai-toolbar";
import { ChatOverlay } from "@/components/notes/chat-overlay";
import { MindMapViewer } from "@/components/notes/mindmap-viewer";

export default function CreateNotePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showAlert } = useModal(); 
  const { callAI } = useGemini(); 
  
  // 1. STATE FORM (Judul, Konten, Tag)
  const {
    title, setTitle, content, setContent, tags, setTags,
    tagInput, setTagInput, isHidden, setIsHidden,
    parentId, setParentId, // <-- AMBIL STATE PARENT DARI HOOK
    editorKey, forceRenderEditor, handleKeyDownTag, removeTag
  } = useNoteForm();

  // 2. STATE EKSPOR DOKUMEN
  const {
    showExportMenu, setShowExportMenu,
    handleExportTXT, handleExportDOC, handleExportPDF
  } = useExport(title, content);

  // 3. STATE MIND MAP
  const [mindMapHistory, setMindMapHistory] = useState<string[]>([]);
  const [showMindMap, setShowMindMap] = useState(false); 

  // 4. STATE AI & HARDWARE (Semua disedot ke Hook ini!)
  const {
    isSummarizing, isGeneratingTags, isFormatting, isGeneratingMindMap,
    isScanning, isAnalyzingVoice, isRecording, aiSummary, setAiSummary,
    handleAutoFormat, handleSummarize, handleGenerateTags, handleGenerateMindMap,
    handleImageUpload, handleVoiceRecord
  } = useNoteAi({
    title, setTitle, content, setContent, tags, setTags, forceRenderEditor,
    mindMapHistory, setMindMapHistory, setShowMindMap
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [availableNotes, setAvailableNotes] = useState<{ id: string; title: string }[]>([]);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      getUserNotes(user.uid).then(notes => {
        const formattedNotes = notes.map((n: any) => ({
          id: n.id,
          title: n.title || "Tanpa Judul"
        }));
        setAvailableNotes(formattedNotes);
      }).catch(err => console.error("Gagal memuat catatan untuk linking", err));
    }
  }, [user]);

  // Otomatis membuka kamera/suara berdasarkan URL param (dari Quick Actions)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');

    if (mode) {
      window.history.replaceState(null, '', '/create');
      setTimeout(() => {
        if (mode === 'camera' && cameraInputRef.current) cameraInputRef.current.click();
        else if (mode === 'gallery' && galleryInputRef.current) galleryInputRef.current.click();
        else if (mode === 'voice') handleVoiceRecord();
      }, 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleSave = async () => {
    if (!user) return; 
    
    const plainText = content.replace(/<[^>]+>/g, ' ').trim();
    if (!title.trim() && !plainText) return; 
    
    setIsSaving(true);
    let finalTags = [...tags];

    try {
      if (finalTags.length === 0 && (title.trim() || plainText)) {
        try {
          const result = await callAI({ action: "auto-tag", content: `Judul: ${title}\n\nIsi: ${plainText}` });
          if (result) finalTags = result.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean);
        } catch (e: any) {
          if (e.message !== "QUOTA_EXCEEDED") console.error("Auto-tagging gagal...", e);
        }
      }

      await addNote({
        title: title || "Tanpa Judul",
        content: content,
        tags: finalTags,
        isTodo: false, 
        dueDate: null, 
        isHidden: isHidden,
        mindmapCode: mindMapHistory, 
        parentId: parentId, // <-- SIMPAN PARENT ID KE DATABASE
        userId: user.uid,
      } as any);
      
      router.push("/notes");
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      showAlert("Gagal", "Terjadi kesalahan. Gagal menyimpan catatan.");
      setIsSaving(false);
    }
  };

  const plainTextLength = content.replace(/<[^>]+>/g, '').trim().length;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Silakan login terlebih dahulu.</p>
        <Button variant="link" onClick={() => router.push('/')}>Kembali ke Home</Button>
      </div>
    );
  }

  return (
    <>
      <div className="pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto relative">
        
        {/* Header Statis */}
        <div className="p-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Buat Catatan</span>
          </div>
          
          {/* Tombol Buka Mind Map di Header jika riwayat sudah ada */}
          <div className="flex items-center gap-1">
            {mindMapHistory.length > 0 && (
               <Button variant="ghost" size="icon" onClick={() => setShowMindMap(true)} className="text-rose-500 hover:bg-rose-500/10 rounded-full transition-colors" title="Buka Peta Konsep">
                 <Network className="w-5 h-5" />
               </Button>
            )}
          </div>
        </div>

        <div className="px-4 space-y-4 print:p-0">
          
          {/* Area Judul */}
          <div>
            <input type="text" placeholder="Judul Catatan..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-4xl font-extrabold tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/30 focus:ring-0 print:text-black print:p-0" autoFocus />
          </div>

          {/* Area Tags */}
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {tags.map((tag) => (
              <span key={tag} className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg flex items-center gap-1.5 animate-in zoom-in-95">
                <TagIcon className="w-3 h-3" /> {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </span>
            ))}
            <input type="text" placeholder={tags.length === 0 ? "Ketik tag lalu Enter..." : "+ Tambah tag..."} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleKeyDownTag} className="bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground focus:ring-0 min-w-[120px]" />
          </div>

          {/* --- DROPDOWN PILIH INDUK (PARENT) CATATAN --- */}
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

          {/* --- TOOLBAR 1: Privasi & Input Media --- */}
          <div className="flex flex-wrap items-center gap-2 pt-2 print:hidden">
            <Button 
              variant={isHidden ? "default" : "outline"} 
              size="sm" 
              onClick={() => setIsHidden(!isHidden)} 
              className={`rounded-xl transition-all ${isHidden ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600" : "bg-card text-muted-foreground hover:bg-purple-500/10 hover:text-purple-500 border-border"}`}
            >
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

          {/* --- TOOLBAR 2: Asisten AI --- */}
          <AiToolbar 
            onOpenChat={() => setIsChatOpen(true)}
            onGenerateMindMap={handleGenerateMindMap}
            onAutoFormat={handleAutoFormat}
            onGenerateTags={handleGenerateTags}
            onSummarize={handleSummarize}
            isGeneratingMindMap={isGeneratingMindMap}
            isFormatting={isFormatting}
            isGeneratingTags={isGeneratingTags}
            isSummarizing={isSummarizing}
            isContentEmpty={plainTextLength === 0}
            isTitleAndContentEmpty={!title.trim() && plainTextLength === 0}
            onVoiceRecord={handleVoiceRecord}
            isRecording={isRecording}
            isAnalyzingVoice={isAnalyzingVoice}
            onStopRecording={() => (window as any).stopNexaRecording && (window as any).stopNexaRecording()}
          />

          {/* Tampilan Hasil Ringkasan AI */}
          {aiSummary && (
            <div className="relative p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-purple-500/10 border border-purple-500/20 animate-in fade-in zoom-in-95 shadow-sm print:hidden">
              <div className="absolute top-0 right-0 p-2">
                <button onClick={() => setAiSummary(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex items-center gap-2 mb-3 text-purple-600 dark:text-purple-400 font-bold text-sm uppercase tracking-wider">
                <Sparkles className="w-4 h-4" /><span>Ringkasan Cerdas AI</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed font-medium">{aiSummary}</p>
            </div>
          )}

          {/* Editor Teks */}
          <div className="pt-2 print:text-black">
            <TiptapEditor 
              key={editorKey} 
              content={content} 
              onChange={setContent} 
              availableNotes={availableNotes} 
            />
          </div>
        </div>

        {/* FLOATING BOTTOM ACTION BAR */}
        <div className="fixed bottom-20 md:bottom-8 left-0 right-0 z-40 px-4 pointer-events-none print:hidden">
          <div className="max-w-2xl mx-auto flex items-center justify-between pointer-events-auto">
            {/* Menu Export / Download */}
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

            <Button onClick={handleSave} disabled={isSaving || (!title.trim() && content === '<p></p>')} className="rounded-full px-6 py-6 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-xl text-white font-bold border-0">
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} {isSaving ? "Menyimpan..." : "Simpan Catatan"}
            </Button>
          </div>
        </div>
      </div>

      {showMindMap && mindMapHistory.length > 0 && (
        <MindMapViewer history={mindMapHistory} onClose={() => setShowMindMap(false)} />
      )}

      <ChatOverlay 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        noteTitle={title}
        noteContent={content}
      />
    </>
  );
}