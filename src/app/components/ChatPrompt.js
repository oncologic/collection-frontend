"use client";
import React, { useState, useEffect, useMemo } from "react";
import { marked } from "marked";
import { useAIChat } from "@/app/hooks/useAI";
import { FiSend } from "react-icons/fi";
import { BsThreeDots } from "react-icons/bs";
import { FaUser, FaSearch, FaPlus } from "react-icons/fa";
import ViewAllResourcesModal from "./modals/ViewAllResourcesModal";
import ViewAllEventsModal from "./modals/ViewAllEventsModal";
import { useRouter } from "next/navigation";
import { useContextAuth } from "../context/authContext";
import InputField from "@/app/components/inputs/InputField";
import ResourceChips from "./ResourceChips";

// Helper function for safe localStorage access
const getLocalStorage = () => {
  if (typeof window !== "undefined") {
    return window.localStorage;
  }
  return null;
};

export default function ChatPrompt({
  resources: allResources,
  events: allEvents,
  collections: allCollections,
  setFilteredEvents,
  setFilteredResources,
  setFilteredCollections,
  setCollectionData,
  onChatComplete,
  setAiSummary,
  history,
  collectionData,
}) {
  const [query, setQuery] = useState("");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [lastResources, setLastResources] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [viewAllMode, setViewAllMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const { mutateAsync: sendChatMessage } = useAIChat();
  const [queryType, setQueryType] = useState("resources");
  const [lastEvents, setLastEvents] = useState([]);
  const [showEventsModal, setShowEventsModal] = useState(false);
  const [parsedCollections, setParsedCollections] = useState(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState(null);
  const [customMonths, setCustomMonths] = useState(4);
  // Add new state for collection resource type
  const [collectionResourceType, setCollectionResourceType] = useState("both");

  const [tokenCounts, setTokenCounts] = useState({
    resources: 0,
    events: 0,
    collections: 0,
  });
  const { aiBalance, refetchBalance, customUserData } = useContextAuth();
  const [includeUserInfo, setIncludeUserInfo] = useState(false);
  const [showUserInfoTooltip, setShowUserInfoTooltip] = useState(false);

  const router = useRouter();

  const isBalanceEmpty = aiBalance <= 0;

  const timeframeOptions = [
    { label: "24 Hours", days: 1 },
    { label: "3 Days", days: 3 },
    { label: "1 Week", days: 7 },
    { label: "1 Month", days: 30 },
    { label: "1 Year", days: 365 },
  ];

  // Calculate if we should show the tooltip based on last visit
  const shouldShowTooltip = useMemo(() => {
    const storage = getLocalStorage();
    if (!storage) return false;

    const today = new Date().toISOString().split("T")[0];
    const lastVisit = storage.getItem("lastVisit");
    const currentVisit = storage.getItem("currentVisitDate");
    const hasSeenTooltip = storage.getItem("hasSeenUserInfoTooltip");

    // Check if last visit was more than 100 days ago
    if (lastVisit) {
      const lastVisitDate = new Date(lastVisit);
      const currentDate = new Date();
      const daysDifference = Math.floor(
        (currentDate - lastVisitDate) / (1000 * 60 * 60 * 24)
      );

      if (daysDifference > 100) {
        // Update visit tracking
        storage.setItem("lastVisit", currentVisit || lastVisit);
        storage.setItem("currentVisitDate", today);
        // Reset tooltip seen status
        storage.removeItem("hasSeenUserInfoTooltip");
        return true;
      }
    }

    // Don't show if they've already seen it today
    return !hasSeenTooltip;
  }, []);

  // Update useEffect to use our memoized value
  useEffect(() => {
    setShowUserInfoTooltip(shouldShowTooltip);
  }, [shouldShowTooltip]);

  useEffect(() => {
    const calculateTokens = (data) => {
      if (!data || (Array.isArray(data) && data.length === 0)) return 0;
      return Math.ceil(JSON.stringify(data).length / 4);
    };

    setTokenCounts({
      resources: calculateTokens(allResources),
      events: calculateTokens(allEvents),
      collections: calculateTokens(allCollections),
    });
  }, [allResources, allEvents, allCollections]);

  const extractResourcesFromJSON = (data, shouldCallComplete = true) => {
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
          .replace(
            /("cleanedAnswer"\s*:\s*"[^"]*")(?!\s*,)(\s*"data")/,
            "$1,$2"
          );
        parsedData = JSON.parse(jsonText);
      } else {
        parsedData = data;
      }

      if (!parsedData.data || !Array.isArray(parsedData.data)) {
        throw new Error("Expected a data property that is an array");
      }

      // Extract and set the summary if it exists
      if (parsedData.summaries && setAiSummary) {
        setAiSummary(parsedData.summaries);
      }

      const resourceIds = parsedData.data.map((item) => item.id);
      const filteredResources = allResources.filter((resource) =>
        resourceIds.includes(resource.id)
      );

      if (filteredResources.length > 0) {
        setFilteredResources(filteredResources);

        if (shouldCallComplete && onChatComplete) {
          const userInfo = getUserInfoString();
          const baseCompletionData = {
            prompt: query,
            answer: data.cleanedAnswer || "",
            timestamp: new Date().toISOString(),
            filteredResources: filteredResources,
            ...(userInfo && { userInfo }),
            ...(parsedData.summaries && { summary: parsedData.summaries }),
          };
          onChatComplete(baseCompletionData);
        }
      }
    } catch (error) {
      console.error("Error processing resources data:", error);
      setAnswer("Error processing your request.");
    }
  };

  const extractEventsFromJSON = (data, shouldCallComplete = true) => {
    try {
      if (!data || typeof data !== "object") {
        throw new Error("Invalid data format");
      }

      // Extract and set the cleaned answer if it exists
      if (data.cleanedAnswer) {
        setAnswer(data.cleanedAnswer);
      }

      // Process the events data
      const eventData = Array.isArray(data.data) ? data.data : data;
      if (!Array.isArray(eventData)) {
        throw new Error("Expected data to be an array of objects");
      }

      const processedEventIds = eventData.map((event) => event.id);

      const filteredEvents = allEvents.filter((event) =>
        processedEventIds.includes(event.id)
      );

      if (filteredEvents.length > 0) {
        if (setFilteredEvents) {
          setFilteredEvents(filteredEvents);
        } else {
          setLastEvents(filteredEvents);
          setShowEventsModal(true);
        }

        if (shouldCallComplete && onChatComplete) {
          const userInfo = getUserInfoString();
          const baseCompletionData = {
            prompt: query,
            answer: data.cleanedAnswer || "",
            timestamp: new Date().toISOString(),
            filteredEvents: filteredEvents,
            ...(userInfo && { userInfo }),
          };
          onChatComplete(baseCompletionData);
        }
      }
    } catch (error) {
      console.error("Error processing events data:", error);
      setAnswer("Error processing your request.");
    }
  };

  const extractCollectionsFromJSON = (response, shouldCallComplete = true) => {
    try {
      let parsedResponse;
      if (typeof response === "object" && response !== null) {
        parsedResponse = response;
      } else if (typeof response === "string") {
        const jsonStart = response.indexOf("{");
        const jsonEnd = response.lastIndexOf("}") + 1;
        if (jsonStart === -1 || jsonEnd === 0) {
          setAnswer(response);
          return;
        }
        let jsonText = response.substring(jsonStart, jsonEnd).trim();
        jsonText = jsonText.replace(/[\x00-\x1F\x7F-\x9F]/g, "");

        parsedResponse = JSON.parse(jsonText);
      }

      const cleanedAnswer = parsedResponse.cleanedAnswer || "";
      setAnswer(cleanedAnswer);

      // Extract collection IDs and log them
      const collectionIds = (parsedResponse.data || []).map((item) => {
        return item.collectionId || item.id; // Try both possible ID fields
      });

      // Filter the collections based on the selected resource type
      const matchedCollections = allCollections.filter((collection) => {
        const isMatch = collectionIds.includes(collection.id);

        // If "both" is selected, include all matched collections
        if (collectionResourceType === "both") return isMatch;

        // For "resource" or "external", check if the collection has the right type
        const hasResources =
          collection.resources && collection.resources.length > 0;
        const hasExternalLinks =
          collection.externalLinks && collection.externalLinks.length > 0;

        if (collectionResourceType === "resource" && hasResources)
          return isMatch;
        if (collectionResourceType === "external" && hasExternalLinks)
          return isMatch;

        return false;
      });

      if (matchedCollections.length > 0 && setFilteredCollections) {
        setFilteredCollections(matchedCollections);
      }

      // Make sure to pass both prompt and answer
      if (shouldCallComplete && onChatComplete) {
        const userInfo = getUserInfoString();
        const baseCompletionData = {
          prompt: query,
          answer: cleanedAnswer,
          timestamp: new Date().toISOString(),
          filteredCollections: matchedCollections,
          ...(userInfo && { userInfo }),
        };
        onChatComplete(baseCompletionData);
      }
    } catch (error) {
      console.error("Error processing collections:", error);
      setAnswer("Error processing your request.");
    }
  };

  const getUserInfoString = () => {
    if (!customUserData || !includeUserInfo) return "";

    const parts = [];
    if (customUserData.userRole)
      parts.push(`I am a ${customUserData.userRole}`);
    if (customUserData.designation && customUserData.designation.length > 0)
      parts.push(`my designation is ${customUserData.designation}`);
    if (customUserData.yearOfBirth) {
      const currentYear = new Date().getFullYear();
      const approximateAge = currentYear - customUserData.yearOfBirth;
      parts.push(`my approximate age is ${approximateAge}`);
    }
    if (customUserData.cancerType)
      parts.push(`my cancer type is ${customUserData.cancerType}`);
    if (customUserData.promptContext && customUserData.promptContext.length > 0)
      parts.push(
        `other important context includes ${customUserData.promptContext}`
      );

    // Add timeframe context if selected
    if (selectedTimeframe) {
      parts.push(
        `specifically anything within the last ${selectedTimeframe.label}`
      );
    }

    return parts.length ? `(User context - ${parts.join(", ")})` : "";
  };

  const sendMessage = async () => {
    if (!query.trim()) return;
    const userInfo = getUserInfoString();
    const fullPrompt = userInfo ? `${userInfo} Question: ${query}` : query;
    setPrompt(fullPrompt);
    setIsTyping(true);

    try {
      const response = await sendChatMessage({
        prompt: fullPrompt,
        type: queryType,
        history: history,

        // Add collection resource type to the request when applicable
        ...(queryType === "collections" && { collectionResourceType }),
        // Add duration in days when a timeframe is selected
        ...(selectedTimeframe && { duration: selectedTimeframe.days }),
        collectionData: JSON.stringify(collectionData),
      });

      if (response.content) {
        // Extract summary if it exists
        if (response.content.summaries && setAiSummary) {
          setAiSummary(response.content.summaries);
        }

        // Extract data based on query type without calling onChatComplete
        if (queryType === "collections") {
          extractCollectionsFromJSON(response.content, false);
        } else if (queryType === "events") {
          extractEventsFromJSON(response.content, false);
        } else if (queryType === "resources") {
          extractResourcesFromJSON(response.content, false);
        }

        // Single onChatComplete call here
        if (onChatComplete) {
          const baseCompletionData = {
            prompt: query,
            answer: response.content?.cleanedAnswer || "",
            timestamp: new Date().toISOString(),
            ...(userInfo && { userInfo }),
            ...(response.content?.summaries && {
              summary: response.content.summaries,
            }),
          };
          onChatComplete(baseCompletionData);
        }
      }

      setQuery("");
    } catch (error) {
      setAnswer("There was an error processing your request.");
    } finally {
      setIsTyping(false);
    }
  };

  // Whenever 'parsedCollections' changes, you can filter it here for maximum detail.
  useEffect(() => {
    if (parsedCollections) {
      // Example filtering logic; replace this with your own criteria.
      const updatedCollections = parsedCollections.filter((collection) => {
        // For demonstration: keep all with a 'collectionId' or a 'note.'
        return !!(collection.collectionId || collection.note);
      });
      setFilteredCollections(updatedCollections);
    }
  }, [parsedCollections, setFilteredCollections]);

  // Update the effect to handle automatic selection and visibility
  useEffect(() => {
    const hasResources = allResources?.length > 0;
    const hasEvents = allEvents?.length > 0;
    const hasCollections = allCollections?.length > 0;

    // Add events to the available types array
    const availableTypes = [
      hasResources && "resources",
      hasEvents && "events",
      hasCollections && "collections",
    ].filter(Boolean);

    if (availableTypes.length === 1) {
      setQueryType(availableTypes[0]);
    }
  }, [allResources, allEvents, allCollections]);

  const handleUserInfoClick = () => {
    setIncludeUserInfo(!includeUserInfo);
    if (showUserInfoTooltip) {
      setShowUserInfoTooltip(false);
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem("hasSeenUserInfoTooltip", "true");
      }
    }
  };

  // Add this new component for collection resource type selection
  const CollectionTypeSelector = () => {
    if (queryType !== "collections") return null;

    return (
      <div className="flex gap-2 mt-2 mb-2">
        <button
          onClick={() => setCollectionResourceType("both")}
          className={`px-3 py-1 rounded-full text-xs ${
            collectionResourceType === "both"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setCollectionResourceType("resource")}
          className={`px-3 py-1 rounded-full text-xs ${
            collectionResourceType === "resource"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Resources
        </button>
        <button
          onClick={() => setCollectionResourceType("external")}
          className={`px-3 py-1 rounded-full text-xs ${
            collectionResourceType === "external"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          External Links
        </button>
      </div>
    );
  };

  // Handle month increment/decrement
  const adjustCustomMonths = (increment) => {
    const newValue = customMonths + increment;
    if (newValue > 0) {
      setCustomMonths(newValue);
      setSelectedTimeframe({
        label: `${newValue} Months`,
        days: newValue * 30,
      });
    }
  };

  // Optimized timeframe selector with month adjustment
  const TimeframeSelector = React.memo(() => (
    <div className="flex flex-wrap gap-1.5 mb-2 md:mb-0 md:ml-2">
      {timeframeOptions.map((option) => (
        <button
          key={option.label}
          onClick={() =>
            setSelectedTimeframe(
              selectedTimeframe?.label === option.label ? null : option
            )
          }
          className={`px-2 py-0.5 rounded-full text-xs transition-all duration-200 ${
            selectedTimeframe?.label === option.label
              ? "bg-blue-100 text-blue-700 font-medium"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          {option.label}
        </button>
      ))}

      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-50 text-gray-600">
        <button
          onClick={() => adjustCustomMonths(-1)}
          className="hover:text-blue-700 px-1"
        >
          -
        </button>
        <button
          onClick={() => {
            setSelectedTimeframe({
              label: `${customMonths} Months`,
              days: customMonths * 30,
            });
          }}
          className={`transition-all duration-200 ${
            selectedTimeframe?.label === `${customMonths} Months`
              ? "bg-blue-100 text-blue-700 font-medium px-1 rounded"
              : ""
          }`}
        >
          {customMonths} Months
        </button>
        <button
          onClick={() => adjustCustomMonths(1)}
          className="hover:text-blue-700 px-1"
        >
          +
        </button>
      </div>

      {selectedTimeframe &&
        !timeframeOptions.some(
          (opt) => opt.label === selectedTimeframe.label
        ) &&
        selectedTimeframe.label !== `${customMonths} Months` && (
          <button
            onClick={() => setSelectedTimeframe(null)}
            className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700 font-medium"
          >
            {selectedTimeframe.label} ✕
          </button>
        )}
    </div>
  ));
  TimeframeSelector.displayName = "TimeframeSelector";

  const [showResourceSearch, setShowResourceSearch] = useState(false);
  const [selectedResources, setSelectedResources] = useState(new Set());
  const [resourceSearchTerm, setResourceSearchTerm] = useState("");

  // Mock resources data (replace with your actual resources)

  const filteredResources = allResources?.filter(
    (resource) =>
      resource.name.toLowerCase().includes(resourceSearchTerm.toLowerCase()) ||
      resource.description
        .toLowerCase()
        .includes(resourceSearchTerm.toLowerCase())
  );

  const handleResourceToggle = (resourceId) => {
    setSelectedResources((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId);
      } else {
        newSet.add(resourceId);
      }
      return newSet;
    });
  };

  const [appliedResources, setAppliedResources] = useState([]);

  const handleApplyResources = () => {
    // Find the full resource objects for selected IDs
    const selectedResourceObjects = allResources.filter((resource) =>
      selectedResources.has(resource.id)
    );
    setAppliedResources(selectedResourceObjects);

    // Update collectionData with selected resources
    const updatedCollectionData = {
      ...collectionData,
      resources: Array.from(selectedResources),
    };
    setCollectionData(updatedCollectionData);

    setShowResourceSearch(false);
  };

  return (
    <>
      {/* Desktop version - Updated to match working implementation */}
      <div className="fixed inset-x-0 md:top-0 bottom-0 md:bottom-auto z-30 hidden md:block">
        <div className="max-w-4xl mx-auto px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-50 shadow-lg md:rounded-b-2xl rounded-t-2xl">
          {/* Token display and controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 text-xs text-gray-500">
            {/* Token and credit info */}
            <div className="flex items-center gap-3 mb-2 md:mb-0">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                {(
                  tokenCounts.resources +
                  tokenCounts.events +
                  tokenCounts.collections
                ).toLocaleString()}{" "}
                tokens
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                {aiBalance} credits
              </span>
            </div>

            {/* Timeframe options */}
            <div className="flex flex-wrap gap-1.5 mb-2 md:mb-0 md:ml-2">
              <TimeframeSelector />
            </div>

            {/* Type selector */}
            <div className="flex flex-wrap gap-2 text-xs">
              {allResources?.length > 0 && (
                <button
                  onClick={() => setQueryType("resources")}
                  className={`px-3 py-1 rounded-full transition-all duration-200 ${
                    queryType === "resources"
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Resources
                </button>
              )}
              {allEvents?.length > 0 && (
                <button
                  onClick={() => setQueryType("events")}
                  className={`px-3 py-1 rounded-full transition-all duration-200 ${
                    queryType === "events"
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Events
                </button>
              )}
              {allCollections?.length > 0 && (
                <button
                  onClick={() => setQueryType("collections")}
                  className={`px-3 py-1 rounded-full transition-all duration-200 ${
                    queryType === "collections"
                      ? "bg-blue-100 text-blue-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Collections
                </button>
              )}
            </div>
          </div>

          {/* Add Collection Type Selector */}
          <CollectionTypeSelector />

          {/* Chat input section */}
          <div className="flex items-center gap-2 pb-safe">
            <div className="relative flex-1 flex items-center gap-2">
              <button
                onClick={handleUserInfoClick}
                className={`group relative p-2 rounded-lg transition-all duration-200 ${
                  includeUserInfo
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaUser className="h-5 w-5" />
                {showUserInfoTooltip && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white text-gray-700 text-xs rounded-xl py-2 px-3 shadow-lg">
                    Include your profile info
                  </div>
                )}
              </button>

              {/* Add resource search button */}
              <button
                onClick={() => setShowResourceSearch(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200"
                title="Add resources to search context"
              >
                <FaPlus className="h-5 w-5" />
              </button>

              <InputField
                id="chat-input"
                name="chat-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything about the data..."
                className="w-full block rounded-md border border-gray-200 bg-white shadow-sm placeholder-gray-400 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 transition duration-150 ease-in-out disabled:bg-gray-100 disabled:cursor-not-allowed"
                disabled={isBalanceEmpty}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              />
            </div>
            <button
              type="button"
              onClick={sendMessage}
              disabled={!query.trim() || isBalanceEmpty}
              className="p-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>

          {/* Add ResourceChips component */}
          <ResourceChips
            appliedResources={appliedResources}
            setAppliedResources={setAppliedResources}
            setSelectedResources={setSelectedResources}
          />

          {/* Loading indicator for desktop */}
          {isTyping && (
            <div className="absolute left-1/2 transform -translate-x-1/2 mt-5">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2 rounded-full shadow-lg flex items-center">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile version - premium styling */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-30 h-[60vh] rounded-t-3xl bg-white shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.1)] ">
        {/* Modal header with refined styling */}
        <div className="p-4 border-b border-gray-100 flex flex-col items-center bg-white rounded-t-3xl">
          <div className="w-10 h-1 bg-gray-200 rounded-full mb-4 opacity-80"></div>
          <div className="w-full flex justify-between items-center">
            <h2 className="text-lg font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Chat Assistant
            </h2>
          </div>
        </div>

        {/* Modal content with refined spacing */}
        <div className="flex-1 p-5 overflow-y-auto">
          <div className="space-y-4">
            {/* Loading indicator for mobile */}
            {isTyping && (
              <div className="flex justify-center mb-4">
                <div className="bg-white px-4 py-2 rounded-full shadow-lg flex items-center">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Query type selection for mobile */}
            <div className="flex flex-wrap gap-2 justify-center">
              {allResources?.length > 0 && (
                <button
                  onClick={() => setQueryType("resources")}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                    queryType === "resources"
                      ? "bg-blue-50 text-blue-600 font-medium shadow-sm border border-blue-100"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  Resources
                </button>
              )}
              {allEvents?.length > 0 && (
                <button
                  onClick={() => setQueryType("events")}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                    queryType === "events"
                      ? "bg-blue-50 text-blue-600 font-medium shadow-sm border border-blue-100"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  Events
                </button>
              )}
              {allCollections?.length > 0 && (
                <button
                  onClick={() => setQueryType("collections")}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                    queryType === "collections"
                      ? "bg-blue-50 text-blue-600 font-medium shadow-sm border border-blue-100"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  Collections
                </button>
              )}
            </div>

            {/* Add Collection Type Selector for mobile */}
            {queryType === "collections" && (
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setCollectionResourceType("both")}
                  className={`px-3 py-1 rounded-full text-xs ${
                    collectionResourceType === "both"
                      ? "bg-blue-50 text-blue-600 font-medium shadow-sm border border-blue-100"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setCollectionResourceType("resource")}
                  className={`px-3 py-1 rounded-full text-xs ${
                    collectionResourceType === "resource"
                      ? "bg-blue-50 text-blue-600 font-medium shadow-sm border border-blue-100"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  Resources
                </button>
                <button
                  onClick={() => setCollectionResourceType("external")}
                  className={`px-3 py-1 rounded-full text-xs ${
                    collectionResourceType === "external"
                      ? "bg-blue-50 text-blue-600 font-medium shadow-sm border border-blue-100"
                      : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
                  }`}
                >
                  External Links
                </button>
              </div>
            )}

            {/* Token counts with refined styling */}
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
              <div className="flex items-center gap-3 mb-2 md:mb-0">
                <span className="flex items-center gap-1.5 bg-white py-1 px-2 rounded-full shadow-sm border border-gray-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                  <span className="text-xs font-medium text-gray-700">
                    {(
                      tokenCounts.resources +
                      tokenCounts.events +
                      tokenCounts.collections
                    ).toLocaleString()}{" "}
                    tokens
                  </span>
                </span>
                <span className="flex items-center gap-1.5 bg-white py-1 px-2 rounded-full shadow-sm border border-gray-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                  <span className="text-xs font-medium text-gray-700">
                    {aiBalance} credits
                  </span>
                </span>
              </div>

              {/* Timeframe options with refined styling */}
              <div className="flex flex-wrap gap-1.5">
                <TimeframeSelector />
              </div>
            </div>

            {/* Chat input with refined styling - mobile version */}
            <div className="flex flex-col gap-3 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUserInfoClick}
                  className="relative group p-2"
                >
                  <FaUser
                    className={`h-6 w-6 transition-all duration-200 ${
                      includeUserInfo
                        ? "text-green-600 bg-green-50 rounded-md shadow-sm p-0.5"
                        : "text-gray-400 hover:text-gray-500 p-0.5"
                    }`}
                  />
                  {showUserInfoTooltip && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white text-gray-700 text-xs rounded-xl py-2 px-3 shadow-lg border border-gray-100">
                      Include your profile info
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-white border-r border-b border-gray-100"></div>
                    </div>
                  )}
                </button>

                {/* Add resource search button */}
                <button
                  onClick={() => setShowResourceSearch(true)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                  title="Add resources to search context"
                >
                  <FaPlus className="h-6 w-6 p-0.5" />
                </button>

                <InputField
                  id="chat-input"
                  name="chat-input"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything about the data..."
                  size="small"
                  className="flex-1 !bg-white border border-gray-100 shadow-sm text-[16px] hover:border-gray-200 focus:border-gray-200 transition-colors duration-200 py-3"
                  disabled={isBalanceEmpty}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!query.trim() || isBalanceEmpty}
                className="w-full py-2 rounded-xl bg-blue-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                Submit
              </button>
            </div>

            {/* Add ResourceChips component */}
            <ResourceChips
              appliedResources={appliedResources}
              setAppliedResources={setAppliedResources}
              setSelectedResources={setSelectedResources}
            />
          </div>
        </div>
      </div>

      {/* Resource Search Modal */}
      {showResourceSearch && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Add Resources to Search
                </h3>
                <button
                  onClick={() => setShowResourceSearch(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={resourceSearchTerm}
                  onChange={(e) => setResourceSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
            </div>

            {/* Resource list */}
            <div className="overflow-y-auto max-h-[50vh] p-4">
              {filteredResources?.map((resource) => (
                <div
                  key={resource.id}
                  onClick={() => handleResourceToggle(resource.id)}
                  className={`p-3 mb-2 rounded-lg cursor-pointer transition-colors ${
                    selectedResources.has(resource.id)
                      ? "bg-blue-50 border border-blue-200"
                      : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedResources.has(resource.id)}
                      onChange={() => {}}
                      className="rounded border-gray-300"
                    />
                    <div>
                      <h4 className="font-medium text-sm">{resource.name}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowResourceSearch(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyResources}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply ({selectedResources.size} selected)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
