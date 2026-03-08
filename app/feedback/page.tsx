"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Send, Loader2, MessageSquareQuote, CheckCircle2, AlertCircle, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { addFeedback } from "@/lib/feedback-service";
import { cn } from "@/lib/utils";

export default function FeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [dialog, setDialog] = useState<{isOpen: boolean; title: string; message: string}>({
    isOpen: false, title: "", message: ""
  });
  const showAlert = (title: string, message: string) => setDialog({ isOpen: true, title, message });

  const handleSubmit = async () => {
    if (rating === 0) {
      showAlert("Perhatian", "Tolong berikan penilaian bintang terlebih dahulu ya!");
      return;
    }
    if (!message.trim()) {
      showAlert("Perhatian", "Kolom pesan tidak boleh kosong. Ceritakan pengalamanmu!");
      return;
    }

    setIsSubmitting(true);
    try {
      await addFeedback({
        userId: user ? user.uid : "guest",
        name: user?.displayName || "Pengguna Anonim",
        rating: rating,
        message: message.trim(),
      });
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      showAlert("Gagal", "Terjadi kesalahan saat mengirim masukan. Coba lagi nanti.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center animate-in zoom-in-95 duration-700 bg-background relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="w-28 h-28 bg-green-500/10 border border-green-500/20 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-green-500/20 relative z-10 rotate-6">
          <CheckCircle2 className="w-14 h-14 text-green-500" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black mb-4 relative z-10 tracking-tight">Terima Kasih! 🎉</h1>
        <p className="text-muted-foreground text-base md:text-lg leading-relaxed mb-10 max-w-md relative z-10">
          Masukan kamu sudah berhasil dikirim dan akan sangat membantu perkembangan Nexa ke depannya.
        </p>
        <Button onClick={() => router.push("/")} className="rounded-2xl h-14 px-10 shadow-xl font-bold text-base relative z-10">
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-500">
      {/* Header Statis */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center h-16 px-4 md:px-8 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors group-hover:-translate-x-1 duration-300">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="font-bold text-base md:text-lg tracking-tight">Kirim Masukan</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 md:px-8 mt-8 md:mt-12">
        {/* Split Pane Layout for Desktop */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start">
          
          {/* Kolom Kiri: Teks & Ilustrasi */}
          <div className="md:col-span-5 flex flex-col text-center md:text-left space-y-6 pt-4 md:sticky md:top-28">
            <div className="w-20 h-20 mx-auto md:mx-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-green-500/20 mb-2">
              <MessageSquareQuote className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
              Bagaimana Pengalamanmu?
            </h1>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed font-medium">
              Bantu kami membuat Nexa lebih baik. Laporkan bug, berikan saran fitur baru, atau sekadar kasih semangat untuk developer!
            </p>
            <div className="hidden md:flex items-center gap-3 mt-8 bg-muted/40 p-4 rounded-2xl border border-border">
              <HeartHandshake className="w-8 h-8 text-primary shrink-0" />
              <p className="text-xs font-semibold text-muted-foreground leading-snug">Semua masukan akan dibaca langsung oleh pengembang untuk menentukan arah pembaruan selanjutnya.</p>
            </div>
          </div>

          {/* Kolom Kanan: Form */}
          <div className="md:col-span-7 bg-card border border-border/60 p-6 md:p-10 rounded-[2.5rem] shadow-xl">
            
            {/* Star Rating Interaktif */}
            <div className="space-y-4 mb-8">
              <p className="text-sm font-extrabold text-foreground uppercase tracking-widest">Penilaian Keseluruhan</p>
              <div className="flex items-center gap-2 md:gap-3 bg-muted/30 p-4 rounded-2xl border border-border/50 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    className="p-1 md:p-2 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star 
                      className={cn(
                        "w-10 h-10 md:w-12 md:h-12 transition-all duration-300 drop-shadow-sm",
                        star <= (hoveredRating || rating) 
                          ? "fill-[#E5B034] text-[#E5B034] scale-110" 
                          : "fill-muted text-muted-foreground/20"
                      )} 
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm font-bold text-center h-5 text-primary">
                {rating === 1 && "Kurang memuaskan 😢"}
                {rating === 2 && "Bisa lebih baik 🤔"}
                {rating === 3 && "Cukup bagus 😐"}
                {rating === 4 && "Sangat bagus! 😃"}
                {rating === 5 && "Sempurna! Aku suka 💖"}
              </p>
            </div>

            {/* Textarea Masukan */}
            <div className="space-y-3 mb-8">
              <label className="text-sm font-extrabold text-foreground uppercase tracking-widest block">Saran & Pesan</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ceritakan detailnya di sini... (Misal: Aku pengen ada fitur dark mode warna pink!)"
                className="w-full bg-background border border-border outline-none resize-none text-sm md:text-base placeholder:text-muted-foreground/50 min-h-[160px] p-5 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/50 transition-all shadow-inner"
              />
            </div>

            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting} 
              className="w-full h-14 rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:bg-primary/90 font-bold text-base transition-transform active:scale-[0.98]"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Send className="w-5 h-5 mr-3" />
              )}
              {isSubmitting ? "Mengirim Data..." : "Kirim Masukan"}
            </Button>
          </div>

        </div>
      </main>

      {/* CUSTOM DIALOG MODAL */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border/60 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm text-center flex flex-col items-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 bg-primary/10 text-primary border border-primary/20 shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="font-extrabold text-2xl mb-3 text-foreground tracking-tight">{dialog.title}</h3>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed font-medium">{dialog.message}</p>
            <Button className="w-full rounded-xl h-12 font-bold text-base" onClick={() => setDialog({ ...dialog, isOpen: false })}>Oke, Mengerti</Button>
          </div>
        </div>
      )}

    </div>
  );
}