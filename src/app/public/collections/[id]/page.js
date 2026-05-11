"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import {
  FaPlay,
  FaBookOpen,
  FaClock,
  FaGraduationCap,
  FaInstagram,
  FaUsers,
  FaStar,
  FaChevronRight,
  FaExternalLinkAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaFilter,
  FaSearch,
  FaVideo,
  FaFileAlt,
  FaFlask,
  FaGlobe,
  FaPaperclip,
  FaDownload,
  FaRobot,
  FaHeart,
  FaShare,
  FaExpand,
  FaCompress,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";
import {
  fetchSharedCollection,
  fetchPublicResourceTypes,
  fetchSharedCollectionBySlug,
} from "@/app/api/shareApi";
import { toast } from "react-hot-toast";
import {
  sanitizeHtml as sanitizeHtmlSafe,
  stripHtmlToText as stripHtmlToTextSafe,
} from "@/app/utils/sanitizeHtml";
import {
  getPlayableVideoUrl,
  getVideoType,
  normalizeVideoUrl,
} from "@/app/utils/videoProviders";
import { buildSortedExternalLinkTypeEntries } from "@/app/utils/externalLinkOrdering";
import CollectionVideoPlaylist from "@/app/components/CollectionVideoPlaylist";

// Helper functions
const getResourceIcon = (typeId, resourceTypes = null) => {
  // If we have resource types from API, use them
  if (resourceTypes) {
    const type = resourceTypes.find((t) => t.id === typeId);
    if (type && type.icon) {
      // Map icon names to actual icon components
      const iconMap = {
        "file-alt": FaFileAlt,
        "book-open": FaBookOpen,
        flask: FaFlask,
        users: FaUsers,
        video: FaVideo,
        globe: FaGlobe,
        paperclip: FaPaperclip,
        download: FaDownload,
        play: FaPlay,
      };
      return iconMap[type.icon] || FaFileAlt;
    }
  }

  // Fallback to hardcoded mapping
  const iconMap = {
    1: FaFileAlt,
    2: FaBookOpen,
    3: FaFlask,
    4: FaUsers,
    5: FaVideo,
    6: FaGlobe,
    7: FaPaperclip,
    8: FaDownload,
    9: FaVideo, // Video instead of Webinar
  };
  return iconMap[typeId] || FaFileAlt;
};

const getResourceTypeName = (typeId, resourceTypes = null) => {
  // If we have resource types from API, use them
  if (resourceTypes) {
    const type = resourceTypes.find((t) => t.id === typeId);
    if (type && type.name) {
      return type.name;
    }
  }

  // Fallback to hardcoded mapping
  const typeMap = {
    1: "Article",
    2: "Book",
    3: "Research",
    4: "Community",
    5: "Video",
    6: "Website",
    7: "Attachment",
    8: "Download",
    9: "Video", // Changed from "Webinar" to "Video"
  };
  return typeMap[typeId] || "Resource";
};

const getResourceTypeColor = (typeId, resourceTypes = null) => {
  // If we have resource types from API, use them
  if (resourceTypes) {
    const type = resourceTypes.find((t) => t.id === typeId);
    if (type && type.color) {
      // Convert single color to gradient format
      return `from-${type.color}-500 to-${type.color}-600`;
    }
  }

  // Fallback to hardcoded mapping
  const colorMap = {
    1: "from-blue-500 to-blue-600",
    2: "from-green-500 to-green-600",
    3: "from-purple-500 to-purple-600",
    4: "from-orange-500 to-orange-600",
    5: "from-red-500 to-red-600",
    6: "from-blue-500 to-blue-600",
    7: "from-red-500 to-red-600",
    8: "from-pink-500 to-pink-600",
    9: "from-teal-500 to-teal-600",
  };
  return colorMap[typeId] || "from-gray-500 to-gray-600";
};

const sanitizeHtml = (html) => sanitizeHtmlSafe(html);
const stripHtml = (html) => stripHtmlToTextSafe(html);

const truncateHtml = (html, maxLength = 150) => {
  if (!html) return "";
  const stripped = stripHtml(html);
  return stripped.length > maxLength
    ? stripped.substring(0, maxLength) + "..."
    : stripped;
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getExternalLinkTypeLabel = (type) => {
  if (!type) return "Link";
  return type
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getPublicExternalLinkDetailsHref = (externalLinkId, collectionId) =>
  `/public/external-links/${externalLinkId}?collectionId=${encodeURIComponent(
    collectionId
  )}`;

const getExternalDestinationUrl = (url) => {
  if (!url || typeof url !== "string") return null;

  const trimmedUrl = url.trim();
  if (!trimmedUrl || trimmedUrl.startsWith("/")) {
    return null;
  }

  try {
    const baseOrigin =
      (typeof window !== "undefined" && window.location.origin) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000";
    const parsedUrl = new URL(trimmedUrl, baseOrigin);
    const isHttpUrl =
      parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";

    if (!isHttpUrl) {
      return trimmedUrl;
    }

    return parsedUrl.origin === baseOrigin ? null : trimmedUrl;
  } catch (error) {
    return null;
  }
};

const getYouTubeVideoId = (url) => {
  const regExp =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  } else {
    return null;
  }
};

// Parse timestamps from text - similar to TimestampModal
const parseTimestamps = (timestampText) => {
  if (!timestampText) return [];

  const lines = timestampText.split("\n").filter((line) => line.trim());
  const timestamps = [];

  for (const line of lines) {
    // Match patterns like "Topic at: 2:40" or "Topic: 2:40" or "2:40 - Topic"
    const patterns = [
      /^(.+?)\s+at:\s*(\d{1,2}:\d{2}(?::\d{2})?)/i,
      /^(.+?):\s*(\d{1,2}:\d{2}(?::\d{2})?)/i,
      /^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]\s*(.+)/i,
      /^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        let title, timeStr;
        if (pattern.source.startsWith("^(\\d")) {
          // Time comes first
          timeStr = match[1];
          title = match[2];
        } else {
          // Title comes first
          title = match[1];
          timeStr = match[2];
        }

        // Convert time string to seconds
        const timeParts = timeStr.split(":").map(Number);
        let seconds = 0;
        if (timeParts.length === 3) {
          seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
        } else if (timeParts.length === 2) {
          seconds = timeParts[0] * 60 + timeParts[1];
        }

        timestamps.push({
          title: title.trim(),
          timestamp: seconds,
          formattedTime: timeStr,
        });
        break;
      }
    }
  }

  return timestamps.sort((a, b) => a.timestamp - b.timestamp);
};

// Generate YouTube URL with timestamp
const getYouTubeUrlWithTimestamp = (videoUrl, timestamp) => {
  if (!videoUrl || !timestamp) return videoUrl;

  const videoId = getYouTubeVideoId(videoUrl);
  if (!videoId) return videoUrl;

  return `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(
    timestamp
  )}s`;
};

// YouTube Thumbnail Component with fallbacks - SIMPLIFIED VERSION
const YouTubeThumbnail = ({ videoId, alt, className }) => {
  if (!videoId) {
    return (
      <div
        className={`bg-gray-800 flex items-center justify-center ${className}`}
      >
        <div className="text-center text-white">
          <FaVideo className="text-4xl mb-2 mx-auto opacity-50" />
          <p className="text-sm opacity-75">No Video</p>
        </div>
      </div>
    );
  }

  // Use the same approach as VideoBrowser.js
  return (
    <img
      src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        // Fallback to mqdefault if hqdefault fails
        if (e.target.src.includes("hqdefault")) {
          e.target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        } else if (e.target.src.includes("mqdefault")) {
          e.target.src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
        } else {
          // If all thumbnails fail, show placeholder
          e.target.style.display = "none";
          const placeholder = document.createElement("div");
          placeholder.className = `bg-gray-800 flex items-center justify-center ${className}`;
          placeholder.innerHTML = `
            <div class="text-center text-white">
              <div class="text-4xl mb-2 mx-auto opacity-50">🎥</div>
              <p class="text-sm opacity-75">Video Preview</p>
            </div>
          `;
          e.target.parentNode.replaceChild(placeholder, e.target);
        }
      }}
    />
  );
};

// YouTube component - we'll need to install react-youtube or create a simple iframe version
const YouTubePlayer = ({ videoId, onReady, startTime = 0 }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (onReady && iframeRef.current) {
      // Create a simple player object that mimics the YouTube API
      const player = {
        seekTo: (time) => {
          if (iframeRef.current) {
            const currentSrc = iframeRef.current.src;
            const baseSrc = currentSrc.split("&t=")[0].split("?t=")[0];
            iframeRef.current.src = `${baseSrc}?autoplay=1&start=${Math.floor(
              time
            )}`;
          }
        },
      };
      onReady({ target: player });
    }
  }, [onReady]);

  if (!videoId) return null;

  return (
    <iframe
      ref={iframeRef}
      width="100%"
      height="100%"
      src={`https://www.youtube.com/embed/${videoId}?autoplay=1&start=${startTime}`}
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      className="absolute inset-0 w-full h-full"
    />
  );
};

// Resource Detail Modal Component
const ResourceDetailModal = ({ resource, isOpen, onClose, resourceTypes }) => {
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [timestampSearch, setTimestampSearch] = useState("");
  const playerRef = useRef(null);

  if (!isOpen || !resource) return null;

  const IconComponent = getResourceIcon(resource.typeId, resourceTypes);
  const videoId = getYouTubeVideoId(resource.videoUrl || resource.url);

  // Handle player ready
  const onPlayerReady = (event) => {
    playerRef.current = event.target;
  };

  // Handle timestamp click
  const handleTimestampClick = (timestamp) => {
    setCurrentTimestamp(timestamp);
    if (playerRef.current && typeof playerRef.current.seekTo === "function") {
      playerRef.current.seekTo(timestamp);
    }
  };

  // Reset search when modal closes
  const handleClose = () => {
    setTimestampSearch("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg bg-gradient-to-r ${getResourceTypeColor(
                resource.typeId,
                resourceTypes
              )}`}
            >
              <IconComponent className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 line-clamp-1">
                {resource.name}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>
                  {getResourceTypeName(resource.typeId, resourceTypes)}
                </span>
                {resource.resourceDate && (
                  <span>{formatDate(resource.resourceDate)}</span>
                )}
                {resource.featured && (
                  <span className="flex items-center text-blue-600">
                    <FaStar className="mr-1" />
                    Featured
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Video Section */}
          {videoId && (
            <div className="mb-6">
              <div className="relative h-64 md:h-80 bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                <YouTubePlayer
                  videoId={videoId}
                  onReady={onPlayerReady}
                  startTime={currentTimestamp}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <FaInfoCircle className="mr-2 text-blue-500" />
              Description
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {resource.description ? (
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(resource.description),
                  }}
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  No description available.
                </p>
              )}
            </div>
          </div>

          {/* Collection Notes */}
          {resource.collectionNotes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                Notes
              </h3>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div
                  className="text-blue-800 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(resource.collectionNotes),
                  }}
                />
              </div>
            </div>
          )}

          {/* Timestamps */}
          {resource.timestamps && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaClock className="mr-2 text-green-500" />
                Key Moments
              </h3>
              <div className="bg-green-50 rounded-lg p-4">
                {(() => {
                  const parsedTimestamps = parseTimestamps(resource.timestamps);
                  const isYouTubeVideo = !!videoId;

                  if (parsedTimestamps.length > 0 && isYouTubeVideo) {
                    // Filter timestamps based on search
                    const filteredTimestamps = parsedTimestamps.filter(
                      (timestamp) =>
                        timestamp.title
                          .toLowerCase()
                          .includes(timestampSearch.toLowerCase())
                    );

                    return (
                      <div className="space-y-2">
                        <p className="text-sm text-green-700 mb-3">
                          Click on any timestamp to jump to that moment in the
                          video:
                        </p>

                        {/* Search input for timestamps */}
                        {parsedTimestamps.length > 5 && (
                          <div className="mb-4">
                            <div className="relative">
                              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-500 text-sm" />
                              <input
                                type="text"
                                placeholder="Search key moments..."
                                value={timestampSearch}
                                onChange={(e) =>
                                  setTimestampSearch(e.target.value)
                                }
                                className="w-full pl-10 pr-4 py-2 border border-green-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white text-sm"
                              />
                              {timestampSearch && (
                                <button
                                  onClick={() => setTimestampSearch("")}
                                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 hover:text-green-700"
                                >
                                  <FaTimes className="text-sm" />
                                </button>
                              )}
                            </div>
                            <div className="mt-2 text-xs text-green-600">
                              {filteredTimestamps.length} of{" "}
                              {parsedTimestamps.length} moments
                              {timestampSearch &&
                                ` matching "${timestampSearch}"`}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                          {filteredTimestamps.length > 0 ? (
                            filteredTimestamps.map((timestamp, index) => (
                              <button
                                key={index}
                                onClick={() =>
                                  handleTimestampClick(timestamp.timestamp)
                                }
                                className={`flex items-center gap-3 p-3 rounded-lg transition-colors group text-left ${
                                  currentTimestamp === timestamp.timestamp
                                    ? "bg-green-200 border-green-300 border-2"
                                    : "bg-white hover:bg-green-100 border border-green-200"
                                }`}
                              >
                                <div className="flex-shrink-0 bg-green-600 text-white px-2 py-1 rounded text-sm font-medium">
                                  {timestamp.formattedTime}
                                </div>
                                <div className="flex-1 text-green-800 group-hover:text-green-900">
                                  {(() => {
                                    const safeTitle = stripHtml(
                                      timestamp.title
                                    );
                                    if (!timestampSearch) return safeTitle;
                                    const q = timestampSearch;
                                    const escaped = q.replace(
                                      /[.*+?^${}()|[\]\\]/g,
                                      "\\$&"
                                    );
                                    const re = new RegExp(`(${escaped})`, "gi");
                                    const parts = safeTitle.split(re);
                                    return parts.map((part, i) => {
                                      const isMatch =
                                        part.toLowerCase() === q.toLowerCase();
                                      return isMatch ? (
                                        <mark
                                          key={i}
                                          className="bg-yellow-200 px-1 rounded"
                                        >
                                          {part}
                                        </mark>
                                      ) : (
                                        <span key={i}>{part}</span>
                                      );
                                    });
                                  })()}
                                </div>
                                <FaPlay className="text-green-600 opacity-60 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))
                          ) : (
                            <div className="text-center py-4 text-green-600">
                              <FaSearch className="mx-auto mb-2 text-2xl opacity-50" />
                              <p className="text-sm">
                                No moments found matching &quot;
                                {timestampSearch}&quot;
                              </p>
                              <button
                                onClick={() => setTimestampSearch("")}
                                className="text-xs text-green-700 hover:text-green-800 underline mt-1"
                              >
                                Clear search
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  } else {
                    // Fallback to original display for non-YouTube videos or unparseable timestamps
                    return (
                      <pre className="text-sm text-green-800 whitespace-pre-wrap font-mono leading-relaxed">
                        {resource.timestamps}
                      </pre>
                    );
                  }
                })()}
              </div>
            </div>
          )}

          {/* Full Text */}
          {resource.fullText && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaFileAlt className="mr-2 text-purple-500" />
                Full Content
              </h3>
              <div className="bg-purple-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                <div
                  className="text-purple-800 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(resource.fullText),
                  }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <FaExternalLinkAlt className="mr-2" />
                Open Original Source
              </a>
            )}
            <button
              onClick={handleClose}
              className="flex-1 sm:flex-none inline-flex items-center justify-center bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ExternalCollectionCard = ({ link, collectionId }) => {
  const safeDescription = truncateHtml(link.description || link.notes, 220);
  const noteCount = link.notations?.length || 0;
  const attachmentCount = link.attachments?.length || 0;
  const linkGroupCount = link.linkGroups?.length || 0;
  const previewTags = (link.tags || []).slice(0, 3);
  const detailsHref = getPublicExternalLinkDetailsHref(link.id, collectionId);
  const destinationUrl = getExternalDestinationUrl(link.url);

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-pointer flex flex-col h-full">
      {link.imageUrl || link.presignedImageUrl ? (
        <div className="relative h-48 bg-gray-100 flex-shrink-0">
          <img
            src={link.imageUrl || link.presignedImageUrl}
            alt={link.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextElementSibling.style.display = "flex";
            }}
          />
          <div className="absolute inset-0 hidden flex-col items-center justify-center bg-gradient-to-r from-slate-800 to-blue-900 text-white">
            <span className="text-xl font-semibold opacity-90 p-4 text-center">
              {link.name}
            </span>
          </div>
        </div>
      ) : (
        <div className="relative h-48 bg-gradient-to-r from-slate-800 to-blue-900 flex-shrink-0">
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <span className="text-xl font-semibold opacity-90 p-4 text-center">
              {link.name}
            </span>
          </div>
        </div>
      )}

      <div className="p-6 flex flex-col flex-grow">
        <div className="mb-4 flex flex-col items-start gap-2 flex-shrink-0">
          <div className="inline-flex max-w-full items-center gap-2 rounded-lg bg-gradient-to-r from-slate-700 to-blue-700 px-3 py-1 text-sm font-medium text-white">
            <FaGlobe className="shrink-0" />
            <span className="break-words">
              {getExternalLinkTypeLabel(link.type)}
            </span>
          </div>
          {link.date && (
            <span className="text-xs leading-tight text-gray-500">
              {formatDate(link.date)}
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors flex-shrink-0 leading-tight">
          {link.name}
        </h3>

        <div className="flex-grow mb-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            {safeDescription || "No public description available."}
          </p>
        </div>

        {previewTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
            {previewTags.map((tag) => (
              <span
                key={tag.id || tag.name}
                className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
              >
                {tag.name}
              </span>
            ))}
            {(link.tags?.length || 0) > previewTags.length && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                +{link.tags.length - previewTags.length} more
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500 flex-shrink-0">
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
            <div className="font-semibold text-gray-900">{noteCount}</div>
            <div>Notes</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
            <div className="font-semibold text-gray-900">{attachmentCount}</div>
            <div>Files</div>
          </div>
          <div className="rounded-lg bg-gray-50 px-3 py-2 text-center">
            <div className="font-semibold text-gray-900">{linkGroupCount}</div>
            <div>Groups</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4 flex-shrink-0">
          <a
            href={detailsHref}
            className="inline-flex items-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
          >
            <FaInfoCircle className="mr-1" />
            View Details
          </a>
          {destinationUrl && (
            <a
              href={destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
            >
              <FaExternalLinkAlt className="mr-1" />
              Open Link
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const PublicExternalLinkSections = ({ typeEntries, collectionId }) => (
  <div className="space-y-10">
    {typeEntries.map(([typeName, links]) => (
      <section key={typeName} className="space-y-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
            <FaGlobe className="text-xs" />
            {getExternalLinkTypeLabel(typeName)}
          </span>
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-sm font-medium text-slate-500">
            {links.length} {links.length === 1 ? "link" : "links"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-8 auto-rows-fr md:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <ExternalCollectionCard
              key={link.id}
              link={link}
              collectionId={collectionId}
            />
          ))}
        </div>
      </section>
    ))}
  </div>
);

const PublicCollectionPage = () => {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [resourceTypes, setResourceTypes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);

  useEffect(() => {
    const loadCollectionAndTypes = async () => {
      try {
        setLoading(true);

        // Try to fetch by slug first (for readable URLs), then fall back to ID
        let collectionData;
        try {
          // First try as a slug (contains hyphens and is not a UUID format)
          if (
            id &&
            id.includes("-") &&
            !id.match(
              /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            )
          ) {
            collectionData = await fetchSharedCollectionBySlug(id);
          } else {
            // Fall back to ID-based lookup for backward compatibility
            collectionData = await fetchSharedCollection(id);
          }
        } catch (slugError) {
          // If slug lookup fails, try ID lookup as fallback
          collectionData = await fetchSharedCollection(id);
        }

        // Fetch resource types in parallel
        const resourceTypesData = await fetchPublicResourceTypes().catch(
          () => null
        );

        setCollection(collectionData);
        setResourceTypes(resourceTypesData);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCollectionAndTypes();
    }
  }, [id]);

  const openResourceModal = (resource) => {
    setSelectedResource(resource);
    setShowResourceModal(true);
  };

  const closeResourceModal = () => {
    setSelectedResource(null);
    setShowResourceModal(false);
  };

  const filteredResources =
    collection?.resources?.filter((resource) => {
      const matchesCategory =
        selectedCategory === "all" ||
        resource.typeId.toString() === selectedCategory;
      const searchValue = searchTerm.toLowerCase();
      const matchesSearch =
        !searchValue ||
        resource.name.toLowerCase().includes(searchValue) ||
        stripHtml(resource.description)
          .toLowerCase()
          .includes(searchValue) ||
        stripHtml(resource.collectionNotes).toLowerCase().includes(searchValue);
      return matchesCategory && matchesSearch;
    }) || [];

  const featuredResources =
    collection?.resources?.filter((r) => r.featured) || [];
  const uniqueTypes = [
    ...new Set(collection?.resources?.map((r) => r.typeId) || []),
  ];
  const filteredExternalLinks = useMemo(
    () =>
      collection?.externalLinks?.filter((link) => {
        const matchesCategory =
          collection?.type !== "external" ||
          selectedCategory === "all" ||
          (link.type || "link") === selectedCategory;
        const searchValue = searchTerm.toLowerCase();
        const matchesSearch =
          !searchValue ||
          link.name?.toLowerCase().includes(searchValue) ||
          stripHtml(link.description).toLowerCase().includes(searchValue) ||
          stripHtml(link.notes).toLowerCase().includes(searchValue) ||
          (link.tags || []).some((tag) =>
            tag.name?.toLowerCase().includes(searchValue)
          );

        return matchesCategory && matchesSearch;
      }) || [],
    [collection?.externalLinks, collection?.type, searchTerm, selectedCategory]
  );
  const allExternalTypeEntries = useMemo(
    () =>
      buildSortedExternalLinkTypeEntries(
        collection?.externalLinks || [],
        collection?.typeOrdering
      ),
    [collection?.externalLinks, collection?.typeOrdering]
  );
  const filteredExternalTypeEntries = useMemo(
    () =>
      buildSortedExternalLinkTypeEntries(
        filteredExternalLinks,
        collection?.typeOrdering
      ),
    [collection?.typeOrdering, filteredExternalLinks]
  );
  const uniqueExternalTypes = allExternalTypeEntries.map(([typeName]) => typeName);
  const externalCollectionStats = (collection?.externalLinks || []).reduce(
    (totals, link) => {
      totals.notes += link.notations?.length || 0;
      totals.attachments += link.attachments?.length || 0;
      totals.linkGroups += link.linkGroups?.length || 0;
      return totals;
    },
    { notes: 0, attachments: 0, linkGroups: 0 }
  );
  const hasAdditionalExternalLinks = collection?.type !== "external" &&
    (collection?.externalLinks?.length || 0) > 0;
  const hasCollectionMatches =
    filteredResources.length > 0 || filteredExternalLinks.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-blue-600 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Loading Collection
          </h2>
          <p className="text-gray-600">Preparing your learning experience...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <FaExclamationTriangle className="text-6xl text-red-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Collection Unavailable
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-8 py-3 rounded-full hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (collection?.type === "external") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-600 to-slate-900 opacity-90"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center text-white">
              <div className="mb-8">
                <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
                  <FaExternalLinkAlt className="text-2xl mr-3" />
                  <span className="text-lg font-medium">
                    Curated Link Collection
                  </span>
                </div>

                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight break-words">
                  {collection?.name}
                </h1>

                <div className="mx-auto max-w-4xl">
                  <div
                    className="public-hero-html mb-8 text-xl leading-relaxed text-blue-100 md:text-2xl"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(collection?.description),
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-blue-100">
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <FaExternalLinkAlt className="mr-2" />
                  <span>{collection?.externalLinks?.length || 0} Links</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <FaFileAlt className="mr-2" />
                  <span>{externalCollectionStats.notes} Public Notes</span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <FaPaperclip className="mr-2" />
                  <span>
                    {externalCollectionStats.attachments} Public Files
                  </span>
                </div>
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <FaClock className="mr-2" />
                  <span>Updated {formatDate(collection?.updatedAt)}</span>
                </div>
              </div>

              <div className="mt-12">
                <button
                  onClick={() =>
                    document
                      .getElementById("links")
                      .scrollIntoView({ behavior: "smooth" })
                  }
                  className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Explore Links
                  <FaChevronRight className="inline ml-2" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <CollectionVideoPlaylist collection={collection} />

        <div id="links" className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Explore All Links
              </h2>
              <p className="text-xl text-gray-600">
                Browse the public and unlisted links curated in this collection
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="space-y-4">
                <div className="relative">
                  <FaSearch className="absolute left-4 top-1/2 h-5 w-5 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search links, descriptions, notes, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      selectedCategory === "all"
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All ({collection?.externalLinks?.length || 0})
                  </button>
                  {uniqueExternalTypes.map((type) => {
                    const count =
                      collection?.externalLinks?.filter(
                        (link) => (link.type || "link") === type
                      ).length || 0;

                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedCategory(type)}
                        className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center ${
                          selectedCategory === type
                            ? "bg-blue-600 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <FaGlobe className="mr-2" />
                        {getExternalLinkTypeLabel(type)} ({count})
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {filteredExternalLinks.length === 0 ? (
              <div className="text-center py-16">
                <FaSearch className="text-6xl text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  No Links Found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <PublicExternalLinkSections
                typeEntries={filteredExternalTypeEntries}
                collectionId={collection.id}
              />
            )}
          </div>
        </div>

        <footer className="bg-gray-900 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                  <FaExternalLinkAlt className="text-2xl" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Keep Exploring</h3>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  This collection exposes only the links and details that were
                  marked public or unlisted for sharing.
                </p>
              </div>

              <div className="border-t border-gray-800 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
                  <div className="mb-4 md:mb-0">
                    <p>Collection: {collection?.name}</p>
                    <p>Last updated: {formatDate(collection?.updatedAt)}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() =>
                        navigator.share &&
                        navigator.share({
                          title: collection?.name,
                          text: stripHtml(collection?.description),
                          url: window.location.href,
                        })
                      }
                      className="flex items-center hover:text-white transition-colors"
                    >
                      <FaShare className="mr-1" />
                      Share Collection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-600 to-slate-900 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center text-white">
            <div className="mb-8">
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
                <FaGraduationCap className="text-2xl mr-3" />
                <span className="text-lg font-medium">Learning Collection</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight break-words">
                {collection?.name}
              </h1>

              <div className="mx-auto max-w-4xl">
                <div
                  className="public-hero-html mb-8 text-xl leading-relaxed text-blue-100 md:text-2xl"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(collection?.description),
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-blue-100">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <FaBookOpen className="mr-2" />
                <span>{collection?.resources?.length || 0} Resources</span>
              </div>
              {featuredResources.length > 0 && (
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                  <FaStar className="mr-2 text-blue-400" />
                  <span>{featuredResources.length} Featured</span>
                </div>
              )}
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <FaClock className="mr-2" />
                <span>Updated {formatDate(collection?.updatedAt)}</span>
              </div>
            </div>

            <div className="mt-12">
              <button
                onClick={() =>
                  document
                    .getElementById("resources")
                    .scrollIntoView({ behavior: "smooth" })
                }
                className="bg-white text-blue-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                Start Learning
                <FaChevronRight className="inline ml-2" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <CollectionVideoPlaylist collection={collection} />

      {/* Featured Resources */}
      {featuredResources.length > 0 && (
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Featured Resources
              </h2>
              <p className="text-xl text-gray-600">
                Start with these highlighted materials
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
              {featuredResources.map((resource) => {
                const IconComponent = getResourceIcon(
                  resource.typeId,
                  resourceTypes
                );
                const playableVideoUrl = getPlayableVideoUrl(
                  resource.videoUrl,
                  resource.url
                );
                const playableVideoType = getVideoType(playableVideoUrl);
                const normalizedPlayableVideoUrl =
                  normalizeVideoUrl(playableVideoUrl);
                const videoId = getYouTubeVideoId(
                  resource.videoUrl || resource.url
                );

                return (
                  <div
                    key={resource.id}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100 cursor-pointer flex flex-col h-full"
                    onClick={() => openResourceModal(resource)}
                  >
                    {resource.imageUrl || resource.presignedImageUrl ? (
                      // Priority 1: Resource image if available
                      <div className="relative h-48 bg-gray-100 flex-shrink-0">
                        <img
                          src={resource.imageUrl || resource.presignedImageUrl}
                          alt={resource.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                            <FaStar className="mr-1" />
                            Featured
                          </span>
                        </div>
                        {/* Show play button if it's also a video */}
                        {videoId && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform duration-300">
                              <FaPlay className="text-2xl text-blue-600" />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : videoId ? (
                      // Priority 2: YouTube thumbnail if no resource image but has video
                      <div className="relative h-48 bg-gray-900 flex-shrink-0">
                        <YouTubeThumbnail
                          videoId={videoId}
                          alt={resource.name}
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-white/90 backdrop-blur-sm rounded-full p-4 group-hover:scale-110 transition-transform duration-300">
                            <FaPlay className="text-2xl text-blue-600" />
                          </div>
                        </div>
                        <div className="absolute top-4 left-4">
                          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center">
                            <FaStar className="mr-1" />
                            Featured
                          </span>
                        </div>
                      </div>
                    ) : null}

                    <div className="p-6 flex flex-col flex-grow">
                      {/* Header with type badge */}
                      <div className="flex items-center justify-between mb-4 flex-shrink-0">
                        <div
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white bg-gradient-to-r ${getResourceTypeColor(
                            resource.typeId,
                            resourceTypes
                          )}`}
                        >
                          <IconComponent className="mr-2" />
                          {getResourceTypeName(resource.typeId, resourceTypes)}
                        </div>
                        {!videoId && resource.featured && (
                          <FaStar className="text-blue-500" />
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors flex-shrink-0 leading-tight">
                        {resource.name}
                      </h3>

                      {/* Description - takes up available space */}
                      <div className="flex-grow mb-4">
                        <p className="text-gray-600 leading-relaxed">
                          {truncateHtml(resource.description, 180)}
                        </p>
                      </div>

                      {/* Collection Notes */}
                      {resource.collectionNotes && (
                        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded-r-lg flex-shrink-0">
                          <p className="text-sm text-blue-800 leading-relaxed">
                            <strong>Notes:</strong>{" "}
                            {truncateHtml(resource.collectionNotes, 100)}
                          </p>
                        </div>
                      )}

                      {/* Footer - always at bottom */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 flex-shrink-0">
                        {resource.resourceDate && (
                          <div className="flex items-center text-sm text-gray-500">
                            <FaClock className="mr-1" />
                            {formatDate(resource.resourceDate)}
                          </div>
                        )}

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openResourceModal(resource);
                            }}
                            className="inline-flex items-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                          >
                            <FaInfoCircle className="mr-1" />
                            Details
                          </button>
                          {(resource.url || normalizedPlayableVideoUrl) && (
                            playableVideoType === "instagram" &&
                            normalizedPlayableVideoUrl ? (
                              <a
                                href={normalizedPlayableVideoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-pink-500/20 bg-pink-500/10 text-pink-500 transition-colors duration-200 hover:border-pink-500/40 hover:bg-pink-500/20"
                                title="Open on Instagram"
                                aria-label="Open on Instagram"
                              >
                                <FaInstagram className="h-5 w-5" />
                              </a>
                            ) : (
                              <a
                                href={resource.url || normalizedPlayableVideoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                {resource.videoUrl ? (
                                  <>
                                    <FaPlay className="mr-1" />
                                    Watch
                                  </>
                                ) : (
                                  <>
                                    <FaExternalLinkAlt className="mr-1" />
                                    View
                                  </>
                                )}
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Section */}
      <div id="resources" className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Explore All Resources
            </h2>
            <p className="text-xl text-gray-600">
              Discover and learn at your own pace
            </p>
            {hasAdditionalExternalLinks && (
              <p className="mt-3 text-sm text-gray-500">
                Search also matches descriptions and notes on the additional
                external links in this collection.
              </p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="space-y-4">
              <div className="relative">
                <FaSearch className="absolute left-4 top-1/2 h-5 w-5 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources, notes, and external links..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-base border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    selectedCategory === "all"
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All ({collection?.resources?.length || 0})
                </button>
                {uniqueTypes.map((typeId) => {
                  const count =
                    collection?.resources?.filter((r) => r.typeId === typeId)
                      .length || 0;
                  const IconComponent = getResourceIcon(typeId, resourceTypes);
                  return (
                    <button
                      key={typeId}
                      onClick={() => setSelectedCategory(typeId.toString())}
                      className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center ${
                        selectedCategory === typeId.toString()
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <IconComponent className="mr-2" />
                      {getResourceTypeName(typeId, resourceTypes)} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Results */}
          {!hasCollectionMatches ? (
            <div className="text-center py-16">
              <FaSearch className="text-6xl text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                No Items Found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {filteredResources.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 auto-rows-fr">
                  {filteredResources.map((resource) => {
                    const IconComponent = getResourceIcon(
                      resource.typeId,
                      resourceTypes
                    );
                    const playableVideoUrl = getPlayableVideoUrl(
                      resource.videoUrl,
                      resource.url
                    );
                    const playableVideoType = getVideoType(playableVideoUrl);
                    const normalizedPlayableVideoUrl =
                      normalizeVideoUrl(playableVideoUrl);
                    const videoId = getYouTubeVideoId(
                      resource.videoUrl || resource.url
                    );

                    return (
                      <div
                        key={resource.id}
                        className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-pointer flex flex-col h-full"
                        onClick={() => openResourceModal(resource)}
                      >
                        {resource.imageUrl || resource.presignedImageUrl ? (
                          // Priority 1: Resource image if available
                          <div className="relative h-48 bg-gray-100 flex-shrink-0">
                            <img
                              src={
                                resource.imageUrl || resource.presignedImageUrl
                              }
                              alt={resource.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to placeholder on error
                                e.target.style.display = "none";
                                e.target.nextElementSibling.style.display =
                                  "flex";
                              }}
                            />
                            <div className="absolute inset-0 hidden flex-col items-center justify-center bg-gradient-to-r from-blue-700 to-blue-900 text-white">
                              <span className="text-xl font-semibold opacity-90 p-4 text-center">
                                {resource.name}
                              </span>
                            </div>
                            {resource.featured && (
                              <div className="absolute top-3 left-3">
                                <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                                  <FaStar className="mr-1" />
                                  Featured
                                </span>
                              </div>
                            )}
                            {/* Show play button if it's also a video */}
                            {videoId && (
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                                  <FaPlay className="text-xl text-blue-600" />
                                </div>
                              </div>
                            )}
                          </div>
                        ) : videoId ? (
                          // Priority 2: YouTube thumbnail if no resource image but has video
                          <div className="relative h-48 bg-gray-900 flex-shrink-0">
                            <YouTubeThumbnail
                              videoId={videoId}
                              alt={resource.name}
                              className="w-full h-full object-cover opacity-80"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                                <FaPlay className="text-xl text-blue-600" />
                              </div>
                            </div>
                            {resource.featured && (
                              <div className="absolute top-3 left-3">
                                <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                                  <FaStar className="mr-1" />
                                  Featured
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          // Priority 3: Fallback gradient with resource name
                          <div className="relative h-48 bg-gradient-to-r from-blue-700 to-blue-900 flex-shrink-0">
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                              <span className="text-xl font-semibold opacity-90 p-4 text-center">
                                {resource.name}
                              </span>
                            </div>
                            {resource.featured && (
                              <div className="absolute top-3 left-3">
                                <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                                  <FaStar className="mr-1" />
                                  Featured
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="p-6 flex flex-col flex-grow">
                          {/* Header with type badge */}
                          <div className="flex items-center justify-between mb-4 flex-shrink-0">
                            <div
                              className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium text-white bg-gradient-to-r ${getResourceTypeColor(
                                resource.typeId,
                                resourceTypes
                              )}`}
                            >
                              <IconComponent className="mr-2" />
                              {getResourceTypeName(resource.typeId, resourceTypes)}
                            </div>
                            {!videoId && resource.featured && (
                              <FaStar className="text-blue-500" />
                            )}
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors flex-shrink-0 leading-tight">
                            {resource.name}
                          </h3>

                          {/* Description - takes up available space */}
                          <div className="flex-grow mb-4">
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {truncateHtml(resource.description, 200)}
                            </p>
                          </div>

                          {/* Collection Notes */}
                          {resource.collectionNotes && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded-r flex-shrink-0">
                              <p className="text-xs text-blue-800 leading-relaxed">
                                <strong>Note:</strong>{" "}
                                {truncateHtml(resource.collectionNotes, 120)}
                              </p>
                            </div>
                          )}

                          {/* Footer - always at bottom */}
                          <div className="flex items-center justify-between pt-4 border-t border-gray-100 flex-shrink-0">
                            {resource.resourceDate && (
                              <div className="flex items-center text-xs text-gray-500">
                                <FaClock className="mr-1" />
                                {formatDate(resource.resourceDate)}
                              </div>
                            )}

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openResourceModal(resource);
                                }}
                                className="inline-flex items-center bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium"
                              >
                                <FaInfoCircle className="mr-1" />
                                Details
                              </button>
                              {(resource.url || normalizedPlayableVideoUrl) && (
                                playableVideoType === "instagram" &&
                                normalizedPlayableVideoUrl ? (
                                  <a
                                    href={normalizedPlayableVideoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-pink-500/20 bg-pink-500/10 text-pink-500 transition-colors duration-200 hover:border-pink-500/40 hover:bg-pink-500/20"
                                    title="Open on Instagram"
                                    aria-label="Open on Instagram"
                                  >
                                    <FaInstagram className="h-4 w-4" />
                                  </a>
                                ) : (
                                  <a
                                    href={
                                      resource.url || normalizedPlayableVideoUrl
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors text-xs font-medium"
                                  >
                                    {resource.videoUrl ? (
                                      <>
                                        <FaPlay className="mr-1" />
                                        View
                                      </>
                                    ) : (
                                      <>
                                        <FaExternalLinkAlt className="mr-1" />
                                        View
                                      </>
                                    )}
                                  </a>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {hasAdditionalExternalLinks && filteredExternalLinks.length > 0 && (
                <div>
                  <div className="text-center mb-8">
                    <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
                      Additional Links
                    </h3>
                    <p className="text-lg text-gray-600">
                      Related external items included in this collection
                    </p>
                  </div>

                  <PublicExternalLinkSections
                    typeEntries={filteredExternalTypeEntries}
                    collectionId={collection.id}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <FaGraduationCap className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Keep Learning</h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                This collection has been curated to provide you with valuable
                learning resources. Bookmark this page and return anytime.
              </p>
            </div>

            <div className="border-t border-gray-800 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
                <div className="mb-4 md:mb-0">
                  <p>Collection: {collection?.name}</p>
                  <p>Last updated: {formatDate(collection?.updatedAt)}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() =>
                      navigator.share &&
                      navigator.share({
                        title: collection?.name,
                        text: stripHtml(collection?.description),
                        url: window.location.href,
                      })
                    }
                    className="flex items-center hover:text-white transition-colors"
                  >
                    <FaShare className="mr-1" />
                    Share Collection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Resource Detail Modal */}
      <ResourceDetailModal
        resource={selectedResource}
        isOpen={showResourceModal}
        onClose={closeResourceModal}
        resourceTypes={resourceTypes}
      />
    </div>
  );
};

export default PublicCollectionPage;
