import React from "react";
import {
  FaTimes,
  FaExclamationTriangle,
  FaTrash,
  FaUsers,
  FaFolder,
} from "react-icons/fa";

const DowngradeCleanupModal = ({
  isOpen,
  onClose,
  cleanupSuggestions,
  targetPlan,
  onProceed,
}) => {
  if (!isOpen) return null;

  const getIconForType = (type) => {
    switch (type) {
      case "external_collections":
        return <FaFolder className="w-5 h-5 text-orange-500" />;
      case "attachments":
        return <FaTrash className="w-5 h-5 text-red-500" />;
      case "collaborators":
        return <FaUsers className="w-5 h-5 text-blue-500" />;
      default:
        return <FaExclamationTriangle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Cleanup Required for Downgrade
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FaExclamationTriangle className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-gray-600">
                To downgrade to the <strong>{targetPlan?.displayName}</strong>{" "}
                plan, you need to complete the following actions:
              </span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {cleanupSuggestions?.suggestions?.map((suggestion, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getPriorityColor(
                  suggestion.priority
                )}`}
              >
                <div className="flex items-start gap-3">
                  {getIconForType(suggestion.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">
                      {suggestion.message}
                    </p>
                    {suggestion.count && (
                      <p className="text-xs opacity-75">
                        Action required: {suggestion.action} {suggestion.count}{" "}
                        items
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Once you complete these actions, you can
              return to this page and downgrade to the {targetPlan?.displayName}{" "}
              plan.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              I&apos;ll Clean Up Later
            </button>
            <button
              onClick={() => {
                onClose();
                // You could add navigation to help users clean up
                // For example, navigate to collections page
              }}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Help Me Clean Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DowngradeCleanupModal;
