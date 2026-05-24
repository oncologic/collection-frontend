import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import Modal from "./Modal";
import InputField from "./inputs/InputField";
import CollectionPreviewCard from "./cards/CollectionPreviewCard";

const AddCollectionsModal = ({
  items,
  folder,
  onClose,
  collections,
  onAddToFolder,
  onRemoveFromFolder,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [itemsToDisplay, setItemsToDisplay] = useState([]);
  const [currentCollections, setCurrentCollections] = useState([]);
  const [selectedTab, setSelectedTab] = useState("available");

  useEffect(() => {
    const filtered = collections.filter((collection) => {
      const isNotIncluded = !items.some((item) => item.id === collection.id);
      return isNotIncluded;
    });

    setItemsToDisplay(filtered);

    const current = collections.filter((collection) =>
      items.some((item) => item.id === collection.id)
    );
    setCurrentCollections(current);
  }, [collections, items]);

  const filteredCollections = itemsToDisplay.filter((collection) => {
    const matchesSearch =
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === "all" || collection.type === selectedType;

    return matchesSearch && matchesType;
  });

  const filteredCurrentCollections = currentCollections.filter((collection) => {
    const matchesSearch =
      collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collection.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedType === "all" || collection.type === selectedType;

    return matchesSearch && matchesType;
  });

  const removeCollectionFromFolder = (collectionId) => {
    onRemoveFromFolder(collectionId, folder.id);
    setCurrentCollections((prev) => prev.filter((c) => c.id !== collectionId));
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="w-full text-slate-600 p-8">
        <div className="p-3 sm:p-4">
          <h2 className="text-lg sm:text-xl font-bold mb-4">
            Manage Collections in Folder
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <InputField
                type="text"
                placeholder="Search collections..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 border rounded-lg"
            >
              <option value="all">All Types</option>
              <option value="resource">Resources</option>
              <option value="external">External Links</option>
            </select>
          </div>

          <div className="flex space-x-4 mb-4">
            <button
              className={`px-4 py-2 font-semibold rounded-t-lg ${
                selectedTab === "available"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setSelectedTab("available")}
            >
              Available Collections
            </button>
            <button
              className={`px-4 py-2 font-semibold rounded-t-lg ${
                selectedTab === "current"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 text-gray-700"
              }`}
              onClick={() => setSelectedTab("current")}
            >
              Current Collections
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {selectedTab === "current" &&
              filteredCurrentCollections.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredCurrentCollections.map((collection) => (
                    <CollectionPreviewCard
                      key={collection.id}
                      collection={collection}
                      onRemove={() => removeCollectionFromFolder(collection.id)}
                      showRemoveButton={true}
                    />
                  ))}
                </div>
              )}

            {selectedTab === "available" && filteredCollections.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredCollections.map((collection) => (
                  <CollectionPreviewCard
                    key={collection.id}
                    collection={collection}
                    onAdd={() => {
                      onAddToFolder(collection.id, folder.id);
                      setItemsToDisplay((prev) =>
                        prev.filter((c) => c.id !== collection.id)
                      );
                      setCurrentCollections((prev) => [...prev, collection]);
                    }}
                  />
                ))}
              </div>
            )}

            {((selectedTab === "current" &&
              filteredCurrentCollections.length === 0) ||
              (selectedTab === "available" &&
                filteredCollections.length === 0)) && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">No collections found</p>
                <p className="text-sm">
                  No collections match your search filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AddCollectionsModal;
