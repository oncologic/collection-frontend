import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  FaMagic,
  FaPlus,
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
  FaBook,
  FaGlobeAmericas,
  FaTags,
  FaLink,
  FaUserTie,
  FaShieldAlt,
  FaLightbulb,
  FaExclamationTriangle,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { usePreviewResources, useConfirmResources } from "../hooks/useAI";
import { useProcessImage } from "../hooks/useAI";
import { useContextAuth } from "../context/authContext";
import { useCreateOrganization } from "../hooks/useOrganizations";
import { useQueryClient } from "@tanstack/react-query";
import SelectField from "./inputs/SelectField";
import SearchableDropdown from "./inputs/SearchableDropdown";
import InputField from "./inputs/InputField";
import MultiSelect from "./inputs/MultiSelect";
import CustomEditor from "./common/CustomEditor";
import { DateTime } from "luxon";

const ResourceAICreate = ({
  onClose,
  onResourcesCreated,
  resourceTypes = [],
  organizations = [],
  tags = [],
  sensitivityLevels = [],
  expertiseLevels = [],
  isBulkMode = false,
  selectedTenants = [],
  existingResources = [],
}) => {
  // Input state
  const [inputMode, setInputMode] = useState("text");
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [duplicateWarnings, setDuplicateWarnings] = useState([]);
  const [localOrganizations, setLocalOrganizations] = useState([]);
  const [showQuickCreateOrg, setShowQuickCreateOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgWebsite, setNewOrgWebsite] = useState("");

  // Get auth context for role checking
  const { isAdmin, isAdvocate, systemUser } = useContextAuth();

  // Filter tenants to only show those where user can add resources
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

  const availableOrganizations = useMemo(() => {
    const byId = new Map();

    [...(organizations || []), ...localOrganizations].forEach((org) => {
      if (org?.id && !byId.has(org.id)) {
        byId.set(org.id, org);
      }
    });

    return Array.from(byId.values());
  }, [organizations, localOrganizations]);

  // Filter organizations based on selected tenant
  const filteredOrganizations = useMemo(() => {
    if (!selectedTenant || !availableOrganizations.length) return [];

    // Debug logging to understand organization structure

    // Filter organizations that belong to the selected tenant
    const filtered = availableOrganizations.filter((org) => {
      // Check if organization belongs to the tenant
      const belongsToTenant =
        org.tenantId === selectedTenant.id ||
        org.tenants?.some((tenant) => tenant.id === selectedTenant.id);

      return belongsToTenant;
    });

    return filtered;
  }, [selectedTenant, availableOrganizations]);

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

  // Reset selected tenant if current one is not available for creation
  useEffect(() => {
    if (
      selectedTenant &&
      !availableTenantsForCreation.some(
        (tenant) => tenant.id === selectedTenant.id
      )
    ) {
      // Set to first available tenant for creation
      setSelectedTenant(availableTenantsForCreation[0] || null);
    }
  }, [selectedTenant, availableTenantsForCreation]);

  useEffect(() => {
    setShowQuickCreateOrg(false);
    setNewOrgName("");
    setNewOrgWebsite("");
  }, [selectedTenant?.id]);

  // Reset selected organizations when tenant changes or when the orgs are no longer available
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

  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Preview state
  const [previewResources, setPreviewResources] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [resourcesExpanded, setResourcesExpanded] = useState(true);

  // Organization state
  const [organizationInfo, setOrganizationInfo] = useState(null);
  const [newOrganizations, setNewOrganizations] = useState([]);
  const [organizationsExpanded, setOrganizationsExpanded] = useState(true);
  const [editingOrgIndex, setEditingOrgIndex] = useState(null);

  // Workflow state
  const [showOrganizationFirst, setShowOrganizationFirst] = useState(false);
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
  const { mutateAsync: previewResourcesMutation } = usePreviewResources();
  const { mutateAsync: confirmResourcesMutation } = useConfirmResources();
  const { mutateAsync: processImageMutation } = useProcessImage();
  const createOrganizationMutation = useCreateOrganization();

  // Re-run duplicate detection when preview resources change (for real-time updates)
  useEffect(() => {
    if (previewResources.length > 0 && existingResources.length > 0) {
      const prevWarningCount = duplicateWarnings.length;
      const newWarnings = detectDuplicates(previewResources);

      // Show notification if duplicate warnings were resolved
      if (prevWarningCount > 0 && newWarnings.length < prevWarningCount) {
        const resolvedCount = prevWarningCount - newWarnings.length;
        toast.success(
          `✅ Resolved ${resolvedCount} duplicate warning${
            resolvedCount > 1 ? "s" : ""
          }`
        );
      }

      setDuplicateWarnings(newWarnings);
    }
  }, [previewResources, existingResources, duplicateWarnings.length]);

  // Duplicate detection function
  const detectDuplicates = (newResources) => {
    if (!existingResources.length) return [];

    const warnings = [];

    newResources.forEach((newResource, index) => {
      const potentialDuplicates = existingResources.filter((existing) => {
        // Skip if no name to compare
        if (!newResource.name || !existing.name) return false;

        const newName = newResource.name.toLowerCase().trim();
        const existingName = existing.name.toLowerCase().trim();

        // Exact match
        if (newName === existingName) {
          return true;
        }

        // URL match (strong indicator of duplicate)
        if (
          newResource.url &&
          existing.url &&
          newResource.url.trim() === existing.url.trim()
        ) {
          return true;
        }

        // Fuzzy name matching - check if names are very similar (85%+ threshold)
        const similarity = calculateSimilarity(newName, existingName);
        if (similarity > 0.85) {
          return true;
        }

        // More strict containment check - only for very similar titles
        if (newName.length > 20 && existingName.length > 20) {
          const shorterLength = Math.min(newName.length, existingName.length);
          const longerLength = Math.max(newName.length, existingName.length);

          // Only check containment if the length difference isn't too large
          if (shorterLength / longerLength > 0.75) {
            // 75% length similarity
            if (
              newName.includes(existingName) ||
              existingName.includes(newName)
            ) {
              const containmentSimilarity = shorterLength / longerLength;
              if (containmentSimilarity > 0.85) {
                return true;
              }
            }
          }
        }

        return false;
      });

      if (potentialDuplicates.length > 0) {
        warnings.push({
          resourceIndex: index,
          newResource,
          duplicates: potentialDuplicates,
        });
      }
    });

    return warnings;
  };

  // Calculate string similarity (Levenshtein distance based)
  const calculateSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  };

  // Levenshtein distance calculation
  const levenshteinDistance = (str1, str2) => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };
  const queryClient = useQueryClient();

  const handleQuickCreateOrganization = async () => {
    if (!newOrgName.trim()) {
      toast.error("Organization name is required");
      return;
    }

    if (!selectedTenant?.id) {
      toast.error("Please select a tenant first");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", newOrgName.trim());
      if (newOrgWebsite.trim()) {
        formData.append("website", newOrgWebsite.trim());
      }
      formData.append("tenantId", selectedTenant.id);

      const newOrg = await createOrganizationMutation.mutateAsync(formData);
      const orgToAdd = {
        ...newOrg,
        tenantId: newOrg.tenantId || selectedTenant.id,
        tenants: newOrg.tenants || [
          { id: selectedTenant.id, name: selectedTenant.name },
        ],
      };

      setLocalOrganizations((current) =>
        current.some((org) => org.id === orgToAdd.id)
          ? current
          : [...current, orgToAdd]
      );
      setSelectedOrganizations((current) =>
        current.some((org) => org.id === orgToAdd.id)
          ? current
          : [...current, orgToAdd]
      );

      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      await queryClient.invalidateQueries({
        queryKey: ["public-organizations"],
      });

      setNewOrgName("");
      setNewOrgWebsite("");
      setShowQuickCreateOrg(false);
      toast.success("Organization created and selected");
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error(error.message || "Failed to create organization");
    }
  };

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
    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(",")[1];

        const result = await processImageMutation({
          imageData: base64,
          prompt: `Extract resource information from this image. ${
            isBulkMode
              ? "If there are multiple resources, extract all of them."
              : "Extract the main resource."
          } Include details like title, description, resource type, url, and any other relevant information.`,
        });

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
          toast.success("Image processed successfully");
          setCharCount(extractedText.length);

          setImageFile(null);
          setImagePreview(null);

          // Automatically trigger AI preview generation with the extracted text
          toast("Generating AI resource preview...", {
            icon: "🔄",
            duration: 3000,
          });
          // Small delay to ensure state updates properly
          setTimeout(() => {
            handleGeneratePreview(extractedText);
          }, 100);
        } else {
          toast.error("No text could be extracted from the image");
          console.error("Unexpected OCR response format:", result);
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
    } finally {
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
        "Please select a tenant where you have permission to create resources"
      );
      return;
    }

    if (selectedOrganizations.length === 0) {
      toast.error("Please select at least one organization for the resources");
      return;
    }

    if (!customPrompt) {
      setOriginalPrompt(input);
    }

    setIsGenerating(true);
    try {
      // When organizations are selected, only send those organizations
      // This ensures the backend honors the forced organization selection
      const allOrganizations =
        additionalOrgs && additionalOrgs.length > 0
          ? additionalOrgs
          : selectedOrganizations.length > 0
          ? selectedOrganizations // Only send the selected organizations
          : [];

      const cleanMetadata = {
        resourceTypes: resourceTypes.map((rt) => ({
          id: String(rt.id || ""),
          name: String(rt.name || ""),
          description: String(rt.description || ""),
        })),
        organizations: allOrganizations.map((org) => ({
          id: String(org.id || ""),
          name: String(org.name || ""),
          acronym: String(org.acronym || ""),
          description: String(org.description || ""),
        })),
        tags: filteredTags.map((tag) => ({
          id: String(tag.id || ""),
          name: String(tag.name || ""),
          color: String(tag.color || ""),
          description: String(tag.description || ""),
        })),
        sensitivityLevels: sensitivityLevels.map((sl) => ({
          id: String(sl.id || ""),
          name: String(sl.name || ""),
          description: String(sl.description || ""),
        })),
        expertiseLevels: expertiseLevels.map((el) => ({
          id: String(el.id || ""),
          name: String(el.name || ""),
          description: String(el.description || ""),
        })),
      };

      // Debug logging to verify payload
      const payload = {
        prompt: input,
        metadata: cleanMetadata,
        organizationId:
          selectedOrganizations.length === 1
            ? selectedOrganizations[0].id
            : null,
        organizationIds: selectedOrganizations.map((org) => org.id),
        tenantId: selectedTenant?.id || null,
      };

      const result = await previewResourcesMutation(payload);

      if (result.preview && result.preview.length > 0) {
        let updatedPreviewResources = result.preview;

        // Handle organization information if present
        if (result.organizations) {
          setOrganizationInfo(result.organizations);

          const orgNameToTempId = new Map();

          if (result.organizations.new && result.organizations.new.length > 0) {
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
            setNewOrganizations(orgsWithTempIds);

            if (!customPrompt) {
              setShowOrganizationFirst(true);
              setShowPreview(false);
              toast(
                `Found ${orgsWithTempIds.length} new organization${
                  orgsWithTempIds.length > 1 ? "s" : ""
                } to create first`,
                {
                  icon: "🏢",
                  duration: 4000,
                }
              );
              return;
            }

            updatedPreviewResources = result.preview.map((resource) => {
              if (
                resource.organizations &&
                Array.isArray(resource.organizations)
              ) {
                return {
                  ...resource,
                  organizations: resource.organizations.map((orgRef) => {
                    if (typeof orgRef === "string") {
                      const isUUID =
                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                          orgRef
                        );

                      if (!isUUID) {
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
              return resource;
            });
          }
        }

        // Clean the preview resources to ensure no DOM references
        const cleanedPreviewResources = updatedPreviewResources.map(
          (resource) => {
            const cleanedResource = {
              ...resource,
              organizations: Array.isArray(resource.organizations)
                ? resource.organizations
                    .map((org) => {
                      if (typeof org === "string") {
                        return org;
                      } else if (org && typeof org === "object") {
                        return String(org.id || "");
                      }
                      return "";
                    })
                    .filter((id) => id)
                : [],
              name: String(resource.name || resource.title || ""),
              description: String(resource.description || ""),
              url: String(resource.url || ""),
              resourceTypeId: String(resource.typeId || ""),
              sensitivityLevelId: resource.sensitivityLevelId || "",
              expertiseLevelId: resource.expertiseLevelId || "",
              tags: Array.isArray(resource.tags)
                ? resource.tags.map((tag) => String(tag))
                : [],
              tenantId: resource.tenantId || selectedTenants?.[0] || "",
            };

            return cleanedResource;
          }
        );

        setPreviewResources(cleanedPreviewResources);

        // Check for duplicates
        const duplicates = detectDuplicates(cleanedPreviewResources);
        setDuplicateWarnings(duplicates);

        setShowPreview(true);

        const orgCount = result.organizations?.new?.length || 0;
        const resourceMsg = `Generated ${result.preview.length} resource${
          result.preview.length > 1 ? "s" : ""
        }`;
        const orgMsg =
          orgCount > 0
            ? ` and found ${orgCount} new organization${
                orgCount > 1 ? "s" : ""
              }`
            : "";

        // Add duplicate warning to toast if found
        if (duplicates.length > 0) {
          toast.warning(
            `${resourceMsg}${orgMsg} - ${
              duplicates.length
            } potential duplicate${duplicates.length > 1 ? "s" : ""} detected`
          );
        } else {
          toast.success(resourceMsg + orgMsg);
        }
      } else {
        toast.error("No resources could be generated from the input");
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      toast.error(error.message || "Failed to generate preview");
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle resource field updates
  const updateResource = (index, field, value) => {
    const updatedResources = [...previewResources];

    let cleanValue = value;
    if (field === "organizations" && Array.isArray(value)) {
      cleanValue = value.map((org) =>
        typeof org === "string" ? org : String(org.id || org)
      );
    } else if (field === "tags" && Array.isArray(value)) {
      cleanValue = value.map((tag) =>
        typeof tag === "string" ? tag : String(tag.id || tag)
      );
    } else if (
      typeof value === "object" &&
      value !== null &&
      !(value instanceof Date)
    ) {
      cleanValue = String(value.id || value);
    }

    updatedResources[index] = {
      ...updatedResources[index],
      [field]: cleanValue,
    };
    setPreviewResources(updatedResources);
  };

  const removeResource = (index) => {
    const updatedResources = previewResources.filter((_, i) => i !== index);
    setPreviewResources(updatedResources);

    // Update duplicate warnings to reflect new indices
    const updatedWarnings = duplicateWarnings
      .map((warning) => ({
        ...warning,
        resourceIndex:
          warning.resourceIndex > index
            ? warning.resourceIndex - 1
            : warning.resourceIndex,
      }))
      .filter((warning) => warning.resourceIndex !== index);

    setDuplicateWarnings(updatedWarnings);

    toast.success("Resource removed from preview");
  };

  // Delete resource from preview
  const deleteResource = (index) => {
    const updatedResources = previewResources.filter((_, i) => i !== index);
    setPreviewResources(updatedResources);
    if (updatedResources.length === 0) {
      setShowPreview(false);
    }
  };

  // Confirm and create organizations first
  const handleConfirmOrganizations = async () => {
    if (newOrganizations.length === 0) {
      toast.error("No organizations to create");
      return;
    }

    setIsConfirming(true);
    try {
      const result = await confirmResourcesMutation({
        resources: [],
        newOrganizations: newOrganizations,
        organizationId:
          selectedOrganizations.length === 1
            ? selectedOrganizations[0].id
            : null,
        organizationIds: selectedOrganizations.map((org) => org.id),
        tenantId: selectedTenant?.id || null,
      });

      if (
        result.results.createdOrganizations &&
        result.results.createdOrganizations.length > 0
      ) {
        toast.success(
          `Created ${result.results.createdOrganizations.length} organization${
            result.results.createdOrganizations.length > 1 ? "s" : ""
          }`
        );

        await queryClient.invalidateQueries({ queryKey: ["organizations"] });
        await new Promise((resolve) => setTimeout(resolve, 500));

        const updatedOrganizations =
          queryClient.getQueryData(["organizations"]) || organizations;

        setNewOrganizations([]);
        setShowOrganizationFirst(false);

        toast("Moving to resource creation...", {
          icon: "📚",
          duration: 2000,
        });

        handleGeneratePreview(originalPrompt, updatedOrganizations);
      }
    } catch (error) {
      console.error("Error creating organizations:", error);
      toast.error(error.message || "Failed to create organizations");
    } finally {
      setIsConfirming(false);
    }
  };

  // Confirm and create resources
  const handleConfirmResources = async () => {
    if (previewResources.length === 0) {
      toast.error("No resources to create");
      return;
    }

    // Validate resources before submitting
    const validationErrors = [];
    previewResources.forEach((resource, index) => {
      if (!resource.name || !resource.name.trim()) {
        validationErrors.push({
          index,
          name: resource.name || "Unnamed Resource",
          error: "Resource name is required",
        });
      }
      if (!resource.url || !resource.url.trim()) {
        validationErrors.push({
          index,
          name: resource.name || "Unnamed Resource",
          error: "Resource URL is required",
        });
      }
    });

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors.map(
        (err) => `Resource ${err.index + 1} (${err.name}): ${err.error}`
      );
      toast.error(
        `Please fix the following errors:\n${errorMessages.join("\n")}`,
        { duration: 5000 }
      );
      // Scroll to the first error resource
      setEditingIndex(validationErrors[0].index);
      return;
    }

    setIsConfirming(true);
    try {
      const result = await confirmResourcesMutation({
        resources: previewResources,
        newOrganizations: [],
        organizationId:
          selectedOrganizations.length === 1
            ? selectedOrganizations[0].id
            : null,
        organizationIds: selectedOrganizations.map((org) => org.id),
        tenantId: selectedTenant?.id || null,
      });

      if (result.results.successful > 0) {
        toast.success(
          `Created ${result.results.successful} resource${
            result.results.successful > 1 ? "s" : ""
          } successfully`
        );
        onResourcesCreated?.(result.results.createdResources);

        // Don't close if there were failures - let user fix errors
        if (result.results.failed === 0) {
          onClose();
        }
      }

      if (result.results.failed > 0 && result.results.errors) {
        // Show detailed error messages
        const errorMessages = result.results.errors.map(
          (err) => `Resource ${err.index + 1} (${err.name}): ${err.error}`
        );
        toast.error(
          `Failed to create ${result.results.failed} resource${
            result.results.failed > 1 ? "s" : ""
          }:\n${errorMessages.join("\n")}`,
          { duration: 8000 }
        );

        // Highlight the first error resource
        if (result.results.errors.length > 0) {
          setEditingIndex(result.results.errors[0].index);
          // Scroll to the error resource
          setTimeout(() => {
            const errorElement = document.getElementById(
              `resource-${result.results.errors[0].index}`
            );
            if (errorElement) {
              errorElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }, 100);
        }
      } else if (result.results.failed > 0) {
        toast.error(
          `Failed to create ${result.results.failed} resource${
            result.results.failed > 1 ? "s" : ""
          }`
        );
      }
    } catch (error) {
      console.error("Error creating resources:", error);
      toast.error(error.message || "Failed to create resources");
    } finally {
      setIsConfirming(false);
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
                  : "Generating AI resources..."}
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
              AI Resource Creation {isBulkMode && "(Bulk Mode)"}
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
          {showOrganizationFirst ? (
            // Organization Creation First
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  New Organizations Found
                </h3>
                <p className="text-gray-600">
                  We found {newOrganizations.length} new organization
                  {newOrganizations.length > 1 ? "s" : ""} that need to be
                  created before we can create the resources.
                </p>
              </div>

              <div className="space-y-4">
                {newOrganizations.map((org, index) => (
                  <div
                    key={org.tempId}
                    className="border border-orange-200 rounded-lg p-4 bg-orange-50"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        New Organization {index + 1}
                      </h4>
                      <div className="flex space-x-2">
                        <button
                          onClick={() =>
                            setEditingOrgIndex(
                              editingOrgIndex === index ? null : index
                            )
                          }
                          className="text-blue-600 hover:text-blue-700"
                          title="Edit organization"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => {
                            const updatedOrgs = newOrganizations.filter(
                              (_, i) => i !== index
                            );
                            setNewOrganizations(updatedOrgs);
                          }}
                          className="text-red-600 hover:text-red-700"
                          title="Delete organization"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    </div>

                    {editingOrgIndex === index ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <InputField
                          label="Organization Name"
                          value={org.name || ""}
                          onChange={(e) => {
                            const updatedOrgs = [...newOrganizations];
                            updatedOrgs[index] = {
                              ...updatedOrgs[index],
                              name: e.target.value,
                            };
                            setNewOrganizations(updatedOrgs);
                          }}
                          required
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <InputField
                            label="Acronym"
                            value={org.acronym || ""}
                            onChange={(e) => {
                              const updatedOrgs = [...newOrganizations];
                              updatedOrgs[index] = {
                                ...updatedOrgs[index],
                                acronym: e.target.value,
                              };
                              setNewOrganizations(updatedOrgs);
                            }}
                          />
                          <InputField
                            label="Category"
                            value={org.category || ""}
                            onChange={(e) => {
                              const updatedOrgs = [...newOrganizations];
                              updatedOrgs[index] = {
                                ...updatedOrgs[index],
                                category: e.target.value,
                              };
                              setNewOrganizations(updatedOrgs);
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
                              const updatedOrgs = [...newOrganizations];
                              updatedOrgs[index] = {
                                ...updatedOrgs[index],
                                description: e.target.value,
                              };
                              setNewOrganizations(updatedOrgs);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="3"
                          />
                        </div>

                        <InputField
                          label="Website"
                          type="url"
                          value={org.website || ""}
                          onChange={(e) => {
                            const updatedOrgs = [...newOrganizations];
                            updatedOrgs[index] = {
                              ...updatedOrgs[index],
                              website: e.target.value,
                            };
                            setNewOrganizations(updatedOrgs);
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
                      create resources
                    </p>
                  )}
                </div>

                {/* Organization Selection (Second, filtered by tenant) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Organizations{" "}
                      <span className="text-xs font-normal text-gray-500">
                        (required)
                      </span>
                    </label>
                    {!showQuickCreateOrg && (
                      <button
                        type="button"
                        onClick={() => setShowQuickCreateOrg(true)}
                        disabled={!selectedTenant}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaPlus className="h-3.5 w-3.5" />
                        <span>Create New</span>
                      </button>
                    )}
                  </div>
                  <MultiSelect
                    value={selectedOrganizations}
                    onChange={(orgs) => setSelectedOrganizations(orgs)}
                    options={filteredOrganizations}
                    placeholder="Select organizations..."
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    All generated resources will be associated with these
                    organizations
                  </p>
                  {showQuickCreateOrg && (
                    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">
                          Create New Organization
                        </h4>
                        <button
                          type="button"
                          onClick={() => {
                            setShowQuickCreateOrg(false);
                            setNewOrgName("");
                            setNewOrgWebsite("");
                          }}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <FaTimes className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Organization Name{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={newOrgName}
                            onChange={(e) => setNewOrgName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter organization name"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleQuickCreateOrganization();
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Website{" "}
                            <span className="text-gray-500 text-xs">
                              (optional)
                            </span>
                          </label>
                          <input
                            type="url"
                            value={newOrgWebsite}
                            onChange={(e) => setNewOrgWebsite(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="https://example.com"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleQuickCreateOrganization();
                              }
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleQuickCreateOrganization}
                            disabled={
                              createOrganizationMutation.isPending ||
                              !newOrgName.trim()
                            }
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                          >
                            {createOrganizationMutation.isPending
                              ? "Creating..."
                              : "Create & Add"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowQuickCreateOrg(false);
                              setNewOrgName("");
                              setNewOrgWebsite("");
                            }}
                            disabled={createOrganizationMutation.isPending}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
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
                    Describe the resource{isBulkMode ? "s" : ""} you want to
                    create
                  </label>
                  <textarea
                    value={textInput}
                    onChange={(e) => {
                      setTextInput(e.target.value);
                      setCharCount(e.target.value.length);
                    }}
                    placeholder={
                      isBulkMode
                        ? "Example: Create resources for:\n1. Kidney Cancer Treatment Guidelines PDF from the National Cancer Institute\n2. Patient education video about immunotherapy options\n3. Clinical trial finder tool from ClinicalTrials.gov..."
                        : "Example: A comprehensive guide to kidney cancer treatment options from Memorial Sloan Kettering, includes information about surgery, targeted therapy, and immunotherapy..."
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
                        Upload an image containing resource information
                      </p>
                      <p className="text-sm text-gray-500">
                        Screenshots of articles, book covers, or resource lists
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="Resource preview"
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
                            <span>Extract Resource Details</span>
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
                        "Create a resource for the National Comprehensive Cancer Network (NCCN) Kidney Cancer Guidelines, a comprehensive PDF guide for healthcare professionals"
                      )
                    }
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    → Clinical Guidelines
                  </button>
                  <button
                    onClick={() =>
                      setTextInput(
                        "Patient education video about understanding kidney cancer diagnosis and staging from the American Cancer Society"
                      )
                    }
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    → Patient Education Video
                  </button>
                  <button
                    onClick={() =>
                      setTextInput(
                        "Interactive tool for finding kidney cancer clinical trials from ClinicalTrials.gov, allows filtering by location and treatment type"
                      )
                    }
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    → Clinical Trial Finder
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
                        : "Generating Resources..."}
                    </span>
                  </>
                ) : (
                  <>
                    <FaMagic />
                    <span>Generate Resource{isBulkMode ? "s" : ""}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            // Preview Section
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Preview Generated Resources ({previewResources.length})
                  </h3>
                  <button
                    onClick={() => setResourcesExpanded(!resourcesExpanded)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {resourcesExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>

                {/* Duplicate Warnings */}
                {duplicateWarnings.length > 0 && (
                  <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start">
                      <FaExclamationTriangle className="text-yellow-600 mt-1 mr-3 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-yellow-800 mb-2">
                          Potential Duplicates Detected (
                          {duplicateWarnings.length})
                        </h4>
                        <div className="space-y-3">
                          {duplicateWarnings.map((warning, warningIndex) => (
                            <div key={warningIndex} className="text-sm">
                              <p className="font-medium text-yellow-800 mb-1">
                                Resource {warning.resourceIndex + 1}: &quot;
                                {warning.newResource.name}&quot;
                              </p>
                              <p className="text-yellow-700 mb-2">
                                Similar to {warning.duplicates.length} existing
                                resource
                                {warning.duplicates.length > 1 ? "s" : ""}:
                              </p>
                              <ul className="list-disc list-inside pl-4 text-yellow-700">
                                {warning.duplicates
                                  .slice(0, 3)
                                  .map((duplicate, dupIndex) => (
                                    <li key={dupIndex}>
                                      &quot;{duplicate.name}&quot;
                                      {duplicate.url &&
                                        warning.newResource.url ===
                                          duplicate.url && (
                                          <span className="ml-2 text-xs font-medium text-red-600">
                                            (Same URL)
                                          </span>
                                        )}
                                    </li>
                                  ))}
                                {warning.duplicates.length > 3 && (
                                  <li className="text-yellow-600">
                                    ...and {warning.duplicates.length - 3} more
                                  </li>
                                )}
                              </ul>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-yellow-700 mt-3">
                          Review these resources carefully before creating to
                          avoid duplicates.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {resourcesExpanded && (
                  <div className="space-y-4">
                    {/* Bulk Organization Actions */}
                    {selectedOrganizations.length > 0 && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FaGlobeAmericas className="text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">
                              Selected Organizations:{" "}
                              {selectedOrganizations
                                .map((org) => org.name)
                                .join(", ")}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              const selectedOrgIds = selectedOrganizations.map(
                                (org) => org.id
                              );
                              previewResources.forEach((resource, index) => {
                                updateResource(
                                  index,
                                  "organizations",
                                  selectedOrgIds
                                );
                              });
                              toast.success(
                                "Applied selected organizations to all resources"
                              );
                            }}
                            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                          >
                            Apply to All Resources
                          </button>
                        </div>
                      </div>
                    )}
                    {previewResources.map((resource, index) => (
                      <div
                        key={index}
                        id={`resource-${index}`}
                        className={`border rounded-lg p-4 bg-white ${
                          editingIndex === index
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : duplicateWarnings.some(
                                (w) => w.resourceIndex === index
                              )
                            ? "border-yellow-300"
                            : "border-gray-200"
                        }`}
                      >
                        {/* Resource Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              Resource {index + 1}
                            </h4>
                            {duplicateWarnings.some(
                              (w) => w.resourceIndex === index
                            ) && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <FaExclamationTriangle className="mr-1" />
                                Potential Duplicate
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                setEditingIndex(
                                  editingIndex === index ? null : index
                                )
                              }
                              className="text-blue-600 hover:text-blue-700"
                              title="Edit resource"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => deleteResource(index)}
                              className="text-red-600 hover:text-red-700"
                              title="Delete resource"
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
                              value={resource.name || ""}
                              onChange={(e) =>
                                updateResource(index, "name", e.target.value)
                              }
                              required
                            />

                            <InputField
                              label="URL"
                              type="url"
                              value={resource.url || ""}
                              onChange={(e) =>
                                updateResource(index, "url", e.target.value)
                              }
                              required
                            />

                            <SelectField
                              label="Resource Type"
                              value={
                                resourceTypes.find(
                                  (t) =>
                                    String(t.id) ===
                                    String(resource.resourceTypeId)
                                ) || null
                              }
                              onChange={(selectedType) =>
                                updateResource(
                                  index,
                                  "resourceTypeId",
                                  selectedType?.id || null
                                )
                              }
                              options={resourceTypes}
                              required
                            />

                            <MultiSelect
                              label="Organizations"
                              value={filteredOrganizations.filter((org) =>
                                resource.organizations?.includes(org.id)
                              )}
                              onChange={(selectedOrgs) =>
                                updateResource(
                                  index,
                                  "organizations",
                                  selectedOrgs.map((org) => org.id)
                                )
                              }
                              options={filteredOrganizations}
                              placeholder="Select organizations"
                            />

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description
                              </label>
                              <textarea
                                value={resource.description || ""}
                                onChange={(e) =>
                                  updateResource(
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
                              <SelectField
                                label="Sensitivity Level"
                                value={
                                  sensitivityLevels.find(
                                    (sl) =>
                                      sl.id === resource.sensitivityLevelId
                                  ) || null
                                }
                                onChange={(selected) =>
                                  updateResource(
                                    index,
                                    "sensitivityLevelId",
                                    selected?.id || null
                                  )
                                }
                                options={sensitivityLevels}
                              />
                              <SelectField
                                label="Expertise Level"
                                value={
                                  expertiseLevels.find(
                                    (el) => el.id === resource.expertiseLevelId
                                  ) || null
                                }
                                onChange={(selected) =>
                                  updateResource(
                                    index,
                                    "expertiseLevelId",
                                    selected?.id || null
                                  )
                                }
                                options={expertiseLevels}
                              />
                            </div>

                            <MultiSelect
                              label="Tags"
                              value={filteredTags.filter((tag) => {
                                if (
                                  !resource.tags ||
                                  !Array.isArray(resource.tags)
                                )
                                  return false;
                                return resource.tags.some((tagId) => {
                                  // Normalize both IDs to strings for comparison
                                  const normalizedTagId = String(tagId).trim();
                                  const normalizedOptionId = String(
                                    tag.id
                                  ).trim();
                                  return normalizedTagId === normalizedOptionId;
                                });
                              })}
                              onChange={(selectedTags) =>
                                updateResource(
                                  index,
                                  "tags",
                                  selectedTags.map((tag) => String(tag.id))
                                )
                              }
                              options={filteredTags}
                              placeholder="Select tags"
                            />

                            <button
                              onClick={() => setEditingIndex(null)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                            >
                              Done Editing
                            </button>
                          </div>
                        ) : (
                          // Display Mode
                          <div className="space-y-3">
                            <h5 className="font-medium text-gray-900">
                              {resource.name}
                            </h5>

                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {resource.url && (
                                <div className="flex items-center space-x-1">
                                  <FaLink />
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate max-w-xs"
                                  >
                                    {resource.url}
                                  </a>
                                </div>
                              )}
                              {resource.resourceTypeId && (
                                <div className="flex items-center space-x-1">
                                  <FaBook />
                                  <span>
                                    {resourceTypes.find(
                                      (rt) =>
                                        String(rt.id) ===
                                        String(resource.resourceTypeId)
                                    )?.name || "Unknown Type"}
                                  </span>
                                </div>
                              )}
                            </div>

                            {resource.description && (
                              <p className="text-sm text-gray-700">
                                {resource.description}
                              </p>
                            )}

                            {/* Quick Organization Override */}
                            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-medium text-gray-700">
                                  Organizations (click to change):
                                </label>
                                {resource.organizations?.length > 0 && (
                                  <button
                                    onClick={() =>
                                      updateResource(index, "organizations", [])
                                    }
                                    className="text-xs text-red-600 hover:text-red-700 underline"
                                  >
                                    Clear All
                                  </button>
                                )}
                              </div>
                              <MultiSelect
                                value={filteredOrganizations.filter((org) =>
                                  resource.organizations?.includes(org.id)
                                )}
                                onChange={(selectedOrgs) =>
                                  updateResource(
                                    index,
                                    "organizations",
                                    selectedOrgs.map((org) => org.id)
                                  )
                                }
                                options={filteredOrganizations}
                                placeholder="Select organizations"
                              />
                            </div>

                            <div className="flex flex-wrap gap-4 text-sm">
                              {resource.organizations?.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  <FaGlobeAmericas className="text-gray-500" />
                                  <span className="text-gray-600">
                                    {resource.organizations.length} organization
                                    {resource.organizations.length > 1
                                      ? "s"
                                      : ""}
                                  </span>
                                </div>
                              )}

                              {resource.sensitivityLevelId && (
                                <div className="flex items-center space-x-2">
                                  <FaShieldAlt className="text-gray-500" />
                                  <span className="text-gray-600">
                                    {sensitivityLevels.find(
                                      (sl) =>
                                        sl.id === resource.sensitivityLevelId
                                    )?.name || "Unknown"}
                                  </span>
                                </div>
                              )}

                              {resource.expertiseLevelId && (
                                <div className="flex items-center space-x-2">
                                  <FaLightbulb className="text-gray-500" />
                                  <span className="text-gray-600">
                                    {expertiseLevels.find(
                                      (el) =>
                                        el.id === resource.expertiseLevelId
                                    )?.name || "Unknown"}
                                  </span>
                                </div>
                              )}

                              {resource.tags?.length > 0 && (
                                <div className="flex items-start space-x-2">
                                  <FaTags className="text-gray-500 mt-1" />
                                  <div className="flex flex-wrap gap-1">
                                    {resource.tags.map((tagId) => {
                                      const tag = filteredTags.find(
                                        (t) => t.id === tagId
                                      );
                                      return tag ? (
                                        <span
                                          key={tag.id}
                                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                          style={{
                                            backgroundColor: tag.color
                                              ? `${tag.color}20`
                                              : "#e5e7eb",
                                            color: tag.color || "#374151",
                                            border: `1px solid ${
                                              tag.color || "#d1d5db"
                                            }`,
                                          }}
                                        >
                                          {tag.name}
                                        </span>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* New Organizations Section */}
              {newOrganizations.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      New Organizations to Create ({newOrganizations.length})
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
                      {newOrganizations.map((org, index) => (
                        <div
                          key={org.tempId}
                          className="border border-orange-200 rounded-lg p-4 bg-orange-50"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <h4 className="text-lg font-medium text-gray-900">
                              New Organization {index + 1}
                            </h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={() =>
                                  setEditingOrgIndex(
                                    editingOrgIndex === index ? null : index
                                  )
                                }
                                className="text-blue-600 hover:text-blue-700"
                                title="Edit organization"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => {
                                  const updatedOrgs = newOrganizations.filter(
                                    (_, i) => i !== index
                                  );
                                  setNewOrganizations(updatedOrgs);
                                }}
                                className="text-red-600 hover:text-red-700"
                                title="Delete organization"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </div>

                          {/* Organization details (same as in EventAICreate) */}
                          {editingOrgIndex === index ? (
                            // Edit Mode (same as EventAICreate)
                            <div className="space-y-4">
                              {/* ... organization edit fields ... */}
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
            {showOrganizationFirst ? (
              // Organization creation buttons
              <>
                <button
                  onClick={() => {
                    setShowOrganizationFirst(false);
                    setNewOrganizations([]);
                    setOrganizationInfo(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmOrganizations}
                  disabled={isConfirming || newOrganizations.length === 0}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isConfirming ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Creating Organizations...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      <span>
                        Create {newOrganizations.length} Organization
                        {newOrganizations.length > 1 ? "s" : ""} & Continue
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
                    setPreviewResources([]);
                    setNewOrganizations([]);
                    setOrganizationInfo(null);
                    setShowOrganizationFirst(false);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Back to Input
                </button>
                <button
                  onClick={handleConfirmResources}
                  disabled={isConfirming || previewResources.length === 0}
                  className={`px-6 py-2 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 ${
                    duplicateWarnings.length > 0
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isConfirming ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Creating Resources...</span>
                    </>
                  ) : (
                    <>
                      {duplicateWarnings.length > 0 ? (
                        <FaExclamationTriangle />
                      ) : (
                        <FaCheck />
                      )}
                      <span>
                        {duplicateWarnings.length > 0 && "⚠️ "}
                        Create {previewResources.length} Resource
                        {previewResources.length > 1 ? "s" : ""}
                        {newOrganizations.length > 0 &&
                          ` & ${newOrganizations.length} Organization${
                            newOrganizations.length > 1 ? "s" : ""
                          }`}
                        {duplicateWarnings.length > 0 && " (Check Duplicates)"}
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

export default ResourceAICreate;
