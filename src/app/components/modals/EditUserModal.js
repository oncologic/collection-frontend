"use client";

import { Dialog, Overlay } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import MultiSelect from "../inputs/MultiSelect";
import InputField from "../inputs/InputField";
import Modal from "../Modal";

export default function EditUserModal({
  isOpen,
  onClose,
  user,
  roleOptions,
  updateUser,
}) {
  const [selectedRoles, setSelectedRoles] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    },
  });

  useEffect(() => {
    if (user?.userRoles && roleOptions) {
      const mappedRoles = roleOptions
        .filter((roleOption) =>
          user.userRoles?.some(
            (userRole) =>
              userRole.name.toLowerCase() === roleOption.name.toLowerCase()
          )
        )
        .map((roleOption) => {
          const userRole = user.userRoles?.find(
            (ur) => ur.name.toLowerCase() === roleOption.name.toLowerCase()
          );
          return {
            id: roleOption.id,
            name: roleOption.name,
            verified: userRole?.verified || false,
          };
        });

      setSelectedRoles(mappedRoles);
    }
  }, [user, roleOptions]);

  const handleRoleToggle = (role) => {
    setSelectedRoles((prev) => {
      const existingRole = prev.find((r) => r.id === role.id);
      if (existingRole) {
        // Remove role if it exists
        return prev.filter((r) => r.id !== role.id);
      } else {
        // Add new role
        return [
          ...prev,
          {
            id: role.id,
            name: role.name,
            verified: false,
          },
        ];
      }
    });
  };

  const toggleVerification = (roleId) => {
    setSelectedRoles((prev) =>
      prev.map((role) =>
        role.id === roleId ? { ...role, verified: !role.verified } : role
      )
    );
  };

  const onSubmit = (data) => {
    updateUser({
      user: {
        id: user.id,
        ...data,
        userRoles: selectedRoles,
      },
    });
    onClose();
  };

  return (
    <div className="flex items-center justify-center">
      <Modal
        open={isOpen}
        onClose={onClose}
        className="inset-0 z-50 overflow-y-auto mx-auto items-center justify-center"
      >
        <div className="relative bg-white rounded-lg mx-auto w-full mx-4 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit User</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                label="First Name"
                id="firstName"
                name="firstName"
                register={register}
                required
              />
              <InputField
                label="Last Name"
                id="lastName"
                name="lastName"
                register={register}
                required
              />
            </div>

            <InputField
              label="Email"
              id="email"
              name="email"
              type="email"
              register={register}
              required
              disabled
            />

            <div className="space-y-4">
              <label className="block text-lg font-semibold text-gray-700">
                Roles
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleOptions.map((role) => (
                  <div
                    key={role.id}
                    className={`
                      relative p-4 rounded-xl border-2 transition-all hover:shadow-md
                      ${
                        selectedRoles.some((r) => r.id === role.id)
                          ? "border-blue-500 bg-blue-50/50"
                          : "border-gray-200 hover:border-gray-300"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedRoles.some((r) => r.id === role.id)}
                          onChange={() => handleRoleToggle(role)}
                          className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {role.name}
                          </h4>
                        </div>
                      </div>
                      {selectedRoles.some((r) => r.id === role.id) && (
                        <button
                          type="button"
                          onClick={() => toggleVerification(role.id)}
                          className={`px-3 py-1 text-sm rounded-md ${
                            selectedRoles.find((r) => r.id === role.id)
                              ?.verified
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          }`}
                        >
                          {selectedRoles.find((r) => r.id === role.id)?.verified
                            ? "Verified"
                            : "Verify"}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
