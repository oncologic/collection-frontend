"use client";
import { useState, useMemo } from "react";
import {
  useCreateOrganization,
  useOrganizations,
  useSubscribeToOrganization,
  useUnsubscribeFromOrganization,
  useUserSubscriptions,
} from "../hooks/useOrganizations";
import { useGetResoucesByOrganization } from "../hooks/useResources";
import LoadingSkeleton from "../components/LoadingSkeleton";
import OrganizationCard from "../components/OrganizationCard";
import Modal from "../components/Modal";
import AddOrganizationForm from "../components/forms/AddOrganization";
import OrganizationsList from "../components/organizations/OrganizationsList";
import { useTags } from "../hooks/useTags";
import { useUser } from "@clerk/nextjs";
import { useContextAuth } from "../context/authContext";
import Image from "next/image";
import { FaPlus, FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import MultiSelect from "../components/inputs/MultiSelect";
import { UNASSIGNED_ORGANIZATION_ID } from "../constants/organizations";

const loadingBars = [
  { width: "full", height: "4", lineGap: "2" },
  { width: "1/2", height: "4", lineGap: "2" },
  { width: "3/4", height: "4", lineGap: "2" },
];

// Mock function to add categories/tags if not present
function enhanceOrgs(organizations) {
  return organizations.map((org, i) => {
    if (org.isVirtual) {
      return org;
    }

    return {
      ...org,
      categories: org.categories || (i % 2 === 0 ? ["kidney"] : ["rare"]),
      tags: org.tags || ["research", "support", "community"],
    };
  });
}

const SubscriptionsTable = ({ organizations, onUnsubscribe, searchTerm }) => {
  const filteredOrgs = organizations.filter(
    (org) =>
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.acronym?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.tags?.some((tag) =>
        tag.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm ">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-slate-600 to-slate-700">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-2/5">
                Organization
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/4">
                Description
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/4">
                Focus Areas
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-white uppercase tracking-wider w-[10%]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredOrgs.map((org, index) => (
              <tr
                key={org.id}
                className={`hover:bg-gray-50/50 transition-colors ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
                }`}
              >
                <td className="px-6 py-4 w-2/5">
                  <div className="flex items-center">
                    {org.image ? (
                      <Image
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-lg mr-3 object-contain border border-gray-200"
                        src={org.image}
                        alt={org.name}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg mr-3 bg-blue-100 flex items-center justify-center border border-gray-200">
                        <span className="text-gray-700 font-semibold text-sm">
                          {org.name?.charAt(0).toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-col">
                      <div className="font-semibold text-gray-900">
                        {org.name}
                      </div>
                      {org.acronym && (
                        <div className="text-sm text-gray-500 font-medium">
                          {org.acronym}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 w-1/4">
                  <div className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                    {org.description || "No description available."}
                  </div>
                </td>
                <td className="px-6 py-4 w-1/4">
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {org.tags?.slice(0, 3).map((tag) => (
                      <span
                        key={tag.name}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap"
                      >
                        {tag.name}
                      </span>
                    ))}
                    {org.tags?.length > 3 && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                        +{org.tags.length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-right w-[10%]">
                  <button
                    onClick={() => onUnsubscribe(org)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Remove from Favorites
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredOrgs.length === 0 && (
        <div className="text-center py-8 text-gray-500 bg-gray-50/50">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-8 h-8 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.175-5.5-2.709M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            <span>No organizations found matching your search.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default function OrganizationsPage() {
  const { user } = useUser();
  const { isAdmin, isAdvocate } = useContextAuth();

  const { data: rawOrgs = [], isLoading: orgsLoading } = useOrganizations();
  const { data: unassignedResources = [] } = useGetResoucesByOrganization(
    UNASSIGNED_ORGANIZATION_ID
  );
  const { data: userSubscriptions = [] } = useUserSubscriptions();

  // Create a map of subscribed organization IDs for easier lookup
  const subscribedOrgIds = useMemo(() => {
    return userSubscriptions.reduce((acc, org) => {
      acc[org.id] = true;
      return acc;
    }, {});
  }, [userSubscriptions]);

  const unassignedOrganization = useMemo(() => {
    if (!unassignedResources.length) {
      return null;
    }

    const resourceCount = unassignedResources.length;

    return {
      id: UNASSIGNED_ORGANIZATION_ID,
      name: "Unassigned",
      description:
        resourceCount === 1
          ? "1 resource without an assigned organization."
          : `${resourceCount} resources without an assigned organization.`,
      tags: [],
      categories: [],
      isVirtual: true,
      resourceCount,
    };
  }, [unassignedResources]);

  const organizations = useMemo(() => {
    const enhancedOrganizations = enhanceOrgs(rawOrgs);

    return unassignedOrganization
      ? [unassignedOrganization, ...enhancedOrganizations]
      : enhancedOrganizations;
  }, [rawOrgs, unassignedOrganization]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showSubscriptionsModal, setShowSubscriptionsModal] = useState(false);
  const [subscriptionsSearchTerm, setSubscriptionsSearchTerm] = useState("");
  const [showSubscribed, setShowSubscribed] = useState(true);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);

  const { data: tags = [] } = useTags();

  // Helper function to count organizations by tag
  const getTagOrganizationCount = (tagId, filteredOrgs) => {
    return (
      filteredOrgs?.filter((org) => org.tags?.some((tag) => tag.id === tagId))
        .length || 0
    );
  };

  // Handler for clearing tag filters
  const handleClearTagFilters = () => {
    setSelectedTags([]);
  };

  // Handler for clearing all filters
  const handleClearAllFilters = () => {
    setSearchTerm("");
    setSelectedTags([]);
  };

  const filteredOrgs = useMemo(() => {
    return organizations.filter((org) => {
      // Filter by search term (name, description, acronym, tags)
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const inName = org.name?.toLowerCase().includes(search);
        const inAccronym = org.acronym?.toLowerCase().includes(search);
        const inDesc = org.description?.toLowerCase().includes(search);
        const inTags =
          org.tags?.some((t) => t.name?.toLowerCase().includes(search)) ||
          false;
        if (!inName && !inAccronym && !inDesc && !inTags) return false;
      }

      // Filter by selected tags
      if (selectedTags.length > 0) {
        const hasSelectedTag = selectedTags.some((selectedTag) =>
          org.tags?.some((orgTag) => orgTag.id === selectedTag.id)
        );
        if (!hasSelectedTag) return false;
      }

      return true;
    });
  }, [organizations, searchTerm, selectedTags]);

  const subscribedList = useMemo(() => {
    return filteredOrgs.filter((org) => subscribedOrgIds[org.id]);
  }, [filteredOrgs, subscribedOrgIds]);

  const allOrganizations = useMemo(() => {
    return filteredOrgs;
  }, [filteredOrgs]);

  const createOrg = useCreateOrganization();

  const handleAddOrganization = (org) => {
    createOrg.mutate(org, {
      onSuccess: () => {
        setIsModalOpen(false);
      },
    });
  };

  const subscribe = useSubscribeToOrganization();
  const unsubscribe = useUnsubscribeFromOrganization();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Sticky Top Navigation */}
      <div className="mt-20 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm Discover and subscribe to organizations in your field">
        <div className="w-11/12 mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title and Add Button */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Organizations
                </h1>
                <p className="text-gray-600 text-sm mt-1">
                  Discover and subscribe to organizations in your field
                </p>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="lg:hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-2 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  <FaPlus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search and Actions */}
            <div className="flex flex-col sm:flex-row gap-3 lg:flex-1 lg:max-w-2xl">
              <div className="relative flex-1">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Search organizations, descriptions, or focus areas..."
                />
              </div>

              <div className="flex gap-2">
                {/* Clear Search */}
                {(searchTerm || selectedTags.length > 0) && (
                  <button
                    onClick={handleClearAllFilters}
                    className="px-4 py-2.5 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Clear Filters
                  </button>
                )}

                {/* Add Organization - Desktop */}
                {(isAdmin || isAdvocate) && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="hidden lg:flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2.5 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
                  >
                    <FaPlus className="w-4 h-4" />
                    <span>Add Organization</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tag Filters Indicator */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-indigo-50 border-t border-gray-200">
            <span className="text-indigo-700 text-sm font-medium">
              Tag filters:
            </span>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800"
                >
                  {tag.name}
                  <button
                    onClick={() =>
                      setSelectedTags(
                        selectedTags.filter((t) => t.id !== tag.id)
                      )
                    }
                    className="ml-1 text-indigo-600 hover:text-indigo-900"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </span>
              ))}
              <button
                onClick={handleClearTagFilters}
                className="text-xs text-indigo-700 hover:text-indigo-900 underline"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Mobile Filter Toggle */}
        <div className="lg:hidden border-t border-gray-200">
          <button
            onClick={() => setIsFiltersVisible(!isFiltersVisible)}
            className="w-full flex items-center justify-between px-4 py-3 text-gray-600"
          >
            <span className="font-medium">Filters</span>
            {isFiltersVisible ? (
              <FaChevronUp className="w-4 h-4" />
            ) : (
              <FaChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Mobile Filters */}
        <div
          className={`${
            isFiltersVisible ? "block" : "hidden"
          } lg:hidden bg-white border-t border-gray-200 px-4 py-3`}
        >
          <div className="space-y-6">
            {/* Tags Filter - Mobile */}
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Filter by Tags</h3>
              <div className="mt-2">
                <MultiSelect
                  options={tags}
                  value={selectedTags}
                  onChange={setSelectedTags}
                  placeholder="Select tags..."
                  chipClassName="bg-indigo-100 text-indigo-800"
                />
                {selectedTags.length > 0 && (
                  <button
                    onClick={handleClearTagFilters}
                    className="text-xs text-gray-500 hover:text-blue-600 mt-1"
                  >
                    Clear tag filters
                  </button>
                )}
              </div>
            </div>

            {/* Apply Filters Button */}
            <button
              onClick={() => setIsFiltersVisible(false)}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row">
        {/* Content Area */}
        <div className="flex-1 p-6 md:p-4">
          <div className="w-11/12 mx-auto">
            {/* Favorites Section */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    My Favorites
                  </h2>
                  <p className="text-gray-600 text-sm mt-1">
                    Organizations you have added to your favorites
                  </p>
                </div>
                <button
                  onClick={() => setShowSubscribed(!showSubscribed)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  {showSubscribed ? "Hide" : "Show"}
                  <FaChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showSubscribed ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {showSubscribed && (
                <>
                  {subscribedList.length === 0 ? (
                    <div className="text-center py-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m4 0V9a1 1 0 011-1h4a1 1 0 011 1v12M13 7a1 1 0 11-2 0 1 1 0 012 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No favorites yet
                          </h3>
                          <p className="text-gray-600">
                            Add organizations to your favorites to keep up with
                            their events, surveys, and resources.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <OrganizationsList
                        organizations={subscribedList}
                        loading={orgsLoading}
                        onToggleFavorite={(orgId) => {
                          const org = subscribedList.find(
                            (o) => o.id === orgId
                          );
                          if (org) {
                            unsubscribe.mutate({
                              organizationId: org.id,
                              userId: user?.id,
                              role: "subscriber",
                            });
                          }
                        }}
                        favorites={subscribedList.map((org) => org.id)}
                        showFavoriteOnly={false}
                        searchTerm=""
                      />

                      {subscribedList.length > 20 && (
                        <div className="flex justify-center mt-6">
                          <button
                            onClick={() => setShowSubscriptionsModal(true)}
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            <span>
                              View All {subscribedList.length} Favorites in
                              Table
                            </span>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* Discover Section */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Discover Organizations
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                  Find new organizations and professional associations to add to
                  your favorites
                </p>
                {(searchTerm || selectedTags.length > 0) && (
                  <p className="text-sm text-blue-600 mt-2">
                    Showing {allOrganizations.length} filtered result
                    {allOrganizations.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              <OrganizationsList
                organizations={allOrganizations}
                loading={orgsLoading}
                onToggleFavorite={(orgId) => {
                  const org = allOrganizations.find((o) => o.id === orgId);
                  if (org) {
                    if (subscribedOrgIds[orgId]) {
                      unsubscribe.mutate({
                        organizationId: org.id,
                        userId: user?.id,
                        role: "subscriber",
                      });
                    } else {
                      subscribe.mutate({
                        organizationId: org.id,
                        userId: user?.id,
                        role: "subscriber",
                      });
                    }
                  }
                }}
                favorites={Object.keys(subscribedOrgIds)}
                showFavoriteOnly={false}
                searchTerm=""
              />

              {!orgsLoading && allOrganizations.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        No organizations found
                      </h3>
                      <p className="text-gray-600">
                        Try adjusting your search terms or filters to find
                        organizations.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Filters - Right side */}
        <div className="hidden lg:block w-64 flex-shrink-0 border-l border-gray-200 bg-white">
          <div className="sticky top-20 p-4">
            <div className="space-y-6">
              {/* Tags Filter - Desktop */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">
                  Filter by Tags
                </h3>
                <div className="mt-2">
                  <MultiSelect
                    options={tags}
                    value={selectedTags}
                    onChange={setSelectedTags}
                    placeholder="Select tags..."
                    chipClassName="bg-indigo-100 text-indigo-800"
                  />
                  {selectedTags.length > 0 && (
                    <button
                      onClick={handleClearTagFilters}
                      className="text-xs text-gray-500 hover:text-blue-600 mt-1"
                    >
                      Clear tag filters
                    </button>
                  )}
                </div>
              </div>

              {/* Tag Statistics */}
              {tags.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    Popular Tags
                  </h3>
                  <div className="space-y-2">
                    {tags
                      .map((tag) => ({
                        ...tag,
                        count: getTagOrganizationCount(
                          tag.id,
                          allOrganizations
                        ),
                      }))
                      .filter((tag) => tag.count > 0)
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 10)
                      .map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => {
                            const isSelected = selectedTags.some(
                              (t) => t.id === tag.id
                            );
                            if (isSelected) {
                              setSelectedTags(
                                selectedTags.filter((t) => t.id !== tag.id)
                              );
                            } else {
                              setSelectedTags([...selectedTags, tag]);
                            }
                          }}
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 transition-colors ${
                            selectedTags.some((t) => t.id === tag.id)
                              ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                              : "text-gray-700"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{tag.name}</span>
                            <span className="text-xs text-gray-500">
                              {tag.count}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {isModalOpen && (
        <Modal
          onClose={() => setIsModalOpen(false)}
          maxWidth="w-11/12 max-w-4xl"
        >
          <AddOrganizationForm
            onSubmit={handleAddOrganization}
            onClose={() => setIsModalOpen(false)}
            tags={tags}
          />
        </Modal>
      )}

      {showSubscriptionsModal && (
        <Modal
          onClose={() => setShowSubscriptionsModal(false)}
          maxWidth="w-11/12 max-w-6xl"
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  My Favorites
                </h2>
                <p className="text-gray-600 mt-1">
                  Manage your organization favorites
                </p>
              </div>
            </div>

            <div className="mb-6">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={subscriptionsSearchTerm}
                  onChange={(e) => setSubscriptionsSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Search your favorites..."
                />
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              <SubscriptionsTable
                organizations={subscribedList}
                onUnsubscribe={(org) =>
                  unsubscribe.mutate({
                    organizationId: org.id,
                    userId: user?.id,
                    role: "subscriber",
                  })
                }
                searchTerm={subscriptionsSearchTerm}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
