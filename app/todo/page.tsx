"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, updateNote, deleteNote, addNote } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { 
  Loader2, CheckSquare, LayoutList, CalendarDays, KanbanSquare, Sparkles 
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 
import { PomodoroTimer } from "@/components/todo/pomodoro-timer"; 
import { DragDropContext, DropResult } from "@hello-pangea/dnd"; 
import { useGemini } from "@/hooks/use-gemini"; 

// --- Import Komponen Hasil Refactoring ---
import { TodoItem } from "@/components/todo/types";
import { TodoListView } from "@/components/todo/todo-list-view";
import { TodoCalendarView } from "@/components/todo/todo-calendar-view";
import { TodoKanbanView } from "@/components/todo/todo-kanban-view";
import { WeeklyReviewModal } from "@/components/todo/weekly-review-modal";

type ViewMode = 'list' | 'calendar' | 'kanban';

const getLocalIsoDate = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export default function TodoPage() {
  const { user, loading: authLoading } = useAuth();
  const { showAlert, showConfirm, showQuotaAlert } = useModal(); 
  const { callAI, isAiLoading } = useGemini(); 
  
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reviewData, setReviewData] = useState<any>(null);

  const todayStr = useMemo(() => getLocalIsoDate(new Date()), []);

  const fetchTodos = async () => {
    if (!user) return;
    try {
      const data = await getUserNotes(user.uid);
      let todoData = data.filter((note: any) => note.isTodo) as TodoItem[];
      let hasAutoCompleted = false;

      for (const todo of todoData) {
        if (!todo.isCompleted && todo.dueDate && todo.dueDate < todayStr) {
          if (todo.recurrence && todo.recurrence !== 'none') {
            let nextDue = new Date(todo.dueDate);
            const now = new Date(todayStr);
            while (nextDue <= now) {
              if (todo.recurrence === 'daily') nextDue.setDate(nextDue.getDate() + 1);
              else if (todo.recurrence === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
              else if (todo.recurrence === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
              else break;
            }
            const nextDueStr = getLocalIsoDate(nextDue);

            await addNote({
              title: todo.title,
              content: todo.content,
              tags: todo.tags || [],
              isTodo: true,
              dueDate: nextDueStr,
              dueTime: todo.dueTime || null,
              recurrence: todo.recurrence,
              isHidden: todo.isHidden || false,
              isPinned: todo.isPinned || false,
              isCompleted: false,
              subTasks: todo.subTasks || [], 
              userId: user.uid,
            } as any);

            await updateNote(todo.id, { isCompleted: true, recurrence: 'none' } as any);
          } else {
            await updateNote(todo.id, { isCompleted: true } as any);
          }
          hasAutoCompleted = true;
        }
      }

      if (hasAutoCompleted) {
        const updatedData = await getUserNotes(user.uid);
        todoData = updatedData.filter((note: any) => note.isTodo) as TodoItem[];
      }

      setTodos(todoData);
    } catch (error) {
      console.error("Gagal memuat tugas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchTodos();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]); 

  // --- LOGIKA AI WEEKLY REVIEW ---
  const handleWeeklyReview = async () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = getLocalIsoDate(lastWeek);

    const weeklyTasks = todos.filter(t => t.dueDate && t.dueDate >= lastWeekStr && t.dueDate <= todayStr);

    if (weeklyTasks.length === 0) {
      showAlert("Data Kurang", "Kamu belum memiliki data tugas dalam 7 hari terakhir untuk dianalisis oleh AI.");
      return;
    }

    const contextStr = weeklyTasks.map(t => 
      `- [${t.isCompleted ? 'Selesai' : 'Belum/Terlewat'}] ${t.title} (Target: ${t.dueDate})`
    ).join('\n');

    try {
      const result = await callAI({
        action: "weekly-review",
        content: contextStr
      });

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setReviewData(parsed);
      } else {
        throw new Error("Format respons tidak sesuai JSON.");
      }
    } catch (error: any) {
      console.error("Gagal melakukan review:", error);
      if (error.message === "QUOTA_EXCEEDED") {
        showQuotaAlert();
      } else {
        showAlert("Gagal Menganalisis", "AI kebingungan memproses datamu atau terjadi gangguan server. Coba lagi nanti ya.");
      }
    }
  };

  const handleSaveReview = async () => {
    if (!reviewData || !user) return;
    
    try {
      const contentHtml = `
        <h2>${reviewData.title}</h2>
        <p>${reviewData.summary}</p>
        <br/>
        <h3>💡 Wawasan Pola Kerja</h3>
        <ul>${reviewData.insights.map((i: string) => `<li>${i}</li>`).join('')}</ul>
        <br/>
        <h3>🎯 Fokus Minggu Depan</h3>
        <ul>${reviewData.focusNextWeek.map((i: string) => `<li>${i}</li>`).join('')}</ul>
        <br/>
        <p><strong>Nilai Performa: ${reviewData.grade}</strong></p>
      `;

      await addNote({
        title: `Laporan Mingguan: ${new Date().toLocaleDateString('id-ID')}`,
        content: contentHtml,
        tags: ["Weekly Review"],
        isTodo: false,
        isHidden: false,
        userId: user.uid,
      } as any);

      showAlert("Tersimpan!", "Laporan Mingguan berhasil disimpan ke Arsip di halaman Profil.");
      setReviewData(null);
    } catch (error) {
      showAlert("Gagal", "Terjadi kesalahan saat menyimpan laporan.");
    }
  };
  // --------------------------------

  // --- CRUD HANDLERS ---
  const toggleComplete = async (todo: TodoItem) => {
    if (!user) return; 
    const newStatus = !todo.isCompleted;
    setTodos(todos.map(t => t.id === todo.id ? { ...t, isCompleted: newStatus } : t));
    
    try {
      if (newStatus === true && todo.recurrence && todo.recurrence !== 'none') {
        const currentDue = todo.dueDate ? new Date(todo.dueDate) : new Date();
        const nextDue = new Date(currentDue);
        if (todo.recurrence === 'daily') nextDue.setDate(currentDue.getDate() + 1);
        else if (todo.recurrence === 'weekly') nextDue.setDate(currentDue.getDate() + 7);
        else if (todo.recurrence === 'monthly') nextDue.setMonth(currentDue.getMonth() + 1);
        
        const nextDueStr = getLocalIsoDate(nextDue);
        const resetSubTasks = todo.subTasks ? todo.subTasks.map(st => ({ ...st, isCompleted: false })) : [];

        await addNote({
          title: todo.title,
          content: todo.content,
          tags: todo.tags || [],
          isTodo: true,
          dueDate: nextDueStr,
          dueTime: todo.dueTime || null,
          recurrence: todo.recurrence, 
          isHidden: todo.isHidden || false,
          isPinned: todo.isPinned || false,
          isCompleted: false, 
          subTasks: resetSubTasks, 
          userId: user.uid,
        } as any);

        await updateNote(todo.id, { isCompleted: true, recurrence: 'none' } as any);
        showAlert("Tugas Berulang", `Tugas telah diselesaikan! Jadwal berikutnya otomatis dibuat untuk ${nextDueStr}.`);
        fetchTodos(); 
      } else {
        await updateNote(todo.id, { isCompleted: newStatus } as any);
      }
    } catch (error) {
      showAlert("Gagal", "Terjadi kesalahan. Gagal memperbarui status tugas.");
      setTodos(todos.map(t => t.id === todo.id ? { ...t, isCompleted: todo.isCompleted } : t));
    }
  };

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

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    showConfirm("Hapus Tugas?", "Apakah kamu yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan.", async () => {
      const previousTodos = [...todos];
      setTodos(prev => prev.filter(t => t.id !== id));
      try {
        await deleteNote(id);
      } catch (error) {
        showAlert("Gagal", "Terjadi kesalahan saat menghapus tugas.");
        setTodos(previousTodos);
      }
    });
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const todo = todos.find(t => t.id === draggableId);
    if (!todo) return;

    const targetCol = destination.droppableId;
    let updates: Partial<TodoItem> = {};

    if (targetCol === 'done') {
      if (todo.isCompleted) return; 
      updates = { isCompleted: true };
    } else if (targetCol === 'today') {
      if (!todo.isCompleted && todo.dueDate === todayStr && !todo.isPinned) return; 
      updates = { isCompleted: false, dueDate: todayStr, isPinned: false };
    } else if (targetCol === 'backlog') {
      if (!todo.isCompleted && todo.dueDate !== todayStr && !todo.isPinned) return; 
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = getLocalIsoDate(tomorrow);
      updates = { isCompleted: false, dueDate: tomorrowStr, isPinned: false };
    } else if (targetCol === 'pinned') {
      if (todo.isPinned) return;
      updates = { isPinned: true, isCompleted: false };
    } else {
      return; 
    }

    setTodos(todos.map(t => t.id === draggableId ? { ...t, ...updates } : t));
    
    try {
      await updateNote(draggableId, updates as any);
      if (updates.isCompleted && todo.recurrence && todo.recurrence !== 'none') {
         fetchTodos(); 
      }
    } catch (error) {
      showAlert("Gagal", "Gagal memindahkan tugas.");
      fetchTodos(); 
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

  const completedTodos = todos.filter(t => t.isCompleted);
  const pendingTodos = todos.filter(t => !t.isCompleted);
  const progressPercentage = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0;

  return (
    <div className="p-4 pb-24 space-y-6 max-w-6xl mx-auto">
      
      {/* Header Halaman & Progress */}
      <div className="bg-card border border-border rounded-[2rem] p-5 shadow-sm space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent rounded-bl-full pointer-events-none" />

        <div className="flex items-start md:items-center justify-between flex-col md:flex-row gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl"><CheckSquare className="w-6 h-6 text-orange-500" /></div>
            <div>
              <h1 className="text-2xl font-bold">Tugas Saya</h1>
              <p className="text-sm text-muted-foreground">{pendingTodos.length} tugas tersisa</p>
            </div>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={handleWeeklyReview}
              disabled={isAiLoading}
              className="flex-1 md:flex-none rounded-xl border-purple-500/30 text-purple-600 bg-purple-500/5 hover:bg-purple-500/10 shadow-sm transition-all"
            >
              {isAiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              {isAiLoading ? "Menganalisis..." : "Weekly Review AI"}
            </Button>
            
            <Button asChild variant="default" className="rounded-xl bg-orange-500 hover:bg-orange-600 shadow-sm text-white md:flex hidden">
              <Link href="/create-todo">Buat Tugas</Link>
            </Button>
          </div>
        </div>

        {/* Tab Navigasi Mode */}
        <div className="flex p-1 bg-muted rounded-xl w-full md:w-fit relative z-10">
          <button onClick={() => setViewMode('list')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <LayoutList className="w-4 h-4" /> <span className="hidden md:inline">Daftar</span>
          </button>
          <button onClick={() => setViewMode('calendar')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <CalendarDays className="w-4 h-4" /> <span className="hidden md:inline">Kalender</span>
          </button>
          <button onClick={() => setViewMode('kanban')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
            <KanbanSquare className="w-4 h-4" /> <span className="hidden md:inline">Kanban</span>
          </button>
        </div>

        {todos.length > 0 && viewMode === 'list' && (
          <div className="space-y-2 pt-2 relative z-10">
            <div className="flex justify-between text-xs font-medium">
              <span>Progress Harian</span>
              <span className="text-primary">{progressPercentage}% Selesai</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-1000 ease-out rounded-full" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Konten Utama (Views) */}
      {todos.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-[2rem] bg-muted/20">
          <p className="text-muted-foreground mb-4">Belum ada tugas yang dibuat.</p>
          <Button asChild variant="default" className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold">
            <Link href="/create-todo">Buat Tugas Pertama</Link>
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="mt-6">
            {viewMode === 'list' && (
              <TodoListView 
                todos={todos} 
                todayStr={todayStr} 
                onToggle={toggleComplete} 
                onDelete={handleDelete} 
                onTogglePin={handleTogglePin} 
              />
            )}
            {viewMode === 'calendar' && (
              <TodoCalendarView 
                todos={todos} 
                todayStr={todayStr} 
                currentMonth={currentMonth} 
                setCurrentMonth={setCurrentMonth} 
                selectedDate={selectedDate} 
                setSelectedDate={setSelectedDate} 
                onToggle={toggleComplete} 
                onDelete={handleDelete} 
              />
            )}
            {viewMode === 'kanban' && (
              <TodoKanbanView 
                todos={todos} 
                todayStr={todayStr} 
                onToggle={toggleComplete} 
                onDelete={handleDelete} 
              />
            )}
          </div>
        </DragDropContext>
      )}

      {/* Ekstra UI Bawah */}
      <PomodoroTimer />
      
      <WeeklyReviewModal 
        reviewData={reviewData} 
        onClose={() => setReviewData(null)} 
        onSave={handleSaveReview} 
      />

    </div>
  );
}