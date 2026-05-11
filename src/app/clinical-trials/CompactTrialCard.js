"use client";
import React, { useState } from "react";
import {
  FaCalendarAlt,
  FaExternalLinkAlt,
  FaCheck,
  FaMapMarkerAlt,
  FaEye,
} from "react-icons/fa";
import TrialDetailModal from "./TrialDetailModal";

/**
 * A compact card component for displaying clinical trial information
 */
const CompactTrialCard = ({
  trial,
  formatDate,
  isSelected = false,
  onSelect = () => {},
  selectionMode = false,
  onAddToChat,
}) => {
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Generate the trial URL
  const getTrialUrl = (nctId) =>
    `https://clinicaltrials.gov/study/${nctId}?tab=details`;

  // Helper to get CSS class for status badges
  const getStatusBadgeClass = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";

    // Convert to uppercase for comparison
    const upperStatus = status.toUpperCase();

    if (
      upperStatus === "RECRUITING" ||
      upperStatus === "ENROLLING_BY_INVITATION"
    ) {
      return "bg-green-100 text-green-800"; // Green for recruiting
    } else if (
      upperStatus === "ACTIVE_NOT_RECRUITING" ||
      upperStatus === "NOT_YET_RECRUITING"
    ) {
      return "bg-blue-100 text-blue-800"; // Blue for active but not recruiting
    } else if (upperStatus === "COMPLETED") {
      return "bg-purple-100 text-purple-800"; // Purple for completed
    } else if (["SUSPENDED", "WITHDRAWN", "TERMINATED"].includes(upperStatus)) {
      return "bg-amber-100 text-amber-800"; // Amber for terminated/suspended
    }

    return "bg-gray-100 text-gray-800"; // Default
  };

  // Format status text for display
  const formatStatus = (status) => {
    if (!status) return "Unknown";

    const statusMap = {
      RECRUITING: "Recruiting",
      ENROLLING_BY_INVITATION: "Enrolling by invitation",
      ACTIVE_NOT_RECRUITING: "Active, not recruiting",
      NOT_YET_RECRUITING: "Not yet recruiting",
      COMPLETED: "Completed",
      SUSPENDED: "Suspended",
      WITHDRAWN: "Withdrawn",
      TERMINATED: "Terminated",
      UNKNOWN: "Unknown",
    };

    return statusMap[status.toUpperCase()] || status;
  };

  // Format the date for display
  const displayDate = trial.StartDate?.[0]
    ? formatDate(trial.StartDate[0])
    : null;

  // Get main values
  const nctId = trial.NCTId?.[0] || "Unknown ID";
  const title = trial.BriefTitle?.[0] || "Untitled Trial";
  const status = trial.OverallStatus?.[0];
  const phase = trial.Phase?.[0];
  const condition = trial.Condition?.join(", ") || "";

  // Format locations properly by combining all location data
  const formatLocations = (trial) => {
    const countries = trial.LocationCountry || [];
    const states = trial.LocationState || [];
    const cities = trial.LocationCity || [];
    const facilities = trial.LocationFacility || [];
    const zipCodes = trial.LocationZip || [];
    const statuses = trial.LocationStatus || [];

    if (countries.length === 0) return "";

    // For compact display, show unique city, state combinations with enhanced data
    const locationSet = new Set();

    for (let i = 0; i < countries.length; i++) {
      const parts = [];

      // Add facility if available (for compact view, prioritize facility/city over full address)
      if (facilities[i]) {
        parts.push(facilities[i]);
      } else if (cities[i]) {
        // Add city if no facility but city is available
        parts.push(cities[i]);
      }

      // Add state if available (only if different from city)
      if (states[i] && states[i] !== cities[i]) {
        parts.push(states[i]);
      }

      // Add status if not recruiting
      let locationString = parts.join(", ");
      if (statuses[i] && statuses[i].toLowerCase() !== "recruiting") {
        locationString += ` (${statuses[i]})`;
      }

      if (locationString) {
        locationSet.add(locationString);
      } else if (countries[i]) {
        // Fallback to country if no other location data
        locationSet.add(countries[i]);
      }
    }

    const uniqueLocations = Array.from(locationSet);

    // Limit to first 3 locations for compact display
    if (uniqueLocations.length > 3) {
      return (
        uniqueLocations.slice(0, 3).join("; ") +
        `; +${uniqueLocations.length - 3} more`
      );
    }

    return uniqueLocations.join("; ");
  };

  const locations = formatLocations(trial);

  return (
    <>
      <div
        className={`bg-white rounded-lg border ${
          isSelected ? "border-blue-500 shadow-md" : "border-gray-200"
        } overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col`}
      >
        {/* Card Header */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          {selectionMode ? (
            <button
              onClick={() => onSelect(trial)}
              className={`flex-shrink-0 w-5 h-5 rounded ${
                isSelected ? "bg-blue-500 text-white" : "border border-gray-300"
              } flex items-center justify-center`}
              aria-label={isSelected ? "Deselect trial" : "Select trial"}
            >
              {isSelected && <FaCheck size={10} />}
            </button>
          ) : (
            <div className="w-5"></div>
          )}

          <h2 className="text-sm text-center font-medium text-gray-600 flex-grow px-2 truncate">
            {nctId}
          </h2>

          {displayDate && (
            <div className="text-xs text-gray-500 flex items-center whitespace-nowrap">
              <FaCalendarAlt className="mr-1 text-gray-400" size={12} />
              {displayDate}
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-3 min-h-[4.5rem]">
            {title}
          </h3>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {status && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(
                  status
                )}`}
              >
                {formatStatus(status)}
              </span>
            )}

            {phase && phase !== "N/A" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {phase}
              </span>
            )}
          </div>

          {condition && (
            <p className="text-sm text-gray-600 mb-1 line-clamp-1">
              <span className="font-medium">Condition:</span> {condition}
            </p>
          )}

          {locations && (
            <p className="text-sm text-gray-600 flex items-start line-clamp-1 mt-auto">
              <FaMapMarkerAlt
                className="text-gray-400 mr-1 flex-shrink-0 mt-1"
                size={12}
              />
              <span>{locations}</span>
            </p>
          )}
        </div>

        {/* Card Footer */}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
            <div className="flex space-x-2">
              <a
                href={getTrialUrl(nctId)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-2.5 py-1.5 border border-blue-600 text-blue-600 text-xs rounded-md hover:bg-blue-50"
              >
                <FaExternalLinkAlt className="mr-1" size={10} />
                ClinicalTrials.gov
              </a>
              <button
                onClick={() => setShowDetailModal(true)}
                className="inline-flex items-center px-2.5 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
              >
                Details
              </button>
            </div>

            {selectionMode && (
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={(e) => onSelect(e.target.checked ? trial : null)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-xs text-gray-700">Select</span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <TrialDetailModal
        trial={trial}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onAddToChat={onAddToChat}
      />
    </>
  );
};

export default CompactTrialCard;
