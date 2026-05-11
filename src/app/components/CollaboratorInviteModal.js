import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  FaEnvelope,
  FaUser,
  FaUsers,
  FaPaperPlane,
  FaTimes,
  FaShieldAlt,
  FaEdit,
  FaEye,
  FaCheckCircle,
  FaClock,
  FaExclamationTriangle,
} from "react-icons/fa";
import InputField from "./inputs/InputField";

const ROLE_OPTIONS = [
  {
    id: "viewer",
    label: "Viewer",
    description: "Can view but not edit",
    icon: <FaEye className="text-blue-600" />,
  },
  {
    id: "editor",
    label: "Editor",
    description: "Can view and edit content",
    icon: <FaEdit className="text-green-600" />,
  },
  {
    id: "admin",
    label: "Admin",
    description: "Full access, can invite others",
    icon: <FaShieldAlt className="text-purple-600" />,
  },
];

const CollaboratorInviteModal = ({ onClose, onSubmit, isLoading = false }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      email: "",
      name: "",
      role: "viewer",
      message: "",
    },
  });

  const [selectedRole, setSelectedRole] = useState("viewer");
  const [invitationResult, setInvitationResult] = useState(null);

  const handleFormSubmit = async (data) => {
    try {
      const result = await onSubmit({ ...data, role: selectedRole });

      // Handle the result based on the invitation type
      if (result?.type) {
        setInvitationResult(result);
        // Don't reset the form immediately, let user see the result
      } else {
        // Fallback for older API responses
        reset();
        onClose();
      }
    } catch (error) {
      console.error("Error submitting invitation:", error);
      // Error handling is done in the hook
    }
  };

  const handleClose = () => {
    reset();
    setInvitationResult(null);
    onClose();
  };

  // Show result screen if we have an invitation result
  if (invitationResult) {
    return (
      <div className="p-6 max-w-full w-full bg-white rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            {invitationResult.type === "immediate" ? (
              <FaCheckCircle className="text-green-600 text-2xl" />
            ) : (
              <FaClock className="text-blue-600 text-2xl" />
            )}
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {invitationResult.type === "immediate"
              ? "Collaborator Added!"
              : "Invitation Sent!"}
          </h2>

          <p className="text-gray-600 mb-6">
            {invitationResult.type === "immediate"
              ? "The user has been added as a collaborator immediately since they already have an account."
              : "An invitation email has been sent. The user will be added as a collaborator when they create an account or log in."}
          </p>

          {invitationResult.type === "pending" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FaClock className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <h4 className="font-medium text-blue-900 mb-1">
                    Pending Invitation
                  </h4>
                  <p className="text-blue-700 text-sm">
                    The invitation will expire on{" "}
                    {new Date(
                      invitationResult.data.expiresAt
                    ).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setInvitationResult(null);
                reset();
              }}
              className="px-5 py-2.5 text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 font-medium transition-colors"
            >
              Invite Another
            </button>
            <button
              onClick={handleClose}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full w-full bg-white rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
            <FaUsers className="text-blue-600 text-lg" />
          </div>
          Invite Collaborator
        </h2>
      </div>

      <p className="text-gray-600 mb-6">
        Invite someone to collaborate on this resource. They&apos;ll receive an
        email with access instructions.
      </p>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5">
          <InputField
            id="email"
            name="email"
            label="Email Address"
            placeholder="colleague@example.com"
            type="email"
            register={register}
            required={true}
            error={errors.email}
            icon={<FaEnvelope className="text-gray-500" />}
          />

          <InputField
            id="name"
            name="name"
            label="Name (Optional)"
            placeholder="Colleague's name"
            register={register}
            error={errors.name}
            icon={<FaUser className="text-gray-500" />}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Permission Level
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ROLE_OPTIONS.map((role) => (
                <div
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedRole === role.id
                      ? "border-blue-500 bg-blue-50 shadow-sm"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm mr-3">
                      {role.icon}
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border ml-auto ${
                        selectedRole === role.id
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      } flex-shrink-0`}
                    >
                      {selectedRole === role.id && (
                        <div className="w-2 h-2 bg-white rounded-full m-auto mt-1"></div>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">
                      {role.label}
                    </span>
                    <p className="text-gray-500 text-sm mt-1">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Personal Message (Optional)
            </label>
            <textarea
              id="message"
              rows={3}
              {...register("message")}
              placeholder="Add a note to include in the invitation email..."
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-700"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <FaPaperPlane className="mr-2" />
                Send Invitation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CollaboratorInviteModal;
