"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserProfile, updateUserProfile } from "@/lib/user-service";
import { getUserNotes } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Sparkles, Mail, User as UserIcon, BrainCircuit, Lock,
  UserCircle, Palette, ShieldCheck, BellRing, Archive
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal"; 
import { useTheme } from "next-themes"; 
import { useSettings, ColorAccent, FontStyle } from "@/hooks/use-settings"; 

// --- Impor Komponen Tab ---
import { AccountTab } from "@/components/profile/account-tab";
import { ArchiveTab } from "@/components/profile/archive-tab";
import { AppearanceTab } from "@/components/profile/appearance-tab";
import { SecurityTab } from "@/components/profile/security-tab";
import { NotificationsTab } from "@/components/profile/notifications-tab";

type TabMode = 'account' | 'archive' | 'appearance' | 'security' | 'notifications';

export default function ProfilePage() {
  const { user, loading: authLoading, loginWithGoogle, loginWithEmail, registerWithEmail, logout } = useAuth();
  const router = useRouter();
  const { showAlert, showConfirm } = useModal(); 
  const { theme, setTheme } = useTheme();
  const { colorAccent, setColorAccent, fontStyle, setFontStyle } = useSettings();
  
  // --- States untuk Mode Profil ---
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
  const [archivedReviews, setArchivedReviews] = useState<any[]>([]); 
  const [activityDates, setActivityDates] = useState<Date[]>([]); // State untuk Heatmap

  // --- States untuk Mode Form Login/Daftar ---
  const [isRegisterMode, setIsRegisterMode] = useState(true); 
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [authActionLoading, setAuthActionLoading] = useState(false);

  useEffect(() => {
    if ('Notification' in window) setPushPermission(Notification.permission);

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

        const archives = notesData.filter((n: any) => n.tags?.includes("Weekly Review"));
        setArchivedReviews(archives);

        setStats({
          notes: notesData.filter((n: any) => !n.isTodo && !n.isHidden && !n.tags?.includes("Weekly Review")).length,
          todos: notesData.filter((n: any) => n.isTodo && !n.isCompleted).length,
          vault: notesData.filter((n: any) => n.isHidden).length,
        });

        // Ekstrak tanggal untuk Heatmap (createdAt dan updatedAt jika ada & isCompleted == true untuk todo)
        const dates: Date[] = [];
        notesData.forEach((note: any) => {
          if (note.createdAt) {
             // Konversi timestamp Firestore ke Date object
             dates.push(note.createdAt.toDate ? note.createdAt.toDate() : new Date(note.createdAt));
          }
          if (note.isTodo && note.isCompleted && note.updatedAt) {
             dates.push(note.updatedAt.toDate ? note.updatedAt.toDate() : new Date(note.updatedAt));
          }
        });
        setActivityDates(dates);

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
      if (!formEmail || !formPassword) return showAlert("Perhatian", "Email dan Password wajib diisi!");
      if (isRegisterMode && !formName) return showAlert("Perhatian", "Nama wajib diisi untuk mendaftar!");
      if (formPassword.length < 6) return showAlert("Perhatian", "Password minimal 6 karakter!");
  
      setAuthActionLoading(true);
      try {
        if (isRegisterMode) await registerWithEmail(formName, formEmail, formPassword);
        else await loginWithEmail(formEmail, formPassword);
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
      try { await loginWithGoogle(); } 
      catch (error) { showAlert("Gagal", "Gagal login dengan Google."); } 
      finally { setAuthActionLoading(false); }
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
          <h2 className="text-xl font-bold mb-6 text-center">{isRegisterMode ? "Buat Akun Baru" : "Masuk ke Akunmu"}</h2>
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="relative group">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input type="text" placeholder="Nama Panggilan" value={formName} onChange={e => setFormName(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-muted/50 rounded-2xl text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30" />
              </div>
            )}
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input type="email" placeholder="Email aktif" value={formEmail} onChange={e => setFormEmail(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-muted/50 rounded-2xl text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30" />
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input type="password" placeholder="Password (min. 6 karakter)" value={formPassword} onChange={e => setFormPassword(e.target.value)} className="w-full pl-11 pr-4 py-3.5 bg-muted/50 rounded-2xl text-sm outline-none focus:bg-background focus:ring-2 focus:ring-primary/50 transition-all border border-transparent focus:border-primary/30" />
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
            Lanjutkan dengan Google
          </Button>

          <p className="mt-5 text-center text-sm text-muted-foreground">
            {isRegisterMode ? "Sudah punya akun?" : "Belum punya akun?"}{" "}
            <button onClick={() => setIsRegisterMode(!isRegisterMode)} className="font-bold text-primary hover:underline outline-none transition-colors">
              {isRegisterMode ? "Masuk di sini" : "Daftar gratis"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // TAMPILAN 2: PENGGUNA PERMANEN
  // ==========================================
  const handleSaveWA = async () => {
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { whatsappNumber: whatsapp.replace(/[^0-9]/g, '') });
      setIsEditingWA(false);
    } catch (error) { showAlert("Gagal", "Gagal menyimpan profil WhatsApp."); } 
    finally { setIsSaving(false); }
  };

  const handleSavePin = async () => {
    if (pinCode.length !== 4) return showAlert("Perhatian", "PIN harus tepat 4 angka!");
    setIsSaving(true);
    try {
      await updateUserProfile(user.uid, { pinCode });
      setIsEditingPin(false);
    } catch (error) { showAlert("Gagal", "Gagal menyimpan PIN."); } 
    finally { setIsSaving(false); }
  };

  const handleRequestPush = async () => {
    if (!('Notification' in window)) return showAlert("Tidak Didukung", "Browser/perangkat tidak mendukung notifikasi.");
    const perm = await Notification.requestPermission();
    setPushPermission(perm);
    if (perm === 'granted') showAlert("Berhasil", "Notifikasi telah diaktifkan!");
  };

  const handleToggleVibration = async () => {
    const newValue = !vibrationEnabled;
    setVibrationEnabled(newValue); 
    try { await updateUserProfile(user.uid, { vibrationEnabled: newValue }); } 
    catch (error) { setVibrationEnabled(!newValue); }
  };

  const handleLogout = () => {
    showConfirm("Keluar Akun?", "Yakin ingin keluar dari Nexa?", async () => {
      await logout(); router.push("/");
    });
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500 max-w-lg mx-auto">
      
      {/* 1. Header Profile */}
      <div className="relative mt-6 mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-3xl rounded-full pointer-events-none" />
        <div className="relative flex flex-col items-center text-center space-y-4 pt-4">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-background shadow-2xl ring-4 ring-primary/10 transition-all duration-300 group-hover:ring-primary/30">
              <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} alt="Profile" className="w-full h-full object-cover" />
            </div>
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
      <div className="flex p-1 bg-muted rounded-xl w-full overflow-x-auto scrollbar-hide snap-x">
        {[
          { id: 'account', icon: UserCircle, label: 'Akun' },
          { id: 'archive', icon: Archive, label: 'Arsip' },
          { id: 'appearance', icon: Palette, label: 'Tampilan' },
          { id: 'security', icon: ShieldCheck, label: 'Keamanan' },
          { id: 'notifications', icon: BellRing, label: 'Notif' }
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabMode)} 
            className={`snap-start flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold rounded-lg transition-all ${activeTab === tab.id ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Area Konten Render Berdasarkan Tab */}
      <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'account' && <AccountTab stats={stats} onLogout={handleLogout} activityDates={activityDates} />}
        {activeTab === 'archive' && <ArchiveTab archivedReviews={archivedReviews} />}
        {activeTab === 'appearance' && (
          <AppearanceTab 
            theme={theme} 
            setTheme={setTheme} 
            colorAccent={colorAccent} 
            setColorAccent={(c) => setColorAccent(c as ColorAccent)} 
            fontStyle={fontStyle} 
            setFontStyle={(f) => setFontStyle(f as FontStyle)} 
          />
        )}
        {activeTab === 'security' && <SecurityTab pinCode={pinCode} setPinCode={setPinCode} isEditingPin={isEditingPin} setIsEditingPin={setIsEditingPin} isSaving={isSaving} onSavePin={handleSavePin} />}
        {activeTab === 'notifications' && <NotificationsTab pushPermission={pushPermission} onRequestPush={handleRequestPush} vibrationEnabled={vibrationEnabled} onToggleVibration={handleToggleVibration} whatsapp={whatsapp} setWhatsapp={setWhatsapp} isEditingWA={isEditingWA} setIsEditingWA={setIsEditingWA} isSaving={isSaving} onSaveWA={handleSaveWA} />}
      </div>

    </div>
  );
}