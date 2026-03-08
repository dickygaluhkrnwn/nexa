"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, MessageSquare, Send, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGemini } from "@/hooks/use-gemini";
import { useModal } from "@/hooks/use-modal";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  noteContent: string;
}

export function ChatOverlay({ isOpen, onClose, noteTitle, noteContent }: ChatOverlayProps) {
  const { callAI } = useGemini();
  const { showQuotaAlert } = useModal();
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, isChatLoading]);

  const formatMessageContent = (text: string) => {
    let formattedText = text;
    formattedText = formattedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formattedText = formattedText.replace(/\n/g, '<br />');
    return formattedText;
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsChatLoading(true);

    try {
      const plainText = noteContent.replace(/<[^>]+>/g, ' ').trim();
      const contextStr = `Judul: ${noteTitle || 'Tanpa Judul'}\n\nIsi Catatan:\n${plainText}`;
      
      const result = await callAI({ 
        action: "chat", 
        prompt: userMessage,
        context: contextStr
      });

      setChatMessages(prev => [...prev, { role: "ai", content: result }]);
    } catch (error: any) {
      if (error.message === "QUOTA_EXCEEDED") {
        showQuotaAlert();
        setChatMessages(prev => prev.slice(0, -1));
      } else {
        setChatMessages(prev => [...prev, { role: "ai", content: "Aduh, aku gagal merespons permintaanmu. Coba lagi ya!" }]);
      }
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      <div className={`fixed inset-y-0 right-0 z-[70] w-full md:w-[420px] bg-card border-l border-border shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Chat Header Profesional */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-background z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">Asisten Dokumen</h3>
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Powered by Gemini AI</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-md hover:bg-muted h-8 w-8 text-muted-foreground" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted/10 custom-scrollbar">
          {chatMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center border border-border">
                <Bot className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Halo, aku Nexa AI.</p>
                <p className="text-xs mt-1 max-w-[250px] mx-auto text-muted-foreground">Tanyakan padaku untuk menganalisis, meringkas, atau mencari ide berdasarkan dokumen ini.</p>
              </div>
            </div>
          )}
          
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${msg.role === "ai" ? "bg-primary/10 border-primary/20" : "bg-muted border-border"}`}>
                {msg.role === "ai" ? <Sparkles className="w-4 h-4 text-primary" /> : <div className="w-4 h-4 bg-muted-foreground rounded-full" />}
              </div>
              <div 
                className={`px-4 py-3 text-sm rounded-2xl max-w-[80%] leading-relaxed shadow-sm ${msg.role === "user" ? "bg-foreground text-background rounded-tr-sm font-medium" : "bg-card border border-border rounded-tl-sm text-foreground"}`}
                dangerouslySetInnerHTML={{ __html: msg.role === "ai" ? formatMessageContent(msg.content) : msg.content }}
              />
            </div>
          ))}
          
          {isChatLoading && (
            <div className="flex gap-3 justify-start animate-in fade-in">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="px-4 py-3 bg-card border border-border rounded-2xl rounded-tl-sm flex gap-1.5 items-center h-10 shadow-sm">
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce delay-75" />
                <span className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-border bg-background">
          <div className="flex gap-2 bg-muted/50 p-1.5 rounded-xl border border-border focus-within:border-primary/50 transition-colors shadow-sm">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
              placeholder="Tanyakan sesuatu tentang teks..."
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button size="icon" className="rounded-lg shrink-0 h-9 w-9 bg-primary hover:bg-primary/90 text-primary-foreground" onClick={handleSendChat} disabled={isChatLoading || !chatInput.trim()}>
              <Send className="w-4 h-4 ml-0.5" />
            </Button>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-3 uppercase tracking-widest font-semibold">AI dapat membuat kesalahan.</p>
        </div>
      </div>
    </>
  );
}