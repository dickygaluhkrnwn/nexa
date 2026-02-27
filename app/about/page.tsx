"use client";

import { ArrowLeft, Info, Sparkles, LockKeyhole, Repeat, BrainCircuit, Github, Globe, Twitter } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto">
      {/* Header Statis */}
      <div className="p-4 flex items-center gap-3 print:hidden">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tentang Nexa</span>
      </div>

      <div className="px-5 mt-2 space-y-8">
        
        {/* Hero Section */}
        <div className="text-center space-y-4 pt-4">
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-xl shadow-purple-500/20 mb-6">
            <span className="text-5xl font-extrabold text-white">N</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Nexa AI Notes</h1>
            <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4">
              Versi 2.0.0 (BETA)
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-[300px] mx-auto">
              Lebih dari sekadar catatan biasa. Nexa adalah asisten produktivitas cerdas yang membantumu merencanakan hidup dengan lebih baik.
            </p>
          </div>
        </div>

        {/* Fitur Utama */}
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Fitur Unggulan</h2>
          
          <div className="grid gap-3">
            <div className="bg-card border border-border p-4 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-blue-500/10 rounded-xl shrink-0 mt-0.5">
                <BrainCircuit className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Otak AI (Gemini)</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Ringkas catatan panjang dalam sekejap, ekstrak teks dari gambar (OCR), tebak label otomatis, dan ngobrol dengan AI soal catatanmu.
                </p>
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-purple-500/10 rounded-xl shrink-0 mt-0.5">
                <LockKeyhole className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Brankas Rahasia</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Punya catatan atau password yang pantang dilihat orang? Kunci di dalam Brankas yang hanya bisa dibuka dengan PIN 4 digitmu.
                </p>
              </div>
            </div>

            <div className="bg-card border border-border p-4 rounded-2xl flex items-start gap-4">
              <div className="p-2 bg-orange-500/10 rounded-xl shrink-0 mt-0.5">
                <Repeat className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-bold text-sm mb-1">Rutinitas To-Do</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Buat tugas yang berulang secara otomatis setiap hari, minggu, atau bulan tanpa perlu repot mengetik ulang.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tentang Kreator */}
        <div className="space-y-4 pt-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Dikembangkan Oleh</h2>
          <div className="bg-gradient-to-r from-muted to-background border border-border p-5 rounded-3xl text-center space-y-4">
            <p className="text-sm text-foreground/80 leading-relaxed font-medium">
              Nexa dirancang dan dibangun dengan 💖 oleh <span className="font-bold text-primary">ikydev</span>. Dibuat khusus untuk mereka yang ingin lebih produktif tanpa harus berlangganan aplikasi mahal.
            </p>
            
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-border bg-background hover:bg-muted text-foreground">
                <Github className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-border bg-background hover:bg-muted text-foreground">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-border bg-background hover:bg-muted text-foreground">
                <Globe className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}