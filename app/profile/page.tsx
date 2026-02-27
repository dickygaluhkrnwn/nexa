"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserProfile, updateUserProfile } from "@/lib/user-service";
import { getUserNotes } from "@/lib/notes-service"; // Tambahan untuk mengambil statistik
import { Button } from "@/components/ui/button";
import { 
  Save, Loader2, Phone, BellRing, 
  Pencil, X, Lock, ShieldCheck, Sparkles, 
  FileText, CheckSquare, LockKeyhole 
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [whatsapp, setWhatsapp] = useState("");
  const [pinCode, setPinCode] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isEditingWA, setIsEditingWA] = useState(false);
  const [isEditingPin, setIsEditingPin] = useState(false);

  // State untuk Statistik Akun
  const [stats, setStats] = useState({ notes: 0, todos: 0, vault: 0 });

  useEffect(() => {
    const fetchProfileAndStats = async () => {
      if (!user) return;
      try {
        // Ambil Profil dan Catatan secara paralel untuk performa maksimal
        const [profile, notesData] = await Promise.all([
          getUserProfile(user.uid),
          getUserNotes(user.uid)
        ]);
        
        if (profile?.whatsappNumber) setWhatsapp(profile.whatsappNumber);
        if (profile?.pinCode) setPinCode(profile.pinCode);

        // Hitung Statistik
        setStats({
          notes: notesData.filter((n: any) => !n.isTodo && !n.isHidden).length,
          todos: notesData.filter((n: any) => n.isTodo && !n.isCompleted).length,
          vault: notesData.filter((n: any) => n.isHidden).length,
        });

      } catch (error) {
        console.error("Gagal memuat data profil", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndStats();
  }, [user]);

  // Gunakan useEffect untuk navigasi agar tidak bentrok dengan proses render React
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSaveWA = async () => {
    setIsSaving(true);
    try {
      const cleanNumber = whatsapp.replace(/[^0-9]/g, '');
      await updateUserProfile(user.uid, { whatsappNumber: cleanNumber });
      setIsEditingWA(false);
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan profil WhatsApp.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePin = async () => {
    if (pinCode.length !== 4) return alert("PIN harus tepat 4 angka!");
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { pinCode });
      setIsEditingPin(false);
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan PIN.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500 max-w-lg mx-auto">
      
      {/* 1. Header & Hero Profile */}
      <div className="relative mt-6 mb-8">
        {/* Background Accent Glow */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-3xl rounded-full" />
        
        <div className="relative flex flex-col items-center text-center space-y-4 pt-4">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-background shadow-2xl ring-4 ring-primary/20 ring-offset-2 ring-offset-background transition-all hover:ring-primary/40">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Badge Premium */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-full border-2 border-background flex items-center gap-1 shadow-lg whitespace-nowrap">
              <Sparkles className="w-3 h-3" /> Nexa Member
            </div>
          </div>
          
          <div className="pt-2">
            <h1 className="text-2xl font-bold tracking-tight">{user.displayName}</h1>
            <p className="text-sm text-muted-foreground font-medium">{user.email}</p>
          </div>
        </div>
      </div>

      {/* 2. Account Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm hover:border-primary/30 transition-colors">
          <FileText className="w-5 h-5 text-blue-500 mb-2" />
          <h3 className="text-xl font-bold text-foreground">{stats.notes}</h3>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Catatan</p>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm hover:border-orange-500/30 transition-colors">
          <CheckSquare className="w-5 h-5 text-orange-500 mb-2" />
          <h3 className="text-xl font-bold text-foreground">{stats.todos}</h3>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Tugas</p>
        </div>
        <div className="bg-card border border-border/60 rounded-2xl p-4 flex flex-col items-center text-center shadow-sm hover:border-purple-500/30 transition-colors">
          <LockKeyhole className="w-5 h-5 text-purple-500 mb-2" />
          <h3 className="text-xl font-bold text-foreground">{stats.vault}</h3>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mt-1">Brankas</p>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Pengaturan Keamanan
        </h3>
        
        {/* 3. Pengaturan Brankas Rahasia (PIN) */}
        <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-base">Brankas Catatan</h2>
                <p className="text-xs text-muted-foreground">PIN 4 angka akses rahasia</p>
              </div>
            </div>
            
            {!isEditingPin && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditingPin(true)}
                className="text-primary hover:text-primary hover:bg-primary/10 rounded-full px-4"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          
          <div className="pt-2">
            {isEditingPin ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="Masukkan 4 Angka (Contoh: 1234)"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-muted pl-12 pr-4 py-3.5 text-center tracking-[1em] text-xl font-bold rounded-2xl outline-none focus:ring-2 focus:ring-purple-500/50 transition-all border border-transparent focus:border-purple-500/30"
                    autoFocus
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsEditingPin(false)} disabled={isSaving} className="flex-1 rounded-xl h-11">
                    <X className="w-4 h-4 mr-2" /> Batal
                  </Button>
                  <Button onClick={handleSavePin} disabled={isSaving || pinCode.length !== 4} className="flex-1 rounded-xl h-11 bg-purple-600 hover:bg-purple-700 text-white">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-2xl border border-border/50 flex items-center justify-center">
                <p className="text-2xl tracking-[0.5em] font-bold text-foreground/80">
                  {pinCode ? "••••" : (
                    <span className="text-sm font-normal tracking-normal text-muted-foreground italic">
                      Keamanan Belum Diatur
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Pengaturan Integrasi
        </h3>

        {/* 4. Pengaturan Notifikasi WA */}
        <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden transition-all hover:shadow-md">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-500/10 rounded-xl text-green-600">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-base">Notifikasi WhatsApp</h2>
                <p className="text-xs text-muted-foreground">Pengingat tugas dari Nexa</p>
              </div>
            </div>
            
            {!isEditingWA && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditingWA(true)}
                className="text-primary hover:text-primary hover:bg-primary/10 rounded-full px-4"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          
          <div className="pt-2">
            {isEditingWA ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="relative flex items-center">
                  <Phone className="absolute left-4 w-5 h-5 text-muted-foreground" />
                  <span className="absolute left-11 text-muted-foreground text-sm font-bold">+62</span>
                  <input
                    type="tel"
                    placeholder="81234567890"
                    value={whatsapp.replace(/^62|^0/, '')}
                    onChange={(e) => setWhatsapp("62" + e.target.value.replace(/^0/, ''))}
                    className="w-full bg-muted pl-[76px] pr-4 py-3.5 text-base font-medium rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground px-1">
                  *Gunakan format tanpa angka 0 di depan (Contoh: 812...).
                </p>
                
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" onClick={() => setIsEditingWA(false)} disabled={isSaving} className="flex-1 rounded-xl h-11">
                    <X className="w-4 h-4 mr-2" /> Batal
                  </Button>
                  <Button onClick={handleSaveWA} disabled={isSaving} className="flex-1 rounded-xl h-11">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <p className="text-base font-semibold text-foreground/80">
                    {whatsapp ? (
                      <span className="tracking-widest">+{whatsapp}</span>
                    ) : (
                      <span className="font-normal text-muted-foreground italic text-sm">Belum dihubungkan</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}