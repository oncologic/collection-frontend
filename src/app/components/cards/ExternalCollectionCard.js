"use client";
import React, { useState, useRef } from "react";
import Image from "next/image";
import { formatVisibilityForDisplay } from "@/app/utils/visibility";
import {
  FaInfoCircle,
  FaArrowRight,
  FaTimes,
  FaExternalLinkAlt,
  FaTrash,
  FaLink,
  FaChevronDown,
  FaLock,
  FaMicrophone,
  FaVideo,
  FaGraduationCap,
  FaFlask,
  FaList,
  FaBook,
  FaCalendarAlt,
  FaUsers,
  FaCode,
  FaHashtag,
  FaGlobe,
  FaEye,
  FaClock,
  FaRegStickyNote,
} from "react-icons/fa";
import TextDisplay from "../common/TextDisplay";
import CustomEditor from "../common/CustomEditor";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Tooltip from "../common/Tooltip";
import { formatDate, differenceInDays } from "date-fns";
import MoveToCollectionMenu from "../common/MoveToCollectionMenu";

const NotePreviewModal = ({ visible, position, content, onClose }) => {
  if (!visible) return null;

  return (
    <div
      className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-100 w-[300px]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <h3 className="text-sm font-medium text-gray-700">Notes Preview</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes size={14} />
        </button>
      </div>
      <div className="p-3 max-h-[200px] overflow-y-auto">
        <div className="space-y-2 text-sm text-gray-600 whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </div>
  );
};

const ExternalCollectionCard = ({
  collection,
  onView,
  onShare,
  deleteOption = false,
  deleteCollection,
  isAdmin = false,
  userId,
  currentUserId,
}) => {
  const router = useRouter();
  const { name, description, createdAt, updatedAt, externalLinks } = collection;

  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [modalPosition, setModalPosition] = useState({ top: 0, left: 0 });

  const [expandedNoteId, setExpandedNoteId] = useState(null);

  // Add these states for title tooltip functionality
  const [showTooltip, setShowTooltip] = useState(false);
  const titleRef = useRef(null);

  // Helper function to check if user is the collection owner
  const isOwner = () => {
    return collection.userId === currentUserId;
  };

  // Helper function to determine button text based on user access
  const getViewButtonText = () => {
    if (isOwner()) {
      return "View Collection";
    }

    // For collaborators, always show "View Collection" since we navigate to the collection page
    return "View Collection";
  };

  // Helper function to check if collection has external links with collaborators
  const hasCollaborators = () => {
    if (!externalLinks) return false;
    return externalLinks.some(
      (link) => link.collaborators && link.collaborators.length > 0
    );
  };

  // Helper function to count total collaborators in a collection
  const getTotalCollaborators = () => {
    if (!externalLinks) return 0;
    return externalLinks.reduce((total, link) => {
      return total + (link.collaborators ? link.collaborators.length : 0);
    }, 0);
  };

  // Check if collection was recently updated
  const isRecentlyUpdated =
    collection.updatedAt &&
    differenceInDays(new Date(), new Date(collection.updatedAt)) <= 3;

  const handleTitleInteraction = () => {
    setShowTooltip((prev) => !prev);
  };

  // Extract plain text from HTML content
  const getPlainText = (html) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  const plainDescription = getPlainText(
    description || "No description available"
  );

  // Get the appropriate icon component based on collection.icon
  const getIconComponent = (iconName) => {
    switch (iconName) {
      case "microphone":
        return FaMicrophone;
      case "video":
        return FaVideo;
      case "education":
        return FaGraduationCap;
      case "science":
        return FaFlask;
      case "list":
        return FaList;
      case "book":
        return FaBook;
      case "link":
        return FaLink;
      case "calendar":
        return FaCalendarAlt;
      case "users":
        return FaUsers;
      case "code":
        return FaCode;
      default:
        return FaExternalLinkAlt;
    }
  };

  const IconComponent = getIconComponent(collection.icon);

  // Get visibility icon
  const getVisibilityIcon = () => {
    switch (collection.visibility) {
      case "public":
        return FaGlobe;
      case "private":
        return FaLock;
      case "unlisted":
        return FaEye;
      default:
        return FaEye;
    }
  };

  const VisibilityIcon = getVisibilityIcon();

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group relative overflow-hidden h-[380px] flex flex-col">
        {/* Compact Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            {/* Left side - icon and type */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded bg-purple-50 border border-purple-100 flex items-center justify-center">
                <IconComponent className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                  External
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                  <VisibilityIcon className="w-2.5 h-2.5 mr-1" />
                  {formatVisibilityForDisplay(collection.visibility)}
                </span>
              </div>
            </div>

            {/* Right side - date and stats */}
            <div className="text-right flex-shrink-0">
              <div className="text-xs text-gray-500 flex items-center gap-1 justify-end mb-1">
                <FaClock className="w-3 h-3" />
                <span>Updated</span>
                {formatDate(updatedAt, "MMM dd, yy")}
                {isRecentlyUpdated && (
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-1"></span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                {externalLinks?.length || 0} links
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="px-4 pt-3 pb-2">
          <h3
            ref={titleRef}
            className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2 leading-tight cursor-pointer"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            onClick={handleTitleInteraction}
          >
            {name}
          </h3>

          {/* Tooltip */}
          {showTooltip && name.length > 40 && (
            <div className="absolute z-50 mt-2 p-2 bg-gray-900 text-white rounded text-sm max-w-xs break-words">
              {name}
            </div>
          )}
        </div>

        {/* Hashtags */}
        {collection.hashtags && collection.hashtags.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-1">
              {collection.hashtags.slice(0, 2).map((tag, index) => (
                <Link
                  key={index}
                  href={`/social-media?tag=${encodeURIComponent(tag)}`}
                  className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-600 hover:text-purple-600 rounded text-xs transition-colors"
                >
                  <FaHashtag className="mr-1 h-2 w-2" />
                  {tag}
                </Link>
              ))}
              {collection.hashtags.length > 2 && (
                <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                  +{collection.hashtags.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 text-xs">
            {externalLinks?.reduce(
              (total, link) => total + (link.notations?.length || 0),
              0
            ) > 0 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded flex items-center gap-1">
                <FaRegStickyNote className="w-2.5 h-2.5" />
                {externalLinks.reduce(
                  (total, link) => total + (link.notations?.length || 0),
                  0
                )}{" "}
                notes
              </span>
            )}
            {hasCollaborators() && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded flex items-center gap-1">
                <FaUsers className="h-2.5 w-2.5" />
                {getTotalCollaborators()}
              </span>
            )}
          </div>
        </div>

        {/* Description - flex-1 to take remaining space */}
        <div className="px-4 pb-3 overflow-hidden">
          <TextDisplay
            content={plainDescription || "No description available"}
            maxLength={120}
            className="text-sm text-gray-600 leading-relaxed line-clamp-3"
          />
        </div>

        {/* Links preview - with scroll */}
        <div className="px-4 pb-3 flex-1 min-h-0">
          <div className="space-y-1 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 bg-gray-50 rounded-lg">
            {externalLinks
              ?.filter((link) => link.status !== "archived")
              .slice(0, 3)
              .map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="text-sm text-gray-700 truncate flex-1 hover:text-purple-600 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/external-links/${link.id}`);
                    }}
                  >
                    {link.name}
                  </div>
                  {link.notations?.length > 0 && (
                    <span className="text-xs text-gray-500 ml-2 shrink-0">
                      {link.notations.length}
                    </span>
                  )}
                </div>
              ))}
            {(!externalLinks || externalLinks.length === 0) && (
              <div className="text-sm text-gray-400 italic p-2 text-center">
                No external links yet
              </div>
            )}
          </div>
        </div>

        {/* Action button - stays at bottom */}
        <div className="p-4 pt-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => onView(collection)}
              className="flex-1 px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded border border-purple-200 transition-colors"
            >
              {getViewButtonText()}
            </button>
            {deleteOption && isAdmin && isOwner() && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteCollection(collection.id);
                }}
                className="ml-2 p-2 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <NotePreviewModal
        visible={modalVisible}
        position={modalPosition}
        content={modalContent}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
};

export default ExternalCollectionCard;
