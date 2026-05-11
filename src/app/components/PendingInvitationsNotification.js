import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaTimes,
  FaCheck,
  FaClock,
  FaExternalLinkAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import {
  useGetPendingInvitations,
  useAcceptPendingInvitations,
} from "../hooks/useCollections";
import { toast } from "react-hot-toast";

const PendingInvitationsNotification = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const { data: pendingInvitations, isLoading } = useGetPendingInvitations();
  const { mutate: acceptAllInvitations, isLoading: isAccepting } =
    useAcceptPendingInvitations();

  // Check if there are any pending invitations
  const hasPendingInvitations = pendingInvitations?.data?.length > 0;

  // Auto-dismiss if no pending invitations
  useEffect(() => {
    if (!isLoading && !hasPendingInvitations) {
      setIsDismissed(true);
    }
  }, [isLoading, hasPendingInvitations]);

  const handleAcceptAll = () => {
    acceptAllInvitations(undefined, {
      onSuccess: () => {
        setIsDismissed(true);
      },
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't render if loading, dismissed, or no invitations
  if (isLoading || isDismissed || !hasPendingInvitations) {
    return null;
  }

  const invitations = pendingInvitations.data;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-white border border-blue-200 rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <FaUsers className="text-blue-600 text-sm" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  Pending Invitations
                </h3>
                <p className="text-sm text-blue-700">
                  {invitations.length} collaboration{" "}
                  {invitations.length === 1 ? "invitation" : "invitations"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              <button
                onClick={handleDismiss}
                className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                aria-label="Dismiss"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-600 text-sm mb-4">
            You have pending collaboration invitations. Accept them to start
            collaborating!
          </p>

          {/* Invitation List (when expanded) */}
          {isExpanded && (
            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {invitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {invitation.externalLinkName || "External Link"}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        in {invitation.collectionName || "Collection"}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <FaClock className="mr-1" />
                        <span>
                          From {invitation.inviterFirstName}{" "}
                          {invitation.inviterLastName}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {invitation.role}
                        </span>
                      </div>
                    </div>
                  </div>
                  {invitation.message && (
                    <p className="text-xs text-gray-600 mt-2 italic">
                      &quot;{invitation.message}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleAcceptAll}
              disabled={isAccepting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center justify-center"
            >
              {isAccepting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Accepting...
                </>
              ) : (
                <>
                  <FaCheck className="mr-2" />
                  Accept All
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingInvitationsNotification;
