"use client";
import React from "react";

const TrialMapLegend = ({ className = "", selectionMode = false }) => {
  const legendItems = [
    {
      fillColor: "#10B981",
      strokeColor: "#065F46",
      label: "Recruiting",
      description: "Currently accepting participants",
    },
    {
      fillColor: "#3B82F6",
      strokeColor: "#1E40AF",
      label: "Active",
      description: "Active but not recruiting",
    },
    {
      fillColor: "#8B5CF6",
      strokeColor: "#5B21B6",
      label: "Completed",
      description: "Study has been completed",
    },
    {
      fillColor: "#6B7280",
      strokeColor: "#374151",
      label: "Other",
      description: "Terminated, suspended, or unknown status",
    },
  ];

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}
    >
      <h3 className="text-sm font-medium text-gray-900 mb-3">Map Legend</h3>
      <div className="space-y-2">
        {legendItems.map((item, index) => (
          <div key={index} className="flex items-center">
            <div
              className="w-5 h-5 rounded-full border-2 mr-3 flex-shrink-0 relative"
              style={{
                backgroundColor: item.fillColor,
                borderColor: item.strokeColor,
              }}
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                {item.label}
              </div>
              <div className="text-xs text-gray-600">{item.description}</div>
            </div>
          </div>
        ))}
      </div>

      {selectionMode && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex items-center mb-2">
            <div
              className="w-6 h-6 rounded-full border-2 mr-3 flex-shrink-0 relative"
              style={{
                backgroundColor: "#10B981",
                borderColor: "#F59E0B",
                borderWidth: "3px",
              }}
            >
              <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              <svg
                className="absolute inset-0 w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M9 12l2 2 4-4"
                  stroke="#F59E0B"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">
                Selected Trial
              </div>
              <div className="text-xs text-gray-600">
                Orange border with checkmark
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Click on any marker to view trial details and access more information.
          {selectionMode &&
            " Use the Select/Deselect button to add trials to your collection."}
        </p>
      </div>
    </div>
  );
};

export default TrialMapLegend;
