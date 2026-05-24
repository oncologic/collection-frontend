import { DateTime } from "luxon";
import Image from "next/image";
import Link from "next/link";
import CustomEditor from "../common/CustomEditor";
import { calculateEventDuration } from "@/app/utils/general";
import SponsorshipOptions from "./SponsorshipOptions";
import { useState } from "react";
import Modal from "../Modal";
import {
  FaHandshake,
  FaArrowRight,
  FaCalendar,
  FaThumbtack,
} from "react-icons/fa";
import {
  usePinItems,
  useUnpinItems,
  useGetPinnedItems,
} from "@/app/hooks/usePinned";
import { useAuth } from "@clerk/nextjs";
import { toast } from "react-hot-toast";

export const EventDetail = ({
  event,
  showActions = true,
  onClose,
  isAdmin = false,
  sponsorships,
  hasSponsorships,
  isModal = false,
  isExternal = false,
}) => {
  const [view, setView] = useState("details");
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showBundles, setShowBundles] = useState(false);

  // Add check for sponsorships structure
  const hasSponsorshipsItems =
    sponsorships?.eventTiers?.length > 0 ||
    sponsorships?.collections?.length > 0;
  const hasBundles = sponsorships?.collections?.length > 0;

  // Check if user is signed in
  const { isSignedIn } = useAuth();

  // Add the pin mutation hook (only used if signed in)
  const { mutateAsync: pinItemsAsync } = usePinItems();
  const { mutateAsync: unpinItemsAsync } = useUnpinItems();
  const { data: pinnedItems } = useGetPinnedItems();

  // Add memo to check if event is pinned
  const isPinned = pinnedItems?.some((item) => item.id === event.id);

  const handleSponsorshipClick = () => {
    if (hasBundles && view !== "sponsorship") {
      setShowBundleModal(true);
    }
    setView("sponsorship");
  };

  const BundleModal = () => {
    // Helper function to deduplicate events
    const getUniqueEvents = (collections) => {
      const uniqueEvents = new Map();

      collections.forEach((collection) => {
        collection.tiers.forEach((tier) => {
          tier.events.forEach((event) => {
            if (!uniqueEvents.has(event.id)) {
              uniqueEvents.set(event.id, event);
            }
          });
        });
      });

      return Array.from(uniqueEvents.values());
    };

    const uniqueBundleEvents = getUniqueEvents(sponsorships.collections);

    return (
      <Modal onClose={() => setShowBundleModal(false)} maxWidth="md:max-w-2xl">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-8">
            <div className="text-slate-700">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <FaHandshake className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold">
                  Bundle Opportunities Available!
                </h3>
              </div>

              <p className="text-slate-500 mb-6">
                This event has bundled sponsorship opportunities available that
                includes additional events.
              </p>

              <div className="border border-slate-400/50 shadow-lg rounded-xl p-6 mb-6">
                <h4 className="text-lg font-semibold mb-4">
                  Available in Bundle:
                </h4>
                <div className="space-y-3 text-white">
                  {uniqueBundleEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 p-3 bg-slate-800 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center ">
                        <span className="text-xs text-blue-400">
                          <FaCalendar />
                        </span>
                      </div>
                      <div>
                        <h5 className="font-medium">{event.name}</h5>
                        <p className="text-sm text-slate-400 overflow-y-auto">
                          {event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer with buttons - always visible */}
          <div className="flex flex-col sm:flex-row gap-4 p-6 border-t bg-white">
            <button
              onClick={() => {
                setShowBundles(true);
                setShowBundleModal(false);
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 
                rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-white"
            >
              <span>View Bundle Options</span>
              <FaArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowBundles(false);
                setShowBundleModal(false);
              }}
              className="flex-1 px-6 py-3 bg-slate-700 rounded-xl font-medium 
                hover:bg-slate-700 transition-all duration-200 text-white"
            >
              View Event-Only Options
            </button>
          </div>
        </div>
      </Modal>
    );
  };

  if (!event) return null;

  const startDate = DateTime.fromISO(event.startDate, { zone: "utc" }).setZone(
    event.timezone
  );
  const endDate = DateTime.fromISO(event.endDate, { zone: "utc" }).setZone(
    event.timezone
  );

  const dateStr = startDate.toFormat("MMMM d, yyyy");
  const endDateStr = endDate.toFormat("MMMM d, yyyy");
  const timeStr = `${startDate.toFormat("h:mm a")} - ${endDate.toFormat(
    "h:mm a"
  )} ${startDate.toFormat("ZZZZ")}`.replace("Time", "");

  return (
    <div className="w-full p-2 md:p-4 pb-10 ">
      {/* Update sponsorships check */}
      {hasSponsorshipsItems && (
        <div className="flex justify-center mb-6 pt-4">
          <div className="flex space-x-2 bg-white/5 sm:backdrop-blur-sm p-1 rounded-lg">
            <button
              onClick={() => setView("details")}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 ${
                view === "details"
                  ? "bg-gradient-to-r from-indigo-400/80 to-blue-400/80 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-500"
              } text-sm sm:text-base`}
            >
              {isExternal ? "External Link" : "Event Details"}
            </button>
            <button
              onClick={handleSponsorshipClick}
              className={`px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 ${
                view === "sponsorship"
                  ? "bg-gradient-to-r from-indigo-500/80 to-blue-400/80 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-500"
              } text-sm sm:text-base`}
            >
              Sponsorship Options
            </button>
          </div>
        </div>
      )}

      {/* Show bundle modal when applicable */}
      {showBundleModal && <BundleModal />}

      {/* Update conditional rendering */}
      {!hasSponsorshipsItems || view === "details" ? (
        <>
          {/* Header Section */}
          <div className="bg-slate-700 text-white rounded-md py-4 px-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {event.organizations && event.organizations.length > 0 && (
                <div className="flex justify-center sm:justify-start items-center rounded-md gap-2">
                  {[...event.organizations]
                    .sort((a, b) => (b.primary === true) - (a.primary === true))
                    .map(
                      (org) =>
                        org.imageUrl && org.imageUrl !== "null" && org.imageUrl !== null ? (
                          <div
                            key={org.id}
                            className="relative w-24 h-24 bg-white rounded-md"
                          >
                            <Image
                              src={org.imageUrl}
                              alt={org.name}
                              fill
                              className="object-contain rounded-md"
                            />
                          </div>
                        ) : null
                    )}
                </div>
              )}

              <div className="space-y-2">
                <h2 className="text-2xl font-bold">{event.title}</h2>
                <div className="flex flex-wrap gap-2">
                  {!isExternal && (
                    <>
                      <span className="inline-flex items-center rounded-full bg-blue-500 bg-opacity-30 px-2 py-0.5 text-xs sm:text-sm font-medium text-white ring-1 ring-inset ring-white/10">
                        {event.eventType}
                      </span>

                      {event.tags?.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center rounded-full bg-blue-500 bg-opacity-30 px-2 py-0.5 text-xs sm:text-sm font-medium text-white ring-1 ring-inset ring-white/10"
                        >
                          {tag.tagName || tag.name}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div
            className={`grid grid-cols-1 ${
              !isExternal ? "md:grid-cols-2" : ""
            } gap-6`}
          >
            {/* Left Column - Details */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Details
                </h3>
                <div className="text-gray-600  overflow-y-auto max-h-[500px]">
                  <CustomEditor content={event.description} readOnly={true} showBorder={false} />
                </div>
              </div>
            </div>

            {/* Right Column - Event Info */}
            {!isExternal && (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Event Information
                  </h3>
                  <div className="space-y-4 text-sm text-gray-600 ">
                    <p className="text-lg">
                      <span className="font-semibold">Date:</span>{" "}
                      {dateStr === endDateStr
                        ? `${dateStr}`
                        : `${dateStr} - ${endDateStr}`}
                      <br />
                      <div className="text-sm">
                        <p>
                          <span className="font-semibold">Start Time:</span>{" "}
                          {startDate.toFormat("h:mm a")}{" "}
                          {startDate.toFormat("ZZZZ").replace("Time", "")}
                        </p>
                        <p>
                          <span className="font-semibold">End Time: </span>{" "}
                          {endDate.toFormat("h:mm a")}{" "}
                          {startDate.toFormat("ZZZZ").replace("Time", "")}
                        </p>
                        <p>
                          <span className="font-semibold">Duration: </span>
                          {calculateEventDuration(startDate, endDate)}
                        </p>
                      </div>
                    </p>
                    <div className="flex flex-col gap-1">
                      <p>
                        <span className="font-semibold">Event Type:</span>{" "}
                        {event.eventType}
                      </p>
                      <p>
                        <span className="font-semibold">Experience Level:</span>{" "}
                        {event.expertiseLevel}
                      </p>
                      {/* <p>
                      <span className="font-semibold">Registration Required:</span>{" "}
                      {event.requiresRegistration ? "Yes" : "No"}
                    </p> */}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <SponsorshipOptions
          event={event}
          sponsorships={sponsorships}
          showBundledTiers={showBundles}
          onBundleToggle={() => setShowBundles(!showBundles)}
        />
      )}

      {/* Footer Actions */}
      <div className="mt-8 flex flex-col-reverse sm:flex-row justify-end items-center gap-4">
        {/* Primary Actions Group */}
        <div className="flex flex-wrap justify-center gap-3">
          {/* Add pin button - only show if signed in */}
          {isSignedIn && (
            <button
              className="px-4 py-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50/80 backdrop-blur-sm transition-all duration-200"
              onClick={async () => {
                try {
                  if (isPinned) {
                    await unpinItemsAsync([event.id]);
                    toast.success("Event unpinned successfully");
                  } else {
                    await pinItemsAsync([
                      {
                        id: event.id,
                        type: "event",
                        name: event.title,
                        description: event.description || "",
                        metadata: {
                          eventType: event.eventType || null,
                          organizations:
                            event.organizations?.map((org) => org.name) || [],
                          tags: event.tags?.map((tag) => tag.name) || [],
                          startDate: event.startDate,
                          endDate: event.endDate,
                          timezone: event.timezone,
                          location: `${event.locationCity}, ${event.locationState}`,
                          virtualEvent: event.virtualEvent,
                          inPersonEvent: event.inPersonEvent,
                        },
                      },
                    ]);
                    toast.success("Event pinned successfully");
                  }
                } catch (error) {
                  console.error("Error toggling pin state:", error);
                  toast.error("Failed to update pin state");
                }
              }}
              title={isPinned ? "Unpin event" : "Pin event"}
            >
              <FaThumbtack
                className={`w-4 h-4 ${
                  isPinned ? "text-blue-400" : "text-gray-300"
                }`}
              />
            </button>
          )}

          {/* Existing buttons */}
          {isModal && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
              Close
            </button>
          )}
        </div>

        {/* Secondary Actions Group */}
        <div className="flex flex-wrap justify-center gap-3">
          {isModal && (
            <Link
              href={`${
                isExternal
                  ? `/external-links/${event.id}`
                  : `/events/${event.id}`
              }`}
              className="px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
            >
              {isExternal ? "External Link" : "Event Details"}
            </Link>
          )}

          {event.url && (
            <Link
              target="_blank"
              href={event.url}
              className="px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
            >
              Go to Website
            </Link>
          )}

          {event.requiresRegistration && (
            <button className="px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40">
              Register Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
