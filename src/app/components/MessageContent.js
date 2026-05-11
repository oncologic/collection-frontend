import React, { useState, useEffect, useRef } from "react";
import {
  FaClipboard,
  FaExclamationCircle,
  FaFastForward,
} from "react-icons/fa";
import SourceCitation from "./SourceCitation";
import { sanitizeHtml } from "../utils/sanitizeHtml";

const MessageContent = ({
  content,
  timestamp,
  insufficient_credits,
  onInsufficientCredits,
  enableTyping = true,
}) => {
  const [copySuccess, setCopySuccess] = useState(false);
  const [displayedContent, setDisplayedContent] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sourceCitations, setSourceCitations] = useState([]);
  const typingTimeoutRef = useRef(null);

  // Function to complete typing animation immediately
  const completeTyping = () => {
    if (isTyping && content) {
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Set the full content immediately
      const processedContent = processContent(content);
      setDisplayedContent(processedContent);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (!content) {
      setDisplayedContent("");
      return;
    }

    // If insufficient credits, display the content immediately
    if (
      insufficient_credits ||
      (typeof content === "string" &&
        content.toLowerCase().includes("insufficient credits") &&
        content.toLowerCase().includes("please purchase more"))
    ) {
      setDisplayedContent(
        '<div class="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 font-semibold"><span class="text-lg">⚠️</span>Insufficient credits, please purchase more to continue using AI chat.</div>'
      );
      return;
    }

    // Process content and optionally animate typing
    const processedContent = processContent(content);

    if (enableTyping && processedContent.length > 0) {
      setIsTyping(true);
      setDisplayedContent("");
      animateTyping(processedContent);
    } else {
      setDisplayedContent(processedContent);
    }
  }, [content, insufficient_credits, enableTyping]);

  const animateTyping = (fullContent) => {
    // Clear any existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Create a temporary div to parse the HTML content
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = fullContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    // Calculate typing speed based on content length
    const baseSpeed = 15; // Base milliseconds per character
    const maxSpeed = 8; // Minimum milliseconds per character
    const speedFactor = Math.max(
      maxSpeed,
      baseSpeed - textContent.length / 100
    );

    let currentIndex = 0;
    const typeNextChunk = () => {
      if (currentIndex < textContent.length) {
        // Find the next logical stopping point (word boundary, punctuation, etc.)
        let chunkSize = 1;
        if (textContent[currentIndex] === " ") {
          // If we hit a space, include the next word
          let nextSpaceIndex = textContent.indexOf(" ", currentIndex + 1);
          if (nextSpaceIndex === -1) nextSpaceIndex = textContent.length;
          chunkSize = Math.min(nextSpaceIndex - currentIndex, 8); // Max 8 chars at once
        } else if (/[.!?]/.test(textContent[currentIndex])) {
          // Pause longer after sentence endings
          chunkSize = 1;
        }

        currentIndex += chunkSize;

        // Create partial content by truncating the HTML at the appropriate text position
        const partialText = textContent.substring(0, currentIndex);
        const partialHTML = createPartialHTML(fullContent, partialText);

        setDisplayedContent(partialHTML);

        // Determine delay for next chunk
        let delay = speedFactor;
        if (/[.!?]/.test(textContent[currentIndex - 1])) {
          delay *= 3; // Longer pause after sentences
        } else if (/[,;:]/.test(textContent[currentIndex - 1])) {
          delay *= 1.5; // Shorter pause after commas
        }

        typingTimeoutRef.current = setTimeout(typeNextChunk, delay);
      } else {
        setIsTyping(false);
      }
    };

    typeNextChunk();
  };

  const createPartialHTML = (fullHTML, targetText) => {
    // This is a simplified approach - for a more robust solution,
    // you'd want to properly parse and truncate HTML while preserving structure
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = fullHTML;

    let currentLength = 0;
    const truncateNode = (node) => {
      if (currentLength >= targetText.length) {
        return null;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const remainingLength = targetText.length - currentLength;
        const nodeText = node.textContent || "";
        if (remainingLength >= nodeText.length) {
          currentLength += nodeText.length;
          return node.cloneNode(true);
        } else {
          const truncatedText = nodeText.substring(0, remainingLength);
          currentLength += truncatedText.length;
          const newNode = document.createTextNode(truncatedText);
          return newNode;
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const newElement = document.createElement(node.tagName.toLowerCase());
        // Copy attributes
        for (let attr of node.attributes) {
          // Validate attribute name - HTML attribute names must start with a letter
          // and can contain letters, digits, hyphens, periods, and underscores
          if (attr.name && /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(attr.name)) {
            try {
              newElement.setAttribute(attr.name, attr.value);
            } catch (e) {
              // Skip invalid attributes silently
              console.warn("Skipping invalid attribute:", attr.name, e);
            }
          }
        }

        for (let child of node.childNodes) {
          const truncatedChild = truncateNode(child);
          if (truncatedChild) {
            newElement.appendChild(truncatedChild);
          }
          if (currentLength >= targetText.length) {
            break;
          }
        }
        return newElement;
      }
      return null;
    };

    const result = document.createElement("div");
    for (let child of tempDiv.childNodes) {
      const truncatedChild = truncateNode(child);
      if (truncatedChild) {
        result.appendChild(truncatedChild);
      }
      if (currentLength >= targetText.length) {
        break;
      }
    }

    return result.innerHTML;
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const cleanText = (text) => {
    if (!text) return "";

    return (
      text
        // Remove various ID reference patterns
        .replace(
          /(?:Organization|Resource|Collection|Attachment|Event|Video)\s*ID:\s*\[\d+\]/gi,
          ""
        )
        .replace(/\bID:\s*\[\d+\]/g, "")
        // Remove UUID-format IDs (e.g., 172a5c2b-3c77-4844-b3f2-7ca94c93a9f6)
        .replace(
          /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
          ""
        )
        // Remove UUID IDs with labels (e.g., "ID: 172a5c2b-3c77-4844-b3f2-7ca94c93a9f6")
        .replace(
          /\bID:\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
          ""
        )
        // Remove comma-separated UUID lists
        .replace(
          /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:\s*,\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})*\b/gi,
          ""
        )
        // Remove reference numbers at end of lines/sentences
        .replace(/\s*\[\d+\]\s*$/gm, "")
        .replace(/\s*\[\d+\]\s*(?=[.!?])/g, "")
        // Remove comma-separated reference lists like [4], [3], [5], [2]
        .replace(/\s*(?:\[\d+\],?\s*)+$/gm, "")
        // Remove inline reference numbers but preserve sentence structure
        .replace(/\s*\[\d+\]\s*/g, " ")
        // Clean up extra whitespace
        .replace(/[ \t]+/g, " ")
        .trim()
    );
  };

  const processContent = (text) => {
    if (!text) return "";

    const cleanedText = cleanText(text);
    const blocks = parseBlocks(cleanedText);

    // Track source citations for React rendering
    let sourceIndex = 0;
    const sourceCitations = [];

    // Convert blocks to HTML string
    const htmlContent = blocks
      .map((block, index) => {
        if (!block || !block.type || !block.content) return "";

        switch (block.type) {
          case "paragraph":
            const content = Array.isArray(block.content)
              ? block.content[0]
              : block.content;
            return `<div class="mb-4 text-gray-700 leading-relaxed tracking-wide">${processInlineMarkdown(
              content
            )}</div>`;

          case "source":
            const sourceContent = Array.isArray(block.content)
              ? block.content[0]
              : block.content;
            sourceIndex++;
            sourceCitations.push({
              content: sourceContent,
              index: sourceIndex,
            });
            return `<div class="source-citation-placeholder" data-source-index="${
              sourceIndex - 1
            }"></div>`;

          case "unordered-list":
            const ulItems = block.content
              .map(
                (item) =>
                  `<li class="mb-3 pl-2 relative">
                    <span class="absolute -left-5 top-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                    ${processInlineMarkdown(item.replace(/^\s*[-*+]\s/, ""))}
                  </li>`
              )
              .join("");
            return `<ul class="my-4 pl-6 text-gray-700 space-y-2">${ulItems}</ul>`;

          case "ordered-list":
            const olItems = block.content
              .map(
                (item, idx) =>
                  `<li class="mb-3 pl-2 relative">
                    <span class="absolute -left-6 font-semibold text-blue-600">${
                      idx + 1
                    }.</span>
                    ${processInlineMarkdown(item.replace(/^\s*\d+\.\s/, ""))}
                  </li>`
              )
              .join("");
            return `<ol class="my-4 pl-6 text-gray-700 space-y-2">${olItems}</ol>`;

          default:
            const defaultContent = Array.isArray(block.content)
              ? block.content.join(" ")
              : block.content;
            return `<div class="mb-4 text-gray-700 leading-relaxed">${processInlineMarkdown(
              defaultContent
            )}</div>`;
        }
      })
      .join("");

    // Store source citations for later rendering
    setSourceCitations(sourceCitations);
    return sanitizeHtml(htmlContent, { ADD_ATTR: ["data-source-index"] });
  };

  const processInlineMarkdown = (text) => {
    if (!text) return "";

    return (
      text
        // Bold text
        .replace(
          /\*\*([^*]+)\*\*/g,
          '<strong class="font-semibold text-gray-900">$1</strong>'
        )
        // Italic text
        .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
        // Links
        .replace(
          /\[([^\]]+)\]\(([^)]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 font-medium hover:text-blue-800 hover:underline transition-colors duration-200">$1</a>'
        )
        // Inline code
        .replace(
          /`([^`]+)`/g,
          '<code class="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded text-sm font-mono">$1</code>'
        )
        // Convert single newlines to line breaks within paragraphs, but preserve spacing
        .replace(/\n+/g, '<br class="my-2">')
        // Add space after periods if missing (common in run-on text)
        .replace(/\.([A-Z])/g, ". $1")
        // Add space after closing parentheses if followed by capital letter
        .replace(/\)([A-Z])/g, ") $1")
    );
  };

  const handleCopy = async () => {
    try {
      // Create a clean text version for copying
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = displayedContent;
      const textContent = tempDiv.textContent || tempDiv.innerText || "";

      await navigator.clipboard.writeText(textContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const parseBlocks = (text) => {
    if (!text || typeof text !== "string") return [];

    // First, split by double newlines to get major sections
    let sections = text.split(/\n\s*\n/).filter((p) => p.trim());

    // If no double newlines, try to intelligently split long text
    if (sections.length === 1 && text.length > 200) {
      // Split on sentence boundaries followed by spaces, but preserve structure
      // Also split on source citations and numbered items
      sections = text
        .split(/(?<=[.!?])\s+(?=[A-Z]|\d+\.|\*|\-|\(|Source:|\*\*)/)
        .filter((p) => p.trim());
    }

    const blocks = [];

    sections.forEach((section) => {
      const trimmed = section.trim();
      if (!trimmed) return;

      // Check for source citations
      if (trimmed.match(/^Source:\s*/i)) {
        blocks.push({
          type: "source",
          content: [trimmed],
        });
        return;
      }

      // Check for different content types
      if (trimmed.includes("|") && trimmed.split("\n").length > 1) {
        // Table content
        blocks.push({
          type: "table",
          content: trimmed.split("\n").filter((line) => line.trim()),
        });
      } else if (/^\s*[-*+]\s/.test(trimmed)) {
        // Unordered list
        const items = trimmed.split("\n").filter((line) => line.trim());
        blocks.push({
          type: "unordered-list",
          content: items,
        });
      } else if (/^\s*\d+\.\s/.test(trimmed)) {
        // Ordered list
        const items = trimmed.split("\n").filter((line) => line.trim());
        blocks.push({
          type: "ordered-list",
          content: items,
        });
      } else {
        // For regular paragraphs, check if we need to split further
        if (trimmed.length > 150) {
          // Split very long paragraphs at sentence boundaries more aggressively
          const sentences = trimmed
            .split(/(?<=[.!?])\s+/)
            .filter((s) => s.trim());
          if (sentences.length > 1) {
            // Group sentences into smaller paragraphs (2-3 sentences each)
            let currentParagraph = [];
            sentences.forEach((sentence, index) => {
              currentParagraph.push(sentence);
              // Create new paragraph every 2-3 sentences or at the end
              if (
                currentParagraph.length >= 2 ||
                index === sentences.length - 1
              ) {
                blocks.push({
                  type: "paragraph",
                  content: [currentParagraph.join(" ").trim()],
                });
                currentParagraph = [];
              }
            });
            return;
          }
        }

        // Regular paragraph
        blocks.push({
          type: "paragraph",
          content: [trimmed],
        });
      }
    });

    return blocks;
  };

  return (
    <div className="font-sans text-[15px] text-gray-700 leading-relaxed">
      <div className="relative">
        <div
          className={`prose prose-sm max-w-none ${
            isTyping ? "cursor-pointer" : ""
          } ${isTyping ? "pr-16" : ""}`}
          dangerouslySetInnerHTML={{ __html: displayedContent }}
          onClick={isTyping ? completeTyping : undefined}
          title={isTyping ? "Click to complete typing" : undefined}
        />
        {isTyping && (
          <span className="inline-block w-0.5 h-4 bg-gray-700 ml-0.5 animate-pulse"></span>
        )}

        {/* Fast Forward Button */}
        {isTyping && (
          <button
            onClick={completeTyping}
            className="absolute top-0 right-0 flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-md px-2.5 py-1.5 transition-all duration-200 shadow-sm hover:shadow z-10"
            title="Skip typing animation"
          >
            <FaFastForward className="w-3 h-3" />
            <span>Skip</span>
          </button>
        )}
      </div>

      {/* Render source citations */}
      {!isTyping && sourceCitations.length > 0 && (
        <div className="mt-4 space-y-3">
          {sourceCitations.map((source, idx) => (
            <SourceCitation
              key={idx}
              source={source.content}
              index={source.index}
            />
          ))}
        </div>
      )}

      {content && !insufficient_credits && !isTyping && (
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mt-3 transition-colors duration-200"
        >
          <FaClipboard className="w-3 h-3" />
          {copySuccess ? "Copied!" : "Copy"}
        </button>
      )}

      {timestamp && !isTyping && (
        <div className="text-xs text-gray-400 mt-2">
          {new Date(timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
};

export default MessageContent;
