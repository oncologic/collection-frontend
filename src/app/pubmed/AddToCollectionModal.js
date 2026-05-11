import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaTimes,
  FaPlus,
  FaFolder,
  FaCheck,
  FaArrowRight,
} from "react-icons/fa";
import {
  useAddExternalLinkToCollection,
  useCreateCollection,
} from "../hooks/useCollections";
import { useGetAllCollections } from "@/app/hooks/useResources";
import { useContextAuth } from "@/app/context/authContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const AddToCollectionModal = ({
  selectedPublications = [],
  onClose,
  onSuccess,
}) => {
  const [activeTab, setActiveTab] = useState("existing");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const router = useRouter();
  const { data: collections = [] } = useGetAllCollections({});
  const { mutateAsync: addExternalLink } = useAddExternalLinkToCollection();
  const { mutateAsync: createCollection } = useCreateCollection();
  const { systemUser, selectedTenants } = useContextAuth();

  const externalCollections = collections.filter(
    (collection) =>
      collection.type === "external" && collection.userId === systemUser?.id
  );

  const filteredCollections = externalCollections.filter((collection) =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (selectedCollectionId) {
      const collection = collections.find((c) => c.id === selectedCollectionId);
      setSelectedCollection(collection);
    }
  }, [selectedCollectionId, collections]);

  const buildPublicationDescription = (publication) => {
    const abstractContent =
      publication.abstract && publication.abstract !== "No abstract available"
        ? publication.abstract
        : "No abstract available";

    return `<p><strong>Authors:</strong> ${publication.authors}</p>
        <p><strong>Journal:</strong> ${publication.journal}</p>
        <p><strong>Publication Date:</strong> ${publication.publicationDate}</p>
        ${
          publication.doi
            ? `<p><strong>DOI:</strong> ${publication.doi}</p>`
            : ""
        }
        ${
          publication.pmid
            ? `<p><strong>PMID:</strong> ${publication.pmid}</p>`
            : ""
        }
        <p><strong>Abstract:</strong></p>
        <p>${abstractContent}</p>`;
  };

  const addPublicationsToCollection = async (collectionId) => {
    const addPromises = selectedPublications.map((publication) => {
      const linkData = {
        name: publication.title,
        url: publication.url,
        type: "pubMed",
        description: buildPublicationDescription(publication),
        notes: "",
        imageUrl: "",
        visibility: "private",
        status: "active",
        date: new Date().toISOString(),
      };

      if (publication.pmid) {
        linkData.pmid = publication.pmid;
      }
      if (publication.doi) {
        linkData.doi = publication.doi;
      }

      return addExternalLink({
        collectionId,
        linkData,
      });
    });

    await Promise.all(addPromises);
  };

  const handleSubmit = async () => {
    if (!selectedCollectionId || selectedPublications.length === 0) return;

    setIsLoading(true);
    try {
      await addPublicationsToCollection(selectedCollectionId);
      setIsCompleted(true);

      if (onSuccess) {
        onSuccess(
          selectedPublications.length,
          selectedCollection?.id,
          selectedCollection?.name
        );
      }
    } catch (error) {
      console.error("Error adding publications to collection:", error);
      toast.error("Failed to add publications to collection");
      onClose();
    } finally {
      setIsLoading(false);
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
        type: "external",
        visibility: "private",
        status: "active",
        tenantId: selectedTenants?.[0]?.id || "",
        isPinned: false,
        hashtags: [],
        icon: "folder",
        color: "blue",
        collection_type: "user",
      };

      const newCollection = await createCollection(collectionData);
      await addPublicationsToCollection(newCollection.id);

      setSelectedCollection(newCollection);
      setSelectedCollectionId(newCollection.id);
      setIsCompleted(true);

      if (onSuccess) {
        onSuccess(selectedPublications.length, newCollection.id, newCollection.name);
      }

      toast.success(
        `Publications added to new collection "${newCollectionName}"`
      );
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection and add publications");
      onClose();
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const handleGoToCollection = () => {
    router.push(`/collections/${selectedCollectionId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {isCompleted ? "Added to Collection" : "Add to Collection"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        {isCompleted ? (
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <FaCheck className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Successfully Added
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedPublications.length} publication
              {selectedPublications.length !== 1 ? "s" : ""} added to{" "}
              <span className="font-semibold">{selectedCollection?.name}</span>
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={handleGoToCollection}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center"
              >
                Go to Collection <FaArrowRight className="ml-2" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-4">
              <p className="text-gray-600 mb-4">
                Adding{" "}
                <span className="font-medium">
                  {selectedPublications.length}
                </span>{" "}
                publication{selectedPublications.length !== 1 ? "s" : ""} to
                collection
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
                  <div className="relative mb-4">
                    <FaSearch className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Search your collections..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                    {filteredCollections.length > 0 ? (
                      <ul className="divide-y divide-gray-200">
                        {filteredCollections.map((collection) => (
                          <li key={collection.id}>
                            <button
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center space-x-3 ${
                                selectedCollectionId === collection.id
                                  ? "bg-blue-50"
                                  : ""
                              }`}
                              onClick={() =>
                                setSelectedCollectionId(collection.id)
                              }
                            >
                              <FaFolder
                                className={
                                  selectedCollectionId === collection.id
                                    ? "text-blue-500"
                                    : "text-gray-400"
                                }
                              />
                              <div>
                                <p className="font-medium text-gray-800">
                                  {collection.name}
                                </p>
                                {collection.description && (
                                  <p className="text-sm text-gray-500 truncate max-w-xs">
                                    {collection.description
                                      .replace(/<[^>]*>/g, "")
                                      .substring(0, 60)}
                                    {collection.description.length > 60
                                      ? "..."
                                      : ""}
                                  </p>
                                )}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        {searchTerm ? (
                          <p>No collections match your search</p>
                        ) : (
                          <p>
                            You don&apos;t have any external collections yet
                          </p>
                        )}
                      </div>
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
                        onChange={(e) =>
                          setNewCollectionDescription(e.target.value)
                        }
                        placeholder="Brief description of this collection"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-blue-200 focus:border-blue-300 transition-all duration-200"
                      />
                    </div>

                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Note:</strong> This collection will be created
                        as a private external collection. You can change these
                        settings later from your collections page.
                      </p>
                    </div>
                  </form>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={isLoading || isCreatingCollection}
              >
                Cancel
              </button>
              {activeTab === "existing" ? (
                <button
                  onClick={handleSubmit}
                  disabled={!selectedCollectionId || isLoading}
                  className={`px-4 py-2 rounded-md text-white ${
                    !selectedCollectionId || isLoading
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isLoading ? "Adding..." : "Add to Collection"}
                </button>
              ) : (
                <button
                  onClick={handleCreateCollection}
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
                      Create & Add Publications
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddToCollectionModal;
