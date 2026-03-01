"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskItem } from "./task-item";
import { TodoItem } from "./types";

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
            <TaskItem key={todo.id} todo={todo} onToggle={() => onToggle(todo)} onDelete={(e) => onDelete(todo.id, e)} />
          ))
        )}
      </div>
    </div>
  );
}