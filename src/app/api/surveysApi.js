export async function fetchSurveyById(id, headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/surveys/${id}`,
      {
        headers,
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching survey:", error);
    throw error;
  }
}
export async function updateSurvey(id, survey, headers) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/surveys/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(survey),
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
      }
    );
    if (!response.ok) {
      throw new Error("Failed to update survey");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating survey:", error);
    throw error;
  }
}
export async function deleteSurvey(id, token) {
  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + `/api/surveys/${id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete survey");
    }

    return response.json();
  } catch (error) {
    console.error("Error deleting survey:", error);
    throw error;
  }
}
