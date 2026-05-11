"use client";

import { useState } from "react";
import { useEvents, useCreateEvent } from "../../hooks/useEvents";
import { useOrganizations } from "../../hooks/useOrganizations";
import { DateTime } from "luxon";
import Calendar from "./Calendar";
import AddEventModal from "./AddEventModal";
import UpcomingEvents from "./UpcomingEvents";
import LoadingSkeleton from "../LoadingSkeleton";

export default function MainCalendar() {
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: organizations = [], isLoading: orgsLoading } =
    useOrganizations();
  const { mutate: createEvent } = useCreateEvent();

  const [modalOpen, setModalOpen] = useState(false);

  const handleAddEvent = (data) => {
    createEvent({
      title: data.title,
      description: data.description,
      date: DateTime.fromISO(data.startDate).toISO(),
      organizationId: data.organizationId,
    });
    setModalOpen(false);
  };

  if (eventsLoading || orgsLoading)
    return (
      <div className="grid md:grid-cols-2 gap-6 mt-20 opacity-50">
        {/* Left column */}
        <LoadingSkeleton
          lines={5}
          height="32px"
          width={[70, 65, 70, 65]}
          spacing="1.5rem"
        />

        {/* Right column */}
        <LoadingSkeleton
          lines={5}
          height="32px"
          width={[70, 65, 70, 65]}
          spacing="1.5rem"
        />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 p-4 text-slate-700">
      <div className="max-w-8xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="col-span-1 space-y-4">
          {!eventsLoading && (
            <UpcomingEvents events={events} organizations={organizations} />
          )}
          <button
            onClick={() => setModalOpen(true)}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
          >
            Add New Event
          </button>
        </div>

        <div className="col-span-1 md:col-span-2">
          <Calendar events={events} organizations={organizations} />
        </div>
      </div>

      <AddEventModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAddEvent}
        organizations={organizations}
        shouldCloseOnOverlayClick={false}
      />
    </div>
  );
}
