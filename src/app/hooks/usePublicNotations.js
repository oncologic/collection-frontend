import { useMutation, useQuery } from "@tanstack/react-query";
import { getPublicTemplate } from "../api/notationTemplatesApi";
import { submitPublicNotation } from "../api/publicNotationsApi";
import toast from "react-hot-toast";

export function usePublicNotations(externalLinkId, collectionId = null) {
  // Fetch public template for an external link
  const {
    data: publicTemplate,
    isLoading: templateLoading,
    error: templateError,
    refetch: refetchTemplate,
  } = useQuery({
    queryKey: ["publicTemplate", externalLinkId, collectionId],
    queryFn: async () => {
      if (!externalLinkId) return null;
      return getPublicTemplate(externalLinkId, collectionId);
    },
    enabled: !!externalLinkId,
  });

  // Submit public notation mutation
  const submitNotationMutation = useMutation({
    mutationFn: async (notationData) => {
      if (!externalLinkId) {
        throw new Error("External link ID is required");
      }
      if (!publicTemplate?.submissionToken) {
        throw new Error(
          "Public notation submissions are not configured for this link."
        );
      }
      return submitPublicNotation(
        externalLinkId,
        notationData,
        publicTemplate.submissionToken,
        collectionId
      );
    },
    onSuccess: (data) => {
      toast.success("Thank you! Your notation has been submitted successfully.");
      return data;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit notation. Please try again.");
      console.error("Error submitting public notation:", error);
    },
  });

  return {
    // Data
    publicTemplate,
    templateLoading,
    templateError,

    // Actions
    refetchTemplate,
    submitNotation: submitNotationMutation.mutateAsync,

    // Loading states
    isSubmitting: submitNotationMutation.isLoading,
  };
}
