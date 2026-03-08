"use client";

import { ArrowLeft, Heart, Server, BrainCircuit, ExternalLink, Coffee, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FundingPage() {
  return (
    <div className="min-h-screen bg-background pb-24 animate-in fade-in duration-500">
      
      {/* Header Statis */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center h-16 px-4 md:px-8 max-w-6xl mx-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors group-hover:-translate-x-1 duration-300">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="font-bold text-base md:text-lg tracking-tight">Dukung Nexa</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 md:px-8 mt-8 md:mt-16 space-y-12 md:space-y-20">
        
        {/* Hero Section */}
        <div className="text-center space-y-6 flex flex-col items-center">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2.5rem] bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600 flex items-center justify-center shadow-2xl shadow-rose-500/30 animate-in zoom-in duration-700">
            <Heart className="w-12 h-12 md:w-16 md:h-16 text-white fill-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4 text-foreground leading-tight">
              Bantu Nexa Tetap Hidup
            </h1>
            <p className="text-muted-foreground text-base md:text-xl leading-relaxed max-w-2xl mx-auto font-medium">
              Nexa dikembangkan secara independen dan digratiskan. Dukunganmu sangat berarti untuk menjaga server dan otak AI tetap berjalan lancar tanpa batas.
            </p>
          </div>
        </div>

        {/* Grid Layout untuk Biaya dan Cara Mendukung */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
          
          {/* Kiri: Transparansi Biaya */}
          <div className="space-y-6">
            <h2 className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-4">
              Transparansi Biaya Operasional
            </h2>
            <div className="bg-card border border-border/60 rounded-[2rem] p-6 md:p-8 space-y-6 shadow-sm">
              <div className="flex gap-5 items-start group">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 shrink-0 group-hover:scale-110 transition-transform">
                  <BrainCircuit className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base md:text-lg mb-1 text-foreground">Tagihan API AI (Gemini)</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    Setiap ringkasan, OCR gambar, tebakan tag, dan chat membutuhkan biaya API (Token) per *request* agar AI Nexa bisa terus berpikir pintar untukmu.
                  </p>
                </div>
              </div>
              
              <div className="h-px bg-border/50 ml-16" />
              
              <div className="flex gap-5 items-start group">
                <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500 shrink-0 group-hover:scale-110 transition-transform">
                  <Server className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base md:text-lg mb-1 text-foreground">Server & Database Cloud</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                    Menyimpan catatan dan tugasmu dengan aman (terutama enkripsi Brankas Rahasia) dan sinkronisasi *real-time* memerlukan biaya sewa server bulanan.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Kanan: Pilihan Donasi */}
          <div className="space-y-6">
            <h2 className="text-xs md:text-sm font-extrabold uppercase tracking-widest text-muted-foreground border-b border-border/50 pb-4">
              Cara Mendukung Kami
            </h2>
            <div className="grid gap-4">
              {/* Link Saweria */}
              <a href="https://saweria.co/ikydev" target="_blank" rel="noopener noreferrer" className="block">
                <div className="bg-background hover:bg-[#E5B034]/5 border border-border hover:border-[#E5B034]/50 rounded-[2rem] p-6 flex items-center justify-between transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#E5B034] to-[#c7982c] rounded-[1.25rem] flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-[#E5B034]/20 group-hover:scale-105 transition-transform">
                      S
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-foreground group-hover:text-[#E5B034] transition-colors">Saweria</h3>
                      <p className="text-xs md:text-sm text-muted-foreground font-medium mt-0.5">Donasi mulai Rp 10rb (Gopay/OVO/Dana)</p>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-[#E5B034] transition-colors" />
                </div>
              </a>

              {/* Link Trakteer */}
              <a href="https://teer.id/ikydev" target="_blank" rel="noopener noreferrer" className="block">
                <div className="bg-background hover:bg-red-500/5 border border-border hover:border-red-500/50 rounded-[2rem] p-6 flex items-center justify-between transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1 group">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-lg shadow-red-500/20 group-hover:scale-105 transition-transform">
                      <Coffee className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-lg text-foreground group-hover:text-red-500 transition-colors">Trakteer Kopi</h3>
                      <p className="text-xs md:text-sm text-muted-foreground font-medium mt-0.5">Dukung dengan mentraktir secangkir kopi</p>
                    </div>
                  </div>
                  <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-red-500 transition-colors" />
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Apresiasi Banner */}
        <div className="text-center p-8 md:p-12 bg-gradient-to-r from-primary/10 via-purple-600/5 to-transparent rounded-[2.5rem] border border-primary/20 shadow-sm mt-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-4 relative z-10" />
          <h3 className="text-xl md:text-2xl font-extrabold text-foreground mb-3 relative z-10">Setiap Dukungan Sangat Berarti</h3>
          <p className="text-sm md:text-lg text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto relative z-10">
            Tidak punya dana lebih? Tidak masalah! Tetap menggunakan Nexa dan memberikan *feedback* yang membangun di halaman masukan juga sudah menjadi dukungan terbesar bagiku. Terima kasih! 🚀
          </p>
        </div>

      </main>
    </div>
  );
}