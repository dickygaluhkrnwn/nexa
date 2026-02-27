import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  orderBy, 
  getDocs,
  doc,
  deleteDoc,
  getDoc,
  updateDoc
} from "firebase/firestore";

export interface NoteData {
  title: string;
  content: string; // Format HTML dari Tiptap
  tags: string[];
  isTodo: boolean;
  dueDate?: string | null;
  dueTime?: string | null; // <-- Tambahan untuk Waktu (Jam/Menit)
  recurrence?: string; // 'none' | 'daily' | 'weekly' | 'monthly'
  isHidden?: boolean; // <-- Tambahan untuk fitur Brankas Rahasia
  isPinned?: boolean; // <-- Tambahan untuk fitur Pin Catatan/Tugas
  userId: string;
}

// Fungsi untuk menyimpan catatan baru
export const addNote = async (data: NoteData) => {
  try {
    const docRef = await addDoc(collection(db, "notes"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding note: ", error);
    throw error;
  }
};

// Fungsi untuk mengambil catatan milik user yang sedang login
export const getUserNotes = async (userId: string) => {
  try {
    const q = query(
      collection(db, "notes"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error getting notes: ", error);
    throw error;
  }
};

// Fungsi untuk menghapus catatan
export const deleteNote = async (noteId: string) => {
  try {
    await deleteDoc(doc(db, "notes", noteId));
  } catch (error) {
    console.error("Error deleting note: ", error);
    throw error;
  }
};

// Fungsi untuk mengambil satu catatan berdasarkan ID
export const getNote = async (noteId: string) => {
  try {
    const docRef = doc(db, "notes", noteId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as NoteData & { id: string };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting note: ", error);
    throw error;
  }
};

// Fungsi untuk memperbarui catatan
export const updateNote = async (noteId: string, data: Partial<NoteData>) => {
  try {
    const docRef = doc(db, "notes", noteId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error updating note: ", error);
    throw error;
  }
};