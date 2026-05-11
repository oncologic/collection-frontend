import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useContextAuth } from "../context/authContext";
import { toast } from "react-hot-toast";
import {
  addResourcesToExternalLink,
  getExternalLinkResources,
  removeResourcesFromExternalLink,
  updateExternalLinkResourceOrder,
  updateExternalLinkResourceNotes,
} from "../api/externalLinkResourceApi";

// Get resources for an external link
export const useExternalLinkResources = (collectionId, externalLinkId) => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["externalLinkResources", collectionId, externalLinkId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getExternalLinkResources(collectionId, externalLinkId, headers);
    },
    enabled: !!collectionId && !!externalLinkId && !!systemUser && !!selectedTenants?.length,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Add resources to external link
export const useAddResourcesToExternalLink = () => {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useContextAuth();

  return useMutation({
    mutationFn: async ({ collectionId, externalLinkId, resources }) => {
      const headers = await getAuthHeader();
      return addResourcesToExternalLink(
        collectionId,
        externalLinkId,
        resources,
        headers
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        "externalLinkResources",
        variables.collectionId,
        variables.externalLinkId,
      ]);
      toast.success(
        `${data.addedCount} resource${
          data.addedCount !== 1 ? "s" : ""
        } added successfully`
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add resources");
    },
  });
};

// Remove resources from external link
export const useRemoveResourcesFromExternalLink = () => {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useContextAuth();

  return useMutation({
    mutationFn: async ({ collectionId, externalLinkId, resourceIds }) => {
      const headers = await getAuthHeader();
      return removeResourcesFromExternalLink(
        collectionId,
        externalLinkId,
        resourceIds,
        headers
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        "externalLinkResources",
        variables.collectionId,
        variables.externalLinkId,
      ]);
      toast.success(
        `${data.removedCount} resource${
          data.removedCount !== 1 ? "s" : ""
        } removed successfully`
      );
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove resources");
    },
  });
};

// Update resource order
export const useUpdateResourceOrder = () => {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useContextAuth();

  return useMutation({
    mutationFn: async ({ collectionId, externalLinkId, resourceId, orderPosition }) => {
      const headers = await getAuthHeader();
      return updateExternalLinkResourceOrder(
        collectionId,
        externalLinkId,
        resourceId,
        orderPosition,
        headers
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        "externalLinkResources",
        variables.collectionId,
        variables.externalLinkId,
      ]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update resource order");
    },
  });
};

// Update resource notes
export const useUpdateResourceNotes = () => {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useContextAuth();

  return useMutation({
    mutationFn: async ({ collectionId, externalLinkId, resourceId, notes }) => {
      const headers = await getAuthHeader();
      return updateExternalLinkResourceNotes(
        collectionId,
        externalLinkId,
        resourceId,
        notes,
        headers
      );
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        "externalLinkResources",
        variables.collectionId,
        variables.externalLinkId,
      ]);
      toast.success("Notes updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update resource notes");
    },
  });
};