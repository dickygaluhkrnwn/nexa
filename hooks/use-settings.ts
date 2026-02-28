import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// PERBAIKAN: Menambahkan 'blue' dan 'orange' ke dalam tipe ColorAccent
export type ColorAccent = 'default' | 'rose' | 'emerald' | 'amber' | 'violet' | 'blue' | 'orange';
export type FontStyle = 'sans' | 'serif' | 'mono';

interface SettingsState {
  colorAccent: ColorAccent;
  fontStyle: FontStyle;
  setColorAccent: (color: ColorAccent) => void;
  setFontStyle: (font: FontStyle) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      colorAccent: 'default',
      fontStyle: 'sans', // Default bawaan
      setColorAccent: (color) => set({ colorAccent: color }),
      setFontStyle: (font) => set({ fontStyle: font }),
    }),
    { name: 'nexa-settings' } // Disimpan di localStorage
  )
);