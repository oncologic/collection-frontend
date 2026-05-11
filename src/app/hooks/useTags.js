import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useContextAuth } from "../context/authContext";
import { toast } from "react-hot-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// External Link Tags API functions
const externalLinkTagsAPI = {
  // Get user's tags
  getUserTags: async (headers) => {
    const response = await fetch(
      `${API_BASE_URL}/api/collection-external-link-tags/my-tags`,
      {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch tags");
    return response.json();
  },

  // Search tags
  searchTags: async (headers, searchTerm) => {
    const response = await fetch(
      `${API_BASE_URL}/api/collection-external-link-tags/search?q=${encodeURIComponent(
        searchTerm
      )}`,
      {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) throw new Error("Failed to search tags");
    return response.json();
  },

  // Create new tag
  createTag: async (headers, tagData) => {
    const response = await fetch(
      `${API_BASE_URL}/api/collection-external-link-tags/create`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tagData),
      }
    );
    if (!response.ok) throw new Error("Failed to create tag");
    return response.json();
  },

  // Get tags for external link
  getExternalLinkTags: async (headers, externalLinkId) => {
    const response = await fetch(
      `${API_BASE_URL}/api/collection-external-link-tags/external-link/${externalLinkId}`,
      {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch external link tags");
    return response.json();
  },

  // Add tags to external link
  addTagsToExternalLink: async (headers, data) => {
    const { externalLinkId, tagIds } = data;
    const response = await fetch(
      `${API_BASE_URL}/api/collection-external-link-tags/external-link/${externalLinkId}/add`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tagIds }),
      }
    );
    if (!response.ok) throw new Error("Failed to add tags to external link");
    return response.json();
  },

  // Remove tags from external link
  removeTagsFromExternalLink: async (headers, data) => {
    const { externalLinkId, tagIds } = data;
    const response = await fetch(
      `${API_BASE_URL}/api/collection-external-link-tags/external-link/${externalLinkId}/remove`,
      {
        method: "DELETE",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tagIds }),
      }
    );
    if (!response.ok)
      throw new Error("Failed to remove tags from external link");
    return response.json();
  },

  // Create tag and add to external link
  createAndAddTag: async (headers, data) => {
    const { externalLinkId, tagData } = data;
    const response = await fetch(
      `${API_BASE_URL}/api/collection-external-link-tags/external-link/${externalLinkId}/create-and-add`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: tagData.name,
          color: tagData.color,
        }),
      }
    );
    if (!response.ok) throw new Error("Failed to create and add tag");
    return response.json();
  },
};

// Hook to get user's tags
export const useExternalLinkTags = () => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["external-link-tags"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return externalLinkTagsAPI.getUserTags(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to search tags
export const useSearchExternalLinkTags = (searchTerm) => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["external-link-tags-search", searchTerm],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return externalLinkTagsAPI.searchTags(headers, searchTerm);
    },
    enabled:
      !!systemUser &&
      !!selectedTenants?.length &&
      !!searchTerm &&
      searchTerm.length >= 2,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook to get tags for a specific external link
export const useExternalLinkTagsForLink = (externalLinkId) => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["external-link-tags", externalLinkId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return externalLinkTagsAPI.getExternalLinkTags(headers, externalLinkId);
    },
    enabled: !!systemUser && !!selectedTenants?.length && !!externalLinkId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// Hook to create a new tag
export const useCreateExternalLinkTag = () => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagData) => {
      const headers = await getAuthHeader();
      return externalLinkTagsAPI.createTag(headers, tagData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-link-tags"] });
      toast.success("Tag created successfully");
    },
    onError: (error) => {
      console.error("Error creating tag:", error);
      toast.error("Failed to create tag");
    },
  });
};

// Hook to add tags to external link
export const useAddTagsToExternalLink = () => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const headers = await getAuthHeader();
      return externalLinkTagsAPI.addTagsToExternalLink(headers, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["external-link-tags", variables.externalLinkId],
      });
      queryClient.invalidateQueries({ queryKey: ["external-link-tags"] });
      toast.success("Tags added successfully");
    },
    onError: (error) => {
      console.error("Error adding tags:", error);
      toast.error("Failed to add tags");
    },
  });
};

// Hook to remove tags from external link
export const useRemoveTagsFromExternalLink = () => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const headers = await getAuthHeader();
      return externalLinkTagsAPI.removeTagsFromExternalLink(headers, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["external-link-tags", variables.externalLinkId],
      });
      queryClient.invalidateQueries({ queryKey: ["external-link-tags"] });
      toast.success("Tags removed successfully");
    },
    onError: (error) => {
      console.error("Error removing tags:", error);
      toast.error("Failed to remove tags");
    },
  });
};

// Hook to create and add tag in one operation
export const useCreateAndAddExternalLinkTag = () => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const headers = await getAuthHeader();
      return externalLinkTagsAPI.createAndAddTag(headers, data);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["external-link-tags", variables.externalLinkId],
      });
      queryClient.invalidateQueries({ queryKey: ["external-link-tags"] });
      toast.success("Tag created and added successfully");
    },
    onError: (error) => {
      console.error("Error creating and adding tag:", error);
      toast.error("Failed to create and add tag");
    },
  });
};

// Existing tags functionality (keeping for backward compatibility)
export const useTags = () => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      const response = await fetch(`${API_BASE_URL}/api/tags`, {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch tags");
      return response.json();
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    staleTime: 5 * 60 * 1000,
  });
};
