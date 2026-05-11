import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { STATUS_OPTIONS } from "../forms/AddCollectionForm";
import Image from "next/image";
import DOMPurify from "dompurify";
import { FaClock, FaMapMarker, FaList, FaCalendar, FaGoogle } from "react-icons/fa";
import CalendarView, { hasTimeInfo, formatTimeDisplay } from "./CalendarView";
import { useGoogleCalendar } from "../../hooks/useGoogleCalendar";

// Helper function to strip HTML tags
const stripHtml = (html) => {
  if (!html) return "";
  // First sanitize with DOMPurify
  const sanitized = DOMPurify.sanitize(html);
  // Then create a temporary element to extract text content
  const temp = document.createElement("div");
  temp.innerHTML = sanitized;
  return temp.textContent || temp.innerText || "";
};

export default function DayView({
  events,
  organizations,
  onEventClick,
  currentDate,
  onDateChange,
  showGoogleCalendarEvents = false, // Changed default to false (opt-in)
  showPublicOnly = false,
}) {
  const [dayEvents, setDayEvents] = useState([]);
  const [viewMode, setViewMode] = useState("cards"); // 'cards' or 'calendar'
  const [localShowGoogleCalendar, setLocalShowGoogleCalendar] = useState(showGoogleCalendarEvents);
  const [localShowPublicOnly, setLocalShowPublicOnly] = useState(showPublicOnly);

  // Google Calendar integration
  const { integrationStatus } = useGoogleCalendar();

  useEffect(() => {
    // Filter events for the selected day
    const formattedDate = currentDate.toFormat("yyyy-MM-dd");

    const filteredEvents = events.filter((event) => {
      // Filter out Google Calendar events if toggle is off
      if (!localShowGoogleCalendar && event.isGoogleCalendarEvent) {
        return false;
      }
      
      // Filter out non-public events if public-only mode is on
      if (localShowPublicOnly && event.visibility !== 'public') {
        return false;
      }

      const eventDate = DateTime.fromISO(
        (event.startDate || event.date).replace(" ", "T")
      );
      return eventDate.toFormat("yyyy-MM-dd") === formattedDate;
    });

    // Helper function to parse time and get minutes since midnight for sorting
    const getTimeValueForSorting = (event) => {
      const timeStr = event.time || event.startTime;
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

        if (timeObj.isValid) {
          // Return minutes since midnight for consistent sorting
          return timeObj.hour * 60 + timeObj.minute;
        }
      } catch (e) {
        // Ignore parsing errors
      }
      return null;
    };

    // Separate into timed events and all-day events
    const timeFormatted = filteredEvents.map((event) => {
      // Get time information if available
      const hasTime =
        event.time != null || event.startTime != null || event.endTime != null;
      const timezone =
        event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Format time for display if it exists
      const formattedTimeDisplay = formatTimeDisplay(event);

      // Get numeric time value for proper sorting
      const timeValue = getTimeValueForSorting(event);

      return {
        ...event,
        hasTime,
        formattedTime: formattedTimeDisplay,
        timezone,
        timeValue, // Use numeric value instead of string for sorting
      };
    });

    // Sort events: all-day events first, then by time
    const sortedEvents = timeFormatted.sort((a, b) => {
      // All-day events come before timed events
      if (a.hasTime && !b.hasTime) return 1;
      if (!a.hasTime && b.hasTime) return -1;

      // If both have times, sort by numeric time value
      if (a.hasTime && b.hasTime) {
        if (a.timeValue !== null && b.timeValue !== null) {
          const timeDiff = a.timeValue - b.timeValue;
          if (timeDiff !== 0) return timeDiff;
        }
      }

      // If times are equal or both don't have times, sort by title/name alphabetically
      const titleA = String(a.title || a.name || "");
      const titleB = String(b.title || b.name || "");
      return titleA.localeCompare(titleB);
    });

    setDayEvents(sortedEvents);
  }, [events, currentDate, localShowGoogleCalendar, localShowPublicOnly]);

  // Update local filter states when props change
  useEffect(() => {
    setLocalShowGoogleCalendar(showGoogleCalendarEvents);
  }, [showGoogleCalendarEvents]);

  useEffect(() => {
    setLocalShowPublicOnly(showPublicOnly);
  }, [showPublicOnly]);

  // Format date for display
  const formatDate = (date) => {
    return date.toFormat("EEEE, MMMM d, yyyy");
  };

  const handlePrevDay = () => {
    onDateChange(currentDate.minus({ days: 1 }));
  };

  const handleNextDay = () => {
    onDateChange(currentDate.plus({ days: 1 }));
  };

  const isToday = currentDate.hasSame(DateTime.now(), "day");

  return (
    <div className="bg-white rounded-lg shadow p-4 max-h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 flex-shrink-0 gap-3">
        <h2 className="text-xl font-bold">{formatDate(currentDate)}</h2>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
          {/* Filter controls */}
          <div className="flex flex-wrap items-center gap-3 mr-4">
            {/* Google Calendar controls */}
            {integrationStatus?.connected && (
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localShowGoogleCalendar}
                    onChange={(e) => setLocalShowGoogleCalendar(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <FaGoogle className="text-blue-500" />
                    Google Calendar
                  </span>
                </label>
              </div>
            )}
            
            {/* Public events only toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localShowPublicOnly}
                onChange={(e) => setLocalShowPublicOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">Public only</span>
            </label>
          </div>
          {/* View mode toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1 rounded-md ${
                viewMode === "cards"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              aria-label="Cards view"
              title="Cards view"
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
            onClick={handlePrevDay}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            &lt;
          </button>
          <button
            onClick={handleNextDay}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            &gt;
          </button>
        </div>
      </div>

      {viewMode === "cards" ? (
        <>
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2 text-gray-500">
              All-Day Events
            </h3>
            <div className="border rounded-lg divide-y">
              {dayEvents.filter((event) => !event.hasTime).length === 0 ? (
                <div className="p-4 text-gray-500 text-center">
                  No all-day events
                </div>
              ) : (
                dayEvents
                  .filter((event) => !event.hasTime)
                  .map((event) => {
                    // Get status for styling
                    const statusOption = STATUS_OPTIONS.find(
                      (s) => s.id === event.status
                    );
                    const statusColor = statusOption?.color || "bg-gray-400";
                    const cleanDescription = stripHtml(event.description);

                    return (
                      <div
                        key={event.id + (event.notationId || "")}
                        className="p-4 hover:bg-gray-50 cursor-pointer border-l-4 border-transparent hover:border-blue-400 transition-colors relative"
                        onClick={() => onEventClick(event)}
                      >
                        {/* Google Calendar indicator */}
                        {event.isGoogleCalendarEvent && (
                          <div className="absolute top-2 right-2">
                            <FaGoogle size={12} className="text-blue-500" />
                          </div>
                        )}
                        <div className="flex items-start">
                          <div
                            className={`w-2 h-2 rounded-full ${statusColor} mt-1.5 mr-2 flex-shrink-0`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">
                              {event.title || event.name}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                              <span
                                className={`
                                px-2 py-0.5 rounded-full text-xs
                                ${
                                  event.type === "external_link"
                                    ? "bg-blue-100 text-blue-700"
                                    : event.type === "notation"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-gray-100 text-gray-700"
                                }
                              `}
                              >
                                {event.type === "external_link"
                                  ? "Link"
                                  : event.type === "notation"
                                  ? "Note"
                                  : "Event"}
                              </span>
                            </div>
                            {cleanDescription && (
                              <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                                {cleanDescription}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          <div>
            <h3 className="text-md font-semibold mb-2 text-gray-500">
              Events with Times
            </h3>
            <div className="border rounded-lg divide-y">
              {dayEvents.filter((event) => event.hasTime).length === 0 ? (
                <div className="p-4 text-gray-500 text-center">
                  No timed events
                </div>
              ) : (
                dayEvents
                  .filter((event) => event.hasTime)
                  .map((event) => {
                    // Get status for styling
                    const statusOption = STATUS_OPTIONS.find(
                      (s) => s.id === event.status
                    );
                    const statusColor = statusOption?.color || "bg-gray-400";
                    const cleanDescription = stripHtml(event.description);

                    return (
                      <div
                        key={event.id + (event.notationId || "")}
                        className="p-4 hover:bg-gray-50 cursor-pointer border-l-4 border-transparent hover:border-blue-400 transition-colors relative"
                        onClick={() => onEventClick(event)}
                      >
                        {/* Google Calendar indicator */}
                        {event.isGoogleCalendarEvent && (
                          <div className="absolute top-2 right-2">
                            <FaGoogle size={12} className="text-blue-500" />
                          </div>
                        )}
                        <div className="flex items-start">
                          <div
                            className={`w-2 h-2 rounded-full ${statusColor} mt-1.5 mr-2 flex-shrink-0`}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">
                              {event.title || event.name}
                            </div>
                            <div className="flex items-center text-sm text-blue-600 mt-1">
                              <FaClock className="mr-1" /> {event.formattedTime}
                              {event.timezone &&
                                event.timezone !==
                                  Intl.DateTimeFormat().resolvedOptions()
                                    .timeZone && (
                                  <div className="ml-2 flex items-center text-gray-500">
                                    <FaMapMarker className="mr-1" />{" "}
                                    {event.timezone}
                                  </div>
                                )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                              <span
                                className={`
                                px-2 py-0.5 rounded-full text-xs
                                ${
                                  event.type === "external_link"
                                    ? "bg-blue-100 text-blue-700"
                                    : event.type === "notation"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-gray-100 text-gray-700"
                                }
                              `}
                              >
                                {event.type === "external_link"
                                  ? "Link"
                                  : event.type === "notation"
                                  ? "Note"
                                  : "Event"}
                              </span>
                            </div>
                            {cleanDescription && (
                              <div className="text-sm text-gray-600 mt-1 line-clamp-1">
                                {cleanDescription}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Calendar view */}
          <CalendarView
            events={dayEvents}
            onEventClick={onEventClick}
            date={currentDate}
            height="600px"
          />
        </div>
      )}
    </div>
  );
}
