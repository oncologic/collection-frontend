export const createSharedLink = async ({
  type,
  id,
  expiryDays,
  emailList,
  description,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links`,
      {
        method: "POST",
        headers: {
          ...headers,
        },
        body: JSON.stringify({
          type,
          id,
          expiryDays,
          emailList,
          description,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create shared link");
    }

    return response.json();
  } catch (error) {
    console.error("Error creating shared link:", error);
    throw error;
  }
};

export const getUserSharedLinks = async (headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/user`,
      {
        method: "GET",
        headers: {
          ...headers,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user shared links");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching user shared links:", error);
    throw error;
  }
};

export const getSharedLinksByTypeAndId = async ({ type, id, headers }) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/type/${type}/id/${id}`,
      {
        method: "GET",
        headers: {
          ...headers,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch shared links for ${type}/${id}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Error fetching shared links for ${type}/${id}:`, error);
    throw error;
  }
};

export const revokeSharedLink = async ({ linkId, headers }) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to revoke shared link");
    }

    return response.json();
  } catch (error) {
    console.error("Error revoking shared link:", error);
    throw error;
  }
};

export const updateSharedLink = async ({ linkId, updates, headers }) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(updates),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update shared link");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating shared link:", error);
    throw error;
  }
};

export const getSharedLinkById = async ({ linkId, headers }) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/manage/${linkId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch shared link");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching shared link:", error);
    throw error;
  }
};

export const accessSharedContent = async ({ linkId, token, email }) => {
  try {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}`
    );
    url.searchParams.append("token", token);
    if (email) {
      url.searchParams.append("email", email);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Context": "shared-link-access",
        "X-Shared-Token": token,
      },
    });

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 404) {
        throw new Error(error.error || "Shared link not found or has expired");
      } else if (response.status === 403) {
        throw new Error(error.error || "Access denied - email not authorized");
      } else if (response.status === 401) {
        throw new Error(error.error || "Invalid or expired token");
      } else {
        throw new Error(error.error || "Failed to access shared content");
      }
    }

    const data = await response.json();

    if (data.content?.type === "collection") {
      data.content.externalLinks = data.content.externalLinks || [];
    }

    return data;
  } catch (error) {
    console.error("Error accessing shared content:", error);
    throw error;
  }
};

// New review-related API functions
export const submitReviewerInfo = async ({ linkId, token, userInfo }) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}/review/user-info`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, userInfo }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to submit reviewer information");
    }

    return response.json();
  } catch (error) {
    console.error("Error submitting reviewer information:", error);
    throw error;
  }
};

export const submitItemFeedback = async ({
  linkId,
  token,
  itemId,
  feedback,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}/review/feedback`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, itemId, feedback }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to submit item feedback");
    }

    return response.json();
  } catch (error) {
    console.error("Error submitting item feedback:", error);
    throw error;
  }
};

// export const submitReview = async ({
//   linkId,
//   token,
//   feedback,
//   reviewerInfo,
// }) => {
//   try {
//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}/review/submit`,
//       {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ token, feedback, reviewerInfo }),
//       }
//     );

//     if (!response.ok) {
//       throw new Error("Failed to submit review");
//     }

//     return response.json();
//   } catch (error) {
//     console.error("Error submitting review:", error);
//     throw error;
//   }
// };

export const getReviewData = async ({ linkId, token, email }) => {
  try {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}/review`
    );
    url.searchParams.append("token", token);
    if (email) {
      url.searchParams.append("email", email);
    }

    const response = await fetch(
      url.toString(),
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get review data");
    }

    return response.json();
  } catch (error) {
    console.error("Error getting review data:", error);
    throw error;
  }
};

export const submitUserInfo = async ({ linkId, token, userInfo }) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}/user-info?token=${token}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userInfo),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit user information: ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Error submitting user info:", error);
    throw error;
  }
};

export const submitFeedback = async ({
  linkId,
  token,
  email,
  itemId,
  reviewerId,
  action,
  note,
}) => {
  try {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}/feedback`
    );
    url.searchParams.append("token", token);
    if (email) {
      url.searchParams.append("email", email);
    }

    const response = await fetch(
      url.toString(),
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          reviewerId,
          action,
          note,
          timestamp: new Date().toISOString(),
          from: reviewerId,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit feedback");
    }

    return response.json();
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
};

export const submitReview = async ({
  linkId,
  token,
  email,
  reviewerId,
  feedback,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}/review/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shared-Token": token,
        },
        body: JSON.stringify({
          token,
          email,
          reviewerId,
          feedbackData: feedback,
          submittedAt: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit review");
    }

    return response.json();
  } catch (error) {
    console.error("Error submitting review:", error);
    throw error;
  }
};

export const getSharedLinkGroupById = async ({ id, token, email }) => {
  try {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${id}/link-groups`
    );
    url.searchParams.append("token", token);
    if (email) {
      url.searchParams.append("email", email);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch shared link group");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching shared link group:", error);
    throw error;
  }
};

// New email-based access validation function
export const validateEmailAccess = async (linkId, email, token) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}/validate-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Access-Context": "email-validation",
          "X-Shared-Token": token,
        },
        body: JSON.stringify({ linkId, email, token }),
      }
    );

    if (!response.ok) {
      const error = await response.json();

      if (response.status === 404) {
        throw new Error(error.error || "Shared link not found or has expired");
      } else if (response.status === 403) {
        throw new Error(error.error || "Email not authorized for this content");
      } else if (response.status === 401) {
        throw new Error(error.error || "Invalid request");
      } else {
        throw new Error(error.error || "Failed to validate email access");
      }
    }

    return response.json();
  } catch (error) {
    console.error("Error validating email access:", error);
    throw error;
  }
};

// Get link groups with email validation
export const getLinkGroupsWithEmail = async (linkId, token, email) => {
  try {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}/link-groups`
    );
    url.searchParams.append("token", token);
    url.searchParams.append("email", email);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get link groups");
    }

    return response.json();
  } catch (error) {
    console.error("Error getting link groups:", error);
    throw error;
  }
};

// Submit reviewer info with email validation
export const submitReviewerInfoWithEmail = async (
  linkId,
  token,
  email,
  reviewerData
) => {
  try {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}/user-info`
    );
    url.searchParams.append("token", token);
    url.searchParams.append("email", email);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit reviewer info");
    }

    return response.json();
  } catch (error) {
    console.error("Error submitting reviewer info:", error);
    throw error;
  }
};

// Submit feedback with email validation
export const submitFeedbackWithEmail = async (
  linkId,
  token,
  email,
  feedbackData
) => {
  try {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}/feedback`
    );
    url.searchParams.append("token", token);
    url.searchParams.append("email", email);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(feedbackData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to submit feedback");
    }

    return response.json();
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
};

// Get review data with email validation
export const getReviewDataWithEmail = async (linkId, token, email) => {
  try {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_API_URL}/api/shared-links/${linkId}/review`
    );
    url.searchParams.append("token", token);
    url.searchParams.append("email", email);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to get review data");
    }

    return response.json();
  } catch (error) {
    console.error("Error getting review data:", error);
    throw error;
  }
};

// Public JSON Sharing API functions
export const toggleCollectionPublicJsonSharing = async ({
  collectionId,
  enabled,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/public-json-sharing`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ enabled }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to toggle collection public JSON sharing");
    }

    return response.json();
  } catch (error) {
    console.error("Error toggling collection public JSON sharing:", error);
    throw error;
  }
};

export const toggleExternalLinkPublicJsonSharing = async ({
  externalLinkId,
  enabled,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/external-link/${externalLinkId}/public-json-sharing`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ enabled }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to toggle external link public JSON sharing");
    }

    return response.json();
  } catch (error) {
    console.error("Error toggling external link public JSON sharing:", error);
    throw error;
  }
};

export const getCollectionPublicSharingStatus = async ({
  collectionIds,
  headers,
}) => {
  try {
    const ids = Array.isArray(collectionIds)
      ? collectionIds.join(",")
      : collectionIds;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/public-sharing-status?ids=${ids}`,
      {
        method: "GET",
        headers: {
          ...headers,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get collection public sharing status");
    }

    return response.json();
  } catch (error) {
    console.error("Error getting collection public sharing status:", error);
    throw error;
  }
};

export const getExternalLinkPublicSharingStatus = async ({
  externalLinkIds,
  headers,
}) => {
  try {
    const ids = Array.isArray(externalLinkIds)
      ? externalLinkIds.join(",")
      : externalLinkIds;
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/external-links/public-sharing-status?ids=${ids}`,
      {
        method: "GET",
        headers: {
          ...headers,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get external link public sharing status");
    }

    return response.json();
  } catch (error) {
    console.error("Error getting external link public sharing status:", error);
    throw error;
  }
};

// Public JSON access (no auth required)
export const getPublicCollectionJson = async (collectionId) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/public/collection/${collectionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to access public collection");
    }

    return response.json();
  } catch (error) {
    console.error("Error accessing public collection:", error);
    throw error;
  }
};

export const getPublicExternalLinkJson = async (externalLinkId) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/public/external-link/${externalLinkId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to access public external link");
    }

    return response.json();
  } catch (error) {
    console.error("Error accessing public external link:", error);
    throw error;
  }
};

export const fetchSharedCollection = async (collectionId) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/public/collection/${collectionId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Collection not found or not publicly accessible");
      }
      throw new Error("Failed to fetch shared collection");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching shared collection:", error);
    throw error;
  }
};

export const fetchPublicResourceTypes = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/public/resource-types`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch public resource types");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching public resource types:", error);
    throw error;
  }
};

// Generate a readable share slug for collections
export const generateShareSlug = (collectionName) => {
  // Create a URL-friendly slug from the collection name
  const slug = collectionName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .substring(0, 50) // Limit length
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

  // Generate a short random suffix for uniqueness and security
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return `${slug}-${suffix}`;
};

// Fetch collection by share slug instead of ID
export const fetchSharedCollectionBySlug = async (shareSlug) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/public/collection/slug/${shareSlug}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Collection not found or not publicly accessible");
      }
      throw new Error("Failed to fetch shared collection");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching shared collection by slug:", error);
    throw error;
  }
};

// Update or generate share slug for a collection
export const updateCollectionShareSlug = async ({ collectionId, headers }) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}/share-slug`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update collection share slug");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating collection share slug:", error);
    throw error;
  }
};
