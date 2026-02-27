"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addNote } from "@/lib/notes-service";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Save, ArrowLeft, Wand2, 
  Tag as TagIcon, Calendar, Lock, Unlock, 
  Sparkles, CalendarClock, X, Download, FileText, File, Printer,
  Camera // Icon baru untuk Scan Kamera
} from "lucide-react";
import Link from "next/link";

export default function CreateNotePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  // State Tags
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  // State Pengaturan Catatan
  const [isTodo, setIsTodo] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [isHidden, setIsHidden] = useState(false); 
  
  // State Ekspor & Loading AI
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // Reference & State untuk OCR (Kamera)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);

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
    if (!iframeDoc) return;

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
  // ---------------------------------------------

  // --- API AI ---
  const callAI = async (payload: any) => {
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
    if (!plainText && !title) return alert("Catatan masih kosong!");

    setIsSummarizing(true);
    try {
      const result = await callAI({ action: "summarize", content: `Judul: ${title}\n\nIsi: ${plainText}` });
      setAiSummary(result);
    } catch (error: any) {
      alert(`Gagal merangkum: ${error.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateTags = async () => {
    const plainText = content.replace(/<[^>]+>/g, ' ').trim();
    if (!plainText && !title) return alert("Tulis sesuatu dulu agar AI bisa menebak tag-nya!");

    setIsGeneratingTags(true);
    try {
      const result = await callAI({ action: "auto-tag", content: `Judul: ${title}\n\nIsi: ${plainText}` });
      if (result) {
        const newTags = result.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean);
        setTags(Array.from(new Set([...tags, ...newTags])));
      }
    } catch (error: any) {
      alert("Gagal menebak tag.");
    } finally {
      setIsGeneratingTags(false);
    }
  };

  // --- FUNGSI SCAN GAMBAR KE TEKS (OCR) ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input agar file yang sama bisa dipilih lagi nanti
    e.target.value = "";
    setIsScanning(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        // Ambil Base64 murni tanpa header data URL
        const base64String = (reader.result as string).split(',')[1];
        const mimeType = file.type;

        try {
          const extractedHtml = await callAI({ 
            action: "ocr", 
            imageBase64: base64String, 
            mimeType: mimeType 
          });

          // Bersihkan jika AI masih mengirimkan backticks markdown
          const cleanHtml = extractedHtml.replace(/```html/g, '').replace(/```/g, '').trim();

          // Masukkan ke editor (gabung dengan konten yang sudah ada)
          setContent((prev) => prev + (prev ? "<br><br>" : "") + cleanHtml);
          
          // Beri judul otomatis jika masih kosong
          if (!title.trim()) setTitle("Catatan dari Gambar");

        } catch (apiError: any) {
          alert(`Gagal memproses gambar: ${apiError.message}`);
        } finally {
          setIsScanning(false);
        }
      };
      // Mulai baca file
      reader.readAsDataURL(file);
    } catch (error) {
      setIsScanning(false);
      alert("Gagal membaca file gambar.");
    }
  };
  // ---------------------------------------------

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
        } catch (e) {
          console.error("Auto-tagging gagal...", e);
        }
      }

      await addNote({
        title: title || "Tanpa Judul",
        content: content,
        tags: finalTags,
        isTodo: isTodo,
        dueDate: isTodo && dueDate ? dueDate : null,
        isHidden: isHidden,
        userId: user.uid,
      });
      
      router.push("/");
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      alert("Gagal menyimpan catatan.");
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      
      <div className="sticky top-14 z-40 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button variant="outline" onClick={() => setShowExportMenu(!showExportMenu)} className="rounded-full px-4 border-border bg-card hover:bg-muted">
              <Download className="w-4 h-4 mr-2" /> Unduh
            </Button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 p-1 animate-in fade-in slide-in-from-top-2">
                  <button onClick={handleExportPDF} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted font-medium text-red-500"><Printer className="w-4 h-4" /> Simpan PDF</button>
                  <button onClick={handleExportDOC} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted font-medium text-blue-500"><FileText className="w-4 h-4" /> Export DOC Word</button>
                  <button onClick={handleExportTXT} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted font-medium text-foreground"><File className="w-4 h-4" /> Teks Biasa (TXT)</button>
                </div>
              </>
            )}
          </div>

          <Button onClick={handleSave} disabled={isSaving || (!title.trim() && content === '<p></p>')} className="rounded-full px-6 bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-md text-white border-0">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {isSaving ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        <div>
          <input type="text" placeholder="Judul Catatan..." value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-4xl font-extrabold tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/30 focus:ring-0" autoFocus />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <span key={tag} className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-lg flex items-center gap-1.5 animate-in zoom-in-95">
              <TagIcon className="w-3 h-3" /> {tag}
              <button onClick={() => removeTag(tag)} className="hover:text-destructive transition-colors rounded-full p-0.5"><X className="w-3 h-3" /></button>
            </span>
          ))}
          <input type="text" placeholder={tags.length === 0 ? "Ketik tag lalu Enter..." : "+ Tambah tag..."} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleKeyDownTag} className="bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground focus:ring-0 min-w-[120px]" />
        </div>

        {/* --- MENU QUICK ACTIONS --- */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50">
          
          {/* Input Hidden untuk Kamera / Galeri */}
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
          />
          
          {/* Tombol Scan AI (Baru) */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-sm transition-all"
          >
            {isScanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Camera className="w-4 h-4 mr-2" />} 
            {isScanning ? "Membaca..." : "Scan Gambar"}
          </Button>

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

        {isTodo && (
          <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <div className="p-2 bg-white/50 dark:bg-black/20 rounded-xl"><Calendar className="w-5 h-5 text-orange-600" /></div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-0.5">Tenggat Waktu (Opsional)</p>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-foreground font-medium p-0" />
            </div>
          </div>
        )}

        {aiSummary && (
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-purple-500/10 border border-purple-500/20 animate-in fade-in zoom-in-95 shadow-sm">
            <div className="absolute top-0 right-0 p-2">
              <button onClick={() => setAiSummary(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full"><X className="w-4 h-4"/></button>
            </div>
            <div className="flex items-center gap-2 mb-3 text-purple-600 dark:text-purple-400 font-bold text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4" /><span>Ringkasan Cerdas AI</span>
            </div>
            <p className="text-sm text-foreground/80 leading-relaxed font-medium">{aiSummary}</p>
          </div>
        )}

        <div className="pt-2">
          <TiptapEditor content={content} onChange={setContent} />
        </div>
      </div>
    </div>
  );
}