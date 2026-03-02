"use client";

import { useState, useEffect, useMemo } from "react";
import { format, subDays, isSameDay } from "date-fns";
import { Plus, Flame, Loader2, X, Check, Trash2, Pencil, Save, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { addHabit, getUserHabits, updateHabit, deleteHabit, HabitData } from "@/lib/notes-service";
import { useModal } from "@/hooks/use-modal";

const PRESET_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-rose-500", "bg-amber-500", "bg-purple-500", "bg-cyan-500"
];

const PRESET_ICONS = ["💧", "📖", "🏃", "🧘", "🥗", "💻", "💊", "🛏️"];

export function HabitTracker() {
  const { user } = useAuth();
  const { showAlert, showConfirm } = useModal();
  
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State form penambahan / pengeditan habit
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newTitle, setNewTitle] = useState("");
  const [newIcon, setNewIcon] = useState("💧");
  const [newColor, setNewColor] = useState("bg-blue-500");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk mengontrol dropdown menu pada card
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const yesterdayStr = useMemo(() => format(subDays(new Date(), 1), 'yyyy-MM-dd'), []);

  // Ambil data habits
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

  // Hitung Streak
  const calculateStreak = (completedDates: string[]) => {
    if (!completedDates || completedDates.length === 0) return 0;
    
    // Urutkan tanggal dari yang terbaru
    const sortedDates = [...completedDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let currentStreak = 0;
    let checkDate = new Date(); // Mulai dari hari ini

    // Jika hari ini belum dicentang, cek apakah kemarin dicentang.
    // Jika hari ini dan kemarin tidak dicentang, streak putus (0).
    if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) {
        return 0;
    }

    // Hitung beruntun mundur
    while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        if (sortedDates.includes(dateStr)) {
            currentStreak++;
            checkDate = subDays(checkDate, 1);
        } else if (dateStr === todayStr) {
           // Boleh bolong hari ini, lanjut cek kemarin
           checkDate = subDays(checkDate, 1);
        } else {
            break; // Streak putus
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
    setOpenMenuId(null); // Tutup menu saat mau edit
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
        // --- EDIT HABIT ---
        const updatedHabitData = {
          title: newTitle.trim(),
          icon: newIcon,
          color: newColor,
        };
        await updateHabit(editingId, updatedHabitData);
        setHabits(habits.map(h => h.id === editingId ? { ...h, ...updatedHabitData } : h));
      } else {
        // --- TAMBAH HABIT BARU ---
        const newHabitData = {
          userId: user.uid,
          title: newTitle.trim(),
          icon: newIcon,
          color: newColor,
          completedDates: []
        };
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

    if (isCompletedToday) {
      updatedDates = updatedDates.filter(d => d !== todayStr); // Uncheck
    } else {
      updatedDates.push(todayStr); // Check
    }

    // Optimistic Update UI
    setHabits(habits.map(h => h.id === habit.id ? { ...h, completedDates: updatedDates } : h));

    try {
      await updateHabit(habit.id, { completedDates: updatedDates });
    } catch (err) {
      // Revert if failed
      showAlert("Gagal", "Gagal menyimpan status kebiasaan.");
      setHabits(habits.map(h => h.id === habit.id ? { ...h, completedDates: habit.completedDates } : h));
    }
  };

  const handleDeleteHabit = (id: string, title: string) => {
    setOpenMenuId(null); // Tutup dropdown menu segera
    
    showConfirm("Hapus Kebiasaan?", `Yakin ingin menghapus tracker "${title}" beserta seluruh riwayat streak-nya?`, async () => {
      // Optimistic update: langsung buang dari layar dengan callback param (prev) yang 100% aman
      setHabits((prev) => prev.filter((h) => h.id !== id));
      
      try {
        await deleteHabit(id);
      } catch (err) {
        console.error("Gagal menghapus habit:", err);
        showAlert("Gagal", "Terjadi kesalahan saat menghapus data.");
        // Jika penghapusan database gagal, kita fetch ulang dari server untuk jaga-jaga
        if (user) {
          const data = await getUserHabits(user.uid);
          setHabits(data);
        }
      }
    });
  };

  if (isLoading) return <div className="h-24 flex items-center justify-center border border-dashed rounded-3xl animate-pulse bg-muted/20">Memuat Habit...</div>;

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" /> Habit Tracker
          </h2>
          <p className="text-xs text-muted-foreground">Bangun rutinitas positif harianmu.</p>
        </div>
        {!isAdding && (
          <Button variant="outline" size="sm" onClick={handleOpenAddForm} className="rounded-full font-bold h-9">
            <Plus className="w-4 h-4 mr-1" /> Habit
          </Button>
        )}
      </div>

      {/* Form Tambah/Edit Habit */}
      {isAdding && (
        <div className="bg-card border border-primary/40 rounded-[2rem] p-5 shadow-lg animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm">{editingId ? "Edit Kebiasaan" : "Kebiasaan Baru"}</h3>
            <button onClick={handleCloseForm} className="text-muted-foreground hover:bg-muted rounded-full p-1"><X className="w-4 h-4"/></button>
          </div>
          
          <div className="space-y-4">
            <input 
              type="text" 
              placeholder="Contoh: Baca Buku 15 Menit" 
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full bg-muted/50 border-none outline-none py-3 px-4 rounded-xl text-sm focus:ring-2 focus:ring-primary/50"
              autoFocus
            />
            
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Pilih Ikon</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_ICONS.map(icon => (
                  <button 
                    key={icon} 
                    onClick={() => setNewIcon(icon)}
                    className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${newIcon === icon ? 'bg-primary/20 ring-2 ring-primary scale-110' : 'bg-muted hover:bg-muted-foreground/10'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2">Pilih Warna Aksen</p>
              <div className="flex gap-2">
                {PRESET_COLORS.map(color => (
                  <button 
                    key={color} 
                    onClick={() => setNewColor(color)}
                    className={`w-8 h-8 rounded-full transition-all ${color} ${newColor === color ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110' : 'opacity-70 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>

            <Button onClick={handleSaveHabit} disabled={isSubmitting || !newTitle.trim()} className="w-full rounded-xl font-bold">
              {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editingId ? "Simpan Perubahan" : "Simpan Habit"}
            </Button>
          </div>
        </div>
      )}

      {/* Daftar Habit */}
      {!isAdding && habits.length === 0 && (
        <div className="p-6 text-center border border-dashed rounded-3xl bg-muted/10">
          <p className="text-sm font-medium text-muted-foreground">Belum ada kebiasaan yang dilacak.</p>
        </div>
      )}

      {/* Logika dinamis untuk Grid Columns */}
      <div className={`grid gap-3 grid-cols-2 md:grid-cols-3`}>
        {habits.map((habit, index) => {
          const isCompletedToday = habit.completedDates.includes(todayStr);
          const currentStreak = calculateStreak(habit.completedDates);
          const isFire = currentStreak >= 3; // Streak menyala (pulsing) jika minimal 3 hari
          const isMenuOpen = openMenuId === habit.id;
          
          // Logika Bento Grid: Jika jumlah habit ganjil dan ini adalah elemen terakhir
          const isLastOddItem = habits.length % 2 !== 0 && index === habits.length - 1;
          const colSpanClass = isLastOddItem ? 'col-span-2 md:col-span-1' : 'col-span-1';

          return (
            <div key={habit.id} className={`relative flex flex-col p-4 rounded-3xl border transition-all duration-300 overflow-visible ${colSpanClass} ${isCompletedToday ? `${habit.color} border-transparent shadow-md` : 'bg-card border-border hover:border-primary/30'}`}>
              
              {/* Header Card: Ikon di kiri, Judul di sebelahnya, Menu di kanan atas */}
              {/* FIX UTAMA: z-50 di sini memastikan seluruh header card dan menunya selalu di atas ikon api */}
              <div className="flex items-start justify-between z-50 relative">
                <div className={`flex items-center gap-3 flex-1 pr-2`}>
                  <div className={`w-10 h-10 text-2xl shrink-0 rounded-2xl flex items-center justify-center shadow-inner transition-all ${isCompletedToday ? 'bg-white/20' : 'bg-muted'}`}>
                    {habit.icon}
                  </div>
                  <h3 className={`font-bold text-[13px] leading-tight line-clamp-2 ${isCompletedToday ? 'text-white' : 'text-foreground'}`}>
                    {habit.title}
                  </h3>
                </div>

                {/* Kebab Menu Button */}
                <div className="relative shrink-0 -mt-1 -mr-2">
                  <button 
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      setOpenMenuId(isMenuOpen ? null : habit.id!); 
                    }}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors relative z-20 ${isCompletedToday ? 'text-white/70 hover:text-white hover:bg-white/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  >
                    <MoreVertical className="w-4 h-4 pointer-events-none" />
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-[60]" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuId(null); }}></div>
                      <div className="absolute right-0 top-full mt-1 w-32 bg-card border border-border shadow-xl rounded-xl z-[70] overflow-hidden animate-in zoom-in-95 duration-200 origin-top-right">
                        <button 
                          onClick={(e) => { 
                            e.preventDefault();
                            e.stopPropagation(); 
                            handleOpenEditForm(habit); 
                          }} 
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-muted text-foreground font-medium transition-colors border-b border-border/50 relative z-10"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteHabit(habit.id!, habit.title);
                          }} 
                          className="w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-destructive/10 text-destructive font-medium transition-colors relative z-10"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Area Tengah: BIG STREAK FLAME */}
              {/* FIX UTAMA: pointer-events-none memastikan ruang kosong di sekitar api tidak memblokir klik mouse */}
              <div className="flex-1 flex flex-col items-center justify-center my-4 z-0 pointer-events-none relative">
                 <div className={`flex flex-col items-center justify-center transition-all duration-500 pointer-events-auto ${isCompletedToday ? 'scale-110' : 'scale-100 opacity-60 grayscale'}`}>
                    <Flame className={`w-10 h-10 ${isCompletedToday ? 'text-orange-300 drop-shadow-[0_0_8px_rgba(253,186,116,0.8)]' : 'text-orange-500'} ${isFire && isCompletedToday ? 'animate-pulse' : ''}`} />
                    <span className={`text-xl font-black tracking-tighter mt-1 ${isCompletedToday ? 'text-white' : 'text-foreground'}`}>
                      {currentStreak} <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Hari</span>
                    </span>
                 </div>
              </div>

              {/* Tombol Aksi Bawah */}
              <button 
                onClick={() => handleToggleHabit(habit)}
                className={`mt-2 w-full py-2.5 rounded-xl text-xs font-bold transition-all z-10 flex items-center justify-center gap-2 ${isCompletedToday ? 'bg-white text-black shadow-lg hover:scale-95' : 'bg-muted hover:bg-primary/10 hover:text-primary'}`}
              >
                {isCompletedToday ? <><Check className="w-4 h-4"/> Selesai</> : "Tandai Selesai"}
              </button>

              {/* Efek Latar Belakang jika Selesai */}
              {isCompletedToday && (
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl z-0 pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}