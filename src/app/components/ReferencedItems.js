"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

import {
  FaBook,
  FaCalendar,
  FaChevronDown,
  FaComment,
  FaFolder,
  FaHandHoldingHeart,
  FaImage,
  FaLink,
  FaPaperclip,
  FaPlayCircle,
  FaBlog,
  FaVideo,
  FaPodcast,
  FaTools,
  FaDollarSign,
  FaDesktop,
  FaFileAlt,
  FaInfoCircle,
  FaThumbtack,
  FaTimes,
  FaCheck,
  FaBuilding,
  FaShareAlt,
} from "react-icons/fa";
import TimestampModal from "./TimestampModal";
import ImageBrowser from "./ImageBrowser/ImageBrowser";
import VideoChat from "./VideoChat";
import AttachmentBrowser from "./AttachmentBrowser";
import { toast } from "react-hot-toast";
import { shouldBypassImageOptimization } from "@/app/utils/imageOptimization";

// Add custom CSS for premium animations
const animationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes pulse {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
  }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
  
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.4s ease-out forwards;
  }
  
  .animate-pulse-subtle {
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  .animate-blink {
    animation: blink 1s ease-in-out infinite;
  }
  
  .animate-bounce-gentle {
    animation: bounce 1.5s ease-in-out infinite;
  }
  
  .bg-shimmer {
    background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.2), rgba(255,255,255,0));
    background-size: 200% 100%;
    animation: shimmer 2s infinite;
  }
`;

// PinModal Component
const PinModal = ({ isOpen, onClose, items, handlePinItems }) => {
  const [selectedItems, setSelectedItems] = useState(new Set());

  const handleToggleItem = (itemId) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handlePinSelected = () => {
    // Convert selected IDs back to full items
    const selectedFullItems = items.filter((item) =>
      selectedItems.has(item.id)
    );
    handlePinItems(selectedFullItems);
    onClose();
    setSelectedItems(new Set()); // Reset selection after pinning
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center animate-fade-in"
      onClick={onClose}
      style={{ animationDuration: "0.3s" }}
    >
      <div
        className="w-full sm:w-auto sm:max-w-lg bg-white rounded-t-2xl sm:rounded-xl 
          shadow-xl mx-auto sm:mx-4 overflow-hidden animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{ animationDuration: "0.4s", animationDelay: "0.1s" }}
      >
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <FaThumbtack className="mr-2 w-4 h-4" />
            <span>Pin to Dashboard</span>
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200 text-white"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="max-h-[60vh] sm:max-h-[70vh] overflow-y-auto p-4 space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition-all duration-200 animate-fade-in-up
                ${
                  selectedItems.has(item.id)
                    ? "border-purple-500 bg-purple-50/50 shadow-sm"
                    : "border-gray-200 hover:border-blue-200 hover:bg-blue-50/30"
                }`}
              onClick={() => handleToggleItem(item.id)}
              style={{
                animationDelay: `${index * 30 + 150}ms`,
                animationDuration: "0.3s",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                  transition-all duration-200
                  ${
                    selectedItems.has(item.id)
                      ? "border-purple-500 bg-purple-500 scale-110"
                      : "border-gray-300"
                  }`}
                >
                  {selectedItems.has(item.id) && (
                    <FaCheck
                      className="w-3 h-3 text-white animate-fade-in"
                      style={{ animationDuration: "0.2s" }}
                    />
                  )}
                </div>
                <span className="flex-1 font-medium text-gray-700 text-sm sm:text-base">
                  {item.title || item.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer - Sticky on mobile */}
        <div className="border-t border-gray-100 p-4 bg-gray-50 sticky bottom-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 justify-between items-center">
            <span className="text-sm text-gray-500">
              {selectedItems.size} items selected
            </span>
            <button
              onClick={handlePinSelected}
              disabled={selectedItems.size === 0}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-medium
                transition-all duration-300
                ${
                  selectedItems.size > 0
                    ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:shadow-lg active:scale-95"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
            >
              Pin Selected Items
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReferencedItems = ({
  items,
  onSelectAll,
  onRemoveAll,
  onRemoveItem,
  onPinItems,
  onUseReferencedItems,
  selectedItems = [],
  pinnedItems = [],
  showPinModal = false,
  onClosePinModal,
  onConfirmPin,
  onCancelPin,
  onUpdateChatContext,
  hideActionButtons = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState(null);
  const [selectedTimestamps, setSelectedTimestamps] = useState(null);
  const [isImageBrowserOpen, setIsImageBrowserOpen] = useState(false);
  const [isAttachmentBrowserOpen, setIsAttachmentBrowserOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [showPinButton, setShowPinButton] = useState(false);
  const [showUseInChatButton, setShowUseInChatButton] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showAttentionIcon, setShowAttentionIcon] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const router = useRouter();
  const attachmentBrowserRef = useRef(null);

  // Add animation styles once on component mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      const styleElement = document.createElement("style");
      styleElement.innerHTML = animationStyles;
      document.head.appendChild(styleElement);

      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, []);

  // Move useEffect before any conditional returns
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPinButton(true);
      setShowUseInChatButton(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Auto-hide the attention icon after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAttentionIcon(false);
    }, 8000); // 8 seconds

    return () => clearTimeout(timer);
  }, []);

  // Hide attention icon after first expansion
  useEffect(() => {
    if (isExpanded) {
      setShowAttentionIcon(false);
    }
  }, [isExpanded]);

  // Scroll to AttachmentBrowser when it opens
  useEffect(() => {
    if (isAttachmentBrowserOpen && attachmentBrowserRef.current) {
      setTimeout(() => {
        attachmentBrowserRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [isAttachmentBrowserOpen]);

  const toggleSectionExpansion = (type) => {
    setExpandedSections((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  if (!items?.length) return null;

  const isYoutubeUrl = (url, videoUrl) => {
    // Check both URLs independently
    const isUrlValid =
      url?.toLowerCase().includes("youtube.com") ||
      url?.toLowerCase().includes("youtu.be") ||
      url?.toLowerCase().includes("zoom.us");

    const isVideoUrlValid =
      videoUrl?.toLowerCase().includes("youtube.com") ||
      videoUrl?.toLowerCase().includes("youtu.be") ||
      videoUrl?.toLowerCase().includes("zoom.us");

    return isUrlValid || isVideoUrlValid;
  };

  // Helper function to detect image files
  const isImageFile = (url, type, attachmentType) => {
    // Check if type is explicitly set to image
    if (type === "image" || attachmentType === "image") {
      return true;
    }

    // Check file extension in URL
    if (url) {
      const imageExtensions =
        /\.(jpg|jpeg|png|gif|bmp|webp|svg|ico|tiff)(\?|$)/i;
      return imageExtensions.test(url);
    }

    return false;
  };

  // Helper function to detect video files
  const isVideoFile = (url, type, attachmentType) => {
    // Check if type is explicitly set to video
    if (type === "video" || attachmentType === "video") {
      return true;
    }

    // Check file extension in URL
    if (url) {
      const videoExtensions =
        /\.(mp4|mov|avi|webm|mpeg|mkv|flv|wmv|m4v)(\?|$)/i;
      return videoExtensions.test(url);
    }

    return false;
  };

  // Helper function to get proper attachment type
  const getAttachmentType = (url, type, attachmentType) => {
    if (isImageFile(url, type, attachmentType)) return "image";
    if (isVideoFile(url, type, attachmentType)) return "video";
    if (url && /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)(\?|$)/i.test(url))
      return "document";
    return "other";
  };

  // Get all video items
  const videoItems =
    items?.filter((item) => isYoutubeUrl(item.url, item.videoUrl)) || [];

  // Get all image items (only actual images)
  const imageItems =
    items?.reduce((acc, item) => {
      // Direct presignedUrl items that are images
      if (
        item.presignedUrl &&
        isImageFile(item.presignedUrl, item.type, item.attachmentType)
      ) {
        acc.push({
          id: item.id,
          title: item.title,
          presignedUrl: item.presignedUrl,
          description: item.description,
          highlighted: item.highlighted,
        });
      }

      // Check externalLinks for image attachments with presignedUrl
      if (item.externalLinks) {
        item.externalLinks.forEach((link) => {
          if (link.attachments) {
            link.attachments
              .filter(
                (attachment) =>
                  attachment.presignedUrl &&
                  isImageFile(
                    attachment.presignedUrl,
                    attachment.type,
                    attachment.attachmentType
                  )
              )
              .forEach((attachment) => {
                acc.push({
                  id: attachment.id,
                  title: attachment.title || link.title,
                  presignedUrl: attachment.presignedUrl,
                  description: attachment.description,
                  highlighted: attachment.highlighted,
                });
              });
          }
        });
      }

      return acc;
    }, []) || [];

  // Get all non-image attachments
  const attachmentItems =
    items?.reduce((acc, item) => {
      // Direct attachment items that are not images
      if (
        item.type === "attachment" &&
        !isImageFile(
          item.presignedUrl || item.url,
          item.type,
          item.attachmentType
        )
      ) {
        const properType = getAttachmentType(
          item.presignedUrl || item.url,
          item.type,
          item.attachmentType
        );
        acc.push({
          id: item.id,
          title: item.title || item.name,
          url: item.url || item.presignedUrl,
          description: item.description,
          highlighted: item.highlighted,
          type: properType,
          presignedUrl: item.presignedUrl,
          createdAt:
            item.createdAt || item.uploadedAt || new Date().toISOString(),
          size: item.size || 0,
        });
      }

      // Check externalLinks for non-image attachments
      if (item.externalLinks) {
        item.externalLinks.forEach((link) => {
          if (link.attachments) {
            link.attachments
              .filter(
                (attachment) =>
                  !isImageFile(
                    attachment.presignedUrl || attachment.url,
                    attachment.type,
                    attachment.attachmentType
                  )
              )
              .forEach((attachment) => {
                const properType = getAttachmentType(
                  attachment.presignedUrl || attachment.url,
                  attachment.type,
                  attachment.attachmentType
                );
                acc.push({
                  id: attachment.id,
                  title: attachment.title || attachment.name || link.title,
                  url: attachment.url || attachment.presignedUrl,
                  description: attachment.description,
                  highlighted: attachment.highlighted,
                  type: properType,
                  presignedUrl: attachment.presignedUrl,
                  createdAt:
                    attachment.createdAt ||
                    attachment.uploadedAt ||
                    link.createdAt ||
                    new Date().toISOString(),
                  size: attachment.size || 0,
                });
              });
          }
        });
      }

      return acc;
    }, []) || [];

  // Get the highlighted or first video
  const highlightedVideo =
    videoItems.find((item) => item.highlighted) || videoItems[0];

  // Organize items to nest related content
  const organizedItems = items
    .map((item) => {
      if (item.type === "collection") {
        // Find matching externalLinks for this collection
        const matchingExternalLinks = items
          .filter(
            (i) => i.type === "external_link" && i.collectionId === item.id
          )
          .map((link) => ({
            ...link,
            // Find matching attachments and notations for this external link
            attachments: items.filter(
              (i) => i.type === "attachment" && i.externalLinkId === link.id
            ),
            notations: items.filter(
              (i) => i.type === "notation" && i.externalLinkId === link.id
            ),
          }));

        return {
          ...item,
          externalLinks: matchingExternalLinks,
        };
      }
      return item;
    })
    .filter(
      (item) =>
        // Filter out items that are now nested under collections
        !(
          item.type === "external_link" &&
          items.some(
            (i) => i.type === "collection" && i.id === item.collectionId
          )
        ) &&
        !(
          item.type === "attachment" &&
          items.some(
            (i) => i.type === "external_link" && i.id === item.externalLinkId
          )
        ) &&
        !(
          item.type === "notation" &&
          items.some(
            (i) => i.type === "external_link" && i.id === item.externalLinkId
          )
        )
    );

  const handleItemClick = (item, altAction = false) => {
    // If Alt action (typically Alt+Click or right click menu option), go to the resource page
    if (altAction) {
      switch (item.type) {
        case "external":
        case "collection":
          window.open(`/collections/${item.id}`, "_blank");
          break;
        case "resource":
          window.open(`/resources/${item.id}`, "_blank");
          break;
        case "external_link":
          window.open(`/external-links/${item.id}`, "_blank");
          break;
        case "notation":
          window.open(`/external-links/${item.externalLinkId}`, "_blank");
          break;
        case "event":
          window.open(`/events/${item.id}`, "_blank");
          break;
        case "organization":
          window.open(`/organizations/${item.id}`, "_blank");
          break;
        case "social_media_account":
          if (item.url) {
            window.open(item.url, "_blank");
          }
          break;
        case "attachment":
        case "image":
          window.open(`/external-links/${item.externalLinkId}`, "_blank");
          break;
        case "link_group":
          if (item.resourceId) {
            window.open(`/resources/${item.resourceId}`, "_blank");
          } else if (item.url) {
            window.open(item.url, "_blank");
          }
          break;
        default:
          console.warn(`Unknown item type: ${item.type}`);
      }
      return;
    }

    // For collections, external_links, and organizations, always go to the internal page
    if (item.type === "collection") {
      window.open(`/collections/${item.id}`, "_blank");
      return;
    }

    if (item.type === "external_link") {
      window.open(`/external-links/${item.id}`, "_blank");
      return;
    }

    if (item.type === "organization") {
      window.open(`/organizations/${item.id}`, "_blank");
      return;
    }

    // For other content types, prioritize the URL if available
    if (item.url) {
      // Don't treat /N/A as a valid URL
      if (item.url === "/N/A" || item.url.toLowerCase().includes("/n/a")) {
        console.warn(`Invalid URL detected: ${item.url}`);
        return;
      }
      window.open(item.url, "_blank");
      return;
    }

    // Fallback to the resource page if no URL is available
    switch (item.type) {
      case "resource":
        window.open(`/resources/${item.id}`, "_blank");
        break;
      case "notation":
        window.open(`/external-links/${item.externalLinkId}`, "_blank");
        break;
      case "event":
        window.open(`/events/${item.id}`, "_blank");
        break;
      case "social_media_account":
        if (item.url) {
          window.open(item.url, "_blank");
        }
        break;
      case "attachment":
      case "image":
        window.open(`/external-links/${item.externalLinkId}`, "_blank");
        break;
      case "link_group":
        if (item.resourceId) {
          window.open(`/resources/${item.resourceId}`, "_blank");
        }
        break;
      default:
        console.warn(`Unknown item type: ${item.type}`);
    }
  };

  const getIcon = (type, category) => {
    switch (type) {
      case "organization":
        return (
          <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-100">
            <FaBuilding className="w-3 h-3 text-blue-600" />
          </div>
        );
      case "social_media_account":
        return (
          <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-100">
            <FaShareAlt className="w-3 h-3 text-blue-600" />
          </div>
        );
      case "external":
        return (
          <div className="w-6 h-6 flex items-center justify-center rounded bg-purple-100">
            <FaFolder className="w-3 h-3 text-purple-600" />
          </div>
        );
      case "resource":
        // Handle different resource categories
        switch (category?.toLowerCase()) {
          case "blog":
            return (
              <div className="w-6 h-6 flex items-center justify-center rounded border-blue-100 border-2">
                <FaFileAlt className="w-3 h-3 text-blue-500" />
              </div>
            );
          case "webinar":
            return (
              <div className="w-6 h-6 flex items-center justify-center rounded border-blue-100 border-2">
                <FaDesktop className="w-3 h-3 text-blue-500" />
              </div>
            );
          case "tool":
            return (
              <div className="w-6 h-6 flex items-center justify-center rounded border-blue-100 border-2">
                <FaTools className="w-3 h-3 text-blue-500" />
              </div>
            );
          case "podcast":
            return (
              <div className="w-6 h-6 flex items-center justify-center rounded border-blue-100 border-2">
                <FaPodcast className="w-3 h-3 text-blue-500" />
              </div>
            );
          case "grant":
            return (
              <div className="w-6 h-6 flex items-center justify-center rounded border border-blue-100 border-2">
                <FaDollarSign className="w-3 h-3 text-blue-500" />
              </div>
            );
          case "video":
            return (
              <div className="w-6 h-6 flex items-center justify-center rounded border border-blue-100 border-2">
                <FaVideo className="w-3 h-3 text-blue-500" />
              </div>
            );
          default:
            return (
              <div className="w-6 h-6 flex items-center justify-center rounded border border-blue-100 border-2">
                <FaHandHoldingHeart className="w-3 h-3 text-blue-500" />
              </div>
            );
        }
      case "external_link":
        return (
          <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-100">
            <FaLink className="w-4 h-4 text-blue-600" />
          </div>
        );
      case "collection":
        return (
          <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-100">
            <FaFolder className="w-3 h-3 text-blue-600" />
          </div>
        );
      case "notation":
        return (
          <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-100">
            <FaComment className="w-3 h-3 text-blue-600" />
          </div>
        );
      case "event":
        return (
          <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-100">
            <FaCalendar className="w-3 h-3 text-blue-600" />
          </div>
        );
      case "image":
        return (
          <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-100">
            <FaImage className="w-3 h-3 text-blue-600" />
          </div>
        );
      case "attachment":
        return (
          <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-100">
            <FaPaperclip className="w-3 h-3 text-blue-600" />
          </div>
        );
      case "link_group":
        return (
          <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-100">
            <FaLink className="w-3 h-3 text-blue-600" />
          </div>
        );
      case "clinical-trial":
        return (
          <div className="w-6 h-6 flex items-center justify-center rounded bg-blue-100">
            <FaFileAlt className="w-3 h-3 text-blue-600" />
          </div>
        );
      default:
        return null;
    }
  };

  const renderExternalLinkContent = (link) => (
    <div key={link.id} className="flex flex-col">
      <div className="flex items-center">
        <button
          onClick={() => window.open(`/external-links/${link.id}`, "_blank")}
          className="flex items-center gap-2 px-2 py-1 text-xs
            text-gray-600 hover:text-gray-900 group relative flex-grow"
        >
          <FaLink className="text-blue-500 w-3 h-3" />
          <span className="truncate max-w-[180px]">{link.name}</span>
          {link.notations?.length > 0 && (
            <span className="text-gray-400">({link.notations.length})</span>
          )}
        </button>
        {link.notations?.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const elem = e.currentTarget.parentElement.nextElementSibling;
              elem.style.display =
                elem.style.display === "none" ? "block" : "none";
            }}
            className="p-1 hover:bg-gray-100 rounded-full ml-1"
          >
            <FaChevronDown className="w-2 h-2 text-gray-400" />
          </button>
        )}
      </div>
      <div className="pl-6 hidden">
        {link.notations?.map((notation) => (
          <div
            key={notation.id}
            className="text-xs text-gray-500 truncate py-0.5 hover:text-gray-700"
          >
            {notation.title || "Untitled"}
          </div>
        ))}
      </div>
    </div>
  );

  const handlePinItems = (selectedItems) => {
    // With this updated function, we'll toggle pin status
    // Check if any of the selected items are already pinned
    const itemsToToggle = selectedItems.map((item) => {
      // Check if this item is already pinned
      const isPinned = pinnedItems.some(
        (pinnedItem) =>
          pinnedItem.id === item.id ||
          pinnedItem === item.id ||
          (typeof pinnedItem === "object" &&
            pinnedItem.pinnedItemId === item.id)
      );

      // Return the item with its current pin status
      return { ...item, isPinned };
    });

    // Call the parent's onPinItems handler, passing both the items and their pin status
    // The parent component should handle toggling as appropriate
    onPinItems?.(itemsToToggle);
  };

  const handleUseReferencedItems = () => {
    // Clear localStorage to indicate that we're explicitly changing the context
    if (typeof window !== "undefined") {
      localStorage.removeItem("selectedResources");
    }

    // Format the items to match the expected structure
    const formattedItems = items.map((item) => ({
      ...item,
      type: item.type === "external_link" ? "link" : item.type, // Convert external_link to link type
    }));

    // Call the parent's onUseReferencedItems handler with the formatted items
    onUseReferencedItems && onUseReferencedItems(formattedItems);
  };

  // Group items by type for cleaner display
  const groupedItems = items.reduce((acc, item) => {
    const type = item.type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});

  return (
    <div className="mt-4 space-y-4 w-full">
      {/* Header Section with Premium Animation */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-1 animate-fade-in"
        style={{ animationDuration: "0.5s", animationFillMode: "both" }}
      >
        <h3 className="text-gray-700 text-sm sm:text-base font-medium flex items-center">
          {/* Simple pulsing gradient circle status indicator */}
          {true && (
            <span
              className="relative mr-1.5 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span
                className="inline-block w-3 h-3 rounded-full bg-gradient-to-r from-blue-300 to-blue-500 animate-pulse-subtle"
                title="Click to view sources"
              ></span>
            </span>
          )}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sources
          </span>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 text-gray-400 hover:text-blue-600 transition-colors duration-200"
          >
            <span className="text-xs inline-flex items-center">
              {isExpanded ? "Hide" : "Show"} ({items.length})
              <svg
                className={`ml-1 w-3 h-3 transition-transform duration-300 ${
                  isExpanded ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </span>
          </button>
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {showUseInChatButton && (
            <button
              onClick={handleUseReferencedItems}
              className="inline-flex items-center justify-center gap-2 
                px-3 py-1.5 rounded-lg text-sm
                bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium
                shadow-sm hover:shadow-md
                transition-all duration-300
                hover:from-blue-600 hover:to-blue-700
                active:scale-95"
            >
              <svg
                className="w-3.5 h-3.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z"
                />
              </svg>
              <span>Use in Chat</span>
            </button>
          )}
          {showPinButton && (
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 
                px-3 py-1.5 rounded-lg text-sm
                bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium
                shadow-sm hover:shadow-md
                transition-all duration-300
                hover:from-purple-600 hover:to-purple-700
                active:scale-95"
            >
              <FaThumbtack className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Pin</span>
            </button>
          )}
        </div>
      </div>

      {/* ChatGPT-like Sources View - Conditional based on expansion state */}
      <div
        data-sources-container
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isExpanded
            ? "max-h-[700px] overflow-y-auto opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <div className="flex flex-col space-y-3 pl-2 pr-1 py-2">
          {Object.entries(groupedItems).map(([type, typeItems], groupIndex) => {
            // Set a reasonable limit for initially visible items to prevent overwhelming the UI
            const itemLimit = 8; // Show only 8 items initially for better performance
            const hasMoreItems = typeItems.length > itemLimit;
            const isTypeExpanded = expandedSections[type] || false;
            const visibleItems = isTypeExpanded
              ? typeItems
              : typeItems.slice(0, itemLimit);

            return (
              <div
                key={type}
                className="space-y-2 animate-fade-in-up"
                style={{
                  animationDelay: `${groupIndex * 100}ms`,
                  animationDuration: "0.5s",
                }}
              >
                {/* Type heading with subtle gradient underline */}
                <h4 className="text-xs font-semibold uppercase text-gray-500 border-b border-gray-100 pb-1 flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 w-2 rounded-full mr-1.5"></span>
                    {capitalizeFirstLetter(type)}s ({typeItems.length})
                  </div>

                  {/* Show/hide all button for categories with many items */}
                  {hasMoreItems && (
                    <button
                      onClick={() => toggleSectionExpansion(type)}
                      className="text-[10px] bg-gray-50 hover:bg-gray-100 rounded-full px-2 py-0.5 text-gray-500 hover:text-gray-700 transition-colors duration-200"
                    >
                      {isTypeExpanded ? "Show Less" : "Show All"}
                    </button>
                  )}
                </h4>

                {/* Items in this category with staggered animation */}
                <div
                  className={`space-y-1.5 ml-3 pb-1
                    ${
                      typeItems.length > 10
                        ? "overflow-y-auto max-h-[300px] pr-2 custom-scrollbar"
                        : "overflow-x-auto"
                    }`}
                >
                  {visibleItems.map((item, itemIndex) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-2 group animate-fade-in-up min-w-0 pr-2 ${
                        item.type === "organization" ? "py-1.5" : "py-0.5"
                      }`}
                      style={{
                        animationDelay: `${groupIndex * 50 + itemIndex * 30}ms`,
                        animationDuration: "0.4s",
                      }}
                    >
                      {/* Icon with subtle highlight effect - larger container for organization logos */}
                      <div
                        className={`flex-shrink-0 ${
                          item.type === "organization" ? "w-8 h-8" : "w-5 h-5"
                        } flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                      >
                        {item.type === "organization" ? (
                          item.imageUrl || item.presignedUrl ? (
                            <Image
                              src={item.imageUrl || item.presignedUrl}
                              alt={
                                item.name || item.title || "Organization logo"
                              }
                              width={32}
                              height={32}
                              unoptimized={shouldBypassImageOptimization(
                                item.imageUrl || item.presignedUrl
                              )}
                              className="w-8 h-8 object-contain rounded-md shadow-sm border border-gray-200"
                              onError={(e) => {
                                // Don't try to load a fallback image, directly show the building icon
                                e.target.style.display = "none";

                                // Clean up any existing fallback element
                                const parent = e.target.parentNode;
                                if (parent) {
                                  while (parent.firstChild) {
                                    parent.removeChild(parent.firstChild);
                                  }

                                  // Create a React-like structure with proper styling
                                  const iconWrapper =
                                    document.createElement("div");
                                  iconWrapper.className =
                                    "w-6 h-6 flex items-center justify-center rounded-full bg-blue-100";

                                  // Use SVG directly for the building icon
                                  iconWrapper.innerHTML =
                                    '<svg class="w-3.5 h-3.5 text-blue-700" fill="currentColor" viewBox="0 0 448 512"><path d="M436 480h-20V24c0-13.255-10.745-24-24-24H56C42.745 0 32 10.745 32 24v456H12c-6.627 0-12 5.373-12 12v20h448v-20c0-6.627-5.373-12-12-12zM128 76c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12V76zm0 96c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12v-40zm52 148h-40c-6.627 0-12-5.373-12-12v-40c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40c0 6.627-5.373 12-12 12zm76 160h-64v-84c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v84zm64-172c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12v-40c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40zm0-96c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12v-40c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40zm0-96c0 6.627-5.373 12-12 12h-40c-6.627 0-12-5.373-12-12v-40c0-6.627 5.373-12 12-12h40c6.627 0 12 5.373 12 12v40z"></path></svg>';

                                  parent.appendChild(iconWrapper);
                                }
                              }}
                            />
                          ) : (
                            <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100">
                              <FaBuilding className="w-3.5 h-3.5 text-blue-700" />
                            </div>
                          )
                        ) : (
                          getIcon(item.type, item.category)
                        )}
                      </div>

                      {/* Content with mobile-friendly interaction */}
                      <div className="flex-1 min-w-0 relative group">
                        <div className="flex items-center gap-1 min-w-0">
                          {item.url === "/N/A" ||
                          (item.url &&
                            item.url.toLowerCase().includes("/n/a")) ? (
                            <span className="text-sm text-gray-600 truncate flex-1 break-words">
                              {item.title || item.name || "Untitled"}
                            </span>
                          ) : (
                            <a
                              href={
                                item.type === "collection" ||
                                item.type === "external_link" ||
                                item.type === "organization"
                                  ? "#"
                                  : item.url || "#"
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`text-sm ${
                                item.type === "organization"
                                  ? "text-blue-700 font-medium"
                                  : "text-blue-600"
                              } hover:text-blue-800 group-hover:underline truncate flex-1 transition-colors duration-200 break-words`}
                              onClick={(e) => {
                                e.preventDefault();
                                if (
                                  item.type === "collection" ||
                                  item.type === "external_link" ||
                                  item.type === "organization"
                                ) {
                                  handleItemClick(item, false);
                                } else if (item.url) {
                                  window.open(item.url, "_blank");
                                } else {
                                  handleItemClick(item, false);
                                }
                              }}
                              title={item.title || item.name || "Untitled"}
                            >
                              {item.title || item.name || "Untitled"}
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Action buttons - only show if hideActionButtons is false */}
                      {!hideActionButtons && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {/* Single item action - eye icon only for resources that aren't collections or external_links */}
                          {!(
                            item.type === "collection" ||
                            item.type === "external_link"
                          ) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(item, true); // Always go to internal page
                              }}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:scale-110 transition-all duration-200"
                              title="View Resource Page"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>
                          )}

                          {/* Pin Button - showing different state when already pinned */}
                          {(() => {
                            // Check if item is pinned by looking for its ID in pinnedItems
                            const isPinned = pinnedItems.some(
                              (pinnedItem) =>
                                // Check both the direct ID and pinnedItemId fields
                                pinnedItem.id === item.id ||
                                pinnedItem === item.id ||
                                (typeof pinnedItem === "object" &&
                                  pinnedItem.pinnedItemId === item.id)
                            );

                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePinItems([item]);
                                  toast.success(
                                    isPinned
                                      ? `Unpinned: ${
                                          item.title || item.name || "Item"
                                        }`
                                      : `Pinned: ${
                                          item.title || item.name || "Item"
                                        }`
                                  );
                                }}
                                className={`p-1.5 ${
                                  isPinned
                                    ? "text-purple-600 hover:text-purple-800"
                                    : "text-gray-400 hover:text-purple-600"
                                } hover:scale-110 transition-all duration-200`}
                                title={
                                  isPinned
                                    ? "Unpin from Dashboard"
                                    : "Pin to Dashboard"
                                }
                              >
                                <FaThumbtack className="w-4 h-4" />
                              </button>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* View more button for very long lists */}
                  {!isTypeExpanded && hasMoreItems && (
                    <button
                      onClick={() => toggleSectionExpansion(type)}
                      className="w-full text-center text-xs text-blue-600 hover:text-blue-800 py-1.5 hover:bg-blue-50 rounded-md transition-colors duration-200 mt-1"
                    >
                      View {typeItems.length - itemLimit} more{" "}
                      {capitalizeFirstLetter(type)}s...
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* View All button for opening in new window when there are many items */}
        {items.length > 20 && (
          <div className="flex justify-center mt-3 mb-1">
            <button
              onClick={() => {
                // Ensure all sections are expanded
                const allExpanded = Object.fromEntries(
                  Object.keys(groupedItems).map((type) => [type, true])
                );
                setExpandedSections(allExpanded);

                // Scroll container to top to see everything
                setTimeout(() => {
                  const container = document.querySelector(
                    "[data-sources-container]"
                  );
                  if (container) container.scrollTop = 0;
                }, 50);
              }}
              className="text-xs bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg hover:shadow-md transition-all duration-200 hover:from-blue-600 hover:to-blue-700"
            >
              View All {items.length} Sources
            </button>
          </div>
        )}
      </div>

      {/* Display VideoChat component when we have video items - KEEP AS IS */}
      {videoItems.length > 0 && (
        <VideoChat
          videos={videoItems}
          onEdit={(item) => router.push(`/resource/${item.id}`)}
          onDelete={() => {}}
        />
      )}

      {/* Display AttachmentBrowser section when we have attachment items */}
      {attachmentItems.length > 0 && (
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <FaPaperclip className="text-blue-600 text-sm" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  {attachmentItems.length} Attachment
                  {attachmentItems.length === 1 ? "" : "s"}
                </h3>
                <p className="text-sm text-blue-700">
                  Documents and files referenced in this conversation
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsAttachmentBrowserOpen(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
            >
              <FaPaperclip className="w-4 h-4" />
              View All
            </button>
          </div>

          {/* Preview of attachments */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {attachmentItems.slice(0, 6).map((attachment) => (
                <div
                  key={attachment.id}
                  className="bg-white rounded-lg p-3 border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsAttachmentBrowserOpen(true);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FaPaperclip className="w-3 h-3 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.title}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {attachment.type}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {attachmentItems.length > 6 && (
              <div className="mt-3 text-center">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsAttachmentBrowserOpen(true);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  View {attachmentItems.length - 6} more attachments...
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile-optimized Modal with premium styling */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        items={items}
        handlePinItems={handlePinItems}
        pinnedItems={items.filter(
          (item) => !pinnedItems.includes(item.pinnedItemId)
        )}
      />

      {/* ImageBrowser component - KEEP AS IS */}
      {imageItems.length > 0 && (
        <ImageBrowser
          images={imageItems}
          isOpen={isImageBrowserOpen}
          onClose={() => setIsImageBrowserOpen(false)}
        />
      )}

      {/* Attachment Browser Modal */}
      {isAttachmentBrowserOpen && (
        <div ref={attachmentBrowserRef}>
          <AttachmentBrowser
            attachments={attachmentItems}
            onClose={() => setIsAttachmentBrowserOpen(false)}
            title="Referenced Attachments"
          />
        </div>
      )}

      <TimestampModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVideoUrl(null);
          setSelectedTimestamps(null);
        }}
        videoUrl={selectedVideoUrl}
        timestamps={selectedTimestamps}
      />
    </div>
  );
};

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/
  );
  return match ? match[1] : null;
};

const capitalizeFirstLetter = (string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export default ReferencedItems;
