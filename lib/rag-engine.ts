import { NoteData } from "./notes-service";

export interface NoteMetadata {
  id: string;
  title: string;
  tags: string[];
  snippet: string; // <-- Tambahan: Cuplikan teks
  createdAt?: string; // <-- Tambahan: Waktu pembuatan
}

// 1. Ekstrak Metadata (Judul, Tag, Cuplikan, dan Tanggal)
export const extractMetadata = (notes: (NoteData & { id: string })[]): NoteMetadata[] => {
  return notes
    .filter(n => !n.isTodo && !n.isHidden) 
    .map(n => {
      // Ambil 100 karakter pertama sebagai cuplikan
      const plainText = n.content.replace(/<[^>]+>/g, ' ').trim();
      const snippet = plainText.length > 100 ? plainText.substring(0, 100) + "..." : plainText;
      
      // Ekstrak tanggal jika ada
      let dateStr = "Tidak diketahui";
      if (n.createdAt) {
        // Handle format Firebase Timestamp
        if (n.createdAt.toDate) {
          dateStr = n.createdAt.toDate().toLocaleDateString('id-ID');
        } else if (typeof n.createdAt === 'string' || typeof n.createdAt === 'number') {
          dateStr = new Date(n.createdAt).toLocaleDateString('id-ID');
        }
      }

      return {
        id: n.id,
        title: n.title || "Tanpa Judul",
        tags: n.tags || [],
        snippet: snippet,
        createdAt: dateStr
      };
    });
};

// 2. Fungsi untuk mencari konten lengkap berdasarkan ID
export const getContentsByIds = (notes: (NoteData & { id: string })[], ids: string[]): string => {
  const relevantNotes = notes.filter(n => ids.includes(n.id));
  
  if (relevantNotes.length === 0) return "Tidak ada catatan relevan yang ditemukan.";

  return relevantNotes.map(n => `
ID: ${n.id}
Judul: ${n.title}
Isi: ${n.content.replace(/<[^>]+>/g, ' ')}
---`).join('\n');
};