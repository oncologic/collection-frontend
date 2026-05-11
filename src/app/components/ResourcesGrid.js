import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import ExternalLinkCard from "@/app/components/cards/ExternalLinkCard";
import ResourceCard from "@/app/components/cards/ResourceCard";
import ResourceListView from "./ResourceListView";
import {
  FaChevronDown,
  FaClock,
  FaThumbtack,
  FaEllipsisH,
  FaCog,
  FaTag,
  FaGlobe,
  FaLock,
  FaLink,
  FaArrowRight,
  FaCheck,
} from "react-icons/fa";
import SelectField from "@/app/components/inputs/SelectField";
import MoveToCollectionMenu from "./common/MoveToCollectionMenu";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUpdateExternalLinkInCollection } from "@/app/hooks/useCollections";
import { STATUS_OPTIONS } from "./forms/AddCollectionForm";
import {
  formatDateString,
  formatDateStringShort,
  formatDayOfWeek,
} from "../utils/general";
import CustomEditor from "./common/CustomEditor";
import { formatTimeDisplay } from "./events/CalendarView";
import {
  usePinItems,
  useUnpinItems,
  useGetPinnedItems,
} from "../hooks/usePinned";
import { useExternalLinkTagsForLink } from "../hooks/useTags";
import { toast } from "react-hot-toast";
import {
  useUpdateExternalLinkOrder,
  useUpdateTypeOrder,
  useGetCollectionTypeOrdering,
} from "../hooks/useCollections";
import {
  buildSortedExternalLinkTypeEntries,
  flattenSortedExternalLinkTypeEntries,
  normalizeExternalTypeOrdering,
} from "../utils/externalLinkOrdering";

// Status options and helpers copied from NotationsList.js for consistent badge colors
const NOTATION_STATUS_OPTIONS = [
  { id: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { id: "active", label: "Active", color: "bg-blue-100 text-blue-700" },
  { id: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
  { id: "waiting", label: "Waiting", color: "bg-orange-100 text-orange-700" },
  {
    id: "in progress",
    label: "In Progress",
    color: "bg-purple-100 text-purple-700",
  },
  { id: "cancelled", label: "Cancelled", color: "bg-red-100 text-red-700" },
  {
    id: "large reference",
    label: "Large Reference",
    color: "bg-pink-100 text-pink-700",
  },
  { id: "archived", label: "Archived", color: "bg-gray-100 text-gray-700" },
  // Fallback for any other status
  { id: "default", label: "Unknown", color: "bg-gray-100 text-gray-700" },
];

const getStatusColor = (status) => {
  const statusOption = NOTATION_STATUS_OPTIONS.find(
    (option) => option.id === status?.toLowerCase()
  );
  return (
    statusOption?.color ||
    NOTATION_STATUS_OPTIONS.find((opt) => opt.id === "default").color
  );
};

const getStatusLabel = (status) => {
  const statusOption = NOTATION_STATUS_OPTIONS.find(
    (option) => option.id === status?.toLowerCase()
  );
  return statusOption?.label || status;
};

// Helper function to get visibility color and display
const getVisibilityDisplay = (visibility) => {
  if (!visibility) return null;

  switch (visibility.toLowerCase()) {
    case "public":
      return {
        icon: FaGlobe,
        label: "Public",
        color: "bg-green-50 text-green-700 border-green-200",
      };
    case "private":
      return {
        icon: FaLock,
        label: "Private",
        color: "bg-gray-50 text-gray-700 border-gray-200",
      };
    case "unlisted":
      return {
        icon: FaLink,
        label: "Unlisted",
        color: "bg-yellow-50 text-yellow-700 border-yellow-200",
      };
    default:
      return {
        icon: FaLink,
        label: visibility.charAt(0).toUpperCase() + visibility.slice(1),
        color: "bg-blue-50 text-blue-700 border-blue-200",
      };
  }
};

const BOARD_FALLBACK_GROUP_ID = "__ungrouped__";

const BOARD_STATUS_ORDER = [
  ...new Set(
    [...NOTATION_STATUS_OPTIONS, ...STATUS_OPTIONS]
      .filter((option) => option.id !== "default")
      .map((option) => option.id)
  ),
];

const toPlainText = (value = "") =>
  value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

const toTitleCase = (value = "") =>
  value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatBoardDate = (value) => {
  if (!value) return null;

  try {
    return formatDateStringShort(value);
  } catch (error) {
    const parsedDate = new Date(value);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toLocaleDateString();
    }
  }

  return null;
};

const getBoardStatusConfig = (statusId) => {
  if (statusId === BOARD_FALLBACK_GROUP_ID) {
    return {
      id: statusId,
      label: "No Status",
      badgeClass: "bg-slate-100 text-slate-600",
    };
  }

  const option =
    NOTATION_STATUS_OPTIONS.find((item) => item.id === statusId) ||
    STATUS_OPTIONS.find((item) => item.id === statusId);

  return {
    id: statusId,
    label: option?.label || toTitleCase(statusId),
    badgeClass: option?.color || "bg-slate-100 text-slate-700",
  };
};

const BOARD_STATUS_MENU_OPTIONS = [
  ...BOARD_STATUS_ORDER.map((statusId) => getBoardStatusConfig(statusId)),
  getBoardStatusConfig(BOARD_FALLBACK_GROUP_ID),
];

const BULK_VISIBILITY_OPTIONS = [
  { id: "private", name: "Private" },
  { id: "unlisted", name: "Unlisted" },
  { id: "public", name: "Public" },
];

const getBoardStatusId = (resource) =>
  resource.status?.trim()?.toLowerCase() || BOARD_FALLBACK_GROUP_ID;

const getBoardTypeLabel = (resource, fallback = "Other") =>
  resource.type?.trim() || fallback;

const getBoardTypeId = (typeLabel) => `type:${typeLabel.trim().toLowerCase()}`;

function BoardStatusMenu({
  currentStatusId,
  onSelect,
  disabled = false,
  isUpdating = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const currentStatus = getBoardStatusConfig(currentStatusId);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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
  }, [isOpen]);

  return (
    <div
      className={`relative ${isOpen ? "z-[90]" : "z-10"}`}
      ref={menuRef}
    >
      <button
        type="button"
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        disabled={disabled}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
          disabled
            ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300"
            : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
        }`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={isUpdating ? "Updating status..." : "Move to another status"}
        aria-label={isUpdating ? "Updating status" : "Change status"}
      >
        <FaArrowRight className="h-3 w-3" />
      </button>

      {isOpen && !disabled && (
        <div
          className="absolute right-0 top-full z-[100] mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-2 shadow-2xl"
          role="menu"
        >
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Change Status
          </div>
          <div className="space-y-1">
            {BOARD_STATUS_MENU_OPTIONS.map((option) => {
              const isCurrent = option.id === currentStatusId;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onSelect(option.id);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                    isCurrent
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                  role="menuitemradio"
                  aria-checked={isCurrent}
                >
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${option.badgeClass}`}
                  >
                    {option.label}
                  </span>
                  <span className="ml-auto">
                    {isCurrent && <FaCheck className="h-3 w-3" />}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="px-2 pt-2 text-[11px] text-slate-400 sm:hidden">
            Tap a status to move this card.
          </div>
        </div>
      )}
    </div>
  );
}

function ReorderMenu({
  itemLabel,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onMoveTop,
  onMoveBottom,
  align = "right",
  compact = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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
  }, [isOpen]);

  const actions = [
    {
      id: "top",
      label: "Move to top",
      disabled: !canMoveUp,
      onClick: onMoveTop,
    },
    {
      id: "up",
      label: "Move up",
      disabled: !canMoveUp,
      onClick: onMoveUp,
    },
    {
      id: "down",
      label: "Move down",
      disabled: !canMoveDown,
      onClick: onMoveDown,
    },
    {
      id: "bottom",
      label: "Move to bottom",
      disabled: !canMoveDown,
      onClick: onMoveBottom,
    },
  ];

  return (
    <div
      className={`relative ${isOpen ? "z-[90]" : "z-10"}`}
      ref={menuRef}
    >
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 ${
          compact ? "h-8 w-8" : "h-9 w-9"
        }`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        title={`Reorder ${itemLabel}`}
        aria-label={`Reorder ${itemLabel}`}
      >
        <FaEllipsisH className="h-3 w-3" />
      </button>

      {isOpen && (
        <div
          className={`absolute ${
            align === "left" ? "left-0" : "right-0"
          } top-full z-[100] mt-2 w-44 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl`}
          role="menu"
        >
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            Reorder
          </div>
          <div className="space-y-1">
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => {
                  if (action.disabled) {
                    return;
                  }

                  action.onClick?.();
                  setIsOpen(false);
                }}
                disabled={action.disabled}
                className={`flex w-full items-center rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                  action.disabled
                    ? "cursor-not-allowed text-slate-300"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
                role="menuitem"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ResourcesGrid({
  collection,
  filteredCollectionResources,
  resourceTypes,
  flippedCardId,
  setFlippedCardId,
  isAdmin,
  handleDeleteResource,
  handleDeleteExternalLink,
  handleViewAllResources,
  onUpdateExternalLink,
  viewMode,
  setViewMode,
  isSharedView = false,
  sharedToken = null,
  currentUserId,
  onShowSocialMedia,
  externalTypeOrdering = null,
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [showOrderingUI, setShowOrderingUI] = useState(false);
  const [externalLinksState, setExternalLinksState] = useState(
    filteredCollectionResources
  );
  const [typeOrdering, setTypeOrdering] = useState([]);

  // Add pin-related hooks
  const { mutateAsync: pinItemsAsync } = usePinItems();
  const { mutateAsync: unpinItemsAsync } = useUnpinItems();
  const { data: pinnedItems, refetch: refetchPinnedItems } =
    useGetPinnedItems();

  // Add ordering hooks
  const { mutateAsync: updateExternalLinkOrderAsync } =
    useUpdateExternalLinkOrder();
  const { mutateAsync: updateTypeOrderAsync } = useUpdateTypeOrder();
  const { data: typeOrderingData } = useGetCollectionTypeOrdering(
    collection.id
  );

  const normalizedFetchedTypeOrdering = useMemo(
    () =>
      normalizeExternalTypeOrdering(
        typeOrderingData ?? externalTypeOrdering ?? collection.typeOrdering
      ),
    [collection.typeOrdering, externalTypeOrdering, typeOrderingData]
  );

  useEffect(() => {
    if (collection.type !== "external") {
      return;
    }

    setExternalLinksState(filteredCollectionResources);
  }, [collection.type, filteredCollectionResources]);

  useEffect(() => {
    setTypeOrdering(normalizedFetchedTypeOrdering);
  }, [normalizedFetchedTypeOrdering]);

  const externalResources =
    collection.type === "external"
      ? externalLinksState
      : filteredCollectionResources;

  const sortedTypeEntries = useMemo(() => {
    if (collection.type !== "external") {
      return [];
    }

    return buildSortedExternalLinkTypeEntries(externalResources, typeOrdering);
  }, [collection.type, externalResources, typeOrdering]);

  const sortedLinksByType = useMemo(
    () => Object.fromEntries(sortedTypeEntries),
    [sortedTypeEntries]
  );

  // Simplify the isPinned logic to rely only on server data
  const isResourcePinned = (resource) => {
    if (!pinnedItems) return false;

    // Check regular id
    if (pinnedItems.some((item) => item.id === resource.id)) return true;

    // Check external link id
    if (pinnedItems.some((item) => item.externalLinks?.id === resource.id))
      return true;

    return false;
  };

  // Simplify the pin toggle to remove optimistic updates
  const handlePinToggle = async (e, resource) => {
    e.stopPropagation();
    e.preventDefault();

    const isCurrentlyPinned = isResourcePinned(resource);

    // Determine the correct ID to use
    const resourceId = resource.id;

    const externalLinkId = resource.externalLinks?.id ?? resource.id;

    try {
      // Perform API call without optimistic updates
      if (isCurrentlyPinned) {
        // For unpinning, find the correct pinned item ID
        const pinnedItem = pinnedItems.find(
          (item) =>
            item.id === resourceId ||
            (item.pinnedItemId &&
              (item.externalLinks?.id === externalLinkId ||
                item.id === externalLinkId))
        );
        if (pinnedItem.externalLinks?.id) {
          await unpinItemsAsync([pinnedItem.externalLinks?.id]);
        } else {
          await unpinItemsAsync([pinnedItem.id]);
        }
      } else {
        // For pinning, use the resource data
        await pinItemsAsync([
          {
            id: resourceId,
            type: "external_link",
            name: resource.name,
            description: resource.description || "",
            externalLinks: resource.externalLinks || {},
            metadata: {
              url: resource.url,
              type: resource.type,
              status: resource.status,
              date: resource.date || resource.dateAdded,
              notes: resource.notations?.length || 0,
            },
          },
        ]);
        toast.success("Item pinned successfully");
      }

      // Refresh pinned items data after API call
      await refetchPinnedItems();
    } catch (error) {
      toast.error("Failed to toggle pin state");
    }
  };

  // Helper functions for ordering
  const invalidateOrderingQueries = async () => {
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        return (
          (key[0] === "collections" && key[1] === collection.id) ||
          (key[0] === "collection" && key[1] === collection.id) ||
          (key[0] === "collectionTypeOrdering" && key[1] === collection.id) ||
          key[0] === "collectionExternalLink"
        );
      },
    });
  };

  const moveArrayItem = (items, fromIndex, toIndex) => {
    const nextItems = [...items];
    const [movedItem] = nextItems.splice(fromIndex, 1);
    nextItems.splice(toIndex, 0, movedItem);
    return nextItems;
  };

  const handleTypeOrderChange = async (types) => {
    const previousTypeOrdering = typeOrdering;

    try {
      const nextTypeOrderings = types.map((typeName, index) => ({
        typeName,
        sortOrder: index,
      }));

      setTypeOrdering(nextTypeOrderings);
      await updateTypeOrderAsync({
        collectionId: collection.id,
        typeOrderings: nextTypeOrderings,
      });
    } catch (error) {
      setTypeOrdering(previousTypeOrdering);
      console.error("Error updating type order:", error);
    }
  };

  const handleMoveTypeToIndex = async (typeName, targetIndex) => {
    const currentTypes = sortedTypeEntries.map(([name]) => name);
    const currentIndex = currentTypes.indexOf(typeName);

    if (
      currentIndex === -1 ||
      currentIndex === targetIndex ||
      targetIndex < 0 ||
      targetIndex >= currentTypes.length
    ) {
      return;
    }

    await handleTypeOrderChange(
      moveArrayItem(currentTypes, currentIndex, targetIndex)
    );
  };

  const handleMoveTypeUp = async (typeName) => {
    const currentTypes = sortedTypeEntries.map(([name]) => name);
    const currentIndex = currentTypes.indexOf(typeName);

    if (currentIndex > 0) {
      await handleMoveTypeToIndex(typeName, currentIndex - 1);
    }
  };

  const handleMoveTypeDown = async (typeName) => {
    const currentTypes = sortedTypeEntries.map(([name]) => name);
    const currentIndex = currentTypes.indexOf(typeName);

    if (currentIndex < currentTypes.length - 1) {
      await handleMoveTypeToIndex(typeName, currentIndex + 1);
    }
  };

  const persistLinkOrder = async (typeName, reorderedLinks) => {
    const previousLinks = externalResources;
    const previousLinksById = new Map(
      reorderedLinks.map((link) => [String(link.id), link])
    );
    const nextLinksForType = reorderedLinks.map((link, index) => ({
      ...link,
      sortOrder: index,
    }));
    const nextLinksById = new Map(
      nextLinksForType.map((link) => [String(link.id), link])
    );
    const changedLinks = nextLinksForType.filter((link) => {
      const previousSortOrder = Number(
        previousLinksById.get(String(link.id))?.sortOrder ?? 0
      );
      return previousSortOrder !== link.sortOrder;
    });

    if (changedLinks.length === 0) {
      return;
    }

    const nextExternalLinks = previousLinks.map((link) =>
      nextLinksById.get(String(link.id)) || link
    );

    setExternalLinksState(nextExternalLinks);

    try {
      await Promise.all(
        changedLinks.map((link) =>
          updateExternalLinkOrderAsync({
            collectionId: collection.id,
            externalLinkId: link.id,
            sortOrder: link.sortOrder,
            silent: true,
            skipInvalidate: true,
          })
        )
      );

      await invalidateOrderingQueries();
      toast.success("Link order updated successfully");
    } catch (error) {
      setExternalLinksState(previousLinks);
      toast.error("Failed to update link order");
      console.error(`Error updating ${typeName} link order:`, error);
    }
  };

  const handleMoveLinkToIndex = async (linkId, typeName, targetIndex) => {
    const linksOfType = sortedLinksByType[typeName] || [];
    const currentIndex = linksOfType.findIndex((l) => l.id === linkId);

    if (
      currentIndex === -1 ||
      currentIndex === targetIndex ||
      targetIndex < 0 ||
      targetIndex >= linksOfType.length
    ) {
      return;
    }

    await persistLinkOrder(
      typeName,
      moveArrayItem(linksOfType, currentIndex, targetIndex)
    );
  };

  const handleMoveLinkUp = async (linkId, typeName) => {
    const linksOfType = sortedLinksByType[typeName] || [];
    const currentIndex = linksOfType.findIndex((link) => link.id === linkId);

    if (currentIndex > 0) {
      await handleMoveLinkToIndex(linkId, typeName, currentIndex - 1);
    }
  };

  const handleMoveLinkDown = async (linkId, typeName) => {
    const linksOfType = sortedLinksByType[typeName] || [];
    const currentIndex = linksOfType.findIndex((link) => link.id === linkId);

    if (currentIndex < linksOfType.length - 1) {
      await handleMoveLinkToIndex(linkId, typeName, currentIndex + 1);
    }
  };

  // Bulk selection state for all visible resources/links
  const allVisibleLinks = useMemo(
    () => externalResources,
    [externalResources]
  );
  const [selectedLinks, setSelectedLinks] = useState({}); // { [linkId]: true }
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkVisibility, setBulkVisibility] = useState("");
  const [bulkDates, setBulkDates] = useState({}); // { [linkId]: dateString }
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [boardItems, setBoardItems] = useState(externalResources);
  const [boardStatusUpdateId, setBoardStatusUpdateId] = useState(null);

  const { mutateAsync: updateExternalLinkMutation } =
    useUpdateExternalLinkInCollection();

  const bulkVisibilityOptions = useMemo(
    () =>
      BULK_VISIBILITY_OPTIONS.filter(
        (option) => option.id !== "public" || isAdmin
      ),
    [isAdmin]
  );

  const getResourceTypeLabel = (resource) =>
    resource.resourceType?.name ||
    resource.typeName ||
    resourceTypes.find((type) => type.id === resource.typeId)?.name ||
    "Other";

  const orderedBoardItems = useMemo(() => {
    if (collection.type === "external") {
      return flattenSortedExternalLinkTypeEntries(sortedTypeEntries);
    }

    return filteredCollectionResources;
  }, [collection.type, filteredCollectionResources, sortedTypeEntries]);

  useEffect(() => {
    setBoardItems(orderedBoardItems);
  }, [orderedBoardItems]);

  const boardGrouping = useMemo(() => {
    const hasStatusValues = boardItems.some((resource) =>
      resource.status?.trim()
    );

    return hasStatusValues ? "status" : "type";
  }, [boardItems]);

  const canEditBoardStatus =
    collection.type === "external" &&
    boardGrouping === "status" &&
    !isSharedView;

  const boardColumns = useMemo(() => {
    const columns = new Map();
    const resolveResourceTypeLabel = (resource) =>
      resource.resourceType?.name ||
      resource.typeName ||
      resourceTypes.find((type) => type.id === resource.typeId)?.name ||
      "Other";

    boardItems.forEach((resource) => {
      let columnConfig;

      if (boardGrouping === "status") {
        const statusId = getBoardStatusId(resource);
        columnConfig = getBoardStatusConfig(statusId);
      } else {
        const typeLabel =
          collection.type === "external"
            ? getBoardTypeLabel(resource)
            : resolveResourceTypeLabel(resource);

        columnConfig = {
          id: getBoardTypeId(typeLabel),
          label: typeLabel,
          badgeClass: "bg-slate-200 text-slate-700",
        };
      }

      if (!columns.has(columnConfig.id)) {
        columns.set(columnConfig.id, {
          ...columnConfig,
          items: [],
        });
      }

      columns.get(columnConfig.id).items.push(resource);
    });

    if (boardGrouping === "status") {
      const orderedStatusIds = [
        ...BOARD_STATUS_ORDER.filter((statusId) => columns.has(statusId)),
        ...Array.from(columns.keys())
          .filter(
            (statusId) =>
              !BOARD_STATUS_ORDER.includes(statusId) &&
              statusId !== BOARD_FALLBACK_GROUP_ID
          )
          .sort((statusA, statusB) =>
            (columns.get(statusA)?.label || "").localeCompare(
              columns.get(statusB)?.label || ""
            )
          ),
      ];

      if (columns.has(BOARD_FALLBACK_GROUP_ID)) {
        orderedStatusIds.push(BOARD_FALLBACK_GROUP_ID);
      }

      return orderedStatusIds.map((statusId) => {
        const column = columns.get(statusId);
        const typeSections = new Map();

        column.items.forEach((resource) => {
          const typeLabel = getBoardTypeLabel(resource);
          const typeId = getBoardTypeId(typeLabel);

          if (!typeSections.has(typeId)) {
            typeSections.set(typeId, {
              id: typeId,
              label: typeLabel,
              items: [],
            });
          }

          typeSections.get(typeId).items.push(resource);
        });

        const orderedTypeIds = [
          ...sortedTypeEntries
            .map(([typeName]) => getBoardTypeId(typeName || "Other"))
            .filter((typeId) => typeSections.has(typeId)),
          ...Array.from(typeSections.keys())
            .filter(
              (typeId) =>
                !sortedTypeEntries.some(
                  ([typeName]) =>
                    getBoardTypeId(typeName || "Other") === typeId
                )
            )
            .sort((typeA, typeB) =>
              (typeSections.get(typeA)?.label || "").localeCompare(
                typeSections.get(typeB)?.label || ""
              )
            ),
        ];

        return {
          ...column,
          typeSections: orderedTypeIds.map((typeId) => typeSections.get(typeId)),
        };
      });
    }

    if (collection.type === "external") {
      const orderedTypeIds = [
        ...sortedTypeEntries
          .map(([typeName]) => getBoardTypeId(typeName))
          .filter((typeId) => columns.has(typeId)),
        ...Array.from(columns.keys())
          .filter(
            (typeId) =>
              !sortedTypeEntries.some(
                ([typeName]) => getBoardTypeId(typeName) === typeId
              )
          )
          .sort((typeA, typeB) =>
            (columns.get(typeA)?.label || "").localeCompare(
              columns.get(typeB)?.label || ""
            )
          ),
      ];

      return orderedTypeIds.map((typeId) => ({
        ...columns.get(typeId),
      }));
    }

    return Array.from(columns.values())
      .sort((columnA, columnB) => columnA.label.localeCompare(columnB.label))
      .map((column) => ({ ...column }));
  }, [
    boardGrouping,
    boardItems,
    collection.type,
    resourceTypes,
    sortedTypeEntries,
  ]);

  const moveBoardItemToStatus = (items, itemId, nextStatusId) => {
    const currentItem = items.find((item) => String(item.id) === String(itemId));

    if (!currentItem) {
      return items;
    }

    const updatedItem = {
      ...currentItem,
      status: nextStatusId === BOARD_FALLBACK_GROUP_ID ? "" : nextStatusId,
    };
    const remainingItems = items.filter(
      (item) => String(item.id) !== String(itemId)
    );
    const updatedItemTypeId = getBoardTypeId(getBoardTypeLabel(updatedItem));

    let lastSameStatusIndex = -1;
    let lastSameStatusAndTypeIndex = -1;

    remainingItems.forEach((item, index) => {
      if (getBoardStatusId(item) !== nextStatusId) {
        return;
      }

      lastSameStatusIndex = index;

      if (getBoardTypeId(getBoardTypeLabel(item)) === updatedItemTypeId) {
        lastSameStatusAndTypeIndex = index;
      }
    });

    const insertIndex =
      lastSameStatusAndTypeIndex >= 0
        ? lastSameStatusAndTypeIndex + 1
        : lastSameStatusIndex >= 0
        ? lastSameStatusIndex + 1
        : remainingItems.length;

    remainingItems.splice(insertIndex, 0, updatedItem);

    return remainingItems;
  };

  const handleBoardStatusChange = async (itemId, nextStatusId) => {
    if (!canEditBoardStatus) {
      return;
    }

    const currentItem = boardItems.find(
      (item) => String(item.id) === String(itemId)
    );

    if (!currentItem || getBoardStatusId(currentItem) === nextStatusId) {
      return;
    }

    const previousItems = [...boardItems];
    const previousExternalLinks = [...externalResources];
    const nextItems = moveBoardItemToStatus(
      previousItems,
      itemId,
      nextStatusId
    );

    setBoardItems(nextItems);
    setExternalLinksState((previousLinks) =>
      previousLinks.map((link) =>
        String(link.id) === String(itemId)
          ? {
              ...link,
              status:
                nextStatusId === BOARD_FALLBACK_GROUP_ID ? "" : nextStatusId,
            }
          : link
      )
    );
    setBoardStatusUpdateId(String(itemId));

    try {
      await updateExternalLinkMutation({
        collectionId: collection.id,
        externalLinkId: itemId,
        linkData: {
          status: nextStatusId === BOARD_FALLBACK_GROUP_ID ? null : nextStatusId,
        },
      });
    } catch (error) {
      setBoardItems(previousItems);
      setExternalLinksState(previousExternalLinks);
    } finally {
      setBoardStatusUpdateId(null);
    }
  };

  const openResourceDetails = (resource) => {
    if (collection.type === "external") {
      if (isSharedView && sharedToken) {
        const storedEmail = localStorage.getItem("shared-links-email");
        const emailParam = storedEmail
          ? `&email=${encodeURIComponent(storedEmail)}`
          : "";

        router.push(`/shared/${resource.id}?token=${sharedToken}${emailParam}`);
        return;
      }

      router.push(`/external-links/${resource.id}`);
      return;
    }

    if (isSharedView && sharedToken) {
      const storedEmail = localStorage.getItem("shared-links-email");
      const emailParam = storedEmail
        ? `&email=${encodeURIComponent(storedEmail)}`
        : "";

      router.push(`/shared/${resource.id}?token=${sharedToken}${emailParam}`);
      return;
    }

    router.push(`/resources/${resource.id}`);
  };

  const resetBulkState = useCallback(() => {
    setSelectedLinks({});
    setBulkStatus("");
    setBulkVisibility("");
    setBulkDates({});
    setIsBulkMode(false);
  }, []);

  const selectedLinkIds = useMemo(
    () => Object.keys(selectedLinks).filter((linkId) => selectedLinks[linkId]),
    [selectedLinks]
  );

  const hasPendingBulkDateChanges = useMemo(
    () =>
      selectedLinkIds.some((linkId) =>
        Object.prototype.hasOwnProperty.call(bulkDates, linkId)
      ),
    [bulkDates, selectedLinkIds]
  );

  const hasPendingBulkChanges = Boolean(
    bulkStatus || bulkVisibility || hasPendingBulkDateChanges
  );

  useEffect(() => {
    if (viewMode === "board") {
      setExpandedItems(new Set());
      setBoardStatusUpdateId(null);
      resetBulkState();
    }
  }, [resetBulkState, viewMode]);

  // Bulk update handler
  const handleBulkUpdate = async () => {
    const updates = allVisibleLinks
      .filter((link) => selectedLinks[link.id])
      .map((link) => {
        const linkData = {};

        if (bulkStatus) {
          linkData.status = bulkStatus;
        }

        if (bulkVisibility) {
          linkData.visibility = bulkVisibility;
        }

        if (Object.prototype.hasOwnProperty.call(bulkDates, link.id)) {
          linkData.date = bulkDates[link.id];
        }

        return {
          id: link.id,
          linkData,
        };
      })
      .filter((update) => Object.keys(update.linkData).length > 0);

    if (updates.length === 0) {
      return;
    }

    await Promise.all(
      updates.map((update) =>
        updateExternalLinkMutation({
          collectionId: collection.id,
          externalLinkId: update.id,
          linkData: update.linkData,
        })
      )
    );
    resetBulkState();
  };

  const handleSelectLink = (linkId, checked) => {
    setSelectedLinks((prev) => ({ ...prev, [linkId]: checked }));
  };

  const handleSelectAll = (checked) => {
    const newSelected = {};
    if (checked) {
      allVisibleLinks.forEach((link) => {
        newSelected[link.id] = true;
      });
    }
    setSelectedLinks(newSelected);
  };

  const toggleAll = (expand) => {
    if (expand) {
      setExpandedItems(new Set(filteredCollectionResources.map((r) => r.id)));
    } else {
      setExpandedItems(new Set());
    }
  };

  // Helper function to check if a resource has time information
  const hasTimeInfo = (resource) => {
    return !!(resource.startTime || resource.endTime);
  };

  // TagsDisplay component for list view
  const TagsDisplay = ({ externalLinkId, showMoreButton = true }) => {
    const { data: linkTags = [] } = useExternalLinkTagsForLink(externalLinkId);
    const [showAllTags, setShowAllTags] = useState(false);

    if (!linkTags || linkTags.length === 0) return null;

    const tagsToShow = showAllTags ? linkTags : linkTags.slice(0, 2);
    const hasMoreTags = linkTags.length > 2;

    return (
      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap max-w-[150px] sm:max-w-none">
        <FaTag className="w-3 h-3 text-gray-400 flex-shrink-0" />
        {tagsToShow.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-xs font-medium border max-w-[60px] sm:max-w-none truncate"
            style={{
              backgroundColor: `${tag.color}08`,
              borderColor: `${tag.color}20`,
              color: tag.color,
            }}
            title={tag.name}
          >
            {tag.name}
          </span>
        ))}
        {hasMoreTags && !showAllTags && showMoreButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAllTags(true);
            }}
            className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title={`Show ${linkTags.length - 2} more tags`}
          >
            <FaEllipsisH className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
            <span className="ml-1">+{linkTags.length - 2}</span>
          </button>
        )}
        {showAllTags && hasMoreTags && showMoreButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAllTags(false);
            }}
            className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Show fewer tags"
          >
            <FaChevronDown className="w-2 h-2 sm:w-2.5 sm:h-2.5 rotate-180" />
          </button>
        )}
      </div>
    );
  };

  const getBoardCardPreview = (resource) => {
    const preview = toPlainText(resource.description || "");

    if (!preview) return null;

    return preview.length > 140 ? `${preview.slice(0, 140)}...` : preview;
  };

  const getBoardCardDate = (resource) => {
    if (collection.type === "external") {
      return formatBoardDate(
        resource.startDate || resource.date || resource.dateAdded
      );
    }

    return formatBoardDate(resource.resourceDate || resource.updatedAt);
  };

  const renderBoardCard = (resource) => {
    const isExternal = collection.type === "external";
    const previewText = getBoardCardPreview(resource);
    const typeLabel = isExternal
      ? getBoardTypeLabel(resource, "Link")
      : getResourceTypeLabel(resource);
    const typeLinks = isExternal ? sortedLinksByType[typeLabel] || [] : [];
    const linkIndex = typeLinks.findIndex((link) => link.id === resource.id);
    const boardDate = getBoardCardDate(resource);
    const boardTags = Array.isArray(resource.tags) ? resource.tags : [];
    const visibleTags = boardTags.slice(0, 3);
    const remainingTagCount = boardTags.length - visibleTags.length;
    const visibilityDisplay = isExternal
      ? getVisibilityDisplay(resource.visibility)
      : null;
    const metaItems = [boardDate];

    if (isExternal && (resource.startTime || resource.endTime)) {
      metaItems.push(formatTimeDisplay(resource));
    }

    if (isExternal && resource.notations?.length) {
      metaItems.push(
        `${resource.notations.length} ${
          resource.notations.length === 1 ? "note" : "notes"
        }`
      );
    }

    if (!isExternal && resource.organizations?.[0]?.name) {
      metaItems.push(resource.organizations[0].name);
    }

    return (
      <article
        key={resource.id}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-200 hover:border-slate-300 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
              {typeLabel}
            </span>
            {visibilityDisplay && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[11px] font-medium ${visibilityDisplay.color}`}
                title={visibilityDisplay.label}
              >
                {React.createElement(visibilityDisplay.icon, {
                  className: "h-3 w-3",
                })}
                {visibilityDisplay.label}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {showOrderingUI && isExternal && !isSharedView && (
              <ReorderMenu
                itemLabel={resource.name || "link"}
                canMoveUp={linkIndex > 0}
                canMoveDown={linkIndex >= 0 && linkIndex < typeLinks.length - 1}
                onMoveTop={() => handleMoveLinkToIndex(resource.id, typeLabel, 0)}
                onMoveUp={() => handleMoveLinkUp(resource.id, typeLabel)}
                onMoveDown={() => handleMoveLinkDown(resource.id, typeLabel)}
                onMoveBottom={() =>
                  handleMoveLinkToIndex(
                    resource.id,
                    typeLabel,
                    Math.max(typeLinks.length - 1, 0)
                  )
                }
                compact={true}
              />
            )}

            {isExternal && !isSharedView && (
              <button
                type="button"
                onClick={(event) => handlePinToggle(event, resource)}
                className={`rounded-lg p-2 transition-colors ${
                  isResourcePinned(resource)
                    ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                }`}
                title={isResourcePinned(resource) ? "Unpin item" : "Pin item"}
              >
                <FaThumbtack className="h-3.5 w-3.5" />
              </button>
            )}

            {canEditBoardStatus && (
              <BoardStatusMenu
                currentStatusId={getBoardStatusId(resource)}
                onSelect={(nextStatusId) =>
                  handleBoardStatusChange(resource.id, nextStatusId)
                }
                disabled={boardStatusUpdateId === String(resource.id)}
                isUpdating={boardStatusUpdateId === String(resource.id)}
              />
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => openResourceDetails(resource)}
          className="mt-3 w-full text-left"
        >
          <h3 className="text-sm font-semibold text-slate-900 transition-colors hover:text-blue-600">
            {resource.name}
          </h3>

          {previewText && (
            <p className="mt-2 text-sm leading-5 text-slate-600">
              {previewText}
            </p>
          )}
        </button>

        {metaItems.filter(Boolean).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            {metaItems.filter(Boolean).map((item) => (
              <span
                key={`${resource.id}-${item}`}
                className="rounded-full bg-slate-100 px-2 py-1"
              >
                {item}
              </span>
            ))}
          </div>
        )}

        {visibleTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleTags.map((tag) => (
              <span
                key={tag.id || tag.name || tag}
                className="inline-flex items-center rounded-full border px-2 py-1 text-[11px] font-medium"
                style={{
                  backgroundColor: `${tag.color || "#94a3b8"}12`,
                  borderColor: `${tag.color || "#cbd5e1"}55`,
                  color: tag.color || "#475569",
                }}
              >
                {tag.name || tag}
              </span>
            ))}
            {remainingTagCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
                +{remainingTagCount}
              </span>
            )}
          </div>
        )}
      </article>
    );
  };

  const renderBoardColumnBody = (column) => {
    const columnSections =
      collection.type === "external" && boardGrouping === "status"
        ? column.typeSections || []
        : [
            {
              id: `${column.id}-section`,
              label: column.label,
              items: column.items,
            },
          ];

    return (
      <div className="flex-1 min-h-[20rem] p-3">
        {columnSections.map((section, sectionIndex) => (
          <div
            key={section.id}
            className={
              sectionIndex === 0
                ? ""
                : "mt-5 border-t border-dashed border-slate-200 pt-4"
            }
          >
            {collection.type === "external" && boardGrouping === "status" && (
              <div className="mb-3 flex items-center gap-2 px-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Link Type
                </span>
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-semibold text-slate-500">
                  {section.label}
                </span>
              </div>
            )}

            <div className="space-y-3">
              {section.items.map((resource) => renderBoardCard(resource))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (viewMode === "board") {
    const boardColumnsContent = (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {boardColumns.map((column) => (
          <section
            key={column.id}
            className="w-[85vw] max-w-sm flex-shrink-0 sm:w-80 xl:w-[22rem]"
          >
            <div className="flex h-full min-h-[32rem] flex-col rounded-2xl border border-slate-200 bg-slate-50/80 shadow-sm">
              <div className="flex items-center justify-between gap-3 rounded-t-2xl border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${column.badgeClass}`}
                >
                  {column.label}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {column.items.length}
                </span>
              </div>

              {renderBoardColumnBody(column)}
            </div>
          </section>
        ))}
      </div>
    );

    return (
      <>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm text-blue-500">
              {allVisibleLinks.length}{" "}
              {allVisibleLinks.length === 1 ? "Item" : "Items"}
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Grouped by {boardGrouping}
            </span>
            {collection.type === "external" && boardGrouping === "status" && (
              <span className="text-xs font-medium uppercase tracking-wide text-slate-300">
                Sections by link type
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {(isAdmin || collection.userId === currentUserId) &&
              collection.type === "external" &&
              !isSharedView && (
                <button
                  onClick={() => setShowOrderingUI((prev) => !prev)}
                  className={`px-3 py-1 rounded-md flex items-center gap-2 text-sm transition-all ${
                    showOrderingUI
                      ? "bg-orange-100 text-orange-700 border border-orange-300"
                      : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-orange-50"
                  }`}
                  title="Toggle ordering mode"
                >
                  <FaCog className="text-xs" />
                  <span>Arrange</span>
                </button>
              )}
            <p className="text-xs text-slate-500 md:hidden">
              Swipe sideways to move between columns.
            </p>
          </div>
        </div>

        {showOrderingUI && collection.type === "external" && (
          <div className="mb-4 rounded-2xl border border-orange-200 bg-orange-50/80 p-4">
            <div className="mb-3 flex items-center gap-2 text-orange-700">
              <FaCog className="text-sm" />
              <span className="text-sm font-medium">Arrange Link Types</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sortedTypeEntries.map(([typeName], index) => (
                <div
                  key={typeName}
                  className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white px-3 py-2 shadow-sm"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {typeName}
                  </span>
                  <ReorderMenu
                    itemLabel={`${typeName} type`}
                    canMoveUp={index > 0}
                    canMoveDown={index < sortedTypeEntries.length - 1}
                    onMoveTop={() => handleMoveTypeToIndex(typeName, 0)}
                    onMoveUp={() => handleMoveTypeUp(typeName)}
                    onMoveDown={() => handleMoveTypeDown(typeName)}
                    onMoveBottom={() =>
                      handleMoveTypeToIndex(
                        typeName,
                        sortedTypeEntries.length - 1
                      )
                    }
                    align="left"
                    compact={true}
                  />
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-orange-600">
              Each card menu controls the order inside its link type.
            </p>
          </div>
        )}

        {boardColumnsContent}
      </>
    );
  }

  if (collection.type === "external") {
    return (
      <>
        {/* Main Header/Action Bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-500/20">
              {allVisibleLinks.length}{" "}
              {allVisibleLinks.length === 1 ? "Item" : "Items"}
            </div>
            <button
              onClick={() => toggleAll(!expandedItems?.size)}
              className="text-sm text-gray-400 hover:text-gray-800 transition-all duration-200"
              title={expandedItems?.size ? "Collapse All" : "Expand All"}
            >
              <FaChevronDown
                className={`transform transition-transform duration-200 ${
                  expandedItems?.size ? "rotate-180" : ""
                }`}
              />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {/* Ordering Toggle - only for admins */}
            {(isAdmin || collection.userId === currentUserId) &&
              !isSharedView && (
                <button
                  onClick={() => setShowOrderingUI(!showOrderingUI)}
                  className={`px-3 py-1 rounded-md flex items-center gap-2 text-sm transition-all ${
                    showOrderingUI
                      ? "bg-orange-100 text-orange-700 border border-orange-300"
                      : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-orange-50"
                  }`}
                  title="Toggle ordering mode"
                >
                  <FaCog className="text-xs" />
                  <span>Arrange</span>
                </button>
              )}
            {/* Bulk Update Button - right side of header */}
            {(isAdmin || collection.userId === currentUserId) &&
              !isSharedView && (
                <button
                  onClick={() => {
                    if (isBulkMode) {
                      resetBulkState();
                      return;
                    }

                    setIsBulkMode(true);
                  }}
                  className={`px-4 py-2 rounded text-sm font-medium border transition-colors duration-200 ${
                    isBulkMode
                      ? "bg-blue-600 text-white border-blue-700 hover:bg-blue-700"
                      : "bg-blue-50 text-blue-500 border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {isBulkMode ? "Exit Bulk Update" : "Bulk Update"}
                </button>
              )}
          </div>
        </div>

        {/* Ordering Instructions */}
        {showOrderingUI && (
          <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700">
              <FaEllipsisH className="text-sm" />
              <span className="font-medium">Ordering Mode Active</span>
            </div>
            <p className="text-sm text-orange-600 mt-1">
              Open the menu beside a link type or link to move it up, down, to
              the top, or to the bottom.
            </p>
          </div>
        )}

        {/* Global Select All Checkbox - only in bulk mode */}
        {isBulkMode && viewMode === "list" && allVisibleLinks.length > 0 && (
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={
                allVisibleLinks.every((link) => selectedLinks[link.id]) &&
                allVisibleLinks.length > 0
              }
              onChange={(e) => handleSelectAll(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Select All</span>
          </div>
        )}
        {/* Bulk Actions Bar - only at the top and in bulk mode */}
        {isBulkMode && Object.values(selectedLinks).some(Boolean) && (
          <div className="flex flex-wrap items-center gap-4 p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
            <span className="font-medium text-blue-700">Bulk Actions:</span>
            <div className="min-w-[180px] text-gray-500">
              <SelectField
                options={STATUS_OPTIONS.map((opt) => ({
                  id: opt.id,
                  name: opt.label,
                }))}
                value={
                  STATUS_OPTIONS.map((opt) => ({
                    id: opt.id,
                    name: opt.label,
                  })).find((opt) => opt.id === bulkStatus) || null
                }
                onChange={(opt) => setBulkStatus(opt?.id || "")}
                placeholder="Set Status..."
              />
            </div>
            <div className="min-w-[180px] text-gray-500">
              <SelectField
                options={bulkVisibilityOptions}
                value={
                  bulkVisibilityOptions.find(
                    (option) => option.id === bulkVisibility
                  ) || null
                }
                onChange={(opt) => setBulkVisibility(opt?.id || "")}
                placeholder="Set Privacy..."
              />
            </div>
            <span className="text-gray-500 text-xs">
              (Updates selected external links only)
            </span>
            <span className="text-xs text-blue-700 font-semibold">
              {selectedLinkIds.length} selected
            </span>
            <button
              onClick={handleBulkUpdate}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
              disabled={
                selectedLinkIds.length === 0 || !hasPendingBulkChanges
              }
            >
              Save All
            </button>
          </div>
        )}
        {sortedTypeEntries.map(([type, linksGroup], typeIndex) => (
          <div key={type} className="mb-8">
            <div className={`flex justify-between items-center mb-4`}>
              {viewMode === "card" && (
                <div className="flex items-center gap-2">
                  {showOrderingUI && (
                    <ReorderMenu
                      itemLabel={`${type} type`}
                      canMoveUp={typeIndex > 0}
                      canMoveDown={typeIndex < sortedTypeEntries.length - 1}
                      onMoveTop={() => handleMoveTypeToIndex(type, 0)}
                      onMoveUp={() => handleMoveTypeUp(type)}
                      onMoveDown={() => handleMoveTypeDown(type)}
                      onMoveBottom={() =>
                        handleMoveTypeToIndex(type, sortedTypeEntries.length - 1)
                      }
                      align="left"
                      compact={true}
                    />
                  )}
                  <h3 className="text-2xl font-bold text-gray-800 capitalize">
                    {type}
                  </h3>
                </div>
              )}
            </div>

            {viewMode === "list" ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {showOrderingUI && (
                    <ReorderMenu
                      itemLabel={`${type} type`}
                      canMoveUp={typeIndex > 0}
                      canMoveDown={typeIndex < sortedTypeEntries.length - 1}
                      onMoveTop={() => handleMoveTypeToIndex(type, 0)}
                      onMoveUp={() => handleMoveTypeUp(type)}
                      onMoveDown={() => handleMoveTypeDown(type)}
                      onMoveBottom={() =>
                        handleMoveTypeToIndex(type, sortedTypeEntries.length - 1)
                      }
                      align="left"
                      compact={true}
                    />
                  )}
                  <h2 className="text-2xl font-semibold text-gray-800 capitalize">
                    {type}
                  </h2>
                </div>
                {linksGroup.map((resource, index) => (
                  <div
                    key={resource.id}
                    className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200`}
                  >
                    <div className="flex items-center">
                      {/* Expand/collapse button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => {
                            setExpandedItems((prev) => {
                              const newSet = new Set(prev);
                              if (newSet.has(resource.id)) {
                                newSet.delete(resource.id);
                              } else {
                                newSet.add(resource.id);
                              }
                              return newSet;
                            });
                          }}
                          className="p-4 hover:bg-gray-50 transition-colors duration-200 rounded-l-lg"
                          aria-label={
                            expandedItems.has(resource.id)
                              ? "Collapse"
                              : "Expand"
                          }
                        >
                          <FaChevronDown
                            className={`w-4 h-4 text-gray-400 transform transition-transform duration-200 ${
                              expandedItems.has(resource.id) ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      {/* Main content area */}
                      <div className="flex-1 min-w-0 py-4 pr-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                          {/* Top row on mobile: Main content + actions */}
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            {/* Bulk select checkbox - only in bulk mode */}
                            {isBulkMode && (
                              <input
                                type="checkbox"
                                className="flex-shrink-0"
                                checked={!!selectedLinks[resource.id]}
                                onChange={(e) =>
                                  handleSelectLink(
                                    resource.id,
                                    e.target.checked
                                  )
                                }
                              />
                            )}

                            {showOrderingUI && (
                              <ReorderMenu
                                itemLabel={resource.name || "link"}
                                canMoveUp={index > 0}
                                canMoveDown={index < linksGroup.length - 1}
                                onMoveTop={() =>
                                  handleMoveLinkToIndex(resource.id, type, 0)
                                }
                                onMoveUp={() =>
                                  handleMoveLinkUp(resource.id, type)
                                }
                                onMoveDown={() =>
                                  handleMoveLinkDown(resource.id, type)
                                }
                                onMoveBottom={() =>
                                  handleMoveLinkToIndex(
                                    resource.id,
                                    type,
                                    linksGroup.length - 1
                                  )
                                }
                                compact={true}
                              />
                            )}

                            {/* Compact visibility icon */}
                            {resource.visibility && (
                              <span
                                className={`flex-shrink-0 inline-flex items-center text-xs ${
                                  getVisibilityDisplay(
                                    resource.visibility
                                  )?.color?.split(" ")[1] || "text-gray-500"
                                }`}
                                title={`Visibility: ${
                                  getVisibilityDisplay(resource.visibility)
                                    ?.label || resource.visibility
                                }`}
                              >
                                {React.createElement(
                                  getVisibilityDisplay(resource.visibility)
                                    ?.icon || FaLink,
                                  { className: "h-3 w-3" }
                                )}
                              </span>
                            )}

                            {/* Status badge */}
                            <span
                              className={`flex-shrink-0 inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-medium ${getStatusColor(
                                resource.status
                              )}`}
                            >
                              {getStatusLabel(resource.status) || "Active"}
                            </span>

                            {/* Title */}
                            <div className="min-w-0 flex-1">
                              <button
                                onClick={() => {
                                  if (isSharedView && sharedToken) {
                                    const storedEmail =
                                      localStorage.getItem(
                                        "shared-links-email"
                                      );
                                    const emailParam = storedEmail
                                      ? `&email=${encodeURIComponent(
                                          storedEmail
                                        )}`
                                      : "";
                                    router.push(
                                      `/shared/${resource.id}?token=${sharedToken}${emailParam}`
                                    );
                                  } else {
                                    router.push(
                                      `/external-links/${resource.id}`
                                    );
                                  }
                                }}
                                className="font-medium text-gray-900 hover:text-blue-600 transition-colors duration-200 text-left truncate block w-full text-sm sm:text-base"
                              >
                                {resource.name}
                              </button>
                            </div>

                            {/* Desktop actions */}
                            <div className="hidden sm:flex items-center space-x-2 flex-shrink-0">
                              {/* Per-link date picker for selected links */}
                              {isBulkMode && selectedLinks[resource.id] && (
                                <input
                                  type="date"
                                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                                  value={
                                    bulkDates[resource.id] ||
                                    (resource.date
                                      ? resource.date.split("T")[0]
                                      : "")
                                  }
                                  onChange={(e) =>
                                    setBulkDates((prev) => ({
                                      ...prev,
                                      [resource.id]: e.target.value,
                                    }))
                                  }
                                />
                              )}

                              {/* Pin and menu buttons */}
                              {!isBulkMode && !isSharedView && (
                                <>
                                  <button
                                    onClick={(e) =>
                                      handlePinToggle(e, resource)
                                    }
                                    className={`p-2 rounded-lg transition-colors duration-200 ${
                                      isResourcePinned(resource)
                                        ? "text-blue-500 bg-blue-50 hover:text-blue-700 hover:bg-blue-100"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    }`}
                                    title={
                                      isResourcePinned(resource)
                                        ? "Unpin resource"
                                        : "Pin resource"
                                    }
                                  >
                                    <FaThumbtack size={14} />
                                  </button>

                                  {(isAdmin ||
                                    resource.userId === currentUserId) && (
                                    <MoveToCollectionMenu
                                      externalLinkId={resource.id}
                                      currentCollectionId={collection.id}
                                      onDelete={() =>
                                        handleDeleteExternalLink(resource.id)
                                      }
                                      userId={resource.userId}
                                      currentUserId={currentUserId}
                                      isAdmin={isAdmin}
                                      canDelete={
                                        resource.userId === currentUserId
                                      }
                                    />
                                  )}
                                </>
                              )}
                            </div>
                          </div>

                          {/* Second row on mobile: Tags, date/time, and mobile actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                            {/* Tags and date/time row */}
                            <div className="flex flex-col xs:flex-row xs:items-center space-y-1 xs:space-y-0 xs:space-x-3 min-w-0">
                              {/* Tags */}
                              <div className="flex-shrink-0 min-w-0">
                                <TagsDisplay
                                  externalLinkId={resource.id}
                                  showMoreButton={true}
                                />
                              </div>

                              {/* Date and time info - more compact on mobile */}
                              {hasTimeInfo(resource) && (
                                <div className="flex items-center text-xs text-gray-500 flex-shrink-0">
                                  <FaClock className="mr-1 h-3 w-3 flex-shrink-0" />
                                  <span className="flex items-center space-x-1 truncate">
                                    {resource.date && (
                                      <span className="font-medium hidden sm:inline">
                                        {formatDayOfWeek(resource.date)}{" "}
                                        {formatDateStringShort(resource.date)}
                                      </span>
                                    )}
                                    {resource.date && (
                                      <span className="font-medium sm:hidden">
                                        {formatDateStringShort(resource.date)}
                                      </span>
                                    )}
                                    {resource.date && (
                                      <span className="inline-block w-1 h-1 bg-gray-400 rounded-full flex-shrink-0"></span>
                                    )}
                                    <span className="truncate">
                                      {formatTimeDisplay(resource)}
                                    </span>
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Mobile actions row */}
                            <div className="flex sm:hidden items-center justify-between">
                              {/* Per-link date picker for selected links on mobile */}
                              {isBulkMode && selectedLinks[resource.id] && (
                                <input
                                  type="date"
                                  className="border border-gray-300 rounded px-2 py-1 text-sm flex-shrink-0"
                                  value={
                                    bulkDates[resource.id] ||
                                    (resource.date
                                      ? resource.date.split("T")[0]
                                      : "")
                                  }
                                  onChange={(e) =>
                                    setBulkDates((prev) => ({
                                      ...prev,
                                      [resource.id]: e.target.value,
                                    }))
                                  }
                                />
                              )}

                              {/* Mobile action buttons */}
                              {!isBulkMode && !isSharedView && (
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={(e) =>
                                      handlePinToggle(e, resource)
                                    }
                                    className={`p-2 rounded-lg transition-colors duration-200 ${
                                      isResourcePinned(resource)
                                        ? "text-blue-500 bg-blue-50 hover:text-blue-700 hover:bg-blue-100"
                                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                                    }`}
                                    title={
                                      isResourcePinned(resource)
                                        ? "Unpin resource"
                                        : "Pin resource"
                                    }
                                  >
                                    <FaThumbtack size={14} />
                                  </button>

                                  {(isAdmin ||
                                    resource.userId === currentUserId) && (
                                    <MoveToCollectionMenu
                                      externalLinkId={resource.id}
                                      currentCollectionId={collection.id}
                                      onDelete={() =>
                                        handleDeleteExternalLink(resource.id)
                                      }
                                      userId={resource.userId}
                                      currentUserId={currentUserId}
                                      isAdmin={isAdmin}
                                      canDelete={
                                        resource.userId === currentUserId
                                      }
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {expandedItems.has(resource.id) && (
                      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Notes */}
                          <div className="prose prose-sm max-w-none text-gray-700">
                            <h3 className="text-md font-medium mb-2">
                              About this resource:
                            </h3>
                            <div className="bg-white p-3 rounded-lg border border-gray-200 min-h-24">
                              {resource.description ? (
                                <CustomEditor
                                  content={resource.description}
                                  readOnly={true}
                                  transparent={true}
                                  height="100px"
                                />
                              ) : (
                                <p className="text-gray-500 italic">
                                  No description available
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Notations summary if they exist */}
                          <div>
                            <h3 className="text-md font-medium mb-2">Notes:</h3>
                            <div className="bg-white p-3 rounded-lg border border-gray-200 min-h-24">
                              {resource.notations &&
                              resource.notations.length > 0 ? (
                                <div>
                                  <ul className="list-disc pl-4 space-y-1 text-sm">
                                    {resource.notations
                                      .slice(0, 3)
                                      .map((notation, index) => (
                                        <li
                                          key={index}
                                          className="text-gray-700"
                                        >
                                          {notation.title ||
                                            `Note ${index + 1}`}
                                        </li>
                                      ))}
                                  </ul>
                                  {resource.notations.length > 3 && (
                                    <p className="text-blue-600 text-sm mt-2">
                                      +{resource.notations.length - 3} more
                                      notes
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-500 italic">
                                  No notes available
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Tags section in expanded view */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h3 className="text-md font-medium mb-2">Tags:</h3>
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <TagsDisplay
                              externalLinkId={resource.id}
                              showMoreButton={false}
                            />
                            {!resource.id && (
                              <p className="text-gray-500 italic">
                                No tags available
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between mt-4 pt-2 border-t border-gray-200">
                          <div>
                            <a
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              Visit Resource
                            </a>
                          </div>
                          <div className="flex gap-4">
                            <Link
                              href={
                                isSharedView && sharedToken
                                  ? `/shared/${resource.id}?token=${sharedToken}${
                                      typeof window !== "undefined" &&
                                      localStorage.getItem("shared-links-email")
                                        ? `&email=${encodeURIComponent(
                                            localStorage.getItem("shared-links-email")
                                          )}`
                                        : ""
                                    }`
                                  : `/external-links/${resource.id}`
                              }
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              View Details
                            </Link>

                            {(isAdmin || resource.userId === currentUserId) &&
                              !isSharedView && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteExternalLink(resource.id);
                                    }}
                                    className="text-gray-400 hover:text-red-500 transition-colors duration-200 text-sm"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
                {linksGroup.map((resource, index) => (
                  <div key={resource.id} className="space-y-2">
                    {showOrderingUI && (
                      <div className="flex justify-end">
                        <ReorderMenu
                          itemLabel={resource.name || "link"}
                          canMoveUp={index > 0}
                          canMoveDown={index < linksGroup.length - 1}
                          onMoveTop={() =>
                            handleMoveLinkToIndex(resource.id, type, 0)
                          }
                          onMoveUp={() => handleMoveLinkUp(resource.id, type)}
                          onMoveDown={() =>
                            handleMoveLinkDown(resource.id, type)
                          }
                          onMoveBottom={() =>
                            handleMoveLinkToIndex(
                              resource.id,
                              type,
                              linksGroup.length - 1
                            )
                          }
                        />
                      </div>
                    )}

                    <div
                      className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200`}
                    >
                      <ExternalLinkCard
                        status={resource.status}
                        id={resource.id}
                        url={resource.url}
                        name={resource.name}
                        type={resource.type}
                        notes={resource.notations}
                        icon={collection.icon}
                        date={resource.date}
                        dateAdded={resource.dateAdded}
                        description={resource.description}
                        imageUrl={resource.imageUrl}
                        startTime={resource.startTime}
                        endTime={resource.endTime}
                        timezone={resource.timezone}
                        onView={() => {
                          if (isSharedView && sharedToken) {
                            // Get email from localStorage for shared links
                            const storedEmail =
                              localStorage.getItem("shared-links-email");
                            const emailParam = storedEmail
                              ? `&email=${encodeURIComponent(storedEmail)}`
                              : "";
                            router.push(
                              `/shared/${resource.id}?token=${sharedToken}${emailParam}`
                            );
                          } else {
                            router.push(`/external-links/${resource.id}`);
                          }
                        }}
                        isAdmin={isAdmin}
                        isSharedView={isSharedView}
                        sharedToken={sharedToken}
                        onUpdateExternalLink={(id, formData) =>
                          onUpdateExternalLink(id, formData)
                        }
                        collectionId={collection.id}
                        moveToCollectionMenuProps={{
                          externalLinkId: resource.id,
                          currentCollectionId: collection.id,
                          onDelete: () => handleDeleteExternalLink(resource.id),
                        }}
                        userId={resource.userId}
                        currentUserId={currentUserId}
                        onShowSocialMedia={() =>
                          onShowSocialMedia && onShowSocialMedia(resource)
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </>
    );
  }

  // Group by resource type (fallback to "Other")
  const groupedResources = filteredCollectionResources.reduce(
    (acc, resource) => {
      const typeBaseName =
        resourceTypes.find((type) => type.id === resource.typeId)?.name ||
        "Other";
      const typeName = typeBaseName.endsWith("s")
        ? typeBaseName
        : typeBaseName + "s";
      if (!acc[typeName]) acc[typeName] = [];
      acc[typeName].push(resource);
      return acc;
    },
    {}
  );

  return (
    <>
      {Object.entries(groupedResources).map(([type, resourcesGroup]) => (
        <div key={type} className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {viewMode === "card" && (
              <h3 className="text-2xl font-bold text-gray-800 capitalize">
                {type}
              </h3>
            )}
          </div>

          {viewMode === "list" ? (
            <ResourceListView
              resources={resourcesGroup}
              isAdmin={isAdmin}
              onDelete={handleDeleteResource}
              onView={(resource) => {
                if (isSharedView && sharedToken) {
                  // Get email from localStorage for shared links
                  const storedEmail =
                    localStorage.getItem("shared-links-email");
                  const emailParam = storedEmail
                    ? `&email=${encodeURIComponent(storedEmail)}`
                    : "";
                  router.push(
                    `/shared/${resource.id}?token=${sharedToken}${emailParam}`
                  );
                } else {
                  router.push(`/resources/${resource.id}`);
                }
              }}
              expandedItems={expandedItems}
              setExpandedItems={setExpandedItems}
              isSharedView={isSharedView}
              sharedToken={sharedToken}
              collectionId={collection.id}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {resourcesGroup.map((resource) => (
                <div key={resource.id}>
                  <ResourceCard
                    resource={resource}
                    isFlipped={flippedCardId === resource.id}
                    setFlippedCardId={setFlippedCardId}
                    notes={resource.notes}
                    onClose={() => setFlippedCardId(null)}
                    deleteResource={handleDeleteResource}
                    deleteOption={true}
                    isAdmin={isAdmin}
                    resourceTypes={resourceTypes}
                    showCopyLink={false}
                    isSharedView={isSharedView}
                    sharedToken={sharedToken}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export default ResourcesGrid;
