"use client";
import React from "react";
import {
  FaTimes,
  FaExternalLinkAlt,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUsers,
  FaFlask,
  FaClipboardList,
  FaHospital,
  FaPhone,
  FaEnvelope,
  FaUser,
  FaRegCommentDots,
} from "react-icons/fa";

const TrialDetailModal = ({ trial, isOpen, onClose, onAddToChat }) => {
  if (!isOpen || !trial) return null;

  // Enhanced location formatting that marries all location data
  const formatDetailedLocations = (trial) => {
    const countries = trial.LocationCountry || [];
    const states = trial.LocationState || [];
    const cities = trial.LocationCity || [];
    const facilities = trial.LocationFacility || [];
    const zipCodes = trial.LocationZip || [];
    const statuses = trial.LocationStatus || [];
    const contacts = trial.LocationContact || [];

    if (countries.length === 0) return [];

    const locationDetails = [];

    for (let i = 0; i < countries.length; i++) {
      const location = {
        facility: facilities[i] || "Not specified",
        city: cities[i] || "Not specified",
        state: states[i] || "Not specified",
        country: countries[i] || "Not specified",
        zipCode: zipCodes[i] || null,
        status: statuses[i] || "Not specified",
        contacts: contacts[i] || [],
        index: i,
      };

      // Create formatted address
      const addressParts = [];
      if (location.facility !== "Not specified")
        addressParts.push(location.facility);
      if (location.city !== "Not specified") addressParts.push(location.city);
      if (location.state !== "Not specified") addressParts.push(location.state);
      if (location.zipCode) addressParts.push(location.zipCode);
      if (location.country !== "Not specified")
        addressParts.push(location.country);

      location.formattedAddress = addressParts.join(", ");
      locationDetails.push(location);
    }

    return locationDetails;
  };

  const locations = formatDetailedLocations(trial);

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return "Not specified";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Format phase with color
  const getPhaseInfo = (phase) => {
    if (!phase || !phase[0]) return { text: "Not specified", color: "gray" };

    const phaseText = phase[0];
    const phaseLower = phaseText.toLowerCase();

    if (phaseLower.includes("1")) return { text: phaseText, color: "yellow" };
    if (phaseLower.includes("2")) return { text: phaseText, color: "orange" };
    if (phaseLower.includes("3")) return { text: phaseText, color: "red" };
    if (phaseLower.includes("4")) return { text: phaseText, color: "purple" };
    if (phaseLower.includes("n/a")) return { text: phaseText, color: "blue" };

    return { text: phaseText, color: "gray" };
  };

  const phaseInfo = getPhaseInfo(trial.Phase);

  // Format status with color
  const getStatusInfo = (status) => {
    if (!status || !status[0]) return { text: "Unknown", color: "gray" };

    const statusText = status[0];
    const statusLower = statusText.toLowerCase();

    if (statusLower.includes("recruiting"))
      return { text: statusText, color: "green" };
    if (statusLower.includes("active"))
      return { text: statusText, color: "blue" };
    if (statusLower.includes("completed"))
      return { text: statusText, color: "purple" };
    if (
      statusLower.includes("terminated") ||
      statusLower.includes("withdrawn")
    ) {
      return { text: statusText, color: "red" };
    }
    if (statusLower.includes("suspended"))
      return { text: statusText, color: "yellow" };

    return { text: statusText, color: "gray" };
  };

  const statusInfo = getStatusInfo(trial.OverallStatus);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="p-6 border-b border-gray-200 flex justify-between items-start flex-shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {trial.NCTId?.[0]}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  phaseInfo.color === "yellow"
                    ? "bg-yellow-50 text-yellow-700 ring-yellow-700/10"
                    : phaseInfo.color === "orange"
                    ? "bg-orange-50 text-orange-700 ring-orange-700/10"
                    : phaseInfo.color === "red"
                    ? "bg-red-50 text-red-700 ring-red-700/10"
                    : phaseInfo.color === "purple"
                    ? "bg-purple-50 text-purple-700 ring-purple-700/10"
                    : phaseInfo.color === "blue"
                    ? "bg-blue-50 text-blue-700 ring-blue-700/10"
                    : "bg-gray-50 text-gray-700 ring-gray-700/10"
                }`}
              >
                <FaFlask className="mr-1" />
                {phaseInfo.text}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                  statusInfo.color === "green"
                    ? "bg-green-50 text-green-700 ring-green-700/10"
                    : statusInfo.color === "blue"
                    ? "bg-blue-50 text-blue-700 ring-blue-700/10"
                    : statusInfo.color === "purple"
                    ? "bg-purple-50 text-purple-700 ring-purple-700/10"
                    : statusInfo.color === "red"
                    ? "bg-red-50 text-red-700 ring-red-700/10"
                    : statusInfo.color === "yellow"
                    ? "bg-yellow-50 text-yellow-700 ring-yellow-700/10"
                    : "bg-gray-50 text-gray-700 ring-gray-700/10"
                }`}
              >
                {statusInfo.text}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {trial.BriefTitle?.[0] || "Untitled Study"}
            </h2>
            {trial.OfficialTitle?.[0] &&
              trial.OfficialTitle[0] !== trial.BriefTitle?.[0] && (
                <p className="text-gray-600 text-sm">
                  <strong>Official Title:</strong> {trial.OfficialTitle[0]}
                </p>
              )}
          </div>
          <div className="flex items-center gap-2 ml-4">
            <a
              href={`https://clinicaltrials.gov/study/${trial.NCTId?.[0]}?tab=details`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
            >
              <FaExternalLinkAlt className="mr-2" />
              View on ClinicalTrials.gov
            </a>
            {/* {onAddToChat && (
              <button
                onClick={() => {
                  onAddToChat(trial);
                  onClose();
                }}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <FaRegCommentDots className="mr-2" />
                Chat about this trial
              </button>
            )} */}
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Study Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                    <FaClipboardList className="mr-2" />
                    Study Summary
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {trial.BriefSummary?.[0] || "No summary available"}
                  </p>
                  {trial.DetailedDescription?.[0] &&
                    trial.DetailedDescription[0] !==
                      trial.BriefSummary?.[0] && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-800 mb-2">
                          Detailed Description
                        </h4>
                        <p className="text-gray-700 leading-relaxed">
                          {trial.DetailedDescription[0]}
                        </p>
                      </div>
                    )}
                </div>

                {/* Study Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Study Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Study Type</p>
                      <p className="font-medium">
                        {trial.StudyType?.[0] || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Primary Completion Date
                      </p>
                      <p className="font-medium">
                        {formatDate(trial.PrimaryCompletionDate?.[0])}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Study Start Date
                      </p>
                      <p className="font-medium">
                        {formatDate(trial.StartDate?.[0])}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">
                        Estimated Completion
                      </p>
                      <p className="font-medium">
                        {formatDate(trial.CompletionDate?.[0])}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conditions and Interventions */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Conditions & Interventions
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Conditions</p>
                      <div className="flex flex-wrap gap-2">
                        {trial.Condition?.map((condition, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700"
                          >
                            {condition}
                          </span>
                        )) || (
                          <span className="text-gray-500">Not specified</span>
                        )}
                      </div>
                    </div>
                    {trial.InterventionName?.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Interventions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {trial.InterventionName.map((intervention, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700"
                            >
                              {intervention}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Eligibility Criteria */}
                {trial.EligibilityCriteria && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <FaUsers className="mr-2" />
                      Eligibility Criteria
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {trial.EligibilityCriteria}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 mb-1">Age Range</p>
                          <p className="font-medium">
                            {(() => {
                              let minAge = "No minimum";
                              if (trial.MinimumAge?.[0]) {
                                if (
                                  Array.isArray(trial.MinimumAge) &&
                                  trial.MinimumAge[0] &&
                                  trial.MinimumAge[0].length === 1 &&
                                  trial.MinimumAge.length > 1
                                ) {
                                  minAge = trial.MinimumAge.join("");
                                } else {
                                  minAge = trial.MinimumAge[0];
                                }
                              }
                              return minAge;
                            })()}{" "}
                            -{" "}
                            {(() => {
                              let maxAge = "No maximum";
                              if (trial.MaximumAge?.[0]) {
                                if (
                                  Array.isArray(trial.MaximumAge) &&
                                  trial.MaximumAge[0] &&
                                  trial.MaximumAge[0].length === 1 &&
                                  trial.MaximumAge.length > 1
                                ) {
                                  maxAge = trial.MaximumAge.join("");
                                } else {
                                  maxAge = trial.MaximumAge[0];
                                }
                              }
                              return maxAge;
                            })()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">Gender</p>
                          <p className="font-medium">
                            {trial.Gender?.[0] || "Not specified"}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 mb-1">
                            Healthy Volunteers
                          </p>
                          <p className="font-medium">
                            {trial.HealthyVolunteers
                              ? "Accepted"
                              : "Not accepted"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Key Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaCalendarAlt className="mr-2" />
                    Key Information
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600">NCT ID</p>
                      <p className="font-mono font-medium">
                        {trial.NCTId?.[0]}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Phase</p>
                      <p className="font-medium">
                        {trial.Phase?.[0] || "Not specified"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-medium">
                        {trial.OverallStatus?.[0] || "Unknown"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Study Type</p>
                      <p className="font-medium">
                        {trial.StudyType?.[0] || "Not specified"}
                      </p>
                    </div>
                    {trial.hasResults !== undefined && (
                      <div>
                        <p className="text-gray-600">Has Results</p>
                        <p className="font-medium">
                          {trial.hasResults ? "Yes" : "No"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Study Locations */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <FaMapMarkerAlt className="mr-2" />
                    Study Locations ({locations.length})
                  </h3>
                  <div className="max-h-96 overflow-y-auto space-y-3">
                    {locations.map((location, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <FaHospital className="text-blue-500 mr-2 flex-shrink-0" />
                              <h4 className="font-medium text-gray-800 text-sm">
                                {location.facility}
                              </h4>
                            </div>
                            <p className="text-xs text-gray-600 mb-2">
                              {location.formattedAddress}
                            </p>
                            <div className="flex items-center justify-between">
                              <span
                                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                  location.status
                                    .toLowerCase()
                                    .includes("recruiting")
                                    ? "bg-green-50 text-green-700 ring-green-700/10"
                                    : location.status
                                        .toLowerCase()
                                        .includes("active")
                                    ? "bg-blue-50 text-blue-700 ring-blue-700/10"
                                    : "bg-gray-50 text-gray-700 ring-gray-700/10"
                                }`}
                              >
                                {location.status}
                              </span>
                            </div>

                            {/* Contact Information */}
                            {Array.isArray(location.contacts) &&
                              location.contacts.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-gray-200">
                                  <p className="text-xs font-medium text-gray-700 mb-1">
                                    Contact Information:
                                  </p>
                                  {location.contacts.map(
                                    (contact, contactIndex) => (
                                      <div
                                        key={contactIndex}
                                        className="text-xs text-gray-600 mb-1"
                                      >
                                        {contact.name && (
                                          <div className="flex items-center mb-1">
                                            <FaUser className="mr-1 text-gray-400" />
                                            {contact.name}
                                          </div>
                                        )}
                                        {contact.phone && (
                                          <div className="flex items-center mb-1">
                                            <FaPhone className="mr-1 text-gray-400" />
                                            <a
                                              href={`tel:${contact.phone}`}
                                              className="hover:text-blue-600"
                                            >
                                              {contact.phone}
                                            </a>
                                          </div>
                                        )}
                                        {contact.email && (
                                          <div className="flex items-center">
                                            <FaEnvelope className="mr-1 text-gray-400" />
                                            <a
                                              href={`mailto:${contact.email}`}
                                              className="hover:text-blue-600"
                                            >
                                              {contact.email}
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialDetailModal;
