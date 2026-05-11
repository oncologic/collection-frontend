export async function fetchEventById(id, headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/events/${id}`,
      {
        headers,
      }
    );

    if (!response.ok) {
      // Return an error object instead of throwing
      return {
        error: true,
        status: response.status,
        message:
          response.status === 404 ? "Event not found" : "Failed to fetch event",
      };
    }

    const data = await response.json();
    return { data, error: false };
  } catch (error) {
    console.error("Error fetching event:", error);
    return {
      error: true,
      message: "Error fetching event",
      details: error.message,
    };
  }
}

export async function fetchEvents(token, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/events`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...headers,
        },
      }
    );
    const data = await response.json();
    return data.length > 0 ? data : [];
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

export async function fetchEventsPaginated(token, headers, params = {}) {
  try {
    const queryParams = new URLSearchParams({
      page: params.page || 1,
      limit: params.limit || 20,
      sortBy: params.sortBy || 'startDate',
      sortOrder: params.sortOrder || 'desc',
      ...(params.filterDate && { filterDate: params.filterDate }),
      ...(params.filterStartDate && { filterStartDate: params.filterStartDate }),
      ...(params.filterEndDate && { filterEndDate: params.filterEndDate })
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/events/paginated?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...headers,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching paginated events:", error);
    throw error;
  }
}

export async function fetchEventsForSubscriptions(token, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/events/subscriptions`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...headers,
        },
      }
    );
    const data = await response.json();
    return data.length > 0 ? data : [];
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

export async function updateEvent(id, event, headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/events/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(event),
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to update event");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating event:", error);
    throw error;
  }
}

export async function fetchEventSponsorships(id) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/sponsorships/events/${id}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
}

export async function submitSponsorshipInquiry(formData) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + "/api/email/sponsorship-inquiry",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to submit sponsorship inquiry");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error submitting sponsorship inquiry:", error);
    throw error;
  }
}

export async function deleteEvent(id, token, headers) {
  try {
    const url = process.env.NEXT_PUBLIC_API_URL + `/api/events/${id}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...headers,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete event");
    }
    return response;
  } catch (error) {
    console.error("Error deleting event:", error);
    throw error;
  }
}

export async function searchEvents(token, headers, searchQuery, limit = 50) {
  try {
    const queryParams = new URLSearchParams({
      query: searchQuery,
      limit: limit,
      includeAll: true
    });

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/events/search?${queryParams}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          ...headers,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error('Failed to search events');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching events:", error);
    throw error;
  }
}

export async function bulkCreateEvents(token, headers, events) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/events/bulk`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...headers,
        },
        body: JSON.stringify({ events }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to bulk import events");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error bulk creating events:", error);
    throw error;
  }
}
