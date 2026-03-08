"use client";

import Link from "next/link";
import { Archive, Sparkles, ArrowRight } from "lucide-react";

interface ArchiveTabProps {
  archivedReviews: any[];
}

export function ArchiveTab({ archivedReviews }: ArchiveTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
        <Archive className="w-5 h-5" /> Daftar Arsip
      </h3>
      
      {archivedReviews.length === 0 ? (
        <div className="bg-background border border-dashed border-border/60 rounded-[2rem] p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <Archive className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <p className="text-lg font-bold text-foreground mb-2">Brankas Arsip Masih Kosong</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Laporan "Weekly Review" yang dibuat oleh AI dari halaman Tugas akan otomatis tersimpan di sini agar dapat dibaca kembali.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {archivedReviews.map(review => (
            <Link href={`/edit/${review.id}`} key={review.id} className="bg-background border border-border/60 p-5 rounded-3xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all group flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center text-white shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                   <Sparkles className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h4 className="font-bold text-base text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                    {review.title || "Laporan Mingguan"}
                  </h4>
                </div>
              </div>
              <div className="flex-1 bg-muted/30 p-3 rounded-xl mb-4">
                <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed" dangerouslySetInnerHTML={{__html: review.content.replace(/<[^>]+>/g, ' ')}}></p>
              </div>
              <div className="flex items-center text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity mt-auto">
                Buka Laporan <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}