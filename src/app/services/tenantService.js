export const tenantService = {
  // Fetch all available public tenants
  async getAllTenants(token) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/tenants`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch tenants");
    }

    return response.json();
  },

  // Join a single tenant
  async joinTenant(token, tenantId) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/tenants/join`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantId }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to join tenant");
    }

    return response.json();
  },

  // Update user's tenant associations (replace all)
  async updateTenants(token, tenantIds) {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/tenants`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tenantIds }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to update tenants");
    }

    return response.json();
  },
};