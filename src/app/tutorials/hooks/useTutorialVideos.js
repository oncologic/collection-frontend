"use client";
import { useState, useEffect, useMemo } from "react";
import {
  findMatchingVideos,
  formatVideoForDisplay,
  isValidVideoUrl,
} from "../utils/videoMatcher";

/**
 * Custom hook to fetch and match videos with tutorial content
 * @param {Object} tutorialData - Tutorial data from API
 * @param {Object} options - Configuration options
 * @returns {Object} Video matching results and loading state
 */
const useTutorialVideos = (tutorialData, options = {}) => {
  const [videos, setVideos] = useState([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState(null);

  const {
    videoApiEndpoint = null,
    enableVideoMatching = true,
    matchingOptions = {},
  } = options;

  // Fetch videos from API
  useEffect(() => {
    const fetchVideos = async () => {
      if (!videoApiEndpoint || !enableVideoMatching) {
        setVideos([]);
        return;
      }

      setIsLoadingVideos(true);
      setVideoError(null);

      try {
        const response = await fetch(videoApiEndpoint);

        if (!response.ok) {
          throw new Error(`Failed to fetch videos: ${response.status}`);
        }

        const data = await response.json();

        // Handle different API response structures
        let videoList = [];

        if (Array.isArray(data)) {
          videoList = data;
        } else if (data.videos && Array.isArray(data.videos)) {
          videoList = data.videos;
        } else if (data.data && Array.isArray(data.data)) {
          videoList = data.data;
        } else if (data.externalLinks && Array.isArray(data.externalLinks)) {
          // Handle external links that might contain videos
          videoList = data.externalLinks.filter(
            (link) =>
              isValidVideoUrl(link.url) || isValidVideoUrl(link.videoUrl)
          );
        }

        // For the specific collection API structure, we need to check nested external links
        if (data.externalLinks && Array.isArray(data.externalLinks)) {
          const collectionVideos = [];

          data.externalLinks.forEach((externalLink) => {
            // Check if the external link itself has a video URL
            if (
              isValidVideoUrl(externalLink.url) ||
              isValidVideoUrl(externalLink.videoUrl)
            ) {
              collectionVideos.push({
                id: externalLink.id,
                name: externalLink.name,
                title: externalLink.name,
                description: externalLink.description,
                url: externalLink.videoUrl || externalLink.url,
                videoUrl: externalLink.videoUrl || externalLink.url,
                type: "external_link",
                imageUrl: externalLink.imageUrl,
                createdAt: externalLink.createdAt,
                updatedAt: externalLink.updatedAt,
              });
            }

            // Check attachments for videos
            if (
              externalLink.attachments &&
              Array.isArray(externalLink.attachments)
            ) {
              externalLink.attachments.forEach((attachment) => {
                if (
                  attachment.type === "video" ||
                  isValidVideoUrl(attachment.url) ||
                  isValidVideoUrl(attachment.presignedUrl)
                ) {
                  collectionVideos.push({
                    id:
                      attachment.id || `${externalLink.id}-${attachment.title}`,
                    name: attachment.title || `${externalLink.name} - Video`,
                    title: attachment.title || `${externalLink.name} - Video`,
                    description:
                      attachment.description || externalLink.description,
                    url: attachment.presignedUrl || attachment.url,
                    videoUrl: attachment.presignedUrl || attachment.url,
                    type: "attachment",
                    parentId: externalLink.id,
                    parentName: externalLink.name,
                  });
                }
              });
            }
          });

          videoList = collectionVideos;
        }

        // Filter and format videos
        const validVideos = videoList
          .filter((video) => {
            const url = video.videoUrl || video.url;
            return url && isValidVideoUrl(url);
          })
          .map(formatVideoForDisplay)
          .filter(Boolean);

        setVideos(validVideos);
      } catch (error) {
        console.error("Error fetching videos:", error);
        setVideoError(error.message);
        setVideos([]);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    fetchVideos();
  }, [videoApiEndpoint, enableVideoMatching]);

  // Match videos with tutorial content
  const matchedVideos = useMemo(() => {
    if (!enableVideoMatching || !tutorialData || !videos.length) {
      return {
        tutorialVideo: null,
        notationVideos: [],
        hasMatches: false,
        totalMatches: 0,
      };
    }

    const matches = findMatchingVideos(videos, tutorialData, matchingOptions);

    return {
      ...matches,
      hasMatches: !!(
        matches.tutorialVideo || matches.notationVideos.length > 0
      ),
      totalMatches:
        (matches.tutorialVideo ? 1 : 0) + matches.notationVideos.length,
    };
  }, [videos, tutorialData, enableVideoMatching, matchingOptions]);

  // Get video for specific notation
  const getVideoForNotation = (notationId) => {
    return matchedVideos.notationVideos.find(
      (video) => video.notationId === notationId
    );
  };

  // Get video for notation by index
  const getVideoForNotationIndex = (index) => {
    return matchedVideos.notationVideos.find(
      (video) => video.notationIndex === index
    );
  };

  // Check if a specific notation has a matching video
  const hasVideoForNotation = (notationId) => {
    return !!getVideoForNotation(notationId);
  };

  // Get all unique videos (no duplicates)
  const allUniqueVideos = useMemo(() => {
    const uniqueVideos = [];
    const seenIds = new Set();

    // Add tutorial video
    if (
      matchedVideos.tutorialVideo &&
      !seenIds.has(matchedVideos.tutorialVideo.id)
    ) {
      uniqueVideos.push(matchedVideos.tutorialVideo);
      seenIds.add(matchedVideos.tutorialVideo.id);
    }

    // Add notation videos
    matchedVideos.notationVideos.forEach((video) => {
      if (!seenIds.has(video.id)) {
        uniqueVideos.push(video);
        seenIds.add(video.id);
      }
    });

    return uniqueVideos;
  }, [matchedVideos]);

  // Statistics
  const stats = useMemo(() => {
    const notationCount = tutorialData?.notations?.length || 0;
    const matchedNotations = matchedVideos.notationVideos.length;

    return {
      totalVideos: videos.length,
      totalMatches: matchedVideos.totalMatches,
      tutorialVideoMatched: !!matchedVideos.tutorialVideo,
      notationVideoMatches: matchedNotations,
      notationMatchPercentage:
        notationCount > 0 ? (matchedNotations / notationCount) * 100 : 0,
      hasAnyMatches: matchedVideos.hasMatches,
    };
  }, [videos.length, matchedVideos, tutorialData]);

  return {
    // Video data
    videos,
    matchedVideos,
    allUniqueVideos,

    // Loading states
    isLoadingVideos,
    videoError,

    // Helper functions
    getVideoForNotation,
    getVideoForNotationIndex,
    hasVideoForNotation,

    // Statistics
    stats,

    // Configuration
    enableVideoMatching,
  };
};

export default useTutorialVideos;
