import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useContextAuth } from "../context/authContext";
import toast from "react-hot-toast";
import {
  createTenantInvite,
  getTenantInvites,
  getInviteByToken,
  acceptTenantInvite,
  revokeTenantInvite,
  getInviteUsage,
} from "@/app/api/tenantInvitesApi";

export function useCreateTenantInvite() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      if (!token) {
        throw new Error("User is not authenticated or token is unavailable");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      return createTenantInvite(payload, headers);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["tenantInvites"]);
      toast.success("Invite link created successfully!");
      return data;
    },
    onError: (error) => {
      toast.error(`Failed to create invite link: ${error.message}`);
    },
  });
}

export function useGetTenantInvites(tenantId) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["tenantInvites", tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      const token = await getToken();
      if (!token) {
        throw new Error("User is not authenticated or token is unavailable");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await getTenantInvites(tenantId, headers);
      return response.data;
    },
    enabled: !!tenantId,
  });
}

export function useGetInviteByToken(token) {
  return useQuery({
    queryKey: ["tenantInvite", token],
    queryFn: async () => {
      if (!token) return null;

      const response = await getInviteByToken(token);
      return response.data;
    },
    enabled: !!token,
  });
}

export function useAcceptTenantInvite() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { refetchUserData } = useContextAuth();

  return useMutation({
    mutationFn: async (token) => {
      const authToken = await getToken();
      if (!authToken) {
        throw new Error("User is not authenticated or token is unavailable");
      }

      const headers = {
        Authorization: `Bearer ${authToken}`,
      };

      return acceptTenantInvite(token, headers);
    },
    onSuccess: async (data) => {
      queryClient.invalidateQueries(["userData"]);
      queryClient.invalidateQueries(["tenantInvites"]);
      await refetchUserData();

      if (!data.alreadyMember) {
        toast.success(`Successfully joined ${data.data.tenant.name}!`);
      }

      return data;
    },
    onError: (error) => {
      toast.error(`Failed to join tenant: ${error.message}`);
    },
  });
}

export function useRevokeTenantInvite() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId) => {
      const token = await getToken();
      if (!token) {
        throw new Error("User is not authenticated or token is unavailable");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      return revokeTenantInvite(inviteId, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["tenantInvites"]);
      toast.success("Invite link revoked successfully");
    },
    onError: (error) => {
      toast.error(`Failed to revoke invite link: ${error.message}`);
    },
  });
}

export function useGetInviteUsage(inviteId) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["tenantInviteUsage", inviteId],
    queryFn: async () => {
      if (!inviteId) return [];

      const token = await getToken();
      if (!token) {
        throw new Error("User is not authenticated or token is unavailable");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await getInviteUsage(inviteId, headers);
      return response.data;
    },
    enabled: !!inviteId,
  });
}
