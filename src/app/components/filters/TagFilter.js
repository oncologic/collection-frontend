"use client";

import { useState } from "react";
import {
  FaTags,
  FaTimes,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import MultiSelect from "@/app/components/inputs/MultiSelect";

const TagFilter = ({
  tags = [],
  selectedTags = [],
  onTagsChange,
  onClearFilters,
  showFilterCount = true,
  showClearButton = true,
  showToggle = true,
  isCollapsible = true,
  defaultExpanded = false,
  label = "Filter by Tags",
  placeholder = "Select tags...",
  chipClassName = "bg-green-100 text-green-800",
  className = "",
  getTagCount = null, // Optional function to get count for each tag
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Calculate available tags with counts if getTagCount function is provided
  const availableTags = tags.map((tag) => ({
    ...tag,
    ...(getTagCount && { count: getTagCount(tag.id) }),
  }));

  const hasActiveFilters = selectedTags.length > 0;

  const handleClearFilters = () => {
    onTagsChange([]);
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const handleTagRemove = (tagToRemove) => {
    const updatedTags = selectedTags.filter((tag) => tag.id !== tagToRemove.id);
    onTagsChange(updatedTags);
  };

  if (isCollapsible && showToggle) {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 ${className}`}
      >
        {/* Collapsible Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FaTags className="text-gray-500" />
            <span className="font-medium text-gray-900">{label}</span>
            {showFilterCount && hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                {selectedTags.length}
              </span>
            )}
          </div>
          {isExpanded ? (
            <FaChevronUp className="text-gray-400" />
          ) : (
            <FaChevronDown className="text-gray-400" />
          )}
        </button>

        {/* Collapsible Content */}
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <TagFilterContent
              availableTags={availableTags}
              selectedTags={selectedTags}
              onTagsChange={onTagsChange}
              placeholder={placeholder}
              chipClassName={chipClassName}
              showClearButton={showClearButton}
              hasActiveFilters={hasActiveFilters}
              handleClearFilters={handleClearFilters}
              handleTagRemove={handleTagRemove}
            />
          </div>
        )}
      </div>
    );
  }

  // Non-collapsible version
  return (
    <div className={className}>
      <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
        <FaTags className="text-gray-500" />
        {label}
        {showFilterCount && hasActiveFilters && (
          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
            {selectedTags.length}
          </span>
        )}
      </h3>
      <TagFilterContent
        availableTags={availableTags}
        selectedTags={selectedTags}
        onTagsChange={onTagsChange}
        placeholder={placeholder}
        chipClassName={chipClassName}
        showClearButton={showClearButton}
        hasActiveFilters={hasActiveFilters}
        handleClearFilters={handleClearFilters}
        handleTagRemove={handleTagRemove}
      />
    </div>
  );
};

// Extracted content component for reuse
const TagFilterContent = ({
  availableTags,
  selectedTags,
  onTagsChange,
  placeholder,
  chipClassName,
  showClearButton,
  hasActiveFilters,
  handleClearFilters,
  handleTagRemove,
}) => {
  return (
    <div className="space-y-3">
      {/* MultiSelect Dropdown */}
      <MultiSelect
        options={availableTags}
        value={selectedTags}
        onChange={onTagsChange}
        placeholder={placeholder}
        chipClassName={chipClassName}
        showCount={true}
      />

      {/* Active Tags Display */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Active filters:
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm ${chipClassName}`}
              >
                {tag.name}
                {tag.count !== undefined && (
                  <span className="text-xs opacity-75">({tag.count})</span>
                )}
                <button
                  onClick={() => handleTagRemove(tag)}
                  className="hover:opacity-70 transition-opacity"
                  aria-label={`Remove ${tag.name} filter`}
                >
                  <FaTimes className="text-xs" />
                </button>
              </span>
            ))}
          </div>

          {/* Clear All Button */}
          {showClearButton && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
            >
              Clear all tag filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TagFilter;
