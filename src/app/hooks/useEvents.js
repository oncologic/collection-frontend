import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createEvent } from "../api/api";
import {
  fetchEventById,
  fetchEventSponsorships,
  updateEvent,
  submitSponsorshipInquiry,
  deleteEvent,
  fetchEvents,
  fetchEventsPaginated,
  fetchEventsForSubscriptions,
  searchEvents,
  bulkCreateEvents,
} from "../api/eventsApi";
import toast from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";
import { useContextAuth } from "../context/authContext";
export const useEvents = (options = {}) => {
  const { getToken } = useAuth();
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();

  return useQuery({
    queryKey: ["events", selectedTenants],
    queryFn: async () => {
      const token = await getToken();
      const headers = await getAuthHeader();
      const data = await fetchEvents(token, headers);

      return data.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    },
    enabled:
      options.enabled !== false && !!systemUser && !!selectedTenants?.length,
  });
};

export const useEventsPaginated = (params = {}, options = {}) => {
  const { getToken } = useAuth();
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();

  return useQuery({
    queryKey: ["eventsPaginated", selectedTenants, params],
    queryFn: async () => {
      const token = await getToken();
      const headers = await getAuthHeader();
      const data = await fetchEventsPaginated(token, headers, params);

      // Sort the data array within the paginated response
      if (data.data && !params.sortBy) {
        data.data = data.data.sort(
          (a, b) => new Date(b.startDate) - new Date(a.startDate)
        );
      }

      return data;
    },
    enabled:
      options.enabled !== false && !!systemUser && !!selectedTenants?.length,
    keepPreviousData: true, // Keep data while fetching new pages
  });
};

export function useEventsForSubscriptions() {
  const { getToken } = useAuth();
  const { selectedTenants, getAuthHeader } = useContextAuth();

  return useQuery({
    queryKey: ["eventsForSubscriptions", selectedTenants],
    queryFn: async () => {
      const token = await getToken();
      const headers = await getAuthHeader();

      const data = await fetchEventsForSubscriptions(token, headers);
      return data.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
    },
    enabled: !!selectedTenants?.length,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { selectedTenants } = useContextAuth();

  return useMutation({
    mutationFn: async (event) => {
      const token = await getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Tenant-Ids": selectedTenants
              .map((tenant) => tenant.id)
              .join(","),
          },
          body: JSON.stringify(event),
        }
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { getAuthHeader } = useContextAuth();

  return useMutation({
    mutationFn: async ({ id }) => {
      const token = await getToken();
      const headers = await getAuthHeader();
      return deleteEvent(id, token, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["eventsPaginated"] });
    },
    onError: (error) => {
      console.error("Error:", error);
      toast.error(error.message || "Failed to delete event");
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();

  return useMutation({
    mutationFn: async ({ id, event }) => {
      const headers = await getAuthHeader();
      return updateEvent(id, event, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onMutate: async ({ id, event }) => {
      // create optimistic update
      queryClient.setQueryData(["event", id], (old) => ({
        ...old,
        ...event,
      }));
    },
    onSuccess: (data, { id }) => {
      // Replace optimistic event in the events list with the result
      queryClient.setQueryData(["event", id], (old) => ({
        ...old,
        ...data,
      }));
    },
    onError: (error, { id }) => {
      // Rollback optimistic update
      queryClient.setQueryData(["event", id], (old) => old);
      toast.error("Failed to update event");
    },
  });
}

export function useGetEventById(id) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const headers = await getAuthHeader();
      const result = await fetchEventById(id, headers);

      if (result.error) {
        throw new Error(result.message);
      }

      return result.data;
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    staleTime: 0,
    cacheTime: 1000 * 60 * 5,
  });
}

export function useGetEventSponsorships(id) {
  return useQuery({
    queryKey: ["eventSponsorships", id],
    queryFn: () => fetchEventSponsorships(id),
  });
}

export function useSubmitSponsorshipInquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitSponsorshipInquiry,
    onSuccess: () => {
      toast.success("Sponsorship inquiry submitted successfully!");
      // Optionally invalidate relevant queries
      queryClient.invalidateQueries(["sponsorshipInquiries"]);
    },
    onError: (error) => {
      toast.error("Failed to submit sponsorship inquiry. Please try again.");
      console.error("Error:", error);
    },
  });
}

export const useSearchEvents = (searchQuery, options = {}) => {
  const { getToken } = useAuth();
  const { selectedTenants, getAuthHeader, systemUser } = useContextAuth();

  return useQuery({
    queryKey: ["searchEvents", selectedTenants, searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.trim().length === 0) {
        return [];
      }

      const token = await getToken();
      const headers = await getAuthHeader();
      const data = await searchEvents(
        token,
        headers,
        searchQuery,
        options.limit || 50
      );

      return data;
    },
    enabled:
      options.enabled !== false &&
      !!systemUser &&
      !!selectedTenants?.length &&
      !!searchQuery &&
      searchQuery.trim().length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export function useBulkCreateEvents() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { getAuthHeader } = useContextAuth();

  return useMutation({
    mutationFn: async (events) => {
      const token = await getToken();
      const headers = await getAuthHeader();
      return bulkCreateEvents(token, headers, events);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["eventsPaginated"] });
      return data;
    },
    onError: (error) => {
      console.error("Error bulk creating events:", error);
      throw error;
    },
  });
}
