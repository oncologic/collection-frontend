"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { usePublicTenants } from "../../hooks/usePublicTenants";
import SelectField from "../inputs/SelectField";

export default function SuggestResourceForm({ onClose, onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { tenants: publicTenants, isLoading: tenantsLoading } =
    usePublicTenants("resources");
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleFormSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      // Extract tenantId from the selected tenant object
      const submitData = {
        ...data,
        tenantId: data.tenantId?.id || data.tenantId,
      };
      await onSubmit(submitData);
      toast.success(
        "Thank you! Your resource suggestion has been submitted and will be reviewed by an administrator."
      );
      onClose();
    } catch (error) {
      toast.error(
        error.message ||
          "Failed to submit resource suggestion. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 md:p-8  w-full mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Suggest a Resource
      </h2>
      <p className="text-gray-600 mb-6">
        Help us grow our resource library! Submit a resource suggestion below.
        All submissions will be reviewed by our team before being published.
      </p>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div>
          <Controller
            name="tenantId"
            control={control}
            rules={{ required: "Please select a tenant" }}
            render={({ field }) => (
              <SelectField
                label={
                  <>
                    Select Tenant <span className="text-red-500">*</span>
                  </>
                }
                options={publicTenants.filter((tenant) => tenant.domain)}
                placeholder={
                  tenantsLoading
                    ? "Loading tenants..."
                    : publicTenants.length === 0
                    ? "No tenants available"
                    : "Select a tenant"
                }
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.tenantId && (
            <p className="mt-1 text-sm text-red-600">
              {errors.tenantId.message}
            </p>
          )}
          {publicTenants.length === 0 && !tenantsLoading && (
            <p className="mt-1 text-xs text-gray-500">
              No tenants are currently accepting resource suggestions.
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Resource Name / Title <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            type="text"
            {...register("name", {
              required: "Resource name is required",
              minLength: {
                value: 3,
                message: "Resource name must be at least 3 characters",
              },
              maxLength: {
                value: 200,
                message: "Resource name must be less than 200 characters",
              },
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter the resource name or title"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="url"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Resource Link / URL <span className="text-red-500">*</span>
          </label>
          <input
            id="url"
            type="url"
            {...register("url", {
              required: "Resource URL is required",
              pattern: {
                value:
                  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
                message:
                  "Please enter a valid URL (must start with http:// or https://)",
              },
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://example.com/resource"
          />
          {errors.url && (
            <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Your Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            type="email"
            {...register("email", {
              required: "Email address is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Please enter a valid email address",
              },
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="your.email@example.com"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            We&apos;ll use this to contact you about your suggestion if needed.
          </p>
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
            <span className="text-gray-500 text-xs ml-1">(optional)</span>
          </label>
          <textarea
            id="description"
            {...register("description", {
              maxLength: {
                value: 1000,
                message: "Description must be less than 1000 characters",
              },
            })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Provide a brief description of the resource..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : "Submit Suggestion"}
          </button>
        </div>
      </form>
    </div>
  );
}
