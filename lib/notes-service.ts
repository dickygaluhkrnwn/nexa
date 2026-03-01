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

export interface SubTask {
  id: string;
  text: string;
  isCompleted: boolean;
  time?: string; 
}

export interface NoteData {
  title: string;
  content: string; 
  tags: string[];
  isTodo: boolean;
  dueDate?: string | null;
  dueTime?: string | null; 
  recurrence?: string; 
  isHidden?: boolean; 
  isPinned?: boolean; 
  isCompleted?: boolean;
  subTasks?: SubTask[]; 
  status?: 'todo' | 'in-progress' | 'done'; 
  mindmapCode?: string | null; 
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface HabitData {
  id?: string;
  userId: string;
  title: string;
  icon: string; 
  color: string; 
  completedDates: string[]; 
  createdAt?: any;
}

// --- TAMBAHAN UNTUK FOCUS ANALYTICS (POMODORO) ---
export interface FocusSession {
  id?: string;
  userId: string;
  durationMinutes: number; // Durasi fokus dalam menit (biasanya 25)
  completedAt: string; // Tanggal dan waktu diselesaikan (ISO String)
}
// -------------------------------------------------

// ... (Fungsi notes yang sudah ada)
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

export const deleteNote = async (noteId: string) => {
  try {
    await deleteDoc(doc(db, "notes", noteId));
  } catch (error) {
    console.error("Error deleting note: ", error);
    throw error;
  }
};

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


// ... (Fungsi habits yang sudah ada)
export const addHabit = async (data: HabitData) => {
  try {
    const docRef = await addDoc(collection(db, "habits"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding habit: ", error);
    throw error;
  }
};

export const getUserHabits = async (userId: string) => {
  try {
    const q = query(
      collection(db, "habits"),
      where("userId", "==", userId),
      orderBy("createdAt", "asc") 
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as HabitData[];
  } catch (error) {
    console.error("Error getting habits: ", error);
    throw error;
  }
};

export const updateHabit = async (habitId: string, data: Partial<HabitData>) => {
  try {
    const docRef = doc(db, "habits", habitId);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating habit: ", error);
    throw error;
  }
};

export const deleteHabit = async (habitId: string) => {
  try {
    await deleteDoc(doc(db, "habits", habitId));
  } catch (error) {
    console.error("Error deleting habit: ", error);
    throw error;
  }
};

// --- FUNGSI CRUD UNTUK FOCUS SESSIONS ---
export const addFocusSession = async (data: FocusSession) => {
  try {
    const docRef = await addDoc(collection(db, "focus_sessions"), {
      ...data,
      timestamp: serverTimestamp(), // Untuk sorting di Firestore jika perlu
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding focus session: ", error);
    throw error;
  }
};

export const getUserFocusSessions = async (userId: string) => {
  try {
    // Kita ambil semua session user, nanti difilter per minggu di client (frontend)
    const q = query(
      collection(db, "focus_sessions"),
      where("userId", "==", userId)
      // Idealnya kita orderBy("completedAt", "desc"), tapi butuh index composite di Firestore.
      // Karena data pomodoro tidak terlalu besar, kita ambil semua dan sort di client saja.
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FocusSession[];
  } catch (error) {
    console.error("Error getting focus sessions: ", error);
    throw error;
  }
};
// ----------------------------------------