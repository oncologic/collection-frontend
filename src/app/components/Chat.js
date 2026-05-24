"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaUser,
  FaPlus,
  FaTimes,
  FaDollarSign,
  FaExclamationCircle,
} from "react-icons/fa";
import { FiSend } from "react-icons/fi";
import InputField from "@/app/components/inputs/InputField";
import { useContextAuth } from "../context/authContext";
import { usePublicAuth } from "../hooks/usePublicAuth";
import { getUserInfoString, estimateTokenCount } from "../utils/jsonExtractors";
import SearchModal from "./SearchModal";
import { useAIChat } from "../hooks/useAI";
import CreditEstimator from "./CreditEstimator";
import toast from "react-hot-toast";

const Chat = ({
  history,
  onChatComplete,
  resources = [],
  externalLinks = [],
  events = [],
  collections = [],
  setIsChatVisible,
}) => {
  const [query, setQuery] = useState("");
  const [includeUserInfo, setIncludeUserInfo] = useState(false);
  const [showUserInfoTooltip, setShowUserInfoTooltip] = useState(false);
  const [showResourceSearch, setShowResourceSearch] = useState(false);
  const authContext = useContextAuth();
  const publicAuth = usePublicAuth();
  // Use public auth if not signed in, otherwise use context auth
  const customUserData =
    authContext?.customUserData || publicAuth?.userDetails || null;
  const [selectedResources, setSelectedResources] = useState([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const { mutateAsync: sendChatMessage } = useAIChat();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showCreditEstimator, setShowCreditEstimator] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [largeResources, setLargeResources] = useState([]);
  const hasAutoQuickAddedRef = useRef(false);

  const handleUserInfoClick = () => {
    setIncludeUserInfo(!includeUserInfo);
    if (showUserInfoTooltip) {
      setShowUserInfoTooltip(false);
      localStorage.setItem("hasSeenUserInfoTooltip", "true");
    }
  };

  const handleResourceSelect = (resource) => {
    setSelectedResources((prev) => [
      ...prev,
      {
        ...resource,
      },
    ]);
    setTotalTokens(estimateTokenCount(JSON.stringify(selectedResources)));
  };

  const removeResource = (resourceId) => {
    setSelectedResources((prev) =>
      prev.filter((resource) => resource.id !== resourceId)
    );
  };

  const hasQuickAddResources =
    resources.length > 0 ||
    externalLinks.length > 0 ||
    events.length > 0 ||
    collections.length > 0;

  const handleQuickAdd = useCallback((items, type) => {
    const TOKEN_LIMIT = 900000;

    const { safe, large } = items.reduce(
      (acc, item) => {
        const tokenCount = estimateTokenCount(JSON.stringify(item));
        if (tokenCount > TOKEN_LIMIT && type === "collection") {
          acc.large.push({
            ...item,
            id: item.id,
            title: item.title ? item.title : item.name,
            type,
            tokenCount,
          });
        } else {
          acc.safe.push({
            ...item,
            id: item.id,
            title: item.title ? item.title : item.name,
            type,
            tokenCount,
          });
        }

        return acc;
      },
      { safe: [], large: [] }
    );

    setLargeResources((prev) => {
      const existing = new Set(prev.map((r) => r.id));
      return [...prev, ...large.filter((r) => !existing.has(r.id))];
    });

    setSelectedResources((prev) => {
      const existing = new Set(prev.map((r) => r.id));
      const newResources = safe.filter((r) => !existing.has(r.id));
      return [...prev, ...newResources].sort(
        (a, b) => b.tokenCount - a.tokenCount
      );
    });

    setTotalTokens(
      (prev) =>
        prev + safe.reduce((acc, resource) => acc + resource.tokenCount, 0)
    );
  }, []);

  useEffect(() => {
    if (hasAutoQuickAddedRef.current) return;

    const categories = [
      { items: collections, type: "collection" },
      { items: resources, type: "resource" },
      { items: externalLinks, type: "link" },
      { items: events, type: "event" },
    ];

    const nonEmptyCategories = categories.filter((cat) => cat.items.length > 0);

    if (nonEmptyCategories.length === 1) {
      const { items, type } = nonEmptyCategories[0];
      handleQuickAdd(items, type);
      hasAutoQuickAddedRef.current = true;
    }
  }, [collections, resources, externalLinks, events, handleQuickAdd]);

  const renderLargeResources = (setTotalTokens) => {
    if (largeResources.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-2 mb-2">
        <div className="w-full">
          <div className="text-white sm:text-gray-500 text-sm mb-1">
            Large Collections Excluded (click to include)
          </div>
          {largeResources.map((resource) => (
            <button
              key={resource.id}
              onClick={() => {
                const resourceWithTokens = {
                  ...resource,
                  tokenCount: resource.tokenCount,
                };
                setSelectedResources((prev) => [...prev, resourceWithTokens]);
                setLargeResources((prev) =>
                  prev.filter((r) => r.id !== resource.id)
                );
                setTotalTokens((prev) => prev + resource.tokenCount);
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 mr-2 mb-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-sm hover:bg-amber-100 transition-colors duration-200"
            >
              <span>{resource.title}</span>
              <span className="text-xs opacity-75">
                ({resource.tokenCount.toLocaleString()} tokens)
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const sendMessage = async () => {
    if (!query.trim()) return;

    const totalTokens = estimateTokenCount(
      JSON.stringify({
        resources: selectedResources,
        prompt: query,
        userInfo: getUserInfoString(customUserData, includeUserInfo),
      })
    );

    if (totalTokens > 900000) {
      toast.error("Token limit exceeded (900,000 max)");
      return;
    }

    setIsLoading(true);

    try {
      // Organize resources by type
      const resourcesByType = selectedResources.reduce(
        (acc, resource) => {
          switch (resource.type.toLowerCase()) {
            case "collection":
              acc.collections.push(resource.id);
              break;
            case "link":
              acc.externalLinks.push(resource.id);
              break;
            case "resource":
              acc.resources.push(resource.id);
              break;
            case "event":
              acc.events.push(resource.id);
              break;
            case "attachment":
              acc.attachments.push(resource.id);
              break;
            case "notation":
              acc.notations.push(resource.id);
              break;
            default:
              break;
          }
          return acc;
        },
        {
          collections: [],
          externalLinks: [],
          resources: [],
          events: [],
          attachments: [],
          notations: [],
          timeframe: null, // Add if you need to handle timeframe
          history: [], // Add if you need to handle chat history
        }
      );

      const userInfo = getUserInfoString(customUserData, includeUserInfo);
      const fullPrompt = `${userInfo ? userInfo + " " : ""}Question: ${query}`;
      const payload = {
        ...resourcesByType,
        prompt: fullPrompt,
      };

      let responseData = {};

      const streamCallback = (eventData) => {
        responseData = { ...responseData, ...eventData };

        if (eventData.type === "error") {
          toast.error(eventData.message || "Error in streaming response");
        }
      };

      const response = await sendChatMessage({
        prompt: fullPrompt,
        history: history,
        data: payload,
        streamCallback,
      });

      onChatComplete(response);
      setIsChatVisible(false);
      setQuery("");
    } catch (error) {
      console.error("Chat error:", error);
      toast.error(
        "Failed to send message: " + (error.message || "Unknown error")
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 shadow-xl border-t border-gray-100 sm:p-3 
     sm:h-auto overflow-y-auto sm:overflow-visible sm:backdrop-blur-lg bg-slate-800 sm:bg-white/85"
    >
      <div className="max-w-7xl mx-auto flex flex-col h-full max-h-[30vh] overflow-y-auto">
        <div className="flex-1 overflow-y-auto px-4 py-2 sm:py-1">
          {isLoading && (
            <div className="flex items-center gap-2 mb-2 text-gray-400">
              <div className="flex gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-500/80 animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-500/80 animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-blue-500/80 animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
              <span className="text-sm font-light text-gray-500">
                AI is thinking...
              </span>
            </div>
          )}
          <div className={`flex gap-2 flex-col`}>
            {hasQuickAddResources && (
              <>
                <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar flex-col sm:flex-row">
                  {collections.length > 0 && (
                    <button
                      onClick={() => handleQuickAdd(collections, "collection")}
                      className="px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-sm hover:bg-gray-100 border border-gray-100 transition-all duration-200 font-light"
                    >
                      {selectedResources.some((r) => r.type === "collection")
                        ? `Added Collections (${collections.length})`
                        : `Add Collections (${collections.length})`}
                    </button>
                  )}
                  {resources.length > 0 && (
                    <button
                      onClick={() => handleQuickAdd(resources, "resource")}
                      className="px-3 py-1 rounded-full bg-gray-200 text-gray-4500 text-sm hover:bg-gray-100 border border-gray-400 transition-all duration-200 font-light"
                    >
                      Add Resources ({resources.length})
                    </button>
                  )}
                  {externalLinks.length > 0 && (
                    <button
                      onClick={() => handleQuickAdd(externalLinks, "link")}
                      className="px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-sm hover:bg-gray-100 border border-gray-100 transition-all duration-200 font-light"
                    >
                      Add Links ({externalLinks.length})
                    </button>
                  )}
                  {events.length > 0 && (
                    <button
                      onClick={() => handleQuickAdd(events, "event")}
                      className="px-3 py-1 rounded-full bg-gray-50 text-gray-600 text-sm hover:bg-gray-100 border border-gray-100 transition-all duration-200 font-light"
                    >
                      Add Events ({events.length})
                    </button>
                  )}
                </div>
              </>
            )}

            {selectedResources.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-2 mb-2">
                <div className="flex flex-wrap gap-2 flex-1">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-500 text-sm border border-blue-300">
                    <span>{selectedResources.length} items selected</span>
                    <span
                      className={`text-xs ${
                        totalTokens > 900000
                          ? "text-red-500 font-semibold"
                          : "text-blue-400"
                      } ml-1`}
                    >
                      (~{totalTokens.toLocaleString()} tokens
                      {totalTokens > 900000 && " - over limit"})
                    </span>
                    {largeResources.length > 0 && (
                      <span
                        className="text-red-400/90"
                        title="Some large collections excluded"
                      >
                        <FaExclamationCircle className="w-4 h-4" />
                      </span>
                    )}
                    <button
                      onClick={() => setIsCollapsed(!isCollapsed)}
                      className="ml-1 text-blue-400 hover:text-blue-500"
                    >
                      (show)
                    </button>
                  </div>
                  {isCollapsed && (
                    <div className="flex flex-wrap gap-2 w-full">
                      {largeResources.length > 0 && (
                        <div className="w-full">
                          {renderLargeResources(setTotalTokens)}
                        </div>
                      )}
                      {selectedResources
                        .sort((a, b) => b.tokenCount - a.tokenCount)
                        .map((resource) => {
                          const getBgColor = (type) => {
                            switch (type.toLowerCase()) {
                              case "collection":
                                return "bg-purple-50 border-purple-100 text-purple-500";
                              case "resource":
                                return "bg-blue-50 border-blue-100 text-blue-500";
                              case "link":
                                return "bg-green-50 border-green-100 text-green-500";
                              case "event":
                                return "bg-orange-50 border-orange-100 text-orange-500";
                              case "attachment":
                                return "bg-indigo-50 border-indigo-100 text-indigo-500";
                              case "notation":
                                return "bg-rose-50 border-rose-100 text-rose-500";
                              default:
                                return "bg-gray-50 border-gray-100 text-gray-500";
                            }
                          };

                          const isLarge = resource.tokenCount > 10000;
                          const baseClasses = getBgColor(resource.type);
                          const borderClass = isLarge
                            ? "!border-2 !border-amber-400"
                            : "";

                          return (
                            <div
                              key={resource.id}
                              className={`flex flex-col gap-0.5 px-3 py-1.5 rounded-lg border
                              ${baseClasses} ${borderClass}
                              text-sm hover:bg-opacity-70 transition-colors duration-200`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs capitalize hidden sm:inline font-light">
                                  {resource.type}:
                                </span>
                                <span className="truncate max-w-[150px] sm:max-w-[200px] font-normal">
                                  {resource.title}
                                </span>
                                <span className="text-[10px] opacity-80 text-center">
                                  ({resource.tokenCount.toLocaleString()}{" "}
                                  tokens)
                                </span>
                                <button
                                  onClick={() => {
                                    removeResource(resource.id);
                                    setTotalTokens(
                                      (prev) => prev - resource.tokenCount
                                    );
                                  }}
                                  className="ml-1 text-gray-400 hover:text-red-400 transition-colors duration-200"
                                >
                                  <FaTimes className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 text-xs text-gray-400">
                  <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hover:text-gray-500 transition-colors"
                  >
                    {!isCollapsed ? "expand" : "collapse"}
                  </button>
                  <button
                    onClick={() => setSelectedResources([])}
                    className="hover:text-gray-500 transition-colors"
                  >
                    clear all
                  </button>
                </div>
              </div>
            )}
          </div>

          {showCreditEstimator && (
            <div className="mb-4 overflow-x-auto">
              <CreditEstimator
                text={JSON.stringify({
                  resources: selectedResources,
                  prompt: query,
                  userInfo: getUserInfoString(customUserData, includeUserInfo),
                })}
              />
            </div>
          )}
        </div>

        <div className="px-4 py-2 sm:py-1.5 border-t border-gray-200">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <div className="flex gap-2 w-full sm:w-auto order-2 sm:order-1">
              <button
                onClick={handleUserInfoClick}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  includeUserInfo
                    ? "bg-blue-500 text-white shadow-sm shadow-blue-200"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaUser className="h-4 w-4" />
              </button>

              <button
                onClick={() => setShowResourceSearch(true)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all duration-200"
              >
                <FaPlus className="h-4 w-4" />
              </button>

              <button
                onClick={() => setShowCreditEstimator(!showCreditEstimator)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  showCreditEstimator
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                }`}
              >
                <FaDollarSign className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-2 flex-1 w-full order-1 sm:order-2">
              <InputField
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 bg-gray-50 border-gray-100 placeholder-gray-400 text-gray-600 sm:text-sm py-2 focus:ring-blue-200 focus:border-blue-300 rounded-lg transition-all duration-200"
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
              />

              <button
                onClick={sendMessage}
                disabled={!query.trim() || isLoading || totalTokens > 900000}
                className="p-2 rounded-lg bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-600 transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-200"
              >
                <FiSend className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SearchModal
        isOpen={showResourceSearch}
        onClose={() => setShowResourceSearch(false)}
        onSelect={handleResourceSelect}
        selectedResources={selectedResources}
      />
    </div>
  );
};

export default Chat;
