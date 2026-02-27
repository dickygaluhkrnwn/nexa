"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, updateNote, deleteNote, addNote, NoteData } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Calendar, CheckCircle2, Circle, 
  ArrowRight, ListTodo, Trash2, AlertCircle, 
  Clock, CheckSquare, Pin, Repeat
} from "lucide-react";
import Link from "next/link";

interface TodoItem extends NoteData {
  id: string;
  isCompleted?: boolean;
  isPinned?: boolean;
}

export default function TodoPage() {
  const { user, loading: authLoading } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

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

  const showAlert = (title: string, message: string) => {
    setDialog({ isOpen: true, title, message, type: "alert" });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({ isOpen: true, title, message, type: "confirm", onConfirm });
  };
  // ---------------------------------

  const fetchTodos = async () => {
    if (!user) return;
    try {
      const data = await getUserNotes(user.uid);
      const todoData = data.filter((note: any) => note.isTodo) as TodoItem[];
      setTodos(todoData);
    } catch (error) {
      console.error("Gagal memuat tugas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTodos();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- LOGIKA CERDAS: TOGGLE COMPLETE & RECURRENCE ---
  const toggleComplete = async (todo: TodoItem) => {
    if (!user) return; // Mencegah error 'user is possibly null'

    const newStatus = !todo.isCompleted;
    
    // Optimistic update
    setTodos(todos.map(t => t.id === todo.id ? { ...t, isCompleted: newStatus } : t));
    
    try {
      // Jika tugas ini dicentang selesai (true) DAN merupakan tugas berulang (Looping)
      if (newStatus === true && todo.recurrence && todo.recurrence !== 'none') {
        
        // 1. Hitung tanggal jatuh tempo berikutnya
        const currentDue = todo.dueDate ? new Date(todo.dueDate) : new Date();
        const nextDue = new Date(currentDue);
        
        if (todo.recurrence === 'daily') nextDue.setDate(currentDue.getDate() + 1);
        else if (todo.recurrence === 'weekly') nextDue.setDate(currentDue.getDate() + 7);
        else if (todo.recurrence === 'monthly') nextDue.setMonth(currentDue.getMonth() + 1);
        
        const nextDueStr = nextDue.toISOString().split('T')[0];

        // 2. Kloning (Buat tugas baru) untuk masa depan
        // Menggunakan 'as any' untuk membypass validasi tipe isCompleted yang hanya ada di TodoItem
        await addNote({
          title: todo.title,
          content: todo.content,
          tags: todo.tags || [],
          isTodo: true,
          dueDate: nextDueStr,
          dueTime: (todo as any).dueTime || null, // Jangan lupakan dueTime
          recurrence: todo.recurrence, // Wariskan sifat berulangnya
          isHidden: todo.isHidden || false,
          isPinned: todo.isPinned || false,
          isCompleted: false, // Tugas masa depan belum selesai
          userId: user.uid,
        } as any);

        // 3. Matikan recurrence pada tugas yang HARI INI, agar kalau dicentang ulang nggak kloning lagi
        await updateNote(todo.id, { isCompleted: true, recurrence: 'none' } as any);
        
        showAlert("Tugas Berulang", `Tugas telah diselesaikan! Jadwal berikutnya otomatis dibuat untuk ${nextDueStr}.`);
        fetchTodos(); // Sinkronisasi ulang untuk mendapatkan tugas baru

      } else {
        // Jika tugas biasa (bukan rutinitas), update seperti biasa
        await updateNote(todo.id, { isCompleted: newStatus } as any);
      }

    } catch (error) {
      console.error("Gagal update status:", error);
      showAlert("Gagal", "Terjadi kesalahan. Gagal memperbarui status tugas.");
      // Rollback jika gagal
      setTodos(todos.map(t => t.id === todo.id ? { ...t, isCompleted: todo.isCompleted } : t));
    }
  };
  // ----------------------------------------------------

  // --- FUNGSI TOGGLE PIN ---
  const handleTogglePin = async (todo: TodoItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newPinStatus = !todo.isPinned;
    
    setTodos(todos.map(t => t.id === todo.id ? { ...t, isPinned: newPinStatus } : t));
    
    try {
      await updateNote(todo.id, { isPinned: newPinStatus } as any);
    } catch (error) {
      showAlert("Gagal", "Gagal menyematkan tugas.");
      setTodos(todos.map(t => t.id === todo.id ? { ...t, isPinned: todo.isPinned } : t));
    }
  };
  // -------------------------

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    showConfirm(
      "Hapus Tugas?", 
      "Apakah kamu yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan.", 
      async () => {
        const previousTodos = [...todos];
        setTodos(prev => prev.filter(t => t.id !== id));
        try {
          await deleteNote(id);
        } catch (error) {
          showAlert("Gagal", "Terjadi kesalahan saat menghapus tugas.");
          setTodos(previousTodos);
        }
      }
    );
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Silakan login untuk melihat tugas.</p>
        <Button asChild><Link href="/">Kembali ke Home</Link></Button>
      </div>
    );
  }

  // Pengelompokan & Statistik
  const completedTodos = todos.filter(t => t.isCompleted);
  const pendingTodos = todos.filter(t => !t.isCompleted);
  
  const progressPercentage = todos.length > 0 
    ? Math.round((completedTodos.length / todos.length) * 100) 
    : 0;

  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(today.getTime() - offset)).toISOString().split('T')[0];
  const todayStr = localISOTime;

  // Kategori Tugas Tertunda
  const pinnedTodos = pendingTodos.filter(t => t.isPinned); // Grup Khusus Pin
  const unpinnedPending = pendingTodos.filter(t => !t.isPinned);

  const overdue = unpinnedPending.filter(t => t.dueDate && t.dueDate < todayStr);
  const dueToday = unpinnedPending.filter(t => t.dueDate === todayStr);
  const upcomingAndNoDate = unpinnedPending.filter(t => !t.dueDate || t.dueDate > todayStr);

  return (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500">
      
      {/* Header Halaman & Progress */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-xl">
            <CheckSquare className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Tugas Saya</h1>
            <p className="text-sm text-muted-foreground">
              {pendingTodos.length} tugas tersisa
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {todos.length > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Progress Harian</span>
              <span className="text-primary">{progressPercentage}% Selesai</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {todos.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-border rounded-2xl bg-muted/20">
          <p className="text-muted-foreground mb-4">Belum ada tugas yang dibuat.</p>
          <Button asChild variant="outline" size="sm" className="rounded-full border-orange-500 text-orange-500 hover:bg-orange-500/10">
            <Link href="/create-todo">Buat Tugas Baru</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">

          {/* 0. DISEMATKAN (Pinned) */}
          {pinnedTodos.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-primary flex items-center gap-2">
                <Pin className="w-4 h-4 fill-primary" /> Disematkan ({pinnedTodos.length})
              </h2>
              {pinnedTodos.map(todo => (
                <TodoCard 
                  key={todo.id} 
                  todo={todo} 
                  onToggle={() => toggleComplete(todo)} 
                  onDelete={(e) => handleDelete(todo.id, e)} 
                  onTogglePin={(e) => handleTogglePin(todo, e)}
                  isPinned={true}
                />
              ))}
            </div>
          )}
          
          {/* 1. TERLEWAT (Overdue) */}
          {overdue.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-destructive flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Terlewat ({overdue.length})
              </h2>
              {overdue.map(todo => (
                <TodoCard 
                  key={todo.id} 
                  todo={todo} 
                  onToggle={() => toggleComplete(todo)} 
                  onDelete={(e) => handleDelete(todo.id, e)} 
                  onTogglePin={(e) => handleTogglePin(todo, e)}
                  isOverdue={true} 
                />
              ))}
            </div>
          )}

          {/* 2. HARI INI (Today) */}
          {dueToday.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-orange-500 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Hari Ini ({dueToday.length})
              </h2>
              {dueToday.map(todo => (
                <TodoCard 
                  key={todo.id} 
                  todo={todo} 
                  onToggle={() => toggleComplete(todo)} 
                  onDelete={(e) => handleDelete(todo.id, e)} 
                  onTogglePin={(e) => handleTogglePin(todo, e)}
                />
              ))}
            </div>
          )}

          {/* 3. MENDATANG / TANPA TANGGAL */}
          {upcomingAndNoDate.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Mendatang ({upcomingAndNoDate.length})
              </h2>
              {upcomingAndNoDate.map(todo => (
                <TodoCard 
                  key={todo.id} 
                  todo={todo} 
                  onToggle={() => toggleComplete(todo)} 
                  onDelete={(e) => handleDelete(todo.id, e)} 
                  onTogglePin={(e) => handleTogglePin(todo, e)}
                />
              ))}
            </div>
          )}

          {/* 4. SELESAI (Completed) */}
          {completedTodos.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-border">
              <h2 className="text-sm font-semibold text-muted-foreground">
                Selesai ({completedTodos.length})
              </h2>
              {completedTodos.map(todo => (
                <div key={todo.id} className="flex items-start gap-3 p-4 bg-muted/30 border border-border rounded-xl opacity-75 hover:opacity-100 transition-all group">
                  <button onClick={() => toggleComplete(todo)} className="mt-0.5 text-primary hover:text-primary/80 transition-colors shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    {/* Ubah Link href dari /edit/ menjadi /edit-todo/ */}
                    <Link href={`/edit-todo/${todo.id}`} className="hover:underline">
                      <h3 className="font-medium text-muted-foreground line-through truncate">
                        {todo.title || "Tanpa Judul"}
                      </h3>
                      {todo.recurrence && todo.recurrence !== 'none' && (
                        <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-blue-500/70">
                          <Repeat className="w-3 h-3" /> Rutinitas Selesai
                        </div>
                      )}
                    </Link>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={(e) => handleDelete(todo.id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CUSTOM DIALOG MODAL */}
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
                <Button variant="outline" className="flex-1 rounded-xl h-11 border-border bg-transparent" onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}>
                  Batal
                </Button>
              )}
              <Button 
                className={`flex-1 rounded-xl h-11 text-white shadow-md ${dialog.type === 'confirm' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`} 
                onClick={() => {
                  if (dialog.type === "confirm" && dialog.onConfirm) dialog.onConfirm();
                  setDialog(prev => ({ ...prev, isOpen: false }));
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

// Komponen Pembantu (Card Tugas)
function TodoCard({ 
  todo, 
  onToggle, 
  onDelete,
  onTogglePin,
  isOverdue = false,
  isPinned = false
}: { 
  todo: TodoItem; 
  onToggle: () => void; 
  onDelete: (e: React.MouseEvent) => void;
  onTogglePin?: (e: React.MouseEvent) => void;
  isOverdue?: boolean;
  isPinned?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 p-4 bg-card border rounded-xl shadow-sm transition-all hover:shadow-md group ${isPinned ? 'border-primary/40' : (isOverdue ? 'border-destructive/50 bg-destructive/5' : 'border-border')}`}>
      <button onClick={onToggle} className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0">
        <Circle className="w-5 h-5" />
      </button>
      
      <div className="flex-1 min-w-0">
        {/* Ubah Link href dari /edit/ menjadi /edit-todo/ */}
        <Link href={`/edit-todo/${todo.id}`} className="block group/link">
          <h3 className="font-medium text-foreground truncate group-hover/link:text-primary transition-colors">
            {todo.title || "Tanpa Judul"}
          </h3>
          
          <div className="flex items-center gap-3 mt-1.5 flex-wrap">
            {todo.dueDate && (
              <div className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-destructive' : 'text-orange-500'}`}>
                <Calendar className="w-3 h-3" />
                {/* Tambahkan tampilan Waktu jika ada */}
                <span>{todo.dueDate} {(todo as any).dueTime ? `• ${(todo as any).dueTime}` : ''}</span>
              </div>
            )}
            
            {/* UI Indikator Tugas Berulang */}
            {todo.recurrence && todo.recurrence !== 'none' && (
              <div className="flex items-center gap-1 text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">
                <Repeat className="w-3 h-3" />
                <span>
                  {todo.recurrence === 'daily' ? 'Harian' : 
                   todo.recurrence === 'weekly' ? 'Mingguan' : 'Bulanan'}
                </span>
              </div>
            )}
          </div>
        </Link>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onTogglePin && (
          <Button 
            variant="ghost" 
            size="icon" 
            className={`w-8 h-8 ${isPinned ? 'text-primary bg-primary/10 opacity-100' : 'text-muted-foreground hover:text-primary hover:bg-muted'}`} 
            onClick={onTogglePin}
          >
            <Pin className={`w-4 h-4 ${isPinned ? 'fill-primary' : ''}`} />
          </Button>
        )}
        {/* Ubah Link href dari /edit/ menjadi /edit-todo/ */}
        <Link href={`/edit-todo/${todo.id}`}>
          <Button variant="ghost" size="icon" className="w-8 h-8 text-muted-foreground hover:text-primary">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}