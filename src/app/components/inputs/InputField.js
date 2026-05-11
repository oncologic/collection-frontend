import React from "react";
import { FaInfoCircle } from "react-icons/fa";

const InputField = React.forwardRef(
  (
    {
      id,
      name,
      type = "text",
      label,
      required = false,
      placeholder = "",
      className = "",
      error = "",
      register,
      value,
      onChange,
      min,
      max,
      step,
      size = "default",
      disabled = false,
      helperText,
      onKeyPress,
    },
    ref
  ) => {
    const isControlled = value !== undefined && onChange !== undefined;
    const errorMessage =
      typeof error === "string"
        ? error
        : error?.message ||
          (error?.type === "required"
            ? `${label || name || "This field"} is required`
            : error
              ? "Invalid value"
              : "");

    const registerInput =
      !isControlled && typeof register === "function"
        ? register(name, { required, min, max, step })
        : {};

    const inputClasses = `
    text-gray-700
    block rounded-md 
    border border-gray-200 
    bg-white
    shadow-sm
    placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500
    transition duration-150 ease-in-out
    ${size === "small" ? "px-2 py-2 text-sm" : "px-2 py-2 text-base"}
    ${errorMessage ? "border-red-500" : ""}
    ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}
    ${className}
  `;

    return (
      <div className="flex flex-col w-full">
        {label && (
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor={id}
              className={`min-h-4 text-gray-600 text-left w-full self-center ${
                size === "small" ? "text-base" : "text-md"
              }`}
              style={{ height: "0.5rem" }}
            >
              {label}
            </label>
            {helperText && (
              <div className="relative group">
                <FaInfoCircle
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  size={12}
                />
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-sm rounded-md shadow-lg">
                  <div className="relative">
                    {helperText}
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45" />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {type === "textarea" ? (
          <textarea
            ref={ref}
            id={id}
            name={name}
            disabled={disabled}
            autoComplete="off"
            {...(!isControlled ? registerInput : {})}
            {...(isControlled ? { value, onChange } : {})}
            onKeyPress={onKeyPress}
            placeholder={placeholder}
            className={inputClasses}
          />
        ) : (
          <input
            ref={ref}
            id={id}
            step={step}
            name={name}
            type={type}
            min={min}
            max={max}
            disabled={disabled}
            autoComplete="off"
            {...(!isControlled ? registerInput : {})}
            {...(isControlled ? { value, onChange } : {})}
            onKeyPress={onKeyPress}
            placeholder={placeholder}
            className={inputClasses}
          />
        )}
        {errorMessage && (
          <p className="mt-1 text-sm text-red-600">{errorMessage}</p>
        )}
      </div>
    );
  }
);

InputField.displayName = "InputField";

export default InputField;
