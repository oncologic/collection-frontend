export const previewStructuredSocialMediaAccounts = async ({
  prompt,
  metadata,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/preview-structured-social-media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          prompt,
          metadata,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to preview structured social media accounts");
    }

    return response.json();
  } catch (error) {
    console.error("Error previewing structured social media accounts:", error);
    throw error;
  }
};

export const confirmStructuredSocialMediaAccounts = async ({
  accounts,
  associations,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/confirm-structured-social-media`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          accounts,
          associations,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to confirm structured social media accounts");
    }

    return response.json();
  } catch (error) {
    console.error("Error confirming structured social media accounts:", error);
    throw error;
  }
};