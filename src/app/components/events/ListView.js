"use client";

import { useState, useEffect } from "react";
import { DateTime } from "luxon";
import { STATUS_OPTIONS } from "../forms/AddCollectionForm";
import DOMPurify from "dompurify";
import { FaClock, FaCalendar, FaMapMarkerAlt, FaTag, FaExternalLinkAlt } from "react-icons/fa";
import { formatTimeDisplay } from "./CalendarView";

// Helper function to strip HTML tags
const stripHtml = (html) => {
  if (!html) return "";
  const sanitized = DOMPurify.sanitize(html);
  const temp = document.createElement("div");
  temp.innerHTML = sanitized;
  return temp.textContent || temp.innerText || "";
};

export default function ListView({
  events,
  organizations,
  onEventClick,
  currentMonth,
  onDateChange,
  showPublicOnly = false,
  highlightedEvents = new Set(),
}) {
  const [sortedEvents, setSortedEvents] = useState([]);

  useEffect(() => {
    // Filter events for the current month
    const monthStart = currentMonth.startOf("month");
    const monthEnd = currentMonth.endOf("month");

    const monthEvents = events.filter((event) => {
      const eventDate = DateTime.fromISO(
        (event.startDate || event.date).replace(" ", "T")
      );

      // Check if event falls within the current month
      if (!eventDate.isValid) return false;

      // For multi-day events, check if they overlap with the month
      if (event.endDate) {
        const endDate = DateTime.fromISO(event.endDate.replace(" ", "T"));
        return (
          (eventDate >= monthStart && eventDate <= monthEnd) ||
          (endDate >= monthStart && endDate <= monthEnd) ||
          (eventDate < monthStart && endDate > monthEnd)
        );
      }

      return eventDate >= monthStart && eventDate <= monthEnd;
    });

    // Sort events by date and then by time
    const sorted = [...monthEvents].sort((a, b) => {
      const dateA = DateTime.fromISO((a.startDate || a.date).replace(" ", "T"));
      const dateB = DateTime.fromISO((b.startDate || b.date).replace(" ", "T"));

      // First sort by date
      const dateDiff = dateA.toMillis() - dateB.toMillis();
      if (dateDiff !== 0) return dateDiff;

      // Then sort by time if dates are equal
      const timeA = a.time || a.startTime;
      const timeB = b.time || b.startTime;

      if (timeA && timeB) {
        return timeA.localeCompare(timeB);
      } else if (timeA) {
        return -1;
      } else if (timeB) {
        return 1;
      }

      return 0;
    });

    setSortedEvents(sorted);
  }, [events, currentMonth]);

  const handlePrevMonth = () => {
    const newMonth = currentMonth.minus({ months: 1 });
    onDateChange(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = currentMonth.plus({ months: 1 });
    onDateChange(newMonth);
  };

  // Get organization name helper
  const getOrgName = (event) => {
    if (!event.organizations || event.organizations.length === 0) return null;
    const org = event.organizations[0];
    if (typeof org === 'string') {
      return organizations?.find(o => o.id === org)?.name || null;
    }
    return org.name || null;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {currentMonth.toFormat("MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrevMonth}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              &lt;
            </button>
            <button
              onClick={handleNextMonth}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            >
              &gt;
            </button>
          </div>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          {sortedEvents.length} event{sortedEvents.length !== 1 ? 's' : ''} in {currentMonth.toFormat("MMMM yyyy")}
        </div>
      </div>

      {/* Events List */}
      <div className="max-h-[70vh] overflow-y-auto">
        {sortedEvents.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No events scheduled for this month
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedEvents.map((event) => {
              const eventDate = DateTime.fromISO((event.startDate || event.date).replace(" ", "T"));
              const isToday = eventDate.hasSame(DateTime.now(), "day");
              const statusOption = STATUS_OPTIONS.find(
                (s) => s.id === event.status?.toLowerCase()
              );
              const statusColor = statusOption?.color || "bg-gray-100 text-gray-700";
              const orgName = getOrgName(event);
              const isSearchHighlighted = highlightedEvents.has(event.id);
              const isTagHighlighted = event.isHighlighted === true;
              const isDimmed = event.isDimmed === true;

              // Get tag color for highlighting
              const tagColor = isTagHighlighted && event.tags?.[0]?.color || '#3b82f6';

              return (
                <div
                  key={event.id + (event.notationId || '')}
                  onClick={() => onEventClick(event)}
                  className={`p-4 hover:bg-gray-50 transition-all cursor-pointer ${
                    isSearchHighlighted ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
                  } ${isToday && !isSearchHighlighted && !isTagHighlighted ? 'bg-blue-50' : ''} ${
                    isDimmed ? 'opacity-40' : ''
                  } ${isTagHighlighted ? 'border-l-4 shadow-md' : ''}`}
                  style={isTagHighlighted ? {
                    borderLeftColor: tagColor,
                    backgroundColor: `${tagColor}08`,
                    boxShadow: `0 0 12px ${tagColor}20`
                  } : {}}
                >
                  <div className="flex items-start gap-4">
                    {/* Date column */}
                    <div className="flex-shrink-0 text-center min-w-[80px]">
                      <div className="text-xs text-gray-500 uppercase">
                        {eventDate.toFormat("MMM")}
                      </div>
                      <div className="text-xl font-bold text-gray-900">
                        {eventDate.toFormat("dd")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {eventDate.toFormat("EEE")}
                      </div>
                      {isToday && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                          Today
                        </span>
                      )}
                    </div>

                    {/* Event details */}
                    <div className="flex-grow">
                      {/* Title and icons */}
                      <div className="flex items-start gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 flex-grow">
                          {event.type === "notation"
                            ? event.notationTitle || event.title
                            : event.title || event.name}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {event.type === "external_link" && (
                            <FaExternalLinkAlt className="w-4 h-4 text-blue-500" title="External Link" />
                          )}
                          {event.type === "notation" && (
                            <span className="text-xs text-purple-600 italic">Note</span>
                          )}
                        </div>
                      </div>

                      {/* Time, Location, and Org */}
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-2">
                        {(event.time || event.startTime) && (
                          <div className="flex items-center gap-1">
                            <FaClock className="w-3 h-3" />
                            <span>{formatTimeDisplay(event)}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <FaMapMarkerAlt className="w-3 h-3" />
                            <span>{event.location}</span>
                          </div>
                        )}
                        {orgName && (
                          <span className="text-blue-600">{orgName}</span>
                        )}
                      </div>

                      {/* Description */}
                      {event.description && (
                        <p className="text-sm text-gray-600 line-clamp-1 mb-2">
                          {stripHtml(event.description)}
                        </p>
                      )}

                      {/* Status and Tags */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex px-2 py-1 text-xs rounded-full ${statusColor}`}>
                          {statusOption?.name || event.status || "Pending"}
                        </span>

                        {event.tags && event.tags.length > 0 && (
                          <div className="flex gap-2">
                            {event.tags.slice(0, 3).map((tag) => {
                              // Check if this specific tag is causing the highlighting
                              const isThisTagHighlighted = isTagHighlighted && event.tags.some(t => t.id === tag.id);
                              return (
                                <span
                                  key={tag.id || tag.name}
                                  className={`inline-flex px-3 py-1 text-xs rounded-full font-medium text-white ${
                                    isThisTagHighlighted ? 'ring-2 ring-offset-1' : ''
                                  }`}
                                  style={{
                                    backgroundColor: tag.color || '#6B7280',
                                    ...(isThisTagHighlighted ? {
                                      ringColor: tag.color,
                                      boxShadow: `0 0 6px ${tag.color}40`
                                    } : {})
                                  }}
                                >
                                  {tag.name}
                                </span>
                              );
                            })}
                            {event.tags.length > 3 && (
                              <span className="inline-flex px-3 py-1 text-xs rounded-full font-medium bg-gray-200 text-gray-700">
                                +{event.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
