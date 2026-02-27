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
        class: 'prose prose-sm sm:prose-base dark:prose-invert focus:outline-none min-h-[200px] w-full max-w-none p-4',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary/50 transition-all">
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