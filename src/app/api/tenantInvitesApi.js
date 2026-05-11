export const createTenantInvite = async (payload, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tenant-invites`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create tenant invite');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in createTenantInvite:', error);
    throw error;
  }
};

export const getTenantInvites = async (tenantId, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tenant-invites/tenant/${tenantId}`,
      {
        method: 'GET',
        headers: {
          ...headers,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get tenant invites');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getTenantInvites:', error);
    throw error;
  }
};

export const getInviteByToken = async (token) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tenant-invites/token/${token}`,
      {
        method: 'GET',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get invite details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getInviteByToken:', error);
    throw error;
  }
};

export const acceptTenantInvite = async (token, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tenant-invites/accept/${token}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to accept tenant invite');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in acceptTenantInvite:', error);
    throw error;
  }
};

export const revokeTenantInvite = async (inviteId, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tenant-invites/${inviteId}`,
      {
        method: 'DELETE',
        headers: {
          ...headers,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to revoke tenant invite');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in revokeTenantInvite:', error);
    throw error;
  }
};

export const getInviteUsage = async (inviteId, headers) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/tenant-invites/${inviteId}/usage`,
      {
        method: 'GET',
        headers: {
          ...headers,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get invite usage');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in getInviteUsage:', error);
    throw error;
  }
};
