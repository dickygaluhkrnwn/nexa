"use client";

import { Sun, Moon, Laptop, Palette, Type } from "lucide-react";

interface AppearanceTabProps {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  colorAccent: string;
  setColorAccent: (color: string) => void;
  fontStyle: string;
  setFontStyle: (font: string) => void;
}

export function AppearanceTab({ theme, setTheme, colorAccent, setColorAccent, fontStyle, setFontStyle }: AppearanceTabProps) {
  return (
    <div className="space-y-8">
      {/* TEMA APLIKASI */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Mode Cahaya
        </h3>
        <div className="bg-background border border-border/60 rounded-[2rem] p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => setTheme('light')} className={`flex flex-row md:flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-4 md:gap-2 ${theme === 'light' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/30 hover:bg-muted'}`}>
              <Sun className={`w-6 h-6 md:w-8 md:h-8 md:mb-2 ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-bold ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'}`}>Mode Terang</span>
            </button>
            <button onClick={() => setTheme('dark')} className={`flex flex-row md:flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-4 md:gap-2 ${theme === 'dark' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/30 hover:bg-muted'}`}>
              <Moon className={`w-6 h-6 md:w-8 md:h-8 md:mb-2 ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-bold ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'}`}>Mode Gelap</span>
            </button>
            <button onClick={() => setTheme('system')} className={`flex flex-row md:flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-4 md:gap-2 ${theme === 'system' ? 'border-primary bg-primary/5 shadow-sm' : 'border-border bg-muted/30 hover:bg-muted'}`}>
              <Laptop className={`w-6 h-6 md:w-8 md:h-8 md:mb-2 ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`text-sm font-bold ${theme === 'system' ? 'text-primary' : 'text-muted-foreground'}`}>Ikuti Sistem</span>
            </button>
          </div>
          <p className="text-sm text-center text-muted-foreground font-medium pt-4">
            Pilih tema antarmuka yang paling nyaman untuk matamu saat bekerja.
          </p>
        </div>
      </div>

      <div className="w-full h-px bg-border/50" />

      {/* AKSEN WARNA */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <Palette className="w-5 h-5" /> Aksen Warna
        </h3>
        <div className="bg-background border border-border/60 rounded-[2rem] p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <button onClick={() => setColorAccent('default')} className={`w-12 h-12 rounded-full border-[3px] flex items-center justify-center transition-all bg-indigo-500 ${colorAccent === 'default' ? 'border-foreground ring-4 ring-indigo-500/30 scale-110' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`} />
            <button onClick={() => setColorAccent('blue')} className={`w-12 h-12 rounded-full bg-blue-500 border-[3px] flex items-center justify-center transition-all ${colorAccent === 'blue' ? 'border-foreground ring-4 ring-blue-500/30 scale-110' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`} />
            <button onClick={() => setColorAccent('emerald')} className={`w-12 h-12 rounded-full bg-emerald-500 border-[3px] flex items-center justify-center transition-all ${colorAccent === 'emerald' ? 'border-foreground ring-4 ring-emerald-500/30 scale-110' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`} />
            <button onClick={() => setColorAccent('amber')} className={`w-12 h-12 rounded-full bg-amber-500 border-[3px] flex items-center justify-center transition-all ${colorAccent === 'amber' ? 'border-foreground ring-4 ring-amber-500/30 scale-110' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`} />
            <button onClick={() => setColorAccent('orange')} className={`w-12 h-12 rounded-full bg-orange-500 border-[3px] flex items-center justify-center transition-all ${colorAccent === 'orange' ? 'border-foreground ring-4 ring-orange-500/30 scale-110' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`} />
            <button onClick={() => setColorAccent('rose')} className={`w-12 h-12 rounded-full bg-rose-500 border-[3px] flex items-center justify-center transition-all ${colorAccent === 'rose' ? 'border-foreground ring-4 ring-rose-500/30 scale-110' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`} />
            <button onClick={() => setColorAccent('violet')} className={`w-12 h-12 rounded-full bg-violet-500 border-[3px] flex items-center justify-center transition-all ${colorAccent === 'violet' ? 'border-foreground ring-4 ring-violet-500/30 scale-110' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'}`} />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-border/50" />

      {/* GAYA HURUF */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
          <Type className="w-5 h-5" /> Gaya Huruf (Tipografi)
        </h3>
        <div className="bg-background border border-border/60 rounded-[2rem] p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => setFontStyle('sans')} className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${fontStyle === 'sans' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'}`}>
              <span className="font-sans font-black text-4xl">Aa</span>
              <span className="text-xs font-bold uppercase tracking-wider">Modern (Sans)</span>
            </button>
            <button onClick={() => setFontStyle('serif')} className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${fontStyle === 'serif' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'}`}>
              <span className="font-serif font-black text-4xl">Aa</span>
              <span className="text-xs font-bold uppercase tracking-wider">Klasik (Serif)</span>
            </button>
            <button onClick={() => setFontStyle('mono')} className={`p-5 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${fontStyle === 'mono' ? 'border-primary bg-primary/5 text-primary shadow-sm' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted'}`}>
              <span className="font-mono font-black text-4xl">Aa</span>
              <span className="text-xs font-bold uppercase tracking-wider">Fokus (Mono)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}