"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { Network, X, ZoomIn, ZoomOut, Move, ChevronLeft, ChevronRight, History, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MindMapViewerProps {
  history: string[]; 
  onClose: () => void;
}

export function MindMapViewer({ history, onClose }: MindMapViewerProps) {
  const { theme } = useTheme();
  const mindMapRef = useRef<HTMLDivElement>(null);
  
  const [currentIndex, setCurrentIndex] = useState(0); 

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
          securityLevel: 'loose',
          fontFamily: 'inherit'
        });
        
        mindMapRef.current.innerHTML = '';
        
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
             <div class="text-center text-destructive p-4 border border-destructive/20 rounded-xl bg-destructive/10 max-w-sm">
               <p class="font-bold mb-1">Gagal Merender Peta</p>
               <p class="text-xs">Struktur diagram pada versi ini rusak atau tidak valid.</p>
             </div>
           `;
        }
      }
    }
  }, [currentCode, theme]); 

  useEffect(() => {
    setZoomLevel(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

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

  const handleMouseUp = () => setIsDragging(false);

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
    if (currentIndex < history.length - 1) setCurrentIndex(prev => prev + 1); 
  };

  const handleNextVersion = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1); 
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
      
      {/* Header Modal Professional */}
      <div className="flex items-center justify-between p-4 px-6 border-b border-border shadow-sm bg-card z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
            <Network className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">Canvas Peta Konsep</h3>
            <p className="text-[10px] text-muted-foreground font-medium">Geser untuk melihat, scroll untuk zoom</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* History Nav Desktop */}
          {history.length > 1 && (
            <div className="hidden md:flex items-center gap-2 bg-muted/50 px-2 py-1 rounded-lg border border-border">
              <Button variant="ghost" size="icon" className="w-7 h-7 rounded-md hover:bg-background" onClick={handlePrevVersion} disabled={currentIndex === history.length - 1} title="Mundur">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1.5 px-2 text-xs font-semibold">
                <History className="w-3.5 h-3.5 text-muted-foreground" /> V{history.length - currentIndex}
              </div>
              <Button variant="ghost" size="icon" className="w-7 h-7 rounded-md hover:bg-background" onClick={handleNextVersion} disabled={currentIndex === 0} title="Maju">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="w-px h-6 bg-border hidden md:block" />
          
          <Button variant="ghost" size="icon" className="rounded-md hover:bg-destructive/10 hover:text-destructive w-9 h-9" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* History Nav Mobile */}
      {history.length > 1 && (
        <div className="md:hidden absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card/90 backdrop-blur-md px-2 py-1.5 rounded-full border border-border shadow-lg">
          <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={handlePrevVersion} disabled={currentIndex === history.length - 1}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs font-bold px-2 whitespace-nowrap">V{history.length - currentIndex}</span>
          <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={handleNextVersion} disabled={currentIndex === 0}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      {/* AREA KANVAS INFINITE (Mirip Miro / FigJam) */}
      <div 
        className="flex-1 overflow-hidden w-full h-full relative cursor-grab active:cursor-grabbing bg-[#f8f9fa] dark:bg-[#0f0f11]"
        style={{
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 0)',
          backgroundSize: '24px 24px'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        
        {/* Floating Zoom Controls */}
        <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-50 flex gap-1 bg-card/95 backdrop-blur-xl p-1.5 rounded-xl border border-border shadow-xl">
          <Button variant="ghost" size="icon" onClick={handleResetView} className="w-9 h-9 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" title="Pusatkan">
            <Move className="w-4 h-4" />
          </Button>
          <div className="w-px h-5 bg-border mx-1 self-center" />
          <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.4))} className="w-9 h-9 rounded-lg hover:bg-muted text-muted-foreground">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="flex items-center justify-center w-12 text-[11px] font-bold text-foreground">
            {Math.round(zoomLevel * 100)}%
          </div>
          <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))} className="w-9 h-9 rounded-lg hover:bg-muted text-muted-foreground">
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Mapped SVG Content */}
        <div className="w-full h-full flex items-center justify-center pointer-events-none">
          <div 
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px) scale(${zoomLevel})`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out'
            }}
            className="origin-center pointer-events-auto"
          >
            <div ref={mindMapRef} className="min-h-[500px] min-w-[500px] flex items-center justify-center p-8 filter drop-shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}