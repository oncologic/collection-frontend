"use client";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import InputField from "../inputs/InputField";
import ImageUploadCrop from "../inputs/ImageUploadCrop";
import MultiSelect from "../inputs/MultiSelect";
import SelectField from "../inputs/SelectField";
import SearchableSelectFieldWithCreate from "../inputs/SearchableSelectFieldWithCreate";
import MultiSelectWithCreate from "../inputs/MultiSelectWithCreate";
import { useCreateEventType, useCreateTag } from "@/app/hooks/useMetadata";
import { toast } from "react-hot-toast";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  FaBold,
  FaItalic,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaUndo,
  FaRedo,
  FaChevronDown,
  FaChevronUp,
  FaLock,
  FaLink,
  FaGlobeAmericas,
} from "react-icons/fa";
import CustomEditor from "../common/CustomEditor";
import { convertToUTC, convertUTCToDateTimeInputs } from "@/app/utils/general";
import { DateTime } from "luxon";
import { Controller } from "react-hook-form";
import { useContextAuth } from "@/app/context/authContext";

const TIME_ZONES = [
  { id: "America/New_York", name: "Eastern Time (ET)" },
  { id: "America/Chicago", name: "Central Time (CT)" },
  { id: "America/Denver", name: "Mountain Time (MT)" },
  { id: "America/Los_Angeles", name: "Pacific Time (PT)" },
  { id: "America/Anchorage", name: "Alaska Time (AKT)" },
  { id: "Pacific/Honolulu", name: "Hawaii Time (HT)" },
];

const calculateDuration = (startDate, startTime, endDate, endTime) => {
  if (!startDate || !startTime || !endDate || !endTime) return 0;

  const start = new Date(`${startDate}T${startTime}`);
  const end = new Date(`${endDate}T${endTime}`);

  const diffInMinutes = Math.round((end - start) / (1000 * 60));
  return diffInMinutes > 0 ? diffInMinutes : 0;
};

// Convert TIME_ZONES array to match the format expected by SelectField
const TIME_ZONES_OPTIONS = TIME_ZONES.map((zone) => ({
  id: zone.id,
  name: zone.name,
}));

export const defaultResourceValues = {
  typeId: null,
  url: "",
  description: "",
  createdDate: new Date().toISOString().split("T")[0],
  expertiseLevelId: null,
  targetAudienceId: "",
  videoUrl: "",
  imageKey: null,
  tags: [],
  name: "",
  organizations: [],
  startTime: "",
  endTime: "",
  durationMinutes: 0,
  timezone: { id: "America/Chicago", name: "Central Time (CT)" },
  visibility: "private",
  professional: { id: false, name: "Community" },
};

export default function AddEventForm({
  organizations,
  onSubmit,
  onClose,
  initialValues = defaultResourceValues,
  isLoading = false,
  eventTypes = [],
  sensitivityLevels = [],
  expertiseLevels = [],
  targetAudiences = [],
  tags = [],
  isAdmin = false,
  selectedTenants = [],
}) {
  const createEventTypeMutation = useCreateEventType();
  const createTagMutation = useCreateTag();
  const [selectedTags, setSelectedTags] = useState([]);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [showLocationDetails, setShowLocationDetails] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(
    initialValues.tenantId
      ? selectedTenants?.find((t) => t.id === initialValues.tenantId)
      : selectedTenants?.[0] || null
  );

  // Filter event types and tags by selected tenant
  const filteredEventTypes = Array.isArray(eventTypes)
    ? eventTypes.filter(
        (eventType) =>
          !eventType.tenantId || eventType.tenantId === selectedTenant?.id
      )
    : [];

  const filteredTags = Array.isArray(tags)
    ? tags.filter((tag) => tag.tenantId === selectedTenant?.id)
    : [];

  // Handlers for creating new items
  const handleCreateEventType = async (data) => {
    if (!selectedTenant?.id) {
      toast.error("Please select a tenant first");
      return;
    }

    try {
      const eventTypeData =
        typeof data === "string" ? { name: data, visibility: "tenant" } : data;

      const newEventType = await createEventTypeMutation.mutateAsync({
        name: eventTypeData.name,
        description: `Event type for ${selectedTenant.name}`,
        tenantId: selectedTenant.id,
        visibility: eventTypeData.visibility || "tenant",
      });

      // Select the newly created event type
      if (newEventType && newEventType.id) {
        setValue("typeId", newEventType);
      }
    } catch (error) {
      console.error("Error creating event type:", error);
    }
  };

  const handleCreateTag = async (tagData) => {
    if (!selectedTenant?.id) {
      toast.error("Please select a tenant first");
      return;
    }

    try {
      const newTag = await createTagMutation.mutateAsync({
        name: tagData.name,
        color: tagData.color,
        description: `Tag for ${selectedTenant.name}`,
        tenantId: selectedTenant.id,
        visibility: tagData.visibility || "tenant",
      });

      // Add the newly created tag to selected tags
      if (newTag && newTag.id) {
        const updatedTags = [...selectedTags, newTag];
        setSelectedTags(updatedTags);
        setValue(
          "tags",
          updatedTags.map((tag) => tag.id)
        );
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      ...initialValues,
      tenantId: initialValues.tenantId || selectedTenant?.id || "",
      visibility: initialValues.visibility || "private",
    },
  });

  useEffect(() => {
    if (initialValues.startDate && initialValues.endDate) {
      // Use the stored timezone or default to "America/Chicago"
      const timeZone = initialValues.timezone?.id || "America/Chicago";

      // Find the matching timezone object
      const selectedTimeZone = TIME_ZONES_OPTIONS.find(
        (zone) => zone.id === timeZone
      );

      // Set the timezone value as the full object for SelectField
      setValue("timezone", selectedTimeZone || TIME_ZONES_OPTIONS[1]);

      // Set the date and time values directly from initialValues
      setValue("startDate", initialValues.startDate);
      setValue("startTime", initialValues.startTime);
      setValue("endDate", initialValues.endDate);
      setValue("endTime", initialValues.endTime);

      // Also set the DOM input values directly
      const startDateInput = document.querySelector('input[name="startDate"]');
      const startTimeInput = document.querySelector('input[name="startTime"]');
      const endDateInput = document.querySelector('input[name="endDate"]');
      const endTimeInput = document.querySelector('input[name="endTime"]');

      if (startDateInput) startDateInput.value = initialValues.startDate;
      if (startTimeInput) startTimeInput.value = initialValues.startTime;
      if (endDateInput) endDateInput.value = initialValues.endDate;
      if (endTimeInput) endTimeInput.value = initialValues.endTime;
    }
  }, [initialValues, setValue]);

  useEffect(() => {
    register("imageKey");
  }, [register]);

  const handleTagsChange = (selected) => {
    setSelectedTags(selected);
    setValue(
      "tags",
      selected.map((tag) => tag.id)
    );
  };

  const handleOrganizationsChange = (selected) => {
    setSelectedOrganizations(selected);
    setValue(
      "organizations",
      selected.map((org) => org.id)
    );
  };

  const onSubmitWrapper = async (data) => {
    // Get the timezone ID from the timezone object
    const timezoneId = data.timezone?.id || data.timezone || "America/Chicago";

    // Create DateTime objects in the specified timezone
    const startDateTime = DateTime.fromFormat(
      `${data.startDate} ${data.startTime}`,
      "yyyy-MM-dd HH:mm",
      { zone: timezoneId }
    );

    const endDateTime = DateTime.fromFormat(
      `${data.endDate} ${data.endTime}`,
      "yyyy-MM-dd HH:mm",
      { zone: timezoneId }
    );

    const transformedData = {
      ...data,
      tenantId: selectedTenant?.id || "",
      startTime: startDateTime.toISO(),
      endTime: endDateTime.toISO(),
      timezone: timezoneId,
      expertiseLevelId: data.expertiseLevelId?.id || data.expertiseLevelId,
      typeId: data.typeId?.id || data.typeId,
      durationMinutes: parseInt(data.durationMinutes) || null,
      visibility: data.visibility,
      organizations: data.organizations,
      virtualEvent: Boolean(data.virtualEvent),
      inPersonEvent: Boolean(data.inPersonEvent),
      locationName: data.locationName || null,
      locationAddress: data.locationAddress || null,
      locationCity: data.locationCity || null,
      locationState: data.locationState?.toUpperCase() || null,
      locationPostal: data.locationPostal || null,
      locationCountry: data.locationCountry?.toUpperCase() || null,
      professional: data.professional.id || false,
    };

    onSubmit(transformedData);
  };

  useEffect(() => {
    // Transform initialValues.tags into the format expected by MultiSelect
    if (initialValues.tags?.length > 0) {
      const transformedTags = initialValues.tags
        .map((tag) => {
          // If tag is already in the correct format (has id and name), use it as is
          if (tag.id && tag.name) {
            return tag;
          }
          // If tag has tagId and tagName, transform it
          if (tag.tagId && tag.tagName) {
            return {
              id: tag.tagId,
              name: tag.tagName,
            };
          }
          // If tag is just an ID, find the matching tag from the tags array
          if (typeof tag === "number" || typeof tag === "string") {
            return tags.find((t) => t.id === tag) || null;
          }
          return null;
        })
        .filter(Boolean); // Remove any null values

      setSelectedTags(transformedTags);
      setValue(
        "tags",
        transformedTags.map((tag) => tag.id)
      );
    }
  }, [initialValues.tags, tags, setValue]);

  useEffect(() => {
    setSelectedOrganizations(initialValues.organizations || []);
  }, [initialValues.organizations]);

  useEffect(() => {
    // Find the matching event type object from all eventTypes array first
    // This ensures we can display event types even if they're from a different tenant
    if (initialValues.typeId) {
      const selectedEventType = eventTypes.find(
        (type) => type.id === initialValues.typeId
      );
      if (selectedEventType) {
        setValue("typeId", selectedEventType);
      }
    }
  }, [initialValues.typeId, eventTypes, setValue]);

  useEffect(() => {
    // Find the matching event type object from eventTypes array
    const selectedExpertiseLevel = expertiseLevels.find(
      (level) => level.id === initialValues.expertiseLevelId
    );
    if (selectedExpertiseLevel) {
      setValue("expertiseLevelId", selectedExpertiseLevel);
    }
  }, [initialValues.expertiseLevelId, expertiseLevels, setValue]);

  useEffect(() => {
    // Handle professional field initialization for editing
    if (
      initialValues.professional !== undefined &&
      typeof initialValues.professional === "boolean"
    ) {
      const professionalValue = initialValues.professional
        ? { id: true, name: "Professional" }
        : { id: false, name: "Community" };
      setValue("professional", professionalValue);
    }
  }, [initialValues.professional, setValue]);

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [StarterKit],
    content: initialValues.description || "",
    onUpdate: ({ editor }) => {
      // Update form value when editor content changes
      setValue("description", editor.getHTML());
    },
  });

  // Move the MenuBar component outside of the form component
  const MenuBar = ({ editor }) => {
    if (!editor) {
      return null;
    }

    return (
      <div className="border-b p-2 flex gap-1 sm:gap-2 flex-wrap">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 sm:p-2 rounded ${
            editor.isActive("bold") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
          title="Bold"
        >
          <FaBold className="text-sm sm:text-base" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 sm:p-2 rounded ${
            editor.isActive("italic") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
          title="Italic"
        >
          <FaItalic className="text-sm sm:text-base" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 sm:p-2 rounded ${
            editor.isActive("bulletList") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
          title="Bullet List"
        >
          <FaListUl className="text-sm sm:text-base" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 sm:p-2 rounded ${
            editor.isActive("orderedList") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
          title="Numbered List"
        >
          <FaListOl className="text-sm sm:text-base" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 sm:p-2 rounded ${
            editor.isActive("blockquote") ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
          title="Quote"
        >
          <FaQuoteLeft className="text-sm sm:text-base" />
        </button>
        <button
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 sm:p-2 rounded hover:bg-gray-100"
          title="Undo"
        >
          <FaUndo className="text-sm sm:text-base" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1.5 sm:p-2 rounded hover:bg-gray-100"
          title="Redo"
        >
          <FaRedo className="text-sm sm:text-base" />
        </button>
      </div>
    );
  };

  // Add watch for all relevant fields
  const watchedTypeId = watch("typeId");
  const watchedFields = watch([
    "title",
    "startDate",
    "startTime",
    "endDate",
    "endTime",
    "timezone",
    "typeId",
    "expertiseLevelId",
    "organizations",
    "tags",
    "registrationLink",
    "virtualEvent",
    "inPersonEvent",
    "locationName",
    "locationAddress",
    "locationCity",
    "locationState",
    "locationPostal",
    "locationCountry",
    "visibility",
    "tenantId",
  ]);

  // Replace the descriptionField with this updated version
  const descriptionField = (
    <div className="grid grid-cols-1 space-y-2">
      <label className="text-base sm:text-lg font-semibold text-gray-700">Description</label>
      <div className="border rounded-md overflow-hidden h-[600px]">
        <CustomEditor
          readOnly={false}
          showBorder={false}
          content={initialValues.description}
          onChange={(html) => setValue("description", html)}
          contextDetails={{
            title: watch("title") || "Untitled Event",
            startTime:
              watch("startDate") && watch("startTime")
                ? DateTime.fromFormat(
                    `${watch("startDate")} ${watch("startTime")}`,
                    "yyyy-MM-dd HH:mm",
                    { zone: watch("timezone")?.id || "America/Chicago" }
                  ).toISO()
                : null,
            endTime:
              watch("endDate") && watch("endTime")
                ? DateTime.fromFormat(
                    `${watch("endDate")} ${watch("endTime")}`,
                    "yyyy-MM-dd HH:mm",
                    { zone: watch("timezone")?.id || "America/Chicago" }
                  ).toISO()
                : null,
            timezone: watch("timezone")?.id || "America/Chicago",
            typeId: watch("typeId")?.id || watch("typeId") || null,
            expertiseLevelId:
              watch("expertiseLevelId")?.id ||
              watch("expertiseLevelId") ||
              null,
            organizations: selectedOrganizations || [],
            tags: selectedTags || [],
            virtualEvent: Boolean(watch("virtualEvent")),
            inPersonEvent: Boolean(watch("inPersonEvent")),
            locationName: watch("locationName") || null,
            locationAddress: watch("locationAddress") || null,
            locationCity: watch("locationCity") || null,
            locationState: watch("locationState")?.toUpperCase() || null,
            locationPostal: watch("locationPostal") || null,
            locationCountry: watch("locationCountry")?.toUpperCase() || null,
            registrationLink: watch("registrationLink") || null,
            description: watch("description") || "",
            durationMinutes:
              calculateDuration(
                watch("startDate"),
                watch("startTime"),
                watch("endDate"),
                watch("endTime")
              ) || 0,
          }}
          toolbar={MenuBar}
        />
      </div>
    </div>
  );

  const locationSection = (
    <div className="mt-6">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register("virtualEvent")}
              className="mr-2"
              id="virtualEvent"
            />
            <label htmlFor="virtualEvent">Virtual Event</label>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register("inPersonEvent")}
              className="mr-2"
              id="inPersonEvent"
            />
            <label htmlFor="inPersonEvent">In-Person Event</label>
          </div>
        </div>

        {/* Only show location details button if it's an in-person event */}
        {watch("inPersonEvent") && (
          <button
            type="button"
            onClick={() => setShowLocationDetails(!showLocationDetails)}
            className="flex items-center gap-2 text-lg font-semibold text-gray-700"
          >
            Location Details
            {showLocationDetails ? (
              <FaChevronUp className="w-4 h-4" />
            ) : (
              <FaChevronDown className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Location fields - only show if expanded and it's an in-person event */}
        {watch("inPersonEvent") && showLocationDetails && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <InputField
              id="locationName"
              name="locationName"
              label="Location Name"
              placeholder="Enter venue or location name"
              register={register}
            />
            <InputField
              id="locationAddress"
              name="locationAddress"
              label="Street Address"
              placeholder="Enter street address"
              register={register}
            />
            <InputField
              id="locationCity"
              name="locationCity"
              label="City"
              placeholder="Enter city"
              register={register}
            />
            <InputField
              id="locationState"
              name="locationState"
              label="State/Province"
              placeholder="2-letter code (e.g., CA)"
              maxLength={2}
              register={register}
            />
            <InputField
              id="locationPostal"
              name="locationPostal"
              label="Postal Code"
              placeholder="Enter postal/zip code"
              register={register}
            />
            <InputField
              id="locationCountry"
              name="locationCountry"
              label="Country"
              placeholder="3-letter code (e.g., USA)"
              maxLength={3}
              register={register}
            />
          </div>
        )}
      </div>
    </div>
  );

  // Add watch for the new fields
  const startDate = watch("startDate");
  const endDate = watch("endDate");
  const startTime = watch("startTime");
  const endTime = watch("endTime");

  // Update duration whenever dates or times change
  useEffect(() => {
    const duration = calculateDuration(startDate, startTime, endDate, endTime);
    setValue("durationMinutes", duration);
  }, [startDate, startTime, endDate, endTime, setValue]);

  // Replace the entire dateTimeSection with this updated version
  const dateTimeSection = (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="block font-medium text-sm sm:text-base text-gray-600 mb-1">
          Start Date
        </label>
        <input
          type="date"
          {...register("startDate", { required: true })}
          className="mt-1 block w-full py-2 px-3 sm:px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
        />
      </div>
      <div className="space-y-2">
        <label className="block font-medium text-sm sm:text-base text-gray-600 mb-1">
          Start Time
        </label>
        <input
          type="time"
          {...register("startTime", { required: true })}
          className="mt-1 block w-full py-2 px-3 sm:px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
        />
      </div>

      <div className="space-y-2">
        <label className="block font-medium text-sm sm:text-base text-gray-600 mb-1">End Date</label>
        <input
          type="date"
          {...register("endDate", { required: true })}
          className="mt-1 block w-full py-2 px-3 sm:px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
        />
      </div>

      <div className="space-y-2">
        <label className="block font-medium text-sm sm:text-base text-gray-600 mb-1">End Time</label>
        <input
          type="time"
          {...register("endTime", { required: true })}
          className="mt-1 block w-full py-2 px-3 sm:px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500 text-sm sm:text-base"
        />
      </div>

      <div className="sm:col-span-2">
        <SelectField
          id="timezone"
          name="timezone"
          label="Time Zone"
          control={control}
          options={TIME_ZONES_OPTIONS}
          required={true}
        />
      </div>
    </div>
  );

  if (isLoading || !eventTypes.length) {
    return (
      <div className="min-h-1/2 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg p-4 sm:p-6 md:p-8 md:w-5/6 w-full">
          <div className="w-3/4 h-6 sm:h-8 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="w-full h-3 sm:h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-2 sm:p-4">
      <form
        onSubmit={handleSubmit(onSubmitWrapper)}
        className="text-gray-700 text-center md:text-left w-full mx-auto bg-white p-4 sm:p-6 md:p-8 max-w-full"
        encType="multipart/form-data"
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-700 mb-6 sm:mb-8">
          {initialValues.id ? "Edit Event" : "Add New Event"}
        </h1>

        <div className="flex flex-col space-y-2">
          {/* Show readonly tenant if editing and not admin */}
          {initialValues.tenantId && !isAdmin && selectedTenant && (
            <div className="flex flex-col space-y-2">
              <label className="text-base sm:text-lg font-semibold text-gray-700">
                Tenant
              </label>
              <div className="px-3 py-2 border rounded-lg bg-gray-50 text-gray-700 capitalize text-sm sm:text-base">
                {selectedTenant.name}
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-4 bg-blue-50 p-3 sm:p-4 border border-b-2 border-blue-100 rounded-lg">
            {isAdmin && selectedTenants?.length > 1 && (
              <SelectField
                name="tenantId"
                control={control}
                label="Select Tenant"
                options={selectedTenants}
                placeholder="Select a tenant"
                value={selectedTenant}
                onChange={(tenant) => {
                  setSelectedTenant(tenant);
                  setValue("tenantId", tenant.id);
                  // Clear event type and tags when tenant changes
                  setValue("typeId", "");
                  setSelectedTags([]);
                  setValue("tags", []);
                }}
              />
            )}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <div className="w-full sm:w-1/3">
                <SelectField
                  name="professional"
                  control={control}
                  label="Event Type"
                  options={[
                    { id: true, name: "Professional" },
                    { id: false, name: "Community" },
                  ]}
                  placeholder="Medical Professionals or Community"
                  required={true}
                />
              </div>

              {/* Visibility Controls */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <Controller
                  name="visibility"
                  control={control}
                  defaultValue={initialValues.visibility || "private"}
                  render={({ field }) => (
                    <>
                      <button
                        type="button"
                        onClick={() => field.onChange("private")}
                        className={`px-3 sm:px-4 py-1.5 sm:py-1 rounded-md flex items-center gap-1.5 sm:gap-2 transition-all text-sm ${
                          field.value === "private"
                            ? "bg-blue-100 text-blue-700 border border-blue-300"
                            : "bg-white text-gray-500 border border-gray-200 hover:bg-blue-50"
                        }`}
                      >
                        <FaLock className="text-xs sm:text-sm" />
                        <span className="text-xs sm:text-sm">Private</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("unlisted")}
                        className={`px-3 sm:px-4 py-1.5 sm:py-1 rounded-md flex items-center gap-1.5 sm:gap-2 transition-all text-sm ${
                          field.value === "unlisted"
                            ? "bg-blue-100 text-blue-700 border border-blue-300"
                            : "bg-white text-gray-500 border border-gray-200 hover:bg-blue-50"
                        }`}
                      >
                        <FaLink className="text-xs sm:text-sm" />
                        <span className="text-xs sm:text-sm">Unlisted</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("public")}
                        disabled={!isAdmin}
                        className={`px-3 sm:px-4 py-1.5 sm:py-1 rounded-md flex items-center gap-1.5 sm:gap-2 transition-all text-sm ${
                          field.value === "public"
                            ? "bg-green-100 text-green-700 border border-green-300"
                            : "bg-white text-gray-500 border border-gray-200"
                        } ${
                          !isAdmin
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-green-50"
                        }`}
                      >
                        <FaGlobeAmericas className="text-xs sm:text-sm" />
                        <span className="text-xs sm:text-sm">Public</span>
                        {!isAdmin && (
                          <span className="text-xs hidden sm:inline">(Admin only)</span>
                        )}
                      </button>
                    </>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Rest of the form fields */}
          <div className="grid grid-cols-1 space-y-2  pt-2">
            <InputField
              id="title"
              name="title"
              label="Name"
              placeholder="Enter event name"
              register={register}
              required={true}
            />
          </div>

          <div className="flex flex-col space-y-6 mt-4">
            {dateTimeSection}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              {/* <div className="space-y-2">
                <label className="block font-medium text-gray-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  {...register("startDate", { required: true })}
                  className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                />
              </div> */}

              {/* Start Time */}
              {/* <div className="space-y-2">
                <label className="block font-medium text-gray-600 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  {...register("startTime", { required: true })}
                  className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                />
              </div> */}

              {/* End Date */}
              {/* <div className="space-y-2">
                <label className="block font-medium text-gray-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  {...register("endDate", { required: true })}
                  className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                />
              </div> */}

              {/* End Time */}
              {/* <div className="space-y-2">
                <label className="block font-medium text-gray-600 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  {...register("endTime", { required: true })}
                  className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                />
              </div> */}

              {/* Time Zone */}
            </div>

            {/* Business Units Selection */}
            <div className="flex flex-col space-y-2">
              <label className="text-base sm:text-lg font-semibold text-gray-700">
                Business Units
              </label>
              <MultiSelect
                id="organizations"
                name="organizations"
                label="Business Units"
                required={true}
                placeholder="Select business units"
                options={organizations}
                value={selectedOrganizations}
                onChange={handleOrganizationsChange}
              />
            </div>

            {/* Event Type Selection */}
            <div className="md:col-span-2">
              <SearchableSelectFieldWithCreate
                id="typeId"
                name="typeId"
                label="Event Type"
                control={control}
                options={filteredEventTypes}
                required={true}
                onCreate={selectedTenant ? handleCreateEventType : null}
                createPlaceholder="Enter new event type name"
                isCreating={createEventTypeMutation.isLoading}
                placeholder="Search event types..."
                showVisibilityOptions={true}
              />
            </div>

            {/* Tags Selection */}
            <div className="flex flex-col space-y-2">
              <MultiSelectWithCreate
                id="tags"
                name="tags"
                label="Tags"
                required={true}
                placeholder="Select resource tags"
                options={filteredTags}
                value={selectedTags}
                onChange={handleTagsChange}
                onCreate={selectedTenant ? handleCreateTag : null}
                createPlaceholder="Enter new tag name"
                isCreating={createTagMutation.isLoading}
                showVisibilityOptions={true}
              />
            </div>

            {/* Only show experience level if not community tenant */}
            {selectedTenant?.id !==
              process.env.NEXT_PUBLIC_COMMUNITY_TENANT && (
              <div className="flex flex-col space-y-2">
                <SelectField
                  id="expertiseLevelId"
                  name="expertiseLevelId"
                  label="Experience Level"
                  required={true}
                  options={expertiseLevels}
                  control={control}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div className="col-span-1 space-y-2">
                <InputField
                  id="registrationLink"
                  name="registrationLink"
                  label="Link"
                  required={false}
                  placeholder="Enter resource URL"
                  register={register}
                />
              </div>
            </div>

            {/* Add the location section after the registration link field */}
            <div className="mt-6">
              <div className="flex flex-col space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register("virtualEvent")}
                      className="mr-2 h-4 w-4"
                      id="virtualEvent"
                    />
                    <label htmlFor="virtualEvent">Virtual Event</label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      {...register("inPersonEvent")}
                      className="mr-2 h-4 w-4"
                      id="inPersonEvent"
                    />
                    <label htmlFor="inPersonEvent">In-Person Event</label>
                  </div>
                </div>

            {/* Only show location details if it's an in-person event */}
            {watch("inPersonEvent") && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setShowLocationDetails(!showLocationDetails)
                  }
                  className="flex items-center gap-2 text-base sm:text-lg font-semibold text-gray-700"
                >
                  Location Details
                  {showLocationDetails ? (
                    <FaChevronUp className="w-4 h-4" />
                  ) : (
                    <FaChevronDown className="w-4 h-4" />
                  )}
                </button>

                    {/* Location fields */}
                    {showLocationDetails && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <InputField
                          id="locationName"
                          name="locationName"
                          label="Location Name"
                          placeholder="Enter venue or location name"
                          register={register}
                        />
                        <InputField
                          id="locationAddress"
                          name="locationAddress"
                          label="Street Address"
                          placeholder="Enter street address"
                          register={register}
                        />
                        <InputField
                          id="locationCity"
                          name="locationCity"
                          label="City"
                          placeholder="Enter city"
                          register={register}
                        />
                        <InputField
                          id="locationState"
                          name="locationState"
                          label="State/Province"
                          placeholder="2-letter code (e.g., CA)"
                          maxLength={2}
                          register={register}
                        />
                        <InputField
                          id="locationPostal"
                          name="locationPostal"
                          label="Postal Code"
                          placeholder="Enter postal/zip code"
                          register={register}
                        />
                        <InputField
                          id="locationCountry"
                          name="locationCountry"
                          label="Country"
                          placeholder="3-letter code (e.g., USA)"
                          maxLength={3}
                          register={register}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-1 space-y-2">
              <label className="text-base sm:text-lg font-semibold text-gray-700">
                Description
              </label>
              <div className="text-sm text-gray-600 overflow-hidden border border-gray-200 rounded-md p-2 h-[300px] sm:h-[400px] md:h-[500px]">
                <CustomEditor
                  content={initialValues.description}
                  onChange={(content) => setValue("description", content)}
                  readOnly={false}
                  showBorder={false}
                  maxHeight="500px"
                  contextDetails={{
                    title: watch("title") || "Untitled Event",
                    startTime:
                      watch("startDate") && watch("startTime")
                        ? DateTime.fromFormat(
                            `${watch("startDate")} ${watch("startTime")}`,
                            "yyyy-MM-dd HH:mm",
                            { zone: watch("timezone")?.id || "America/Chicago" }
                          ).toISO()
                        : null,
                    endTime:
                      watch("endDate") && watch("endTime")
                        ? DateTime.fromFormat(
                            `${watch("endDate")} ${watch("endTime")}`,
                            "yyyy-MM-dd HH:mm",
                            { zone: watch("timezone")?.id || "America/Chicago" }
                          ).toISO()
                        : null,
                    timezone: watch("timezone")?.id || "America/Chicago",
                    typeId: watch("typeId")?.id || watch("typeId") || null,
                    expertiseLevelId:
                      watch("expertiseLevelId")?.id ||
                      watch("expertiseLevelId") ||
                      null,
                    organizations: selectedOrganizations || [],
                    tags: selectedTags || [],
                    virtualEvent: Boolean(watch("virtualEvent")),
                    inPersonEvent: Boolean(watch("inPersonEvent")),
                    locationName: watch("locationName") || null,
                    locationAddress: watch("locationAddress") || null,
                    locationCity: watch("locationCity") || null,
                    locationState:
                      watch("locationState")?.toUpperCase() || null,
                    locationPostal: watch("locationPostal") || null,
                    locationCountry:
                      watch("locationCountry")?.toUpperCase() || null,
                    registrationLink: watch("registrationLink") || null,
                    description: watch("description") || "",
                    durationMinutes:
                      calculateDuration(
                        watch("startDate"),
                        watch("startTime"),
                        watch("endDate"),
                        watch("endTime")
                      ) || 0,
                  }}
                />
              </div>
            </div>

            {/* Visibility Controls moved to bottom */}
            <div className="flex flex-col sm:flex-row justify-end mt-6 sm:mt-8 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-6 py-2 text-gray-700 text-base sm:text-lg font-medium rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors duration-200 w-full sm:w-auto"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 sm:px-6 py-2 bg-[#4263EB] hover:bg-[#3b5bd9] text-white text-base sm:text-lg font-medium rounded-lg flex items-center justify-center gap-2 transition-colors duration-200 w-full sm:w-auto"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
