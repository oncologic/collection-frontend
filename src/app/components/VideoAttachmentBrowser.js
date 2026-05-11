import { useState, useRef, useEffect } from "react";
import {
  FaPlay,
  FaExpand,
  FaCompress,
  FaTrash,
  FaEdit,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { MdVideocam } from "react-icons/md";
import { toast } from "react-hot-toast";

const VideoAttachmentBrowser = ({
  videos,
  onClose,
  onDelete,
  isAdmin,
  isCollaborator = false,
  userRole = "",
  systemUserId = "",
}) => {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  // Check if user can delete a specific video
  const canModifyVideo = (video) => {
    return (
      isAdmin ||
      video.userId === systemUserId ||
      (isCollaborator && userRole === "admin")
    );
  };

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch((err) => {
        toast.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Monitor fullscreen state changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Select first video by default
  useEffect(() => {
    if (videos && videos.length > 0 && !selectedVideo) {
      setSelectedVideo(videos[0]);
    }
  }, [videos, selectedVideo]);

  // Open modal with specific video
  const handleOpenVideo = (video, index) => {
    setSelectedVideo(video);
    setCurrentIndex(index);
    setShowModal(true);
  };

  // Navigate between videos in modal
  const handleNavigate = (direction) => {
    if (!videos || videos.length <= 1) return;

    let newIndex;
    if (direction === "next") {
      newIndex = (currentIndex + 1) % videos.length;
    } else {
      newIndex = (currentIndex - 1 + videos.length) % videos.length;
    }

    setCurrentIndex(newIndex);
    setSelectedVideo(videos[newIndex]);
  };

  const handleDeleteVideo = async (videoId, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this video?")) {
      await onDelete(videoId);
      if (showModal) {
        setShowModal(false);
      }
    }
  };

  const handleEditVideo = (video, e) => {
    e.stopPropagation();
    // Pass the video to the parent component with an edit flag
    if (typeof onDelete === "function") {
      onDelete(video.id, true, video);
      if (showModal) {
        setShowModal(false);
      }
    }
  };

  if (!videos || videos.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        {/* Video Thumbnails Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-2 gap-4">
          {videos.map((video, index) => (
            <div
              key={video.id || index}
              className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => handleOpenVideo(video, index)}
            >
              {/* Actual Video Thumbnail */}
              <video
                src={video.presignedUrl}
                className="w-full h-full object-cover"
                preload="metadata"
                muted
                onLoadedMetadata={(e) => {
                  // Set video to show first frame as thumbnail
                  e.target.currentTime = 1;
                }}
              />

              {/* Play button overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-all duration-200">
                <div className="bg-white/90 rounded-full p-3 shadow-lg">
                  <FaPlay className="text-gray-800 text-xl ml-1" />
                </div>
              </div>

              {/* Video title overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-white text-sm truncate" title={video.title}>
                  {video.title}
                </p>
              </div>

              {/* Owner indicator */}
              {video.userId === systemUserId && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium bg-blue-500/70 text-white">
                  You
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Video Modal (similar to TimestampModal) */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 transition-all duration-300"
          onClick={() => setShowModal(false)}
        >
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl mx-4 bg-gradient-to-br from-white via-white to-gray-50 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.15)] border border-gray-100 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50/80 transition-all duration-200 z-10"
            >
              <FaTimes className="h-6 w-6" />
            </button>

            {/* Mobile close button (swipe indicator) */}
            <div className="sticky top-0 left-0 right-0 w-full flex justify-center items-center py-2 bg-white md:hidden z-10">
              <button
                onClick={() => setShowModal(false)}
                className="w-16 h-1 bg-gray-300 rounded-full my-1"
                aria-label="Close modal"
              />
            </div>

            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Video Player */}
              <div
                ref={containerRef}
                className="relative w-full aspect-video rounded-lg overflow-hidden shadow-lg border border-gray-200"
              >
                {selectedVideo && (
                  <video
                    ref={videoRef}
                    src={selectedVideo.presignedUrl}
                    className="w-full h-full object-contain bg-black"
                    controls
                    autoPlay={true}
                    preload="metadata"
                    controlsList="nodownload"
                  />
                )}

                {/* Video navigation controls */}
                {videos.length > 1 && (
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-4 z-10 pointer-events-none">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate("prev");
                      }}
                      className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors shadow-lg backdrop-blur-sm pointer-events-auto"
                      aria-label="Previous video"
                    >
                      <FaChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigate("next");
                      }}
                      className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors shadow-lg backdrop-blur-sm pointer-events-auto"
                      aria-label="Next video"
                    >
                      <FaChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}

                {/* Fullscreen button */}
                <div className="absolute bottom-14 right-4 flex space-x-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFullscreen();
                    }}
                    className="p-2 bg-black/60 hover:bg-black/80 text-white rounded-full"
                    title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                  >
                    {isFullscreen ? (
                      <FaCompress size={16} />
                    ) : (
                      <FaExpand size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Video Info */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {selectedVideo?.title}
                  </h3>
                  {selectedVideo?.description && (
                    <p className="text-gray-600 mt-1">
                      {selectedVideo.description}
                    </p>
                  )}
                </div>

                {/* Edit/Delete buttons moved here for better usability */}
                {selectedVideo && canModifyVideo(selectedVideo) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleEditVideo(selectedVideo, e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-md border border-blue-200"
                    >
                      <FaEdit size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteVideo(selectedVideo.id, e)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md border border-red-200"
                    >
                      <FaTrash size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Video thumbnails for quick navigation */}
              {videos.length > 1 && (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    More Videos
                  </h4>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                    {videos.map((video, idx) => (
                      <div
                        key={idx}
                        className={`relative aspect-video cursor-pointer rounded-md overflow-hidden ${
                          idx === currentIndex
                            ? "ring-2 ring-blue-500"
                            : "opacity-80 hover:opacity-100 border border-gray-200"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenVideo(video, idx);
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <FaPlay className="text-white text-sm" />
                        </div>
                        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black/80 to-transparent p-1">
                          <p className="text-white text-xs truncate">
                            {video.title}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VideoAttachmentBrowser;
