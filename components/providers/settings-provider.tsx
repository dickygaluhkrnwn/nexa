"use client";

import { useEffect } from "react";
import { useSettings } from "@/hooks/use-settings";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { colorAccent, fontStyle } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    // 1. Bersihkan semua class warna yang ada
    root.classList.remove(
      'theme-rose', 
      'theme-emerald', 
      'theme-amber', 
      'theme-violet', 
      'theme-blue', 
      'theme-orange'
    );
    
    // 2. Tambahkan class warna yang baru dipilih
    if (colorAccent !== 'default') {
      root.classList.add(`theme-${colorAccent}`);
    }

    // 3. Aplikasikan Font Style ke tag <body>
    body.classList.remove('font-sans', 'font-serif', 'font-mono');
    body.classList.add(`font-${fontStyle}`);

  }, [colorAccent, fontStyle]);

  return <>{children}</>;
}