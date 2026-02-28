"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, NoteData } from "@/lib/notes-service";
import { usePathname } from "next/navigation"; // Tambahan import

interface Message {
  role: "user" | "ai";
  content: string;
}

export function ChatWidget() {
  const { user } = useAuth();
  const pathname = usePathname(); // Inisialisasi pathname
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Halo! Aku Nexa. Ada yang mau ditanyakan soal catatanmu hari ini?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SEMBUNYIKAN WIDGET JIKA:
  // 1. User belum login
  // 2. Berada di halaman /create (termasuk /create-todo)
  // 3. Berada di halaman /edit (termasuk /edit-todo)
  // 4. Berada di halaman /todo (karena sudah ada Pomodoro Timer)
  if (!user || pathname.startsWith('/create') || pathname.startsWith('/edit') || pathname.startsWith('/todo')) {
    return null;
  }

  // Fungsi simpel untuk me-render Markdown dasar (Bold dan Italic) menjadi HTML
  const formatMessageContent = (text: string) => {
    let formattedText = text;
    // Mengubah **teks** menjadi <strong>teks</strong>
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Mengubah *teks* menjadi <em>teks</em>
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Mengubah baris baru menjadi <br />
    formattedText = formattedText.replace(/\n/g, '<br />');
    
    return formattedText;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const notes = await getUserNotes(user.uid);
      const typedNotes = notes as (NoteData & { id: string })[];
      const contextString = typedNotes.map(n => `Judul: ${n.title}\nIsi: ${n.content.replace(/<[^>]+>/g, ' ')}\n---`).join('\n');

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "chat", 
          prompt: userMessage,
          context: contextString
        })
      });

      if (!res.ok) throw new Error("Gagal merespons");
      const data = await res.json();

      setMessages(prev => [...prev, { role: "ai", content: data.result }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "ai", content: "Aduh, koneksiku ke server putus. Coba tanya lagi ya!" }]);
    } finally {
      setIsLoading(false);
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
              <h3 className="font-bold text-sm leading-tight">Nexa AI</h3>
              <p className="text-[10px] text-muted-foreground">Selalu siap membantu</p>
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
              {/* PERBAIKAN: Gunakan dangerouslySetInnerHTML untuk merender HTML dari formatMessageContent */}
              <div 
                className={`px-4 py-2 text-sm rounded-2xl max-w-[85%] leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm border border-border/50"}`}
                dangerouslySetInnerHTML={{ __html: msg.role === "ai" ? formatMessageContent(msg.content) : msg.content }}
              />
            </div>
          ))}
          
          {isLoading && (
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
          <Button size="icon" className="rounded-full shrink-0 h-10 w-10 shadow-md bg-primary hover:bg-primary/90" onClick={handleSend} disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
      </div>
    </>
  );
}