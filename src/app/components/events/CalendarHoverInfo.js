"use client";

import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import {
  FaCalendar,
  FaCheck,
  FaArrowRight,
  FaTimes,
  FaClock,
  FaList,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import { useCalendarEventUpdates } from "@/app/hooks/useCalendarUpdates";
import CalendarView, { hasTimeInfo, formatTimeDisplay } from "./CalendarView";
import NotationDetail from "../details/NotationDetail";

const CalendarHoverInfo = ({ events, onClose, isSharedView = false }) => {
  const router = useRouter();
  const [todayEvents, setTodayEvents] = useState([]);
  const [showNotations, setShowNotations] = useState(true);
  const [viewMode, setViewMode] = useState("list"); // "list" or "calendar"
  const [selectedNotation, setSelectedNotation] = useState(null);
  const [showNotationDetail, setShowNotationDetail] = useState(false);
  const today = DateTime.now().startOf("day");

  // Get calendar event update functionality
  const { handleUpdateDate } = useCalendarEventUpdates(() => {
    // Refresh today's events after update
    filterTodayEvents();
  });

  // Effect to filter events on initial load and when events or showNotations change
  useEffect(() => {
    filterTodayEvents();
  }, [events, showNotations]);

  // Enhanced time parsing function
  const parseEventTime = (event) => {
    const timeStr = event.startTime || event.time;
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
        timeObj = DateTime.fromFormat(timeStr, "HH:mm:ss");
      }
      if (!timeObj.isValid) {
        timeObj = DateTime.fromFormat(timeStr, "h:mm:ss a");
      }

      return timeObj.isValid ? timeObj : null;
    } catch (e) {
      return null;
    }
  };

  // Helper function to get time value for sorting
  const getTimeValueForSorting = (event) => {
    const timeObj = parseEventTime(event);
    if (timeObj) {
      // Return minutes since midnight for consistent sorting
      return timeObj.hour * 60 + timeObj.minute;
    }
    return null;
  };

  // Enhanced time display function - use the existing formatTimeDisplay from CalendarView
  const formatPremiumTime = (event) => {
    // First try the existing formatTimeDisplay function
    const existingFormat = formatTimeDisplay(event);
    if (existingFormat) {
      return existingFormat;
    }

    // Fallback to our custom parsing if the existing function doesn't work
    const startTime = parseEventTime(event);
    const endTimeStr = event.endTime;

    if (!startTime) return null;

    let timeDisplay = startTime.toFormat("h:mm a");

    if (endTimeStr) {
      try {
        let endTime = DateTime.fromFormat(endTimeStr, "HH:mm");
        if (!endTime.isValid) {
          endTime = DateTime.fromFormat(endTimeStr, "h:mm a");
        }
        if (!endTime.isValid) {
          endTime = DateTime.fromFormat(endTimeStr, "h:mm A");
        }

        if (endTime.isValid) {
          timeDisplay += ` - ${endTime.toFormat("h:mm a")}`;
        }
      } catch (e) {
        // If end time parsing fails, just show start time
      }
    }

    return timeDisplay;
  };

  // Update function signature to accept custom events
  const filterTodayEvents = (customEvents = null) => {
    const eventsToProcess = customEvents || events;
    if (!eventsToProcess || !eventsToProcess.length) return [];

    const filtered = eventsToProcess.filter((event) => {
      // Handle different possible date formats
      const rawDate = event.startDate || event.date;
      if (!rawDate) return false;

      // Try to parse the date in different formats
      let eventDate;
      try {
        // First try ISO format
        eventDate = DateTime.fromISO(rawDate);

        // If not valid, try different format
        if (!eventDate.isValid) {
          eventDate = DateTime.fromFormat(rawDate, "MM/dd/yyyy");
        }

        // Try yyyy-MM-dd format
        if (!eventDate.isValid) {
          eventDate = DateTime.fromFormat(rawDate, "yyyy-MM-dd");
        }

        // Try parsing just the date part if it has time appended
        if (!eventDate.isValid && rawDate.includes(" ")) {
          const datePart = rawDate.split(" ")[0];
          eventDate = DateTime.fromISO(datePart);
        }
      } catch (e) {
        console.error("Error parsing date:", rawDate, e);
        return false;
      }

      // Only include notations if showNotations is true
      if (event.type === "notation" && !showNotations) {
        return false;
      }

      const sameDay = eventDate.hasSame(today, "day");
      return sameDay;
    });

    // If no events today, show next few upcoming events
    if (filtered.length === 0) {
      const upcomingEvents = eventsToProcess
        .filter((event) => {
          const rawDate = event.startDate || event.date;
          if (!rawDate) return false;

          // Only include notations if showNotations is true
          if (event.type === "notation" && !showNotations) {
            return false;
          }

          let eventDate;
          try {
            eventDate = DateTime.fromISO(rawDate);
            if (!eventDate.isValid) {
              eventDate = DateTime.fromFormat(rawDate, "MM/dd/yyyy");
            }
            if (!eventDate.isValid) {
              eventDate = DateTime.fromFormat(rawDate, "yyyy-MM-dd");
            }
            if (!eventDate.isValid && rawDate.includes(" ")) {
              const datePart = rawDate.split(" ")[0];
              eventDate = DateTime.fromISO(datePart);
            }
          } catch (e) {
            return false;
          }

          // Show events from today onwards (including future events)
          return eventDate >= today;
        })
        .sort((a, b) => {
          // Sort by date ascending
          const dateA =
            DateTime.fromISO(a.startDate || a.date) ||
            DateTime.fromFormat(a.startDate || a.date, "MM/dd/yyyy");
          const dateB =
            DateTime.fromISO(b.startDate || b.date) ||
            DateTime.fromFormat(b.startDate || b.date, "MM/dd/yyyy");
          return dateA - dateB;
        })
        .slice(0, 5); // Show next 5 upcoming events

      setTodayEvents(upcomingEvents);
      return upcomingEvents;
    }

    // Enhanced event preparation
    const enhancedEvents = filtered.map((event) => {
      // Create a copy with all properties
      const enhanced = { ...event };
      return enhanced;
    });

    // Enhanced sorting: prioritize by time first, then by status
    const sortedEvents = enhancedEvents.sort((a, b) => {
      // Use the existing hasTimeInfo function to check if events have time
      const aHasTime = hasTimeInfo(a);
      const bHasTime = hasTimeInfo(b);

      // Events with time come before events without time
      if (aHasTime && !bHasTime) return -1;
      if (!aHasTime && bHasTime) return 1;

      // If both have time, sort by actual time value
      if (aHasTime && bHasTime) {
        const timeA = getTimeValueForSorting(a);
        const timeB = getTimeValueForSorting(b);

        if (timeA !== null && timeB !== null) {
          const timeDiff = timeA - timeB;
          if (timeDiff !== 0) return timeDiff;
        }
      }

      // If times are equal or both don't have times, sort by status priority
      const statusA = a.status?.toLowerCase() || "pending";
      const statusB = b.status?.toLowerCase() || "pending";

      // Define priority order (lower number = higher priority)
      const priorityMap = {
        pending: 1,
        in_progress: 1,
        active: 1,
        waiting: 2,
        completed: 3,
        cancelled: 3,
      };

      const priorityA = priorityMap[statusA] || 1;
      const priorityB = priorityMap[statusB] || 1;

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // If same priority, sort by title/name alphabetically
      const titleA = String(a.title || a.name || "");
      const titleB = String(b.title || b.name || "");
      return titleA.localeCompare(titleB);
    });

    setTodayEvents(sortedEvents);
    return sortedEvents;
  };

  // Mark item as complete
  const markAsComplete = (event, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (event.type === "external_link" || event.type === "notation") {
      // Update the event status to completed
      handleUpdateDate(event, {
        date: event.startDate || event.date,
        status: "completed",
      });
    }
  };

  // Reschedule item to tomorrow
  const moveTomorrow = (event, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (event.type === "external_link" || event.type === "notation") {
      const tomorrow = today.plus({ days: 1 }).toISODate();
      handleUpdateDate(event, tomorrow);
    }
  };

  // Navigate to the item
  const goToItem = (event, e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    // If it's a notation, show the modal instead of navigating
    if (event.type === "notation") {
      setSelectedNotation(event);
      setShowNotationDetail(true);
      return;
    }

    if (isSharedView) {
      // For shared view, we need to handle navigation differently
      if (event.type === "external_link") {
        // Get email from localStorage for shared links
        const storedEmail = localStorage.getItem("shared-links-email");
        const emailParam = storedEmail
          ? `&email=${encodeURIComponent(storedEmail)}`
          : "";
        const currentUrl = new URL(window.location.href);
        const token = currentUrl.searchParams.get("token");
        if (token) {
          window.open(
            `/shared/${event.id}?token=${token}${emailParam}`,
            "_blank"
          );
        }
      } else if (event.type === "resource") {
        // For resources, we might need to handle differently in shared view
        const currentUrl = new URL(window.location.href);
        const token = currentUrl.searchParams.get("token");
        if (token) {
          // Get email from localStorage for shared links
          const storedEmail = localStorage.getItem("shared-links-email");
          const emailParam = storedEmail
            ? `&email=${encodeURIComponent(storedEmail)}`
            : "";
          window.open(
            `/shared/${event.id}?token=${token}${emailParam}`,
            "_blank"
          );
        }
      }
    } else {
      // For regular dashboard view, navigate to the appropriate route
      if (event.type === "external_link") {
        // For external links, navigate to external-links route
        window.open(`/external-links/${event.id}`, "_blank");
      } else if (event.type === "resource") {
        window.open(`/resources/${event.id}`, "_blank");
      } else if (event.type === "event") {
        window.open(`/events/${event.id}`, "_blank");
      } else if (event.type === "collection") {
        window.open(`/collections/${event.id}`, "_blank");
      }
    }

    // Don't close the popup immediately to allow the new tab to open
    // onClose();
  };

  // Count notation events
  const notationCount = events
    ? events.filter((event) => {
        if (event.type !== "notation") return false;

        // Use the same date parsing logic as filterTodayEvents
        const rawDate = event.startDate || event.date;
        if (!rawDate) return false;

        let eventDate;
        try {
          eventDate = DateTime.fromISO(rawDate);
          if (!eventDate.isValid) {
            eventDate = DateTime.fromFormat(rawDate, "MM/dd/yyyy");
          }
        } catch (e) {
          return false;
        }

        return eventDate.hasSame(today, "day");
      }).length
    : 0;

  // Check if we're showing today's events or upcoming events
  const isShowingTodayEvents =
    todayEvents.length > 0 &&
    todayEvents.some((event) => {
      const rawDate = event.startDate || event.date;
      if (!rawDate) return false;

      let eventDate;
      try {
        eventDate = DateTime.fromISO(rawDate);
        if (!eventDate.isValid) {
          eventDate = DateTime.fromFormat(rawDate, "MM/dd/yyyy");
        }
        if (!eventDate.isValid && rawDate.includes(" ")) {
          const datePart = rawDate.split(" ")[0];
          eventDate = DateTime.fromISO(datePart);
        }
      } catch (e) {
        return false;
      }

      return eventDate.hasSame(today, "day");
    });

  const headerTitle = isShowingTodayEvents
    ? "Today's Calendar"
    : "Upcoming Events";

  if (todayEvents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-4 w-80">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700 flex items-center">
            <FaCalendar className="mr-2 text-blue-500" />
            Today&apos;s Calendar
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>

        {/* Notation toggle */}
        {notationCount > 0 && (
          <div className="flex items-center justify-between mb-3 bg-gray-50 p-2 rounded">
            <span className="text-xs text-gray-500">Show notations</span>
            <button
              onClick={() => setShowNotations(!showNotations)}
              className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-300 ${
                showNotations
                  ? "bg-blue-300 border border-blue-500"
                  : "bg-gray-200"
              }`}
              aria-label={`${showNotations ? "Hide" : "Show"} notations`}
            >
              <span
                className={`inline-block h-2 w-2 transform rounded-full bg-white transition-transform shadow-sm ${
                  showNotations ? "translate-x-3" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        )}

        <p className="text-gray-500 text-sm py-4 text-center">
          No events scheduled for today
        </p>
      </div>
    );
  }

  return (
    <div
      className="bg-white rounded-lg shadow-lg p-4 w-full sm:w-80 md:w-96 max-h-[70vh] overflow-y-auto"
      onClick={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-700 flex items-center">
          <FaCalendar className="mr-2 text-blue-500" />
          {headerTitle} ({todayEvents.length})
        </h3>
        <div className="flex items-center gap-2">
          {/* View toggle buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1 rounded-md ${
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              aria-label="List view"
              title="List view"
            >
              <FaList size={14} />
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`p-1 rounded-md ${
                viewMode === "calendar"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              aria-label="Calendar view"
              title="Calendar view"
            >
              <FaCalendar size={14} />
            </button>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600 p-2 -mr-2"
            aria-label="Close calendar"
          >
            <FaTimes size={16} />
          </button>
        </div>
      </div>

      {/* Notation toggle */}
      {notationCount > 0 && (
        <div
          className="flex items-center justify-between mb-3 bg-gray-50 p-3 rounded"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-xs text-gray-500">
            Show notations ({notationCount})
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNotations(!showNotations);
            }}
            className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-1 focus:ring-blue-300 ${
              showNotations
                ? "bg-blue-300 border border-blue-500"
                : "bg-gray-200"
            }`}
            aria-label={`${showNotations ? "Hide" : "Show"} notations`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                showNotations ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      )}

      {/* Premium List View */}
      {viewMode === "list" && (
        <div className="space-y-2">
          {todayEvents.map((event) => {
            // Determine if event is completed, waiting, or cancelled
            const status = event.status?.toLowerCase() || "pending";
            const isCompleted = status === "completed";
            const isWaiting = status === "waiting";
            const isCancelled = status === "cancelled";
            const isLowPriority = isCompleted || isWaiting || isCancelled;

            // Get premium formatted time
            const premiumTime = formatPremiumTime(event);
            const hasTime = hasTimeInfo(event) && !!premiumTime;

            // Get event date for display
            const rawDate = event.startDate || event.date;
            let eventDateDisplay = null;
            if (rawDate && !isShowingTodayEvents) {
              try {
                let eventDate = DateTime.fromISO(rawDate);
                if (!eventDate.isValid) {
                  eventDate = DateTime.fromFormat(rawDate, "MM/dd/yyyy");
                }
                if (!eventDate.isValid && rawDate.includes(" ")) {
                  const datePart = rawDate.split(" ")[0];
                  eventDate = DateTime.fromISO(datePart);
                }
                if (eventDate.isValid) {
                  eventDateDisplay = eventDate.toFormat("MMM dd, yyyy");
                }
              } catch (e) {
                // Ignore date parsing errors for display
              }
            }

            return (
              <div
                key={event.id + (event.notationId || "")}
                className={`group relative bg-white border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-md transition-all duration-200 ${
                  isLowPriority ? "opacity-60" : ""
                }`}
                onClick={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="p-4">
                  {/* Date Display for upcoming events */}
                  {eventDateDisplay && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                        {eventDateDisplay}
                      </span>
                    </div>
                  )}
                  {/* Header with time and actions */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Time Display - Prominent */}
                      {hasTime ? (
                        <div className="flex-shrink-0 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1 min-w-[100px]">
                          <div className="flex items-center gap-1.5">
                            <FaClock className="text-blue-600 text-sm" />
                            <span className="text-blue-800 font-semibold text-sm whitespace-nowrap">
                              {premiumTime}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-shrink-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 min-w-[100px]">
                          <div className="flex items-center gap-1.5">
                            <FaClock className="text-gray-400 text-sm" />
                            <span className="text-gray-500 font-medium text-sm">
                              All day
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Event Type Badge */}
                      <span
                        className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                          event.type === "external_link"
                            ? "bg-blue-100 text-blue-700"
                            : event.type === "notation"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {event.type === "external_link"
                          ? "Link"
                          : event.type === "notation"
                          ? "Note"
                          : "Resource"}
                      </span>
                    </div>

                    {/* Action buttons - only show in non-shared views */}
                    {!isSharedView && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => markAsComplete(event, e)}
                          onTouchEnd={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                          title="Mark as complete"
                          aria-label="Mark as complete"
                        >
                          <FaCheck size={14} />
                        </button>
                        <button
                          onClick={(e) => moveTomorrow(event, e)}
                          onTouchEnd={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors flex items-center"
                          title="Reschedule to tomorrow"
                          aria-label="Reschedule to tomorrow"
                        >
                          <FaCalendar size={14} />
                          <FaArrowRight size={10} className="ml-1" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Event Title */}
                  <h4
                    className={`font-semibold text-base mb-2 leading-tight ${
                      isCompleted
                        ? "text-gray-500 line-through"
                        : isCancelled
                        ? "text-gray-500 line-through"
                        : isWaiting
                        ? "text-gray-500 italic"
                        : "text-gray-900"
                    }`}
                  >
                    {event.title || event.name}
                  </h4>

                  {/* Status Badge */}
                  {event.status && (
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          event.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : event.status === "in_progress"
                            ? "bg-yellow-100 text-yellow-700"
                            : event.status === "waiting"
                            ? "bg-gray-100 text-gray-500"
                            : event.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {event.status.replace("_", " ")}
                      </span>
                    </div>
                  )}

                  {/* View Details Button */}
                  <button
                    onClick={(e) => goToItem(event, e)}
                    onTouchEnd={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors"
                    aria-label={`View details for ${event.title || event.name}`}
                  >
                    View details →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <CalendarView
          events={todayEvents}
          onEventClick={goToItem}
          date={today}
        />
      )}

      {/* Full Calendar Button */}
      <div className="mt-5 border-t border-gray-200 pt-4">
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            // Close this hover view
            onClose();
            // Tell the parent to scroll to the full calendar
            window.dispatchEvent(new CustomEvent("scrollToFullCalendar"));
          }}
          className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-lg flex items-center justify-center gap-2 transition-colors active:bg-blue-200"
          onTouchEnd={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <FaCalendar />
          <span>View Full Calendar</span>
        </button>
      </div>

      {/* Notation Detail Modal */}
      <NotationDetail
        isOpen={showNotationDetail}
        onClose={() => {
          setShowNotationDetail(false);
          setSelectedNotation(null);
        }}
        notation={selectedNotation}
        onViewDetails={() => {
          // Navigate to the external link containing this notation
          const targetId = selectedNotation?.parentId || selectedNotation?.id;
          if (targetId) {
            if (isSharedView) {
              const storedEmail = localStorage.getItem("shared-links-email");
              const emailParam = storedEmail
                ? `&email=${encodeURIComponent(storedEmail)}`
                : "";
              const currentUrl = new URL(window.location.href);
              const token = currentUrl.searchParams.get("token");
              if (token) {
                window.open(
                  `/shared/${targetId}?token=${token}${emailParam}`,
                  "_blank"
                );
              }
            } else {
              window.open(`/external-links/${targetId}`, "_blank");
            }
          }
          setShowNotationDetail(false);
          setSelectedNotation(null);
        }}
      />
    </div>
  );
};

export default CalendarHoverInfo;
