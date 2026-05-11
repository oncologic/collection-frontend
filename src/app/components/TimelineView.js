"use client";

import React, { useMemo } from "react";
import { DateTime } from "luxon";
import { FaCalendar } from "react-icons/fa";
import ResourceCard from "./cards/ResourceCard";
import ExternalLinkCard from "./cards/ExternalLinkCard";

const TimelineView = ({
  resources,
  isAdmin,
  handleDeleteResource,
  handleDeleteExternalLink,
  onUpdateExternalLink,
  flippedCardId,
  setFlippedCardId,
  resourceTypes,
  isExternalCollection,
}) => {
  // Group resources by month
  const groupedResources = useMemo(() => {
    const groups = resources.reduce((acc, resource) => {
      // Get the date from either date field or dateAdded
      let dateStr = resource.date || resource.dateAdded;

      // Handle invalid dates by setting them to null
      if (dateStr) {
        const date = DateTime.fromISO(dateStr);
        if (!date.isValid) {
          dateStr = null;
          // Update the resource with cleaned date
          resource.date = null;
          resource.dateAdded = null;
        }
      }

      if (!dateStr) {
        if (!acc["No Date"]) acc["No Date"] = [];
        acc["No Date"].push(resource);
        return acc;
      }

      // Parse the date string to DateTime object
      const date = DateTime.fromISO(dateStr);
      // Format the date as YYYY-MM for grouping by month
      const formattedMonth = date.toFormat("yyyy-MM");

      if (!acc[formattedMonth]) {
        acc[formattedMonth] = [];
      }
      acc[formattedMonth].push(resource);
      return acc;
    }, {});

    // Sort months in ascending order (oldest to newest)
    return Object.entries(groups)
      .sort(([dateA], [dateB]) => {
        if (dateA === "No Date") return 1;
        if (dateB === "No Date") return -1;
        return dateA.localeCompare(dateB); // Reversed comparison for oldest to newest
      })
      .reduce((acc, [date, items]) => {
        acc[date] = items;
        return acc;
      }, {});
  }, [resources]);

  const formatMonth = (monthStr) => {
    if (monthStr === "No Date") return "No Date";
    const date = DateTime.fromFormat(monthStr, "yyyy-MM");
    return date.toFormat("MMMM yyyy");
  };

  return (
    <div className="relative pl-8 space-y-12 before:content-[''] before:absolute before:left-[27px] before:top-[60px] before:bottom-10 before:w-[2px] before:bg-blue-200">
      {Object.entries(groupedResources).map(([month, items], index) => (
        <div key={month} className="relative">
          {/* Month header with calendar icon */}
          <div className="relative flex items-center mb-6 z-10">
            <div className="absolute -left-8 bg-white p-1 rounded-full">
              <div className="bg-blue-500 text-white p-2 rounded-full">
                <FaCalendar className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-3 bg-gradient-to-r from-white via-white to-transparent py-2 pl-2">
              <h3 className="text-xl font-bold text-gray-800">
                {formatMonth(month)}
              </h3>
              <span className="text-sm text-gray-500">
                ({items.length} items)
              </span>
            </div>
          </div>

          {/* Resources grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {items.map((resource) => (
              <div key={resource.id} className="relative">
                {/* Card */}
                <div className="relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                  {isExternalCollection ? (
                    <ExternalLinkCard
                      {...resource}
                      onUpdateExternalLink={onUpdateExternalLink}
                      isAdmin={isAdmin}
                    />
                  ) : (
                    <ResourceCard
                      resource={{
                        ...resource,
                        date: resource.date || null,
                        dateAdded: resource.dateAdded || null,
                      }}
                      isFlipped={flippedCardId === resource.id}
                      setFlippedCardId={setFlippedCardId}
                      onClose={() => setFlippedCardId(null)}
                      deleteResource={handleDeleteResource}
                      deleteOption={true}
                      isAdmin={isAdmin}
                      resourceTypes={resourceTypes}
                      showCopyLink={false}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineView;
