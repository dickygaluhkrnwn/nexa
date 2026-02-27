"use client";

import { ArrowLeft, Heart, Server, BrainCircuit, ExternalLink, Coffee, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FundingPage() {
  return (
    <div className="pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-lg mx-auto">
      {/* Header Statis */}
      <div className="p-4 flex items-center gap-3 print:hidden">
        <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Dukung Nexa</span>
      </div>

      <div className="px-5 mt-2 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-400 via-rose-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-xl shadow-rose-500/20 animate-bounce-slow">
            <Heart className="w-10 h-10 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Bantu Nexa Tetap Hidup</h1>
            <p className="text-muted-foreground mt-3 text-sm leading-relaxed max-w-[280px] mx-auto">
              Nexa dikembangkan secara independen. Dukunganmu sangat berarti untuk menjaga server dan otak AI tetap berjalan lancar tanpa batas.
            </p>
          </div>
        </div>

        {/* Transparansi Biaya */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Transparansi Biaya Bulanan</h2>
          <div className="bg-card border border-border rounded-3xl p-5 space-y-4 shadow-sm">
            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500 shrink-0">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Tagihan API AI (Gemini)</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Setiap ringkasan, OCR gambar, tebakan tag, dan chat membutuhkan biaya API (Token) agar AI Nexa bisa terus berpikir pintar.
                </p>
              </div>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex gap-4 items-start">
              <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500 shrink-0">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Server & Database</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Menyimpan catatan dan tugasmu dengan aman (terutama enkripsi Brankas Rahasia) memerlukan ruang penyimpanan cloud yang harus dibayar.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pilihan Donasi */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Cara Mendukung</h2>
          <div className="grid gap-3">
            {/* Link Saweria aslimu */}
            <a href="https://saweria.co/ikydev" target="_blank" rel="noopener noreferrer" className="block">
              <div className="bg-gradient-to-r from-[#E5B034]/10 to-[#E5B034]/5 border border-[#E5B034]/30 rounded-2xl p-4 flex items-center justify-between hover:bg-[#E5B034]/20 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#E5B034] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                    S
                  </div>
                  <div>
                    <h3 className="font-bold text-[#E5B034] group-hover:underline">Saweria</h3>
                    <p className="text-xs text-muted-foreground">Mulai dari Rp 10.000 (Gopay/OVO/Dana)</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-[#E5B034]" />
              </div>
            </a>

            {/* Link Trakteer aslimu */}
            <a href="https://teer.id/ikydev" target="_blank" rel="noopener noreferrer" className="block">
              <div className="bg-gradient-to-r from-red-500/10 to-red-500/5 border border-red-500/30 rounded-2xl p-4 flex items-center justify-between hover:bg-red-500/20 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-red-500 group-hover:underline">Trakteer Kopi</h3>
                    <p className="text-xs text-muted-foreground">Dukung dengan mentraktir secangkir kopi</p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-red-500" />
              </div>
            </a>
          </div>
        </div>

        {/* Apresiasi */}
        <div className="text-center p-6 bg-muted/30 rounded-3xl border border-border/50">
          <Sparkles className="w-6 h-6 text-primary mx-auto mb-3" />
          <p className="text-sm text-foreground/80 font-medium leading-relaxed">
            Tidak punya dana lebih? Tidak apa-apa! Tetap menggunakan Nexa dan memberikan *feedback* membangun juga sudah menjadi dukungan terbesar bagiku. Terima kasih! 🚀
          </p>
        </div>

      </div>
    </div>
  );
}