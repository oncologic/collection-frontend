import React, { useState, useRef, useEffect } from "react";
import {
  FaMagic,
  FaSpinner,
  FaEdit,
  FaTimes,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
  FaArrowRight,
  FaUndoAlt,
} from "react-icons/fa";
import {
  usePreviewBulkNotationUpdates,
  useConfirmBulkNotationUpdates,
} from "../hooks/useAI";
import { toast } from "react-hot-toast";
import { formatLongDate, formatDayOfWeek } from "@/app/utils/general";
import { formatTimeDisplay } from "./events/CalendarView";
import { useQueryClient } from "@tanstack/react-query";

const categories = [
  { id: "Idea", name: "Idea" },
  { id: "Action", name: "Action" },
  { id: "Thought", name: "Thought" },
  { id: "Question", name: "Question" },
  { id: "Observation", name: "Observation" },
];

const statuses = [
  { id: "Pending", name: "Pending" },
  { id: "In Progress", name: "In Progress" },
  { id: "Waiting", name: "Waiting" },
  { id: "Completed", name: "Completed" },
  { id: "Cancelled", name: "Cancelled" },
  { id: "Archived", name: "Archived" },
];

const visibilityOptions = [
  { id: "private", name: "Only Me" },
  { id: "unlisted", name: "Collaborators" },
  { id: "public", name: "Public" },
];

// Helper function to format time to AM/PM
const formatTimeToAMPM = (timeString) => {
  if (!timeString) return "";
  try {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes || "00"} ${ampm}`;
  } catch (e) {
    return timeString;
  }
};

// Helper function to format date with day of week
const formatDateWithDay = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString + "T00:00:00");
    const options = {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  } catch (e) {
    return dateString;
  }
};

const AIBulkUpdates = ({
  selectedNotations,
  externalLinkId,
  collectionId,
  onNotationsUpdated,
  onCancel,
  isCollaborator = false,
}) => {
  // Text input state
  const [textInput, setTextInput] = useState("");

  // Preview state
  const [previewUpdates, setPreviewUpdates] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedUpdates, setSelectedUpdates] = useState({});
  const [updatesExpanded, setUpdatesExpanded] = useState(true);

  // Add local loading states
  const [isConfirming, setIsConfirming] = useState(false);
  const [isGeneratingLocally, setIsGeneratingLocally] = useState(false);

  // Mutations
  const previewMutation = usePreviewBulkNotationUpdates();
  const confirmMutation = useConfirmBulkNotationUpdates();

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Filter visibility options based on user role
  const filteredVisibilityOptions = visibilityOptions.filter(
    (option) => !isCollaborator || option.id !== "public"
  );

  // Initialize selected updates when preview is shown
  useEffect(() => {
    if (showPreview && previewUpdates.length > 0) {
      const initialSelected = {};
      previewUpdates.forEach((update, index) => {
        // Only auto-select updates that have actual changes
        if (hasChanges(update.before, update.after)) {
          initialSelected[index] = true;
        }
      });
      setSelectedUpdates(initialSelected);
    }
  }, [showPreview, previewUpdates]);

  // Helper function to check if there are actual changes
  const hasChanges = (before, after) => {
    const fieldsToCheck = [
      "title",
      "notes",
      "category",
      "status",
      "date",
      "startTime",
      "endTime",
      "highlighted",
      "visibility",
    ];
    return fieldsToCheck.some((field) => {
      const beforeValue = before[field];
      const afterValue = after[field];

      // Handle special cases
      if (field === "highlighted") {
        return Boolean(beforeValue) !== Boolean(afterValue);
      }

      // For other fields, do string comparison
      return String(beforeValue || "") !== String(afterValue || "");
    });
  };

  // AI Preview
  const generatePreview = async () => {
    if (!textInput.trim()) {
      toast.error("Please enter instructions for updating the notations");
      return;
    }

    if (!selectedNotations || selectedNotations.length === 0) {
      toast.error("No notations selected for update");
      return;
    }

    setIsGeneratingLocally(true);

    try {
      const result = await previewMutation.mutateAsync({
        prompt: textInput.trim(),
        existingNotations: selectedNotations,
        externalLinkId,
        collectionId,
        contextDetails: {
          updateMode: true,
          selectedCount: selectedNotations.length,
        },
      });

      // Handle the API response structure
      const updates = result.updates || result.preview || [];

      if (updates && updates.length > 0) {
        // Transform the API response to match the expected format
        const transformedUpdates = updates
          .map((update) => {
            // Find the corresponding original notation
            const originalNotation = selectedNotations.find(
              (notation) => notation.id === update.id
            );

            if (!originalNotation) {
              console.warn(
                `Could not find original notation for id: ${update.id}`
              );
              return null;
            }

            // Create before and after objects
            const before = { ...originalNotation };

            // Safely merge update, filtering out undefined values to prevent controlled/uncontrolled input issues
            const safeUpdate = {};
            Object.keys(update).forEach((key) => {
              if (update[key] !== undefined && update[key] !== null) {
                safeUpdate[key] = update[key];
              }
            });

            const after = { ...originalNotation, ...safeUpdate };

            return {
              before,
              after,
              id: update.id,
            };
          })
          .filter(Boolean); // Remove any null entries

        setPreviewUpdates(transformedUpdates);
        setShowPreview(true);

        // Show the AI's message if available
        if (result.message) {
          toast.success(result.message);
        }
      } else {
        toast.error(
          "No updates generated. Try being more specific in your instructions."
        );
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      toast.error("Failed to generate update preview");
    } finally {
      setIsGeneratingLocally(false);
    }
  };

  // Preview editing
  const updateAfterValue = (index, field, value) => {
    setPreviewUpdates((prev) =>
      prev.map((update, i) =>
        i === index
          ? {
              ...update,
              after: { ...update.after, [field]: value },
            }
          : update
      )
    );
  };

  // Toggle selection of updates
  const toggleUpdateSelection = (index) => {
    setSelectedUpdates((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const selectAllUpdates = () => {
    const allSelected = {};
    previewUpdates.forEach((update, index) => {
      if (hasChanges(update.before, update.after)) {
        allSelected[index] = true;
      }
    });
    setSelectedUpdates(allSelected);
  };

  const deselectAllUpdates = () => {
    setSelectedUpdates({});
  };

  // Confirm updates
  const confirmUpdates = async () => {
    const selectedUpdatesList = previewUpdates.filter(
      (_, index) => selectedUpdates[index]
    );

    if (selectedUpdatesList.length === 0) {
      toast.error("No updates selected");
      return;
    }

    // Prevent double-clicks
    if (isConfirming || confirmMutation.isLoading) {
      return;
    }

    setIsConfirming(true);

    try {
      const result = await confirmMutation.mutateAsync({
        updates: selectedUpdatesList,
        externalLinkId,
        collectionId,
      });

      const updatedCount = result.updatedCount || selectedUpdatesList.length;

      // Always call the onNotationsUpdated callback first to update the parent component
      if (onNotationsUpdated) {
        onNotationsUpdated(
          result.notations ||
            result.updatedNotations ||
            selectedUpdatesList.map((u) => u.after)
        );
      }

      // Invalidate relevant queries to refresh the UI
      await queryClient.invalidateQueries({
        queryKey: ["externalLinkNotations"],
      });

      if (externalLinkId) {
        await queryClient.invalidateQueries({
          queryKey: ["externalLinkById", externalLinkId],
        });
      }

      if (collectionId) {
        await queryClient.invalidateQueries({
          queryKey: ["collectionById", collectionId],
        });
      }
    } catch (error) {
      console.error("Error updating notations:", error);
      toast.error("Failed to update notations");
    } finally {
      setIsConfirming(false);
    }
  };

  if (showPreview) {
    const selectedCount = Object.values(selectedUpdates).filter(Boolean).length;

    return (
      <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-lg shadow-xl border border-gray-200 p-4 max-w-5xl mx-auto max-h-[80vh] overflow-hidden flex flex-col">
        {/* Compact Header */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Review AI Updates
            </h2>
            <p className="text-sm text-gray-600">
              Review and customize bulk notation updates
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200">
              <span className="text-xs font-medium text-gray-600">
                Selected
              </span>
              <div className="text-lg font-bold text-blue-600">
                {selectedCount}
              </div>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-md shadow-sm border border-gray-200">
              <span className="text-xs font-medium text-gray-600">Total</span>
              <div className="text-lg font-bold text-gray-800">
                {previewUpdates.length}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {/* Compact Updates Section */}
          <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <button
                onClick={() => setUpdatesExpanded(!updatesExpanded)}
                className="flex items-center gap-3 hover:bg-white/50 transition-all duration-200 rounded-md p-2"
              >
                <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center">
                  {updatesExpanded ? (
                    <FaChevronUp className="text-blue-600 text-sm" />
                  ) : (
                    <FaChevronDown className="text-blue-600 text-sm" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    Proposed Updates
                  </h3>
                  <p className="text-xs text-gray-600">
                    {previewUpdates.length}{" "}
                    {previewUpdates.length === 1
                      ? "notification"
                      : "notifications"}{" "}
                    ready
                  </p>
                </div>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={selectAllUpdates}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllUpdates}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {updatesExpanded && (
              <div className="p-3 space-y-3 max-h-80 overflow-y-auto bg-gray-50">
                {previewUpdates.map((update, index) => (
                  <UpdateComparisonCard
                    key={index}
                    update={update}
                    index={index}
                    isSelected={selectedUpdates[index]}
                    isEditing={editingIndex === index}
                    onToggleSelection={() => toggleUpdateSelection(index)}
                    onEdit={() =>
                      setEditingIndex(editingIndex === index ? null : index)
                    }
                    onUpdate={(field, value) =>
                      updateAfterValue(index, field, value)
                    }
                    categories={categories}
                    statuses={statuses}
                    visibilityOptions={filteredVisibilityOptions}
                    hasChanges={hasChanges(update.before, update.after)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Compact Action Bar */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200 bg-white rounded-md p-3 shadow-sm">
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(false)}
              disabled={isConfirming || confirmMutation.isLoading}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
            >
              Back to Edit
            </button>
            <button
              onClick={onCancel}
              disabled={isConfirming || confirmMutation.isLoading}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
            >
              Cancel
            </button>
          </div>
          <button
            onClick={confirmUpdates}
            disabled={
              isConfirming || confirmMutation.isLoading || selectedCount === 0
            }
            className="flex items-center px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md text-sm font-medium"
          >
            {(isConfirming || confirmMutation.isLoading) && (
              <FaSpinner className="animate-spin mr-2" />
            )}
            {isConfirming || confirmMutation.isLoading ? (
              "Updating..."
            ) : (
              <>
                <FaCheck className="mr-1.5" />
                Update {selectedCount} Notation{selectedCount !== 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-6 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          AI Bulk Updates
        </h2>
      </div>

      {/* Selected Notations Summary */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Selected Notations ({selectedNotations?.length || 0})
        </h3>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {selectedNotations?.map((notation) => (
            <div key={notation.id} className="text-sm text-gray-700">
              <span className="font-medium">{notation.title}</span>
              {notation.date && (
                <span className="text-gray-500 ml-2">
                  • {formatLongDate(notation.date)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Instructions Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Instructions for updating these notations:
        </label>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 'Move all meeting dates by 1 week later and update the status to In Progress' or 'Change all Action items to Completed status and add notes about being finished'"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={generatePreview}
          disabled={
            isGeneratingLocally ||
            previewMutation.isLoading ||
            !textInput.trim() ||
            !selectedNotations?.length
          }
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[180px] justify-center"
        >
          {(isGeneratingLocally || previewMutation.isLoading) && (
            <FaSpinner className="animate-spin mr-2" />
          )}
          {isGeneratingLocally || previewMutation.isLoading ? (
            "Generating..."
          ) : (
            <>
              <FaMagic className="mr-2" />
              Preview Updates
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Update Comparison Card Component
const UpdateComparisonCard = ({
  update,
  index,
  isSelected,
  isEditing,
  onToggleSelection,
  onEdit,
  onUpdate,
  categories,
  statuses,
  visibilityOptions,
  hasChanges,
}) => {
  const { before, after } = update;

  const FieldComparison = ({
    label,
    beforeValue,
    afterValue,
    isDifferent,
    type = "text",
  }) => {
    if (!isDifferent && !isEditing) return null;

    const renderValue = (value, isAfter = false) => {
      if (type === "date" && value) {
        return formatDateWithDay(value);
      }
      if (type === "time" && value) {
        return formatTimeToAMPM(value);
      }
      if (type === "boolean") {
        return value ? "Yes" : "No";
      }
      return value || "—";
    };

    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium text-gray-600 w-16 text-right">
          {label}:
        </span>
        {!isEditing && isDifferent && (
          <>
            <span className="text-red-600 line-through bg-red-50 px-2 py-0.5 rounded">
              {renderValue(beforeValue)}
            </span>
            <FaArrowRight className="text-gray-400 text-xs" />
            <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded font-medium">
              {renderValue(afterValue, true)}
            </span>
          </>
        )}
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
              <FaEdit className="text-blue-600 text-xs" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Edit Notation
              </h3>
              <p className="text-xs text-gray-600">Customize fields</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="flex items-center px-3 py-1 text-green-700 bg-green-100 border border-green-300 rounded hover:bg-green-200 transition-all duration-200 text-xs"
            >
              <FaCheck className="mr-1" />
              Save
            </button>
            <button
              onClick={onEdit}
              className="flex items-center px-3 py-1 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-all duration-200 text-xs"
            >
              <FaTimes className="mr-1" />
              Cancel
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={after?.title || ""}
              onChange={(e) => onUpdate("title", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Enter title..."
            />
          </div>

          {/* Category and Status Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={after?.category || ""}
                onChange={(e) => onUpdate("category", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={after?.status || ""}
                onChange={(e) => onUpdate("status", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="">Select Status</option>
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={after?.date || ""}
                onChange={(e) => onUpdate("date", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={after?.startTime || ""}
                onChange={(e) => onUpdate("startTime", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={after?.endTime || ""}
                onChange={(e) => onUpdate("endTime", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={after?.notes || ""}
              onChange={(e) => onUpdate("notes", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              rows="2"
              placeholder="Enter notes..."
            />
          </div>

          {/* Settings Row */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={Boolean(after?.highlighted)}
                onChange={(e) => onUpdate("highlighted", e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span>Highlighted</span>
            </label>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">
                Visibility:
              </label>
              <select
                value={after?.visibility || ""}
                onChange={(e) => onUpdate("visibility", e.target.value)}
                className="p-1 border border-gray-300 rounded text-xs"
              >
                <option value="">Select</option>
                {visibilityOptions.map((vis) => (
                  <option key={vis.id} value={vis.id}>
                    {vis.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-editing view - much more compact
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border transition-all duration-200 ${
        hasChanges
          ? isSelected
            ? "border-blue-400 ring-2 ring-blue-100 bg-blue-50/30"
            : "border-gray-200 hover:border-gray-300 hover:shadow-md"
          : "border-gray-100 bg-gray-50"
      }`}
    >
      <div className="p-3">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelection}
                disabled={!hasChanges}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 disabled:opacity-50"
              />
              {hasChanges && (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full"></div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {before.title}
              </h4>
              <div className="flex items-center gap-2 mt-0.5">
                {!hasChanges ? (
                  <span className="text-xs text-gray-500 italic">
                    No changes needed
                  </span>
                ) : (
                  <span className="text-xs text-blue-600 font-medium">
                    {
                      Object.keys(after).filter(
                        (key) =>
                          String(before[key] || "") !== String(after[key] || "")
                      ).length
                    }{" "}
                    field
                    {Object.keys(after).filter(
                      (key) =>
                        String(before[key] || "") !== String(after[key] || "")
                    ).length !== 1
                      ? "s"
                      : ""}{" "}
                    updated
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-2 py-1 text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-all duration-200 text-xs"
          >
            <FaEdit className="w-3 h-3" />
            <span className="hidden sm:inline">Edit</span>
          </button>
        </div>

        {hasChanges && (
          <div className="space-y-2 border-t border-gray-100 pt-2">
            <div className="space-y-1">
              <FieldComparison
                label="Title"
                beforeValue={before.title}
                afterValue={after.title}
                isDifferent={
                  String(before.title || "") !== String(after.title || "")
                }
              />
              <FieldComparison
                label="Category"
                beforeValue={before.category}
                afterValue={after.category}
                isDifferent={
                  String(before.category || "") !== String(after.category || "")
                }
              />
              <FieldComparison
                label="Status"
                beforeValue={before.status}
                afterValue={after.status}
                isDifferent={
                  String(before.status || "") !== String(after.status || "")
                }
              />
              <FieldComparison
                label="Date"
                beforeValue={before.date}
                afterValue={after.date}
                isDifferent={
                  String(before.date || "") !== String(after.date || "")
                }
                type="date"
              />
              <FieldComparison
                label="Start"
                beforeValue={before.startTime}
                afterValue={after.startTime}
                isDifferent={
                  String(before.startTime || "") !==
                  String(after.startTime || "")
                }
                type="time"
              />
              <FieldComparison
                label="End"
                beforeValue={before.endTime}
                afterValue={after.endTime}
                isDifferent={
                  String(before.endTime || "") !== String(after.endTime || "")
                }
                type="time"
              />
              {Boolean(before.highlighted) !== Boolean(after.highlighted) && (
                <FieldComparison
                  label="Star"
                  beforeValue={Boolean(before.highlighted)}
                  afterValue={Boolean(after.highlighted)}
                  isDifferent={true}
                  type="boolean"
                />
              )}
            </div>

            {/* Compact notes comparison */}
            {String(before.notes || "") !== String(after.notes || "") && (
              <div className="text-xs">
                <span className="font-medium text-gray-600">Notes:</span>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-red-600 line-through bg-red-50 px-1 py-0.5 rounded text-xs max-w-[120px] truncate">
                    {before.notes || "None"}
                  </span>
                  <FaArrowRight className="text-gray-400 text-xs" />
                  <span className="text-green-600 bg-green-50 px-1 py-0.5 rounded text-xs max-w-[120px] truncate">
                    {after.notes || "None"}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compact Status Tags */}
        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {after.category || before.category || "No Category"}
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            {(after.status || before.status || "Pending")
              .charAt(0)
              .toUpperCase() +
              (after.status || before.status || "Pending").slice(1)}
          </span>
          {(after.date || before.date) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              {formatDateWithDay(after.date || before.date)}
            </span>
          )}
          {(after.startTime || before.startTime) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
              {formatTimeToAMPM(after.startTime || before.startTime)}
              {(after.endTime || before.endTime) &&
                ` - ${formatTimeToAMPM(after.endTime || before.endTime)}`}
            </span>
          )}
          {(Boolean(after.highlighted) || Boolean(before.highlighted)) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              ⭐
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIBulkUpdates;
