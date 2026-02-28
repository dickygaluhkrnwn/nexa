"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getNote, updateNote, deleteNote, SubTask } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Save, ArrowLeft, Calendar, 
  AlignLeft, Repeat, Clock, Trash2,
  ListTodo, Plus, X, Circle, CheckCircle2, CalendarPlus
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 

export default function EditTodoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const todoId = params.id as string;
  const { showAlert, showConfirm } = useModal(); 
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  
  // State untuk Sub-Tasks
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  // --- HANDLER SUB-TASKS ---
  const handleAddSubTask = () => {
    if (!newSubTask.trim()) return;
    const newTask: SubTask = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      text: newSubTask.trim(),
      isCompleted: false
    };
    setSubTasks([...subTasks, newTask]);
    setNewSubTask("");
  };

  const handleRemoveSubTask = (id: string) => {
    setSubTasks(subTasks.filter(st => st.id !== id));
  };

  const handleToggleSubTask = (id: string) => {
    setSubTasks(subTasks.map(st => 
      st.id === id ? { ...st, isCompleted: !st.isCompleted } : st
    ));
  };
  // -------------------------

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
        {/* Input Judul Utama */}
        <div>
          <input 
            type="text" 
            placeholder="Apa yang ingin kamu selesaikan?" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="w-full text-3xl font-extrabold tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/40 focus:ring-0" 
          />
        </div>

        {/* Area Sub-Tasks (Checklist) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <div className="flex items-center gap-2">
              <ListTodo className="w-5 h-5" />
              <h3 className="font-semibold text-sm uppercase tracking-wider">Sub-Tugas</h3>
            </div>
            {subTasks.length > 0 && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {subTasks.filter(s => s.isCompleted).length} / {subTasks.length} Selesai
              </span>
            )}
          </div>
          
          <div className="space-y-2">
            {subTasks.map((st) => (
              <div key={st.id} className={`flex items-start gap-3 p-3 rounded-2xl group transition-all border ${st.isCompleted ? 'bg-muted/30 border-transparent opacity-60' : 'bg-card border-border shadow-sm'}`}>
                <button 
                  onClick={() => handleToggleSubTask(st.id)} 
                  className={`mt-0.5 shrink-0 transition-colors ${st.isCompleted ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
                >
                  {st.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <span className={`flex-1 text-sm font-medium leading-relaxed ${st.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {st.text}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-7 h-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all rounded-full shrink-0" 
                  onClick={() => handleRemoveSubTask(st.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            
            <div className="flex items-center gap-2 mt-2">
              <input 
                type="text" 
                value={newSubTask} 
                onChange={(e) => setNewSubTask(e.target.value)} 
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubTask();
                  }
                }}
                placeholder="Tambah sub-tugas baru..." 
                className="flex-1 bg-muted/50 border border-transparent focus:border-primary/30 px-4 py-3 text-sm rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60"
              />
              <Button onClick={handleAddSubTask} disabled={!newSubTask.trim()} className="h-11 w-11 rounded-2xl shrink-0 shadow-sm">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Input Deskripsi */}
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

        {/* Pengaturan Tanggal, Waktu & Looping */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Tanggal */}
            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl transition-colors hover:border-primary/30 focus-within:border-primary/50">
              <div className="p-2 bg-orange-500/10 rounded-xl"><Calendar className="w-5 h-5 text-orange-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-0.5">Tenggat</p>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-foreground font-medium p-0" />
              </div>
            </div>

            {/* Waktu */}
            <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl transition-colors hover:border-primary/30 focus-within:border-primary/50">
              <div className="p-2 bg-blue-500/10 rounded-xl"><Clock className="w-5 h-5 text-blue-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Waktu</p>
                <input type="time" value={dueTime} onChange={(e) => setDueTime(e.target.value)} className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-foreground font-medium p-0" />
              </div>
            </div>
          </div>

          {/* Looping */}
          <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl transition-colors hover:border-primary/30 focus-within:border-primary/50">
            <div className="p-2 bg-purple-500/10 rounded-xl"><Repeat className="w-5 h-5 text-purple-600" /></div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-0.5">Pengulangan Rutin</p>
              <select 
                value={recurrence} 
                onChange={(e) => setRecurrence(e.target.value)}
                className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-foreground font-medium p-0 appearance-none"
              >
                <option value="none" className="text-foreground bg-background">Hanya Sekali (Tidak Berulang)</option>
                <option value="daily" className="text-foreground bg-background">Setiap Hari</option>
                <option value="weekly" className="text-foreground bg-background">Setiap Minggu</option>
                <option value="monthly" className="text-foreground bg-background">Setiap Bulan</option>
              </select>
            </div>
          </div>
        </div>
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