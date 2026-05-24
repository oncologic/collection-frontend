import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  FaMagic,
  FaSpinner,
  FaEdit,
  FaTimes,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaUpload,
  FaImage,
  FaKeyboard,
  FaEye,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaUsers,
  FaTags,
  FaLink,
  FaUserTie,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { usePreviewEvents, useConfirmEvents } from "../hooks/useAI";
import { useProcessImage } from "../hooks/useAI";
import { useQueryClient } from "@tanstack/react-query";
import { useContextAuth } from "../context/authContext";
import SelectField from "./inputs/SelectField";
import InputField from "./inputs/InputField";
import MultiSelect from "./inputs/MultiSelect";
import CustomEditor from "./common/CustomEditor";
import { DateTime } from "luxon";

// Helper function to format date
const formatDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return DateTime.fromISO(dateStr).toLocaleString(DateTime.DATETIME_MED);
  } catch {
    return dateStr;
  }
};

const EventAICreate = ({
  onClose,
  onEventsCreated,
  eventTypes = [],
  organizations = [],
  tags = [],
  selectedTenants = [],
  isBulkMode = false,
}) => {
  // Input state
  const [inputMode, setInputMode] = useState("text"); // "text" or "image"
  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);

  // Preview state
  const [previewEvents, setPreviewEvents] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [eventsExpanded, setEventsExpanded] = useState(true);

  // Organization state
  const [organizationsExpanded, setOrganizationsExpanded] = useState(true);

  // Workflow state
  const [originalPrompt, setOriginalPrompt] = useState("");

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Character count
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 4000;

  // Refs
  const fileInputRef = useRef(null);

  // Hooks
  const { mutateAsync: previewEventsMutation } = usePreviewEvents();
  const { mutateAsync: confirmEventsMutation } = useConfirmEvents();
  const { mutateAsync: processImageMutation } = useProcessImage();
  const queryClient = useQueryClient();

  // Get auth context for role checking
  const { isAdmin, isAdvocate, systemUser } = useContextAuth();

  // Filter tenants to only show those where user can add events
  const availableTenantsForCreation = useMemo(() => {
    if (!selectedTenants.length) return [];

    return selectedTenants.filter((tenant) => {
      // Always allow personal tenant (community tenant)
      if (tenant.id === process.env.NEXT_PUBLIC_COMMUNITY_TENANT) {
        return true;
      }

      // For other tenants, user must be admin or advocate
      return isAdmin || isAdvocate;
    });
  }, [selectedTenants, isAdmin, isAdvocate]);

  // Filter organizations based on selected tenant
  const filteredOrganizations = useMemo(() => {
    if (!selectedTenant || !organizations.length) return [];

    // Filter organizations that belong to the selected tenant
    const filtered = organizations.filter((org) => {
      // Check if organization belongs to the tenant
      const belongsToTenant =
        org.tenantId === selectedTenant.id ||
        org.tenants?.some((tenant) => tenant.id === selectedTenant.id);

      return belongsToTenant;
    });

    return filtered;
  }, [selectedTenant, organizations]);

  // Filter tags based on selected tenant
  const filteredTags = useMemo(() => {
    if (!selectedTenant || !tags.length) return [];

    // Filter tags that belong to the selected tenant
    const filtered = tags.filter((tag) => {
      // Check if tag belongs to the tenant
      const belongsToTenant =
        tag.tenantId === selectedTenant.id ||
        tag.tenants?.some((tenant) => tenant.id === selectedTenant.id);

      return belongsToTenant;
    });

    return filtered;
  }, [selectedTenant, tags]);

  // Initialize selected tenant with first available tenant for creation
  useEffect(() => {
    if (!selectedTenant && availableTenantsForCreation.length > 0) {
      setSelectedTenant(availableTenantsForCreation[0]);
    }
  }, [selectedTenant, availableTenantsForCreation]);

  // Reset selected organizations when tenant changes
  useEffect(() => {
    if (selectedOrganizations.length > 0) {
      const validOrgs = selectedOrganizations.filter((selectedOrg) =>
        filteredOrganizations.some((org) => org.id === selectedOrg.id)
      );
      if (validOrgs.length !== selectedOrganizations.length) {
        setSelectedOrganizations(validOrgs);
      }
    }
  }, [selectedOrganizations, filteredOrganizations]);

  // Handle image file selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please select a valid image file");
      }
    }
  };

  // Process image with AI
  const processImage = async () => {
    if (!imageFile) return;

    setIsProcessingImage(true);
    // Show immediate loading feedback
    toast("Extracting text from image...", {
      icon: "🔍",
      duration: 3000,
    });

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(",")[1];

        const result = await processImageMutation({
          imageData: base64,
          prompt: `Extract event information from this image. ${
            isBulkMode
              ? "If there are multiple events, extract all of them."
              : "Extract the main event."
          } Include details like title, date, time, location, description, speakers, and any other relevant information.`,
        });

        // Check for the extracted text in various possible response formats
        // The backend returns { content: result } where result has the actual text
        const content = result.content || result;
        const extractedText =
          content.extractedText ||
          content.data ||
          content.answer ||
          content.response ||
          content.message ||
          content;

        if (
          extractedText &&
          typeof extractedText === "string" &&
          extractedText.trim()
        ) {
          setTextInput(extractedText);
          setInputMode("text");
          // Update character count
          setCharCount(extractedText.length);

          // Clear the image since we've extracted the text
          setImageFile(null);
          setImagePreview(null);

          // Turn off image processing loader before starting event generation
          setIsProcessingImage(false);

          // Immediately trigger AI preview generation with the extracted text
          handleGeneratePreview(extractedText);
        } else {
          toast.error("No text could be extracted from the image");
          console.error("Unexpected OCR response format:", result);
          setIsProcessingImage(false);
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
      setIsProcessingImage(false);
    }
  };

  // Generate AI preview
  const handleGeneratePreview = async (
    customPrompt = null,
    additionalOrgs = []
  ) => {
    const input = customPrompt || textInput.trim();

    if (!input) {
      toast.error("Please provide some text or upload an image");
      return;
    }

    if (!selectedTenant) {
      toast.error(
        "Please select a tenant where you have permission to create events"
      );
      return;
    }

    if (selectedOrganizations.length === 0) {
      toast.error("Please select at least one business unit for the events");
      return;
    }

    // Store the original prompt for potential re-processing
    if (!customPrompt) {
      setOriginalPrompt(input);
    }

    setIsGenerating(true);

    // Show immediate feedback that generation has started
    toast.success("Generating AI events...");
    try {
      // Use additionalOrgs if provided (after org creation), otherwise use selected organizations
      const allOrganizations =
        additionalOrgs && additionalOrgs.length > 0
          ? additionalOrgs
          : selectedOrganizations.length > 0
          ? selectedOrganizations // Use selected organizations
          : [];

      // Deep check for circular references in props
      const checkForCircular = (obj, name) => {
        try {
          JSON.stringify(obj);
          return true;
        } catch (e) {
          console.error(`Circular reference detected in ${name}:`, e.message);
          return false;
        }
      };

      // Check each prop for circular references

      // Deep inspection of each prop
      const inspectProp = (prop, name) => {
        if (!prop || !Array.isArray(prop)) return;

        prop.forEach((item, index) => {
          if (item && typeof item === "object") {
            Object.entries(item).forEach(([key, value]) => {
              if (value && typeof value === "object") {
                // Check if it's a DOM element
                if (value instanceof HTMLElement) {
                  console.error(
                    `${name}[${index}].${key} is an HTMLElement!`,
                    value
                  );
                }
                // Check if it has React fiber properties
                if (
                  value.__reactFiber$ ||
                  value.__reactProps$ ||
                  value.__reactInternalInstance
                ) {
                  console.error(
                    `${name}[${index}].${key} contains React internals!`
                  );
                }
                // Check for common React element properties
                if (value.$$typeof || value._owner || value._store) {
                  console.error(`${name}[${index}].${key} is a React element!`);
                }
              }
            });
          }
        });
      };

      inspectProp(eventTypes, "eventTypes");
      inspectProp(organizations, "organizations");
      inspectProp(tags, "tags");
      inspectProp(additionalOrgs, "additionalOrgs");

      checkForCircular(eventTypes, "eventTypes");
      checkForCircular(organizations, "organizations");
      checkForCircular(tags, "tags");
      checkForCircular(additionalOrgs, "additionalOrgs");

      // Create deep clone function that removes all non-serializable data
      const deepCleanObject = (obj) => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj !== "object") return obj;
        if (obj instanceof Date) return obj.toISOString();
        if (obj instanceof HTMLElement) return null;
        if (Array.isArray(obj)) {
          return obj
            .map((item) => deepCleanObject(item))
            .filter((item) => item !== null);
        }

        const cleaned = {};
        for (const [key, value] of Object.entries(obj)) {
          // Skip React internal properties
          if (key.startsWith("__react") || key.startsWith("_react")) continue;
          if (key === "$$typeof" || key === "_owner" || key === "_store")
            continue;

          // Skip functions
          if (typeof value === "function") continue;

          // Skip DOM elements
          if (value instanceof HTMLElement) continue;

          // Recursively clean nested objects
          const cleanedValue = deepCleanObject(value);
          if (cleanedValue !== null && cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }

        return cleaned;
      };

      // Create truly clean objects without any potential React/DOM references
      const cleanEventTypes = [];
      if (eventTypes && Array.isArray(eventTypes)) {
        for (const et of eventTypes) {
          if (et && typeof et === "object") {
            const cleaned = deepCleanObject(et);
            cleanEventTypes.push({
              id: String(cleaned.id || ""),
              name: String(cleaned.name || ""),
              description: String(cleaned.description || ""),
            });
          }
        }
      }

      const cleanOrganizations = [];
      if (allOrganizations && Array.isArray(allOrganizations)) {
        for (const org of allOrganizations) {
          if (org && typeof org === "object") {
            const cleaned = deepCleanObject(org);
            cleanOrganizations.push({
              id: String(cleaned.id || ""),
              name: String(cleaned.name || ""),
              acronym: String(cleaned.acronym || ""),
              description: String(cleaned.description || ""),
              website: String(cleaned.website || ""),
              email: String(cleaned.email || ""),
              phone: String(cleaned.phone || ""),
              city: String(cleaned.city || ""),
              state: String(cleaned.state || ""),
              category: String(cleaned.category || ""),
            });
          }
        }
      }

      const cleanTags = [];
      if (filteredTags && Array.isArray(filteredTags)) {
        for (const tag of filteredTags) {
          if (tag && typeof tag === "object") {
            const cleaned = deepCleanObject(tag);
            cleanTags.push({
              id: String(cleaned.id || ""),
              name: String(cleaned.name || ""),
              color: String(cleaned.color || ""),
              description: String(cleaned.description || ""),
            });
          }
        }
      }

      // Clean metadata to avoid circular references
      const cleanMetadata = {
        eventTypes: cleanEventTypes,
        organizations: cleanOrganizations,
        tags: cleanTags,
      };

      // Final check - ensure the entire object is serializable
      try {
        const testSerialize = JSON.stringify({
          prompt: input,
          metadata: cleanMetadata,
        });
      } catch (e) {
        // Check if the error is from the input
        try {
          JSON.stringify(input);
        } catch (inputError) {
          console.error("Input contains circular reference:", inputError);
        }

        throw new Error("Failed to serialize metadata: " + e.message);
      }

      const result = await previewEventsMutation({
        prompt: input,
        metadata: cleanMetadata,
        organizationId:
          selectedOrganizations.length === 1
            ? selectedOrganizations[0].id
            : null,
        organizationIds: selectedOrganizations.map((org) => org.id),
        tenantId: selectedTenant?.id || null,
      });

      if (result.preview && result.preview.length > 0) {
        let updatedPreviewEvents = result.preview;

        // We only use pre-selected organizations, no new orgs are created
        if (result.organizations) {
          // Ignore any organization suggestions from AI

          // Create a mapping of organization names to temporary IDs
          const orgNameToTempId = new Map();

          if (result.organizations.new && result.organizations.new.length > 0) {
            // Add temporary IDs to new organizations for tracking
            const orgsWithTempIds = result.organizations.new.map(
              (org, index) => {
                const tempId = `temp-${Date.now()}-${index}`;
                orgNameToTempId.set(org.name.toLowerCase(), tempId);
                return {
                  ...org,
                  tempId,
                };
              }
            );
            (() => {})(orgsWithTempIds);

            // If this is the first run and we have new organizations, show organization creation first
            if (!customPrompt) {
              (() => {})(true);
              setShowPreview(false);
              toast(
                `Found ${orgsWithTempIds.length} new business unit${
                  orgsWithTempIds.length > 1 ? "s" : ""
                } to create first`,
                {
                  icon: "🏢",
                  duration: 4000,
                }
              );
              return;
            }

            // Update events to use temporary IDs for new organizations
            updatedPreviewEvents = result.preview.map((event) => {
              if (event.organizations && Array.isArray(event.organizations)) {
                return {
                  ...event,
                  organizations: event.organizations.map((orgRef) => {
                    // If it's a string, it could be either an existing org ID or a new org name
                    if (typeof orgRef === "string") {
                      // Check if it's a UUID (existing organization ID)
                      const isUUID =
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                          orgRef
                        );

                      if (!isUUID) {
                        // This is likely a new organization name, check our mapping
                        const tempId = orgNameToTempId.get(
                          orgRef.toLowerCase()
                        );
                        if (tempId) {
                          return tempId;
                        }
                      }
                    }
                    return orgRef;
                  }),
                };
              }
              return event;
            });
          }
        }

        // Clean the preview events to ensure no DOM references
        const cleanedPreviewEvents = updatedPreviewEvents.map((event) => {
          const cleanedEvent = {
            ...event,
            // Use pre-selected organizations for all events
            organizations: selectedOrganizations.map((org) => org.id),
            // Ensure other fields are clean strings/primitives
            title: String(event.title || ""),
            description: String(event.description || ""),
            startTime: event.startTime || "",
            endTime: event.endTime || "",
            typeId: event.eventTypeId || event.typeId || "",
            locationName: String(event.locationName || ""),
            locationCity: String(event.locationCity || ""),
            locationState: String(event.locationState || ""),
            registrationUrl: String(event.registrationUrl || ""),
            tags: Array.isArray(event.tags)
              ? event.tags.map((tag) => String(tag))
              : [],
          };

          return cleanedEvent;
        });

        setPreviewEvents(cleanedPreviewEvents);
        setShowPreview(true);

        const orgCount = result.organizations?.new?.length || 0;
        const eventMsg = `Generated ${result.preview.length} event${
          result.preview.length > 1 ? "s" : ""
        }`;
        const orgMsg =
          orgCount > 0
            ? ` and found ${orgCount} new business unit${
                orgCount > 1 ? "s" : ""
              }`
            : "";
        toast.success(eventMsg + orgMsg);
      } else {
        toast.error("No events could be generated from the input");
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      toast.error(error.message || "Failed to generate preview");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle event field updates
  const updateEvent = (index, field, value) => {
    const updatedEvents = [...previewEvents];

    // Clean the value to ensure no DOM references
    let cleanValue = value;
    if (field === "organizations" && Array.isArray(value)) {
      // Ensure organizations is always an array of strings (IDs)
      cleanValue = value.map((org) =>
        typeof org === "string" ? org : String(org.id || org)
      );
    } else if (field === "tags" && Array.isArray(value)) {
      // Ensure tags is always an array of strings
      cleanValue = value.map((tag) =>
        typeof tag === "string" ? tag : String(tag.id || tag)
      );
    } else if (
      typeof value === "object" &&
      value !== null &&
      !(value instanceof Date)
    ) {
      // If it's an object (but not a Date), convert to string or extract ID
      cleanValue = String(value.id || value);
    }

    updatedEvents[index] = {
      ...updatedEvents[index],
      [field]: cleanValue,
    };
    setPreviewEvents(updatedEvents);
  };

  // Delete event from preview
  const deleteEvent = (index) => {
    const updatedEvents = previewEvents.filter((_, i) => i !== index);
    setPreviewEvents(updatedEvents);
    if (updatedEvents.length === 0) {
      setShowPreview(false);
    }
  };

  // Removed handleConfirmOrganizations - we never create new organizations

  // Confirm and create events
  const handleConfirmEvents = async () => {
    if (previewEvents.length === 0) {
      toast.error("No events to create");
      return;
    }

    setIsConfirming(true);
    try {
      // Don't convert times - send them as-is with timezone info
      const eventsWithTimezone = previewEvents.map((event) => ({
        ...event,
        // Ensure timezone is included
        timezone: event.timezone || "America/Chicago",
      }));

      // Don't pass newOrganizations since they've already been created
      const result = await confirmEventsMutation({
        events: eventsWithTimezone,
        newOrganizations: [], // Empty array - organizations already created
        organizationId:
          selectedOrganizations.length === 1
            ? selectedOrganizations[0].id
            : null,
        organizationIds: selectedOrganizations.map((org) => org.id),
        tenantId: selectedTenant?.id || null,
      });

      if (result.results.successful > 0) {
        toast.success(
          `Created ${result.results.successful} event${
            result.results.successful > 1 ? "s" : ""
          } successfully`
        );
        onEventsCreated?.(result.results.createdEvents);
        onClose();
      }

      if (result.results.failed > 0) {
        toast.error(
          `Failed to create ${result.results.failed} event${
            result.results.failed > 1 ? "s" : ""
          }`
        );
      }
    } catch (error) {
      console.error("Error creating events:", error);
      toast.error(error.message || "Failed to create events");
    } finally {
      setIsConfirming(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return DateTime.fromISO(dateString).toFormat("LLL dd, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col relative">
        {/* Loading Overlay */}
        {(isGenerating || isProcessingImage) && (
          <div className="absolute inset-0 bg-white bg-opacity-90 z-50 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">
                {isProcessingImage
                  ? "Extracting text from image..."
                  : "Generating AI events..."}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This may take a few moments
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <FaMagic className="text-2xl text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              AI Event Creation {isBulkMode && "(Bulk Mode)"}
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
          {false ? (
            // This section is disabled - we never show organization creation
            <div>
              <div className="space-y-4">
                {[].map((org, index) => (
                  <div
                    key={org.tempId}
                    className="border border-orange-200 rounded-lg p-4 bg-orange-50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        New Business Unit {index + 1}
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            setEditingOrgIndex(
                              editingOrgIndex === index ? null : index
                            )
                          }
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit business unit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            const updatedOrgs = [].filter(
                              (_, i) => i !== index
                            );
                            (() => {})(updatedOrgs);
                          }}
                          className="text-red-600 hover:text-red-700"
                          title="Delete business unit"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>

                    {editingOrgIndex === index ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <InputField
                          label="Business Unit Name"
                          value={org.name || ""}
                          onChange={(e) => {
                            const updatedOrgs = [[]];
                            updatedOrgs[index] = {
                              ...updatedOrgs[index],
                              name: e.target.value,
                            };
                            (() => {})(updatedOrgs);
                          }}
                          required
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <InputField
                            label="Acronym"
                            value={org.acronym || ""}
                            onChange={(e) => {
                              const updatedOrgs = [[]];
                              updatedOrgs[index] = {
                                ...updatedOrgs[index],
                                acronym: e.target.value,
                              };
                              (() => {})(updatedOrgs);
                            }}
                          />
                          <InputField
                            label="Category"
                            value={org.category || ""}
                            onChange={(e) => {
                              const updatedOrgs = [[]];
                              updatedOrgs[index] = {
                                ...updatedOrgs[index],
                                category: e.target.value,
                              };
                              (() => {})(updatedOrgs);
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={org.description || ""}
                            onChange={(e) => {
                              const updatedOrgs = [[]];
                              updatedOrgs[index] = {
                                ...updatedOrgs[index],
                                description: e.target.value,
                              };
                              (() => {})(updatedOrgs);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="3"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <InputField
                            label="City"
                            value={org.city || ""}
                            onChange={(e) => {
                              const updatedOrgs = [[]];
                              updatedOrgs[index] = {
                                ...updatedOrgs[index],
                                city: e.target.value,
                              };
                              (() => {})(updatedOrgs);
                            }}
                          />
                          <InputField
                            label="State"
                            value={org.state || ""}
                            onChange={(e) => {
                              const updatedOrgs = [[]];
                              updatedOrgs[index] = {
                                ...updatedOrgs[index],
                                state: e.target.value,
                              };
                              (() => {})(updatedOrgs);
                            }}
                          />
                        </div>

                        <InputField
                          label="Website"
                          type="url"
                          value={org.website || ""}
                          onChange={(e) => {
                            const updatedOrgs = [[]];
                            updatedOrgs[index] = {
                              ...updatedOrgs[index],
                              website: e.target.value,
                            };
                            (() => {})(updatedOrgs);
                          }}
                        />

                        <button
                          onClick={() => setEditingOrgIndex(null)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                          Done Editing
                        </button>
                      </div>
                    ) : (
                      // Display Mode
                      <div className="space-y-2">
                        <h5 className="font-medium text-gray-900">
                          {org.name}
                        </h5>
                        {org.acronym && (
                          <p className="text-sm text-gray-600">
                            Acronym: {org.acronym}
                          </p>
                        )}
                        {org.description && (
                          <p className="text-sm text-gray-700">
                            {org.description}
                          </p>
                        )}
                        {(org.city || org.state) && (
                          <p className="text-sm text-gray-600">
                            <FaMapMarkerAlt className="inline mr-1" />
                            {[org.city, org.state].filter(Boolean).join(", ")}
                          </p>
                        )}
                        {org.website && (
                          <p className="text-sm text-gray-600">
                            <FaLink className="inline mr-1" />
                            {org.website}
                          </p>
                        )}
                        {org.category && (
                          <p className="text-sm text-gray-600">
                            <FaUserTie className="inline mr-1" />
                            {org.category}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : !showPreview ? (
            // Input Section
            <div className="p-6 space-y-6">
              {/* Tenant and Organization Selection - MOVED TO TOP */}
              <div className="space-y-4">
                {/* Tenant Selection (First) */}
                <div>
                  <SelectField
                    label="Tenant"
                    value={selectedTenant}
                    onChange={(tenant) => setSelectedTenant(tenant)}
                    options={availableTenantsForCreation}
                    placeholder="Select tenant"
                  />
                  {availableTenantsForCreation.length <
                    selectedTenants.length && (
                    <p className="mt-1 text-xs text-amber-600">
                      💡 Some tenants require admin/advocate permissions to
                      create events
                    </p>
                  )}
                </div>

                {/* Organization Selection (Second, filtered by tenant) */}
                <div>
                  <MultiSelect
                    label="Business Units (Required)"
                    value={selectedOrganizations}
                    onChange={(orgs) => setSelectedOrganizations(orgs)}
                    options={filteredOrganizations}
                    placeholder="Select business units..."
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    All generated events will be associated with these
                    business units
                  </p>
                </div>
              </div>

              {/* Input Mode Selector */}
              <div className="flex space-x-4 mb-6">
                <button
                  onClick={() => setInputMode("text")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    inputMode === "text"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <FaKeyboard />
                  <span>Text Input</span>
                </button>
                <button
                  onClick={() => setInputMode("image")}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    inputMode === "image"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <FaImage />
                  <span>Image Input</span>
                </button>
              </div>

              {inputMode === "text" ? (
                // Text Input
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Describe the event{isBulkMode ? "s" : ""} you want to create
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => {
                      setTextInput(e.target.value);
                      setCharCount(e.target.value.length);
                    }}
                    placeholder={
                      isBulkMode
                        ? "Example: Create events for:\n1. Annual kidney cancer symposium on March 15th from 9am-5pm at Convention Center NYC\n2. Monthly support group meeting every Tuesday at 6pm online\n3. Fundraising gala on April 20th..."
                        : "Example: Annual kidney cancer awareness walk on May 15th at Central Park, registration required, expecting 200 attendees..."
                    }
                    className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    maxLength={MAX_CHARS}
                  />
                  <div className="mt-2 text-right text-sm text-gray-500">
                    {charCount} / {MAX_CHARS} characters
                  </div>
                </div>
              ) : (
                // Image Input
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {!imagePreview ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400"
                    >
                      <FaUpload className="mx-auto text-4xl text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-600 mb-2">
                        Upload an image containing event information
                      </p>
                      <p className="text-sm text-gray-500">
                        Flyers, posters, screenshots, or photos of event details
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Event preview"
                          className="w-full max-h-96 object-contain rounded-lg"
                        />
                        <button
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                        >
                          <FaTimes />
                        </button>
                      </div>
                      <button
                        onClick={processImage}
                        disabled={isProcessingImage}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isProcessingImage ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            <span>Processing Image...</span>
                          </>
                        ) : (
                          <>
                            <FaEye />
                            <span>Extract Event Details</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Example Templates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-700 mb-2">
                  Quick Templates:
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      setTextInput(
                        "Create a monthly support group meeting for cancer patients and caregivers, held online every second Tuesday at 6pm EST"
                      )
                    }
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    → Support Group Meeting
                  </button>
                  <button
                    onClick={() =>
                      setTextInput(
                        "Annual kidney cancer awareness conference on [date] from 9am-5pm at [venue], featuring keynote speakers and research presentations"
                      )
                    }
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    → Conference/Symposium
                  </button>
                  <button
                    onClick={() =>
                      setTextInput(
                        "Fundraising gala for kidney cancer research on [date] at [venue], cocktails at 6pm, dinner at 7pm, ticket price $150"
                      )
                    }
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    → Fundraising Event
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={() => handleGeneratePreview()}
                disabled={
                  isGenerating ||
                  isProcessingImage ||
                  (!textInput.trim() && !imageFile)
                }
                className="w-full py-3 rounded-lg text-white font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-all"
              >
                {isGenerating || isProcessingImage ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>
                      {isProcessingImage
                        ? "Processing Image..."
                        : "Generating Events..."}
                    </span>
                  </>
                ) : (
                  <>
                    <FaMagic />
                    <span>Generate Event{isBulkMode ? "s" : ""}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            // Preview Section
            <div className="p-4">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Preview Generated Events ({previewEvents.length})
                  </h3>
                  <button
                    onClick={() => setEventsExpanded(!eventsExpanded)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {eventsExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>

                {eventsExpanded && (
                  <div className="space-y-2">
                    {previewEvents.map((event, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-2 bg-white"
                      >
                        {/* Event Header */}
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-lg font-medium text-gray-900">
                            {event.title || `Untitled Event ${index + 1}`}
                          </h4>
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                setEditingIndex(
                                  editingIndex === index ? null : index
                                )
                              }
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit event"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => deleteEvent(index)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete event"
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </div>

                        {editingIndex === index ? (
                          // Edit Mode
                          <div className="space-y-4">
                            <InputField
                              label="Title"
                              value={event.title || ""}
                              onChange={(e) =>
                                updateEvent(index, "title", e.target.value)
                              }
                              required
                            />

                            <div className="grid grid-cols-2 gap-4">
                              <InputField
                                label="Start Date & Time"
                                type="datetime-local"
                                value={event.startTime?.slice(0, 16) || ""}
                                onChange={(e) =>
                                  updateEvent(
                                    index,
                                    "startTime",
                                    e.target.value + ":00"
                                  )
                                }
                                required
                              />
                              <InputField
                                label="End Date & Time"
                                type="datetime-local"
                                value={event.endTime?.slice(0, 16) || ""}
                                onChange={(e) =>
                                  updateEvent(
                                    index,
                                    "endTime",
                                    e.target.value + ":00"
                                  )
                                }
                                required
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Time Zone
                              </label>
                              <select
                                value={event.timezone || "America/Chicago"}
                                onChange={(e) =>
                                  updateEvent(index, "timezone", e.target.value)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="America/New_York">
                                  Eastern Time (ET)
                                </option>
                                <option value="America/Chicago">
                                  Central Time (CT)
                                </option>
                                <option value="America/Denver">
                                  Mountain Time (MT)
                                </option>
                                <option value="America/Los_Angeles">
                                  Pacific Time (PT)
                                </option>
                                <option value="America/Anchorage">
                                  Alaska Time (AKT)
                                </option>
                                <option value="Pacific/Honolulu">
                                  Hawaii Time (HT)
                                </option>
                              </select>
                            </div>

                            <SelectField
                              label="Event Type"
                              value={
                                eventTypes.find((t) => t.id === event.typeId) ||
                                null
                              }
                              onChange={(selectedType) =>
                                updateEvent(
                                  index,
                                  "typeId",
                                  selectedType?.id || null
                                )
                              }
                              options={eventTypes}
                              required
                            />

                            <MultiSelect
                              label="Business Units"
                              value={organizations.filter((org) =>
                                event.organizations?.includes(org.id)
                              )}
                              onChange={(selectedOrgs) =>
                                updateEvent(
                                  index,
                                  "organizations",
                                  selectedOrgs.map((org) => org.id)
                                )
                              }
                              options={organizations}
                              placeholder="Select business units"
                              required
                            />

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                              </label>
                              <textarea
                                value={event.description || ""}
                                onChange={(e) =>
                                  updateEvent(
                                    index,
                                    "description",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows="4"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <InputField
                                label="Location Name"
                                value={event.locationName || ""}
                                onChange={(e) =>
                                  updateEvent(
                                    index,
                                    "locationName",
                                    e.target.value
                                  )
                                }
                              />
                              <InputField
                                label="Location City"
                                value={event.locationCity || ""}
                                onChange={(e) =>
                                  updateEvent(
                                    index,
                                    "locationCity",
                                    e.target.value
                                  )
                                }
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <InputField
                                label="Registration URL"
                                type="url"
                                value={event.registrationUrl || ""}
                                onChange={(e) =>
                                  updateEvent(
                                    index,
                                    "registrationUrl",
                                    e.target.value
                                  )
                                }
                              />
                              <InputField
                                label="Max Attendees"
                                type="number"
                                value={event.maxAttendees || ""}
                                onChange={(e) =>
                                  updateEvent(
                                    index,
                                    "maxAttendees",
                                    e.target.value
                                      ? Number(e.target.value)
                                      : null
                                  )
                                }
                              />
                            </div>

                            <button
                              onClick={() => setEditingIndex(null)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                              Done Editing
                            </button>
                          </div>
                        ) : (
                          // Display Mode
                          <div className="space-y-1">
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <FaCalendarAlt />
                                <span>{formatDate(event.startTime)}</span>
                                {event.timezone && (
                                  <span className="text-xs">
                                    (
                                    {event.timezone
                                      .split("/")[1]
                                      ?.replace("_", " ") || event.timezone}
                                    )
                                  </span>
                                )}
                              </div>
                              {event.locationName && (
                                <div className="flex items-center space-x-1">
                                  <FaMapMarkerAlt />
                                  <span>{event.locationName}</span>
                                </div>
                              )}
                            </div>

                            {event.description && (
                              <p className="text-sm text-gray-700">
                                {event.description}
                              </p>
                            )}

                            {event.organizations?.length > 0 && (
                              <div className="flex items-center space-x-2 text-sm">
                                <FaUsers className="text-gray-500" />
                                <span className="text-gray-600">
                                  {event.organizations.length} business unit
                                  {event.organizations.length > 1 ? "s" : ""}
                                </span>
                              </div>
                            )}

                            {event.tags?.length > 0 && (
                              <div className="flex items-center space-x-2 text-sm">
                                <FaTags className="text-gray-500" />
                                <span className="text-gray-600">
                                  {event.tags.length} tag
                                  {event.tags.length > 1 ? "s" : ""}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* New Organizations Section - Disabled */}
              {false && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      New Business Units to Create ({[].length})
                    </h3>
                    <button
                      onClick={() =>
                        setOrganizationsExpanded(!organizationsExpanded)
                      }
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {organizationsExpanded ? (
                        <FaChevronUp />
                      ) : (
                        <FaChevronDown />
                      )}
                    </button>
                  </div>

                  {organizationsExpanded && (
                    <div className="space-y-4">
                      {[].map((org, index) => (
                        <div
                          key={org.tempId}
                          className="border border-orange-200 rounded-lg p-4 bg-orange-50"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="text-lg font-medium text-gray-900">
                              New Business Unit {index + 1}
                            </h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  setEditingOrgIndex(
                                    editingOrgIndex === index ? null : index
                                  )
                                }
                                className="text-blue-600 hover:text-blue-700"
                                title="Edit business unit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => {
                                  const updatedOrgs = [].filter(
                                    (_, i) => i !== index
                                  );
                                  (() => {})(updatedOrgs);
                                }}
                                className="text-red-600 hover:text-red-700"
                                title="Delete business unit"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </div>

                          {editingOrgIndex === index ? (
                            // Edit Mode
                            <div className="space-y-4">
                              <InputField
                                label="Business Unit Name"
                                value={org.name || ""}
                                onChange={(e) => {
                                  const updatedOrgs = [[]];
                                  updatedOrgs[index] = {
                                    ...updatedOrgs[index],
                                    name: e.target.value,
                                  };
                                  (() => {})(updatedOrgs);
                                }}
                                required
                              />

                              <div className="grid grid-cols-2 gap-4">
                                <InputField
                                  label="Acronym"
                                  value={org.acronym || ""}
                                  onChange={(e) => {
                                    const updatedOrgs = [[]];
                                    updatedOrgs[index] = {
                                      ...updatedOrgs[index],
                                      acronym: e.target.value,
                                    };
                                    (() => {})(updatedOrgs);
                                  }}
                                />
                                <InputField
                                  label="Category"
                                  value={org.category || ""}
                                  onChange={(e) => {
                                    const updatedOrgs = [[]];
                                    updatedOrgs[index] = {
                                      ...updatedOrgs[index],
                                      category: e.target.value,
                                    };
                                    (() => {})(updatedOrgs);
                                  }}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Description
                                </label>
                                <textarea
                                  value={org.description || ""}
                                  onChange={(e) => {
                                    const updatedOrgs = [[]];
                                    updatedOrgs[index] = {
                                      ...updatedOrgs[index],
                                      description: e.target.value,
                                    };
                                    (() => {})(updatedOrgs);
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  rows="3"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <InputField
                                  label="City"
                                  value={org.city || ""}
                                  onChange={(e) => {
                                    const updatedOrgs = [[]];
                                    updatedOrgs[index] = {
                                      ...updatedOrgs[index],
                                      city: e.target.value,
                                    };
                                    (() => {})(updatedOrgs);
                                  }}
                                />
                                <InputField
                                  label="State"
                                  value={org.state || ""}
                                  onChange={(e) => {
                                    const updatedOrgs = [[]];
                                    updatedOrgs[index] = {
                                      ...updatedOrgs[index],
                                      state: e.target.value,
                                    };
                                    (() => {})(updatedOrgs);
                                  }}
                                />
                              </div>

                              <InputField
                                label="Website"
                                type="url"
                                value={org.website || ""}
                                onChange={(e) => {
                                  const updatedOrgs = [[]];
                                  updatedOrgs[index] = {
                                    ...updatedOrgs[index],
                                    website: e.target.value,
                                  };
                                  (() => {})(updatedOrgs);
                                }}
                              />

                              <button
                                onClick={() => setEditingOrgIndex(null)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                              >
                                Done Editing
                              </button>
                            </div>
                          ) : (
                            // Display Mode
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-900">
                                {org.name}
                              </h5>
                              {org.acronym && (
                                <p className="text-sm text-gray-600">
                                  Acronym: {org.acronym}
                                </p>
                              )}
                              {org.description && (
                                <p className="text-sm text-gray-700">
                                  {org.description}
                                </p>
                              )}
                              {(org.city || org.state) && (
                                <p className="text-sm text-gray-600">
                                  <FaMapMarkerAlt className="inline mr-1" />
                                  {[org.city, org.state]
                                    .filter(Boolean)
                                    .join(", ")}
                                </p>
                              )}
                              {org.website && (
                                <p className="text-sm text-gray-600">
                                  <FaLink className="inline mr-1" />
                                  {org.website}
                                </p>
                              )}
                              {org.category && (
                                <p className="text-sm text-gray-600">
                                  <FaUserTie className="inline mr-1" />
                                  {org.category}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-6">
          <div className="flex justify-between">
            {false ? (
              // Disabled - we never create new organizations
              <>
                <button
                  onClick={() => {
                    (() => {})(false);
                    (() => {})([]);
                    (() => {})(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {}}
                  disabled={isConfirming || [].length === 0}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isConfirming ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Creating Business Units...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      <span>
                        Create {[].length} Business Unit
                        {[].length > 1 ? "s" : ""} & Continue
                      </span>
                    </>
                  )}
                </button>
              </>
            ) : showPreview ? (
              <>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewEvents([]);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to Input
                </button>
                <button
                  onClick={handleConfirmEvents}
                  disabled={isConfirming || previewEvents.length === 0}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isConfirming ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Creating Events...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      <span>
                        Create {previewEvents.length} Event
                        {previewEvents.length > 1 ? "s" : ""}
                      </span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventAICreate;
