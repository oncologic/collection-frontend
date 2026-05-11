"use client";

import { useController } from "react-hook-form";
import { FaCheck, FaChevronDown, FaSearch } from "react-icons/fa";
import { Combobox } from "@headlessui/react";
import { useState, useEffect } from "react";

/**
 * SearchableDropdown - A reusable searchable dropdown component
 *
 * Supports both form-controlled (with react-hook-form) and standalone usage.
 *
 * @example
 * // Form-controlled usage (with react-hook-form)
 * <SearchableDropdown
 *   name="organization"
 *   control={control}
 *   label="Select Organization"
 *   options={organizations}
 *   placeholder="Search organizations..."
 *   required={true}
 *   sortBy="name"
 * />
 *
 * @example
 * // Standalone controlled usage
 * <SearchableDropdown
 *   label="Select Organization"
 *   value={selectedOrg}
 *   onChange={setSelectedOrg}
 *   options={organizations}
 *   placeholder="Search organizations..."
 *   sortBy="name"
 * />
 *
 * @example
 * // Standalone uncontrolled usage
 * <SearchableDropdown
 *   label="Select Organization"
 *   options={organizations}
 *   defaultValue={defaultOrg}
 *   placeholder="Search organizations..."
 * />
 *
 * @param {Object} props - Component props
 * @param {string} [props.name] - Form field name (for react-hook-form)
 * @param {Object} [props.control] - Form control object (for react-hook-form)
 * @param {string} [props.label] - Label text for the dropdown
 * @param {Array} props.options - Array of option objects with at least {id, name} properties
 * @param {Object} [props.value] - Currently selected value (for controlled usage)
 * @param {Function} [props.onChange] - Change handler (for controlled usage)
 * @param {Object} [props.defaultValue] - Default selected value
 * @param {string} [props.placeholder="Search..."] - Placeholder text for the search input
 * @param {boolean} [props.required=false] - Whether the field is required (form usage only)
 * @param {boolean} [props.disabled=false] - Whether the dropdown is disabled
 * @param {string} [props.sortBy=null] - How to sort options: 'name', 'date', or null
 * @param {string} [props.filterBy='name'] - Which field to filter by when searching
 */

// A component wrapper that decides whether to use the form-controlled version or standalone version
export default function SearchableDropdown(props) {
  const { name, control } = props;
  const isFormControlled = Boolean(name && control);

  return isFormControlled ? (
    <FormControlledSearchableDropdown {...props} />
  ) : (
    <StandaloneSearchableDropdown {...props} />
  );
}

// Version that uses react-hook-form
function FormControlledSearchableDropdown({
  name,
  control,
  label,
  options = [],
  defaultValue,
  placeholder = "Search...",
  required = false,
  disabled = false,
  sortBy = null, // 'date', 'name', or null for no sorting
  filterBy = "name", // which field to filter by
}) {
  const [query, setQuery] = useState("");

  const {
    field: { value, onChange },
    fieldState: { error },
  } = useController({
    name,
    control,
    defaultValue: defaultValue || null,
    rules: { required: required ? `${label} is required` : false },
  });

  const filteredOptions = getFilteredOptions(options, query, sortBy, filterBy);

  return (
    <SearchableDropdownUI
      label={label}
      options={filteredOptions}
      selectedValue={value}
      handleChange={onChange}
      query={query}
      setQuery={setQuery}
      placeholder={placeholder}
      disabled={disabled}
      error={error}
    />
  );
}

// Version for direct control or internal state
function StandaloneSearchableDropdown({
  label,
  options = [],
  defaultValue,
  placeholder = "Search...",
  value,
  onChange: externalOnChange,
  disabled = false,
  sortBy = null,
  filterBy = "name",
}) {
  const [query, setQuery] = useState("");
  const isControlled = value !== undefined && externalOnChange !== undefined;

  // For non-form-controlled cases
  const [internalValue, setInternalValue] = useState(defaultValue || null);

  // Determine which value and onChange to use
  const selectedValue = isControlled ? value : internalValue;
  const handleChange = isControlled ? externalOnChange : setInternalValue;

  // Update internal state if controlled props change
  useEffect(() => {
    if (isControlled && value !== undefined) {
      setInternalValue(value);
    }
  }, [isControlled, value]);

  const filteredOptions = getFilteredOptions(options, query, sortBy, filterBy);

  return (
    <SearchableDropdownUI
      label={label}
      options={filteredOptions}
      selectedValue={selectedValue}
      handleChange={handleChange}
      query={query}
      setQuery={setQuery}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

// Helper function to filter and sort options
function getFilteredOptions(options, query, sortBy, filterBy) {
  let filtered = options;

  // Filter by search query
  if (query) {
    filtered = options.filter((option) => {
      const searchField = option[filterBy] || "";
      return searchField.toLowerCase().includes(query.toLowerCase());
    });
  }

  // Sort options
  if (sortBy === "date" && filtered.length > 0) {
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || a.updatedAt || 0);
      const dateB = new Date(b.date || b.createdAt || b.updatedAt || 0);
      return dateB - dateA; // Most recent first
    });
  } else if (sortBy === "name" && filtered.length > 0) {
    filtered = filtered.sort((a, b) => {
      const nameA = (a.name || "").toLowerCase();
      const nameB = (b.name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  return filtered;
}

// Shared UI component
function SearchableDropdownUI({
  label,
  options,
  selectedValue,
  handleChange,
  query,
  setQuery,
  placeholder,
  disabled = false,
  error = null,
}) {
  return (
    <Combobox value={selectedValue} onChange={handleChange} disabled={disabled}>
      <div className="flex flex-col">
        {label && (
          <Combobox.Label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </Combobox.Label>
        )}
        <div className="relative">
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4 pointer-events-none" />
            <Combobox.Input
              className={`w-full rounded-md bg-white pl-10 pr-10 py-3 text-gray-900 outline outline-1 -outline-offset-1 shadow-sm transition-colors
                ${
                  error
                    ? "outline-red-300 focus:outline-red-500 focus:ring-2 focus:ring-red-200"
                    : "outline-gray-300 focus:outline-blue-500 focus:ring-2 focus:ring-blue-200"
                }
                ${
                  disabled
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed"
                    : "hover:outline-gray-400"
                }
              `}
              displayValue={(option) => option?.name || ""}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={placeholder}
              disabled={disabled}
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3">
              <FaChevronDown
                className={`size-4 transition-colors ${
                  disabled
                    ? "text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>

          <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
            {options.length === 0 ? (
              <div className="relative cursor-default select-none px-4 py-2 text-gray-700">
                {query ? "No results found." : "No options available."}
              </div>
            ) : (
              options.map((option) => (
                <Combobox.Option
                  key={option.id || option.value || option.name}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-blue-600 text-white" : "text-gray-900"
                    }`
                  }
                  value={option}
                >
                  {({ selected, active }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {option.name}
                      </span>
                      {selected ? (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? "text-white" : "text-blue-600"
                          }`}
                        >
                          <FaCheck className="size-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </div>
        {error && <p className="mt-1 text-sm text-red-600">{error.message}</p>}
      </div>
    </Combobox>
  );
}
