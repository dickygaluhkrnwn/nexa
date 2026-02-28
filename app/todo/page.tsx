"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, updateNote, deleteNote, addNote, NoteData } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { 
  Loader2, CheckCircle2, 
  AlertCircle, Clock, CheckSquare, Pin, Repeat,
  LayoutList, CalendarDays, KanbanSquare, ChevronLeft, ChevronRight,
  ListTodo, Sparkles, X, Target, Lightbulb
} from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 
import { TaskItem } from "@/components/todo/task-item"; 
import { PomodoroTimer } from "@/components/todo/pomodoro-timer"; 
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"; 
import { useGemini } from "@/hooks/use-gemini"; // <-- Import Hook AI

interface TodoItem extends NoteData {
  id: string;
  isCompleted?: boolean;
  isPinned?: boolean;
}

type ViewMode = 'list' | 'calendar' | 'kanban';

const getLocalIsoDate = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export default function TodoPage() {
  const { user, loading: authLoading } = useAuth();
  const { showAlert, showConfirm, showQuotaAlert } = useModal(); // <-- Tambahkan showQuotaAlert
  const { callAI, isAiLoading } = useGemini(); // <-- Panggil AI Hook
  
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // State untuk Calendar View
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // State untuk AI Weekly Review
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
    // 1. Ambil tanggal 7 hari yang lalu
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = getLocalIsoDate(lastWeek);

    // 2. Kumpulkan semua tugas dalam rentang 7 hari terakhir
    const weeklyTasks = todos.filter(t => t.dueDate && t.dueDate >= lastWeekStr && t.dueDate <= todayStr);

    if (weeklyTasks.length === 0) {
      showAlert("Data Kurang", "Kamu belum memiliki data tugas dalam 7 hari terakhir untuk dianalisis oleh AI.");
      return;
    }

    // 3. Ubah menjadi string/teks untuk dibaca AI
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
      // Tangkap error limit API dan arahkan ke funding modal
      if (error.message === "QUOTA_EXCEEDED") {
        showQuotaAlert();
      } else {
        showAlert("Gagal Menganalisis", "AI kebingungan memproses datamu atau terjadi gangguan server. Coba lagi nanti ya.");
      }
    }
  };
  // --------------------------------

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

  const renderListView = () => {
    const pinnedTodos = pendingTodos.filter(t => t.isPinned); 
    const unpinnedPending = pendingTodos.filter(t => !t.isPinned);
    const overdue = unpinnedPending.filter(t => t.dueDate && t.dueDate < todayStr);
    const dueToday = unpinnedPending.filter(t => t.dueDate === todayStr);
    const upcomingAndNoDate = unpinnedPending.filter(t => !t.dueDate || t.dueDate > todayStr);

    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        
        {/* DISEMATKAN */}
        <Droppable droppableId="pinned">
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className={`space-y-3 transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-primary/5 p-3 -mx-3 rounded-2xl' : ''} ${pinnedTodos.length === 0 && !snapshot.isDraggingOver ? 'hidden' : 'block'}`}>
              <h2 className="text-sm font-bold text-primary flex items-center gap-2"><Pin className="w-4 h-4 fill-primary" /> Disematkan ({pinnedTodos.length})</h2>
              {pinnedTodos.length === 0 && <div className="border-2 border-dashed border-primary/30 rounded-2xl p-4 text-center text-xs text-primary font-medium">Tarik tugas untuk disematkan</div>}
              {pinnedTodos.map((todo, index) => (
                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="pointer-events-auto transition-transform" style={{...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.9 : 1, transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} scale(1.02)` : provided.draggableProps.style?.transform}}>
                      <TaskItem todo={todo} onToggle={() => toggleComplete(todo)} onDelete={(e) => handleDelete(todo.id, e)} onTogglePin={(e) => handleTogglePin(todo, e)} isPinned={true} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* TERLEWAT */}
        {overdue.length > 0 && (
          <Droppable droppableId="overdue" isDropDisabled={true}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                <h2 className="text-sm font-bold text-destructive flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Terlewat ({overdue.length})</h2>
                {overdue.map((todo, index) => (
                  <Draggable key={todo.id} draggableId={todo.id} index={index}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="pointer-events-auto transition-transform" style={{...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.9 : 1, transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} scale(1.02)` : provided.draggableProps.style?.transform}}>
                        <TaskItem todo={todo} onToggle={() => toggleComplete(todo)} onDelete={(e) => handleDelete(todo.id, e)} onTogglePin={(e) => handleTogglePin(todo, e)} isOverdue={true} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        )}

        {/* HARI INI */}
        <Droppable droppableId="today">
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className={`space-y-3 transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-orange-500/5 p-3 -mx-3 rounded-2xl' : ''}`}>
              <h2 className="text-sm font-bold text-orange-500 flex items-center gap-2"><Clock className="w-4 h-4" /> Hari Ini ({dueToday.length})</h2>
              {dueToday.length === 0 && <div className="border-2 border-dashed border-border/50 rounded-2xl p-4 text-center text-xs text-muted-foreground font-medium">Tarik tugas untuk dikerjakan hari ini</div>}
              {dueToday.map((todo, index) => (
                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="pointer-events-auto transition-transform" style={{...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.9 : 1, transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} scale(1.02)` : provided.draggableProps.style?.transform}}>
                      <TaskItem todo={todo} onToggle={() => toggleComplete(todo)} onDelete={(e) => handleDelete(todo.id, e)} onTogglePin={(e) => handleTogglePin(todo, e)} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* MENDATANG */}
        <Droppable droppableId="backlog">
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className={`space-y-3 transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-primary/5 p-3 -mx-3 rounded-2xl' : ''}`}>
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><ListTodo className="w-4 h-4" /> Mendatang ({upcomingAndNoDate.length})</h2>
              {upcomingAndNoDate.length === 0 && <div className="border-2 border-dashed border-border/50 rounded-2xl p-4 text-center text-xs text-muted-foreground font-medium">Tarik tugas ke sini untuk dijadwalkan ulang</div>}
              {upcomingAndNoDate.map((todo, index) => (
                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="pointer-events-auto transition-transform" style={{...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.9 : 1, transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} scale(1.02)` : provided.draggableProps.style?.transform}}>
                      <TaskItem todo={todo} onToggle={() => toggleComplete(todo)} onDelete={(e) => handleDelete(todo.id, e)} onTogglePin={(e) => handleTogglePin(todo, e)} />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>

        {/* SELESAI */}
        <Droppable droppableId="done">
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className={`space-y-3 pt-4 border-t border-border transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-green-500/5 p-3 -mx-3 rounded-2xl border-t-transparent' : ''}`}>
              <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Selesai ({completedTodos.length})</h2>
              {completedTodos.length === 0 && <div className="border-2 border-dashed border-border/50 rounded-2xl p-4 text-center text-xs text-muted-foreground font-medium">Tarik tugas ke sini untuk diselesaikan</div>}
              {completedTodos.map((todo, index) => (
                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="pointer-events-auto transition-transform" style={{...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.9 : 1, transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} scale(1.02)` : provided.draggableProps.style?.transform}}>
                      <div className="flex items-start gap-3 p-4 bg-muted/30 border border-border rounded-2xl opacity-75 hover:opacity-100 transition-all group mb-2">
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
  };

  const renderCalendarView = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

    const selectedDateStr = getLocalIsoDate(selectedDate);
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
              
              const dateStr = getLocalIsoDate(date);
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
        <div className="flex gap-4 overflow-x-auto pb-8 snap-x">
          <div className="snap-center"><KanbanColumn title="Akan Datang" icon={ListTodo} tasks={backlog} id="backlog" color="text-muted-foreground" /></div>
          <div className="snap-center"><KanbanColumn title="Fokus Hari Ini" icon={Clock} tasks={todayTasks} id="today" color="text-orange-500" /></div>
          <div className="snap-center"><KanbanColumn title="Selesai" icon={CheckCircle2} tasks={completedTodos} id="done" color="text-green-500" /></div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 pb-24 space-y-6 max-w-6xl mx-auto">
      
      {/* Header Halaman & Progress */}
      <div className="bg-card border border-border rounded-[2rem] p-5 shadow-sm space-y-4 relative overflow-hidden">
        {/* Dekorasi Aksen UI */}
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
            {/* Tombol AI Weekly Review */}
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
            {viewMode === 'list' && renderListView()}
            {viewMode === 'calendar' && renderCalendarView()}
            {viewMode === 'kanban' && renderKanbanView()}
          </div>
        </DragDropContext>
      )}

      {/* RENDER FLOATING POMODORO TIMER */}
      <PomodoroTimer />
      
      {/* MODAL HASIL AI WEEKLY REVIEW */}
      {reviewData && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border p-6 md:p-8 rounded-[2rem] shadow-2xl w-full max-w-md animate-in zoom-in-95 relative overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header Modal */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500" />
            <button onClick={() => setReviewData(null)} className="absolute top-4 right-4 p-2 bg-muted rounded-full hover:bg-muted-foreground/20 transition-colors z-10">
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-4 mb-6 mt-2 shrink-0">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-purple-500/20">
                {reviewData.grade || "A"}
              </div>
              <div className="flex-1 pr-6">
                <h2 className="font-extrabold text-xl leading-tight text-foreground">{reviewData.title}</h2>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Nexa AI Evaluation</p>
              </div>
            </div>

            {/* Area Scrollable Konten */}
            <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 pb-4">
              <div className="bg-purple-500/10 p-4 rounded-2xl border border-purple-500/20">
                <p className="text-sm font-medium leading-relaxed italic text-purple-700 dark:text-purple-300">
                  "{reviewData.summary}"
                </p>
              </div>

              <div>
                <h3 className="flex items-center gap-2 font-bold text-sm mb-3 text-foreground">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Wawasan Pola Kerjamu
                </h3>
                <ul className="space-y-2.5">
                  {reviewData.insights?.map((item: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2.5 text-muted-foreground font-medium leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="flex items-center gap-2 font-bold text-sm mb-3 text-foreground">
                  <Target className="w-4 h-4 text-cyan-500" /> Fokus Minggu Depan
                </h3>
                <ul className="space-y-2.5">
                  {reviewData.focusNextWeek?.map((item: string, i: number) => (
                    <li key={i} className="text-sm flex items-start gap-2.5 text-muted-foreground font-medium leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="pt-4 mt-auto shrink-0 border-t border-border/50">
              <Button onClick={() => setReviewData(null)} className="w-full rounded-xl h-12 font-bold shadow-md bg-foreground text-background hover:bg-foreground/90">
                Tutup Laporan
              </Button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}