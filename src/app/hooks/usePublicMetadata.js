import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { usePublicAuth } from "./usePublicAuth";

/**
 * Fetch metadata with optional authentication
 * Uses dynamically discovered public tenants
 */
async function fetchPublicMetadata(endpoint, token = null, tenantIds = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  // Use provided tenant IDs - should come from usePublicAuth which discovers public tenants
  if (tenantIds && tenantIds.length > 0) {
    headers["X-Tenant-Ids"] = tenantIds.join(",");
  } else {
    throw new Error(
      "No public tenants available. Please ensure at least one tenant has public access enabled."
    );
  }

  // Add auth token if available
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/${endpoint}`,
    { headers }
  );

  if (!response.ok) {
    // Don't throw error for 401/403, return empty array for public access
    if (response.status === 401 || response.status === 403) {
      return [];
    }
    throw new Error(`Failed to fetch ${endpoint}`);
  }

  return response.json();
}

/**
 * Hook to get tags with public access support
 */
export function usePublicTags() {
  const { getToken, isSignedIn } = useAuth();
  const { selectedTenants } = usePublicAuth();

  return useQuery({
    queryKey: ["public-tags", isSignedIn, selectedTenants],
    queryFn: async () => {
      let token = null;
      if (isSignedIn) {
        try {
          token = await getToken();
        } catch (e) {
          // Continue without token for public access
        }
      }
      const tenantIds = selectedTenants?.map((t) => t.id) || [];
      return fetchPublicMetadata("tags", token, tenantIds);
    },
    staleTime: 60000, // Cache for 1 minute
    retry: 1,
  });
}

/**
 * Hook to get resource types with public access support
 */
export function usePublicResourceTypes() {
  const { getToken, isSignedIn } = useAuth();
  const { selectedTenants } = usePublicAuth();

  return useQuery({
    queryKey: ["public-resource-types", isSignedIn, selectedTenants],
    queryFn: async () => {
      let token = null;
      if (isSignedIn) {
        try {
          token = await getToken();
        } catch (e) {
          // Continue without token for public access
        }
      }
      const tenantIds = selectedTenants?.map((t) => t.id) || [];
      return fetchPublicMetadata("resource-types", token, tenantIds);
    },
    staleTime: 60000,
    retry: 1,
  });
}

/**
 * Hook to get sensitivity levels with public access support
 */
export function usePublicSensitivityLevels() {
  const { getToken, isSignedIn } = useAuth();
  const { selectedTenants } = usePublicAuth();

  return useQuery({
    queryKey: ["public-sensitivity-levels", isSignedIn, selectedTenants],
    queryFn: async () => {
      let token = null;
      if (isSignedIn) {
        try {
          token = await getToken();
        } catch (e) {
          // Continue without token for public access
        }
      }
      const tenantIds = selectedTenants?.map((t) => t.id) || [];
      return fetchPublicMetadata("sensitivity-levels", token, tenantIds);
    },
    staleTime: 60000,
    retry: 1,
  });
}

/**
 * Hook to get expertise levels with public access support
 */
export function usePublicExpertiseLevels() {
  const { getToken, isSignedIn } = useAuth();
  const { selectedTenants } = usePublicAuth();

  return useQuery({
    queryKey: ["public-expertise-levels", isSignedIn, selectedTenants],
    queryFn: async () => {
      let token = null;
      if (isSignedIn) {
        try {
          token = await getToken();
        } catch (e) {
          // Continue without token for public access
        }
      }
      const tenantIds = selectedTenants?.map((t) => t.id) || [];
      return fetchPublicMetadata("expertise-levels", token, tenantIds);
    },
    staleTime: 60000,
    retry: 1,
  });
}

/**
 * Hook to get organizations with public access support
 */
export function usePublicOrganizations() {
  const { getToken, isSignedIn } = useAuth();
  const { selectedTenants } = usePublicAuth();

  return useQuery({
    queryKey: ["public-organizations", isSignedIn, selectedTenants],
    queryFn: async () => {
      let token = null;
      if (isSignedIn) {
        try {
          token = await getToken();
        } catch (e) {
          // Continue without token for public access
        }
      }
      const tenantIds = selectedTenants?.map((t) => t.id) || [];
      return fetchPublicMetadata("organizations", token, tenantIds);
    },
    staleTime: 60000,
    retry: 1,
  });
}
