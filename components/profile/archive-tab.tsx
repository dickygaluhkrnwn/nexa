"use client";

import Link from "next/link";
import { Archive, Sparkles } from "lucide-react";

interface ArchiveTabProps {
  archivedReviews: any[];
}

export function ArchiveTab({ archivedReviews }: ArchiveTabProps) {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1 ml-1 flex items-center gap-2">
        <Archive className="w-4 h-4" /> Arsip Laporan Mingguan
      </h3>
      
      {archivedReviews.length === 0 ? (
        <div className="bg-card border border-dashed border-border/60 rounded-[2rem] p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Archive className="w-8 h-8 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-bold text-foreground">Belum ada arsip.</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-[250px] mx-auto leading-relaxed">
            Laporan mingguan dari AI yang kamu simpan dari halaman To-Do akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {archivedReviews.map(review => (
            <Link href={`/edit/${review.id}`} key={review.id} className="bg-card border border-border/60 p-4 rounded-3xl shadow-sm hover:shadow-md hover:border-primary/30 transition-all group flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-primary flex items-center justify-center text-white font-black text-xl shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                 <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <h4 className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                  {review.title || "Laporan Mingguan"}
                </h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2" dangerouslySetInnerHTML={{__html: review.content.replace(/<[^>]+>/g, ' ')}}></p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}