const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Get opportunities with filters
export const fetchOpportunities = async ({
  isVolunteer,
  isRemote,
  frequency,
  organizationId,
  availableOnly,
  showPast,
  sortBy = 'newest',
  limit = 50,
  offset = 0,
  headers = {},
}) => {
  const params = new URLSearchParams();

  if (isVolunteer !== undefined) params.append('isVolunteer', isVolunteer);
  if (isRemote !== undefined) params.append('isRemote', isRemote);
  if (frequency) params.append('frequency', frequency);
  if (organizationId) params.append('organizationId', organizationId);
  if (availableOnly) params.append('availableOnly', availableOnly);
  if (showPast) params.append('showPast', showPast);
  params.append('sortBy', sortBy);
  params.append('limit', limit);
  params.append('offset', offset);

  const response = await fetch(`${API_URL}/api/opportunities?${params}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch opportunities');
  }

  return response.json();
};

// Get a single opportunity by ID
export const fetchOpportunityById = async ({ opportunityId, token, headers = {} }) => {
  const response = await fetch(`${API_URL}/api/opportunities/${opportunityId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch opportunity');
  }

  return response.json();
};

// Create a new opportunity
export const createOpportunity = async ({ data, token, headers = {} }) => {
  const response = await fetch(`${API_URL}/api/opportunities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create opportunity');
  }

  return response.json();
};

// Update an opportunity
export const updateOpportunity = async ({ id, data, token, headers = {} }) => {
  const response = await fetch(`${API_URL}/api/opportunities/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update opportunity');
  }

  return response.json();
};

// Apply to an opportunity
export const applyToOpportunity = async ({
  opportunityId,
  applicationData,
  token = null,
  headers = {}
}) => {
  const requestHeaders = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Only add Authorization header if token is provided (for authenticated users)
  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/opportunities/${opportunityId}/apply`, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(applicationData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to apply to opportunity');
  }

  return response.json();
};

// Get user's applications
export const fetchUserApplications = async ({ token, headers = {} }) => {
  const response = await fetch(`${API_URL}/api/opportunities/applications`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...headers,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch applications');
  }

  return response.json();
};

// Review an application (for advocates)
export const reviewApplication = async ({
  applicationId,
  reviewData,
  token,
  headers = {}
}) => {
  const response = await fetch(
    `${API_URL}/api/opportunities/applications/${applicationId}/review`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...headers,
      },
      body: JSON.stringify(reviewData),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to review application');
  }

  return response.json();
};

// Delete an application
export const deleteApplication = async ({
  applicationId,
  token,
  headers = {}
}) => {
  const response = await fetch(
    `${API_URL}/api/opportunities/applications/${applicationId}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete application');
  }

  return response.json();
};

// Save/bookmark an opportunity
export const saveOpportunity = async ({ opportunityId, token, headers = {} }) => {
  const response = await fetch(
    `${API_URL}/api/opportunities/${opportunityId}/save`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save opportunity');
  }

  return response.json();
};

// Unsave an opportunity
export const unsaveOpportunity = async ({ opportunityId, token, headers = {} }) => {
  const response = await fetch(
    `${API_URL}/api/opportunities/${opportunityId}/save`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to unsave opportunity');
  }

  return response.json();
};

// Send a message about an opportunity
export const sendOpportunityMessage = async ({
  messageData,
  token,
  headers = {}
}) => {
  const response = await fetch(`${API_URL}/api/opportunities/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    body: JSON.stringify(messageData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send message');
  }

  return response.json();
};

// Get messages for an opportunity or application
export const fetchOpportunityMessages = async ({
  opportunityId,
  applicationId,
  token,
  headers = {}
}) => {
  const params = new URLSearchParams();
  if (opportunityId) params.append('opportunityId', opportunityId);
  if (applicationId) params.append('applicationId', applicationId);

  const response = await fetch(
    `${API_URL}/api/opportunities/messages?${params}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch messages');
  }

  return response.json();
};

// Get applications for an opportunity (for opportunity creators)
export const fetchOpportunityApplications = async ({
  opportunityId,
  token,
  headers = {}
}) => {
  const response = await fetch(
    `${API_URL}/api/opportunities/${opportunityId}/applications`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch opportunity applications');
  }

  return response.json();
};