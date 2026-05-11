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
  FaFileArchive,
  FaEnvelope,
} from "react-icons/fa";
import toast from "react-hot-toast";
import DOMPurify from "dompurify";
import AttachmentBrowser from "./AttachmentBrowser";

const ExportExternalLinkModal = ({
  isOpen,
  onClose,
  externalLink,
  linkGroups = {},
  linkedResources = [],
  isAdmin = false,
  isCollaborator = false,
  userRole = "",
  systemUserId = "",
}) => {
  const [copied, setCopied] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [activeTab, setActiveTab] = useState("export");
  const [exportOptions, setExportOptions] = useState({
    includeBasicInfo: true,
    includeDescription: true,
    includeUrl: true,
    includeLinkGroups: true,
    includeNotations: true,
    includeAttachments: false, // Just reference, not actual files
    includeResources: true,
    includeSubmitterInfo: false, // Include name/email for public submissions
  });

  const [linkGroupOptions, setLinkGroupOptions] = useState({});
  const [notationOptions, setNotationOptions] = useState({});
  const [resourceOptions, setResourceOptions] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState("all"); // "all", "notations", "linkgroups"
  const [showAttachmentBrowser, setShowAttachmentBrowser] = useState(false);

  // Add individual search states
  const [linkGroupSearch, setLinkGroupSearch] = useState("");
  const [notationSearch, setNotationSearch] = useState("");
  const [notationStatusFilter, setNotationStatusFilter] = useState("all"); // "all", "active", "completed", "pending", etc.

  useEffect(() => {
    if (isOpen && externalLink) {
      // Initialize link group options
      const initialLinkGroupOptions = {};
      Object.entries(linkGroups || {}).forEach(([category, items]) => {
        initialLinkGroupOptions[category] = {
          selected: true,
          items: items.reduce((acc, item) => {
            acc[item.id] = {
              selected: true,
              includeUrl: true,
              includeDescription: true,
              includeCategory: true,
            };
            return acc;
          }, {}),
        };
      });
      setLinkGroupOptions(initialLinkGroupOptions);

      // Initialize notation options
      const initialNotationOptions = {};
      if (externalLink.notations) {
        externalLink.notations.forEach((notation) => {
          initialNotationOptions[notation.id] = {
            selected: true,
            includeTitle: true,
            includeNotes: true,
            includeDate: true,
            includeTime: true,
            includeStatus: true,
            includeCategory: true,
            includeVisibility: true,
            includeHighlighted: true,
            includeSubmitterInfo: exportOptions.includeSubmitterInfo,
          };
        });
      }
      setNotationOptions(initialNotationOptions);

      // Initialize resource options
      const initialResourceOptions = {};
      if (linkedResources) {
        linkedResources.forEach((linkResource) => {
          initialResourceOptions[linkResource.id] = {
            selected: true,
            includeUrl: true,
            includeDescription: true,
            includeType: true,
            includeMetadata: true,
            includeNotes: true,
          };
        });
      }
      setResourceOptions(initialResourceOptions);

      // Generate initial prompt content
      generatePromptContent();
    }
  }, [isOpen, externalLink, linkGroups]);

  // Update prompt content whenever options change
  useEffect(() => {
    if (isOpen && externalLink) {
      generatePromptContent();
    }
  }, [exportOptions, linkGroupOptions, notationOptions, resourceOptions]);

  if (!isOpen || !externalLink) return null;

  const htmlToMarkdown = (html) => {
    if (!html) return "";
    try {
      // Clean HTML first
      const cleanHtml = DOMPurify.sanitize(html);
      // Convert to markdown using marked (reverse process)
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
    let prompt = `# ${externalLink.name}\n\n`;

    // Basic information
    if (exportOptions.includeBasicInfo) {
      prompt += `**Type:** ${
        externalLink.type?.replace("_", " ") || "Unknown"
      }\n`;
      prompt += `**Status:** ${externalLink.status || "Active"}\n`;
      prompt += `**Visibility:** ${externalLink.visibility || "Private"}\n`;
      if (externalLink.date) {
        prompt += `**Date:** ${externalLink.date}\n`;
      }
      if (externalLink.startTime || externalLink.endTime) {
        prompt += `**Time:** ${externalLink.startTime || ""} - ${
          externalLink.endTime || ""
        }\n`;
      }
      prompt += `\n`;
    }

    // URL
    if (exportOptions.includeUrl && externalLink.url) {
      prompt += `**URL:** ${externalLink.url}\n\n`;
    }

    // Description
    if (exportOptions.includeDescription && externalLink.description) {
      const descriptionMarkdown = htmlToMarkdown(externalLink.description);
      prompt += `## Description\n\n${descriptionMarkdown}\n\n`;
    }

    // Link Groups
    if (
      exportOptions.includeLinkGroups &&
      Object.keys(linkGroups || {}).length > 0
    ) {
      prompt += `## Related Links\n\n`;

      Object.entries(linkGroups || {}).forEach(([category, items]) => {
        const categoryOption = linkGroupOptions[category];
        if (categoryOption?.selected && items.length > 0) {
          prompt += `### ${
            category.charAt(0).toUpperCase() + category.slice(1)
          }s\n\n`;

          items.forEach((item) => {
            const itemOption = categoryOption.items[item.id];
            if (itemOption?.selected) {
              prompt += `- **${item.name}**\n`;

              if (itemOption.includeUrl && item.url) {
                prompt += `  - URL: ${item.url}\n`;
              }

              if (itemOption.includeDescription && item.description) {
                const desc = htmlToMarkdown(item.description);
                prompt += `  - Description: ${desc}\n`;
              }

              if (itemOption.includeCategory && item.category) {
                prompt += `  - Category: ${item.category}\n`;
              }

              prompt += `\n`;
            }
          });
        }
      });
    }

    // Notations
    if (exportOptions.includeNotations && externalLink.notations?.length > 0) {
      const selectedNotations = externalLink.notations.filter(
        (notation) => notationOptions[notation.id]?.selected
      );

      if (selectedNotations.length > 0) {
        prompt += `## Notes (${selectedNotations.length})\n\n`;

        selectedNotations.forEach((notation, index) => {
          const notationOption = notationOptions[notation.id];

          prompt += `### ${index + 1}. `;

          if (notationOption.includeTitle && notation.title) {
            prompt += `${notation.title}`;
          } else {
            prompt += `Note ${index + 1}`;
          }

          if (notationOption.includeHighlighted && notation.highlighted) {
            prompt += ` ⭐`;
          }

          prompt += `\n\n`;

          // Metadata
          const metadata = [];
          if (notationOption.includeDate && notation.date) {
            metadata.push(`Date: ${notation.date}`);
          }
          if (
            notationOption.includeTime &&
            (notation.startTime || notation.endTime)
          ) {
            const timeStr = `${notation.startTime || ""} - ${
              notation.endTime || ""
            }`.trim();
            if (timeStr !== "-") {
              metadata.push(`Time: ${timeStr}`);
            }
          }
          if (notationOption.includeStatus && notation.status) {
            metadata.push(`Status: ${notation.status}`);
          }
          if (notationOption.includeCategory && notation.category) {
            metadata.push(`Category: ${notation.category}`);
          }
          if (notationOption.includeVisibility && notation.visibility) {
            metadata.push(`Visibility: ${notation.visibility}`);
          }

          if (metadata.length > 0) {
            prompt += `*${metadata.join(" | ")}*\n\n`;
          }

          // Notes content
          if (notationOption.includeNotes && notation.notes) {
            const notesMarkdown = htmlToMarkdown(notation.notes);
            prompt += `${notesMarkdown}\n\n`;
          }

          // Submitter info (for public submissions)
          if (notationOption.includeSubmitterInfo && notation.submissionMetadata) {
            const submitterInfo = [];
            if (notation.submissionMetadata.submitterName) {
              submitterInfo.push(`Submitted by: ${notation.submissionMetadata.submitterName}`);
            }
            if (notation.submissionMetadata.submitterEmail) {
              submitterInfo.push(`Email: ${notation.submissionMetadata.submitterEmail}`);
            }
            if (submitterInfo.length > 0) {
              prompt += `*${submitterInfo.join(" | ")}*\n\n`;
            }
          }
        });
      }
    }

    // Resources
    if (exportOptions.includeResources && linkedResources?.length > 0) {
      const selectedResources = linkedResources.filter(
        (linkResource) => resourceOptions[linkResource.id]?.selected
      );

      if (selectedResources.length > 0) {
        prompt += `## Resources (${selectedResources.length})\n\n`;

        selectedResources.forEach((linkResource, index) => {
          const resource = linkResource.resource;
          const resourceOption = resourceOptions[linkResource.id];

          prompt += `### ${index + 1}. **${resource.name}**\n\n`;

          // Metadata
          const metadata = [];
          if (resourceOption.includeType && resource.resourceType) {
            metadata.push(`Type: ${resource.resourceType.name}`);
          }
          if (resourceOption.includeMetadata) {
            if (resource.sensitivityLevel) {
              metadata.push(`Sensitivity: ${resource.sensitivityLevel.name}`);
            }
            if (resource.expertiseLevel) {
              metadata.push(`Expertise: ${resource.expertiseLevel.name}`);
            }
          }

          if (metadata.length > 0) {
            prompt += `*${metadata.join(" | ")}*\n\n`;
          }

          // Resource content
          if (resourceOption.includeDescription && resource.description) {
            prompt += `${resource.description}\n\n`;
          }

          if (resourceOption.includeUrl && resource.url) {
            prompt += `**URL:** ${resource.url}\n\n`;
          }

          if (resourceOption.includeNotes && linkResource.notes) {
            prompt += `**Note:** ${linkResource.notes}\n\n`;
          }
        });
      }
    }

    // Attachments reference
    if (
      exportOptions.includeAttachments &&
      externalLink.attachments?.length > 0
    ) {
      prompt += `## Attachments (${externalLink.attachments.length})\n\n`;
      externalLink.attachments.forEach((attachment, index) => {
        prompt += `${index + 1}. **${
          attachment.title || attachment.name || "Untitled"
        }**\n`;
        if (attachment.description) {
          prompt += `   - ${attachment.description}\n`;
        }
        if (attachment.type) {
          prompt += `   - Type: ${attachment.type}\n`;
        }
        prompt += `\n`;
      });
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

  const handleLinkGroupCategoryToggle = (category) => {
    setLinkGroupOptions((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        selected: !prev[category]?.selected,
      },
    }));
  };

  const handleLinkGroupItemToggle = (category, itemId) => {
    setLinkGroupOptions((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        items: {
          ...prev[category].items,
          [itemId]: {
            ...prev[category].items[itemId],
            selected: !prev[category].items[itemId]?.selected,
          },
        },
      },
    }));
  };

  const handleLinkGroupItemOptionToggle = (category, itemId, option) => {
    setLinkGroupOptions((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        items: {
          ...prev[category].items,
          [itemId]: {
            ...prev[category].items[itemId],
            [option]: !prev[category].items[itemId]?.[option],
          },
        },
      },
    }));
  };

  const handleNotationToggle = (notationId) => {
    setNotationOptions((prev) => ({
      ...prev,
      [notationId]: {
        ...prev[notationId],
        selected: !prev[notationId]?.selected,
      },
    }));
  };

  const handleNotationOptionToggle = (notationId, option) => {
    setNotationOptions((prev) => ({
      ...prev,
      [notationId]: {
        ...prev[notationId],
        [option]: !prev[notationId]?.[option],
      },
    }));
  };

  const handleSelectAllNotations = (selected) => {
    const updatedOptions = {};
    externalLink.notations?.forEach((notation) => {
      updatedOptions[notation.id] = {
        ...notationOptions[notation.id],
        selected,
      };
    });
    setNotationOptions((prev) => ({ ...prev, ...updatedOptions }));
  };

  const handleSelectAllLinkGroups = (selected) => {
    const updatedOptions = {};
    Object.entries(linkGroups || {}).forEach(([category, items]) => {
      updatedOptions[category] = {
        selected,
        items: items.reduce((acc, item) => {
          acc[item.id] = {
            ...linkGroupOptions[category]?.items[item.id],
            selected,
          };
          return acc;
        }, {}),
      };
    });
    setLinkGroupOptions((prev) => ({ ...prev, ...updatedOptions }));
  };

  const handleResourceToggle = (resourceId) => {
    setResourceOptions((prev) => ({
      ...prev,
      [resourceId]: {
        ...prev[resourceId],
        selected: !prev[resourceId]?.selected,
      },
    }));
  };

  const handleResourceOptionToggle = (resourceId, option) => {
    setResourceOptions((prev) => ({
      ...prev,
      [resourceId]: {
        ...prev[resourceId],
        [option]: !prev[resourceId]?.[option],
      },
    }));
  };

  const handleSelectAllResources = (selected) => {
    const updatedOptions = {};
    linkedResources?.forEach((linkResource) => {
      updatedOptions[linkResource.id] = {
        ...resourceOptions[linkResource.id],
        selected,
      };
    });
    setResourceOptions((prev) => ({ ...prev, ...updatedOptions }));
  };

  const handleDownloadPDF = async () => {
    try {
      const loadingToast = toast.loading("Preparing PDF export...");

      Promise.all([import("@react-pdf/renderer"), import("marked")]).then(
        ([
          { pdf, Document, Page, Text, StyleSheet, View, Link, Image },
          { marked },
        ]) => {
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
            link: {
              fontSize: 11,
              color: "#0066cc",
              textDecoration: "underline",
            },
            metadata: {
              fontSize: 10,
              color: "#666666",
              marginBottom: 5,
              fontStyle: "italic",
            },
            notationHeader: {
              fontSize: 13,
              fontWeight: "bold",
              marginTop: 12,
              marginBottom: 6,
              color: "#2a2a2a",
              backgroundColor: "#f8f9fa",
              padding: 6,
              borderRadius: 3,
            },
            notationContent: {
              fontSize: 11,
              marginBottom: 8,
              marginLeft: 10,
              color: "#555555",
              lineHeight: 1.5,
            },
            linkGroupHeader: {
              fontSize: 14,
              fontWeight: "bold",
              marginTop: 15,
              marginBottom: 8,
              color: "#2a2a2a",
              backgroundColor: "#f0f8ff",
              padding: 6,
              borderRadius: 3,
            },
            linkItem: {
              fontSize: 11,
              marginBottom: 6,
              marginLeft: 12,
              color: "#555555",
            },
            basicInfo: {
              fontSize: 11,
              marginBottom: 4,
              color: "#666666",
            },
          });

          const parseHtmlToPdfComponents = (htmlContent) => {
            if (!htmlContent) return [];

            // Simple HTML to text extraction for PDF
            const cleanHtml = DOMPurify.sanitize(htmlContent);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cleanHtml;

            const components = [];

            // Process all child nodes
            const processNode = (node) => {
              if (node.nodeType === Node.TEXT_NODE) {
                // Text node
                const text = node.textContent.trim();
                if (text) {
                  components.push(
                    <Text key={`text-${components.length}`} style={styles.text}>
                      {text}
                    </Text>
                  );
                }
              } else if (node.nodeName === 'IMG') {
                // For images, create a simple placeholder with the URL
                const src = node.getAttribute('src');
                const alt = node.getAttribute('alt') || 'Image';

                components.push(
                  <View key={`image-placeholder-${components.length}`} style={{
                    marginVertical: 10,
                    padding: 12,
                    backgroundColor: '#f8f9fa',
                    borderWidth: 1,
                    borderColor: '#dee2e6',
                    borderRadius: 4
                  }}>
                    <Text style={{ fontSize: 10, color: '#495057', fontWeight: 'bold', marginBottom: 4 }}>
                      📷 {alt}
                    </Text>
                    <Text style={{ fontSize: 8, color: '#6c757d', fontStyle: 'italic' }}>
                      [Image not embedded in PDF - view in browser]
                    </Text>
                  </View>
                );
              } else if (node.nodeName === 'BR') {
                // Line break
                components.push(
                  <Text key={`br-${components.length}`} style={styles.text}>
                    {' '}
                  </Text>
                );
              } else if (node.childNodes.length > 0) {
                // Process child nodes for any other element
                for (let child of node.childNodes) {
                  processNode(child);
                }
              } else {
                // For other elements without children, extract text content
                const text = node.textContent.trim();
                if (text) {
                  components.push(
                    <Text key={`text-${components.length}`} style={styles.text}>
                      {text}
                    </Text>
                  );
                }
              }
            };

            // Process all child nodes of the temp div
            for (let child of tempDiv.childNodes) {
              processNode(child);
            }

            // If no components were created, return text-only fallback
            if (components.length === 0) {
              const textContent = cleanHtml
                .replace(/<[^>]*>/g, " ")
                .replace(/\s+/g, " ")
                .trim();

              if (textContent) {
                return [
                  <Text key="content" style={styles.text}>
                    {textContent}
                  </Text>,
                ];
              }
            }

            return components;
          };

          const MyDocument = () => (
            <Document>
              <Page size="A4" style={styles.page}>
                <View style={styles.section}>
                  <Text style={styles.title}>{externalLink.name}</Text>

                  {/* Basic Information */}
                  {exportOptions.includeBasicInfo && (
                    <View>
                      <Text style={styles.heading2}>Basic Information</Text>
                      <Text style={styles.basicInfo}>
                        Type:{" "}
                        {externalLink.type?.replace("_", " ") || "Unknown"}
                      </Text>
                      <Text style={styles.basicInfo}>
                        Status: {externalLink.status || "Active"}
                      </Text>
                      <Text style={styles.basicInfo}>
                        Visibility: {externalLink.visibility || "Private"}
                      </Text>
                      {externalLink.date && (
                        <Text style={styles.basicInfo}>
                          Date: {externalLink.date}
                        </Text>
                      )}
                      {(externalLink.startTime || externalLink.endTime) && (
                        <Text style={styles.basicInfo}>
                          Time: {externalLink.startTime || ""} -{" "}
                          {externalLink.endTime || ""}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* URL */}
                  {exportOptions.includeUrl && externalLink.url && (
                    <View>
                      <Text style={styles.heading2}>URL</Text>
                      <Link src={externalLink.url} style={styles.link}>
                        {externalLink.url}
                      </Link>
                    </View>
                  )}

                  {/* Description */}
                  {exportOptions.includeDescription &&
                    externalLink.description && (
                      <View>
                        <Text style={styles.heading2}>Description</Text>
                        {parseHtmlToPdfComponents(externalLink.description)}
                      </View>
                    )}

                  {/* Link Groups */}
                  {exportOptions.includeLinkGroups &&
                    Object.keys(linkGroups || {}).length > 0 && (
                      <View>
                        <Text style={styles.heading2}>Related Links</Text>
                        {Object.entries(linkGroups || {}).map(
                          ([category, items]) => {
                            const categoryOption = linkGroupOptions[category];
                            if (!categoryOption?.selected || items.length === 0)
                              return null;

                            return (
                              <View key={category}>
                                <Text style={styles.linkGroupHeader}>
                                  {category.charAt(0).toUpperCase() +
                                    category.slice(1)}
                                  s
                                </Text>
                                {items.map((item) => {
                                  const itemOption =
                                    categoryOption.items[item.id];
                                  if (!itemOption?.selected) return null;

                                  return (
                                    <View key={item.id}>
                                      <Text style={styles.linkItem}>
                                        • {item.name}
                                      </Text>
                                      {itemOption.includeUrl && item.url && (
                                        <Link
                                          src={item.url}
                                          style={[
                                            styles.linkItem,
                                            styles.link,
                                            { marginLeft: 20 },
                                          ]}
                                        >
                                          {item.url}
                                        </Link>
                                      )}
                                      {itemOption.includeDescription &&
                                        item.description && (
                                          <View style={{ marginLeft: 20 }}>
                                            {parseHtmlToPdfComponents(
                                              item.description
                                            )}
                                          </View>
                                        )}
                                      {itemOption.includeCategory &&
                                        item.category && (
                                          <Text
                                            style={[
                                              styles.linkItem,
                                              {
                                                marginLeft: 20,
                                                fontStyle: "italic",
                                              },
                                            ]}
                                          >
                                            Category: {item.category}
                                          </Text>
                                        )}
                                    </View>
                                  );
                                })}
                              </View>
                            );
                          }
                        )}
                      </View>
                    )}

                  {/* Notations */}
                  {exportOptions.includeNotations &&
                    externalLink.notations?.length > 0 && (
                      <View>
                        <Text style={styles.heading2}>Notes</Text>
                        {externalLink.notations.map((notation, index) => {
                          const notationOption = notationOptions[notation.id];
                          if (!notationOption?.selected) return null;

                          return (
                            <View key={notation.id}>
                              <Text style={styles.notationHeader}>
                                {index + 1}.{" "}
                                {notationOption.includeTitle && notation.title
                                  ? notation.title
                                  : `Note ${index + 1}`}
                                {notationOption.includeHighlighted &&
                                notation.highlighted
                                  ? " ⭐"
                                  : ""}
                              </Text>

                              {/* Metadata */}
                              <View>
                                {notationOption.includeDate &&
                                  notation.date && (
                                    <Text style={styles.metadata}>
                                      Date: {notation.date}
                                    </Text>
                                  )}
                                {notationOption.includeTime &&
                                  (notation.startTime || notation.endTime) && (
                                    <Text style={styles.metadata}>
                                      Time: {notation.startTime || ""} -{" "}
                                      {notation.endTime || ""}
                                    </Text>
                                  )}
                                {notationOption.includeStatus &&
                                  notation.status && (
                                    <Text style={styles.metadata}>
                                      Status: {notation.status}
                                    </Text>
                                  )}
                                {notationOption.includeCategory &&
                                  notation.category && (
                                    <Text style={styles.metadata}>
                                      Category: {notation.category}
                                    </Text>
                                  )}
                                {notationOption.includeVisibility &&
                                  notation.visibility && (
                                    <Text style={styles.metadata}>
                                      Visibility: {notation.visibility}
                                    </Text>
                                  )}
                              </View>

                              {/* Notes content */}
                              {notationOption.includeNotes &&
                                notation.notes && (
                                  <View style={{ marginLeft: 10 }}>
                                    {parseHtmlToPdfComponents(notation.notes)}
                                  </View>
                                )}
                              
                              {/* Submitter info */}
                              {notationOption.includeSubmitterInfo &&
                                notation.submissionMetadata && (
                                  <View style={{ marginTop: 8 }}>
                                    {notation.submissionMetadata.submitterName && (
                                      <Text style={styles.metadata}>
                                        Submitted by: {notation.submissionMetadata.submitterName}
                                      </Text>
                                    )}
                                    {notation.submissionMetadata.submitterEmail && (
                                      <Text style={styles.metadata}>
                                        Email: {notation.submissionMetadata.submitterEmail}
                                      </Text>
                                    )}
                                  </View>
                                )}
                            </View>
                          );
                        })}
                      </View>
                    )}

                  {/* Resources */}
                  {exportOptions.includeResources &&
                    linkedResources?.length > 0 && (
                      <View>
                        <Text style={styles.heading2}>Resources</Text>
                        {linkedResources.map((linkResource, index) => {
                          const resource = linkResource.resource;
                          const resourceOption = resourceOptions[linkResource.id];
                          if (!resourceOption?.selected) return null;

                          return (
                            <View key={linkResource.id}>
                              <Text style={styles.notationHeader}>
                                {index + 1}. {resource.name}
                              </Text>

                              {/* Metadata */}
                              <View>
                                {resourceOption.includeType &&
                                  resource.resourceType && (
                                    <Text style={styles.metadata}>
                                      Type: {resource.resourceType.name}
                                    </Text>
                                  )}
                                {resourceOption.includeMetadata &&
                                  resource.sensitivityLevel && (
                                    <Text style={styles.metadata}>
                                      Sensitivity: {resource.sensitivityLevel.name}
                                    </Text>
                                  )}
                                {resourceOption.includeMetadata &&
                                  resource.expertiseLevel && (
                                    <Text style={styles.metadata}>
                                      Expertise: {resource.expertiseLevel.name}
                                    </Text>
                                  )}
                              </View>

                              {/* Resource content */}
                              {resourceOption.includeDescription &&
                                resource.description && (
                                  <Text style={[styles.text, { marginLeft: 10 }]}>
                                    {resource.description}
                                  </Text>
                                )}

                              {resourceOption.includeUrl && resource.url && (
                                <Link
                                  src={resource.url}
                                  style={[styles.link, { marginLeft: 10 }]}
                                >
                                  {resource.url}
                                </Link>
                              )}

                              {resourceOption.includeNotes &&
                                linkResource.notes && (
                                  <Text
                                    style={[
                                      styles.text,
                                      { marginLeft: 10, fontStyle: "italic" },
                                    ]}
                                  >
                                    Note: {linkResource.notes}
                                  </Text>
                                )}
                            </View>
                          );
                        })}
                      </View>
                    )}

                  {/* Attachments */}
                  {exportOptions.includeAttachments &&
                    externalLink.attachments?.length > 0 && (
                      <View>
                        <Text style={styles.heading2}>
                          Attachments ({externalLink.attachments.length})
                        </Text>
                        {externalLink.attachments.map((attachment, index) => (
                          <View key={index}>
                            <Text style={styles.text}>
                              {index + 1}.{" "}
                              {attachment.title ||
                                attachment.name ||
                                "Untitled"}
                            </Text>
                            {attachment.description && (
                              <Text
                                style={[
                                  styles.text,
                                  { marginLeft: 15, fontSize: 10 },
                                ]}
                              >
                                {attachment.description}
                              </Text>
                            )}
                            {attachment.type && (
                              <Text
                                style={[styles.metadata, { marginLeft: 15 }]}
                              >
                                Type: {attachment.type}
                              </Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
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
              link.download = `${externalLink.name
                .replace(/\s+/g, "-")
                .toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`;
              link.click();

              // Clean up
              URL.revokeObjectURL(url);
              toast.dismiss(loadingToast);
              toast.success("PDF exported successfully!");
            })
            .catch((error) => {
              console.error("PDF generation error:", error);
              toast.dismiss(loadingToast);
              toast.error("Failed to generate PDF. Please try again.");
            });
        }
      );
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to export PDF");
    }
  };

  const handleExportEmailList = () => {
    try {
      // Create CSV content for email list
      let csvContent = "Name,Email,Submission Title,Submission Date\n";
      
      const escapeCSV = (str) => `"${(str || "").replace(/"/g, '""')}"`;
      
      // Collect all submissions with email info
      const emailEntries = [];
      
      if (externalLink.notations) {
        externalLink.notations.forEach((notation) => {
          if (notation.submissionMetadata?.submitterEmail || notation.submissionMetadata?.submitterName) {
            // Format date properly
            let dateStr = "N/A";
            if (notation.createdAt) {
              const date = typeof notation.createdAt === 'string' ? notation.createdAt : 
                           notation.createdAt instanceof Date ? notation.createdAt.toISOString() :
                           typeof notation.createdAt === 'object' ? new Date().toISOString() : "N/A";
              dateStr = date.split('T')[0]; // Get just the date part
            } else if (notation.updatedAt) {
              const date = typeof notation.updatedAt === 'string' ? notation.updatedAt :
                           notation.updatedAt instanceof Date ? notation.updatedAt.toISOString() :
                           typeof notation.updatedAt === 'object' ? new Date().toISOString() : "N/A";
              dateStr = date.split('T')[0]; // Get just the date part
            }
            
            emailEntries.push({
              name: notation.submissionMetadata.submitterName || "Anonymous",
              email: notation.submissionMetadata.submitterEmail || "No email provided",
              title: notation.title || "Untitled",
              date: dateStr
            });
          }
        });
      }
      
      // Remove duplicates based on email
      const uniqueEmails = new Map();
      emailEntries.forEach(entry => {
        if (entry.email && entry.email !== "No email provided") {
          if (!uniqueEmails.has(entry.email) || !uniqueEmails.get(entry.email).name) {
            uniqueEmails.set(entry.email, entry);
          }
        }
      });
      
      // Add to CSV
      uniqueEmails.forEach(entry => {
        csvContent += `${escapeCSV(entry.name)},${escapeCSV(entry.email)},${escapeCSV(entry.title)},${escapeCSV(entry.date)}\n`;
      });
      
      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${externalLink.name
        .replace(/\s+/g, "-")
        .toLowerCase()}-email-list-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      
      // Clean up
      URL.revokeObjectURL(url);
      
      toast.success(`Exported ${uniqueEmails.size} unique email entries`);
    } catch (error) {
      console.error("Email list export error:", error);
      toast.error("Failed to export email list");
    }
  };

  const handleDownloadCSV = () => {
    try {
      // Create CSV content with comprehensive headers
      let csvContent =
        "Type,Name,URL,Description,Status,Visibility,Date,Start Time,End Time,Timezone,";
      csvContent +=
        "Link Group Category,Link Group Name,Link Group URL,Link Group Description,";
      csvContent +=
        "Notation Title,Notation Date,Notation Start Time,Notation End Time,Notation Status,Notation Category,Notation Visibility,Notation Highlighted,Notation Content,Submitter Name,Submitter Email,";
      csvContent +=
        "Resource Name,Resource URL,Resource Description,Resource Type,Resource Sensitivity,Resource Expertise,Resource Notes,";
      csvContent += "Attachment Name,Attachment Description,Attachment Type\n";

      const escapeCSV = (str) => `"${(str || "").replace(/"/g, '""')}"`;

      // Basic external link info
      const basicInfo = {
        type: escapeCSV(externalLink.type?.replace("_", " ") || ""),
        name: escapeCSV(externalLink.name || ""),
        url: exportOptions.includeUrl
          ? escapeCSV(externalLink.url || "")
          : '""',
        description: exportOptions.includeDescription
          ? escapeCSV(stripHtml(externalLink.description || ""))
          : '""',
        status: escapeCSV(externalLink.status || ""),
        visibility: escapeCSV(externalLink.visibility || ""),
        date: escapeCSV(externalLink.date || ""),
        startTime: escapeCSV(externalLink.startTime || ""),
        endTime: escapeCSV(externalLink.endTime || ""),
        timezone: escapeCSV(externalLink.timezone || ""),
      };

      // If no link groups, notations, or attachments, just add the basic row
      let hasData = false;

      // Link Groups
      if (
        exportOptions.includeLinkGroups &&
        Object.keys(linkGroups || {}).length > 0
      ) {
        Object.entries(linkGroups || {}).forEach(([category, items]) => {
          const categoryOption = linkGroupOptions[category];
          if (categoryOption?.selected) {
            items.forEach((item) => {
              const itemOption = categoryOption.items[item.id];
              if (itemOption?.selected) {
                hasData = true;
                csvContent += `${Object.values(basicInfo).join(",")},`;
                csvContent += `${escapeCSV(category)},${escapeCSV(item.name)},`;
                csvContent += `${
                  itemOption.includeUrl ? escapeCSV(item.url || "") : '""'
                },`;
                csvContent += `${
                  itemOption.includeDescription
                    ? escapeCSV(stripHtml(item.description || ""))
                    : '""'
                },`;
                csvContent += `"","","","","","","","","","","",`; // Empty notation fields (including submitter info)
                csvContent += `"","","","","","","",`; // Empty resource fields
                csvContent += `"","",""\n`; // Empty attachment fields
              }
            });
          }
        });
      }

      // Notations
      if (
        exportOptions.includeNotations &&
        externalLink.notations?.length > 0
      ) {
        externalLink.notations.forEach((notation) => {
          const notationOption = notationOptions[notation.id];
          if (notationOption?.selected) {
            hasData = true;
            csvContent += `${Object.values(basicInfo).join(",")},`;
            csvContent += `"","","","",`; // Empty link group fields
            csvContent += `${
              notationOption.includeTitle
                ? escapeCSV(notation.title || "")
                : '""'
            },`;
            csvContent += `${
              notationOption.includeDate ? escapeCSV(notation.date || "") : '""'
            },`;
            csvContent += `${
              notationOption.includeTime
                ? escapeCSV(notation.startTime || "")
                : '""'
            },`;
            csvContent += `${
              notationOption.includeTime
                ? escapeCSV(notation.endTime || "")
                : '""'
            },`;
            csvContent += `${
              notationOption.includeStatus
                ? escapeCSV(notation.status || "")
                : '""'
            },`;
            csvContent += `${
              notationOption.includeCategory
                ? escapeCSV(notation.category || "")
                : '""'
            },`;
            csvContent += `${
              notationOption.includeVisibility
                ? escapeCSV(notation.visibility || "")
                : '""'
            },`;
            csvContent += `${
              notationOption.includeHighlighted
                ? escapeCSV(notation.highlighted ? "Yes" : "No")
                : '""'
            },`;
            csvContent += `${
              notationOption.includeNotes
                ? escapeCSV(stripHtml(notation.notes || ""))
                : '""'
            },`;
            // Add submitter info
            csvContent += `${
              notationOption.includeSubmitterInfo && notation.submissionMetadata?.submitterName
                ? escapeCSV(notation.submissionMetadata.submitterName)
                : '""'
            },`;
            csvContent += `${
              notationOption.includeSubmitterInfo && notation.submissionMetadata?.submitterEmail
                ? escapeCSV(notation.submissionMetadata.submitterEmail)
                : '""'
            },`;
            csvContent += `"","","","","","","",`; // Empty resource fields
            csvContent += `"","",""\n`; // Empty attachment fields
          }
        });
      }

      // Resources
      if (
        exportOptions.includeResources &&
        linkedResources?.length > 0
      ) {
        linkedResources.forEach((linkResource) => {
          const resource = linkResource.resource;
          const resourceOption = resourceOptions[linkResource.id];
          if (resourceOption?.selected) {
            hasData = true;
            csvContent += `${Object.values(basicInfo).join(",")},`;
            csvContent += `"","","","",`; // Empty link group fields
            csvContent += `"","","","","","","","","","","",`; // Empty notation fields (including submitter info)
            csvContent += `${escapeCSV(resource.name || "")},`;
            csvContent += `${
              resourceOption.includeUrl ? escapeCSV(resource.url || "") : '""'
            },`;
            csvContent += `${
              resourceOption.includeDescription
                ? escapeCSV(resource.description || "")
                : '""'
            },`;
            csvContent += `${
              resourceOption.includeType && resource.resourceType
                ? escapeCSV(resource.resourceType.name || "")
                : '""'
            },`;
            csvContent += `${
              resourceOption.includeMetadata && resource.sensitivityLevel
                ? escapeCSV(resource.sensitivityLevel.name || "")
                : '""'
            },`;
            csvContent += `${
              resourceOption.includeMetadata && resource.expertiseLevel
                ? escapeCSV(resource.expertiseLevel.name || "")
                : '""'
            },`;
            csvContent += `${
              resourceOption.includeNotes
                ? escapeCSV(linkResource.notes || "")
                : '""'
            },`;
            csvContent += `"","",""\n`; // Empty attachment fields
          }
        });
      }

      // Attachments
      if (
        exportOptions.includeAttachments &&
        externalLink.attachments?.length > 0
      ) {
        externalLink.attachments.forEach((attachment) => {
          hasData = true;
          csvContent += `${Object.values(basicInfo).join(",")},`;
          csvContent += `"","","","",`; // Empty link group fields
          csvContent += `"","","","","","","","","",`; // Empty notation fields
          csvContent += `"","","","","","","",`; // Empty resource fields
          csvContent += `${escapeCSV(
            attachment.title || attachment.name || ""
          )},`;
          csvContent += `${escapeCSV(attachment.description || "")},`;
          csvContent += `${escapeCSV(attachment.type || "")}\n`;
        });
      }

      // If no additional data, add basic info row
      if (!hasData) {
        csvContent += `${Object.values(basicInfo).join(",")},`;
        csvContent += `"","","","",`; // Empty link group fields
        csvContent += `"","","","","","","","","",`; // Empty notation fields
        csvContent += `"","","","","","","",`; // Empty resource fields
        csvContent += `"","",""\n`; // Empty attachment fields
      }

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${externalLink.name
        .replace(/\s+/g, "-")
        .toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("CSV generation error:", error);
    }
  };

  const handleBulkDownloadAttachments = async () => {
    if (!externalLink.attachments?.length) {
      toast.error("No attachments to download");
      return;
    }

    try {
      // Import JSZip dynamically
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      const loadingToast = toast.loading("Preparing attachments for download...");

      let downloadCount = 0;
      const totalAttachments = externalLink.attachments.length;

      // Process each attachment
      for (const attachment of externalLink.attachments) {
        try {
          if (attachment.presignedUrl) {
            // Fetch the file
            const response = await fetch(attachment.presignedUrl);
            if (response.ok) {
              const blob = await response.blob();

              // Generate a safe filename
              const fileName =
                attachment.title ||
                attachment.name ||
                `attachment-${attachment.id}`;
              const fileExtension =
                attachment.type === "image"
                  ? ".jpg"
                  : attachment.type === "video"
                  ? ".mp4"
                  : attachment.presignedUrl.split(".").pop()?.split("?")[0] ||
                    "";

              const safeFileName = `${fileName.replace(
                /[^a-zA-Z0-9.-]/g,
                "_"
              )}${fileExtension ? "." + fileExtension : ""}`;

              // Add to zip
              zip.file(safeFileName, blob);
              downloadCount++;
            }
          }
        } catch (error) {
          console.error(
            `Failed to download attachment ${attachment.id}:`,
            error
          );
        }
      }

      if (downloadCount === 0) {
        toast.dismiss(loadingToast);
        toast.error("No attachments could be downloaded");
        return;
      }

      // Generate ZIP file
      toast.loading("Creating ZIP file...", { id: loadingToast });
      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Download the ZIP file
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${externalLink.name
        .replace(/\s+/g, "-")
        .toLowerCase()}-attachments-${new Date()
        .toISOString()
        .slice(0, 10)}.zip`;
      link.click();

      // Clean up
      URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success(
        `Downloaded ${downloadCount} of ${totalAttachments} attachments`
      );
    } catch (error) {
      console.error("Bulk download error:", error);
      if (typeof loadingToast !== 'undefined') {
        toast.dismiss(loadingToast);
      }
      toast.error("Failed to create attachment archive. Please try again.");
    }
  };

  // Helper functions for filtering content
  const filterLinkGroups = (linkGroups, searchQuery) => {
    if (!searchQuery.trim()) return linkGroups;

    const filtered = {};
    Object.entries(linkGroups || {}).forEach(([category, items]) => {
      const filteredItems = items.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredItems.length > 0) {
        filtered[category] = filteredItems;
      }
    });
    return filtered;
  };

  const filterNotations = (notations, searchQuery, statusFilter) => {
    if (!notations) return [];

    let filtered = notations;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (notation) =>
          notation.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          notation.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          notation.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (notation) =>
          notation.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    return filtered;
  };

  const getUniqueStatuses = (notations) => {
    if (!notations) return [];
    const statuses = [
      ...new Set(notations.map((n) => n.status).filter(Boolean)),
    ];
    return statuses.sort();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/30 via-black/50 to-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200/80 bg-gradient-to-r from-gray-50/80 to-white/80">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Export: {externalLink.name}
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

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "selection" && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Content Selection
                </h3>

                {/* Master Search */}
                <div className="flex items-center gap-4">
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
              </div>

              {/* Basic Export Options */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">
                  Basic Information
                </h4>
                <div className="space-y-2">
                  {[
                    {
                      key: "includeBasicInfo",
                      label: "Basic Info (Type, Status, Date, etc.)",
                    },
                    { key: "includeUrl", label: "URL" },
                    { key: "includeDescription", label: "Description" },
                    { key: "includeLinkGroups", label: "Related Links" },
                    { key: "includeNotations", label: "Notes" },
                    { key: "includeResources", label: "Resources" },
                    {
                      key: "includeAttachments",
                      label: "Attachment References",
                    },
                    {
                      key: "includeSubmitterInfo",
                      label: "Include Submitter Info (Name & Email for Public Submissions)",
                    },
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

              {/* Link Groups Selection */}
              {exportOptions.includeLinkGroups &&
                Object.keys(linkGroups || {}).length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">
                        Related Links
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectAllLinkGroups(true)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => handleSelectAllLinkGroups(false)}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    {/* Link Groups Search */}
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search related links..."
                          value={linkGroupSearch}
                          onChange={(e) => setLinkGroupSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-4 w-4 text-gray-400"
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

                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {Object.entries(
                        filterLinkGroups(
                          linkGroups,
                          searchQuery || linkGroupSearch
                        ) || {}
                      ).map(([category, items]) => {
                        const categoryOption = linkGroupOptions[category];
                        return (
                          <div
                            key={category}
                            className="border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex items-center mb-2">
                              <input
                                type="checkbox"
                                id={`category-${category}`}
                                checked={categoryOption?.selected || false}
                                onChange={() =>
                                  handleLinkGroupCategoryToggle(category)
                                }
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`category-${category}`}
                                className="ml-2 font-medium text-gray-900"
                              >
                                {category.charAt(0).toUpperCase() +
                                  category.slice(1)}
                                s ({items.length})
                              </label>
                            </div>

                            {categoryOption?.selected && (
                              <div className="ml-6 space-y-2">
                                {items.map((item) => {
                                  const itemOption =
                                    categoryOption.items[item.id];
                                  return (
                                    <div
                                      key={item.id}
                                      className="border-l-2 border-gray-200 pl-3"
                                    >
                                      <div className="flex items-center mb-1">
                                        <input
                                          type="checkbox"
                                          id={`item-${item.id}`}
                                          checked={
                                            itemOption?.selected || false
                                          }
                                          onChange={() =>
                                            handleLinkGroupItemToggle(
                                              category,
                                              item.id
                                            )
                                          }
                                          className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <label
                                          htmlFor={`item-${item.id}`}
                                          className="ml-2 text-sm font-medium text-gray-800"
                                        >
                                          {item.name}
                                        </label>
                                      </div>

                                      {itemOption?.selected && (
                                        <div className="ml-5 space-y-1">
                                          {[
                                            {
                                              key: "includeUrl",
                                              label: "URL",
                                            },
                                            {
                                              key: "includeDescription",
                                              label: "Description",
                                            },
                                            {
                                              key: "includeCategory",
                                              label: "Category",
                                            },
                                          ].map(({ key, label }) => (
                                            <div
                                              key={key}
                                              className="flex items-center"
                                            >
                                              <input
                                                type="checkbox"
                                                id={`${item.id}-${key}`}
                                                checked={
                                                  itemOption?.[key] || false
                                                }
                                                onChange={() =>
                                                  handleLinkGroupItemOptionToggle(
                                                    category,
                                                    item.id,
                                                    key
                                                  )
                                                }
                                                className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                              />
                                              <label
                                                htmlFor={`${item.id}-${key}`}
                                                className="ml-2 text-xs text-gray-600"
                                              >
                                                Include {label}
                                              </label>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Notations Selection */}
              {exportOptions.includeNotations &&
                externalLink.notations?.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">
                        Notes ({externalLink.notations.length})
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectAllNotations(true)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => handleSelectAllNotations(false)}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    {/* Notations Search and Filter */}
                    <div className="mb-4 space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search notes..."
                          value={notationSearch}
                          onChange={(e) => setNotationSearch(e.target.value)}
                          className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg
                            className="h-4 w-4 text-gray-400"
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

                      {/* Status Filter */}
                      {getUniqueStatuses(externalLink.notations).length > 0 && (
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium text-gray-700">
                            Filter by Status:
                          </label>
                          <select
                            value={notationStatusFilter}
                            onChange={(e) =>
                              setNotationStatusFilter(e.target.value)
                            }
                            className="px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          >
                            <option value="all">All Statuses</option>
                            {getUniqueStatuses(externalLink.notations).map(
                              (status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {filterNotations(
                        externalLink.notations,
                        searchQuery || notationSearch,
                        notationStatusFilter
                      ).map((notation) => {
                        const notationOption = notationOptions[notation.id];
                        return (
                          <div
                            key={notation.id}
                            className="border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex items-center mb-2">
                              <input
                                type="checkbox"
                                id={`notation-${notation.id}`}
                                checked={notationOption?.selected || false}
                                onChange={() =>
                                  handleNotationToggle(notation.id)
                                }
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`notation-${notation.id}`}
                                className="ml-2 font-medium text-gray-900 flex items-center gap-2"
                              >
                                {notation.title || "Untitled Note"}
                                {notation.highlighted && (
                                  <span className="text-yellow-500">⭐</span>
                                )}
                                {notation.status && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    {notation.status}
                                  </span>
                                )}
                              </label>
                            </div>

                            {notationOption?.selected && (
                              <div className="ml-6 grid grid-cols-2 gap-2">
                                {[
                                  { key: "includeTitle", label: "Title" },
                                  { key: "includeNotes", label: "Content" },
                                  { key: "includeDate", label: "Date" },
                                  { key: "includeTime", label: "Time" },
                                  { key: "includeStatus", label: "Status" },
                                  { key: "includeCategory", label: "Category" },
                                  {
                                    key: "includeVisibility",
                                    label: "Visibility",
                                  },
                                  {
                                    key: "includeHighlighted",
                                    label: "Highlighted",
                                  },
                                  {
                                    key: "includeSubmitterInfo",
                                    label: "Submitter Info",
                                  },
                                ].map(({ key, label }) => (
                                  <div key={key} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`${notation.id}-${key}`}
                                      checked={notationOption?.[key] || false}
                                      onChange={() =>
                                        handleNotationOptionToggle(
                                          notation.id,
                                          key
                                        )
                                      }
                                      className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <label
                                      htmlFor={`${notation.id}-${key}`}
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

              {/* Resources Selection */}
              {exportOptions.includeResources &&
                linkedResources?.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium text-gray-900">
                        Resources ({linkedResources.length})
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSelectAllResources(true)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => handleSelectAllResources(false)}
                          className="text-sm text-gray-600 hover:text-gray-800"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {linkedResources.map((linkResource) => {
                        const resource = linkResource.resource;
                        const resourceOption = resourceOptions[linkResource.id];
                        return (
                          <div
                            key={linkResource.id}
                            className="border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex items-center mb-2">
                              <input
                                type="checkbox"
                                id={`resource-${linkResource.id}`}
                                checked={resourceOption?.selected || false}
                                onChange={() =>
                                  handleResourceToggle(linkResource.id)
                                }
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <label
                                htmlFor={`resource-${linkResource.id}`}
                                className="ml-2 font-medium text-gray-900 flex items-center gap-2"
                              >
                                {resource.name}
                                {resource.resourceType && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    {resource.resourceType.name}
                                  </span>
                                )}
                              </label>
                            </div>

                            {resourceOption?.selected && (
                              <div className="ml-6 grid grid-cols-2 gap-2">
                                {[
                                  { key: "includeUrl", label: "URL" },
                                  { key: "includeDescription", label: "Description" },
                                  { key: "includeType", label: "Type" },
                                  { key: "includeMetadata", label: "Metadata" },
                                  { key: "includeNotes", label: "Link Notes" },
                                ].map(({ key, label }) => (
                                  <div key={key} className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`${linkResource.id}-${key}`}
                                      checked={resourceOption?.[key] || false}
                                      onChange={() =>
                                        handleResourceOptionToggle(
                                          linkResource.id,
                                          key
                                        )
                                      }
                                      className="h-3 w-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    />
                                    <label
                                      htmlFor={`${linkResource.id}-${key}`}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <FaEnvelope className="text-purple-600 mr-2" />
                    Email List
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Export submitter emails from public submissions.
                  </p>
                  <button
                    onClick={handleExportEmailList}
                    className="px-4 py-2 bg-purple-50 text-purple-700 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                  >
                    <FaDownload className="h-4 w-4" />
                    Export Emails
                  </button>
                </div>
              </div>

              {/* Attachments Section */}
              {externalLink.attachments?.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-medium mb-2 flex items-center">
                    <FaPaperclip className="text-blue-600 mr-2" />
                    Attachments ({externalLink.attachments.length})
                  </h3>
                  <p className="text-gray-600 mb-4">
                    View and download all attachments associated with this
                    resource.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAttachmentBrowser(true)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 border-2 border-blue-200 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-2"
                    >
                      <FaPaperclip className="h-4 w-4" />
                      Browse Attachments
                    </button>
                    <button
                      onClick={handleBulkDownloadAttachments}
                      className="px-4 py-2 bg-purple-100 text-purple-700 border-2 border-purple-200 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-2"
                    >
                      <FaFileArchive className="h-4 w-4" />
                      Download All (ZIP)
                    </button>
                  </div>
                </div>
              )}
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
              attachments={externalLink.attachments || []}
              onClose={() => setShowAttachmentBrowser(false)}
              title={`Attachments - ${externalLink.name}`}
              isAdmin={isAdmin}
              isCollaborator={isCollaborator}
              userRole={userRole}
              systemUserId={systemUserId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportExternalLinkModal;
