"use client";
import { useState } from "react";
import { FaCopy, FaCheck, FaClock, FaCalendar } from "react-icons/fa";
import CustomEditor from "../common/CustomEditor";
import { DateTime } from "luxon";
import { toast } from "react-hot-toast";

const NotationDetail = ({ isOpen, onClose, notation, onViewDetails }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !notation) return null;

  // Function to extract plain text from HTML content
  const extractTextFromHTML = (htmlContent) => {
    if (!htmlContent) return "";

    // Parse the HTML content to extract text without images
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    // Remove all img elements
    const images = doc.querySelectorAll("img");
    images.forEach(img => img.remove());

    // Get the text content
    let textContent = doc.body.textContent || "";

    // Clean up excessive whitespace
    textContent = textContent
      .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newline
      .trim();

    return textContent;
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      const textContent = extractTextFromHTML(notation.notes || notation.description);

      if (!textContent) {
        toast.error("No text content to copy");
        return;
      }

      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      toast.success("Text copied to clipboard!");

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast.error("Failed to copy text to clipboard");
    }
  };

  // Format the date and time
  const formatDateTime = (dateStr) => {
    if (!dateStr) return null;

    try {
      const date = DateTime.fromISO(dateStr);
      if (!date.isValid) {
        const date2 = DateTime.fromFormat(dateStr, "yyyy-MM-dd");
        if (date2.isValid) {
          return {
            date: date2.toFormat("EEE, MMM dd, yyyy"),
            time: null
          };
        }
        return null;
      }

      return {
        date: date.toFormat("EEE, MMM dd, yyyy"),
        time: notation.startTime || notation.time
          ? `${notation.startTime || notation.time}${notation.endTime ? ` - ${notation.endTime}` : ""}`
          : null
      };
    } catch (e) {
      return null;
    }
  };

  const dateTimeInfo = formatDateTime(notation.date || notation.startDate || notation.createdAt);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-400 bg-opacity-50 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full mx-4 shadow-xl">
        {/* Header Section */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 mr-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {notation.title || "Notation"}
              </h2>

              {/* Date and Time */}
              {dateTimeInfo && (
                <div className="flex flex-col gap-1 text-sm text-gray-600">
                  {dateTimeInfo.date && (
                    <div className="flex items-center gap-2">
                      <FaCalendar className="text-gray-400 text-xs" />
                      <span>{dateTimeInfo.date}</span>
                    </div>
                  )}
                  {dateTimeInfo.time && (
                    <div className="flex items-center gap-2">
                      <FaClock className="text-gray-400 text-xs" />
                      <span>{dateTimeInfo.time}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Status/Category Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {notation.status && (
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    notation.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : notation.status === "in_progress"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-gray-100 text-gray-700"
                  }`}>
                    {notation.status.replace("_", " ")}
                  </span>
                )}
                {notation.category && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    {notation.category}
                  </span>
                )}
                {notation.type === "notation" && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                    Note
                  </span>
                )}
              </div>
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopy}
              className={`p-2 rounded-lg transition-all duration-200 ${
                copied
                  ? "bg-green-50 text-green-600 hover:bg-green-100"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
              title="Copy text content (without images)"
            >
              {copied ? (
                <FaCheck className="w-4 h-4" />
              ) : (
                <FaCopy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
          {notation.notes || notation.description ? (
            <CustomEditor
              content={notation.notes || notation.description}
              readOnly={true}
              transparent={true}
            />
          ) : (
            <p className="text-gray-500 italic">No content available</p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotationDetail;