"use client";

import { useState, useEffect, useCallback } from "react";
import { DateTime } from "luxon";

export const useMultiDaySelection = () => {
  const [selectedDates, setSelectedDates] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [lastClickedDate, setLastClickedDate] = useState(null);
  const [showAvailabilityComposer, setShowAvailabilityComposer] = useState(false);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedDates([]);
    setLastClickedDate(null);
    setShowAvailabilityComposer(false);
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Shift") {
        setIsSelecting(true);
      }
      
      // Clear selection on Escape
      if (e.key === "Escape") {
        clearSelection();
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === "Shift") {
        setIsSelecting(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [clearSelection]);

  // Handle date click
  const handleDateClick = useCallback(
    (date, e) => {
      // Prevent default calendar day click behavior when shift is held
      if (e.shiftKey || isSelecting) {
        e.preventDefault();
        e.stopPropagation();

        if (lastClickedDate && (e.shiftKey || isSelecting)) {
          // Range selection
          const start = lastClickedDate < date ? lastClickedDate : date;
          const end = lastClickedDate < date ? date : lastClickedDate;
          
          const dates = [];
          let current = start;
          
          while (current <= end) {
            dates.push(current);
            current = current.plus({ days: 1 });
          }
          
          setSelectedDates(dates);
        } else {
          // Single selection
          setSelectedDates([date]);
          setLastClickedDate(date);
        }
      } else if (e.ctrlKey || e.metaKey) {
        // Multi-select non-consecutive dates
        e.preventDefault();
        e.stopPropagation();
        
        const dateExists = selectedDates.some((d) => d.equals(date));
        
        if (dateExists) {
          setSelectedDates(selectedDates.filter((d) => !d.equals(date)));
        } else {
          setSelectedDates([...selectedDates, date].sort((a, b) => a - b));
        }
        
        setLastClickedDate(date);
      }
    },
    [isSelecting, lastClickedDate, selectedDates]
  );

  // Check if a date is selected
  const isDateSelected = useCallback(
    (date) => {
      return selectedDates.some((d) => d.hasSame(date, "day"));
    },
    [selectedDates]
  );

  // Open availability composer
  const openAvailabilityComposer = useCallback(() => {
    if (selectedDates.length > 0) {
      setShowAvailabilityComposer(true);
    }
  }, [selectedDates]);

  return {
    selectedDates,
    isSelecting,
    showAvailabilityComposer,
    handleDateClick,
    isDateSelected,
    clearSelection,
    openAvailabilityComposer,
    setShowAvailabilityComposer,
  };
};