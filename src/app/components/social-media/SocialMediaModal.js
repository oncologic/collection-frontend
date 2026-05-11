"use client";

import React, { useEffect } from "react";
import { FaTimes, FaShareAlt } from "react-icons/fa";
import SocialMediaAccounts from "./SocialMediaAccounts";

const SocialMediaModal = ({ 
  isOpen, 
  onClose, 
  title = "Social Media Accounts", 
  accounts = [], 
  loading = false,
  entityName = ""
}) => {
  // Handle escape key press
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <FaShareAlt className="text-blue-500 mr-3" />
                <h2 className="text-xl font-semibold text-gray-900">
                  {title}
                  {entityName && (
                    <span className="text-gray-600 font-normal ml-2">
                      for {entityName}
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-8rem)]">
              <SocialMediaAccounts 
                accounts={accounts} 
                loading={loading}
                compact={false}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SocialMediaModal;