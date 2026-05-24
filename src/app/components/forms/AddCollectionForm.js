import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import CustomEditor from "@/app/components/common/CustomEditor";
import {
  FaTimes,
  FaMicrophone,
  FaVideo,
  FaFile,
  FaList,
  FaBook,
  FaLink,
  FaCalendarAlt,
  FaUsers,
  FaGraduationCap,
  FaCode,
  FaFlask,
  FaInfoCircle,
  FaDatabase,
  FaExternalLinkAlt,
} from "react-icons/fa";
import InputField from "../inputs/InputField";
import SelectField from "../inputs/SelectField";
import MultiSelect from "../inputs/MultiSelect";
import HashtagInput from "../inputs/HashtagInput";
import { faFlask, faFlaskVial } from "@fortawesome/free-solid-svg-icons";
import { useContextAuth } from "@/app/context/authContext";
import { normalizeDateInputValue } from "@/app/utils/general";

const COLLECTION_TYPES = [
  { id: "resource", label: "Resource" },
  { id: "sponsor", label: "Sponsor" },
  { id: "event", label: "Event" },
  { id: "organization", label: "Business Unit" },
  { id: "mixed", label: "Mixed" },
];

const VISIBILITY_OPTIONS = [
  { id: "private", label: "Private" },
  { id: "unlisted", label: "Unlisted" },
  { id: "public", label: "Public" },
  { id: "verified", label: "Verified" },
];

export const STATUS_OPTIONS = [
  { id: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-700" },
  { id: "active", label: "Active", color: "bg-blue-100 text-blue-700" },
  { id: "completed", label: "Completed", color: "bg-green-100 text-green-700" },
  { id: "waiting", label: "Waiting", color: "bg-orange-100 text-orange-700" },
  {
    id: "large reference",
    label: "Large Reference",
    color: "bg-red-100 text-red-700",
  },
  { id: "archived", label: "Archived", color: "bg-gray-100 text-gray-700" },
];

const COLORS = [
  { id: "slate", label: "Slate", gradient: "from-slate-400 to-slate-800" },
  { id: "zinc", label: "Zinc", gradient: "from-zinc-400 to-zinc-800" },
  { id: "indigo", label: "Indigo", gradient: "from-indigo-400 to-indigo-800" },
  { id: "violet", label: "Violet", gradient: "from-violet-400 to-violet-800" },
  {
    id: "fuchsia",
    label: "Fuchsia",
    gradient: "from-fuchsia-400 to-fuchsia-800",
  },
  { id: "rose", label: "Rose", gradient: "from-rose-400 to-rose-800" },
  {
    id: "emerald",
    label: "Emerald",
    gradient: "from-emerald-400 to-emerald-800",
  },
  { id: "teal", label: "Teal", gradient: "from-teal-400 to-teal-800" },
];

// Convert arrays to match SelectField format
const COLLECTION_TYPES_OPTIONS = COLLECTION_TYPES.map(({ id, label }) => ({
  id,
  name: label,
}));

const transformedVisibilityOptions = VISIBILITY_OPTIONS.map((option) => ({
  id: option.id,
  name: option.label, // transform label to name for SelectField compatibility
}));

const STATUS_OPTIONS_FORMATTED = STATUS_OPTIONS.map(({ id, label }) => ({
  id,
  name: label,
}));

const isTemplateCollection = (collection = {}) => {
  const metadata = collection.workflowMetadata || collection.workflow_metadata || {};
  const kind = String(metadata.kind || "").toLowerCase();
  return (
    kind === "template" ||
    kind === "workflow_template" ||
    collection.type === "workflow_template" ||
    metadata.templateEnabled === true
  );
};

const COLORS_OPTIONS = COLORS.map(({ id, label }) => ({
  id,
  name: label,
}));

const COLLECTION_ICONS = [
  { id: "microphone", label: "Podcast", icon: FaMicrophone },
  { id: "video", label: "Video", icon: FaVideo },
  { id: "education", label: "Education", icon: FaGraduationCap },
  { id: "science", label: "Research", icon: FaFlask },
  { id: "list", label: "List", icon: FaList },
  { id: "book", label: "Study", icon: FaBook },
  { id: "link", label: "Links", icon: FaLink },
  { id: "calendar", label: "Events", icon: FaCalendarAlt },
  { id: "users", label: "Community", icon: FaUsers },

  { id: "code", label: "Code", icon: FaCode },
];

// Collection type definitions with detailed descriptions
const COLLECTION_TYPE_DEFINITIONS = {
  resource: {
    id: "resource",
    label: "Resources",
    icon: FaDatabase,
    description:
      "Create collections from curated kidney cancer resources created by trusted nonprofits and medical professionals. Annotate with notes and share with your community.",
    features: [
      "Example: My favorite resource for treatment options",
      "Example: Resources to share with Jane Doe",
      "Example: Videos from the KCA",
    ],
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-700",
  },
  external: {
    id: "external",
    label: "External Links",
    icon: FaExternalLinkAlt,
    description:
      "Your private workspace for storing information and external resources",
    features: [
      "Example: Links to patient portals, insurance websites, and websites frequently visited for quick access",
      "Example: Upload PDFs, images, videos, and files for personal assistant / AI retrieval",
      "Example: Create to-do lists, appointment reminders, and notes",
      "Example: Save helpful websites and external resources",
    ],
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-700",
  },
};

// Collection Type Selector Component
const CollectionTypeSelector = ({ value, onChange, control }) => {
  const [showTooltip, setShowTooltip] = useState(null);

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Collection Type
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.values(COLLECTION_TYPE_DEFINITIONS).map((typeDefinition) => {
          const IconComponent = typeDefinition.icon;
          const isSelected = value === typeDefinition.id;

          return (
            <div
              key={typeDefinition.id}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? `${typeDefinition.borderColor} ${typeDefinition.bgColor}`
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
              onClick={() => onChange(typeDefinition.id)}
            >
              {/* Header with icon, title, and info icon */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <IconComponent
                    className={`w-6 h-6 ${
                      isSelected ? typeDefinition.textColor : "text-gray-600"
                    }`}
                  />
                  <h3
                    className={`font-semibold text-lg ${
                      isSelected ? typeDefinition.textColor : "text-gray-900"
                    }`}
                  >
                    {typeDefinition.label}
                  </h3>
                </div>
                <div className="relative">
                  <FaInfoCircle
                    className="w-5 h-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    onMouseEnter={() => setShowTooltip(typeDefinition.id)}
                    onMouseLeave={() => setShowTooltip(null)}
                  />
                  {showTooltip === typeDefinition.id && (
                    <div className="absolute top-8 right-0 z-50 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {typeDefinition.label} Features:
                      </h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        {typeDefinition.features.map((feature, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p
                className={`text-sm mb-3 ${
                  isSelected ? typeDefinition.textColor : "text-gray-600"
                }`}
              >
                {typeDefinition.description}
              </p>

              {/* Selection indicator */}
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={isSelected}
                  onChange={() => onChange(typeDefinition.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span
                  className={`text-sm font-medium ${
                    isSelected ? typeDefinition.textColor : "text-gray-700"
                  }`}
                >
                  Select {typeDefinition.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AddCollectionForm = ({
  events = [],
  onSubmit,
  onClose,
  initialValues = {},
  isLoading = false,
  organizations = [],
  isEditing = false,
  type = "resource",
  isAdvocate = false,
  isAdmin = false,
  showCloseButton = false,
}) => {
  const [description, setDescription] = useState(
    initialValues.description || ""
  );
  const [eventOptions, setEventOptions] = useState([]);
  const [isPinned, setIsPinned] = useState(initialValues.isPinned || false);
  const [isTemplate, setIsTemplate] = useState(
    isTemplateCollection(initialValues)
  );
  const [collectionHashtags, setCollectionHashtags] = useState(
    initialValues.hashtags || []
  );
  const { selectedTenants } = useContextAuth();
  const [selectedTenant, setSelectedTenant] = useState(
    initialValues.tenantId
      ? selectedTenants?.find((t) => t.id === initialValues.tenantId)
      : selectedTenants?.[0] || null
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
    control,
  } = useForm({
    defaultValues: {
      ...initialValues,
      name: initialValues.name || "",
      type: initialValues.type || type,
      visibility:
        transformedVisibilityOptions.find(
          (option) => option.id === initialValues.visibility
        ) || transformedVisibilityOptions[0],
      status:
        STATUS_OPTIONS_FORMATTED.find(
          (option) => option.id === initialValues.status
        ) || STATUS_OPTIONS_FORMATTED[0],
      color: initialValues.color || "blue",
      icon: initialValues.icon || "users",
      organization_id: initialValues.organization_id || "",
      collection_type: initialValues.collection_type || "user",
      eventId: initialValues.eventId || "",
      startDate: normalizeDateInputValue(
        initialValues.startDate || initialValues.start_date || ""
      ),
      endDate: normalizeDateInputValue(
        initialValues.endDate ||
          initialValues.end_date ||
          initialValues.startDate ||
          initialValues.start_date ||
          ""
      ),
      isPinned: initialValues.isPinned || false,
      tenantId: initialValues.tenantId || selectedTenant?.id || "",
    },
  });

  useEffect(() => {
    if (events?.length > 0) {
      const options = events.map((event) => ({
        id: event.id,
        name: event.title,
        date: event.startDate,
      }));
      setEventOptions(options);

      if (initialValues.eventId) {
        const defaultEvent = events.find(
          (event) => event.id === initialValues.eventId
        );
        if (defaultEvent) {
          setValue("eventId", {
            id: defaultEvent.id,
            name: defaultEvent.title,
          });
        }
      }
    }
  }, [events, initialValues.eventId, setValue]);

  const onSubmitWrapper = async (data) => {
    const workflowMetadata = {
      ...(initialValues.workflowMetadata || initialValues.workflow_metadata || {}),
    };

    if (isTemplate) {
      workflowMetadata.kind = "template";
      workflowMetadata.templateEnabled = true;
    } else {
      const kind = String(workflowMetadata.kind || "").toLowerCase();
      if (kind === "template" || kind === "workflow_template") {
        delete workflowMetadata.kind;
      }
      delete workflowMetadata.templateEnabled;
    }

    const formData = {
      ...data,
      description,
      isPinned,
      tenantId: selectedTenant?.id || "",
      visibility: data.visibility?.id || "private",
      status: data.status?.id || "pending",
      eventId: data.eventId?.id || null,
      startDate: data.startDate || null,
      endDate: data.endDate || data.startDate || null,
      date: data.startDate || null,
      color: data.color || "blue",
      icon: data.icon || "users",
      organization_id: data.organization_id || "",
      collection_type: data.collection_type || "user",
      hashtags: collectionHashtags,
      workflowMetadata,
    };
    await onSubmit(formData);
  };

  const handleHashtagsChange = (hashtags) => {
    setCollectionHashtags(hashtags);
  };

  return (
    <div className="flex items-center justify-center p-4 w-full mx-auto text-gray-600">
      <form
        onSubmit={handleSubmit(onSubmitWrapper)}
        className="text-gray-700 w-full bg-white rounded-lg p-4"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-700">
            {isEditing ? "Edit Collection" : "Add New Collection"}
          </h1>
        </div>

        <div className="space-y-6">
          {/* Add Tenant Selection for Admins */}
          {isAdmin && selectedTenants?.length > 1 && !isEditing && (
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
              }}
            />
          )}

          {/* Show readonly tenant if editing and not admin */}
          {initialValues.tenantId && !isAdmin && selectedTenant && (
            <div className="flex flex-col space-y-2">
              <label className="text-lg font-semibold text-gray-700">
                Tenant
              </label>
              <div className="px-3 py-2 border rounded-lg bg-gray-50 text-gray-700 capitalize">
                {selectedTenant.name}
              </div>
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-6 flex flex-row gap-4 items-center">
            <div className="flex-1">
              <InputField
                id="name"
                name="name"
                label="Collection Name"
                placeholder="Enter collection name"
                register={register}
                required={true}
                error={errors.name}
              />
            </div>
            {/* Add Pin Collection Toggle */}
            <div className="flex-shrink-0">
              <label className="flex items-center space-x-3 cursor-pointer whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Pin Collection
                </span>
              </label>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
            <input
              type="checkbox"
              checked={isTemplate}
              onChange={(e) => setIsTemplate(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="min-w-0">
              <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                Use as template
                <FaInfoCircle className="h-3.5 w-3.5 text-blue-500" />
              </span>
              <span className="mt-1 block text-sm leading-5 text-gray-600">
                Template collections let the collection builder copy selected
                external links into new collections with their details intact.
              </span>
            </span>
          </label>

          {/* Collection Type Selection */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <CollectionTypeSelector
                value={field.value}
                onChange={field.onChange}
                control={control}
              />
            )}
          />

          {/* Visibility Selection */}
          <SelectField
            name="visibility"
            control={control}
            label="Visibility"
            options={
              isAdmin
                ? transformedVisibilityOptions
                : transformedVisibilityOptions.filter((option) =>
                    ["private", "unlisted"].includes(option.id)
                  )
            }
          />

          {/* Status Selection */}
          {isAdmin && (
            <SelectField
              name="status"
              control={control}
              label="Status"
              options={STATUS_OPTIONS_FORMATTED}
            />
          )}

          {/* Event Selection */}
          <SelectField
            name="eventId"
            control={control}
            label="Event"
            options={eventOptions}
            placeholder="Select an event (optional)"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              id="startDate"
              name="startDate"
              label="Start Date"
              type="date"
              register={register}
            />
            <InputField
              id="endDate"
              name="endDate"
              label="End Date"
              type="date"
              register={register}
              min={watch("startDate") || undefined}
            />
          </div>

          {/* Hashtags Input */}
          <div className="space-y-2 mt-6">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-lg font-semibold text-gray-700">
                Collection Hashtags
              </label>
              <div className="relative group">
                <FaInfoCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
                <div className="absolute left-0 top-6 z-50 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    How Hashtags Work:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 font-bold">•</span>
                      <span>
                        Hashtags help categorize and search your collection
                        content
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 font-bold">•</span>
                      <span>
                        Use them to search across Twitter, Facebook, Instagram,
                        LinkedIn, and YouTube
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 font-bold">•</span>
                      <span>
                        Examples: &ldquo;CancerResearch&rdquo;,
                        &ldquo;ChRCC&rdquo;, &ldquo;ASCO2025&rdquo;,
                        &ldquo;PatientAdvocacy&rdquo;
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 font-bold">•</span>
                      <span>
                        Click the hashtags button on your collection to search
                        social media
                      </span>
                    </li>
                  </ul>
                  <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                    <strong>Tip:</strong> No need to include the # symbol -
                    it&apos;s added automatically!
                  </div>
                </div>
              </div>
            </div>
            <HashtagInput
              value={collectionHashtags}
              onChange={handleHashtagsChange}
              label=""
              placeholder="Add hashtags for social media searching (e.g., CancerResearch, ChRCC, Clinical)"
            />
          </div>

          {/* Organization Selection */}
          {/* {isAdmin && (
            <SelectField
              name="organization_id"
              control={control}
              label="Business Unit"
              options={organizations}
              placeholder="Select an organization"
            />
          )} */}

          {/* Color Selection */}
          {/* <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Collection Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setValue("color", color.id)}
                  className={`
                    group relative h-16 rounded-xl transition-all duration-200
                    bg-gradient-to-r ${color.gradient}
                    ${
                      watch("color") === color.id
                        ? "ring-2 ring-offset-2 ring-offset-white ring-gray-900 scale-105"
                        : "hover:scale-102 hover:shadow-lg"
                    }
                  `}
                ></button>
              ))}
            </div>
          </div> */}

          {/* Collection Owner Type Selection */}
          {isAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Owner Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register("collection_type")}
                    value="user"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">User Collection</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    {...register("collection_type")}
                    value="organizer"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-gray-700">
                    Organizer Collection
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Icon Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Collection Icon
            </label>
            <div className="grid grid-cols-5 gap-3">
              {COLLECTION_ICONS.map((iconOption) => {
                const IconComponent = iconOption.icon;
                return (
                  <button
                    key={iconOption.id}
                    type="button"
                    onClick={() => setValue("icon", iconOption.id)}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200
                      ${
                        watch("icon") === iconOption.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 text-gray-500 hover:text-blue-600"
                      }
                    `}
                  >
                    <IconComponent className="text-xl mb-2" />
                    <span className="text-xs font-medium">
                      {iconOption.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="border rounded-md h-[400px]">
              <CustomEditor
                content={description}
                onChange={setDescription}
                readOnly={false}
                showBorder={true}
                height="350px"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end mt-8 gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 text-lg font-medium rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white text-lg font-medium rounded-lg flex items-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCollectionForm;
