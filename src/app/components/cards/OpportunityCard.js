import React from "react";
import {
  FaMapMarkerAlt,
  FaClock,
  FaCalendarAlt,
  FaBuilding,
  FaBookmark,
  FaRegBookmark,
  FaMoneyBillWave,
  FaHandsHelping,
  FaUsers,
  FaBriefcase,
  FaArrowRight,
} from "react-icons/fa";
import { DateTime } from "luxon";
import CustomEditor from "../common/CustomEditor";

const OpportunityCard = ({
  opportunity,
  onSaveToggle,
  onApply,
  onViewDetails,
}) => {
  const {
    title,
    description,
    organizations = [],
    isVolunteer,
    compensationType,
    compensationAmount,
    timeCommitment,
    frequency,
    spotsAvailable,
    spotsFilled,
    isRemote,
    location,
    applicationDeadline,
    startDate,
    tags = [],
    isSaved,
    hasApplied,
  } = opportunity;

  const primaryOrg = organizations.find((org) => org.isPrimary) || organizations[0];
  // Ensure spotsAvailable is at least 1 (default to 1 if 0 or null)
  const spotsAvailableNum = Math.max(Number(spotsAvailable) || 1, 1);
  const spotsFilledNum = Number(spotsFilled) || 0;
  const spotsRemaining = spotsAvailableNum - spotsFilledNum;
  // Only show as full if spotsRemaining is 0 AND there are actually approved applications
  const isFull = spotsRemaining <= 0 && spotsFilledNum > 0;

  const formatDate = (date) => {
    if (!date) return null;
    return DateTime.fromISO(date).toFormat("MMM dd, yyyy");
  };

  const getFrequencyLabel = (freq) => {
    const labels = {
      once: "One-time",
      weekly: "Weekly",
      biweekly: "Bi-weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      as_needed: "As Needed",
    };
    return labels[freq] || freq;
  };

  const getCompensationLabel = () => {
    if (isVolunteer) return "Volunteer";
    if (compensationType === "paid" && compensationAmount) {
      return `$${compensationAmount}`;
    }
    if (compensationType === "travel_reimbursement") {
      return "Travel Reimbursement";
    }
    if (compensationType === "stipend") {
      return compensationAmount ? `$${compensationAmount} Stipend` : "Stipend";
    }
    return "Compensation Available";
  };

  return (
    <div className="relative h-full">
      <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_0_25px_rgba(59,130,246,0.1)] transition-all duration-300 group relative overflow-hidden h-full flex flex-col">
        {/* Subtle glow effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-indigo-50/0 to-purple-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Header Section */}
        <div className="p-4 sm:p-6 border-b border-gray-50/80 relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
            <div className="space-y-2 flex-1">
              {/* Organization Logo and Badges */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {primaryOrg?.imageUrl && (
                  <img
                    src={primaryOrg.imageUrl}
                    alt={primaryOrg.name}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-md shadow-lg"
                  />
                )}
                <span
                  className={`inline-flex items-center gap-1 px-2 sm:px-3 py-1 rounded-full text-xs font-medium shadow-sm ${
                    isVolunteer
                      ? "bg-green-50/80 text-green-700"
                      : "bg-blue-50/80 text-blue-700"
                  }`}
                >
                  {isVolunteer ? (
                    <FaHandsHelping className="w-3 h-3" />
                  ) : (
                    <FaMoneyBillWave className="w-3 h-3" />
                  )}
                  {getCompensationLabel()}
                </span>
                <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 bg-gray-50/80 text-gray-700 rounded-full text-xs font-medium shadow-sm">
                  <FaMapMarkerAlt className="w-3 h-3" />
                  {isRemote ? "Remote" : location || "On-site"}
                </span>
              </div>

              {/* Title */}
              <h3
                className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 cursor-pointer relative z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
              >
                {title}
              </h3>

              {/* Organization Name and Metadata */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
                {primaryOrg && (
                  <span className="flex items-center gap-1 sm:gap-2">
                    <FaBuilding className="w-3 h-3 sm:w-4 sm:h-4" />
                    {primaryOrg.name}
                  </span>
                )}
                {applicationDeadline && (
                  <>
                    {primaryOrg && <span>•</span>}
                    <span className="flex items-center gap-1 sm:gap-2">
                      <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                      Apply by {formatDate(applicationDeadline)}
                    </span>
                  </>
                )}
                {startDate && (
                  <>
                    {(primaryOrg || applicationDeadline) && <span>•</span>}
                    <span className="flex items-center gap-1 sm:gap-2">
                      <FaBriefcase className="w-3 h-3 sm:w-4 sm:h-4" />
                      Starts {formatDate(startDate)}
                    </span>
                  </>
                )}
              </div>

              {/* Additional Badges */}
              <div className="flex flex-wrap gap-2">
                {timeCommitment && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50/80 text-purple-700 rounded-full text-xs font-medium shadow-sm">
                    <FaClock className="w-3 h-3" />
                    {timeCommitment}
                  </span>
                )}
                {frequency && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-50/80 text-orange-700 rounded-full text-xs font-medium shadow-sm">
                    <FaCalendarAlt className="w-3 h-3" />
                    {getFrequencyLabel(frequency)}
                  </span>
                )}
              </div>
            </div>

            {/* Action Icons - Top Right */}
            <div className="flex items-center gap-1 self-start mt-2 sm:mt-0 relative z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveToggle(opportunity);
                }}
                className={`p-2 rounded-full transition-all duration-200 relative z-10 ${
                  isSaved
                    ? "text-blue-500 bg-blue-50/80"
                    : "text-gray-400 hover:text-blue-500 hover:bg-blue-50/80"
                }`}
                title={isSaved ? "Remove from saved" : "Save opportunity"}
              >
                {isSaved ? (
                  <FaBookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <FaRegBookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="flex-1 px-4 sm:px-6 py-3 sm:py-4 overflow-hidden">
          <div className="relative max-h-[120px] sm:max-h-[140px] overflow-hidden">
            <CustomEditor
              content={description || ""}
              readOnly={true}
              editable={false}
              transparent={true}
              textColor="text-gray-600"
              textSize="text-sm"
              scrollable={false}
              compact={true}
              showAIAssist={false}
              contextDetails={{
                parseMarkdown: true,
              }}
            />
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Tags Section */}
        {tags.length > 0 && (
          <div className="px-4 sm:px-6 pb-3">
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 5).map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: tag.color ? `${tag.color}20` : "rgba(0, 0, 0, 0.05)",
                    color: tag.color || "#374151",
                  }}
                >
                  {tag.name}
                </span>
              ))}
              {tags.length > 5 && (
                <span className="px-2 py-1 text-gray-500 text-xs">
                  +{tags.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 mt-auto border-t border-gray-50/80">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Spots Available Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FaUsers className="w-4 h-4" />
              {isFull ? (
                <span className="text-red-600 font-medium">No spots available</span>
              ) : (
                <span>
                  <span className="font-medium">{spotsRemaining}</span> spot
                  {spotsRemaining !== 1 ? "s" : ""} available
                </span>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 w-full sm:w-auto relative z-10">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-blue-600 hover:text-blue-700 transition-colors bg-blue-50/80 rounded-md text-sm font-medium group-hover:bg-blue-100/80 relative z-10"
              >
                View Details
                <FaArrowRight className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onApply(opportunity);
                }}
                disabled={hasApplied || isFull}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md transition-colors text-sm font-medium relative z-10 ${
                  hasApplied
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isFull
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {hasApplied ? "Already Applied" : isFull ? "Position Filled" : "Apply Now"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpportunityCard;