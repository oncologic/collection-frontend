import { useController } from "react-hook-form";
import { FaCheck, FaChevronDown, FaSearch } from "react-icons/fa";
import { Combobox } from "@headlessui/react";
import { useState } from "react";

export default function SearchableSelectField({
  name,
  control,
  label,
  options = [],
  defaultValue,
  placeholder = "Search...",
  value,
  onChange: externalOnChange,
}) {
  const [query, setQuery] = useState("");
  const isControlled = value !== undefined && externalOnChange !== undefined;

  const {
    field: { value: formValue, onChange: formOnChange },
  } = useController({
    name,
    control,
    defaultValue: defaultValue || null,
  });

  // Use controlled values if provided, otherwise use form values
  const selectedValue = isControlled ? value : formValue;
  const handleChange = isControlled ? externalOnChange : formOnChange;

  const filteredOptions = options
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter((option) =>
      option.name.toLowerCase().includes(query.toLowerCase())
    );

  return (
    <Combobox value={selectedValue} onChange={handleChange}>
      <div className="flex flex-col mt-2">
        <label className="block text-md text-gray-700">{label}</label>
        <div className="relative">
          <div className="relative w-full">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
            <Combobox.Input
              className="w-full rounded-md bg-white pl-10 pr-10 py-3 text-gray-600 outline outline-1 -outline-offset-1 outline-gray-200 shadow-sm
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
            {filteredOptions.map((option) => (
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
                      <span
                        className={`text-xs ${
                          active ? "text-blue-100" : "text-gray-400"
                        }`}
                      >
                        {new Date(option.date).toLocaleDateString()}
                      </span>
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
            ))}
          </Combobox.Options>
        </div>
      </div>
    </Combobox>
  );
}
