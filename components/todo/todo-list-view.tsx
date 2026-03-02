"use client";

import { Pin, AlertCircle, Clock, ListTodo, CheckCircle2, Repeat } from "lucide-react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { TaskItem } from "./task-item";
import Link from "next/link";
import { TodoItem } from "./types";

interface TodoListViewProps {
  todos: TodoItem[];
  todayStr: string;
  onToggle: (todo: TodoItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
  onTogglePin: (todo: TodoItem, e: React.MouseEvent) => void;
}

export function TodoListView({ todos, todayStr, onToggle, onDelete, onTogglePin }: TodoListViewProps) {
  const completedTodos = todos.filter(t => t.isCompleted);
  const pendingTodos = todos.filter(t => !t.isCompleted);
  const pinnedTodos = pendingTodos.filter(t => t.isPinned); 
  const unpinnedPending = pendingTodos.filter(t => !t.isPinned);
  
  // Fungsi Helper untuk cek Overdue dengan memperhitungkan JAM (dueTime)
  const isTaskOverdue = (t: TodoItem) => {
    if (!t.dueDate) return false;
    
    const now = new Date();
    // Buat Date object dari target dueDate dan dueTime
    let targetDateStr = t.dueDate;
    if (t.dueTime) {
       targetDateStr += `T${t.dueTime}`;
    } else {
       // Jika tidak ada jam spesifik, batas waktu adalah penghujung hari itu (23:59:59)
       targetDateStr += `T23:59:59`;
    }
    
    const targetDate = new Date(targetDateStr);
    return now > targetDate;
  };

  // FIX: Kategorisasi menggunakan logika waktu spesifik (Tanggal + Jam)
  const overdue = unpinnedPending.filter(t => isTaskOverdue(t));
  const dueToday = unpinnedPending.filter(t => t.dueDate === todayStr && !isTaskOverdue(t));
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
                    <TaskItem todo={todo} onToggle={() => onToggle(todo)} onDelete={(e) => onDelete(todo.id, e)} onTogglePin={(e) => onTogglePin(todo, e)} isPinned={true} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* TIDAK SELESAI (TERLEWAT) */}
      {overdue.length > 0 && (
        <Droppable droppableId="overdue" isDropDisabled={true}>
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              <h2 className="text-sm font-bold text-destructive flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Tidak Selesai ({overdue.length})</h2>
              {overdue.map((todo, index) => (
                <Draggable key={todo.id} draggableId={todo.id} index={index}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="pointer-events-auto transition-transform" style={{...provided.draggableProps.style, opacity: snapshot.isDragging ? 0.9 : 1, transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} scale(1.02)` : provided.draggableProps.style?.transform}}>
                      <TaskItem todo={todo} onToggle={() => onToggle(todo)} onDelete={(e) => onDelete(todo.id, e)} onTogglePin={(e) => onTogglePin(todo, e)} isOverdue={true} />
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
                    <TaskItem todo={todo} onToggle={() => onToggle(todo)} onDelete={(e) => onDelete(todo.id, e)} onTogglePin={(e) => onTogglePin(todo, e)} />
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
                    <TaskItem todo={todo} onToggle={() => onToggle(todo)} onDelete={(e) => onDelete(todo.id, e)} onTogglePin={(e) => onTogglePin(todo, e)} />
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
                      <button onClick={() => onToggle(todo)} className="mt-0.5 text-primary hover:text-primary/80 transition-colors shrink-0"><CheckCircle2 className="w-5 h-5" /></button>
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
}