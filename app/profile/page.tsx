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
  AlertCircle, Bell, Smartphone
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading: authLoading, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const router = useRouter();
  
  // --- States untuk Mode Profil (User Permanen) ---
  const [whatsapp, setWhatsapp] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [vibrationEnabled, setVibrationEnabled] = useState(true); // Default getar aktif
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "default">("default");

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingWA, setIsEditingWA] = useState(false);
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [stats, setStats] = useState({ notes: 0, todos: 0, vault: 0 });

  // --- States untuk Mode Form (Pengguna Tamu) ---
  const [isRegisterMode, setIsRegisterMode] = useState(true); // Default daftar
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [authActionLoading, setAuthActionLoading] = useState(false);

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

  const showAlert = (title: string, message: string) => {
    setDialog({ isOpen: true, title, message, type: "alert" });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({ isOpen: true, title, message, type: "confirm", onConfirm });
  };
  // ---------------------------------

  useEffect(() => {
    // Cek status izin notifikasi perangkat saat ini
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    const fetchProfileAndStats = async () => {
      // Jika belum login, atau jika masih tamu, abaikan fetch data sensitif
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

  // Jika tidak ada user sama sekali, kembalikan ke home untuk dibuatkan sesi tamu
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
        // Jika sukses, komponen akan render ulang dan menampilkan Profil Permanen
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
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 pb-12 pt-6">
        
        {/* Logo & Headline */}
        <div className="text-center mb-8 animate-in slide-in-from-top-4 duration-700">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <BrainCircuit className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Simpan Secara Permanen</h1>
          <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
            Kamu sedang dalam Mode Tamu. Daftar sekarang agar catatanmu tidak hilang!
          </p>
        </div>

        {/* Card Form Authentication */}
        <div className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 shadow-xl animate-in zoom-in-95 duration-500">
          <h2 className="text-xl font-bold mb-6 text-center">
            {isRegisterMode ? "Buat Akun Baru" : "Masuk ke Akunmu"}
          </h2>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Nama Panggilan" 
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="email" 
                placeholder="Email aktif" 
                value={formEmail}
                onChange={e => setFormEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="password" 
                placeholder="Password (min. 6 karakter)" 
                value={formPassword}
                onChange={e => setFormPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-muted rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30"
              />
            </div>

            <Button type="submit" disabled={authActionLoading} className="w-full rounded-xl py-6 text-base font-bold bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 shadow-md border-0">
              {authActionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isRegisterMode ? "Daftar Sekarang" : "Masuk")}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border/60"></div>
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Atau</span>
            <div className="h-px flex-1 bg-border/60"></div>
          </div>

          <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={authActionLoading} className="w-full rounded-xl py-6 bg-card border-border hover:bg-muted mb-3">
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Lanjutkan dengan Google
          </Button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            {isRegisterMode ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <button 
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="font-bold text-primary hover:underline outline-none"
            >
              {isRegisterMode ? "Masuk di sini" : "Daftar gratis"}
            </button>
          </p>
        </div>

        {/* CUSTOM DIALOG MODAL UNTUK GUEST */}
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
                  <Button variant="outline" className="flex-1 rounded-xl h-11 border-border bg-transparent" onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}>
                    Batal
                  </Button>
                )}
                <Button 
                  className={`flex-1 rounded-xl h-11 text-white shadow-md ${dialog.type === 'confirm' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`} 
                  onClick={() => {
                    if (dialog.type === "confirm" && dialog.onConfirm) dialog.onConfirm();
                    setDialog(prev => ({ ...prev, isOpen: false }));
                  }}
                >
                  {dialog.type === "confirm" ? "Ya, Lanjutkan" : "Oke, Mengerti"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // TAMPILAN 2: PENGGUNA PERMANEN (PENGATURAN PROFIL)
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

  // Handler Aktivasi Notifikasi Push
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

  // Handler Toggle Getaran
  const handleToggleVibration = async () => {
    const newValue = !vibrationEnabled;
    setVibrationEnabled(newValue); // Optimistic Update agar UI langsung berubah
    try {
      await updateUserProfile(user.uid, { vibrationEnabled: newValue });
    } catch (error) {
      setVibrationEnabled(!newValue); // Rollback jika gagal
      showAlert("Gagal", "Terjadi kesalahan saat menyimpan pengaturan getaran.");
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500 max-w-lg mx-auto">
      
      {/* 1. Header & Hero Profile */}
      <div className="relative mt-6 mb-8">
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

      {/* 3. PENGATURAN NOTIFIKASI */}
      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Pengaturan Notifikasi
        </h3>
        <div className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm space-y-4 relative overflow-hidden transition-all hover:shadow-md">
          
          {/* Izin Push Notifikasi */}
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-base">Notifikasi Sistem</h2>
                <p className="text-xs text-muted-foreground">Muncul di layar HP/Desktop</p>
              </div>
            </div>
            {pushPermission === 'granted' ? (
              <span className="text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">Aktif</span>
            ) : (
              <Button size="sm" onClick={handleRequestPush} className="rounded-full text-xs h-8 shadow-sm">Aktifkan</Button>
            )}
          </div>

          {/* Pengaturan Getaran */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-500/10 rounded-xl text-orange-600">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-base">Getaran Perangkat</h2>
                <p className="text-xs text-muted-foreground">Bergetar saat notifikasi masuk</p>
              </div>
            </div>
            
            {/* Custom Toggle Switch */}
            <button
              onClick={handleToggleVibration}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${vibrationEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span className="sr-only">Toggle getaran</span>
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow ring-0 transition duration-200 ease-in-out ${vibrationEnabled ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

        </div>
      </div>

      <div className="space-y-4 pt-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider px-1">
          Pengaturan Keamanan
        </h3>
        
        {/* 4. Pengaturan Brankas Rahasia (PIN) */}
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
                <Pencil className="w-4 h-4 mr-2" /> Edit
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
                    placeholder="Masukkan 4 Angka"
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

        {/* 5. Pengaturan Notifikasi WA */}
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
                <Pencil className="w-4 h-4 mr-2" /> Edit
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

      {/* CUSTOM DIALOG MODAL UNTUK PENGGUNA PERMANEN */}
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
                <Button variant="outline" className="flex-1 rounded-xl h-11 border-border bg-transparent" onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}>
                  Batal
                </Button>
              )}
              <Button 
                className={`flex-1 rounded-xl h-11 text-white shadow-md ${dialog.type === 'confirm' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`} 
                onClick={() => {
                  if (dialog.type === "confirm" && dialog.onConfirm) dialog.onConfirm();
                  setDialog(prev => ({ ...prev, isOpen: false }));
                }}
              >
                {dialog.type === "confirm" ? "Ya, Lanjutkan" : "Oke, Mengerti"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}