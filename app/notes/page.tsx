"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { 
  Loader2, Trash2, Search, FileText, 
  LockKeyhole, KeyRound, LayoutGrid, List, 
  ArrowDownAZ, ArrowDownZA, Clock, ArrowUpCircle, Filter,
  AlertCircle // Tambahan icon AlertCircle untuk Modal
} from "lucide-react";
import { useEffect, useState } from "react";
import { getUserNotes, deleteNote, NoteData } from "@/lib/notes-service";
import { getUserProfile } from "@/lib/user-service";
import Link from "next/link";

export default function NotesPage() {
  const { user, loading: authLoading } = useAuth();
  const [notes, setNotes] = useState<(NoteData & { id: string; isHidden?: boolean })[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  
  // State Pencarian, Tampilan & Filter Premium
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

  // --- STATE CUSTOM DIALOG MODAL ---
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "alert" | "confirm";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "alert"
  });

  const showAlert = (title: string, message: string) => {
    setDialog({ isOpen: true, title, message, type: "alert" });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setDialog({ isOpen: true, title, message, type: "confirm", onConfirm });
  };
  // ---------------------------------

  const fetchData = async () => {
    if (!user) return;
    try {
      const [notesData, profileData] = await Promise.all([
        getUserNotes(user.uid),
        getUserProfile(user.uid)
      ]);
      setNotes(notesData as (NoteData & { id: string; isHidden?: boolean })[]);
      
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
  }, [user, authLoading]);

  const handleDelete = (id: string) => {
    // Menggunakan Custom Confirm Modal
    showConfirm(
      "Hapus Catatan?", 
      "Apakah kamu yakin ingin menghapus catatan ini? Tindakan ini tidak dapat dibatalkan.", 
      async () => {
        await deleteNote(id);
        fetchData(); 
      }
    );
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
      setSelectedTag(null); // Reset tag filter saat ganti ruang
    } else {
      showAlert("Akses Ditolak", "PIN yang kamu masukkan salah!");
      setPinInput("");
    }
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

  // 1. Ekstrak Semua Tag Unik untuk Ruang Saat Ini (Publik / Brankas)
  const availableNotes = notes.filter(n => isVaultOpen ? n.isHidden : !n.isHidden);
  const allTags = Array.from(new Set(availableNotes.flatMap(n => n.tags || [])));

  // 2. Logika Pemrosesan (Filter -> Search -> Sort)
  let displayedNotes = [...availableNotes].filter(note => {
    // Filter Tag
    if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) return false;
    
    // Filter Pencarian Teks
    const query = searchQuery.toLowerCase();
    const titleMatch = note.title?.toLowerCase().includes(query);
    const contentMatch = note.content?.toLowerCase().includes(query);
    const tagsMatch = note.tags?.some(tag => tag.toLowerCase().includes(query));
    
    return titleMatch || contentMatch || tagsMatch;
  });

  // 3. Logika Pengurutan (Sorting)
  if (sortBy === "oldest") {
    displayedNotes.reverse(); // Asumsi default dari API adalah newest first
  } else if (sortBy === "az") {
    displayedNotes.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  } else if (sortBy === "za") {
    displayedNotes.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
  }

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
          {/* Search */}
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
          
          {/* Sort Dropdown Menu */}
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

          {/* Toggle View Mode */}
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="rounded-xl shrink-0 bg-card"
          >
            {viewMode === "grid" ? <List className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
          </Button>
        </div>

        {/* Filter Tags Horizontal (Pills) */}
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

      {/* Daftar Catatan */}
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
        <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "flex flex-col gap-3"}>
          {displayedNotes.map((note) => (
            <div 
              key={note.id} 
              className={`relative group bg-card border rounded-2xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300 ${isVaultOpen ? 'border-purple-500/30' : 'border-border'}`}
            >
              <Link href={`/edit/${note.id}`} className={`block w-full h-full ${viewMode === "list" ? "p-4 pr-14" : "p-4 pb-12"}`}>
                <h4 className={`font-bold text-foreground mb-1 flex items-center gap-2 line-clamp-2 ${viewMode === 'grid' ? 'text-sm' : 'text-base'}`}>
                  {isVaultOpen && <LockKeyhole className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                  {note.title || "Tanpa Judul"}
                </h4>
                
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
              </Link>
              
              {/* Tombol Hapus */}
              <Button 
                variant="ghost" 
                size="icon" 
                className={`absolute ${viewMode === 'list' ? 'top-1/2 -translate-y-1/2 right-2' : 'bottom-2 right-2'} h-9 w-9 text-muted-foreground hover:bg-destructive hover:text-white z-10 transition-colors rounded-xl`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDelete(note.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
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
              className="w-full bg-muted px-4 py-3 text-center tracking-[1em] text-2xl font-bold rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 mb-6" 
            />
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl" 
                onClick={() => {
                  setShowPinModal(false); 
                  setPinInput("");
                }}
              >
                Batal
              </Button>
              <Button 
                className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white" 
                onClick={handleUnlockVault} 
                disabled={pinInput.length !== 4}
              >
                Buka
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM DIALOG MODAL (Menggantikan fungsi alert/confirm bawaan browser) */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border p-6 rounded-3xl shadow-2xl w-full max-w-sm animate-in zoom-in-95 text-center flex flex-col items-center">
            
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${dialog.type === 'confirm' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              <AlertCircle className="w-7 h-7" />
            </div>
            
            <h3 className="font-bold text-xl mb-2">{dialog.title}</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{dialog.message}</p>
            
            <div className="flex gap-3 w-full">
              {dialog.type === "confirm" && (
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-11 border-border bg-transparent" 
                  onClick={() => setDialog(prev => ({ ...prev, isOpen: false }))}
                >
                  Batal
                </Button>
              )}
              <Button 
                className={`flex-1 rounded-xl h-11 text-white shadow-md ${dialog.type === 'confirm' ? 'bg-destructive hover:bg-destructive/90' : 'bg-primary hover:bg-primary/90'}`} 
                onClick={() => {
                  if (dialog.type === "confirm" && dialog.onConfirm) {
                    dialog.onConfirm();
                  }
                  setDialog(prev => ({ ...prev, isOpen: false }));
                }}
              >
                {dialog.type === "confirm" ? "Ya, Hapus" : "Oke, Mengerti"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}