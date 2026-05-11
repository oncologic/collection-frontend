"use client";

import { useState } from "react";
import {
  FaDatabase,
  FaCopy,
  FaEye,
  FaToggleOn,
  FaToggleOff,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  useToggleCollectionPublicJsonSharing,
  useToggleExternalLinkPublicJsonSharing,
} from "@/app/hooks/useSharedLinks";
import {
  generateShareSlug,
  updateCollectionShareSlug,
} from "@/app/api/shareApi";

const PublicJsonSharingControl = ({
  type, // 'collection' or 'external_link'
  id,
  isEnabled = false,
  onToggle,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const toggleCollectionSharing = useToggleCollectionPublicJsonSharing();
  const toggleExternalLinkSharing = useToggleExternalLinkPublicJsonSharing();

  const isCollection = type === "collection";
  const mutation = isCollection
    ? toggleCollectionSharing
    : toggleExternalLinkSharing;

  const publicUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/public/${
    isCollection ? "collection" : "external-link"
  }/${id}`;

  const handleToggle = async () => {
    try {
      if (isCollection) {
        await mutation.mutateAsync({ collectionId: id, enabled: !isEnabled });
      } else {
        await mutation.mutateAsync({ externalLinkId: id, enabled: !isEnabled });
      }
      onToggle?.(!isEnabled);
    } catch (error) {
      console.error("Failed to toggle public JSON sharing:", error);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Public JSON URL copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy URL");
    }
  };

  const handleViewJson = () => {
    window.open(publicUrl, "_blank");
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FaDatabase className="text-blue-600" />
          <span className="font-medium text-gray-900">Public JSON API</span>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            {showDetails ? "Hide details" : "Learn more"}
          </button>
        </div>
        <button
          onClick={handleToggle}
          disabled={mutation.isLoading}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors ${
            isEnabled
              ? "bg-green-100 text-green-700 hover:bg-green-200"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          } ${mutation.isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isEnabled ? (
            <FaToggleOn className="text-lg" />
          ) : (
            <FaToggleOff className="text-lg" />
          )}
          <span className="text-sm font-medium">
            {mutation.isLoading
              ? "Updating..."
              : isEnabled
              ? "Enabled"
              : "Disabled"}
          </span>
        </button>
      </div>

      {showDetails && (
        <div className="mb-3 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
          <p className="mb-2">
            <strong>Public JSON API:</strong> When enabled, this creates a
            public URL that returns your{" "}
            {isCollection ? "collection" : "external link"} data in JSON format.
          </p>
          <ul className="list-disc list-inside space-y-1 mb-2">
            <li>Only non-private items are included</li>
            <li>No personal information is exposed</li>
            <li>Perfect for integrations and sharing curated content</li>
            <li>Rate limited to prevent abuse</li>
          </ul>
          <p className="text-xs text-blue-600">
            Anyone with the URL can access the JSON data without authentication.
          </p>
        </div>
      )}

      {isEnabled && (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-md p-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Public JSON URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={publicUrl}
                readOnly
                className="flex-1 text-xs bg-white border border-gray-200 rounded px-2 py-1 font-mono"
              />
              <button
                onClick={handleCopyUrl}
                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="Copy URL"
              >
                <FaCopy className="text-sm" />
              </button>
              <button
                onClick={handleViewJson}
                className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                title="View JSON"
              >
                <FaExternalLinkAlt className="text-sm" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopyUrl}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              <FaCopy className="text-xs" />
              Copy URL
            </button>
            <button
              onClick={handleViewJson}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              <FaEye className="text-xs" />
              View JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const getShareUrl = (collection) => {
  const baseUrl = window.location.origin;

  // Use share slug if available, otherwise fall back to ID
  if (collection.shareSlug) {
    return `${baseUrl}/public/collections/${collection.shareSlug}`;
  } else {
    return `${baseUrl}/public/collections/${collection.id}`;
  }
};

const ReadableUrlGenerator = ({ collection, onUpdate }) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateSlug = async () => {
    setIsGenerating(true);
    try {
      await updateCollectionShareSlug({
        collectionId: collection.id,
        headers: {}, // Add your auth headers here
      });
      toast.success("Readable URL generated!");
      onUpdate(); // Refresh the collection data
    } catch (error) {
      toast.error("Failed to generate readable URL");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyShareUrl = () => {
    const shareUrl = getShareUrl(collection);
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success("Share URL copied to clipboard!");
    });
  };

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h4 className="font-medium text-blue-900 mb-2">Public Share URL</h4>

      {collection.shareSlug ? (
        <div className="space-y-2">
          <div className="text-sm text-blue-700">
            <strong>Readable URL:</strong>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-white rounded border text-sm font-mono break-all">
              {getShareUrl(collection)}
            </code>
            <button
              onClick={copyShareUrl}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-blue-600">
            This URL is human-readable and includes the collection name while
            remaining secure.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <code className="flex-1 p-2 bg-white rounded border text-sm font-mono break-all">
              {getShareUrl(collection)}
            </code>
            <button
              onClick={copyShareUrl}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
            >
              Copy
            </button>
          </div>
          <button
            onClick={handleGenerateSlug}
            disabled={isGenerating}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
          >
            {isGenerating ? "Generating..." : "Generate Readable URL"}
          </button>
          <p className="text-xs text-blue-600">
            Generate a human-readable URL that includes the collection name
            (e.g., /liver-metastasis-resources-x9k2m)
          </p>
        </div>
      )}
    </div>
  );
};

export default PublicJsonSharingControl;
