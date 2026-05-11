"use client";
import React, { useState, useEffect } from "react";
import {
  FaCheck,
  FaDownload,
  FaFilePdf,
  FaFileExcel,
  FaTimes,
  FaCopy,
  FaPaperclip,
  FaFileArchive,
} from "react-icons/fa";
import toast from "react-hot-toast";
import DOMPurify from "dompurify";
import { getDetailedCollectionExportData } from "../api/collectionsApi";
import { useContextAuth } from "../context/authContext";

const ChatExportModal = ({
  isOpen,
  onClose,
  selectedResources = [],
  chatHistory = [],
  referencedItems = [],
}) => {
  const [copied, setCopied] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [activeTab, setActiveTab] = useState("export");
  const [exportOptions, setExportOptions] = useState({
    includeSelectedItems: true,
    includeReferencedItems: true,
    includeChatHistory: true,
    includeBasicInfo: true,
    includeItemDescriptions: true,
    includeItemUrls: true,
  });

  const [selectedItemOptions, setSelectedItemOptions] = useState({});
  const [referencedItemOptions, setReferencedItemOptions] = useState({});
  const [chatHistoryOptions, setChatHistoryOptions] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [enrichedResources, setEnrichedResources] = useState({});
  const [loadingEnrichedData, setLoadingEnrichedData] = useState(false);

  const { getAuthHeader } = useContextAuth();

  // Fetch data for each collection when the modal opens and we have collections
  React.useEffect(() => {
    if (!isOpen) {
      setEnrichedResources({});
      setLoadingEnrichedData(false);
      return;
    }

    const fetchCollectionData = async () => {
      const allCollections = [
        ...selectedResources.filter(
          (resource) => resource.type === "collection"
        ),
        ...referencedItems.filter((item) => item.type === "collection"),
      ];

      // Remove duplicates based on ID
      const uniqueCollections = allCollections.filter(
        (collection, index, self) =>
          index === self.findIndex((c) => c.id === collection.id)
      );

      if (uniqueCollections.length === 0) {
        setEnrichedResources({});
        setLoadingEnrichedData(false);
        return;
      }

      setLoadingEnrichedData(true);
      const enrichedData = {};

      try {
        const headers = await getAuthHeader();

        const collectionPromises = uniqueCollections.map(async (collection) => {
          try {
            const result = await getDetailedCollectionExportData(
              collection.id,
              headers
            );

            enrichedData[collection.id] = {
              collection: result.collection,
              externalLinks: result.externalLinks,
              resources: result.resources,
              totalNotations: result.totalNotations,
            };
          } catch (error) {
            console.error(
              "Error fetching collection data for",
              collection.id,
              ":",
              error
            );
          }
        });

        await Promise.all(collectionPromises);

        setEnrichedResources(enrichedData);
      } catch (error) {
        console.error("Error in fetchCollectionData:", error);
      } finally {
        setLoadingEnrichedData(false);
      }
    };

    fetchCollectionData();
  }, [isOpen, selectedResources, referencedItems, getAuthHeader]);

  useEffect(() => {
    if (isOpen) {
      // Initialize selected item options
      const initialSelectedOptions = {};
      selectedResources.forEach((item) => {
        initialSelectedOptions[item.id] = {
          selected: true,
          includeTitle: true,
          includeDescription: true,
          includeUrl: true,
          includeType: true,
        };
      });
      setSelectedItemOptions(initialSelectedOptions);

      // Initialize referenced item options
      const initialReferencedOptions = {};
      referencedItems.forEach((item) => {
        initialReferencedOptions[item.id] = {
          selected: true,
          includeTitle: true,
          includeDescription: true,
          includeUrl: true,
          includeType: true,
        };
      });
      setReferencedItemOptions(initialReferencedOptions);

      // Initialize chat history options
      const initialChatOptions = {};
      chatHistory.forEach((message, index) => {
        initialChatOptions[message.id || index] = {
          selected: true,
          includePrompt: true,
          includeAnswer: true,
          includeTimestamp: true,
        };
      });
      setChatHistoryOptions(initialChatOptions);
    }
  }, [isOpen, selectedResources, referencedItems, chatHistory]);

  // Generate prompt content when enriched data and options are ready
  React.useEffect(() => {
    if (isOpen && !loadingEnrichedData) {
      generatePromptContent();
    }
  }, [
    isOpen,
    loadingEnrichedData,
    exportOptions,
    selectedItemOptions,
    referencedItemOptions,
    chatHistoryOptions,
    enrichedResources,
  ]);

  if (!isOpen) return null;

  const htmlToMarkdown = (html) => {
    if (!html) return "";
    try {
      const cleanHtml = DOMPurify.sanitize(html);
      return cleanHtml
        .replace(
          /<h([1-6])>/g,
          (match, level) => "#".repeat(parseInt(level)) + " "
        )
        .replace(/<\/h[1-6]>/g, "\n\n")
        .replace(/<p>/g, "")
        .replace(/<\/p>/g, "\n\n")
        .replace(/<br\s*\/?>/g, "\n")
        .replace(/<strong>/g, "**")
        .replace(/<\/strong>/g, "**")
        .replace(/<em>/g, "*")
        .replace(/<\/em>/g, "*")
        .replace(/<ul>/g, "")
        .replace(/<\/ul>/g, "\n")
        .replace(/<li>/g, "- ")
        .replace(/<\/li>/g, "\n")
        .replace(/<[^>]*>/g, "")
        .replace(/\n\n+/g, "\n\n")
        .trim();
    } catch (error) {
      console.error("Error converting HTML to markdown:", error);
      return html.replace(/<[^>]*>/g, "");
    }
  };

  const stripHtml = (html) => {
    if (!html) return "";
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  };

  const generatePromptContent = () => {
    let prompt = `# AI Chat Export\n\n`;
    prompt += `**Export Date:** ${new Date().toLocaleDateString()}\n\n`;

    // Selected Items
    if (exportOptions.includeSelectedItems && selectedResources.length > 0) {
      const selectedItems = selectedResources.filter(
        (item) => selectedItemOptions[item.id]?.selected
      );

      if (selectedItems.length > 0) {
        prompt += `## Selected Items (${selectedItems.length})\n\n`;
        prompt += `*These are the items you specifically selected for the chat context.*\n\n`;

        selectedItems.forEach((item, index) => {
          const itemOption = selectedItemOptions[item.id];

          prompt += `### ${index + 1}. `;

          if (itemOption.includeTitle) {
            prompt += `${item.title || item.name || "Untitled"}`;
          }

          prompt += `\n\n`;

          // Basic info
          const metadata = [];
          if (itemOption.includeType && item.type) {
            metadata.push(`Type: ${item.type.replace("_", " ")}`);
          }
          if (item.status) {
            metadata.push(`Status: ${item.status}`);
          }
          if (item.visibility) {
            metadata.push(`Visibility: ${item.visibility}`);
          }

          if (metadata.length > 0) {
            prompt += `*${metadata.join(" | ")}*\n\n`;
          }

          // URL
          if (itemOption.includeUrl && item.url) {
            prompt += `**URL:** ${item.url}\n\n`;
          }

          // Description
          if (itemOption.includeDescription && item.description) {
            const descriptionMarkdown = htmlToMarkdown(item.description);
            prompt += `**Description:** ${descriptionMarkdown}\n\n`;
          }

          // Enhanced collection data
          if (item.type === "collection" && enrichedResources[item.id]) {
            const enrichedData = enrichedResources[item.id];

            prompt += `**Collection Details:**\n\n`;

            // External Links with Notations
            if (
              enrichedData.externalLinks &&
              enrichedData.externalLinks.length > 0
            ) {
              prompt += `#### External Links (${enrichedData.externalLinks.length})\n\n`;

              enrichedData.externalLinks.forEach((link, linkIndex) => {
                prompt += `**${linkIndex + 1}. ${link.title}**\n`;
                if (link.url) prompt += `- URL: ${link.url}\n`;
                if (link.description) {
                  const linkDescMarkdown = htmlToMarkdown(link.description);
                  prompt += `- Description: ${linkDescMarkdown}\n`;
                }
                if (link.category) prompt += `- Category: ${link.category}\n`;

                // Notations for this external link
                if (link.notations && link.notations.length > 0) {
                  prompt += `- **Notations (${link.notations.length}):**\n`;
                  link.notations.forEach((notation, notationIndex) => {
                    prompt += `  ${notationIndex + 1}. **${notation.title}**\n`;
                    if (notation.notes) {
                      const notationNotesMarkdown = htmlToMarkdown(
                        notation.notes
                      );
                      prompt += `     ${notationNotesMarkdown}\n`;
                    }
                    if (notation.category)
                      prompt += `     *Category: ${notation.category}*\n`;
                    if (notation.status)
                      prompt += `     *Status: ${notation.status}*\n`;
                    if (notation.tags && notation.tags.length > 0) {
                      const tagNames = notation.tags
                        .map((tag) => tag.name || tag)
                        .join(", ");
                      prompt += `     *Tags: ${tagNames}*\n`;
                    }
                  });
                }
                prompt += `\n`;
              });
            }

            // Resources
            if (enrichedData.resources && enrichedData.resources.length > 0) {
              prompt += `#### Resources (${enrichedData.resources.length})\n\n`;

              enrichedData.resources.forEach((resource, resourceIndex) => {
                prompt += `**${resourceIndex + 1}. ${resource.title}**\n`;
                if (resource.url) prompt += `- URL: ${resource.url}\n`;
                if (resource.description) {
                  const resourceDescMarkdown = htmlToMarkdown(
                    resource.description
                  );
                  prompt += `- Description: ${resourceDescMarkdown}\n`;
                }
                if (resource.category)
                  prompt += `- Category: ${resource.category}\n`;
                if (resource.resourceType)
                  prompt += `- Type: ${resource.resourceType}\n`;
                prompt += `\n`;
              });
            }

            prompt += `**Summary:** ${
              enrichedData.totalNotations || 0
            } total notations across all links\n\n`;
          }
        });
      }
    }

    // Referenced Items
    if (exportOptions.includeReferencedItems && referencedItems.length > 0) {
      const selectedReferencedItems = referencedItems.filter(
        (item) => referencedItemOptions[item.id]?.selected
      );

      if (selectedReferencedItems.length > 0) {
        prompt += `## Referenced Items (${selectedReferencedItems.length})\n\n`;
        prompt += `*These are the items that the AI referenced in its responses.*\n\n`;

        selectedReferencedItems.forEach((item, index) => {
          const itemOption = referencedItemOptions[item.id];

          prompt += `### ${index + 1}. `;

          if (itemOption.includeTitle) {
            prompt += `${item.title || item.name || "Untitled"}`;
          }

          prompt += `\n\n`;

          // Basic info
          const metadata = [];
          if (itemOption.includeType && item.type) {
            metadata.push(`Type: ${item.type.replace("_", " ")}`);
          }
          if (item.status) {
            metadata.push(`Status: ${item.status}`);
          }
          if (item.visibility) {
            metadata.push(`Visibility: ${item.visibility}`);
          }

          if (metadata.length > 0) {
            prompt += `*${metadata.join(" | ")}*\n\n`;
          }

          // URL
          if (itemOption.includeUrl && item.url) {
            prompt += `**URL:** ${item.url}\n\n`;
          }

          // Description
          if (itemOption.includeDescription && item.description) {
            const descriptionMarkdown = htmlToMarkdown(item.description);
            prompt += `**Description:** ${descriptionMarkdown}\n\n`;
          }

          // Enhanced collection data for referenced items too
          if (item.type === "collection" && enrichedResources[item.id]) {
            const enrichedData = enrichedResources[item.id];

            prompt += `**Collection Details:**\n\n`;

            // External Links with Notations
            if (
              enrichedData.externalLinks &&
              enrichedData.externalLinks.length > 0
            ) {
              prompt += `#### External Links (${enrichedData.externalLinks.length})\n\n`;

              enrichedData.externalLinks.forEach((link, linkIndex) => {
                prompt += `**${linkIndex + 1}. ${link.title}**\n`;
                if (link.url) prompt += `- URL: ${link.url}\n`;
                if (link.description) {
                  const linkDescMarkdown = htmlToMarkdown(link.description);
                  prompt += `- Description: ${linkDescMarkdown}\n`;
                }
                if (link.category) prompt += `- Category: ${link.category}\n`;

                // Notations for this external link
                if (link.notations && link.notations.length > 0) {
                  prompt += `- **Notations (${link.notations.length}):**\n`;
                  link.notations.forEach((notation, notationIndex) => {
                    prompt += `  ${notationIndex + 1}. **${notation.title}**\n`;
                    if (notation.notes) {
                      const notationNotesMarkdown = htmlToMarkdown(
                        notation.notes
                      );
                      prompt += `     ${notationNotesMarkdown}\n`;
                    }
                    if (notation.category)
                      prompt += `     *Category: ${notation.category}*\n`;
                    if (notation.status)
                      prompt += `     *Status: ${notation.status}*\n`;
                    if (notation.tags && notation.tags.length > 0) {
                      const tagNames = notation.tags
                        .map((tag) => tag.name || tag)
                        .join(", ");
                      prompt += `     *Tags: ${tagNames}*\n`;
                    }
                  });
                }
                prompt += `\n`;
              });
            }

            // Resources
            if (enrichedData.resources && enrichedData.resources.length > 0) {
              prompt += `#### Resources (${enrichedData.resources.length})\n\n`;

              enrichedData.resources.forEach((resource, resourceIndex) => {
                prompt += `**${resourceIndex + 1}. ${resource.title}**\n`;
                if (resource.url) prompt += `- URL: ${resource.url}\n`;
                if (resource.description) {
                  const resourceDescMarkdown = htmlToMarkdown(
                    resource.description
                  );
                  prompt += `- Description: ${resourceDescMarkdown}\n`;
                }
                if (resource.category)
                  prompt += `- Category: ${resource.category}\n`;
                if (resource.resourceType)
                  prompt += `- Type: ${resource.resourceType}\n`;
                prompt += `\n`;
              });
            }

            prompt += `**Summary:** ${
              enrichedData.totalNotations || 0
            } total notations across all links\n\n`;
          }
        });
      }
    }

    // Chat History
    if (exportOptions.includeChatHistory && chatHistory.length > 0) {
      const selectedChatHistory = chatHistory.filter(
        (message, index) => chatHistoryOptions[message.id || index]?.selected
      );

      if (selectedChatHistory.length > 0) {
        prompt += `## Chat History (${selectedChatHistory.length} messages)\n\n`;

        selectedChatHistory.forEach((message, index) => {
          const messageOption = chatHistoryOptions[message.id || index];

          prompt += `### Message ${index + 1}\n\n`;

          // Timestamp
          if (messageOption.includeTimestamp && message.timestamp) {
            prompt += `**Date:** ${new Date(
              message.timestamp
            ).toLocaleString()}\n\n`;
          }

          // User question
          if (messageOption.includePrompt && message.prompt) {
            prompt += `**Question:**\n${message.prompt.replace(
              /^Question:\s*/i,
              ""
            )}\n\n`;
          }

          // AI response
          if (messageOption.includeAnswer && message.answer) {
            const answerMarkdown = htmlToMarkdown(message.answer);
            prompt += `**AI Response:**\n${answerMarkdown}\n\n`;
          }

          prompt += `---\n\n`;
        });
      }
    }

    setPromptContent(prompt);
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(promptContent)
      .then(() => {
        setCopied(true);
        toast.success("Content copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy content"));
  };

  const handleExportOptionToggle = (option) => {
    setExportOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const handleItemToggle = (itemId, setOptions) => {
    setOptions((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        selected: !prev[itemId]?.selected,
      },
    }));
  };

  const handleItemOptionToggle = (itemId, option, setOptions) => {
    setOptions((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [option]: !prev[itemId]?.[option],
      },
    }));
  };

  const handleSelectAll = (items, setOptions, selected) => {
    const updatedOptions = {};
    items.forEach((item, index) => {
      const itemId = item.id || index;
      updatedOptions[itemId] = {
        ...setOptions[itemId],
        selected,
      };
    });
    setOptions((prev) => ({ ...prev, ...updatedOptions }));
  };

  const handleDownloadPDF = () => {
    try {
      Promise.all([import("@react-pdf/renderer"), import("marked")]).then(
        ([{ pdf, Document, Page, Text, StyleSheet, View, Link }]) => {
          const styles = StyleSheet.create({
            page: {
              flexDirection: "column",
              backgroundColor: "#ffffff",
              padding: 30,
              fontFamily: "Helvetica",
            },
            section: {
              margin: 10,
              padding: 10,
              flexGrow: 1,
            },
            title: {
              fontSize: 24,
              marginBottom: 20,
              fontWeight: "bold",
              color: "#1a1a1a",
              textAlign: "center",
              borderBottomWidth: 2,
              borderBottomColor: "#e5e5e5",
              paddingBottom: 10,
            },
            heading2: {
              fontSize: 18,
              marginTop: 20,
              marginBottom: 12,
              fontWeight: "bold",
              color: "#2a2a2a",
            },
            heading3: {
              fontSize: 14,
              marginTop: 15,
              marginBottom: 8,
              fontWeight: "bold",
              color: "#3a3a3a",
            },
            text: {
              fontSize: 12,
              marginBottom: 8,
              color: "#4a4a4a",
              lineHeight: 1.6,
            },
            metadata: {
              fontSize: 10,
              color: "#666666",
              marginBottom: 5,
              fontStyle: "italic",
            },
          });

          const MyDocument = () => (
            <Document>
              <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                  <Text style={styles.title}>AI Chat Export</Text>
                  <Text style={styles.text}>
                    Export Date: {new Date().toLocaleDateString()}
                  </Text>

                  {/* Convert the markdown content to PDF components */}
                  {promptContent.split("\n").map((line, index) => {
                    if (line.startsWith("# ")) {
                      return (
                        <Text key={index} style={styles.title}>
                          {line.replace("# ", "")}
                        </Text>
                      );
                    } else if (line.startsWith("## ")) {
                      return (
                        <Text key={index} style={styles.heading2}>
                          {line.replace("## ", "")}
                        </Text>
                      );
                    } else if (line.startsWith("### ")) {
                      return (
                        <Text key={index} style={styles.heading3}>
                          {line.replace("### ", "")}
                        </Text>
                      );
                    } else if (line.startsWith("*") && line.endsWith("*")) {
                      return (
                        <Text key={index} style={styles.metadata}>
                          {line.replace(/^\*/, "").replace(/\*$/, "")}
                        </Text>
                      );
                    } else if (line.trim()) {
                      return (
                        <Text key={index} style={styles.text}>
                          {line}
                        </Text>
                      );
                    }
                    return null;
                  })}
                </View>
              </Page>
            </Document>
          );

          pdf(<MyDocument />)
            .toBlob()
            .then((blob) => {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `ai-chat-export-${new Date()
                .toISOString()
                .slice(0, 10)}.pdf`;
              link.click();
              URL.revokeObjectURL(url);
              toast.success("PDF downloaded successfully");
            });
        }
      );
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadCSV = () => {
    try {
      let csvContent =
        "Type,Category,Title,Description,URL,Status,Visibility,Date\n";

      const escapeCSV = (str) => `"${(str || "").replace(/"/g, '""')}"`;

      // Add selected items
      if (exportOptions.includeSelectedItems) {
        selectedResources
          .filter((item) => selectedItemOptions[item.id]?.selected)
          .forEach((item) => {
            csvContent += `${escapeCSV("Selected Item")},${escapeCSV(
              item.type || ""
            )},`;
            csvContent += `${escapeCSV(item.title || item.name || "")},`;
            csvContent += `${escapeCSV(stripHtml(item.description || ""))},`;
            csvContent += `${escapeCSV(item.url || "")},`;
            csvContent += `${escapeCSV(item.status || "")},`;
            csvContent += `${escapeCSV(item.visibility || "")},`;
            csvContent += `${escapeCSV(new Date().toISOString())}\n`;
          });
      }

      // Add referenced items
      if (exportOptions.includeReferencedItems) {
        referencedItems
          .filter((item) => referencedItemOptions[item.id]?.selected)
          .forEach((item) => {
            csvContent += `${escapeCSV("Referenced Item")},${escapeCSV(
              item.type || ""
            )},`;
            csvContent += `${escapeCSV(item.title || item.name || "")},`;
            csvContent += `${escapeCSV(stripHtml(item.description || ""))},`;
            csvContent += `${escapeCSV(item.url || "")},`;
            csvContent += `${escapeCSV(item.status || "")},`;
            csvContent += `${escapeCSV(item.visibility || "")},`;
            csvContent += `${escapeCSV(new Date().toISOString())}\n`;
          });
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ai-chat-export-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded successfully");
    } catch (error) {
      console.error("CSV generation error:", error);
      toast.error("Failed to generate CSV");
    }
  };

  const filterItems = (items, searchQuery) => {
    if (!searchQuery.trim()) return items;

    return items.filter(
      (item) =>
        (item.title || item.name || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.description || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (item.type || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/30 via-black/50 to-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200/80 bg-gradient-to-r from-gray-50/80 to-white/80">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Export Chat Data
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-full p-2 transition-all duration-200"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200/80 bg-gray-50/50">
          <button
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === "export"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white/60"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/30"
            }`}
            onClick={() => setActiveTab("export")}
          >
            Export & Preview
          </button>
          <button
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === "selection"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white/60"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/30"
            }`}
            onClick={() => setActiveTab("selection")}
          >
            Content Selection
          </button>
        </div>

        {loadingEnrichedData && (
          <div className="flex items-center justify-center p-4 bg-blue-50/80 border-b border-blue-200/50">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-700 text-sm font-medium">
                Loading detailed collection data for enhanced export...
              </span>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "selection" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Content Selection
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search all content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Basic Export Options */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">
                  Export Categories
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      key: "includeSelectedItems",
                      label: "Selected Items (+ button)",
                    },
                    {
                      key: "includeReferencedItems",
                      label: "AI Referenced Items",
                    },
                    { key: "includeChatHistory", label: "Chat History" },
                    { key: "includeBasicInfo", label: "Basic Information" },
                    {
                      key: "includeItemDescriptions",
                      label: "Item Descriptions",
                    },
                    { key: "includeItemUrls", label: "URLs" },
                  ].map(({ key, label }) => (
                    <div key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        id={key}
                        checked={exportOptions[key]}
                        onChange={() => handleExportOptionToggle(key)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={key}
                        className="ml-2 text-sm text-gray-700"
                      >
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Items */}
              {exportOptions.includeSelectedItems &&
                selectedResources.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">
                        Selected Items ({selectedResources.length})
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleSelectAll(
                              selectedResources,
                              setSelectedItemOptions,
                              true
                            )
                          }
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() =>
                            handleSelectAll(
                              selectedResources,
                              setSelectedItemOptions,
                              false
                            )
                          }
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {filterItems(selectedResources, searchQuery).map(
                        (item) => {
                          const itemOption = selectedItemOptions[item.id];
                          return (
                            <div
                              key={item.id}
                              className="border border-gray-200 rounded-lg p-3"
                            >
                              <div className="flex items-center mb-2">
                                <input
                                  type="checkbox"
                                  id={`selected-${item.id}`}
                                  checked={itemOption?.selected || false}
                                  onChange={() =>
                                    handleItemToggle(
                                      item.id,
                                      setSelectedItemOptions
                                    )
                                  }
                                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                                <label
                                  htmlFor={`selected-${item.id}`}
                                  className="ml-2 font-medium text-gray-900"
                                >
                                  {item.title || item.name || "Untitled"}
                                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    {(item.type || "item").replace("_", " ")}
                                  </span>
                                </label>
                              </div>

                              {itemOption?.selected && (
                                <div className="ml-6 grid grid-cols-2 gap-2">
                                  {[
                                    { key: "includeTitle", label: "Title" },
                                    {
                                      key: "includeDescription",
                                      label: "Description",
                                    },
                                    { key: "includeUrl", label: "URL" },
                                    { key: "includeType", label: "Type" },
                                  ].map(({ key, label }) => (
                                    <div
                                      key={key}
                                      className="flex items-center"
                                    >
                                      <input
                                        type="checkbox"
                                        id={`${item.id}-${key}`}
                                        checked={itemOption?.[key] || false}
                                        onChange={() =>
                                          handleItemOptionToggle(
                                            item.id,
                                            key,
                                            setSelectedItemOptions
                                          )
                                        }
                                        className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                      />
                                      <label
                                        htmlFor={`${item.id}-${key}`}
                                        className="ml-2 text-xs text-gray-600"
                                      >
                                        {label}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}

              {/* Referenced Items */}
              {exportOptions.includeReferencedItems &&
                referencedItems.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">
                        Referenced Items ({referencedItems.length})
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleSelectAll(
                              referencedItems,
                              setReferencedItemOptions,
                              true
                            )
                          }
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() =>
                            handleSelectAll(
                              referencedItems,
                              setReferencedItemOptions,
                              false
                            )
                          }
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {filterItems(referencedItems, searchQuery).map((item) => {
                        const itemOption = referencedItemOptions[item.id];
                        return (
                          <div
                            key={item.id}
                            className="border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex items-center mb-2">
                              <input
                                type="checkbox"
                                id={`referenced-${item.id}`}
                                checked={itemOption?.selected || false}
                                onChange={() =>
                                  handleItemToggle(
                                    item.id,
                                    setReferencedItemOptions
                                  )
                                }
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`referenced-${item.id}`}
                                className="ml-2 font-medium text-gray-900"
                              >
                                {item.title || item.name || "Untitled"}
                                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                  {(item.type || "item").replace("_", " ")}
                                </span>
                              </label>
                            </div>

                            {itemOption?.selected && (
                              <div className="ml-6 grid grid-cols-2 gap-2">
                                {[
                                  { key: "includeTitle", label: "Title" },
                                  {
                                    key: "includeDescription",
                                    label: "Description",
                                  },
                                  { key: "includeUrl", label: "URL" },
                                  { key: "includeType", label: "Type" },
                                ].map(({ key, label }) => (
                                  <div key={key} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`${item.id}-ref-${key}`}
                                      checked={itemOption?.[key] || false}
                                      onChange={() =>
                                        handleItemOptionToggle(
                                          item.id,
                                          key,
                                          setReferencedItemOptions
                                        )
                                      }
                                      className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <label
                                      htmlFor={`${item.id}-ref-${key}`}
                                      className="ml-2 text-xs text-gray-600"
                                    >
                                      {label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Chat History */}
              {exportOptions.includeChatHistory && chatHistory.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-gray-900">
                      Chat History ({chatHistory.length} messages)
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleSelectAll(
                            chatHistory,
                            setChatHistoryOptions,
                            true
                          )
                        }
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() =>
                          handleSelectAll(
                            chatHistory,
                            setChatHistoryOptions,
                            false
                          )
                        }
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {chatHistory.map((message, index) => {
                      const messageId = message.id || index;
                      const messageOption = chatHistoryOptions[messageId];
                      return (
                        <div
                          key={messageId}
                          className="border border-gray-200 rounded-lg p-3"
                        >
                          <div className="flex items-center mb-2">
                            <input
                              type="checkbox"
                              id={`chat-${messageId}`}
                              checked={messageOption?.selected || false}
                              onChange={() =>
                                handleItemToggle(
                                  messageId,
                                  setChatHistoryOptions
                                )
                              }
                              className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            <label
                              htmlFor={`chat-${messageId}`}
                              className="ml-2 font-medium text-gray-900"
                            >
                              Message {index + 1}
                              {message.timestamp && (
                                <span className="ml-2 text-xs text-gray-500">
                                  {new Date(
                                    message.timestamp
                                  ).toLocaleDateString()}
                                </span>
                              )}
                            </label>
                          </div>

                          {messageOption?.selected && (
                            <div className="ml-6 grid grid-cols-3 gap-2">
                              {[
                                { key: "includePrompt", label: "Question" },
                                { key: "includeAnswer", label: "AI Response" },
                                { key: "includeTimestamp", label: "Timestamp" },
                              ].map(({ key, label }) => (
                                <div key={key} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`${messageId}-${key}`}
                                    checked={messageOption?.[key] || false}
                                    onChange={() =>
                                      handleItemOptionToggle(
                                        messageId,
                                        key,
                                        setChatHistoryOptions
                                      )
                                    }
                                    className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                  />
                                  <label
                                    htmlFor={`${messageId}-${key}`}
                                    className="ml-2 text-xs text-gray-600"
                                  >
                                    {label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "export" && (
            <div className="space-y-6">
              {/* Content Preview Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">
                    Content Preview
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                        copied
                          ? "bg-green-100 text-green-700 border-2 border-green-200"
                          : "bg-blue-50 text-blue-700 border-2 border-blue-200 hover:bg-blue-100"
                      }`}
                    >
                      {copied ? (
                        <FaCheck className="h-4 w-4" />
                      ) : (
                        <FaCopy className="h-4 w-4" />
                      )}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-[40vh] overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {promptContent}
                  </pre>
                </div>
              </div>

              <h3 className="text-lg font-medium text-gray-900">
                Export Formats
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <FaFilePdf className="text-red-600 mr-2" />
                    PDF Export
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Export as a formatted PDF document with all selected
                    content.
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
                    Export as CSV for spreadsheet applications.
                  </p>
                  <button
                    onClick={handleDownloadCSV}
                    className="px-4 py-2 bg-green-50 text-green-700 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <FaDownload className="h-4 w-4" />
                    Download CSV
                  </button>
                </div>
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
    </div>
  );
};

export default ChatExportModal;
