import React, { useState, useMemo } from 'react';

const TagClassification = ({
  availableTags = [],
  highlightedTags = [],
  tagFilterMode = "OR",
  onTagClick,
  onClearHighlights,
  onFilterModeChange,
  getTagCount,
  showCondition = true,
  title = "Tag Classification",
  className = "",
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter and sort tags
  const filteredAndSortedTags = useMemo(() => {
    let filtered = availableTags;
    
    // Filter by search term
    if (searchTerm) {
      filtered = availableTags.filter(tag =>
        tag.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Sort by event count (descending) then alphabetically
    return filtered.sort((a, b) => {
      const eventCountA = getTagCount ? getTagCount(a.id) : 0;
      const eventCountB = getTagCount ? getTagCount(b.id) : 0;
      
      // First sort by event count (descending)
      if (eventCountB !== eventCountA) {
        return eventCountB - eventCountA;
      }
      
      // Then sort alphabetically (ascending)
      return a.name.localeCompare(b.name);
    });
  }, [availableTags, searchTerm, getTagCount]);

  if (!showCondition || availableTags.length === 0) {
    return null;
  }

  return (
    <div className={`mt-4 p-6 bg-gray-50 rounded-lg border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"
            />
          </svg>
          {title}
        </h4>
        <div className="flex items-center gap-3">
          {highlightedTags.length > 0 && (
            <>
              {/* AND/OR Toggle Button */}
              {highlightedTags.length > 1 && onFilterModeChange && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    Filter:
                  </span>
                  <button
                    onClick={() =>
                      onFilterModeChange(
                        tagFilterMode === "OR" ? "AND" : "OR"
                      )
                    }
                    className={`px-2 py-1 text-xs font-medium rounded-md border transition-colors ${
                      tagFilterMode === "AND"
                        ? "bg-blue-100 text-blue-700 border-blue-300"
                        : "bg-gray-100 text-gray-600 border-gray-300"
                    }`}
                    title={`Currently showing events with ${
                      tagFilterMode === "OR" ? "ANY" : "ALL"
                    } selected tags. Click to switch to ${
                      tagFilterMode === "OR" ? "AND" : "OR"
                    } mode.`}
                  >
                    {tagFilterMode}
                  </button>
                </div>
              )}
              {onClearHighlights && (
                <button
                  onClick={onClearHighlights}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  Clear highlights ({highlightedTags.length})
                </button>
              )}
            </>
          )}
          <span className="text-sm text-gray-500 font-medium">
            {filteredAndSortedTags.length}{" "}
            {filteredAndSortedTags.length === 1 ? "Category" : "Categories"}
            {searchTerm && ` (filtered from ${availableTags.length})`}
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {highlightedTags.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 mb-2 font-medium">
            <svg
              className="w-4 h-4 inline mr-1.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Highlighting {highlightedTags.length} tag
            {highlightedTags.length === 1 ? "" : "s"} on
            calendar
            {highlightedTags.length > 1 && tagFilterMode && (
              <span className="text-blue-600 font-normal">
                {" "}
                (showing events with{" "}
                <span className="font-medium">
                  {tagFilterMode === "OR" ? "ANY" : "ALL"}
                </span>{" "}
                selected tags)
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {highlightedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                style={{
                  backgroundColor: `${tag.color}20`,
                  borderColor: tag.color,
                  color: tag.color,
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {filteredAndSortedTags.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">
            {searchTerm ? `No tags found matching "${searchTerm}"` : "No tags available"}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
          {filteredAndSortedTags.map((tag) => {
          const tagColor = tag.color || "#3B82F6";
          const eventCount = getTagCount ? getTagCount(tag.id) : 0;
          const isHighlighted = highlightedTags.some(
            (t) => t.id === tag.id
          );

          return (
            <button
              key={tag.id}
              onClick={() => onTagClick && onTagClick(tag)}
              className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                isHighlighted
                  ? "bg-white border-2 shadow-md transform scale-105"
                  : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
              }`}
              style={{
                borderColor: isHighlighted ? tagColor : undefined,
                boxShadow: isHighlighted
                  ? `0 0 12px ${tagColor}30`
                  : undefined,
              }}
              title={`Click to ${
                isHighlighted ? "unhighlight" : "highlight"
              } calendar events with this tag`}
            >
              <div
                className={`w-5 h-5 rounded-lg border flex-shrink-0 transition-all duration-200 ${
                  isHighlighted
                    ? "shadow-lg transform scale-110"
                    : "border-gray-200 shadow-sm"
                }`}
                style={{
                  backgroundColor: tagColor,
                  borderColor: isHighlighted ? tagColor : undefined,
                }}
              />
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-medium truncate transition-colors ${
                    isHighlighted ? "text-gray-900" : "text-gray-900"
                  }`}
                >
                  {tag.name}
                </p>
                {getTagCount && (
                  <p
                    className={`text-xs transition-colors ${
                      isHighlighted ? "text-gray-600" : "text-gray-500"
                    }`}
                  >
                    {eventCount} {eventCount === 1 ? "event" : "events"}
                  </p>
                )}
              </div>
              {isHighlighted && (
                <div className="flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-green-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
        </div>
      )}

      {/* Legend Key */}
      <div className="border-t border-gray-200 pt-4">
        <h5 className="text-sm font-medium text-gray-700 mb-3">
          Visual Legend
        </h5>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded opacity-75"></div>
            <span>Multiple tags</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded relative">
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white rounded-full border border-gray-300"></div>
            </div>
            <span>Multi-tag indicator</span>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          <strong>Tip:</strong> Click tags above to highlight
          calendar events. Selected tags will be outlined and
          glowing.
        </div>
      </div>
    </div>
  );
};

export default TagClassification;