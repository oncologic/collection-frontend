"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import YouTube from "react-youtube";
import {
  FaChevronLeft,
  FaChevronRight,
  FaExternalLinkAlt,
  FaGlobe,
  FaInstagram,
  FaLink,
  FaPause,
  FaPlay,
  FaSearch,
  FaStepBackward,
  FaStepForward,
  FaVideo,
} from "react-icons/fa";
import {
  getInstagramEmbedUrl,
  getPlayableVideoUrl,
  getVideoType,
  normalizeVideoUrl,
} from "@/app/utils/videoProviders";
import {
  sanitizeHtml as sanitizeHtmlSafe,
  stripHtmlToText as stripHtmlToTextSafe,
} from "@/app/utils/sanitizeHtml";

const getExternalLinkTypeLabel = (type) => {
  if (!type) return "Link";

  return type
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const stripHtml = (html) => stripHtmlToTextSafe(html || "");
const sanitizeHtml = (html) => sanitizeHtmlSafe(html || "");

const truncateText = (value, maxLength = 130) => {
  const text = stripHtml(value).trim();
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
};

const formatSeconds = (totalSeconds) => {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = Math.floor(safeSeconds % 60);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const parseTimestampValue = (value) => {
  if (typeof value === "number") return value;
  if (!value || typeof value !== "string") return 0;

  const parts = value.split(":").map((part) => Number.parseInt(part, 10));
  if (parts.some((part) => Number.isNaN(part))) return 0;

  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }

  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }

  return parts[0] || 0;
};

const parseVideoTimestamps = (timestamps) => {
  if (!timestamps) return [];

  if (Array.isArray(timestamps)) {
    return timestamps
      .map((timestamp) => {
        const seconds =
          typeof timestamp.timestamp === "number"
            ? timestamp.timestamp
            : parseTimestampValue(timestamp.timestamp || timestamp.time);

        return {
          title: stripHtml(
            timestamp.title || timestamp.label || timestamp.name || "Untitled"
          ),
          timestamp: seconds,
          formattedTime: timestamp.formattedTime || formatSeconds(seconds),
        };
      })
      .filter((timestamp) => Number.isFinite(timestamp.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  if (typeof timestamps !== "string") return [];

  const normalizedText = timestamps.replace(/\\\\n/g, "\n").replace(/\\n/g, "\n");
  const timestampSection =
    normalizedText.split(/timestamps:?\s*/i)[1] || normalizedText;
  const lines = timestampSection
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsedTimestamps = [];

  lines.forEach((line) => {
    const patterns = [
      /^(.+?)\s+at:\s*(\d{1,2}:\d{2}(?::\d{2})?)/i,
      /^(.+?):\s*(\d{1,2}:\d{2}(?::\d{2})?)/i,
      /^(\d{1,2}:\d{2}(?::\d{2})?)\s*[-–—]\s*(.+)/i,
      /^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)/i,
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (!match) continue;

      const timeFirst = pattern.source.startsWith("^(\\d");
      const timeValue = timeFirst ? match[1] : match[2];
      const title = timeFirst ? match[2] : match[1];
      const seconds = parseTimestampValue(timeValue);

      parsedTimestamps.push({
        title: stripHtml(title.trim()),
        timestamp: seconds,
        formattedTime: timeValue,
      });
      break;
    }
  });

  return parsedTimestamps.sort((a, b) => a.timestamp - b.timestamp);
};

const parseTimeToSeconds = (value) => {
  if (!value) return 0;

  if (/^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }

  const hours = value.match(/(\d+)h/);
  const minutes = value.match(/(\d+)m/);
  const seconds = value.match(/(\d+)s/);

  return (
    (hours ? Number.parseInt(hours[1], 10) * 3600 : 0) +
    (minutes ? Number.parseInt(minutes[1], 10) * 60 : 0) +
    (seconds ? Number.parseInt(seconds[1], 10) : 0)
  );
};

const getYouTubeVideoId = (url) => {
  const normalizedUrl = normalizeVideoUrl(url);
  if (!normalizedUrl) return null;

  try {
    const parsedUrl = new URL(normalizedUrl);
    const hostname = parsedUrl.hostname.toLowerCase();
    const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

    if (hostname === "youtu.be") {
      return pathParts[0] || null;
    }

    if (hostname.includes("youtube.com")) {
      if (parsedUrl.searchParams.get("v")) {
        return parsedUrl.searchParams.get("v");
      }

      if (pathParts[0] === "embed" || pathParts[0] === "shorts") {
        return pathParts[1] || null;
      }
    }
  } catch {
    const match = normalizedUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|watch\?v=|watch\?.+&v=))([^#&?]+)/
    );
    return match?.[1] || null;
  }

  return null;
};

const getYouTubeStartSeconds = (url) => {
  const normalizedUrl = normalizeVideoUrl(url);
  if (!normalizedUrl) return 0;

  try {
    const parsedUrl = new URL(normalizedUrl);
    return (
      parseTimeToSeconds(parsedUrl.searchParams.get("start")) ||
      parseTimeToSeconds(parsedUrl.searchParams.get("t")) ||
      parseTimeToSeconds(parsedUrl.hash.replace(/^#t=/, ""))
    );
  } catch {
    return 0;
  }
};

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
  const fragment = url.split("#")[1];
  if (!fragment) return 0;

  const match = fragment.match(/t=(?:(\d+)m)?(?:(\d+)s)?|t=(\d+)/);
  if (!match) return 0;

  if (match[3]) return Number.parseInt(match[3], 10);

  const minutes = match[1] ? Number.parseInt(match[1], 10) : 0;
  const seconds = match[2] ? Number.parseInt(match[2], 10) : 0;
  return minutes * 60 + seconds;
};

const getVimeoEmbedUrl = (url, shouldAutoplay = true, startTime = 0) => {
  const { id, hash } = extractVimeoIdAndHash(url);
  if (!id) return null;

  const params = new URLSearchParams({ dnt: "1" });

  if (shouldAutoplay) {
    params.set("autoplay", "1");
  }

  if (hash) {
    params.set("h", hash);
  }

  const timestamp = startTime || getVimeoTimestamp(url);
  const baseUrl = `https://player.vimeo.com/video/${id}?${params.toString()}`;
  return timestamp > 0 ? `${baseUrl}#t=${timestamp}s` : baseUrl;
};

const isVideoFileUrl = (url) => {
  if (!url || typeof url !== "string") return false;

  try {
    const parsedUrl = new URL(normalizeVideoUrl(url));
    return /\.(mp4|mov|webm|avi|mpeg|mkv)$/i.test(parsedUrl.pathname);
  } catch {
    return /\.(mp4|mov|webm|avi|mpeg|mkv)(?:\?|$)/i.test(url);
  }
};

const getVideoThumbnailUrl = (video) => {
  if (!video) return null;

  if (video.thumbnailUrl) return video.thumbnailUrl;
  if (video.thumbnail) return video.thumbnail;
  if (video.previewImage) return video.previewImage;
  if (video.imageUrl) return video.imageUrl;

  if (video.videoType === "youtube") {
    const videoId = getYouTubeVideoId(video.url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : null;
  }

  return null;
};

const resolveVideoUrl = (...urls) => {
  const playableUrl = getPlayableVideoUrl(...urls);
  if (playableUrl) {
    return {
      url: playableUrl,
      videoType: getVideoType(playableUrl),
      isNativeVideo: getVideoType(playableUrl) === "s3-video",
    };
  }

  const directFileUrl = urls.find((url) => isVideoFileUrl(url));
  if (directFileUrl) {
    return {
      url: normalizeVideoUrl(directFileUrl),
      videoType: "s3-video",
      isNativeVideo: true,
    };
  }

  return {
    url: null,
    videoType: null,
    isNativeVideo: false,
  };
};

const getExternalLinkDetailsHref = (externalLinkId, collectionId) =>
  collectionId
    ? `/public/external-links/${externalLinkId}?collectionId=${encodeURIComponent(
        collectionId
      )}`
    : `/public/external-links/${externalLinkId}`;

const getOrderValue = (item) => {
  const value =
    item?.orderPosition ??
    item?.collectionOrderPosition ??
    item?.sortOrder ??
    item?.listOrder;

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
};

const sortByCuratedOrder = (items = []) =>
  [...items].sort((a, b) => {
    const aOrder = getOrderValue(a);
    const bOrder = getOrderValue(b);

    if (aOrder === null && bOrder === null) return 0;
    if (aOrder === null) return 1;
    if (bOrder === null) return -1;

    return aOrder - bOrder;
  });

const collectVideos = (collection) => {
  const videos = [];
  const seen = new Set();

  const addVideo = (video) => {
    if (!video?.url || !video.videoType) return;

    const dedupeKey = `${video.url}-${video.sourceId || ""}`;
    if (seen.has(dedupeKey)) return;

    seen.add(dedupeKey);
    videos.push({
      ...video,
      id: video.id || `${video.sourceId || "video"}-${videos.length}`,
      name: video.name || "Untitled Video",
      sourceName: video.sourceName || collection?.name || "Collection",
      sourceLabel: video.sourceLabel || "Collection Video",
      description: video.description || "",
      openUrl: video.openUrl || video.url,
    });
  };

  sortByCuratedOrder(collection?.resources || []).forEach((resource) => {
    const resolved = resolveVideoUrl(
      resource.videoUrl,
      resource.presignedVideoUrl,
      resource.url
    );

    addVideo({
      id: `resource-${resource.id}`,
      sourceId: resource.id,
      name: resource.name,
      url: resolved.url,
      videoType: resolved.videoType,
      isNativeVideo: resolved.isNativeVideo,
      description: resource.collectionNotes || resource.description,
      imageUrl: resource.imageUrl || resource.presignedImageUrl,
      openUrl: resource.url || resolved.url,
      sourceLabel: "Resource",
      sourceName: collection?.name,
      timestamps: resource.timestamps,
    });
  });

  sortByCuratedOrder(collection?.externalLinks || []).forEach((link) => {
    const linkDetailsHref = getExternalLinkDetailsHref(link.id, collection.id);
    const linkTypeLabel = getExternalLinkTypeLabel(link.type);
    const linkSourceName = link.name || "External Link";
    const linkResolved = resolveVideoUrl(link.url);

    addVideo({
      id: `external-link-${link.id}`,
      sourceId: link.id,
      name: link.name,
      url: linkResolved.url,
      videoType: linkResolved.videoType,
      isNativeVideo: linkResolved.isNativeVideo,
      description: link.collectionNotes || link.description || link.notes,
      imageUrl: link.imageUrl || link.presignedImageUrl,
      openUrl: link.url || linkDetailsHref,
      sourceHref: linkDetailsHref,
      sourceLabel: linkTypeLabel,
      sourceName: linkSourceName,
      timestamps: link.timestamps,
    });

    sortByCuratedOrder(link.linkGroups || []).forEach((linkGroup) => {
      const resolved = resolveVideoUrl(linkGroup.url);

      addVideo({
        id: `link-group-${link.id}-${linkGroup.id}`,
        sourceId: linkGroup.id,
        name: linkGroup.name,
        url: resolved.url,
        videoType: resolved.videoType,
        isNativeVideo: resolved.isNativeVideo,
        description: linkGroup.description,
        openUrl: linkGroup.url,
        sourceHref: linkDetailsHref,
        sourceLabel: linkGroup.category || "Related Video",
        sourceName: linkSourceName,
      });
    });

    sortByCuratedOrder(link.attachments || []).forEach((attachment) => {
      const rawUrl = attachment.presignedUrl || attachment.url;
      const resolved =
        attachment.type === "video"
          ? {
              url: normalizeVideoUrl(rawUrl),
              videoType: getVideoType(rawUrl) || "s3-video",
              isNativeVideo: true,
            }
          : resolveVideoUrl(rawUrl);

      addVideo({
        id: `attachment-${link.id}-${attachment.id}`,
        sourceId: attachment.id,
        name: attachment.title,
        url: resolved.url,
        videoType: resolved.videoType,
        isNativeVideo: resolved.isNativeVideo,
        description: attachment.description,
        imageUrl:
          attachment.videoThumbnailUrl ||
          attachment.thumbnailUrl ||
          attachment.thumbnailPresignedUrl ||
          attachment.previewImage,
        openUrl: rawUrl || linkDetailsHref,
        sourceHref: linkDetailsHref,
        sourceLabel: "Attachment",
        sourceName: linkSourceName,
      });
    });

    sortByCuratedOrder(link.resources || []).forEach((resource) => {
      const resolved = resolveVideoUrl(
        resource.videoUrl,
        resource.presignedVideoUrl,
        resource.url
      );

      addVideo({
        id: `external-resource-${link.id}-${resource.id}`,
        sourceId: resource.id,
        name: resource.name,
        url: resolved.url,
        videoType: resolved.videoType,
        isNativeVideo: resolved.isNativeVideo,
        description: resource.notes || resource.description,
        imageUrl: resource.imageUrl || resource.presignedImageUrl,
        openUrl: resource.url || resolved.url,
        sourceHref: linkDetailsHref,
        sourceLabel: "Resource",
        sourceName: linkSourceName,
        timestamps: resource.timestamps,
      });
    });
  });

  return videos;
};

const VideoFrame = ({ video, shouldPlay, startTime = 0, onPlay, onEnded }) => {
  const vimeoIframeRef = useRef(null);
  const nativeVideoRef = useRef(null);

  useEffect(() => {
    if (video?.videoType !== "vimeo") return undefined;

    const handleMessage = (event) => {
      if (!event.origin.includes("player.vimeo.com")) return;

      let data = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      if (data?.event === "finish") {
        onEnded();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onEnded, video?.videoType]);

  if (!video) return null;

  if (!shouldPlay) {
    const thumbnailUrl = getVideoThumbnailUrl(video);

    return (
      <button
        type="button"
        onClick={onPlay}
        className="absolute inset-0 flex h-full w-full items-center justify-center bg-slate-950 text-white"
        aria-label={`Play ${video.name}`}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-70"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-blue-950" />
        )}
        <span className="relative inline-flex h-16 w-16 items-center justify-center rounded-full bg-white text-blue-700 shadow-xl transition-transform hover:scale-105">
          <FaPlay className="ml-1 h-6 w-6" />
        </span>
      </button>
    );
  }

  if (video.videoType === "youtube") {
    const videoId = getYouTubeVideoId(video.url);

    if (!videoId) return null;

    return (
      <YouTube
        key={`${video.id}-${startTime}`}
        videoId={videoId}
        opts={{
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1,
            rel: 0,
            playsinline: 1,
            start: Math.floor(startTime || getYouTubeStartSeconds(video.url)),
          },
        }}
        onEnd={onEnded}
        className="absolute inset-0 h-full w-full"
        iframeClassName="absolute inset-0 h-full w-full"
        title={video.name}
      />
    );
  }

  if (video.videoType === "vimeo") {
    const embedUrl = getVimeoEmbedUrl(video.url, shouldPlay, startTime);

    return (
      <iframe
        ref={vimeoIframeRef}
        key={`${video.id}-${startTime}`}
        src={embedUrl}
        title={video.name}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="absolute inset-0 h-full w-full"
        onLoad={() => {
          vimeoIframeRef.current?.contentWindow?.postMessage(
            JSON.stringify({
              method: "addEventListener",
              value: "finish",
            }),
            "https://player.vimeo.com"
          );
        }}
      />
    );
  }

  if (video.videoType === "instagram") {
    const embedUrl = getInstagramEmbedUrl(video.url);

    return (
      <iframe
        key={video.id}
        src={embedUrl}
        title={video.name}
        allow="encrypted-media; picture-in-picture"
        className="absolute inset-0 h-full w-full bg-white"
      />
    );
  }

  return (
    <video
      key={`${video.id}-${startTime}`}
      ref={nativeVideoRef}
      controls
      autoPlay={shouldPlay}
      playsInline
      className="absolute inset-0 h-full w-full object-contain"
      src={video.url}
      onLoadedMetadata={() => {
        if (startTime && nativeVideoRef.current) {
          nativeVideoRef.current.currentTime = startTime;
        }
      }}
      onEnded={onEnded}
    >
      Your browser does not support the video tag.
    </video>
  );
};

const VideoThumbnail = ({ video, isActive }) => {
  const thumbnailUrl = getVideoThumbnailUrl(video);

  return (
    <div
      className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border ${
        isActive ? "border-blue-500" : "border-slate-200"
      } bg-slate-900`}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="h-full w-full object-cover opacity-85"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-blue-900 text-white">
          <FaVideo className="h-6 w-6 opacity-80" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
        {video.videoType === "instagram" ? (
          <FaInstagram className="h-5 w-5 text-white" />
        ) : (
          <FaPlay className="h-4 w-4 text-white" />
        )}
      </div>
    </div>
  );
};

const CollectionVideoPlaylist = ({ collection }) => {
  const videos = useMemo(() => collectVideos(collection), [collection]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasStartedPlayback, setHasStartedPlayback] = useState(false);
  const [activeStartTime, setActiveStartTime] = useState(0);
  const [timestampSearch, setTimestampSearch] = useState("");
  const [continuousPlay, setContinuousPlay] = useState(true);

  useEffect(() => {
    setActiveIndex(0);
    setHasStartedPlayback(false);
    setActiveStartTime(0);
    setTimestampSearch("");
  }, [collection?.id]);

  useEffect(() => {
    if (activeIndex >= videos.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, videos.length]);

  const activeVideo = videos[activeIndex] || null;
  const activeTimestamps = useMemo(
    () => parseVideoTimestamps(activeVideo?.timestamps),
    [activeVideo?.timestamps]
  );
  const filteredTimestamps = useMemo(() => {
    const searchValue = timestampSearch.trim().toLowerCase();
    if (!searchValue) return activeTimestamps;

    return activeTimestamps.filter((timestamp) =>
      timestamp.title.toLowerCase().includes(searchValue)
    );
  }, [activeTimestamps, timestampSearch]);

  const goToVideo = useCallback(
    (index) => {
      if (!videos.length) return;
      setActiveIndex((index + videos.length) % videos.length);
      setActiveStartTime(0);
      setTimestampSearch("");
    },
    [videos.length]
  );

  const goToNext = useCallback(() => {
    goToVideo(activeIndex + 1);
  }, [activeIndex, goToVideo]);

  const goToPrevious = useCallback(() => {
    goToVideo(activeIndex - 1);
  }, [activeIndex, goToVideo]);

  const handleEnded = useCallback(() => {
    if (continuousPlay && videos.length > 1) {
      goToNext();
    }
  }, [continuousPlay, goToNext, videos.length]);

  const handleTimestampClick = (timestamp) => {
    setActiveStartTime(timestamp.timestamp);
    setHasStartedPlayback(true);
  };

  if (!videos.length || !activeVideo) {
    return null;
  }

  return (
    <section className="bg-white py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <FaVideo className="mr-2" />
              Collection Videos
            </div>
            <h2 className="text-3xl font-bold text-slate-950 md:text-4xl">
              Watch the Collection
            </h2>
            <p className="mt-2 text-base text-slate-600">
              {videos.length} {videos.length === 1 ? "video" : "videos"} in
              this shared collection
            </p>
          </div>

          {videos.length > 1 && (
            <button
              type="button"
              onClick={() => setContinuousPlay((value) => !value)}
              className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                continuousPlay
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {continuousPlay ? (
                <FaPlay className="mr-2 h-3.5 w-3.5" />
              ) : (
                <FaPause className="mr-2 h-3.5 w-3.5" />
              )}
              Continuous play
            </button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="relative aspect-video bg-slate-950">
              <VideoFrame
                video={activeVideo}
                shouldPlay={hasStartedPlayback}
                startTime={activeStartTime}
                onPlay={() => setHasStartedPlayback(true)}
                onEnded={handleEnded}
              />
            </div>

            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-1">
                      <FaGlobe className="h-3 w-3" />
                      {activeVideo.sourceLabel}
                    </span>
                    <span className="truncate normal-case tracking-normal">
                      {activeVideo.sourceName}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold leading-tight text-slate-950">
                    {activeVideo.name}
                  </h3>
                </div>

                <div className="flex flex-shrink-0 items-center gap-2">
                  {activeVideo.sourceHref && (
                    <a
                      href={activeVideo.sourceHref}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
                      title="View details"
                      aria-label="View details"
                    >
                      <FaLink className="h-4 w-4" />
                    </a>
                  )}
                  {activeVideo.openUrl && (
                    <a
                      href={activeVideo.openUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700"
                      title="Open video"
                      aria-label="Open video"
                    >
                      <FaExternalLinkAlt className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>

              {activeVideo.description && (
                <div
                  className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(activeVideo.description),
                  }}
                />
              )}

              {activeTimestamps.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="text-base font-bold text-slate-950">
                      Video Timestamps
                    </h4>
                    <span className="text-sm font-medium text-slate-500">
                      {activeTimestamps.length}{" "}
                      {activeTimestamps.length === 1
                        ? "timestamp"
                        : "timestamps"}
                    </span>
                  </div>

                  {activeTimestamps.length > 4 && (
                    <div className="relative mb-3">
                      <FaSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={timestampSearch}
                        onChange={(event) =>
                          setTimestampSearch(event.target.value)
                        }
                        placeholder="Search timestamps..."
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  )}

                  <div className="grid gap-2 sm:grid-cols-2">
                    {filteredTimestamps.map((timestamp) => (
                      <button
                        key={`${timestamp.timestamp}-${timestamp.title}`}
                        type="button"
                        onClick={() => handleTimestampClick(timestamp)}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                          activeStartTime === timestamp.timestamp
                            ? "border-blue-300 bg-blue-50 text-blue-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span className="shrink-0 rounded bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-slate-700">
                          {timestamp.formattedTime}
                        </span>
                        <span className="min-w-0 truncate font-medium">
                          {timestamp.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {videos.length > 1 && (
                <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={goToPrevious}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
                    title="Previous video"
                    aria-label="Previous video"
                  >
                    <FaStepBackward className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    onClick={goToNext}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white transition-colors hover:bg-blue-700"
                    title="Next video"
                    aria-label="Next video"
                  >
                    <FaStepForward className="h-4 w-4" />
                  </button>

                  <span className="text-sm font-medium text-slate-500">
                    {activeIndex + 1} of {videos.length}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-base font-bold text-slate-950">Playlist</h3>
              <span className="text-sm font-medium text-slate-500">
                {videos.length}
              </span>
            </div>

            <div className="max-h-[620px] overflow-y-auto p-3">
              {videos.map((video, index) => {
                const isActive = index === activeIndex;

                return (
                  <button
                    key={video.id}
                    type="button"
                    onClick={() => goToVideo(index)}
                    className={`mb-2 flex w-full gap-3 rounded-lg p-2 text-left transition-colors last:mb-0 ${
                      isActive
                        ? "bg-blue-50 ring-1 ring-blue-200"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <VideoThumbnail video={video} isActive={isActive} />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-semibold leading-5 ${
                          isActive ? "text-blue-900" : "text-slate-950"
                        }`}
                      >
                        {video.name}
                      </span>
                      <span className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                        {index === activeIndex ? (
                          <FaChevronRight className="h-3 w-3 text-blue-600" />
                        ) : (
                          <FaChevronLeft className="h-3 w-3 opacity-0" />
                        )}
                        <span className="truncate">{video.sourceName}</span>
                      </span>
                      {video.description && (
                        <span className="mt-1 line-clamp-2 block text-xs leading-5 text-slate-500">
                          {truncateText(video.description, 110)}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CollectionVideoPlaylist;
