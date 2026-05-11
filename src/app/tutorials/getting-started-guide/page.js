"use client";
import React from "react";
import {
  FaBook,
  FaRocket,
  FaLightbulb,
  FaSearch,
  FaFlask,
  FaUsers,
  FaCheckCircle,
  FaVideo,
  FaPlay,
  FaChevronDown,
  FaChevronUp,
  FaQuestion,
  FaClock,
  FaGraduationCap,
  FaStar,
  FaArrowLeft,
  FaArrowRight,
  FaPlayCircle,
} from "react-icons/fa";
import { useState } from "react";
import Link from "next/link";
import TutorialLayout from "../components/TutorialLayout";
import TutorialSection from "../components/TutorialSection";
import TutorialVideoPlayer from "../components/TutorialVideoPlayer";
import TutorialSidebar from "../components/TutorialSidebar";
import useTutorial from "../hooks/useTutorial";
import useTutorialVideos from "../hooks/useTutorialVideos";
import { sanitizeHtml } from "@/app/utils/sanitizeHtml";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"
).replace(/\/$/, "");
const gettingStartedCollectionId =
  process.env.NEXT_PUBLIC_GETTING_STARTED_COLLECTION_ID;
const gettingStartedTutorialEndpoint = gettingStartedCollectionId
  ? `${apiBaseUrl}/api/public/collection/${gettingStartedCollectionId}`
  : null;

const GettingStartedGuideTutorial = () => {
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [currentSection, setCurrentSection] = useState(null);
  const [showFullTutorial, setShowFullTutorial] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [showSectionModal, setShowSectionModal] = useState(false);

  const {
    tutorialData,
    isLoading,
    error,
    completedSections,
    markSectionComplete,
    totalSections,
    isCompleted,
  } = useTutorial(
    "getting-started-guide",
    gettingStartedTutorialEndpoint
  );

  // Video integration - using the collection endpoint to find videos
  const {
    matchedVideos,
    isLoadingVideos,
    videoError,
    getVideoForNotationIndex,
    stats,
  } = useTutorialVideos(tutorialData, {
    videoApiEndpoint: gettingStartedTutorialEndpoint,
    enableVideoMatching: true,
    matchingOptions: {
      minSimilarity: 0.3, // Lower threshold for more matches
      exactMatchBonus: 0.4,
      keywordMatchBonus: 0.3,
    },
  });

  // Extract external links from the collection data and sort by typeOrdering
  const externalLinks = tutorialData?.externalLinks || [];
  const typeOrdering = tutorialData?.typeOrdering || {};

  // Sort external links by their type ordering from the API
  const sortedExternalLinks = [...externalLinks].sort((a, b) => {
    const orderA = typeOrdering[a.type] ?? 999; // Default to high number if not in ordering
    const orderB = typeOrdering[b.type] ?? 999;
    return orderA - orderB;
  });

  const icons = [FaQuestion, FaRocket, FaLightbulb, FaSearch, FaUsers, FaFlask];

  // Find the "What is Contexlia?" section and its video
  const whatIsContextliaSection = sortedExternalLinks.find((link) =>
    link.name.toLowerCase().includes("what is contexlia")
  );

  const heroVideo = whatIsContextliaSection?.attachments?.find(
    (attachment) => attachment.type === "video"
  );

  const toggleSection = (sectionId) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const getTotalProgress = () => {
    const totalSections = sortedExternalLinks.reduce((count, section) => {
      return count + 1 + (section.notations ? section.notations.length : 0);
    }, 0);
    return totalSections > 0
      ? (completedSections.size / totalSections) * 100
      : 0;
  };

  const getEstimatedTime = () => {
    const baseTimePerSection = 2; // minutes
    const timePerNotation = 0.5; // minutes
    const totalTime = sortedExternalLinks.reduce((time, section) => {
      return (
        time +
        baseTimePerSection +
        (section.notations ? section.notations.length * timePerNotation : 0)
      );
    }, 0);
    return Math.round(totalTime);
  };

  // Calculate video count directly from tutorial data
  const getVideoCount = () => {
    let videoCount = 0;
    sortedExternalLinks.forEach((link) => {
      if (link.attachments && Array.isArray(link.attachments)) {
        videoCount += link.attachments.filter(
          (attachment) => attachment.type === "video"
        ).length;
      }
    });
    return videoCount;
  };

  const videoCount = getVideoCount();

  const openSectionModal = (section, index) => {
    setSelectedSection({ ...section, index: index + 1 });
    setShowSectionModal(true);
  };

  const closeSectionModal = () => {
    setSelectedSection(null);
    setShowSectionModal(false);
  };

  const markModalSectionComplete = () => {
    if (selectedSection) {
      markSectionComplete(selectedSection.index);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tutorial...</p>
        </div>
      </div>
    );
  }

  if (!showFullTutorial) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link
                  href="/tutorials"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  <FaArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Back to Tutorials</span>
                  <span className="sm:hidden">Back</span>
                </Link>
                <div className="h-6 w-px bg-gray-300 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <FaGraduationCap className="h-4 w-4 text-white" />
                  </div>
                  <h1 className="text-lg font-semibold text-gray-900 hidden sm:block">
                    Getting Started Guide
                  </h1>
                  <h1 className="text-base font-semibold text-gray-900 sm:hidden">
                    Getting Started
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Section with Video */}
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-700 to-blue-800">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative w-10/12 mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Content */}
              <div className="text-white">
                <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6">
                  <FaStar className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">Beginner Friendly</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                  Master{" "}
                  <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    Contexlia
                  </span>
                </h1>
                <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                  Your complete guide to leveraging AI for kidney cancer
                  research. Learn how to interact with our AI, find resources,
                  and navigate the platform with confidence.
                </p>

                {/* Key Benefits */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <FaVideo className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">Interactive Videos</div>
                      <div className="text-blue-200 text-sm">
                        {videoCount} guided tutorials
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <FaUsers className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">Expert Guidance</div>
                      <div className="text-blue-200 text-sm">
                        Research-focused content
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <FaBook className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">Comprehensive</div>
                      <div className="text-blue-200 text-sm">
                        {sortedExternalLinks.length} key sections
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                      <FaGraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">Self-Paced</div>
                      <div className="text-blue-200 text-sm">
                        Learn at your speed
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowFullTutorial(true)}
                  className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <FaPlayCircle className="h-6 w-6" />
                  Start Learning Now
                  <FaArrowRight className="h-5 w-5" />
                </button>
              </div>

              {/* Right Side - Hero Video */}
              <div className="relative">
                <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                        <FaPlay className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">
                          Featured Video
                        </h3>
                        <p className="text-blue-200 text-lg">
                          What is Contexlia?
                        </p>
                      </div>
                    </div>
                    {heroVideo ? (
                      <div className="rounded-xl overflow-hidden shadow-xl">
                        <TutorialVideoPlayer
                          video={{
                            id: heroVideo.id,
                            title: heroVideo.title,
                            description: heroVideo.description,
                            url: heroVideo.presignedUrl,
                          }}
                          className="w-full aspect-video"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center">
                        <div className="text-center text-white">
                          <FaPlay className="h-16 w-16 mx-auto mb-4 opacity-60" />
                          <p className="text-lg font-medium">
                            Introduction Video
                          </p>
                          <p className="text-blue-200">Coming Soon</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What You'll Learn Section */}
        <div className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                What You&apos;ll Master
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                By the end of this guide, you&apos;ll be confident using
                Contexlia&apos;s AI-powered features for your kidney cancer
                research needs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedExternalLinks.slice(0, 6).map((section, index) => {
                const IconComponent = icons[index % icons.length];
                const hasVideo = section.attachments?.some(
                  (attachment) => attachment.type === "video"
                );

                return (
                  <div
                    key={section.id}
                    onClick={() => openSectionModal(section, index)}
                    className="group relative bg-gray-50 rounded-2xl p-8 hover:bg-white hover:shadow-xl transition-all duration-300 border border-gray-100 cursor-pointer"
                  >
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {section.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                            Section {index + 1}
                          </span>
                          {hasVideo && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              <FaVideo className="h-3 w-3" />
                              Video
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div
                      className="text-gray-600 text-sm leading-relaxed line-clamp-3"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(section.description),
                      }}
                    />
                    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <FaArrowRight className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA Section */}
            <div className="text-center mt-16">
              <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-12">
                <div className="max-w-3xl mx-auto text-white">
                  <h3 className="text-3xl font-bold mb-6">
                    Ready to Get Started?
                  </h3>
                  <p className="text-xl text-blue-100 mb-8">
                    Join our community of cancer patients, caregivers, and
                    professionals who&apos;ve mastered Contexlia&apos;s
                    AI-powered platform.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/dashboard">
                      <button className="inline-flex items-center gap-3 border-2 border-white text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300">
                        Explore Platform
                        <FaArrowRight className="h-5 w-5" />
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Detail Modal */}
        {showSectionModal && selectedSection && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      {(() => {
                        const IconComponent =
                          icons[(selectedSection.index - 1) % icons.length];
                        return IconComponent ? (
                          <IconComponent className="h-6 w-6 text-white" />
                        ) : null;
                      })()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {selectedSection.name}
                      </h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                          Section {selectedSection.index}
                        </span>
                        {selectedSection.attachments?.some(
                          (attachment) => attachment.type === "video"
                        ) && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                            <FaVideo className="h-3 w-3" />
                            Video Included
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeSectionModal}
                    className="text-white/80 hover:text-white transition-colors p-2"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                <div className="p-8">
                  {/* Video Section */}
                  {selectedSection.attachments
                    ?.filter((attachment) => attachment.type === "video")
                    .map((videoAttachment) => (
                      <div key={videoAttachment.id} className="mb-8">
                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                              <FaPlay className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {videoAttachment.title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                Tutorial Video
                              </p>
                            </div>
                          </div>
                          <TutorialVideoPlayer
                            video={{
                              id: videoAttachment.id,
                              title: videoAttachment.title,
                              description: videoAttachment.description,
                              url: videoAttachment.presignedUrl,
                            }}
                            className="w-full rounded-lg overflow-hidden"
                          />
                        </div>
                      </div>
                    ))}

                  {/* Description */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Overview
                    </h3>
                    <div
                      className="text-gray-700 leading-relaxed prose prose-blue max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(selectedSection.description),
                      }}
                    />
                  </div>

                  {/* Key Points */}
                  {selectedSection.notations &&
                    selectedSection.notations.length > 0 && (
                      <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                          <FaLightbulb className="h-5 w-5 text-yellow-500" />
                          Key Points ({selectedSection.notations.length})
                        </h3>
                        <div className="space-y-4">
                          {selectedSection.notations.map((notation, index) => (
                            <div
                              key={notation.id}
                              className="bg-blue-50 rounded-lg p-6 border border-blue-100"
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <span className="text-sm font-bold text-blue-600">
                                    {index + 1}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 mb-2">
                                    {notation.title}
                                  </h4>
                                  <div
                                    className="text-gray-700 text-sm leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                      __html: sanitizeHtml(notation.notes),
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {completedSections.has(selectedSection.index) ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <FaCheckCircle className="h-5 w-5" />
                        <span className="font-medium">Completed</span>
                      </div>
                    ) : (
                      <button
                        onClick={markModalSectionComplete}
                        className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        <FaCheckCircle className="h-4 w-4" />
                        Mark as Complete
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={closeSectionModal}
                      className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full tutorial view (existing detailed content)
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back to Overview */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFullTutorial(false)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <FaArrowLeft className="h-4 w-4" />
                Back to Overview
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <Link
                href="/tutorials"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                All Tutorials
              </Link>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FaBook className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Getting Started Guide
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Progress: {Math.round(getTotalProgress())}%
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getTotalProgress()}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FaBook className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Tutorial Navigation
                  </h3>
                  <p className="text-sm text-gray-500">
                    {sortedExternalLinks.length} sections
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {sortedExternalLinks.map((section, index) => {
                  const sectionId = index + 1;
                  const isCompleted = completedSections.has(sectionId);
                  const hasNotations =
                    section.notations && section.notations.length > 0;

                  return (
                    <div key={section.id} className="space-y-2">
                      <div
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isCompleted
                            ? "bg-green-50 border border-green-200"
                            : "hover:bg-gray-50 border border-transparent"
                        }`}
                        onClick={() => {
                          const element = document.getElementById(
                            `section-${sectionId}`
                          );
                          if (element) {
                            element.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }
                        }}
                      >
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <FaCheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              isCompleted ? "text-green-700" : "text-gray-900"
                            }`}
                          >
                            {section.name}
                          </p>
                          {hasNotations && (
                            <p className="text-xs text-gray-500">
                              {section.notations.length} key points
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {completedSections.size}
                    </div>
                    <div className="text-xs text-gray-500">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {sortedExternalLinks.reduce((count, section) => {
                        return (
                          count +
                          1 +
                          (section.notations ? section.notations.length : 0)
                        );
                      }, 0)}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Tutorial Sections */}
            <div className="space-y-6">
              {sortedExternalLinks.map((link, linkIndex) => {
                const IconComponent = icons[linkIndex % icons.length];
                const sectionIndex = linkIndex + 1;
                const isExpanded = expandedSections.has(link.id);
                const hasNotations =
                  link.notations && link.notations.length > 0;
                const hasVideoAttachment = link.attachments?.some(
                  (attachment) => attachment.type === "video"
                );
                const isCompleted = completedSections.has(sectionIndex);

                return (
                  <div key={link.id} className="space-y-4">
                    {/* Main Section Card */}
                    <div
                      id={`section-${sectionIndex}`}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="p-6">
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isCompleted
                                ? "bg-green-100 text-green-600"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {isCompleted ? (
                              <FaCheckCircle className="h-6 w-6" />
                            ) : (
                              <IconComponent className="h-6 w-6" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                  {link.name}
                                </h3>
                                {/* Video Attachments */}
                                {hasVideoAttachment && (
                                  <div className="mb-6 pt-10">
                                    {link.attachments
                                      ?.filter(
                                        (attachment) =>
                                          attachment.type === "video"
                                      )
                                      .map((videoAttachment) => (
                                        <div
                                          key={videoAttachment.id}
                                          className="bg-gray-50 rounded-lg p-4"
                                        >
                                          <TutorialVideoPlayer
                                            video={{
                                              id: videoAttachment.id,
                                              title: videoAttachment.title,
                                              description:
                                                videoAttachment.description,
                                              url: videoAttachment.presignedUrl,
                                            }}
                                            className="w-full"
                                          />
                                        </div>
                                      ))}
                                  </div>
                                )}
                                <div className="flex items-center gap-3 mb-4">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Section {sectionIndex}
                                  </span>
                                  {hasVideoAttachment && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      <FaVideo className="h-3 w-3" />
                                      Video
                                    </span>
                                  )}
                                  {hasNotations && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                      {link.notations.length} Key Points
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {hasNotations && (
                                  <button
                                    onClick={() => toggleSection(link.id)}
                                    className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                  >
                                    {isExpanded ? (
                                      <>
                                        <FaChevronUp className="h-4 w-4" />
                                        Hide Details
                                      </>
                                    ) : (
                                      <>
                                        <FaChevronDown className="h-4 w-4" />
                                        Show Details
                                      </>
                                    )}
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    markSectionComplete(sectionIndex)
                                  }
                                  className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium transition-colors ${
                                    isCompleted
                                      ? "bg-green-100 text-green-800 cursor-default"
                                      : "bg-blue-600 text-white hover:bg-blue-700"
                                  }`}
                                  disabled={isCompleted}
                                >
                                  {isCompleted ? (
                                    <>
                                      <FaCheckCircle className="mr-2 h-4 w-4" />
                                      Completed
                                    </>
                                  ) : (
                                    "Mark Complete"
                                  )}
                                </button>
                              </div>
                            </div>

                            <div
                              className="text-gray-600 leading-relaxed mb-6"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(link.description),
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Notations */}
                    {hasNotations && isExpanded && (
                      <div className="ml-16 space-y-4">
                        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <FaLightbulb className="h-5 w-5 text-yellow-500" />
                          Key Points
                        </h4>
                        <div className="grid gap-4">
                          {link.notations.map((notation, notationIndex) => {
                            return (
                              <div
                                key={notation.id}
                                id={`section-${
                                  sectionIndex * 100 + notationIndex + 1
                                }`}
                                className="bg-white rounded-lg border border-gray-200 p-4"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100 text-gray-600">
                                    <span className="text-xs font-medium">
                                      {notationIndex + 1}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 mb-2">
                                      {notation.title}
                                    </h5>
                                    <div
                                      className="text-sm text-gray-600"
                                      dangerouslySetInnerHTML={{
                                        __html: sanitizeHtml(notation.notes),
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Completion Section */}
            {isCompleted && (
              <div className="mt-12">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-8 text-white text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FaGraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">
                    🎉 Congratulations!
                  </h3>
                  <p className="text-green-100 mb-8 max-w-2xl mx-auto">
                    You&apos;ve successfully completed the Getting Started
                    Guide. You&apos;re now ready to make the most of Contexlia!
                  </p>
                  <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                    <Link href="/dashboard">
                      <button className="bg-white text-green-600 px-6 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors w-full">
                        Launch Contexlia
                      </button>
                    </Link>
                    <Link href="/tutorials">
                      <button className="border border-white/30 text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors w-full">
                        Browse More Tutorials
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GettingStartedGuideTutorial;
