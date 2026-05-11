import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { usePublicAuth } from "./usePublicAuth";

/**
 * Fetch resources with optional authentication
 * Allows public access for tenants that expose public resources
 */
async function fetchPublicResources(token = null, tenantIds = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  // Use provided tenant IDs - should come from usePublicAuth which discovers public tenants
  if (tenantIds && tenantIds.length > 0) {
    headers["X-Tenant-Ids"] = tenantIds.join(",");
  } else {
    // If no tenant IDs provided, throw error - this means no public tenants were discovered
    throw new Error(
      "No public tenants available. Please ensure at least one tenant has public access enabled."
    );
  }

  // Add auth token if available
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Always use the same endpoint
  const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/resources`;

  const response = await fetch(endpoint, { headers });

  if (!response.ok) {
    // Don't throw error for 401/403, return empty array for public access
    if (response.status === 401 || response.status === 403) {
      return [];
    }
    throw new Error("Failed to fetch resources");
  }

  return response.json();
}

/**
 * Hook to get resources with public access support
 */
export function useGetPublicResources({ enabled = true } = {}) {
  const { getToken, isSignedIn } = useAuth();
  const { selectedTenants } = usePublicAuth();

  const {
    data,
    isLoading,
    error,
    refetch: refreshResources,
  } = useQuery({
    queryKey: ["public-resources", isSignedIn, selectedTenants],
    queryFn: async () => {
      // Try to get token if signed in
      let token = null;
      if (isSignedIn) {
        try {
          token = await getToken();
        } catch (e) {
          // Continue without token for public access
        }
      }

      // Extract tenant IDs from selected tenants
      const tenantIds = selectedTenants?.map((t) => t.id) || null;

      return fetchPublicResources(token, tenantIds);
    },
    enabled,
    staleTime: 30000, // Cache for 30 seconds
    retry: 1,
  });

  return {
    data: data || [],
    isLoading,
    error,
    mutate: refreshResources,
  };
}

/**
 * Hook to get a single resource with public access support
 */
export function useGetPublicResource(id) {
  const { getToken, isSignedIn } = useAuth();
  const { selectedTenants } = usePublicAuth();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch: refreshResource,
  } = useQuery({
    queryKey: ["public-resource", id, isSignedIn, selectedTenants],
    queryFn: async () => {
      const headers = {
        "Content-Type": "application/json",
      };

      // For public access (not signed in), use discovered public tenants
      if (!isSignedIn) {
        // CRITICAL: Must send X-Tenant-Ids header for public access
        // These should come from usePublicAuth which discovers public tenants
        const tenantIds = selectedTenants?.map((t) => t.id) || [];
        if (tenantIds.length > 0) {
          headers["X-Tenant-Ids"] = tenantIds.join(",");
        } else {
          throw new Error(
            "No public tenants available. Please ensure at least one tenant has public access enabled."
          );
        }
      } else {
        // For signed-in users, use their selected tenants
        const tenantIds = selectedTenants?.map((t) => t.id) || [];
        if (tenantIds.length > 0) {
          headers["X-Tenant-Ids"] = tenantIds.join(",");
        } else {
          throw new Error("No tenant IDs available");
        }

        // Add auth token for signed-in users
        try {
          const token = await getToken();
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
        } catch (e) {
          // Continue without token
        }
      }

      // Always use the same endpoint, but with proper headers for public access
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/resources/${id}`;

      const response = await fetch(endpoint, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Resource not found");
        }
        if (response.status === 403 || response.status === 401) {
          // For public access, provide more specific error
          if (!isSignedIn) {
            throw new Error(
              "This resource is not publicly available for the selected public tenant."
            );
          }
          throw new Error("Access denied - resource not in selected tenant");
        }
        throw new Error("Failed to fetch resource");
      }

      return response.json();
    },
    enabled: !!id,
    staleTime: 30000,
    retry: 1,
  });

  return {
    data,
    isLoading,
    isError,
    error,
    mutate: refreshResource,
  };
}
