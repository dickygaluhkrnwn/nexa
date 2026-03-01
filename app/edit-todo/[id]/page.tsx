"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getNote, updateNote, deleteNote, SubTask } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Save, ArrowLeft, AlignLeft, Trash2, CalendarPlus, Sparkles
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 
import { useGemini } from "@/hooks/use-gemini"; // <-- Import Hook AI

// Import komponen yang sudah direfactor
import { SubTaskList } from "@/components/todo/sub-task-list";
import { TaskSettings } from "@/components/todo/task-settings";

export default function EditTodoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const todoId = params.id as string;
  const { showAlert, showConfirm } = useModal(); 
  const { callAI } = useGemini(); // <-- Gunakan Hook AI
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchTodo = async () => {
      if (!user || !todoId) return;
      try {
        const todoData = await getNote(todoId);
        if (todoData && todoData.userId === user.uid && todoData.isTodo) {
          setTitle(todoData.title);
          setContent(todoData.content);
          setDueDate(todoData.dueDate || "");
          setDueTime((todoData as any).dueTime || ""); 
          setRecurrence((todoData as any).recurrence || "none");
          setSubTasks(todoData.subTasks || []); 
        } else {
          showAlert("Akses Ditolak", "Tugas tidak ditemukan atau kamu tidak memiliki akses.");
          router.push("/todo");
        }
      } catch (error) {
        console.error("Gagal memuat tugas:", error);
        showAlert("Gagal", "Terjadi kesalahan saat memuat tugas.");
        router.push("/todo");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodo();
  }, [user, todoId, router, showAlert]); 

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

  // --- LOGIKA AI PROJECT BREAKDOWN ---
  const handleProjectBreakdown = async () => {
    if (!title.trim()) {
      showAlert("Perhatian", "Tuliskan judul proyek atau jadwalnya dulu ya agar AI mengerti!");
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
          const newSubTasks = parsed.subTasks.map((task: any, index: number) => {
            const textValue = typeof task === 'string' ? task : task.text;
            const timeValue = typeof task === 'object' && task.time ? task.time : undefined;
            return {
              id: Date.now().toString() + index.toString(),
              text: textValue,
              time: timeValue,
              isCompleted: false
            };
          });
          setSubTasks(prev => [...prev, ...newSubTasks]);
        }
        
        if (parsed.description) {
          setContent(prev => prev ? prev + "\n\n---\n🎯 AI Strategy:\n" + parsed.description : "🎯 AI Strategy:\n" + parsed.description);
        }

        if (parsed.recommendedDueDate && !dueDate) {
          setDueDate(parsed.recommendedDueDate);
        }
        
        showAlert("Berhasil! ✨", "AI telah memecah tugas dan menyusun jadwalmu.");
      } else {
        throw new Error("Format respons tidak sesuai JSON.");
      }
    } catch (error: any) {
      console.error("Gagal melakukan breakdown:", error);
      if (error.message !== "QUOTA_EXCEEDED") {
        showAlert("Gagal", "AI kebingungan mencerna rencanamu. Coba lengkapi atau perjelas judul tugasnya sedikit.");
      }
    } finally {
      setIsAiLoading(false);
    }
  };
  // -----------------------------------

  // --- FUNGSI GOOGLE CALENDAR SYNC ---
  const handleSyncCalendar = () => {
    if (!title.trim()) {
      showAlert("Perhatian", "Judul tugas tidak boleh kosong untuk disinkronkan ke Kalender.");
      return;
    }

    const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const eventText = encodeURIComponent(title.trim());
    
    // Bersihkan tag HTML dari konten untuk masuk ke deskripsi Google Calendar
    let cleanContent = content.replace(/<[^>]+>/g, '\n').trim();
    
    // Tambahkan daftar sub-tugas ke deskripsi GCal
    if (subTasks.length > 0) {
      cleanContent += "\n\nSub-Tugas:\n" + subTasks.map(st => `- [${st.isCompleted ? 'x' : ' '}] ${st.text}`).join("\n");
    }
    cleanContent += "\n\n---\nDibuat menggunakan Nexa AI 🚀";
    
    const eventDetails = encodeURIComponent(cleanContent);

    let dates = "";
    if (dueDate) {
      try {
        if (dueTime) {
          // Jika ada jam, set durasi default 1 jam
          const dateObj = new Date(`${dueDate}T${dueTime}`);
          const startStr = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
          const endDateObj = new Date(dateObj.getTime() + 60 * 60 * 1000); 
          const endStr = endDateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
          dates = `&dates=${startStr}/${endStr}`;
        } else {
          // Jika tidak ada jam, set sebagai "All-day event" (Seharian penuh)
          const startStr = dueDate.replace(/-/g, "");
          const dateObj = new Date(dueDate);
          dateObj.setDate(dateObj.getDate() + 1); // Google Calendar meminta tanggal akhir eksklusif (H+1)
          const endStr = dateObj.toISOString().split('T')[0].replace(/-/g, "");
          dates = `&dates=${startStr}/${endStr}`;
        }
      } catch (e) {
        console.error("Gagal memformat tanggal untuk GCal", e);
      }
    }

    // Setel pengulangan (Recurrence Rule / RRULE)
    let rrule = "";
    if (recurrence && recurrence !== "none") {
      rrule = `&recur=RRULE:FREQ=${recurrence.toUpperCase()}`;
    }

    // Buka tab baru menuju Google Calendar Event Creator
    const url = `${baseUrl}&text=${eventText}&details=${eventDetails}${dates}${rrule}`;
    window.open(url, '_blank');
  };
  // -----------------------------------

  const handleUpdate = async () => {
    if (!title.trim()) {
      showAlert("Perhatian", "Judul tugas tidak boleh kosong!");
      return;
    }

    setIsSaving(true);
    try {
      await updateNote(todoId, {
        title: title.trim(),
        content: content.trim(),
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        recurrence: recurrence,
        subTasks: subTasks, 
      } as any);
      router.push("/todo");
    } catch (error) {
      console.error(error);
      showAlert("Gagal", "Terjadi kesalahan saat menyimpan perubahan.");
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    showConfirm("Hapus Tugas?", "Apakah kamu yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan.", async () => {
      try {
        await deleteNote(todoId);
        router.push("/todo");
      } catch (error) {
        showAlert("Gagal", "Terjadi kesalahan saat menghapus tugas.");
      }
    });
  };

  return (
    <div className="pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto relative">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/todo" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Edit Tugas</span>
        </div>
        <div className="flex items-center gap-1">
          {/* TOMBOL GOOGLE CALENDAR SYNC */}
          <Button variant="ghost" size="icon" onClick={handleSyncCalendar} className="text-blue-500 hover:bg-blue-500/10 rounded-full transition-colors" title="Simpan ke Google Calendar">
            <CalendarPlus className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 rounded-full transition-colors" title="Hapus Tugas">
            <Trash2 className="w-5 h-5" />
          </Button>
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
          />
          
          {/* Tombol AI Project Breakdown yang sudah diaktifkan */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleProjectBreakdown}
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
          <Button onClick={handleUpdate} disabled={isSaving || !title.trim()} className="rounded-full px-8 py-6 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 shadow-xl text-white font-bold border-0">
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} 
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>

    </div>
  );
}