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

  return { callAI, isAiLoading };
}