import { useState } from "react";
import { SubTask } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { ListTodo, Plus, X, Circle, CheckCircle2 } from "lucide-react";

interface SubTaskListProps {
  subTasks: SubTask[];
  onChange: (subTasks: SubTask[]) => void;
}

export function SubTaskList({ subTasks, onChange }: SubTaskListProps) {
  const [newSubTask, setNewSubTask] = useState("");

  const handleAdd = () => {
    if (!newSubTask.trim()) return;
    const newTask: SubTask = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      text: newSubTask.trim(),
      isCompleted: false
    };
    onChange([...subTasks, newTask]);
    setNewSubTask("");
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
          <h3 className="font-semibold text-sm uppercase tracking-wider">Sub-Tugas</h3>
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
            <span className={`flex-1 text-sm font-medium leading-relaxed ${st.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
              {st.text}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-7 h-7 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all rounded-full shrink-0" 
              onClick={() => handleRemove(st.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        
        <div className="flex items-center gap-2 mt-2">
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
            placeholder="Tambah rincian tugas..." 
            className="flex-1 bg-muted/50 border border-transparent focus:border-primary/30 px-4 py-3 text-sm rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/60"
          />
          <Button onClick={handleAdd} disabled={!newSubTask.trim()} className="h-11 w-11 rounded-2xl shrink-0 shadow-sm">
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}