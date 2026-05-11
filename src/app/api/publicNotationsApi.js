// Public API functions for notation submissions (no auth required)

export async function submitPublicNotation(
  externalLinkId,
  notationData,
  submissionToken = notationData?.submissionToken,
  collectionId = notationData?.collectionId
) {
  try {
    // Using the correct backend endpoint for public notation submission
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notation-templates/external-links/${externalLinkId}/submit-notation`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(submissionToken
            ? { "x-submission-token": submissionToken }
            : {}),
        },
        body: JSON.stringify({
          ...notationData,
          ...(submissionToken ? { submissionToken } : {}),
          ...(collectionId ? { collectionId } : {}),
        }),
      }
    );

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Backend returned non-JSON response. Status:", response.status);
      console.error("URL:", `${process.env.NEXT_PUBLIC_API_URL}/api/collections/public/external-link/${externalLinkId}/notation`);
      
      // Try to get the text content for debugging
      const text = await response.text();
      console.error("Response text:", text.substring(0, 200));
      
      throw new Error("Server returned an invalid response. The endpoint may not exist.");
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to submit notation");
    }

    return await response.json();
  } catch (error) {
    console.error("Error submitting public notation:", error);
    throw error;
  }
}
