import { useState } from "react";
import {
  FaFolder,
  FaEllipsisH,
  FaPen,
  FaTrash,
  FaCheck,
  FaPlus,
  FaThLarge,
  FaList,
} from "react-icons/fa";
import Modal from "./Modal";
import AddFolderForm from "./forms/AddFolderForm";
import AddCollectionsModal from "./AddCollectionsModal";
import DOMPurify from "dompurify";
import { useContextAuth } from "../context/authContext";

const FoldersList = ({
  folders = [],
  collections = [],
  onEditFolder,
  onDeleteFolder,
  isAdmin = false,
  organizations = [],
  setFolderFilteredCollections,
  addCollectionToFolder,
  removeCollectionFromFolder,
}) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showAddCollections, setShowAddCollections] = useState(false);
  const [viewMode, setViewMode] = useState("list");
  const { selectedTenants } = useContextAuth();
  const handleEditClick = (folder) => {
    setSelectedFolder(folder);
    setEditModalOpen(true);
    setOpenMenuId(null);
  };

  const handleMenuClick = (folderId) => {
    setOpenMenuId(openMenuId === folderId ? null : folderId);
  };

  const onApplyFolder = (folder) => {
    const filteredCollections = collections.filter((collection) =>
      folder.collections.some(
        (folderCollection) => folderCollection.id === collection.id
      )
    );
    setFolderFilteredCollections(filteredCollections);
    setOpenMenuId(null);
  };

  const handleAddCollections = (folder) => {
    setSelectedFolder(folder);
    setShowAddCollections(true);
    setOpenMenuId(null);
  };

  const handleRemoveCollection = (collectionId) => {
    removeCollectionFromFolder(collectionId, selectedFolder.id);
    setOpenMenuId(null);
  };

  const renderCardView = (folder) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {/* <FaFolder className="text-blue-500 text-xl" /> */}
          <div>
            <h3 className="font-medium text-gray-900">{folder.name}</h3>
            <p className="text-sm text-gray-500">
              {folder.collections?.length || 0} collections
            </p>
          </div>
        </div>

        <div className="relative">
          <button
            className="p-2 hover:bg-gray-100 rounded-full"
            onClick={() => handleMenuClick(folder.id)}
          >
            <FaEllipsisH className="text-gray-500" />
          </button>
          <div
            className={`absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg border border-gray-200 ${
              openMenuId === folder.id ? "block" : "hidden"
            } z-10`}
          >
            <div className="py-1">
              <button
                onClick={() => onApplyFolder(folder)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
              >
                Apply Folder
              </button>
              <button
                onClick={() => handleAddCollections(folder)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
              >
                Manage Collections
              </button>
              <button
                onClick={() => handleEditClick(folder)}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
              >
                Edit
              </button>
              <button
                onClick={() => onDeleteFolder(folder.id)}
                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {folder.description && (
        <p
          className="mt-2 text-sm text-gray-600 line-clamp-2"
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(folder.description),
          }}
        />
      )}

      <div className="mt-3 flex items-center text-xs text-gray-500">
        <span className="capitalize px-2 py-1 bg-gray-100 rounded-full">
          {folder.visibility}
        </span>
      </div>
    </div>
  );

  const renderListView = (folder) => (
    <div className="bg-white border-b border-gray-200 p-2 hover:bg-gray-50 transition-colors">
      <div className="flex items-center flex-col justify-between w-full">
        <div className="flex w-full space-x-4 flex-1">
          <FaFolder className="text-blue-500 text-xl" />
          <h3 className="font-medium text-gray-900 truncate">{folder.name}</h3>
        </div>
        <div className="flex items-center flex-1 w-full">
          <div className="min-w-0 flex-1 w-full">
            {folder.description && viewMode === "card" && (
              <p
                className="text-sm text-gray-600 line-clamp-1"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(folder.description),
                }}
              />
            )}
          </div>
          <div className="flex items-center space-x-4 w-full justify-between">
            <div className="flex items-center space-x-2 w-full">
              <div className="text-sm text-gray-500">
                {folder.collections?.length || 0} collections
              </div>
              <div className="capitalize px-2 bg-gray-100 rounded-full text-xs text-gray-500">
                {folder.visibility}
              </div>
            </div>
            <div className="relative">
              <button
                className="p-2 hover:bg-gray-100 rounded-full"
                onClick={() => handleMenuClick(folder.id)}
              >
                <FaEllipsisH className="text-gray-500" />
              </button>
              <div
                className={`absolute right-0 w-40 bg-white rounded-md shadow-lg border border-gray-200 ${
                  openMenuId === folder.id ? "block" : "hidden"
                } z-10`}
              >
                <div className="py-1">
                  <button
                    onClick={() => onApplyFolder(folder)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                  >
                    Apply Folder
                  </button>
                  <button
                    onClick={() => handleAddCollections(folder)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                  >
                    Manage Collections
                  </button>
                  <button
                    onClick={() => handleEditClick(folder)}
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDeleteFolder(folder.id)}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">My Folders</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode("card")}
            className={`p-2 rounded ${
              viewMode === "card"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600"
            }`}
          >
            <FaThLarge />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded ${
              viewMode === "list"
                ? "bg-blue-100 text-blue-600"
                : "text-gray-600"
            }`}
          >
            <FaList />
          </button>
        </div>
      </div>

      <div
        className={
          viewMode === "card"
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4"
            : "divide-y divide-gray-200"
        }
      >
        {folders.map((folder) =>
          viewMode === "card" ? renderCardView(folder) : renderListView(folder)
        )}
      </div>

      {/* Edit Folder Modal */}
      {editModalOpen && (
        <Modal onClose={() => setEditModalOpen(false)}>
          <AddFolderForm
            initialValues={selectedFolder}
            onSubmit={(data) => {
              onEditFolder(selectedFolder.id, data);
              setEditModalOpen(false);
            }}
            onClose={() => setEditModalOpen(false)}
            isEditing={true}
            isAdmin={isAdmin}
            organizations={organizations}
          />
        </Modal>
      )}

      {/* Add Collections Modal */}
      {showAddCollections && selectedFolder && (
        <AddCollectionsModal
          items={selectedFolder.collections}
          folder={selectedFolder}
          onClose={() => setShowAddCollections(false)}
          collections={collections.filter(
            (collection) =>
              !selectedFolder.collections.includes(collection.id) &&
              collection.tenantId === selectedFolder.tenantId
          )}
          onAddToFolder={(collectionId) => {
            addCollectionToFolder(collectionId, selectedFolder.id);
          }}
          onRemoveFromFolder={(collectionId) => {
            handleRemoveCollection(collectionId);
          }}
        />
      )}
    </div>
  );
};

export default FoldersList;
