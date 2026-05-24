"use client";
import React, { useState, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useContextAuth } from "../context/authContext";
import {
  useOpportunities,
  useCreateOpportunity,
  useSaveOpportunity,
  useApplyToOpportunity,
  useOpportunityApplications,
  useReviewApplication,
} from "../hooks/useOpportunities";
import { useOrganizations } from "../hooks/useOrganizations";
import { useTags } from "../hooks/useTags";
import OpportunityCard from "../components/cards/OpportunityCard";
import OpportunityDetailModal from "../components/modals/OpportunityDetailModal";
import CreateOpportunityModal from "../components/modals/CreateOpportunityModal";
import ApplyToOpportunityModal from "../components/modals/ApplyToOpportunityModal";
import LoadingSkeleton from "../components/LoadingSkeleton";
import AllApplicationsView from "../components/AllApplicationsView";
import MultiSelect from "../components/inputs/MultiSelect";
import SelectField from "../components/inputs/SelectField";
import {
  FaSearch,
  FaFilter,
  FaPlus,
  FaBriefcase,
  FaHandsHelping,
  FaMapMarkerAlt,
  FaLaptopHouse,
  FaClock,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import toast from "react-hot-toast";

const FREQUENCY_OPTIONS = [
  { value: "once", label: "One-time" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "as_needed", label: "As Needed" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "deadline", label: "Application Deadline" },
  { value: "startDate", label: "Start Date" },
];

export default function OpportunitiesPage() {
  const { user, isSignedIn } = useUser();
  const { isAdvocate, isAdmin, selectedTenants } = useContextAuth();
  const router = useRouter();

  // Check if user is advocate or admin
  const canPostOpportunity =
    isAdmin || (Array.isArray(isAdvocate) && isAdvocate.length > 0);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("active"); // "active", "past", or "applications"
  const [selectedType, setSelectedType] = useState("all"); // all, volunteer, paid
  const [selectedLocation, setSelectedLocation] = useState("all"); // all, remote, onsite
  const [selectedFrequency, setSelectedFrequency] = useState("");
  const [selectedOrganization, setSelectedOrganization] = useState("");
  const [selectedTags, setSelectedTags] = useState([]); // Array of tag objects { id, name }
  const [sortBy, setSortBy] = useState("newest");

  // Transform options for SelectField (needs { id, name, value } format)
  const typeOptions = useMemo(
    () => [
      { id: "all", name: "All Types", value: "all" },
      { id: "volunteer", name: "Volunteer Only", value: "volunteer" },
      { id: "paid", name: "Paid Only", value: "paid" },
    ],
    []
  );

  const locationOptions = useMemo(
    () => [
      { id: "all", name: "All Locations", value: "all" },
      { id: "remote", name: "Remote", value: "remote" },
      { id: "onsite", name: "On-site", value: "onsite" },
    ],
    []
  );

  const frequencyOptions = useMemo(
    () => [
      { id: "", name: "All Frequencies", value: "" },
      ...FREQUENCY_OPTIONS.map((opt) => ({
        id: opt.value,
        name: opt.label,
        value: opt.value,
      })),
    ],
    []
  );

  const sortOptions = useMemo(
    () => [
      ...SORT_OPTIONS.map((opt) => ({
        id: opt.value,
        name: opt.label,
        value: opt.value,
      })),
    ],
    []
  );

  // Memoize selected option objects for SelectField
  const selectedTypeOption = useMemo(
    () => typeOptions.find((opt) => opt.value === selectedType) || null,
    [selectedType, typeOptions]
  );

  const selectedLocationOption = useMemo(
    () => locationOptions.find((opt) => opt.value === selectedLocation) || null,
    [selectedLocation, locationOptions]
  );

  const selectedFrequencyOption = useMemo(
    () =>
      frequencyOptions.find((opt) => opt.value === selectedFrequency) || null,
    [selectedFrequency, frequencyOptions]
  );

  const selectedSortOption = useMemo(
    () => sortOptions.find((opt) => opt.value === sortBy) || null,
    [sortBy, sortOptions]
  );

  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [applyingToOpportunity, setApplyingToOpportunity] = useState(null);

  // Fetch data - only fetch business units and tags if user is signed in
  // For public access, we'll use tags from opportunities
  const { data: organizations = [] } = useOrganizations();
  const { data: tags = [] } = useTags();

  const organizationOptions = useMemo(
    () => [
      { id: "", name: "All Business Units", value: "" },
      ...organizations.map((org) => ({
        id: org.id,
        name: org.name,
        value: org.id,
      })),
    ],
    [organizations]
  );

  const selectedOrganizationOption = useMemo(
    () =>
      organizationOptions.find((opt) => opt.value === selectedOrganization) ||
      null,
    [selectedOrganization, organizationOptions]
  );

  // Fetch data
  const filters = useMemo(
    () => ({
      isVolunteer:
        selectedType === "volunteer"
          ? true
          : selectedType === "paid"
          ? false
          : undefined,
      isRemote:
        selectedLocation === "remote"
          ? true
          : selectedLocation === "onsite"
          ? false
          : undefined,
      frequency: selectedFrequency,
      organizationId: selectedOrganization,
      availableOnly: viewMode === "active", // Only filter by availability for active opportunities
      showPast: viewMode === "past",
      sortBy,
    }),
    [
      selectedType,
      selectedLocation,
      selectedFrequency,
      selectedOrganization,
      viewMode,
      sortBy,
    ]
  );

  const { data: opportunities = [], isLoading } = useOpportunities(filters);
  const saveOpportunity = useSaveOpportunity();
  const applyToOpportunity = useApplyToOpportunity();

  // Get unique tags from opportunities
  const opportunityTags = useMemo(() => {
    const tagMap = new Map();
    opportunities.forEach((opp) => {
      opp.tags?.forEach((tag) => {
        if (!tagMap.has(tag.id)) {
          tagMap.set(tag.id, tag);
        }
      });
    });
    return Array.from(tagMap.values());
  }, [opportunities]);

  // Show tags as quick-select buttons if there are fewer than 10
  const showTagButtons =
    opportunityTags.length > 0 && opportunityTags.length < 10;

  // Filter opportunities locally by search term and tags
  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (opp) =>
          opp.title?.toLowerCase().includes(search) ||
          opp.description?.toLowerCase().includes(search) ||
          opp.organizations?.some((org) =>
            org.name?.toLowerCase().includes(search)
          )
      );
    }

    // Tag filter
    if (selectedTags.length > 0) {
      const selectedTagIds = selectedTags.map((tag) => tag.id);
      filtered = filtered.filter((opp) =>
        opp.tags?.some((tag) => selectedTagIds.includes(tag.id))
      );
    }

    return filtered;
  }, [opportunities, searchTerm, selectedTags]);

  // Summary statistics
  const stats = useMemo(() => {
    return {
      total: filteredOpportunities.length,
      volunteer: filteredOpportunities.filter((o) => o.isVolunteer).length,
      paid: filteredOpportunities.filter((o) => !o.isVolunteer).length,
      remote: filteredOpportunities.filter((o) => o.isRemote).length,
      onsite: filteredOpportunities.filter((o) => !o.isRemote).length,
    };
  }, [filteredOpportunities]);

  const handleSaveToggle = async (opportunity) => {
    if (!isSignedIn) {
      toast.error("Please sign in to save opportunities");
      return;
    }

    try {
      await saveOpportunity.mutateAsync({
        opportunityId: opportunity.id,
        save: !opportunity.isSaved,
      });
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleApply = (opportunity) => {
    // Allow anonymous applications - check will happen in modal if needed
    if (opportunity.hasApplied && isSignedIn) {
      toast.info("You have already applied to this opportunity");
      return;
    }

    setApplyingToOpportunity(opportunity);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Opportunities
            </h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              Find volunteer opportunities and positions to make a difference
            </p>
          </div>
          {isSignedIn && canPostOpportunity && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
            >
              <FaPlus className="w-4 h-4" />
              <span className="text-sm sm:text-base">Post Opportunity</span>
            </button>
          )}
        </div>

        {/* View Mode Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setViewMode("active")}
            className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
              viewMode === "active"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Active Opportunities
          </button>
          <button
            onClick={() => setViewMode("past")}
            className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
              viewMode === "past"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Past / Filled
          </button>
          {isSignedIn && (
            <>
              <button
                onClick={() => router.push("/applications")}
                className="px-3 sm:px-4 py-2 font-medium transition-colors text-gray-600 hover:text-gray-900 whitespace-nowrap text-sm sm:text-base"
              >
                My Applications
              </button>
            </>
          )}
          {canPostOpportunity && (
            <button
              onClick={() => setViewMode("applications")}
              className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
                viewMode === "applications"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Applications
            </button>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-6">
          <div className="bg-gradient-to-br from-white via-gray-50/50 to-gray-100/30 rounded-lg p-2 border border-gray-100/80 shadow-sm flex flex-col items-center justify-center">
            <div className="text-lg sm:text-xl font-bold text-gray-900">
              {stats.total}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600 font-medium mt-0.5">
              Total
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50/80 via-green-50/50 to-green-100/30 rounded-lg p-2 border border-green-100/80 shadow-sm flex flex-col items-center justify-center">
            <div className="text-lg sm:text-xl font-bold text-green-700">
              {stats.volunteer}
            </div>
            <div className="text-[10px] sm:text-xs text-green-600 font-medium mt-0.5">
              Volunteer
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50/80 via-blue-50/50 to-blue-100/30 rounded-lg p-2 border border-blue-100/80 shadow-sm flex flex-col items-center justify-center">
            <div className="text-lg sm:text-xl font-bold text-blue-700">
              {stats.paid}
            </div>
            <div className="text-[10px] sm:text-xs text-blue-600 font-medium mt-0.5">
              Paid
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-50/80 via-gray-50/50 to-gray-100/30 rounded-lg p-2 border border-gray-100/80 shadow-sm flex flex-col items-center justify-center">
            <div className="text-lg sm:text-xl font-bold text-gray-700">
              {stats.remote}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-600 font-medium mt-0.5">
              Remote
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-50/80 via-orange-50/50 to-orange-100/30 rounded-lg p-2 border border-orange-100/80 shadow-sm flex flex-col items-center justify-center">
            <div className="text-lg sm:text-xl font-bold text-orange-700">
              {stats.onsite}
            </div>
            <div className="text-[10px] sm:text-xs text-orange-600 font-medium mt-0.5">
              On-site
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search opportunities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            {/* Only show Filters button if there are more than 5 filters */}
            {(selectedTags.length > 0 || showFilters) && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
              >
                <FaFilter className="w-4 h-4" />
                <span className="text-sm sm:text-base">More Filters</span>
                <FontAwesomeIcon
                  icon={showFilters ? faChevronUp : faChevronDown}
                  className="w-4 h-4"
                />
              </button>
            )}
          </div>

          {/* Main Filters - Always Visible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Type Filter */}
            <div>
              <SelectField
                label="Opportunity Type"
                value={selectedTypeOption}
                onChange={(value) =>
                  setSelectedType(
                    typeof value === "object" ? value?.value || value : value
                  )
                }
                options={typeOptions}
              />
            </div>

            {/* Location Filter */}
            <div>
              <SelectField
                label="Location"
                value={selectedLocationOption}
                onChange={(value) =>
                  setSelectedLocation(
                    typeof value === "object" ? value?.value || value : value
                  )
                }
                options={locationOptions}
              />
            </div>

            {/* Frequency Filter */}
            <div>
              <SelectField
                label="Frequency"
                value={selectedFrequencyOption}
                onChange={(value) =>
                  setSelectedFrequency(
                    typeof value === "object" ? value?.value || value : value
                  )
                }
                options={frequencyOptions}
              />
            </div>

            {/* Business Unit Filter */}
            <div>
              <SelectField
                label="Business Unit"
                value={selectedOrganizationOption}
                onChange={(value) =>
                  setSelectedOrganization(
                    typeof value === "object" ? value?.value || value : value
                  )
                }
                options={organizationOptions}
              />
            </div>
          </div>

          {/* Quick Tag Selection - Show if fewer than 10 tags */}
          {showTagButtons && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {opportunityTags.map((tag) => {
                  const isSelected = selectedTags.some(
                    (selectedTag) => selectedTag.id === tag.id
                  );
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedTags(
                            selectedTags.filter(
                              (selectedTag) => selectedTag.id !== tag.id
                            )
                          );
                        } else {
                          setSelectedTags([...selectedTags, tag]);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        isSelected
                          ? "bg-blue-600 text-white hover:bg-blue-700"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                      style={
                        isSelected && tag.color
                          ? {
                              backgroundColor: tag.color,
                              color: "white",
                            }
                          : tag.color && !isSelected
                          ? {
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }
                          : {}
                      }
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Additional Filters Panel - Tags (if more than 10) and Sort */}
          {(showFilters || (selectedTags.length > 0 && !showTagButtons)) && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              {/* Tags Filter - Only show if there are 10+ tags or if tags are selected but buttons aren't shown */}
              {(!showTagButtons || selectedTags.length > 0) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {showTagButtons ? "All Tags" : "Tags"}
                  </label>
                  <MultiSelect
                    placeholder="Select tags..."
                    options={tags}
                    value={selectedTags}
                    onChange={setSelectedTags}
                  />
                </div>
              )}

              {/* Sort */}
              <div className="flex justify-end">
                <div className="w-48">
                  <SelectField
                    label="Sort By"
                    value={selectedSortOption}
                    onChange={(value) =>
                      setSortBy(
                        typeof value === "object"
                          ? value?.value || value
                          : value
                      )
                    }
                    options={sortOptions}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Applications View (for admins/advocates) */}
      {viewMode === "applications" && canPostOpportunity && (
        <AllApplicationsView
          opportunities={opportunities}
          organizations={organizations}
          tags={tags}
        />
      )}

      {/* Opportunities List */}
      {viewMode !== "applications" && (
        <div className="space-y-4">
          {isLoading ? (
            <LoadingSkeleton count={3} />
          ) : filteredOpportunities.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <FaBriefcase className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No opportunities found
              </h3>
              <p className="text-gray-600">
                Try adjusting your filters or check back later for new
                opportunities
              </p>
            </div>
          ) : (
            <>
              {filteredOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  onSaveToggle={handleSaveToggle}
                  onApply={handleApply}
                  onViewDetails={() => setSelectedOpportunity(opportunity)}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateOpportunityModal
          onClose={() => setShowCreateModal(false)}
          organizations={organizations}
          tags={tags}
        />
      )}

      {selectedOpportunity && (
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          onClose={() => setSelectedOpportunity(null)}
          onApply={handleApply}
          onSaveToggle={handleSaveToggle}
          organizations={organizations}
          tags={tags}
        />
      )}

      {applyingToOpportunity && (
        <ApplyToOpportunityModal
          opportunity={applyingToOpportunity}
          onClose={() => setApplyingToOpportunity(null)}
        />
      )}
    </div>
  );
}
