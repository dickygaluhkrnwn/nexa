"use client";

import { ArrowLeft, Smartphone, Download, Play, ShieldCheck, Sparkles, Star, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-700 relative overflow-hidden selection:bg-primary/20">
      
      {/* Background Dekoratif Premium */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-primary/10 via-purple-600/5 to-transparent pointer-events-none z-0" />
      <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-40 -left-40 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Header */}
      <header className="relative z-50 w-full">
        <div className="flex items-center h-20 px-8 max-w-[1400px] mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors group-hover:-translate-x-1 duration-300 w-12 h-12 border border-border/50 bg-background/50 backdrop-blur-md">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </Button>
            <span className="font-bold text-lg tracking-tight">Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-8 pt-12 md:pt-20 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* KOLOM KIRI: Teks & Tombol Download */}
          <div className="lg:col-span-7 flex flex-col space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary w-max font-bold text-sm uppercase tracking-widest shadow-sm">
              <Sparkles className="w-4 h-4" /> Tersedia untuk Android
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
              Bawa <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Otak Keduamu</span> ke Mana Saja.
            </h1>
            
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed font-medium max-w-2xl">
              Tingkatkan produktivitasmu tanpa batas ruang. Instal Nexa AI Notes di perangkat Android-mu untuk mencatat ide, mengatur tugas, dan bertanya pada AI kapan pun inspirasi datang.
            </p>

            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center overflow-hidden shadow-sm">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="User" />
                  </div>
                ))}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center text-[#E5B034]">
                  <Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" /><Star className="w-4 h-4 fill-current" />
                </div>
                <span className="text-sm font-bold text-foreground mt-0.5">Disukai pengguna awal</span>
              </div>
            </div>

            <div className="w-full h-px bg-border/60 my-4" />

            {/* Tombol-tombol Download */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Tombol APKPure (Aktif) */}
              <a href="https://apkpure.com/p/com.ikydev.nexa" target="_blank" rel="noopener noreferrer" className="block group">
                <div className="h-24 bg-card hover:bg-green-500/5 border border-border/80 hover:border-green-500/50 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center text-white shadow-md shrink-0 group-hover:scale-105 transition-transform">
                    <Download className="w-7 h-7" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Unduh Gratis di</span>
                    <span className="text-xl font-black text-foreground group-hover:text-green-600 transition-colors">APKPure</span>
                  </div>
                </div>
              </a>

              {/* Tombol Google Play (Segera Hadir / Disabled) */}
              <div className="block group opacity-70 cursor-not-allowed">
                <div className="h-24 bg-muted/30 border border-border/50 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] z-10 flex items-center justify-end pr-6">
                     <span className="bg-background border border-border text-foreground text-xs font-bold px-3 py-1 rounded-full shadow-sm">Segera Hadir</span>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white shadow-md shrink-0">
                    <Play className="w-7 h-7 fill-white ml-1" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Akan tersedia di</span>
                    <span className="text-xl font-black text-foreground">Google Play</span>
                  </div>
                </div>
              </div>

            </div>

            <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground bg-muted/30 p-4 rounded-2xl border border-border/50 w-max mt-4">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Aman dari virus & malware. Terverifikasi oleh Protect.
            </div>

          </div>

          {/* KOLOM KANAN: Visual Device Mockup (Abstrak Premium) */}
          <div className="lg:col-span-5 relative hidden lg:flex justify-center items-center">
            {/* Dekorasi Belakang */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-full blur-3xl animate-pulse" />
            
            {/* Mockup HP */}
            <div className="relative w-[320px] h-[650px] bg-black rounded-[3rem] border-[8px] border-[#1f1f1f] shadow-2xl shadow-primary/20 p-2 z-10 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-700">
              {/* Layar Dalam */}
              <div className="w-full h-full bg-background rounded-[2.25rem] overflow-hidden relative flex flex-col">
                {/* Poni / Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20" />
                
                {/* Konten Simulasi Nexa Mobile */}
                <div className="flex-1 p-5 pt-12 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                     <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                     <div className="w-24 h-4 bg-muted rounded-full animate-pulse" />
                  </div>
                  <div className="w-full h-32 bg-primary/10 rounded-2xl border border-primary/20 p-4 flex flex-col justify-end">
                    <div className="w-20 h-4 bg-primary/30 rounded-full mb-2" />
                    <div className="w-3/4 h-6 bg-primary/40 rounded-full" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="h-24 bg-card border border-border rounded-2xl shadow-sm" />
                    <div className="h-24 bg-card border border-border rounded-2xl shadow-sm" />
                    <div className="h-24 bg-card border border-border rounded-2xl shadow-sm" />
                    <div className="h-24 bg-card border border-border rounded-2xl shadow-sm" />
                  </div>
                  <div className="mt-auto h-16 bg-card border border-border rounded-2xl shadow-sm flex items-center justify-between px-6">
                    <div className="w-6 h-6 bg-muted-foreground/20 rounded-full" />
                    <div className="w-12 h-12 bg-primary rounded-full -mt-6 shadow-lg flex items-center justify-center border-4 border-background">
                       <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="w-6 h-6 bg-muted-foreground/20 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating Elements (Opsional) */}
            <div className="absolute top-20 -right-8 bg-card border border-border p-3 rounded-2xl shadow-xl flex items-center gap-3 z-20 animate-bounce-slow">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
              <span className="font-bold text-sm">Tugas Selesai</span>
            </div>
            <div className="absolute bottom-32 -left-12 bg-card border border-border p-3 rounded-2xl shadow-xl flex items-center gap-3 z-20 animate-bounce-slow" style={{ animationDelay: '1s' }}>
              <Sparkles className="w-6 h-6 text-purple-500" />
              <span className="font-bold text-sm">AI Mengetik...</span>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}