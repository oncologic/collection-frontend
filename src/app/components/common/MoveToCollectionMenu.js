import React, { useState, useRef } from "react";
import { FaEllipsisV, FaTrash } from "react-icons/fa";
import CollectionSearchModal from "../CollectionSearchModal";
import { useRouter } from "next/navigation";
import { useUpdateExternalLinkInCollection } from "@/app/hooks/useCollections";

const MoveToCollectionMenu = ({
  externalLinkId,
  currentCollectionId,
  onDelete,
  canDelete = false,
  userId,
  currentUserId,
  isAdmin = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const updateExternalLinkInCollection = useUpdateExternalLinkInCollection();
  const router = useRouter();

  // Determine if the current user can delete this item
  const userCanDelete = isAdmin || userId === currentUserId || canDelete;

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMoveToCollection = async (collection) => {
    try {
      const linkData = {
        collectionId: collection.id,
        name: collection.name,
      };
      await updateExternalLinkInCollection.mutateAsync({
        collectionId: collection.id,
        externalLinkId,
        linkData,
        isMovingCollections: true,
      });
      setShowModal(false);
      setShowDropdown(false);
    } catch (error) {
      console.error("Error moving to collection:", error);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowDropdown(false);
    if (onDelete && typeof onDelete === "function") {
      onDelete();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}
        className="p-2 z-20 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        title="Options"
      >
        <FaEllipsisV size={16} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(false);
                setShowModal(true);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600"
            >
              Move to Collection
            </button>
            {/* Add delete option if user has permission */}
            {userCanDelete && (
              <button
                onClick={handleDelete}
                className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
              >
                <FaTrash size={14} />
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      <CollectionSearchModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleMoveToCollection}
      />
    </div>
  );
};

export default MoveToCollectionMenu;
