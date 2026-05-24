"use client";
import { useState, useRef, useEffect } from "react";
import { useController } from "react-hook-form";
import { FaCheck, FaChevronDown, FaSearch, FaPlus, FaTimes } from "react-icons/fa";
import { Combobox } from "@headlessui/react";

export default function SearchableSelectFieldWithCreate({
  name,
  control,
  label,
  options = [],
  defaultValue,
  placeholder = "Search...",
  value,
  onChange: externalOnChange,
  onCreate,
  createPlaceholder = "Create new...",
  isCreating = false,
  required = false,
  showVisibilityOptions = false,
}) {
  const [query, setQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [selectedVisibility, setSelectedVisibility] = useState("tenant");
  const createInputRef = useRef(null);
  const isControlled = value !== undefined && externalOnChange !== undefined;

  const {
    field: { value: formValue, onChange: formOnChange },
    fieldState: { error },
  } = useController({
    name,
    control,
    defaultValue: defaultValue || null,
    rules: { required: required ? `${label} is required` : false },
  });

  // Use controlled values if provided, otherwise use form values
  const selectedValue = isControlled ? value : formValue;
  const handleChange = isControlled ? externalOnChange : formOnChange;

  useEffect(() => {
    if (showCreateForm && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [showCreateForm]);

  const handleCreate = async () => {
    if (!newItemName.trim() || !onCreate) return;
    
    if (typeof onCreate === 'function') {
      if (showVisibilityOptions) {
        await onCreate({
          name: newItemName.trim(),
          visibility: selectedVisibility,
        });
      } else {
        await onCreate(newItemName.trim());
      }
    }
    
    setNewItemName("");
    setSelectedVisibility("tenant");
    setShowCreateForm(false);
    setQuery("");
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

  const filteredOptions = options
    .filter((option) =>
      option.name.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <Combobox value={selectedValue} onChange={handleChange}>
      <div className="flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        
        {!showCreateForm ? (
          <div className="relative">
            <div className="relative w-full">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
              <Combobox.Input
                className="w-full rounded-md bg-white pl-10 pr-10 py-2 text-gray-600 outline outline-1 -outline-offset-1 outline-gray-200 shadow-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                displayValue={(option) => option?.name || ""}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={placeholder}
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                <FaChevronDown className="size-4 text-gray-600" />
              </Combobox.Button>
            </div>

            <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none">
              {onCreate && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(true)}
                  className="w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 flex items-center gap-2 border-b"
                >
                  <FaPlus className="size-3" />
                  <span className="font-medium">Create new {label.toLowerCase()}</span>
                </button>
              )}
              
              {filteredOptions.length === 0 && query !== "" ? (
                <div className="px-3 py-2 text-gray-500">
                  No results found. {onCreate && "Click above to create a new one."}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <Combobox.Option
                    key={option.id}
                    value={option}
                    className={({ active }) =>
                      `relative cursor-default select-none py-2 pl-3 pr-9 ${
                        active ? "bg-blue-500 text-white" : "text-gray-800"
                      }`
                    }
                  >
                    {({ active, selected }) => (
                      <>
                        <div className="flex flex-col">
                          <span className="truncate font-normal">
                            {option.name}
                          </span>
                          {option.description && (
                            <span
                              className={`text-xs ${
                                active ? "text-blue-100" : "text-gray-400"
                              }`}
                            >
                              {option.description}
                            </span>
                          )}
                        </div>
                        {selected && (
                          <span
                            className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                              active ? "text-white" : "text-blue-400"
                            }`}
                          >
                            <FaCheck className="size-4" />
                          </span>
                        )}
                      </>
                    )}
                  </Combobox.Option>
                ))
              )}
            </Combobox.Options>
          </div>
        ) : (
          <div className="space-y-2">
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
                  setSelectedVisibility("tenant");
                }}
                disabled={isCreating}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                title="Cancel"
              >
                <FaTimes className="h-3 w-3" />
              </button>
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
                    My Business Unit
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
        )}
        
        {error && (
          <p className="mt-2 text-sm text-red-600">{error.message}</p>
        )}
      </div>
    </Combobox>
  );
}
