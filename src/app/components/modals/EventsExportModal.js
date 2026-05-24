"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FaCheck,
  FaDownload,
  FaCopy,
  FaTimes,
  FaRobot,
  FaChevronDown,
  FaSearch,
  FaFileCsv,
  FaCheckSquare,
  FaRegSquare,
} from "react-icons/fa";
import toast from "react-hot-toast";
import Modal from "../Modal";
import { DateTime } from "luxon";

const EventsExportModal = ({
  isOpen,
  onClose,
  events = [],
  preSelectedIds = [],
  preSelected = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [showLLMDropdown, setShowLLMDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventIds, setSelectedEventIds] = useState(new Set());
  const [activeTab, setActiveTab] = useState("selection"); // "selection" or "preview"
  const llmDropdownRef = useRef(null);
  const generatePromptContentRef = useRef(null);

  const [exportOptions, setExportOptions] = useState({
    includeDate: true,
    includeTime: true,
    includeLocation: true,
    includeOrganizations: true,
    includeTags: true,
    includeDescription: true,
    includeRegistrationLink: true,
  });

  // Initialize selection - if preSelected, select all and go to preview
  useEffect(() => {
    if (isOpen) {
      if (preSelected && events.length > 0) {
        // Pre-select all passed events and go directly to preview
        setSelectedEventIds(new Set(events.map((e) => e.id)));
        setActiveTab("preview");
      } else if (preSelectedIds.length > 0) {
        setSelectedEventIds(new Set(preSelectedIds));
        setActiveTab("selection");
      } else {
        setSelectedEventIds(new Set());
        setActiveTab("selection");
      }
    }
  }, [isOpen, preSelectedIds, preSelected, events]);

  // Generate prompt content when selection or options change
  useEffect(() => {
    if (isOpen && selectedEventIds.size > 0) {
      generatePromptContentRef.current?.();
    }
  }, [selectedEventIds, exportOptions, isOpen]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showLLMDropdown &&
        llmDropdownRef.current &&
        !llmDropdownRef.current.contains(event.target)
      ) {
        setShowLLMDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showLLMDropdown]);

  // Filter events based on search
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;

    const query = searchQuery.toLowerCase();
    return events.filter(
      (event) =>
        event.title?.toLowerCase().includes(query) ||
        event.organizations?.some((org) =>
          org.name?.toLowerCase().includes(query)
        ) ||
        event.locationCity?.toLowerCase().includes(query) ||
        event.locationState?.toLowerCase().includes(query) ||
        event.tags?.some((tag) => tag.name?.toLowerCase().includes(query))
    );
  }, [events, searchQuery]);

  // Get selected events
  const selectedEvents = useMemo(() => {
    return events.filter((e) => selectedEventIds.has(e.id));
  }, [events, selectedEventIds]);

  if (!isOpen) return null;

  const stripHtml = (html) => {
    if (!html) return "";
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  const formatEventTime = (event) => {
    if (!event?.startDate) return "";

    try {
      const dt = DateTime.fromISO(event.startDate);
      if (!dt.isValid) return "";

      // Check if it has a meaningful time (not midnight)
      if (dt.hour === 0 && dt.minute === 0 && !event.startTime && !event.time) {
        return ""; // All-day event
      }

      const hours = event.startTime
        ? parseInt(event.startTime.split(":")[0], 10)
        : dt.hour;
      const minutes = event.startTime
        ? parseInt(event.startTime.split(":")[1] || "0", 10)
        : dt.minute;

      const ampm = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
    } catch (e) {
      return "";
    }
  };

  const generatePromptContent = () => {
    const eventsToExport = events.filter((e) => selectedEventIds.has(e.id));

    let prompt = `# Events Export\n\n`;
    prompt += `**Export Date:** ${new Date().toLocaleDateString()}\n`;
    prompt += `**Number of Events:** ${eventsToExport.length}\n\n`;
    prompt += `\n\n`;

    eventsToExport.forEach((event, index) => {
      prompt += `## ${index + 1}. ${event.title || "Untitled Event"}\n\n`;

      if (exportOptions.includeDate) {
        const startDt = DateTime.fromISO(event.startDate);
        const endDt = event.endDate ? DateTime.fromISO(event.endDate) : null;
        if (startDt.isValid) {
          prompt += `**Date:** ${startDt.toFormat("MMMM d, yyyy")}`;
          if (endDt?.isValid && !endDt.hasSame(startDt, "day")) {
            prompt += ` - ${endDt.toFormat("MMMM d, yyyy")}`;
          }
          prompt += `\n`;
        }
      }

      if (exportOptions.includeTime) {
        const time = formatEventTime(event);
        if (time) {
          prompt += `**Time:** ${time}`;
          if (event.timezone) {
            prompt += ` (${event.timezone})`;
          }
          prompt += `\n`;
        }
      }

      if (exportOptions.includeLocation) {
        const locationParts = [
          event.locationName,
          event.locationCity,
          event.locationState,
          event.locationCountry,
        ].filter(Boolean);
        if (locationParts.length > 0) {
          prompt += `**Location:** ${locationParts.join(", ")}\n`;
        }
        if (event.virtualEvent) {
          prompt += `**Format:** Virtual Event\n`;
        }
        if (event.inPersonEvent) {
          prompt += `**Format:** In-Person Event\n`;
        }
      }

      if (
        exportOptions.includeOrganizations &&
        event.organizations?.length > 0
      ) {
        const orgNames = event.organizations.map((o) => o.name).filter(Boolean);
        if (orgNames.length > 0) {
          prompt += `**Business Units:** ${orgNames.join(", ")}\n`;
        }
      }

      if (exportOptions.includeTags && event.tags?.length > 0) {
        const tagNames = event.tags.map((t) => t.name).filter(Boolean);
        if (tagNames.length > 0) {
          prompt += `**Tags:** ${tagNames.join(", ")}\n`;
        }
      }

      if (exportOptions.includeDescription && event.description) {
        const desc = stripHtml(event.description).substring(0, 500);
        prompt += `**Description:** ${desc}${
          event.description.length > 500 ? "..." : ""
        }\n`;
      }

      if (
        exportOptions.includeRegistrationLink &&
        (event.registrationLink || event.url)
      ) {
        prompt += `**Registration/URL:** ${
          event.registrationLink || event.url
        }\n`;
      }

      prompt += `\n---\n\n`;
    });

    setPromptContent(prompt);
  };
  generatePromptContentRef.current = generatePromptContent;

  const handleCopy = () => {
    if (selectedEventIds.size === 0) {
      toast.error("Please select at least one event");
      return;
    }

    navigator.clipboard
      .writeText(promptContent)
      .then(() => {
        setCopied(true);
        toast.success("Content copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy content"));
  };

  const handleOpenLLM = (service) => {
    if (selectedEventIds.size === 0) {
      toast.error("Please select at least one event");
      return;
    }

    navigator.clipboard.writeText(promptContent).then(() => {
      setCopied(true);
      toast.success("Content copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });

    const urls = {
      chatgpt: "https://chat.openai.com/",
      grok: "https://grok.com/",
      claude: "https://claude.ai/",
      perplexity: "https://www.perplexity.ai/",
      copilot: "https://copilot.microsoft.com/",
    };

    if (urls[service]) {
      window.open(urls[service], "_blank", "noopener,noreferrer");
    }

    setShowLLMDropdown(false);
  };

  const handleExportCSV = () => {
    if (selectedEventIds.size === 0) {
      toast.error("Please select at least one event");
      return;
    }

    const eventsToExport = events.filter((e) => selectedEventIds.has(e.id));

    const headers = [
      "Event Name",
      "Start Date",
      "Start Time",
      "End Date",
      "End Time",
      "Business Units",
      "Tags",
      "City",
      "State",
      "Country",
      "Timezone",
      "Format",
      "Professional/Community",
      "Registration Link",
      "Description",
    ];

    const rows = eventsToExport.map((event) => {
      const startDt = DateTime.fromISO(event.startDate);
      const endDt = event.endDate ? DateTime.fromISO(event.endDate) : null;

      return [
        `"${(event.title || "").replace(/"/g, '""')}"`,
        startDt.isValid ? startDt.toFormat("yyyy-MM-dd") : "",
        startDt.isValid ? startDt.toFormat("HH:mm") : "",
        endDt?.isValid ? endDt.toFormat("yyyy-MM-dd") : "",
        endDt?.isValid ? endDt.toFormat("HH:mm") : "",
        `"${(event.organizations?.map((o) => o.name).join("; ") || "").replace(
          /"/g,
          '""'
        )}"`,
        `"${(event.tags?.map((t) => t.name).join("; ") || "").replace(
          /"/g,
          '""'
        )}"`,
        `"${(event.locationCity || "").replace(/"/g, '""')}"`,
        event.locationState || "",
        event.locationCountry || "",
        event.timezone || "",
        [
          event.virtualEvent ? "Virtual" : null,
          event.inPersonEvent ? "In-Person" : null,
        ]
          .filter(Boolean)
          .join(", ") || "",
        event.professional ? "Professional" : "Community",
        event.registrationLink || event.url || "",
        `"${stripHtml(event.description || "")
          .replace(/"/g, '""')
          .substring(0, 500)}"`,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `events-export-${DateTime.now().toFormat("yyyy-MM-dd")}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${eventsToExport.length} events to CSV`);
  };

  const toggleEventSelection = (eventId) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      filteredEvents.forEach((e) => next.add(e.id));
      return next;
    });
  };

  const deselectAllFiltered = () => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      filteredEvents.forEach((e) => next.delete(e.id));
      return next;
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-5xl">
      <div className="flex flex-col h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Export Events</h2>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Select events to export, then choose your export format.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "selection"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("selection")}
          >
            Select Events ({selectedEventIds.size} selected)
          </button>
          <button
            className={`px-6 py-3 font-medium transition-all ${
              activeTab === "preview"
                ? "text-blue-600 border-b-2 border-blue-600 bg-white"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => {
              if (selectedEventIds.size === 0) {
                toast.error("Please select at least one event first");
                return;
              }
              setActiveTab("preview");
            }}
          >
            Preview &amp; Export
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "selection" && (
            <div className="h-full flex flex-col">
              {/* Search and bulk actions */}
              <div className="p-4 border-b border-gray-200 bg-white space-y-3">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search events by name, business unit, location, tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <FaTimes className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={selectAllFiltered}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Select all ({filteredEvents.length})
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectAllFiltered}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Deselect all
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {selectedEventIds.size} of {events.length} selected
                  </span>
                </div>
              </div>

              {/* Events list */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {filteredEvents.map((event) => {
                    const isSelected = selectedEventIds.has(event.id);
                    const startDt = DateTime.fromISO(event.startDate);
                    const time = formatEventTime(event);

                    return (
                      <div
                        key={event.id}
                        onClick={() => toggleEventSelection(event.id)}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="pt-0.5">
                          {isSelected ? (
                            <FaCheckSquare className="w-5 h-5 text-blue-600" />
                          ) : (
                            <FaRegSquare className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {event.title}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                            {startDt.isValid && (
                              <span>{startDt.toFormat("MMM d, yyyy")}</span>
                            )}
                            {time && (
                              <span className="text-blue-600 font-medium">
                                {time}
                              </span>
                            )}
                            {event.locationState && (
                              <span>
                                {event.locationCity
                                  ? `${event.locationCity}, `
                                  : ""}
                                {event.locationState}
                              </span>
                            )}
                          </div>
                          {event.organizations?.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1 truncate">
                              {event.organizations
                                .map((o) => o.name)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredEvents.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      {searchQuery
                        ? "No events match your search"
                        : "No events available"}
                    </div>
                  )}
                </div>
              </div>

              {/* Continue button */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    if (selectedEventIds.size === 0) {
                      toast.error("Please select at least one event");
                      return;
                    }
                    setActiveTab("preview");
                  }}
                  disabled={selectedEventIds.size === 0}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Continue with {selectedEventIds.size} Event
                  {selectedEventIds.size !== 1 ? "s" : ""}
                </button>
              </div>
            </div>
          )}

          {activeTab === "preview" && (
            <div className="h-full flex flex-col">
              {/* Export options */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Include in Export:
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(exportOptions).map(([key, value]) => (
                    <label
                      key={key}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={() =>
                          setExportOptions((prev) => ({
                            ...prev,
                            [key]: !prev[key],
                          }))
                        }
                        className="rounded text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {key
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^include /, "")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Note about LLM */}
              <div className="mx-4 mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  Copy the content below to use with an LLM (ChatGPT, Claude,
                  etc.)
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  * Always verify LLM responses. This is not professional
                  advice.
                </p>
              </div>

              {/* Preview content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4 h-full overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {promptContent ||
                      "Select events and options to generate preview..."}
                  </pre>
                </div>
              </div>

              {/* Export actions */}
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    onClick={handleCopy}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-md transition-colors ${
                      copied
                        ? "border-green-300 bg-green-50 text-green-700"
                        : "border-gray-300 text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {copied ? (
                      <FaCheck className="w-3.5 h-3.5" />
                    ) : (
                      <FaCopy className="w-3.5 h-3.5" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </button>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <FaFileCsv className="w-3.5 h-3.5" />
                    CSV
                  </button>

                  <div className="relative" ref={llmDropdownRef}>
                    <button
                      onClick={() => setShowLLMDropdown(!showLLMDropdown)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <FaRobot className="w-3.5 h-3.5" />
                      LLM
                      <FaChevronDown className="w-2.5 h-2.5" />
                    </button>

                    {showLLMDropdown && (
                      <div className="absolute bottom-full right-0 mb-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                        {[
                          { id: "chatgpt", name: "ChatGPT" },
                          { id: "claude", name: "Claude" },
                          { id: "grok", name: "Grok" },
                          { id: "perplexity", name: "Perplexity" },
                          { id: "copilot", name: "Copilot" },
                        ].map((llm) => (
                          <button
                            key={llm.id}
                            onClick={() => handleOpenLLM(llm.id)}
                            className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 text-gray-700"
                          >
                            {llm.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default EventsExportModal;
