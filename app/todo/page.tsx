"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, updateNote, deleteNote, addNote, NoteData } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { 
  Loader2, CheckCircle2, 
  AlertCircle, Clock, CheckSquare, Pin, Repeat,
  LayoutList, CalendarDays, KanbanSquare, ChevronLeft, ChevronRight,
  ListTodo
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 
import { TaskItem } from "@/components/todo/task-item"; 
import { PomodoroTimer } from "@/components/todo/pomodoro-timer"; 
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"; // <-- IMPORT LIBRARY BARU

interface TodoItem extends NoteData {
  id: string;
  isCompleted?: boolean;
  isPinned?: boolean;
}

type ViewMode = 'list' | 'calendar' | 'kanban';

export default function TodoPage() {
  const { user, loading: authLoading } = useAuth();
  const { showAlert, showConfirm } = useModal(); 
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // State untuk Calendar View
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // String hari ini untuk komparasi
  const todayStr = useMemo(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    return (new Date(today.getTime() - offset)).toISOString().split('T')[0];
  }, []);

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
            const nextDueStr = nextDue.toISOString().split('T')[0];

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
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

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
        
        const nextDueStr = nextDue.toISOString().split('T')[0];
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

  // --- LOGIKA KANBAN DRAG & DROP DENGAN HELLO-PANGEA/DND ---
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Jika di-drop di luar zona (atau posisi tidak berubah), batalkan
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const todo = todos.find(t => t.id === draggableId);
    if (!todo) return;

    const targetCol = destination.droppableId;
    let updates: Partial<TodoItem> = {};

    if (targetCol === 'done') {
      if (todo.isCompleted) return; // Sudah di Done
      updates = { isCompleted: true };
    } else if (targetCol === 'today') {
      if (!todo.isCompleted && todo.dueDate === todayStr) return; // Sudah di Today
      updates = { isCompleted: false, dueDate: todayStr };
    } else if (targetCol === 'backlog') {
      if (!todo.isCompleted && todo.dueDate !== todayStr) return; // Sudah di Backlog
      // Set dueDate ke besok jika dipindah ke backlog (Akan Datang)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      updates = { isCompleted: false, dueDate: tomorrowStr };
    }

    // Optimistic Update
    setTodos(todos.map(t => t.id === draggableId ? { ...t, ...updates } : t));
    
    try {
      await updateNote(draggableId, updates as any);
      // Fetch ulang jika task berulang diselesaikan via drag & drop agar loop barunya ter-load
      if (updates.isCompleted && todo.recurrence && todo.recurrence !== 'none') {
         fetchTodos(); 
      }
    } catch (error) {
      showAlert("Gagal", "Gagal memindahkan tugas.");
      fetchTodos(); // Rollback ke state database aslinya
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

  // Render Helpers
  const renderListView = () => {
    const pinnedTodos = pendingTodos.filter(t => t.isPinned); 
    const unpinnedPending = pendingTodos.filter(t => !t.isPinned);
    const overdue = unpinnedPending.filter(t => t.dueDate && t.dueDate < todayStr);
    const dueToday = unpinnedPending.filter(t => t.dueDate === todayStr);
    const upcomingAndNoDate = unpinnedPending.filter(t => !t.dueDate || t.dueDate > todayStr);

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {pinnedTodos.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-primary flex items-center gap-2"><Pin className="w-4 h-4 fill-primary" /> Disematkan ({pinnedTodos.length})</h2>
            {pinnedTodos.map(todo => <TaskItem key={todo.id} todo={todo} onToggle={() => toggleComplete(todo)} onDelete={(e) => handleDelete(todo.id, e)} onTogglePin={(e) => handleTogglePin(todo, e)} isPinned={true} />)}
          </div>
        )}
        {overdue.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-destructive flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Terlewat ({overdue.length})</h2>
            {overdue.map(todo => <TaskItem key={todo.id} todo={todo} onToggle={() => toggleComplete(todo)} onDelete={(e) => handleDelete(todo.id, e)} onTogglePin={(e) => handleTogglePin(todo, e)} isOverdue={true} />)}
          </div>
        )}
        {dueToday.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-orange-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Hari Ini ({dueToday.length})</h2>
            {dueToday.map(todo => <TaskItem key={todo.id} todo={todo} onToggle={() => toggleComplete(todo)} onDelete={(e) => handleDelete(todo.id, e)} onTogglePin={(e) => handleTogglePin(todo, e)} />)}
          </div>
        )}
        {upcomingAndNoDate.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Mendatang ({upcomingAndNoDate.length})</h2>
            {upcomingAndNoDate.map(todo => <TaskItem key={todo.id} todo={todo} onToggle={() => toggleComplete(todo)} onDelete={(e) => handleDelete(todo.id, e)} onTogglePin={(e) => handleTogglePin(todo, e)} />)}
          </div>
        )}
        {completedTodos.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border">
            <h2 className="text-sm font-semibold text-muted-foreground">Selesai ({completedTodos.length})</h2>
            {completedTodos.map(todo => (
              <div key={todo.id} className="flex items-start gap-3 p-4 bg-muted/30 border border-border rounded-2xl opacity-75 hover:opacity-100 transition-all group">
                <button onClick={() => toggleComplete(todo)} className="mt-0.5 text-primary hover:text-primary/80 transition-colors shrink-0"><CheckCircle2 className="w-5 h-5" /></button>
                <div className="flex-1 min-w-0">
                  <Link href={`/edit-todo/${todo.id}`} className="hover:underline">
                    <h3 className="font-medium text-muted-foreground line-through truncate">{todo.title || "Tanpa Judul"}</h3>
                    {todo.recurrence && todo.recurrence !== 'none' && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-purple-500/70"><Repeat className="w-3 h-3" /> Rutinitas Selesai</div>
                    )}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderCalendarView = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Helper untuk kalender
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const tasksForSelectedDate = todos.filter(t => t.dueDate === selectedDateStr);

    return (
      <div className="animate-in fade-in duration-300 space-y-6">
        {/* Header Kalender */}
        <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="font-bold text-lg">
            {currentMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
          </h2>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Grid Kalender */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div className="grid grid-cols-7 gap-1 mb-2 text-center text-xs font-bold text-muted-foreground">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="h-12" />;
              
              const dateStr = date.toISOString().split('T')[0];
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === todayStr;
              const dayTasks = todos.filter(t => t.dueDate === dateStr);
              const pendingCount = dayTasks.filter(t => !t.isCompleted).length;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(date)}
                  className={`h-12 rounded-xl flex flex-col items-center justify-center relative transition-all ${isSelected ? 'bg-primary text-primary-foreground shadow-md' : isToday ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'}`}
                >
                  <span>{date.getDate()}</span>
                  {pendingCount > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: Math.min(pendingCount, 3) }).map((_, i) => (
                        <div key={i} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />
                      ))}
                      {pendingCount > 3 && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* List Tugas Harian */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">
            Tugas tgl {selectedDate.getDate()} {selectedDate.toLocaleString('id-ID', { month: 'short' })}
          </h3>
          {tasksForSelectedDate.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8 border border-dashed rounded-2xl">Tidak ada tugas di hari ini.</p>
          ) : (
            tasksForSelectedDate.map(todo => (
              <TaskItem key={todo.id} todo={todo} onToggle={() => toggleComplete(todo)} onDelete={(e) => handleDelete(todo.id, e)} />
            ))
          )}
        </div>
      </div>
    );
  };

  const renderKanbanView = () => {
    const backlog = pendingTodos.filter(t => t.dueDate !== todayStr);
    const todayTasks = pendingTodos.filter(t => t.dueDate === todayStr);

    const KanbanColumn = ({ title, icon: Icon, tasks, id, color }: any) => (
      <div className={`flex-1 min-w-[300px] max-w-sm flex flex-col bg-muted/30 rounded-[2rem] border border-border p-4 h-[65vh]`}>
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2 font-bold">
            <Icon className={`w-5 h-5 ${color}`} /> {title}
          </div>
          <span className="bg-background px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm text-foreground">{tasks.length}</span>
        </div>
        
        <Droppable droppableId={id}>
          {(provided, snapshot) => (
            <div 
              ref={provided.innerRef} 
              {...provided.droppableProps}
              className={`flex-1 overflow-y-auto space-y-3 pb-2 custom-scrollbar pr-2 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-primary/5 rounded-xl' : ''}`}
            >
              {tasks.length === 0 && !snapshot.isDraggingOver && (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-border/50 rounded-2xl text-muted-foreground text-sm font-medium">
                  Tarik ke sini
                </div>
              )}
              {tasks.map((todo: TodoItem, index: number) => (
                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.9 : 1,
                        transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} scale(1.02)` : provided.draggableProps.style?.transform,
                      }}
                      className="transition-transform"
                    >
                      {/* Kita membungkus TaskItem dengan div pointer-events-auto agar link/button di dalamnya tetap bisa di-klik jika tidak sedang men-drag */}
                      <div className="pointer-events-auto">
                        <TaskItem todo={todo} onToggle={() => toggleComplete(todo)} onDelete={(e) => handleDelete(todo.id, e)} />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );

    return (
      <div className="animate-in fade-in duration-300">
        <p className="text-xs text-muted-foreground mb-4 text-center md:hidden">Geser ke kanan untuk melihat kolom lain 👉</p>
        
        {/* BUNGKUS DENGAN DRAG DROP CONTEXT */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-8 snap-x">
            <div className="snap-center"><KanbanColumn title="Akan Datang" icon={ListTodo} tasks={backlog} id="backlog" color="text-muted-foreground" /></div>
            <div className="snap-center"><KanbanColumn title="Fokus Hari Ini" icon={Clock} tasks={todayTasks} id="today" color="text-orange-500" /></div>
            <div className="snap-center"><KanbanColumn title="Selesai" icon={CheckCircle2} tasks={completedTodos} id="done" color="text-green-500" /></div>
          </div>
        </DragDropContext>
        
      </div>
    );
  };

  return (
    <div className="p-4 pb-24 space-y-6 max-w-6xl mx-auto">
      
      {/* Header Halaman & Progress */}
      <div className="bg-card border border-border rounded-[2rem] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/10 rounded-xl"><CheckSquare className="w-6 h-6 text-orange-500" /></div>
            <div>
              <h1 className="text-2xl font-bold">Tugas Saya</h1>
              <p className="text-sm text-muted-foreground">{pendingTodos.length} tugas tersisa</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-full border-orange-500 text-orange-500 hover:bg-orange-500/10 hidden md:flex">
            <Link href="/create-todo">Buat Tugas Baru</Link>
          </Button>
        </div>

        {/* Tab Navigasi Mode */}
        <div className="flex p-1 bg-muted rounded-xl w-full md:w-fit">
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
          <div className="space-y-2 pt-2">
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

      {todos.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-[2rem] bg-muted/20">
          <p className="text-muted-foreground mb-4">Belum ada tugas yang dibuat.</p>
          <Button asChild variant="default" className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold">
            <Link href="/create-todo">Buat Tugas Pertama</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6">
          {viewMode === 'list' && renderListView()}
          {viewMode === 'calendar' && renderCalendarView()}
          {viewMode === 'kanban' && renderKanbanView()}
        </div>
      )}

      {/* RENDER FLOATING POMODORO TIMER */}
      <PomodoroTimer />
      
    </div>
  );
}