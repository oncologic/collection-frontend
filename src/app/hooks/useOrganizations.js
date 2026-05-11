import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  deleteOrganization,
  fetchOrganizations,
  updateOrganization,
  fetchOrganization,
} from "../api/api";
import {
  subscribeToOrganization,
  unsubscribeFromOrganization,
  getUserSubscriptions,
  createOrganization,
} from "../api/organizationsApi";
import toast from "react-hot-toast";
import { useContextAuth } from "../context/authContext";

export const useOrganizations = () => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();

  return useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchOrganizations(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
};

export const useGetOrganization = (id, options = {}) => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const isEnabled =
    !!id &&
    !!systemUser &&
    !!selectedTenants?.length &&
    (options.enabled ?? true);

  return useQuery({
    queryKey: ["organization", id],
    queryFn: async () => {
      const headers = await getAuthHeader();

      return fetchOrganization(id, headers);
    },
    ...options,
    enabled: isEnabled,
  });
};

export const useCreateOrganization = () => {
  const { getToken, getAuthHeader, selectedTenants, systemUser } =
    useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const headers = await getAuthHeader();
      return createOrganization({ formData: data, headers });
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Organization created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateOrganization = () => {
  const { getToken, getAuthHeader, selectedTenants, systemUser } =
    useContextAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const headers = await getAuthHeader();
      return updateOrganization({
        formData: data.data,
        id: data.id,
        headers,
      });
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({
        queryKey: ["organization", variables.id],
      });
      toast.success("Organization updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update organization: ${error.message}`);
    },
  });
};

export const useDeleteOrganization = () => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const headers = await getAuthHeader();
      return deleteOrganization({ id, headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast.success("Organization deleted successfully");
    },
    onError: (error) => {
      // Handle 409 conflict error specially
      if (error.response?.status === 409) {
        const data = error.response.data;
        const relatedItems = data.relatedItems;
        
        // Build a detailed error message
        let message = "Cannot delete this organization because it has:\n\n";
        
        if (relatedItems?.events > 0) {
          message += `• ${relatedItems.events} event${relatedItems.events > 1 ? 's' : ''}\n`;
        }
        if (relatedItems?.resources > 0) {
          message += `• ${relatedItems.resources} resource${relatedItems.resources > 1 ? 's' : ''}\n`;
        }
        if (relatedItems?.surveys > 0) {
          message += `• ${relatedItems.surveys} survey${relatedItems.surveys > 1 ? 's' : ''}\n`;
        }
        if (relatedItems?.members > 0) {
          message += `• ${relatedItems.members} additional member${relatedItems.members > 1 ? 's' : ''}\n`;
        }
        
        message += "\nPlease delete or reassign these items before deleting the organization.";
        
        // Use a custom toast with longer duration for this important message
        toast.error(message, {
          duration: 8000, // Show for 8 seconds
          style: {
            maxWidth: '400px',
            whiteSpace: 'pre-line'
          }
        });
      } else {
        // Handle other errors normally
        const errorMessage = error.response?.data?.error || error.message;
        toast.error(errorMessage);
      }
    },
  });
};

export const useGetOrganizationUsers = (id, options = {}) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["members", id],
    queryFn: async () => {
      const token = await getToken();
      return fetchOrganizationUsers(id, token);
    },
    ...options,
    enabled: id ? options.enabled : false,
  });
};

const fetchOrganizationUsers = async (id, token) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${id}/members`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching organization users:", error);
    throw error;
  }
};

export const useSubscribeToOrganization = () => {
  const { getToken } = useAuth();
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, userId, role }) => {
      const headers = await getAuthHeader();
      return subscribeToOrganization(organizationId, userId, headers, role);
    },
    onMutate: async ({ organizationId }) => {
      await queryClient.cancelQueries({
        queryKey: ["organizationSubscriptions"],
      });

      const previousSubscriptions = queryClient.getQueryData([
        "organizationSubscriptions",
      ]);

      const organization = queryClient
        .getQueryData(["organizations"])
        ?.find((org) => org.id === organizationId);

      if (organization) {
        queryClient.setQueryData(["organizationSubscriptions"], (old) => {
          return [...(old || []), organization];
        });
      }

      return { previousSubscriptions };
    },
    onSuccess: (_, { organizationId }) => {
      const organization = queryClient
        .getQueryData(["organizations"])
        ?.find((org) => org.id === organizationId);
      toast.success(
        `Successfully added ${
          organization?.name || "organization"
        } to favorites`
      );
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ["organizationSubscriptions"],
        context.previousSubscriptions
      );
      toast.error(`Failed to add to favorites: ${err.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["organizationSubscriptions"],
      });
    },
  });
};

export const useUnsubscribeFromOrganization = () => {
  const { getToken } = useAuth();
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId, userId, role }) => {
      const headers = await getAuthHeader();
      return unsubscribeFromOrganization(organizationId, userId, headers, role);
    },
    onMutate: async ({ organizationId }) => {
      await queryClient.cancelQueries({
        queryKey: ["organizationSubscriptions"],
      });

      const previousSubscriptions = queryClient.getQueryData([
        "organizationSubscriptions",
      ]);

      const organization = queryClient
        .getQueryData(["organizations"])
        ?.find((org) => org.id === organizationId);

      queryClient.setQueryData(["organizationSubscriptions"], (old) => {
        return old.filter((org) => org.id !== organizationId);
      });

      return { previousSubscriptions, organization };
    },
    onSuccess: (_, variables, context) => {
      toast.success(
        `Successfully removed ${
          context.organization?.name || "organization"
        } from favorites`
      );
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ["organizationSubscriptions"],
        context.previousSubscriptions
      );
      toast.error(`Failed to remove from favorites: ${err.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["organizationSubscriptions"],
      });
    },
  });
};

export const useUserSubscriptions = () => {
  const { getToken } = useAuth();
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["organizationSubscriptions"],
    queryFn: async () => {
      const token = await getToken();
      const headers = await getAuthHeader();
      return getUserSubscriptions(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
};
