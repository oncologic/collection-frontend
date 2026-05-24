import React, { useState, useRef, useEffect } from "react";
import {
  FaMagic,
  FaSpinner,
  FaEdit,
  FaTimes,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaKeyboard,
  FaSearch,
  FaPlus,
  FaLink,
  FaFileAlt,
  FaImage,
  FaVideo,
  FaTags,
  FaEye,
  FaTrash,
  FaRobot,
  FaFilter,
  FaUndo,
  FaCopy,
  FaExternalLinkAlt,
  FaCheckSquare,
  FaSquare,
  FaPaperclip,
  FaInfoCircle,
  FaRegStickyNote,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  usePreviewExternalLinkResources,
  useConfirmExternalLinkResources,
  usePreviewNotations,
  useConfirmNotations,
  useContentSearch,
} from "../hooks/useAI";
import { useGetResources } from "../hooks/useResources";
import { useQueryClient } from "@tanstack/react-query";
import InputField from "./inputs/InputField";
import MultiSelect from "./inputs/MultiSelect";
import CustomEditor from "./common/CustomEditor";
import TagInput from "./inputs/TagInput";
import { formatLongDate } from "../utils/general";

const categories = [
  { id: "Idea", name: "Idea" },
  { id: "Action", name: "Action" },
  { id: "Thought", name: "Thought" },
  { id: "Question", name: "Question" },
  { id: "Observation", name: "Observation" },
];

const statuses = [
  { id: "Pending", name: "Pending" },
  { id: "In Progress", name: "In Progress" },
  { id: "Waiting", name: "Waiting" },
  { id: "Completed", name: "Completed" },
  { id: "Cancelled", name: "Cancelled" },
  { id: "Archived", name: "Archived" },
];

const visibilityOptions = [
  { id: "private", name: "Only Me" },
  { id: "unlisted", name: "Collaborators" },
  { id: "public", name: "Public" },
];

const ExternalLinkResourceAICreate = ({
  externalLinkId,
  onClose,
  onResourcesAttached,
  isCollaborator = false,
}) => {
  // State management
  const [inputMode, setInputMode] = useState("search"); // "search", "ai", "manual"
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedResources, setSelectedResources] = useState([]);
  const [previewResources, setPreviewResources] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [resourcesExpanded, setResourcesExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [showNotationCreation, setShowNotationCreation] = useState(false);
  const [notationPrompt, setNotationPrompt] = useState("");
  const [previewNotations, setPreviewNotations] = useState([]);
  const [editingNotationIndex, setEditingNotationIndex] = useState(null);
  const [showWorkoutPlanInput, setShowWorkoutPlanInput] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState("");

  // Character count
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 2000;

  // Filtered visibility options for collaborators
  const filteredVisibilityOptions = visibilityOptions.filter(
    (option) => !isCollaborator || option.id !== "public"
  );

  // Hooks
  const { mutateAsync: previewResourcesMutation } =
    usePreviewExternalLinkResources();
  const { mutateAsync: confirmResourcesMutation } =
    useConfirmExternalLinkResources();
  const { mutateAsync: previewNotationsMutation } = usePreviewNotations();
  const { mutateAsync: confirmNotationsMutation } = useConfirmNotations();
  const { data: existingResources } = useGetResources();
  const queryClient = useQueryClient();
  const searchMutation = useContentSearch();
  const searchMutationRef = useRef(searchMutation);
  const searchInputRef = useRef(null);

  useEffect(() => {
    searchMutationRef.current = searchMutation;
  }, [searchMutation]);

  // Generate preview with AI
  const handleGeneratePreview = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please enter a description of the resources you want");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await previewResourcesMutation({
        prompt: aiPrompt.trim(),
        externalLinkId,
        existingResources: existingResources || [],
        metadata: {
          inputMode,
          requestedCount: 5, // Default to suggesting 5 resources
        },
      });

      if (result.preview && result.preview.length > 0) {
        setPreviewResources(result.preview);
        setShowPreview(true);
        toast.success(`Found ${result.preview.length} resources to attach`);
      } else {
        toast.error("No resources could be found for your request");
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      toast.error("Failed to generate resource suggestions");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        searchMutationRef.current.mutate(
          { searchQuery },
          {
            onSuccess: (data) => {
              const resources =
                data?.content?.filter((item) => item.type === "resource") || [];
              setSearchResults(resources);
              setIsSearching(false);
            },
            onError: () => {
              setIsSearching(false);
              toast.error("Failed to search resources");
            },
          }
        );
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Handle resource selection from search
  const handleResourceSelect = (resource) => {
    setSelectedResources((prev) => {
      const isAlreadySelected = prev.some((r) => r.id === resource.id);
      if (isAlreadySelected) {
        return prev;
      }
      return [...prev, resource];
    });
    toast.success(`Added "${resource.title || resource.name}" to selection`);
  };

  // Remove resource from selection
  const handleRemoveResource = (resourceId) => {
    setSelectedResources((prev) => prev.filter((r) => r.id !== resourceId));
  };

  // Toggle resource selection
  const handleToggleResource = (resource) => {
    setSelectedResources((prev) => {
      const isSelected = prev.some((r) => r.id === resource.id);
      if (isSelected) {
        return prev.filter((r) => r.id !== resource.id);
      } else {
        return [...prev, resource];
      }
    });
  };

  // Select all resources
  const handleSelectAll = (resources) => {
    const allIds = resources.map((r) => r.id);
    const allSelected = resources.every((r) =>
      selectedResources.some((sr) => sr.id === r.id)
    );

    if (allSelected) {
      setSelectedResources((prev) =>
        prev.filter((r) => !allIds.includes(r.id))
      );
    } else {
      setSelectedResources((prev) => {
        const newResources = resources.filter(
          (r) => !prev.some((pr) => pr.id === r.id)
        );
        return [...prev, ...newResources];
      });
    }
  };

  // Update resource in preview
  const updateResource = (index, field, value) => {
    setPreviewResources((prev) =>
      prev.map((resource, i) =>
        i === index ? { ...resource, [field]: value } : resource
      )
    );
  };

  // Delete resource from preview
  const deleteResource = (index) => {
    setPreviewResources((prev) => prev.filter((_, i) => i !== index));
    if (previewResources.length === 1) {
      setShowPreview(false);
    }
  };

  // Generate notations with AI
  const handleGenerateNotations = async () => {
    if (!notationPrompt.trim()) {
      toast.error("Please describe the notations you want to create");
      return;
    }

    if (selectedResources.length === 0) {
      toast.error("Please select resources first");
      return;
    }

    setIsGenerating(true);
    try {
      const result = await previewNotationsMutation({
        prompt: notationPrompt.trim(),
        externalLinkId,
        contextDetails: {
          attachedResources: selectedResources.map((r) => ({
            id: r.id,
            name: r.name || r.title,
            description: r.description,
            url: r.url,
            type: r.type,
            tags: r.tags?.map((t) => t.name) || [],
          })),
          resourceCount: selectedResources.length,
          resourceNames: selectedResources
            .map((r) => r.name || r.title)
            .join(", "),
        },
      });

      if (result.preview && result.preview.length > 0) {
        setPreviewNotations(result.preview);
        toast.success(`Generated ${result.preview.length} notations`);
      } else {
        toast.error("No notations could be generated");
      }
    } catch (error) {
      console.error("Error generating notations:", error);
      toast.error("Failed to generate notations");
    } finally {
      setIsGenerating(false);
    }
  };

  // Update notation in preview
  const updateNotation = (index, field, value) => {
    setPreviewNotations((prev) =>
      prev.map((notation, i) =>
        i === index ? { ...notation, [field]: value } : notation
      )
    );
  };

  // Delete notation from preview
  const deleteNotation = (index) => {
    setPreviewNotations((prev) => prev.filter((_, i) => i !== index));
  };

  // Confirm and attach resources
  const handleConfirm = async () => {
    const resourcesToAttach = showPreview
      ? previewResources
      : selectedResources;

    if (resourcesToAttach.length === 0) {
      toast.error("No resources selected to attach");
      return;
    }

    setIsConfirming(true);
    try {
      // First attach resources
      const resourceResult = await confirmResourcesMutation({
        resources: resourcesToAttach,
        externalLinkId,
        action: "attach",
      });

      let totalCreated =
        resourceResult.attachedCount || resourcesToAttach.length;

      // Then create notations if any
      if (previewNotations.length > 0) {
        const notationResult = await confirmNotationsMutation({
          notations: previewNotations,
          externalLinkId,
        });
        totalCreated += notationResult.createdCount || previewNotations.length;
      }

      toast.success(
        `Successfully attached ${resourcesToAttach.length} resource${
          resourcesToAttach.length !== 1 ? "s" : ""
        }${
          previewNotations.length > 0
            ? ` and created ${previewNotations.length} notation${
                previewNotations.length !== 1 ? "s" : ""
              }`
            : ""
        }`
      );

      // Refresh data
      queryClient.invalidateQueries({
        queryKey: ["externalLinkById", externalLinkId],
      });
      queryClient.invalidateQueries({ queryKey: ["externalLinkNotations"] });

      onResourcesAttached?.(resourceResult.resources);
      onClose();
    } catch (error) {
      console.error("Error attaching resources:", error);
      toast.error("Failed to attach resources");
    } finally {
      setIsConfirming(false);
    }
  };

  // Resource card component
  const ResourceCard = ({
    resource,
    isSelected,
    onToggle,
    isPreview = false,
    index,
  }) => {
    const getResourceIcon = () => {
      if (resource.type === "video" || resource.url?.includes("youtube.com"))
        return FaVideo;
      if (resource.type === "image") return FaImage;
      return FaFileAlt;
    };

    const Icon = getResourceIcon();

    return (
      <div
        className={`border rounded-lg p-4 transition-all ${
          isSelected
            ? "border-blue-500 bg-blue-50"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-start gap-3">
          {!isPreview && (
            <button
              onClick={() => onToggle(resource)}
              className="flex-shrink-0 mt-1"
            >
              {isSelected ? (
                <FaCheckSquare className="text-blue-600 text-lg" />
              ) : (
                <FaSquare className="text-gray-400 text-lg" />
              )}
            </button>
          )}

          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Icon className="text-gray-600" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {isPreview && editingIndex === index ? (
              // Edit mode
              <div className="space-y-3">
                <InputField
                  label="Title"
                  value={resource.name || ""}
                  onChange={(e) =>
                    updateResource(index, "name", e.target.value)
                  }
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={resource.description || ""}
                    onChange={(e) =>
                      updateResource(index, "description", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>
                <InputField
                  label="URL"
                  type="url"
                  value={resource.url || ""}
                  onChange={(e) => updateResource(index, "url", e.target.value)}
                  required
                />
                <button
                  onClick={() => setEditingIndex(null)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Done Editing
                </button>
              </div>
            ) : (
              // Display mode
              <>
                <h4 className="font-medium text-gray-900 truncate">
                  {resource.name || resource.title}
                </h4>
                {resource.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {resource.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  {resource.organization && (
                    <span>{resource.organization.name}</span>
                  )}
                  {resource.createdAt && (
                    <span>
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {resource.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: `${tag.color}20`,
                          borderColor: tag.color,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                    {resource.tags.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{resource.tags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {isPreview && (
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setEditingIndex(editingIndex === index ? null : index)
                }
                className="text-blue-600 hover:text-blue-700"
                title="Edit resource"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => deleteResource(index)}
                className="text-red-600 hover:text-red-700"
                title="Remove resource"
              >
                <FaTrash />
              </button>
            </div>
          )}

          {!isPreview && resource.url && (
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700"
              onClick={(e) => e.stopPropagation()}
            >
              <FaExternalLinkAlt />
            </a>
          )}
        </div>
      </div>
    );
  };

  // Notation card component
  const NotationCard = ({
    notation,
    index,
    isEditing,
    onEdit,
    onUpdate,
    onRemove,
  }) => {
    if (isEditing) {
      return (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="space-y-4">
            <InputField
              label="Title"
              value={notation.title}
              onChange={(e) => onUpdate(index, "title", e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={notation.category}
                  onChange={(e) => onUpdate(index, "category", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={notation.status}
                  onChange={(e) => onUpdate(index, "status", e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notation.notes}
                onChange={(e) => onUpdate(index, "notes", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                rows="3"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notation.highlighted}
                  onChange={(e) =>
                    onUpdate(index, "highlighted", e.target.checked)
                  }
                  className="mr-2"
                />
                Highlighted
              </label>

              <select
                value={notation.visibility}
                onChange={(e) => onUpdate(index, "visibility", e.target.value)}
                className="p-1 border border-gray-300 rounded text-sm"
              >
                {filteredVisibilityOptions.map((vis) => (
                  <option key={vis.id} value={vis.id}>
                    {vis.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onEdit(null)}
                className="flex items-center px-3 py-1 text-green-600 border border-green-300 rounded hover:bg-green-50"
              >
                <FaCheck className="mr-1" />
                Save
              </button>
              <button
                onClick={() => onRemove(index)}
                className="flex items-center px-3 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50"
              >
                <FaTrash className="mr-1" />
                Remove
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-900">{notation.title}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(index)}
              className="text-blue-600 hover:text-blue-800"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => onRemove(index)}
              className="text-red-600 hover:text-red-800"
            >
              <FaTrash />
            </button>
          </div>
        </div>

        <p className="text-gray-700 text-sm mb-3">{notation.notes}</p>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
            {notation.category}
          </span>
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
            {notation.status}
          </span>
          {notation.highlighted && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
              ⭐ Highlighted
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FaMagic className="text-2xl text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              Add Resources to External Link
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!showPreview ? (
            // Input Section
            <div className="p-6 space-y-6">
              {/* Input Mode Selector */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setInputMode("search")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    inputMode === "search"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <FaSearch />
                  <span>Search Existing</span>
                </button>
                <button
                  onClick={() => setInputMode("ai")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    inputMode === "ai"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <FaRobot />
                  <span>AI Generate</span>
                </button>
              </div>

              {inputMode === "search" ? (
                // Search Mode
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search for resources to attach
                  </label>
                  <div className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search resources by title, description, or tags..."
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      {isSearching ? (
                        <FaSpinner className="animate-spin text-gray-400" />
                      ) : (
                        <FaSearch className="text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Search Results Dropdown */}
                  {searchQuery.length >= 2 && searchResults.length > 0 && (
                    <div className="mt-2 border border-gray-200 rounded-lg shadow-lg bg-white max-h-64 overflow-y-auto">
                      <div className="p-2 text-sm text-gray-600 border-b">
                        Found {searchResults.length} resources
                      </div>
                      {searchResults.map((resource) => {
                        const isSelected = selectedResources.some(
                          (r) => r.id === resource.id
                        );
                        return (
                          <div
                            key={resource.id}
                            onClick={() =>
                              !isSelected && handleResourceSelect(resource)
                            }
                            className={`p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 ${
                              isSelected ? "bg-gray-100 opacity-60" : ""
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  {resource.title || resource.name}
                                </h4>
                                {resource.description && (
                                  <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                                    {resource.description}
                                  </p>
                                )}
                              </div>
                              {isSelected && (
                                <span className="text-green-600 text-sm">
                                  ✓ Selected
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* No results message */}
                  {searchQuery.length >= 2 &&
                    !isSearching &&
                    searchResults.length === 0 && (
                      <div className="mt-2 p-4 text-center text-gray-500 border border-gray-200 rounded-lg">
                        No resources found for &quot;{searchQuery}&quot;
                      </div>
                    )}

                  {/* Selected Resources Summary */}
                  {selectedResources.length > 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Selected Resources ({selectedResources.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedResources.map((resource) => (
                          <span
                            key={resource.id}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white border border-blue-300"
                          >
                            {resource.name || resource.title}
                            <button
                              onClick={() => handleRemoveResource(resource.id)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // AI Mode
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe the resources you want to attach
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => {
                      setAiPrompt(e.target.value);
                      setCharCount(e.target.value.length);
                    }}
                    placeholder="Example: Add resources about strength training exercises for Monday's workout, including videos on proper form for squats and deadlifts..."
                    className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                    maxLength={MAX_CHARS}
                  />
                  <div className="mt-2 text-right text-sm text-gray-500">
                    {charCount} / {MAX_CHARS} characters
                  </div>

                  {/* AI Generate Button */}
                  <button
                    onClick={handleGeneratePreview}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="mt-4 w-full py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isGenerating ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Finding Resources...</span>
                      </>
                    ) : (
                      <>
                        <FaMagic />
                        <span>Find Resources with AI</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Quick AI Links Section */}
              {selectedResources.length > 0 && (
                <div className="border-t pt-6">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mb-4">
                    <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FaRobot className="text-purple-600" />
                      Quick AI Workout Plan
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Copy resource details and create your workout plan with:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          const resourceDetails = selectedResources
                            .map(
                              (r) =>
                                `- ${r.name || r.title}: ${
                                  r.description || "No description"
                                }`
                            )
                            .join("\n");
                          const prompt = `I'm planning a workout with these exercises:\n\n${resourceDetails}\n\nPlease create a workout plan with sets, reps, and form tips.`;
                          navigator.clipboard.writeText(prompt);
                          toast.success(
                            "Prompt copied! Open ChatGPT to continue."
                          );
                        }}
                        className="px-3 py-1.5 bg-green-100 text-green-700 border border-green-300 rounded-lg hover:bg-green-200 text-sm flex items-center gap-1"
                      >
                        <FaCopy className="text-xs" />
                        Copy for ChatGPT
                      </button>
                      <button
                        onClick={() => {
                          const resourceDetails = selectedResources
                            .map(
                              (r) =>
                                `- ${r.name || r.title}: ${
                                  r.description || "No description"
                                }`
                            )
                            .join("\n");
                          const prompt = `I'm planning a workout with these exercises:\n\n${resourceDetails}\n\nPlease create a workout plan with sets, reps, and form tips.`;
                          navigator.clipboard.writeText(prompt);
                          toast.success(
                            "Prompt copied! Open Claude to continue."
                          );
                        }}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-200 text-sm flex items-center gap-1"
                      >
                        <FaCopy className="text-xs" />
                        Copy for Claude
                      </button>
                      <a
                        href="https://chat.openai.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-1"
                      >
                        <FaExternalLinkAlt className="text-xs" />
                        Open ChatGPT
                      </a>
                      <a
                        href="https://claude.ai"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-1"
                      >
                        <FaExternalLinkAlt className="text-xs" />
                        Open Claude
                      </a>
                    </div>

                    {/* Workout Plan Input */}
                    <div className="mt-4">
                      <button
                        onClick={() =>
                          setShowWorkoutPlanInput(!showWorkoutPlanInput)
                        }
                        className="text-sm text-purple-600 hover:text-purple-700 underline"
                      >
                        {showWorkoutPlanInput ? "Hide" : "Show"} workout plan
                        input
                      </button>

                      {showWorkoutPlanInput && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Paste your workout plan here:
                          </label>
                          <textarea
                            value={workoutPlan}
                            onChange={(e) => setWorkoutPlan(e.target.value)}
                            placeholder="Paste the workout plan from ChatGPT/Claude here..."
                            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                          />
                          <button
                            onClick={() => {
                              if (workoutPlan.trim()) {
                                setNotationPrompt(workoutPlan);
                                setShowNotationCreation(true);
                                toast.success(
                                  "Workout plan added to notation!"
                                );
                              }
                            }}
                            disabled={!workoutPlan.trim()}
                            className="mt-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            Use as Notation
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Notations Section */}
                  <button
                    onClick={() =>
                      setShowNotationCreation(!showNotationCreation)
                    }
                    className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FaRegStickyNote className="text-xl text-gray-600" />
                      <div className="text-left">
                        <h3 className="font-medium text-gray-900">
                          Add Notations (Optional)
                        </h3>
                        <p className="text-sm text-gray-600">
                          Create notes about these resources with AI
                        </p>
                      </div>
                    </div>
                    {showNotationCreation ? (
                      <FaChevronUp className="text-gray-500" />
                    ) : (
                      <FaChevronDown className="text-gray-500" />
                    )}
                  </button>

                  {showNotationCreation && (
                    <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Creating notations for:</strong>{" "}
                          {selectedResources
                            .map((r) => r.name || r.title)
                            .join(", ")}
                        </p>
                      </div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Describe the notations to create
                      </label>
                      <textarea
                        value={notationPrompt}
                        onChange={(e) => setNotationPrompt(e.target.value)}
                        placeholder="Example: Create workout notes for each exercise with sets, reps, and form cues..."
                        className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                      <button
                        onClick={handleGenerateNotations}
                        disabled={isGenerating || !notationPrompt.trim()}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isGenerating ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FaMagic className="mr-2" />
                            Generate Notations
                          </>
                        )}
                      </button>

                      {/* Preview Notations */}
                      {previewNotations.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <h4 className="font-medium text-gray-900">
                            Preview Notations ({previewNotations.length})
                          </h4>
                          {previewNotations.map((notation, index) => (
                            <NotationCard
                              key={index}
                              notation={notation}
                              index={index}
                              isEditing={editingNotationIndex === index}
                              onEdit={setEditingNotationIndex}
                              onUpdate={updateNotation}
                              onRemove={deleteNotation}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Preview Section
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Review Resources to Attach ({previewResources.length})
                  </h3>
                  <button
                    onClick={() => setResourcesExpanded(!resourcesExpanded)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {resourcesExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>

                {resourcesExpanded && (
                  <div className="space-y-4">
                    {previewResources.map((resource, index) => (
                      <ResourceCard
                        key={index}
                        resource={resource}
                        isPreview={true}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex justify-between">
            {showPreview ? (
              <>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewResources([]);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to Search
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isConfirming || previewResources.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isConfirming ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Attaching...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      <span>
                        Attach {previewResources.length} Resource
                        {previewResources.length !== 1 ? "s" : ""}
                        {previewNotations.length > 0 &&
                          ` & Create ${previewNotations.length} Notation${
                            previewNotations.length !== 1 ? "s" : ""
                          }`}
                      </span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                {selectedResources.length > 0 && (
                  <button
                    onClick={handleConfirm}
                    disabled={isConfirming}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isConfirming ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Attaching...</span>
                      </>
                    ) : (
                      <>
                        <FaPaperclip />
                        <span>
                          Attach {selectedResources.length} Selected Resource
                          {selectedResources.length !== 1 ? "s" : ""}
                          {previewNotations.length > 0 &&
                            ` & Create ${previewNotations.length} Notation${
                              previewNotations.length !== 1 ? "s" : ""
                            }`}
                        </span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExternalLinkResourceAICreate;
