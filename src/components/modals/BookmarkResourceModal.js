import AddCollectionForm from "@/app/components/forms/AddCollectionForm";
import React, { useState } from "react";
import { FaSearch, FaPlus, FaCheck } from "react-icons/fa";
import InputField from "@/app/components/inputs/InputField";
import MultiSelect from "@/app/components/inputs/MultiSelect";
import {
  useAddResourceToCollection,
  useCreateCollection,
} from "@/app/hooks/useCollections";
import { useContextAuth } from "@/app/context/authContext";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const BookmarkResourceModal = ({
  resource,
  onClose,
  onAddToCollection,
  collections = [],
  note,
  onNoteChange,
}) => {
  const [activeTab, setActiveTab] = useState("existing");
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedCollectionId, setCompletedCollectionId] = useState(null);
  const [completedCollectionName, setCompletedCollectionName] = useState("");
  const { mutateAsync: addResourceToCollection } = useAddResourceToCollection();
  const { mutateAsync: createCollection } = useCreateCollection();
  const { selectedTenants, systemUser } = useContextAuth();
  const router = useRouter();

  // New collection form state
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [newCollectionNote, setNewCollectionNote] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  // Filter out collections that already contain the resource
  const availableCollections = collections.filter((collection) => {
    const resourceExists = collection.resources?.some(
      (existingResource) => existingResource.id === resource.id
    );
    return !resourceExists;
  });

  const filteredCollections = availableCollections.filter((collection) => {
    const matchesSearch = collection.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesType =
      selectedTypes.length === 0 || selectedTypes.includes(collection.type);
    return matchesSearch && matchesType;
  });

  const handleAddToCollection = async (collectionId) => {
    setIsAdding(true);
    try {
      if (onAddToCollection) {
        await onAddToCollection(collectionId, resource);
      } else {
        await addResourceToCollection({
          resourceId: resource.id,
          collectionId: collectionId,
          note: null,
        });
      }

      // Find the collection name for the confirmation screen
      const selectedCollection = collections.find(
        (col) => col.id === collectionId
      );
      setCompletedCollectionId(collectionId);
      setCompletedCollectionName(selectedCollection?.name || "collection");
      setIsCompleted(true);

      toast.success(
        `Resource added to ${selectedCollection?.name || "collection"}`
      );
    } catch (err) {
      console.error("Failed to add resource to collection", err);
      toast.error("Failed to add resource to collection");
    } finally {
      setIsAdding(false);
    }
  };

  const handleCreateCollection = async (e) => {
    e.preventDefault();

    if (!newCollectionName.trim()) {
      toast.error("Please enter a collection name");
      return;
    }

    setIsCreatingCollection(true);

    try {
      const collectionData = {
        name: newCollectionName.trim(),
        description: newCollectionDescription.trim(),
        type: "resource", // Default to resource type
        visibility: "private", // Default to private as requested
        status: "active", // Default status
        tenantId: selectedTenants?.[0]?.id || "",
        isPinned: false,
        hashtags: [],
        icon: "book", // Default icon
        color: "blue", // Default color
        collection_type: "user",
      };

      // Create collection first
      const newCollection = await createCollection(collectionData);

      // Then add the resource to the newly created collection
      await addResourceToCollection({
        resourceId: resource.id,
        collectionId: newCollection.id,
        note: newCollectionNote.trim() || null,
      });

      setCompletedCollectionId(newCollection.id);
      setCompletedCollectionName(newCollectionName.trim());
      setIsCompleted(true);

      toast.success(`Resource added to new collection "${newCollectionName}"`);
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection and add resource");
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const handleGoToCollection = () => {
    if (completedCollectionId) {
      router.push(`/collections/${completedCollectionId}`);
      onClose();
    }
  };

  // Show confirmation screen if completed
  if (isCompleted) {
    return (
      <div className="p-6 text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
          <FaCheck className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-gray-900">
          Resource Added Successfully!
        </h3>
        <p className="mb-6 text-gray-600">
          <span className="font-medium">{resource.name}</span> has been added to{" "}
          <span className="font-medium">{completedCollectionName}</span>.
        </p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
          >
            Close
          </button>
          <button
            onClick={handleGoToCollection}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors duration-200"
          >
            Go to Collection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 text-slate-600">
      <h2 className="text-xl font-bold mb-2">Bookmark Resource</h2>
      <p className="mb-3 text-gray-600 text-sm">
        Add <span className="font-medium text-slate-700">{resource.name}</span>{" "}
        to a collection
      </p>

      <div className="mb-4 flex border-b">
        <button
          onClick={() => setActiveTab("existing")}
          className={`px-3 py-1.5 -mb-px font-medium transition-all duration-200 ease-in-out ${
            activeTab === "existing"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Existing Collection
        </button>
        <button
          onClick={() => setActiveTab("new")}
          className={`px-3 py-1.5 -mb-px font-medium transition-all duration-200 ease-in-out ${
            activeTab === "new"
              ? "border-b-2 border-blue-500 text-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <FaPlus className="inline mr-1" size={12} />
          New Collection
        </button>
      </div>

      {activeTab === "existing" ? (
        <div>
          <div className="mb-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <InputField
                type="text"
                placeholder="Search collections..."
                className="w-full pl-9 pr-4 py-1.5 border rounded-md text-sm focus:ring-1 focus:ring-blue-200 transition-all duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
            {filteredCollections.length === 0 ? (
              <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg">
                <p className="text-sm">
                  {searchTerm
                    ? "No collections found matching your criteria."
                    : availableCollections.length === 0
                    ? "This resource is already in all your collections."
                    : "No collections available."}
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredCollections.map((col) => (
                  <li
                    key={col.id}
                    className="border rounded-lg p-3 flex justify-between items-center hover:border-blue-200 transition-all duration-200 group"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {col.name}
                    </span>
                    <button
                      onClick={() => handleAddToCollection(col.id)}
                      disabled={isAdding}
                      className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-blue-600 text-sm
                      hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 
                      disabled:opacity-50 disabled:cursor-not-allowed
                      group-hover:bg-blue-100"
                    >
                      {isAdding ? (
                        <span className="flex items-center">
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
                          Adding
                        </span>
                      ) : (
                        "Add"
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div>
          <form onSubmit={handleCreateCollection} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Name *
              </label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Enter collection name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-200 focus:border-blue-300 transition-all duration-200"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newCollectionDescription}
                onChange={(e) => setNewCollectionDescription(e.target.value)}
                placeholder="Brief description of this collection"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-200 focus:border-blue-300 transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note about this resource (Optional)
              </label>
              <textarea
                value={newCollectionNote}
                onChange={(e) => setNewCollectionNote(e.target.value)}
                placeholder="Why are you adding this resource to the collection?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-200 focus:border-blue-300 transition-all duration-200"
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> This collection will be created as a
                private resource collection. You can change these settings later
                from your collections page.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingCollection || !newCollectionName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreatingCollection ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4"
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
                    Creating...
                  </>
                ) : (
                  <>
                    <FaPlus size={12} />
                    Create & Add Resource
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default BookmarkResourceModal;
