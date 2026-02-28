"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Send, Loader2, MessageSquareQuote, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { addFeedback } from "@/lib/feedback-service";

export default function FeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- STATE CUSTOM DIALOG MODAL ---
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Terima Kasih! 🎉</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8 max-w-[300px]">
          Masukan kamu sudah berhasil dikirim dan akan sangat membantu perkembangan Nexa ke depannya.
        </p>
        <Button onClick={() => router.push("/")} className="rounded-xl px-8 shadow-md">
          Kembali ke Beranda
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto">
      {/* Header Statis */}
      <div className="p-4 flex items-center gap-3">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Kirim Masukan</span>
      </div>

      <div className="px-5 mt-2 space-y-8">
        
        {/* Intro */}
        <div className="text-center space-y-4 pt-2">
          <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-2xl flex items-center justify-center mb-2">
            <MessageSquareQuote className="w-8 h-8 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Bagaimana Pengalamanmu?</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-[280px] mx-auto">
              Bantu kami membuat Nexa lebih baik. Laporkan bug, berikan saran fitur, atau sekadar kasih semangat!
            </p>
          </div>
        </div>

        <div className="space-y-6 bg-card border border-border p-6 rounded-3xl shadow-sm">
          {/* Star Rating Interaktif */}
          <div className="space-y-3 text-center">
            <p className="text-sm font-bold text-foreground uppercase tracking-wider">Berikan Penilaian</p>
            <div className="flex items-center justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110 focus:outline-none"
                >
                  <Star 
                    className={`w-10 h-10 transition-colors duration-200 ${
                      star <= (hoveredRating || rating) 
                        ? "fill-[#E5B034] text-[#E5B034]" 
                        : "fill-muted text-muted-foreground/30"
                    }`} 
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-medium text-muted-foreground h-4">
              {rating === 1 && "Kurang memuaskan 😢"}
              {rating === 2 && "Bisa lebih baik 🤔"}
              {rating === 3 && "Cukup bagus 😐"}
              {rating === 4 && "Sangat bagus! 😃"}
              {rating === 5 && "Sempurna! Aku suka 💖"}
            </p>
          </div>

          <div className="h-px bg-border/50" />

          {/* Textarea Masukan */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground uppercase tracking-wider block">Pesan Kamu</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ceritakan detailnya di sini... (Misal: Aku pengen ada fitur dark mode warna pink!)"
              className="w-full bg-muted/50 border border-border outline-none resize-none text-sm placeholder:text-muted-foreground/50 min-h-[120px] p-4 rounded-2xl focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="w-full h-12 rounded-xl bg-primary text-white shadow-md hover:bg-primary/90 font-bold"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Send className="w-5 h-5 mr-2" />
            )}
            {isSubmitting ? "Mengirim..." : "Kirim Masukan"}
          </Button>
        </div>
      </div>

      {/* CUSTOM DIALOG MODAL */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-2xl w-full max-w-sm text-center flex flex-col items-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4 bg-primary/10 text-primary">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-xl mb-2">{dialog.title}</h3>
            <p className="text-sm text-muted-foreground mb-6">{dialog.message}</p>
            <Button className="w-full rounded-xl h-11" onClick={() => setDialog({ ...dialog, isOpen: false })}>Oke, Mengerti</Button>
          </div>
        </div>
      )}

    </div>
  );
}