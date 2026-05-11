"use client";

const RESERVED_PATHS = {
  instagram: new Set([
    "p",
    "reel",
    "reels",
    "tv",
    "stories",
    "explore",
    "accounts",
  ]),
  facebook: new Set([
    "pages",
    "groups",
    "watch",
    "events",
    "share",
    "reel",
    "profile.php",
  ]),
  twitter: new Set(["home", "explore", "search", "i", "intent", "share"]),
  linkedin: new Set(["feed", "company", "in", "school", "posts", "events"]),
  youtube: new Set(["watch", "shorts", "playlist", "results", "channel", "c", "user"]),
};

const ensureAbsoluteUrl = (value) => {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
};

const toTitleCase = (value = "") =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const humanizeSlug = (value = "") => {
  const cleaned = value
    .replace(/^@/, "")
    .replace(/\.[a-z]{2,}$/i, "")
    .replace(/[-_.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned ? toTitleCase(cleaned) : "";
};

const buildNormalizedUrl = (url, keepSearch = false) => {
  const normalized = `${url.protocol}//${url.hostname}${url.pathname.replace(/\/+$/, "") || "/"}`;
  return keepSearch && url.search ? `${normalized}${url.search}` : normalized;
};

const getHostnameLabel = (hostname = "") => {
  const parts = hostname.replace(/^www\./i, "").split(".");
  return humanizeSlug(parts[0] || hostname);
};

const inferPlatformKey = (hostname = "") => {
  const host = hostname.toLowerCase();

  if (host.includes("instagram.com")) return "instagram";
  if (host.includes("facebook.com") || host === "fb.com") return "facebook";
  if (host.includes("twitter.com")) return "twitter";
  if (host.includes("x.com")) return "x";
  if (host.includes("linkedin.com")) return "linkedin";
  if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
  if (host.includes("bsky.app")) return "bluesky";

  return "globe";
};

const extractHandle = (platformKey, url) => {
  const segments = url.pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (!firstSegment) {
    return null;
  }

  if (platformKey === "instagram") {
    if (RESERVED_PATHS.instagram.has(firstSegment.toLowerCase())) return null;
    return firstSegment.replace(/^@/, "");
  }

  if (platformKey === "facebook") {
    if (firstSegment.toLowerCase() === "profile.php") {
      return url.searchParams.get("id");
    }
    if (RESERVED_PATHS.facebook.has(firstSegment.toLowerCase())) return null;
    return firstSegment.replace(/^@/, "");
  }

  if (platformKey === "twitter" || platformKey === "x") {
    if (RESERVED_PATHS.twitter.has(firstSegment.toLowerCase())) return null;
    return firstSegment.replace(/^@/, "");
  }

  if (platformKey === "linkedin") {
    if ((firstSegment === "in" || firstSegment === "company" || firstSegment === "school") && segments[1]) {
      return segments[1].replace(/^@/, "");
    }
    return null;
  }

  if (platformKey === "youtube") {
    if (firstSegment.startsWith("@")) {
      return firstSegment.slice(1);
    }
    if ((firstSegment === "channel" || firstSegment === "c" || firstSegment === "user") && segments[1]) {
      return segments[1].replace(/^@/, "");
    }
    return null;
  }

  if (platformKey === "bluesky") {
    if (firstSegment === "profile" && segments[1]) {
      return segments[1].replace(/^@/, "");
    }
    return firstSegment.replace(/^@/, "");
  }

  return null;
};

export const parseSocialMediaProfileAutofill = (rawUrl) => {
  try {
    const absoluteUrl = ensureAbsoluteUrl(rawUrl);
    if (!absoluteUrl) {
      return null;
    }

    const url = new URL(absoluteUrl);
    const platformKey = inferPlatformKey(url.hostname);
    const handle = extractHandle(platformKey, url);
    const normalizedUrl = buildNormalizedUrl(
      url,
      platformKey === "facebook" && url.pathname.includes("profile.php")
    );

    const suggestedName =
      humanizeSlug(handle || "") || getHostnameLabel(url.hostname);

    return {
      normalizedUrl,
      platformKey,
      handle,
      suggestedName,
      hostname: url.hostname.replace(/^www\./i, ""),
    };
  } catch (error) {
    return null;
  }
};

const normalizePlatformToken = (value = "") => {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, "");

  if (normalized === "fainstagram") return "instagram";
  if (normalized === "fafacebook") return "facebook";
  if (normalized === "fatwitter") return "twitter";
  if (normalized === "falinkedin") return "linkedin";
  if (normalized === "fayoutube") return "youtube";
  if (normalized === "faglobeamericas") return "bluesky";
  if (normalized === "faglobe" || normalized === "website") return "globe";

  return normalized;
};

export const findPlatformOptionFromParsedUrl = (platforms = [], parsed) => {
  if (!parsed?.platformKey) {
    return null;
  }

  const parsedToken = normalizePlatformToken(parsed.platformKey);

  return (
    platforms.find(
      (platform) =>
        normalizePlatformToken(platform.name) === parsedToken ||
        normalizePlatformToken(platform.icon) === parsedToken
    ) || null
  );
};
