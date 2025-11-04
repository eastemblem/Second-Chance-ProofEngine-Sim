import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Heading2, 
  Link as LinkIcon,
  Undo,
  Redo
} from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function RichTextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start typing...', 
  editable = true 
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-purple-400 underline cursor-pointer hover:text-purple-300',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when content prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      console.log('Updating editor content to:', content);
      editor.commands.setContent(content);
    }
  }, [editor, content]);

  if (!editor) {
    return null;
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <div className="border border-purple-500/30 rounded-lg bg-slate-800/50 overflow-hidden">
      {editable && (
        <div className="flex items-center gap-1 p-2 border-b border-purple-500/20 bg-slate-900/50 flex-wrap">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`}
            data-testid="button-bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`}
            data-testid="button-italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`}
            data-testid="button-underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-purple-500/20 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`h-8 w-8 p-0 ${editor.isActive('heading', { level: 2 }) ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`}
            data-testid="button-heading"
          >
            <Heading2 className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-purple-500/20 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`}
            data-testid="button-bullet-list"
          >
            <List className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`}
            data-testid="button-ordered-list"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-purple-500/20 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleLink}
            className={`h-8 w-8 p-0 ${editor.isActive('link') ? 'bg-purple-500/20 text-purple-400' : 'text-gray-400 hover:text-white'}`}
            data-testid="button-link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <div className="w-px h-6 bg-purple-500/20 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white disabled:opacity-30"
            data-testid="button-undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0 text-gray-400 hover:text-white disabled:opacity-30"
            data-testid="button-redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <EditorContent 
        editor={editor} 
        className="prose prose-invert max-w-none p-4 min-h-[150px] text-gray-200 focus:outline-none
          prose-headings:text-white prose-headings:font-bold prose-headings:mb-2
          prose-h2:text-xl prose-h3:text-lg
          prose-p:my-2 prose-p:leading-relaxed
          prose-ul:my-2 prose-ul:list-disc prose-ul:pl-6
          prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-6
          prose-li:my-1
          prose-strong:text-white prose-strong:font-semibold
          prose-em:italic
          [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[150px]
          [&_.ProseMirror>p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror>p.is-editor-empty:first-child::before]:text-gray-500
          [&_.ProseMirror>p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror>p.is-editor-empty:first-child::before]:pointer-events-none
          [&_.ProseMirror>p.is-editor-empty:first-child::before]:h-0"
        data-testid="rich-text-content"
      />
    </div>
  );
}
