import React, { useState, useEffect } from "react";
import {
  useGetResources,
  useUpdateResource,
} from "../../app/hooks/useResources";
import toast from "react-hot-toast";

const FeaturedResourceManager = ({ onClose }) => {
  const { data: resources = [], isLoading } = useGetResources();
  const { mutate: updateResource } = useUpdateResource();

  // State for featured resources (limited to top 3)
  const [featuredResources, setFeaturedResources] = useState([]);
  // State for available resources (not featured)
  const [availableResources, setAvailableResources] = useState([]);
  // State for search term
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize the lists when resources load
  useEffect(() => {
    if (resources.length > 0) {
      // Sort featured resources by listOrder
      const featured = resources
        .filter((r) => r.featured)
        .sort((a, b) => (a.listOrder || 999) - (b.listOrder || 999))
        .slice(0, 3); // Limit to top 3

      // Get non-featured resources
      const available = resources.filter((r) => !r.featured);

      // Add any featured resources beyond the top 3 to available
      const extraFeatured = resources
        .filter((r) => r.featured)
        .sort((a, b) => (a.listOrder || 999) - (b.listOrder || 999))
        .slice(3);

      setFeaturedResources(featured);
      setAvailableResources([...available, ...extraFeatured]);
    }
  }, [resources]);

  // Add a resource to a specific position
  const addToFeatured = (resource, position) => {
    // Check if we already have 3 featured resources
    if (
      featuredResources.length >= 3 &&
      !featuredResources.some((r) => r.id === resource.id)
    ) {
      toast.error("Only 3 resources can be featured at a time");
      return;
    }

    // Create a copy of the current featured resources
    let newFeatured = [...featuredResources];

    // If the resource is already featured, remove it first
    if (newFeatured.some((r) => r.id === resource.id)) {
      newFeatured = newFeatured.filter((r) => r.id !== resource.id);
    }

    // Create the featured resource with the correct position
    const featuredResource = {
      ...resource,
      featured: true,
      listOrder: position,
    };

    // Insert at the specified position, shifting others if needed
    newFeatured = [
      ...newFeatured.filter((r) => r.listOrder < position),
      featuredResource,
      ...newFeatured.filter((r) => r.listOrder >= position),
    ];

    // Reorder all items to ensure proper sequence
    const reorderedFeatured = newFeatured
      .sort((a, b) => (a.listOrder || 999) - (b.listOrder || 999))
      .map((item, index) => ({
        ...item,
        listOrder: index + 1,
      }))
      .slice(0, 3); // Ensure we only keep top 3

    // Update available resources
    const newAvailable = availableResources.filter(
      (r) =>
        !reorderedFeatured.some((f) => f.id === r.id) && r.id !== resource.id
    );

    // If the resource was already in featured and got removed due to reordering
    if (!reorderedFeatured.some((r) => r.id === resource.id)) {
      newAvailable.push({
        ...resource,
        featured: false,
        listOrder: null,
      });
    }

    setFeaturedResources(reorderedFeatured);
    setAvailableResources(newAvailable);
  };

  // Remove a resource from featured
  const removeFromFeatured = (resource) => {
    // Remove from featured
    const newFeatured = featuredResources
      .filter((r) => r.id !== resource.id)
      .map((item, index) => ({
        ...item,
        listOrder: index + 1,
      }));

    // Add to available
    const resourceWithoutFeatured = {
      ...resource,
      featured: false,
      listOrder: null,
    };

    setFeaturedResources(newFeatured);
    setAvailableResources([...availableResources, resourceWithoutFeatured]);
  };

  // Filter available resources by search term
  const filteredAvailableResources = availableResources.filter((resource) =>
    resource.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Save changes to the server
  const handleSave = () => {
    // Create a loading toast
    const loadingToast = toast.loading("Saving featured resources...");

    // Track which resources have actually changed
    const changedResources = [];

    // Check featured resources for changes
    featuredResources.forEach((resource) => {
      const originalResource = resources.find((r) => r.id === resource.id);
      if (
        !originalResource ||
        originalResource.featured !== resource.featured ||
        originalResource.listOrder !== resource.listOrder
      ) {
        changedResources.push({
          id: resource.id,
          featured: true,
          listOrder: resource.listOrder,
        });
      }
    });

    // Check available resources for changes (only those that were previously featured)
    availableResources.forEach((resource) => {
      const originalResource = resources.find((r) => r.id === resource.id);
      if (originalResource && originalResource.featured === true) {
        changedResources.push({
          id: resource.id,
          featured: false,
          listOrder: null,
        });
      }
    });

    // If no changes, just close
    if (changedResources.length === 0) {
      toast.dismiss(loadingToast);
      toast.success("No changes needed");
      onClose();
      return;
    }

    // Execute updates only for changed resources
    Promise.all(changedResources.map((resource) => updateResource(resource)))
      .then(() => {
        toast.dismiss(loadingToast);
        toast.success("Featured resources updated successfully");
        onClose();
      })
      .catch((error) => {
        toast.dismiss(loadingToast);
        toast.error("Failed to update featured resources");
        console.error("Error updating featured resources:", error);
      });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-h-[90vh] overflow-hidden flex flex-col bg-white rounded-lg shadow-xl">
      <div className="border-b border-gray-200 pb-4 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
          Featured Resources
        </h2>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Select your top 3 resources to feature on the homepage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 flex-1 overflow-hidden">
        {/* Featured Resources Column */}
        <div className="flex flex-col h-full overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 text-base sm:text-lg">
              Top Featured Resources
            </h3>
            <span className="text-xs sm:text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              {featuredResources.length}/3 selected
            </span>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 flex-1 overflow-y-auto min-h-[250px] sm:min-h-[350px] border border-blue-100 shadow-inner">
            {/* Position 1 */}
            <div className="mb-3 sm:mb-4">
              <div className="text-xs sm:text-sm font-medium text-blue-700 mb-2">
                Position #1
              </div>
              {featuredResources.find((r) => r.listOrder === 1) ? (
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border border-blue-200 flex items-center">
                  <div className="mr-2 sm:mr-3 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white font-bold text-xs sm:text-base">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {featuredResources.find((r) => r.listOrder === 1).name}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium text-xs">
                        {featuredResources.find((r) => r.listOrder === 1)
                          .resourceType?.name || "Unknown Type"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      removeFromFeatured(
                        featuredResources.find((r) => r.listOrder === 1)
                      )
                    }
                    className="ml-1 sm:ml-2 p-1 text-red-500 hover:bg-red-50 rounded-full"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-dashed border-blue-300 flex items-center justify-center text-blue-400 text-xs sm:text-sm">
                  <span>Empty position - select a resource below</span>
                </div>
              )}
            </div>

            {/* Position 2 */}
            <div className="mb-3 sm:mb-4">
              <div className="text-xs sm:text-sm font-medium text-blue-700 mb-2">
                Position #2
              </div>
              {featuredResources.find((r) => r.listOrder === 2) ? (
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border border-blue-200 flex items-center">
                  <div className="mr-2 sm:mr-3 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white font-bold text-xs sm:text-base">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {featuredResources.find((r) => r.listOrder === 2).name}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium text-xs">
                        {featuredResources.find((r) => r.listOrder === 2)
                          .resourceType?.name || "Unknown Type"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      removeFromFeatured(
                        featuredResources.find((r) => r.listOrder === 2)
                      )
                    }
                    className="ml-1 sm:ml-2 p-1 text-red-500 hover:bg-red-50 rounded-full"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-dashed border-blue-300 flex items-center justify-center text-blue-400 text-xs sm:text-sm">
                  <span>Empty position - select a resource below</span>
                </div>
              )}
            </div>

            {/* Position 3 */}
            <div>
              <div className="text-xs sm:text-sm font-medium text-blue-700 mb-2">
                Position #3
              </div>
              {featuredResources.find((r) => r.listOrder === 3) ? (
                <div className="bg-white p-3 sm:p-4 rounded-lg shadow-md border border-blue-200 flex items-center">
                  <div className="mr-2 sm:mr-3 flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white font-bold text-xs sm:text-base">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {featuredResources.find((r) => r.listOrder === 3).name}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium text-xs">
                        {featuredResources.find((r) => r.listOrder === 3)
                          .resourceType?.name || "Unknown Type"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      removeFromFeatured(
                        featuredResources.find((r) => r.listOrder === 3)
                      )
                    }
                    className="ml-1 sm:ml-2 p-1 text-red-500 hover:bg-red-50 rounded-full"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 sm:h-5 sm:w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="bg-white p-3 sm:p-4 rounded-lg border border-dashed border-blue-300 flex items-center justify-center text-blue-400 text-xs sm:text-sm">
                  <span>Empty position - select a resource below</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Available Resources Column */}
        <div className="flex flex-col h-full mt-4 lg:mt-0 overflow-hidden">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-800 text-base sm:text-lg mb-3">
              Available Resources
            </h3>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 flex-1 min-h-[250px] sm:min-h-[350px] border border-gray-200 shadow-inner overflow-y-auto">
            {filteredAvailableResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <p className="font-medium text-sm sm:text-base text-center">
                  {searchTerm
                    ? "No matching resources found"
                    : "No available resources"}
                </p>
              </div>
            ) : (
              filteredAvailableResources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-white p-3 sm:p-4 mb-2 sm:mb-3 rounded-lg shadow-sm border border-gray-200 flex items-center transition-all duration-200 hover:border-gray-300"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                      {resource.name}
                    </div>
                    <div className="text-xs text-gray-500 flex gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium text-xs">
                        {resource.resourceType?.name || "Unknown Type"}
                      </span>
                      {resource.sensitivityLevel && (
                        <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full font-medium text-xs">
                          {resource.sensitivityLevel.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1 sm:space-x-3 ml-2">
                    <button
                      onClick={() => addToFeatured(resource, 1)}
                      className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      title="Add to position 1"
                    >
                      <span className="font-bold text-xs sm:text-base">1</span>
                    </button>
                    <button
                      onClick={() => addToFeatured(resource, 2)}
                      className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      title="Add to position 2"
                    >
                      <span className="font-bold text-xs sm:text-base">2</span>
                    </button>
                    <button
                      onClick={() => addToFeatured(resource, 3)}
                      className="w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      title="Add to position 3"
                    >
                      <span className="font-bold text-xs sm:text-base">3</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 sm:gap-4 mt-4 sm:mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-3 sm:px-5 py-2 sm:py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 text-sm sm:text-base"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-sm sm:text-base"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default FeaturedResourceManager;
