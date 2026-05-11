import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useContextAuth } from "../context/authContext";
import {
  getNotationSubmissions,
  approveNotationSubmission,
  rejectNotationSubmission,
  getNotationSubmission,
} from "../api/notationSubmissionsApi";
import toast from "react-hot-toast";

export function useNotationSubmissions(externalLinkId) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  // Fetch pending submissions
  const {
    data: pendingSubmissions,
    isLoading: pendingLoading,
    error: pendingError,
    refetch: refetchPending,
  } = useQuery({
    queryKey: ["notationSubmissions", externalLinkId, "pending"],
    queryFn: async () => {
      if (!externalLinkId) return [];
      const headers = await getAuthHeader();
      return getNotationSubmissions(externalLinkId, headers, "pending");
    },
    enabled: !!externalLinkId && !!systemUser && !!selectedTenants?.length,
  });

  // Fetch approved submissions
  const {
    data: approvedSubmissions,
    isLoading: approvedLoading,
    error: approvedError,
    refetch: refetchApproved,
  } = useQuery({
    queryKey: ["notationSubmissions", externalLinkId, "approved"],
    queryFn: async () => {
      if (!externalLinkId) return [];
      const headers = await getAuthHeader();
      return getNotationSubmissions(externalLinkId, headers, "approved");
    },
    enabled: !!externalLinkId && !!systemUser && !!selectedTenants?.length,
  });

  // Fetch rejected submissions
  const {
    data: rejectedSubmissions,
    isLoading: rejectedLoading,
    error: rejectedError,
    refetch: refetchRejected,
  } = useQuery({
    queryKey: ["notationSubmissions", externalLinkId, "rejected"],
    queryFn: async () => {
      if (!externalLinkId) return [];
      const headers = await getAuthHeader();
      return getNotationSubmissions(externalLinkId, headers, "rejected");
    },
    enabled: !!externalLinkId && !!systemUser && !!selectedTenants?.length,
  });

  // Approve submission mutation
  const approveMutation = useMutation({
    mutationFn: async (submissionId) => {
      const headers = await getAuthHeader();
      return approveNotationSubmission(submissionId, headers);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(["notationSubmissions", externalLinkId]);
      queryClient.invalidateQueries(["externalLinkById", externalLinkId]);
      queryClient.invalidateQueries(["externalLinkNotations"]);
      toast.success("Submission approved successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve submission");
      console.error("Error approving submission:", error);
    },
  });

  // Reject submission mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ submissionId, reviewNotes }) => {
      const headers = await getAuthHeader();
      return rejectNotationSubmission(submissionId, reviewNotes, headers);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries(["notationSubmissions", externalLinkId]);
      toast.success("Submission rejected");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to reject submission");
      console.error("Error rejecting submission:", error);
    },
  });

  // Get submission details
  const useSubmissionDetails = (submissionId) => {
    return useQuery({
      queryKey: ["notationSubmission", submissionId],
      queryFn: async () => {
        if (!submissionId) return null;
        const headers = await getAuthHeader();
        return getNotationSubmission(submissionId, headers);
      },
      enabled: !!submissionId && !!systemUser && !!selectedTenants?.length,
    });
  };

  return {
    // Data
    pendingSubmissions,
    approvedSubmissions,
    rejectedSubmissions,
    
    // Loading states
    pendingLoading,
    approvedLoading,
    rejectedLoading,
    
    // Errors
    pendingError,
    approvedError,
    rejectedError,
    
    // Actions
    refetchPending,
    refetchApproved,
    refetchRejected,
    approveSubmission: approveMutation.mutateAsync,
    rejectSubmission: rejectMutation.mutateAsync,
    
    // Hooks
    useSubmissionDetails,
    
    // Loading states for mutations
    isApproving: approveMutation.isLoading,
    isRejecting: rejectMutation.isLoading,
  };
}