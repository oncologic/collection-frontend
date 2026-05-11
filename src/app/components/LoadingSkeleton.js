// src/app/components/LoadingSkeleton.js
import React from "react";

const LoadingSkeleton = ({
  lines = 3,
  height = "20px",
  width = "100%",
  spacing = "1rem",
  variant = "default", // "default", "collection-card", "collection-list"
  count = 1,
}) => {
  if (variant === "collection-card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col h-[420px] bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden animate-pulse"
          >
            {/* Header gradient skeleton */}
            <div className="h-[120px] bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-2xl relative">
              {/* Badges skeleton */}
              <div className="absolute top-5 left-4 flex gap-2">
                <div className="h-6 w-16 bg-white/60 rounded-full"></div>
                <div className="h-6 w-12 bg-white/60 rounded-full"></div>
              </div>
              {/* Icon skeleton */}
              <div className="absolute top-6 right-6 h-12 w-12 bg-white/40 rounded-lg"></div>
              {/* Date skeleton */}
              <div className="absolute bottom-4 left-4">
                <div className="h-3 w-20 bg-white/60 rounded mb-1"></div>
                <div className="h-2 w-24 bg-white/40 rounded"></div>
              </div>
            </div>

            {/* Content area skeleton */}
            <div className="flex flex-col flex-1 p-4">
              {/* Title skeleton */}
              <div className="mb-3">
                <div className="h-6 bg-gray-200 rounded-lg mb-2"></div>
                <div className="h-6 bg-gray-200 rounded-lg w-3/4"></div>
              </div>

              {/* Hashtags skeleton */}
              <div className="flex gap-2 mb-3">
                <div className="h-6 w-16 bg-gray-100 rounded-lg"></div>
                <div className="h-6 w-20 bg-gray-100 rounded-lg"></div>
                <div className="h-6 w-12 bg-gray-100 rounded-lg"></div>
              </div>

              {/* Description skeleton */}
              <div className="mb-3">
                <div className="h-4 bg-gray-100 rounded mb-2"></div>
                <div className="h-4 bg-gray-100 rounded mb-2 w-5/6"></div>
                <div className="h-4 bg-gray-100 rounded w-2/3"></div>
              </div>

              {/* Resources skeleton */}
              <div className="flex-1 mb-4 space-y-2">
                <div className="h-10 bg-gray-50 rounded-lg border border-gray-100"></div>
                <div className="h-10 bg-gray-50 rounded-lg border border-gray-100"></div>
                <div className="h-10 bg-gray-50 rounded-lg border border-gray-100"></div>
              </div>

              {/* Action buttons skeleton */}
              <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
                <div className="h-8 w-8 bg-gray-100 rounded-lg"></div>
                <div className="flex-1 h-10 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "collection-list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 animate-pulse"
          >
            <div className="flex items-center">
              {/* Expand icon skeleton */}
              <div className="h-4 w-4 bg-gray-200 rounded mr-4"></div>

              {/* Content skeleton */}
              <div className="flex-1">
                {/* Badges skeleton */}
                <div className="flex gap-2 mb-2">
                  <div className="h-6 w-16 bg-gray-100 rounded-lg"></div>
                  <div className="h-6 w-12 bg-gray-100 rounded-lg"></div>
                  <div className="h-6 w-14 bg-gray-100 rounded-lg"></div>
                </div>
                {/* Title skeleton */}
                <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-1"></div>
                {/* Description skeleton */}
                <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              </div>

              {/* Actions skeleton */}
              <div className="flex gap-3">
                <div className="h-8 w-8 bg-gray-100 rounded-lg"></div>
                <div className="h-8 w-8 bg-gray-100 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default skeleton
  return (
    <div className="min-h-1/2 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-8 md:w-5/6 w-full">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="bg-gray-200 rounded animate-pulse"
            style={{
              height,
              width: typeof width === "number" ? `${width}%` : width,
              marginTop: index === 0 ? 0 : spacing,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
