"use client";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import Image from "next/image";
import InputField from "../inputs/InputField";
import ImageUploadCrop from "../inputs/ImageUploadCrop";
import MultiSelect from "../inputs/MultiSelect";
import SelectField from "../inputs/SelectField";
import SearchableSelectFieldWithCreate from "../inputs/SearchableSelectFieldWithCreate";
import MultiSelectWithCreate from "../inputs/MultiSelectWithCreate";
import CustomEditor from "../common/CustomEditor";
import { useContextAuth } from "@/app/context/authContext";
import { useMemo } from "react";
import { useCreateOrganization } from "@/app/hooks/useOrganizations";
import { useCreateTag, useCreateResourceType } from "@/app/hooks/useMetadata";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export const defaultResourceValues = {
  typeId: "",
  url: "",
  description: "",
  createdDate: new Date().toISOString().split("T")[0],
  resourceDate: new Date().toISOString().split("T")[0],
  resourceUpdatedDate: new Date().toISOString().split("T")[0],
  sensitivityLevelId: "",
  expertiseLevelId: "",
  targetAudienceId: "",
  videoUrl: "",
  imageKey: null,
  tags: [],
  name: "",
  organizations: [],
  timestamps: "",
  fullText: "",
  tenantId: "",
};

export default function AddResourceForm({
  organizations,
  onSubmit,
  onClose,
  initialValues = defaultResourceValues,
  isLoading = false,
  resourceTypes = [],
  resourceDate = new Date().toISOString().split("T")[0],
  resourceUpdatedDate = new Date().toISOString().split("T")[0],
  sensitivityLevels = [],
  expertiseLevels = [],
  targetAudiences = [],
  tags = [],
  advocateTenants = [],
  adminTenants = [],
  isAdmin: isGlobalAdmin = false,
}) {
  const [selectedTags, setSelectedTags] = useState([]);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [activeTab, setActiveTab] = useState("basic");
  const { selectedTenants } = useContextAuth();
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [tenantSelected, setTenantSelected] = useState(false);
  const [showQuickCreateOrg, setShowQuickCreateOrg] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgWebsite, setNewOrgWebsite] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createOrganization = useCreateOrganization();
  const createTagMutation = useCreateTag();
  const createResourceTypeMutation = useCreateResourceType();
  const queryClient = useQueryClient();

  // Get available tenants (where user is advocate or admin)
  const availableTenants = useMemo(() => {
    const tenantSet = new Map();

    // Add admin tenants
    adminTenants?.forEach((t) => {
      tenantSet.set(t.tenantId, {
        id: t.tenantId,
        name: t.tenantName,
        role: "admin",
      });
    });

    // Add advocate tenants
    advocateTenants?.forEach((t) => {
      if (!tenantSet.has(t.tenantId)) {
        tenantSet.set(t.tenantId, {
          id: t.tenantId,
          name: t.tenantName,
          role: "advocate",
        });
      }
    });

    // If global admin, add all selected tenants
    if (isGlobalAdmin && selectedTenants) {
      selectedTenants.forEach((t) => {
        if (!tenantSet.has(t.id)) {
          tenantSet.set(t.id, {
            id: t.id,
            name: t.name,
            role: "admin",
          });
        }
      });
    }

    return Array.from(tenantSet.values());
  }, [advocateTenants, adminTenants, isGlobalAdmin, selectedTenants]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ...initialValues,
      tenantId: initialValues.tenantId || selectedTenant?.id || "",
    },
  });

  // Watch description to keep it in sync with form state
  const descriptionValue = watch("description");
  const selectedTypeValue = watch("typeId");

  useEffect(() => {
    register("imageKey");
    // Register organizations (optional, no validation required)
    register("organizations");
    // Register tags field
    register("tags");
    // Register description field for the editor
    register("description");
  }, [register]);

  // Reset submitting state when modal closes or initial values change
  useEffect(() => {
    if (!isLoading) {
      setIsSubmitting(false);
    }
  }, [isLoading, initialValues]);

  // Initialize tenant if editing
  useEffect(() => {
    if (initialValues.tenantId && availableTenants.length > 0) {
      const tenant = availableTenants.find(
        (t) => t.id === initialValues.tenantId
      );
      if (tenant) {
        setSelectedTenant(tenant);
        setTenantSelected(true);
        setValue("tenantId", tenant.id);
      }
    }
    // Don't auto-select - always show tenant selection screen first
  }, [initialValues.tenantId, availableTenants, setValue]);

  const filteredResourceTypes = useMemo(() => {
    if (!selectedTenant?.id) {
      return resourceTypes;
    }

    return (resourceTypes || []).filter(
      (resourceType) =>
        !resourceType.tenantId || resourceType.tenantId === selectedTenant.id
    );
  }, [resourceTypes, selectedTenant]);

  const filteredTags = useMemo(() => {
    if (!selectedTenant?.id) {
      return [];
    }

    return (tags || []).filter((tag) => tag.tenantId === selectedTenant.id);
  }, [tags, selectedTenant]);

  useEffect(() => {
    if (!selectedTenant?.id) {
      return;
    }

    const nextSelectedTags = selectedTags.filter(
      (tag) => tag.tenantId === selectedTenant.id
    );

    if (nextSelectedTags.length !== selectedTags.length) {
      setSelectedTags(nextSelectedTags);
      setValue(
        "tags",
        nextSelectedTags.map((tag) => tag.id)
      );
    }

    if (
      selectedTypeValue &&
      selectedTypeValue.tenantId &&
      selectedTypeValue.tenantId !== selectedTenant.id
    ) {
      setValue("typeId", null);
    }
  }, [selectedTenant, selectedTags, selectedTypeValue, setValue]);

  const handleTagsChange = (selected) => {
    setSelectedTags(selected);
    setValue(
      "tags",
      selected.map((tag) => tag.id)
    );
  };

  const handleOrganizationsChange = (selected) => {
    setSelectedOrganizations(selected);
    setValue(
      "organizations",
      selected.map((org) => org.id)
    );
  };

  const handleCreateTag = async (tagData) => {
    if (!selectedTenant?.id) {
      toast.error("Please select a tenant first");
      return;
    }

    try {
      const newTag = await createTagMutation.mutateAsync({
        name: tagData.name,
        color: tagData.color,
        description: `Tag for ${selectedTenant.name}`,
        tenantId: selectedTenant.id,
        visibility: tagData.visibility || "tenant",
      });

      if (newTag?.id) {
        const updatedTags = [...selectedTags, newTag];
        setSelectedTags(updatedTags);
        setValue(
          "tags",
          updatedTags.map((tag) => tag.id)
        );
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const handleCreateResourceType = async (data) => {
    if (!selectedTenant?.id) {
      toast.error("Please select a tenant first");
      return;
    }

    try {
      const resourceTypeData =
        typeof data === "string" ? { name: data, visibility: "tenant" } : data;

      const newResourceType = await createResourceTypeMutation.mutateAsync({
        name: resourceTypeData.name,
        description: `Resource type for ${selectedTenant.name}`,
        tenantId: selectedTenant.id,
        visibility: resourceTypeData.visibility || "tenant",
      });

      if (newResourceType?.id) {
        setValue("typeId", newResourceType);
      }
    } catch (error) {
      console.error("Error creating resource type:", error);
    }
  };

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

      const newOrg = await createOrganization.mutateAsync(formData);
      
      // Invalidate public organizations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["public-organizations"] });
      
      // Add the new organization to the selected list
      const orgToAdd = {
        id: newOrg.id,
        name: newOrg.name,
      };
      const updatedOrgs = [...selectedOrganizations, orgToAdd];
      setSelectedOrganizations(updatedOrgs);
      setValue("organizations", updatedOrgs.map((org) => org.id));

      // Reset form
      setNewOrgName("");
      setNewOrgWebsite("");
      setShowQuickCreateOrg(false);
      
      toast.success("Organization created and added to resource");
    } catch (error) {
      console.error("Error creating organization:", error);
      toast.error(error.message || "Failed to create organization");
    }
  };

  const handleImageSelected = (file) => {
    setUploadedImageFile(file);
    setUploadedImage(URL.createObjectURL(file));
  };

  const onSubmitWrapper = async (data) => {
    // Prevent multiple submissions
    if (isSubmitting || isLoading) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if we have an image to upload
      if (uploadedImageFile) {
        // Create FormData for multipart upload
        const formData = new FormData();
        formData.append("image", uploadedImageFile);

        // Prepare resource data as JSON (backend expects this in "resource" field)
        const resourceData = {
          name: data.name,
          description: data.description || "",
          url: data.url || "",
          videoUrl: data.videoUrl || "",
          resourceDate: data.resourceDate,
          resourceUpdatedDate: data.resourceUpdatedDate || data.resourceDate,
          typeId: data.typeId?.id || data.typeId || null, // Use null instead of empty string for integers
          sensitivityLevelId:
            data.sensitivityLevelId?.id || data.sensitivityLevelId || null,
          expertiseLevelId:
            data.expertiseLevelId?.id || data.expertiseLevelId || null,
          targetAudienceId: 1,
          tenantId: selectedTenant?.id || null,
          timestamps: data.timestamps || "",
          fullText: data.fullText || "",
          organizations: data.organizations || [],
          tags: data.tags || [],
        };

        // Add resource data as JSON string in "resource" field
        formData.append("resource", JSON.stringify(resourceData));

        await onSubmit(formData);
        // Success - isSubmitting will be reset when modal closes via useEffect
      } else {
        // No image, use regular JSON submission
        const transformedData = {
          ...data,
          sensitivityLevelId:
            data.sensitivityLevelId?.id || data.sensitivityLevelId || null,
          expertiseLevelId:
            data.expertiseLevelId?.id || data.expertiseLevelId || null,
          typeId: data.typeId?.id || data.typeId || null,
          targetAudienceId: 1,
          organizations: data.organizations || [],
          tenantId: selectedTenant?.id || null,
        };

        await onSubmit(transformedData);
        // Success - isSubmitting will be reset when modal closes via useEffect
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      alert("Error submitting form: " + error.message);
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    // Set initial values for tags
    if (initialValues.tags?.length > 0) {
      setSelectedTags(initialValues.tags);
      setValue(
        "tags",
        initialValues.tags.map((tag) => tag.id)
      );
    }

    // Set initial values for organizations
    if (initialValues.organizations?.length > 0) {
      setSelectedOrganizations(initialValues.organizations);
      setValue(
        "organizations",
        initialValues.organizations.map((org) => org.id)
      );
    }

    // Set initial values for select fields - modified to handle object format
    if (initialValues.resourceType) {
      setValue("typeId", initialValues.resourceType);
    }
    if (initialValues.sensitivityLevel) {
      setValue("sensitivityLevelId", initialValues.sensitivityLevel);
    }
    if (initialValues.expertiseLevel) {
      setValue("expertiseLevelId", initialValues.expertiseLevel);
    }
  }, [initialValues, setValue]);

  if (isLoading) {
    return (
      <div className="min-h-1/2 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 md:w-5/6 w-full">
          <div className="w-3/4 h-8 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="w-full h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Show tenant selection first if not selected yet
  if (
    !tenantSelected &&
    availableTenants.length > 0 &&
    !initialValues.tenantId
  ) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 w-full">
          <h2 className="text-2xl font-bold text-gray-700 mb-6">
            Select Tenant
          </h2>
          <p className="text-gray-600 mb-6">
            Choose the tenant where you want to create this resource:
          </p>
          <div className="space-y-3">
            {availableTenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => {
                  setSelectedTenant(tenant);
                  setTenantSelected(true);
                  setValue("tenantId", tenant.id);
                }}
                className="w-full p-4 text-left border-2 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <div className="font-semibold text-gray-800 capitalize">
                  {tenant.name}
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={onClose}
            className="mt-6 w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmitWrapper, (errors) => {
          // Show first error message as toast or alert
          const firstError = Object.values(errors)[0];
          if (firstError?.message) {
            alert(`Validation Error: ${firstError.message}`);
          }
        })}
        className="text-gray-700 text-center md:text-left w-full mx-auto bg-white rounded-lg p-8"
        encType="multipart/form-data"
      >
        <h1 className="md:text-4xl text-2xl font-bold text-center text-gray-700 mb-8">
          Resource Information
        </h1>

        {/* Show selected tenant */}
        {selectedTenant && (
          <div className="mb-4 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-blue-600">
                  Creating resource in:
                </span>
                <span className="text-sm font-semibold text-gray-800 capitalize">
                  {selectedTenant.name}
                </span>
              </div>
              {!initialValues.tenantId && (
                <button
                  type="button"
                  onClick={() => {
                    setTenantSelected(false);
                    setSelectedTenant(null);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Change Tenant
                </button>
              )}
            </div>
          </div>
        )}

        {/* Show readonly tenant if editing */}
        {initialValues.tenantId && selectedTenant && (
          <div className="flex flex-col space-y-2">
            <label className="text-lg font-semibold text-gray-700">
              Tenant
            </label>
            <div className="px-3 py-2 border rounded-lg bg-gray-50 text-gray-700 capitalize">
              {selectedTenant.name}
            </div>
          </div>
        )}

        {/* Add Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-8">
          <button
            type="button"
            className={`py-2 px-4 text-sm font-medium mr-2 focus:outline-none ${
              activeTab === "basic"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("basic")}
          >
            Basic Information
          </button>
          <button
            type="button"
            className={`py-2 px-4 text-sm font-medium mr-2 focus:outline-none ${
              activeTab === "advanced"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => setActiveTab("advanced")}
          >
            Timestamps & Full Text
          </button>
        </div>

        {activeTab === "basic" ? (
          <div className="flex flex-col space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Resource Date */}
              <div className="grid grid-cols-1 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="block font-medium text-gray-600 mb-1">
                    Resource Date
                  </label>
                  <div className="group relative">
                    <svg
                      className="w-4 h-4 text-gray-500 hover:text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="invisible group-hover:visible absolute left-0 w-72 p-2 mt-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg z-10">
                      Enter the date when the resource was originally created or
                      held.
                      <div className="mt-2">
                        Example, a webinar held on March 1st but added on June
                        1st, the resource date would be March 1st.
                      </div>
                    </div>
                  </div>
                </div>
                <input
                  type="date"
                  {...register("resourceDate", {
                    required: "Resource date is required",
                  })}
                  className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.resourceDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.resourceDate.message}
                  </p>
                )}
              </div>

              {/* Resource Updated Date */}
              <div className="grid grid-cols-1 space-y-2">
                <div className="flex items-center gap-2">
                  <label className="block font-medium text-gray-600 mb-1">
                    Resource Updated Date
                  </label>
                  <div className="group relative">
                    <svg
                      className="w-4 h-4 text-gray-500 hover:text-gray-700"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="invisible group-hover:visible absolute left-0 w-72 p-2 mt-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg z-10">
                      Enter the date when the resource was last externally
                      updated.
                      <div className="mt-2">
                        Example, if a guide was last revised by its author on
                        September 1st, that would be the resource updated date.
                      </div>
                    </div>
                  </div>
                </div>
                <input
                  type="date"
                  {...register("resourceUpdatedDate", { required: false })}
                  className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Basic Information */}

            <div className="grid grid-cols-1 space-y-2">
              <InputField
                id="name"
                name="name"
                label="Name"
                placeholder="Enter resource name"
                register={register}
                required={true}
                error={errors.name?.message}
              />
            </div>

            {/* Image Upload Section */}
            <div className="grid grid-cols-1 space-y-2">
              <label className="text-lg font-semibold text-gray-700">
                Resource Image
              </label>
              <div className="text-sm text-gray-600 mb-2">
                Upload an image that will be displayed as the thumbnail for this
                resource
              </div>
              <ImageUploadCrop onImageSelected={handleImageSelected} />
              {initialValues.imageUrl && !uploadedImage && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Current image:</p>
                  <div className="relative w-40 aspect-square">
                    <Image
                      src={initialValues.imageUrl}
                      alt="Current resource image"
                      width={160}
                      height={160}
                      className="object-cover rounded-lg"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Organizations Selection */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-lg font-semibold text-gray-700">
                  Organizations{" "}
                  <span className="text-sm font-normal text-gray-500">
                    (optional)
                  </span>
                </label>
                {!showQuickCreateOrg && (
                  <button
                    type="button"
                    onClick={() => setShowQuickCreateOrg(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    <span>Create New</span>
                  </button>
                )}
              </div>
              <MultiSelect
                id="organizations"
                name="organizations"
                label="Organizations"
                required={false}
                placeholder="Select organizations (optional)"
                options={organizations}
                value={selectedOrganizations}
                onChange={handleOrganizationsChange}
              />
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
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Organization Name <span className="text-red-500">*</span>
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
                        Website <span className="text-gray-500 text-xs">(optional)</span>
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
                        disabled={createOrganization.isPending || !newOrgName.trim()}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      >
                        {createOrganization.isPending ? "Creating..." : "Create & Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowQuickCreateOrg(false);
                          setNewOrgName("");
                          setNewOrgWebsite("");
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Tags Selection */}
            <div className="flex flex-col space-y-2">
              <label className="text-lg font-semibold text-gray-700">
                Tags
              </label>
              <MultiSelectWithCreate
                id="tags"
                name="tags"
                label="Tags"
                required={false}
                placeholder="Select resource tags"
                options={filteredTags}
                value={selectedTags}
                onChange={handleTagsChange}
                onCreate={selectedTenant ? handleCreateTag : null}
                createPlaceholder="Enter new tag name"
                isCreating={createTagMutation.isLoading}
                showVisibilityOptions={true}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col space-y-2">
                <SearchableSelectFieldWithCreate
                  id="typeId"
                  name="typeId"
                  label="Resource Type"
                  control={control}
                  options={filteredResourceTypes}
                  required={true}
                  onCreate={selectedTenant ? handleCreateResourceType : null}
                  createPlaceholder="Enter new resource type name"
                  isCreating={createResourceTypeMutation.isLoading}
                  placeholder="Search resource types..."
                  showVisibilityOptions={true}
                />
              </div>

              <SelectField
                id="sensitivityLevelId"
                name="sensitivityLevelId"
                label="Sensitivity Level"
                required={false}
                options={sensitivityLevels}
                control={control}
              />
              <SelectField
                id="expertiseLevelId"
                name="expertiseLevelId"
                label="Experience Level"
                required={false}
                options={expertiseLevels}
                control={control}
              />
            </div>

            {/* Resource Details */}
            <div className="grid grid-cols-1 gap-4">
              <div className="col-span-1 space-y-2">
                <InputField
                  id="url"
                  name="url"
                  label="Link"
                  required={true}
                  placeholder="Enter resource URL"
                  register={register}
                  error={errors.url?.message}
                />
              </div>

              {/* <div className="flex flex-col space-y-2">
                <SelectField
                  id="targetAudienceId"
                  name="targetAudienceId"
                  label="Target Audience"
                  required={true}
                  options={targetAudiences}
                  control={control}
                />
              </div> */}
            </div>

            {/* Media */}
            <div className="grid grid-cols-1gap-4">
              <InputField
                id="videoUrl"
                name="videoUrl"
                label="Video"
                required={false}
                placeholder="Enter video URL"
                register={register}
              />
            </div>

            <div className="grid grid-cols-1 space-y-2">
              <label className="text-lg font-semibold text-gray-700">
                Description
              </label>
              <div className="text-sm text-gray-600 overflow-hidden border border-gray-200 rounded-md p-2 h-[500px]">
                <CustomEditor
                  key="description-editor"
                  content={descriptionValue || initialValues.description || ""}
                  onChange={(content) => setValue("description", content)}
                  readOnly={false}
                  showBorder={true}
                  maxHeight="500px"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            <div className="grid grid-cols-1 space-y-2">
              <label className="text-lg font-semibold text-gray-700">
                Timestamps
              </label>

              <textarea
                {...register("timestamps")}
                className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                rows={4}
                placeholder="Enter timestamps (e.g., 0:00 Introduction, 1:30 Main Topic...)"
              />
            </div>

            <div className="grid grid-cols-1 space-y-2">
              <label className="text-lg font-semibold text-gray-700">
                Full Text
              </label>
              <textarea
                {...register("fullText")}
                className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                rows={8}
                placeholder="Enter the full text content of the resource..."
              />
            </div>
          </div>
        )}

        <div className="flex justify-end mt-8 gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 text-lg font-medium rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors duration-200"
          >
            Close
          </button>
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            onClick={() => {}}
            className="px-6 py-2 bg-[#4263EB] hover:bg-[#3b5bd9] text-white text-lg font-medium rounded-lg flex items-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
