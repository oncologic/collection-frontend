import { useMutation } from "@tanstack/react-query";
import { useContextAuth } from "../context/authContext";
import {
  previewStructuredSocialMediaAccounts,
  confirmStructuredSocialMediaAccounts,
} from "../api/socialMediaAIApi";
import { toast } from "react-hot-toast";

export const usePreviewSocialMediaAccounts = () => {
  const { getAuthHeader } = useContextAuth();

  return useMutation({
    mutationFn: async ({ prompt, metadata }) => {
      const headers = await getAuthHeader();
      return previewStructuredSocialMediaAccounts({ prompt, metadata, headers });
    },
    onError: (error) => {
      console.error("Error previewing social media accounts:", error);
      toast.error("Failed to preview accounts. Please try again.");
    },
  });
};

export const useConfirmSocialMediaAccounts = () => {
  const { getAuthHeader } = useContextAuth();

  return useMutation({
    mutationFn: async ({ accounts, associations }) => {
      const headers = await getAuthHeader();
      return confirmStructuredSocialMediaAccounts({
        accounts,
        associations,
        headers,
      });
    },
    onError: (error) => {
      console.error("Error creating social media accounts:", error);
      toast.error("Failed to create accounts. Please try again.");
    },
  });
};