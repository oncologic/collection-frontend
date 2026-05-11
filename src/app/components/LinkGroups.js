import { useState } from "react";
import {
  FaList,
  FaTh,
  FaExternalLinkAlt,
  FaVideo,
  FaFileAlt,
  FaImage,
  FaGlobe,
  FaFlask,
  FaPlay,
  FaEnvelope,
} from "react-icons/fa";
import VideoBrowser from "./VideoBrowser";

const getCategoryIcon = (category) => {
  switch (category?.toLowerCase()) {
    case "video":
      return <FaPlay />;
    case "article":
      return <FaFileAlt />;
    case "image":
      return <FaImage />;
    case "website":
      return <FaGlobe />;
    case "email":
      return <FaEnvelope />;
    case "document":
      return <FaFileAlt />;
    case "trial":
      return <FaFlask />;
    default:
      return <FaExternalLinkAlt />;
  }
};

const LinkGroups = ({ linkGroups, onEdit, onDelete, editable }) => {
  const [isVideoBrowserOpen, setIsVideoBrowserOpen] = useState(false);
  const [selectedVideoGroup, setSelectedVideoGroup] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedDescription, setSelectedDescription] = useState(null);

  if (!linkGroups || Object.keys(linkGroups).length === 0) {
    return null;
  }

  // Flatten all items into a single array
  const allItems = Object.entries(linkGroups).reduce(
    (acc, [category, items]) => {
      return [...acc, ...items];
    },
    []
  );

  // Group all videos together
  const videoItems = allItems.filter(
    (item) => item.category?.toLowerCase() === "video"
  );
  const nonVideoItems = allItems.filter(
    (item) => item.category?.toLowerCase() !== "video"
  );

  // Determine which non-video items to show
  const nonVideoItemsToShow = showAll
    ? nonVideoItems
    : nonVideoItems.slice(0, 2);
  const hasMore = nonVideoItems.length > 2;

  return (
    <div className="space-y-4">
      {/* Grid of all items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Video Card (if videos exist) */}
        {videoItems.length > 0 && (
          <button
            onClick={() => {
              setSelectedVideoGroup(videoItems);
              setIsVideoBrowserOpen(true);
            }}
            className="block w-full h-full p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-all hover:shadow-md text-left"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
                <FaPlay />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  Videos ({videoItems.length})
                </p>
                <p className="text-sm text-gray-500">
                  Click to browse all videos
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Non-video items */}
        {nonVideoItemsToShow.map((item) => (
          <div key={item.id} className="group relative h-full">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 transition-all hover:shadow-md"
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600">
                  {getCategoryIcon(item.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.name}
                  </p>
                  <p
                    onClick={(e) => {
                      e.preventDefault();
                      if (item.description) {
                        setSelectedDescription(
                          item.description.replace(/<[^>]*>/g, "")
                        );
                      }
                    }}
                    className="text-sm text-gray-500 line-clamp-2 cursor-pointer hover:text-purple-600"
                  >
                    {item.description?.replace(/<[^>]*>/g, "")}
                  </p>
                </div>
              </div>
            </a>
            {editable && (
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onEdit(item);
                  }}
                  className="p-1 text-gray-400 hover:text-purple-600 rounded"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(item);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 rounded ml-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-2 text-sm text-gray-500 hover:text-purple-600 transition-colors"
        >
          {showAll
            ? "Show less"
            : `Show ${nonVideoItems.length - 2} more items`}
        </button>
      )}

      {/* Video Browser Modal */}
      <VideoBrowser
        videos={selectedVideoGroup || []}
        isOpen={isVideoBrowserOpen}
        onEdit={onEdit}
        onDelete={onDelete}
        onClose={() => {
          setIsVideoBrowserOpen(false);
          setSelectedVideoGroup(null);
        }}
      />

      {/* Add Description Modal */}
      {selectedDescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <p className="text-gray-700 mb-4">{selectedDescription}</p>
            <button
              onClick={() => setSelectedDescription(null)}
              className="text-sm px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkGroups;
