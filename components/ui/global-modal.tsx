"use client";

import { useModal } from "@/hooks/use-modal";
import { Button } from "@/components/ui/button";
import { AlertCircle, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

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

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border p-6 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 text-center flex flex-col items-center pointer-events-auto">
        
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${type === 'confirm' ? 'bg-destructive/10 text-destructive' : type === 'quota' ? 'bg-orange-500/10 text-orange-500' : 'bg-primary/10 text-primary'}`}>
          {type === 'quota' ? <Sparkles className="w-7 h-7" /> : <AlertCircle className="w-7 h-7" />}
        </div>
        
        <h3 className="font-bold text-xl mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{message}</p>
        
        <div className="flex gap-3 w-full">
          {type === "confirm" && (
            <Button variant="outline" className="flex-1 rounded-xl h-11 border-border bg-transparent" onClick={closeModal}>
              Batal
            </Button>
          )}
          {type === "confirm" && (
            <Button className="flex-1 rounded-xl h-11 text-white shadow-md bg-destructive hover:bg-destructive/90" onClick={handleConfirm}>
              Ya, Lanjutkan
            </Button>
          )}

          {type === "alert" && (
            <Button className="flex-1 rounded-xl h-11 text-white shadow-md bg-primary hover:bg-primary/90" onClick={closeModal}>
              Oke, Mengerti
            </Button>
          )}

          {type === "quota" && (
            <>
              <Button variant="outline" className="flex-1 rounded-xl h-11 border-border bg-transparent" onClick={closeModal}>
                Nanti Saja
              </Button>
              <Button className="flex-1 rounded-xl h-11 text-white shadow-md bg-gradient-to-r from-orange-500 to-red-500 hover:opacity-90 border-0" onClick={handleFunding}>
                💖 Dukung Nexa
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}