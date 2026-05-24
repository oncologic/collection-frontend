"use client";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import InputField from "../inputs/InputField";

import { useEffect, useState, useMemo } from "react";

import MultiSelect from "../inputs/MultiSelect";
import Image from "next/image";
import { useContextAuth } from "@/app/context/authContext";
import SelectField from "../inputs/SelectField";
import ImageUpload from "../inputs/ImageUploadCrop";
import LocationComponent from "../inputs/LocationComponent";

export const defaultBusinessUnitValues = {
  name: "",
  acronym: "",
  logo: null,
  imageUrl: null,
  description: "",
  website: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  postal: "",
  country: "",
  category: "",
  primaryContactName: "",
  primaryContactEmail: "",
  primaryContactPhone: "",
  tags: [],
  professional: false,
  industry: false,
};

export default function AddBusinessUnitForm({
  onSubmit,
  initialValues = defaultBusinessUnitValues,
  isLoading = false,
  tags,
  onClose,
}) {
  const [selectedTags, setSelectedTags] = useState(initialValues.tags || []);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [updatedImage, setUpdatedImage] = useState(false);
  const { selectedTenants, isAdmin, isAdvocate } = useContextAuth();

  // Filter tenants to only show those where user can create business units
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

  const [selectedTenant, setSelectedTenant] = useState(
    initialValues.tenantId
      ? availableTenantsForCreation?.find(
          (t) => t.id === initialValues.tenantId
        )
      : availableTenantsForCreation?.[0] || null
  );

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ...initialValues,
      tags: initialValues.tags || [],
      logo: initialValues.imageUrl || null,
      tenantId: initialValues.tenantId || selectedTenant?.id || "",
    },
  });

  useEffect(() => {
    register("logo");
  }, [register]);

  const handleTagsChange = (selected) => {
    setSelectedTags(selected);
    setValue(
      "tags",
      selected.filter((tag) => tag && tag.id).map((tag) => tag.id)
    );
  };

  const onSubmitWrapper = async (data) => {
    // Validate tenant selection
    if (!selectedTenant?.id) {
      toast.error("Please select an ownership tenant for this business unit");
      return;
    }

    const formData = new FormData();

    // Add tenantId to the form data
    const processedData = {
      ...data,
      tenantId: selectedTenant.id,
      tags: Array.isArray(data.tags)
        ? data.tags
            .map((tag) => (typeof tag === "object" ? tag.id : tag))
            .filter(Boolean)
        : [],
    };

    // Append processed data to FormData
    for (const key in processedData) {
      formData.append(key, processedData[key]);
    }

    //remove created and updated at
    formData.delete("createdAt");
    formData.delete("updatedAt");
    onSubmit(formData);
  };

  const onImageSelected = (file) => {
    setUploadedImage(file);
    setValue("logo", file);
    setUpdatedImage(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-1/2 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 md:w-5/6 w-full">
          <div className="w-3/4 h-8 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="w-full h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="w-5/6 h-4 bg-gray-200 rounded mb-4 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4 rounded-lg">
      <form
        onSubmit={handleSubmit(onSubmitWrapper)}
        className="text-gray-700 text-center md:text-left w-full mx-auto"
        encType="multipart/form-data"
      >
        <h1 className="md:text-4xl text-2xl font-bold text-center text-gray-700 mb-8">
          Business Unit Information
        </h1>

        <div className="flex flex-col space-y-6">
          {/* Always show tenant selection when available tenants > 1 */}
          {availableTenantsForCreation?.length > 1 && (
            <div>
              <SelectField
                name="tenantId"
                control={control}
                label="Select Tenant"
                options={availableTenantsForCreation}
                placeholder="Select a tenant"
                value={selectedTenant}
                onChange={(tenant) => {
                  setSelectedTenant(tenant);
                  setValue("tenantId", tenant.id);
                }}
                required={true}
              />
              {availableTenantsForCreation.length < selectedTenants.length && (
                <p className="mt-1 text-xs text-amber-600">
                  Some tenants require admin/advocate permissions to create
                  business units
                </p>
              )}
            </div>
          )}

          {/* Show readonly tenant if only one available or editing */}
          {(availableTenantsForCreation?.length === 1 ||
            (initialValues.tenantId && selectedTenant)) && (
            <div className="flex flex-col space-y-2">
              <label className="text-lg font-semibold text-gray-700">
                Tenant
              </label>
              <div className="px-3 py-2 border rounded-lg bg-gray-50 text-gray-700 capitalize">
                {selectedTenant?.name || "No tenant selected"}
              </div>
            </div>
          )}

          {/* Update logo upload section */}
          <div className="flex flex-col space-y-2">
            {uploadedImage || initialValues.logoUrl ? (
              <div className="w-48 h-48 mx-auto mb-4">
                <Image
                  width={192}
                  height={192}
                  src={
                    uploadedImage
                      ? URL.createObjectURL(uploadedImage)
                      : initialValues.imageUrl
                  }
                  alt="Business Unit logo"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <div className="w-48 h-48 mx-auto bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="w-16 h-16 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  ></path>
                </svg>
              </div>
            )}
            {!updatedImage && <ImageUpload onImageSelected={onImageSelected} />}
          </div>
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              id="name"
              name="name"
              label="Business Unit Name"
              required={true}
              placeholder="Enter business unit name"
              register={register}
            />
            <InputField
              id="acronym"
              name="acronym"
              label="Acronym"
              required={false}
              placeholder="Enter acronym"
              register={register}
            />
          </div>

          <InputField
            id="description"
            name="description"
            label="Description"
            required={false}
            placeholder="Enter business unit description"
            register={register}
            type="textarea"
          />

          {/* Tags Selection */}
          <div className="flex flex-col space-y-2">
            <label className="text-lg font-semibold text-gray-700">Tags</label>
            <MultiSelect
              id="tags"
              name="tags"
              label="Tags"
              required={false}
              placeholder="Enter business unit tags"
              options={tags}
              value={selectedTags}
              onChange={handleTagsChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              id="website"
              name="website"
              label="Website"
              required={false}
              placeholder="Enter website URL"
              register={register}
            />
            <InputField
              id="category"
              name="category"
              label="Category"
              required={false}
              placeholder="Enter business unit category"
              register={register}
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              id="email"
              name="email"
              label="Email"
              type="email"
              required={false}
              placeholder="Enter business unit email"
              register={register}
            />
            <InputField
              id="phone"
              name="phone"
              label="Phone"
              required={false}
              placeholder="Enter business unit phone"
              register={register}
            />
          </div>

          <LocationComponent
            control={control}
            register={register}
            errors={errors}
            setValue={setValue}
            defaultValues={{
              country: initialValues.country,
              state: initialValues.state,
              city: initialValues.city,
              postal: initialValues.postal,
              address: initialValues.address,
            }}
            required={false}
          />

          {/* Primary Contact */}
          <h2 className="text-xl font-semibold mt-6">Primary Contact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              id="primaryContactName"
              name="primaryContactName"
              label="Contact Name"
              required={false}
              placeholder="Enter contact name"
              register={register}
            />
            <InputField
              id="primaryContactEmail"
              name="primaryContactEmail"
              label="Contact Email"
              type="email"
              required={false}
              placeholder="Enter contact email"
              register={register}
            />
            <InputField
              id="primaryContactPhone"
              name="primaryContactPhone"
              label="Contact Phone"
              required={false}
              placeholder="Enter contact phone"
              register={register}
            />
          </div>
          <h2 className="text-xl font-semibold ">Business Unit Type</h2>
          <div className="flex flex-col md:flex-row md:space-y-0 md:space-x-2 items-center">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="professional"
                {...register("professional")}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="professional" className="text-gray-700">
                Professional Business Unit
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="industry"
                {...register("industry")}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="industry" className="text-gray-700">
                Industry Business Unit
              </label>
            </div>
          </div>

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
              className="px-6 py-2 bg-[#4263EB] hover:bg-[#3b5bd9] text-white text-lg font-medium rounded-lg flex items-center gap-2 transition-colors duration-200"
            >
              Submit
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
