"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, MessageSquare, Send, X } from "lucide-react";
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
        <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm md:hidden" onClick={onClose} />
      )}

      <div className={`fixed inset-y-0 right-0 z-[70] w-full md:w-[400px] bg-card border-l border-border shadow-2xl transform transition-transform duration-500 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Nexa AI Chat</h3>
              <p className="text-[11px] text-muted-foreground">Tanya apapun soal catatan ini</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-3">
              <MessageSquare className="w-12 h-12" />
              <p className="text-sm">Belum ada obrolan.<br/>Tanyakan inti, ide, atau ringkasan spesifik dari catatan ini!</p>
            </div>
          )}
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
              )}
              <div 
                className={`px-4 py-2.5 text-sm rounded-2xl max-w-[85%] leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted rounded-tl-sm border border-border/50"}`}
                dangerouslySetInnerHTML={{ __html: msg.role === "ai" ? formatMessageContent(msg.content) : msg.content }}
              />
            </div>
          ))}
          
          {isChatLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="px-4 py-3 bg-muted rounded-2xl rounded-tl-sm border border-border/50 flex gap-1.5 items-center h-10">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-75" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-border/50 bg-background flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            placeholder="Ketik pertanyaanmu..."
            className="flex-1 bg-muted px-4 py-3 text-sm rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground/50"
          />
          <Button size="icon" className="rounded-xl shrink-0 h-12 w-12 shadow-md bg-primary hover:bg-primary/90" onClick={handleSendChat} disabled={isChatLoading || !chatInput.trim()}>
            <Send className="w-5 h-5 ml-0.5" />
          </Button>
        </div>
      </div>
    </>
  );
}