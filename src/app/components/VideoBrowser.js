import { useState, useEffect, useRef, useCallback } from "react";
import {
  FaPlayCircle,
  FaInfoCircle,
  FaEdit,
  FaTrash,
  FaTimes,
  FaInstagram,
} from "react-icons/fa";
import DOMPurify from "dompurify";
import Modal from "@/app/components/Modal";
import YouTube from "react-youtube";
import { parseTimestamps } from "../utils/general";
import { useContextAuth } from "../context/authContext";
import {
  getInstagramEmbedUrl,
  getVideoType,
  isVimeoUrl,
  normalizeVideoUrl,
} from "../utils/videoProviders";

const vimeoThumbCache = new Map();

const VideoBrowser = ({
  videos,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  searchQuery = "",
  currentUserId,
  isCollaborator = false,
  userRole = "",
}) => {
  const { userId, isAdmin } = useContextAuth();
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showDetails, setShowDetails] = useState(null);
  const [vimeoThumbs, setVimeoThumbs] = useState({});

  // Timestamp functionality
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [timestampSearchQuery, setTimestampSearchQuery] = useState("");
  const [swipeMode, setSwipeMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const playerRef = useRef(null);
  const swipeContainerRef = useRef(null);

  // Check if user has permission to edit/delete a specific video
  const canEditVideo = (video) => {
    // Only allow admin or the owner of the video to edit/delete
    return (
      isAdmin ||
      video.userId === userId ||
      video.createdBy === userId ||
      video.ownerId === userId
    );
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedVideo(null);
      playerRef.current = null;
    } else {
      // Check if there's a stored selected video with timestamp
      try {
        const storedVideoData = sessionStorage.getItem("selectedVideo");
        if (storedVideoData) {
          const parsedData = JSON.parse(storedVideoData);

          // Find the matching video in our list
          const video = videos.find((v) => v.id === parsedData.id);
          if (video) {
            setSelectedVideo(video);

            // If a timestamp filter is provided, set the timestamp search query
            if (parsedData.timestampFilter) {
              setTimestampSearchQuery(parsedData.timestampFilter);
            }

            if (parsedData.timestamp) {
              setCurrentTimestamp(parsedData.timestamp);

              // If the video has timestamps, find the matching index
              if (video.timestamps && Array.isArray(video.timestamps)) {
                const index = video.timestamps.findIndex(
                  (t) => t.timestamp === parsedData.timestamp
                );
                if (index !== -1) {
                  setCurrentIndex(index);
                }
              }
            }
          }

          // Clear storage after use
          sessionStorage.removeItem("selectedVideo");
        }
      } catch (error) {
        console.error("Error reading stored video data:", error);
      }
    }
  }, [isOpen, videos]);

  // Apply parent search query to timestamp search when component opens
  useEffect(() => {
    if (isOpen && searchQuery) {
      setTimestampSearchQuery(searchQuery);
    }
  }, [isOpen, searchQuery]);

  // Reset timestamp data when selecting a new video
  useEffect(() => {
    if (selectedVideo) {
      // Keep the timestamp search query if there's a parent search query
      if (!searchQuery) {
        setTimestampSearchQuery("");
      }
      setSwipeMode(false);
      setCurrentIndex(0);
    }
  }, [selectedVideo, searchQuery]);

  // Seek to timestamp when changed
  useEffect(() => {
    if (
      playerRef.current &&
      playerRef.current.seekTo &&
      typeof playerRef.current.seekTo === "function"
    ) {
      try {
        playerRef.current.seekTo(currentTimestamp, true);
      } catch (error) {
        console.warn("Error seeking to timestamp:", error);
      }
    }
  }, [currentTimestamp]);

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]+)/
    );
    return match ? match[1] : null;
  };

  const getZoomUrlWithTimestamp = (url, timestamp) => {
    const baseUrl = url.split("#")[0];
    return `${baseUrl}#t=${Math.floor(timestamp)}`;
  };

  const getYoutubeTimestamp = (url) => {
    if (!url) return 0;
    const match = url.match(/[?&]t=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Vimeo helpers: extract ID/hash, parse timestamp fragment, and embed URL
  const extractVimeoIdAndHash = (url) => {
    if (!url) return { id: null, hash: null };
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

  const getVimeoEmbedUrl = (url, timestamp = 0) => {
    const { id, hash } = extractVimeoIdAndHash(url);
    if (!id) return null;
    const query = hash ? `?h=${hash}&autoplay=1` : `?autoplay=1`;
    const base = `https://player.vimeo.com/video/${id}${query}`;
    const t = Math.max(0, Math.floor(timestamp));
    return t > 0 ? `${base}#t=${t}s` : base;
  };

  const onPlayerReady = useCallback((event) => {
    if (event && event.target) {
      playerRef.current = event.target;
    }
  }, []);

  // Process and validate timestamps
  const processedTimestamps = selectedVideo?.timestamps
    ? (() => {
        const timestamps = selectedVideo.timestamps;

        if (!timestamps) return [];

        // If timestamps is a string, try to parse it
        if (typeof timestamps === "string") {
          return parseTimestamps(timestamps);
        }

        if (!Array.isArray(timestamps)) return [];

        return timestamps.map((timestamp) => ({
          title: timestamp.title || timestamp.label || "Untitled",
          timestamp:
            typeof timestamp.timestamp === "number" ? timestamp.timestamp : 0,
          formattedTime: timestamp.formattedTime || "0:00",
        }));
      })()
    : [];

  // Filter timestamps by the search query (case-insensitive)
  const filteredTimestamps = processedTimestamps.filter((timestamp) =>
    timestamp.title
      .toLowerCase()
      .includes((timestampSearchQuery || "").toLowerCase())
  );

  // Handle swipe navigation - wrapped in useCallback to prevent unnecessary re-renders
  const handleSwipe = useCallback(
    (direction) => {
      if (!filteredTimestamps || filteredTimestamps.length === 0) return;

      let newIndex;
      if (direction === "up") {
        newIndex = (currentIndex + 1) % filteredTimestamps.length;
      } else {
        newIndex =
          (currentIndex - 1 + filteredTimestamps.length) %
          filteredTimestamps.length;
      }

      setCurrentIndex(newIndex);
      setCurrentTimestamp(filteredTimestamps[newIndex].timestamp);
    },
    [currentIndex, filteredTimestamps]
  );

  // Add touch event handlers for swipe detection
  useEffect(() => {
    if (!swipeMode || !swipeContainerRef.current) return;

    let touchStartY = 0;

    const handleTouchStart = (e) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;

      // Detect swipe direction (threshold of 50px)
      if (Math.abs(diff) > 50) {
        handleSwipe(diff > 0 ? "up" : "down");
      }
    };

    const container = swipeContainerRef.current;
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [swipeMode, handleSwipe]);

  // Add handler for native video element to sync with timestamps
  const handleNativeVideoRef = useCallback((videoElement) => {
    if (videoElement) {
      playerRef.current = {
        seekTo: (time) => {
          try {
            if (
              videoElement &&
              typeof videoElement.currentTime !== "undefined"
            ) {
              videoElement.currentTime = time;
            }
          } catch (error) {
            console.warn("Error setting video currentTime:", error);
          }
        },
      };
    }
  }, []);

  // Preload Vimeo thumbnails for visible videos
  useEffect(() => {
    const controller = new AbortController();
    const fetchThumb = async (id, hash, fullUrl) => {
      const cacheKey = `${id}:${hash || ""}`;
      if (!id || vimeoThumbCache.has(cacheKey)) return;
      try {
        const res = await fetch(
          `/api/vimeo-oembed?${
            fullUrl
              ? `url=${encodeURIComponent(fullUrl)}`
              : `id=${id}${hash ? `&hash=${hash}` : ""}`
          }`,
          { signal: controller.signal }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data?.thumbnailUrl) {
          vimeoThumbCache.set(cacheKey, data.thumbnailUrl);
          setVimeoThumbs((prev) => ({
            ...prev,
            [cacheKey]: data.thumbnailUrl,
          }));
        }
      } catch {}
    };

    videos.forEach((video) => {
      const url = video.videoUrl || video.url;
      if (!isVimeoUrl(url)) return;
      const { id, hash } = extractVimeoIdAndHash(url);
      fetchThumb(id, hash, url);
    });

    return () => controller.abort();
  }, [videos]);

  if (!isOpen) return null;

  const handleVideoClick = (video) => {
    const videoUrl = normalizeVideoUrl(video.videoUrl || video.url);

    if (getVideoType(videoUrl) === "instagram") {
      window.open(videoUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setSelectedVideo(video);
    setShowTimestamps(true);
  };

  const selectedVideoUrl = normalizeVideoUrl(
    selectedVideo?.videoUrl || selectedVideo?.url
  );
  const selectedVideoType = getVideoType(selectedVideoUrl);
  const selectedVideoSupportsTimestampSeeking =
    selectedVideoType && selectedVideoType !== "instagram";

  const toggleButtonClass = `flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
    swipeMode
      ? "bg-blue-100 text-blue-700"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
  }`;

  const searchInputClass = `w-full px-4 py-2.5 rounded-xl 
    bg-gradient-to-r from-blue-50/30 to-purple-50/30 
    border border-blue-100 
    text-sm 
    focus:outline-none focus:ring-2 
    focus:ring-blue-500/20 focus:border-blue-500/30 
    transition-all duration-200
    placeholder:text-gray-400 text-gray-600`;

  return (
    <Modal
      onClose={() => {
        setSelectedVideo(null);
        onClose();
      }}
      className="max-w-5xl w-full text-gray-700"
    >
      <div className="p-6">
        {/* Video Player Section (shown when a video is selected) */}
        {selectedVideo && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedVideo.name || selectedVideo.title}
              </h3>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Video Player */}
              <div className="lg:w-3/5">
                <div
                  ref={swipeContainerRef}
                  className={`relative w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 ${
                    selectedVideoType === "instagram"
                      ? "h-[70vh] max-h-[850px] bg-white"
                      : "aspect-video"
                  }`}
                >
                  {selectedVideo && (
                    <>
                      {selectedVideoType === "youtube" ? (
                        <YouTube
                          videoId={getYouTubeVideoId(selectedVideoUrl)}
                          opts={{
                            width: "100%",
                            height: "100%",
                            playerVars: {
                              autoplay: 1,
                              start:
                                currentTimestamp ||
                                getYoutubeTimestamp(selectedVideoUrl),
                              rel: 0,
                            },
                          }}
                          onReady={onPlayerReady}
                          className="absolute inset-0"
                        />
                      ) : selectedVideoType === "vimeo" ? (
                        (() => {
                          const start =
                            currentTimestamp || getVimeoTimestamp(selectedVideoUrl);
                          const { id } = extractVimeoIdAndHash(selectedVideoUrl) || {};
                          return (
                            <iframe
                              key={`${id || "vimeo"}-${Math.floor(start || 0)}`}
                              src={getVimeoEmbedUrl(selectedVideoUrl, start)}
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                              className="absolute inset-0 w-full h-full"
                              style={{ border: "none" }}
                            />
                          );
                        })()
                      ) : selectedVideoType === "instagram" ? (
                        <div className="absolute inset-0 flex justify-center bg-white">
                          <iframe
                            src={getInstagramEmbedUrl(selectedVideoUrl)}
                            title={selectedVideo.name || selectedVideo.title || "Instagram Post"}
                            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                            allowFullScreen
                            scrolling="no"
                            className="h-full w-full max-w-[420px]"
                            style={{ border: "none" }}
                          />
                        </div>
                      ) : selectedVideoType === "zoom" ? (
                        <iframe
                          src={getZoomUrlWithTimestamp(
                            selectedVideoUrl,
                            currentTimestamp
                          )}
                          allow="autoplay; fullscreen"
                          allowFullScreen
                          className="absolute inset-0 w-full h-full"
                          style={{ border: "none" }}
                        />
                      ) : selectedVideoType === "s3-video" ? (
                        <video
                          ref={handleNativeVideoRef}
                          src={selectedVideoUrl}
                          controls
                          autoPlay
                          className="w-full h-full object-contain bg-black transform-none"
                          style={{
                            transform: "none",
                            imageOrientation: "from-image",
                            objectPosition: "center",
                          }}
                        />
                      ) : (
                        <video
                          className="w-full h-full object-cover transform-none"
                          preload="metadata"
                          muted
                          style={{
                            transform: "none",
                            imageOrientation: "from-image",
                            objectPosition: "center",
                          }}
                        >
                          <source
                            src={selectedVideoUrl}
                            type="video/mp4"
                          />
                        </video>
                      )}

                      {/* Video navigation controls */}
                      {selectedVideoSupportsTimestampSeeking &&
                        filteredTimestamps.length > 0 && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-10">
                          <button
                            onClick={() => handleSwipe("down")}
                            className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors shadow-lg backdrop-blur-sm"
                            aria-label="Previous timestamp"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleSwipe("up")}
                            className="p-2.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors shadow-lg backdrop-blur-sm"
                            aria-label="Next timestamp"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-2 border-t border-gray-200 pt-2">
                  <span className="text-gray-500 text-sm">
                    {filteredTimestamps.length > 0 &&
                    currentIndex >= 0 &&
                    currentIndex < filteredTimestamps.length
                      ? filteredTimestamps[currentIndex].title
                      : selectedVideo.name || selectedVideo.title}
                  </span>
                </div>
              </div>

              {/* Side Panel: Description and Timestamps */}
              <div className="lg:w-2/5 space-y-4">
                {/* Video Description */}
                {selectedVideo?.description && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">
                      Details
                    </h4>
                    <div
                      className="text-sm text-gray-700 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(selectedVideo.description),
                      }}
                    />
                  </div>
                )}

                {/* Timestamps Panel */}
                {selectedVideoSupportsTimestampSeeking &&
                  processedTimestamps.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-600">
                          Timestamps{" "}
                          {filteredTimestamps.length !==
                            processedTimestamps.length &&
                            `(${filteredTimestamps.length}/${processedTimestamps.length})`}
                        </h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSwipeMode(!swipeMode)}
                            className={toggleButtonClass}
                          >
                            {swipeMode ? (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                                Grid
                              </>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path
                                    fillRule="evenodd"
                                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Swipe
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Swipe mode info */}
                      {swipeMode && filteredTimestamps.length > 0 && (
                        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 text-gray-800 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-blue-600">
                              {filteredTimestamps[currentIndex].formattedTime}
                            </span>
                            <span className="text-lg font-semibold">
                              {filteredTimestamps[currentIndex].title}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            {currentIndex + 1}/{filteredTimestamps.length}
                          </div>
                        </div>
                      )}

                      {!swipeMode && (
                        <>
                          <input
                            type="text"
                            placeholder="Search timestamps..."
                            value={timestampSearchQuery}
                            onChange={(e) =>
                              setTimestampSearchQuery(e.target.value)
                            }
                            className={searchInputClass}
                          />

                          <div className="mt-3 max-h-[300px] overflow-y-auto space-y-2 pr-2">
                            {filteredTimestamps.length > 0 ? (
                              filteredTimestamps.map((timestamp, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setCurrentTimestamp(timestamp.timestamp);
                                    setCurrentIndex(index);
                                  }}
                                  className={`flex items-center gap-3 p-3 text-left rounded-xl border transition-all w-full
                                  ${
                                    currentTimestamp === timestamp.timestamp
                                      ? "bg-blue-50 border-blue-200 text-blue-700"
                                      : "border-gray-100 hover:bg-gray-50 text-gray-700"
                                  }`}
                                >
                                  <span className="flex-shrink-0 text-sm font-medium">
                                    {timestamp.formattedTime}
                                  </span>
                                  <span className="flex-1 text-sm truncate">
                                    {timestamp.title}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="text-center py-8 text-gray-500">
                                {timestampSearchQuery ? (
                                  <>
                                    <p>
                                      No timestamps match &quot;
                                      {timestampSearchQuery}&quot;
                                    </p>
                                    <button
                                      className="mt-2 text-blue-600 text-sm hover:underline"
                                      onClick={() =>
                                        setTimestampSearchQuery("")
                                      }
                                    >
                                      Clear search
                                    </button>
                                  </>
                                ) : (
                                  "No timestamps found"
                                )}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                {!selectedVideoSupportsTimestampSeeking &&
                  processedTimestamps.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm text-sm text-gray-600">
                      Timestamp navigation is not available for Instagram embeds.
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Gallery Title */}
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
          <h3 className="text-xl font-semibold text-gray-800">
            {selectedVideo ? "More Videos" : "Video Gallery"}
          </h3>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => {
            const videoUrl = normalizeVideoUrl(video.videoUrl || video.url);
            const videoType = getVideoType(videoUrl);
            const isYoutube = videoType === "youtube";
            const youtubeId = isYoutube ? getYouTubeVideoId(videoUrl) : null;
            const isVimeo = videoType === "vimeo";
            const { id: vimeoId, hash: vimeoHash } = isVimeo
              ? extractVimeoIdAndHash(videoUrl)
              : { id: null, hash: null };
            const vimeoKey = vimeoId ? `${vimeoId}:${vimeoHash || ""}` : null;
            const vimeoThumb = vimeoKey ? vimeoThumbs[vimeoKey] : null;

            // Skip currently selected video when showing the grid
            if (selectedVideo && selectedVideo.id === video.id) {
              return null;
            }

            return (
              <div
                key={video.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col transition-all hover:shadow-md h-full cursor-pointer"
                onClick={() => handleVideoClick(video)}
              >
                <div className="relative aspect-video overflow-hidden h-[180px]">
                  {isYoutube ? (
                    <img
                      src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                      alt={video.name || video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : isVimeo ? (
                    vimeoThumb ? (
                      <img
                        src={vimeoThumb}
                        alt={video.name || video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-black flex items-center justify-center text-white text-xs">
                        Vimeo Video
                      </div>
                    )
                  ) : videoType === "instagram" ? (
                    <div className="w-full h-full bg-gradient-to-br from-fuchsia-600 via-rose-500 to-amber-400 flex flex-col items-center justify-center text-white">
                      <FaInstagram className="w-12 h-12 mb-3" />
                      <span className="text-sm font-medium">Instagram Post</span>
                    </div>
                  ) : (
                    <video
                      className="w-full h-full object-cover transform-none"
                      preload="metadata"
                      muted
                      style={{
                        transform: "none",
                        imageOrientation: "from-image",
                        objectPosition: "center",
                      }}
                    >
                      <source src={videoUrl} type="video/mp4" />
                    </video>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors">
                    {videoType === "instagram" ? (
                      <FaInstagram className="w-10 h-10 text-white hover:scale-110 transition-transform" />
                    ) : (
                      <FaPlayCircle className="w-10 h-10 text-white hover:scale-110 transition-transform" />
                    )}
                  </div>
                </div>

                <div className="p-3 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-800 truncate text-sm">
                      {video.name || video.title}
                    </h4>
                    {video.description && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDetails(
                            showDetails === video.id ? null : video.id
                          );
                        }}
                        className="text-gray-500 hover:text-blue-600 transition-colors"
                      >
                        <FaInfoCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {showDetails === video.id && video.description && (
                    <div
                      className="mb-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-md max-h-[60px] overflow-y-auto border border-gray-100"
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(video.description),
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}

                  <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                    {canEditVideo(video) && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(video);
                          }}
                          className="flex items-center gap-1 text-xs bg-gray-50 hover:bg-gray-100 text-gray-600 px-2 py-1 rounded transition-colors flex-1 justify-center"
                        >
                          <FaEdit className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(video);
                          }}
                          className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded transition-colors flex-1 justify-center"
                        >
                          <FaTrash className="w-3 h-3" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default VideoBrowser;
