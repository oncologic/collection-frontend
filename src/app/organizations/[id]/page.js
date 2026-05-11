"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaEdit,
  FaLock,
  FaSearch,
  FaFilter,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import Summary from "@/app/components/Summary";
import { useEvents } from "@/app/hooks/useEvents";
import {
  useGetOrganization,
  useGetOrganizationUsers,
  useSubscribeToOrganization,
  useUnsubscribeFromOrganization,
  useUpdateOrganization,
} from "@/app/hooks/useOrganizations";
import Modal from "@/app/components/Modal";
import AddOrganizationForm from "@/app/components/forms/AddOrganization";
import { useTags } from "@/app/hooks/useTags";
import { useGetResoucesByOrganization } from "@/app/hooks/useResources";
import Image from "next/image";
import TagFilter from "@/app/components/filters/TagFilter";

import { Tab, Tabs } from "@/app/components/common/Tabs";
import UserTable from "@/app/components/tables/UserTable";
import { useContextAuth } from "@/app/context/authContext";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import MultiSelect from "@/app/components/inputs/MultiSelect";

// New imports for surveys
import { useFetchSurveys } from "@/app/hooks/useSurveys";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import Sidebar from "@/app/components/Sidebar";
import { UNASSIGNED_ORGANIZATION_ID } from "@/app/constants/organizations";

// Social media imports
import { useAssociatedSocialMediaAccounts } from "@/app/hooks/useSocialMedia";
import SocialMediaButton from "@/app/components/social-media/SocialMediaButton";
import SocialMediaModal from "@/app/components/social-media/SocialMediaModal";

// Component for placeholder avatar
const PlaceholderAvatar = ({ name, size = "w-32 h-32" }) => {
  const firstLetter = name?.charAt(0).toUpperCase() || "?";

  // Generate a consistent background color based on the name
  const getBackgroundColor = (str) => {
    const colors = [
      "bg-blue-200",
      "bg-green-200",
      "bg-purple-200",
      "bg-red-200",
      "bg-yellow-200",
      "bg-indigo-200",
      "bg-pink-200",
      "bg-gray-400",
    ];
    const hash =
      str?.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0) || 0;
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className={`${size} ${getBackgroundColor(
        name
      )} rounded-xl shadow-md flex items-center justify-center`}
    >
      <span className="text-gray-700 font-bold text-4xl">{firstLetter}</span>
    </div>
  );
};

const OrganizationPage = () => {
  const { id } = useParams();
  const isUnassignedOrganization = id === UNASSIGNED_ORGANIZATION_ID;
  const { systemUser, isAdmin, isAdvocate, isPersonal, adminTenants, advocateTenants } = useContextAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [activeView, setActiveView] = useState("details");
  const [activeTab, setActiveTab] = useState("members");
  const [imageError, setImageError] = useState(false);

  // New state for enhanced resource management
  const [resourceSearchTerm, setResourceSearchTerm] = useState("");
  const [selectedResourceTags, setSelectedResourceTags] = useState([]);
  const [selectedResourceTypes, setSelectedResourceTypes] = useState([]);
  const [isResourceFiltersVisible, setIsResourceFiltersVisible] =
    useState(false);
  const [resourceSortBy, setResourceSortBy] = useState("date");
  const [showSocialMediaModal, setShowSocialMediaModal] = useState(false);

  // Data fetching hooks
  const { data: fetchedOrganization, isLoading: orgLoading } = useGetOrganization(
    id,
    {
      enabled: !isUnassignedOrganization,
    }
  );
  const { data: events = [], isLoading: eventsLoading } = useEvents();
  const { data: resources = [], isLoading: resourcesLoading } =
    useGetResoucesByOrganization(id);
  const { data: tags = [] } = useTags();
  const { data: organizationSurveys = [] } = useFetchSurveys();
  const { data: users = [], isLoading: usersLoading } =
    useGetOrganizationUsers(id, { enabled: !isUnassignedOrganization });
  const { mutate: updateOrganization } = useUpdateOrganization();

  // Fetch associated social media accounts
  const { data: socialMediaAssociations = [], isLoading: socialMediaLoading } =
    useAssociatedSocialMediaAccounts(id, "organization", {
      enabled: !isUnassignedOrganization,
    });

  const organization = useMemo(() => {
    if (!isUnassignedOrganization) {
      return fetchedOrganization;
    }

    const resourceCount = resources.length;

    return {
      id: UNASSIGNED_ORGANIZATION_ID,
      name: "Unassigned",
      description:
        resourceCount === 1
          ? "1 resource without an assigned organization."
          : resourceCount > 1
          ? `${resourceCount} resources without an assigned organization.`
          : "Resources without an assigned organization.",
      imageUrl: null,
      tags: [],
      website: null,
      isVirtual: true,
      tenantId: null,
    };
  }, [fetchedOrganization, isUnassignedOrganization, resources.length]);

  // Extract the accounts from the associations
  const socialMediaAccounts = useMemo(() => {
    return socialMediaAssociations
      .map((association) => association.account)
      .filter(Boolean);
  }, [socialMediaAssociations]);

  // Reset image error when organization changes
  useEffect(() => {
    setImageError(false);
  }, [organization?.id, organization?.imageUrl]);

  // Determine if user can edit this organization
  const canEditOrganization = useMemo(() => {
    if (!organization || isUnassignedOrganization) return false;

    // Check if user has edit access to this organization
    return (
      // User is in personal tenant and org is in their personal tenant
      (isPersonal && organization.userId === systemUser?.id) ||
      // User is admin in the organization's tenant
      adminTenants?.some(t => t.tenantId === organization.tenantId) ||
      // User is advocate in the organization's tenant
      advocateTenants?.some(t => t.tenantId === organization.tenantId)
    );
  }, [
    organization,
    isPersonal,
    adminTenants,
    advocateTenants,
    systemUser,
    isUnassignedOrganization,
  ]);

  // Filter events for this organization
  const filteredEvents = useMemo(() => {
    if (isUnassignedOrganization) {
      return [];
    }

    return events.filter((event) =>
      event.organizations?.some((org) => org.id === id)
    );
  }, [events, id, isUnassignedOrganization]);

  // Enhanced resource filtering
  const filteredResources = useMemo(() => {
    let filtered = [...resources];

    // Search filter
    if (resourceSearchTerm) {
      const searchLower = resourceSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (resource) =>
          resource.name?.toLowerCase().includes(searchLower) ||
          resource.description?.toLowerCase().includes(searchLower) ||
          resource.tags?.some((tag) =>
            tag.name?.toLowerCase().includes(searchLower)
          )
      );
    }

    // Tag filter
    if (selectedResourceTags.length > 0) {
      filtered = filtered.filter((resource) =>
        resource.tags?.some((tag) =>
          selectedResourceTags.some((selectedTag) => selectedTag.id === tag.id)
        )
      );
    }

    // Type filter
    if (selectedResourceTypes.length > 0) {
      filtered = filtered.filter((resource) =>
        selectedResourceTypes.some(
          (type) => type.id === resource.resourceType?.id
        )
      );
    }

    // Sort resources
    filtered.sort((a, b) => {
      switch (resourceSortBy) {
        case "name":
          return a.name?.localeCompare(b.name) || 0;
        case "type":
          return (a.resourceType?.name || "").localeCompare(
            b.resourceType?.name || ""
          );
        case "date":
        default:
          const aDate = new Date(a.resourceDate || a.createdAt);
          const bDate = new Date(b.resourceDate || b.createdAt);
          return bDate - aDate;
      }
    });

    return filtered;
  }, [
    resources,
    resourceSearchTerm,
    selectedResourceTags,
    selectedResourceTypes,
    resourceSortBy,
  ]);

  // Get unique resource types for filtering
  const resourceTypes = useMemo(() => {
    const types = new Set();
    resources.forEach((resource) => {
      if (resource.resourceType?.name) {
        types.add(
          JSON.stringify({
            id: resource.resourceType.id,
            name: resource.resourceType.name,
          })
        );
      }
    });
    return Array.from(types).map((type) => JSON.parse(type));
  }, [resources]);

  // User management
  const members = useMemo(() => {
    return users.filter((user) => user.role === "member");
  }, [users]);

  const admins = useMemo(() => {
    return users.filter((user) => user.role === "admin");
  }, [users]);

  const handleImageError = () => {
    setImageError(true);
  };

  // Handlers
  const handleUpdateOrganization = async (updatedData) => {
    updateOrganization(
      { id, data: updatedData },
      {
        onSuccess: () => {
          setIsEditing(false);
          queryClient.invalidateQueries(["organization", id]);
        },
      }
    );
  };

  const handleRemoveAdmin = (userId) => {
    // When demoting an admin, we're essentially subscribing them as a regular member
    subscribeToOrg(
      {
        organizationId: id,
        userId,
        role: "subscriber",
      },
      {
        onSuccess: () => {
          // Invalidate queries to refresh the data
          queryClient.invalidateQueries(["members", id]);
        },
      }
    );
  };

  // Helper functions for resource management
  const getResourceTagCount = (tagId) => {
    return resources.filter((resource) =>
      resource.tags?.some((tag) => tag.id === tagId)
    ).length;
  };

  const clearResourceFilters = () => {
    setResourceSearchTerm("");
    setSelectedResourceTags([]);
    setSelectedResourceTypes([]);
  };

  const hasActiveResourceFilters =
    resourceSearchTerm ||
    selectedResourceTags.length > 0 ||
    selectedResourceTypes.length > 0;

  const isPageLoading = isUnassignedOrganization ? resourcesLoading : orgLoading;

  if (isPageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <LoadingSkeleton lines={5} height="32px" width="100%" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8 w-11/12 max-w-11/12">
        {/* Edit Organization Modal */}
        {isEditing && (
          <Modal
            onClose={() => setIsEditing(false)}
            maxWidth="lg:w-1/2 w-11/12 max-w-[95vw] mx-auto"
            className="md:mt-10 mt-4"
          >
            <div className="text-gray-700 bg-white">
              <AddOrganizationForm
                onSubmit={handleUpdateOrganization}
                initialValues={organization}
                isEditing={isEditing}
                tags={tags}
              />
            </div>
          </Modal>
        )}
        {/* Header Section with Navigation and Edit Button */}
        {(canEditOrganization || (isAdmin && organization.tenantId === systemUser.tenantId)) && (
          <div className="mb-8 flex flex-col-reverse sm:flex-row justify-between items-center gap-4 ">
            {isAdmin && organization.tenantId === systemUser.tenantId && (
              <Tabs
                activeTab={activeView}
                onChange={setActiveView}
                fontSize="text-md"
              >
                <Tab id="details" label="Organization Details" />
                {isAdmin && <Tab id="people" label="People Management" />}
              </Tabs>
            )}
            {canEditOrganization && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg
                border border-gray-200/80 hover:border-gray-300/80
                shadow-sm hover:shadow-md transition-all duration-200
                text-gray-700 hover:text-gray-900
                text-sm font-medium"
              >
                <FaEdit className="text-[15px] text-gray-500" />
                <span>Edit Organization</span>
              </button>
            )}
          </div>
        )}

        {/* Organization Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
          <div className="p-8">
            {/* Organization Image and Basic Info */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
              <div className="flex-shrink-0">
                {organization.imageUrl && !imageError ? (
                  <div className="w-32 h-32 bg-gray-50 rounded-xl shadow-md overflow-hidden">
                    <div className="w-full h-full p-4 flex items-center justify-center">
                      <Image
                        src={organization.imageUrl}
                        alt={organization.name}
                        width={128}
                        height={128}
                        className="w-auto h-auto max-w-full max-h-full object-contain"
                        onError={handleImageError}
                      />
                    </div>
                  </div>
                ) : (
                  <PlaceholderAvatar name={organization.name} />
                )}
              </div>

              <div className="flex-1 text-center md:text-left">
                {organization.website ? (
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-700 transition-colors"
                  >
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 hover:text-blue-700 transition-colors">
                      {organization.name}
                    </h1>
                  </a>
                ) : (
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                    {organization.name}
                  </h1>
                )}

                {organization.website && (
                  <a
                    href={organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
                  >
                    Visit Website
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}

                {/* Tags */}
                {Array.isArray(organization.tags) &&
                  organization.tags.length > 0 && (
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                      {organization.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium 
                        bg-gradient-to-r from-slate-500 to-slate-600
                        text-white
                        shadow-[0_2px_8px_-2px_rgba(15,23,42,0.3)]
                        border border-slate-500/30
                        transition-all duration-300
                        hover:shadow-[0_4px_12px_-2px_rgba(15,23,42,0.4)]
                        hover:border-slate-400/50"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                {/* Description */}
                <p className="text-gray-600 leading-relaxed mb-4">
                  {organization.description}
                </p>

                {/* Social Media Button */}
                {socialMediaAccounts.length > 0 && (
                  <div className="mt-4">
                    <SocialMediaButton
                      onClick={() => setShowSocialMediaModal(true)}
                      count={socialMediaAccounts.length}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Content Sections */}
        {activeView === "details" && (
          <div className="space-y-8">
            {/* Events and Surveys - Combined Section */}
            {!isUnassignedOrganization &&
              (filteredEvents.length > 0 || organizationSurveys.length > 0) && (
              <Summary
                events={filteredEvents}
                // surveys={organizationSurveys}
                resources={[]}
              />
            )}

            {/* Enhanced Resources Section */}
            {(isUnassignedOrganization || (resources && resources.length > 0)) && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Resources ({filteredResources.length})
                      </h2>
                      <p className="text-gray-600">
                        {isUnassignedOrganization
                          ? "Discover resources that are not assigned to an organization"
                          : `Discover resources shared by ${organization.name}`}
                      </p>
                    </div>

                    {/* Resource Controls */}
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search */}
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search resources..."
                          value={resourceSearchTerm}
                          onChange={(e) =>
                            setResourceSearchTerm(e.target.value)
                          }
                          className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                        />
                      </div>

                      {/* Filter Toggle */}
                      <button
                        onClick={() =>
                          setIsResourceFiltersVisible(!isResourceFiltersVisible)
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                          hasActiveResourceFilters
                            ? "bg-blue-50 border-blue-200 text-blue-700"
                            : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <FaFilter className="text-sm" />
                        <span>Filters</span>
                        {hasActiveResourceFilters && (
                          <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                            {selectedResourceTags.length +
                              selectedResourceTypes.length}
                          </span>
                        )}
                        {isResourceFiltersVisible ? (
                          <FaChevronUp />
                        ) : (
                          <FaChevronDown />
                        )}
                      </button>

                      {/* Sort */}
                      <select
                        value={resourceSortBy}
                        onChange={(e) => setResourceSortBy(e.target.value)}
                        className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="date">Sort by Date</option>
                        <option value="name">Sort by Name</option>
                        <option value="type">Sort by Type</option>
                      </select>
                    </div>
                  </div>

                  {/* Filters Panel */}
                  {isResourceFiltersVisible && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Tag Filters */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Tags
                          </label>
                          <MultiSelect
                            options={tags.map((tag) => ({
                              ...tag,
                              count: getResourceTagCount(tag.id),
                            }))}
                            value={selectedResourceTags}
                            onChange={setSelectedResourceTags}
                            placeholder="Select tags..."
                            showCount={true}
                          />
                        </div>

                        {/* Type Filters */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filter by Type
                          </label>
                          <MultiSelect
                            options={resourceTypes}
                            value={selectedResourceTypes}
                            onChange={setSelectedResourceTypes}
                            placeholder="Select types..."
                          />
                        </div>
                      </div>

                      {/* Active Filters & Clear */}
                      {hasActiveResourceFilters && (
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {selectedResourceTags.map((tag) => (
                              <span
                                key={tag.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
                              >
                                {tag.name}
                                <button
                                  onClick={() =>
                                    setSelectedResourceTags((prev) =>
                                      prev.filter((t) => t.id !== tag.id)
                                    )
                                  }
                                  className="hover:text-blue-600"
                                >
                                  <FaTimes className="text-xs" />
                                </button>
                              </span>
                            ))}
                            {selectedResourceTypes.map((type) => (
                              <span
                                key={type.id}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm"
                              >
                                {type.name}
                                <button
                                  onClick={() =>
                                    setSelectedResourceTypes((prev) =>
                                      prev.filter((t) => t.id !== type.id)
                                    )
                                  }
                                  className="hover:text-green-600"
                                >
                                  <FaTimes className="text-xs" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={clearResourceFilters}
                            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                          >
                            Clear all filters
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Resources Content */}
                <div className="p-6">
                  {filteredResources.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-gray-400 mb-4">
                        <svg
                          className="w-16 h-16 mx-auto"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No resources found
                      </h3>
                      <p className="text-gray-600">
                        {hasActiveResourceFilters
                          ? "Try adjusting your filters to see more resources."
                          : isUnassignedOrganization
                          ? "There are no unassigned resources yet."
                          : "This organization hasn't shared any resources yet."}
                      </p>
                    </div>
                  ) : (
                    <Summary
                      events={[]}
                      surveys={[]}
                      resources={filteredResources}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {/* People Management View */}
        {activeView === "people" && isAdmin && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                People Management
              </h2>
              <Tabs activeTab={activeTab} onChange={setActiveTab}>
                <Tab id="members" label="Members">
                  <UserTable
                    users={members}
                    isLoading={usersLoading}
                    onPromoteToAdmin={(userId) => handlePromoteToAdmin(userId)}
                    onRemoveAdmin={(userId) => handleRemoveAdmin(userId)}
                    type="member"
                  />
                </Tab>
                <Tab id="admins" label="Administrators">
                  <UserTable
                    users={admins}
                    isLoading={usersLoading}
                    onPromoteToAdmin={(userId) => handlePromoteToAdmin(userId)}
                    onRemoveAdmin={(userId) => handleRemoveAdmin(userId)}
                    type="admin"
                  />
                </Tab>
              </Tabs>
            </div>
          </div>
        )}
      </div>

      {/* Social Media Modal */}
      <SocialMediaModal
        isOpen={showSocialMediaModal}
        onClose={() => setShowSocialMediaModal(false)}
        title="Social Media Accounts"
        entityName={organization?.name}
        accounts={socialMediaAccounts}
        loading={socialMediaLoading}
      />
    </div>
  );
};

export default OrganizationPage;
