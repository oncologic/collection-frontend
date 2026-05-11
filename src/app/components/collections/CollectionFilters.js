import {
  FaFilter,
  FaDatabase,
  FaExternalLinkAlt,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaGlobe,
} from "react-icons/fa";

const STATUS_OPTIONS = [
  { id: "pending", label: "Pending" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "waiting", label: "Waiting" },
  { id: "large reference", label: "Large Reference" },
  { id: "archived", label: "Archived" },
];

const CollectionFilters = ({
  activeTypeFilter,
  onTypeFilterChange,
  visibilityFilter,
  onVisibilityFilterChange,
  statusFilter,
  onStatusFilterChange,
  getStatusCount,
  STATUS_OPTIONS,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      {/* Type Filters - Clean pill design */}
      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
        <button
          onClick={() => onTypeFilterChange("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTypeFilter === "all"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          All
        </button>
        <button
          onClick={() => onTypeFilterChange("resource")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            activeTypeFilter === "resource"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <FaDatabase className="text-xs" />
          Resources
        </button>
        <button
          onClick={() => onTypeFilterChange("external")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            activeTypeFilter === "external"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <FaExternalLinkAlt className="text-xs" />
          External
        </button>
      </div>

      {/* Visibility Toggle - Elegant four-option design */}
      <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-100">
        <button
          onClick={() => onVisibilityFilterChange("all")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            visibilityFilter === "all"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <FaEye className="text-xs" />
          <span className="hidden sm:inline">All</span>
        </button>
        <button
          onClick={() => onVisibilityFilterChange("public")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            visibilityFilter === "public"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <FaGlobe className="text-xs" />
          <span className="hidden sm:inline">Public</span>
        </button>
        <button
          onClick={() => onVisibilityFilterChange("private")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            visibilityFilter === "private"
              ? "bg-white text-red-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <FaLock className="text-xs" />
          <span className="hidden sm:inline">Private</span>
        </button>
        <button
          onClick={() => onVisibilityFilterChange("unlisted")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            visibilityFilter === "unlisted"
              ? "bg-white text-orange-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <FaEyeSlash className="text-xs" />
          <span className="hidden sm:inline">Unlisted</span>
        </button>
      </div>
    </div>
  );
};

export default CollectionFilters;
