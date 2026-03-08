"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Mention from '@tiptap/extension-mention';

// EKSTENSI BARU (PRO FEATURES)
import TextAlign from '@tiptap/extension-text-align';

// FIX: Menggunakan named imports untuk Table extensions
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import Underline from '@tiptap/extension-underline';

import tippy, { Instance as TippyInstance } from 'tippy.js';
import { 
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, CheckSquare, 
  Strikethrough, Quote, Code, RemoveFormatting, Undo, Redo,
  Minus, TerminalSquare, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Table as TableIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TiptapEditorProps {
  content: string;
  onChange: (richText: string) => void;
  availableNotes?: { id: string; title: string }[];
}

// --- KOMPONEN POPUP DROPDOWN (PILIHAN CATATAN) ---
const MentionList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const items = props.items || [];

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      props.command({ id: item.id, label: item.title });
    }
  };

  const upHandler = () => setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  const downHandler = () => setSelectedIndex((selectedIndex + 1) % items.length);
  const enterHandler = () => selectItem(selectedIndex);

  useEffect(() => setSelectedIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') { upHandler(); return true; }
      if (event.key === 'ArrowDown') { downHandler(); return true; }
      if (event.key === 'Enter') { enterHandler(); return true; }
      return false;
    },
  }));

  return (
    <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden min-w-[250px] max-w-[300px] flex flex-col p-1.5 z-[100] animate-in zoom-in-95 duration-200">
      <div className="px-2 py-1.5 border-b border-border/50 mb-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tautkan ke Dokumen</p>
      </div>
      <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
        {items.length > 0 ? (
          items.map((item: any, index: number) => (
            <button
              className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors truncate ${
                index === selectedIndex ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted text-foreground'
              }`}
              key={index}
              onClick={() => selectItem(index)}
            >
              {item.title}
            </button>
          ))
        ) : (
          <div className="px-3 py-4 text-sm text-muted-foreground italic text-center">Tidak ada yang cocok</div>
        )}
      </div>
    </div>
  );
});
MentionList.displayName = 'MentionList';

// --- KUSTOMISASI EKSTENSI MENTION ---
const CustomMention = Mention.extend({
  parseHTML() {
    return [{ tag: 'span[data-type="mention"]' }];
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      {
        ...this.options.HTMLAttributes,
        ...HTMLAttributes,
        'data-type': 'mention',
        'data-id': node.attrs.id,
        'data-label': node.attrs.label,
      },
      `[[${node.attrs.label}]]`,
    ];
  },
});

export function TiptapEditor({ content, onChange, availableNotes = [] }: TiptapEditorProps) {
  const availableNotesRef = useRef(availableNotes);
  const [isTableMenuOpen, setIsTableMenuOpen] = useState(false);

  useEffect(() => {
    availableNotesRef.current = availableNotes;
  }, [availableNotes]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      CustomMention.configure({
        HTMLAttributes: {
          class: 'bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-bold cursor-pointer transition-colors hover:bg-primary/20 border border-primary/20 inline-block mx-1',
        },
        suggestion: {
          char: '[[', 
          allowSpaces: true, 
          items: ({ query }) => {
            return availableNotesRef.current
              .filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
              .slice(0, 5); 
          },
          render: () => {
            let component: ReactRenderer;
            let popup: TippyInstance;

            return {
              onStart: props => {
                component = new ReactRenderer(MentionList, { props, editor: props.editor });
                if (!props.clientRect) return;
                popup = tippy(document.body, {
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: 'manual',
                  placement: 'bottom-start',
                });
              },
              onUpdate(props) {
                component.updateProps(props);
                if (!props.clientRect) return;
                popup?.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect });
              },
              onKeyDown(props) {
                if (props.event.key === 'Escape') { popup?.hide(); return true; }
                return (component.ref as any)?.onKeyDown(props);
              },
              onExit() {
                if (popup) popup.destroy();
                if (component) component.destroy();
              },
            };
          },
        },
      }),
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-content focus:outline-none min-h-[70vh] w-full px-4 md:px-8 lg:px-16 py-10',
      },
      handleClick(view, pos, event) {
        const target = event.target as HTMLElement;
        const mentionNode = target.closest('[data-type="mention"]');
        if (mentionNode) {
          const id = mentionNode.getAttribute('data-id');
          if (id) {
            window.open(`/edit/${id}`, '_blank');
            return true;
          }
        }
        // Menutup menu tabel jika klik di luar
        setIsTableMenuOpen(false);
        return false;
      },
    },
  });

  if (!editor) return null;

  // Komponen Helper untuk Tombol Toolbar
  const ToolbarBtn = ({ onClick, isActive, icon: Icon, title, disabled = false }: any) => (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // FIX CRUCIAL: Cegah editor kehilangan fokus!
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "p-1.5 md:p-2 rounded-md transition-all flex items-center justify-center shrink-0",
        isActive ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "opacity-40 cursor-not-allowed hover:bg-transparent"
      )}
    >
      <Icon className="w-4 h-4 md:w-4.5 md:h-4.5" />
    </button>
  );

  const getActiveTextStyle = () => {
    if (editor.isActive('heading', { level: 1 })) return 'H1';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    if (editor.isActive('heading', { level: 4 })) return 'H4';
    if (editor.isActive('heading', { level: 5 })) return 'H5';
    if (editor.isActive('heading', { level: 6 })) return 'H6';
    return 'P';
  };

  return (
    <div className="w-full flex flex-col h-full bg-background relative border-t border-border">
      
      {/* GLOBAL EDITOR STYLES */}
      <style dangerouslySetInnerHTML={{__html: `
        .tiptap-content { outline: none; }
        .tiptap-content p { margin-bottom: 0.85em; line-height: 1.7; font-size: 1rem; }
        .tiptap-content h1 { font-size: 2.25rem; font-weight: 800; margin-top: 2rem; margin-bottom: 1rem; line-height: 1.2; letter-spacing: -0.02em; }
        .tiptap-content h2 { font-size: 1.75rem; font-weight: 700; margin-top: 1.75rem; margin-bottom: 0.75rem; line-height: 1.3; letter-spacing: -0.01em; }
        .tiptap-content h3 { font-size: 1.5rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; line-height: 1.3; }
        .tiptap-content h4 { font-size: 1.25rem; font-weight: 600; margin-top: 1.25rem; margin-bottom: 0.5rem; }
        
        .tiptap-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; line-height: 1.7; }
        .tiptap-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; line-height: 1.7; }
        .tiptap-content li { margin-bottom: 0.25rem; }
        
        .tiptap-content strong { font-weight: 700; color: inherit; }
        .tiptap-content em { font-style: italic; }
        .tiptap-content u { text-decoration: underline; }
        .tiptap-content s { text-decoration: line-through; opacity: 0.7; }
        
        .tiptap-content blockquote { 
          border-left: 4px solid hsl(var(--primary)); 
          padding-left: 1rem; 
          margin: 1.5rem 0; 
          color: hsl(var(--muted-foreground)); 
          font-style: italic; 
          background: hsl(var(--muted)/0.3);
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }
        
        .tiptap-content code { 
          background-color: hsl(var(--muted)); 
          padding: 0.2rem 0.4rem; 
          border-radius: 0.25rem; 
          font-size: 0.85em; 
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; 
          color: hsl(var(--foreground));
        }

        .tiptap-content pre {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
          border: 1px solid hsl(var(--border));
        }
        .tiptap-content pre code { background: none; color: inherit; font-size: 0.85rem; padding: 0; }

        .tiptap-content hr {
          border: none;
          border-top: 2px solid hsl(var(--border));
          margin: 2.5rem 0;
          border-radius: 2px;
        }
        
        /* FIX TABLE STYLING: Memastikan tabel ter-render dengan benar */
        .tiptap-content table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1.5rem 0;
          overflow: hidden;
          border-radius: 0.5rem;
          box-shadow: 0 0 0 1px hsl(var(--border));
        }
        .tiptap-content td, .tiptap-content th {
          min-width: 1em;
          border: 1px solid hsl(var(--border));
          padding: 0.5rem 0.75rem;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .tiptap-content th {
          font-weight: bold;
          text-align: left;
          background-color: hsl(var(--muted) / 0.5);
        }
        .tiptap-content .column-resize-handle {
          position: absolute;
          right: -2px; top: 0; bottom: -2px;
          width: 4px;
          background-color: hsl(var(--primary) / 0.5);
          pointer-events: none;
        }

        /* Task List Styling */
        .tiptap-content ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .tiptap-content ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }
        .tiptap-content ul[data-type="taskList"] li > label { margin-top: 0.3rem; user-select: none; cursor: pointer; }
        .tiptap-content ul[data-type="taskList"] li > label input[type="checkbox"] { 
          accent-color: hsl(var(--primary)); 
          transform: scale(1.15); 
          cursor: pointer; 
          border-radius: 4px;
        }
        .tiptap-content ul[data-type="taskList"] li > div { flex: 1; }
        
        /* Placeholder */
        .tiptap-content p.is-editor-empty:first-child::before {
          content: 'Mulai menulis mahakaryamu di sini... (ketik [[ untuk tautan)';
          float: left;
          color: hsl(var(--muted-foreground));
          pointer-events: none;
          height: 0;
          opacity: 0.6;
        }
      `}} />

      {/* RIBBON TOOLBAR GOOGLE DOCS STYLE */}
      <div className="w-full flex flex-wrap items-center gap-2 md:gap-3 px-3 py-2 border-b border-border bg-muted/30 sticky top-0 z-20 backdrop-blur-xl">
        
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border/60 shrink-0">
          <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={Undo} title="Batal (Ctrl+Z)" />
          <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={Redo} title="Ulangi (Ctrl+Y)" />
        </div>

        {/* Text Style Dropdown */}
        <div className="flex items-center pr-2 border-r border-border/60 shrink-0">
          <select 
            className="text-sm bg-transparent hover:bg-muted focus:bg-background border border-transparent rounded-md px-2 py-1.5 outline-none text-foreground font-semibold cursor-pointer transition-colors"
            onChange={(e) => {
              const val = e.target.value;
              if (val === 'P') editor.chain().focus().setParagraph().run();
              else if (val === 'H1') editor.chain().focus().toggleHeading({ level: 1 }).run();
              else if (val === 'H2') editor.chain().focus().toggleHeading({ level: 2 }).run();
              else if (val === 'H3') editor.chain().focus().toggleHeading({ level: 3 }).run();
              else if (val === 'H4') editor.chain().focus().toggleHeading({ level: 4 }).run();
            }}
            value={getActiveTextStyle()}
          >
            <option value="P">Teks Normal</option>
            <option value="H1">Heading 1</option>
            <option value="H2">Heading 2</option>
            <option value="H3">Heading 3</option>
            <option value="H4">Heading 4</option>
          </select>
        </div>

        {/* Font Formatting */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border/60 shrink-0">
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="Tebal (Ctrl+B)" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} title="Miring (Ctrl+I)" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={UnderlineIcon} title="Garis Bawah (Ctrl+U)" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} icon={Strikethrough} title="Coret Tengah" />
        </div>

        {/* Text Alignment */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border/60 shrink-0">
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} title="Rata Kiri" />
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} title="Rata Tengah" />
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} icon={AlignRight} title="Rata Kanan" />
          <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} icon={AlignJustify} title="Rata Kiri Kanan" />
        </div>

        {/* Lists */}
        <div className="flex items-center gap-0.5 pr-2 border-r border-border/60 shrink-0">
          <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="Daftar Simbol" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Daftar Angka" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} icon={CheckSquare} title="Daftar Tugas (Checklist)" />
        </div>

        {/* Insertions & Table Menu */}
        <div className="flex items-center gap-0.5 shrink-0 relative">
          
          {/* Dropdown Menu Tabel */}
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()} // FIX CRUCIAL
              onClick={() => setIsTableMenuOpen(!isTableMenuOpen)}
              className={cn("p-1.5 md:p-2 rounded-md transition-all flex items-center justify-center", editor.isActive('table') ? "bg-primary/20 text-primary shadow-sm" : "text-muted-foreground hover:bg-muted")}
              title="Menu Tabel"
            >
              <TableIcon className="w-4 h-4 md:w-4.5 md:h-4.5" />
            </button>

            {isTableMenuOpen && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-50 flex flex-col p-1.5 w-48 animate-in zoom-in-95">
                <button type="button" onMouseDown={(e) => e.preventDefault()} className="text-left px-3 py-2 text-xs font-semibold hover:bg-muted rounded-md transition-colors" onClick={() => { editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setIsTableMenuOpen(false); }}>Sisipkan Tabel</button>
                <div className="h-px bg-border/60 my-1 mx-1" />
                <button type="button" onMouseDown={(e) => e.preventDefault()} className="text-left px-3 py-1.5 text-xs hover:bg-muted rounded-md transition-colors" onClick={() => { editor.chain().focus().addRowAfter().run(); setIsTableMenuOpen(false); }}>+ Baris ke Bawah</button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} className="text-left px-3 py-1.5 text-xs hover:bg-muted rounded-md transition-colors" onClick={() => { editor.chain().focus().addColumnAfter().run(); setIsTableMenuOpen(false); }}>+ Kolom ke Kanan</button>
                <div className="h-px bg-border/60 my-1 mx-1" />
                <button type="button" onMouseDown={(e) => e.preventDefault()} className="text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors" onClick={() => { editor.chain().focus().deleteRow().run(); setIsTableMenuOpen(false); }}>Hapus Baris Ini</button>
                <button type="button" onMouseDown={(e) => e.preventDefault()} className="text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-md transition-colors" onClick={() => { editor.chain().focus().deleteColumn().run(); setIsTableMenuOpen(false); }}>Hapus Kolom Ini</button>
                <div className="h-px bg-border/60 my-1 mx-1" />
                <button type="button" onMouseDown={(e) => e.preventDefault()} className="text-left px-3 py-2 text-xs text-red-500 font-bold hover:bg-red-500/10 rounded-md transition-colors" onClick={() => { editor.chain().focus().deleteTable().run(); setIsTableMenuOpen(false); }}>Hapus Seluruh Tabel</button>
              </div>
            )}
          </div>

          <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} title="Kutipan (Blockquote)" />
          <ToolbarBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon={TerminalSquare} title="Blok Kode" />
          <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} icon={Minus} title="Garis Pembatas" />
          <ToolbarBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} icon={RemoveFormatting} title="Hapus Format" />
        </div>
      </div>

      {/* EDITOR AREA */}
      <div 
        className="flex-1 w-full bg-background cursor-text" 
        onClick={() => {
          if (window.getSelection()?.toString() === '') {
            editor.chain().focus().run();
          }
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}