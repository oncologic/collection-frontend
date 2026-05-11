import React, { useState } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useContentSearch } from "../hooks/useAI";
import InputField from "./inputs/InputField";
import { FaTimes } from "react-icons/fa";

const CollectionSearchModal = ({ isOpen, onClose, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const searchMutation = useContentSearch();

  const handleSearch = (value) => {
    setSearchQuery(value);
    // Debounce search query
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      if (value.length >= 2) {
        searchMutation.mutate({ searchQuery: value, type: "collection" });
      }
    }, 300);
  };

  const filteredCollections =
    searchMutation.data?.content?.filter(
      (item) => item.type === "collection"
    ) || [];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md bg-white rounded-xl shadow-xl">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <DialogTitle className="text-xl font-semibold text-gray-800">
                Select Collection
              </DialogTitle>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <InputField
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search collections..."
              className="w-full mb-4"
            />

            <div className="max-h-96 overflow-y-auto">
              {searchMutation.isLoading ? (
                <div className="text-center py-4 text-gray-600">Loading...</div>
              ) : (
                <div className="space-y-2">
                  {filteredCollections.map((collection) => (
                    <div
                      key={collection.id}
                      onClick={() => {
                        onSelect(collection);
                        onClose();
                      }}
                      className="p-3 rounded-lg cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-gray-800">
                          {collection.title}
                        </h3>
                      </div>
                      {collection.description && (
                        <p className="text-sm text-gray-600 truncate">
                          {collection.description.replace(
                            /<[^>]*>|[#*`_~]/g,
                            ""
                          )}
                        </p>
                      )}
                    </div>
                  ))}
                  {searchQuery && filteredCollections.length === 0 && (
                    <div className="text-center py-4 text-gray-600">
                      No collections found
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default CollectionSearchModal;
