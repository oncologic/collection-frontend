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
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`,
      );
    }

    return await response.json();
  } catch (error) {
    console.error("Error in createAttachment:", error);
    throw error;
  }
};

const getDirectUploadMetadata = (formData) => {
  const metadata = {};

  for (const [key, value] of formData.entries()) {
    if (key === "attachment") {
      continue;
    }

    metadata[key] = value;
  }

  return metadata;
};

const readErrorMessage = async (response, fallback) => {
  const responseText = await response.text().catch(() => "");

  if (!responseText) {
    return fallback;
  }

  const errorData = (() => {
    try {
      return JSON.parse(responseText);
    } catch {
      return { error: responseText };
    }
  })();

  return errorData.error || fallback;
};

export const createAttachmentViaDirectUpload = async (
  formData,
  token,
  headers,
) => {
  const files = formData
    .getAll("attachment")
    .filter((file) => file instanceof Blob);

  if (files.length === 0) {
    throw new Error("No file selected for upload");
  }

  const requestHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    ...headers,
  };
  const metadata = getDirectUploadMetadata(formData);

  const intentResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/attachments/upload-intent`,
    {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({
        ...metadata,
        files: files.map((file) => ({
          name: file.name || metadata.title || "attachment",
          contentType: file.type || "application/octet-stream",
          size: file.size,
        })),
      }),
    },
  );

  if (!intentResponse.ok) {
    throw new Error(
      await readErrorMessage(intentResponse, "Failed to create upload session"),
    );
  }

  const intent = await intentResponse.json();

  if (
    !Array.isArray(intent.uploads) ||
    intent.uploads.length !== files.length
  ) {
    throw new Error("Upload session response did not match selected files");
  }

  await Promise.all(
    intent.uploads.map(async (upload, index) => {
      const file = files[index];
      const uploadHeaders = {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": file.type || "application/octet-stream",
        ...(upload.requiredHeaders || {}),
      };

      const uploadResponse = await fetch(upload.uploadUrl, {
        method: "PUT",
        headers: uploadHeaders,
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error(
          await readErrorMessage(uploadResponse, "Failed to upload file"),
        );
      }
    }),
  );

  const completeResponse = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/attachments/upload-complete`,
    {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify({
        uploads: intent.uploads.map((upload) => ({
          uploadToken: upload.uploadToken,
        })),
      }),
    },
  );

  if (!completeResponse.ok) {
    throw new Error(
      await readErrorMessage(completeResponse, "Failed to complete upload"),
    );
  }

  return completeResponse.json();
};

export async function deleteAttachment(
  attachmentId,
  token,
  headers,
  externalLinkId,
  resourceId,
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
    requestOptions,
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
    },
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
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update attachment");
  }

  return await response.json();
}
