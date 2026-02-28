"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserProfile, updateUserProfile } from "@/lib/user-service";
import { getUserNotes } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { 
  Save, Loader2, Phone, BellRing, 
  Pencil, X, Lock, ShieldCheck, Sparkles, 
  FileText, CheckSquare, LockKeyhole, Mail, User as UserIcon, BrainCircuit,
  Bell, Smartphone, UserCircle, Palette, LogOut, Sun, Moon, Laptop, Type
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal"; 
import { useTheme } from "next-themes"; 
import { useSettings } from "@/hooks/use-settings"; 

type TabMode = 'account' | 'security' | 'appearance' | 'notifications';

export default function ProfilePage() {
  const { user, loading: authLoading, loginWithGoogle, loginWithEmail, registerWithEmail, logout } = useAuth();
  const router = useRouter();
  const { showAlert, showConfirm } = useModal(); 
  const { theme, setTheme } = useTheme();
  
  // Panggil Setting Warna dan Font
  const { colorAccent, setColorAccent, fontStyle, setFontStyle } = useSettings();
  
  // --- States untuk Mode Profil (User Permanen) ---
  const [activeTab, setActiveTab] = useState<TabMode>('account'); 
  const [whatsapp, setWhatsapp] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [vibrationEnabled, setVibrationEnabled] = useState(true); 
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "default">("default");

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingWA, setIsEditingWA] = useState(false);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [stats, setStats] = useState({ notes: 0, todos: 0, vault: 0 });

  // --- States untuk Mode Form (Pengguna Tamu) ---
  const [isRegisterMode, setIsRegisterMode] = useState(true); 
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [authActionLoading, setAuthActionLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    const fetchProfileAndStats = async () => {
      if (!user || user.isAnonymous) {
        setIsLoading(false);
        return;
      }
      try {
        const [profile, notesData] = await Promise.all([
          getUserProfile(user.uid),
          getUserNotes(user.uid)
        ]);
        
        if (profile?.whatsappNumber) setWhatsapp(profile.whatsappNumber);
        if (profile?.pinCode) setPinCode(profile.pinCode);
        if (profile?.vibrationEnabled !== undefined) setVibrationEnabled(profile.vibrationEnabled);

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

  if (authLoading || (isLoading && user && !user.isAnonymous)) {
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

  // ==========================================
  // TAMPILAN 1: PENGGUNA TAMU (FORM DAFTAR/LOGIN)
  // ==========================================
  if (user.isAnonymous) {
    const handleAuthSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formEmail || !formPassword) {
        showAlert("Perhatian", "Email dan Password wajib diisi!");
        return;
      }
      if (isRegisterMode && !formName) {
        showAlert("Perhatian", "Nama wajib diisi untuk mendaftar!");
        return;
      }
      if (formPassword.length < 6) {
        showAlert("Perhatian", "Password minimal 6 karakter!");
        return;
      }
  
      setAuthActionLoading(true);
      try {
        if (isRegisterMode) {
          await registerWithEmail(formName, formEmail, formPassword);
        } else {
          await loginWithEmail(formEmail, formPassword);
        }
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') showAlert("Gagal", "Email ini sudah terdaftar!");
        else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') showAlert("Gagal", "Email atau Password salah!");
        else showAlert("Error", "Terjadi kesalahan: " + error.message);
      } finally {
        setAuthActionLoading(false);
      }
    };

    const handleGoogleLogin = async () => {
      setAuthActionLoading(true);
      try {
        await loginWithGoogle();
      } catch (error) {
        showAlert("Gagal", "Gagal login dengan Google.");
      } finally {
        setAuthActionLoading(false);
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 pb-12 pt-6 relative">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <div className="text-center mb-8 animate-in slide-in-from-top-4 duration-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 ring-4 ring-background">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight mb-2">Simpan Permanen</h1>
          <p className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed">
            Amankan semua catatan dan tugasmu di *cloud* agar tidak hilang.
          </p>
        </div>

        <div className="w-full max-w-sm bg-card/80 backdrop-blur-md border border-border rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-500">
          <h2 className="text-xl font-bold mb-6 text-center">
            {isRegisterMode ? "Buat Akun Baru" : "Masuk ke Akunmu"}
          </h2>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="relative group">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  placeholder="Nama Panggilan" 
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-muted/50 rounded-2xl text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
                />
              </div>
            )}
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="email" 
                placeholder="Email aktif" 
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-muted/50 rounded-2xl text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="password" 
                placeholder="Password (min. 6 karakter)" 
                value={formPassword}
                onChange={e => setFormPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-muted/50 rounded-2xl text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
              />
            </div>

            <Button type="submit" disabled={authActionLoading} className="w-full rounded-2xl py-6 mt-2 text-base font-bold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-lg shadow-primary/20 border-0 transition-transform active:scale-95">
              {authActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegisterMode ? "Daftar Sekarang" : "Masuk")}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/80"></div>
            <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Atau</span>
            <div className="h-px flex-1 bg-border/80"></div>
          </div>

          <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={authActionLoading} className="w-full rounded-2xl py-6 bg-card border-border hover:bg-muted mb-2 font-semibold">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Lanjutkan dengan Google
          </Button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isRegisterMode ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <button 
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="font-bold text-primary hover:underline outline-none transition-colors"
            >
              {isRegisterMode ? "Masuk di sini" : "Daftar gratis"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN 2: PENGGUNA PERMANEN (PENGATURAN PROFIL DENGAN TABS)
  // ==========================================
  const handleSaveWA = async () => {
    setIsSaving(true);
    try {
      const cleanNumber = whatsapp.replace(/[^0-9]/g, '');
      await updateUserProfile(user.uid, { whatsappNumber: cleanNumber });
      setIsEditingWA(false);
    } catch (error) {
      console.error(error);
      showAlert("Gagal", "Gagal menyimpan profil WhatsApp.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePin = async () => {
    if (pinCode.length !== 4) {
      showAlert("Perhatian", "PIN harus tepat 4 angka!");
      return;
    }
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { pinCode });
      setIsEditingPin(false);
    } catch (error) {
      console.error(error);
      showAlert("Gagal", "Gagal menyimpan PIN.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestPush = async () => {
    if (!('Notification' in window)) {
      showAlert("Tidak Didukung", "Browser atau perangkat kamu tidak mendukung notifikasi sistem.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        showAlert("Berhasil", "Notifikasi telah diaktifkan! Kamu akan menerima pengingat harian.");
      } else {
        showAlert("Izin Ditolak", "Kamu menolak izin notifikasi. Kamu bisa mengubahnya nanti di pengaturan browser.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleVibration = async () => {
    const newValue = !vibrationEnabled;
    setVibrationEnabled(newValue); 
    try {
      await updateUserProfile(user.uid, { vibrationEnabled: newValue });
    } catch (error) {
      setVibrationEnabled(!newValue); 
      showAlert("Gagal", "Terjadi kesalahan saat menyimpan pengaturan getaran.");
    }
  };

  const handleLogout = () => {
    showConfirm("Keluar Akun?", "Apakah kamu yakin ingin keluar dari sesi Nexa saat ini?", async () => {
      await logout();
      router.push("/");
    });
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500 max-w-lg mx-auto">
      
      {/* 1. Header & Hero Profile (Selalu Tampil) */}
      <div className="relative mt-6 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-3xl rounded-full pointer-events-none" />
        
        <div className="relative flex flex-col items-center text-center space-y-4 pt-4">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-background shadow-2xl ring-4 ring-primary/10 ring-offset-2 ring-offset-background transition-all duration-300 group-hover:ring-primary/30">
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Badge Premium */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-full border-2 border-background flex items-center gap-1.5 shadow-lg whitespace-nowrap z-10">
              <Sparkles className="w-3 h-3 fill-white" /> Nexa Member
            </div>
          </div>
          
          <div className="pt-3">
            <h1 className="text-2xl font-extrabold tracking-tight">{user.displayName}</h1>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">{user.email}</p>
          </div>
        </div>
      </div>

      {/* 2. Sistem Tabs Navigasi */}
      <div className="flex p-1 bg-muted rounded-xl w-full overflow-x-auto hide-scrollbar snap-x">
        <button 
          onClick={() => setActiveTab('account')} 
          className={`snap-start flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'account' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <UserCircle className="w-4 h-4" /> Akun
        </button>
        <button 
          onClick={() => setActiveTab('appearance')} 
          className={`snap-start flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'appearance' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Palette className="w-4 h-4" /> Tampilan
        </button>
        <button 
          onClick={() => setActiveTab('security')} 
          className={`snap-start flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'security' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <ShieldCheck className="w-4 h-4" /> Keamanan
        </button>
        <button 
          onClick={() => setActiveTab('notifications')} 
          className={`snap-start flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === 'notifications' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <BellRing className="w-4 h-4" /> Notif
        </button>
      </div>

      {/* 3. Area Konten Berdasarkan Tab */}
      <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* --- TAB: AKUN --- */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-card border border-border/60 rounded-3xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group">
                <div className="p-2.5 bg-blue-500/10 rounded-2xl mb-2 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-blue-500" />
                </div>
                <h3 className="text-xl font-black text-foreground">{stats.notes}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Catatan</p>
              </div>
              <div className="bg-card border border-border/60 rounded-3xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all duration-300 group">
                <div className="p-2.5 bg-orange-500/10 rounded-2xl mb-2 group-hover:scale-110 transition-transform">
                  <CheckSquare className="w-5 h-5 text-orange-500" />
                </div>
                <h3 className="text-xl font-black text-foreground">{stats.todos}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Tugas</p>
              </div>
              <div className="bg-card border border-border/60 rounded-3xl p-4 flex flex-col items-center text-center shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all duration-300 group">
                <div className="p-2.5 bg-purple-500/10 rounded-2xl mb-2 group-hover:scale-110 transition-transform">
                  <LockKeyhole className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="text-xl font-black text-foreground">{stats.vault}</h3>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Brankas</p>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={handleLogout} variant="outline" className="w-full h-12 rounded-2xl border-destructive/30 text-destructive hover:bg-destructive hover:text-white transition-colors font-bold shadow-sm">
                <LogOut className="w-4 h-4 mr-2" /> Keluar dari Akun Nexa
              </Button>
            </div>
          </div>
        )}

        {/* --- TAB: TAMPILAN --- */}
        {activeTab === 'appearance' && (
          <div className="space-y-6">
            
            {/* TEMA APLIKASI */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 ml-1 mb-3">
                Mode Cahaya
              </h3>
              <div className="bg-card border border-border/60 rounded-[2rem] p-5 shadow-sm space-y-2 hover:shadow-md transition-all">
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setTheme('light')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/30 hover:bg-muted'}`}>
                    <Sun className={`w-6 h-6 mb-2 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-bold ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`}>Terang</span>
                  </button>
                  <button onClick={() => setTheme('dark')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/30 hover:bg-muted'}`}>
                    <Moon className={`w-6 h-6 mb-2 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-bold ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`}>Gelap</span>
                  </button>
                  <button onClick={() => setTheme('system')} className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${theme === 'system' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/30 hover:bg-muted'}`}>
                    <Laptop className={`w-6 h-6 mb-2 ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`text-xs font-bold ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`}>Sistem</span>
                  </button>
                </div>
                <p className="text-xs text-center text-muted-foreground font-medium pt-2">
                  Pilih mode yang paling nyaman untuk matamu.
                </p>
              </div>
            </div>

            {/* AKSEN WARNA */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 ml-1 mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4" /> Aksen Warna
              </h3>
              <div className="bg-card border border-border/60 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all">
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={() => setColorAccent('default')} className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all bg-indigo-500 ${colorAccent === 'default' ? 'border-foreground ring-2 ring-indigo-500/50 scale-110' : 'border-transparent opacity-80 hover:opacity-100'}`} />
                  <button onClick={() => setColorAccent('blue')} className={`w-10 h-10 rounded-full bg-blue-500 border-2 flex items-center justify-center transition-all ${colorAccent === 'blue' ? 'border-foreground ring-2 ring-blue-500/50 scale-110' : 'border-transparent opacity-80 hover:opacity-100'}`} />
                  <button onClick={() => setColorAccent('emerald')} className={`w-10 h-10 rounded-full bg-emerald-500 border-2 flex items-center justify-center transition-all ${colorAccent === 'emerald' ? 'border-foreground ring-2 ring-emerald-500/50 scale-110' : 'border-transparent opacity-80 hover:opacity-100'}`} />
                  <button onClick={() => setColorAccent('amber')} className={`w-10 h-10 rounded-full bg-amber-500 border-2 flex items-center justify-center transition-all ${colorAccent === 'amber' ? 'border-foreground ring-2 ring-amber-500/50 scale-110' : 'border-transparent opacity-80 hover:opacity-100'}`} />
                  <button onClick={() => setColorAccent('orange')} className={`w-10 h-10 rounded-full bg-orange-500 border-2 flex items-center justify-center transition-all ${colorAccent === 'orange' ? 'border-foreground ring-2 ring-orange-500/50 scale-110' : 'border-transparent opacity-80 hover:opacity-100'}`} />
                  <button onClick={() => setColorAccent('rose')} className={`w-10 h-10 rounded-full bg-rose-500 border-2 flex items-center justify-center transition-all ${colorAccent === 'rose' ? 'border-foreground ring-2 ring-rose-500/50 scale-110' : 'border-transparent opacity-80 hover:opacity-100'}`} />
                  <button onClick={() => setColorAccent('violet')} className={`w-10 h-10 rounded-full bg-violet-500 border-2 flex items-center justify-center transition-all ${colorAccent === 'violet' ? 'border-foreground ring-2 ring-violet-500/50 scale-110' : 'border-transparent opacity-80 hover:opacity-100'}`} />
                </div>
              </div>
            </div>

            {/* GAYA HURUF */}
            <div>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 ml-1 mb-3 flex items-center gap-2">
                <Type className="w-4 h-4" /> Gaya Huruf (Font)
              </h3>
              <div className="bg-card border border-border/60 rounded-[2rem] p-5 shadow-sm hover:shadow-md transition-all">
                <div className="grid grid-cols-3 gap-3">
                  <button onClick={() => setFontStyle('sans')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${fontStyle === 'sans' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'}`}>
                    <span className="font-sans font-bold text-2xl">Aa</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Modern</span>
                  </button>
                  <button onClick={() => setFontStyle('serif')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${fontStyle === 'serif' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'}`}>
                    <span className="font-serif font-bold text-2xl">Aa</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Klasik</span>
                  </button>
                  <button onClick={() => setFontStyle('mono')} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${fontStyle === 'mono' ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'}`}>
                    <span className="font-mono font-bold text-2xl">Aa</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Fokus</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* --- TAB: KEAMANAN --- */}
        {activeTab === 'security' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 ml-1">
              Pengaturan Keamanan
            </h3>
            <div className="bg-card border border-border/60 rounded-[2rem] p-5 shadow-sm space-y-5 transition-all hover:shadow-md">
              <div className="flex items-center justify-between border-b border-border/50 pb-5">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-600 shadow-inner">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-bold text-base">Brankas Catatan</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">PIN 4 angka akses rahasia</p>
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
                      <Button onClick={handleSavePin} disabled={isSaving || pinCode.length !== 4} className="flex-1 rounded-xl h-11 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md">
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
        )}

        {/* --- TAB: NOTIFIKASI & INTEGRASI --- */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            
            {/* 1. Pengaturan Push & Getaran */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 ml-1">
                Notifikasi Aplikasi
              </h3>
              <div className="bg-card border border-border/60 rounded-[2rem] p-5 shadow-sm space-y-5 transition-all hover:shadow-md">
                <div className="flex items-center justify-between border-b border-border/50 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-600 shadow-inner">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base">Notifikasi Sistem</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Muncul di layar HP/Desktop</p>
                    </div>
                  </div>
                  {pushPermission === 'granted' ? (
                    <span className="text-xs font-extrabold text-green-600 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">Aktif</span>
                  ) : (
                    <Button size="sm" onClick={handleRequestPush} className="rounded-full text-xs h-8 px-4 font-bold shadow-md">Aktifkan</Button>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-600 shadow-inner">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base">Getaran Perangkat</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Bergetar saat notifikasi masuk</p>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleVibration}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${vibrationEnabled ? 'bg-primary shadow-inner' : 'bg-muted-foreground/30'}`}
                  >
                    <span className="sr-only">Toggle getaran</span>
                    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-background shadow-md ring-0 transition duration-300 ease-in-out ${vibrationEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Pengaturan WhatsApp */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 ml-1">
                Integrasi Eksternal
              </h3>
              <div className="bg-card border border-border/60 rounded-[2rem] p-5 shadow-sm space-y-5 transition-all hover:shadow-md">
                <div className="flex items-center justify-between border-b border-border/50 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-500/10 rounded-2xl text-green-600 shadow-inner">
                      <BellRing className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="font-bold text-base">Notifikasi WhatsApp</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">Pengingat tugas dari Nexa</p>
                    </div>
                  </div>
                  {!isEditingWA && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingWA(true)} className="text-primary hover:text-primary hover:bg-primary/10 rounded-full px-4 font-bold">
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </Button>
                  )}
                </div>
                
                <div>
                  {isEditingWA ? (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 bg-muted/30 p-4 rounded-2xl border border-border/50">
                      <div className="relative flex items-center group">
                        <Phone className="absolute left-4 w-5 h-5 text-muted-foreground group-focus-within:text-green-500 transition-colors" />
                        <span className="absolute left-11 text-muted-foreground text-sm font-extrabold">+62</span>
                        <input
                          type="tel"
                          placeholder="81234567890"
                          value={whatsapp.replace(/^62|^0/, '')}
                          onChange={(e) => setWhatsapp("62" + e.target.value.replace(/^0/, ''))}
                          className="w-full bg-background pl-[76px] pr-4 py-3.5 text-base font-bold rounded-xl outline-none focus:ring-2 focus:ring-green-500/50 transition-all border border-border focus:border-green-500/30 shadow-inner"
                        />
                      </div>
                      <p className="text-[11px] text-muted-foreground px-1 font-medium">
                        *Gunakan format tanpa angka 0 di depan (Contoh: 812...).
                      </p>
                      <div className="flex gap-2 pt-1">
                        <Button variant="outline" onClick={() => setIsEditingWA(false)} disabled={isSaving} className="flex-1 rounded-xl h-11 font-bold">Batal</Button>
                        <Button onClick={handleSaveWA} disabled={isSaving} className="flex-1 rounded-xl h-11 bg-green-600 hover:bg-green-700 text-white font-bold shadow-md">
                          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-background rounded-full shadow-sm border border-border">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <p className="text-base font-extrabold text-foreground/80">
                          {whatsapp ? <span className="tracking-widest">+{whatsapp}</span> : <span className="font-medium text-muted-foreground/80 italic text-sm">Belum dihubungkan</span>}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}