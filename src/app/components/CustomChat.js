"use client";

import {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import {
  FaUser,
  FaPlus,
  FaDollarSign,
  FaCalendar,
  FaBook,
  FaFolder,
  FaHandHoldingHeart,
  FaGlobe,
  FaBuilding,
  FaGlobeAmericas,
  FaVideo,
  FaClipboard,
  FaKeyboard,
  FaLink,
  FaPaperclip,
  FaFileAlt,
  FaDownload,
  FaShareAlt,
  FaMagic,
  FaChalkboard,
  FaSave,
  FaSpinner,
  FaShoppingCart,
} from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import InputField from "./inputs/InputField";
import SearchModal from "./SearchModal";
import CreditEstimator from "./CreditEstimator";
import { getUserInfoString, estimateTokenCount } from "../utils/jsonExtractors";
import { useContextAuth } from "../context/authContext";
import { usePublicAuth } from "../hooks/usePublicAuth";
import { toast } from "react-hot-toast";
import ReferencedItems from "./ReferencedItems";
import MessageContent from "./MessageContent";
import { usePinItems } from "../hooks/usePinned";
import GuidedIndicator from "./tour/GuidedIndicator";
import InsufficientCreditsModal from "./InsufficientCreditsModal";
import { useContentSearch } from "../hooks/useAI";
import ChatExportModal from "./ChatExportModal";
import ExternalLinkWhiteboard from "./ExternalLinkWhiteboard";
import Modal from "./Modal";
import { stripHtmlToText } from "../utils/sanitizeHtml";
import {
  updateCollection,
  updateExternalLinkWhiteboard,
} from "../api/collectionsApi";

const CHAT_WHITEBOARD_STORAGE_KEY = "chatPromptWhiteboard";
const WHITEBOARD_ELEMENT_LIMIT = 60;

const parseWhiteboardData = (whiteboardData) => {
  if (!whiteboardData) return null;
  if (typeof whiteboardData === "string") {
    try {
      return JSON.parse(whiteboardData);
    } catch (error) {
      console.error("Failed to parse chat whiteboard data:", error);
      return null;
    }
  }
  return whiteboardData;
};

const getVisibleWhiteboardElements = (whiteboardData) => {
  const parsed = parseWhiteboardData(whiteboardData);
  return Array.isArray(parsed?.elements)
    ? parsed.elements.filter((element) => element && !element.isDeleted)
    : [];
};

const hasWhiteboardContent = (whiteboardData) =>
  getVisibleWhiteboardElements(whiteboardData).length > 0;

const getItemTitle = (item) =>
  stripHtmlToText(item?.title || item?.name || item?.label || item?.url || "") ||
  "Untitled";

const getItemDescription = (item, fallback = "") =>
  stripHtmlToText(item?.description || item?.notes || "") || fallback;

const summarizeWhiteboardData = (whiteboardData) => {
  const parsed = parseWhiteboardData(whiteboardData);
  const elements = getVisibleWhiteboardElements(parsed);
  if (elements.length === 0) return "";

  const typeCounts = elements.reduce((acc, element) => {
    const type = element.type || "unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  const textElements = elements
    .filter((element) => typeof element.text === "string" && element.text.trim())
    .slice(0, 8)
    .map((element) => element.text.trim());
  const typeSummary = Object.entries(typeCounts)
    .map(([type, count]) => `${count} ${type}`)
    .join(", ");

  return [
    `Whiteboard contains ${elements.length} visible element${
      elements.length === 1 ? "" : "s"
    }${typeSummary ? ` (${typeSummary})` : ""}.`,
    textElements.length > 0 ? `Text on board: ${textElements.join(" | ")}` : "",
    parsed?.updatedAt ? `Last updated: ${parsed.updatedAt}.` : "",
  ]
    .filter(Boolean)
    .join(" ");
};

const buildWhiteboardChatPayload = (whiteboardData, attachments = {}) => {
  const parsed = parseWhiteboardData(whiteboardData);
  const elements = getVisibleWhiteboardElements(parsed);
  if (elements.length === 0) return null;

  return {
    id: "chat-prompt-whiteboard",
    title: "Prompt whiteboard",
    summary: summarizeWhiteboardData(parsed),
    attachments,
    elements: elements.slice(0, WHITEBOARD_ELEMENT_LIMIT).map((element) => ({
      id: element.id,
      type: element.type,
      text: element.text || undefined,
      x: Math.round(Number(element.x) || 0),
      y: Math.round(Number(element.y) || 0),
      width: Math.round(Number(element.width) || 0),
      height: Math.round(Number(element.height) || 0),
    })),
    omittedElementCount: Math.max(0, elements.length - WHITEBOARD_ELEMENT_LIMIT),
  };
};

const CustomChat = forwardRef(
  (
    {
      history,
      onChatComplete,
      onClearHistory,
      chatData,
      aiChat,
      allEvents = [],
      allResources = [],
      allCollections = [],
      allOrganizations = [],
      allVideos = [],
      allSocialMediaAccounts = [],
      pinnedItems = [],
      enableTypingAnimation = true,
      onBeforeSend,
      onOpenWorkflowPlanner,
      onOpenCollectionPlan,
    },
    ref,
  ) => {
    const authContext = useContextAuth();
    const publicAuth = usePublicAuth();
    // Use public auth if not signed in, otherwise use context auth
    const customUserData =
      authContext?.customUserData || publicAuth?.userDetails || null;
    const pinItemsMutation = usePinItems();
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [includeUserInfo, setIncludeUserInfo] = useState(false);
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [showResourceSearch, setShowResourceSearch] = useState(false);
    const [selectedResources, setSelectedResources] = useState([]);
    const [collectionCartItems, setCollectionCartItems] = useState([]);
    const [isClient, setIsClient] = useState(false);
    const [showCreditEstimator, setShowCreditEstimator] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const chatEndRef = useRef(null);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [searchType, setSearchType] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showCollectionCartSearchModal, setShowCollectionCartSearchModal] =
      useState(false);
    const [searchFilter, setSearchFilter] = useState("");
    const [lastClickTime, setLastClickTime] = useState(0);
    const [isHovering, setIsHovering] = useState(false);
    const [lastSentResources, setLastSentResources] = useState([]);
    const [showGuide, setShowGuide] = useState(true);
    const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] =
      useState(false);
    const [typingAnimationEnabled, setTypingAnimationEnabled] = useState(
      enableTypingAnimation,
    );
    const [showExportModal, setShowExportModal] = useState(false);
    const [showWhiteboardPanel, setShowWhiteboardPanel] = useState(false);
    const [chatWhiteboardData, setChatWhiteboardData] = useState(null);
    const [includeWhiteboardInChat, setIncludeWhiteboardInChat] = useState(true);
    const [attachWhiteboardToCollection, setAttachWhiteboardToCollection] =
      useState(false);
    const [attachWhiteboardToExternalLink, setAttachWhiteboardToExternalLink] =
      useState(false);
    const [whiteboardCollectionId, setWhiteboardCollectionId] = useState("");
    const [whiteboardExternalLinkId, setWhiteboardExternalLinkId] =
      useState("");
    const [isSavingWhiteboardAttachments, setIsSavingWhiteboardAttachments] =
      useState(false);
    const [pendingWorkflowSuggestion, setPendingWorkflowSuggestion] =
      useState(null);
    const [pendingCollectionPlanSuggestion, setPendingCollectionPlanSuggestion] =
      useState(null);
    const [attachWhiteboardToWorkflowProject, setAttachWhiteboardToWorkflowProject] =
      useState(true);
    const [collectionPlanSelections, setCollectionPlanSelections] = useState({});

    // @ Mention functionality state
    const [showMentionDropdown, setShowMentionDropdown] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
    const [cursorPosition, setCursorPosition] = useState(0);
    const [mentionedItems, setMentionedItems] = useState([]);
    const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
    const textareaRef = useRef(null);
    const [justSelectedMention, setJustSelectedMention] = useState(false);

    // Search-based mentions
    const [mentionSearchResults, setMentionSearchResults] = useState([]);
    const contentSearchMutation = useContentSearch();
    const contentSearchMutationRef = useRef(contentSearchMutation);

    useEffect(() => {
      contentSearchMutationRef.current = contentSearchMutation;
    }, [contentSearchMutation]);

    // Initialize selectedResources from localStorage after component mounts
    useEffect(() => {
      setIsClient(true);
      if (typeof window !== "undefined") {
        // Clear localStorage on mount
        localStorage.removeItem("selectedResources");
        setSelectedResources([]);
      }
    }, []);

    // Disable typing animation for existing messages when component mounts with history
    // This prevents re-typing animation when user leaves and comes back to chat
    useEffect(() => {
      if (history && history.length > 0) {
        // Only disable typing animation for messages that don't already have it explicitly set
        const hasMessagesWithTypingAnimation = history.some(
          (message) => message.enableTypingAnimation !== false,
        );

        if (hasMessagesWithTypingAnimation) {
          // This is handled by modifying the enableTyping prop passed to MessageContent
          // We'll use a new state to track if we should disable typing for existing messages
          setTypingAnimationEnabled(false);
        }
      }
    }, [history]);

    // Debounced search for mention dropdown
    useEffect(() => {
      if (mentionQuery && mentionQuery.length >= 2) {
        // Debounce the search
        const timeoutId = setTimeout(() => {
          contentSearchMutationRef.current.mutate(
            { searchQuery: mentionQuery },
            {
              onSuccess: (data) => {
                // Process all search results and format them for mentions
                const searchResults = data?.content || [];
                const formattedResults = searchResults.map((item) => {
                  // Determine icon and color based on type
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
                    case "organization":
                      icon = FaBuilding;
                      iconColor = "text-orange-600";
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
                    case "link_group":
                      icon = FaLink;
                      iconColor = "text-cyan-600";
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
                setMentionSearchResults((current) =>
                  current.length > 0 ? [] : current,
                );
              },
            },
          );
        }, 300); // 300ms debounce

        return () => clearTimeout(timeoutId);
      } else {
        // Clear results if query is too short
        setMentionSearchResults((current) =>
          current.length > 0 ? [] : current,
        );
      }
    }, [mentionQuery]);

    // Add a simpler check for the exact message we see in the screenshot
    useEffect(() => {
      // Check if the last message in history contains "Insufficient credits"
      if (history && history.length > 0) {
        const lastMessage = history[history.length - 1];
        if (
          !lastMessage.isUser && // It's an AI message
          // Check in answer property
          ((typeof lastMessage.answer === "string" &&
            lastMessage.answer.trim() ===
              "Insufficient credits, please purchase more to continue using AI chat.") ||
            // Also check in message property in case the format is different
            (typeof lastMessage.message === "string" &&
              lastMessage.message.trim() ===
                "Insufficient credits, please purchase more to continue using AI chat."))
        ) {
          setShowInsufficientCreditsModal(true);
        }
      }
    }, [history]);

    // Save selectedResources to localStorage whenever it changes
    useEffect(() => {
      if (isClient && typeof window !== "undefined") {
        localStorage.setItem(
          "selectedResources",
          JSON.stringify(selectedResources),
        );
      }
    }, [selectedResources, isClient]);

    // Prepare all available items for mentions - now using search results
    const mentionItems = useMemo(() => {
      // If we have search results, use those
      if (mentionSearchResults.length > 0) {
        return mentionSearchResults;
      }

      // Otherwise, fall back to the existing arrays for initial display
      return [
        ...(allCollections?.map((item) => ({
          ...item,
          type: "collection",
          icon: FaFolder,
          iconColor: "text-blue-600",
        })) || []),
        ...(allResources?.map((item) => ({
          ...item,
          type: "resource",
          icon: FaBook,
          iconColor: "text-green-600",
        })) || []),
        ...(allEvents?.map((item) => ({
          ...item,
          type: "event",
          icon: FaCalendar,
          iconColor: "text-purple-600",
        })) || []),
        ...(allOrganizations?.map((item) => ({
          ...item,
          type: "organization",
          icon: FaBuilding,
          iconColor: "text-orange-600",
        })) || []),
        ...(allVideos?.map((item) => ({
          ...item,
          type: "video",
          icon: FaVideo,
          iconColor: "text-red-600",
        })) || []),
        ...(allSocialMediaAccounts?.map((item) => ({
          ...item,
          type: "social_media_account",
          icon: FaShareAlt,
          iconColor: "text-blue-500",
        })) || []),
        // Include chatData external links for backward compatibility
        ...(chatData?.externalLinks?.map((item) => ({
          ...item,
          type: "external_link",
          icon: FaLink,
          iconColor: "text-indigo-600",
        })) || []),
        ...(chatData?.linkGroups?.map((item) => ({
          ...item,
          type: "link_group",
          icon: FaLink,
          iconColor: "text-cyan-600",
        })) || []),
      ];
    }, [
      mentionSearchResults,
      allCollections,
      allResources,
      allEvents,
      allOrganizations,
      allVideos,
      allSocialMediaAccounts,
      chatData?.externalLinks,
      chatData?.linkGroups,
    ]);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const storedWhiteboard = window.localStorage.getItem(
        CHAT_WHITEBOARD_STORAGE_KEY,
      );
      if (storedWhiteboard) {
        setChatWhiteboardData(parseWhiteboardData(storedWhiteboard));
      }
    }, []);

    const whiteboardHasContent = useMemo(
      () => hasWhiteboardContent(chatWhiteboardData),
      [chatWhiteboardData],
    );
    const whiteboardSummary = useMemo(
      () => summarizeWhiteboardData(chatWhiteboardData),
      [chatWhiteboardData],
    );

    const whiteboardCollectionOptions = useMemo(() => {
      const byId = new Map();
      const addCollection = (item) => {
        if (!item) return;
        const id = item.id || item.collectionId;
        if (!id || byId.has(id)) return;
        byId.set(id, {
          id,
          label: getItemTitle(item),
        });
      };

      allCollections?.forEach(addCollection);
      chatData?.collections?.forEach(addCollection);
      selectedResources
        .filter((item) => item.type === "collection")
        .forEach(addCollection);
      mentionedItems
        .filter((item) => item.type === "collection")
        .forEach(addCollection);

      return Array.from(byId.values()).sort((a, b) =>
        a.label.localeCompare(b.label),
      );
    }, [allCollections, chatData?.collections, selectedResources, mentionedItems]);

    const whiteboardExternalLinkOptions = useMemo(() => {
      const byId = new Map();
      const addExternalLink = (item) => {
        if (!item) return;
        const id = item.externalLinkId || item.id;
        const isExternalLink =
          item.type === "external_link" ||
          item.type === "link" ||
          Boolean(item.externalLinkId);
        if (!id || !isExternalLink || byId.has(id)) return;
        byId.set(id, {
          id,
          label: getItemTitle(item),
        });
      };

      chatData?.externalLinks?.forEach(addExternalLink);
      selectedResources.forEach(addExternalLink);
      mentionedItems.forEach(addExternalLink);

      return Array.from(byId.values()).sort((a, b) =>
        a.label.localeCompare(b.label),
      );
    }, [chatData?.externalLinks, selectedResources, mentionedItems]);

    useEffect(() => {
      if (!whiteboardCollectionId && whiteboardCollectionOptions.length > 0) {
        setWhiteboardCollectionId(whiteboardCollectionOptions[0].id);
      }
    }, [whiteboardCollectionId, whiteboardCollectionOptions]);

    useEffect(() => {
      if (!whiteboardExternalLinkId && whiteboardExternalLinkOptions.length > 0) {
        setWhiteboardExternalLinkId(whiteboardExternalLinkOptions[0].id);
      }
    }, [whiteboardExternalLinkId, whiteboardExternalLinkOptions]);

    // Auto scroll to bottom when new messages arrive
    // useEffect(() => {
    //   chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    // }, [history]);

    // Add custom scrollbar styles
    useEffect(() => {
      const style = document.createElement("style");
      style.textContent = `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `;
      document.head.appendChild(style);
      return () => document.head.removeChild(style);
    }, []);

    // Handle @ mention detection and dropdown positioning
    const handleTextareaChange = (e) => {
      const value = e.target.value;
      const cursorPos = e.target.selectionStart;

      setQuery(value);
      setCursorPosition(cursorPos);

      // Check for @ mention - allow spaces within mentions but close on double space or when @ is followed by another @
      const textBeforeCursor = value.substring(0, cursorPos);

      // Check if we're in the middle of typing a mention
      const simpleMentionMatch = textBeforeCursor.match(/@([^@]*)$/);

      if (simpleMentionMatch && !simpleMentionMatch[1].endsWith("  ")) {
        const searchTerm = simpleMentionMatch[1];

        // Check if this mention already exists in our mentioned items (completed mention)
        const isCompletedMention = mentionedItems.some((item) =>
          searchTerm.startsWith(item.title || item.name),
        );

        // If it's a completed mention being continued, don't show dropdown
        if (justSelectedMention || isCompletedMention) {
          setShowMentionDropdown(false);
          setJustSelectedMention(false); // Clear the flag since we handled it
          return;
        }

        setMentionQuery(searchTerm);
        setShowMentionDropdown(true);
        setSelectedMentionIndex(0); // Reset selection

        // Calculate dropdown position
        const textarea = e.target;
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        const computedStyle = window.getComputedStyle(textarea);
        context.font = computedStyle.font;

        const textWidth = context.measureText(textBeforeCursor).width;
        const rect = textarea.getBoundingClientRect();

        setMentionPosition({
          top: rect.top - 200,
          left: rect.left + Math.min(textWidth, rect.width - 200),
        });
      } else {
        setShowMentionDropdown(false);
        setMentionQuery("");
        setSelectedMentionIndex(0);
        setJustSelectedMention(false); // Clear the flag when no mention is detected
      }
    };

    // Filter mention items based on search query
    const getFilteredMentionItems = () => {
      if (!mentionQuery) {
        return mentionItems.slice(0, 10);
      }

      return mentionItems
        .filter((item) =>
          (item.title || item.name || "")
            .toLowerCase()
            .includes(mentionQuery.toLowerCase()),
        )
        .slice(0, 10);
    };

    // Handle mention item selection
    const handleMentionSelect = (item, index = null) => {
      const textBeforeCursor = query.substring(0, cursorPosition);
      const textAfterCursor = query.substring(cursorPosition);

      // Find the @ symbol position with regex that allows spaces (consistent with detection)
      const mentionMatch = textBeforeCursor.match(/(.*)@([^@]*)$/);

      if (mentionMatch) {
        const beforeMention = mentionMatch[1];
        const mentionText = `@${item.title || item.name}`;
        const newQuery = beforeMention + mentionText + " " + textAfterCursor;

        // Close dropdown immediately and set flag to prevent reopening
        setShowMentionDropdown(false);
        setMentionQuery("");
        setSelectedMentionIndex(0);
        setJustSelectedMention(true);

        setQuery(newQuery);

        // Add to mentioned items - make sure we don't add duplicates
        setMentionedItems((prev) => {
          const exists = prev.find((existing) => existing.id === item.id);
          if (!exists) {
            return [...prev, item];
          }
          return prev;
        });

        // Position cursor after the mention
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPos = beforeMention.length + mentionText.length + 1;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            textareaRef.current.focus();
          }
        }, 0);
      } else {
        // Fallback: always close dropdown even if regex doesn't match
        setShowMentionDropdown(false);
        setMentionQuery("");
        setSelectedMentionIndex(0);
        setJustSelectedMention(true);
      }
    };

    // Handle "Select All" functionality for mentions
    const handleMentionSelectAll = () => {
      const filteredItems = getFilteredMentionItems();

      // Close dropdown immediately before making changes and set flag to prevent reopening
      setShowMentionDropdown(false);
      setMentionQuery("");
      setSelectedMentionIndex(0);
      setJustSelectedMention(true);

      // Add all filtered items to mentioned items
      setMentionedItems((prev) => {
        const newItems = [...prev];
        filteredItems.forEach((item) => {
          const exists = newItems.find((existing) => existing.id === item.id);
          if (!exists) {
            newItems.push(item);
          }
        });
        return newItems;
      });

      // Update the query to include all mentions
      const textBeforeCursor = query.substring(0, cursorPosition);
      const textAfterCursor = query.substring(cursorPosition);
      const mentionMatch = textBeforeCursor.match(/(.*)@([^@]*)$/);

      if (mentionMatch) {
        const beforeMention = mentionMatch[1];
        const mentionTexts = filteredItems
          .map((item) => `@${item.title || item.name}`)
          .join(" ");
        const newQuery = beforeMention + mentionTexts + " " + textAfterCursor;
        setQuery(newQuery);

        // Position cursor after all mentions
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPos = beforeMention.length + mentionTexts.length + 1;
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
            textareaRef.current.focus();
          }
        }, 0);
      }
    };

    // Handle keyboard navigation in mention dropdown
    const handleMentionKeyDown = (e) => {
      if (!showMentionDropdown) return;

      const filteredItems = getFilteredMentionItems();

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedMentionIndex((prev) =>
            prev < filteredItems.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedMentionIndex((prev) =>
            prev > 0 ? prev - 1 : filteredItems.length - 1,
          );
          break;
        case "Enter":
        case "Tab":
          e.preventDefault();
          if (filteredItems[selectedMentionIndex]) {
            handleMentionSelect(filteredItems[selectedMentionIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setShowMentionDropdown(false);
          setSelectedMentionIndex(0);
          break;
      }
    };

    // Close mention dropdown on outside click
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (showMentionDropdown && !event.target.closest(".mention-dropdown")) {
          setShowMentionDropdown(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [showMentionDropdown]);

    // Extract mentioned items from query text with improved regex
    const extractMentionedItems = (text) => {
      const mentionRegex = /@([^@\s]+(?:\s+[^@\s]+)*?)(?=\s|$|@)/g;
      const mentions = [];
      let match;

      while ((match = mentionRegex.exec(text)) !== null) {
        const mentionName = match[1].trim();

        // First check in mentionedItems state (recently selected items)
        let foundItem = mentionedItems.find(
          (item) => (item.title || item.name) === mentionName,
        );

        // If not found, check in mentionItems (fallback)
        if (!foundItem) {
          foundItem = mentionItems.find(
            (item) => (item.title || item.name) === mentionName,
          );
        }

        if (foundItem) {
          mentions.push(foundItem);
        }
      }

      return mentions;
    };

    // Clean query text by removing @ mentions
    const cleanQueryText = (text) => {
      return text
        .replace(/@[^@\s]+(?:\s+[^@\s]+)*?(?=\s|$|@)/g, "")
        .replace(/\s+/g, " ")
        .trim();
    };

    // Expose methods to parent through useImperativeHandle
    useImperativeHandle(ref, () => ({
      selectAllResources: (initialResources = [], mode = "replace") => {
        // If mode is 'append', add to existing selections
        // If mode is 'replace', replace all selections
        setSelectedResources((prev) => {
          const newResources =
            mode === "append"
              ? [...prev, ...initialResources]
              : initialResources;
          // Save to localStorage
          if (typeof window !== "undefined") {
            localStorage.setItem(
              "selectedResources",
              JSON.stringify(newResources),
            );
          }
          return newResources;
        });
      },
      setPrompt: (prompt) => {
        setQuery(prompt);
        // Optional: Auto-focus the textarea
        const textarea = document.querySelector("textarea");
        if (textarea) {
          textarea.focus();
        }
      },
    }));

    const handleResourceSelect = (resource) => {
      setSelectedResources((prev) => {
        const newResources = [...prev, resource];
        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "selectedResources",
            JSON.stringify(newResources),
          );
        }
        return newResources;
      });
    };

    const removeResource = (resourceId) => {
      setSelectedResources((prev) => {
        const newResources = prev.filter((r) => r.id !== resourceId);
        // Save to localStorage
        if (typeof window !== "undefined") {
          localStorage.setItem(
            "selectedResources",
            JSON.stringify(newResources),
          );
        }
        return newResources;
      });
    };

    // Helper function to normalize item structure (same as SearchModal)
    const normalizeItem = (item) => {
      const base = {
        ...item,
        id: item.id || item.externalLinkId || item.external_link_id,
        title: item.title || item.name,
        name: item.name || item.title,
        description: item.description || item.notes,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        type: item.type,
        url: item.url,
        notes: item.notes,
        date: item.date,
        startDate: item.startDate || item.start_date || item.date,
        endDate: item.endDate || item.end_date,
        startTime: item.startTime || item.start_time || item.time,
        endTime: item.endTime || item.end_time,
        timezone: item.timezone,
        collectionId: item.collectionId || item.collection_id,
        collectionExternalLinkId:
          item.collectionExternalLinkId || item.collection_external_link_id,
        sourceCollectionId: item.sourceCollectionId || item.source_collection_id,
        sourceCollectionName:
          item.sourceCollectionName || item.source_collection_name,
        workflowMetadata: item.workflowMetadata || item.workflow_metadata,
        durationValue: item.durationValue || item.duration_value || null,
        durationUnit: item.durationUnit || item.duration_unit || null,
      };

      // Handle different item types
      switch (item.type) {
        case "external_link":
          return {
            ...base,
            content: item.content,
            status: item.status,
            category: item.category,
            visibility: item.visibility,
            highlighted: item.highlighted,
            hashtags: item.hashtags,
            imageUrl: item.imageUrl || item.image_url,
            imageMetadata: item.imageMetadata || item.image_metadata,
            whiteboardData: item.whiteboardData || item.whiteboard_data,
          };
        case "collection":
          return {
            ...base,
            visibility: item.visibility,
            status: item.status,
            icon: item.icon,
            color: item.color,
            resource_count: item.resource_count,
            is_pinned: item.is_pinned,
            workflowMetadata: item.workflowMetadata || item.workflow_metadata,
          };
        case "notation":
          return {
            ...base,
            category: item.category,
            status: item.status,
            highlighted: item.highlighted,
            visibility: item.visibility,
            parentId: item.externalLinkId, // Use externalLinkId as parentId for navigation
            externalLinkId: item.externalLinkId,
            notes: item.notes,
          };
        default:
          return base;
      }
    };

    const handleCopy = async (content) => {
      try {
        const formattedContent = formatForCopy(content);

        // Create a temporary element with the formatted content
        const tempElement = document.createElement("div");
        tempElement.innerHTML = formattedContent.html;

        // Try to use the new clipboard API for rich text
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([formattedContent.plain], {
              type: "text/plain",
            }),
            "text/html": new Blob([tempElement.innerHTML], {
              type: "text/html",
            }),
          }),
        ]);

        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        // Fallback to plain text
        await navigator.clipboard.writeText(formatForCopy(content).plain);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    };

    const formatForCopy = (content) => {
      // First pass: preserve markdown links before other transformations
      let processedContent = content;
      const links = [];

      // Extract and store markdown links
      processedContent = processedContent.replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        (match, text, url) => {
          links.push({ text, url });
          return `__LINK${links.length - 1}__`; // Placeholder
        },
      );

      // Also handle plain URLs with angle brackets
      processedContent = processedContent.replace(
        /<(https?:\/\/[^>]+)>/g,
        (match, url) => {
          links.push({ text: url, url });
          return `__LINK${links.length - 1}__`;
        },
      );

      processedContent = processedContent.replace(
        /(?<!\n)\*\*([^*]+:)\*\*/g,
        (match, text) => {
          return `\n**${text}**`;
        },
      );

      // Add an extra newline after bold text with colons
      processedContent = processedContent.replace(
        /\*\*([^*]+:)\*\*/g,
        (match) => {
          return `${match}\n`;
        },
      );

      // Convert markdown links to rich text format while preserving structure
      const formattedContent = processedContent
        // Preserve numbered lists
        .replace(/^\d+\.\s/gm, (match) => match)
        // Preserve bullet points
        .replace(/^\*\s/gm, "• ")
        // Convert bold text
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        // Convert italic text
        .replace(/\*([^*]+)\*/g, "$1")
        // Restore links with proper formatting
        .replace(/__LINK(\d+)__/g, (match, index) => {
          const link = links[parseInt(index)];
          return `${link.text} (${link.url})`;
        })
        // Preserve line breaks
        .replace(/\n/g, "\r\n")
        .trim();

      return {
        plain: formattedContent,
        html: `
        <div style="
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.5;
        ">
          ${processedContent
            .split("\n")
            .map((line) => {
              // Convert bold text to HTML
              line = line.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
              // Convert italic text to HTML
              line = line.replace(/\*([^*]+)\*/g, "<em>$1</em>");
              // Restore links with HTML formatting
              line = line.replace(/__LINK(\d+)__/g, (match, index) => {
                const link = links[parseInt(index)];
                return `<a href="${link.url}" style="color: #2563eb; text-decoration: underline;">${link.text}</a>`;
              });

              if (line.startsWith("• ")) {
                return `<li>${line.substring(2)}</li>`;
              }
              if (/^\d+\.\s/.test(line)) {
                return `<li>${line}</li>`;
              }

              // If it's an empty line, return a spacer with more height
              if (!line.trim()) {
                return `<div style="height: 1em"></div>`;
              }

              return `<p>${line}</p>`;
            })
            .join("")}
        </div>
      `,
      };
    };

    const handleChatWhiteboardSave = async (whiteboardData) => {
      setChatWhiteboardData(whiteboardData);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          CHAT_WHITEBOARD_STORAGE_KEY,
          JSON.stringify(whiteboardData),
        );
      }
    };

    const getWhiteboardAttachmentSummary = () => ({
      collections:
        attachWhiteboardToCollection && whiteboardCollectionId
          ? [
              whiteboardCollectionOptions.find(
                (item) => item.id === whiteboardCollectionId,
              ) || { id: whiteboardCollectionId, label: "Selected collection" },
            ]
          : [],
      externalLinks:
        attachWhiteboardToExternalLink && whiteboardExternalLinkId
          ? [
              whiteboardExternalLinkOptions.find(
                (item) => item.id === whiteboardExternalLinkId,
              ) || {
                id: whiteboardExternalLinkId,
                label: "Selected external link",
              },
            ]
          : [],
    });

    const getActiveWhiteboardChatPayload = () => {
      if (!includeWhiteboardInChat || !whiteboardHasContent) return null;
      return buildWhiteboardChatPayload(
        chatWhiteboardData,
        getWhiteboardAttachmentSummary(),
      );
    };

    const handleSaveWhiteboardAttachments = async () => {
      if (!whiteboardHasContent) {
        toast.error("Add something to the whiteboard before saving it");
        return;
      }

      if (!attachWhiteboardToCollection && !attachWhiteboardToExternalLink) {
        toast.error("Choose a collection or external link to attach it to");
        return;
      }

      if (attachWhiteboardToCollection && !whiteboardCollectionId) {
        toast.error("Choose a collection for the whiteboard");
        return;
      }

      if (attachWhiteboardToExternalLink && !whiteboardExternalLinkId) {
        toast.error("Choose an external link for the whiteboard");
        return;
      }

      setIsSavingWhiteboardAttachments(true);
      try {
        const headers = await authContext?.getAuthHeader?.();
        if (!headers) {
          throw new Error("Missing authentication headers");
        }

        const saves = [];
        if (attachWhiteboardToCollection) {
          saves.push(
            updateCollection(
              whiteboardCollectionId,
              { whiteboardData: chatWhiteboardData },
              headers,
            ),
          );
        }
        if (attachWhiteboardToExternalLink) {
          saves.push(
            updateExternalLinkWhiteboard(
              whiteboardExternalLinkId,
              chatWhiteboardData,
              headers,
            ),
          );
        }

        await Promise.all(saves);
        toast.success("Whiteboard attached");
      } catch (error) {
        console.error("Failed to attach whiteboard:", error);
        toast.error(error?.message || "Failed to attach whiteboard");
      } finally {
        setIsSavingWhiteboardAttachments(false);
      }
    };

    const handleWorkflowSuggestionReview = (suggestion) => {
      if (!onOpenWorkflowPlanner) return;
      if (!whiteboardHasContent) {
        onOpenWorkflowPlanner(suggestion);
        return;
      }

      setAttachWhiteboardToWorkflowProject(true);
      setPendingWorkflowSuggestion(suggestion);
    };

    const continueWorkflowSuggestion = (includeWhiteboard) => {
      const suggestion = pendingWorkflowSuggestion;
      if (!suggestion) return;

      if (includeWhiteboard) {
        onOpenWorkflowPlanner?.({
          ...suggestion,
          whiteboardAttachment: {
            whiteboardData: chatWhiteboardData,
            summary: whiteboardSummary,
            attachToProject: attachWhiteboardToWorkflowProject,
            attachments: getWhiteboardAttachmentSummary(),
          },
        });
      } else {
        onOpenWorkflowPlanner?.(suggestion);
      }

      setPendingWorkflowSuggestion(null);
    };

    const getCollectionPlanEntryKey = (entry) =>
      String(
        entry?.id ||
          entry?.timestamp ||
          entry?.collectionPlanSuggestion?.prompt ||
          "collection-plan",
      );

    const getCollectionPlanItemIds = (items = []) =>
      items.map((item) => item?.id).filter(Boolean);

    const getDefaultCollectionPlanSelection = (suggestion = {}) => ({
      externalLinkIds: getCollectionPlanItemIds(suggestion.externalLinks || []),
      collectionIds: getCollectionPlanItemIds(suggestion.collections || []),
      templateIds: getCollectionPlanItemIds(suggestion.templates || []),
    });

    const getCollectionPlanSelectionForEntry = (entry) => {
      const key = getCollectionPlanEntryKey(entry);
      return (
        collectionPlanSelections[key] ||
        getDefaultCollectionPlanSelection(entry?.collectionPlanSuggestion)
      );
    };

    const toggleCollectionPlanOption = (entry, optionType, itemId) => {
      if (!itemId) return;
      const key = getCollectionPlanEntryKey(entry);
      const fieldByType = {
        externalLink: "externalLinkIds",
        collection: "collectionIds",
        template: "templateIds",
      };
      const field = fieldByType[optionType];
      if (!field) return;

      setCollectionPlanSelections((prev) => {
        const current =
          prev[key] ||
          getDefaultCollectionPlanSelection(entry?.collectionPlanSuggestion);
        const nextIds = new Set(current[field] || []);

        if (nextIds.has(itemId)) {
          nextIds.delete(itemId);
        } else {
          nextIds.add(itemId);
        }

        return {
          ...prev,
          [key]: {
            ...current,
            [field]: Array.from(nextIds),
          },
        };
      });
    };

    const buildSelectedCollectionPlanSuggestion = (entry) => {
      const suggestion = entry?.collectionPlanSuggestion;
      if (!suggestion) return null;

      const selection = getCollectionPlanSelectionForEntry(entry);
      const selectedExternalLinkIds = new Set(selection.externalLinkIds || []);
      const selectedCollectionIds = new Set(selection.collectionIds || []);
      const selectedTemplateIds = new Set(selection.templateIds || []);
      const selectedExternalLinks = (suggestion.externalLinks || []).filter((item) =>
        selectedExternalLinkIds.has(item.id),
      );
      const selectedCollections = (suggestion.collections || []).filter((item) =>
        selectedCollectionIds.has(item.id),
      );
      const selectedTemplates = (suggestion.templates || []).filter((item) =>
        selectedTemplateIds.has(item.id),
      );

      return {
        ...suggestion,
        collections: selectedCollections,
        templates: selectedTemplates,
        selectedExternalLinks,
        resources: [],
        selectedExternalLinkIds: Array.from(selectedExternalLinkIds),
        selectedCollectionIds: Array.from(selectedCollectionIds),
        selectedTemplateIds: Array.from(selectedTemplateIds),
      };
    };

    const handleCollectionPlanSuggestionReview = (suggestion) => {
      if (!onOpenCollectionPlan) return;
      if (!whiteboardHasContent) {
        onOpenCollectionPlan(suggestion);
        return;
      }

      setAttachWhiteboardToWorkflowProject(true);
      setPendingCollectionPlanSuggestion(suggestion);
    };

    const continueCollectionPlanSuggestion = (includeWhiteboard) => {
      const suggestion = pendingCollectionPlanSuggestion;
      if (!suggestion) return;

      if (includeWhiteboard) {
        onOpenCollectionPlan?.({
          ...suggestion,
          whiteboardAttachment: {
            whiteboardData: chatWhiteboardData,
            summary: whiteboardSummary,
            attachToProject: attachWhiteboardToWorkflowProject,
            attachments: getWhiteboardAttachmentSummary(),
          },
        });
      } else {
        onOpenCollectionPlan?.(suggestion);
      }

      setPendingCollectionPlanSuggestion(null);
    };

    const normalizeCartType = (type) =>
      type === "link" || type === "externalLink"
        ? "external_link"
        : type === "workflow_template"
          ? "collection"
          : type;

    const getCollectionCartItemKey = (item = {}) => {
      const type = normalizeCartType(item.type || item.originalType || "item");
      const id =
        item.selectionKey ||
        item.collectionExternalLinkId ||
        item.collection_external_link_id ||
        item.externalLinkId ||
        item.external_link_id ||
        item.collectionId ||
        item.collection_id ||
        item.id ||
        stripHtmlToText(item.title || item.name || item.label || "");

      return `${type}:${id}`;
    };

    const isTemplateCollectionItem = (item = {}) => {
      const metadata = item.workflowMetadata || item.workflow_metadata || {};
      const kind = String(metadata.kind || "").toLowerCase();
      return (
        kind === "template" ||
        kind === "workflow_template" ||
        item.originalType === "workflow_template" ||
        item.type === "workflow_template"
      );
    };

    const normalizeCollectionCartItem = (item = {}) => {
      const type = normalizeCartType(item.type);
      if (!["collection", "external_link", "resource"].includes(type)) return null;

      const title =
        stripHtmlToText(item.title || item.name || item.label || item.url || "") ||
        (type === "collection"
          ? "Untitled collection"
          : type === "resource"
            ? "Untitled resource"
            : "Untitled external link");
      const description = getItemDescription(item);

      return {
        ...item,
        originalType: item.originalType || item.type,
        type,
        id:
          item.id ||
          item.externalLinkId ||
          item.external_link_id ||
          item.collectionId ||
          item.collection_id ||
          title,
        title,
        name: item.name || title,
        description,
        notes: stripHtmlToText(item.notes || ""),
        url: item.url || "",
        date: item.date || item.startDate || item.start_date || null,
        startDate: item.startDate || item.start_date || item.date || null,
        endDate: item.endDate || item.end_date || item.startDate || item.date || null,
        startTime: item.startTime || item.start_time || item.time || null,
        endTime: item.endTime || item.end_time || null,
        timezone: item.timezone || null,
        collectionId: item.collectionId || item.collection_id || null,
        collectionExternalLinkId:
          item.collectionExternalLinkId || item.collection_external_link_id || null,
        sourceCollectionId: item.sourceCollectionId || item.source_collection_id || null,
        sourceCollectionName:
          item.sourceCollectionName || item.source_collection_name || null,
        workflowMetadata: item.workflowMetadata || item.workflow_metadata || {},
        durationValue: item.durationValue || item.duration_value || null,
        durationUnit: item.durationUnit || item.duration_unit || null,
        isTemplate: type === "collection" ? isTemplateCollectionItem(item) : false,
      };
    };

    const addToCollectionCart = (itemOrItems) => {
      const normalizedItems = (Array.isArray(itemOrItems) ? itemOrItems : [itemOrItems])
        .map(normalizeCollectionCartItem)
        .filter(Boolean);

      if (normalizedItems.length === 0) {
        toast.error("Only collections, external links, and resources can be added");
        return;
      }

      const existingKeys = new Set(collectionCartItems.map(getCollectionCartItemKey));
      const newItems = normalizedItems.filter(
        (item) => !existingKeys.has(getCollectionCartItemKey(item)),
      );

      if (newItems.length === 0) {
        toast("Already in collection cart");
        return;
      }

      setCollectionCartItems((prev) => {
        const seen = new Set(prev.map(getCollectionCartItemKey));
        const next = [...prev];
        newItems.forEach((item) => {
          const key = getCollectionCartItemKey(item);
          if (!seen.has(key)) {
            seen.add(key);
            next.push(item);
          }
        });
        return next;
      });

      toast.success(
        newItems.length === 1
          ? "Added to collection cart"
          : `${newItems.length} items added to collection cart`,
      );
    };

    const removeFromCollectionCart = (item) => {
      const key = getCollectionCartItemKey(item);
      setCollectionCartItems((prev) =>
        prev.filter((cartItem) => getCollectionCartItemKey(cartItem) !== key),
      );
    };

    const clearCollectionCart = () => {
      setCollectionCartItems([]);
      toast.success("Collection cart cleared");
    };

    const handleCheckoutCollectionCart = () => {
      if (!onOpenCollectionPlan) {
        toast.error("Collection builder is not available here");
        return;
      }

      const cartItems = collectionCartItems
        .map(normalizeCollectionCartItem)
        .filter(Boolean);
      if (cartItems.length === 0) {
        toast.error("Add at least one external link or collection first");
        return;
      }

      const collections = cartItems.filter((item) => item.type === "collection");
      const externalLinks = cartItems.filter(
        (item) => item.type === "external_link",
      );
      const resources = cartItems.filter((item) => item.type === "resource");
      const promptText =
        stripHtmlToText(query || "") ||
        stripHtmlToText(history?.at(-1)?.prompt || "") ||
        "Collection from chat";

      handleCollectionPlanSuggestionReview({
        prompt: promptText,
        title: "Collection from chat",
        summary: `${collections.length} collection${
          collections.length === 1 ? "" : "s"
        }, ${externalLinks.length} external link${
          externalLinks.length === 1 ? "" : "s"
        }, and ${resources.length} resource${
          resources.length === 1 ? "" : "s"
        } selected from chat.`,
        source: "chat_collection_cart",
        collections,
        templates: collections.filter(isTemplateCollectionItem),
        resources,
        selectedResources: resources,
        externalLinks,
        selectedExternalLinks: externalLinks,
      });
    };

    const handleSendMessage = async () => {
      if (!query.trim() || isLoading) return;

      // Test case: Show modal directly if user types "insufficient credits test"
      if (query.toLowerCase().trim() === "insufficient credits test") {
        setIsLoading(true);
        // Add user message to history
        const userMessage = {
          id: Date.now().toString(),
          prompt: query,
          isUser: true,
        };
        const updatedHistory = [...history, userMessage];
        onChatComplete(updatedHistory);

        // Simulate AI response with insufficient credits message
        setTimeout(() => {
          const aiResponse = {
            id: (Date.now() + 1).toString(),
            answer:
              "Insufficient credits, please purchase more to continue using AI chat.",
            isUser: false,
            timestamp: Date.now(),
          };
          onChatComplete([...updatedHistory, aiResponse]);
          setShowInsufficientCreditsModal(true);
          setIsLoading(false);
          setQuery("");
        }, 1000);
        return;
      }

      // Use mentioned items from state instead of extracting from text
      const cleanQuery = cleanQueryText(query);

      // Determine if we should use mentions or regular selected resources
      const usesMentions = mentionedItems.length > 0;
      const itemsToUse = usesMentions ? mentionedItems : selectedResources;
      const whiteboardPayload = getActiveWhiteboardChatPayload();

      if (onBeforeSend) {
        let handled = false;
        setIsLoading(true);
        try {
          handled = await onBeforeSend({
            query,
            cleanQuery,
            selectedResources: itemsToUse,
            mentionedItems,
            whiteboard: whiteboardPayload,
          });

          if (handled) {
            setQuery("");
            setMentionedItems([]);
            return;
          }
        } catch (error) {
          console.error("Before-send handler failed:", error);
          toast.error("Failed to handle message");
          return;
        } finally {
          setIsLoading(false);
        }
      }

      const totalTokens = estimateTokenCount(
        JSON.stringify({
          resources: itemsToUse,
          prompt: cleanQuery,
          userInfo: getUserInfoString(customUserData, includeUserInfo),
          whiteboard: whiteboardPayload,
        }),
      );

      if (totalTokens > 900000) {
        toast.error("Token limit exceeded (900,000 max)");
        return;
      }

      setIsLoading(true);

      try {
        const userInfo = getUserInfoString(customUserData, includeUserInfo);
        const fullPrompt = `${
          userInfo ? userInfo + " " : ""
        }Question: ${cleanQuery}`;

        const matchedChildAttachments = itemsToUse
          .filter((item) => item.type === "resource")
          .flatMap((item) => item.matchedChildren?.attachments || []);

        const matchedChildLinkGroups = itemsToUse
          .filter((item) => item.type === "resource")
          .flatMap((item) => item.matchedChildren?.linkGroups || []);

        // Check if we should use vector search (from user profile submission)
        const shouldUseVectorSearch = customUserData?.useVectorSearch;

        const payload = shouldUseVectorSearch
          ? {
              // For vector search submissions, send empty arrays and let backend handle item selection
              collections: [],
              externalLinks: [],
              resources: [],
              events: [],
              organizations: [],
              videos: [],
              notations: [],
              attachments: [],
              socialMediaAccounts: [],
              whiteboards: whiteboardPayload ? [whiteboardPayload] : [],
              whiteboardContext: whiteboardPayload?.summary,
              prompt: fullPrompt,
              useVectorSearch: true,
              userProfileData: customUserData, // Include user profile data for context
            }
          : {
              collections: itemsToUse
                .filter((r) => r.type === "collection")
                .map((r) => r.id),
              externalLinks: itemsToUse
                .filter((r) => r.type === "link" || r.type === "external_link")
                .map((r) => r.id),
              resources: itemsToUse
                .filter((r) => r.type === "resource")
                .map((r) => r.id),
              events: itemsToUse
                .filter((r) => r.type === "event")
                .map((r) => r.id),
              organizations: itemsToUse
                .filter((r) => r.type === "organization")
                .map((r) => r.id),
              videos: itemsToUse
                .filter((r) => r.type === "video")
                .map((r) => r.id),
              // Add support for notations and other content types from search
              notations: itemsToUse
                .filter((r) => r.type === "notation")
                .map((r) => r.id),
              // Add any other content types that might come from search
              attachments: itemsToUse
                .filter((r) => r.type === "attachment")
                .map((r) => r.id)
                .concat(matchedChildAttachments.map((r) => r.id)),
              linkGroups: itemsToUse
                .filter((r) => r.type === "link_group")
                .map((r) => r.id)
                .concat(matchedChildLinkGroups.map((r) => r.id)),
              socialMediaAccounts: itemsToUse
                .filter((r) => r.type === "social_media_account")
                .map((r) => r.id),
              whiteboards: whiteboardPayload ? [whiteboardPayload] : [],
              whiteboardContext: whiteboardPayload?.summary,
              prompt: fullPrompt,
              // Disable RAG when we have specific items selected (either mentions or resources)
              disableRAG: usesMentions || selectedResources.length > 0,
              mentionedItems: usesMentions ? mentionedItems : undefined,
            };

        const response = await aiChat.mutateAsync({
          prompt: fullPrompt,
          history,
          data: payload,
        });

        // Check if response contains "insufficient credits" message
        if (
          typeof response?.answer === "string" &&
          response.answer.toLowerCase().includes("insufficient credits") &&
          response.answer.toLowerCase().includes("please purchase more")
        ) {
          setShowInsufficientCreditsModal(true);
        }

        // Add timestamp to the response before passing it up
        const responseWithTimestamp = {
          ...response,
          timestamp: Date.now(),
        };

        onChatComplete(responseWithTimestamp);
        setQuery("");
        setMentionedItems([]); // Clear mentioned items after sending
        // Keep the selected resources for the next message
      } catch (error) {
        console.error("Chat error:", error);
        toast.error("Failed to send message");
      } finally {
        setIsLoading(false);
      }
    };

    const handleSearchToggle = (type) => {
      if (searchType === type) {
        setShowSearchResults(false);
        setSearchType(null);
        setSearchResults([]);
      } else {
        setShowSearchResults(true);
        setSearchType(type);
        switch (type) {
          case "events":
            setSearchResults(allEvents);
            break;
          case "resources":
            setSearchResults(allResources);
            break;
          case "collections":
            setSearchResults(allCollections);
            break;
          case "organizations":
            setSearchResults(allOrganizations);
            break;
          case "videos":
            setSearchResults(allVideos);
            break;
          case "socialMediaAccounts":
            setSearchResults(allSocialMediaAccounts);
            break;
        }
      }
    };

    // Add helper functions to check if all items of a type are selected
    const areAllItemsOfTypeSelected = (items, type) => {
      const selectedOfType = selectedResources.filter((r) => r.type === type);
      return items.length > 0 && selectedOfType.length === items.length;
    };

    // Get consolidated chips data
    const getConsolidatedChips = () => {
      const chips = [];

      if (areAllItemsOfTypeSelected(allEvents, "event")) {
        chips.push({
          id: "all-events",
          type: "event",
          label: "All Events",
          count: allEvents.length,
        });
      }

      if (areAllItemsOfTypeSelected(allResources, "resource")) {
        chips.push({
          id: "all-resources",
          type: "resource",
          label: "All Resources",
          count: allResources.length,
        });
      }

      if (areAllItemsOfTypeSelected(allCollections, "collection")) {
        chips.push({
          id: "all-collections",
          type: "collection",
          label: "All Collections",
          count: allCollections.length,
        });
      }

      if (areAllItemsOfTypeSelected(allOrganizations, "organization")) {
        chips.push({
          id: "all-organizations",
          type: "organization",
          label: "All Business Units",
          count: allOrganizations.length,
        });
      }

      if (areAllItemsOfTypeSelected(allVideos, "video")) {
        chips.push({
          id: "all-videos",
          type: "video",
          label: "All Videos",
          count: allVideos.length,
        });
      }

      if (
        areAllItemsOfTypeSelected(
          allSocialMediaAccounts,
          "social_media_account",
        )
      ) {
        chips.push({
          id: "all-social-media",
          type: "social_media_account",
          label: "All Social Media",
          count: allSocialMediaAccounts.length,
        });
      }

      // Add individual items that aren't part of an "all" group
      selectedResources.forEach((resource) => {
        if (
          !areAllItemsOfTypeSelected(
            resource.type === "event"
              ? allEvents
              : resource.type === "resource"
                ? allResources
                : resource.type === "organization"
                  ? allOrganizations
                  : resource.type === "video"
                    ? allVideos
                    : resource.type === "social_media_account"
                      ? allSocialMediaAccounts
                      : allCollections,
            resource.type,
          )
        ) {
          chips.push(resource);
        }
      });

      return chips;
    };

    const getFilteredResults = () => {
      if (!searchFilter.trim()) return searchResults;

      return searchResults.filter((item) =>
        (item.title || item.name || "")
          .toLowerCase()
          .includes(searchFilter.toLowerCase()),
      );
    };

    const handleBulkSelection = (selectAll = true) => {
      if (selectAll) {
        // Add all filtered items that aren't already selected
        const filteredItems = getFilteredResults();
        const newItems = filteredItems
          .filter(
            (item) =>
              !selectedResources.some((selected) => selected.id === item.id),
          )
          .map((item) => ({
            ...item,
            type: searchType.slice(0, -1),
          }));

        setSelectedResources((prev) => [...prev, ...newItems]);
      } else {
        // Remove all items of current type
        setSelectedResources((prev) =>
          prev.filter((resource) => resource.type !== searchType.slice(0, -1)),
        );
      }
    };

    // Add this new function to format user details
    const getUserDetailsContent = () => {
      if (!customUserData) return null;

      const details = [];
      if (customUserData.userRole)
        details.push({ label: "Role", value: customUserData.userRole });
      if (customUserData.designation)
        details.push({
          label: "Designation",
          value: customUserData.designation,
        });
      if (customUserData.yearOfBirth) {
        const age = new Date().getFullYear() - customUserData.yearOfBirth;
        details.push({ label: "Age", value: age });
      }
      if (customUserData.cancerType)
        details.push({
          label: "Cancer Type",
          value: customUserData.cancerType,
        });
      if (customUserData.promptContext)
        details.push({
          label: "Additional Context",
          value: customUserData.promptContext,
        });

      return details;
    };

    const handleUserIconClick = () => {
      const currentTime = new Date().getTime();
      const isDoubleClick = currentTime - lastClickTime < 300; // 300ms threshold for double click

      // Always toggle includeUserInfo on any click
      setIncludeUserInfo(!includeUserInfo);

      // Show details on double click for both mobile and desktop
      if (isDoubleClick) {
        setShowUserDetails(true);
      }
      setLastClickTime(currentTime);
    };

    const handlePinItems = async (items) => {
      try {
        // Check if any of the items have the isPinned flag set by ReferencedItems component
        const itemsToProcess = items.map((item) => {
          // If item has the isPinned flag, this means it's a toggle operation
          if (item.isPinned) {
            // For unpinning, find the pinnedItemId in the pinnedItems array
            const pinnedItemEntry = pinnedItems.find(
              (p) => p.pinnedItemId === item.id || p.id === item.id,
            );
            return {
              ...item,
              action: "unpin",
              pinnedItemId: pinnedItemEntry?.id,
            };
          } else {
            // For pinning, just pass the item as is
            return { ...item, action: "pin" };
          }
        });

        await pinItemsMutation.mutateAsync(itemsToProcess).then(() => {
          // More specific message based on action
          const pinningItems = itemsToProcess.filter((i) => i.action === "pin");
          const unpinningItems = itemsToProcess.filter(
            (i) => i.action === "unpin",
          );

          if (pinningItems.length && unpinningItems.length) {
            toast.success("Pin status updated successfully");
          } else if (pinningItems.length) {
            toast.success(
              pinningItems.length === 1
                ? `${
                    pinningItems[0].title || pinningItems[0].name || "Item"
                  } pinned`
                : `${pinningItems.length} items pinned`,
            );
          } else if (unpinningItems.length) {
            toast.success(
              unpinningItems.length === 1
                ? `${
                    unpinningItems[0].title || unpinningItems[0].name || "Item"
                  } unpinned`
                : `${unpinningItems.length} items unpinned`,
            );
          }
        });
      } catch (error) {
        console.error("Error updating pin status:", error);
        toast.error("Failed to update pin status");
      }
    };

    // Add click outside handler for both mobile and desktop
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (showUserDetails) {
          const tooltip = document.querySelector(".user-details-tooltip");
          const userIcon = document.querySelector(".user-icon-button");
          if (
            tooltip &&
            !tooltip.contains(event.target) &&
            !userIcon.contains(event.target)
          ) {
            setShowUserDetails(false);
          }
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);

      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, [showUserDetails]);

    const renderCollectionPlanSuggestionCard = (entry) => {
      const suggestion = entry.collectionPlanSuggestion;
      if (!suggestion) return null;

      const selection = getCollectionPlanSelectionForEntry(entry);
      const selectedExternalLinkIds = new Set(selection.externalLinkIds || []);
      const selectedCollectionIds = new Set(selection.collectionIds || []);
      const selectedTemplateIds = new Set(selection.templateIds || []);
      const visibleCollections = (suggestion.collections || []).slice(0, 3);
      const visibleExternalLinks = (suggestion.externalLinks || []).slice(0, 4);
      const selectedExternalLinks = (suggestion.externalLinks || []).filter((item) =>
        selectedExternalLinkIds.has(item.id),
      );
      const selectedCollections = (suggestion.collections || []).filter((item) =>
        selectedCollectionIds.has(item.id),
      );
      const selectedTemplates = (suggestion.templates || []).filter((item) =>
        selectedTemplateIds.has(item.id),
      );
      const selectedTotal =
        selectedExternalLinks.length +
        selectedCollections.length +
        selectedTemplates.length;

      return (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/80 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                <FaFolder className="h-4 w-4 flex-shrink-0" />
                <span>Project collection starter</span>
              </div>
              <h3 className="mt-1 line-clamp-2 text-base font-semibold text-gray-900">
                {stripHtmlToText(suggestion.title || "") ||
                  "Suggested collection plan"}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-700">
                {stripHtmlToText(suggestion.summary || suggestion.reason || "")}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                {suggestion.templates?.length > 0 && (
                  <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1">
                    {suggestion.templates.length} template
                    {suggestion.templates.length === 1 ? "" : "s"}
                  </span>
                )}
                {suggestion.collections?.length > 0 && (
                  <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1">
                    {selectedCollections.length} of{" "}
                    {suggestion.collections.length} collection
                    {suggestion.collections.length === 1 ? "" : "s"} selected
                  </span>
                )}
                {suggestion.externalLinks?.length > 0 && (
                  <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1">
                    {selectedExternalLinks.length} of{" "}
                    {suggestion.externalLinks.length} external link
                    {suggestion.externalLinks.length === 1 ? "" : "s"} selected
                  </span>
                )}
              </div>

              {visibleCollections.length === 0 &&
                visibleExternalLinks.length === 0 && (
                  <div className="mt-3 rounded-lg border border-dashed border-blue-200 bg-white/70 px-3 py-3 text-sm text-gray-600">
                    No items are preselected yet. Open the builder to search
                    external links and inspect matching collections.
                  </div>
                )}

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {visibleCollections.map((item) => {
                  const selected = selectedCollectionIds.has(item.id);

                  return (
                    <label
                      key={`plan-collection-${item.id}`}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition-colors ${
                        selected
                          ? "border-blue-100 bg-white"
                          : "border-gray-200 bg-white/70 opacity-60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleCollectionPlanOption(
                            entry,
                            "collection",
                            item.id,
                          )
                        }
                        className="mt-1 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="min-w-0">
                        <span className="block line-clamp-1 text-sm font-medium text-gray-800">
                          {getItemTitle(item)}
                        </span>
                        <span className="mt-1 block line-clamp-2 text-xs text-gray-500">
                          {getItemDescription(item, "Collection")}
                        </span>
                      </span>
                    </label>
                  );
                })}
                {visibleExternalLinks.map((item) => {
                  const selected = selectedExternalLinkIds.has(item.id);

                  return (
                    <label
                      key={`plan-external-link-${item.id}`}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2 transition-colors ${
                        selected
                          ? "border-blue-100 bg-white"
                          : "border-gray-200 bg-white/70 opacity-60"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleCollectionPlanOption(
                            entry,
                            "externalLink",
                            item.id,
                          )
                        }
                        className="mt-1 h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="min-w-0">
                        <span className="block line-clamp-1 text-sm font-medium text-gray-800">
                          {getItemTitle(item)}
                        </span>
                        <span className="mt-1 block line-clamp-2 text-xs text-gray-500">
                          {getItemDescription(item, "External link")}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-col gap-2 sm:items-end">
              <div className="text-xs font-medium text-blue-700">
                {selectedTotal > 0
                  ? `${selectedTotal} selected`
                  : "Choose items"}
              </div>
              <button
                type="button"
                onClick={() =>
                  handleCollectionPlanSuggestionReview(
                    buildSelectedCollectionPlanSuggestion(entry),
                  )
                }
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!onOpenCollectionPlan}
              >
                {selectedTotal > 0 ? "Build collection" : "Open builder"}
              </button>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div
        className="flex flex-col h-full bg-white rounded-3xl shadow-2xl border border-gray-200/50 overflow-hidden"
        data-custom-chat
      >
        {/* {showGuide && (
          <GuidedIndicator onComplete={() => setShowGuide(false)} />
        )} */}
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-gradient-to-b from-gray-50/50 to-white custom-scrollbar">
          {history?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="w-16 h-16 mb-6 rounded-full bg-blue-50 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-xl font-semibold text-gray-700 mb-2">
                Start a conversation
              </p>
              <p className="text-sm text-gray-500">
                Ask about resources, events, or business units
              </p>
            </div>
          ) : (
            history?.map((entry, index) => (
              <div key={entry.id} className="space-y-6">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-6 py-3.5 rounded-2xl rounded-tr-none max-w-[85%] shadow-lg">
                    <p className="text-[15px] leading-relaxed font-medium">
                      {(entry.prompt || "").replace(/^Question:\s*/i, "")}
                    </p>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex items-start gap-3 flex-col md:flex-row">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center shadow-lg ring-2 ring-white">
                    <span className="text-xs font-bold text-white">AI</span>
                  </div>
                  <div className="bg-white px-6 py-4 rounded-2xl rounded-tl-none w-full md:max-w-[85%] shadow-lg border border-gray-100 animate-fade-in-up">
                    <MessageContent
                      content={entry.answer}
                      timestamp={entry.timestamp}
                      enableTyping={
                        typingAnimationEnabled && index === history.length - 1
                      }
                      insufficient_credits={
                        entry.answer &&
                        entry.answer
                          .toLowerCase()
                          .includes("insufficient credits") &&
                        entry.answer
                          .toLowerCase()
                          .includes("please purchase more")
                      }
                    />

                    {!entry.collectionPlanSuggestion &&
                      entry.workflowTemplateSuggestion && (
                      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
                              <FaMagic className="h-4 w-4 flex-shrink-0" />
                              <span>Workflow template match</span>
                            </div>
                            <h3 className="mt-1 line-clamp-2 text-base font-semibold text-gray-900">
                              {entry.workflowTemplateSuggestion.title}
                            </h3>
                            <p className="mt-2 text-sm leading-6 text-gray-700">
                              {entry.workflowTemplateSuggestion.reason}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                              <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1">
                                {entry.workflowTemplateSuggestion.templates
                                  ?.length || 1}{" "}
                                candidate
                                {(entry.workflowTemplateSuggestion.templates
                                  ?.length || 1) === 1
                                  ? ""
                                  : "s"}
                              </span>
                              {entry.workflowTemplateSuggestion.externalLinksCount >
                                0 && (
                                <span className="rounded-full border border-blue-100 bg-white px-2.5 py-1">
                                  {
                                    entry.workflowTemplateSuggestion
                                      .externalLinksCount
                                  }{" "}
                                  attached resource
                                  {entry.workflowTemplateSuggestion
                                    .externalLinksCount === 1
                                    ? ""
                                    : "s"}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleWorkflowSuggestionReview(
                                entry.workflowTemplateSuggestion,
                              )
                            }
                            className="inline-flex flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={!onOpenWorkflowPlanner}
                          >
                            Review template
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Add Referenced Items */}
                    {(entry.referencedItems ||
                      (chatData &&
                        entry.id === history[history.length - 1].id)) && (
                      <ReferencedItems
                        items={[
                          // Include collections
                          ...(chatData?.collections?.map((collection) => ({
                            ...collection,
                            type: "collection",
                          })) || []),
                          // Include direct external links
                          ...(chatData?.externalLinks?.map((link) => ({
                            ...link,
                            type: "external_link",
                          })) || []),
                          // Include resources
                          ...(chatData?.resources?.map((resource) => ({
                            ...resource,
                            type: "resource",
                          })) || []),
                          // Include events
                          ...(chatData?.events?.map((event) => ({
                            ...event,
                            type: "event",
                          })) || []),
                          // Videos are placed first to give them priority
                          ...(chatData?.videos?.map((video) => ({
                            ...video,
                            type: "video",
                            priority: "high", // Add priority flag to videos
                          })) || []),
                          // Include direct attachments
                          ...(chatData?.attachments?.map((attachment) => ({
                            ...attachment,
                            type: "attachment",
                          })) || []),
                          ...(chatData?.linkGroups?.map((linkGroup) => ({
                            ...linkGroup,
                            type: "link_group",
                          })) || []),
                          // Include direct notations
                          ...(chatData?.notations?.map((notation) => ({
                            ...notation,
                            type: "notation",
                          })) || []),
                          // Include organizations
                          ...(chatData?.organizations?.map((organization) => ({
                            ...organization,
                            type: "organization",
                          })) || []),
                          // Include social media accounts
                          ...(chatData?.socialMediaAccounts?.map((account) => ({
                            ...account,
                            type: "social_media_account",
                          })) || []),
                        ]}
                        onPinItems={handlePinItems}
                        pinnedItems={pinnedItems}
                        displayVideosFirst={true} // Add new prop to control video display priority
                        onUseReferencedItems={(formattedItems) => {
                          // Update selected resources with the formatted items
                          setSelectedResources(formattedItems);
                          // Save to localStorage only if we're on the client
                          if (isClient && typeof window !== "undefined") {
                            localStorage.setItem(
                              "selectedResources",
                              JSON.stringify(formattedItems),
                            );
                          }
                          toast.success(
                            "Updated chat context to referenced items",
                          );
                        }}
                        onAddToCollectionCart={addToCollectionCart}
                        collectionCartItems={collectionCartItems}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={chatEndRef} />

          {/* Move loading indicator here, before the search results panel */}
          {isLoading && (
            <div className="flex items-start gap-3 flex-col md:flex-row px-8">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex-shrink-0 flex items-center justify-center shadow-lg ring-2 ring-white animate-pulse">
                <span className="text-xs font-bold text-white">AI</span>
              </div>
              <div className="bg-white px-6 py-4 rounded-2xl rounded-tl-none shadow-lg border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    ></span>
                    <span
                      className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    ></span>
                    <span
                      className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    ></span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    Thinking...
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Search Results Panel */}
          {showSearchResults && (
            <div className="border rounded-xl p-4 bg-gray-50 mb-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium">
                  {searchType?.charAt(0).toUpperCase() + searchType?.slice(1)}
                </h3>
                <button
                  onClick={() => setShowSearchResults(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              {/* Search and Bulk Action Controls */}
              <div className="flex flex-col gap-3 mb-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder={`Search ${searchType}...`}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm placeholder-gray-400"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkSelection(true)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors duration-200"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => handleBulkSelection(false)}
                    className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Results List */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {getFilteredResults().map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      // Use the same normalization approach as SearchModal
                      const itemWithType = {
                        ...item,
                        type: searchType.slice(0, -1),
                      };
                      const normalizedItem = normalizeItem(itemWithType);
                      handleResourceSelect(normalizedItem);
                      setShowSearchResults(false);
                      setSearchType(null);
                      setSearchFilter(""); // Clear search when item is selected
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-white transition-colors duration-200 text-sm"
                  >
                    {item.title || item.name || "Untitled"}
                  </button>
                ))}

                {getFilteredResults().length === 0 && (
                  <div className="text-center py-3 text-sm text-gray-500">
                    No {searchType} found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Collection Cart */}
        {collectionCartItems.length > 0 && (
          <div className="border-t border-blue-100 bg-blue-50/60 px-6 py-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
                  <FaShoppingCart className="h-4 w-4" />
                  <span>Collection cart</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-blue-700 ring-1 ring-blue-100">
                    {collectionCartItems.length}
                  </span>
                </div>
                <div className="mt-2 flex max-h-[92px] flex-wrap gap-2 overflow-y-auto pr-1">
                  {collectionCartItems.map((item) => (
                    <span
                      key={getCollectionCartItemKey(item)}
                      className="inline-flex max-w-[260px] items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm"
                    >
                      {item.type === "collection" ? (
                        <FaFolder className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                      ) : item.type === "resource" ? (
                        <FaBook className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                      ) : (
                        <FaLink className="h-3.5 w-3.5 flex-shrink-0 text-blue-600" />
                      )}
                      <span className="truncate">
                        {item.title || item.name || "Untitled"}
                      </span>
                      {item.isTemplate && (
                        <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-700">
                          Template
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFromCollectionCart(item)}
                        className="text-gray-400 hover:text-red-500"
                        aria-label="Remove from collection cart"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCollectionCartSearchModal(true)}
                  className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                >
                  Search to add
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutCollectionCart}
                  disabled={!onOpenCollectionPlan}
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Checkout
                </button>
                <button
                  type="button"
                  onClick={clearCollectionCart}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Selected Resources Display */}
        {selectedResources.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/70">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Chat context
            </div>
            <div className="flex flex-wrap gap-2 max-h-[130px] overflow-y-auto">
              {getConsolidatedChips().map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <span className="truncate max-w-[200px]">
                    {item.label || item.title || item.name || "Untitled"}
                    {item.count && ` (${item.count})`}
                  </span>
                  <button
                    onClick={() => {
                      if (item.count) {
                        // If it's a consolidated chip, remove all items of that type
                        setSelectedResources((prev) =>
                          prev.filter((r) => r.type !== item.type),
                        );
                      } else {
                        // Remove individual item
                        removeResource(item.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mentioned Items Display (from @ mentions) */}
        {mentionedItems.length > 0 && (
          <div className="px-6 py-3 border-t border-blue-100 bg-blue-50/50">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                @ Mentioned Items
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-[130px] overflow-y-auto">
              {mentionedItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className={`${item.iconColor}`}>
                      <IconComponent className="w-3 h-3" />
                    </div>
                    <span className="truncate max-w-[200px] text-blue-700 text-sm font-medium">
                      {item.title || item.name || "Untitled"}
                    </span>
                    <span className="text-xs text-blue-500 capitalize font-medium">
                      {item.type.replace("_", " ")}
                    </span>
                    <button
                      onClick={() => {
                        // Remove the mention from the query text
                        const mentionText = `@${item.title || item.name}`;
                        const newQuery = query
                          .replace(
                            new RegExp(
                              mentionText.replace(
                                /[.*+?^${}()|[\]\\]/g,
                                "\\$&",
                              ),
                              "g",
                            ),
                            "",
                          )
                          .replace(/\s+/g, " ")
                          .trim();
                        setQuery(newQuery);

                        // Remove from mentioned items state
                        setMentionedItems((prev) =>
                          prev.filter((existing) => existing.id !== item.id),
                        );
                      }}
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

        {/* Add SearchModal component */}
        <SearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
          onSelect={(resource) => {
            handleResourceSelect(resource);
            setShowSearchModal(false);
          }}
          selectedResources={selectedResources}
        />

        <SearchModal
          isOpen={showCollectionCartSearchModal}
          onClose={() => setShowCollectionCartSearchModal(false)}
          onSelect={(item) => {
            addToCollectionCart(item);
            setShowCollectionCartSearchModal(false);
          }}
          selectedResources={collectionCartItems}
          collections={allCollections}
          resources={allResources}
          events={allEvents}
          externalLinks={chatData?.externalLinks || []}
          notations={chatData?.notations || []}
          linkGroups={chatData?.linkGroups || []}
          attachments={chatData?.attachments || []}
          allowedTabs={["links", "collections", "resources"]}
          title="Add to collection cart"
          placeholder="Search external links, collections, and resources..."
        />

        {/* Input Area */}
        <div className="border-t border-gray-200/50 bg-gradient-to-b from-gray-50 to-white p-6">
          <div className="flex flex-col gap-4">
            {/* {showCreditEstimator && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <CreditEstimator
                  text={JSON.stringify({
                    resources: selectedResources,
                    prompt: query,
                    userInfo: getUserInfoString(
                      customUserData,
                      includeUserInfo
                    ),
                  })}
                />
              </div>
            )} */}

              <div className="flex flex-col gap-3">
                {/* Controls Row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                  <button
                    onClick={handleUserIconClick}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => {
                      setIsHovering(false);
                      // Only hide if not in persistent mode (set by double click)
                      if (!showUserDetails) {
                        setTimeout(() => {
                          if (!showUserDetails) {
                            setShowUserDetails(false);
                          }
                        }, 100);
                      }
                    }}
                    className={`user-icon-button p-2.5 rounded-xl transition-all duration-200 ${
                      includeUserInfo
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <FaUser className="h-4 w-4" />
                  </button>

                  {/* User Details Tooltip/Popover */}
                  {(isHovering || showUserDetails) &&
                    getUserDetailsContent() && (
                      <div
                        className="user-details-tooltip absolute bottom-full left-0 mb-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-50"
                        onClick={(e) => e.stopPropagation()}
                        onMouseEnter={() => setIsHovering(true)}
                        onMouseLeave={() => {
                          setIsHovering(false);
                          // Only hide if not in persistent mode
                          if (!showUserDetails) {
                            setShowUserDetails(false);
                          }
                        }}
                      >
                        <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar">
                          {getUserDetailsContent().map((detail, index) => (
                            <div
                              key={detail.label}
                              className={`${
                                index > 0
                                  ? "border-t border-gray-100 pt-1.5"
                                  : ""
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
                            <svg
                              className="w-4 h-4"
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
                        )}
                      </div>
                    )}
                  </div>

                {/* Search Type Toggles */}
                {allEvents.length > 0 && (
                  <button
                    onClick={() => handleSearchToggle("events")}
                    className={`p-2 rounded-lg transition-all duration-200 relative group ${
                      searchType === "events"
                        ? "bg-blue-500 text-white"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <FaCalendar className="h-4 w-4" />
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Events
                    </span>
                  </button>
                )}
                {allResources.length > 0 && (
                  <button
                    onClick={() => handleSearchToggle("resources")}
                    className={`p-2 rounded-lg transition-all duration-200 relative group ${
                      searchType === "resources"
                        ? "bg-blue-500 text-white"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <FaBook className="h-4 w-4" />
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Resources
                    </span>
                  </button>
                )}
                {allCollections.length > 0 && (
                  <button
                    onClick={() => handleSearchToggle("collections")}
                    className={`p-2 rounded-lg transition-all duration-200 relative group ${
                      searchType === "collections"
                        ? "bg-blue-500 text-white"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <FaFolder className="h-4 w-4" />
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Collections
                    </span>
                  </button>
                )}
                {allOrganizations.length > 0 && (
                  <button
                    onClick={() => handleSearchToggle("organizations")}
                    className={`p-2 rounded-lg transition-all duration-200 relative group ${
                      searchType === "organizations"
                        ? "bg-blue-500 text-white"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <FaGlobeAmericas className="h-4 w-4" />
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Business Units
                    </span>
                  </button>
                )}

                {/* Add Video Search Button */}
                {allVideos && allVideos.length > 0 && (
                  <button
                    onClick={() => handleSearchToggle("videos")}
                    className={`p-2 rounded-lg transition-all duration-200 relative group ${
                      searchType === "videos"
                        ? "bg-blue-500 text-white"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <FaVideo className="h-4 w-4" />
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Videos
                    </span>
                  </button>
                )}

                {/* Add Social Media Search Button */}
                {allSocialMediaAccounts &&
                  allSocialMediaAccounts.length > 0 && (
                    <button
                      onClick={() => handleSearchToggle("socialMediaAccounts")}
                      className={`p-2 rounded-lg transition-all duration-200 relative group ${
                        searchType === "socialMediaAccounts"
                          ? "bg-blue-500 text-white"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <FaShareAlt className="h-4 w-4" />
                      <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                        Social Media
                      </span>
                    </button>
                  )}

                {/* Add new search modal button before the credit estimator */}
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="p-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  title="Add to chat context"
                >
                  <FaPlus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowCollectionCartSearchModal(true)}
                  className={`relative p-2 rounded-lg transition-all duration-200 ${
                    collectionCartItems.length > 0
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                  title="Add to collection cart"
                >
                  <FaShoppingCart className="h-4 w-4" />
                  {collectionCartItems.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                      {collectionCartItems.length}
                    </span>
                  )}
                </button>
                {/* 
                <button
                  onClick={() => setShowCreditEstimator(!showCreditEstimator)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    showCreditEstimator
                      ? "bg-blue-500 text-white"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <FaDollarSign className="h-4 w-4" />
                </button> */}

                {/* Add typing animation toggle */}
                <button
                  onClick={() =>
                    setTypingAnimationEnabled(!typingAnimationEnabled)
                  }
                  className={`p-2 rounded-lg transition-all duration-200 relative group ${
                    typingAnimationEnabled
                      ? "bg-blue-300 text-white"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                  }`}
                  title="Toggle typing animation"
                >
                  <FaKeyboard className="h-4 w-4" />

                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {typingAnimationEnabled ? "Disable" : "Enable"} Typing
                  </span>
                </button>

                {/* Add export button */}
                {(selectedResources.length > 0 ||
                  history.length > 0 ||
                  mentionedItems.length > 0) && (
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="p-2 rounded-lg transition-all duration-200 text-gray-400 hover:text-gray-600 hover:bg-gray-50 relative group"
                    title="Export chat data"
                  >
                    <FaDownload className="h-4 w-4" />
                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                      Export
                    </span>
                  </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowWhiteboardPanel((current) => !current)}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 ${
                    showWhiteboardPanel
                      ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
                      : "border-gray-200 bg-white text-gray-600 hover:border-blue-200 hover:bg-blue-50/60 hover:text-blue-700"
                  }`}
                >
                  <FaChalkboard className="h-4 w-4" />
                  <span>Whiteboard</span>
                  {whiteboardHasContent && (
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                </button>
              </div>

              {showWhiteboardPanel && (
                <div className="rounded-2xl border border-blue-100 bg-white/95 p-4 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                        <FaChalkboard className="h-4 w-4" />
                        <span>Prompt whiteboard</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {whiteboardHasContent
                          ? "Use this board as visual context for the next request."
                          : "Sketch the flow, structure, or notes you want the assistant to use."}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={includeWhiteboardInChat}
                          onChange={(event) =>
                            setIncludeWhiteboardInChat(event.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        Include in chat
                      </label>
                      <button
                        type="button"
                        onClick={handleSaveWhiteboardAttachments}
                        disabled={
                          isSavingWhiteboardAttachments ||
                          !whiteboardHasContent ||
                          (!attachWhiteboardToCollection &&
                            !attachWhiteboardToExternalLink)
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isSavingWhiteboardAttachments ? (
                          <FaSpinner className="h-4 w-4 animate-spin" />
                        ) : (
                          <FaSave className="h-4 w-4" />
                        )}
                        Save attachments
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <label className="flex items-start gap-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={attachWhiteboardToCollection}
                          disabled={whiteboardCollectionOptions.length === 0}
                          onChange={(event) => {
                            setAttachWhiteboardToCollection(
                              event.target.checked,
                            );
                            if (
                              event.target.checked &&
                              !whiteboardCollectionId &&
                              whiteboardCollectionOptions[0]
                            ) {
                              setWhiteboardCollectionId(
                                whiteboardCollectionOptions[0].id,
                              );
                            }
                          }}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span>
                          Attach to collection
                          <span className="block text-xs font-normal text-gray-500">
                            Saves this board onto a selected collection.
                          </span>
                        </span>
                      </label>
                      <select
                        value={whiteboardCollectionId}
                        disabled={
                          !attachWhiteboardToCollection ||
                          whiteboardCollectionOptions.length === 0
                        }
                        onChange={(event) =>
                          setWhiteboardCollectionId(event.target.value)
                        }
                        className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {whiteboardCollectionOptions.length === 0 ? (
                          <option value="">No collections available</option>
                        ) : (
                          whiteboardCollectionOptions.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      <label className="flex items-start gap-2 text-sm font-medium text-gray-700">
                        <input
                          type="checkbox"
                          checked={attachWhiteboardToExternalLink}
                          disabled={whiteboardExternalLinkOptions.length === 0}
                          onChange={(event) => {
                            setAttachWhiteboardToExternalLink(
                              event.target.checked,
                            );
                            if (
                              event.target.checked &&
                              !whiteboardExternalLinkId &&
                              whiteboardExternalLinkOptions[0]
                            ) {
                              setWhiteboardExternalLinkId(
                                whiteboardExternalLinkOptions[0].id,
                              );
                            }
                          }}
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span>
                          Attach to external link
                          <span className="block text-xs font-normal text-gray-500">
                            Select or mention a link, then save this board to it.
                          </span>
                        </span>
                      </label>
                      <select
                        value={whiteboardExternalLinkId}
                        disabled={
                          !attachWhiteboardToExternalLink ||
                          whiteboardExternalLinkOptions.length === 0
                        }
                        onChange={(event) =>
                          setWhiteboardExternalLinkId(event.target.value)
                        }
                        className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        {whiteboardExternalLinkOptions.length === 0 ? (
                          <option value="">No external links selected</option>
                        ) : (
                          whiteboardExternalLinkOptions.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>

                  {whiteboardSummary && (
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-800">
                      {whiteboardSummary}
                    </div>
                  )}

                  <div className="mt-4">
                    <ExternalLinkWhiteboard
                      boardId="chat-prompt-whiteboard"
                      title="Prompt"
                      whiteboardData={chatWhiteboardData}
                      canEdit={true}
                      onSave={handleChatWhiteboardSave}
                    />
                  </div>
                </div>
              )}

              {/* Input and Send Button Container */}
              <div className="flex flex-col sm:flex-row gap-3 relative">
                <div className="flex-1 relative">
                  <textarea
                    value={query}
                    onChange={handleTextareaChange}
                    onKeyDown={(e) => {
                      // Handle keyboard navigation in mention dropdown FIRST
                      if (showMentionDropdown) {
                        handleMentionKeyDown(e);
                        // If Enter or Tab was pressed and handled by mention dropdown, don't continue
                        if (e.key === "Enter" || e.key === "Tab") {
                          return;
                        }
                      }

                      // Then handle form submission
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Ask anything... (Use @ to mention items)"
                    className="w-full bg-white border-2 border-gray-200 rounded-xl py-4 px-5 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 min-h-[56px] max-h-[200px] resize-none transition-all duration-200 focus:bg-white focus:shadow-lg placeholder-gray-400"
                    rows={Math.min(5, Math.max(1, query.split("\n").length))}
                    style={{
                      overflowY: "auto",
                      height: "auto",
                    }}
                    ref={textareaRef}
                  />

                  {/* @ Mention Dropdown */}
                  {showMentionDropdown && (
                    <div
                      className="mention-dropdown fixed bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-w-xs w-80 overflow-hidden"
                      style={{
                        top: mentionPosition.top,
                        left: mentionPosition.left,
                      }}
                    >
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="text-sm text-gray-700 font-medium">
                          {mentionQuery
                            ? `Search results for "${mentionQuery}"`
                            : "Select an item to mention"}
                        </div>
                      </div>

                      {/* Add Select All option */}
                      {getFilteredMentionItems().length > 1 && (
                        <div className="border-b border-gray-100">
                          <button
                            onClick={handleMentionSelectAll}
                            className="w-full text-left px-4 py-3 transition-all duration-150 flex items-center gap-3 hover:bg-blue-50 border-l-2 border-transparent hover:border-blue-500"
                          >
                            <div className="flex-shrink-0 text-blue-600">
                              <FaPlus className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-blue-700">
                                Select All ({getFilteredMentionItems().length}{" "}
                                items)
                              </div>
                              <div className="text-xs text-blue-500 font-medium mt-0.5">
                                Add all filtered items
                              </div>
                            </div>
                          </button>
                        </div>
                      )}

                      <div className="max-h-64 overflow-y-auto">
                        {getFilteredMentionItems().length > 0 ? (
                          getFilteredMentionItems().map((item, index) => {
                            const IconComponent = item.icon;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleMentionSelect(item)}
                                className={`w-full text-left px-4 py-3 transition-all duration-150 flex items-center gap-3 border-l-2 ${
                                  index === selectedMentionIndex
                                    ? "bg-blue-50 border-blue-500 shadow-sm"
                                    : "hover:bg-gray-50 border-transparent"
                                }`}
                              >
                                <div
                                  className={`flex-shrink-0 ${item.iconColor}`}
                                >
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {item.title || item.name}
                                  </div>
                                  <div className="text-xs text-gray-500 capitalize font-medium mt-0.5">
                                    {item.type.replace("_", " ")}
                                  </div>
                                </div>
                                {index === selectedMentionIndex && (
                                  <div className="flex-shrink-0">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  </div>
                                )}
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-4 py-6 text-center">
                            <div className="text-gray-400 mb-2">
                              <FaFileAlt className="w-6 h-6 mx-auto" />
                            </div>
                            <div className="text-sm text-gray-500">
                              No items found
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <div className="text-xs text-gray-500 flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                              ↑↓
                            </kbd>
                            navigate
                          </span>
                          <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                              ↵
                            </kbd>
                            select
                          </span>
                          <span className="flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
                              Esc
                            </kbd>
                            close
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSendMessage}
                  disabled={!query.trim() || isLoading}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 shadow-lg"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 mx-auto animate-spin">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </div>
                  ) : (
                    <FiSend className="w-5 h-5 mx-auto" />
                  )}
                </button>
              </div>

              {/* AI Disclaimer */}
              <div className="text-center">
                <p className="text-xs text-gray-400">
                  AI can make mistakes. Please verify important information.
                </p>
              </div>
            </div>
          </div>
        </div>

        {pendingWorkflowSuggestion && (
          <Modal
            isOpen={!!pendingWorkflowSuggestion}
            onClose={() => setPendingWorkflowSuggestion(null)}
            maxWidth="max-w-lg"
          >
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FaChalkboard className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Use this whiteboard with the project?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    The chat has a prompt whiteboard. You can carry it into the
                    template planner and optionally attach it to the collection
                    that gets created.
                  </p>
                </div>
              </div>

              {whiteboardSummary && (
                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900">
                  {whiteboardSummary}
                </div>
              )}

              <label className="mt-4 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={attachWhiteboardToWorkflowProject}
                  onChange={(event) =>
                    setAttachWhiteboardToWorkflowProject(event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  Attach to the created collection
                  <span className="block text-xs text-gray-500">
                    When the project is created, this whiteboard becomes the
                    collection whiteboard.
                  </span>
                </span>
              </label>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => continueWorkflowSuggestion(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Continue without whiteboard
                </button>
                <button
                  type="button"
                  onClick={() => continueWorkflowSuggestion(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Use whiteboard
                </button>
              </div>
            </div>
          </Modal>
        )}

        {pendingCollectionPlanSuggestion && (
          <Modal
            isOpen={!!pendingCollectionPlanSuggestion}
            onClose={() => setPendingCollectionPlanSuggestion(null)}
            maxWidth="max-w-lg"
          >
            <div className="p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <FaChalkboard className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Use this whiteboard with the plan?
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    The chat has a prompt whiteboard. You can carry it into the
                    suggested collection plan and optionally attach it to the
                    collection that gets created.
                  </p>
                </div>
              </div>

              {whiteboardSummary && (
                <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-900">
                  {whiteboardSummary}
                </div>
              )}

              <label className="mt-4 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={attachWhiteboardToWorkflowProject}
                  onChange={(event) =>
                    setAttachWhiteboardToWorkflowProject(event.target.checked)
                  }
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  Attach to the created collection
                  <span className="block text-xs text-gray-500">
                    When a collection is created, this whiteboard becomes the
                    collection whiteboard.
                  </span>
                </span>
              </label>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => continueCollectionPlanSuggestion(false)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Continue without whiteboard
                </button>
                <button
                  type="button"
                  onClick={() => continueCollectionPlanSuggestion(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  Use whiteboard
                </button>
              </div>
            </div>
          </Modal>
        )}

        <InsufficientCreditsModal
          isOpen={showInsufficientCreditsModal}
          onClose={() => setShowInsufficientCreditsModal(false)}
        />

        {showExportModal && (
          <ChatExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            selectedResources={selectedResources}
            chatHistory={history}
            referencedItems={[
              // Include collections
              ...(chatData?.collections?.map((collection) => ({
                ...collection,
                type: "collection",
              })) || []),
              // Include direct external links
              ...(chatData?.externalLinks?.map((link) => ({
                ...link,
                type: "external_link",
              })) || []),
              // Include resources
              ...(chatData?.resources?.map((resource) => ({
                ...resource,
                type: "resource",
              })) || []),
              // Include events
              ...(chatData?.events?.map((event) => ({
                ...event,
                type: "event",
              })) || []),
              // Include videos
              ...(chatData?.videos?.map((video) => ({
                ...video,
                type: "video",
              })) || []),
              // Include direct attachments
              ...(chatData?.attachments?.map((attachment) => ({
                ...attachment,
                type: "attachment",
              })) || []),
              ...(chatData?.linkGroups?.map((linkGroup) => ({
                ...linkGroup,
                type: "link_group",
              })) || []),
              // Include direct notations
              ...(chatData?.notations?.map((notation) => ({
                ...notation,
                type: "notation",
              })) || []),
              // Include organizations
              ...(chatData?.organizations?.map((organization) => ({
                ...organization,
                type: "organization",
              })) || []),
            ]}
          />
        )}

        <style jsx global>{`
          /* Remove conflicting ProseMirror animations */
          .ProseMirror p {
            animation: none !important;
          }

          .ProseMirror strong {
            animation: none !important;
            opacity: 1 !important;
          }

          .ProseMirror p:nth-child(n) {
            animation-delay: 0s !important;
            opacity: 1 !important;
          }

          /* Smooth fade-in animation */
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fade-in-up {
            animation: fade-in-up 0.4s ease-out;
          }

          /* Custom scrollbar for chat history */
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }

          .custom-scrollbar::-webkit-scrollbar-track {
            background: #f3f4f6;
            border-radius: 4px;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #d1d5db;
            border-radius: 4px;
            transition: background 0.2s;
          }

          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #9ca3af;
          }
        `}</style>
      </div>
    );
  },
);

CustomChat.displayName = "CustomChat";

export default CustomChat;
