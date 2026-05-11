"use client";

import { useState, useEffect, useRef } from "react";
import { DateTime } from "luxon";
import Image from "next/image";
import Link from "next/link";
import CustomEditor from "../common/CustomEditor";
import { EventDetail } from "./EventDetail";
import {
  FaBullhorn,
  FaCalendar,
  FaHandshake,
  FaExternalLinkAlt,
  FaEdit,
  FaEllipsisH,
  FaClock,
  FaTimes,
  FaUpload,
  FaTag,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import DOMPurify from "dompurify";
import { STATUS_OPTIONS } from "../forms/AddCollectionForm";
import DateEventsModal from "./DateEventsModal";
import WeekView from "./WeekView";
import DayView from "./DayView";
import { YearView } from "./YearView";
import { useCalendarEventUpdates } from "../../hooks/useCalendarUpdates";
import TimePickerForm from "../forms/TimePickerForm";
import { formatTimeDisplay } from "./CalendarView";
import { useMultiDaySelection } from "../../hooks/useMultiDaySelection";
import AvailabilityComposer from "./AvailabilityComposer";
import { useGoogleCalendar } from "../../hooks/useGoogleCalendar";
import { FaGoogle, FaFilter, FaList } from "react-icons/fa";
import MultiSelect from "../inputs/MultiSelect";
import ListView from "./ListView";
import { formatLongDateRange } from "../../utils/general";
import Modal from "../Modal";

export const EventDetailModal = ({
  event,
  events = [],
  onClose,
  isAdmin,
  hasSponsorships,
  onExternalLinkClick,
  isExternal = false,
}) => {
  useEffect(() => {
    if (event.description) {
      event.description = DOMPurify.sanitize(event.description);
    }
  }, [event]);

  if (!event) return null;

  const sanitizedDescription = event.description
    ? DOMPurify.sanitize(event.description)
    : "";
  const hasRichContent = /<\/?[a-z][\s\S]*>/i.test(sanitizedDescription);
  const normalizeStatusLabel = (value) =>
    String(value || "Pending")
      .replace(/[_-]/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  const statusOption = STATUS_OPTIONS.find(
    (status) => status.id === event.status?.toLowerCase()
  );
  const statusLabel = statusOption?.label || normalizeStatusLabel(event.status);
  const statusColor = statusOption?.color || "bg-gray-100 text-gray-700";
  const itemTypeLabel =
    event.type === "notation"
      ? "Note"
      : event.type === "external_link"
      ? "External Link"
      : "Item";
  const buildTagChipStyle = (color) => {
    if (!color) {
      return undefined;
    }

    const normalizedColor = String(color).trim();
    const hexMatch = normalizedColor.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);

    if (!hexMatch) {
      return {
        color: normalizedColor,
        borderColor: normalizedColor,
      };
    }

    let hex = hexMatch[1];
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((character) => `${character}${character}`)
        .join("");
    }

    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);

    return {
      color: `rgb(${red}, ${green}, ${blue})`,
      backgroundColor: `rgba(${red}, ${green}, ${blue}, 0.12)`,
      borderColor: `rgba(${red}, ${green}, ${blue}, 0.22)`,
    };
  };

  // Function to check if two time ranges overlap
  const timesOverlap = (event1, event2) => {
    // Skip if events are on different dates
    if (event1.startDate !== event2.startDate) {
      return false;
    }

    // Get time strings
    const start1 = event1.startTime || event1.time;
    const end1 = event1.endTime;
    const start2 = event2.startTime || event2.time;
    const end2 = event2.endTime;

    // If either event doesn't have time info, no overlap
    if (!start1 || !start2) {
      return false;
    }

    // Convert times to minutes for comparison
    const timeToMinutes = (timeStr) => {
      if (!timeStr) return null;
      const [hours, minutes] = timeStr.split(":").map(Number);
      return hours * 60 + (minutes || 0);
    };

    const start1Min = timeToMinutes(start1);
    const end1Min = end1 ? timeToMinutes(end1) : start1Min + 60; // Default 1 hour if no end time
    const start2Min = timeToMinutes(start2);
    const end2Min = end2 ? timeToMinutes(end2) : start2Min + 60; // Default 1 hour if no end time

    // Check for overlap: start1 < end2 && start2 < end1
    const overlaps = start1Min < end2Min && start2Min < end1Min;

    return overlaps;
  };

  // Filter for overlapping events (exclude current event and events without time info)
  const overlappingEvents = events.filter((otherEvent) => {
    // Skip the current event (same ID and same title)
    if (otherEvent.id === event.id && otherEvent.title === event.title) {
      return false;
    }

    // Skip events without time information
    if (!otherEvent.startTime && !otherEvent.time) {
      return false;
    }

    const isOverlapping = timesOverlap(event, otherEvent);

    return isOverlapping;
  });

  // Debug: Log all events and same-date events
  const sameDateEvents = events.filter(
    (e) => e.startDate === event.startDate && e.id !== event.id
  );

  // If it's an external link event, render a different view
  if (event.type !== "event" && !event.eventType) {
    // Format date display
    const formattedDate = formatLongDateRange(
      event.startDate || event.date,
      event.endDate || event.startDate || event.date
    );
    const handleOpenDetails = () => {
      if (event.type === "notation" && event.notationId) {
        const externalLinkId =
          event.parentId ||
          (event.id?.startsWith("notation-") ? event.externalLinkId : event.id);

        if (typeof window !== "undefined") {
          window.open(
            `/external-links/${externalLinkId}?highlightNotation=${event.notationId}`,
            "_blank"
          );
        }
      } else {
        onExternalLinkClick?.(event.id, event);
      }

      onClose();
    };

    return (
      <Modal
        onClose={onClose}
        isOpen={true}
        maxWidth="max-w-4xl"
        className="overflow-hidden rounded-[28px] border border-slate-200/80"
        showCloseButton={false}
      >
        <div className="bg-gradient-to-b from-white via-white to-slate-50">
          <div className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/95 px-6 py-5 backdrop-blur sm:px-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold tracking-[0.02em] text-blue-700">
                    {itemTypeLabel}
                  </span>
                  {formattedDate && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      <FaCalendar className="h-3.5 w-3.5 text-slate-400" />
                      {formattedDate}
                    </span>
                  )}
                  {(event.startTime || event.endTime || event.time) && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      <FaClock className="h-3.5 w-3.5 text-slate-400" />
                      {formatTimeDisplay(event)}
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">
                  {event.title || event.name || "Untitled"}
                </h3>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}
                  >
                    {statusLabel}
                  </span>
                  {event.tags?.map((tag, index) => (
                    <span
                      key={tag.id || tag.name || index}
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                      style={buildTagChipStyle(tag.color)}
                    >
                      {tag.name || tag}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
                aria-label="Close"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[68vh] overflow-y-auto px-6 py-6 sm:px-8">
            <div className="space-y-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
                  <FaEllipsisH className="h-3.5 w-3.5 text-slate-400" />
                  Overview
                </div>
                {sanitizedDescription ? (
                  hasRichContent ? (
                    <div
                      className="prose prose-sm max-w-none text-slate-700 prose-p:leading-7 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-700"
                      dangerouslySetInnerHTML={{
                        __html: sanitizedDescription,
                      }}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
                      {sanitizedDescription}
                    </div>
                  )
                ) : (
                  <p className="text-sm italic text-slate-400">
                    No additional details yet.
                  </p>
                )}
              </section>

              {overlappingEvents.length > 0 && (
                <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                      <FaClock className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        Time Conflicts
                      </h4>
                      <p className="text-sm text-slate-500">
                        {overlappingEvents.length} overlapping item
                        {overlappingEvents.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {overlappingEvents.map((conflictEvent) => (
                      <div
                        key={conflictEvent.id}
                        className="rounded-xl border border-white/70 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <h5 className="truncate text-sm font-semibold text-slate-900">
                              {conflictEvent.title || conflictEvent.name}
                            </h5>
                            {(conflictEvent.startTime || conflictEvent.time) && (
                              <div className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                                <FaClock className="h-3 w-3" />
                                {formatTimeDisplay(conflictEvent)}
                              </div>
                            )}
                            <span
                              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                                conflictEvent.type === "external_link"
                                  ? "bg-blue-50 text-blue-700"
                                  : conflictEvent.type === "notation"
                                  ? "bg-violet-50 text-violet-700"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {conflictEvent.type === "external_link"
                                ? "Link"
                                : conflictEvent.type === "notation"
                                ? "Note"
                                : "Resource"}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              onClose();
                              setTimeout(() => {
                                if (
                                  conflictEvent.type === "notation" &&
                                  conflictEvent.notationId
                                ) {
                                  const externalLinkId =
                                    conflictEvent.parentId ||
                                    (conflictEvent.id?.startsWith("notation-")
                                      ? conflictEvent.externalLinkId
                                      : conflictEvent.id);
                                  if (typeof window !== "undefined") {
                                    window.location.href = `/external-links/${externalLinkId}?highlightNotation=${conflictEvent.notationId}`;
                                  }
                                } else if (
                                  conflictEvent.type === "external_link"
                                ) {
                                  onExternalLinkClick?.(
                                    conflictEvent.id,
                                    conflictEvent
                                  );
                                }
                              }, 100);
                            }}
                            className="inline-flex items-center rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white px-6 py-4 sm:px-8">
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={handleOpenDetails}
                className="inline-flex items-center gap-2 rounded-xl bg-[#4263EB] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3b5bd9]"
              >
                Details
                <FaExternalLinkAlt className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-400 bg-opacity-50 z-50 flex md:items-center md:justify-center">
      {/* Mobile bottom sheet / Desktop centered modal */}
      <div
        className={`
          bg-white rounded-t-[20px] md:rounded-lg
          w-full md:w-auto md:max-w-5xl
          fixed bottom-0 md:relative
          h-[85vh] md:h-auto md:max-h-[90vh]
          transform transition-transform duration-300 ease-out
          overflow-y-auto
        `}
      >
        {/* Handle/Pill for mobile */}
        <div className="h-1.5 w-16 bg-gray-300 rounded-full mx-auto mt-3 mb-2 md:hidden" />
        <button
          onClick={onClose}
          className="absolute top-1 right-4 w-full text-right  px-4 py-2 text-gray-500 rounded-lg hover:text-gray-600  md:hidden"
        >
          close
        </button>

        {/* Content container */}
        <div className="overflow-y-auto h-full px-4 md:px-2 pb-safe pt-2 md:pt-6">
          {hasSponsorships && (
            <div className="flex items-center justify-end gap-2 text-sm text-blue-400 mb-2">
              <FaBullhorn className="w-4 h-4" />
              <span>Sponsorship options available</span>
            </div>
          )}

          <EventDetail
            event={event}
            onClose={onClose}
            showActions={true}
            isAdmin={isAdmin}
            hasSponsorships={hasSponsorships}
            isModal={true}
            isExternal={isExternal}
          />

          {/* collections notation */}
          {event.collections && event.collections.length > 0 && (
            <div className="mt-4 p-4 bg-white rounded-lg shadow-lg mb-4">
              <h4 className="text-lg font-bold mb-2">
                Collections ({event.collections.length})
              </h4>
              <ul className="flex flex-wrap gap-2">
                {event.collections.map((collection) => (
                  <li key={collection.id}>
                    <Link
                      href={`/collections/${collection.id}`}
                      className="inline-block px-3 py-1 border border-blue-500 rounded-full text-sm text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      {collection.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Updated component for sponsorship opportunities
const SponsorshipOpportunities = ({ events, onClose }) => {
  const sponsoredEvents = events.filter((event) => event.hasSponsorship);
  const router = useRouter();

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-400      bg-opacity-50 z-50">
      <div className=" p-8 rounded-lg text-slate-700 max-w-2xl w-full">
        {/* <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <FaBullhorn className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-2xl font-bold">
            Sponsorship Opportunities Available!
          </h3>
        </div> */}

        <div className="text-white rounded-xl p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sponsoredEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                onClick={onClose}
                className="flex items-start gap-3 p-3 bg-slate-700 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center mt-1">
                  <span className="text-xs text-blue-400">
                    <FaCalendar />
                  </span>
                </div>
                <div className="text-left">
                  <h5 className="font-medium">{event.title}</h5>
                  <p className="text-sm text-slate-400">
                    {DateTime.fromISO(
                      event.startDate.replace(" ", "T")
                    ).toFormat("MMMM d, yyyy")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-slate-700 rounded-xl font-medium 
              hover:bg-slate-700 transition-all duration-200 text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const TimeUpdateModal = ({ event, onSubmit, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center">
      <div className="max-w-md w-full">
        <TimePickerForm
          initialTime={event.time}
          initialTimezone={event.timezone}
          onSubmit={(timeData) => {
            onSubmit({
              ...event,
              ...timeData,
            });
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

// Helper function to generate Tailwind classes for calendar events
const generateEventClasses = (ev, isSearchHighlighted = false) => {
  const baseClasses = [
    "py-0.5 px-1 relative sm:py-1 sm:px-1.5",
    "overflow-hidden",
    "transition-all",
    "duration-300",
    "ease-in-out",
    "group",
  ];

  // Round corners based on multi-day position
  if (ev.isMultiDay) {
    if (ev.isStart) {
      baseClasses.push("rounded-l-lg", "ml-0", "pl-1", "sm:pl-2");
    } else if (ev.isEnd) {
      baseClasses.push("rounded-r-lg", "mr-0", "pr-1", "sm:pr-2");
    } else {
      baseClasses.push("-mx-0.5", "sm:-mx-1", "px-0", "rounded-none");
    }
  } else {
    baseClasses.push("rounded-lg", "px-1", "sm:px-2", "mx-0");
  }

  // Status-based styling
  const status = ev.status?.toLowerCase() || "pending";

  if (status === "pending") {
    baseClasses.push("opacity-80");
  } else if (status === "active") {
    baseClasses.push("opacity-100");
  } else if (status === "completed") {
    baseClasses.push("opacity-50", "relative");
  } else if (status === "archived") {
    baseClasses.push("opacity-40", "grayscale");
  } else if (status === "waiting") {
    baseClasses.push("opacity-60");
  }

  // Highlighting and dimming effects (removed scaling to prevent overflow)
  if (ev.isDimmed) {
    baseClasses.push("opacity-30", "grayscale");
  } else if (ev.isHighlighted || isSearchHighlighted) {
    baseClasses.push(
      "z-20",
      "font-medium",
      "shadow-lg",
      "ring-2",
      "ring-opacity-60"
    );
    if (isSearchHighlighted) {
      baseClasses.push("ring-yellow-400", "bg-yellow-50");
    } else if (ev.isHighlighted) {
      // Use the first tag's color for the ring effect when highlighted by tag
      baseClasses.push("ring-blue-400", "bg-blue-50/30");
    }
  }

  // Cursor and interactive states
  const isDraggable = ev.type !== "external_link";
  baseClasses.push(isDraggable ? "cursor-move" : "cursor-pointer");

  // Hover effects (when not dimmed) - removed scaling for better fit
  if (!ev.isDimmed) {
    baseClasses.push("hover:z-10");
  }

  // Remove left borders to avoid bar visuals

  // Notation events: keep italic only
  if (ev.type === "notation") {
    baseClasses.push("italic");
  }

  // Size classes - optimized for mobile
  baseClasses.push(
    "text-[7px]",
    "sm:text-[9px]",
    "md:text-xs",
    "flex",
    "items-start",
    "min-h-[18px]",
    "sm:min-h-[22px]",
    "h-auto",
    "w-full",
    "gap-0.5",
    "sm:gap-1",
    "flex-shrink-0",
    "min-w-0"
  );

  return baseClasses.join(" ");
};

// Helper function to generate inline styles for dynamic colors
const generateEventStyles = (ev, isSearchHighlighted = false) => {
  const styles = {};
  const status = ev.status?.toLowerCase() || "pending";

  if (ev.primaryColor) {
    // No background bars; use colored text only
    styles.color =
      status === "completed" ? `${ev.primaryColor}99` : ev.primaryColor;
  } else {
    styles.color = status === "completed" ? "#60a5fa" : "#3b82f6"; // blue-400/500
  }

  // Add ring effect for highlighted events using tag color
  if (ev.isHighlighted && !isSearchHighlighted) {
    // Get the first tag's color for the ring effect
    const tagColor = ev.tags?.[0]?.color || "#3b82f6";
    styles.boxShadow = `0 0 0 2px ${tagColor}40, 0 4px 6px -1px ${tagColor}20`;
    styles.backgroundColor = `${tagColor}08`;
  }

  // Add strikethrough effect for completed events
  if (status === "completed") {
    styles.textDecoration = "line-through";
    styles.textDecorationColor = "rgba(0, 0, 0, 0.3)";
  }

  return styles;
};

export default function Calendar({
  events,
  organizations,
  isAdmin,
  onExternalLinkClick,
  isExternal = false,
  onEventUpdate,
  onMonthChange,
  showPublicOnly = false,
  showGoogleCalendarEvents: showGoogleCalendarEventsProp = false, // Changed default to false (opt-in)
  showRegularEvents: showRegularEventsProp = true, // Default to true for backwards compatibility
  isCollectionContext = false, // New prop to indicate we're in a collection
  onGoogleCalendarToggle,
  onPublicOnlyToggle,
  onRegularEventsToggle,
  initialMonth = null,
  eventTypes = [],
  tags = [],
}) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(
    initialMonth || DateTime.now().startOf("month")
  );
  const [searchTerm, setSearchTerm] = useState("");

  // Sync currentMonth with initialMonth when it changes
  useEffect(() => {
    if (initialMonth && !currentMonth.equals(initialMonth)) {
      setCurrentMonth(initialMonth);
    }
  }, [initialMonth]);
  const [view, setView] = useState(() => {
    // Default to month view for events page
    return "month";
  });
  const [showSponsorships, setShowSponsorships] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [draggedEvent, setDraggedEvent] = useState(null);
  const [contextMenuEvent, setContextMenuEvent] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [timeUpdateEvent, setTimeUpdateEvent] = useState(null);
  const [showGoogleCalendarEvents, setShowGoogleCalendarEvents] = useState(
    showGoogleCalendarEventsProp
  );
  const [showPublicEventsOnly, setShowPublicEventsOnly] =
    useState(showPublicOnly);
  const [showRegularEvents, setShowRegularEvents] = useState(
    showRegularEventsProp
  );
  const [showProfessionalOnly, setShowProfessionalOnly] = useState(false);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [selectedEventTypes, setSelectedEventTypes] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");

  // Sync state with props
  useEffect(() => {
    setShowGoogleCalendarEvents(showGoogleCalendarEventsProp);
  }, [showGoogleCalendarEventsProp]);

  useEffect(() => {
    setShowPublicEventsOnly(showPublicOnly);
  }, [showPublicOnly]);

  useEffect(() => {
    setShowRegularEvents(showRegularEventsProp);
  }, [showRegularEventsProp]);

  // Handle toggle changes
  const handleGoogleCalendarToggle = (value) => {
    setShowGoogleCalendarEvents(value);
    if (onGoogleCalendarToggle) {
      onGoogleCalendarToggle(value);
    }
  };

  const handlePublicOnlyToggle = (value) => {
    setShowPublicEventsOnly(value);
    if (onPublicOnlyToggle) {
      onPublicOnlyToggle(value);
    }
  };

  const handleProfessionalOnlyToggle = (value) => {
    setShowProfessionalOnly(value);
  };

  const handleRegularEventsToggle = (value) => {
    setShowRegularEvents(value);
    if (onRegularEventsToggle) {
      onRegularEventsToggle(value);
    }
  };

  // Google Calendar integration
  const {
    integrationStatus,
    exportEventToGoogle,
    exportToGoogle,
  } = useGoogleCalendar();

  // Multi-day selection hook
  const {
    selectedDates,
    isSelecting,
    showAvailabilityComposer,
    handleDateClick: handleMultiDayClick,
    isDateSelected,
    clearSelection,
    openAvailabilityComposer,
    setShowAvailabilityComposer,
  } = useMultiDaySelection();

  // Add effect to update view on window resize
  useEffect(() => {
    const handleResize = () => {
      // Removed automatic view switching - let users control the view
    };

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [view]);

  // Callback to trigger refresh when an event is updated
  const handleEventUpdateSuccess = () => {
    // If the parent provided an update callback, call it
    if (onEventUpdate) {
      onEventUpdate();
    }
  };

  // Event updating functionality with refresh callback
  const {
    selectedEvent: dateUpdateEvent,
    isUpdateModalOpen,
    openUpdateModal,
    closeUpdateModal,
    handleUpdateDate,
    handleEventDrag,
  } = useCalendarEventUpdates(handleEventUpdateSuccess);

  // Ref for context menu
  const contextMenuRef = useRef(null);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target)
      ) {
        setContextMenuEvent(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [contextMenuRef]);

  // Handle search - navigate to first match and highlight all matches
  const [highlightedEvents, setHighlightedEvents] = useState(new Set());

  useEffect(() => {
    if (!searchTerm) {
      setHighlightedEvents(new Set());
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    const matchingEvents = events.filter(
      (event) =>
        event.title?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.organizations?.some((org) =>
          org.name?.toLowerCase().includes(searchLower)
        )
    );

    if (matchingEvents.length > 0) {
      // Navigate to the month of the first match
      const firstMatch = matchingEvents[0];
      const eventDate = DateTime.fromISO(
        firstMatch.startDate.replace(" ", "T")
      );
      setCurrentMonth(eventDate.startOf("month"));

      // Highlight all matching events
      setHighlightedEvents(new Set(matchingEvents.map((e) => e.id)));
    } else {
      setHighlightedEvents(new Set());
    }
  }, [searchTerm, events]);

  const handleDayClick = (date, e) => {
    // Check if this is a multi-day selection click
    if (e && (e.shiftKey || e.ctrlKey || e.metaKey)) {
      // Handle multi-day selection
      const luxonDate = date instanceof Date ? DateTime.fromJSDate(date) : date;
      handleMultiDayClick(luxonDate, e);
      return;
    }

    // Otherwise, proceed with normal day click behavior
    // Ensure we convert the date to a Luxon DateTime object
    const luxonDate =
      date instanceof Date ? DateTime.fromJSDate(date) : DateTime.fromISO(date);
    setCurrentMonth(luxonDate);
    setView("day");
  };

  // Handle starting drag
  const handleDragStart = (event, e) => {
    e.stopPropagation();
    setDraggedEvent(event);
    // Add dragging class for styling
    e.currentTarget.classList.add("dragging");
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add("drag-over");
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove("drag-over");
  };

  // Handle drop
  const handleDrop = (date, e) => {
    e.preventDefault();
    e.currentTarget.classList.remove("drag-over");

    if (draggedEvent) {
      handleEventDrag(draggedEvent, date);
      setDraggedEvent(null);
    }
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove("dragging");
    setDraggedEvent(null);
  };

  // Handle context menu (right click) on event
  const handleContextMenu = (event, e) => {
    e.preventDefault();
    e.stopPropagation();

    // Only allow context menu for external links and notations if user has edit permissions
    if (
      (event.type === "external_link" || event.type === "notation") &&
      isAdmin
    ) {
      setContextMenuEvent(event);
      setContextMenuPosition({ x: e.clientX, y: e.clientY });
    }
  };

  // Move this calculation here but don't return early
  const sponsoredEventsCount = events.filter(
    (event) => event.hasSponsorship
  ).length;

  const orgMap = (organizations || []).reduce((acc, org) => {
    acc[org.id] = org;
    return acc;
  }, {});

  const handleClearAllFilters = () => {
    setSelectedEventTypes([]);
    setSelectedTags([]);
    setSelectedStates([]);
    setDateFilter("all");
    setShowPublicEventsOnly(false);
    setShowProfessionalOnly(false);
  };

  // Build available states list from events
  const availableStates = Array.from(
    new Set((events || []).map((e) => e.locationState).filter(Boolean))
  )
    .sort()
    .map((s) => ({ id: s, name: s }));

  const handleNextMonth = () => {
    const newMonth = currentMonth.plus({ months: 1 });
    setCurrentMonth(newMonth);
    // Notify parent component about month change for dynamic event loading
    if (onMonthChange) {
      onMonthChange(newMonth);
    }
  };

  const handlePrevMonth = () => {
    const newMonth = currentMonth.minus({ months: 1 });
    setCurrentMonth(newMonth);
    // Notify parent component about month change for dynamic event loading
    if (onMonthChange) {
      onMonthChange(newMonth);
    }
  };

  // We will create a "grid" of 6 weeks (42 days) to show the month properly
  // Sunday-based calendar: Sunday=0, Monday=1, ..., Saturday=6
  // Luxon: Monday=1, Tuesday=2, ..., Sunday=7
  // We'll convert Luxon's weekday to Sunday=0 indexing by using (weekday % 7).

  const startOfMonth = currentMonth.startOf("month");
  const endOfMonth = currentMonth.endOf("month");

  const daysInMonth = endOfMonth.day;

  // Determine how many days to pad before the start of this month
  // Since Luxon Monday=1...Sunday=7, Sunday % 7 = 0 if Sunday.
  // Example: If month starts on Wednesday (Luxon=3),
  // (3%7)=3 means we need 3 blank spaces after Sunday start.
  const startDayIndex = startOfMonth.weekday % 7; // Sunday=0

  // We have 42 cells total (6 weeks * 7 days)
  const totalCells = 42;
  const paddingDaysBefore = startDayIndex;
  const paddingDaysAfter = totalCells - daysInMonth - paddingDaysBefore;

  // Previous month and next month references
  const prevMonth = currentMonth.minus({ months: 1 });
  const prevDaysInMonth = prevMonth.daysInMonth;

  // Build the calendar cells as an array of objects: { date: DateTime, currentMonth: boolean }
  const calendarCells = [];

  // Days from previous month
  for (let i = 0; i < paddingDaysBefore; i++) {
    const day = prevDaysInMonth - paddingDaysBefore + i + 1;
    calendarCells.push({
      date: prevMonth.set({ day }),
      isCurrentMonth: false,
    });
  }

  // Days of current month
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      date: currentMonth.set({ day: d }),
      isCurrentMonth: true,
    });
  }

  // Days from next month
  for (let i = 1; i <= paddingDaysAfter; i++) {
    calendarCells.push({
      date: currentMonth.plus({ months: 1 }).set({ day: i }),
      isCurrentMonth: false,
    });
  }

  // Map events by the day of the month (in UTC) for this particular month
  // But now we must consider that some cells belong to previous/next month.
  // We will match events by their exact day+month+year.

  const eventsByDate = {};

  // First filter events based on the toggle states, then organize by date
  let filteredEventsForCalendar = events.filter((event) => {
    // Filter out Google Calendar events if toggle is off
    if (!showGoogleCalendarEvents && event.isGoogleCalendarEvent) {
      return false;
    }

    // Filter out non-public events if public-only mode is on
    if (showPublicEventsOnly && event.visibility !== "public") {
      return false;
    }

    // Filter to professional events only when toggled
    if (showProfessionalOnly && !event.professional) {
      return false;
    }

    return true;
  });

  // Apply additional filters (types, tags, states, date range)
  const now = DateTime.now();
  filteredEventsForCalendar = filteredEventsForCalendar.filter((event) => {
    // Event Types filter
    if (selectedEventTypes.length > 0) {
      const matchesType = selectedEventTypes.some(
        (t) => Number(t.id) === Number(event.typeId)
      );
      if (!matchesType) return false;
    }

    // Tags filter
    if (selectedTags.length > 0) {
      const hasTag = event.tags?.some((tag) =>
        selectedTags.some(
          (sel) => Number(sel.id) === Number(tag.id || tag.tagId)
        )
      );
      if (!hasTag) return false;
    }

    // States filter
    if (selectedStates.length > 0) {
      const inState = selectedStates.some((s) => s.id === event.locationState);
      if (!inState) return false;
    }

    // Date filter - handle date-only, timestamp, and separate time fields
    const isDateOnly = (dateStr) => {
      if (!dateStr) return false;
      const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
      const dateOnlyWithSpace = /^\d{4}-\d{2}-\d{2}\s*$/;
      return dateOnlyPattern.test(dateStr.trim()) || dateOnlyWithSpace.test(dateStr.trim());
    };

    const combineDateAndTime = (dateStr, timeStr, timezoneStr) => {
      if (!dateStr) return null;
      const eventTimezone = timezoneStr || "UTC";
      const dateOnly = dateStr.split("T")[0];
      if (timeStr) {
        const timeOnly = timeStr.split(".")[0];
        const dateTimeStr = `${dateOnly}T${timeOnly}`;
        return DateTime.fromISO(dateTimeStr, { zone: eventTimezone });
      } else {
        return DateTime.fromISO(dateOnly, { zone: eventTimezone }).startOf("day");
      }
    };

    const eventTimezone = event.timezone || "UTC";
    const startIsDateOnly = isDateOnly(event.startDate);
    const endIsDateOnly = isDateOnly(event.endDate || event.startDate);
    const hasSeparateTimes = (event.startTime || event.endTime) && startIsDateOnly;
    
    let startDt, endDt;
    
    if (hasSeparateTimes) {
      startDt = combineDateAndTime(event.startDate, event.startTime, eventTimezone);
      endDt = combineDateAndTime(event.endDate || event.startDate, event.endTime || event.startTime, eventTimezone);
    } else if (startIsDateOnly) {
      startDt = DateTime.fromISO(event.startDate.split("T")[0], { zone: eventTimezone }).startOf("day");
    } else {
      startDt = DateTime.fromISO(event.startDate.replace(" ", "T"));
      if (startDt.isValid && startDt.zone) {
        startDt = startDt.setZone(eventTimezone);
      } else if (startDt.isValid) {
        startDt = DateTime.fromISO(event.startDate.replace(" ", "T"), { zone: eventTimezone });
      }
    }
    
    if (!hasSeparateTimes) {
      const endDateStr = event.endDate || event.startDate;
      if (endIsDateOnly) {
        endDt = DateTime.fromISO(endDateStr.split("T")[0], { zone: eventTimezone }).startOf("day");
      } else {
        endDt = DateTime.fromISO(endDateStr.replace(" ", "T"));
        if (endDt.isValid && endDt.zone) {
          endDt = endDt.setZone(eventTimezone);
        } else if (endDt.isValid) {
          endDt = DateTime.fromISO(endDateStr.replace(" ", "T"), { zone: eventTimezone });
        }
      }
    }
    
    if (!startDt.isValid || !endDt.isValid) return false;
    
    if (dateFilter === "upcoming" && !(startDt > now)) return false;
    if (dateFilter === "past" && !(endDt < now)) return false;

    return true;
  });

  filteredEventsForCalendar.forEach((event) => {
    // Helper to check if date is date-only format
    const isDateOnly = (dateStr) => {
      if (!dateStr) return false;
      const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
      const dateOnlyWithSpace = /^\d{4}-\d{2}-\d{2}\s*$/;
      return dateOnlyPattern.test(dateStr.trim()) || dateOnlyWithSpace.test(dateStr.trim());
    };

    // Helper to combine date + time + timezone (for notations with separate time fields)
    const combineDateAndTime = (dateStr, timeStr, timezoneStr) => {
      if (!dateStr) return null;
      
      const eventTimezone = timezoneStr || "UTC";
      const dateOnly = dateStr.split("T")[0]; // Extract date part
      
      if (timeStr) {
        // Combine date + time in the specified timezone
        // Time format is typically "HH:mm:ss" or "HH:mm"
        const timeOnly = timeStr.split(".")[0]; // Remove milliseconds if present
        const dateTimeStr = `${dateOnly}T${timeOnly}`;
        return DateTime.fromISO(dateTimeStr, { zone: eventTimezone });
      } else {
        // No time specified, use start of day in the timezone
        return DateTime.fromISO(dateOnly, { zone: eventTimezone }).startOf("day");
      }
    };

    const eventTimezone = event.timezone || "UTC";
    const startIsDateOnly = isDateOnly(event.startDate);
    const endIsDateOnly = isDateOnly(event.endDate || event.startDate);
    
    // Check if we have separate time fields (notations format)
    const hasSeparateTimes = (event.startTime || event.endTime) && startIsDateOnly;

    let start, end;

    if (hasSeparateTimes) {
      // Notation format: date + separate startTime/endTime fields
      start = combineDateAndTime(event.startDate, event.startTime, eventTimezone);
      end = combineDateAndTime(event.endDate || event.startDate, event.endTime || event.startTime, eventTimezone);
    } else if (startIsDateOnly) {
      // Date-only value without separate time fields
      const startISO = event.startDate.replace(" ", "T");
      start = DateTime.fromISO(startISO.split("T")[0], { zone: eventTimezone }).startOf("day");
    } else {
      // Timestamp format (events)
      const startISO = event.startDate.replace(" ", "T");
      start = DateTime.fromISO(startISO);
      if (start.isValid) {
        if (start.zone) {
          start = start.setZone(eventTimezone);
        } else {
          start = DateTime.fromISO(startISO, { zone: eventTimezone });
        }
      }
    }

    if (hasSeparateTimes) {
      // Already handled above
    } else if (endIsDateOnly) {
      // Date-only value without separate time fields
      const endISO = (event.endDate || event.startDate).replace(" ", "T");
      end = DateTime.fromISO(endISO.split("T")[0], { zone: eventTimezone }).startOf("day");
    } else {
      // Timestamp format (events)
      const endISO = (event.endDate || event.startDate).replace(" ", "T");
      end = DateTime.fromISO(endISO);
      if (end.isValid) {
        if (end.zone) {
          end = end.setZone(eventTimezone);
        } else {
          end = DateTime.fromISO(endISO, { zone: eventTimezone });
        }
      }
    }

    // Check if dates are valid
    if (!start.isValid || !end.isValid) {
      return; // Skip this event
    }

    // Handle multi-day events
    // Use the date in the event's timezone for proper day calculation
    let current = start.startOf("day");
    const endDay = end.startOf("day");
    
    while (current <= endDay) {
      // Use toISODate() which will give us the date in the event's timezone
      const eventKey = current.toISODate();
      if (!eventsByDate[eventKey]) eventsByDate[eventKey] = [];
      eventsByDate[eventKey].push({
        ...event,
        isMultiDay: !start.startOf("day").hasSame(end.startOf("day"), "day"),
        isStart: current.hasSame(start.startOf("day"), "day"),
        isEnd: current.hasSame(end.startOf("day"), "day"),
      });
      current = current.plus({ days: 1 });
    }
  });

  // Add effect to clear drag state when events are updated
  useEffect(() => {
    // Clear any ongoing drag operations when events list changes
    setDraggedEvent(null);
    setContextMenuEvent(null);
  }, [events]);

  const handleCloseModal = () => setSelectedEvent(null);

  // Add handleTimeUpdate function
  const handleTimeUpdate = (updatedEvent) => {
    if (!updatedEvent) return;

    // Use the existing handleUpdateDate from useCalendarEventUpdates
    handleUpdateDate(updatedEvent, {
      date: updatedEvent.startDate || updatedEvent.date,
      time: updatedEvent.time,
      timezone: updatedEvent.timezone,
      status: updatedEvent.status,
    });
  };

  return (
    <div className="space-y-4">
      {/* Mobile-optimized header */}
      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">
        {/* Filter controls - full width on mobile */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          {/* Google Calendar controls */}
          {/* Sync functionality removed - only export to Google Calendar is supported */}

          {/* Public events only toggle */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPublicEventsOnly}
              onChange={(e) => handlePublicOnlyToggle(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Public only</span>
          </label>

          {/* Regular events toggle - show when in collection context */}
          {isCollectionContext && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showRegularEvents}
                onChange={(e) => handleRegularEventsToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                Include Organization Events
              </span>
            </label>
          )}
        </div>

        {/* View controls and compose availability - stack on mobile */}
        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          {/* Show compose availability button when dates are selected */}
          {selectedDates.length > 0 && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-2 sm:mb-0 sm:mr-4">
              <span className="text-sm text-gray-600">
                {selectedDates.length}{" "}
                {selectedDates.length === 1 ? "day" : "days"} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={openAvailabilityComposer}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm whitespace-nowrap"
                >
                  Compose Availability
                </button>
                <button
                  onClick={clearSelection}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors text-sm"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Filters inside calendar header */}
          <div className="flex items-center gap-3 flex-wrap mb-2 sm:mb-0">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showProfessionalOnly}
                onChange={(e) => handleProfessionalOnlyToggle(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Professional only</span>
            </label>
          </div>

          {/* View buttons - responsive grid on mobile */}
          <div className="grid grid-cols-5 sm:flex gap-1 sm:gap-2">
            <button
              onClick={() => setView("month")}
              className={`px-2 sm:px-3 py-1 rounded transition-colors text-sm ${
                view === "month"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-2 sm:px-3 py-1 rounded transition-colors flex items-center justify-center gap-1 text-sm ${
                view === "list"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <FaList size={10} className="hidden sm:inline" />
              List
            </button>
            <button
              onClick={() => {
                setCurrentMonth(DateTime.now());
                setView("week");
              }}
              className={`px-2 sm:px-3 py-1 rounded transition-colors flex items-center justify-center gap-1 text-sm ${
                view === "week"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <FaClock size={10} className="hidden sm:inline" />
              Week
            </button>
            <button
              onClick={() => {
                setCurrentMonth(DateTime.now());
                setView("day");
              }}
              className={`px-2 sm:px-3 py-1 rounded transition-colors text-sm ${
                view === "day"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView("year")}
              className={`px-2 sm:px-3 py-1 rounded transition-colors text-sm ${
                view === "year"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Year
            </button>
          </div>
        </div>
      </div>

      {view === "year" ? (
        <YearView
          events={filteredEventsForCalendar}
          organizations={organizations}
          onEventClick={setSelectedEvent}
          onDayClick={handleDayClick}
        />
      ) : view === "list" ? (
        <ListView
          events={filteredEventsForCalendar}
          organizations={organizations}
          onEventClick={setSelectedEvent}
          currentMonth={currentMonth}
          onDateChange={(newMonth) => {
            setCurrentMonth(newMonth);
            if (onMonthChange) {
              onMonthChange(newMonth);
            }
          }}
          showGoogleCalendarEvents={showGoogleCalendarEvents}
          showPublicOnly={showPublicEventsOnly}
          highlightedEvents={highlightedEvents}
        />
      ) : view === "week" ? (
        <WeekView
          events={filteredEventsForCalendar}
          organizations={organizations}
          onEventClick={setSelectedEvent}
          currentDate={currentMonth.toJSDate()}
          onDateChange={(newDate) =>
            setCurrentMonth(DateTime.fromJSDate(newDate))
          }
          onDayClick={handleDayClick}
          showGoogleCalendarEvents={showGoogleCalendarEvents}
          showPublicOnly={showPublicEventsOnly}
        />
      ) : view === "day" ? (
        <DayView
          events={filteredEventsForCalendar}
          organizations={organizations}
          onEventClick={setSelectedEvent}
          currentDate={currentMonth}
          onDateChange={setCurrentMonth}
          showGoogleCalendarEvents={showGoogleCalendarEvents}
          showPublicOnly={showPublicEventsOnly}
        />
      ) : (
        <div className="p-2 sm:p-4 bg-white rounded-lg shadow relative max-w-full w-full mx-auto">
          <div className="mb-2 sm:mb-4 flex gap-2 items-center">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search events by title, description, or organization..."
              className="flex-1 px-2 py-1 sm:px-3 sm:py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchTerm && highlightedEvents.size > 0 && (
              <span className="text-xs text-gray-600">
                {highlightedEvents.size} match
                {highlightedEvents.size !== 1 ? "es" : ""}
              </span>
            )}
            {view === "month" && (
              <div className="text-xs text-gray-500 ml-2">
                <span className="hidden sm:inline">
                  Hold Shift to select multiple days
                </span>
                <span className="sm:hidden">Shift+click for multi-select</span>
              </div>
            )}
            {/* Open filters overlay button */}
            <button
              onClick={() => setIsFiltersVisible(true)}
              className="ml-auto flex items-center gap-2 px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <FaFilter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mb-2 sm:mb-4">
            <h2 className="text-lg sm:text-xl md:text-3xl font-bold text-center mb-2 sm:mb-0">
              {currentMonth.toFormat("MMMM yyyy")}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevMonth}
                className="bg-gray-200 px-3 py-1 sm:py-2 rounded hover:bg-gray-300 text-sm"
              >
                &lt;
              </button>
              <button
                onClick={handleNextMonth}
                className="bg-gray-200 px-3 py-1 sm:py-2 rounded hover:bg-gray-300 text-sm"
              >
                &gt;
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1 sm:mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center font-semibold text-gray-700 text-xs sm:text-sm"
              >
                <span className="block sm:hidden">{day.slice(0, 1)}</span>
                <span className="hidden sm:block">{day}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const cellDate = cell.date;
              const key = cellDate.toISODate();
              const dayEvents = eventsByDate[key] || [];
              const isToday = cellDate.hasSame(DateTime.now(), "day");

              // Create a unique key that includes event data to force re-rendering
              const eventsKey = dayEvents
                .map(
                  (e) => `${e.id}${e.notationId || ""}${e.date || e.startDate}`
                )
                .join("-");
              const cellKey = `${key}-${eventsKey}-${idx}`;

              const isSelected = isDateSelected(cellDate);

              // Calculate visible events (excluding mid-span multi-day events)
              const visibleEvents = dayEvents;

              return (
                <div
                  key={cellKey}
                  onClick={(e) => {
                    if (e.shiftKey || e.ctrlKey || e.metaKey) {
                      handleMultiDayClick(cellDate, e);
                    } else if (dayEvents.length > 0) {
                      setSelectedDate(cellDate);
                    }
                  }}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(cellDate, e)}
                  className={`border p-0.5 sm:p-1 h-16 sm:h-20 relative rounded flex flex-col cursor-pointer hover:bg-gray-50 ${
                    cell.isCurrentMonth ? "" : "bg-gray-50 text-gray-400"
                  } ${
                    cellDate.hasSame(DateTime.now(), "day")
                      ? "ring-2 ring-blue-200"
                      : ""
                  } ${isSelected ? "bg-blue-100 border-blue-400" : ""} ${
                    isSelecting ? "hover:bg-blue-50" : ""
                  }`}
                >
                  <div
                    className={`text-[10px] sm:text-xs font-bold mb-0.5 sm:mb-1 flex-shrink-0 hover:text-blue-500 pl-1 text-left ${
                      dayEvents.length > 0 ? "cursor-pointer" : "cursor-default"
                    }`}
                  >
                    {cellDate.day}
                  </div>
                  {/* Event count badge - only show if there are multiple VISIBLE events */}
                  {visibleEvents.length > 1 && (
                    <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 bg-blue-500 text-white rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center text-[8px] sm:text-[10px] font-bold shadow-sm z-10">
                      {visibleEvents.length}
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5 px-0.5 pt-0.5 sm:px-2 sm:pt-1 sm:pb-2 sm:gap-1 overflow-y-auto scrollbar-thin max-h-12 sm:max-h-full">
                    {dayEvents
                      .sort((a, b) => {
                        const timeA = a.startTime || a.time;
                        const timeB = b.startTime || b.time;

                        // Helper function to parse time and get minutes since midnight for sorting
                        const getTimeValueForSorting = (timeStr) => {
                          if (!timeStr) return null;

                          try {
                            // Try different time formats
                            let timeObj = DateTime.fromFormat(timeStr, "HH:mm");
                            if (!timeObj.isValid) {
                              timeObj = DateTime.fromFormat(timeStr, "h:mm a");
                            }
                            if (!timeObj.isValid) {
                              timeObj = DateTime.fromFormat(timeStr, "h:mm A");
                            }
                            if (!timeObj.isValid) {
                              timeObj = DateTime.fromFormat(timeStr, "H:mm");
                            }
                            if (!timeObj.isValid) {
                              timeObj = DateTime.fromFormat(timeStr, "h:mma");
                            }
                            if (!timeObj.isValid) {
                              timeObj = DateTime.fromFormat(timeStr, "h:mmA");
                            }
                            if (!timeObj.isValid) {
                              timeObj = DateTime.fromFormat(
                                timeStr,
                                "HH:mm:ss"
                              );
                            }
                            if (!timeObj.isValid) {
                              timeObj = DateTime.fromFormat(
                                timeStr,
                                "h:mm:ss a"
                              );
                            }

                            if (timeObj.isValid) {
                              // Return minutes since midnight for consistent sorting
                              return timeObj.hour * 60 + timeObj.minute;
                            }
                          } catch (e) {
                            // Ignore parsing errors
                          }
                          return null;
                        };

                        // If both have times, compare them properly using numeric values
                        if (timeA && timeB) {
                          const timeValueA = getTimeValueForSorting(timeA);
                          const timeValueB = getTimeValueForSorting(timeB);

                          if (timeValueA !== null && timeValueB !== null) {
                            const timeDiff = timeValueA - timeValueB;
                            if (timeDiff !== 0) return timeDiff;
                          }
                        } else if (timeA) {
                          return -1; // A has time, B doesn't
                        } else if (timeB) {
                          return 1; // B has time, A doesn't
                        }

                        // If no times or times are equal, sort by title
                        return String(a.title || "").localeCompare(
                          String(b.title || "")
                        );
                      })
                      .map((ev) => {
                        const sortedOrgs = ev.organizations
                          ? [...ev.organizations].sort(
                              (a, b) =>
                                (b.primary === true) - (a.primary === true)
                            )
                          : [];

                        const statusOption = STATUS_OPTIONS.find(
                          (s) => s.id === ev.status
                        );

                        const statusColor = statusOption?.color;

                        // Only make draggable if it's an external link or notation and user has permissions
                        // AND not a Google Calendar event
                        const isDraggable =
                          isAdmin &&
                          (ev.type === "external_link" ||
                            ev.type === "notation") &&
                          !ev.isGoogleCalendarEvent;

                        // Format time for display if available
                        let timeDisplay = "";
                        const timeStr = ev.time || ev.startTime;
                        if (timeStr) {
                          try {
                            // Handle different time formats
                            if (timeStr.includes(":")) {
                              const [hours, minutes] = timeStr
                                .split(":")
                                .map((n) => parseInt(n, 10));
                              if (!isNaN(hours)) {
                                const hour = hours;
                                const ampm = hour >= 12 ? "pm" : "am";
                                const hour12 = hour % 12 || 12;
                                const mins = (minutes || 0)
                                  .toString()
                                  .padStart(2, "0");
                                timeDisplay = `${hour12}:${mins}${ampm}`;
                              }
                            } else {
                              timeDisplay = timeStr;
                            }
                          } catch (e) {
                            // Fallback if time parsing fails
                            timeDisplay = timeStr;
                          }
                        }

                        // Add a user-friendly tooltip message
                        const tooltipInfo = isDraggable
                          ? "Drag to reschedule"
                          : "Click for details";

                        return (
                          <button
                            key={ev.id + (ev.notationId || "")}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEvent(ev);
                            }}
                            onContextMenu={(e) => handleContextMenu(ev, e)}
                            draggable={isDraggable}
                            onDragStart={(e) =>
                              isDraggable && handleDragStart(ev, e)
                            }
                            onDragEnd={handleDragEnd}
                            title={tooltipInfo}
                            className={generateEventClasses(
                              ev,
                              highlightedEvents.has(ev.id)
                            )}
                            style={generateEventStyles(
                              ev,
                              highlightedEvents.has(ev.id)
                            )}
                          >
                            {/* Google Calendar indicator or export button */}
                            {ev.isGoogleCalendarEvent ? (
                              <div className="absolute top-0 right-0 sm:top-0.5 sm:right-0.5">
                                <FaGoogle
                                  size={6}
                                  className="text-blue-500 sm:w-2 sm:h-2"
                                />
                              </div>
                            ) : (
                              !ev.isGoogleCalendarEvent && (
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    let entityType = "event";
                                    let entityId = ev.id;

                                    if (ev.type === "external_link") {
                                      entityType = "external_link";
                                    } else if (ev.type === "notation") {
                                      entityType = "notation";
                                      // Extract the actual notation ID from compound IDs like "eventId-notation-notationId"
                                      if (ev.notationId) {
                                        entityId = ev.notationId;
                                      } else if (
                                        ev.id &&
                                        ev.id.includes("-notation-")
                                      ) {
                                        // Extract notation ID from compound ID
                                        const parts = ev.id.split("-notation-");
                                        entityId = parts[1] || ev.id;
                                      } else {
                                        entityId = ev.id;
                                      }
                                    }

                                    const success = await exportToGoogle(
                                      entityType,
                                      entityId,
                                      ev
                                    );
                                    if (success && onEventUpdate) {
                                      onEventUpdate();
                                    }
                                  }}
                                  className="absolute top-0 right-0 sm:top-0.5 sm:right-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                  title="Export to Google Calendar"
                                >
                                  <FaUpload
                                    size={6}
                                    className="text-gray-400 hover:text-blue-500 sm:w-2 sm:h-2"
                                  />
                                </button>
                              )
                            )}
                            {/* Status indicator for completed events */}
                            {ev.status?.toLowerCase() === "completed" && (
                              <div className="absolute top-0 left-0 sm:top-0.5 sm:left-0.5 text-white text-[6px] sm:text-[8px] font-bold leading-none">
                                ✓
                              </div>
                            )}

                            {/* Multi-tag indicator dot for events with multiple tags */}
                            {ev.hasMultipleTags &&
                              ev.tagColors &&
                              ev.tagColors.length > 1 &&
                              !ev.isGoogleCalendarEvent && (
                                <div className="absolute top-0 right-0 sm:top-0.5 sm:right-0.5 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/80 rounded-full border border-black/10" />
                              )}

                            {/* Render content for multi-day spans only on START and END days; hide mids */}
                            {ev.isMultiDay ? (
                              ev.isStart || ev.isEnd ? (
                                <>
                                  {statusColor && (
                                    <div
                                      className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0 ${statusColor}`}
                                    />
                                  )}
                                  {timeDisplay && (
                                    <span className="text-[6px] sm:text-[8px] md:text-[9px] font-medium mr-0.5 sm:mr-1">
                                      {timeDisplay}
                                    </span>
                                  )}
                                  <div className="flex-grow leading-tight min-w-0">
                                    <div
                                      className="font-medium"
                                      style={{
                                        display: "-webkit-box",
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: "vertical",
                                        overflow: "hidden",
                                      }}
                                    >
                                      {ev.title}
                                    </div>
                                    {sortedOrgs && sortedOrgs.length > 0 && (
                                      <div className="text-[10px] text-gray-500 truncate">
                                        {sortedOrgs[0].name}
                                      </div>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span className="sr-only">{ev.title}</span>
                                  <div
                                    aria-hidden="true"
                                    className="mt-1 h-1.5 w-full rounded-full bg-current opacity-20"
                                  />
                                </>
                              )
                            ) : (
                              <>
                                {ev.type === "external_link" ? (
                                  <div className="flex items-center gap-1 justify-between w-full">
                                    <div className="flex items-center gap-1 truncate">
                                      <div
                                        className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0 ${statusColor}`}
                                      />
                                      {timeDisplay && (
                                        <span className="text-[6px] sm:text-[8px] md:text-[9px] font-medium mr-0.5 sm:mr-1">
                                          {timeDisplay}
                                        </span>
                                      )}
                                      <span className="truncate">
                                        {ev.type === "notation"
                                          ? ev.notationTitle ||
                                            ev.title ||
                                            ev.name
                                          : ev.title || ev.name}
                                      </span>
                                    </div>
                                    {/* Multi-tag indicator */}
                                    {ev.hasMultipleTags &&
                                      ev.tagColors &&
                                      ev.tagColors.length > 1 && (
                                        <div className="hidden sm:flex gap-0.5 ml-1">
                                          {ev.tagColors
                                            .slice(0, 3)
                                            .map((color, idx) => (
                                              <div
                                                key={idx}
                                                className="w-1 h-1 rounded-full"
                                                style={{
                                                  backgroundColor: color,
                                                }}
                                              />
                                            ))}
                                        </div>
                                      )}
                                  </div>
                                ) : (
                                  <>
                                    {statusColor && (
                                      <div
                                        className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full flex-shrink-0 ${statusColor}`}
                                      />
                                    )}
                                    {timeDisplay && (
                                      <span className="text-[6px] sm:text-[8px] md:text-[9px] font-medium mr-0.5 sm:mr-1">
                                        {timeDisplay}
                                      </span>
                                    )}
                                    <div className="flex-grow leading-tight min-w-0">
                                      <div
                                        className="font-medium"
                                        style={{
                                          display: "-webkit-box",
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: "vertical",
                                          overflow: "hidden",
                                        }}
                                      >
                                        {ev.type === "notation"
                                          ? ev.notationTitle || ev.title
                                          : ev.title}
                                      </div>
                                      {sortedOrgs && sortedOrgs.length > 0 && (
                                        <div className="text-[10px] text-gray-500 truncate">
                                          {sortedOrgs[0].name}
                                        </div>
                                      )}
                                    </div>
                                    {/* Multi-tag indicator for regular events */}
                                    {ev.hasMultipleTags &&
                                      ev.tagColors &&
                                      ev.tagColors.length > 1 && (
                                        <div className="hidden sm:flex gap-0.5 ml-1">
                                          {ev.tagColors
                                            .slice(0, 3)
                                            .map((color, idx) => (
                                              <div
                                                key={idx}
                                                className="w-1 h-1 rounded-full"
                                                style={{
                                                  backgroundColor: color,
                                                }}
                                              />
                                            ))}
                                        </div>
                                      )}
                                  </>
                                )}
                              </>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters Drawer (right side) */}
      {/* Backdrop */}
      {isFiltersVisible && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsFiltersVisible(false)}
        />
      )}
      {/* Drawer */}
      <div
        className={`fixed right-0 top-24 md:top-28 bottom-0 w-full sm:w-80 md:w-96 bg-white border-l border-gray-200 z-50 transform transition-transform duration-300 flex flex-col ${
          isFiltersVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Filters</h3>
            <button
              onClick={() => setIsFiltersVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="space-y-6">
            {/* Date Filter */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Date Range</h3>
              <div className="space-y-2">
                {[
                  { id: "all", name: "All Events" },
                  { id: "upcoming", name: "Upcoming Events" },
                  { id: "past", name: "Past Events" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setDateFilter(option.id)}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 ${
                      dateFilter === option.id ? "bg-blue-50 text-blue-600" : ""
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Types Filter */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Event Types</h3>
              <MultiSelect
                options={eventTypes}
                value={selectedEventTypes}
                onChange={setSelectedEventTypes}
                placeholder="Select types..."
                chipClassName="bg-blue-100 text-blue-800"
              />
            </div>

            {/* Tags Filter */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
              <MultiSelect
                options={tags}
                value={selectedTags}
                onChange={setSelectedTags}
                placeholder="Select tags..."
                chipClassName="bg-green-100 text-green-800"
              />
            </div>

            {/* States Filter */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">States</h3>
              <MultiSelect
                options={availableStates}
                value={selectedStates}
                onChange={setSelectedStates}
                placeholder="Select states..."
                chipClassName="bg-purple-100 text-purple-800"
              />
            </div>

            {/* Public/Professional toggles */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPublicEventsOnly}
                  onChange={(e) => handlePublicOnlyToggle(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Public only</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showProfessionalOnly}
                  onChange={(e) =>
                    handleProfessionalOnlyToggle(e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Professional only</span>
              </label>
            </div>
          </div>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex justify-between">
          <button
            onClick={() => {
              handleClearAllFilters();
              setIsFiltersVisible(false);
            }}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Clear all
          </button>
          <button
            onClick={() => setIsFiltersVisible(false)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Long Running Events list similar to PDF */}
      {view === "month" &&
        (() => {
          // Collect long-running events overlapping this month (>14 days)
          const monthStart = currentMonth.startOf("month");
          const monthEnd = currentMonth.endOf("month");
          const longEvents = filteredEventsForCalendar.filter((event) => {
            // Helper to check if date is date-only
            const isDateOnly = (dateStr) => {
              if (!dateStr) return false;
              const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
              const dateOnlyWithSpace = /^\d{4}-\d{2}-\d{2}\s*$/;
              return dateOnlyPattern.test(dateStr.trim()) || dateOnlyWithSpace.test(dateStr.trim());
            };

            const combineDateAndTime = (dateStr, timeStr, timezoneStr) => {
              if (!dateStr) return null;
              const eventTimezone = timezoneStr || "UTC";
              const dateOnly = dateStr.split("T")[0];
              if (timeStr) {
                const timeOnly = timeStr.split(".")[0];
                const dateTimeStr = `${dateOnly}T${timeOnly}`;
                return DateTime.fromISO(dateTimeStr, { zone: eventTimezone });
              } else {
                return DateTime.fromISO(dateOnly, { zone: eventTimezone }).startOf("day");
              }
            };

            const eventTimezone = event.timezone || "UTC";
            const startIsDateOnly = isDateOnly(event.startDate);
            const endIsDateOnly = isDateOnly(event.endDate || event.startDate);
            const hasSeparateTimes = (event.startTime || event.endTime) && startIsDateOnly;
            
            let start, end;
            
            if (hasSeparateTimes) {
              start = combineDateAndTime(event.startDate, event.startTime, eventTimezone);
              end = combineDateAndTime(event.endDate || event.startDate, event.endTime || event.startTime, eventTimezone);
            } else if (startIsDateOnly) {
              start = DateTime.fromISO(event.startDate.split("T")[0], { zone: eventTimezone }).startOf("day");
            } else {
              start = DateTime.fromISO(event.startDate.replace(" ", "T"));
              if (start.isValid) {
                if (start.zone) {
                  start = start.setZone(eventTimezone);
                } else {
                  start = DateTime.fromISO(event.startDate.replace(" ", "T"), { zone: eventTimezone });
                }
              }
            }
            
            if (!hasSeparateTimes) {
              const endDateStr = event.endDate || event.startDate;
              if (endIsDateOnly) {
                end = DateTime.fromISO(endDateStr.split("T")[0], { zone: eventTimezone }).startOf("day");
              } else {
                end = DateTime.fromISO(endDateStr.replace(" ", "T"));
                if (end.isValid) {
                  if (end.zone) {
                    end = end.setZone(eventTimezone);
                  } else {
                    end = DateTime.fromISO(endDateStr.replace(" ", "T"), { zone: eventTimezone });
                  }
                }
              }
            }
            
            if (!start.isValid || !end.isValid) return false;
            const duration = end.diff(start, "days").days;
            const overlaps =
              (start >= monthStart && start <= monthEnd) ||
              (end >= monthStart && end <= monthEnd) ||
              (start < monthStart && end > monthEnd);
            return duration > 14 && overlaps;
          });

          if (longEvents.length === 0) return null;

          const getOrgName = (ev) => {
            const first = ev.organizations?.[0];
            if (!first) return null;
            if (typeof first === "string")
              return organizations?.find((o) => o.id === first)?.name || null;
            return first.name || null;
          };

          return (
            <div className="mt-3 sm:mt-4 p-3 sm:p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-900 font-semibold mb-2 text-sm sm:text-base">
                <FaClock className="text-blue-600" />
                <span>Long Running Events (2+ weeks)</span>
              </div>
              <div className="grid gap-2">
                {longEvents.map((ev) => {
                  // Helper to check if date is date-only
                  const isDateOnly = (dateStr) => {
                    if (!dateStr) return false;
                    const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;
                    const dateOnlyWithSpace = /^\d{4}-\d{2}-\d{2}\s*$/;
                    return dateOnlyPattern.test(dateStr.trim()) || dateOnlyWithSpace.test(dateStr.trim());
                  };

                  const combineDateAndTime = (dateStr, timeStr, timezoneStr) => {
                    if (!dateStr) return null;
                    const eventTimezone = timezoneStr || "UTC";
                    const dateOnly = dateStr.split("T")[0];
                    if (timeStr) {
                      const timeOnly = timeStr.split(".")[0];
                      const dateTimeStr = `${dateOnly}T${timeOnly}`;
                      return DateTime.fromISO(dateTimeStr, { zone: eventTimezone });
                    } else {
                      return DateTime.fromISO(dateOnly, { zone: eventTimezone }).startOf("day");
                    }
                  };

                  const eventTimezone = ev.timezone || "UTC";
                  const startIsDateOnly = isDateOnly(ev.startDate);
                  const endIsDateOnly = isDateOnly(ev.endDate || ev.startDate);
                  const hasSeparateTimes = (ev.startTime || ev.endTime) && startIsDateOnly;
                  
                  let start, end;
                  
                  if (hasSeparateTimes) {
                    start = combineDateAndTime(ev.startDate, ev.startTime, eventTimezone);
                    end = combineDateAndTime(ev.endDate || ev.startDate, ev.endTime || ev.startTime, eventTimezone);
                  } else if (startIsDateOnly) {
                    start = DateTime.fromISO(ev.startDate.split("T")[0], { zone: eventTimezone }).startOf("day");
                  } else {
                    start = DateTime.fromISO(ev.startDate.replace(" ", "T"));
                    if (start.isValid) {
                      if (start.zone) {
                        start = start.setZone(eventTimezone);
                      } else {
                        start = DateTime.fromISO(ev.startDate.replace(" ", "T"), { zone: eventTimezone });
                      }
                    }
                  }
                  
                  if (!hasSeparateTimes) {
                    const endDateStr = ev.endDate || ev.startDate;
                    if (endIsDateOnly) {
                      end = DateTime.fromISO(endDateStr.split("T")[0], { zone: eventTimezone }).startOf("day");
                    } else {
                      end = DateTime.fromISO(endDateStr.replace(" ", "T"));
                      if (end.isValid) {
                        if (end.zone) {
                          end = end.setZone(eventTimezone);
                        } else {
                          end = DateTime.fromISO(endDateStr.replace(" ", "T"), { zone: eventTimezone });
                        }
                      }
                    }
                  }
                  
                  const orgName = getOrgName(ev);
                  const duration = Math.max(
                    1,
                    Math.ceil(end.diff(start, "days").days)
                  );
                  return (
                    <div
                      key={ev.id}
                      className="bg-white rounded-md p-2 border border-blue-100"
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {ev.title}
                      </div>
                      {orgName && (
                        <div className="text-xs text-gray-500">{orgName}</div>
                      )}
                      <div className="text-xs text-gray-500 mt-0.5">
                        {start.toFormat("MMM d")} -{" "}
                        {end.toFormat("MMM d, yyyy")}{" "}
                        <span className="text-blue-600">({duration} days)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      {showSponsorships && (
        <SponsorshipOpportunities
          events={events}
          onClose={() => setShowSponsorships(false)}
        />
      )}

      {/* Context Menu */}
      {contextMenuEvent && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
          style={{
            top: `${contextMenuPosition.y}px`,
            left: `${contextMenuPosition.x}px`,
          }}
        >
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
            onClick={() => {
              openUpdateModal(contextMenuEvent);
              setContextMenuEvent(null);
            }}
          >
            <FaEdit size={14} />
            <span>Update Date</span>
          </button>

          {/* Add time update option */}
          <button
            className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
            onClick={() => {
              setTimeUpdateEvent(contextMenuEvent);
              setContextMenuEvent(null);
            }}
          >
            <FaClock size={14} />
            <span>Set Time</span>
          </button>

          {/* Google Calendar export option */}
          {!contextMenuEvent.isGoogleCalendarEvent && (
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                onClick={async () => {
                  // Determine entity type based on the event object
                  let entityType = "event";
                  let entityId = contextMenuEvent.id;

                  if (contextMenuEvent.type === "external_link") {
                    entityType = "external_link";
                  } else if (contextMenuEvent.type === "notation") {
                    entityType = "notation";
                    // Extract the actual notation ID from compound IDs
                    if (contextMenuEvent.notationId) {
                      entityId = contextMenuEvent.notationId;
                    } else if (
                      contextMenuEvent.id &&
                      contextMenuEvent.id.includes("-notation-")
                    ) {
                      // Extract notation ID from compound ID like "eventId-notation-notationId"
                      const parts = contextMenuEvent.id.split("-notation-");
                      entityId = parts[1] || contextMenuEvent.id;
                    } else {
                      entityId = contextMenuEvent.id;
                    }
                  }

                  const success = await exportToGoogle(entityType, entityId, contextMenuEvent);
                  if (success && onEventUpdate) {
                    onEventUpdate();
                  }
                  setContextMenuEvent(null);
                }}
              >
                <FaUpload size={14} className="text-blue-500" />
                <span>Export to Google Calendar</span>
              </button>
            )}
        </div>
      )}

      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          events={events}
          onClose={handleCloseModal}
          isAdmin={isAdmin}
          hasSponsorships={selectedEvent.hasSponsorship}
          onExternalLinkClick={onExternalLinkClick}
          isExternal={isExternal}
        />
      )}

      {selectedDate && (
        <DateEventsModal
          date={selectedDate}
          events={eventsByDate[selectedDate.toISODate()] || []}
          onEventClick={setSelectedEvent}
          onClose={() => setSelectedDate(null)}
          isExternal={isExternal}
        />
      )}

      {/* Add Time Update Modal */}
      {timeUpdateEvent && (
        <TimeUpdateModal
          event={timeUpdateEvent}
          onSubmit={handleTimeUpdate}
          onClose={() => setTimeUpdateEvent(null)}
        />
      )}

      {/* Availability Composer Modal */}
      {showAvailabilityComposer && (
        <AvailabilityComposer
          selectedDates={selectedDates}
          onClose={() => setShowAvailabilityComposer(false)}
          allEvents={events}
        />
      )}

      {/* Add some styling for drag interactions */}
      <style jsx global>{`
        .dragging {
          opacity: 0.5;
          cursor: grabbing !important;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1) !important;
        }
        .drag-over {
          background-color: #e6f7ff !important;
          border: 2px dashed #1890ff !important;
          position: relative;
        }
        .drag-over::after {
          content: "Drop to reschedule";
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 9px;
          color: #1890ff;
          font-weight: 500;
          background-color: rgba(255, 255, 255, 0.8);
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
