export async function pinItems(items, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/pinned`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to pin items");
    }

    return response.json();
  } catch (error) {
    console.error("Error pinning items:", error);
    throw error;
  }
}

export async function unpinItems(itemIds, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/pinned`,
      {
        method: "DELETE",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ itemIds }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to unpin items");
    }

    return response.json();
  } catch (error) {
    console.error("Error unpinning items:", error);
    throw error;
  }
}

export async function getPinnedItems(headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/pinned`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to fetch pinned items");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching pinned items:", error);
    throw error;
  }
}

export async function updatePinnedItemOrder(itemId, orderPosition, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/pinned/${itemId}/order`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderPosition }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update pinned item order");
    }

    return response.json();
  } catch (error) {
    console.error("Error updating pinned item order:", error);
    throw error;
  }
}
