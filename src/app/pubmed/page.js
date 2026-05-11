"use client";
import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  Suspense,
  useCallback,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  FaSearch,
  FaFlask,
  FaExternalLinkAlt,
  FaArrowLeft,
  FaSpinner,
  FaExclamationTriangle,
  FaFilter,
  FaSlidersH,
  FaTimes,
  FaSort,
  FaFolder,
  FaPlus,
  FaQuoteRight,
  FaInfoCircle,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaKey,
  FaDownload,
} from "react-icons/fa";
import Link from "next/link";
import SelectField from "../components/inputs/SelectField";
import PublicationCard from "./PublicationCard";
import usePubMedSearch from "./usePubMedSearch";
import AddToCollectionModal from "./AddToCollectionModal";
import { useContextAuth } from "../context/authContext";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import PubMedChat from "./PubMedChat";
import ExportPubMedModal from "./ExportPubMedModal";
import PubMedFirstVisitModal from "./PubMedFirstVisitModal";
import { buildPubMedResourcePayload } from "./pubmedResourceUtils";
// Add imports for data fetching hooks
import { useEvents } from "../hooks/useEvents";
import { useOrganizations } from "../hooks/useOrganizations";
import {
  useCreateResource,
  useGetAllCollections,
  useGetResources,
} from "../hooks/useResources";
import { useGetPinnedItems } from "../hooks/usePinned";

// Search tips component for PubMed
const SearchTips = () => (
  <details className="mt-3 text-sm bg-blue-50 border border-blue-200 rounded-md p-3">
    <summary className="cursor-pointer text-blue-600 font-medium flex items-center">
      <FaInfoCircle className="mr-2" /> PubMed Search Tips
    </summary>
    <div className="mt-2 text-gray-700 space-y-2">
      <p>PubMed supports advanced search queries:</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Exact phrases:</strong> Use quotes{" "}
          <code>&quot;like this&quot;</code> to search for exact phrases (or use
          the checkbox above)
        </li>
        <li>
          <strong>Field-specific search:</strong> Use square brackets like{" "}
          <code>cancer[Title]</code> to search in specific fields
        </li>
        <li>
          <strong>Boolean operators:</strong> Use AND, OR, NOT to combine terms
          (must be uppercase)
        </li>
        <li>
          <strong>Example:</strong>{" "}
          <code>
            &quot;renal cell carcinoma&quot;[Title] AND therapy[MeSH Terms]
          </code>
        </li>
      </ul>
      <p>
        <a
          href="https://pubmed.ncbi.nlm.nih.gov/help/#search-tips"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Learn more about PubMed search syntax →
        </a>
      </p>
    </div>
  </details>
);

const ResourceTenantPickerModal = ({
  isOpen,
  tenants = [],
  isSubmitting = false,
  onClose,
  onSelectTenant,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Select Tenant</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isSubmitting}
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-4">
          <p className="text-gray-600 mb-4">
            Choose which tenant should own the new resource
            {tenants.length !== 1 ? "s" : ""}.
          </p>

          <div className="space-y-3">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => onSelectTenant(tenant)}
                disabled={isSubmitting}
                className="w-full p-4 text-left border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="font-semibold text-gray-800 capitalize">
                  {tenant.name}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Client Component that uses search params
const PubMedSearch = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const keywordsParam = searchParams.get("keywords");
  const [searchTerm, setSearchTerm] = useState(keywordsParam || "");
  const [localFilter, setLocalFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const filterRef = useRef(null);
  const { isAdmin, systemUser, isAuthenticated, selectedTenants } =
    useContextAuth();
  const { isSignedIn } = useAuth();

  // Action dropdown state and ref (must be declared before useEffect)
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const actionDropdownRef = useRef(null);

  // Add data fetching hooks for chat functionality
  const { data: allEventsData } = useEvents();
  const { data: allResourcesData } = useGetResources();
  const { data: allCollectionsData } = useGetAllCollections();
  const { data: allOrganizationsData } = useOrganizations();
  const { data: pinnedItems } = useGetPinnedItems();
  const { mutateAsync: createResource } = useCreateResource();

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

  // Show first visit modal for non-signed-in users
  useEffect(() => {
    // Only show for non-signed-in users (patients)
    if (isSignedIn) {
      return;
    }

    // Check if user has already seen the modal
    const hasSeenModal = localStorage.getItem("pubmed-first-visit-seen");
    if (!hasSeenModal) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        setShowFirstVisitModal(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isSignedIn]);

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
      allCollectionsData.forEach((collection) => {
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

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPublications, setSelectedPublications] = useState([]);
  const [showAddToCollectionModal, setShowAddToCollectionModal] =
    useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showFirstVisitModal, setShowFirstVisitModal] = useState(false);
  const [showResourceTenantPicker, setShowResourceTenantPicker] =
    useState(false);
  const [isCreatingResources, setIsCreatingResources] = useState(false);

  const {
    // State
    keywords,
    publications,
    isLoading,
    error,
    sortBy,
    page,
    totalResults,
    directPubMedUrl,
    isRateLimited,
    apiKey,
    resultsPerPage,
    // Setters
    setKeywords,
    setSortBy,
    setApiKey,
    setPage,
    // Functions
    formatDate,
    copyCitation,
    handleNextPage,
    handlePrevPage,
  } = usePubMedSearch();

  // Filter the publications based on the local filter
  const filteredPublications = useMemo(() => {
    if (!localFilter.trim()) return publications;

    const filterLower = localFilter.toLowerCase();
    return publications.filter(
      (pub) =>
        pub.title.toLowerCase().includes(filterLower) ||
        pub.authors.toLowerCase().includes(filterLower) ||
        pub.journal.toLowerCase().includes(filterLower) ||
        pub.abstract.toLowerCase().includes(filterLower) ||
        pub.articleType.toLowerCase().includes(filterLower)
    );
  }, [publications, localFilter]);

  // Group publications by month/year
  const groupedPublications = useMemo(() => {
    const groups = {};

    filteredPublications.forEach((pub) => {
      if (!pub.publicationDate || pub.publicationDate === "Unknown Date") {
        if (!groups["Unknown Date"]) {
          groups["Unknown Date"] = [];
        }
        groups["Unknown Date"].push(pub);
        return;
      }

      // Parse the date and format it as month/year
      try {
        const date = new Date(pub.publicationDate);
        const monthYear = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
        });

        if (!groups[monthYear]) {
          groups[monthYear] = [];
        }
        groups[monthYear].push(pub);
      } catch (e) {
        // Handle unparseable dates
        if (!groups["Unknown Date"]) {
          groups["Unknown Date"] = [];
        }
        groups["Unknown Date"].push(pub);
      }
    });

    // Convert to an array of { date, publications } objects
    return Object.keys(groups)
      .map((date) => ({ date, publications: groups[date] }))
      .sort((a, b) => {
        // Put "Unknown Date" at the end
        if (a.date === "Unknown Date") return 1;
        if (b.date === "Unknown Date") return -1;

        // Sort the rest by date (newest first)
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
  }, [filteredPublications]);

  // Sort options for SelectField
  const sortOptions = [
    { id: "date", name: "Most Recent" },
    { id: "relevance", name: "Relevance" },
  ];

  // Close filters when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Set initial keywords from URL params
  React.useEffect(() => {
    if (keywordsParam) {
      setKeywords(keywordsParam);
    }
  }, [keywordsParam, setKeywords]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setPage(1);
      setKeywords(searchTerm.trim());
      // Update URL with new search term
      router.push(`/pubmed?keywords=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  // Handle API key change
  const handleApiKeyChange = (e) => {
    setApiKey(e.target.value);
  };

  // Handle local filter change
  const handleFilterChange = (e) => {
    setLocalFilter(e.target.value);
  };

  // Toggle filters panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Toggle selection mode
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      // Clear selections when exiting selection mode
      setSelectedPublications([]);
    }
  };

  // Handle publication selection
  const handleSelectPublication = (publication) => {
    setSelectedPublications((prev) => {
      const isSelected = prev.some((p) => p.id === publication.id);
      if (isSelected) {
        return prev.filter((p) => p.id !== publication.id);
      } else {
        return [...prev, publication];
      }
    });
  };

  // Handle removing individual publication from selection
  const handleRemovePublication = (publicationId) => {
    setSelectedPublications((prev) =>
      prev.filter((p) => p.id !== publicationId)
    );
  };

  const createResourcesInTenant = async (tenant) => {
    try {
      setIsCreatingResources(true);
      const createdResources = [];

      for (const publication of selectedPublications) {
        const createdResource = await createResource(
          {
            ...buildPubMedResourcePayload(publication),
            tenantId: tenant.id,
          }
        );
        createdResources.push(createdResource);
      }

      const primaryResource = createdResources[0];

      toast.custom(
        (t) => (
          <div
            className={`${
              t.visible ? "animate-enter" : "animate-leave"
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex items-center`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 pt-0.5">
                  <FaCheck className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Created {createdResources.length} resource
                    {createdResources.length !== 1 ? "s" : ""} from PubMed
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {createdResources.length === 1
                      ? `${primaryResource?.name || "Open resource"} in ${
                          tenant.name
                        }`
                      : `Created in ${tenant.name}`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push(
                    createdResources.length === 1 && primaryResource?.id
                      ? `/resources/${primaryResource.id}`
                      : "/resources"
                  );
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                {createdResources.length === 1 ? "Open Resource" : "Go to Resources"}
              </button>
            </div>
          </div>
        ),
        { duration: 5000 }
      );

      setShowResourceTenantPicker(false);
      setSelectionMode(false);
      setSelectedPublications([]);
    } catch (error) {
      console.error("Failed to create resources from publications:", error);
      toast.error(error.message || "Failed to create resources from publications");
    } finally {
      setIsCreatingResources(false);
    }
  };

  const handleAddToResource = async () => {
    if (!selectedPublications.length) return;

    setShowActionDropdown(false);

    if (!selectedTenants?.length) {
      toast.error("Select a tenant before creating resources");
      return;
    }

    if (selectedTenants.length === 1) {
      await createResourcesInTenant(selectedTenants[0]);
      return;
    }

    setShowResourceTenantPicker(true);
  };

  // Check if a publication is selected
  const isPublicationSelected = (publicationId) => {
    return selectedPublications.some((p) => p.id === publicationId);
  };

  // Handle add to collection success
  const handleAddToCollectionSuccess = (
    count,
    collectionId,
    collectionName
  ) => {
    if (!collectionId || !collectionName) {
      setSelectionMode(false);
      setSelectedPublications([]);
      return;
    }

    // Create custom toast with link to the collection
    toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? "animate-enter" : "animate-leave"
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex items-center`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 pt-0.5">
                <FaCheck className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  Added {count} publication{count !== 1 ? "s" : ""} to
                  collection
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  View in{" "}
                  <span className="font-semibold">{collectionName}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-200">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                router.push(`/collections/${collectionId}`);
              }}
              className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none"
            >
              Go to Collection
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );

    setSelectionMode(false);
    setSelectedPublications([]);
  };

  return (
    <div className="container mx-auto md:px-12 px-4 py-6">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-12">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
            <FaFlask className="mr-3 text-blue-500" />
            PubMed Research Search
          </h1>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleSelectionMode}
              className={`inline-flex items-center px-3 py-2 text-sm rounded-md ${
                selectionMode
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              } hover:bg-blue-100 hover:text-blue-700 transition-colors`}
            >
              <FaPlus className="mr-2" />
              {selectionMode ? "Cancel Selection" : "Select Papers"}
            </button>

            {directPubMedUrl && (
              <a
                href={directPubMedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <FaExternalLinkAlt className="mr-2" />
                Open in PubMed
              </a>
            )}
          </div>
        </div>

        {/* Selection bar */}
        {selectionMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex justify-between items-center">
            <span className="text-blue-700">
              {selectedPublications.length} publication
              {selectedPublications.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  // Select all filtered publications
                  const publicationsToSelect = filteredPublications.filter(
                    (pub) =>
                      !selectedPublications.some(
                        (selected) => selected.id === pub.id
                      )
                  );
                  setSelectedPublications((prev) => [
                    ...prev,
                    ...publicationsToSelect,
                  ]);
                }}
                className="text-blue-700 hover:text-blue-900 px-2 py-1 text-sm"
                disabled={
                  filteredPublications.length === 0 ||
                  filteredPublications.every((pub) =>
                    selectedPublications.some(
                      (selected) => selected.id === pub.id
                    )
                  )
                }
              >
                Select All ({filteredPublications.length})
              </button>
              <button
                onClick={() => setSelectedPublications([])}
                className="text-blue-700 hover:text-blue-900 px-2 py-1 text-sm"
                disabled={selectedPublications.length === 0}
              >
                Clear
              </button>
              {selectedPublications.length > 0 && (
                <div className="relative" ref={actionDropdownRef}>
                  <button
                    onClick={() => setShowActionDropdown(!showActionDropdown)}
                    className="inline-flex items-center px-3 py-1 rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors text-sm"
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
                            Export selected publications for LLM analysis
                          </div>
                        </div>
                      </button>

                      {/* Divider */}
                      <div className="border-t border-gray-200 my-1" />

                      {/* Add to Resource Option */}
                      {isSignedIn && systemUser ? (
                        <button
                          onClick={handleAddToResource}
                          className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700"
                        >
                          <FaPlus className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium">Add to Resource</div>
                            <div className="text-xs text-gray-500">
                              Create resource records from selected publications
                            </div>
                          </div>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="flex items-center gap-3 w-full px-4 py-3 text-left opacity-50 cursor-not-allowed text-gray-400"
                          title="Sign in to add to resource"
                        >
                          <FaPlus className="w-5 h-5" />
                          <div>
                            <div className="font-medium">Add to Resource</div>
                            <div className="text-xs">
                              Sign in or create an account to create resources
                            </div>
                          </div>
                        </button>
                      )}

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
                              Save selected publications to a collection
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
                              Sign in or create an account to add publications
                              to a collection
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

        {/* Rate limiting warning */}
        {isRateLimited && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <FaExclamationTriangle className="text-yellow-400 mr-3" />
              <div>
                <p className="text-yellow-700">
                  Rate limit exceeded. Waiting to retry...
                  <span className="animate-pulse"> ⌛</span>
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  To avoid rate limits, you can add your NCBI API key below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Search form */}
        <form onSubmit={handleSearch} className="w-full">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-grow relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter keywords to search PubMed..."
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              disabled={isLoading || isRateLimited}
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

          {/* Search tips component */}
          <SearchTips />

          {/* NCBI Disclaimer and Copyright Notice */}
          <div className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
            <p>
              <strong>NCBI Disclaimer and Copyright Notice:</strong>
            </p>
            <p>
              This service uses the Entrez Programming Utilities (E-utilities)
              from the National Center for Biotechnology Information (NCBI).
              NCBI&apos;s{" "}
              <a
                href="https://www.ncbi.nlm.nih.gov/About/disclaimer.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Disclaimer and Copyright notice
              </a>{" "}
              applies to all data retrieved through this service.
            </p>
            <p>
              <strong>Copyright:</strong> Abstracts in PubMed may incorporate
              material that may be protected by U.S. and foreign copyright laws.
              All persons reproducing, redistributing, or making commercial use
              of this information are expected to adhere to the terms and
              conditions asserted by the copyright holder. Transmission or
              reproduction of protected items beyond that allowed by fair use as
              defined in the copyright laws requires the written permission of
              the copyright owners.
            </p>
            <p className="text-gray-400 italic">
              Note: Search results are sourced via the PubMed API (NCBI/NLM) and
              are not curated or verified by Contexlia. Content accuracy is the
              responsibility of the original publishers.
            </p>
          </div>

          {/* API Key input */}
          {/* <div className="mt-2">
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                Add NCBI API Key (optional)
              </summary>
              <div className="mt-2 p-3 border border-gray-200 rounded-md bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NCBI API Key:
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={handleApiKeyChange}
                  placeholder="Enter your NCBI API key to avoid rate limits"
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Get an API key at{" "}
                  <a
                    href="https://www.ncbi.nlm.nih.gov/account/settings/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    NCBI Account Settings
                  </a>
                  . This increases your request limit from 3 to 10 per second.
                </p>
              </div>
            </details>
          </div> */}
        </form>

        {/* Filter and sort controls */}
        {publications.length > 0 && (
          <div className="relative" ref={filterRef}>
            <div className="flex flex-row justify-between items-center">
              <div className="text-gray-600">
                {totalResults > 0 ? (
                  <p>
                    {localFilter
                      ? `Showing ${filteredPublications.length} filtered results out of `
                      : `Showing ${
                          (page - 1) * resultsPerPage + 1
                        } - ${Math.min(
                          page * resultsPerPage,
                          totalResults
                        )} of `}
                    {totalResults} results for &quot;{keywords}&quot;
                  </p>
                ) : (
                  <p>No results found for &quot;{keywords}&quot;</p>
                )}
              </div>

              <button
                onClick={toggleFilters}
                className={`ml-2 p-2 rounded-md ${
                  showFilters || localFilter
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                } transition-colors`}
                aria-label="Filter and sort options"
              >
                <FaSlidersH className="text-lg" />
              </button>
            </div>

            {/* Filters dropdown panel */}
            {showFilters && (
              <div className="absolute right-0 mt-2 w-full md:w-96 z-10 bg-white rounded-md shadow-lg border border-gray-200 p-4 text-left">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">Filter & Sort</h3>
                  <button
                    onClick={toggleFilters}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Sort control */}
                <div className="mb-4">
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FaSort className="mr-2 text-gray-500" /> Sort by:
                  </label>
                  <SelectField
                    value={sortOptions.find((option) => option.id === sortBy)}
                    onChange={(option) => setSortBy(option.id)}
                    options={sortOptions}
                    placeholder="Select sorting method"
                  />
                </div>

                {/* Local filter */}
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <FaFilter className="mr-2 text-gray-500" /> Filter results:
                  </label>
                  <input
                    type="text"
                    value={localFilter}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Filter by title, author, journal..."
                  />
                  {localFilter && (
                    <button
                      onClick={() => setLocalFilter("")}
                      className="mt-2 text-xs text-blue-600 hover:underline flex items-center"
                    >
                      <FaTimes className="mr-1" /> Clear filter
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <FaSpinner className="animate-spin text-blue-500 text-2xl mr-2" />
            <span>Searching PubMed...</span>
          </div>
        )}

        {/* Error message */}
        {error && !isRateLimited && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && publications.length > 0 && (
          <div className="mt-6 space-y-8">
            {filteredPublications.length > 0 ? (
              groupedPublications.map((group) => (
                <div key={group.date} className="space-y-4">
                  <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">
                    {group.date}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {group.publications.map((pub) => (
                      <PublicationCard
                        key={pub.id}
                        publication={pub}
                        formatDate={formatDate}
                        onCopyCitation={copyCitation}
                        selectionMode={selectionMode}
                        isSelected={isPublicationSelected(pub.id)}
                        onSelect={handleSelectPublication}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No results match your filter criteria.</p>
                <button
                  onClick={() => setLocalFilter("")}
                  className="mt-2 text-blue-600 hover:underline"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>
        )}

        {/* Pagination controls - only show when no local filter is applied */}
        {!isLoading && totalResults > resultsPerPage && !localFilter && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={handlePrevPage}
              disabled={page === 1 || isRateLimited}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                page === 1 || isRateLimited
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {Math.ceil(totalResults / resultsPerPage)}
            </span>
            <button
              onClick={handleNextPage}
              disabled={page * resultsPerPage >= totalResults || isRateLimited}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                page * resultsPerPage >= totalResults || isRateLimited
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Add to Collection Modal */}
      {showAddToCollectionModal && isSignedIn && systemUser && (
        <AddToCollectionModal
          selectedPublications={selectedPublications}
          onClose={() => setShowAddToCollectionModal(false)}
          onSuccess={handleAddToCollectionSuccess}
        />
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportPubMedModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          selectedPublications={selectedPublications}
        />
      )}

      <ResourceTenantPickerModal
        isOpen={showResourceTenantPicker}
        tenants={selectedTenants}
        isSubmitting={isCreatingResources}
        onClose={() => {
          if (!isCreatingResources) {
            setShowResourceTenantPicker(false);
          }
        }}
        onSelectTenant={createResourcesInTenant}
      />

      {/* First Visit Modal */}
      {showFirstVisitModal && (
        <PubMedFirstVisitModal
          isOpen={showFirstVisitModal}
          onClose={() => setShowFirstVisitModal(false)}
        />
      )}

      {/* PubMed Chat */}
      {/* <PubMedChat
        selectedPublications={selectedPublications}
        onClearSelection={() => setSelectedPublications([])}
        onRemovePublication={handleRemovePublication}
        allResources={allResourcesData}
        allCollections={allCollectionsData}
        allEvents={allEventsData}
        allOrganizations={allOrganizationsData}
        allVideos={allVideos}
        pinnedItems={pinnedItems}
      /> */}
    </div>
  );
};

// Page component with Suspense boundary
const PubMedSearchPage = () => {
  return (
    <Suspense fallback={<div className="p-4">Loading search page...</div>}>
      <PubMedSearch />
    </Suspense>
  );
};

export default PubMedSearchPage;
