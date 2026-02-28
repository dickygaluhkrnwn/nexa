"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addNote, SubTask } from "@/lib/notes-service"; 
import { Button } from "@/components/ui/button";
import { Loader2, Save, ArrowLeft, AlignLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 
import { useGemini } from "@/hooks/use-gemini"; // <-- IMPORT HOOK AI

// Import komponen yang sudah direfactor
import { SubTaskList } from "@/components/todo/sub-task-list";
import { TaskSettings } from "@/components/todo/task-settings";

export default function CreateTodoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showAlert } = useModal(); 
  const { callAI } = useGemini(); // <-- PANGGIL HOOK AI
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState(""); 
  const [recurrence, setRecurrence] = useState("none");
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Silakan login terlebih dahulu.</p>
        <Button variant="link" onClick={() => router.push('/')}>Kembali ke Home</Button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!title.trim()) {
      showAlert("Perhatian", "Judul tugas tidak boleh kosong!");
      return;
    }

    setIsSaving(true);
    try {
      await addNote({
        title: title.trim(),
        content: content.trim(),
        tags: [],
        isTodo: true,
        dueDate: dueDate || null,
        dueTime: dueTime || null, 
        recurrence: recurrence,
        isHidden: false,
        isPinned: false,
        isCompleted: false,
        subTasks: subTasks,
        userId: user.uid,
      } as any); 
      router.push("/todo");
    } catch (error) {
      console.error(error);
      showAlert("Gagal", "Terjadi kesalahan saat menyimpan tugas.");
      setIsSaving(false);
    }
  };

  // --- LOGIKA AI PROJECT BREAKDOWN ---
  const handleProjectBreakdown = async () => {
    if (!title.trim()) {
      showAlert("Perhatian", "Tuliskan judul proyeknya dulu ya agar AI mengerti apa yang akan dipecah!");
      return;
    }

    setIsAiLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await callAI({ 
        action: "project-breakdown", 
        content: title,
        context: `Hari ini adalah tanggal ${today}.`
      });
      
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.subTasks && Array.isArray(parsed.subTasks)) {
          const newSubTasks = parsed.subTasks.map((text: string, index: number) => ({
            id: Date.now().toString() + index.toString(),
            text: text,
            isCompleted: false
          }));
          setSubTasks(prev => [...prev, ...newSubTasks]);
        }
        
        if (parsed.description) {
          setContent(prev => prev ? prev + "\n\n---\n🎯 AI Strategy:\n" + parsed.description : "🎯 AI Strategy:\n" + parsed.description);
        }

        if (parsed.recommendedDueDate && !dueDate) {
          setDueDate(parsed.recommendedDueDate);
        }
        
        showAlert("Berhasil! ✨", "AI telah menyusun rencana dan memecah proyekmu menjadi langkah-langkah praktis.");
      } else {
        throw new Error("Format respons tidak sesuai JSON.");
      }
    } catch (error: any) {
      console.error("Gagal melakukan breakdown:", error);
      if (error.message !== "QUOTA_EXCEEDED") {
        showAlert("Gagal", "AI kebingungan mencerna rencanamu. Coba lengkapi judulnya sedikit.");
      }
    } finally {
      setIsAiLoading(false);
    }
  };
  // -----------------------------------

  return (
    <div className="pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/todo" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Buat Tugas</span>
        </div>
      </div>

      <div className="px-5 space-y-6 mt-2">
        
        {/* Input Judul Utama & Tombol AI Magic */}
        <div className="space-y-3">
          <input 
            type="text" 
            placeholder="Apa proyek atau tugasmu?" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="w-full text-3xl font-extrabold tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/40 focus:ring-0" 
            autoFocus 
          />
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleProjectBreakdown} // <-- PASANG FUNGSI KLIK DISINI
            disabled={!title.trim() || isAiLoading}
            className="rounded-xl border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 shadow-sm transition-all active:scale-95"
          >
            {isAiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {isAiLoading ? "Sedang Merancang..." : "AI Project Breakdown"}
          </Button>
        </div>

        {/* Area Sub-Tasks (Komponen Refactored) */}
        <SubTaskList subTasks={subTasks} onChange={setSubTasks} />

        {/* Input Deskripsi Tambahan */}
        <div className="flex gap-3 pt-2">
          <AlignLeft className="w-5 h-5 text-muted-foreground mt-3 shrink-0" />
          <textarea
            placeholder="Catatan tambahan (opsional)..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-transparent border-none outline-none resize-none text-base placeholder:text-muted-foreground/60 min-h-[100px] py-3 focus:ring-0"
          />
        </div>

        <div className="h-px w-full bg-border/50 my-2" />

        {/* Area Pengaturan Task (Komponen Refactored) */}
        <TaskSettings 
          dueDate={dueDate} setDueDate={setDueDate}
          dueTime={dueTime} setDueTime={setDueTime}
          recurrence={recurrence} setRecurrence={setRecurrence}
        />
        
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 z-40 px-4 pointer-events-none">
        <div className="max-w-2xl mx-auto flex justify-end pointer-events-auto">
          <Button onClick={handleSave} disabled={isSaving || !title.trim()} className="rounded-full px-8 py-6 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 shadow-xl text-white font-bold border-0">
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} 
            {isSaving ? "Menyimpan..." : "Simpan Tugas"}
          </Button>
        </div>
      </div>
    </div>
  );
}