"use client";

import { useEffect, useMemo, useState } from "react";
import { FaCalendarAlt, FaCheck, FaRegStickyNote } from "react-icons/fa";
import Modal from "@/app/components/Modal";
import {
  buildResourceTimelineItems,
  formatResourceDuration,
} from "@/app/utils/resourceTimeline";

const toDateInputValue = (value) => {
  if (!value) return new Date().toISOString().slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
};

const formatShortDate = (value) => {
  const dateValue = toDateInputValue(value);
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date);
};

const pluralizeDays = (durationDays) =>
  `${durationDays} day${durationDays === 1 ? "" : "s"}`;

const getExistingTaskResourceIds = (externalLink) => {
  const taskResourceIds = new Set();

  (externalLink?.notations || []).forEach((notation) => {
    const customFields = notation.customFields || notation.custom_fields || {};
    const sourceResourceId =
      customFields.sourceResourceId || customFields.source_resource_id;

    if (sourceResourceId) {
      taskResourceIds.add(sourceResourceId);
    }
  });

  return taskResourceIds;
};

export const buildResourceTaskSources = (collection) => {
  return (collection?.externalLinks || [])
    .flatMap((externalLink) => {
      const existingTaskResourceIds = getExistingTaskResourceIds(externalLink);

      return (externalLink.resources || [])
        .map((linkResource) => {
          const resource = linkResource.resource || linkResource;
          const resourceId =
            linkResource.resourceId || resource?.id || linkResource.id;

          if (!resourceId || !resource) return null;

          return {
            key: `${externalLink.id}:${resourceId}`,
            externalLinkId: externalLink.id,
            externalLinkName:
              externalLink.name || externalLink.title || externalLink.url,
            externalLinkSortOrder: externalLink.sortOrder ?? 0,
            linkResourceId: linkResource.id,
            resourceId,
            resource,
            notes: linkResource.notes,
            orderPosition: linkResource.orderPosition ?? 0,
            disabled: existingTaskResourceIds.has(resourceId),
          };
        })
        .filter(Boolean);
    })
    .sort((a, b) => {
      const linkOrder =
        (a.externalLinkSortOrder ?? 0) - (b.externalLinkSortOrder ?? 0);
      if (linkOrder !== 0) return linkOrder;
      return (a.orderPosition ?? 0) - (b.orderPosition ?? 0);
    });
};

export default function ResourceTaskNotationModal({
  isOpen,
  collection,
  isCreating = false,
  onClose,
  onCreateTasks,
}) {
  const [startDate, setStartDate] = useState(
    toDateInputValue(collection?.startDate),
  );
  const [selectedKeys, setSelectedKeys] = useState([]);

  const taskSources = useMemo(
    () => buildResourceTaskSources(collection),
    [collection],
  );
  const selectableSources = useMemo(
    () => taskSources.filter((source) => !source.disabled),
    [taskSources],
  );

  useEffect(() => {
    if (!isOpen) return;
    setStartDate(toDateInputValue(collection?.startDate));
    setSelectedKeys([]);
  }, [collection?.startDate, isOpen]);

  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys]);
  const selectedSources = useMemo(
    () => taskSources.filter((source) => selectedKeySet.has(source.key)),
    [selectedKeySet, taskSources],
  );

  const scheduledTasks = useMemo(() => {
    const timelineItems = buildResourceTimelineItems(
      selectedSources.map((source) => source.resource),
      startDate,
    );

    return timelineItems.map((item, index) => ({
      ...selectedSources[index],
      startDate: item.startDate,
      endDate: item.endDate,
      durationDays: item.durationDays,
    }));
  }, [selectedSources, startDate]);

  const allSelectableSelected =
    selectableSources.length > 0 &&
    selectableSources.every((source) => selectedKeySet.has(source.key));

  const toggleResource = (key) => {
    setSelectedKeys((prev) =>
      prev.includes(key)
        ? prev.filter((selectedKey) => selectedKey !== key)
        : [...prev, key],
    );
  };

  const toggleAll = () => {
    setSelectedKeys(
      allSelectableSelected ? [] : selectableSources.map((source) => source.key),
    );
  };

  const handleCreate = async () => {
    if (!scheduledTasks.length || isCreating) return;
    await onCreateTasks(scheduledTasks);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-3xl"
      showCloseButton
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4 pr-8">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-blue-700">
              <FaRegStickyNote className="h-4 w-4" />
              <span>Task Notations</span>
            </div>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              Resources
            </h2>
          </div>

          <label className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            Start
            <span className="relative">
              <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-10 rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm font-normal text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </span>
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={toggleAll}
            disabled={selectableSources.length === 0}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-4 w-4 items-center justify-center rounded-sm border border-slate-300">
              {allSelectableSelected && <FaCheck className="h-2.5 w-2.5" />}
            </span>
            Select all
          </button>
          <span className="text-sm text-slate-500">
            {scheduledTasks.length} selected
          </span>
        </div>

        <div className="mt-4 max-h-[48vh] space-y-2 overflow-y-auto pr-1">
          {taskSources.length === 0 ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-5 text-center text-sm text-slate-500">
              No linked resources
            </div>
          ) : (
            taskSources.map((source) => {
              const isSelected = selectedKeySet.has(source.key);
              const scheduledTask = scheduledTasks.find(
                (task) => task.key === source.key,
              );
              const durationLabel = scheduledTask
                ? pluralizeDays(scheduledTask.durationDays)
                : formatResourceDuration(source.resource) || "1 day";

              return (
                <label
                  key={source.key}
                  className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-3 text-sm transition ${
                    source.disabled
                      ? "border-slate-100 bg-slate-50 text-slate-400"
                      : isSelected
                        ? "border-blue-200 bg-blue-50/70"
                        : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={source.disabled}
                    onChange={() => toggleResource(source.key)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-800">
                      {source.resource.name || "Untitled resource"}
                    </span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {source.externalLinkName || "Untitled link"}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1 text-xs">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                      {durationLabel}
                    </span>
                    {source.disabled ? (
                      <span className="text-slate-400">Created</span>
                    ) : scheduledTask ? (
                      <span className="text-blue-700">
                        {formatShortDate(scheduledTask.startDate)} -{" "}
                        {formatShortDate(scheduledTask.endDate)}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-md border border-slate-200 bg-white px-4 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!scheduledTasks.length || isCreating}
            className="h-10 rounded-md bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "Creating" : "Create"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
