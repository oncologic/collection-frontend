export async function addResourcesToExternalLink(
  collectionId,
  externalLinkId,
  resources,
  headers = {}
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/external-links/${externalLinkId}/resources`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(resources),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to add resources");
    }

    return response.json();
  } catch (error) {
    console.error("Error adding resources to external link:", error);
    throw error;
  }
}

export async function getExternalLinkResources(
  collectionId,
  externalLinkId,
  headers = {}
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/external-links/${externalLinkId}/resources`,
      {
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch resources");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching external link resources:", error);
    throw error;
  }
}

export async function removeResourcesFromExternalLink(
  collectionId,
  externalLinkId,
  resourceIds,
  headers = {}
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/external-links/${externalLinkId}/resources`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ resourceIds }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to remove resources");
    }

    return response.json();
  } catch (error) {
    console.error("Error removing resources from external link:", error);
    throw error;
  }
}

export async function updateExternalLinkResourceOrder(
  collectionId,
  externalLinkId,
  resourceId,
  orderPosition,
  headers = {}
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/external-links/${externalLinkId}/resources/${resourceId}/order`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ orderPosition }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update resource order");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating resource order:", error);
    throw error;
  }
}

export async function updateExternalLinkResourceNotes(
  collectionId,
  externalLinkId,
  resourceId,
  notes,
  headers = {}
) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/external-links/${externalLinkId}/resources/${resourceId}/notes`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ notes }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update resource notes");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating resource notes:", error);
    throw error;
  }
}