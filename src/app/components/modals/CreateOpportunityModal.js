import React, { useState, useMemo, useCallback, useEffect } from "react";
import Modal from "../Modal";
import { useCreateOpportunity, useUpdateOpportunity } from "../../hooks/useOpportunities";
import { useAIAssist } from "../../hooks/useAI";
import MultiSelect from "../inputs/MultiSelect";
import SelectField from "../inputs/SelectField";
import InputField from "../inputs/InputField";
import { FaTimes, FaMagic, FaMicrophone, FaSpinner } from "react-icons/fa";
import toast from "react-hot-toast";

const FREQUENCY_OPTIONS = [
  { value: "once", label: "One-time" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "as_needed", label: "As Needed" },
];

const COMPENSATION_TYPES = [
  { value: "", label: "None (Volunteer)" },
  { value: "paid", label: "Paid Position" },
  { value: "stipend", label: "Stipend" },
  { value: "travel_reimbursement", label: "Travel Reimbursement" },
];

const REQUIRED_OPPORTUNITY_FIELDS = [
  "title",
  "description",
  "requirements",
  "responsibilities",
  "isVolunteer",
  "compensationType",
  "timeCommitment",
  "frequency",
  "duration",
  "isRemote",
  "location",
  "requiredSkills",
  "preferredSkills",
];

const CreateOpportunityModal = ({ onClose, organizations = [], tags = [], opportunity = null }) => {
  const createOpportunity = useCreateOpportunity();
  const updateOpportunity = useUpdateOpportunity();
  const aiAssist = useAIAssist();
  const isEditMode = !!opportunity;

  // Transform organizations and tags for MultiSelect
  const organizationOptions = useMemo(() => {
    return organizations.map((org) => ({
      id: org.id,
      name: org.name,
    }));
  }, [organizations]);

  const tagOptions = useMemo(() => {
    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
    }));
  }, [tags]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
    isVolunteer: true,
    compensationType: "",
    compensationAmount: "",
    compensationCurrency: "USD",
    timeCommitment: "",
    frequency: "once",
    estimatedHours: "",
    duration: "",
    spotsAvailable: 1,
    isRemote: true,
    location: "",
    applicationDeadline: "",
    startDate: "",
    endDate: "",
    requiredSkills: [],
    preferredSkills: [],
    contactEmail: "",
    applicationUrl: "",
    applicationInstructions: "",
    organizations: [],
    tags: [],
    visibility: "private",
  });

  // Populate form data when editing
  useEffect(() => {
    if (opportunity) {
      // Format dates for datetime-local inputs (YYYY-MM-DDTHH:mm)
      const formatDateTimeLocal = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "";
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        title: opportunity.title || "",
        description: opportunity.description || "",
        requirements: opportunity.requirements || "",
        responsibilities: opportunity.responsibilities || "",
        isVolunteer: opportunity.isVolunteer ?? true,
        compensationType: opportunity.compensationType || "",
        compensationAmount: opportunity.compensationAmount || "",
        compensationCurrency: opportunity.compensationCurrency || "USD",
        timeCommitment: opportunity.timeCommitment || "",
        frequency: opportunity.frequency || "once",
        estimatedHours: opportunity.estimatedHours || "",
        duration: opportunity.duration || "",
        spotsAvailable: opportunity.spotsAvailable || 1,
        isRemote: opportunity.isRemote ?? true,
        location: opportunity.location || "",
        applicationDeadline: formatDateTimeLocal(opportunity.applicationDeadline),
        startDate: formatDateTimeLocal(opportunity.startDate),
        endDate: formatDateTimeLocal(opportunity.endDate),
        requiredSkills: opportunity.requiredSkills || [],
        preferredSkills: opportunity.preferredSkills || [],
        contactEmail: opportunity.contactEmail || "",
        applicationUrl: opportunity.applicationUrl || "",
        applicationInstructions: opportunity.applicationInstructions || "",
        organizations: opportunity.organizations?.map((org) => org.id) || [],
        tags: opportunity.tags?.map((tag) => tag.id) || [],
        visibility: opportunity.visibility || "private",
      });

      // Set selected organizations and tags for MultiSelect
      setSelectedOrganizations(
        opportunity.organizations?.map((org) => ({
          id: org.id,
          name: org.name,
        })) || []
      );
      setSelectedTags(
        opportunity.tags?.map((tag) => ({
          id: tag.id,
          name: tag.name,
        })) || []
      );
    }
  }, [opportunity]);

  const [currentSkill, setCurrentSkill] = useState("");
  const [currentPreferredSkill, setCurrentPreferredSkill] = useState("");
  const [showAIAssist, setShowAIAssist] = useState(false);

  // AI Assist states
  const [aiPrompt, setAiPrompt] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [selectedOrganizations, setSelectedOrganizations] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  // Memoize the transformed options to ensure stable references
  const frequencyOptionsTransformed = useMemo(() => {
    return FREQUENCY_OPTIONS.map((opt) => ({
      id: opt.value,
      name: opt.label,
      value: opt.value,
    }));
  }, []);

  const compensationOptionsTransformed = useMemo(() => {
    return COMPENSATION_TYPES.map((opt) => ({
      id: opt.value,
      name: opt.label,
      value: opt.value,
    }));
  }, []);

  // Memoize the selected values to ensure stable references for Listbox
  const selectedFrequencyOption = useMemo(() => {
    return (
      frequencyOptionsTransformed.find(
        (opt) => opt.value === formData.frequency
      ) || null
    );
  }, [formData.frequency, frequencyOptionsTransformed]);

  const selectedCompensationOption = useMemo(() => {
    return (
      compensationOptionsTransformed.find(
        (opt) => opt.value === formData.compensationType
      ) || null
    );
  }, [formData.compensationType, compensationOptionsTransformed]);

  // Visibility options
  const visibilityOptionsTransformed = useMemo(() => {
    return [
      { id: "private", name: "Private (Only me)", value: "private" },
      { id: "public", name: "Public (Everyone)", value: "public" },
    ];
  }, []);

  const selectedVisibilityOption = useMemo(() => {
    return (
      visibilityOptionsTransformed.find(
        (opt) => opt.value === formData.visibility
      ) || null
    );
  }, [formData.visibility, visibilityOptionsTransformed]);

  const tryParseJson = useCallback((value) => {
    if (typeof value !== "string") {
      return null;
    }
    const trimmed = value.trim();
    if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) {
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return null;
    }
  }, []);

  const extractOpportunityData = useCallback(
    (payload, depth = 0) => {
      if (!payload || depth > 5) {
        return null;
      }

      if (
        typeof payload === "object" &&
        !Array.isArray(payload) &&
        REQUIRED_OPPORTUNITY_FIELDS.every((field) => field in payload)
      ) {
        return payload;
      }

      if (typeof payload === "string") {
        return extractOpportunityData(tryParseJson(payload), depth + 1);
      }

      if (payload.answer) {
        const nested = extractOpportunityData(payload.answer, depth + 1);
        if (nested) {
          return nested;
        }
      }

      if (payload.description && typeof payload.description === "string") {
        const nested = extractOpportunityData(
          payload.description,
          depth + 1
        );
        if (nested) {
          return nested;
        }
      }

      return null;
    },
    [tryParseJson]
  );

  // Process AI prompt
  const processAIPrompt = async () => {
    if (!aiPrompt.trim()) {
      toast.error("Please provide a description for the AI to process");
      return;
    }

    setIsProcessingAI(true);
    try {
      const result = await aiAssist.mutateAsync({
        prompt: `Create a job board opportunity posting based on this description. You MUST return a JSON object with ALL of these fields:

{
  "title": "Job/opportunity title (required)",
  "description": "Detailed description of the opportunity (required)",
  "requirements": "Required qualifications or experience (can be empty string)",
  "responsibilities": "What the person will be doing (can be empty string)",
  "isVolunteer": true or false (boolean, true if volunteer work, false if paid),
  "compensationType": null, "", "paid", "stipend", or "travel_reimbursement",
  "timeCommitment": "Time commitment string (e.g., '2 hours per week')",
  "frequency": "once", "weekly", "biweekly", "monthly", "quarterly", or "as_needed",
  "duration": "Duration string (e.g., '3 months', 'ongoing')",
  "isRemote": true or false (boolean, true if remote, false if on-site),
  "location": "Location string if not remote, or null",
  "requiredSkills": ["skill1", "skill2"] (array of strings, can be empty array),
  "preferredSkills": ["skill1", "skill2"] (array of strings, can be empty array)
}

IMPORTANT: Return ALL fields listed above, even if some values are null, empty strings, or empty arrays. Do not omit any fields.

Input description: ${aiPrompt}`,
        currentContent: "",
        contextDetails: "Creating a new job board opportunity",
      });

      // Backend now handles all parsing and returns a clean object
      // result.content should be a parsed object with the form fields
      if (
        result.content &&
        typeof result.content === "object" &&
        !Array.isArray(result.content)
      ) {
        const structuredContent =
          extractOpportunityData(result.content) ||
          extractOpportunityData(result.content.description) ||
          extractOpportunityData(result.content.answer);

        const normalizedData = structuredContent
          ? { ...structuredContent }
          : { ...result.content };

        // Normalize frequency - must match FREQUENCY_OPTIONS values exactly
        if (normalizedData.frequency) {
          const freqLower = String(normalizedData.frequency)
            .toLowerCase()
            .trim();
          const freqMap = {
            once: "once",
            "one-time": "once",
            "one time": "once",
            weekly: "weekly",
            biweekly: "biweekly",
            "bi-weekly": "biweekly",
            "bi weekly": "biweekly",
            monthly: "monthly",
            quarterly: "quarterly",
            "as needed": "as_needed",
            "as-needed": "as_needed",
            as_needed: "as_needed",
          };
          normalizedData.frequency = freqMap[freqLower] || "once";
        }

        // Normalize compensationType - must match COMPENSATION_TYPES values exactly
        if (
          normalizedData.compensationType !== undefined &&
          normalizedData.compensationType !== null
        ) {
          const compLower = String(normalizedData.compensationType)
            .toLowerCase()
            .trim();
          const compMap = {
            "": "",
            none: "",
            volunteer: "",
            paid: "paid",
            "paid position": "paid",
            stipend: "stipend",
            "travel reimbursement": "travel_reimbursement",
            travel_reimbursement: "travel_reimbursement",
            "travel-reimbursement": "travel_reimbursement",
          };
          normalizedData.compensationType =
            compMap[compLower] !== undefined ? compMap[compLower] : "";
        }

        // Normalize isRemote - convert string to boolean
        if (normalizedData.isRemote !== undefined) {
          if (typeof normalizedData.isRemote === "string") {
            normalizedData.isRemote =
              normalizedData.isRemote.toLowerCase() === "true" ||
              normalizedData.isRemote.toLowerCase() === "remote";
          }
        }

        // Normalize isVolunteer - convert string to boolean
        if (normalizedData.isVolunteer !== undefined) {
          if (typeof normalizedData.isVolunteer === "string") {
            normalizedData.isVolunteer =
              normalizedData.isVolunteer.toLowerCase() === "true" ||
              normalizedData.isVolunteer.toLowerCase() === "volunteer";
          }
        }

        // Ensure spotsAvailable is a number
        if (normalizedData.spotsAvailable !== undefined) {
          normalizedData.spotsAvailable =
            parseInt(normalizedData.spotsAvailable) || 1;
        }

        // Ensure estimatedHours is a number
        if (normalizedData.estimatedHours !== undefined) {
          normalizedData.estimatedHours =
            parseFloat(normalizedData.estimatedHours) || 0;
        }

        // Remove organizations and tags from normalizedData since we handle those separately
        // The AI might return invalid values (integers instead of UUIDs)
        const {
          organizations: aiOrgs,
          tags: aiTags,
          ...fieldsToSet
        } = normalizedData;

        setFormData((prev) => {
          const updated = {
            ...prev,
            ...fieldsToSet,
            // Always use the selected organizations/tags from the UI, not from AI response
            organizations: selectedOrganizations.map((org) => org.id),
            tags: selectedTags.map((tag) => tag.id),
          };
          return updated;
        });
        setShowAIAssist(false);
        toast.success("AI has filled the form fields!");
      } else if (result.content && typeof result.content === "string") {
        // Fallback: if backend returns a string, use it as description
        setFormData((prev) => ({
          ...prev,
          description: result.content,
        }));
        toast(
          "AI generated content has been added to the description field. Please review and fill in remaining fields manually."
        );
      }
    } catch (error) {
      console.error("Error processing AI prompt:", error);
      // Only show error if it's a network/API error, not a parsing error
      if (
        error.message &&
        !error.message.toLowerCase().includes("parse") &&
        !error.message.toLowerCase().includes("json")
      ) {
        toast.error("Failed to process AI request: " + error.message);
      } else {
        toast.error("Failed to process AI request");
      }
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description) {
      toast.error("Please provide title and description");
      return;
    }

    try {
      // Prepare data with proper IDs
      const submitData = {
        ...formData,
        organizations: selectedOrganizations.map((org) => org.id),
        tags: selectedTags.map((tag) => tag.id),
      };

      if (isEditMode) {
        await updateOpportunity.mutateAsync({
          id: opportunity.id,
          data: submitData,
        });
      } else {
        await createOpportunity.mutateAsync(submitData);
      }
      onClose();
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} opportunity:`, error);
    }
  };

  const handleChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Update isVolunteer based on compensation type
      ...(name === "compensationType" && {
        isVolunteer: !value || value === "",
      }),
    }));
  };

  const addSkill = (type) => {
    const skill = type === "required" ? currentSkill : currentPreferredSkill;
    const skillField =
      type === "required" ? "requiredSkills" : "preferredSkills";

    if (skill && !formData[skillField].includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        [skillField]: [...prev[skillField], skill],
      }));

      if (type === "required") {
        setCurrentSkill("");
      } else {
        setCurrentPreferredSkill("");
      }
    }
  };

  const removeSkill = (type, skillToRemove) => {
    const skillField =
      type === "required" ? "requiredSkills" : "preferredSkills";
    setFormData((prev) => ({
      ...prev,
      [skillField]: prev[skillField].filter((s) => s !== skillToRemove),
    }));
  };

  return (
    <Modal onClose={onClose}>
      <div className="max-w-4xl w-full">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit Opportunity" : "Create New Opportunity"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* AI Assist Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                <FaMagic className="w-4 h-4" />
                AI Assistant
              </h3>
              <button
                type="button"
                onClick={() => setShowAIAssist(!showAIAssist)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showAIAssist ? "Hide" : "Show"}
              </button>
            </div>

            {showAIAssist && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Describe the opportunity (AI will fill the form)
                  </label>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="E.g., We need a volunteer to help with patient advocacy calls twice a week, 2 hours per session, for 3 months. The person should have good communication skills and experience with healthcare..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={processAIPrompt}
                    disabled={isProcessingAI || !aiPrompt.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingAI ? (
                      <>
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaMagic className="w-4 h-4" />
                        Generate with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Basic Information
            </h3>

            <InputField
              label="Title *"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g., Patient Advocate Volunteer"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Describe the opportunity and its impact..."
                rows={4}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requirements
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => handleChange("requirements", e.target.value)}
                placeholder="What qualifications or experience are needed?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsibilities
              </label>
              <textarea
                value={formData.responsibilities}
                onChange={(e) =>
                  handleChange("responsibilities", e.target.value)
                }
                placeholder="What will the person be doing?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Organizations and Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Organization & Tags
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organizations
              </label>
              <MultiSelect
                placeholder="Select organizations..."
                options={organizationOptions}
                value={selectedOrganizations}
                onChange={setSelectedOrganizations}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <MultiSelect
                placeholder="Select tags..."
                options={tagOptions}
                value={selectedTags}
                onChange={setSelectedTags}
              />
            </div>
          </div>

          {/* Compensation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Compensation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Type"
                value={selectedCompensationOption}
                onChange={(value) =>
                  handleChange(
                    "compensationType",
                    typeof value === "object" ? value?.value || value : value
                  )
                }
                options={compensationOptionsTransformed}
              />

              {formData.compensationType &&
                formData.compensationType !== "travel_reimbursement" && (
                  <InputField
                    label="Amount"
                    type="number"
                    value={formData.compensationAmount}
                    onChange={(e) =>
                      handleChange("compensationAmount", e.target.value)
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                )}
            </div>
          </div>

          {/* Time Commitment */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Time Commitment
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Frequency"
                value={selectedFrequencyOption}
                onChange={(value) =>
                  handleChange(
                    "frequency",
                    typeof value === "object" ? value?.value || value : value
                  )
                }
                options={frequencyOptionsTransformed}
              />

              <InputField
                label="Time Commitment"
                value={formData.timeCommitment}
                onChange={(e) => handleChange("timeCommitment", e.target.value)}
                placeholder="e.g., 2 hours per week"
              />

              <InputField
                label="Duration"
                value={formData.duration}
                onChange={(e) => handleChange("duration", e.target.value)}
                placeholder="e.g., 3 months"
              />

              <InputField
                label="Estimated Total Hours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => handleChange("estimatedHours", e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {/* Location & Availability */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Location & Availability
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Location
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={formData.isRemote}
                      onChange={() => handleChange("isRemote", true)}
                      className="mr-2"
                    />
                    Remote
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!formData.isRemote}
                      onChange={() => handleChange("isRemote", false)}
                      className="mr-2"
                    />
                    On-site
                  </label>
                </div>
              </div>

              {!formData.isRemote && (
                <InputField
                  label="Location"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  placeholder="City, State"
                />
              )}

              <InputField
                label="Number of Spots Available"
                type="number"
                value={formData.spotsAvailable}
                onChange={(e) => handleChange("spotsAvailable", e.target.value)}
                min="1"
              />
            </div>
          </div>

          {/* Important Dates */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Important Dates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField
                label="Application Deadline"
                type="datetime-local"
                value={formData.applicationDeadline}
                onChange={(e) =>
                  handleChange("applicationDeadline", e.target.value)
                }
              />

              <InputField
                label="Start Date"
                type="datetime-local"
                value={formData.startDate}
                onChange={(e) => handleChange("startDate", e.target.value)}
              />

              <InputField
                label="End Date"
                type="datetime-local"
                value={formData.endDate}
                onChange={(e) => handleChange("endDate", e.target.value)}
              />
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Skills</h3>

            {/* Required Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Skills
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), addSkill("required"))
                  }
                  placeholder="Type a skill and press Enter"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => addSkill("required")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill("required", skill)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preferred Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preferred Skills
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={currentPreferredSkill}
                  onChange={(e) => setCurrentPreferredSkill(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), addSkill("preferred"))
                  }
                  placeholder="Type a skill and press Enter"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => addSkill("preferred")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.preferredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill("preferred", skill)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Application Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Application Details
            </h3>

            <InputField
              label="Contact Email"
              type="email"
              value={formData.contactEmail}
              onChange={(e) => handleChange("contactEmail", e.target.value)}
              placeholder="contact@organization.org"
            />

            <InputField
              label="Application URL"
              type="url"
              value={formData.applicationUrl}
              onChange={(e) => handleChange("applicationUrl", e.target.value)}
              placeholder="https://example.com/apply"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Application Instructions
              </label>
              <textarea
                value={formData.applicationInstructions}
                onChange={(e) =>
                  handleChange("applicationInstructions", e.target.value)
                }
                placeholder="How should interested candidates apply?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Visibility</h3>

            <SelectField
              label="Who can see this opportunity?"
              value={selectedVisibilityOption}
              onChange={(value) =>
                handleChange(
                  "visibility",
                  typeof value === "object" ? value?.value || value : value
                )
              }
              options={visibilityOptionsTransformed}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isEditMode ? updateOpportunity.isPending : createOpportunity.isPending}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isEditMode
                ? updateOpportunity.isPending
                  ? "Updating..."
                  : "Update Opportunity"
                : createOpportunity.isPending
                ? "Creating..."
                : "Create Opportunity"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default CreateOpportunityModal;
