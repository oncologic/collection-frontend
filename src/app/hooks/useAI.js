"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCreditBalance,
  generateDescription,
  generateResourceChat,
  searchContent,
  processImageOCR,
  fetchTransactionHistory,
  previewStructuredNotations,
  confirmStructuredNotations,
  fetchUserCreditBalance,
  addCreditsToUser,
  setUserCreditBalance,
  previewBulkNotationUpdates,
  confirmBulkNotationUpdates,
  previewStructuredEvents,
  confirmStructuredEvents,
  previewStructuredResources,
  confirmStructuredResources,
  previewStructuredExternalLinks,
  confirmStructuredExternalLinks,
} from "@/app/api/aiApi";
import toast from "react-hot-toast";
import { useContextAuth } from "../context/authContext";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";

export const useAIAssist = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({
      prompt,
      currentContent,
      externalContent,
      contextDetails,
    }) => {
      const token = await getToken();
      return generateDescription({
        prompt,
        currentContent,
        contextDetails,
        externalContent,
        headers: {
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onSuccess: (data) => {
      // Don't show success toast here - let the component handle it
      // toast.success("Content generated successfully");
    },
    onError: (error) => {
      // Don't show error toast here - let the component handle it with more context
      // toast.error("Failed to generate content");
      console.error("Error generating description:", error);
    },
  });
};

export const useAIChat = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState(null);
  const [streamProgress, setStreamProgress] = useState({});

  const mutation = useMutation({
    mutationFn: async ({
      prompt,
      type,
      collectionResourceType,
      duration,
      history,
      collectionData,
      data,
      streamCallback,
      disableRAG = false,
    }) => {
      const token = await getToken();
      setIsStreaming(true);
      setStreamedResponse(null);
      setStreamProgress({});

      try {
        const onUpdate = (eventData) => {
          if (streamCallback) {
            streamCallback(eventData);
          }

          setStreamProgress((prev) => ({
            ...prev,
            ...eventData,
          }));

          if (eventData.type === "complete" || eventData.content) {
            setStreamedResponse(eventData);
          }
        };

        return await generateResourceChat({
          prompt,
          type,
          collectionResourceType,
          duration,
          history,
          collectionData,
          data: {
            ...data,
            disableRAG: disableRAG || data?.disableRAG,
            mentionedItems: data?.mentionedItems,
          },
          disableRAG: disableRAG || data?.disableRAG,
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Tenant-Ids": selectedTenants
              .map((tenant) => tenant.id)
              .join(","),
          },
          onUpdate,
        });
      } finally {
        setIsStreaming(false);
      }
    },
    onSuccess: (data) => {
      toast.success("Chat response received");
    },
    onError: (error) => {
      toast.error("Failed to get chat response");
      console.error("Error generating chat response:", error);
    },
  });

  return {
    ...mutation,
    isStreaming,
    streamedResponse,
    streamProgress,
  };
};

export const useCredits = () => {
  const { getToken } = useAuth();
  const { selectedTenants, isAdmin } = useContextAuth();
  const queryClient = useQueryClient();

  const balance = useQuery({
    queryKey: ["creditBalance"],
    queryFn: async () => {
      const token = await getToken();
      return fetchCreditBalance(token, {
        headers: {
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
  });

  const transactions = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const token = await getToken();
      return fetchTransactionHistory(token);
    },
  });

  // Admin functions - only available if user is admin
  const getUserBalance = useMutation({
    mutationFn: async ({ userId }) => {
      if (!isAdmin) {
        throw new Error("Admin access required");
      }
      const token = await getToken();
      return fetchUserCreditBalance(userId, token);
    },
    onError: (error) => {
      toast.error("Failed to fetch user balance");
      console.error("Error fetching user balance:", error);
    },
  });

  const addCreditsToUserAccount = useMutation({
    mutationFn: async ({
      userId,
      amount,
      description = "Admin credit addition",
    }) => {
      if (!isAdmin) {
        throw new Error("Admin access required");
      }
      const token = await getToken();
      return addCreditsToUser({ userId, amount, description, token });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["creditBalance"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["userBalance"] });
      toast.success(
        `Successfully added ${
          data.transaction?.amount || "credits"
        } to user account`
      );
    },
    onError: (error) => {
      toast.error("Failed to add credits to user");
      console.error("Error adding credits to user:", error);
    },
  });

  const setUserCreditBalanceMutation = useMutation({
    mutationFn: async ({
      userId,
      amount,
      description = "Admin credit balance adjustment",
    }) => {
      if (!isAdmin) {
        throw new Error("Admin access required");
      }
      const token = await getToken();
      return setUserCreditBalance({ userId, amount, description, token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["creditBalance"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["userBalance"] });
      toast.success("Credit balance updated");
    },
    onError: (error) => {
      toast.error("Failed to set credit balance");
      console.error("Error setting credit balance:", error);
    },
  });

  return {
    balance,
    transactions,
    // Admin functions
    ...(isAdmin && {
      getUserBalance,
      addCreditsToUserAccount,
      setUserCreditBalance: setUserCreditBalanceMutation,
    }),
  };
};

export const useContentSearch = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({ searchQuery, timeframe }) => {
      const token = await getToken();
      return searchContent({
        searchQuery,
        timeframe,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to search content");
      console.error("Error searching content:", error);
    },
  });
};

export const useOCR = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  return useMutation({
    mutationFn: async ({ imageUrl, prompt }) => {
      const token = await getToken();
      return processImageOCR({
        imageUrl,
        prompt,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onSuccess: (data) => {
      toast.success("Image processed successfully");
    },
    onError: (error) => {
      toast.error("Failed to process image");
      console.error("Error processing image:", error);
    },
  });
};

export const usePreviewNotations = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({
      prompt,
      externalLinkId,
      collectionId,
      contextDetails,
    }) => {
      const token = await getToken();
      return previewStructuredNotations({
        prompt,
        externalLinkId,
        collectionId,
        contextDetails,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to preview notations");
      console.error("Error previewing notations:", error);
    },
  });
};

export const useConfirmNotations = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({ notations, externalLinkId, collectionId }) => {
      const token = await getToken();
      return confirmStructuredNotations({
        notations,
        externalLinkId,
        collectionId,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onSuccess: (data) => {
      // Temporarily commenting out to debug duplicate notifications
      // toast.success(`Successfully created ${data.createdCount || 0} notations`);
    },
    onError: (error) => {
      toast.error("Failed to create notations");
      console.error("Error creating notations:", error);
    },
  });
};

// New hooks for bulk updates
export const usePreviewBulkNotationUpdates = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({
      prompt,
      existingNotations,
      externalLinkId,
      collectionId,
      contextDetails,
    }) => {
      const token = await getToken();
      return previewBulkNotationUpdates({
        prompt,
        existingNotations,
        externalLinkId,
        collectionId,
        contextDetails,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to preview bulk updates");
      console.error("Error previewing bulk updates:", error);
    },
  });
};

export const useConfirmBulkNotationUpdates = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({ updates, externalLinkId, collectionId }) => {
      const token = await getToken();
      return confirmBulkNotationUpdates({
        updates,
        externalLinkId,
        collectionId,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onSuccess: (data) => {
      // toast.success(`Successfully updated ${data.updatedCount || 0} notations`);
    },
    onError: (error) => {
      toast.error("Failed to update notations");
      console.error("Error updating notations:", error);
    },
  });
};

export const usePreviewEvents = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({
      prompt,
      metadata,
      organizationId,
      organizationIds,
      tenantId,
    }) => {
      const token = await getToken();
      return previewStructuredEvents({
        prompt,
        metadata,
        organizationId,
        organizationIds,
        tenantId,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to preview events");
      console.error("Error previewing events:", error);
    },
  });
};

export const useConfirmEvents = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({
      events,
      newOrganizations = [],
      organizationId,
      organizationIds,
      tenantId,
    }) => {
      const token = await getToken();
      return confirmStructuredEvents({
        events,
        newOrganizations,
        organizationId,
        organizationIds,
        tenantId,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onSuccess: (data) => {
      // Success message handled in component to avoid duplicates
    },
    onError: (error) => {
      toast.error("Failed to create events");
      console.error("Error creating events:", error);
    },
  });
};

export const usePreviewResources = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({
      prompt,
      metadata,
      organizationId,
      organizationIds,
      tenantId,
    }) => {
      const token = await getToken();
      return previewStructuredResources({
        prompt,
        metadata,
        organizationId,
        organizationIds,
        tenantId,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to preview resources");
      console.error("Error previewing resources:", error);
    },
  });
};

export const useConfirmResources = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({
      resources,
      newOrganizations = [],
      organizationId,
      organizationIds,
      tenantId,
    }) => {
      const token = await getToken();
      return confirmStructuredResources({
        resources,
        newOrganizations,
        organizationId,
        organizationIds,
        tenantId,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onSuccess: (data) => {
      // Success message handled in component to avoid duplicates
    },
    onError: (error) => {
      toast.error("Failed to create resources");
      console.error("Error creating resources:", error);
    },
  });
};

export const usePreviewExternalLinks = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({ prompt, metadata }) => {
      const token = await getToken();
      return previewStructuredExternalLinks({
        prompt,
        metadata,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to preview external links");
      console.error("Error previewing external links:", error);
    },
  });
};

export const useConfirmExternalLinks = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({ externalLinks }) => {
      const token = await getToken();
      return confirmStructuredExternalLinks({
        externalLinks,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onSuccess: (data) => {
      // Success message handled in component to avoid duplicates
    },
    onError: (error) => {
      toast.error("Failed to create external links");
      console.error("Error creating external links:", error);
    },
  });
};

export const useProcessImage = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({ imageData, prompt, mimeType = "image/jpeg" }) => {
      const token = await getToken();
      return processImageOCR({
        imageUrl: `data:${mimeType};base64,${imageData}`,
        prompt,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to process image");
      console.error("Error processing image:", error);
    },
  });
};

export const usePreviewOpportunities = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({
      prompt,
      metadata,
      organizationId,
      organizationIds,
      tenantId,
    }) => {
      const token = await getToken();
      return previewStructuredOpportunities({
        prompt,
        metadata,
        organizationId,
        organizationIds,
        tenantId,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onError: (error) => {
      toast.error("Failed to preview opportunities");
      console.error("Error previewing opportunities:", error);
    },
  });
};

export const useConfirmOpportunities = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({
      opportunity,
      newOrganizations = [],
      organizationIds,
    }) => {
      const token = await getToken();
      return confirmStructuredOpportunities({
        opportunity,
        newOrganizations,
        organizationIds,
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
        },
      });
    },
    onSuccess: (data) => {
      // Success message handled in component to avoid duplicates
    },
    onError: (error) => {
      toast.error("Failed to create opportunity");
      console.error("Error creating opportunity:", error);
    },
  });
};
