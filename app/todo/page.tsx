"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, updateNote, NoteData } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, CheckCircle2, Circle, ArrowRight, ListTodo } from "lucide-react";
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
    
    // Optimistic update (UI langsung berubah sebelum ke database biar terasa cepat)
    setTodos(todos.map(t => t.id === todo.id ? { ...t, isCompleted: newStatus } : t));
    
    try {
      // Menyimpan status isCompleted ke Firebase (kita override type karena di awal belum kita definisikan)
      await updateNote(todo.id, { isCompleted: newStatus } as any);
    } catch (error) {
      console.error("Gagal update status:", error);
      alert("Gagal memperbarui status tugas.");
      // Rollback jika gagal
      setTodos(todos.map(t => t.id === todo.id ? { ...t, isCompleted: todo.isCompleted } : t));
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

  // Pisahkan tugas yang sudah selesai dan belum
  const pendingTodos = todos.filter(t => !t.isCompleted);
  const completedTodos = todos.filter(t => t.isCompleted);

  return (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500">
      {/* Header Halaman */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-xl">
          <ListTodo className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Daftar Tugas</h1>
          <p className="text-sm text-muted-foreground">Fokus selesaikan hari ini!</p>
        </div>
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
          {/* Daftar Belum Selesai */}
          {pendingTodos.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Belum Selesai ({pendingTodos.length})
              </h2>
              {pendingTodos.map(todo => (
                <div key={todo.id} className="flex items-start gap-3 p-4 bg-card border border-border rounded-xl shadow-sm transition-all hover:shadow-md">
                  <button onClick={() => toggleComplete(todo)} className="mt-0.5 text-muted-foreground hover:text-primary transition-colors">
                    <Circle className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <Link href={`/edit/${todo.id}`} className="hover:underline group">
                      <h3 className="font-medium text-foreground truncate group-hover:text-primary">
                        {todo.title || "Tanpa Judul"}
                      </h3>
                    </Link>
                    {todo.dueDate && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-orange-500 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>Tenggat: {todo.dueDate}</span>
                      </div>
                    )}
                  </div>
                  <Link href={`/edit/${todo.id}`}>
                    <Button variant="ghost" size="icon" className="w-8 h-8 opacity-50 hover:opacity-100">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Daftar Selesai */}
          {completedTodos.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Selesai ({completedTodos.length})
              </h2>
              {completedTodos.map(todo => (
                <div key={todo.id} className="flex items-start gap-3 p-4 bg-muted/30 border border-border rounded-xl opacity-75 transition-all hover:opacity-100">
                  <button onClick={() => toggleComplete(todo)} className="mt-0.5 text-primary hover:text-primary/80 transition-colors">
                    <CheckCircle2 className="w-5 h-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <Link href={`/edit/${todo.id}`} className="hover:underline">
                      <h3 className="font-medium text-muted-foreground line-through truncate">
                        {todo.title || "Tanpa Judul"}
                      </h3>
                    </Link>
                    {todo.dueDate && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>Tenggat: {todo.dueDate}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}