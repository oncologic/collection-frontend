"use client";

import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { FaTimes } from "react-icons/fa";
import { useEvents, useEventsForSubscriptions } from "../../hooks/useEvents";
import {
  useOrganizations,
  useUserSubscriptions,
} from "../../hooks/useOrganizations";
import {
  useGetResources,
  useResourcesForSubscriptions,
} from "../../hooks/useResources";
import OrganizationCard from "../OrganizationCard";
import ResourceCard from "../cards/ResourceCard";
import Fundraiser from "../cards/EventCard";

const SubscribedContentModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("subscribed");

  // Fetch data
  const { data: subscribedEvents = [] } = useEventsForSubscriptions({
    enabled: activeTab === "subscribed",
  });
  const { data: allEvents = [] } = useEvents({
    enabled: activeTab === "all",
  });
  const { data: subscribedOrganizations = [] } = useUserSubscriptions();
  const { data: allOrganizations = [] } = useOrganizations();
  const { data: subscribedResources = [] } = useResourcesForSubscriptions({
    enabled: activeTab === "subscribed",
  });
  const { data: allResources = [] } = useGetResources({
    enabled: activeTab === "all",
  });

  // Display data based on active tab
  const displayEvents =
    activeTab === "subscribed" ? subscribedEvents : allEvents;
  const displayResources =
    activeTab === "subscribed" ? subscribedResources : allResources;
  const displayOrganizations =
    activeTab === "subscribed" ? subscribedOrganizations : allOrganizations;

  const tabs = [
    { id: "subscribed", label: "Favorites" },
    { id: "all", label: "All" },
  ];

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex items-center justify-center min-h-screen">
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />

        <div className="relative bg-white w-full max-w-7xl mx-4 rounded-xl shadow-2xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <Dialog.Title className="text-xl font-semibold text-gray-900">
              Content Library
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex gap-4">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="overflow-y-auto p-6 max-h-[calc(90vh-140px)]">
            <div className="space-y-8">
              {/* Organizations Section */}
              {displayOrganizations.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Organizations
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayOrganizations.map((org) => (
                      <OrganizationCard key={org.id} org={org} />
                    ))}
                  </div>
                </section>
              )}

              {/* Resources Section */}
              {displayResources.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Resources
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayResources.map((resource) => (
                      <ResourceCard key={resource.id} resource={resource} />
                    ))}
                  </div>
                </section>
              )}

              {/* Events Section */}
              {displayEvents.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Events
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayEvents.map((event) => (
                      <Fundraiser key={event.id} event={event} />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty State */}
              {!displayOrganizations.length &&
                !displayResources.length &&
                !displayEvents.length && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Content Found
                    </h3>
                    <p className="text-gray-500">
                      {activeTab === "subscribed"
                        ? "You haven't favorited any content yet."
                        : "No content available."}
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default SubscribedContentModal;
