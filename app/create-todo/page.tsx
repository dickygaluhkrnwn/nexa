"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addNote, SubTask } from "@/lib/notes-service"; // Import SubTask
import { Button } from "@/components/ui/button";
import { 
  Loader2, Save, ArrowLeft, Calendar, 
  AlignLeft, Repeat, Clock, ListTodo, Plus, X, Circle
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 

export default function CreateTodoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showAlert } = useModal(); 
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState(""); 
  const [recurrence, setRecurrence] = useState("none");
  
  // State untuk Sub-Tasks
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [newSubTask, setNewSubTask] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Silakan login terlebih dahulu.</p>
        <Button variant="link" onClick={() => router.push('/')}>Kembali ke Home</Button>
      </div>
    );
  }

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
        subTasks: subTasks, // Memasukkan sub-tugas ke database
        userId: user.uid,
      } as any); 
      router.push("/todo");
    } catch (error) {
      console.error(error);
      showAlert("Gagal", "Terjadi kesalahan saat menyimpan tugas.");
      setIsSaving(false);
    }
  };

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
        {/* Input Judul Utama */}
        <div>
          <input 
            type="text" 
            placeholder="Apa yang ingin kamu selesaikan?" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="w-full text-3xl font-extrabold tracking-tight bg-transparent border-none outline-none placeholder:text-muted-foreground/40 focus:ring-0" 
            autoFocus 
          />
        </div>

        {/* Area Sub-Tasks (Checklist) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ListTodo className="w-5 h-5" />
            <h3 className="font-semibold text-sm uppercase tracking-wider">Sub-Tugas</h3>
          </div>
          
          <div className="space-y-2">
            {subTasks.map((st) => (
              <div key={st.id} className="flex items-start gap-3 bg-card border border-border p-3 rounded-2xl group">
                <Circle className="w-5 h-5 text-muted-foreground/50 shrink-0 mt-0.5" />
                <span className="flex-1 text-sm font-medium leading-relaxed">{st.text}</span>
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
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 z-40 px-4">
        <div className="max-w-2xl mx-auto flex justify-end">
          <Button onClick={handleSave} disabled={isSaving || !title.trim()} className="rounded-full px-8 py-6 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 shadow-xl text-white font-bold border-0">
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} 
            {isSaving ? "Menyimpan..." : "Simpan Tugas"}
          </Button>
        </div>
      </div>
    </div>
  );
}