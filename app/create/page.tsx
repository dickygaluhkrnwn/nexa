"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addNote } from "@/lib/notes-service";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { Button } from "@/components/ui/button";
import { Loader2, Save, ArrowLeft, Wand2, Tag as TagIcon, Calendar } from "lucide-react";
import Link from "next/link";

export default function CreateNotePage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  
  // State baru untuk fitur Tugas (To-Do)
  const [isTodo, setIsTodo] = useState(false);
  const [dueDate, setDueDate] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Silakan login terlebih dahulu.</p>
        <Button variant="link" onClick={() => router.push('/')}>Kembali ke Home</Button>
      </div>
    );
  }

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
      throw new Error(error.message || "Terjadi kesalahan koneksi ke server AI.");
    }
  };

  const handleSummarize = async () => {
    const plainText = content.replace(/<[^>]+>/g, ' ').trim();
    if (!plainText && !title) return alert("Catatan masih kosong!");

    setIsSummarizing(true);
    try {
      const result = await callAI("summarize", `Judul: ${title}\n\nIsi: ${plainText}`);
      setAiSummary(result);
    } catch (error: any) {
      console.error(error);
      alert(`Gagal merangkum: ${error.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSave = async () => {
    const plainText = content.replace(/<[^>]+>/g, ' ').trim();
    if (!title.trim() && !plainText) return; 
    
    setIsSaving(true);
    let finalTags = [...tags];

    try {
      if (finalTags.length === 0 && (title.trim() || plainText)) {
        try {
          const result = await callAI("auto-tag", `Judul: ${title}\n\nIsi: ${plainText}`);
          if (result) {
            finalTags = result.split(',').map((t: string) => t.trim()).filter(Boolean);
            setTags(finalTags);
          }
        } catch (e) {
          console.error("Auto-tagging gagal...", e);
        }
      }

      await addNote({
        title: title || "Tanpa Judul",
        content: content,
        tags: finalTags,
        isTodo: isTodo, // Menyimpan status tugas
        dueDate: isTodo && dueDate ? dueDate : null, // Menyimpan tenggat waktu jika ada
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
    <div className="p-4 pb-24 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || (!title.trim() && content === '<p></p>')}
          className="rounded-full rounded-tr-none px-6"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isSaving ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>

      <div>
        <input
          type="text"
          placeholder="Judul Catatan..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-3xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/50 focus:ring-0"
        />
      </div>

      {/* Opsi Jadikan Tugas (To-Do) */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-muted/30 border border-border rounded-xl">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isTodo}
            onChange={(e) => setIsTodo(e.target.checked)}
            className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50 cursor-pointer"
          />
          <span className="text-sm font-medium">Jadikan Tugas</span>
        </label>

        {isTodo && (
          <div className="flex items-center gap-2 border-l border-border pl-4 animate-in fade-in slide-in-from-left-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="text-sm bg-transparent border-none outline-none focus:ring-0 text-foreground"
            />
          </div>
        )}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span key={i} className="px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-md flex items-center">
              <TagIcon className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-6">
        <h3 className="text-sm font-medium text-muted-foreground">Isi Catatan</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSummarize} 
          disabled={isSummarizing || (!title.trim() && !content.replace(/<[^>]+>/g, '').trim())}
          className="text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900 hover:bg-purple-50 dark:hover:bg-purple-900/20"
        >
          {isSummarizing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
          Ringkas dengan AI
        </Button>
      </div>

      {aiSummary && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-purple-500/20 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 mb-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
            <Wand2 className="w-4 h-4" />
            <span>Ringkasan Cerdas AI</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{aiSummary}</p>
        </div>
      )}

      <div>
        <TiptapEditor content={content} onChange={setContent} />
      </div>
    </div>
  );
}