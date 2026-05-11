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

const ExternalLinkChat = ({
  externalLink,
  linkGroups = {},
  isOpen,
  onToggle,
  isAdmin = false,
  isCollaborator = false,
  userRole = "",
  systemUserId = "",
  pinnedItems = [],
}) => {
  const { customUserData } = useContextAuth();
  const aiChat = useAIChat();
  const contentSearchMutation = useContentSearch();
  const pinItemsMutation = usePinItems();

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

  // Resource selection state
  const [selectedResources, setSelectedResources] = useState({
    externalLink: true, // Always include the main external link
    description: true,
    notations: {},
    linkGroups: {},
    attachments: {},
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

  // Reset typing animation for existing messages when chat opens
  useEffect(() => {
    if (isOpen && history.length > 0) {
      setHistory((prev) =>
        prev.map((message) => ({
          ...message,
          enableTypingAnimation: false, // Disable typing for existing messages
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

      // Check if there's a space after @ (which would end the mention)
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionQuery(textAfterAt);
        setShowMentionDropdown(true);
        setSelectedMentionIndex(0);

        // Calculate position for dropdown
        const textarea = e.target;
        const rect = textarea.getBoundingClientRect();
        const lineHeight = 20;
        const lines = textBeforeCursor.split("\n").length;

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
    // Remove from mentioned items state
    setMentionedItems((prev) =>
      prev.filter((item) => item.id !== itemToRemove.id)
    );

    // Remove the mention from the query text
    const updatedQuery = query.replace(itemToRemove.title, "").trim();
    setQuery(updatedQuery);

    // Focus back on textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Build context from selected resources
  const buildChatContext = () => {
    const context = [];

    // Always include basic external link info
    if (selectedResources.externalLink) {
      context.push({
        type: "external_link",
        id: externalLink.id,
        title: externalLink.name,
        url: externalLink.url,
        description: externalLink.description,
        type_category: externalLink.type,
        status: externalLink.status,
        date: externalLink.date,
        visibility: externalLink.visibility,
        tags: externalLink.tags,
        created_at: externalLink.created_at,
        updated_at: externalLink.updated_at,
      });
    }

    // Include description if selected (already included in external link above)
    // This is kept for backwards compatibility but data is already in external_link object

    // Include selected notations with full content
    if (externalLink.notations) {
      externalLink.notations.forEach((notation) => {
        if (selectedResources.notations[notation.id]) {
          context.push({
            type: "notation",
            id: notation.id,
            title: notation.title,
            content: notation.notes,
            notes: notation.notes,
            status: notation.status,
            date: notation.date,
            category: notation.category,
            created_at: notation.created_at,
            updated_at: notation.updated_at,
            user_id: notation.user_id,
            external_link_id: notation.external_link_id,
          });
        }
      });
    }

    // Include selected link groups with full details
    Object.entries(linkGroups).forEach(([category, items]) => {
      items.forEach((item) => {
        if (selectedResources.linkGroups[item.id]) {
          context.push({
            type: "related_link",
            id: item.id,
            title: item.name,
            name: item.name,
            url: item.url,
            description: item.description,
            category: category,
            status: item.status,
            date: item.date,
            created_at: item.created_at,
            updated_at: item.updated_at,
          });
        }
      });
    });

    // Include selected attachments with full details
    if (externalLink.attachments) {
      externalLink.attachments.forEach((attachment) => {
        if (selectedResources.attachments[attachment.id]) {
          context.push({
            type: "attachment",
            id: attachment.id,
            title: attachment.title,
            description: attachment.description,
            file_type: attachment.type,
            file_name: attachment.file_name,
            file_size: attachment.file_size,
            file_url: attachment.file_url,
            created_at: attachment.created_at,
            updated_at: attachment.updated_at,
            external_link_id: attachment.external_link_id,
          });
        }
      });
    }

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

    // Use mentioned items from state instead of extracting from text
    const usesMentions = mentionedItems.length > 0;

    // Build selected resources context for traditional format
    const selectedResourcesContext = buildChatContext();

    // Combine selected resources and mentioned items into one array
    const allItemsToSend = [
      ...selectedResourcesContext, // Selected resources with full details
      ...mentionedItems, // @ mentioned items with full details
    ];

    // Add user message to history
    const userMessage = {
      id: Date.now().toString(),
      prompt: query,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setHistory((prev) => [...prev, userMessage]);
    setQuery("");
    setMentionedItems([]); // Clear mentioned items after sending
    setIsLoading(true);

    try {
      const userInfo = getUserInfoString(customUserData, includeUserInfo);
      const fullPrompt = `${
        userInfo ? userInfo + " " : ""
      }Question: ${cleanQuery}`;

      // Build payload in the expected format
      const payload = {
        prompt: fullPrompt,
        history,
        data: {
          // Send empty arrays for traditional format (keeping for backward compatibility)
          collections: [],
          externalLinks: [],
          resources: [],
          events: [],
          organizations: [],
          videos: [],
          notations: [],
          attachments: [],
          // Send all items (selected + mentioned) with full details in mentionedItems
          mentionedItems:
            allItemsToSend.length > 0 ? allItemsToSend : undefined,
        },
        // Disable RAG when we have clinical trials or other items to analyze
        disableRAG: allItemsToSend.length > 0,
      };

      const response = await aiChat.mutateAsync(payload);

      // Check if response contains "insufficient credits" message
      const answerText =
        response?.content?.answer ||
        response?.answer ||
        response?.message ||
        "";

      if (
        typeof answerText === "string" &&
        answerText.toLowerCase().includes("insufficient credits") &&
        answerText.toLowerCase().includes("please purchase more")
      ) {
        setShowInsufficientCreditsModal(true);
      }

      // Capture chat data from response for ReferencedItems
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
        // Add referenced items to the message if available
        referencedItems: response?.content ? true : false,
      };

      setHistory((prev) => [...prev, aiMessage]);

      // Clear mentioned items after sending if using mentions
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
        newState[type] = {
          ...prev[type],
          [id]: !prev[type][id],
        };
      } else {
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
      // Double click - toggle user info
      setIncludeUserInfo(!includeUserInfo);
      setShowUserDetails(false);
    } else {
      // Single click - show/hide details
      setShowUserDetails(!showUserDetails);
    }
    setLastClickTime(now);
  };

  // Handle pin items
  const handlePinItems = async (items) => {
    try {
      // Check if any of the items have the isPinned flag set by ReferencedItems component
      const itemsToPin = items.filter((item) => !item.isPinned);
      const itemsToUnpin = items.filter((item) => item.isPinned);

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

      if (itemsToUnpin.length > 0) {
        // Handle unpinning if needed - this would require an unpin mutation
        toast.success(
          `Unpinned ${itemsToUnpin.length} item${
            itemsToUnpin.length > 1 ? "s" : ""
          }`
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
                Chat with Resource
              </h3>
              <p className="text-xs text-gray-600 truncate max-w-32 md:max-w-48">
                {externalLink.name}
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
        <div className="p-3 md:p-4 border-b border-gray-200 bg-gray-50 max-h-32 md:max-h-48 lg:max-h-64 overflow-y-auto">
          <div className="text-xs md:text-sm font-medium text-gray-700 mb-2 md:mb-3">
            Select content to include in chat:
          </div>

          <div className="space-y-1 md:space-y-2">
            {/* Main Resource */}
            <label className="flex items-center gap-2 text-xs md:text-sm">
              <input
                type="checkbox"
                checked={selectedResources.externalLink}
                onChange={() => handleResourceToggle("externalLink")}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <FaLink className="w-3 h-3 text-indigo-600" />
              <span>Main Resource Info</span>
            </label>

            {/* Description */}
            {externalLink.description && (
              <label className="flex items-center gap-2 text-xs md:text-sm">
                <input
                  type="checkbox"
                  checked={selectedResources.description}
                  onChange={() => handleResourceToggle("description")}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <FaFileAlt className="w-3 h-3 text-gray-600" />
                <span>Description</span>
              </label>
            )}

            {/* Notations */}
            {externalLink.notations && externalLink.notations.length > 0 && (
              <div className="ml-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">
                    Notes ({externalLink.notations.length})
                  </span>
                  <button
                    onClick={() =>
                      handleSelectAllCategory(
                        "notations",
                        externalLink.notations,
                        !Object.values(selectedResources.notations).some(
                          Boolean
                        )
                      )
                    }
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    {Object.values(selectedResources.notations).some(Boolean)
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                {externalLink.notations?.map((notation) => (
                  <label
                    key={notation.id}
                    className="flex items-center gap-2 text-xs ml-4"
                  >
                    <input
                      type="checkbox"
                      checked={
                        selectedResources.notations[notation.id] || false
                      }
                      onChange={() =>
                        handleResourceToggle("notations", notation.id)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <FaClipboard className="w-3 h-3 text-gray-500" />
                    <span className="truncate">
                      {notation.title || "Untitled Note"}
                    </span>
                  </label>
                ))}
                {/* {externalLink.notations.length > 3 && (
                  <div className="text-xs text-gray-500 ml-6">
                    +{externalLink.notations.length - 3} more notes
                  </div>
                )} */}
              </div>
            )}

            {/* Link Groups */}
            {Object.entries(linkGroups).map(
              ([category, items]) =>
                items.length > 0 && (
                  <div key={category} className="ml-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 capitalize">
                        {category} Links ({items.length})
                      </span>
                      <button
                        onClick={() =>
                          handleSelectAllCategory(
                            "linkGroups",
                            items,
                            !items.some(
                              (item) => selectedResources.linkGroups[item.id]
                            )
                          )
                        }
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {items.some(
                          (item) => selectedResources.linkGroups[item.id]
                        )
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>
                    {items?.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2 text-xs ml-4"
                      >
                        <input
                          type="checkbox"
                          checked={
                            selectedResources.linkGroups[item.id] || false
                          }
                          onChange={() =>
                            handleResourceToggle("linkGroups", item.id)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <FaLink className="w-3 h-3 text-indigo-600" />
                        <span className="truncate">{item.name}</span>
                      </label>
                    ))}
                    {items.length > 2 && (
                      <div className="text-xs text-gray-500 ml-6">
                        +{items.length - 2} more links
                      </div>
                    )}
                  </div>
                )
            )}

            {/* Attachments */}
            {externalLink.attachments &&
              externalLink.attachments.length > 0 && (
                <div className="ml-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Attachments ({externalLink.attachments.length})
                    </span>
                    <button
                      onClick={() =>
                        handleSelectAllCategory(
                          "attachments",
                          externalLink.attachments,
                          !Object.values(selectedResources.attachments).some(
                            Boolean
                          )
                        )
                      }
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {Object.values(selectedResources.attachments).some(
                        Boolean
                      )
                        ? "Deselect All"
                        : "Select All"}
                    </button>
                  </div>
                  {externalLink.attachments?.map((attachment) => (
                    <label
                      key={attachment.id}
                      className="flex items-center gap-2 text-xs ml-4"
                    >
                      <input
                        type="checkbox"
                        checked={
                          selectedResources.attachments[attachment.id] || false
                        }
                        onChange={() =>
                          handleResourceToggle("attachments", attachment.id)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <FaPaperclip className="w-3 h-3 text-gray-600" />
                      <span className="truncate">{attachment.title}</span>
                    </label>
                  ))}
                  {/* {externalLink.attachments.length > 3 && (
                    <div className="text-xs text-gray-500 ml-6">
                      +{externalLink.attachments.length - 3} more files
                    </div>
                  )} */}
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
                Start a conversation about this resource
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Use @ to mention other items from your collection
              </p>
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

                      {/* Add Referenced Items for AI messages that have referenced items */}
                      {message.referencedItems &&
                        chatData &&
                        index === history.length - 1 && (
                          <ReferencedItems
                            items={[
                              // Include collections
                              ...(chatData?.data?.collections?.map(
                                (collection) => ({
                                  ...collection,
                                  type: "collection",
                                })
                              ) || []),
                              // Include direct external links
                              ...(chatData?.data?.externalLinks?.map(
                                (link) => ({
                                  ...link,
                                  type: "external_link",
                                })
                              ) || []),
                              // Include resources
                              ...(chatData?.data?.resources?.map(
                                (resource) => ({
                                  ...resource,
                                  type: "resource",
                                })
                              ) || []),
                              // Include events
                              ...(chatData?.data?.events?.map((event) => ({
                                ...event,
                                type: "event",
                              })) || []),
                              // Videos are placed first to give them priority
                              ...(chatData?.data?.videos?.map((video) => ({
                                ...video,
                                type: "video",
                                priority: "high",
                              })) || []),
                              // Include direct attachments
                              ...(chatData?.data?.attachments?.map(
                                (attachment) => ({
                                  ...attachment,
                                  type: "attachment",
                                })
                              ) || []),
                              // Include direct notations
                              ...(chatData?.data?.notations?.map(
                                (notation) => ({
                                  ...notation,
                                  type: "notation",
                                })
                              ) || []),
                              // Include organizations
                              ...(chatData?.data?.organizations?.map(
                                (organization) => ({
                                  ...organization,
                                  type: "organization",
                                })
                              ) || []),
                            ]}
                            onPinItems={handlePinItems}
                            pinnedItems={pinnedItems}
                            displayVideosFirst={true}
                            onUseReferencedItems={(formattedItems) => {
                              // Update selected resources with the formatted items
                              // For ExternalLinkChat, we could update the context or show a toast
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

          {/* Mentioned Items Display (from @ mentions) */}
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
                        {(item.type || "link").replace("_", " ")}
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
              placeholder="Ask a question about this resource... Use @ to mention other items"
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
          </div>

          {/* AI Disclaimer */}
          <div className="text-center mt-3">
            <p className="text-xs text-gray-400">
              AI can make mistakes. Please verify important information.
            </p>
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

export default ExternalLinkChat;
