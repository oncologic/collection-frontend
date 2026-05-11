import React from "react";
import Modal from "../Modal";
import CustomEditor from "../common/CustomEditor";
import DOMPurify from "dompurify";
import { DateTime } from "luxon";
import {
  FaTimes,
  FaExternalLinkAlt,
  FaCalendar,
  FaShieldAlt,
  FaGraduationCap,
  FaTags,
} from "react-icons/fa";

const ResourceDetailModal = ({ isOpen, onClose, resource, collectionNote }) => {
  if (!resource) return null;

  // Format date
  const formattedDate = resource.resourceDate
    ? DateTime.fromISO(resource.resourceDate).toFormat("LLLL dd, yyyy")
    : "No date available";

  return (
    <Modal onClose={onClose} isOpen={isOpen} showCloseButton={false}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-900">
              {resource.name || resource.title}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              {/* Resource Type */}
              {resource.resourceType?.name && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  {resource.resourceType.name}
                </span>
              )}

              {/* Sensitivity Level */}
              {resource.sensitivityLevel && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                  <FaShieldAlt className="w-3 h-3" />
                  {resource.sensitivityLevel === 1
                    ? "Low"
                    : resource.sensitivityLevel === 2
                    ? "Medium"
                    : resource.sensitivityLevel === 3
                    ? "High"
                    : "Pending"}{" "}
                  Sensitivity
                </span>
              )}

              {/* Expertise Level */}
              {resource.expertiseLevel?.name && (
                <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                  <FaGraduationCap className="w-4 h-4" />
                  {resource.expertiseLevel.name} Level
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {/* Date and Organization */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <span className="flex items-center gap-2">
              <FaCalendar className="w-4 h-4" />
              {formattedDate}
            </span>
            {resource.organizations?.[0]?.name && (
              <span className="flex items-center gap-2">
                <span>•</span>
                {resource.organizations[0].name}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Description
            </h3>
            <div className="prose prose-sm max-w-none">
              {resource.description ? (
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(resource.description),
                  }}
                />
              ) : (
                <p className="text-gray-500 italic">No description available</p>
              )}
            </div>
          </div>

          {/* Resource Notes */}
          {resource.notes && (
            <div className="mb-4 bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {resource.notes}
                </p>
              </div>
            </div>
          )}

          {/* Collection Notes */}
          {collectionNote && (
            <div className="mb-6 bg-indigo-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Collection Notes
              </h3>
              <div className="prose prose-sm max-w-none">
                <div
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(collectionNote),
                  }}
                />
              </div>
            </div>
          )}

          {/* Tags */}
          {resource.tags && resource.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FaTags className="w-4 h-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {resource.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end items-center pt-4 border-t border-gray-200">
            {resource.url && (
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Visit Resource
                <FaExternalLinkAlt className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ResourceDetailModal;
