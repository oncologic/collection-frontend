"use client";

import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import Modal from "../Modal";
import { updateUserRolesForTenant } from "../../api/usersApi";
import { useContextAuth } from "../../context/authContext";
import toast from "react-hot-toast";

const validRoles = [
  { id: "patient", name: "Patient", description: "Patient or survivor" },
  { id: "caregiver", name: "Caregiver", description: "Family member or caregiver" },
  { id: "researcher", name: "Researcher", description: "Research professional" },
  { id: "advocate", name: "Advocate", description: "Patient advocate" },
  { id: "admin", name: "Admin", description: "Administrator" },
  { id: "personal", name: "Personal", description: "Personal account" },
];

export default function EditUserTenantRolesModal({
  isOpen,
  onClose,
  user,
  tenant,
  onSuccess,
}) {
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getAuthHeader, isAdmin, isAdvocate, advocateTenants, systemUser } = useContextAuth();

  useEffect(() => {
    if (user && tenant) {
      // Find the user's current roles in this tenant
      const userTenant = user.tenants?.find((t) => t.id === tenant.id);
      if (userTenant?.roles) {
        setSelectedRoles(userTenant.roles);
      } else {
        setSelectedRoles([]);
      }
    }
  }, [user, tenant]);

  const handleRoleToggle = (roleId) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((r) => r !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  const canEditRoles = () => {
    // Check if user has admin role in Clerk metadata (global admin)
    if (isAdmin) return true;
    
    // Check if user is admin or advocate in this specific tenant
    const userTenant = systemUser?.tenants?.find((t) => t.id === tenant?.id);
    if (userTenant?.roles?.includes("admin") || userTenant?.roles?.includes("advocate")) {
      return true;
    }
    
    // Also check advocateTenants array
    const isAdvocateInTenant = advocateTenants?.some(t => t.tenantId === tenant?.id);
    if (isAdvocateInTenant) return true;
    
    return false;
  };

  const handleSubmit = async () => {
    if (!canEditRoles()) {
      toast.error("You don't have permission to edit roles in this tenant");
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = await getAuthHeader();
      await updateUserRolesForTenant(
        user.id,
        tenant.id,
        selectedRoles,
        headers
      );
      toast.success("User roles updated successfully");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating user roles:", error);
      toast.error(error.message || "Failed to update user roles");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canEditRoles()) {
    return (
      <Modal open={isOpen} onClose={onClose}>
        <div className="relative bg-white rounded-lg mx-auto w-full max-w-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don&apos;t have permission to edit user roles in this tenant.
            You must be an admin or advocate to make these changes.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={isOpen} onClose={onClose}>
      <div className="relative bg-white rounded-lg mx-auto w-full max-w-2xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Edit User Roles
        </h2>
        <p className="text-gray-600 mb-6">
          Managing roles for <span className="font-semibold">{user?.email}</span> in{" "}
          <span className="font-semibold">{tenant?.name}</span>
        </p>

        <div className="space-y-3 mb-6">
          {validRoles.map((role) => (
            <div
              key={role.id}
              className={`
                relative p-4 rounded-lg border-2 transition-all cursor-pointer
                ${
                  selectedRoles.includes(role.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }
              `}
              onClick={() => handleRoleToggle(role.id)}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(role.id)}
                  onChange={() => {}}
                  className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <h4 className="text-lg font-medium text-gray-900">
                    {role.name}
                  </h4>
                  <p className="text-sm text-gray-600">{role.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || selectedRoles.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Modal>
  );
}