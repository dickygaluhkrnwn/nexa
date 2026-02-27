"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, updateNote, deleteNote, NoteData } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Calendar, CheckCircle2, Circle, 
  ArrowRight, ListTodo, Trash2, AlertCircle, 
  Clock, CheckSquare
} from "lucide-react";
import Link from "next/link";

// Kita memperluas tipe NoteData untuk menampung status isCompleted
interface TodoItem extends NoteData {
  id: string;
  isCompleted?: boolean;
}

export default function TodoPage() {
  const { user, loading: authLoading } = useAuth();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTodos = async () => {
    if (!user) return;
    try {
      const data = await getUserNotes(user.uid);
      // Filter hanya catatan yang ditandai sebagai "Tugas"
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
  }, [user, authLoading]);

  // Fungsi untuk menandai tugas selesai/belum selesai
  const toggleComplete = async (todo: TodoItem) => {
    const newStatus = !todo.isCompleted;
    
    // Optimistic update
    setTodos(todos.map(t => t.id === todo.id ? { ...t, isCompleted: newStatus } : t));
    
    try {
      await updateNote(todo.id, { isCompleted: newStatus } as any);
    } catch (error) {
      console.error("Gagal update status:", error);
      alert("Gagal memperbarui status tugas.");
      // Rollback jika gagal
      setTodos(todos.map(t => t.id === todo.id ? { ...t, isCompleted: todo.isCompleted } : t));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    if (confirm("Apakah kamu yakin ingin menghapus tugas ini?")) {
      // Optimistic delete
      const previousTodos = [...todos];
      setTodos(todos.filter(t => t.id !== id));
      
      try {
        await deleteNote(id);
      } catch (error) {
        alert("Gagal menghapus tugas.");
        setTodos(previousTodos); // Rollback
      }
    }
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

  // Dapatkan string tanggal hari ini (YYYY-MM-DD) sesuai zona waktu lokal
  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(today.getTime() - offset)).toISOString().split('T')[0];
  const todayStr = localISOTime;

  // Kategori Tugas Tertunda
  const overdue = pendingTodos.filter(t => t.dueDate && t.dueDate < todayStr);
  const dueToday = pendingTodos.filter(t => t.dueDate === todayStr);
  const upcomingAndNoDate = pendingTodos.filter(t => !t.dueDate || t.dueDate > todayStr);

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
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/create">Buat Tugas Baru</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          
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
                    <Link href={`/edit/${todo.id}`} className="hover:underline">
                      <h3 className="font-medium text-muted-foreground line-through truncate">
                        {todo.title || "Tanpa Judul"}
                      </h3>
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
    </div>
  );
}

// Komponen Pembantu (Card Tugas) agar kode lebih rapi
function TodoCard({ 
  todo, 
  onToggle, 
  onDelete, 
  isOverdue = false 
}: { 
  todo: TodoItem; 
  onToggle: () => void; 
  onDelete: (e: React.MouseEvent) => void;
  isOverdue?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 p-4 bg-card border rounded-xl shadow-sm transition-all hover:shadow-md group ${isOverdue ? 'border-destructive/50 bg-destructive/5' : 'border-border'}`}>
      <button onClick={onToggle} className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0">
        <Circle className="w-5 h-5" />
      </button>
      
      <div className="flex-1 min-w-0">
        <Link href={`/edit/${todo.id}`} className="block group/link">
          <h3 className="font-medium text-foreground truncate group-hover/link:text-primary transition-colors">
            {todo.title || "Tanpa Judul"}
          </h3>
          {todo.dueDate && (
            <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${isOverdue ? 'text-destructive' : 'text-orange-500'}`}>
              <Calendar className="w-3 h-3" />
              <span>Tenggat: {todo.dueDate}</span>
            </div>
          )}
        </Link>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Link href={`/edit/${todo.id}`}>
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