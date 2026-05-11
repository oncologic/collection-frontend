import React from "react";
import { FaSearch, FaMagic, FaSpinner, FaCheck, FaTimes } from "react-icons/fa";
import Modal from "@/app/components/Modal";
import InputField from "@/app/components/inputs/InputField";
import MultiSelect from "@/app/components/inputs/MultiSelect";
import CollectionResourceCard from "@/app/components/cards/CollectionResourceCard";

function AddResourcesModal({
  searchTerm,
  setSearchTerm,
  filteredResources,
  aiSuggestedResources = [],
  aiSuggestionSummary = "",
  aiSearchQuery = "",
  flippedResourceId,
  setFlippedResourceId,
  resourceNotes,
  handleNoteChange,
  addResourceToCollection,
  addSelectedResourcesToCollection,
  collectionId,
  onClose,
  resourceTypes,
  selectedResourceTypes,
  setSelectedResourceTypes,
  selectedResourceIds = [],
  toggleResourceSelection,
  clearSelectedResources,
  onSearchWithAI,
  isSearching = false,
  isAISearching = false,
  isAddingResources = false,
}) {
  const selectedCount = selectedResourceIds.length;
  const hasAnyResults =
    aiSuggestedResources.length > 0 || filteredResources.length > 0;

  const renderResourceCards = (resources) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {resources.map((resource) => (
        <CollectionResourceCard
          key={resource.id}
          resource={resource}
          flippedResourceId={flippedResourceId}
          setFlippedResourceId={setFlippedResourceId}
          resourceNotes={resourceNotes}
          handleNoteChange={handleNoteChange}
          addResourceToCollection={addResourceToCollection}
          collectionId={collectionId}
          collectionNote={resource.collectionNotes}
          isSelected={selectedResourceIds.includes(resource.id)}
          toggleResourceSelection={toggleResourceSelection}
        />
      ))}
    </div>
  );

  return (
    <Modal onClose={onClose}>
      <div className="w-full text-slate-600 p-8">
        <div className="p-3 sm:p-4">
          <div className="flex flex-col gap-2 mb-4">
            <h2 className="text-lg sm:text-xl font-bold">Add Resources</h2>
            <p className="text-sm text-slate-500">
              Search manually or use AI to suggest likely papers from the
              external link context, then add notes to each resource before
              attaching it.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="relative flex-grow">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <InputField
                type="text"
                placeholder="Search resources..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-64">
              <MultiSelect
                placeholder="Filter by type..."
                options={resourceTypes}
                value={selectedResourceTypes}
                onChange={setSelectedResourceTypes}
                className="w-full"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4 mb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  AI Suggestions and Bulk Add
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  AI uses the external link title, description, attachment and
                  related-link titles, plus short notation excerpts to keep the
                  context compact.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={onSearchWithAI}
                  disabled={isAISearching}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-300 bg-white text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAISearching ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaMagic />
                  )}
                  <span>Search With AI</span>
                </button>
                {selectedCount > 0 && (
                  <button
                    onClick={clearSelectedResources}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    <FaTimes />
                    <span>Clear Selection</span>
                  </button>
                )}
                <button
                  onClick={addSelectedResourcesToCollection}
                  disabled={selectedCount === 0 || isAddingResources}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAddingResources ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaCheck />
                  )}
                  <span>Bulk Add ({selectedCount})</span>
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto pr-1">
            {aiSuggestedResources.length > 0 && (
              <div className="mb-6">
                <div className="flex flex-col gap-1 mb-4">
                  <h3 className="text-base font-semibold text-slate-800">
                    AI Suggestions ({aiSuggestedResources.length})
                  </h3>
                  {aiSuggestionSummary && (
                    <p className="text-sm text-slate-600">
                      {aiSuggestionSummary}
                    </p>
                  )}
                  {aiSearchQuery && (
                    <p className="text-xs text-slate-500">
                      Search query: {aiSearchQuery}
                    </p>
                  )}
                </div>
                {renderResourceCards(aiSuggestedResources)}
              </div>
            )}

            {isSearching ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">Searching...</p>
                <p className="text-sm">
                  Looking for resources matching &quot;{searchTerm}&quot;
                </p>
              </div>
            ) : filteredResources.length > 0 ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-800">
                    {searchTerm.length >= 2
                      ? `Search Results (${filteredResources.length})`
                      : `All Resources (${filteredResources.length})`}
                  </h3>
                </div>
                {renderResourceCards(filteredResources)}
              </div>
            ) : !hasAnyResults ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg mb-2">No resources available</p>
                <p className="text-sm">
                  {searchTerm.length >= 2
                    ? `No resources found matching "${searchTerm}"`
                    : "Search, filter, or use AI to browse relevant resources."}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default AddResourcesModal;
