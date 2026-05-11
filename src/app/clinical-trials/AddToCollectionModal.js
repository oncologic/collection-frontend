"use client";
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
  useGetResourceCollections,
  useAddExternalLinkToCollection,
  useCreateCollection,
} from "../hooks/useCollections";
import { useGetAllCollections } from "@/app/hooks/useResources";
import { useContextAuth } from "@/app/context/authContext";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const AddToCollectionModal = ({ selectedTrials = [], onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState("existing");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedCollectionId, setCompletedCollectionId] = useState(null);
  const [completedCollectionName, setCompletedCollectionName] = useState("");

  // New collection form state
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const router = useRouter();
  const { data: collections = [] } = useGetAllCollections({});
  const { mutate: addExternalLink } = useAddExternalLinkToCollection();
  const { mutateAsync: createCollection } = useCreateCollection();
  const { systemUser, selectedTenants } = useContextAuth();

  // Filter out only the external collections that belong to the current user
  const externalCollections = collections.filter(
    (collection) =>
      collection.type === "external" && collection.userId === systemUser?.id
  );

  // Filter collections based on search term
  const filteredCollections = externalCollections.filter((collection) =>
    collection.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update the selected collection when the id changes
  useEffect(() => {
    if (selectedCollectionId) {
      const collection = collections.find((c) => c.id === selectedCollectionId);
      setSelectedCollection(collection);
    }
  }, [selectedCollectionId, collections]);

  const addTrialsToCollection = async (collectionId) => {
    // Process each selected trial
    const addPromises = selectedTrials.map((trial) => {
      // Format the trial data for API submission
      const linkData = {
        name: trial.BriefTitle?.[0] || trial.BriefTitle || "Clinical Trial",
        url: `https://clinicaltrials.gov/ct2/show/${
          trial.NCTId?.[0] || trial.NCTId
        }`,
        type: "clinicalTrial",
        description: `
          <p><strong>NCT ID:</strong> ${trial.NCTId?.[0] || trial.NCTId}</p>
          <p><strong>Status:</strong> ${
            trial.OverallStatus?.[0] || trial.OverallStatus
          }</p>
          <p><strong>Phase:</strong> ${
            trial.Phase?.[0] || trial.Phase || "Not specified"
          }</p>
          <p><strong>Study Type:</strong> ${
            trial.StudyType?.[0] || trial.StudyType
          }</p>
          <p><strong>Conditions:</strong> ${
            Array.isArray(trial.Condition)
              ? trial.Condition.join(", ")
              : trial.Condition || "Not specified"
          }</p>
          <p><strong>Interventions:</strong> ${
            Array.isArray(trial.InterventionName)
              ? trial.InterventionName.join(", ")
              : trial.InterventionName || "Not specified"
          }</p>
          <p><strong>Sponsor:</strong> ${
            trial.LeadSponsorName?.[0] ||
            trial.LeadSponsorName ||
            "Not specified"
          }</p>
          <p><strong>Brief Summary:</strong></p>
          <p>${
            trial.BriefSummary?.[0] ||
            trial.BriefSummary ||
            "No summary available"
          }</p>
        `,
        notes: "",
        imageUrl: "",
        visibility: "private",
        status: "active",
        date: new Date().toISOString(),
      };

      // Add NCT ID as additional data
      if (trial.NCTId) {
        linkData.nctId = trial.NCTId?.[0] || trial.NCTId;
      }

      // Submit the external link to the selected collection
      return addExternalLink({
        collectionId: collectionId,
        linkData: linkData,
      });
    });

    // Wait for all trials to be added
    await Promise.all(addPromises);
  };

  const handleSubmit = async () => {
    if (!selectedCollectionId || selectedTrials.length === 0) return;

    setIsLoading(true);
    try {
      await addTrialsToCollection(selectedCollectionId);

      // Find the collection name for the confirmation screen
      const selectedCollection = collections.find(
        (col) => col.id === selectedCollectionId
      );
      setCompletedCollectionId(selectedCollectionId);
      setCompletedCollectionName(selectedCollection?.name || "collection");
      setIsCompleted(true);

      toast.success(
        `Added ${selectedTrials.length} trial${selectedTrials.length !== 1 ? 's' : ''} to ${selectedCollection?.name || "collection"}`
      );

      // Call success callback
      if (onSuccess) {
        onSuccess(selectedTrials.length);
      }
    } catch (error) {
      console.error("Error adding trials to collection:", error);
      toast.error("Failed to add trials to collection");
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
        type: "external", // External collection type
        visibility: "private", // Default to private
        status: "active", // Default status
        tenantId: selectedTenants?.[0]?.id || "",
        isPinned: false,
        hashtags: [],
        icon: "folder", // Default icon
        color: "blue", // Default color
        collection_type: "user",
      };

      // Create collection first
      const newCollection = await createCollection(collectionData);

      // Then add the trials to the newly created collection
      await addTrialsToCollection(newCollection.id);

      // Show success state
      setCompletedCollectionId(newCollection.id);
      setCompletedCollectionName(newCollectionName.trim());
      setIsCompleted(true);

      toast.success(
        `Added ${selectedTrials.length} trial${selectedTrials.length !== 1 ? 's' : ''} to new collection "${newCollectionName}"`
      );

      // Call success callback
      if (onSuccess) {
        onSuccess(selectedTrials.length);
      }
    } catch (error) {
      console.error("Error creating collection:", error);
      toast.error("Failed to create collection and add trials");
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">
              Trials Added Successfully!
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>
          </div>

          <div className="p-6 text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
              <FaCheck className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Clinical Trials Added Successfully!
            </h3>
            <p className="mb-6 text-gray-600">
              <span className="font-medium">{selectedTrials.length}</span>{" "}
              clinical trial
              {selectedTrials.length !== 1 ? "s" : ""}{" "}
              {selectedTrials.length === 1 ? "has" : "have"} been added to{" "}
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
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Add to Collection</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <p className="text-gray-600 mb-4">
              Adding{" "}
              <span className="font-medium">{selectedTrials.length}</span>{" "}
              clinical trial{selectedTrials.length !== 1 ? "s" : ""} to
              collection
            </p>

            {/* Tab Navigation */}
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
                {/* Search input */}
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

                {/* Collections list */}
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
                        <p>You don&apos;t have any external collections yet</p>
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
                      <strong>Note:</strong> This collection will be created as
                      a private external collection. You can change these
                      settings later from your collections page.
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Action buttons */}
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
                    Create & Add Trials
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddToCollectionModal;
