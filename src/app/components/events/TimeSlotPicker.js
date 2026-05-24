"use client";

import React, { useState, useRef, useEffect } from "react";
import { FaClock, FaPlus, FaTrash } from "react-icons/fa";

const TimeSlotPicker = ({
  date,
  onTimeSlotsChange,
  initialSlots = [],
  existingEvents = [],
}) => {
  const [timeSlots, setTimeSlots] = useState(initialSlots);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const timeGridRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const handleMouseUpRef = useRef(null);

  // Convert time to minutes for easier calculation
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  // Convert minutes back to time string
  const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}`;
  };

  // Format time for display (12-hour format)
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes = "00"] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes.padStart(2, "0")} ${ampm}`;
  };

  // Calculate event position and height
  const getEventPosition = (event) => {
    const startTime = event.startTime || event.time;
    const endTime = event.endTime;

    if (!startTime) return null;

    // Parse start time
    let startMinutes = 0;
    try {
      const [hours, minutes] = startTime.split(":").map(Number);
      startMinutes = hours * 60 + (minutes || 0);
    } catch (e) {
      return null;
    }

    // Parse end time or default to 1 hour duration
    let duration = 60; // Default 1 hour
    if (endTime) {
      try {
        const [endHours, endMinutes] = endTime.split(":").map(Number);
        const endTotalMinutes = endHours * 60 + (endMinutes || 0);
        duration = endTotalMinutes - startMinutes;
      } catch (e) {
        // Keep default duration
      }
    }

    // Calculate position (each hour is 48px, so each minute is 0.8px)
    const top = (startMinutes / 60) * 48;
    const height = (duration / 60) * 48;

    return {
      top,
      height,
      title: event.title || event.name,
      startTime,
      endTime,
    };
  };

  // Check if a time block is within any slot
  const isTimeInSlot = (hour, halfHour) => {
    const timeMin = hour * 60 + (halfHour ? 30 : 0);
    return timeSlots.some((slot) => {
      const startMin = timeToMinutes(slot.start);
      const endMin = timeToMinutes(slot.end);
      return timeMin >= startMin && timeMin < endMin;
    });
  };

  // Check if time is in current drag selection
  const isTimeInDragSelection = (hour, halfHour) => {
    if (!isDragging || dragStart === null || dragEnd === null) return false;
    const timeMin = hour * 60 + (halfHour ? 30 : 0);
    const startMin = Math.min(dragStart, dragEnd);
    const endMin = Math.max(dragStart, dragEnd);
    return timeMin >= startMin && timeMin <= endMin;
  };

  // Handle mouse down on time slot
  const handleMouseDown = (hour, halfHour) => {
    const timeMin = hour * 60 + (halfHour ? 30 : 0);
    setIsDragging(true);
    setDragStart(timeMin);
    setDragEnd(timeMin);
  };

  // Handle mouse enter while dragging
  const handleMouseEnter = (hour, halfHour) => {
    if (!isDragging) return;
    const timeMin = hour * 60 + (halfHour ? 30 : 0);
    setDragEnd(timeMin);
  };

  // Handle mouse up to finish drag
  const handleMouseUp = () => {
    if (!isDragging || dragStart === null || dragEnd === null) return;

    const startMin = Math.min(dragStart, dragEnd);
    const endMin = Math.max(dragStart, dragEnd) + 30; // Add 30 to include the last block

    // Check if this overlaps with existing slots
    const overlapsExisting = timeSlots.some((slot) => {
      const slotStart = timeToMinutes(slot.start);
      const slotEnd = timeToMinutes(slot.end);
      return (
        (startMin >= slotStart && startMin < slotEnd) ||
        (endMin > slotStart && endMin <= slotEnd) ||
        (startMin <= slotStart && endMin >= slotEnd)
      );
    });

    if (!overlapsExisting) {
      const newSlot = {
        start: minutesToTime(startMin),
        end: minutesToTime(endMin),
      };
      const updatedSlots = [...timeSlots, newSlot].sort(
        (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
      );
      setTimeSlots(updatedSlots);
      onTimeSlotsChange(updatedSlots);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };
  handleMouseUpRef.current = handleMouseUp;

  // Add a default time slot
  const addDefaultSlot = () => {
    const newSlot = {
      start: "09:00",
      end: "17:00",
    };
    const updatedSlots = [...timeSlots, newSlot].sort(
      (a, b) => timeToMinutes(a.start) - timeToMinutes(b.start)
    );
    setTimeSlots(updatedSlots);
    onTimeSlotsChange(updatedSlots);
  };

  // Remove a time slot
  const removeSlot = (index) => {
    const updatedSlots = timeSlots.filter((_, i) => i !== index);
    setTimeSlots(updatedSlots);
    onTimeSlotsChange(updatedSlots);
  };

  // Update slot times
  const updateSlot = (index, field, value) => {
    const updatedSlots = [...timeSlots];
    updatedSlots[index][field] = value;
    setTimeSlots(updatedSlots);
    onTimeSlotsChange(updatedSlots);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      handleMouseUpRef.current?.();
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    return () => document.removeEventListener("mouseup", handleGlobalMouseUp);
  }, []);

  // Auto-scroll to 7 AM on mount
  useEffect(() => {
    if (scrollContainerRef.current) {
      // Each hour is 48px (2 * 24px for half hours)
      // Scroll to 7 AM (7 * 48 = 336px)
      scrollContainerRef.current.scrollTop = 7 * 48;
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-700">{date}</h4>
        <button
          onClick={addDefaultSlot}
          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
        >
          <FaPlus size={12} />
          Add 9-5
        </button>
      </div>

      {/* Vertical Time Grid */}
      <div
        ref={scrollContainerRef}
        className="relative h-96 overflow-y-auto overflow-x-hidden bg-white rounded-lg border border-gray-200"
      >
        {/* Scrollable container */}
        <div className="flex">
          {/* Time labels */}
          <div className="w-16 flex-shrink-0 sticky left-0 bg-white z-10">
            {Array.from({ length: 24 }, (_, hour) => (
              <div
                key={hour}
                className="h-12 relative border-b border-gray-100"
              >
                <div className="absolute -top-2 right-2 text-xs text-gray-500">
                  {hour === 0
                    ? "12 AM"
                    : hour === 12
                    ? "12 PM"
                    : hour > 12
                    ? `${hour - 12} PM`
                    : `${hour} AM`}
                </div>
              </div>
            ))}
          </div>

          {/* Time slots grid */}
          <div
            ref={timeGridRef}
            className="flex-1 bg-gray-50 relative select-none"
            onMouseLeave={() => {
              if (isDragging) {
                setDragEnd(null);
              }
            }}
          >
            {/* Time slot grid */}
            {Array.from({ length: 24 }, (_, hour) => (
              <div key={hour} className="flex h-12">
                {/* First half hour */}
                <div
                  className={`flex-1 border-b border-gray-200 cursor-pointer transition-colors ${
                    isTimeInSlot(hour, false)
                      ? "bg-blue-500"
                      : isTimeInDragSelection(hour, false)
                      ? "bg-blue-300"
                      : "hover:bg-gray-100"
                  }`}
                  onMouseDown={() => handleMouseDown(hour, false)}
                  onMouseEnter={() => handleMouseEnter(hour, false)}
                />
                {/* Second half hour */}
                <div
                  className={`flex-1 border-b border-l border-gray-200 cursor-pointer transition-colors ${
                    isTimeInSlot(hour, true)
                      ? "bg-blue-500"
                      : isTimeInDragSelection(hour, true)
                      ? "bg-blue-300"
                      : "hover:bg-gray-100"
                  }`}
                  onMouseDown={() => handleMouseDown(hour, true)}
                  onMouseEnter={() => handleMouseEnter(hour, true)}
                />
              </div>
            ))}

            {/* Event overlays */}
            {existingEvents.map((event, index) => {
              const position = getEventPosition(event);
              if (!position) return null;

              return (
                <div
                  key={`event-${index}`}
                  className="absolute left-0 right-0 mx-2 bg-red-100 border border-red-300 rounded-md p-1 pointer-events-none z-10 opacity-90"
                  style={{
                    top: `${position.top}px`,
                    height: `${Math.max(position.height, 20)}px`,
                    minHeight: "20px",
                  }}
                >
                  <div className="text-xs font-medium text-red-800 truncate">
                    {position.title}
                  </div>
                  <div className="text-[10px] text-red-600">
                    {formatTime(position.startTime)}
                    {position.endTime && ` - ${formatTime(position.endTime)}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Time Slots */}
      {timeSlots.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium text-gray-600">
            Available times:
          </h5>
          {timeSlots.map((slot, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-white p-3 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-2 flex-1 w-full">
                <FaClock className="text-gray-400 flex-shrink-0" size={14} />
                <div className="flex items-center gap-2 flex-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <input
                      type="time"
                      value={slot.start}
                      onChange={(e) =>
                        updateSlot(index, "start", e.target.value)
                      }
                      className="px-2 py-1 border rounded text-sm w-24"
                    />
                    <span className="text-gray-500 text-sm">to</span>
                    <input
                      type="time"
                      value={slot.end}
                      onChange={(e) => updateSlot(index, "end", e.target.value)}
                      className="px-2 py-1 border rounded text-sm w-24"
                    />
                  </div>
                  <span className="text-xs text-gray-500 ml-2">
                    ({formatTime(slot.start)} - {formatTime(slot.end)})
                  </span>
                </div>
              </div>
              <button
                onClick={() => removeSlot(index)}
                className="p-1 text-red-500 hover:bg-red-50 rounded self-end sm:self-auto"
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TimeSlotPicker;
