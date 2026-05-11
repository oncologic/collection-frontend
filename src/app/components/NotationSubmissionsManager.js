"use client";

import React, { useState } from "react";
import { useNotationSubmissions } from "../hooks/useNotationSubmissions";
import {
  FaCheck,
  FaTimes,
  FaClock,
  FaUser,
  FaEnvelope,
  FaEye,
  FaChevronDown,
  FaChevronUp,
  FaExclamationCircle,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import CustomEditor from "./common/CustomEditor";
import toast from "react-hot-toast";

const NotationSubmissionsManager = ({ externalLinkId, onClose }) => {
  const {
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    pendingLoading,
    approveSubmission,
    rejectSubmission,
    isApproving,
    isRejecting,
  } = useNotationSubmissions(externalLinkId);

  const [activeTab, setActiveTab] = useState("pending");
  const [expandedSubmissions, setExpandedSubmissions] = useState(new Set());
  const [rejectNotes, setRejectNotes] = useState({});
  const [showRejectDialog, setShowRejectDialog] = useState(null);

  const toggleSubmission = (submissionId) => {
    setExpandedSubmissions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(submissionId)) {
        newSet.delete(submissionId);
      } else {
        newSet.add(submissionId);
      }
      return newSet;
    });
  };

  const handleApprove = async (submission) => {
    if (
      window.confirm(
        `Approve submission "${submission.notation?.title}"? This will make it visible as a regular notation.`
      )
    ) {
      try {
        // Use notationId from the submission object
        const notationId =
          submission.notationId ||
          submission.submission?.notationId ||
          submission.notation?.id;
        if (!notationId) {
          console.error("No notation ID found in submission:", submission);
          toast.error("Unable to approve: No notation ID found");
          return;
        }
        await approveSubmission(notationId);
      } catch (error) {
        console.error("Error approving submission:", error);
      }
    }
  };

  const handleReject = async (submission) => {
    const notes = rejectNotes[submission.id] || "";
    if (!notes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    try {
      // Use notationId from the submission object
      const notationId =
        submission.notationId ||
        submission.submission?.notationId ||
        submission.notation?.id;
      if (!notationId) {
        console.error("No notation ID found in submission:", submission);
        toast.error("Unable to reject: No notation ID found");
        return;
      }
      await rejectSubmission({
        submissionId: notationId,
        reviewNotes: notes,
      });
      setShowRejectDialog(null);
      setRejectNotes((prev) => ({ ...prev, [submission.id]: "" }));
    } catch (error) {
      console.error("Error rejecting submission:", error);
    }
  };

  const getSubmissionsByTab = () => {
    switch (activeTab) {
      case "pending":
        return pendingSubmissions || [];
      case "approved":
        return approvedSubmissions || [];
      case "rejected":
        return rejectedSubmissions || [];
      default:
        return [];
    }
  };

  const submissions = getSubmissionsByTab();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    // Parse the UTC date string and ensure proper conversion to local time
    const utcDate = new Date(dateString);

    // The date is already parsed as UTC by JavaScript's Date constructor
    // toLocaleString will automatically convert to the user's local timezone
    return utcDate.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });
  };

  const renderCustomFields = (customFields) => {
    if (!customFields || Object.keys(customFields).length === 0) {
      return null;
    }

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <h5 className="text-xs font-semibold text-gray-700 mb-2">
          Custom Fields
        </h5>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(customFields).map(([key, value]) => {
            const displayKey = key
              .replace(/([a-z])([A-Z])/g, "$1 $2")
              .replace(/_/g, " ")
              .replace(/\b\w/g, (letter) => letter.toUpperCase());

            return (
              <div key={key} className="text-xs">
                <span className="font-medium text-gray-600">{displayKey}:</span>
                <span className="ml-1 text-gray-800">
                  {typeof value === "boolean"
                    ? value
                      ? "Yes"
                      : "No"
                    : Array.isArray(value)
                    ? value.join(", ")
                    : value || "-"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (pendingLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Public Notation Submissions
        </h3>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "pending"
              ? "text-blue-600 border-blue-600"
              : "text-gray-600 border-transparent hover:text-gray-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <FaClock className="w-3.5 h-3.5" />
            Pending
            {pendingSubmissions?.length > 0 && (
              <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs">
                {pendingSubmissions.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab("approved")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "approved"
              ? "text-blue-600 border-blue-600"
              : "text-gray-600 border-transparent hover:text-gray-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <FaCheckCircle className="w-3.5 h-3.5" />
            Approved
            {approvedSubmissions?.length > 0 && (
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">
                {approvedSubmissions.length}
              </span>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "rejected"
              ? "text-blue-600 border-blue-600"
              : "text-gray-600 border-transparent hover:text-gray-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <FaTimesCircle className="w-3.5 h-3.5" />
            Rejected
            {rejectedSubmissions?.length > 0 && (
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs">
                {rejectedSubmissions.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {submissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No {activeTab} submissions
          </div>
        ) : (
          submissions.map((submission) => (
            <div
              key={submission.id}
              className="border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div
                onClick={() => toggleSubmission(submission.id)}
                className="p-4 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {submission.notation?.title || "Untitled Submission"}
                    </h4>
                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <FaUser className="w-3 h-3" />
                        {submission.submissionMetadata?.submitterName || 
                         submission.notation?.submissionMetadata?.submitterName || 
                         "Anonymous"}
                      </div>
                      {(submission.submissionMetadata?.submitterEmail || 
                        submission.notation?.submissionMetadata?.submitterEmail) && (
                        <div className="flex items-center gap-1">
                          <FaEnvelope className="w-3 h-3" />
                          {submission.submissionMetadata?.submitterEmail || 
                           submission.notation?.submissionMetadata?.submitterEmail}
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    {/* {activeTab === "pending" && (
                      <span className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                        <FaExclamationCircle className="w-3 h-3 mr-1" />
                        Awaiting Review
                      </span>
                    )} */}
                    {activeTab === "approved" && (
                      <div className="mt-2 text-xs text-green-600">
                        Approved
                        {submission.reviewedByUser &&
                          ` by ${submission.reviewedByUser.name}`}
                      </div>
                    )}
                    {activeTab === "rejected" && submission.reviewNotes && (
                      <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                        <strong>Rejection reason:</strong>{" "}
                        {submission.reviewNotes}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {activeTab === "pending" && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(submission);
                          }}
                          disabled={isApproving}
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                        >
                          <FaCheck className="inline mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowRejectDialog(submission.id);
                          }}
                          disabled={isRejecting}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                        >
                          <FaTimes className="inline mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    {expandedSubmissions.has(submission.id) ? (
                      <FaChevronUp className="text-gray-400" />
                    ) : (
                      <FaChevronDown className="text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedSubmissions.has(submission.id) && (
                <div className="px-4 pb-4 border-t border-gray-200">
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">
                      Content
                    </h5>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <CustomEditor
                        content={submission.notation?.notes || ""}
                        readOnly={true}
                        transparent={true}
                        textColor="text-gray-800"
                        scrollable={false}
                        compact={true}
                        contextDetails={{
                          parseMarkdown: true,
                        }}
                      />
                    </div>
                  </div>

                  {/* Custom Fields */}
                  {renderCustomFields(submission.notation?.customFields)}

                  {/* Metadata */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h5 className="text-xs font-semibold text-blue-900 mb-2">
                      Submission Details
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                      <div>
                        <span className="font-medium">Status:</span>{" "}
                        {submission.notation?.status || "Pending"}
                      </div>
                      <div>
                        <span className="font-medium">Category:</span>{" "}
                        {submission.notation?.category || "public-submission"}
                      </div>
                    </div>
                  </div>

                  {/* Reject Dialog */}
                  {showRejectDialog === submission.id && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h5 className="text-sm font-semibold text-red-900 mb-2">
                        Provide Rejection Reason
                      </h5>
                      <textarea
                        value={rejectNotes[submission.id] || ""}
                        onChange={(e) =>
                          setRejectNotes((prev) => ({
                            ...prev,
                            [submission.id]: e.target.value,
                          }))
                        }
                        placeholder="Enter reason for rejection..."
                        className="w-full px-3 py-2 border border-red-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        rows={3}
                      />
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setShowRejectDialog(null);
                            setRejectNotes((prev) => ({
                              ...prev,
                              [submission.id]: "",
                            }));
                          }}
                          className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReject(submission)}
                          disabled={
                            !rejectNotes[submission.id]?.trim() || isRejecting
                          }
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-md transition-colors disabled:opacity-50"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotationSubmissionsManager;
