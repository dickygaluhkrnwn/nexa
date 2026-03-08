"use client";

import { useState, useEffect, useMemo } from "react";
import { format, subDays } from "date-fns";
import { Plus, Flame, Loader2, X, Check, Trash2, Pencil, Save, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { addHabit, getUserHabits, updateHabit, deleteHabit, HabitData } from "@/lib/notes-service";
import { useModal } from "@/hooks/use-modal";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-purple-500", "bg-cyan-500"
];

const PRESET_ICONS = ["💧", "📖", "🏃", "🧘", "🥗", "💻", "💊", "🛏️"];

export function HabitTracker() {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useModal();
  
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newTitle, setNewTitle] = useState("");
  const [newIcon, setNewIcon] = useState("💧");
  const [newColor, setNewColor] = useState("bg-blue-500");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const yesterdayStr = useMemo(() => format(subDays(new Date(), 1), 'yyyy-MM-dd'), []);

  useEffect(() => {
    if (!user) return;
    const fetchHabits = async () => {
      try {
        const data = await getUserHabits(user.uid);
        setHabits(data);
      } catch (err) {
        console.error("Gagal mengambil data habits", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHabits();
  }, [user]);

  const calculateStreak = (completedDates: string[]) => {
    if (!completedDates || completedDates.length === 0) return 0;
    const sortedDates = [...completedDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let currentStreak = 0;
    let checkDate = new Date(); 

    if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) {
        return 0;
    }

    while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        if (sortedDates.includes(dateStr)) {
            currentStreak++;
            checkDate = subDays(checkDate, 1);
        } else if (dateStr === todayStr) {
           checkDate = subDays(checkDate, 1);
        } else {
            break; 
        }
    }
    return currentStreak;
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    setNewTitle("");
    setNewIcon("💧");
    setNewColor("bg-blue-500");
    setIsAdding(true);
  };

  const handleOpenEditForm = (habit: HabitData) => {
    setEditingId(habit.id!);
    setNewTitle(habit.title);
    setNewIcon(habit.icon);
    setNewColor(habit.color);
    setIsAdding(true);
    setOpenMenuId(null); 
  };

  const handleCloseForm = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSaveHabit = async () => {
    if (!user) return;
    if (!newTitle.trim()) {
      showAlert("Perhatian", "Nama kebiasaan tidak boleh kosong.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        const updatedHabitData = { title: newTitle.trim(), icon: newIcon, color: newColor };
        await updateHabit(editingId, updatedHabitData);
        setHabits(habits.map(h => h.id === editingId ? { ...h, ...updatedHabitData } : h));
      } else {
        const newHabitData = { userId: user.uid, title: newTitle.trim(), icon: newIcon, color: newColor, completedDates: [] };
        const id = await addHabit(newHabitData);
        setHabits([...habits, { ...newHabitData, id }]);
      }
      handleCloseForm();
    } catch (err) {
      showAlert("Gagal", "Terjadi kesalahan saat menyimpan kebiasaan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleHabit = async (habit: HabitData) => {
    if (!user || !habit.id) return;
    const isCompletedToday = habit.completedDates.includes(todayStr);
    let updatedDates = [...habit.completedDates];

    if (isCompletedToday) updatedDates = updatedDates.filter(d => d !== todayStr);
    else updatedDates.push(todayStr); 

    setHabits(habits.map(h => h.id === habit.id ? { ...h, completedDates: updatedDates } : h));

    try {
      await updateHabit(habit.id, { completedDates: updatedDates });
    } catch (err) {
      showAlert("Gagal", "Gagal menyimpan status kebiasaan.");
      setHabits(habits.map(h => h.id === habit.id ? { ...h, completedDates: habit.completedDates } : h));
    }
  };

  const handleDeleteHabit = (id: string, title: string) => {
    setOpenMenuId(null); 
    showConfirm("Hapus Kebiasaan?", `Yakin ingin menghapus tracker "${title}" beserta seluruh riwayat streak-nya?`, async () => {
      setHabits((prev) => prev.filter((h) => h.id !== id));
      try {
        await deleteHabit(id);
      } catch (err) {
        if (user) {
          const data = await getUserHabits(user.uid);
          setHabits(data);
        }
      }
    });
  };

  if (isLoading) return <div className="h-40 flex items-center justify-center border border-border/50 rounded-[2rem] bg-card animate-pulse"><Loader2 className="w-6 h-6 animate-spin text-primary/40"/></div>;

  return (
    <div className="bg-card border border-border rounded-[2rem] p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-foreground leading-tight">Habit Tracker</h2>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">Bangun Rutinitas</p>
          </div>
        </div>
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={handleOpenAddForm} className="rounded-full font-bold h-9">
            <Plus className="w-4 h-4 md:mr-1" /> <span className="hidden md:inline">Tambah</span>
          </Button>
        )}
      </div>

      {/* Form Tambah/Edit Habit */}
      {isAdding && (
        <div className="bg-background border border-primary/30 rounded-3xl p-5 shadow-inner mb-6 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-2">
            <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">{editingId ? "Edit Kebiasaan" : "Kebiasaan Baru"}</h3>
            <button onClick={handleCloseForm} className="text-muted-foreground hover:bg-muted rounded-full p-1"><X className="w-4 h-4"/></button>
          </div>
          
          <div className="space-y-5">
            <input 
              type="text" 
              placeholder="Contoh: Baca Buku 15 Menit" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-muted/30 border border-border outline-none py-3 px-4 rounded-xl text-sm font-semibold focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all"
              autoFocus
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Pilih Ikon</p>
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map(icon => (
                    <button 
                      key={icon} 
                      onClick={() => setNewIcon(icon)}
                      className={cn("w-10 h-10 rounded-xl text-lg flex items-center justify-center transition-all", newIcon === icon ? "bg-primary/20 border border-primary shadow-sm scale-105" : "bg-muted border border-transparent hover:bg-muted-foreground/10")}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Warna Aksen</p>
                <div className="flex gap-2.5 items-center h-10">
                  {PRESET_COLORS.map(color => (
                    <button 
                      key={color} 
                      onClick={() => setNewColor(color)}
                      className={cn("w-8 h-8 rounded-full transition-all shadow-inner", color, newColor === color ? "ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110" : "opacity-70 hover:opacity-100")}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button onClick={handleSaveHabit} disabled={isSubmitting || !newTitle.trim()} className="w-full rounded-xl font-bold h-11 text-base shadow-md">
              {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
              {editingId ? "Simpan Perubahan" : "Simpan Habit Baru"}
            </Button>
          </div>
        </div>
      )}

      {/* Daftar Habit */}
      {!isAdding && habits.length === 0 && (
        <div className="p-8 text-center border border-dashed border-border/60 rounded-3xl bg-muted/10">
          <p className="text-sm font-medium text-muted-foreground">Belum ada kebiasaan. Tambahkan satu untuk memulai rantai (streak) positifmu!</p>
        </div>
      )}

      {/* FIX TERAKHIR: Menggunakan flex, flex-wrap, dan flex-1 dengan min-width dan max-width. 
          Ini menjamin card akan selalu rata kiri-kanan dan merentang penuh menutupi celah. */}
      <div className="flex flex-wrap gap-4 w-full">
        {habits.map((habit) => {
          const isCompletedToday = habit.completedDates.includes(todayStr);
          const currentStreak = calculateStreak(habit.completedDates);
          const isFire = currentStreak >= 3; 
          const isMenuOpen = openMenuId === habit.id;

          return (
            <div 
              key={habit.id} 
              // flex-1: Izinkan card merentang. min-w-[200px]: Jangan terlalu kecil. basis-[calc(50%-0.5rem)] / basis-[calc(33%-1rem)]: Ukuran ideal
              className={cn(
                "relative flex flex-col p-4 rounded-[1.5rem] border transition-all duration-300 overflow-visible group",
                "flex-1 min-w-[140px] sm:min-w-[180px] lg:min-w-[200px] xl:min-w-[220px]", 
                isCompletedToday ? `${habit.color} border-transparent shadow-md` : "bg-background border-border hover:border-primary/40 hover:shadow-sm"
              )}
            >
              <div className="flex items-start justify-between z-50 relative w-full">
                <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                  <div className={cn("w-9 h-9 text-lg shrink-0 rounded-xl flex items-center justify-center shadow-inner transition-all", isCompletedToday ? "bg-white/20" : "bg-muted")}>
                    {habit.icon}
                  </div>
                  <h3 className={cn("font-bold text-[12px] leading-tight line-clamp-2", isCompletedToday ? "text-white" : "text-foreground group-hover:text-primary transition-colors")}>
                    {habit.title}
                  </h3>
                </div>

                {/* Kebab Menu Button */}
                <div className="relative shrink-0 -mt-1 -mr-2">
                  <button 
                    onClick={(e) => { 
                      e.preventDefault(); e.stopPropagation(); 
                      setOpenMenuId(isMenuOpen ? null : habit.id!); 
                    }}
                    className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors relative z-20", isCompletedToday ? "text-white/70 hover:text-white hover:bg-white/20" : "text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 lg:opacity-100")}
                  >
                    <MoreVertical className="w-4 h-4 pointer-events-none" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuId(null); }}></div>
                      <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border shadow-xl rounded-xl z-[70] overflow-hidden animate-in zoom-in-95 duration-200 origin-top-right">
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleOpenEditForm(habit); }} 
                          className="w-full flex items-center gap-2 px-3 py-3 text-xs hover:bg-muted text-foreground font-semibold transition-colors border-b border-border/50 relative z-10"
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-500" /> Edit Habit
                        </button>
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteHabit(habit.id!, habit.title); }} 
                          className="w-full flex items-center gap-2 px-3 py-3 text-xs hover:bg-destructive/10 text-destructive font-semibold transition-colors relative z-10"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Area Tengah: BIG STREAK FLAME */}
              <div className="flex-1 flex flex-col items-center justify-center my-4 z-0 pointer-events-none relative w-full">
                 <div className={cn("flex flex-col items-center justify-center transition-all duration-500 pointer-events-auto", isCompletedToday ? "scale-110" : "scale-100 opacity-50 grayscale")}>
                    <Flame className={cn("w-8 h-8 md:w-10 md:h-10", isCompletedToday ? "text-orange-200 drop-shadow-[0_0_12px_rgba(253,186,116,0.9)]" : "text-orange-500", isFire && isCompletedToday && "animate-pulse")} />
                    <span className={cn("text-xl md:text-2xl font-black tracking-tighter mt-1", isCompletedToday ? "text-white" : "text-foreground")}>
                      {currentStreak} <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-80">Hari</span>
                    </span>
                 </div>
              </div>

              {/* Tombol Aksi Bawah */}
              <button 
                onClick={() => handleToggleHabit(habit)}
                className={cn("mt-auto w-full py-2.5 rounded-xl text-xs font-bold transition-all z-10 flex items-center justify-center gap-2", isCompletedToday ? "bg-white text-black shadow-lg hover:scale-95" : "bg-muted border border-border hover:border-primary/50 hover:text-primary")}
              >
                {isCompletedToday ? <><Check className="w-4 h-4"/> Selesai</> : "Tandai Selesai"}
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
}