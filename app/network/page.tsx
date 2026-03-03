"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserNotesGraphData, GraphNodeData } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Network as NetworkIcon, ZoomIn, ZoomOut, Filter } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import dynamic from "next/dynamic";

// Dynamic import untuk menghindari error SSR
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full w-full opacity-50">
      <NetworkIcon className="w-12 h-12 mb-4 animate-pulse text-primary" />
      <p className="text-sm font-medium animate-pulse">Menghubungkan neuron otak kedua...</p>
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
  
  // State untuk Filter
  const [filterMode, setFilterMode] = useState<"all" | "note" | "todo">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // State untuk ukuran kanvas
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const graphRef = useRef<any>(null);

  // Raw data dari Firestore untuk difilter ulang secara lokal
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

    // Filter Node berdasarkan Mode
    data.forEach((note) => {
      nodes.push({
        id: note.id,
        name: note.title || "Tanpa Judul",
        val: 1.5, // Nilai base radius
        group: "note",
        // FIX: Gunakan warna Hex standar karena Canvas tidak bisa membaca CSS Variable --primary
        // Beri warna berbeda: Ungu untuk Induk, Cyan untuk Sub-Catatan
        color: note.parentId ? "#06b6d4" : "#8b5cf6", 
        tags: note.tags || []
      });
    });

    // Ekstrak Links
    data.forEach((note) => {
      // 1. LINK DARI MENTIONS (Sistem Lama/Opsional)
      if (note.links && Array.isArray(note.links)) {
        note.links.forEach(targetId => {
           if (nodes.some(n => n.id === targetId)) {
             if (!links.some(l => l.source === note.id && l.target === targetId)) {
               links.push({ source: note.id, target: targetId });
             }
           }
        });
      }

      // 2. LINK DARI RELASI PARENT-CHILD (Sistem Baru)
      if (note.parentId && nodes.some(n => n.id === note.parentId)) {
        if (!links.some(l => l.source === note.id && l.target === note.parentId)) {
          links.push({ source: note.id, target: note.parentId });
        }
      }
    });

    // Perbesar node yang sering di-link (Hub / Parent yang punya banyak anak)
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
        // Menggunakan fungsi backend yang baru kita refactor agar lebih ringan
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

  // Efek ketika Filter diubah
  useEffect(() => {
    if (rawDataRef.current.length > 0) {
      processGraphData(rawDataRef.current, filterMode);
    }
  }, [filterMode, processGraphData]);

  const handleNodeClick = (node: any) => {
    // Karena kita memisahkan halaman edit-todo dan edit, idealnya kita tahu tipe catatannya.
    // Jika tidak ada info, default ke halaman edit catatan biasa.
    router.push(`/edit/${node.id}`);
  };

  const isDarkMode = theme === "dark";
  const backgroundColor = isDarkMode ? "hsl(var(--background))" : "hsl(var(--background))";
  const linkColor = isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background overflow-hidden relative">
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-start justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto bg-background/80 backdrop-blur-md p-2 pr-4 rounded-full border border-border shadow-sm">
          <Button variant="ghost" size="icon" asChild className="rounded-full h-8 w-8 hover:bg-muted">
            <Link href="/notes"><ArrowLeft className="w-4 h-4" /></Link>
          </Button>
          <div>
            <h1 className="text-sm font-bold flex items-center gap-1.5 leading-none">
              <NetworkIcon className="w-3.5 h-3.5 text-primary" /> Peta Semesta
            </h1>
            <p className="text-[10px] font-medium text-muted-foreground">
              {graphData.nodes.length} Catatan • {graphData.links.length} Tautan
            </p>
          </div>
        </div>

        {/* Filter Dropdown */}
        <div className="relative pointer-events-auto">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="rounded-full shadow-sm bg-background/80 backdrop-blur-md border-border hover:bg-muted"
          >
            <Filter className="w-4 h-4" />
          </Button>

          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowFilterMenu(false)}></div>
              <div className="absolute right-0 top-full mt-2 w-40 bg-card border border-border rounded-xl shadow-lg z-50 p-1.5 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-bold text-muted-foreground px-2 py-1.5 uppercase tracking-wider">Tampilan</p>
                <button onClick={() => { setFilterMode("all"); setShowFilterMenu(false); }} className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted font-medium transition-colors ${filterMode === 'all' ? 'bg-primary/10 text-primary' : 'text-foreground'}`}>
                  Semua Catatan
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Area Kanvas Graph */}
      <div ref={containerRef} className="flex-1 w-full h-full cursor-grab active:cursor-grabbing">
        {!isLoading && dimensions.width > 0 && (
          <ForceGraph2D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            nodeColor={(node: any) => node.color}
            backgroundColor={backgroundColor}
            
            // PENGATURAN GARIS (LINKS)
            linkColor={() => linkColor}
            linkWidth={1.5} 
            linkCurvature={0.2} 
            linkDirectionalArrowLength={4} 
            linkDirectionalArrowRelPos={1} 
            
            // EFEK PARTIKEL BERJALAN (Simulasi Data/Neuron)
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleColor={() => isDarkMode ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"}

            onNodeClick={handleNodeClick}
            nodeRelSize={6}
            
            // Render custom nama catatan agar selalu muncul tanpa perlu di-hover
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const size = Math.sqrt(node.val) * 4; // Ukuran lingkaran
              
              // 1. Gambar Lingkaran Node
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.color;
              ctx.fill();
              
              // Tambahkan ring luar (stroke) agar lebih estetik
              ctx.strokeStyle = isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
              ctx.lineWidth = size * 0.2;
              ctx.stroke();

              // 2. Gambar Teks Label
              // Teks hanya muncul jika zoom level mencukupi agar tidak semrawut
              if (globalScale >= 1.2) {
                const label = node.name;
                const fontSize = 12 / globalScale;
                ctx.font = `600 ${fontSize}px var(--font-sans), sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.4); 
                
                // Latar belakang teks transparan
                ctx.fillStyle = isDarkMode ? "rgba(9, 9, 11, 0.8)" : "rgba(255, 255, 255, 0.8)";
                // Kotak membulat (pseudo)
                ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + size + (2/globalScale), bckgDimensions[0], bckgDimensions[1]);

                // Warna Teks Utama
                ctx.fillStyle = isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)";
                ctx.fillText(label, node.x, node.y + size + (4/globalScale));
              }
            }}
            // Force rendering override agar label tidak terpotong z-index canvas
            nodeCanvasObjectMode={() => "replace"}
          />
        )}
      </div>

      {/* Floating Controls Overlay (Bawah Kanan) */}
      <div className="absolute bottom-20 md:bottom-8 right-4 md:right-8 z-10 flex flex-col gap-2 pointer-events-auto">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 400)}
          className="rounded-full shadow-lg bg-card/80 backdrop-blur-md border-border hover:bg-muted"
        >
          <ZoomIn className="w-5 h-5 text-foreground" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 400)}
          className="rounded-full shadow-lg bg-card/80 backdrop-blur-md border-border hover:bg-muted"
        >
          <ZoomOut className="w-5 h-5 text-foreground" />
        </Button>
        <Button 
          variant="default" 
          size="icon" 
          onClick={() => graphRef.current?.zoomToFit(400, 50)}
          className="rounded-full shadow-lg bg-primary hover:bg-primary/90 mt-1"
        >
          <NetworkIcon className="w-5 h-5 text-white" />
        </Button>
      </div>

    </div>
  );
}