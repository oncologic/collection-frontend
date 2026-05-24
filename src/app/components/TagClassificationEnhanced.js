import React, { useState, useMemo } from "react";
import { DateTime } from "luxon";
import {
  FaTags,
  FaList,
  FaCalendar,
  FaTimes,
  FaExternalLinkAlt,
} from "react-icons/fa";
import DOMPurify from "dompurify";
import { useRouter } from "next/navigation";

// Helper function to strip HTML tags
const stripHtml = (html) => {
  if (!html) return "";
  const sanitized = DOMPurify.sanitize(html);
  const temp = document.createElement("div");
  temp.innerHTML = sanitized;
  return temp.textContent || temp.innerText || "";
};

// Helper function to format time display
const formatTimeDisplay = (event) => {
  const timeStr = event.time || event.startTime;
  if (!timeStr) return null;

  try {
    if (timeStr.includes(":")) {
      const [hours, minutes] = timeStr.split(":").map((n) => parseInt(n, 10));
      if (!isNaN(hours)) {
        const hour = hours;
        const ampm = hour >= 12 ? "pm" : "am";
        const hour12 = hour % 12 || 12;
        const mins = (minutes || 0).toString().padStart(2, "0");
        return `${hour12}:${mins}${ampm}`;
      }
    }
    return timeStr;
  } catch (e) {
    return timeStr;
  }
};

const TagClassificationEnhanced = ({
  availableTags = [],
  highlightedTags = [],
  tagFilterMode = "OR",
  onTagClick,
  onClearHighlights,
  onFilterModeChange,
  getTagCount,
  showCondition = true,
  title = "Tag Classification",
  className = "",
  events = [], // All events passed from parent
  showPublicOnly = false,
  showRegularEvents = true,
  isCollectionContext = true, // Use this to know if we should show the toggle
  onPublicOnlyToggle,
  onRegularEventsToggle,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showListView, setShowListView] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const router = useRouter();

  // Handle event click - navigate based on event type
  const handleEventClick = (event) => {
    if (event.type === "external_link") {
      // For external links, navigate to the external link detail page
      if (event.id) {
        window.open(`/external-links/${event.id}`, "_blank");
      }
    } else if (event.type === "notation") {
      // For notations, they are part of external links
      // Based on the collection page code, the event.id IS the external link ID
      // and event.notationId is the actual notation ID
      const externalLinkId = event.id;
      const notationId = event.notationId;

      if (externalLinkId && notationId) {
        // Navigate to the external link detail page with notation highlight
        window.open(
          `/external-links/${externalLinkId}?highlightNotation=${notationId}`,
          "_blank"
        );
      }
    } else if (event.type === "event") {
      // For regular events, navigate to the event detail page if it exists
      if (event.id) {
        window.open(`/events/${event.id}`, "_blank");
      }
    }
  };

  // Filter and sort tags
  const filteredAndSortedTags = useMemo(() => {
    let filtered = availableTags;

    if (searchTerm) {
      filtered = availableTags.filter((tag) =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      const eventCountA = getTagCount ? getTagCount(a.id) : 0;
      const eventCountB = getTagCount ? getTagCount(b.id) : 0;

      if (eventCountB !== eventCountA) {
        return eventCountB - eventCountA;
      }

      return a.name.localeCompare(b.name);
    });
  }, [availableTags, searchTerm, getTagCount]);

  // Filter events based on selected tags and toggles
  const filteredEvents = useMemo(() => {
    if (!events || events.length === 0) return [];

    let filtered = [...events];

    // Apply public only filter
    if (showPublicOnly) {
      filtered = filtered.filter((event) => event.visibility === "public");
    }

    // Apply tag filter if tags are selected
    if (highlightedTags.length > 0) {
      filtered = filtered.filter((event) => {
        const eventTags = event.tags || [];

        if (tagFilterMode === "OR") {
          // Show events that have ANY of the selected tags
          return eventTags.some((tag) =>
            highlightedTags.some((hTag) => hTag.id === tag.id)
          );
        } else {
          // Show events that have ALL of the selected tags
          return highlightedTags.every((hTag) =>
            eventTags.some((tag) => tag.id === hTag.id)
          );
        }
      });
    }

    return filtered;
  }, [
    events,
    highlightedTags,
    tagFilterMode,
    showPublicOnly,
  ]);

  // Group filtered events by date
  const eventsByDate = useMemo(() => {
    const grouped = {};

    filteredEvents.forEach((event) => {
      const date = event.startDate || event.date;
      if (!date) return;

      const dateKey = DateTime.fromISO(date.replace(" ", "T")).toISODate();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    // Sort events within each date
    Object.keys(grouped).forEach((dateKey) => {
      grouped[dateKey].sort((a, b) => {
        const timeA = a.startTime || a.time;
        const timeB = b.startTime || b.time;

        if (timeA && timeB) {
          return timeA.localeCompare(timeB);
        } else if (timeA) {
          return -1;
        } else if (timeB) {
          return 1;
        }

        return (a.title || a.name || "").localeCompare(b.title || b.name || "");
      });
    });

    return grouped;
  }, [filteredEvents]);

  // Get sorted dates
  const sortedDates = useMemo(() => {
    return Object.keys(eventsByDate).sort();
  }, [eventsByDate]);

  if (!showCondition || availableTags.length === 0) {
    return null;
  }

  return (
    <div className={`mt-4 ${className}`}>
      {/* Selected Tags Display at Top of Calendar Days */}
      {highlightedTags.length > 0 && !showListView && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-blue-900 flex items-center">
              <FaTags className="mr-2" />
              Active Tag Filters
            </h4>
            <button
              onClick={() => setShowListView(!showListView)}
              className="flex items-center gap-2 px-3 py-1 bg-white border border-blue-300 rounded-md text-sm text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <FaList size={12} />
              View as List
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {highlightedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border-2"
                style={{
                  backgroundColor: `${tag.color}20`,
                  borderColor: tag.color,
                  color: tag.color,
                }}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
                <button
                  onClick={() => onTagClick && onTagClick(tag)}
                  className="ml-1 hover:opacity-70"
                >
                  <FaTimes size={10} />
                </button>
              </span>
            ))}
          </div>
          {highlightedTags.length > 1 && (
            <div className="mt-2 text-xs text-blue-700">
              Showing items with {tagFilterMode === "OR" ? "ANY" : "ALL"} of
              these tags
            </div>
          )}
        </div>
      )}

      {/* List View of Tagged Items */}
      {showListView && highlightedTags.length > 0 && (
        <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaList className="mr-2" />
              Items with Selected Tags ({filteredEvents.length})
            </h4>
            <button
              onClick={() => setShowListView(false)}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <FaCalendar size={12} />
              Back to Tags
            </button>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!showPublicOnly}
                onChange={(e) =>
                  onPublicOnlyToggle && onPublicOnlyToggle(!e.target.checked)
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">
                Include Private Events
              </span>
            </label>

            {/* Show business unit events toggle when in collection context */}
            {isCollectionContext && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showRegularEvents}
                  onChange={(e) =>
                    onRegularEventsToggle &&
                    onRegularEventsToggle(e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">
                  Include Business Unit Events
                </span>
              </label>
            )}
          </div>

          {/* Events List by Date */}
          <div className="space-y-6 max-h-[600px] overflow-y-auto">
            {sortedDates.length === 0 ? (
              <p className="text-center text-gray-500 py-8">
                No items found with the selected tags
              </p>
            ) : (
              sortedDates.map((dateKey) => {
                const date = DateTime.fromISO(dateKey);
                const dateEvents = eventsByDate[dateKey];

                return (
                  <div
                    key={dateKey}
                    className="border-b border-gray-200 pb-4 last:border-0"
                  >
                    <h5 className="font-semibold text-gray-900 mb-3 sticky top-0 bg-white py-2">
                      {date.toFormat("EEEE, MMMM d, yyyy")}
                      <span className="ml-2 text-sm text-gray-500">
                        ({dateEvents.length}{" "}
                        {dateEvents.length === 1 ? "item" : "items"})
                      </span>
                    </h5>

                    <div className="space-y-2">
                      {dateEvents.map((event) => {
                        const timeDisplay = formatTimeDisplay(event);
                        const cleanDescription = stripHtml(event.description);

                        const isCompleted =
                          event.status?.toLowerCase() === "completed";
                        const isCancelled =
                          event.status?.toLowerCase() === "cancelled";

                        return (
                          <div
                            key={event.id + (event.notationId || "")}
                            className={`p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all cursor-pointer ${
                              isCompleted || isCancelled ? "opacity-50" : ""
                            }`}
                            onClick={() => handleEventClick(event)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {timeDisplay && (
                                    <span className="text-sm font-medium text-blue-600">
                                      {timeDisplay}
                                    </span>
                                  )}
                                  <h6
                                    className={`font-medium flex items-center gap-1 ${
                                      isCompleted || isCancelled
                                        ? "text-gray-600 line-through"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {event.title || event.name}
                                    {event.type === "external_link" && (
                                      <FaExternalLinkAlt
                                        className="text-gray-400"
                                        size={12}
                                      />
                                    )}
                                  </h6>
                                </div>

                                {cleanDescription && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                    {cleanDescription}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-2">
                                  {/* Type Badge */}
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
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
                                      : "Event"}
                                  </span>

                                  {/* Status Badge */}
                                  {event.status && (
                                    <span
                                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                        event.status.toLowerCase() ===
                                        "completed"
                                          ? "bg-green-100 text-green-700"
                                          : event.status.toLowerCase() ===
                                            "in progress"
                                          ? "bg-purple-100 text-purple-700"
                                          : event.status.toLowerCase() ===
                                            "pending"
                                          ? "bg-yellow-100 text-yellow-700"
                                          : event.status.toLowerCase() ===
                                            "cancelled"
                                          ? "bg-red-100 text-red-700"
                                          : event.status.toLowerCase() ===
                                            "waiting"
                                          ? "bg-orange-100 text-orange-700"
                                          : event.status.toLowerCase() ===
                                            "archived"
                                          ? "bg-gray-100 text-gray-700"
                                          : event.status.toLowerCase() ===
                                            "active"
                                          ? "bg-blue-100 text-blue-700"
                                          : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {event.status.charAt(0).toUpperCase() +
                                        event.status.slice(1).toLowerCase()}
                                    </span>
                                  )}

                                  {/* Tags */}
                                  {event.tags && event.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {event.tags.map((tag) => (
                                        <span
                                          key={tag.id}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                                          style={{
                                            backgroundColor: `${tag.color}20`,
                                            color: tag.color,
                                            border: `1px solid ${tag.color}40`,
                                          }}
                                        >
                                          <div
                                            className="w-2 h-2 rounded-full"
                                            style={{
                                              backgroundColor: tag.color,
                                            }}
                                          />
                                          {tag.name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Original Tag Classification Component */}
      {!showListView && (
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center">
              <svg
                className="w-5 h-5 mr-2 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              {title}
            </h4>
            <div className="flex items-center gap-3">
              {highlightedTags.length > 0 && (
                <>
                  {highlightedTags.length > 1 && onFilterModeChange && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Filter:</span>
                      <button
                        onClick={() =>
                          onFilterModeChange(
                            tagFilterMode === "OR" ? "AND" : "OR"
                          )
                        }
                        className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                          tagFilterMode === "AND"
                            ? "bg-blue-100 text-blue-700 border-blue-300"
                            : "bg-gray-100 text-gray-600 border-gray-300"
                        }`}
                        title={`Currently showing events with ${
                          tagFilterMode === "OR" ? "ANY" : "ALL"
                        } selected tags. Click to switch to ${
                          tagFilterMode === "OR" ? "AND" : "OR"
                        } mode.`}
                      >
                        {tagFilterMode}
                      </button>
                    </div>
                  )}
                  {onClearHighlights && (
                    <button
                      onClick={onClearHighlights}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                    >
                      Clear highlights ({highlightedTags.length})
                    </button>
                  )}
                </>
              )}
              <span className="text-sm text-gray-500 font-medium">
                {filteredAndSortedTags.length}{" "}
                {filteredAndSortedTags.length === 1 ? "Category" : "Categories"}
                {searchTerm && ` (filtered from ${availableTags.length})`}
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-4 w-4"
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
              )}
            </div>
          </div>

          {filteredAndSortedTags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm">
                {searchTerm
                  ? `No tags found matching "${searchTerm}"`
                  : "No tags available"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
              {filteredAndSortedTags.map((tag) => {
                const tagColor = tag.color || "#3B82F6";
                const eventCount = getTagCount ? getTagCount(tag.id) : 0;
                const isHighlighted = highlightedTags.some(
                  (t) => t.id === tag.id
                );

                return (
                  <button
                    key={tag.id}
                    onClick={() => onTagClick && onTagClick(tag)}
                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                      isHighlighted
                        ? "bg-white border-2 shadow-md transform scale-105"
                        : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                    }`}
                    style={{
                      borderColor: isHighlighted ? tagColor : undefined,
                      boxShadow: isHighlighted
                        ? `0 0 12px ${tagColor}30`
                        : undefined,
                    }}
                    title={`Click to ${
                      isHighlighted ? "unhighlight" : "highlight"
                    } calendar events with this tag`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg border flex-shrink-0 transition-all duration-200 ${
                        isHighlighted
                          ? "shadow-lg transform scale-110"
                          : "border-gray-200 shadow-sm"
                      }`}
                      style={{
                        backgroundColor: tagColor,
                        borderColor: isHighlighted ? tagColor : undefined,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-sm font-medium truncate transition-colors ${
                          isHighlighted ? "text-gray-900" : "text-gray-900"
                        }`}
                      >
                        {tag.name}
                      </p>
                      {getTagCount && (
                        <p
                          className={`text-xs transition-colors ${
                            isHighlighted ? "text-gray-600" : "text-gray-500"
                          }`}
                        >
                          {eventCount} {eventCount === 1 ? "event" : "events"}
                        </p>
                      )}
                    </div>
                    {isHighlighted && (
                      <div className="flex-shrink-0">
                        <svg
                          className="w-4 h-4 text-green-600"
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
          )}

          {/* Legend Key */}
          <div className="border-t border-gray-200 pt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-3">
              Visual Legend
            </h5>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded opacity-75"></div>
                <span>Multiple tags</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded relative">
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full border border-gray-300"></div>
                </div>
                <span>Multi-tag indicator</span>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <strong>Tip:</strong> Click tags above to highlight calendar
              events. Selected tags will be outlined and glowing.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagClassificationEnhanced;
