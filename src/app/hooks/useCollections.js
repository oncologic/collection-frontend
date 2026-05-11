import {
  useMutation,
  useQueryClient,
  useQuery,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import {
  updateCollectionResourceOrder,
  createCollection,
  deleteCollection,
  mergeCollections,
  addResourceToCollection,
  getResourceCollections,
  getCollectionExternalLink,
  getCollectionById,
  getCollectionByIdPaginated,
  addExternalLinkToCollection,
  updateExternalLinkInCollection,
  deleteExternalLinkFromCollection,
  getExternalLinkById,
  addExternalLinkNotation,
  getExternalLinkNotations,
  addNotationThread,
  getNotationThreads,
  getNewsFeedNotations,
  deleteNotation,
  updateNotation,
  createFolder,
  getFolders,
  updateFolder,
  deleteFolder,
  addCollectionToFolder,
  removeCollectionFromFolder,
  getPinnedCollections,
  getCollectionCollaborators,
  inviteCollectionCollaborator,
  removeCollectionCollaborator,
  getExternalLinkCollaborators,
  inviteCollaborator,
  getPendingInvitations,
  acceptPendingInvitations,
  acceptInvitationByToken,
  deleteCollaborator,
  updateExternalLinkOrder,
  updateTypeOrder,
  getCollectionTypeOrdering,
  getDetailedCollectionExportData,
} from "../api/collectionsApi";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useContextAuth } from "../context/authContext";

export function useUpdateCollectionResourceOrder() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, resourceId, orderPosition }) => {
      const headers = await getAuthHeader();
      return updateCollectionResourceOrder(
        collectionId,
        resourceId,
        orderPosition,
        headers
      );
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["collection", variables.collectionId]);
      toast.success("Resource order updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update resource order: ${error.message}`);
    },
  });
}

export function useCreateCollection() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionData) => {
      const headers = await getAuthHeader();
      return createCollection(collectionData, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      // toast.success("Collection created successfully"); // Commented out to reduce duplicate notifications
    },
    onError: (error) => {
      toast.error(`Failed to create collection: ${error.message}`);
    },
  });
}

export function useDeleteCollection() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (collectionId) => {
      const headers = await getAuthHeader();
      const response = await deleteCollection(collectionId, headers);
      if (!response.ok && response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["collections", "collectionExternalLink"],
      });
      toast.success("Collection deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete collection: ${error.message}`);
    },
  });
}

export function useMergeCollections() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      sourceCollectionId,
      targetCollectionId,
      mergeOptions,
    }) => {
      const headers = await getAuthHeader();
      return mergeCollections(
        sourceCollectionId,
        targetCollectionId,
        mergeOptions,
        headers
      );
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["collections"],
      });
      queryClient.invalidateQueries({
        queryKey: ["collection", variables.targetCollectionId],
      });
      if (!variables.mergeOptions?.keepSourceCollection) {
        queryClient.invalidateQueries({
          queryKey: ["collection", variables.sourceCollectionId],
        });
      }

      const itemCount = data.counts.externalLinks + data.counts.resources;
      toast.success(
        `Successfully merged ${itemCount} items into the collection`
      );

      // Navigate to the target collection
      router.push(`/collections/${variables.targetCollectionId}`);
    },
    onError: (error) => {
      toast.error(`Failed to merge collections: ${error.message}`);
    },
  });
}

export function useDeleteNotation() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notationId }) => {
      const headers = await getAuthHeader();
      const response = await deleteNotation({ notationId, headers });
      if (!response.ok && response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onMutate: async ({ notationId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["notations"] });
      await queryClient.cancelQueries({ queryKey: ["externalLinks"] });

      // Get all external link queries from the cache
      const externalLinkQueries = queryClient.getQueriesData({
        queryKey: ["externalLinks"],
      });

      // Store previous state for potential rollback
      const previousData = {};

      // Update each external link that contains this notation
      externalLinkQueries.forEach(([queryKey, linkData]) => {
        if (linkData && linkData.notations) {
          previousData[queryKey] = linkData;

          // Remove the notation from the cache
          const updatedData = {
            ...linkData,
            notations: linkData.notations.filter(
              (notation) => notation.id !== notationId
            ),
          };

          queryClient.setQueryData(queryKey, updatedData);
        }
      });

      return { previousData };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notations"] });
      queryClient.invalidateQueries({ queryKey: ["externalLinks"] });
      toast.success("Notation deleted successfully");
    },
    onError: (error, variables, context) => {
      // Rollback to previous state if available
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Failed to delete notation: ${error.message}`);
    },
  });
}

// update Notation
export function useUpdateNotation() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notationId, notationData }) => {
      const headers = await getAuthHeader();
      const response = await updateNotation(notationId, notationData, headers);
      if (!response.ok && response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onMutate: async ({ notationId, notationData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["externalLinks"] });

      // Get all external link queries from the cache
      const externalLinkQueries = queryClient.getQueriesData({
        queryKey: ["externalLinks"],
      });

      // Store previous state for potential rollback
      const previousData = {};

      // Update each external link that contains this notation
      externalLinkQueries.forEach(([queryKey, linkData]) => {
        if (linkData && linkData.notations) {
          // Store the previous state for this query
          previousData[queryKey] = linkData;

          // Create updated data with the modified notation
          const updatedData = {
            ...linkData,
            notations: linkData.notations.map((notation) =>
              notation.id === notationId
                ? {
                    ...notation,
                    ...notationData,
                    title: notationData.title || notation.title,
                    notes: notationData.content || notation.notes,
                    category: notationData.category || notation.category,
                    status: notationData.status || notation.status,
                    highlighted:
                      notationData.highlighted !== undefined
                        ? notationData.highlighted
                        : notation.highlighted,
                  }
                : notation
            ),
          };

          // Update the cache
          queryClient.setQueryData(queryKey, updatedData);
        }
      });

      return { previousData };
    },
    onSuccess: (_, { notationId }) => {
      // Invalidate affected queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["notations"] });
      queryClient.invalidateQueries({ queryKey: ["externalLinks"] });
      toast.success("Notation updated successfully");
    },
    onError: (error, { notationId }, context) => {
      // Rollback to previous state if available
      if (context?.previousData) {
        Object.entries(context.previousData).forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(`Failed to update notation: ${error.message}`);
    },
  });
}

export function useAddResourceToCollection() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, resourceId, note }) => {
      const headers = await getAuthHeader();
      return addResourceToCollection(collectionId, resourceId, note, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries([
        "availableResources",
        variables.collectionId,
      ]);

      // Snapshot the previous value
      const previousResources = queryClient.getQueryData([
        "availableResources",
        variables.collectionId,
      ]);

      // Optimistically remove the resource from the available resources
      queryClient.setQueryData(
        ["availableResources", variables.collectionId],
        (old) => {
          if (!old) return old;
          return old.filter((resource) => resource.id !== variables.resourceId);
        }
      );

      return { previousResources };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ["availableResources", variables.collectionId],
        context.previousResources
      );
      toast.error(`Failed to add resource to collection: ${err.message}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["collections", variables.collectionId]);
      queryClient.invalidateQueries(["events"]);
      toast.success("Resource added to collection successfully");
    },
  });
}

export function useGetResourceCollections() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      const response = await getResourceCollections(headers);

      if (!response.ok && response.error) {
        throw new Error(response.error);
      }
      return response;
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    staleTime: 0,
    cacheTime: 1000 * 60 * 5, // 5 minutes
    onError: (error) => {
      toast.error(`Failed to fetch collections: ${error.message}`);
    },
  });
}

export function useGetCollectionExternalLink() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["collectionExternalLink"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getCollectionExternalLink(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
  });
}

export function useGetPinnedCollections() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["pinnedCollections"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getPinnedCollections(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onError: (error) => {
      toast.error(`Failed to fetch collection: ${error.message}`);
    },
  });
}

export function useGetCollectionById(id, collectionType) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["collections", id, collectionType],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getCollectionById(id, headers);
    },
    // Allow fetch when we have an id - backend handles access control for public/unlisted collections
    enabled: !!id,
    onError: (error) => {
      toast.error(`Failed to fetch collection: ${error.message}`);
    },
  });
}

export function useGetCollectionByIdPaginated(id, params = {}) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["collections", id, "paginated", params],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getCollectionByIdPaginated(id, params, headers);
    },
    // Allow fetch when we have an id - backend handles access control for public/unlisted collections
    enabled: !!id,
    keepPreviousData: true, // Keep previous data while fetching new page
    onError: (error) => {
      toast.error(`Failed to fetch collection: ${error.message}`);
    },
  });
}

export function useAddExternalLinkToCollection() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, linkData }) => {
      const headers = await getAuthHeader();
      return addExternalLinkToCollection(collectionId, linkData, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["collections", variables.collectionId]);
      // toast.success("External link added successfully"); // Commented out to reduce duplicate notifications
    },
    onError: (error) => {
      toast.error(`Failed to add external link: ${error.message}`);
    },
  });
}

export function useUpdateExternalLinkInCollection() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async ({
      collectionId,
      externalLinkId,
      linkData,
      isMovingCollections,
    }) => {
      const headers = await getAuthHeader();

      const response = await updateExternalLinkInCollection(
        collectionId,
        externalLinkId,
        linkData,
        headers
      );
      // Return isMovingCollections along with the other data
      return {
        response,
        collectionId,
        collectionName: linkData.name || "Collection",
        isMovingCollections,
      };
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["collections", variables.collectionId]);
      queryClient.invalidateQueries([
        "externalLinks",
        variables.externalLinkId,
      ]);

      if (data.isMovingCollections) {
        // Show toast with action button for moved link
        toast(
          (t) => (
            <div className="flex items-center gap-4">
              <span>Moved to collection</span>
              <button
                onClick={() => {
                  router.push(`/collections/${data.collectionId}`);
                  toast.dismiss(t.id);
                }}
                className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-purple-200 transition-colors"
              >
                View Collection →
              </button>
            </div>
          ),
          {
            duration: 5000,
            style: {
              minWidth: "300px",
            },
          }
        );
      }
    },
    onError: (error) => {
      toast.error(`Failed to update external link: ${error.message}`);
    },
  });
}

export function useDeleteExternalLinkFromCollection() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, externalLinkId }) => {
      const headers = await getAuthHeader();
      return deleteExternalLinkFromCollection(
        collectionId,
        externalLinkId,
        headers
      );
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["collections", variables.collectionId]);
      toast.success("External link deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete external link: ${error.message}`);
    },
  });
}

export function useGetExternalLinkById(id) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["externalLinks", id],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getExternalLinkById(id, headers);
    },
    // Allow fetch when we have an id - backend handles access control for public/unlisted external links
    enabled: !!id,
    onError: (error) => {
      toast.error(`Failed to fetch external link: ${error.message}`);
    },
  });
}

export function useGetExternalLinkCollaborators(externalLinkId) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["externalLinkCollaborators", externalLinkId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getExternalLinkCollaborators(externalLinkId, headers);
    },
    enabled: !!externalLinkId && !!systemUser && !!selectedTenants?.length,
    onError: (error) => {
      toast.error(
        `Failed to fetch external link collaborators: ${error.message}`
      );
    },
  });
}

export function useInviteCollaborator() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ externalLinkId, collaboratorData }) => {
      const headers = await getAuthHeader();
      return inviteCollaborator(externalLinkId, collaboratorData, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        "externalLinkCollaborators",
        variables.externalLinkId,
      ]);

      // Show different success messages based on invitation type
      if (data.type === "immediate") {
        toast.success("Collaborator added successfully!");
      } else {
        toast.success(
          "Invitation sent! They'll be added when they create an account."
        );
      }
    },
    onError: (error) => {
      // Handle specific error cases with better messaging
      if (error.message.includes("already a collaborator")) {
        toast.error("This person is already a collaborator");
      } else if (error.message.includes("pending invitation already exists")) {
        toast.error("An invitation has already been sent to this email");
      } else if (error.message.includes("private external links")) {
        toast.error("Cannot add collaborators to private links");
      } else if (error.message.includes("upgradeRequired")) {
        toast.error("Upgrade your plan to add collaborators");
      } else {
        toast.error(`Failed to invite collaborator: ${error.message}`);
      }
    },
  });
}

export function useAddExternalLinkNotation() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, externalLinkId, notationData }) => {
      const headers = await getAuthHeader();
      return addExternalLinkNotation(
        collectionId,
        externalLinkId,
        notationData,
        headers
      );
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["notations", variables.externalLinkId]);
      queryClient.invalidateQueries({ queryKey: ["externalLinks"] });
      toast.success("Notation added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add notation: ${error.message}`);
    },
  });
}

export function useGetExternalLinkNotations(collectionId, externalLinkId) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["notations", externalLinkId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getExternalLinkNotations(collectionId, externalLinkId, headers);
    },
    enabled: !!externalLinkId && !!systemUser && !!selectedTenants?.length,
  });
}

export function useAddNotationThread() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ notationId, threadData }) => {
      const headers = await getAuthHeader();
      return addNotationThread(notationId, threadData, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries(["threads", variables.notationId]);
      toast.success("Thread added successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add thread: ${error.message}`);
    },
  });
}

export function useGetNotationThreads(notationId) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["threads", notationId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getNotationThreads(notationId, headers);
    },
    enabled: !!notationId && !!systemUser && !!selectedTenants?.length,
  });
}

export function useInfiniteNotations(limit = 10) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  return useInfiniteQuery({
    queryKey: ["newsfeedNotations"],
    queryFn: async ({ pageParam = 1 }) => {
      const headers = await getAuthHeader();
      return await getNewsFeedNotations(pageParam, limit, headers);
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === limit ? allPages.length + 1 : false,
  });
}

export function useCreateFolder() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderData) => {
      const headers = await getAuthHeader();
      return createFolder(folderData, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder created successfully");
    },
    onError: (error) => {
      toast.error(`Failed to create folder: ${error.message}`);
    },
  });
}

export function useGetFolders() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["folders"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getFolders(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    staleTime: 0,
    cacheTime: 1000 * 60 * 5, // 5 minutes
    onError: (error) => {
      toast.error(`Failed to fetch folders: ${error.message}`);
    },
  });
}

export function useUpdateFolder() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...folderData }) => {
      const headers = await getAuthHeader();
      return updateFolder(id, folderData, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update folder: ${error.message}`);
    },
  });
}

export function useDeleteFolder() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (folderId) => {
      const headers = await getAuthHeader();
      return deleteFolder(folderId, headers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Folder deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete folder: ${error.message}`);
    },
  });
}

export function useAddCollectionToFolder() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, folderId }) => {
      const headers = await getAuthHeader();
      return addCollectionToFolder(collectionId, folderId, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Collection added to folder successfully");
    },
    onError: (error) => {
      toast.error(`Failed to add collection to folder: ${error.message}`);
    },
  });
}

export function useRemoveCollectionFromFolder() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, folderId }) => {
      const headers = await getAuthHeader();
      return removeCollectionFromFolder(collectionId, folderId, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      toast.success("Collection removed from folder successfully");
    },
    onError: (error) => {
      toast.error(`Failed to remove collection from folder: ${error.message}`);
    },
  });
}

export function useMoveExternalLink() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      externalLinkId,
      fromCollectionId,
      toCollectionId,
    }) => {
      const headers = await getAuthHeader();
      const response = await fetch(
        `/api/external-links/${externalLinkId}/move`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            fromCollectionId,
            toCollectionId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to move external link");
      }
      return response.json();
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (_, { fromCollectionId, toCollectionId }) => {
      queryClient.invalidateQueries(["collections", fromCollectionId]);
      queryClient.invalidateQueries(["collections", toCollectionId]);
      toast.success("External link moved successfully");
    },
    onError: (error) => {
      toast.error(`Failed to move external link: ${error.message}`);
    },
  });
}

export function useAddItemToCollection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      // Different API calls depending on what's being added
      if (payload.externalLink) {
        // Adding an external link (like a trial or publication)
        const response = await fetch(
          `/api/collections/${payload.collectionId}/external-links`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload.externalLink),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to add external link to collection");
        }
        return response.json();
      } else {
        // Adding a resource
        const response = await fetch(
          `/api/collections/${payload.collectionId}/resources/${payload.resourceId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              note: payload.note,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to add resource to collection");
        }
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collections"] });
    },
  });
}

// New hooks for invitation system
export function useGetPendingInvitations() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["pendingInvitations"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getPendingInvitations(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onError: (error) => {
      console.error("Failed to fetch pending invitations:", error);
    },
  });
}

export function useAcceptPendingInvitations() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const headers = await getAuthHeader();
      return acceptPendingInvitations(headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["pendingInvitations"]);
      queryClient.invalidateQueries(["externalLinkCollaborators"]);

      if (data.data.acceptedCount > 0) {
        toast.success(
          `Accepted ${data.data.acceptedCount} pending invitations!`
        );
      }
    },
    onError: (error) => {
      toast.error(`Failed to accept invitations: ${error.message}`);
    },
  });
}

export function useAcceptInvitationByToken() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (token) => {
      const headers = await getAuthHeader();
      return acceptInvitationByToken(token, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (data) => {
      queryClient.invalidateQueries(["pendingInvitations"]);
      queryClient.invalidateQueries(["externalLinkCollaborators"]);

      if (data.alreadyCollaborator) {
        toast.success("You're already a collaborator for this resource!");
      } else {
        toast.success("Invitation accepted! You're now a collaborator.");
      }
    },
    onError: (error) => {
      if (error.message.includes("Invalid or expired")) {
        toast.error("This invitation link is invalid or has expired");
      } else if (error.message.includes("email does not match")) {
        toast.error("This invitation was sent to a different email address");
      } else {
        toast.error(`Failed to accept invitation: ${error.message}`);
      }
    },
  });
}

export function useDeleteCollaborator() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ externalLinkId, collaboratorUserId }) => {
      const headers = await getAuthHeader();
      return deleteCollaborator(externalLinkId, collaboratorUserId, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries([
        "externalLinkCollaborators",
        variables.externalLinkId,
      ]);
      queryClient.invalidateQueries([
        "externalLinks",
        variables.externalLinkId,
      ]);
      queryClient.invalidateQueries(["collections"]);

      toast.success("Collaborator removed successfully");
    },
    onError: (error) => {
      if (error.message.includes("Cannot remove yourself")) {
        toast.error("You cannot remove yourself as a collaborator");
      } else if (error.message.includes("not authorized")) {
        toast.error("You don't have permission to remove this collaborator");
      } else {
        toast.error(`Failed to remove collaborator: ${error.message}`);
      }
    },
  });
}

export function useUpdateExternalLinkOrder() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, externalLinkId, sortOrder }) => {
      const headers = await getAuthHeader();
      return updateExternalLinkOrder(
        collectionId,
        externalLinkId,
        sortOrder,
        headers
      );
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (_, variables) => {
      if (!variables?.skipInvalidate) {
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey;
            return (
              (key[0] === "collections" && key[1] === variables.collectionId) ||
              (key[0] === "collection" && key[1] === variables.collectionId) ||
              (key[0] === "collectionTypeOrdering" &&
                key[1] === variables.collectionId) ||
              key[0] === "collectionExternalLink"
            );
          },
        });
      }

      if (!variables?.silent) {
        toast.success("Link order updated successfully");
      }
    },
    onError: (error, variables) => {
      if (!variables?.silent) {
        toast.error(`Failed to update link order: ${error.message}`);
      }
    },
  });
}

export function useUpdateTypeOrder() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, typeOrderings }) => {
      const headers = await getAuthHeader();
      return updateTypeOrder(collectionId, typeOrderings, headers);
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (_, variables) => {
      // Consolidate all collection-related query invalidations into a single call
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            (key[0] === "collections" && key[1] === variables.collectionId) ||
            (key[0] === "collection" && key[1] === variables.collectionId) ||
            (key[0] === "collectionTypeOrdering" &&
              key[1] === variables.collectionId) ||
            key[0] === "collectionExternalLink"
          );
        },
      });
      toast.success("Type order updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update type order: ${error.message}`);
    },
  });
}

export function useGetCollectionTypeOrdering(collectionId) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["collectionTypeOrdering", collectionId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getCollectionTypeOrdering(collectionId, headers);
    },
    enabled: !!collectionId && !!systemUser && !!selectedTenants?.length,
  });
}

export function useGetDetailedCollectionExportData(collectionId) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["detailedCollectionExportData", collectionId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      const result = await getDetailedCollectionExportData(
        collectionId,
        headers
      );

      return result;
    },
    enabled: !!collectionId && !!systemUser,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (error) => {
      console.error(
        `Failed to fetch detailed collection export data: ${error.message}`
      );
    },
  });
}

// Collection Collaborator Hooks
export function useGetCollectionCollaborators(collectionId) {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();

  return useQuery({
    queryKey: ["collectionCollaborators", collectionId],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return getCollectionCollaborators(collectionId, headers);
    },
    enabled: !!collectionId && !!systemUser && !!selectedTenants?.length,
  });
}

export function useInviteCollectionCollaborator() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, collaboratorData }) => {
      const headers = await getAuthHeader();
      return inviteCollectionCollaborator(
        collectionId,
        collaboratorData,
        headers
      );
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["collectionCollaborators", variables.collectionId],
      });

      // If cascade was applied, also invalidate external link collaborators
      if (variables.collaboratorData.cascadeToExternalLinks) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === "externalLinkCollaborators",
        });
      }

      if (data.type === "existing") {
        toast.success("Collaborator added successfully");
      } else {
        toast.success("Invitation sent successfully");
      }
    },
    onError: (error) => {
      console.error("Failed to invite collaborator:", error);

      if (error.message.includes("already a collaborator")) {
        toast.error("This user is already a collaborator");
      } else if (error.message.includes("private collections")) {
        toast.error("Cannot add collaborators to private collections");
      } else {
        toast.error(`Failed to invite collaborator: ${error.message}`);
      }
    },
  });
}

export function useRemoveCollectionCollaborator() {
  const { getAuthHeader, systemUser, selectedTenants } = useContextAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ collectionId, collaboratorId }) => {
      const headers = await getAuthHeader();
      return removeCollectionCollaborator(
        collectionId,
        collaboratorId,
        headers
      );
    },
    enabled: !!systemUser && !!selectedTenants?.length,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["collectionCollaborators", variables.collectionId],
      });

      // Also invalidate external link collaborators since cascade removal affects them
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "externalLinkCollaborators",
      });

      toast.success("Collaborator removed successfully");
    },
    onError: (error) => {
      toast.error(`Failed to remove collaborator: ${error.message}`);
    },
  });
}
