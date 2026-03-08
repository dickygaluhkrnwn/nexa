"use client";

import { Droppable, Draggable } from "@hello-pangea/dnd";
import { TaskItem } from "./task-item";
import { Clock, ListTodo, CheckCircle2, AlertCircle } from "lucide-react";
import { TodoItem } from "./types";
import { cn } from "@/lib/utils";

interface TodoKanbanViewProps {
  todos: TodoItem[];
  todayStr: string;
  onToggle: (todo: TodoItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function TodoKanbanView({ todos, todayStr, onToggle, onDelete }: TodoKanbanViewProps) {
  const pendingTodos = todos.filter(t => !t.isCompleted);
  const completedTodos = todos.filter(t => t.isCompleted);
  
  const isTaskOverdue = (t: TodoItem) => {
    if (!t.dueDate) return false;
    
    const now = new Date();
    let targetDateStr = t.dueDate;
    if (t.dueTime) targetDateStr += `T${t.dueTime}`;
    else targetDateStr += `T23:59:59`;
    
    const targetDate = new Date(targetDateStr);
    return now > targetDate;
  };

  const overdueTasks = pendingTodos.filter(t => isTaskOverdue(t));
  const todayTasks = pendingTodos.filter(t => t.dueDate === todayStr && !isTaskOverdue(t));
  const backlog = pendingTodos.filter(t => !t.dueDate || t.dueDate > todayStr);

  const KanbanColumn = ({ title, icon: Icon, tasks, id, colorTheme }: any) => (
    // Menggunakan warna yang senada dengan Hero Section
    <div className={cn(
      "shrink-0 w-[85vw] sm:w-[350px] xl:w-auto flex flex-col rounded-2xl md:rounded-[2rem] border shadow-sm p-4 transition-colors",
      colorTheme.bg, colorTheme.border
    )}>
      <div className="flex items-center justify-between mb-4 px-1">
        <div className={cn("flex items-center gap-2.5 font-bold text-sm uppercase tracking-wider", colorTheme.text)}>
          <div className={cn("p-1.5 rounded-lg shadow-sm border", colorTheme.iconBg, colorTheme.iconBorder)}>
            <Icon className="w-4 h-4" />
          </div>
          {title}
        </div>
        <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold shadow-sm bg-background border", colorTheme.border, colorTheme.text)}>
          {tasks.length}
        </span>
      </div>
      
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div 
            ref={provided.innerRef} 
            {...provided.droppableProps}
            className={cn(
              "space-y-3 pb-2 transition-colors duration-200 min-h-[150px] rounded-xl",
              snapshot.isDraggingOver && colorTheme.dragOver
            )}
          >
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="h-[100px] flex items-center justify-center border-2 border-dashed border-border/60 rounded-xl text-muted-foreground text-xs font-medium bg-background/50">
                Tarik tugas ke sini
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
                    <div className="pointer-events-auto bg-background rounded-xl shadow-sm border border-border/50 hover:border-primary/30 transition-colors">
                      <TaskItem todo={todo} onToggle={() => onToggle(todo)} onDelete={(e) => onDelete(todo.id, e)} isOverdue={id === 'overdue'} />
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
    <div className="animate-in fade-in duration-300 flex flex-col w-full">
      <p className="text-[10px] text-muted-foreground mb-3 text-center uppercase tracking-widest font-bold xl:hidden">
        Geser horizontal untuk kolom lain 👉
      </p>
      
      {/* FIX: Menggunakan Grid di layar XL agar lebar 4 kolom sama rata persis */}
      <div className="flex xl:grid xl:grid-cols-4 gap-4 xl:gap-6 overflow-x-auto pb-4 snap-x custom-scrollbar items-start w-full">
        
        <div className="snap-center h-full w-full">
          <KanbanColumn 
            title="Tidak Selesai" 
            icon={AlertCircle} 
            tasks={overdueTasks} 
            id="overdue" 
            colorTheme={{
              bg: "bg-destructive/5",
              border: "border-destructive/20",
              text: "text-destructive",
              iconBg: "bg-background",
              iconBorder: "border-destructive/30",
              dragOver: "bg-destructive/10"
            }} 
          />
        </div>

        <div className="snap-center h-full w-full">
          <KanbanColumn 
            title="Fokus Hari Ini" 
            icon={Clock} 
            tasks={todayTasks} 
            id="today" 
            colorTheme={{
              bg: "bg-orange-500/5",
              border: "border-orange-500/20",
              text: "text-orange-600 dark:text-orange-500",
              iconBg: "bg-background",
              iconBorder: "border-orange-500/30",
              dragOver: "bg-orange-500/10"
            }} 
          />
        </div>

        <div className="snap-center h-full w-full">
          <KanbanColumn 
            title="Akan Datang" 
            icon={ListTodo} 
            tasks={backlog} 
            id="backlog" 
            colorTheme={{
              bg: "bg-blue-500/5",
              border: "border-blue-500/20",
              text: "text-blue-600 dark:text-blue-500",
              iconBg: "bg-background",
              iconBorder: "border-blue-500/30",
              dragOver: "bg-blue-500/10"
            }} 
          />
        </div>

        <div className="snap-center h-full w-full">
          <KanbanColumn 
            title="Selesai" 
            icon={CheckCircle2} 
            tasks={completedTodos} 
            id="done" 
            colorTheme={{
              bg: "bg-green-500/5",
              border: "border-green-500/20",
              text: "text-green-600 dark:text-green-500",
              iconBg: "bg-background",
              iconBorder: "border-green-500/30",
              dragOver: "bg-green-500/10"
            }} 
          />
        </div>

      </div>
    </div>
  );
}