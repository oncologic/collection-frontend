import { useState, useMemo, useRef } from "react";
import Image from "next/image";
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaTrash,
  FaSearch,
  FaEdit,
  FaDownload,
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress,
  FaFileAlt,
  FaFileArchive,
  FaImage,
  FaVideo,
  FaFilter,
  FaCheckSquare,
  FaSquare,
  FaEye,
  FaCloudDownloadAlt,
  FaSortAmountDown,
  FaSortAmountUp,
} from "react-icons/fa";
import { FaTableCellsLarge, FaListUl } from "react-icons/fa6";
import { toast } from "react-hot-toast";

const AttachmentBrowser = ({
  attachments = [],
  onClose,
  onDelete,
  onEdit,
  isAdmin = false,
  isCollaborator = false,
  userRole = "",
  systemUserId = "",
  title = "Attachments",
}) => {
  // Helper functions - moved to top to avoid hoisting issues
  const isVideoFile = (url) => {
    if (!url) return false;
    return /\.(mp4|mov|avi|webm|mpeg|mkv)$/i.test(url);
  };

  const isDocumentFile = (url) => {
    if (!url) return false;
    return /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt)$/i.test(url);
  };

  const canModifyAttachment = (attachment) => {
    return (
      isAdmin ||
      attachment.userId === systemUserId ||
      (isCollaborator && userRole === "admin")
    );
  };

  const getFileIcon = (attachment) => {
    if (attachment.type === "image")
      return <FaImage className="text-blue-500" />;
    if (attachment.type === "video" || isVideoFile(attachment.presignedUrl))
      return <FaVideo className="text-red-500" />;
    if (isDocumentFile(attachment.presignedUrl))
      return <FaFileAlt className="text-green-500" />;
    return <FaFileArchive className="text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "Unknown size";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  // Always start in open mode when used as a modal
  const [isOpen, setIsOpen] = useState(true);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Video player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Categorize attachments
  const categorizedAttachments = useMemo(() => {
    const categories = {
      images: [],
      videos: [],
      documents: [],
      other: [],
    };

    attachments.forEach((attachment) => {
      if (attachment.type === "image") {
        categories.images.push(attachment);
      } else if (
        attachment.type === "video" ||
        isVideoFile(attachment.presignedUrl)
      ) {
        categories.videos.push(attachment);
      } else if (isDocumentFile(attachment.presignedUrl)) {
        categories.documents.push(attachment);
      } else {
        categories.other.push(attachment);
      }
    });

    return categories;
  }, [attachments]);

  // Filter and sort attachments
  const filteredAndSortedAttachments = useMemo(() => {
    let filtered = attachments;

    // Apply type filter
    if (filterType !== "all") {
      filtered = categorizedAttachments[filterType] || [];
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (attachment) =>
          attachment.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          attachment.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = String(a.title || "").localeCompare(
            String(b.title || "")
          );
          break;
        case "type":
          comparison = String(a.type || "").localeCompare(String(b.type || ""));
          break;
        case "size":
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case "date":
        default:
          comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    attachments,
    categorizedAttachments,
    filterType,
    searchQuery,
    sortBy,
    sortOrder,
  ]);

  const handleSelectAll = () => {
    if (selectedItems.size === filteredAndSortedAttachments.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredAndSortedAttachments.map((a) => a.id)));
    }
  };

  const handleSelectItem = (id) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBulkDownload = async () => {
    if (selectedItems.size === 0) {
      toast.error("Please select items to download");
      return;
    }

    setIsDownloading(true);

    try {
      const selectedAttachments = attachments.filter((a) =>
        selectedItems.has(a.id)
      );

      // Download each file individually using native browser download
      for (const attachment of selectedAttachments) {
        try {
          const link = document.createElement("a");
          link.href = attachment.presignedUrl;
          link.download = attachment.title || `attachment_${attachment.id}`;
          link.target = "_blank";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Small delay between downloads to prevent browser blocking
          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Failed to download ${attachment.title}:`, error);
          toast.error(`Failed to download ${attachment.title}`);
        }
      }

      toast.success(`Started download of ${selectedItems.size} files`);
      setSelectedItems(new Set());
    } catch (error) {
      console.error("Bulk download failed:", error);
      toast.error("Failed to start downloads");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSingle = async (attachment) => {
    try {
      const link = document.createElement("a");
      link.href = attachment.presignedUrl;
      link.download = attachment.title || `attachment_${attachment.id}`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Downloaded ${attachment.title || "file"}`);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download file");
    }
  };

  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const renderAttachmentPreview = (attachment) => {
    if (attachment.type === "image") {
      return (
        <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={attachment.presignedUrl}
            alt={attachment.title}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
      );
    }

    if (attachment.type === "video" || isVideoFile(attachment.presignedUrl)) {
      return (
        <div className="relative w-full h-48 bg-black rounded-lg overflow-hidden">
          <video
            src={attachment.presignedUrl}
            className="w-full h-full object-cover transform-none"
            preload="metadata"
            muted
            style={{
              transform: "none",
              imageOrientation: "from-image",
              objectPosition: "center",
            }}
            onLoadedMetadata={(e) => {
              // Set video to show first frame as thumbnail
              e.target.currentTime = 1;
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-all duration-200">
            <div className="bg-white/90 rounded-full p-3 shadow-lg">
              <FaPlay className="text-gray-800 text-2xl ml-1" />
            </div>
          </div>
          {/* Video duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            Video
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-48 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-4xl text-gray-400">{getFileIcon(attachment)}</div>
      </div>
    );
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredAndSortedAttachments.map((attachment) => (
        <div
          key={attachment.id}
          className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden hover:shadow-md transition-all duration-200 group relative ${
            selectedItems.has(attachment.id)
              ? "border-blue-500 ring-2 ring-blue-200"
              : "border-gray-200"
          }`}
        >
          {/* Selection checkbox */}
          <div className="absolute top-3 left-3 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSelectItem(attachment.id);
              }}
              className="p-1 rounded bg-white/90 hover:bg-white transition-colors shadow-sm"
            >
              {selectedItems.has(attachment.id) ? (
                <FaCheckSquare className="text-blue-600 text-lg" />
              ) : (
                <FaSquare className="text-gray-400 text-lg" />
              )}
            </button>
          </div>

          {/* Preview */}
          <div
            className="cursor-pointer"
            onClick={() => setSelectedAttachment(attachment)}
          >
            {renderAttachmentPreview(attachment)}
          </div>

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3
                className="font-medium text-gray-900 truncate flex-1"
                title={attachment.title}
              >
                {attachment.title}
              </h3>
              <div className="flex items-center gap-1 ml-2">
                {getFileIcon(attachment)}
              </div>
            </div>

            {attachment.description && (
              <p
                className="text-sm text-gray-600 mb-3 line-clamp-2"
                title={attachment.description}
              >
                {attachment.description}
              </p>
            )}

            <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
              <span>{formatFileSize(attachment.size)}</span>
              <span>{new Date(attachment.createdAt).toLocaleDateString()}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadSingle(attachment)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Download"
                >
                  <FaDownload />
                </button>
                <button
                  onClick={() => setSelectedAttachment(attachment)}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                  title="Preview"
                >
                  <FaEye />
                </button>
              </div>

              {canModifyAttachment(attachment) && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit?.(attachment)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this attachment?")) {
                        onDelete?.(attachment.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}

              {attachment.userId === systemUserId && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  You
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {filteredAndSortedAttachments.map((attachment) => (
        <div
          key={attachment.id}
          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            {/* Selection checkbox */}
            <button
              onClick={() => handleSelectItem(attachment.id)}
              className="flex-shrink-0"
            >
              {selectedItems.has(attachment.id) ? (
                <FaCheckSquare className="text-blue-600" />
              ) : (
                <FaSquare className="text-gray-400" />
              )}
            </button>

            {/* File icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
              {getFileIcon(attachment)}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <h3
                className="font-medium text-gray-900 truncate"
                title={attachment.title}
              >
                {attachment.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{attachment.type}</span>
                <span>{formatFileSize(attachment.size)}</span>
                <span>
                  {new Date(attachment.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadSingle(attachment)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                title="Download"
              >
                <FaDownload />
              </button>
              <button
                onClick={() => setSelectedAttachment(attachment)}
                className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                title="Preview"
              >
                <FaEye />
              </button>

              {canModifyAttachment(attachment) && (
                <>
                  <button
                    onClick={() => onEdit?.(attachment)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this attachment?")) {
                        onDelete?.(attachment.id);
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </>
              )}

              {attachment.userId === systemUserId && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  You
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FaFileArchive className="mx-auto text-4xl mb-4 text-gray-300" />
        <p>No attachments yet</p>
      </div>
    );
  }

  return (
    <>
      {/* Full browser modal */}
      {isOpen && (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <span className="text-sm text-gray-500">
                {filteredAndSortedAttachments.length} items
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Controls */}
          <div className="p-6 border-b border-gray-200 space-y-4">
            {/* Search and bulk actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search attachments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Bulk download button */}
              {selectedItems.size > 0 && (
                <button
                  onClick={handleBulkDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isDownloading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  ) : (
                    <FaCloudDownloadAlt className="mr-2" />
                  )}
                  Download Selected ({selectedItems.size})
                </button>
              )}
            </div>

            {/* Filters and view controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Filter dropdown */}
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="images">
                    Images ({categorizedAttachments.images.length})
                  </option>
                  <option value="videos">
                    Videos ({categorizedAttachments.videos.length})
                  </option>
                  <option value="documents">
                    Documents ({categorizedAttachments.documents.length})
                  </option>
                  <option value="other">
                    Other ({categorizedAttachments.other.length})
                  </option>
                </select>

                {/* Sort dropdown */}
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split("-");
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="name-asc">Name A-Z</option>
                  <option value="name-desc">Name Z-A</option>
                  <option value="type-asc">Type A-Z</option>
                  <option value="size-desc">Largest First</option>
                  <option value="size-asc">Smallest First</option>
                </select>

                {/* Select all button */}
                <button
                  onClick={handleSelectAll}
                  className="inline-flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {selectedItems.size ===
                  filteredAndSortedAttachments.length ? (
                    <FaCheckSquare className="mr-2 text-blue-600" />
                  ) : (
                    <FaSquare className="mr-2" />
                  )}
                  Select All
                </button>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  } transition-colors`}
                >
                  <FaTableCellsLarge />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  } transition-colors`}
                >
                  <FaListUl />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {filteredAndSortedAttachments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FaSearch className="mx-auto text-4xl mb-4 text-gray-300" />
                <p>No attachments found matching your criteria</p>
              </div>
            ) : viewMode === "grid" ? (
              renderGridView()
            ) : (
              renderListView()
            )}
          </div>
        </div>
      )}

      {/* Preview modal */}
      {selectedAttachment && (
        <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedAttachment.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedAttachment.type} •{" "}
                  {formatFileSize(selectedAttachment.size)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadSingle(selectedAttachment)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Download"
                >
                  <FaDownload />
                </button>
                <button
                  onClick={() => setSelectedAttachment(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div className="p-4" ref={containerRef}>
              {selectedAttachment.type === "image" ? (
                <div className="relative w-full h-96">
                  <Image
                    src={selectedAttachment.presignedUrl}
                    alt={selectedAttachment.title}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              ) : selectedAttachment.type === "video" ||
                isVideoFile(selectedAttachment.presignedUrl) ? (
                <div className="relative">
                  <video
                    ref={videoRef}
                    src={selectedAttachment.presignedUrl}
                    className="w-full h-96 object-contain bg-black rounded-lg transform-none"
                    controls
                    preload="metadata"
                    style={{
                      transform: "none",
                      imageOrientation: "from-image",
                      objectPosition: "center",
                    }}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl text-gray-300 mb-4">
                    {getFileIcon(selectedAttachment)}
                  </div>
                  <p className="text-gray-600 mb-4">
                    Preview not available for this file type
                  </p>
                  <button
                    onClick={() => handleDownloadSingle(selectedAttachment)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FaDownload className="mr-2" />
                    Download File
                  </button>
                </div>
              )}

              {selectedAttachment.description && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Description
                  </h4>
                  <p className="text-gray-700">
                    {selectedAttachment.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttachmentBrowser;
