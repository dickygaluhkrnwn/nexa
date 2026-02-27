"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Home, FileText, Plus, CheckSquare, User, Camera, Image as ImageIcon, Mic, Type } from "lucide-react";
import { cn } from "@/lib/utils"; // utility dari shadcn

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: FileText, label: "Notes", href: "/notes" },
    { icon: Plus, label: "Create", href: "#", isMain: true },
    { icon: CheckSquare, label: "To-Do", href: "/todo" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  const handleCreateOption = (mode: string) => {
    setIsOpen(false);
    // Redirect dengan URL parameter pintar
    router.push(mode === 'text' ? '/create' : `/create?mode=${mode}`);
  };

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border md:hidden">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          // Desain spesial untuk tombol Create (tengah)
          if (item.isMain) {
            return (
              <div key="create-btn" className="flex justify-center items-center relative">
                {isOpen && (
                  <>
                    {/* Backdrop untuk menutup menu */}
                    <div 
                      className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 animate-in fade-in duration-200" 
                      onClick={() => setIsOpen(false)} 
                    />
                    
                    {/* Floating Menu Options */}
                    <div className="absolute bottom-16 mb-4 flex flex-col items-end gap-4 z-50">
                      <button onClick={() => handleCreateOption('voice')} className="group flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200" style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}>
                        <span className="text-xs font-semibold bg-background border border-border shadow-md px-3 py-1.5 rounded-xl text-foreground">Suara</span>
                        <div className="w-12 h-12 bg-rose-500 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
                          <Mic size={20} />
                        </div>
                      </button>
                      <button onClick={() => handleCreateOption('gallery')} className="group flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200" style={{ animationDelay: '100ms', animationFillMode: 'backwards' }}>
                        <span className="text-xs font-semibold bg-background border border-border shadow-md px-3 py-1.5 rounded-xl text-foreground">Galeri</span>
                        <div className="w-12 h-12 bg-indigo-500 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
                          <ImageIcon size={20} />
                        </div>
                      </button>
                      <button onClick={() => handleCreateOption('camera')} className="group flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200" style={{ animationDelay: '50ms', animationFillMode: 'backwards' }}>
                        <span className="text-xs font-semibold bg-background border border-border shadow-md px-3 py-1.5 rounded-xl text-foreground">Kamera</span>
                        <div className="w-12 h-12 bg-blue-500 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
                          <Camera size={20} />
                        </div>
                      </button>
                      <button onClick={() => handleCreateOption('text')} className="group flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200" style={{ animationDelay: '0ms', animationFillMode: 'backwards' }}>
                        <span className="text-xs font-semibold bg-background border border-border shadow-md px-3 py-1.5 rounded-xl text-foreground">Teks Biasa</span>
                        <div className="w-12 h-12 bg-primary rounded-full text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform">
                          <Type size={20} />
                        </div>
                      </button>
                    </div>
                  </>
                )}

                <button
                  onClick={() => setIsOpen(!isOpen)}
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full shadow-xl transition-all duration-300 z-50",
                    isOpen ? "bg-muted-foreground text-background rotate-[135deg]" : "bg-gradient-to-tr from-primary to-purple-600 text-white hover:scale-105"
                  )}
                >
                  <Icon size={24} />
                </button>
              </div>
            );
          }

          // Desain untuk menu lainnya
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}