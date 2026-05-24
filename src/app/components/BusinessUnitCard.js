"use client";
import React, { useState, useEffect } from "react";
import {
  FaInfoCircle,
  FaTrash,
  FaBookmark,
  FaExternalLinkAlt,
  FaUser,
  FaEllipsisV,
} from "react-icons/fa";
import { useContextAuth } from "../context/authContext";
import {
  useSubscribeToBusinessUnit,
  useUnsubscribeFromBusinessUnit,
  useUserSubscriptions,
} from "../hooks/useBusinessUnits";
import CustomEditor from "./common/CustomEditor";
import Image from "next/image";
import { useDeleteBusinessUnit } from "../hooks/useBusinessUnits";

// Delete Confirmation Modal Component
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  businessUnitName,
  isDeleting,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Delete Business Unit
        </h3>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete &quot;{businessUnitName}&quot;? This
          action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isDeleting && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Delete Business Unit
          </button>
        </div>
      </div>
    </div>
  );
};

// Component for placeholder avatar
const PlaceholderAvatar = ({ name, size = "w-16 h-16" }) => {
  const firstLetter = name?.charAt(0).toUpperCase() || "?";

  // Generate a consistent background color based on the name
  const getBackgroundColor = (str) => {
    const colors = [
      "bg-blue-200",
      "bg-green-200",
      "bg-purple-200",
      "bg-red-200",
      "bg-yellow-200",
      "bg-indigo-200",
      "bg-pink-200",
      "bg-gray-400",
    ];
    const hash =
      str?.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0) || 0;
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className={`${size} rounded-lg shadow-lg border-2 border-white ${getBackgroundColor(
        name
      )} flex items-center justify-center`}
    >
      <span className="text-gray-700 font-bold text-xl">{firstLetter}</span>
    </div>
  );
};

// Helper function to check if contact info is placeholder
const isPlaceholderContact = (email, phone) => {
  const placeholderEmail = email === "na@na.org";
  const placeholderPhone = phone === "000-000-0000";
  return { placeholderEmail, placeholderPhone };
};

const BusinessUnitCard = ({
  org,
  isAdmin,
  isPersonal,
  subscribed,
  systemUserId,
}) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { userId } = useContextAuth();
  const subscribe = useSubscribeToBusinessUnit();
  const unsubscribe = useUnsubscribeFromBusinessUnit();
  const deleteOrg = useDeleteBusinessUnit();
  const isVirtualOrg = Boolean(org.isVirtual);

  // Use the subscribed prop if provided, otherwise check userSubscriptions
  const { data: userSubscriptions = [] } = useUserSubscriptions();
  const isSubscribed =
    !isVirtualOrg && subscribed !== undefined
      ? subscribed
      : !isVirtualOrg && userSubscriptions.some((sub) => sub.id === org.id);

  // Check if contact info contains placeholders
  const { placeholderEmail, placeholderPhone } = isPlaceholderContact(
    org.primaryContactEmail,
    org.primaryContactPhone
  );

  // Only show contact section if we have valid (non-placeholder) contact info
  const hasValidContactInfo =
    (org.primaryContactName && org.primaryContactName.trim() !== "") ||
    (org.primaryContactEmail && !placeholderEmail) ||
    (org.primaryContactPhone && !placeholderPhone);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest(".dropdown-menu")) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Reset image error when org changes
  useEffect(() => {
    setImageError(false);
  }, [org.id, org.imageUrl]);

  const visibleTags = showAllTags ? org.tags : org.tags?.slice(0, 3);
  const hasMoreTags = org.tags?.length > 3;

  const handleImageError = () => {
    setImageError(true);
  };

  const handleSubscriptionToggle = async () => {
    if (isVirtualOrg) {
      return;
    }

    try {
      if (isSubscribed) {
        unsubscribe.mutate({
          businessUnitId: org.id,
          userId,
          role: "subscriber",
        });
      } else {
        subscribe.mutate({
          businessUnitId: org.id,
          userId,
          role: "subscriber",
        });
      }
    } catch (error) {
      console.error("Subscription toggle error:", error);
    }
  };

  const handleInfoToggle = () => {
    setIsInfoOpen((prev) => !prev);
  };

  const handleDelete = async () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteOrg.mutateAsync(org.id);
      setShowDeleteModal(false);
    } catch (error) {
      // Error handling is done in the hook
      console.error("Failed to delete business unit:", error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_0_25px_rgba(59,130,246,0.1)] transition-all duration-300 group relative overflow-hidden flex flex-col h-full">
      {/* Subtle glow effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-indigo-50/0 to-purple-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Favorite status indicator */}
      {!isVirtualOrg && isSubscribed && (
        <div className="absolute top-3 right-3 z-10 flex items-center justify-center">
          <span className="relative flex h-2 w-2 rounded-full bg-emerald-500">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="ml-2 text-xs font-medium text-emerald-600 bg-emerald-50/90 px-2 py-1 rounded-full">
            Favorited
          </span>
        </div>
      )}

      {/* Header Section with Image and Info */}
      <div className="relative p-6 border-b border-gray-50/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              {org.imageUrl && !imageError ? (
                <Image
                  width={64}
                  height={64}
                  src={org.imageUrl}
                  alt={org.name}
                  className="w-16 h-16 rounded-lg shadow-lg border-2 border-white object-contain"
                  onError={handleImageError}
                />
              ) : (
                <PlaceholderAvatar name={org.name} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              {org.website ? (
                <a
                  href={org.website.startsWith('http') ? org.website : `https://${org.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block"
                >
                  <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 line-clamp-2 break-words cursor-pointer">
                    {org.name}
                  </h2>
                </a>
              ) : (
                <a
                  href={`/business-units/${org.id}`}
                  className="inline-block"
                >
                  <h2 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-200 line-clamp-2 break-words cursor-pointer">
                    {org.name}
                  </h2>
                </a>
              )}
              {org.acronym && (
                <p className="text-sm text-gray-500 font-medium mt-1 truncate">
                  {org.acronym}
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 transition-all duration-200"
              title="More options"
            >
              <FaEllipsisV className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="dropdown-menu absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                {/* Contact Info - Only show if we have valid contact info */}
                {hasValidContactInfo && (
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Primary Contact
                    </h4>
                    <div className="space-y-1">
                      {org.primaryContactName &&
                        org.primaryContactName.trim() !== "" && (
                          <div className="flex items-center gap-2">
                            <FaUser className="w-3 h-3 text-gray-400" />
                            <span className="text-sm text-gray-700 font-medium">
                              {org.primaryContactName}
                            </span>
                          </div>
                        )}
                      {org.primaryContactEmail && !placeholderEmail && (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-3 h-3 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <a
                            href={`mailto:${org.primaryContactEmail}`}
                            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {org.primaryContactEmail}
                          </a>
                        </div>
                      )}
                      {org.primaryContactPhone && !placeholderPhone && (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-3 h-3 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                          </svg>
                          <a
                            href={`tel:${org.primaryContactPhone}`}
                            className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {org.primaryContactPhone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Menu Items */}
                <button
                  onClick={() => {
                    handleInfoToggle();
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FaInfoCircle className="w-4 h-4 text-gray-400" />
                  More Information
                </button>

                {(isAdmin || (isPersonal && org.userId === systemUserId)) && (
                  <button
                    onClick={() => {
                      handleDelete();
                      setIsMenuOpen(false);
                    }}
                    disabled={deleteOrg.isPending}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaTrash className="w-4 h-4" />
                    Delete Business Unit
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tags Section */}
        {org.tags && org.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {visibleTags?.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center bg-blue-50/80 rounded-full px-3 py-1 text-xs font-medium text-blue-700 border border-blue-100/50 shadow-sm"
              >
                {tag.name}
              </span>
            ))}
            {hasMoreTags && (
              <button
                onClick={() => setShowAllTags(!showAllTags)}
                className="inline-flex items-center text-xs text-blue-500 hover:text-blue-600 hover:underline focus:outline-none bg-blue-50/50 rounded-full px-2 py-1 transition-colors"
              >
                {showAllTags ? "Show Less" : `+${org.tags.length - 3} more`}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-grow">
        <p className="text-gray-600 text-sm leading-relaxed mb-6 flex-grow line-clamp-4">
          {org.description || "No description available."}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-auto">
          <a
            href={`/business-units/${org.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 py-2.5 px-4 rounded-lg text-sm font-medium hover:from-gray-100 hover:to-gray-200 transition-all duration-200 border border-gray-200 group"
          >
            <span>View Details</span>
            <FaExternalLinkAlt className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </a>

          {!isVirtualOrg && (
            <button
              onClick={handleSubscriptionToggle}
              disabled={subscribe.isPending || unsubscribe.isPending}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                subscribe.isPending || unsubscribe.isPending
                  ? "opacity-50 cursor-not-allowed bg-gray-100 text-gray-400"
                  : isSubscribed
                  ? "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 hover:from-emerald-100 hover:to-emerald-200 border border-emerald-200"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-sm hover:shadow-md"
              }`}
            >
              {subscribe.isPending || unsubscribe.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <FaBookmark className="w-3 h-3" />
                  <span>
                    {isSubscribed
                      ? "Remove from Favorites"
                      : "Add to Favorites"}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Info Modal */}
      {isInfoOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 relative overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="relative flex-shrink-0">
                    {org.imageUrl && !imageError ? (
                      <Image
                        width={48}
                        height={48}
                        src={org.imageUrl}
                        alt={org.name}
                        className="w-12 h-12 rounded-lg shadow-md border-2 border-white object-contain"
                        onError={handleImageError}
                      />
                    ) : (
                      <PlaceholderAvatar name={org.name} size="w-12 h-12" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {org.name}
                    </h2>
                    {org.acronym && (
                      <p className="text-sm text-gray-600">{org.acronym}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={handleInfoToggle}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white/50 transition-all duration-200"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                  About
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {org.description || "No description available."}
                </p>
              </div>

              {/* Focus Areas */}
              {org.tags && org.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Focus Areas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {org.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center bg-blue-50 rounded-full px-3 py-1.5 text-sm font-medium text-blue-700 border border-blue-100"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information - Only show if we have valid contact info */}
              {hasValidContactInfo && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
                    Contact Information
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    {org.primaryContactName &&
                      org.primaryContactName.trim() !== "" && (
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          <span className="text-gray-700 font-medium">
                            {org.primaryContactName}
                          </span>
                        </div>
                      )}
                    {org.primaryContactEmail && !placeholderEmail && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <a
                          href={`mailto:${org.primaryContactEmail}`}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          {org.primaryContactEmail}
                        </a>
                      </div>
                    )}
                    {org.primaryContactPhone && !placeholderPhone && (
                      <div className="flex items-center gap-2">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <a
                          href={`tel:${org.primaryContactPhone}`}
                          className="text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          {org.primaryContactPhone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        businessUnitName={org.name}
        isDeleting={deleteOrg.isPending}
      />
    </div>
  );
};

export default BusinessUnitCard;
