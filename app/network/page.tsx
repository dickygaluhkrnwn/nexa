"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserNotesGraphData, GraphNodeData } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Network as NetworkIcon, ZoomIn, ZoomOut, Filter, Focus, Layers } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full w-full opacity-50">
      <NetworkIcon className="w-16 h-16 mb-4 animate-pulse text-primary" />
      <p className="text-sm font-bold tracking-widest uppercase animate-pulse">Menghubungkan Neuron...</p>
    </div>
  ),
});

interface GraphData {
  nodes: { id: string; name: string; val: number; color: string; group: string; tags: string[] }[];
  links: { source: string; target: string }[];
}

export default function NetworkGraphPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  const [filterMode, setFilterMode] = useState<"all" | "note" | "todo">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const graphRef = useRef<any>(null);
  const rawDataRef = useRef<GraphNodeData[]>([]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateDimensions();
    setTimeout(updateDimensions, 100);
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const processGraphData = useCallback((data: GraphNodeData[], filter: "all" | "note" | "todo") => {
    const nodes: any[] = [];
    const links: any[] = [];

    data.forEach((note) => {
      nodes.push({
        id: note.id,
        name: note.title || "Tanpa Judul",
        val: 1.5,
        group: "note",
        color: note.parentId ? "#06b6d4" : "#8b5cf6", 
        tags: note.tags || []
      });
    });

    data.forEach((note) => {
      if (note.links && Array.isArray(note.links)) {
        note.links.forEach(targetId => {
           if (nodes.some(n => n.id === targetId)) {
             if (!links.some(l => l.source === note.id && l.target === targetId)) {
               links.push({ source: note.id, target: targetId });
             }
           }
        });
      }
      if (note.parentId && nodes.some(n => n.id === note.parentId)) {
        if (!links.some(l => l.source === note.id && l.target === note.parentId)) {
          links.push({ source: note.id, target: note.parentId });
        }
      }
    });

    links.forEach((link) => {
      const targetNode = nodes.find((n) => n.id === link.target);
      if (targetNode) targetNode.val += 1.2; 
    });

    setGraphData({ nodes, links });
  }, []);

  useEffect(() => {
    const fetchGraph = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const data = await getUserNotesGraphData(user.uid);
        rawDataRef.current = data;
        processGraphData(data, filterMode);
      } catch (error) {
        console.error("Gagal memproses Graph:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGraph();
  }, [user, processGraphData]);

  useEffect(() => {
    if (rawDataRef.current.length > 0) {
      processGraphData(rawDataRef.current, filterMode);
    }
  }, [filterMode, processGraphData]);

  const handleNodeClick = (node: any) => {
    router.push(`/edit/${node.id}`);
  };

  const isDarkMode = theme === "dark";
  const backgroundColor = isDarkMode ? "hsl(var(--background))" : "hsl(var(--background))";
  const linkColor = isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)";

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background overflow-hidden relative">
      
      {/* Background Pattern untuk Kanvas */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-30 dark:opacity-20"
        style={{ backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />

      {/* HEADER OVERLAY (PREMIUM GLASSMORPHISM)
        Di desktop melayang di pojok kiri atas seperti panel Figma/Miro
      */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 pointer-events-none flex flex-col gap-3">
        
        {/* Main Info Panel */}
        <div className="pointer-events-auto bg-card/80 backdrop-blur-xl p-3 pr-6 rounded-2xl border border-border/60 shadow-xl flex items-center gap-4">
          <Button variant="secondary" size="icon" asChild className="rounded-xl h-10 w-10 shrink-0">
            <Link href="/notes"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div className="flex flex-col">
            <h1 className="text-base font-extrabold flex items-center gap-2 leading-none text-foreground">
              <NetworkIcon className="w-4 h-4 text-primary" /> Peta Pengetahuan
            </h1>
            <div className="flex items-center gap-2 mt-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {graphData.nodes.length} Catatan</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1"><Focus className="w-3 h-3" /> {graphData.links.length} Tautan</span>
            </div>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="relative pointer-events-auto w-max">
          <Button 
            variant="outline" 
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="rounded-xl shadow-lg bg-card/80 backdrop-blur-xl border-border/60 hover:bg-muted font-bold h-10 px-4"
          >
            <Filter className="w-4 h-4 mr-2" /> Tampilan: Semua
          </Button>

          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-40 cursor-default" onClick={() => setShowFilterMenu(false)}></div>
              <div className="absolute left-0 top-full mt-2 w-48 bg-card/95 backdrop-blur-xl border border-border/60 rounded-[1.25rem] shadow-2xl z-50 p-2 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-extrabold text-muted-foreground px-3 py-2 uppercase tracking-widest">Filter Graph</p>
                <button onClick={() => { setFilterMode("all"); setShowFilterMenu(false); }} className={cn("w-full text-left px-3 py-2.5 text-sm rounded-xl font-bold transition-colors", filterMode === 'all' ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted')}>
                  Semua Catatan
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Area Kanvas Graph */}
      <div ref={containerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative z-0">
        {!isLoading && dimensions.width > 0 && (
          <ForceGraph2D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor={(node: any) => node.color}
            backgroundColor="transparent" // Transparan agar pattern CSS di belakang terlihat
            
            // PENGATURAN GARIS (LINKS)
            linkColor={() => linkColor}
            linkWidth={1.5} 
            linkCurvature={0.2} 
            linkDirectionalArrowLength={5} 
            linkDirectionalArrowRelPos={1} 
            
            // EFEK PARTIKEL BERJALAN (Simulasi Data/Neuron)
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2.5}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleColor={() => isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)"}

            onNodeClick={handleNodeClick}
            nodeRelSize={6}
            
            // Render custom nama catatan agar selalu muncul tanpa perlu di-hover
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const size = Math.sqrt(node.val) * 4; 
              
              // 1. Gambar Lingkaran Node
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.color;
              ctx.fill();
              
              // Ring luar (stroke)
              ctx.strokeStyle = isDarkMode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";
              ctx.lineWidth = size * 0.25;
              ctx.stroke();

              // 2. Gambar Teks Label
              if (globalScale >= 1.2) {
                const label = node.name;
                const fontSize = 12 / globalScale;
                ctx.font = `600 ${fontSize}px var(--font-sans), sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.5); 
                
                ctx.fillStyle = isDarkMode ? "rgba(9, 9, 11, 0.85)" : "rgba(255, 255, 255, 0.85)";
                
                // Rounded Rectangle pseudo
                const rx = node.x - bckgDimensions[0] / 2;
                const ry = node.y + size + (3/globalScale);
                ctx.beginPath();
                ctx.roundRect ? ctx.roundRect(rx, ry, bckgDimensions[0], bckgDimensions[1], 4/globalScale) : ctx.fillRect(rx, ry, bckgDimensions[0], bckgDimensions[1]);
                ctx.fill();

                ctx.fillStyle = isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)";
                ctx.fillText(label, node.x, node.y + size + (5/globalScale));
              }
            }}
            nodeCanvasObjectMode={() => "replace"}
          />
        )}
      </div>

      {/* Floating Controls Overlay (Bawah Kanan) */}
      <div className="absolute bottom-24 md:bottom-8 right-4 md:right-8 z-10 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-card/80 backdrop-blur-xl border border-border/60 shadow-2xl rounded-2xl p-1.5 flex flex-col gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 400)}
            className="rounded-xl hover:bg-muted w-10 h-10"
            title="Perbesar"
          >
            <ZoomIn className="w-5 h-5 text-foreground" />
          </Button>
          <div className="w-6 h-px bg-border/50 self-center" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 400)}
            className="rounded-xl hover:bg-muted w-10 h-10"
            title="Perkecil"
          >
            <ZoomOut className="w-5 h-5 text-foreground" />
          </Button>
        </div>
        
        <Button 
          variant="default" 
          size="icon" 
          onClick={() => graphRef.current?.zoomToFit(400, 50)}
          className="rounded-2xl shadow-xl bg-primary hover:bg-primary/90 mt-2 w-12 h-12 border-0"
          title="Pusatkan Kanvas"
        >
          <Focus className="w-6 h-6 text-white" />
        </Button>
      </div>

    </div>
  );
}