import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { fetchTenants } from "../api/tenantsApi";

export const useTenants = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["tenants"],
    queryFn: async () => {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      return fetchTenants(headers);
    },
  });
};
