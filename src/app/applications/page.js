"use client";
import React, { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import {
  useUserApplications,
  useDeleteApplication,
} from "../hooks/useOpportunities";
import LoadingSkeleton from "../components/LoadingSkeleton";
import {
  FaBriefcase,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaHourglassHalf,
  FaSearch,
  FaTrash,
  FaLink,
} from "react-icons/fa";
import { DateTime } from "luxon";
import OpportunityDetailModal from "../components/modals/OpportunityDetailModal";

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  reviewing: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  withdrawn: "bg-gray-100 text-gray-800",
};

const STATUS_ICONS = {
  pending: FaHourglassHalf,
  reviewing: FaClock,
  approved: FaCheckCircle,
  rejected: FaTimesCircle,
  withdrawn: FaTimesCircle,
};

const STATUS_LABELS = {
  pending: "Pending",
  reviewing: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default function MyApplicationsPage() {
  const { user, isSignedIn } = useUser();
  const { data: applications = [], isLoading } = useUserApplications();
  const deleteApplication = useDeleteApplication();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);

  const handleDeleteApplication = async (applicationId) => {
    if (
      !confirm(
        "Are you sure you want to delete this application? This action cannot be undone."
      )
    ) {
      return;
    }
    try {
      await deleteApplication.mutateAsync({ applicationId });
    } catch (error) {
      console.error("Error deleting application:", error);
    }
  };

  // Filter applications
  const filteredApplications = useMemo(() => {
    let filtered = applications;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.opportunity?.title?.toLowerCase().includes(search) ||
          app.opportunity?.description?.toLowerCase().includes(search)
      );
    }

    // Status filter
    if (selectedStatus !== "all") {
      filtered = filtered.filter((app) => app.status === selectedStatus);
    }

    return filtered;
  }, [applications, searchTerm, selectedStatus]);

  const formatDate = (date) => {
    if (!date) return null;
    return DateTime.fromISO(date).toFormat("MMM dd, yyyy");
  };

  const formatDateTime = (date) => {
    if (!date) return null;
    return DateTime.fromISO(date).toFormat("MMM dd, yyyy 'at' h:mm a");
  };

  // Show loading state instead of sign-in required while loading
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Applications
          </h1>
          <p className="text-gray-600">
            Track the status of your opportunity applications
          </p>
        </div>
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          My Applications
        </h1>
        <p className="text-gray-600">
          Track the status of your opportunity applications
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search applications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        {isLoading ? (
          <LoadingSkeleton count={3} />
        ) : filteredApplications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <FaBriefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {applications.length === 0
                ? "No applications yet"
                : "No applications found"}
            </h3>
            <p className="text-gray-600">
              {applications.length === 0
                ? "Start applying to opportunities to see them here"
                : "Try adjusting your search or filters"}
            </p>
          </div>
        ) : (
          filteredApplications.map((application) => {
            const StatusIcon =
              STATUS_ICONS[application.status] || FaHourglassHalf;
            const opportunity = application.opportunity;

            return (
              <div
                key={application.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Simple Header Section */}
                <div className="p-6 border-b border-gray-50/80">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Status Badge */}
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            application.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : application.status === "rejected"
                              ? "bg-red-100 text-red-800"
                              : application.status === "reviewing"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {STATUS_LABELS[application.status] || "Pending"}
                        </span>
                      </div>
                      <h3
                        className="text-xl font-semibold text-gray-900 hover:text-blue-600 cursor-pointer transition-colors"
                        onClick={() =>
                          setSelectedOpportunity({
                            ...opportunity,
                            hasApplied: true,
                            applicationStatus: application.status,
                          })
                        }
                      >
                        {opportunity?.title || "Unknown Opportunity"}
                      </h3>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Applied: {formatDate(application.appliedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2 text-sm text-gray-600">
                      {opportunity?.timeCommitment && (
                        <p>
                          <span className="font-medium">Time Commitment:</span>{" "}
                          {opportunity.timeCommitment}
                        </p>
                      )}
                      {opportunity?.isVolunteer !== undefined && (
                        <p>
                          <span className="font-medium">Type:</span>{" "}
                          {opportunity.isVolunteer ? "Volunteer" : "Paid"}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      {opportunity?.frequency && (
                        <p>
                          <span className="font-medium">Frequency:</span>{" "}
                          {opportunity.frequency === "once"
                            ? "One-time"
                            : opportunity.frequency === "weekly"
                            ? "Weekly"
                            : opportunity.frequency === "biweekly"
                            ? "Bi-weekly"
                            : opportunity.frequency === "monthly"
                            ? "Monthly"
                            : opportunity.frequency === "quarterly"
                            ? "Quarterly"
                            : opportunity.frequency === "as_needed"
                            ? "As Needed"
                            : opportunity.frequency}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Instructions section - only for approved applications */}
                  {application.status === "approved" &&
                    (application.instructions ||
                      application.instructionsLink) && (
                      <div className="mt-4 pt-4 border-t border-green-200 bg-green-50 rounded-lg p-4">
                        <p className="font-semibold text-green-900 mb-2">
                          Next Steps & Instructions
                        </p>
                        {application.instructions && (
                          <p className="text-gray-700 whitespace-pre-wrap mb-2">
                            {application.instructions}
                          </p>
                        )}
                        {application.instructionsLink && (
                          <a
                            href={application.instructionsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                          >
                            <FaLink className="inline w-3 h-3 mr-1" />
                            View Instructions Link
                          </a>
                        )}
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <button
                      onClick={() =>
                        setSelectedOpportunity({
                          ...opportunity,
                          hasApplied: true,
                          applicationStatus: application.status,
                        })
                      }
                      className="text-left text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                      View full opportunity details
                    </button>
                    <button
                      onClick={() => handleDeleteApplication(application.id)}
                      disabled={deleteApplication.isPending}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete application"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Opportunity Detail Modal */}
      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onApply={() => {}}
          onSaveToggle={() => {}}
        />
      )}
    </div>
  );
}
