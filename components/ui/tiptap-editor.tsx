"use client";

import React, { forwardRef, useEffect, useImperativeHandle, useState, useRef } from 'react';
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Mention from '@tiptap/extension-mention';
import tippy, { Instance as TippyInstance } from 'tippy.js';
import { Bold, Italic, List, ListOrdered, CheckSquare, Heading2 } from 'lucide-react';

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

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  return (
    <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden min-w-[250px] max-w-[300px] flex flex-col p-1.5 z-[100] animate-in zoom-in-95 duration-200">
      <div className="px-2 py-1.5 border-b border-border/50 mb-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tautkan ke Catatan</p>
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

// --- KUSTOMISASI EKSTENSI MENTION (Gaya Obsidian [[...]]) ---
const CustomMention = Mention.extend({
  // FIX: Memastikan Tiptap mengenali elemen ini saat HTML diload kembali dari database
  parseHTML() {
    return [
      {
        tag: 'span[data-type="mention"]',
      },
    ];
  },
  renderHTML({ node, HTMLAttributes }) {
    // FIX: Memaksa injeksi data-type, data-id, dan data-label agar tidak hilang jadi teks biasa
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

  useEffect(() => {
    availableNotesRef.current = availableNotes;
  }, [availableNotes]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
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
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                });

                if (!props.clientRect) {
                  return;
                }

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

                if (!props.clientRect) {
                  return;
                }

                popup?.setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                });
              },
              onKeyDown(props) {
                if (props.event.key === 'Escape') {
                  popup?.hide();
                  return true;
                }
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
        class: 'tiptap-content focus:outline-none min-h-[250px] w-full p-4',
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
        return false;
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.extensionManager.extensions.forEach(ext => {
         if (ext.name === 'mention') {
             ext.options.suggestion.items = ({ query }: { query: string }) => {
                 return availableNotes
                    .filter(item => item.title.toLowerCase().includes(query.toLowerCase()))
                    .slice(0, 5);
             }
         }
      })
    }
  }, [availableNotes, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary/50 transition-all">
      <style dangerouslySetInnerHTML={{__html: `
        .tiptap-content { outline: none; }
        .tiptap-content p { margin-bottom: 0.75em; line-height: 1.6; }
        .tiptap-content h2 { font-size: 1.5rem; font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; line-height: 1.3; }
        .tiptap-content ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .tiptap-content ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
        .tiptap-content li { margin-bottom: 0.25rem; }
        .tiptap-content strong { font-weight: 700; }
        .tiptap-content em { font-style: italic; }
        
        /* Styling khusus untuk To-Do List (Checklist) */
        .tiptap-content ul[data-type="taskList"] { list-style: none; padding-left: 0; }
        .tiptap-content ul[data-type="taskList"] li { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }
        .tiptap-content ul[data-type="taskList"] li > label { margin-top: 0.2rem; user-select: none; cursor: pointer; }
        .tiptap-content ul[data-type="taskList"] li > label input[type="checkbox"] { accent-color: var(--primary); transform: scale(1.1); }
        .tiptap-content ul[data-type="taskList"] li > div { flex: 1; }
      `}} />

      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-border bg-muted/30">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded-md hover:bg-muted ${editor.isActive('heading', { level: 2 }) ? 'bg-muted text-primary' : ''}`}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded-md hover:bg-muted ${editor.isActive('bold') ? 'bg-muted text-primary' : ''}`}
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded-md hover:bg-muted ${editor.isActive('italic') ? 'bg-muted text-primary' : ''}`}
        >
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-border mx-1" /> {/* Divider */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded-md hover:bg-muted ${editor.isActive('bulletList') ? 'bg-muted text-primary' : ''}`}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded-md hover:bg-muted ${editor.isActive('orderedList') ? 'bg-muted text-primary' : ''}`}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-2 rounded-md hover:bg-muted ${editor.isActive('taskList') ? 'bg-muted text-primary' : ''}`}
        >
          <CheckSquare className="w-4 h-4" />
        </button>
      </div>

      <EditorContent editor={editor} className="cursor-text" />
    </div>
  );
}