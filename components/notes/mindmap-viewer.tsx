"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { Network, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MindMapViewerProps {
  code: string;
  onClose: () => void;
}

export function MindMapViewer({ code, onClose }: MindMapViewerProps) {
  const { theme } = useTheme();
  const mindMapRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  useEffect(() => {
    if (code && mindMapRef.current) {
      try {
        mermaid.initialize({ 
          startOnLoad: false, 
          theme: theme === 'dark' ? 'dark' : 'default',
          securityLevel: 'loose' 
        });
        
        mindMapRef.current.innerHTML = '';
        
        mermaid.render('mermaid-mindmap-svg', code).then((result) => {
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
               <p class="text-xs">AI memberikan struktur diagram yang tidak valid. Silakan coba generate ulang.</p>
             </div>
           `;
        }
      }
    }
  }, [code, theme]);

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md flex flex-col animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
            <Network className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">Peta Konsep (Mind Map)</h3>
            <p className="text-[11px] text-muted-foreground">Di-generate otomatis oleh Nexa AI</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center w-full h-full relative">
        
        <div className="absolute bottom-6 right-6 z-50 flex gap-2 bg-background/80 backdrop-blur-md p-1.5 rounded-2xl border border-border shadow-lg">
          <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.4))} className="rounded-xl hover:bg-muted">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setZoomLevel(1)} className="rounded-xl hover:bg-muted font-bold text-xs w-10">
            {Math.round(zoomLevel * 100)}%
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 3))} className="rounded-xl hover:bg-muted">
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        <div className="w-full h-full flex items-center justify-center min-h-[500px] min-w-[500px]">
          <div 
            ref={mindMapRef} 
            className="transition-transform duration-200 ease-out origin-center"
            style={{ transform: `scale(${zoomLevel})` }}
          />
        </div>
      </div>
    </div>
  );
}