"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FaSearch,
  FaPlus,
  FaPlus as FaCollectionIcon,
  FaChevronRight,
  FaFolder,
  FaFilter,
  FaCalendar,
  FaDownload,
  FaCog,
  FaThLarge,
  FaList,
  FaUsers,
} from "react-icons/fa";
import Modal from "@/app/components/Modal";
import CollectionCard from "@/app/components/cards/CollectionCard";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import { useGetResources } from "@/app/hooks/useResources";
import { useContextAuth } from "@/app/context/authContext";
import { useAuth } from "@clerk/nextjs";
import CollectionViewModal from "@/app/components/CollectionViewModal";
import AddCollectionForm from "@/app/components/forms/AddCollectionForm";
import { useOrganizations } from "../hooks/useOrganizations";
import {
  useCreateCollection,
  useDeleteCollection,
  useGetCollectionExternalLink,
  useGetNotationThreads,
  useGetResourceCollections,
  useGetFolders,
  useCreateFolder,
  useUpdateFolder,
  useDeleteFolder,
  useAddCollectionToFolder,
  useRemoveCollectionFromFolder,
} from "../hooks/useCollections";
import ExternalCollectionCard from "@/app/components/cards/ExternalCollectionCard";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { format } from "date-fns";
import CustomEditor from "../components/common/CustomEditor";
import CombinedNewsFeed from "./CombinedNewsFeed";
import { useEvents } from "../hooks/useEvents";
import toast from "react-hot-toast";
import EventCollectionCard from "@/app/components/cards/EventCollectionCard";
import DownloadModal from "../components/modals/DownloadModal";
import AddFolderForm from "@/app/components/forms/AddFolderForm";
import FoldersList from "@/app/components/FoldersList";
import BlogGenerationModal from "../components/modals/BlogGenerationModal";
import {
  generatePDF,
  convertToCSV,
  convertToTSV,
  prepareDataForExport,
  downloadFile,
} from "@/app/utils/exportUtils";
import StatusFilterMenu from "@/app/components/StatusFilterMenu";
import CollectionListView from "../components/CollectionListView";
import FolderGrid from "../components/FolderGrid";
import CollectionFilters from "@/app/components/collections/CollectionFilters";

// Add this helper function near the top of the file
const getLocalStorage = () => {
  if (typeof window !== "undefined") {
    return window.localStorage;
  }
  return null;
};

export default function MyRecordsPage() {
  const router = useRouter();
  const { isAdmin, isAdvocate, systemUser, isLoaded } = useContextAuth();
  const { isSignedIn } = useAuth();

  // All hooks must be called before any conditional returns
  const { data: collections = [], isLoading: collectionsLoading } =
    useGetResourceCollections({});
  const { data: organizations = [] } = useOrganizations();
  const { data: resources = [] } = useGetResources();
  const { mutate: addCollectionMutation } = useCreateCollection();
  const { data: notations = [] } = useGetNotationThreads();
  const { data: collectionExternalLink } = useGetCollectionExternalLink();
  const { data: events = [] } = useEvents();
  const { mutate: deleteCollection } = useDeleteCollection();
  const { data: folders = [] } = useGetFolders();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [filteredCollections, setFilteredCollections] = useState([]);

  // Add new state for the download modal
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedItemsForDownload, setSelectedItemsForDownload] = useState({});
  const [downloadEventData, setDownloadEventData] = useState(null);

  const [folderFilteredCollections, setFolderFilteredCollections] = useState(
    []
  );
  const [pinnedItems, setPinnedItems] = useState([]);

  // Replace the selectedTab state with two states
  const [selectedTab, setSelectedTab] = useState("explore"); // Default server-side value
  const [hasMounted, setHasMounted] = useState(false);

  // Add new state for filters
  const [activeTypeFilter, setActiveTypeFilter] = useState("all"); // 'all', 'resource', 'external'
  const [visibilityFilter, setVisibilityFilter] = useState("all"); // 'all', 'public', 'private', 'unlisted'
  // Add these new state variables for filter menu
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Update status filter state to use STATUS_OPTIONS
  const STATUS_OPTIONS = [
    { id: "pending", label: "Pending" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
    { id: "waiting", label: "Waiting" },
    { id: "large reference", label: "Large Reference" },
    { id: "archived", label: "Archived" },
  ];
  const [statusFilter, setStatusFilter] = useState(() =>
    STATUS_OPTIONS.reduce((acc, status) => {
      // Set all to true by default, except archived which is false by default
      acc[status.id] = status.id !== "archived";
      return acc;
    }, {})
  );
  const filterMenuRef = useRef(null);

  // Add these near the top with other state declarations
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);

  // Update the viewMode state initialization
  const [viewMode, setViewMode] = useState(() => {
    const storage = getLocalStorage();
    if (storage) {
      return storage.getItem("collectionViewMode") || "list";
    }
    return "list";
  });

  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [selectedEventForBlog, setSelectedEventForBlog] = useState(null);
  const [blogFocus, setBlogFocus] = useState(null);

  // Add new state for folder management
  const [isAddingFolder, setIsAddingFolder] = useState(false);

  // Add state for delete confirmation modal
  const [deleteCollectionConfirmation, setDeleteCollectionConfirmation] =
    useState({ show: false, collectionId: null });

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  // Update the viewMode effect
  useEffect(() => {
    const storage = getLocalStorage();
    if (storage) {
      storage.setItem("collectionViewMode", viewMode);
    }
  }, [viewMode]);

  // Update the hasMounted useEffect
  useEffect(() => {
    setHasMounted(true);

    const storage = getLocalStorage();
    if (storage) {
      const storedTab = storage.getItem("selectedTab");
      if (storedTab) {
        setSelectedTab(storedTab);
      }
    }
  }, []);

  // Add this useEffect to handle clicking outside the filter menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target)
      ) {
        setShowFilterMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterMenuRef]);

  // Add this useEffect after your other useEffects
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(event.target)
      ) {
        setShowSettingsMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // Remove settingsMenuRef from dependencies array as it's a ref

  // Add filter toggle handler
  const handleFilterToggle = (filterType) => {
    setStatusFilter((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  // Update the getTabIndex function to properly handle the collaborators tab
  const getTabIndex = () => {
    if (!hasMounted) return 1; // Default to explore tab during server render
    switch (selectedTab) {
      case "collections":
        return 0;
      case "explore":
        return 1;
      case "events":
        return 2;
      case "collaborators":
        return 3;
      default:
        return 1; // Default to explore tab
    }
  };

  // Move filterCollections function to be more generic
  const applySearchFilter = useCallback(
    (collections, searchTerm) => {
      if (!searchTerm) return collections;

      const search = searchTerm.toLowerCase();
      return collections.filter((collection) => {
        const collectionMatch =
          collection.name?.toLowerCase()?.includes(search) ||
          collection.description?.toLowerCase()?.includes(search) ||
          collection.notes?.toLowerCase()?.includes(search);

        const externalLinksMatch = collection.externalLinks?.some(
          (link) =>
            link.name?.toLowerCase()?.includes(search) ||
            link.description?.toLowerCase()?.includes(search) ||
            link.notes?.toLowerCase()?.includes(search)
        );

        const notationsMatch = notations?.some(
          (notation) =>
            notation.collectionId === collection.id &&
            (notation.title?.toLowerCase()?.includes(search) ||
              notation.notes?.toLowerCase()?.includes(search))
        );

        return collectionMatch || externalLinksMatch || notationsMatch;
      });
    },
    [notations]
  );

  // Update the original filterCollections function to use the new applySearchFilter
  useEffect(() => {
    const filterCollections = (
      collections = [],
      externalLinks = [],
      searchTerm = "",
      notations = []
    ) => {
      if (!collections || !externalLinks) return [];

      const externalCollections = externalLinks.filter(
        (collection) => collection.type === "external"
      );

      const allCollections = [...collections, ...externalCollections];
      return applySearchFilter(allCollections, searchTerm);
    };

    const filtered = filterCollections(
      collections,
      collectionExternalLink,
      searchTerm,
      notations
    );
    if (JSON.stringify(filtered) !== JSON.stringify(filteredCollections)) {
      setFilteredCollections(filtered);
    }
  }, [
    collections,
    collectionExternalLink,
    searchTerm,
    notations,
    filteredCollections,
    applySearchFilter,
  ]);

  // Separate collections into types and pinned status
  const externalCollections = filteredCollections.filter(
    (collection) => collection.type === "external"
  );

  const handleViewCollection = (collection) => {
    router.push(`/collections/${collection.id}`);
  };

  const handleShareCollection = (collection) => {
    setSelectedCollection(collection);
    setIsShareModalOpen(true);
  };

  const handleDeleteCollection = (collectionId) => {
    setDeleteCollectionConfirmation({ show: true, collectionId });
  };

  const handleConfirmedDeleteCollection = () => {
    if (deleteCollectionConfirmation.collectionId) {
      deleteCollection(deleteCollectionConfirmation.collectionId);
    }
    setDeleteCollectionConfirmation({ show: false, collectionId: null });
  };

  // Update getCollectionsByEvent function for better hashtag support
  const getCollectionsByEvent = () => {
    const search = searchTerm.toLowerCase();

    // Get all collections with eventId, considering both regular collections and external collections
    const allCollectionsWithEventId = [
      ...collections.filter((collection) => {
        const hasEventId = !!collection.eventId;

        return hasEventId;
      }),
      ...(collectionExternalLink?.filter((col) => {
        const hasEventId = !!col.eventId;
        return hasEventId;
      }) || []),
    ];

    // Get unique event IDs
    const eventIds = [
      ...new Set(
        allCollectionsWithEventId.map((collection) => collection.eventId)
      ),
    ];

    // Create event objects with collections
    const eventsList = eventIds
      .map((eventId) => {
        // Get all collections for this event
        const eventCollections = allCollectionsWithEventId.filter(
          (collection) => collection.eventId === eventId
        );

        // Find the event from the events array
        const eventData = events.find((e) => e.id === eventId) || {};

        // Get the first collection to use as fallback for missing data
        const firstCollection = eventCollections[0];

        // Generate default hashtags if not provided
        let defaultHashtags = [];
        if (eventData.title || firstCollection.name) {
          const baseTitle = eventData.title || firstCollection.name || "Event";
          defaultHashtags = [
            `#${baseTitle.replace(/\s+/g, "")}`,
            "#Cancer",
            "#ChRCC",
            "#MedicalResearch",
          ];
        }

        const event = {
          id: eventId,
          title: eventData.title || firstCollection.name || "Unknown Event",
          startDate:
            eventData.startDate ||
            firstCollection.createdDate ||
            new Date().toISOString(),
          endDate: eventData.endDate || null,
          locationCity: eventData.locationCity || null,
          locationState: eventData.locationState || null,
          virtualEvent: eventData.virtualEvent || false,
          inPersonEvent: eventData.inPersonEvent || false,
          // Use eventHashtags from eventData or generate default ones
          hashtags:
            eventData.eventHashtags && eventData.eventHashtags.length
              ? eventData.eventHashtags
              : defaultHashtags,
          collections: eventCollections,
        };

        // If searching, only include events where either:
        // 1. The event title matches the search
        // 2. Any of its collections match the search
        if (searchTerm) {
          const titleMatches = event.title.toLowerCase().includes(search);
          const collectionsMatch = eventCollections.some(
            (collection) =>
              collection.name?.toLowerCase().includes(search) ||
              collection.description?.toLowerCase().includes(search)
          );

          if (!titleMatches && !collectionsMatch) {
            return null;
          }
        }

        // Filter by visibility if needed
        if (visibilityFilter !== "all") {
          if (visibilityFilter === "public") {
            const hasPublicCollections = eventCollections.some(
              (collection) => collection.visibility === "public"
            );
            if (!hasPublicCollections) {
              return null;
            }
          } else if (visibilityFilter === "private") {
            const hasPrivateCollections = eventCollections.some(
              (collection) => collection.visibility === "private"
            );
            if (!hasPrivateCollections) {
              return null;
            }
          } else if (visibilityFilter === "unlisted") {
            const hasUnlistedCollections = eventCollections.some(
              (collection) => collection.visibility === "unlisted"
            );
            if (!hasUnlistedCollections) {
              return null;
            }
          }
        }

        return event;
      })
      .filter(Boolean); // Remove null entries

    return eventsList;
  };

  const downloadEventDetails = (event, collections) => {
    setDownloadEventData({ event, collections });
    // Initialize selected items state with everything selected by default
    const initialSelectedItems = {
      collections: collections.reduce((acc, col) => {
        // Initialize collection selection
        acc[col.id] = {
          selected: true,
          externalLinks: (col.externalLinks || []).reduce((links, link) => {
            // Initialize external link selection and its nested notations
            links[link.id] = {
              selected: true,
              notations: (link.notations || []).reduce((notes, notation) => {
                notes[notation.id] = true;
                return notes;
              }, {}),
            };
            return links;
          }, {}),
        };
        return acc;
      }, {}),
    };

    setSelectedItemsForDownload(initialSelectedItems);
    setIsDownloadModalOpen(true);
  };

  const handleDownload = async (format = "json") => {
    try {
      const filteredCollections = downloadEventData.collections
        .filter((col) => selectedItemsForDownload.collections[col.id]?.selected)
        .map((col) => ({
          ...col,
          externalLinks: (col.externalLinks || []).filter(
            (link) =>
              selectedItemsForDownload.collections[col.id]?.externalLinks[
                link.id
              ]?.selected
          ),
        }));

      const exportData = {
        event: downloadEventData.event,
        collections: filteredCollections,
      };

      if (format === "pdf") {
        const doc = await generatePDF(exportData);
        doc.save(
          `${downloadEventData.event.title.replace(/\s+/g, "_")}_details.pdf`
        );
      } else {
        const fileName = `${downloadEventData.event.title.replace(
          /\s+/g,
          "_"
        )}_details.${format}`;
        const content =
          format === "csv"
            ? convertToCSV(exportData)
            : format === "tsv"
            ? convertToTSV(exportData)
            : JSON.stringify(exportData, null, 2);

        const mimeType =
          format === "csv"
            ? "text/csv"
            : format === "tsv"
            ? "text/tab-separated-values"
            : "application/json";

        downloadFile(content, fileName, mimeType);
      }

      setIsDownloadModalOpen(false);
      toast.success(
        `Event details downloaded successfully as ${format.toUpperCase()}`
      );
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  // Update the displayedCollections logic to include the type and visibility filters
  const displayedCollections = useMemo(() => {
    let collections;

    // First determine the base collection set
    if (folderFilteredCollections.length > 0) {
      collections = folderFilteredCollections;
    } else {
      collections = filteredCollections;
    }

    // Apply search filter
    collections = applySearchFilter(collections, searchTerm);

    // Apply type and visibility filters
    if (activeTypeFilter !== "all") {
      collections = collections.filter(
        (collection) => collection.type === activeTypeFilter
      );
    }

    // Apply visibility filter
    if (visibilityFilter !== "all") {
      collections = collections.filter((collection) => {
        if (visibilityFilter === "public") {
          return collection.visibility === "public";
        } else if (visibilityFilter === "private") {
          return collection.visibility === "private";
        } else if (visibilityFilter === "unlisted") {
          return collection.visibility === "unlisted";
        }
        return true;
      });
    }

    // Apply status filters - only show collections whose status is enabled in the filter
    const activeStatuses = Object.entries(statusFilter)
      .filter(([_, isEnabled]) => isEnabled)
      .map(([status]) => status);

    if (activeStatuses.length > 0) {
      collections = collections.filter((collection) => {
        // If collection has no status, treat it as "active" by default
        const collectionStatus = collection.status || "pending";
        return activeStatuses.includes(collectionStatus);
      });
    }

    // Sort by last updated date (most recent first)
    collections = collections.sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0);
      const dateB = new Date(b.updatedAt || b.createdAt || 0);
      return dateB - dateA;
    });

    return collections;
  }, [
    folderFilteredCollections,
    filteredCollections,
    searchTerm,
    activeTypeFilter,
    visibilityFilter,
    statusFilter,
    applySearchFilter,
  ]);

  // Add these hooks inside your component - moved before return
  const { mutate: createFolderMutation } = useCreateFolder();
  const { mutate: updateFolderMutation } = useUpdateFolder();
  const { mutate: deleteFolderMutation } = useDeleteFolder();
  const { mutate: addCollectionToFolderMutation } = useAddCollectionToFolder();
  const { mutate: removeCollectionFromFolderMutation } =
    useRemoveCollectionFromFolder();

  const [isFolderSidebarOpen, setIsFolderSidebarOpen] = useState(false);

  // Don't render content if not loaded or not signed in (but hooks are already called)
  if (!isLoaded || !isSignedIn) {
    return null;
  }

  // Helper function to get folder initial
  const getFolderInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "F";
  };

  // Add this helper function near your other functions
  const getUnassignedCollections = (collections, folders) => {
    return collections.filter(
      (collection) =>
        !folders.some((folder) =>
          folder.collections.some(
            (folderCollection) => folderCollection.id === collection.id
          )
        )
    );
  };

  // Add this helper function near your other functions
  const getStatusCount = (statusId) => {
    // Use all collections, not just the currently displayed ones
    return filteredCollections.filter(
      (collection) => collection.status === statusId
    ).length;
  };

  // Add this new component for the view toggle button
  const ViewModeToggle = ({ viewMode, setViewMode }) => (
    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => setViewMode("card")}
        className={`p-2 rounded ${
          viewMode === "card"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-800"
        }`}
        title="Card View"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      </button>
      <button
        onClick={() => setViewMode("list")}
        className={`p-2 rounded ${
          viewMode === "list"
            ? "bg-white text-blue-600 shadow-sm"
            : "text-gray-600 hover:text-gray-800"
        }`}
        title="List View"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 10h16M4 14h16M4 18h16"
          />
        </svg>
      </button>
    </div>
  );

  const renderSearchAndFilters = () => (
    <div className="flex flex-col gap-3 w-full">
      {/* Search and Add Collection - Stack on mobile, side by side on larger screens */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search collections..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 sm:flex-shrink-0">
          <button
            onClick={() => setIsAddingRecord(true)}
            className="flex-1 sm:flex-none px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40 whitespace-nowrap"
          >
            <FaPlus className="inline mr-2" /> Add Collection
          </button>

          {/* Mobile Settings Button */}
          <div className="sm:hidden relative" ref={settingsMenuRef}>
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="p-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100"
            >
              <FaCog className="w-5 h-5 text-gray-600" />
            </button>

            {/* Mobile Settings Dropdown */}
            {showSettingsMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-3">
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      View Mode
                    </label>
                    <ViewModeToggle
                      viewMode={viewMode}
                      setViewMode={setViewMode}
                    />
                  </div>

                  <div className="border-t border-gray-100 pt-3">
                    <button
                      onClick={() => {
                        setShowFilterMenu(!showFilterMenu);
                        setShowSettingsMenu(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400/80 transition-colors"
                    >
                      <span className="text-sm">Filter Options</span>
                      <FaFilter />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-2">
            <ViewModeToggle viewMode={viewMode} setViewMode={setViewMode} />

            <button
              onClick={() => setShowFilterMenu(!showFilterMenu)}
              className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400/80 transition-colors flex items-center"
              title="Filter options"
            >
              <FaFilter />
            </button>

            {/* Add Status Filter Menu */}
            {showFilterMenu && (
              <div ref={filterMenuRef} className="hidden md:block">
                <StatusFilterMenu
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  getStatusCount={getStatusCount}
                  STATUS_OPTIONS={STATUS_OPTIONS}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCollections = (collections) => {
    // Show loading skeleton when collections are loading
    if (collectionsLoading) {
      if (viewMode === "list") {
        return <LoadingSkeleton variant="collection-list" count={6} />;
      }
      return <LoadingSkeleton variant="collection-card" count={6} />;
    }

    // Show empty state when no collections
    if (!collections || collections.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
            <FaFolder className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No collections found
          </h3>
          <p className="text-gray-500 mb-6">
            Get started by creating your first collection.
          </p>
          <button
            onClick={() => setIsAddingRecord(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Create Collection
          </button>
        </div>
      );
    }

    // Helper function to determine navigation behavior for collaborator collections
    const getCollectionNavigation = (collection) => {
      // Always navigate to collection page, regardless of number of links or user role
      return () => router.push(`/collections/${collection.id}`);
    };

    if (viewMode === "list") {
      return (
        <CollectionListView
          currentUserId={systemUser?.id}
          collections={collections}
          isAdmin={isAdmin}
          onDelete={handleDeleteCollection}
          onView={handleViewCollection}
          onShare={handleShareCollection}
          getCollectionNavigation={getCollectionNavigation}
        />
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
        {collections.map((collection) =>
          collection.type === "external" ? (
            <ExternalCollectionCard
              currentUserId={systemUser?.id}
              key={collection.id}
              collection={collection}
              onView={getCollectionNavigation(collection)}
              deleteOption={collection.userId === systemUser?.id}
              deleteCollection={() => handleDeleteCollection(collection.id)}
              onShare={() => handleShareCollection(collection)}
              isAdmin={isAdmin}
            />
          ) : (
            <CollectionCard
              currentUserId={systemUser?.id}
              key={collection.id}
              collection={collection}
              onView={() => handleViewCollection(collection)}
              onShare={() => handleShareCollection(collection)}
            />
          )
        )}
      </div>
    );
  };

  // Add function to get collections with collaborators
  const getCollectionsWithCollaborators = () => {
    const search = searchTerm.toLowerCase();

    // Get all external collections that have collaborators
    const collectionsWithCollaborators = [
      ...collections.filter((collection) => {
        if (collection.type !== "external" || !collection.externalLinks) {
          return false;
        }
        return collection.externalLinks.some(
          (link) =>
            link &&
            link.id &&
            link.collaborators &&
            link.collaborators.length > 0
        );
      }),
      ...(collectionExternalLink?.filter((collection) => {
        if (collection.type !== "external" || !collection.externalLinks) {
          return false;
        }
        return collection.externalLinks.some(
          (link) =>
            link &&
            link.id &&
            link.collaborators &&
            link.collaborators.length > 0
        );
      }) || []),
    ];

    // Filter out empty external links and only keep links the user has access to
    const filteredCollections = collectionsWithCollaborators
      .map((collection) => {
        const accessibleLinks = collection.externalLinks.filter((link) => {
          // Filter out empty objects and links without proper data
          if (!link || !link.id) return false;

          // If user is the collection owner, they have access to all links
          if (collection.userId === systemUser?.id) return true;

          // Otherwise, only include links where the user is a collaborator
          return (
            link.collaborators &&
            link.collaborators.some(
              (collaborator) => collaborator.userId === systemUser?.id
            )
          );
        });

        return {
          ...collection,
          externalLinks: accessibleLinks,
        };
      })
      .filter((collection) => collection.externalLinks.length > 0); // Only include collections with accessible links

    // Apply search filter if needed
    if (searchTerm) {
      return filteredCollections.filter((collection) => {
        const collectionMatch =
          collection.name?.toLowerCase()?.includes(search) ||
          collection.description?.toLowerCase()?.includes(search);

        const collaboratorMatch = collection.externalLinks?.some((link) =>
          link.collaborators?.some(
            (collaborator) =>
              collaborator.name?.toLowerCase()?.includes(search) ||
              collaborator.email?.toLowerCase()?.includes(search)
          )
        );

        return collectionMatch || collaboratorMatch;
      });
    }

    return filteredCollections;
  };

  return (
    <div className="min-h-screen pb-20 md:px-4 overflow-x-hidden pt-6">
      {/* Main content with sidebar */}
      <div className="flex relative">
        {/* Main content area */}
        <div
          className={`flex-1 transition-all duration-300 ${
            isFolderSidebarOpen ? "mr-[400px]" : "mr-[0px] md:mr-[60px]"
          }`}
        >
          <TabGroup
            selectedIndex={getTabIndex()}
            onChange={(index) => {
              // Log the tab index for debugging

              let newTab;
              switch (index) {
                case 0:
                  newTab = "collections";
                  break;
                case 1:
                  newTab = "explore";
                  break;
                case 2:
                  newTab = "events";
                  break;
                case 3:
                  newTab = "collaborators";
                  break;
                default:
                  newTab = "explore";
              }

              setSelectedTab(newTab);

              const storage = getLocalStorage();
              if (storage) {
                storage.setItem("selectedTab", newTab);
              }
            }}
          >
            <div className="text-white rounded-lg p-2 md:p-6 mb-8">
              <div className="relative border-b border-slate-700 mb-6 overflow-hidden">
                {/* Mobile scroll indicator */}
                <div className="md:hidden absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none z-10"></div>

                <div className="overflow-x-auto scrollbar-hide -mx-2 md:mx-0">
                  <TabList className="flex space-x-4 min-w-max px-2 md:px-0">
                    <Tab
                      className={({ selected }) =>
                        !hasMounted
                          ? "text-gray-500 hover:text-slate-800 pb-4 px-2 focus:outline-none whitespace-nowrap text-sm md:text-base"
                          : `${
                              selected
                                ? "text-slate-800 border-b-2 border-blue-500"
                                : "text-gray-500 hover:text-slate-800"
                            } pb-4 px-2 focus:outline-none whitespace-nowrap text-sm md:text-base`
                      }
                    >
                      <span className="md:hidden">My</span>
                      <span className="hidden md:inline">My Collections</span>
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        !hasMounted
                          ? "text-gray-500 hover:text-slate-800 pb-4 px-2 focus:outline-none whitespace-nowrap text-sm md:text-base"
                          : `${
                              selected
                                ? "text-slate-800 border-b-2 border-blue-500"
                                : "text-gray-500 hover:text-slate-800"
                            } pb-4 px-2 focus:outline-none whitespace-nowrap text-sm md:text-base`
                      }
                    >
                      Explore
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        !hasMounted
                          ? "text-gray-500 hover:text-slate-800 pb-4 px-2 focus:outline-none whitespace-nowrap text-sm md:text-base"
                          : `${
                              selected
                                ? "text-slate-800 border-b-2 border-blue-500"
                                : "text-gray-500 hover:text-slate-800"
                            } pb-4 px-2 focus:outline-none whitespace-nowrap text-sm md:text-base`
                      }
                    >
                      <span className="md:hidden">Events</span>
                      <span className="hidden md:inline">
                        Event Collections
                      </span>
                    </Tab>
                    <Tab
                      className={({ selected }) =>
                        !hasMounted
                          ? "text-gray-500 hover:text-slate-800 pb-4 px-2 focus:outline-none whitespace-nowrap text-sm md:text-base"
                          : `${
                              selected
                                ? "text-slate-800 border-b-2 border-blue-500"
                                : "text-gray-500 hover:text-slate-800"
                            } pb-4 px-2 focus:outline-none whitespace-nowrap text-sm md:text-base`
                      }
                    >
                      <span className="md:hidden">Collab</span>
                      <span className="hidden md:inline">Collaborators</span>
                    </Tab>
                  </TabList>
                </div>
              </div>

              <div className="flex items-center gap-1 mb-2 w-full justify-end">
                <CollectionFilters
                  activeTypeFilter={activeTypeFilter}
                  onTypeFilterChange={setActiveTypeFilter}
                  visibilityFilter={visibilityFilter}
                  onVisibilityFilterChange={setVisibilityFilter}
                />
              </div>
              {/* My Collections View */}
              <div className="space-y-8">
                {/* Search and Filter Section */}
                {renderSearchAndFilters()}

                {/* Mobile Filter Menu */}
                {showFilterMenu && (
                  <div className="sm:hidden">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-4 mb-4">
                      <StatusFilterMenu
                        statusFilter={statusFilter}
                        onStatusFilterChange={setStatusFilter}
                        getStatusCount={getStatusCount}
                        STATUS_OPTIONS={STATUS_OPTIONS}
                      />
                    </div>
                  </div>
                )}

                {/* Show filtered collections if folder filters are active */}
                {folderFilteredCollections.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-gray-800">
                          Folder Contents
                        </h2>
                        <button
                          onClick={() => {
                            setFolderFilteredCollections([]);
                          }}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
                        >
                          <span>Clear Filter</span>
                          <svg
                            className="w-4 h-4"
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
                        </button>
                      </div>
                    </div>

                    {/* Resource Collections */}
                    {renderCollections(
                      displayedCollections.filter(
                        (collection) => collection.type === "resource"
                      )
                    )}

                    {/* External Collections */}
                    {renderCollections(
                      displayedCollections.filter(
                        (collection) => collection.type === "external"
                      )
                    )}

                    {/* No Results Message */}
                    {displayedCollections.length === 0 && (
                      <div className="text-center py-12">
                        <div className="mb-4">
                          <FaSearch className="w-12 h-12 mx-auto text-gray-300" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No collections found
                        </h3>
                        <p className="text-gray-500">
                          {searchTerm
                            ? `No collections match "${searchTerm}". Try adjusting your search.`
                            : "There are no collections to display yet."}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Pinned Collections Section */}
                    {/* {displayedCollections.some(
                      (collection) => collection.isPinned
                    ) && (
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                          Pinned Collections
                        </h2>
                        {renderCollections(
                          displayedCollections.filter(
                            (collection) => collection.isPinned
                          )
                        )}
                      </div>
                    )} */}

                    {/* Show either Folders Grid or All Collections based on selected tab */}
                    {selectedTab === "explore" && (
                      // In explore mode, show all collections directly
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                          All Collections
                        </h2>
                        {renderCollections(displayedCollections)}
                      </div>
                    )}

                    {selectedTab === "collections" && (
                      // In collections mode, show the folders grid
                      <FolderGrid
                        folders={folders}
                        filteredByTypeAndVisibility={displayedCollections}
                        setFolderFilteredCollections={
                          setFolderFilteredCollections
                        }
                        getUnassignedCollections={getUnassignedCollections}
                      />
                    )}

                    {selectedTab === "events" && (
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                          Event Collections
                        </h2>
                        {(() => {
                          const eventsByCollection = getCollectionsByEvent();

                          if (eventsByCollection.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                  <FaCalendar className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                  No Event Collections Available
                                </h3>
                                <p className="text-gray-500 max-w-md">
                                  {searchTerm
                                    ? `No events match "${searchTerm}". Try adjusting your search or filters.`
                                    : "There are no event collections to display yet. Add collections with event IDs to see them here."}
                                </p>
                              </div>
                            );
                          }

                          return (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-fr">
                              {eventsByCollection.map((event) => (
                                <div key={event.id} className="w-full h-full">
                                  <EventCollectionCard
                                    event={event}
                                    onView={() => handleViewCollection(event)}
                                    onShare={() => handleShareCollection(event)}
                                    onDelete={() =>
                                      handleDeleteCollection(event.id)
                                    }
                                    isAdmin={isAdmin}
                                    onBlogGenerate={() => {
                                      setSelectedEventForBlog(event);
                                      setIsBlogModalOpen(true);
                                    }}
                                    onDownload={() =>
                                      downloadEventDetails(
                                        event,
                                        event.collections
                                      )
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {selectedTab === "collaborators" && (
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                          Collections with Collaborators
                        </h2>
                        {(() => {
                          const collaboratorCollections =
                            getCollectionsWithCollaborators();

                          if (collaboratorCollections.length === 0) {
                            return (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                  <FaUsers className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                  No Collections with Collaborators
                                </h3>
                                <p className="text-gray-500 max-w-md">
                                  {searchTerm
                                    ? `No collections with collaborators match "${searchTerm}". Try adjusting your search.`
                                    : "There are no collections with collaborators to display yet. Add collaborators to external links to see them here."}
                                </p>
                              </div>
                            );
                          }

                          return renderCollections(collaboratorCollections);
                        })()}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </TabGroup>
        </div>

        {/* Folders Sidebar */}
        <div
          className={`fixed top-0 h-full bg-slate-50 shadow-lg transition-all duration-300 ease-in-out z-30 ${
            isFolderSidebarOpen
              ? "right-0 w-full md:w-[400px]" // Full width on mobile, 400px on desktop
              : "md:right-0 -right-full md:w-[60px] w-0" // Hide off-screen on mobile, show small width on desktop
          }`}
        >
          {/* Sidebar Header */}
          <button
            onClick={() => setIsFolderSidebarOpen(!isFolderSidebarOpen)}
            className={`hidden md:flex items-center justify-center w-full h-16 border-b border-gray-200 transition-colors z-50 ${
              isFolderSidebarOpen
                ? "hover:bg-gray-50 px-6 justify-between"
                : "hover:bg-gray-100"
            }`}
          >
            <div className="flex items-center">
              <FaFolder className="text-blue-500" size={24} />
              {isFolderSidebarOpen && (
                <>
                  <span className="ml-3 font-medium text-gray-700">
                    My Folders
                  </span>
                  <FaChevronRight className="ml-2 text-gray-400" />
                </>
              )}
            </div>
          </button>

          {/* Mobile Header */}
          <div
            className={`md:hidden flex items-center justify-between h-16 border-b border-gray-200 px-4 ${
              isFolderSidebarOpen ? "block" : "hidden"
            }`}
          >
            <span className="font-medium text-gray-700">My Folders</span>
            <button
              onClick={() => setIsFolderSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <FaChevronRight className="text-gray-400" />
            </button>
          </div>

          {/* Content Container */}
          <div className={`h-[calc(100%-4rem)]`}>
            {!isFolderSidebarOpen ? (
              <div className="hidden md:block space-y-2">
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => {
                      const filteredFolderCollections =
                        displayedCollections.filter((collection) =>
                          folder.collections.some(
                            (folderCollection) =>
                              folderCollection.id === collection.id
                          )
                        );
                      setFolderFilteredCollections(filteredFolderCollections);
                    }}
                    className="w-full p-2 hover:bg-gray-50 transition-colors group relative"
                    title={folder.name}
                  >
                    <div className="relative w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center border border-blue-100 group-hover:border-blue-200 transition-colors">
                      <span className="text-blue-600 font-medium">
                        {getFolderInitial(folder.name)}
                      </span>
                      <div className="absolute -right-1 -bottom-1">
                        <FaFolder className="text-blue-500" size={12} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="h-full overflow-y-auto">
                <div className="p-6">
                  <div className="flex justify-end mb-6">
                    <button
                      onClick={() => setIsAddingFolder(true)}
                      className="px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
                    >
                      <FaPlus className="inline mr-2" /> New Folder
                    </button>
                  </div>

                  <FoldersList
                    collections={displayedCollections}
                    folders={folders}
                    onEditFolder={(folderId, data) => {
                      updateFolderMutation.mutate({ id: folderId, ...data });
                    }}
                    onDeleteFolder={(folderId) => {
                      deleteFolderMutation(folderId);
                    }}
                    isAdmin={isAdmin}
                    organizations={organizations}
                    setFolderFilteredCollections={setFolderFilteredCollections}
                    addCollectionToFolder={(collectionId, folderId) => {
                      addCollectionToFolderMutation({
                        collectionId,
                        folderId,
                      });
                    }}
                    removeCollectionFromFolder={(collectionId, folderId) => {
                      removeCollectionFromFolderMutation({
                        collectionId,
                        folderId,
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Collection Modal */}
      {isAddingRecord && (
        <Modal isOpen={isAddingRecord} onClose={() => setIsAddingRecord(false)}>
          <AddCollectionForm
            events={events}
            onSubmit={async (data) => {
              try {
                const collectionData = {
                  ...data,
                  // type is now included in the form data from our CollectionTypeSelector
                };

                addCollectionMutation(collectionData);
                setIsAddingRecord(false);
              } catch (error) {
                console.error("Failed to create collection:", error);
              }
            }}
            onClose={() => setIsAddingRecord(false)}
            organizations={organizations}
            type="resource" // default type, but form will control the actual selection
            isAdvocate={isAdvocate}
            isAdmin={isAdmin}
          />
        </Modal>
      )}

      {/* Collection View Modal */}
      {isViewModalOpen && (
        <CollectionViewModal
          collection={selectedCollection}
          onClose={() => setIsViewModalOpen(false)}
          isAdmin={isAdmin}
        />
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <Modal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
        >
          <div className="w-full bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Share Collection
              </h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collection Link
                </label>
                <div className="flex rounded-md shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/collections/${selectedCollection.id}`}
                    className="flex-1 min-w-0 block w-full px-4 py-3 rounded-l-lg border border-gray-300 bg-gray-50 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/collections/${selectedCollection.id}`
                      );
                    }}
                    className="inline-flex items-center px-6 py-3 border border-l-0 border-gray-300 rounded-r-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {isBlogModalOpen && (
        <BlogGenerationModal
          isOpen={isBlogModalOpen}
          onClose={() => setIsBlogModalOpen(false)}
          selectedEvent={selectedEventForBlog}
          blogFocus={blogFocus}
          setBlogFocus={setBlogFocus}
        />
      )}

      {isDownloadModalOpen && (
        <Modal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
        >
          <DownloadModal
            isOpen={isDownloadModalOpen}
            onClose={() => setIsDownloadModalOpen(false)}
            downloadEventData={downloadEventData}
            selectedItemsForDownload={selectedItemsForDownload}
            setSelectedItemsForDownload={setSelectedItemsForDownload}
            handleDownload={handleDownload}
          />
        </Modal>
      )}

      {/* Add Folder Modal */}
      {isAddingFolder && (
        <Modal isOpen={isAddingFolder} onClose={() => setIsAddingFolder(false)}>
          <AddFolderForm
            onSubmit={(data) => {
              createFolderMutation(data);
              setIsAddingFolder(false);
            }}
            onClose={() => setIsAddingFolder(false)}
            isAdmin={isAdmin}
            organizations={organizations}
          />
        </Modal>
      )}

      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsFolderSidebarOpen(!isFolderSidebarOpen)}
        className="md:hidden fixed top-4 right-4 z-40 bg-blue-500 text-white p-3 rounded-full shadow-lg hover:bg-blue-600 transition-colors"
      >
        <FaFolder size={24} />
      </button>

      {/* Delete Collection Confirmation Modal */}
      {deleteCollectionConfirmation.show && (
        <Modal
          isOpen={deleteCollectionConfirmation.show}
          onClose={() =>
            setDeleteCollectionConfirmation({ show: false, collectionId: null })
          }
        >
          <div className="p-6 text-slate-600">
            <h2 className="text-xl font-bold mb-4 text-center">
              Confirm Deletion
            </h2>
            <p className="text-center">
              Are you sure you want to delete this collection?
            </p>
            <p className="mb-6 text-center">
              This will remove all associated links, notes, and resources and
              cannot be undone.
            </p>
            <div className="flex justify-center gap-6">
              <button
                onClick={() =>
                  setDeleteCollectionConfirmation({
                    show: false,
                    collectionId: null,
                  })
                }
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedDeleteCollection}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Mobile Filter Modal */}
      {showFilterMenu && (
        <div
          className="fixed inset-0 z-[100] md:hidden flex items-center justify-center p-4 bg-black/30"
          onClick={() => setShowFilterMenu(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-sm w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Filter by Status
                </h3>
                <button
                  onClick={() => setShowFilterMenu(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <svg
                    className="w-5 h-5"
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

              <div className="space-y-3 mb-6">
                {STATUS_OPTIONS.map((status) => (
                  <label
                    key={status.id}
                    className="flex items-center justify-between text-sm text-gray-700 hover:bg-gray-50 px-3 py-2 rounded-md cursor-pointer"
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={statusFilter[status.id]}
                        onChange={() => {
                          const newFilter = {
                            ...statusFilter,
                            [status.id]: !statusFilter[status.id],
                          };
                          setStatusFilter(newFilter);
                        }}
                        className="rounded text-blue-500 focus:ring-blue-500 mr-3"
                      />
                      <span>{status.label}</span>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {getStatusCount(status.id)}
                    </span>
                  </label>
                ))}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <div className="space-x-3">
                  <button
                    onClick={() => {
                      const newFilter = STATUS_OPTIONS.reduce((acc, status) => {
                        acc[status.id] = true;
                        return acc;
                      }, {});
                      setStatusFilter(newFilter);
                    }}
                    className="text-sm text-blue-500 hover:text-blue-600"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => {
                      const newFilter = STATUS_OPTIONS.reduce((acc, status) => {
                        acc[status.id] = false;
                        return acc;
                      }, {});
                      setStatusFilter(newFilter);
                    }}
                    className="text-sm text-red-500 hover:text-red-600"
                  >
                    Deselect All
                  </button>
                </div>
                <button
                  onClick={() => {
                    const defaultFilter = STATUS_OPTIONS.reduce(
                      (acc, status) => {
                        acc[status.id] = !["completed", "archived"].includes(
                          status.id
                        );
                        return acc;
                      },
                      {}
                    );
                    setStatusFilter(defaultFilter);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-600"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
