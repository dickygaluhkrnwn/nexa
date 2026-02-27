"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserProfile, updateUserProfile } from "@/lib/user-service";
import { Button } from "@/components/ui/button";
import { LogOut, Save, Loader2, Phone, BellRing, Pencil, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [whatsapp, setWhatsapp] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // State untuk mode edit

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const profile = await getUserProfile(user.uid);
        if (profile?.whatsappNumber) {
          setWhatsapp(profile.whatsappNumber);
        }
      } catch (error) {
        console.error("Gagal memuat profil", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push("/");
    return null;
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Format nomor WA sederhana (hilangkan spasi/karakter aneh)
      const cleanNumber = whatsapp.replace(/[^0-9]/g, '');
      await updateUserProfile(user.uid, { whatsappNumber: cleanNumber });
      alert("Pengaturan profil berhasil disimpan!");
      setIsEditing(false); // Keluar dari mode edit setelah sukses simpan
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan profil.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm("Apakah kamu yakin ingin keluar?")) {
      await logout();
      router.push("/");
    }
  };

  return (
    <div className="p-4 pb-24 space-y-8 animate-in fade-in duration-500">
      
      {/* Bagian Header Profil */}
      <div className="flex flex-col items-center text-center mt-8 space-y-4">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl relative group">
          <img 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
        <div>
          <h1 className="text-2xl font-bold">{user.displayName}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Bagian Pengaturan Notifikasi */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-xl text-green-600">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-base">Notifikasi WhatsApp</h2>
              <p className="text-xs text-muted-foreground">Pengingat tugas dari Nexa</p>
            </div>
          </div>
          
          {/* Tombol Toggle Edit */}
          {!isEditing && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="text-primary hover:text-primary hover:bg-primary/10 rounded-full px-4"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
        
        <div className="space-y-3 pt-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            Nomor WhatsApp
          </label>

          {isEditing ? (
            /* Mode Edit */
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">+62</span>
                  <input
                    type="tel"
                    placeholder="81234567890"
                    value={whatsapp.replace(/^62|^0/, '')}
                    onChange={(e) => setWhatsapp("62" + e.target.value.replace(/^0/, ''))}
                    className="w-full bg-muted pl-11 pr-4 py-2.5 text-sm rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
                    autoFocus
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground italic">
                *Gunakan format tanpa angka 0 di depan (Contoh: 812...).
              </p>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)} 
                  disabled={isSaving}
                  className="flex-1 rounded-xl"
                >
                  <X className="w-4 h-4 mr-2" />
                  Batal
                </Button>
                <Button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="flex-1 rounded-xl"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Simpan
                </Button>
              </div>
            </div>
          ) : (
            /* Mode Tampilan Biasa (View) */
            <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
              <p className="text-base font-medium">
                {whatsapp ? (
                  <span className="tracking-wide">+{whatsapp}</span>
                ) : (
                  <span className="text-muted-foreground italic text-sm">Belum diatur</span>
                )}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pengaturan Akun Lainnya (Opsional ke depannya) */}
      <div className="bg-card border border-border rounded-2xl p-2 shadow-sm">
        <Button 
          variant="ghost" 
          onClick={handleLogout} 
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl p-4 h-auto"
        >
          <div className="p-2 bg-destructive/10 rounded-lg mr-3">
            <LogOut className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-sm">Keluar dari Akun</h3>
            <p className="text-xs opacity-80 font-normal">Sesi akan diakhiri dari perangkat ini</p>
          </div>
        </Button>
      </div>

    </div>
  );
}