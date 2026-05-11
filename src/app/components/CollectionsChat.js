"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import {
  FaUser,
  FaPlus,
  FaCalendar,
  FaBook,
  FaFolder,
  FaGlobeAmericas,
  FaVideo,
  FaClipboard,
  FaKeyboard,
  FaLink,
  FaPaperclip,
  FaFileAlt,
  FaTimes,
  FaComments,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
  FaMagic,
} from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useContextAuth } from "../context/authContext";
import { useContentSearch, useAIChat } from "../hooks/useAI";
import { getUserInfoString, estimateTokenCount } from "../utils/jsonExtractors";
import MessageContent from "./MessageContent";
import ReferencedItems from "./ReferencedItems";
import { usePinItems } from "../hooks/usePinned";
import InsufficientCreditsModal from "./InsufficientCreditsModal";
import { FaWandMagicSparkles, FaWandSparkles } from "react-icons/fa6";

const CollectionsChat = ({
  filteredCollections = [],
  collections = [],
  externalLinks = [],
  resources = [],
  searchTerm = "",
  isOpen,
  onToggle,
  isAdmin = false,
  userRole = "",
  systemUserId = "",
  pinnedItems = [],
}) => {
  const { customUserData } = useContextAuth();
  const aiChat = useAIChat();
  const contentSearchMutation = useContentSearch();
  const pinItemsMutation = usePinItems();

  // Search filters for external links and resources
  const [searchFilters, setSearchFilters] = useState({
    externalLinks: "",
    resources: "",
  });

  // Extract external links and resources from filtered collections
  const collectionExternalLinks = useMemo(() => {
    const links = [];
    filteredCollections.forEach((collection) => {
      if (collection.externalLinks && Array.isArray(collection.externalLinks)) {
        collection.externalLinks.forEach((link) => {
          links.push({
            ...link,
            collectionId: collection.id,
            collectionName: collection.name,
          });
        });
      }
    });
    return links;
  }, [filteredCollections]);

  const collectionResources = useMemo(() => {
    const resourcesList = [];
    filteredCollections.forEach((collection) => {
      if (collection.resources && Array.isArray(collection.resources)) {
        collection.resources.forEach((resource) => {
          resourcesList.push({
            ...resource,
            collectionId: collection.id,
            collectionName: collection.name,
          });
        });
      }
    });
    return resourcesList;
  }, [filteredCollections]);

  // Filtered external links and resources based on search
  const filteredExternalLinks = useMemo(() => {
    if (!searchFilters.externalLinks) return collectionExternalLinks;
    return collectionExternalLinks.filter(
      (link) =>
        link.name
          ?.toLowerCase()
          .includes(searchFilters.externalLinks.toLowerCase()) ||
        link.description
          ?.toLowerCase()
          .includes(searchFilters.externalLinks.toLowerCase()) ||
        link.collectionName
          ?.toLowerCase()
          .includes(searchFilters.externalLinks.toLowerCase())
    );
  }, [collectionExternalLinks, searchFilters.externalLinks]);

  const filteredResources = useMemo(() => {
    if (!searchFilters.resources) return collectionResources;
    return collectionResources.filter(
      (resource) =>
        resource.name
          ?.toLowerCase()
          .includes(searchFilters.resources.toLowerCase()) ||
        resource.description
          ?.toLowerCase()
          .includes(searchFilters.resources.toLowerCase()) ||
        resource.collectionName
          ?.toLowerCase()
          .includes(searchFilters.resources.toLowerCase())
    );
  }, [collectionResources, searchFilters.resources]);

  // Chat state
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [includeUserInfo, setIncludeUserInfo] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
    useState(false);
  const [typingAnimationEnabled, setTypingAnimationEnabled] = useState(true);
  const [chatData, setChatData] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(0);

  // Resource selection state - specific to collections page
  const [selectedResources, setSelectedResources] = useState({
    filteredCollections: true, // Use filtered collections by default
    externalLinks: {},
    resources: {},
  });

  // Collapsible sections state
  const [collapsedSections, setCollapsedSections] = useState({
    externalLinks: false,
    resources: false,
  });

  // @ Mention functionality state
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [mentionSearchResults, setMentionSearchResults] = useState([]);
  const [mentionedItems, setMentionedItems] = useState([]);

  const textareaRef = useRef(null);
  const chatEndRef = useRef(null);

  // Get token count estimate for selected resources
  const getTokenEstimate = useMemo(() => {
    let estimate = 0;

    if (selectedResources.filteredCollections) {
      estimate += estimateTokenCount(JSON.stringify(filteredCollections));
    }

    // Count selected external links from collections
    const selectedExternalLinks = collectionExternalLinks.filter(
      (link) => selectedResources.externalLinks[link.id]
    );
    if (selectedExternalLinks.length > 0) {
      estimate += estimateTokenCount(JSON.stringify(selectedExternalLinks));
    }

    // Count selected resources from collections
    const selectedResourcesCount = collectionResources.filter(
      (resource) => selectedResources.resources[resource.id]
    );
    if (selectedResourcesCount.length > 0) {
      estimate += estimateTokenCount(JSON.stringify(selectedResourcesCount));
    }

    // Add mentioned items
    estimate += estimateTokenCount(JSON.stringify(mentionedItems));

    return estimate;
  }, [
    selectedResources,
    filteredCollections,
    collectionExternalLinks,
    collectionResources,
    mentionedItems,
  ]);

  // Reset typing animation for existing messages when chat opens
  useEffect(() => {
    if (isOpen && history.length > 0) {
      setHistory((prev) =>
        prev.map((message) => ({
          ...message,
          enableTypingAnimation: false,
        }))
      );
    }
  }, [isOpen]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  // Check for insufficient credits message
  useEffect(() => {
    if (history && history.length > 0) {
      const lastMessage = history[history.length - 1];
      if (
        !lastMessage.isUser &&
        ((typeof lastMessage.answer === "string" &&
          lastMessage.answer.trim() ===
            "Insufficient credits, please purchase more to continue using AI chat.") ||
          (typeof lastMessage.message === "string" &&
            lastMessage.message.trim() ===
              "Insufficient credits, please purchase more to continue using AI chat."))
      ) {
        setShowInsufficientCreditsModal(true);
      }
    }
  }, [history]);

  // Debounced search for mention dropdown
  useEffect(() => {
    if (mentionQuery && mentionQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        contentSearchMutation.mutate(
          { searchQuery: mentionQuery },
          {
            onSuccess: (data) => {
              const searchResults = data?.content || [];
              const formattedResults = searchResults.map((item) => {
                let icon, iconColor;
                switch (item.type) {
                  case "collection":
                    icon = FaFolder;
                    iconColor = "text-blue-600";
                    break;
                  case "resource":
                    icon = FaBook;
                    iconColor = "text-green-600";
                    break;
                  case "event":
                    icon = FaCalendar;
                    iconColor = "text-purple-600";
                    break;
                  case "external_link":
                    icon = FaLink;
                    iconColor = "text-indigo-600";
                    break;
                  case "video":
                    icon = FaVideo;
                    iconColor = "text-red-600";
                    break;
                  case "notation":
                    icon = FaClipboard;
                    iconColor = "text-yellow-600";
                    break;
                  case "organization":
                    icon = FaGlobeAmericas;
                    iconColor = "text-teal-600";
                    break;
                  default:
                    icon = FaFileAlt;
                    iconColor = "text-gray-600";
                }

                return {
                  ...item,
                  icon,
                  iconColor,
                };
              });

              setMentionSearchResults(formattedResults);
            },
            onError: (error) => {
              console.error("Failed to search for mentions:", error);
              setMentionSearchResults([]);
            },
          }
        );
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setMentionSearchResults([]);
    }
  }, [mentionQuery]);

  // Handle textarea changes and @ mentions
  const handleTextareaChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;

    setQuery(value);
    setCursorPosition(cursorPos);

    // Check for @ mentions
    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(atIndex + 1);

      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionQuery(textAfterAt);
        setShowMentionDropdown(true);
        setSelectedMentionIndex(0);

        const textarea = e.target;
        const rect = textarea.getBoundingClientRect();

        setMentionPosition({
          top: rect.bottom + window.scrollY + 5,
          left: rect.left + window.scrollX + 10,
        });
      } else {
        setShowMentionDropdown(false);
        setMentionQuery("");
      }
    } else {
      setShowMentionDropdown(false);
      setMentionQuery("");
    }
  };

  // Get filtered mention items
  const getFilteredMentionItems = () => {
    return mentionSearchResults;
  };

  // Handle mention selection
  const handleMentionSelect = (item) => {
    const textBeforeCursor = query.substring(0, cursorPosition);
    const textAfterCursor = query.substring(cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex !== -1) {
      const beforeAt = textBeforeCursor.substring(0, atIndex);
      const mentionText = `@${item.title || item.name}`;
      const newQuery = beforeAt + mentionText + " " + textAfterCursor;

      setQuery(newQuery);

      // Add to mentioned items - make sure we don't add duplicates
      setMentionedItems((prev) => {
        const exists = prev.find((existing) => existing.id === item.id);
        if (!exists) {
          return [...prev, item];
        }
        return prev;
      });

      setShowMentionDropdown(false);
      setMentionQuery("");

      // Focus back to textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = beforeAt.length + mentionText.length + 1;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
  };

  // Handle mention keyboard navigation
  const handleMentionKeyDown = (e) => {
    if (!showMentionDropdown) return;

    const filteredItems = getFilteredMentionItems();
    if (filteredItems.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedMentionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        handleMentionSelect(filteredItems[selectedMentionIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setShowMentionDropdown(false);
        setMentionQuery("");
        break;
    }
  };

  // Function to remove a mentioned item
  const removeMentionedItem = (itemToRemove) => {
    setMentionedItems((prev) =>
      prev.filter((item) => item.id !== itemToRemove.id)
    );

    const mentionText = `@${itemToRemove.title || itemToRemove.name}`;
    const updatedQuery = query.replace(mentionText, "").trim();
    setQuery(updatedQuery);

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Build context from selected resources
  const buildChatContext = () => {
    const context = [];

    if (selectedResources.filteredCollections) {
      filteredCollections.forEach((collection) => {
        context.push({
          type: "collection",
          id: collection.id,
          title: collection.name,
          name: collection.name,
          description: collection.description,
          notes: collection.notes,
          status: collection.status,
          visibility: collection.visibility,
          created_at: collection.created_at,
          updated_at: collection.updated_at,
          eventId: collection.eventId,
          // Include external links if they exist
          externalLinks: collection.externalLinks || [],
        });
      });
    }

    // Include selected external links from collections
    collectionExternalLinks.forEach((link) => {
      if (selectedResources.externalLinks[link.id]) {
        context.push({
          type: "external_link",
          id: link.id,
          title: link.name,
          name: link.name,
          url: link.url,
          description: link.description,
          type_category: link.type,
          status: link.status,
          visibility: link.visibility,
          created_at: link.created_at,
          updated_at: link.updated_at,
          collectionId: link.collectionId,
          collectionName: link.collectionName,
        });
      }
    });

    // Include selected resources from collections
    collectionResources.forEach((resource) => {
      if (selectedResources.resources[resource.id]) {
        context.push({
          type: "resource",
          id: resource.id,
          title: resource.name,
          name: resource.name,
          description: resource.description,
          notes: resource.notes,
          status: resource.status,
          visibility: resource.visibility,
          created_at: resource.created_at,
          updated_at: resource.updated_at,
          collectionId: resource.collectionId,
          collectionName: resource.collectionName,
        });
      }
    });

    return context;
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!query.trim() || isLoading) return;

    // Clean query text by removing @ mentions
    const cleanQueryText = (text) => {
      return text
        .replace(/@[^@\s]+(?:\s+[^@\s]+)*?(?=\s|$|@)/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    const cleanQuery = cleanQueryText(query);
    const usesMentions = mentionedItems.length > 0;

    // Build selected resources context
    const selectedResourcesContext = buildChatContext();

    // Combine selected resources and mentioned items
    const allItemsToSend = [...selectedResourcesContext, ...mentionedItems];

    // Add user message to history
    const userMessage = {
      id: Date.now().toString(),
      prompt: query,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setHistory((prev) => [...prev, userMessage]);
    setQuery("");
    setMentionedItems([]);
    setIsLoading(true);

    try {
      const userInfo = getUserInfoString(customUserData, includeUserInfo);
      const fullPrompt = `${
        userInfo ? userInfo + " " : ""
      }Question: ${cleanQuery}`;

      // Add context about current search if available
      const contextNote = searchTerm
        ? `Note: User is currently searching for "${searchTerm}" and seeing ${filteredCollections.length} filtered results.`
        : `Note: User is viewing ${filteredCollections.length} collections.`;

      const payload = {
        prompt: fullPrompt + " " + contextNote,
        history,
        data: {
          collections: [],
          externalLinks: [],
          resources: [],
          events: [],
          organizations: [],
          videos: [],
          notations: [],
          attachments: [],
          mentionedItems:
            allItemsToSend.length > 0 ? allItemsToSend : undefined,
        },
        disableRAG: allItemsToSend.length > 0,
      };

      const response = await aiChat.mutateAsync(payload);

      // Check for insufficient credits
      const answerText =
        response?.content?.answer ||
        response?.answer ||
        response?.message ||
        "";

      if (
        typeof answerText === "string" &&
        answerText.toLowerCase().includes("insufficient credits")
      ) {
        setShowInsufficientCreditsModal(true);
      }

      // Capture chat data for ReferencedItems
      if (response?.content) {
        setChatData(response.content);
      }

      // Add AI response to history
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        isUser: false,
        answer: answerText,
        timestamp: Date.now(),
        enableTypingAnimation: typingAnimationEnabled,
        referencedItems: response?.content ? true : false,
      };

      setHistory((prev) => [...prev, aiMessage]);

      if (usesMentions) {
        setMentionSearchResults([]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to send message");

      const errorMessage = {
        id: (Date.now() + 2).toString(),
        isUser: false,
        answer: "Sorry, I encountered an error. Please try again.",
        timestamp: Date.now(),
      };

      setHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resource selection toggles
  const handleResourceToggle = (type, id = null) => {
    setSelectedResources((prev) => {
      const newState = { ...prev };

      if (id) {
        // Toggle individual item
        newState[type] = {
          ...prev[type],
          [id]: !prev[type][id],
        };
      } else {
        // Toggle category (for filteredCollections)
        newState[type] = !prev[type];
      }

      return newState;
    });
  };

  // Handle select all for a category
  const handleSelectAllCategory = (type, items, selected) => {
    setSelectedResources((prev) => {
      const newState = { ...prev };
      newState[type] = {};

      if (selected) {
        items.forEach((item) => {
          newState[type][item.id] = true;
        });
      }

      return newState;
    });
  };

  // Toggle collapsible sections
  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Get user details content
  const getUserDetailsContent = () => {
    if (!customUserData) return null;

    const details = [];
    if (customUserData.name) {
      details.push({ label: "Name", value: customUserData.name });
    }
    if (customUserData.email) {
      details.push({ label: "Email", value: customUserData.email });
    }
    if (customUserData.role) {
      details.push({ label: "Role", value: customUserData.role });
    }

    return details.length > 0 ? details : null;
  };

  // Handle user icon click
  const handleUserIconClick = () => {
    const now = Date.now();
    if (now - lastClickTime < 300) {
      setIncludeUserInfo(!includeUserInfo);
      setShowUserDetails(false);
    } else {
      setShowUserDetails(!showUserDetails);
    }
    setLastClickTime(now);
  };

  // Handle pin items
  const handlePinItems = async (items) => {
    try {
      const itemsToPin = items.filter((item) => !item.isPinned);

      if (itemsToPin.length > 0) {
        await pinItemsMutation.mutateAsync({
          items: itemsToPin.map((item) => ({
            itemId: item.id,
            itemType: item.type,
            title: item.title || item.name,
          })),
        });
        toast.success(
          `Pinned ${itemsToPin.length} item${itemsToPin.length > 1 ? "s" : ""}`
        );
      }
    } catch (error) {
      console.error("Failed to pin items:", error);
      toast.error("Failed to pin items");
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40">
        <button
          onClick={onToggle}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 md:p-4 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl"
        >
          <FaWandMagicSparkles className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Chat Panel */}
      <div className="fixed inset-0 md:top-4 md:right-4 md:bottom-4 md:left-64 lg:left-72 xl:left-[50%] bg-white rounded-none md:rounded-xl shadow-2xl border-0 md:border border-gray-200 flex flex-col z-40">
        {/* Header */}
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-none md:rounded-t-xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-6 h-6 md:w-8 md:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaComments className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                Collections Chat
              </h3>
              <p className="text-xs text-gray-600">
                {searchTerm
                  ? `Searching "${searchTerm}" (${filteredCollections.length} results)`
                  : `${filteredCollections.length} collections`}
              </p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Resource Selection */}
        <div className="p-3 md:p-4 border-b border-gray-200 bg-gray-50 max-h-48 lg:max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-2 md:mb-3">
            <div className="text-xs md:text-sm font-medium text-gray-700">
              Select data to include in chat:
            </div>
            <div className="text-xs text-gray-500">
              ~{getTokenEstimate.toLocaleString()} tokens
            </div>
          </div>

          <div className="space-y-1 md:space-y-2">
            {/* Filtered Collections (default) */}
            <label className="flex items-center gap-2 text-xs md:text-sm">
              <input
                type="checkbox"
                checked={selectedResources.filteredCollections}
                onChange={() => handleResourceToggle("filteredCollections")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <FaFolder className="w-3 h-3 text-blue-600" />
              <span>
                {searchTerm
                  ? `Filtered Collections (${filteredCollections.length})`
                  : `Current Collections (${filteredCollections.length})`}
              </span>
            </label>

            {/* External Links from Collections */}
            {collectionExternalLinks.length > 0 && (
              <div className="space-y-1">
                <div
                  className="flex items-center justify-between cursor-pointer py-1"
                  onClick={() => toggleSection("externalLinks")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      External Links ({filteredExternalLinks.length}
                      {searchFilters.externalLinks
                        ? ` of ${collectionExternalLinks.length}`
                        : ""}
                      )
                    </span>
                    {collapsedSections.externalLinks ? (
                      <FaChevronDown className="w-3 h-3 text-gray-400" />
                    ) : (
                      <FaChevronUp className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAllCategory(
                        "externalLinks",
                        filteredExternalLinks,
                        !Object.values(selectedResources.externalLinks).some(
                          Boolean
                        )
                      );
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {Object.values(selectedResources.externalLinks).some(
                      Boolean
                    )
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                {!collapsedSections.externalLinks && (
                  <div className="ml-4 space-y-2">
                    {/* Search input for external links */}
                    <div className="relative">
                      <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search external links..."
                        value={searchFilters.externalLinks}
                        onChange={(e) =>
                          setSearchFilters((prev) => ({
                            ...prev,
                            externalLinks: e.target.value,
                          }))
                        }
                        className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {filteredExternalLinks.map((link) => (
                        <label
                          key={link.id}
                          className="flex items-center gap-2 text-xs ml-4"
                        >
                          <input
                            type="checkbox"
                            checked={
                              selectedResources.externalLinks[link.id] || false
                            }
                            onChange={() =>
                              handleResourceToggle("externalLinks", link.id)
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <FaLink className="w-3 h-3 text-indigo-600" />
                          <div className="flex flex-col">
                            <span className="truncate">{link.name}</span>
                            <span className="text-xs text-gray-500">
                              from {link.collectionName}
                            </span>
                          </div>
                        </label>
                      ))}
                      {filteredExternalLinks.length === 0 &&
                        searchFilters.externalLinks && (
                          <div className="text-xs text-gray-500 ml-4 py-2">
                            No external links found matching &quot;
                            {searchFilters.externalLinks}&quot;
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resources from Collections */}
            {collectionResources.length > 0 && (
              <div className="space-y-1">
                <div
                  className="flex items-center justify-between cursor-pointer py-1"
                  onClick={() => toggleSection("resources")}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">
                      Resources ({filteredResources.length}
                      {searchFilters.resources
                        ? ` of ${collectionResources.length}`
                        : ""}
                      )
                    </span>
                    {collapsedSections.resources ? (
                      <FaChevronDown className="w-3 h-3 text-gray-400" />
                    ) : (
                      <FaChevronUp className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectAllCategory(
                        "resources",
                        filteredResources,
                        !Object.values(selectedResources.resources).some(
                          Boolean
                        )
                      );
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {Object.values(selectedResources.resources).some(Boolean)
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                {!collapsedSections.resources && (
                  <div className="ml-4 space-y-2">
                    {/* Search input for resources */}
                    <div className="relative">
                      <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search resources..."
                        value={searchFilters.resources}
                        onChange={(e) =>
                          setSearchFilters((prev) => ({
                            ...prev,
                            resources: e.target.value,
                          }))
                        }
                        className="w-full pl-7 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {filteredResources.map((resource) => (
                        <label
                          key={resource.id}
                          className="flex items-center gap-2 text-xs ml-4"
                        >
                          <input
                            type="checkbox"
                            checked={
                              selectedResources.resources[resource.id] || false
                            }
                            onChange={() =>
                              handleResourceToggle("resources", resource.id)
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <FaBook className="w-3 h-3 text-green-600" />
                          <div className="flex flex-col">
                            <span className="truncate">{resource.name}</span>
                            <span className="text-xs text-gray-500">
                              from {resource.collectionName}
                            </span>
                          </div>
                        </label>
                      ))}
                      {filteredResources.length === 0 &&
                        searchFilters.resources && (
                          <div className="text-xs text-gray-500 ml-4 py-2">
                            No resources found matching &quot;
                            {searchFilters.resources}&quot;
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
          {history.length === 0 ? (
            <div className="text-center text-gray-500 mt-4 md:mt-8">
              <FaComments className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-xs md:text-sm">
                Start a conversation about your collections
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Use @ to mention specific items from your collection
              </p>
              {searchTerm && (
                <p className="text-xs text-blue-600 mt-2">
                  Currently filtering by: &quot;{searchTerm}&quot;
                </p>
              )}
            </div>
          ) : (
            history.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.isUser ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[80%] p-2 md:p-3 rounded-lg ${
                    message.isUser
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  {message.isUser ? (
                    <p className="text-xs md:text-sm">{message.prompt}</p>
                  ) : (
                    <div>
                      <MessageContent
                        content={message.answer}
                        enableTypingAnimation={message.enableTypingAnimation}
                      />

                      {/* Referenced Items */}
                      {message.referencedItems &&
                        chatData &&
                        index === history.length - 1 && (
                          <ReferencedItems
                            items={[
                              ...(chatData?.data?.collections?.map(
                                (collection) => ({
                                  ...collection,
                                  type: "collection",
                                })
                              ) || []),
                              ...(chatData?.data?.externalLinks?.map(
                                (link) => ({
                                  ...link,
                                  type: "external_link",
                                })
                              ) || []),
                              ...(chatData?.data?.resources?.map(
                                (resource) => ({
                                  ...resource,
                                  type: "resource",
                                })
                              ) || []),
                              ...(chatData?.data?.videos?.map((video) => ({
                                ...video,
                                type: "video",
                                priority: "high",
                              })) || []),
                              ...(chatData?.data?.attachments?.map(
                                (attachment) => ({
                                  ...attachment,
                                  type: "attachment",
                                })
                              ) || []),
                            ]}
                            onPinItems={handlePinItems}
                            pinnedItems={pinnedItems}
                            displayVideosFirst={true}
                            onUseReferencedItems={(formattedItems) => {
                              toast.success(
                                "Referenced items available for next question"
                              );
                            }}
                          />
                        )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 md:p-4 border-t border-gray-200 bg-white rounded-none md:rounded-b-xl">
          <div className="flex gap-1 md:gap-2 mb-2 md:mb-3">
            {/* User Info Toggle */}
            <div className="relative">
              <button
                onClick={handleUserIconClick}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => {
                  setIsHovering(false);
                  if (!showUserDetails) {
                    setTimeout(() => {
                      if (!showUserDetails) {
                        setShowUserDetails(false);
                      }
                    }, 100);
                  }
                }}
                className={`p-1.5 md:p-2 rounded-lg transition-all duration-200 ${
                  includeUserInfo
                    ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FaUser className="h-3 w-3" />
              </button>

              {/* User Details Tooltip */}
              {(isHovering || showUserDetails) && getUserDetailsContent() && (
                <div
                  className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50"
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => {
                    setIsHovering(false);
                    if (!showUserDetails) {
                      setShowUserDetails(false);
                    }
                  }}
                >
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {getUserDetailsContent().map((detail, index) => (
                      <div
                        key={detail.label}
                        className={`${
                          index > 0 ? "border-t border-gray-100 pt-1.5" : ""
                        }`}
                      >
                        <div className="text-xs font-medium text-gray-500">
                          {detail.label}
                        </div>
                        <div className="text-sm text-gray-700 break-words">
                          {detail.value}
                        </div>
                      </div>
                    ))}
                  </div>
                  {showUserDetails && (
                    <button
                      onClick={() => setShowUserDetails(false)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Typing Animation Toggle */}
            <button
              onClick={() => setTypingAnimationEnabled(!typingAnimationEnabled)}
              className={`p-1.5 md:p-2 rounded-lg transition-all duration-200 ${
                typingAnimationEnabled
                  ? "bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
              title={
                typingAnimationEnabled
                  ? "Disable typing animation"
                  : "Enable typing animation"
              }
            >
              <FaKeyboard className="h-3 w-3" />
            </button>
          </div>

          {/* Mentioned Items Display */}
          {mentionedItems.length > 0 && (
            <div className="px-3 py-2 border-t border-blue-100 bg-blue-50/50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                  @ Mentioned Items
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[130px] overflow-y-auto">
                {mentionedItems.map((item) => {
                  const IconComponent = item.icon || FaLink;
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200"
                    >
                      <div className={`${item.iconColor || "text-indigo-600"}`}>
                        <IconComponent className="w-3 h-3" />
                      </div>
                      <span className="truncate max-w-[200px] text-blue-700 text-sm font-medium">
                        {item.title || item.name || "Untitled"}
                      </span>
                      <span className="text-xs text-blue-500 capitalize font-medium">
                        {(item.type || "item").replace("_", " ")}
                      </span>
                      <button
                        onClick={() => removeMentionedItem(item)}
                        className="text-blue-400 hover:text-red-500 transition-colors duration-200"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={handleTextareaChange}
              onKeyDown={(e) => {
                handleMentionKeyDown(e);
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask a question about your collections... Use @ to mention specific items"
              className="w-full p-2 md:p-3 pr-10 md:pr-12 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs md:text-sm"
              rows={2}
              disabled={isLoading}
            />

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!query.trim() || isLoading}
              className="absolute bottom-2 md:bottom-3 right-2 md:right-3 p-1.5 md:p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-2 border-white border-t-transparent" />
              ) : (
                <FiSend className="w-3 h-3 md:w-4 md:h-4" />
              )}
            </button>

            {/* Mention Dropdown */}
            {showMentionDropdown && (
              <div
                className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-white rounded-lg shadow-lg border border-gray-200 max-h-48 overflow-y-auto z-50"
                style={{
                  bottom: "100%",
                  marginBottom: "8px",
                }}
              >
                {getFilteredMentionItems().length > 0 ? (
                  getFilteredMentionItems().map((item, index) => {
                    const IconComponent = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleMentionSelect(item)}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 ${
                          index === selectedMentionIndex ? "bg-blue-50" : ""
                        }`}
                      >
                        <IconComponent
                          className={`w-4 h-4 ${item.iconColor}`}
                        />
                        <span className="text-sm font-medium truncate">
                          {item.title || item.name}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No items found
                  </div>
                )}
              </div>
            )}

            {/* AI Disclaimer */}
            <div className="text-center mt-3">
              <p className="text-xs text-gray-400">
                AI can make mistakes. Please verify important information.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insufficient Credits Modal */}
      <InsufficientCreditsModal
        isOpen={showInsufficientCreditsModal}
        onClose={() => setShowInsufficientCreditsModal(false)}
      />
    </>
  );
};

export default CollectionsChat;
