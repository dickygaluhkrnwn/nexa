"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { getUserNotes, NoteData } from "@/lib/notes-service";
import { usePathname } from "next/navigation"; 
import { useGemini } from "@/hooks/use-gemini"; 
import { extractMetadata } from "@/lib/rag-engine"; 
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "ai";
  content: string;
}

export function ChatWidget() {
  const { user } = useAuth();
  const pathname = usePathname(); 
  const { ragChat, isAiLoading } = useGemini(); 
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", content: "Halo! Aku asisten Nexa. Aku bisa mencarikan informasi dari seluruh tumpukan catatanmu. Ada yang mau ditanyakan?" }
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiLoading]);

  if (!user || pathname.startsWith('/create') || pathname.startsWith('/edit') || pathname.startsWith('/todo')) {
    return null;
  }

  const formatMessageContent = (text: string, notes: (NoteData & { id: string })[]) => {
    let formattedText = text;
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formattedText = formattedText.replace(/\n/g, '<br />');
    
    const mentionRegex = /\[\[(.*?)\]\]/g;
    formattedText = formattedText.replace(mentionRegex, (match, title) => {
      const foundNote = notes.find(n => n.title?.toLowerCase() === title.toLowerCase());
      if (foundNote) {
        return `<a href="/edit/${foundNote.id}" target="_blank" class="text-blue-500 font-bold hover:underline bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-500/20">@${title}</a>`;
      }
      return `<span class="text-muted-foreground italic bg-muted px-1.5 py-0.5 rounded-md border border-border">[Tidak ditemukan: ${title}]</span>`;
    });
    
    return formattedText;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);

    try {
      const notesData = await getUserNotes(user.uid);
      const typedNotes = notesData as (NoteData & { id: string })[];
      const meta = extractMetadata(typedNotes);
      const result = await ragChat(userMessage, meta, typedNotes);

      setMessages(prev => [...prev, { 
        role: "ai", 
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
        className={cn(
          "fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl bg-gradient-to-r from-cyan-500 to-purple-600 hover:scale-110 hover:shadow-purple-500/40 transition-all duration-300 z-40 border-0",
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        )}
      >
        <MessageCircle className="w-6 h-6 md:w-7 md:h-7 text-white" />
      </Button>

      {/* Kontainer Chat Panel (Lebih Lebar di Desktop) */}
      <div 
        className={cn(
          "fixed bottom-20 md:bottom-8 right-4 md:right-8 w-[90vw] md:w-[400px] lg:w-[450px] h-[550px] md:h-[650px] max-h-[75vh] md:max-h-[85vh] bg-card border border-border shadow-2xl rounded-[2rem] flex flex-col z-50 transition-all duration-500 origin-bottom-right overflow-hidden",
          isOpen ? "scale-100 opacity-100 translate-y-0" : "scale-50 opacity-0 pointer-events-none translate-y-10"
        )}
      >
        {/* Header Panel */}
        <div className="flex items-center justify-between p-5 border-b border-border/50 bg-muted/30 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-purple-600" />
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base md:text-lg leading-tight text-foreground">Nexa AI Assistant</h3>
              <p className="text-[10px] md:text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pencarian Cerdas RAG</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-background custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === "ai" ? "bg-gradient-to-br from-cyan-400 to-purple-600 text-white" : "bg-muted border border-border text-muted-foreground"}`}>
                {msg.role === "ai" ? <Bot className="w-4 h-4 md:w-5 md:h-5" /> : <User className="w-4 h-4 md:w-5 md:h-5" />}
              </div>
              <div 
                className={cn(
                  "px-4 md:px-5 py-3 md:py-3.5 text-sm md:text-base rounded-2xl max-w-[82%] leading-relaxed shadow-sm",
                  msg.role === "user" 
                    ? "bg-foreground text-background rounded-tr-sm font-medium" 
                    : "bg-muted/50 border border-border/50 rounded-tl-sm text-foreground/90"
                )}
                dangerouslySetInnerHTML={{ __html: msg.role === "ai" ? msg.content : msg.content }}
              />
            </div>
          ))}
          
          {isAiLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 md:w-5 md:h-5 text-white animate-pulse" />
              </div>
              <div className="px-5 py-4 bg-muted/50 rounded-2xl rounded-tl-sm border border-border/50 flex gap-1.5 items-center h-12 shadow-sm">
                <span className="w-2 h-2 bg-purple-500/60 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-purple-500/60 rounded-full animate-bounce delay-75" />
                <span className="w-2 h-2 bg-purple-500/60 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-border bg-muted/10 shrink-0">
          <div className="flex gap-2 bg-background p-1.5 rounded-[1.25rem] border border-border focus-within:border-purple-500/50 focus-within:ring-4 focus-within:ring-purple-500/10 transition-all shadow-sm">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Tanyakan sesuatu pada Nexa..."
              className="flex-1 bg-transparent px-4 py-2.5 text-sm md:text-base outline-none placeholder:text-muted-foreground/60 font-medium"
            />
            <Button size="icon" className="rounded-xl shrink-0 h-11 w-11 shadow-md bg-purple-600 hover:bg-purple-700 text-white border-0 transition-transform active:scale-95" onClick={handleSend} disabled={isAiLoading || !input.trim()}>
              <Send className="w-5 h-5 ml-0.5" />
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest font-bold">AI dapat membuat kesalahan. Periksa kembali infonya.</p>
        </div>
      </div>

      {/* Fallback User Icon for rendering condition above */}
      <svg width="0" height="0" className="hidden">
        <symbol id="icon-user-fallback" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </symbol>
      </svg>
    </>
  );
}

// Komponen mini untuk icon User di dalam file ini agar tidak error import
function User(props: any) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  );
}