export async function fetchUsers(headers, useAdminEndpoint = false) {
  try {
    const endpoint = useAdminEndpoint
      ? `/api/users/admin/all`
      : `/api/users/all`;

    // For admin endpoint, remove X-Tenant-Ids header as it's not needed
    // Admins should get all users across all tenants
    const requestHeaders = { ...headers };
    if (useAdminEndpoint) {
      delete requestHeaders["X-Tenant-Ids"];
      delete requestHeaders["x-tenant-ids"];
    }

    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + endpoint, {
      headers: {
        ...requestHeaders,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Failed to fetch users" }));
      throw new Error(
        error.message ||
          error.error ||
          `Failed to fetch users: ${response.status}`
      );
    }

    const data = await response.json();
    // Ensure we always return an array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
}

export async function deleteUser(id, token) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/users/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

export async function updateUser(user, headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/users/${user.id}`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

export async function createUser(userData, headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/users`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || "Failed to create user");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export async function updateUserRolesForTenant(
  userId,
  tenantId,
  roles,
  headers
) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/users/roles/tenant`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          tenantId,
          roles,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || error.error || "Failed to update user roles"
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating user roles for tenant:", error);
    throw error;
  }
}
