import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  FaMicrophone,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import Modal from "./Modal";
import AIVoiceMemo from "./AIVoiceMemo";
import AIBulkUpdates from "./AIBulkUpdates";
import AddAttachmentForm from "@/app/components/forms/AddAttachmentForm";
import { toast } from "react-hot-toast";
import { useCreateAttachment } from "@/app/hooks/useAttachments";
import { useContextAuth } from "@/app/context/authContext";

const QuickNoteButton = ({ pinnedItems = [] }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const buttonRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedExternalLink, setSelectedExternalLink] = useState(null);
  const [isGeneratingNotations, setIsGeneratingNotations] = useState(false);
  const [activeMode, setActiveMode] = useState("add"); // "add" or "update"

  const { mutate: uploadAttachment, isLoading: isUploadingAttachment } =
    useCreateAttachment();
  const { systemUser } = useContextAuth();

  // Group pinned items by type (same logic as dashboard)
  const groupedPinnedItems = useMemo(() => {
    if (!pinnedItems) return {};

    return pinnedItems.reduce((acc, item) => {
      // Determine the correct type based on available properties
      let type = item.type || "other";

      // Special handling for external links - look for the externalLinks object property (same as dashboard)
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

  // Filter notations for update mode (exclude archived and completed)
  const updatableNotations = useMemo(() => {
    if (!selectedExternalLink?.notations) return [];

    return selectedExternalLink.notations.filter((notation) => {
      const status = notation.status?.toLowerCase();
      return status !== "archived" && status !== "completed";
    });
  }, [selectedExternalLink]);

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
    // Try different possible structures

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
    // Reset to add mode when opening a new item
    setActiveMode("add");
  };

  const handleNotationsCreated = (notations) => {
    // Just close the modal - let AIVoiceMemo handle success messages and navigation
    setShowModal(false);
    setSelectedExternalLink(null);
    setIsGeneratingNotations(false);
  };

  const handleNotationsUpdated = (updatedNotations) => {
    // Handle successful bulk updates
    setShowModal(false);
    setSelectedExternalLink(null);
    setIsGeneratingNotations(false);
    toast.success(
      `Successfully updated ${updatedNotations.length} notation${
        updatedNotations.length !== 1 ? "s" : ""
      }`
    );
  };

  const handleStartNotationGeneration = () => {
    setIsGeneratingNotations(true);
  };

  const handleNavigateToLink = (externalLinkId) => {
    if (externalLinkId) {
      window.location.href = `/external-links/${externalLinkId}`;
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedExternalLink(null);
    setIsGeneratingNotations(false);
    setActiveMode("add");
  };

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    setIsGeneratingNotations(false);
  };

  if (availableItems.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative" ref={buttonRef}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium border border-blue-300"
        >
          <FaPlus className="w-3 h-3" />
          <span>Quick Note ({availableItems.length})</span>
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
                    Select pinned external link:
                  </h3>
                </div>
                <div className="py-1">
                  {availableItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors flex items-center gap-2"
                    >
                      <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500"></div>
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

      {/* Integrated Workflow Modal */}
      {showModal && selectedExternalLink && (
        <Modal onClose={handleCloseModal} maxWidth="max-w-5xl">
          <div className="p-6">
            {/* Header with Tabs */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                Quick Note for{" "}
                {selectedExternalLink?.externalLinks?.name ||
                  selectedExternalLink?.name ||
                  selectedExternalLink?.title}
              </h2>
            </div>

            {/* Tab Navigation */}
            <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => handleModeChange("add")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeMode === "add"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Add New Note
              </button>
              <button
                onClick={() => handleModeChange("update")}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeMode === "update"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                Update Notes ({updatableNotations.length})
              </button>
            </div>

            {/* Content based on active mode */}
            <div>
              {activeMode === "add" ? (
                <AIVoiceMemo
                  externalLinkId={getExternalLinkId(selectedExternalLink)}
                  collectionId={
                    selectedExternalLink?.collections?.[0]?.id ||
                    selectedExternalLink?.externalLinks?.collections?.[0]?.id
                  }
                  onNotationsCreated={handleNotationsCreated}
                  onCancel={handleCloseModal}
                  onNavigateToLink={handleNavigateToLink}
                  onStartGeneration={handleStartNotationGeneration}
                  isGenerating={isGeneratingNotations}
                  isCollaborator={
                    selectedExternalLink?.externalLinks?.user_id !==
                    systemUser?.id
                  }
                  showAttachments={true}
                />
              ) : (
                <AIBulkUpdates
                  selectedNotations={updatableNotations}
                  externalLinkId={getExternalLinkId(selectedExternalLink)}
                  collectionId={
                    selectedExternalLink?.collections?.[0]?.id ||
                    selectedExternalLink?.externalLinks?.collections?.[0]?.id
                  }
                  onNotationsUpdated={handleNotationsUpdated}
                  onCancel={handleCloseModal}
                  isCollaborator={
                    selectedExternalLink?.externalLinks?.user_id !==
                    systemUser?.id
                  }
                />
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default QuickNoteButton;
