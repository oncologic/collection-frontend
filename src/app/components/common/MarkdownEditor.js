import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

const MarkdownEditor = ({ content, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    editable: true,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const addTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run();
  };

  return (
    <div className="markdown-editor border rounded-md">
      <div className="border-b p-2 flex gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded ${
            editor?.isActive("bold") ? "bg-gray-200" : ""
          }`}
        >
          Bold
        </button>
        <button onClick={addTable} className="p-1 rounded">
          Add Table
        </button>
        {/* Add more toolbar buttons as needed */}
      </div>
      <EditorContent
        editor={editor}
        className="p-4 prose prose-sm max-w-none"
      />
    </div>
  );
};

export default MarkdownEditor;
