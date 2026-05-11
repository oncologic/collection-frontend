import { useState } from "react";
import { DateTime } from "luxon";
import Image from "next/image";
import EventPickerModal from "./EventPickerModal";
import DOMPurify from "dompurify";

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

export function YearView({ events, organizations, onEventClick, onDayClick }) {
  const [currentYear, setCurrentYear] = useState(DateTime.now().year);
  const [eventPickerEvents, setEventPickerEvents] = useState(null);

  // Create array of months for the year
  const months = Array.from({ length: 12 }, (_, i) =>
    DateTime.fromObject({ year: currentYear, month: i + 1 })
  );

  // Map events by date (reusing your existing logic but simplified)
  const eventsByDate = {};
  events.forEach((event) => {
    const start = DateTime.fromISO(event.startDate.replace(" ", "T"));
    const end = DateTime.fromISO(event.endDate.replace(" ", "T"));

    if (!start.isValid || !end.isValid) return;

    let current = start;
    while (current <= end) {
      const eventKey = current.toISODate();
      if (!eventsByDate[eventKey]) eventsByDate[eventKey] = [];
      eventsByDate[eventKey].push(event);
      current = current.plus({ days: 1 });
    }
  });

  const handleDateClick = (date, dayEvents) => {
    if (dayEvents.length === 1) {
      onEventClick(dayEvents[0]);
    } else if (dayEvents.length > 1) {
      // Sort events by start time for the picker
      const sortedEvents = [...dayEvents].sort((a, b) => {
        const aTime = DateTime.fromISO(a.startDate.replace(" ", "T"));
        const bTime = DateTime.fromISO(b.startDate.replace(" ", "T"));
        return aTime - bTime;
      });
      setEventPickerEvents(sortedEvents);
    } else {
      // If no events, just switch to day view
      onDayClick(date);
    }
  };

  const handleEventSelect = (event) => {
    onEventClick(event);
    setEventPickerEvents(null);
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">{currentYear}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentYear((y) => y - 1)}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            &lt;
          </button>
          <button
            onClick={() => setCurrentYear((y) => y + 1)}
            className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
          >
            &gt;
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((month) => (
          <div
            key={month.toFormat("yyyy-MM")}
            className="border rounded-lg p-2 bg-white"
          >
            <div className="text-sm font-semibold mb-1">
              {month.toFormat("MMMM")}
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-[0.65rem]">
              {/* Day headers */}
              {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                <div key={day} className="text-center text-gray-500">
                  {day}
                </div>
              ))}

              {/* Empty cells for padding */}
              {Array.from({ length: month.startOf("month").weekday % 7 }).map(
                (_, i) => (
                  <div key={`empty-start-${i}`} className="aspect-square" />
                )
              )}

              {/* Date cells */}
              {Array.from({ length: month.daysInMonth }, (_, i) => {
                const date = month.set({ day: i + 1 });
                const dateKey = date.toISODate();
                const dayEvents = eventsByDate[dateKey] || [];
                const isToday = date.hasSame(DateTime.now(), "day");

                return (
                  <div
                    key={dateKey}
                    onClick={() => handleDateClick(date, dayEvents)}
                    className={`aspect-square relative flex items-center justify-center text-center cursor-pointer hover:bg-gray-100
                      ${isToday ? "ring-4 ring-blue-300 rounded-full" : ""}`}
                  >
                    <span className="text-[0.65rem] sm:text-xs">{i + 1}</span>
                    {dayEvents.length > 0 && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                        {dayEvents.length === 1 ? (
                          dayEvents[0].organizations?.[0]?.imageUrl ? (
                            <div className="relative w-2 h-2 sm:w-3 sm:h-3">
                              <Image
                                width={32}
                                height={32}
                                src={dayEvents[0].organizations[0].imageUrl}
                                alt=""
                                className="object-contain rounded-full"
                              />
                            </div>
                          ) : (
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full" />
                          )
                        ) : (
                          <div className="text-[0.6rem] sm:text-xs font-medium text-blue-600">
                            +{dayEvents.length}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {eventPickerEvents && (
        <EventPickerModal
          events={eventPickerEvents}
          onSelect={handleEventSelect}
          onClose={() => setEventPickerEvents(null)}
        />
      )}
    </div>
  );
}
