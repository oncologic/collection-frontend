import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import InputField from "@/app/components/inputs/InputField";
import SelectField from "../inputs/SelectField";
import CustomEditor from "../common/CustomEditor";
import EnhancedNotationEditor from "../common/EnhancedNotationEditor";
import TagInput from "../inputs/TagInput";
import {
  FaExclamation,
  FaExclamationCircle,
  FaLock,
  FaUsers,
  FaGlobe,
  FaClock,
  FaGlobeAmericas,
  FaArrowRight,
  FaPlus,
  FaFileAlt,
  FaTrash,
} from "react-icons/fa";
import { Markdown } from "tiptap-markdown";
import CustomTimePicker from "./CustomTimePicker";
import CustomFieldsManager from "./CustomFieldsManager";
import DynamicField from "./DynamicField";
import FieldTemplates from "./FieldTemplates";
import { useNotationTemplates } from "@/app/hooks/useNotationTemplates";
import { normalizeDateInputValue } from "@/app/utils/general";

const categories = [
  { id: "Idea", name: "Idea" },
  { id: "Action", name: "Action" },
  { id: "Thought", name: "Thought" },
  { id: "Question", name: "Question" },
  { id: "Observation", name: "Observation" },
];
const statuses = [
  { id: "Pending", name: "Pending" },
  { id: "In Progress", name: "In Progress" },
  { id: "Waiting", name: "Waiting" },
  { id: "Completed", name: "Completed" },
  { id: "Cancelled", name: "Cancelled" },
  { id: "Archived", name: "Archived" },
];

const highlightedOptions = [
  { id: "true", name: "Yes" },
  { id: "false", name: "No" },
];

const visibilityOptions = [
  { id: "private", name: "Only Me", icon: <FaLock className="mr-2" /> },
  {
    id: "unlisted",
    name: "Collaborators",
    icon: <FaUsers className="mr-2" />,
  },
  { id: "public", name: "Public", icon: <FaGlobe className="mr-2" /> },
];

const AddNotationForm = ({
  onSubmit,
  onClose,
  initialValues = null,
  isCollaborator = false,
  externalLinkId = null,
  enableEnhancedEditor = true, // New prop to enable enhanced editor features
  onAutoSave = null, // Callback for auto-save
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: initialValues
      ? {
          title: initialValues.title || "",
          content: initialValues.notes || "",
          category:
            categories.find((c) => c.id === initialValues.category) || "",
          status: statuses.find((s) => s.id === initialValues.status) || "",
          visibility: initialValues.visibility
            ? visibilityOptions.find((v) => v.id === initialValues.visibility) ||
              visibilityOptions.find((v) => v.id === initialValues.visibility.toLowerCase()) ||
              visibilityOptions.find((v) => v.id === "private")
            : visibilityOptions.find(
                (v) => v.id === (isCollaborator ? "unlisted" : "private")
              ),
          highlighted: initialValues.highlighted
            ? highlightedOptions.find((h) => h.id === "true")
            : highlightedOptions.find((h) => h.id === "false"),
          startDate: normalizeDateInputValue(
            initialValues.startDate || initialValues.start_date || initialValues.date
          ),
          endDate: normalizeDateInputValue(
            initialValues.endDate ||
              initialValues.end_date ||
              initialValues.startDate ||
              initialValues.start_date ||
              initialValues.date
          ),
          tags: initialValues.tags || [],
        }
      : {
          title: "",
          content: "",
          category: "",
          status: "",
          highlighted: highlightedOptions.find((h) => h.id === "false"),
          visibility: visibilityOptions.find(
            (v) => v.id === (isCollaborator ? "unlisted" : "private")
          ),
          startDate: "",
          endDate: "",
          tags: [],
        },
  });

  // Update state for start and end times
  const [formData, setFormData] = useState({
    startTime: initialValues?.startTime || initialValues?.time || "",
    endTime: initialValues?.endTime || "",
    timezone: initialValues?.timezone || "",
    tags: initialValues?.tags || [],
    ...initialValues,
  });

  // Custom fields state - initialize from existing data when editing
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState(() => {
    // If we have existing custom fields, create field definitions from them
    if (initialValues?.customFields && Object.keys(initialValues.customFields).length > 0) {
      return Object.entries(initialValues.customFields).map(([key, value]) => {
        // Determine field type based on value
        let fieldType = 'text';
        if (typeof value === 'boolean') fieldType = 'boolean';
        else if (typeof value === 'number') fieldType = 'number';
        else if (Array.isArray(value)) fieldType = 'multiselect';
        else if (typeof value === 'string') {
          if (value.match(/^\d{4}-\d{2}-\d{2}$/)) fieldType = 'date';
          else if (value.match(/^https?:\/\//)) fieldType = 'url';
          else if (value.includes('@') && value.includes('.')) fieldType = 'email';
        }
        
        // Format the label from the key
        const label = key
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/_/g, ' ')
          .replace(/\b\w/g, letter => letter.toUpperCase());
        
        return {
          id: `field_${key}`,
          label: label,
          type: fieldType,
          required: false,
          placeholder: '',
          options: fieldType === 'multiselect' ? 
            (Array.isArray(value) ? value.map(v => ({ value: v, label: v })) : []) : [],
          value: value
        };
      });
    }
    return initialValues?.customFieldDefinitions || [];
  });
  
  const [customFieldValues, setCustomFieldValues] = useState(() => {
    // If we have existing custom fields, map them to field IDs
    if (initialValues?.customFields && Object.keys(initialValues.customFields).length > 0) {
      const values = {};
      Object.entries(initialValues.customFields).forEach(([key, value]) => {
        values[`field_${key}`] = value;
      });
      return values;
    }
    return {};
  });
  
  const [showFieldManager, setShowFieldManager] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isPublicTemplate, setIsPublicTemplate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    initialValues?.templateId || null
  );
  const [removedFields, setRemovedFields] = useState(new Set());

  // Set default timezone if not provided but time is set
  useEffect(() => {
    if ((formData.startTime || formData.endTime) && !formData.timezone) {
      const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setFormData((prev) => ({
        ...prev,
        timezone: defaultTimezone,
      }));
    }
  }, [formData.startTime, formData.endTime, formData.timezone]);

  // Common timezones list
  const commonTimezones = [
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

  // Add user's timezone if not in the list
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!commonTimezones.includes(userTimezone)) {
    commonTimezones.unshift(userTimezone);
  }

  const currentStatus = watch("status");
  const watchedTags = watch("tags");

  const applyPreset = (preset) => {
    if (preset.category) {
      setValue(
        "category",
        categories.find((c) => c.id === preset.category)
      );
    }
    if (preset.status) {
      setValue(
        "status",
        statuses.find((s) => s.id === preset.status)
      );
    }
    if (preset.highlighted) {
      setValue(
        "highlighted",
        highlightedOptions.find((h) => h.id === preset.highlighted)
      );
    }
  };

  const advanceStatus = () => {
    const statusOrder = ["Pending", "In Progress", "Completed"];
    const currentIndex = statusOrder.indexOf(currentStatus?.id || "");

    if (currentIndex >= 0 && currentIndex < statusOrder.length - 1) {
      setValue(
        "status",
        statuses.find((s) => s.id === statusOrder[currentIndex + 1])
      );
    }
  };

  // Automatically set end time 1 hour after start time when start time changes
  const handleStartTimeChange = (time) => {
    setFormData((prev) => ({
      ...prev,
      startTime: time,
    }));

    // If we have a valid start time and no end time yet, set end time to start time + 1 hour
    if (time && !formData.endTime) {
      try {
        const [hours, minutes] = time.split(":");
        const hourInt = parseInt(hours, 10);
        const endHour = (hourInt + 1) % 24;
        const endTime = `${endHour.toString().padStart(2, "0")}:${minutes}`;

        setFormData((prev) => ({
          ...prev,
          endTime: endTime,
        }));
      } catch (e) {
        console.error("Error calculating end time:", e);
      }
    }
  };

  // Handle tag changes
  const handleTagsChange = (newTags) => {
    setValue("tags", newTags);
    setFormData((prev) => ({
      ...prev,
      tags: newTags,
    }));
  };

  // Handle custom field value changes
  const handleCustomFieldChange = (fieldId, value) => {
    setCustomFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  // Handle removing a custom field
  const handleRemoveField = (fieldId) => {
    // For existing fields loaded from data, track them as removed
    if (fieldId.startsWith('field_')) {
      setRemovedFields(prev => new Set([...prev, fieldId]));
    }
    
    // Remove from definitions and values
    setCustomFieldDefinitions(prev => prev.filter(f => f.id !== fieldId));
    setCustomFieldValues(prev => {
      const newValues = { ...prev };
      delete newValues[fieldId];
      return newValues;
    });
  };

  // Handle template selection
  const handleTemplateSelect = (template) => {
    setCustomFieldDefinitions(template.fields || []);
    setSelectedTemplateId(template.id);
    setShowTemplates(false);
    // Initialize values for template fields
    const initialValues = {};
    template.fields?.forEach(field => {
      if (field.type === 'multiselect') {
        initialValues[field.id] = [];
      } else if (field.type === 'boolean') {
        initialValues[field.id] = false;
      } else {
        initialValues[field.id] = '';
      }
    });
    setCustomFieldValues(initialValues);
  };

  // Get template functions from hook
  const { createTemplate } = useNotationTemplates(externalLinkId);

  // Save custom fields as template
  const handleSaveTemplate = async (templateData) => {
    if (!externalLinkId) {
      console.error("No external link ID provided for saving template");
      return;
    }
    
    try {
      // createTemplate is now mutateAsync which returns a promise
      const newTemplate = await createTemplate({
        ...templateData,
        externalLinkId,
      });
      
      if (newTemplate && newTemplate.id) {
        setSelectedTemplateId(newTemplate.id);
      }
    } catch (error) {
      console.error("Error saving template:", error);
    }
  };

  // Modify the onSubmit handler to include start time, end time, timezone, tags, and custom fields
  const handleFormSubmit = (data) => {
    // Validate required custom fields
    const requiredFieldErrors = customFieldDefinitions
      .filter(field => field.required)
      .filter(field => {
        const value = customFieldValues[field.id];
        if (field.type === 'multiselect') {
          return !value || value.length === 0;
        }
        return !value;
      });

    if (requiredFieldErrors.length > 0) {
      // Show validation error
      alert(`Please fill in all required custom fields: ${requiredFieldErrors.map(f => f.label).join(', ')}`);
      return;
    }

    // Clean up custom field values to match the expected format
    const cleanCustomFields = {};
    
    // Include all field definitions, even those without values
    customFieldDefinitions.forEach(field => {
      // Skip removed fields
      if (removedFields.has(field.id)) return;
      
      let fieldKey;
      
      // Determine the field key based on the field ID pattern
      if (field.id.startsWith('field_')) {
        // This was loaded from existing data, use the original key
        fieldKey = field.id.replace('field_', '');
      } else {
        // For all custom fields (new or edited), always use the label to generate the key
        // This ensures the field key matches what the user named it
        fieldKey = field.label
          .trim()
          .toLowerCase()
          .replace(/\s+(.)/g, (match, letter) => letter.toUpperCase())
          .replace(/^\w/, c => c.toLowerCase());
      }
      
      // Get the value or use default based on field type
      const value = customFieldValues[field.id];
      if (value !== undefined && value !== null && value !== '') {
        cleanCustomFields[fieldKey] = value;
      } else {
        // Include empty values to preserve field structure
        switch (field.type) {
          case 'multiselect':
            cleanCustomFields[fieldKey] = [];
            break;
          case 'boolean':
            cleanCustomFields[fieldKey] = false;
            break;
          case 'number':
            cleanCustomFields[fieldKey] = null;
            break;
          default:
            cleanCustomFields[fieldKey] = null;
        }
      }
    });

    // Add times, timezone, tags, and custom fields to the submitted data
    const submissionData = {
      ...data,
      date: data.startDate || null,
      startDate: data.startDate || null,
      endDate: data.endDate || data.startDate || null,
      startTime: formData.startTime || null,
      endTime: formData.endTime || null,
      timezone:
        formData.startTime || formData.endTime
          ? formData.timezone || userTimezone
          : null,
      tags: data.tags || [],
      customFields: cleanCustomFields,
      templateId: selectedTemplateId,

      // For backward compatibility
      time: formData.startTime || null,
    };

    onSubmit(submissionData);
  };

  // Filter visibility options based on user role
  const filteredVisibilityOptions = visibilityOptions.filter(
    (option) => !isCollaborator || option.id !== "public"
  );

  return (
    <div className="flex items-center justify-center p-4 w-full mx-auto">
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="text-gray-700 w-full bg-white rounded-lg p-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-700 mb-2 sm:mb-0">
            {initialValues ? "Edit Notation" : "Add New Notation"}
          </h1>

          {/* Compact Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                applyPreset({
                  category: "Action",
                  status: "Pending",
                  highlighted: "false",
                })
              }
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all duration-200"
            >
              Todo
            </button>
            <button
              type="button"
              onClick={() =>
                applyPreset({
                  category: "Observation",
                  status: "Pending",
                  highlighted: "false",
                })
              }
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 transition-all duration-200"
            >
              Note
            </button>
            <button
              type="button"
              onClick={() =>
                applyPreset({
                  category: "Question",
                  status: "Pending",
                  highlighted: "false",
                })
              }
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all duration-200"
            >
              Question
            </button>
            <button
              type="button"
              onClick={() =>
                setValue(
                  "highlighted",
                  highlightedOptions.find((h) => h.id === "true")
                )
              }
              className="inline-flex items-center px-3 py-1.5 text-amber-500 hover:text-amber-600 transition-all duration-200"
            >
              <FaExclamationCircle className="text-[1.2em]" />
            </button>
            {currentStatus?.id === "Pending" ||
            currentStatus?.id === "In Progress" ? (
              <button
                type="button"
                onClick={advanceStatus}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 transition-all duration-200"
              >
                {currentStatus?.id === "Pending"
                  ? "→ In Progress"
                  : "→ Completed"}
              </button>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <InputField
            id="title"
            name="title"
            label="Title"
            placeholder="Enter notation title"
            register={register}
            required={true}
            error={errors.title}
          />

          {/* Tags Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <TagInput
                  value={field.value || []}
                  onChange={handleTagsChange}
                  placeholder="Add tags to organize and categorize your notation..."
                  className="w-full"
                />
              )}
            />
            <p className="text-xs text-gray-500 mt-1">
              Use tags to organize and categorize your notations for easier
              searching and filtering.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <InputField
              id="startDate"
              name="startDate"
              label="Start Date"
              type="date"
              required={false}
              register={register}
            />

            <InputField
              id="endDate"
              name="endDate"
              label="End Date"
              type="date"
              required={false}
              register={register}
              min={watch("startDate") || undefined}
            />

            {/* Time fields with CustomTimePicker - updated to include both start and end times */}
            <div className="space-y-4 md:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {/* Start Time field */}
                <CustomTimePicker
                  value={formData.startTime || ""}
                  onChange={handleStartTimeChange}
                  className="space-y-1"
                  label="Start Time (optional)"
                />

                {/* End Time field */}
                <CustomTimePicker
                  value={formData.endTime || ""}
                  onChange={(timeValue) =>
                    setFormData({ ...formData, endTime: timeValue })
                  }
                  className="space-y-1"
                  label="End Time (optional)"
                />
                {/* Timezone field - only show if either time is set */}
                {(formData.startTime || formData.endTime) && (
                  <div className="space-y-1">
                    <Controller
                      name="timezone"
                      control={control}
                      defaultValue={
                        formData.timezone
                          ? {
                              id: formData.timezone,
                              name: formData.timezone.replace(/_/g, " "),
                            }
                          : {
                              id: userTimezone,
                              name: userTimezone.replace(/_/g, " "),
                            }
                      }
                      render={({ field }) => (
                        <SelectField
                          label="Timezone"
                          options={commonTimezones.map((tz) => ({
                            id: tz,
                            name: tz.replace(/_/g, " "),
                          }))}
                          value={field.value}
                          onChange={(selectedTimezone) => {
                            field.onChange(selectedTimezone);
                            setFormData((prev) => ({
                              ...prev,
                              timezone:
                                selectedTimezone?.id || selectedTimezone,
                            }));
                          }}
                        >
                          {commonTimezones.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz.replace(/_/g, " ")}
                            </option>
                          ))}
                        </SelectField>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>

            <SelectField
              id="category"
              name="category"
              label="Category"
              options={categories}
              control={control}
              required={true}
              error={errors.category}
              placeholder="Select a category"
            />

            <SelectField
              id="status"
              name="status"
              label="Status"
              options={statuses}
              control={control}
              required={true}
              error={errors.status}
            />

            <SelectField
              id="highlighted"
              name="highlighted"
              label="Highlighted"
              options={highlightedOptions}
              control={control}
              required={true}
              error={errors.highlighted}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Who can see this notation?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {filteredVisibilityOptions.map((option) => (
                <Controller
                  key={option.id}
                  name="visibility"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      className={`flex items-center justify-center px-4 py-2 border rounded-md ${
                        field.value?.id === option.id
                          ? "bg-blue-50 border-blue-300 text-blue-700"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                      onClick={() => field.onChange(option)}
                    >
                      {option.icon}
                      {option.name}
                    </button>
                  )}
                />
              ))}
            </div>
          </div>

          {/* Custom Fields Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-700">Custom Fields</h3>
              <div className="flex gap-2">
                {externalLinkId && (
                  <button
                    type="button"
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
                  >
                    <FaFileAlt className="text-xs" />
                    Templates
                  </button>
                )}
                {externalLinkId && customFieldDefinitions.length > 0 && !showFieldManager && (
                  <button
                    type="button"
                    onClick={() => setShowTemplateDialog(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
                  >
                    <FaFileAlt className="text-xs" />
                    Save as Template
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFieldManager(!showFieldManager)}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                >
                  <FaPlus className="text-xs" />
                  {showFieldManager ? 'Hide' : 'Manage'} Fields
                </button>
              </div>
            </div>

            {/* Template Selection */}
            {showTemplates && externalLinkId && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <FieldTemplates
                  externalLinkId={externalLinkId}
                  onSelectTemplate={handleTemplateSelect}
                />
              </div>
            )}

            {/* Field Manager */}
            {showFieldManager && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <CustomFieldsManager
                  fields={customFieldDefinitions}
                  onFieldsChange={setCustomFieldDefinitions}
                  onSaveTemplate={handleSaveTemplate}
                />
              </div>
            )}

            {/* Render Custom Fields */}
            {customFieldDefinitions.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-600">
                    {customFieldDefinitions.length} custom field{customFieldDefinitions.length !== 1 ? 's' : ''}
                  </p>
                  {initialValues && customFieldDefinitions.some(f => f.id.startsWith('field_')) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('Remove all custom fields? This will delete all custom field data.')) {
                          const existingFieldIds = customFieldDefinitions
                            .filter(f => f.id.startsWith('field_'))
                            .map(f => f.id);
                          setRemovedFields(new Set(existingFieldIds));
                          setCustomFieldDefinitions([]);
                          setCustomFieldValues({});
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-600"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customFieldDefinitions.map((field) => (
                    <div 
                      key={field.id} 
                      className={`relative group ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}
                    >
                      <DynamicField
                        field={field}
                        value={customFieldValues[field.id]}
                        onChange={handleCustomFieldChange}
                      />
                      {/* Remove button for individual fields */}
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="absolute top-0 right-0 -mt-2 -mr-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-md"
                        title="Remove this field"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Controller
            name="content"
            control={control}
            rules={{ required: "Content is required" }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <div className="w-full border border-gray-300 rounded-md overflow-hidden bg-white">
                  {enableEnhancedEditor ? (
                    <EnhancedNotationEditor
                      content={value}
                      onChange={onChange}
                      onAutoSave={onAutoSave}
                      notationId={initialValues?.id || null}
                      placeholder="Start writing your notation or drag an image here..."
                      readOnly={false}
                      showOCR={true}
                      autoSaveInterval={10000} // 10 seconds
                      className=""
                    />
                  ) : (
                    <div className="p-2 min-h-[300px] overflow-y-auto">
                      <CustomEditor
                        content={value}
                        onChange={onChange}
                        readOnly={false}
                        showBorder={true}
                        contextDetails={{
                          parseMarkdown: true,
                        }}
                        textSize="text-base"
                        scrollable={true}
                        compact={false}
                      />
                    </div>
                  )}
                </div>
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error.message}</p>
                )}
              </div>
            )}
          />
        </div>

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
            className="px-6 py-2 bg-[#4263EB] hover:bg-[#3b5bd9] text-white text-lg font-medium rounded-lg transition-colors duration-200"
          >
            {initialValues ? "Update Notation" : "Add Notation"}
          </button>
        </div>
      </form>

      {/* Save Template Dialog */}
      {showTemplateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Save as Template</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter template name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what this template is for"
                  rows={2}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublicTemplate"
                  checked={isPublicTemplate}
                  onChange={(e) => setIsPublicTemplate(e.target.checked)}
                  className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="isPublicTemplate" className="text-sm text-gray-700">
                  Use as public submission template
                  <span className="block text-xs text-gray-500">
                    This template will be used for public notation submissions
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowTemplateDialog(false);
                  setTemplateName('');
                  setTemplateDescription('');
                  setIsPublicTemplate(false);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (templateName.trim() && customFieldDefinitions.length > 0) {
                    await handleSaveTemplate({
                      name: templateName,
                      description: templateDescription,
                      isPublicSubmissionTemplate: isPublicTemplate,
                      fields: customFieldDefinitions.map(({ value, ...field }) => field)
                    });
                    setShowTemplateDialog(false);
                    setTemplateName('');
                    setTemplateDescription('');
                    setIsPublicTemplate(false);
                  }
                }}
                disabled={!templateName.trim()}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddNotationForm;
