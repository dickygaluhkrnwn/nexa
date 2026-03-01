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
  );
}