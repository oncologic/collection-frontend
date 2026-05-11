export async function fetchTenants(headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/users/tenants`,
      {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to fetch tenants" }));
      throw new Error(
        error.message ||
          error.error ||
          `Failed to fetch tenants: ${response.status}`
      );
    }

    const data = await response.json();
    // Ensure we always return an array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching tenants:", error);
    throw error;
  }
}

// Admin tenant management functions
export async function fetchAllTenants(headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/tenants`,
      {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to fetch tenants" }));
      throw new Error(
        error.message ||
          error.error ||
          `Failed to fetch tenants: ${response.status}`
      );
    }
    const data = await response.json();
    // Ensure we always return an array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching all tenants:", error);
    throw error;
  }
}

export async function fetchTenantById(id, headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/tenants/${id}`,
      {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch tenant");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching tenant:", error);
    throw error;
  }
}

export async function createTenant(tenantData, headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/tenants`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tenantData),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to create tenant");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating tenant:", error);
    throw error;
  }
}

export async function updateTenant(id, tenantData, headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/tenants/${id}`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tenantData),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update tenant");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating tenant:", error);
    throw error;
  }
}

export async function deleteTenant(id, headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/tenants/${id}`,
      {
        method: "DELETE",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to delete tenant");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting tenant:", error);
    throw error;
  }
}

export async function fetchTenantUsers(tenantId, headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/tenants/${tenantId}/users`,
      {
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to fetch tenant users");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching tenant users:", error);
    throw error;
  }
}

export async function addUserToTenant(tenantId, userId, roles, headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/tenants/${tenantId}/users`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, roles }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to add user to tenant");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error adding user to tenant:", error);
    throw error;
  }
}

export async function removeUserFromTenant(tenantId, userId, headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL +
        `/api/tenants/${tenantId}/users/${userId}`,
      {
        method: "DELETE",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to remove user from tenant");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error removing user from tenant:", error);
    throw error;
  }
}

export async function updateUserRolesInTenant(
  tenantId,
  userId,
  roles,
  headers
) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL +
        `/api/tenants/${tenantId}/users/${userId}/roles`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roles }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to update user roles");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating user roles:", error);
    throw error;
  }
}
