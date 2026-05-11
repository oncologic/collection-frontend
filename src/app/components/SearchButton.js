"use client";

import React from "react";
import { FaSearch } from "react-icons/fa";
import { useGlobalSearch } from "../context/GlobalSearchContext";

const SearchButton = ({ className = "" }) => {
  const { openSearch } = useGlobalSearch();

  // Get OS-specific modifier key text
  const getModifierKey = () => {
    if (typeof window !== "undefined") {
      return navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl";
    }
    return "Ctrl";
  };

  return (
    <button
      onClick={openSearch}
      className={`
        flex items-center gap-2 px-3 py-2 
        bg-gray-100 hover:bg-gray-200 
        text-gray-600 hover:text-gray-800
        rounded-lg border border-gray-200 
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      title={`Search (${getModifierKey()}+P)`}
    >
      <FaSearch className="w-4 h-4" />
      <span className="hidden sm:inline text-sm">Search</span>
      <span className="hidden lg:inline text-xs text-gray-400 ml-1">
        {getModifierKey()}+P
      </span>
    </button>
  );
};

export default SearchButton;
