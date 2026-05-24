/**
 * Video Matcher Utility
 * Matches videos with tutorial content based on title similarity
 */

// Normalize text for comparison
const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "") // Remove punctuation
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
};

// Calculate similarity between two strings using Levenshtein distance
const calculateSimilarity = (str1, str2) => {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);

  if (normalized1 === normalized2) return 1;
  if (!normalized1 || !normalized2) return 0;

  const matrix = [];
  const len1 = normalized1.length;
  const len2 = normalized2.length;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = normalized1[i - 1] === normalized2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return maxLen === 0 ? 1 : (maxLen - matrix[len1][len2]) / maxLen;
};

// Check for exact word matches
const hasExactWordMatch = (str1, str2) => {
  const words1 = normalizeText(str1).split(" ");
  const words2 = normalizeText(str2).split(" ");

  return words1.some((word1) =>
    words2.some(
      (word2) => word1.length > 3 && word2.length > 3 && word1 === word2,
    ),
  );
};

// Check for keyword matches
const hasKeywordMatch = (
  str1,
  str2,
  keywords = ["tutorial", "guide", "how to", "getting started"],
) => {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);

  return keywords.some(
    (keyword) => normalized1.includes(keyword) && normalized2.includes(keyword),
  );
};

/**
 * Find matching videos for tutorial content
 * @param {Array} videos - Array of video objects
 * @param {Object} tutorialData - Tutorial data with name and notations
 * @param {Object} options - Matching options
 * @returns {Object} Matched videos organized by content
 */
export const findMatchingVideos = (
  videos = [],
  tutorialData = {},
  options = {},
) => {
  const {
    minSimilarity = 0.6,
    exactMatchBonus = 0.3,
    keywordMatchBonus = 0.2,
    enableFuzzyMatching = true,
  } = options;

  if (!videos.length || !tutorialData) {
    return { tutorialVideo: null, notationVideos: [] };
  }

  const matches = {
    tutorialVideo: null,
    notationVideos: [],
  };

  // Match main tutorial video
  if (tutorialData.name) {
    let bestMatch = null;
    let bestScore = 0;

    videos.forEach((video) => {
      const videoTitle = video.name || video.title || "";
      let score = 0;

      // Calculate base similarity
      if (enableFuzzyMatching) {
        score = calculateSimilarity(tutorialData.name, videoTitle);
      }

      // Bonus for exact word matches
      if (hasExactWordMatch(tutorialData.name, videoTitle)) {
        score += exactMatchBonus;
      }

      // Bonus for keyword matches
      if (hasKeywordMatch(tutorialData.name, videoTitle)) {
        score += keywordMatchBonus;
      }

      // Exact match gets highest priority
      if (normalizeText(tutorialData.name) === normalizeText(videoTitle)) {
        score = 1;
      }

      if (score >= minSimilarity && score > bestScore) {
        bestScore = score;
        bestMatch = {
          ...video,
          matchScore: score,
          matchType: score === 1 ? "exact" : "fuzzy",
        };
      }
    });

    matches.tutorialVideo = bestMatch;
  }

  // Match videos for notations
  if (tutorialData.notations && Array.isArray(tutorialData.notations)) {
    tutorialData.notations.forEach((notation, index) => {
      if (!notation.title) return;

      let bestMatch = null;
      let bestScore = 0;

      videos.forEach((video) => {
        // Skip if this video is already matched as the main tutorial video
        if (matches.tutorialVideo && video.id === matches.tutorialVideo.id) {
          return;
        }

        const videoTitle = video.name || video.title || "";
        let score = 0;

        // Calculate base similarity
        if (enableFuzzyMatching) {
          score = calculateSimilarity(notation.title, videoTitle);
        }

        // Bonus for exact word matches
        if (hasExactWordMatch(notation.title, videoTitle)) {
          score += exactMatchBonus;
        }

        // Bonus for keyword matches
        if (hasKeywordMatch(notation.title, videoTitle)) {
          score += keywordMatchBonus;
        }

        // Exact match gets highest priority
        if (normalizeText(notation.title) === normalizeText(videoTitle)) {
          score = 1;
        }

        if (score >= minSimilarity && score > bestScore) {
          bestScore = score;
          bestMatch = {
            ...video,
            matchScore: score,
            matchType: score === 1 ? "exact" : "fuzzy",
            notationId: notation.id,
            notationIndex: index,
          };
        }
      });

      if (bestMatch) {
        matches.notationVideos.push(bestMatch);
      }
    });
  }

  return matches;
};

/**
 * Get video URL from various possible sources
 * @param {Object} video - Video object
 * @returns {string|null} Video URL
 */
export const getVideoUrl = (video) => {
  if (!video) return null;
  return video.videoUrl || video.url || video.src || null;
};

/**
 * Check if a URL is a valid video URL
 * @param {string} url - URL to check
 * @returns {boolean} Whether the URL is a valid video URL
 */
export const isValidVideoUrl = (url) => {
  if (!url || typeof url !== "string") return false;

  const videoPatterns = [
    // YouTube patterns
    /youtube\.com\/watch\?v=/i,
    /youtu\.be\//i,
    /youtube\.com\/embed\//i,
    /youtube\.com\/v\//i,

    // Vimeo patterns
    /vimeo\.com\//i,
    /player\.vimeo\.com\//i,

    // Video conferencing
    /zoom\.us\//i,
    /meet\.google\.com\//i,
    /teams\.microsoft\.com\//i,
    /webex\.com\//i,

    // Video file extensions
    /\.mp4$/i,
    /\.mov$/i,
    /\.webm$/i,
    /\.avi$/i,
    /\.mkv$/i,
    /\.flv$/i,
    /\.wmv$/i,
    /\.m4v$/i,

    // Cloud storage with video extensions
    /\.mp4\?/i,
    /\.mov\?/i,
    /\.webm\?/i,
    /\.avi\?/i,

    // CDN patterns
    /cloudfront\.net.*\.(mp4|mov|webm|avi)/i,
    /blob\.core\.windows\.net.*\.(mp4|mov|webm|avi)/i,
    /amazonaws\.com.*\.(mp4|mov|webm|avi)/i,
    /storage\.googleapis\.com.*\.(mp4|mov|webm|avi)/i,

    // Streaming services
    /twitch\.tv\//i,
    /dailymotion\.com\//i,
    /wistia\.com\//i,
    /brightcove\.com\//i,

    // Generic video indicators
    /video/i, // If URL contains "video" keyword
    /watch/i, // If URL contains "watch" keyword
  ];

  return videoPatterns.some((pattern) => pattern.test(url));
};

/**
 * Format video data for display
 * @param {Object} video - Raw video object
 * @returns {Object} Formatted video object
 */
export const formatVideoForDisplay = (video) => {
  if (!video) return null;

  return {
    id: video.id,
    title: video.name || video.title || "Untitled Video",
    description: video.description || "",
    url: getVideoUrl(video),
    thumbnail: video.thumbnail || video.imageUrl || null,
    duration: video.duration || null,
    type: video.type || "video",
    matchScore: video.matchScore || 0,
    matchType: video.matchType || "none",
  };
};

const videoMatcherUtils = {
  findMatchingVideos,
  getVideoUrl,
  isValidVideoUrl,
  formatVideoForDisplay,
  calculateSimilarity,
  normalizeText,
};

export default videoMatcherUtils;
