"use client";
export const dynamic = "force-dynamic";

import React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import TenantSelectionModal from "../components/modals/TenantSelectionModal";
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
  FaQuestion,
  FaGraduationCap,
  FaStar,
  FaArrowRight,
  FaPlayCircle,
  FaArrowLeft,
} from "react-icons/fa";
import TutorialVideoPlayer from "./components/TutorialVideoPlayer";
import useTutorial from "./hooks/useTutorial";
import { useContextAuth } from "../context/authContext";
import { sanitizeHtml } from "@/app/utils/sanitizeHtml";

const apiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"
).replace(/\/$/, "");
const gettingStartedCollectionId =
  process.env.NEXT_PUBLIC_GETTING_STARTED_COLLECTION_ID;
const gettingStartedTutorialEndpoint = gettingStartedCollectionId
  ? `${apiBaseUrl}/api/public/collection/${gettingStartedCollectionId}`
  : null;

const TutorialsPage = () => {
  const [selectedSection, setSelectedSection] = useState(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const { systemUser, isLoaded, refetchUserData } = useContextAuth();

  const TENANT_MODAL_SEEN_KEY = "tenantModalSeenOnTutorials";

  // For testing: Check URL params to force show modal
  const forceShowModal =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("showTenantModal") ===
      "true";

  // Check if user should see the tenant selection modal
  useEffect(() => {
    if (isLoaded && systemUser) {
      // Always show if force flag is set (for testing)
      if (forceShowModal) {
        setShowTenantModal(true);
        // Clear the flag from localStorage for clean testing
        localStorage.removeItem(TENANT_MODAL_SEEN_KEY);
        return;
      }

      const hasSeenModal = localStorage.getItem(TENANT_MODAL_SEEN_KEY);

      // Get user's tenants
      const userTenants = systemUser.tenants || [];

      // Check if user has limited tenants (1 or fewer)
      const hasLimitedTenants = userTenants.length <= 1;

      // Show modal if:
      // 1. User has limited tenants (0 or 1)
      // 2. Haven't seen the modal before on this page
      if (hasLimitedTenants && !hasSeenModal) {
        setShowTenantModal(true);
      }
    }
  }, [isLoaded, systemUser, forceShowModal]);

  const handleTenantSelected = async (updatedUser) => {
    // Refresh user data after tenant selection
    await refetchUserData();
    setShowTenantModal(false);
    // Mark as seen after they interact with it
    localStorage.setItem(TENANT_MODAL_SEEN_KEY, "true");
  };

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

  // Extract external links from the collection data and sort by typeOrdering
  const externalLinks = tutorialData?.externalLinks || [];
  const typeOrdering = tutorialData?.typeOrdering || {};

  // Sort external links by their type ordering from the API
  const sortedExternalLinks = [...externalLinks].sort((a, b) => {
    const orderA = typeOrdering[a.type] ?? 999;
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

  const scrollToMasterSection = () => {
    const masterSection = document.getElementById("what-youll-master");
    if (masterSection) {
      masterSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tutorials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with Video */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-700 to-blue-800">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative w-10/12 mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-24">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Mobile: Video First */}
            <div className="relative lg:hidden w-full order-1">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <FaPlay className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-xl sm:text-2xl font-semibold">
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
                        <FaPlay className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-60" />
                        <p className="text-base sm:text-lg font-medium">
                          Introduction Video
                        </p>
                        <p className="text-blue-200 text-sm">Coming Soon</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content - Mobile: Second, Desktop: First */}
            <div className="text-white order-2 lg:order-1">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4 sm:mb-6">
                <FaStar className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Beginner Friendly</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
                Master{" "}
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  Contexlia
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 leading-relaxed">
                Your complete guide to leveraging AI for kidney cancer research.
                Learn how to interact with our AI, find resources, and navigate
                clinical trials with confidence.
              </p>

              {/* Key Benefits - Updated for mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
                onClick={scrollToMasterSection}
                className="inline-flex items-center gap-3 bg-white text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <FaPlayCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                Start Learning Now
                <FaArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Desktop: Video on Right - Hidden on Mobile */}
            <div className="relative hidden lg:block order-2">
              <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                      <FaPlay className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white text-3xl font-semibold">
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

      {/* What You'll Master Section */}
      <div id="what-youll-master" className="py-24 bg-white">
        <div className="w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
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
                  Join a community of cancer patients, caregivers, and
                  professionals who&apos;ve mastered Contexlia&apos;s AI-powered
                  platform.
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

          {/* Additional Tutorials Section */}
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              More Learning Resources
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                <div className="flex items-start gap-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FaBook className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <span className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full mb-3">
                      Coming Soon
                    </span>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      More Tutorials on the Way
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      We&apos;re working on additional tutorials covering
                      advanced features, research workflows, and specialized use
                      cases.
                    </p>
                  </div>
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-8 py-4 sm:py-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const IconComponent =
                        icons[(selectedSection.index - 1) % icons.length];
                      return IconComponent ? (
                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      ) : null;
                    })()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-2xl font-bold truncate">
                      {selectedSection.name}
                    </h2>
                    <div className="flex items-center gap-2 sm:gap-3 mt-1 sm:mt-2">
                      <span className="inline-flex items-center px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                        Section {selectedSection.index}
                      </span>
                      {selectedSection.attachments?.some(
                        (attachment) => attachment.type === "video"
                      ) && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                          <FaVideo className="h-3 w-3" />
                          <span className="hidden sm:inline">
                            Video Included
                          </span>
                          <span className="sm:hidden">Video</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={closeSectionModal}
                  className="text-white/80 hover:text-white transition-colors p-2 flex-shrink-0"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
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
              <div className="p-4 sm:p-8">
                {/* Video Section */}
                {selectedSection.attachments
                  ?.filter((attachment) => attachment.type === "video")
                  .map((videoAttachment) => (
                    <div key={videoAttachment.id} className="mb-6 sm:mb-8">
                      <div className="bg-gray-50 rounded-xl p-4 sm:p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                            <FaPlay className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                              {videoAttachment.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600">
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
                <div className="mb-6 sm:mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Overview
                  </h3>
                  <div
                    className="text-gray-700 leading-relaxed prose prose-blue max-w-none text-sm sm:text-base"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(selectedSection.description),
                    }}
                  />
                </div>

                {/* Key Points */}
                {selectedSection.notations &&
                  selectedSection.notations.length > 0 && (
                    <div className="mb-6 sm:mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <FaLightbulb className="h-5 w-5 text-yellow-500" />
                        Key Points ({selectedSection.notations.length})
                      </h3>
                      <div className="space-y-4">
                        {selectedSection.notations.map((notation, index) => (
                          <div
                            key={notation.id}
                            className="bg-blue-50 rounded-lg p-4 sm:p-6 border border-blue-100"
                          >
                            <div className="flex items-start gap-3 sm:gap-4">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-blue-600">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">
                                  {notation.title}
                                </h4>
                                <div
                                  className="text-gray-700 text-xs sm:text-sm leading-relaxed"
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
            <div className="bg-gray-50 px-4 sm:px-8 py-4 sm:py-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  {completedSections.has(selectedSection.index) ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <FaCheckCircle className="h-5 w-5" />
                      <span className="font-medium">Completed</span>
                    </div>
                  ) : (
                    <button
                      onClick={markModalSectionComplete}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 sm:px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center"
                    >
                      <FaCheckCircle className="h-4 w-4" />
                      Mark as Complete
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={closeSectionModal}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Selection Modal for users with limited tenants */}
      <TenantSelectionModal
        isOpen={showTenantModal}
        onClose={() => {
          setShowTenantModal(false);
          // Mark as seen even if they close without selecting
          localStorage.setItem(TENANT_MODAL_SEEN_KEY, "true");
        }}
        onTenantSelected={handleTenantSelected}
      />
    </div>
  );
};

export default TutorialsPage;
