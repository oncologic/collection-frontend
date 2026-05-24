"use client";
import { Dialog } from "@headlessui/react";
import { useState, useEffect } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCreateUser } from "../hooks/useUsers";
import { useTenants } from "../hooks/useTenants";
import MultiSelect from "./inputs/MultiSelect";
import { toast } from "react-hot-toast";

export const roleCategories = {
  personal: {
    id: "personal",
    name: "Personal Use",
    roles: [
      { 
        id: "personal", 
        name: "Personal Workspace", 
        requiresApproval: false,
        description: "For personal productivity, goal tracking, and life organization"
      },
    ],
  },
  patient: {
    id: "patient",
    name: "Patient & Family",
    roles: [
      { id: "patient", name: "Patient", requiresApproval: false },
      {
        id: "caregiver",
        name: "Caregiver/Family Member",
        requiresApproval: false,
      },
    ],
  },
  medical: {
    id: "medical",
    name: "Healthcare Professionals",
    roles: [
      { id: "physician", name: "Physician", requiresApproval: true },
      { id: "pa", name: "Physician Assistant", requiresApproval: true },
      { id: "np", name: "Nurse Practitioner", requiresApproval: true },
      { id: "rn", name: "Registered Nurse", requiresApproval: true },
    ],
  },
  research: {
    id: "research",
    name: "Research & Foundation",
    roles: [
      {
        id: "researcher",
        name: "Researcher",
        requiresApproval: true,
      },
      // Advocate role removed - must be assigned by admin only
      {
        id: "foundation",
        name: "Foundation/Business Unit Staff",
        requiresApproval: true,
        industries: [
          "Patient Advocacy Business Unit",
          "Medical Foundation",
          "Research Foundation",
          "Healthcare Nonprofit",
          "Other",
        ],
      },
    ],
  },
};

const KIDNEY_TENANT_ID = process.env.NEXT_PUBLIC_KIDNEY_TENANT;
const KIDNEY_TENANT_NAME = "Kidney Cancer";
const PERSONAL_TENANT_ID = process.env.NEXT_PUBLIC_COMMUNITY_TENANT;
const PERSONAL_TENANT_NAME = "Personal";

const RoleSelectionModal = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [roles, setRoles] = useState([]);
  const [selectedTenants, setSelectedTenants] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({
    personal: false,
    patient: true,
    medical: false,
    research: false,
  });
  const { mutateAsync: createUser } = useCreateUser();

  // Check if user is from personal tenant or already has onboarding complete
  const isPersonalTenant = user?.publicMetadata?.tenant === 'personal';
  const hasOnboarded = user?.publicMetadata?.onboardingComplete === true;

  useEffect(() => {
    // Default to kidney tenant
    setSelectedTenants([{ id: KIDNEY_TENANT_ID, name: KIDNEY_TENANT_NAME }]);
  }, []);

  const requiresNPI = (roleId) => {
    return ["physician", "pa", "np"].includes(roleId);
  };

  const requiresNursingLicense = (roleId) => {
    return ["rn"].includes(roleId);
  };

  const handleRoleToggle = (roleId, requiresApproval) => {
    setRoles((prev) => {
      const existingRole = prev.find((role) => role.id === roleId);
      if (existingRole) {
        // Remove role if it exists
        const updated = prev.filter((role) => role.id !== roleId);
        return updated;
      } else {
        // Add new role
        const updated = [
          ...prev,
          {
            id: roleId,
            npi_number: "",
            nursing_license: "",
            industry: "",
            requires_approval: requiresApproval,
          },
        ];
        return updated;
      }
    });
  };

  const handleNPIChange = (roleId, npiNumber) => {
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId ? { ...role, npi_number: npiNumber } : role
      )
    );
  };

  const handleNursingLicenseChange = (roleId, licenseNumber) => {
    setRoles((prev) =>
      prev.map((role) =>
        role.id === roleId ? { ...role, nursing_license: licenseNumber } : role
      )
    );
  };

  const handleIndustryChange = (roleId, industry) => {
    setRoles((prev) =>
      prev.map((role) => (role.id === roleId ? { ...role, industry } : role))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isSignedIn && user) {
        if (!roles || !Array.isArray(roles) || roles.length === 0) {
          toast.error("Please select at least one role");
          return;
        }
        
        // Check if personal role is selected
        const hasPersonalRole = roles.some(role => role.id === 'personal');
        const hasKidneyRoles = roles.some(role => ['patient', 'caregiver', 'physician', 'pa', 'np', 'rn', 'researcher', 'foundation'].includes(role.id));
        
        // Determine which tenants to assign
        let tenantsToAssign = [];
        if (hasPersonalRole && hasKidneyRoles) {
          // User wants both tenants
          tenantsToAssign = [
            { id: KIDNEY_TENANT_ID, name: KIDNEY_TENANT_NAME },
            { id: PERSONAL_TENANT_ID, name: PERSONAL_TENANT_NAME }
          ];
        } else if (hasPersonalRole) {
          // Only personal tenant
          tenantsToAssign = [{ id: PERSONAL_TENANT_ID, name: PERSONAL_TENANT_NAME }];
        } else {
          // Only kidney tenant (default)
          tenantsToAssign = [{ id: KIDNEY_TENANT_ID, name: KIDNEY_TENANT_NAME }];
        }
        
        const userData = {
          clerk_id: user.id,
          email: user.primaryEmailAddress.emailAddress,
          first_name: user.firstName,
          last_name: user.lastName,
          roles: roles.map((role) => ({
            id: role.id,
            requires_approval: role.requires_approval,
            npi_number: role.npi_number || "",
            nursing_license: role.nursing_license || "",
            industry: role.industry || "",
          })),
          requires_approval: roles.some((role) => role.requires_approval),
          tenants: tenantsToAssign.map((tenant) => tenant.id),
        };
        await createUser(userData);
        
        // Update user metadata to mark onboarding as complete
        await user.update({
          publicMetadata: {
            ...user.publicMetadata,
            roles: roles.map(r => r.id),
            onboardingComplete: true
          }
        });
        
        onClose();
        
        // If only personal role selected, go to dashboard instead of tutorials
        if (hasPersonalRole && !hasKidneyRoles) {
          router.push("/dashboard");
        } else {
          router.push("/tutorials");
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      // Don't show another toast since useCreateUser already shows one
      // Still close the modal and navigate since user might have been created
      onClose();
      router.push("/dashboard");
    }
  };

  // Update the role checking functions
  const isRoleSelected = (roleId) => roles.some((role) => role.id === roleId);
  const getRole = (roleId) => roles.find((role) => role.id === roleId);

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  // Don't show modal for personal tenant users who have onboarded
  if (!isOpen || (isPersonalTenant && hasOnboarded)) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-3xl font-bold">
            Welcome! Tell us about yourself
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Close modal"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600 mb-8">
          Select all roles that apply to you. Some roles may require
          verification.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Hide tenant selection UI, but keep the value in state */}
          <input type="hidden" name="tenant" value={KIDNEY_TENANT_ID} />
          <div className="space-y-6">
            {Object.values(roleCategories).map((category) => (
              <div
                key={category.id}
                className="border rounded-lg overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <h3 className="text-xl font-semibold text-gray-800">
                    {category.name}
                  </h3>
                  {expandedCategories[category.id] ? (
                    <FaChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <FaChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>

                {expandedCategories[category.id] && (
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.roles.map((role) => (
                        <div
                          key={role.id}
                          className={`
                            relative p-5 rounded-xl border-2 transition-all hover:shadow-md
                            ${
                              isRoleSelected(role.id)
                                ? "border-blue-500 bg-blue-50/50"
                                : "border-gray-200 hover:border-gray-300"
                            }
                          `}
                        >
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={isRoleSelected(role.id)}
                                onChange={() =>
                                  handleRoleToggle(
                                    role.id,
                                    role.requiresApproval
                                  )
                                }
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </div>
                            <div className="flex-grow">
                              <h4 className="text-lg font-medium text-gray-900">
                                {role.name}
                              </h4>
                              {role.description && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {role.description}
                                </p>
                              )}
                              {role.requiresApproval && (
                                <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Requires verification
                                </span>
                              )}

                              {/* Credential Inputs */}
                              {isRoleSelected(role.id) && (
                                <>
                                  {/* NPI/License Input */}
                                  {(requiresNPI(role.id) ||
                                    requiresNursingLicense(role.id)) && (
                                    <div className="mt-4">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {requiresNPI(role.id)
                                          ? "NPI Number"
                                          : "Nursing License Number"}
                                      </label>
                                      <input
                                        type="text"
                                        value={
                                          requiresNPI(role.id)
                                            ? getRole(role.id)?.npi_number || ""
                                            : getRole(role.id)
                                                ?.nursing_license || ""
                                        }
                                        onChange={(e) =>
                                          requiresNPI(role.id)
                                            ? handleNPIChange(
                                                role.id,
                                                e.target.value
                                              )
                                            : handleNursingLicenseChange(
                                                role.id,
                                                e.target.value
                                              )
                                        }
                                        placeholder={
                                          requiresNPI(role.id)
                                            ? "Enter your NPI number"
                                            : "Enter your nursing license number"
                                        }
                                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 
                                          shadow-sm placeholder-gray-400
                                          focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                          transition duration-150 ease-in-out
                                          text-gray-900"
                                        required
                                      />
                                    </div>
                                  )}

                                  {/* Industry Selection */}
                                  {role.industries && (
                                    <div className="mt-4">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Industry
                                      </label>
                                      <select
                                        value={getRole(role.id)?.industry || ""}
                                        onChange={(e) =>
                                          handleIndustryChange(
                                            role.id,
                                            e.target.value
                                          )
                                        }
                                        className="block w-full px-4 py-3 rounded-lg border border-gray-300 
                                          shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                                          transition duration-150 ease-in-out
                                          text-gray-900"
                                        required
                                      >
                                        <option value="">
                                          Select your industry
                                        </option>
                                        {role.industries.map((industry) => (
                                          <option
                                            key={industry}
                                            value={industry}
                                          >
                                            {industry}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end bottom-0 bg-white py-4 border-t">
            <button
              type="submit"
              disabled={roles.length === 0}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {roles.some((role) => role.requires_approval) ? (
                <>
                  <span>Continue to Verification</span>
                  <svg
                    className="ml-2 -mr-1 h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </>
              ) : (
                "Continue"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleSelectionModal;
