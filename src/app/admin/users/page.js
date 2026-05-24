"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import DeleteConfirmationModal from "../../components/DeleteConfirmationModal";
import { useDeleteUser, useUpdateUser } from "@/app/hooks/useUsers";
import { fetchUsers } from "@/app/api/usersApi";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import MultiSelect from "@/app/components/inputs/MultiSelect";
import TenantSelect from "@/app/components/inputs/TenantSelect";

import { useContextAuth } from "@/app/context/authContext";
import { useAuth } from "@clerk/nextjs";
import EditUserModal from "@/app/components/modals/EditUserModal";
import EditUserTenantRolesModal from "@/app/components/modals/EditUserTenantRolesModal";
import ManageTenantUsersModal from "@/app/components/modals/ManageTenantUsersModal";
import TenantInviteModal from "@/app/components/modals/TenantInviteModal";
import { useCredits } from "@/app/hooks/useAI";
import { fetchTenantUsers, fetchTenants } from "@/app/api/tenantsApi";
import { useQuery } from "@tanstack/react-query";

export default function AdminUsersPage() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUserToDelete, setSelectedUserToDelete] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);
  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [selectedUserForCredits, setSelectedUserForCredits] = useState(null);
  const [creditMode, setCreditMode] = useState("set");
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDescription, setCreditDescription] = useState("");
  const [userBalance, setUserBalance] = useState(null);
  const [tenantRolesModalOpen, setTenantRolesModalOpen] = useState(false);
  const [selectedUserForTenantRoles, setSelectedUserForTenantRoles] =
    useState(null);
  const [selectedTenantForRoles, setSelectedTenantForRoles] = useState(null);
  const [selectedViewTenant, setSelectedViewTenant] = useState(null);
  const [manageTenantUsersModalOpen, setManageTenantUsersModalOpen] =
    useState(false);
  const [tenantInviteModalOpen, setTenantInviteModalOpen] = useState(false);

  const { register, setValue, control } = useForm({
    defaultValues: {
      userRoles: [],
    },
  });

  // Get auth functions and user data first
  const { getUserBalance, addCreditsToUserAccount, setUserCreditBalance } =
    useCredits();
  const { getAuthHeader, systemUser, isAdmin, isSuperuser } = useContextAuth();
  const { getToken } = useAuth();

  const {
    data: rawUsers = [],
    isLoading,
    refetch: refetchUsers,
    error: usersError,
  } = useQuery({
    queryKey: ["adminUsers", selectedViewTenant?.id, isSuperuser],
    queryFn: async () => {
      if (!selectedViewTenant) {
        return [];
      }

      const token = await getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      try {
        const response = isSuperuser
          ? await fetchUsers(headers, true)
          : await fetchTenantUsers(selectedViewTenant.id, headers);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error("Error fetching users:", error);
        return [];
      }
    },
    enabled: !!systemUser && !!selectedViewTenant && isAdmin,
    retry: false,
  });

  const { data: tenants = [], error: tenantsError } = useQuery({
    queryKey: ["allTenants"],
    queryFn: async () => {
      const headers = await getAuthHeader();
      try {
        const response = await fetchTenants(headers);
        // Ensure response is always an array
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error("Error fetching tenants:", error);
        // Return empty array on error instead of throwing
        return [];
      }
    },
    enabled: !!systemUser,
    retry: false, // Don't retry on 403 errors
  });

  const users = useMemo(() => {
    if (!Array.isArray(rawUsers)) {
      console.error("rawUsers is not an array:", rawUsers);
      return [];
    }

    if (!selectedViewTenant) {
      return [];
    }

    if (!isSuperuser) {
      return rawUsers.map((user) => {
        const tenantRoles = Array.isArray(user.roles)
          ? user.roles.map((role) =>
              typeof role === "string" ? role : role.value || role.name
            )
          : [];

        return {
          ...user,
          userRoles: Array.isArray(user.roles) ? user.roles : [],
          tenants: [
            {
              id: selectedViewTenant.id,
              name: selectedViewTenant.name,
              roles: [...new Set(tenantRoles)],
            },
          ],
        };
      });
    }

    return rawUsers
      .filter((user) =>
        Array.isArray(user.tenants)
          ? user.tenants.some((tenant) => tenant.id === selectedViewTenant.id)
          : false
      )
      .map((user) => {
        let tenantRoles = [];

        if (Array.isArray(user.userRoles)) {
          tenantRoles = user.userRoles
            .filter((role) => role?.tenantId === selectedViewTenant.id)
            .map((role) =>
              typeof role === "string" ? role : role.value || role.name
            );
        }

        const uniqueRoles = [...new Set(tenantRoles)];
        const selectedTenant = user.tenants.find(
          (tenant) => tenant.id === selectedViewTenant.id
        );

        return {
          ...user,
          tenants: [
            {
              id: selectedTenant.id,
              name: selectedTenant.name,
              roles: uniqueRoles,
            },
          ],
        };
      });
  }, [rawUsers, selectedViewTenant, isSuperuser]);

  // Set default selected tenant when tenants are loaded
  useEffect(() => {
    if (tenants.length > 0 && !selectedViewTenant) {
      setSelectedViewTenant(tenants[0]);
    }
  }, [tenants, selectedViewTenant]);

  // Show error messages
  useEffect(() => {
    if (tenantsError) {
      toast.error(
        `Failed to load tenants: ${tenantsError.message || "Access denied"}`
      );
    }
    if (usersError) {
      toast.error(
        `Failed to load users: ${usersError.message || "Access denied"}`
      );
    }
  }, [tenantsError, usersError]);

  const { mutate: deleteUser } = useDeleteUser({
    onSuccess: () => {
      toast.success("User deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  const { mutate: updateUser } = useUpdateUser({
    onSuccess: () => {
      toast.success("User updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message}`);
    },
  });

  const handleDeleteUser = (user) => {
    setSelectedUserToDelete(user);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUserToDelete) {
      deleteUser(selectedUserToDelete.id);
      setDeleteModalOpen(false);
      setSelectedUserToDelete(null);
    }
  };

  const handleRoleChange = (userId, selected) => {
    setSelectedRoles(selected);
    setValue(
      `userRoles-${userId}`,
      selected.map((role) => role.id)
    );
  };

  const handleEditTenantRoles = useCallback((user, tenant) => {
    setSelectedUserForTenantRoles(user);
    setSelectedTenantForRoles(tenant);
    setTenantRolesModalOpen(true);
  }, []);

  const handleEditUser = (user) => {
    // Parse the userRoles to ensure they're in the correct format
    const formattedUser = {
      ...user,
      userRoles: user.userRoles.map((role) => {
        // Check if the name is a JSON string and parse it
        try {
          const parsedRole = JSON.parse(role.name);
          return {
            id: parsedRole.id,
            name: parsedRole.name,
            verified: parsedRole.verified || false,
          };
        } catch (e) {
          // If not JSON, use the role as is
          return role;
        }
      }),
    };

    setSelectedUserToEdit(formattedUser);
    setEditModalOpen(true);
  };

  const handleManageCredits = useCallback(
    async (user) => {
      setSelectedUserForCredits(user);
      setCreditModalOpen(true);
      setCreditMode("set");
      setCreditAmount("");
      setCreditDescription("");
      setUserBalance(null);

      // Fetch user's current balance
      try {
        const balanceData = await getUserBalance.mutateAsync({
          userId: user.id,
        });
        setUserBalance(balanceData.balance);
      } catch (error) {
        console.error("Failed to fetch user balance:", error);
      }
    },
    [getUserBalance]
  );

  const handleAddCredits = async () => {
    if (!selectedUserForCredits || !creditAmount || creditAmount <= 0) {
      toast.error("Please enter a valid credit amount");
      return;
    }

    try {
      await addCreditsToUserAccount.mutateAsync({
        userId: selectedUserForCredits.id,
        amount: parseInt(creditAmount),
        description: creditDescription || "Admin credit addition",
      });

      // Refresh user balance
      const balanceData = await getUserBalance.mutateAsync({
        userId: selectedUserForCredits.id,
      });
      setUserBalance(balanceData.balance);

      setCreditAmount("");
      setCreditDescription("");
    } catch (error) {
      console.error("Failed to add credits:", error);
    }
  };

  const handleSetCredits = async () => {
    if (!selectedUserForCredits || creditAmount === "" || creditAmount < 0) {
      toast.error("Please enter a valid credit amount");
      return;
    }

    try {
      await setUserCreditBalance.mutateAsync({
        userId: selectedUserForCredits.id,
        amount: parseInt(creditAmount),
        description: creditDescription || "Admin credit balance adjustment",
      });

      const balanceData = await getUserBalance.mutateAsync({
        userId: selectedUserForCredits.id,
      });
      setUserBalance(balanceData.balance);

      setCreditAmount("");
      setCreditDescription("");
    } catch (error) {
      console.error("Failed to set credits:", error);
    }
  };

  const handleSaveCredits = () => {
    if (creditMode === "set") {
      handleSetCredits();
      return;
    }

    handleAddCredits();
  };

  const roleOptions = useMemo(
    () => [
      { id: "patient", name: "Patient" },
      { id: "caregiver", name: "Caregiver/Family Member" },
      { id: "physician", name: "Physician" },
      { id: "pa", name: "Physician Assistant" },
      { id: "np", name: "Nurse Practitioner" },
      { id: "rn", name: "Registered Nurse" },
      { id: "researcher", name: "Researcher" },
      { id: "advocate", name: "Patient Advocate" },
      { id: "foundation", name: "Foundation/Business Unit Staff" },
      { id: "admin", name: "Admin" },
    ],
    []
  );

  // Custom global filter function that searches through all user data including parsed roles
  const customGlobalFilter = useMemo(() => {
    return (row, columnId, value) => {
      const search = value.toLowerCase();

      // Get all searchable values from the row
      const userRoles = Array.isArray(row.original.userRoles)
        ? row.original.userRoles
        : [];

      const searchableData = [
        row.original.email?.toLowerCase() || "",
        row.original.firstName?.toLowerCase() || "",
        row.original.lastName?.toLowerCase() || "",
        row.original.designation?.toLowerCase() || "",
        // Parse and search through role names
        ...userRoles.map((role) => {
          try {
            const parsedRole = JSON.parse(role.name);
            return parsedRole.name?.toLowerCase() || "";
          } catch (e) {
            return role.name?.toLowerCase() || "";
          }
        }),
      ];

      // Check if any of the searchable data includes the search term
      return searchableData.some((data) => data.includes(search));
    };
  }, []);

  const columns = useMemo(
    () => [
      {
        accessorKey: "email",
        header: "Email",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "firstName",
        header: "First Name",
        cell: (info) => info.getValue() || "-",
      },
      {
        accessorKey: "lastName",
        header: "Last Name",
        cell: (info) => info.getValue() || "-",
      },
      {
        accessorKey: "roles",
        header: "Roles in Selected Tenant",
        cell: ({ row }) => {
          // Find user's roles in the selected tenant
          const userTenant = row.original.tenants?.find(
            (t) => t.id === selectedViewTenant?.id
          );
          const roles = userTenant?.roles || [];

          return (
            <div className="flex flex-wrap gap-1">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <span
                    key={role}
                    className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full"
                  >
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-500">No roles</span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "designation",
        header: "Designation",
        cell: (info) => (
          <span className="text-xs text-gray-500 uppercase">
            {info.getValue() || "-"}
          </span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (selectedViewTenant) {
                  handleEditTenantRoles(row.original, selectedViewTenant);
                } else {
                  handleEditUser(row.original);
                }
              }}
              className="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-200 border border-blue-200 hover:border-blue-300"
            >
              Edit
            </button>
            <button
              onClick={() => handleManageCredits(row.original)}
              className="px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-all duration-200 border border-green-200 hover:border-green-300"
            >
              Tokens
            </button>
            <button
              onClick={() => handleDeleteUser(row.original)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [handleManageCredits, selectedViewTenant, handleEditTenantRoles]
  );

  const table = useReactTable({
    data: users,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: customGlobalFilter,
  });

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isAdmin) {
    return (
      <div className="w-full min-h-screen bg-gray-50/50 p-4 sm:p-8">
        <Toaster position="top-right" />

        {selectedUserToEdit && (
          <EditUserModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedUserToEdit(null);
            }}
            user={selectedUserToEdit}
            roleOptions={roleOptions}
            updateUser={updateUser}
          />
        )}

        {selectedUserForTenantRoles && selectedTenantForRoles && (
          <EditUserTenantRolesModal
            isOpen={tenantRolesModalOpen}
            onClose={() => {
              setTenantRolesModalOpen(false);
              setSelectedUserForTenantRoles(null);
              setSelectedTenantForRoles(null);
            }}
            user={selectedUserForTenantRoles}
            tenant={selectedTenantForRoles}
            onSuccess={() => {
              refetchUsers();
            }}
          />
        )}

        {selectedViewTenant && (
          <ManageTenantUsersModal
            isOpen={manageTenantUsersModalOpen}
            onClose={() => setManageTenantUsersModalOpen(false)}
            tenant={selectedViewTenant}
            onInviteUser={() => {
              setManageTenantUsersModalOpen(false);
              setTenantInviteModalOpen(true);
            }}
            onSuccess={() => {
              refetchUsers();
            }}
          />
        )}

        {selectedViewTenant && (
          <TenantInviteModal
            isOpen={tenantInviteModalOpen}
            onClose={() => setTenantInviteModalOpen(false)}
            tenant={selectedViewTenant}
          />
        )}

        {/* Credit Management Modal */}
        {creditModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg mx-4 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Manage Token Credits
                  </h2>
                  <p className="text-sm text-gray-500 truncate">
                    {selectedUserForCredits?.email}
                  </p>
                </div>
              </div>

              {userBalance !== null && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        Current Balance
                      </p>
                      <p className="text-2xl font-bold text-blue-700">
                        {userBalance.toLocaleString()} credits
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Adjustment Type
                  </label>
                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
                    <button
                      type="button"
                      onClick={() => setCreditMode("set")}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        creditMode === "set"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Set Balance
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreditMode("add")}
                      className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                        creditMode === "add"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      Add Credits
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {creditMode === "set"
                      ? "New Credit Balance"
                      : "Credits to Add"}
                  </label>
                  <input
                    type="number"
                    min={creditMode === "set" ? "0" : "1"}
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 text-lg font-medium"
                    placeholder={
                      creditMode === "set"
                        ? "Enter total allowed credits"
                        : "Enter number of credits"
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <textarea
                    value={creditDescription}
                    onChange={(e) => setCreditDescription(e.target.value)}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200 resize-none"
                    placeholder="Reason for credit addition..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleSaveCredits}
                  disabled={
                    creditAmount === "" ||
                    !creditAmount ||
                    (creditMode === "set"
                      ? creditAmount < 0
                      : creditAmount <= 0) ||
                    addCreditsToUserAccount.isPending ||
                    setUserCreditBalance.isPending
                  }
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {addCreditsToUserAccount.isPending ||
                  setUserCreditBalance.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : (
                    creditMode === "set" ? "Set Balance" : "Add Credits"
                  )}
                </button>
                <button
                  onClick={() => setCreditModalOpen(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <DeleteConfirmationModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleConfirmDelete}
          title="Confirm Delete User"
          message={`Are you sure you want to delete ${selectedUserToDelete?.email}? This action cannot be undone.`}
        />

        <div className="mb-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                User Management
              </h1>
              <p className="text-gray-600">
                Manage user accounts, roles, and token credits
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-gray-600">
                    {users.length}{" "}
                    {selectedViewTenant
                      ? `users in ${selectedViewTenant.name}`
                      : "users"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {(tenantsError || usersError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Access Denied
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {tenantsError && (
                      <p>
                        Failed to load tenants:{" "}
                        {tenantsError.message ||
                          "You may not have permission to access this resource."}
                      </p>
                    )}
                    {usersError && (
                      <p>
                        Failed to load users:{" "}
                        {usersError.message ||
                          "You may not have permission to access this resource."}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filter Section */}
          <div className="mb-8 space-y-4">
            {/* Tenant Selector */}
            <div className="flex items-center justify-between">
              <TenantSelect
                value={selectedViewTenant}
                onChange={setSelectedViewTenant}
                options={tenants}
                placeholder="Select a tenant"
              />
              {selectedViewTenant && (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setManageTenantUsersModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                  >
                    Manage Tenant Users
                  </button>
                  <button
                    onClick={() => setTenantInviteModalOpen(true)}
                    className="px-4 py-2 bg-white text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors duration-200 shadow-sm"
                  >
                    Invite New User
                  </button>
                  <span className="text-sm text-gray-500">
                    Showing roles for:{" "}
                    <span className="font-medium">
                      {selectedViewTenant.name}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                placeholder="Search users by email, name, role, or designation..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-500 shadow-sm"
              />
            </div>
            {globalFilter && (
              <div className="mt-2 text-sm text-gray-500">
                <span className="font-medium">
                  {table.getRowModel().rows.length}
                </span>{" "}
                of {users.length} users shown
              </div>
            )}
          </div>

          {selectedViewTenant && table.getRowModel().rows.length === 0 && !globalFilter && (
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    No users in {selectedViewTenant.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {isSuperuser
                      ? "Add an existing platform user from anywhere in Contexlia, or invite someone new to join this tenant first and then assign their tenant-specific roles."
                      : "Invite someone new to join this tenant first, then assign their tenant-specific roles after they join."}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isSuperuser && (
                    <button
                      onClick={() => setManageTenantUsersModalOpen(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 shadow-sm"
                    >
                      Add Existing User
                    </button>
                  )}
                  <button
                    onClick={() => setTenantInviteModalOpen(true)}
                    className="px-4 py-2 bg-white text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors duration-200 shadow-sm"
                  >
                    Invite New User
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          <div className="flex items-center gap-2">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                            {{
                              asc: <span className="text-blue-500">↑</span>,
                              desc: <span className="text-blue-500">↓</span>,
                            }[header.column.getIsSorted()] ?? (
                              <span className="text-gray-300">↕</span>
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {table.getRowModel().rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-blue-50/50 transition-colors duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-4 py-3 text-sm text-gray-700"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-6">
            {table.getRowModel().rows.map((row) => (
              <div
                key={row.id}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                {/* Email Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 break-all mb-2">
                      {row.original.email}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        // Get roles for selected tenant
                        const userTenant = row.original.tenants?.find(
                          (t) => t.id === selectedViewTenant?.id
                        );
                        const roles = userTenant?.roles || [];

                        return roles.length > 0 ? (
                          roles.map((role) => (
                            <span
                              key={role}
                              className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded-full border border-blue-200"
                            >
                              {role}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">
                            No roles
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        if (selectedViewTenant) {
                          handleEditTenantRoles(
                            row.original,
                            selectedViewTenant
                          );
                        } else {
                          handleEditUser(row.original);
                        }
                      }}
                      className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleManageCredits(row.original)}
                      className="p-3 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-all duration-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteUser(row.original)}
                      className="p-3 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-200"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* User Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Name
                      </span>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {`${row.original.firstName || "-"} ${
                          row.original.lastName || "-"
                        }`}
                      </p>
                    </div>

                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Designation
                      </span>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {row.original.designation || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Created
                      </span>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {new Date(row.original.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You are not authorized to access this page
          </p>
        </div>
      </div>
    );
  }
}
