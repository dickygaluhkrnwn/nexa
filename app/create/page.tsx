"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addNote } from "@/lib/notes-service";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Save, ArrowLeft, Wand2, 
  Tag as TagIcon, Lock, Unlock, 
  Sparkles, X, Download, FileText, File, Printer,
  Camera, Image as ImageIcon, Mic,
  MessageSquare, Send, Bot, Network,
  ZoomIn, ZoomOut, Maximize // <-- TAMBAHAN ICON ZOOM
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 
import { useGemini } from "@/hooks/use-gemini"; 
import { useTheme } from "next-themes";
import mermaid from "mermaid"; 

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export default function CreateNotePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showAlert, showQuotaAlert } = useModal(); // Memastikan showQuotaAlert diimpor
  const { callAI } = useGemini(); 
  const { theme } = useTheme();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  // State Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  // State Privasi
  const [isHidden, setIsHidden] = useState(false); 
  
  // State Ekspor, Loading & Editor Key
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false); 
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [editorKey, setEditorKey] = useState(0); 

  // Reference & State untuk OCR (Kamera & Galeri) dan Voice
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // --- STATE CHAT DENGAN CATATAN (RAG) ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- STATE & REFERENCE UNTUK MIND MAP ---
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
  const [mindMapCode, setMindMapCode] = useState<string | null>(null);
  const mindMapRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1); // <-- TAMBAHAN STATE ZOOM

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  // Efek untuk Render Mermaid JS
  useEffect(() => {
    if (mindMapCode && mindMapRef.current) {
      try {
        mermaid.initialize({ 
          startOnLoad: false, 
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose' 
        });
        
        // Bersihkan kontainer sebelum merender yang baru
        mindMapRef.current.innerHTML = '';
        
        // Render sintaks mermaid
        mermaid.render('mermaid-mindmap-svg', mindMapCode).then((result) => {
          if (mindMapRef.current) {
            mindMapRef.current.innerHTML = result.svg;
          }
        }).catch((err) => {
          console.error("Mermaid async render error", err);
          throw err;
        });

      } catch (err) {
        console.error("Mermaid initialization error", err);
        if (mindMapRef.current) {
           mindMapRef.current.innerHTML = `
             <div class="text-center text-destructive p-4 border border-destructive/20 rounded-xl bg-destructive/10">
               <p class="font-bold mb-1">Gagal Merender Mind Map</p>
               <p class="text-xs">AI memberikan struktur diagram yang tidak valid. Silakan coba generate ulang.</p>
             </div>
           `;
        }
      }
    }
  }, [mindMapCode, theme]);

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

  // --- FUNGSI EXPORT ---
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

  // --- LOGIKA AI SUPERPOWERS ---
  const handleAutoFormat = async () => {
    if (!content.replace(/<[^>]+>/g, '').trim()) {
      showAlert("Perhatian", "Teks masih kosong! Ketik sesuatu dulu untuk disulap AI.");
      return;
    }

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
       if (error.message === "QUOTA_EXCEEDED") {
        showQuotaAlert();
      } else {
        console.error("Gagal merapikan teks", error);
      }
    } finally {
      setIsFormatting(false);
    }
  };

  const handleSummarize = async () => {
    const plainText = content.replace(/<[^>]+>/g, ' ').trim();
    if (!plainText && !title) {
      showAlert("Perhatian", "Catatan masih kosong! Tulis sesuatu dulu untuk dirangkum.");
      return;
    }

    setIsSummarizing(true);
    try {
      const result = await callAI({ action: "summarize", content: `Judul: ${title}\n\nIsi: ${plainText}` });
      setAiSummary(result);
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") {
        showQuotaAlert();
      } else {
        console.error("Gagal merangkum", error);
      }
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateTags = async () => {
    const plainText = content.replace(/<[^>]+>/g, ' ').trim();
    if (!plainText && !title) {
      showAlert("Perhatian", "Tulis sesuatu dulu agar AI bisa menebak tag-nya!");
      return;
    }

    setIsGeneratingTags(true);
    try {
      const result = await callAI({ action: "auto-tag", content: `Judul: ${title}\n\nIsi: ${plainText}` });
      if (result) {
        const newTags = result.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean);
        const uniqueTags = Array.from(new Set([...tags, ...newTags]));
        setTags(uniqueTags);
      }
    } catch (error: any) {
       if (error.message === "QUOTA_EXCEEDED") {
        showQuotaAlert();
      } else {
        console.error("Gagal menebak tag", error);
      }
    } finally {
      setIsGeneratingTags(false);
    }
  };

  // --- LOGIKA MIND MAP ---
  const handleGenerateMindMap = async () => {
    const plainText = content.replace(/<[^>]+>/g, ' ').trim();
    if (!plainText && !title) {
      showAlert("Perhatian", "Catatan masih kosong! Tulis sesuatu dulu untuk dijadikan Peta Konsep.");
      return;
    }

    setIsGeneratingMindMap(true);
    try {
      const result = await callAI({ action: "mindmap", content: `Judul: ${title}\n\nIsi: ${plainText}` });
      if (result) {
        const cleanCode = result.replace(/```mermaid/g, '').replace(/```/g, '').trim();
        setMindMapCode(cleanCode);
      }
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") {
        showQuotaAlert();
      } else {
        console.error("Gagal membuat mind map", error);
      }
    } finally {
      setIsGeneratingMindMap(false);
    }
  };
  // -----------------------

  // --- LOGIKA CHAT DENGAN CATATAN ---
  const formatMessageContent = (text: string) => {
    let formattedText = text;
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formattedText = formattedText.replace(/\n/g, '<br />');
    return formattedText;
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsChatLoading(true);

    try {
      const plainText = content.replace(/<[^>]+>/g, ' ').trim();
      const contextStr = `Judul: ${title || 'Tanpa Judul'}\n\nIsi Catatan:\n${plainText}`;
      
      const result = await callAI({ 
        action: "chat", 
        prompt: userMessage,
        context: contextStr
      });

      setChatMessages(prev => [...prev, { role: "ai", content: result }]);
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") {
        showQuotaAlert();
        // Remove the user message if quota exceeded to not leave it hanging
        setChatMessages(prev => prev.slice(0, -1));
      } else {
        setChatMessages(prev => [...prev, { role: "ai", content: "Aduh, aku gagal merespons permintaanmu. Coba lagi ya!" }]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };
  // -----------------------------

  // --- FUNGSI SCAN GAMBAR KE TEKS (OCR) ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = ""; 
    setIsScanning(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const mimeType = file.type;

        try {
          const extractedHtml = await callAI({ 
            action: "ocr", 
            imageBase64: base64String, 
            mimeType: mimeType 
          });

          const cleanHtml = extractedHtml?.replace(/```html/g, '').replace(/```/g, '').trim();

          if (!cleanHtml || cleanHtml === "") {
            showAlert("Info AI", "AI tidak menemukan teks pada gambar ini.");
          } else {
            setContent((prev) => prev + (prev ? "<br><br>" : "") + cleanHtml);
            setEditorKey(prev => prev + 1); 
          }

        } catch (apiError: any) {
          if (apiError.message === "QUOTA_EXCEEDED") {
            showQuotaAlert();
          } else {
             console.error("Gagal scan OCR", apiError);
          }
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

  // --- FUNGSI VOICE TO TEXT (SPEECH RECOGNITION) ---
  const handleVoiceRecord = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showAlert("Tidak Mendukung", "Maaf, browser kamu tidak mendukung fitur Suara ke Teks. Coba gunakan Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID'; 
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setContent((prev) => prev + (prev ? " " : "") + transcript);
        setEditorKey(prev => prev + 1); 
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      showAlert("Gagal Mendengar", "Gagal mengenali suara. Pastikan kamu sudah memberikan izin mikrofon di browser.");
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);
    recognition.start();
  };

  // --- EFEK UNTUK MENANGKAP SHORTCUT DARI BOTTOM NAV ---
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const mode = searchParams.get('mode');

    if (mode) {
      window.history.replaceState(null, '', '/create');
      setTimeout(() => {
        if (mode === 'camera' && cameraInputRef.current) {
          cameraInputRef.current.click();
        } else if (mode === 'gallery' && galleryInputRef.current) {
          galleryInputRef.current.click();
        } else if (mode === 'voice') {
          handleVoiceRecord();
        }
      }, 500);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    const plainText = content.replace(/<[^>]+>/g, ' ').trim();
    if (!title.trim() && !plainText) return; 
    
    setIsSaving(true);
    let finalTags = [...tags];

    try {
      if (finalTags.length === 0 && (title.trim() || plainText)) {
        try {
          const result = await callAI({ action: "auto-tag", content: `Judul: ${title}\n\nIsi: ${plainText}` });
          if (result) {
            finalTags = result.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean);
          }
        } catch (e: any) {
          if (e.message !== "QUOTA_EXCEEDED") {
            console.error("Auto-tagging gagal...", e);
          }
        }
      }

      await addNote({
        title: title || "Tanpa Judul",
        content: content,
        tags: finalTags,
        isTodo: false, 
        dueDate: null, 
        isHidden: isHidden,
        mindmapCode: mindMapCode, // <-- TAMBAHKAN BARIS INI AGAR MIND MAP TERSIMPAN
        userId: user.uid,
      } as any);
      
      router.push("/");
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      showAlert("Gagal", "Terjadi kesalahan. Gagal menyimpan catatan.");
      setIsSaving(false);
    }
  };

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
            
            <Button variant="outline" size="sm" onClick={() => cameraInputRef.current?.click()} disabled={isScanning} className="rounded-xl whitespace-nowrap bg-card text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 border-border">
              {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />} Kamera
            </Button>

            <Button variant="outline" size="sm" onClick={() => galleryInputRef.current?.click()} disabled={isScanning} className="rounded-xl whitespace-nowrap bg-card text-muted-foreground hover:text-indigo-500 hover:bg-indigo-500/10 border-border">
              {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />} Galeri
            </Button>

            <Button variant="outline" size="sm" onClick={handleVoiceRecord} disabled={isRecording} className={`rounded-xl whitespace-nowrap transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse border-red-500' : 'bg-card text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 border-border'}`}>
              <Mic className={`w-4 h-4 mr-2 ${isRecording ? 'animate-pulse' : ''}`} /> 
              {isRecording ? "Mendengarkan..." : "Suara"}
            </Button>
          </div>

          {/* --- TOOLBAR 2: Asisten AI --- */}
          <div className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-cyan-500/5 border border-primary/20 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
            <div className="flex items-center gap-2.5 px-1">
              <div className="p-1.5 bg-primary/20 rounded-lg text-primary shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Nexa AI Assistant</p>
                <p className="text-[10px] text-muted-foreground">Bantu rapikan catatanmu</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button variant="outline" size="sm" onClick={() => setIsChatOpen(true)} className="flex-1 sm:flex-none rounded-xl bg-background/50 hover:bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 shadow-sm whitespace-nowrap">
                <MessageSquare className="w-3 h-3 mr-1.5" /> Tanya AI
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerateMindMap} disabled={isGeneratingMindMap || !content.replace(/<[^>]+>/g, '').trim()} className="flex-1 sm:flex-none rounded-xl bg-background/50 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-sm whitespace-nowrap">
                {isGeneratingMindMap ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Network className="w-3 h-3 mr-1.5" />} Mind Map
              </Button>
              <Button variant="outline" size="sm" onClick={handleAutoFormat} disabled={isFormatting || !content.replace(/<[^>]+>/g, '').trim()} className="flex-1 sm:flex-none rounded-xl bg-background/50 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 shadow-sm whitespace-nowrap">
                {isFormatting ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1.5" />} Rapihkan
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerateTags} disabled={isGeneratingTags || (!title.trim() && !content.replace(/<[^>]+>/g, '').trim())} className="flex-1 sm:flex-none rounded-xl bg-background/50 hover:bg-primary/10 text-primary border-primary/20 shadow-sm whitespace-nowrap">
                {isGeneratingTags ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <TagIcon className="w-3 h-3 mr-1.5" />} Tebak Tag
              </Button>
              <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isSummarizing || (!title.trim() && !content.replace(/<[^>]+>/g, '').trim())} className="flex-1 sm:flex-none rounded-xl bg-background/50 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 shadow-sm whitespace-nowrap">
                {isSummarizing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1.5" />} Ringkas Isi
              </Button>
            </div>
          </div>

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
            <TiptapEditor key={editorKey} content={content} onChange={setContent} />
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

      {/* --- PANEL OVERLAY: MIND MAP VIEWER --- */}
      {mindMapCode && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                <Network className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight">Peta Konsep (Mind Map)</h3>
                <p className="text-[11px] text-muted-foreground">Di-generate otomatis oleh Nexa AI</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={() => setMindMapCode(null)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto p-4 flex items-center justify-center w-full h-full relative">
            
            {/* KONTROL ZOOM PADA MIND MAP */}
            <div className="absolute bottom-6 right-6 z-50 flex gap-2 bg-background/80 backdrop-blur-md p-1.5 rounded-2xl border border-border shadow-lg">
              <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.4))} className="rounded-xl hover:bg-muted">
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setZoomLevel(1)} className="rounded-xl hover:bg-muted font-bold text-xs w-10">
                {Math.round(zoomLevel * 100)}%
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))} className="rounded-xl hover:bg-muted">
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>

            {/* Tempat hasil render Mermaid JS dengan transformasi Scale */}
            <div className="w-full h-full flex items-center justify-center min-h-[500px] min-w-[500px]">
              <div 
                ref={mindMapRef} 
                className="transition-transform duration-200 ease-out origin-center"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- PANEL SLIDER: CHAT DENGAN CATATAN --- */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setIsChatOpen(false)} />
      )}

      <div className={`fixed inset-y-0 right-0 z-[70] w-full md:w-[400px] bg-card border-l border-border shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Nexa AI Chat</h3>
              <p className="text-[11px] text-muted-foreground">Tanya apapun soal catatan ini</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={() => setIsChatOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3">
              <MessageSquare className="w-12 h-12" />
              <p className="text-sm">Belum ada obrolan.<br/>Tanyakan inti, ide, atau ringkasan spesifik dari draf catatanmu!</p>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div 
                className={`px-4 py-2.5 text-sm rounded-2xl max-w-[85%] leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm border border-border/50"}`}
                dangerouslySetInnerHTML={{ __html: msg.role === "ai" ? formatMessageContent(msg.content) : msg.content }}
              />
            </div>
          ))}
          
          {isChatLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="px-4 py-3 bg-muted rounded-2xl rounded-tl-sm border border-border/50 flex gap-1.5 items-center h-10">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-75" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-border/50 bg-background flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            placeholder="Ketik pertanyaanmu..."
            className="flex-1 bg-muted px-4 py-3 text-sm rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
          />
          <Button size="icon" className="rounded-xl shrink-0 h-12 w-12 shadow-md bg-primary hover:bg-primary/90" onClick={handleSendChat} disabled={isChatLoading || !chatInput.trim()}>
            <Send className="w-5 h-5 ml-0.5" />
          </Button>
        </div>
      </div>
    </>
  );
}