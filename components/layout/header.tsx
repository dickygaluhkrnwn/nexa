"use client";

import { Moon, Sun, Menu, X, Settings, Download, LogOut, AlertCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // State untuk mendeteksi arah scroll
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // State untuk PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // --- STATE CUSTOM DIALOG MODAL ---
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "alert" | "confirm";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({ isOpen: true, title, message, type: "confirm", onConfirm });
  };
  // ---------------------------------

  // Mencegah hydration error pada tema & Listen ke event install PWA
  useEffect(() => {
    setMounted(true);

    // Tangkap event install prompt dari browser
    const handleBeforeInstallPrompt = (e: any) => {
      // Mencegah browser menampilkan prompt install otomatis
      e.preventDefault();
      // Simpan event-nya untuk dipicu nanti saat tombol diklik
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  // Logika Scroll untuk menyembunyikan/menampilkan header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Sembunyikan jika scroll ke bawah lebih dari 50px
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
        setIsMenuOpen(false); // Tutup menu jika sedang terbuka saat di-scroll
      } else {
        // Tampilkan kembali jika scroll ke atas
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  // Fungsi untuk memicu proses instalasi PWA
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Tampilkan prompt instalasi bawaan browser
      deferredPrompt.prompt();
      // Tunggu respons dari user (diterima atau ditolak)
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        // Jika diinstal, sembunyikan tombol
        setDeferredPrompt(null);
      }
    }
    setIsMenuOpen(false);
  };

  // Fungsi untuk logout dengan Custom Modal
  const handleLogout = () => {
    setIsMenuOpen(false); // Tutup menu dropdown terlebih dahulu
    showConfirm(
      "Keluar Akun?", 
      "Apakah kamu yakin ingin keluar dari sesi Nexa saat ini?", 
      async () => {
        await logout();
      }
    );
  };

  return (
    <>
      <header 
        className={cn(
          "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-transform duration-300",
          isVisible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto relative">
          <div className="flex items-center gap-2">
            {/* Logo Nexa */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              N
            </div>
            <span className="font-bold text-lg tracking-tight">Nexa</span>
          </div>

          {/* Tombol Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute top-14 right-4 mt-2 w-48 rounded-2xl border border-border bg-card shadow-lg py-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 border-b border-border/50 mb-1 flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pengaturan</p>
              </div>
              
              <button
                onClick={() => {
                  setTheme(theme === "light" ? "dark" : "light");
                }}
                className="w-full flex items-center px-4 py-3 text-sm hover:bg-muted transition-colors"
              >
                {mounted && theme === "dark" ? (
                  <>
                    <Sun className="h-4 w-4 mr-3 text-orange-400" />
                    <span className="font-medium">Mode Terang</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-4 w-4 mr-3 text-blue-500" />
                    <span className="font-medium">Mode Gelap</span>
                  </>
                )}
              </button>

              {/* Tombol Install PWA: Hanya muncul jika deferredPrompt tersedia (aplikasi belum diinstal) */}
              {deferredPrompt && (
                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center px-4 py-3 text-sm hover:bg-muted transition-colors text-primary font-medium border-t border-border/50"
                >
                  <Download className="h-4 w-4 mr-3" />
                  <span>Unduh Aplikasi</span>
                </button>
              )}

              {/* Tombol Logout: Hanya muncul jika user sudah login */}
              {user && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm hover:bg-destructive/10 transition-colors text-destructive font-medium border-t border-border/50"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  <span>Keluar Akun</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* CUSTOM DIALOG MODAL (Ditaruh di luar header agar tidak terpengaruh animasi transform header) */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 text-center flex flex-col items-center">
            
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${dialog.type === 'confirm' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              <AlertCircle className="w-7 h-7" />
            </div>
            
            <h3 className="font-bold text-xl mb-2">{dialog.title}</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{dialog.message}</p>
            
            <div className="flex gap-3 w-full">
              {dialog.type === "confirm" && (
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-11 border-border bg-transparent" 
                  onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                >
                  Batal
                </Button>
              )}
              <Button 
                className={`flex-1 rounded-xl h-11 text-white shadow-md ${dialog.type === 'confirm' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`} 
                onClick={() => {
                  if (dialog.type === "confirm" && dialog.onConfirm) {
                    dialog.onConfirm();
                  }
                  setDialog(prev => ({ ...prev, isOpen: false }));
                }}
              >
                {dialog.type === "confirm" ? "Ya, Keluar" : "Oke, Mengerti"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}