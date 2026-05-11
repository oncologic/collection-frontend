"use client";

import { useState, useEffect } from "react";
import Modal from "../Modal";
import { useCreateTenant, useUpdateTenant } from "../../hooks/useAdminTenants";

const validAccessTypes = [
  { value: "private", label: "Private" },
  { value: "public", label: "Public" },
];

export default function CreateTenantModal({
  isOpen,
  onClose,
  tenant = null, // If provided, we're editing
  onSuccess,
}) {
  const [formData, setFormData] = useState({
    name: "",
    domain: "",
    access: "private",
    settings: {
      publicAccess: {
        resources: false,
        events: false,
      },
    },
  });

  const [errors, setErrors] = useState({});

  const { mutate: createTenant, isPending: isCreating } = useCreateTenant();
  const { mutate: updateTenant, isPending: isUpdating } = useUpdateTenant();

  const isEditing = !!tenant;
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name || "",
        domain: tenant.domain || "",
        access: tenant.access || "private",
        settings: tenant.settings || {
          publicAccess: {
            resources: false,
            events: false,
          },
        },
      });
    } else {
      // Reset form for new tenant
      setFormData({
        name: "",
        domain: "",
        access: "private",
        settings: {
          publicAccess: {
            resources: false,
            events: false,
          },
        },
      });
    }
    setErrors({});
  }, [tenant, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("settings.")) {
      const path = name.split(".");
      setFormData((prev) => {
        const newSettings = { ...prev.settings };
        if (path[1] === "publicAccess") {
          newSettings.publicAccess = {
            ...newSettings.publicAccess,
            [path[2]]: checked,
          };
        } else {
          newSettings[path[1]] = value;
        }
        return {
          ...prev,
          settings: newSettings,
        };
      });
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const submitData = {
      name: formData.name.trim(),
      domain: formData.domain.trim() || null,
      access: formData.access,
      settings: formData.settings,
    };

    if (isEditing) {
      updateTenant(
        { id: tenant.id, tenantData: submitData },
        {
          onSuccess: () => {
            if (onSuccess) onSuccess();
            onClose();
          },
        }
      );
    } else {
      createTenant(submitData, {
        onSuccess: () => {
          if (onSuccess) onSuccess();
          onClose();
        },
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative bg-white rounded-lg mx-auto w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {isEditing ? "Edit Tenant" : "Create New Tenant"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter tenant name"
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Domain */}
          <div>
            <label
              htmlFor="domain"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Domain
            </label>
            <input
              type="text"
              id="domain"
              name="domain"
              value={formData.domain}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example.com (optional)"
            />
          </div>

          {/* Access Type */}
          <div>
            <label
              htmlFor="access"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Access Type
            </label>
            <select
              id="access"
              name="access"
              value={formData.access}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {validAccessTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Public tenants allow unauthenticated access to resources/events
              (if enabled below)
            </p>
          </div>

          {/* Public Access Settings */}
          {formData.access === "public" && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Public Access Settings
              </h3>

              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="settings.publicAccess.resources"
                    checked={formData.settings.publicAccess.resources}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Allow Public Access to Resources
                    </span>
                    <p className="text-xs text-gray-500">
                      Unauthenticated users can view resources from this tenant
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="settings.publicAccess.events"
                    checked={formData.settings.publicAccess.events}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Allow Public Access to Events
                    </span>
                    <p className="text-xs text-gray-500">
                      Unauthenticated users can view events from this tenant
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                ? "Update Tenant"
                : "Create Tenant"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
