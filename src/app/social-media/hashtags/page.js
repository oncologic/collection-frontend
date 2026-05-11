"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FaHashtag,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaSpinner,
  FaArrowLeft,
} from "react-icons/fa";
import Link from "next/link";

// Create a wrapper component for Suspense
const HashtagsPageWrapper = () => (
  <Suspense
    fallback={
      <div className="container mx-auto px-4 py-6 flex justify-center items-center">
        <FaSpinner className="animate-spin text-blue-500 text-2xl mr-2" />
        <span>Loading hashtags page...</span>
      </div>
    }
  >
    <SocialMediaHashtagsPage />
  </Suspense>
);

const SocialMediaHashtagsPage = () => {
  const searchParams = useSearchParams();
  const hashtagsParam = searchParams.get("hashtags");
  const [hashtags, setHashtags] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to clean and parse hashtags
  const cleanHashtag = (tag) => {
    if (!tag) return null;

    // Convert to string if not already
    let cleanTag = String(tag).trim();

    // Remove various types of unwanted characters and formatting
    cleanTag = cleanTag
      .replace(/^["'\`]+|["'\`]+$/g, "") // Remove surrounding quotes
      .replace(/^[{]+|[}]+$/g, "") // Remove surrounding braces
      .replace(/^[\[]+|[\]]+$/g, "") // Remove surrounding brackets
      .replace(/^#+/, "") // Remove leading # symbols
      .replace(/[^\w\s]/g, "") // Remove non-word chars except spaces
      .replace(/\s+/g, "") // Remove all spaces
      .trim();

    return cleanTag.length > 0 ? cleanTag : null;
  };

  useEffect(() => {
    if (hashtagsParam) {
      try {
        // First try to decode if it's URL encoded
        let decodedParam = decodeURIComponent(hashtagsParam);

        // Try to parse as JSON if it looks like JSON
        if (decodedParam.startsWith("[") || decodedParam.startsWith("{")) {
          try {
            const parsed = JSON.parse(decodedParam);
            if (Array.isArray(parsed)) {
              decodedParam = parsed.join(",");
            } else if (typeof parsed === "object") {
              // If it's an object, try to extract meaningful values
              decodedParam = Object.values(parsed).join(",");
            }
          } catch (jsonError) {
            // If JSON parsing fails, continue with string processing
            console.warn("Failed to parse hashtags as JSON:", jsonError);
          }
        }

        // Parse comma-separated hashtags and clean them up
        const parsedHashtags = decodedParam
          .split(",")
          .map((tag) => cleanHashtag(tag))
          .filter((tag) => tag !== null && tag.length > 0)
          .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
          .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates

        setHashtags(parsedHashtags);
      } catch (error) {
        console.error("Error parsing hashtags:", error);
        // Fallback: treat as simple comma-separated string
        const fallbackHashtags = hashtagsParam
          .split(",")
          .map((tag) => cleanHashtag(tag))
          .filter((tag) => tag !== null && tag.length > 0)
          .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));

        setHashtags(fallbackHashtags);
      }
    }
  }, [hashtagsParam]);

  // Social media platforms with their search URLs
  const platforms = [
    {
      name: "Twitter",
      icon: <FaTwitter className="text-[#1DA1F2]" />,
      getUrl: (tag) =>
        `https://twitter.com/search?q=${encodeURIComponent(
          tag
        )}&src=typed_query`,
    },
    {
      name: "Facebook",
      icon: <FaFacebook className="text-[#1877F2]" />,
      getUrl: (tag) =>
        `https://www.facebook.com/hashtag/${encodeURIComponent(
          tag.replace("#", "")
        )}`,
    },
    {
      name: "Instagram",
      icon: <FaInstagram className="text-[#E1306C]" />,
      getUrl: (tag) =>
        `https://www.instagram.com/explore/tags/${encodeURIComponent(
          tag.replace("#", "")
        )}`,
    },
    {
      name: "LinkedIn",
      icon: <FaLinkedin className="text-[#0077B5]" />,
      getUrl: (tag) =>
        `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(
          tag
        )}&origin=GLOBAL_SEARCH_HEADER`,
    },
    {
      name: "YouTube",
      icon: <FaYoutube className="text-[#FF0000]" />,
      getUrl: (tag) =>
        `https://www.youtube.com/results?search_query=${encodeURIComponent(
          tag
        )}`,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link
          href="/collections"
          className="inline-flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" /> Back to Collections
        </Link>
      </div>

      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between flex-col gap-2 md:flex-row">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            <FaHashtag className="mr-3 text-blue-500" />
            Hashtag Search
          </h1>
        </div>

        {/* Description */}
        <p className="text-gray-600 max-w-3xl">
          Search for these hashtags across various social media platforms.
        </p>

        {/* Hashtags list */}
        {hashtags.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-4">
            {hashtags.map((tag, index) => (
              <span
                key={index}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <p className="text-yellow-700">
              No hashtags were provided. Please add hashtags to the URL
              parameter.
            </p>
          </div>
        )}

        {/* Platform search links */}
        {hashtags.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {platforms.map((platform) => (
              <div
                key={platform.name}
                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
              >
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{platform.icon}</div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {platform.name}
                    </h3>
                  </div>
                </div>

                <div className="p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Search hashtags on {platform.name}
                  </h4>

                  <div className="space-y-2">
                    {hashtags.map((tag, index) => (
                      <a
                        key={index}
                        href={platform.getUrl(tag)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
                      >
                        <FaHashtag className="text-blue-500" />
                        <span>{tag}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HashtagsPageWrapper;
