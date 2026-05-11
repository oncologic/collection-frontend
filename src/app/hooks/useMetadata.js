import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchLinkGroups,
  fetchLinkGroupById,
  createLinkGroup,
  updateLinkGroup,
  deleteLinkGroup,
  createResourceType,
  updateResourceType,
  deleteResourceType,
  createEventType,
  updateEventType,
  deleteEventType,
  createTag,
  updateTag,
  deleteTag,
} from "../api/metadataApi";

import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { useContextAuth } from "../context/authContext";
import { useGetSharedLinkGroupById } from "./useSharedLinks";

export function useResourceTypes() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  return useQuery({
    queryKey: [
      "resourceTypes",
      (selectedTenants || []).map((tenant) => tenant.id).sort(),
    ],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/resource-types`,
        {
          headers,
        }
      ).then((res) => res.json());
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
}

export function useCreateResourceType(options = {}) {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resourceTypeData) => {
      const headers = await getAuthHeader();
      return createResourceType(resourceTypeData, headers);
    },
    onSuccess: () => {
      toast.success("Resource type created successfully");
      queryClient.invalidateQueries({ queryKey: ["resourceTypes"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create resource type");
    },
    ...options,
  });
}

export function useUpdateResourceType(options = {}) {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resourceTypeData }) => {
      const headers = await getAuthHeader();
      return updateResourceType(id, resourceTypeData, headers);
    },
    onSuccess: () => {
      toast.success("Resource type updated successfully");
      queryClient.invalidateQueries({ queryKey: ["resourceTypes"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update resource type");
    },
    ...options,
  });
}

export function useDeleteResourceType(options = {}) {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const headers = await getAuthHeader();
      return deleteResourceType(id, headers);
    },
    onSuccess: () => {
      toast.success("Resource type deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["resourceTypes"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete resource type");
    },
    ...options,
  });
}

export function useEventTypes() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  return useQuery({
    queryKey: ["eventTypes", selectedTenants],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/event-types`,
        {
          headers,
        }
      ).then((res) => res.json());
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
}

export function useSensitivityLevels() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  return useQuery({
    queryKey: ["sensitivityLevels"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/sensitivity-levels`,
        {
          headers,
        }
      ).then((res) => res.json());
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
}

export function useExpertiseLevels() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  return useQuery({
    queryKey: ["expertiseLevels"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/expertise-levels`,
        {
          headers,
        }
      ).then((res) => res.json());
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
}

export function useTags() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  return useQuery({
    queryKey: ["tags", selectedTenants],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tags`, {
        headers,
      }).then((res) => res.json());
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
}

export function useLinkGroups() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const { getToken } = useAuth();
  const token = getToken();
  return useQuery({
    queryKey: ["linkGroups"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchLinkGroups(token, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
}

export function useLinkGroupById(
  id,
  sharedToken,
  sharedEmail,
  linkingType = "external_link"
) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const { getToken } = useAuth();

  // Only call useGetSharedLinkGroupById if we have a shared token
  const { data: sharedLinkGroup, isLoading: isLoadingShared } =
    useGetSharedLinkGroupById(
      sharedToken ? id : null,
      sharedToken,
      sharedEmail
    );

  return useQuery({
    queryKey: ["linkGroup", id, sharedToken, sharedEmail, linkingType],
    queryFn: async () => {
      // If we have a shared token and shared data is available, use it
      if (sharedToken && sharedLinkGroup) {
        return sharedLinkGroup;
      }

      // If no shared token, use the regular metadata endpoint
      if (!sharedToken) {
        const clerkHeader = await getAuthHeader();
        const token = await getToken();
        const headers = {
          ...clerkHeader,
          Authorization: `Bearer ${token}`,
        };
        return fetchLinkGroupById(id, headers, linkingType);
      }

      // If we have a shared token but no shared data yet, return null and wait for the shared data
      return null;
    },
    enabled:
      !!id &&
      ((!!systemUser && !!selectedTenants?.length && !sharedToken) || // Regular auth case
        (!!sharedToken && !isLoadingShared)), // Shared token case
  });
}

export function useCreateLinkGroupLink(options = {}) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (linkGroupLinkData) => {
      const headers = await getAuthHeader();

      const data = await createLinkGroup(linkGroupLinkData, {
        ...headers,
        "Content-Type": "application/json",
      });
      return data;
    },
    onMutate: async (newLinkData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["linkGroup"] });

      // Snapshot the previous value
      const previousLinkGroups = queryClient.getQueryData(["linkGroup"]);

      // Create a temporary ID for the optimistic update
      const tempId = `temp-${Date.now()}`;
      const category = newLinkData.category?.toLowerCase() || "other";

      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: ["linkGroup"] }, (old) => {
        if (!old) return { [category]: [{ ...newLinkData, id: tempId }] };

        const updated = { ...old };
        if (!updated[category]) {
          updated[category] = [];
        }
        updated[category] = [
          ...updated[category],
          { ...newLinkData, id: tempId },
        ];

        return updated;
      });

      return { previousLinkGroups };
    },
    onError: (err, newLink, context) => {
      // Rollback on error
      queryClient.setQueriesData(
        { queryKey: ["linkGroup"] },
        context.previousLinkGroups
      );
      toast.error("Failed to create link");
    },
    onSuccess: () => {
      toast.success("Link group link created successfully");
      queryClient.invalidateQueries({ queryKey: ["linkGroup"] });
    },
    ...options,
  });
}

export function useUpdateLinkGroupLink(options = {}) {
  const { getAuthHeader, selectedTenants, systemUser } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ linkGroupId, linkGroupData }) => {
      const authHeader = await getAuthHeader();
      const headers = {
        ...authHeader,
        "Content-Type": "application/json",
      };
      const data = await updateLinkGroup(linkGroupId, linkGroupData, headers);
      return data;
    },
    onSuccess: () => {
      toast.success("Link group updated successfully");
      queryClient.invalidateQueries({ queryKey: ["linkGroups"] });
      queryClient.invalidateQueries({ queryKey: ["linkGroup"] });
    },
    ...options,
  });
}

export function useDeleteLinkGroup(options = {}) {
  const queryClient = useQueryClient();
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async (id) => {
      const headers = await getAuthHeader();

      const data = await deleteLinkGroup(id, headers);
      return data;
    },
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["linkGroup"] });

      // Snapshot the previous value
      const previousLinkGroups = queryClient.getQueryData(["linkGroup"]);

      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: ["linkGroup"] }, (old) => {
        if (!old) return old;

        // Create a new object with filtered items for each category
        const updated = Object.fromEntries(
          Object.entries(old).map(([category, items]) => [
            category,
            items.filter((item) => item.id !== deletedId),
          ])
        );

        // Remove empty categories
        return Object.fromEntries(
          Object.entries(updated).filter(([_, items]) => items.length > 0)
        );
      });

      return { previousLinkGroups };
    },
    onError: (err, deletedId, context) => {
      // Rollback on error
      queryClient.setQueriesData(
        { queryKey: ["linkGroup"] },
        context.previousLinkGroups
      );
      toast.error("Failed to delete link");
    },
    onSuccess: () => {
      toast.success("Link deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["linkGroup"] });
    },
    ...options,
  });
}

// Event Type Mutations
export function useCreateEventType(options = {}) {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventTypeData) => {
      const headers = await getAuthHeader();
      return createEventType(eventTypeData, headers);
    },
    onSuccess: () => {
      toast.success("Event type created successfully");
      queryClient.invalidateQueries({ queryKey: ["eventTypes"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create event type");
    },
    ...options,
  });
}

export function useUpdateEventType(options = {}) {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventTypeData }) => {
      const headers = await getAuthHeader();
      return updateEventType(id, eventTypeData, headers);
    },
    onSuccess: () => {
      toast.success("Event type updated successfully");
      queryClient.invalidateQueries({ queryKey: ["eventTypes"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update event type");
    },
    ...options,
  });
}

export function useDeleteEventType(options = {}) {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const headers = await getAuthHeader();
      return deleteEventType(id, headers);
    },
    onSuccess: () => {
      toast.success("Event type deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["eventTypes"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete event type");
    },
    ...options,
  });
}

// Tag Mutations
export function useCreateTag(options = {}) {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData) => {
      const headers = await getAuthHeader();
      return createTag(tagData, headers);
    },
    onSuccess: () => {
      toast.success("Tag created successfully");
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create tag");
    },
    ...options,
  });
}

export function useUpdateTag(options = {}) {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tagData }) => {
      const headers = await getAuthHeader();
      return updateTag(id, tagData, headers);
    },
    onSuccess: () => {
      toast.success("Tag updated successfully");
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update tag");
    },
    ...options,
  });
}

export function useDeleteTag(options = {}) {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const headers = await getAuthHeader();
      return deleteTag(id, headers);
    },
    onSuccess: () => {
      toast.success("Tag deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete tag");
    },
    ...options,
  });
}
