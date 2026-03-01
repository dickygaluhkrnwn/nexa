"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { TaskItem } from "./task-item";
import { Clock, ListTodo, CheckCircle2 } from "lucide-react";
import { TodoItem } from "./types";

interface TodoKanbanViewProps {
  todos: TodoItem[];
  todayStr: string;
  onToggle: (todo: TodoItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function TodoKanbanView({ todos, todayStr, onToggle, onDelete }: TodoKanbanViewProps) {
  const pendingTodos = todos.filter(t => !t.isCompleted);
  const completedTodos = todos.filter(t => t.isCompleted);
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
                      <TaskItem todo={todo} onToggle={() => onToggle(todo)} onDelete={(e) => onDelete(todo.id, e)} />
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
}