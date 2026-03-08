"use client";

import { Button } from "@/components/ui/button";
import { Bell, Smartphone, BellRing, Pencil, Phone, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="space-y-8">
      {/* 1. Pengaturan Push & Getaran */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Notifikasi Sistem
        </h3>
        <div className="bg-background border border-border/60 rounded-[2rem] p-6 md:p-8 shadow-sm space-y-6 md:space-y-8 transition-all hover:shadow-md">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-6 md:pb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl text-blue-600 flex items-center justify-center shrink-0">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-base md:text-lg">Izinkan Notifikasi</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Dapatkan pengingat tugas di layar perangkatmu.</p>
              </div>
            </div>
            {pushPermission === 'granted' ? (
              <span className="text-sm font-extrabold text-green-600 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 text-center">Telah Aktif</span>
            ) : (
              <Button onClick={onRequestPush} className="rounded-xl h-11 px-6 font-bold shadow-sm">Aktifkan Sekarang</Button>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-2xl text-orange-600 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-base md:text-lg">Getaran Perangkat</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">HP akan bergetar saat notifikasi masuk.</p>
              </div>
            </div>
            <button
              onClick={onToggleVibration}
              className={cn(
                "relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                vibrationEnabled ? 'bg-primary shadow-inner' : 'bg-muted-foreground/30'
              )}
            >
              <span className="sr-only">Toggle getaran</span>
              <span className={cn(
                "pointer-events-none inline-block h-7 w-7 transform rounded-full bg-background shadow-md ring-0 transition duration-300 ease-in-out",
                vibrationEnabled ? 'translate-x-6' : 'translate-x-0'
              )} />
            </button>
          </div>

        </div>
      </div>

      <div className="w-full h-px bg-border/50" />

      {/* 2. Pengaturan WhatsApp */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Integrasi Eksternal
        </h3>
        <div className="bg-background border border-border/60 rounded-[2rem] p-6 md:p-8 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-2xl text-green-600 flex items-center justify-center shrink-0">
                <BellRing className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-base md:text-lg">Notifikasi WhatsApp</h2>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Asisten AI Nexa akan mengirim pengingat ke WA.</p>
              </div>
            </div>
            {!isEditingWA && (
              <Button variant="outline" onClick={() => setIsEditingWA(true)} className="text-primary hover:text-primary hover:bg-primary/5 rounded-xl px-5 font-bold h-11">
                <Pencil className="w-4 h-4 mr-2" /> {whatsapp ? "Ubah Nomor" : "Hubungkan WA"}
              </Button>
            )}
          </div>
          
          {isEditingWA ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300 bg-muted/20 p-5 rounded-[1.5rem] border border-border/50">
              <div className="relative flex items-center group">
                <Phone className="absolute left-4 w-5 h-5 text-muted-foreground group-focus-within:text-green-500 transition-colors" />
                <span className="absolute left-12 text-muted-foreground text-sm font-extrabold">+62</span>
                <input
                  type="tel"
                  placeholder="81234567890"
                  value={whatsapp.replace(/^62|^0/, '')}
                  onChange={(e) => setWhatsapp("62" + e.target.value.replace(/^0/, ''))}
                  className="w-full bg-background pl-[80px] pr-4 py-4 text-base font-bold rounded-xl outline-none focus:ring-2 focus:ring-green-500/50 transition-all border border-border focus:border-green-500/30 shadow-inner"
                />
              </div>
              <p className="text-[11px] md:text-xs text-muted-foreground px-1 font-medium">
                *Masukkan nomor tanpa awalan 0 (Contoh: 812...).
              </p>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsEditingWA(false)} disabled={isSaving} className="flex-1 md:flex-none md:w-32 rounded-xl h-11 font-bold">Batal</Button>
                <Button onClick={onSaveWA} disabled={isSaving} className="flex-1 md:flex-none md:w-40 rounded-xl h-11 bg-green-600 hover:bg-green-700 text-white font-bold shadow-md">
                  {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Simpan
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-muted/40 rounded-xl border border-border/50 inline-flex items-center w-full md:w-auto min-w-[250px]">
              <div className="p-2.5 bg-background rounded-full shadow-sm border border-border mr-4 shrink-0">
                <Phone className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-base font-extrabold text-foreground/80 truncate">
                {whatsapp ? <span className="tracking-widest">+{whatsapp}</span> : <span className="font-medium text-muted-foreground/80 italic text-sm">Belum terhubung</span>}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}