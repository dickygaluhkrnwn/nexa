import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Network, Sparkles, Tag as TagIcon, Wand2, Mic, Brain } from "lucide-react"; // <-- TAMBAH BRAIN ICON

interface AiToolbarProps {
  onOpenChat: () => void;
  onGenerateMindMap: () => void;
  onAutoFormat: () => void;
  onGenerateTags: () => void;
  onSummarize: () => void;
  
  // --- TAMBAHAN UNTUK FLASHCARDS ---
  onGenerateFlashcards?: () => void; 
  
  isGeneratingMindMap: boolean;
  isFormatting: boolean;
  isGeneratingTags: boolean;
  isSummarizing: boolean;
  
  // --- TAMBAHAN UNTUK FLASHCARDS ---
  isGeneratingFlashcards?: boolean; 
  
  isContentEmpty: boolean;
  isTitleAndContentEmpty: boolean;
  
  // Tambahan Props untuk Smart Voice Memos
  onVoiceRecord?: () => void;
  isRecording?: boolean;
  isAnalyzingVoice?: boolean;
  onStopRecording?: () => void;
}

export function AiToolbar({
  onOpenChat,
  onGenerateMindMap,
  onAutoFormat,
  onGenerateTags,
  onSummarize,
  onGenerateFlashcards, // <-- AMBIL PROPS
  isGeneratingMindMap,
  isFormatting,
  isGeneratingTags,
  isSummarizing,
  isGeneratingFlashcards, // <-- AMBIL PROPS
  isContentEmpty,
  isTitleAndContentEmpty,
  onVoiceRecord,
  isRecording,
  isAnalyzingVoice,
  onStopRecording
}: AiToolbarProps) {
  return (
    <div className="bg-gradient-to-r from-primary/5 via-purple-500/5 to-cyan-500/5 border border-primary/20 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
      <div className="flex items-center gap-2.5 px-1">
        <div className="p-1.5 bg-primary/20 rounded-lg text-primary shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <p className="text-xs font-bold text-foreground">Nexa AI Assistant</p>
          <p className="text-[10px] text-muted-foreground">Bantu rapikan catatanmu</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 w-full sm:w-auto">
        
        {/* Tombol Smart Voice Memos */}
        {onVoiceRecord && (
          isRecording ? (
            <Button 
              variant="default" 
              size="sm" 
              onClick={onStopRecording} 
              className="flex-1 sm:flex-none rounded-xl bg-red-500 hover:bg-red-600 text-white border-0 shadow-md animate-pulse whitespace-nowrap"
            >
              <div className="w-2 h-2 rounded-full bg-white mr-2" /> Berhenti Rekam
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onVoiceRecord} 
              disabled={isAnalyzingVoice} 
              className="flex-1 sm:flex-none rounded-xl bg-background/50 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-sm whitespace-nowrap"
            >
              {isAnalyzingVoice ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Mic className="w-3 h-3 mr-1.5" />} 
              {isAnalyzingVoice ? "Menganalisis..." : "Suara Pintar"}
            </Button>
          )
        )}

        <Button variant="outline" size="sm" onClick={onOpenChat} className="flex-1 sm:flex-none rounded-xl bg-background/50 hover:bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 shadow-sm whitespace-nowrap">
          <MessageSquare className="w-3 h-3 mr-1.5" /> Tanya AI
        </Button>
        
        {/* --- TOMBOL BARU: BIKIN KUIS FLASHCARD --- */}
        {onGenerateFlashcards && (
          <Button variant="outline" size="sm" onClick={onGenerateFlashcards} disabled={isGeneratingFlashcards || isContentEmpty} className="flex-1 sm:flex-none rounded-xl bg-background/50 hover:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-sm whitespace-nowrap">
            {isGeneratingFlashcards ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Brain className="w-3 h-3 mr-1.5" />} Bikin Kuis
          </Button>
        )}

        <Button variant="outline" size="sm" onClick={onGenerateMindMap} disabled={isGeneratingMindMap || isContentEmpty} className="flex-1 sm:flex-none rounded-xl bg-background/50 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 shadow-sm whitespace-nowrap">
          {isGeneratingMindMap ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Network className="w-3 h-3 mr-1.5" />} Mind Map
        </Button>
        
        <Button variant="outline" size="sm" onClick={onAutoFormat} disabled={isFormatting || isContentEmpty} className="flex-1 sm:flex-none rounded-xl bg-background/50 hover:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20 shadow-sm whitespace-nowrap">
          {isFormatting ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1.5" />} Rapihkan
        </Button>
        
        <Button variant="outline" size="sm" onClick={onGenerateTags} disabled={isGeneratingTags || isTitleAndContentEmpty} className="flex-1 sm:flex-none rounded-xl bg-background/50 hover:bg-primary/10 text-primary border-primary/20 shadow-sm whitespace-nowrap">
          {isGeneratingTags ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <TagIcon className="w-3 h-3 mr-1.5" />} Tebak Tag
        </Button>
        
        <Button variant="outline" size="sm" onClick={onSummarize} disabled={isSummarizing || isTitleAndContentEmpty} className="flex-1 sm:flex-none rounded-xl bg-background/50 hover:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20 shadow-sm whitespace-nowrap">
          {isSummarizing ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Wand2 className="w-3 h-3 mr-1.5" />} Ringkas Isi
        </Button>
      </div>
    </div>
  );
}