"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  FaShare,
  FaCalendar,
  FaEye,
  FaExternalLinkAlt,
  FaHashtag,
  FaVideo,
  FaFileAlt,
  FaDownload,
  FaPlay,
  FaSpinner,
  FaExclamationTriangle,
  FaUsers,
  FaGlobe,
  FaBookOpen,
  FaFlask,
  FaPaperclip,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

const SharedCollectionPage = () => {
  const { id } = useParams();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState("all");

  useEffect(() => {
    const loadCollection = async () => {
      try {
        setLoading(true);
        // TODO: Implement fetchSharedCollection function
        // const data = await fetchSharedCollection(id);
        // setCollection(data);
        setError("Function not implemented yet");
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadCollection();
    }
  }, [id]);

  const getResourceIcon = (typeId) => {
    const iconMap = {
      1: FaFileAlt,
      2: FaBookOpen,
      3: FaFlask,
      4: FaUsers,
      5: FaVideo,
      6: FaGlobe,
      7: FaPaperclip,
      8: FaDownload,
      9: FaVideo,
    };
    return iconMap[typeId] || FaFileAlt;
  };

  const getResourceTypeColor = (typeId) => {
    const colorMap = {
      1: "bg-blue-100 text-blue-800",
      2: "bg-green-100 text-green-800",
      3: "bg-purple-100 text-purple-800",
      4: "bg-orange-100 text-orange-800",
      5: "bg-red-100 text-red-800",
      6: "bg-indigo-100 text-indigo-800",
      7: "bg-yellow-100 text-yellow-800",
      8: "bg-pink-100 text-pink-800",
      9: "bg-teal-100 text-teal-800",
    };
    return colorMap[typeId] || "bg-gray-100 text-gray-800";
  };

  const getResourceTypeName = (typeId) => {
    const typeMap = {
      1: "Article",
      2: "Book",
      3: "Research",
      4: "Community",
      5: "Video",
      6: "Website",
      7: "Attachment",
      8: "Download",
      9: "Webinar",
    };
    return typeMap[typeId] || "Resource";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const stripHtml = (html) => {
    if (!html) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const filteredResources =
    collection?.resources?.filter(
      (resource) =>
        selectedType === "all" || resource.typeId.toString() === selectedType
    ) || [];

  const uniqueTypes = [
    ...new Set(collection?.resources?.map((r) => r.typeId) || []),
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <FaExclamationTriangle className="text-5xl text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Collection Not Found
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              {collection?.icon && (
                <div
                  className={`w-16 h-16 rounded-full bg-${collection.color}-100 flex items-center justify-center mr-4`}
                >
                  <FaUsers
                    className={`text-2xl text-${collection.color}-600`}
                  />
                </div>
              )}
              <h1 className="text-4xl md:text-5xl font-bold">
                {collection?.name}
              </h1>
            </div>

            {collection?.description && (
              <div className="max-w-3xl mx-auto">
                <p className="text-xl text-blue-100 leading-relaxed">
                  {stripHtml(collection.description)}
                </p>
              </div>
            )}

            <div className="flex items-center justify-center mt-8 space-x-6 text-blue-100">
              <div className="flex items-center">
                <FaCalendar className="mr-2" />
                <span>Updated {formatDate(collection?.updatedAt)}</span>
              </div>
              <div className="flex items-center">
                <FaBookOpen className="mr-2" />
                <span>{collection?.resources?.length || 0} Resources</span>
              </div>
              {collection?.externalLinks?.length > 0 && (
                <div className="flex items-center">
                  <FaExternalLinkAlt className="mr-2" />
                  <span>{collection.externalLinks.length} External Links</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      {uniqueTypes.length > 1 && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setSelectedType("all")}
                className={`px-4 py-2 rounded-full transition-colors ${
                  selectedType === "all"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All Resources ({collection?.resources?.length || 0})
              </button>
              {uniqueTypes.map((typeId) => {
                const count =
                  collection?.resources?.filter((r) => r.typeId === typeId)
                    .length || 0;
                return (
                  <button
                    key={typeId}
                    onClick={() => setSelectedType(typeId.toString())}
                    className={`px-4 py-2 rounded-full transition-colors ${
                      selectedType === typeId.toString()
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {getResourceTypeName(typeId)} ({count})
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Resources Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredResources.length === 0 ? (
          <div className="text-center py-16">
            <FaBookOpen className="text-5xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Resources Found
            </h3>
            <p className="text-gray-600">
              This collection does not have any resources yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResources.map((resource) => {
              const IconComponent = getResourceIcon(resource.typeId);
              return (
                <div
                  key={resource.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getResourceTypeColor(
                          resource.typeId
                        )}`}
                      >
                        <IconComponent className="mr-2 text-sm" />
                        {getResourceTypeName(resource.typeId)}
                      </div>
                      {resource.featured && (
                        <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                          Featured
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {resource.name}
                    </h3>

                    {resource.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {stripHtml(resource.description)}
                      </p>
                    )}

                    {resource.resourceDate && (
                      <div className="flex items-center text-sm text-gray-500 mb-4">
                        <FaCalendar className="mr-2" />
                        {formatDate(resource.resourceDate)}
                      </div>
                    )}

                    {resource.collectionNotes && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          <strong>Collection Notes:</strong>{" "}
                          {resource.collectionNotes}
                        </p>
                      </div>
                    )}

                    {resource.timestamps && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-4">
                        <p className="text-xs text-gray-600 font-medium mb-1">
                          Timestamps:
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {resource.timestamps}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      {resource.url && (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          {resource.videoUrl ? (
                            <>
                              <FaPlay className="mr-2" />
                              Watch Video
                            </>
                          ) : (
                            <>
                              <FaExternalLinkAlt className="mr-2" />
                              View Resource
                            </>
                          )}
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* External Links Section */}
        {collection?.externalLinks?.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Additional Resources
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collection.externalLinks.map((link) => (
                <div
                  key={link.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <FaExternalLinkAlt className="text-indigo-600 mt-1" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {link.name}
                  </h3>
                  {link.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {stripHtml(link.description)}
                    </p>
                  )}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    <FaExternalLinkAlt className="mr-2" />
                    Visit Link
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <FaGlobe className="text-4xl mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-semibold mb-2">Shared Collection</h3>
            <p className="text-gray-400">
              This collection has been shared publicly for educational and
              informational purposes.
            </p>
          </div>
          <div className="text-gray-500 text-sm">
            <p>Collection ID: {collection?.id}</p>
            <p>Last updated: {formatDate(collection?.updatedAt)}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SharedCollectionPage;
