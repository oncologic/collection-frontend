import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  deleteBusinessUnit,
  fetchBusinessUnits,
  updateBusinessUnit,
  fetchBusinessUnit,
} from "../api/api";
import {
  subscribeToBusinessUnit,
  unsubscribeFromBusinessUnit,
  getUserSubscriptions,
  createBusinessUnit,
} from "../api/businessUnitsApi";
import toast from "react-hot-toast";
import { useContextAuth } from "../context/authContext";

export const useBusinessUnits = () => {
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();

  return useQuery({
    queryKey: ["businessUnits"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchBusinessUnits(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
};

export const useGetBusinessUnit = (id, options = {}) => {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const isEnabled =
    !!id &&
    !!systemUser &&
    !!selectedTenants?.length &&
    (options.enabled ?? true);

  return useQuery({
    queryKey: ["businessUnit", id],
    queryFn: async () => {
      const headers = await getAuthHeader();

      return fetchBusinessUnit(id, headers);
    },
    ...options,
    enabled: isEnabled,
  });
};

export const useCreateBusinessUnit = () => {
  const { getToken, getAuthHeader, selectedTenants, systemUser } =
    useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const headers = await getAuthHeader();
      return createBusinessUnit({ formData: data, headers });
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businessUnits"] });
      toast.success("Business Unit created successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

export const useUpdateBusinessUnit = () => {
  const { getToken, getAuthHeader, selectedTenants, systemUser } =
    useContextAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const headers = await getAuthHeader();
      return updateBusinessUnit({
        formData: data.data,
        id: data.id,
        headers,
      });
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["businessUnits"] });
      queryClient.invalidateQueries({
        queryKey: ["businessUnit", variables.id],
      });
      toast.success("Business Unit updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update business unit: ${error.message}`);
    },
  });
};

export const useDeleteBusinessUnit = () => {
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const headers = await getAuthHeader();
      return deleteBusinessUnit({ id, headers });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["businessUnits"] });
      toast.success("Business Unit deleted successfully");
    },
    onError: (error) => {
      // Handle 409 conflict error specially
      if (error.response?.status === 409) {
        const data = error.response.data;
        const relatedItems = data.relatedItems;

        // Build a detailed error message
        let message = "Cannot delete this business unit because it has:\n\n";

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

        message += "\nPlease delete or reassign these items before deleting the business unit.";

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

export const useGetBusinessUnitUsers = (id, options = {}) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["members", id],
    queryFn: async () => {
      const token = await getToken();
      return fetchBusinessUnitUsers(id, token);
    },
    ...options,
    enabled: id ? options.enabled : false,
  });
};

const fetchBusinessUnitUsers = async (id, token) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/business-units/${id}/members`,
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
    console.error("Error fetching business unit users:", error);
    throw error;
  }
};

export const useSubscribeToBusinessUnit = () => {
  const { getToken } = useAuth();
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessUnitId, organizationId, userId, role }) => {
      const headers = await getAuthHeader();
      return subscribeToBusinessUnit(
        businessUnitId || organizationId,
        userId,
        headers,
        role
      );
    },
    onMutate: async ({ businessUnitId, organizationId }) => {
      const id = businessUnitId || organizationId;
      await queryClient.cancelQueries({
        queryKey: ["businessUnitSubscriptions"],
      });

      const previousSubscriptions = queryClient.getQueryData([
        "businessUnitSubscriptions",
      ]);

      const businessUnit = queryClient
        .getQueryData(["businessUnits"])
        ?.find((org) => org.id === id);

      if (businessUnit) {
        queryClient.setQueryData(["businessUnitSubscriptions"], (old) => {
          return [...(old || []), businessUnit];
        });
      }

      return { previousSubscriptions };
    },
    onSuccess: (_, { businessUnitId, organizationId }) => {
      const id = businessUnitId || organizationId;
      const businessUnit = queryClient
        .getQueryData(["businessUnits"])
        ?.find((org) => org.id === id);
      toast.success(
        `Successfully added ${
          businessUnit?.name || "business unit"
        } to favorites`
      );
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ["businessUnitSubscriptions"],
        context.previousSubscriptions
      );
      toast.error(`Failed to add to favorites: ${err.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["businessUnitSubscriptions"],
      });
    },
  });
};

export const useUnsubscribeFromBusinessUnit = () => {
  const { getToken } = useAuth();
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ businessUnitId, organizationId, userId, role }) => {
      const headers = await getAuthHeader();
      return unsubscribeFromBusinessUnit(
        businessUnitId || organizationId,
        userId,
        headers,
        role
      );
    },
    onMutate: async ({ businessUnitId, organizationId }) => {
      const id = businessUnitId || organizationId;
      await queryClient.cancelQueries({
        queryKey: ["businessUnitSubscriptions"],
      });

      const previousSubscriptions = queryClient.getQueryData([
        "businessUnitSubscriptions",
      ]);

      const businessUnit = queryClient
        .getQueryData(["businessUnits"])
        ?.find((org) => org.id === id);

      queryClient.setQueryData(["businessUnitSubscriptions"], (old) => {
        return old.filter((org) => org.id !== id);
      });

      return { previousSubscriptions, businessUnit };
    },
    onSuccess: (_, variables, context) => {
      toast.success(
        `Successfully removed ${
          context.businessUnit?.name || "business unit"
        } from favorites`
      );
    },
    onError: (err, variables, context) => {
      queryClient.setQueryData(
        ["businessUnitSubscriptions"],
        context.previousSubscriptions
      );
      toast.error(`Failed to remove from favorites: ${err.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["businessUnitSubscriptions"],
      });
    },
  });
};

export const useUserSubscriptions = () => {
  const { getToken } = useAuth();
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["businessUnitSubscriptions"],
    queryFn: async () => {
      const token = await getToken();
      const headers = await getAuthHeader();
      return getUserSubscriptions(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
};
