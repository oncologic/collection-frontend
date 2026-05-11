"use client";
import React from "react";
import { FaMapMarkerAlt, FaTimes } from "react-icons/fa";

/**
 * Component for filtering clinical trials by location
 *
 * @param {Object} props - Component props
 * @param {string} props.value - Current location filter value
 * @param {Function} props.onChange - Function to call when input changes
 * @param {Function} props.onClear - Function to call to clear the filter
 * @param {boolean} props.showLabel - Whether to show the label
 * @returns {JSX.Element} The rendered component
 */
const LocationFilter = ({ value, onChange, onClear, showLabel = true }) => {
  return (
    <div className="w-full">
      {showLabel && (
        <label className="block text-md text-gray-700 mb-1">Location</label>
      )}

      <div className="relative">
        <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400" />
        <input
          type="text"
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md 
                   focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
                   text-base transition duration-150 ease-in-out"
          placeholder="Filter by location (e.g., United States, Canada)..."
        />
        {value && (
          <button
            onClick={onClear}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Clear location filter"
          >
            <FaTimes />
          </button>
        )}
      </div>
    </div>
  );
};

export default LocationFilter;
