"use client";
import React, { createContext, useContext, useState } from "react";
import LargeResourceWarning from "../components/LargeResourceWarning";
import { FiAlertTriangle } from "react-icons/fi";

const LargeResourceContext = createContext();

export const LargeResourceProvider = ({ children }) => {
  const [largeResources, setLargeResources] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [onConfirmCallback, setOnConfirmCallback] = useState(null);

  const showLargeResourceWarning = (resources, onConfirmAction) => {
    setLargeResources(resources);
    setOnConfirmCallback(() => onConfirmAction);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleConfirm = () => {
    if (onConfirmCallback) {
      onConfirmCallback(largeResources);
    }
    setIsOpen(false);
  };

  const openWarning = () => {
    setIsOpen(true);
  };

  return (
    <LargeResourceContext.Provider
      value={{ showLargeResourceWarning, largeResources }}
    >
      {children}
      {largeResources.length > 0 && !isOpen && (
        <button
          onClick={openWarning}
          className="fixed bottom-24 right-4 z-40 bg-orange-100 text-orange-600 px-4 py-2 rounded-full 
          flex items-center gap-2 shadow-lg hover:bg-orange-200 transition-all duration-200"
        >
          <FiAlertTriangle className="w-4 h-4" />
          <span>{largeResources.length} large resources available</span>
        </button>
      )}
      <LargeResourceWarning
        isOpen={isOpen}
        largeResources={largeResources}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </LargeResourceContext.Provider>
  );
};

export const useLargeResource = () => {
  const context = useContext(LargeResourceContext);
  if (!context) {
    throw new Error(
      "useLargeResource must be used within a LargeResourceProvider"
    );
  }
  return context;
};
