export const generateDescription = async ({
  prompt,
  currentContent,
  externalContent,
  contextDetails,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate-description/ocr`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          prompt,
          currentContent,
          contextDetails,
          externalContent,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to generate content");
    }

    return response.json();
  } catch (error) {
    console.error("Error generating description:", error);
    throw error;
  }
};

export const generateResourceChat = async ({
  prompt,
  type,
  collectionResourceType,
  duration,
  history,
  collectionData,
  headers,
  data,
  onUpdate,
  disableRAG = false,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/generate-resource-chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          prompt,
          type,
          collectionResourceType,
          duration,
          history,
          collectionData,
          data: {
            ...data,
            // Include the new fields for RAG control and mentioned items
            disableRAG: data?.disableRAG,
            mentionedItems: data?.mentionedItems,
          },
          disableRAG: disableRAG || data?.disableRAG,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to generate chat response: ${response.status}`);
    }

    // Check if we should handle streaming (SSE)
    const contentType = response.headers.get("Content-Type");
    const isSSE = contentType && contentType.includes("text/event-stream");

    // If it's not streaming or onUpdate isn't provided, use the old behavior
    if (!isSSE || !onUpdate) {
      return response.json();
    }

    // Process the stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result = {};

    const processMarkdownWithReferences = (content, references) => {
      // Replace raw IDs with formatted markdown links
      let processedContent = content;

      if (references) {
        // Process different types of references
        const referenceTypes = {
          collections: (id) => ({
            url: `/collections/${id}`,
            icon: "📚",
          }),
          externalLinks: (id) => ({
            url: `/external-links/${id}`,
            icon: "🔗",
          }),
          attachments: (id) => ({
            url: `/external-links/${id}`,
            icon: "📎",
          }),
          notations: (id) => ({
            url: `/external-links/${id}`,
            icon: "✏️",
          }),
        };

        // Replace IDs with formatted links
        Object.entries(references).forEach(([type, items]) => {
          items.forEach((item) => {
            const refConfig = referenceTypes[type]?.(item.id);
            if (refConfig) {
              const linkPattern = new RegExp(
                `\\[([^\\]]+)\\]\\(${item.id}\\)`,
                "g"
              );
              processedContent = processedContent.replace(
                linkPattern,
                `[$1](${refConfig.url}) ${refConfig.icon}`
              );
            }
          });
        });
      }

      return processedContent;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete events in the buffer
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        if (!event.trim()) continue;

        const lines = event.split("\n");
        const eventData = {};

        for (const line of lines) {
          if (line.startsWith("event:")) {
            eventData.type = line.slice(7).trim();
          } else if (line.startsWith("data:")) {
            try {
              const parsedData = JSON.parse(line.slice(5).trim());
              // Process content if it exists and has references
              if (parsedData.content && parsedData.references) {
                parsedData.content = processMarkdownWithReferences(
                  parsedData.content,
                  parsedData.references
                );
              }
              Object.assign(eventData, parsedData);
            } catch (e) {
              eventData.content = line.slice(5).trim();
            }
          }
        }

        if (Object.keys(eventData).length > 0) {
          result = { ...result, ...eventData };
          onUpdate(eventData);
        }
      }
    }

    return result;
  } catch (error) {
    console.error("Error generating chat response:", error);
    throw error;
  }
};

export const fetchCreditBalance = async (token) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/credits/balance`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch credit balance");
  }

  return response.json();
};

export const fetchTransactionHistory = async (token) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/credits/transactions`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch transaction history");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching transaction history:", error);
    throw error;
  }
};

export const addUserCredits = async ({
  amount,
  stripeTransactionId,
  token,
}) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/credits/add`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount, stripeTransactionId }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to add credits");
  }

  return response.json();
};

// Admin Credit Management Functions
export const fetchUserCreditBalance = async (userId, token) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/credits/admin/balance/${userId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch user credit balance");
    }

    return response.json();
  } catch (error) {
    console.error("Error fetching user credit balance:", error);
    throw error;
  }
};

export const addCreditsToUser = async ({
  userId,
  amount,
  description,
  token,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/credits/admin/add/${userId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, description }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to add credits to user");
    }

    return response.json();
  } catch (error) {
    console.error("Error adding credits to user:", error);
    throw error;
  }
};

export const searchContent = async ({ searchQuery, timeframe, headers }) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ searchQuery, timeframe }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to search content");
    }

    return response.json();
  } catch (error) {
    console.error("Error searching content:", error);
    throw error;
  }
};

export const processImageOCR = async ({ imageUrl, prompt, headers }) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/process-image`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({ imageUrl, prompt }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to process image");
    }

    return response.json();
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
};

export const createPaymentIntent = async ({ packageId, token }) => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/credits/create-payment-intent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        packageId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create payment intent");
  }

  return response.json();
};

export const previewStructuredNotations = async ({
  prompt,
  externalLinkId,
  collectionId,
  contextDetails,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/preview-structured-notations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          prompt,
          externalLinkId,
          collectionId,
          contextDetails,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to preview structured notations");
    }

    return response.json();
  } catch (error) {
    console.error("Error previewing structured notations:", error);
    throw error;
  }
};

export const confirmStructuredNotations = async ({
  notations,
  externalLinkId,
  collectionId,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/confirm-structured-notations`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          notations,
          externalLinkId,
          collectionId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to create structured notations");
    }

    return response.json();
  } catch (error) {
    console.error("Error creating structured notations:", error);
    throw error;
  }
};

// New bulk update functions
export const previewBulkNotationUpdates = async ({
  prompt,
  existingNotations,
  externalLinkId,
  collectionId,
  contextDetails,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/preview-bulk-notation-updates`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          prompt,
          existingNotations,
          externalLinkId,
          collectionId,
          contextDetails,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to preview bulk notation updates");
    }

    return response.json();
  } catch (error) {
    console.error("Error previewing bulk notation updates:", error);
    throw error;
  }
};

export const confirmBulkNotationUpdates = async ({
  updates,
  externalLinkId,
  collectionId,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/confirm-bulk-notation-updates`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          updates,
          externalLinkId,
          collectionId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to confirm bulk notation updates");
    }

    return response.json();
  } catch (error) {
    console.error("Error confirming bulk notation updates:", error);
    throw error;
  }
};

export const previewStructuredEvents = async ({
  prompt,
  metadata,
  organizationId,
  organizationIds,
  tenantId,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/preview-structured-events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          prompt,
          metadata,
          organizationId,
          organizationIds,
          tenantId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to preview structured events");
    }

    return response.json();
  } catch (error) {
    console.error("Error previewing structured events:", error);
    throw error;
  }
};

export const confirmStructuredEvents = async ({
  events,
  newOrganizations = [],
  organizationId,
  organizationIds,
  tenantId,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/confirm-structured-events`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          events,
          newOrganizations,
          organizationId,
          organizationIds,
          tenantId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to confirm structured events");
    }

    return response.json();
  } catch (error) {
    console.error("Error confirming structured events:", error);
    throw error;
  }
};

export const previewStructuredResources = async ({
  prompt,
  metadata,
  organizationId,
  organizationIds,
  tenantId,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/preview-structured-resources`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          prompt,
          metadata,
          organizationId,
          organizationIds,
          tenantId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to preview structured resources");
    }

    return response.json();
  } catch (error) {
    console.error("Error previewing structured resources:", error);
    throw error;
  }
};

export const confirmStructuredResources = async ({
  resources,
  newOrganizations = [],
  organizationId,
  organizationIds,
  tenantId,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/confirm-structured-resources`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          resources,
          newOrganizations,
          organizationId,
          organizationIds,
          tenantId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to confirm structured resources");
    }

    return response.json();
  } catch (error) {
    console.error("Error confirming structured resources:", error);
    throw error;
  }
};

export const previewStructuredExternalLinks = async ({
  prompt,
  metadata,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/preview-structured-external-links`,
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
      throw new Error("Failed to preview structured external links");
    }

    return response.json();
  } catch (error) {
    console.error("Error previewing structured external links:", error);
    throw error;
  }
};

export const confirmStructuredExternalLinks = async ({
  externalLinks,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/confirm-structured-external-links`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          externalLinks,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to confirm structured external links");
    }

    return response.json();
  } catch (error) {
    console.error("Error confirming structured external links:", error);
    throw error;
  }
};

export const previewStructuredOpportunities = async ({
  prompt,
  metadata,
  organizationId,
  organizationIds,
  tenantId,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/preview-structured-opportunities`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          prompt,
          metadata,
          organizationId,
          organizationIds,
          tenantId,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to preview structured opportunities");
    }

    return response.json();
  } catch (error) {
    console.error("Error previewing structured opportunities:", error);
    throw error;
  }
};

export const confirmStructuredOpportunities = async ({
  opportunity,
  newOrganizations = [],
  organizationIds,
  headers,
}) => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/ai/confirm-structured-opportunities`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          opportunity,
          newOrganizations,
          organizationIds,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to confirm structured opportunities");
    }

    return response.json();
  } catch (error) {
    console.error("Error confirming structured opportunities:", error);
    throw error;
  }
};
