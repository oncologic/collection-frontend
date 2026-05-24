"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FaBuilding,
  FaSearch,
  FaSpinner,
  FaTrash,
  FaCheck,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Modal from "./Modal";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useContextAuth } from "../context/authContext";

const ResourceDuplicateCleanupModal = ({
  onClose,
  selectedTenants = [],
}) => {
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [duplicateScanData, setDuplicateScanData] = useState(null);
  const [loadingDuplicateScan, setLoadingDuplicateScan] = useState(false);
  const [selectedDuplicateResourceIds, setSelectedDuplicateResourceIds] =
    useState(new Set());
  const [deletingDuplicateResources, setDeletingDuplicateResources] =
    useState(false);
  const [showDeleteDuplicatesConfirm, setShowDeleteDuplicatesConfirm] =
    useState(false);

  const { getAuthHeader } = useContextAuth();

  useEffect(() => {
    if (!selectedTenant && selectedTenants.length > 0) {
      const bloodTenant = selectedTenants.find(
        (tenant) =>
          tenant.id === "3197178c-9bce-4e06-8680-a4c0d52fcf8b" ||
          tenant.name === "Blood and Lymph System" ||
          tenant.name === "blood" ||
          tenant.name?.toLowerCase().includes("blood")
      );

      setSelectedTenant(bloodTenant || selectedTenants[0]);
    }
  }, [selectedTenant, selectedTenants]);

  useEffect(() => {
    setDuplicateScanData(null);
    setSelectedDuplicateResourceIds(new Set());
    setShowDeleteDuplicatesConfirm(false);
  }, [selectedTenant?.id]);

  const importTenantId =
    selectedTenant?.id ||
    selectedTenants?.[0]?.id ||
    process.env.NEXT_PUBLIC_COMMUNITY_TENANT ||
    "";

  const duplicateGroups = useMemo(
    () => duplicateScanData?.duplicateGroups || [],
    [duplicateScanData]
  );

  const duplicateSummary = useMemo(
    () =>
      duplicateScanData?.summary || {
        duplicateGroups: 0,
        duplicateResources: 0,
        duplicateCandidates: 0,
      },
    [duplicateScanData]
  );

  const formatDuplicateResourceDate = (value) => {
    if (!value) {
      return null;
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return null;
    }

    return parsedDate.toLocaleDateString();
  };

  const loadDuplicateScan = async ({ notifyWhenEmpty = true } = {}) => {
    if (!importTenantId) {
      toast.error("Select a tenant first");
      return;
    }

    setLoadingDuplicateScan(true);

    try {
      const headers = await getAuthHeader();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/import/resource-duplicates?tenantId=${importTenantId}`,
        {
          headers,
        }
      );

      const result = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));

      if (!response.ok) {
        throw new Error(result.message || "Failed to load duplicate resources");
      }

      const nextData = result.data || {
        duplicateGroups: [],
        summary: {
          duplicateGroups: 0,
          duplicateResources: 0,
          duplicateCandidates: 0,
        },
      };

      setDuplicateScanData(nextData);
      setSelectedDuplicateResourceIds(new Set());

      if (nextData.summary?.duplicateGroups > 0) {
        toast.success(
          `Found ${nextData.summary.duplicateGroups} duplicate title group${
            nextData.summary.duplicateGroups === 1 ? "" : "s"
          }`
        );
      } else if (notifyWhenEmpty) {
        toast.success("No duplicate resource titles found in this tenant");
      }
    } catch (error) {
      console.error("Duplicate scan error:", error);
      toast.error(error.message || "Failed to load duplicate resources");
    } finally {
      setLoadingDuplicateScan(false);
    }
  };

  const toggleDuplicateResourceSelection = (resourceId) => {
    setSelectedDuplicateResourceIds((prev) => {
      const next = new Set(prev);

      if (next.has(resourceId)) {
        next.delete(resourceId);
      } else {
        next.add(resourceId);
      }

      return next;
    });
  };

  const autoSelectLeastUsedDuplicates = () => {
    if (!duplicateGroups.length) {
      toast.error("Check for duplicates first");
      return;
    }

    const nextSelection = new Set();

    duplicateGroups.forEach((group) => {
      group.suggestedDeleteResourceIds?.forEach((resourceId) => {
        nextSelection.add(resourceId);
      });
    });

    setSelectedDuplicateResourceIds(nextSelection);

    if (nextSelection.size === 0) {
      toast.error("No duplicate resources are available to select");
      return;
    }

    toast.success(
      `Selected ${nextSelection.size} least-used duplicate resource${
        nextSelection.size === 1 ? "" : "s"
      }`
    );
  };

  const clearDuplicateResourceSelection = () => {
    setSelectedDuplicateResourceIds(new Set());
  };

  const handleDeleteSelectedDuplicates = async () => {
    const resourceIds = Array.from(selectedDuplicateResourceIds);

    if (!importTenantId) {
      toast.error("Select a tenant first");
      return;
    }

    if (resourceIds.length === 0) {
      toast.error("Select at least one duplicate resource to delete");
      return;
    }

    setDeletingDuplicateResources(true);

    try {
      const headers = await getAuthHeader();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/import/resource-duplicates`,
        {
          method: "DELETE",
          headers,
          body: JSON.stringify({
            tenantId: importTenantId,
            resourceIds,
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete duplicate resources");
      }

      setShowDeleteDuplicatesConfirm(false);
      setSelectedDuplicateResourceIds(new Set());

      if (result.deletedCount > 0) {
        toast.success(
          `Deleted ${result.deletedCount} duplicate resource${
            result.deletedCount === 1 ? "" : "s"
          }`
        );
      }

      if (result.skippedResourceIds?.length > 0) {
        toast.error(
          `${result.skippedResourceIds.length} selected resource${
            result.skippedResourceIds.length === 1 ? " was" : "s were"
          } not deleted`
        );
      }

      await loadDuplicateScan({ notifyWhenEmpty: false });
    } catch (error) {
      console.error("Delete duplicates error:", error);
      toast.error(error.message || "Failed to delete duplicate resources");
    } finally {
      setDeletingDuplicateResources(false);
    }
  };

  const hasScannedForDuplicates = duplicateScanData !== null;

  return (
    <>
      <Modal
        isOpen
        onClose={onClose}
        customClass="max-w-6xl"
        className="overflow-hidden"
      >
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-5">
          <div className="pr-10">
            <h2 className="text-2xl font-bold text-gray-900">
              Duplicate Cleanup
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Review resources with matching titles in a tenant, keep the most
              useful version, and bulk delete the duplicates you do not want to
              keep.
            </p>
          </div>
        </div>

        <div className="space-y-6 bg-white p-6">
          {selectedTenants.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
              <label className="block text-sm font-medium text-blue-900">
                Tenant
              </label>
              <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <select
                  value={selectedTenant?.id || ""}
                  onChange={(event) => {
                    const nextTenant = selectedTenants.find(
                      (tenant) => tenant.id === event.target.value
                    );
                    setSelectedTenant(nextTenant || null);
                  }}
                  className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 lg:max-w-md"
                >
                  {selectedTenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => loadDuplicateScan()}
                  disabled={loadingDuplicateScan || !importTenantId}
                  className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-blue-200 disabled:bg-blue-300"
                >
                  {loadingDuplicateScan ? (
                    <>
                      <FaSpinner className="mr-2 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <FaSearch className="mr-2" />
                      Check Duplicates
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-blue-700">
                Duplicate titles are checked only within the selected tenant.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Duplicate Titles
              </p>
              <p className="mt-3 text-3xl font-bold text-gray-900">
                {duplicateSummary.duplicateGroups}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Resources Involved
              </p>
              <p className="mt-3 text-3xl font-bold text-gray-900">
                {duplicateSummary.duplicateResources}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Suggested Deletes
              </p>
              <p className="mt-3 text-3xl font-bold text-gray-900">
                {duplicateSummary.duplicateCandidates}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Selected To Delete
              </p>
              <p className="mt-3 text-3xl font-bold text-gray-900">
                {selectedDuplicateResourceIds.size}
              </p>
            </div>
          </div>

          {duplicateGroups.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <button
                type="button"
                onClick={autoSelectLeastUsedDuplicates}
                disabled={loadingDuplicateScan || deletingDuplicateResources}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                Auto-Select Least Used
              </button>
              <button
                type="button"
                onClick={clearDuplicateResourceSelection}
                disabled={selectedDuplicateResourceIds.size === 0}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteDuplicatesConfirm(true)}
                disabled={
                  selectedDuplicateResourceIds.size === 0 ||
                  deletingDuplicateResources
                }
                className="inline-flex items-center rounded-lg border border-red-300 bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:border-red-200 disabled:bg-red-300"
              >
                {deletingDuplicateResources ? (
                  <>
                    <FaSpinner className="mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2" />
                    Delete Selected
                  </>
                )}
              </button>
            </div>
          )}

          {!importTenantId && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Select a tenant before checking for duplicate resource titles.
            </div>
          )}

          {!hasScannedForDuplicates && importTenantId && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              Use <span className="font-semibold">Check Duplicates</span> to
              load resources with matching titles and review what is already in
              use before deleting anything.
            </div>
          )}

          {hasScannedForDuplicates && duplicateGroups.length === 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
              No duplicate resource titles were found for the selected tenant.
            </div>
          )}

          {duplicateGroups.length > 0 && (
            <div className="space-y-4">
              {duplicateGroups.map((group) => {
                const keepResource = group.resources.find(
                  (resource) => resource.id === group.suggestedKeepResourceId
                );

                return (
                  <div
                    key={group.normalizedTitle}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="border-b border-gray-200 bg-gray-50 px-5 py-4">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {group.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {group.resourceCount} resources share this title
                          </p>
                        </div>

                        {keepResource && (
                          <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                            <FaCheck className="mr-2" />
                            Suggested keep has{" "}
                            {keepResource.counts.totalLinkedItems} linked item
                            {keepResource.counts.totalLinkedItems === 1
                              ? ""
                              : "s"}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="divide-y divide-gray-200">
                      {group.resources.map((resource) => {
                        const isSelected = selectedDuplicateResourceIds.has(
                          resource.id
                        );
                        const isSuggestedKeep =
                          resource.id === group.suggestedKeepResourceId;
                        const createdLabel = formatDuplicateResourceDate(
                          resource.createdAt
                        );
                        const updatedLabel = formatDuplicateResourceDate(
                          resource.updatedAt
                        );
                        const organizationNames = Array.isArray(
                          resource.organizations
                        )
                          ? resource.organizations
                              .map((organization) => organization?.name)
                              .filter(Boolean)
                          : [];

                        return (
                          <div
                            key={resource.id}
                            className={`px-5 py-4 ${
                              isSelected ? "bg-red-50/60" : "bg-white"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleDuplicateResourceSelection(resource.id)
                                }
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                              />

                              <div className="min-w-0 flex-1 space-y-3">
                                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-medium text-gray-900">
                                        {resource.name || "Untitled Resource"}
                                      </span>
                                      <span
                                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                          isSuggestedKeep
                                            ? "border-green-200 bg-green-50 text-green-700"
                                            : "border-red-200 bg-red-50 text-red-700"
                                        }`}
                                      >
                                        {isSuggestedKeep
                                          ? "Suggested Keep"
                                          : "Duplicate Candidate"}
                                      </span>
                                      {resource.status && (
                                        <span
                                          className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                                            resource.status === "approved"
                                              ? "border-blue-200 bg-blue-50 text-blue-700"
                                              : "border-amber-200 bg-amber-50 text-amber-700"
                                          }`}
                                        >
                                          {resource.status}
                                        </span>
                                      )}
                                    </div>

                                    <div className="mt-1 text-xs text-gray-500 break-all">
                                      {resource.url || "No URL"}
                                    </div>
                                  </div>

                                  <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-semibold text-gray-700">
                                    {resource.counts.totalLinkedItems} linked
                                    item
                                    {resource.counts.totalLinkedItems === 1
                                      ? ""
                                      : "s"}
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs">
                                  {[
                                    [
                                      "Collections",
                                      resource.counts.collectionCount,
                                    ],
                                    [
                                      "External Links",
                                      resource.counts.externalLinkCount,
                                    ],
                                    ["Ratings", resource.counts.ratingCount],
                                    [
                                      "Business Units",
                                      resource.counts.organizationCount,
                                    ],
                                  ].map(([label, value]) => (
                                    <span
                                      key={`${resource.id}-${label}`}
                                      className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-gray-700"
                                    >
                                      {label}: {value}
                                    </span>
                                  ))}
                                </div>

                                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                  <span>
                                    {organizationNames.length > 0 ? (
                                      <>
                                        <FaBuilding className="mr-1 inline" />
                                        {organizationNames.join(", ")}
                                      </>
                                    ) : (
                                      "No business units linked"
                                    )}
                                  </span>
                                  {createdLabel && (
                                    <span>Created {createdLabel}</span>
                                  )}
                                  {updatedLabel && (
                                    <span>Updated {updatedLabel}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      <DeleteConfirmationModal
        isOpen={showDeleteDuplicatesConfirm}
        onClose={() => {
          if (!deletingDuplicateResources) {
            setShowDeleteDuplicatesConfirm(false);
          }
        }}
        onConfirm={handleDeleteSelectedDuplicates}
        title="Delete Selected Duplicate Resources"
        message={`Delete ${selectedDuplicateResourceIds.size} selected duplicate resource${
          selectedDuplicateResourceIds.size === 1 ? "" : "s"
        }? This removes the resource and its linked collection, external link, rating, tag, and business unit associations.`}
        confirmLabel={
          deletingDuplicateResources ? "Deleting..." : "Delete Selected"
        }
        confirmDisabled={deletingDuplicateResources}
      />
    </>
  );
};

export default ResourceDuplicateCleanupModal;
