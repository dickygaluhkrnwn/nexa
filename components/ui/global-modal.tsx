"use client";

import { useModal } from "@/hooks/use-modal";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function GlobalModal() {
  const { isOpen, title, message, type, onConfirm, closeModal } = useModal();
  const router = useRouter();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    closeModal();
  };

  const handleFunding = () => {
    closeModal();
    router.push("/funding");
  };

  // Konfigurasi tema berdasarkan tipe alert
  const themeConfig = {
    confirm: {
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
      line: "bg-destructive",
      icon: AlertCircle
    },
    quota: {
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
      line: "bg-orange-500",
      icon: Sparkles
    },
    alert: {
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-primary/20",
      line: "bg-primary",
      icon: Info
    }
  };

  const currentTheme = themeConfig[type] || themeConfig.alert;
  const IconComponent = currentTheme.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={closeModal} />
      
      {/* Modal Box diperbesar untuk Desktop */}
      <div className="bg-card border border-border/60 p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-sm md:max-w-md animate-in zoom-in-95 text-center flex flex-col items-center pointer-events-auto relative overflow-hidden z-10">
        
        {/* Garis Aksen di Atas */}
        <div className={cn("absolute top-0 left-0 w-full h-1.5", currentTheme.line)} />
        
        {/* Ikon Lingkaran */}
        <div className={cn("w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mb-6 border shadow-inner", currentTheme.bg, currentTheme.color, currentTheme.border)}>
          <IconComponent className="w-8 h-8 md:w-10 md:h-10" />
        </div>
        
        <h3 className="font-extrabold text-2xl md:text-3xl mb-3 text-foreground tracking-tight">{title}</h3>
        <p className="text-sm md:text-base text-muted-foreground mb-8 leading-relaxed">{message}</p>
        
        {/* Kumpulan Tombol */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          {type === "confirm" && (
            <>
              <Button variant="outline" className="flex-1 rounded-2xl h-12 md:h-14 font-bold border-border bg-card shadow-sm text-base hover:bg-muted" onClick={closeModal}>
                Batal
              </Button>
              <Button className="flex-1 rounded-2xl h-12 md:h-14 font-bold text-white shadow-md bg-destructive hover:bg-destructive/90 text-base border-0" onClick={handleConfirm}>
                Ya, Lanjutkan
              </Button>
            </>
          )}

          {type === "alert" && (
            <Button className="w-full rounded-2xl h-12 md:h-14 font-bold text-primary-foreground shadow-md bg-primary hover:bg-primary/90 text-base" onClick={closeModal}>
              Oke, Mengerti
            </Button>
          )}

          {type === "quota" && (
            <>
              <Button variant="outline" className="flex-1 rounded-2xl h-12 md:h-14 font-bold border-border bg-card shadow-sm text-base hover:bg-muted" onClick={closeModal}>
                Nanti Saja
              </Button>
              <Button className="flex-1 rounded-2xl h-12 md:h-14 font-bold text-white shadow-md bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 border-0 text-base" onClick={handleFunding}>
                💖 Dukung Nexa
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}