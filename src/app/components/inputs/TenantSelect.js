"use client";

import { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { FaChevronDown, FaCheck } from 'react-icons/fa';

export default function TenantSelect({ 
  label = "View Tenant",
  value, 
  onChange, 
  options = [],
  placeholder = "Select a tenant",
  className = "",
  showLabel = true
}) {
  const selectedOption = options.find(option => option.id === value?.id) || value;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showLabel && (
        <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
          {label}:
        </label>
      )}
      <Listbox value={selectedOption} onChange={onChange}>
        <div className="relative">
          <Listbox.Button className="relative w-full min-w-[200px] cursor-pointer rounded-lg bg-white py-2.5 pl-4 pr-10 text-left border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200">
            <span className="block truncate text-sm font-medium text-gray-900">
              {selectedOption?.name || placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <FaChevronDown
                className="h-4 w-4 text-gray-400"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.map((option) => (
                <Listbox.Option
                  key={option.id}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2.5 pl-10 pr-4 ${
                      active ? 'bg-blue-50 text-blue-900' : 'text-gray-900'
                    }`
                  }
                  value={option}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected ? 'font-semibold' : 'font-normal'
                        }`}
                      >
                        {option.name}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
                          <FaCheck className="h-4 w-4" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}