import { useState, useRef } from "react";
import { FaTimes, FaEnvelope } from "react-icons/fa";

const EmailChips = ({
  value = "",
  onChange,
  placeholder = "Enter email addresses...",
  className = "",
  disabled = false,
}) => {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef(null);

  // Parse emails from the value string
  const emails = value
    ? value
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0)
    : [];

  const addEmail = (email) => {
    const trimmedEmail = email.trim();
    if (trimmedEmail && !emails.includes(trimmedEmail)) {
      const newEmails = [...emails, trimmedEmail];
      onChange(newEmails.join(", "));
    }
    setInputValue("");
  };

  const removeEmail = (emailToRemove) => {
    const newEmails = emails.filter((email) => email !== emailToRemove);
    onChange(newEmails.join(", "));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim()) {
        addEmail(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && emails.length > 0) {
      // Remove last email if backspace is pressed and input is empty
      removeEmail(emails[emails.length - 1]);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    // If user types a comma, add the email
    if (value.includes(",")) {
      const emailPart = value.split(",")[0];
      if (emailPart.trim()) {
        addEmail(emailPart);
      }
    } else {
      setInputValue(value);
    }
  };

  const handleContainerClick = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Simple email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <div
      className={`
        min-h-[42px] w-full px-3 py-2 border border-gray-200 rounded-md 
        bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-200 
        focus-within:border-blue-500 transition duration-150 ease-in-out
        ${disabled ? "bg-gray-100 cursor-not-allowed" : "cursor-text"}
        ${className}
      `}
      onClick={handleContainerClick}
    >
      <div className="flex flex-wrap gap-2 items-center">
        {/* Email chips */}
        {emails.map((email, index) => (
          <span
            key={index}
            className={`
              inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm
              ${
                isValidEmail(email)
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-red-100 text-red-800 border border-red-200"
              }
            `}
          >
            <FaEnvelope className="text-xs" />
            <span>{email}</span>
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeEmail(email);
                }}
                className="hover:bg-blue-200 hover:text-blue-900 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${email}`}
              >
                <FaTimes className="text-xs" />
              </button>
            )}
          </span>
        ))}

        {/* Input field */}
        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={emails.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[100px] border-none outline-none bg-transparent placeholder-gray-400 text-gray-700"
          />
        )}
      </div>
    </div>
  );
};

export default EmailChips;
