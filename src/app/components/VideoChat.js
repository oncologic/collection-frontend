import { useState, useEffect, useRef } from "react";
import {
  FaPlayCircle,
  FaVideo,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaSearch,
} from "react-icons/fa";
import VideoBrowser from "./VideoBrowser";
import { parseTimestamps } from "../utils/general";

const VideoChat = ({ videos = [], onEdit, onDelete, children }) => {
  const [isVideoBrowserOpen, setIsVideoBrowserOpen] = useState(false);
  const [videoCount, setVideoCount] = useState(0);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef(null);
  const [expandedTimestamps, setExpandedTimestamps] = useState({});

  // Filter videos based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVideos(videos);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = videos.filter((video) => {
      // Check video title
      if (
        video.name?.toLowerCase().includes(query) ||
        video.title?.toLowerCase().includes(query)
      ) {
        return true;
      }

      // Check video description
      if (video.description?.toLowerCase().includes(query)) {
        return true;
      }

      // Check timestamps
      let timestamps = [];
      if (typeof video.timestamps === "string") {
        timestamps = parseTimestamps(video.timestamps);
      } else if (Array.isArray(video.timestamps)) {
        timestamps = video.timestamps;
      }

      // Check if any timestamp matches the query
      return timestamps.some(
        (timestamp) =>
          timestamp.title?.toLowerCase().includes(query) ||
          timestamp.label?.toLowerCase().includes(query)
      );
    });

    setFilteredVideos(filtered);
  }, [searchQuery, videos]);

  // Set video count
  useEffect(() => {
    setVideoCount(videos.length);
  }, [videos]);

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]+)/
    );
    return match ? match[1] : null;
  };

  const isYoutubeUrl = (url) => {
    return url?.includes("youtube.com") || url?.includes("youtu.be");
  };

  // Helper function to format duration or get timestamp count
  const getVideoTimeInfo = (video) => {
    if (!video.timestamps) return null;

    let timestamps = [];
    if (typeof video.timestamps === "string") {
      timestamps = parseTimestamps(video.timestamps);
    } else if (Array.isArray(video.timestamps)) {
      timestamps = video.timestamps.map((ts) => {
        // Ensure each timestamp has the required properties
        return {
          title: ts.title || ts.label || "Untitled",
          timestamp: typeof ts.timestamp === "number" ? ts.timestamp : 0,
          formattedTime: ts.formattedTime || formatTime(ts.timestamp || 0),
        };
      });
    }

    // If timestamps might be in the description
    if (timestamps.length === 0 && video.description) {
      timestamps = parseTimestamps(video.description);
    }

    if (timestamps.length === 0) return null;

    // Filter timestamps if there's a search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      timestamps = timestamps.filter((ts) =>
        ts.title.toLowerCase().includes(query)
      );
    }

    return {
      count: timestamps.length,
      timestamps,
    };
  };

  // Helper function to format time from seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Add this handler for timestamp clicks
  const handleTimestampClick = (video, timestamp) => {
    // Store the video and selected timestamp in sessionStorage
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "selectedVideo",
        JSON.stringify({
          id: video.id,
          url: video.videoUrl || video.url,
          timestamp: timestamp.timestamp,
        })
      );
    }

    // Open the video browser
    setIsVideoBrowserOpen(true);
  };

  // Toggle timestamps visibility for a specific video
  const toggleTimestamps = (videoId) => {
    setExpandedTimestamps((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Get the videos to display
  const displayVideos = searchQuery.trim() ? filteredVideos : videos;
  // Get preview videos (up to 3)
  const previewVideos = displayVideos.slice(0, 3);

  return (
    <>
      {videoCount > 0 && (
        <div
          ref={containerRef}
          className="my-4 rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
        >
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <FaVideo className="text-blue-500" />
                <h3 className="text-sm font-medium text-gray-700">
                  {videoCount} Video{videoCount !== 1 ? "s" : ""}
                </h3>
              </div>
              <button
                onClick={() => setIsVideoBrowserOpen(true)}
                className="px-3 py-1.5 text-xs bg-blue-100 text-blue-700 font-medium rounded-full hover:bg-blue-200 transition-colors shadow-sm"
              >
                View All
              </button>
            </div>

            {/* Search Bar */}
            <div className="mt-3 relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search videos by title, description or timestamps..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full px-4 py-2 pl-10 rounded-lg border border-blue-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              {searchQuery && (
                <div className="mt-1 text-xs text-gray-600">
                  Showing {filteredVideos.length} of {videos.length} videos
                </div>
              )}
            </div>
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {previewVideos.map((video) => {
                const videoUrl = video.videoUrl || video.url;
                const isYoutube = isYoutubeUrl(videoUrl);
                const youtubeId = isYoutube
                  ? getYouTubeVideoId(videoUrl)
                  : null;
                const timeInfo = getVideoTimeInfo(video);
                const isExpanded = expandedTimestamps[video.id] || false;

                return (
                  <div
                    key={video.id}
                    className="flex flex-col rounded-lg overflow-hidden border border-gray-200 bg-white h-full"
                  >
                    <div
                      className="relative aspect-video cursor-pointer group h-[180px]"
                      onClick={() => setIsVideoBrowserOpen(true)}
                    >
                      {isYoutube ? (
                        <img
                          src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`}
                          alt={video.name || video.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <video
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          preload="metadata"
                          muted
                        >
                          <source src={videoUrl} type="video/mp4" />
                        </video>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                        <FaPlayCircle className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                        <h4 className="text-white text-sm font-medium truncate">
                          {video.name || video.title}
                        </h4>
                      </div>
                    </div>

                    {/* Timestamps section */}
                    {timeInfo && timeInfo.count > 0 && (
                      <div className="p-3 bg-white border-t border-gray-100 flex-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTimestamps(video.id);
                          }}
                          className="flex w-full items-center justify-between text-left mb-2"
                        >
                          <div className="flex items-center gap-2">
                            <FaClock className="text-blue-500 text-xs" />
                            <span className="text-xs text-gray-600 font-medium">
                              {timeInfo.count} Timestamp
                              {timeInfo.count !== 1 ? "s" : ""}
                              {searchQuery &&
                                timeInfo.count <
                                  (video.timestamps?.length || 0) &&
                                ` (filtered from ${
                                  typeof video.timestamps === "string"
                                    ? parseTimestamps(video.timestamps).length
                                    : video.timestamps?.length || 0
                                })`}
                            </span>
                          </div>
                          {isExpanded ? (
                            <FaChevronUp className="text-gray-400 text-xs" />
                          ) : (
                            <FaChevronDown className="text-gray-400 text-xs" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="space-y-1.5 max-h-24 overflow-y-auto transition-all duration-300">
                            {timeInfo.timestamps.length > 0 ? (
                              timeInfo.timestamps
                                .slice(0, 3)
                                .map((timestamp, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-2 cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent the parent video click handler from firing
                                      handleTimestampClick(video, timestamp);
                                    }}
                                  >
                                    <span className="text-xs font-medium text-blue-600 min-w-[36px]">
                                      {timestamp.formattedTime}
                                    </span>
                                    <span className="text-xs text-gray-700 truncate">
                                      {timestamp.title}
                                    </span>
                                  </div>
                                ))
                            ) : (
                              <div className="text-xs text-gray-500 text-center py-2">
                                No matching timestamps
                              </div>
                            )}
                            {timeInfo.timestamps.length > 3 && (
                              <div
                                className="text-xs text-blue-500 font-medium mt-1 cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Pass the filter query to VideoBrowser
                                  sessionStorage.setItem(
                                    "selectedVideo",
                                    JSON.stringify({
                                      id: video.id,
                                      timestampFilter: searchQuery,
                                    })
                                  );
                                  setIsVideoBrowserOpen(true);
                                }}
                              >
                                +{timeInfo.timestamps.length - 3} more...
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {displayVideos.length > 3 && (
                <div
                  className="relative aspect-video h-[180px] rounded-lg overflow-hidden cursor-pointer bg-gray-100 flex items-center justify-center border border-gray-200"
                  onClick={() => setIsVideoBrowserOpen(true)}
                >
                  <div className="text-center">
                    <span className="text-lg font-bold text-blue-600">
                      +{displayVideos.length - 3}
                    </span>
                    <p className="text-sm text-gray-600">more videos</p>
                  </div>
                </div>
              )}

              {displayVideos.length === 0 && searchQuery && (
                <div className="col-span-3 py-10 text-center text-gray-500">
                  <p>No videos found matching &quot;{searchQuery}&quot;</p>
                  <button
                    className="mt-2 text-blue-600 text-sm hover:underline"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear search
                  </button>
                </div>
              )}
            </div>
          </div>

          {children}
        </div>
      )}

      <VideoBrowser
        videos={searchQuery ? filteredVideos : videos}
        isOpen={isVideoBrowserOpen}
        onClose={() => setIsVideoBrowserOpen(false)}
        onEdit={onEdit}
        onDelete={onDelete}
        searchQuery={searchQuery}
      />
    </>
  );
};

export default VideoChat;
