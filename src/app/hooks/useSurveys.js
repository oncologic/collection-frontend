import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  createSurveyResponse,
  fetchSurveyResponseBySurveyId,
  updateSurveyResponse,
  fetchSurveys,
} from "../api/api";
import toast from "react-hot-toast";
import { fetchSurveyById, updateSurvey, deleteSurvey } from "../api/surveysApi";
import { useContextAuth } from "../context/authContext";

export function useCreateSurveyResponse() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const token = await getToken();
      const response = await createSurveyResponse(data, token);
      if (!response.ok && response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      toast.success("Survey response created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create survey response: ${error.message}`);
    },
  });
}

export function useUpdateSurveyResponse() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const token = await getToken();
      return updateSurveyResponse(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      toast.success("Survey response updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update survey response: ${error.message}`);
    },
  });
}

export function useFetchSurveyResponseBySurveyId(surveyId) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["surveys", surveyId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchSurveyResponseBySurveyId(surveyId, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onError: (error) => {
      toast.error(`Failed to fetch survey response: ${error.message}`);
    },
  });
}

export function useFetchSurveys() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["surveys"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchSurveys(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
}

export function useGetSurveyById(id) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["survey", id],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return fetchSurveyById(id, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    staleTime: 0,
    cacheTime: 1000 * 60 * 5,
  });
}

export function useUpdateSurvey() {
  const queryClient = useQueryClient();
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async ({ id, survey }) => {
      const headers = await getAuthHeader();
      return updateSurvey(id, survey, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onMutate: async ({ id, survey }) => {
      // create optimistic update
      queryClient.setQueryData(["survey", id], (old) => ({
        ...old,
        ...survey,
      }));
    },
    onSuccess: (data, { id }) => {
      // Replace optimistic survey in the surveys list with the result
      queryClient.setQueryData(["survey", id], (old) => ({
        ...old,
        ...data,
      }));
      toast.success("Survey updated successfully");
    },
    onError: (error, { id }) => {
      // Rollback optimistic update
      queryClient.setQueryData(["survey", id], (old) => old);
      toast.error("Failed to update survey");
    },
  });
}

export function useCreateSurvey() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (surveyData) => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/surveys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(surveyData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create survey");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
}

export function useDeleteSurvey() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (surveyId) => {
      const token = await getToken();
      const response = await deleteSurvey(surveyId, token);
      if (!response.ok && response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
      toast.success("Survey deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete survey: ${error.message}`);
    },
  });
}
