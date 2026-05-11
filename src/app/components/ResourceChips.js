import React from "react";

const ResourceChips = ({
  appliedResources,
  setAppliedResources,
  setSelectedResources,
}) => {
  if (appliedResources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {appliedResources.map((resource) => (
        <div
          key={resource.id}
          className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100"
        >
          <span>{resource.name}</span>
          <button
            onClick={() => {
              setAppliedResources((current) =>
                current.filter((r) => r.id !== resource.id)
              );
              setSelectedResources((current) => {
                const newSet = new Set(current);
                newSet.delete(resource.id);
                return newSet;
              });
            }}
            className="ml-1 hover:text-blue-900"
          >
            ×
          </button>
        </div>
      ))}
      {appliedResources.length > 0 && (
        <button
          onClick={() => {
            setAppliedResources([]);
            setSelectedResources(new Set());
          }}
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
};

export default ResourceChips;
