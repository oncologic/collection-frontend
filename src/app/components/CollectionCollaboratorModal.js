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
  FaLink,
  FaGlobe,
  FaLock,
  FaInfoCircle,
} from "react-icons/fa";
import InputField from "./inputs/InputField";

const ROLE_OPTIONS = [
  {
    id: "viewer",
    label: "Viewer",
    description: "Can view but not edit",
    icon: <FaEye className="text-blue-600 text-sm" />,
  },
  {
    id: "editor",
    label: "Editor",
    description: "Can view and edit content",
    icon: <FaEdit className="text-green-600 text-sm" />,
  },
  {
    id: "admin",
    label: "Admin",
    description: "Full access, can invite others",
    icon: <FaShieldAlt className="text-purple-600 text-sm" />,
  },
];

const CollectionCollaboratorModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      email: "",
      name: "",
      role: "editor",
      message: "",
      cascadeToExternalLinks: false,
    },
  });

  const [selectedRole, setSelectedRole] = useState("editor");
  const [invitationResult, setInvitationResult] = useState(null);
  const [showCascadeConfirmation, setShowCascadeConfirmation] = useState(false);

  const cascadeToExternalLinks = watch("cascadeToExternalLinks");

  const handleFormSubmit = async (data) => {
    // If cascade is selected, show confirmation
    if (data.cascadeToExternalLinks && !showCascadeConfirmation) {
      setShowCascadeConfirmation(true);
      return;
    }

    try {
      const result = await onSubmit({
        ...data,
        role: selectedRole,
        cascadeToExternalLinks: data.cascadeToExternalLinks,
      });

      // Handle the result based on the invitation type
      if (result?.type) {
        setInvitationResult(result);
      } else {
        // Fallback for older API responses
        reset();
        onClose();
      }
    } catch (error) {
      console.error("Error submitting invitation:", error);
    } finally {
      setShowCascadeConfirmation(false);
    }
  };

  const handleClose = () => {
    reset();
    setInvitationResult(null);
    setShowCascadeConfirmation(false);
    onClose();
  };

  // Don't render if modal is not open
  if (!isOpen) return null;

  // Show cascade confirmation dialog
  if (showCascadeConfirmation) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        onClick={() => setShowCascadeConfirmation(false)}
      >
        <div
          className="p-4 max-w-2xl w-full bg-white rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start mb-4">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mr-2 flex-shrink-0">
              <FaExclamationTriangle className="text-amber-600 text-sm" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">
                Apply Permissions to External Links?
              </h2>
              <p className="text-gray-600 text-sm mb-3">
                This will grant the collaborator access to all{" "}
                <strong>public</strong> and <strong>unlisted</strong> external
                links in this collection.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-start">
                  <FaInfoCircle className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="mb-2">This includes:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>All current public and unlisted external links</li>
                      <li>
                        Future external links added to this collection (if
                        public/unlisted)
                      </li>
                      <li>
                        Automatic removal if the collaborator is removed from
                        the collection
                      </li>
                    </ul>
                    <p className="mt-2 font-medium">
                      Private external links will not be affected.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCascadeConfirmation(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit(handleFormSubmit)()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Yes, Apply to External Links
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show result screen if we have an invitation result
  if (invitationResult) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
        onClick={handleClose}
      >
        <div
          className="p-4 max-w-2xl w-full bg-white rounded-lg shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-green-100 flex items-center justify-center">
              {invitationResult.type === "existing" ? (
                <FaCheckCircle className="text-green-600 text-2xl" />
              ) : (
                <FaClock className="text-blue-600 text-2xl" />
              )}
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {invitationResult.type === "existing"
                ? "Collaborator Added!"
                : "Invitation Sent!"}
            </h2>

            <p className="text-gray-600 text-sm mb-4">
              {invitationResult.type === "existing"
                ? "The user has been added as a collaborator to the collection."
                : "An invitation email has been sent. The user will be added as a collaborator when they create an account or log in."}
            </p>

            {invitationResult.type === "pending" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
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
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleClose}
    >
      <div
        className="p-4 max-w-2xl w-full bg-white rounded-lg shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
              <FaUsers className="text-blue-600 text-sm" />
            </div>
            Invite Collection Collaborator
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        <p className="text-gray-600 text-sm mb-3">
          Invite someone to collaborate on this collection.
        </p>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="space-y-3">
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

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permission Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <div
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`border rounded-lg p-2 cursor-pointer transition-all ${
                      selectedRole === role.id
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      {role.icon}
                      <input
                        type="radio"
                        checked={selectedRole === role.id}
                        onChange={() => setSelectedRole(role.id)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900">
                      {role.label}
                    </h4>
                    <p className="text-xs text-gray-600">{role.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("cascadeToExternalLinks")}
                    className="mt-1 text-blue-600 focus:ring-blue-500 rounded"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">
                      Apply to External Links
                    </span>
                    <p className="text-sm text-gray-600 mt-1">
                      Grant access to all public and unlisted external links in
                      this collection. Private links remain protected.
                    </p>
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <FaGlobe className="mr-1" />
                      <span>Public</span>
                      <FaLink className="ml-3 mr-1" />
                      <span>Unlisted</span>
                      <FaLock className="ml-3 mr-1 text-gray-400" />
                      <span className="text-gray-400">
                        Private (not included)
                      </span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Personal Message (Optional)
              </label>
              <textarea
                {...register("message")}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a personal note to the invitation..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <span className="mr-2">Sending...</span>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
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
    </div>
  );
};

export default CollectionCollaboratorModal;
