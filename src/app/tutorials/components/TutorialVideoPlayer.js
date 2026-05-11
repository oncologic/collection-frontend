"use client";
import { useState, useRef, useEffect } from "react";
import {
  FaPlay,
  FaPause,
  FaExpand,
  FaCompress,
  FaVolumeUp,
  FaVolumeMute,
  FaClock,
  FaVideo,
  FaPlayCircle,
} from "react-icons/fa";
import YouTube from "react-youtube";
import { sanitizeHtml } from "@/app/utils/sanitizeHtml";

const TutorialVideoPlayer = ({ video, title, description, className = "" }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const playerRef = useRef(null);

  // Video type detection
  const getVideoType = (url) => {
    if (!url) return null;
    if (url.includes("youtube.com") || url.includes("youtu.be"))
      return "youtube";
    if (url.includes("zoom.us")) return "zoom";
    if (
      url.includes("cloudfront.net") ||
      url.endsWith(".mp4") ||
      url.endsWith(".mov") ||
      url.endsWith(".webm")
    )
      return "native";
    return null;
  };

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]+)/
    );
    return match ? match[1] : null;
  };

  const videoType = getVideoType(video?.url || video?.videoUrl);
  const youtubeId =
    videoType === "youtube"
      ? getYouTubeVideoId(video?.url || video?.videoUrl)
      : null;

  // YouTube player handlers
  const onYouTubeReady = (event) => {
    playerRef.current = event.target;
  };

  const onYouTubeStateChange = (event) => {
    setIsPlaying(event.data === 1); // 1 = playing
  };

  // Native video handlers
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
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
      containerRef.current.requestFullscreen().catch(console.error);
    } else {
      document.exitFullscreen();
    }
  };

  // Monitor fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Auto-hide controls
  useEffect(() => {
    let timeout;
    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    } else {
      setShowControls(true);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying]);

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!video) return null;

  return (
    <div className={`tutorial-video-player ${className}`}>
      {/* Video Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            {/* <p className="text-slate-400 text-sm">Video Tutorial</p> */}
          </div>
        </div>
        {description && (
          <div
            className="text-slate-300 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }}
          />
        )}
      </div>

      {/* Video Player Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-black group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => !isPlaying || setShowControls(false)}
      >
        {/* Video Content */}
        {videoType === "youtube" ? (
          <YouTube
            videoId={youtubeId}
            opts={{
              width: "100%",
              height: "100%",
              playerVars: {
                autoplay: 0,
                controls: 1,
                modestbranding: 1,
                rel: 0,
                iv_load_policy: 3,
              },
            }}
            onReady={onYouTubeReady}
            onStateChange={onYouTubeStateChange}
            className="absolute inset-0 w-full h-full"
          />
        ) : videoType === "native" ? (
          <video
            ref={videoRef}
            src={video.url || video.videoUrl}
            className="w-full h-full object-cover"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
            poster={video.thumbnail}
            preload="metadata"
          />
        ) : (
          // Fallback for other video types
          <div className="w-full h-full flex items-center justify-center bg-slate-800">
            <div className="text-center">
              <FaPlayCircle className="text-6xl text-slate-400 mb-4" />
              <p className="text-slate-300">Video format not supported</p>
            </div>
          </div>
        )}

        {/* Custom Controls Overlay (for native videos) */}
        {videoType === "native" && (
          <>
            {/* Play/Pause Overlay */}
            {!isPlaying && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
                onClick={togglePlay}
              >
                <div className="bg-white/90 rounded-full p-6 shadow-2xl transform hover:scale-110 transition-transform duration-200">
                  <FaPlay className="text-3xl text-gray-800 ml-1" />
                </div>
              </div>
            )}

            {/* Control Bar */}
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
                showControls ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Play/Pause Button */}
                <button
                  onClick={togglePlay}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isPlaying ? (
                    <FaPause className="text-xl" />
                  ) : (
                    <FaPlay className="text-xl" />
                  )}
                </button>

                {/* Time Display */}
                <div className="flex items-center gap-2 text-white text-sm">
                  <FaClock className="text-xs" />
                  <span>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Volume Control */}
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isMuted ? (
                    <FaVolumeMute className="text-xl" />
                  ) : (
                    <FaVolumeUp className="text-xl" />
                  )}
                </button>

                {/* Fullscreen Toggle */}
                <button
                  onClick={toggleFullscreen}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isFullscreen ? (
                    <FaCompress className="text-xl" />
                  ) : (
                    <FaExpand className="text-xl" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Premium Gradient Border Effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>

      {/* Video Info */}
      {/* <div className="mt-6 p-4 bg-slate-800/30 backdrop-blur-sm border border-slate-700 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-white font-semibold">
              {video.name || video.title}
            </h4>
            <p className="text-slate-400 text-sm">
              {video.type === "youtube" ? "YouTube Video" : "Video Content"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-medium">
              Tutorial
            </div>
            {video.duration && (
              <div className="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs">
                {video.duration}
              </div>
            )}
          </div>
        </div>
      </div> */}
    </div>
  );
};

export default TutorialVideoPlayer;
