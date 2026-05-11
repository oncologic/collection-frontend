"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  FaLayerGroup,
  FaLink,
  FaUsers,
  FaCheckCircle,
  FaTimes,
  FaArrowRight,
  FaExclamationCircle,
  FaSearch,
} from "react-icons/fa";
import { useMergeCollections } from "../hooks/useCollections";
import { useGetAllCollections } from "../hooks/useResources";
import Modal from "./Modal";

export default function MergeCollectionsModal({
  isOpen,
  onClose,
  currentCollectionId,
  currentCollectionName,
}) {
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [step, setStep] = useState(1); // 1: Select, 2: Preview, 3: Success
  const [mergeOptions, setMergeOptions] = useState({
    keepSourceCollection: false,
    conflictResolution: "target",
  });
  const [targetCollection, setTargetCollection] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: collectionsData, isLoading: collectionsLoading } =
    useGetAllCollections();
  const { mutate: mergeCollections, isPending: isMerging } =
    useMergeCollections();

  // Helper function to strip HTML tags
  const stripHtml = (html) => {
    if (!html) return "";
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  // Filter out current collection from available targets
  const availableCollections = (
    collectionsData?.collections ||
    collectionsData ||
    []
  ).filter((collection) => collection.id !== currentCollectionId);

  // Filter collections based on search term
  const filteredCollections = availableCollections.filter((collection) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const nameMatch = collection.name?.toLowerCase().includes(searchLower);
    const descriptionMatch = stripHtml(collection.description)
      ?.toLowerCase()
      .includes(searchLower);
    return nameMatch || descriptionMatch;
  });

  useEffect(() => {
    if (selectedTargetId && availableCollections.length > 0) {
      const target = availableCollections.find(
        (c) => c.id === selectedTargetId
      );
      setTargetCollection(target);
    }
  }, [selectedTargetId, availableCollections]);

  const handleMerge = () => {
    mergeCollections(
      {
        sourceCollectionId: currentCollectionId,
        targetCollectionId: selectedTargetId,
        mergeOptions,
      },
      {
        onSuccess: () => {
          setStep(3);
          setTimeout(() => {
            onClose();
          }, 2000);
        },
      }
    );
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6">
      <div className="flex items-center space-x-3">
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
          }`}
        >
          1
        </div>
        <div
          className={`w-16 h-1 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`}
        />
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
          }`}
        >
          2
        </div>
        <div
          className={`w-16 h-1 ${step >= 3 ? "bg-blue-600" : "bg-gray-200"}`}
        />
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-full ${
            step >= 3 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-400"
          }`}
        >
          3
        </div>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="p-4">
      <DialogTitle
        as="h3"
        className="text-xl font-semibold leading-6 text-gray-900 mb-4"
      >
        Merge Collections
      </DialogTitle>

      {renderStepIndicator()}

      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-4">
          Select a target collection to merge &quot;{currentCollectionName}
          &quot; into. All items will be transferred to the target collection.
        </p>

        {/* Search Input */}
        <div className="mb-4 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search collections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="space-y-3 max-h-64 overflow-y-auto">
          {collectionsLoading ? (
            <div className="text-center py-4">Loading collections...</div>
          ) : filteredCollections.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              {searchTerm
                ? "No collections found matching your search."
                : "No other collections available for merging."}
            </div>
          ) : (
            filteredCollections.map((collection) => (
              <label
                key={collection.id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedTargetId === collection.id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="targetCollection"
                  value={collection.id}
                  checked={selectedTargetId === collection.id}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">
                      {collection.name}
                    </span>
                  </div>
                  {collection.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {stripHtml(collection.description)}
                    </p>
                  )}
                  <div className="flex items-center mt-2 space-x-4 text-xs text-gray-400">
                    <span className="flex items-center">
                      <FaLink className="mr-1" />
                      {collection.externalLinksCount ||
                        collection.externalLinks?.length ||
                        0}{" "}
                      links
                    </span>
                    <span className="flex items-center">
                      <FaLayerGroup className="mr-1" />
                      {collection.resourcesCount ||
                        collection.resource_count ||
                        collection.resources?.length ||
                        0}{" "}
                      resources
                    </span>
                  </div>
                </div>
              </label>
            ))
          )}
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => setStep(2)}
          disabled={!selectedTargetId}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <>
      <DialogTitle
        as="h3"
        className="text-xl font-semibold leading-6 text-gray-900 mb-4"
      >
        Review Merge
      </DialogTitle>

      {renderStepIndicator()}

      <div className="mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex">
            <FaExclamationCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">Important</h4>
              <p className="text-sm text-yellow-700 mt-1">
                This action will transfer all items from &quot;
                {currentCollectionName}&quot; to &quot;{targetCollection?.name}
                &quot;.
                {!mergeOptions.keepSourceCollection &&
                  " The source collection will be permanently deleted."}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">
                From: {currentCollectionName}
              </h4>
              <p className="text-sm text-gray-500">Source collection</p>
            </div>
            <FaArrowRight className="h-5 w-5 text-gray-400" />
            <div>
              <h4 className="font-medium text-gray-900">
                To: {targetCollection?.name}
              </h4>
              <p className="text-sm text-gray-500">Target collection</p>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Merge Options</h4>

            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={mergeOptions.keepSourceCollection}
                  onChange={(e) =>
                    setMergeOptions({
                      ...mergeOptions,
                      keepSourceCollection: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Keep source collection after merge
                </span>
              </label>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Conflict Resolution
                </label>
                <select
                  value={mergeOptions.conflictResolution}
                  onChange={(e) =>
                    setMergeOptions({
                      ...mergeOptions,
                      conflictResolution: e.target.value,
                    })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="target">
                    Keep target collection&apos;s data for duplicates
                  </option>
                  <option value="source">
                    Use source collection&apos;s data for duplicates
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              What will be merged:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li className="flex items-center">
                <FaLink className="mr-2" />
                All external links and their metadata
              </li>
              <li className="flex items-center">
                <FaLayerGroup className="mr-2" />
                All resources and their notes
              </li>
              <li className="flex items-center">
                <FaUsers className="mr-2" />
                All collaborators and permissions
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-3">
        <button
          type="button"
          onClick={() => setStep(1)}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleMerge}
          disabled={isMerging}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isMerging ? "Merging..." : "Merge Collections"}
        </button>
      </div>
    </>
  );

  const renderStep3 = () => (
    <div className="text-center py-8">
      <FaCheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
      <DialogTitle as="h3" className="text-xl font-semibold text-gray-900 mb-2">
        Merge Successful!
      </DialogTitle>
      <p className="text-gray-500">
        Collections have been merged successfully. Redirecting to the target
        collection...
      </p>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} width="max-w-2xl">
      <div className="relative p-4">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>
    </Modal>
  );
}
