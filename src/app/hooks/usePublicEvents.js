import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { usePublicAuth } from "./usePublicAuth";

/**
 * Fetch events with optional authentication
 * Allows public access for tenants that allow public events
 */
async function fetchPublicEvents(token = null, tenantIds = null, params = {}) {
  const headers = {
    "Content-Type": "application/json",
  };

  // ALWAYS set tenant IDs - required for public access
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

  // Build query params
  const queryParams = new URLSearchParams({
    page: params.page || 1,
    limit: params.limit || 20,
    sortBy: params.sortBy || "startDate",
    sortOrder: params.sortOrder || "asc",
    ...(params.filterDate && { filterDate: params.filterDate }),
    ...(params.filterStartDate && { filterStartDate: params.filterStartDate }),
    ...(params.filterEndDate && { filterEndDate: params.filterEndDate }),
  });

  // Always use the paginated endpoint
  const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/events/paginated?${queryParams}`;

  const response = await fetch(endpoint, { headers });

  if (!response.ok) {
    // Don't throw error for 401/403, return empty result for public access
    if (response.status === 401 || response.status === 403) {
      return { data: [], total: 0, page: 1, limit: params.limit || 20 };
    }
    throw new Error("Failed to fetch events");
  }

  return response.json();
}

/**
 * Search events with optional authentication
 */
async function searchPublicEvents(
  token = null,
  tenantIds = null,
  searchQuery,
  limit = 50
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (tenantIds && tenantIds.length > 0) {
    headers["X-Tenant-Ids"] = tenantIds.join(",");
  } else {
    throw new Error(
      "No public tenants available. Please ensure at least one tenant has public access enabled."
    );
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const queryParams = new URLSearchParams({
    query: searchQuery,
    limit: limit,
    includeAll: true,
  });

  const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/events/search?${queryParams}`;

  const response = await fetch(endpoint, { headers });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      return [];
    }
    throw new Error("Failed to search events");
  }

  return response.json();
}

/**
 * Hook to get events with public access support (paginated)
 */
export function useGetPublicEventsPaginated(params = {}, options = {}) {
  const { getToken, isSignedIn } = useAuth();
  const { selectedTenants } = usePublicAuth();

  const {
    data,
    isLoading,
    error,
    refetch: refreshEvents,
  } = useQuery({
    queryKey: ["public-events-paginated", isSignedIn, selectedTenants, params],
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

      return fetchPublicEvents(token, tenantIds, params);
    },
    enabled: options.enabled !== false,
    staleTime: 30000, // Cache for 30 seconds
    retry: 1,
    keepPreviousData: true,
  });

  return {
    data: data || { data: [], total: 0, page: 1, limit: params.limit || 20 },
    isLoading,
    error,
    mutate: refreshEvents,
  };
}

/**
 * Fetch a single event by ID with optional authentication
 */
async function fetchPublicEventById(id, token = null, tenantIds = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  // ALWAYS set tenant IDs - required for public access
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

  const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/events/${id}`;

  const response = await fetch(endpoint, { headers });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Event not found");
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("Access denied");
    }
    throw new Error("Failed to fetch event");
  }

  return response.json();
}

/**
 * Hook to search events with public access support
 */
export function useSearchPublicEvents(searchQuery, options = {}) {
  const { getToken, isSignedIn } = useAuth();
  const { selectedTenants } = usePublicAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "public-search-events",
      isSignedIn,
      selectedTenants,
      searchQuery,
    ],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        return [];
      }

      let token = null;
      if (isSignedIn) {
        try {
          token = await getToken();
        } catch (e) {
          // Continue without token for public access
        }
      }

      const tenantIds = selectedTenants?.map((t) => t.id) || null;

      return searchPublicEvents(
        token,
        tenantIds,
        searchQuery.trim(),
        options.limit || 50
      );
    },
    enabled:
      options.enabled !== false &&
      !!searchQuery &&
      searchQuery.trim().length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

  return {
    data: data || [],
    isLoading,
    error,
  };
}

/**
 * Hook to get a single event by ID with public access support
 */
export function useGetPublicEventById(id, options = {}) {
  const { getToken, isSignedIn } = useAuth();
  const { selectedTenants } = usePublicAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-event", id, isSignedIn, selectedTenants],
    queryFn: async () => {
      if (!id) {
        throw new Error("Event ID is required");
      }

      let token = null;
      if (isSignedIn) {
        try {
          token = await getToken();
        } catch (e) {
          // Continue without token for public access
        }
      }

      const tenantIds = selectedTenants?.map((t) => t.id) || null;

      return fetchPublicEventById(id, token, tenantIds);
    },
    enabled: options.enabled !== false && !!id && !!selectedTenants?.length,
    staleTime: 30000, // Cache for 30 seconds
    retry: 1,
  });

  return {
    data: data || null,
    isLoading,
    error,
  };
}
