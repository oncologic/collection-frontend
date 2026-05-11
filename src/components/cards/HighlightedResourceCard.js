import React, { useState, useMemo } from "react";
import { DateTime } from "luxon";
import CustomEditor from "@/app/components/common/CustomEditor";
import Link from "next/link";
import Image from "next/image";
import Modal from "@/app/components/Modal";
import BookmarkResourceModal from "../modals/BookmarkResourceModal";
import TimestampModal from "@/app/components/TimestampModal";
import { useAddResourceToCollection } from "@/app/hooks/useCollections";
import {
  usePinItems,
  useUnpinItems,
  useGetPinnedItems,
} from "@/app/hooks/usePinned";
import { toast } from "react-hot-toast";
import { FaBookmark, FaThumbtack, FaShieldAlt } from "react-icons/fa";

const HighlightedResourceCard = ({
  resource,
  isAdmin,
  onCopyResource,
  collections,
  isSignedIn = false,
}) => {
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [resourceNote, setResourceNote] = useState("");
  const { mutate: addResourceToCollection } = useAddResourceToCollection();
  const { mutateAsync: pinItemsAsync } = usePinItems();
  const { mutateAsync: unpinItemsAsync } = useUnpinItems();
  const { data: pinnedItems, refetch: refetchPinnedItems } =
    useGetPinnedItems();

  const isPinned = useMemo(() => {
    return pinnedItems?.some((item) => item.id === resource.id) ?? false;
  }, [pinnedItems, resource.id]);

  const userCollections = useMemo(() => {
    return collections.filter(
      (collection) => collection.visibility !== "public"
    );
  }, [collections]);

  // Add this helper function near the top of the component
  const isYoutubeUrl = (url) => {
    return url?.match(
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    );
  };

  // Format and forward the resource for copying (admin-only)
  const handleCopyResource = () => {
    const formattedResource = {
      ...resource,
      resourceType: resource.resourceType
        ? {
            id: resource.resourceType.id,
            name: resource.resourceType.name,
          }
        : null,
      sensitivityLevel: resource.sensitivityLevel
        ? {
            id: resource.sensitivityLevel.id,
            name: resource.sensitivityLevel.name,
          }
        : null,
      expertiseLevel: resource.expertiseLevel
        ? {
            id: resource.expertiseLevel.id,
            name: resource.expertiseLevel.name,
          }
        : null,
      organizations:
        resource.organizations?.map((org) => ({
          id: org.id,
          name: org.name,
          imageUrl: org.imageUrl,
        })) || [],
      tags:
        resource.tags?.map((tag) => ({
          id: tag.id,
          name: tag.name,
        })) || [],
    };

    onCopyResource(formattedResource);
  };

  // Add resource to a chosen collection
  const handleAddToCollection = (collectionId) => {
    addResourceToCollection({
      resourceId: resource.id,
      collectionId,
      note: resourceNote || null,
    });
  };

  const renderSensitivityIcon = (resource, position) => {
    if (
      resource.sensitivityLevel === null ||
      resource.sensitivityLevel === undefined
    ) {
      return (
        <div className="relative inline-flex items-center bg-gray-50 rounded-md p-1.5">
          <FaShieldAlt className="w-4 h-4 text-gray-300 peer" />
          <div
            className={`absolute ${
              position === "right" ? "left-6" : "right-6"
            } top-0 hidden peer-hover:block z-[100] pointer-events-none`}
          >
            <div className="bg-white text-gray-600 rounded-lg p-3 shadow-xl border border-gray-200 ml-2 whitespace-nowrap">
              <div className="text-sm text-gray-500">Pending - not rated</div>
            </div>
          </div>
        </div>
      );
    } else if (resource.sensitivityLevel === 1) {
      return (
        <div className="relative inline-flex items-center bg-green-50 rounded-md p-1.5">
          <FaShieldAlt className="w-4 h-4 text-green-300 peer" />
          <div
            className={`absolute ${
              position === "right" ? "left-6" : "right-6"
            } top-0 hidden peer-hover:block z-[100] pointer-events-none`}
          >
            <div className="bg-white text-gray-600 rounded-lg p-3 shadow-xl border border-gray-200 ml-2 whitespace-nowrap">
              <div className="text-sm text-gray-500">Low distress rating</div>
            </div>
          </div>
        </div>
      );
    } else if (resource.sensitivityLevel === 2) {
      return (
        <div className="relative inline-flex items-center bg-yellow-50 rounded-md p-1.5">
          <FaShieldAlt className="w-4 h-4 text-yellow-500 peer" />
          <div
            className={`absolute ${
              position === "right" ? "left-6" : "right-6"
            } top-0 hidden peer-hover:block z-[100] pointer-events-none`}
          >
            <div className="bg-white text-gray-600 rounded-lg p-3 shadow-xl border border-gray-200 ml-2 whitespace-nowrap">
              <div className="text-sm text-gray-500">
                Medium distress rating
              </div>
            </div>
          </div>
        </div>
      );
    } else if (resource.sensitivityLevel === 3) {
      return (
        <div className="relative inline-flex items-center bg-red-50 rounded-md p-1.5">
          <FaShieldAlt className="w-4 h-4 text-red-500 peer" />
          <div
            className={`absolute ${
              position === "right" ? "left-6" : "right-6"
            } top-0 hidden peer-hover:block z-[100] pointer-events-none`}
          >
            <div className="bg-white text-gray-600 rounded-lg p-3 shadow-xl border border-gray-200 ml-2 whitespace-nowrap">
              <div className="text-sm text-gray-500">High distress rating</div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div className="relative inline-flex items-center bg-gray-50 rounded-md p-1.5">
          <FaShieldAlt className="w-4 h-4 text-gray-300 peer" />
          <div className="absolute left-6 top-0 hidden peer-hover:block z-[100] pointer-events-none">
            <div className="bg-white text-gray-600 rounded-lg p-3 shadow-xl border border-gray-200 ml-2 whitespace-nowrap">
              <div className="text-sm text-gray-500">Pending - not rated</div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="group relative flex flex-col h-full bg-gradient-to-br from-white via-white to-blue-50/30 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-gray-100/80 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)] transition-all duration-300 overflow-hidden transform-gpu will-change-transform backface-hidden">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-blue-50/0 via-indigo-50/10 to-purple-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform-gpu" />

      {/* Resource Type Banner */}
      <div className="h-2 bg-gradient-to-r from-blue-300 to-indigo-500 w-full" />

      {/* Featured Badge */}
      <div className="absolute top-3 right-3 z-10">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100/90 text-yellow-800 backdrop-blur-sm shadow-sm">
          Featured
        </span>
      </div>

      {/* Main content wrapper */}
      <div className="flex flex-col flex-grow p-5 sm:p-5 p-3">
        {/* Upper content section */}
        <div className="flex-grow">
          {/* Resource Type & Sensitivity */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="flex items-center gap-2">
              {resource.organizations?.[0]?.imageUrl && (
                <Image
                  src={resource.organizations[0].imageUrl}
                  alt={`${resource.organizations[0].name} logo`}
                  width={48}
                  height={48}
                  className="rounded-md shadow-lg w-8 h-8 sm:w-12 sm:h-12 object-contain"
                  style={{
                    imageRendering: "crisp-edges",
                    WebkitFontSmoothing: "antialiased",
                  }}
                  priority={false}
                  quality={90}
                />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                {resource.resourceType?.name}
              </span>
              {renderSensitivityIcon(resource, "right")}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200 antialiased">
            <Link
              className="hover:text-blue-600 transition-colors duration-200 antialiased"
              href={`/resources/${resource.id}`}
            >
              {resource.name}
            </Link>
          </h3>

          {/* Description Preview */}
          <div className="text-xs sm:text-sm text-gray-500 mb-4 max-h-[6rem] overflow-y-hidden relative leading-relaxed">
            <CustomEditor
              content={resource.description}
              readOnly={true}
              scrollable={false}
              transparent={true}
              textColor="text-gray-500"
            />
            {/* Fade out gradient for better visual truncation */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Footer section */}
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between gap-1 sm:gap-2">
            <span className="text-xs sm:text-sm text-gray-500 min-w-0 flex-shrink truncate">
              {DateTime.fromISO(resource.resourceDate).toFormat("LLL dd, yyyy")}
            </span>
            <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
              {/* Pin button - only show when signed in */}
              {isSignedIn && (
                <button
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50/80 backdrop-blur-sm transition-all duration-200 transform-gpu will-change-transform"
                  onClick={async () => {
                    try {
                      if (isPinned) {
                        await unpinItemsAsync([resource.id]);
                        await refetchPinnedItems(); // Immediately refetch to update UI
                      } else {
                        await pinItemsAsync([
                          {
                            id: resource.id,
                            type: "resource",
                            name: resource.name,
                            description: resource.description || "",
                            metadata: {
                              resourceType: resource.resourceType?.name || null,
                              sensitivityLevel:
                                resource.sensitivityLevel?.name || null,
                              expertiseLevel:
                                resource.expertiseLevel?.name || null,
                              organizations:
                                resource.organizations?.map((org) => org.name) ||
                                [],
                              tags: resource.tags?.map((tag) => tag.name) || [],
                            },
                          },
                        ]);
                      }
                    } catch (error) {
                      console.error("Error toggling pin state:", error);
                      toast.error("Failed to update pin state");
                    }
                  }}
                  title={isPinned ? "Unpin resource" : "Pin resource"}
                >
                  <FaThumbtack
                    className={`w-4 h-4 ${
                      isPinned ? "text-blue-200" : "text-gray-300"
                    }`}
                  />
                </button>
              )}

              {/* Collection bookmark button - only show when signed in */}
              {isSignedIn && (
                <button
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50/80 backdrop-blur-sm transition-all duration-200 relative transform-gpu will-change-transform"
                  onClick={() => {
                    setSelectedResourceId(resource.id);
                    setShowBookmarkModal(true);
                  }}
                  title="Add to collection"
                >
                  <FaBookmark
                    className={`w-4 h-4 ${
                      userCollections.some((collection) =>
                        collection.resources.some((r) => r.id === resource.id)
                      )
                        ? "text-amber-300/60"
                        : "text-gray-300"
                    }`}
                  />
                  {/* Badge Counter */}
                  {userCollections.filter((collection) =>
                    collection.resources.some((r) => r.id === resource.id)
                  ).length > 0 && (
                    <span className="absolute -top-0 -right-0 flex items-center justify-center bg-gradient-to-r from-blue-400 to-purple-400 text-white text-[10px] font-medium rounded-full min-w-[13px] h-[13px] px-1 shadow-sm">
                      {
                        userCollections.filter((collection) =>
                          collection.resources.some((r) => r.id === resource.id)
                        ).length
                      }
                    </span>
                  )}
                </button>
              )}

              {/* Copy Resource Icon (admin only and signed in) */}
              {isAdmin && isSignedIn && (
                <button
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50/80 backdrop-blur-sm transition-all duration-200 transform-gpu will-change-transform"
                  onClick={handleCopyResource}
                >
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              )}
              
              {/* Video View Icon - always show when applicable */}
              {resource.resourceType?.name?.toLowerCase() === "video" &&
                resource.videoUrl &&
                resource.timestamps &&
                isYoutubeUrl(resource.videoUrl) && (
                  <button
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50/80 backdrop-blur-sm transition-all duration-200 transform-gpu will-change-transform"
                    onClick={() => {
                      setShowVideoModal(true);
                      setSelectedResourceId(resource.id);
                    }}
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-6.518-4.2A1 1 0 007 8v8a1 1 0 001.234.97l6.518-4.2a1 1 0 000-1.9z"
                      />
                    </svg>
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Bookmark Modal */}
      {showBookmarkModal && (
        <Modal onClose={() => setShowBookmarkModal(false)}>
          <BookmarkResourceModal
            resource={resource}
            onClose={() => setShowBookmarkModal(false)}
            collections={userCollections}
            onAddToCollection={handleAddToCollection}
            note={resourceNote}
            onNoteChange={setResourceNote}
          />
        </Modal>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <Modal onClose={() => setShowVideoModal(false)}>
          <TimestampModal
            isOpen={showVideoModal}
            videoUrl={resource.videoUrl}
            timestamps={resource.timestamps}
            onClose={() => setShowVideoModal(false)}
          />
        </Modal>
      )}
    </div>
  );
};

export default HighlightedResourceCard;
