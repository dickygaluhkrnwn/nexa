"use client";

import { Button } from "@/components/ui/button";
import { Bell, Smartphone, BellRing, Pencil, Phone, Loader2, Save } from "lucide-react";

interface NotificationsTabProps {
  pushPermission: NotificationPermission | "default";
  onRequestPush: () => void;
  vibrationEnabled: boolean;
  onToggleVibration: () => void;
  whatsapp: string;
  setWhatsapp: (val: string) => void;
  isEditingWA: boolean;
  setIsEditingWA: (val: boolean) => void;
  isSaving: boolean;
  onSaveWA: () => void;
}

export function NotificationsTab({
  pushPermission, onRequestPush,
  vibrationEnabled, onToggleVibration,
  whatsapp, setWhatsapp,
  isEditingWA, setIsEditingWA,
  isSaving, onSaveWA
}: NotificationsTabProps) {
  return (
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
              <Button size="sm" onClick={onRequestPush} className="rounded-full text-xs h-8 px-4 font-bold shadow-md">Aktifkan</Button>
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
              onClick={onToggleVibration}
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
                  <Button onClick={onSaveWA} disabled={isSaving} className="flex-1 rounded-xl h-11 bg-green-600 hover:bg-green-700 text-white font-bold shadow-md">
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
  );
}