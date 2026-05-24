import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useContextAuth } from "../context/authContext";
import toast from "react-hot-toast";
import {
  createAttachment,
  createAttachmentViaDirectUpload,
  deleteAttachment,
  searchAttachments,
  updateAttachment,
} from "@/app/api/attachmentsApi";

export function useCreateAttachment() {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const token = await getToken();
      if (!token) {
        throw new Error("User is not authenticated or token is unavailable");
      }

      const headers = {
        "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
      };

      // Check if payload is FormData (upload mode) or plain object (search mode)
      if (payload instanceof FormData) {
        const file = payload.get("attachment");

        if (!file || !(file instanceof File)) {
          throw new Error("No file selected for upload");
        }

        return createAttachmentViaDirectUpload(payload, token, headers);
      } else {
        // Handle search selection case
        const {
          existingAttachmentId,
          externalLinkId,
          resourceId,
          highlighted,
        } = payload;

        if (!existingAttachmentId) {
          throw new Error("No attachment selected");
        }

        // Pass the plain object to createAttachment
        return createAttachment(
          {
            existingAttachmentId,
            externalLinkId,
            resourceId,
            highlighted,
          },
          token,
          headers,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      queryClient.invalidateQueries({ queryKey: ["externalLinks"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["public-resource"] });
      queryClient.invalidateQueries({ queryKey: ["public-resources"] });
    },
    onError: (error) => {
      toast.error(`Failed to create attachment: ${error.message}`);
    },
  });
}

export function useDeleteAttachment() {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attachmentId, externalLinkId, resourceId }) => {
      const token = await getToken();
      if (!token) {
        throw new Error("User is not authenticated or token is unavailable");
      }

      const headers = {
        "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
      };

      return deleteAttachment(
        attachmentId,
        token,
        headers,
        externalLinkId,
        resourceId,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      queryClient.invalidateQueries({ queryKey: ["externalLinks"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["public-resource"] });
      queryClient.invalidateQueries({ queryKey: ["public-resources"] });
      toast.success("Attachment deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete attachment: ${error.message}`);
    },
  });
}

export function useSearchAttachments(query) {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const tenantScopeKey = selectedTenants
    .map((tenant) => tenant.id)
    .sort()
    .join(",");

  return useQuery({
    queryKey: ["attachments", "search", tenantScopeKey, query],
    queryFn: async () => {
      if (!query) return [];
      const token = await getToken();

      if (!token) {
        throw new Error("User is not authenticated or token is unavailable");
      }

      const headers = {
        "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
      };

      return searchAttachments(query, token, headers);
    },
    enabled: !!query && selectedTenants.length > 0,
  });
}

export const useUpdateAttachment = () => {
  const queryClient = useQueryClient();
  const { selectedTenants } = useContextAuth();
  const { getAuthHeader } = useContextAuth();

  return useMutation({
    mutationFn: async (updateData) => {
      const { id, ...metadata } = updateData;

      const headers = await getAuthHeader();

      if (!headers) {
        throw new Error("User is not authenticated or token is unavailable");
      }

      return updateAttachment(id, metadata, headers);
    },
    onSuccess: () => {
      toast.success("Attachment updated successfully");
      queryClient.invalidateQueries({ queryKey: ["attachments"] });
      queryClient.invalidateQueries({ queryKey: ["externalLink"] });
      queryClient.invalidateQueries({ queryKey: ["externalLinks"] });
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["public-resource"] });
      queryClient.invalidateQueries({ queryKey: ["public-resources"] });
    },
    onError: (error) => {
      toast.error(`Error updating attachment: ${error.message}`);
      console.error("Error updating attachment:", error);
    },
  });
};
