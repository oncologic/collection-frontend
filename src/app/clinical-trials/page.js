"use client";
import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FaSearch,
  FaSpinner,
  FaExternalLinkAlt,
  FaBookmark,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaFlask,
  FaMapMarkerAlt,
  FaTimes,
  FaFilter,
  FaThList,
  FaThLarge,
  FaRegCommentDots,
  FaPlus,
  FaChevronDown,
  FaDownload,
  FaFolder,
} from "react-icons/fa";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useClinicalTrialsSearch from "./useClinicalTrialsSearch";
import SearchTips from "./SearchTips";
import { useContextAuth } from "../context/authContext";
import { useAuth } from "@clerk/nextjs";
import AddToCollectionModal from "./AddToCollectionModal";
import ExportTrialsModal from "./ExportTrialsModal";
import TrialCard from "./TrialCard";
import CompactTrialCard from "./CompactTrialCard";
import TrialDetailModal from "./TrialDetailModal";
import Link from "next/link";
import toast from "react-hot-toast";
import SelectField from "../components/inputs/SelectField";
import RecruitmentStatusFilter from "./RecruitmentStatusFilter";
import LocationFilter from "./LocationFilter";
import TrialChat from "./TrialChat";
// Add imports for data fetching hooks
import { useEvents } from "../hooks/useEvents";
import { useOrganizations } from "../hooks/useOrganizations";
import { useGetAllCollections, useGetResources } from "../hooks/useResources";
import { useGetPinnedItems } from "../hooks/usePinned";

// Create a query client
const queryClient = new QueryClient();

// Wrap the component with the QueryClientProvider
const ClinicalTrialsPage = () => (
  <QueryClientProvider client={queryClient}>
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-10">
          <FaSpinner className="animate-spin text-blue-500 text-2xl mr-2" />
          <span>Loading clinical trials page...</span>
        </div>
      }
    >
      <ClinicalTrialsSearchPage />
    </Suspense>
  </QueryClientProvider>
);

const ClinicalTrialsSearchPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const keywordsParam = searchParams.get("keywords");
  const hashtagsParam = searchParams.get("hashtags");
  const [searchTerm, setSearchTerm] = useState(
    keywordsParam || hashtagsParam?.replace(/,/g, " OR ") || ""
  );
  const { isAdmin, systemUser, isAuthenticated } = useContextAuth();
  const { isSignedIn } = useAuth();

  // Location filter
  const [locationFilter, setLocationFilter] = useState("");

  // Status filter state
  const [statusFilter, setStatusFilter] = useState("all");

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTrials, setSelectedTrials] = useState([]);
  const [showAddToCollectionModal, setShowAddToCollectionModal] =
    useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const actionDropdownRef = useRef(null);

  // Add view mode state (list or compact)
  const [viewMode, setViewMode] = useState("detailed"); // "detailed" or "compact"

  // Add modal state for map view trial selection
  const [selectedTrialForModal, setSelectedTrialForModal] = useState(null);
  const [showTrialModal, setShowTrialModal] = useState(false);

  // Define all possible statuses
  const allStatuses = useMemo(
    () => ({
      RECRUITING: "Recruiting",
      ENROLLING_BY_INVITATION: "Enrolling by Invitation",
      ACTIVE_NOT_RECRUITING: "Active, Not Recruiting",
      NOT_YET_RECRUITING: "Not Yet Recruiting",
      COMPLETED: "Completed",
      TERMINATED: "Terminated",
      SUSPENDED: "Suspended",
      WITHDRAWN: "Withdrawn",
      UNKNOWN: "Unknown",
    }),
    []
  );

  // Use our updated hook
  const {
    trials,
    isLoading,
    error,
    totalResults,
    keywords,
    directClinicalTrialsUrl,
    setKeywords,
    searchTrials,
    mutation,
  } = useClinicalTrialsSearch();

  // Filtered trials state
  const [filteredTrials, setFilteredTrials] = useState([]);

  // New keyword filter state
  const [keywordFilter, setKeywordFilter] = useState("");

  // Add data fetching hooks for chat functionality
  const { data: allEventsData } = useEvents();
  const { data: allResourcesData } = useGetResources();
  const { data: allCollectionsData } = useGetAllCollections();
  const { data: allOrganizationsData } = useOrganizations();
  const { data: pinnedItems } = useGetPinnedItems();

  // Reference to TrialChat component
  const trialChatRef = useRef(null);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showActionDropdown &&
        actionDropdownRef.current &&
        !actionDropdownRef.current.contains(event.target)
      ) {
        setShowActionDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showActionDropdown]);

  // Helper function to check if URL is a video
  const isVideoUrl = useCallback((url) => {
    if (!url) return false;
    const videoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm"];
    const videoHosts = ["youtube.com", "youtu.be", "vimeo.com", "zoom.us"];

    return (
      videoExtensions.some((ext) => url.toLowerCase().includes(ext)) ||
      videoHosts.some((host) => url.toLowerCase().includes(host))
    );
  }, []);

  // Extract all videos from available data
  const allVideos = useMemo(() => {
    const videos = [];

    // Get videos from resources
    if (allResourcesData) {
      const resourceVideos = allResourcesData
        .filter((resource) => isVideoUrl(resource.url))
        .map((resource) => ({
          ...resource,
          type: "video",
          videoUrl: resource.videoUrl || resource.url,
        }));
      videos.push(...resourceVideos);
    }

    // Get videos from collections' external links and resources
    if (allCollectionsData) {
      allCollectionsData?.forEach((collection) => {
        // Videos from external links
        if (collection.externalLinks) {
          const externalLinkVideos = collection.externalLinks
            .filter((link) => isVideoUrl(link.url))
            .map((link) => ({
              id: `${collection.id}-${link.id}`,
              name: link.name,
              description: link.description,
              videoUrl: link.videoUrl || link.url,
              timestamps: link.timestamps || [],
              type: "video",
              collectionName: collection.name,
            }));
          videos.push(...externalLinkVideos);
        }

        // Videos from collection resources
        if (collection.resources) {
          const collectionResourceVideos = collection.resources
            .filter((resource) => isVideoUrl(resource.url))
            .map((resource) => ({
              ...resource,
              id: `${collection.id}-${resource.id}`,
              type: "video",
              videoUrl: resource.videoUrl || resource.url,
              collectionName: collection.name,
            }));
          videos.push(...collectionResourceVideos);
        }
      });
    }

    // Remove duplicates based on URL
    const uniqueVideos = videos.filter(
      (video, index, self) =>
        index === self.findIndex((v) => v.videoUrl === video.videoUrl)
    );

    return uniqueVideos;
  }, [allResourcesData, allCollectionsData, isVideoUrl]);

  // Set initial keywords from URL params
  useEffect(() => {
    // Get params inside the effect to ensure they're current
    const currentKeywordsParam = searchParams.get("keywords");
    const currentHashtagsParam = searchParams.get("hashtags");

    if (currentKeywordsParam) {
      setKeywords(currentKeywordsParam);

      // Initial search when page loads
      if (currentKeywordsParam.trim() !== "") {
        searchTrials({ term: currentKeywordsParam });
      }
    } else if (currentHashtagsParam) {
      // Format hashtags properly for clinical trials search
      // Remove # symbols if present and join with spaces
      const formattedHashtags = currentHashtagsParam
        .split(",")
        .map((tag) => tag.trim().replace(/^#/, ""))
        .join(" ");

      setKeywords(formattedHashtags);
      setSearchTerm(formattedHashtags);

      // Initial search when page loads
      if (formattedHashtags.trim() !== "") {
        searchTrials({ term: formattedHashtags });
      }
    }
  }, [searchParams, setKeywords, searchTrials]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();

    if (!searchTerm.trim()) {
      return;
    }

    // Reset filters when performing a new search
    setLocationFilter("");
    setStatusFilter("all");

    // Search using our hook
    searchTrials({
      term: searchTerm,
    });
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      // Clear selections when exiting selection mode
      setSelectedTrials([]);
    }
  };

  // Handle trial selection
  const handleSelectTrial = (trial) => {
    setSelectedTrials((prev) => {
      const isSelected = prev.some((t) => t.NCTId[0] === trial.NCTId[0]);
      if (isSelected) {
        return prev.filter((t) => t.NCTId[0] !== trial.NCTId[0]);
      } else {
        return [...prev, trial];
      }
    });
  };

  // Check if a trial is selected
  const isTrialSelected = (trialId) => {
    return selectedTrials.some((t) => t.NCTId[0] === trialId);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString || "N/A";
    }
  };

  // Handle add to collection success
  const handleAddToCollectionSuccess = (count) => {
    // toast.success(`Added ${count} trials to collection`); // Removed - notification shown in modal
    // Don't clear selection automatically to allow chatting about the collection
    // User can manually clear selection if desired
  };

  // Additional helper for recruiting status badge
  const isActiveRecruitingStatus = (status) => {
    const statusLower = status?.toLowerCase() || "";
    return statusLower.includes("recruiting") || statusLower.includes("active");
  };

  // Clear location filter
  const clearLocationFilter = () => {
    setLocationFilter("");
  };

  // Format status options for SelectField
  const statusOptions = useMemo(() => {
    return [
      { id: "all", name: "All Statuses" },
      ...Object.entries(allStatuses).map(([value, label]) => ({
        id: value,
        name: label,
      })),
    ];
  }, [allStatuses]);

  // Handle status change from SelectField
  const handleStatusChange = (option) => {
    setStatusFilter(option?.id || "all");
  };

  // Handle location filter change
  const handleLocationFilterChange = (e) => {
    setLocationFilter(e.target.value);
  };

  // Function to filter trials by text content
  const filterTrialsByContent = (trials, searchText) => {
    if (!searchText) return trials;

    searchText = searchText.toLowerCase();
    return trials.filter((trial) => {
      // Convert the entire trial object to a string for searching
      const trialDataString = JSON.stringify(trial).toLowerCase();
      return trialDataString.includes(searchText);
    });
  };

  // Update handleFilteredSearch to be a simple local filter function without API calls
  const handleFilteredSearch = useCallback(() => {
    if (!trials || trials.length === 0) {
      setFilteredTrials([]);
      return;
    }

    // Start with all trials from the main search
    let filtered = [...trials];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (trial) => trial.OverallStatus?.[0] === statusFilter
      );
    }

    // Apply location filter
    if (locationFilter) {
      filtered = filtered.filter((trial) =>
        trial.LocationCountry?.some((loc) =>
          loc.toLowerCase().includes(locationFilter.toLowerCase())
        )
      );
    }

    // Apply content search filter
    if (keywordFilter) {
      filtered = filterTrialsByContent(filtered, keywordFilter);
    }

    // Sort filtered trials by StartDate in descending order (newest first)
    // This ensures sorting is maintained after filtering
    filtered.sort((a, b) => {
      const dateA = a.StartDate?.[0] ? new Date(a.StartDate[0]) : null;
      const dateB = b.StartDate?.[0] ? new Date(b.StartDate[0]) : null;

      // Handle null dates - put them at the end
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      // Sort in descending order (newest first)
      return dateB - dateA;
    });

    setFilteredTrials(filtered);
  }, [trials, statusFilter, locationFilter, keywordFilter]);

  // Apply filters when any filter changes or when trials change
  useEffect(() => {
    handleFilteredSearch();
  }, [
    trials,
    statusFilter,
    locationFilter,
    keywordFilter,
    handleFilteredSearch,
  ]);

  // Cycle through view modes
  const toggleViewMode = () => {
    setViewMode((prev) => {
      if (prev === "detailed") return "compact";
      return "detailed";
    });
  };

  // Handle trial selection from map
  const handleMapTrialSelect = (trial) => {
    setSelectedTrialForModal(trial);
    setShowTrialModal(true);
  };

  // Handle map marker click
  const handleMapMarkerClick = (trial, location) => {
    // Currently unused - could be used for additional functionality like highlighting
  };

  // Handle map bounds change
  const handleMapBoundsChange = (bounds) => {
    // Currently unused - could be used to filter trials by visible map area
  };

  // Add select all functionality
  const selectAllTrials = () => {
    setSelectedTrials(filteredTrials || []);
  };

  // Add deselect all functionality
  const deselectAllTrials = () => {
    setSelectedTrials([]);
  };

  // Add bulk selection indicator
  const allTrialsSelected =
    filteredTrials.length > 0 &&
    filteredTrials.every((trial) =>
      selectedTrials.some((selected) => selected.NCTId[0] === trial.NCTId[0])
    );

  // Add keyboard shortcut handling for selection mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts in selection mode
      if (!selectionMode) return;

      // Select all trials with Ctrl+A
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault(); // Prevent default browser select all
        selectAllTrials();
      }

      // Exit selection mode with Escape
      if (e.key === "Escape") {
        toggleSelectionMode();
      }
    };

    // Add event listener
    window.addEventListener("keydown", handleKeyDown);

    // Clean up
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectionMode, filteredTrials, toggleSelectionMode]);

  // Add function to clear selections
  const clearSelections = () => {
    setSelectedTrials([]);
    setSelectionMode(false);
  };

  // Handle removing individual trial
  const handleRemoveTrial = (trialId) => {
    setSelectedTrials((prev) =>
      prev.filter((trial) => trial.NCTId?.[0] !== trialId)
    );
  };

  // Handle filtering to referenced trials from chat
  const handleFilterToReferencedTrials = (referencedTrials) => {
    if (!referencedTrials || referencedTrials.length === 0) {
      toast.info("No trials to filter to");
      return;
    }

    // Extract trial IDs from referenced trials
    const referencedTrialIds = referencedTrials
      .filter((item) => item.type === "clinical-trial")
      .map((trial) => trial.id || trial.NCTId?.[0])
      .filter(Boolean);

    if (referencedTrialIds.length === 0) {
      toast.info("No clinical trials found in referenced items");
      return;
    }

    // Filter current trials to only show referenced ones
    const referencedTrialsFromCurrent = filteredTrials.filter((trial) =>
      referencedTrialIds.includes(trial.NCTId?.[0])
    );

    if (referencedTrialsFromCurrent.length === 0) {
      toast.warning(
        "Referenced trials are not in current search results. Try searching for broader terms."
      );
      return;
    }

    // Update selection to only include referenced trials
    setSelectedTrials(referencedTrialsFromCurrent);

    // Show success message
    toast.success(
      `Filtered to ${referencedTrialsFromCurrent.length} referenced trial${
        referencedTrialsFromCurrent.length > 1 ? "s" : ""
      }`
    );

    // Scroll to top to show the filtered results
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Function to add trial to chat context
  const handleAddTrialToChat = useCallback((trial) => {
    if (trialChatRef.current && trialChatRef.current.addTrialToContext) {
      trialChatRef.current.addTrialToContext(trial);
      toast.success(
        `Added "${trial.BriefTitle?.[0] || "trial"}" to chat context`
      );
    }
  }, []);

  // Memoize trials for map to prevent infinite re-processing
  const trialsForMap = useMemo(() => {
    const trialsToShow = filteredTrials.length > 0 ? filteredTrials : trials;

    return trialsToShow;
  }, [filteredTrials, trials]);

  return (
    <div className="container mx-auto px-4 md:px-12 py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-12">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            <FaFlask className="mr-3 text-blue-500" />
            Clinical Trials Search
          </h1>

          <div className="flex items-center space-x-2">
            {/* View toggle button */}
            <button
              onClick={toggleViewMode}
              className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              aria-label={
                viewMode === "detailed"
                  ? "Switch to compact view"
                  : "Switch to detailed view"
              }
            >
              {viewMode === "detailed" ? (
                <>
                  <FaThList className="mr-2" />
                  Compact View
                </>
              ) : (
                <>
                  <FaThLarge className="mr-2" />
                  Detailed View
                </>
              )}
            </button>

            <button
              onClick={toggleSelectionMode}
              className={`inline-flex items-center px-3 py-2 text-sm rounded-md relative ${
                selectionMode
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              } hover:bg-blue-100 hover:text-blue-700 transition-colors`}
            >
              <FaBookmark className="mr-2" />
              {selectionMode ? "Cancel Selection" : "Select Trials"}

              {/* Selection badge when not in selection mode */}
              {!selectionMode && selectedTrials.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {selectedTrials.length}
                </span>
              )}
            </button>

            {directClinicalTrialsUrl && (
              <a
                href={directClinicalTrialsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                <FaExternalLinkAlt className="mr-2" />
                View on ClinicalTrials.gov
              </a>
            )}
          </div>
        </div>

        <form onSubmit={handleSearch} className="w-full">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-grow relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search for clinical trials (e.g., kidney cancer, renal cell carcinoma, chromophobe)..."
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <FaSpinner className="animate-spin mr-2" />
                  Searching...
                </span>
              ) : (
                "Search"
              )}
            </button>
          </div>

          {/* Search tips */}
          <SearchTips />

          {/* Data Source Disclaimer */}
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md p-3">
            <p>
              <strong>Note:</strong> Search results are sourced via the
              ClinicalTrials.gov API and are not curated or verified by
              Contexlia. Content accuracy is the responsibility of the original
              publishers.
            </p>
          </div>
        </form>

        {/* Filters Bar */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6 space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium flex items-center">
              <FaFilter className="mr-2 text-gray-500" /> Filters
            </h2>
            {trials.length > 0 && (
              <span className="text-sm text-gray-500">
                Filtering {trials.length} search results
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Recruitment Status Filter */}
            <div>
              <label
                htmlFor="statusFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Recruitment Status
              </label>
              <RecruitmentStatusFilter
                value={statusFilter}
                onChange={(status) => {
                  setStatusFilter(status.id);
                  handleFilteredSearch();
                }}
                showLabel={false}
              />
            </div>

            {/* Content Search Filter */}
            <div>
              <label
                htmlFor="keywordFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Filter Results
                {trials.length > 0 && (
                  <span className="text-xs text-gray-500 font-normal ml-1">
                    (within current {trials.length} results)
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="text-gray-400 h-4 w-4" />
                </div>
                <input
                  type="text"
                  id="keywordFilter"
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder={
                    trials.length > 0
                      ? "Filter by NCT ID, condition, phase..."
                      : "Search clinical trials first"
                  }
                  value={keywordFilter}
                  onChange={(e) => {
                    setKeywordFilter(e.target.value);
                    // Don't trigger a new search, just filter locally
                  }}
                  disabled={trials.length === 0}
                />
                {keywordFilter && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setKeywordFilter("")}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <FaTimes className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              {keywordFilter && trials.length > 0 && (
                <div className="mt-1 text-xs text-blue-600">
                  Showing {filteredTrials.length} of {trials.length} trials
                  containing &quot;{keywordFilter}&quot;
                </div>
              )}
              {trials.length === 0 && (
                <div className="mt-1 text-xs text-gray-500">
                  Use the main search above to find clinical trials first
                </div>
              )}
            </div>

            {/* Location Filter */}
            <div>
              <label
                htmlFor="locationFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Location
              </label>
              <LocationFilter
                value={locationFilter}
                onChange={handleLocationFilterChange}
                onClear={clearLocationFilter}
                showLabel={false}
              />
            </div>
          </div>

          {/* Show a helpful note when no search has been performed */}
          {trials.length === 0 && !isLoading && (
            <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> These filters will be available after you
                search for clinical trials using the search box above.
              </p>
            </div>
          )}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <FaSpinner className="animate-spin text-blue-500 text-2xl mr-2" />
            <span>Searching for clinical trials...</span>
          </div>
        )}

        {/* Results information */}
        {trials.length > 0 && (
          <div className="mt-6">
            <div className="text-gray-600">
              {totalResults > 0 ? (
                <p>
                  Found {totalResults} results for &quot;{keywords}&quot;
                </p>
              ) : (
                <p>No results found for &quot;{keywords}&quot;</p>
              )}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-9v4a1 1 0 11-2 0v-4a1 1 0 112 0zm0-4a1 1 0 11-2 0 1 1 0 012 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error searching clinical trials
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                  <p className="mt-2">
                    Please try again with different search terms or check your
                    internet connection.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Selection mode indicator and actions */}
        {selectionMode && (
          <div className="sticky top-0  bg-blue-50 border border-blue-200 rounded-md p-3 my-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <div className="text-blue-700 font-medium">
              {selectedTrials.length > 0 ? (
                <>
                  {selectedTrials.length} trial
                  {selectedTrials.length !== 1 && "s"} selected
                </>
              ) : (
                <>Select trials to add to a collection</>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedTrials.length > 0 ? (
                <button
                  onClick={deselectAllTrials}
                  className="px-3 py-1 text-sm bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50"
                >
                  Deselect All
                </button>
              ) : (
                <button
                  onClick={selectAllTrials}
                  className="px-3 py-1 text-sm bg-white border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50"
                >
                  Select All ({filteredTrials.length})
                </button>
              )}

              {selectedTrials.length > 0 && (
                <div className="relative" ref={actionDropdownRef}>
                  <button
                    onClick={() => setShowActionDropdown(!showActionDropdown)}
                    className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    <FaPlus className="mr-2" />
                    Actions
                    <FaChevronDown className="ml-2 h-3 w-3" />
                  </button>

                  {showActionDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100] origin-top-right">
                      {/* Export Option - Always Available */}
                      <button
                        onClick={() => {
                          setShowActionDropdown(false);
                          setShowExportModal(true);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700"
                      >
                        <FaDownload className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Export</div>
                          <div className="text-xs text-gray-500">
                            Export selected trials for LLM analysis
                          </div>
                        </div>
                      </button>

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-1" />

                      {/* Add to Collection Option */}
                      {isSignedIn && systemUser ? (
                        <button
                          onClick={() => {
                            setShowActionDropdown(false);
                            setShowAddToCollectionModal(true);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700"
                        >
                          <FaFolder className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium">Add to Collection</div>
                            <div className="text-xs text-gray-500">
                              Save selected trials to a collection
                            </div>
                          </div>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex items-center gap-3 w-full px-4 py-3 text-left opacity-50 cursor-not-allowed text-gray-400"
                          title="Sign in to add to collection"
                        >
                          <FaFolder className="w-5 h-5" />
                          <div>
                            <div className="font-medium">Add to Collection</div>
                            <div className="text-xs">
                              Sign in or create an account to add trials to a
                              collection
                            </div>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Chat Prompt - show when trials are selected but not in selection mode */}
        {/* {!selectionMode && selectedTrials.length > 0 && (
          <div className="my-4 p-3 bg-blue-50 border border-blue-200 rounded-md shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <FaRegCommentDots className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Ask AI about the {selectedTrials.length} selected trials
                </h3>
                <p className="mt-1 text-sm text-blue-600">
                  Click the chat panel at the bottom right to ask questions
                  about efficacy, eligibility, comparison, or other aspects of
                  these trials.
                </p>
              </div>
            </div>
          </div>
        )} */}

        {/* Results */}
        <div className="mt-8">
          {isLoading ? (
            <p className="text-center">Loading results...</p>
          ) : error ? (
            <div className="text-red-500 text-center">
              <p>Error: {error}</p>
            </div>
          ) : (
            <>
              {trials.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      Found{" "}
                      {locationFilter ? filteredTrials.length : totalResults}{" "}
                      clinical trials
                      {locationFilter && (
                        <> matching location &quot;{locationFilter}&quot;</>
                      )}
                    </p>

                    {/* Bulk selection checkbox - only show in list views */}
                    {selectionMode && filteredTrials.length > 0 && (
                      <div className="flex items-center">
                        <label className="inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={allTrialsSelected}
                            onChange={
                              allTrialsSelected
                                ? deselectAllTrials
                                : selectAllTrials
                            }
                            className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            {allTrialsSelected ? "Deselect All" : "Select All"}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Grid layout with view mode toggle */}
                  <div
                    className={`grid grid-cols-1 ${
                      viewMode === "compact"
                        ? "md:grid-cols-3 lg:grid-cols-4"
                        : "md:grid-cols-2 lg:grid-cols-3"
                    } gap-6`}
                  >
                    {(filteredTrials || []).map((trial, index) =>
                      viewMode === "detailed" ? (
                        <TrialCard
                          key={trial.NCTId[0] || index}
                          trial={trial}
                          formatDate={formatDate}
                          selectionMode={selectionMode}
                          isSelected={isTrialSelected(trial.NCTId[0])}
                          onSelect={() => handleSelectTrial(trial)}
                          onAddToChat={handleAddTrialToChat}
                        />
                      ) : (
                        <CompactTrialCard
                          key={trial.NCTId[0] || index}
                          trial={trial}
                          formatDate={formatDate}
                          selectionMode={selectionMode}
                          isSelected={isTrialSelected(trial.NCTId[0])}
                          onSelect={() => handleSelectTrial(trial)}
                          onAddToChat={handleAddTrialToChat}
                        />
                      )
                    )}
                  </div>

                  {locationFilter && filteredTrials.length === 0 && (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
                      <FaMapMarkerAlt className="mx-auto text-gray-400 text-2xl mb-2" />
                      <p className="text-gray-600">
                        No trials found in &quot;{locationFilter}&quot;
                      </p>
                      <button
                        onClick={clearLocationFilter}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        Clear location filter
                      </button>
                    </div>
                  )}
                </>
              ) : keywords ? (
                // Only show "no results" if a search was actually performed
                <div className="text-center py-8">
                  <FaFlask className="mx-auto text-gray-400 text-3xl mb-4" />
                  <p className="text-lg text-gray-700 mb-2">
                    No clinical trials found for &quot;{keywords}&quot;
                  </p>
                  <p className="text-gray-600 mb-4">
                    Try using different keywords or check for spelling errors.
                  </p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>
                      • Use broader terms (e.g., &quot;cancer&quot; instead of
                      &quot;lung adenocarcinoma&quot;)
                    </p>
                    <p>• Try medical condition names or treatment types</p>
                    <p>• Remove quotation marks for broader searches</p>
                  </div>
                </div>
              ) : (
                // Show this when no search has been performed yet
                <div className="text-center py-12">
                  <FaFlask className="mx-auto text-blue-500 text-4xl mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Search Clinical Trials
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Enter a medical condition, treatment, or research area in
                    the search box above to find relevant clinical trials.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-lg mx-auto">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">
                      Example searches:
                    </h3>
                    <div className="text-sm text-blue-700 space-y-1">
                      <p>
                        • &quot;clear-cell renal cell carcinoma&quot; - Find
                        trials for a specific type of cancer
                      </p>
                      <p>• &quot;chromophobe&quot;</p>
                      <p>• &quot;papillary renal cell carcinoma&quot;</p>
                      <p>• &quot;kidney cancer&quot; </p>
                      <p>
                        • &quot;clear-cell renal cell carcinoma&quot;
                        immunotherapy
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add to Collection Modal */}
      {showAddToCollectionModal && isSignedIn && systemUser && (
        <AddToCollectionModal
          selectedTrials={selectedTrials}
          onClose={() => setShowAddToCollectionModal(false)}
          onSuccess={handleAddToCollectionSuccess}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportTrialsModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          selectedTrials={selectedTrials}
        />
      )}

      {/* Trial Detail Modal from Map */}
      {showTrialModal && selectedTrialForModal && (
        <TrialDetailModal
          trial={selectedTrialForModal}
          isOpen={showTrialModal}
          onClose={() => {
            setShowTrialModal(false);
            setSelectedTrialForModal(null);
          }}
          onAddToChat={handleAddTrialToChat}
        />
      )}

      {/* Trial Chat - Add this at the end */}
      {/* <TrialChat
        ref={trialChatRef}
        selectedTrials={selectedTrials}
        onClearSelection={clearSelections}
        onRemovePublication={handleRemoveTrial}
        onFilterToReferencedTrials={handleFilterToReferencedTrials}
        userDetails={systemUser}
        allResources={allResourcesData || []}
        allCollections={allCollectionsData || []}
        allEvents={allEventsData || []}
        allOrganizations={allOrganizationsData || []}
        allVideos={allVideos}
        pinnedItems={pinnedItems || []}
      /> */}
    </div>
  );
};

export default ClinicalTrialsPage;
