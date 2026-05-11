"use client";

import React, { useState, useEffect, useRef } from "react";
import { useController } from "react-hook-form";
import {
  FaSearch,
  FaBuilding,
  FaFolder,
  FaChevronDown,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { useDebounce } from "../../hooks/useDebounce";
import { useGlobalSearch } from "../../hooks/useSearch";

/**
 * SearchableEntitySelect - A dropdown component that searches organizations and collections
 * through the global search API
 *
 * @param {Object} props
 * @param {string} props.name - Field name for react-hook-form
 * @param {Object} props.control - react-hook-form control object
 * @param {string} props.label - Label text
 * @param {Array} props.entityTypes - Array of entity types to search ["organization", "collection"]
 * @param {string} props.placeholder - Placeholder text
 * @param {boolean} props.disabled - Whether the field is disabled
 * @param {function} props.onChange - Optional onChange handler
 * @param {Object} props.rules - Validation rules for react-hook-form
 */
const SearchableEntitySelect = ({
  name,
  control,
  label,
  entityTypes = ["organization", "collection"],
  placeholder = "Type to search...",
  disabled = false,
  onChange,
  rules,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Debounce search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Use the global search hook
  const { data: searchData, isLoading: isSearching } = useGlobalSearch(
    debouncedSearchTerm,
    isOpen && debouncedSearchTerm.length >= 2
  );

  // Filter search results based on entity types
  const searchResults = React.useMemo(() => {
    if (!searchData?.content) return [];

    return searchData.content.filter((item) => {
      if (
        entityTypes.includes("organization") &&
        item.type === "organization"
      ) {
        return true;
      }
      if (entityTypes.includes("collection") && item.type === "collection") {
        return true;
      }
      if (
        entityTypes.includes("external_link") &&
        item.type === "external_link"
      ) {
        return true;
      }
      return false;
    });
  }, [searchData, entityTypes]);

  // react-hook-form controller
  const {
    field: { value, onChange: fieldOnChange, onBlur },
    fieldState: { error },
  } = useController({
    name,
    control,
    rules,
  });

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle selecting an item
  const handleSelect = (item) => {
    const selectedValue = {
      id: item.id,
      name: item.title,
      type: item.type,
    };

    fieldOnChange(selectedValue);
    if (onChange) {
      onChange(selectedValue);
    }

    setSearchTerm("");
    setIsOpen(false);
  };

  // Handle clearing selection
  const handleClear = () => {
    fieldOnChange(null);
    if (onChange) {
      onChange(null);
    }
    setSearchTerm("");
  };

  // Get icon for entity type
  const getEntityIcon = (type) => {
    switch (type) {
      case "organization":
        return <FaBuilding className="text-blue-500" />;
      case "collection":
        return <FaFolder className="text-green-500" />;
      case "external_link":
        return <FaExternalLinkAlt className="text-purple-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Selected value display or search input */}
        {value ? (
          <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getEntityIcon(value.type)}
              <span className="text-sm">{value.name}</span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
              disabled={disabled}
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsOpen(true)}
              placeholder={placeholder}
              className={`w-full pl-10 pr-10 py-2 border ${
                error ? "border-red-300" : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={disabled}
            />
            <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error.message || "This field is required"}
        </p>
      )}

      {/* Dropdown results */}
      {isOpen &&
        (searchResults.length > 0 ||
          isSearching ||
          debouncedSearchTerm.length >= 2) && (
          <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="px-4 py-3 text-center text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                  <span>Searching...</span>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <ul className="py-1">
                {searchResults.map((item) => (
                  <li
                    key={`${item.type}-${item.id}`}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                    onClick={() => handleSelect(item)}
                  >
                    {getEntityIcon(item.type)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {item.description.replace(/<[^>]*>/g, "")}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : debouncedSearchTerm.length >= 2 ? (
              <div className="px-4 py-3 text-center text-gray-500">
                No results found for &quot;{debouncedSearchTerm}&quot;
              </div>
            ) : null}
          </div>
        )}
    </div>
  );
};

export default SearchableEntitySelect;
