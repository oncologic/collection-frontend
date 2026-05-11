"use client";

import { useState } from "react";
import { useRateResource } from "../hooks/useResources";
import { IoInformationCircleOutline } from "react-icons/io5";

export const SENSITIVITY_LEVELS = [
  {
    value: 1,
    label: "Low",
    color:
      "bg-green-100 border border-green-200 hover:bg-green-200 text-green-600",
  },
  {
    value: 2,
    label: "Intermediate",
    color:
      "bg-yellow-100 border border-yellow-200  hover:bg-yellow-200 text-yellow-600",
  },
  {
    value: 3,
    label: "High",
    color: "bg-red-100 border border-red-200 hover:bg-red-200 text-red-600",
  },
];

export const ResourceSensitivityRating = ({ resourceId, initialRating }) => {
  const [selectedRating, setSelectedRating] = useState(initialRating);
  const [ratingReason, setRatingReason] = useState("");
  const { mutate: submitRating, isLoading } = useRateResource();

  const handleRatingClick = (sensitivity) => {
    if (isLoading) return;
    setSelectedRating(sensitivity);
    if (sensitivity !== selectedRating) {
      setRatingReason(""); // Reset reason when changing rating
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRating) {
      submitRating({
        resourceId,
        sensitivity: selectedRating,
        reason: ratingReason.trim(),
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Distress Rating</span>
              <div className="relative group">
                <IoInformationCircleOutline className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-help" />
                <div className="absolute z-50 left-1/2 bottom-full mb-2 hidden group-hover:block -translate-x-1/2">
                  <div className="bg-white text-gray-600 rounded-lg p-3 shadow-lg w-64 border border-gray-200">
                    <div className="text-sm leading-relaxed">
                      Could this information be distressing for those affected
                      by cancer?
                      <br />
                      <br />
                      <span className="text-green-600 font-medium">Low</span>:
                      doesn&apos;t contain sensitive information
                      <br />
                      <span className="text-red-600 font-medium">High</span>:
                      may contain distressing information
                    </div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r border-b border-gray-200 transform rotate-45"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {SENSITIVITY_LEVELS.map(({ value, label, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleRatingClick(value)}
                  disabled={isLoading}
                  className={`
                    px-4 py-2 rounded-full text-sm font-medium transition-all
                    ${color}
                    ${
                      selectedRating === value
                        ? "ring-2 ring-offset-1 ring-blue-300"
                        : ""
                    }
                    ${
                      isLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:scale-105"
                    }
                  `}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {selectedRating && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ratingReason}
                  onChange={(e) => setRatingReason(e.target.value)}
                  placeholder="Why did you choose this rating? (Optional)"
                  className="flex-1 px-2 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`
                    px-3 py-1 bg-blue-500 text-white rounded-md text-sm font-medium
                    ${
                      isLoading
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-600"
                    }
                  `}
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
