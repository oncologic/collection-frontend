import Image from "next/image";
import { DateTime } from "luxon";
import { STATUS_OPTIONS } from "../forms/AddCollectionForm";
import { useState, useMemo } from "react";
import DOMPurify from "dompurify";
import { FaCalendar, FaList, FaTimes, FaFilter, FaTags } from "react-icons/fa";
import CalendarView, { formatTimeDisplay } from "./CalendarView";

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

// Check if event has time information
const hasTimeInfo = (event) => {
  if (!event) return false;
  // Check for direct time fields
  if (event.startTime || event.endTime || event.time) {
    return true;
  }
  // Check if we can extract time from timestamps
  if (event.startDate) {
    try {
      const dt = DateTime.fromISO(event.startDate);
      // If it has a specific time (not midnight), consider it has time info
      return dt.isValid && (dt.hour !== 0 || dt.minute !== 0 || dt.second !== 0);
    } catch (e) {
      return false;
    }
  }
  return false;
};

// Calculate time position for calendar view (as percentage of day)
const getTimePosition = (timeString) => {
  if (!timeString) return null;

  try {
    // If timeString includes a colon, it's likely in HH:MM format
    if (typeof timeString === "string" && timeString.includes(":")) {
      const [hours, minutes] = timeString.split(":").map(Number);
      // Convert to minutes from midnight
      const totalMinutes = hours * 60 + (minutes || 0);
      // Calculate as percentage of day (1440 minutes in a day)
      return (totalMinutes / 1440) * 100;
    }
    
    // Try to parse as ISO timestamp
    const dt = DateTime.fromISO(timeString);
    if (dt.isValid) {
      const totalMinutes = dt.hour * 60 + dt.minute;
      return (totalMinutes / 1440) * 100;
    }

    return null;
  } catch (e) {
    console.error("Error parsing time:", timeString, e);
    return null;
  }
};

// Import the same helper functions from Calendar.js for consistency
const generateEventClasses = (ev) => {
  const baseClasses = [
    "relative",
    "overflow-hidden",
    "transition-all",
    "duration-300",
    "ease-in-out",
    "group",
    "shadow-sm",
    "rounded-lg",
    "px-3",
    "py-2",
    "w-full",
    "text-left",
    "border",
    "hover:shadow-md",
  ];

  // Status-based styling
  const status = ev.status?.toLowerCase() || "pending";

  if (status === "pending") {
    baseClasses.push("border-solid", "opacity-90");
  } else if (status === "active") {
    baseClasses.push("border-solid", "opacity-100");
  } else if (status === "completed") {
    baseClasses.push("opacity-60");
  } else if (status === "archived") {
    baseClasses.push("opacity-40", "grayscale");
  } else if (status === "waiting") {
    baseClasses.push("opacity-60");
  }

  // Highlighting and dimming effects
  if (ev.isDimmed) {
    baseClasses.push("opacity-30", "grayscale");
  } else if (ev.isHighlighted) {
    baseClasses.push(
      "z-20",
      "font-medium",
      "shadow-lg",
      "ring-2",
      "ring-opacity-60"
    );
  }

  // Multi-tag styling
  if (ev.hasMultipleTags && ev.tagColors && ev.tagColors.length > 1) {
    baseClasses.push("border-l-4");
  }

  // Notation events get italic text
  if (ev.type === "notation") {
    baseClasses.push("italic", "border-l-4");
  }

  return baseClasses.join(" ");
};

const generateEventStyles = (ev) => {
  const styles = {};

  if (ev.primaryColor) {
    if (ev.isHighlighted) {
      // Highlighted state - clean styling with neutral text
      styles.backgroundColor = "rgba(255, 255, 255, 0.95)";
      styles.color = "#1f2937"; // Professional dark gray text
      styles.borderColor = ev.primaryColor;
      styles.borderWidth = "2px";
      styles.boxShadow = `0 2px 8px ${ev.primaryColor}15`;
    } else {
      // Normal state - neutral text with colored border
      styles.backgroundColor = "rgba(255, 255, 255, 0.95)";
      styles.color = "#374151"; // Neutral gray text
      styles.borderColor = `${ev.primaryColor}60`;
      styles.borderWidth = "1px";
    }

    if (ev.hasMultipleTags && ev.tagColors && ev.tagColors.length > 1) {
      styles.borderLeftColor = ev.primaryColor;
      styles.borderLeftWidth = "4px";
      styles.borderLeftStyle = "solid";
    }
  } else {
    if (ev.isHighlighted) {
      styles.backgroundColor = "rgba(255, 255, 255, 0.95)";
      styles.color = "#1f2937"; // Professional dark gray
      styles.borderColor = "rgb(59, 130, 246)";
      styles.borderWidth = "2px";
      styles.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.15)";
    } else {
      styles.backgroundColor = "rgba(255, 255, 255, 0.95)";
      styles.color = "#374151"; // Neutral gray
      styles.borderColor = "rgba(59, 130, 246, 0.4)";
      styles.borderWidth = "1px";
    }
  }

  if (ev.type === "notation") {
    styles.borderLeftStyle = "solid";
    styles.borderLeftWidth = "4px";
    styles.borderLeftColor = ev.primaryColor || "rgba(147, 51, 234, 0.7)";
  }

  return styles;
};

const DateEventsModal = ({
  date,
  events,
  onEventClick,
  onClose,
  isExternal = false,
}) => {
  const [viewMode, setViewMode] = useState("list"); // "list" or "calendar"
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [highlightedTags, setHighlightedTags] = useState([]);

  // Extract unique tags from all events
  const availableTags = useMemo(() => {
    const tagMap = new Map();

    events.forEach((event) => {
      if (event.tags && Array.isArray(event.tags)) {
        event.tags.forEach((tag) => {
          if (tag && tag.id) {
            tagMap.set(tag.id, tag);
          }
        });
      }
    });

    return Array.from(tagMap.values());
  }, [events]);

  // Process events with tag highlighting information
  const processedEvents = useMemo(() => {
    return events.map((event) => {
      const eventTags = event.tags || [];
      const primaryTag = eventTags[0];
      const tagColors = eventTags.map((tag) => tag.color).filter(Boolean);

      // Calculate highlighting state
      const isHighlighted =
        highlightedTags.length === 0 ||
        eventTags.some((tag) =>
          highlightedTags.some((hTag) => hTag.id === tag.id)
        );
      const isDimmed = highlightedTags.length > 0 && !isHighlighted;
      
      // Extract time information from timestamps if not already present
      let processedEvent = {
        ...event,
        tags: eventTags,
        primaryColor: primaryTag?.color || null,
        tagColors: tagColors,
        hasMultipleTags: eventTags.length > 1,
        isHighlighted: isHighlighted,
        isDimmed: isDimmed,
      };
      
      // If no startTime/endTime but has startDate/endDate timestamps, extract times
      if (!processedEvent.startTime && !processedEvent.time && processedEvent.startDate) {
        try {
          const startDT = DateTime.fromISO(processedEvent.startDate);
          if (startDT.isValid) {
            processedEvent.startTime = startDT.toFormat('HH:mm');
            processedEvent.timezone = processedEvent.timezone || startDT.zoneName;
          }
          
          if (processedEvent.endDate) {
            const endDT = DateTime.fromISO(processedEvent.endDate);
            if (endDT.isValid) {
              processedEvent.endTime = endDT.toFormat('HH:mm');
            }
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }

      return processedEvent;
    });
  }, [events, highlightedTags]);

  // Handle tag click for highlighting
  const handleTagClick = (tag) => {
    setHighlightedTags((prev) => {
      const isAlreadyHighlighted = prev.some((t) => t.id === tag.id);
      if (isAlreadyHighlighted) {
        return prev.filter((t) => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleClearTagHighlights = () => {
    setHighlightedTags([]);
  };

  const sortedEvents = [...processedEvents].sort((a, b) => {
    // Helper function to extract time from various formats
    const extractTimeInfo = (event) => {
      // First try startTime/endTime/time fields
      if (event.startTime || event.time) {
        return {
          startTime: event.startTime || event.time,
          endTime: event.endTime
        };
      }
      
      // Then try to extract from startDate/endDate timestamps
      if (event.startDate) {
        try {
          const startDT = DateTime.fromISO(event.startDate);
          const endDT = event.endDate ? DateTime.fromISO(event.endDate) : null;
          
          if (startDT.isValid) {
            return {
              startTime: startDT.toFormat('HH:mm'),
              endTime: endDT && endDT.isValid ? endDT.toFormat('HH:mm') : null
            };
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
      
      return { startTime: null, endTime: null };
    };
    
    // Helper function to parse time and get minutes since midnight for sorting
    const getTimeValueForSorting = (timeStr) => {
      if (!timeStr) return null;

      try {
        // Handle HH:mm format
        if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
          const [hours, minutes] = timeStr.split(':').map(Number);
          return hours * 60 + minutes;
        }
        
        // Try different time formats
        let timeObj = DateTime.fromFormat(timeStr, "HH:mm");
        if (!timeObj.isValid) {
          timeObj = DateTime.fromFormat(timeStr, "h:mm a");
        }
        if (!timeObj.isValid) {
          timeObj = DateTime.fromFormat(timeStr, "HH:mm:ss");
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

    // Sort by time first
    const timeInfoA = extractTimeInfo(a);
    const timeInfoB = extractTimeInfo(b);
    const timeA = timeInfoA.startTime;
    const timeB = timeInfoB.startTime;

    // If both have times, sort by time first
    if (timeA && timeB) {
      const timeValueA = getTimeValueForSorting(timeA);
      const timeValueB = getTimeValueForSorting(timeB);

      if (timeValueA !== null && timeValueB !== null) {
        const timeDiff = timeValueA - timeValueB;
        if (timeDiff !== 0) return timeDiff;
      }
    } else if (timeA) {
      return -1; // A has time, B doesn't, so A comes first
    } else if (timeB) {
      return 1; // B has time, A doesn't, so B comes first
    }

    // If times are equal or both don't have times, then sort by status priority
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

    // If same time and same status priority, sort by title alphabetically
    return String(a.title || "").localeCompare(String(b.title || ""));
  });

  const handleEventClick = (event) => {
    onEventClick(event);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">
            {date.toFormat("MMMM d, yyyy")}
          </h3>
          <div className="flex items-center gap-2">
            {/* Tag filter button */}
            {availableTags.length > 0 && (
              <button
                onClick={() => setShowTagFilter(!showTagFilter)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  highlightedTags.length > 0
                    ? "bg-blue-100 text-blue-600 shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                title="Filter by tags"
              >
                <FaTags size={14} />
                {highlightedTags.length > 0 && (
                  <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {highlightedTags.length}
                  </span>
                )}
              </button>
            )}

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
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Tag Filter Panel */}
        {showTagFilter && availableTags.length > 0 && (
          <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <FaTags className="mr-2" />
                Filter by Tags
              </h4>
              {highlightedTags.length > 0 && (
                <button
                  onClick={handleClearTagHighlights}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear ({highlightedTags.length})
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {availableTags.map((tag) => {
                const isHighlighted = highlightedTags.some(
                  (t) => t.id === tag.id
                );
                const eventCount = processedEvents.filter((event) =>
                  event.tags?.some((eventTag) => eventTag.id === tag.id)
                ).length;

                return (
                  <button
                    key={tag.id}
                    onClick={() => handleTagClick(tag)}
                    className={`flex items-center space-x-2 p-2 rounded-lg border text-left transition-all duration-200 ${
                      isHighlighted
                        ? "bg-white border shadow-md transform scale-[1.02]"
                        : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                    style={{
                      borderColor: isHighlighted ? `${tag.color}40` : undefined,
                      boxShadow: isHighlighted
                        ? `0 0 0 1px ${tag.color}20`
                        : undefined,
                    }}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0 opacity-70"
                      style={{ backgroundColor: tag.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{tag.name}</p>
                      <p className="text-xs text-gray-500">
                        {eventCount} events
                      </p>
                    </div>
                    {isHighlighted && (
                      <div className="flex-shrink-0">
                        <svg
                          className="w-3 h-3 text-green-500 opacity-60"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* List View */}
          {viewMode === "list" && sortedEvents.length > 0 ? (
            <div className="space-y-3">
              {sortedEvents.map((event) => {
                // Get clean description
                const cleanDescription = stripHtml(event.description);

                return (
                  <button
                    key={event.id + (event.notationId || "")}
                    onClick={() => handleEventClick(event)}
                    className={generateEventClasses(event)}
                    style={generateEventStyles(event)}
                  >
                    {/* Status indicator for completed events */}
                    {event.status?.toLowerCase() === "completed" && (
                      <div className="absolute top-1 left-1 text-white text-[8px] font-bold leading-none">
                        ✓
                      </div>
                    )}

                    {/* Multi-tag indicator dot */}
                    {event.hasMultipleTags &&
                      event.tagColors &&
                      event.tagColors.length > 1 && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-white/80 rounded-full border border-black/10" />
                      )}
                    {/* Time display */}
                    {(event.startTime || event.endTime || event.time) && (
                      <div className="mb-2 text-xs font-semibold flex items-center">
                        <svg
                          className="w-3 h-3 mr-1 opacity-60"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {formatTimeDisplay(event)}
                      </div>
                    )}

                    {/* Event title */}
                    <h4 className="font-medium mb-2 text-left">
                      {event.title}
                    </h4>

                    {/* Event description */}
                    {cleanDescription && (
                      <p className="text-sm opacity-80 mb-3 line-clamp-2 text-left">
                        {cleanDescription}
                      </p>
                    )}

                    {/* Tags display */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {event.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-white/90 backdrop-blur-sm shadow-sm"
                            style={{
                              borderColor: `${tag.color}60`,
                              color: tag.color,
                            }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </span>
                        ))}
                        {event.tags.length > 3 && (
                          <span className="text-xs opacity-50">
                            +{event.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Status and type badges */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-full shadow-sm ${
                          event.type === "external_link"
                            ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200"
                            : event.type === "notation"
                            ? "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200"
                            : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200"
                        }`}
                      >
                        {event.type === "external_link"
                          ? "Link"
                          : event.type === "notation"
                          ? "Note"
                          : "Resource"}
                      </span>
                      {event.status && (
                        <span
                          className={`px-2 py-0.5 rounded-full shadow-sm ${
                            event.status === "completed"
                              ? "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200"
                              : event.status === "in_progress" ||
                                event.status === "active"
                              ? "bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border border-yellow-200"
                              : "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {event.status.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : viewMode === "list" && sortedEvents.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No events scheduled for this date
            </div>
          ) : null}

          {/* Calendar View */}
          {viewMode === "calendar" && (
            <CalendarView
              events={sortedEvents}
              onEventClick={handleEventClick}
              date={date}
              height="500px"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DateEventsModal;
