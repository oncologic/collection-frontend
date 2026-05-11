"use client";

import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import InputField from "@/app/components/inputs/InputField";
import CustomEditor from "../common/CustomEditor";
import DynamicField from "./DynamicField";
import { FaPaperPlane, FaFileAlt } from "react-icons/fa";
import { usePublicNotations } from "@/app/hooks/usePublicNotations";

const SimplePublicNotationForm = ({ 
  externalLinkId, 
  collectionId = null,
  templateId = null,
  customFields = [],
  availableTemplates = [],
  onSuccess
}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      title: "",
      content: "",
      submitterName: "",
      submitterEmail: "",
    },
  });

  const [customFieldValues, setCustomFieldValues] = useState({});
  const [selectedTemplateId, setSelectedTemplateId] = useState(templateId);
  const [currentCustomFields, setCurrentCustomFields] = useState(customFields);
  
  // Use the public notations hook
  const { publicTemplate, templateLoading, submitNotation, isSubmitting } =
    usePublicNotations(externalLinkId, collectionId);

  // Set up template when loaded
  useEffect(() => {
    if (publicTemplate && publicTemplate.id) {
      setSelectedTemplateId(publicTemplate.id);
      setCurrentCustomFields(publicTemplate.fields || []);
    }
  }, [publicTemplate]);


  // Initialize custom field values
  useEffect(() => {
    const initialValues = {};
    currentCustomFields.forEach(field => {
      const fieldKey = field.fieldKey || field.id;
      switch (field.fieldType || field.type) {
        case 'multiselect':
          initialValues[fieldKey] = [];
          break;
        case 'boolean':
          initialValues[fieldKey] = false;
          break;
        case 'number':
          initialValues[fieldKey] = null;
          break;
        default:
          initialValues[fieldKey] = '';
      }
    });
    setCustomFieldValues(initialValues);
  }, [currentCustomFields]);

  // Handle custom field value changes
  const handleCustomFieldChange = (fieldKey, value) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleFormSubmit = async (data) => {
    try {
      // Generate a UUID for the notation (UUID v4)
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      // Format custom fields for submission
      const formattedCustomFields = {};
      currentCustomFields.forEach(field => {
        const fieldKey = field.fieldKey || field.id;
        const value = customFieldValues[fieldKey];
        
        if (value !== undefined && value !== null && value !== '') {
          // Use the field key directly
          formattedCustomFields[fieldKey] = value;
        }
      });

      // Prepare submission data in the format expected by backend
      const submissionData = {
        collectionId,
        templateId: selectedTemplateId,
        notationData: {
          id: generateUUID(), // Add generated UUID
          title: data.title,
          notes: data.content,
          status: "Active", // Always set to Active for public submissions
          category: "public-submission",
          customFields: formattedCustomFields,
        },
        submitterInfo: {
          name: data.submitterName || null,
          email: data.submitterEmail || null,
        }
      };

      // Submit using the hook
      const result = await submitNotation(submissionData);
      
      // Reset form on success
      reset();
      setCustomFieldValues({});
      
      if (onSuccess) {
        onSuccess(result);
      }
      
    } catch (error) {
      console.error("Error submitting notation:", error);
    }
  };

  // Convert custom field format for DynamicField component
  const convertFieldForDynamicField = (field) => {
    return {
      id: field.fieldKey || field.id,
      label: field.fieldLabel || field.label || field.fieldKey,
      type: field.fieldType || field.type || 'text',
      required: field.isRequired || field.required || false,
      placeholder: field.placeholderText || field.placeholder || '',
      options: field.fieldOptions || field.options || [],
    };
  };

  return (
    <div className="bg-white rounded-lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Template Info - Show if a public template is being used */}
        {!templateLoading && publicTemplate && (
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-900 flex items-center">
                  <FaFileAlt className="mr-2" />
                  {publicTemplate.name}
                </h3>
                {publicTemplate.description && (
                  <p className="mt-1 text-xs text-blue-700">
                    {publicTemplate.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Basic Fields */}
        <div className="space-y-4">
          <InputField
            id="title"
            name="title"
            label="Title"
            placeholder="Enter a title for your submission"
            register={register}
            required={true}
            error={errors.title}
          />

          {/* Content Editor */}
          <Controller
            name="content"
            control={control}
            rules={{ required: "Content is required" }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content <span className="text-red-500">*</span>
                </label>
                <div className="w-full p-2 border rounded-md min-h-[200px] overflow-y-auto">
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
                {error && (
                  <p className="text-red-500 text-sm mt-1">{error.message}</p>
                )}
              </div>
            )}
          />
        </div>

        {/* Custom Fields from Template */}
        {currentCustomFields.length > 0 && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700">
              {publicTemplate ? `${publicTemplate.name} Fields` : 'Additional Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentCustomFields.map((field) => {
                const convertedField = convertFieldForDynamicField(field);
                return (
                  <div 
                    key={convertedField.id}
                    className={convertedField.type === 'textarea' ? 'md:col-span-2' : ''}
                  >
                    <DynamicField
                      field={convertedField}
                      value={customFieldValues[convertedField.id]}
                      onChange={handleCustomFieldChange}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Optional Submitter Info */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700">Your Information (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              id="submitterName"
              name="submitterName"
              label="Name"
              placeholder="Your name"
              register={register}
              required={false}
              error={errors.submitterName}
            />
            <InputField
              id="submitterEmail"
              name="submitterEmail"
              label="Email"
              type="email"
              placeholder="your@email.com"
              register={register}
              required={false}
              error={errors.submitterEmail}
            />
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>Privacy Notice:</strong> Your submission will be reviewed before being made public. 
            Your contact information will not be displayed publicly.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting || templateLoading || !publicTemplate?.submissionToken}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Submitting...
              </>
            ) : (
              <>
                <FaPaperPlane className="text-sm" />
                {templateLoading ? "Loading..." : "Submit"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SimplePublicNotationForm;
