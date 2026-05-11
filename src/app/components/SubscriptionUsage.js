import React from "react";
import {
  FaCheck,
  FaTimes,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  useUserSubscription,
  useSubscriptionLimits,
} from "../hooks/useSubscription";

const SubscriptionUsage = ({ showTitle = true, compact = false }) => {
  const {
    data: userSubscription,
    isLoading: isLoadingSubscription,
    error: subscriptionError,
  } = useUserSubscription();

  const {
    data: limits,
    isLoading: isLoadingLimits,
    error: limitsError,
  } = useSubscriptionLimits();

  if (isLoadingSubscription || isLoadingLimits) {
    return (
      <div
        className={`${
          compact ? "p-3" : "p-6"
        } bg-white rounded-lg shadow-sm border border-gray-200`}
      >
        <div className="flex items-center justify-center">
          <FaSpinner className="w-5 h-5 text-blue-600 animate-spin mr-2" />
          <span className="text-gray-600">Loading subscription info...</span>
        </div>
      </div>
    );
  }

  if (subscriptionError || limitsError) {
    return (
      <div
        className={`${
          compact ? "p-3" : "p-6"
        } bg-red-50 rounded-lg border border-red-200`}
      >
        <div className="flex items-center">
          <FaExclamationTriangle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-700">
            Failed to load subscription information
          </span>
        </div>
      </div>
    );
  }

  if (!userSubscription || !limits) {
    return null;
  }

  const { plan, externalCollections, attachments, features } = userSubscription;

  const getUsageColor = (current, limit, unlimited) => {
    if (unlimited) return "text-green-600";
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return "text-red-600";
    if (percentage >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const getProgressBarColor = (current, limit, unlimited) => {
    if (unlimited) return "bg-green-500";
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div
      className={`${
        compact ? "p-4" : "p-6"
      } bg-white rounded-lg shadow-sm border border-gray-200`}
    >
      {showTitle && (
        <div className="mb-4">
          <h3
            className={`${
              compact ? "text-lg" : "text-xl"
            } font-semibold text-gray-900`}
          >
            Subscription Usage
          </h3>
          <p className="text-sm text-gray-600">
            Current Plan:{" "}
            <span className="font-medium">
              {plan?.displayName || plan?.name}
            </span>
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* External Collections Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              External Collections
            </span>
            <span
              className={`text-sm font-medium ${getUsageColor(
                externalCollections.current,
                externalCollections.limit,
                externalCollections.unlimited
              )}`}
            >
              {externalCollections.unlimited
                ? `${externalCollections.current} / Unlimited`
                : `${externalCollections.current} / ${externalCollections.limit}`}
            </span>
          </div>
          {!externalCollections.unlimited && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(
                  externalCollections.current,
                  externalCollections.limit,
                  externalCollections.unlimited
                )}`}
                style={{
                  width: `${Math.min(
                    (externalCollections.current / externalCollections.limit) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Attachments Usage */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Attachments
            </span>
            <span
              className={`text-sm font-medium ${getUsageColor(
                attachments.current,
                attachments.limit,
                attachments.unlimited
              )}`}
            >
              {attachments.unlimited
                ? `${attachments.current} / Unlimited`
                : `${attachments.current} / ${attachments.limit}`}
            </span>
          </div>
          {!attachments.unlimited && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(
                  attachments.current,
                  attachments.limit,
                  attachments.unlimited
                )}`}
                style={{
                  width: `${Math.min(
                    (attachments.current / attachments.limit) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Features */}
        {!compact && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Plan Features
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center">
                {features.canAddCollaborators ? (
                  <FaCheck className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <FaTimes className="w-4 h-4 text-gray-400 mr-2" />
                )}
                <span className="text-sm text-gray-600">
                  Team Collaboration
                </span>
              </div>
              <div className="flex items-center">
                {features.canCreateFolders ? (
                  <FaCheck className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <FaTimes className="w-4 h-4 text-gray-400 mr-2" />
                )}
                <span className="text-sm text-gray-600">Folder Creation</span>
              </div>
              <div className="flex items-center">
                {features.canExportData ? (
                  <FaCheck className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <FaTimes className="w-4 h-4 text-gray-400 mr-2" />
                )}
                <span className="text-sm text-gray-600">Data Export</span>
              </div>
              <div className="flex items-center">
                {features.prioritySupport ? (
                  <FaCheck className="w-4 h-4 text-green-500 mr-2" />
                ) : (
                  <FaTimes className="w-4 h-4 text-gray-400 mr-2" />
                )}
                <span className="text-sm text-gray-600">Priority Support</span>
              </div>
            </div>
          </div>
        )}

        {/* Upgrade prompt for limits */}
        {(externalCollections.current / externalCollections.limit >= 0.8 &&
          !externalCollections.unlimited) ||
        (attachments.current / attachments.limit >= 0.8 &&
          !attachments.unlimited) ? (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <FaExclamationTriangle className="w-4 h-4 text-yellow-600 mr-2" />
              <span className="text-sm text-yellow-800">
                You&apos;re approaching your plan limits. Consider upgrading for
                unlimited access.
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SubscriptionUsage;
