"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { Network, X, ZoomIn, ZoomOut, Move, ChevronLeft, ChevronRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MindMapViewerProps {
  history: string[]; // <-- SEKARANG MENERIMA ARRAY
  onClose: () => void;
}

export function MindMapViewer({ history, onClose }: MindMapViewerProps) {
  const { theme } = useTheme();
  const mindMapRef = useRef<HTMLDivElement>(null);
  
  // State navigasi riwayat
  const [currentIndex, setCurrentIndex] = useState(0); // 0 = versi terbaru

  // State untuk Fitur Pan & Zoom
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const currentCode = history[currentIndex];

  useEffect(() => {
    if (currentCode && mindMapRef.current) {
      try {
        mermaid.initialize({ 
          startOnLoad: false, 
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose' 
        });
        
        mindMapRef.current.innerHTML = '';
        
        // Render menggunakan ID yang unik agar Mermaid tidak bingung saat render ulang
        mermaid.render(`mermaid-mindmap-${Date.now()}`, currentCode).then((result) => {
          if (mindMapRef.current) {
            mindMapRef.current.innerHTML = result.svg;
          }
        }).catch((err) => {
          console.error("Mermaid async render error", err);
          throw err;
        });

      } catch (err) {
        console.error("Mermaid initialization error", err);
        if (mindMapRef.current) {
           mindMapRef.current.innerHTML = `
             <div class="text-center text-destructive p-4 border border-destructive/20 rounded-xl bg-destructive/10">
               <p class="font-bold mb-1">Gagal Merender Mind Map</p>
               <p class="text-xs">AI memberikan struktur diagram yang tidak valid pada versi ini.</p>
             </div>
           `;
        }
      }
    }
  }, [currentCode, theme]); // Render ulang saat versi atau tema berubah

  // Reset zoom & pan setiap kali ganti versi
  useEffect(() => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // --- LOGIKA MOUSE UNTUK DRAG & PAN ---
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // --- LOGIKA TOUCH UNTUK DRAG & PAN ---
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) { 
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX - position.x, y: e.touches[0].clientY - position.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.touches[0].clientX - dragStart.current.x,
      y: e.touches[0].clientY - dragStart.current.y
    });
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  };

  const handlePrevVersion = () => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(prev => prev + 1); // Mundur ke versi lebih lama (index lebih besar)
    }
  };

  const handleNextVersion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1); // Maju ke versi lebih baru (index lebih kecil)
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Modal */}
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30 select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
            <Network className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">Peta Konsep (Mind Map)</h3>
            <p className="text-[11px] text-muted-foreground">Klik dan tahan untuk menggeser kanvas</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* --- PANEL NAVIGASI RIWAYAT (Hanya tampil jika ada > 1 versi) --- */}
      {history.length > 1 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-card/90 backdrop-blur-xl px-2 py-1.5 rounded-full border border-border shadow-lg animate-in slide-in-from-top-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-full hover:bg-muted"
            onClick={handlePrevVersion}
            disabled={currentIndex === history.length - 1}
            title="Versi Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-1.5 px-2">
            <History className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-bold whitespace-nowrap">
              Versi {history.length - currentIndex} <span className="text-muted-foreground font-medium">/ {history.length}</span>
            </span>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-full hover:bg-muted"
            onClick={handleNextVersion}
            disabled={currentIndex === 0}
            title="Versi Lebih Baru"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          {currentIndex === 0 && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary border border-background"></span>
            </span>
          )}
        </div>
      )}
      
      {/* AREA KANVAS INFINITE */}
      <div 
        className="flex-1 overflow-hidden w-full h-full relative cursor-grab active:cursor-grabbing bg-grid-white/[0.02] bg-[length:30px_30px]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        
        {/* Kontrol Pan & Zoom Mengambang */}
        <div className="absolute bottom-6 right-6 z-50 flex gap-1.5 bg-background/90 backdrop-blur-xl p-1.5 rounded-2xl border border-border shadow-2xl">
          <Button variant="ghost" size="icon" onClick={handleResetView} className="rounded-xl hover:bg-primary/20 hover:text-primary transition-colors" title="Kembali ke Tengah">
            <Move className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1 self-center" />
          <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.4))} className="rounded-xl hover:bg-muted">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setZoomLevel(1)} className="rounded-xl hover:bg-muted font-bold text-xs w-12 text-primary">
            {Math.round(zoomLevel * 100)}%
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))} className="rounded-xl hover:bg-muted">
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* WADAH MINDMAP DENGAN TRANSLATE & SCALE */}
        <div className="w-full h-full flex items-center justify-center pointer-events-none">
          <div 
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)'
            }}
            className="origin-center pointer-events-auto"
          >
            <div 
              ref={mindMapRef} 
              className="min-h-[500px] min-w-[500px] flex items-center justify-center p-8 drop-shadow-sm" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}