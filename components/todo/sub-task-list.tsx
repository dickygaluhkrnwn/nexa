"use client";

import { useState, useRef, useEffect } from "react";
import { SubTask } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { ListTree, Plus, X, Circle, CheckCircle2, Clock, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubTaskListProps {
  subTasks: SubTask[];
  onChange: (subTasks: SubTask[]) => void;
}

export function SubTaskList({ subTasks, onChange }: SubTaskListProps) {
  const [newSubTask, setNewSubTask] = useState("");
  const [newSubTaskTime, setNewSubTaskTime] = useState("");
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editTime, setEditTime] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newSubTask.trim()) return;
    const newTask: SubTask = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      text: newSubTask.trim(),
      time: newSubTaskTime || undefined,
      isCompleted: false
    };
    onChange([...subTasks, newTask]);
    setNewSubTask("");
    setNewSubTaskTime("");
    // Kembalikan fokus ke input teks setelah menambahkan
    if (inputRef.current) inputRef.current.focus();
  };

  const startEdit = (st: SubTask) => {
    setEditingId(st.id);
    setEditText(st.text);
    setEditTime(st.time || "");
  };

  const saveEdit = (id: string) => {
    if (!editText.trim()) {
      handleRemove(id);
      return;
    }
    onChange(subTasks.map(st => 
      st.id === id ? { ...st, text: editText.trim(), time: editTime || undefined } : st
    ));
    setEditingId(null);
  };

  const handleRemove = (id: string) => {
    onChange(subTasks.filter(st => st.id !== id));
  };

  const handleToggle = (id: string) => {
    onChange(subTasks.map(st => 
      st.id === id ? { ...st, isCompleted: !st.isCompleted } : st
    ));
  };

  const completedCount = subTasks.filter(s => s.isCompleted).length;

  return (
    <div className="bg-card border border-border/60 shadow-sm rounded-2xl overflow-hidden flex flex-col transition-all">
      
      {/* Header */}
      <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ListTree className="w-4 h-4 text-muted-foreground" />
          <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Sub-Tugas & Jadwal</h3>
        </div>
        {subTasks.length > 0 && (
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {completedCount} / {subTasks.length} Selesai
          </span>
        )}
      </div>
      
      {/* List Sub Tasks */}
      <div className="flex flex-col">
        {subTasks.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground/60 italic">
            Belum ada rincian tugas. Tambahkan langkah-langkah kecil di bawah.
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {subTasks.map((st) => (
              <div 
                key={st.id} 
                className={cn(
                  "flex items-start gap-3 p-4 group transition-colors",
                  st.isCompleted ? "bg-muted/10 opacity-75" : "hover:bg-muted/30 bg-transparent",
                  editingId === st.id && "bg-primary/5"
                )}
              >
                {/* Tombol Centang */}
                <button 
                  onClick={() => handleToggle(st.id)} 
                  className={cn(
                    "mt-0.5 shrink-0 transition-all",
                    st.isCompleted ? "text-primary" : "text-muted-foreground/50 hover:text-primary"
                  )}
                >
                  {st.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                
                {/* Mode Edit vs View */}
                {editingId === st.id ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      value={editText} 
                      onChange={(e) => setEditText(e.target.value)} 
                      className="flex-1 bg-background border border-primary/30 px-3 py-2 text-sm font-medium rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center bg-background border border-border rounded-xl px-3 py-2 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground mr-2 shrink-0" />
                        <input 
                          type="time" 
                          value={editTime} 
                          onChange={(e) => setEditTime(e.target.value)} 
                          className="bg-transparent border-none p-0 text-sm outline-none w-[80px]"
                        />
                      </div>
                      <Button size="sm" onClick={() => saveEdit(st.id)} className="h-9 px-4 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
                        Simpan
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0 flex flex-col justify-center min-h-[24px]">
                    <span className={cn(
                      "text-sm font-medium leading-relaxed break-words",
                      st.isCompleted ? "line-through text-muted-foreground" : "text-foreground"
                    )}>
                      {st.text}
                    </span>
                    {st.time && (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-orange-600 bg-orange-500/10 w-max px-2 py-0.5 rounded-md uppercase mt-1.5">
                        <Clock className="w-3 h-3" /> {st.time}
                      </span>
                    )}
                  </div>
                )}
                
                {/* Aksi List (Muncul saat hover di Desktop) */}
                {editingId !== st.id && (
                  <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => startEdit(st)} className="w-8 h-8 text-muted-foreground hover:text-primary rounded-lg bg-card shadow-sm border border-border/50">
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(st.id)} className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg bg-card shadow-sm border border-border/50">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Form Tambah Sub-Tugas Baru */}
        <div className="p-4 bg-muted/10 border-t border-border/50">
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-background p-2 rounded-2xl border border-border focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 transition-all shadow-sm">
            
            <div className="flex w-full sm:w-auto items-center gap-2 border-b sm:border-b-0 sm:border-r border-border/50 pb-2 sm:pb-0 pr-0 sm:pr-3 shrink-0">
              <Clock className="w-4 h-4 text-muted-foreground ml-2 shrink-0" />
              <input 
                type="time" 
                value={newSubTaskTime} 
                onChange={(e) => setNewSubTaskTime(e.target.value)} 
                className="bg-transparent border-none p-0 text-sm font-medium outline-none focus:ring-0 w-full sm:w-[90px] cursor-pointer"
                title="Waktu Spesifik (Opsional)"
              />
            </div>
            
            <input 
              ref={inputRef}
              type="text" 
              value={newSubTask} 
              onChange={(e) => setNewSubTask(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="Tambahkan rincian / ceklis baru..." 
              className="flex-1 w-full bg-transparent border-none px-2 py-1 text-sm font-medium outline-none placeholder:text-muted-foreground/50 focus:ring-0"
            />
            
            <Button 
              onClick={handleAdd} 
              disabled={!newSubTask.trim()} 
              className="w-full sm:w-auto h-10 rounded-xl shrink-0 font-bold bg-primary hover:bg-primary/90 text-primary-foreground px-5 mt-2 sm:mt-0"
            >
              <Plus className="w-4 h-4 mr-1.5" /> Tambah
            </Button>

          </div>
        </div>

      </div>
    </div>
  );
}