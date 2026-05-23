export async function updateCollectionResourceOrder(
  collectionId,
  resourceId,
  orderPosition,
  headers
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/resources/${resourceId}/order`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({ orderPosition }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update resource order");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating resource order:", error);
    throw error;
  }
}

// ... existing code ...

export async function createCollection(collectionData, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(collectionData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create collection");
  }

  return await response.json();
}

export async function createWorkflowInstanceFromTemplate(
  templateCollectionId,
  instanceData,
  headers
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${templateCollectionId}/workflow-instance`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(instanceData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || "Failed to create project");
  }

  return await response.json();
}

export async function getWorkflowTimeline(collectionId, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/workflow-timeline`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || "Failed to fetch timeline");
  }

  return response.json();
}

export async function deleteCollection(id, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${id}`,
    {
      method: "DELETE",
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete collection");
  }

  return response;
}

export async function mergeCollections(sourceCollectionId, targetCollectionId, mergeOptions, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/merge`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sourceCollectionId,
        targetCollectionId,
        mergeOptions,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || error.message || "Failed to merge collections");
  }

  return await response.json();
}

export async function deleteNotation({ notationId, headers }) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/external-link/notation/${notationId}`,
    {
      method: "DELETE",
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete collection");
  }

  return response;
}

// update Notation
export async function updateNotation(notationId, notationData, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/external-link/notation/${notationId}`,
    {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notationData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update notation");
  }

  return response;
}

export async function addResourceToCollection(
  collectionId,
  resourceId,
  note,
  headers
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/resources/collections/${collectionId}/resource/${resourceId}`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ note }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add resource to collection");
  }

  return response;
}

export async function getResourceCollections(headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/resources`,
      {
        headers,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch collections");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching collections:", error);
    throw error;
  }
}

export async function getCollectionExternalLink(headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/external-links`,
    {
      headers,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch collection external link");
  }

  return await response.json();
}

export async function getPinnedCollections(headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/pinned`,
    {
      headers,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch pinned collections");
  }

  return await response.json();
}

export async function getCollectionById(id, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${id}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch collection");
  }

  return response.json();
}

export async function getCollectionByIdPaginated(id, params, headers) {
  const queryParams = new URLSearchParams({
    page: params.page || 1,
    limit: params.limit || 20,
    ...(params.itemType && { itemType: params.itemType }),
  });

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${id}/paginated?${queryParams}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch collection");
  }

  return await response.json();
}

export async function addExternalLinkToCollection(
  collectionId,
  linkData,
  headers
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/external-link`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(linkData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add external link");
  }

  return response.json();
}

export async function updateExternalLinkInCollection(
  collectionId,
  externalLinkId,
  linkData,
  headers
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/external-link/${externalLinkId}`,
    {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(linkData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update external link");
  }

  return response.json();
}

export async function deleteExternalLinkFromCollection(
  collectionId,
  externalLinkId,
  headers
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/external-link/${externalLinkId}`,
    {
      method: "DELETE",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete external link");
  }

  return response.json();
}

export async function getExternalLinkById(id, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/external-link/${id}`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch external link");
  }

  return response.json();
}

// Notation APIs
export async function addExternalLinkNotation(
  collectionId,
  externalLinkId,
  notationData,
  headers
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/external-link/${externalLinkId}/notation`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notationData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add notation");
  }

  return response.json();
}

export async function getExternalLinkNotations(
  collectionId,
  externalLinkId,
  headers
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/external-link/${externalLinkId}/notations`,
    {
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch notations");
  }

  return response.json();
}

// Thread APIs
export async function addNotationThread(notationId, threadData, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/external-link/notation/${notationId}/thread`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(threadData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add thread");
  }

  return response.json();
}

// update Notation

export async function getNotationThreads(notationId, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/external-link/notation/${notationId}/threads`,
    {
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch threads");
  }

  return response.json();
}

export async function getNewsFeedNotations(page, limit, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/newsfeed/notations?page=${page}&limit=${limit}`,
      {
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch newsfeed notations");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching newsfeed notations:", error);
    throw error;
  }
}

// Folder APIs
export async function createFolder(folderData, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/folders`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(folderData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to create folder");
  }

  return response.json();
}

export async function getFolders(headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/folders`,
    {
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch folders");
  }

  return response.json();
}

export async function updateFolder(folderId, folderData, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/folders/${folderId}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(folderData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update folder");
  }

  return response.json();
}

export async function deleteFolder(folderId, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/folders/${folderId}`,
    {
      method: "DELETE",
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to delete folder");
  }

  return response.json();
}

export async function addCollectionToFolder(collectionId, folderId, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/folders/${folderId}/collections`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ collectionId }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to add collection to folder");
  }

  return response.json();
}

export async function removeCollectionFromFolder(
  collectionId,
  folderId,
  headers
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/folders/${folderId}/collections/${collectionId}`,
    {
      method: "DELETE",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to remove collection from folder");
  }

  return response.json();
}

export async function getCollectionCollaborators(collectionId, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/collaborators`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Failed to fetch collection collaborators"
    );
  }

  return response.json();
}

export async function inviteCollectionCollaborator(
  collectionId,
  collaboratorData,
  headers
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/collaborators`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(collaboratorData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to invite collection collaborator");
  }

  return response.json();
}

export async function removeCollectionCollaborator(
  collectionId,
  collaboratorId,
  headers
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/collaborators/${collaboratorId}`,
    {
      method: "DELETE",
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to remove collection collaborator");
  }

  return response.json();
}

export async function getExternalLinkCollaborators(externalLinkId, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/external-link/${externalLinkId}/collaborators`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      error.message || "Failed to fetch external link collaborators"
    );
  }

  return response.json();
}

export async function inviteCollaborator(
  externalLinkId,
  collaboratorData,
  headers
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/external-link/${externalLinkId}/collaborators`,
    {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(collaboratorData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to invite collaborator");
  }

  return response.json();
}

// New invitation API functions
export async function getPendingInvitations(headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/invitations/pending`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch pending invitations");
  }

  return response.json();
}

export async function acceptPendingInvitations(headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/invitations/accept-pending`,
    {
      method: "POST",
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to accept pending invitations");
  }

  return response.json();
}

export const acceptInvitationByToken = async (token, headers) => {
  const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/invitations/accept`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    // Try to parse as JSON first, but handle cases where it's not JSON
    let errorMessage = "Failed to accept invitation";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch (parseError) {
      // If we can't parse as JSON, it's likely an HTML error page
      const textResponse = await response.text();
      console.error("Non-JSON error response:", textResponse);

      if (response.status === 404) {
        errorMessage =
          "Invitation API endpoint not found. Please check if your backend server is running on port 3002.";
      } else if (response.status === 500) {
        errorMessage = "Server error occurred while processing invitation";
      } else {
        errorMessage = `Server returned ${response.status}: ${response.statusText}`;
      }
    }
    throw new Error(errorMessage);
  }

  return response.json();
};

// Delete collaborator from external link
export const deleteCollaborator = async (
  externalLinkId,
  collaboratorUserId,
  headers
) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/external-link/${externalLinkId}/collaborators/${collaboratorUserId}`,
    {
      method: "DELETE",
      headers,
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to delete collaborator");
  }
  return data;
};

// New API functions for ordering
export async function updateExternalLinkOrder(
  collectionId,
  externalLinkId,
  sortOrder,
  headers
) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/external-link/${externalLinkId}/order`,
    {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sortOrder }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update external link order");
  }

  return response.json();
}

export async function updateTypeOrder(collectionId, typeOrderings, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/type-ordering`,
    {
      method: "PATCH",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ typeOrderings }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to update type order");
  }

  return response.json();
}

export async function getCollectionTypeOrdering(collectionId, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/type-ordering`,
    {
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch type ordering");
  }

  return response.json();
}

export async function getDetailedCollectionExportData(collectionId, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/detailed-export-data`,
    {
      method: "GET",
      headers,
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to fetch detailed collection export data");
  }

  return response.json();
}
