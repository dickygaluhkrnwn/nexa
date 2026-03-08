"use client";

import { useState } from "react";
import { Pin, AlertCircle, Clock, ListTodo, CheckCircle2, Repeat, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { TaskItem } from "./task-item";
import Link from "next/link";
import { TodoItem } from "./types";
import { cn } from "@/lib/utils";

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
  
  const isTaskOverdue = (t: TodoItem) => {
    if (!t.dueDate) return false;
    const now = new Date();
    let targetDateStr = t.dueDate;
    if (t.dueTime) targetDateStr += `T${t.dueTime}`;
    else targetDateStr += `T23:59:59`;
    const targetDate = new Date(targetDateStr);
    return now > targetDate;
  };

  const overdue = unpinnedPending.filter(t => isTaskOverdue(t));
  const dueToday = unpinnedPending.filter(t => t.dueDate === todayStr && !isTaskOverdue(t));
  const upcomingAndNoDate = unpinnedPending.filter(t => !t.dueDate || t.dueDate > todayStr);

  // State untuk mengontrol section mana yang terbuka (Collapsible)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pinned: true,
    overdue: true,
    today: true,
    backlog: true,
    done: false // Secara default Selesai disembunyikan agar tidak penuh
  });

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Komponen Wrapper Section List yang Profesional dan Bisa Dilipat
  const CollapsibleListSection = ({ id, title, icon: Icon, count, colorClass, items, isDropDisabled = false }: any) => {
    const isExpanded = expandedSections[id];

    if (items.length === 0 && id !== 'today') return null; // Sembunyikan section kosong kecuali "Hari Ini"

    return (
      <div className="mb-6">
        {/* Header Kategori */}
        <button 
          onClick={() => toggleSection(id)}
          className="flex items-center gap-2.5 w-full py-2 hover:bg-muted/50 rounded-lg px-2 transition-colors group"
        >
          <div className={cn("transition-transform duration-200 text-muted-foreground", isExpanded ? "rotate-90" : "rotate-0")}>
            <ChevronRight className="w-4 h-4" />
          </div>
          <Icon className={cn("w-4 h-4", colorClass)} />
          <h2 className={cn("text-sm font-bold tracking-wide", colorClass)}>{title}</h2>
          <span className="text-xs font-semibold text-muted-foreground ml-2">{count}</span>
          <div className="h-px bg-border/50 flex-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        {/* Konten List yang Bisa Di-drag */}
        {isExpanded && (
          <Droppable droppableId={id} isDropDisabled={isDropDisabled}>
            {(provided, snapshot) => (
              <div 
                ref={provided.innerRef} 
                {...provided.droppableProps} 
                className={cn(
                  "pl-6 pr-2 pt-2 pb-4 min-h-[50px] transition-colors rounded-xl",
                  snapshot.isDraggingOver ? "bg-primary/5 border border-primary/20 mt-2" : "border border-transparent"
                )}
              >
                {items.length === 0 && (
                  <div className="text-sm text-muted-foreground italic py-3 px-4">
                    Belum ada tugas di kategori ini.
                  </div>
                )}
                
                {items.map((todo: TodoItem, index: number) => (
                  <Draggable key={todo.id} draggableId={todo.id} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.draggableProps} 
                        className={cn(
                          "pointer-events-auto border-b border-border/40 last:border-0 group/row transition-all",
                          snapshot.isDragging ? "bg-background shadow-lg rounded-lg border-border z-50 ring-1 ring-primary/20" : "hover:bg-muted/30"
                        )}
                        style={provided.draggableProps.style}
                      >
                        {/* DESAIN LIST ROW COMPACT 
                          Menambahkan Handle Drag di sisi kiri agar List Row terlihat seperti tabel profesional
                        */}
                        <div className="flex items-stretch">
                          <div 
                            {...provided.dragHandleProps} 
                            className="w-8 flex items-center justify-center text-muted-foreground/30 group-hover/row:text-muted-foreground/80 hover:bg-muted cursor-grab active:cursor-grabbing rounded-l-md transition-colors"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1 py-1 pr-2">
                            {id === 'done' ? (
                               // Tampilan Compact Khusus untuk Tugas Selesai
                              <div className="flex items-center gap-3 p-2 opacity-70 hover:opacity-100 transition-all">
                                <button onClick={() => onToggle(todo)} className="text-primary hover:text-primary/80 transition-colors shrink-0">
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <div className="flex-1 min-w-0 flex items-center justify-between">
                                  <Link href={`/edit-todo/${todo.id}`} className="hover:underline flex-1 truncate">
                                    <span className="font-medium text-sm text-muted-foreground line-through">{todo.title || "Tanpa Judul"}</span>
                                  </Link>
                                  {todo.recurrence && todo.recurrence !== 'none' && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-purple-500/70 uppercase tracking-wider shrink-0 ml-4"><Repeat className="w-3 h-3" /> Rutinitas Selesai</div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              // Tampilan menggunakan TaskItem tapi di dalam wrapper transparan (tanpa card kotak)
                              <div className="task-list-wrapper">
                                <TaskItem todo={todo} onToggle={() => onToggle(todo)} onDelete={(e) => onDelete(todo.id, e)} onTogglePin={(e) => onTogglePin(todo, e)} isPinned={id === 'pinned'} isOverdue={id === 'overdue'} />
                              </div>
                            )}
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
        )}
      </div>
    );
  };

  return (
    // FIX: Hapus max-w-4xl dan mx-auto, biarkan w-full mengisi seluruh lebar parent
    <div className="animate-in fade-in duration-500 w-full pb-16">
      
      {/* CSS Override Khusus untuk menghapus tampilan "Card" dari TaskItem saat di mode List */}
      <style dangerouslySetInnerHTML={{__html: `
        .task-list-wrapper > div {
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          padding: 0.5rem 0.5rem !important;
          border-radius: 0 !important;
        }
      `}} />

      <div className="bg-card border border-border shadow-sm rounded-2xl p-4 md:p-6 w-full">
        
        <CollapsibleListSection 
          id="pinned" 
          title="Prioritas Tertinggi (Disematkan)" 
          icon={Pin} 
          count={pinnedTodos.length} 
          colorClass="text-primary fill-primary" 
          items={pinnedTodos} 
        />

        <CollapsibleListSection 
          id="overdue" 
          title="Terlewat Waktu" 
          icon={AlertCircle} 
          count={overdue.length} 
          colorClass="text-destructive" 
          items={overdue} 
          isDropDisabled={true}
        />

        <CollapsibleListSection 
          id="today" 
          title="Fokus Hari Ini" 
          icon={Clock} 
          count={dueToday.length} 
          colorClass="text-orange-500" 
          items={dueToday} 
        />

        <CollapsibleListSection 
          id="backlog" 
          title="Mendatang / Backlog" 
          icon={ListTodo} 
          count={upcomingAndNoDate.length} 
          colorClass="text-blue-500" 
          items={upcomingAndNoDate} 
        />

        <div className="my-8 border-t border-border/50" />

        <CollapsibleListSection 
          id="done" 
          title="Selesai Dikerjakan" 
          icon={CheckCircle2} 
          count={completedTodos.length} 
          colorClass="text-green-500" 
          items={completedTodos} 
        />
        
      </div>
    </div>
  );
}