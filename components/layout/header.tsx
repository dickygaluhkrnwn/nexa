"use client";

import { 
  Moon, Sun, Menu, X, Settings, Download, LogOut, LogIn,
  Heart, Info, MessageSquareQuote, 
  Bell, BellRing, CalendarClock, AlertTriangle, Check,
  Search, User, SlidersHorizontal
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState, useEffect, Suspense } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getUserNotes } from "@/lib/notes-service";
import { doc, getDoc, updateDoc, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useModal } from "@/hooks/use-modal";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "overdue" | "today";
  todoId: string;
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const { showAlert, showConfirm } = useModal(); 
  const [mounted, setMounted] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // --- STATE NOTIFIKASI ---
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readNotifs, setReadNotifs] = useState<string[]>([]); 
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "default">("default");

  // State untuk mendeteksi arah scroll
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // State untuk PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // --- HOOKS PENCARIAN GLOBAL ---
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState("");

  // Sinkronisasi nilai input dengan URL parameter
  useEffect(() => {
    const q = searchParams?.get("q") || "";
    setSearchValue(q);
  }, [searchParams]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchValue(val);
    
    // Update URL Parameters secara real-time
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (val) {
      params.set("q", val);
    } else {
      params.delete("q");
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    setMounted(true);
    
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    const storedReadNotifs = localStorage.getItem('nexa_read_notifs');
    if (storedReadNotifs) {
      setReadNotifs(JSON.parse(storedReadNotifs));
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!user) return;

    const syncReadNotifications = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.readNotifications && Array.isArray(data.readNotifications)) {
            setReadNotifs(prev => {
              const combined = Array.from(new Set([...prev, ...data.readNotifications]));
              localStorage.setItem('nexa_read_notifs', JSON.stringify(combined));
              return combined;
            });
          }
        }
      } catch (error) {
        console.error("Gagal sinkronisasi data notifikasi dari database", error);
      }
    };

    syncReadNotifications();
  }, [user]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) {
        setNotifications([]);
        return;
      }
      try {
        const notes = await getUserNotes(user.uid);
        const todos = notes.filter((n: any) => n.isTodo && !n.isCompleted && n.dueDate);
        
        const today = new Date();
        const offset = today.getTimezoneOffset() * 60000;
        const todayStr = (new Date(today.getTime() - offset)).toISOString().split('T')[0];

        const newNotifs: NotificationItem[] = [];

        todos.forEach((todo: any) => {
          const notifId = `notif-${todo.id}-${todayStr}`;

          if (todo.dueDate < todayStr) {
            newNotifs.push({
              id: notifId,
              title: "Tugas Terlewat!",
              message: `Tugas "${todo.title}" sudah melewati tenggat waktu.`,
              type: "overdue",
              todoId: todo.id
            });
          } else if (todo.dueDate === todayStr) {
            newNotifs.push({
              id: notifId,
              title: "Tenggat Hari Ini",
              message: `Jangan lupa selesaikan tugas "${todo.title}" hari ini.`,
              type: "today",
              todoId: todo.id
            });
          }
        });

        setNotifications(newNotifs);

        if (Notification.permission === 'granted' && newNotifs.length > 0) {
          const lastPushed = localStorage.getItem('nexa_last_push_date');
          if (lastPushed !== todayStr) {
            let useVibration = true;
            try {
              const userRef = doc(db, "users", user.uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists() && userSnap.data().vibrationEnabled !== undefined) {
                useVibration = userSnap.data().vibrationEnabled;
              }
            } catch (e) {
              console.error("Gagal membaca setting getaran");
            }

            triggerSystemNotification("Pengingat Nexa", `Kamu punya ${newNotifs.length} tugas penting yang menunggumu hari ini!`, useVibration);
            localStorage.setItem('nexa_last_push_date', todayStr);
          }
        }

      } catch (error) {
        console.error("Gagal memuat notifikasi", error);
      }
    };

    fetchNotifications();
  }, [user, isNotifOpen]);

  const handleNotifClick = async (notifId: string) => {
    setIsNotifOpen(false);
    
    if (!readNotifs.includes(notifId)) {
      const updatedReadNotifs = [...readNotifs, notifId];
      setReadNotifs(updatedReadNotifs);
      localStorage.setItem('nexa_read_notifs', JSON.stringify(updatedReadNotifs));

      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            readNotifications: arrayUnion(notifId)
          });
        } catch (error: any) {
          if (error.code === 'not-found') {
            try {
              const userRef = doc(db, "users", user.uid);
              await setDoc(userRef, { readNotifications: [notifId] }, { merge: true });
            } catch (err) {
              console.error("Gagal membuat profil user untuk notifikasi", err);
            }
          } else {
            console.error("Gagal menyimpan status baca ke database", error);
          }
        }
      }
    }
  };

  const unreadCount = notifications.filter(n => !readNotifs.includes(n.id)).length;

  const triggerSystemNotification = async (title: string, body: string, vibrate: boolean = true) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          await registration.showNotification(title, {
            body: body,
            icon: "/icon-192x192.png", 
            vibrate: vibrate ? [200, 100, 200, 100, 200] : [], 
            tag: "nexa-reminder",
            requireInteraction: true 
          } as any); 
        } else {
          new Notification(title, { body: body, vibrate: vibrate ? [200, 100, 200] : [] } as any); 
        }
      } catch (error) {
        new Notification(title, { body: body });
      }
    }
  };

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      showAlert("Tidak Didukung", "Browser atau perangkat kamu tidak mendukung notifikasi sistem.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);

      if (permission === 'granted') {
        let useVibration = true;
        if (user) {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().vibrationEnabled !== undefined) {
            useVibration = userSnap.data().vibrationEnabled;
          }
        }
        triggerSystemNotification("Nexa AI Terhubung!", "Notifikasi berhasil diaktifkan. Pengingatmu akan muncul di sini.", useVibration);
      } else {
        showAlert("Izin Ditolak", "Kamu menolak izin notifikasi. Kamu bisa mengubahnya nanti di pengaturan browser.");
      }
    } catch (error) {
      console.error("Error requesting permission", error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
        setIsMenuOpen(false); 
        setIsNotifOpen(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
    }
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    showConfirm("Keluar Akun?", "Apakah kamu yakin ingin keluar dari sesi Nexa saat ini?", async () => {
      await logout();
    });
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 transition-transform duration-300 print:hidden",
        isVisible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="flex items-center justify-between h-16 px-4 md:px-6 w-full max-w-6xl mx-auto gap-4 relative">
        
        {/* Mobile: Brand Logo | Desktop: Sembunyi karena ada di Sidebar */}
        <div className="flex items-center gap-2 md:hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            N
          </div>
          <span className="font-bold text-lg tracking-tight">Nexa</span>
        </div>

        {/* Desktop: Search Bar Global (Elegan, Lebar & Clean) */}
        <div className="hidden md:flex flex-1 items-center max-w-2xl mx-4 lg:mx-8">
          <div className="relative w-full group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Cari catatan, tugas, dll..." 
              value={searchValue}
              onChange={handleSearch}
              className="w-full h-10 pl-11 pr-12 rounded-full bg-muted/50 border border-transparent hover:bg-muted focus:bg-background focus:border-primary/30 focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm placeholder:text-muted-foreground/70 shadow-sm" 
            />
            <button 
              title="Filter Pencarian"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground focus:text-primary transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Tombol Notifikasi */}
          {user && (
            <button
              onClick={() => {
                setIsNotifOpen(!isNotifOpen);
                setIsMenuOpen(false);
              }}
              className="relative p-2 rounded-full hover:bg-muted transition-colors"
            >
              {unreadCount > 0 ? (
                <>
                  <BellRing className="h-5 w-5 text-orange-500 animate-pulse" />
                  <span className="absolute top-1 right-1.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex items-center justify-center rounded-full h-3 w-3 bg-red-500 border-2 border-background"></span>
                  </span>
                </>
              ) : (
                <Bell className="h-5 w-5 text-muted-foreground" />
              )}
            </button>
          )}

          {/* Mobile: Hamburger | Desktop: Profile Pill */}
          <button
            onClick={() => {
              setIsMenuOpen(!isMenuOpen);
              setIsNotifOpen(false);
            }}
            className={cn(
              "flex items-center transition-all duration-200",
              "p-2 rounded-full hover:bg-muted md:p-1 md:pr-4 md:border md:border-border/50 md:bg-muted/30 md:hover:bg-muted md:rounded-full md:gap-2"
            )}
          >
            {/* Tampilan Desktop */}
            <div className="hidden md:flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-sm">
              <User className="w-4 h-4" />
            </div>
            <span className="hidden md:block text-sm font-medium text-foreground truncate max-w-[120px]">
              {user?.isAnonymous ? "Tamu" : (user?.displayName || "Profil")}
            </span>

            {/* Tampilan Mobile */}
            <div className="md:hidden">
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </div>
          </button>
        </div>

        {/* PANEL NOTIFIKASI DROPDOWN */}
        {isNotifOpen && user && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)}></div>
            <div className="absolute top-16 right-4 md:right-6 mt-2 w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 z-50 overflow-hidden flex flex-col max-h-[80vh]">
              <div className="px-4 py-3 border-b border-border/50 bg-muted/20 flex items-center justify-between sticky top-0">
                <p className="font-bold text-sm">Notifikasi</p>
                {unreadCount > 0 && (
                  <div className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">
                    {unreadCount} Baru
                  </div>
                )}
              </div>

              <div className="overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
                    <Check className="w-8 h-8 mb-2 opacity-20" />
                    <p className="text-sm">Semua tugas aman terkendali!</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notif) => {
                      const isRead = readNotifs.includes(notif.id);
                      return (
                        <Link 
                          key={notif.id} 
                          href={`/edit-todo/${notif.todoId}`}
                          onClick={() => handleNotifClick(notif.id)}
                          className={`relative flex items-start gap-3 p-4 border-b border-border/50 transition-colors ${isRead ? 'bg-background opacity-70' : 'bg-muted/20 hover:bg-muted/50'}`}
                        >
                          {!isRead && (
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                          )}
                          <div className={`p-2 rounded-full shrink-0 ml-2 ${notif.type === 'overdue' ? 'bg-destructive/10 text-destructive' : 'bg-orange-500/10 text-orange-500'}`}>
                            {notif.type === 'overdue' ? <AlertTriangle className="w-4 h-4" /> : <CalendarClock className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className={`text-sm font-bold ${notif.type === 'overdue' ? 'text-destructive' : 'text-orange-500'}`}>{notif.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {pushPermission !== 'granted' && (
                <div className="p-3 bg-blue-500/5 border-t border-blue-500/10 mt-auto">
                  <p className="text-[10px] text-muted-foreground mb-2 text-center">Nyalakan notifikasi perangkat agar HP mu bergetar untuk jadwal penting.</p>
                  <Button onClick={handleRequestPushPermission} size="sm" className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    <BellRing className="w-3 h-3 mr-2" /> Aktifkan Notifikasi
                  </Button>
                </div>
              )}
            </div>
          </>
        )}

        {/* PANEL MENU DROPDOWN (PENGATURAN) */}
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
            <div className="absolute top-16 right-4 md:right-6 mt-2 w-56 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl py-2 animate-in fade-in slide-in-from-top-2 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border/50 mb-1 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-sm">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <p className="text-sm font-bold text-foreground truncate max-w-[120px]">{user?.isAnonymous ? "Pengguna Tamu" : (user?.displayName || "Pengguna Nexa")}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pengaturan</p>
                </div>
              </div>
              
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="w-full flex items-center px-4 py-3 text-sm hover:bg-muted transition-colors font-medium"
              >
                {mounted && theme === "dark" ? (
                  <><Sun className="h-4 w-4 mr-3 text-orange-400" /><span>Mode Terang</span></>
                ) : (
                  <><Moon className="h-4 w-4 mr-3 text-blue-500" /><span>Mode Gelap</span></>
                )}
              </button>

              <Link href="/about" onClick={() => setIsMenuOpen(false)}>
                <div className="w-full flex items-center px-4 py-3 text-sm hover:bg-muted transition-colors font-medium border-t border-border/30">
                  <Info className="h-4 w-4 mr-3 text-blue-500" /><span>Tentang Aplikasi</span>
                </div>
              </Link>

              <Link href="/feedback" onClick={() => setIsMenuOpen(false)}>
                <div className="w-full flex items-center px-4 py-3 text-sm hover:bg-muted transition-colors font-medium border-t border-border/30">
                  <MessageSquareQuote className="h-4 w-4 mr-3 text-green-500" /><span>Kirim Masukan</span>
                </div>
              </Link>

              <Link href="/funding" onClick={() => setIsMenuOpen(false)}>
                <div className="w-full flex items-center px-4 py-3 text-sm hover:bg-rose-500/10 transition-colors text-rose-500 font-bold border-t border-border/30">
                  <Heart className="h-4 w-4 mr-3 fill-rose-500 animate-pulse" /><span>Dukung Nexa</span>
                </div>
              </Link>

              {deferredPrompt && (
                <button onClick={handleInstallClick} className="w-full flex items-center px-4 py-3 text-sm hover:bg-muted transition-colors text-primary font-medium border-t border-border/30">
                  <Download className="h-4 w-4 mr-3" /><span>Unduh Aplikasi</span>
                </button>
              )}

              {user && !user.isAnonymous ? (
                <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm hover:bg-destructive/10 transition-colors text-destructive font-medium border-t border-border/30">
                  <LogOut className="h-4 w-4 mr-3" /><span>Keluar Akun</span>
                </button>
              ) : (
                <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                  <div className="w-full flex items-center px-4 py-3 text-sm hover:bg-primary/10 transition-colors text-primary font-medium border-t border-border/30">
                    <LogIn className="h-4 w-4 mr-3" /><span>Masuk / Daftar</span>
                  </div>
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}