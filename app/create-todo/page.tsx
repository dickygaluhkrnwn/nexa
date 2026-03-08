"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { addNote, SubTask } from "@/lib/notes-service"; 
import { Button } from "@/components/ui/button";
import { Loader2, Save, ArrowLeft, AlignLeft, Sparkles, LayoutList, X, Bot } from "lucide-react";
import Link from "next/link";
import { useModal } from "@/hooks/use-modal"; 
import { useGemini } from "@/hooks/use-gemini"; 
import { cn } from "@/lib/utils";

import { SubTaskList } from "@/components/todo/sub-task-list";
import { TaskSettings } from "@/components/todo/task-settings";

export default function CreateTodoPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { showAlert } = useModal(); 
  const { callAI } = useGemini(); 
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState(""); 
  const [recurrence, setRecurrence] = useState("none");
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // State untuk Modal AI Project Breakdown
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Silakan login terlebih dahulu.</p>
        <Button variant="link" onClick={() => router.push('/')}>Kembali ke Home</Button>
      </div>
    );
  }

  const handleSave = async () => {
    if (!title.trim()) {
      showAlert("Perhatian", "Judul tugas tidak boleh kosong!");
      return;
    }

    setIsSaving(true);
    try {
      await addNote({
        title: title.trim(),
        content: content.trim(),
        tags: [],
        isTodo: true,
        dueDate: dueDate || null,
        dueTime: dueTime || null, 
        recurrence: recurrence,
        isHidden: false,
        isPinned: false,
        isCompleted: false,
        subTasks: subTasks,
        userId: user.uid,
      } as any); 
      router.push("/todo");
    } catch (error) {
      console.error(error);
      showAlert("Gagal", "Terjadi kesalahan saat menyimpan tugas.");
      setIsSaving(false);
    }
  };

  const handleProjectBreakdown = async () => {
    if (!aiPrompt.trim()) {
      showAlert("Perhatian", "Prompt tidak boleh kosong. Ceritakan sedikit tentang proyekmu!");
      return;
    }

    setIsAiLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await callAI({ 
        action: "project-breakdown", 
        content: aiPrompt, // Menggunakan prompt dari Modal, bukan title
        context: `Hari ini adalah tanggal ${today}.`
      });
      
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        if (parsed.subTasks && Array.isArray(parsed.subTasks)) {
          const newSubTasks = parsed.subTasks.map((task: any, index: number) => {
            const textValue = typeof task === 'string' ? task : task.text;
            const timeValue = typeof task === 'object' && task.time ? task.time : undefined;
            return {
              id: Date.now().toString() + index.toString(),
              text: textValue,
              time: timeValue,
              isCompleted: false
            };
          });
          setSubTasks(prev => [...prev, ...newSubTasks]);
        }
        
        if (parsed.description) {
          setContent(prev => prev ? prev + "\n\n---\n🎯 AI Strategy:\n" + parsed.description : "🎯 AI Strategy:\n" + parsed.description);
        }

        if (parsed.recommendedDueDate && !dueDate) {
          setDueDate(parsed.recommendedDueDate);
        }

        // Opsional: Jika judul masih kosong, AI bantu isikan dari prompt
        if (!title.trim()) {
           // Mengambil 5 kata pertama dari prompt sebagai judul sementara
           const autoTitle = aiPrompt.split(' ').slice(0, 5).join(' ') + '...';
           setTitle(autoTitle);
        }
        
        setIsAiModalOpen(false); // Tutup modal jika sukses
        setAiPrompt(""); // Bersihkan prompt
        showAlert("Berhasil! ✨", "AI telah memecah tugas dan menyusun jadwalmu berdasarkan instruksimu.");
      } else {
        throw new Error("Format respons tidak sesuai JSON.");
      }
    } catch (error: any) {
      console.error("Gagal melakukan breakdown:", error);
      if (error.message !== "QUOTA_EXCEEDED") {
        showAlert("Gagal", "AI kebingungan mencerna rencanamu. Coba tuliskan prompt dengan lebih spesifik.");
      }
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background animate-in fade-in duration-500 pb-32 lg:pb-10">
        
        {/* HEADER TOP BAR (Sticky & Profesional, Title di Header) */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50 px-3 md:px-6 h-16 flex items-center justify-between transition-all print:hidden">
          <div className="flex items-center gap-2 md:gap-4 flex-1">
            <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-muted text-muted-foreground shrink-0 w-9 h-9 -ml-2">
              <Link href="/todo"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            
            {/* Input Judul di Header */}
            <div className="flex flex-col flex-1 max-w-3xl">
              <div className="flex items-center w-full">
                <div className="p-1.5 bg-orange-500/10 rounded-lg hidden md:flex items-center justify-center shrink-0 mr-2">
                  <LayoutList className="w-4 h-4 text-orange-500" />
                </div>
                <input 
                  type="text" 
                  placeholder="Tulis judul tugas di sini..." 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="bg-transparent border-none outline-none font-bold text-lg md:text-xl text-foreground placeholder:text-muted-foreground/40 focus:ring-0 px-2 py-1 rounded-md hover:bg-muted/40 focus:bg-muted/40 transition-colors w-full max-w-[600px] truncate"
                  autoFocus
                />
              </div>
            </div>
          </div>

          {/* Tombol Simpan Desktop */}
          <div className="hidden lg:flex items-center gap-3">
            <Button variant="ghost" onClick={() => router.push("/todo")} className="rounded-xl font-semibold text-muted-foreground hover:text-foreground">
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !title.trim()} className="rounded-xl px-6 bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/20 transition-all h-10">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} 
              {isSaving ? "Menyimpan..." : "Simpan Tugas"}
            </Button>
          </div>
        </header>

        {/* Main Workspace (Split Grid di Desktop) */}
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* KIRI: AREA KONTEN UTAMA */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* Banner AI Magic Prominent */}
              <div className="bg-gradient-to-r from-purple-600/10 via-indigo-500/5 to-transparent border border-purple-500/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group transition-all hover:border-purple-500/40">
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-600 shrink-0 mt-1 sm:mt-0">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-purple-600 dark:text-purple-400 text-base md:text-lg flex items-center gap-2">
                      Bingung mulai dari mana?
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-md leading-relaxed">
                      Ceritakan tugasmu, dan AI akan merancangkan langkah-langkah detail, estimasi waktu, serta menyusun strateginya untukmu.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={() => setIsAiModalOpen(true)} 
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md shrink-0 w-full sm:w-auto h-11"
                >
                  <Sparkles className="w-4 h-4 mr-2" /> Tanya AI
                </Button>
              </div>

              {/* Input Deskripsi Tambahan */}
              <div className="bg-card border border-border/60 shadow-sm rounded-2xl p-1 focus-within:border-primary/30 focus-within:ring-4 focus-within:ring-primary/5 transition-all">
                <div className="flex gap-3 p-4">
                  <AlignLeft className="w-5 h-5 text-muted-foreground mt-1 shrink-0" />
                  <textarea
                    placeholder="Tambahkan catatan, deskripsi proyek, atau detail lainnya di sini..."
                    value={content}
                    onChange={(e) => {
                      setContent(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    className="w-full bg-transparent border-none outline-none resize-none text-sm md:text-base text-foreground placeholder:text-muted-foreground/50 min-h-[120px] focus:ring-0 leading-relaxed"
                  />
                </div>
              </div>

              <div className="w-full h-px bg-border/40 my-2" />

              {/* Area Sub-Tasks */}
              <SubTaskList subTasks={subTasks} onChange={setSubTasks} />

            </div>

            {/* KANAN: PANEL PROPERTI (SIDEBAR) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="sticky top-24 space-y-6">
                
                <TaskSettings 
                  dueDate={dueDate} setDueDate={setDueDate}
                  dueTime={dueTime} setDueTime={setDueTime}
                  recurrence={recurrence} setRecurrence={setRecurrence}
                />

              </div>
            </div>

          </div>
        </div>

        {/* Floating Action Bar (Hanya Muncul di Mobile) */}
        <div className="lg:hidden fixed bottom-20 md:bottom-8 left-0 right-0 z-40 px-4 pointer-events-none">
          <div className="flex justify-end pointer-events-auto">
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !title.trim()} 
              className="rounded-full px-8 py-7 bg-orange-500 hover:bg-orange-600 shadow-xl shadow-orange-500/20 text-white font-bold border-0 text-base"
            >
              {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />} 
              {isSaving ? "Menyimpan..." : "Simpan Tugas"}
            </Button>
          </div>
        </div>

      </div>

      {/* =========================================
          MODAL AI PROJECT BREAKDOWN
          ========================================= */}
      {isAiModalOpen && (
        <>
          <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm animate-in fade-in" onClick={() => !isAiLoading && setIsAiModalOpen(false)}></div>
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-card border border-border shadow-2xl rounded-3xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 pointer-events-auto flex flex-col max-h-[90vh]">
              
              <div className="p-5 border-b border-border/50 bg-gradient-to-r from-purple-600/10 to-transparent flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 text-purple-600 dark:text-purple-400 font-bold text-lg">
                  <div className="p-2 bg-purple-500/20 rounded-xl">
                    <Sparkles className="w-5 h-5" /> 
                  </div>
                  AI Project Breakdown
                </div>
                <button onClick={() => !isAiLoading && setIsAiModalOpen(false)} disabled={isAiLoading} className="p-1.5 hover:bg-muted rounded-full text-muted-foreground transition-colors">
                  <X className="w-5 h-5"/>
                </button>
              </div>
              
              <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Deskripsikan secara rinci proyek atau tugas apa yang ingin kamu selesaikan. AI akan menganalisisnya dan membuatkan daftar periksa (checklist) serta rekomendasi jadwal untukmu.
                </p>
                <div className="relative">
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={isAiLoading}
                    placeholder="Contoh: Saya ingin membuat rencana belajar bahasa Spanyol dari nol untuk 1 bulan ke depan. Fokus ke percakapan sehari-hari..."
                    className="w-full min-h-[160px] bg-background border border-border/50 rounded-xl p-4 text-sm md:text-base outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 resize-none transition-all disabled:opacity-50"
                    autoFocus
                  />
                  {isAiLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-xl z-10">
                      <div className="flex flex-col items-center gap-3 text-purple-600 font-bold">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <span className="text-sm animate-pulse">Menyusun Rencana...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-5 bg-muted/20 border-t border-border/50 flex justify-end gap-3 shrink-0">
                <Button variant="ghost" onClick={() => setIsAiModalOpen(false)} disabled={isAiLoading} className="rounded-xl font-semibold">
                  Batal
                </Button>
                <Button 
                  onClick={handleProjectBreakdown} 
                  disabled={!aiPrompt.trim() || isAiLoading} 
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 font-bold shadow-md transition-all"
                >
                  {isAiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />} 
                  {isAiLoading ? "Memproses..." : "Generate Rencana"}
                </Button>
              </div>

            </div>
          </div>
        </>
      )}
    </>
  );
}