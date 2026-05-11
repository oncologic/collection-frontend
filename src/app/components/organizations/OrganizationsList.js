"use client";

import React, { useState, useMemo } from "react";
import {
  FaBuilding,
  FaCheckSquare,
  FaSquare,
  FaClipboard,
  FaStar,
  FaExternalLinkAlt,
  FaChevronDown,
  FaCopy,
} from "react-icons/fa";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import SelectField from "../inputs/SelectField";

const OrganizationsList = ({
  organizations = [],
  loading = false,
  onToggleFavorite,
  favorites = [],
  showFavoriteOnly = false,
  searchTerm = "",
}) => {
  const router = useRouter();
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedOrganizations, setSelectedOrganizations] = useState(new Set());
  const [copyOption, setCopyOption] = useState({
    id: "names",
    name: "Names Only",
  });

  // Filter organizations based on search term and favorites
  const filteredOrganizations = useMemo(() => {
    let filtered = organizations;

    // Filter by favorites if needed
    if (showFavoriteOnly) {
      filtered = filtered.filter((org) => favorites.includes(org.id));
    }

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (org) =>
          org.name.toLowerCase().includes(searchLower) ||
          (org.description &&
            org.description.toLowerCase().includes(searchLower)) ||
          (org.focusAreas &&
            org.focusAreas.some((area) =>
              area.toLowerCase().includes(searchLower)
            ))
      );
    }

    return filtered;
  }, [organizations, favorites, showFavoriteOnly, searchTerm]);

  // Toggle organization selection
  const toggleOrganizationSelection = (orgId) => {
    const newSelection = new Set(selectedOrganizations);
    if (newSelection.has(orgId)) {
      newSelection.delete(orgId);
    } else {
      newSelection.add(orgId);
    }
    setSelectedOrganizations(newSelection);
  };

  // Select/deselect all organizations
  const toggleSelectAll = () => {
    if (selectedOrganizations.size === filteredOrganizations.length) {
      setSelectedOrganizations(new Set());
    } else {
      setSelectedOrganizations(
        new Set(filteredOrganizations.map((org) => org.id))
      );
    }
  };

  // Generate text based on copy option
  const selectedOrgText = useMemo(() => {
    const selectedOrgs = filteredOrganizations.filter((org) =>
      selectedOrganizations.has(org.id)
    );

    switch (copyOption?.id) {
      case "names":
        return selectedOrgs.map((org) => org.name).join(", ");

      case "namesAndUrls":
        return selectedOrgs
          .map((org) => {
            const website = org.website || org.url || "";
            return `${org.name}${website ? ` - ${website}` : ""}`;
          })
          .join("\n");

      case "handles":
        return selectedOrgs
          .map((org) => {
            if (
              !org.socialMediaAccounts ||
              org.socialMediaAccounts.length === 0
            ) {
              return `${org.name}: No social media`;
            }
            const handles = org.socialMediaAccounts
              .map((account) =>
                account.handle ? `@${account.handle}` : account.name
              )
              .join(", ");
            return `${org.name}: ${handles}`;
          })
          .join("\n");

      case "full":
        return selectedOrgs
          .map((org) => {
            let text = org.name;
            const website = org.website || org.url || "";
            if (website) text += `\nWebsite: ${website}`;

            // Add social media if available
            if (org.socialMediaAccounts && org.socialMediaAccounts.length > 0) {
              text += "\nSocial Media:";
              org.socialMediaAccounts.forEach((account) => {
                text += `\n  - ${account.platform.name}: ${
                  account.handle ? "@" + account.handle : account.url
                }`;
              });
            }

            return text;
          })
          .join("\n\n");

      default:
        return selectedOrgs.map((org) => org.name).join(", ");
    }
  }, [filteredOrganizations, selectedOrganizations, copyOption]);

  // Copy selected organizations
  const copySelectedOrganizations = async () => {
    if (!selectedOrgText) {
      toast.error("No organizations selected");
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedOrgText);
      const label =
        copyOption?.id === "names"
          ? "names"
          : copyOption?.id === "namesAndUrls"
          ? "names and URLs"
          : copyOption?.id === "handles"
          ? "social media handles"
          : "full details";
      toast.success(
        `Copied ${selectedOrganizations.size} organization ${label} to clipboard!`
      );
      // Clear selection after copying
      setSelectedOrganizations(new Set());
      setIsMultiSelectMode(false);
    } catch (err) {
      toast.error("Failed to copy organization data");
    }
  };

  // Get the first letter for avatar
  const getInitial = (name) => {
    return name ? name.charAt(0).toUpperCase() : "?";
  };

  // Get avatar background color based on org type
  const getAvatarColor = (focusAreas) => {
    if (!focusAreas || focusAreas.length === 0) return "bg-gray-100";

    const firstArea = focusAreas[0].toLowerCase();
    if (firstArea.includes("research")) return "bg-blue-100";
    if (firstArea.includes("support")) return "bg-green-100";
    if (firstArea.includes("awareness")) return "bg-purple-100";
    if (firstArea.includes("kidney")) return "bg-red-100";
    if (firstArea.includes("family")) return "bg-yellow-100";
    return "bg-gray-100";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!filteredOrganizations || filteredOrganizations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          {searchTerm
            ? `No organizations matching "${searchTerm}" found.`
            : showFavoriteOnly
            ? "No favorite organizations yet."
            : "No organizations found."}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Multi-select controls */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => {
            setIsMultiSelectMode(!isMultiSelectMode);
            setSelectedOrganizations(new Set());
          }}
          className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
            isMultiSelectMode
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {isMultiSelectMode ? <FaCheckSquare /> : <FaSquare />}
          <span>
            {isMultiSelectMode ? "Exit Selection" : "Select Organizations"}
          </span>
        </button>

        {isMultiSelectMode && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              {selectedOrganizations.size === filteredOrganizations.length
                ? "Deselect All"
                : "Select All"}
            </button>

            {selectedOrganizations.size > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedOrganizations.size} selected
                </span>

                {/* Copy Options Dropdown */}
                <div className="w-48">
                  <SelectField
                    value={copyOption}
                    onChange={setCopyOption}
                    options={[
                      { id: "names", name: "Names Only" },
                      { id: "namesAndUrls", name: "Names + URLs" },
                      { id: "handles", name: "Social Media Handles" },
                      { id: "full", name: "Full Details" },
                    ]}
                    placeholder="Select copy format"
                  />
                </div>

                <button
                  onClick={copySelectedOrganizations}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all flex items-center gap-2"
                >
                  <FaClipboard />
                  Copy
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Selected organizations preview */}
      {isMultiSelectMode && selectedOrgText && (
        <div className="mb-6 p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">
            Preview ({copyOption?.name || "Names Only"}):
          </p>
          <pre className="text-sm font-mono text-gray-800 whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
            {selectedOrgText}
          </pre>
        </div>
      )}

      {/* Organizations grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOrganizations.map((org) => (
          <div
            key={org.id}
            className={`bg-white rounded-lg shadow-sm border p-4 transition-all hover:shadow-md ${
              isMultiSelectMode && selectedOrganizations.has(org.id)
                ? "border-blue-500 shadow-md"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                {isMultiSelectMode && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOrganizationSelection(org.id);
                    }}
                    className="mr-3 text-lg"
                  >
                    {selectedOrganizations.has(org.id) ? (
                      <FaCheckSquare className="text-blue-600" />
                    ) : (
                      <FaSquare className="text-gray-400" />
                    )}
                  </button>
                )}
                <div
                  className={`w-12 h-12 rounded-lg ${getAvatarColor(
                    org.focusAreas
                  )} flex items-center justify-center mr-4`}
                >
                  {org.imageUrl ? (
                    <img
                      src={org.imageUrl}
                      alt={org.name}
                      className="w-full h-full rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-xl font-semibold text-gray-700">
                      {getInitial(org.name)}
                    </span>
                  )}
                </div>
                <div>
                  {org.website ? (
                    <a
                      href={
                        org.website.startsWith("http")
                          ? org.website
                          : `https://${org.website}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors cursor-pointer">
                        {org.name}
                      </h3>
                    </a>
                  ) : (
                    <h3 className="text-lg font-semibold text-gray-900">
                      {org.name}
                    </h3>
                  )}
                  <p className="text-sm text-gray-600">
                    {org.abbreviation || org.location}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onToggleFavorite) {
                    onToggleFavorite(org.id);
                  }
                }}
                className={`p-2 rounded-full transition-colors ${
                  favorites.includes(org.id)
                    ? "text-yellow-500 hover:text-yellow-600"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <FaStar
                  className={favorites.includes(org.id) ? "fill-current" : ""}
                />
              </button>
            </div>

            {org.focusAreas && org.focusAreas.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {org.focusAreas.map((area, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {area}
                  </span>
                ))}
              </div>
            )}

            {org.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                {org.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push(`/organizations/${org.id}`)}
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View Details
                <FaExternalLinkAlt className="ml-2 h-3 w-3" />
              </button>
              {org.website && (
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    const websiteUrl = org.website.startsWith("http")
                      ? org.website
                      : `https://${org.website}`;
                    try {
                      await navigator.clipboard.writeText(websiteUrl);
                      toast.success("Website URL copied!");
                    } catch (err) {
                      toast.error("Failed to copy URL");
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copy website URL"
                >
                  <FaCopy className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default OrganizationsList;
