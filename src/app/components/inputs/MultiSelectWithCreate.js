"use client";
import { useState, useRef, useEffect } from "react";
import { FaPlus, FaTimes, FaCheck } from "react-icons/fa";
import MultiSelect from "./MultiSelect";

// Color palette for new tags
const TAG_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F97316", // Orange
  "#6366F1", // Indigo
  "#84CC16", // Lime
];

function getRandomColor() {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

export default function MultiSelectWithCreate({
  id,
  name,
  label,
  options = [],
  value = [],
  onChange,
  required = false,
  placeholder = "Select options",
  onCreate,
  createPlaceholder = "Create new tag...",
  isCreating = false,
  showVisibilityOptions = false,
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [selectedColor, setSelectedColor] = useState(getRandomColor());
  const [selectedVisibility, setSelectedVisibility] = useState("tenant");
  const createInputRef = useRef(null);

  useEffect(() => {
    if (showCreateForm && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [showCreateForm]);

  const handleCreate = async () => {
    if (!newItemName.trim() || !onCreate) return;
    
    await onCreate({
      name: newItemName.trim(),
      color: selectedColor,
      visibility: selectedVisibility,
    });
    setNewItemName("");
    setSelectedColor(getRandomColor());
    setSelectedVisibility("tenant");
    setShowCreateForm(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreate();
    } else if (e.key === "Escape") {
      setShowCreateForm(false);
      setNewItemName("");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {onCreate && !showCreateForm && (
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800"
          >
            <FaPlus className="h-3 w-3 mr-1" />
            Create new
          </button>
        )}
      </div>
      
      {showCreateForm && (
        <div className="mb-3 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex gap-2">
            <input
              ref={createInputRef}
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={createPlaceholder}
              className="block flex-1 py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              disabled={isCreating}
            />
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {TAG_COLORS.slice(0, 5).map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full border-2 ${
                      selectedColor === color
                        ? "border-gray-800 scale-110"
                        : "border-gray-300"
                    }`}
                    style={{ backgroundColor: color }}
                    title={`Select color ${color}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newItemName.trim() || isCreating}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Create"
              >
                {isCreating ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                ) : (
                  <FaCheck className="h-3 w-3" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewItemName("");
                  setSelectedColor(getRandomColor());
                }}
                disabled={isCreating}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                title="Cancel"
              >
                <FaTimes className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>Preview:</span>
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-white font-medium"
                style={{ backgroundColor: selectedColor }}
              >
                {newItemName || "New Tag"}
              </span>
            </div>
            {showVisibilityOptions && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500">Visibility:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedVisibility("private")}
                    className={`px-2 py-1 rounded text-xs ${
                      selectedVisibility === "private"
                        ? "bg-gray-600 text-white"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    Only Me
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVisibility("tenant")}
                    className={`px-2 py-1 rounded text-xs ${
                      selectedVisibility === "tenant"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    My Organization
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedVisibility("public")}
                    className={`px-2 py-1 rounded text-xs ${
                      selectedVisibility === "public"
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    Everyone
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <MultiSelect
        id={id}
        name={name}
        label=""
        options={options}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
      />
    </div>
  );
}