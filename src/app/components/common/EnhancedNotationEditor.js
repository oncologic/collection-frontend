import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useState, useRef, useEffect, useCallback, useId, useMemo } from "react";
import { useOCR } from "../../hooks/useAI";
import { Markdown } from "tiptap-markdown";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import { Color } from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import Highlight from "@tiptap/extension-highlight";
import "../../styles/enhanced-editor.css";
import {
  FaRedo,
  FaUndo,
  FaImage,
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaListUl,
  FaListOl,
  FaLink,
  FaTable,
  FaMagic,
  FaCheck,
  FaSpinner,
  FaExpand,
  FaQuoteRight,
  FaMinus,
  FaCode,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useDebounce } from "../../hooks/useDebounce";
import {
  useProcessInlineOCR,
  useUploadInlineImage,
} from "../../hooks/useNotationAttachments";

const EnhancedNotationEditor = ({
  content = "",
  onChange,
  onAutoSave,
  notationId = null,
  placeholder = "Type / for headings, lists, images, tables, and more...",
  readOnly = false,
  className = "",
  showOCR = true,
  autoSaveInterval = 10000,
}) => {
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showOCRDialog, setShowOCRDialog] = useState(false);
  const [ocrPrompt, setOcrPrompt] = useState("");
  const [saveStatus, setSaveStatus] = useState("saved");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [editorContent, setEditorContent] = useState(content || "");
  const [selectedImageNode, setSelectedImageNode] = useState(false);
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [slashMenuState, setSlashMenuState] = useState({
    isOpen: false,
    query: "",
    range: null,
    position: { top: 0, left: 0 },
  });
  const [selectedSlashIndex, setSelectedSlashIndex] = useState(0);

  const lastSavedContentRef = useRef(content || "");
  const onAutoSaveRef = useRef(onAutoSave);
  const editorShellRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileInputId = useId();

  const ocrMutation = useOCR();
  const uploadImageMutation = useUploadInlineImage(notationId);
  const inlineOcrMutation = useProcessInlineOCR(notationId);

  const textColors = [
    { name: "Default", value: null },
    { name: "Red", value: "#DC2626" },
    { name: "Orange", value: "#EA580C" },
    { name: "Amber", value: "#D97706" },
    { name: "Green", value: "#16A34A" },
    { name: "Blue", value: "#2563EB" },
    { name: "Purple", value: "#9333EA" },
    { name: "Pink", value: "#DB2777" },
    { name: "Gray", value: "#6B7280" },
  ];

  const highlightColors = [
    { name: "None", value: null },
    { name: "Yellow", value: "#FEF08A" },
    { name: "Green", value: "#BBF7D0" },
    { name: "Blue", value: "#BFDBFE" },
    { name: "Purple", value: "#E9D5FF" },
    { name: "Pink", value: "#FBCFE8" },
    { name: "Orange", value: "#FED7AA" },
    { name: "Red", value: "#FECACA" },
    { name: "Gray", value: "#E5E7EB" },
  ];

  const debouncedContent = useDebounce(editorContent, autoSaveInterval);

  const hideSlashMenu = useCallback(() => {
    setSlashMenuState((prev) =>
      prev.isOpen
        ? {
            ...prev,
            isOpen: false,
            query: "",
            range: null,
          }
        : prev
    );
    setSelectedSlashIndex(0);
  }, []);

  useEffect(() => {
    onAutoSaveRef.current = onAutoSave;
  }, [onAutoSave]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest("[data-editor-popover]")) {
        setShowTextColorPicker(false);
        setShowHighlightPicker(false);
      }
    };

    if (!showTextColorPicker && !showHighlightPicker) {
      return undefined;
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showHighlightPicker, showTextColorPicker]);

  useEffect(() => {
    if (!slashMenuState.isOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (!editorShellRef.current?.contains(event.target)) {
        hideSlashMenu();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [hideSlashMenu, slashMenuState.isOpen]);

  const updateSlashMenu = useCallback(
    (editorInstance) => {
      if (readOnly || !editorInstance || !editorShellRef.current) {
        hideSlashMenu();
        return;
      }

      const { selection } = editorInstance.state;
      if (!selection.empty) {
        hideSlashMenu();
        return;
      }

      const { $from } = selection;
      if (!$from.parent?.isTextblock) {
        hideSlashMenu();
        return;
      }

      const textBeforeCursor = $from.parent.textBetween(
        0,
        $from.parentOffset,
        "\n",
        "\n"
      );
      const slashMatch = textBeforeCursor.match(/^\s*\/([^\s/]*)$/);

      if (!slashMatch) {
        hideSlashMenu();
        return;
      }

      const shellRect = editorShellRef.current.getBoundingClientRect();
      const cursorCoords = editorInstance.view.coordsAtPos(selection.from);
      const menuWidth = 320;

      setSlashMenuState({
        isOpen: true,
        query: slashMatch[1].toLowerCase(),
        range: {
          from: selection.from - textBeforeCursor.length,
          to: selection.from,
        },
        position: {
          top:
            cursorCoords.bottom -
            shellRect.top +
            editorShellRef.current.scrollTop +
            10,
          left: Math.max(
            12,
            Math.min(cursorCoords.left - shellRect.left, shellRect.width - menuWidth - 12)
          ),
        },
      });
    },
    [hideSlashMenu, readOnly]
  );

  const CustomImage = Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        attachmentId: {
          default: null,
        },
        imageKey: {
          default: null,
          parseHTML: (element) => element.getAttribute("data-image-key"),
          renderHTML: (attributes) => {
            if (!attributes.imageKey) {
              return {};
            }

            return {
              "data-image-key": attributes.imageKey,
            };
          },
        },
        ocrText: {
          default: null,
        },
        width: {
          default: null,
          renderHTML: (attributes) => {
            if (!attributes.width) {
              return {};
            }

            return {
              width: attributes.width,
              style: `width: ${attributes.width}px`,
            };
          },
        },
        height: {
          default: null,
          renderHTML: (attributes) => {
            if (!attributes.height) {
              return {};
            }

            return {
              height: attributes.height,
              style: `height: ${attributes.height}px`,
            };
          },
        },
      };
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
      }),
      CustomImage,
      Placeholder.configure({
        placeholder: placeholder || "Start writing your notation...",
        emptyEditorClass: "is-editor-empty",
      }),
      Markdown,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color.configure({
        types: ["textStyle"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: content || "",
    editable: !readOnly,
    onCreate: ({ editor: editorInstance }) => {
      if (!readOnly) {
        editorInstance.commands.focus();
      }
      updateSlashMenu(editorInstance);
    },
    onUpdate: ({ editor: editorInstance }) => {
      const newContent = editorInstance.getHTML();
      setEditorContent(newContent);
      updateSlashMenu(editorInstance);
      onChange?.(newContent);
    },
    onSelectionUpdate: ({ editor: editorInstance }) => {
      let hasImage = false;
      const { from, to } = editorInstance.state.selection;

      editorInstance.state.doc.nodesBetween(from, to, (node) => {
        if (node.type.name === "image") {
          hasImage = true;
          return false;
        }
        return undefined;
      });

      setSelectedImageNode(hasImage);
      updateSlashMenu(editorInstance);
    },
  });

  useEffect(() => {
    if (!editor || editor.isFocused || content === editorContent) {
      return;
    }

    setEditorContent(content || "");
    lastSavedContentRef.current = content || "";
    editor.commands.setContent(content || "");
  }, [content, editor, editorContent]);

  useEffect(() => {
    if (debouncedContent == null || !notationId || !onAutoSaveRef.current) {
      return;
    }

    if (debouncedContent === lastSavedContentRef.current) {
      return;
    }

    const performAutoSave = async () => {
      setSaveStatus("saving");

      try {
        await onAutoSaveRef.current(debouncedContent);
        setSaveStatus("saved");
        setLastSavedAt(new Date());
        lastSavedContentRef.current = debouncedContent;
      } catch (error) {
        console.error("Auto-save failed:", error);
        setSaveStatus("error");
        toast.error("Failed to auto-save");
      }
    };

    performAutoSave();
  }, [debouncedContent, notationId]);

  const openImagePicker = useCallback(() => {
    hideSlashMenu();
    fileInputRef.current?.click();
  }, [hideSlashMenu]);

  const handleImageUpload = useCallback(
    async (file) => {
      if (!file || !editor) return;

      setIsProcessingImage(true);
      hideSlashMenu();

      if (!notationId) {
        try {
          const reader = new FileReader();
          reader.onloadend = () => {
            editor
              .chain()
              .focus()
              .insertContent({
                type: "image",
                attrs: {
                  src: reader.result,
                  width: 500,
                  height: null,
                },
              })
              .run();
            setIsProcessingImage(false);
            toast.success("Image added (will be uploaded when notation is saved)");
          };
          reader.readAsDataURL(file);
          return;
        } catch (error) {
          console.error("Failed to add image:", error);
          toast.error("Failed to add image");
          setIsProcessingImage(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append("attachment", file);
      formData.append("position", String(editor.state.selection.from));

      try {
        const response = await uploadImageMutation.mutateAsync(formData);
        const imageUrl =
          response.attachment.presignedUrl || response.attachment.accessUrl;

        editor
          .chain()
          .focus()
          .insertContent({
            type: "image",
            attrs: {
              src: imageUrl,
              attachmentId: response.attachment.id,
              imageKey: response.attachment.imageKey,
              alt: "Uploaded image",
              width: 500,
            },
          })
          .run();

        setSelectedImage({
          url: imageUrl,
          attachmentId: response.attachment.id,
        });

        if (showOCR) {
          setShowOCRDialog(true);
        }

        toast.success("Image uploaded successfully");
      } catch (error) {
        console.error("Image upload failed:", error);
        toast.error("Failed to upload image");
      } finally {
        setIsProcessingImage(false);
      }
    },
    [editor, hideSlashMenu, notationId, showOCR, uploadImageMutation]
  );

  const handleOCRProcess = async () => {
    if (!selectedImage) return;

    setIsProcessingImage(true);

    try {
      const ocrPromptText =
        ocrPrompt || "Extract all text from this image and format it nicely";
      const result =
        notationId && selectedImage.attachmentId
          ? await inlineOcrMutation.mutateAsync({
              attachmentId: selectedImage.attachmentId,
              imageUrl: selectedImage.url,
              prompt: ocrPromptText,
            })
          : await ocrMutation.mutateAsync({
              imageUrl: selectedImage.url,
              prompt: ocrPromptText,
            });

      const extractedText = result?.content?.text || result?.ocrResult?.text;

      if (extractedText) {
        let formattedText = extractedText;
        formattedText = formattedText.replace(/\n{3,}/g, "\n\n");
        formattedText = formattedText.replace(/([.!?])\n(?=[A-Z])/g, "$1\n\n");
        formattedText = formattedText.trim();

        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(formattedText);
        } else {
          const textarea = document.createElement("textarea");
          textarea.value = formattedText;
          textarea.setAttribute("readonly", "");
          textarea.style.position = "absolute";
          textarea.style.left = "-9999px";
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand("copy");
          document.body.removeChild(textarea);
        }

        toast.success("Extracted text copied to clipboard");
      } else {
        toast.error("No text was extracted from this image");
      }

      setShowOCRDialog(false);
      setOcrPrompt("");
      setSelectedImage(null);
    } catch (error) {
      console.error("OCR processing failed:", error);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (file && file.type.startsWith("image/")) {
      handleImageUpload(file);
      return;
    }

    toast.error("Please select a valid image file");
  };

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      hideSlashMenu();

      const file = event.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        handleImageUpload(file);
      }
    },
    [handleImageUpload, hideSlashMenu]
  );

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const unwrapBlockFormatting = useCallback(
    (chain, targetBlockType) => {
      let nextChain = chain;

      if (editor?.isActive("codeBlock") && targetBlockType !== "codeBlock") {
        nextChain = nextChain.exitCode();
      }

      if (editor?.isActive("blockquote") && targetBlockType !== "blockquote") {
        nextChain = nextChain.toggleBlockquote();
      }

      return nextChain;
    },
    [editor]
  );

  const applyBlockType = useCallback(
    (blockType) => {
      if (!editor) return;

      let chain = unwrapBlockFormatting(editor.chain().focus(), blockType);

      switch (blockType) {
        case "heading-1":
          chain.setHeading({ level: 1 }).run();
          break;
        case "heading-2":
          chain.setHeading({ level: 2 }).run();
          break;
        case "heading-3":
          chain.setHeading({ level: 3 }).run();
          break;
        case "blockquote":
          if (editor.isActive("blockquote")) {
            chain.toggleBlockquote().setParagraph().run();
          } else {
            chain.setParagraph().toggleBlockquote().run();
          }
          break;
        case "codeBlock":
          if (editor.isActive("codeBlock")) {
            chain.exitCode().run();
          } else {
            chain.setCodeBlock().run();
          }
          break;
        case "paragraph":
        default:
          chain.setParagraph().run();
          break;
      }
    },
    [editor, unwrapBlockFormatting]
  );

  const insertDivider = useCallback(() => {
    editor?.chain().focus().setHorizontalRule().run();
  }, [editor]);

  const insertTable = useCallback(() => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const toggleBulletList = useCallback(() => {
    editor?.chain().focus().toggleBulletList().run();
  }, [editor]);

  const toggleOrderedList = useCallback(() => {
    editor?.chain().focus().toggleOrderedList().run();
  }, [editor]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;

    const currentUrl = editor.getAttributes("link").href || "";
    const nextUrl = window.prompt(
      "Enter a URL. Leave blank to remove the link.",
      currentUrl
    );

    if (nextUrl === null) {
      return;
    }

    const trimmedUrl = nextUrl.trim();

    if (!trimmedUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    const normalizedUrl = /^https?:\/\//i.test(trimmedUrl)
      ? trimmedUrl
      : `https://${trimmedUrl}`;

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: normalizedUrl })
      .run();
  }, [editor]);

  const slashCommands = useMemo(
    () => [
      {
        id: "paragraph",
        badge: "T",
        title: "Text",
        description: "Start a normal paragraph",
        keywords: ["paragraph body normal text"],
        execute: () => applyBlockType("paragraph"),
      },
      {
        id: "heading-1",
        badge: "H1",
        title: "Heading 1",
        description: "Large section heading",
        keywords: ["title heading h1 large"],
        execute: () => applyBlockType("heading-1"),
      },
      {
        id: "heading-2",
        badge: "H2",
        title: "Heading 2",
        description: "Medium section heading",
        keywords: ["heading h2 subtitle"],
        execute: () => applyBlockType("heading-2"),
      },
      {
        id: "heading-3",
        badge: "H3",
        title: "Heading 3",
        description: "Small section heading",
        keywords: ["heading h3 subheading"],
        execute: () => applyBlockType("heading-3"),
      },
      {
        id: "bullet-list",
        badge: "UL",
        title: "Bulleted List",
        description: "Create a bulleted list",
        keywords: ["list bullet unordered"],
        execute: toggleBulletList,
      },
      {
        id: "ordered-list",
        badge: "OL",
        title: "Numbered List",
        description: "Create a numbered list",
        keywords: ["list ordered numbered"],
        execute: toggleOrderedList,
      },
      {
        id: "blockquote",
        badge: "Q",
        title: "Quote",
        description: "Emphasize a quoted block",
        keywords: ["quote blockquote callout"],
        execute: () => applyBlockType("blockquote"),
      },
      {
        id: "code-block",
        badge: "<>",
        title: "Code Block",
        description: "Insert monospaced code",
        keywords: ["code snippet preformatted"],
        execute: () => applyBlockType("codeBlock"),
      },
      {
        id: "divider",
        badge: "---",
        title: "Divider",
        description: "Insert a horizontal rule",
        keywords: ["line separator divider hr"],
        execute: insertDivider,
      },
      {
        id: "table",
        badge: "Tbl",
        title: "Table",
        description: "Insert a 3x3 table",
        keywords: ["table grid columns rows"],
        execute: insertTable,
      },
      {
        id: "image",
        badge: "Img",
        title: "Image",
        description: "Upload or drop in an image",
        keywords: ["image photo picture upload"],
        execute: openImagePicker,
      },
    ],
    [
      applyBlockType,
      insertDivider,
      insertTable,
      openImagePicker,
      toggleBulletList,
      toggleOrderedList,
    ]
  );

  const filteredSlashCommands = useMemo(() => {
    const normalizedQuery = slashMenuState.query.trim().toLowerCase();

    if (!normalizedQuery) {
      return slashCommands;
    }

    return slashCommands.filter((command) =>
      [command.title, command.description, ...(command.keywords || [])]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [slashCommands, slashMenuState.query]);

  useEffect(() => {
    setSelectedSlashIndex(0);
  }, [slashMenuState.isOpen, slashMenuState.query]);

  useEffect(() => {
    if (selectedSlashIndex < filteredSlashCommands.length) {
      return;
    }

    setSelectedSlashIndex(0);
  }, [filteredSlashCommands.length, selectedSlashIndex]);

  const applySlashCommand = useCallback(
    (command) => {
      if (!editor || !command) return;

      if (slashMenuState.range) {
        editor.chain().focus().deleteRange(slashMenuState.range).run();
      }

      hideSlashMenu();
      command.execute();
    },
    [editor, hideSlashMenu, slashMenuState.range]
  );

  const handleEditorKeyDown = useCallback(
    (event) => {
      if (!slashMenuState.isOpen) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (filteredSlashCommands.length === 0) return;
        setSelectedSlashIndex((prev) => (prev + 1) % filteredSlashCommands.length);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (filteredSlashCommands.length === 0) return;
        setSelectedSlashIndex(
          (prev) =>
            (prev - 1 + filteredSlashCommands.length) % filteredSlashCommands.length
        );
        return;
      }

      if (event.key === "Tab" || event.key === "Enter") {
        if (filteredSlashCommands.length === 0) return;
        event.preventDefault();
        applySlashCommand(filteredSlashCommands[selectedSlashIndex]);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        hideSlashMenu();
        return;
      }
    },
    [
      applySlashCommand,
      filteredSlashCommands,
      hideSlashMenu,
      selectedSlashIndex,
      slashMenuState.isOpen,
    ]
  );

  const handleEmptyBlockquoteExit = useCallback(
    (event) => {
      if (!editor || slashMenuState.isOpen || event.key !== "Enter" || event.shiftKey) {
        return;
      }

      if (!editor.isActive("blockquote")) {
        return;
      }

      const { empty, $from } = editor.state.selection;
      if (!empty || $from.parent.textContent.length > 0) {
        return;
      }

      event.preventDefault();
      editor.chain().focus().toggleBlockquote().setParagraph().run();
    },
    [editor, slashMenuState.isOpen]
  );

  const resizeSelectedImage = (size) => {
    if (!editor) return;

    let width;

    switch (size) {
      case "small":
        width = 300;
        break;
      case "medium":
        width = 500;
        break;
      case "large":
        width = 800;
        break;
      case "full":
        width = null;
        break;
      default:
        width = 500;
    }

    editor
      .chain()
      .focus()
      .updateAttributes("image", {
        width,
        height: null,
      })
      .run();
  };

  const focusTailParagraph = useCallback(() => {
    if (!editor) return;

    const lastNode = editor.state.doc.lastChild;
    const lastNodeType = lastNode?.type?.name;

    if (lastNodeType !== "paragraph") {
      editor
        .chain()
        .focus()
        .insertContentAt(editor.state.doc.content.size, {
          type: "paragraph",
        })
        .focus("end")
        .run();
      return;
    }

    editor.commands.focus("end");
  }, [editor]);

  const handleEditorSurfaceClick = useCallback(
    (event) => {
      if (!editor) return;

      const clickedEditorSurface =
        event.target === event.currentTarget || event.target === editor.view.dom;

      if (!clickedEditorSurface) {
        return;
      }

      focusTailParagraph();
    },
    [editor, focusTailParagraph]
  );

  if (!editor) return null;

  const activeBlockType = editor.isActive("heading", { level: 1 })
    ? "heading-1"
    : editor.isActive("heading", { level: 2 })
    ? "heading-2"
    : editor.isActive("heading", { level: 3 })
    ? "heading-3"
    : editor.isActive("blockquote")
    ? "blockquote"
    : editor.isActive("codeBlock")
    ? "codeBlock"
    : "paragraph";

  return (
    <div className={`enhanced-notation-editor ${className}`}>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 p-2">
          <div className="flex items-center gap-2 border-r pr-2">
            <select
              value={activeBlockType}
              onChange={(event) => applyBlockType(event.target.value)}
              className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none"
              aria-label="Text block type"
            >
              <option value="paragraph">Text</option>
              <option value="heading-1">Heading 1</option>
              <option value="heading-2">Heading 2</option>
              <option value="heading-3">Heading 3</option>
              <option value="blockquote">Quote</option>
              <option value="codeBlock">Code Block</option>
            </select>
            <button
              type="button"
              onClick={insertDivider}
              className="rounded p-2 hover:bg-gray-200"
              title="Insert Divider"
            >
              <FaMinus />
            </button>
          </div>

          <div className="flex gap-1 border-r pr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`rounded p-2 hover:bg-gray-200 ${
                editor.isActive("bold") ? "bg-gray-200" : ""
              }`}
              title="Bold"
            >
              <FaBold />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`rounded p-2 hover:bg-gray-200 ${
                editor.isActive("italic") ? "bg-gray-200" : ""
              }`}
              title="Italic"
            >
              <FaItalic />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`rounded p-2 hover:bg-gray-200 ${
                editor.isActive("strike") ? "bg-gray-200" : ""
              }`}
              title="Strikethrough"
            >
              <FaStrikethrough />
            </button>
          </div>

          <div className="flex gap-1 border-r pr-2">
            <div className="relative" data-editor-popover>
              <button
                type="button"
                onClick={() => {
                  setShowTextColorPicker((prev) => !prev);
                  setShowHighlightPicker(false);
                }}
                className={`rounded p-1.5 hover:bg-gray-200 ${
                  showTextColorPicker ? "bg-gray-200" : ""
                }`}
                title="Text Color"
              >
                <span
                  className="text-sm font-bold"
                  style={{ color: editor.getAttributes("textStyle").color || "#000000" }}
                >
                  A
                </span>
                <div
                  className="mt-0.5 h-0.5"
                  style={{
                    backgroundColor:
                      editor.getAttributes("textStyle").color || "#000000",
                  }}
                />
              </button>

              {showTextColorPicker && (
                <div
                  className="absolute left-0 top-full z-50 mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-2xl"
                  style={{ minWidth: "240px" }}
                >
                  <div className="mb-2 text-xs font-semibold text-gray-600">
                    TEXT COLOR
                  </div>
                  <div className="space-y-2">
                    {textColors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => {
                          if (color.value) {
                            editor.chain().focus().setColor(color.value).run();
                          } else {
                            editor.chain().focus().unsetColor().run();
                          }
                          setShowTextColorPicker(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-50 ${
                          (color.value === null &&
                            !editor.getAttributes("textStyle").color) ||
                          editor.getAttributes("textStyle").color === color.value
                            ? "bg-blue-50 ring-1 ring-blue-300"
                            : ""
                        }`}
                      >
                        <div
                          className="h-6 w-6 rounded border-2 border-gray-300"
                          style={{
                            backgroundColor: color.value || "#ffffff",
                            backgroundImage: !color.value
                              ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                              : "none",
                            backgroundSize: "8px 8px",
                            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                          }}
                        />
                        <span
                          className="text-sm font-medium"
                          style={{ color: color.value || "#000000" }}
                        >
                          {color.name}
                        </span>
                        {((color.value === null &&
                          !editor.getAttributes("textStyle").color) ||
                          editor.getAttributes("textStyle").color === color.value) && (
                          <FaCheck className="ml-auto text-xs text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative" data-editor-popover>
              <button
                type="button"
                onClick={() => {
                  setShowHighlightPicker((prev) => !prev);
                  setShowTextColorPicker(false);
                }}
                className={`rounded p-1.5 hover:bg-gray-200 ${
                  showHighlightPicker ? "bg-gray-200" : ""
                }`}
                title="Highlight Color"
              >
                <span
                  className="px-1 text-sm font-bold"
                  style={{
                    backgroundColor:
                      editor.getAttributes("highlight").color || "transparent",
                    color: editor.getAttributes("highlight").color
                      ? "#000000"
                      : "#666666",
                  }}
                >
                  A
                </span>
              </button>

              {showHighlightPicker && (
                <div
                  className="absolute left-0 top-full z-50 mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-2xl"
                  style={{ minWidth: "240px" }}
                >
                  <div className="mb-2 text-xs font-semibold text-gray-600">
                    HIGHLIGHT COLOR
                  </div>
                  <div className="space-y-2">
                    {highlightColors.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => {
                          if (color.value) {
                            editor
                              .chain()
                              .focus()
                              .setHighlight({ color: color.value })
                              .run();
                          } else {
                            editor.chain().focus().unsetHighlight().run();
                          }
                          setShowHighlightPicker(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded px-2 py-1.5 transition-colors hover:bg-gray-50 ${
                          (color.value === null && !editor.isActive("highlight")) ||
                          editor.getAttributes("highlight").color === color.value
                            ? "bg-blue-50 ring-1 ring-blue-300"
                            : ""
                        }`}
                      >
                        <div
                          className="h-6 w-6 rounded border-2 border-gray-300"
                          style={{
                            backgroundColor: color.value || "#ffffff",
                            backgroundImage: !color.value
                              ? "linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)"
                              : "none",
                            backgroundSize: "8px 8px",
                            backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                          }}
                        />
                        <span className="text-sm font-medium">{color.name}</span>
                        {((color.value === null && !editor.isActive("highlight")) ||
                          editor.getAttributes("highlight").color === color.value) && (
                          <FaCheck className="ml-auto text-xs text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-1 border-r pr-2">
            <button
              type="button"
              onClick={toggleBulletList}
              className={`rounded p-2 hover:bg-gray-200 ${
                editor.isActive("bulletList") ? "bg-gray-200" : ""
              }`}
              title="Bullet List"
            >
              <FaListUl />
            </button>
            <button
              type="button"
              onClick={toggleOrderedList}
              className={`rounded p-2 hover:bg-gray-200 ${
                editor.isActive("orderedList") ? "bg-gray-200" : ""
              }`}
              title="Ordered List"
            >
              <FaListOl />
            </button>
          </div>

          <div className="flex gap-1 border-r pr-2">
            <button
              type="button"
              onClick={handleSetLink}
              className={`rounded p-2 hover:bg-gray-200 ${
                editor.isActive("link") ? "bg-gray-200" : ""
              }`}
              title="Add or Edit Link"
            >
              <FaLink />
            </button>
            <button
              type="button"
              onClick={() => applyBlockType("blockquote")}
              className={`rounded p-2 hover:bg-gray-200 ${
                editor.isActive("blockquote") ? "bg-gray-200" : ""
              }`}
              title="Quote"
            >
              <FaQuoteRight />
            </button>
            <button
              type="button"
              onClick={() => applyBlockType("codeBlock")}
              className={`rounded p-2 hover:bg-gray-200 ${
                editor.isActive("codeBlock") ? "bg-gray-200" : ""
              }`}
              title="Code Block"
            >
              <FaCode />
            </button>
          </div>

          <div className="flex gap-1 border-r pr-2">
            <label
              htmlFor={isProcessingImage ? undefined : fileInputId}
              className={`flex items-center gap-1 rounded p-2 ${
                isProcessingImage
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:bg-gray-200"
              }`}
              title="Insert Image"
              aria-disabled={isProcessingImage}
            >
              {isProcessingImage ? (
                <FaSpinner className="animate-spin" />
              ) : (
                <FaImage />
              )}
              <span className="text-sm">Image</span>
            </label>
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isProcessingImage}
              className="sr-only"
            />

            {selectedImageNode && (
              <div className="flex items-center gap-1 border-l pl-2">
                <span className="text-xs text-gray-500">Size:</span>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    resizeSelectedImage("small");
                  }}
                  className="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200"
                  title="Small (300px)"
                >
                  S
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    resizeSelectedImage("medium");
                  }}
                  className="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200"
                  title="Medium (500px)"
                >
                  M
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    resizeSelectedImage("large");
                  }}
                  className="rounded px-2 py-1 text-xs font-semibold hover:bg-gray-200"
                  title="Large (800px)"
                >
                  L
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    resizeSelectedImage("full");
                  }}
                  className="rounded px-2 py-1 hover:bg-gray-200"
                  title="Full Width"
                >
                  <FaExpand className="text-xs" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-1 border-r pr-2">
            <button
              type="button"
              onClick={insertTable}
              className="rounded p-2 hover:bg-gray-200"
              title="Insert Table"
            >
              <FaTable />
            </button>
          </div>

          <div className="flex gap-1 border-r pr-2">
            <button
              type="button"
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="rounded p-2 hover:bg-gray-200 disabled:opacity-50"
              title="Undo"
            >
              <FaUndo />
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="rounded p-2 hover:bg-gray-200 disabled:opacity-50"
              title="Redo"
            >
              <FaRedo />
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
            <span className="hidden sm:inline">Type `/` for blocks and inserts</span>
            {notationId && onAutoSave && (
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <FaSpinner className="animate-spin" />
                    Saving...
                  </span>
                )}
                {saveStatus === "saved" && (
                  <span className="flex items-center gap-1 text-green-600">
                    <FaCheck />
                    Saved
                    {lastSavedAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(lastSavedAt).toLocaleTimeString()}
                      </span>
                    )}
                  </span>
                )}
                {saveStatus === "error" && (
                  <span className="text-red-600">Save failed</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div
        ref={editorShellRef}
        className="relative min-h-[300px] max-w-none bg-white p-4 prose prose-lg focus-within:outline-none"
        onDrop={!readOnly ? handleDrop : undefined}
        onDragOver={!readOnly ? handleDragOver : undefined}
        onKeyDownCapture={
          !readOnly
            ? (event) => {
                handleEditorKeyDown(event);
                handleEmptyBlockquoteExit(event);
              }
            : undefined
        }
        onClick={handleEditorSurfaceClick}
        style={{ cursor: "text" }}
      >
        <EditorContent editor={editor} className="min-h-[250px] outline-none" />

        {slashMenuState.isOpen && !readOnly && (
          <div
            className="absolute z-40 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
            style={slashMenuState.position}
          >
            <div className="border-b border-gray-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Slash Commands
            </div>
            <div className="max-h-80 overflow-y-auto py-1">
              {filteredSlashCommands.length > 0 ? (
                filteredSlashCommands.map((command, index) => (
                  <button
                    key={command.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      applySlashCommand(command);
                    }}
                    className={`flex w-full items-start gap-3 px-3 py-2 text-left transition-colors ${
                      index === selectedSlashIndex
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <div className="mt-0.5 min-w-[2.5rem] rounded-md bg-gray-100 px-2 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      {command.badge}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium">{command.title}</div>
                      <div className="text-xs text-gray-500">
                        {command.description}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-3 py-4 text-sm text-gray-500">
                  No commands match &quot;{slashMenuState.query}&quot;.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showOCRDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">Extract Text from Image</h3>
            <p className="mb-4 text-sm text-gray-600">
              Extract text with AI and copy it to your clipboard so you can
              paste it wherever you want.
            </p>
            <textarea
              value={ocrPrompt}
              onChange={(event) => setOcrPrompt(event.target.value)}
              placeholder="Optional: Describe what text to extract (e.g., 'Extract the table data' or 'Get the main heading')"
              className="mb-4 h-20 w-full resize-none rounded-lg border p-2"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowOCRDialog(false);
                  setOcrPrompt("");
                  setSelectedImage(null);
                }}
                className="rounded-lg px-4 py-2 text-gray-600 hover:bg-gray-100"
                disabled={isProcessingImage}
              >
                Skip
              </button>
              <button
                onClick={handleOCRProcess}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                disabled={isProcessingImage}
              >
                {isProcessingImage ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <FaMagic />
                    Extract and Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedNotationEditor;
