"use client";

import { useState } from "react";
import {
  FaCheckCircle,
  FaTimes,
  FaFilter,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

const StatusFilter = ({
  statusOptions = [],
  statusFilter = {},
  onStatusFilterChange,
  onClearFilters,
  getStatusCount = null,
  showFilterCount = true,
  showClearButton = true,
  showToggle = true,
  isCollapsible = true,
  defaultExpanded = false,
  label = "Filter by Status",
  chipClassName = "bg-blue-100 text-blue-800",
  className = "",
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Calculate active filters
  const activeFilters = statusOptions.filter(
    (option) => statusFilter[option.id]
  );
  const inactiveFilters = statusOptions.filter(
    (option) => !statusFilter[option.id]
  );
  const hasActiveFilters = inactiveFilters.length > 0; // Some filters are turned off

  const handleClearFilters = () => {
    // Reset to default: show all except completed and archived
    const defaultFilter = statusOptions.reduce((acc, option) => {
      acc[option.id] = !["completed", "archived"].includes(option.id);
      return acc;
    }, {});
    onStatusFilterChange(defaultFilter);
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const handleSelectAll = () => {
    const allSelectedFilter = statusOptions.reduce((acc, option) => {
      acc[option.id] = true;
      return acc;
    }, {});
    onStatusFilterChange(allSelectedFilter);
  };

  const handleDeselectAll = () => {
    const allDeselectedFilter = statusOptions.reduce((acc, option) => {
      acc[option.id] = false;
      return acc;
    }, {});
    onStatusFilterChange(allDeselectedFilter);
  };

  const handleStatusToggle = (statusId) => {
    const newFilter = {
      ...statusFilter,
      [statusId]: !statusFilter[statusId],
    };
    onStatusFilterChange(newFilter);
  };

  const handleStatusRemove = (statusToRemove) => {
    const newFilter = {
      ...statusFilter,
      [statusToRemove.id]: true, // Set to true to show the status (remove from hidden list)
    };

    onStatusFilterChange(newFilter);
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
            <FaCheckCircle className="text-gray-500" />
            <span className="font-medium text-gray-900">{label}</span>
            {showFilterCount && hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                {inactiveFilters.length}
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
            <StatusFilterContent
              statusOptions={statusOptions}
              statusFilter={statusFilter}
              onStatusFilterChange={onStatusFilterChange}
              getStatusCount={getStatusCount}
              chipClassName={chipClassName}
              showClearButton={showClearButton}
              hasActiveFilters={hasActiveFilters}
              activeFilters={activeFilters}
              inactiveFilters={inactiveFilters}
              handleClearFilters={handleClearFilters}
              handleSelectAll={handleSelectAll}
              handleDeselectAll={handleDeselectAll}
              handleStatusToggle={handleStatusToggle}
              handleStatusRemove={handleStatusRemove}
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
        <FaCheckCircle className="text-gray-500" />
        {label}
        {showFilterCount && hasActiveFilters && (
          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
            {inactiveFilters.length}
          </span>
        )}
      </h3>
      <StatusFilterContent
        statusOptions={statusOptions}
        statusFilter={statusFilter}
        onStatusFilterChange={onStatusFilterChange}
        getStatusCount={getStatusCount}
        chipClassName={chipClassName}
        showClearButton={showClearButton}
        hasActiveFilters={hasActiveFilters}
        activeFilters={activeFilters}
        inactiveFilters={inactiveFilters}
        handleClearFilters={handleClearFilters}
        handleSelectAll={handleSelectAll}
        handleDeselectAll={handleDeselectAll}
        handleStatusToggle={handleStatusToggle}
        handleStatusRemove={handleStatusRemove}
      />
    </div>
  );
};

// Extracted content component for reuse
const StatusFilterContent = ({
  statusOptions,
  statusFilter,
  getStatusCount,
  chipClassName,
  showClearButton,
  hasActiveFilters,
  activeFilters,
  inactiveFilters,
  handleClearFilters,
  handleSelectAll,
  handleDeselectAll,
  handleStatusToggle,
  handleStatusRemove,
}) => {
  return (
    <div className="space-y-3">
      {/* Status Checkboxes */}
      <div className="space-y-2">
        {statusOptions.map((option) => (
          <label
            key={option.id}
            className="flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md cursor-pointer"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={statusFilter[option.id] || false}
                onChange={() => handleStatusToggle(option.id)}
                className="rounded text-blue-500 focus:ring-blue-500 mr-3"
              />
              <span>{option.label}</span>
            </div>
            {getStatusCount && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {getStatusCount(option.id)}
              </span>
            )}
          </label>
        ))}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700">
            Hidden statuses:
          </div>
          <div className="flex flex-wrap gap-2">
            {inactiveFilters.map((option) => (
              <div
                key={option.id}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm ${chipClassName}`}
              >
                <span>{option.label}</span>
                {getStatusCount && (
                  <span className="text-xs opacity-75">
                    ({getStatusCount(option.id)})
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    handleStatusRemove(option);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className="ml-1 hover:opacity-70 transition-opacity cursor-pointer text-xs p-0.5 rounded hover:bg-black/10"
                  aria-label={`Show ${option.label} status`}
                >
                  <FaTimes className="text-xs" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <div className="space-x-3">
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            className="text-sm text-red-500 hover:text-red-600"
          >
            Deselect All
          </button>
        </div>
        {showClearButton && (
          <button
            onClick={handleClearFilters}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
};

export default StatusFilter;
