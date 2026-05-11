export const createAttachment = async (payload, token, headers) => {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/attachments/`;
    let body;
    let requestHeaders = {
      Authorization: `Bearer ${token}`,
      ...headers,
    };

    // Handle both FormData and plain object cases
    if (payload instanceof FormData) {
      body = payload;
      // Don't set Content-Type for FormData, let the browser set it
    } else {
      body = JSON.stringify(payload);
      requestHeaders["Content-Type"] = "application/json";
    }

    const response = await fetch(url, {
      method: "POST",
      headers: requestHeaders,
      body,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Attachment creation failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error in createAttachment:", error);
    throw error;
  }
};

export async function deleteAttachment(
  attachmentId,
  token,
  headers,
  externalLinkId,
  resourceId
) {
  const requestOptions = {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      ...headers,
    },
  };

  // If a parent relationship is provided, include it in the request body
  if (externalLinkId || resourceId) {
    requestOptions.headers["Content-Type"] = "application/json";
    requestOptions.body = JSON.stringify({
      ...(externalLinkId ? { externalLinkId } : {}),
      ...(resourceId ? { resourceId } : {}),
    });
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/attachments/${attachmentId}`,
    requestOptions
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete attachment");
  }

  return response.json();
}

export async function searchAttachments(query, token, headers) {
  const response = await fetch(
    `${
      process.env.NEXT_PUBLIC_API_URL
    }/api/attachments/search?q=${encodeURIComponent(query)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to search attachments");
  }

  return response.json();
}

export async function updateAttachment(id, metadata, headers) {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/attachments/${id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update attachment");
  }

  return await response.json();
}
