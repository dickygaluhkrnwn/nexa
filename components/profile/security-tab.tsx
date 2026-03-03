"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Pencil, Lock, Loader2, Save, KeyRound, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useModal } from "@/hooks/use-modal";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

interface SecurityTabProps {
  pinCode: string;
  setPinCode: (val: string) => void;
  isEditingPin: boolean;
  setIsEditingPin: (val: boolean) => void;
  isSaving: boolean;
  onSavePin: () => void;
}

export function SecurityTab({ pinCode, setPinCode, isEditingPin, setIsEditingPin, isSaving, onSavePin }: SecurityTabProps) {
  const { user } = useAuth();
  const { showAlert } = useModal();
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // --- FUNGSI MENGIRIM LINK RESET/BUAT PASSWORD ---
  const handleResetPassword = async () => {
    if (!user || !user.email) {
      showAlert("Gagal", "Email pengguna tidak ditemukan.");
      return;
    }
    
    setIsSendingEmail(true);
    try {
      const auth = getAuth();
      // Mengirim email pengaturan sandi bawaan Firebase
      await sendPasswordResetEmail(auth, user.email);
      showAlert(
        "Email Terkirim! 📧", 
        `Link untuk mengatur password telah dikirim ke ${user.email}. Silakan klik link di email tersebut untuk membuat kata sandimu, lalu gunakan untuk login di Nexa Mobile.`
      );
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      showAlert("Gagal Mengirim", "Terjadi kesalahan saat mengirim email. Pastikan koneksi internet stabil.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
      
      {/* 1. PENGATURAN BRANKAS (PIN) */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 ml-1 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> Perlindungan Catatan
        </h3>
        <div className="bg-card border border-border/60 rounded-[2rem] p-5 shadow-sm space-y-5 transition-all hover:shadow-md">
          <div className="flex items-center justify-between border-b border-border/50 pb-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-600 shadow-inner">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-bold text-base">Brankas Rahasia</h2>
                <p className="text-xs text-muted-foreground mt-0.5">PIN 4 angka akses catatan</p>
              </div>
            </div>
            
            {!isEditingPin && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditingPin(true)}
                className="text-primary hover:text-primary hover:bg-primary/10 rounded-full px-4 font-bold"
              >
                <Pencil className="w-4 h-4 mr-2" /> Edit
              </Button>
            )}
          </div>
          
          <div>
            {isEditingPin ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 bg-muted/30 p-4 rounded-2xl border border-border/50">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Masukkan 4 Angka"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-background pl-12 pr-4 py-3.5 text-center tracking-[1em] text-xl font-black rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all border border-border focus:border-purple-500/30 shadow-inner"
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" onClick={() => setIsEditingPin(false)} disabled={isSaving} className="flex-1 rounded-xl h-11 font-bold">
                    Batal
                  </Button>
                  <Button onClick={onSavePin} disabled={isSaving || pinCode.length !== 4} className="flex-1 rounded-xl h-11 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 flex items-center justify-center">
                <p className="text-2xl tracking-[0.5em] font-black text-foreground/80">
                  {pinCode ? "••••" : (
                    <span className="text-sm font-medium tracking-normal text-muted-foreground/80 italic">
                      Keamanan Belum Diatur
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. PENGATURAN PASSWORD (KREDENSIAL) */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 ml-1 flex items-center gap-2">
          <KeyRound className="w-4 h-4" /> Kredensial Akun
        </h3>
        
        <div className="bg-card border border-border/60 rounded-[2rem] p-5 shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 shadow-inner shrink-0 mt-1 md:mt-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Atur / Ganti Password</h2>
              <p className="text-xs text-muted-foreground mt-1 max-w-[280px] leading-relaxed">
                Jika sebelumnya kamu mendaftar menggunakan Google, gunakan fitur ini untuk membuat kata sandi agar bisa login di Nexa Mobile.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleResetPassword} 
            disabled={isSendingEmail}
            variant="outline"
            className="w-full md:w-auto rounded-xl font-bold border-border shadow-sm bg-background hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30 transition-all h-11 px-5"
          >
            {isSendingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            Kirim Link via Email
          </Button>
        </div>
      </div>

    </div>
  );
}