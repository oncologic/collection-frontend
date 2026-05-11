import { DateTime } from "luxon";
import { FaClock, FaMapMarkerAlt, FaCalendar } from "react-icons/fa";
import Link from "next/link";

// Helper to format time display
const formatEventTime = (event) => {
  if (!event?.startDate) return null;
  
  try {
    const dt = DateTime.fromISO(event.startDate);
    if (!dt.isValid) return null;
    
    // Check if it has a meaningful time (not midnight)
    const hasMeaningfulTime = dt.hour !== 0 || dt.minute !== 0;
    
    if (!hasMeaningfulTime && !event.startTime && !event.time) {
      return null; // All-day event
    }
    
    // Use explicit startTime if available, otherwise extract from startDate
    if (event.startTime) {
      const [hours, minutes] = event.startTime.split(":").map(n => parseInt(n, 10));
      const hour12 = hours % 12 || 12;
      const ampm = hours >= 12 ? "PM" : "AM";
      const startFormatted = `${hour12}:${(minutes || 0).toString().padStart(2, "0")} ${ampm}`;
      
      // Add end time if available
      if (event.endTime) {
        const [endHours, endMinutes] = event.endTime.split(":").map(n => parseInt(n, 10));
        const endHour12 = endHours % 12 || 12;
        const endAmpm = endHours >= 12 ? "PM" : "AM";
        return `${startFormatted} - ${endHour12}:${(endMinutes || 0).toString().padStart(2, "0")} ${endAmpm}`;
      }
      
      return startFormatted;
    }
    
    // Format from the DateTime object
    const timeFormatted = dt.toFormat("h:mm a");
    
    // Check for end time
    if (event.endDate) {
      const endDt = DateTime.fromISO(event.endDate);
      if (endDt.isValid && (endDt.hour !== 0 || endDt.minute !== 0)) {
        return `${timeFormatted} - ${endDt.toFormat("h:mm a")}`;
      }
    }
    
    return timeFormatted;
  } catch (e) {
    return null;
  }
};

export default function UpcomingEvents({ events, organizations }) {
  const orgMap = organizations.reduce((acc, org) => {
    acc[org.id] = org;
    return acc;
  }, {});

  const upcoming = events
    .filter((e) => {
      const eventDate = DateTime.fromISO(e.startDate);
      return (
        eventDate >= DateTime.local() &&
        eventDate <= DateTime.local().plus({ weeks: 2 })
      );
    })
    .sort(
      (a, b) => DateTime.fromISO(a.startDate) - DateTime.fromISO(b.startDate)
    );

  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Upcoming Events</h2>
      {upcoming.length === 0 && (
        <p className="text-gray-500 text-sm">No upcoming events in the next 2 weeks.</p>
      )}
      <div className="space-y-3">
        {upcoming.map((ev) => {
          const eventDate = DateTime.fromISO(ev.startDate);
          const dateStr = eventDate.toFormat("EEE, MMM d");
          const timeStr = formatEventTime(ev);
          const org = ev.organizations?.[0] || orgMap[ev.organizationId];
          
          return (
            <Link
              key={ev.id}
              href={`/events/${ev.id}`}
              className="block p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {ev.title}
              </h3>
              
              <div className="flex flex-col gap-1 text-sm text-gray-600">
                {/* Date */}
                <div className="flex items-center gap-2">
                  <FaCalendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span>{dateStr}</span>
                </div>
                
                {/* Time */}
                {timeStr && (
                  <div className="flex items-center gap-2">
                    <FaClock className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="font-medium text-gray-700">{timeStr}</span>
                  </div>
                )}
                
                {/* Location */}
                {(ev.locationCity || ev.locationState) && (
                  <div className="flex items-center gap-2">
                    <FaMapMarkerAlt className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <span>
                      {[ev.locationCity, ev.locationState].filter(Boolean).join(", ")}
                    </span>
                  </div>
                )}
                
                {/* Organization */}
                {org && (
                  <div className="mt-1 text-xs text-gray-500">
                    {org.name}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
