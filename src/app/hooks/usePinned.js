import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useContextAuth } from "../context/authContext";
import { toast } from "react-hot-toast";
import {
  pinItems,
  unpinItems,
  getPinnedItems,
  updatePinnedItemOrder,
} from "../api/pinnedApi";

export function usePinItems() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items) => {
      const headers = await getAuthHeader();
      return pinItems(items, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinnedItems"] });
    },
    onError: (error) => {
      toast.error(`Failed to pin items: ${error.message}`);
    },
  });
}

export function useUnpinItems() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemIds) => {
      const headers = await getAuthHeader();
      return unpinItems(itemIds, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinnedItems"] });
      toast.success("Items unpinned successfully");
    },
    onError: (error) => {
      toast.error(`Failed to unpin items: ${error.message}`);
    },
  });
}

export function useGetPinnedItems() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["pinnedItems"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getPinnedItems(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    staleTime: 0,
    cacheTime: 1000 * 60 * 5, // 5 minutes
    onError: (error) => {
      toast.error(`Failed to fetch pinned items: ${error.message}`);
    },
  });
}

export function useUpdatePinnedItemOrder() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, orderPosition }) => {
      const headers = await getAuthHeader();
      return updatePinnedItemOrder(itemId, orderPosition, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinnedItems"] });
      toast.success("Pinned item order updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update pinned item order: ${error.message}`);
    },
  });
}
