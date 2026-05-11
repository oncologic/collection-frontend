import React, { useState } from "react";
import {
  FaTimes,
  FaBuilding,
  FaBookOpen,
  FaTag,
  FaEdit,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";

const ImportPreviewModal = ({ data, onClose, onEdit, onConfirm }) => {
  const [activeTab, setActiveTab] = useState("organizations");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Preview Import Data</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FaTimes />
          </button>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 p-4 border-b">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <FaBuilding className="text-blue-600 mr-2" />
              <span className="font-medium">
                {data.organizations?.length || 0} Organizations
              </span>
            </div>
            <div className="flex items-center">
              <FaBookOpen className="text-green-600 mr-2" />
              <span className="font-medium">
                {data.resources?.length || 0} Resources
              </span>
            </div>
            <div className="flex items-center">
              <FaTag className="text-purple-600 mr-2" />
              <span className="font-medium">
                {data.tags?.length || 0} Unique Tags
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "organizations"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("organizations")}
          >
            Organizations ({data.organizations?.length || 0})
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "resources"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("resources")}
          >
            Resources ({data.resources?.length || 0})
          </button>
          <button
            className={`px-4 py-2 font-medium ${
              activeTab === "tags"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("tags")}
          >
            Tags ({data.tags?.length || 0})
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: "50vh" }}>
          {/* Organizations Tab */}
          {activeTab === "organizations" && (
            <div className="space-y-3">
              {data.organizations?.map((org, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{org.name}</h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {org.description}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        {org.email && <span>Email: {org.email}</span>}
                        {org.phone && <span>Phone: {org.phone}</span>}
                        {org.website && <span>Website: {org.website}</span>}
                      </div>
                      {org.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {org.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-gray-100 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === "resources" && (
            <div className="space-y-3">
              {data.resources?.map((resource, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {resource.name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {resource.description}
                      </p>
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                        >
                          {resource.url}
                        </a>
                      )}
                      <div className="text-xs text-gray-500 mt-2">
                        Organization: {resource.organizationName}
                      </div>
                      {resource.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {resource.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="px-2 py-1 bg-gray-100 text-xs rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tags Tab */}
          {activeTab === "tags" && (
            <div className="grid grid-cols-3 gap-2">
              {data.tags?.map((tag, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-gray-100 rounded-md text-sm"
                >
                  {tag}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit("organizations")}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              <FaEdit className="inline-block mr-2" />
              Edit Organizations
            </button>
            <button
              onClick={() => onEdit("resources")}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              <FaEdit className="inline-block mr-2" />
              Edit Resources
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <FaCheck className="inline-block mr-2" />
              Confirm Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPreviewModal;
