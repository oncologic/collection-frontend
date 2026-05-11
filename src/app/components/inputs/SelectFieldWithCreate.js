"use client";
import { useState, useRef, useEffect } from "react";
import { Controller } from "react-hook-form";
import { FaPlus, FaTimes, FaCheck } from "react-icons/fa";

export default function SelectFieldWithCreate({
  id,
  name,
  label,
  control,
  options = [],
  required = false,
  onChange,
  placeholder = "Select an option",
  onCreate,
  createPlaceholder = "Create new...",
  isCreating = false,
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const createInputRef = useRef(null);

  useEffect(() => {
    if (showCreateForm && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [showCreateForm]);

  const handleCreate = async () => {
    if (!newItemName.trim() || !onCreate) return;
    
    await onCreate(newItemName.trim());
    setNewItemName("");
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
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <Controller
        name={name}
        control={control}
        rules={{ required: required ? `${label} is required` : false }}
        render={({ field, fieldState: { error } }) => (
          <div className="mt-1">
            {!showCreateForm ? (
              <div className="flex gap-2">
                <select
                  {...field}
                  value={field.value?.id || field.value || ""}
                  onChange={(e) => {
                    const selectedOption = options.find(
                      (opt) => opt.id === parseInt(e.target.value)
                    );
                    field.onChange(selectedOption);
                    if (onChange) onChange(selectedOption);
                  }}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">{placeholder}</option>
                  {Array.isArray(options) && options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>
                {onCreate && (
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    title="Create new"
                  >
                    <FaPlus className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  ref={createInputRef}
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={createPlaceholder}
                  className="block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  disabled={isCreating}
                />
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
                  }}
                  disabled={isCreating}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  title="Cancel"
                >
                  <FaTimes className="h-3 w-3" />
                </button>
              </div>
            )}
            {error && (
              <p className="mt-2 text-sm text-red-600">{error.message}</p>
            )}
          </div>
        )}
      />
    </div>
  );
}