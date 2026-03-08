"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Calendar, Circle, ArrowRight, Trash2, 
  Pin, Repeat, MoreVertical, CheckCircle2, ListTree
} from "lucide-react";
import { NoteData } from "@/lib/notes-service";
import { cn } from "@/lib/utils";

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

  // Menghitung ringkasan sub-tasks agar card tidak terlalu panjang
  const totalSubTasks = todo.subTasks?.length || 0;
  const completedSubTasks = todo.subTasks?.filter(st => st.isCompleted).length || 0;
  const hasSubTasks = totalSubTasks > 0;

  // Fungsi untuk mengecek apakah tugas jatuh tempo hari ini
  const isDueToday = () => {
    if (!todo.dueDate) return false;
    const today = new Date();
    const offset = today.getTimezoneOffset() * 60000;
    const todayStr = new Date(today.getTime() - offset).toISOString().split('T')[0];
    return todo.dueDate === todayStr;
  };

  // Menentukan skema warna berdasarkan status tugas.
  // FIX: Jadikan Biru sebagai warna default (untuk tugas "Mendatang")
  let themeColor = {
    cardBorder: "border-blue-500/30 hover:border-blue-500/50",
    cardBg: "bg-blue-500/5 hover:shadow-md",
    title: "text-foreground group-hover/link:text-blue-600",
    check: "text-muted-foreground hover:text-blue-500",
    dateBg: "bg-blue-500/10",
    dateText: "text-blue-600"
  };

  if (todo.isCompleted) {
    themeColor = {
      cardBorder: "border-green-500/30 border-dashed",
      cardBg: "bg-green-500/5 opacity-60 hover:opacity-100",
      title: "text-muted-foreground line-through group-hover/link:text-green-600",
      check: "text-green-500 hover:text-green-600",
      dateBg: "bg-green-500/10",
      dateText: "text-green-600"
    };
  } else if (isOverdue) {
    themeColor = {
      cardBorder: "border-destructive/40 hover:border-destructive/60",
      cardBg: "bg-destructive/5 hover:shadow-md",
      title: "text-foreground group-hover/link:text-destructive",
      check: "text-muted-foreground hover:text-destructive",
      dateBg: "bg-destructive/10",
      dateText: "text-destructive"
    };
  } else if (isDueToday()) {
    themeColor = {
      cardBorder: "border-orange-500/30 hover:border-orange-500/50",
      cardBg: "bg-orange-500/5 hover:shadow-md",
      title: "text-foreground group-hover/link:text-orange-500",
      check: "text-muted-foreground hover:text-orange-500",
      dateBg: "bg-orange-500/10",
      dateText: "text-orange-600"
    };
  }

  // Jika di pin, berikan penekanan warna border
  if (isPinned && !todo.isCompleted) {
      themeColor.cardBorder = "border-primary/50 shadow-sm";
  }

  return (
    <div className={cn(
      "group relative flex items-start gap-3 p-4 border rounded-2xl transition-all duration-200",
      themeColor.cardBg,
      themeColor.cardBorder
    )}>
      
      {/* Tombol Checkbox */}
      <button onClick={onToggle} className={cn("mt-0.5 transition-colors shrink-0", themeColor.check)}>
        {todo.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <Link href={`/edit-todo/${todo.id}`} className="block group/link">
          
          <h3 className={cn(
            "font-semibold text-sm transition-colors truncate",
            themeColor.title
          )}>
            {todo.title || "Tanpa Judul"}
          </h3>
          
          <div className="flex items-center gap-2 mt-2.5 flex-wrap">
            {todo.dueDate && (
              <div className={cn(
                "flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                themeColor.dateBg, themeColor.dateText
              )}>
                <Calendar className="w-3 h-3" />
                <span>{todo.dueDate} {todo.dueTime ? `• ${todo.dueTime}` : ''}</span>
              </div>
            )}

            {/* Indikator Tugas Berulang */}
            {todo.recurrence && todo.recurrence !== 'none' && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 bg-purple-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                <Repeat className="w-3 h-3" />
                <span>
                  {todo.recurrence === 'daily' ? 'Harian' : 
                   todo.recurrence === 'weekly' ? 'Mingguan' : 'Bulanan'}
                </span>
              </div>
            )}

            {/* Badge Ringkasan Sub-Tasks (Lebih rapi dan pro) */}
            {hasSubTasks && (
              <div className={cn(
                "flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider",
                completedSubTasks === totalSubTasks ? "text-green-600 bg-green-500/10" : "text-blue-600 bg-blue-500/10"
              )}>
                <ListTree className="w-3 h-3" />
                <span>{completedSubTasks}/{totalSubTasks}</span>
              </div>
            )}
          </div>
        </Link>
      </div>
      
      {/* Menu Titik Tiga (Kebab Menu) */}
      <div className="relative shrink-0 opacity-0 group-hover:opacity-100 transition-opacity lg:opacity-100">
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "w-8 h-8 rounded-full transition-colors",
            isPinned || isMenuOpen ? "text-primary bg-primary/10 opacity-100" : "text-muted-foreground hover:bg-muted"
          )}
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            setIsMenuOpen(!isMenuOpen); 
          }}
        >
          <MoreVertical className="w-4 h-4" />
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
                  <Pin className={cn("w-4 h-4", isPinned && "fill-primary text-primary")} /> 
                  {isPinned ? 'Lepas Sematan' : 'Sematkan Prioritas'}
                </button>
              )}
              <Link href={`/edit-todo/${todo.id}`} className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted text-foreground font-medium transition-colors border-b border-border/50">
                <ArrowRight className="w-4 h-4" /> Buka Detail
              </Link>
              <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(e); setIsMenuOpen(false); }} 
                className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-destructive/10 text-destructive font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Hapus Tugas
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}