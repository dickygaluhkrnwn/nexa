"use client";

import { ArrowLeft, Info, Sparkles, LockKeyhole, Repeat, BrainCircuit, Github, Globe, Twitter, Code2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-500 relative selection:bg-primary/20">
      
      {/* Background Dekoratif */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-primary/5 via-purple-500/5 to-transparent pointer-events-none" />

      <main className="max-w-5xl mx-auto px-5 md:px-8 pt-8 md:pt-12 space-y-12 md:space-y-20 relative z-10">
        
        {/* Tombol Kembali (Menyatu dengan Konten, Tidak Mengambang) */}
        <Link href="/" className="inline-flex items-center gap-3 group w-max">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors group-hover:-translate-x-1 duration-300">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <span className="font-bold text-base md:text-lg tracking-tight text-muted-foreground group-hover:text-foreground transition-colors">Kembali</span>
        </Link>

        {/* Hero Section */}
        <div className="text-center space-y-6 flex flex-col items-center">
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-[2.5rem] bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/20 mb-4 transform rotate-3 hover:rotate-0 transition-transform duration-500">
            <span className="text-6xl md:text-7xl font-extrabold text-white">N</span>
          </div>
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-foreground">Nexa AI Notes</h1>
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs md:text-sm font-extrabold mb-6 uppercase tracking-widest shadow-sm">
              Versi 2.0.0 (BETA)
            </div>
            <p className="text-muted-foreground text-base md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
              Lebih dari sekadar catatan biasa. Nexa adalah asisten produktivitas cerdas yang membantumu merencanakan hidup, mengelola tugas, dan mencatat ide cemerlang dengan bantuan AI.
            </p>
          </div>
        </div>

        {/* Fitur Utama (Grid Bento Desktop) */}
        <div className="space-y-6">
          <div className="text-center md:text-left flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-border/50 hidden md:block" />
            <h2 className="text-sm md:text-base font-extrabold uppercase tracking-widest text-muted-foreground px-4">Fitur Unggulan</h2>
            <div className="h-px flex-1 bg-border/50 hidden md:block" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="bg-card border border-border/60 p-6 md:p-8 rounded-[2rem] flex flex-col items-start gap-4 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-blue-500/30 transition-all duration-300 group">
              <div className="p-3 bg-blue-500/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                <BrainCircuit className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg mb-2 text-foreground">Otak AI Cerdas</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  Ringkas catatan panjang dalam sekejap, ekstrak teks dari gambar (OCR), tebak label otomatis, dan ngobrol dengan AI soal catatanmu secara real-time.
                </p>
              </div>
            </div>

            <div className="bg-card border border-border/60 p-6 md:p-8 rounded-[2rem] flex flex-col items-start gap-4 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-purple-500/30 transition-all duration-300 group">
              <div className="p-3 bg-purple-500/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                <LockKeyhole className="w-8 h-8 text-purple-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg mb-2 text-foreground">Brankas Rahasia</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  Punya catatan atau ide yang pantang dilihat orang lain? Kunci rapat di dalam Brankas yang hanya bisa dibuka dengan PIN 4 digit pribadimu.
                </p>
              </div>
            </div>

            <div className="bg-card border border-border/60 p-6 md:p-8 rounded-[2rem] flex flex-col items-start gap-4 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-orange-500/30 transition-all duration-300 group">
              <div className="p-3 bg-orange-500/10 rounded-2xl shrink-0 group-hover:scale-110 transition-transform">
                <Repeat className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg mb-2 text-foreground">Rutinitas To-Do</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                  Buat tugas yang berulang secara otomatis setiap hari, minggu, atau bulan. Tidak perlu lagi repot mengetik ulang jadwal rutinitasmu.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tentang Kreator (Wide Banner) */}
        <div className="space-y-6 pt-4">
          <div className="bg-gradient-to-r from-card to-muted border border-border/60 p-8 md:p-12 rounded-[2.5rem] flex flex-col md:flex-row items-center md:justify-between gap-8 shadow-sm">
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-background rounded-full border border-border shadow-sm text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                <Code2 className="w-3.5 h-3.5" /> Dikembangkan Oleh
              </div>
              <h3 className="text-2xl md:text-3xl font-black text-foreground">ikydev</h3>
              <p className="text-base text-muted-foreground leading-relaxed font-medium max-w-lg mx-auto md:mx-0">
                Nexa dirancang dan dibangun dengan 💖. Dibuat khusus untuk mereka yang ingin lebih produktif dengan teknologi AI tanpa harus berlangganan aplikasi yang mahal.
              </p>
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <a href="#" target="_blank" rel="noreferrer">
                <Button variant="outline" size="icon" className="rounded-2xl w-14 h-14 border-border bg-background hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all shadow-sm hover:-translate-y-1">
                  <Github className="w-6 h-6" />
                </Button>
              </a>
              <a href="#" target="_blank" rel="noreferrer">
                <Button variant="outline" size="icon" className="rounded-2xl w-14 h-14 border-border bg-background hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-500 transition-all shadow-sm hover:-translate-y-1">
                  <Twitter className="w-6 h-6" />
                </Button>
              </a>
              <a href="https://nexa-seven-kappa.vercel.app" target="_blank" rel="noreferrer">
                <Button variant="outline" size="icon" className="rounded-2xl w-14 h-14 border-border bg-background hover:bg-green-500/10 hover:border-green-500/30 hover:text-green-500 transition-all shadow-sm hover:-translate-y-1">
                  <Globe className="w-6 h-6" />
                </Button>
              </a>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}