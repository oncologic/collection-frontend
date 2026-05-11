import React, { useState, useEffect, useRef, useCallback } from "react";
import YouTube from "react-youtube";
import { parseTimestamps } from "../utils/general";
import {
  getInstagramEmbedUrl,
  getVideoType,
  normalizeVideoUrl,
} from "../utils/videoProviders";

function TimestampModal({
  isOpen,
  onClose,
  timestamps,
  videoUrl,
  darkMode = false,
}) {
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [swipeMode, setSwipeMode] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const playerRef = useRef(null);
  const swipeContainerRef = useRef(null);

  // Reset the player reference when the modal closes
  useEffect(() => {
    if (!isOpen) {
      playerRef.current = null;
    }
  }, [isOpen]);

  // Modify the player ready handler to work with both video types
  const onPlayerReady = useCallback((event) => {
    if (event && event.target) {
      playerRef.current = event.target;
    }
  }, []);

  // Seek to the desired timestamp when the currentTimestamp changes
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

  // Reset timestamp, search query, and view mode when the modal is opened
  useEffect(() => {
    if (isOpen) {
      setCurrentTimestamp(0);
      setSearchQuery("");
      setSwipeMode(false);
      setCurrentIndex(0);
    }
  }, [isOpen]);

  // Process and validate timestamps
  const processedTimestamps = React.useMemo(() => {
    if (!timestamps) return [];

    // If timestamps is a string, try to parse it
    if (typeof timestamps === "string") {
      const parsedTimestamps = parseTimestamps(timestamps);
      return parsedTimestamps;
    }

    if (!Array.isArray(timestamps)) return [];

    const processed = timestamps.map((timestamp) => ({
      title: timestamp.title || timestamp.label || "Untitled",
      timestamp:
        typeof timestamp.timestamp === "number" ? timestamp.timestamp : 0,
      formattedTime: timestamp.formattedTime || "0:00",
    }));

    return processed;
  }, [timestamps]);

  // Filter timestamps by the search query (case-insensitive)
  const filteredTimestamps = React.useMemo(() => {
    const filtered = processedTimestamps.filter((timestamp) =>
      timestamp.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered;
  }, [processedTimestamps, searchQuery]);

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

  // Helper to extract the YouTube video ID
  const getYoutubeVideoId = (url) => {
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url?.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Add function to generate Zoom URL with timestamp
  const getZoomUrlWithTimestamp = (url, timestamp) => {
    const baseUrl = url.split("#")[0];
    return `${baseUrl}#t=${Math.floor(timestamp)}`;
  };

  // Add this new helper function to extract timestamp from URL
  const getYoutubeTimestamp = (url) => {
    if (!url) return 0;
    const match = url.match(/[?&]t=(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Vimeo helpers: extract ID/hash, parse timestamp, and build embed URL
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

  if (!isOpen) return null;

  const resolvedVideoUrl = normalizeVideoUrl(videoUrl);
  const videoType = getVideoType(resolvedVideoUrl);
  const canSeekByTimestamp = videoType && videoType !== "instagram";

  // Updated styling classes to break out of parent stacking contexts
  const overlayClass = `fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 transition-all duration-300`;

  const modalContainerClass = `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full md:max-w-4xl md:mx-4 bg-gradient-to-br from-white via-white to-gray-50 rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.15)] border border-gray-100 max-h-[90vh] overflow-y-auto`;

  const closeButtonClass = `absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50/80 transition-all duration-200 hidden md:block`;

  const mobileCloseButtonClass = `sticky top-0 left-0 right-0 w-full flex justify-center items-center py-2 bg-white md:hidden z-10`;

  const searchInputClass = `w-full px-4 py-2.5 rounded-xl 
    bg-white
    border border-gray-200 
    text-sm 
    focus:outline-none focus:ring-2 
    focus:ring-blue-500 focus:border-blue-500 
    transition-all duration-200
    placeholder:text-gray-400 text-gray-600`;

  const toggleButtonClass = `flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
    swipeMode
      ? "bg-blue-100 text-blue-700"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
  }`;

  return (
    <div className={overlayClass} onClick={onClose}>
      <div className={modalContainerClass} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className={closeButtonClass}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className={mobileCloseButtonClass}>
          <button
            onClick={onClose}
            className="w-16 h-1 bg-gray-300 rounded-full my-1"
            aria-label="Close modal"
          />
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Video Section */}
          <div
            ref={swipeContainerRef}
            className={`relative w-full ${
              videoType === "instagram"
                ? "h-[70vh] max-h-[850px] bg-white"
                : swipeMode
                ? "h-[50vh]"
                : "aspect-video"
            } rounded-lg overflow-hidden shadow-lg border border-gray-100 z-[999]`}
          >
            {resolvedVideoUrl && (
              <div className="absolute inset-0 z-[999]">
                {videoType === "youtube" && (
                  <YouTube
                    videoId={getYoutubeVideoId(resolvedVideoUrl)}
                    opts={{
                      width: "100%",
                      height: "100%",
                      playerVars: {
                        autoplay: 1,
                        start:
                          currentTimestamp || getYoutubeTimestamp(resolvedVideoUrl),
                        rel: 0,
                      },
                    }}
                    onReady={onPlayerReady}
                    className="absolute inset-0"
                  />
                )}
                {videoType === "vimeo" &&
                  (() => {
                    const start =
                      currentTimestamp || getVimeoTimestamp(resolvedVideoUrl);
                    const { id } = extractVimeoIdAndHash(resolvedVideoUrl) || {};
                    return (
                      <iframe
                        key={`${id || "vimeo"}-${Math.floor(start || 0)}`}
                        src={getVimeoEmbedUrl(resolvedVideoUrl, start)}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                        style={{ border: "none" }}
                      />
                    );
                  })()}
                {videoType === "instagram" && (
                  <div className="absolute inset-0 flex justify-center bg-white">
                    <iframe
                      src={getInstagramEmbedUrl(resolvedVideoUrl)}
                      title="Instagram Post"
                      allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                      allowFullScreen
                      scrolling="no"
                      className="h-full w-full max-w-[420px]"
                      style={{ border: "none" }}
                    />
                  </div>
                )}
                {videoType === "zoom" && (
                  <iframe
                    src={getZoomUrlWithTimestamp(
                      resolvedVideoUrl,
                      currentTimestamp
                    )}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                    style={{ border: "none" }}
                  />
                )}
                {videoType === "s3-video" && (
                  <video
                    ref={handleNativeVideoRef}
                    src={resolvedVideoUrl}
                    controls
                    autoPlay
                    className="absolute inset-0 w-full h-full object-contain bg-black transform-none"
                    style={{
                      transform: "none",
                      imageOrientation: "from-image",
                      objectPosition: "center",
                    }}
                  />
                )}
              </div>
            )}

            {/* Video navigation controls - Always visible */}
            {canSeekByTimestamp && filteredTimestamps.length > 0 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-[1000]">
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
          </div>

          {/* Swipe mode info section - moved below video with reduced padding */}
          {canSeekByTimestamp && swipeMode && filteredTimestamps.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 text-gray-800">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-600">
                  {filteredTimestamps[currentIndex].formattedTime}
                </span>
                <span className="text-lg font-semibold">
                  {filteredTimestamps[currentIndex].title}
                </span>
              </div>
              <div className="mt-1 text-xs text-gray-600">
                Click up/down or the chips to navigate • {currentIndex + 1}/
                {filteredTimestamps.length}
              </div>

              {/* Timestamp preview section */}
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="flex items-center gap-2 mb-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-blue-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="text-xs font-medium text-gray-700">
                    Coming up:
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 overflow-x-auto pb-1">
                  {filteredTimestamps.map((timestamp, idx) => {
                    // Show next 5 timestamps (wrapping around if needed)
                    const position =
                      (idx - currentIndex + filteredTimestamps.length) %
                      filteredTimestamps.length;
                    if (position > 0 && position <= 3) {
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentIndex(idx);
                            setCurrentTimestamp(timestamp.timestamp);
                          }}
                          className="flex-shrink-0 px-3 py-1.5 bg-white hover:bg-blue-50 border border-blue-100 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-medium text-blue-600">
                              {timestamp.formattedTime}
                            </span>
                            <span className="text-xs  truncate">
                              {timestamp.title}
                            </span>
                          </div>
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Timestamps Section */}
          {!canSeekByTimestamp && processedTimestamps.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Timestamp navigation is not available for Instagram embeds.
            </div>
          )}
          {canSeekByTimestamp && processedTimestamps.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  Video Timestamps
                </h2>
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
                        Grid View
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
                        Swipe Mode
                      </>
                    )}
                  </button>
                  <span className="text-sm text-gray-500">
                    {filteredTimestamps.length} timestamps
                  </span>
                </div>
              </div>

              {!swipeMode && (
                <>
                  <input
                    type="text"
                    placeholder="Search timestamps..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={searchInputClass}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[500px] md:max-h-[300px] overflow-y-auto pr-2">
                    {filteredTimestamps.length > 0 ? (
                      filteredTimestamps.map((timestamp, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentTimestamp(timestamp.timestamp);
                            setCurrentIndex(index);
                          }}
                          className={`flex items-center gap-3 p-4 md:p-3 text-left rounded-xl border transition-all duration-200
                            ${
                              currentTimestamp === timestamp.timestamp
                                ? "bg-blue-100 border-blue-300 text-blue-700 font-medium"
                                : "bg-white border-gray-200 hover:bg-gray-50 text-gray-700"
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
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        No timestamps found
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TimestampModal;
