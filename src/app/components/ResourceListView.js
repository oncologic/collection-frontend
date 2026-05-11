import React, { useState, useMemo } from "react";
import CustomEditor from "./common/CustomEditor";
import { useRouter } from "next/navigation";
import { STATUS_OPTIONS } from "./forms/AddCollectionForm";
import {
  FaChevronCircleDown,
  FaChevronDown,
  FaComment,
  FaThumbtack,
  FaGripVertical,
  FaGlobe,
  FaLock,
  FaLink,
} from "react-icons/fa";
import MoveToCollectionMenu from "./common/MoveToCollectionMenu";
import { formatDateString, formatLongDate } from "../utils/general";
import {
  usePinItems,
  useUnpinItems,
  useGetPinnedItems,
} from "../hooks/usePinned";
import { toast } from "react-hot-toast";
import SelectField from "@/app/components/inputs/SelectField";

const ResourceListView = ({
  resources,
  isAdmin,
  onDelete,
  onView,
  collectionId,
  expandedItems,
  setExpandedItems,
  isSharedView = false,
  sharedToken = null,
  currentUserId,
  onBulkUpdate,
  selectedLinks = null,
  onSelectLink = () => {},
  clearSelectedLinks = () => {},
  selectedCount = 0,
  // New props for drag and drop
  showOrderingUI = false,
  onDragStart = () => {},
  onDragOver = () => {},
  onDrop = () => {},
  isDragging = false,
  dragType = "link",
}) => {
  const router = useRouter();
  const [activeNoteId, setActiveNoteId] = useState(null);

  // Add pin-related hooks
  const { mutateAsync: pinItemsAsync } = usePinItems();
  const { mutateAsync: unpinItemsAsync } = useUnpinItems();
  const { data: pinnedItems } = useGetPinnedItems();

  // Track pinned state
  const isPinned = useMemo(() => {
    if (!pinnedItems) return new Set();
    return new Set(pinnedItems.map((item) => item.id));
  }, [pinnedItems]);

  // Bulk selection state
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkDates, setBulkDates] = useState({}); // { [linkId]: dateString }

  // Helper: get all visible resources/links
  const allVisibleLinks = useMemo(() => resources, [resources]);

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

  const handlePinToggle = async (e, resource) => {
    e.stopPropagation();
    try {
      if (isPinned.has(resource.id)) {
        await unpinItemsAsync([resource.id]);
        toast.success("Resource unpinned successfully");
      } else {
        await pinItemsAsync([
          {
            id: resource.id,
            type: resource.type === "external" ? "external_link" : "resource",
            name: resource.name,
            description: resource.description || "",
            metadata: {
              resourceType: resource.resourceType?.name || null,
              sensitivityLevel: resource.sensitivityLevel?.name || null,
              expertiseLevel: resource.expertiseLevel?.name || null,
              date: resource.resourceDate || resource.dateAdded,
            },
          },
        ]);
        toast.success("Resource pinned successfully");
      }
    } catch (error) {
      console.error("Error toggling pin state:", error);
      toast.error("Failed to toggle pin state");
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

  const toggleAll = (expand) => {
    if (expand) {
      setExpandedItems(new Set(resources.map((r) => r.id)));
    } else {
      setExpandedItems(new Set());
    }
  };

  const handleNoteClick = (e, resourceId) => {
    e.stopPropagation();
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      newSet.add(resourceId);
      return newSet;
    });
    setActiveNoteId(activeNoteId === resourceId ? null : resourceId);
  };

  const handleTitleClick = (e, resource) => {
    e.stopPropagation();
    onView(resource);
  };

  const formatTypeText = (text) => {
    // Handle undefined or null text
    if (!text) {
      return `${resources.length} items`;
    }
    
    const MAX_LENGTH = 20; // Adjust this value as needed
    if (text.length > MAX_LENGTH) {
      return `${resources.length}`;
    }
    // Check if text already ends with 's' before adding it
    return `${resources.length} ${
      resources.length === 1 ? text : text.endsWith("s") ? text : text + "s"
    }`;
  };

  const handleBulkStatusChange = (e) => {
    setBulkStatus(e.target.value);
  };

  const handleBulkDateChange = (linkId, date) => {
    setBulkDates((prev) => ({ ...prev, [linkId]: date }));
  };

  // Save all bulk updates
  const handleBulkSave = async () => {
    if (onBulkUpdate) {
      const updates = allVisibleLinks
        .filter((link) => selectedLinks && selectedLinks[link.id])
        .map((link) => ({
          id: link.id,
          status: bulkStatus || link.status,
          date: bulkDates[link.id] || link.date,
        }));
      await onBulkUpdate(updates);
    }
    clearSelectedLinks();
    setBulkStatus("");
    setBulkDates({});
  };

  return (
    <div className="space-y-0.5 sm:space-y-1 w-full">
      <div
        className={`flex items-center justify-between mb-4 ${
          showOrderingUI && dragType === "type" ? "cursor-move" : ""
        }`}
        draggable={showOrderingUI && dragType === "type"}
        onDragStart={(e) =>
          showOrderingUI &&
          dragType === "type" &&
          onDragStart(
            e,
            resources[0].resourceDate
              ? resources[0].typeName
              : resources[0].type,
            "type"
          )
        }
        onDragOver={
          showOrderingUI && dragType === "type" ? onDragOver : undefined
        }
        onDrop={(e) =>
          showOrderingUI &&
          dragType === "type" &&
          onDrop(
            e,
            resources[0].resourceDate
              ? resources[0].typeName
              : resources[0].type,
            "type"
          )
        }
      >
        <div className="flex items-center gap-2">
          {showOrderingUI && dragType === "type" && (
            <FaGripVertical className="text-gray-400 cursor-move" />
          )}
          <h3 className="text-2xl font-bold text-gray-800 capitalize">
            {resources[0].resourceDate
              ? resources[0].typeName
              : resources[0].type}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-blue-500/10 capitalize text-blue-400 px-3 py-1 rounded-full text-sm border border-blue-500/20">
            {formatTypeText(
              resources[0].resourceDate
                ? resources[0].typeName
                : resources[0].type
            )}
          </div>
          <button
            onClick={() => toggleAll(!expandedItems?.size)}
            className="text-sm text-gray-400 hover:text-gray-800 px-3 transition-all duration-200"
          >
            <FaChevronDown
              className={`transform transition-transform duration-200 ${
                expandedItems?.size ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
              showOrderingUI && dragType === "link" ? "cursor-move" : ""
            }`}
            draggable={showOrderingUI && dragType === "link"}
            onDragStart={(e) =>
              showOrderingUI &&
              dragType === "link" &&
              onDragStart(e, resource, "link")
            }
            onDragOver={
              showOrderingUI && dragType === "link" ? onDragOver : undefined
            }
            onDrop={(e) =>
              showOrderingUI &&
              dragType === "link" &&
              onDrop(e, resource, "link")
            }
          >
            <div
              className={`flex items-center px-2 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 transition-all duration-200 ${
                expandedItems?.has(resource.id) ? "rounded-t-lg" : "rounded-lg"
              }`}
            >
              {/* Bulk select checkbox */}
              {!isSharedView && selectedLinks && (
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={!!(selectedLinks && selectedLinks[resource.id])}
                  onChange={(e) => onSelectLink(resource.id, e.target.checked)}
                />
              )}

              {/* Drag handle when in ordering mode */}
              {showOrderingUI && dragType === "link" && (
                <FaGripVertical className="text-gray-400 cursor-move mr-2" />
              )}

              <span
                onClick={() => toggleItem(resource.id)}
                className="text-gray-400 mr-2 sm:mr-3 transition-transform duration-200 transform cursor-pointer"
              >
                <FaChevronDown
                  className={`transform ${
                    expandedItems?.has(resource.id) ? "rotate-0" : "-rotate-90"
                  }`}
                  size={14}
                />
              </span>

              <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 min-w-0">
                {/* First row on mobile: Status, visibility, and title */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  {/* Compact visibility icon */}
                  {resource.visibility && (
                    <span
                      className={`inline-flex items-center text-xs ${
                        getVisibilityDisplay(resource.visibility)?.color?.split(
                          " "
                        )[1] || "text-gray-500"
                      }`}
                      title={`Visibility: ${
                        getVisibilityDisplay(resource.visibility)?.label ||
                        resource.visibility
                      }`}
                    >
                      {React.createElement(
                        getVisibilityDisplay(resource.visibility)?.icon ||
                          FaLink,
                        { className: "h-3 w-3" }
                      )}
                    </span>
                  )}

                  {resource.status && (
                    <span
                      className={`inline-flex capitalize items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        STATUS_OPTIONS.find(
                          (option) => option.id === resource.status
                        )?.color || "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {resource.status}
                    </span>
                  )}

                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      onClick={(e) => handleTitleClick(e, resource)}
                      className="font-medium text-gray-900 truncate text-sm sm:text-base cursor-pointer hover:text-blue-500 transition-colors duration-200"
                    >
                      {resource.name}
                    </span>
                  </div>

                  {/* Desktop date - hidden on mobile */}
                  <span className="text-xs sm:text-sm text-gray-500 hidden lg:inline flex-shrink-0">
                    {formatDateString(
                      resource.date ??
                        resource.dateAdded ??
                        resource.resourceDate
                    )}
                  </span>
                </div>

                {/* Second row on mobile: Date and actions */}
                <div className="flex sm:hidden items-center justify-between w-full">
                  {/* Mobile date */}
                  <span className="text-xs text-gray-500 flex-shrink-0 max-w-[100px] truncate">
                    {formatDateString(
                      resource.date ??
                        resource.dateAdded ??
                        resource.resourceDate
                    )}
                  </span>

                  {/* Mobile actions */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    {/* Per-link date picker for selected links */}
                    {!isSharedView && selectedLinks && selectedLinks[resource.id] && (
                      <input
                        type="date"
                        className="border rounded px-1 py-0.5 text-xs w-24"
                        value={
                          bulkDates[resource.id] ||
                          resource.date?.split("T")[0] ||
                          ""
                        }
                        onChange={(e) =>
                          handleBulkDateChange(resource.id, e.target.value)
                        }
                      />
                    )}

                    {resource.resourceDate && resource.notes && (
                      <button
                        onClick={(e) => handleNoteClick(e, resource.id)}
                        className="text-gray-400 hover:text-blue-500 transition-colors duration-200 text-sm flex items-center gap-1 p-1"
                      >
                        <FaComment size={12} />
                      </button>
                    )}

                    {/* Add Pin Button */}
                    {!isSharedView && (
                      <button
                        onClick={(e) => handlePinToggle(e, resource)}
                        className={`text-sm flex items-center gap-1 transition-colors duration-200 p-1 ${
                          isPinned.has(resource.id)
                            ? "text-blue-400 hover:text-blue-600"
                            : "text-gray-400 hover:text-gray-600"
                        }`}
                        title={
                          isPinned.has(resource.id)
                            ? "Unpin resource"
                            : "Pin resource"
                        }
                      >
                        <FaThumbtack size={12} />
                      </button>
                    )}

                    {(isAdmin || resource.userId === currentUserId) &&
                      !isSharedView && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(resource.id);
                            }}
                            className="text-gray-400 hover:text-red-500 transition-colors duration-200 text-xs p-1"
                          >
                            Delete
                          </button>
                          {isAdmin && (
                            <MoveToCollectionMenu
                              externalLinkId={resource.id}
                              currentCollectionId={collectionId}
                              userId={resource.userId}
                              currentUserId={currentUserId}
                              isAdmin={isAdmin}
                              onDelete={() => onDelete(resource.id)}
                            />
                          )}
                        </>
                      )}
                  </div>
                </div>
              </div>

              {/* Desktop actions - hidden on mobile */}
              <div className="hidden sm:flex items-center gap-2 sm:gap-4 ml-2">
                {/* Per-link date picker for selected links */}
                {!isSharedView && selectedLinks && selectedLinks[resource.id] && (
                  <input
                    type="date"
                    className="ml-4 border rounded px-2 py-1 text-xs"
                    value={
                      bulkDates[resource.id] ||
                      resource.date?.split("T")[0] ||
                      ""
                    }
                    onChange={(e) =>
                      handleBulkDateChange(resource.id, e.target.value)
                    }
                  />
                )}

                <div className="flex gap-2 sm:gap-3">
                  {resource.resourceDate && resource.notes && (
                    <button
                      onClick={(e) => handleNoteClick(e, resource.id)}
                      className="text-gray-400 hover:text-blue-500 transition-colors duration-200 text-sm flex items-center gap-1"
                    >
                      <FaComment size={14} />
                    </button>
                  )}

                  {/* Add Pin Button */}
                  {!isSharedView && (
                    <button
                      onClick={(e) => handlePinToggle(e, resource)}
                      className={`text-sm flex items-center gap-1 transition-colors duration-200 ${
                        isPinned.has(resource.id)
                          ? "text-blue-400 hover:text-blue-600"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                      title={
                        isPinned.has(resource.id)
                          ? "Unpin resource"
                          : "Pin resource"
                      }
                    >
                      <FaThumbtack size={14} />
                    </button>
                  )}

                  {(isAdmin || resource.userId === currentUserId) &&
                    !isSharedView && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(resource.id);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors duration-200 text-sm"
                        >
                          Delete
                        </button>
                        {isAdmin && (
                          <MoveToCollectionMenu
                            externalLinkId={resource.id}
                            currentCollectionId={collectionId}
                            userId={resource.userId}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                            onDelete={() => onDelete(resource.id)}
                          />
                        )}
                      </>
                    )}
                </div>
              </div>
            </div>

            {expandedItems?.has(resource.id) && (
              <div className="p-4 border-t border-gray-100">
                {resource.description && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Description
                    </h4>
                    {resource.description.startsWith("<") ? (
                      <div className="prose prose-sm max-w-none">
                        <CustomEditor
                          content={resource.description}
                          readonly={true}
                          scrollable={true}
                        />
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">
                        {resource.description}
                      </p>
                    )}
                  </div>
                )}

                {resource.notes && resource.notes.length > 0 && (
                  <div className="bg-gray-50 rounded-md -mx-2 p-4 mt-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      Notes
                    </h4>
                    <div className="space-y-3">
                      {resource.notes.map((note, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded ${
                            activeNoteId === resource.id
                              ? "bg-blue-50 border border-blue-100"
                              : "bg-white border border-gray-100"
                          }`}
                        >
                          {note.title && (
                            <h5 className="font-medium text-gray-900 text-sm">
                              {note.title}
                            </h5>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            {note.text || note.notes}
                          </p>
                          {note.date && (
                            <div className="text-xs text-gray-400 mt-2">
                              {formatDateString(note.date)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResourceListView;
