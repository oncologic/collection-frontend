import React, { useState, useRef, useEffect } from "react";
import { FaTimes, FaPlus, FaTag } from "react-icons/fa";
import {
  useExternalLinkTags,
  useSearchExternalLinkTags,
  useCreateExternalLinkTag,
} from "@/app/hooks/useTags";

const TagInput = ({
  value = [],
  onChange,
  externalLinkId = null,
  placeholder = "Add tags...",
  className = "",
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Hooks for tag management
  const { data: allTags = [] } = useExternalLinkTags();
  const { data: searchResults = [] } = useSearchExternalLinkTags(inputValue);
  const { mutate: createTag, isLoading: isCreating } =
    useCreateExternalLinkTag();

  // Get tags to show in dropdown
  const availableTags = inputValue.length >= 2 ? searchResults : allTags;

  // Filter out already selected tags
  const filteredTags = availableTags.filter(
    (tag) => !value.some((selectedTag) => selectedTag.id === tag.id)
  );

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsDropdownOpen(true);
    setSelectedIndex(-1);
  };

  // Handle input focus
  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  // Handle input blur
  const handleInputBlur = (e) => {
    // Delay hiding dropdown to allow clicks on dropdown items
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsDropdownOpen(false);
      }
    }, 150);
  };

  // Handle tag selection
  const handleTagSelect = (tag) => {
    const newValue = [...value, tag];
    onChange(newValue);
    setInputValue("");
    setIsDropdownOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  // Handle tag removal
  const handleTagRemove = (tagToRemove) => {
    const newValue = value.filter((tag) => tag.id !== tagToRemove.id);
    onChange(newValue);
  };

  // Handle creating new tag
  const handleCreateTag = () => {
    if (!inputValue.trim()) return;

    const tagData = {
      name: inputValue.trim(),
      color: getRandomColor(),
    };

    createTag(tagData, {
      onSuccess: (newTag) => {
        handleTagSelect(newTag);
      },
    });
  };

  // Generate a random color for new tags
  const getRandomColor = () => {
    const colors = [
      "#3B82F6",
      "#EF4444",
      "#10B981",
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
      "#06B6D4",
      "#84CC16",
      "#F97316",
      "#6366F1",
      "#14B8A6",
      "#F472B6",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isDropdownOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsDropdownOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredTags.length ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex === -1) {
          // Create new tag if no tag is selected
          if (inputValue.trim()) {
            handleCreateTag();
          }
        } else if (selectedIndex === filteredTags.length) {
          // Create new tag option
          handleCreateTag();
        } else if (filteredTags[selectedIndex]) {
          // Select existing tag
          handleTagSelect(filteredTags[selectedIndex]);
        }
        break;
      case "Escape":
        setIsDropdownOpen(false);
        setSelectedIndex(-1);
        break;
      case "Backspace":
        if (inputValue === "" && value.length > 0) {
          // Remove last tag if input is empty
          handleTagRemove(value[value.length - 1]);
        }
        break;
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className="min-h-[42px] w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white">
        <div className="flex flex-wrap gap-1.5 items-center">
          {/* Selected Tags */}
          {value.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium border"
              style={{
                backgroundColor: `${tag.color}20`,
                borderColor: tag.color,
                color: tag.color,
              }}
            >
              <FaTag className="w-3 h-3" />
              {tag.name}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleTagRemove(tag)}
                  className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
                >
                  <FaTimes className="w-2.5 h-2.5" />
                </button>
              )}
            </span>
          ))}

          {/* Input */}
          {!disabled && (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={value.length === 0 ? placeholder : ""}
              className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
            />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isDropdownOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredTags.length > 0 ? (
            <>
              {filteredTags.map((tag, index) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleTagSelect(tag)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                    index === selectedIndex ? "bg-blue-50" : ""
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-sm">{tag.name}</span>
                  {tag.usageCount > 0 && (
                    <span className="ml-auto text-xs text-gray-500">
                      {tag.usageCount} uses
                    </span>
                  )}
                </button>
              ))}

              {/* Create new tag option */}
              {inputValue.trim() &&
                !filteredTags.some(
                  (tag) =>
                    tag.name.toLowerCase() === inputValue.trim().toLowerCase()
                ) && (
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    disabled={isCreating}
                    className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100 ${
                      selectedIndex === filteredTags.length ? "bg-blue-50" : ""
                    }`}
                  >
                    <FaPlus className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="text-sm text-blue-600">
                      {isCreating
                        ? "Creating..."
                        : `Create "${inputValue.trim()}"`}
                    </span>
                  </button>
                )}
            </>
          ) : inputValue.trim() ? (
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={isCreating}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
            >
              <FaPlus className="w-3 h-3 text-blue-500 flex-shrink-0" />
              <span className="text-sm text-blue-600">
                {isCreating ? "Creating..." : `Create "${inputValue.trim()}"`}
              </span>
            </button>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">
              {allTags.length === 0
                ? "No tags yet"
                : "Start typing to search tags..."}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagInput;
