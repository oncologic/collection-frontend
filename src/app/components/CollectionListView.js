import React, { useState, useMemo, useCallback } from "react";
import { formatVisibilityForDisplay } from "@/app/utils/visibility";
import {
  FaChevronDown,
  FaTrash,
  FaExternalLinkAlt,
  FaLink,
  FaThumbtack,
  FaUsers,
  FaDatabase,
  FaClock,
  FaLock,
  FaGlobe,
  FaEye,
} from "react-icons/fa";
import { STATUS_OPTIONS } from "./forms/AddCollectionForm";
import { useRouter } from "next/navigation";
import {
  usePinItems,
  useUnpinItems,
  useGetPinnedItems,
} from "../hooks/usePinned";
import { toast } from "react-hot-toast";
import { updateAttachment } from "../api/attachmentsApi";

// Helper function to strip HTML tags and decode entities
const stripHtml = (html) => {
  if (!html) return "";
  // Create a temporary div to parse HTML
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
};

const CollectionListView = ({
  collections,
  isAdmin,
  onDelete,
  onView,
  onShare,
  currentUserId,
  getCollectionNavigation,
}) => {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [expandedNotations, setExpandedNotations] = useState(new Set());
  const { mutateAsync: pinItemsAsync } = usePinItems();
  const { mutateAsync: unpinItemsAsync } = useUnpinItems();
  const { data: pinnedItems } = useGetPinnedItems();

  const isPinned = useMemo(() => {
    if (!pinnedItems) return new Set();
    return new Set(pinnedItems.map((item) => item.id));
  }, [pinnedItems]);

  // Bulk selection state
  const [selectedLinks, setSelectedLinks] = useState({});
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkDates, setBulkDates] = useState({});
  const [isBulkMode, setIsBulkMode] = useState(false);

  // Helper: get all visible external links that user can edit
  const allVisibleExternalLinks = useMemo(() => {
    return collections
      .filter((c) => c.type === "external")
      .filter((c) => isAdmin || c.userId === currentUserId) // Only collections user can edit
      .flatMap((c) =>
        (c.externalLinks || []).filter(
          (item) => !["completed", "archived"].includes(item.status)
        )
      );
  }, [collections, isAdmin, currentUserId]);

  // Helper function to check if user can edit collection
  const canEditCollection = useCallback((collection) => {
    return isAdmin || collection.userId === currentUserId;
  }, [isAdmin, currentUserId]);

  // Helper function to check if collection has external links with collaborators
  const hasCollaborators = (collection) => {
    if (collection.type !== "external" || !collection.externalLinks) {
      return false;
    }

    return collection.externalLinks.some(
      (link) => link.collaborators && link.collaborators.length > 0
    );
  };

  // Helper function to count total collaborators in a collection
  const getTotalCollaborators = (collection) => {
    if (collection.type !== "external" || !collection.externalLinks) {
      return 0;
    }

    return collection.externalLinks.reduce((total, link) => {
      return total + (link.collaborators ? link.collaborators.length : 0);
    }, 0);
  };

  // Get collection type styling
  const getCollectionTypeStyles = (type) => {
    if (type === "external") {
      return {
        bgColor: "bg-purple-50",
        textColor: "text-purple-700",
        borderColor: "border-purple-200",
        icon: FaExternalLinkAlt,
      };
    } else {
      return {
        bgColor: "bg-green-50",
        textColor: "text-green-700",
        borderColor: "border-green-200",
        icon: FaDatabase,
      };
    }
  };

  // Get visibility icon
  const getVisibilityIcon = (visibility) => {
    switch (visibility) {
      case "public":
        return FaGlobe;
      case "private":
        return FaLock;
      case "unlisted":
        return FaEye;
      default:
        return FaEye;
    }
  };

  const handlePinToggle = async (e, collection) => {
    e.stopPropagation();
    try {
      if (isPinned.has(collection.id)) {
        await unpinItemsAsync([collection.id]);
        toast.success("Collection unpinned successfully");
      } else {
        await pinItemsAsync([
          {
            id: collection.id,
            type: "collection",
            name: collection.name,
            description: collection.description || "",
            metadata: {
              type: collection.type,
              status: collection.status,
              itemCount:
                (collection.resources || collection.externalLinks)?.length || 0,
            },
          },
        ]);
        toast.success("Collection pinned successfully");
      }
    } catch (error) {
      console.error("Error toggling pin state:", error);
    }
  };

  const toggleItem = (id) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleNotations = (e, itemId) => {
    e.stopPropagation();
    setExpandedNotations((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const toggleAll = (expand) => {
    if (expand) {
      setExpandedItems(new Set(collections.map((c) => c.id)));
    } else {
      setExpandedItems(new Set());
    }
  };

  const handleSelectLink = (linkId, checked) => {
    setSelectedLinks((prev) => ({ ...prev, [linkId]: checked }));
  };

  const handleSelectAll = (checked) => {
    const newSelected = {};
    if (checked) {
      allVisibleExternalLinks.forEach((link) => {
        newSelected[link.id] = true;
      });
    }
    setSelectedLinks(newSelected);
  };

  const handleBulkStatusChange = (e) => {
    setBulkStatus(e.target.value);
  };

  const handleBulkDateChange = (linkId, date) => {
    setBulkDates((prev) => ({ ...prev, [linkId]: date }));
  };

  // Save all bulk updates
  const handleBulkSave = async () => {
    // Only process links from collections the user can edit
    for (const collection of collections) {
      if (collection.type === "external" && canEditCollection(collection)) {
        const editableLinks = (collection.externalLinks || []).filter(
          (link) =>
            selectedLinks[link.id] &&
            !["completed", "archived"].includes(link.status)
        );

        for (const link of editableLinks) {
          // todo: come back to this - implement actual update logic
        }
      }
    }

    setSelectedLinks({});
    setBulkStatus("");
    setBulkDates({});
    setIsBulkMode(false);
    toast.success("Bulk update complete");
  };

  // Check if user has any editable selected links
  const hasEditableSelectedLinks = useMemo(() => {
    return Object.keys(selectedLinks).some((linkId) => {
      if (!selectedLinks[linkId]) return false;

      // Find the collection this link belongs to
      const parentCollection = collections.find(
        (c) =>
          c.type === "external" &&
          c.externalLinks?.some((link) => link.id === linkId)
      );

      return parentCollection && canEditCollection(parentCollection);
    });
  }, [selectedLinks, collections, canEditCollection]);

  return (
    <div className="w-full">
      {/* Simple bulk actions bar - only show if user can edit selected items */}
      {hasEditableSelectedLinks && (
        <div className="flex items-center gap-4 p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
          <span className="font-medium text-blue-700">Bulk Actions:</span>
          <select
            value={bulkStatus}
            onChange={handleBulkStatusChange}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          >
            <option value="">Set Status...</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name}
              </option>
            ))}
          </select>
          <span className="text-gray-500 text-xs">
            (Set status for all selected)
          </span>
          <button
            onClick={handleBulkSave}
            className="ml-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
          >
            Save All
          </button>
        </div>
      )}

      {/* Simple header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded text-sm">
            {collections.length}{" "}
            {collections.length === 1 ? "Collection" : "Collections"}
          </div>
          <button
            onClick={() => toggleAll(!expandedItems?.size)}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaChevronDown
              className={`transform transition-transform duration-200 ${
                expandedItems?.size ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Collections list */}
      <div className="space-y-3">
        {collections.map((collection) => {
          const typeStyles = getCollectionTypeStyles(collection.type);
          const TypeIcon = typeStyles.icon;
          const VisibilityIcon = getVisibilityIcon(collection.visibility);

          return (
            <div
              key={collection.id}
              className="bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all duration-200"
            >
              <div
                onClick={() => toggleItem(collection.id)}
                className="flex items-center px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {/* Expand/Collapse Icon */}
                <span className="text-gray-400 mr-4 transition-colors">
                  <FaChevronDown
                    className={`transform transition-transform duration-200 ${
                      expandedItems?.has(collection.id) ? "rotate-180" : ""
                    }`}
                  />
                </span>

                {/* Collection type indicator */}
                <div
                  className={`p-2 rounded ${typeStyles.bgColor} ${typeStyles.borderColor} border mr-4`}
                >
                  <TypeIcon
                    className={`h-4 w-4 ${typeStyles.textColor
                      .replace("text-", "text-")
                      .replace("-700", "-600")}`}
                  />
                </div>

                {/* Collection Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${typeStyles.textColor} ${typeStyles.bgColor}`}
                    >
                      {collection.type === "external" ? "External" : "Resource"}
                    </span>

                    <span className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-600 bg-gray-100">
                      <VisibilityIcon className="h-2.5 w-2.5" />
                      {formatVisibilityForDisplay(collection.visibility)}
                    </span>

                    {collection.status && (
                      <span className="px-2 py-1 rounded text-xs text-gray-600 bg-gray-100 capitalize">
                        {collection.status}
                      </span>
                    )}

                    <span className="px-2 py-1 rounded text-xs text-gray-600 bg-gray-100">
                      {(collection.resources || collection.externalLinks)
                        ?.length || 0}{" "}
                      items
                    </span>

                    {hasCollaborators(collection) && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-600 bg-gray-100">
                        <FaUsers className="h-2.5 w-2.5" />
                        {getTotalCollaborators(collection)}
                      </span>
                    )}
                  </div>

                  <h3
                    onClick={(e) => {
                      e.stopPropagation();
                      if (getCollectionNavigation) {
                        getCollectionNavigation(collection)();
                      } else {
                        router.push(`/collections/${collection.id}`);
                      }
                    }}
                    className="font-semibold text-lg text-gray-900 hover:text-blue-600 transition-colors cursor-pointer mb-1"
                  >
                    {collection.name}
                  </h3>

                  {collection.description && (
                    <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {stripHtml(collection.description)}
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <FaClock className="h-3 w-3" />
                    <span>
                      Updated:{" "}
                      {(() => {
                        const date = new Date(
                          collection.updatedAt || collection.createdAt
                        );
                        return date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year:
                            date.getFullYear() !== new Date().getFullYear()
                              ? "numeric"
                              : undefined,
                        });
                      })()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => handlePinToggle(e, collection)}
                    className={`p-2 rounded transition-colors ${
                      isPinned.has(collection.id)
                        ? "text-blue-600 bg-blue-50 hover:bg-blue-100"
                        : "text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                    }`}
                    title={
                      isPinned.has(collection.id)
                        ? "Unpin collection"
                        : "Pin collection"
                    }
                  >
                    <FaThumbtack size={14} />
                  </button>
                  {(isAdmin || collection.userId === currentUserId) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(collection.id);
                      }}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    >
                      <FaTrash size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Items Preview - Only shown when expanded */}
              {expandedItems?.has(collection.id) && (
                <div className="px-4 pb-2 border-t border-gray-100 bg-gray-50">
                  <div className="pt-2">
                    <div className="space-y-1">
                      {(collection.type === "external"
                        ? collection.externalLinks?.filter(
                            (item) =>
                              !["completed", "archived"].includes(item.status)
                          )
                        : collection.resources
                      )?.map((item) => (
                        <div
                          key={item.id}
                          className="bg-white rounded border border-gray-200 p-2 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {/* Bulk select checkbox for external links - only if user can edit */}
                            {collection.type === "external" &&
                              canEditCollection(collection) && (
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  checked={!!selectedLinks[item.id]}
                                  onChange={(e) =>
                                    handleSelectLink(item.id, e.target.checked)
                                  }
                                />
                              )}

                            <a
                              href={`/${
                                collection.type === "external"
                                  ? "external-links"
                                  : "resources"
                              }/${item.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            >
                              <FaLink size={10} />
                            </a>

                            <span
                              onClick={(e) => {
                                const notes =
                                  collection.type === "external"
                                    ? item?.notations
                                    : item.notes;
                                notes && toggleNotations(e, item.id);
                              }}
                              className={`flex-1 flex items-center text-sm text-gray-700 hover:text-gray-900 transition-colors ${
                                (
                                  collection.type === "external"
                                    ? item?.notations
                                    : item.notes
                                )
                                  ? "cursor-pointer hover:text-blue-700"
                                  : ""
                              }`}
                            >
                              <span className="truncate">{item.name}</span>
                              {(collection.type === "external"
                                ? item?.notations
                                : item.notes) && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs text-blue-600 bg-blue-50 rounded">
                                  {collection.type === "external"
                                    ? typeof item.externalLinks?.notations ===
                                      "string"
                                      ? "1 note"
                                      : `${item?.notations?.length} notes`
                                    : typeof item.notes === "string"
                                    ? "1 note"
                                    : `${item.notes.length} notes`}
                                </span>
                              )}
                            </span>

                            {/* Per-link date picker for selected links - only if user can edit */}
                            {collection.type === "external" &&
                              canEditCollection(collection) &&
                              selectedLinks[item.id] && (
                                <input
                                  type="date"
                                  className="border border-gray-300 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                  value={
                                    bulkDates[item.id] ||
                                    item.date?.split("T")[0] ||
                                    ""
                                  }
                                  onChange={(e) =>
                                    handleBulkDateChange(
                                      item.id,
                                      e.target.value
                                    )
                                  }
                                />
                              )}
                          </div>

                          {/* Notations Dropdown */}
                          {(collection.type === "external"
                            ? item?.notations
                            : item.notes) &&
                            expandedNotations.has(item.id) && (
                              <div className="mt-2 pl-4 border-l-2 border-gray-200">
                                <div className="space-y-1">
                                  {(collection.type === "external"
                                    ? typeof item?.notations === "string"
                                      ? [{ name: item.notations }]
                                      : item?.notations?.filter((note) =>
                                          [
                                            "In Progress",
                                            "Waiting",
                                            "Pending",
                                          ].includes(note.status)
                                        )
                                    : typeof item.notes === "string"
                                    ? [{ content: item.notes }]
                                    : item.notes
                                  ).map((note, index) => (
                                    <div
                                      key={index}
                                      className="flex items-start gap-2 text-xs"
                                    >
                                      {collection.type === "external" && (
                                        <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                          {note.status}
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-600">
                                        {stripHtml(
                                          collection.type === "external"
                                            ? note.title
                                            : note.content
                                        )}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CollectionListView;
