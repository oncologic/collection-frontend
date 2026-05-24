import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import {
  FaClipboard,
  FaExclamationCircle,
  FaFastForward,
} from "react-icons/fa";
import SourceCitation from "./SourceCitation";

const SAFE_HREF_PATTERN = /^(?:(?:https?|mailto|tel):|\/|#)/i;

const isSafeHref = (href) =>
  typeof href === "string" && SAFE_HREF_PATTERN.test(href);

const markdownComponents = {
  h1: ({ children }) => (
    <h1 className="mb-4 mt-1 text-2xl font-semibold leading-tight text-gray-950">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-6 text-xl font-semibold leading-snug text-gray-950 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-5 text-lg font-semibold leading-snug text-gray-900">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-4 text-base font-semibold leading-snug text-gray-900">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="mb-4 text-[15px] leading-7 text-gray-700 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-4 list-disc space-y-2 pl-6 marker:text-blue-500">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 list-decimal space-y-2 pl-6 marker:font-semibold marker:text-blue-600">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="pl-1 text-[15px] leading-7 text-gray-700">{children}</li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-950">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-gray-800">{children}</em>,
  a: ({ href, children }) => {
    const safeHref = isSafeHref(href) ? href : undefined;
    const isExternal = safeHref && /^https?:/i.test(safeHref);

    return (
      <a
        href={safeHref}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="font-medium text-blue-600 underline decoration-blue-200 underline-offset-2 transition-colors hover:text-blue-800 hover:decoration-blue-500"
      >
        {children}
      </a>
    );
  },
  hr: () => <hr className="my-6 border-gray-200" />,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-4 border-blue-200 bg-blue-50/60 px-4 py-3 text-gray-700">
      {children}
    </blockquote>
  ),
  code: ({ className, children, ...props }) => (
    <code
      className={`rounded bg-gray-100 px-1.5 py-0.5 font-mono text-sm text-gray-800 ${
        className || ""
      }`}
      {...props}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-lg border border-gray-200 bg-gray-950 p-4 text-sm leading-6 text-gray-50">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="bg-gray-50 px-3 py-2 text-left font-semibold text-gray-900">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-t border-gray-100 px-3 py-2 text-gray-700">
      {children}
    </td>
  ),
};

const compactMarkdownComponents = {
  ...markdownComponents,
  p: ({ children }) => (
    <p className="mb-0 text-sm leading-6 text-gray-700">{children}</p>
  ),
  code: ({ className, children, ...props }) => (
    <code
      className={`rounded bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-800 ${
        className || ""
      }`}
      {...props}
    >
      {children}
    </code>
  ),
};

const TABLE_SEPARATOR_PATTERN = /^:?-{3,}:?$/;

const splitPipeCells = (line = "") =>
  String(line)
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);

const isTableSeparatorCell = (cell = "") =>
  TABLE_SEPARATOR_PATTERN.test(String(cell).replace(/\s+/g, ""));

const parseInlinePipeTable = (line = "") => {
  if (!line.includes("|")) return null;

  const cells = splitPipeCells(line);
  const separatorIndex = cells.findIndex(isTableSeparatorCell);
  if (separatorIndex < 2) return null;

  const headers = cells.slice(0, separatorIndex);
  const separators = cells.slice(separatorIndex, separatorIndex + headers.length);
  if (separators.length !== headers.length) return null;
  if (!separators.every(isTableSeparatorCell)) return null;

  const rowCells = cells.slice(separatorIndex + headers.length);
  const rows = [];
  for (let index = 0; index < rowCells.length; index += headers.length) {
    const row = rowCells.slice(index, index + headers.length);
    if (row.length === headers.length && row.some(Boolean)) {
      rows.push(row);
    }
  }

  return rows.length > 0 ? { headers, rows } : null;
};

const parseMultilinePipeTable = (lines, startIndex) => {
  const headerLine = lines[startIndex] || "";
  const separatorLine = lines[startIndex + 1] || "";
  if (!headerLine.includes("|") || !separatorLine.includes("|")) return null;

  const headers = splitPipeCells(headerLine);
  const separators = splitPipeCells(separatorLine);
  if (headers.length < 2 || separators.length < headers.length) return null;
  if (!separators.slice(0, headers.length).every(isTableSeparatorCell)) {
    return null;
  }

  const rows = [];
  let cursor = startIndex + 2;
  while (cursor < lines.length && lines[cursor].includes("|")) {
    const cells = splitPipeCells(lines[cursor]);
    if (cells.length < headers.length) break;
    rows.push(cells.slice(0, headers.length));
    cursor += 1;
  }

  return rows.length > 0
    ? {
        table: { headers, rows },
        consumed: cursor - startIndex,
      }
    : null;
};

const splitStructuredMessageBlocks = (markdown = "") => {
  const lines = String(markdown || "").split("\n");
  const blocks = [];
  const markdownBuffer = [];

  const flushMarkdown = () => {
    const content = markdownBuffer.join("\n").trim();
    if (content) {
      blocks.push({ type: "markdown", content });
    }
    markdownBuffer.length = 0;
  };

  for (let index = 0; index < lines.length; index += 1) {
    const multilineTable = parseMultilinePipeTable(lines, index);
    if (multilineTable) {
      flushMarkdown();
      blocks.push({ type: "table", table: multilineTable.table });
      index += multilineTable.consumed - 1;
      continue;
    }

    const inlineTable = parseInlinePipeTable(lines[index]);
    if (inlineTable) {
      flushMarkdown();
      blocks.push({ type: "table", table: inlineTable });
      continue;
    }

    markdownBuffer.push(lines[index]);
  }

  flushMarkdown();
  return blocks.length > 0 ? blocks : [{ type: "markdown", content: markdown }];
};

const stripInlineCodeFence = (value = "") =>
  String(value)
    .trim()
    .replace(/^`+/, "")
    .replace(/`+$/, "")
    .trim();

const prettifyFieldName = (value = "") =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const formatStructuredValue = (value) => {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
};

const tryParseJsonCell = (value = "") => {
  const cleaned = stripInlineCodeFence(value);
  if (!/^[{\[]/.test(cleaned)) return null;

  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

const StructuredCellContent = ({ value }) => {
  const parsed = tryParseJsonCell(value);

  if (parsed && !Array.isArray(parsed) && typeof parsed === "object") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(parsed).map(([key, itemValue]) => (
          <span
            key={key}
            className="inline-flex max-w-full items-center gap-1 rounded-md border border-blue-100 bg-blue-50 px-2 py-1 text-xs text-gray-700"
          >
            <span className="font-semibold text-blue-700">
              {prettifyFieldName(key)}:
            </span>
            <span className="truncate">{formatStructuredValue(itemValue)}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="text-sm leading-6 text-gray-700">
      <ReactMarkdown components={compactMarkdownComponents}>
        {value}
      </ReactMarkdown>
    </div>
  );
};

const StructuredMessageTable = ({ table }) => {
  if (!table?.headers?.length || !table?.rows?.length) return null;

  return (
    <div className="my-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {table.headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {table.rows.map((row, rowIndex) => (
              <tr key={`structured-row-${rowIndex}`} className="align-top">
                {row.map((cell, cellIndex) => (
                  <td
                    key={`${table.headers[cellIndex]}-${rowIndex}`}
                    className="max-w-[28rem] px-4 py-3 text-gray-700"
                  >
                    <StructuredCellContent value={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {table.rows.map((row, rowIndex) => (
          <div
            key={`structured-card-${rowIndex}`}
            className="rounded-lg border border-gray-200 bg-gray-50/70 p-3"
          >
            {row.map((cell, cellIndex) => (
              <div
                key={`${table.headers[cellIndex]}-${rowIndex}`}
                className="border-b border-gray-200 py-2 last:border-b-0"
              >
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {table.headers[cellIndex]}
                </div>
                <StructuredCellContent value={cell} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const toText = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const candidate = value.answer || value.content || value.message;
    if (typeof candidate === "string") return candidate;
    if (candidate) return JSON.stringify(candidate);
    return JSON.stringify(value);
  }
  return String(value);
};

const isLegacyRenderedHtml = (text) =>
  /<div\s+class="mb-4\s+text-gray-700|<ol\s+class="my-4\s+pl-6\s+text-gray-700|source-citation-placeholder/i.test(
    text,
  );

const stripDecorativeEmoji = (value = "") =>
  String(value)
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]\u{FE0F}?/gu,
      "",
    )
    .replace(/[ \t]{2,}/g, " ")
    .trim();

const serializeLegacyHtmlChildren = (node, context = {}) =>
  Array.from(node.childNodes)
    .map((child, index) => serializeLegacyHtmlNode(child, { ...context, index }))
    .join("");

const serializeLegacyHtmlNode = (node, context = {}) => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent || "";
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  const tagName = node.tagName.toLowerCase();
  const childText = () => serializeLegacyHtmlChildren(node, context);

  if (tagName === "br") return "\n";
  if (/^h[1-6]$/.test(tagName)) {
    const level = Number(tagName.substring(1));
    return `${"#".repeat(level)} ${childText().trim()}\n\n`;
  }
  if (tagName === "p" || tagName === "div") {
    return `${childText().trim()}\n\n`;
  }
  if (tagName === "strong" || tagName === "b") {
    return `**${childText().trim()}**`;
  }
  if (tagName === "em" || tagName === "i") {
    return `*${childText().trim()}*`;
  }
  if (tagName === "a") {
    const href = node.getAttribute("href");
    const label = childText().trim();
    return isSafeHref(href) ? `[${label}](${href})` : label;
  }
  if (tagName === "ul") {
    return `${Array.from(node.children)
      .map((child) => serializeLegacyHtmlNode(child, { listType: "ul" }))
      .join("")}\n`;
  }
  if (tagName === "ol") {
    return `${Array.from(node.children)
      .map((child, index) =>
        serializeLegacyHtmlNode(child, {
          listType: "ol",
          itemNumber: index + 1,
        }),
      )
      .join("")}\n`;
  }
  if (tagName === "li") {
    const itemContent = Array.from(node.childNodes)
      .map((child) => {
        if (
          child.nodeType === Node.ELEMENT_NODE &&
          child.tagName.toLowerCase() === "span" &&
          /^\d+\.$/.test((child.textContent || "").trim())
        ) {
          return "";
        }

        return serializeLegacyHtmlNode(child, context);
      })
      .join("")
      .trim();

    const prefix =
      context.listType === "ol" ? `${context.itemNumber || 1}. ` : "- ";
    return `${prefix}${itemContent}\n`;
  }

  return childText();
};

const convertLegacyHtmlToMarkdown = (text) => {
  if (!isLegacyRenderedHtml(text) || typeof window === "undefined") {
    return text;
  }

  const wrapper = document.createElement("div");
  wrapper.innerHTML = text;

  return serializeLegacyHtmlChildren(wrapper)
    .replace(/&nbsp;/g, " ")
    .replace(/^\s*(\d+\.\s+)\*\s+/gm, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const cleanText = (value) => {
  const text = stripDecorativeEmoji(convertLegacyHtmlToMarkdown(toText(value)));
  if (!text) return "";

  return text
    .replace(
      /(?:Organization|Resource|Collection|Attachment|Event|Video)\s*ID:\s*\[\d+\]/gi,
      "",
    )
    .replace(/\bID:\s*\[\d+\]/g, "")
    .replace(
      /\bID:\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi,
      "",
    )
    .replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(?:\s*,\s*[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})*\b/gi,
      "",
    )
    .replace(/\s*\[\d+\]\s*$/gm, "")
    .replace(/\s*\[\d+\]\s*(?=[.!?])/g, "")
    .replace(/\s*(?:\[\d+\],?\s*)+$/gm, "")
    .replace(/\s*\[\d+\]\s*/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const extractSourceCitations = (markdown) => {
  const citations = [];
  const contentLines = [];

  markdown.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (/^Source:\s*/i.test(trimmed)) {
      citations.push({
        content: trimmed,
        index: citations.length + 1,
      });
      return;
    }
    contentLines.push(line);
  });

  return {
    markdown: contentLines.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
    citations,
  };
};

const prepareContent = (content) => {
  const cleaned = cleanText(content);
  return extractSourceCitations(cleaned);
};

const isInsufficientCreditsMessage = (content, insufficientCredits) => {
  if (insufficientCredits) return true;
  const text = toText(content).toLowerCase();
  return (
    text.includes("insufficient credits") &&
    text.includes("please purchase more")
  );
};

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
  const hasInsufficientCredits = isInsufficientCreditsMessage(
    content,
    insufficient_credits,
  );

  const completeTyping = () => {
    if (!isTyping || !content) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    const preparedContent = prepareContent(content);
    setDisplayedContent(preparedContent.markdown);
    setSourceCitations(preparedContent.citations);
    setIsTyping(false);
  };

  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (!content) {
      setDisplayedContent("");
      setSourceCitations([]);
      setIsTyping(false);
      return;
    }

    if (hasInsufficientCredits) {
      setDisplayedContent(
        "Insufficient credits, please purchase more to continue using AI chat.",
      );
      setSourceCitations([]);
      setIsTyping(false);
      return;
    }

    const preparedContent = prepareContent(content);
    setSourceCitations(preparedContent.citations);

    if (enableTyping && preparedContent.markdown.length > 0) {
      setIsTyping(true);
      setDisplayedContent("");
      animateTyping(preparedContent.markdown);
      return;
    }

    setDisplayedContent(preparedContent.markdown);
    setIsTyping(false);
  }, [content, insufficient_credits, enableTyping, hasInsufficientCredits]);

  const animateTyping = (fullContent) => {
    const baseSpeed = 15;
    const maxSpeed = 8;
    const speedFactor = Math.max(maxSpeed, baseSpeed - fullContent.length / 120);

    let currentIndex = 0;
    const typeNextChunk = () => {
      if (currentIndex >= fullContent.length) {
        setDisplayedContent(fullContent);
        setIsTyping(false);
        return;
      }

      let chunkSize = 1;
      if (fullContent[currentIndex] === " ") {
        let nextSpaceIndex = fullContent.indexOf(" ", currentIndex + 1);
        if (nextSpaceIndex === -1) nextSpaceIndex = fullContent.length;
        chunkSize = Math.min(nextSpaceIndex - currentIndex, 12);
      } else if (fullContent[currentIndex] === "\n") {
        chunkSize = 1;
      }

      currentIndex = Math.min(currentIndex + chunkSize, fullContent.length);
      setDisplayedContent(fullContent.substring(0, currentIndex));

      let delay = speedFactor;
      if (/[.!?]/.test(fullContent[currentIndex - 1])) {
        delay *= 3;
      } else if (/[,;:]/.test(fullContent[currentIndex - 1])) {
        delay *= 1.5;
      }

      typingTimeoutRef.current = setTimeout(typeNextChunk, delay);
    };

    typeNextChunk();
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayedContent);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="font-sans text-[15px] text-gray-700 leading-relaxed">
      {hasInsufficientCredits ? (
        <button
          type="button"
          onClick={onInsufficientCredits}
          className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-left font-semibold text-red-700"
        >
          <FaExclamationCircle className="h-5 w-5 flex-shrink-0" />
          <span>{displayedContent}</span>
        </button>
      ) : (
        <div className="relative">
          <div
            className={`max-w-none ${isTyping ? "cursor-pointer pr-16" : ""}`}
            onClick={isTyping ? completeTyping : undefined}
            title={isTyping ? "Click to complete typing" : undefined}
          >
            {(isTyping
              ? [{ type: "markdown", content: displayedContent }]
              : splitStructuredMessageBlocks(displayedContent)
            ).map(
              (block, index) =>
                block.type === "table" ? (
                  <StructuredMessageTable
                    key={`message-table-${index}`}
                    table={block.table}
                  />
                ) : (
                  <ReactMarkdown
                    key={`message-markdown-${index}`}
                    components={markdownComponents}
                  >
                    {block.content}
                  </ReactMarkdown>
                ),
            )}
          </div>

          {isTyping && (
            <span className="inline-block w-0.5 h-4 bg-gray-700 ml-0.5 animate-pulse" />
          )}

          {isTyping && (
            <button
              type="button"
              onClick={completeTyping}
              className="absolute top-0 right-0 flex items-center gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-md px-2.5 py-1.5 transition-all duration-200 shadow-sm hover:shadow z-10"
              title="Skip typing animation"
            >
              <FaFastForward className="w-3 h-3" />
              <span>Skip</span>
            </button>
          )}
        </div>
      )}

      {!isTyping && sourceCitations.length > 0 && (
        <div className="mt-4 space-y-3">
          {sourceCitations.map((source) => (
            <SourceCitation
              key={`${source.index}-${source.content}`}
              source={source.content}
              index={source.index}
            />
          ))}
        </div>
      )}

      {content && !hasInsufficientCredits && !isTyping && (
        <button
          type="button"
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
