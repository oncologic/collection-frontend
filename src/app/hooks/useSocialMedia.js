import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSocialMediaPosts,
  fetchOrganizationSocialMedia,
  fetchSocialMediaPlatforms,
  fetchSocialMediaPlatformCatalog,
  fetchSocialMediaAccounts,
  fetchSocialMediaAccountTypes,
  createSocialMediaPlatform,
  createSocialMediaAccount,
  updateSocialMediaAccount,
  deleteSocialMediaAccount,
  fetchAssociatedSocialMediaAccounts,
  fetchSocialMediaAccountAssociations,
  createSocialMediaAssociation,
  deleteSocialMediaAssociation,
  bulkCreateSocialMediaAccounts,
} from "../api/socialMediaApi";
import { useContextAuth } from "../context/authContext";
import toast from "react-hot-toast";

const normalizePlatformName = (name) =>
  String(name || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const upsertPlatformByName = (existing = [], platform) => {
  if (!platform?.id) {
    return existing;
  }

  const platformName = normalizePlatformName(platform.name);
  const remaining = existing.filter((item) => {
    if (item.id === platform.id) {
      return false;
    }

    return normalizePlatformName(item.name) !== platformName;
  });

  return [...remaining, platform].sort((a, b) =>
    (a.name || "").localeCompare(b.name || ""),
  );
};

export const useSocialMediaPosts = (options = {}) => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["socialMediaPosts"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchSocialMediaPosts(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length && enabled,
    ...queryOptions,
  });
};

export const useOrganizationSocialMedia = (organizationId, options = {}) => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["socialMediaPosts", organizationId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchOrganizationSocialMedia(organizationId, headers);
    },
    enabled:
      !!organizationId && !!systemUser && !!selectedTenants?.length && enabled,
    ...queryOptions,
  });
};

// New hooks for social media accounts management
export const useSocialMediaPlatforms = (options = {}) => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();
  const selectedTenantIds = (selectedTenants || []).map((tenant) => tenant.id);
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["socialMediaPlatforms", selectedTenantIds],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchSocialMediaPlatforms(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length && enabled,
    ...queryOptions,
  });
};

export const useSocialMediaPlatformCatalog = (options = {}) => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();
  const selectedTenantIds = (selectedTenants || []).map((tenant) => tenant.id);
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["socialMediaPlatformCatalog", selectedTenantIds],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchSocialMediaPlatformCatalog(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length && enabled,
    ...queryOptions,
  });
};

export const useSocialMediaAccountTypes = (options = {}) => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();
  const selectedTenantIds = (selectedTenants || []).map((tenant) => tenant.id);
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["socialMediaAccountTypes", selectedTenantIds],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchSocialMediaAccountTypes(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length && enabled,
    ...queryOptions,
  });
};

export const useSocialMediaAccounts = (formatted = false, options = {}) => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();
  const selectedTenantIds = (selectedTenants || []).map((tenant) => tenant.id);
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["socialMediaAccounts", selectedTenantIds, formatted],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchSocialMediaAccounts(formatted, false, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length && enabled,
    ...queryOptions,
  });
};

export const useCreateSocialMediaPlatform = (options = {}) => {
  const { getAuthHeader, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();
  const selectedTenantIds = (selectedTenants || []).map((tenant) => tenant.id);

  return useMutation({
    mutationFn: async (platformData) => {
      const headers = await getAuthHeader();
      return createSocialMediaPlatform(platformData, headers);
    },
    onSuccess: (platform) => {
      queryClient.setQueryData(
        ["socialMediaPlatforms", selectedTenantIds],
        (existing = []) => upsertPlatformByName(existing, platform),
      );
      queryClient.setQueryData(
        ["socialMediaPlatformCatalog", selectedTenantIds],
        (existing = []) => upsertPlatformByName(existing, platform),
      );
      toast.success(`Platform ${platform.name} is ready to use`);
      queryClient.invalidateQueries({ queryKey: ["socialMediaPlatforms"] });
      queryClient.invalidateQueries({
        queryKey: ["socialMediaPlatformCatalog"],
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create social media platform");
    },
    ...options,
  });
};

export const useCreateSocialMediaAccount = (options = {}) => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountData) => {
      const headers = await getAuthHeader();
      return createSocialMediaAccount(accountData, headers);
    },
    onSuccess: () => {
      toast.success("Social media account created successfully");
      queryClient.invalidateQueries({ queryKey: ["socialMediaAccounts"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create social media account");
    },
    ...options,
  });
};

export const useUpdateSocialMediaAccount = (options = {}) => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, accountData }) => {
      const headers = await getAuthHeader();
      return updateSocialMediaAccount(id, accountData, headers);
    },
    onSuccess: () => {
      toast.success("Social media account updated successfully");
      queryClient.invalidateQueries({ queryKey: ["socialMediaAccounts"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update social media account");
    },
    ...options,
  });
};

export const useDeleteSocialMediaAccount = (options = {}) => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const headers = await getAuthHeader();
      return deleteSocialMediaAccount(id, headers);
    },
    onSuccess: () => {
      toast.success("Social media account deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["socialMediaAccounts"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete social media account");
    },
    ...options,
  });
};

// Hooks for social media associations
export const useAssociatedSocialMediaAccounts = (associatedId, associatedType, options = {}) => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["associatedSocialMediaAccounts", associatedId, associatedType],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchAssociatedSocialMediaAccounts(associatedId, associatedType, headers);
    },
    enabled:
      !!associatedId &&
      !!associatedType &&
      !!systemUser &&
      !!selectedTenants?.length &&
      enabled,
    ...queryOptions,
  });
};

// Hook to fetch associations for a specific social media account
export const useSocialMediaAccountAssociations = (socialMediaAccountId, options = {}) => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();
  const { enabled = true, ...queryOptions } = options;

  return useQuery({
    queryKey: ["socialMediaAccountAssociations", socialMediaAccountId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchSocialMediaAccountAssociations(socialMediaAccountId, headers);
    },
    enabled:
      !!socialMediaAccountId &&
      !!systemUser &&
      !!selectedTenants?.length &&
      enabled,
    ...queryOptions,
  });
};

export const useCreateSocialMediaAssociation = (options = {}) => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (associationData) => {
      const headers = await getAuthHeader();
      return createSocialMediaAssociation(associationData, headers);
    },
    onSuccess: (data, variables) => {
      toast.success("Social media account linked successfully");
      queryClient.invalidateQueries({ 
        queryKey: ["socialMediaAccountAssociations", variables.socialMediaAccountId] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["associatedSocialMediaAccounts", variables.associatedId, variables.associatedType] 
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to link social media account");
    },
    ...options,
  });
};

export const useDeleteSocialMediaAssociation = (options = {}) => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (associationData) => {
      const headers = await getAuthHeader();
      return deleteSocialMediaAssociation(associationData, headers);
    },
    onSuccess: (data, variables) => {
      toast.success("Social media account unlinked successfully");
      queryClient.invalidateQueries({
        queryKey: ["socialMediaAccountAssociations", variables.socialMediaAccountId]
      });
      queryClient.invalidateQueries({
        queryKey: ["associatedSocialMediaAccounts", variables.associatedId, variables.associatedType]
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to unlink social media account");
    },
    ...options,
  });
};

export const useBulkCreateSocialMediaAccounts = (options = {}) => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const headers = await getAuthHeader();
      return bulkCreateSocialMediaAccounts(data, headers);
    },
    onSuccess: (result) => {
      const successCount = result.results?.successful || result.created?.length || 0;
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} social media account(s)`);
      }
      queryClient.invalidateQueries({ queryKey: ["socialMediaAccounts"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to import social media accounts");
    },
    ...options,
  });
};
