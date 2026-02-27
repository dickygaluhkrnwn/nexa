"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getNote, updateNote } from "@/lib/notes-service";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Save, ArrowLeft, Wand2, 
  Tag as TagIcon, Calendar, Lock, Unlock, 
  Sparkles, CalendarClock, X, Download, FileText, File, Printer,
  AlertCircle // Tambahan icon AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function EditNotePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  // State Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  // State Pengaturan Catatan
  const [isTodo, setIsTodo] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [isHidden, setIsHidden] = useState(false);

  // State Ekspor & Loading
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // --- STATE CUSTOM DIALOG MODAL ---
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "alert" | "confirm";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  const showAlert = (title: string, message: string, onConfirm?: () => void) => {
    setDialog({ isOpen: true, title, message, type: "alert", onConfirm });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({ isOpen: true, title, message, type: "confirm", onConfirm });
  };
  // ---------------------------------

  useEffect(() => {
    const fetchNote = async () => {
      if (!user || !noteId) return;
      try {
        const noteData = await getNote(noteId);
        if (noteData && noteData.userId === user.uid) {
          setTitle(noteData.title);
          setContent(noteData.content);
          setTags(noteData.tags || []);
          setIsTodo(noteData.isTodo || false);
          setDueDate(noteData.dueDate || "");
          setIsHidden((noteData as any).isHidden || false);
        } else {
          showAlert("Akses Ditolak", "Catatan tidak ditemukan atau kamu tidak memiliki akses.", () => {
            router.push("/");
          });
        }
      } catch (error) {
        console.error("Gagal memuat catatan:", error);
        showAlert("Gagal", "Terjadi kesalahan saat memuat catatan.", () => {
          router.push("/");
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [user, noteId, router]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Silakan login terlebih dahulu.</p>
        <Button variant="link" onClick={() => router.push('/')}>Kembali ke Home</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Handle Manual Tags
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

  // --- FUNGSI EXPORT (UNDUH DOC, TXT, PDF) ---
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
            body { 
              font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              padding: 40px; 
              color: #111; 
              line-height: 1.6; 
            }
            h1 { 
              font-size: 32px; 
              font-weight: 800; 
              border-bottom: 2px solid #eaeaea; 
              padding-bottom: 12px; 
              margin-bottom: 24px; 
              color: #000; 
            }
            p { margin-bottom: 1em; }
            ul { list-style-type: disc; margin-left: 24px; margin-bottom: 1em; }
            ol { list-style-type: decimal; margin-left: 24px; margin-bottom: 1em; }
            li { margin-bottom: 0.5em; }
            h2 { font-size: 24px; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; }
            h3 { font-size: 20px; font-weight: 600; margin-top: 1.2em; margin-bottom: 0.5em; }
            ul[data-type="taskList"] { list-style: none; margin-left: 0; padding-left: 0; }
            li[data-type="taskItem"] { display: flex; align-items: flex-start; margin-bottom: 0.5em; }
            li[data-type="taskItem"] > label { margin-right: 8px; margin-top: 4px; }
          </style>
        </head>
        <body>
          <h1>${title || 'Tanpa Judul'}</h1>
          <div class="content">${content}</div>
        </body>
      </html>
    `);
    iframeDoc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
  };
  // ---------------------------------------------

  // Panggilan AI Utama
  const callAI = async (action: "auto-tag" | "summarize", textContent: string) => {
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, content: textContent })
      });
      const data = await res.json().catch(() => ({})); 
      if (!res.ok) throw new Error(data.error || "Gagal memanggil AI.");
      return data.result;
    } catch (error: any) {
      console.error("AI Fetch Error:", error);
      throw new Error(error.message || "Terjadi kesalahan koneksi AI.");
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
      const result = await callAI("summarize", `Judul: ${title}\n\nIsi: ${plainText}`);
      setAiSummary(result);
    } catch (error: any) {
      console.error(error);
      showAlert("Gagal AI", `Gagal merangkum: ${error.message}`);
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
      const result = await callAI("auto-tag", `Judul: ${title}\n\nIsi: ${plainText}`);
      if (result) {
        const newTags = result.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean);
        const uniqueTags = Array.from(new Set([...tags, ...newTags]));
        setTags(uniqueTags);
      }
    } catch (error) {
      console.error(error);
      showAlert("Gagal AI", "Gagal menebak tag. Coba lagi nanti.");
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleUpdate = async () => {
    const plainText = content.replace(/<[^>]+>/g, ' ').trim();
    if (!title.trim() && !plainText) return; 
    
    setIsSaving(true);
    let finalTags = [...tags];

    try {
      if (finalTags.length === 0 && (title.trim() || plainText)) {
        try {
          const result = await callAI("auto-tag", `Judul: ${title}\n\nIsi: ${plainText}`);
          if (result) {
            finalTags = result.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean);
          }
        } catch (e) {
          console.error("Auto-tagging gagal...", e);
        }
      }

      await updateNote(noteId, {
        title: title || "Tanpa Judul",
        content: content,
        tags: finalTags,
        isTodo: isTodo,
        dueDate: isTodo && dueDate ? dueDate : null,
        isHidden: isHidden,
      } as any);
      
      router.push("/notes"); 
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      showAlert("Gagal Menyimpan", "Terjadi kesalahan saat menyimpan perubahan.");
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      
      {/* Sticky Header Actions */}
      <div className="sticky top-14 z-40 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between print:hidden">
        <Link href="/notes" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex items-center gap-2">
          {/* Menu Export / Download */}
          <div className="relative">
            <Button 
              variant="outline" 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="rounded-full px-4 border-border bg-card hover:bg-muted"
            >
              <Download className="w-4 h-4 mr-2" />
              Unduh
            </Button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 p-1 animate-in fade-in slide-in-from-top-2">
                  <button onClick={handleExportPDF} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted font-medium text-red-500">
                    <Printer className="w-4 h-4" /> Simpan PDF
                  </button>
                  <button onClick={handleExportDOC} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted font-medium text-blue-500">
                    <FileText className="w-4 h-4" /> Export DOC Word
                  </button>
                  <button onClick={handleExportTXT} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted font-medium text-foreground">
                    <File className="w-4 h-4" /> Teks Biasa (TXT)
                  </button>
                </div>
              </>
            )}
          </div>

          <Button 
            onClick={handleUpdate} 
            disabled={isSaving || (!title.trim() && content === '<p></p>')}
            className="rounded-full px-6 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-md text-white border-0"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6 print:p-0 print:space-y-4">
        {/* Area Judul */}
        <div>
          <input
            type="text"
            placeholder="Judul Catatan..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-4xl font-extrabold tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/30 focus:ring-0 print:text-black print:p-0"
          />
        </div>

        {/* Input & Display Tags */}
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {tags.map((tag) => (
            <span key={tag} className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg flex items-center gap-1.5 animate-in zoom-in-95">
              <TagIcon className="w-3 h-3" /> {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </span>
          ))}
          <input
            type="text"
            placeholder={tags.length === 0 ? "Ketik tag lalu Enter..." : "+ Tambah tag..."}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleKeyDownTag}
            className="bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground focus:ring-0 min-w-[120px]"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 print:hidden">
          <Button variant={isTodo ? "default" : "outline"} size="sm" onClick={() => setIsTodo(!isTodo)} className={`rounded-xl transition-all ${isTodo ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" : "bg-card"}`}>
            <CalendarClock className={`w-4 h-4 mr-2 ${isTodo ? "text-white" : "text-orange-500"}`} /> Jadikan Tugas
          </Button>
          <Button variant={isHidden ? "default" : "outline"} size="sm" onClick={() => setIsHidden(!isHidden)} className={`rounded-xl transition-all ${isHidden ? "bg-purple-600 hover:bg-purple-700 text-white border-purple-600" : "bg-card"}`}>
            {isHidden ? <Lock className="w-4 h-4 mr-2 text-white" /> : <Unlock className="w-4 h-4 mr-2 text-purple-500" />} {isHidden ? "Masuk Brankas" : "Publik"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleGenerateTags} disabled={isGeneratingTags || (!title.trim() && !content.replace(/<[^>]+>/g, '').trim())} className="rounded-xl bg-card hover:bg-primary/5 text-primary border-primary/20">
            {isGeneratingTags ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <TagIcon className="w-4 h-4 mr-2" />} Tebak Tag AI
          </Button>
          <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isSummarizing || (!title.trim() && !content.replace(/<[^>]+>/g, '').trim())} className="rounded-xl bg-card hover:bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/20">
            {isSummarizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} Ringkasan AI
          </Button>
        </div>

        {/* Date Picker */}
        {isTodo && (
          <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2 print:hidden">
            <div className="p-2 bg-white/50 dark:bg-black/20 rounded-xl"><Calendar className="w-5 h-5 text-orange-600" /></div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-0.5">Tenggat Waktu</p>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-foreground font-medium p-0" />
            </div>
          </div>
        )}

        {/* AI Summary */}
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

        {/* Rich Text Editor */}
        <div className="pt-2 print:text-black">
          <TiptapEditor content={content} onChange={setContent} />
        </div>
      </div>

      {/* CUSTOM DIALOG MODAL (Menggantikan fungsi alert/confirm bawaan browser) */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 text-center flex flex-col items-center">
            
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${dialog.type === 'confirm' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              <AlertCircle className="w-7 h-7" />
            </div>
            
            <h3 className="font-bold text-xl mb-2">{dialog.title}</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{dialog.message}</p>
            
            <div className="flex gap-3 w-full">
              {dialog.type === "confirm" && (
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-11 border-border bg-transparent" 
                  onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                >
                  Batal
                </Button>
              )}
              <Button 
                className={`flex-1 rounded-xl h-11 text-white shadow-md ${dialog.type === 'confirm' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`} 
                onClick={() => {
                  if (dialog.onConfirm) {
                    dialog.onConfirm();
                  }
                  setDialog(prev => ({ ...prev, isOpen: false }));
                }}
              >
                {dialog.type === "confirm" ? "Ya, Lanjutkan" : "Oke, Mengerti"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}