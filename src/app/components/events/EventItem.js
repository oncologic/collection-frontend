import React from "react";
import PropTypes from "prop-types";
import OrganizationBadge from "./EventItem";
import { DateTime } from "luxon";
import RichTextDisplay from "../RichTextDisplay";

export default function EventItem({ event, organization }) {
  // Check if event is defined and has the expected properties
  if (!event || !event.startDate) {
    return null;
  }

  const eventDate = new Date(event.startDate);
  const timeStr = eventDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = eventDate.toLocaleDateString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const viewerTz = Intl.startDateTimeFormat().resolvedOptions().timeZone;
  const displayedTime = DateTime.fromISO(event.startDate, {
    zone: viewerTz,
  }).toFormat("MMMM d, yyyy h:mm a");

  const dayOfWeek = eventDate.toLocaleDateString([], { weekday: "long" });

  return (
    <div className="flex flex-col p-4 mb-3 rounded-lg shadow hover:shadow-md transition-shadow bg-white">
      <h2 className="text-lg font-bold text-gray-800 bg-blue-100 p-1 rounded-sm text-center mb-2">
        {dayOfWeek}
      </h2>
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">{event.title}</h3>
        {organization && <OrganizationBadge organization={organization} />}
      </div>
      <RichTextDisplay content={event.description} />

      <div className="mt-2 text-sm text-gray-500">
        {dateStr} {timeStr}
      </div>
      <p>Date: {displayedTime}</p>
    </div>
  );
}

// PropTypes for validation (optional)
EventItem.propTypes = {
  event: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    date: PropTypes.string.isRequired,
  }),
};
