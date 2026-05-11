"use client";
import React, { useState, useEffect } from "react";
import { marked } from "marked";
import {
  FaCheck,
  FaDownload,
  FaFilePdf,
  FaFileExcel,
  FaRobot,
  FaTimes,
  FaCopy,
  FaPaperclip,
} from "react-icons/fa";
import toast from "react-hot-toast";
import DOMPurify from "dompurify";
import AttachmentBrowser from "../AttachmentBrowser";

const EventExportModal = ({ isOpen, onClose, event, resources, isAdmin = false }) => {
  const [copied, setCopied] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [activeTab, setActiveTab] = useState("prompt"); // "prompt", "pdf", or "csv"
  const [selectedResources, setSelectedResources] = useState([]);
  const [resourceOptions, setResourceOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("resources"); // "resources" or "notations"
  const [showAttachmentBrowser, setShowAttachmentBrowser] = useState(false);
  const [hidePrivateItems, setHidePrivateItems] = useState(false);

  useEffect(() => {
    if (isOpen && event) {
      // Initialize selected resources with all resources and their options enabled
      const initialResourceOptions = resources.map((resource) => ({
        id: resource.id,
        selected: true,
        includeUrl: true,
        includeDescription: true,
        includeNotes: true,
        includeNotations: true,
        notationSelections:
          resource.notations?.reduce((acc, notation) => {
            acc[notation.id] = { selected: true };
            return acc;
          }, {}) || {},
      }));
      setResourceOptions(initialResourceOptions);
      setSelectedResources(resources.map((r) => r.id));

      // Generate initial prompt content
      generatePromptContent(initialResourceOptions);
    }
  }, [isOpen, event, resources]);

  // Update prompt content whenever resource options change
  useEffect(() => {
    if (resourceOptions.length > 0) {
      generatePromptContent(resourceOptions);
    }
  }, [resourceOptions]);

  if (!isOpen || !event) return null;

  const generatePromptContent = (
    options = resourceOptions,
    resourcesData = resources
  ) => {
    // Add a prompt suggestion for blog writing
    let prompt = `I need help writing a blog post about the event "${event.title}". `;
    prompt += `Please analyze the following event information and resources to help me create compelling content.\n\n`;

    prompt += `# ${event.title}\n\n`;

    // Add event details
    if (event.startDate) {
      const startDate = new Date(event.startDate).toLocaleDateString();
      const endDate = event.endDate
        ? new Date(event.endDate).toLocaleDateString()
        : null;
      prompt += `**Event Date:** ${startDate}${
        endDate ? ` - ${endDate}` : ""
      }\n`;
    }

    if (event.locationCity) {
      prompt += `**Location:** ${event.locationCity}${
        event.locationState ? `, ${event.locationState}` : ""
      }\n`;
    }

    if (event.virtualEvent) {
      prompt += `**Format:** Virtual Event\n`;
    }
    if (event.inPersonEvent) {
      prompt += `**Format:** In-Person Event\n`;
    }

    prompt += `\n`;

    if (event.description) {
      const descriptionMarkdown = htmlToMarkdown(event.description);
      prompt += `${descriptionMarkdown}\n\n`;
    }

    // Filter resources based on selection
    const filteredResources = resourcesData.filter((resource) =>
      options.find((opt) => opt.id === resource.id && opt.selected)
    );

    prompt += `## Event Resources and Collections (${filteredResources.length}):\n\n`;

    filteredResources.forEach((resource, index) => {
      prompt += `### ${index + 1}. ${resource.name}\n`;

      const resourceOption = options.find((opt) => opt.id === resource.id);

      if (resource.url && resourceOption?.includeUrl) {
        prompt += `URL: ${resource.url}\n`;
      }

      if (resource.description && resourceOption?.includeDescription) {
        const descMarkdown = htmlToMarkdown(resource.description);
        prompt += `Description: ${descMarkdown}\n`;
      }

      if (resource.notes && resourceOption?.includeNotes) {
        const notesMarkdown = htmlToMarkdown(resource.notes);
        prompt += `Notes: ${notesMarkdown}\n`;
      }

      // Add notations if available and selected
      if (
        resource.notations &&
        resource.notations.length > 0 &&
        resourceOption?.includeNotations
      ) {
        const filteredNotations = resource.notations.filter(
          (notation) =>
            resourceOption.notationSelections?.[notation.id]?.selected !== false
        );

        if (filteredNotations.length > 0) {
          prompt += `\nNotations:\n`;

          filteredNotations.forEach((notation) => {
            prompt += `- **${notation.title || "Untitled Notation"}**`;

            if (notation.category) {
              prompt += ` | ${notation.category}`;
            }

            if (notation.status) {
              prompt += ` (Status: ${notation.status})`;
            }

            prompt += `\n`;

            if (notation.description) {
              const descMarkdown = htmlToMarkdown(notation.description);
              prompt += `  ${descMarkdown.replace(/\n/g, "\n  ")}\n`;
            }

            if (notation.notes) {
              const notesMarkdown = htmlToMarkdown(notation.notes);
              prompt += `  Notes: ${notesMarkdown.replace(/\n/g, "\n  ")}\n`;
            }

            prompt += `\n`;
          });
        }
      }

      prompt += "\n";
    });

    prompt += `\n## Blog Post Request:\n\n`;
    prompt += `Please help me write a comprehensive blog post about this event that:\n`;
    prompt += `- Captures the key highlights and takeaways\n`;
    prompt += `- Engages readers with compelling storytelling\n`;
    prompt += `- Incorporates relevant information from the resources\n`;
    prompt += `- Includes appropriate calls-to-action\n`;
    prompt += `- Is optimized for social media sharing\n\n`;
    prompt += `Please suggest a compelling title, structure the content with clear sections, and highlight the most important insights from the event.`;

    setPromptContent(prompt);
  };

  // Convert HTML to Markdown to preserve formatting
  const htmlToMarkdown = (html) => {
    // First sanitize the HTML to prevent XSS
    const sanitizedHtml = DOMPurify.sanitize(html);

    // Create a temporary element to work with the HTML
    const temp = document.createElement("div");
    temp.innerHTML = sanitizedHtml;

    // Handle common HTML elements and convert to markdown
    let markdown = sanitizedHtml
      .replace(/<(strong|b)>(.*?)<\/(strong|b)>/gi, "**$2**")
      .replace(/<(em|i)>(.*?)<\/(em|i)>/gi, "*$2*")
      .replace(/<u>(.*?)<\/u>/gi, "__$1__")
      .replace(/<h([1-6])>(.*?)<\/h\1>/gi, (_, level, content) => {
        return "\n" + "#".repeat(parseInt(level)) + " " + content.trim() + "\n";
      })
      .replace(
        /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi,
        "[$2]($1)"
      )
      .replace(/<ul>(.*?)<\/ul>/gis, (_, content) => {
        return content.replace(/<li>(.*?)<\/li>/gis, "- $1\n");
      })
      .replace(/<ol>(.*?)<\/ol>/gis, (_, content) => {
        let index = 1;
        return content.replace(/<li>(.*?)<\/li>/gis, () => {
          return `${index++}. $1\n`;
        });
      })
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
      .replace(/<[^>]*>/g, "");

    // Clean up extra whitespace and newlines
    markdown = markdown.replace(/\n{3,}/g, "\n\n").trim();

    return markdown;
  };

  // Keep the stripHtml function for cases where we need plain text
  const stripHtml = (html) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(promptContent)
      .then(() => {
        setCopied(true);
        toast.success("Blog prompt copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy prompt"));
  };

  const handleResourceToggle = (resourceId) => {
    const updatedOptions = resourceOptions.map((opt) =>
      opt.id === resourceId ? { ...opt, selected: !opt.selected } : opt
    );
    setResourceOptions(updatedOptions);
    generatePromptContent(updatedOptions);
  };

  const handleResourceOptionToggle = (resourceId, option) => {
    const updatedOptions = resourceOptions.map((opt) =>
      opt.id === resourceId ? { ...opt, [option]: !opt[option] } : opt
    );
    setResourceOptions(updatedOptions);
    generatePromptContent(updatedOptions);
  };

  const handleSelectAll = (select) => {
    const updatedOptions = resourceOptions.map((opt) => {
      // If hiding private items and this resource is private, don't select it
      const resource = resources.find((r) => r.id === opt.id);
      const isPrivate = resource?.visibility === "private";

      if (hidePrivateItems && isPrivate && select) {
        return opt; // Don't change private items when selecting all
      }

      return {
        ...opt,
        selected: select,
      };
    });
    setResourceOptions(updatedOptions);
    generatePromptContent(updatedOptions);
  };

  const handleDownloadPDF = () => {
    try {
      Promise.all([import("@react-pdf/renderer"), import("marked")]).then(
        ([
          { pdf, Document, Page, Text, StyleSheet, View, Link },
          { marked },
        ]) => {
          // Similar PDF generation logic as ExportCollectionModal but for events
          const styles = StyleSheet.create({
            page: {
              padding: 40,
              backgroundColor: "#ffffff",
              fontFamily: "Helvetica",
            },
            title: {
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 20,
              color: "#1a1a1a",
              textAlign: "center",
            },
            eventInfo: {
              fontSize: 12,
              marginBottom: 15,
              color: "#666666",
              backgroundColor: "#f8f9fa",
              padding: 10,
              borderRadius: 4,
            },
            // ... other styles similar to ExportCollectionModal
          });

          const MyDocument = () => (
            <Document>
              <Page size="A4" style={styles.page}>
                <Text style={styles.title}>{event.title}</Text>

                <View style={styles.eventInfo}>
                  {event.startDate && (
                    <Text>
                      Date: {new Date(event.startDate).toLocaleDateString()}
                      {event.endDate &&
                        ` - ${new Date(event.endDate).toLocaleDateString()}`}
                    </Text>
                  )}
                  {event.locationCity && (
                    <Text>
                      Location: {event.locationCity}
                      {event.locationState && `, ${event.locationState}`}
                    </Text>
                  )}
                </View>

                {/* Rest of PDF content similar to ExportCollectionModal */}
              </Page>
            </Document>
          );

          pdf(<MyDocument />)
            .toBlob()
            .then((blob) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `${event.title
                .replace(/\s+/g, "-")
                .toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
              link.click();
              URL.revokeObjectURL(url);
              toast.success("Event exported as PDF");
            });
        }
      );
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const handleDownloadCSV = () => {
    try {
      // CSV generation logic similar to ExportCollectionModal
      let csvContent =
        "Event,Date,Location,Resource Name,URL,Description,Notes,Notation Title,Notation Description\n";

      const filteredResources = resources.filter((resource) =>
        resourceOptions.find((opt) => opt.id === resource.id && opt.selected)
      );

      const escapeCSV = (str) => `"${(str || "").replace(/"/g, '""')}"`;

      const eventDate = event.startDate
        ? new Date(event.startDate).toLocaleDateString()
        : "";
      const eventLocation = event.locationCity || "";

      filteredResources.forEach((resource) => {
        const resourceOption = resourceOptions.find(
          (opt) => opt.id === resource.id
        );

        const baseInfo = [
          escapeCSV(event.title),
          escapeCSV(eventDate),
          escapeCSV(eventLocation),
          escapeCSV(resource.name),
          resourceOption?.includeUrl ? escapeCSV(resource.url || "") : '""',
          resourceOption?.includeDescription
            ? escapeCSV(stripHtml(resource.description || ""))
            : '""',
          resourceOption?.includeNotes
            ? escapeCSV(stripHtml(resource.notes || ""))
            : '""',
        ];

        if (
          resource.notations &&
          resource.notations.length > 0 &&
          resourceOption?.includeNotations
        ) {
          resource.notations.forEach((notation) => {
            if (
              resourceOption.notationSelections?.[notation.id]?.selected !==
              false
            ) {
              csvContent += `${baseInfo.join(",")},${escapeCSV(
                notation.title || ""
              )},${escapeCSV(stripHtml(notation.description || ""))}\n`;
            }
          });
        } else {
          csvContent += `${baseInfo.join(",")},"",""\n`;
        }
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${event.title
        .replace(/\s+/g, "-")
        .toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Event exported as CSV");
    } catch (error) {
      console.error("CSV generation error:", error);
      toast.error("Failed to generate CSV. Please try again.");
    }
  };

  const openInLLM = (llm) => {
    const content = encodeURIComponent(promptContent);
    let url = "";

    switch (llm) {
      case "chatgpt":
        url = `https://chat.openai.com/`;
        break;
      case "claude":
        url = `https://claude.ai/new`;
        break;
      case "notebook":
        url = `https://notebooklm.google.com`;
        break;
      case "grok":
        url = `https://grok.com`;
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

  const handleNotationToggle = (resourceId, notationId) => {
    const updatedOptions = resourceOptions.map((opt) => {
      if (opt.id === resourceId) {
        const updatedNotationSelections = {
          ...opt.notationSelections,
          [notationId]: {
            ...opt.notationSelections[notationId],
            selected: !opt.notationSelections[notationId]?.selected,
          },
        };
        return { ...opt, notationSelections: updatedNotationSelections };
      }
      return opt;
    });
    setResourceOptions(updatedOptions);
    generatePromptContent(updatedOptions);
  };

  // Filter notations based on search query
  const filterNotationsBySearch = (notations) => {
    let filteredNotations = notations;

    // First filter out private notations if hidePrivateItems is enabled
    if (hidePrivateItems) {
      filteredNotations = filteredNotations.filter(
        (notation) => notation.visibility !== "private"
      );
    }

    // Then apply search filter if there's a search query
    if (!searchQuery.trim()) return filteredNotations;

    return filteredNotations.filter(
      (notation) =>
        (notation.title || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (notation.notes || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (notation.category || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
    );
  };

  // Get all attachments from selected resources
  const getSelectedResourceAttachments = () => {
    const attachments = [];

    const filteredResources = resources.filter((resource) =>
      resourceOptions.find((opt) => opt.id === resource.id && opt.selected)
    );

    filteredResources.forEach((resource) => {
      if (resource.attachments && resource.attachments.length > 0) {
        resource.attachments.forEach((attachment) => {
          attachments.push({
            ...attachment,
            resourceName: resource.name,
            resourceId: resource.id,
          });
        });
      }
    });

    return attachments;
  };

  const handleOpenAttachments = () => {
    const attachments = getSelectedResourceAttachments();
    if (attachments.length === 0) {
      toast.error("No attachments found in selected resources");
      return;
    }
    setShowAttachmentBrowser(true);
  };

  const handleCloseAttachments = () => {
    setShowAttachmentBrowser(false);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/30 via-black/50 to-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200/80 bg-gradient-to-r from-gray-50/80 to-white/80">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Export Event
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-full p-2 transition-all duration-200"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Event Info */}
        <div className="p-4 bg-gradient-to-r from-slate-50/60 to-white/60 border-b border-gray-200/60">
          <h3 className="font-semibold text-gray-800">{event.title}</h3>
          <p className="text-sm text-gray-600">
            {event.startDate && (
              <>
                {new Date(event.startDate).toLocaleDateString()}
                {event.endDate &&
                  ` - ${new Date(event.endDate).toLocaleDateString()}`}
              </>
            )}
          </p>
          {event.locationCity && (
            <p className="text-sm text-gray-600">
              {event.locationCity}
              {event.locationState && `, ${event.locationState}`}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200/80 bg-gray-50/50">
          <button
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === "prompt"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white/60"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/30"
            }`}
            onClick={() => setActiveTab("prompt")}
          >
            Blog Prompt
          </button>
          <button
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === "export"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white/60"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/30"
            }`}
            onClick={() => setActiveTab("export")}
          >
            Export Options
          </button>
          <button
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === "selection"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white/60"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/30"
            }`}
            onClick={() => setActiveTab("selection")}
          >
            Resource Selection
          </button>
        </div>

        {/* Content based on active tab */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "prompt" && (
            <>
              <p className="mb-4 text-gray-600">
                Edit this blog writing prompt to customize it before copying or
                sending to an LLM:
              </p>
              <textarea
                value={promptContent}
                onChange={(e) => setPromptContent(e.target.value)}
                className="w-full h-[300px] p-3 border border-gray-300 rounded-lg font-mono text-sm text-gray-900"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 ${
                    copied
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-gray-50 text-gray-600 border-gray-300"
                  } border rounded-lg hover:bg-gray-100 hover:text-gray-600 transition-colors flex items-center gap-2 flex-1 justify-center min-w-[100px]`}
                >
                  {copied ? (
                    <FaCheck className="h-4 w-4" />
                  ) : (
                    <FaCopy className="h-4 w-4" />
                  )}
                  {copied ? "Copied" : "Copy Prompt"}
                </button>

                <button
                  onClick={() => generatePromptContent()}
                  className="px-4 py-2 bg-gray-50 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2 flex-1 justify-center min-w-[100px]"
                >
                  Reset
                </button>

                <button
                  onClick={handleOpenAttachments}
                  className="px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 border border-orange-300 rounded-lg hover:from-orange-100 hover:to-amber-100 hover:border-orange-400 transition-all duration-200 flex items-center gap-2 flex-1 justify-center min-w-[100px] relative"
                >
                  <FaDownload className="h-4 w-4" />
                  <FaPaperclip className="h-3 w-3" />
                  Attachments
                  {(() => {
                    const count = getSelectedResourceAttachments().length;
                    return count > 0 ? (
                      <span className="ml-1 bg-orange-200 text-orange-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                        {count}
                      </span>
                    ) : null;
                  })()}
                </button>
              </div>
            </>
          )}

          {activeTab === "export" && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <FaFilePdf className="text-red-500 mr-2" />
                  PDF Export
                </h3>
                <p className="text-gray-600 mb-4">
                  Export your event as a formatted PDF document including all
                  resources and their details.
                </p>
                <button
                  onClick={handleDownloadPDF}
                  className="px-4 py-2 bg-red-50 text-red-700 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <FaDownload className="h-4 w-4" />
                  Download PDF
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <FaFileExcel className="text-green-600 mr-2" />
                  CSV Export
                </h3>
                <p className="text-gray-600 mb-4">
                  Export your event as a CSV file that can be opened in Excel or
                  other spreadsheet applications.
                </p>
                <button
                  onClick={handleDownloadCSV}
                  className="px-4 py-2 bg-green-50 text-green-700 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  <FaDownload className="h-4 w-4" />
                  Download CSV
                </button>
              </div>

              {/* LLM Integration Section */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium mb-2">Send to AI Assistant</h3>
                <p className="text-gray-600 mb-4">
                  Send your event data to an AI assistant for blog writing assistance.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <button
                    onClick={() => openInLLM("chatgpt")}
                    className="px-4 py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-2 border-green-200 rounded-xl hover:from-green-100 hover:to-emerald-100 hover:border-green-300 hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    ChatGPT
                  </button>
                  <button
                    onClick={() => openInLLM("claude")}
                    className="px-4 py-2 bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border-2 border-purple-200 rounded-xl hover:from-purple-100 hover:to-violet-100 hover:border-purple-300 hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    Claude
                  </button>
                  <button
                    onClick={() => openInLLM("notebook")}
                    className="px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-2 border-blue-200 rounded-xl hover:from-blue-100 hover:to-cyan-100 hover:border-blue-300 hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    Notebook
                  </button>
                  <button
                    onClick={() => openInLLM("grok")}
                    className="px-4 py-2 bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-2 border-red-200 rounded-xl hover:from-red-100 hover:to-pink-100 hover:border-red-300 hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    Grok
                  </button>
                  <button
                    onClick={() => openInLLM("copilot")}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-2 border-yellow-200 rounded-xl hover:from-yellow-100 hover:to-amber-100 hover:border-yellow-300 hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    Copilot
                  </button>
                </div>
                <p className="text-gray-600 text-xs mt-4">
                  Note: We cannot guarantee the security of your data once it
                  leaves our system. We don&apos;t endorse any specific LLM and
                  recommend reviewing each service&apos;s privacy policy.
                </p>
              </div>
            </div>
          )}

          {activeTab === "selection" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-700">
                  Select Resources to Include
                </h3>
                <div className="space-x-2">
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => handleSelectAll(false)}
                    className="px-3 py-1 text-xs bg-gray-50 text-gray-700 border border-gray-200 rounded hover:bg-gray-100"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Privacy Filter Toggle */}
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <label
                      htmlFor="hidePrivateToggle"
                      className="text-sm font-medium text-amber-800"
                    >
                      Hide Private Items
                    </label>
                    <p className="text-xs text-amber-700 mt-1">
                      Automatically deselect and hide resources and notations
                      with private visibility
                    </p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="hidePrivateToggle"
                      checked={hidePrivateItems}
                      onChange={(e) => {
                        const shouldHide = e.target.checked;
                        setHidePrivateItems(shouldHide);

                        if (shouldHide) {
                          // Deselect all private items
                          const updatedOptions = resourceOptions.map((opt) => {
                            const resource = resources.find(
                              (r) => r.id === opt.id
                            );
                            const isPrivate =
                              resource?.visibility === "private";

                            if (isPrivate) {
                              return { ...opt, selected: false };
                            }

                            // Also check and deselect private notations
                            const updatedNotationSelections = {
                              ...opt.notationSelections,
                            };
                            if (resource?.notations) {
                              resource.notations.forEach((notation) => {
                                if (notation.visibility === "private") {
                                  updatedNotationSelections[notation.id] = {
                                    selected: false,
                                  };
                                }
                              });
                            }

                            return {
                              ...opt,
                              notationSelections: updatedNotationSelections,
                            };
                          });
                          setResourceOptions(updatedOptions);
                          generatePromptContent(updatedOptions);
                        }
                      }}
                      className="h-4 w-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Search functionality similar to ExportCollectionModal */}
              <div className="mb-4">
                <div className="flex mb-2 border border-gray-200 rounded-lg p-1 w-fit bg-gray-50">
                  <button
                    onClick={() => {
                      setSearchMode("resources");
                      setSearchQuery("");
                    }}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      searchMode === "resources"
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Search Resources
                  </button>
                  <button
                    onClick={() => {
                      setSearchMode("notations");
                      setSearchQuery("");
                    }}
                    className={`px-3 py-1 text-sm rounded transition-colors ${
                      searchMode === "notations"
                        ? "bg-blue-500 text-white"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Search Notations
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder={
                      searchMode === "resources"
                        ? "Search by resource name, description, or URL..."
                        : "Search by notation title, notes, or category..."
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              <div className="border rounded-lg divide-y">
                {resources.map((resource) => {
                  const resourceOption = resourceOptions.find(
                    (opt) => opt.id === resource.id
                  );
                  if (!resourceOption) return null;

                  // Check if this resource should be hidden due to privacy filter
                  const isPrivate = resource?.visibility === "private";
                  if (hidePrivateItems && isPrivate) {
                    return null;
                  }

                  // Filter logic similar to ExportCollectionModal
                  const filteredNotations = resource.notations
                    ? searchMode === "notations"
                      ? filterNotationsBySearch(resource.notations)
                      : resource.notations
                    : [];

                  const resourceMatches =
                    searchMode === "resources" && searchQuery.trim()
                      ? (resource.name || "")
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        (resource.description || "")
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        (resource.url || "")
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase())
                      : false;

                  const hasMatchingNotations =
                    searchMode === "notations" && searchQuery.trim()
                      ? filteredNotations.length > 0
                      : false;

                  let shouldShowResource;
                  if (!searchQuery.trim()) {
                    shouldShowResource = true;
                  } else if (searchMode === "resources") {
                    shouldShowResource = resourceMatches;
                  } else {
                    shouldShowResource = hasMatchingNotations;
                  }

                  if (searchQuery.trim() && !shouldShowResource) return null;

                  return (
                    <div key={resource.id} className="p-3">
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          id={`resource-${resource.id}`}
                          checked={resourceOption.selected}
                          onChange={() => handleResourceToggle(resource.id)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`resource-${resource.id}`}
                          className="ml-2 text-sm font-medium text-gray-900 flex items-center gap-2"
                        >
                          {resource.name}
                          {isPrivate && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Private
                            </span>
                          )}
                        </label>
                      </div>

                      {resourceOption.selected && (
                        <div className="ml-6 space-y-2 text-sm">
                          {resource.url && (
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`url-${resource.id}`}
                                checked={resourceOption.includeUrl}
                                onChange={() =>
                                  handleResourceOptionToggle(
                                    resource.id,
                                    "includeUrl"
                                  )
                                }
                                className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`url-${resource.id}`}
                                className="ml-2 text-gray-700"
                              >
                                Include URL
                              </label>
                            </div>
                          )}

                          {resource.description && (
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`desc-${resource.id}`}
                                checked={resourceOption.includeDescription}
                                onChange={() =>
                                  handleResourceOptionToggle(
                                    resource.id,
                                    "includeDescription"
                                  )
                                }
                                className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`desc-${resource.id}`}
                                className="ml-2 text-gray-700"
                              >
                                Include Description
                              </label>
                            </div>
                          )}

                          {resource.notations &&
                            resource.notations.length > 0 && (
                              <div className="mt-2">
                                <div className="flex items-center mb-1">
                                  <input
                                    type="checkbox"
                                    id={`notations-${resource.id}`}
                                    checked={resourceOption.includeNotations}
                                    onChange={() =>
                                      handleResourceOptionToggle(
                                        resource.id,
                                        "includeNotations"
                                      )
                                    }
                                    className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={`notations-${resource.id}`}
                                    className="ml-2 text-gray-700"
                                  >
                                    Include Notations
                                  </label>
                                </div>

                                {resourceOption.includeNotations && (
                                  <div className="ml-6 space-y-1 max-h-40 overflow-y-auto border-l-2 border-gray-200 pl-2">
                                    {filteredNotations.length > 0 ? (
                                      filteredNotations.map((notation) => (
                                        <div
                                          key={notation.id}
                                          className="flex items-center justify-between"
                                        >
                                          <div className="flex items-center">
                                            <input
                                              type="checkbox"
                                              id={`notation-${resource.id}-${notation.id}`}
                                              checked={
                                                resourceOption
                                                  .notationSelections?.[
                                                  notation.id
                                                ]?.selected !== false
                                              }
                                              onChange={() =>
                                                handleNotationToggle(
                                                  resource.id,
                                                  notation.id
                                                )
                                              }
                                              className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            />
                                            <label
                                              htmlFor={`notation-${resource.id}-${notation.id}`}
                                              className="ml-2 text-xs text-gray-700 flex items-center gap-1 flex-wrap"
                                            >
                                              <span>
                                                {notation.title ||
                                                  "Untitled notation"}
                                              </span>
                                              {notation.visibility ===
                                                "private" && (
                                                <span className="inline-flex items-center px-1 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 flex-shrink-0">
                                                  Private
                                                </span>
                                              )}
                                            </label>
                                          </div>
                                        </div>
                                      ))
                                    ) : searchQuery &&
                                      searchMode === "notations" ? (
                                      <div className="text-xs text-gray-500 py-1">
                                        No matching notations found
                                      </div>
                                    ) : (
                                      <div className="text-xs text-gray-500 py-1">
                                        No notations available
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {resources.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No resources available.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200/80 bg-gradient-to-r from-gray-50/40 to-white/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 bg-gradient-to-r from-gray-50 to-white border border-gray-300 rounded-xl hover:from-gray-100 hover:to-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>

      {/* Attachment Browser Modal */}
      {showAttachmentBrowser && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/40 via-black/60 to-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <AttachmentBrowser
              attachments={getSelectedResourceAttachments()}
              onClose={handleCloseAttachments}
              title="Event Resource Attachments"
              isAdmin={false}
              isCollaborator={false}
              userRole=""
              systemUserId=""
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EventExportModal;
