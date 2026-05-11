"use client";

import React, { useState, useEffect } from "react";
import { DateTime } from "luxon";
import TimeSlotPicker from "./TimeSlotPicker";
import { FaCopy, FaTimes, FaCalendarAlt, FaInfoCircle, FaGoogle } from "react-icons/fa";

const AvailabilityComposer = ({ selectedDates, onClose, allEvents = [] }) => {
  const [dayAvailability, setDayAvailability] = useState({});
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [copiedMessage, setCopiedMessage] = useState("");
  const [snippetText, setSnippetText] = useState("");

  // Sort dates chronologically
  const sortedDates = [...selectedDates].sort((a, b) => a - b);

  // Initialize availability for each selected date
  useEffect(() => {
    const initialAvailability = {};
    sortedDates.forEach((date) => {
      const dateStr = date.toISODate();
      if (!dayAvailability[dateStr]) {
        initialAvailability[dateStr] = [];
      }
    });
    setDayAvailability((prev) => ({ ...prev, ...initialAvailability }));
  }, [selectedDates]);

  // Update availability for a specific day
  const handleTimeSlotsChange = (dateStr, slots) => {
    setDayAvailability((prev) => ({
      ...prev,
      [dateStr]: slots,
    }));
  };

  // Format time for display
  const formatTime = (timeStr) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Generate the availability text snippet
  const generateSnippet = () => {
    let snippet = `Would 30 min during any of these times (all in ${timezone
      .split("/")[1]
      .replace("_", " ")}) work for you?\n\n`;

    sortedDates.forEach((date) => {
      const dateStr = date.toISODate();
      const slots = dayAvailability[dateStr] || [];

      if (slots.length > 0) {
        // Format date like "Tomorrow Tue Jul 1" or "Wed Jul 2"
        const dayName = date.toFormat("EEE");
        const monthDay = date.toFormat("MMM d");

        const relativeDay = date.hasSame(DateTime.now(), "day")
          ? "Today"
          : date.hasSame(DateTime.now().plus({ days: 1 }), "day")
          ? "Tomorrow"
          : "";

        const dateDisplay = relativeDay
          ? `${relativeDay} ${dayName} ${monthDay}`
          : `${dayName} ${monthDay}`;

        snippet += `- ${dateDisplay}:\n`;

        // Add time slots as sub-items
        slots.forEach((slot) => {
          const startTime = formatTime(slot.start);
          const endTime = formatTime(slot.end);
          snippet += `  • ${startTime} - ${endTime}\n`;
        });

        snippet += "\n";
      }
    });

    setSnippetText(snippet);
    return snippet;
  };

  // Update snippet whenever availability changes
  useEffect(() => {
    generateSnippet();
  }, [dayAvailability, timezone]);

  // Copy to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(snippetText);
      setCopiedMessage("Copied to clipboard!");
      setTimeout(() => setCopiedMessage(""), 2000);
    } catch (err) {
      setCopiedMessage("Failed to copy");
      setTimeout(() => setCopiedMessage(""), 2000);
    }
  };

  // Common timezones for quick selection
  const commonTimezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "Europe/London",
    "Europe/Paris",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col relative z-[10000]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="flex-1">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <FaCalendarAlt className="text-blue-600 text-base sm:text-xl" />
              <span className="truncate">Compose Availability</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">
              Click and drag on the time grid to select available slots
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-2"
          >
            <FaTimes className="text-gray-500" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-col gap-6">
            {/* Mobile: Show preview at top, Desktop: Show side by side */}
            <div className="block lg:hidden">
              {/* Preview for mobile */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">
                  Preview
                </h3>
                <div className="bg-white border border-gray-300 rounded-lg p-3 max-h-32 overflow-y-auto">
                  <pre className="whitespace-pre-wrap font-sans text-xs text-gray-700">
                    {snippetText ||
                      "Select time slots to generate availability text..."}
                  </pre>
                </div>
                <button
                  onClick={copyToClipboard}
                  disabled={!snippetText}
                  className={`mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                    snippetText
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <FaCopy />
                  Copy to Clipboard
                </button>
                {copiedMessage && (
                  <div className="text-center text-xs text-green-600 font-medium mt-2">
                    {copiedMessage}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Time pickers */}
              <div className="flex-1 space-y-6">
                <div className="sticky top-0 bg-white pb-4 z-10">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={timezone}>
                      {timezone.split("/")[1].replace("_", " ")}
                    </option>
                    {commonTimezones
                      .filter((tz) => tz !== timezone)
                      .map((tz) => (
                        <option key={tz} value={tz}>
                          {tz.split("/")[1].replace("_", " ")}
                        </option>
                      ))}
                  </select>
                </div>

                {sortedDates.map((date, index) => {
                  const dateStr = date.toISODate();
                  const formattedDate = date.toFormat("EEEE, MMMM d, yyyy");

                  // Filter and process events for this specific date
                  const dayEvents = allEvents
                    .filter((event) => {
                      const eventDate = event.startDate || event.date;
                      if (!eventDate) return false;

                      // Parse the event date
                      let eventDateTime;
                      try {
                        // Handle different date formats
                        if (eventDate.includes("T")) {
                          eventDateTime = DateTime.fromISO(eventDate);
                        } else if (eventDate.includes(" ")) {
                          eventDateTime = DateTime.fromISO(
                            eventDate.replace(" ", "T")
                          );
                        } else {
                          eventDateTime = DateTime.fromISO(eventDate);
                        }

                        // Check if it's the same day
                        return eventDateTime.hasSame(date, "day");
                      } catch (e) {
                        return false;
                      }
                    })
                    .map((event) => {
                      // Process each event to extract time information
                      const processedEvent = { ...event };
                      
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

                  // Count events by source
                  const googleEventsCount = dayEvents.filter(e => e.isGoogleCalendarEvent).length;
                  const otherEventsCount = dayEvents.length - googleEventsCount;

                  return (
                    <div
                      key={dateStr}
                      className={`bg-gray-50 rounded-lg p-4 border border-gray-200 ${
                        index !== sortedDates.length - 1 ? "mb-6" : ""
                      }`}
                    >
                      {/* Event count indicators */}
                      {dayEvents.length > 0 && (
                        <div className="mb-3 flex flex-wrap gap-2">
                          {googleEventsCount > 0 && (
                            <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                              <FaGoogle size={10} />
                              <span>{googleEventsCount} Google Calendar event{googleEventsCount > 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {otherEventsCount > 0 && (
                            <div className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md">
                              <FaCalendarAlt size={10} />
                              <span>{otherEventsCount} other event{otherEventsCount > 1 ? 's' : ''}</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-500 ml-auto">
                            (shown on timeline below)
                          </div>
                        </div>
                      )}
                      
                      <TimeSlotPicker
                        date={formattedDate}
                        onTimeSlotsChange={(slots) =>
                          handleTimeSlotsChange(dateStr, slots)
                        }
                        initialSlots={dayAvailability[dateStr] || []}
                        existingEvents={dayEvents}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Right side - Preview (Desktop only) */}
              <div className="hidden lg:block lg:w-96 space-y-4 sticky top-0">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <FaInfoCircle className="text-blue-600 mt-1" />
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold mb-1">How to use:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>
                          Click and drag on the time grid to select available
                          slots
                        </li>
                        <li>
                          Click &quot;Add 9-5&quot; for a quick standard workday
                        </li>
                        <li>Adjust times using the input fields</li>
                        <li>
                          Copy the generated text to share your availability
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Preview</h3>
                  <div className="bg-white border border-gray-300 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700">
                      {snippetText ||
                        "Select time slots to generate availability text..."}
                    </pre>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copyToClipboard}
                    disabled={!snippetText}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      snippetText
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <FaCopy />
                    Copy to Clipboard
                  </button>
                </div>

                {copiedMessage && (
                  <div className="text-center text-sm text-green-600 font-medium">
                    {copiedMessage}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityComposer;
