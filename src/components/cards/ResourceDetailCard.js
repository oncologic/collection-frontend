import React, { useState, useMemo } from "react";
import { DateTime } from "luxon";
import CustomEditor from "@/app/components/common/CustomEditor";
import Link from "next/link";
import Modal from "@/app/components/Modal";
import BookmarkResourceModal from "../modals/BookmarkResourceModal";
import VideoEmbed from "@/app/components/VideoEmbed";
import Image from "next/image";
import { useAddResourceToCollection } from "@/app/hooks/useCollections";
import TimestampModal from "@/app/components/TimestampModal";
import { toast } from "react-hot-toast";
import { usePinItems } from "@/app/hooks/usePinned";
import {
  FaBookmark,
  FaThumbtack,
  FaShieldAlt,
  FaExclamationTriangle,
  FaInstagram,
} from "react-icons/fa";
import { useContextAuth } from "@/app/context/authContext";
import { useUser } from "@clerk/nextjs";
import {
  getPlayableVideoUrl,
  getVideoType,
  normalizeVideoUrl,
} from "@/app/utils/videoProviders";

export const renderSensitivityIcon = (resource, position) => {
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
            <div className="text-sm text-gray-500">Medium distress rating</div>
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

const ResourceDetailCard = ({
  resource,
  isAdmin,
  isAdvocate,
  onCopyResource,
  collections,
  handleDeleteResource,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [resourceNote, setResourceNote] = useState("");
  const { mutate: addResourceToCollection } = useAddResourceToCollection();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { mutateAsync: pinItemsAsync } = usePinItems();
  const { systemUser } = useContextAuth();
  const { isSignedIn } = useUser();

  const userCollections = useMemo(() => {
    return collections.filter(
      (collection) => collection.visibility !== "public"
    );
  }, [collections]);

  const canDelete = useMemo(() => {
    const isCreator =
      !!systemUser?.id &&
      (resource.addedByUserId === systemUser.id ||
        resource.userId === systemUser.id);
    const isAdvocateForResourceTenant =
      Array.isArray(isAdvocate) &&
      isAdvocate.some((tenant) => tenant.tenantId === resource.tenantId);

    return isAdmin || isCreator || isAdvocateForResourceTenant;
  }, [
    isAdmin,
    isAdvocate,
    resource.addedByUserId,
    resource.tenantId,
    resource.userId,
    systemUser?.id,
  ]);

  const playableVideoUrl = useMemo(
    () => getPlayableVideoUrl(resource.videoUrl, resource.url),
    [resource.videoUrl, resource.url]
  );
  const playableVideoType = useMemo(
    () => getVideoType(playableVideoUrl),
    [playableVideoUrl]
  );
  const normalizedPlayableVideoUrl = useMemo(
    () => normalizeVideoUrl(playableVideoUrl),
    [playableVideoUrl]
  );

  // Check if resource is new or recently updated (within the last 3 days)
  const getResourceStatus = () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.setDate(now.getDate() - 3));

    // Check if resource is new (created within last 3 days)
    const creationDate = new Date(resource.createdAt);
    if (creationDate > threeDaysAgo) return "new";

    // Check if resource was recently updated
    const updateDate = new Date(resource.updatedAt);
    if (updateDate > threeDaysAgo) return "updated";

    return null;
  };

  const resourceStatus = getResourceStatus();

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
        })) ?? [],
      tags:
        resource.tags?.map((tag) => ({
          id: tag.id,
          name: tag.name,
        })) ?? [],
    };

    onCopyResource(formattedResource);
  };

  const handleAddToCollection = (collectionId) => {
    addResourceToCollection({
      resourceId: resource.id,
      collectionId: collectionId,
      note: resourceNote || null,
    });
  };

  const handleDelete = async () => {
    try {
      handleDeleteResource(resource.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error("Failed to delete resource");
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_0_25px_rgba(59,130,246,0.1)] transition-all duration-300 group relative overflow-hidden">
      {/* Subtle glow effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-indigo-50/0 to-purple-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Resource status indicator */}
      {resourceStatus && (
        <div
          className="absolute top-0 right-0 z-10 flex items-center justify-center px-2 py-1 rounded-l-full"
          style={{
            backgroundColor:
              resourceStatus === "new"
                ? "rgba(236, 253, 245, 0.9)"
                : "rgba(239, 246, 255, 0.9)",
          }}
        >
          <span
            className={`relative flex h-2 w-2 rounded-full ${
              resourceStatus === "new" ? "bg-emerald-500" : "bg-blue-500"
            }`}
          >
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                resourceStatus === "new" ? "bg-emerald-500" : "bg-blue-500"
              }`}
            ></span>
          </span>
          <span
            className={`ml-2 text-xs font-medium ${
              resourceStatus === "new" ? "text-emerald-600" : "text-blue-600"
            }`}
          >
            {resourceStatus === "new" ? "New" : "Recently updated"}
          </span>
        </div>
      )}

      {/* Resource Header */}
      <div className="p-6 border-b border-gray-50/80 relative">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              {resource.organizations?.[0]?.imageUrl && (
                <Image
                  src={resource.organizations[0].imageUrl}
                  alt={`${resource.organizations[0].name} logo`}
                  className="w-12 h-12 object-contain rounded-md shadow-lg"
                  width={48}
                  height={48}
                  priority={true}
                  quality={100}
                  loading="eager"
                />
              )}
              {renderSensitivityIcon(resource, "right")}
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50/80 text-blue-700 shadow-sm">
                {resource.resourceType?.name}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
              {!isSignedIn && resource.url ? (
                <a 
                  href={resource.url.startsWith('http') ? resource.url : `https://${resource.url}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {resource.name}
                </a>
              ) : (
                <Link href={`/resources/${resource.id}`}>{resource.name}</Link>
              )}
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {DateTime.fromISO(resource.resourceDate).toFormat(
                  "LLL dd, yyyy"
                )}
              </span>
              {resource.expertiseLevel && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    {resource.expertiseLevel?.name} Level
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1 self-start">
            {/* Auth-required buttons - Only show when signed in */}
            {isSignedIn && (
              <>
                {/* Pin button */}
                <button
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50/80 transition-all duration-200"
                  onClick={async () => {
                    try {
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
                            expertiseLevel: resource.expertiseLevel?.name || null,
                            organizations:
                              resource.organizations?.map((org) => org.name) || [],
                            tags: resource.tags?.map((tag) => tag.name) || [],
                          },
                        },
                      ]);
                      toast.success("Resource pinned successfully");
                    } catch (error) {
                      console.error("Error pinning resource:", error);
                      toast.error("Failed to pin resource");
                    }
                  }}
                  title="Pin resource"
                >
                  <FaThumbtack
                    className={`w-4 h-4 ${
                      resource.pinned ? "text-blue-200" : "text-gray-300"
                    }`}
                  />
                </button>

                {/* Collection bookmark button */}
                <button
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50/80 transition-all duration-200 relative"
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

                {(isAdmin || isAdvocate) && (
                  <button
                    className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50/80 transition-all duration-200"
                    onClick={handleCopyResource}
                  >
                    <svg
                      className="w-5 h-5"
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
              </>
            )}
            
            {/* Video button - Only show when there's actually a video URL */}
            {playableVideoUrl && (
              playableVideoType === "instagram" ? (
                <a
                  href={normalizedPlayableVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-pink-500 rounded-full hover:bg-pink-50/80 transition-all duration-200"
                  title="Open on Instagram"
                  aria-label="Open on Instagram"
                >
                  <FaInstagram className="w-5 h-5" />
                </a>
              ) : (
                <button
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50/80 transition-all duration-200"
                  onClick={() => {
                    setShowVideoModal(true);
                    setSelectedResourceId(resource.id);
                  }}
                  title="Play video"
                >
                  <svg
                    className="w-5 h-5"
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
              )
            )}
          </div>
        </div>
      </div>

      {/* Description Section */}
      <div className="px-6 py-4 relative">
        <div className="relative max-h-24 overflow-hidden">
          <CustomEditor
            content={resource.description}
            readOnly={true}
            scrollable={false}
            transparent={true}
            textColor="text-gray-600"
          />
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white to-transparent pointer-events-none" />
        </div>

        {/* Tags display section */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="mt-3 mb-2">
            <div className="flex flex-wrap gap-1.5">
              {resource.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-2">
          {!isSignedIn && resource.url ? (
            <a
              href={resource.url.startsWith('http') ? resource.url : `https://${resource.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:text-blue-600 focus:outline-none focus:underline cursor-pointer relative z-10"
            >
              View resource →
            </a>
          ) : (
            <Link
              href={`/resources/${resource.id}`}
              className="text-sm hover:text-blue-600 focus:outline-none focus:underline cursor-pointer relative z-10"
            >
              View full resource
            </Link>
          )}

          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-red-50/80  transition-all duration-200"
              title="Delete resource"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {showBookmarkModal && (
        <Modal onClose={() => setShowBookmarkModal(false)}>
          <BookmarkResourceModal
            resource={resource}
            onClose={() => setShowBookmarkModal(false)}
            collections={
              isAdmin
                ? collections
                : collections.filter(
                    (collection) => collection.visibility !== "public"
                  )
            }
            onAddToCollection={handleAddToCollection}
            note={resourceNote}
            onNoteChange={setResourceNote}
          />
        </Modal>
      )}

      {showVideoModal && (
        <Modal onClose={() => setShowVideoModal(false)}>
          <TimestampModal
            isOpen={showVideoModal}
            videoUrl={playableVideoUrl}
            timestamps={resource.timestamps}
            onClose={() => setShowVideoModal(false)}
          />
        </Modal>
      )}

      {/* Add delete confirmation modal */}
      {showDeleteConfirm && (
        <Modal onClose={() => setShowDeleteConfirm(false)}>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Resource
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this resource? This action cannot
              be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ResourceDetailCard;
