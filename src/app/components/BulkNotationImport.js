import React, { useState, useRef } from "react";
import { useAddExternalLinkNotation } from "@/app/hooks/useCollections";
import { useExternalLinkTags } from "@/app/hooks/useTags";
import { toast } from "react-hot-toast";
import {
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaUpload,
  FaFile,
  FaDownload,
} from "react-icons/fa";

const BulkNotationImport = ({ collectionId, externalLinkId, onComplete }) => {
  const [importing, setImporting] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [errors, setErrors] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState({ successful: 0, failed: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAfterImport, setShowAfterImport] = useState(true);
  const fileInputRef = useRef(null);
  const addNotation = useAddExternalLinkNotation();
  const { data: availableTags = [] } = useExternalLinkTags();

  // Resolve tag names to tag objects with IDs
  const resolveTags = (tagInput) => {
    if (!tagInput || !Array.isArray(tagInput)) {
      return [];
    }

    return tagInput
      .map((tag) => {
        // If it's already an object with id, return as is
        if (typeof tag === "object" && tag.id) {
          return tag;
        }

        // If it's a string, try to find matching tag by name
        if (typeof tag === "string") {
          const foundTag = availableTags.find(
            (t) => t.name.toLowerCase() === tag.toLowerCase()
          );
          if (foundTag) {
            return foundTag;
          }
          // If tag doesn't exist, return null (we'll skip it)
          // Note: We could create tags here, but that's risky for bulk imports
          return null;
        }

        return null;
      })
      .filter(Boolean); // Remove nulls
  };

  const validateImportFile = (data) => {
    const validationErrors = [];

    if (!data.version) {
      validationErrors.push("Missing 'version' field");
    }

    if (!data.notations || !Array.isArray(data.notations)) {
      validationErrors.push("Missing or invalid 'notations' array");
      return validationErrors;
    }

    if (data.notations.length === 0) {
      validationErrors.push("Notations array is empty");
    }

    data.notations.forEach((notation, index) => {
      if (!notation.title) {
        validationErrors.push(`Notation ${index + 1}: Missing title`);
      }
      if (!notation.content) {
        validationErrors.push(`Notation ${index + 1}: Missing content`);
      }
      if (notation.date && !/^\d{4}-\d{2}-\d{2}$/.test(notation.date)) {
        validationErrors.push(
          `Notation ${index + 1}: Invalid date format (expected YYYY-MM-DD)`
        );
      }
      if (
        notation.startTime &&
        !/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(notation.startTime)
      ) {
        validationErrors.push(
          `Notation ${index + 1}: Invalid startTime format (expected HH:MM)`
        );
      }
    });

    return validationErrors;
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      toast.error("Please select a JSON file");
      return;
    }

    setImportFile(file);
    setErrors([]);
    setPreviewData(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const validationErrors = validateImportFile(data);

        if (validationErrors.length > 0) {
          setErrors(validationErrors);
          toast.error(`Validation errors found: ${validationErrors.length}`);
        } else {
          setPreviewData(data);
          toast.success(
            `File loaded: ${data.notations.length} notations ready to import`
          );
        }
      } catch (error) {
        setErrors([`Invalid JSON: ${error.message}`]);
        toast.error("Failed to parse JSON file");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!previewData || !collectionId || !externalLinkId) {
      toast.error("Missing required data");
      return;
    }

    if (errors.length > 0) {
      toast.error("Please fix validation errors before importing");
      return;
    }

    if (
      !window.confirm(
        `This will create ${previewData.notations.length} notes. Continue?`
      )
    ) {
      return;
    }

    setImporting(true);
    setProgress({ current: 0, total: previewData.notations.length });
    setResults({ successful: 0, failed: 0 });

    let successful = 0;
    let failed = 0;
    const failedItems = [];
    const successfulItems = [];

    for (let i = 0; i < previewData.notations.length; i++) {
      const notation = previewData.notations[i];
      setProgress({
        current: i + 1,
        total: previewData.notations.length,
      });

      try {
        // Resolve tags from names to objects with IDs
        const resolvedTags = resolveTags(notation.tags);

        const notationData = {
          title: notation.title,
          notes: notation.content,
          category: notation.category || "Action",
          status: notation.status || "Pending",
          date: notation.date || null,
          startTime: notation.startTime || null,
          endTime: notation.endTime || null,
          timezone: notation.timezone || null,
          visibility: notation.visibility || "private",
          highlighted: notation.highlighted || false,
          tags: resolvedTags, // Use resolved tags
          customFields: notation.customFields || {},
        };

        await addNotation.mutateAsync({
          collectionId,
          externalLinkId,
          notationData,
        });
        successfulItems.push(notationData);
        successful++;
      } catch (error) {
        console.error(`Failed to import notation ${i + 1}:`, error);
        failed++;
        failedItems.push({
          index: i + 1,
          title: notation.title,
          error: error.message,
        });
      }

      // Small delay to avoid overwhelming the API
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setResults({ successful, failed, failedItems });
    setImporting(false);

    if (successful > 0) {
      toast.success(`Successfully imported ${successful} notes!`);
    }
    if (failed > 0) {
      toast.error(`Failed to import ${failed} notes`);
      console.error("Failed items:", failedItems);
    }

    if (onComplete) {
      onComplete({ successful, failed, failedItems, successfulItems });
    }

    // Hide component after successful import (can be re-expanded if needed)
    if (successful > 0 && failed === 0) {
      setShowAfterImport(false);
      setIsExpanded(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = {
      version: "1.0.0",
      metadata: {
        title: "Bulk Notation Import Template",
        createdBy: "User",
        createdAt: new Date().toISOString(),
        description: "Template for bulk importing notations",
      },
      notations: [
        {
          title: "Example Notation",
          content:
            "This is an example notation content.\n\nYou can use **markdown** formatting.",
          date: "2024-11-25",
          startTime: "10:00",
          timezone: "America/Chicago",
          category: "Action",
          status: "Pending",
          visibility: "private",
          highlighted: false,
          tags: ["example"],
          customFields: {
            platforms: "Facebook, Instagram",
            assignedTo: "Team Member",
            scheduled: "2024-11-25",
            posted: "no",
            finalCopy: "no",
          },
        },
      ],
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk-notation-import-template.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Template downloaded");
  };

  // Don't show if import was successful and component is collapsed
  if (!showAfterImport && !isExpanded && results.successful > 0) {
    return (
      <div className="mb-3">
        <button
          onClick={() => {
            setIsExpanded(true);
            setShowAfterImport(true);
          }}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          <FaUpload className="text-xs" />
          Bulk Import
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-3">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-medium text-gray-700 hover:text-gray-900 flex items-center gap-1"
        >
          <FaUpload className="text-xs" />
          Bulk Import
          {isExpanded && (
            <span className="text-gray-500">
              ({previewData?.notations.length || 0} ready)
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <button
              onClick={handleDownloadTemplate}
              className="px-2 py-1 text-xs bg-white hover:bg-gray-50 text-gray-600 font-medium rounded border border-gray-300 transition-colors flex items-center gap-1"
              title="Download template"
            >
              <FaDownload className="text-xs" />
              Template
            </button>
          )}
          {isExpanded && (
            <button
              onClick={() => {
                setIsExpanded(false);
                setImportFile(null);
                setPreviewData(null);
                setErrors([]);
              }}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {/* File Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="w-full px-3 py-1.5 border border-dashed border-gray-300 rounded hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-xs text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaUpload className="text-xs" />
              {importFile ? (
                <span className="truncate max-w-[200px]">
                  {importFile.name}
                </span>
              ) : (
                "Select JSON File"
              )}
            </button>
          </div>

          {/* Preview */}
          {previewData && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <FaFile className="text-blue-600 text-xs" />
                <span className="text-xs font-medium text-blue-900">
                  {previewData.notations.length} notations ready
                </span>
              </div>
              {previewData.metadata?.title && (
                <div className="text-xs text-blue-700 truncate">
                  {previewData.metadata.title}
                </div>
              )}
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <div className="flex items-center gap-1.5 mb-1">
                <FaExclamationCircle className="text-red-600 text-xs" />
                <span className="text-xs font-medium text-red-900">
                  {errors.length} error{errors.length !== 1 ? "s" : ""}
                </span>
              </div>
              <ul className="text-xs text-red-700 list-disc list-inside space-y-0.5 max-h-20 overflow-y-auto">
                {errors.slice(0, 3).map((error, index) => (
                  <li key={index} className="truncate">
                    {error}
                  </li>
                ))}
                {errors.length > 3 && (
                  <li className="text-red-600">
                    ...and {errors.length - 3} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Import Button */}
          {previewData && errors.length === 0 && (
            <button
              onClick={handleImport}
              disabled={importing || !collectionId || !externalLinkId}
              className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded transition-colors flex items-center justify-center gap-1.5"
            >
              {importing ? (
                <>
                  <FaSpinner className="animate-spin text-xs" />
                  Importing...
                </>
              ) : (
                <>
                  <FaUpload className="text-xs" />
                  Import {previewData.notations.length}
                </>
              )}
            </button>
          )}

          {/* Progress */}
          {importing && (
            <div>
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span className="truncate">
                  {progress.current}/{progress.total}
                </span>
                <span>
                  {Math.round((progress.current / progress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Results */}
          {!importing && results.successful + results.failed > 0 && (
            <div className="flex items-center gap-3 text-xs">
              {results.successful > 0 && (
                <div className="flex items-center gap-1 text-green-600">
                  <FaCheckCircle className="text-xs" />
                  <span>{results.successful} imported</span>
                </div>
              )}
              {results.failed > 0 && (
                <div className="flex items-center gap-1 text-red-600">
                  <FaExclamationCircle className="text-xs" />
                  <span>{results.failed} failed</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkNotationImport;
