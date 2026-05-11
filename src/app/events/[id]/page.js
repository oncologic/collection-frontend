"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { FaEdit, FaChevronDown, FaLock, FaTrash } from "react-icons/fa";
import Summary from "@/app/components/Summary";
import {
  useEvents,
  useUpdateEvent,
  useDeleteEvent,
} from "@/app/hooks/useEvents";

import {
  useGetEventById,
  useGetEventSponsorships,
} from "@/app/hooks/useEvents";
import { useGetPublicEventById } from "@/app/hooks/usePublicEvents";
import { usePublicAuth } from "@/app/hooks/usePublicAuth";
import Modal from "@/app/components/Modal";

import { useTags } from "@/app/hooks/useTags";
import Image from "next/image";

import { Tab, Tabs } from "@/app/components/common/Tabs";
import UserTable from "@/app/components/tables/UserTable";

import { EventDetail } from "@/app/components/events/EventDetail";
import AddEventForm from "@/app/components/forms/AddEvent";
import { useEventTypes, useExpertiseLevels } from "@/app/hooks/useMetadata";
import { useAuth, useOrganization } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { useOrganizations } from "@/app/hooks/useOrganizations";
import { useContextAuth } from "@/app/context/authContext";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import { DateTime } from "luxon";
import Link from "next/link";
import { TIME_ZONES_OPTIONS } from "@/app/constants/time";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const EventPage = () => {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeView, setActiveView] = useState("details");
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [externalLinksOpen, setExternalLinksOpen] = useState(false);
  const { data: tags = [] } = useTags();

  const queryClient = useQueryClient();
  const router = useRouter();

  // Get auth status FIRST before using it in hooks
  const { isSignedIn, isPublicAccess } = usePublicAuth();

  // Conditionally use public or authenticated hook
  const publicEventResult = useGetPublicEventById(id, {
    enabled: isPublicAccess || !isSignedIn,
  });
  const authenticatedEventResult = useGetEventById(id);

  // Use the appropriate result based on auth status
  const eventResult =
    isPublicAccess || !isSignedIn
      ? publicEventResult
      : authenticatedEventResult;

  const { data: event, isLoading: eventLoading, error } = eventResult;

  const { data: eventSponsorships, isLoading: eventSponsorshipsLoading } =
    useGetEventSponsorships(id);
  const { mutate: updateEvent } = useUpdateEvent();
  const { mutate: deleteEvent } = useDeleteEvent();
  const { data: expertiseLevels = [] } = useExpertiseLevels();
  const { data: eventTypes = [], isLoading: eventTypesLoading } =
    useEventTypes();
  const { data: organizations = [], isLoading: orgsLoading } =
    useOrganizations();
  const { isAdmin, selectedTenants, userId } = useContextAuth();
  // const { mutate: updateEvent } = useUpdateEvent();

  const handleUpdateEvent = async (updatedData) => {
    const token = await getToken();
    updateEvent(
      {
        id,
        event: updatedData,
        token,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      }
    );
  };

  const handleDeleteEvent = async () => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      deleteEvent(
        { id },
        {
          onSuccess: () => {
            toast.success("Event deleted successfully");
            router.push("/events");
          },
          onError: (error) => {
            toast.error(error.message || "Failed to delete event");
          },
        }
      );
    }
  };

  if (eventLoading) {
    return (
      <div className="w-3/4 mx-auto mb-20 ">
        <div className="flex flex-col gap-6 p-6">
          {/* Header with logo and title */}

          {/* Main content */}
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
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-600">
        <FaLock className="text-2xl text-gray-500" />
        <h2 className="text-2xl font-semibold mb-2">Event Not Available</h2>
        <p className="text-center">
          {error.message ||
            "This event is not available in your current tenant."}
          {selectedTenants?.length > 0 && (
            <span>, try switching to a different tenant.</span>
          )}
          {(!isSignedIn || isPublicAccess) && (
            <span className="block mt-4">
              <Link href="/events" className="text-blue-600 hover:underline">
                View all available events
              </Link>
            </span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`md:w-11/12 w-full mx-auto mb-20 ${
        isAdmin
          ? "mt-20"
          : !isSignedIn || isPublicAccess
          ? "mt-20 pt-4"
          : "mt-12"
      }`}
    >
      {isEditing && (
        <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
          <div className="bg-white p-6 rounded-lg mb-20 max-w-5xl mx-auto">
            <AddEventForm
              organizations={organizations}
              onSubmit={handleUpdateEvent}
              onClose={() => setIsEditing(false)}
              initialValues={{
                ...event,
                organizations: event.organizations.map((org) => ({
                  id: org.id,
                  name: org.name,
                })),
                typeId: event.typeId,
                expertiseLevelId: event.expertiseLevelId,
                tags: event?.tags,
                startDate: DateTime.fromISO(event.startDate).toFormat(
                  "yyyy-MM-dd"
                ),
                startTime: DateTime.fromISO(event.startDate).toFormat("HH:mm"),
                endDate: DateTime.fromISO(event.endDate).toFormat("yyyy-MM-dd"),
                endTime: DateTime.fromISO(event.endDate).toFormat("HH:mm"),
                registrationLink: event.url,
                visibility: event.visibility,
                timezone: TIME_ZONES_OPTIONS.find(
                  (zone) => zone.id === (event.timezone ?? "America/Chicago")
                ),
              }}
              isLoading={false}
              eventTypes={eventTypes}
              expertiseLevels={expertiseLevels}
              tags={tags}
              selectedTenants={selectedTenants}
              isAdmin={isAdmin}
            />
          </div>
        </Modal>
      )}

      {/* Details View */}
      {activeView === "details" && (
        <div className="mb-20 mt-6">
          {(isAdmin || (event && event.addedByUserId === userId)) && (
            <div className="z-10 justify-end flex mb-2 gap-2">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white/80 sm:backdrop-blur-sm rounded-md 
            border border-gray-200/80 hover:border-gray-300/80
            shadow-sm hover:shadow transition-all duration-200 
            text-gray-700 hover:text-gray-900
            text-sm font-medium"
              >
                <FaEdit className="text-[15px] text-gray-500" />
                <span>Edit Event</span>
              </button>
              {event && event.addedByUserId === userId && (
                <button
                  onClick={handleDeleteEvent}
                  className="flex items-center gap-2 px-3 py-2 bg-white/80 sm:backdrop-blur-sm rounded-md 
              border border-red-200/80 hover:border-red-300/80
              shadow-sm hover:shadow transition-all duration-200 
              text-red-600 hover:text-red-700
              text-sm font-medium"
                >
                  <FaTrash className="text-[15px] text-red-500" />
                  <span>Delete Event</span>
                </button>
              )}
            </div>
          )}
          <EventDetail
            event={event}
            onClose={() => setIsEditing(false)}
            sponsorships={eventSponsorships}
            isAdmin={isAdmin}
          />

          {/* Collections Section */}
          {event &&
            ((event.collections && event.collections.length > 0) ||
              (event.externalLinks && event.externalLinks.length > 0)) && (
              <div className="m-4 p-4 bg-white rounded-lg shadow-sm flex flex-col gap-2">
                {event.collections.length > 0 && (
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => setCollectionsOpen(!collectionsOpen)}
                  >
                    <h4 className="text-lg font-bold mb-2">
                      Collections ({event.collections.length})
                    </h4>
                    <FaChevronDown
                      className={`text-xl transition-transform duration-200 ease-in-out ${
                        collectionsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                )}

                {collectionsOpen && (
                  <ul className="flex flex-wrap gap-2 mb-2">
                    {event.collections.map((collection) => (
                      <li key={collection.id}>
                        <Link
                          href={`/collections/${collection.id}`}
                          className="inline-block px-3 py-1 border border-blue-500 rounded-full text-sm text-blue-500 hover:bg-blue-50 transition-colors"
                        >
                          {collection.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                {event.externalLinks.length > 0 && (
                  <>
                    <div
                      className="flex justify-between items-center cursor-pointer"
                      onClick={() => setExternalLinksOpen(!externalLinksOpen)}
                    >
                      <h4 className="text-lg font-bold mb-2">
                        External Links ({event.externalLinks.length})
                      </h4>
                      <FaChevronDown
                        className={`text-xl transition-transform duration-200 ease-in-out ${
                          externalLinksOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    {externalLinksOpen && (
                      <ul className="flex flex-wrap gap-2">
                        {event.externalLinks.map((externalLink) => (
                          <li key={externalLink.id}>
                            <Link
                              href={`/external-links/${externalLink.id}`}
                              className="inline-block px-3 py-1 border border-blue-500 rounded-full text-sm text-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              {externalLink.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            )}
        </div>
      )}

      {/* People Management View */}
      {activeView === "people" && isAdmin && (
        <div className="bg-white p-6 rounded-lg shadow-lg mb-20">
          <Tabs activeTab={activeTab} onChange={setActiveTab}>
            <Tab id="members" label="Members">
              <UserTable
                users={members}
                isLoading={usersLoading}
                onPromoteToAdmin={(userId) => handlePromoteToAdmin(userId)}
                type="member"
              />
            </Tab>
            <Tab id="admins" label="Administrators">
              <UserTable
                users={admins}
                isLoading={usersLoading}
                onRemoveAdmin={(userId) => handleRemoveAdmin(userId)}
                type="admin"
              />
            </Tab>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default EventPage;
