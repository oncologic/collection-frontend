"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useReviewApplication } from "../hooks/useOpportunities";
import { fetchOpportunityApplications } from "../api/opportunitiesApi";
import { useAuth } from "@clerk/nextjs";
import { useContextAuth } from "../context/authContext";
import { DateTime } from "luxon";
import {
  FaEnvelope,
  FaUser,
  FaChevronDown,
  FaChevronUp,
  FaCopy,
  FaCheck,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import LoadingSkeleton from "./LoadingSkeleton";
import Modal from "./Modal";
import toast from "react-hot-toast";

const STATUS_COLORS = {
  pending: "bg-white text-gray-700 border border-gray-200",
  reviewing: "bg-white text-blue-700 border border-blue-200",
  approved: "bg-white text-green-700 border border-green-200",
  rejected: "bg-white text-red-700 border border-red-200",
  withdrawn: "bg-white text-gray-700 border border-gray-200",
};

const STATUS_DOT_COLORS = {
  pending: "bg-orange-500",
  reviewing: "bg-blue-500",
  approved: "bg-green-500",
  rejected: "bg-red-500",
  withdrawn: "bg-gray-500",
};

const STATUS_LABELS = {
  pending: "Pending",
  reviewing: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

const AllApplicationsView = ({ opportunities, organizations, tags }) => {
  const [expandedOpportunities, setExpandedOpportunities] = useState(new Set());
  const [statusFilter, setStatusFilter] = useState("all");
  const [applicationsData, setApplicationsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showApprovalEmailModal, setShowApprovalEmailModal] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(null);
  const [emailCopied, setEmailCopied] = useState(false);
  const [addressCopied, setAddressCopied] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [instructionsLink, setInstructionsLink] = useState("");
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const reviewApplication = useReviewApplication();

  // Fetch applications for all opportunities
  useEffect(() => {
    const fetchAllApplications = async () => {
      if (opportunities.length === 0 || selectedTenants.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const token = await getToken();
      const headers = {
        "X-Tenant-Ids": selectedTenants.map((t) => t.id).join(","),
      };

      const appsData = {};
      for (const opp of opportunities) {
        try {
          const apps = await fetchOpportunityApplications({
            opportunityId: opp.id,
            token,
            headers,
          });
          appsData[opp.id] = apps;
        } catch (error) {
          console.error(`Error fetching applications for ${opp.id}:`, error);
          appsData[opp.id] = [];
        }
      }
      setApplicationsData(appsData);
      setIsLoading(false);
    };

    fetchAllApplications();
  }, [opportunities, selectedTenants, getToken]);

  // Combine all applications with their opportunity info
  const allApplications = useMemo(() => {
    const apps = [];
    opportunities.forEach((opportunity) => {
      const appsForOpp = applicationsData[opportunity.id] || [];
      appsForOpp.forEach((app) => {
        apps.push({
          ...app,
          opportunity,
        });
      });
    });
    return apps;
  }, [opportunities, applicationsData]);

  // Filter applications by status
  const filteredApplications = useMemo(() => {
    if (statusFilter === "all") return allApplications;
    return allApplications.filter((app) => app.status === statusFilter);
  }, [allApplications, statusFilter]);

  // Group applications by opportunity
  const applicationsByOpportunity = useMemo(() => {
    const grouped = {};
    filteredApplications.forEach((app) => {
      const oppId = app.opportunity.id;
      if (!grouped[oppId]) {
        grouped[oppId] = {
          opportunity: app.opportunity,
          applications: [],
        };
      }
      grouped[oppId].applications.push(app);
    });
    return Object.values(grouped);
  }, [filteredApplications]);

  const toggleOpportunity = (oppId) => {
    const newExpanded = new Set(expandedOpportunities);
    if (newExpanded.has(oppId)) {
      newExpanded.delete(oppId);
    } else {
      newExpanded.add(oppId);
    }
    setExpandedOpportunities(newExpanded);
  };

  const handleApproveClick = (application, opportunity) => {
    setPendingApproval({ application, opportunity });
    // Pre-populate with existing instructions if available
    setInstructions(application.instructions || "");
    setInstructionsLink(application.instructionsLink || "");
    setShowApprovalEmailModal(true);
  };

  const handleConfirmApproval = async () => {
    if (!pendingApproval) return;

    try {
      await reviewApplication.mutateAsync({
        applicationId: pendingApproval.application.id,
        reviewData: { 
          status: "approved",
          instructions: instructions.trim() || null,
          instructionsLink: instructionsLink.trim() || null,
        },
      });
      
      // Close modal first
      setShowApprovalEmailModal(false);
      setPendingApproval(null);
      setEmailCopied(false);
      setAddressCopied(false);
      setInstructions("");
      setInstructionsLink("");
      
      // Refetch all applications after review to ensure status filters work correctly
      const token = await getToken();
      const headers = {
        "X-Tenant-Ids": selectedTenants.map((t) => t.id).join(","),
      };
      
      // Refetch applications for all opportunities
      const appsData = { ...applicationsData }; // Start with current state
      for (const opp of opportunities) {
        try {
          const apps = await fetchOpportunityApplications({
            opportunityId: opp.id,
            token,
            headers,
          });
          appsData[opp.id] = apps;
        } catch (error) {
          console.error(`Error fetching applications for ${opp.id}:`, error);
          // Keep existing data on error
        }
      }
      // Create a new object to ensure React detects the change
      setApplicationsData({ ...appsData });
      toast.success("Application approved successfully!");
    } catch (error) {
      console.error("Error reviewing application:", error);
      toast.error("Failed to approve application");
    }
  };

  const handleReview = async (applicationId, status, opportunityId) => {
    try {
      await reviewApplication.mutateAsync({
        applicationId,
        reviewData: { status },
      });
      // Refetch all applications after review to ensure status filters work correctly
      const token = await getToken();
      const headers = {
        "X-Tenant-Ids": selectedTenants.map((t) => t.id).join(","),
      };
      
      // Refetch applications for all opportunities
      const appsData = { ...applicationsData }; // Start with current state
      for (const opp of opportunities) {
        try {
          const apps = await fetchOpportunityApplications({
            opportunityId: opp.id,
            token,
            headers,
          });
          appsData[opp.id] = apps;
        } catch (error) {
          console.error(`Error fetching applications for ${opp.id}:`, error);
          // Keep existing data on error
        }
      }
      // Create a new object to ensure React detects the change
      setApplicationsData({ ...appsData });
      toast.success(`Application ${status} successfully!`);
    } catch (error) {
      console.error("Error reviewing application:", error);
      toast.error(`Failed to ${status} application`);
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return DateTime.fromISO(date).toFormat("MMM dd, yyyy");
  };

  const getApplicantInfo = (application) => {
    if (application.user) {
      return {
        name: `${application.user.firstName || ""} ${application.user.lastName || ""}`.trim() || "User",
        email: application.user.email,
        isAnonymous: false,
      };
    }
    return {
      name: application.applicantName || "Anonymous Applicant",
      email: application.applicantEmail,
      isAnonymous: true,
    };
  };

  const generateApprovalEmail = (application, opportunity) => {
    const applicant = getApplicantInfo(application);
    const applicantName = applicant.name;
    const opportunityTitle = opportunity.title || "the opportunity";
    const primaryOrg = opportunity.organizations?.[0];
    const orgName = primaryOrg?.name || "";
    
    // Use provided instructions or default message
    const customInstructions = instructions.trim() || application.instructions || "";
    const customLink = instructionsLink.trim() || application.instructionsLink || "";

    let nextStepsSection = "";
    if (customInstructions) {
      nextStepsSection = `Next Steps:\n${customInstructions}`;
      if (customLink) {
        nextStepsSection += `\n\nFor more information, please visit: ${customLink}`;
      }
    } else {
      nextStepsSection = `Next Steps:
- We will be in touch shortly with more details about getting started
- Please keep an eye on your email for further instructions
- If you have any questions, feel free to reach out to us`;
      if (customLink) {
        nextStepsSection += `\n\nFor more information, please visit: ${customLink}`;
      }
    }

    return `Subject: Congratulations! Your Application for ${opportunityTitle} Has Been Approved

Dear ${applicantName},

We are pleased to inform you that your application for ${opportunityTitle}${orgName ? ` at ${orgName}` : ""} has been approved!

We were impressed by your qualifications and are excited about the possibility of working with you.

${nextStepsSection}

Thank you for your interest, and we look forward to working with you!

Best regards,
The ${orgName || "Opportunity"} Team`;
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "email") {
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
        toast.success("Email copied to clipboard!");
      } else {
        setAddressCopied(true);
        setTimeout(() => setAddressCopied(false), 2000);
        toast.success("Email address copied to clipboard!");
      }
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  if (isLoading) {
    return <LoadingSkeleton count={5} />;
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Filter by Status
        </label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {allApplications.length}
            </div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {allApplications.filter((app) => app.status === "pending").length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      {applicationsByOpportunity.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FaEnvelope className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No applications found
          </h3>
          <p className="text-gray-600">
            {statusFilter !== "all"
              ? `No applications with status "${STATUS_LABELS[statusFilter]}"`
              : "No applications have been submitted yet"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applicationsByOpportunity.map(({ opportunity, applications }) => {
            const isExpanded = expandedOpportunities.has(opportunity.id);
            return (
              <div
                key={opportunity.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm"
              >
                <button
                  onClick={() => toggleOpportunity(opportunity.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900">
                      {opportunity.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {applications.length} application
                      {applications.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {isExpanded ? (
                    <FaChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <FaChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-4 space-y-3">
                    {applications.map((application) => {
                      const applicant = getApplicantInfo(application);
                      return (
                        <div
                          key={application.id}
                          className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <FaUser className="w-4 h-4 text-gray-400" />
                                <span className="font-medium text-gray-900">
                                  {applicant.name}
                                </span>
                                {applicant.isAnonymous && (
                                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                                    Anonymous
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                <FaEnvelope className="w-3 h-3" />
                                <a
                                  href={`mailto:${applicant.email}`}
                                  className="hover:text-blue-600"
                                >
                                  {applicant.email}
                                </a>
                              </div>
                              <div className="text-xs text-gray-500 mb-2">
                                Applied: {formatDate(application.appliedAt)}
                              </div>
                              {application.coverLetter && (
                                <div className="text-sm text-gray-700 mt-2 line-clamp-2">
                                  {application.coverLetter}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-2 h-2 rounded-full ${STATUS_DOT_COLORS[application.status]}`}
                                />
                                <span
                                  className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium ${STATUS_COLORS[application.status]}`}
                                >
                                  {STATUS_LABELS[application.status]}
                                </span>
                              </div>
                              {application.status === "pending" && (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handleApproveClick(application, opportunity)
                                    }
                                    disabled={reviewApplication.isPending}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
                                  >
                                    <FaCheckCircle className="w-4 h-4 text-green-600" />
                                    Accept
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleReview(application.id, "rejected", opportunity.id)
                                    }
                                    disabled={reviewApplication.isPending}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
                                  >
                                    <FaTimesCircle className="w-4 h-4 text-red-600" />
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approval Email Modal */}
      {showApprovalEmailModal && pendingApproval && (
        <Modal
          isOpen={showApprovalEmailModal}
          onClose={() => {
            setShowApprovalEmailModal(false);
            setPendingApproval(null);
            setEmailCopied(false);
            setAddressCopied(false);
            setInstructions("");
            setInstructionsLink("");
          }}
          maxWidth="max-w-2xl"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Approval Email Draft
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Copy the email below to notify the applicant
                </p>
              </div>
              <button
                onClick={() => {
                  setShowApprovalEmailModal(false);
                  setPendingApproval(null);
                  setEmailCopied(false);
                  setAddressCopied(false);
                  setInstructions("");
                  setInstructionsLink("");
                }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant Email Address */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1 block">
                    Applicant Email Address
                  </label>
                  <div className="flex items-center gap-2">
                    <FaEnvelope className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-900">
                      {getApplicantInfo(pendingApproval.application).email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(
                      getApplicantInfo(pendingApproval.application).email,
                      "address"
                    )
                  }
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy email address"
                >
                  {addressCopied ? (
                    <FaCheck className="w-4 h-4 text-green-600" />
                  ) : (
                    <FaCopy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Instructions and Link */}
            <div className="mb-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Next Steps Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Enter detailed instructions for the applicant (e.g., meeting times, required documents, contact information)..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Instructions Link (Optional)
                </label>
                <input
                  type="url"
                  value={instructionsLink}
                  onChange={(e) => setInstructionsLink(e.target.value)}
                  placeholder="https://example.com/instructions"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Draft Email */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-700 mb-2 block">
                Draft Email
              </label>
              <div className="relative">
                <textarea
                  readOnly
                  value={generateApprovalEmail(
                    pendingApproval.application,
                    pendingApproval.opportunity
                  )}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono resize-none"
                />
                <button
                  onClick={() =>
                    copyToClipboard(
                      generateApprovalEmail(
                        pendingApproval.application,
                        pendingApproval.opportunity
                      ),
                      "email"
                    )
                  }
                  className="absolute top-2 right-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Copy email"
                >
                  {emailCopied ? (
                    <FaCheck className="w-4 h-4 text-green-600" />
                  ) : (
                    <FaCopy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowApprovalEmailModal(false);
                  setPendingApproval(null);
                  setEmailCopied(false);
                  setAddressCopied(false);
                  setInstructions("");
                  setInstructionsLink("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApproval}
                disabled={reviewApplication.isPending}
                className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-sm"
              >
                <FaCheckCircle className="w-4 h-4 text-green-600" />
                {reviewApplication.isPending
                  ? "Approving..."
                  : "Confirm Approval"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AllApplicationsView;
