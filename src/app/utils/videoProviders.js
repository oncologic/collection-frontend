const VIDEO_FILE_EXTENSIONS = [".mp4", ".mov", ".webm", ".avi", ".mpeg"];

export const normalizeVideoUrl = (url) => {
  if (typeof url !== "string") return null;

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  return /^https?:\/\//i.test(trimmedUrl)
    ? trimmedUrl
    : `https://${trimmedUrl}`;
};

const parseVideoUrl = (url) => {
  const normalizedUrl = normalizeVideoUrl(url);
  if (!normalizedUrl) return null;

  try {
    return new URL(normalizedUrl);
  } catch {
    return null;
  }
};

export const isYoutubeUrl = (url) => {
  const parsedUrl = parseVideoUrl(url);
  if (!parsedUrl) return false;

  const hostname = parsedUrl.hostname.toLowerCase();
  return (
    hostname === "youtu.be" ||
    hostname === "youtube.com" ||
    hostname.endsWith(".youtube.com")
  );
};

export const isVimeoUrl = (url) => {
  const parsedUrl = parseVideoUrl(url);
  if (!parsedUrl) return false;

  const hostname = parsedUrl.hostname.toLowerCase();
  return hostname === "vimeo.com" || hostname.endsWith(".vimeo.com");
};

const INSTAGRAM_EMBED_PATHS = new Set(["p", "reel", "tv"]);

export const isInstagramEmbedUrl = (url) => {
  const parsedUrl = parseVideoUrl(url);
  if (!parsedUrl) return false;

  const hostname = parsedUrl.hostname.toLowerCase();
  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);

  const isInstagramHost =
    hostname === "instagram.com" ||
    hostname.endsWith(".instagram.com") ||
    hostname === "instagr.am";

  return (
    isInstagramHost &&
    INSTAGRAM_EMBED_PATHS.has(pathParts[0]) &&
    Boolean(pathParts[1])
  );
};

export const getInstagramEmbedTarget = (url) => {
  const parsedUrl = parseVideoUrl(url);
  if (!parsedUrl) return null;

  const pathParts = parsedUrl.pathname.split("/").filter(Boolean);
  if (!INSTAGRAM_EMBED_PATHS.has(pathParts[0]) || !pathParts[1]) {
    return null;
  }

  return {
    kind: pathParts[0],
    id: pathParts[1],
  };
};

export const getInstagramEmbedUrl = (url) => {
  const target = getInstagramEmbedTarget(url);
  if (!target) return null;

  return `https://www.instagram.com/${target.kind}/${target.id}/embed/`;
};

export const getVideoType = (url) => {
  const normalizedUrl = normalizeVideoUrl(url);
  if (!normalizedUrl) return null;

  if (isYoutubeUrl(normalizedUrl)) return "youtube";
  if (isVimeoUrl(normalizedUrl)) return "vimeo";
  if (isInstagramEmbedUrl(normalizedUrl)) return "instagram";
  if (normalizedUrl.toLowerCase().includes("zoom.us")) return "zoom";

  const lowerUrl = normalizedUrl.toLowerCase();
  const parsedUrl = parseVideoUrl(normalizedUrl);
  const lowerPathname = parsedUrl?.pathname?.toLowerCase() || "";
  const hasVideoFileExtension = VIDEO_FILE_EXTENSIONS.some((extension) =>
    lowerPathname.endsWith(extension),
  );

  if (
    lowerUrl.includes("cloudfront.net") ||
    lowerUrl.includes("blob.core.windows.net") ||
    hasVideoFileExtension
  ) {
    return "s3-video";
  }

  return null;
};

export const isPlayableVideoUrl = (url) => Boolean(getVideoType(url));

export const getPlayableVideoUrl = (...urls) => {
  for (const url of urls) {
    if (isPlayableVideoUrl(url)) {
      return normalizeVideoUrl(url);
    }
  }

  return null;
};
