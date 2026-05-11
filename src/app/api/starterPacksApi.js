const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const fetchStarterPacks = async (token) => {
  const response = await fetch(`${API_URL}/api/starter-packs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch starter packs");
  }

  return response.json();
};

export const fetchStarterPackById = async (id, token) => {
  const response = await fetch(`${API_URL}/api/starter-packs/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch starter pack");
  }

  return response.json();
};

export const createStarterPack = async (data, token) => {
  const response = await fetch(`${API_URL}/api/starter-packs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create starter pack");
  }

  return response.json();
};

export const updateStarterPack = async (id, data, token) => {
  const response = await fetch(`${API_URL}/api/starter-packs/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update starter pack");
  }

  return response.json();
};

export const deleteStarterPack = async (id, token) => {
  const response = await fetch(`${API_URL}/api/starter-packs/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to delete starter pack");
  }

  return response.json();
};
