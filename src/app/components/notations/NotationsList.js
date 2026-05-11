import { useState, useMemo, useEffect } from "react";
import {
  useAddNotationThread,
  useGetNotationThreads,
} from "@/app/hooks/useCollections";
import {
  FaStar,
  FaChevronDown,
  FaLock,
  FaSearch,
  FaTimes,
  FaFilter,
} from "react-icons/fa";
import { useContextAuth } from "@/app/context/authContext";
import CustomEditor from "../common/CustomEditor";
import {
  formatDateRangeShort,
  formatDayOfWeekRange,
  getDateRangeValues,
} from "@/app/utils/general";
import { formatTimeDisplay } from "../events/CalendarView";

const NOTATION_STATUS_OPTIONS = [
  { id: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { id: "active", label: "Active", color: "bg-blue-100 text-blue-700" },
  { id: "completed", label: "Completed", color: "bg-green-100 text-green-600" },
  { id: "waiting", label: "Waiting", color: "bg-orange-100 text-orange-700" },
  {
    id: "in progress",
    label: "In Progress",
    color: "bg-purple-100 text-purple-700",
  },
  { id: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
  {
    id: "large reference",
    label: "Large Reference",
    color: "bg-pink-100 text-pink-700",
  },
  { id: "archived", label: "Archived", color: "bg-gray-100 text-gray-700" },
  // Fallback for any other status
  { id: "default", label: "Unknown", color: "bg-gray-100 text-gray-700" },
];

const NotationsList = ({
  notations,
  onEditNotation,
  onDeleteNotation,
  onCopyNotation,
  isAdmin,
  isAdvocate,
  isCollaborator = false,
  userRole = "",
  userId = "",
  isBulkMode = false,
  selectedNotations = {},
  onSelectNotation = () => {},
  bulkDates = {},
  onBulkDateChange = () => {},
  highlightNotationId = null,
}) => {
  const [expandedNotes, setExpandedNotes] = useState(new Set());
  const [newThread, setNewThread] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [tagFilterMode, setTagFilterMode] = useState("OR");
  const [showTagFilter, setShowTagFilter] = useState(false);
  const addNotationThread = useAddNotationThread();

  // Auto-expand highlighted notation on mount
  useEffect(() => {
    if (highlightNotationId) {
      setExpandedNotes(new Set([highlightNotationId]));
      // Scroll to the highlighted notation after a short delay to ensure rendering
      setTimeout(() => {
        const element = document.getElementById(`notation-${highlightNotationId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightNotationId]);

  // Check if the user can edit a specific notation
  const canEditNotation = (notation) => {
    // Admin can edit any notation
    if (isAdmin) return true;

    // Collaborators can edit their own notations
    if (isCollaborator && notation.userId === userId) return true;

    // Collaborators with editor or admin role can edit all notations
    if (isCollaborator && (userRole === "editor" || userRole === "admin")) return true;

    return false;
  };

  // Check if the user can delete a specific notation
  const canDeleteNotation = (notation) => {
    // Only admins and owners can delete notations
    if (isAdmin) return true;

    // Collaborator admins can delete notations
    if (isCollaborator && userRole === "admin") return true;

    // Owners can delete their own notations
    if (notation.userId === userId) return true;

    return false;
  };

  // Extract all unique tags from notations
  const availableTags = useMemo(() => {
    const tagMap = new Map();
    (notations || []).forEach((notation) => {
      if (notation.tags && Array.isArray(notation.tags)) {
        notation.tags.forEach((tag) => {
          if (!tagMap.has(tag.id)) {
            tagMap.set(tag.id, tag);
          }
        });
      }
    });
    return Array.from(tagMap.values());
  }, [notations]);

  // Filter notations based on search term and tags
  const filteredNotations = useMemo(() => {
    let filtered = notations || [];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((notation) => {
        // Search in title
        const titleMatch = notation.title?.toLowerCase().includes(searchLower);

        // Search in content/notes
        let contentMatch = false;
        if (notation.notes) {
          const contentString =
            typeof notation.notes === "string"
              ? notation.notes
              : JSON.stringify(notation.notes);

          // Remove HTML tags for cleaner search
          const cleanContent = contentString.replace(/<[^>]*>/g, "");
          contentMatch = cleanContent.toLowerCase().includes(searchLower);
        }

        return titleMatch || contentMatch;
      });
    }

    // Apply tag filter
    if (selectedTags.size > 0) {
      filtered = filtered.filter((notation) => {
        if (!notation.tags || notation.tags.length === 0) {
          return false;
        }

        const notationTagIds = new Set(notation.tags.map(tag => tag.id));

        if (tagFilterMode === "OR") {
          // OR mode: notation must have at least one selected tag
          for (const selectedTagId of selectedTags) {
            if (notationTagIds.has(selectedTagId)) {
              return true;
            }
          }
          return false;
        } else {
          // AND mode: notation must have all selected tags
          for (const selectedTagId of selectedTags) {
            if (!notationTagIds.has(selectedTagId)) {
              return false;
            }
          }
          return true;
        }
      });
    }

    return filtered;
  }, [notations, searchTerm, selectedTags, tagFilterMode]);

  // Updated sorting logic to work with filtered notations
  const sortedNotations = useMemo(() => {
    return [...filteredNotations].sort((a, b) => {
      // First sort by highlighted status
      if (a.highlighted !== b.highlighted) {
        return b.highlighted ? 1 : -1;
      }

      // If both have dates, sort by date using string comparison to avoid timezone issues
      const dateA = getDateRangeValues(a).startDate;
      const dateB = getDateRangeValues(b).startDate;

      if (dateA && dateB) {
        // Extract date parts for comparison
        const dateOnlyA = dateA.split("T")[0];
        const dateOnlyB = dateB.split("T")[0];

        // If dates are the same, sort by time if available
        if (dateOnlyA === dateOnlyB) {
          const hasTimeA = a.startTime || a.endTime;
          const hasTimeB = b.startTime || b.endTime;

          // If both have time info, sort by start time
          if (hasTimeA && hasTimeB) {
            const timeA = String(a.startTime || "00:00");
            const timeB = String(b.startTime || "00:00");

            return timeA.localeCompare(timeB);
          }

          // If only one has time info, prioritize it
          if (hasTimeA) return -1;
          if (hasTimeB) return 1;
        }

        // Sort by date using string comparison
        return String(dateOnlyA).localeCompare(String(dateOnlyB));
      }

      // If only one has a date, it comes first
      if (dateA) return -1;
      if (dateB) return 1;

      // If neither has a date, sort by updated time using string comparison
      const updatedA = String(b.updatedAt || "");
      const updatedB = String(a.updatedAt || "");
      return updatedA.localeCompare(updatedB);
    });
  }, [filteredNotations]);

  const toggleAll = (expand) => {
    if (expand) {
      setExpandedNotes(new Set(sortedNotations?.map((n) => n.id)));
    } else {
      setExpandedNotes(new Set());
    }
  };

  const toggleNote = (id) => {
    setExpandedNotes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleAddThread = async (notationId) => {
    if (!newThread.trim()) return;

    try {
      await addNotationThread.mutateAsync({
        notationId,
        threadData: { content: newThread },
      });
      setNewThread("");
    } catch (error) {
      console.error("Error adding thread:", error);
    }
  };

  const NotationThreads = ({ notationId }) => {
    const { data: threads, isLoading } = useGetNotationThreads(notationId);

    if (isLoading)
      return (
        <div className="text-sm text-gray-500 p-2">Loading discussions...</div>
      );

    if (!threads || threads.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic p-2">
          No discussions yet
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {threads?.map((thread) => (
          <div
            key={thread.id}
            className="bg-white p-3 rounded-md border border-gray-100 shadow-sm"
          >
            <p className="text-sm text-gray-700">{thread.content}</p>
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                {new Date(thread.createdAt).toLocaleDateString()} at{" "}
                {new Date(thread.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              {thread.user && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                  {thread.user.name || "User"}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = (content) => {
    if (!content) return null;

    // Handle different content formats
    const contentString =
      typeof content === "string" ? content : JSON.stringify(content);

    // Always use CustomEditor since it can handle both HTML and markdown content
    // The Markdown extension in CustomEditor will properly process markdown
    return (
      <CustomEditor
        content={contentString}
        readOnly={true}
        transparent={true}
        textColor="text-gray-800"
        scrollable={false}
        compact={false}
        contextDetails={{
          parseMarkdown: true,
        }}
      />
    );
  };

  const getStatusColor = (status) => {
    const statusOption = NOTATION_STATUS_OPTIONS.find(
      (option) => option.id === status?.toLowerCase()
    );
    return (
      statusOption?.color ||
      NOTATION_STATUS_OPTIONS.find((opt) => opt.id === "default").color
    );
  };

  const getStatusLabel = (status) => {
    const statusOption = NOTATION_STATUS_OPTIONS.find(
      (option) => option.id === status?.toLowerCase()
    );
    return statusOption?.label || status;
  };

  // Helper function to format time to AM/PM format
  const formatTime = (timeString) => {
    if (!timeString) return "";

    try {
      // Handle different time formats
      let hours, minutes;

      if (timeString.includes(":")) {
        const parts = timeString.split(":");
        hours = parseInt(parts[0]);
        minutes = parseInt(parts[1]) || 0;
      } else if (timeString.length === 4) {
        // HHMM format
        hours = parseInt(timeString.substring(0, 2));
        minutes = parseInt(timeString.substring(2, 4));
      } else {
        return timeString; // Return as-is if format is unclear
      }

      // Convert to 12-hour format
      const period = hours >= 12 ? "PM" : "AM";
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      const displayMinutes = minutes.toString().padStart(2, "0");

      return `${displayHours}:${displayMinutes} ${period}`;
    } catch (error) {
      return timeString; // Return original if parsing fails
    }
  };

  const handleTagClick = (tagId) => {
    setSelectedTags((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const handleClearTags = () => {
    setSelectedTags(new Set());
  };

  return (
    <div className="space-y-1 overflow-x-hidden w-full max-w-full">
      {/* Tag Filter Button and Selected Tags */}
      {availableTags.length > 0 && (
        <div className="mb-4 w-full max-w-full">
          <div className="flex items-center flex-wrap gap-2 mb-2 w-full max-w-full">
            <button
              onClick={() => setShowTagFilter(!showTagFilter)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                selectedTags.size > 0
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaFilter className="w-3 h-3 flex-shrink-0" />
              <span className="whitespace-nowrap">Filter by Tags</span>
              {selectedTags.size > 0 && (
                <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full flex-shrink-0">
                  {selectedTags.size}
                </span>
              )}
              <FaChevronDown
                className={`w-3 h-3 transform transition-transform flex-shrink-0 ${
                  showTagFilter ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Show selected tags inline when filter is collapsed */}
            {selectedTags.size > 0 && !showTagFilter && (
              <div className="flex items-center flex-wrap gap-1.5 min-w-0 flex-1 max-w-full">
                <span className="text-xs text-gray-600 whitespace-nowrap flex-shrink-0">
                  {tagFilterMode} mode:
                </span>
                <div className="flex flex-wrap gap-1 min-w-0">
                  {Array.from(selectedTags).slice(0, 3).map((tagId) => {
                    const tag = availableTags.find((t) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                        style={{
                          backgroundColor: tag.color,
                          color: "white",
                        }}
                      >
                        {tag.name}
                      </span>
                    );
                  })}
                  {selectedTags.size > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-700 flex-shrink-0">
                      +{selectedTags.size - 3}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleClearTags}
                  className="text-xs text-gray-500 hover:text-gray-700 underline whitespace-nowrap flex-shrink-0"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Expandable Tag Filter */}
          {showTagFilter && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 animate-in slide-in-from-top-1 duration-200 w-full max-w-full overflow-hidden">
              {/* Filter Mode Toggle */}
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Filter mode:
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setTagFilterMode("OR")}
                      className={`px-2 py-0.5 text-xs rounded-full transition-colors whitespace-nowrap ${
                        tagFilterMode === "OR"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      OR
                    </button>
                    <button
                      onClick={() => setTagFilterMode("AND")}
                      className={`px-2 py-0.5 text-xs rounded-full transition-colors whitespace-nowrap ${
                        tagFilterMode === "AND"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                      }`}
                    >
                      AND
                    </button>
                  </div>
                </div>
                {selectedTags.size > 0 && (
                  <button
                    onClick={handleClearTags}
                    className="text-xs text-gray-500 hover:text-gray-700 whitespace-nowrap flex-shrink-0"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Available Tags */}
              <div className="flex flex-wrap gap-1.5">
                {availableTags.map((tag) => {
                  const isSelected = selectedTags.has(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => handleTagClick(tag.id)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border transition-all ${
                        isSelected
                          ? "border-2 shadow-sm"
                          : "border hover:border-2"
                      }`}
                      style={{
                        backgroundColor: isSelected ? tag.color : `${tag.color}20`,
                        borderColor: tag.color,
                        color: isSelected ? "white" : tag.color,
                      }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: isSelected ? "white" : tag.color }}
                      />
                      <span>{tag.name}</span>
                      {isSelected && <FaTimes className="w-2.5 h-2.5 ml-0.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search notations by title or content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          )}
        </div>
        {(searchTerm || selectedTags.size > 0) && (
          <div className="mt-2 text-sm text-gray-600">
            {`Found ${sortedNotations.length} notation${
              sortedNotations.length !== 1 ? "s" : ""
            }`}
            {searchTerm && selectedTags.size > 0 && (
              <span>{` matching "${searchTerm}" and selected tags`}</span>
            )}
            {searchTerm && selectedTags.size === 0 && (
              <span>{` matching "${searchTerm}"`}</span>
            )}
            {!searchTerm && selectedTags.size > 0 && (
              <span>{` with selected tags`}</span>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={() => toggleAll(true)}
          className="text-sm text-gray-600 hover:text-gray-800 px-2 rounded-full hover:bg-gray-100 transition-all duration-200"
        >
          Expand All
        </button>
        <button
          onClick={() => toggleAll(false)}
          className="text-sm text-gray-600 hover:text-gray-800 px-2 rounded-full hover:bg-gray-100 transition-all duration-200"
        >
          Collapse All
        </button>
      </div>

      {/* Select All Checkbox in Bulk Mode */}
      {isBulkMode && sortedNotations?.length > 0 && (
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            checked={
              sortedNotations.every(
                (notation) => selectedNotations[notation.id]
              ) && sortedNotations.length > 0
            }
            onChange={(e) => {
              const newSelected = {};
              if (e.target.checked) {
                sortedNotations.forEach((notation) => {
                  newSelected[notation.id] = true;
                });
              }
              // Call onSelectNotation for each notation to update parent state
              sortedNotations.forEach((notation) => {
                onSelectNotation(notation.id, e.target.checked);
              });
            }}
            className="mr-2 h-4 w-4"
          />
          <span className="text-sm text-gray-700 font-medium">
            Select All ({sortedNotations.length} notations)
          </span>
        </div>
      )}

      <div className="space-y-2 w-full max-w-full overflow-x-hidden">
        {sortedNotations?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? (
              <>
                {`No notations found matching "${searchTerm}"`}
                <br />
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-blue-500 hover:text-blue-600 underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              "No notations found"
            )}
          </div>
        ) : (
          sortedNotations?.map((notation) => (
            <div
              key={notation.id}
              id={`notation-${notation.id}`}
              className={`border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden w-full max-w-full ${
                highlightNotationId === notation.id ? 'border-blue-500 border-2 ring-2 ring-blue-200' : 'border-gray-200'
              } ${
                notation.status?.toLowerCase() === 'completed'
                  ? 'bg-gray-50 bg-opacity-50'
                  : 'bg-white'
              }`}
              style={{
                opacity: notation.status?.toLowerCase() === 'completed' ? 0.5 : 1
              }}
            >
              {/* Header Section */}
              <div
                onClick={() => !isBulkMode && toggleNote(notation.id)}
                className={`w-full px-3 py-2.5 cursor-pointer transition-all duration-200 ${
                  notation.status?.toLowerCase() === 'completed'
                    ? 'hover:bg-gray-100'
                    : 'hover:bg-gray-50'
                } ${
                  expandedNotes.has(notation.id)
                    ? "border-b border-gray-200"
                    : ""
                }`}
              >
                {/* Badge row */}
                <div className="flex items-center gap-2 mb-1.5 flex-wrap min-w-0 w-full">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    {notation.category && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 flex-shrink-0">
                        {notation.category}
                      </span>
                    )}

                    {notation.userId === userId && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 flex-shrink-0">
                        You
                      </span>
                    )}

                    {notation.tags && notation.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 flex-shrink-0">
                        {notation.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              borderColor: tag.color,
                              color: tag.color,
                            }}
                          >
                            <div
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </span>
                        ))}
                        {notation.tags.length > 2 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{notation.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Status badge on the same row but right-aligned */}
                  <div className="flex-1 flex justify-end min-w-0 ml-auto">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${getStatusColor(
                        notation.status
                      )}`}
                    >
                      {getStatusLabel(notation.status)}
                    </span>
                  </div>
                </div>

                {/* Main content row - title and controls */}
                <div className="flex items-start justify-between gap-3 min-w-0 w-full">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`font-medium truncate block min-w-0 max-w-full ${
                        notation.status?.toLowerCase() === 'completed'
                          ? 'text-gray-600'
                          : 'text-gray-900'
                      }`}>
                        {notation.title}
                      </span>

                      {notation.highlighted && (
                        <FaStar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 min-w-0 flex-wrap">
                      {notation.visibility === "private" && (
                        <FaLock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      )}
                      {getDateRangeValues(notation).startDate && (
                        <span className="text-xs font-medium text-gray-600 flex-shrink-0 whitespace-nowrap">
                          {formatDateRangeShort(
                            notation.startDate || notation.date || notation.createdAt,
                            notation.endDate ||
                              notation.startDate ||
                              notation.date ||
                              notation.createdAt
                          )}{" "}
                          {formatDayOfWeekRange(
                            notation.startDate || notation.date || notation.createdAt,
                            notation.endDate ||
                              notation.startDate ||
                              notation.date ||
                              notation.createdAt
                          )}
                        </span>
                      )}

                      {notation.startTime && (
                        <span className="text-xs font-medium text-blue-600 flex-shrink-0 flex items-center gap-1 whitespace-nowrap">
                          <span className="inline-block w-1 h-1 bg-gray-400 rounded-full"></span>
                          {notation.endTime
                            ? formatTimeDisplay(notation)
                            : formatTime(notation.startTime)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side with actions and indicator */}
                  <div className="relative z-10 flex items-center gap-3 ml-2 pl-1 flex-shrink-0">
                    {!isBulkMode && (
                      <div className="hidden sm:flex gap-2">
                        {onCopyNotation && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onCopyNotation(notation);
                            }}
                            className="text-xs text-gray-400 hover:text-green-500 transition-colors duration-200"
                          >
                            Copy
                          </button>
                        )}
                        {onEditNotation && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onEditNotation(notation);
                            }}
                            className="text-xs text-gray-400 hover:text-blue-500 transition-colors duration-200"
                          >
                            Edit
                          </button>
                        )}
                        {canDeleteNotation(notation) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this notation?"
                                )
                              ) {
                                onDeleteNotation(
                                  notation.id,
                                  notation.collectionId
                                );
                              }
                            }}
                            className="text-xs text-gray-400 hover:text-red-500 transition-colors duration-200"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    )}

                    {!isBulkMode && (
                      <FaChevronDown
                        className={`text-gray-400 transform transition-transform duration-200 ${
                          expandedNotes.has(notation.id) ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </div>
                </div>

                {/* Action buttons - only shown on mobile */}
                {!isBulkMode && (
                  <div className="flex gap-2 mt-1.5 sm:hidden">
                    {onCopyNotation && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onCopyNotation(notation);
                        }}
                        className="text-xs text-gray-400 hover:text-green-500 transition-colors duration-200"
                      >
                        Copy
                      </button>
                    )}
                    {onEditNotation && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onEditNotation(notation);
                        }}
                        className="text-xs text-gray-400 hover:text-blue-500 transition-colors duration-200"
                      >
                        Edit
                      </button>
                    )}
                    {canDeleteNotation(notation) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (
                            window.confirm(
                              "Are you sure you want to delete this notation?"
                            )
                          ) {
                            onDeleteNotation(
                              notation.id,
                              notation.collectionId
                            );
                          }
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors duration-200"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Bulk Mode Content */}
              {isBulkMode && (
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type="checkbox"
                    checked={!!selectedNotations[notation.id]}
                    onChange={(e) =>
                      onSelectNotation(notation.id, e.target.checked)
                    }
                    onClick={(e) => e.stopPropagation()}
                    className="h-3.5 w-3.5 ml-2"
                  />
                  <input
                    type="date"
                    className="border rounded px-2 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-200"
                    value={
                      bulkDates[notation.id] ||
                      notation.startDate?.split("T")[0] ||
                      notation.date?.split("T")[0] ||
                      ""
                    }
                    onChange={(e) =>
                      onBulkDateChange(notation.id, e.target.value)
                    }
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {/* Expanded Content - clearly below the header */}
              {expandedNotes.has(notation.id) && (
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 overflow-x-hidden w-full max-w-full">
                  <div className="text-gray-800 leading-relaxed text-base overflow-x-hidden w-full max-w-full">
                    {renderContent(notation.notes)}
                  </div>
                  
                  {/* Custom Fields Display */}
                  {notation.customFields && Object.keys(notation.customFields).length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Custom Fields</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(notation.customFields).map(([key, value]) => {
                          // Format the key for display (handle both snake_case and camelCase)
                          const displayKey = key
                            // First handle camelCase by adding spaces before capital letters
                            .replace(/([a-z])([A-Z])/g, '$1 $2')
                            // Then handle snake_case by replacing underscores with spaces
                            .replace(/_/g, ' ')
                            // Capitalize first letter of each word
                            .replace(/\b\w/g, letter => letter.toUpperCase());
                          
                          // Format the value based on its type
                          const formatValue = (val) => {
                            if (val === null || val === undefined) return '-';
                            if (typeof val === 'boolean') return val ? 'Yes' : 'No';
                            if (Array.isArray(val)) {
                              if (val.length === 0) return '-';
                              return (
                                <div className="flex flex-wrap gap-1">
                                  {val.map((item, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              );
                            }
                            if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}$/)) {
                              // Format date values
                              return new Date(val).toLocaleDateString();
                            }
                            if (typeof val === 'string' && val.match(/^https?:\/\//)) {
                              // Format URL values as links
                              return (
                                <a
                                  href={val}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                                >
                                  {val}
                                </a>
                              );
                            }
                            if (typeof val === 'string' && val.includes('@')) {
                              // Format email values as mailto links
                              return (
                                <a
                                  href={`mailto:${val}`}
                                  className="text-blue-600 hover:text-blue-800 underline text-sm"
                                >
                                  {val}
                                </a>
                              );
                            }
                            return String(val);
                          };
                          
                          return (
                            <div key={key} className="flex flex-col space-y-1">
                              <span className="text-xs font-medium text-gray-600">
                                {displayKey}
                              </span>
                              <div className="text-sm text-gray-800">
                                {formatValue(value)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotationsList;
