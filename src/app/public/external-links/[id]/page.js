"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  FaPlay,
  FaPlayCircle,
  FaVideo,
  FaExternalLinkAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaSearch,
  FaTimes,
  FaFilter,
  FaShare,
  FaGlobe,
  FaLock,
  FaDownload,
  FaPaperclip,
  FaExpand,
  FaCompress,
  FaChevronDown,
  FaChevronUp,
  FaTag,
  FaStar,
  FaLink,
  FaFileAlt,
  FaImage,
  FaFilePdf,
  FaFileVideo,
  FaRegStickyNote,
  FaClock,
  FaInfoCircle,
  FaCalendar,
  FaComment,
  FaCalendarAlt,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  fetchSharedCollection,
  getPublicExternalLinkJson,
} from "@/app/api/shareApi";
import {
  formatDateRangeShort,
  formatDayOfWeekRange,
  getDateRangeValues,
} from "@/app/utils/general";
// Removed NotationsList import as we'll create PublicNotationsList
import DOMPurify from "dompurify";
import CustomEditor from "@/app/components/common/CustomEditor";
import { DateTime } from "luxon";
import Calendar from "@/app/components/events/Calendar";
import TagClassificationEnhanced from "@/app/components/TagClassificationEnhanced";
import ResourceDetailModal from "@/app/components/modals/ResourceDetailModal";
import SimplePublicNotationForm from "@/app/components/forms/SimplePublicNotationForm";
import {
  sanitizeHtml as sanitizeHtmlSafe,
  stripHtmlToText as stripHtmlToTextSafe,
} from "@/app/utils/sanitizeHtml";
import CollectionVideoPlaylist from "@/app/components/CollectionVideoPlaylist";

// Status options for notations
const NOTATION_STATUS_OPTIONS = [
  { id: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { id: "active", label: "Active", color: "bg-blue-100 text-blue-700" },
  { id: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
  { id: "waiting", label: "Waiting", color: "bg-orange-100 text-orange-700" },
  {
    id: "in progress",
    label: "In Progress",
    color: "bg-purple-100 text-purple-700",
  },
  { id: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
  {
    id: "large reference",
    label: "Large Reference",
    color: "bg-pink-100 text-pink-700",
  },
  { id: "archived", label: "Archived", color: "bg-gray-100 text-gray-700" },
  { id: "default", label: "Unknown", color: "bg-gray-100 text-gray-700" },
];

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  const regExp =
    /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

const sanitizeHtml = (html) => sanitizeHtmlSafe(html);
const stripHtml = (html) => stripHtmlToTextSafe(html);

// Helper function to extract Vimeo video ID and hash
const extractVimeoIdAndHash = (url) => {
  if (!url) return { id: null, hash: null };
  // Handle Vimeo URLs with optional hash parameter
  const watchMatch = url.match(/vimeo\.com\/(\d+)(?:\/([a-zA-Z0-9]+))?/);
  if (watchMatch) {
    return { id: watchMatch[1], hash: watchMatch[2] || null };
  }
  const playerMatch = url.match(
    /player\.vimeo\.com\/video\/(\d+)(?:\?[^#]*\bh=([a-zA-Z0-9]+))?/
  );
  if (playerMatch) {
    return { id: playerMatch[1], hash: playerMatch[2] || null };
  }
  return { id: null, hash: null };
};

// Helper function to extract Vimeo video ID (simplified version)
const getVimeoVideoId = (url) => {
  const result = extractVimeoIdAndHash(url);
  return result.id;
};

// Helper function to extract timestamp from YouTube URL
const getYouTubeTimestamp = (url) => {
  if (!url) return null;

  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    // Check for 't' parameter (e.g., ?t=120s or ?t=2m30s)
    const tParam = params.get("t");
    if (tParam) {
      // Parse different formats: 120s, 2m30s, or just 120
      const match = tParam.match(/^(?:(\d+)m)?(?:(\d+)s?)?$/);
      if (match) {
        const minutes = parseInt(match[1] || 0);
        const seconds = parseInt(match[2] || tParam);
        return minutes * 60 + seconds;
      }
      // If it's just a number, treat it as seconds
      const numericValue = parseInt(tParam);
      if (!isNaN(numericValue)) {
        return numericValue;
      }
    }

    // Also check for 'start' parameter (already in seconds)
    const startParam = params.get("start");
    if (startParam) {
      const startValue = parseInt(startParam);
      if (!isNaN(startValue)) {
        return startValue;
      }
    }
  } catch (e) {
    // Invalid URL, return null
  }

  return null;
};

// Helper function to extract timestamp from Vimeo URL
const getVimeoTimestamp = (url) => {
  if (!url) return 0;
  const frag = url.split("#")[1];
  if (!frag) return 0;
  const m = frag.match(/t=(?:(\d+)m)?(?:(\d+)s)?|t=(\d+)/);
  if (!m) return 0;
  if (m[3]) return parseInt(m[3], 10);
  const minutes = m[1] ? parseInt(m[1], 10) : 0;
  const seconds = m[2] ? parseInt(m[2], 10) : 0;
  return minutes * 60 + seconds;
};

// Helper function to get Vimeo embed URL with proper hash and timestamp
const getVimeoEmbedUrl = (url, timestamp = 0) => {
  const { id, hash } = extractVimeoIdAndHash(url);
  if (!id) return null;
  const query = hash ? `?h=${hash}&autoplay=1` : `?autoplay=1`;
  const base = `https://player.vimeo.com/video/${id}${query}`;
  const t = Math.max(0, Math.floor(timestamp));
  return t > 0 ? `${base}#t=${t}s` : base;
};

// YouTube Thumbnail Component
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

  return (
    <img
      src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        if (e.target.src.includes("hqdefault")) {
          e.target.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
        } else if (e.target.src.includes("mqdefault")) {
          e.target.src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
        }
      }}
    />
  );
};

// Get video thumbnail from various sources
const getVideoThumbnail = (video) => {
  // Check for videoThumbnailUrl property (for video attachments)
  if (video.videoThumbnailUrl) return video.videoThumbnailUrl;

  // Check for thumbnail property
  if (video.thumbnail) return video.thumbnail;

  // Check for preview image in attachments
  if (video.previewImage) return video.previewImage;

  // Check for YouTube video ID
  const youtubeId = getYouTubeVideoId(video.url);
  if (youtubeId) return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;

  // Check for Vimeo video ID
  const vimeoId = getVimeoVideoId(video.url);
  if (vimeoId) {
    // Vimeo doesn't provide direct thumbnail URLs like YouTube
    // We'll need to handle this differently, perhaps with a placeholder
    // or by fetching from Vimeo's API (requires additional setup)
    return null; // For now, we'll handle Vimeo thumbnails separately
  }

  return null;
};

const TEXT_PREVIEW_EXTENSIONS = new Set([
  "txt",
  "text",
  "md",
  "markdown",
  "csv",
  "tsv",
  "json",
  "xml",
  "yml",
  "yaml",
  "log",
]);

const IMAGE_PREVIEW_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "svg",
  "bmp",
]);

const VIDEO_PREVIEW_EXTENSIONS = new Set([
  "mp4",
  "mov",
  "avi",
  "mkv",
  "webm",
  "mpeg",
]);

const AUDIO_PREVIEW_EXTENSIONS = new Set([
  "mp3",
  "wav",
  "ogg",
  "m4a",
  "aac",
]);

const normalizeContentType = (contentType = "") =>
  contentType.split(";")[0].trim().toLowerCase();

const getAttachmentExtension = (attachment) => {
  const candidates = [
    attachment?.imageKey,
    attachment?.title,
    attachment?.name,
    attachment?.presignedUrl,
  ];

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "string") continue;
    const cleaned = candidate.split("?")[0].split("#")[0];
    const match = cleaned.match(/\.([a-z0-9]+)$/i);
    if (match?.[1]) {
      return match[1].toLowerCase();
    }
  }

  if (attachment?.type && attachment.type !== "image" && attachment.type !== "video") {
    return attachment.type.toLowerCase();
  }

  return "";
};

const getAttachmentFilename = (attachment) => {
  const baseName =
    attachment?.title?.trim() || attachment?.name?.trim() || "attachment";
  const ext = getAttachmentExtension(attachment);
  const safeBaseName = baseName.replace(/[\\/:*?"<>|]+/g, "_");

  if (!ext || safeBaseName.toLowerCase().endsWith(`.${ext}`)) {
    return safeBaseName;
  }

  return `${safeBaseName}.${ext}`;
};

const resolveAttachmentPreviewKind = (attachment, contentType = "") => {
  const normalizedType = normalizeContentType(contentType);
  const extension = getAttachmentExtension(attachment);

  if (
    attachment?.type === "image" ||
    normalizedType.startsWith("image/") ||
    IMAGE_PREVIEW_EXTENSIONS.has(extension)
  ) {
    return "image";
  }

  if (
    attachment?.type === "video" ||
    normalizedType.startsWith("video/") ||
    VIDEO_PREVIEW_EXTENSIONS.has(extension)
  ) {
    return "video";
  }

  if (
    attachment?.type === "pdf" ||
    normalizedType === "application/pdf" ||
    extension === "pdf"
  ) {
    return "pdf";
  }

  if (
    normalizedType.startsWith("audio/") ||
    AUDIO_PREVIEW_EXTENSIONS.has(extension)
  ) {
    return "audio";
  }

  if (
    normalizedType.startsWith("text/") ||
    [
      "application/json",
      "application/ld+json",
      "application/xml",
      "application/javascript",
      "application/x-javascript",
      "application/x-yaml",
      "application/yaml",
      "text/csv",
      "application/csv",
      "text/tab-separated-values",
    ].includes(normalizedType) ||
    TEXT_PREVIEW_EXTENSIONS.has(extension)
  ) {
    return "text";
  }

  return "unsupported";
};

const ensurePreviewBlobType = (blob, contentType = "") => {
  const normalizedType = normalizeContentType(contentType);

  if (blob.type || !normalizedType) {
    return blob;
  }

  return new Blob([blob], { type: normalizedType });
};

const downloadAttachmentFile = async (attachment) => {
  if (!attachment?.presignedUrl) {
    toast.error("Attachment download is unavailable");
    return;
  }

  try {
    const response = await fetch(attachment.presignedUrl);
    if (!response.ok) {
      throw new Error(`Download failed with status ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = getAttachmentFilename(attachment);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  } catch (error) {
    console.error("Failed to download attachment:", error);
    toast.error("Unable to download this attachment");
  }
};

// Video Card Component
const VideoCard = ({ video, onPlay }) => {
  const youtubeId = getYouTubeVideoId(video.url);
  const vimeoId = getVimeoVideoId(video.url);
  const isYouTube = !!youtubeId;
  const isVimeo = !!vimeoId;
  const thumbnail = getVideoThumbnail(video);

  return (
    <div
      className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden cursor-pointer flex flex-col"
      onClick={() => onPlay(video)}
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gray-900 flex-shrink-0">
        {thumbnail ? (
          <>
            <img
              src={thumbnail}
              alt={video.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "flex";
              }}
            />
            <div className="w-full h-full hidden items-center justify-center bg-gray-800">
              <FaVideo className="text-3xl text-gray-400" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                <FaPlay className="text-xl text-indigo-600" />
              </div>
            </div>
          </>
        ) : video.isAttachment && video.url ? (
          // For video attachments without thumbnails, use HTML5 video preview
          <>
            <video
              src={video.url}
              className="w-full h-full object-cover"
              preload="metadata"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                <FaPlay className="text-xl text-indigo-600" />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-800">
            <FaVideo className="text-3xl text-gray-400" />
          </div>
        )}
        {video.isAttachment && (
          <div className="absolute top-2 left-2">
            <span className="bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
              <FaPaperclip className="mr-1 text-xs" />
              Attachment
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
          {video.name}
        </h3>

        {video.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-2 flex-grow">
            {stripHtml(video.description)}
          </p>
        )}

        {/* Tags */}
        {video.tags && video.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {video.tags.slice(0, 2).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: `${tag.color}20`,
                  borderColor: tag.color,
                  color: tag.color,
                }}
              >
                {tag.name}
              </span>
            ))}
            {video.tags.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{video.tags.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {video.createdAt && (
            <div className="flex items-center text-xs text-gray-500">
              <FaClock className="mr-1 text-xs" />
              {new Date(video.createdAt).toLocaleDateString()}
            </div>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(video.url, "_blank");
            }}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 text-xs font-medium"
          >
            <FaExternalLinkAlt className="mr-1 text-xs" />
            Open
          </button>
        </div>
      </div>
    </div>
  );
};

// Import parseTimestamps function at the top of the component
const parseTimestamps = (description) => {
  if (!description) return [];

  // Handle escaped newlines and normalize the string
  const normalizedDescription = description
    .replace(/\\\\n/g, "\n")
    .replace(/\\n/g, "\n");

  // Get the content after "Timestamps" (case insensitive)
  const timestampSection = normalizedDescription
    .split(/timestamps:?\s*/i)[1]
    ?.trim();

  if (!timestampSection) return [];

  // Split into lines and filter out empty lines
  const lines = timestampSection
    .split(/[\n\\]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      try {
        // Match pattern: "Topic at: MM:SS" or just "Topic: MM:SS"
        const match = line.match(/(.+?)(?:\s+at:\s*|\s*:\s*)(\d+):(\d+)$/);
        if (!match) {
          return null;
        }

        const [_, title, minutes, seconds] = match;
        const mins = parseInt(minutes);
        const secs = parseInt(seconds);

        // Validate time values
        if (isNaN(mins) || isNaN(secs) || secs >= 60) {
          return null;
        }

        const totalSeconds = mins * 60 + secs;

        return {
          title: title.trim(),
          timestamp: totalSeconds,
          formattedTime: `${mins}:${secs.toString().padStart(2, "0")}`,
        };
      } catch (error) {
        console.error("Error parsing timestamp line:", line, error);
        return null;
      }
    })
    .filter(Boolean);
};

// Video Detail Modal
const VideoDetailModal = ({ video, isOpen, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [showTimestamps, setShowTimestamps] = useState(true);

  if (!isOpen || !video) return null;

  const youtubeId = getYouTubeVideoId(video.url);
  const vimeoId = getVimeoVideoId(video.url);
  const youtubeTimestamp = getYouTubeTimestamp(video.url);
  const vimeoTimestamp = getVimeoTimestamp(video.url);

  // Parse timestamps from video description or timestamps field
  const timestamps = video.timestamps ? parseTimestamps(video.timestamps) : [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl transition-all duration-300 ${
          isExpanded
            ? "max-w-6xl w-full max-h-[90vh]"
            : "max-w-4xl w-full max-h-[80vh]"
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-xl font-bold text-gray-900 line-clamp-1">
            {video.name}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title={isExpanded ? "Compress" : "Expand"}
            >
              {isExpanded ? (
                <FaCompress className="text-gray-500" />
              ) : (
                <FaExpand className="text-gray-500" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FaTimes className="text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="p-6 overflow-y-auto"
          style={{
            maxHeight: isExpanded ? "calc(90vh - 80px)" : "calc(80vh - 80px)",
          }}
        >
          {/* Video Player */}
          {(youtubeId || vimeoId || video.isAttachment) && (
            <div className="mb-6">
              <div
                className={`relative bg-gray-900 rounded-xl overflow-hidden shadow-lg ${
                  isExpanded ? "h-96" : "h-80"
                }`}
              >
                {youtubeId ? (
                  <iframe
                    key={`youtube-${currentTimestamp}`}
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&start=${
                      currentTimestamp || youtubeTimestamp || 0
                    }`}
                    title={video.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : vimeoId ? (
                  <iframe
                    key={`vimeo-${currentTimestamp}`}
                    width="100%"
                    height="100%"
                    src={getVimeoEmbedUrl(
                      video.url,
                      currentTimestamp || vimeoTimestamp
                    )}
                    title={video.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                ) : (
                  <video
                    controls
                    autoPlay
                    className="absolute inset-0 w-full h-full object-contain"
                    src={video.url}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            </div>
          )}

          {/* Timestamps Section */}
          {timestamps.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaClock className="mr-2 text-blue-500" />
                  Timestamps
                </h3>
                <button
                  onClick={() => setShowTimestamps(!showTimestamps)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showTimestamps ? "Hide" : "Show"} ({timestamps.length})
                </button>
              </div>

              {showTimestamps && (
                <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
                  <div className="space-y-1">
                    {timestamps.map((item, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentTimestamp(item.timestamp)}
                        className={`w-full text-left px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 flex items-center justify-between group ${
                          currentTimestamp === item.timestamp
                            ? "bg-blue-50 border border-blue-200"
                            : ""
                        }`}
                      >
                        <span className="text-sm text-gray-700 group-hover:text-gray-900">
                          {item.title}
                        </span>
                        <span className="text-xs text-gray-500 font-mono">
                          {item.formattedTime}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {video.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaComment className="mr-2 text-blue-500" />
                Notes
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{video.notes}</p>
              </div>
            </div>
          )}

          {/* Description */}
          {video.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaInfoCircle className="mr-2 text-blue-500" />
                Description
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(video.description),
                  }}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {video.tags && video.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <FaTag className="mr-2 text-green-500" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {video.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border"
                    style={{
                      backgroundColor: `${tag.color}20`,
                      borderColor: tag.color,
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
            <a
              href={video.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <FaExternalLinkAlt className="mr-2" />
              Open in New Tab
            </a>
            <button
              onClick={onClose}
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

// Image Card Component
const ImageCard = ({ image, onView }) => {
  return (
    <div className="group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer">
      <div className="relative h-40 bg-gray-100" onClick={() => onView(image)}>
        <img
          src={image.presignedUrl}
          alt={image.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button className="bg-white/90 backdrop-blur-sm rounded-full p-3">
              <FaExpand className="text-gray-800" />
            </button>
          </div>
        </div>
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-900 truncate mb-1">
          {image.title || "Untitled"}
        </h3>
        {image.description && (
          <p className="text-sm text-gray-600 line-clamp-1">
            {image.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500">
            {new Date(image.createdAt).toLocaleDateString()}
          </span>
          <a
            href={image.presignedUrl}
            download={image.title}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 text-xs font-medium"
          >
            <FaDownload className="mr-1 text-xs" />
            Download
          </a>
        </div>
      </div>
    </div>
  );
};

// Attachment Card Component
const AttachmentCard = ({ attachment, onPreview, onDownload }) => {
  const getAttachmentIcon = () => {
    // Use type field to determine icon
    if (attachment.type === "image") return FaImage;
    if (attachment.type === "pdf") return FaFilePdf;
    if (attachment.type === "video") return FaFileVideo;

    // Fallback to extension check
    const ext = attachment.presignedUrl
      ?.split(".")
      .pop()
      ?.toLowerCase()
      ?.split("?")[0];
    if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return FaImage;
    if (["pdf"].includes(ext)) return FaFilePdf;
    if (["mp4", "mov", "avi", "mkv"].includes(ext)) return FaFileVideo;
    return FaFileAlt;
  };

  const Icon = getAttachmentIcon();

  return (
    <div
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-4 cursor-pointer border border-gray-200 hover:border-indigo-300"
      onClick={() => onPreview(attachment)}
    >
      <div className="flex items-start gap-3">
        <div className="p-3 bg-gray-100 rounded-lg">
          <Icon className="text-gray-600 text-xl" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">
            {attachment.title || "Untitled"}
          </h4>
          {attachment.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {attachment.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="capitalize">{attachment.type}</span>
            <span>{new Date(attachment.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPreview(attachment);
          }}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          Preview
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDownload(attachment);
          }}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          <FaDownload className="mr-1 text-xs" />
          Download
        </button>
      </div>
    </div>
  );
};

const AttachmentPreviewModal = ({ attachment, isOpen, onClose }) => {
  const [previewState, setPreviewState] = useState({
    status: "idle",
    kind: null,
    objectUrl: "",
    textContent: "",
    error: "",
  });

  useEffect(() => {
    if (!isOpen || !attachment?.presignedUrl) {
      return undefined;
    }

    let objectUrl = "";
    const controller = new AbortController();

    const loadPreview = async () => {
      setPreviewState({
        status: "loading",
        kind: null,
        objectUrl: "",
        textContent: "",
        error: "",
      });

      try {
        const response = await fetch(attachment.presignedUrl, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Preview failed with status ${response.status}`);
        }

        const contentType = response.headers.get("content-type") || "";
        const previewKind = resolveAttachmentPreviewKind(attachment, contentType);
        const blob = await response.blob();

        if (controller.signal.aborted) {
          return;
        }

        if (previewKind === "text") {
          const textContent = await blob.text();
          if (controller.signal.aborted) {
            return;
          }

          setPreviewState({
            status: "ready",
            kind: "text",
            objectUrl: "",
            textContent,
            error: "",
          });
          return;
        }

        if (["image", "video", "pdf", "audio"].includes(previewKind)) {
          const previewBlob = ensurePreviewBlobType(blob, contentType);
          objectUrl = URL.createObjectURL(previewBlob);

          setPreviewState({
            status: "ready",
            kind: previewKind,
            objectUrl,
            textContent: "",
            error: "",
          });
          return;
        }

        setPreviewState({
          status: "ready",
          kind: "unsupported",
          objectUrl: "",
          textContent: "",
          error: "",
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("Failed to load attachment preview:", error);
        setPreviewState({
          status: "error",
          kind: null,
          objectUrl: "",
          textContent: "",
          error: "Preview unavailable for this file. You can still open or download it.",
        });
      }
    };

    loadPreview();

    return () => {
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [attachment, isOpen]);

  if (!isOpen || !attachment) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {attachment.title || "Untitled Attachment"}
            </h3>
            <p className="text-sm text-gray-500">
              {getAttachmentFilename(attachment)}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={attachment.presignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <FaExternalLinkAlt className="mr-2 text-xs" />
              Open Original
            </a>
            <button
              onClick={() => downloadAttachmentFile(attachment)}
              className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <FaDownload className="mr-2 text-xs" />
              Download
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close attachment preview"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div
          className="overflow-y-auto px-6 py-5"
          style={{ maxHeight: "calc(90vh - 76px)" }}
        >
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            {previewState.status === "loading" ? (
              <div className="flex min-h-[22rem] items-center justify-center">
                <div className="text-center">
                  <FaSpinner className="mx-auto mb-4 animate-spin text-3xl text-indigo-600" />
                  <p className="text-sm text-gray-600">Loading preview...</p>
                </div>
              </div>
            ) : previewState.status === "error" ? (
              <div className="flex min-h-[22rem] items-center justify-center">
                <div className="max-w-md text-center">
                  <FaFileAlt className="mx-auto mb-4 text-5xl text-gray-300" />
                  <p className="text-gray-700">{previewState.error}</p>
                </div>
              </div>
            ) : previewState.kind === "text" ? (
              <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white p-4 text-sm leading-6 text-gray-800">
                {previewState.textContent || "This file is empty."}
              </pre>
            ) : previewState.kind === "pdf" ? (
              <iframe
                src={previewState.objectUrl}
                title={attachment.title || "Attachment preview"}
                className="h-[70vh] w-full rounded-lg bg-white"
              />
            ) : previewState.kind === "image" ? (
              <img
                src={previewState.objectUrl}
                alt={attachment.title || "Attachment preview"}
                className="mx-auto max-h-[70vh] w-auto max-w-full rounded-lg object-contain"
              />
            ) : previewState.kind === "video" ? (
              <video
                src={previewState.objectUrl}
                controls
                className="h-[70vh] w-full rounded-lg bg-black object-contain"
              >
                Your browser does not support the video tag.
              </video>
            ) : previewState.kind === "audio" ? (
              <div className="flex min-h-[22rem] items-center justify-center">
                <audio controls src={previewState.objectUrl} className="w-full max-w-2xl">
                  Your browser does not support the audio element.
                </audio>
              </div>
            ) : (
              <div className="flex min-h-[22rem] items-center justify-center">
                <div className="max-w-md text-center">
                  <FaFileAlt className="mx-auto mb-4 text-5xl text-gray-300" />
                  <p className="text-gray-700">
                    Preview is not available for this file type yet.
                  </p>
                  <p className="mt-2 text-sm text-gray-500">
                    Use Open Original or Download to access the file.
                  </p>
                </div>
              </div>
            )}
          </div>

          {attachment.description && (
            <div className="mt-4 rounded-xl bg-white border border-gray-200 p-4">
              <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
                Description
              </h4>
              <p className="text-sm leading-6 text-gray-700">
                {attachment.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Public Notations List Component
const PublicNotationsList = ({ notations }) => {
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [selectedStatuses, setSelectedStatuses] = useState(new Set());
  const [tagFilterMode, setTagFilterMode] = useState("OR");
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  // Extract all unique tags from notations
  const availableTags = useMemo(() => {
    const tagMap = new Map();
    (notations || []).forEach((notation) => {
      if (notation.tags && Array.isArray(notation.tags)) {
        notation.tags.forEach((tag) => {
          if (!tagMap.has(tag.id)) {
            tagMap.set(tag.id, tag);
          }
        });
      }
    });
    return Array.from(tagMap.values());
  }, [notations]);

  // Extract all unique statuses from notations
  const availableStatuses = useMemo(() => {
    const statusSet = new Set();
    (notations || []).forEach((notation) => {
      if (notation.status) {
        statusSet.add(notation.status.toLowerCase());
      }
    });
    return Array.from(statusSet);
  }, [notations]);

  // Filter notations based on search term, tags, and status
  const filteredNotations = useMemo(() => {
    let filtered = notations || [];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((notation) => {
        const titleMatch = notation.title?.toLowerCase().includes(searchLower);
        let contentMatch = false;
        if (notation.notes) {
          const contentString =
            typeof notation.notes === "string"
              ? notation.notes
              : JSON.stringify(notation.notes);
          const cleanContent = stripHtml(contentString);
          contentMatch = cleanContent.toLowerCase().includes(searchLower);
        }
        return titleMatch || contentMatch;
      });
    }

    // Apply tag filter
    if (selectedTags.size > 0) {
      filtered = filtered.filter((notation) => {
        if (!notation.tags || notation.tags.length === 0) {
          return false;
        }
        const notationTagIds = new Set(notation.tags.map((tag) => tag.id));
        if (tagFilterMode === "OR") {
          for (const selectedTagId of selectedTags) {
            if (notationTagIds.has(selectedTagId)) {
              return true;
            }
          }
          return false;
        } else {
          for (const selectedTagId of selectedTags) {
            if (!notationTagIds.has(selectedTagId)) {
              return false;
            }
          }
          return true;
        }
      });
    }

    // Apply status filter
    if (selectedStatuses.size > 0) {
      filtered = filtered.filter((notation) => {
        return selectedStatuses.has(notation.status?.toLowerCase() || "");
      });
    }

    return filtered;
  }, [notations, searchTerm, selectedTags, selectedStatuses, tagFilterMode]);

  // Sort notations
  const sortedNotations = useMemo(() => {
    return [...filteredNotations].sort((a, b) => {
      if (a.highlighted !== b.highlighted) {
        return b.highlighted ? 1 : -1;
      }
      const dateA = a.date;
      const dateB = b.date;
      if (dateA && dateB) {
        return String(dateA).localeCompare(String(dateB));
      }
      if (dateA) return -1;
      if (dateB) return 1;
      return String(b.updatedAt || "").localeCompare(String(a.updatedAt || ""));
    });
  }, [filteredNotations]);

  const toggleNote = (id) => {
    setExpandedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAll = (expand) => {
    if (expand) {
      setExpandedNotes(new Set(sortedNotations?.map((n) => n.id)));
    } else {
      setExpandedNotes(new Set());
    }
  };

  const handleTagClick = (tagId) => {
    setSelectedTags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const handleStatusClick = (status) => {
    setSelectedStatuses((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const getStatusColor = (status) => {
    const statusOption = NOTATION_STATUS_OPTIONS.find(
      (option) => option.id === status?.toLowerCase()
    );
    return (
      statusOption?.color ||
      NOTATION_STATUS_OPTIONS.find((opt) => opt.id === "default").color
    );
  };

  const getStatusLabel = (status) => {
    const statusOption = NOTATION_STATUS_OPTIONS.find(
      (option) => option.id === status?.toLowerCase()
    );
    return statusOption?.label || status;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-3 flex flex-row gap-2 md:flex-col">
        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <div>
            <button
              onClick={() => setShowTagFilter(!showTagFilter)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedTags.size > 0
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaFilter className="w-3 h-3" />
              <span>Filter by Tags</span>
              {selectedTags.size > 0 && (
                <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {selectedTags.size}
                </span>
              )}
              <FaChevronDown
                className={`w-3 h-3 transform transition-transform ${
                  showTagFilter ? "rotate-180" : ""
                }`}
              />
            </button>

            {showTagFilter && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      Filter mode:
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setTagFilterMode("OR")}
                        className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                          tagFilterMode === "OR"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        OR
                      </button>
                      <button
                        onClick={() => setTagFilterMode("AND")}
                        className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                          tagFilterMode === "AND"
                            ? "bg-blue-500 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        AND
                      </button>
                    </div>
                  </div>
                  {selectedTags.size > 0 && (
                    <button
                      onClick={() => setSelectedTags(new Set())}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((tag) => {
                    const isSelected = selectedTags.has(tag.id);
                    return (
                      <button
                        key={tag.id}
                        onClick={() => handleTagClick(tag.id)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? "border-2 shadow-sm"
                            : "border hover:border-2"
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? tag.color
                            : `${tag.color}20`,
                          borderColor: tag.color,
                          color: isSelected ? "white" : tag.color,
                        }}
                      >
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: isSelected ? "white" : tag.color,
                          }}
                        />
                        <span>{tag.name}</span>
                        {isSelected && (
                          <FaTimes className="w-2.5 h-2.5 ml-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Filter */}
        {availableStatuses.length > 0 && (
          <div>
            <button
              onClick={() => setShowStatusFilter(!showStatusFilter)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedStatuses.size > 0
                  ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaFilter className="w-3 h-3" />
              <span>Filter by Status</span>
              {selectedStatuses.size > 0 && (
                <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {selectedStatuses.size}
                </span>
              )}
              <FaChevronDown
                className={`w-3 h-3 transform transition-transform ${
                  showStatusFilter ? "rotate-180" : ""
                }`}
              />
            </button>

            {showStatusFilter && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Select statuses to show:
                  </span>
                  {selectedStatuses.size > 0 && (
                    <button
                      onClick={() => setSelectedStatuses(new Set())}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableStatuses.map((status) => {
                    const isSelected = selectedStatuses.has(status);
                    const statusOption = NOTATION_STATUS_OPTIONS.find(
                      (opt) => opt.id === status
                    );
                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusClick(status)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isSelected
                            ? "ring-2 ring-offset-1"
                            : "hover:opacity-80"
                        } ${
                          statusOption?.color || "bg-gray-100 text-gray-700"
                        }`}
                        style={{
                          ringColor: isSelected ? "#8B5CF6" : "transparent",
                        }}
                      >
                        {getStatusLabel(status)}
                        {isSelected && <FaTimes className="w-3 h-3 ml-1.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search notations by title or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results count */}
      {(searchTerm || selectedTags.size > 0 || selectedStatuses.size > 0) && (
        <div className="text-sm text-gray-600">
          Found {sortedNotations.length} notation
          {sortedNotations.length !== 1 ? "s" : ""}
        </div>
      )}

      {/* Expand/Collapse All */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => toggleAll(true)}
          className="text-sm text-gray-600 hover:text-gray-800 px-2 rounded-full hover:bg-gray-100 transition-all duration-200"
        >
          Expand All
        </button>
        <button
          onClick={() => toggleAll(false)}
          className="text-sm text-gray-600 hover:text-gray-800 px-2 rounded-full hover:bg-gray-100 transition-all duration-200"
        >
          Collapse All
        </button>
      </div>

      {/* Notations List */}
      <div className="space-y-2">
        {sortedNotations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ||
            selectedTags.size > 0 ||
            selectedStatuses.size > 0 ? (
              <>
                No notations found matching your filters
                <br />
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedTags(new Set());
                    setSelectedStatuses(new Set());
                  }}
                  className="mt-2 text-blue-500 hover:text-blue-600 underline"
                >
                  Clear all filters
                </button>
              </>
            ) : (
              "No notations found"
            )}
          </div>
        ) : (
          sortedNotations.map((notation) => (
            <div
              key={notation.id}
              className="bg-white border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border-gray-200"
            >
              {/* Header */}
              <div
                onClick={() => toggleNote(notation.id)}
                className="w-full px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-all duration-200"
              >
                {/* Date and Status */}
                <div className="flex items-center gap-2 mb-1.5">
                  {getDateRangeValues(notation).startDate && (
                    <span className="text-xs font-medium text-gray-600">
                      {formatDateRangeShort(
                        notation.startDate || notation.date,
                        notation.endDate || notation.startDate || notation.date
                      )}{" "}
                      {formatDayOfWeekRange(
                        notation.startDate || notation.date,
                        notation.endDate || notation.startDate || notation.date
                      )}
                    </span>
                  )}
                  <div className="flex-1 flex justify-end">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        notation.status
                      )}`}
                    >
                      {getStatusLabel(notation.status)}
                    </span>
                  </div>
                </div>

                {/* Title and Tags */}
                <div className="flex items-center justify-between">
                  <div className="flex-1 flex items-center flex-wrap gap-1.5 min-w-0">
                    <span className="font-medium text-gray-900 truncate">
                      {notation.title}
                    </span>

                    {notation.highlighted && (
                      <FaStar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    )}

                    {notation.category && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
                        {notation.category}
                      </span>
                    )}

                    {notation.tags && notation.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {notation.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              borderColor: tag.color,
                              color: tag.color,
                            }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </span>
                        ))}
                        {notation.tags.length > 2 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{notation.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center ml-2 pl-1 flex-shrink-0">
                    <FaChevronDown
                      className={`text-gray-400 transform transition-transform duration-200 ${
                        expandedNotes.has(notation.id) ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedNotes.has(notation.id) && (
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                  {notation.description && (
                    <div className="text-sm text-gray-600 mb-3">
                      {notation.description}
                    </div>
                  )}
                  {notation.notes && (
                    <div className="text-gray-800 leading-relaxed">
                      <CustomEditor
                        content={notation.notes}
                        readOnly={true}
                        transparent={true}
                        textColor="text-gray-800"
                        scrollable={false}
                        compact={false}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const PublicExternalLinkPage = () => {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const [externalLink, setExternalLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [expandedSections, setExpandedSections] = useState({
    videos: true,
    images: true,
    attachments: true,
    notations: true,
    linkGroups: true,
    calendar: true,
    resources: true,
  });
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [highlightedTags, setHighlightedTags] = useState([]);
  const [tagFilterMode, setTagFilterMode] = useState("OR");
  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const collectionId = searchParams.get("collectionId");

  useEffect(() => {
    const loadExternalLink = async () => {
      try {
        setLoading(true);
        setError(null);

        if (collectionId) {
          const collectionData = await fetchSharedCollection(collectionId);
          const collectionLink = collectionData?.externalLinks?.find(
            (link) => link.id === id
          );

          if (!collectionLink) {
            throw new Error(
              "External link is not part of the shared collection"
            );
          }

          setExternalLink({
            ...collectionLink,
            collection: {
              id: collectionData.id,
              name: collectionData.name,
            },
          });
          return;
        }

        const data = await getPublicExternalLinkJson(id);
        setExternalLink(data);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadExternalLink();
    }
  }, [collectionId, id]);

  const playlistCollection = useMemo(() => {
    if (!externalLink) return null;

    return {
      id: collectionId || externalLink.collection?.id || null,
      name: externalLink.collection?.name || externalLink.name,
      externalLinks: [externalLink],
      resources: [],
    };
  }, [collectionId, externalLink]);

  const openVideoModal = (video) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
    setShowVideoModal(false);
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Convert notations to calendar events
  const calendarEvents = useMemo(() => {
    if (!externalLink) return [];

    const events = [];
    const linkRange = getDateRangeValues(externalLink);

    if (linkRange.startDate) {
      events.push({
        id: externalLink.id,
        title: externalLink.name || "Untitled Link",
        name: externalLink.name || "Untitled Link",
        description: externalLink.notes || externalLink.description || "",
        startDate: linkRange.startDate,
        endDate: linkRange.endDate,
        date: linkRange.startDate,
        startTime: externalLink.startTime,
        endTime: externalLink.endTime,
        time: externalLink.startTime,
        status: externalLink.status || "pending",
        type: "external_link",
        tags: externalLink.tags || [],
        primaryColor: externalLink.tags?.[0]?.color || "#3B82F6",
        tagColors: externalLink.tags?.map((tag) => tag.color) || [],
        hasMultipleTags: externalLink.tags?.length > 1,
        tagCount: externalLink.tags?.length || 0,
        visibility: externalLink.visibility || "public",
      });
    }

    (externalLink.notations || []).forEach((notation) => {
      const notationRange = getDateRangeValues(notation);
      if (!notationRange.startDate) {
        return;
      }

      events.push({
        id: `${externalLink.id}-notation-${notation.id}`,
        notationId: notation.id,
        title: notation.title || "Untitled Note",
        name: notation.title || "Untitled Note",
        notationTitle: notation.title,
        description: notation.notes || notation.description || "",
        startDate: notationRange.startDate,
        endDate: notationRange.endDate,
        date: notationRange.startDate,
        startTime: notation.startTime,
        endTime: notation.endTime,
        time: notation.startTime,
        status: notation.status || "pending",
        type: "notation",
        tags: notation.tags || [],
        primaryColor: notation.tags?.[0]?.color || "#3B82F6",
        tagColors: notation.tags?.map((tag) => tag.color) || [],
        hasMultipleTags: notation.tags?.length > 1,
        tagCount: notation.tags?.length || 0,
        visibility: notation.visibility || "public",
        highlighted: notation.highlighted || false,
      });
    });

    return events;
  }, [externalLink]);

  // Extract all unique tags from notations
  const availableTags = useMemo(() => {
    const tagMap = new Map();

    if (externalLink?.notations) {
      externalLink.notations.forEach((notation) => {
        if (notation.tags && Array.isArray(notation.tags)) {
          notation.tags.forEach((tag) => {
            if (!tagMap.has(tag.id)) {
              tagMap.set(tag.id, tag);
            }
          });
        }
      });
    }

    return Array.from(tagMap.values());
  }, [externalLink]);

  // Get count of events per tag
  const getTagCount = (tagId) => {
    if (!externalLink?.notations) return 0;

    return externalLink.notations.filter((notation) =>
      notation.tags?.some((tag) => tag.id === tagId)
    ).length;
  };

  // Handle tag click
  const handleTagClick = (tag) => {
    setHighlightedTags((prev) => {
      const exists = prev.find((t) => t.id === tag.id);
      if (exists) {
        return prev.filter((t) => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Clear highlighted tags
  const handleClearHighlights = () => {
    setHighlightedTags([]);
  };

  // Change filter mode
  const handleFilterModeChange = (mode) => {
    setTagFilterMode(mode);
  };

  // Filter calendar events based on highlighted tags
  const filteredCalendarEvents = useMemo(() => {
    if (highlightedTags.length === 0) {
      // No tags selected, return all events with no highlighting/dimming
      return calendarEvents;
    }

    // Apply tag filtering and highlighting
    return calendarEvents.map((event) => {
      const eventTags = event.tags || [];

      // Check if event matches the filter
      const isHighlighted =
        tagFilterMode === "OR"
          ? // OR logic: event highlighted if it has ANY of the selected tags
            eventTags.some((tag) =>
              highlightedTags.some((hTag) => hTag.id === tag.id)
            )
          : // AND logic: event highlighted if it has ALL of the selected tags
            highlightedTags.every((hTag) =>
              eventTags.some((tag) => tag.id === hTag.id)
            );

      // Return event with highlight/dim properties
      return {
        ...event,
        isHighlighted: isHighlighted,
        isDimmed: !isHighlighted,
      };
    });
  }, [calendarEvents, highlightedTags, tagFilterMode]);

  // Combine videos from link groups and video attachments
  const allVideos = useMemo(() => {
    const videos = [];

    // Add videos from link groups
    if (externalLink?.linkGroups) {
      externalLink.linkGroups.forEach((linkGroup) => {
        // Each linkGroup is itself a link
        if (
          linkGroup.url &&
          (linkGroup.url.includes("youtube.com") ||
            linkGroup.url.includes("youtu.be") ||
            linkGroup.url.includes("vimeo.com") ||
            linkGroup.url.includes("player.vimeo.com"))
        ) {
          videos.push({
            id: linkGroup.id,
            name: linkGroup.name || "Untitled Video",
            url: linkGroup.url,
            description: linkGroup.description,
            tags: linkGroup.tags || [],
            createdAt: linkGroup.createdAt,
            category: linkGroup.category,
            isAttachment: false,
          });
        }
      });
    }

    // Add video attachments
    if (externalLink?.attachments) {
      externalLink.attachments.forEach((attachment) => {
        // Check if it's a video based on type or file extension
        const isVideo =
          attachment.type === "video" ||
          (attachment.presignedUrl &&
            ["mp4", "mov", "avi", "mkv"].includes(
              attachment.presignedUrl
                .split(".")
                .pop()
                ?.toLowerCase()
                ?.split("?")[0]
            ));

        if (isVideo) {
          videos.push({
            id: attachment.id,
            name: attachment.title || "Untitled Video",
            url: attachment.presignedUrl,
            description: attachment.description,
            tags: attachment.tags || [],
            createdAt: attachment.createdAt,
            type: attachment.type,
            isAttachment: true,
            // Include all possible thumbnail properties
            videoThumbnailUrl:
              attachment.videoThumbnailUrl ||
              attachment.thumbnailUrl ||
              attachment.video_thumbnail_url,
            thumbnail: attachment.thumbnail || attachment.thumbnailPresignedUrl,
            previewImage: attachment.previewImage || attachment.preview_image,
          });
        }
      });
    }

    // Note: We're not adding videos from resources here to avoid duplication
    // Resources with videoUrl are already shown in the Resources section

    return videos;
  }, [externalLink]);

  // Filter videos based on search
  const filteredVideos = allVideos.filter((video) => {
    const matchesSearch =
      !searchTerm ||
      video.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (video.description &&
        video.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      selectedFilter === "all" ||
      (selectedFilter === "linkGroups" && !video.isAttachment) ||
      (selectedFilter === "attachments" && video.isAttachment);

    return matchesSearch && matchesFilter;
  });

  // Image attachments
  const imageAttachments =
    externalLink?.attachments?.filter((attachment) => {
      return attachment.type === "image";
    }) || [];

  // Other attachments (PDFs, etc.)
  const otherAttachments =
    externalLink?.attachments?.filter((attachment) => {
      return attachment.type !== "video" && attachment.type !== "image";
    }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-indigo-600 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Loading External Link
          </h2>
          <p className="text-gray-600">Preparing your content...</p>
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
            Content Unavailable
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-blue-600 to-slate-900 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center text-white">
            <div className="mb-4">
              <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                <FaGlobe className="text-xl mr-2" />
                <span className="text-base font-medium">External Link</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight break-words">
                {externalLink?.name || "External Link"}
              </h1>

              {externalLink?.url && (
                <a
                  href={externalLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mb-6 inline-flex max-w-4xl flex-wrap items-center justify-center gap-2 text-white font-medium transition-colors hover:text-blue-100"
                >
                  <FaLink className="shrink-0" />
                  <span className="break-all text-left underline">
                    {externalLink.url}
                  </span>
                </a>
              )}

              {externalLink?.description && (
                <div
                  className="public-hero-html mx-auto mt-4 text-lg leading-relaxed text-blue-50"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(externalLink.description),
                  }}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-white mt-6">
              {allVideos.length > 0 && (
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
                  <FaVideo className="mr-1.5 text-sm" />
                  <span>{allVideos.length} Videos</span>
                </div>
              )}
              {imageAttachments.length > 0 && (
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
                  <FaImage className="mr-1.5 text-sm" />
                  <span>{imageAttachments.length} Images</span>
                </div>
              )}
              {otherAttachments.length > 0 && (
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
                  <FaPaperclip className="mr-1.5 text-sm" />
                  <span>{otherAttachments.length} Files</span>
                </div>
              )}
              {externalLink?.notations?.length > 0 && (
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
                  <FaRegStickyNote className="mr-1.5 text-sm" />
                  <span>{externalLink.notations.length} Notes</span>
                </div>
              )}
              {calendarEvents.length > 0 && (
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
                  <FaCalendar className="mr-1.5 text-sm" />
                  <span>{calendarEvents.length} Calendar Events</span>
                </div>
              )}
              {availableTags.length > 0 && (
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
                  <FaTag className="mr-1.5 text-sm" />
                  <span>{availableTags.length} Tags</span>
                </div>
              )}
              {externalLink?.resources?.length > 0 && (
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm">
                  <FaFileAlt className="mr-1.5 text-sm" />
                  <span>{externalLink.resources.length} Resources</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CollectionVideoPlaylist collection={playlistCollection} />

      {/* Content Section */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search and Filter */}
          {allVideos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search videos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedFilter("all")}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      selectedFilter === "all"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All ({allVideos.length})
                  </button>
                  <button
                    onClick={() => setSelectedFilter("linkGroups")}
                    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center ${
                      selectedFilter === "linkGroups"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <FaLink className="mr-2" />
                    Link Groups (
                    {
                      allVideos.filter((v) => !v.isAttachment && !v.isResource)
                        .length
                    }
                    )
                  </button>
                  <button
                    onClick={() => setSelectedFilter("attachments")}
                    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center ${
                      selectedFilter === "attachments"
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <FaPaperclip className="mr-2" />
                    Attachments (
                    {allVideos.filter((v) => v.isAttachment).length})
                  </button>
                  {/* Removed Resources filter button as resources are shown separately */}
                </div>
              </div>
            </div>
          )}

          {/* Resources Section */}
          {externalLink?.resources && externalLink.resources.length > 0 && (
            <div className="mb-12">
              <div
                className="flex items-center justify-between mb-6 cursor-pointer"
                onClick={() => toggleSection("resources")}
              >
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaFileAlt className="mr-3 text-blue-600" />
                  Resources
                  <span className="ml-3 text-sm font-normal text-gray-500">
                    ({externalLink.resources.length} items)
                  </span>
                </h2>
                {expandedSections.resources ? (
                  <FaChevronUp className="text-gray-600" />
                ) : (
                  <FaChevronDown className="text-gray-600" />
                )}
              </div>

              {expandedSections.resources && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {externalLink.resources.map((resource) => {
                    // Extract the actual resource object

                    // Check videoUrl first, then fall back to url
                    const videoUrl = resource.videoUrl || resource.url;

                    const isYouTube =
                      videoUrl &&
                      (videoUrl.includes("youtube.com") ||
                        videoUrl.includes("youtu.be"));
                    const isVimeo =
                      videoUrl &&
                      (videoUrl.includes("vimeo.com") ||
                        videoUrl.includes("player.vimeo.com"));
                    const youtubeVideoId = isYouTube
                      ? getYouTubeVideoId(videoUrl)
                      : null;
                    const vimeoVideoId = isVimeo
                      ? getVimeoVideoId(videoUrl)
                      : null;

                    // Check if resource has videoUrl for YouTube or Vimeo thumbnail
                    const hasYouTubeVideoUrl =
                      resource.videoUrl &&
                      (resource.videoUrl.includes("youtube.com") ||
                        resource.videoUrl.includes("youtu.be"));
                    const hasVimeoVideoUrl =
                      resource.videoUrl &&
                      (resource.videoUrl.includes("vimeo.com") ||
                        resource.videoUrl.includes("player.vimeo.com"));
                    const videoUrlId = hasYouTubeVideoUrl
                      ? getYouTubeVideoId(resource.videoUrl)
                      : hasVimeoVideoUrl
                      ? getVimeoVideoId(resource.videoUrl)
                      : null;

                    const hasVideo = isYouTube || isVimeo || resource.videoUrl;

                    return (
                      <div
                        key={resource.id}
                        className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden flex flex-col h-full"
                        onClick={() => {
                          // If it's a video resource, open it in the video modal
                          if (hasVideo) {
                            const videoData = {
                              id: resource.id,
                              name: resource.name || "Untitled Video",
                              url: videoUrl, // Use the videoUrl we determined above
                              description: resource.description,
                              notes: resource.notes, // Include notes!
                              tags: resource.tags || [],
                              createdAt: resource.createdAt,
                              timestamps: resource.timestamps, // Include timestamps!
                              isResource: true,
                            };
                            openVideoModal(videoData);
                          }
                        }}
                        style={{ cursor: hasVideo ? "pointer" : "default" }}
                      >
                        {/* Resource thumbnail or icon */}
                        <div className="relative h-40 bg-gray-100 flex-shrink-0">
                          {resource.imageUrl || resource.presignedImageUrl ? (
                            <img
                              src={
                                resource.imageUrl || resource.presignedImageUrl
                              }
                              alt={resource.name || "Resource"}
                              className="w-full h-full object-cover"
                            />
                          ) : youtubeVideoId ||
                            (hasYouTubeVideoUrl && videoUrlId) ? (
                            <YouTubeThumbnail
                              videoId={youtubeVideoId || videoUrlId}
                              alt={resource.name || "Resource"}
                              className="w-full h-full object-cover"
                            />
                          ) : isVimeo || vimeoVideoId ? (
                            // Vimeo video placeholder
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                              <FaPlayCircle className="text-5xl text-white" />
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              {resource.resourceType?.name?.toLowerCase() ===
                                "video" ||
                              resource.videoUrl ? (
                                <FaPlayCircle className="text-5xl text-gray-400" />
                              ) : (
                                <FaFileAlt className="text-4xl text-gray-400" />
                              )}
                            </div>
                          )}

                          {/* Type badge */}
                          {resource.resourceType && (
                            <div className="absolute top-2 left-2">
                              <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                                {resource.resourceType.name}
                              </span>
                            </div>
                          )}

                          {/* Play button overlay for videos */}
                          {(resource.resourceType?.name?.toLowerCase() ===
                            "video" ||
                            resource.videoUrl ||
                            hasYouTubeVideoUrl ||
                            hasVimeoVideoUrl ||
                            isYouTube ||
                            isVimeo) && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform group-hover:scale-110 transition-transform">
                                <FaPlay className="text-xl text-blue-600" />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Resource content */}
                        <div className="p-4 flex flex-col flex-grow">
                          <div className="flex-grow">
                            <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2">
                              {resource.name || "Untitled Resource"}
                            </h3>

                            {resource.description && (
                              <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                                {stripHtml(resource.description)}
                              </p>
                            )}

                            {/* Notes */}
                            {resource.notes && (
                              <div className="bg-blue-50 rounded-lg p-2 mb-2">
                                <p className="text-sm text-blue-900 font-medium mb-1">
                                  Notes:
                                </p>
                                <p className="text-sm text-blue-800 whitespace-pre-line line-clamp-3">
                                  {resource.notes}
                                </p>
                              </div>
                            )}

                            {/* Tags */}
                            {resource.tags && resource.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {resource.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                                    style={{
                                      backgroundColor: `${tag.color}20`,
                                      borderColor: tag.color,
                                      color: tag.color,
                                    }}
                                  >
                                    {tag.name}
                                  </span>
                                ))}
                                {resource.tags.length > 2 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    +{resource.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Footer - Always at bottom */}
                          <div className="mt-auto pt-2 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              {!hasVideo ? (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedResource(resource);
                                    setShowResourceModal(true);
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                  View
                                </button>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const videoData = {
                                      id: resource.id,
                                      name: resource.name || "Untitled Video",
                                      url: videoUrl, // Use the videoUrl we determined above
                                      description: resource.description,
                                      notes: resource.notes, // Include notes!
                                      tags: resource.tags || [],
                                      createdAt: resource.createdAt,
                                      timestamps: resource.timestamps, // Include timestamps!
                                      isResource: true,
                                    };
                                    openVideoModal(videoData);
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                                >
                                  <FaPlay className="mr-1 text-xs" />
                                  Play
                                </button>
                              )}
                              {videoUrl && (
                                <a
                                  href={videoUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-xs font-medium"
                                >
                                  <FaExternalLinkAlt className="mr-1 text-xs" />
                                  Visit
                                </a>
                              )}
                              {!resource.url &&
                                !resource.videoUrl &&
                                resource.author && (
                                  <div className="text-xs text-gray-500">
                                    By {resource.author}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Videos Section */}
          {filteredVideos.length > 0 && (
            <div className="mb-12">
              <div
                className="flex items-center justify-between mb-6 cursor-pointer"
                onClick={() => toggleSection("videos")}
              >
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaVideo className="mr-3 text-indigo-600" />
                  Videos
                </h2>
                {expandedSections.videos ? (
                  <FaChevronUp className="text-gray-600" />
                ) : (
                  <FaChevronDown className="text-gray-600" />
                )}
              </div>

              {expandedSections.videos && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={video}
                      onPlay={openVideoModal}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Images Section */}
          {imageAttachments.length > 0 && (
            <div className="mb-12">
              <div
                className="flex items-center justify-between mb-6 cursor-pointer"
                onClick={() => toggleSection("images")}
              >
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaImage className="mr-3 text-green-600" />
                  Images
                </h2>
                {expandedSections.images ? (
                  <FaChevronUp className="text-gray-600" />
                ) : (
                  <FaChevronDown className="text-gray-600" />
                )}
              </div>

              {expandedSections.images && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {imageAttachments.map((image) => (
                    <ImageCard
                      key={image.id}
                      image={image}
                      onView={(img) => window.open(img.presignedUrl, "_blank")}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Other Attachments Section */}
          {otherAttachments.length > 0 && (
            <div className="mb-12">
              <div
                className="flex items-center justify-between mb-6 cursor-pointer"
                onClick={() => toggleSection("attachments")}
              >
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaPaperclip className="mr-3 text-purple-600" />
                  Attachments
                </h2>
                {expandedSections.attachments ? (
                  <FaChevronUp className="text-gray-600" />
                ) : (
                  <FaChevronDown className="text-gray-600" />
                )}
              </div>

              {expandedSections.attachments && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {otherAttachments.map((attachment) => (
                    <AttachmentCard
                      key={attachment.id}
                      attachment={attachment}
                      onPreview={setSelectedAttachment}
                      onDownload={downloadAttachmentFile}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notations Section */}
          {externalLink?.notations && externalLink.notations.length > 0 && (
            <div className="mb-12">
              <div
                className="flex items-center justify-between mb-6 cursor-pointer"
                onClick={() => toggleSection("notations")}
              >
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaRegStickyNote className="mr-3 text-green-600" />
                  Notes & Annotations
                </h2>
                {expandedSections.notations ? (
                  <FaChevronUp className="text-gray-600" />
                ) : (
                  <FaChevronDown className="text-gray-600" />
                )}
              </div>

              {expandedSections.notations && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <PublicNotationsList notations={externalLink.notations} />
                </div>
              )}
            </div>
          )}

          {/* Public Notation Submission */}
          {externalLink?.allowPublicNotations && (
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Submit a Notation
                </h2>
                <SimplePublicNotationForm
                  externalLinkId={id}
                  collectionId={collectionId}
                  templateId={externalLink.defaultTemplateId}
                  customFields={externalLink.customFieldDefinitions || []}
                  onSuccess={(result) => {
                    // Optionally refresh the page or show success message
                  }}
                />
              </div>
            </div>
          )}

          {/* Calendar View & Tags Section */}
          {(calendarEvents.length > 0 || availableTags.length > 0) && (
            <div className="mb-12">
              <div
                className="flex items-center justify-between mb-6 cursor-pointer"
                onClick={() => toggleSection("calendar")}
              >
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaCalendar className="mr-3 text-blue-600" />
                  Calendar View
                  <span className="ml-3 text-sm font-normal text-gray-500">
                    ({calendarEvents.length} dated notes)
                  </span>
                </h2>
                {expandedSections.calendar ? (
                  <FaChevronUp className="text-gray-600" />
                ) : (
                  <FaChevronDown className="text-gray-600" />
                )}
              </div>

              {expandedSections.calendar && (
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calendar on the left */}
                    <div className="order-2 lg:order-1">
                      <Calendar
                        events={filteredCalendarEvents}
                        organizations={[]}
                        isAdmin={false}
                        onExternalLinkClick={(linkId) => {
                          // Since we're already on the external link page, just scroll to the notation
                          const notationId = linkId.split("-notation-")[1];
                          if (notationId) {
                            const element = document.getElementById(
                              `notation-${notationId}`
                            );
                            if (element) {
                              element.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            }
                          }
                        }}
                        isExternal={true}
                        showPublicOnly={false}
                      />
                    </div>

                    {/* Tag Classification on the right */}
                    {availableTags.length > 0 && (
                      <div className="order-1 lg:order-2">
                        <TagClassificationEnhanced
                          availableTags={availableTags}
                          highlightedTags={highlightedTags}
                          tagFilterMode={tagFilterMode}
                          onTagClick={handleTagClick}
                          onClearHighlights={handleClearHighlights}
                          onFilterModeChange={handleFilterModeChange}
                          getTagCount={getTagCount}
                          showCondition={true}
                          title="Tag Categories"
                          events={calendarEvents}
                          showPublicOnly={false}
                          showRegularEvents={false}
                          isCollectionContext={false}
                        />
                      </div>
                    )}
                  </div>
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
                <FaGlobe className="text-2xl" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Shared Content</h3>
              <p className="text-gray-400 max-w-2xl mx-auto">
                This content has been shared with you by the author. Bookmark
                this page to return anytime.
              </p>
            </div>

            <div className="border-t border-gray-800 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
                <div className="mb-4 md:mb-0">
                  <p>External Link: {externalLink?.name}</p>
                  <p>
                    Last updated:{" "}
                    {new Date(externalLink?.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() =>
                      navigator.share &&
                      navigator.share({
                        title: externalLink?.name,
                        text: externalLink?.description,
                        url: window.location.href,
                      })
                    }
                    className="flex items-center hover:text-white transition-colors"
                  >
                    <FaShare className="mr-1" />
                    Share Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Video Detail Modal */}
      <VideoDetailModal
        video={selectedVideo}
        isOpen={showVideoModal}
        onClose={closeVideoModal}
      />

      {/* Resource Detail Modal */}
      <ResourceDetailModal
        isOpen={showResourceModal}
        onClose={() => {
          setShowResourceModal(false);
          setSelectedResource(null);
        }}
        resource={selectedResource}
        collectionNote={selectedResource?.collectionNotes}
      />

      <AttachmentPreviewModal
        attachment={selectedAttachment}
        isOpen={Boolean(selectedAttachment)}
        onClose={() => setSelectedAttachment(null)}
      />
    </div>
  );
};

export default PublicExternalLinkPage;
