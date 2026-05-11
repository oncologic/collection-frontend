"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPendingResources,
  reviewPendingResource,
} from "../../app/api/resourcesApi";
import { useContextAuth } from "../../app/context/authContext";
import toast from "react-hot-toast";
import { DateTime } from "luxon";

export default function PendingResourcesManager({
  onClose,
  onApproveResource,
}) {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  const {
    data: pendingResources = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["pendingResources"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getPendingResources(headers);
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ resourceId, status }) => {
      const headers = await getAuthHeader();
      return reviewPendingResource(resourceId, status, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["pendingResources"]);
      queryClient.invalidateQueries(["pendingResourcesCount"]);
      queryClient.invalidateQueries(["resources"]);
      toast.success("Resource reviewed successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to review resource");
    },
  });

  const handleApprove = (resource) => {
    // If onApproveResource callback is provided, use it to open AddResource form
    if (onApproveResource) {
      onApproveResource(resource);
    } else {
      // Fallback to direct approval (old behavior)
      if (
        window.confirm(
          `Approve "${resource.name}"? This will make it visible to all users.`
        )
      ) {
        reviewMutation.mutate({
          resourceId: resource.id,
          status: "approved",
        });
      }
    }
  };

  const handleReject = (resource) => {
    if (
      window.confirm(
        `Reject "${resource.name}"? This will remove it from pending resources.`
      )
    ) {
      reviewMutation.mutate({
        resourceId: resource.id,
        status: "rejected",
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return DateTime.fromISO(dateString).toLocaleString(DateTime.DATETIME_MED);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Error loading pending resources: {error.message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Pending Resource Suggestions
        </h2>
      </div>

      {pendingResources.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No pending resources
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            All resource suggestions have been reviewed.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingResources.map((resource) => (
            <div
              key={resource.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {resource.name}
                  </h3>
                  {resource.description && (
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {resource.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
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
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      View Resource
                    </a>
                    <span>Submitted: {formatDate(resource.createdAt)}</span>
                    {resource.suggestedByEmail && (
                      <span className="flex items-center gap-1">
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
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        <a
                          href={`mailto:${resource.suggestedByEmail}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {resource.suggestedByEmail}
                        </a>
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(resource)}
                    disabled={reviewMutation.isPending}
                    className="px-4 py-2 bg-green-400 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(resource)}
                    disabled={reviewMutation.isPending}
                    className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
