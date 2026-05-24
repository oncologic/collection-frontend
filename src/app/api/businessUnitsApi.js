export const subscribeToBusinessUnit = async (
  businessUnitId,
  userId,
  headers,
  role
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/business-units/${businessUnitId}/subscribe`,
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

export const unsubscribeFromBusinessUnit = async (
  businessUnitId,
  userId,
  headers
) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/business-units/${businessUnitId}/subscribe`,
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
      `${process.env.NEXT_PUBLIC_API_URL}/api/business-units/subscriptions/my-subscriptions`,
      {
        headers,
      }
    );
    if (!response.ok) throw new Error("Failed to fetch subscriptions");
    const data = await response.json();
    return data.businessUnits || data.organizations || [];
  } catch (error) {
    throw error;
  }
};

export const createBusinessUnit = async ({ formData, headers }) => {
  try {
    const { "Content-Type": _contentType, ...requestHeaders } = headers || {};

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/business-units`,
      {
        method: "POST",
        headers: requestHeaders,
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create business unit");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

export const deleteBusinessUnit = async ({ id, headers }) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/business-units/${id}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete business unit");
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

// New methods for social media integration
export const updateBusinessUnitSocialMedia = async ({
  id,
  socialMediaData,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/business-units/${id}/social-media`,
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
  businessUnitId,
  instagramCode,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/business-units/${businessUnitId}/connect-instagram`,
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
  businessUnitId,
  platform,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/business-units/${businessUnitId}/disconnect-social-media`,
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
