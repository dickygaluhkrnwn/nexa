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

  const handleResetPassword = async () => {
    if (!user || !user.email) {
      showAlert("Gagal", "Email pengguna tidak ditemukan.");
      return;
    }
    
    setIsSendingEmail(true);
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, user.email);
      showAlert(
        "Email Terkirim! 📧", 
        `Link untuk mengatur ulang atau membuat password telah dikirim ke ${user.email}. Silakan periksa kotak masukmu.`
      );
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      showAlert("Gagal Mengirim", "Terjadi kesalahan saat mengirim email. Pastikan koneksi internet stabil.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
      
      {/* 1. PENGATURAN BRANKAS (PIN) */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> Perlindungan Privasi
        </h3>
        <div className="bg-background border border-border/60 rounded-[2rem] p-6 md:p-8 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 rounded-2xl text-purple-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-base md:text-lg">Brankas Rahasia</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Kunci catatan penting dengan PIN khusus.</p>
              </div>
            </div>
            
            {!isEditingPin && (
              <Button 
                variant="outline" 
                onClick={() => setIsEditingPin(true)}
                className="text-primary hover:text-primary hover:bg-primary/5 rounded-xl px-5 font-bold h-11"
              >
                <Pencil className="w-4 h-4 mr-2" /> {pinCode ? "Ubah PIN" : "Buat PIN"}
              </Button>
            )}
          </div>
          
          <div>
            {isEditingPin ? (
              <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300 bg-muted/20 p-5 rounded-[1.5rem] border border-border/50 max-w-md">
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-purple-500 transition-colors" />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Ketik 4 Angka"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-background pl-14 pr-4 py-4 text-center tracking-[1em] text-2xl font-black rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all border border-border focus:border-purple-500/30 shadow-inner"
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setIsEditingPin(false)} disabled={isSaving} className="flex-1 rounded-xl h-11 font-bold">
                    Batal
                  </Button>
                  <Button onClick={onSavePin} disabled={isSaving || pinCode.length !== 4} className="flex-1 rounded-xl h-11 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/40 rounded-xl border border-border/50 inline-flex items-center justify-center min-w-[250px]">
                <p className="text-2xl tracking-[0.5em] font-black text-foreground/80 mt-1">
                  {pinCode ? "••••" : (
                    <span className="text-sm font-medium tracking-normal text-muted-foreground/80 italic">
                      PIN Keamanan Belum Diatur
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-border/50" />

      {/* 2. PENGATURAN PASSWORD (KREDENSIAL) */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <KeyRound className="w-5 h-5" /> Kredensial Akun
        </h3>
        
        <div className="bg-background border border-border/60 rounded-[2rem] p-6 md:p-8 shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start md:items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl text-blue-600 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-bold text-base md:text-lg">Atur / Ganti Password</h2>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 max-w-sm leading-relaxed">
                Jika kamu mendaftar via Google, gunakan fitur ini untuk membuat password independen demi login yang lebih fleksibel.
              </p>
            </div>
          </div>

          <Button 
            onClick={handleResetPassword} 
            disabled={isSendingEmail}
            variant="outline"
            className="w-full md:w-auto rounded-xl font-bold border-border shadow-sm bg-background hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-600 transition-all h-12 px-6"
          >
            {isSendingEmail ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Mail className="w-5 h-5 mr-2" />}
            Kirim Link via Email
          </Button>
        </div>
      </div>

    </div>
  );
}