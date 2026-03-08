"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Trash2, Search, FileText, 
  LockKeyhole, KeyRound, LayoutGrid, List, 
  ArrowDownAZ, ArrowDownZA, Clock, ArrowUpCircle, 
  Filter, Pin, MoreVertical, Network, 
  ChevronRight, ChevronDown, CornerDownRight,
  Edit3, X, FileEdit, Lock, ShieldCheck, Inbox
} from "lucide-react";
import { useEffect, useState, Suspense } from "react";
import { getUserNotes, deleteNote, updateNote, NoteData } from "@/lib/notes-service";
import { getUserProfile } from "@/lib/user-service";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useModal } from "@/hooks/use-modal"; 
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd"; 
import { cn } from "@/lib/utils";

type ExtNoteData = NoteData & { id: string; isHidden?: boolean; isPinned?: boolean; parentId?: string | null };
type TreeNodeData = ExtNoteData & { depth: number; hasChildren: boolean };

function NotesContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams(); 
  const { showAlert, showConfirm } = useModal(); 
  
  const [notes, setNotes] = useState<ExtNoteData[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  
  // State Pencarian, Tampilan & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az" | "za">("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [isDesktop, setIsDesktop] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [correctPin, setCorrectPin] = useState<string | null>(null);

  const [activeNoteOptions, setActiveNoteOptions] = useState<ExtNoteData | null>(null);

  useEffect(() => {
    const q = searchParams?.get("q") || "";
    setSearchQuery(q);
  }, [searchParams]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    handleResize(); 
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [notesData, profileData] = await Promise.all([
        getUserNotes(user.uid),
        getUserProfile(user.uid)
      ]);
      setNotes(notesData as ExtNoteData[]);
      if (profileData?.pinCode) setCorrectPin(profileData.pinCode);
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    } finally {
      setLoadingNotes(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
    else if (!authLoading) setLoadingNotes(false);
  }, [user, authLoading]);

  const handleDelete = (id: string) => {
    showConfirm(
      "Hapus Dokumen?", 
      "Dokumen ini akan dihapus secara permanen. Lanjutkan?", 
      async () => {
        await deleteNote(id);
        if (selectedNoteId === id) setSelectedNoteId(null);
        fetchData(); 
      }
    );
  };

  const handleTogglePin = async (id: string, currentPinStatus: boolean | undefined) => {
    const newStatus = !currentPinStatus;
    setNotes(notes.map(n => n.id === id ? { ...n, isPinned: newStatus } : n));
    try {
      await updateNote(id, { isPinned: newStatus } as any);
    } catch (error) {
      showAlert("Gagal", "Terjadi kesalahan saat menyematkan catatan.");
      setNotes(notes.map(n => n.id === id ? { ...n, isPinned: currentPinStatus } : n));
    }
  };

  const handleUnlockVault = () => {
    if (!correctPin) {
      showAlert("PIN Belum Diatur", "Silakan atur PIN Brankas terlebih dahulu di halaman Profil.");
      setShowPinModal(false);
      return;
    }
    if (pinInput === correctPin) {
      setIsVaultOpen(true);
      setShowPinModal(false);
      setPinInput("");
      setSelectedTag(null);
      setSelectedNoteId(null); 
    } else {
      showAlert("Akses Ditolak", "PIN yang dimasukkan salah.");
      setPinInput("");
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const isPinnedTarget = destination.droppableId === 'pinned';
    setNotes(notes.map(n => n.id === draggableId ? { ...n, isPinned: isPinnedTarget } : n));

    try {
      await updateNote(draggableId, { isPinned: isPinnedTarget } as any);
    } catch (error) {
      showAlert("Gagal", "Gagal memindahkan catatan.");
      fetchData(); 
    }
  };

  const handleContextMenu = (e: React.MouseEvent, note: ExtNoteData) => {
    e.preventDefault();
    e.stopPropagation();
    setActiveNoteOptions(note);
  };

  const toggleExpand = (id: string) => setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));

  const handleNoteClick = (id: string) => {
    if (isDesktop) setSelectedNoteId(id);
    else router.push(`/edit/${id}`);
  };

  if (authLoading || loadingNotes) {
    return <div className="flex justify-center items-center h-[calc(100vh-4rem)]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
        <p className="text-muted-foreground">Silakan login untuk mengakses workspace.</p>
        <Button asChild><Link href="/">Kembali ke Home</Link></Button>
      </div>
    );
  }

  const availableNotes = notes.filter(n => !n.isTodo && (isVaultOpen ? n.isHidden : !n.isHidden));
  const allTags = Array.from(new Set(availableNotes.flatMap(n => n.tags || [])));

  let displayedNotes = [...availableNotes].filter(note => {
    if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) return false;
    const query = searchQuery.toLowerCase();
    return (note.title?.toLowerCase().includes(query) || note.content?.toLowerCase().includes(query) || note.tags?.some(tag => tag.toLowerCase().includes(query)));
  });

  const applySort = (arr: ExtNoteData[]) => {
    let sorted = [...arr];
    if (sortBy === "oldest") sorted.reverse();
    else if (sortBy === "az") sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (sortBy === "za") sorted.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    return sorted;
  };

  const generateTreeList = (notesList: ExtNoteData[]): TreeNodeData[] => {
    const flatList: TreeNodeData[] = [];
    const roots = notesList.filter(n => !n.parentId || !notesList.some(parent => parent.id === n.parentId));

    const buildNode = (node: ExtNoteData, depth: number) => {
      const children = notesList.filter(n => n.parentId === node.id);
      const hasChildren = children.length > 0;
      flatList.push({ ...node, depth, hasChildren });

      const isExpanded = expandedNodes[node.id] || searchQuery.trim() !== "";
      if (hasChildren && isExpanded) {
        const sortedChildren = applySort(children);
        sortedChildren.forEach(child => buildNode(child, depth + 1));
      }
    };

    const sortedRoots = applySort(roots);
    sortedRoots.forEach(root => buildNode(root, 0));
    return flatList;
  };

  const pinnedNotes = applySort(displayedNotes.filter(n => n.isPinned));
  const unpinnedNotes = applySort(displayedNotes.filter(n => !n.isPinned));

  const treePinnedNotes = generateTreeList(pinnedNotes);
  const treeUnpinnedNotes = generateTreeList(unpinnedNotes);

  const selectedNoteData = notes.find(n => n.id === selectedNoteId);

  // Komponen Kartu Minimalis ala Sidebar Desktop
  const renderNoteCard = (note: TreeNodeData, index: number) => {
    const isSearching = searchQuery.trim() !== "";
    const isExpanded = expandedNodes[note.id] || isSearching;
    const isSelected = selectedNoteId === note.id && isDesktop;
    const plainText = note.content ? note.content.replace(/<[^>]*>?/gm, '').trim() : "";

    return (
      <Draggable key={note.id} draggableId={note.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            style={{
              ...provided.draggableProps.style,
              opacity: snapshot.isDragging ? 0.9 : 1,
              marginLeft: note.depth > 0 ? `${note.depth * (viewMode === 'grid' ? 1 : 1.25)}rem` : '0',
            }}
            className={cn(
              "group relative overflow-hidden transition-all duration-200 pointer-events-auto cursor-pointer select-none",
              viewMode === 'list' ? "py-2 px-3 mx-2 rounded-lg" : "p-3 border rounded-xl shadow-sm",
              isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted/60 bg-transparent text-foreground",
              viewMode === 'grid' && !isSelected ? "bg-card border-border" : "border-transparent",
              snapshot.isDragging && "shadow-lg scale-105 bg-background border border-border"
            )}
            onClick={() => handleNoteClick(note.id)}
            onContextMenu={(e) => handleContextMenu(e, note)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5 overflow-hidden flex-1">
                {note.hasChildren ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleExpand(note.id); }}
                    className="mt-0.5 p-0.5 rounded-md hover:bg-muted/80 text-muted-foreground transition-colors shrink-0"
                  >
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                ) : note.depth > 0 && viewMode === 'list' ? (
                  <CornerDownRight className="w-3 h-3 mt-1 text-muted-foreground/40 shrink-0 ml-1" />
                ) : (
                  <FileText className={cn("w-3.5 h-3.5 mt-0.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground/60")} />
                )}

                <div className="flex flex-col min-w-0 flex-1">
                  <h4 className={cn("font-medium truncate text-sm flex items-center gap-1.5", isSelected && "font-bold")}>
                    {isVaultOpen && <LockKeyhole className="w-3 h-3 text-purple-500 shrink-0" />}
                    {note.title || "Tanpa Judul"}
                  </h4>
                  {viewMode === 'list' && plainText && (
                    <p className={cn("text-[11px] truncate mt-0.5", isSelected ? "text-primary/70" : "text-muted-foreground")}>
                      {plainText}
                    </p>
                  )}
                </div>
              </div>

              <button 
                onClick={(e) => { e.stopPropagation(); setActiveNoteOptions(note); }}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md opacity-0 group-hover:opacity-100 lg:opacity-100 shrink-0"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen lg:h-[calc(100vh-64px)] w-full overflow-hidden bg-background">
      
      {/* =========================================
          LEFT PANE: SIDEBAR LIST (MASTER VIEW)
          ========================================= */}
      <div className={cn(
        "flex flex-col w-full lg:w-[320px] xl:w-[360px] h-full shrink-0 border-r border-border bg-[#fcfcfc] dark:bg-[#121212] transition-all",
        selectedNoteId ? "hidden lg:flex" : "flex"
      )}>
        
        {/* Header Sidebar Kiri */}
        <div className="px-4 py-4 shrink-0 flex flex-col gap-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md", isVaultOpen ? "bg-purple-500/10" : "bg-primary/10")}>
                {isVaultOpen ? <ShieldCheck className="w-4 h-4 text-purple-600" /> : <Inbox className="w-4 h-4 text-primary" />}
              </div>
              <h1 className="text-sm font-bold tracking-tight">
                {isVaultOpen ? "Brankas Rahasia" : "Semua Catatan"}
              </h1>
              <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full ml-1">
                {displayedNotes.length}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("w-7 h-7 rounded-md", isVaultOpen ? "text-purple-600 hover:bg-purple-600/10" : "text-muted-foreground hover:bg-muted")}
              onClick={() => {
                if (isVaultOpen) { setIsVaultOpen(false); setSelectedTag(null); setSelectedNoteId(null); } 
                else { setShowPinModal(true); }
              }}
              title={isVaultOpen ? "Tutup Brankas" : "Buka Brankas"}
            >
              {isVaultOpen ? <LockKeyhole className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </Button>
          </div>

          {/* Search Mobile (Hidden di Desktop karena ada Global Search di Header) */}
          <div className="relative lg:hidden">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-background border border-border rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all shadow-sm"
            />
          </div>

          {/* Quick Filters / Tags */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-hide snap-x">
              <button
                onClick={() => setSelectedTag(null)}
                className={cn(
                  "snap-start whitespace-nowrap px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-colors",
                  selectedTag === null ? "bg-primary/10 border-primary/20 text-primary" : "bg-background border-border text-muted-foreground hover:bg-muted"
                )}
              >
                Semua
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={cn(
                    "snap-start whitespace-nowrap px-2.5 py-1 text-[10px] font-semibold rounded-md border transition-colors",
                    selectedTag === tag ? "bg-primary/10 border-primary/20 text-primary" : "bg-background border-border text-muted-foreground hover:bg-muted"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Sort & View Toggles */}
            <div className="flex items-center gap-0.5 shrink-0">
              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => setShowSortMenu(!showSortMenu)} className="w-6 h-6 rounded text-muted-foreground hover:text-foreground">
                  <Filter className="w-3.5 h-3.5" />
                </Button>
                {showSortMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSortMenu(false)}></div>
                    <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border shadow-lg rounded-xl z-50 p-1 animate-in zoom-in-95">
                      <button onClick={() => { setSortBy("newest"); setShowSortMenu(false); }} className={cn("w-full text-left px-3 py-1.5 text-xs rounded-md", sortBy === 'newest' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted')}>Terbaru</button>
                      <button onClick={() => { setSortBy("oldest"); setShowSortMenu(false); }} className={cn("w-full text-left px-3 py-1.5 text-xs rounded-md", sortBy === 'oldest' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted')}>Terlama</button>
                      <button onClick={() => { setSortBy("az"); setShowSortMenu(false); }} className={cn("w-full text-left px-3 py-1.5 text-xs rounded-md", sortBy === 'az' ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted')}>A - Z</button>
                    </div>
                  </>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")} className="w-6 h-6 rounded text-muted-foreground hover:text-foreground lg:hidden">
                {viewMode === "grid" ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Note List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
          {displayedNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 opacity-60">
              <FileText className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Kosong</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery || selectedTag ? "Tidak ada yang cocok." : "Belum ada dokumen dibuat."}
              </p>
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex flex-col gap-4 pb-20 lg:pb-6">
                
                {treePinnedNotes.length > 0 && (
                  <Droppable droppableId="pinned">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-5 mb-1.5">Disematkan</h3>
                        <div className={cn("gap-1", isDesktop ? "flex flex-col" : (viewMode === "grid" ? "grid grid-cols-2 px-3" : "flex flex-col"))}>
                          {treePinnedNotes.map((note, index) => renderNoteCard(note, index))}
                        </div>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}

                {treeUnpinnedNotes.length > 0 && (
                  <Droppable droppableId="unpinned">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        {treePinnedNotes.length > 0 && <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-5 mb-1.5 mt-2">Lainnya</h3>}
                        <div className={cn("gap-1", isDesktop ? "flex flex-col" : (viewMode === "grid" ? "grid grid-cols-2 px-3" : "flex flex-col"))}>
                          {treeUnpinnedNotes.map((note, index) => renderNoteCard(note, index))}
                        </div>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                )}

              </div>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* =========================================
          RIGHT PANE: DETAIL / READING VIEW (DESKTOP)
          ========================================= */}
      <div className={cn(
        "hidden lg:flex flex-1 flex-col h-full bg-background relative",
        !selectedNoteId && "items-center justify-center bg-muted/10"
      )}>
        {!selectedNoteId ? (
          // Empty State Reading View
          <div className="flex flex-col items-center text-center max-w-sm animate-in zoom-in-95 duration-500 opacity-60">
            <div className="w-20 h-20 mb-6 rounded-2xl bg-card border border-border flex items-center justify-center shadow-sm">
              <FileEdit className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold tracking-tight mb-2 text-foreground">Pilih Dokumen</h2>
            <p className="text-muted-foreground text-sm">
              Klik salah satu catatan di bilah kiri untuk membacanya, atau buat dokumen baru untuk memulai.
            </p>
            <Button asChild className="mt-6 rounded-lg shadow-sm font-medium h-9">
              <Link href="/create"><Edit3 className="w-4 h-4 mr-2" /> Tulis Baru</Link>
            </Button>
          </div>
        ) : selectedNoteData ? (
          // Active Reading View
          <div className="flex flex-col h-full w-full animate-in fade-in duration-300">
            
            {/* Top Action Bar */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-border/30 bg-background/95 backdrop-blur-sm z-10 shrink-0">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="lg:hidden -ml-2" onClick={() => setSelectedNoteId(null)}>
                  <X className="w-5 h-5" />
                </Button>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <span className="hover:text-foreground cursor-pointer transition-colors" onClick={() => setSelectedNoteId(null)}>Workspace</span>
                  <ChevronRight className="w-3 h-3" />
                  <span className="text-foreground truncate max-w-[200px]">{selectedNoteData.title || "Tanpa Judul"}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn("h-8 rounded-md text-xs font-semibold", selectedNoteData.isPinned ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-muted")}
                  onClick={() => handleTogglePin(selectedNoteData.id, selectedNoteData.isPinned)}
                >
                  <Pin className={cn("w-3.5 h-3.5 mr-1.5", selectedNoteData.isPinned && "fill-primary")} />
                  {selectedNoteData.isPinned ? "Tersemat" : "Sematkan"}
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 rounded-md text-xs font-semibold text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(selectedNoteData.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
                <Button asChild className="h-8 rounded-md text-xs font-semibold ml-1 shadow-sm">
                  <Link href={`/edit/${selectedNoteData.id}`}><Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit Dokumen</Link>
                </Button>
              </div>
            </div>

            {/* Reading Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 md:px-16 py-10 lg:py-16">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-foreground leading-tight">
                  {selectedNoteData.title || "Tanpa Judul"}
                </h1>
                
                {selectedNoteData.tags && selectedNoteData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-10">
                    {selectedNoteData.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-1 bg-muted/60 text-muted-foreground text-xs font-semibold rounded-md border border-border/50">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Konten HTML dari Tiptap (Distraction Free Reading) */}
                <div 
                  className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none text-foreground/90 leading-relaxed marker:text-primary prose-headings:font-bold prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-p:mb-6 prose-ul:mb-6 prose-ol:mb-6 prose-li:my-1"
                  dangerouslySetInnerHTML={{ 
                    __html: selectedNoteData.content || '<p class="text-muted-foreground italic">Dokumen ini kosong. Klik Edit Dokumen untuk mulai menulis.</p>' 
                  }}
                />
              </div>
            </div>
            
          </div>
        ) : null}
      </div>

      {/* --- OVERLAY MENU OPSI CATATAN (MOBILE ONLY) --- */}
      {activeNoteOptions && (
        <>
          <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setActiveNoteOptions(null)}></div>
          <div className="fixed inset-x-0 bottom-0 z-[110] p-4 flex justify-center animate-in slide-in-from-bottom-8 duration-300 pointer-events-none lg:hidden">
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
                  <Trash2 className="w-5 h-5 mr-3" /> Hapus
                </Button>
                <Button variant="secondary" className="w-full h-14 rounded-xl text-base mt-2 font-bold" onClick={() => setActiveNoteOptions(null)}>
                  Batal
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal Input PIN untuk Brankas */}
      {showPinModal && (
        <div className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-card border border-border/50 p-8 rounded-[2rem] shadow-2xl w-full max-w-sm animate-in zoom-in-95 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500" />
            <LockKeyhole className="w-12 h-12 text-purple-500 mx-auto mb-5 drop-shadow-sm" />
            <h3 className="font-bold text-2xl mb-2">Akses Brankas</h3>
            <p className="text-sm text-muted-foreground mb-8">Masukkan 4 digit PIN keamananmu</p>
            
            <input 
              type="password" 
              maxLength={4} 
              autoFocus 
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value.replace(/[^0-9]/g, ''))} 
              className="w-full bg-muted/50 px-4 py-4 text-center tracking-[1em] text-3xl font-black rounded-2xl outline-none focus:ring-4 focus:ring-purple-500/20 mb-8 border border-transparent focus:border-purple-500/30 transition-all shadow-inner" 
            />
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={() => { setShowPinModal(false); setPinInput(""); }}>Batal</Button>
              <Button className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md h-12 font-bold transition-all" onClick={handleUnlockVault} disabled={pinInput.length !== 4}>Buka</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Wrapper Suspense: WAJIB untuk komponen Next.js (App Router) yang menggunakan useSearchParams
export default function NotesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <NotesContent />
    </Suspense>
  );
}