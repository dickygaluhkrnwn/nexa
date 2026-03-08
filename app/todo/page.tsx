"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, updateNote, deleteNote, addNote } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { 
  Loader2, CheckSquare, LayoutList, CalendarDays, KanbanSquare, Sparkles, Timer,
  Clock, AlertCircle, CheckCircle2, ListTodo
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 
import { PomodoroTimer } from "@/components/todo/pomodoro-timer"; 
import { DragDropContext, DropResult } from "@hello-pangea/dnd"; 
import { useGemini } from "@/hooks/use-gemini"; 
import { cn } from "@/lib/utils";

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
  const [viewMode, setViewMode] = useState<ViewMode>('kanban'); 

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [reviewData, setReviewData] = useState<any>(null);

  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);

  const todayStr = useMemo(() => getLocalIsoDate(new Date()), []);

  const isTaskOverdue = (t: TodoItem) => {
    if (!t.dueDate) return false;
    const now = new Date();
    let targetDateStr = t.dueDate;
    if (t.dueTime) {
       targetDateStr += `T${t.dueTime}`;
    } else {
       targetDateStr += `T23:59:59`;
    }
    const targetDate = new Date(targetDateStr);
    return now > targetDate;
  };

  const fetchTodos = async () => {
    if (!user) return;
    try {
      const data = await getUserNotes(user.uid);
      let todoData = data.filter((note: any) => note.isTodo) as TodoItem[];
      let hasAutoUpdated = false;

      for (const todo of todoData) {
        if (!todo.isCompleted && isTaskOverdue(todo)) {
          if (todo.recurrence && todo.recurrence !== 'none') {
            let nextDue = new Date(todo.dueDate!);
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
              subTasks: todo.subTasks ? todo.subTasks.map(st => ({...st, isCompleted: false})) : [], 
              userId: user.uid,
            } as any);

            await updateNote(todo.id, { recurrence: 'none' } as any);
            hasAutoUpdated = true;
          }
        }
      }

      if (hasAutoUpdated) {
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

  const handleWeeklyReview = async () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = getLocalIsoDate(lastWeek);

    const weeklyTasks = todos.filter(t => t.dueDate && t.dueDate >= lastWeekStr && t.dueDate <= todayStr);

    if (weeklyTasks.length === 0) {
      showAlert("Data Kurang", "Kamu belum memiliki data tugas dalam 7 hari terakhir untuk dianalisis oleh AI.");
      return;
    }

    const contextStr = weeklyTasks.map(t => {
      let status = "Selesai";
      if (!t.isCompleted) {
        status = isTaskOverdue(t) ? "Tidak Selesai" : "Belum / Berjalan";
      }
      return `- [${status}] ${t.title} (Target: ${t.dueDate}${t.dueTime ? ` ${t.dueTime}` : ''})`;
    }).join('\n');

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
    } else if (targetCol === 'overdue') { 
      if (!todo.isCompleted && isTaskOverdue(todo)) return;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = getLocalIsoDate(yesterday);
      updates = { isCompleted: false, dueDate: yesterdayStr, isPinned: false };
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

  const togglePomodoro = () => {
    setIsPomodoroOpen(!isPomodoroOpen);
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

  // --- STATISTIK ---
  const completedTodos = todos.filter(t => t.isCompleted);
  const pendingTodos = todos.filter(t => !t.isCompleted);
  const overdueCount = pendingTodos.filter(t => isTaskOverdue(t)).length;
  const todayCount = pendingTodos.filter(t => t.dueDate === todayStr && !isTaskOverdue(t)).length;
  const upcomingCount = pendingTodos.filter(t => !t.dueDate || t.dueDate > todayStr).length;
  const progressPercentage = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full min-h-screen flex flex-col pb-32 overflow-x-hidden">
      
      {/* =========================================
          HERO & COMMAND CENTER HEADER (REDESIGNED)
          ========================================= */}
      <div className="bg-card border border-border rounded-3xl p-6 lg:p-8 shadow-sm relative overflow-hidden flex flex-col gap-6 shrink-0 z-20">
        
        {/* Dekorasi Latar */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-500/10 via-rose-500/5 to-transparent rounded-bl-full pointer-events-none" />

        {/* --- BAGIAN ATAS: Judul & Statistik --- */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 lg:gap-12 relative z-10 w-full">
          
          {/* Kiri: Judul Utama */}
          <div className="flex items-center gap-4 lg:w-1/3 shrink-0">
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 shrink-0">
              <CheckSquare className="w-7 h-7 md:w-8 md:h-8" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">Manajemen Tugas</h1>
              <p className="text-sm text-muted-foreground font-medium mt-1">Selesaikan proyekmu dengan efisien.</p>
            </div>
          </div>

          {/* Kanan: Mini Analytics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 w-full lg:w-auto flex-1 max-w-3xl">
            {/* Stat 1: Hari Ini */}
            <div className="bg-muted/30 border border-border/50 rounded-xl p-3 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-orange-500 mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Fokus Hari Ini</span>
              </div>
              <span className="text-2xl font-black text-foreground">{todayCount}</span>
            </div>
            
            {/* Stat 2: Overdue */}
            <div className="bg-destructive/5 border border-destructive/10 rounded-xl p-3 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-destructive mb-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Terlewat</span>
              </div>
              <span className="text-2xl font-black text-destructive">{overdueCount}</span>
            </div>

            {/* Stat 3: Mendatang */}
            <div className="bg-muted/30 border border-border/50 rounded-xl p-3 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-blue-500 mb-1">
                <ListTodo className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Mendatang</span>
              </div>
              <span className="text-2xl font-black text-foreground">{upcomingCount}</span>
            </div>

            {/* Stat 4: Selesai */}
            <div className="bg-green-500/5 border border-green-500/10 rounded-xl p-3 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-green-600 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Selesai</span>
              </div>
              <span className="text-2xl font-black text-green-600">{completedTodos.length}</span>
            </div>
          </div>

        </div>

        <div className="w-full h-px bg-border/60" />

        {/* --- BAGIAN BAWAH: Progress Bar & Control Actions --- */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5 relative z-10 w-full">
          
          {/* Progress Keseluruhan */}
          <div className="w-full lg:w-1/3 xl:w-5/12 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span>Penyelesaian Keseluruhan</span>
              <span className={progressPercentage === 100 ? "text-green-500" : "text-primary"}>{progressPercentage}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden shadow-inner">
              <div 
                className={cn("h-full transition-all duration-1000 ease-out rounded-full", progressPercentage === 100 ? "bg-green-500" : "bg-gradient-to-r from-orange-400 to-rose-500")} 
                style={{ width: `${progressPercentage}%` }} 
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap lg:flex-nowrap gap-2 w-full lg:w-auto items-center justify-start lg:justify-end">
            
            {/* View Toggles */}
            <div className="flex p-1 bg-muted/60 rounded-xl w-full sm:w-auto shrink-0 border border-border shadow-sm">
              <button onClick={() => setViewMode('kanban')} className={cn("flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg transition-all", viewMode === 'kanban' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <KanbanSquare className="w-4 h-4" /> <span className="hidden sm:inline">Kanban</span>
              </button>
              <button onClick={() => setViewMode('list')} className={cn("flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg transition-all", viewMode === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <LayoutList className="w-4 h-4" /> <span className="hidden sm:inline">Daftar</span>
              </button>
              <button onClick={() => setViewMode('calendar')} className={cn("flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-1.5 text-sm font-bold rounded-lg transition-all", viewMode === 'calendar' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
                <CalendarDays className="w-4 h-4" /> <span className="hidden sm:inline">Kalender</span>
              </button>
            </div>

            <div className="w-px h-6 bg-border hidden sm:block mx-1" />

            {/* Tools */}
            <div className="flex gap-2 w-full sm:w-auto flex-1 sm:flex-none">
              <Button 
                variant={isPomodoroOpen ? "default" : "outline"} 
                onClick={togglePomodoro}
                className={cn(
                  "flex-1 sm:flex-none rounded-xl shadow-sm transition-all h-10 px-4",
                  isPomodoroOpen ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600" : "bg-background hover:bg-muted text-foreground border-border"
                )}
                title="Timer Fokus"
              >
                <Timer className={cn("w-4 h-4 sm:mr-2", isPomodoroOpen && "animate-pulse")} />
                <span className="hidden sm:inline font-semibold">Pomodoro</span>
              </Button>

              <Button 
                variant="outline" 
                onClick={handleWeeklyReview}
                disabled={isAiLoading || todos.length === 0}
                className="flex-1 sm:flex-none rounded-xl border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5 hover:bg-purple-500/10 shadow-sm transition-all h-10 px-4"
              >
                {isAiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {isAiLoading ? "Menganalisis..." : <span className="font-bold">Review AI</span>}
              </Button>
              
              <Button asChild variant="default" className="rounded-xl bg-orange-500 hover:bg-orange-600 shadow-md text-white hidden xl:flex shrink-0 h-10 font-bold px-6">
                <Link href="/create-todo">Buat Tugas Baru</Link>
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================
          KONTEN UTAMA (VIEWS)
          ========================================= */}
      <div className="flex-1 w-full relative">
        {todos.length === 0 ? (
          <div className="text-center py-24 px-4 border-2 border-dashed border-border rounded-[2rem] bg-muted/10 h-full flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-orange-500/10 rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-orange-500/20">
              <CheckSquare className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Workspace Bersih</h2>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Belum ada tugas yang dibuat. Mulai rencanakan hari produktifmu sekarang!</p>
            <Button asChild variant="default" className="rounded-xl bg-orange-500 hover:bg-orange-600 shadow-md text-white font-bold h-12 px-8 text-base transition-transform hover:scale-105">
              <Link href="/create-todo">Buat Tugas Pertama</Link>
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="w-full h-full pt-2">
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
      </div>

      {/* Ekstra UI Bawah */}
      
      {/* FIX POMODORO: Kita gunakan implementasi HANYA 1 Komponen dan menyuntikkan properti isOpen.
          Jangan pernah merender kondisional {isPomodoroOpen && <PomodoroTimer />} karena ini
          akan me-reset state internal dari widget saat dimount/unmount. */}
      <PomodoroTimer isOpen={isPomodoroOpen} onClose={() => setIsPomodoroOpen(false)} />
      
      <WeeklyReviewModal 
        reviewData={reviewData} 
        onClose={() => setReviewData(null)} 
        onSave={handleSaveReview} 
      />

    </div>
  );
}