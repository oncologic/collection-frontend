import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import {
  fetchAllTenants,
  fetchTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  fetchTenantUsers,
  addUserToTenant,
  removeUserFromTenant,
  updateUserRolesInTenant,
} from "../api/tenantsApi";
import { useContextAuth } from "../context/authContext";

export const useAdminTenants = () => {
  const { getAuthHeader, systemUser } = useContextAuth();
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["adminTenants"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return await fetchAllTenants(headers);
    },
    enabled: !!systemUser,
  });
};

export const useTenantById = (tenantId) => {
  const { getAuthHeader, systemUser } = useContextAuth();

  return useQuery({
    queryKey: ["adminTenant", tenantId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return await fetchTenantById(tenantId, headers);
    },
    enabled: !!systemUser && !!tenantId,
  });
};

export const useCreateTenant = () => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantData) => {
      const headers = await getAuthHeader();
      return await createTenant(tenantData, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTenants"] });
      toast.success("Tenant created successfully");
    },
    onError: (error) => {
      console.error("Error creating tenant:", error);
      toast.error(error.message || "Failed to create tenant");
    },
  });
};

export const useUpdateTenant = () => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tenantData }) => {
      const headers = await getAuthHeader();
      return await updateTenant(id, tenantData, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTenants"] });
      queryClient.invalidateQueries({ queryKey: ["adminTenant"] });
      toast.success("Tenant updated successfully");
    },
    onError: (error) => {
      console.error("Error updating tenant:", error);
      toast.error(error.message || "Failed to update tenant");
    },
  });
};

export const useDeleteTenant = () => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const headers = await getAuthHeader();
      return await deleteTenant(id, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTenants"] });
      toast.success("Tenant deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting tenant:", error);
      toast.error(error.message || "Failed to delete tenant");
    },
  });
};

export const useTenantUsers = (tenantId) => {
  const { getAuthHeader, systemUser } = useContextAuth();

  return useQuery({
    queryKey: ["tenantUsers", tenantId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return await fetchTenantUsers(tenantId, headers);
    },
    enabled: !!systemUser && !!tenantId,
  });
};

export const useAddUserToTenant = () => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, userId, roles }) => {
      const headers = await getAuthHeader();
      return await addUserToTenant(tenantId, userId, roles, headers);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenantUsers", variables.tenantId],
      });
      queryClient.invalidateQueries({ queryKey: ["adminTenants"] });
      toast.success("User added to tenant successfully");
    },
    onError: (error) => {
      console.error("Error adding user to tenant:", error);
      toast.error(error.message || "Failed to add user to tenant");
    },
  });
};

export const useRemoveUserFromTenant = () => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, userId }) => {
      const headers = await getAuthHeader();
      return await removeUserFromTenant(tenantId, userId, headers);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenantUsers", variables.tenantId],
      });
      queryClient.invalidateQueries({ queryKey: ["adminTenants"] });
      toast.success("User removed from tenant successfully");
    },
    onError: (error) => {
      console.error("Error removing user from tenant:", error);
      toast.error(error.message || "Failed to remove user from tenant");
    },
  });
};

export const useUpdateUserRolesInTenant = () => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tenantId, userId, roles }) => {
      const headers = await getAuthHeader();
      return await updateUserRolesInTenant(tenantId, userId, roles, headers);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tenantUsers", variables.tenantId],
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User roles updated successfully");
    },
    onError: (error) => {
      console.error("Error updating user roles:", error);
      toast.error(error.message || "Failed to update user roles");
    },
  });
};
