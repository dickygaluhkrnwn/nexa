"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Trash2, Search, FileText, 
  LockKeyhole, KeyRound, LayoutGrid, List, 
  ArrowDownAZ, ArrowDownZA, Clock, ArrowUpCircle, Filter, Pin, MoreVertical, Network
} from "lucide-react";
import { useEffect, useState } from "react";
import { getUserNotes, deleteNote, updateNote, NoteData } from "@/lib/notes-service";
import { getUserProfile } from "@/lib/user-service";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal"; 
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"; 

type ExtNoteData = NoteData & { id: string; isHidden?: boolean; isPinned?: boolean };

export default function NotesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { showAlert, showConfirm } = useModal(); 
  const [notes, setNotes] = useState<ExtNoteData[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  
  // State Pencarian, Tampilan & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az" | "za">("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // State Fitur Brankas
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [correctPin, setCorrectPin] = useState<string | null>(null);

  // State Options Menu (Muncul saat card ditahan)
  const [activeNoteOptions, setActiveNoteOptions] = useState<ExtNoteData | null>(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [notesData, profileData] = await Promise.all([
        getUserNotes(user.uid),
        getUserProfile(user.uid)
      ]);
      setNotes(notesData as ExtNoteData[]);
      
      if (profileData?.pinCode) {
        setCorrectPin(profileData.pinCode);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    } else if (!authLoading) {
      setLoadingNotes(false);
    }
  }, [user, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDelete = (id: string) => {
    showConfirm(
      "Hapus Catatan?", 
      "Apakah kamu yakin ingin menghapus catatan ini? Tindakan ini tidak dapat dibatalkan.", 
      async () => {
        await deleteNote(id);
        fetchData(); 
      }
    );
  };

  const handleTogglePin = async (id: string, currentPinStatus: boolean | undefined) => {
    const newStatus = !currentPinStatus;
    
    // Optimistic Update
    setNotes(notes.map(n => n.id === id ? { ...n, isPinned: newStatus } : n));
    
    try {
      await updateNote(id, { isPinned: newStatus } as any);
    } catch (error) {
      console.error("Gagal mengubah status pin:", error);
      showAlert("Gagal", "Terjadi kesalahan saat menyematkan catatan.");
      setNotes(notes.map(n => n.id === id ? { ...n, isPinned: currentPinStatus } : n));
    }
  };

  const handleUnlockVault = () => {
    if (!correctPin) {
      showAlert("PIN Belum Diatur", "Kamu belum mengatur PIN Brankas. Silakan atur terlebih dahulu di halaman Profil!");
      setShowPinModal(false);
      return;
    }
    if (pinInput === correctPin) {
      setIsVaultOpen(true);
      setShowPinModal(false);
      setPinInput("");
      setSelectedTag(null);
    } else {
      showAlert("Akses Ditolak", "PIN yang kamu masukkan salah!");
      setPinInput("");
    }
  };

  // --- LOGIKA DRAG AND DROP ---
  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const isPinnedTarget = destination.droppableId === 'pinned';
    
    // Optimistic Update di UI lokal
    setNotes(notes.map(n => n.id === draggableId ? { ...n, isPinned: isPinnedTarget } : n));

    try {
      await updateNote(draggableId, { isPinned: isPinnedTarget } as any);
    } catch (error) {
      showAlert("Gagal", "Gagal memindahkan catatan.");
      fetchData(); // Rollback jika gagal
    }
  };

  // Event Context Menu (Tahan di HP / Klik Kanan di PC)
  const handleContextMenu = (e: React.MouseEvent, note: ExtNoteData) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveNoteOptions(note);
  };

  if (authLoading || loadingNotes) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Silakan login untuk melihat catatan.</p>
        <Button asChild><Link href="/">Kembali ke Home</Link></Button>
      </div>
    );
  }

  // 1. Ekstrak Semua Tag Unik untuk Ruang Saat Ini (PERBAIKAN: Filter out isTodo)
  const availableNotes = notes.filter(n => !n.isTodo && (isVaultOpen ? n.isHidden : !n.isHidden));
  const allTags = Array.from(new Set(availableNotes.flatMap(n => n.tags || [])));

  // 2. Logika Pemrosesan (Filter -> Search -> Sort)
  let displayedNotes = [...availableNotes].filter(note => {
    if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) return false;
    
    const query = searchQuery.toLowerCase();
    const titleMatch = note.title?.toLowerCase().includes(query);
    const contentMatch = note.content?.toLowerCase().includes(query);
    const tagsMatch = note.tags?.some(tag => tag.toLowerCase().includes(query));
    
    return titleMatch || contentMatch || tagsMatch;
  });

  const applySort = (arr: any[]) => {
    let sorted = [...arr];
    if (sortBy === "oldest") {
      sorted.reverse();
    } else if (sortBy === "az") {
      sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (sortBy === "za") {
      sorted.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    }
    return sorted;
  };

  // Pisahkan untuk Drag & Drop Zones
  let pinnedNotes = applySort(displayedNotes.filter(n => n.isPinned));
  let unpinnedNotes = applySort(displayedNotes.filter(n => !n.isPinned));

  // Fungsi Helper untuk Merender Card Catatan (Draggable)
  const renderNoteCard = (note: ExtNoteData, index: number) => (
    <Draggable key={note.id} draggableId={note.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            opacity: snapshot.isDragging ? 0.9 : 1,
            transform: snapshot.isDragging ? `${provided.draggableProps.style?.transform} scale(1.02)` : provided.draggableProps.style?.transform
          }}
          className={`relative group bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 pointer-events-auto select-none ${
            note.isPinned ? 'border-primary/50 shadow-sm' : (isVaultOpen ? 'border-purple-500/30 hover:border-purple-500/50' : 'border-border hover:border-primary/30')
          }`}
          onClick={() => router.push(`/edit/${note.id}`)}
          onContextMenu={(e) => handleContextMenu(e, note)}
        >
          <div className="block w-full h-full cursor-pointer p-4">
            <div className="flex items-start justify-between gap-2">
              <h4 className={`font-bold text-foreground mb-1 flex items-start gap-2 line-clamp-2 ${viewMode === 'grid' ? 'text-sm' : 'text-base'}`}>
                {isVaultOpen && <LockKeyhole className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-1" />}
                {note.title || "Tanpa Judul"}
              </h4>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveNoteOptions(note); }}
                className="p-1.5 -mr-2 -mt-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors shrink-0"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {note.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-md font-medium truncate max-w-full">
                    #{tag}
                  </span>
                ))}
                {note.tags.length > 3 && (
                  <span className="px-1 py-0.5 text-muted-foreground text-[10px] font-medium">
                    +{note.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );

  return (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500">
      
      {/* Header Halaman */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${isVaultOpen ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}>
            {isVaultOpen ? <LockKeyhole className="w-6 h-6 text-purple-500" /> : <FileText className="w-6 h-6 text-blue-500" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{isVaultOpen ? "Brankas Rahasia" : "Semua Catatan"}</h1>
            <p className="text-sm text-muted-foreground">
              {displayedNotes.length} catatan {selectedTag ? `berlabel #${selectedTag}` : "ditemukan"}
            </p>
          </div>
        </div>
        
        <Button 
          variant={isVaultOpen ? "destructive" : "outline"} 
          size="icon" 
          className={`rounded-full shadow-sm transition-colors ${isVaultOpen ? "bg-purple-600 hover:bg-purple-700 text-white border-transparent" : ""}`}
          onClick={() => {
            if (isVaultOpen) {
              setIsVaultOpen(false);
              setSelectedTag(null);
            } else {
              setShowPinModal(true);
            }
          }}
        >
          {isVaultOpen ? <LockKeyhole className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
        </Button>
      </div>

      {/* Toolbar Premium: Search, Filter, Sort, View Mode */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
            />
          </div>
          
          <div className="relative">
            <Button 
              variant={sortBy !== "newest" ? "default" : "outline"}
              size="icon" 
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="rounded-xl shrink-0 transition-colors"
            >
              <Filter className="w-4 h-4" />
            </Button>
            
            {showSortMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)}></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg z-50 p-1 animate-in fade-in slide-in-from-top-2">
                  <p className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">Urutkan</p>
                  <button onClick={() => { setSortBy("newest"); setShowSortMenu(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted ${sortBy === 'newest' ? 'bg-primary/10 text-primary font-medium' : ''}`}>
                    <Clock className="w-4 h-4" /> Terbaru
                  </button>
                  <button onClick={() => { setSortBy("oldest"); setShowSortMenu(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted ${sortBy === 'oldest' ? 'bg-primary/10 text-primary font-medium' : ''}`}>
                    <ArrowUpCircle className="w-4 h-4" /> Terlama
                  </button>
                  <button onClick={() => { setSortBy("az"); setShowSortMenu(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted ${sortBy === 'az' ? 'bg-primary/10 text-primary font-medium' : ''}`}>
                    <ArrowDownAZ className="w-4 h-4" /> Judul (A - Z)
                  </button>
                  <button onClick={() => { setSortBy("za"); setShowSortMenu(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted ${sortBy === 'za' ? 'bg-primary/10 text-primary font-medium' : ''}`}>
                    <ArrowDownZA className="w-4 h-4" /> Judul (Z - A)
                  </button>
                </div>
              </>
            )}
          </div>

          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="rounded-xl shrink-0 bg-card"
          >
            {viewMode === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </Button>

          {/* TAMBAHAN: Tombol Navigasi ke Graph */}
          <Button 
            asChild
            variant="outline" 
            size="icon" 
            className="rounded-xl shrink-0 bg-card text-rose-500 border-border hover:bg-rose-500/10 hover:border-rose-500/30 transition-all shadow-sm"
          >
            <Link href="/network" title="Lihat Knowledge Graph">
              <Network className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x">
            <button
              onClick={() => setSelectedTag(null)}
              className={`snap-start whitespace-nowrap px-4 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                selectedTag === null ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              Semua
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`snap-start whitespace-nowrap px-4 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  selectedTag === tag ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Daftar Catatan (Drag & Drop) */}
      {displayedNotes.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl bg-muted/20 flex flex-col items-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground mb-6">
            {searchQuery || selectedTag 
              ? "Tidak ada catatan yang cocok dengan filter ini." 
              : isVaultOpen 
                ? "Brankas kamu masih kosong." 
                : "Belum ada catatan publik."}
          </p>
          <Button asChild variant="default" className="rounded-full shadow-md">
            <Link href="/create">Tulis Catatan Baru</Link>
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="space-y-6">
            
            {/* AREA CATATAN DISEMATKAN */}
            {pinnedNotes.length > 0 && (
              <Droppable droppableId="pinned">
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps} 
                    className={`transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-primary/5 p-3 -mx-3 rounded-2xl' : ''}`}
                  >
                    <h2 className="text-sm font-bold text-primary flex items-center gap-2 mb-3"><Pin className="w-4 h-4 fill-primary" /> Disematkan ({pinnedNotes.length})</h2>
                    <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
                      {pinnedNotes.map((note, index) => renderNoteCard(note, index))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            )}

            {/* AREA CATATAN LAINNYA */}
            <Droppable droppableId="unpinned">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps} 
                  className={`transition-all duration-200 ${snapshot.isDraggingOver ? 'bg-muted/30 p-3 -mx-3 rounded-2xl' : ''}`}
                >
                  {pinnedNotes.length > 0 && <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2 mb-3 mt-2">Catatan Lainnya</h2>}
                  <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
                    {unpinnedNotes.map((note, index) => renderNoteCard(note, index))}
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

          </div>
        </DragDropContext>
      )}

      {/* --- OVERLAY MENU OPSI CATATAN (Muncul saat ditahan / klik titik 3) --- */}
      {activeNoteOptions && (
        <>
          <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm" onClick={() => setActiveNoteOptions(null)}></div>
          <div className="fixed inset-x-0 bottom-0 z-[110] p-4 flex justify-center animate-in slide-in-from-bottom-8 duration-300 pointer-events-none">
            <div className="bg-card border border-border w-full max-w-sm rounded-[2rem] p-5 shadow-2xl pointer-events-auto">
              <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-5" />
              <h3 className="font-bold text-lg mb-4 text-center truncate px-2">{activeNoteOptions.title || "Tanpa Judul"}</h3>
              
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className={`w-full justify-start h-14 rounded-xl text-base ${activeNoteOptions.isPinned ? "bg-primary/10 text-primary border-primary/30" : ""}`}
                  onClick={() => {
                    handleTogglePin(activeNoteOptions.id, activeNoteOptions.isPinned);
                    setActiveNoteOptions(null);
                  }}
                >
                  <Pin className={`w-5 h-5 mr-3 ${activeNoteOptions.isPinned ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                  {activeNoteOptions.isPinned ? "Lepaskan Sematan" : "Sematkan Catatan"}
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start h-14 rounded-xl text-base text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
                  onClick={() => {
                    setActiveNoteOptions(null);
                    handleDelete(activeNoteOptions.id);
                  }}
                >
                  <Trash2 className="w-5 h-5 mr-3" />
                  Hapus Catatan
                </Button>

                <Button 
                  variant="secondary" 
                  className="w-full h-14 rounded-xl text-base mt-2 font-bold"
                  onClick={() => setActiveNoteOptions(null)}
                >
                  Batal
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Input PIN untuk Brankas */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 text-center">
            <LockKeyhole className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h3 className="font-bold text-xl mb-1">Akses Brankas</h3>
            <p className="text-sm text-muted-foreground mb-6">Masukkan 4 digit PIN kamu</p>
            
            <input 
              type="password" 
              maxLength={4} 
              autoFocus 
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))} 
              className="w-full bg-background px-4 py-3 text-center tracking-[1em] text-2xl font-bold rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 mb-6 border border-border shadow-inner" 
            />
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => { setShowPinModal(false); setPinInput(""); }}>Batal</Button>
              <Button className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md h-11" onClick={handleUnlockVault} disabled={pinInput.length !== 4}>Buka</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}