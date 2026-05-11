import { useQuery } from "@tanstack/react-query";

/**
 * Fetch tenants that allow public access
 * This endpoint is publicly accessible and doesn't require authentication
 */
async function fetchPublicTenants(type = "any") {
  const queryParams = new URLSearchParams();
  if (type !== "any") {
    queryParams.set("type", type);
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/users/tenants/public?${queryParams}`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch public tenants");
  }

  return response.json();
}

/**
 * Hook to get tenants that allow public access
 * @param {string} type - 'resources', 'events', or 'any' (default: 'any')
 */
export function usePublicTenants(type = "any") {
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-tenants", type],
    queryFn: () => fetchPublicTenants(type),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });

  return {
    tenants: data || [],
    isLoading,
    error,
  };
}

