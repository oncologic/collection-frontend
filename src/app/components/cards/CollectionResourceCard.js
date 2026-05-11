import React, { useState } from "react";
import { FaPlus, FaComment, FaArrowLeft, FaCheck } from "react-icons/fa";
import Image from "next/image";
import ResourceDetailModal from "../modals/ResourceDetailModal";

const CollectionResourceCard = ({
  resource,
  flippedResourceId,
  setFlippedResourceId,
  resourceNotes,
  handleNoteChange,
  addResourceToCollection,
  collectionId,
  collectionNote,
  isSelected = false,
  toggleResourceSelection,
}) => {
  const isFlipped = flippedResourceId === resource.id;
  const [showDetailModal, setShowDetailModal] = useState(false);
  const hasBulkSelection = typeof toggleResourceSelection === "function";

  const stripHtmlAndMarkdown = (text) => {
    if (!text) return "";
    // Remove HTML tags
    const withoutHtml = text.replace(/<[^>]*>/g, "");
    // Remove markdown links [text](url)
    const withoutLinks = withoutHtml.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    // Remove markdown bold/italic
    const withoutFormatting = withoutLinks.replace(
      /[*_]{1,3}([^*_]+)[*_]{1,3}/g,
      "$1"
    );
    // Remove markdown headers
    const withoutHeaders = withoutFormatting.replace(/#{1,6}\s+/g, "");
    return withoutHeaders.trim();
  };

  const handleFlip = () => {
    setFlippedResourceId(isFlipped ? null : resource.id);
  };

  const handleAddResource = () => {
    addResourceToCollection(collectionId, resource);
  };

  const handleToggleSelection = () => {
    toggleResourceSelection?.(resource.id);
  };

  // Get resource type label or default to "Resource"
  const resourceTypeLabel = resource.resourceType?.name || "Resource";

  return (
    <div className="perspective h-[350px]">
      <div
        className={`transform-style-3d transition-all duration-500 w-full h-full ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front of card */}
        <div
          className={`backface-hidden h-full ${isFlipped ? "hidden" : "block"}`}
        >
          <div
            className={`group relative flex flex-col h-full overflow-hidden rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 ${
              isSelected
                ? "border-blue-300 ring-2 ring-blue-200 bg-blue-50/30"
                : "border-slate-200"
            }`}
          >
            {/* Resource type badge */}
            <div className="absolute top-3 left-3 z-10">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {resourceTypeLabel}
              </span>
            </div>

            {hasBulkSelection && (
              <button
                onClick={handleToggleSelection}
                className={`absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {isSelected && <FaCheck size={11} />}
                <span>{isSelected ? "Selected" : "Select"}</span>
              </button>
            )}

            {/* Resource image */}
            <div className="relative w-full h-32 rounded-t-lg bg-gradient-to-r from-blue-300 to-purple-400 flex items-center justify-center">
              {resource.organizations?.[0]?.imageUrl ? (
                <Image
                  width={80}
                  height={80}
                  src={resource.organizations[0].imageUrl}
                  alt={resource.name || "Resource image"}
                  className="w-20 h-20 rounded-lg shadow-lg border-2 border-white object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-20 h-20 rounded-lg shadow-lg border-2 border-white bg-white flex items-center justify-center">
                  <span className="text-slate-400 text-4xl font-medium">
                    {resource.name ? resource.name.charAt(0) : "?"}
                  </span>
                </div>
              )}
            </div>

            {/* Resource content */}
            <div className="flex flex-col flex-grow p-4">
              <h3 className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2">
                {resource.name || resource.title}
              </h3>
              <p className="text-sm text-slate-600 mb-4 line-clamp-3 flex-grow">
                {stripHtmlAndMarkdown(resource.description) ||
                  "No description available"}
              </p>

              {/* Action buttons */}
              <div className="mt-auto flex gap-2 justify-end items-center">
                <button
                  onClick={() => setShowDetailModal(true)}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-300 hover:bg-blue-400 rounded-lg transition-colors"
                >
                  View
                </button>
                <button
                  onClick={handleFlip}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <FaComment className="text-slate-500" size={14} />
                  Add Note
                </button>
                <button
                  onClick={handleAddResource}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  <FaPlus size={14} />
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back of card (notes) */}
        <div
          className={`absolute w-full h-full backface-hidden rotate-y-180 ${
            isFlipped ? "block" : "hidden"
          }`}
        >
          <div className="group relative flex flex-col h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Add Notes</h3>
                <div className="flex items-center gap-2">
                  {hasBulkSelection && (
                    <button
                      onClick={handleToggleSelection}
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        isSelected
                          ? "border-white/30 bg-white text-blue-700"
                          : "border-white/30 bg-transparent text-white hover:bg-white/10"
                      }`}
                    >
                      {isSelected && <FaCheck size={11} />}
                      <span>{isSelected ? "Selected" : "Select"}</span>
                    </button>
                  )}
                  <button
                    onClick={handleFlip}
                    className="flex items-center gap-1 text-sm text-white/80 hover:text-white transition-colors"
                  >
                    <FaArrowLeft size={12} /> Back
                  </button>
                </div>
              </div>
            </div>

            {/* Notes textarea */}
            <div className="p-4 flex-grow flex flex-col">
              <textarea
                className="w-full flex-grow p-3 border-2 border-slate-200 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                placeholder="Add notes about this resource..."
                value={resourceNotes[resource.id] || ""}
                onChange={(e) => handleNoteChange(resource.id, e.target.value)}
              />

              {/* Add button */}
              <div className="mt-4 flex justify-end gap-2">
                {hasBulkSelection && (
                  <button
                    onClick={handleToggleSelection}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
                      isSelected
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {isSelected && <FaCheck size={14} />}
                    <span>{isSelected ? "Selected" : "Select for Bulk"}</span>
                  </button>
                )}
                <button
                  onClick={handleAddResource}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg transition-colors shadow-sm"
                >
                  <FaCheck size={14} />
                  Add to Collection
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3D transform styles */}
      <style jsx>{`
        .perspective {
          perspective: 2000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
          position: relative;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>

      {/* Resource Detail Modal */}
      <ResourceDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        resource={resource}
        collectionNote={collectionNote}
      />
    </div>
  );
};

export default CollectionResourceCard;
