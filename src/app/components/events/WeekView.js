import { useState, useEffect, useMemo } from "react";
import { DateTime } from "luxon";
import Image from "next/image";
import { STATUS_OPTIONS } from "../forms/AddCollectionForm";
import DOMPurify from "dompurify";
import { FaClock, FaList, FaCalendar } from "react-icons/fa";
import CalendarView, { hasTimeInfo, formatTimeDisplay } from "./CalendarView";
import MultiDayCalendarView from "./MultiDayCalendarView";

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

export default function WeekView({
  events,
  organizations,
  onEventClick,
  currentDate,
  onDateChange,
  onDayClick,
  showPublicOnly = false,
}) {
  const [weekStart, setWeekStart] = useState(() => {
    // Always start with the current week
    const now = DateTime.now();
    return now.startOf("week");
  });
  const [viewMode, setViewMode] = useState("calendar"); // Default to calendar view
  const [selectedDay, setSelectedDay] = useState(null);
  const [localShowPublicOnly, setLocalShowPublicOnly] = useState(showPublicOnly);

  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );

  // Handle window resize for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update week start when currentDate changes from parent
  useEffect(() => {
    if (currentDate) {
      const newWeekStart = DateTime.fromJSDate(currentDate).startOf("week");
      setWeekStart(newWeekStart);
    }
  }, [currentDate]);

  useEffect(() => {
    setLocalShowPublicOnly(showPublicOnly);
  }, [showPublicOnly]);

  // Determine layout based on screen size
  const useVerticalLayout = windowWidth < 768;
  const daysToShow = windowWidth >= 1024 ? 7 : windowWidth >= 640 ? 5 : 3;

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => weekStart.plus({ days: i }));
  }, [weekStart]);

  const visibleDays = useMemo(() => {
    return weekDays.slice(0, daysToShow);
  }, [weekDays, daysToShow]);

  // Filter events to show only those that occur within the current week
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (!event.startDate && !event.date) return false;

      // Filter out non-public events if public-only mode is on
      if (localShowPublicOnly && event.visibility !== 'public') {
        return false;
      }

      const eventDate = DateTime.fromISO(event.startDate || event.date);
      const weekEnd = weekStart.plus({ days: 6 });

      return eventDate >= weekStart && eventDate <= weekEnd;
    });
  }, [events, weekStart, localShowPublicOnly]);

  // Organize events by day
  const eventsByDay = useMemo(() => {
    const organized = {};
    filteredEvents.forEach((event) => {
      const eventDate = DateTime.fromISO(event.startDate || event.date);
      const dateKey = eventDate.toFormat("yyyy-MM-dd");
      if (!organized[dateKey]) {
        organized[dateKey] = [];
      }
      organized[dateKey].push(event);
    });
    return organized;
  }, [filteredEvents]);

  const handlePrevWeek = () => {
    const newWeekStart = weekStart.minus({ weeks: 1 });
    setWeekStart(newWeekStart);
    // Only call onDateChange when user explicitly navigates
    if (onDateChange) {
      onDateChange(newWeekStart.toJSDate());
    }
  };

  const handleNextWeek = () => {
    const newWeekStart = weekStart.plus({ weeks: 1 });
    setWeekStart(newWeekStart);
    // Only call onDateChange when user explicitly navigates
    if (onDateChange) {
      onDateChange(newWeekStart.toJSDate());
    }
  };

  const handleDayClick = (day) => {
    setSelectedDay(day);
    if (onDayClick) {
      onDayClick(day.toJSDate());
    }
  };

  const handlePrevDays = () => {
    setWeekStart((prev) => {
      const newStart = prev.minus({ days: daysToShow });
      return newStart;
    });
  };

  const handleNextDays = () => {
    setWeekStart((prev) => {
      const newStart = prev.plus({ days: daysToShow });
      // Ensure we don't go beyond the current week
      const currentWeekEnd = prev.plus({ days: 6 });
      if (newStart > currentWeekEnd) {
        return prev.plus({ weeks: 1 }).startOf("week");
      }
      return newStart;
    });
  };

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 flex flex-col ${
        useVerticalLayout
          ? "max-h-[calc(100vh-8rem)]"
          : "max-h-[calc(100vh-12rem)]"
      }`}
    >
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 flex-shrink-0 gap-3">
        <h2 className="text-xl font-bold">
          {weekStart.toFormat("MMMM d")} -{" "}
          {weekStart.plus({ days: 6 }).toFormat("MMMM d, yyyy")}
        </h2>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
          {/* Filter controls */}
          <div className="flex flex-wrap items-center gap-3 mr-4">
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
              onClick={() => setViewMode("calendar")}
              className={`p-2 px-3 rounded-md flex items-center gap-2 text-sm ${
                viewMode === "calendar"
                  ? "bg-white text-blue-600 shadow-sm font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              aria-label="Calendar view with time"
              title="Calendar view with time"
            >
              <FaCalendar size={14} />
              <span className="hidden sm:inline">Calendar</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 px-3 rounded-md flex items-center gap-2 text-sm ${
                viewMode === "cards"
                  ? "bg-white text-blue-600 shadow-sm font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              aria-label="Cards view"
              title="Cards view"
            >
              <FaList size={14} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>

          <button
            onClick={handlePrevWeek}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
          >
            &lt;
          </button>
          <button
            onClick={handleNextWeek}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 transition-colors"
          >
            &gt;
          </button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="flex-1 overflow-y-auto">
          {/* Mobile: Stacked individual day calendars */}
          {useVerticalLayout ? (
            <div className="space-y-6">
              {weekDays.map((day) => {
                const dayStr = day.toFormat("yyyy-MM-dd");
                const dayEvents = eventsByDay[dayStr] || [];
                const isToday = day.hasSame(DateTime.now(), "day");

                return (
                  <div
                    key={dayStr}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Day header */}
                    <div
                      className={`p-3 font-medium text-center ${
                        isToday
                          ? "bg-blue-100 text-blue-800 border-b border-blue-200"
                          : "bg-gray-50 border-b border-gray-200"
                      }`}
                    >
                      <div className="text-sm text-gray-600">
                        {day.toFormat("cccc")}
                      </div>
                      <div className="text-lg font-bold">
                        {day.toFormat("MMMM d")}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          {dayEvents.length} event
                          {dayEvents.length !== 1 ? "s" : ""}
                        </div>
                      )}
                    </div>

                    {/* Individual day calendar */}
                    {dayEvents.length > 0 ? (
                      <CalendarView
                        events={dayEvents}
                        onEventClick={onEventClick}
                        date={day}
                        height="400px"
                      />
                    ) : (
                      <div className="p-8 text-center text-gray-400">
                        <div className="text-sm">No events scheduled</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <>
              {/* Desktop: Multi-day calendar view navigation for smaller screens */}
              {daysToShow < 7 && (
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={handlePrevDays}
                    className="bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-sm transition-colors"
                  >
                    &lt; Previous
                  </button>

                  <div className="text-sm font-medium">
                    {visibleDays[0] && visibleDays[visibleDays.length - 1]
                      ? `${visibleDays[0].toFormat("MMM d")} - ${visibleDays[
                          visibleDays.length - 1
                        ].toFormat("MMM d, yyyy")}`
                      : ""}
                  </div>

                  <button
                    onClick={handleNextDays}
                    className="bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded text-sm transition-colors"
                  >
                    Next &gt;
                  </button>
                </div>
              )}

              {/* Desktop: Multi-day calendar view with shared time axis */}
              <MultiDayCalendarView
                days={visibleDays}
                events={eventsByDay}
                onEventClick={onEventClick}
                height={windowWidth < 640 ? "700px" : "600px"}
              />
            </>
          )}
        </div>
      ) : (
        // Cards view - improved layout to prevent squishing
        <div
          className={`${
            useVerticalLayout
              ? "flex flex-col gap-3"
              : "grid gap-3 auto-rows-max"
          } flex-1 overflow-y-auto ${
            useVerticalLayout
              ? ""
              : windowWidth >= 1280
              ? "grid-cols-7"
              : windowWidth >= 1024
              ? "grid-cols-5"
              : windowWidth >= 768
              ? "grid-cols-3"
              : "grid-cols-2"
          }`}
          style={{
            minHeight: useVerticalLayout ? "600px" : "400px",
          }}
        >
          {weekDays.map((day) => {
            const dayStr = day.toFormat("yyyy-MM-dd");
            const dayEvents = eventsByDay[dayStr] || [];
            const isToday = day.hasSame(DateTime.now(), "day");

            // Sort events by time, putting timed events first
            const sortedEvents = dayEvents.sort((a, b) => {
              const aHasTime = hasTimeInfo(a);
              const bHasTime = hasTimeInfo(b);

              // Prioritize events with time information
              if (aHasTime && !bHasTime) return -1;
              if (!aHasTime && bHasTime) return 1;

              // If both have time or both don't have time, sort by time or title
              if (aHasTime && bHasTime) {
                const aTime = a.startTime || a.time || "00:00";
                const bTime = b.startTime || b.time || "00:00";

                try {
                  const timeAObj = DateTime.fromFormat(aTime, "HH:mm");
                  const timeBObj = DateTime.fromFormat(bTime, "HH:mm");

                  if (timeAObj.isValid && timeBObj.isValid) {
                    return timeAObj.toMillis() - timeBObj.toMillis();
                  }
                } catch (e) {
                  // Fallback to string comparison
                  return String(aTime || "").localeCompare(String(bTime || ""));
                }

                return String(aTime || "").localeCompare(String(bTime || ""));
              }

              return String(a.title || "").localeCompare(String(b.title || ""));
            });

            return (
              <div
                key={dayStr}
                className={`flex flex-col border rounded-lg overflow-hidden ${
                  useVerticalLayout
                    ? "min-h-[400px] max-h-[800px]"
                    : "min-h-[200px] max-h-[800px]"
                } ${
                  isToday ? "ring-2 ring-blue-200 bg-blue-50/30" : "bg-white"
                }`}
              >
                <div
                  className={`p-3 ${
                    useVerticalLayout
                      ? "flex justify-between items-center bg-gradient-to-r"
                      : "text-center"
                  } font-medium ${
                    isToday
                      ? useVerticalLayout
                        ? "from-blue-100 to-blue-50 border-b border-blue-200"
                        : "bg-blue-100 border-b border-blue-200"
                      : useVerticalLayout
                      ? "from-gray-50 to-gray-100"
                      : "bg-gray-50"
                  } cursor-pointer hover:bg-gray-100 transition-colors flex-shrink-0`}
                  onClick={() => handleDayClick(day)}
                >
                  <div
                    className={`${
                      useVerticalLayout ? "flex items-center gap-3" : ""
                    }`}
                  >
                    <div
                      className={`${
                        useVerticalLayout
                          ? "flex flex-col items-center justify-center w-12 h-12 rounded-lg"
                          : ""
                      } ${
                        isToday && useVerticalLayout
                          ? "bg-blue-600 text-white shadow-md"
                          : useVerticalLayout
                          ? "bg-white border border-gray-200 text-gray-700"
                          : ""
                      }`}
                    >
                      <div
                        className={`text-xs ${
                          useVerticalLayout
                            ? isToday
                              ? "text-blue-100"
                              : "text-gray-500"
                            : "text-gray-500"
                        } font-medium ${useVerticalLayout ? "mb-0.5" : ""}`}
                      >
                        {day.toFormat(useVerticalLayout ? "ccc" : "ccc")}
                      </div>
                      <div
                        className={`${
                          useVerticalLayout
                            ? "text-lg font-bold leading-none"
                            : "text-xl font-bold"
                        } ${
                          isToday
                            ? useVerticalLayout
                              ? "text-white"
                              : "text-blue-700"
                            : "text-gray-800"
                        }`}
                      >
                        {day.toFormat("d")}
                      </div>
                    </div>
                    {useVerticalLayout && (
                      <div className="flex-1">
                        <div
                          className={`text-sm font-medium ${
                            isToday ? "text-blue-700" : "text-gray-800"
                          }`}
                        >
                          {day.toFormat("MMMM d")}
                        </div>
                        {dayEvents.length > 0 && (
                          <div className="text-xs text-blue-600 font-medium">
                            {dayEvents.length} event
                            {dayEvents.length !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {!useVerticalLayout && dayEvents.length > 0 && (
                    <div className="text-xs text-blue-600 font-medium mt-1">
                      {dayEvents.length} event
                      {dayEvents.length !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>

                <div
                  className={`flex-1 p-3 overflow-y-auto ${
                    useVerticalLayout ? "max-h-none" : ""
                  }`}
                  style={{
                    minHeight: useVerticalLayout ? "600px" : "150px",
                  }}
                >
                  {sortedEvents.length > 0 ? (
                    <div className="space-y-2">
                      {sortedEvents.map((event) => {
                        const statusOption = STATUS_OPTIONS.find(
                          (s) => s.id === event.status
                        );
                        const statusColor =
                          statusOption?.color || "bg-gray-400";
                        // Strip HTML from event description
                        const cleanDescription = stripHtml(event.description);
                        // Get formatted time display - always try to show time
                        const formattedTime = formatTimeDisplay(event);
                        const eventHasTime = hasTimeInfo(event);

                        return (
                          <button
                            key={`${day.toMillis()}-${event.id}`}
                            onClick={() => onEventClick(event)}
                            className={`
                              w-full text-left p-2 rounded-md relative
                              border border-blue-600/20 bg-blue-300/10
                              hover:bg-blue-300/20 hover:border-blue-600/40 transition-all text-xs
                              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                              ${
                                event.status?.toLowerCase() === "archived" ||
                                event.status?.toLowerCase() === "completed"
                                  ? "opacity-30"
                                  : ""
                              }
                              ${
                                event.status?.toLowerCase() === "waiting"
                                  ? "opacity-50 bg-yellow-50 border-yellow-200"
                                  : ""
                              }
                              ${
                                eventHasTime
                                  ? "border-l-4 border-l-blue-500"
                                  : ""
                              }
                            `}
                          >
                            <div className="flex items-start">
                              <div
                                className={`w-2 h-2 rounded-full ${statusColor} mt-1 mr-2 flex-shrink-0`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-gray-900 line-clamp-2 text-sm">
                                  {event.title}
                                </div>
                                {formattedTime && (
                                  <div className="text-xs text-blue-600 flex items-center gap-1 mt-1 font-medium">
                                    <FaClock
                                      size={10}
                                      className="flex-shrink-0"
                                    />
                                    <span className="truncate">
                                      {formattedTime}
                                    </span>
                                  </div>
                                )}
                                {!eventHasTime && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    All day
                                  </div>
                                )}
                                {cleanDescription && (
                                  <div className="text-gray-600 text-[11px] mt-1 line-clamp-2">
                                    {cleanDescription}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-400 text-sm">
                      No events
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
