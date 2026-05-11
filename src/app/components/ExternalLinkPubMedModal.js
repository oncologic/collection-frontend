"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FaSearch,
  FaSpinner,
  FaExternalLinkAlt,
  FaCheck,
  FaPlus,
  FaLink,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationTriangle,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useContextAuth } from "../context/authContext";
import { useCreateResource, useGetResources } from "../hooks/useResources";
import { useAddResourcesToExternalLink } from "../hooks/useExternalLinkResources";
import { useResourceTypes } from "../hooks/useMetadata";
import SelectField from "./inputs/SelectField";
import usePubMedSearch from "../pubmed/usePubMedSearch";
import PublicationCard from "../pubmed/PublicationCard";
import PublicationDetailModal from "../pubmed/PublicationDetailModal";
import {
  buildPubMedResourcePayload,
  findMatchingPubMedResource,
  getPubMedMatchLabel,
} from "../pubmed/pubmedResourceUtils";

const SORT_OPTIONS = [
  { id: "date", label: "Most Recent" },
  { id: "relevance", label: "Relevance" },
];

const normalizeTypeName = (value = "") => value.toLowerCase().trim();

const getStatusStyles = (status) => {
  switch (status) {
    case "linked":
      return "border-amber-100 bg-amber-50/80 text-amber-800";
    case "reuse-similar":
      return "border-purple-100 bg-purple-50/80 text-purple-800";
    case "reuse-existing":
      return "border-blue-100 bg-blue-50/80 text-blue-800";
    default:
      return "border-blue-100 bg-blue-50/80 text-blue-800";
  }
};

const ExternalLinkPubMedModal = ({
  externalLink,
  collectionId,
  externalLinkId,
  linkedResources = [],
  onClose,
}) => {
  const [searchInput, setSearchInput] = useState(externalLink?.name || "");
  const [selectedPublications, setSelectedPublications] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [detailPublication, setDetailPublication] = useState(null);
  const [selectedTenant, setSelectedTenant] = useState(null);
  const queryClient = useQueryClient();
  const {
    selectedTenants = [],
    setSelectedTenants,
    systemUser,
  } = useContextAuth();
  const { data: allResourcesData = [] } = useGetResources();
  const { data: resourceTypesData = [] } = useResourceTypes();
  const { mutateAsync: createResource } = useCreateResource();
  const addResourcesMutation = useAddResourcesToExternalLink();

  const {
    publications,
    isLoading,
    error,
    sortBy,
    page,
    totalResults,
    directPubMedUrl,
    resultsPerPage,
    setKeywords,
    setSortBy,
    setPage,
    formatDate,
    copyCitation,
    handleNextPage,
    handlePrevPage,
  } = usePubMedSearch();

  const linkedResourceIdSet = useMemo(
    () =>
      new Set(
        linkedResources
          .map(
            (resourceLink) =>
              resourceLink?.resourceId || resourceLink?.resource?.id
          )
          .filter(Boolean)
      ),
    [linkedResources]
  );

  const preferredTenantId =
    externalLink?.tenantId || externalLink?.collections?.[0]?.tenantId || null;
  const availableTenants = useMemo(() => {
    const tenantMap = new Map();

    selectedTenants.forEach((tenant) => {
      if (tenant?.id) {
        tenantMap.set(tenant.id, tenant);
      }
    });

    (systemUser?.tenants || []).forEach((tenant) => {
      if (tenant?.id && !tenantMap.has(tenant.id)) {
        tenantMap.set(tenant.id, {
          id: tenant.id,
          name: tenant.name,
          roles: tenant.roles || [],
        });
      }
    });

    return Array.from(tenantMap.values());
  }, [selectedTenants, systemUser]);

  const preferredSelectedTenant = useMemo(
    () =>
      selectedTenants.find((tenant) => tenant.id === preferredTenantId) || null,
    [preferredTenantId, selectedTenants]
  );

  const preferredTenant = useMemo(
    () =>
      availableTenants.find((tenant) => tenant.id === preferredTenantId) || null,
    [availableTenants, preferredTenantId]
  );

  useEffect(() => {
    const nextDefaultTenant =
      preferredSelectedTenant ||
      selectedTenants[0] ||
      preferredTenant ||
      availableTenants[0] ||
      null;

    if (
      !selectedTenant ||
      !availableTenants.some((tenant) => tenant.id === selectedTenant.id)
    ) {
      setSelectedTenant(nextDefaultTenant);
    }
  }, [
    availableTenants,
    preferredSelectedTenant,
    preferredTenant,
    selectedTenant,
    selectedTenants,
  ]);

  const handleTenantChange = (tenant) => {
    setSelectedTenant(tenant);

    if (tenant && !selectedTenants.some((item) => item.id === tenant.id)) {
      setSelectedTenants((prev = []) => [...prev, tenant]);
      queryClient.invalidateQueries({ queryKey: ["resources"] });
    }
  };

  const defaultArticleTypeId = useMemo(() => {
    if (!Array.isArray(resourceTypesData)) return null;

    const preferredTypeNames = [
      "journal article",
      "article",
      "publication",
      "paper",
      "research article",
    ];

    for (const preferredName of preferredTypeNames) {
      const exactMatch = resourceTypesData.find(
        (type) => normalizeTypeName(type?.name) === preferredName
      );
      if (exactMatch?.id) return exactMatch.id;
    }

    for (const preferredName of preferredTypeNames) {
      const partialMatch = resourceTypesData.find((type) =>
        normalizeTypeName(type?.name).includes(preferredName)
      );
      if (partialMatch?.id) return partialMatch.id;
    }

    return null;
  }, [resourceTypesData]);

  const publicationStatuses = useMemo(() => {
    const statuses = {};

    publications.forEach((publication) => {
      const match = findMatchingPubMedResource(
        publication,
        allResourcesData,
        linkedResourceIdSet
      );

      if (!match) {
        statuses[publication.id] = {
          status: "create",
          title: "New resource will be created",
          description:
            "This paper will be created as a tenant resource and attached to the external link.",
        };
        return;
      }

      if (match.isLinked) {
        statuses[publication.id] = {
          status: "linked",
          title: "Already linked here",
          description: `${
            match.resource?.name || "Existing resource"
          } is already attached to this external link. ${getPubMedMatchLabel(
            match
          )}.`,
        };
        return;
      }

      const reuseStatus =
        match.matchType === "similar-title" || match.matchType === "strong-title"
          ? "reuse-similar"
          : "reuse-existing";

      statuses[publication.id] = {
        status: reuseStatus,
        title:
          reuseStatus === "reuse-similar"
            ? "Similar resource will be reused"
            : "Existing resource will be reused",
        description: `${
          match.resource?.name || "Existing resource"
        } will be attached instead of creating a duplicate. ${getPubMedMatchLabel(
          match
        )}.`,
        match,
      };
    });

    return statuses;
  }, [allResourcesData, linkedResourceIdSet, publications]);

  const selectedSummary = useMemo(() => {
    return selectedPublications.reduce(
      (summary, publication) => {
        const status = publicationStatuses[publication.id]?.status || "create";
        if (status === "linked") {
          summary.linked += 1;
        } else if (status === "reuse-existing" || status === "reuse-similar") {
          summary.reused += 1;
        } else {
          summary.created += 1;
        }
        return summary;
      },
      { linked: 0, reused: 0, created: 0 }
    );
  }, [publicationStatuses, selectedPublications]);

  const isPublicationSelected = (publicationId) =>
    selectedPublications.some((publication) => publication.id === publicationId);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmedQuery = searchInput.trim();

    if (!trimmedQuery) {
      toast.error("Enter a PubMed search query");
      return;
    }

    setPage(1);
    setDetailPublication(null);
    setKeywords(trimmedQuery);
  };

  const handleSelectPublication = (publication) => {
    setSelectedPublications((prev) => {
      const isSelected = prev.some((item) => item.id === publication.id);
      if (isSelected) {
        return prev.filter((item) => item.id !== publication.id);
      }
      return [...prev, publication];
    });
  };

  const handleImportSelected = async () => {
    if (selectedPublications.length === 0) {
      toast.error("Select at least one paper to import");
      return;
    }

    if (!selectedTenant?.id) {
      toast.error("Select a tenant before importing PubMed papers");
      return;
    }

    setIsImporting(true);

    try {
      const attachableResources = [];
      const seenResourceIds = new Set();
      let createdCount = 0;
      let reusedCount = 0;
      let alreadyLinkedCount = 0;

      for (const publication of selectedPublications) {
        const match = findMatchingPubMedResource(
          publication,
          allResourcesData,
          linkedResourceIdSet
        );

        if (match?.isLinked) {
          alreadyLinkedCount += 1;
          continue;
        }

        let resourceId = match?.resourceId || null;

        if (resourceId) {
          reusedCount += 1;
        } else {
          const createdResource = await createResource(
            {
              __resourcePayload: buildPubMedResourcePayload(publication, {
                tenantId: selectedTenant.id,
                typeId: defaultArticleTypeId,
              }),
              __tenantHeaderIds: Array.from(
                new Set([
                  ...selectedTenants.map((tenant) => tenant.id),
                  selectedTenant.id,
                ])
              ),
            }
          );

          resourceId = createdResource?.id;

          if (!resourceId) {
            throw new Error("Created resource did not return an id");
          }

          createdCount += 1;
        }

        if (!seenResourceIds.has(resourceId)) {
          seenResourceIds.add(resourceId);
          attachableResources.push({ resourceId, notes: null });
        }
      }

      if (attachableResources.length > 0) {
        await addResourcesMutation.mutateAsync({
          collectionId,
          externalLinkId,
          resources: attachableResources,
        });
      }

      const summaryParts = [];
      if (createdCount > 0) {
        summaryParts.push(`created ${createdCount}`);
      }
      if (reusedCount > 0) {
        summaryParts.push(`reused ${reusedCount}`);
      }
      if (alreadyLinkedCount > 0) {
        summaryParts.push(`${alreadyLinkedCount} already linked`);
      }

      if (summaryParts.length > 0) {
        toast.success(`PubMed import complete: ${summaryParts.join(", ")}`);
      } else {
        toast.success("No new resources needed to be attached");
      }

      setSelectedPublications([]);
      setDetailPublication(null);
      onClose();
    } catch (error) {
      console.error("Failed to import PubMed papers:", error);
      toast.error(error.message || "Failed to import PubMed papers");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="w-full p-6 text-slate-700 sm:p-8">
      {detailPublication ? (
        <div className="space-y-4">
          <div className="pr-10">
            <h2 className="text-2xl font-bold text-slate-900">
              Publication Details
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Review this paper, then return to the results list to keep
              selecting papers for import.
            </p>
          </div>

          <PublicationDetailModal
            publication={detailPublication}
            isOpen={true}
            embedded={true}
            onBack={() => setDetailPublication(null)}
            onCopyCitation={copyCitation}
          />
        </div>
      ) : (
        <>
          <div className="mb-6 pr-10">
            <h2 className="text-2xl font-bold text-slate-900">Search PubMed</h2>
            <p className="mt-2 text-sm text-slate-500">
              Search PubMed, select papers, then create only the missing
              resources. Existing or similar resources are reused instead of
              duplicated.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <form onSubmit={handleSearchSubmit} className="space-y-4">
              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                  <FaSearch className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder='Search PubMed papers, for example "chromophobe renal cell carcinoma mitochondrial DNA"'
                    className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="w-full lg:w-48">
                  <select
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isLoading ? (
                    <FaSpinner className="animate-spin" />
                  ) : (
                    <FaSearch />
                  )}
                  <span>Search</span>
                </button>
              </div>
            </form>
          </div>

          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 text-sm text-slate-600">
                <p>
                  Resources created here will belong to{" "}
                  <span className="font-semibold text-slate-800">
                    {selectedTenant?.name || "the selected tenant"}
                  </span>
                  .
                </p>
                {preferredTenant &&
                  selectedTenant &&
                  preferredTenant.id !== selectedTenant.id && (
                    <p className="mt-1 text-xs text-slate-500">
                      This external link belongs to {preferredTenant.name}. New
                      PubMed resources will be created in {selectedTenant.name}
                      and then attached here.
                    </p>
                  )}
                {selectedPublications.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center rounded-full border border-blue-100 bg-white px-3 py-1 font-medium text-blue-700">
                      {selectedSummary.created} new
                    </span>
                    <span className="inline-flex items-center rounded-full border border-purple-100 bg-white px-3 py-1 font-medium text-purple-700">
                      {selectedSummary.reused} reused
                    </span>
                    <span className="inline-flex items-center rounded-full border border-amber-100 bg-white px-3 py-1 font-medium text-amber-700">
                      {selectedSummary.linked} already linked
                    </span>
                  </div>
                )}
              </div>

              <div className="flex w-full flex-col gap-3 md:w-auto md:min-w-[280px]">
                <SelectField
                  label="Tenant"
                  value={selectedTenant}
                  onChange={handleTenantChange}
                  options={availableTenants}
                  placeholder="Select tenant"
                />

                {directPubMedUrl && (
                  <a
                    href={directPubMedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50"
                  >
                    <FaExternalLinkAlt />
                    <span>Open on PubMed</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {availableTenants.length === 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <div className="flex items-start gap-2">
                <FaExclamationTriangle className="mt-0.5 flex-shrink-0" />
                <p>
                  No tenant is available for PubMed import right now. Select or
                  enable a tenant in the workspace first.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/40 p-4 shadow-sm sm:p-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-500">
                <div className="text-center">
                  <FaSpinner className="mx-auto mb-3 text-2xl animate-spin" />
                  <p>Searching PubMed...</p>
                </div>
              </div>
            ) : publications.length > 0 ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    Showing {publications.length} paper
                    {publications.length !== 1 ? "s" : ""} on page {page}
                    {totalResults ? ` of about ${totalResults} results` : ""}
                  </p>
                  {selectedPublications.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedPublications([])}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      Clear selection
                    </button>
                  )}
                </div>

                <div
                  className={
                    totalResults > resultsPerPage
                      ? "max-h-[48vh] overflow-y-auto pr-1"
                      : ""
                  }
                >
                  <div className="grid grid-cols-1 items-start gap-4 pb-1 xl:grid-cols-2">
                    {publications.map((publication) => {
                      const publicationStatus = publicationStatuses[publication.id];
                      const isSelected = isPublicationSelected(publication.id);

                      return (
                        <PublicationCard
                          key={publication.id}
                          publication={publication}
                          formatDate={formatDate}
                          onCopyCitation={copyCitation}
                          isSelected={isSelected}
                          onSelect={handleSelectPublication}
                          selectionMode={true}
                          onOpenDetails={setDetailPublication}
                          compact={true}
                          compactStatus={{
                            classes: getStatusStyles(publicationStatus?.status),
                            title: publicationStatus?.title,
                            description: publicationStatus?.description,
                            linkHref: publicationStatus?.match?.resource?.id
                              ? `/resources/${publicationStatus.match.resource.id}`
                              : null,
                            linkLabel: "Open matched resource",
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {totalResults > resultsPerPage && (
                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={handlePrevPage}
                      disabled={page <= 1}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FaChevronLeft />
                      <span>Previous</span>
                    </button>
                    <span className="text-sm text-slate-500">Page {page}</span>
                    <button
                      type="button"
                      onClick={handleNextPage}
                      disabled={page * resultsPerPage >= totalResults}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span>Next</span>
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 bg-white py-16 text-center text-slate-500">
                <p className="text-base font-medium text-slate-700">
                  Search PubMed to import papers as resources
                </p>
                <p className="mt-2 text-sm">
                  Selected papers will create only missing resources and then
                  attach them to this external link.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleImportSelected}
          disabled={
            selectedPublications.length === 0 || isImporting || !selectedTenant
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isImporting ? (
            <FaSpinner className="animate-spin" />
          ) : (
            <>
              <FaPlus />
              <FaCheck className="-ml-1" />
            </>
          )}
          <span>
            Create or Reuse and Attach ({selectedPublications.length})
          </span>
        </button>
      </div>
    </div>
  );
};

export default ExternalLinkPubMedModal;
