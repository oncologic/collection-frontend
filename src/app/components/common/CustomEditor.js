import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useState, useRef, useEffect } from "react";
import { useAIAssist } from "../../hooks/useAI";
import { useAuth } from "@clerk/nextjs";
import {
  FaRedo,
  FaUndo,
  FaPalette,
  FaFont,
  FaAlignLeft,
  FaEraser,
  FaDownload,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { Markdown } from "tiptap-markdown";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

const DefaultToolbar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="border-b p-2 flex flex-wrap gap-2">
      {/* Headers Group */}
      <div className="flex gap-1 border-r pr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1.5 rounded hover:bg-gray-100 ${
            editor.isActive("paragraph") ? "bg-gray-200" : ""
          }`}
          title="Paragraph"
        >
          P
        </button>
        {[1, 2, 3].map((level) => (
          <button
            key={level}
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level }).run()
            }
            className={`p-1.5 rounded hover:bg-gray-100 ${
              editor.isActive("heading", { level }) ? "bg-gray-200" : ""
            }`}
            title={`Heading ${level}`}
          >
            H{level}
          </button>
        ))}
      </div>

      {/* Text Style Group */}
      <div className="flex gap-1 border-r pr-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-gray-100 ${
            editor.isActive("bold") ? "bg-gray-200" : ""
          }`}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-gray-100 ${
            editor.isActive("italic") ? "bg-gray-200" : ""
          }`}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded hover:bg-gray-100 ${
            editor.isActive("strike") ? "bg-gray-200" : ""
          }`}
          title="Strikethrough"
        >
          <span className="line-through">S</span>
        </button>
        <button
          type="button"
          onClick={() => {
            try {
              editor.chain().focus().unsetAllMarks().run();

              if (editor.can().unsetColor) {
                editor.chain().focus().unsetColor().run();
              }

              if (editor.can().unsetFontSize) {
                editor.chain().focus().unsetFontSize().run();
              }

              if (editor.can().unsetFontFamily) {
                editor.chain().focus().unsetFontFamily().run();
              }
            } catch (e) {
              console.warn("Error clearing formatting:", e);
              // Basic fallback
              editor.chain().focus().unsetAllMarks().run();
            }
          }}
          className="p-1.5 rounded hover:bg-gray-100 flex items-center"
          title="Clear Formatting"
        >
          <FaEraser className="text-gray-700" />
        </button>
        <button
          type="button"
          onClick={() => {
            let url = window.prompt("Enter URL");

            if (url) {
              // Prepend 'https://' if the URL does not start with either http:// or https://
              if (!/^https?:\/\//i.test(url)) {
                url = `https://${url}`;
              }
              editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run();
            } else {
              editor.chain().focus().unsetLink().run();
            }
          }}
          className={`p-1.5 rounded hover:bg-gray-100 ${
            editor.isActive("link") ? "bg-gray-200" : ""
          }`}
          title="Link"
        >
          <span className="underline">Link</span>
        </button>
      </div>

      {/* Alignment Group */}
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
          title="Undo"
        >
          <FaUndo />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
          title="Redo"
        >
          <FaRedo />
        </button>
      </div>
    </div>
  );
};

const CustomEditor = ({
  content,
  onChange,
  readOnly = true,
  contextDetails = {},
  promptPlaceholder = "Add specific instructions for AI...",
  transparent = false,
  textColor = "text-gray-700",
  textSize = "text-base",
  toolbar,
  showAIAssist = true,
  scrollable = true,
  compact = false,
  editable = true,
  className = "",
  height = "350px",
  maxHeight = "600px",
  showBorder = false,
}) => {
  const { getToken } = useAuth();
  const [showPrompt, setShowPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [contentType, setContentType] = useState("");
  const [languageStyle, setLanguageStyle] = useState("");
  const [externalContent, setExternalContent] = useState("");
  const aiAssist = useAIAssist();

  // Normalize content to prevent React errors with objects
  const normalizeContent = (content) => {
    if (!content) return "";

    // If content is an object, stringify it
    if (typeof content === "object" && content !== null) {
      try {
        return JSON.stringify(content);
      } catch (e) {
        console.error("Error stringifying content:", e);
        return "";
      }
    }

    return content;
  };

  const contentTypes = [
    { id: "event", label: "Event" },
    { id: "blog", label: "Blog" },
    { id: "resource", label: "Resource" },
    { id: "conference", label: "Conference" },
    { id: "support", label: "Support" },
    { id: "webinar", label: "Webinar" },
    { id: "video", label: "Video" },
    { id: "survey", label: "Survey" },
    { id: "fundraiser", label: "Fundraiser" },
    { id: "collection", label: "Collection" },
    { id: "supportGroup", label: "Support Group" },
    { id: "panel", label: "Panel" },
    { id: "trials", label: "Trials" },
    { id: "other", label: "Other" },
  ];

  const languageStyles = [
    { id: "future", label: "Future Language" },
    { id: "past", label: "Past Language" },
  ];

  // Process textColor to handle both Tailwind classes and hex values
  const processedTextColor =
    textColor?.startsWith("#") || textColor?.startsWith("rgb")
      ? "" // If it's a hex or RGB value, we'll handle it in the style attribute
      : textColor; // Otherwise use the Tailwind class

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        table: false,
        bulletList: {
          keepMarks: true,
          keepAttributes: true,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: true,
        },
        code: {
          HTMLAttributes: {
            class: "bg-gray-100 rounded px-1",
          },
        },
      }),
      Table.configure({
        HTMLAttributes: {
          class: "border-collapse table-auto w-full my-4",
        },
        resizable: false,
        allowTableNodeSelection: true,
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border-b border-gray-200",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class:
            "border-b-2 border-gray-300 bg-gray-50 p-2 text-left font-semibold",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: `${showBorder ? "border border-gray-200 p-2" : ""}`,
        },
      }),
      Link.configure({
        HTMLAttributes: {
          class: "text-blue-600 hover:text-blue-800 underline",
        },
      }),
      Image.extend({
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
            },
            height: {
              default: null,
            },
            style: {
              default: null,
            },
          };
        },
      }).configure({
        HTMLAttributes: {
          class: "rounded-lg my-4 cursor-pointer image-downloadable",
        },
        inline: false,
        allowBase64: true,
      }),
      Markdown.configure({
        html: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: normalizeContent(content),
    onUpdate: ({ editor }) => {
      if (contextDetails.parseMarkdown) {
        const markdown = editor.storage.markdown.getMarkdown();
        onChange?.(markdown);
      } else {
        onChange?.(editor.getHTML());
      }
    },
    editable: editable && !readOnly,
    editorProps: {
      attributes: {
        class: `prose prose-base max-w-none w-full focus:outline-none ${
          scrollable ? "overflow-y-auto" : ""
        } prose-headings:mb-3 prose-p:my-1 prose-p:leading-normal prose-p:text-left ${processedTextColor} ${textSize} ${
          compact ? "prose-p:my-0" : ""
        } ${!editable || readOnly ? "cursor-default" : "cursor-text"}`,
        style:
          textColor?.startsWith("#") || textColor?.startsWith("rgb")
            ? `color: ${textColor};`
            : undefined,
      },
      handlePaste: (view, event) => {
        if (!editable || readOnly) return true;

        const text = event.clipboardData?.getData("text/plain");
        const html = event.clipboardData?.getData("text/html");

        // Only handle obvious markdown tables
        if (text && isMarkdownTable(text)) {
          event.preventDefault();

          try {
            // Process markdown table
            const tableHTML = convertMarkdownTableToHTML(text);
            if (tableHTML) {
              editor.commands.insertContent(tableHTML);
              return true;
            }
          } catch (error) {
            console.error("Error pasting table:", error);
          }

          // If table processing failed, fall through to default paste handler
        }

        // Let the editor handle regular content
        return false;
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          if (!editable || readOnly) {
            if (
              ![
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                "PageUp",
                "PageDown",
                "Home",
                "End",
              ].includes(event.key)
            ) {
              event.preventDefault();
              return true;
            }
          }
          return false;
        },
        click: (view, event) => {
          if (!editable || readOnly) {
            return false;
          }
          return false;
        },
      },
    },
  });

  const handleAIAssist = async () => {
    try {
      const languageContext =
        languageStyle === "future"
          ? "Use future tense and forward-looking language"
          : languageStyle === "past"
            ? "Use past tense and retrospective language."
            : "";

      let contentTypeLabel = "";

      switch (contentType) {
        case "event":
          contentTypeLabel = "Generate a description for this event";
          break;
        case "blog":
          contentTypeLabel = "Generate a description for this blog";
          break;
        case "resource":
          contentTypeLabel = "Generate a description for this resource";
          break;
        case "conference":
          contentTypeLabel = "Generate a description for this conference";
          break;
        case "webinar":
          contentTypeLabel = "Generate a description for this webinar";
          break;
        case "video":
          contentTypeLabel = "Generate a description for this video";
          break;
        case "survey":
          contentTypeLabel = "Generate a description for this survey";
          break;
        case "other":
          contentTypeLabel = "Generate a description for this other content";
          break;
        case "fundraiser":
          contentTypeLabel = "Generate a description for this fundraiser";
          break;
        case "collection":
          contentTypeLabel = "Generate a description for this collection";
          break;
        default:
          contentTypeLabel = "Genarate a summary for this content";
          break;
      }
      const enhancedPrompt = `${contentTypeLabel}. ${languageContext} ${customPrompt}. Don't use traditional ai words such as delves into, explores, captivates, and more and this should be a friendly and engaging description, not over hyped`;

      const result = await aiAssist.mutateAsync({
        prompt: enhancedPrompt,
        currentContent: editor?.getHTML() || "",
        contextDetails: {
          ...contextDetails,
          contentType,
          contentTypeLabel: contentTypes.find((type) => type.id === contentType)
            ?.label,
        },
        externalContent,
      });

      if (result.content && editor) {
        editor.commands.setContent(result.content);
        onChange?.(result.content);
      }
    } finally {
      setShowPrompt(false);
      setCustomPrompt("");
      setExternalContent("");
      setContentType("");
      setLanguageStyle("");
    }
  };

  // Handle image downloads with download button overlay and auto-refresh expired images
  useEffect(() => {
    if (!editor || (editable && !readOnly)) return; // Only enable downloads in read-only mode

    const addDownloadButtons = () => {
      const editorElement = editor.view.dom;
      const images = editorElement.querySelectorAll("img.image-downloadable");

      images.forEach((img) => {
        // Handle image load errors - refresh expired URLs
        if (!img.hasAttribute("data-error-handled")) {
          img.setAttribute("data-error-handled", "true");

          img.addEventListener("error", async function onImageError() {
            // Only try to refresh once per image to avoid infinite loops
            if (img.hasAttribute("data-refresh-attempted")) {
              return;
            }
            img.setAttribute("data-refresh-attempted", "true");

            try {
              // Get imageKey from data attribute or extract from URL
              let imageKey = img.getAttribute("data-image-key");

              if (!imageKey) {
                // Try to extract from URL
                const imageUrl = img.getAttribute("src");
                if (!imageUrl || imageUrl.startsWith("data:")) {
                  return;
                }

                try {
                  const urlObj = new URL(imageUrl);
                  const cloudFrontPattern =
                    /cloudfront\.net|d3q5mz27otbl2j\.cloudfront\.net/i;

                  if (cloudFrontPattern.test(imageUrl)) {
                    const pathname = urlObj.pathname;
                    imageKey = pathname.startsWith("/")
                      ? pathname.slice(1)
                      : pathname;
                  } else if (imageUrl.includes(".blob.core.windows.net")) {
                    const parts = urlObj.pathname.split("/").filter(Boolean);
                    imageKey =
                      parts.length > 1
                        ? parts.slice(1).join("/")
                        : parts.join("/");
                  } else if (
                    imageUrl.includes("amazonaws.com") ||
                    imageUrl.includes("s3.")
                  ) {
                    const pathname = urlObj.pathname;
                    const parts = pathname.split("/").filter((p) => p);
                    if (parts.length > 1) {
                      imageKey = parts.slice(1).join("/");
                    } else {
                      imageKey = pathname.replace(/^\//, "");
                    }
                  }
                } catch (urlError) {
                  console.error("Error parsing image URL:", urlError);
                  return;
                }
              }

              if (imageKey) {
                // Call refresh endpoint
                const token = await getToken();
                const refreshUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/attachments/refresh-url/${encodeURIComponent(imageKey)}`;

                const response = await fetch(refreshUrl, {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                });

                if (response.ok) {
                  const data = await response.json();
                  if (data.url) {
                    // Update image src with fresh URL
                    img.src = data.url;
                    img.removeAttribute("data-refresh-attempted"); // Allow future refreshes
                    console.log("Image URL refreshed successfully");
                  }
                }
              }
            } catch (error) {
              console.error("Error refreshing image URL:", error);
            }
          });
        }

        // Skip if button already exists
        if (img.parentElement?.querySelector(".image-download-btn")) {
          return;
        }

        // Create wrapper if needed
        let wrapper = img.parentElement;
        if (!wrapper || !wrapper.classList.contains("image-wrapper")) {
          wrapper = document.createElement("div");
          wrapper.className = "image-wrapper relative inline-block";
          img.parentNode.insertBefore(wrapper, img);
          wrapper.appendChild(img);
        }

        // Create download button
        const downloadBtn = document.createElement("button");
        downloadBtn.className =
          "image-download-btn absolute top-2 right-2 bg-black/75 hover:bg-black/90 backdrop-blur-sm rounded-lg p-2 text-white transition-all duration-200 shadow-lg z-10 flex items-center justify-center";
        downloadBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        `;
        downloadBtn.setAttribute("aria-label", "Download image");
        downloadBtn.title = "Download image";

        // Handle download click
        downloadBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          e.preventDefault();

          const imageUrl = img.getAttribute("src");
          if (!imageUrl || imageUrl.startsWith("data:")) {
            toast.error("Cannot download this image");
            return;
          }

          try {
            // Extract imageKey from URL
            let imageKey = null;

            try {
              const urlObj = new URL(imageUrl);

              // Check if it's a CloudFront URL
              const cloudFrontPattern =
                /cloudfront\.net|d3q5mz27otbl2j\.cloudfront\.net/i;
              if (cloudFrontPattern.test(imageUrl)) {
                // Extract pathname (everything after domain)
                const pathname = urlObj.pathname;
                // Remove leading slash
                imageKey = pathname.startsWith("/")
                  ? pathname.slice(1)
                  : pathname;
              }

              // Check if it's an Azure Blob Storage signed URL.
              if (!imageKey && imageUrl.includes(".blob.core.windows.net")) {
                const parts = urlObj.pathname.split("/").filter(Boolean);
                imageKey =
                  parts.length > 1 ? parts.slice(1).join("/") : parts.join("/");
              }

              // Check if it's an S3 presigned URL
              if (
                !imageKey &&
                (imageUrl.includes("amazonaws.com") || imageUrl.includes("s3."))
              ) {
                const pathname = urlObj.pathname;
                // S3 URLs typically have format: /bucket-name/key
                // We want just the key part (after bucket name)
                const parts = pathname.split("/").filter((p) => p);
                if (parts.length > 1) {
                  // Skip bucket name, take the rest
                  imageKey = parts.slice(1).join("/");
                } else {
                  imageKey = pathname.replace(/^\//, ""); // Remove leading slash
                }
              }
            } catch (urlError) {
              console.error("Error parsing image URL:", urlError);
            }

            // If we have an imageKey, use the proxy endpoint
            if (imageKey) {
              const downloadUrl = `${
                process.env.NEXT_PUBLIC_API_URL
              }/api/attachments/download/${encodeURIComponent(imageKey)}`;

              try {
                // Get auth token
                const token = await getToken();

                // Fetch image through proxy with auth
                const response = await fetch(downloadUrl, {
                  headers: token
                    ? {
                        Authorization: `Bearer ${token}`,
                      }
                    : {},
                });

                if (response.ok) {
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = imageKey.split("/").pop() || "image";
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  toast.success("Image downloaded");
                  return;
                }
              } catch (fetchError) {
                console.error("Error fetching image:", fetchError);
                // Fall through to direct URL fallback
              }

              // Fallback: open proxy URL directly (browser will handle auth via cookies)
              window.open(downloadUrl, "_blank");
              toast.success("Image download started");
              return;
            }

            // Fallback: open image URL directly
            window.open(imageUrl, "_blank", "noopener,noreferrer");
            if (window.innerWidth <= 768) {
              toast.success("Image opened - tap and hold to save");
            } else {
              toast.success("Right-click the image to save");
            }
          } catch (error) {
            console.error("Error downloading image:", error);
            // Fallback: open image URL directly
            window.open(imageUrl, "_blank", "noopener,noreferrer");
            toast.success("Image opened in new tab");
          }
        });

        wrapper.appendChild(downloadBtn);
      });
    };

    // Add buttons when content changes
    const observer = new MutationObserver(() => {
      addDownloadButtons();
    });

    const editorElement = editor.view.dom;
    addDownloadButtons();

    observer.observe(editorElement, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [editor, editable, getToken, readOnly]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={`w-full rounded-lg ${
        transparent ? "" : "bg-white"
      } ${className}`}
    >
      {!readOnly && toolbar
        ? toolbar(editor)
        : !readOnly && editor && <DefaultToolbar editor={editor} />}

      <div
        className={`w-full ${
          !readOnly && showBorder ? "border border-gray-200 rounded" : ""
        } ${readOnly ? "" : "overflow-y-auto"}`}
        style={{
          height: height || "350px",
          maxHeight: maxHeight || "600px",
          overflowY: "auto",
          width: "100%",
        }}
      >
        <EditorContent editor={editor} className="w-full h-full" />
      </div>
      <style jsx global>{`
        .ProseMirror {
          min-height: 150px;
          height: 100%;
          width: 100%;
          max-width: 100%;
          outline: none;
          line-height: ${compact ? "1" : "1.5"};
          background: ${transparent ? "transparent" : "inherit"};
          color: inherit;
          text-align: left;
          padding: ${!readOnly ? "10px" : compact ? "5px" : "10px"};
          overflow-y: visible;
          box-sizing: border-box;
          color: #424242;
          word-wrap: break-word;
          word-break: normal;
          overflow-wrap: break-word;
          white-space: break-spaces;
        }

        /* Override prose max-width limitation */
        .ProseMirror.prose {
          max-width: none !important;
        }

        .ProseMirror .prose {
          max-width: none !important;
        }
        .ProseMirror h1,
        .ProseMirror h2,
        .ProseMirror h3,
        .ProseMirror h4,
        .ProseMirror h5,
        .ProseMirror h6,
        .ProseMirror p {
          color: inherit;
        }
        /* Support for inline styling */
        .ProseMirror span[style] {
          display: inline;
        }

        /* Direct style application for TipTap */
        [style*="color:"] {
          /* Applied directly through inline style */
        }
        [style*="font-size:"] {
          /* Applied directly through inline style */
          display: inline;
        }
        [style*="font-family:"] {
          /* Applied directly through inline style */
          display: inline;
        }

        /* TipTap marks */
        .ProseMirror .text-style {
          display: inline;
        }

        /* Preserve formatting */
        .ProseMirror strong,
        .ProseMirror em,
        .ProseMirror u,
        .ProseMirror s {
          display: inline;
        }
        .ProseMirror mark {
          background-color: #ffec99;
          padding: 0 2px;
        }
        .ProseMirror p {
          margin: ${compact ? "0.2em 0" : "0.5em 0"};
          line-height: ${compact ? "1.2" : "1.6"};
          text-align: left;
          white-space: inherit;
          overflow-wrap: break-word;
          word-wrap: break-word;
          word-break: normal;
          width: 100%;
          max-width: 100%;
        }
        .ProseMirror p + p:empty {
          margin-top: 1.5em;
        }
        .ProseMirror p:empty {
          min-height: 1em;
          margin: 0.8em 0;
        }
        .ProseMirror p:empty + p:empty {
          margin-top: 0;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror li {
          margin: 0.3em 0;
          line-height: 1.4;
        }
        .ProseMirror li p {
          margin: 0;
          display: inline-block;
        }
        .ProseMirror li > p:first-child {
          margin-top: 0;
        }
        .ProseMirror li > p:last-child {
          margin-bottom: 0;
        }
        .ProseMirror strong {
          font-weight: 600;
        }
        .ProseMirror p strong:first-child {
          display: inline-block;
          margin-top: 0.8em;
        }
        .ProseMirror b {
          font-weight: 600;
        }
        .ProseMirror table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
          table-layout: fixed;
        }

        .ProseMirror th {
          background-color: #f3f4f6;
          font-weight: 600;
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
          text-align: left;
        }

        .ProseMirror td {
          border: 1px solid #e5e7eb;
          padding: 0.5rem;
          vertical-align: top;
        }

        .ProseMirror td > p {
          margin: 0;
        }

        .ProseMirror tr:nth-child(even) {
          background-color: #f9fafb;
        }

        /* Fix for table display */
        .ProseMirror table p {
          margin: 0;
          min-height: 1em;
        }

        /* Add styles for pasted content */
        .ProseMirror [style] {
          white-space: normal;
        }
        .ProseMirror pre {
          background-color: #f3f4f6;
          padding: 0.5rem;
          border-radius: 0.25rem;
          margin: 0.5rem 0;
          overflow-x: auto;
        }
        .ProseMirror blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1rem;
          margin: 0.5rem 0;
          color: inherit;
        }
        .ProseMirror a {
          color: inherit;
          text-decoration: underline;
        }

        /* Image download button styles */
        .ProseMirror .image-wrapper {
          position: relative;
          display: inline-block;
        }

        .ProseMirror img.image-downloadable {
          display: block;
          max-width: 100%;
        }

        .ProseMirror .image-download-btn {
          opacity: 0;
          transition:
            opacity 0.2s ease,
            transform 0.2s ease;
          width: 36px;
          height: 36px;
          min-width: 36px;
        }

        .ProseMirror .image-wrapper:hover .image-download-btn {
          opacity: 1;
        }

        .ProseMirror .image-download-btn:hover {
          transform: scale(1.1);
        }

        .ProseMirror .image-download-btn:active {
          transform: scale(0.95);
        }

        /* Mobile: show download button always */
        @media (max-width: 768px) {
          .ProseMirror .image-download-btn {
            opacity: 0.85;
            width: 40px;
            height: 40px;
            min-width: 40px;
          }

          .ProseMirror .image-download-btn:active {
            opacity: 1;
            transform: scale(0.9);
          }
        }
      `}</style>
    </div>
  );
};

// Add these new functions outside the component
const isMarkdownTable = (text) => {
  // Very strict check for markdown tables
  const lines = text.trim().split("\n");

  // Need at least 3 lines for a markdown table (header, separator, data)
  if (lines.length < 3) return false;

  // Every line must start and end with a pipe, and contain at least one more pipe
  const validLines = lines.filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith("|") &&
      trimmed.endsWith("|") &&
      trimmed.substring(1, trimmed.length - 1).includes("|")
    );
  });

  // All lines must be valid table rows
  if (validLines.length !== lines.length) return false;

  // Second line should be a separator row with only |, -, and spaces
  const separatorLine = lines[1].trim();
  if (!separatorLine.match(/^\|[-|\s]+\|$/)) return false;

  return true;
};

const convertMarkdownTableToHTML = (text) => {
  const lines = text.trim().split("\n");

  // Extract header and body rows
  const headerRow = lines[0];
  const bodyRows = lines.slice(2); // Skip the separator line

  let tableHTML = "<table><thead><tr>";

  // Process header cells
  const headerCells = headerRow
    .trim()
    .slice(1, -1) // Remove starting and ending pipes
    .split("|");

  for (const cell of headerCells) {
    const sanitizedCell = sanitizeHtmlContent(cell.trim());
    tableHTML += `<th>${sanitizedCell}</th>`;
  }

  tableHTML += "</tr></thead><tbody>";

  // Process body rows
  for (const row of bodyRows) {
    tableHTML += "<tr>";

    const cells = row
      .trim()
      .slice(1, -1) // Remove starting and ending pipes
      .split("|");

    for (const cell of cells) {
      const sanitizedCell = sanitizeHtmlContent(cell.trim());
      tableHTML += `<td>${sanitizedCell}</td>`;
    }

    tableHTML += "</tr>";
  }

  tableHTML += "</tbody></table>";
  return tableHTML;
};

const sanitizeHtmlContent = (content) => {
  return content
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\{/g, "&#123;")
    .replace(/\}/g, "&#125;");
};

export default CustomEditor;
