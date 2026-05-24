"use client";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  FaTrash,
  FaSpinner,
  FaCheck,
  FaTimes,
  FaCrown,
} from "react-icons/fa";
import {
  useUserSubscription,
  useCancelSubscription,
  useSubscriptionStatus,
} from "../hooks/useSubscription";

const SubscriptionPage = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  // Use existing hooks instead of direct fetch
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    error: subscriptionError,
  } = useUserSubscription();

  const { data: status, isLoading: statusLoading } = useSubscriptionStatus();

  const { mutate: cancelSubscription, isPending: cancelling } =
    useCancelSubscription();

  const loading = subscriptionLoading || statusLoading;

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
      return;
    }
  }, [user, isLoaded, router]);

  const handleCancelSubscription = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel your subscription? You will lose access to premium features immediately."
      )
    ) {
      return;
    }

    try {
      await cancelSubscription();
    } catch (error) {
      // Error handling is done in the hook
      console.error("Error cancelling subscription:", error);
    }
  };

  const getPlanName = (planId) => {
    const planNames = {
      explorer: "Explorer",
      basic: "Basic",
      advocate: "Advocate",
      professional: "Professional",
      enterprise: "Enterprise",
    };
    return planNames[planId] || "Unknown Plan";
  };

  // Get subscription data from the hook response - updated for actual API structure
  const userData = subscription?.subscription?.user;
  const planData = subscription?.subscription?.plan;
  const currentPlan = userData?.subscriptionPlan;
  const subscriptionStatus = userData?.subscriptionStatus;

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subscription Management
          </h1>
          <p className="text-gray-600">
            Manage your internal subscription and plan access
          </p>
        </div>

        {/* Current Subscription */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <FaCrown className="text-yellow-500" />
              Current Plan
            </h2>
            {subscriptionStatus && (
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  subscriptionStatus === "active"
                    ? "bg-green-100 text-green-800"
                    : subscriptionStatus === "trialing"
                    ? "bg-blue-100 text-blue-800"
                    : subscriptionStatus === "past_due"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {subscriptionStatus.charAt(0).toUpperCase() +
                  subscriptionStatus.slice(1)}
              </span>
            )}
          </div>

          {userData && planData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {planData.displayName || getPlanName(currentPlan)} Plan
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">
                      ${planData.price || "0.00"}/
                      {planData.billingInterval || "month"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Plan ends:</span>
                    <span className="font-medium">
                      {userData.subscriptionEndDate
                        ? new Date(
                            userData.subscriptionEndDate
                          ).toLocaleDateString()
                        : planData.price === "0.00"
                        ? "Free Plan"
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="font-medium">
                      {userData.subscriptionStartDate
                        ? new Date(
                            userData.subscriptionStartDate
                          ).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  {planData.description && (
                    <div className="mt-4">
                      <span className="text-gray-600 text-sm">
                        {planData.description}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push("/pricing")}
                  className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <FaCrown className="w-4 h-4" />
                  {planData.price === "0.00" ? "Upgrade Plan" : "Change Plan"}
                </button>

                {/* Only show cancel for paid active subscriptions */}
                {subscriptionStatus === "active" &&
                  planData.price !== "0.00" && (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={cancelling}
                      className="w-full border border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {cancelling ? (
                        <FaSpinner className="w-4 h-4 animate-spin" />
                      ) : (
                        <FaTrash className="w-4 h-4" />
                      )}
                      Cancel Subscription
                    </button>
                  )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                You don&apos;t have an active subscription
              </p>
              <button
                onClick={() => router.push("/pricing")}
                className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Plans
              </button>
            </div>
          )}
        </div>

        {/* Usage Stats */}
        {subscription?.usage && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Current Usage
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">External Collections</span>
                    <span className="text-sm font-medium">
                      {subscription.usage.externalCollections.current} /{" "}
                      {subscription.usage.externalCollections.unlimited
                        ? "∞"
                        : subscription.usage.externalCollections.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: subscription.usage.externalCollections.unlimited
                          ? "0%"
                          : `${Math.min(
                              (subscription.usage.externalCollections.current /
                                subscription.usage.externalCollections.limit) *
                                100,
                              100
                            )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Attachments</span>
                    <span className="text-sm font-medium">
                      {subscription.usage.attachments.current} /{" "}
                      {subscription.usage.attachments.unlimited
                        ? "∞"
                        : subscription.usage.attachments.limit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: subscription.usage.attachments.unlimited
                          ? "0%"
                          : `${Math.min(
                              (subscription.usage.attachments.current /
                                subscription.usage.attachments.limit) *
                                100,
                              100
                            )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Features</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {subscription.usage.features.canAddCollaborators ? (
                      <FaCheck className="text-green-500" />
                    ) : (
                      <FaTimes className="text-red-500" />
                    )}
                    <span>Add Collaborators</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {subscription.usage.features.canCreateFolders ? (
                      <FaCheck className="text-green-500" />
                    ) : (
                      <FaTimes className="text-red-500" />
                    )}
                    <span>Create Folders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {subscription.usage.features.canExportData ? (
                      <FaCheck className="text-green-500" />
                    ) : (
                      <FaTimes className="text-red-500" />
                    )}
                    <span>Export Data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {subscription.usage.features.prioritySupport ? (
                      <FaCheck className="text-green-500" />
                    ) : (
                      <FaTimes className="text-red-500" />
                    )}
                    <span>Priority Support</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SubscriptionPage;
