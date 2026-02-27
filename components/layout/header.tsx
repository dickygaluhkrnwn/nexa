"use client";

import { Moon, Sun, Menu, X, Settings, Download, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

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

  // Fungsi untuk logout
  const handleLogout = async () => {
    if (confirm("Apakah kamu yakin ingin keluar?")) {
      await logout();
      setIsMenuOpen(false);
    }
  };

  return (
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
  );
}