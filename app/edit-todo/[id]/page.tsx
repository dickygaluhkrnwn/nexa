"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { getNote, updateNote, deleteNote } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Save, ArrowLeft, Calendar, 
  AlignLeft, Repeat, AlertCircle, Clock, Trash2
} from "lucide-react";
import Link from "next/link";

export default function EditTodoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const todoId = params.id as string;
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [dialog, setDialog] = useState<{
    isOpen: boolean; 
    title: string; 
    message: string;
    type: "alert" | "confirm";
    onConfirm?: () => void;
  }>({
    isOpen: false, title: "", message: "", type: "alert"
  });

  const showAlert = (title: string, message: string, onConfirm?: () => void) => setDialog({ isOpen: true, title, message, type: "alert", onConfirm });
  const showConfirm = (title: string, message: string, onConfirm: () => void) => setDialog({ isOpen: true, title, message, type: "confirm", onConfirm });

  useEffect(() => {
    const fetchTodo = async () => {
      if (!user || !todoId) return;
      try {
        const todoData = await getNote(todoId);
        if (todoData && todoData.userId === user.uid && todoData.isTodo) {
          setTitle(todoData.title);
          setContent(todoData.content);
          setDueDate(todoData.dueDate || "");
          setDueTime((todoData as any).dueTime || ""); // Cast to any sementara
          setRecurrence((todoData as any).recurrence || "none");
        } else {
          showAlert("Akses Ditolak", "Tugas tidak ditemukan atau kamu tidak memiliki akses.", () => router.push("/todo"));
        }
      } catch (error) {
        console.error("Gagal memuat tugas:", error);
        showAlert("Gagal", "Terjadi kesalahan saat memuat tugas.", () => router.push("/todo"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodo();
  }, [user, todoId, router]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <div className="pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/todo" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Edit Tugas</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive hover:bg-destructive/10 rounded-full transition-colors">
          <Trash2 className="w-5 h-5" />
        </Button>
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

        {/* Input Deskripsi */}
        <div className="flex gap-3">
          <AlignLeft className="w-5 h-5 text-muted-foreground mt-3 shrink-0" />
          <textarea
            placeholder="Tambahkan detail tugas..."
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
          <Button onClick={handleUpdate} disabled={isSaving || !title.trim()} className="rounded-full px-8 py-6 bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 shadow-xl text-white font-bold border-0">
            {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} 
            {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </div>
      </div>

      {/* Modal Dialog */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-2xl w-full max-w-sm text-center flex flex-col items-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${dialog.type === 'confirm' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-xl mb-2">{dialog.title}</h3>
            <p className="text-sm text-muted-foreground mb-6">{dialog.message}</p>
            
            <div className="flex gap-3 w-full">
              {dialog.type === "confirm" && (
                <Button variant="outline" className="flex-1 rounded-xl h-11 border-border bg-transparent" onClick={() => setDialog({ ...dialog, isOpen: false })}>Batal</Button>
              )}
              <Button 
                className={`flex-1 rounded-xl h-11 text-white shadow-md ${dialog.type === 'confirm' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`} 
                onClick={() => {
                  if (dialog.type === "confirm" && dialog.onConfirm) dialog.onConfirm();
                  setDialog({ ...dialog, isOpen: false });
                }}
              >
                {dialog.type === "confirm" ? "Ya, Hapus" : "Oke, Mengerti"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}