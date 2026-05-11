/**
 * Extracts and processes resource data from JSON response
 * @param {Object|string} data - The response data to process
 * @param {Object} options - Configuration options
 * @returns {Object} Processed data and resources
 */
export const extractResourcesFromJSON = (data, options = {}) => {
  const { allResources } = options;

  try {
    let parsedData;
    if (typeof data === "string") {
      const jsonStart = data.indexOf("{");
      const jsonEnd = data.lastIndexOf("}") + 1;
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("Invalid JSON structure");
      }
      let jsonText = data.slice(jsonStart, jsonEnd);
      jsonText = jsonText
        .replace(/[\x00-\x1F\x7F-\x9F]/g, "")
        .replace(/\t/g, " ")
        .replace(/("cleanedAnswer"\s*:\s*"[^"]*")(?!\s*,)(\s*"data")/, "$1,$2");
      parsedData = JSON.parse(jsonText);
    } else {
      parsedData = data;
    }

    if (!parsedData.data || !Array.isArray(parsedData.data)) {
      throw new Error("Expected a data property that is an array");
    }

    const resourceIds = parsedData.data.map((item) => item.id);
    const filteredResources = allResources.filter((resource) =>
      resourceIds.includes(resource.id)
    );

    return {
      resources: filteredResources,
      summaries: parsedData.summaries,
      cleanedAnswer: parsedData.cleanedAnswer || "",
      success: true,
    };
  } catch (error) {
    console.error("Error processing resources data:", error);
    return {
      resources: [],
      summaries: null,
      cleanedAnswer: "Error processing your request.",
      success: false,
      error,
    };
  }
};

/**
 * Extracts and processes event data from JSON response
 * @param {Object|string} data - The response data to process
 * @param {Object} options - Configuration options
 * @returns {Object} Processed data and events
 */
export const extractEventsFromJSON = (data, options = {}) => {
  const { allEvents } = options;

  try {
    if (!data || typeof data !== "object") {
      throw new Error("Invalid data format");
    }

    const eventData = Array.isArray(data.data) ? data.data : data;
    if (!Array.isArray(eventData)) {
      throw new Error("Expected data to be an array of objects");
    }

    const processedEventIds = eventData.map((event) => event.id);
    const filteredEvents = allEvents.filter((event) =>
      processedEventIds.includes(event.id)
    );

    return {
      events: filteredEvents,
      cleanedAnswer: data.cleanedAnswer || "",
      success: true,
    };
  } catch (error) {
    console.error("Error processing events data:", error);
    return {
      events: [],
      cleanedAnswer: "Error processing your request.",
      success: false,
      error,
    };
  }
};

/**
 * Extracts and processes collection data from JSON response
 * @param {Object|string} response - The response data to process
 * @param {Object} options - Configuration options
 * @returns {Object} Processed data and collections
 */
export const extractCollectionsFromJSON = (response, options = {}) => {
  const { allCollections, resourceType = "both" } = options;

  try {
    let parsedResponse;
    if (typeof response === "object" && response !== null) {
      parsedResponse = response;
    } else if (typeof response === "string") {
      const jsonStart = response.indexOf("{");
      const jsonEnd = response.lastIndexOf("}") + 1;
      if (jsonStart === -1 || jsonEnd === 0) {
        return {
          collections: [],
          cleanedAnswer: response,
          success: true,
        };
      }
      let jsonText = response.substring(jsonStart, jsonEnd).trim();
      jsonText = jsonText.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
      parsedResponse = JSON.parse(jsonText);
    }

    const collectionIds = (parsedResponse.data || []).map(
      (item) => item.collectionId || item.id
    );

    const matchedCollections = allCollections.filter((collection) => {
      const isMatch = collectionIds.includes(collection.id);

      if (resourceType === "both") return isMatch;

      const hasResources = collection.resources?.length > 0;
      const hasExternalLinks = collection.externalLinks?.length > 0;

      if (resourceType === "resource" && hasResources) return isMatch;
      if (resourceType === "external" && hasExternalLinks) return isMatch;

      return false;
    });

    return {
      collections: matchedCollections,
      cleanedAnswer: parsedResponse.cleanedAnswer || "",
      success: true,
    };
  } catch (error) {
    console.error("Error processing collections:", error);
    return {
      collections: [],
      cleanedAnswer: "Error processing your request.",
      success: false,
      error,
    };
  }
};

export const getUserInfoString = (customUserData, includeUserInfo = false) => {
  if (!customUserData || !includeUserInfo) return "";

  const parts = [];
  if (customUserData.userRole) parts.push(`I am a ${customUserData.userRole}`);
  if (customUserData.designation)
    parts.push(`my designation is ${customUserData.designation}`);
  if (customUserData.yearOfBirth) {
    const currentYear = new Date().getFullYear();
    const approximateAge = currentYear - customUserData.yearOfBirth;
    parts.push(`my approximate age is ${approximateAge}`);
  }
  if (customUserData.cancerType)
    parts.push(`my cancer type is ${customUserData.cancerType}`);
  if (customUserData.promptContext)
    parts.push(
      `other important context includes ${customUserData.promptContext}`
    );

  return parts.length ? `(User context - ${parts.join(", ")})` : "";
};

export const estimateTokenCount = (text) => {
  return Math.ceil(text.length / 4);
};

export const calculateCredits = (tokens) => {
  if (tokens > 900000) return 0; // Invalid
  if (tokens > 800000) return 3;
  if (tokens > 20000) return 2;
  return 1;
};
