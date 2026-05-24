import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useContentSearch } from "../hooks/useAI";
import InputField from "./inputs/InputField";
import DOMPurify from "dompurify";
import { FaTimes, FaKeyboard, FaClock, FaCalendar } from "react-icons/fa";
import { estimateTokenCount } from "../utils/jsonExtractors";
import { DateTime } from "luxon";

const TABS = [
  { id: "links", label: "External Links" },
  { id: "collections", label: "Collections" },
  { id: "events", label: "Events" },
  { id: "notations", label: "Notations" },
  { id: "resources", label: "Resources" },
  { id: "linkGroups", label: "Link Groups" },
  { id: "attachments", label: "Attachments" },
];

const TAB_TYPE_MAP = {
  links: "external_link",
  collections: "collection",
  events: "event",
  notations: "notation",
  resources: "resource",
  linkGroups: "link_group",
  attachments: "attachment",
};

const getSearchResultIdentity = (item) => {
  const type = item?.type || "unknown";
  const id =
    item?.id ??
    item?.externalLinkId ??
    item?.external_link_id ??
    item?.resourceId ??
    item?.resource_id ??
    item?.collectionExternalLinkId ??
    item?.collection_external_link_id ??
    item?.collectionId ??
    item?.collection_id;

  if (id === undefined || id === null || id === "") {
    return null;
  }

  if (type === "attachment") {
    const parentId =
      item?.externalLinkId ??
      item?.external_link_id ??
      item?.resourceId ??
      item?.resource_id;

    return parentId ? `${type}-${id}-${parentId}` : `${type}-${id}`;
  }

  if (type === "link_group") {
    const parentId =
      item?.linkingId ??
      item?.linking_id ??
      item?.externalLinkId ??
      item?.external_link_id ??
      item?.resourceId ??
      item?.resource_id;

    return parentId ? `${type}-${id}-${parentId}` : `${type}-${id}`;
  }

  return `${type}-${id}`;
};

const dedupeSearchResults = (items) => {
  const seen = new Set();

  return items.filter((item) => {
    const identity = getSearchResultIdentity(item);

    if (!identity) {
      return true;
    }

    if (seen.has(identity)) {
      return false;
    }

    seen.add(identity);
    return true;
  });
};

const getSearchResultRenderKey = (item, index) =>
  getSearchResultIdentity(item) ||
  `${item?.type || "unknown"}-${item?.title || item?.name || "result"}-${index}`;

const SearchModal = ({
  isOpen,
  onClose,
  onSelect,
  selectedResources,
  collections = [],
  resources = [],
  events = [],
  externalLinks = [],
  notations = [],
  linkGroups = [],
  attachments = [],
  allowedTabs = null,
  title = "Search Content",
  placeholder = "Search collections, resources, events, attachments, and link groups...",
}) => {
  const [activeTab, setActiveTab] = useState("collections");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchMutation = useContentSearch();
  const searchInputRef = useRef(null);
  const visibleTabs = useMemo(
    () =>
      Array.isArray(allowedTabs) && allowedTabs.length > 0
        ? TABS.filter((tab) => allowedTabs.includes(tab.id))
        : TABS,
    [allowedTabs],
  );

  useEffect(() => {
    if (visibleTabs.length > 0 && !visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [activeTab, visibleTabs]);

  // Auto-focus the search input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Clear search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  const getResultsByTab = useCallback((tabId) => {
    const localData = {
      collection: collections,
      resource: resources,
      event: events,
      notation: notations,
      link_group: linkGroups,
      attachment: attachments,
      external_link: externalLinks,
    };

    const type = TAB_TYPE_MAP[tabId];

    // If we have a search query of 2 or more characters, use the API results
    if (debouncedQuery.length >= 2 && searchMutation.data) {
      const filtered =
        searchMutation.data?.content?.filter((item) => item.type === type) ||
        [];

      return dedupeSearchResults(filtered);
    }

    // Otherwise, filter the local data and assign correct type
    const items =
      localData[type]?.filter((item) => {
        if (!searchQuery) return true;

        const searchLower = searchQuery.toLowerCase();
        return (
          item.title?.toLowerCase().includes(searchLower) ||
          item.name?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower)
        );
      }) || [];

    // Ensure items have the correct type based on their data source
    return dedupeSearchResults(
      items.map((item) => ({
        ...item,
        type,
      })),
    );
  }, [
    collections,
    resources,
    events,
    notations,
    linkGroups,
    attachments,
    externalLinks,
    debouncedQuery,
    searchMutation.data,
    searchQuery,
  ]);

  const filteredResults = useMemo(
    () => getResultsByTab(activeTab),
    [activeTab, getResultsByTab],
  );

  useEffect(() => {
    if (debouncedQuery && filteredResults.length === 0 && searchMutation.data) {
      const tabWithResults = visibleTabs.find(
        (tab) => getResultsByTab(tab.id).length > 0
      );
      if (tabWithResults) {
        setActiveTab(tabWithResults.id);
      }
    }
  }, [
    searchMutation.data,
    debouncedQuery,
    filteredResults.length,
    getResultsByTab,
    visibleTabs,
  ]);

  const handleSearch = (value) => {
    setSearchQuery(value);
    // Debounce search query for API calls
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      setDebouncedQuery(value);
      if (value.length >= 2) {
        searchMutation.mutate({ searchQuery: value });
      }
    }, 300);
  };

  const isItemSelected = (item) => {
    return selectedResources?.some((resource) => resource.id === item.id);
  };

  // Helper function to normalize item structure
  const normalizeItem = (item) => {
    const base = {
      id: item.id,
      title: item.title || item.name,
      name: item.name || item.title,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      type: item.type,
      matchedVia: item.matchedVia,
      matchedChildren: item.matchedChildren,
      resourceId: item.resourceId,
      url: item.url,
      notes: item.notes,
      status: item.status,
      visibility: item.visibility,
      collectionId: item.collectionId || item.collection_id,
      collectionExternalLinkId:
        item.collectionExternalLinkId || item.collection_external_link_id,
      sourceCollectionId: item.sourceCollectionId || item.source_collection_id,
      sourceCollectionName:
        item.sourceCollectionName || item.source_collection_name,
      workflowMetadata: item.workflowMetadata || item.workflow_metadata,
      // Include date/time fields
      date: item.date,
      startDate: item.startDate || item.start_date || item.date,
      endDate: item.endDate || item.end_date,
      startTime: item.startTime || item.start_time || item.time,
      endTime: item.endTime || item.end_time,
      timezone: item.timezone,
    };

    // Handle different item types
    switch (item.type) {
      case "external_link":
        return {
          ...base,
          content: item.content,
          status: item.status,
          category: item.category,
          visibility: item.visibility,
          highlighted: item.highlighted,
          hashtags: item.hashtags,
          imageUrl: item.imageUrl || item.image_url,
          imageMetadata: item.imageMetadata || item.image_metadata,
          whiteboardData: item.whiteboardData || item.whiteboard_data,
        };
      case "collection":
        return {
          ...base,
          visibility: item.visibility,
          status: item.status,
          icon: item.icon,
          color: item.color,
          resource_count: item.resource_count,
          is_pinned: item.is_pinned,
        };
      case "notation":
        return {
          ...base,
          category: item.category,
          status: item.status,
          highlighted: item.highlighted,
          visibility: item.visibility,
          parentId: item.externalLinkId, // Use externalLinkId as parentId for navigation
          externalLinkId: item.externalLinkId,
          notes: item.notes,
        };
      case "event":
        return {
          ...base,
          startDate: item.startDate || item.date,
          endDate: item.endDate,
          eventType: item.eventType,
          status: item.status,
          // Convert event dates to standard format
          date: item.date || item.startDate,
          startTime: item.startTime || item.time,
          endTime: item.endTime,
          timezone: item.timezone,
        };
      case "attachment":
        return {
          ...base,
          externalLinkId: item.externalLinkId,
          collectionId: item.collectionId,
          collectionName: item.collectionName,
        };
      case "link_group":
        return {
          ...base,
          url: item.url,
          category: item.category,
          visibility: item.visibility,
          linkingId: item.linkingId,
          linkingType: item.linkingType,
        };
      default:
        return base;
    }
  };

  const handleSelect = (item) => {
    const normalizedItem = normalizeItem(item);

    if (!isItemSelected(normalizedItem)) {
      onSelect(normalizedItem);
    }
  };

  // Get OS-specific modifier key text
  const getModifierKey = () => {
    if (typeof window !== "undefined") {
      return navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl";
    }
    return "Ctrl";
  };

  // Helper function to format date and time
  const formatDateTime = (item) => {
    const parts = [];

    // Format date
    if (item.date) {
      try {
        // Try parsing as ISO first
        let dt = DateTime.fromISO(item.date);

        // If ISO parsing fails, try SQL format (YYYY-MM-DD HH:mm:ss±TZ)
        if (!dt.isValid) {
          dt = DateTime.fromSQL(item.date);
        }

        // If still not valid, try parsing with format
        if (!dt.isValid && item.date.includes(" ")) {
          const [datePart, timePart] = item.date.split(" ");
          dt = DateTime.fromISO(datePart);
        }

        if (dt.isValid) {
          parts.push(dt.toFormat("MMM d, yyyy"));
        }
      } catch (e) {
        console.error("Date parsing error:", e, "for date:", item.date);
        // If all parsing fails, just use the date string as-is
        const dateStr = item.date.split(" ")[0]; // Get just the date part
        if (dateStr) {
          parts.push(dateStr);
        }
      }
    }

    // Helper to convert 24h time to 12h with AM/PM
    const formatTimeToAMPM = (timeStr) => {
      if (!timeStr) return "";
      try {
        // Handle HH:MM or HH:MM:SS format
        const [hours, minutes] = timeStr.split(":");
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
      } catch (e) {
        return timeStr; // Return original if parsing fails
      }
    };

    // Format time
    if (item.startTime) {
      let timeStr = formatTimeToAMPM(item.startTime);
      if (item.endTime) {
        timeStr += ` - ${formatTimeToAMPM(item.endTime)}`;
      }
      if (item.timezone) {
        timeStr += ` (${item.timezone})`;
      }
      parts.push(timeStr);
    }

    return parts.join(" • ");
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed z-[1000] inset-0">
      <div
        className="fixed inset-0 bg-black/30 text-gray-600"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-start sm:items-center justify-center p-4 sm:p-4 text-gray-600">
        <DialogPanel className="w-full max-w-4xl bg-white rounded-xl shadow-xl mx-2 mt-16 sm:mt-0">
          <div className="p-4 sm:p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                  <FaKeyboard className="text-blue-500 hidden sm:inline" />
                  {title}
                </DialogTitle>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
                  Press {getModifierKey()}+P or {getModifierKey()}+K to search •
                  ESC to close
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <InputField
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full mb-4"
            />

            <div className="flex flex-wrap gap-2 mb-4">
              {visibleTabs.map((tab) => {
                const resultCount = getResultsByTab(tab.id).length;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-lg relative text-sm sm:text-base sm:px-4 sm:py-2 ${
                      activeTab === tab.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 hover:bg-gray-200"
                    }`}
                  >
                    {tab.label}
                    {debouncedQuery &&
                      resultCount > 0 &&
                      activeTab !== tab.id && (
                        <span className="absolute -top-1 -right-1 bg-green-300 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {resultCount}
                        </span>
                      )}
                  </button>
                );
              })}
            </div>

            <div className="max-h-[50vh] sm:max-h-96 overflow-y-auto">
              {searchMutation.isLoading ? (
                <div className="text-center py-4">Loading...</div>
              ) : filteredResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? (
                    <div>
                      <p className="text-lg mb-2">No results found</p>
                      <p className="text-sm">
                        Try searching for something else or browse different
                        tabs
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg mb-2">Start typing to search</p>
                      <p className="text-sm">
                        Search across collections, resources, events, and more
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredResults.map((item, index) => (
                    <div
                      key={getSearchResultRenderKey(item, index)}
                      onClick={() => handleSelect(item)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        isItemSelected(item)
                          ? "bg-gray-100 opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-100 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-base">{item.title || item.name}</h3>
                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded capitalize">
                          {item.type === "external_link"
                            ? "link"
                            : item.type.replaceAll("_", " ")}
                        </span>
                      </div>

                      {/* Date/Time display */}
                      {(item.type === "event" ||
                        item.date ||
                        item.startTime) && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          {item.date && <FaCalendar className="w-3 h-3" />}
                          {item.startTime && <FaClock className="w-3 h-3" />}
                          <span>{formatDateTime(item)}</span>
                        </div>
                      )}

                      <p
                        className="text-sm text-gray-600 truncate line-clamp-1 mt-1"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(item.description || ""),
                        }}
                      />

                      {item.type === "resource" &&
                        item.matchedChildren &&
                        (item.matchedChildren.attachments?.length > 0 ||
                          item.matchedChildren.linkGroups?.length > 0) && (
                          <p className="text-xs text-blue-600 mt-2">
                            Matched via
                            {item.matchedChildren.attachments?.length > 0
                              ? ` ${item.matchedChildren.attachments.length} attachment${
                                  item.matchedChildren.attachments.length === 1
                                    ? ""
                                    : "s"
                                }`
                              : ""}
                            {item.matchedChildren.attachments?.length > 0 &&
                            item.matchedChildren.linkGroups?.length > 0
                              ? " and"
                              : ""}
                            {item.matchedChildren.linkGroups?.length > 0
                              ? ` ${item.matchedChildren.linkGroups.length} link group${
                                  item.matchedChildren.linkGroups.length === 1
                                    ? ""
                                    : "s"
                                }`
                              : ""}
                          </p>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default SearchModal;
