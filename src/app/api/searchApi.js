export async function searchGlobal(searchQuery, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/search`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ searchQuery }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Search failed");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error performing global search:", error);
    throw error;
  }
}

export async function fetchOrganizations(headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/organizations`,
      {
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch organizations");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching organizations:", error);
    throw error;
  }
}