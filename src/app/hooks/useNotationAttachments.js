import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import { useContextAuth } from "../context/authContext";
import { toast } from "react-hot-toast";
import {
  saveNotationDraft,
  uploadNotationInlineImage,
  processInlineImageOCR,
  getNotationInlineAttachments,
  removeNotationInlineAttachment,
} from "../api/notationApi";

/**
 * Hook for auto-saving notation drafts
 */
export function useAutoSaveNotation(notationId) {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async (draftContent) => {
      const token = await getToken();
      if (!token) {
        throw new Error("User is not authenticated");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
      };

      return saveNotationDraft(notationId, draftContent, headers);
    },
    onSuccess: (data) => {
      // Silent success for auto-save
    },
    onError: (error) => {
      console.error("Auto-save failed:", error);
      // Don't show toast for auto-save failures to avoid annoying the user
    },
  });
}

/**
 * Hook for uploading inline images
 */
export function useUploadInlineImage(notationId) {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const token = await getToken();
      if (!token) {
        throw new Error("User is not authenticated");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
      };

      return uploadNotationInlineImage(notationId, formData, headers);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["notationAttachments", notationId]);
      queryClient.invalidateQueries({ queryKey: ["externalLinks"] });
      // Don't show toast here as the editor component handles it
    },
    onError: (error) => {
      toast.error(`Failed to upload image: ${error.message}`);
    },
  });
}

/**
 * Hook for processing OCR on inline images
 */
export function useProcessInlineOCR(notationId) {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({ attachmentId, imageUrl, prompt }) => {
      const token = await getToken();
      if (!token) {
        throw new Error("User is not authenticated");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
      };

      return processInlineImageOCR(
        notationId,
        attachmentId,
        imageUrl,
        prompt,
        headers
      );
    },
    onError: (error) => {
      toast.error(`OCR processing failed: ${error.message}`);
    },
  });
}

/**
 * Hook for getting notation inline attachments
 */
export function useNotationAttachments(notationId) {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["notationAttachments", notationId],
    queryFn: async () => {
      if (!notationId) return [];

      const token = await getToken();
      if (!token) {
        throw new Error("User is not authenticated");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
      };

      const response = await getNotationInlineAttachments(notationId, headers);
      return response.attachments || [];
    },
    enabled: !!notationId,
  });
}

/**
 * Hook for removing inline attachments
 */
export function useRemoveInlineAttachment(notationId) {
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId) => {
      const token = await getToken();
      if (!token) {
        throw new Error("User is not authenticated");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "X-Tenant-Ids": selectedTenants.map((tenant) => tenant.id).join(","),
      };

      return removeNotationInlineAttachment(notationId, attachmentId, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["notationAttachments", notationId]);
      toast.success("Attachment removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove attachment: ${error.message}`);
    },
  });
}

/**
 * Custom hook for managing notation content with auto-save
 */
export function useNotationWithAutoSave(notationId, initialContent = "") {
  const [content, setContent] = useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const autoSaveMutation = useAutoSaveNotation(notationId);

  const updateContent = useCallback((newContent) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
  }, []);

  const saveNow = useCallback(async () => {
    if (!hasUnsavedChanges || !notationId) return;

    try {
      await autoSaveMutation.mutateAsync(content);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to save:", error);
    }
  }, [content, hasUnsavedChanges, notationId, autoSaveMutation]);

  // Auto-save on unmount if there are unsaved changes
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges) {
        saveNow();
      }
    };
  }, [hasUnsavedChanges, saveNow]);

  return {
    content,
    updateContent,
    saveNow,
    hasUnsavedChanges,
    isSaving: autoSaveMutation.isLoading,
    saveError: autoSaveMutation.error,
  };
}
