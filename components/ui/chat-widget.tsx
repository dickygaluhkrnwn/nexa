"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, NoteData } from "@/lib/notes-service";
import { usePathname } from "next/navigation"; 
import { useGemini } from "@/hooks/use-gemini"; 
import { extractMetadata } from "@/lib/rag-engine"; // <-- Import RAG Engine

interface Message {
  role: "user" | "ai";
  content: string;
}

export function ChatWidget() {
  const { user } = useAuth();
  const pathname = usePathname(); 
  const { ragChat, isAiLoading } = useGemini(); // <-- Gunakan RAG Chat
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Halo! Aku asisten Nexa. Aku bisa mencarikan informasi dari seluruh tumpukan catatanmu. Ada yang mau ditanyakan?" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll otomatis ke bawah jika ada pesan baru atau sedang loading
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiLoading]);

  if (!user || pathname.startsWith('/create') || pathname.startsWith('/edit') || pathname.startsWith('/todo')) {
    return null;
  }

  // --- RENDERING TEKS AI SPESIAL ---
  // Fungsi ini mengubah [[Judul]] menjadi link HTML sungguhan yang bisa di-klik
  const formatMessageContent = (text: string, notes: (NoteData & { id: string })[]) => {
    let formattedText = text;
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formattedText = formattedText.replace(/\n/g, '<br />');
    
    // Konversi [[Mention]] ke tag <a> link biru
    const mentionRegex = /\[\[(.*?)\]\]/g;
    formattedText = formattedText.replace(mentionRegex, (match, title) => {
      // Cari ID catatan berdasarkan judul yang disebut AI
      const foundNote = notes.find(n => n.title?.toLowerCase() === title.toLowerCase());
      if (foundNote) {
        return `<a href="/edit/${foundNote.id}" target="_blank" class="text-blue-500 font-bold hover:underline bg-blue-500/10 px-1 rounded">@${title}</a>`;
      }
      return `<span class="text-muted-foreground italic">[Catatan tidak ditemukan: ${title}]</span>`;
    });
    
    return formattedText;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      // 1. Tarik semua catatan
      const notesData = await getUserNotes(user.uid);
      const typedNotes = notesData as (NoteData & { id: string })[];
      
      // 2. Siapkan Metadata untuk Langkah 1 (Pemilihan Dokumen)
      const meta = extractMetadata(typedNotes);

      // 3. Panggil RAG Engine 
      // (AI akan mikir, milih dokumen, baca isinya, lalu jawab)
      const result = await ragChat(userMessage, meta, typedNotes);

      // 4. Format dan render balasan AI
      setMessages(prev => [...prev, { 
        role: "ai", 
        // Simpan format mentah dulu, render HTML-nya di bawah
        content: formatMessageContent(result, typedNotes) 
      }]);

    } catch (error: any) {
      console.error(error);
      if (error.message === "QUOTA_EXCEEDED") {
        setMessages(prev => prev.slice(0, -1));
      } else {
        setMessages(prev => [...prev, { role: "ai", content: "Aduh, servernya lagi sibuk mikir. Coba tanya lagi ya!" }]);
      }
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 w-14 h-14 rounded-full shadow-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:scale-105 transition-all z-40 ${isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </Button>

      <div className={`fixed bottom-20 md:bottom-6 right-4 md:right-6 w-[90vw] max-w-[360px] h-[500px] max-h-[70vh] bg-background border border-border shadow-2xl rounded-2xl flex flex-col z-50 transition-all duration-300 origin-bottom-right ${isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"}`}>
        
        <div className="flex items-center justify-between p-4 border-b bg-muted/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-md">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">Nexa RAG Chat</h3>
              <p className="text-[10px] text-muted-foreground">Mencari info dari catatanmu</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full hover:bg-muted-foreground/10" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="w-6 h-6 mt-1 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-primary" />
                </div>
              )}
              {/* Pesan AI sudah dirender HTML-nya saat di-push ke array */}
              <div 
                className={`px-4 py-2 text-sm rounded-2xl max-w-[85%] leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm border border-border/50"}`}
                dangerouslySetInnerHTML={{ __html: msg.content }}
              />
            </div>
          ))}
          
          {/* Menggunakan isAiLoading dari hook */}
          {isAiLoading && (
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 mt-1 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="w-3 h-3 text-primary" />
              </div>
              <div className="px-4 py-3 bg-muted rounded-2xl rounded-tl-sm border border-border/50 flex gap-1.5 items-center h-9">
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t bg-background rounded-b-2xl flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tanya Nexa soal catatanmu..."
            className="flex-1 bg-muted px-4 py-2 text-sm rounded-full outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
          />
          <Button size="icon" className="rounded-full shrink-0 h-10 w-10 shadow-md bg-primary hover:bg-primary/90" onClick={handleSend} disabled={isAiLoading || !input.trim()}>
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </>
  );
}