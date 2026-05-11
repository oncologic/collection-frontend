"use client";
import React, { useState } from "react";
import {
  FaTimes,
  FaHashtag,
  FaMagic,
  FaDownload,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { useRouter } from "next/navigation";

const EventActionsModal = ({
  isOpen,
  onClose,
  event,
  hashtags,
  onBlogGenerate,
  onDownload,
  getHashtagSearchUrl,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("hashtags");

  if (!isOpen || !event) return null;

  const handleHashtagSearch = () => {
    const url = getHashtagSearchUrl();
    window.open(url, "_blank");
  };

  const handleNavigateToHashtags = () => {
    const url = getHashtagSearchUrl();
    router.push(url);
    onClose();
  };

  const handleBlogGenerate = () => {
    onBlogGenerate(event);
    onClose();
  };

  const handleDownload = () => {
    onDownload(event);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-black/30 via-black/50 to-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200/80 bg-gradient-to-r from-gray-50/80 to-white/80">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Event Actions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-full p-2 transition-all duration-200"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Event Info */}
        <div className="p-4 bg-gradient-to-r from-slate-50/60 to-white/60 border-b border-gray-200/60">
          <h3 className="font-semibold text-gray-800">{event.title}</h3>
          <p className="text-sm text-gray-600">
            {event.startDate && (
              <>
                {new Date(event.startDate).toLocaleDateString()}
                {event.endDate &&
                  ` - ${new Date(event.endDate).toLocaleDateString()}`}
              </>
            )}
          </p>
          {event.locationCity && (
            <p className="text-sm text-gray-600">
              {event.locationCity}
              {event.locationState && `, ${event.locationState}`}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200/80 bg-gray-50/50">
          <button
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === "hashtags"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white/60"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/30"
            }`}
            onClick={() => setActiveTab("hashtags")}
          >
            Hashtag Search
          </button>
          <button
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === "blog"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white/60"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/30"
            }`}
            onClick={() => setActiveTab("blog")}
          >
            Blog Generation
          </button>
          <button
            className={`px-6 py-3 font-medium transition-all duration-200 ${
              activeTab === "download"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white/60"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/30"
            }`}
            onClick={() => setActiveTab("download")}
          >
            Download
          </button>
        </div>

        {/* Content based on active tab */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === "hashtags" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Event Hashtags
                </h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {hashtags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                    >
                      <FaHashtag className="mr-1 text-xs" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">
                    Search Social Media
                  </h4>
                  <p className="text-sm text-blue-700 mb-4">
                    Open the hashtag search page to find related social media
                    content across platforms.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleNavigateToHashtags}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <FaHashtag className="h-4 w-4" />
                      Search in App
                    </button>
                    <button
                      onClick={handleHashtagSearch}
                      className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                      <FaExternalLinkAlt className="h-4 w-4" />
                      Open in New Tab
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "blog" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <h3 className="text-lg font-semibold text-purple-800 mb-2 flex items-center">
                  <FaMagic className="mr-2" />
                  Generate Blog Post
                </h3>
                <p className="text-purple-700 mb-4">
                  Create a blog post based on this event and its collections.
                  This will analyze all the resources and content to generate a
                  comprehensive article.
                </p>
                <button
                  onClick={handleBlogGenerate}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <FaMagic className="h-4 w-4" />
                  Generate Blog Post
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">
                  What will be included:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Event details and information</li>
                  <li>• Related collections and resources</li>
                  <li>• Hashtags and social context</li>
                  <li>• AI-generated content and insights</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "download" && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-2 flex items-center">
                  <FaDownload className="mr-2" />
                  Download Event Details
                </h3>
                <p className="text-green-700 mb-4">
                  Download a comprehensive file containing all event
                  information, collections, and related resources.
                </p>
                <button
                  onClick={handleDownload}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <FaDownload className="h-4 w-4" />
                  Download Event Data
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">
                  Download will include:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Event metadata and details</li>
                  <li>• All associated collections</li>
                  <li>• Resource links and descriptions</li>
                  <li>• Hashtags and categorization</li>
                  <li>• Location and timing information</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200/80 bg-gradient-to-r from-gray-50/40 to-white/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-600 bg-gradient-to-r from-gray-50 to-white border border-gray-300 rounded-xl hover:from-gray-100 hover:to-gray-50 hover:border-gray-400 hover:shadow-md transition-all duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventActionsModal;
