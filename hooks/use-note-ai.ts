import { useState, useRef } from "react";
import { useGemini } from "./use-gemini";
import { useModal } from "./use-modal";

interface UseNoteAiProps {
  title: string;
  setTitle: (val: string) => void;
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  tags: string[];
  setTags: (val: string[]) => void;
  forceRenderEditor: () => void;
  mindMapHistory: string[];
  setMindMapHistory: React.Dispatch<React.SetStateAction<string[]>>;
  setShowMindMap: (val: boolean) => void;
}

export function useNoteAi({
  title, setTitle, content, setContent, 
  tags, setTags, forceRenderEditor, 
  mindMapHistory, setMindMapHistory, setShowMindMap
}: UseNoteAiProps) {
  const { callAI } = useGemini();
  const { showAlert, showQuotaAlert } = useModal();

  // State Loading Spesifik
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  // --- LOGIKA AI SUPERPOWERS ---
  const handleAutoFormat = async () => {
    setIsFormatting(true);
    try {
      const result = await callAI({ action: "auto-format", content: content });
      if (result) {
        const cleanHtml = result.replace(/```html/g, '').replace(/```/g, '').trim();
        setContent(cleanHtml);
        forceRenderEditor(); 
        showAlert("Berhasil! ✨", "Teks acakmu sudah disulap menjadi rapi dan terstruktur.");
      }
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") showQuotaAlert();
      else console.error("Gagal merapikan teks", error);
    } finally {
      setIsFormatting(false);
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const plainText = content.replace(/<[^>]+>/g, ' ').trim();
      const result = await callAI({ action: "summarize", content: `Judul: ${title}\n\nIsi: ${plainText}` });
      setAiSummary(result);
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") showQuotaAlert();
      else console.error("Gagal merangkum", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateTags = async () => {
    setIsGeneratingTags(true);
    try {
      const plainText = content.replace(/<[^>]+>/g, ' ').trim();
      const result = await callAI({ action: "auto-tag", content: `Judul: ${title}\n\nIsi: ${plainText}` });
      if (result) {
        const newTags = result.split(',').map((t: string) => t.trim().replace(/^#/, '')).filter(Boolean);
        const uniqueTags = Array.from(new Set([...tags, ...newTags]));
        setTags(uniqueTags);
      }
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") showQuotaAlert();
      else console.error("Gagal menebak tag", error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleGenerateMindMap = async () => {
    setIsGeneratingMindMap(true);
    try {
      const plainText = content.replace(/<[^>]+>/g, ' ').trim();
      const result = await callAI({ action: "mindmap", content: `Judul: ${title}\n\nIsi: ${plainText}` });
      if (result) {
        const cleanCode = result.replace(/```mermaid/g, '').replace(/```/g, '').trim();
        setMindMapHistory(prev => [cleanCode, ...prev]);
        setShowMindMap(true);
        showAlert("Berhasil", "Mind Map baru telah dibuat berdasarkan teks terbarumu.");
      }
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") showQuotaAlert();
      else console.error("Gagal membuat mind map", error);
    } finally {
      setIsGeneratingMindMap(false);
    }
  };

  // --- FUNGSI HARDWARE (OCR) ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";
    setIsScanning(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        try {
          const extractedHtml = await callAI({ action: "ocr", imageBase64: base64String, mimeType: file.type });
          const cleanHtml = extractedHtml?.replace(/```html/g, '').replace(/```/g, '').trim();

          if (!cleanHtml || cleanHtml === "") {
            showAlert("Info AI", "AI tidak menemukan teks pada gambar ini.");
          } else {
            setContent((prev: string) => prev + (prev ? "<br><br>" : "") + cleanHtml);
            forceRenderEditor();
          }
        } catch (apiError: any) {
          if (apiError.message === "QUOTA_EXCEEDED") showQuotaAlert();
          else console.error("Gagal scan OCR", apiError);
        } finally {
          setIsScanning(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsScanning(false);
      showAlert("Error File", "Gagal membaca file gambar.");
    }
  };

  // --- FUNGSI SMART VOICE MEMOS ---
  const handleVoiceRecord = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showAlert("Tidak Mendukung", "Maaf, browser kamu tidak mendukung fitur Suara ke Teks. Coba gunakan Google Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'id-ID';
    recognition.continuous = true; 
    recognition.interimResults = false;

    let finalTranscript = "";

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech error", event.error);
      showAlert("Gagal Mendengar", "Gagal mengenali suara. Pastikan kamu sudah memberikan izin mikrofon di browser.");
      setIsRecording(false);
    };

    recognition.onend = async () => {
      setIsRecording(false);
      
      if (!finalTranscript.trim()) return;

      setIsAnalyzingVoice(true);
      try {
        const result = await callAI({
          action: "analyze-voice-memo",
          content: finalTranscript.trim()
        });

        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          if (!title && parsed.title) setTitle(parsed.title);
          
          let aiContentHtml = `
            <h3>🎙️ Catatan Suara Pintar</h3>
            <p><em>${parsed.summary}</em></p>
            ${parsed.formattedText}
          `;

          if (parsed.actionItems && parsed.actionItems.length > 0) {
            aiContentHtml += `
              <br/>
              <h4>✅ Action Items:</h4>
              <ul data-type="taskList">
                ${parsed.actionItems.map((task: string) => `
                  <li data-type="taskItem" data-checked="false">
                    <label><input type="checkbox"><span></span></label>
                    <div><p>${task}</p></div>
                  </li>
                `).join('')}
              </ul>
            `;
          }

          setContent((prev: string) => prev + (prev ? "<br><br>" : "") + aiContentHtml);
          forceRenderEditor();
          showAlert("Berhasil!", "Rekaman suara berhasil dirapikan dan dianalisis oleh AI.");
        } else {
          throw new Error("Invalid JSON from AI");
        }

      } catch (error: any) {
        console.error("Gagal menganalisis suara:", error);
        
        setContent((prev: string) => prev + (prev ? "<br><br>" : "") + `<p>🎙️ <em>Transkripsi Mentah (AI Limit):</em><br/>${finalTranscript.trim()}</p>`);
        forceRenderEditor();
        
        if (error.message === "QUOTA_EXCEEDED") {
          showQuotaAlert();
        } else {
          showAlert("AI Sibuk", "AI gagal merapikan rekamanmu. Jangan khawatir, teks aslinya tetap kami simpan di editor.");
        }
      } finally {
        setIsAnalyzingVoice(false);
      }
    };

    recognition.start();
    
    (window as any).stopNexaRecording = () => {
      recognition.stop();
    };
  };

  return {
    isSummarizing,
    isGeneratingTags,
    isFormatting,
    isGeneratingMindMap,
    isScanning,
    isAnalyzingVoice,
    isRecording,
    aiSummary,
    setAiSummary,
    handleAutoFormat,
    handleSummarize,
    handleGenerateTags,
    handleGenerateMindMap,
    handleImageUpload,
    handleVoiceRecord,
  };
}