"use client";

import React, { useState, useEffect } from "react";
import { FaKeyboard, FaTimes } from "react-icons/fa";
import { useUser } from "@clerk/nextjs";
import { useGlobalSearch } from "../context/GlobalSearchContext";

const SearchHint = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const { openSearch } = useGlobalSearch();
  const { isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    // Only show for signed-in users
    if (!isLoaded || !isSignedIn) {
      return;
    }

    // Don't show the hint on public pages
    if (typeof window !== "undefined" && window.location.pathname.includes("/public")) {
      return;
    }

    // Check if the user has already dismissed the hint
    const dismissed = localStorage.getItem("search-hint-dismissed");
    if (dismissed) {
      setIsDismissed(true);
      return;
    }

    // Show the hint after a short delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    // Auto-hide the hint after 8 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
    }, 11000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [isLoaded, isSignedIn]);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem("search-hint-dismissed", "true");
  };

  const handleClick = () => {
    openSearch();
    handleDismiss();
  };

  // Get OS-specific modifier key text
  const getModifierKey = () => {
    if (typeof window !== "undefined") {
      return navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl";
    }
    return "Ctrl";
  };

  // Don't show if user is not signed in or auth is still loading
  if (!isLoaded || !isSignedIn || isDismissed || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-fade-in">
      <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-xl max-w-sm border border-blue-700">
        <div className="flex items-start gap-3">
          <FaKeyboard className="text-blue-200 mt-0.5 flex-shrink-0" />
          <div className="flex-grow">
            <p className="text-sm font-medium mb-1">Quick Search Available!</p>
            <p className="text-xs text-blue-100">
              Press {getModifierKey()}+P to search anywhere
            </p>
          </div>
          <div className="flex gap-1">
            <button
              onClick={handleClick}
              className="text-blue-200 hover:text-white text-xs px-2 py-1 rounded hover:bg-blue-500 transition-colors"
            >
              Try it
            </button>
            <button
              onClick={handleDismiss}
              className="text-blue-200 hover:text-white p-1 rounded hover:bg-blue-500 transition-colors"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchHint;
