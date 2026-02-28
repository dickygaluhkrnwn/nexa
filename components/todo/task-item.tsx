"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Circle, ArrowRight, Trash2, 
  Pin, Repeat, ListTodo 
} from "lucide-react";
import { NoteData } from "@/lib/notes-service";

interface TodoItem extends NoteData {
  id: string;
  isCompleted?: boolean;
  isPinned?: boolean;
}

interface TaskItemProps {
  todo: TodoItem;
  onToggle: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onTogglePin?: (e: React.MouseEvent) => void;
  isOverdue?: boolean;
  isPinned?: boolean;
}

export function TaskItem({ 
  todo, 
  onToggle, 
  onDelete,
  onTogglePin,
  isOverdue = false,
  isPinned = false
}: TaskItemProps) {
  
  // Hitung progress sub-task jika ada
  const totalSubTasks = todo.subTasks?.length || 0;
  const completedSubTasks = todo.subTasks?.filter(st => st.isCompleted).length || 0;
  const hasSubTasks = totalSubTasks > 0;

  return (
    <div className={`flex items-start gap-3 p-4 bg-card border rounded-2xl shadow-sm transition-all hover:shadow-md group ${isPinned ? 'border-primary/40' : (isOverdue ? 'border-destructive/50 bg-destructive/5' : 'border-border')}`}>
      <button onClick={onToggle} className="mt-0.5 text-muted-foreground hover:text-primary transition-colors shrink-0">
        <Circle className="w-5 h-5" />
      </button>
      
      <div className="flex-1 min-w-0">
        <Link href={`/edit-todo/${todo.id}`} className="block group/link">
          <h3 className="font-semibold text-foreground truncate group-hover/link:text-primary transition-colors">
            {todo.title || "Tanpa Judul"}
          </h3>
          
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {todo.dueDate && (
              <div className={`flex items-center gap-1.5 text-xs font-semibold ${isOverdue ? 'text-destructive bg-destructive/10 px-2 py-0.5 rounded-md' : 'text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md'}`}>
                <Calendar className="w-3.5 h-3.5" />
                <span>{todo.dueDate} {todo.dueTime ? `• ${todo.dueTime}` : ''}</span>
              </div>
            )}
            
            {/* Indikator Sub-Tasks */}
            {hasSubTasks && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md">
                <ListTodo className="w-3.5 h-3.5" />
                <span>{completedSubTasks}/{totalSubTasks} Sub-tugas</span>
              </div>
            )}

            {/* Indikator Tugas Berulang */}
            {todo.recurrence && todo.recurrence !== 'none' && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md">
                <Repeat className="w-3.5 h-3.5" />
                <span>
                  {todo.recurrence === 'daily' ? 'Harian' : 
                   todo.recurrence === 'weekly' ? 'Mingguan' : 'Bulanan'}
                </span>
              </div>
            )}
          </div>
        </Link>
      </div>
      
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onTogglePin && (
          <Button 
            variant="ghost" 
            size="icon" 
            className={`w-9 h-9 rounded-xl ${isPinned ? 'text-primary bg-primary/10 opacity-100' : 'text-muted-foreground hover:text-primary hover:bg-muted'}`} 
            onClick={onTogglePin}
          >
            <Pin className={`w-4 h-4 ${isPinned ? 'fill-primary' : ''}`} />
          </Button>
        )}
        <Link href={`/edit-todo/${todo.id}`}>
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl text-muted-foreground hover:text-primary hover:bg-muted">
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" className="w-9 h-9 rounded-xl text-destructive hover:bg-destructive/10" onClick={onDelete}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}