import React, { useState, useEffect, useRef } from "react";
import { FaClock, FaTimes, FaChevronDown, FaChevronUp } from "react-icons/fa";

const CustomTimePicker = ({
  value,
  onChange,
  label = "Time (optional)",
  className = "",
  placeholder = "",
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedAmPm, setSelectedAmPm] = useState("AM");

  const containerRef = useRef(null);

  // Create hours (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);

  // Create minutes (00, 15, 30, 45)
  const minutes = ["00", "15", "30", "45"];

  // Format the time value for display
  const formatTimeForDisplay = (timeString) => {
    if (!timeString) return "";

    try {
      // If format is already HH:MM AM/PM, just return it
      if (/\d{1,2}:\d{2} (AM|PM)/.test(timeString)) {
        return timeString;
      }

      // Handle military time format (HH:MM)
      if (/\d{1,2}:\d{2}/.test(timeString)) {
        const [hours, minutes] = timeString.split(":");
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
      }
    } catch (e) {
      console.error("Error formatting time:", e);
    }

    return timeString;
  };

  // Parse the time value and set the internal state
  const parseTime = (timeValue) => {
    if (!timeValue) return;

    try {
      // Handle input like "10:30 AM" or "10:30"
      if (timeValue.includes(":")) {
        // Check if it contains AM/PM
        const hasAmPm = /am|pm/i.test(timeValue);

        if (hasAmPm) {
          // Parse something like "10:30 AM"
          const match = timeValue.match(/(\d+):(\d+)\s*(am|pm)/i);
          if (match) {
            const [_, hour, minute, ampm] = match;
            setSelectedHour(parseInt(hour, 10));
            setSelectedMinute(minute.padStart(2, "0"));
            setSelectedAmPm(ampm.toUpperCase());
          }
        } else {
          // Parse 24-hour format like "14:30"
          const [hoursStr, minutesStr] = timeValue.split(":");
          const hour24 = parseInt(hoursStr, 10);
          const hour12 = hour24 % 12 || 12;
          const ampm = hour24 >= 12 ? "PM" : "AM";

          setSelectedHour(hour12);
          setSelectedMinute(minutesStr.padStart(2, "0"));
          setSelectedAmPm(ampm);
        }
      }
    } catch (e) {
      console.error("Error parsing time:", e);
    }
  };

  // Convert the internal state to a time string in 24-hour format (HH:MM)
  const getTimeString = () => {
    let hour = selectedHour;

    // Convert to 24-hour format
    if (selectedAmPm === "PM" && hour < 12) {
      hour += 12;
    } else if (selectedAmPm === "AM" && hour === 12) {
      hour = 0;
    }

    return `${hour.toString().padStart(2, "0")}:${selectedMinute}`;
  };

  // Handle selecting a time
  const handleSelectTime = (hour, minute, ampm) => {
    setSelectedHour(hour);
    setSelectedMinute(minute);
    setSelectedAmPm(ampm);

    // Update the internal input value for display
    const timeForDisplay = `${hour}:${minute} ${ampm}`;
    setInputValue(timeForDisplay);

    // Calculate the 24-hour format time for the onChange handler
    let hour24 = hour;
    if (ampm === "PM" && hour < 12) {
      hour24 += 12;
    } else if (ampm === "AM" && hour === 12) {
      hour24 = 0;
    }

    const timeValue = `${hour24.toString().padStart(2, "0")}:${minute}:00`;
    onChange(timeValue);

    // Don't close the dropdown yet to allow the user to adjust their selection
  };

  // Handle direct input
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Try to parse the time as the user types
    if (/^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(am|pm|AM|PM)$/.test(newValue)) {
      parseTime(newValue);

      // If it's a valid time, update the value
      const match = newValue.match(/(\d+):(\d+)\s*(am|pm)/i);
      if (match) {
        const [_, hour, minute, ampm] = match;
        handleSelectTime(
          parseInt(hour, 10),
          minute.padStart(2, "0"),
          ampm.toUpperCase()
        );
      }
    }
  };

  // Clear the time
  const handleClearTime = (e) => {
    e.stopPropagation();
    setInputValue("");
    onChange(null);
  };

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      parseTime(value);
      setInputValue(formatTimeForDisplay(value));
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle minute scroll in dropdown
  const handleMinuteScroll = (direction) => {
    const currentIndex = minutes.indexOf(selectedMinute);
    if (direction === "up" && currentIndex > 0) {
      handleSelectTime(selectedHour, minutes[currentIndex - 1], selectedAmPm);
    } else if (direction === "down" && currentIndex < minutes.length - 1) {
      handleSelectTime(selectedHour, minutes[currentIndex + 1], selectedAmPm);
    }
  };

  // Handle hour scroll in dropdown
  const handleHourScroll = (direction) => {
    const currentIndex = hours.indexOf(selectedHour);
    if (direction === "up" && currentIndex > 0) {
      handleSelectTime(hours[currentIndex - 1], selectedMinute, selectedAmPm);
    } else if (direction === "down" && currentIndex < hours.length - 1) {
      handleSelectTime(hours[currentIndex + 1], selectedMinute, selectedAmPm);
    }
  };

  // Toggle AM/PM
  const toggleAmPm = () => {
    const newAmPm = selectedAmPm === "AM" ? "PM" : "AM";
    handleSelectTime(selectedHour, selectedMinute, newAmPm);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder || "Select time..."}
          className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-8"
        />
        {inputValue && (
          <button
            onClick={handleClearTime}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            type="button"
          >
            <FaTimes />
          </button>
        )}
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          type="button"
        >
          <FaClock />
        </button>
      </div>

      {showDropdown && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg border border-gray-200 rounded-md overflow-hidden">
          <div className="grid grid-cols-3 p-2 gap-2">
            {/* Hour column */}
            <div className="flex flex-col items-center">
              <div className="overflow-y-auto h-40 w-full">
                {hours.map((hour) => (
                  <button
                    key={hour}
                    onClick={() =>
                      handleSelectTime(hour, selectedMinute, selectedAmPm)
                    }
                    className={`w-full p-2 text-center ${
                      hour === selectedHour
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                    type="button"
                  >
                    {hour}
                  </button>
                ))}
              </div>
            </div>

            {/* Minute column */}
            <div className="flex flex-col items-center">
              <div className="overflow-y-auto h-40 w-full">
                {minutes.map((minute) => (
                  <button
                    key={minute}
                    onClick={() =>
                      handleSelectTime(selectedHour, minute, selectedAmPm)
                    }
                    className={`w-full p-2 text-center ${
                      minute === selectedMinute
                        ? "bg-blue-500 text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                    type="button"
                  >
                    {minute}
                  </button>
                ))}
              </div>
            </div>

            {/* AM/PM column */}
            <div className="flex flex-col">
              <button
                onClick={() =>
                  handleSelectTime(selectedHour, selectedMinute, "AM")
                }
                className={`w-full p-2 text-center ${
                  selectedAmPm === "AM"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                type="button"
              >
                AM
              </button>
              <button
                onClick={() =>
                  handleSelectTime(selectedHour, selectedMinute, "PM")
                }
                className={`w-full p-2 text-center ${
                  selectedAmPm === "PM"
                    ? "bg-blue-500 text-white"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                type="button"
              >
                PM
              </button>
            </div>
          </div>

          {/* Common presets */}
          <div className="p-2 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Common times</p>
            <div className="grid grid-cols-2 gap-1">
              {[
                "8:00 AM",
                "9:00 AM",
                "10:00 AM",
                "11:00 AM",
                "12:00 PM",
                "1:00 PM",
                "2:00 PM",
                "3:00 PM",
                "4:00 PM",
                "5:00 PM",
              ].map((time) => (
                <button
                  key={time}
                  onClick={() => {
                    setInputValue(time);
                    parseTime(time);
                    setShowDropdown(false);
                  }}
                  className="text-sm p-1 text-left hover:bg-gray-100 rounded"
                  type="button"
                >
                  {time}
                </button>
              ))}
            </div>
          </div>

          <div className="flex border-t border-gray-200">
            <button
              onClick={() => setShowDropdown(false)}
              className="flex-1 p-2 hover:bg-gray-100 text-blue-600 font-medium"
              type="button"
            >
              Done
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-1">
        Leave empty for an all-day event
      </p>
    </div>
  );
};

export default CustomTimePicker;
