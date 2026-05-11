import React, { useState } from "react";
import { DateTime } from "luxon";
import {
  FaTimes,
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
  FaEnvelope,
  FaLink,
  FaCheckCircle,
  FaExclamationCircle,
  FaUser,
  FaHourglassHalf,
  FaTimesCircle,
  FaTrash,
  FaEdit,
} from "react-icons/fa";
import CustomEditor from "../common/CustomEditor";
import Image from "next/image";
import { useContextAuth } from "../../context/authContext";
import {
  useOpportunityApplications,
  useReviewApplication,
  useDeleteApplication,
  useOpportunityById,
} from "../../hooks/useOpportunities";
import { useUser } from "@clerk/nextjs";
import toast from "react-hot-toast";
import CreateOpportunityModal from "./CreateOpportunityModal";

const OpportunityDetailModal = ({
  opportunity: initialOpportunity,
  onClose,
  onApply,
  onSaveToggle,
  organizations,
  tags,
}) => {
  const { isAdvocate, isAdmin } = useContextAuth();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("details");
  const [reviewingApplicationId, setReviewingApplicationId] = useState(null);
  const [editingInstructionsId, setEditingInstructionsId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [instructions, setInstructions] = useState("");
  const [instructionsLink, setInstructionsLink] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);

  // Ensure organizations and tags are arrays
  const organizationsList = organizations || [];
  const tagsList = tags || [];

  // Fetch the opportunity fresh to get the correct spotsFilled calculation
  const { data: fetchedOpportunity, isLoading: isLoadingOpportunity } =
    useOpportunityById(initialOpportunity?.id);

  // Use fetched opportunity if available, otherwise fall back to initial
  const opportunity = fetchedOpportunity || initialOpportunity;

  const { data: applications = [], isLoading: applicationsLoading } =
    useOpportunityApplications(opportunity?.id);
  const reviewApplication = useReviewApplication();
  const deleteApplication = useDeleteApplication();

  // Check if user can view applications (only admin or advocate)
  const canViewApplications =
    opportunity &&
    (isAdmin || (Array.isArray(isAdvocate) && isAdvocate.length > 0));

  // Check if user can edit (admin or advocate - backend will verify creator)
  const canEdit =
    opportunity &&
    (isAdmin || (Array.isArray(isAdvocate) && isAdvocate.length > 0));

  const handleReviewApplication = async (applicationId, status) => {
    try {
      await reviewApplication.mutateAsync({
        applicationId,
        reviewData: {
          status,
          notes: reviewNotes || undefined,
          ...(status === "approved" && {
            instructions: instructions || undefined,
            instructionsLink: instructionsLink || undefined,
          }),
        },
      });
      setReviewingApplicationId(null);
      setReviewNotes("");
      setInstructions("");
      setInstructionsLink("");
    } catch (error) {
      console.error("Error reviewing application:", error);
    }
  };

  const handleUpdateInstructions = async (applicationId) => {
    try {
      await reviewApplication.mutateAsync({
        applicationId,
        reviewData: {
          status: "approved", // Keep status as approved
          instructions: instructions || undefined,
          instructionsLink: instructionsLink || undefined,
        },
      });
      setEditingInstructionsId(null);
      setInstructions("");
      setInstructionsLink("");
    } catch (error) {
      console.error("Error updating instructions:", error);
    }
  };

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

  if (!opportunity || isLoadingOpportunity) {
    return (
      <div className="fixed inset-0 flex items-start justify-center bg-gray-400 bg-opacity-50 z-50 overflow-y-auto pt-4 sm:pt-8">
        <div className="bg-white rounded-lg max-w-6xl w-full mx-4 mb-4 relative">
          <div className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading opportunity...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    title,
    description,
    requirements,
    responsibilities,
    organizations: opportunityOrganizations = [],
    isVolunteer,
    compensationType,
    compensationAmount,
    compensationCurrency,
    timeCommitment,
    frequency,
    estimatedHours,
    duration,
    spotsAvailable,
    spotsFilled,
    isRemote,
    location,
    applicationDeadline,
    startDate,
    endDate,
    requiredSkills = [],
    preferredSkills = [],
    contactEmail,
    applicationUrl,
    applicationInstructions,
    tags: opportunityTags = [],
    isSaved,
    hasApplied,
  } = opportunity;

  const primaryOrg =
    opportunityOrganizations.find((org) => org.isPrimary) ||
    opportunityOrganizations[0];
  // Ensure spotsAvailable is at least 1 (default to 1 if 0 or null)
  const spotsAvailableNum = Math.max(Number(spotsAvailable) || 1, 1);
  const spotsFilledNum = Number(spotsFilled) || 0;
  const spotsRemaining = spotsAvailableNum - spotsFilledNum;
  // Only show as full if spotsRemaining is 0 AND there are actually approved applications
  const isFull = spotsRemaining <= 0 && spotsFilledNum > 0;

  const formatDate = (date) => {
    if (!date) return null;
    return DateTime.fromISO(date).toFormat("MMMM dd, yyyy");
  };

  const formatDateTime = (date) => {
    if (!date) return null;
    return DateTime.fromISO(date).toFormat("MMMM dd, yyyy 'at' h:mm a");
  };

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
    if (isVolunteer) return "Volunteer Position";
    if (compensationType === "paid" && compensationAmount) {
      return `${compensationCurrency || "$"}${compensationAmount}`;
    }
    if (compensationType === "travel_reimbursement") {
      return "Travel Reimbursement Provided";
    }
    if (compensationType === "stipend") {
      return compensationAmount
        ? `${compensationCurrency || "$"}${compensationAmount} Stipend`
        : "Stipend Available";
    }
    return "Compensation Available";
  };

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-gray-400 bg-opacity-50 z-50 overflow-y-auto pt-4 sm:pt-8">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 mb-4 relative">
        {/* Add close button for mobile */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-700/50 text-white hover:bg-slate-700 transition-colors sm:hidden"
          aria-label="Close modal"
        >
          ×
        </button>

        {/* Header Section */}
        <div className="bg-slate-800 border border-slate-700 text-white rounded-t-lg p-6">
          <div className="flex items-center gap-4">
            {primaryOrg?.imageUrl && (
              <div className="relative w-24 h-24 flex-shrink-0">
                <Image
                  src={primaryOrg.imageUrl}
                  alt={primaryOrg.name}
                  fill
                  className="object-contain rounded-lg bg-slate-700 p-1"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">{title}</h2>
              {primaryOrg && (
                <div className="flex items-center gap-1 text-slate-300 mb-2">
                  <FaBuilding className="w-4 h-4" />
                  {primaryOrg.name}
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${
                    isVolunteer
                      ? "bg-green-500/10 text-green-400 border-green-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}
                >
                  {isVolunteer ? (
                    <FaHandsHelping className="w-4 h-4" />
                  ) : (
                    <FaMoneyBillWave className="w-4 h-4" />
                  )}
                  {getCompensationLabel()}
                </span>

                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm border border-blue-500/20">
                  <FaMapMarkerAlt className="w-4 h-4" />
                  {isRemote ? "Remote" : location || "On-site"}
                </span>

                {timeCommitment && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm border border-blue-500/20">
                    <FaClock className="w-4 h-4" />
                    {timeCommitment}
                  </span>
                )}

                {frequency && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm border border-blue-500/20">
                    <FaCalendarAlt className="w-4 h-4" />
                    {getFrequencyLabel(frequency)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="hidden sm:block p-2 text-slate-300 hover:text-white transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          {/* Availability Alert */}
          {(isFull || spotsRemaining <= 3) && (
            <div
              className={`px-3 py-2 rounded-lg flex items-center gap-2 mb-6 ${
                isFull
                  ? "bg-red-50 border border-red-200"
                  : "bg-yellow-50 border border-yellow-200"
              }`}
            >
              {isFull ? (
                <>
                  <FaExclamationCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-800 font-medium text-sm">
                    This position is currently filled
                  </span>
                </>
              ) : (
                <>
                  <FaExclamationCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-800 font-medium text-sm">
                    Only {spotsRemaining} spot{spotsRemaining !== 1 ? "s" : ""}{" "}
                    remaining
                  </span>
                </>
              )}
            </div>
          )}

          {/* Top Row - Metadata Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-slate-600">
              <p>
                <strong>Type:</strong>{" "}
                {isVolunteer ? "Volunteer" : "Paid Position"}
              </p>
              {frequency && (
                <p>
                  <strong>Frequency:</strong> {getFrequencyLabel(frequency)}
                </p>
              )}
              {timeCommitment && (
                <p>
                  <strong>Time Commitment:</strong> {timeCommitment}
                </p>
              )}
              {duration && (
                <p>
                  <strong>Duration:</strong> {duration}
                </p>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-slate-600">
              {estimatedHours && (
                <p>
                  <strong>Estimated Hours:</strong> {estimatedHours} hours
                </p>
              )}
              {startDate && (
                <p>
                  <strong>Start Date:</strong> {formatDate(startDate) || "N/A"}
                </p>
              )}
              {endDate && (
                <p>
                  <strong>End Date:</strong> {formatDate(endDate) || "N/A"}
                </p>
              )}
              {applicationDeadline && (
                <p>
                  <strong>Application Deadline:</strong>{" "}
                  {formatDateTime(applicationDeadline) || "N/A"}
                </p>
              )}
            </div>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-slate-600">
              <p>
                <strong>Spots Available:</strong> {spotsRemaining} of{" "}
                {spotsAvailable}
              </p>
              {/* Contact Info */}
              {(contactEmail || applicationUrl) && (
                <div className="space-y-2 mt-2">
                  {contactEmail && (
                    <div className="flex items-center gap-2">
                      <FaEnvelope className="w-4 h-4 text-slate-500" />
                      <a
                        href={`mailto:${contactEmail}`}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {contactEmail}
                      </a>
                    </div>
                  )}
                  {applicationUrl && (
                    <div className="flex items-center gap-2">
                      <FaLink className="w-4 h-4 text-slate-500" />
                      <a
                        href={applicationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm"
                      >
                        External Application Link
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          {canViewApplications && (
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === "details"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Details
                </button>
                <button
                  onClick={() => setActiveTab("applications")}
                  className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors relative ${
                    activeTab === "applications"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Applications
                  {applications.length > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs">
                      {applications.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Main Content */}
          {activeTab === "details" ? (
            <div className="space-y-6 text-slate-600">
              <h3 className="text-xl font-semibold mb-4 text-slate-600">
                Opportunity Details
              </h3>

              {/* Description */}
              <div className="space-y-2 text-slate-600">
                <CustomEditor
                  content={description}
                  editor={false}
                  scrollable={true}
                />
              </div>

              {/* Requirements */}
              {requirements && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    Requirements
                  </h3>
                  <div className="relative max-h-20 overflow-hidden text-slate-600">
                    <CustomEditor
                      content={requirements}
                      editor={false}
                      scrollable={false}
                      compact={true}
                      textSize="text-sm"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Responsibilities */}
              {responsibilities && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-600 mb-2">
                    Responsibilities
                  </h3>
                  <div className="relative max-h-20 overflow-hidden text-slate-600">
                    <CustomEditor
                      content={responsibilities}
                      editor={false}
                      scrollable={false}
                      compact={true}
                      textSize="text-sm"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Skills */}
              {(requiredSkills.length > 0 || preferredSkills.length > 0) && (
                <div className="space-y-4">
                  {requiredSkills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-600 mb-3">
                        Required Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {requiredSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {preferredSkills.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-600 mb-3">
                        Preferred Skills
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {preferredSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {opportunityTags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-600 mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {opportunityTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                        style={{
                          backgroundColor: tag.color
                            ? `${tag.color}20`
                            : undefined,
                          color: tag.color || undefined,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Application Instructions */}
              {applicationInstructions && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-600 mb-3">
                    How to Apply
                  </h3>
                  <div className="space-y-2 text-slate-600">
                    <CustomEditor
                      content={applicationInstructions}
                      editor={false}
                      scrollable={true}
                    />
                  </div>
                </div>
              )}

              {/* Organizations */}
              {opportunityOrganizations.length > 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-600 mb-3">
                    Participating Organizations
                  </h3>
                  <div className="space-y-2">
                    {opportunityOrganizations.map((org) => (
                      <div
                        key={org.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        {org.imageUrl && (
                          <div className="relative w-10 h-10 flex-shrink-0">
                            <Image
                              src={org.imageUrl}
                              alt={org.name}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {org.name}
                            {org.isPrimary && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Primary
                              </span>
                            )}
                          </div>
                          {org.acronym && (
                            <div className="text-sm text-gray-600">
                              {org.acronym}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4 text-slate-600">
                Applications ({applications.length})
              </h3>

              {applicationsLoading ? (
                <div className="text-center py-8 text-gray-500">
                  Loading applications...
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <FaUsers className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">
                    No applications yet
                  </h4>
                  <p className="text-gray-600">
                    Applications will appear here once users start applying.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => {
                    const StatusIcon =
                      STATUS_ICONS[application.status] || FaHourglassHalf;
                    const statusColor =
                      STATUS_COLORS[application.status] ||
                      STATUS_COLORS.pending;

                    return (
                      <div
                        key={application.id}
                        className="bg-white border border-gray-200 rounded-lg p-6 relative"
                      >
                        {/* Delete button - top right */}
                        {canViewApplications && (
                          <button
                            onClick={() =>
                              handleDeleteApplication(application.id)
                            }
                            disabled={deleteApplication.isPending}
                            className="absolute top-4 right-4 p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete application"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        )}
                        <div className="flex justify-between items-start mb-4 pr-8">
                          <div className="flex items-center gap-3">
                            {application.user?.imageUrl ? (
                              <Image
                                src={application.user.imageUrl}
                                alt={`${application.user.firstName} ${application.user.lastName}`}
                                width={48}
                                height={48}
                                className="rounded-full"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <FaUser className="w-6 h-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {application.user?.firstName}{" "}
                                {application.user?.lastName}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {application.user?.email}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}
                          >
                            <StatusIcon className="w-4 h-4" />
                            {STATUS_LABELS[application.status] || "Pending"}
                          </span>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Applied:</span>{" "}
                            {formatDateTime(application.appliedAt)}
                          </p>
                          {/* {application.coverLetter && (
                            <div>
                              <p className="font-medium mb-1">Cover Letter:</p>
                              <p className="text-gray-700 whitespace-pre-wrap">
                                {application.coverLetter}
                              </p>
                            </div>
                          )} */}
                          {application.resumeUrl && (
                            <p>
                              <span className="font-medium">Resume:</span>{" "}
                              <a
                                href={application.resumeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Resume
                              </a>
                            </p>
                          )}
                          {application.additionalInfo?.linkedIn && (
                            <p>
                              <span className="font-medium">LinkedIn:</span>{" "}
                              <a
                                href={application.additionalInfo.linkedIn}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Profile
                              </a>
                            </p>
                          )}
                          {application.additionalInfo?.portfolio && (
                            <p>
                              <span className="font-medium">Portfolio:</span>{" "}
                              <a
                                href={application.additionalInfo.portfolio}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View Portfolio
                              </a>
                            </p>
                          )}
                          {application.additionalInfo?.availability && (
                            <div>
                              <p className="font-medium mb-1">Availability:</p>
                              <p className="text-gray-700 whitespace-pre-wrap">
                                {application.additionalInfo.availability}
                              </p>
                            </div>
                          )}
                          {application.reviewNotes && (
                            <div>
                              <p className="font-medium mb-1">Review Notes:</p>
                              <p className="text-gray-700 whitespace-pre-wrap">
                                {application.reviewNotes}
                              </p>
                            </div>
                          )}
                          {/* Instructions section - visible to applicants and editable by admins/creators */}
                          {application.status === "approved" && (
                            <div className="mt-4 pt-4 border-t border-green-200 bg-green-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-green-900">
                                  Next Steps & Instructions
                                </p>
                                {canViewApplications &&
                                  editingInstructionsId !== application.id && (
                                    <button
                                      onClick={() => {
                                        setEditingInstructionsId(
                                          application.id
                                        );
                                        setInstructions(
                                          application.instructions || ""
                                        );
                                        setInstructionsLink(
                                          application.instructionsLink || ""
                                        );
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                      Edit
                                    </button>
                                  )}
                              </div>
                              {editingInstructionsId === application.id ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={instructions}
                                    onChange={(e) =>
                                      setInstructions(e.target.value)
                                    }
                                    placeholder="Add instructions or next steps for the applicant..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                  />
                                  <input
                                    type="url"
                                    value={instructionsLink}
                                    onChange={(e) =>
                                      setInstructionsLink(e.target.value)
                                    }
                                    placeholder="Instructions link (e.g., https://example.com/get-started)"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleUpdateInstructions(application.id)
                                      }
                                      disabled={reviewApplication.isPending}
                                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingInstructionsId(null);
                                        setInstructions("");
                                        setInstructionsLink("");
                                      }}
                                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
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
                                  {!application.instructions &&
                                    !application.instructionsLink &&
                                    canViewApplications && (
                                      <p className="text-sm text-gray-500 italic">
                                        No instructions provided yet. Click Edit
                                        to add instructions.
                                      </p>
                                    )}
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Review Actions - Only show for pending/reviewing applications */}
                        {canViewApplications &&
                          (application.status === "pending" ||
                            application.status === "reviewing") && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              {reviewingApplicationId === application.id ? (
                                <div className="space-y-3">
                                  <textarea
                                    value={reviewNotes}
                                    onChange={(e) =>
                                      setReviewNotes(e.target.value)
                                    }
                                    placeholder="Add review notes (optional)..."
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                  />
                                  {/* Instructions fields - only show when approving */}
                                  <div className="space-y-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm font-medium text-green-900">
                                      Instructions for Approved Applicant
                                      (optional)
                                    </p>
                                    <textarea
                                      value={instructions}
                                      onChange={(e) =>
                                        setInstructions(e.target.value)
                                      }
                                      placeholder="Add instructions or next steps for the applicant..."
                                      rows={3}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                    />
                                    <input
                                      type="url"
                                      value={instructionsLink}
                                      onChange={(e) =>
                                        setInstructionsLink(e.target.value)
                                      }
                                      placeholder="Instructions link (e.g., https://example.com/get-started)"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        handleReviewApplication(
                                          application.id,
                                          "approved"
                                        )
                                      }
                                      disabled={reviewApplication.isPending}
                                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleReviewApplication(
                                          application.id,
                                          "reviewing"
                                        )
                                      }
                                      disabled={reviewApplication.isPending}
                                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    >
                                      Mark as Reviewing
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleReviewApplication(
                                          application.id,
                                          "rejected"
                                        )
                                      }
                                      disabled={reviewApplication.isPending}
                                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                                    >
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => {
                                        setReviewingApplicationId(null);
                                        setReviewNotes("");
                                        setInstructions("");
                                        setInstructionsLink("");
                                      }}
                                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    setReviewingApplicationId(application.id)
                                  }
                                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                  Review Application
                                </button>
                              )}
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors order-last sm:order-first"
            >
              Close
            </button>
            {canEdit && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
              >
                <FaEdit className="w-4 h-4" />
                Edit
              </button>
            )}
            <button
              onClick={() => onSaveToggle(opportunity)}
              className="flex items-center gap-2 px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
            >
              {isSaved ? (
                <>
                  <FaBookmark className="w-4 h-4" />
                  Saved
                </>
              ) : (
                <>
                  <FaRegBookmark className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={() => onApply(opportunity)}
              disabled={hasApplied || isFull}
              className={`px-6 py-2 rounded-lg transition-colors font-medium ${
                hasApplied
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : isFull
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
              }`}
            >
              {hasApplied
                ? "Already Applied"
                : isFull
                ? "Position Filled"
                : "Apply Now"}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <CreateOpportunityModal
          opportunity={opportunity}
          onClose={() => {
            setShowEditModal(false);
            // The query will be invalidated by the updateOpportunity hook
          }}
          organizations={organizationsList}
          tags={tagsList}
        />
      )}
    </div>
  );
};

export default OpportunityDetailModal;
