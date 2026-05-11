import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import {
  fetchStarterPacks,
  fetchStarterPackById,
  createStarterPack,
  updateStarterPack,
  deleteStarterPack,
} from "@/app/api/starterPacksApi";

export const useStarterPacks = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["starterPacks"],
    queryFn: async () => {
      const token = await getToken();
      return fetchStarterPacks(token);
    },
  });
};

export const useStarterPack = (id) => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["starterPack", id],
    queryFn: async () => {
      const token = await getToken();
      return fetchStarterPackById(id, token);
    },
    enabled: !!id,
  });
};

export const useCreateStarterPack = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (starterPackData) => {
      const token = await getToken();
      return createStarterPack(starterPackData, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["starterPacks"] });
      toast.success("Starter pack created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create starter pack: ${error.message}`);
    },
  });
};

export const useUpdateStarterPack = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const token = await getToken();
      return updateStarterPack(id, data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["starterPacks"] });
      toast.success("Starter pack updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update starter pack: ${error.message}`);
    },
  });
};

export const useDeleteStarterPack = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const token = await getToken();
      return deleteStarterPack(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["starterPacks"] });
      toast.success("Starter pack deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete starter pack: ${error.message}`);
    },
  });
};
