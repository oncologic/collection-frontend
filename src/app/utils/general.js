import { DateTime } from "luxon";
export const geocodeAddress = async (address, city) => {
  const fullAddress = `${address}, ${city}`;
  const encodedAddress = encodeURIComponent(fullAddress);

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.results && data.results[0]) {
      const { lat, lng } = data.results[0].geometry.location;
      return { latitude: lat, longitude: lng };
    }
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
};

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * (Math.PI / 180);
}

export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    );
    const data = await response.json();

    if (data.results && data.results[0]) {
      return {
        address: data.results[0].formatted_address,
        // You can also get specific components if needed
        addressComponents: data.results[0].address_components,
      };
    }
    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
};

export const getCoordinatesFromZipCode = async (zipCode) => {
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);

    if (!response.ok) {
      throw new Error("Invalid ZIP code");
    }

    const data = await response.json();
    return {
      lat: parseFloat(data.places[0].latitude),
      lng: parseFloat(data.places[0].longitude),
    };
  } catch (error) {
    throw new Error("Invalid ZIP code or service unavailable");
  }
};

export const convertToUTC = (date, time, timezone) => {
  const localDateTime = `${date}T${time}`;
  return new Date(
    new Date(localDateTime).toLocaleString("en-US", {
      timeZone: timezone,
    })
  );
};

export const convertToLocalTime = (utcDate, timezone) => {
  return new Date(utcDate).toLocaleString("en-US", {
    timeZone: timezone,
  });
};

export const convertUTCToDateTimeInputs = (utcDateString, timezone) => {
  if (!utcDateString) return { date: "", time: "" };

  const date = new Date(utcDateString);

  // Format date as YYYY-MM-DD
  const localDate = date.toLocaleDateString("en-CA", { timeZone: timezone });

  // Format time as HH:mm
  const localTime = date.toLocaleTimeString("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: undefined,
  });

  return { date: localDate, time: localTime };
};

export const calculateEventDuration = (startDate, endDate) => {
  const diff = endDate.diff(startDate, ["days", "hours", "minutes"]);

  // If dates are on different calendar days
  if (startDate.toFormat("yyyy-MM-dd") !== endDate.toFormat("yyyy-MM-dd")) {
    const calendarDays = Math.ceil(endDate.diff(startDate, "days").days);
    return `${calendarDays} day${calendarDays !== 1 ? "s" : ""}`;
  }

  // If same calendar day but duration is 14 hours or more
  if (diff.hours >= 14) {
    return "1 day";
  }

  // If same day and less than 14 hours, show hours and minutes
  const parts = [];
  if (diff.hours > 0) {
    parts.push(`${diff.hours} hour${diff.hours !== 1 ? "s" : ""}`);
  }
  if (diff.minutes > 0) {
    parts.push(`${diff.minutes} minute${diff.minutes !== 1 ? "s" : ""}`);
  }

  return parts.join(" ");
};

export const getSurveyTypeById = (surveyTypeId) => {
  const surveyTypes = {
    1: {
      id: 1,
      name: "Registry",
      description: "Patient registry and data collection surveys",
    },
    2: {
      id: 2,
      name: "Educational",
      description:
        "Surveys focused on educational content and learning outcomes",
    },
    3: {
      id: 3,
      name: "Industry",
      description: "Industry-sponsored research surveys",
    },
    4: {
      id: 4,
      name: "Demographic",
      description: "Population and demographic data collection",
    },
    5: {
      id: 5,
      name: "Foundation",
      description: "Foundation-sponsored research surveys",
    },
    6: {
      id: 6,
      name: "Lifestyle",
      description: "Quality of life and lifestyle assessment surveys",
    },
  };

  return (
    surveyTypes[surveyTypeId] || {
      id: surveyTypeId,
      name: "Other",
      description: "Survey type not specified",
    }
  );
};

/**
 * Extract JSON objects embedded within a string.
 *
 * This function scans a given text and returns an array of JSON objects it finds.
 * It uses a simple stack counter to determine the boundaries of potential JSON objects
 * and handles string quotes and escape characters to avoid false triggers.
 *
 * @param {string} text - The input text that may contain JSON blocks.
 * @returns {Array<object>} - Array of parsed JSON objects.
 */
export const extractJsonObjects = (text) => {
  const results = [];
  let braceCount = 0;
  let startIndex = -1;
  let inString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escape) {
        escape = false;
      } else if (char === "\\") {
        escape = true;
      } else if (char === '"') {
        inString = false;
      }
    } else {
      if (char === '"') {
        inString = true;
      } else if (char === "{") {
        if (braceCount === 0) {
          startIndex = i;
        }
        braceCount++;
      } else if (char === "}") {
        braceCount--;
        if (braceCount === 0 && startIndex !== -1) {
          let jsonText = text.slice(startIndex, i + 1);
          // Sanitize the JSON text by removing control characters
          jsonText = jsonText.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
          try {
            const parsed = JSON.parse(jsonText);
            results.push(parsed);
          } catch (error) {
            console.error("Error parsing extracted JSON:", error);
          }
          startIndex = -1;
        }
      }
    }
  }

  return results;
};

export const isYoutubeUrl = (url) => {
  return url?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/);
};

export const formatLongDate = (dateString) => {
  if (!dateString) return "";

  // Extract date part and parse components directly to avoid timezone issues
  const datePart = dateString.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);

  // Create date in local timezone to avoid UTC conversion issues
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "short" });
  const monthFormatted = month.toString().padStart(2, "0");
  const dayFormatted = day.toString().padStart(2, "0");
  const yearShort = year.toString().slice(-2);

  return `${dayOfWeek}, ${monthFormatted}/${dayFormatted}/${yearShort}`;
};

const formatCompactDate = (dateString) => {
  const normalizedDate = normalizeDateInputValue(dateString);
  if (!normalizedDate) return "";

  const [year, month, day] = normalizedDate.split("-").map(Number);

  return `${month}/${day}/${year.toString().slice(-2)}`;
};

export const formatLongDateRange = (startDate, endDate) => {
  const normalizedStart = normalizeDateInputValue(startDate);
  const normalizedEnd = normalizeDateInputValue(endDate || startDate);

  if (!normalizedStart) return "";
  if (!normalizedEnd || normalizedStart === normalizedEnd) {
    return formatCompactDate(normalizedStart);
  }

  return `${formatCompactDate(normalizedStart)} - ${formatCompactDate(
    normalizedEnd
  )}`;
};

export const parseTimestamps = (description) => {
  if (!description) return [];

  // Get the content after "Timestamps" (case insensitive)
  const timestampSection = description.split(/timestamps:?\n*/i)[1]?.trim();

  if (!timestampSection) return [];

  // Split into lines and filter out empty lines
  const lines = timestampSection
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      try {
        // Match pattern: "Topic at: MM:SS" or "Topic (text) at: MM:SS"
        const match = line.match(/(.+?)(?:\s+at:\s*)(\d+):(\d+)\\?$/);
        if (!match) return null;

        const [_, title, minutes, seconds] = match;
        const mins = parseInt(minutes);
        const secs = parseInt(seconds);

        // Validate time values
        if (isNaN(mins) || isNaN(secs) || secs >= 60) {
          return null;
        }

        const totalSeconds = mins * 60 + secs;

        return {
          title: title.trim(),
          timestamp: totalSeconds,
          formattedTime: `${mins}:${secs.toString().padStart(2, "0")}`,
        };
      } catch (error) {
        console.warn("Error parsing timestamp:", error);
        return null;
      }
    })
    .filter(Boolean); // Remove any null entries
};

export const formatDateString = (dateString) => {
  if (!dateString) return "";
  const datePart = dateString.split("T")[0];
  const [year, month, day] = datePart.split("-");
  return `${month}/${day}/${year}`;
};

export const formatDateStringShort = (dateString) => {
  if (!dateString) return "";
  const datePart = dateString.split("T")[0];
  const [year, month, day] = datePart.split("-");
  return `${month}/${day}/${year.slice(-2)}`;
};

export const normalizeDateInputValue = (value) => {
  if (!value) return "";
  return String(value).split("T")[0];
};

export const getTodayDateInputValue = () => DateTime.local().toISODate() || "";

export const getDateRangeValues = (value = {}) => {
  const startDate = normalizeDateInputValue(
    value.startDate || value.start_date || value.date
  );
  const endDate = normalizeDateInputValue(
    value.endDate || value.end_date || startDate
  );

  return {
    startDate,
    endDate: endDate || startDate,
  };
};

export const formatDateRangeShort = (startDate, endDate) => {
  const normalizedStart = normalizeDateInputValue(startDate);
  const normalizedEnd = normalizeDateInputValue(endDate || startDate);

  if (!normalizedStart) return "";
  if (!normalizedEnd || normalizedStart === normalizedEnd) {
    return formatDateStringShort(normalizedStart);
  }

  return `${formatDateStringShort(normalizedStart)} - ${formatDateStringShort(
    normalizedEnd
  )}`;
};

export const formatDayOfWeekRange = (startDate, endDate) => {
  const normalizedStart = normalizeDateInputValue(startDate);
  const normalizedEnd = normalizeDateInputValue(endDate || startDate);

  if (!normalizedStart) return "";
  if (!normalizedEnd || normalizedStart === normalizedEnd) {
    return formatDayOfWeek(normalizedStart);
  }

  return `${formatDayOfWeek(normalizedStart)}-${formatDayOfWeek(normalizedEnd)}`;
};

export const formatDayOfWeek = (dateString) => {
  if (!dateString) return "";

  // Extract date part and parse components directly to avoid timezone issues
  const datePart = dateString.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);

  // Create date in local timezone to avoid UTC conversion issues
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { weekday: "short" });
};
