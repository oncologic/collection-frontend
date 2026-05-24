"use client";
import React, { useState, useEffect, useRef } from "react";
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
import AttachmentBrowser from "./AttachmentBrowser";

const ExportCollectionModal = ({ isOpen, onClose, collection, resources, isAdmin = false }) => {
  const [copied, setCopied] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [activeTab, setActiveTab] = useState("prompt"); // "prompt", "pdf", or "csv"
  const [selectedResources, setSelectedResources] = useState([]);
  const [resourceOptions, setResourceOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("resources"); // "resources" or "notations"
  const [showAttachmentBrowser, setShowAttachmentBrowser] = useState(false);
  const generatePromptContentRef = useRef(null);

  useEffect(() => {
    if (isOpen && collection) {
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
      generatePromptContentRef.current?.(initialResourceOptions);
    }
  }, [isOpen, collection, resources]);

  // Update prompt content whenever resource options change
  useEffect(() => {
    if (resourceOptions.length > 0) {
      generatePromptContentRef.current?.(resourceOptions);
    }
  }, [resourceOptions]);

  if (!isOpen || !collection) return null;

  const generatePromptContent = (
    options = resourceOptions,
    resourcesData = resources.length > 0
      ? resources
      : collection.externalLinks || []
  ) => {
    // Add a prompt suggestion
    let prompt = `This collection contains valuable information about ${collection.name}.`;

    prompt += `\n\n# ${collection.name}\n\n`;

    if (collection.description) {
      // Convert HTML to markdown instead of stripping it
      const descriptionMarkdown = htmlToMarkdown(collection.description);
      prompt += `${descriptionMarkdown}\n\n`;
    }

    // Filter resources based on selection
    const filteredResources = resourcesData.filter((resource) =>
      options.find((opt) => opt.id === resource.id && opt.selected)
    );

    prompt += `## Resources (${filteredResources.length}):\n\n`;

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

      // Add timestamps if available
      if (
        resource?.timestamps &&
        Array.isArray(resource.timestamps) &&
        resource.timestamps.length > 0
      ) {
        prompt += `\nTimestamps:\n`;
        resource.timestamps.forEach((timestamp) => {
          if (timestamp && typeof timestamp === "object") {
            prompt += `- ${timestamp.title || "Untitled"}: ${
              timestamp.formattedTime || timestamp.time || "No time"
            }\n`;
          }
        });
        prompt += `\n`;
      }

      // Add notations if available and selected
      if (
        resource?.notations &&
        Array.isArray(resource.notations) &&
        resource.notations.length > 0 &&
        resourceOption?.includeNotations
      ) {
        const filteredNotations = resource.notations.filter(
          (notation) =>
            notation &&
            typeof notation === "object" &&
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

            if (notation.visibility) {
              prompt += ` [${notation.visibility}]`;
            }

            prompt += `\n`;

            // Add date information if available
            if (notation.date) {
              prompt += `  Date: ${notation.date}\n`;
            }

            // Add start and end time if available
            if (
              notation.startTime !== undefined &&
              notation.startTime !== null
            ) {
              prompt += `  Start Time: ${notation.startTime}`;
              if (notation.timezone) {
                prompt += ` (${notation.timezone})`;
              }
              prompt += `\n`;
            }

            if (notation.endTime !== undefined && notation.endTime !== null) {
              prompt += `  End Time: ${notation.endTime}`;
              if (notation.timezone) {
                prompt += ` (${notation.timezone})`;
              }
              prompt += `\n`;
            }

            // Add duration if both start and end times are available
            if (notation.startTime && notation.endTime) {
              try {
                const start = new Date(`1970-01-01T${notation.startTime}`);
                const end = new Date(`1970-01-01T${notation.endTime}`);
                const durationMs = end.getTime() - start.getTime();
                const hours = Math.floor(durationMs / (1000 * 60 * 60));
                const minutes = Math.floor(
                  (durationMs % (1000 * 60 * 60)) / (1000 * 60)
                );
                prompt += `  Duration: ${hours}h ${minutes}m\n`;
              } catch (error) {
                // If time parsing fails, just show the raw values
                prompt += `  Duration: ${notation.startTime} - ${notation.endTime}\n`;
              }
            }

            // Add timezone if available
            if (notation.timezone) {
              prompt += `  Timezone: ${notation.timezone}\n`;
            }

            // Add created/updated timestamps if available
            if (notation.createdAt) {
              const createdDate = new Date(notation.createdAt).toLocaleString();
              prompt += `  Created: ${createdDate}\n`;
            }

            if (notation.updatedAt) {
              const updatedDate = new Date(notation.updatedAt).toLocaleString();
              prompt += `  Updated: ${updatedDate}\n`;
            }

            // Add highlighted status if true
            if (notation.highlighted) {
              prompt += `  Highlighted: Yes\n`;
            }

            // Add list order if available
            if (
              notation.listOrder !== null &&
              notation.listOrder !== undefined
            ) {
              prompt += `  Order: ${notation.listOrder}\n`;
            }

            // Add description if available
            if (notation.description) {
              const descMarkdown = htmlToMarkdown(notation.description);
              prompt += `  Description: ${descMarkdown.replace(
                /\n/g,
                "\n  "
              )}\n`;
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

    setPromptContent(prompt);
  };
  generatePromptContentRef.current = generatePromptContent;

  // Convert HTML to Markdown to preserve formatting
  const htmlToMarkdown = (html) => {
    // First sanitize the HTML to prevent XSS
    const sanitizedHtml = DOMPurify.sanitize(html);

    // Create a temporary element to work with the HTML
    const temp = document.createElement("div");
    temp.innerHTML = sanitizedHtml;

    // Handle common HTML elements and convert to markdown
    // Replace <strong> or <b> with **
    let markdown = sanitizedHtml
      .replace(/<(strong|b)>(.*?)<\/(strong|b)>/gi, "**$2**")
      // Replace <em> or <i> with *
      .replace(/<(em|i)>(.*?)<\/(em|i)>/gi, "*$2*")
      // Replace <u> with __
      .replace(/<u>(.*?)<\/u>/gi, "__$1__")
      // Replace <h1> to <h6> with markdown headings
      .replace(/<h([1-6])>(.*?)<\/h\1>/gi, (_, level, content) => {
        return "\n" + "#".repeat(parseInt(level)) + " " + content.trim() + "\n";
      })
      // Replace <a> with markdown links
      .replace(
        /<a\s+(?:[^>]*?\s+)?href="([^"]*)"[^>]*>(.*?)<\/a>/gi,
        "[$2]($1)"
      )
      // Replace <ul> and <li> with markdown list items
      .replace(/<ul>(.*?)<\/ul>/gis, (_, content) => {
        return content.replace(/<li>(.*?)<\/li>/gis, "- $1\n");
      })
      // Replace <ol> and <li> with markdown numbered list items
      .replace(/<ol>(.*?)<\/ol>/gis, (_, content) => {
        let index = 1;
        return content.replace(/<li>(.*?)<\/li>/gis, () => {
          return `${index++}. $1\n`;
        });
      })
      // Replace <br> with newlines
      .replace(/<br\s*\/?>/gi, "\n")
      // Replace <p> with newlines
      .replace(/<p>(.*?)<\/p>/gi, "$1\n\n")
      // Remove any remaining HTML tags
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
        toast.success("Prompt copied to clipboard");
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
    const updatedOptions = resourceOptions.map((opt) => ({
      ...opt,
      selected: select,
    }));
    setResourceOptions(updatedOptions);
    generatePromptContent(updatedOptions);
  };

  // Add these new preset selection functions
  const handleQuickSelectNamesOnly = () => {
    // Select all resources with only name (no URL, description, or notations)
    const updatedOptions = resourceOptions.map((opt) => ({
      ...opt,
      selected: true,
      includeUrl: false,
      includeDescription: false,
      includeNotes: false,
      includeNotations: false,
      notationSelections: {},
    }));

    setResourceOptions(updatedOptions);
    setSelectedResources(resources.map((r) => r.id));
    generatePromptContent(updatedOptions);
  };

  const handleQuickSelectNamesAndUrls = () => {
    // Select all resources with name and URL only
    const updatedOptions = resourceOptions.map((opt) => ({
      ...opt,
      selected: true,
      includeUrl: true,
      includeDescription: false,
      includeNotes: false,
      includeNotations: false,
      notationSelections: {},
    }));

    setResourceOptions(updatedOptions);
    setSelectedResources(resources.map((r) => r.id));
    generatePromptContent(updatedOptions);
  };

  const handleQuickSelectNamesDescriptionsAndUrls = () => {
    // Select all resources with name, URL, and description
    const updatedOptions = resourceOptions.map((opt) => ({
      ...opt,
      selected: true,
      includeUrl: true,
      includeDescription: true,
      includeNotes: false,
      includeNotations: false,
      notationSelections: {},
    }));

    setResourceOptions(updatedOptions);
    setSelectedResources(resources.map((r) => r.id));
    generatePromptContent(updatedOptions);
  };

  const handleDownloadPDF = () => {
    try {
      Promise.all([import("@react-pdf/renderer"), import("marked")]).then(
        ([
          { pdf, Document, Page, Text, StyleSheet, View, Link },
          { marked },
        ]) => {
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
            heading2: {
              fontSize: 18,
              fontWeight: "bold",
              marginTop: 20,
              marginBottom: 12,
              color: "#2a2a2a",
              borderBottomWidth: 1,
              borderBottomColor: "#e5e5e5",
              paddingBottom: 8,
            },
            heading3: {
              fontSize: 14,
              fontWeight: "bold",
              marginTop: 16,
              marginBottom: 8,
              color: "#3a3a3a",
            },
            paragraph: {
              fontSize: 11,
              marginBottom: 10,
              lineHeight: 1.6,
              color: "#4a4a4a",
            },
            listItem: {
              fontSize: 11,
              marginBottom: 6,
              marginLeft: 15,
              lineHeight: 1.6,
              color: "#4a4a4a",
            },
            section: {
              marginBottom: 15,
              paddingBottom: 15,
              borderBottomWidth: 1,
              borderBottomColor: "#f0f0f0",
            },
            link: {
              fontSize: 11,
              color: "#2563eb",
              textDecoration: "underline",
            },
            resourceHeader: {
              fontSize: 16,
              fontWeight: "bold",
              marginTop: 12,
              marginBottom: 8,
              color: "#2a2a2a",
              backgroundColor: "#f8f9fa",
              padding: 8,
              borderRadius: 4,
            },
            resourceMeta: {
              fontSize: 11,
              marginBottom: 6,
              color: "#666666",
              fontWeight: "bold",
            },
            notationTitle: {
              fontSize: 12,
              fontWeight: "bold",
              marginTop: 8,
              marginBottom: 4,
              color: "#4a4a4a",
            },
            notationContent: {
              fontSize: 11,
              marginBottom: 6,
              marginLeft: 12,
              color: "#666666",
              lineHeight: 1.5,
            },
            notationsSection: {
              marginTop: 8,
              marginBottom: 12,
              borderLeftWidth: 2,
              borderLeftColor: "#e5e5e5",
              paddingLeft: 12,
              marginLeft: 4,
            },
            timestampItem: {
              fontSize: 10,
              marginBottom: 4,
              marginLeft: 12,
              color: "#666666",
              fontStyle: "italic",
            },
            bold: {
              fontWeight: "bold",
            },
            italic: {
              fontStyle: "italic",
            },
            underline: {
              textDecoration: "underline",
            },
          });

          // Filter resources based on selection
          const filteredResources = resources.filter((resource) =>
            resourceOptions.find(
              (opt) => opt.id === resource.id && opt.selected
            )
          );

          // Helper function to convert HTML to PDF-compatible text components
          const parseHtmlToPdfComponents = (htmlContent) => {
            // First sanitize the HTML
            const sanitizedHtml = DOMPurify.sanitize(htmlContent);

            // Convert to markdown
            const markdown = htmlToMarkdown(sanitizedHtml);

            // Parse markdown to get structured content
            const tokens = marked.lexer(markdown);

            // Convert tokens to PDF components
            return tokens.map((token, index) => {
              switch (token.type) {
                case "paragraph":
                  return (
                    <Text key={index} style={styles.paragraph}>
                      {token.text}
                    </Text>
                  );
                case "list":
                  return (
                    <View key={index}>
                      {token.items.map((item, itemIndex) => (
                        <Text key={itemIndex} style={styles.listItem}>
                          {token.ordered ? `${itemIndex + 1}. ` : "• "}
                          {item.text}
                        </Text>
                      ))}
                    </View>
                  );
                case "heading":
                  return (
                    <Text
                      key={index}
                      style={[
                        styles.paragraph,
                        {
                          fontSize: 14 - token.depth,
                          fontWeight: "bold",
                          marginTop: 10,
                        },
                      ]}
                    >
                      {token.text}
                    </Text>
                  );
                default:
                  return null;
              }
            });
          };

          const MyDocument = () => (
            <Document>
              <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                  <Text style={styles.title}>{collection.name}</Text>

                  {collection.description && (
                    <View>
                      {parseHtmlToPdfComponents(collection.description)}
                    </View>
                  )}

                  <Text style={styles.heading2}>
                    Resources ({filteredResources.length}):
                  </Text>

                  {filteredResources.map((resource, index) => {
                    const resourceOption = resourceOptions.find(
                      (opt) => opt.id === resource.id
                    );
                    return (
                      <View key={index} style={styles.section}>
                        <Text style={styles.resourceHeader}>
                          {index + 1}. {resource.name}
                        </Text>

                        {resource.url && resourceOption?.includeUrl && (
                          <View style={{ flexDirection: "row" }}>
                            <Text style={styles.resourceMeta}>URL: </Text>
                            <Link src={resource.url} style={styles.link}>
                              {resource.url}
                            </Link>
                          </View>
                        )}

                        {resource.description &&
                          resourceOption?.includeDescription && (
                            <View>
                              <Text style={styles.resourceMeta}>
                                Description:
                              </Text>
                              {parseHtmlToPdfComponents(resource.description)}
                            </View>
                          )}

                        {resource.notes && resourceOption?.includeNotes && (
                          <View>
                            <Text style={styles.resourceMeta}>Notes:</Text>
                            {parseHtmlToPdfComponents(resource.notes)}
                          </View>
                        )}

                        {/* Add timestamps if available */}
                        {resource?.timestamps &&
                          resource?.timestamps?.length > 0 && (
                            <View>
                              <Text style={styles.resourceMeta}>
                                Timestamps:
                              </Text>
                              {resource?.timestamps?.map((timestamp, idx) => (
                                <Text key={idx} style={styles.timestampItem}>
                                  • {timestamp.title}: {timestamp.formattedTime}
                                </Text>
                              ))}
                            </View>
                          )}

                        {/* Add notations if available and selected */}
                        {resource?.notations &&
                          resource?.notations?.length > 0 &&
                          resourceOption?.includeNotations && (
                            <View style={styles.notationsSection}>
                              <Text style={styles.resourceMeta}>
                                Notations:
                              </Text>
                              {resource?.notations
                                ?.filter(
                                  (notation) =>
                                    resourceOption.notationSelections?.[
                                      notation.id
                                    ]?.selected !== false
                                )
                                .map((notation, idx) => (
                                  <View key={idx}>
                                    <Text style={styles.notationTitle}>
                                      • {notation.title || "Untitled Notation"}
                                      {notation.status
                                        ? ` (${notation.status})`
                                        : ""}
                                      {notation.visibility
                                        ? ` [${notation.visibility}]`
                                        : ""}
                                    </Text>

                                    {/* Date */}
                                    {notation.date && (
                                      <Text style={styles.notationContent}>
                                        Date: {notation.date}
                                      </Text>
                                    )}

                                    {/* Start Time */}
                                    {notation.startTime && (
                                      <Text style={styles.notationContent}>
                                        Start Time: {notation.startTime}
                                        {notation.timezone
                                          ? ` (${notation.timezone})`
                                          : ""}
                                      </Text>
                                    )}

                                    {/* End Time */}
                                    {notation.endTime && (
                                      <Text style={styles.notationContent}>
                                        End Time: {notation.endTime}
                                        {notation.timezone
                                          ? ` (${notation.timezone})`
                                          : ""}
                                      </Text>
                                    )}

                                    {/* Duration */}
                                    {notation.startTime &&
                                      notation.endTime &&
                                      (() => {
                                        try {
                                          const start = new Date(
                                            `1970-01-01T${notation.startTime}`
                                          );
                                          const end = new Date(
                                            `1970-01-01T${notation.endTime}`
                                          );
                                          const durationMs =
                                            end.getTime() - start.getTime();
                                          const hours = Math.floor(
                                            durationMs / (1000 * 60 * 60)
                                          );
                                          const minutes = Math.floor(
                                            (durationMs % (1000 * 60 * 60)) /
                                              (1000 * 60)
                                          );
                                          return (
                                            <Text
                                              style={styles.notationContent}
                                            >
                                              Duration: {hours}h {minutes}m
                                            </Text>
                                          );
                                        } catch (error) {
                                          return (
                                            <Text
                                              style={styles.notationContent}
                                            >
                                              Duration: {notation.startTime} -{" "}
                                              {notation.endTime}
                                            </Text>
                                          );
                                        }
                                      })()}

                                    {/* Timezone */}
                                    {notation.timezone && (
                                      <Text style={styles.notationContent}>
                                        Timezone: {notation.timezone}
                                      </Text>
                                    )}

                                    {/* Created At */}
                                    {notation.createdAt && (
                                      <Text style={styles.notationContent}>
                                        Created:{" "}
                                        {new Date(
                                          notation.createdAt
                                        ).toLocaleString()}
                                      </Text>
                                    )}

                                    {/* Updated At */}
                                    {notation.updatedAt && (
                                      <Text style={styles.notationContent}>
                                        Updated:{" "}
                                        {new Date(
                                          notation.updatedAt
                                        ).toLocaleString()}
                                      </Text>
                                    )}

                                    {/* Highlighted */}
                                    {notation.highlighted && (
                                      <Text style={styles.notationContent}>
                                        Highlighted: Yes
                                      </Text>
                                    )}

                                    {/* List Order */}
                                    {notation.listOrder !== null &&
                                      notation.listOrder !== undefined && (
                                        <Text style={styles.notationContent}>
                                          Order: {notation.listOrder}
                                        </Text>
                                      )}

                                    {/* Description */}
                                    {notation.description && (
                                      <Text style={styles.notationContent}>
                                        Description:{" "}
                                        {stripHtml(notation.description)}
                                      </Text>
                                    )}

                                    {/* Notes */}
                                    {notation.notes && (
                                      <Text style={styles.notationContent}>
                                        Notes: {stripHtml(notation.notes)}
                                      </Text>
                                    )}
                                  </View>
                                ))}
                            </View>
                          )}
                      </View>
                    );
                  })}
                </View>
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
              link.download = `${collection.name
                .replace(/\s+/g, "-")
                .toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
              link.click();

              // Clean up
              URL.revokeObjectURL(url);
              toast.success("Collection downloaded as PDF");
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
      // Create CSV content with enhanced headers
      let csvContent =
        "Resource Name,URL,Description,Notes,Notation Title,Notation Date,Start Time,End Time,Duration,Timezone,Status,Visibility,Highlighted,Created,Updated,Notation Description,Notation Notes\n";

      // Filter resources based on selection
      const filteredResources = resources.filter((resource) =>
        resourceOptions.find((opt) => opt.id === resource.id && opt.selected)
      );

      filteredResources.forEach((resource) => {
        const resourceOption = resourceOptions.find(
          (opt) => opt.id === resource.id
        );

        // Escape function for CSV fields
        const escapeCSV = (str) => `"${(str || "").replace(/"/g, '""')}"`;

        // Basic resource info
        const resourceName = escapeCSV(resource.name || "");
        const resourceUrl = resourceOption?.includeUrl
          ? escapeCSV(resource.url || "")
          : '""';
        const resourceDescription = resourceOption?.includeDescription
          ? escapeCSV(stripHtml(resource.description || ""))
          : '""';
        const resourceNotes = resourceOption?.includeNotes
          ? escapeCSV(stripHtml(resource.notes || ""))
          : '""';

        // Check if resource has notations and they're included
        if (
          resource.notations &&
          Array.isArray(resource.notations) &&
          resource.notations.length > 0 &&
          resourceOption?.includeNotations
        ) {
          const filteredNotations = resource.notations.filter(
            (notation) =>
              notation &&
              typeof notation === "object" &&
              resourceOption.notationSelections?.[notation.id]?.selected !==
                false
          );

          if (filteredNotations.length > 0) {
            // Add a row for each notation
            filteredNotations.forEach((notation) => {
              // Calculate duration
              let duration = "";
              if (notation.startTime && notation.endTime) {
                try {
                  const start = new Date(`1970-01-01T${notation.startTime}`);
                  const end = new Date(`1970-01-01T${notation.endTime}`);
                  const durationMs = end.getTime() - start.getTime();
                  const hours = Math.floor(durationMs / (1000 * 60 * 60));
                  const minutes = Math.floor(
                    (durationMs % (1000 * 60 * 60)) / (1000 * 60)
                  );
                  duration = `${hours}h ${minutes}m`;
                } catch (error) {
                  duration = `${notation.startTime} - ${notation.endTime}`;
                }
              }

              const notationFields = [
                escapeCSV(notation.title || ""),
                escapeCSV(notation.date || ""),
                escapeCSV(notation.startTime || ""),
                escapeCSV(notation.endTime || ""),
                escapeCSV(duration),
                escapeCSV(notation.timezone || ""),
                escapeCSV(notation.status || ""),
                escapeCSV(notation.visibility || ""),
                escapeCSV(notation.highlighted ? "Yes" : "No"),
                escapeCSV(
                  notation.createdAt
                    ? new Date(notation.createdAt).toLocaleString()
                    : ""
                ),
                escapeCSV(
                  notation.updatedAt
                    ? new Date(notation.updatedAt).toLocaleString()
                    : ""
                ),
                escapeCSV(stripHtml(notation.description || "")),
                escapeCSV(stripHtml(notation.notes || "")),
              ];

              csvContent += `${resourceName},${resourceUrl},${resourceDescription},${resourceNotes},${notationFields.join(
                ","
              )}\n`;
            });
          } else {
            // Resource has no selected notations, add empty notation fields
            const emptyNotationFields = Array(13).fill('""').join(",");
            csvContent += `${resourceName},${resourceUrl},${resourceDescription},${resourceNotes},${emptyNotationFields}\n`;
          }
        } else {
          // Resource has no notations or notations not included, add empty notation fields
          const emptyNotationFields = Array(13).fill('""').join(",");
          csvContent += `${resourceName},${resourceUrl},${resourceDescription},${resourceNotes},${emptyNotationFields}\n`;
        }
      });

      // Create and trigger download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${collection.name
        .replace(/\s+/g, "-")
        .toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
      toast.success("Collection downloaded as CSV");
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

  // Add this function to filter notations based on search query
  const filterNotationsBySearch = (notations) => {
    if (!searchQuery.trim()) return notations;

    return notations.filter(
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

    // Filter resources based on selection
    const filteredResources = resources.filter((resource) =>
      resourceOptions.find((opt) => opt.id === resource.id && opt.selected)
    );

    filteredResources.forEach((resource) => {
      if (
        resource.attachments &&
        Array.isArray(resource.attachments) &&
        resource.attachments.length > 0
      ) {
        // Add resource context to each attachment
        resource.attachments.forEach((attachment) => {
          if (attachment && typeof attachment === "object") {
            attachments.push({
              ...attachment,
              resourceName: resource.name,
              resourceId: resource.id,
            });
          }
        });
      }
    });

    return attachments;
  };

  // Handle opening the attachment browser
  const handleOpenAttachments = () => {
    const attachments = getSelectedResourceAttachments();
    if (attachments.length === 0) {
      toast.error("No attachments found in selected resources");
      return;
    }
    setShowAttachmentBrowser(true);
  };

  // Handle closing the attachment browser
  const handleCloseAttachments = () => {
    setShowAttachmentBrowser(false);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/30 via-black/50 to-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200/80 bg-gradient-to-r from-gray-50/80 to-white/80">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Export Collection
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
              activeTab === "prompt"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white/60"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/30"
            }`}
            onClick={() => setActiveTab("prompt")}
          >
            LLM Prompt
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
                Edit this prompt to customize it before copying or sending to an
                LLM:
              </p>
              <textarea
                value={promptContent}
                onChange={(e) => setPromptContent(e.target.value)}
                className="w-full h-[300px] p-3 border border-gray-300 rounded-lg font-mono text-sm"
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

              {/* Add attachments section */}
              <div className="mt-6 p-4 bg-gradient-to-r from-gray-50/80 to-white/80 rounded-xl border border-gray-200/60 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Resource Attachments
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Download files from your selected resources to upload
                      alongside your prompt
                    </p>
                  </div>
                  <div className="text-xs text-gray-500 bg-gray-100/80 px-3 py-1 rounded-full">
                    {(() => {
                      const attachmentCount =
                        getSelectedResourceAttachments().length;
                      return attachmentCount > 0
                        ? `${attachmentCount} file${
                            attachmentCount === 1 ? "" : "s"
                          } available`
                        : "No files available";
                    })()}
                  </div>
                </div>
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
                  Export your collection as a formatted PDF document including
                  all resources and their details.
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
                  Export your collection as a CSV file that can be opened in
                  Excel or other spreadsheet applications.
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
                  Send your collection data to an AI assistant for analysis.
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
                <h3 className="text-lg font-medium text-gray-900">
                  Select Resources to Include
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => handleSelectAll(false)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Add Quick Selection Presets */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Quick Selection Presets:
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleQuickSelectNamesOnly}
                    className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Names Only
                  </button>
                  <button
                    onClick={handleQuickSelectNamesAndUrls}
                    className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                  >
                    Names + URLs
                  </button>
                  <button
                    onClick={handleQuickSelectNamesDescriptionsAndUrls}
                    className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
                  >
                    Names + URLs + Descriptions
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  These presets will automatically select all items with the
                  specified information included.
                </p>
              </div>

              {/* Search Resources */}
              <div className="mb-4">
                {/* Search mode toggle */}
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

                  // Filter notations based on search query and mode
                  const filteredNotations = resource.notations
                    ? searchMode === "notations"
                      ? filterNotationsBySearch(resource.notations)
                      : resource.notations // Show all notations when searching resources
                    : [];

                  // Check if resource matches search query (only when in resources mode)
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

                  // Check if any notations match search query (only when in notations mode)
                  const hasMatchingNotations =
                    searchMode === "notations" && searchQuery.trim()
                      ? filteredNotations.length > 0
                      : false;

                  // Show resource logic based on search mode
                  let shouldShowResource;
                  if (!searchQuery.trim()) {
                    // No search query - show all resources
                    shouldShowResource = true;
                  } else if (searchMode === "resources") {
                    // Resources mode - show if resource matches
                    shouldShowResource = resourceMatches;
                  } else {
                    // Notations mode - show if has matching notations
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
                          className="ml-2 text-sm font-medium text-gray-900"
                        >
                          {resource.name}
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
                                              className="ml-2 text-xs text-gray-700 truncate max-w-[150px]"
                                            >
                                              {notation.title ||
                                                "Untitled notation"}

                                              {notation.visibility && (
                                                <span className="ml-1 text-gray-500 text-xs capitalize">
                                                  ({notation.visibility})
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
                                    ) : searchQuery &&
                                      searchMode === "resources" &&
                                      resource.notations.length > 0 ? (
                                      <div className="text-xs text-gray-500 py-1">
                                        All notations shown (resource matched
                                        search)
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
              title="Resource Attachments"
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

export default ExportCollectionModal;
