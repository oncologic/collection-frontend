"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
import { DateTime } from "luxon";
import Modal from "../components/Modal";
import AddResourceForm from "../components/forms/AddResource";
import SuggestResourceForm from "../components/forms/SuggestResourceForm";
import ResourceBulkImport from "../components/ResourceBulkImport";
import ResourceDuplicateCleanupModal from "../components/ResourceDuplicateCleanupModal";
import {
  useCreateResource,
  useDeleteResource,
  useGetPendingResourcesCount,
} from "../hooks/useResources";
import { useGetPublicResources } from "../hooks/usePublicResources";
import { suggestResource, reviewPendingResource } from "../api/resourcesApi";
import {
  usePublicResourceTypes,
  usePublicSensitivityLevels,
  usePublicExpertiseLevels,
  usePublicTags,
  usePublicOrganizations,
} from "../hooks/usePublicMetadata";
import toast from "react-hot-toast";
import ResourceCard from "../components/cards/ResourceCard";
import CollectionViewModal from "../components/CollectionViewModal";
import { usePublicAuth } from "../hooks/usePublicAuth";
import { useContextAuth } from "../context/authContext";
import CollectionCard from "../components/cards/CollectionCard";
import SelectField from "../components/inputs/SelectField";
import MultiSelect from "../components/inputs/MultiSelect";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FaMagic, FaUpload, FaCheck, FaTimes, FaSearch } from "react-icons/fa";
import ResourceAICreate from "../components/ResourceAICreate";
import { useAuth } from "@clerk/nextjs";

import ResourceDetailCard from "@/components/cards/ResourceDetailCard";

import HighlightedResourceCard from "@/components/cards/HighlightedResourceCard";
import ChatHistory from "../components/ChatHistory";
import SummaryModal from "../components/SummaryModal";
import FeaturedResourceManager from "@/components/admin/FeaturedResourceManager";
import PendingResourcesManager from "@/components/admin/PendingResourcesManager";
import ResourcesChat from "./ResourcesChat";
import { useGetResourceCollections } from "../hooks/useCollections";

// Toast component for resource creation success with navigation
const ResourceCreatedToast = ({
  toast: toastInstance,
  createdResource,
  router,
}) => {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <div
      className={`${
        toastInstance.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex items-center`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {isNavigating ? (
              <svg
                className="animate-spin h-5 w-5 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <FaCheck className="h-5 w-5 text-green-500" />
            )}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {isNavigating
                ? "Navigating to resource..."
                : "Resource created successfully"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {isNavigating ? (
                "Please wait while we load the resource page"
              ) : (
                <>
                  View the resource:{" "}
                  <span className="font-semibold">
                    {createdResource.name || "New Resource"}
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(toastInstance.id)}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Dismiss"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => {
            setIsNavigating(true);
            router.push(`/resources/${createdResource.id}`);
            // Keep toast visible for a bit longer to show loading state
            setTimeout(() => {
              toast.dismiss(toastInstance.id);
            }, 2000);
          }}
          disabled={isNavigating}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-wait"
        >
          {isNavigating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading...
            </>
          ) : (
            "Go to Resource"
          )}
        </button>
      </div>
    </div>
  );
};

// Toast component for pending resource approval success with navigation
const PendingResourceApprovedToast = ({
  toast: toastInstance,
  createdResource,
  router,
}) => {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <div
      className={`${
        toastInstance.visible ? "animate-enter" : "animate-leave"
      } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex items-center`}
    >
      <div className="flex-1 w-0 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {isNavigating ? (
              <svg
                className="animate-spin h-5 w-5 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <FaCheck className="h-5 w-5 text-green-500" />
            )}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {isNavigating
                ? "Navigating to resource..."
                : "Pending resource approved and created successfully"}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {isNavigating ? (
                "Please wait while we load the resource page"
              ) : (
                <>
                  View the resource:{" "}
                  <span className="font-semibold">
                    {createdResource.name || "New Resource"}
                  </span>
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(toastInstance.id)}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Dismiss"
          >
            <FaTimes className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="flex border-l border-gray-200">
        <button
          onClick={() => {
            setIsNavigating(true);
            router.push(`/resources/${createdResource.id}`);
            // Keep toast visible for a bit longer to show loading state
            setTimeout(() => {
              toast.dismiss(toastInstance.id);
            }, 2000);
          }}
          disabled={isNavigating}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-wait"
        >
          {isNavigating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading...
            </>
          ) : (
            "Go to Resource"
          )}
        </button>
      </div>
    </div>
  );
};

const Education = () => {
  const {
    isAdmin,
    isAdvocate,
    advocateTenants,
    adminTenants,
    userDetails,
    selectedTenants,
    isSignedIn,
    isPublicAccess,
  } = usePublicAuth();
  const { getToken } = useAuth();
  // Get auth header function - needed for approving pending resources
  // Users approving resources must be authenticated, so context should be available
  const authContext = useContextAuth();
  const getAuthHeader = authContext?.getAuthHeader;

  const { data: resources = [], isLoading: eventsLoading } =
    useGetPublicResources();
  const { data: organizations = [], isLoading: orgsLoading } =
    usePublicOrganizations();
  const router = useRouter();
  const canManageSelectedResources = useMemo(() => {
    if (isAdmin || (isAdvocate && isAdvocate.length > 0)) {
      return true;
    }

    if (!adminTenants?.length || !selectedTenants?.length) {
      return false;
    }

    const selectedTenantIds = new Set(
      selectedTenants.map((tenant) => tenant.id),
    );
    return adminTenants.some((tenant) =>
      selectedTenantIds.has(tenant.tenantId),
    );
  }, [adminTenants, isAdmin, isAdvocate, selectedTenants]);

  // State for filter mode toggle
  const [filterMode, setFilterMode] = useState("type"); // 'type' or 'tag'

  // Ref for the new ResourcesChat component
  const resourcesChatRef = useRef(null);

  // State for filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStage, setSelectedStage] = useState({
    id: "all",
    name: "All Stages",
  });
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedSensitivities, setSelectedSensitivities] = useState(
    new Set(["all"]),
  );
  const [selectedTags, setSelectedTags] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isDuplicateCleanupOpen, setIsDuplicateCleanupOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAIBulkMode, setIsAIBulkMode] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);

  const { mutate: createResource } = useCreateResource();

  // Add form control
  const { control } = useForm();

  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  // --- New state to hold copied resource data (if any) ---
  const [initialCopiedResource, setInitialCopiedResource] = useState({});
  useEffect(() => {
    const copied = localStorage.getItem("copiedResource");
    if (copied) {
      setInitialCopiedResource(JSON.parse(copied));
    }
  }, []);

  // Add new state for featured section visibility
  const [showFeatured, setShowFeatured] = useState(true);

  // Add effect to hide featured section when searching
  useEffect(() => {
    if (searchTerm) {
      setShowFeatured(false);
    }
  }, [searchTerm]);

  // Updated state for new chat component
  const [selectedResources, setSelectedResources] = useState([]);

  // Update the initial state to be an empty array instead of null
  const [aiFilteredResources, setAiFilteredResources] = useState([]);
  const [aiSummary, setAiSummary] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatData, setChatData] = useState(null);

  // Change this state to use an object instead of a Map
  const [chatFilters, setChatFilters] = useState({});

  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);

  // Add this state for the featured resources modal
  const [isFeaturedManagerOpen, setIsFeaturedManagerOpen] = useState(false);
  const [isPendingResourcesOpen, setIsPendingResourcesOpen] = useState(false);
  const [pendingResourceToApprove, setPendingResourceToApprove] =
    useState(null);

  const handleChatComplete = (chatEntry) => {
    const chatId = Date.now();

    setChatHistory((prev) => [
      ...prev,
      {
        id: chatId,
        prompt: chatEntry.content.prompt,
        answer: chatEntry.content.answer,
        timestamp: chatEntry.timestamp,
        userInfo: chatEntry.userInfo,
      },
    ]);

    setChatData(chatEntry.content.data);

    if (
      chatEntry.content.data &&
      Array.isArray(chatEntry.content.data.resources)
    ) {
      // Extract just the IDs from the data array
      const resourceIds = chatEntry.content.data.resources.map(
        (item) => item.id,
      );
      // Filter resources based on the extracted IDs
      const resources = filteredResources.filter((resource) =>
        resourceIds.includes(resource.id),
      );
      setAiFilteredResources(resources);
    }
  };

  // Update clear chat history to also clear filters
  const clearChatHistory = () => {
    setChatHistory([]);
    setChatFilters({}); // Clear filters object
    setAiFilteredResources([]);
  };

  // Handler for clearing selected resources
  const handleClearResourceSelection = () => {
    setSelectedResources([]);
  };

  // Handler for removing a specific resource
  const handleRemoveResource = (resourceId) => {
    setSelectedResources((prev) => prev.filter((r) => r.id !== resourceId));
  };

  const filteredResources = useMemo(() => {
    // If AI has provided filtered resources, use those instead
    if (aiFilteredResources && aiFilteredResources.length > 0) {
      return aiFilteredResources;
    }

    // Otherwise use the regular filter logic
    if (!resources || resources.length === 0) return [];

    return resources
      .sort((a, b) => new Date(b.resourceDate) - new Date(a.resourceDate))
      .filter((event) => {
        // Filter by searchTerm (title, description, tags)
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          const inTitle = event.name?.toLowerCase()?.includes(search) ?? false;
          const inDescription =
            event.description?.toLowerCase()?.includes(search) ?? false;
          const inTags =
            event.tags?.some((tag) =>
              tag?.name?.toLowerCase()?.includes(search),
            ) ?? false;
          if (!inTitle && !inDescription && !inTags) return false;
        }

        // Filter by stage if a specific stage is selected (not "All")
        if (selectedStage.name !== "All Stages") {
          const stageTagExists =
            event.tags?.some(
              (tag) =>
                tag?.name?.toLowerCase() === selectedStage.name?.toLowerCase(),
            ) ?? false;
          if (!stageTagExists) return false;
        }

        // Resource type filtering using the multi-select
        if (selectedTypes.length > 0) {
          if (!selectedTypes.some((type) => type.id === event.resourceType?.id))
            return false;
        }

        // Simple sensitivity level filtering
        if (
          !selectedSensitivities.has("all") &&
          selectedSensitivities.size > 0
        ) {
          // If we have specific sensitivities selected, only show resources that match those levels
          if (
            event.sensitivityLevel == null ||
            !selectedSensitivities.has(event.sensitivityLevel)
          ) {
            return false;
          }
        }

        // Tag filtering - check if resource has any of the selected tags
        if (selectedTags.length > 0) {
          if (!event.tags || event.tags.length === 0) return false;

          if (
            !selectedTags.some((selectedTag) =>
              event.tags.some((tag) => tag.id === selectedTag.id),
            )
          )
            return false;
        }

        return true;
      })
      .map((event) => ({
        ...event,
        resourceTypeName: event.resourceType?.name || "Unknown Type",
        showFullDescription: false,
      }));
  }, [
    resources,
    searchTerm,
    selectedStage,
    selectedTypes,
    selectedSensitivities,
    selectedTags,
    aiFilteredResources,
  ]);

  const { data: resourceTypes = [] } = usePublicResourceTypes();
  const { data: sensitivityLevels = [] } = usePublicSensitivityLevels();
  const { data: expertiseLevels = [] } = usePublicExpertiseLevels();
  const { data: tags = [] } = usePublicTags();

  const { data: collections = [] } = useGetResourceCollections();

  const { mutate: deleteResource } = useDeleteResource();

  // Get pending resources count for admins/advocates
  const { count: pendingCount } = useGetPendingResourcesCount();

  // Column definitions
  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      ),
      size: 40,
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Type",
      accessorKey: "resourceType.name",
    },
    {
      header: "Description",
      accessorKey: "description",
    },
    {
      header: "Sensitivity",
      accessorKey: "sensitivityLevel.name",
    },
    {
      header: "Expertise",
      accessorKey: "expertiseLevel.name",
    },
  ];

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="w-full min-h-screen pb-20 p-4">
      {/* Filter & Search Skeleton */}
      <div className="w-full mx-auto p-4 sm:p-6 bg-white shadow-md rounded-b-lg animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
        <div className="space-y-4">
          <div className="h-10 w-full bg-gray-200 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="mt-6">
        {/* Most Recent Section */}
        <div className="p-4">
          <div className="h-8 w-40 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4">
                <div className="h-40 bg-gray-200 rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Sections */}
        {/* {["Webinars", "Podcasts", "Blogs", "Tools"].map((category) => (
          <div key={category} className="p-6">
            <div className="h-8 w-40 bg-gray-200 rounded mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-4">
                  <div className="h-40 bg-gray-200 rounded mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))} */}
      </div>
    </div>
  );

  // Helper function to get total count of resources for a type (unfiltered)
  const getTotalCategoryResourceCount = (resourceTypeId) => {
    return (
      resources?.filter(
        (resource) => resource.resourceType?.id === resourceTypeId,
      ).length || 0
    );
  };

  // Helper function to get filtered count when types are selected
  const getCategoryResourceCount = (resourceTypeId, filteredResources) => {
    return (
      filteredResources?.filter(
        (resource) => resource.resourceType?.id === resourceTypeId,
      ).length || 0
    );
  };

  // Sort resourceTypes based on whether they have filtered resources
  const sortedResourceTypes = useMemo(() => {
    return resourceTypes.sort((a, b) => {
      const aCount = getCategoryResourceCount(a.id, filteredResources);
      const bCount = getCategoryResourceCount(b.id, filteredResources);
      return bCount - aCount; // Categories with filtered resources come first
    });
  }, [resourceTypes, filteredResources]);

  // For MultiSelect we simply use the resourceTypes as options.
  const typeOptions = useMemo(() => {
    return resourceTypes;
  }, [resourceTypes]);

  // Add this handler for clearing all type filters
  const handleClearTypeFilters = () => {
    setSelectedTypes([]);
  };

  // Update the featuredResources memo to filter by feature flag and sort by listOrder
  const featuredResources = useMemo(() => {
    if (!resources || resources.length === 0) return [];

    // Filter resources that have feature === true and sort by listOrder
    return resources
      .filter((resource) => resource.featured === true)
      .sort((a, b) => {
        // Sort by listOrder if available, otherwise keep original order
        if (a.listOrder !== undefined && b.listOrder !== undefined) {
          return a.listOrder - b.listOrder;
        }
        // Fallback to date sorting if listOrder is not available
        return new Date(b.resourceDate) - new Date(a.resourceDate);
      })
      .slice(0, 3); // Still limit to 3 items
  }, [resources]);

  // Add this state to track expanded resources
  const [expandedResources, setExpandedResources] = useState(new Set());

  // Add handler to clear AI filters
  const clearAiFilters = () => {
    setAiFilteredResources([]);
  };

  // Add this handler for type filtering
  const handleTypeFilter = (typeId) => {
    // If the type is already selected, clear it by setting to empty array
    // Otherwise, set it as the only selected type
    setSelectedTypes(
      selectedTypes.some((type) => type.id === typeId)
        ? selectedTypes.filter((type) => type.id !== typeId)
        : [...selectedTypes, resourceTypes.find((type) => type.id === typeId)],
    );
  };

  // Add this handler near other handlers
  const handleClearAllFilters = () => {
    setSearchTerm("");
    setSelectedTypes([]);
    setSelectedSensitivities(new Set(["all"]));
    setSelectedTags([]);
    setAiFilteredResources([]);
  };

  // Helper function to get tag counts
  const getTagCounts = useMemo(() => {
    const counts = new Map();

    // Count tags for all resources (not filtered)
    resources.forEach((resource) => {
      if (resource.tags && Array.isArray(resource.tags)) {
        resource.tags.forEach((tag) => {
          if (tag && tag.id) {
            counts.set(tag.id, (counts.get(tag.id) || 0) + 1);
          }
        });
      }
    });

    return counts;
  }, [resources]);

  // Helper function to get filtered tag counts (for selected tags display)
  const getFilteredTagCounts = useMemo(() => {
    const counts = new Map();

    // Count tags for filtered resources
    filteredResources.forEach((resource) => {
      if (resource.tags && Array.isArray(resource.tags)) {
        resource.tags.forEach((tag) => {
          if (tag && tag.id) {
            counts.set(tag.id, (counts.get(tag.id) || 0) + 1);
          }
        });
      }
    });

    return counts;
  }, [filteredResources]);

  // Check if we should auto-switch to tag mode
  const shouldUseTagMode = useMemo(() => {
    const uniqueTypes = new Set(
      resources.map((r) => r.resourceType?.id).filter(Boolean),
    );
    return uniqueTypes.size <= 1;
  }, [resources]);

  // Map pending resource data to AddResource initialValues format
  const mapPendingResourceToInitialValues = (pendingResource) => {
    if (!pendingResource) return {};

    return {
      name: pendingResource.name || "",
      url: pendingResource.url || "",
      description: pendingResource.description || "",
      resourceDate:
        pendingResource.resourceDate || new Date().toISOString().split("T")[0],
      resourceUpdatedDate:
        pendingResource.resourceUpdatedDate ||
        new Date().toISOString().split("T")[0],
      typeId: pendingResource.resourceType || null,
      sensitivityLevelId: pendingResource.sensitivityLevel || null,
      expertiseLevelId: pendingResource.expertiseLevel || null,
      targetAudienceId: pendingResource.targetAudienceId || 1,
      videoUrl: pendingResource.videoUrl || "",
      timestamps: pendingResource.timestamps || "",
      fullText: pendingResource.fullText || "",
      tags: pendingResource.tags || [],
      organizations: pendingResource.organizations || [],
      tenantId: pendingResource.tenantId || "",
      // Store the pending resource ID so we can mark it as approved after creation
      _pendingResourceId: pendingResource.id,
    };
  };

  // Handler for when approve is clicked on a pending resource
  const handleApprovePendingResource = (pendingResource) => {
    setPendingResourceToApprove(pendingResource);
    setInitialCopiedResource({}); // Clear any copied resource
    setIsPendingResourcesOpen(false); // Close pending resources modal
    setIsModalOpen(true); // Open AddResource modal
  };

  const handleAddResource = (resource) => {
    // The form already sends the data in the correct format
    // Just pass it through directly to createResource
    const pendingResourceId = pendingResourceToApprove?.id;

    createResource(resource, {
      onSuccess: async (createdResource) => {
        // If this was created from a pending resource, mark it as approved
        if (pendingResourceId) {
          if (!getAuthHeader) {
            // Can't approve without auth header - show error and don't close modal
            toast.error(
              "Resource created but cannot approve pending resource. Please approve manually from the review section.",
            );
            return;
          }

          try {
            // Use getAuthHeader to include X-Tenant-Ids header
            const headers = await getAuthHeader();
            await reviewPendingResource(pendingResourceId, "approved", headers);
            // Only show success and close modal if approval succeeds
            setIsModalOpen(false);
            setPendingResourceToApprove(null);
            setInitialCopiedResource({});

            // Show toast with navigation option
            if (createdResource?.id) {
              toast.custom(
                (t) => (
                  <PendingResourceApprovedToast
                    toast={t}
                    createdResource={createdResource}
                    router={router}
                  />
                ),
                { duration: 10000 }, // Longer duration to show loading state
              );
            } else {
              toast.success(
                "Pending resource approved and created successfully",
              );
            }
          } catch (error) {
            console.error("Failed to approve pending resource:", error);
            // Don't close modal or clear state if approval fails
            const errorMessage =
              error.message ||
              "Resource created but failed to approve pending resource";
            toast.error(errorMessage);
            toast.error(
              "Please manually approve the pending resource from the review section",
            );
          }
        } else {
          // Not a pending resource, close modal and show toast with navigation
          setIsModalOpen(false);
          setPendingResourceToApprove(null);
          setInitialCopiedResource({});

          // Show toast with navigation option
          if (createdResource?.id) {
            toast.custom(
              (t) => (
                <ResourceCreatedToast
                  toast={t}
                  createdResource={createdResource}
                  router={router}
                />
              ),
              { duration: 10000 }, // Longer duration to show loading state
            );
          } else {
            toast.success("Resource created successfully");
          }
        }
      },
      onError: (error) => {
        toast.error(
          error.message || "Failed to add resource. Please try again.",
        );
      },
    });
  };

  // Show loading skeleton while data is being fetched
  if (eventsLoading || orgsLoading) {
    return <LoadingSkeleton />;
  }

  // SensitivityCheckboxGroup component remains unchanged
  const SensitivityCheckboxGroup = ({
    sensitivityLevels,
    selectedSensitivities,
    setSelectedSensitivities,
  }) => {
    const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

    // Sort sensitivity levels in desired order
    const orderedLevels = [...sensitivityLevels].sort((a, b) => {
      const order = { low: 1, medium: 2, high: 3 };
      return order[a.name.toLowerCase()] - order[b.name.toLowerCase()];
    });

    // Updated descriptions to reflect patient experiences
    const sensitivityDescriptions = {
      low: "Content that most patients found comfortable to read. Includes general wellness information, supportive resources, and basic educational materials that patients reported as helpful for getting started.",
      medium:
        "Content that some patients found moderately challenging or distressing. May include clinical terms, treatment information and outcome discussions. Patients suggested taking breaks while reading this type of content.",
      high: "Content that many patients found emotionally intense. Includes detailed medical information and in-depth discussions. Patients found this content distressing and recommended reviewing it when feeling emotionally prepared and with support if needed.",
    };

    const handleSensitivityChange = (levelId) => {
      setSelectedSensitivities((prev) => {
        const newSet = new Set(prev);
        if (levelId === "all") {
          if (newSet.has("all")) {
            newSet.clear();
          } else {
            newSet.clear();
            newSet.add("all");
          }
        } else {
          newSet.delete("all");
          if (newSet.has(levelId)) {
            newSet.delete(levelId);
            if (newSet.size === 0) newSet.add("all");
          } else {
            newSet.add(levelId);
          }
        }
        return newSet;
      });
    };

    return (
      <div className="flex flex-col">
        <div className="flex items-center gap-2 mb-2 mt-2">
          <label className="block text-sm font-medium text-gray-600">
            Content Distress Level
          </label>
          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="group relative"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>
        </div>

        {/* Info Modal */}
        {isInfoModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6">
              <div className="flex justify-between items-start mb-4">
                <h4 className="font-semibold text-lg text-gray-800">
                  Content Distress Levels
                </h4>
                <button
                  onClick={() => setIsInfoModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 mb-4">
                Content distress levels help you choose content that feels right
                for you:
              </p>

              <ul className="space-y-4 mb-6">
                <li className="flex items-start space-x-3">
                  <span className="font-semibold text-green-600 text-sm min-w-[70px] mt-0.5">
                    Low:
                  </span>
                  <span className="text-sm text-gray-700">
                    {sensitivityDescriptions.low}
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="font-semibold text-yellow-600 text-sm min-w-[70px] mt-0.5">
                    Medium:
                  </span>
                  <span className="text-sm text-gray-700">
                    {sensitivityDescriptions.medium}
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <span className="font-semibold text-red-600 text-sm min-w-[70px] mt-0.5">
                    Intense:
                  </span>
                  <span className="text-sm text-gray-700">
                    {sensitivityDescriptions.high}
                  </span>
                </li>
              </ul>

              <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg">
                💡 Remember: You can always take breaks, come back later, or
                discuss content with your healthcare team.
              </p>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setIsInfoModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSensitivityChange("all")}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 
              ${
                selectedSensitivities.has("all")
                  ? "bg-gray-800 text-white shadow-md"
                  : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
              }`}
          >
            All Levels
          </button>
          {orderedLevels.map((level) => (
            <button
              key={level.id}
              onClick={() => handleSensitivityChange(level.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${
                  selectedSensitivities.has(level.id)
                    ? level.name.toLowerCase() === "low"
                      ? "bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]"
                      : level.name.toLowerCase() === "medium"
                        ? "bg-[#fff3e0] text-[#f57c00] border border-[#ffe0b2]"
                        : "bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
            >
              {level.name}
              {selectedSensitivities.has(level.id) && (
                <svg
                  className="w-3 h-3"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Handler to be passed to ResourceCard
  const handleCopyResource = (copiedData) => {
    setInitialCopiedResource(copiedData);
    setIsModalOpen(true);
  };

  // Update the search placeholder to remove collections reference
  const searchPlaceholder = "Search resources...";

  // Add this near other handlers
  const handleShowSummary = () => {
    if (aiSummary) {
      setIsSummaryModalOpen(true);
    }
  };

  const handleDeleteResource = (resourceId) => {
    deleteResource(resourceId);
  };

  // Add a helper function to count resources by tag
  const getTagResourceCount = (tagId, filteredResources) => {
    return (
      filteredResources?.filter((resource) =>
        resource.tags?.some((tag) => tag.id === tagId),
      ).length || 0
    );
  };

  // Add handler for clearing tag filters
  const handleClearTagFilters = () => {
    setSelectedTags([]);
  };

  return (
    <div
      className={`w-full min-h-screen pb-20 relative ${
        !isSignedIn || isPublicAccess ? "mt-20 pt-4" : ""
      }`}
    >
      {/* Replace old chat history section with new component */}
      {/* {chatHistory && (
        <ChatHistory
          history={chatHistory}
          onClear={clearChatHistory}
          data={chatData}
        />
      )} */}

      {/* New ResourcesChat component with ref support */}
      {/* <ResourcesChat
        ref={resourcesChatRef}
        selectedResources={selectedResources}
        userDetails={userDetails}
        allResources={filteredResources}
        onChatComplete={handleChatComplete}
        onClearSelection={handleClearResourceSelection}
        onRemoveResource={handleRemoveResource}
      /> */}

      {/* Floating Chat Button for admins and advocates */}
      {/* {(isAdmin || isAdvocate) && (
        <button
          onClick={() => resourcesChatRef.current?.open()}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 z-30"
          title="Open AI Chat"
        >
          <FaMagic />
        </button>
      )} */}

      {/* Loading indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <span className="text-gray-700">Processing your request...</span>
          </div>
        </div>
      )}

      {/* Top Navigation - Mobile Friendly */}
      <div
        className={`border-b border-gray-200 ${
          !isSignedIn ? "bg-slate-50" : "bg-white"
        } lg:pr-72 ${isSignedIn ? "-mt-6 sm:-mt-4" : ""}`}
      >
        <div className="px-4 py-2 sm:py-3">
          {/* Updated flex container with wrap */}
          <div className="flex flex-wrap gap-3 w-full items-center">
            {/* Search input - full width on mobile, flex-grow on desktop */}
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${
                !isSignedIn ? "flex-1" : "w-full sm:w-auto sm:flex-1"
              } border border-gray-300 rounded-lg px-4 py-2`}
              placeholder={searchPlaceholder}
            />

            {/* Action buttons container */}
            <div className="flex gap-2 w-full sm:w-auto">
              {(searchTerm ||
                selectedTypes.length > 0 ||
                !selectedSensitivities.has("all") ||
                aiFilteredResources?.length > 0) && (
                <button
                  onClick={handleClearAllFilters}
                  className="flex-1 sm:flex-initial whitespace-nowrap px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Clear Filters
                </button>
              )}
              {/* Suggest Resource button - only for users without selected-tenant manage access */}
              {!canManageSelectedResources && (
                <button
                  onClick={() => setIsSuggestModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Suggest Resource</span>
                </button>
              )}
              {canManageSelectedResources && (
                <div className="relative group">
                  <button
                    onClick={() => {
                      setIsModalOpen(true);
                      setInitialCopiedResource({});
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                  >
                    <span>Add Resource</span>
                    <FontAwesomeIcon
                      icon={faChevronDown}
                      className="h-3 w-3 ml-1"
                    />
                  </button>
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        setIsModalOpen(true);
                        setInitialCopiedResource({});
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-t-lg border-b border-gray-100 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="text-left">
                        <div className="font-medium">Create Resource</div>
                        <div className="text-xs text-gray-500">
                          Add a single resource manually
                        </div>
                      </div>
                    </button>
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => setIsBulkImportOpen(true)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                        >
                          <FaUpload className="h-5 w-5 text-green-600" />
                          <div className="text-left">
                            <div className="font-medium">Bulk Import</div>
                            <div className="text-xs text-gray-500">
                              Import multiple resources from CSV
                            </div>
                          </div>
                        </button>
                        <button
                          onClick={() => setIsDuplicateCleanupOpen(true)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                        >
                          <FaSearch className="h-5 w-5 text-amber-600" />
                          <div className="text-left">
                            <div className="font-medium">Check Duplicates</div>
                            <div className="text-xs text-gray-500">
                              Review and remove duplicate resource titles
                            </div>
                          </div>
                        </button>
                      </>
                    )}
                    <div className="p-1">
                      <div className="px-3 py-1 text-xs text-gray-500 font-medium">
                        AI Options
                      </div>
                      <button
                        onClick={() => {
                          setIsAIBulkMode(false);
                          setIsAIModalOpen(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <FaMagic className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium">AI Single Resource</div>
                          <div className="text-xs text-gray-500">
                            Create one resource with AI
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setIsAIBulkMode(true);
                          setIsAIModalOpen(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors"
                      >
                        <FaMagic className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium">AI Bulk Resources</div>
                          <div className="text-xs text-gray-500">
                            Create multiple resources with AI
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Filtered Results Indicator - Below search bar */}
        {aiFilteredResources && aiFilteredResources.length > 0 && (
          <div className="flex items-center justify-between px-4 py-2 bg-blue-50 border-b border-indigo-400">
            <span className="text-indigo-600">
              Showing AI filtered results ({aiFilteredResources.length}{" "}
              {aiFilteredResources.length === 1 ? "item" : "items"})
            </span>
            <div className="flex gap-2">
              {aiSummary && (
                <button
                  onClick={handleShowSummary}
                  className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  View Summary
                </button>
              )}
              <button
                onClick={() => {
                  setAiFilteredResources([]);
                  setAiSummary("");
                }}
                className="text-indigo-600 hover:text-indigo-700"
              >
                Clear AI Filters
              </button>
            </div>
          </div>
        )}

        {/* Tag Filters Indicator */}
        {selectedTags.length > 0 && !aiFilteredResources.length && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-indigo-50">
            <span className="text-indigo-700 text-sm font-medium">
              Tag filters: ({filteredResources.length}{" "}
              {filteredResources.length === 1 ? "resource" : "resources"})
            </span>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tag) => {
                const count = getFilteredTagCounts.get(tag.id) || 0;
                return (
                  <span
                    key={tag.id}
                    className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800"
                  >
                    {tag.name} ({count})
                    <button
                      onClick={() =>
                        setSelectedTags(
                          selectedTags.filter((t) => t.id !== tag.id),
                        )
                      }
                      className="ml-1 text-indigo-600 hover:text-indigo-900"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </span>
                );
              })}
              <button
                onClick={handleClearTagFilters}
                className="text-xs text-indigo-700 hover:text-indigo-900 underline"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden border-t border-gray-200">
          <button
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className="w-full flex items-center justify-between px-4 py-3 text-gray-600"
          >
            <span className="font-medium">Filters</span>
            <FontAwesomeIcon
              icon={isFiltersVisible ? faChevronUp : faChevronDown}
            />
          </button>
        </div>

        {/* Mobile Filters - Positioned below toggle */}
        <div
          className={`${
            isFiltersVisible ? "block" : "hidden"
          } lg:hidden bg-white border-t border-gray-200`}
        >
          {/* Filter Content with scrolling */}
          <div className="max-h-[50vh] overflow-y-auto px-4 py-3">
            <div className="space-y-6">
              {/* Tags Filter - Mobile (moved above Types) */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Filter by Tags
                </h3>
                <div className="mt-2">
                  <MultiSelect
                    options={tags}
                    value={selectedTags}
                    onChange={setSelectedTags}
                    placeholder="Select tags..."
                    chipClassName="bg-indigo-100 text-indigo-800"
                  />
                  {selectedTags.length > 0 && (
                    <button
                      onClick={handleClearTagFilters}
                      className="text-xs text-gray-500 hover:text-blue-600 mt-1"
                    >
                      Clear tag filters
                    </button>
                  )}
                </div>
              </div>

              {/* Filter by Type */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Filter by Type
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={handleClearTypeFilters}
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 ${
                      selectedTypes.length === 0
                        ? "bg-blue-50 text-blue-600"
                        : ""
                    }`}
                  >
                    All Types
                    <span className="float-right text-gray-500 text-sm">
                      {resources.length}
                    </span>
                  </button>
                  {resourceTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeFilter(type.id)}
                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 ${
                        selectedTypes.some((t) => t.id === type.id)
                          ? "bg-blue-50 text-blue-600"
                          : ""
                      }`}
                    >
                      {type.name}
                      <span className="float-right text-gray-500 text-sm">
                        {getTotalCategoryResourceCount(type.id)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sensitivity Levels */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Content Level
                </h3>
                <SensitivityCheckboxGroup
                  sensitivityLevels={sensitivityLevels}
                  selectedSensitivities={selectedSensitivities}
                  setSelectedSensitivities={setSelectedSensitivities}
                />
              </div>
            </div>
          </div>

          {/* Apply Filters Button - Fixed at bottom with safe area */}
          <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => setIsFiltersVisible(false)}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row">
        {/* Content Area */}
        <div className="flex-1 p-6 md:p-4">
          <div className="max-w-4xl mx-auto">
            {/* Featured Section with toggle */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold bg-gradient-to-r mt-4 from-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Featured Resources
                </h2>
                <div className="flex items-center gap-2 ">
                  <div className="flex items-center gap-2">
                    {(isAdmin || (isAdvocate && isAdvocate.length > 0)) && (
                      <button
                        onClick={() => setIsPendingResourcesOpen(true)}
                        className="relative flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors text-sm px-2 py-1 rounded-md hover:bg-blue-50"
                        title="Review pending resource suggestions"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span className="hidden sm:inline">
                          Review Pending
                          {pendingCount > 0 ? ` (${pendingCount})` : ""}
                        </span>
                        {pendingCount > 0 && (
                          <span className="sm:hidden flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-sm">
                            {pendingCount}
                          </span>
                        )}
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setIsFeaturedManagerOpen(true)}
                        className="flex items-center gap-1 text-gray-600 hover:text-blue-600 transition-colors text-sm"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setShowFeatured(!showFeatured)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {showFeatured ? "Hide" : "Show"}
                    <FontAwesomeIcon
                      icon={showFeatured ? faChevronUp : faChevronDown}
                      className="w-4 h-4"
                    />
                  </button>
                </div>
              </div>
              <div
                className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-hidden transition-all duration-500 ease-in-out transform-gpu will-change-transform`}
                style={{
                  maxHeight: showFeatured ? "1000px" : "0",
                  opacity: showFeatured ? 1 : 0,
                  marginBottom: showFeatured ? "2rem" : "0",
                  transform: showFeatured
                    ? "translate3d(0, 0, 0)"
                    : "translate3d(0, -10px, 0)",
                  backfaceVisibility: "hidden",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                {featuredResources.map((resource) => (
                  <HighlightedResourceCard
                    key={resource.id}
                    resource={resource}
                    isAdmin={isAdmin}
                    isSignedIn={isSignedIn}
                    collections={collections}
                    onCopyResource={handleCopyResource}
                  />
                ))}
              </div>
            </div>

            {/* Existing Feed Layout */}
            <div className="space-y-8">
              {filteredResources.map((resource) => (
                <ResourceDetailCard
                  key={resource.id}
                  resource={resource}
                  collections={collections}
                  isAdmin={isAdmin}
                  isAdvocate={isAdvocate}
                  onCopyResource={handleCopyResource}
                  handleDeleteResource={handleDeleteResource}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Filters - Right side */}
        <div className="hidden lg:block w-64 flex-shrink-0 border-l border-gray-200 bg-white">
          <div className="max-h-[calc(100vh-5rem)] overflow-y-auto">
            <div className="p-4">
              {/* Same filter content as mobile */}
              <div className="space-y-6">
                {/* Filter Mode Toggle - Only show when there are multiple resource types */}
                {!shouldUseTagMode && (
                  <div className="flex rounded-lg bg-gray-100 p-1">
                    <button
                      onClick={() => setFilterMode("type")}
                      className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        filterMode === "type"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      By Type
                    </button>
                    <button
                      onClick={() => setFilterMode("tag")}
                      className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                        filterMode === "tag"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      By Tag
                    </button>
                  </div>
                )}

                {/* Conditional rendering based on filter mode */}
                {filterMode === "tag" || shouldUseTagMode ? (
                  // Tag-based filtering
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Filter by Tags
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      <button
                        onClick={handleClearTagFilters}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 ${
                          selectedTags.length === 0
                            ? "bg-blue-50 text-blue-600"
                            : ""
                        }`}
                      >
                        All Tags
                        <span className="float-right text-gray-500 text-sm">
                          {resources.length}
                        </span>
                      </button>
                      {tags
                        .filter((tag) => getTagCounts.get(tag.id) > 0)
                        .sort(
                          (a, b) =>
                            (getTagCounts.get(b.id) || 0) -
                            (getTagCounts.get(a.id) || 0),
                        )
                        .map((tag) => {
                          const count = getTagCounts.get(tag.id) || 0;
                          const isSelected = selectedTags.some(
                            (t) => t.id === tag.id,
                          );
                          return (
                            <button
                              key={tag.id}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedTags(
                                    selectedTags.filter((t) => t.id !== tag.id),
                                  );
                                } else {
                                  setSelectedTags([...selectedTags, tag]);
                                }
                              }}
                              className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 ${
                                isSelected ? "bg-blue-50 text-blue-600" : ""
                              }`}
                            >
                              {tag.name}
                              <span className="float-right text-gray-500 text-sm">
                                {count}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ) : (
                  // Type-based filtering (existing code)
                  <>
                    {/* Tags Filter - Desktop (moved above Types) */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Filter by Tags
                      </h3>
                      <div className="mt-2">
                        <MultiSelect
                          options={tags}
                          value={selectedTags}
                          onChange={setSelectedTags}
                          placeholder="Select tags..."
                          chipClassName="bg-indigo-100 text-indigo-800"
                        />
                        {selectedTags.length > 0 && (
                          <button
                            onClick={handleClearTagFilters}
                            className="text-xs text-gray-500 hover:text-blue-600 mt-1"
                          >
                            Clear tag filters
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filter by Type */}
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">
                        Filter by Type
                      </h3>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        <button
                          onClick={handleClearTypeFilters}
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 ${
                            selectedTypes.length === 0
                              ? "bg-blue-50 text-blue-600"
                              : ""
                          }`}
                        >
                          All Types
                          <span className="float-right text-gray-500 text-sm">
                            {resources.length}
                          </span>
                        </button>
                        {resourceTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => handleTypeFilter(type.id)}
                            className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 ${
                              selectedTypes.some((t) => t.id === type.id)
                                ? "bg-blue-50 text-blue-600"
                                : ""
                            }`}
                          >
                            {type.name}
                            <span className="float-right text-gray-500 text-sm">
                              {getTotalCategoryResourceCount(type.id)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Sensitivity Levels */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Content Level
                  </h3>
                  <SensitivityCheckboxGroup
                    sensitivityLevels={sensitivityLevels}
                    selectedSensitivities={selectedSensitivities}
                    setSelectedSensitivities={setSelectedSensitivities}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <Modal
          onClose={() => {
            setIsModalOpen(false);
            setPendingResourceToApprove(null);
            setInitialCopiedResource({});
          }}
          maxWidth="lg:w-1/2 w-full"
        >
          {/* Header indicating copy mode */}
          {Object.keys(initialCopiedResource).length > 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <p className="text-blue-800 text-lg font-semibold">
                Copy Mode: Creating a new resource from an existing one.
              </p>
            </div>
          )}
          {/* Header indicating pending resource approval mode */}
          {pendingResourceToApprove && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
              <p className="text-green-800 text-lg font-semibold">
                Approving Pending Resource: {pendingResourceToApprove.name}
              </p>
              <p className="text-green-700 text-sm mt-1">
                Fill in the additional details below to complete the resource
                creation.
              </p>
            </div>
          )}
          <AddResourceForm
            organizations={organizations}
            onSubmit={handleAddResource}
            onClose={() => {
              setIsModalOpen(false);
              setPendingResourceToApprove(null);
              setInitialCopiedResource({});
            }}
            resourceTypes={resourceTypes}
            sensitivityLevels={sensitivityLevels}
            expertiseLevels={expertiseLevels}
            targetAudiences={[]}
            tags={tags}
            initialValues={
              pendingResourceToApprove
                ? mapPendingResourceToInitialValues(pendingResourceToApprove)
                : initialCopiedResource
            }
            advocateTenants={advocateTenants}
            adminTenants={adminTenants}
            isAdmin={isAdmin}
          />
        </Modal>
      )}

      {/* Bulk Import Modal */}
      {isBulkImportOpen && (
        <ResourceBulkImport
          onClose={() => setIsBulkImportOpen(false)}
          resourceTypes={resourceTypes}
          organizations={organizations}
          sensitivityLevels={sensitivityLevels}
          expertiseLevels={expertiseLevels}
          targetAudiences={[]} // TODO: Add useTargetAudiences hook when available
          tags={tags}
          selectedTenants={selectedTenants}
          advocateTenants={advocateTenants}
          adminTenants={adminTenants}
          isAdmin={isAdmin}
        />
      )}

      {isDuplicateCleanupOpen && (
        <ResourceDuplicateCleanupModal
          onClose={() => setIsDuplicateCleanupOpen(false)}
          selectedTenants={selectedTenants}
        />
      )}

      <div id="resources-section">{/* Your resources section content */}</div>

      {/* Add the summary modal */}
      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summary={aiSummary}
      />

      {/* Add the featured resources manager modal */}
      {isFeaturedManagerOpen && (
        <Modal
          onClose={() => setIsFeaturedManagerOpen(false)}
          maxWidth="lg:w-3/4 w-full"
        >
          <FeaturedResourceManager
            onClose={() => setIsFeaturedManagerOpen(false)}
          />
        </Modal>
      )}

      {/* AI Resource Creation Modal */}
      {isAIModalOpen && (
        <ResourceAICreate
          onClose={() => setIsAIModalOpen(false)}
          onResourcesCreated={(createdResources) => {
            toast.success(
              `Created ${createdResources.length} resource${
                createdResources.length > 1 ? "s" : ""
              }`,
            );
            // Optionally navigate to the first created resource
            if (createdResources.length > 0) {
              router.push(`/resources/${createdResources[0].id}`);
            }
          }}
          resourceTypes={resourceTypes}
          organizations={organizations}
          tags={tags}
          sensitivityLevels={sensitivityLevels}
          expertiseLevels={expertiseLevels}
          isBulkMode={isAIBulkMode}
          selectedTenants={selectedTenants}
          existingResources={resources}
        />
      )}

      {/* Suggest Resource Modal */}
      {isSuggestModalOpen && (
        <Modal
          onClose={() => setIsSuggestModalOpen(false)}
          maxWidth="lg:w-1/2 w-full"
        >
          <SuggestResourceForm
            onClose={() => setIsSuggestModalOpen(false)}
            onSubmit={async (data) => {
              await suggestResource(data);
            }}
          />
        </Modal>
      )}

      {/* Pending Resources Manager Modal */}
      {isPendingResourcesOpen && (
        <Modal
          onClose={() => setIsPendingResourcesOpen(false)}
          maxWidth="lg:w-3/4 w-full"
        >
          <PendingResourcesManager
            onClose={() => setIsPendingResourcesOpen(false)}
            onApproveResource={handleApprovePendingResource}
          />
        </Modal>
      )}
    </div>
  );
};

export default Education;
