import React, { useState, useMemo } from "react";
import {
  FaExternalLinkAlt,
  FaFlask,
  FaCalendarAlt,
  FaBuilding,
  FaEdit,
  FaArrowRight,
  FaTrash,
  FaPlay,
  FaThumbtack,
  FaClock,
  FaTag,
  FaShareAlt,
} from "react-icons/fa";
import Image from "next/image";
import Modal from "@/app/components/Modal";
import AddExternalLinkForm from "@/app/components/forms/AddExternalLinkForm";
import CustomEditor from "../common/CustomEditor";
import TimestampModal from "../TimestampModal";
import Link from "next/link";
import DynamicIcon from "../common/DynamicIcon";
import DOMPurify from "dompurify";
import {
  formatDateRangeShort,
  formatDayOfWeekRange,
} from "@/app/utils/general";
import { STATUS_OPTIONS } from "../forms/AddCollectionForm";
import MoveToCollectionMenu from "../common/MoveToCollectionMenu";
import { useRouter } from "next/navigation";
import {
  usePinItems,
  useUnpinItems,
  useGetPinnedItems,
} from "@/app/hooks/usePinned";
import { useExternalLinkTagsForLink } from "@/app/hooks/useTags";
import { toast } from "react-hot-toast";
import { formatTimeDisplay } from "../events/CalendarView";

const ExternalLinkCard = ({
  id,
  url,
  name,
  type,
  notes,
  date,
  startDate,
  endDate,
  dateAdded,
  description,
  imageUrl,
  timestamps,
  status,
  startTime,
  endTime,
  timezone,
  isAdmin = false,
  onUpdateExternalLink,
  onView,
  isSharedView = false,
  sharedToken = null,
  icon = "link",
  collectionId,
  moveToCollectionMenuProps,
  userId,
  currentUserId,
  onShowSocialMedia,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const router = useRouter();
  const scheduledStartDate = startDate || date;
  const scheduledEndDate = endDate || startDate || date;

  // Add pin-related hooks
  const { mutateAsync: pinItemsAsync } = usePinItems();
  const { mutateAsync: unpinItemsAsync } = useUnpinItems();
  const { data: pinnedItems } = useGetPinnedItems();

  // Add tags hook
  const { data: linkTags = [] } = useExternalLinkTagsForLink(id);

  // Check if this item has time information
  const hasTimeInfo = !!(startTime || endTime);

  // Get formatted time display
  const timeDisplay = useMemo(() => {
    if (!hasTimeInfo) return null;
    return formatTimeDisplay({ startTime, endTime, timezone });
  }, [startTime, endTime, timezone, hasTimeInfo]);

  // Track pinned state
  const isPinned = useMemo(() => {
    if (!pinnedItems) return false;
    return pinnedItems.some((item) => item.id === id);
  }, [pinnedItems, id]);

  // Handle pin toggle
  const handlePinToggle = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      if (isPinned) {
        await unpinItemsAsync([id]);
      } else {
        await pinItemsAsync([
          {
            id,
            type: "external_link",
            name,
            description: description || "",
            metadata: {
              url,
              type,
              status,
              date: scheduledStartDate || dateAdded,
              notes: notes?.length || 0,
            },
          },
        ]);
        toast.success("Item pinned successfully");
      }
    } catch (error) {
      console.error("Error toggling pin state:", error);
      toast.error("Failed to toggle pin state");
    }
  };

  const handleClick = () => {
    const isInternalUrl =
      url.startsWith("/") ||
      url.startsWith(process.env.NEXT_PUBLIC_APP_URL || "");

    if (isInternalUrl) {
      let path;
      if (isSharedView && sharedToken) {
        // Get email from localStorage for shared links
        const storedEmail = localStorage.getItem("shared-links-email");
        const emailParam = storedEmail
          ? `&email=${encodeURIComponent(storedEmail)}`
          : "";
        path = `/shared/${id}?token=${sharedToken}${emailParam}`;
      } else {
        path = `/external-links/${id}`;
      }
      router.push(path);
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const isYoutubeUrl = (url) => {
    return url?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/);
  };

  // Create a sanitized version of the HTML
  const sanitizedDescription = description
    ? DOMPurify.sanitize(description)
    : "";

  // Determine if the current user is the creator
  const canDelete = isAdmin || userId === currentUserId;

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 group relative overflow-hidden min-h-[400px] flex flex-col">
        {/* Header with actions */}
        <div className="relative p-6 pb-4">
          {/* Action buttons - positioned absolutely in top right */}
          <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handlePinToggle}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isPinned
                  ? "text-blue-500 bg-blue-50 hover:bg-blue-100"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
              }`}
              title={isPinned ? "Unpin item" : "Pin item"}
            >
              <FaThumbtack size={12} />
            </button>

            {onShowSocialMedia && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowSocialMedia();
                }}
                className="p-2 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                title="View social media accounts"
              >
                <FaShareAlt size={12} />
              </button>
            )}
            
            {(isAdmin || userId === currentUserId) && !isSharedView && (
              <>
                {isAdmin && moveToCollectionMenuProps && (
                  <MoveToCollectionMenu
                    {...moveToCollectionMenuProps}
                    userId={userId}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    onDelete={moveToCollectionMenuProps?.onDelete}
                  />
                )}
                {canDelete && (
                  <button
                    onClick={() => moveToCollectionMenuProps?.onDelete?.()}
                    className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                    title="Delete external link"
                  >
                    <FaTrash size={12} />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Date and time info */}
          <div className="flex flex-col gap-3 mb-4">
            {/* Date and time row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1.5">
                  <FaCalendarAlt className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-medium">
                    {scheduledStartDate
                      ? formatDayOfWeekRange(
                          scheduledStartDate,
                          scheduledEndDate
                        )
                      : formatDayOfWeekRange(dateAdded, dateAdded)}
                  </span>
                  <span className="text-gray-500">
                    {scheduledStartDate
                      ? formatDateRangeShort(
                          scheduledStartDate,
                          scheduledEndDate
                        )
                      : formatDateRangeShort(dateAdded, dateAdded)}
                  </span>
                </div>

                {hasTimeInfo && timeDisplay && (
                  <>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <div className="flex items-center gap-1.5">
                      <FaClock className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-gray-600">{timeDisplay}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Status, type, and tags badges */}
            <div className="flex flex-wrap items-center gap-2">
              {status && (
                <span
                  className={`
                    inline-flex items-center px-3 py-1 rounded-full text-xs font-medium capitalize
                    ${
                      STATUS_OPTIONS.find((s) => s.id === status)?.color ||
                      "bg-gray-100 text-gray-700"
                    }
                    ${
                      ["pending", "active", "waiting"].includes(status)
                        ? "!opacity-100"
                        : "!opacity-80"
                    }
                    ${status === "waiting" ? "bg-yellow-50" : "bg-opacity-40"}
                  `}
                >
                  {status}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                <DynamicIcon iconName={icon} className="w-3 h-3" />
                {type.replace("_", " ")}
              </span>

              {/* Display tags */}
              {linkTags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: `${tag.color}15`,
                    borderColor: `${tag.color}40`,
                    color: tag.color,
                  }}
                >
                  <FaTag className="w-2.5 h-2.5" />
                  {tag.name}
                </span>
              ))}

              {linkTags.length > 3 && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  <FaTag className="w-2.5 h-2.5" />+{linkTags.length - 3}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3
            className="text-lg font-semibold text-gray-900 group-hover:text-purple-700 transition-colors duration-200 line-clamp-2 cursor-pointer leading-tight pr-12"
            onClick={handleClick}
          >
            {name}
          </h3>
        </div>

        {/* Content area */}
        <div className="flex-1 px-6 pb-4">
          {/* Description */}
          <div className="mb-4">
            <div className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {description ? (
                <div
                  dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                  className="description-content [&>*]:my-0 [&>p]:leading-relaxed"
                />
              ) : (
                <span className="text-gray-400 italic">
                  No description available
                </span>
              )}
            </div>
          </div>

          {/* Notes section */}
          {notes && notes.length > 0 && (
            <div className="border-t border-gray-100 pt-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-gray-500">Notes</span>
                <span className="inline-flex items-center justify-center w-5 h-5 bg-indigo-100 text-indigo-600 rounded-full text-xs font-medium">
                  {notes.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {notes.slice(0, 4).map((note, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-xs truncate max-w-[120px] border border-indigo-100"
                    title={note.text || note.title || "Note"}
                  >
                    {note.title?.substring(0, 12) || "Note"}
                    {note.title?.length > 12 ? "..." : ""}
                  </span>
                ))}
                {notes.length > 4 && (
                  <span className="px-2 py-1 bg-gray-50 text-gray-500 rounded-md text-xs border border-gray-200">
                    +{notes.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 mt-auto border-t border-gray-50 pt-4">
          <div className="flex items-center justify-between">
            <Link
              href={
                isSharedView && sharedToken
                  ? (() => {
                      // Get email from localStorage for shared links
                      const storedEmail =
                        localStorage.getItem("shared-links-email");
                      const emailParam = storedEmail
                        ? `&email=${encodeURIComponent(storedEmail)}`
                        : "";
                      return `/shared/${id}?token=${sharedToken}${emailParam}`;
                    })()
                  : `/external-links/${id}`
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 border border-purple-200 hover:border-purple-300"
            >
              View Details
              <FaArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <div className="flex items-center gap-2">
              {isYoutubeUrl(url) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVideoModal(true);
                  }}
                  className="p-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200 border border-purple-200 hover:border-purple-300"
                  title="Play Video"
                >
                  <FaPlay size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <TimestampModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        videoUrl={url}
        timestamps={timestamps}
        sharedToken={isSharedView ? sharedToken : null}
      />
    </>
  );
};

export default ExternalLinkCard;
