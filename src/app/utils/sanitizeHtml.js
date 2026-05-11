"use client";

import DOMPurify from "dompurify";
import { marked } from "marked";

let hooksRegistered = false;

const DEFAULT_CONFIG = {
  // Keep this allowlist intentionally small and content-focused.
  // If you need additional tags, add them explicitly here rather than loosening the policy.
  ALLOWED_TAGS: [
    "a",
    "b",
    "blockquote",
    "br",
    "code",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "li",
    "mark",
    "ol",
    "p",
    "pre",
    "span",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
  ],
  ALLOWED_ATTR: [
    "aria-hidden",
    "aria-label",
    "class",
    "data-source-index",
    "href",
    "id",
    "rel",
    "role",
    "target",
    "title",
  ],
  // Block common dangerous/abusive elements and styling.
  FORBID_TAGS: [
    "base",
    "button",
    "embed",
    "form",
    "iframe",
    "input",
    "link",
    "meta",
    "object",
    "script",
    "style",
  ],
  FORBID_ATTR: ["style"],
  // Allow only safe protocols + relative + hash links.
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
};

const ensureHooks = () => {
  if (hooksRegistered) return;
  hooksRegistered = true;

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    // Enforce safe link behavior.
    if (node?.tagName === "A") {
      // DOMPurify already strips javascript: URLs; this is defense-in-depth.
      const href = node.getAttribute("href") || "";
      if (!DEFAULT_CONFIG.ALLOWED_URI_REGEXP.test(href)) {
        node.removeAttribute("href");
      }

      node.setAttribute("rel", "noopener noreferrer");
      // Default external links to a new tab for consistent UX.
      if (!node.getAttribute("target")) {
        node.setAttribute("target", "_blank");
      }
    }
  });
};

export const sanitizeHtml = (html, configOverrides = {}) => {
  // In case this gets evaluated in a non-browser environment, fail closed.
  if (typeof window === "undefined") return "";
  ensureHooks();
  if (!html) return "";
  const dirty = typeof html === "string" ? html : String(html);
  return DOMPurify.sanitize(dirty, { ...DEFAULT_CONFIG, ...configOverrides });
};

export const sanitizeMarkdownToHtml = (markdown, markedOptions = {}) => {
  if (typeof window === "undefined") return "";
  const md = markdown ? String(markdown) : "";
  const html = marked.parse(md, {
    headerIds: false,
    mangle: false,
    ...markedOptions,
  });
  return sanitizeHtml(html);
};

const normalizeHtmlForTextExtraction = (html) =>
  html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li\b[^>]*>/gi, "\n• ")
    .replace(
      /<\/(?:address|article|aside|blockquote|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|thead|tr|ul)\s*>/gi,
      "\n"
    );

const normalizePlainText = (text) =>
  text
    .replace(/\u00a0/g, " ")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

export const stripHtmlToText = (html) => {
  if (!html) return "";
  const value = normalizeHtmlForTextExtraction(String(html));
  // Server-safe fallback.
  if (typeof window === "undefined") {
    return normalizePlainText(value.replace(/<[^>]*>/g, " "));
  }
  const tmp = document.createElement("div");
  tmp.innerHTML = sanitizeHtml(value);
  return normalizePlainText(tmp.innerText || tmp.textContent || "");
};
