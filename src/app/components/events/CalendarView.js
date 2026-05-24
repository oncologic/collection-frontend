import { useRef, useEffect } from "react";
import { DateTime } from "luxon";
import { FaClock } from "react-icons/fa";

// Check if event has time information
export const hasTimeInfo = (event) => {
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
      // But also check if it's exactly midnight with seconds/milliseconds
      if (dt.isValid) {
        // If hour, minute, second, and millisecond are all 0, it's likely an all-day event
        const isExactMidnight = dt.hour === 0 && dt.minute === 0 && dt.second === 0 && dt.millisecond === 0;
        // If the date string contains 'T' followed by time, it likely has time info
        const hasTimeInString = event.startDate.includes('T') && !event.startDate.endsWith('T00:00:00.000Z');
        return !isExactMidnight || hasTimeInString;
      }
    } catch (e) {
      return false;
    }
  }
  
  return false;
};

// Calculate time position for calendar view (as percentage of day)
export const getTimePosition = (timeString) => {
  if (!timeString) return null;

  try {
    // First try to parse various time formats
    let hours, minutes;
    
    // Check for 12-hour format with AM/PM
    const twelveHourMatch = timeString.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/i);
    if (twelveHourMatch) {
      hours = parseInt(twelveHourMatch[1], 10);
      minutes = parseInt(twelveHourMatch[2], 10);
      const period = twelveHourMatch[3].toLowerCase();
      
      // Convert to 24-hour format
      if (period === 'pm' && hours !== 12) {
        hours += 12;
      } else if (period === 'am' && hours === 12) {
        hours = 0;
      }
    } else if (typeof timeString === "string" && timeString.includes(":")) {
      // Try standard HH:MM format
      const parts = timeString.split(":");
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1], 10);
    } else {
      return null;
    }
    
    // Validate parsed values
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      return null;
    }
    
    // Convert to minutes from midnight
    const totalMinutes = hours * 60 + minutes;
    // Calculate as percentage of day (1440 minutes in a day)
    return (totalMinutes / 1440) * 100;
  } catch (e) {
    console.error("Error parsing time:", timeString, e);
    return null;
  }
};

// Format time (handles both single time and time range with special case handling)
export const formatTimeDisplay = (event) => {
  if (!event) return null;

  // Helper to extract time from various formats
  const extractTime = (timeValue) => {
    if (!timeValue) return null;
    
    // If it's already in HH:mm format
    if (typeof timeValue === 'string' && timeValue.match(/^\d{1,2}:\d{2}$/)) {
      return timeValue;
    }
    
    // Try to parse as ISO timestamp
    try {
      const dt = DateTime.fromISO(timeValue);
      if (dt.isValid) {
        return dt.toFormat('HH:mm');
      }
    } catch (e) {
      // Ignore
    }
    
    return timeValue;
  };

  // Handle start time
  let startTimeFormatted = null;
  const startTime = event.startTime || event.time || extractTime(event.startDate);

  if (startTime) {
    try {
      const timeStr = extractTime(startTime);
      if (timeStr && timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(":").map(n => parseInt(n, 10));
        const hour = hours;
        const ampm = hour >= 12 ? "pm" : "am";
        const hour12 = hour % 12 || 12;
        startTimeFormatted = `${hour12}:${(minutes || 0).toString().padStart(2, '0')} ${ampm}`;
      } else {
        startTimeFormatted = timeStr;
      }
    } catch (e) {
      startTimeFormatted = startTime;
    }
  }

  // Handle end time if available
  let endTimeFormatted = null;
  const endTime = event.endTime || extractTime(event.endDate);
  
  if (endTime && endTime !== startTime) {
    try {
      const timeStr = extractTime(endTime);
      if (timeStr && timeStr.includes(':')) {
        const [hours, minutes] = timeStr.split(":").map(n => parseInt(n, 10));
        const hour = hours;
        const ampm = hour >= 12 ? "pm" : "am";
        const hour12 = hour % 12 || 12;
        endTimeFormatted = `${hour12}:${(minutes || 0).toString().padStart(2, '0')} ${ampm}`;
      } else {
        endTimeFormatted = timeStr;
      }
    } catch (e) {
      endTimeFormatted = endTime;
    }
  }

  // Add timezone if different from user's timezone
  let timezoneDisplay = "";
  if (
    event.timezone &&
    event.timezone !== Intl.DateTimeFormat().resolvedOptions().timeZone
  ) {
    timezoneDisplay = ` (${event.timezone.split("/").pop().replace("_", " ")})`;
  }

  // Combine start and end times if both exist
  if (startTimeFormatted && endTimeFormatted) {
    return `${startTimeFormatted} - ${endTimeFormatted}${timezoneDisplay}`;
  } else if (startTimeFormatted) {
    return `${startTimeFormatted}${timezoneDisplay}`;
  }

  return null;
};

const CalendarView = ({
  events = [],
  onEventClick,
  date = DateTime.now().startOf("day"),
  height = "600px",
}) => {
  const calendarRef = useRef(null);

  // Generate hour markers for calendar view
  const hourMarkers = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12;
    const ampm = i >= 12 ? "PM" : "AM";
    return `${hour} ${ampm}`;
  });

  // Scroll to 7 AM when calendar view is shown
  useEffect(() => {
    if (calendarRef.current) {
      // Calculate 7 AM position (7/24 = 0.2916...)
      const scrollPosition = calendarRef.current.scrollHeight * 0.2916;
      calendarRef.current.scrollTop = scrollPosition;
    }
  }, []);

  return (
    <div className="relative border border-gray-200 rounded-lg mt-2 mb-4">
      {/* Main scrollable container */}
      <div
        ref={calendarRef}
        className="relative overflow-y-auto"
        style={{ height }}
      >
        <div className="relative min-h-[1200px] flex">
          {/* Hour markers - now inside scrollable container */}
          <div className="w-14 border-r border-gray-200 bg-gray-50 text-xs text-gray-500 flex-shrink-0">
            {hourMarkers.map((hour, index) => (
              <div
                key={index}
                className="relative w-full border-t border-gray-200 px-1 flex items-center justify-start"
                style={{ height: `${100 / 24}%` }}
              >
                {hour}
              </div>
            ))}
          </div>

          {/* Event container */}
          <div className="flex-1 relative">
            {/* Hour grid lines */}
            {hourMarkers.map((_, index) => (
              <div
                key={index}
                className="absolute left-0 w-full border-t border-gray-100"
                style={{ top: `${(index / 24) * 100}%`, height: "1px" }}
              />
            ))}

            {/* Current time indicator */}
            <div
              className="absolute left-0 w-full border-t-2 border-red-500 z-10"
              style={{
                top: `${
                  ((DateTime.now().hour * 60 + DateTime.now().minute) / 1440) *
                  100
                }%`,
                width: "100%",
              }}
            >
              <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-red-500"></div>
            </div>

            {/* Events */}
            {events.filter(e => hasTimeInfo(e)).length === 0 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center text-gray-400">
                <div className="text-sm font-medium mb-2">No events with specific times</div>
                <div className="text-xs">Check the all-day events section below</div>
              </div>
            )}
            {events.map((event) => {
              // Skip events without time
              if (!hasTimeInfo(event)) {
                return null;
              }

              // Extract time from various formats
              let startTime = event.startTime || event.time;
              let endTime = event.endTime;
              
              // If no direct time fields, try to extract from timestamps
              if (!startTime && event.startDate) {
                try {
                  const dt = DateTime.fromISO(event.startDate);
                  if (dt.isValid) {
                    startTime = dt.toFormat('HH:mm');
                  }
                } catch (e) {
                  // Ignore
                }
              }
              
              if (!endTime && event.endDate) {
                try {
                  const dt = DateTime.fromISO(event.endDate);
                  if (dt.isValid) {
                    endTime = dt.toFormat('HH:mm');
                  }
                } catch (e) {
                  // Ignore
                }
              }

              if (!startTime) {
                return null;
              }

              const startPosition = getTimePosition(startTime);

              // Calculate height based on duration
              let eventHeight = 5; // Default height
              if (startTime && endTime) {
                const startPos = getTimePosition(startTime);
                const endPos = getTimePosition(endTime);

                if (startPos !== null && endPos !== null) {
                  eventHeight = Math.max(endPos - startPos, 2);
                }
              }

              if (startPosition === null) {
                return null;
              }

              // Determine status
              const status = event.status?.toLowerCase() || "pending";
              const isCompleted = status === "completed";
              const isWaiting = status === "waiting";
              const isCancelled = status === "cancelled";

              // Color based on type
              let bgColor = "bg-gray-100";
              let textColor = "text-gray-800";
              let borderColor = "border-gray-300";

              if (event.type === "external_link") {
                bgColor = "bg-indigo-50";
                textColor = "text-indigo-800";
                borderColor = "border-indigo-200";
              } else if (event.type === "notation") {
                bgColor = "bg-purple-50";
                textColor = "text-purple-800";
                borderColor = "border-purple-200";
              }

              // Adjust for status
              if (isCompleted || isCancelled) {
                bgColor = "bg-gray-100";
                textColor = "text-gray-500";
                borderColor = "border-gray-200";
              }

              return (
                <div
                  key={event.id + (event.notationId || "")}
                  className={`absolute left-1 right-1 rounded-md border ${borderColor} ${bgColor} ${textColor} p-2 shadow-sm overflow-hidden text-xs cursor-pointer hover:shadow-md transition-shadow`}
                  style={{
                    top: `${startPosition}%`,
                    height: `${eventHeight}%`,
                    minHeight: "24px",
                    zIndex: 5,
                  }}
                  onClick={() => onEventClick && onEventClick(event)}
                >
                  <div className="font-medium truncate flex items-center gap-1">
                    {event.title || event.name}
                  </div>
                  <div className="text-xs opacity-75 truncate flex items-center gap-1">
                    <FaClock size={8} />
                    {formatTimeDisplay(event) || (startTime && startTime.includes(':') ? startTime.split(":").slice(0, 2).join(":") : '')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* No time events section */}
        {events.filter((event) => !hasTimeInfo(event)).length > 0 && (
          <div className="sticky bottom-0 left-0 right-0 border-t border-gray-300 bg-gray-50 p-2">
            <div className="text-xs font-medium text-gray-500 mb-1">
              All-day events:
            </div>
            <div className="flex flex-wrap gap-2">
              {events
                .filter((event) => !hasTimeInfo(event))
                .map((event) => (
                  <button
                    key={event.id + (event.notationId || "")}
                    onClick={() => onEventClick && onEventClick(event)}
                    className={`px-2 py-1 rounded-md text-xs flex items-center gap-1 ${
                      event.type === "external_link"
                        ? "bg-indigo-100 text-indigo-700"
                        : event.type === "notation"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-700"
                    } hover:opacity-80 truncate max-w-full`}
                  >
                    <span className="truncate">{event.title || event.name}</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
