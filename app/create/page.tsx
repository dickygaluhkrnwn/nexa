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
  Camera, Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 
import { useGemini } from "@/hooks/use-gemini"; 
import { AiToolbar } from "@/components/notes/ai-toolbar";
import { ChatOverlay } from "@/components/notes/chat-overlay";
import { MindMapViewer } from "@/components/notes/mindmap-viewer";

export default function CreateNotePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showAlert, showQuotaAlert } = useModal(); 
  const { callAI } = useGemini(); 
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  // State Tags & Privasi
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isHidden, setIsHidden] = useState(false); 
  
  // State UI Ekspor & Loading
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editorKey, setEditorKey] = useState(0); 

  // Referensi & State Hardware (Kamera/Voice)
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  
  // --- STATE SMART VOICE MEMOS ---
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  // -------------------------------

  // --- STATE AI (Menyederhanakan kontrol UI saja) ---
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false); 
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
  const [mindMapCode, setMindMapCode] = useState<string | null>(null);

  const [availableNotes, setAvailableNotes] = useState<{ id: string; title: string }[]>([]);

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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Silakan login terlebih dahulu.</p>
        <Button variant="link" onClick={() => router.push('/')}>Kembali ke Home</Button>
      </div>
    );
  }

  const handleKeyDownTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleExportTXT = () => {
    const plainText = content.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n\n').trim();
    const textToExport = `JUDUL: ${title || 'Tanpa Judul'}\n\n${plainText}`;
    const blob = new Blob([textToExport], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "Catatan_Nexa"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportDOC = () => {
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Catatan Nexa</title></head><body>";
    const footer = "</body></html>";
    const sourceHTML = header + `<h1>${title || "Tanpa Judul"}</h1>` + content + footer;
    const blob = new Blob(['\ufeff', sourceHTML], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "Catatan_Nexa"}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const handleExportPDF = () => {
    setShowExportMenu(false);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      showAlert("Error Ekspor", "Gagal memuat sistem pembuatan PDF.");
      return;
    }

    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <title>${title || "Catatan_Nexa"}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #111; line-height: 1.6; }
            h1 { font-size: 32px; font-weight: bold; border-bottom: 2px solid #eaeaea; padding-bottom: 12px; margin-bottom: 24px; }
            p { margin-bottom: 1em; }
            ul { list-style-type: disc; margin-left: 24px; margin-bottom: 1em; }
            ol { list-style-type: decimal; margin-left: 24px; margin-bottom: 1em; }
          </style>
        </head>
        <body>
          <h1>${title || 'Tanpa Judul'}</h1>
          <div>${content}</div>
        </body>
      </html>
    `);
    iframeDoc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 250);
  };

  const handleAutoFormat = async () => {
    setIsFormatting(true);
    try {
      const result = await callAI({ action: "auto-format", content: content });
      if (result) {
        const cleanHtml = result.replace(/```html/g, '').replace(/```/g, '').trim();
        setContent(cleanHtml);
        setEditorKey(prev => prev + 1); 
        showAlert("Berhasil! ✨", "Teks acakmu sudah disulap menjadi rapi dan terstruktur.");
      }
    } catch (error: any) {
       if (error.message === "QUOTA_EXCEEDED") showQuotaAlert();
       else console.error("Gagal merapikan teks", error);
    } finally {
      setIsFormatting(false);
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const plainText = content.replace(/<[^>]+>/g, ' ').trim();
      const result = await callAI({ action: "summarize", content: `Judul: ${title}\n\nIsi: ${plainText}` });
      setAiSummary(result);
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") showQuotaAlert();
      else console.error("Gagal merangkum", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateTags = async () => {
    setIsGeneratingTags(true);
    try {
      const plainText = content.replace(/<[^>]+>/g, ' ').trim();
      const result = await callAI({ action: "auto-tag", content: `Judul: ${title}\n\nIsi: ${plainText}` });
      if (result) {
        const newTags = result.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean);
        const uniqueTags = Array.from(new Set([...tags, ...newTags]));
        setTags(uniqueTags);
      }
    } catch (error: any) {
       if (error.message === "QUOTA_EXCEEDED") showQuotaAlert();
       else console.error("Gagal menebak tag", error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleGenerateMindMap = async () => {
    setIsGeneratingMindMap(true);
    try {
      const plainText = content.replace(/<[^>]+>/g, ' ').trim();
      const result = await callAI({ action: "mindmap", content: `Judul: ${title}\n\nIsi: ${plainText}` });
      if (result) {
        const cleanCode = result.replace(/```mermaid/g, '').replace(/```/g, '').trim();
        setMindMapCode(cleanCode);
      }
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") showQuotaAlert();
      else console.error("Gagal membuat mind map", error);
    } finally {
      setIsGeneratingMindMap(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = ""; 
    setIsScanning(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const extractedHtml = await callAI({ action: "ocr", imageBase64: base64String, mimeType: file.type });
          const cleanHtml = extractedHtml?.replace(/```html/g, '').replace(/```/g, '').trim();

          if (!cleanHtml || cleanHtml === "") {
            showAlert("Info AI", "AI tidak menemukan teks pada gambar ini.");
          } else {
            setContent((prev) => prev + (prev ? "<br><br>" : "") + cleanHtml);
            setEditorKey(prev => prev + 1); 
          }
        } catch (apiError: any) {
          if (apiError.message === "QUOTA_EXCEEDED") showQuotaAlert();
          else console.error("Gagal scan OCR", apiError);
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsScanning(false);
      showAlert("Error File", "Gagal membaca file gambar.");
    }
  };

  // --- LOGIKA SMART VOICE MEMO ---
  const handleVoiceRecord = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showAlert("Tidak Mendukung", "Maaf, browser kamu tidak mendukung fitur Suara ke Teks. Coba gunakan Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID'; 
    // Set true jika ingin merekam panjang (continuous)
    recognition.continuous = true; 
    recognition.interimResults = false;

    let finalTranscript = "";

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      showAlert("Gagal Mendengar", "Gagal mengenali suara. Pastikan kamu sudah memberikan izin mikrofon di browser.");
      setIsRecording(false);
    };

    // Saat user berhenti ngomong atau mematikan secara manual
    recognition.onend = async () => {
      setIsRecording(false);
      
      if (!finalTranscript.trim()) return;

      // Mulai Analisis AI
      setIsAnalyzingVoice(true);
      try {
        const result = await callAI({
          action: "analyze-voice-memo",
          content: finalTranscript.trim()
        });

        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Set Judul otomatis jika masih kosong
          if (!title && parsed.title) setTitle(parsed.title);
          
          // Susun HTML untuk Tiptap
          let aiContentHtml = `
            <h3>🎙️ Catatan Suara Pintar</h3>
            <p><em>${parsed.summary}</em></p>
            ${parsed.formattedText}
          `;

          // Jika ada Action Items, ubah menjadi checklist Tiptap
          if (parsed.actionItems && parsed.actionItems.length > 0) {
            aiContentHtml += `
              <br/>
              <h4>✅ Action Items:</h4>
              <ul data-type="taskList">
                ${parsed.actionItems.map((task: string) => `
                  <li data-type="taskItem" data-checked="false">
                    <label><input type="checkbox"><span></span></label>
                    <div><p>${task}</p></div>
                  </li>
                `).join('')}
              </ul>
            `;
          }

          setContent((prev) => prev + (prev ? "<br><br>" : "") + aiContentHtml);
          setEditorKey(prev => prev + 1);
          showAlert("Berhasil!", "Rekaman suara berhasil dirapikan dan dianalisis oleh AI.");
        } else {
          throw new Error("Invalid JSON from AI");
        }

      } catch (error: any) {
        console.error("Gagal menganalisis suara:", error);
        
        // FALLBACK: JIKA AI LIMIT ATAU GAGAL, TETAP MASUKKAN TEKS MENTAHNYA
        setContent((prev) => prev + (prev ? "<br><br>" : "") + `<p>🎙️ <em>Transkripsi Mentah (AI Limit):</em><br/>${finalTranscript.trim()}</p>`);
        setEditorKey(prev => prev + 1);
        
        if (error.message === "QUOTA_EXCEEDED") {
          showQuotaAlert();
        } else {
          showAlert("AI Sibuk", "AI gagal merapikan rekamanmu. Jangan khawatir, teks aslinya tetap kami simpan di editor.");
        }
      } finally {
        setIsAnalyzingVoice(false);
      }
    };

    // Auto-stop setelah 60 detik (sebagai pengaman awal) atau biarkan user klik lagi untuk stop
    recognition.start();
    
    // Beri tahu user cara mematikan
    const stopRecordingManual = () => {
      recognition.stop();
    };

    // Simpan fungsi stop ke dalam object window agar bisa dipanggil tombol UI
    (window as any).stopNexaRecording = stopRecordingManual;
  };
  // ------------------------------------

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
  }, []); 

  const handleSave = async () => {
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
        mindmapCode: mindMapCode,
        userId: user.uid,
      } as any);
      
      router.push("/");
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      showAlert("Gagal", "Terjadi kesalahan. Gagal menyimpan catatan.");
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
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Buat Catatan</span>
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
          {/* PERBAIKAN: Melemparkan props Voice ke AiToolbar */}
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
            
            // Props Voice
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

      {mindMapCode && (
        <MindMapViewer code={mindMapCode} onClose={() => setMindMapCode(null)} />
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