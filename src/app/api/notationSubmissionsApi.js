// API functions for managing external notation submissions (approval workflow)

// Get all pending submissions for an external link
export async function getNotationSubmissions(externalLinkId, headers, status = 'pending') {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notation-templates/external-links/${externalLinkId}/submissions?approvalStatus=${status}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch notation submissions");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching notation submissions:", error);
    throw error;
  }
}

// Approve a submission (converts it to a regular notation)
export async function approveNotationSubmission(submissionId, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notation-templates/notation-submissions/${submissionId}/approve`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to approve submission");
    }

    return await response.json();
  } catch (error) {
    console.error("Error approving submission:", error);
    throw error;
  }
}

// Reject a submission
export async function rejectNotationSubmission(submissionId, reviewNotes, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notation-templates/notation-submissions/${submissionId}/reject`,
      {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reviewNotes }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to reject submission");
    }

    return await response.json();
  } catch (error) {
    console.error("Error rejecting submission:", error);
    throw error;
  }
}

// Get submission details
export async function getNotationSubmission(submissionId, headers) {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/notation-submissions/${submissionId}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch submission details");
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching submission details:", error);
    throw error;
  }
}