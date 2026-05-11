"use client";

import { useState } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";

const MultiSelect = ({
  required = false,
  placeholder = "",
  className = "",
  error = "",
  options = [],
  value = [],
  onChange,
  chipClassName = "bg-blue-100 text-blue-800",
  containerClassName = "bg-white",
  dropdownClassName = "bg-white",
  inputClassName = "text-gray-900 placeholder-gray-500",
  optionClassName = "",
}) => {
  const [query, setQuery] = useState("");

  // Helper function to format display text
  const formatDisplayText = (text) => {
    if (!text) return "";

    // If the text is all lowercase, capitalize first letter
    // Otherwise, return as-is to preserve original casing
    if (text === text.toLowerCase()) {
      return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    return text;
  };

  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];

  const filteredOptions =
    query === ""
      ? safeOptions
      : safeOptions.filter((option) =>
          option.name?.toLowerCase().includes(query.toLowerCase())
        );

  return (
    <div className="flex flex-col w-full">
      <Combobox value={value} onChange={onChange} multiple>
        <div className="relative mt-1">
          <div
            className={`relative w-full cursor-default overflow-hidden rounded-lg text-left border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 sm:text-sm ${containerClassName}`}
          >
            <div className="flex flex-wrap gap-1 p-1">
              {value?.map((item) => (
                <span
                  key={item.id}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-sm ${chipClassName}`}
                >
                  {formatDisplayText(item.name)}
                </span>
              ))}
              <ComboboxInput
                className={`w-full border-none py-2 pl-3 pr-10 text-sm leading-5 focus:ring-0 bg-transparent ${inputClassName}`}
                onChange={(event) => setQuery(event.target.value)}
                displayValue={() => ""}
                placeholder={placeholder}
                autoComplete="off"
              />
            </div>
            <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
              <svg
                className="h-5 w-5 text-gray-400"
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
              >
                <path
                  d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </ComboboxButton>
          </div>
          <ComboboxOptions
            className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm ${dropdownClassName}`}
          >
            {filteredOptions.length === 0 && query !== "" ? (
              <div className="relative cursor-default select-none py-2 px-4 text-gray-400">
                Nothing found.
              </div>
            ) : (
              filteredOptions.map((option) => (
                <ComboboxOption
                  key={option.id}
                  value={option}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      optionClassName ||
                      (active ? "bg-blue-50 text-gray-900" : "text-gray-700")
                    }`
                  }
                >
                  {({ selected, active }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {formatDisplayText(option.name)}
                        {option.count !== undefined && (
                          <span className="text-gray-400 text-xs ml-2">
                            ({option.count})
                          </span>
                        )}
                      </span>
                      {selected && (
                        <span
                          className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                            active ? "text-blue-400" : "text-blue-500"
                          }`}
                        >
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              clipRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            />
                          </svg>
                        </span>
                      )}
                    </>
                  )}
                </ComboboxOption>
              ))
            )}
          </ComboboxOptions>
        </div>
      </Combobox>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default MultiSelect;
