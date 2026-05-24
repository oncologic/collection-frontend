"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import {
  FaEdit,
  FaSearch,
  FaPlus,
  FaLock,
  FaShare,
  FaChevronUp,
  FaChevronDown,
  FaTimes,
  FaDownload,
  FaFilePdf,
  FaRobot,
  FaCalendar,
  FaArchive,
  FaCog,
  FaFilter,
  FaPaperclip,
  FaVideo,
  FaHashtag,
  FaFlask,
  FaBookOpen,
  FaArrowRight,
  FaArrowLeft,
  FaLink,
  FaFileImage,
  FaCheck,
  FaPlay,
  FaExternalLinkAlt,
  FaFileAlt,
  FaRegStickyNote,
  FaEllipsisV,
  FaDatabase,
  FaGlobe,
  FaEye,
  FaUserPlus,
  FaUsers,
  FaTable,
  FaThList,
  FaColumns,
  FaChalkboard,
} from "react-icons/fa";
import Modal from "@/app/components/Modal";
import RoleSelectionModal from "@/app/components/RoleSelectionModal";
import {
  useGetResources,
  useDeleteCollectionResource,
  useRemoveResourceFromCollection,
  useUpdateCollectionResource,
  useRemoveExternalLinkFromCollection,
  useGetAllCollections,
} from "@/app/hooks/useResources";
import { useContextAuth } from "@/app/context/authContext";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAddResourceToCollection,
  useGetCollectionById,
  useAddExternalLinkToCollection,
  useUpdateExternalLinkInCollection,
  useGetExternalLinkNotations,
  useGetCollectionCollaborators,
  useInviteCollectionCollaborator,
  useRemoveCollectionCollaborator,
} from "@/app/hooks/useCollections";
import { useAssociatedSocialMediaAccounts } from "@/app/hooks/useSocialMedia";
import SocialMediaAssociationManagerModal from "@/app/components/social-media/SocialMediaAssociationManagerModal";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import CustomEditor from "@/app/components/common/CustomEditor";
import AddCollectionForm, {
  STATUS_OPTIONS,
} from "@/app/components/forms/AddCollectionForm";
import InputField from "@/app/components/inputs/InputField";
import { useResourceTypes } from "@/app/hooks/useMetadata";
import MultiSelect from "@/app/components/inputs/MultiSelect";
import CollectionResourceCard from "@/app/components/cards/CollectionResourceCard";
import Image from "next/image";
import CollectionViewModal from "@/app/components/CollectionViewModal";
import ViewAllResourcesModal from "@/app/components/modals/ViewAllResourcesModal";
import ResourcesGrid from "@/app/components/ResourcesGrid";
import dynamic from "next/dynamic";
import AddExternalLinkForm from "@/app/components/forms/AddExternalLinkForm";
import ExternalLinkCard from "@/app/components/cards/ExternalLinkCard";
import ShareContentModal from "@/app/components/ShareContentModal";
import ExportCollectionModal from "@/app/components/ExportCollectionModal";
import Calendar from "@/app/components/events/Calendar";
import PublicJsonSharingControl from "@/app/components/PublicJsonSharingControl";
import ExternalLinkWhiteboard from "@/app/components/ExternalLinkWhiteboard";
import { getDateRangeValues, getTodayDateInputValue } from "@/app/utils/general";

import { toast } from "react-hot-toast";
import {
  useGetSharedLinksByTypeAndId,
  useRevokeSharedLink,
} from "@/app/hooks/useSharedLinks";
import ChatPrompt from "@/app/components/ChatPrompt";
import ChatBubble from "@/app/components/ChatBubble";
import ChatHistory from "@/app/components/ChatHistory";
import Chat from "@/app/components/Chat";
import {
  useGetOrganization,
  useOrganizations,
} from "@/app/hooks/useOrganizations";
import { useEvents } from "@/app/hooks/useEvents";
import AttachmentsModal from "@/app/components/modals/AttachmentsModal";
import StatusFilter from "@/app/components/filters/StatusFilter";
import VideoBrowser from "@/app/components/VideoBrowser";
import CalendarHoverInfo from "@/app/components/events/CalendarHoverInfo";
import ImageBrowser from "@/app/components/ImageBrowser/ImageBrowser";
import TimestampModal from "@/app/components/TimestampModal";
import CollectionCollaboratorModal from "@/app/components/CollectionCollaboratorModal";
import FilesBrowser from "@/app/components/FilesBrowser/FilesBrowser";
import CollectionChat from "@/app/components/CollectionChat";
import { usePinItems } from "@/app/hooks/usePinned";
import { useLinkGroupById } from "@/app/hooks/useMetadata";
import { useExternalLinkTags, useTags } from "@/app/hooks/useTags";
import TagFilter from "@/app/components/filters/TagFilter";
import TagClassificationEnhanced from "@/app/components/TagClassificationEnhanced";
import MergeCollectionsModal from "@/app/components/MergeCollectionsModal";
import WorkflowGanttChart from "@/app/components/WorkflowGanttChart";
import { FaCodeBranch, FaMagic, FaUpload } from "react-icons/fa";
const AddResourcesModal = dynamic(() =>
  import("@/app/components/AddResourcesModal")
);

const ExternalLinkAICreate = dynamic(() =>
  import("@/app/components/ExternalLinkAICreate")
);

const VIEW_OPTIONS = [
  {
    id: "card",
    label: "Cards",
    description: "Grid of full cards",
    Icon: FaTable,
  },
  {
    id: "list",
    label: "List",
    description: "Compact rows",
    Icon: FaThList,
  },
  {
    id: "board",
    label: "Board",
    description: "Kanban columns",
    Icon: FaColumns,
  },
];

const normalizeViewMode = (mode) => {
  if (mode === "grid") return "card";

  return VIEW_OPTIONS.some((option) => option.id === mode) ? mode : "card";
};

function CollectionViewPicker({
  viewMode,
  onChange,
  className = "",
  menuAlign = "right",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
  const currentView =
    VIEW_OPTIONS.find((option) => option.id === normalizeViewMode(viewMode)) ||
    VIEW_OPTIONS[0];

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md text-slate-600 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 min-w-[120px]"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title="Choose a view"
      >
        <currentView.Icon className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-medium">{currentView.label}</span>
        <FaChevronDown
          className={`h-3 w-3 ml-auto transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            menuAlign === "left" ? "left-0" : "right-0"
          } top-full mt-2 z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl`}
          role="menu"
        >
          {VIEW_OPTIONS.map((option) => {
            const isActive = option.id === currentView.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
                role="menuitemradio"
                aria-checked={isActive}
              >
                <option.Icon className="h-4 w-4 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{option.label}</div>
                  <div className="text-xs text-slate-500">
                    {option.description}
                  </div>
                </div>
                {isActive && <FaCheck className="h-3.5 w-3.5 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CollectionPage() {
  const {
    isAdmin,
    isAdvocate,
    userId,
    systemUser,
    isLoaded: authIsLoaded,
    getAuthHeader,
  } = useContextAuth();
  const { user } = useUser();
  const { id } = useParams();
  const collectionId = id;
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddResources, setShowAddResources] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [addedResourceIds, setAddedResourceIds] = useState(new Set());
  const [availableResources, setAvailableResources] = useState([]);
  const [resources, setResources] = useState([]);
  const [highlightedId, setHighlightedId] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    resourceId: null,
  });
  const [chatData, setChatData] = useState(null);
  const [selectedResourceTypes, setSelectedResourceTypes] = useState([]);
  const [resourceNotes, setResourceNotes] = useState({});
  const [flippedResourceId, setFlippedResourceId] = useState(null);
  const [flippedCardId, setFlippedCardId] = useState(null);
  const [showCopyDropdown, setShowCopyDropdown] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [resourceSearchTerm, setResourceSearchTerm] = useState("");
  const [activeHeaderTab, setActiveHeaderTab] = useState("details");

  const [viewAllModal, setViewAllModal] = useState({
    isOpen: false,
    resources: [],
  });
  const [modalViewAllMode, setModalViewAllMode] = useState("grid");
  const [modalSearchTerm, setModalSearchTerm] = useState("");

  // Public JSON sharing state
  const [showPublicJsonModal, setShowPublicJsonModal] = useState(false);

  // Social media state
  const [showSocialMediaModal, setShowSocialMediaModal] = useState(false);

  const {
    data: collection,
    isLoading: collectionLoading,
    refetch: refreshCollection,
  } = useGetCollectionById(collectionId);

  // Fetch associated social media accounts
  const { data: socialMediaAssociations = [] } =
    useAssociatedSocialMediaAccounts(collectionId, "collection");

  // Extract the accounts from the associations
  const socialMediaAccounts = useMemo(() => {
    return socialMediaAssociations
      .map((association) => association.account)
      .filter(Boolean);
  }, [socialMediaAssociations]);

  const collectionHashtags = useMemo(
    () => (Array.isArray(collection?.hashtags) ? collection.hashtags : []),
    [collection?.hashtags]
  );

  const socialMediaActionCount =
    socialMediaAccounts.length + collectionHashtags.length;

  // Get link groups for the external links in this collection
  const { data: linkGroups } = useLinkGroupById(
    collection?.externalLinks?.[0]?.id,
    null,
    null
  );

  const { mutateAsync: addResourceToCollectionMutation } =
    useAddResourceToCollection();
  const { mutateAsync: deleteResourceMutation } =
    useRemoveResourceFromCollection();

  const { mutateAsync: deleteExternalLinkMutation } =
    useRemoveExternalLinkFromCollection();

  const { data: allResources = [] } = useGetResources();

  const { mutateAsync: updateCollectionResourceMutation } =
    useUpdateCollectionResource();

  const { data: resourceTypes = [] } = useResourceTypes();

  const { data: organizations = [] } = useOrganizations();

  const router = useRouter();

  const { mutate: addExternalLinkMutation } = useAddExternalLinkToCollection();
  const {
    mutate: updateExternalLinkMutation,
    mutateAsync: updateExternalLinkMutationAsync,
  } =
    useUpdateExternalLinkInCollection();

  // State for controlling regular events fetching
  const [showRegularEvents, setShowRegularEvents] = useState(false); // Default to false (opt-in) for regular events from useEvents()

  // Only fetch events if user opted in to show regular events
  const { data: allEventsData = [] } = useEvents({ enabled: showRegularEvents });

  const regularOrganizationEvents = useMemo(() => {
    return allEventsData;
  }, [allEventsData]);

  const [selectedExternalLink, setSelectedExternalLink] = useState(null);

  const [showShareModal, setShowShareModal] = useState(false);

  const [showSharedLinks, setShowSharedLinks] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [isAIBulkMode, setIsAIBulkMode] = useState(false);
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);

  const { data: sharedLinks, isLoading: isLoadingSharedLinks } =
    useGetSharedLinksByTypeAndId("collection", id);

  const filteredSharedLinks =
    sharedLinks?.filter(
      (link) => link.linkType === "collection" && link.linkId === id
    ) || [];

  const { mutate: revokeLink } = useRevokeSharedLink();

  // Collection collaborator hooks
  const {
    data: collaborators,
    isLoading: isLoadingCollaborators,
    refetch: refetchCollaborators,
  } = useGetCollectionCollaborators(id);
  const { mutate: inviteCollaborator } = useInviteCollectionCollaborator();
  const { mutate: removeCollaborator } = useRemoveCollectionCollaborator();

  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const pdfExporterRef = useRef(null);

  const [showExportModal, setShowExportModal] = useState(false);

  const [chatVisible, setChatVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);

  const [collectionData, setCollectionData] = useState({
    id: null,
    resources: [],
    externalLinks: [],
  });

  const [showCalendarView, setShowCalendarView] = useState(false);
  const [showPublicOnly, setShowPublicOnly] = useState(false); // Default to false (show all)

  // Add a new ref for the calendar section
  const calendarRef = useRef(null);
  const fullCalendarRef = useRef(null);

  const [showArchived, setShowArchived] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [statusFilter, setStatusFilter] = useState(() => {
    return STATUS_OPTIONS.reduce((acc, status) => {
      // Show all statuses by default except completed and archived
      acc[status.id] = !["completed", "archived"].includes(status.id);
      return acc;
    }, {});
  });
  const filterMenuRef = useRef(null);
  const addDropdownRef = useRef(null);

  // Add this near your other state declarations
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);

  // Add this state near your other state declarations
  const [showNotationDates, setShowNotationDates] = useState(true);

  // Add this state near your other state declarations
  const [showVideoBrowser, setShowVideoBrowser] = useState(false);

  // Add calendar hover state
  const [showCalendarHover, setShowCalendarHover] = useState(false);
  const calendarButtonRef = useRef(null);

  // Add mobile dropdown state
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);
  const mobileDropdownRef = useRef(null);

  // Add action menu state
  const [showActionMenu, setShowActionMenu] = useState(false);
  const actionMenuRef = useRef(null);

  // Add a new state to track the view mode for each type independently
  const [resourceViewMode, setResourceViewMode] = useState(() => {
    if (typeof window !== "undefined") {
      return normalizeViewMode(localStorage.getItem("resourceViewMode"));
    }
    return "card";
  });

  const [externalViewMode, setExternalViewMode] = useState(() => {
    if (typeof window !== "undefined") {
      return normalizeViewMode(localStorage.getItem("externalLinkViewMode"));
    }
    return "card";
  });

  // Compute the current view mode based on collection type
  const viewMode = normalizeViewMode(
    collection?.type === "resource" ? resourceViewMode : externalViewMode
  );

  // Replace the setViewMode usage with this function
  const setViewMode = (newMode) => {
    const normalizedMode = normalizeViewMode(newMode);

    if (collection?.type === "resource") {
      setResourceViewMode(normalizedMode);
      localStorage.setItem("resourceViewMode", normalizedMode);
    } else {
      setExternalViewMode(normalizedMode);
      localStorage.setItem("externalLinkViewMode", normalizedMode);
    }
  };

  // Add this helper function to get all attachments from external links
  const getAllAttachments = useMemo(() => {
    if (!collection?.externalLinks) return [];
    return collection.externalLinks.reduce((acc, link) => {
      if (link.attachments) {
        return [...acc, ...link.attachments];
      }
      return acc;
    }, []);
  }, [collection]);

  // Add this helper to check if current user owns the collection
  const isCollectionOwner = useMemo(() => {
    if (!collection || !systemUser?.id) return false;
    return (
      collection.userId === systemUser.id ||
      collection.createdBy === systemUser.id ||
      collection.ownerId === systemUser.id
    );
  }, [collection, systemUser?.id]);

  const canEditCollection =
    isAdmin ||
    (isAdvocate && collection?.visibility === "private") ||
    isCollectionOwner;

  // Add tag filtering state
  const [selectedTags, setSelectedTags] = useState([]);
  const [filterTab, setFilterTab] = useState("status"); // New state for filter tabs

  // Add calendar tag highlighting state with localStorage persistence
  const [highlightedCalendarTags, setHighlightedCalendarTags] = useState(() => {
    if (typeof window !== "undefined" && id) {
      const saved = localStorage.getItem(`collection-calendar-tags-${id}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showCalendarTagSelector, setShowCalendarTagSelector] = useState(false);
  const [tagFilterMode, setTagFilterMode] = useState(() => {
    if (typeof window !== "undefined" && id) {
      const saved = localStorage.getItem(`collection-tag-filter-mode-${id}`);
      return saved || "OR";
    }
    return "OR";
  }); // "OR" or "AND"

  // Get tags data
  const { data: tags = [] } = useTags();
  const { data: externalLinkTagOptions = [] } = useExternalLinkTags();

  // Get unique tags from external links and their notations in this collection
  const externalLinkTags = useMemo(() => {
    if (!collection?.externalLinks) return [];

    const tagMap = new Map();

    collection.externalLinks.forEach((link) => {
      // Collect tags from external links
      if (link.tags && Array.isArray(link.tags)) {
        link.tags.forEach((tag) => {
          if (tag && tag.id) {
            tagMap.set(tag.id, tag);
          }
        });
      }

      // Collect tags from notations within external links
      if (link.notations && Array.isArray(link.notations)) {
        link.notations.forEach((notation) => {
          if (notation.tags && Array.isArray(notation.tags)) {
            notation.tags.forEach((tag) => {
              if (tag && tag.id) {
                tagMap.set(tag.id, tag);
              }
            });
          }
        });
      }
    });

    return Array.from(tagMap.values());
  }, [collection?.externalLinks]);

  // Use external link tags for external collections, otherwise use general tags
  const availableTags =
    collection?.type === "external" ? externalLinkTags : tags;

  const hasActiveTagFilters = selectedTags.length > 0;

  // Helper function to generate CSS class names for events based on tags
  const generateEventClassName = (tags, status, isHighlighted, isDimmed) => {
    const baseClass = "calendar-event";
    const statusClass = `status-${status?.toLowerCase() || "pending"}`;
    const tagClasses =
      tags
        ?.map((tag) => `tag-${tag.name?.toLowerCase().replace(/\s+/g, "-")}`)
        .join(" ") || "";
    const multiTagClass = tags && tags.length > 1 ? "multi-tag" : "";

    return [
      baseClass,
      statusClass,
      tagClasses,
      multiTagClass,
      isHighlighted ? "highlighted" : "",
      isDimmed ? "dimmed" : "",
    ]
      .filter(Boolean)
      .join(" ");
  };

  // Calculate counts for active and archived items
  const resourceCounts = useMemo(() => {
    return resources.reduce(
      (counts, resource) => {
        if (resource.status === "archived") {
          counts.archived += 1;
        } else {
          counts.active += 1;
        }
        return counts;
      },
      { active: 0, archived: 0 }
    );
  }, [resources]);

  // Calculate all events from resources, external links, and notations for the calendar
  const combinedEvents = useMemo(() => {
    if (!collection) return [];

    const allEvents = [];
    const searchLower = resourceSearchTerm.toLowerCase();
    const collectionRange = getDateRangeValues(collection);

    if (
      collectionRange.startDate &&
      (!resourceSearchTerm ||
        collection.name?.toLowerCase().includes(searchLower) ||
        collection.description?.toLowerCase().includes(searchLower))
    ) {
      allEvents.push({
        id: `collection-${collection.id}`,
        title: collection.name || "Untitled Collection",
        startDate: collectionRange.startDate,
        endDate: collectionRange.endDate,
        type: "collection",
        status: collection.status || "pending",
        collectionId: collection.id,
        description: collection.description,
      });
    }

    // Add external links with dates
    if (collection.externalLinks) {
      collection.externalLinks.forEach((link) => {
        const linkRange = getDateRangeValues(link);
        // Apply search filtering to calendar events
        const matchesSearch =
          !resourceSearchTerm ||
          link.name?.toLowerCase().includes(searchLower) ||
          (link.description &&
            link.description.toLowerCase().includes(searchLower)) ||
          (link.url && link.url.toLowerCase().includes(searchLower)) ||
          (link.notes && link.notes.toLowerCase().includes(searchLower));

        // Apply tag filtering to calendar events
        const matchesTags =
          selectedTags.length === 0 ||
          (link.tags &&
            link.tags.length > 0 &&
            selectedTags.some((selectedTag) =>
              link.tags.some((tag) => tag.id === selectedTag.id)
            ));

        // Apply status filtering to calendar events
        const linkStatus = link.status?.toLowerCase() || "pending";
        const matchesStatus = statusFilter[linkStatus];

        // Add external link to calendar if it has a date and matches filters
        if (linkRange.startDate && matchesSearch && matchesTags && matchesStatus) {
            // Generate tag-based styling
            const eventTags = link.tags || [];
            const primaryTag = eventTags[0]; // Use first tag as primary
            const tagColors = eventTags.map((tag) => tag.color).filter(Boolean);
            const primaryColor = primaryTag?.color || "#3B82F6";

            // Calculate highlighting state based on filter mode
            const isHighlighted =
              highlightedCalendarTags.length === 0 ||
              (tagFilterMode === "OR"
                ? // OR logic: event highlighted if it has ANY of the selected tags
                  eventTags.some((tag) =>
                    highlightedCalendarTags.some((hTag) => hTag.id === tag.id)
                  )
                : // AND logic: event highlighted if it has ALL of the selected tags
                  highlightedCalendarTags.every((hTag) =>
                    eventTags.some((tag) => tag.id === hTag.id)
                  ));
            const isDimmed =
              highlightedCalendarTags.length > 0 && !isHighlighted;

            allEvents.push({
              id: link.id,
              title: link.name || link.url || "Untitled Link",
              startDate: linkRange.startDate,
              endDate: linkRange.endDate,
              startTime: link.startTime,
              endTime: link.endTime,
              timezone: link.timezone,
              type: "external_link",
              status: link.status || "pending",
              collectionId: collection.id,
              url: link.url,
              description: link.description,
              // Tag-based styling using inline styles for colors
              tags: eventTags,
              primaryColor: primaryColor,
              tagColors: tagColors,
              hasMultipleTags: eventTags.length > 1,
              tagCount: eventTags.length,
              // Highlighting state
              isHighlighted: isHighlighted,
              isDimmed: isDimmed,
              className: generateEventClassName(
                eventTags,
                link.status,
                isHighlighted,
                isDimmed
              ),
              style: {
                "--primary-color": primaryColor,
                "--secondary-color": tagColors[1] || primaryColor,
              },
            });
        }

        // Add notations with dates only if showNotationDates is true and parent link matches all filters
        // Process notations even if parent link doesn't have a date
        if (
          showNotationDates &&
          link.notations &&
          matchesSearch &&
          matchesTags &&
          matchesStatus
        ) {
            link.notations.forEach((notation) => {
              const notationRange = getDateRangeValues(notation);
              if (notationRange.startDate) {
                // Also apply search filtering to notations
                const notationMatchesSearch =
                  !resourceSearchTerm ||
                  notation.title?.toLowerCase().includes(searchLower) ||
                  notation.notes?.toLowerCase().includes(searchLower) ||
                  notation.content?.toLowerCase().includes(searchLower);

                if (notationMatchesSearch) {
                  // Combine tags from parent link and notation
                  const linkTags = link.tags || [];
                  const notationTags = notation.tags || [];
                  const eventTags = [...linkTags, ...notationTags];

                  // Remove duplicate tags (by id)
                  const uniqueEventTags = eventTags.filter(
                    (tag, index, self) =>
                      index === self.findIndex((t) => t.id === tag.id)
                  );

                  const primaryTag = uniqueEventTags[0];
                  const tagColors = uniqueEventTags
                    .map((tag) => tag.color)
                    .filter(Boolean);
                  const primaryColor = primaryTag?.color || "#3B82F6";

                  // Check highlighting state with parent-child relationship based on filter mode
                  // Notation is highlighted if:
                  // 1. No tags are highlighted (show all), OR
                  // 2. Based on filter mode (AND/OR)
                  const isHighlighted =
                    highlightedCalendarTags.length === 0 ||
                    (tagFilterMode === "OR"
                      ? // OR logic: notation highlighted if it has ANY of the selected tags
                        uniqueEventTags.some((tag) =>
                          highlightedCalendarTags.some(
                            (hTag) => hTag.id === tag.id
                          )
                        )
                      : // AND logic: notation highlighted if it has ALL of the selected tags
                        highlightedCalendarTags.every((hTag) =>
                          uniqueEventTags.some((tag) => tag.id === hTag.id)
                        ));
                  const isDimmed =
                    highlightedCalendarTags.length > 0 && !isHighlighted;

                  allEvents.push({
                    id: `notation-${notation.id}`,
                    parentId: link.id,
                    notationId: notation.id,
                    title:
                      notation.title ||
                      `Note: ${
                        notation.content?.substring(0, 20) || "Untitled"
                      }...`,
                    startDate: notationRange.startDate,
                    endDate: notationRange.endDate,
                    type: "notation",
                    status: notation.status || "pending",
                    collectionId: collection.id,
                    description: notation.notes,
                    highlighted: notation.highlighted,
                    startTime: notation.startTime || notation.start_time || "",
                    endTime: notation.endTime || notation.end_time || "",
                    timezone: notation.timezone || "",
                    // Combined tags from parent link and notation
                    tags: uniqueEventTags,
                    primaryColor: primaryColor,
                    tagColors: tagColors,
                    hasMultipleTags: uniqueEventTags.length > 1,
                    tagCount: uniqueEventTags.length,
                    // Highlighting state
                    isHighlighted: isHighlighted,
                    isDimmed: isDimmed,
                    className: generateEventClassName(
                      uniqueEventTags,
                      notation.status,
                      isHighlighted,
                      isDimmed
                    ),
                    style: {
                      "--primary-color": primaryColor,
                      "--secondary-color": tagColors[1] || primaryColor,
                    },
                  });
                }
              }
            });
          }
      });
    }

    return allEvents;
  }, [
    collection,
    showNotationDates,
    selectedTags,
    statusFilter,
    resourceSearchTerm,
    highlightedCalendarTags,
    tagFilterMode,
  ]);

  useEffect(() => {
    if (collection) {
      setCollectionData({
        id: collection.id,
        resources: collection.resources?.map((r) => r.id) || [],
        externalLinks: collection.externalLinks?.map((l) => l.id) || [],
      });
    }
  }, [collection]);

  // Check if user has completed role setup
  useEffect(() => {
    if (authIsLoaded && user && !user.publicMetadata.roles) {
      setShowRoleModal(true);
    }
  }, [authIsLoaded, user]);

  useEffect(() => {
    if (collection) {
      // Set resources based on collection type
      const collectionItems =
        collection.type === "external"
          ? collection.externalLinks || []
          : collection.resources || [];
      setResources(collectionItems);
    }
  }, [collection]);

  useEffect(() => {
    if (allResources && collection) {
      const currentItems =
        collection.type === "external"
          ? collection.externalLinks || []
          : collection.resources || [];

      const filtered = allResources.filter(
        (resource) =>
          !currentItems.find((r) => r.id === resource.id) &&
          !addedResourceIds.has(resource.id)
      );
      setAvailableResources(filtered);
    }
  }, [allResources, collection, addedResourceIds, showAddResources]);

  useEffect(() => {
    // Load chat history from localStorage
    const savedHistory = localStorage.getItem(`chat-history-collection-${id}`);
    if (savedHistory) {
      setChatHistory(JSON.parse(savedHistory));
    }
  }, [id]);

  // Add a new state to track if user is interacting with calendar hover
  const [isInteractingWithCalendarHover, setIsInteractingWithCalendarHover] =
    useState(false);

  // Close the calendar hover card when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

      // Only close the calendar if clicking outside AND not inside any calendar-related elements
      // AND not currently interacting with the hover card
      if (
        showCalendarHover &&
        calendarButtonRef.current &&
        !calendarButtonRef.current.contains(event.target) &&
        !event.target.closest(".calendar-hover-card") &&
        !event.target.closest(".calendar-container") &&
        !isInteractingWithCalendarHover
      ) {
        // On mobile, don't auto-close - rely on the X button only
        // On desktop, close on click outside
        if (!isMobile) {
          setShowCalendarHover(false);
        }
      }
    };

    const handleResize = () => {
      // Close hover card on resize to prevent positioning issues
      if (showCalendarHover) {
        setShowCalendarHover(false);
      }
    };

    // Listen for the custom event to scroll to full calendar
    const handleScrollToFullCalendar = () => {
      setShowCalendarView(true);

      // Set a small timeout to ensure the calendar is rendered
      setTimeout(() => {
        fullCalendarRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scrollToFullCalendar", handleScrollToFullCalendar);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener(
        "scrollToFullCalendar",
        handleScrollToFullCalendar
      );
    };
  }, [calendarButtonRef, showCalendarHover, isInteractingWithCalendarHover]);

  const handleDeleteResource = async (resourceId) => {
    setDeleteConfirmation({ show: true, resourceId });
  };

  const handleDeleteExternalLink = async (externalLinkId) => {
    setDeleteConfirmation({ show: true, externalLinkId });
  };

  const handleConfirmedDelete = async () => {
    try {
      if (deleteConfirmation.resourceId) {
        await deleteResourceMutation({
          collectionId,
          resourceId: deleteConfirmation.resourceId,
        });
        refreshCollection();
      } else if (deleteConfirmation.externalLinkId) {
        await deleteExternalLinkMutation({
          collectionId,
          externalLinkId: deleteConfirmation.externalLinkId,
        });
        refreshCollection();
      }
    } catch (error) {
      console.error("Failed to delete resource:", error);
    } finally {
      setDeleteConfirmation({ show: false, resourceId: null });
    }
  };

  // Close the filter menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target)
      ) {
        setShowFilterMenu(false);
      }

      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(event.target)
      ) {
        setShowMobileDropdown(false);
      }

      if (
        addDropdownRef.current &&
        !addDropdownRef.current.contains(event.target)
      ) {
        setShowAddDropdown(false);
      }

      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        // Add a small delay to prevent interference with button clicks
        setTimeout(() => {
          setShowActionMenu(false);
        }, 150);
      }

    }

    function handleTouchOutside(event) {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target)
      ) {
        setShowFilterMenu(false);
      }

      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(event.target)
      ) {
        setShowMobileDropdown(false);
      }

      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target)
      ) {
        // Add a small delay to prevent interference with button clicks
        setTimeout(() => {
          setShowActionMenu(false);
        }, 150);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleTouchOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleTouchOutside);
    };
  }, [filterMenuRef, mobileDropdownRef, actionMenuRef]);

  // Helper function to get date-only string from UTC date
  const getDateOnly = (dateString) => {
    if (!dateString) return null;

    // Handle different date formats
    try {
      // If it's already in YYYY-MM-DD format
      if (dateString.includes("T")) {
        const result = dateString.split("T")[0];
        return result;
      }

      // If it's in MM/DD/YY or MM/DD/YYYY format, convert to YYYY-MM-DD
      if (dateString.includes("/")) {
        const parts = dateString.split("/");
        if (parts.length === 3) {
          let [month, day, year] = parts;

          // Handle 2-digit years
          if (year.length === 2) {
            year = "20" + year;
          }

          // Pad month and day with leading zeros
          month = month.padStart(2, "0");
          day = day.padStart(2, "0");

          const result = `${year}-${month}-${day}`;
          return result;
        }
      }

      // For other formats, try to extract just the date part if it's a valid date string
      if (dateString.match(/^\d{4}-\d{2}-\d{2}/)) {
        return dateString.split("T")[0];
      }

      return null;
    } catch (error) {
      console.warn("Error parsing date:", dateString, error);
      return null;
    }
  };

  // Helper function to get status priority for sorting
  const getStatusPriority = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    const statusIndex = STATUS_OPTIONS.findIndex(
      (option) => option.id === statusLower
    );
    const priority = statusIndex === -1 ? STATUS_OPTIONS.length : statusIndex;
    return priority;
  };

  // Helper function to parse time string to minutes for comparison
  const parseTimeToMinutes = (timeString) => {
    if (!timeString) return 0;
    try {
      // Handle different time formats
      const timeStr = timeString.toString().trim();

      // Handle HH:MM format
      if (timeStr.includes(":")) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const result = (hours || 0) * 60 + (minutes || 0);
        return result;
      }

      // Handle HHMM format
      if (timeStr.length === 4 && !isNaN(timeStr)) {
        const hours = parseInt(timeStr.substring(0, 2));
        const minutes = parseInt(timeStr.substring(2, 4));
        const result = hours * 60 + minutes;
        return result;
      }

      return 0;
    } catch (error) {
      console.warn("Error parsing time:", timeString, error);
      return 0;
    }
  };

  // Filter the currently shown resources based on user resource search input
  const filteredCollectionResources = useMemo(() => {
    const getSortableDateTime = (dateString, timeString) => {
      const normalizedDate = getDateOnly(dateString);
      if (!normalizedDate) {
        return null;
      }

      const timeMinutes = parseTimeToMinutes(timeString);
      const hours = Math.floor(timeMinutes / 60)
        .toString()
        .padStart(2, "0");
      const minutes = (timeMinutes % 60).toString().padStart(2, "0");

      return `${normalizedDate}T${hours}:${minutes}:00`;
    };

    return resources
      .filter((resource) => {
        // Normalize the resource status to match the filter keys
        const resourceStatus = resource.status?.toLowerCase() || "pending";

        // Check if the status is enabled in the filter
        if (!statusFilter[resourceStatus]) {
          return false;
        }

        const searchLower = resourceSearchTerm.toLowerCase();
        const matchesSearch =
          resource.name.toLowerCase().includes(searchLower) ||
          (resource.description &&
            resource.description.toLowerCase().includes(searchLower));

        // Tag filtering - check if resource has any of the selected tags
        const matchesTags =
          selectedTags.length === 0 ||
          (resource.tags &&
            resource.tags.length > 0 &&
            selectedTags.some((selectedTag) =>
              resource.tags.some((tag) => tag.id === selectedTag.id)
            ));

        return matchesSearch && matchesTags;
      })
      .sort((a, b) => {
        // Get sortable datetime for both items
        const dateTimeA =
          getSortableDateTime(a.date, a.startTime) ||
          getSortableDateTime(a.dateAdded, a.startTime);
        const dateTimeB =
          getSortableDateTime(b.date, b.startTime) ||
          getSortableDateTime(b.dateAdded, b.startTime);

        // If both have datetime, sort by datetime first
        if (dateTimeA && dateTimeB) {
          const dateComparison = String(dateTimeA || "").localeCompare(
            String(dateTimeB || "")
          );
          if (dateComparison !== 0) {
            return dateComparison;
          }
          // If dates are the same, then sort by status priority
          const statusPriorityA = getStatusPriority(a.status);
          const statusPriorityB = getStatusPriority(b.status);
          return statusPriorityA - statusPriorityB;
        }

        // If only one has datetime, put the one with datetime first
        if (dateTimeA) return -1;
        if (dateTimeB) return 1;

        // If neither has datetime, sort by status first, then by name
        const statusPriorityA = getStatusPriority(a.status);
        const statusPriorityB = getStatusPriority(b.status);
        if (statusPriorityA !== statusPriorityB) {
          return statusPriorityA - statusPriorityB;
        }

        // Finally, fall back to name comparison
        return String(a.name || "").localeCompare(String(b.name || "")) || 0;
      });
  }, [resources, statusFilter, resourceSearchTerm, selectedTags]);

  // For external collections the add resources modal will show all available resources
  const filteredResources = availableResources.filter((resource) => {
    // Check if resource matches search term in name or description
    const matchesSearch =
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resource.description &&
        resource.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
      (resource.notes &&
        resource.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    // For external links, we might not have resource types, so skip that check
    if (collection.type === "external") {
      return matchesSearch;
    }

    // Check if resource matches selected types
    const matchesType =
      selectedResourceTypes.length === 0 ||
      selectedResourceTypes.some(
        (selectedType) =>
          resource.resourceTypeId === selectedType.id ||
          resource.resourceType?.name === selectedType.name
      );

    return matchesSearch && matchesType;
  });

  // Add this helper function to check for video URLs
  const isVideoUrl = (url) => {
    return Boolean(
      url?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/) ||
        url?.includes("zoom.us")
    );
  };

  // Add this helper function to get all videos from external links
  const getAllVideos = useMemo(() => {
    if (!collection) return [];

    // Get videos from external links
    const externalLinkVideos = (collection.externalLinks || [])
      .filter((link) => isVideoUrl(link.url))
      .map((link) => ({
        id: link.id,
        name: link.name,
        description: link.description,
        videoUrl: link.videoUrl || link.url,
        timestamps: link.timestamps || [],
        type: "external_link",
      }));

    // Get video attachments from external links
    const videoAttachments = (collection.externalLinks || []).reduce(
      (acc, link) => {
        if (link.attachments) {
          const linkVideoAttachments = link.attachments
            .filter(
              (attachment) =>
                attachment.type === "video" ||
                (attachment.presignedUrl &&
                  (attachment.presignedUrl.endsWith(".mp4") ||
                    attachment.presignedUrl.endsWith(".mov") ||
                    attachment.presignedUrl.endsWith(".avi") ||
                    attachment.presignedUrl.endsWith(".webm") ||
                    attachment.presignedUrl.endsWith(".mpeg")))
            )
            .map((attachment) => ({
              id: `attachment-${attachment.id}`,
              name:
                attachment.name || attachment.fileName || "Video Attachment",
              description: attachment.description || `Video from ${link.name}`,
              videoUrl: attachment.presignedUrl,
              timestamps: [],
              type: "attachment",
              parentLinkId: link.id,
              parentLinkName: link.name,
            }));
          return [...acc, ...linkVideoAttachments];
        }
        return acc;
      },
      []
    );

    // Get videos from link groups
    const linkGroupVideos = (linkGroups?.video || []).map((video) => ({
      id: `linkgroup-${video.id}`,
      name: video.name || video.title || "Link Group Video",
      description: video.description || video.notes || "",
      videoUrl: video.url || video.videoUrl,
      timestamps: video.timestamps || [],
      type: "link_group",
      linkGroupId: video.id,
    }));

    // Get videos from resources
    const resourceVideos = (collection.resources || [])
      .filter((resource) => isVideoUrl(resource.url))
      .map((resource) => ({
        ...resource,
        id: resource.id,
        name: resource.name,
        description: resource.description,
        videoUrl: resource.videoUrl || resource.url,
        type: "resource",
      }));

    // Combine all arrays
    return [
      ...externalLinkVideos,
      ...videoAttachments,
      ...linkGroupVideos,
      ...resourceVideos,
    ];
  }, [collection, linkGroups]);

  // Extract hashtags from the collection (either external links or resources)
  const getAllHashtags = useMemo(() => {
    if (!collection) return [];

    let allHashtags = [];

    // Check if collection has a hashtags array directly
    if (
      collection.hashtags &&
      Array.isArray(collection.hashtags) &&
      collection.hashtags.length > 0
    ) {
      // Process hashtags from the collection object
      allHashtags = collection.hashtags.map((tag) =>
        typeof tag === "string" ? tag : tag.toString()
      );
    } else {
      // Fallback to extracting from external links and resources
      // Extract hashtags from external links
      if (collection.externalLinks && collection.externalLinks.length > 0) {
        collection.externalLinks.forEach((link) => {
          if (link.hashtags) {
            // Handle comma-separated hashtag strings
            const linkTags =
              typeof link.hashtags === "string"
                ? link.hashtags.split(",").map((tag) => tag.trim())
                : Array.isArray(link.hashtags)
                ? link.hashtags
                : [];
            allHashtags = [...allHashtags, ...linkTags];
          }
        });
      }

      // Extract hashtags from resources
      if (collection.resources && collection.resources.length > 0) {
        collection.resources.forEach((resource) => {
          if (resource.hashtags) {
            // Handle comma-separated hashtag strings
            const resourceTags =
              typeof resource.hashtags === "string"
                ? resource.hashtags.split(",").map((tag) => tag.trim())
                : Array.isArray(resource.hashtags)
                ? resource.hashtags
                : [];
            allHashtags = [...allHashtags, ...resourceTags];
          }
        });
      }
    }

    // If no hashtags found, use collection name as fallback
    return allHashtags.length > 0
      ? Array.from(new Set(allHashtags)) // Remove duplicates
      : collection.name
      ? [collection.name.replace(/\s+/g, "")]
      : [];
  }, [collection]);

  // Function to navigate to hashtags page
  const handleHashtagClick = () => {
    const formattedHashtags = getAllHashtags.map((tag) =>
      tag.startsWith("#") ? tag.substring(1) : tag
    );

    router.push(
      `/social-media/hashtags?hashtags=${encodeURIComponent(
        formattedHashtags.join(",")
      )}`
    );
  };

  // Function to navigate to PubMed search page
  const handlePubMedClick = () => {
    const formattedHashtags = getAllHashtags.map((tag) =>
      tag.startsWith("#") ? tag.substring(1) : tag
    );

    router.push(
      `/pubmed?keywords=${encodeURIComponent(
        formattedHashtags.join(" OR ")
      )}`
    );
  };

  // Add YouTube ID extraction helper function
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Collection Chat state
  const [showCollectionChat, setShowCollectionChat] = useState(false);
  const [pinnedItems, setPinnedItems] = useState([]);

  // Pin items hook
  const pinItemsMutation = usePinItems();

  // Update pinned items when data changes
  useEffect(() => {
    if (pinItemsMutation?.data) {
      setPinnedItems(pinItemsMutation.data);
    }
  }, [pinItemsMutation?.data]);

  const clearResourceFilters = () => {
    setResourceSearchTerm("");
    setSelectedResourceTypes([]);
    setSelectedTags([]);
  };

  // Check if any tag filters are currently active
  const hasActiveResourceFilters =
    resourceSearchTerm ||
    selectedResourceTypes.length > 0 ||
    selectedTags.length > 0;

  // Helper functions for tag filtering
  const getTagCount = (tagId) => {
    if (collection?.type === "external") {
      // Count external links that have this tag
      const externalLinkCount = (collection.externalLinks || []).filter(
        (link) => link.tags?.some((tag) => tag.id === tagId)
      ).length;

      // Count notations that have this tag
      const notationCount = (collection.externalLinks || []).reduce(
        (count, link) => {
          const notationsWithTag = (link.notations || []).filter((notation) =>
            notation.tags?.some((tag) => tag.id === tagId)
          ).length;
          return count + notationsWithTag;
        },
        0
      );

      return externalLinkCount + notationCount;
    } else {
      // Original logic for non-external collections
      return resources.filter((resource) =>
        resource.tags?.some((tag) => tag.id === tagId)
      ).length;
    }
  };

  const handleClearTagFilters = () => {
    setSelectedTags([]);
  };

  // Handler functions for calendar tag highlighting
  const handleCalendarTagClick = (tag) => {
    setHighlightedCalendarTags((prev) => {
      const isAlreadyHighlighted = prev.some((t) => t.id === tag.id);
      let newTags;
      if (isAlreadyHighlighted) {
        // Remove tag from highlighted list
        newTags = prev.filter((t) => t.id !== tag.id);
      } else {
        // Add tag to highlighted list
        newTags = [...prev, tag];
      }
      // Save to localStorage
      if (typeof window !== "undefined" && id) {
        localStorage.setItem(
          `collection-calendar-tags-${id}`,
          JSON.stringify(newTags)
        );
      }
      return newTags;
    });
  };

  const handleClearCalendarTagHighlights = () => {
    setHighlightedCalendarTags([]);
    // Clear from localStorage
    if (typeof window !== "undefined" && id) {
      localStorage.removeItem(`collection-calendar-tags-${id}`);
    }
  };

  // Handler for tag filter mode change that persists to localStorage
  const handleTagFilterModeChange = (mode) => {
    setTagFilterMode(mode);
    // Save to localStorage
    if (typeof window !== "undefined" && id) {
      localStorage.setItem(`collection-tag-filter-mode-${id}`, mode);
    }
  };

  if (collectionLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6 mt-20 opacity-50">
        {/* Left column */}
        <LoadingSkeleton
          lines={5}
          height="32px"
          width={[70, 65, 70, 65]}
          spacing="1.5rem"
        />

        {/* Right column */}
        <LoadingSkeleton
          lines={5}
          height="32px"
          width={[70, 65, 70, 65]}
          spacing="1.5rem"
        />
      </div>
    );
  }

  if (!collection) {
    return <div></div>;
  }

  const addResourceToCollection = async (collectionId, resource) => {
    try {
      await addResourceToCollectionMutation({
        collectionId,
        resourceId: resource.id,
        note: resourceNotes[resource.id] || null,
      });
      setAddedResourceIds((prev) => new Set([...prev, resource.id]));
      setAvailableResources((prev) => prev.filter((r) => r.id !== resource.id));
      refreshCollection();
    } catch (error) {
      console.error("Failed to add resource to collection:", error);
      toast.error("Failed to add resource to collection");
    }
  };

  const closeAddResourcesModal = () => {
    setShowAddResources(false);
    setSelectedExternalLink(null);
    setSearchTerm("");
  };

  const handleAddResourcesClick = () => {
    setShowAddResources(true);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleUpdateCollection = async (formData) => {
    try {
      await updateCollectionResourceMutation({
        collectionId,
        collection: {
          id: collectionId,
          ...formData,
        },
      });

      refreshCollection();
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update collection:", error);
    }
  };

  const handleSaveCollectionWhiteboard = async (whiteboardData) => {
    const headers = await getAuthHeader();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/collections/${collectionId}`,
      {
        method: "PATCH",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          whiteboardData,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to save collection whiteboard");
    }

    const updatedCollection = await response.json();

    queryClient.setQueryData(
      ["collections", collectionId, undefined],
      (currentCollection) => ({
        ...(currentCollection || updatedCollection),
        whiteboardData,
      })
    );

    return updatedCollection;
  };

  const handleNoteChange = (resourceId, note) => {
    setResourceNotes({
      ...resourceNotes,
      [resourceId]: note,
    });
  };

  const stripHtml = (html) => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || "";
  };

  const copyToClipboard = async (content, type = "notes") => {
    try {
      let textToCopy;
      if (type === "notes") {
        textToCopy = stripHtml(content);
      } else if (type === "link") {
        textToCopy = content.url;
      } else if (type === "both") {
        const cleanNotes = stripHtml(content.notes);
        textToCopy = `${content.url}\n\nNotes:\n${cleanNotes}`;
      }

      await navigator.clipboard.writeText(textToCopy);
      setShowCopyDropdown(null); // Close dropdown after copying
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleViewAllResources = (category, resourcesGroup) => {
    setModalSearchTerm("");
    setModalViewAllMode("grid");
    setViewAllModal({ isOpen: true, resources: resourcesGroup });
  };

  // New function to handle submission of an external link
  const handleAddExternalLink = (formData) => {
    const transformedData = {
      ...formData,
      date: formData.startDate || formData.date || null,
      startDate: formData.startDate || formData.date || null,
      endDate:
        formData.endDate || formData.startDate || formData.date || null,
    };

    addExternalLinkMutation(
      { collectionId, linkData: transformedData },
      {
        onSuccess: () => {
          refreshCollection();
          closeAddResourcesModal();
        },
        onError: (error) =>
          console.error("Failed to add external link:", error),
      }
    );
  };

  const handleUpdateExternalLink = (externalLinkId, formData) => {
    const transformedData = {
      ...formData,
      date: formData.startDate || formData.date || null,
      startDate: formData.startDate || formData.date || null,
      endDate:
        formData.endDate || formData.startDate || formData.date || null,
    };

    updateExternalLinkMutation(
      { collectionId, externalLinkId, linkData: transformedData },
      {
        onSuccess: () => {
          refreshCollection();
          closeAddResourcesModal(); // Close the modal after successful update
        },
        onError: (error) =>
          console.error("Failed to update external link:", error),
      }
    );
    setIsEditing(false);
  };

  const handleUpdateWorkflowStepDates = async (updates) => {
    for (const update of updates) {
      const step = update.step;
      await updateExternalLinkMutationAsync({
        collectionId,
        externalLinkId: step.id,
        linkData: {
          ...step,
          date: update.startDate,
          startDate: update.startDate,
          endDate: update.endDate || update.startDate,
          workflowMetadata: step.workflowMetadata || {},
        },
      });
    }

    await refreshCollection();
  };

  // Handle single field updates (for auto-save functionality)
  const handleUpdateSingleField = async (externalLinkId, fieldData) => {
    return new Promise((resolve, reject) => {
      const transformedData = {
        ...selectedExternalLink,
        ...fieldData,
        date:
          fieldData.startDate ||
          fieldData.date ||
          selectedExternalLink?.startDate ||
          selectedExternalLink?.date ||
          null,
        startDate:
          fieldData.startDate ||
          fieldData.date ||
          selectedExternalLink?.startDate ||
          selectedExternalLink?.date ||
          null,
        endDate:
          fieldData.endDate ||
          fieldData.startDate ||
          fieldData.date ||
          selectedExternalLink?.endDate ||
          selectedExternalLink?.startDate ||
          selectedExternalLink?.date ||
          null,
      };

      updateExternalLinkMutation(
        { collectionId, externalLinkId, linkData: transformedData },
        {
          onSuccess: () => {
            refreshCollection();
            resolve();
          },
          onError: (error) => {
            console.error("Failed to update field:", error);
            reject(error);
          },
        }
      );
    });
  };

  const handleRevokeLink = (linkId) => {
    if (window.confirm("Are you sure you want to revoke this shared link?")) {
      revokeLink(linkId);
    }
  };

  const handleExportClick = () => {
    setShowExportDropdown(false);
    setShowExportModal(true);
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    localStorage.removeItem(`chat-history-collection-${id}`);
  };

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
  };

  // Modify the calendar button click handler
  const handleCalendarClick = () => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    if (isMobile) {
      // On mobile: show the full calendar view and force scroll to it
      setShowCalendarView(true);
      setShowCalendarHover(true);

      // Ensure the calendar is rendered, then scroll to it
      setTimeout(() => {
        fullCalendarRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } else {
      // On desktop: toggle the full calendar view and scroll to it
      setShowCalendarView(!showCalendarView);

      // On desktop, also toggle the hover card visibility
      setShowCalendarHover(!showCalendarHover);

      // If we're showing the calendar view, scroll to it
      if (!showCalendarView) {
        setTimeout(() => {
          fullCalendarRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    }
  };

  // Add these handlers for mouse events on desktop
  const handleCalendarMouseOver = () => {
    // Only show hover on desktop mouse over
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      //temp disable calendar hover
      setShowCalendarHover(false);
    }
  };

  const handleCalendarMouseOut = () => {
    // No longer auto-hide on mouse out - we'll rely on explicit closing
    // This allows users to interact with the calendar hover
  };

  // Add a specific handler to prevent closing the calendar
  const preventCalendarClose = (e) => {
    // Stop propagation to parent elements
    if (e) {
      e.stopPropagation();
      // Only prevent default if it's not an interactive element
      // This allows buttons and links to work properly
      const target = e.target;
      const isInteractive =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.tagName === "INPUT" ||
        target.closest("button") ||
        target.closest("a") ||
        target.closest("input");

      if (!isInteractive) {
        e.preventDefault();
      }

      // Set the interaction state to true so outside clicks don't close it
      setIsInteractingWithCalendarHover(true);
    }
    return false;
  };

  const getStatusCount = (status) => {
    return resources.filter(
      (resource) => (resource.status?.toLowerCase() || "pending") === status
    ).length;
  };

  return (
    <div className="w-full md:w-11/12 mx-auto p-2 md:p-8 mb-20">
      <ChatHistory
        history={chatHistory}
        onClear={clearChatHistory}
        data={chatData}
      />
      <div className="flex justify-between items-center mt-4">
        {/* Back Button */}
        <button
          onClick={() => router.push("/collections")}
          className="mb-4 text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-2"
        >
          ← Back to Collection
        </button>
        <div className="flex flex-wrap gap-2 justify-end">
          {/* Mobile actions dropdown */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setShowActionMenu(!showActionMenu)}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowActionMenu(!showActionMenu);
              }}
              className="flex items-center justify-center w-10 h-10 bg-white/80 rounded-md mb-4 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow text-gray-500 touch-manipulation"
              ref={actionMenuRef}
            >
              <FaEllipsisV />
            </button>

            {showActionMenu && (
              <div
                className="absolute right-0 top-full mt-1 z-[70] bg-white rounded-lg shadow-xl p-2 border border-gray-200 w-48 max-w-[90vw] mobile-dropdown"
                onTouchStart={(e) => e.stopPropagation()}
                onTouchEnd={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Export */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTimeout(() => {
                      setShowExportModal(true);
                      setShowActionMenu(false);
                    }, 100);
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTimeout(() => {
                      setShowExportModal(true);
                      setShowActionMenu(false);
                    }, 100);
                  }}
                  className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700 touch-manipulation"
                >
                  <FaDownload className="text-gray-500" />
                  <span>Export</span>
                </button>

                {/* JSON API - Admin only */}
                {isAdmin && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTimeout(() => {
                        setShowPublicJsonModal(!showPublicJsonModal);
                        setShowActionMenu(false);
                      }, 100);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTimeout(() => {
                        setShowPublicJsonModal(!showPublicJsonModal);
                        setShowActionMenu(false);
                      }, 100);
                    }}
                    className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700 touch-manipulation"
                  >
                    <FaDatabase className="text-gray-500" />
                    <span>JSON API</span>
                  </button>
                )}

                {/* Edit Collection */}
                {(isAdmin ||
                  (isAdvocate && collection.visibility === "private") ||
                  isCollectionOwner) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTimeout(() => {
                        handleEditClick();
                        setShowActionMenu(false);
                      }, 100);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTimeout(() => {
                        handleEditClick();
                        setShowActionMenu(false);
                      }, 100);
                    }}
                    className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700 touch-manipulation"
                  >
                    <FaEdit className="text-gray-500" />
                    <span>Edit Collection</span>
                  </button>
                )}

                {/* Merge Collections */}
                {(isAdmin ||
                  (isAdvocate && collection.visibility === "private") ||
                  isCollectionOwner) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTimeout(() => {
                        setShowMergeModal(true);
                        setShowActionMenu(false);
                      }, 100);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTimeout(() => {
                        setShowMergeModal(true);
                        setShowActionMenu(false);
                      }, 100);
                    }}
                    className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700 touch-manipulation"
                  >
                    <FaCodeBranch className="text-gray-500" />
                    <span>Merge Collections</span>
                  </button>
                )}

                <div className="my-2 border-t border-gray-200"></div>

                {/* Share button */}
                {((collection?.visibility === "public" &&
                  collection?.type !== "external") ||
                  (collection?.visibility === "unlisted" &&
                    collection?.type !== "external") ||
                  (collection?.visibility === "unlisted" &&
                    collection?.type === "external" &&
                    (isAdmin || isAdvocate)) ||
                  (collection?.visibility === "public" &&
                    collection?.type === "external" &&
                    (isAdmin || isAdvocate))) && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTimeout(() => {
                        setShowShareModal(true);
                        setShowActionMenu(false);
                      }, 100);
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setTimeout(() => {
                        setShowShareModal(true);
                        setShowActionMenu(false);
                      }, 100);
                    }}
                    className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700 touch-manipulation"
                  >
                    <FaShare className="text-gray-500" />
                    <span>Share</span>
                  </button>
                )}

                {/* Collaborators button */}
                {collection?.visibility !== "private" &&
                  (isAdmin || isCollectionOwner) && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTimeout(() => {
                          setShowCollaboratorModal(true);
                          setShowActionMenu(false);
                        }, 100);
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setTimeout(() => {
                          setShowCollaboratorModal(true);
                          setShowActionMenu(false);
                        }, 100);
                      }}
                      className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700 touch-manipulation"
                    >
                      <FaUserPlus className="text-gray-500" />
                      <span>Collaborators</span>
                      {collaborators && collaborators.length > 0 && (
                        <span className="ml-auto text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                          {collaborators.length}
                        </span>
                      )}
                    </button>
                  )}
              </div>
            )}
          </div>

          {/* Desktop action buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Share button - standalone */}
            {((collection?.visibility === "public" &&
              collection?.type !== "external") ||
              (collection?.visibility === "unlisted" &&
                collection?.type !== "external") ||
              (collection?.visibility === "unlisted" &&
                collection?.type === "external" &&
                (isAdmin || isAdvocate)) ||
              (collection?.visibility === "public" &&
                collection?.type === "external" &&
                (isAdmin || isAdvocate))) && (
              <button
                onClick={() => setShowShareModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-md mb-4 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200 text-gray-700 hover:text-gray-900"
              >
                <FaShare className="text-[15px] text-gray-500" />
                Share
              </button>
            )}

            {/* Collaborators button - standalone */}
            {collection?.visibility !== "private" &&
              (isAdmin || isCollectionOwner) && (
                <button
                  onClick={() => setShowCollaboratorModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-md mb-4 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200 text-gray-700 hover:text-gray-900"
                >
                  <FaUserPlus className="text-[15px] text-gray-500" />
                  Collaborators
                  {collaborators && collaborators.length > 0 && (
                    <span className="ml-1 text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                      {collaborators.length}
                    </span>
                  )}
                </button>
              )}

            {/* Actions dropdown menu */}
            {(isAdmin ||
              (isAdvocate && collection.visibility === "private") ||
              isCollectionOwner) && (
              <div className="relative">
                <button
                  onClick={() => setShowActionMenu(!showActionMenu)}
                  className="flex items-center gap-2 px-3 py-2 bg-white/80 rounded-md mb-4 border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow transition-all duration-200 text-gray-700 hover:text-gray-900"
                  ref={actionMenuRef}
                >
                  <FaCog className="text-[15px] text-gray-500" />
                  Actions
                  <FaChevronDown className="text-xs text-gray-400" />
                </button>

                {showActionMenu && (
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-lg shadow-xl p-2 border border-gray-200 w-48">
                    <button
                      onClick={() => {
                        setShowExportModal(true);
                        setShowActionMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700"
                    >
                      <FaDownload className="text-gray-500" />
                      Export
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => {
                          setShowPublicJsonModal(!showPublicJsonModal);
                          setShowActionMenu(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700"
                      >
                        <FaDatabase className="text-gray-500" />
                        JSON API
                      </button>
                    )}
                    <button
                      onClick={() => {
                        handleEditClick();
                        setShowActionMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700"
                    >
                      <FaEdit className="text-gray-500" />
                      Edit Collection
                    </button>
                    <button
                      onClick={() => {
                        setShowMergeModal(true);
                        setShowActionMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700"
                    >
                      <FaCodeBranch className="text-gray-500" />
                      Merge Collections
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {
        <div className="rounded-lg border border-slate-300 shadow-[0_0_50px_rgba(59,130,246,0.2)]  text-slate-600">
          {/* Header Section */}
          <div className="bg-slate-100 border border-slate-200 text-slate-800 rounded-t-lg p-8 pb-2">
            <div className="flex flex-col gap-4 xl:flex-row md:items-center md:justify-between">
              {/* Title and description */}
              <div>
                {/* Collection Type and Visibility Badges */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {/* Visibility Badge */}
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-100`}
                  >
                    {collection.visibility === "public" ? (
                      <>
                        <FaGlobe className="mr-2 h-3.5 w-3.5" />
                        Public
                      </>
                    ) : collection.visibility === "private" ? (
                      <>
                        <FaLock className="mr-2 h-3.5 w-3.5" />
                        Private
                      </>
                    ) : (
                      <span className="capitalize flex items-center">
                        <FaLink className="mr-2 h-3.5 w-3.5" />
                        {collection.visibility}
                      </span>
                    )}
                  </span>
                  {/* Collection Type Badge */}
                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-100                        
                    }`}
                  >
                    {collection.type === "external" ? (
                      <>External</>
                    ) : (
                      <>
                        <FaDatabase className="mr-2 h-3.5 w-3.5" />
                        Resource
                      </>
                    )}
                  </span>

                  {/* Item Count Badge */}
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-700 border border-gray-100">
                    {collection.type === "external"
                      ? `${collection.externalLinks?.length || 0} ${
                          (collection.externalLinks?.length || 0) === 1
                            ? "link"
                            : "links"
                        }`
                      : `${collection.resources?.length || 0} ${
                          (collection.resources?.length || 0) === 1
                            ? "resource"
                            : "resources"
                        }`}
                  </span>
                </div>

                <h1 className="text-3xl font-bold text-slate-800">
                  {collection.name}
                </h1>
                <div className="text-slate-600 mt-2 max-h-[6em] overflow-y-auto">
                  <CustomEditor
                    content={collection.description}
                    readOnly={true}
                    transparent={true}
                    textColor="text-slate-700"
                    scrollable={true}
                    compact={true}
                  />
                </div>

                {/* Inline Collaborators Display */}
                {(isAdmin || collection?.user_id === systemUser?.id) &&
                  collection?.visibility !== "private" && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FaUsers className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Collaborators
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {collaborators?.length || 0}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {collaborators && collaborators.length > 0 ? (
                          <>
                            {collaborators.map((collaborator) => (
                              <div
                                key={collaborator.id}
                                className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200"
                              >
                                <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium mr-1.5">
                                  {collaborator.name?.charAt(0) ||
                                    collaborator.email?.charAt(0) ||
                                    "?"}
                                </div>
                                <span>
                                  {collaborator.name || collaborator.email}
                                </span>
                                {collaborator.role && (
                                  <span className="ml-1 opacity-75">
                                    ({collaborator.role})
                                  </span>
                                )}
                                {collaborator.role !== "owner" &&
                                  (isAdmin ||
                                    collection?.user_id === systemUser?.id) && (
                                    <button
                                      onClick={() => {
                                        if (
                                          confirm(
                                            `Remove ${collaborator.email} from this collection?`
                                          )
                                        ) {
                                          removeCollaborator(
                                            {
                                              collectionId: id,
                                              collaboratorId: collaborator.id,
                                            },
                                            {
                                              onSuccess: () => {
                                                toast.success(
                                                  "Collaborator removed successfully"
                                                );
                                                refreshCollection();
                                              },
                                              onError: () => {
                                                toast.error(
                                                  "Failed to remove collaborator"
                                                );
                                              },
                                            }
                                          );
                                        }
                                      }}
                                      className="ml-1.5 text-indigo-600 hover:text-indigo-800"
                                    >
                                      <FaTimes className="h-3 w-3" />
                                    </button>
                                  )}
                              </div>
                            ))}
                            <button
                              onClick={() => setShowCollaboratorModal(true)}
                              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                            >
                              <FaUserPlus className="mr-1.5 h-3 w-3" />
                              Invite
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setShowCollaboratorModal(true)}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
                          >
                            <FaUserPlus className="mr-1.5 h-3 w-3" />
                            Invite Collaborator
                          </button>
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Mobile bottom action buttons - visible below title on small screens */}
              <div className="w-full flex flex-wrap gap-2 mt-3 md:hidden ">
                <div className="hidden md:block">
                  <button
                    onClick={() => {
                      setShowMobileDropdown(false);
                      setShowCalendarHover(true);
                      handleCalendarClick();
                    }}
                    className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700"
                  >
                    <FaCalendar />
                    <span>Calendar</span>
                  </button>

                  {collection.type === "external" && (
                    <>
                      {/* <button
                        onClick={handleHashtagClick}
                        className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-slate-600 hover:text-slate-700 hover:bg-slate-100 text-sm "
                      >
                        <FaHashtag className="text-[12px]" />
                        <span>Hashtags</span>
                        {getAllHashtags.length > 0 && (
                          <span className="text-xs">
                            ({getAllHashtags.length})
                          </span>
                        )}
                      </button> */}

                      <button
                        onClick={handlePubMedClick}
                        className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-slate-600 hover:text-slate-700 hover:bg-slate-100 text-sm border"
                      >
                        <FaFlask className="text-[12px]" />
                        <span>PubMed</span>
                      </button>

                      <button
                        onClick={() =>
                          router.push(
                            `/clinical-trials?hashtags=${encodeURIComponent(
                              getAllHashtags.join(",")
                            )}`
                          )
                        }
                        className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-slate-600 hover:text-slate-700 hover:bg-slate-100 text-sm border border-slate-200"
                      >
                        <FaFlask className="text-[12px]" />
                        <span>Trials</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setShowAttachmentsModal(true)}
                    className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-slate-600 hover:text-slate-700 hover:bg-slate-100 text-sm border border-slate-200"
                  >
                    <FaPaperclip className="text-[12px]" />
                    <span>Files</span>
                    {getAllAttachments.length > 0 && (
                      <span className="text-xs">
                        ({getAllAttachments.length})
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setShowVideoBrowser(true)}
                    className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-slate-600 hover:text-slate-700 hover:bg-slate-100 text-sm border border-slate-200"
                  >
                    <FaVideo className="text-[12px]" />
                    <span>Videos</span>
                    {getAllVideos.length > 0 && (
                      <span className="text-xs">({getAllVideos.length})</span>
                    )}
                  </button>
                </div>
              </div>

              {/* Action buttons - full width on mobile, aligned right on desktop */}
              <div className="flex flex-wrap items-center gap-2 justify-end order-first md:order-last">
                <div className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-sm border border-slate-200 hidden md:block">
                  {collection.visibility === "public" ? (
                    <div className="flex items-center gap-2">Public</div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FaLock className="text-[10px]" />
                      Private
                    </div>
                  )}
                </div>

                <CollectionViewPicker
                  viewMode={viewMode}
                  onChange={setViewMode}
                />

                {/* Mobile dropdown menu */}
                <div className="relative md:hidden" ref={mobileDropdownRef}>
                  <button
                    onClick={() => {
                      setShowMobileDropdown(!showMobileDropdown);
                    }}
                    className="flex items-center justify-center w-10 h-10 bg-slate-50 rounded-md text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <FaCog />
                  </button>
                  {showMobileDropdown && (
                    <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-lg shadow-lg p-2 border border-gray-200 w-48">
                      <button
                        onClick={() => {
                          setShowMobileDropdown(false);
                          setShowCalendarView(true);
                          // Use the custom event to ensure consistent behavior
                          window.dispatchEvent(
                            new CustomEvent("scrollToFullCalendar")
                          );
                        }}
                        className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700"
                      >
                        <FaCalendar />
                        <span>Calendar</span>
                      </button>

                      {collection.type === "external" && (
                        <>
                          {/* <button
                            onClick={() => {
                              handleHashtagClick();
                              setShowMobileDropdown(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700"
                          >
                            <FaHashtag />
                            <span>
                              Hashtags{" "}
                              {getAllHashtags.length > 0 &&
                                `(${getAllHashtags.length})`}
                            </span>
                          </button> */}

                          <button
                            onClick={() => {
                              handlePubMedClick();
                              setShowMobileDropdown(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700"
                          >
                            <FaFlask />
                            <span>PubMed</span>
                          </button>

                          <button
                            onClick={() => {
                              router.push(
                                `/clinical-trials?hashtags=${encodeURIComponent(
                                  getAllHashtags.join(",")
                                )}`
                              );
                              setShowMobileDropdown(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700"
                          >
                            <FaFlask />
                            <span>Trials</span>
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setShowSocialMediaModal(true);
                          setShowMobileDropdown(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700"
                      >
                        <FaGlobe />
                        <span>
                          Social Media{" "}
                          {socialMediaActionCount > 0 &&
                            `(${socialMediaActionCount})`}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setShowAttachmentsModal(true);
                          setShowMobileDropdown(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700"
                      >
                        <FaPaperclip />
                        <span>
                          Attachments{" "}
                          {getAllAttachments.length > 0 &&
                            `(${getAllAttachments.length})`}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          setShowVideoBrowser(true);
                          setShowMobileDropdown(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 w-full text-left hover:bg-gray-100 rounded-md text-gray-700"
                      >
                        <FaVideo />
                        <span>
                          Videos{" "}
                          {getAllVideos.length > 0 &&
                            `(${getAllVideos.length})`}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Desktop buttons - hidden on mobile */}
                <div className="lg:flex items-center gap-2 hidden md:block">
                  <div className="relative" ref={calendarButtonRef}>
                    <button
                      onClick={handleCalendarClick}
                      onMouseEnter={handleCalendarMouseOver}
                      onMouseLeave={handleCalendarMouseOut}
                      className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full text-slate-600 hover:text-slate-700 hover:bg-slate-100 text-sm"
                    >
                      <FaCalendar />
                    </button>

                    {showCalendarHover && (
                      <div
                        className="fixed sm:absolute inset-x-0 sm:inset-x-auto sm:right-0 sm:left-auto top-[calc(100%+0.5rem)] sm:top-full mt-0 sm:mt-2 z-50 calendar-hover-card flex justify-center sm:justify-end w-full sm:w-auto px-4 sm:px-0 calendar-container"
                        onClick={preventCalendarClose}
                        onTouchEnd={preventCalendarClose}
                        onTouchStart={preventCalendarClose}
                        onMouseDown={preventCalendarClose}
                        onMouseEnter={() => {
                          //temp disable calendar hover
                          setIsInteractingWithCalendarHover(false);
                        }}
                        onMouseLeave={() => {
                          setIsInteractingWithCalendarHover(false);
                        }}
                      >
                        <div
                          className="w-full max-w-[95vw] sm:max-w-md calendar-hover-card rounded-lg shadow-lg bg-white border border-gray-200"
                          onClick={preventCalendarClose}
                        >
                          <CalendarHoverInfo
                            events={(combinedEvents || []).map((event) => ({
                              ...event,
                              type: event.type || "resource",
                              startDate: event.startDate || event.date,
                              endDate: event.endDate || event.date,
                              title: event.title || event.name || "Untitled",
                              status: event.status || "pending",
                              parentId: event.parentId,
                              notes: event.description || event.notes,
                              // Pass through tag styling
                              tags: event.tags || [],
                              primaryColor: event.primaryColor,
                              tagColors: event.tagColors || [],
                              hasMultipleTags: event.hasMultipleTags,
                              tagCount: event.tagCount || 0,
                              className: event.className,
                              style: {
                                "--primary-color": event.primaryColor,
                                "--secondary-color":
                                  event.tagColors?.[1] || event.primaryColor,
                              },
                            }))}
                            onClose={() => setShowCalendarHover(false)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setShowSocialMediaModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                    title="Manage Social Media"
                  >
                    <FaGlobe />
                    <span className="text-xs">Social</span>
                    {socialMediaActionCount > 0 && (
                      <span className="text-xs ml-1">
                        ({socialMediaActionCount})
                      </span>
                    )}
                  </button>
                  {collection.type === "external" && (
                    <>
                      {/* <button
                        onClick={handleHashtagClick}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                        title="View Collection Hashtags"
                      >
                        <FaHashtag />
                        {getAllHashtags.length > 0 && (
                          <span className="text-xs">
                            {getAllHashtags.length}
                          </span>
                        )}
                      </button> */}
                      <button
                        onClick={handlePubMedClick}
                        className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                        title="Search PubMed Articles"
                      >
                        <FaFlask />
                        <span className="text-xs">PubMed</span>
                      </button>
                      <button
                        onClick={() =>
                          router.push(
                            `/clinical-trials?hashtags=${encodeURIComponent(
                              getAllHashtags.join(",")
                            )}`
                          )
                        }
                        className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md text-slate-600 hover:text-slate-700 hover:bg-slate-100 text-sm"
                        title="Search Clinical Trials"
                      >
                        <FaFlask />
                        <span className="text-xs">Trials</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setShowAttachmentsModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <FaPaperclip />
                    {getAllAttachments.length > 0 && (
                      <span className="text-xs">
                        {getAllAttachments.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setShowVideoBrowser(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-md text-slate-600 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <FaVideo />
                    {getAllVideos.length > 0 && (
                      <span className="text-xs">{getAllVideos.length}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-4">
              {[
                { id: "details", label: "Details", Icon: FaFileAlt },
                { id: "whiteboard", label: "Whiteboard", Icon: FaChalkboard },
                { id: "gantt", label: "Gantt", Icon: FaCalendar },
              ].map(({ id: tabId, label, Icon }) => {
                const isActive = activeHeaderTab === tabId;

                return (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => setActiveHeaderTab(tabId)}
                    className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-blue-300 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                    aria-pressed={isActive}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeHeaderTab === "whiteboard" ? (
            <div className="bg-white p-4 sm:p-6">
              <ExternalLinkWhiteboard
                boardId={`collection-${collectionId}`}
                title={collection.name}
                whiteboardData={collection.whiteboardData}
                canEdit={canEditCollection}
                onSave={handleSaveCollectionWhiteboard}
              />
            </div>
          ) : activeHeaderTab === "gantt" ? (
            <WorkflowGanttChart
              collection={collection}
              canEdit={canEditCollection}
              onUpdateStepDates={handleUpdateWorkflowStepDates}
            />
          ) : (
            <>
              {/* Public JSON Sharing Control - Only for Admins */}
              {isAdmin && showPublicJsonModal && (
                <div className="p-6 border-t border-slate-200">
                  <PublicJsonSharingControl
                    type="collection"
                    id={collectionId}
                    isEnabled={collection?.publicJsonEnabled || false}
                    onToggle={(enabled) => {
                      // Refresh collection data to get updated status
                      refreshCollection();
                    }}
                  />
                </div>
              )}

              {/* Resources List */}
              <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
              <div className="relative flex-grow flex items-center">
                <div className="relative flex-grow">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <InputField
                    type="text"
                    placeholder={`Search ${
                      collection.type === "external"
                        ? "external links"
                        : "collection resources"
                    }...`}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    value={resourceSearchTerm}
                    onChange={(e) => setResourceSearchTerm(e.target.value)}
                  />
                </div>

                {/* Replace the old filter button and menu with this */}
                <div className="relative ml-2" ref={filterMenuRef}>
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className={`p-4 rounded-lg transition-colors flex items-center ${
                      hasActiveResourceFilters || hasActiveTagFilters
                        ? "bg-blue-500/20 text-blue-600"
                        : "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400/80"
                    }`}
                    title="Filter options"
                  >
                    <FaFilter />
                    {(hasActiveResourceFilters || hasActiveTagFilters) && (
                      <span className="ml-1 bg-blue-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                        {Object.values(statusFilter).filter((v) => !v).length +
                          selectedTags.length}
                      </span>
                    )}
                  </button>

                  {/* Desktop filter menu */}
                  {showFilterMenu && (
                    <div className="hidden md:block absolute right-0 top-full mt-2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80">
                      {/* Filter Tabs */}
                      <div className="flex border-b border-gray-200 mb-4">
                        <button
                          onClick={() => setFilterTab("status")}
                          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                            filterTab === "status"
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          Status
                        </button>
                        <button
                          onClick={() => setFilterTab("tags")}
                          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                            filterTab === "tags"
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700"
                          }`}
                        >
                          Tags{" "}
                          {availableTags.length > 0 &&
                            `(${availableTags.length})`}
                        </button>
                      </div>

                      {/* Filter Content */}
                      {filterTab === "status" && (
                        <StatusFilter
                          statusOptions={STATUS_OPTIONS}
                          statusFilter={statusFilter}
                          onStatusFilterChange={setStatusFilter}
                          getStatusCount={getStatusCount}
                          isCollapsible={false}
                          chipClassName="bg-blue-100 text-blue-800"
                          label="Filter by Status"
                        />
                      )}

                      {filterTab === "tags" && (
                        <TagFilter
                          tags={availableTags}
                          selectedTags={selectedTags}
                          onTagsChange={setSelectedTags}
                          onClearFilters={handleClearTagFilters}
                          getTagCount={getTagCount}
                          isCollapsible={false}
                          chipClassName="bg-green-100 text-green-800"
                          label={`Filter by Tags ${
                            availableTags.length > 0
                              ? `(${availableTags.length} available)`
                              : "(No tags available)"
                          }`}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {(isAdmin ||
                  (isAdvocate && collection.visibility === "private") ||
                  isCollectionOwner) &&
                  (collection.type === "external" ? (
                    <div className="relative group" ref={addDropdownRef}>
                      <button
                        onClick={() => setShowAddDropdown(!showAddDropdown)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
                      >
                        <FaPlus />
                        <span>Add Links</span>
                        <FaChevronDown className="h-3 w-3 ml-1" />
                      </button>
                      {showAddDropdown && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                          <button
                            onClick={() => {
                              setShowAddDropdown(false);
                              handleAddResourcesClick();
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-t-lg border-b border-gray-100 transition-colors"
                          >
                            <FaLink className="h-5 w-5 text-blue-600" />
                            <div className="text-left">
                              <div className="font-medium">
                                Add External Link
                              </div>
                              <div className="text-xs text-gray-500">
                                Add a single link manually
                              </div>
                            </div>
                          </button>
                          <div className="px-3 py-2 text-xs text-gray-500 font-medium uppercase tracking-wider">
                            AI Options
                          </div>
                          <button
                            onClick={() => {
                              setShowAddDropdown(false);
                              setIsAIBulkMode(false);
                              setShowAIModal(true);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <FaMagic className="h-5 w-5 text-blue-600" />
                            <div className="text-left">
                              <div className="font-medium">AI Single Link</div>
                              <div className="text-xs text-gray-500">
                                Create one link with AI
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setShowAddDropdown(false);
                              setIsAIBulkMode(true);
                              setShowAIModal(true);
                            }}
                            className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors"
                          >
                            <FaMagic className="h-5 w-5 text-blue-600" />
                            <div className="text-left">
                              <div className="font-medium">AI Bulk Links</div>
                              <div className="text-xs text-gray-500">
                                Create multiple links with AI
                              </div>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={handleAddResourcesClick}
                      className="px-4 py-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40"
                    >
                      <FaPlus className="inline mr-2" />
                      Add Resources
                    </button>
                  ))}
              </div>
            </div>

            <div className="resources-grid">
              {filteredCollectionResources.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <div className="text-gray-400 mb-4">
                    <svg
                      className="mx-auto h-12 w-12"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No {collection.type === "external" ? "links" : "resources"}{" "}
                    found
                  </h3>
                  <p className="text-gray-500">
                    Try adjusting your search or filter criteria.
                  </p>
                </div>
              ) : (
                <ResourcesGrid
                  collection={collection}
                  filteredCollectionResources={filteredCollectionResources}
                  resourceTypes={resourceTypes}
                  flippedCardId={flippedCardId}
                  setFlippedCardId={setFlippedCardId}
                  isAdmin={isAdmin}
                  handleDeleteResource={handleDeleteResource}
                  handleDeleteExternalLink={handleDeleteExternalLink}
                  handleViewAllResources={handleViewAllResources}
                  onUpdateExternalLink={handleUpdateExternalLink}
                  viewMode={viewMode}
                  setViewMode={setViewMode}
                  currentUserId={systemUser?.id || userId}
                  externalTypeOrdering={collection.typeOrdering}
                  onShowSocialMedia={(externalLink) => {
                    setSelectedExternalLinkForSocial(externalLink);
                    setShowSocialMediaModal(true);
                  }}
                />
              )}
            </div>
              </div>
            </>
          )}
        </div>
      }
      {/* Full Calendar View */}
      {showCalendarView && (
        <div className="mt-6 pb-8" ref={fullCalendarRef}>
          <div className="rounded-lg border border-slate-300 shadow-lg p-4 bg-white">
            <h2 className="text-xl font-bold mb-4 text-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FaCalendar className="text-blue-500" />
                <span>Full Calendar View</span>
              </div>
              <button
                onClick={() => setShowCalendarView(false)}
                className="text-gray-400 hover:text-gray-600 p-2"
                aria-label="Close calendar"
              >
                <FaTimes size={16} />
              </button>
            </h2>

            {/* Show a message if no events */}
            {(!combinedEvents || combinedEvents.length === 0) &&
             !showRegularEvents && (
              <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-gray-500">No events with dates found in this collection.</p>
                <p className="text-sm text-gray-400 mt-1">Add dates to your external links or notations to see them in the calendar.</p>
              </div>
            )}

            <Calendar
              events={[
                ...(combinedEvents || []),
                ...(showRegularEvents ? regularOrganizationEvents : []),
              ].map((event) => ({
                ...event,
                id: event.id || Math.random().toString(),
                title: event.title || event.name || "Untitled",
                startDate:
                  event.startDate || event.date || getTodayDateInputValue(),
                endDate:
                  event.endDate || event.date || getTodayDateInputValue(),
                description: event.description || "",
                type: event.type || "resource",
                status: event.status || "pending",
                // Pass through tag styling
                tags: event.tags || [],
                primaryColor: event.primaryColor,
                tagColors: event.tagColors || [],
                hasMultipleTags: event.hasMultipleTags,
                tagCount: event.tagCount || 0,
                className: event.className,
                style: {
                  "--primary-color": event.primaryColor,
                  "--secondary-color":
                    event.tagColors?.[1] || event.primaryColor,
                },
              }))}
              isAdmin={isAdmin}
              organizations={organizations || []}
              showPublicOnly={showPublicOnly}
              showRegularEvents={showRegularEvents}
              isCollectionContext={true}
              onPublicOnlyToggle={setShowPublicOnly}
              onRegularEventsToggle={setShowRegularEvents}
              onExternalLinkClick={(id) => {
                const link = collection?.externalLinks?.find(
                  (l) => l.id === id
                );
                if (link) {
                  router.push(
                    `/external-links/${link.id}?collectionId=${encodeURIComponent(
                      collectionId
                    )}`
                  );
                }
              }}
            />

            {/* Tag Legend */}
            <TagClassificationEnhanced
              availableTags={availableTags}
              highlightedTags={highlightedCalendarTags}
              tagFilterMode={tagFilterMode}
              onTagClick={handleCalendarTagClick}
              onClearHighlights={handleClearCalendarTagHighlights}
              onFilterModeChange={handleTagFilterModeChange}
              getTagCount={getTagCount}
              showCondition={availableTags.length > 0}
              events={[
                ...(combinedEvents || []),
                ...(showRegularEvents ? regularOrganizationEvents : []),
              ]}
              showPublicOnly={showPublicOnly}
              showRegularEvents={showRegularEvents}
              isCollectionContext={true} // Pass true to indicate we're in collection context
              onPublicOnlyToggle={setShowPublicOnly}
              onRegularEventsToggle={setShowRegularEvents}
            />
          </div>
        </div>
      )}
      {/* Mobile Calendar Hover Container - shown when calendar is clicked */}
      {showCalendarHover && (
        <div
          className="fixed inset-0 z-[100] md:hidden calendar-container flex items-start justify-center pt-20 px-4 bg-black/30"
          onClick={(e) => {
            // Close when clicking the backdrop (but not the calendar itself)
            if (e.target === e.currentTarget) {
              setShowCalendarHover(false);
            } else {
              preventCalendarClose(e);
            }
          }}
          onTouchEnd={preventCalendarClose}
          onTouchStart={preventCalendarClose}
          onMouseDown={preventCalendarClose}
          onMouseEnter={() => setIsInteractingWithCalendarHover(true)}
          onMouseLeave={() => setIsInteractingWithCalendarHover(false)}
        >
          <div
            className="w-full max-w-[95vw] rounded-lg shadow-2xl calendar-hover-card bg-white border border-gray-200 transform transition-all animate-fade-in overflow-hidden"
            onClick={preventCalendarClose}
          >
            <CalendarHoverInfo
              events={(combinedEvents || []).map((event) => ({
                ...event,
                type: event.type || "resource",
                startDate: event.startDate || event.date,
                endDate: event.endDate || event.date,
                title: event.title || event.name || "Untitled",
                status: event.status || "pending",
                parentId: event.parentId,
                notes: event.description || event.notes,
                // Pass through tag styling
                tags: event.tags || [],
                primaryColor: event.primaryColor,
                tagColors: event.tagColors || [],
                hasMultipleTags: event.hasMultipleTags,
                tagCount: event.tagCount || 0,
                className: event.className,
                style: {
                  "--primary-color": event.primaryColor,
                  "--secondary-color":
                    event.tagColors?.[1] || event.primaryColor,
                },
              }))}
              onClose={() => setShowCalendarHover(false)}
            />
          </div>
        </div>
      )}
      {/* Conditionally render Add Resources modal for external vs. non-external collections */}
      {showAddResources && collection.type === "external" && (
        <Modal onClose={closeAddResourcesModal}>
          <AddExternalLinkForm
            events={allEventsData}
            isAdmin={isAdmin}
            collectionTenantId={selectedExternalLink?.tenantId}
            initialValues={
              selectedExternalLink
                ? {
                    ...selectedExternalLink,
                    date: selectedExternalLink.date || "",
                  }
                : {
                    name: "",
                    url: "",
                    type: "external",
                    description: "",
                    notes: "",
                    imageUrl: "",
                    date: "",
                  }
            }
            onSubmit={(data) => {
              if (selectedExternalLink) {
                handleUpdateExternalLink(selectedExternalLink.id, data);
              } else {
                data.tenantId = collection.tenantId;
                handleAddExternalLink(data);
              }
            }}
            onUpdateSingleField={
              selectedExternalLink ? handleUpdateSingleField : undefined
            }
            onClose={closeAddResourcesModal}
            externalLinkId={selectedExternalLink?.id}
          />
        </Modal>
      )}
      {showAddResources && collection.type !== "external" && (
        <AddResourcesModal
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredResources={filteredResources}
          flippedResourceId={flippedResourceId}
          setFlippedResourceId={setFlippedResourceId}
          resourceNotes={resourceNotes}
          handleNoteChange={handleNoteChange}
          addResourceToCollection={addResourceToCollection}
          collectionId={collectionId}
          onClose={closeAddResourcesModal}
          resourceTypes={resourceTypes}
          selectedResourceTypes={selectedResourceTypes}
          setSelectedResourceTypes={setSelectedResourceTypes}
        />
      )}
      {showAIModal && collection.type === "external" && (
        <Modal
          onClose={() => setShowAIModal(false)}
          maxWidth="max-w-5xl"
          className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl"
          showCloseButton={false}
        >
          <ExternalLinkAICreate
            onClose={() => setShowAIModal(false)}
            onLinksCreated={(links) => {
              refreshCollection();
              toast.success(
                `Successfully created ${links.length} external link${
                  links.length > 1 ? "s" : ""
                }`
              );
            }}
            tags={externalLinkTagOptions}
            isBulkMode={isAIBulkMode}
            collectionId={collectionId}
          />
        </Modal>
      )}
      {isEditing && (
        <Modal onClose={() => setIsEditing(false)}>
          <AddCollectionForm
            events={allEventsData}
            onSubmit={handleUpdateCollection}
            onClose={() => setIsEditing(false)}
            initialValues={{
              name: collection.name,
              description: collection.description,
              color: collection.color || "blue",
              type: collection.type || "resource",
              visibility: collection.visibility || "private",
              organization_id: collection.organization_id || "",
              collection_type: collection.collection_type || "user",
              eventId: collection.eventId || "",
              icon: collection.icon || "users",
              isPinned: collection.isPinned || false,
              tenantId: collection.tenantId || "",
            }}
            isEditing={true}
            organizations={organizations}
            isAdvocate={isAdvocate}
            isAdmin={isAdmin}
          />
        </Modal>
      )}
      {deleteConfirmation.show && (
        <Modal
          onClose={() =>
            setDeleteConfirmation({ show: false, resourceId: null })
          }
        >
          <div className="p-6 text-slate-600">
            <h2 className="text-xl font-bold mb-4 text-center">
              Confirm Deletion
            </h2>
            <p className=" text-center">
              Are you sure you want to remove this item from the collection?
            </p>
            <p className="mb-6 text-center">
              This will remove all associated links, notes, and resources and
              cannot be undone.
            </p>

            <div className="flex justify-center gap-6">
              <button
                onClick={() =>
                  setDeleteConfirmation({ show: false, resourceId: null })
                }
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
      {selectedCollection && (
        <CollectionViewModal
          collection={selectedCollection}
          onClose={() => setSelectedCollection(null)}
          isAdmin={isAdmin}
        />
      )}
      {viewAllModal.isOpen && (
        <ViewAllResourcesModal
          isOpen={viewAllModal.isOpen}
          onClose={() => setViewAllModal({ ...viewAllModal, isOpen: false })}
          resources={viewAllModal.resources}
          viewAllMode={modalViewAllMode}
          setViewAllMode={setModalViewAllMode}
          searchTerm={modalSearchTerm}
          setSearchTerm={setModalSearchTerm}
          resourceTypes={resourceTypes}
        />
      )}
      {showShareModal && (
        <ShareContentModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          contentType="collection"
          contentId={id}
          contentName={collection?.name}
        />
      )}
      {isAdmin && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setShowSharedLinks(!showSharedLinks)}
            className={`px-4 py-2 bg-gray-400 ${
              showSharedLinks ? " mb-0" : "mb-10"
            } text-white rounded-md hover:bg-gray-600 transition-colors flex items-center shadow-md`}
          >
            {showSharedLinks ? (
              <>
                <FaChevronUp className="mr-2" /> Hide Shared Links
              </>
            ) : (
              <>
                <FaChevronDown className="mr-2" /> Show Shared Links (
                {filteredSharedLinks.length})
              </>
            )}
          </button>
        </div>
      )}
      {isAdmin && showSharedLinks && (
        <div className="mt-4 bg-white rounded-lg shadow-md p-6 w-11/12 mx-auto">
          {isLoadingSharedLinks ? (
            <div className="py-4 text-center">Loading shared links...</div>
          ) : filteredSharedLinks.length === 0 ? (
            <div className="py-4 text-center text-gray-500">
              No shared links for this collection
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="md:hidden">
                {/* Mobile view - card layout */}
                {filteredSharedLinks.map((link) => (
                  <div
                    key={link.id}
                    className={`mb-4 p-3 rounded-lg border ${
                      !link.isActive ? "bg-gray-100" : "bg-white"
                    }`}
                  >
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          Created:
                        </span>
                        <p className="text-sm">
                          {new Date(link.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          Expires:
                        </span>
                        <p className="text-sm">
                          {link.expiresAt
                            ? new Date(link.expiresAt).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          Shared With:
                        </span>
                        <p className="text-sm">
                          {link.visibility || "Anyone with link"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-gray-500">
                          Views:
                        </span>
                        <p className="text-sm">{link.viewCount || 0}</p>
                      </div>
                    </div>
                    {link.sharedWithEmail && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-500">
                          Email:
                        </span>
                        <p className="text-sm">{link.sharedWithEmail}</p>
                      </div>
                    )}
                    {link.description && (
                      <div className="mb-2">
                        <span className="text-xs font-medium text-gray-500">
                          Description:
                        </span>
                        <p className="text-sm">{link.description}</p>
                      </div>
                    )}
                    <div className="mt-3 flex gap-2">
                      {link.isActive ? (
                        <>
                          <button
                            onClick={() =>
                              navigator.clipboard
                                .writeText(link.shareUrl)
                                .then(() => toast.success("Link copied!"))
                            }
                            className="flex-1 text-center py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                          >
                            Copy Link
                          </button>
                          <button
                            onClick={() => handleRevokeLink(link.id)}
                            className="flex-1 text-center py-1.5 bg-red-100 text-red-500 rounded-md hover:bg-red-200 transition-colors text-sm"
                          >
                            <FaTimes className="inline mr-1 text-xs" /> Revoke
                          </button>
                        </>
                      ) : (
                        <span className="w-full text-center py-1.5 rounded-md text-sm font-medium bg-gray-200 text-gray-700">
                          <FaLock className="inline mr-1.5" /> Revoked
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop view - table layout */}
              <div className="hidden md:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expires
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Shared With
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Views
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSharedLinks.map((link) => (
                      <tr
                        key={link.id}
                        className={!link.isActive ? "bg-gray-100" : ""}
                      >
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {new Date(link.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {link.expiresAt
                            ? new Date(link.expiresAt).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {link.visibility || "Anyone with link"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {link.sharedWithEmail || ""}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 max-w-[200px] truncate">
                          {link.description || "No description"}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                          {link.viewCount || 0}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                          {link.isActive ? (
                            <div className="flex space-x-2 gap-2">
                              <button
                                onClick={() =>
                                  navigator.clipboard
                                    .writeText(link.shareUrl)
                                    .then(() => toast.success("Link copied!"))
                                }
                                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                              >
                                Copy Link
                              </button>
                              <button
                                onClick={() => handleRevokeLink(link.id)}
                                className="inline-flex items-center px-2 py-1 bg-red-100 text-red-500 rounded-md hover:bg-red-200 transition-colors"
                              >
                                <FaTimes className="mr-1.5 text-xs" /> Revoke
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-gray-200 text-gray-700">
                              <FaLock className="mr-1.5" /> Revoked
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
      <ExportCollectionModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        collection={collection}
        resources={filteredCollectionResources}
      />
      {/* {chatVisible && (
        <div className="fixed inset-0 z-30 pointer-events-none">
          <div className="pointer-events-auto">
            <Chat
              history={chatHistory}
              collections={[collection]}
              onChatComplete={handleChatComplete}
              setIsChatVisible={setChatVisible}
            />
          </div>
        </div>
      )} */}
      {/* 
      {(isAdmin || isAdvocate) && (
        <ChatBubble
          onClick={() => setChatVisible(!chatVisible)}
          chatVisible={chatVisible}
          className="!fixed z-50"
        />
      )} */}
      <AttachmentsModal
        isOpen={showAttachmentsModal}
        onClose={() => setShowAttachmentsModal(false)}
        attachments={getAllAttachments}
        isAdmin={isAdmin}
        title={`${collection.name} Attachments`}
      />
      <VideoBrowser
        videos={getAllVideos}
        isOpen={showVideoBrowser}
        onClose={() => setShowVideoBrowser(false)}
        onEdit={(video) => {
          if (video.type === "external_link") {
            // Handle external link editing
            const externalLink = collection?.externalLinks?.find(
              (link) => link.id === video.id
            );
            if (externalLink) {
              setSelectedExternalLink(externalLink);
              setShowAddResources(true);
            }
          } else {
            // Handle resource editing
            const resource = collection?.resources?.find(
              (r) => r.id === video.id
            );
            if (resource) {
              // Add your resource editing logic here
              // You might need to add state and handlers for resource editing
            }
          }
        }}
        onDelete={(video) => {
          if (video.type === "external_link") {
            handleDeleteExternalLink(video.id);
          } else {
            handleDeleteResource(video.id);
          }
        }}
      />
      {/* <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
      /> */}
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
                <h3 className="text-lg font-medium text-gray-900">Filters</h3>
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

              {/* Mobile Filter Tabs */}
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setFilterTab("status")}
                  className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    filterTab === "status"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  Status
                </button>
                <button
                  onClick={() => setFilterTab("tags")}
                  className={`flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                    filterTab === "tags"
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500"
                  }`}
                >
                  Tags {availableTags.length > 0 && `(${availableTags.length})`}
                </button>
              </div>

              {/* Mobile Filter Content */}
              {filterTab === "status" && (
                <StatusFilter
                  statusOptions={STATUS_OPTIONS}
                  statusFilter={statusFilter}
                  onStatusFilterChange={setStatusFilter}
                  getStatusCount={getStatusCount}
                  isCollapsible={false}
                  chipClassName="bg-blue-100 text-blue-800"
                  label="Filter by Status"
                />
              )}

              {filterTab === "tags" && (
                <TagFilter
                  tags={availableTags}
                  selectedTags={selectedTags}
                  onTagsChange={setSelectedTags}
                  onClearFilters={handleClearTagFilters}
                  getTagCount={getTagCount}
                  isCollapsible={false}
                  chipClassName="bg-green-100 text-green-800"
                  label={`Filter by Tags ${
                    availableTags.length > 0
                      ? `(${availableTags.length} available)`
                      : "(No tags available)"
                  }`}
                />
              )}
            </div>
          </div>
        </div>
      )}
      {/* Collection Chat */}
      {/* {collection && (
        <CollectionChat
          collection={collection}
          isOpen={showCollectionChat}
          onToggle={() => setShowCollectionChat(!showCollectionChat)}
          isAdmin={isAdmin}
          isCollaborator={true}
          userRole={isAdmin ? "admin" : "user"}
          systemUserId={userId}
          pinnedItems={pinnedItems}
        />
      )} */}
      {/* Merge Collections Modal */}
      {showMergeModal && collection && (
        <MergeCollectionsModal
          isOpen={showMergeModal}
          onClose={() => setShowMergeModal(false)}
          currentCollectionId={collection.id}
          currentCollectionName={collection.name}
        />
      )}
      {/* Collection Collaborator Modal */}
      <CollectionCollaboratorModal
        isOpen={showCollaboratorModal}
        onClose={() => setShowCollaboratorModal(false)}
        onSubmit={async (data) => {
          try {
            await inviteCollaborator({
              collectionId: id,
              collaboratorData: data,
            });
            toast.success("Collaborator invited successfully!");
            refetchCollaborators(); // Refresh collaborators list
            return { type: "existing", data: {} }; // Return success response
          } catch (error) {
            console.error("Error inviting collaborator:", error);
            toast.error("Failed to invite collaborator");
            throw error;
          }
        }}
      />
      {/* Social Media Modal */}
      <SocialMediaAssociationManagerModal
        isOpen={showSocialMediaModal}
        onClose={() => setShowSocialMediaModal(false)}
        title="Collection Social Media"
        entityId={collectionId}
        entityType="collection"
        entityName={collection?.name}
        hashtags={collectionHashtags}
      />
    </div>
  );
}
