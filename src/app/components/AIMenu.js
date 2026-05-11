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
  FaRobot,
  FaBrain,
  FaLightbulb,
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

const AIMenu = ({
  selectedNotations = [],
  externalLinkId,
  collectionId,
  onNotationsUpdated,
  onClose,
  isCollaborator = false,
}) => {
  const [activeTab, setActiveTab] = useState("bulk-update");

  // Bulk Update state
  const [textInput, setTextInput] = useState("");
  const [previewUpdates, setPreviewUpdates] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [selectedUpdates, setSelectedUpdates] = useState({});
  const [updatesExpanded, setUpdatesExpanded] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isGeneratingLocally, setIsGeneratingLocally] = useState(false);

  // Mutations
  const previewMutation = usePreviewBulkNotationUpdates();
  const confirmMutation = useConfirmBulkNotationUpdates();
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

      if (field === "highlighted") {
        return Boolean(beforeValue) !== Boolean(afterValue);
      }

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

      const updates = result.updates || result.preview || [];

      if (updates && updates.length > 0) {
        const transformedUpdates = updates
          .map((update) => {
            const originalNotation = selectedNotations.find(
              (notation) => notation.id === update.id
            );

            if (!originalNotation) {
              console.warn(
                `Could not find original notation for id: ${update.id}`
              );
              return null;
            }

            const before = { ...originalNotation };
            const after = { ...originalNotation, ...update };

            return {
              before,
              after,
              id: update.id,
            };
          })
          .filter(Boolean);

        setPreviewUpdates(transformedUpdates);
        setShowPreview(true);

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

      if (onNotationsUpdated) {
        onNotationsUpdated(
          result.notations ||
            result.updatedNotations ||
            selectedUpdatesList.map((u) => u.after)
        );
      }

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

      // Close the menu after successful update
      onClose();
    } catch (error) {
      console.error("Error updating notations:", error);
      toast.error("Failed to update notations");
    } finally {
      setIsConfirming(false);
    }
  };

  const tabs = [
    {
      id: "bulk-update",
      label: "Bulk Update",
      icon: FaMagic,
      disabled: selectedNotations.length === 0,
    },
  ];

  return (
    <div className="w-full max-h-[80vh] overflow-hidden flex flex-col">
      {/* Header with Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <FaRobot className="text-blue-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              AI Assistant
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 px-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600 bg-white"
                    : tab.disabled
                    ? "border-transparent text-gray-400 cursor-not-allowed"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
                {tab.disabled && (
                  <span className="text-xs text-gray-400 ml-1">(Soon)</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "bulk-update" && (
          <BulkUpdateTab
            selectedNotations={selectedNotations}
            textInput={textInput}
            setTextInput={setTextInput}
            generatePreview={generatePreview}
            isGeneratingLocally={isGeneratingLocally}
            previewMutation={previewMutation}
            showPreview={showPreview}
            setShowPreview={setShowPreview}
            previewUpdates={previewUpdates}
            selectedUpdates={selectedUpdates}
            updatesExpanded={updatesExpanded}
            setUpdatesExpanded={setUpdatesExpanded}
            selectAllUpdates={selectAllUpdates}
            deselectAllUpdates={deselectAllUpdates}
            editingIndex={editingIndex}
            setEditingIndex={setEditingIndex}
            updateAfterValue={updateAfterValue}
            toggleUpdateSelection={toggleUpdateSelection}
            hasChanges={hasChanges}
            categories={categories}
            statuses={statuses}
            filteredVisibilityOptions={filteredVisibilityOptions}
            confirmUpdates={confirmUpdates}
            isConfirming={isConfirming}
            confirmMutation={confirmMutation}
            onClose={onClose}
          />
        )}

        {activeTab === "smart-analysis" && (
          <div className="p-4 text-center text-gray-500">
            <FaBrain className="mx-auto text-2xl mb-2 text-gray-400" />
            <p className="text-sm">Smart Analysis coming soon...</p>
          </div>
        )}

        {activeTab === "suggestions" && (
          <div className="p-4 text-center text-gray-500">
            <FaLightbulb className="mx-auto text-2xl mb-2 text-gray-400" />
            <p className="text-sm">AI Suggestions coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Bulk Update Tab Component
const BulkUpdateTab = ({
  selectedNotations,
  textInput,
  setTextInput,
  generatePreview,
  isGeneratingLocally,
  previewMutation,
  showPreview,
  setShowPreview,
  previewUpdates,
  selectedUpdates,
  updatesExpanded,
  setUpdatesExpanded,
  selectAllUpdates,
  deselectAllUpdates,
  editingIndex,
  setEditingIndex,
  updateAfterValue,
  toggleUpdateSelection,
  hasChanges,
  categories,
  statuses,
  filteredVisibilityOptions,
  confirmUpdates,
  isConfirming,
  confirmMutation,
  onClose,
}) => {
  if (showPreview) {
    const selectedCount = Object.values(selectedUpdates).filter(Boolean).length;

    return (
      <div className="p-4 space-y-4">
        {/* Compact Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-200">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Review Updates
            </h4>
            <p className="text-xs text-gray-600">
              {selectedCount} of {previewUpdates.length} selected
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={selectAllUpdates}
              className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100"
            >
              All
            </button>
            <button
              onClick={deselectAllUpdates}
              className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100"
            >
              None
            </button>
          </div>
        </div>

        {/* Updates List */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
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
              onUpdate={(field, value) => updateAfterValue(index, field, value)}
              categories={categories}
              statuses={statuses}
              visibilityOptions={filteredVisibilityOptions}
              hasChanges={hasChanges(update.before, update.after)}
              compact={true}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3 border-t border-gray-200">
          <button
            onClick={() => setShowPreview(false)}
            className="flex-1 px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded text-xs hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={confirmUpdates}
            disabled={
              isConfirming || confirmMutation.isLoading || selectedCount === 0
            }
            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConfirming || confirmMutation.isLoading ? (
              <>
                <FaSpinner className="animate-spin inline mr-1" />
                Updating...
              </>
            ) : (
              <>Update {selectedCount}</>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Selected Notations Summary */}
      <div className="bg-blue-50 rounded-lg p-3">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Selected Notations ({selectedNotations?.length || 0})
        </h4>
        <div className="space-y-1 max-h-20 overflow-y-auto">
          {selectedNotations?.slice(0, 3).map((notation) => (
            <div key={notation.id} className="text-xs text-gray-700">
              <span className="font-medium">{notation.title}</span>
              {notation.date && (
                <span className="text-gray-500 ml-2">
                  • {formatLongDate(notation.date)}
                </span>
              )}
            </div>
          ))}
          {selectedNotations?.length > 3 && (
            <div className="text-xs text-gray-500">
              ...and {selectedNotations.length - 3} more
            </div>
          )}
        </div>
      </div>

      {/* Instructions Input */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">
          Instructions for updating these notations:
        </label>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          className="w-full h-20 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., 'Move all dates to next week and mark as completed' or 'Change status to In Progress and add completion notes'"
        />
      </div>

      {/* Generate Button */}
      <button
        onClick={generatePreview}
        disabled={
          isGeneratingLocally ||
          previewMutation.isLoading ||
          !textInput.trim() ||
          !selectedNotations?.length
        }
        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isGeneratingLocally || previewMutation.isLoading ? (
          <>
            <FaSpinner className="animate-spin mr-2" />
            Generating...
          </>
        ) : (
          <>
            <FaMagic className="mr-2" />
            Preview Updates
          </>
        )}
      </button>
    </div>
  );
};

// Compact Update Comparison Card
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
  compact = false,
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
      <div className="flex items-center gap-1 text-xs">
        <span className="font-medium text-gray-600 w-12 text-right">
          {label}:
        </span>
        {!isEditing && isDifferent && (
          <>
            <span className="text-red-600 line-through bg-red-50 px-1 py-0.5 rounded">
              {renderValue(beforeValue)}
            </span>
            <FaArrowRight className="text-gray-400 text-xs" />
            <span className="text-green-600 bg-green-50 px-1 py-0.5 rounded font-medium">
              {renderValue(afterValue, true)}
            </span>
          </>
        )}
      </div>
    );
  };

  if (isEditing) {
    return (
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <div className="flex justify-between items-center mb-3">
          <h5 className="text-xs font-semibold text-gray-900">Edit Notation</h5>
          <div className="flex gap-1">
            <button
              onClick={onEdit}
              className="px-2 py-1 text-green-700 bg-green-100 border border-green-300 rounded text-xs"
            >
              <FaCheck />
            </button>
            <button
              onClick={onEdit}
              className="px-2 py-1 text-gray-700 bg-white border border-gray-300 rounded text-xs"
            >
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="text"
            value={after.title || ""}
            onChange={(e) => onUpdate("title", e.target.value)}
            className="w-full p-1.5 border border-gray-300 rounded text-xs"
            placeholder="Title..."
          />

          <div className="grid grid-cols-2 gap-2">
            <select
              value={after.category || ""}
              onChange={(e) => onUpdate("category", e.target.value)}
              className="w-full p-1.5 border border-gray-300 rounded text-xs"
            >
              <option value="">Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              value={after.status || ""}
              onChange={(e) => onUpdate("status", e.target.value)}
              className="w-full p-1.5 border border-gray-300 rounded text-xs"
            >
              <option value="">Status</option>
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded border transition-all ${
        hasChanges
          ? isSelected
            ? "border-blue-400 ring-1 ring-blue-100 bg-blue-50/30"
            : "border-gray-200 hover:border-gray-300"
          : "border-gray-100 bg-gray-50"
      }`}
    >
      <div className="p-2">
        <div className="flex justify-between items-start mb-1">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              disabled={!hasChanges}
              className="w-3 h-3 text-blue-600 rounded"
            />
            <div className="min-w-0 flex-1">
              <h5 className="text-xs font-semibold text-gray-900 truncate">
                {before.title}
              </h5>
              {hasChanges && (
                <span className="text-xs text-blue-600">
                  {
                    Object.keys(after).filter(
                      (key) =>
                        String(before[key] || "") !== String(after[key] || "")
                    ).length
                  }{" "}
                  changes
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onEdit}
            className="px-1.5 py-0.5 text-blue-600 bg-blue-50 border border-blue-200 rounded text-xs"
          >
            <FaEdit className="w-2.5 h-2.5" />
          </button>
        </div>

        {hasChanges && (
          <div className="space-y-0.5 border-t border-gray-100 pt-1">
            <FieldComparison
              label="Title"
              beforeValue={before.title}
              afterValue={after.title}
              isDifferent={
                String(before.title || "") !== String(after.title || "")
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
              label="Status"
              beforeValue={before.status}
              afterValue={after.status}
              isDifferent={
                String(before.status || "") !== String(after.status || "")
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMenu;
