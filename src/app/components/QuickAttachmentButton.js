import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  FaPaperclip,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaMagic,
} from "react-icons/fa";
import Modal from "./Modal";
import AttachmentAICreate from "./AttachmentAICreate";
import { useContextAuth } from "@/app/context/authContext";

const QuickAttachmentButton = ({ pinnedItems = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const buttonRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedExternalLink, setSelectedExternalLink] = useState(null);

  const { systemUser } = useContextAuth();

  // Group pinned items by type (same logic as QuickNoteButton)
  const groupedPinnedItems = useMemo(() => {
    if (!pinnedItems) return {};

    return pinnedItems.reduce((acc, item) => {
      // Determine the correct type based on available properties
      let type = item.type || "other";

      // Special handling for external links - look for the externalLinks object property
      if (item.externalLinks && Object.keys(item.externalLinks).length > 0) {
        type = "external_link";
      }

      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(item);
      return acc;
    }, {});
  }, [pinnedItems]);

  // Get available items (pinned external links only)
  const availableItems = useMemo(() => {
    // Only include pinned external links
    return groupedPinnedItems.external_link || [];
  }, [groupedPinnedItems]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExpanded]);

  // Helper function to extract external link ID from pinned item
  const getExternalLinkId = (item) => {
    return (
      item?.externalLinks?.id || // Most common structure
      item?.id || // Direct ID
      item?.externalLinkId || // Alternative structure
      null
    );
  };

  const handleItemSelect = (item) => {
    setSelectedExternalLink(item);
    setShowModal(true);
    setIsExpanded(false);
  };

  const handleAttachmentCreated = () => {
    // Just close the modal - let AttachmentAICreate handle success messages
    setShowModal(false);
    setSelectedExternalLink(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedExternalLink(null);
  };

  if (availableItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative" ref={buttonRef}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium border border-purple-300"
        >
          <FaMagic className="w-3 h-3" />
          <span>AI Attachment ({availableItems.length})</span>
          {isExpanded ? (
            <FaChevronUp className="w-3 h-3" />
          ) : (
            <FaChevronDown className="w-3 h-3" />
          )}
        </button>

        {isExpanded && (
          <div className="absolute top-full mt-2 left-0 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {availableItems.length > 0 ? (
              <>
                <div className="p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <h3 className="text-sm font-medium text-gray-700">
                    Select external link for AI attachment:
                  </h3>
                </div>
                <div className="py-1">
                  {availableItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition-colors flex items-center gap-2"
                    >
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-purple-500"></div>
                      <div className="flex-grow min-w-0">
                        <div className="font-medium truncate">
                          {item.externalLinks?.name || item.name || item.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          External Link
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-4 text-sm text-gray-500 text-center">
                <div className="mb-2">📌</div>
                <div>No pinned external links found.</div>
                <div className="text-xs mt-1">
                  Pin some external links first!
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Attachment Modal */}
      {showModal && selectedExternalLink && (
        <Modal onClose={handleCloseModal} maxWidth="max-w-3xl">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                AI Attachment for{" "}
                {selectedExternalLink?.externalLinks?.name ||
                  selectedExternalLink?.name ||
                  selectedExternalLink?.title}
              </h2>
            </div>

            {/* AI Attachment Creator */}
            <AttachmentAICreate
              externalLinkId={getExternalLinkId(selectedExternalLink)}
              collectionId={
                selectedExternalLink?.collections?.[0]?.id ||
                selectedExternalLink?.externalLinks?.collections?.[0]?.id
              }
              onClose={handleCloseModal}
              onAttachmentCreated={handleAttachmentCreated}
            />
          </div>
        </Modal>
      )}
    </>
  );
};

export default QuickAttachmentButton;