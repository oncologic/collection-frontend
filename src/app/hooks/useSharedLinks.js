import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createSharedLink,
  getUserSharedLinks,
  revokeSharedLink,
  updateSharedLink,
  getSharedLinkById,
  accessSharedContent,
  submitUserInfo,
  submitFeedback,
  submitReview,
  getReviewData,
  getSharedLinksByTypeAndId,
  getSharedLinkGroupById,
  validateEmailAccess,
  getLinkGroupsWithEmail,
  submitReviewerInfoWithEmail,
  submitFeedbackWithEmail,
  getReviewDataWithEmail,
  toggleCollectionPublicJsonSharing,
  toggleExternalLinkPublicJsonSharing,
  getCollectionPublicSharingStatus,
  getExternalLinkPublicSharingStatus,
  getPublicCollectionJson,
  getPublicExternalLinkJson,
} from "@/app/api/shareApi";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { useContextAuth } from "../context/authContext";

export const useCreateSharedLink = () => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, id, expiryDays, emailList, description }) => {
      const headers = await getAuthHeader();
      return createSharedLink({
        type,
        id,
        expiryDays,
        emailList,
        description,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      });
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSharedLinks"] });
      toast.success("Link shared successfully");
    },
    onError: (error) => {
      toast.error("Failed to share link");
      console.error("Error creating shared link:", error);
    },
  });
};

export const useGetUserSharedLinks = () => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();

  return useQuery({
    queryKey: ["userSharedLinks"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getUserSharedLinks({
        headers,
      });
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onError: (error) => {
      console.error("Error fetching user shared links:", error);
    },
  });
};

export const useGetSharedLinksByTypeAndId = (type, id) => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();

  return useQuery({
    queryKey: ["sharedLinks", type, id],
    queryFn: async () => {
      if (!type || !id) return null;
      const headers = await getAuthHeader();
      return getSharedLinksByTypeAndId({
        type,
        id,
        headers,
      });
    },
    enabled: !!type && !!id && !!systemUser && !!selectedTenants?.length,
    onError: (error) => {
      console.error(`Error fetching shared links for ${type}/${id}:`, error);
    },
  });
};

export const useRevokeSharedLink = () => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkId) => {
      const headers = await getAuthHeader();
      return revokeSharedLink({
        linkId,
        headers,
      });
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSharedLinks"] });
      toast.success("Link revoked successfully");
    },
    onError: (error) => {
      toast.error("Failed to revoke link");
      console.error("Error revoking shared link:", error);
    },
  });
};

export const useUpdateSharedLink = () => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, updates }) => {
      const headers = await getAuthHeader();
      return updateSharedLink({
        linkId,
        updates,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      });
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userSharedLinks"] });
      toast.success("Link updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update link");
      console.error("Error updating shared link:", error);
    },
  });
};

export const useGetSharedLinkById = (linkId) => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();

  return useQuery({
    queryKey: ["sharedLink", linkId],
    queryFn: async () => {
      if (!linkId) return null;
      const headers = await getAuthHeader();
      return getSharedLinkById({
        linkId,
        headers,
      });
    },
    enabled: !!linkId,
    onError: (error) => {
      console.error("Error fetching shared link:", error);
    },
  });
};

export const useAccessSharedContent = (linkId, token, email) => {
  return useQuery({
    queryKey: ["sharedContent", linkId, token, email],
    queryFn: async () => {
      if (!linkId || !token || !email) {
        throw new Error("Missing required parameters");
      }

      try {
        return await accessSharedContent({ linkId, token, email });
      } catch (error) {
        // Enhanced error logging for debugging
        console.error("❌ Access shared content failed:", {
          linkId: linkId,
          token: token?.substring(0, 10) + "...",
          email: email?.substring(0, 3) + "***",
          error: error.message,
          status: error.status,
          fullError: error,
        });

        // Enhanced error handling for external links in collections
        if (
          error.message.includes("Shared link not found") ||
          error.message.includes("has expired")
        ) {
          // This might be an external link within a collection
          console.warn(
            `🔧 Auto-resolution needed for linkId: ${linkId} with token: ${token?.substring(
              0,
              10
            )}...`
          );
          console.warn(
            "This might be an external link within a collection that needs backend auto-resolution"
          );

          // Enhance the error message for better user experience
          const enhancedError = new Error(
            `Backend Auto-Resolution Required: This appears to be an external link within a shared collection. The backend needs to implement auto-resolution to find the parent collection and validate access using the collection's shared link settings.`
          );
          enhancedError.status = error.status;
          enhancedError.originalError = error;
          throw enhancedError;
        }
        throw error;
      }
    },
    enabled: !!linkId && !!token && !!email,
    retry: (failureCount, error) => {
      // Don't retry if it's clearly an authorization issue
      if (
        error.message.includes("not authorized") ||
        error.message.includes("Access denied") ||
        error.message.includes("Backend Auto-Resolution Required")
      ) {
        return false;
      }
      // Retry up to 2 times for other errors (network issues, etc.)
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSubmitUserInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, token, userInfo }) => {
      return submitUserInfo({ linkId, token, userInfo });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviewData", variables.linkId, variables.token],
      });
      toast.success("Information submitted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit information");
      console.error("Error submitting user info:", error);
    },
  });
};

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      linkId,
      token,
      email,
      itemId,
      reviewerId,
      action,
      note,
    }) => {
      return submitFeedback({
        linkId,
        token,
        email,
        itemId,
        reviewerId,
        action,
        note,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviewData", variables.linkId, variables.token],
      });
      toast.success("Feedback submitted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit feedback");
      console.error("Error submitting feedback:", error);
    },
  });
};

export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, token, email, reviewerId, feedback }) => {
      return submitReview({ linkId, token, email, reviewerId, feedback });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviewData", variables.linkId, variables.token],
      });
      toast.success("Review submitted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit review");
      console.error("Error submitting review:", error);
    },
  });
};

export const useGetReviewData = (linkId, token, email) => {
  return useQuery({
    queryKey: ["reviewData", linkId, token, email],
    queryFn: async () => {
      if (!linkId || !token) return null;
      return getReviewData({ linkId, token, email });
    },
    enabled: !!linkId && !!token && !!email,
    onError: (error) => {
      console.error("Error fetching review data:", error);
    },
  });
};

export const useGetSharedLinkGroupById = (id, token, email) => {
  return useQuery({
    queryKey: ["sharedLinkGroup", id, token, email],
    queryFn: async () => {
      if (!id || !token) {
        return null;
      }

      const result = await getSharedLinkGroupById({ id, token, email });
      return result;
    },
    enabled: !!id && !!token,
    onError: (error) => {
      console.error("Error fetching shared link group:", error);
    },
  });
};

export const useValidateEmailAccess = () => {
  return useMutation({
    mutationFn: async ({ linkId, email, token, collectionId = null }) => {
      try {
        return await validateEmailAccess(linkId, email, token);
      } catch (error) {
        // Enhanced error context for debugging
        console.error("Email validation failed:", {
          linkId,
          email: email?.substring(0, 3) + "***", // Partial email for privacy
          token: token?.substring(0, 10) + "...", // Partial token for privacy
          collectionId,
          error: error.message,
        });

        // If this is an external link that might belong to a collection,
        // provide helpful error context
        if (error.message.includes("Shared link not found") && collectionId) {
          throw new Error(
            `External link validation failed. This external link (${linkId}) might belong to collection (${collectionId}) and require backend auto-resolution.`
          );
        }

        throw error;
      }
    },
    onError: (error) => {
      console.error("Error validating email access:", error);
    },
  });
};

export const useGetLinkGroupsWithEmail = () => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();

  return useQuery({
    queryKey: ["linkGroupsWithEmail"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getLinkGroupsWithEmail({ headers });
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onError: (error) => {
      console.error("Error fetching link groups with email:", error);
    },
  });
};

export const useSubmitReviewerInfoWithEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, token, reviewerInfo }) => {
      return submitReviewerInfoWithEmail({ linkId, token, reviewerInfo });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviewData", variables.linkId, variables.token],
      });
      toast.success("Reviewer information submitted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit reviewer information");
      console.error("Error submitting reviewer information:", error);
    },
  });
};

export const useSubmitFeedbackWithEmail = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkId, token, itemId, reviewerId, action, note }) => {
      return submitFeedbackWithEmail({
        linkId,
        token,
        itemId,
        reviewerId,
        action,
        note,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["reviewData", variables.linkId, variables.token],
      });
      toast.success("Feedback submitted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit feedback");
      console.error("Error submitting feedback:", error);
    },
  });
};

export const useGetReviewDataWithEmail = (linkId, token) => {
  return useQuery({
    queryKey: ["reviewDataWithEmail", linkId, token],
    queryFn: async () => {
      if (!linkId || !token) return null;
      return getReviewDataWithEmail({ linkId, token });
    },
    enabled: !!linkId && !!token,
    onError: (error) => {
      console.error("Error fetching review data with email:", error);
    },
  });
};

// Public JSON Sharing Hooks
export const useToggleCollectionPublicJsonSharing = () => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, enabled }) => {
      const headers = await getAuthHeader();
      return toggleCollectionPublicJsonSharing({
        collectionId,
        enabled,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      });
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["collection", variables.collectionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["collections", variables.collectionId],
      });
      queryClient.invalidateQueries({
        queryKey: ["collectionPublicSharingStatus"],
      });
      toast.success(
        `Public JSON sharing ${
          variables.enabled ? "enabled" : "disabled"
        } successfully`
      );
    },
    onError: (error) => {
      toast.error(`Failed to toggle public JSON sharing: ${error.message}`);
      console.error("Error toggling collection public JSON sharing:", error);
    },
  });
};

export const useToggleExternalLinkPublicJsonSharing = () => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ externalLinkId, enabled }) => {
      const headers = await getAuthHeader();
      return toggleExternalLinkPublicJsonSharing({
        externalLinkId,
        enabled,
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      });
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["externalLinks", variables.externalLinkId],
      });
      queryClient.invalidateQueries({
        queryKey: ["externalLinkPublicSharingStatus"],
      });
      toast.success(
        `Public JSON sharing ${
          variables.enabled ? "enabled" : "disabled"
        } successfully`
      );
    },
    onError: (error) => {
      toast.error(`Failed to toggle public JSON sharing: ${error.message}`);
      console.error("Error toggling external link public JSON sharing:", error);
    },
  });
};

export const useGetCollectionPublicSharingStatus = (collectionIds) => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();

  return useQuery({
    queryKey: ["collectionPublicSharingStatus", collectionIds],
    queryFn: async () => {
      if (
        !collectionIds ||
        (Array.isArray(collectionIds) && collectionIds.length === 0)
      ) {
        return null;
      }
      const headers = await getAuthHeader();
      return getCollectionPublicSharingStatus({
        collectionIds,
        headers,
      });
    },
    enabled: !!collectionIds && !!systemUser && !!selectedTenants?.length,
    onError: (error) => {
      console.error("Error fetching collection public sharing status:", error);
    },
  });
};

export const useGetExternalLinkPublicSharingStatus = (externalLinkIds) => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();

  return useQuery({
    queryKey: ["externalLinkPublicSharingStatus", externalLinkIds],
    queryFn: async () => {
      if (
        !externalLinkIds ||
        (Array.isArray(externalLinkIds) && externalLinkIds.length === 0)
      ) {
        return null;
      }
      const headers = await getAuthHeader();
      return getExternalLinkPublicSharingStatus({
        externalLinkIds,
        headers,
      });
    },
    enabled: !!externalLinkIds && !!systemUser && !!selectedTenants?.length,
    onError: (error) => {
      console.error(
        "Error fetching external link public sharing status:",
        error
      );
    },
  });
};

// Public access hooks (no auth required)
export const useGetPublicCollectionJson = (collectionId) => {
  return useQuery({
    queryKey: ["publicCollection", collectionId],
    queryFn: async () => {
      if (!collectionId) return null;
      return getPublicCollectionJson(collectionId);
    },
    enabled: !!collectionId,
    retry: false, // Don\'t retry on auth errors
    onError: (error) => {
      console.error("Error fetching public collection:", error);
    },
  });
};

export const useGetPublicExternalLinkJson = (externalLinkId) => {
  return useQuery({
    queryKey: ["publicExternalLink", externalLinkId],
    queryFn: async () => {
      if (!externalLinkId) return null;
      return getPublicExternalLinkJson(externalLinkId);
    },
    enabled: !!externalLinkId,
    retry: false, // Don\'t retry on auth errors
    onError: (error) => {
      console.error("Error fetching public external link:", error);
    },
  });
};
