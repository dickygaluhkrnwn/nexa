import { db } from "./firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export interface FeedbackData {
  userId: string;
  name: string;
  rating: number;
  message: string;
}

// Fungsi untuk mengirim feedback ke koleksi 'feedbacks' di Firestore
export const addFeedback = async (data: FeedbackData) => {
  try {
    const docRef = await addDoc(collection(db, "feedbacks"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding feedback: ", error);
    throw error;
  }
};