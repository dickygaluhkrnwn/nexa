"use client";

import { ChevronLeft, ChevronRight, CalendarDays, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskItem } from "./task-item";
import { TodoItem } from "./types";
import { cn } from "@/lib/utils";

const getLocalIsoDate = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

interface TodoCalendarViewProps {
  todos: TodoItem[];
  todayStr: string;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onToggle: (todo: TodoItem) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export function TodoCalendarView({ 
  todos, todayStr, 
  currentMonth, setCurrentMonth, 
  selectedDate, setSelectedDate, 
  onToggle, onDelete 
}: TodoCalendarViewProps) {
  
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  const selectedDateStr = getLocalIsoDate(selectedDate);
  const tasksForSelectedDate = todos.filter(t => t.dueDate === selectedDateStr);

  const isTaskOverdue = (t: TodoItem) => {
    if (!t.dueDate) return false;
    const now = new Date();
    let targetDateStr = t.dueDate;
    if (t.dueTime) targetDateStr += `T${t.dueTime}`;
    else targetDateStr += `T23:59:59`;
    
    const targetDate = new Date(targetDateStr);
    return now > targetDate;
  };

  return (
    <div className="animate-in fade-in duration-300 flex flex-col lg:flex-row gap-6 h-full items-start pb-10">
      
      {/* PANEL KIRI: KALENDER INTERAKTIF */}
      <div className="w-full lg:w-[450px] shrink-0 space-y-4">
        {/* Header Kalender */}
        <div className="flex items-center justify-between bg-card p-4 rounded-2xl border border-border shadow-sm">
          <Button variant="ghost" size="icon" className="hover:bg-muted" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-base uppercase tracking-widest text-foreground">
              {currentMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
            </h2>
          </div>
          <Button variant="ghost" size="icon" className="hover:bg-muted" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Grid Kalender */}
        <div className="bg-card p-4 md:p-6 rounded-2xl border border-border shadow-sm">
          <div className="grid grid-cols-7 gap-2 mb-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-3">
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => <div key={d}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="h-10 md:h-12" />;
              
              const dateStr = getLocalIsoDate(date);
              const isSelected = dateStr === selectedDateStr;
              const isToday = dateStr === todayStr;
              
              const dayTasks = todos.filter(t => t.dueDate === dateStr);
              const pendingTasks = dayTasks.filter(t => !t.isCompleted);
              
              const overdueCount = pendingTasks.filter(t => isTaskOverdue(t)).length;
              const normalPendingCount = pendingTasks.length - overdueCount;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "h-10 md:h-12 rounded-xl flex flex-col items-center justify-center relative transition-all border",
                    isSelected ? 'bg-primary text-primary-foreground border-primary shadow-md scale-105 z-10' : 
                    isToday ? 'bg-primary/10 text-primary border-primary/30 font-bold' : 
                    'bg-background border-transparent hover:border-border hover:bg-muted text-foreground'
                  )}
                >
                  <span className="text-sm">{date.getDate()}</span>
                  
                  {/* Rendering Titik Indikator Tugas */}
                  {pendingTasks.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: Math.min(overdueCount, 3) }).map((_, i) => (
                        <div key={`overdue-${i}`} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-destructive'}`} />
                      ))}
                      {Array.from({ length: Math.min(normalPendingCount, 3 - Math.min(overdueCount, 3)) }).map((_, i) => (
                        <div key={`normal-${i}`} className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />
                      ))}
                      {pendingTasks.length > 3 && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-muted-foreground'}`} />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* PANEL KANAN: LIST TUGAS HARIAN */}
      {/* FIX: Hapus tinggi tetap (min-h-[600px] / h-[500px]) agar tingginya dinamis mengikuti isi kontennya */}
      <div className="flex-1 bg-card border border-border shadow-sm rounded-2xl p-5 md:p-6 w-full flex flex-col">
        <div className="flex items-center gap-3 border-b border-border/50 pb-4 mb-4">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-foreground">Agenda Harian</h3>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
              {selectedDate.getDate()} {selectedDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* FIX: Hapus overflow-y-auto, biarkan list memanjang ke bawah dan scroll ditangani oleh halaman utama */}
        <div className="space-y-3">
          {tasksForSelectedDate.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center opacity-60">
              <div className="w-16 h-16 rounded-full bg-muted border border-border flex items-center justify-center mb-3">
                <CalendarDays className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Hari yang santai.</p>
              <p className="text-xs text-muted-foreground mt-1">Tidak ada tugas terjadwal untuk hari ini.</p>
            </div>
          ) : (
            tasksForSelectedDate.map(todo => (
              <TaskItem 
                key={todo.id} 
                todo={todo} 
                onToggle={() => onToggle(todo)} 
                onDelete={(e) => onDelete(todo.id, e)} 
                isOverdue={!todo.isCompleted && isTaskOverdue(todo)}
              />
            ))
          )}
        </div>
      </div>
      
    </div>
  );
}