"use client";

import { useState, useMemo } from "react";
import Modal from "../Modal";
import SearchableDropdown from "../inputs/SearchableDropdown";
import {
  useTenantUsers,
  useAddUserToTenant,
  useRemoveUserFromTenant,
  useUpdateUserRolesInTenant,
} from "../../hooks/useAdminTenants";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "../../api/usersApi";
import { useContextAuth } from "../../context/authContext";
import toast from "react-hot-toast";

const validRoles = [
  { id: "patient", name: "Patient", description: "Patient or survivor" },
  {
    id: "caregiver",
    name: "Caregiver",
    description: "Family member or caregiver",
  },
  {
    id: "researcher",
    name: "Researcher",
    description: "Research professional",
  },
  { id: "advocate", name: "Advocate", description: "Patient advocate" },
  { id: "admin", name: "Admin", description: "Administrator" },
  { id: "personal", name: "Personal", description: "Personal account" },
];

export default function ManageTenantUsersModal({
  isOpen,
  onClose,
  tenant,
  onSuccess,
  onInviteUser,
}) {
  const [selectedUserOption, setSelectedUserOption] = useState(null);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { getAuthHeader, systemUser } = useContextAuth();
  const canAddExistingUsers = Boolean(systemUser?.isSuperuser);

  const { data: tenantUsers = [], isLoading: isLoadingTenantUsers } =
    useTenantUsers(tenant?.id);

  // Fetch all users for the dropdown
  const { data: allUsers = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["allUsersForTenant", tenant?.id],
    queryFn: async () => {
      const headers = await getAuthHeader();
      return await fetchUsers(headers, true);
    },
    enabled: !!systemUser && isOpen && canAddExistingUsers,
  });

  const { mutate: addUser, isPending: isAdding } = useAddUserToTenant();
  const { mutate: removeUser, isPending: isRemoving } =
    useRemoveUserFromTenant();
  const { mutate: updateRoles, isPending: isUpdatingRoles } =
    useUpdateUserRolesInTenant();

  // Filter out users already in tenant
  const availableUsers = useMemo(() => {
    const tenantUserIds = new Set(tenantUsers.map((u) => u.id));
    return allUsers.filter((u) => !tenantUserIds.has(u.id));
  }, [allUsers, tenantUsers]);

  const availableUserOptions = useMemo(
    () =>
      availableUsers.map((user) => {
        const fullName = [user.firstName, user.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();

        return {
          ...user,
          name: fullName ? `${user.email} (${fullName})` : user.email,
        };
      }),
    [availableUsers]
  );

  // Filter users by search term
  const filteredTenantUsers = useMemo(() => {
    if (!searchTerm) return tenantUsers;
    const term = searchTerm.toLowerCase();
    return tenantUsers.filter(
      (u) =>
        u.email?.toLowerCase().includes(term) ||
        u.firstName?.toLowerCase().includes(term) ||
        u.lastName?.toLowerCase().includes(term)
    );
  }, [tenantUsers, searchTerm]);

  const handleAddUser = () => {
    if (!selectedUserOption?.id) {
      toast.error("Please select a user");
      return;
    }

    addUser(
      {
        tenantId: tenant.id,
        userId: selectedUserOption.id,
        roles: selectedRoles,
      },
      {
        onSuccess: () => {
          setSelectedUserOption(null);
          setSelectedRoles([]);
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  const handleRemoveUser = (userId) => {
    if (
      !confirm(
        "Are you sure you want to remove this user from the tenant? This will also remove all their roles in this tenant."
      )
    ) {
      return;
    }

    removeUser(
      {
        tenantId: tenant.id,
        userId,
      },
      {
        onSuccess: () => {
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  const handleEditRoles = (user) => {
    setEditingUser(user);
    setSelectedRoles(user.roles?.map((r) => r.value || r.name) || []);
  };

  const handleSaveRoles = () => {
    if (!editingUser) return;

    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }

    updateRoles(
      {
        tenantId: tenant.id,
        userId: editingUser.id,
        roles: selectedRoles,
      },
      {
        onSuccess: () => {
          setEditingUser(null);
          setSelectedRoles([]);
          if (onSuccess) onSuccess();
        },
      }
    );
  };

  const handleRoleToggle = (roleId) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleId)) {
        return prev.filter((r) => r !== roleId);
      } else {
        return [...prev, roleId];
      }
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="relative bg-white rounded-lg mx-auto w-full max-w-4xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Manage Users: {tenant?.name}
        </h2>
        <p className="text-gray-600 mb-6">
          Add users to this tenant and assign their roles
        </p>

        {/* Add User Section */}
        <div className="border-b pb-6 mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Add Existing User
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                {canAddExistingUsers
                  ? "Search for someone who already has a Contexlia account and add them directly to this tenant."
                  : "Only superusers can search all Contexlia users and add them across tenants."}
              </p>
            </div>
            {onInviteUser && (
              <button
                onClick={onInviteUser}
                className="px-4 py-2 bg-white text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50"
              >
                Invite New User
              </button>
            )}
          </div>
          {canAddExistingUsers ? (
            <div className="space-y-4">
              <div>
                <SearchableDropdown
                  label="Select User"
                  options={availableUserOptions}
                  value={selectedUserOption}
                  onChange={setSelectedUserOption}
                  placeholder={
                    isLoadingUsers ? "Loading users..." : "Search by email or name..."
                  }
                  disabled={isAdding || isLoadingUsers}
                  sortBy="name"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Only superusers can search users across all tenants here.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Roles
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {validRoles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-center space-x-2 cursor-pointer p-2 rounded border border-gray-200 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.id)}
                        onChange={() => handleRoleToggle(role.id)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700">
                          {role.name}
                        </span>
                        <p className="text-xs text-gray-500">
                          {role.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddUser}
                disabled={!selectedUserOption?.id || isAdding}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAdding ? "Adding..." : "Add User"}
              </button>

              {onInviteUser && (
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm text-blue-900">
                    Need to add someone who does not have an account yet? Use{" "}
                    <span className="font-semibold">Invite New User</span> to
                    generate a tenant join link with a starter role. After they
                    join, you can come back here and edit their tenant roles.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Tenant Users List */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Users in Tenant ({tenantUsers.length})
            </h3>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {isLoadingTenantUsers ? (
            <div className="text-center py-8 text-gray-500">
              Loading users...
            </div>
          ) : filteredTenantUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "No users found" : "No users in this tenant"}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTenantUsers.map((user) => (
                <div
                  key={user.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  {editingUser?.id === user.id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {user.email}
                          {user.firstName &&
                            ` (${user.firstName} ${user.lastName || ""})`}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Roles
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {validRoles.map((role) => (
                            <label
                              key={role.id}
                              className="flex items-center space-x-2 cursor-pointer p-2 rounded border border-gray-200 hover:bg-gray-50"
                            >
                              <input
                                type="checkbox"
                                checked={selectedRoles.includes(role.id)}
                                onChange={() => handleRoleToggle(role.id)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">
                                {role.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveRoles}
                          disabled={
                            isUpdatingRoles || selectedRoles.length === 0
                          }
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          {isUpdatingRoles ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={() => {
                            setEditingUser(null);
                            setSelectedRoles([]);
                          }}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {user.email}
                          {user.firstName &&
                            ` (${user.firstName} ${user.lastName || ""})`}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {user.roles && user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <span
                                key={role.id || role.value}
                                className="inline-block bg-blue-100 text-blue-800 py-1 px-2 rounded-full text-xs"
                              >
                                {role.value || role.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">
                              No roles assigned
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditRoles(user)}
                          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Edit Roles
                        </button>
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          disabled={isRemoving}
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end mt-6 pt-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
