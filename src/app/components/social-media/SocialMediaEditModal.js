"use client";

import React, { useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { useForm, Controller } from "react-hook-form";
import SelectField from "../inputs/SelectField";
import { 
  useSocialMediaPlatforms,
  useSocialMediaAccountTypes,
  useUpdateSocialMediaAccount
} from "../../hooks/useSocialMedia";
import toast from "react-hot-toast";

const SocialMediaEditModal = ({ 
  isOpen, 
  onClose, 
  account = null,
  onSuccess = () => {}
}) => {
  const { data: platforms = [] } = useSocialMediaPlatforms();
  const { data: accountTypes = [] } = useSocialMediaAccountTypes();
  const updateAccount = useUpdateSocialMediaAccount();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      name: "",
      handle: "",
      url: "",
      description: "",
      platformId: null,
      accountTypeId: null,
      visibility: { id: "private", name: "Private" }
    }
  });

  // Reset form when account changes
  useEffect(() => {
    if (account && isOpen) {
      const platform = platforms.find(p => p.id === account.platformId);
      const accountType = accountTypes.find(t => t.id === account.accountTypeId);
      
      reset({
        name: account.name || "",
        handle: account.handle || "",
        url: account.url || "",
        description: account.description || "",
        platformId: platform || null,
        accountTypeId: accountType || null,
        visibility: account.visibility === "public" 
          ? { id: "public", name: "Public" }
          : { id: "private", name: "Private" }
      });
    }
  }, [account, isOpen, platforms, accountTypes, reset]);

  const onSubmit = async (data) => {
    try {
      const apiData = {
        name: data.name,
        handle: data.handle,
        url: data.url,
        description: data.description,
        platformId: data.platformId?.id || account.platformId,
        accountTypeId: data.accountTypeId?.id || account.accountTypeId,
        visibility: data.visibility?.id || "private"
      };

      await updateAccount.mutateAsync({
        id: account.id,
        accountData: apiData
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating account:", error);
    }
  };

  const visibilityOptions = [
    { id: "private", name: "Private" },
    { id: "public", name: "Public" }
  ];

  if (!isOpen || !account) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div 
            className="relative bg-white rounded-lg shadow-xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Edit Social Media Account
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <FaTimes className="text-gray-500" />
              </button>
            </div>
            
            {/* Content */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              {/* Platform */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform
                </label>
                <Controller
                  name="platformId"
                  control={control}
                  rules={{ required: "Platform is required" }}
                  render={({ field }) => (
                    <SelectField
                      {...field}
                      options={platforms}
                      placeholder="Select platform"
                      isDisabled={true} // Platform cannot be changed
                    />
                  )}
                />
                {errors.platformId && (
                  <p className="mt-1 text-sm text-red-600">{errors.platformId.message}</p>
                )}
              </div>

              {/* Account Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <Controller
                  name="accountTypeId"
                  control={control}
                  rules={{ required: "Account type is required" }}
                  render={({ field }) => (
                    <SelectField
                      {...field}
                      options={accountTypes}
                      placeholder="Select account type"
                    />
                  )}
                />
                {errors.accountTypeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.accountTypeId.message}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: "Name is required" }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Account name"
                    />
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              {/* Handle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Handle
                </label>
                <Controller
                  name="handle"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="@handle"
                    />
                  )}
                />
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <Controller
                  name="url"
                  control={control}
                  rules={{ 
                    required: "URL is required",
                    pattern: {
                      value: /^https?:\/\//,
                      message: "URL must start with http:// or https://"
                    }
                  }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="url"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://..."
                    />
                  )}
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Brief description..."
                    />
                  )}
                />
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility
                </label>
                <Controller
                  name="visibility"
                  control={control}
                  render={({ field }) => (
                    <SelectField
                      {...field}
                      options={visibilityOptions}
                      placeholder="Select visibility"
                    />
                  )}
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || updateAccount.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting || updateAccount.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default SocialMediaEditModal;