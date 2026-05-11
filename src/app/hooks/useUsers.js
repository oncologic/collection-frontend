import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useContextAuth } from "../context/authContext";
import {
  fetchUsers,
  updateUser,
  createUser,
  updateUserRolesForTenant,
} from "../api/usersApi";

export const useUsers = (options = {}) => {
  const { getAuthHeader, systemUser, selectedTenants, isAdmin, isSuperuser } =
    useContextAuth();
  return useQuery({
    queryKey: ["users", selectedTenants, isAdmin, isSuperuser],
    queryFn: async () => {
      if (!isAdmin || !isSuperuser) {
        return [];
      }

      const headers = await getAuthHeader();
      const response = await fetchUsers(headers, true);
      if (!response) {
        throw new Error("Failed to fetch users");
      }
      return response;
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
};

export const useDeleteUser = (options = {}) => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async (id) => {
      const headers = await getAuthHeader();
      const data = await deleteUser(id, headers);
      return data;
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      toast.success("User deleted successfully");
    },
  });
};

export const useUpdateUser = (options = {}) => {
  const { getAuthHeader } = useContextAuth();

  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ user }) => {
      const headers = await getAuthHeader();

      if (user?.userRoles && typeof user.userRoles === "string") {
        user.userRoles = [
          {
            id: user.userRoles.toLowerCase(),
            name:
              user.userRoles.charAt(0).toUpperCase() + user.userRoles.slice(1),
          },
        ];
      }
      // Format the userRoles properly before sending to the API
      const formattedUser = {
        ...user,
        userRoles: user?.userRoles?.map((role) => ({
          id: role.id,
          name:
            typeof role.name === "object"
              ? JSON.stringify(role.name)
              : role.name,
          verified: role.verified || false,
        })),
      };

      const data = await updateUser(formattedUser, headers);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useCreateUser = (options = {}) => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userData) => {
      const headers = await getAuthHeader();
      const data = await createUser(userData, headers);
      return data;
    },
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user");
    },
  });
};

export const useUpdateUserTenantRoles = (options = {}) => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, tenantId, roles }) => {
      const headers = await getAuthHeader();
      const data = await updateUserRolesForTenant(userId, tenantId, roles, headers);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      if (options.onSuccess) options.onSuccess();
    },
    onError: (error) => {
      console.error("Error updating user tenant roles:", error);
      if (options.onError) options.onError(error);
    },
  });
};
