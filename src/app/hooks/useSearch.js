import { useQuery } from "@tanstack/react-query";
import { searchGlobal, fetchOrganizations } from "../api/searchApi";
import { useContextAuth } from "../context/authContext";

export function useGlobalSearch(searchQuery, enabled = true) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  
  return useQuery({
    queryKey: ["globalSearch", searchQuery],
    queryFn: async () => {
      const headers = await getAuthHeader();
      const searchResults = await searchGlobal(searchQuery, headers);
      
      // If searching for organizations, also fetch from organizations endpoint
      // since the global search doesn't include them yet
      let organizationResults = [];
      if (searchQuery && searchQuery.length >= 2) {
        try {
          const orgs = await fetchOrganizations(headers);
          organizationResults = orgs
            .filter((org) =>
              org.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((org) => ({
              type: "organization",
              id: org.id,
              title: org.name,
              description: org.description,
            }));
        } catch (err) {
          console.error("Error fetching organizations:", err);
        }
      }
      
      // Combine results
      return {
        ...searchResults,
        content: [...(searchResults.content || []), ...organizationResults],
      };
    },
    enabled: 
      enabled && 
      !!systemUser && 
      !!selectedTenants?.length && 
      !!searchQuery && 
      searchQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });
}