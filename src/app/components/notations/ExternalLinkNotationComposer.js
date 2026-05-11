"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FaCalendarAlt,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaFileUpload,
  FaSpinner,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import EnhancedNotationEditor from "../common/EnhancedNotationEditor";
import CustomFieldsManager from "../forms/CustomFieldsManager";
import DynamicField from "../forms/DynamicField";
import FieldTemplates from "../forms/FieldTemplates";
import TagInput from "../inputs/TagInput";
import { useDebounce } from "@/app/hooks/useDebounce";
import { useContextAuth } from "@/app/context/authContext";
import { updateNotation, deleteNotation } from "@/app/api/collectionsApi";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateAttachment } from "@/app/hooks/useAttachments";
import { useNotationTemplates } from "@/app/hooks/useNotationTemplates";
import { normalizeDateInputValue } from "@/app/utils/general";

const VISIBILITY_OPTIONS = [
  { id: "private", label: "Only Me" },
  { id: "unlisted", label: "Collaborators" },
  { id: "public", label: "Public" },
];

const CATEGORY_OPTIONS = [
  { id: "Idea", label: "Idea" },
  { id: "Action", label: "Action" },
  { id: "Thought", label: "Thought" },
  { id: "Question", label: "Question" },
  { id: "Observation", label: "Observation" },
];

const STATUS_OPTIONS = [
  { id: "Pending", label: "Pending" },
  { id: "In Progress", label: "In Progress" },
  { id: "Waiting", label: "Waiting" },
  { id: "Completed", label: "Completed" },
  { id: "Cancelled", label: "Cancelled" },
  { id: "Archived", label: "Archived" },
];

const PRESET_OPTIONS = [
  {
    id: "todo",
    label: "Todo",
    category: "Action",
    status: "Pending",
    highlighted: false,
    accent: "bg-blue-50 text-blue-700",
  },
  {
    id: "note",
    label: "Note",
    category: "Observation",
    status: "Pending",
    highlighted: false,
    accent: "bg-teal-50 text-teal-700",
  },
  {
    id: "question",
    label: "Question",
    category: "Question",
    status: "Pending",
    highlighted: false,
    accent: "bg-purple-50 text-purple-700",
  },
];

const STATUS_FLOW = ["Pending", "In Progress", "Completed"];

const stripHtml = (value = "") =>
  value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();

const getUserTimezone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";

const COMMON_TIMEZONES = (() => {
  const userTimezone = getUserTimezone();
  const timezones = [
    userTimezone,
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Anchorage",
    "America/Honolulu",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];

  return [...new Set(timezones)];
})();

const buildInitialDraft = (notation, isCollaborator) => ({
  id: notation?.id,
  title: notation?.title || "Untitled note",
  notes: notation?.notes || "",
  category: notation?.category || "Observation",
  status: notation?.status || "Pending",
  highlighted: Boolean(notation?.highlighted),
  visibility: notation?.visibility || (isCollaborator ? "unlisted" : "private"),
  startDate: normalizeDateInputValue(
    notation?.startDate || notation?.start_date || notation?.date
  ),
  endDate: normalizeDateInputValue(
    notation?.endDate ||
      notation?.end_date ||
      notation?.startDate ||
      notation?.start_date ||
      notation?.date
  ),
  startTime: notation?.startTime
    ? String(notation.startTime).slice(0, 5)
    : "",
  endTime: notation?.endTime
    ? String(notation.endTime).slice(0, 5)
    : "",
  timezone: notation?.timezone || getUserTimezone(),
  tags: notation?.tags || [],
  templateId: notation?.templateId || null,
});

const buildCustomFieldDefinitions = (customFields = {}) => {
  if (!customFields || Object.keys(customFields).length === 0) {
    return [];
  }

  return Object.entries(customFields).map(([key, value]) => {
    let fieldType = "text";
    if (typeof value === "boolean") fieldType = "boolean";
    else if (typeof value === "number") fieldType = "number";
    else if (Array.isArray(value)) fieldType = "multiselect";
    else if (typeof value === "string") {
      if (value.match(/^\d{4}-\d{2}-\d{2}$/)) fieldType = "date";
      else if (value.match(/^https?:\/\//)) fieldType = "url";
      else if (value.includes("@") && value.includes(".")) fieldType = "email";
    }

    return {
      id: `field_${key}`,
      label: key
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
      type: fieldType,
      required: false,
      placeholder: "",
      options:
        fieldType === "multiselect" && Array.isArray(value)
          ? value.map((item) => ({ value: item, label: item }))
          : [],
    };
  });
};

const buildCustomFieldValues = (customFields = {}) => {
  if (!customFields || Object.keys(customFields).length === 0) {
    return {};
  }

  return Object.entries(customFields).reduce((accumulator, [key, value]) => {
    accumulator[`field_${key}`] = value;
    return accumulator;
  }, {});
};

const getDefaultFieldValue = (field) => {
  if (field.type === "multiselect") return [];
  if (field.type === "boolean") return false;
  return "";
};

const buildCustomFieldsPayload = (
  customFieldDefinitions = [],
  customFieldValues = {}
) => {
  if (!customFieldDefinitions.length) {
    return {};
  }

  const customFields = {};

  customFieldDefinitions.forEach((field) => {
    const fieldKey = field.id.startsWith("field_")
      ? field.id.replace("field_", "")
      : field.label
          .trim()
          .toLowerCase()
          .replace(/\s+(.)/g, (_, letter) => letter.toUpperCase())
          .replace(/^\w/, (character) => character.toLowerCase());
    const value = customFieldValues[field.id];

    if (value !== undefined && value !== null && value !== "") {
      customFields[fieldKey] = value;
      return;
    }

    switch (field.type) {
      case "multiselect":
        customFields[fieldKey] = [];
        break;
      case "boolean":
        customFields[fieldKey] = false;
        break;
      case "number":
        customFields[fieldKey] = null;
        break;
      default:
        customFields[fieldKey] = null;
        break;
    }
  });

  return customFields;
};

const hasMeaningfulCustomFieldValue = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return value !== null && value !== undefined && value !== false;
};

const hasInlineRichContent = (value = "") => /<(img|table)\b/i.test(value);

const isEmptyNotation = (draft, customFieldValues = {}) => {
  const normalizedTitle = (draft.title || "").trim();
  const normalizedContent = stripHtml(draft.notes || "");
  const hasCustomFieldContent = Object.values(customFieldValues).some(
    hasMeaningfulCustomFieldValue
  );

  return (
    (!normalizedTitle || normalizedTitle === "Untitled note") &&
    normalizedContent.length === 0 &&
    !hasInlineRichContent(draft.notes || "") &&
    (!draft.tags || draft.tags.length === 0) &&
    !draft.startDate &&
    !draft.endDate &&
    !draft.startTime &&
    !draft.endTime &&
    !hasCustomFieldContent
  );
};

const buildPayload = (
  draft,
  { customFieldDefinitions = [], customFieldValues = {} } = {}
) => ({
  title: (draft.title || "").trim() || "Untitled note",
  notes: draft.notes || "",
  category: draft.category || null,
  status: draft.status || null,
  highlighted: Boolean(draft.highlighted),
  visibility: draft.visibility || "private",
  date: draft.startDate || null,
  startDate: draft.startDate || null,
  endDate: draft.endDate || draft.startDate || null,
  startTime: draft.startTime ? `${draft.startTime}:00` : null,
  endTime: draft.endTime ? `${draft.endTime}:00` : null,
  timezone:
    draft.startTime || draft.endTime ? draft.timezone || getUserTimezone() : null,
  tags: draft.tags || [],
  customFields: buildCustomFieldsPayload(
    customFieldDefinitions,
    customFieldValues
  ),
  templateId: draft.templateId || null,
});

const ExternalLinkNotationComposer = ({
  notation,
  externalLinkId,
  isCollaborator = false,
  isNewDraft = false,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { getAuthHeader } = useContextAuth();
  const { mutateAsync: uploadAttachmentMutation, isLoading: isUploadingFile } =
    useCreateAttachment();
  const { createTemplate } = useNotationTemplates(externalLinkId);
  const fileInputRef = useRef(null);
  const lastSavedSignatureRef = useRef("");
  const isPersistingRef = useRef(false);
  const [saveStatus, setSaveStatus] = useState("saved");
  const [showDetails, setShowDetails] = useState(false);
  const [showFieldManager, setShowFieldManager] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [draft, setDraft] = useState(() => buildInitialDraft(notation, isCollaborator));
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState(() =>
    buildCustomFieldDefinitions(notation?.customFields || {})
  );
  const [customFieldValues, setCustomFieldValues] = useState(() =>
    buildCustomFieldValues(notation?.customFields || {})
  );
  const debouncedComposerState = useDebounce(
    {
      draft,
      customFieldDefinitions,
      customFieldValues,
    },
    1200
  );

  useEffect(() => {
    const nextDraft = buildInitialDraft(notation, isCollaborator);
    const nextCustomFieldDefinitions = buildCustomFieldDefinitions(
      notation?.customFields || {}
    );
    const nextCustomFieldValues = buildCustomFieldValues(
      notation?.customFields || {}
    );

    setDraft(nextDraft);
    setCustomFieldDefinitions(nextCustomFieldDefinitions);
    setCustomFieldValues(nextCustomFieldValues);
    lastSavedSignatureRef.current = JSON.stringify(
      buildPayload(nextDraft, {
        customFieldDefinitions: nextCustomFieldDefinitions,
        customFieldValues: nextCustomFieldValues,
      })
    );
  }, [notation, isCollaborator]);

  const invalidateNoteQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["externalLinks"] });
    queryClient.invalidateQueries({ queryKey: ["notations", externalLinkId] });
  }, [externalLinkId, queryClient]);

  const persistDraft = useCallback(
    async (
      nextState = {
        draft,
        customFieldDefinitions,
        customFieldValues,
      },
      { silent = true } = {}
    ) => {
      const nextDraft = nextState?.draft;
      if (!nextDraft?.id || isPersistingRef.current) {
        return;
      }

      const payload = buildPayload(nextDraft, {
        customFieldDefinitions:
          nextState?.customFieldDefinitions || customFieldDefinitions,
        customFieldValues: nextState?.customFieldValues || customFieldValues,
      });
      const signature = JSON.stringify(payload);

      if (signature === lastSavedSignatureRef.current) {
        return;
      }

      isPersistingRef.current = true;
      setSaveStatus("saving");

      try {
        const headers = await getAuthHeader();
        await updateNotation(nextDraft.id, payload, headers);
        lastSavedSignatureRef.current = signature;
        setSaveStatus("saved");
        invalidateNoteQueries();

        if (!silent) {
          toast.success("Note saved");
        }
      } catch (error) {
        console.error("Failed to save notation:", error);
        setSaveStatus("error");

        if (!silent) {
          toast.error(error.message || "Failed to save note");
        }
      } finally {
        isPersistingRef.current = false;
      }
    },
    [
      customFieldDefinitions,
      customFieldValues,
      draft,
      getAuthHeader,
      invalidateNoteQueries,
    ]
  );

  useEffect(() => {
    const payloadSignature = JSON.stringify(
      buildPayload(debouncedComposerState.draft, {
        customFieldDefinitions: debouncedComposerState.customFieldDefinitions,
        customFieldValues: debouncedComposerState.customFieldValues,
      })
    );

    if (
      !debouncedComposerState.draft?.id ||
      payloadSignature === lastSavedSignatureRef.current
    ) {
      return;
    }

    persistDraft(debouncedComposerState);
  }, [debouncedComposerState, persistDraft]);

  const currentPreset = useMemo(
    () =>
      PRESET_OPTIONS.find(
        (preset) =>
          preset.category === draft.category && preset.status === draft.status
      )?.id || null,
    [draft.category, draft.status]
  );

  const applyPreset = (preset) => {
    setDraft((prev) => ({
      ...prev,
      category: preset.category,
      status: preset.status,
      highlighted: preset.highlighted,
    }));
  };

  const advanceStatus = () => {
    setDraft((prev) => {
      const currentIndex = STATUS_FLOW.indexOf(prev.status || "");
      const nextStatus =
        currentIndex >= 0 && currentIndex < STATUS_FLOW.length - 1
          ? STATUS_FLOW[currentIndex + 1]
          : prev.status;

      return {
        ...prev,
        status: nextStatus,
      };
    });
  };

  const handleCustomFieldDefinitionsChange = (nextDefinitions) => {
    setCustomFieldDefinitions(nextDefinitions);
    setCustomFieldValues((previousValues) => {
      const nextValues = {};

      nextDefinitions.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(previousValues, field.id)) {
          nextValues[field.id] = previousValues[field.id];
          return;
        }

        nextValues[field.id] = getDefaultFieldValue(field);
      });

      return nextValues;
    });
  };

  const handleCustomFieldChange = (fieldId, value) => {
    setCustomFieldValues((previousValues) => ({
      ...previousValues,
      [fieldId]: value,
    }));
  };

  const handleTemplateSelect = (template) => {
    const nextDefinitions = template?.fields || [];
    const nextValues = {};

    nextDefinitions.forEach((field) => {
      nextValues[field.id] = getDefaultFieldValue(field);
    });

    setShowTemplates(false);
    setCustomFieldDefinitions(nextDefinitions);
    setCustomFieldValues(nextValues);
    setDraft((previousDraft) => ({
      ...previousDraft,
      templateId: template?.id || null,
    }));
  };

  const handleSaveTemplate = async (templateData) => {
    if (!externalLinkId) {
      return;
    }

    try {
      const createdTemplate = await createTemplate({
        ...templateData,
        externalLinkId,
      });

      if (createdTemplate?.id) {
        setDraft((previousDraft) => ({
          ...previousDraft,
          templateId: createdTemplate.id,
        }));
      }
    } catch (error) {
      console.error("Failed to save notation template:", error);
    }
  };

  const handleClose = async () => {
    const hasUnsavedChanges =
      JSON.stringify(
        buildPayload(draft, {
          customFieldDefinitions,
          customFieldValues,
        })
      ) !== lastSavedSignatureRef.current;

    if (saveStatus === "saving" || hasUnsavedChanges) {
      await persistDraft({
        draft,
        customFieldDefinitions,
        customFieldValues,
      });
    }

    if (isNewDraft && isEmptyNotation(draft, customFieldValues)) {
      try {
        const headers = await getAuthHeader();
        await deleteNotation({ notationId: draft.id, headers });
        invalidateNoteQueries();
      } catch (error) {
        console.error("Failed to remove empty notation draft:", error);
      }
    }

    onClose?.();
  };

  const handleAttachFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("attachment", file);
      formData.append("title", file.name);
      formData.append("description", `Attached from note ${draft.id}`);
      formData.append("externalLinkId", externalLinkId);
      formData.append("visibility", draft.visibility || "private");

      await uploadAttachmentMutation(formData);
      toast.success("File added to attachments");
    } catch (error) {
      console.error("Failed to attach file:", error);
      toast.error(error.message || "Failed to upload file");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {PRESET_OPTIONS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  currentPreset === preset.id
                    ? preset.accent
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {preset.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  highlighted: !prev.highlighted,
                }))
              }
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                draft.highlighted
                  ? "bg-amber-50 text-amber-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Highlight
            </button>

            {STATUS_FLOW.includes(draft.status) &&
              draft.status !== STATUS_FLOW[STATUS_FLOW.length - 1] && (
                <button
                  type="button"
                  onClick={advanceStatus}
                  className="rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Next Status
                </button>
              )}
          </div>

          <input
            value={draft.title}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                title: event.target.value,
              }))
            }
            placeholder="Untitled note"
            className="w-full border-0 px-0 text-2xl font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            disabled={isUploadingFile}
          >
            {isUploadingFile ? (
              <FaSpinner className="animate-spin" />
            ) : (
              <FaFileUpload />
            )}
            Attach File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleAttachFile}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => setShowDetails((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Details
            {showDetails ? <FaChevronUp /> : <FaChevronDown />}
          </button>

          <button
            type="button"
            onClick={() =>
              persistDraft(
                {
                  draft,
                  customFieldDefinitions,
                  customFieldValues,
                },
                { silent: false }
              )
            }
            className="inline-flex items-center gap-2 rounded-lg bg-[#4263EB] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3b5bd9]"
          >
            <FaCheck />
            Save
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <FaTimes />
            Close
          </button>
        </div>
      </div>

      <div className="px-5 py-3">
        <div className="mb-3 flex items-center gap-3 text-sm">
          {saveStatus === "saving" && (
            <span className="inline-flex items-center gap-2 text-blue-600">
              <FaSpinner className="animate-spin" />
              Saving...
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="inline-flex items-center gap-2 text-green-600">
              <FaCheck />
              Saved
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-red-600">Save failed</span>
          )}
        </div>

        {showDetails && (
          <div className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Start Date
                </label>
                <div className="relative">
                  <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={draft.startDate}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        startDate: event.target.value,
                        endDate: prev.endDate || event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  End Date
                </label>
                <div className="relative">
                  <FaCalendarAlt className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={draft.endDate}
                    min={draft.startDate || undefined}
                    onChange={(event) =>
                      setDraft((prev) => ({
                        ...prev,
                        endDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Visibility
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {VISIBILITY_OPTIONS.filter(
                    (option) => !isCollaborator || option.id !== "public"
                  ).map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          visibility: option.id,
                        }))
                      }
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        draft.visibility === option.id
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <input
                  type="time"
                  value={draft.startTime}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      startTime: event.target.value,
                      timezone:
                        event.target.value || prev.endTime
                          ? prev.timezone || getUserTimezone()
                          : prev.timezone,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  type="time"
                  value={draft.endTime}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      endTime: event.target.value,
                      timezone:
                        prev.startTime || event.target.value
                          ? prev.timezone || getUserTimezone()
                          : prev.timezone,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Timezone
                </label>
                <select
                  value={draft.timezone}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      timezone: event.target.value,
                    }))
                  }
                  disabled={!draft.startTime && !draft.endTime}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  {COMMON_TIMEZONES.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={draft.category || ""}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      category: event.target.value || null,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select a category</option>
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={draft.status || ""}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      status: event.target.value || null,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select a status</option>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Highlighted
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[true, false].map((isHighlighted) => (
                    <button
                      key={String(isHighlighted)}
                      type="button"
                      onClick={() =>
                        setDraft((prev) => ({
                          ...prev,
                          highlighted: isHighlighted,
                        }))
                      }
                      className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                        draft.highlighted === isHighlighted
                          ? "border-blue-300 bg-blue-50 text-blue-700"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {isHighlighted ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tags
              </label>
              <TagInput
                value={draft.tags}
                onChange={(tags) =>
                  setDraft((prev) => ({
                    ...prev,
                    tags,
                  }))
                }
                placeholder="Add tags for filtering and search"
                className="w-full"
              />
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  Custom Fields
                </h3>
                <div className="flex flex-wrap gap-2">
                  {externalLinkId && (
                    <button
                      type="button"
                      onClick={() => setShowTemplates((prev) => !prev)}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      Templates
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowFieldManager((prev) => !prev)}
                    className="rounded-lg bg-[#4263EB] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3b5bd9]"
                  >
                    {showFieldManager ? "Hide Fields" : "Manage Fields"}
                  </button>
                </div>
              </div>

              {showTemplates && externalLinkId && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <FieldTemplates
                    externalLinkId={externalLinkId}
                    onSelectTemplate={handleTemplateSelect}
                  />
                </div>
              )}

              {showFieldManager && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <CustomFieldsManager
                    fields={customFieldDefinitions}
                    onFieldsChange={handleCustomFieldDefinitionsChange}
                    onSaveTemplate={handleSaveTemplate}
                  />
                </div>
              )}

              {customFieldDefinitions.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      {customFieldDefinitions.length} custom field
                      {customFieldDefinitions.length === 1 ? "" : "s"}
                    </p>
                    {draft.templateId && (
                      <span className="text-xs font-medium uppercase tracking-wide text-blue-600">
                        Template applied
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {customFieldDefinitions.map((field) => (
                      <div
                        key={field.id}
                        className={field.type === "textarea" ? "md:col-span-2" : ""}
                      >
                        <DynamicField
                          field={field}
                          value={customFieldValues[field.id]}
                          onChange={handleCustomFieldChange}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-gray-200">
          <EnhancedNotationEditor
            content={draft.notes}
            onChange={(nextValue) =>
              setDraft((prev) => ({
                ...prev,
                notes: nextValue,
              }))
            }
            notationId={draft.id}
            placeholder="Type / for headings, lists, images, tables, and more..."
            readOnly={false}
            showOCR={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ExternalLinkNotationComposer;
