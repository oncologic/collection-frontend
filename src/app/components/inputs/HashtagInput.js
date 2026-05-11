"use client";

import React, { useState, useEffect } from "react";
import { FaHashtag } from "react-icons/fa";
import MultiSelect from "./MultiSelect";

const HashtagInput = ({
  value = [],
  onChange,
  placeholder = "Add hashtags (e.g., ASCO2025, Cancer, Research)",
  label = "Hashtags",
  required = false,
}) => {
  // Convert hashtags to the format expected by MultiSelect
  const [hashtags, setHashtags] = useState([]);
  const [inputValue, setInputValue] = useState("");

  // Initialize hashtags from value prop
  useEffect(() => {
    if (value && Array.isArray(value)) {
      const formattedTags = value.map((tag) => {
        // If it's already in the right format, return as is
        if (typeof tag === "object" && tag.id && tag.name) {
          return tag;
        }
        // Otherwise convert string to required format
        const cleanTag = tag.startsWith("#") ? tag.substring(1) : tag;
        return { id: cleanTag, name: cleanTag };
      });
      setHashtags(formattedTags);
    }
  }, [value]);

  // Handle hashtag selection changes
  const handleChange = (selectedHashtags) => {
    setHashtags(selectedHashtags);

    // Convert to simple array of tags for the parent component
    const simpleTags = selectedHashtags.map((tag) =>
      tag.name.startsWith("#") ? tag.name : `#${tag.name}`
    );

    if (onChange) {
      onChange(simpleTags);
    }
  };

  // Handle manual tag input
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Add new tag when comma or enter is pressed
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  // Add the tag from input
  const addTag = () => {
    if (inputValue.trim()) {
      // Clean the input (remove # if present)
      const tagInput = inputValue.trim();
      const tagValue = tagInput.startsWith("#")
        ? tagInput.substring(1)
        : tagInput;

      // Only add if not already present
      if (
        !hashtags.some(
          (tag) => tag.name.toLowerCase() === tagValue.toLowerCase()
        )
      ) {
        const newTag = { id: tagValue, name: tagValue };
        const updatedTags = [...hashtags, newTag];
        setHashtags(updatedTags);

        // Notify parent component
        const simpleTags = updatedTags.map((tag) =>
          tag.name.startsWith("#") ? tag.name : `#${tag.name}`
        );
        if (onChange) {
          onChange(simpleTags);
        }
      }

      setInputValue("");
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <label className="text-lg font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex flex-col">
        <div className="flex flex-col mb-1">
          <div className="flex items-center">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaHashtag className="text-gray-400" />
              </div>
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onBlur={addTag}
                placeholder="Type and press Enter to add custom hashtags"
                className="pl-10 w-full py-2 px-4 rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <button
              type="button"
              onClick={addTag}
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-2">
          {hashtags.map((tag, index) => (
            <div
              key={index}
              className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
            >
              <FaHashtag className="mr-1 text-xs" />
              <span>{tag.name}</span>
              <button
                type="button"
                className="ml-2 text-blue-600 hover:text-blue-800"
                onClick={() => {
                  const updatedTags = hashtags.filter((_, i) => i !== index);
                  setHashtags(updatedTags);

                  // Notify parent component
                  const simpleTags = updatedTags.map((tag) =>
                    tag.name.startsWith("#") ? tag.name : `#${tag.name}`
                  );
                  if (onChange) {
                    onChange(simpleTags);
                  }
                }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-1">
          Enter hashtags separated by commas or press Enter after each one. No
          need to include # symbol.
        </p>
      </div>
    </div>
  );
};

export default HashtagInput;
