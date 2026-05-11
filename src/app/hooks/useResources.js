import { useAuth } from "@clerk/nextjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { useContextAuth } from "../context/authContext";
import { toast } from "react-hot-toast";
import {
  updateResource,
  fetchResourcesForSubscriptions,
  fetchResources,
  getResourceById,
  rateResource,
  getPendingResources,
} from "../api/resourcesApi";

export function useCreateResource() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async (resourceInput) => {
      const token = await getToken();
      const wrappedPayload =
        resourceInput &&
        typeof resourceInput === "object" &&
        !(resourceInput instanceof FormData) &&
        resourceInput.__resourcePayload;
      const resource = wrappedPayload
        ? resourceInput.__resourcePayload
        : resourceInput;
      const tenantHeaderIds = Array.from(
        new Set(
          (
            Array.isArray(resourceInput?.__tenantHeaderIds)
              ? resourceInput.__tenantHeaderIds
              : selectedTenants.map((tenant) => tenant.id)
          ).filter(Boolean)
        )
      );

      // Check if resource is FormData (for image upload) or regular object
      const isFormData = resource instanceof FormData;

      const headers = {
        Authorization: `Bearer ${token}`,
        "X-Tenant-Ids": tenantHeaderIds.join(","),
      };

      // Only add Content-Type for JSON requests, not FormData
      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resources`,
        {
          method: "POST",
          headers,
          body: isFormData ? resource : JSON.stringify(resource),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to create resource");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Don't show toast here - let the component handle it with navigation
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["organization-resources"] });
      return data; // Return the created resource so components can access it
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create resource");
    },
  });
}

export function useGetResources({ enabled = true } = {}) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  const {
    data,
    isLoading,
    mutate: refreshResources,
  } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchResources(headers);
    },
    enabled: enabled && !!systemUser && !!selectedTenants?.length,
  });

  return { data, isLoading, mutate: refreshResources };
}

export function useGetResource(id) {
  const { getAuthHeader, selectedTenants, systemUser } = useContextAuth();

  const {
    data,
    isLoading,
    isError,
    mutate: refreshResources,
  } = useQuery({
    queryKey: ["resources", id],
    queryFn: async () => {
      const headers = await getAuthHeader();
      const data = await getResourceById(id, headers);
      return data;
    },
    enabled: !!id && !!systemUser && !!selectedTenants?.length,
  });

  return { data, isLoading, isError, mutate: refreshResources };
}

export function useUpdateCollectionResource() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({ collectionId, collection }) => {
      const token = await getToken();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Tenant-Ids": selectedTenants
              .map((tenant) => tenant.id)
              .join(","),
          },
          body: JSON.stringify(collection),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries(["collections"]);
      toast.success("Collection updated successfully");
    },
  });
}

export function useRemoveResourceFromCollection() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({ collectionId, resourceId }) => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/resource/${resourceId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Tenant-Ids": selectedTenants
              .map((tenant) => tenant.id)
              .join(","),
          },
        }
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries(["events"]);
    },
  });
}

export function useRemoveExternalLinkFromCollection() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({ collectionId, externalLinkId }) => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/external-link/${externalLinkId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Tenant-Ids": selectedTenants
              .map((tenant) => tenant.id)
              .join(","),
          },
        }
      );
      return response;
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries(["collections", "externalLinks"]);
      toast.success("External link deleted successfully");
    },
  });
}

export function useGetResoucesByOrganization(organizationId) {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();

  const {
    data,
    isLoading,
    mutate: refreshOrgResources,
  } = useQuery({
    queryKey: ["organization-resources", organizationId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resources/organization/${organizationId}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch organization resources");
      }

      const data = await response.json();
      // Sort resources by date in descending order (most recent first)
      return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    enabled: !!organizationId && !!systemUser && !!selectedTenants?.length,
  });

  return { data, isLoading, mutate: refreshOrgResources };
}

export function useDeleteResource() {
  const queryClient = useQueryClient();
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async (id) => {
      const headers = await getAuthHeader();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resources/${id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        let message = "Failed to delete resource";
        try {
          const errorData = await response.json();
          message = errorData.error || errorData.message || message;
        } catch {
          // Keep the default message when the server does not return JSON.
        }
        throw new Error(message);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success("Resource deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["public-resources"] });
      queryClient.invalidateQueries({ queryKey: ["public-resource"] });
      queryClient.invalidateQueries({ queryKey: ["organization-resources"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete resource");
    },
  });
}

export function useDeleteCollectionResource() {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async (collectionId, resourceId) => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/resources/collection/${collectionId}/resource/${resourceId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Tenant-Ids": selectedTenants
              .map((tenant) => tenant.id)
              .join(","),
          },
        }
      );
      return response.json();
    },
  });
}

export function useGetAllCollections() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["resourceCollections"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/collections`,
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        // If the request fails, return empty array instead of throwing
        console.error("Failed to fetch collections:", response.status);
        return [];
      }

      const data = await response.json();
      // Ensure data is always an array
      return Array.isArray(data) ? data : [];
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();
  const { selectedTenants, getAuthHeader } = useContextAuth();

  return useMutation({
    mutationFn: async (data) => {
      const { id, ...updateData } = data;
      const headers = await getAuthHeader();

      // Check if we have an image file in the data
      const hasImage = updateData.image instanceof File;

      if (hasImage) {
        // Create FormData for multipart upload
        const formData = new FormData();
        formData.append("image", updateData.image);

        // Remove the image from updateData
        const { image, ...resourceData } = updateData;

        // Add resource data as JSON string
        formData.append("resource", JSON.stringify(resourceData));

        // Use FormData for the update
        const response = await updateResource(id, formData, headers);
        if (!response) {
          throw new Error("Failed to update resource");
        }
        return response;
      } else {
        // Regular JSON update without image
        const response = await updateResource(id, updateData, headers);
        if (!response) {
          throw new Error("Failed to update resource");
        }
        return response;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["organization-resources"] });
      toast.success("Resource updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update resource");
    },
  });
}

export function useResourcesForSubscriptions({ enabled = true } = {}) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["resourcesForSubscriptions"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      const data = await fetchResourcesForSubscriptions(headers);
      // Sort resources by resourceUpdatedDate if available, otherwise use resourceDate
      return data.sort((a, b) => {
        const dateA = a.resourceUpdatedDate || a.resourceDate;
        const dateB = b.resourceUpdatedDate || b.resourceDate;
        return new Date(dateB) - new Date(dateA);
      });
    },
    enabled: enabled && !!systemUser && !!selectedTenants?.length,
  });
}

export function useRateResource() {
  const queryClient = useQueryClient();
  const { getAuthHeader, systemUser } = useContextAuth();

  return useMutation({
    mutationFn: async ({ resourceId, sensitivity, reason }) => {
      const headers = await getAuthHeader();

      const payload = {
        sensitivity: sensitivity,
        reason,
      };
      const response = await rateResource(resourceId, payload, headers);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["resources", variables.resourceId]);
      toast.success("Rating submitted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit rating");
    },
  });
}

export function useGetPendingResourcesCount() {
  const { getAuthHeader, systemUser, selectedTenants, isAdmin, isAdvocate } =
    useContextAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["pendingResourcesCount"],
    queryFn: async () => {
      try {
        const headers = await getAuthHeader();
        const resources = await getPendingResources(headers);
        return resources?.length || 0;
      } catch (error) {
        // If user doesn't have permission, return 0
        console.error("Error fetching pending count:", error);
        return 0;
      }
    },
    enabled:
      !!systemUser &&
      !!selectedTenants?.length &&
      (isAdmin || (isAdvocate && isAdvocate.length > 0)),
    refetchInterval: 60000, // Refetch every minute
  });

  return { count: data || 0, isLoading };
}

const SENSITIVITY_LEVELS = [
  { value: 1, label: "Low" },
  { value: 2, label: "Intermediate" },
  { value: 3, label: "High" },
];
