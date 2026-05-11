"use client";
import React, { useState } from "react";
import { FaCheck, FaDownload } from "react-icons/fa";

import toast from "react-hot-toast";
import { sanitizeMarkdownToHtml } from "../utils/sanitizeHtml";

const SummaryModal = ({ isOpen, onClose, summary }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sanitizedHtml = sanitizeMarkdownToHtml(
    summary || "No summary available"
  );

  const handleCopy = () => {
    navigator.clipboard
      .writeText(summary || "No summary available")
      .then(() => {
        setCopied(true);
        toast.success("Summary copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy summary"));
  };

  const handleDownloadPDF = () => {
    try {
      // Use @react-pdf/renderer and marked for parsing markdown
      Promise.all([import("@react-pdf/renderer"), import("marked")]).then(
        ([{ pdf, Document, Page, Text, StyleSheet, View }, { marked }]) => {
          // Define styles for the PDF
          const styles = StyleSheet.create({
            page: {
              padding: 30,
              backgroundColor: "#ffffff",
            },
            title: {
              fontSize: 20,
              fontWeight: "bold",
              marginBottom: 20,
              color: "#333",
            },
            heading2: {
              fontSize: 16,
              fontWeight: "bold",
              marginTop: 15,
              marginBottom: 10,
              color: "#444",
            },
            heading3: {
              fontSize: 14,
              fontWeight: "bold",
              marginTop: 12,
              marginBottom: 8,
              color: "#555",
            },
            paragraph: {
              fontSize: 12,
              marginBottom: 10,
              lineHeight: 1.5,
              color: "#444",
            },
            listItem: {
              fontSize: 12,
              marginBottom: 5,
              marginLeft: 15,
              lineHeight: 1.5,
              color: "#444",
            },
            section: {
              marginBottom: 10,
            },
          });

          // Parse markdown to tokens
          const tokens = marked.lexer(summary || "No summary available");

          // Extract title (first heading)
          let title = "AI Summary";
          if (tokens.length > 0 && tokens[0].type === "heading") {
            title = tokens[0].text;
            tokens.shift(); // Remove the title from tokens
          }

          // Create PDF document
          const MyDocument = () => (
            <Document>
              <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                  <Text style={styles.title}>{title}</Text>
                </View>

                {tokens.map((token, index) => {
                  if (token.type === "heading") {
                    const headingStyle =
                      token.depth === 2 ? styles.heading2 : styles.heading3;
                    return (
                      <View key={index} style={styles.section}>
                        <Text style={headingStyle}>{token.text}</Text>
                      </View>
                    );
                  } else if (token.type === "paragraph") {
                    return (
                      <View key={index} style={styles.section}>
                        <Text style={styles.paragraph}>{token.text}</Text>
                      </View>
                    );
                  } else if (token.type === "list") {
                    return (
                      <View key={index} style={styles.section}>
                        {token.items.map((item, itemIndex) => (
                          <View
                            key={`item-${itemIndex}`}
                            style={{ flexDirection: "row" }}
                          >
                            <Text style={{ marginRight: 5 }}>•</Text>
                            <Text style={styles.listItem}>{item.text}</Text>
                          </View>
                        ))}
                      </View>
                    );
                  }
                  return null;
                })}
              </Page>
            </Document>
          );

          // Generate PDF blob
          pdf(<MyDocument />)
            .toBlob()
            .then((blob) => {
              // Create download link
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `ai-summary-${new Date()
                .toISOString()
                .slice(0, 10)}.pdf`;
              link.click();

              // Clean up
              URL.revokeObjectURL(url);
              toast.success("Summary downloaded as PDF");
            });
        }
      );
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const openInLLM = (llm) => {
    const content = encodeURIComponent(summary || "No summary available");
    let url = "";

    switch (llm) {
      case "chatgpt":
        url = `https://chat.openai.com/?prompt`;
        break;
      case "claude":
        url = `https://claude.ai/chat?content`;
        break;
      case "notebook":
        url = `https://notebooklm.google.com`;
        break;
      case "copilot":
        url = `https://copilot.microsoft.com`;
        break;
      default:
        toast.error("Unknown service provider");
        return;
    }

    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-black">AI Summary</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div
            className="prose prose-headings:text-black prose-p:text-black prose-strong:text-black max-w-none"
            dangerouslySetInnerHTML={{
              __html: sanitizedHtml,
            }}
          />
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={handleCopy}
              className={`px-4 py-2 ${
                copied
                  ? "bg-blue-500 text-white border-blue-500"
                  : "bg-gray-50 text-gray-600 border-gray-300"
              } border rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 flex-1 justify-center min-w-[100px]`}
            >
              {copied ? (
                <FaCheck className="h-4 w-4" />
              ) : (
                <span className="h-4 w-4 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M7.5 3.375c0-1.036.84-1.875 1.875-1.875h.375a3.75 3.75 0 013.75 3.75v1.875C13.5 8.161 14.34 9 15.375 9h1.875A3.75 3.75 0 0121 12.75v3.375C21 17.16 20.16 18 19.125 18h-9.75A1.875 1.875 0 017.5 16.125V3.375z" />
                    <path d="M15 5.25a5.23 5.23 0 00-1.279-3.434 9.768 9.768 0 016.963 6.963A5.23 5.23 0 0017.25 7.5h-1.875A.375.375 0 0115 7.125V5.25zM4.875 6H6v10.125A3.375 3.375 0 009.375 19.5H16.5v1.125c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 013 20.625V7.875C3 6.839 3.84 6 4.875 6z" />
                  </svg>
                </span>
              )}
              {copied ? "Copied" : "Copy"}
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-red-50 text-red-700 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 flex-1 justify-center min-w-[100px]"
            >
              <FaDownload className="h-4 w-4" />
              PDF
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <button
              onClick={() => openInLLM("chatgpt")}
              className="px-4 py-2 bg-green-50 text-green-700 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              ChatGPT
            </button>
            <button
              onClick={() => openInLLM("claude")}
              className="px-4 py-2 bg-purple-50 text-purple-700 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              Claude
            </button>
            <button
              onClick={() => openInLLM("notebook")}
              className="px-4 py-2 bg-blue-50 text-blue-700 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Notebook
            </button>
            <button
              onClick={() => openInLLM("copilot")}
              className="px-4 py-2 bg-yellow-50 text-yellow-700 border-2 border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              Copilot
            </button>
          </div>

          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors w-full sm:w-auto"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
