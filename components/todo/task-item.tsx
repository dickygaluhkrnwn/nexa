"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Circle, ArrowRight, Trash2, 
  Pin, Repeat, MoreVertical, Check 
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
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Cek ketersediaan sub-tasks
  const hasSubTasks = todo.subTasks && todo.subTasks.length > 0;

  return (
    <div className={`flex items-start gap-3 p-4 bg-card border rounded-2xl shadow-sm transition-all hover:shadow-md group relative ${isPinned ? 'border-primary/40' : (isOverdue ? 'border-destructive/50 bg-destructive/5' : 'border-border')}`}>
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

          {/* RENDER EKSPLISIT SUB-TASKS (JADWAL HARIAN) */}
          {hasSubTasks && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-2.5">
              {todo.subTasks!.map(st => (
                <div key={st.id} className={`flex items-start gap-2.5 text-sm ${st.isCompleted ? 'opacity-50' : 'opacity-100'}`}>
                  <div className={`mt-0.5 w-3.5 h-3.5 rounded-sm flex items-center justify-center border shrink-0 ${st.isCompleted ? 'bg-primary border-primary text-white' : 'border-muted-foreground'}`}>
                     {st.isCompleted && <Check className="w-2.5 h-2.5" />}
                  </div>
                  <span className={`flex-1 leading-tight ${st.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                    {st.text}
                  </span>
                  {st.time && (
                    <span className="text-[10px] font-bold text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded shrink-0">
                      {st.time}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </Link>
      </div>
      
      {/* Menu Titik Tiga (Kebab Menu) */}
      <div className="relative shrink-0">
        <Button 
          variant="ghost" 
          size="icon" 
          className={`w-8 h-8 rounded-full ${isPinned || isMenuOpen ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            setIsMenuOpen(!isMenuOpen); 
          }}
        >
          <MoreVertical className="w-5 h-5" />
        </Button>

        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40 cursor-default" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); }}></div>
            <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border shadow-xl rounded-2xl z-50 overflow-hidden animate-in zoom-in-95 duration-200">
              {onTogglePin && (
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onTogglePin(e); setIsMenuOpen(false); }} 
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted text-foreground font-medium transition-colors border-b border-border/50"
                >
                  <Pin className={`w-4 h-4 ${isPinned ? 'fill-primary text-primary' : ''}`} /> 
                  {isPinned ? 'Lepas Sematan' : 'Sematkan'}
                </button>
              )}
              <Link href={`/edit-todo/${todo.id}`} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted text-foreground font-medium transition-colors border-b border-border/50">
                <ArrowRight className="w-4 h-4" /> Buka Detail
              </Link>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(e); setIsMenuOpen(false); }} 
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-destructive/10 text-destructive font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Hapus
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}