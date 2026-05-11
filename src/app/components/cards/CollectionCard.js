import React, { useState, useRef } from "react";
import Link from "next/link";
import { formatDate, differenceInDays } from "date-fns";
import { formatVisibilityForDisplay } from "@/app/utils/visibility";
import {
  FaLock,
  FaMicrophone,
  FaExternalLinkAlt,
  FaVideo,
  FaGraduationCap,
  FaFlask,
  FaList,
  FaBook,
  FaLink,
  FaCalendarAlt,
  FaUsers,
  FaCode,
  FaHashtag,
  FaDatabase,
  FaGlobe,
  FaEye,
  FaClock,
} from "react-icons/fa";

const CollectionCard = ({ collection, onView, onShare }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const titleRef = useRef(null);

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
        return collection.type === "external" ? FaExternalLinkAlt : FaDatabase;
    }
  };

  const IconComponent = getIconComponent(collection.icon);

  // Get simple collection type styling
  const getCollectionTypeStyles = () => {
    if (collection.type === "external") {
      return {
        bgColor: "bg-purple-50",
        textColor: "text-purple-700",
        iconColor: "text-purple-600",
        borderColor: "border-purple-200",
      };
    } else {
      return {
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        iconColor: "text-green-600",
        borderColor: "border-green-200",
      };
    }
  };

  const typeStyles = getCollectionTypeStyles();

  const handleTitleInteraction = () => {
    setShowTooltip((prev) => !prev);
  };

  // Check if collection was updated recently
  const isRecentlyUpdated =
    collection.updatedAt &&
    differenceInDays(new Date(), new Date(collection.updatedAt)) <= 3;

  // Extract plain text from HTML content
  const getPlainText = (html) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  const plainDescription = getPlainText(collection.description);

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

  // Format hashtags simply
  const renderHashtags = () => {
    if (!collection.hashtags || collection.hashtags.length === 0) {
      return null;
    }

    const displayTags = collection.hashtags.slice(0, 2);
    const hasMoreTags = collection.hashtags.length > 2;

    return (
      <div className="flex flex-wrap gap-1 mb-3">
        {displayTags.map((tag, index) => (
          <Link
            key={index}
            href={`/social-media?tag=${encodeURIComponent(tag)}`}
            className="inline-flex items-center px-2 py-1 rounded text-xs text-gray-600 hover:text-blue-600 transition-colors"
          >
            <FaHashtag className="mr-1 h-2 w-2" />
            {tag}
          </Link>
        ))}
        {hasMoreTags && (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs text-gray-500">
            +{collection.hashtags.length - 2}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 p-4 h-[400px] flex flex-col">
      {/* Simple header with collection type indicator */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`p-2 rounded ${typeStyles.bgColor} ${typeStyles.borderColor} border`}
          >
            <IconComponent className={`h-4 w-4 ${typeStyles.iconColor}`} />
          </div>
          <div>
            <span className={`text-xs font-medium ${typeStyles.textColor}`}>
              {collection.type === "external" ? "External" : "Resource"}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
              <VisibilityIcon className="h-3 w-3" />
              <span className="capitalize">{formatVisibilityForDisplay(collection.visibility)}</span>
            </div>
          </div>
        </div>

        {/* Simple date and item count */}
        <div className="text-right">
          <div className="text-xs text-gray-500 flex items-center gap-1">
            <FaClock className="h-3 w-3" />
            {formatDate(collection.updatedAt, "MMM dd")}
            {isRecentlyUpdated && (
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-1"></span>
            )}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {collection.resources.length} items
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="mb-3">
        <h3
          ref={titleRef}
          className="text-lg font-semibold text-gray-900 line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          onClick={handleTitleInteraction}
        >
          {collection.name}
        </h3>

        {/* Simple tooltip */}
        {showTooltip && collection.name.length > 40 && (
          <div className="absolute z-50 mt-2 p-2 bg-gray-900 text-white rounded text-sm max-w-xs break-words">
            {collection.name}
          </div>
        )}
      </div>

      {/* Hashtags */}
      {renderHashtags()}

      {/* Description */}
      <div className="mb-4 overflow-hidden">
        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
          {plainDescription}
        </p>
      </div>

      {/* Simple resources preview */}
      <div className="mb-4 flex-1 overflow-hidden">
        <div className="space-y-1">
          {collection.resources.slice(0, 3).map((resource) => (
            <Link
              href={`/resources/${resource.id}`}
              key={resource.id}
              className="block p-2 rounded hover:bg-gray-50 transition-colors"
            >
              <div className="text-sm text-gray-700 truncate hover:text-blue-600">
                {resource.name}
              </div>
            </Link>
          ))}
          {collection.resources.length > 3 && (
            <div className="text-xs text-gray-500 p-2">
              +{collection.resources.length - 3} more
            </div>
          )}
          {collection.resources.length === 0 && (
            <div className="text-sm text-gray-400 italic p-2">
              No resources yet
            </div>
          )}
        </div>
      </div>

      {/* Simple action buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        {/* <button
          onClick={() => onShare(collection)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors"
          aria-label="Share collection"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
        </button> */}

        <button
          onClick={() => onView(collection)}
          className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded border border-blue-200 transition-colors"
        >
          View Collection
        </button>
      </div>
    </div>
  );
};

export default CollectionCard;
