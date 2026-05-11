export const subscribeToOrganization = async (
  organizationId,
  userId,
  headers,
  role
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${organizationId}/subscribe`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role }),
      }
    );
    if (!response.ok) throw new Error("Failed to subscribe");
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const unsubscribeFromOrganization = async (
  organizationId,
  userId,
  headers
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${organizationId}/subscribe`,
      {
        method: "DELETE",
        headers,
      }
    );
    if (!response.ok) throw new Error("Failed to unsubscribe");
    return response.json();
  } catch (error) {
    throw error;
  }
};

export const getUserSubscriptions = async (headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/subscriptions/my-subscriptions`,
      {
        headers,
      }
    );
    if (!response.ok) throw new Error("Failed to fetch subscriptions");
    const orgs = await response.json();
    return orgs.organizations;
  } catch (error) {
    throw error;
  }
};

export const createOrganization = async ({ formData, headers }) => {
  try {
    const { "Content-Type": _contentType, ...requestHeaders } = headers || {};

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/organizations`,
      {
        method: "POST",
        headers: requestHeaders,
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create organization");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

export const deleteOrganization = async ({ id, headers }) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${id}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete organization");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

// New methods for social media integration
export const updateOrganizationSocialMedia = async ({
  id,
  socialMediaData,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${id}/social-media`,
      {
        method: "PUT",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(socialMediaData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to update social media settings"
      );
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

export const connectInstagramAccount = async ({
  organizationId,
  instagramCode,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${organizationId}/connect-instagram`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: instagramCode }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to connect Instagram account");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

export const disconnectSocialMedia = async ({
  organizationId,
  platform,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/${organizationId}/disconnect-social-media`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ platform }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to disconnect social media account"
      );
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};
