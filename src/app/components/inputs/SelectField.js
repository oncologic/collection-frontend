"use client";

import { useController } from "react-hook-form";
import { FaCheck, FaChevronDown } from "react-icons/fa";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { useState, useEffect } from "react";

// A component wrapper that decides whether to use the form-controlled version or standalone version
export default function SelectField(props) {
  const { name, control } = props;
  const isFormControlled = Boolean(name && control);

  return isFormControlled ? (
    <FormControlledSelect {...props} />
  ) : (
    <StandaloneSelect {...props} />
  );
}

// Version that uses react-hook-form
function FormControlledSelect({
  name,
  control,
  label,
  options = [],
  defaultValue,
  centerSelected,
  placeholder = "Select an option",
}) {
  // This is safe because we know name and control are defined
  const { field } = useController({
    name,
    control,
    defaultValue: defaultValue || null,
  });

  return (
    <SelectUI
      label={label}
      options={options}
      selectedValue={field.value}
      handleChange={field.onChange}
      centerSelected={centerSelected}
      placeholder={placeholder}
    />
  );
}

// Version for direct control or internal state
function StandaloneSelect({
  label,
  options = [],
  defaultValue,
  centerSelected,
  placeholder = "Select an option",
  value,
  onChange: externalOnChange,
}) {
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

  return (
    <SelectUI
      label={label}
      options={options}
      selectedValue={selectedValue}
      handleChange={handleChange}
      centerSelected={centerSelected}
      placeholder={placeholder}
    />
  );
}

// Shared UI component
function SelectUI({
  label,
  options = [],
  selectedValue,
  handleChange,
  centerSelected,
  placeholder = "Select an option",
}) {
  if (!options || options.length === 0) {
    return (
      <div className="flex flex-col mt-2">
        <label className="block text-md text-gray-600 mb-1 text-left capitalize">
          {label}
        </label>
        <div className="relative">
          <Listbox disabled>
            <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-md bg-white px-2 py-3 text-left text-gray-900 outline outline-1 -outline-offset-1 outline-gray-200 shadow-sm">
              No options available
            </ListboxButton>
          </Listbox>
        </div>
      </div>
    );
  }

  return (
    <Listbox value={selectedValue} onChange={handleChange}>
      <div className="flex flex-col">
        <label className="block text-md text-gray-700">{label}</label>
        <div className="relative">
          <ListboxButton
            className={`grid w-full cursor-default grid-cols-1 rounded-md bg-white px-3 py-2 text-gray-5600 outline outline-1 -outline-offset-1 outline-gray-200 shadow-sm
            placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
            text-base transition duration-150 ease-in-out
            ${centerSelected ? "text-center" : "text-left"}`}
          >
            <span
              className={`col-start-1 row-start-1 truncate capitalize ${
                centerSelected ? "pr-0" : "pr-6"
              } ${!selectedValue ? "text-gray-400" : ""}`}
            >
              {selectedValue?.name || placeholder}
            </span>
            <FaChevronDown
              aria-hidden="true"
              className={`col-start-1 row-start-1 size-5 self-center ${
                centerSelected
                  ? "justify-self-end absolute pr-10"
                  : "justify-self-end"
              } text-gray-600 sm:size-4`}
            />
          </ListboxButton>

          <ListboxOptions
            transition
            className="absolute z-[99999] mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
          >
            {options.map((option) => (
              <ListboxOption
                key={option.id}
                value={option}
                className="group relative cursor-default select-none pl-3 p-2 text-gray-800 data-[focus]:bg-blue-500 data-[focus]:text-white data-[focus]:outline-none"
              >
                <span className="block truncate font-normal group-data-[selected]:font-semibold capitalize">
                  {option.name}
                </span>

                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-400 group-[&:not([data-selected])]:hidden group-data-[focus]:text-white">
                  <FaCheck aria-hidden="true" className="size-4" />
                </span>
              </ListboxOption>
            ))}
          </ListboxOptions>
        </div>
      </div>
    </Listbox>
  );
}
