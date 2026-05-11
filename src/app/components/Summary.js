"use client";

import Fundraiser from "./cards/EventCard";
import { useEvents } from "../hooks/useEvents";
import { useOrganizations } from "../hooks/useOrganizations";
import OrganizationCard from "../components/OrganizationCard";
import { DateTime } from "luxon";
import { mockSurveys } from "../api/api";
import { SurveyCard } from "../components/SurveyCard";
import ResourceCard from "./cards/ResourceCard";
import { useContextAuth } from "../context/authContext";

const Summary = ({ events, surveys, resources }) => {
  //   const { data: events = [], isLoading: eventsLoading } = useEvents();
  //   const { data: organizations = [], isLoading: orgsLoading } =
  //     useOrganizations();

  const { isAdmin } = useContextAuth();

  // First filter for upcoming events, then sort by closest date
  const upcomingEvents = [...(events || [])]
    .filter((event) => DateTime.fromISO(event.startDate) >= DateTime.now())
    .sort((a, b) => {
      const aDate = DateTime.fromISO(a.startDate).toMillis();
      const bDate = DateTime.fromISO(b.startDate).toMillis();
      return aDate - bDate; // Sort in ascending order (closest dates first)
    });

  // Sort resources by most recent date
  const sortedResources = [...(resources || [])].sort((a, b) => {
    const aDate = Math.max(
      DateTime.fromISO(a.resourceDate).toMillis(),
      a.resourceUpdatedDate
        ? DateTime.fromISO(a.resourceUpdatedDate).toMillis()
        : 0
    );
    const bDate = Math.max(
      DateTime.fromISO(b.resourceDate).toMillis(),
      b.resourceUpdatedDate
        ? DateTime.fromISO(b.resourceUpdatedDate).toMillis()
        : 0
    );
    return bDate - aDate; // Sort in descending order (most recent first)
  });

  // Group resources by type and maintain date sorting within each group
  const groupedResources = sortedResources.reduce((acc, resource) => {
    const type = resource.resourceType?.name || "Other";
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(resource);
    return acc;
  }, {});

  const loadingBars = [
    { width: "full", height: "4", lineGap: "2" },
    { width: "1/2", height: "4", lineGap: "2" },
    { width: "3/4", height: "4", lineGap: "2" },
  ];

  return (
    <div className="w-full h-full">
      <div className="rounded pb-20">
        {/* Surveys Section */}
        {surveys &&
          surveys.filter((survey) => !survey.completed).length > 0 && (
            <div className="mt-12">
              <h1 className="text-3xl font-bold text-gray-700 mb-4">Surveys</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
                {surveys
                  .filter((survey) => !survey.completed)
                  .map((survey) => (
                    <SurveyCard survey={survey} key={survey.id} />
                  ))}
              </div>
            </div>
          )}

        {/* Upcoming Events Section */}
        {/* <div className="mt-6">
          <h1 className="text-3xl font-bold text-gray-700 mb-4 mt-12">
            Upcoming Events
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-4 pt-5">
            {upcomingEvents?.map((event, index) => (
              <Fundraiser
                isAdmin={isAdmin}
                event={event}
                key={event.id || index}
                title={event.title}
                description={event.description}
                startDate={event.startDate}
                endDate={event.endDate}
                link={event.link}
                image={event.image}
                eventType={event.eventType}
                status={
                  DateTime.fromSQL(event.startDate) > DateTime.now()
                    ? "Upcoming"
                    : "Active"
                }
                className="opacity-60"
              />
            ))}
          </div>
        </div> */}

        {/* Resources Section */}
        {resources && resources.length > 0 && (
          <div className="mt-6">
            <h1 className="text-3xl font-bold text-gray-700 mb-4 mt-12">
              Resources
            </h1>
            {Object.entries(groupedResources).map(([type, typeResources]) => (
              <div key={type} className="mb-8">
                <h2 className="text-xl font-semibold text-gray-600 mb-4">
                  {type}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3 gap-4">
                  {typeResources.map((resource) => (
                    <ResourceCard resource={resource} key={resource.id} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Summary;
