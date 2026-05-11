"use client";

import React from "react";
import { FaShareAlt } from "react-icons/fa";

const SocialMediaButton = ({ onClick, count = 0, className = "", showCount = true }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors ${className}`}
      title="View social media accounts"
    >
      <FaShareAlt className="text-lg" />
      <span>Social Media</span>
      {showCount && count > 0 && (
        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
};

export default SocialMediaButton;