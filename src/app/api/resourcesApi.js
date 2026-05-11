export async function updateResource(id, resource, headers = {}) {
  try {
    // Check if resource is FormData (for image upload) or regular object
    const isFormData = resource instanceof FormData;

    let body;
    const finalHeaders = { ...headers };

    if (isFormData) {
      // If FormData, use it directly
      body = resource;
      // Don't set Content-Type for FormData, let the browser set it
      delete finalHeaders["Content-Type"];
    } else {
      // Keep the resource data as-is, don't modify dates
      body = JSON.stringify(resource);
      finalHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/resources/${id}`,
      {
        method: "PATCH",
        headers: finalHeaders,
        body: body,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update resource");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating resource:", error);
    throw error;
  }
}

export async function fetchResourcesForSubscriptions(headers = {}) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/resources/subscriptions`,
      {
        headers,
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch subscription resources:", response.status);
      return [];
    }

    const data = await response.json();

    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.error("Subscription resources response is not an array:", data);
      return [];
    }

    return data;
  } catch (error) {
    console.error("Error fetching subscription resources:", error);
    return [];
  }
}

export async function fetchResources(headers = {}) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/resources`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      console.error("Failed to fetch resources:", response.status);
      return [];
    }

    const data = await response.json();

    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.error("Resources response is not an array:", data);
      return [];
    }

    // Sort resources by resourceUpdatedDate if available, otherwise use resourceDate
    const sortedData = data.sort((a, b) => {
      const dateA = a.resourceUpdatedDate || a.resourceDate;
      const dateB = b.resourceUpdatedDate || b.resourceDate;
      return new Date(dateB) - new Date(dateA);
    });
    return sortedData;
  } catch (error) {
    console.error("Error fetching resources:", error);
    return [];
  }
}

export async function getResourceById(id, headers = {}) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/resources/${id}`,
      {
        headers,
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch resource");
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching resource:", error);

    throw error;
  }
}

export async function rateResource(resourceId, ratingData, headers = {}) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/resources/${resourceId}/rate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(ratingData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to rate resource");
    }

    return response.json();
  } catch (error) {
    console.error("Error rating resource:", error);
    throw error;
  }
}

export async function suggestResource(resourceData, headers = {}) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/resources/suggest`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(resourceData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || error.error || "Failed to submit resource suggestion"
      );
    }

    return response.json();
  } catch (error) {
    console.error("Error suggesting resource:", error);
    throw error;
  }
}

export async function getPendingResources(headers = {}) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/resources/pending`,
      {
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch pending resources");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching pending resources:", error);
    throw error;
  }
}

export async function reviewPendingResource(resourceId, status, headers = {}) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/resources/${resourceId}/review`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ status }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to review resource");
    }

    return response.json();
  } catch (error) {
    console.error("Error reviewing resource:", error);
    throw error;
  }
}
