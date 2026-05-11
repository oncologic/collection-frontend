"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  FaDatabase,
  FaExternalLinkAlt,
  FaCalendarAlt,
  FaUser,
  FaEye,
  FaCopy,
  FaDownload,
  FaSpinner,
  FaExclamationTriangle,
  FaPaperclip,
  FaStickyNote,
  FaLink,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  useGetPublicCollectionJson,
  useGetPublicExternalLinkJson,
} from "@/app/hooks/useSharedLinks";

const PublicJsonViewer = ({ type, id }) => {
  const [showRawJson, setShowRawJson] = useState(false);

  const isCollection = type === "collection";
  const collectionQuery = useGetPublicCollectionJson(isCollection ? id : null);
  const externalLinkQuery = useGetPublicExternalLinkJson(
    !isCollection ? id : null
  );

  const query = isCollection ? collectionQuery : externalLinkQuery;
  const { data, isLoading, error } = query;

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      toast.success("JSON copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy JSON");
    }
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${isCollection ? "collection" : "external-link"}-${id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading public data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center max-w-md mx-auto">
          <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Content Not Available
          </h3>
          <p className="text-gray-600 mb-4">
            {error.message ||
              "This content is not publicly available or has been removed."}
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm text-yellow-800">
            <p className="font-medium mb-1">Possible reasons:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Public JSON sharing is disabled</li>
              <li>Content has been made private</li>
              <li>Content no longer exists</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FaDatabase className="text-2xl text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
              <p className="text-sm text-gray-500">
                Public {isCollection ? "Collection" : "External Link"} Data
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowRawJson(!showRawJson)}
              className={`px-3 py-2 rounded-md transition-colors ${
                showRawJson
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {showRawJson ? "Pretty View" : "Raw JSON"}
            </button>
            <button
              onClick={handleCopyJson}
              className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <FaCopy className="text-sm" />
              Copy
            </button>
            <button
              onClick={handleDownloadJson}
              className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <FaDownload className="text-sm" />
              Download
            </button>
          </div>
        </div>

        {data.description && (
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 mb-2">Description</h3>
            <div className="text-gray-700 bg-gray-50 rounded p-3">
              {data.description}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-500">Visibility:</span>
            <p className="capitalize">{data.visibility || "public"}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Status:</span>
            <p className="capitalize">{data.status || "active"}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Created:</span>
            <p>{formatDate(data.createdAt)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Updated:</span>
            <p>{formatDate(data.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      {showRawJson ? (
        <div className="bg-gray-900 rounded-lg p-6 overflow-auto">
          <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Collection-specific content */}
          {isCollection && data.externalLinks && (
            <div className="bg-white rounded-lg shadow-md border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaLink className="text-blue-600" />
                External Links ({data.externalLinks.length})
              </h2>
              <div className="space-y-4">
                {data.externalLinks.map((link, index) => (
                  <div key={link.id || index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{link.name}</h3>
                      {link.url && (
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FaExternalLinkAlt />
                        </a>
                      )}
                    </div>
                    {link.description && (
                      <p className="text-gray-600 text-sm mb-2">
                        {link.description}
                      </p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                      <div>Type: {link.type || "link"}</div>
                      <div>Added: {formatDate(link.dateAdded)}</div>
                      <div>Status: {link.status || "active"}</div>
                      <div>Attachments: {link.attachments?.length || 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* External link-specific content */}
          {!isCollection && (
            <div className="bg-white rounded-lg shadow-md border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Link Details
              </h2>
              {data.url && (
                <div className="mb-4">
                  <a
                    href={data.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline flex items-center gap-2"
                  >
                    <FaExternalLinkAlt />
                    {data.url}
                  </a>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">Type:</span>
                  <p>{data.type || "link"}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Date Added:</span>
                  <p>{formatDate(data.dateAdded)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Timezone:</span>
                  <p>{data.timezone || "UTC"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Attachments */}
          {data.attachments && data.attachments.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaPaperclip className="text-gray-600" />
                Attachments ({data.attachments.length})
              </h2>
              <div className="grid gap-3">
                {data.attachments.map((attachment, index) => (
                  <div
                    key={attachment.id || index}
                    className="border rounded p-3"
                  >
                    <h4 className="font-medium text-gray-900">
                      {attachment.title}
                    </h4>
                    {attachment.description && (
                      <p className="text-gray-600 text-sm">
                        {attachment.description}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      Type: {attachment.type} | Added:{" "}
                      {formatDateTime(attachment.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notations */}
          {data.notations && data.notations.length > 0 && (
            <div className="bg-white rounded-lg shadow-md border p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FaStickyNote className="text-yellow-600" />
                Notations ({data.notations.length})
              </h2>
              <div className="space-y-3">
                {data.notations.map((notation, index) => (
                  <div
                    key={notation.id || index}
                    className="border rounded p-3"
                  >
                    <h4 className="font-medium text-gray-900">
                      {notation.title}
                    </h4>
                    {notation.description && (
                      <p className="text-gray-700">{notation.description}</p>
                    )}
                    {notation.notes && (
                      <p className="text-gray-600 text-sm mt-1">
                        {notation.notes}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 mt-2 flex gap-4">
                      <span>Category: {notation.category || "general"}</span>
                      <span>Status: {notation.status || "active"}</span>
                      {notation.date && (
                        <span>Date: {formatDate(notation.date)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata */}
          {data._metadata && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">API Metadata</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p>Generated: {formatDateTime(data._metadata.generatedAt)}</p>
                <p>Type: {data._metadata.type}</p>
                {data._metadata.itemCount && (
                  <p>Items: {data._metadata.itemCount}</p>
                )}
                {data._metadata.disclaimer && (
                  <p className="italic">{data._metadata.disclaimer}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicJsonViewer;
