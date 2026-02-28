"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes } from "@/lib/notes-service";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Network as NetworkIcon, ZoomIn, ZoomOut } from "lucide-react";
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
  nodes: { id: string; name: string; val: number; color: string; group: string }[];
  links: { source: string; target: string }[];
}

export default function NetworkGraphPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  // State untuk ukuran kanvas
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const graphRef = useRef<any>(null);

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
    // Tunggu sejenak agar DOM benar-benar siap
    setTimeout(updateDimensions, 100);
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  useEffect(() => {
    const fetchAndParseNotes = async () => {
      if (!user) return;
      try {
        const notes = await getUserNotes(user.uid);
        const nodes: any[] = [];
        const links: any[] = [];

        // 1. Ekstrak Node (Titik)
        notes.forEach((note: any) => {
          if (!note.isHidden) {
            nodes.push({
              id: note.id,
              name: note.title || "Tanpa Judul",
              val: 1.5, // Nilai base
              group: note.isTodo ? "todo" : "note",
              color: note.isTodo ? "#f97316" : "#8b5cf6", // Orange untuk Todo, Ungu untuk Note
            });
          }
        });

        // 2. Ekstrak Link (Garis Hubungan) menggunakan DOMParser (100% Akurat)
        notes.forEach((note: any) => {
          if (note.isHidden) return;
          
          const content = note.content || "";
          
          // Parsing HTML content menjadi DOM Document virtual
          const parser = new DOMParser();
          const doc = parser.parseFromString(content, 'text/html');
          
          // Cari semua elemen yang memiliki data-type="mention"
          const mentions = doc.querySelectorAll('[data-type="mention"]');
          
          mentions.forEach((mentionNode) => {
            const targetId = mentionNode.getAttribute('data-id');
            
            // Pastikan ID target ada dan node target juga tersedia di daftar kita
            if (targetId && nodes.some((n) => n.id === targetId)) {
              // Hindari duplikasi garis yang sama
              const linkExists = links.some(l => l.source === note.id && l.target === targetId);
              
              // Hindari menghubungkan catatan ke dirinya sendiri (Self-loop)
              if (!linkExists && note.id !== targetId) {
                links.push({
                  source: note.id,
                  target: targetId,
                });
              }
            }
          });
        });

        // 3. Perbesar node yang punya banyak hubungan (koneksi)
        links.forEach((link) => {
          const sourceNode = nodes.find((n) => n.id === link.source);
          const targetNode = nodes.find((n) => n.id === link.target);
          if (sourceNode) sourceNode.val += 0.8;
          if (targetNode) targetNode.val += 0.8;
        });

        setGraphData({ nodes, links });
      } catch (error) {
        console.error("Gagal memproses Graph:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndParseNotes();
  }, [user]);

  const handleNodeClick = (node: any) => {
    // Jika titik diklik, arahkan ke halaman edit
    router.push(node.group === "todo" ? `/edit-todo/${node.id}` : `/edit/${node.id}`);
  };

  const isDarkMode = theme === "dark";

  return (
    <div className="flex flex-col h-screen max-h-screen bg-background overflow-hidden relative">
      
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-background/90 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Button variant="outline" size="icon" asChild className="rounded-full shadow-md bg-card/80 backdrop-blur-sm border-border hover:bg-muted">
            <Link href="/notes"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2 drop-shadow-md">
              <NetworkIcon className="w-5 h-5 text-primary" /> Jejaring Ide
            </h1>
            <p className="text-[11px] font-medium text-muted-foreground drop-shadow-md">
              Visualisasi koneksi antarcatatan
            </p>
          </div>
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
            backgroundColor={isDarkMode ? "#09090b" : "#ffffff"} 
            
            // PENGATURAN GARIS (LINKS) & ARAH PANAH - DIPERTEGAS
            linkColor={() => isDarkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.4)"} // Garis lebih jelas
            linkWidth={2} // Garis ditebalkan
            linkCurvature={0.2} 
            linkDirectionalArrowLength={8} // Panah lebih besar
            linkDirectionalArrowRelPos={1} 
            
            // EFEK PARTIKEL BERJALAN
            linkDirectionalParticles={4} // Jumlah partikel ditambah
            linkDirectionalParticleWidth={2.5}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleColor={() => isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)"}

            onNodeClick={handleNodeClick}
            nodeRelSize={6}
            
            // Render custom nama catatan muncul saat di-zoom
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              const size = Math.sqrt(node.val) * 4;
              
              // Gambar Lingkaran
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.color;
              ctx.fill();

              // Gambar Teks Label hanya jika di-zoom cukup dekat
              if (globalScale >= 1.5) {
                const label = node.name;
                const fontSize = 12 / globalScale;
                ctx.font = `bold ${fontSize}px Sans-Serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                
                // Beri background tipis pada teks
                const textWidth = ctx.measureText(label).width;
                const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2); 
                ctx.fillStyle = isDarkMode ? "rgba(9, 9, 11, 0.7)" : "rgba(255, 255, 255, 0.7)";
                ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y + size + 1, bckgDimensions[0], bckgDimensions[1]);

                ctx.fillStyle = isDarkMode ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.9)";
                ctx.fillText(label, node.x, node.y + size + 2);
              }
            }}
          />
        )}
      </div>

      {/* Floating Controls Overlay */}
      <div className="absolute bottom-20 md:bottom-8 right-4 md:right-8 z-10 flex flex-col gap-2 pointer-events-auto">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => graphRef.current?.zoom(graphRef.current.zoom() * 1.5, 400)}
          className="rounded-xl shadow-lg bg-card/80 backdrop-blur border-border hover:bg-muted"
        >
          <ZoomIn className="w-5 h-5 text-foreground" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => graphRef.current?.zoom(graphRef.current.zoom() / 1.5, 400)}
          className="rounded-xl shadow-lg bg-card/80 backdrop-blur border-border hover:bg-muted"
        >
          <ZoomOut className="w-5 h-5 text-foreground" />
        </Button>
        <Button 
          variant="default" 
          size="icon" 
          onClick={() => graphRef.current?.zoomToFit(400, 50)}
          className="rounded-xl shadow-lg bg-primary hover:bg-primary/90"
        >
          <NetworkIcon className="w-5 h-5 text-white" />
        </Button>
      </div>

    </div>
  );
}