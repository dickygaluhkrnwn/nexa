import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface UserProfile {
  whatsappNumber?: string;
  pinCode?: string; // Tambahan untuk fitur Brankas Rahasia
  vibrationEnabled?: boolean; // Preferensi getaran notifikasi perangkat
  readNotifications?: string[]; // Menyimpan ID notifikasi yang sudah dibaca user
}

// Mengambil data profil user
export const getUserProfile = async (userId: string) => {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile: ", error);
    throw error;
  }
};

// Memperbarui atau membuat data profil user
export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  try {
    const docRef = doc(db, "users", userId);
    // { merge: true } memastikan data lama tidak terhapus jika kita hanya update 1 field
    await setDoc(docRef, data, { merge: true });
  } catch (error) {
    console.error("Error updating user profile: ", error);
    throw error;
  }
};