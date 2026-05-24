export const fetchSocialMediaPosts = async (headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/posts`,
      {
        headers,
      }
    );
    if (!response.ok) throw new Error("Failed to fetch social media posts");
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const fetchOrganizationSocialMedia = async (organizationId, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/organizations/${organizationId}`,
      {
        headers,
      }
    );
    if (!response.ok)
      throw new Error("Failed to fetch organization social media posts");
    return response.json();
  } catch (error) {
    throw error;
  }
};

// Social Media Account APIs
export const fetchSocialMediaPlatforms = async (headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/platforms`,
      {
        headers,
      }
    );
    if (!response.ok) throw new Error("Failed to fetch social media platforms");
    return response.json();
  } catch (error) {
    console.error("Error fetching social media platforms:", error);
    throw error;
  }
};

export const fetchSocialMediaPlatformCatalog = async (headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/platforms/catalog`,
      {
        headers,
      }
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || "Failed to fetch social media platform catalog"
      );
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching social media platform catalog:", error);
    throw error;
  }
};

export const createSocialMediaPlatform = async (platformData, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/platforms`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(platformData),
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || "Failed to create social media platform");
    }

    return response.json();
  } catch (error) {
    console.error("Error creating social media platform:", error);
    throw error;
  }
};

export const fetchSocialMediaAccountTypes = async (headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/account-types`,
      {
        headers,
      }
    );
    if (!response.ok) throw new Error("Failed to fetch social media account types");
    return response.json();
  } catch (error) {
    console.error("Error fetching social media account types:", error);
    throw error;
  }
};

export const fetchSocialMediaAccounts = async (formatted = false, includeAssociations = false, headers) => {
  try {
    const params = new URLSearchParams();
    if (formatted) params.append('formatted', 'true');
    if (includeAssociations) params.append('includeAssociations', 'true');

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/accounts${params.toString() ? `?${params.toString()}` : ''}`;

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) throw new Error("Failed to fetch social media accounts");
    return response.json();
  } catch (error) {
    console.error("Error fetching social media accounts:", error);
    throw error;
  }
};

export const createSocialMediaAccount = async (accountData, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/accounts`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create social media account");
    }

    const data = await response.json();
    return data?.account ? { ...data.account, collection: data.collection } : data;
  } catch (error) {
    console.error("Error creating social media account:", error);
    throw error;
  }
};

export const updateSocialMediaAccount = async (id, accountData, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/accounts/${id}`,
      {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(accountData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update social media account");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating social media account:", error);
    throw error;
  }
};

export const deleteSocialMediaAccount = async (id, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/accounts/${id}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete social media account");
    }

    return response.json();
  } catch (error) {
    console.error("Error deleting social media account:", error);
    throw error;
  }
};

const toLegacyAssociatedType = (associatedType) =>
  associatedType === "business_unit" || associatedType === "businessUnit"
    ? "organization"
    : associatedType;

// Social Media Associations APIs
export const fetchAssociatedSocialMediaAccounts = async (associatedId, associatedType, headers) => {
  try {
    const normalizedAssociatedType = toLegacyAssociatedType(associatedType);
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/associations?associatedId=${associatedId}&associatedType=${normalizedAssociatedType}`,
      {
        headers,
      }
    );

    if (!response.ok) throw new Error("Failed to fetch associated social media accounts");
    return response.json();
  } catch (error) {
    console.error("Error fetching associated social media accounts:", error);
    throw error;
  }
};

// Fetch associations for a specific social media account
export const fetchSocialMediaAccountAssociations = async (socialMediaAccountId, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/associations?socialMediaAccountId=${socialMediaAccountId}`,
      {
        headers,
      }
    );

    if (!response.ok) throw new Error("Failed to fetch social media account associations");
    return response.json();
  } catch (error) {
    console.error("Error fetching social media account associations:", error);
    throw error;
  }
};

export const createSocialMediaAssociation = async (associationData, headers) => {
  try {
    const payload = {
      ...associationData,
      associatedType: toLegacyAssociatedType(associationData.associatedType),
    };
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/associations`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create social media association");
    }

    return response.json();
  } catch (error) {
    console.error("Error creating social media association:", error);
    throw error;
  }
};

export const deleteSocialMediaAssociation = async (associationData, headers) => {
  try {
    const payload = {
      ...associationData,
      associatedType: toLegacyAssociatedType(associationData.associatedType),
    };
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/associations`,
      {
        method: "DELETE",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete social media association");
    }

    return response.json();
  } catch (error) {
    console.error("Error deleting social media association:", error);
    throw error;
  }
};

export const bulkCreateSocialMediaAccounts = async (data, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/social-media/accounts/bulk`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to bulk create social media accounts");
    }

    return response.json();
  } catch (error) {
    console.error("Error bulk creating social media accounts:", error);
    throw error;
  }
};
