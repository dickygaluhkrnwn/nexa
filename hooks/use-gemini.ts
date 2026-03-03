import { useState } from "react";
import { useModal } from "./use-modal";

export function useGemini() {
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { showQuotaAlert, showAlert } = useModal();

  const callAI = async (payload: any) => {
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({})); 
      
      if (!res.ok) {
        if (res.status === 429 || data.error?.toLowerCase().includes("quota") || data.error?.includes("429")) {
          throw new Error("QUOTA_EXCEEDED");
        }
        throw new Error(data.error || "Gagal memanggil AI.");
      }
      return data.result;
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") {
        showQuotaAlert();
        throw error;
      }
      console.error("AI Fetch Error:", error);
      showAlert("Gagal AI", error.message || "Terjadi kesalahan koneksi AI.");
      throw error;
    } finally {
      setIsAiLoading(false);
    }
  };
  
  // --- FUNGSI SPESIFIK AI FLASHCARDS ---
  const generateFlashcards = async (content: string) => {
    const result = await callAI({ action: "generate-flashcards", content });
    try {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw new Error("Format JSON tidak valid");
    } catch (e) {
      console.error("Gagal parsing flashcard JSON", e);
      throw new Error("Gagal memproses data flashcard dari AI.");
    }
  };

  // --- FASE 5: FUNGSI RAG CHAT (TWO-STEP GENERATION) ---
  const ragChat = async (userMessage: string, notesMetadata: any[], fullNotes: any[]) => {
    setIsAiLoading(true);
    try {
      // LANGKAH 1: Kirimkan metadata yang lebih kaya (termasuk Cuplikan dan Tanggal)
      const metaString = notesMetadata.map(m => 
        `ID: ${m.id} | Judul: ${m.title} | Tanggal: ${m.createdAt} | Tags: ${m.tags.join(', ')}\nCuplikan: ${m.snippet}`
      ).join('\n---\n');

      const selectionResult = await callAI({
        action: "rag-select-docs",
        prompt: userMessage,
        context: metaString
      });

      let selectedIds: string[] = [];
      const jsonMatch = selectionResult.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          selectedIds = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("Gagal parsing ID RAG", e);
        }
      }

      // LANGKAH 2: Ekstrak isi catatan yang dipilih AI (Fallback jika kosong)
      let docContext = "";
      if (selectedIds && selectedIds.length > 0) {
         const relevantNotes = fullNotes.filter(n => selectedIds.includes(n.id));
         docContext = relevantNotes.map(n => `ID: ${n.id}\nJudul: ${n.title}\nIsi: ${n.content.replace(/<[^>]+>/g, ' ')}\n---`).join('\n');
      } else {
         // Jika AI tidak menemukan catatan yang cocok, beri instruksi sistem untuk menjawab secara umum
         docContext = "SISTEM: Pengguna tidak memiliki catatan yang relevan secara spesifik untuk pertanyaan ini. Jawablah menggunakan pengetahuan umummu dengan sopan, namun beri tahu pengguna secara jelas bahwa jawaban ini bukan berasal dari catatan mereka.";
      }

      // LANGKAH 3: Minta jawaban akhir ke AI berdasarkan konteks yang sudah difilter
      const finalAnswer = await callAI({
        action: "rag-answer",
        prompt: userMessage,
        context: docContext
      });

      return finalAnswer;

    } catch (error) {
      throw error; 
    } finally {
      setIsAiLoading(false);
    }
  };

  return { callAI, isAiLoading, generateFlashcards, ragChat };
}