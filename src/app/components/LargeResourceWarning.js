"use client";
import React from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle } from "react-icons/fi";

const LargeResourceWarning = ({
  largeResources,
  onCancel,
  onConfirm,
  isOpen,
}) => {
  if (!isOpen) return null;

  // Create portal to render at the document root
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-slate-600/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-2xl border border-gray-100 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-orange-100 rounded-full">
            <FiAlertTriangle className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Large Resource Warning
            </h2>
            <p className="text-gray-500 mt-1">
              Some resources exceed our recommended size limit
            </p>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-6">
          <p className="text-gray-700 mb-4">
            The following resources are very large (&gt;70,000 tokens) and may
            significantly impact performance and costs:
          </p>
          <ul className="space-y-3">
            {largeResources.map((resource) => (
              <li
                key={resource.id}
                className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200"
              >
                <span className="text-gray-700 font-medium">
                  {resource.title}
                </span>
                <span className="text-orange-600 text-sm">
                  {resource.tokenCount.toLocaleString()} tokens
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-200 
            font-medium transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
            font-medium transition-colors duration-200 shadow-sm"
          >
            Add Anyway
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default LargeResourceWarning;
