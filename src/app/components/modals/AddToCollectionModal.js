"use client";
import { useState, useEffect } from "react";
import Modal from "@/app/components/Modal";
import { FaCheck, FaPlus, FaSpinner } from "react-icons/fa";
import { useAddItemToCollection } from "@/app/hooks/useCollections";
import InputField from "@/app/components/inputs/InputField";
import { toast } from "react-hot-toast";
import { useGetAllCollections } from "@/app/hooks/useResources";

const AddToCollectionModal = ({ isOpen, onClose, items, itemType }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollectionIds, setSelectedCollectionIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: collections = [], isLoading: collectionsLoading } =
    useGetAllCollections();

  const { mutateAsync: addItemToCollection } = useAddItemToCollection();

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setSelectedCollectionIds([]);
      setSearchTerm("");
      setNotes("");
    }
  }, [isOpen]);

  const filteredCollections = searchTerm
    ? collections.filter((c) =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : collections;

  const toggleCollectionSelection = (collectionId) => {
    setSelectedCollectionIds((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  const handleSubmit = async () => {
    if (selectedCollectionIds.length === 0) {
      toast.error("Please select at least one collection");
      return;
    }

    setIsSubmitting(true);
    try {
      const promises = selectedCollectionIds.map((collectionId) => {
        return Promise.all(
          items.map((item) => {
            // Format the payload based on itemType
            const payload =
              itemType === "trial"
                ? {
                    collectionId,
                    externalLink: {
                      name: item.BriefTitle?.[0] || "Clinical Trial",
                      url: `https://clinicaltrials.gov/study/${item.NCTId[0]}`,
                      type: "external",
                      description: item.BriefSummary?.[0] || "",
                      notes: notes,
                      status: "active",
                    },
                  }
                : itemType === "publication"
                ? {
                    collectionId,
                    externalLink: {
                      name: item.title || "Publication",
                      url: item.url || "",
                      type: "external",
                      description: item.abstract || "",
                      notes: notes,
                      status: "active",
                    },
                  }
                : {
                    collectionId,
                    resourceId: item.id,
                    note: notes,
                  };

            return addItemToCollection(payload);
          })
        );
      });

      await Promise.all(promises);
      toast.success(
        `Added ${items.length} ${itemType}${items.length > 1 ? "s" : ""} to ${
          selectedCollectionIds.length
        } collection${selectedCollectionIds.length > 1 ? "s" : ""}`
      );
      onClose();
    } catch (error) {
      console.error("Error adding items to collections:", error);
      toast.error("Failed to add to collections");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="p-6 max-w-lg mx-auto">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Add to Collection
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Adding {items.length} {itemType}
            {items.length > 1 ? "s" : ""} to collections
          </p>

          <InputField
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about these items..."
            multiline
            rows={3}
          />
        </div>

        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search collections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {collectionsLoading ? (
          <div className="flex justify-center py-8">
            <FaSpinner className="animate-spin text-blue-500 text-2xl" />
          </div>
        ) : filteredCollections.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No collections found
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto mb-6 border border-gray-200 rounded-md">
            {filteredCollections.map((collection) => (
              <div
                key={collection.id}
                onClick={() => toggleCollectionSelection(collection.id)}
                className={`p-3 flex items-center justify-between cursor-pointer border-b border-gray-200 hover:bg-gray-50 ${
                  selectedCollectionIds.includes(collection.id)
                    ? "bg-blue-50"
                    : ""
                }`}
              >
                <div>
                  <h3 className="font-medium">{collection.name}</h3>
                  <p className="text-xs text-gray-500">
                    {collection.type === "external"
                      ? "External Links"
                      : "Resources"}
                  </p>
                </div>
                {selectedCollectionIds.includes(collection.id) ? (
                  <div className="h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <FaCheck className="text-white text-xs" />
                  </div>
                ) : (
                  <div className="h-6 w-6 border-2 border-gray-300 rounded-full flex items-center justify-center">
                    <FaPlus className="text-gray-400 text-xs" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={selectedCollectionIds.length === 0 || isSubmitting}
            className={`px-4 py-2 text-white bg-blue-600 rounded-md ${
              selectedCollectionIds.length === 0 || isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <FaSpinner className="animate-spin mr-2" />
                Saving...
              </span>
            ) : (
              `Save to ${selectedCollectionIds.length} Collection${
                selectedCollectionIds.length !== 1 ? "s" : ""
              }`
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AddToCollectionModal;
