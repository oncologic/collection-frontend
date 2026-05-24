"use client";
import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  FaInfoCircle,
  FaShieldAlt,
  FaExclamationTriangle,
  FaGraduationCap,
  FaClock,
  FaMapMarkedAlt,
  FaArrowRight,
  FaVideo,
  FaUsers,
  FaLaptop,
  FaTags,
  FaUser,
  FaLock,
  FaThumbtack,
  FaTrash,
  FaEllipsisV,
  FaCopy,
} from "react-icons/fa";
import CustomEditor from "../common/CustomEditor";
import { EventDetail } from "../events/EventDetail";
import { DateTime } from "luxon";
import {
  usePinItems,
  useUnpinItems,
  useGetPinnedItems,
} from "@/app/hooks/usePinned";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";
import { useDeleteEvent } from "@/app/hooks/useEvents";
import { useRouter } from "next/navigation";

const Fundraiser = ({ event, isAdmin, userId, onDelete, onCopy }) => {
  // Check if user is signed in
  const { isSignedIn } = useAuth();

  // Pin functionality (only used if signed in)
  const { mutateAsync: pinItemsAsync } = usePinItems();
  const { mutateAsync: unpinItemsAsync } = useUnpinItems();
  const { data: pinnedItems } = useGetPinnedItems();

  const isPinned = useMemo(() => {
    if (!pinnedItems) return false;
    return pinnedItems.some((item) => item.id === event.id);
  }, [pinnedItems, event.id]);

  const { mutate: deleteEvent } = useDeleteEvent();
  const router = useRouter();

  const isUpcoming = new Date(event.startDate) >= new Date();
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isInfoPopupOpen, setIsInfoPopupOpen] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // TODO: Get this from the database
  const hasBookMarkState = false;
  const infoDetails = {
    organization: "COA",
    approvedBy: "Katie Coleman",
    dateAdded: "2023-01-01",
    dateScreened: "2023-01-02",
  };

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

  const handleButtonClick = () => {
    if (event.registrationRequired) {
      setIsPopupOpen(true);
    } else {
      setShowEventDetail(true);
    }
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const InfoModal = ({ isOpen, onClose, info }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-400      bg-opacity-50 z-10">
        <div className="bg-white p-4 rounded-lg max-w-xl w-full">
          <h2 className="text-lg font-bold text-center">Event Information</h2>
          <hr className="my-2" />
          <p className="text-gray-600 text-center">
            Business Unit: {info.organization}
          </p>
          <p className="text-gray-600 text-center">
            Approved By: {info.approvedBy}
          </p>
          <p className="text-gray-600 text-center">
            Date Added: {info.dateAdded}
          </p>
          <p className="text-gray-600 text-center">
            Date Screened: {info.dateScreened}
          </p>
          <p className="text-gray-600 text-center">
            Patient Rating: <PatientRating rating={event.patientRating} />
          </p>
          <p className="text-gray-600 text-center">
            Expert Rating: <ExpertRating rating={event.expertRating} />
          </p>
          <button
            onClick={onClose}
            className="mt-2 text-red-500 hover:underline"
          >
            Close
          </button>
        </div>
      </div>
    );
  };

  const renderSensitivityIcon = (level) => {
    switch (level) {
      case "high":
        return (
          <FaExclamationTriangle
            className="text-red-500"
            title="High Sensitivity"
          />
        );
      case "medium":
        return (
          <FaExclamationTriangle
            className="text-yellow-500"
            title="Medium Sensitivity"
          />
        );
      case "low":
        return (
          <FaShieldAlt className="text-green-500" title="Low Sensitivity" />
        );
      default:
        return null;
    }
  };

  // New Rating Components
  const PatientRating = ({ rating }) => {
    if (!rating && rating !== 0) {
      return <span className="text-gray-500 italic">Coming Soon</span>;
    }

    return (
      <span className="">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={index < rating ? "text-yellow-500" : "text-gray-300"}
          >
            ★
          </span>
        ))}
      </span>
    );
  };

  const ExpertRating = ({ rating }) => {
    if (!rating && rating !== 0) {
      return <span className="text-gray-500 italic">Coming Soon</span>;
    }

    return (
      <span className="">
        {Array.from({ length: 5 }, (_, index) => (
          <span
            key={index}
            className={index < rating ? "text-yellow-500" : "text-gray-300"}
          >
            ★
          </span>
        ))}
      </span>
    );
  };

  const formatDuration = (minutes) => {
    if (!minutes) return "";

    if (minutes < 60) {
      return `${minutes} minutes`;
    }

    const hours = minutes / 60;
    if (hours < 24) {
      // Round to nearest half hour
      const roundedHours = Math.round(hours * 2) / 2;
      return `${roundedHours} ${roundedHours === 1 ? "hour" : "hours"}`;
    }

    const days = hours / 24;
    // Round to nearest half day
    const roundedDays = Math.round(days * 2) / 2;
    return `${roundedDays} ${roundedDays === 1 ? "day" : "days"}`;
  };

  const TagsPopover = ({ tags }) => (
    <div className="group relative inline-block">
      <div className="cursor-pointer">
        <FaTags className="text-gray-400 hover:text-gray-700" />
      </div>
      {tags?.length > 0 && (
        <div className="absolute left-0 mt-2 w-48 hidden group-hover:block z-10">
          <div className="bg-slate-700 rounded-lg shadow-lg p-2 border">
            <div className="flex flex-wrap gap-1">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block bg-slate-600 rounded-full px-2 py-0.5 text-xs font-semibold text-white capitalize"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_0_25px_rgba(59,130,246,0.1)] transition-all duration-300 group relative overflow-hidden flex flex-col min-h-[26rem]">
        {/* Subtle glow effect overlay - reduced opacity */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-indigo-50/0 to-purple-50/0 opacity-0 group-hover:opacity-50 transition-opacity duration-300" />

        {/* Header Section */}
        <div
          className={`p-6 border-b border-gray-50/80 relative bg-gradient-to-br ${
            event.visibility === "private"
              ? "from-slate-600 to-slate-700"
              : "from-blue-600 to-indigo-700"
          }`}
        >
          <div className="flex items-center gap-4">
            {event.organizations?.[0] ? (
              (() => {
                const org = event.organizations[0];
                const imageUrl = org.imageUrl || org.logoUrl;
                // Check for valid image URL (not null, "null", undefined, or empty string)
                const hasValidImage =
                  imageUrl && imageUrl !== "null" && imageUrl !== "";

                return hasValidImage ? (
                  <Image
                    width={48}
                    height={48}
                    src={imageUrl}
                    alt={org.name || "Business Unit"}
                    className="object-contain rounded-md shadow-lg bg-white p-2"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center rounded-md shadow-lg bg-white p-1">
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded text-gray-600 font-bold text-lg">
                      {org.name ? org.name.charAt(0).toUpperCase() : "?"}
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="w-12 h-12 flex items-center justify-center rounded-md shadow-lg bg-white p-1">
                <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                  <FaUsers className="w-6 h-6 text-gray-400" />
                </div>
              </div>
            )}
            <h2 className="text-2xl font-semibold text-white capitalize flex-1">
              {event.eventType}
            </h2>
            <div className="flex gap-3 items-center">
              {/* Pin button - only show if signed in */}
              {isSignedIn && (
                <button
                  className="text-white/80 hover:text-white cursor-pointer transition-colors"
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      if (isPinned) {
                        await unpinItemsAsync([event.id]);
                        toast.success("Event unpinned successfully");
                      } else {
                        await pinItemsAsync([
                          {
                            id: event.id,
                            type: "event",
                            name: event.title,
                            description: event.description || "",
                            metadata: {
                              eventType: event.eventType || null,
                              organizations:
                                event.organizations?.map((org) => org.name) ||
                                [],
                              tags: event.tags?.map((tag) => tag.name) || [],
                              startDate: event.startDate,
                              endDate: event.endDate,
                              timezone: event.timezone,
                              location: `${event.locationCity}, ${event.locationState}`,
                              virtualEvent: event.virtualEvent,
                              inPersonEvent: event.inPersonEvent,
                            },
                          },
                        ]);
                        toast.success("Event pinned successfully");
                      }
                    } catch (error) {
                      console.error("Error toggling pin state:", error);
                      toast.error("Failed to update pin state");
                    }
                  }}
                  title={isPinned ? "Unpin event" : "Pin event"}
                >
                  <FaThumbtack
                    className={`w-4 h-4 ${
                      isPinned ? "text-green-400" : "text-white/80"
                    }`}
                  />
                </button>
              )}
              <FaInfoCircle
                onClick={() => setIsInfoPopupOpen(true)}
                className="text-white/80 hover:text-white cursor-pointer transition-colors"
              />
              {event.addedByUserId === userId && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsMenuOpen(!isMenuOpen);
                    }}
                    className="text-white/80 hover:text-white cursor-pointer transition-colors"
                  >
                    <FaEllipsisV className="w-4 h-4" />
                  </button>
                  {isMenuOpen && (
                    <div className="dropdown-menu absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onCopy) onCopy(event);
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <FaCopy className="w-4 h-4" />
                        Copy Event
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            window.confirm(
                              "Are you sure you want to delete this event?"
                            )
                          ) {
                            deleteEvent(
                              { id: event.id },
                              {
                                onSuccess: () => {
                                  if (onDelete) onDelete();
                                },
                                onError: (error) => {
                                  toast.error(
                                    error.message || "Failed to delete event"
                                  );
                                },
                              }
                            );
                          }
                          setIsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FaTrash className="w-4 h-4" />
                        Delete Event
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Section - adjusted to flex-grow */}
        <div className="flex-grow p-6 flex flex-col">
          <div className="space-y-3 flex-grow">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50/80 text-blue-700 backdrop-blur-sm shadow-sm">
                {isUpcoming ? "Upcoming" : "Past"}
              </span>
              {event.virtualEvent && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50/80 text-purple-700 backdrop-blur-sm shadow-sm">
                  <FaLaptop className="mr-1" /> Virtual
                </span>
              )}
              {event.inPersonEvent && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-50/80 text-green-700 backdrop-blur-sm shadow-sm">
                  <FaUsers className="mr-1" /> In-Person
                </span>
              )}
            </div>

            <h2
              className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 truncate"
              title={event.title}
            >
              {event.title}
            </h2>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-2">
                <FaClock className="w-4 h-4" />
                {DateTime.fromISO(event.startDate).toFormat("LLL dd, yyyy")}
              </span>
              <span>•</span>
              <span className="flex items-center gap-2">
                <FaMapMarkedAlt className="w-4 h-4" />
                {event?.locationCity}, {event?.locationState}
              </span>
            </div>

            <div className="relative overflow-hidden max-h-[200px] mt-1">
              <CustomEditor
                content={event.description}
                editor={false}
                scrollable={false}
                transparent={true}
                textColor="text-gray-600"
              />
              <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t from-white to-transparent" />
            </div>
          </div>

          {/* Footer Actions - now properly aligned at bottom */}
          <div className="pt-4 border-t border-gray-100 z-20">
            <button
              onClick={handleButtonClick}
              aria-label={`${
                event.registrationRequired ? "Register for" : "View details of"
              } ${event.title}`}
              className="w-full flex items-center justify-center gap-2 px-4  text-sm font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none transition-all duration-200 rounded-md"
            >
              {event.registrationRequired ? "Register Now" : "View Details"}
              <FaArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isPopupOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-400 bg-opacity-50 z-50">
          {/* ... existing registration modal content ... */}
        </div>
      )}

      {showEventDetail && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-400 bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <EventDetail
              event={event}
              onClose={() => setShowEventDetail(false)}
              showActions={isAdmin}
              isAdmin={isAdmin}
              isModal={true}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Fundraiser;
