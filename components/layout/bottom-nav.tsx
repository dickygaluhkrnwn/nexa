"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Home, FileText, Plus, CheckSquare, User, Camera, Image as ImageIcon, Mic, Type, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { icon: Home, label: "Home", href: "/", orderClass: "order-1 md:order-1" },
    { icon: FileText, label: "Notes", href: "/notes", orderClass: "order-2 md:order-2" },
    { icon: CheckSquare, label: "To-Do", href: "/todo", orderClass: "order-4 md:order-3" },
    { icon: User, label: "Profile", href: "/profile", orderClass: "order-5 md:order-4" },
    { icon: Plus, label: "Create", href: "#", isMain: true, orderClass: "order-3 md:order-last md:mt-auto md:mb-4" },
  ];

  const handleCreateOption = (mode: string) => {
    setIsOpen(false);
    if (mode === 'todo') {
      router.push('/create-todo');
    } else {
      router.push(mode === 'text' ? '/create' : `/create?mode=${mode}`);
    }
  };

  return (
    <>
      {/* POP-UP MENU & BACKDROP DITARUH DI LUAR NAVIGASI AGAR TIDAK TERPOTONG */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex pointer-events-none">
          {/* Backdrop transparan modern */}
          <div 
            className="absolute inset-0 bg-background/70 backdrop-blur-sm pointer-events-auto cursor-pointer animate-in fade-in duration-200" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Posisi pop-up: Dari bawah ke atas di mobile, dari kiri di desktop */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 md:translate-x-0 md:bottom-8 md:left-[6.5rem] flex flex-col gap-3 w-max pointer-events-auto">
            <button onClick={() => handleCreateOption('todo')} className="group/btn flex items-center gap-3 animate-in slide-in-from-bottom-2 md:slide-in-from-left-2 duration-200" style={{ animationDelay: '200ms', animationFillMode: 'backwards' }}>
              <span className="text-xs md:text-sm font-bold bg-background border border-border/50 shadow-lg px-3.5 py-2.5 rounded-xl text-foreground md:order-2 group-hover/btn:bg-muted transition-colors">Tugas Baru</span>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-orange-500 rounded-full text-white shadow-xl flex items-center justify-center group-hover/btn:scale-110 transition-transform md:order-1">
                <CheckSquare size={22} />
              </div>
            </button>
            <button onClick={() => handleCreateOption('voice')} className="group/btn flex items-center gap-3 animate-in slide-in-from-bottom-2 md:slide-in-from-left-2 duration-200" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
              <span className="text-xs md:text-sm font-bold bg-background border border-border/50 shadow-lg px-3.5 py-2.5 rounded-xl text-foreground md:order-2 group-hover/btn:bg-muted transition-colors">Suara</span>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-rose-500 rounded-full text-white shadow-xl flex items-center justify-center group-hover/btn:scale-110 transition-transform md:order-1">
                <Mic size={22} />
              </div>
            </button>
            <button onClick={() => handleCreateOption('gallery')} className="group/btn flex items-center gap-3 animate-in slide-in-from-bottom-2 md:slide-in-from-left-2 duration-200" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
              <span className="text-xs md:text-sm font-bold bg-background border border-border/50 shadow-lg px-3.5 py-2.5 rounded-xl text-foreground md:order-2 group-hover/btn:bg-muted transition-colors">Galeri</span>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-500 rounded-full text-white shadow-xl flex items-center justify-center group-hover/btn:scale-110 transition-transform md:order-1">
                <ImageIcon size={22} />
              </div>
            </button>
            <button onClick={() => handleCreateOption('camera')} className="group/btn flex items-center gap-3 animate-in slide-in-from-bottom-2 md:slide-in-from-left-2 duration-200" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
              <span className="text-xs md:text-sm font-bold bg-background border border-border/50 shadow-lg px-3.5 py-2.5 rounded-xl text-foreground md:order-2 group-hover/btn:bg-muted transition-colors">Kamera</span>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-500 rounded-full text-white shadow-xl flex items-center justify-center group-hover/btn:scale-110 transition-transform md:order-1">
                <Camera size={22} />
              </div>
            </button>
            <button onClick={() => handleCreateOption('text')} className="group/btn flex items-center gap-3 animate-in slide-in-from-bottom-2 md:slide-in-from-left-2 duration-200" style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}>
              <span className="text-xs md:text-sm font-bold bg-background border border-border/50 shadow-lg px-3.5 py-2.5 rounded-xl text-foreground md:order-2 group-hover/btn:bg-muted transition-colors">Catatan Teks</span>
              <div className="w-12 h-12 md:w-14 md:h-14 bg-primary rounded-full text-white shadow-xl flex items-center justify-center group-hover/btn:scale-110 transition-transform md:order-1">
                <Type size={22} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* STRUKTUR NAVIGASI UTAMA */}
      <nav className="fixed z-50 group transition-all duration-300 border-border bg-background/80 backdrop-blur-xl bottom-0 left-0 w-full h-16 border-t md:top-0 md:h-screen md:w-20 hover:md:w-64 md:border-t-0 md:border-r print:hidden">
        <div className="flex w-full h-full md:flex-col md:p-4 overflow-hidden relative z-10">
          
          {/* Brand Logo - Hanya Muncul di Desktop */}
          <div className="hidden md:flex items-center justify-center group-hover:md:justify-start h-16 mb-6 group-hover:md:px-4 transition-all duration-300">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center text-white shadow-lg">
                <Sparkles size={18} />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-500 hidden group-hover:md:block tracking-tight animate-in fade-in duration-300 whitespace-nowrap">
                Nexa
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex w-full justify-evenly items-center h-full md:flex-col md:justify-start md:gap-3 md:flex-1 md:w-full">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              if (item.isMain) {
                return (
                  <div key="create-btn" className={cn("flex justify-center items-center relative md:w-full", item.orderClass)}>
                    <button
                      onClick={() => setIsOpen(!isOpen)}
                      className={cn(
                        "flex items-center justify-center shrink-0 w-12 h-12 md:w-12 md:h-12 group-hover:md:w-full group-hover:md:justify-start group-hover:md:px-4 group-hover:md:rounded-xl rounded-full shadow-lg transition-all duration-300 z-50 relative",
                        isOpen ? "bg-primary text-primary-foreground rotate-[135deg] shadow-primary/30" : "bg-foreground text-background hover:scale-105 md:hover:scale-100 md:hover:bg-foreground/90"
                      )}
                    >
                      <Icon size={24} className={cn("transition-transform shrink-0 duration-300", isOpen && "rotate-45")} />
                      <span className="hidden group-hover:md:block ml-3 font-bold animate-in fade-in duration-300 whitespace-nowrap">Buat Baru</span>
                    </button>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex flex-col md:flex-row items-center justify-center md:justify-start px-4 md:px-3 py-2 w-full transition-all duration-200 rounded-xl group/link relative overflow-hidden",
                    isActive ? "text-primary md:bg-primary/10" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    item.orderClass
                  )}
                >
                  <Icon size={22} className={cn("shrink-0 mb-1 md:mb-0 transition-transform duration-200 group-hover/link:scale-110", isActive && "fill-primary/20", "group-hover:md:mr-3")} />
                  <span className={cn(
                    "text-[10px] md:text-sm font-bold transition-colors animate-in fade-in duration-300 whitespace-nowrap",
                    "md:hidden group-hover:md:block" // Sembunyikan text di tablet, tampilkan jika di hover
                  )}>
                    {item.label}
                  </span>
                  
                  {/* Indikator Aktif (Desktop) */}
                  {isActive && (
                    <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-1/2 bg-primary rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </div>

        </div>
      </nav>
    </>
  );
}