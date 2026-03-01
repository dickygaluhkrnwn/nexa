"use client";

import { useState } from "react";
import { SubTask } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { ListTodo, Plus, X, Circle, CheckCircle2, Clock, Pencil } from "lucide-react";

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

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between text-muted-foreground mb-1">
        <div className="flex items-center gap-2">
          <ListTodo className="w-5 h-5" />
          <h3 className="font-semibold text-sm uppercase tracking-wider">Rincian & Jadwal</h3>
        </div>
        {subTasks.length > 0 && (
          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md">
            {subTasks.filter(s => s.isCompleted).length} / {subTasks.length} Selesai
          </span>
        )}
      </div>
      
      <div className="space-y-2">
        {subTasks.map((st) => (
          <div key={st.id} className={`flex items-start gap-3 p-3 rounded-2xl group transition-all border ${st.isCompleted ? 'bg-muted/30 border-transparent opacity-60' : 'bg-card border-border shadow-sm'}`}>
            <button 
              onClick={() => handleToggle(st.id)} 
              className={`mt-0.5 shrink-0 transition-colors ${st.isCompleted ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
              {st.isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </button>
            
            {editingId === st.id ? (
              <div className="flex-1 flex flex-col gap-2">
                <input 
                  type="text" 
                  value={editText} 
                  onChange={(e) => setEditText(e.target.value)} 
                  className="w-full bg-background border border-primary/30 px-3 py-2 text-sm rounded-xl outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <input 
                    type="time" 
                    value={editTime} 
                    onChange={(e) => setEditTime(e.target.value)} 
                    className="bg-background border border-border px-3 py-1.5 text-xs rounded-xl outline-none"
                  />
                  <Button size="sm" onClick={() => saveEdit(st.id)} className="h-8 text-xs rounded-xl px-4">Simpan</Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-w-0 flex flex-col">
                <span className={`text-sm font-medium leading-relaxed ${st.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {st.text}
                </span>
                {st.time && (
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-orange-500 mt-1.5">
                    <Clock className="w-3 h-3" /> {st.time}
                  </span>
                )}
              </div>
            )}
            
            {editingId !== st.id && (
              <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button variant="ghost" size="icon" onClick={() => startEdit(st)} className="w-8 h-8 text-muted-foreground hover:text-primary rounded-full">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleRemove(st.id)} className="w-8 h-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
        
        {/* Form Tambah Sub-Tugas Baru */}
        <div className="flex items-center gap-2 mt-2 bg-muted/50 p-1.5 rounded-2xl border border-transparent focus-within:border-primary/30 transition-all">
          <input 
            type="time" 
            value={newSubTaskTime} 
            onChange={(e) => setNewSubTaskTime(e.target.value)} 
            className="bg-background border-none px-2 py-2.5 text-xs font-medium rounded-xl outline-none focus:ring-2 focus:ring-primary/50 w-[85px] text-center shadow-sm"
          />
          <input 
            type="text" 
            value={newSubTask} 
            onChange={(e) => setNewSubTask(e.target.value)} 
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Ketik rincian tugas..." 
            className="flex-1 bg-transparent border-none px-2 py-2.5 text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <Button onClick={handleAdd} disabled={!newSubTask.trim()} className="h-9 w-9 rounded-xl shrink-0 shadow-sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}