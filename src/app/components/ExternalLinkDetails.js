"use client";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  FaArrowLeft,
  FaEdit,
  FaExternalLinkAlt,
  FaFlask,
  FaCalendarAlt,
  FaTimes,
  FaChevronLeft,
  FaStar,
  FaPlay,
  FaFileArchive,
  FaFileAlt,
  FaPlus,
  FaRegStickyNote,
  FaLock,
  FaQuestion,
  FaCommentAlt,
  FaLightbulb,
  FaBolt,
  FaTasks,
  FaBinoculars,
  FaShare,
  FaTrash,
  FaGlobe,
  FaGlobeAmericas,
  FaLink,
  FaHome,
  FaEnvelope,
  FaChevronDown,
  FaPodcast,
  FaUsers,
  FaCalendar,
  FaEye,
  FaMicrophone,
  FaTag,
  FaChevronUp,
  FaDownload,
  FaComments,
  FaMagic,
  FaRobot,
  FaBrain,
  FaCheck,
  FaFilePdf,
  FaPaperclip,
  FaVideo,
  FaImage,
  FaEyeSlash,
  FaChevronRight,
  FaCopy,
  FaFilter,
  FaSearch,
  FaInfoCircle,
  FaPlayCircle,
  FaHashtag,
  FaClipboardCheck,
  FaCog,
  FaSlack,
  FaDatabase,
  FaUpload,
  FaSpinner,
  FaChalkboard,
} from "react-icons/fa";
import Modal from "@/app/components/Modal";
import AddExternalLinkForm from "@/app/components/forms/AddExternalLinkForm";
import CustomEditor from "@/app/components/common/CustomEditor";
import AddAttachmentForm from "@/app/components/forms/AddAttachmentForm";
import ImageBrowser from "@/app/components/ImageBrowser/ImageBrowser";
import { toast } from "react-hot-toast";
import TimestampModal from "@/app/components/TimestampModal";
import ShareContentModal from "@/app/components/ShareContentModal";
import VideoBrowser from "@/app/components/VideoBrowser";
import TemplateManager from "@/app/components/TemplateManager";
import DOMPurify from "dompurify";
import { useEvents } from "../hooks/useEvents";
import {
  formatDateRangeShort,
  formatLongDate,
  getDateRangeValues,
  getTodayDateInputValue,
  normalizeDateInputValue,
} from "../utils/general";
import AddLinkCollectionForm from "./forms/AddLinkCollectionForm";
import { useDeleteLinkGroup, useLinkGroupById } from "../hooks/useMetadata";
import LinkGroups from "./LinkGroups";
import NotationsList from "./notations/NotationsList";
import ExternalLinkNotationComposer from "./notations/ExternalLinkNotationComposer";
import NotationSubmissionsManager from "./NotationSubmissionsManager";
import { useContextAuth } from "../context/authContext";
import { STATUS_OPTIONS } from "./forms/AddCollectionForm";
import SelectField from "./inputs/SelectField";
import { useUpdateAttachment } from "../hooks/useAttachments";
import Calendar from "./events/Calendar";
import CalendarHoverInfo from "./events/CalendarHoverInfo";
import VideoAttachmentBrowser from "@/app/components/VideoAttachmentBrowser";
import AttachmentBrowser from "@/app/components/AttachmentBrowser";
import { useDeleteCollaborator } from "../hooks/useCollections";
import {
  useExternalLinkTagsForLink,
  useAddTagsToExternalLink,
  useRemoveTagsFromExternalLink,
} from "../hooks/useTags";
import TagInput from "./inputs/TagInput";
import HashtagInput from "./inputs/HashtagInput";
import AIVoiceMemo from "./AIVoiceMemo";
import AIMenu from "./AIMenu";
import ExportExternalLinkModal from "./ExportExternalLinkModal";
import ExternalLinkChat from "./ExternalLinkChat";
import { useQueryClient } from "@tanstack/react-query";
import TagClassification from "./TagClassification";
import {
  useExternalLinkResources,
  useRemoveResourcesFromExternalLink,
  useUpdateResourceOrder,
  useUpdateResourceNotes,
} from "../hooks/useExternalLinkResources";
import ExternalLinkResourcesManager from "./ExternalLinkResourcesManager";
import ExternalLinkWhiteboard from "./ExternalLinkWhiteboard";
import EntitySocialMediaAccounts from "./social-media/EntitySocialMediaAccounts";
import AttachmentAICreate from "./AttachmentAICreate";
import SlackIntegration from "./SlackIntegration";
import BulkNotationImport from "./BulkNotationImport";
import ExternalLinkPubMedModal from "./ExternalLinkPubMedModal";

const normalizeLinkGroupsByCategory = (value) => {
  if (!value) return {};

  if (Array.isArray(value)) {
    return value.reduce((acc, item) => {
      if (!item) return acc;
      const category = item.category || "other";
      acc[category] = acc[category] || [];
      acc[category].push(item);
      return acc;
    }, {});
  }

  return Object.entries(value).reduce((acc, [category, items]) => {
    acc[category] = Array.isArray(items)
      ? items.filter(Boolean)
      : items
      ? [items]
      : [];
    return acc;
  }, {});
};

const getEarliestDate = (dates) =>
  dates.filter(Boolean).sort((a, b) => a.localeCompare(b))[0] || "";

const getLatestDate = (dates) =>
  dates.filter(Boolean).sort((a, b) => a.localeCompare(b)).at(-1) || "";

const getCollectionExternalLinkId = (item = {}) =>
  item.collectionExternalLinkId || item.collection_external_link_id || "";

const getCollectionId = (item = {}) =>
  item.collectionId || item.collection_id || "";

const getCombinedDateRangeValues = (items = []) => {
  const ranges = items
    .map((item) => ({
      ...getDateRangeValues(item),
      collectionExternalLinkId: getCollectionExternalLinkId(item),
      collectionId: getCollectionId(item),
    }))
    .filter((range) => range.startDate);

  if (!ranges.length) {
    return { startDate: "", endDate: "" };
  }

  const collectionExternalLinkIds = [
    ...new Set(
      ranges.map((range) => range.collectionExternalLinkId).filter(Boolean)
    ),
  ];
  const collectionIds = [
    ...new Set(ranges.map((range) => range.collectionId).filter(Boolean)),
  ];

  return {
    startDate: getEarliestDate(ranges.map((range) => range.startDate)),
    endDate: getLatestDate(
      ranges.map((range) => range.endDate || range.startDate)
    ),
    collectionExternalLinkId:
      collectionExternalLinkIds.length === 1
        ? collectionExternalLinkIds[0]
        : "",
    collectionId: collectionIds.length === 1 ? collectionIds[0] : "",
  };
};

const getExternalLinkDateContext = (
  externalLink,
  source = {},
  preferredCollectionId = ""
) => {
  const collections = Array.isArray(externalLink?.collections)
    ? externalLink.collections
    : [];
  const sourceCollectionExternalLinkId = getCollectionExternalLinkId(source);
  const sourceCollectionId = getCollectionId(source);
  const matchedCollection =
    collections.find(
      (collection) =>
        collection.collectionExternalLinkId === sourceCollectionExternalLinkId
    ) ||
    collections.find((collection) => collection.id === sourceCollectionId) ||
    collections.find((collection) => collection.id === preferredCollectionId) ||
    collections[0];

  if (!matchedCollection) {
    return {
      collectionId: preferredCollectionId || sourceCollectionId || "",
      scopedExternalLink: externalLink,
    };
  }

  return {
    collectionId: matchedCollection.id,
    collectionExternalLinkId: matchedCollection.collectionExternalLinkId,
    scopedExternalLink: {
      ...externalLink,
      date: matchedCollection.date || externalLink.date,
      startDate:
        matchedCollection.startDate ||
        matchedCollection.date ||
        externalLink.startDate ||
        externalLink.date,
      endDate:
        matchedCollection.endDate ||
        matchedCollection.startDate ||
        matchedCollection.date ||
        externalLink.endDate ||
        externalLink.startDate ||
        externalLink.date,
      status: matchedCollection.status || externalLink.status,
      eventId: matchedCollection.eventId || externalLink.eventId,
    },
  };
};

const getExternalLinkDateExpansion = (externalLink, notationRange) => {
  const taskRange = getDateRangeValues(notationRange);
  if (!taskRange.startDate) return null;

  const linkRange = getDateRangeValues(externalLink);
  const currentStartDate = linkRange.startDate;
  const currentEndDate = linkRange.endDate || linkRange.startDate;
  const taskEndDate = taskRange.endDate || taskRange.startDate;
  const nextStartDate = getEarliestDate([
    currentStartDate,
    taskRange.startDate,
  ]);
  const nextEndDate = getLatestDate([currentEndDate, taskEndDate]);

  if (
    currentStartDate === nextStartDate &&
    currentEndDate === nextEndDate
  ) {
    return null;
  }

  return {
    currentStartDate,
    currentEndDate,
    taskStartDate: taskRange.startDate,
    taskEndDate,
    nextStartDate,
    nextEndDate,
  };
};

const ExternalLinkDetails = ({
  externalLink,
  isAdmin,
  isAdvocate,
  systemUser,
  router,
  uploadAttachment,
  deleteNotation,
  addNotation,
  updateExternalLink,
  updateNotation,
  sharedToken,
  sharedEmail,
  deleteAttachment,
  showAllNotations = false,
  publicJsonEnabled = false,
  collaborators = [],
  isLoadingCollaborators = false,
  pinnedItems = [],
  refetchExternalLink,
  highlightNotationId,
  onShowPublicJsonModal,
  contextCollectionId = "",
}) => {
  const { userId } = useContextAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editingNotation, setEditingNotation] = useState(null);
  const [isPreparingNotation, setIsPreparingNotation] = useState(false);
  const [showSubmissionsManager, setShowSubmissionsManager] = useState(false);

  const [showAllNotes, setShowAllNotes] = useState(false);
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState(null);
  const [showAttachmentDropdown, setShowAttachmentDropdown] = useState(false);
  const [showAIAttachmentModal, setShowAIAttachmentModal] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [activeNotesTab, setActiveNotesTab] = useState(() => {
    return localStorage.getItem("defaultNotesTab") || "all";
  });
  const [showLinkCollectionModal, setShowLinkCollectionModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);

  // State for controlling regular events fetching
  const [showRegularEvents, setShowRegularEvents] = useState(false); // Default to false (opt-in)
  const [showPublicOnly, setShowPublicOnly] = useState(false); // Default to false (show all)

  // Only fetch events if user opted in to show regular events
  const { data: allEventsData = [] } = useEvents({
    enabled: showRegularEvents,
  });

  const regularOrganizationEvents = useMemo(() => {
    return allEventsData;
  }, [allEventsData]);

  const { mutate: updateAttachment } = useUpdateAttachment();
  const [showCalendarView, setShowCalendarView] = useState(false);
  const [showCalendarHover, setShowCalendarHover] = useState(false);
  const calendarRef = useRef(null);
  const calendarButtonRef = useRef(null);
  const aiButtonRef = useRef(null);
  const promptedDateExpansionRef = useRef(new Set());
  const [isInteractingWithCalendarHover, setIsInteractingWithCalendarHover] =
    useState(false);
  const [showAttachmentBrowser, setShowAttachmentBrowser] = useState(false);
  const { mutate: deleteCollaborator, isLoading: isDeleting } =
    useDeleteCollaborator();
  const [showAIVoiceMemo, setShowAIVoiceMemo] = useState(false);
  const [showAIBulkUpdates, setShowAIBulkUpdates] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAddResources, setShowAddResources] = useState(false);
  const [showPubMedResourceSearch, setShowPubMedResourceSearch] =
    useState(false);
  const [dateExpansionPrompt, setDateExpansionPrompt] = useState(null);
  const dateExpansionResolveRef = useRef(null);
  const [editingResourceNoteId, setEditingResourceNoteId] = useState(null);
  const [editingResourceNoteValue, setEditingResourceNoteValue] = useState("");
  const [savingResourceNoteId, setSavingResourceNoteId] = useState(null);
  const [reorderingResourceId, setReorderingResourceId] = useState(null);
  const [selectedVideoResource, setSelectedVideoResource] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showSidePanels, setShowSidePanels] = useState(true);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [activeHeaderTab, setActiveHeaderTab] = useState("details");

  // Get collection ID from the current collection context when available.
  const collectionId = useMemo(() => {
    const collections = Array.isArray(externalLink?.collections)
      ? externalLink.collections
      : [];
    const matchedCollection = collections.find(
      (collection) => collection.id === contextCollectionId
    );

    return matchedCollection?.id || collections[0]?.id || contextCollectionId;
  }, [contextCollectionId, externalLink?.collections]);

  const collectionScopedExternalLink = useMemo(
    () =>
      getExternalLinkDateContext(
        externalLink,
        { collectionId },
        collectionId
      ).scopedExternalLink,
    [collectionId, externalLink]
  );

  // Resources hooks
  const { data: linkedResourcesData, isLoading: isLoadingResources } =
    useExternalLinkResources(collectionId, externalLink?.id);
  const linkedResources = linkedResourcesData?.resources || [];
  const removeResourcesMutation = useRemoveResourcesFromExternalLink();
  const updateResourceOrderMutation = useUpdateResourceOrder();
  const updateResourceNotesMutation = useUpdateResourceNotes();

  // Tag-related state and hooks
  const [showTagsEditor, setShowTagsEditor] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const { data: linkTags = [], isLoading: isLoadingTags } =
    useExternalLinkTagsForLink(externalLink?.id);
  const { mutate: addTags } = useAddTagsToExternalLink();
  const { mutate: removeTags } = useRemoveTagsFromExternalLink();

  // Hashtag-related state
  const [showHashtagsEditor, setShowHashtagsEditor] = useState(false);
  const [externalLinkHashtags, setExternalLinkHashtags] = useState(
    externalLink?.hashtags
      ? typeof externalLink.hashtags === "string"
        ? externalLink.hashtags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : externalLink.hashtags
      : []
  );

  // Calendar tag highlighting state with localStorage persistence
  const [highlightedCalendarTags, setHighlightedCalendarTags] = useState(() => {
    if (typeof window !== "undefined" && externalLink?.id) {
      const saved = localStorage.getItem(
        `external-link-calendar-tags-${externalLink.id}`
      );
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [tagFilterMode, setTagFilterMode] = useState(() => {
    if (typeof window !== "undefined" && externalLink?.id) {
      const saved = localStorage.getItem(
        `external-link-tag-filter-mode-${externalLink.id}`
      );
      return saved || "OR";
    }
    return "OR";
  }); // "OR" or "AND"
  const [showCalendarTagSelector, setShowCalendarTagSelector] = useState(false);

  // Available tags for this external link
  const availableTags = useMemo(() => {
    // First try to get from the hook

    if (
      externalLink?.notations?.length > 0 &&
      Array.isArray(externalLink.notations)
    ) {
      // Get all tags from notations
      const allTags = externalLink.notations
        .map((notation) => notation.tags)
        .flat();

      // Deduplicate tags by ID
      const uniqueTagsMap = new Map();
      allTags.forEach((tag) => {
        if (tag && tag.id && !uniqueTagsMap.has(tag.id)) {
          uniqueTagsMap.set(tag.id, tag);
        }
      });

      // Convert back to array
      return Array.from(uniqueTagsMap.values());
    }

    return [];
  }, [externalLink.notations]);

  // 🐛 DEBUG: Removed debug logging to prevent excessive console output

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
      if (typeof window !== "undefined" && externalLink?.id) {
        localStorage.setItem(
          `external-link-calendar-tags-${externalLink.id}`,
          JSON.stringify(newTags)
        );
      }
      return newTags;
    });
  };

  const handleClearCalendarTagHighlights = () => {
    setHighlightedCalendarTags([]);
    // Clear from localStorage
    if (typeof window !== "undefined" && externalLink?.id) {
      localStorage.removeItem(`external-link-calendar-tags-${externalLink.id}`);
    }
  };

  // Handler for tag filter mode change that persists to localStorage
  const handleTagFilterModeChange = (mode) => {
    setTagFilterMode(mode);
    // Save to localStorage
    if (typeof window !== "undefined" && externalLink?.id) {
      localStorage.setItem(
        `external-link-tag-filter-mode-${externalLink.id}`,
        mode
      );
    }
  };

  // Handle tag changes
  const handleTagsChange = (tags) => {
    if (!externalLink?.id) return;

    const currentTagIds = linkTags.map((tag) => tag.id);
    const newTagIds = tags.map((tag) => tag.id);

    // Find tags to add and remove
    const tagsToAdd = newTagIds.filter((id) => !currentTagIds.includes(id));
    const tagsToRemove = currentTagIds.filter((id) => !newTagIds.includes(id));

    // Add new tags
    if (tagsToAdd.length > 0) {
      addTags({
        externalLinkId: externalLink.id,
        tagIds: tagsToAdd,
      });
    }

    // Remove old tags
    if (tagsToRemove.length > 0) {
      removeTags({
        externalLinkId: externalLink.id,
        tagIds: tagsToRemove,
      });
    }
  };

  // Check if the current user is a collaborator
  const isCollaborator = collaborators.some(
    (collaborator) =>
      collaborator.userId === userId || collaborator.userId === systemUser?.id
  );

  // Determine the current user's role (viewer, editor, admin)
  const userRole =
    collaborators.find(
      (collaborator) =>
        collaborator.userId === userId || collaborator.userId === systemUser?.id
    )?.role || null;

  // Check if user is an advocate for the current tenant
  const isAdvocateForTenant = isAdvocate && isAdvocate.length > 0;

  // Determine if user has edit permissions
  const canEdit =
    isAdmin ||
    isAdvocateForTenant || // Advocates can edit all external links
    systemUser?.id === externalLink.addedByUserId || // Check if user created this external link
    systemUser?.id === externalLink.userId || // Legacy check for older data
    (isCollaborator && (userRole === "editor" || userRole === "admin")); // Only editors and admin collaborators can edit

  // Determine if user has add permissions for attachments, notations, etc.
  const canAddContent =
    isAdmin ||
    isAdvocateForTenant || // Advocates can add content
    systemUser?.id === externalLink.addedByUserId || // Creator can add content
    systemUser?.id === externalLink.userId || // Legacy check
    isCollaborator; // All collaborators can add content

  const handleMaybeExpandExternalLinkDates = useCallback(
    async (notationRange) => {
      const {
        collectionId: targetCollectionId,
        scopedExternalLink,
      } = getExternalLinkDateContext(
        externalLink,
        notationRange,
        collectionId
      );

      if (!canEdit || !targetCollectionId || !updateExternalLink) {
        return;
      }

      const expansion = getExternalLinkDateExpansion(
        scopedExternalLink,
        notationRange
      );
      if (!expansion) {
        return;
      }

      const expansionSignature = `${targetCollectionId}:${expansion.nextStartDate}:${expansion.nextEndDate}`;
      if (promptedDateExpansionRef.current.has(expansionSignature)) {
        return;
      }
      promptedDateExpansionRef.current.add(expansionSignature);

      const currentRangeText =
        formatDateRangeShort(
          expansion.currentStartDate,
          expansion.currentEndDate
        ) || "No dates set";
      const taskRangeText = formatDateRangeShort(
        expansion.taskStartDate,
        expansion.taskEndDate
      );
      const nextRangeText = formatDateRangeShort(
        expansion.nextStartDate,
        expansion.nextEndDate
      );

      const shouldExpand = await new Promise((resolve) => {
        dateExpansionResolveRef.current = resolve;
        setDateExpansionPrompt({
          currentRangeText,
          nextRangeText,
          taskRangeText,
        });
      });

      if (!shouldExpand) {
        return;
      }

      const linkData = {
        name: externalLink.name,
        description: externalLink.description,
        url: externalLink.url,
        type: externalLink.type,
        date: expansion.nextStartDate,
        startDate: expansion.nextStartDate,
        endDate: expansion.nextEndDate,
        status: scopedExternalLink.status,
        visibility: externalLink.visibility,
        eventId: scopedExternalLink.eventId,
        startTime: externalLink.startTime,
        endTime: externalLink.endTime,
        timezone: externalLink.timezone,
        hashtags: externalLink.hashtags,
        whiteboardData: externalLink.whiteboardData,
        allowPublicNotations: externalLink.allowPublicNotations,
      };

      try {
        await new Promise((resolve, reject) => {
          updateExternalLink(
            {
              collectionId: targetCollectionId,
              externalLinkId: externalLink.id,
              linkData,
            },
            {
              onSuccess: resolve,
              onError: reject,
            }
          );
        });

        toast.success("External link dates expanded");
        if (refetchExternalLink) {
          await refetchExternalLink();
        }
      } catch (error) {
        console.error("Failed to expand external link dates:", error);
        toast.error(error?.message || "Failed to expand external link dates");
      }
    },
    [
      canEdit,
      collectionId,
      externalLink,
      refetchExternalLink,
      updateExternalLink,
    ]
  );

  const handleDateExpansionPromptClose = (shouldExpand = false) => {
    dateExpansionResolveRef.current?.(shouldExpand);
    dateExpansionResolveRef.current = null;
    setDateExpansionPrompt(null);
  };

  // Determine who owns a particular piece of content (notation, attachment, etc.)
  const isOwner = (contentItem) => {
    return (
      contentItem?.userId === systemUser?.id ||
      contentItem?.userId === systemUser?.id
    );
  };

  const { data: linkGroups, isLoading: isLoadingLinkGroups } = useLinkGroupById(
    externalLink.id,
    sharedToken,
    sharedEmail
  );
  const resolvedLinkGroups = useMemo(
    () =>
      normalizeLinkGroupsByCategory(linkGroups || externalLink?.linkGroups),
    [linkGroups, externalLink?.linkGroups]
  );

  const { mutate: deleteLinkGroup } = useDeleteLinkGroup();
  const [editingLinkGroup, setEditingLinkGroup] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showVideoBrowser, setShowVideoBrowser] = useState(false);

  const imageAttachments =
    externalLink?.attachments?.filter(
      (attachment) => attachment.type === "image"
    ) || [];

  const videoAttachments =
    externalLink?.attachments?.filter(
      (attachment) =>
        attachment.type === "video" ||
        (attachment.presignedUrl &&
          (attachment.presignedUrl.endsWith(".mp4") ||
            attachment.presignedUrl.endsWith(".mov") ||
            attachment.presignedUrl.endsWith(".avi") ||
            attachment.presignedUrl.endsWith(".webm") ||
            attachment.presignedUrl.endsWith(".mpeg")))
    ) || [];

  // Update hashtags when external link changes
  useEffect(() => {
    if (externalLink?.hashtags) {
      setExternalLinkHashtags(
        typeof externalLink.hashtags === "string"
          ? externalLink.hashtags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : externalLink.hashtags
      );
    }
  }, [externalLink?.hashtags]);

  const nonMediaAttachments =
    externalLink?.attachments?.filter(
      (attachment) =>
        attachment.type !== "image" &&
        attachment.type !== "video" &&
        !(
          attachment.presignedUrl &&
          (attachment.presignedUrl.endsWith(".mp4") ||
            attachment.presignedUrl.endsWith(".mov") ||
            attachment.presignedUrl.endsWith(".avi") ||
            attachment.presignedUrl.endsWith(".webm") ||
            attachment.presignedUrl.endsWith(".mpeg"))
        )
    ) || [];

  const [isBulkNotationMode, setIsBulkNotationMode] = useState(false);
  const [selectedNotations, setSelectedNotations] = useState({});
  const [bulkNotationStatus, setBulkNotationStatus] = useState("");
  const [bulkNotationDates, setBulkNotationDates] = useState({});
  const [bulkNotationVisibility, setBulkNotationVisibility] = useState("");
  const [bulkNotationTags, setBulkNotationTags] = useState([]);
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Add state for Add/AI dropdown (combined)
  const [showAddAIDropdown, setShowAddAIDropdown] = useState(false);
  const addAIDropdownRef = useRef(null);

  // Add state for bulk update dropdown
  const [showBulkUpdateDropdown, setShowBulkUpdateDropdown] = useState(false);
  const bulkUpdateDropdownRef = useRef(null);

  // Add ref for attachment dropdown
  const attachmentDropdownRef = useRef(null);

  // Add ref for settings dropdown
  const settingsDropdownRef = useRef(null);

  // Create combined events array from external link and notations for calendar
  const combinedEvents = useMemo(() => {
    if (!externalLink) return [];

    const events = [];
    const externalLinkRange = getDateRangeValues(externalLink);

    // Add the external link as an event
    if (externalLinkRange.startDate) {
      // Get tag information for this external link
      const eventTags =
        linkTags?.length > 0 ? linkTags : externalLink.tags || [];
      const primaryTag = eventTags[0]; // Use first tag as primary
      const tagColors = eventTags.map((tag) => tag.color).filter(Boolean);
      const primaryColor = primaryTag?.color || "#3B82F6";

      // Calculate highlighting state based on filter mode
      const isHighlighted =
        highlightedCalendarTags.length === 0 ||
        (tagFilterMode === "OR"
          ? // OR logic: external link highlighted if it has ANY of the selected tags
            eventTags.some((tag) =>
              highlightedCalendarTags.some((hTag) => hTag.id === tag.id)
            )
          : // AND logic: external link highlighted if it has ALL of the selected tags
            highlightedCalendarTags.every((hTag) =>
              eventTags.some((tag) => tag.id === hTag.id)
            ));
      const isDimmed = highlightedCalendarTags.length > 0 && !isHighlighted;

      events.push({
        id: externalLink.id,
        title: externalLink.name || "Untitled",
        description: externalLink.description || "",
        startDate: externalLinkRange.startDate,
        endDate: externalLinkRange.endDate,
        time: externalLink.startTime || "",
        startTime: externalLink.startTime || "",
        endTime: externalLink.endTime || "",
        timezone: externalLink.timezone || "",
        type: "external_link",
        status: externalLink.status || "pending",
        url: externalLink.url,
        // Tag-based styling
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
          externalLink.status,
          isHighlighted,
          isDimmed
        ),
        style: {
          "--primary-color": primaryColor,
          "--secondary-color": tagColors[1] || primaryColor,
        },
      });
    }

    // Add notations as events
    if (externalLink.notations) {
      externalLink.notations.forEach((notation) => {
        const notationRange = getDateRangeValues(notation);
        if (notationRange.startDate) {
          // Combine tags from parent external link and notation
          const externalLinkTags = linkTags || [];
          const notationTags = notation.tags || [];
          const eventTags = [...externalLinkTags, ...notationTags];

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
                  highlightedCalendarTags.some((hTag) => hTag.id === tag.id)
                )
              : // AND logic: notation highlighted if it has ALL of the selected tags
                highlightedCalendarTags.every((hTag) =>
                  uniqueEventTags.some((tag) => tag.id === hTag.id)
                ));
          const isDimmed = highlightedCalendarTags.length > 0 && !isHighlighted;

          events.push({
            id: externalLink.id,
            notationId: notation.id,
            title: notation.title || "Untitled",
            description: notation.notes || "",
            startDate: notationRange.startDate,
            endDate: notationRange.endDate,
            time: notation.startTime || "",
            type: "notation",
            status: notation.status || "pending",
            collectionId: externalLink.collections?.[0]?.id,
            highlighted: notation.highlighted,
            startTime: notation.startTime || "",
            endTime: notation.endTime || "",
            timezone: notation.timezone || "",
            // Combined tags from parent external link and notation
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
      });
    }

    return events;
  }, [externalLink, linkTags, highlightedCalendarTags, tagFilterMode]);

  // Helper function to get tag count for the legend - moved after combinedEvents to fix circular dependency
  const getTagCount = (tagId) => {
    // Count events that have this tag
    return combinedEvents.filter((event) =>
      event.tags?.some((tag) => tag.id === tagId)
    ).length;
  };

  const handleNavigateImage = (direction) => {
    if (direction === "next") {
      setCurrentImageIndex((prev) =>
        prev === imageAttachments.length - 1 ? 0 : prev + 1
      );
    } else {
      setCurrentImageIndex((prev) =>
        prev === 0 ? imageAttachments.length - 1 : prev - 1
      );
    }
  };

  const createNotationDraft = useCallback(
    async (seed = {}) => {
      if (isPreparingNotation) {
        return;
      }
      if (!collectionId) {
        toast.error("No collection associated with this external link");
        return;
      }

      setIsPreparingNotation(true);

      try {
        const createdNotation = await addNotation.mutateAsync({
          collectionId,
          externalLinkId: externalLink.id,
          notationData: {
            title: seed.title || "Untitled note",
            notes: seed.notes || "",
            category: seed.category || "Observation",
            status: seed.status || "Pending",
            visibility:
              seed.visibility ||
              (isCollaborator && userRole !== "admin"
                ? "unlisted"
                : "private"),
            highlighted: Boolean(seed.highlighted),
            date: normalizeDateInputValue(
              seed.startDate || seed.start_date || seed.date
            ) || null,
            startDate:
              normalizeDateInputValue(
                seed.startDate || seed.start_date || seed.date
              ) || null,
            endDate:
              normalizeDateInputValue(
                seed.endDate ||
                  seed.end_date ||
                  seed.startDate ||
                  seed.start_date ||
                  seed.date
              ) || null,
            tags: seed.tags || [],
          },
        });

        setEditingNotation({
          ...createdNotation,
          isNewDraft: true,
        });

        if (refetchExternalLink) {
          await refetchExternalLink();
        }
      } catch (error) {
        console.error("Error creating notation draft:", error);
      } finally {
        setIsPreparingNotation(false);
      }
    },
    [
      addNotation,
      collectionId,
      externalLink.id,
      isCollaborator,
      isPreparingNotation,
      refetchExternalLink,
      userRole,
    ]
  );

  const handleSubmitAttachment = async (formData) => {
    try {
      // Check if this is an update operation
      if (editingAttachment && formData.id) {
        updateAttachment(formData);
        setEditingAttachment(null);
      } else {
        // Normal upload for new attachment
        uploadAttachment(formData);
      }
      setShowAddAttachment(false);
    } catch (error) {
      console.error("Error handling attachment:", error);
    }
  };

  const handleEditAttachment = (attachment) => {
    setEditingAttachment(attachment);
    setShowAddAttachment(true);
  };

  const handleUpdateExternalLink = async (data) => {
    // Only owners, advocates, and admins can update the external link itself
    if (
      !isAdmin &&
      !isAdvocateForTenant &&
      systemUser?.id !== externalLink.addedByUserId &&
      systemUser?.id !== externalLink.userId &&
      !(isCollaborator && userRole === "admin")
    ) {
      toast.error("You don't have permission to edit this resource");
      return;
    }

    if (!collectionId) {
      toast.error("No collection associated with this external link");
      return;
    }

    try {
      const linkData = {
        name: data.name || externalLink.name,
        description: data.description || externalLink.description,
        url: data.url || externalLink.url,
        type: data.type || externalLink.type,
        date: data.startDate || data.date || null,
        startDate:
          data.startDate ||
          data.start_date ||
          collectionScopedExternalLink.startDate ||
          collectionScopedExternalLink.date ||
          null,
        endDate:
          data.endDate ||
          data.end_date ||
          data.startDate ||
          data.date ||
          collectionScopedExternalLink.endDate ||
          collectionScopedExternalLink.startDate ||
          collectionScopedExternalLink.date ||
          null,
        status: data.status.id ? data.status.id : data.status,
        visibility: data.visibility.id || data.visibility,
        eventId: data?.eventId?.id || collectionScopedExternalLink.eventId,
        startTime: data?.startTime || externalLink.startTime,
        endTime: data?.endTime || externalLink.endTime,
        timezone: data?.timezone?.id || data?.timezone || externalLink.timezone,
        hashtags: data?.hashtags || externalLink.hashtags,
        whiteboardData:
          data.whiteboardData !== undefined
            ? data.whiteboardData
            : externalLink.whiteboardData,
        allowPublicNotations:
          data.allowPublicNotations !== undefined
            ? data.allowPublicNotations
            : externalLink.allowPublicNotations,
      };

      // Call the mutation with the updated data (as JSON)
      updateExternalLink({
        collectionId,
        externalLinkId: externalLink.id,
        linkData,
      });
    } catch (error) {
      console.error("Error updating external link:", error);
      toast.error("Failed to update external link");
    }
    setIsEditing(false);
  };

  // Handle single field updates (for auto-save functionality)
  const handleUpdateSingleField = async (externalLinkId, fieldData) => {
    // Only owners, advocates, and admins can update the external link itself
    if (
      !isAdmin &&
      !isAdvocateForTenant &&
      systemUser?.id !== externalLink.addedByUserId &&
      systemUser?.id !== externalLink.userId &&
      !(isCollaborator && userRole === "admin")
    ) {
      throw new Error("You don't have permission to edit this resource");
    }

    // Check if updateExternalLink function is provided
    if (!updateExternalLink) {
      throw new Error("Update function not available");
    }

    // Check if we have a collection to update
    if (!collectionId) {
      throw new Error("No collection associated with this external link");
    }

    try {
      // Prepare the update data, merging with existing data
      const linkData = {
        name: externalLink.name,
        description: externalLink.description,
        url: externalLink.url,
        type: externalLink.type,
        date:
          collectionScopedExternalLink.startDate ||
          collectionScopedExternalLink.date,
        startDate:
          collectionScopedExternalLink.startDate ||
          collectionScopedExternalLink.date,
        endDate:
          collectionScopedExternalLink.endDate ||
          collectionScopedExternalLink.startDate ||
          collectionScopedExternalLink.date,
        status: collectionScopedExternalLink.status,
        visibility: externalLink.visibility,
        eventId: collectionScopedExternalLink.eventId,
        startTime: externalLink.startTime,
        endTime: externalLink.endTime,
        timezone: externalLink.timezone,
        hashtags: externalLink.hashtags,
        whiteboardData: externalLink.whiteboardData,
        // Add the field being updated
        ...fieldData,
      };

      // Call the mutation with the proper format
      return new Promise((resolve, reject) => {
        updateExternalLink(
          {
            collectionId,
            externalLinkId: externalLinkId,
            linkData: linkData,
          },
          {
            onSuccess: () => {
              // Refresh the external link data
              if (refetchExternalLink) {
                refetchExternalLink();
              }
              resolve();
            },
            onError: (error) => {
              console.error("Error updating field:", error);
              reject(error);
            },
          }
        );
      });
    } catch (error) {
      console.error("Error updating field:", error);
      throw error;
    }
  };

  const handleEditLinkGroup = (linkGroup) => {
    // Check if user is admin, owner of the link group, or has edit permissions
    if (
      isAdmin ||
      linkGroup.userId === systemUser?.id ||
      (isCollaborator && userRole === "admin")
    ) {
      setShowLinkCollectionModal(true);
      setEditingLinkGroup(linkGroup);
    } else {
      toast.error("You don't have permission to edit this link");
    }
  };

  const handleDeleteLinkGroup = (linkGroup) => {
    // Check if user is admin, owner of the link group, or has admin permissions
    if (
      isAdmin ||
      linkGroup.userId === systemUser?.id ||
      (isCollaborator && userRole === "admin")
    ) {
      deleteLinkGroup(linkGroup.id);
    } else {
      toast.error("You don't have permission to delete this link");
    }
  };

  const handleAttachmentClick = (attachment) => {
    if (attachment.type === "image") {
      setSelectedAttachment(attachment);
    } else {
      window.open(attachment.presignedUrl, "_blank");
    }
  };

  const isVideoUrl = (url) => {
    return Boolean(
      url?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/) ||
        url?.includes("zoom.us")
    );
  };

  const stripHtmlTags = (html) => {
    if (!html) return "";
    // Create a temporary div element to parse HTML
    const temp = document.createElement("div");
    temp.innerHTML = DOMPurify.sanitize(html);
    // Return only the text content
    return temp.textContent || temp.innerText || "";
  };

  const handleTabChange = (tabValue) => {
    setActiveNotesTab(tabValue);
    localStorage.setItem("defaultNotesTab", tabValue);
  };

  // Filter notations based on active tab
  const getFilteredNotations = () => {
    if (!externalLink?.notations) return [];

    // When showAllNotations is true, return all notations without filtering by status
    if (showAllNotations) {
      return externalLink.notations.sort((a, b) => {
        // Sort by highlighted first, then by most recent date
        if (a.highlighted && !b.highlighted) return -1;
        if (!a.highlighted && b.highlighted) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
    }

    let filtered;
    switch (activeNotesTab) {
      case "all":
        filtered = externalLink.notations.filter(
          (note) =>
            note.status?.toLowerCase() !== "archived" &&
            note.status?.toLowerCase() !== "canceled"
        );
        break;
      case "pending":
        filtered = externalLink.notations.filter(
          (note) => note.status?.toLowerCase() === "pending"
        );
        break;
      case "inprogress":
        filtered = externalLink.notations.filter(
          (note) => note.status?.toLowerCase() === "in progress"
        );
        break;
      case "completed":
        filtered = externalLink.notations.filter(
          (note) => note.status?.toLowerCase() === "completed"
        );
        break;
      case "archived":
        filtered = externalLink.notations.filter(
          (note) =>
            note.status?.toLowerCase() === "archived" ||
            note.status?.toLowerCase() === "canceled"
        );
        break;
      default:
        filtered = externalLink.notations;
    }

    // Sort by highlighted first, then by most recent date
    return filtered.sort((a, b) => {
      // First sort by highlighted status (true comes before false)
      if (a.highlighted && !b.highlighted) return -1;
      if (!a.highlighted && b.highlighted) return 1;

      // Then sort by date (most recent first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const filteredNotations = getFilteredNotations();

  // Calculate counts for notation statuses
  const notationCounts = useMemo(() => {
    if (!externalLink?.notations)
      return { all: 0, pending: 0, inprogress: 0, completed: 0, archived: 0 };

    const counts = {
      all: 0,
      pending: 0,
      inprogress: 0,
      completed: 0,
      archived: 0,
    };

    externalLink.notations.forEach((note) => {
      const status = note.status?.toLowerCase() || "";

      // Count for all active (not archived/canceled)
      if (status !== "archived" && status !== "canceled") {
        counts.all++;
      }

      // Count for specific statuses
      if (status === "pending") {
        counts.pending++;
      } else if (status === "in progress") {
        counts.inprogress++;
      } else if (status === "completed") {
        counts.completed++;
      } else if (status === "archived" || status === "canceled") {
        counts.archived++;
      }
    });

    return counts;
  }, [externalLink?.notations]);

  // Helper function to get the appropriate icon for a category
  const getCategoryIcon = (category) => {
    switch (category) {
      case "video":
        return <FaPlay className="text-red-600 text-xl" />;
      case "email":
        return <FaEnvelope className="text-blue-600 text-xl" />;
      case "trial":
        return <FaFlask className="text-purple-600 text-xl" />;
      case "website":
        return <FaGlobe className="text-blue-600 text-xl" />;
      case "document":
        return <FaFileAlt className="text-purple-600 text-xl" />;
      case "research":
        return <FaFlask className="text-green-600 text-xl" />;
      case "podcast":
        return <FaPodcast className="text-green-600 text-xl" />;
      case "other":
        return <FaLink className="text-gray-600 text-xl" />;
      default:
        return <FaLink className="text-gray-600 text-xl" />;
    }
  };

  const handleBackNavigation = () => {
    if (sharedToken) {
      // Get email from localStorage for shared links
      const storedEmail = localStorage.getItem("shared-links-email");
      const emailParam = storedEmail
        ? `&email=${encodeURIComponent(storedEmail)}`
        : "";
      const url = `/shared/${externalLink.metadata?.linkId}?token=${sharedToken}${emailParam}`;

      if (router) {
        router.push(url);
      } else {
        window.location.href = url;
      }
    } else {
      // Check if user has access to the collection
      const hasCollectionAccess =
        isAdmin ||
        isAdvocateForTenant ||
        systemUser?.id === externalLink.addedByUserId ||
        systemUser?.id === externalLink.userId ||
        externalLink.collections?.[0]?.userId === systemUser?.id;

      // If user doesn't have collection access (i.e., they're only a collaborator on this external link),
      // navigate to the main collections page instead of the specific collection
      const targetUrl = hasCollectionAccess
        ? `/collections/${collectionId}`
        : "/collections";

      if (router) {
        router.push(targetUrl);
      } else {
        window.location.href = targetUrl;
      }
    }
  };

  const formatHtmlContent = (content) => {
    // Add styles to ensure proper text color
    const styledContent = content
      .replace(/<p>/g, '<p class="mb-4 text-gray-900">')
      .replace(/<div>/g, '<div class="mb-4 text-gray-900">')
      .replace(/<br>/g, "<br />")
      .replace(/<strong>/g, '<strong class="font-bold text-gray-900">')
      .replace(/<b>/g, '<b class="font-bold text-gray-900">')
      .replace(/<h1>/g, '<h1 class="text-2xl font-bold text-gray-900 mb-4">')
      .replace(/<h2>/g, '<h2 class="text-xl font-bold text-gray-900 mb-3">')
      .replace(/<h3>/g, '<h3 class="text-lg font-bold text-gray-900 mb-2">')
      .replace(/<ul>/g, '<ul class="list-disc list-inside mb-4 text-gray-900">')
      .replace(
        /<ol>/g,
        '<ol class="list-decimal list-inside mb-4 text-gray-900">'
      )
      .replace(/<li>/g, '<li class="mb-1 text-gray-900">');

    return DOMPurify.sanitize(styledContent);
  };

  const handleDeleteAttachment = async (
    attachmentId,
    isEdit = false,
    attachment = null
  ) => {
    // If this is an edit request, handle it as such
    if (isEdit && attachment) {
      handleEditAttachment(attachment);
      return;
    }

    // Get the attachment to check ownership
    const attachmentObj = [
      ...imageAttachments,
      ...videoAttachments,
      ...nonMediaAttachments,
    ].find((a) => a.id === attachmentId);

    // Only allow deletion if admin, owner of the attachment, or has admin permissions
    if (
      isAdmin ||
      attachmentObj?.userId === systemUser?.id ||
      (isCollaborator && userRole === "admin")
    ) {
      try {
        await deleteAttachment({
          attachmentId,
          externalLinkId: externalLink.id,
        });
      } catch (error) {
        console.error("Error deleting attachment:", error);
        toast.error("Failed to delete attachment");
      }
    } else {
      toast.error("You don't have permission to delete this attachment");
    }
  };

  const handleDeleteNotation = async (notationId, collectionId) => {
    // Get the notation to check ownership
    const notation = externalLink.notations?.find((n) => n.id === notationId);

    // Only allow deletion if admin, owner of the notation, or has admin permissions
    if (
      isAdmin ||
      notation?.userId === systemUser?.id ||
      (isCollaborator && userRole === "admin")
    ) {
      try {
        await deleteNotation({
          notationId,
          collectionId: notation?.collectionId || collectionId,
        });
      } catch (error) {
        console.error("Error deleting notation:", error);
        toast.error("Failed to delete notation");
      }
    } else {
      toast.error("You don't have permission to delete this notation");
    }
  };

  const handleDeleteResource = async (resourceId) => {
    // Only allow deletion if admin or has admin permissions
    if (isAdmin || (isCollaborator && userRole === "admin")) {
      try {
        await removeResourcesMutation.mutateAsync({
          collectionId,
          externalLinkId: externalLink.id,
          resourceIds: [resourceId],
        });
      } catch (error) {
        console.error("Error removing resource:", error);
        toast.error("Failed to remove resource");
      }
    } else {
      toast.error("You don't have permission to remove this resource");
    }
  };

  const getLinkedResourceId = (resourceLink) =>
    resourceLink?.resourceId || resourceLink?.resource?.id || resourceLink?.id;

  const handleMoveResource = async (resourceLink, currentIndex, direction) => {
    if (!canAddContent) {
      toast.error("You don't have permission to reorder resources");
      return;
    }

    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= linkedResources.length) return;

    if (!collectionId || !externalLink?.id) {
      toast.error("Missing collection details for resource ordering");
      return;
    }

    const reorderedResources = [...linkedResources];
    const [movedResource] = reorderedResources.splice(currentIndex, 1);
    reorderedResources.splice(nextIndex, 0, movedResource);

    const resourceId = getLinkedResourceId(resourceLink);

    try {
      setReorderingResourceId(resourceId);

      await Promise.all(
        reorderedResources.map((item, orderPosition) =>
          updateResourceOrderMutation.mutateAsync({
            collectionId,
            externalLinkId: externalLink.id,
            resourceId: getLinkedResourceId(item),
            orderPosition,
          })
        )
      );

      toast.success("Resource order updated");
    } catch (error) {
      console.error("Error updating resource order:", error);
      toast.error("Failed to update resource order");
    } finally {
      setReorderingResourceId(null);
    }
  };

  const handleStartEditingResourceNote = (resourceLink) => {
    if (!canAddContent) {
      toast.error("You don't have permission to update this resource note");
      return;
    }

    setEditingResourceNoteId(getLinkedResourceId(resourceLink));
    setEditingResourceNoteValue(resourceLink?.notes || "");
  };

  const handleCancelEditingResourceNote = () => {
    setEditingResourceNoteId(null);
    setEditingResourceNoteValue("");
    setSavingResourceNoteId(null);
  };

  const handleSaveResourceNote = async (resourceLink) => {
    if (!canAddContent) {
      toast.error("You don't have permission to update this resource note");
      return;
    }

    const resourceId = getLinkedResourceId(resourceLink);

    if (!collectionId || !externalLink?.id || !resourceId) {
      toast.error("Missing resource details for note update");
      return;
    }

    const normalizedNotes = editingResourceNoteValue.trim();
    const currentNotes = (resourceLink?.notes || "").trim();

    if (normalizedNotes === currentNotes) {
      handleCancelEditingResourceNote();
      return;
    }

    try {
      setSavingResourceNoteId(resourceId);

      await updateResourceNotesMutation.mutateAsync({
        collectionId,
        externalLinkId: externalLink.id,
        resourceId,
        notes: normalizedNotes || null,
      });

      setEditingResourceNoteId(null);
      setEditingResourceNoteValue("");
    } catch (error) {
      console.error("Error updating resource note:", error);
    } finally {
      setSavingResourceNoteId(null);
    }
  };

  const handleCategoryClick = (category) => {
    if (category === "video") {
      setShowVideoBrowser(true);
    } else {
      setSelectedCategory(category);
      setShowCategoryModal(true);
    }
  };

  const getCategoryTitle = (category) => {
    if (!category) return "";
    return category.charAt(0).toUpperCase() + category.slice(1) + "s";
  };

  const getCategoryItems = (category) => {
    return resolvedLinkGroups?.[category] || [];
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case "video":
        return {
          bg: "bg-slate-50",
          text: "text-slate-700",
          badge: "bg-slate-100",
        };
      case "email":
        return {
          bg: "bg-slate-50",
          text: "text-slate-700",
          badge: "bg-slate-100",
        };
      case "trial":
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          badge: "bg-gray-100",
        };
      case "website":
        return {
          bg: "bg-slate-50",
          text: "text-slate-700",
          badge: "bg-slate-100",
        };
      case "document":
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          badge: "bg-gray-100",
        };
      case "research":
        return {
          bg: "bg-slate-50",
          text: "text-slate-700",
          badge: "bg-slate-100",
        };
      default:
        return {
          bg: "bg-gray-50",
          text: "text-gray-700",
          badge: "bg-gray-100",
        };
    }
  };

  // Bulk update handler for notations
  const handleBulkNotationSave = async () => {
    try {
      // Collect all update promises
      const updatePromises = [];
      const updatedNotationRanges = [];

      for (const notation of filteredNotations) {
        if (selectedNotations[notation.id]) {
          const nextStartDate =
            bulkNotationDates[notation.id] ||
            notation.startDate ||
            notation.start_date ||
            notation.date ||
            null;
          const updateData = {
            status: bulkNotationStatus || notation.status,
            collectionExternalLinkId: notation.collectionExternalLinkId,
            collectionId: notation.collectionId,
            date: nextStartDate,
            startDate: nextStartDate,
            endDate:
              bulkNotationDates[notation.id] ||
              notation.endDate ||
              notation.end_date ||
              notation.startDate ||
              notation.start_date ||
              notation.date ||
              null,
          };

          // Only add visibility to update if it's been changed
          if (bulkNotationVisibility) {
            updateData.visibility = bulkNotationVisibility;
          }

          // Add tags to update if any are selected
          if (bulkNotationTags && bulkNotationTags.length > 0) {
            // Merge existing tags with new tags, avoiding duplicates
            const existingTags = notation.tags || [];
            const existingTagIds = existingTags.map((tag) => tag.id);
            const newTags = bulkNotationTags.filter(
              (tag) => !existingTagIds.includes(tag.id)
            );
            updateData.tags = [...existingTags, ...newTags];
          }

          // Add update promise to array instead of awaiting immediately
          updatePromises.push(
            new Promise((resolve, reject) => {
              updateNotation(
                {
                  notationId: notation.id,
                  notationData: updateData,
                },
                {
                  onSuccess: resolve,
                  onError: reject,
                }
              );
            })
          );
          updatedNotationRanges.push(updateData);
        }
      }

      // Wait for all updates to complete
      await Promise.all(updatePromises);
      await handleMaybeExpandExternalLinkDates(
        getCombinedDateRangeValues(updatedNotationRanges)
      );

      // Clear bulk editing state
      setSelectedNotations({});
      setBulkNotationStatus("");
      setBulkNotationDates({});
      setBulkNotationVisibility("");
      setBulkNotationTags([]);
      setIsBulkNotationMode(false);

      // Refresh the external link data to ensure UI is updated
      if (refetchExternalLink) {
        await refetchExternalLink();
      }

      toast.success("Bulk update complete");
    } catch (error) {
      console.error("Error during bulk update:", error);
      toast.error("Failed to complete bulk update");
    }
  };

  const handleSelectNotation = (notationId, checked) => {
    setSelectedNotations((prev) => ({ ...prev, [notationId]: checked }));
  };

  const handleSelectAllNotations = (checked) => {
    const newSelected = {};
    if (checked) {
      filteredNotations.forEach((note) => {
        newSelected[note.id] = true;
      });
    }
    setSelectedNotations(newSelected);
  };

  const handleBulkNotationStatusChange = (e) => {
    setBulkNotationStatus(e.target.value);
  };

  const handleBulkNotationDateChange = (notationId, date) => {
    setBulkNotationDates((prev) => ({ ...prev, [notationId]: date }));
  };

  const handleBulkNotationVisibilityChange = (visibility) => {
    setBulkNotationVisibility(visibility);
  };

  const handleBulkNotationDelete = async () => {
    try {
      const selectedNotationIds = Object.keys(selectedNotations).filter(
        (id) => selectedNotations[id]
      );

      // Delete each selected notation
      for (const notationId of selectedNotationIds) {
        const notation = filteredNotations.find((n) => n.id === notationId);
        if (notation) {
          await handleDeleteNotation(notationId, notation.collectionId);
        }
      }

      // Clear selections and exit bulk mode
      setSelectedNotations({});
      setBulkNotationStatus("");
      setBulkNotationDates({});
      setBulkNotationVisibility("");
      setBulkNotationTags([]);
      setIsBulkNotationMode(false);

      toast.success(
        `Successfully deleted ${selectedNotationIds.length} notation${
          selectedNotationIds.length !== 1 ? "s" : ""
        }`
      );
    } catch (error) {
      console.error("Error deleting notations:", error);
      toast.error("Failed to delete selected notations");
    }
  };

  // AI Bulk Update handlers
  const handleAIBulkUpdates = () => {
    setShowAIBulkUpdates(true);
  };

  const handleAIBulkUpdatesComplete = async (updatedNotations) => {
    setShowAIBulkUpdates(false);
    setSelectedNotations({});
    setIsBulkNotationMode(false);
    await handleMaybeExpandExternalLinkDates(
      getCombinedDateRangeValues(updatedNotations || [])
    );

    // Invalidate the external link query to refetch the data
    await queryClient.invalidateQueries({
      queryKey: ["externalLinkById", externalLink?.id],
    });

    // Also invalidate the notations query if it exists
    await queryClient.invalidateQueries({
      queryKey: ["externalLinkNotations"],
    });

    // Force a refetch of the data
    await queryClient.refetchQueries({
      queryKey: ["externalLinkById", externalLink?.id],
    });

    // Also use the direct refetch function if available
    if (refetchExternalLink) {
      await refetchExternalLink();
    }
  };

  const getSelectedNotationsList = () => {
    return filteredNotations.filter(
      (notation) => selectedNotations[notation.id]
    );
  };

  // Handle calendar button click
  const handleCalendarClick = () => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

    if (isMobile) {
      // On mobile: always show the hover card
      setShowCalendarHover(true);

      // If we're showing the full calendar view, scroll to it
      if (showCalendarView) {
        setTimeout(() => {
          calendarRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    } else {
      // On desktop: toggle the full calendar view and scroll to it
      setShowCalendarView(!showCalendarView);

      // On desktop, also toggle the hover card visibility
      setShowCalendarHover(!showCalendarHover);

      // If we're showing the calendar view, scroll to it
      if (!showCalendarView) {
        setTimeout(() => {
          calendarRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
    }
  };

  // Add handlers for mouse events on desktop
  const handleCalendarMouseOver = () => {
    // Only show hover on desktop mouse over
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setShowCalendarHover(true);
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

  // Close the calendar hover card when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Handle calendar hover close
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

      if (
        showCalendarHover &&
        calendarButtonRef.current &&
        !calendarButtonRef.current.contains(event.target) &&
        !event.target.closest(".calendar-hover-card") &&
        !event.target.closest(".calendar-container") &&
        !isInteractingWithCalendarHover
      ) {
        if (!isMobile) {
          setShowCalendarHover(false);
        }
      }

      // Handle Add/AI dropdown close
      if (
        showAddAIDropdown &&
        addAIDropdownRef.current &&
        !addAIDropdownRef.current.contains(event.target)
      ) {
        setShowAddAIDropdown(false);
      }

      // Handle bulk update dropdown close
      if (
        showBulkUpdateDropdown &&
        bulkUpdateDropdownRef.current &&
        !bulkUpdateDropdownRef.current.contains(event.target)
      ) {
        setShowBulkUpdateDropdown(false);
      }

      // Handle attachment dropdown close
      if (
        showAttachmentDropdown &&
        attachmentDropdownRef.current &&
        !attachmentDropdownRef.current.contains(event.target)
      ) {
        setShowAttachmentDropdown(false);
      }

      // Handle settings dropdown close
      if (
        showSettingsDropdown &&
        settingsDropdownRef.current &&
        !settingsDropdownRef.current.contains(event.target)
      ) {
        setShowSettingsDropdown(false);
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

      // On mobile, keep the hover visible
      // On desktop, hide it since we're scrolling to the full view
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        setShowCalendarHover(false);
      }

      // Set a small timeout to ensure the calendar is rendered
      setTimeout(() => {
        calendarRef.current?.scrollIntoView({
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
  }, [
    showCalendarHover,
    isInteractingWithCalendarHover,
    showAddAIDropdown,
    showBulkUpdateDropdown,
    showAttachmentDropdown,
    showSettingsDropdown,
  ]);

  const handleDeleteCollaborator = (collaboratorUserId) => {
    if (window.confirm("Are you sure you want to remove this collaborator?")) {
      deleteCollaborator({
        externalLinkId: externalLink.id,
        collaboratorUserId,
      });
    }
  };

  // Add handler for Add/AI dropdown toggle
  const handleAddAIDropdownToggle = () => {
    setShowAddAIDropdown(!showAddAIDropdown);
  };

  // Add handler for Add/AI option selection
  const handleAddAIOptionSelect = (option) => {
    setShowAddAIDropdown(false);

    if (option === "add") {
      createNotationDraft();
    } else if (option === "create-notations") {
      // Launch AI Voice Memo functionality
      setShowAIVoiceMemo(true);
    } else if (option === "ai-bulk-update") {
      // Enable selection mode and show guidance
      setIsBulkNotationMode(true);
      setSelectedNotations({});
      setTimeout(() => {
        toast(
          'Now select the notations you want to update, then click "AI Update"',
          {
            icon: "💡",
          }
        );
      }, 100);
    }
  };

  return (
    <>
      {dateExpansionPrompt && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/45 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="date-expansion-title"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                  <FaCalendarAlt className="h-4 w-4" />
                </span>
                <div>
                  <h2
                    id="date-expansion-title"
                    className="text-base font-semibold text-slate-900"
                  >
                    Expand external link dates?
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    This task falls outside the current external link schedule.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDateExpansionPromptClose(false)}
                className="rounded-md p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
                aria-label="Close date expansion prompt"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 px-5 py-4 text-sm">
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Current external link dates
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {dateExpansionPrompt.currentRangeText}
                </div>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50/70 px-3 py-2.5">
                <div className="text-xs font-medium uppercase tracking-wide text-blue-600">
                  Task dates
                </div>
                <div className="mt-1 font-semibold text-blue-900">
                  {dateExpansionPrompt.taskRangeText}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Proposed external link dates
                </div>
                <div className="mt-1 font-semibold text-slate-900">
                  {dateExpansionPrompt.nextRangeText}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => handleDateExpansionPromptClose(false)}
                className="inline-flex justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Save task only
              </button>
              <button
                type="button"
                onClick={() => handleDateExpansionPromptClose(true)}
                className="inline-flex justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Expand date range
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Enterprise Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16 overflow-visible">
              <div className="flex items-center space-x-8">
                <button
                  onClick={handleBackNavigation}
                  className="text-gray-900 hover:text-gray-900 flex items-center gap-2"
                >
                  <FaChevronLeft className="text-sm" />
                  <span className="hidden sm:inline">Back</span>
                </button>

                {/* Breadcrumb */}
                <nav className="hidden md:flex items-center space-x-2 text-sm">
                  <FaHome className="text-gray-600" />
                  <span className="text-gray-600">/</span>
                  <span className="text-gray-800">Collections</span>
                  <span className="text-gray-600">/</span>
                  <span className="text-gray-900 font-medium">
                    {externalLink.name}
                  </span>
                </nav>
              </div>

              <div className="flex items-center space-x-2 sm:space-x-4">
                {/* Calendar Button - Hide in shared views */}
                {!sharedToken && (
                  <div className="relative" ref={calendarButtonRef}>
                    <button
                      onClick={handleCalendarClick}
                      onMouseEnter={handleCalendarMouseOver}
                      onMouseLeave={handleCalendarMouseOut}
                      className="inline-flex items-center px-2 sm:px-3 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50 whitespace-nowrap"
                      aria-label="View calendar"
                    >
                      <FaCalendar className="text-gray-700" />
                      <span className="ml-2 hidden sm:inline">Calendar</span>
                    </button>

                    {showCalendarHover && combinedEvents?.length > 0 && (
                      <div
                        className="fixed sm:absolute inset-x-0 sm:inset-x-auto sm:right-0 sm:left-auto top-[calc(100%+0.5rem)] sm:top-full mt-0 sm:mt-2 z-50 calendar-hover-card flex justify-center sm:justify-end w-full sm:w-auto px-4 sm:px-0 calendar-container"
                        onClick={preventCalendarClose}
                        onTouchEnd={preventCalendarClose}
                        onTouchStart={preventCalendarClose}
                        onMouseDown={preventCalendarClose}
                        onMouseEnter={() =>
                          setIsInteractingWithCalendarHover(true)
                        }
                        onMouseLeave={() =>
                          setIsInteractingWithCalendarHover(false)
                        }
                      >
                        <div
                          className="w-full max-w-[95vw] sm:max-w-md calendar-hover-card rounded-lg shadow-lg bg-white border border-gray-200"
                          onClick={preventCalendarClose}
                        >
                          <CalendarHoverInfo
                            events={combinedEvents.map((event) => ({
                              ...event,
                              type: event.type || "external_link",
                              startDate: event.startDate || event.date,
                              endDate: event.endDate || event.date,
                              title: event.title || event.name || "Untitled",
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
                            onClose={() => setShowCalendarHover(false)}
                            isSharedView={!!sharedToken}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Settings Dropdown */}
                <div className="relative" ref={settingsDropdownRef}>
                  <button
                    onClick={() =>
                      setShowSettingsDropdown(!showSettingsDropdown)
                    }
                    className="inline-flex items-center px-2 sm:px-3 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50 whitespace-nowrap"
                    aria-label="Settings"
                  >
                    <FaCog className="text-gray-700" />
                    <span className="ml-2 hidden sm:inline">Settings</span>
                  </button>

                  {showSettingsDropdown && (
                    <div
                      className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                      style={{ zIndex: 9999 }}
                    >
                      <div className="py-1" role="menu">
                        {/* JSON/Database Option - Only for Admins */}
                        {isAdmin && onShowPublicJsonModal && (
                          <button
                            onClick={() => {
                              onShowPublicJsonModal();
                              setShowSettingsDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            role="menuitem"
                          >
                            <FaDatabase className="mr-3 text-gray-500" />
                            Public JSON
                          </button>
                        )}

                        {/* Share Option - Only show when Public JSON is enabled */}
                        {publicJsonEnabled && (
                          <button
                            onClick={() => {
                              setShowShareModal(true);
                              setShowSettingsDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            role="menuitem"
                          >
                            <FaShare className="mr-3 text-gray-500" />
                            Share Public Link
                          </button>
                        )}

                        {/* Export Option */}
                        <button
                          onClick={() => {
                            setShowExportModal(true);
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          role="menuitem"
                        >
                          <FaDownload className="mr-3 text-gray-500" />
                          Export
                        </button>

                        {/* Chat Option */}
                        <button
                          onClick={() => {
                            setShowChat(!showChat);
                            setShowSettingsDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                          role="menuitem"
                        >
                          <FaComments className="mr-3 text-gray-500" />
                          Chat
                        </button>

                        {/* Slack Settings Option - Only for admins */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setShowSlackModal(true);
                              setShowSettingsDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                            role="menuitem"
                          >
                            <FaSlack className="mr-3 text-gray-500" />
                            Slack Settings
                          </button>
                        )}

                        {/* Edit Option */}
                        {canEdit && (
                          <>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={() => {
                                setIsEditing(true);
                                setShowSettingsDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center font-medium"
                              role="menuitem"
                            >
                              <FaEdit className="mr-3 text-blue-500" />
                              Edit Resource
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Resource Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 sm:mb-8">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        externalLink.status === "active"
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    />
                    <span className="ml-2 text-sm font-medium text-gray-800 capitalize">
                      {externalLink.status || "Active"}
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                    {externalLink.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-900">
                      <FaFlask className="mr-1.5 h-3 w-3" />
                      {externalLink.type.replace("_", " ")}
                    </span>

                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-900">
                      <FaCalendarAlt className="mr-1.5 h-3 w-3" />
                      {formatLongDate(
                        externalLink.date ?? externalLink.dateAdded
                      )}
                    </span>

                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-900">
                      {externalLink.visibility === "public" ? (
                        <>
                          <FaGlobeAmericas className="mr-1.5 h-3 w-3" />
                          Public
                        </>
                      ) : (
                        <>
                          <FaLock className="mr-1.5 h-3 w-3" />
                          {externalLink.visibility
                            ? externalLink.visibility.charAt(0).toUpperCase() +
                              externalLink.visibility.slice(1)
                            : "Private"}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Tags Section */}
                  <div className="mt-4">
                    {showTagsEditor && canEdit ? (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 flex items-center">
                            <FaTag className="mr-2 text-blue-600" />
                            Edit Tags
                          </h4>
                          <button
                            onClick={() => {
                              setShowTagsEditor(false);
                              setShowAllTags(false);
                            }}
                            className="text-gray-500 hover:text-gray-700 p-1"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                        <TagInput
                          value={linkTags}
                          onChange={handleTagsChange}
                          externalLinkId={externalLink.id}
                          placeholder="Add tags to categorize this link..."
                          disabled={isLoadingTags}
                        />
                      </div>
                    ) : (
                      <div className="group">
                        {linkTags.length > 0 ? (
                          <div
                            className={`flex items-center gap-2 ${
                              canEdit
                                ? "cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                                : ""
                            }`}
                            onClick={() => canEdit && setShowTagsEditor(true)}
                            title={canEdit ? "Click to edit tags" : ""}
                          >
                            <FaTag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1.5 min-w-0">
                              {(showAllTags
                                ? linkTags
                                : linkTags.slice(0, 2)
                              ).map((tag) => (
                                <span
                                  key={tag.id}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border"
                                  style={{
                                    backgroundColor: `${tag.color}08`,
                                    borderColor: `${tag.color}20`,
                                    color: tag.color,
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                              {!showAllTags && linkTags.length > 2 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllTags(true);
                                  }}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                  +{linkTags.length - 2}
                                </button>
                              )}
                              {showAllTags && linkTags.length > 2 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowAllTags(false);
                                  }}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                >
                                  <FaChevronUp className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                            {canEdit && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                <FaEdit className="w-3 h-3 text-gray-400" />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            {canEdit ? (
                              <button
                                onClick={() => setShowTagsEditor(true)}
                                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                              >
                                <FaTag className="w-4 h-4 text-gray-400" />
                                <span>Add tags</span>
                                <FaPlus className="w-3 h-3 text-gray-400" />
                              </button>
                            ) : (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <FaTag className="w-4 h-4 text-gray-400" />
                                <span>No tags</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hashtags Edit Section */}
                  {showHashtagsEditor && canEdit && (
                    <div className="mt-4">
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 flex items-center">
                            <FaHashtag className="mr-2 text-gray-500" />
                            Edit Social Media Hashtags
                          </h4>
                          <button
                            onClick={() => {
                              setShowHashtagsEditor(false);
                              // Save hashtags when closing editor
                              const hashtagsString =
                                externalLinkHashtags.join(",");
                              if (hashtagsString !== externalLink.hashtags) {
                                handleUpdateExternalLink({
                                  ...externalLink,
                                  hashtags: hashtagsString,
                                });
                              }
                            }}
                            className="text-gray-500 hover:text-gray-700 p-1"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                        <HashtagInput
                          value={externalLinkHashtags}
                          onChange={setExternalLinkHashtags}
                          label=""
                          placeholder="Add hashtags for social media tracking (e.g., CancerResearch, ChRCC)"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {isVideoUrl(externalLink.url) && (
                    <button
                      onClick={() => setShowTimestamps(true)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50"
                    >
                      <FaPlay className="mr-2 text-gray-700" />
                      Watch Video
                    </button>
                  )}

                  {/* Hashtags Button */}
                  {externalLinkHashtags.length > 0 && (
                    <button
                      onClick={() => {
                        const hashtagsParam = encodeURIComponent(
                          externalLinkHashtags.join(",")
                        );
                        router.push(
                          `/social-media/hashtags?hashtags=${hashtagsParam}`
                        );
                      }}
                      className="inline-flex items-center px-4 py-2 bg-slate-50 shadow-sm text-sm font-medium rounded-md text-slate-600 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <FaHashtag className="mr-2 text-slate-500" />
                      Social Media Hashtags ({externalLinkHashtags.length})
                    </button>
                  )}

                  {/* Edit Hashtags Button */}
                  {canEdit && (
                    <button
                      onClick={() => setShowHashtagsEditor(!showHashtagsEditor)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50"
                    >
                      <FaEdit className="mr-2 text-gray-700" />
                      {showHashtagsEditor ? "Close Editor" : "Edit Hashtags"}
                    </button>
                  )}

                  <a
                    href={externalLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md text-blue-500 bg-blue-50 hover:bg-blue-100 border-blue-200"
                  >
                    Visit Resource
                    <FaLink className="ml-2" />
                  </a>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-4">
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => setActiveHeaderTab("details")}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      activeHeaderTab === "details"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <FaFileAlt className="h-4 w-4" />
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveHeaderTab("whiteboard")}
                    className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      activeHeaderTab === "whiteboard"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <FaChalkboard className="h-4 w-4" />
                    Whiteboard
                  </button>
                </div>
              </div>

              {/* Collaborators header section - display only */}
              {isAdmin && collaborators?.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center">
                    <h3 className="text-sm font-medium text-gray-900 flex items-center">
                      <FaUsers className="mr-2 text-gray-500" />
                      Collaborators
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {collaborators.length}
                      </span>
                    </h3>
                  </div>

                  <div className="mt-2">
                    {isLoadingCollaborators ? (
                      <div className="text-sm text-gray-500">
                        Loading collaborators...
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Group collaborators by source */}
                        {collaborators.some((c) => c.isFromCollection) && (
                          <div>
                            <p className="text-xs text-gray-500 mb-1 flex items-center">
                              <FaLink className="mr-1" />
                              From collection
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {collaborators
                                .filter((c) => c.isFromCollection)
                                .map((collaborator) => (
                                  <div
                                    key={collaborator.id}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-800 border border-blue-200"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium mr-1">
                                      {collaborator.name?.charAt(0) ||
                                        collaborator.email?.charAt(0) ||
                                        "?"}
                                    </div>
                                    <span>
                                      {collaborator.name || collaborator.email}
                                    </span>
                                    {collaborator.role && (
                                      <span className="ml-1 text-xs text-blue-600">
                                        ({collaborator.role})
                                      </span>
                                    )}
                                    <span
                                      className="ml-2 text-xs text-blue-500"
                                      title="Inherited from collection"
                                    >
                                      <FaLink />
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        {collaborators.some((c) => !c.isFromCollection) && (
                          <div>
                            {collaborators.some((c) => c.isFromCollection) && (
                              <p className="text-xs text-gray-500 mb-1 mt-2">
                                Direct collaborators
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2">
                              {collaborators
                                .filter((c) => !c.isFromCollection)
                                .map((collaborator) => (
                                  <div
                                    key={collaborator.id}
                                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    <div className="w-5 h-5 rounded-full bg-gray-500 text-white flex items-center justify-center text-xs font-medium mr-1">
                                      {collaborator.name?.charAt(0) ||
                                        collaborator.email?.charAt(0) ||
                                        "?"}
                                    </div>
                                    <span>
                                      {collaborator.name || collaborator.email}
                                    </span>
                                    {collaborator.role && (
                                      <span className="ml-1 text-xs text-gray-500">
                                        ({collaborator.role})
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteCollaborator(
                                          collaborator.userId
                                        )
                                      }
                                      disabled={isDeleting}
                                      className="ml-2 text-red-500 hover:text-red-700 text-xs p-1 hover:bg-red-50 rounded-full transition-colors"
                                      title="Remove collaborator"
                                    >
                                      <FaTimes />
                                    </button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {activeHeaderTab === "whiteboard" ? (
            <ExternalLinkWhiteboard
              externalLinkId={externalLink.id}
              title={externalLink.name}
              whiteboardData={externalLink.whiteboardData}
              canEdit={canEdit}
              onSave={(whiteboardData) =>
                handleUpdateSingleField(externalLink.id, { whiteboardData })
              }
            />
          ) : (
            <div
              className={`grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 ${
                showSidePanels ? "lg:grid-cols-3" : ""
              }`}
            >
            {/* Left Column - Description & Notes */}
            <div
              className={`space-y-4 sm:space-y-6 lg:space-y-8 ${
                showSidePanels ? "lg:col-span-2" : ""
              }`}
            >
              {/* Description Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Description
                  </h2>
                  <div className="prose prose-gray max-w-none max-h-[520px] overflow-y-auto">
                    <div
                      className="text-gray-900"
                      dangerouslySetInnerHTML={{
                        __html: formatHtmlContent(externalLink.description),
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
                <div className="px-2 py-4 sm:px-6 sm:py-6 overflow-visible">
                  {/* Bulk Import Modal */}
                  {showBulkImport &&
                    canAddContent &&
                    collectionId && (
                      <div className="mb-4 relative z-10">
                        <BulkNotationImport
                          collectionId={collectionId}
                          externalLinkId={externalLink.id}
                          onComplete={async (result) => {
                            await handleMaybeExpandExternalLinkDates(
                              getCombinedDateRangeValues(
                                result?.successfulItems || []
                              )
                            );
                            // Refresh notations after import
                            if (refetchExternalLink) {
                              refetchExternalLink();
                            }
                            setShowBulkImport(false);
                          }}
                        />
                      </div>
                    )}

                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <h2 className="text-lg font-medium text-gray-900">Notes</h2>
                    <div
                      className={`flex gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap overflow-x-visible relative ${
                        showAddAIDropdown || showBulkUpdateDropdown
                          ? "pb-32 sm:pb-0"
                          : ""
                      }`}
                    >
                      <button
                        onClick={() => setShowSidePanels((prev) => !prev)}
                        className={`inline-flex items-center px-2 py-1.5 sm:px-3 sm:py-2 border shadow-sm text-sm font-medium rounded-md sm:rounded-lg transition-colors flex-shrink-0 ${
                          showSidePanels
                            ? "border-gray-300 text-gray-900 bg-white hover:bg-gray-50"
                            : "border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100"
                        }`}
                        aria-pressed={!showSidePanels}
                        aria-label={
                          showSidePanels
                            ? "Hide side panels and expand notes"
                            : "Show side panels"
                        }
                      >
                        {showSidePanels ? (
                          <FaEyeSlash className="mr-1.5 sm:mr-2 text-current" />
                        ) : (
                          <FaEye className="mr-1.5 sm:mr-2 text-current" />
                        )}
                        <span className="hidden xs:inline">
                          {showSidePanels ? "Focus Notes" : "Show Panels"}
                        </span>
                        <span className="xs:hidden">
                          {showSidePanels ? "Focus" : "Panels"}
                        </span>
                      </button>

                      {/* Calendar button for notes */}
                      <button
                        onClick={() => {
                          setShowCalendarView(true);
                          // Create a more specific event with both calendar view and week-view toggle
                          const event = new CustomEvent("setCalendarViewMode", {
                            detail: {
                              viewMode: "week",
                              weekViewMode: "calendar",
                            },
                          });
                          window.dispatchEvent(event);

                          // Force scroll to calendar view
                          setTimeout(() => {
                            calendarRef.current?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                          }, 100);
                        }}
                        className="inline-flex items-center p-1.5 sm:p-2 rounded-md text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
                        aria-label="View calendar"
                      >
                        <FaCalendar />
                      </button>

                      {/* Combined Add/AI Button with dropdown */}
                      {canAddContent && (
                        <div className="relative" ref={addAIDropdownRef}>
                          <button
                            onClick={handleAddAIDropdownToggle}
                            className="inline-flex items-center px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md sm:rounded-lg text-gray-900 bg-white hover:bg-gray-50 transition-colors flex-shrink-0"
                          >
                            <FaPlus className="mr-1.5 sm:mr-2 text-gray-700" />
                            <span className="hidden xs:inline">Add</span>
                            <span className="xs:hidden">Add</span>
                            <FaChevronDown
                              className={`ml-1.5 sm:ml-2 transition-transform ${
                                showAddAIDropdown ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {showAddAIDropdown && (
                            <div className="absolute left-0 sm:right-0 sm:left-auto top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100] origin-top-left sm:origin-top-right">
                              {/* Add Note Option */}
                              <button
                                onClick={() => handleAddAIOptionSelect("add")}
                                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700"
                              >
                                <FaPlus className="w-5 h-5 text-gray-600" />
                                <div>
                                  <div className="font-medium">Add Note</div>
                                  <div className="text-xs text-gray-500">
                                    Create a new notation manually
                                  </div>
                                </div>
                              </button>

                              {/* Divider */}
                              <div className="border-t border-gray-200 my-1" />

                              {/* AI Options Section */}
                              <div className="px-3 py-1">
                                <div className="text-xs text-gray-500 font-medium">
                                  AI Options
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleAddAIOptionSelect("create-notations")
                                }
                                className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700"
                              >
                                <FaMicrophone className="w-5 h-5 text-blue-600" />
                                <div>
                                  <div className="font-medium">
                                    Create New Notations
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Use AI voice memo to create notations
                                  </div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Review Submissions button for admins and advocates */}
                      {(isAdmin || isAdvocate) && (
                        <button
                          onClick={() => setShowSubmissionsManager(true)}
                          className="inline-flex items-center px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md sm:rounded-lg text-gray-900 bg-white hover:bg-gray-50 flex-shrink-0"
                        >
                          <FaClipboardCheck className="mr-1.5 sm:mr-2 text-gray-700" />
                          <span className="hidden xs:inline">
                            Review Submissions
                          </span>
                          <span className="xs:hidden">Review</span>
                        </button>
                      )}

                      {/* Bulk Button */}
                      {canEdit && !isBulkNotationMode && (
                        <div className="relative" ref={bulkUpdateDropdownRef}>
                          <button
                            onClick={() =>
                              setShowBulkUpdateDropdown(!showBulkUpdateDropdown)
                            }
                            className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded sm:rounded-lg text-sm font-medium border transition-colors duration-200 bg-white text-blue-700 border-blue-300 hover:bg-blue-50 flex-shrink-0"
                          >
                            Bulk
                            <FaChevronDown
                              className={`ml-2 transition-transform ${
                                showBulkUpdateDropdown ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {showBulkUpdateDropdown && (
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100] origin-top-right">
                              {/* Bulk Import Option */}
                              {canAddContent && (
                                <button
                                  onClick={() => {
                                    setShowBulkUpdateDropdown(false);
                                    setShowBulkImport(true);
                                  }}
                                  className="flex items-center gap-3 w-full px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
                                >
                                  <FaUpload className="w-4 h-4 text-blue-500" />
                                  <div>
                                    <div className="font-medium">Import</div>
                                    <div className="text-xs text-gray-500">
                                      Import multiple notations from JSON
                                    </div>
                                  </div>
                                </button>
                              )}

                              {/* Divider if import option exists */}
                              {canAddContent && (
                                <div className="border-t border-gray-200 my-1" />
                              )}

                              {/* Manual Update Option */}
                              <button
                                onClick={() => {
                                  if (filteredNotations.length === 0) {
                                    toast.error(
                                      "No notations available to update"
                                    );
                                    setShowBulkUpdateDropdown(false);
                                    return;
                                  }
                                  setShowBulkUpdateDropdown(false);
                                  setIsBulkNotationMode(true);
                                  setSelectedNotations({});
                                }}
                                disabled={filteredNotations.length === 0}
                                className={`flex items-center gap-3 w-full px-4 py-2 text-left ${
                                  filteredNotations.length === 0
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-gray-50 text-gray-700"
                                }`}
                              >
                                <FaEdit className="w-4 h-4 text-gray-500" />
                                <div>
                                  <div className="font-medium">Update</div>
                                  <div className="text-xs text-gray-500">
                                    Update status, dates & tags
                                  </div>
                                </div>
                              </button>

                              {/* AI Update Option */}
                              <button
                                onClick={() => {
                                  if (filteredNotations.length === 0) {
                                    toast.error(
                                      "No notations available to update"
                                    );
                                    setShowBulkUpdateDropdown(false);
                                    return;
                                  }
                                  setShowBulkUpdateDropdown(false);
                                  setIsBulkNotationMode(true);
                                  setSelectedNotations({});
                                  // After selection, show AI modal
                                  setTimeout(() => {
                                    toast(
                                      'Select notations then click "AI Update"',
                                      {
                                        icon: "💡",
                                      }
                                    );
                                  }, 100);
                                }}
                                disabled={filteredNotations.length === 0}
                                className={`flex items-center gap-3 w-full px-4 py-2 text-left ${
                                  filteredNotations.length === 0
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-gray-50 text-gray-700"
                                }`}
                              >
                                <FaMagic className="w-4 h-4 text-green-500" />
                                <div>
                                  <div className="font-medium">AI Update</div>
                                  <div className="text-xs text-gray-500">
                                    Use AI to update notations
                                  </div>
                                </div>
                              </button>

                              {/* Divider before delete */}
                              <div className="border-t border-gray-200 my-1" />

                              {/* Delete Option */}
                              <button
                                onClick={() => {
                                  if (filteredNotations.length === 0) {
                                    toast.error(
                                      "No notations available to delete"
                                    );
                                    setShowBulkUpdateDropdown(false);
                                    return;
                                  }
                                  setShowBulkUpdateDropdown(false);
                                  setIsBulkNotationMode(true);
                                  setSelectedNotations({});
                                }}
                                disabled={filteredNotations.length === 0}
                                className={`flex items-center gap-3 w-full px-4 py-2 text-left ${
                                  filteredNotations.length === 0
                                    ? "opacity-50 cursor-not-allowed"
                                    : "hover:bg-red-50 text-red-700"
                                }`}
                              >
                                <FaTrash className="w-4 h-4 text-red-500" />
                                <div>
                                  <div className="font-medium">Delete</div>
                                  <div className="text-xs text-red-500">
                                    Select and delete multiple notations
                                  </div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Exit Bulk Update Button - Show when in bulk mode */}
                      {canEdit && isBulkNotationMode && (
                        <button
                          onClick={() => {
                            setIsBulkNotationMode(false);
                            setSelectedNotations({});
                            setBulkNotationStatus("");
                            setBulkNotationDates({});
                            setBulkNotationVisibility("");
                            setBulkNotationTags([]);
                          }}
                          className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded sm:rounded-lg text-sm font-medium border transition-colors duration-200 bg-red-50 text-red-700 border-red-300 hover:bg-red-100 flex-shrink-0"
                        >
                          <FaTimes className="mr-2" />
                          Exit Bulk Update
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Status filter tabs */}
                  <div className="flex overflow-x-auto pb-2 mb-4 border-b border-gray-200 no-scrollbar relative z-0">
                    <button
                      onClick={() => handleTabChange("all")}
                      className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap mr-2 rounded-md transition-colors ${
                        activeNotesTab === "all"
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      All Active
                      <span
                        className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                          activeNotesTab === "all"
                            ? "bg-gray-200"
                            : "bg-gray-100"
                        }`}
                      >
                        {notationCounts.all}
                      </span>
                    </button>
                    <button
                      onClick={() => handleTabChange("pending")}
                      className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap mr-2 rounded-md transition-colors ${
                        activeNotesTab === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      Pending
                      <span
                        className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                          activeNotesTab === "pending"
                            ? "bg-yellow-200"
                            : "bg-gray-100"
                        }`}
                      >
                        {notationCounts.pending}
                      </span>
                    </button>
                    <button
                      onClick={() => handleTabChange("inprogress")}
                      className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap mr-2 rounded-md transition-colors ${
                        activeNotesTab === "inprogress"
                          ? "bg-purple-100 text-purple-800"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      In Progress
                      <span
                        className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                          activeNotesTab === "inprogress"
                            ? "bg-purple-200"
                            : "bg-gray-100"
                        }`}
                      >
                        {notationCounts.inprogress}
                      </span>
                    </button>
                    <button
                      onClick={() => handleTabChange("completed")}
                      className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap mr-2 rounded-md transition-colors ${
                        activeNotesTab === "completed"
                          ? "bg-green-100 text-green-800"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      Completed
                      <span
                        className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                          activeNotesTab === "completed"
                            ? "bg-green-200"
                            : "bg-gray-100"
                        }`}
                      >
                        {notationCounts.completed}
                      </span>
                    </button>
                    <button
                      onClick={() => handleTabChange("archived")}
                      className={`px-3 py-1.5 text-sm font-medium whitespace-nowrap rounded-md transition-colors ${
                        activeNotesTab === "archived"
                          ? "bg-gray-200 text-gray-800"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      Archived
                      <span
                        className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
                          activeNotesTab === "archived"
                            ? "bg-gray-300"
                            : "bg-gray-100"
                        }`}
                      >
                        {notationCounts.archived}
                      </span>
                    </button>
                  </div>

                  {/* Bulk Actions Bar for Notations */}
                  {isBulkNotationMode && (
                    <div className="mb-4">
                      {/* Instructions Banner - Show when no notations are selected */}
                      {Object.values(selectedNotations).filter(Boolean)
                        .length === 0 ? (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center gap-2 text-sm text-blue-800">
                            <FaInfoCircle className="text-blue-600 flex-shrink-0" />
                            <span>
                              <strong>Bulk Update Mode:</strong> Select
                              notations using the checkboxes below to update
                              them.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                          {/* Compact Header */}
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-4 py-2.5 border-b border-blue-200">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-blue-900">
                                  Bulk Actions
                                </span>
                                <span className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-0.5 rounded-full">
                                  {
                                    Object.values(selectedNotations).filter(
                                      Boolean
                                    ).length
                                  }{" "}
                                  selected
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const selectedCount =
                                      Object.values(selectedNotations).filter(
                                        Boolean
                                      ).length;
                                    if (
                                      window.confirm(
                                        `Delete ${selectedCount} selected notation${
                                          selectedCount !== 1 ? "s" : ""
                                        }? This cannot be undone.`
                                      )
                                    ) {
                                      handleBulkNotationDelete();
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-xs font-medium flex items-center gap-1.5 shadow-sm"
                                >
                                  <FaTimes className="w-3 h-3" />
                                  Delete
                                </button>
                                <button
                                  onClick={handleBulkNotationSave}
                                  className="px-4 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium shadow-sm"
                                >
                                  Save All
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Controls Grid */}
                          <div className="p-4 space-y-3">
                            {/* Status and Visibility Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-700">
                                  Status
                                </label>
                                <SelectField
                                  options={STATUS_OPTIONS.map((opt) => ({
                                    id: opt.id,
                                    name: opt.label,
                                  }))}
                                  value={
                                    STATUS_OPTIONS.map((opt) => ({
                                      id: opt.id,
                                      name: opt.label,
                                    })).find(
                                      (opt) => opt.id === bulkNotationStatus
                                    ) || null
                                  }
                                  onChange={(opt) =>
                                    setBulkNotationStatus(opt?.id || "")
                                  }
                                  placeholder="Choose status..."
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-700">
                                  Visibility
                                </label>
                                <SelectField
                                  value={
                                    bulkNotationVisibility
                                      ? {
                                          id: bulkNotationVisibility,
                                          name:
                                            bulkNotationVisibility === "private"
                                              ? "Only Me"
                                              : bulkNotationVisibility
                                              ? bulkNotationVisibility
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                bulkNotationVisibility.slice(1)
                                              : "",
                                        }
                                      : null
                                  }
                                  onChange={(option) =>
                                    setBulkNotationVisibility(option?.id || "")
                                  }
                                  options={[
                                    { id: "private", name: "Only Me" },
                                    {
                                      id: "collaborators",
                                      name: "Collaborators",
                                    },
                                    { id: "public", name: "Public" },
                                  ]}
                                  placeholder="Choose visibility..."
                                />
                              </div>
                            </div>

                            {/* Tags Section */}
                            <div className="space-y-1.5 pt-2 border-t border-gray-100">
                              <label className="text-xs font-medium text-gray-700">
                                Tags
                              </label>
                              <TagInput
                                value={bulkNotationTags}
                                onChange={setBulkNotationTags}
                                placeholder="Add tags to all selected..."
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Tags will be added when you click &quot;Save
                                All&quot;
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {/* Select All Checkbox for Notations */}

                  <div className="mt-6">
                    {isPreparingNotation && (
                      <div className="mb-4 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                        <FaSpinner className="animate-spin" />
                        Preparing a new note...
                      </div>
                    )}

                    {editingNotation?.id && (
                      <ExternalLinkNotationComposer
                        notation={editingNotation}
                        externalLinkId={externalLink.id}
                        isCollaborator={isCollaborator && userRole !== "admin"}
                        isNewDraft={Boolean(editingNotation.isNewDraft)}
                        onNotationSaved={handleMaybeExpandExternalLinkDates}
                        onClose={async () => {
                          setEditingNotation(null);
                          if (refetchExternalLink) {
                            await refetchExternalLink();
                          }
                        }}
                      />
                    )}

                    <NotationsList
                      notations={filteredNotations}
                      onEditNotation={(notation) => {
                        // Only allow editing if user is admin, owner of the notation, or admin collaborator
                        if (
                          isAdmin ||
                          isOwner(notation) ||
                            (isCollaborator &&
                            (userRole === "admin" || userRole === "editor"))
                        ) {
                          setEditingNotation({
                            ...notation,
                            isNewDraft: false,
                          });
                        } else {
                          toast.error(
                            "You don't have permission to edit this notation"
                          );
                        }
                      }}
                      onDeleteNotation={handleDeleteNotation}
                      onCopyNotation={(notation) => {
                        createNotationDraft({
                          title: `Copy of ${notation.title || "Untitled note"}`,
                          notes: notation.notes || "",
                          category: notation.category,
                          status: notation.status,
                          visibility:
                            notation.visibility ||
                            (isCollaborator && userRole !== "admin"
                              ? "unlisted"
                              : "private"),
                          highlighted: notation.highlighted,
                          startDate:
                            notation.startDate ||
                            notation.start_date ||
                            notation.date,
                          endDate:
                            notation.endDate ||
                            notation.end_date ||
                            notation.startDate ||
                            notation.start_date ||
                            notation.date,
                          tags: notation.tags || [],
                        });
                      }}
                      isAdmin={isAdmin}
                      isAdvocate={isAdvocate}
                      isCollaborator={isCollaborator}
                      userRole={userRole}
                      userId={systemUser?.id}
                      isBulkMode={isBulkNotationMode}
                      selectedNotations={selectedNotations}
                      onSelectNotation={handleSelectNotation}
                      bulkDates={bulkNotationDates}
                      onBulkDateChange={handleBulkNotationDateChange}
                      highlightNotationId={highlightNotationId}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Attachments & Links */}
            {showSidePanels && (
              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {/* Attachments Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">
                    <h2 className="text-lg font-medium text-gray-900">
                      Attachments
                    </h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* View All Attachments button */}
                      {(externalLink?.attachments?.length || 0) > 0 && (
                        <button
                          onClick={() => setShowAttachmentBrowser(true)}
                          className="inline-flex items-center px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <FaEye className="mr-1 sm:mr-1.5 text-gray-700" />
                          <span className="hidden xs:inline">Browse All</span>
                          <span className="xs:hidden">Browse</span>
                        </button>
                      )}
                      {/* Add Attachment dropdown - available to all collaborators */}
                      {canAddContent && (
                        <div className="relative" ref={attachmentDropdownRef}>
                          <button
                            onClick={() =>
                              setShowAttachmentDropdown(!showAttachmentDropdown)
                            }
                            className="inline-flex items-center px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50"
                          >
                            <FaPlus className="mr-1 sm:mr-1.5 text-gray-700" />
                            <span className="hidden xs:inline">Add File</span>
                            <span className="xs:hidden">Add</span>
                            <FaChevronDown className="ml-1 h-3 w-3" />
                          </button>
                          {showAttachmentDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                              <button
                                onClick={() => {
                                  setShowAttachmentDropdown(false);
                                  setShowAddAttachment(true);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-t-lg border-b border-gray-100 transition-colors"
                              >
                                <FaPaperclip className="h-5 w-5 text-blue-600" />
                                <div className="text-left">
                                  <div className="font-medium">Upload File</div>
                                  <div className="text-xs text-gray-500">
                                    Upload a file manually
                                  </div>
                                </div>
                              </button>
                              <button
                                onClick={() => {
                                  setShowAttachmentDropdown(false);
                                  setShowAIAttachmentModal(true);
                                }}
                                className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors"
                              >
                                <FaMagic className="h-5 w-5 text-blue-600" />
                                <div className="text-left">
                                  <div className="font-medium">AI Extract</div>
                                  <div className="text-xs text-gray-500">
                                    Extract content from image with AI
                                  </div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Image Attachments */}
                  {imageAttachments.length > 0 && (
                    <div className="mb-6">
                      <ImageBrowser
                        images={imageAttachments}
                        onClose={() => {
                          setShowAddAttachment(false);
                          setCurrentImageIndex(0);
                        }}
                        onDelete={handleDeleteAttachment}
                        isAdmin={isAdmin}
                        isCollaborator={isCollaborator}
                        userRole={userRole}
                        systemUserId={systemUser?.id}
                      />
                    </div>
                  )}

                  {/* Video Attachments */}
                  {videoAttachments.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-700 mb-3">
                        Videos ({videoAttachments.length})
                      </h3>
                      <VideoAttachmentBrowser
                        videos={videoAttachments}
                        onClose={() => {
                          setShowAddAttachment(false);
                        }}
                        onDelete={handleDeleteAttachment}
                        isAdmin={isAdmin}
                        isCollaborator={isCollaborator}
                        userRole={userRole}
                        systemUserId={systemUser?.id}
                      />
                    </div>
                  )}

                  {/* Other Non-Media Attachments */}
                  {nonMediaAttachments.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-md font-medium text-gray-700">
                        Other Files ({nonMediaAttachments.length})
                      </h3>
                      {nonMediaAttachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                          onClick={() => handleAttachmentClick(attachment)}
                        >
                          <div className="flex-shrink-0 h-10 w-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                            <FaFileAlt className="text-gray-700" />
                          </div>
                          <div className="ml-4 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {attachment.title}
                            </p>
                            <p className="text-sm text-gray-800 truncate">
                              {attachment.description}
                            </p>
                            {attachment.userId === systemUser?.id && (
                              <span className="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                You
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Edit button - visible to attachment owner */}
                            {(isAdmin ||
                              attachment.userId === systemUser?.id ||
                              (isCollaborator && userRole === "admin")) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAttachment(attachment);
                                }}
                                className="ml-4 text-gray-400 hover:text-blue-400"
                              >
                                <FaEdit />
                              </button>
                            )}

                            {/* Delete button - visible to attachment owner */}
                            {(isAdmin ||
                              attachment.userId === systemUser?.id ||
                              (isCollaborator && userRole === "admin")) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (
                                    window.confirm("Delete this attachment?")
                                  ) {
                                    handleDeleteAttachment(attachment.id);
                                  }
                                }}
                                className="text-gray-400 hover:text-red-400"
                              >
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {imageAttachments.length === 0 &&
                    videoAttachments.length === 0 &&
                    nonMediaAttachments.length === 0 && (
                      <div className="text-center py-6 text-gray-800">
                        No attachments yet
                      </div>
                    )}
                </div>
              </div>

              {/* Resources Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Resources
                      </h2>
                      <p className="text-sm text-gray-500 mt-1">
                        Educational materials and references
                      </p>
                    </div>
                    {canAddContent && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPubMedResourceSearch(true)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FaSearch className="w-4 h-4 mr-2 -ml-1" />
                          PubMed
                        </button>
                        <button
                          onClick={() => setShowAddResources(true)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <FaPlus className="w-4 h-4 mr-2 -ml-1" />
                          Add
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Resources List */}
                  {isLoadingResources ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">
                          Loading resources...
                        </p>
                      </div>
                    </div>
                  ) : linkedResources.length > 0 ? (
                    <div className="space-y-2">
                      {linkedResources.map((resource, index) => {
                        const hasVideo =
                          resource.resource?.videoUrl ||
                          isVideoUrl(resource.resource?.url);
                        const linkedResourceId = getLinkedResourceId(resource);
                        const isEditingNote =
                          editingResourceNoteId === linkedResourceId;
                        const isSavingNote =
                          savingResourceNoteId === linkedResourceId;
                        const resourceDetailsId =
                          resource.resourceId ||
                          resource.resource?.id ||
                          resource.id;
                        const isResourceOrderBusy = Boolean(
                          reorderingResourceId
                        );

                        return (
                          <div
                            key={resource.id}
                            className="group rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors duration-150"
                          >
                            <div
                              className="relative flex items-start p-4 cursor-pointer"
                              onClick={() => {
                                if (hasVideo) {
                                  setSelectedVideoResource(resource.resource);
                                  setShowVideoModal(true);
                                } else if (resource.resource?.url) {
                                  window.open(resource.resource?.url, "_blank");
                                }
                              }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      {hasVideo && (
                                        <div className="flex items-center text-blue-600">
                                          <FaPlayCircle className="w-4 h-4" />
                                        </div>
                                      )}
                                      <h3 className="text-sm font-medium text-gray-900">
                                        {resource.resource?.name}
                                      </h3>
                                    </div>
                                    {resource.resource?.description && (
                                      <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                        {stripHtmlTags(
                                          resource.resource?.description
                                        )}
                                      </p>
                                    )}
                                    {resource.notes && (
                                      <p className="mt-2 text-xs text-gray-500 italic">
                                        Note: {resource.notes}
                                      </p>
                                    )}
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                      {resource.resourceType && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                          {resource.resourceType.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="ml-4 flex items-center gap-2">
                                    {canAddContent &&
                                      linkedResources.length > 1 && (
                                        <div className="flex flex-col gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleMoveResource(
                                                resource,
                                                index,
                                                -1
                                              );
                                            }}
                                            disabled={
                                              index === 0 ||
                                              isResourceOrderBusy
                                            }
                                            className="p-1 text-gray-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                                            title="Move resource up"
                                            aria-label="Move resource up"
                                          >
                                            <FaChevronUp className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleMoveResource(
                                                resource,
                                                index,
                                                1
                                              );
                                            }}
                                            disabled={
                                              index ===
                                                linkedResources.length - 1 ||
                                              isResourceOrderBusy
                                            }
                                            className="p-1 text-gray-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-30"
                                            title="Move resource down"
                                            aria-label="Move resource down"
                                          >
                                            <FaChevronDown className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    {canAddContent && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleStartEditingResourceNote(
                                            resource
                                          );
                                        }}
                                        className={`p-1 transition-colors opacity-0 group-hover:opacity-100 ${
                                          resource.notes
                                            ? "text-blue-500 hover:text-blue-600"
                                            : "text-gray-400 hover:text-gray-500"
                                        }`}
                                        title={
                                          resource.notes
                                            ? "Edit resource note"
                                            : "Add resource note"
                                        }
                                      >
                                        <FaRegStickyNote className="w-4 h-4" />
                                      </button>
                                    )}
                                    <a
                                      href={`/resources/${resourceDetailsId}`}
                                      target="_blank"
                                      onClick={(e) => e.stopPropagation()}
                                      className="p-1 text-gray-400 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="View resource details"
                                    >
                                      <FaLink className="w-4 h-4" />
                                    </a>
                                    {(isAdmin ||
                                      (isCollaborator &&
                                        userRole === "admin")) && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (
                                            window.confirm(
                                              "Are you sure you want to remove this resource?"
                                            )
                                          ) {
                                            handleDeleteResource(
                                              linkedResourceId
                                            );
                                          }
                                        }}
                                        className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"
                                        title="Remove resource"
                                      >
                                        <FaTrash className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {isEditingNote && (
                              <div
                                className="px-4 pb-4"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-3">
                                  <label className="block text-xs font-medium text-slate-700 mb-2 uppercase tracking-wide">
                                    {resource.notes ? "Edit Note" : "Add Note"}
                                  </label>
                                  <textarea
                                    value={editingResourceNoteValue}
                                    onChange={(e) =>
                                      setEditingResourceNoteValue(
                                        e.target.value
                                      )
                                    }
                                    placeholder="Add notes about why this resource belongs here..."
                                    className="w-full min-h-[96px] rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <div className="mt-3 flex justify-end gap-2">
                                    <button
                                      onClick={handleCancelEditingResourceNote}
                                      className="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleSaveResourceNote(resource)
                                      }
                                      disabled={isSavingNote}
                                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isSavingNote && (
                                        <FaSpinner className="animate-spin" />
                                      )}
                                      <span>Save Note</span>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No resources
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by adding educational materials.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Links Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 sm:p-6">
                  <div className="flex justify-between items-center mb-6 sm:mb-8">
                    <div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        Links
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        Related resources and references
                      </p>
                    </div>
                    {/* Add Link button - available to all collaborators */}
                    {canAddContent && (
                      <button
                        onClick={() => setShowLinkCollectionModal(true)}
                        className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md sm:rounded-lg text-gray-900 bg-white hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
                      >
                        <FaPlus className="mr-1.5 sm:mr-2 text-gray-700" />
                        <span className="hidden xs:inline">Add Link</span>
                        <span className="xs:hidden">Add</span>
                      </button>
                    )}
                  </div>

                  {/* Link Categories Grid */}
                  <div className="flex flex-wrap gap-4 justify-start">
                    {isLoadingLinkGroups ? (
                      <div className="w-full py-12 flex justify-center">
                        <div className="animate-pulse flex space-x-4">
                          <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                          <div className="flex-1 space-y-4 py-1 max-w-xs">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="space-y-2">
                              <div className="h-4 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Render all categories that have items */
                      Object.entries(resolvedLinkGroups || {}).map(
                        ([category, items]) =>
                          items.length > 0 && (
                            <button
                              key={category}
                              onClick={() => handleCategoryClick(category)}
                              className="relative flex-grow sm:flex-grow-0 basis-[calc(50%-8px)] sm:basis-auto min-w-[140px] max-w-[200px] p-4 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 transition-all duration-200 flex flex-col items-center text-center"
                            >
                              <div
                                className={`w-12 h-12 ${
                                  getCategoryColor(category).bg
                                } rounded-xl flex items-center justify-center mb-3 group-hover:bg-opacity-75 transition-colors`}
                              >
                                {getCategoryIcon(category)}
                              </div>
                              <h3 className="font-medium text-gray-900 mb-1">
                                {getCategoryTitle(category)}
                              </h3>
                              <span
                                className={`${
                                  getCategoryColor(category).badge
                                } ${
                                  getCategoryColor(category).text
                                } text-xs font-medium px-2 py-0.5 rounded-full`}
                              >
                                {items.length}
                              </span>
                            </button>
                          )
                      )
                    )}
                  </div>

                  {/* Empty State - show only if linkGroups is empty or undefined */}
                  {!isLoadingLinkGroups &&
                    (!resolvedLinkGroups ||
                      Object.keys(resolvedLinkGroups).length === 0 ||
                      Object.values(resolvedLinkGroups).every(
                        (items) => !items?.length
                      )) && (
                      <div className="text-center py-12 mt-8 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                        <div className="flex justify-center mb-4">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <FaLink className="text-gray-400 text-2xl" />
                          </div>
                        </div>
                        <h3 className="text-gray-900 font-medium mb-1">
                          No links added yet
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Click &ldquo;Add Link&rdquo; to start organizing your
                          related resources
                        </p>
                      </div>
                    )}
                </div>
              </div>

              {/* Social Media Accounts */}
              <EntitySocialMediaAccounts
                entityId={externalLink.id}
                entityType="external_link"
                title="Related Social Media Accounts"
                compact={false}
                showManageAssociations={canEdit}
              />
              </div>
            )}
          </div>
          )}
        </div>
      </div>

      {showShareModal && (
        <ShareContentModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          contentType="external_link"
          contentId={externalLink.id}
          contentName={externalLink.name}
          publicJsonEnabled={publicJsonEnabled}
        />
      )}

      {isEditing && (
        <Modal isOpen={isEditing} onClose={() => setIsEditing(false)}>
          <AddExternalLinkForm
            onSubmit={handleUpdateExternalLink}
            onUpdateSingleField={handleUpdateSingleField}
            onClose={() => setIsEditing(false)}
            initialValues={{
              ...collectionScopedExternalLink,
              status: collectionScopedExternalLink.status,
              visibility: externalLink.visibility,
              allowPublicNotations: externalLink.allowPublicNotations || false,
            }}
            isAdmin={isAdmin}
            events={combinedEvents}
            collaborators={collaborators}
            isLoadingCollaborators={isLoadingCollaborators}
            externalLinkId={externalLink.id}
          />
        </Modal>
      )}

      {/* Notification Submissions Manager Modal */}
      {showSubmissionsManager && (
        <Modal
          isOpen={showSubmissionsManager}
          onClose={() => setShowSubmissionsManager(false)}
          maxWidth="max-w-4xl"
        >
          <NotationSubmissionsManager
            externalLinkId={externalLink?.id}
            onClose={() => setShowSubmissionsManager(false)}
          />
        </Modal>
      )}

      {(showAddAttachment || editingAttachment) && (
        <Modal
          isOpen={showAddAttachment || !!editingAttachment}
          onClose={() => {
            setShowAddAttachment(false);
            setEditingAttachment(null);
          }}
        >
          <AddAttachmentForm
            externalLinkId={externalLink.id}
            onSubmit={handleSubmitAttachment}
            onClose={() => {
              setShowAddAttachment(false);
              setEditingAttachment(null);
            }}
            isCollaborator={isCollaborator && userRole !== "admin"}
            initialValues={editingAttachment}
            isEditing={!!editingAttachment}
          />
        </Modal>
      )}

      {/* AI Attachment Modal */}
      {showAIAttachmentModal && (
        <Modal
          isOpen={showAIAttachmentModal}
          onClose={() => setShowAIAttachmentModal(false)}
          maxWidth="max-w-3xl"
        >
          <div className="p-4">
            <AttachmentAICreate
              onClose={() => setShowAIAttachmentModal(false)}
              onAttachmentCreated={(attachment) => {
                // Refresh the external link data to show the new attachment
                if (refetchExternalLink) {
                  refetchExternalLink();
                }
              }}
              externalLinkId={externalLink.id}
              collectionId={collectionId}
            />
          </div>
        </Modal>
      )}

      {showLinkCollectionModal && (
        <Modal
          isOpen={showLinkCollectionModal}
          onClose={() => {
            setShowLinkCollectionModal(false);
            setEditingLinkGroup(null);
          }}
        >
          <AddLinkCollectionForm
            onClose={() => {
              setShowLinkCollectionModal(false);
              setEditingLinkGroup(null);
            }}
            isAdmin={isAdmin}
            isCollaborator={isCollaborator}
            collectionTenantId={externalLink.tenantId}
            linkingId={externalLink.id}
            linkingType="external_link"
            initialValues={editingLinkGroup}
          />
        </Modal>
      )}

      {showAddResources && collectionId && (
        <ExternalLinkResourcesManager
          collectionId={collectionId}
          externalLinkId={externalLink.id}
          externalLink={externalLink}
          linkGroups={resolvedLinkGroups}
          onClose={() => setShowAddResources(false)}
        />
      )}
      {showPubMedResourceSearch && collectionId && (
        <Modal
          onClose={() => setShowPubMedResourceSearch(false)}
          maxWidth="max-w-7xl"
          className="overflow-hidden"
        >
          <ExternalLinkPubMedModal
            externalLink={externalLink}
            collectionId={collectionId}
            externalLinkId={externalLink.id}
            linkedResources={linkedResources}
            onClose={() => setShowPubMedResourceSearch(false)}
          />
        </Modal>
      )}

      {showCategoryModal && (
        <Modal
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    getCategoryColor(selectedCategory).bg
                  }`}
                >
                  {getCategoryIcon(selectedCategory)}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {getCategoryTitle(selectedCategory)}
                </h2>
              </div>
            </div>

            <div className="space-y-3">
              {getCategoryItems(selectedCategory).map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  onClick={() => window.open(item.url, "_blank")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getCategoryIcon(item.category)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {item.name}
                        </h3>
                        <div
                          className="text-sm text-gray-600"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(item.description),
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(isAdmin ||
                        item.userId === systemUser?.id ||
                        (isCollaborator && userRole === "admin")) && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditLinkGroup(item);
                            }}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this link?"
                                )
                              ) {
                                handleDeleteLinkGroup(item);
                              }
                            }}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                      {item.userId === systemUser?.id && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          You
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {/* Video Browser Modal */}
      <VideoBrowser
        videos={getCategoryItems("video")}
        isOpen={showVideoBrowser}
        onClose={() => setShowVideoBrowser(false)}
        onEdit={handleEditLinkGroup}
        onDelete={handleDeleteLinkGroup}
        currentUserId={userId}
        isCollaborator={isCollaborator}
        userRole={userRole}
      />

      <TimestampModal
        isOpen={showTimestamps}
        onClose={() => setShowTimestamps(false)}
        timestamps={externalLink.timestamps}
        videoUrl={externalLink.url}
      />

      {/* Mobile Calendar Hover Container - shown when calendar is clicked */}
      {!sharedToken && showCalendarHover && combinedEvents?.length > 0 && (
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
              events={combinedEvents.map((event) => ({
                ...event,
                type: event.type || "external_link",
                startDate: event.startDate || event.date,
                endDate: event.endDate || event.date,
                title: event.title || event.name || "Untitled",
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
              onClose={() => setShowCalendarHover(false)}
              isSharedView={!!sharedToken}
            />
          </div>
        </div>
      )}

      {/* Full Calendar View */}
      {!sharedToken && showCalendarView && (
        <div className="mt-6 pb-8" ref={calendarRef}>
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

            {/* Show a message if no events and regular events not enabled */}
            {(!combinedEvents || combinedEvents.length === 0) &&
              !showRegularEvents && (
                <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                  <p className="text-gray-500">
                    No events with dates found for this external link.
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Add dates to your external link or notations to see them in
                    the calendar.
                  </p>
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
                type: event.type || "external_link",
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
              organizations={[]}
              showPublicOnly={showPublicOnly}
              showRegularEvents={showRegularEvents}
              isCollectionContext={true}
              onPublicOnlyToggle={setShowPublicOnly}
              onRegularEventsToggle={setShowRegularEvents}
              onExternalLinkClick={(id) => {
                if (id === externalLink.id) {
                  // Refresh the current page
                  window.location.reload();
                } else {
                  const collectionQuery = collectionId
                    ? `?collectionId=${encodeURIComponent(collectionId)}`
                    : "";
                  router?.push(`/external-links/${id}${collectionQuery}`);
                }
              }}
            />

            {/* Tag Legend */}
            <TagClassification
              availableTags={availableTags}
              highlightedTags={highlightedCalendarTags}
              tagFilterMode={tagFilterMode}
              onTagClick={handleCalendarTagClick}
              onClearHighlights={handleClearCalendarTagHighlights}
              onFilterModeChange={handleTagFilterModeChange}
              getTagCount={getTagCount}
              showCondition={
                availableTags.length > 0 ||
                combinedEvents.some(
                  (event) => event.tags && event.tags.length > 0
                )
              }
            />
          </div>
        </div>
      )}

      {/* AI Voice Memo Modal */}
      {showAIVoiceMemo && (
        <Modal
          isOpen={showAIVoiceMemo}
          onClose={() => setShowAIVoiceMemo(false)}
          title="AI Voice Memo - Bulk Notation Creation"
          maxWidth="max-w-4xl"
        >
          <AIVoiceMemo
            externalLinkId={externalLink?.id}
            collectionId={externalLink?.collections?.[0]?.id}
            onNotationsCreated={async (createdNotations) => {
              setShowAIVoiceMemo(false);
              await handleMaybeExpandExternalLinkDates(
                getCombinedDateRangeValues(createdNotations || [])
              );

              // Invalidate the external link query to refetch the data
              await queryClient.invalidateQueries({
                queryKey: ["externalLinkById", externalLink?.id],
              });

              // Also invalidate the notations query if it exists
              await queryClient.invalidateQueries({
                queryKey: ["externalLinkNotations"],
              });

              // Force a refetch of the data
              await queryClient.refetchQueries({
                queryKey: ["externalLinkById", externalLink?.id],
              });
            }}
            onNavigateToLink={(externalLinkId) => {
              // Since we're already on the external link page, just refresh or scroll to top
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onCancel={() => setShowAIVoiceMemo(false)}
          />
        </Modal>
      )}

      {/* AI Bulk Updates Modal */}
      {showAIBulkUpdates && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowAIBulkUpdates(false)}
            />

            {/* Center the modal */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-[10000]">
              <AIMenu
                selectedNotations={getSelectedNotationsList()}
                externalLinkId={externalLink?.id}
                collectionId={externalLink?.collections?.[0]?.id}
                onNotationsUpdated={handleAIBulkUpdatesComplete}
                onClose={() => setShowAIBulkUpdates(false)}
                isCollaborator={isCollaborator}
              />
            </div>
          </div>
        </div>
      )}

      {/* Attachment Browser Modal */}
      {showAttachmentBrowser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col">
            <AttachmentBrowser
              attachments={externalLink?.attachments || []}
              onClose={() => setShowAttachmentBrowser(false)}
              onDelete={handleDeleteAttachment}
              onEdit={handleEditAttachment}
              isAdmin={isAdmin}
              isCollaborator={isCollaborator}
              userRole={userRole}
              systemUserId={systemUser?.id}
              title="All Attachments"
            />
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <ExportExternalLinkModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          externalLink={externalLink}
          linkGroups={resolvedLinkGroups}
          linkedResources={linkedResources}
          isAdmin={isAdmin}
          isCollaborator={isCollaborator}
          userRole={userRole}
          systemUserId={systemUser?.id}
        />
      )}

      {/* Chat Component */}
      <ExternalLinkChat
        externalLink={externalLink}
        linkGroups={resolvedLinkGroups}
        isOpen={showChat}
        onToggle={() => setShowChat(!showChat)}
        isAdmin={isAdmin}
        isCollaborator={isCollaborator}
        userRole={userRole}
        systemUserId={systemUser?.id}
        pinnedItems={pinnedItems}
      />

      {/* Slack Settings Modal */}
      {showSlackModal && (
        <Modal
          isOpen={showSlackModal}
          onClose={() => setShowSlackModal(false)}
          title="Slack Notifications"
        >
          <div className="p-4">
            <SlackIntegration
              entityType="external-link"
              entityId={externalLink.id}
              canConfigure={true}
            />
          </div>
        </Modal>
      )}

      {/* Video Modal for Resources */}
      {showVideoModal && selectedVideoResource && (
        <>
          {selectedVideoResource.videoUrl ? (
            <TimestampModal
              isOpen={showVideoModal}
              onClose={() => {
                setShowVideoModal(false);
                setSelectedVideoResource(null);
              }}
              videoUrl={selectedVideoResource.videoUrl}
              timestamps={selectedVideoResource.timestamps || []}
            />
          ) : (
            <VideoBrowser
              videos={[
                {
                  id: selectedVideoResource.id,
                  name: selectedVideoResource.name,
                  title: selectedVideoResource.name,
                  description: selectedVideoResource.description,
                  url: selectedVideoResource.url,
                  videoUrl: selectedVideoResource.url,
                  timestamps: selectedVideoResource.timestamps || [],
                },
              ]}
              isOpen={showVideoModal}
              onClose={() => {
                setShowVideoModal(false);
                setSelectedVideoResource(null);
              }}
              onEdit={() => {}}
              onDelete={() => {}}
              searchQuery=""
              currentUserId={systemUser?.id}
              isCollaborator={isCollaborator}
              userRole={userRole}
            />
          )}
        </>
      )}

      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .calendar-hover-card {
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>
    </>
  );
};

export default ExternalLinkDetails;
