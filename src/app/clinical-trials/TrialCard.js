"use client";
import React, { useState } from "react";
import {
  FaFlask,
  FaCalendarAlt,
  FaExternalLinkAlt,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaMapMarkerAlt,
  FaEye,
} from "react-icons/fa";
import TrialDetailModal from "./TrialDetailModal";
import { sanitizeHtml } from "@/app/utils/sanitizeHtml";

const TrialCard = ({
  trial,
  formatDate,
  isSelected = false,
  onSelect = () => {},
  selectionMode = false,
  onAddToChat,
}) => {
  const [showSummary, setShowSummary] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const toggleSummary = (e) => {
    e.preventDefault();
    setShowSummary(!showSummary);
  };

  // Process content to handle HTML formatting
  const processContent = (content) => {
    if (!content) return "";

    let contentStr = String(content);

    // Additional processing for better readability
    contentStr = contentStr
      // Handle bullets and lists
      .replace(/^\s*\*\s(.+)$/gm, "<li>$1</li>")
      .replace(/(<li>.+<\/li>\n?)+/g, '<ul class="list-disc pl-5 my-2">$&</ul>')
      // Handle numbered lists
      .replace(/^\s*(\d+)\.\s(.+)$/gm, "<li>$2</li>")
      .replace(
        /(<li>.+<\/li>\n?)+/g,
        '<ol class="list-decimal pl-5 my-2">$&</ol>'
      )
      // Process markdown-like formatting
      .replace(/\*\*([^*]+)\*\*/g, '<span class="font-semibold">$1</span>')
      .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
      // Convert URLs to links
      .replace(
        /https?:\/\/[^\s)]+/g,
        '<a href="$&" target="_blank" rel="noopener noreferrer" class="underline">$&</a>'
      );

    // Handle paragraphs and line breaks
    const paragraphs = contentStr.split(/\n\s*\n/);

    const processedParagraphs = paragraphs
      .filter((p) => p.trim())
      .map((paragraph) => {
        const processedParagraph = paragraph.replace(/\n/g, "<br />");

        // Don't wrap in <p> tags if already contains block elements
        if (
          processedParagraph.includes("<ul") ||
          processedParagraph.includes("<ol") ||
          processedParagraph.includes("<table") ||
          processedParagraph.includes("<div") ||
          processedParagraph.includes("<p")
        ) {
          return processedParagraph;
        }

        return `<p class="mb-2">${processedParagraph}</p>`;
      });

    return processedParagraphs.join("");
  };

  const hasSummary = trial.BriefSummary?.[0];
  const getTrialUrl = (nctId) =>
    `https://clinicaltrials.gov/study/${nctId}?tab=details`;

  // Get status color class
  const getStatusColorClass = () => {
    const status = trial.OverallStatus?.[0];

    if (!status) return "bg-gray-200 text-gray-800"; // Default

    // Convert all statuses to uppercase for comparison
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
    } else if (
      upperStatus === "SUSPENDED" ||
      upperStatus === "WITHDRAWN" ||
      upperStatus === "TERMINATED"
    ) {
      return "bg-amber-100 text-amber-800"; // Amber for terminated, was red before
    } else {
      return "bg-gray-200 text-gray-800"; // Gray for other statuses
    }
  };

  // Format status for display (convert API format to human readable)
  const formatStatus = (status) => {
    if (!status) return "Unknown";

    // Map of API status codes to display text
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

  // Get phase color class
  const getPhaseColorClass = (phase) => {
    const phaseLower = phase?.toLowerCase() || "";
    if (phaseLower.includes("1")) return "bg-yellow-100 text-yellow-800";
    if (phaseLower.includes("2")) return "bg-orange-100 text-orange-800";
    if (phaseLower.includes("3")) return "bg-red-100 text-red-800";
    if (phaseLower.includes("4")) return "bg-purple-100 text-purple-800";
    return "bg-gray-100 text-gray-800";
  };

  // Format the date for display
  const displayDate = trial.StartDate?.[0]
    ? formatDate(trial.StartDate[0])
    : null;

  return (
    <>
      <div
        className={`bg-white rounded-lg border ${
          isSelected ? "border-blue-500 shadow-md" : "border-gray-200 shadow-sm"
        } overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col`}
      >
        <div className="p-4 flex-grow flex flex-col">
          {/* Header with selection checkbox and date */}
          <div className="flex items-start mb-2">
            {selectionMode && (
              <button
                onClick={() => onSelect(trial)}
                className={`mr-2 flex-shrink-0 w-6 h-6 rounded-md ${
                  isSelected
                    ? "bg-blue-500 text-white"
                    : "border border-gray-300"
                } flex items-center justify-center mt-1`}
                aria-label={isSelected ? "Deselect trial" : "Select trial"}
              >
                {isSelected && <FaCheck size={12} />}
              </button>
            )}

            <div className="flex-grow">
              {/* Date display at the top */}
              {displayDate && (
                <div className="text-xs text-gray-500 flex items-center mb-1">
                  <FaCalendarAlt className="mr-1 text-gray-400" />
                  {displayDate}
                </div>
              )}

              {/* Title with fixed height to ensure alignment */}
              <h2 className="text-lg font-semibold text-gray-900 line-clamp-3 min-h-[4.5rem]">
                <a
                  href={getTrialUrl(trial.NCTId[0])}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 transition-colors"
                >
                  {trial.BriefTitle[0] || "Untitled Trial"}
                </a>
              </h2>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {trial.OverallStatus?.[0] && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass()}`}
              >
                {formatStatus(trial.OverallStatus[0])}
              </span>
            )}

            {trial.Phase?.[0] && trial.Phase[0] !== "N/A" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                {trial.Phase[0]}
              </span>
            )}

            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              {trial.NCTId[0]}
            </span>
          </div>

          {/* Terminated reason */}
          {trial.OverallStatus?.[0]?.toUpperCase() === "TERMINATED" &&
            trial.whyStopped && (
              <div className="mb-3 px-3 py-1.5 bg-amber-50 border-l-4 border-amber-400 text-xs text-amber-800">
                <strong>Terminated:</strong> {trial.whyStopped}
              </div>
            )}

          {/* Key Information */}
          <div className="space-y-1.5 text-sm text-gray-600 mb-3">
            {trial.Condition?.length > 0 && (
              <p className="line-clamp-1">
                <span className="font-semibold">Condition:</span>{" "}
                {trial.Condition.join(", ")}
              </p>
            )}

            {trial.InterventionName?.length > 0 && (
              <p className="line-clamp-1">
                <span className="font-semibold">Intervention:</span>{" "}
                {trial.InterventionName.join(", ")}
              </p>
            )}

            {/* Format locations properly */}
            {(() => {
              const formatLocations = (trial) => {
                const countries = trial.LocationCountry || [];
                const states = trial.LocationState || [];
                const cities = trial.LocationCity || [];
                const facilities = trial.LocationFacility || [];
                const zipCodes = trial.LocationZip || [];
                const statuses = trial.LocationStatus || [];
                const contacts = trial.LocationContact || [];

                if (countries.length === 0) return [];

                // Combine locations by index and create unique entries with enhanced data
                const locationSet = new Set();

                for (let i = 0; i < countries.length; i++) {
                  const parts = [];

                  // Add facility if available
                  if (facilities[i]) {
                    parts.push(facilities[i]);
                  }

                  // Add city if available
                  if (cities[i]) {
                    parts.push(cities[i]);
                  }

                  // Add state if available
                  if (states[i]) {
                    parts.push(states[i]);
                  }

                  // Add ZIP code if available
                  if (zipCodes[i]) {
                    parts.push(zipCodes[i]);
                  }

                  // Add country if available
                  if (countries[i]) {
                    parts.push(countries[i]);
                  }

                  // Add status information if available
                  let locationString = parts.join(", ");
                  if (
                    statuses[i] &&
                    statuses[i].toLowerCase() !== "recruiting"
                  ) {
                    locationString += ` (${statuses[i]})`;
                  }

                  if (locationString) {
                    locationSet.add(locationString);
                  }
                }

                return Array.from(locationSet);
              };

              const formattedLocations = formatLocations(trial);

              return formattedLocations.length > 0 ? (
                <div className="mb-2">
                  <div className="flex items-center mb-1">
                    <FaMapMarkerAlt className="text-gray-400 mr-1 flex-shrink-0" />
                    <span className="font-semibold text-sm text-gray-600">
                      Locations:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {formattedLocations.slice(0, 3).map((location, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                      >
                        {location}
                      </span>
                    ))}
                    {formattedLocations.length > 3 && (
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        +{formattedLocations.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
          </div>

          {/* Summary section */}
          {hasSummary && (
            <div className="mt-auto">
              <button
                onClick={toggleSummary}
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-xs font-medium"
              >
                {showSummary ? (
                  <>
                    <FaChevronUp className="mr-1" /> Hide Summary
                  </>
                ) : (
                  <>
                    <FaChevronDown className="mr-1" /> View Summary
                  </>
                )}
              </button>

              {showSummary && (
                <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-200 text-xs">
                  <div
                    className="text-gray-700 leading-relaxed max-h-32 overflow-y-auto"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(
                        processContent(trial.BriefSummary[0])
                      ),
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-3 mt-auto bg-gray-50">
          <div className="flex space-x-2">
            <a
              href={getTrialUrl(trial.NCTId[0])}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaExternalLinkAlt className="mr-1.5" />
              View on ClinicalTrials.gov
            </a>
            <button
              onClick={() => setShowDetailModal(true)}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              View Details
            </button>
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

export default TrialCard;
