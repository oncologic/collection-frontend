export async function fetchLinkGroups(headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/link-groups`,
      {
        headers,
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching link groups:", error);
    throw error;
  }
}

export async function fetchLinkGroupById(
  id,
  headers,
  linkingType = "external_link"
) {
  try {
    const searchParams = new URLSearchParams();
    if (linkingType) {
      searchParams.set("linkingType", linkingType);
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/link-groups/${id}?${searchParams.toString()}`,
      {
        headers,
      }
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || "Failed to fetch link group");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching link group:", error);
    throw error;
  }
}

export async function createLinkGroup(linkGroupData, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/link-groups`,
      {
        method: "POST",
        headers,
        body: JSON.stringify(linkGroupData),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || "Failed to create link group");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating link group:", error);
    throw error;
  }
}

export async function updateLinkGroup(id, linkGroupData, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/link-groups/${id}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(linkGroupData),
      }
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || "Failed to update link group");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating link group:", error);
    throw error;
  }
}

export async function patchLinkGroup(id, linkGroupData, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/link-groups/${id}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify(linkGroupData),
      }
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || "Failed to patch link group");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error patching link group:", error);
    throw error;
  }
}

export async function deleteLinkGroup(id, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/link-groups/${id}`,
      {
        method: "DELETE",
        headers,
      }
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || error.message || "Failed to delete link group");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting link group:", error);
    throw error;
  }
}

// Event Type CRUD functions
export async function createResourceType(resourceTypeData, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/resource-types`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resourceTypeData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create resource type");
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating resource type:", error);
    throw error;
  }
}

export async function updateResourceType(id, resourceTypeData, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/resource-types/${id}`,
      {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resourceTypeData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update resource type");
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating resource type:", error);
    throw error;
  }
}

export async function deleteResourceType(id, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/resource-types/${id}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete resource type");
    }

    return response.status === 204;
  } catch (error) {
    console.error("Error deleting resource type:", error);
    throw error;
  }
}

// Event Type CRUD functions
export async function createEventType(eventTypeData, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/event-types`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventTypeData),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create event type");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating event type:", error);
    throw error;
  }
}

export async function updateEventType(id, eventTypeData, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/event-types/${id}`,
      {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventTypeData),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update event type");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating event type:", error);
    throw error;
  }
}

export async function deleteEventType(id, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/metadata/event-types/${id}`,
      {
        method: "DELETE",
        headers,
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete event type");
    }
    
    return response.status === 204;
  } catch (error) {
    console.error("Error deleting event type:", error);
    throw error;
  }
}

// Tag CRUD functions
export async function createTag(tagData, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tags`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tagData),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create tag");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating tag:", error);
    throw error;
  }
}

export async function updateTag(id, tagData, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tags/${id}`,
      {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tagData),
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update tag");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error updating tag:", error);
    throw error;
  }
}

export async function deleteTag(id, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tags/${id}`,
      {
        method: "DELETE",
        headers,
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete tag");
    }
    
    return response.status === 204;
  } catch (error) {
    console.error("Error deleting tag:", error);
    throw error;
  }
}
