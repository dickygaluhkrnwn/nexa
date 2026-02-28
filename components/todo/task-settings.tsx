import { Calendar, Clock, Repeat } from "lucide-react";

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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Tanggal */}
        <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl transition-colors hover:border-primary/30 focus-within:border-primary/50">
          <div className="p-2 bg-orange-500/10 rounded-xl"><Calendar className="w-5 h-5 text-orange-600" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-0.5">Tenggat</p>
            <input 
              type="date" 
              value={dueDate} 
              onChange={(e) => setDueDate(e.target.value)} 
              className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-foreground font-medium p-0" 
            />
          </div>
        </div>

        {/* Waktu */}
        <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl transition-colors hover:border-primary/30 focus-within:border-primary/50">
          <div className="p-2 bg-blue-500/10 rounded-xl"><Clock className="w-5 h-5 text-blue-600" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-0.5">Waktu</p>
            <input 
              type="time" 
              value={dueTime} 
              onChange={(e) => setDueTime(e.target.value)} 
              className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-foreground font-medium p-0" 
            />
          </div>
        </div>
      </div>

      {/* Looping */}
      <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-2xl transition-colors hover:border-primary/30 focus-within:border-primary/50">
        <div className="p-2 bg-purple-500/10 rounded-xl"><Repeat className="w-5 h-5 text-purple-600" /></div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider mb-0.5">Pengulangan Rutin</p>
          <select 
            value={recurrence} 
            onChange={(e) => setRecurrence(e.target.value)}
            className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 text-foreground font-medium p-0 appearance-none"
          >
            <option value="none" className="text-foreground bg-background">Hanya Sekali (Tidak Berulang)</option>
            <option value="daily" className="text-foreground bg-background">Setiap Hari</option>
            <option value="weekly" className="text-foreground bg-background">Setiap Minggu</option>
            <option value="monthly" className="text-foreground bg-background">Setiap Bulan</option>
          </select>
        </div>
      </div>
    </div>
  );
}