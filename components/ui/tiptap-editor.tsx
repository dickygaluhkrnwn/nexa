"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Bold, Italic, List, ListOrdered, CheckSquare, Heading2 } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

interface TiptapEditorProps {
  content: string;
  onChange: (richText: string) => void;
}

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        // Hapus class prose bawaan karena kita akan menggunakan custom CSS di bawah
        class: 'tiptap-content focus:outline-none min-h-[250px] w-full p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary/50 transition-all">
      {/* Custom CSS untuk Tiptap
        Ini mencegah Tailwind mereset list style bawaan HTML sehingga bullet dan angka muncul 
      */}
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

      {/* Toolbar */}
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

      {/* Area Teks */}
      <EditorContent editor={editor} className="cursor-text" />
    </div>
  );
}