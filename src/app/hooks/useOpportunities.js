"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useContextAuth } from "../context/authContext";
import toast from "react-hot-toast";
import {
  fetchOpportunities,
  fetchOpportunityById,
  createOpportunity,
  updateOpportunity,
  applyToOpportunity,
  fetchUserApplications,
  reviewApplication,
  deleteApplication,
  saveOpportunity,
  unsaveOpportunity,
  sendOpportunityMessage,
  fetchOpportunityMessages,
  fetchOpportunityApplications,
} from "../api/opportunitiesApi";

// Hook to fetch opportunities
export const useOpportunities = (filters = {}) => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["opportunities", filters],
    queryFn: async () => {
      const token = await getToken();
      const headers = {};
      
      // Add auth token if available
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      // Add tenant IDs if available (for authenticated users)
      // For public access, backend will handle tenant visibility
      if (selectedTenants && selectedTenants.length > 0) {
        headers["X-Tenant-Ids"] = selectedTenants.map((t) => t.id).join(",");
      }
      
      return fetchOpportunities({
        ...filters,
        headers,
      });
    },
    // Enable query even without tenants for public access
    enabled: true,
  });
};

// Hook to fetch a single opportunity by ID
export const useOpportunityById = (opportunityId) => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["opportunity", opportunityId],
    queryFn: async () => {
      const token = await getToken();
      const headers = {};
      
      // Add tenant IDs if available (for authenticated users)
      if (selectedTenants && selectedTenants.length > 0) {
        headers["X-Tenant-Ids"] = selectedTenants.map((t) => t.id).join(",");
      }
      
      return fetchOpportunityById({
        opportunityId,
        token: token || undefined,
        headers,
      });
    },
    enabled: !!opportunityId,
  });
};

// Hook to create an opportunity
export const useCreateOpportunity = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const token = await getToken();
      return createOpportunity({
        data,
        token,
        headers: {
          "X-Tenant-Ids": selectedTenants.map((t) => t.id).join(","),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Opportunity created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create opportunity");
    },
  });
};

// Hook to update an opportunity
export const useUpdateOpportunity = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const token = await getToken();
      return updateOpportunity({
        id,
        data,
        token,
        headers: {
          "X-Tenant-Ids": selectedTenants.map((t) => t.id).join(","),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success("Opportunity updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update opportunity");
    },
  });
};

// Hook to apply to an opportunity
export const useApplyToOpportunity = () => {
  const { getToken, userId } = useAuth();
  const { selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ opportunityId, applicationData }) => {
      // Only get token if user is authenticated
      // If applicationData has applicantEmail, it's an anonymous application
      const token = userId ? await getToken() : null;
      
      const headers = {};
      // Only add tenant headers if user is authenticated and has selected tenants
      if (userId && selectedTenants && selectedTenants.length > 0) {
        headers["X-Tenant-Ids"] = selectedTenants.map((t) => t.id).join(",");
      }

      return applyToOpportunity({
        opportunityId,
        applicationData,
        token,
        headers,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["userApplications"] });
      }
      toast.success("Application submitted successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit application");
    },
  });
};

// Hook to fetch user's applications
export const useUserApplications = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["userApplications"],
    queryFn: async () => {
      const token = await getToken();
      return fetchUserApplications({
        token,
        headers: {
          "X-Tenant-Ids": selectedTenants.map((t) => t.id).join(","),
        },
      });
    },
    enabled: selectedTenants.length > 0,
  });
};

// Hook to review an application
export const useReviewApplication = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId, reviewData }) => {
      const token = await getToken();
      return reviewApplication({
        applicationId,
        reviewData,
        token,
        headers: {
          "X-Tenant-Ids": selectedTenants.map((t) => t.id).join(","),
        },
      });
    },
    onSuccess: (_, { reviewData }) => {
      queryClient.invalidateQueries({ queryKey: ["opportunityApplications"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity"] }); // Invalidate single opportunity queries

      const statusMessage = {
        approved: "Application approved!",
        rejected: "Application rejected",
        reviewing: "Application marked as under review",
      };
      toast.success(statusMessage[reviewData.status] || "Application reviewed");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to review application");
    },
  });
};

// Hook to delete an application
export const useDeleteApplication = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ applicationId }) => {
      const token = await getToken();
      return deleteApplication({
        applicationId,
        token,
        headers: {
          "X-Tenant-Ids": selectedTenants.map((t) => t.id).join(","),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunityApplications"] });
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      queryClient.invalidateQueries({ queryKey: ["opportunity"] });
      queryClient.invalidateQueries({ queryKey: ["userApplications"] });
      toast.success("Application deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete application");
    },
  });
};

// Hook to save/bookmark an opportunity
export const useSaveOpportunity = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ opportunityId, save = true }) => {
      const token = await getToken();
      const headers = {
        "X-Tenant-Ids": selectedTenants.map((t) => t.id).join(","),
      };

      if (save) {
        return saveOpportunity({ opportunityId, token, headers });
      } else {
        return unsaveOpportunity({ opportunityId, token, headers });
      }
    },
    onSuccess: (_, { save }) => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] });
      toast.success(save ? "Opportunity saved!" : "Opportunity removed from saved");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update saved status");
    },
  });
};

// Hook to send messages
export const useSendOpportunityMessage = () => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageData) => {
      const token = await getToken();
      return sendOpportunityMessage({
        messageData,
        token,
        headers: {
          "X-Tenant-Ids": selectedTenants.map((t) => t.id).join(","),
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunityMessages"] });
      toast.success("Message sent!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });
};

// Hook to fetch messages
export const useOpportunityMessages = ({ opportunityId, applicationId }) => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["opportunityMessages", opportunityId, applicationId],
    queryFn: async () => {
      const token = await getToken();
      return fetchOpportunityMessages({
        opportunityId,
        applicationId,
        token,
        headers: {
          "X-Tenant-Ids": selectedTenants.map((t) => t.id).join(","),
        },
      });
    },
    enabled: !!(opportunityId || applicationId) && selectedTenants.length > 0,
    refetchInterval: 30000, // Refetch messages every 30 seconds
  });
};

// Hook to fetch applications for an opportunity (for creators)
export const useOpportunityApplications = (opportunityId) => {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["opportunityApplications", opportunityId],
    queryFn: async () => {
      const token = await getToken();
      return fetchOpportunityApplications({
        opportunityId,
        token,
        headers: {
          "X-Tenant-Ids": selectedTenants.map((t) => t.id).join(","),
        },
      });
    },
    enabled: !!opportunityId && selectedTenants.length > 0,
  });
};