import { Calendar, Clock, Repeat, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskSettingsProps {
  dueDate: string;
  setDueDate: (date: string) => void;
  dueTime: string;
  setDueTime: (time: string) => void;
  recurrence: string;
  setRecurrence: (recurrence: string) => void;
}

export function TaskSettings({
  dueDate, setDueDate,
  dueTime, setDueTime,
  recurrence, setRecurrence
}: TaskSettingsProps) {
  return (
    <div className="bg-card border border-border shadow-sm rounded-[1.5rem] p-5 md:p-6 space-y-5">
      
      {/* Header Panel */}
      <div className="flex items-center gap-2 pb-2 border-b border-border/50">
        <Settings2 className="w-4 h-4 text-muted-foreground" />
        <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Properti Tugas</h3>
      </div>

      <div className="space-y-4">
        
        {/* Input Tanggal */}
        <div className="group space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Tanggal Tenggat</label>
          <div className="flex items-center gap-3 p-2.5 bg-background border border-border rounded-xl transition-all group-hover:border-primary/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
            <div className="p-1.5 bg-orange-500/10 rounded-lg shrink-0">
              <Calendar className="w-4 h-4 text-orange-500" />
            </div>
            <input 
              type="date" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)} 
              className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-foreground font-semibold p-0 cursor-pointer" 
            />
          </div>
        </div>

        {/* Input Waktu */}
        <div className="group space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Waktu (Opsional)</label>
          <div className="flex items-center gap-3 p-2.5 bg-background border border-border rounded-xl transition-all group-hover:border-primary/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10">
            <div className="p-1.5 bg-blue-500/10 rounded-lg shrink-0">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <input 
              type="time" 
              value={dueTime} 
              onChange={(e) => setDueTime(e.target.value)} 
              className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-foreground font-semibold p-0 cursor-pointer" 
            />
          </div>
        </div>

        {/* Input Pengulangan */}
        <div className="group space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Pengulangan Rutin</label>
          <div className="flex items-center gap-3 p-2.5 bg-background border border-border rounded-xl transition-all group-hover:border-primary/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 relative">
            <div className="p-1.5 bg-purple-500/10 rounded-lg shrink-0">
              <Repeat className="w-4 h-4 text-purple-500" />
            </div>
            <select 
              value={recurrence} 
              onChange={(e) => setRecurrence(e.target.value)}
              className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-foreground font-semibold p-0 appearance-none cursor-pointer z-10"
            >
              <option value="none" className="text-foreground bg-background font-medium">Hanya Sekali (Tanpa Ulang)</option>
              <option value="daily" className="text-foreground bg-background font-medium">Setiap Hari</option>
              <option value="weekly" className="text-foreground bg-background font-medium">Setiap Minggu</option>
              <option value="monthly" className="text-foreground bg-background font-medium">Setiap Bulan</option>
            </select>
            {/* Custom Arrow for Select */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}