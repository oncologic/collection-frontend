"use client";

const stripHtml = (html) => {
  if (!html) return "";

  // First create a temporary div to parse HTML
  const temp = document.createElement("div");
  temp.innerHTML = html;

  // Get text content and clean it up
  let text = temp.textContent || temp.innerText || "";

  // Remove extra whitespace and normalize line breaks
  text = text
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\n+/g, " ") // Replace line breaks with spaces
    .trim();

  return text;
};

const TextDisplay = ({
  content,
  maxLength = null,
  className = "",
  showEllipsis = true,
}) => {
  const cleanText = stripHtml(content);

  let displayText = cleanText;
  let isTruncated = false;

  if (maxLength && cleanText.length > maxLength) {
    displayText = cleanText.substring(0, maxLength).trim();
    isTruncated = true;

    // Don't cut off in the middle of a word
    const lastSpaceIndex = displayText.lastIndexOf(" ");
    if (lastSpaceIndex > maxLength * 0.8) {
      displayText = displayText.substring(0, lastSpaceIndex);
    }
  }

  return (
    <div className={`text-gray-600 leading-relaxed ${className}`}>
      {displayText}
      {isTruncated && showEllipsis && "..."}
    </div>
  );
};

export default TextDisplay;
