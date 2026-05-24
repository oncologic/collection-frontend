"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  FaCheck,
  FaUser,
  FaBook,
  FaCalendarAlt,
  FaBuilding,
  FaVideo,
  FaTimes,
} from "react-icons/fa";
import SelectField from "../inputs/SelectField";
import InputField from "../inputs/InputField";
import { toast } from "react-hot-toast";
import MultiSelect from "../inputs/MultiSelect";

const UserProfileModal = ({ isOpen, onClose, onSubmit, urlParams }) => {
  const { control, handleSubmit, watch, setValue } = useForm({
    defaultValues: {
      perspective: { id: "self", name: "I" },
      diagnosisType: null,
      diagnosisTime: null,
      location: "",
      stage: null,
      tumorSize: "",
      interests: [],
      tumorRemoved: null,
      tumorRemovedTime: null,
      knowledgeLevel: null,
      yearOfBirth: null,
      tumorFeatures: [],
      selectedWorkspace: null,
    },
  });

  const [selectedInterests, setSelectedInterests] = useState([]);
  const selectedWorkspace = watch("selectedWorkspace");
  const isPersonalTenant = selectedWorkspace?.id === process.env.NEXT_PUBLIC_COMMUNITY_TENANT || urlParams?.tenant === "personal";

  const perspective = watch("perspective");

  const workspaceOptions = useMemo(() => {
    const options = [
      {
        id: "kidney",
        name: "Kidney Cancer",
        description: "Medical & Research Platform",
      },
      // {
      //   id: "personal",
      //   name: "Personal Workspace",
      //   description: "Personal Productivity Platform",
      // },
    ];

    if (urlParams?.tenant && urlParams?.tenantName) {
      const existingOption = options.find((opt) => opt.id === urlParams.tenant);
      if (!existingOption) {
        options.push({
          id: urlParams.tenant,
          name: urlParams.tenantName,
          description:
            urlParams.pricingType === "kidney"
              ? "Medical & Research Platform"
              : "Personal Productivity Platform",
        });
      }
    }

    return options;
  }, [urlParams]);

  useEffect(() => {
    if (urlParams?.tenant && urlParams?.tenantName) {
      setValue("selectedWorkspace", {
        id: urlParams.tenant,
        name: urlParams.tenantName,
        description:
          urlParams.pricingType === "kidney"
            ? "Medical & Research Platform"
            : "Personal Productivity Platform",
      });
    } else {
      setValue("selectedWorkspace", workspaceOptions[0]);
    }
  }, [urlParams, setValue, workspaceOptions]);

  const yearOfBirthOptions = Array.from(
    { length: new Date().getFullYear() - 1900 + 1 },
    (_, i) => ({
      id: new Date().getFullYear() - i,
      name: new Date().getFullYear() - i,
    })
  );

  const diagnosisTypes = [
    { id: "clear_cell", name: "Clear Cell Renal Cell Carcinoma" },
    { id: "papillary", name: "Papillary Renal Cell Carcinoma" },
    { id: "chromophobe", name: "Chromophobe Renal Cell Carcinoma" },
    { id: "collecting_duct", name: "Collecting Duct Carcinoma" },
    { id: "medullary", name: "Renal Medullary Carcinoma" },
    { id: "translocation", name: "Translocation Renal Cell Carcinoma" },
    { id: "unclassified", name: "Unclassified Renal Cell Carcinoma" },
    { id: "generic", name: "Kidney Cancer (type unknown)" },
  ];

  const diagnosisTimes = [
    { id: "less_than_3_months", name: "Less than 3 months ago" },
    { id: "3_to_6_months", name: "3-6 months ago" },
    { id: "6_to_12_months", name: "6-12 months ago" },
    { id: "1_to_2_years", name: "1-2 years ago" },
    { id: "2_plus_years", name: "2+ years ago" },
  ];

  const stageOptions = [
    { id: "stage_1", name: "Stage 1" },
    { id: "stage_2", name: "Stage 2" },
    { id: "stage_3", name: "Stage 3" },
    { id: "stage_4", name: "Stage 4" },
    { id: "unknown", name: "Unknown" },
  ];

  const perspectiveOptions = [
    { id: "self", name: "I" },
    { id: "loved_one", name: "My loved one" },
    { id: "patient", name: "My patient" },
  ];

  const kidneyInterestOptions = [
    {
      id: "patient_stories",
      name: "Stories of patients like me",
      icon: <FaUser className="text-blue-500" />,
    },
    {
      id: "treatment_resources",
      name: "Resources about treatment options",
      icon: <FaBook className="text-green-500" />,
    },
    {
      id: "webinars",
      name: "Educational webinars",
      icon: <FaVideo className="text-purple-500" />,
    },
    {
      id: "events",
      name: "Events I can attend",
      icon: <FaCalendarAlt className="text-orange-500" />,
    },
    {
      id: "organizations",
      name: "Business Units to learn more about",
      icon: <FaBuilding className="text-indigo-500" />,
    },
    {
      id: "scientific_research",
      name: "In-depth scientific research reviews",
      icon: <FaBook className="text-red-500" />,
    },
  ];

  const personalInterestOptions = [
    {
      id: "productivity",
      name: "Personal productivity & goal tracking",
      icon: <FaBook className="text-blue-500" />,
    },
    {
      id: "learning",
      name: "Learning & skill development",
      icon: <FaUser className="text-green-500" />,
    },
    {
      id: "wellness",
      name: "Health & wellness tracking",
      icon: <FaCalendarAlt className="text-purple-500" />,
    },
    {
      id: "projects",
      name: "Project management & collaboration",
      icon: <FaBuilding className="text-orange-500" />,
    },
    {
      id: "events",
      name: "Personal events & scheduling",
      icon: <FaVideo className="text-indigo-500" />,
    },
    {
      id: "notes",
      name: "Note-taking & knowledge management",
      icon: <FaBook className="text-red-500" />,
    },
  ];

  const interestOptions = isPersonalTenant ? personalInterestOptions : kidneyInterestOptions;

  const tumorRemovedOptions = [
    { id: "yes", name: "Yes" },
    { id: "no", name: "No" },
    { id: "scheduled", name: "Surgery is scheduled" },
    { id: "unknown", name: "I don't know" },
  ];

  const tumorRemovedTimes = [
    { id: "less_than_3_months", name: "Less than 3 months ago" },
    { id: "3_to_6_months", name: "3-6 months ago" },
    { id: "6_to_12_months", name: "6-12 months ago" },
    { id: "1_to_2_years", name: "1-2 years ago" },
    { id: "2_plus_years", name: "2+ years ago" },
    { id: "scheduled", name: "Surgery is scheduled" },
  ];

  const kidneyKnowledgeLevelOptions = [
    { id: "beginner", name: "Beginner - Just learning about kidney cancer" },
    { id: "intermediate", name: "Intermediate - Familiar with basic concepts" },
    { id: "advanced", name: "Advanced - Well-informed about kidney cancer" },
    {
      id: "expert",
      name: "Expert - Medical professional or extensively researched",
    },
  ];

  const personalKnowledgeLevelOptions = [
    { id: "beginner", name: "Beginner - New to productivity tools" },
    { id: "intermediate", name: "Intermediate - Familiar with basic organization" },
    { id: "advanced", name: "Advanced - Power user of productivity systems" },
    { id: "expert", name: "Expert - Productivity coach or professional" },
  ];

  const knowledgeLevelOptions = isPersonalTenant ? personalKnowledgeLevelOptions : kidneyKnowledgeLevelOptions;

  const tumorFeaturesOptions = [
    { id: "sarcomatoid", name: "Sarcomatoid Features" },
    { id: "rhabdoid", name: "Rhabdoid Features" },
    { id: "vhl", name: "Von Hippel-Lindau (VHL)" },
    { id: "birt_hogg_dube", name: "Birt-Hogg-Dubé Syndrome" },
    {
      id: "hereditary_leiomyomatosis",
      name: "Hereditary Leiomyomatosis and Renal Cell Cancer (HLRCC)",
    },
    {
      id: "sickle_cell_trait",
      name: "Sickle Cell Trait or family history of sickle cell trait",
    },
    {
      id: "family_history_of_kidney_cancer",
      name: "Family history of kidney cancer",
    },
    { id: "tuberous_sclerosis", name: "Tuberous Sclerosis Complex" },
    { id: "unknown", name: "Unknown" },
    { id: "none", name: "None of the above" },
  ];

  const toggleInterest = (interestId) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interestId)) {
        return prev.filter((id) => id !== interestId);
      } else {
        return [...prev, interestId];
      }
    });
  };

  useEffect(() => {
    setValue("interests", selectedInterests);
  }, [selectedInterests, setValue]);

  const constructPromptFromData = (data) => {
    let prompt = "";

    if (isPersonalTenant) {
      // Personal tenant prompt construction
      prompt = "I am";

      if (data.location) {
        prompt += ` located in ${data.location}`;
      }

      if (data.yearOfBirth?.name) {
        prompt += `. I was born in ${data.yearOfBirth.name}`;
      }

      if (data.knowledgeLevel?.name) {
        prompt += `. I have a ${data.knowledgeLevel.id.toLowerCase()} knowledge level with productivity tools and systems`;
      }

      prompt += `. I am interested in ${selectedInterests
        .map((id) =>
          interestOptions.find((opt) => opt.id === id).name.toLowerCase()
        )
        .reduce((acc, curr, idx, arr) => {
          if (idx === 0) return curr;
          if (idx === arr.length - 1) return `${acc} and ${curr}`;
          return `${acc}, ${curr}`;
        }, "")}`;

      prompt += `.\nCan you provide personalized recommendations and resources to help me achieve my goals? *Important: Limit to 5 items or less and one or two sentences for each item.\n\n`;
    } else {
      // Kidney tenant prompt construction (existing logic)
      const isRareSubtype = data.diagnosisType?.id !== "clear_cell";

      if (data.perspective?.id === "self") {
        prompt = "I was";
      } else if (data.perspective?.id === "loved_one") {
        prompt = "My loved one was";
      } else if (data.perspective?.id === "patient") {
        prompt = "My patient was";
      }

      if (data.diagnosisType?.name) {
        prompt += ` diagnosed with ${data.diagnosisType.name}`;
      }

      if (data.diagnosisTime?.name) {
        prompt += ` ${data.diagnosisTime.name.toLowerCase()}`;
      }

      if (data.stage?.name) {
        prompt += `, ${data.stage.name.toLowerCase()}`;
      }

      if (data.location) {
        prompt += `${data.perspective?.name === "I" ? " I" : " They"} live in ${
          data.location
        }`;
      }

      if (data.tumorSize) {
        prompt += ` and ${
          data.perspective?.name === "I" ? "my" : "their"
        } kidney tumor was ${data.tumorSize} cm at time of diagnosis. `;
      }

      if (data.tumorRemoved?.name) {
        if (data.tumorRemoved.id === "yes" && data.tumorRemovedTime?.name) {
          prompt += `${data.perspective?.name} had ${
            data.perspective?.id === "self" ? "my" : "their"
          } tumor removed ${data.tumorRemovedTime.name}`;
        } else {
          prompt += `. ${
            data.perspective?.name === "I" ? "I" : "They"
          } have not had ${
            data.perspective?.name === "I" ? "my" : "their"
          } tumor removed`;
        }
      }

      if (data.knowledgeLevel?.name) {
        prompt += `. ${data.perspective?.name} ${
          data.perspective?.id === "self" ? "have" : "has"
        } a ${data.knowledgeLevel.id.toLowerCase()} knowledge level about kidney cancer.`;
      }

      if (data.yearOfBirth?.name) {
        prompt += ` ${data.perspective?.name} was born in ${data.yearOfBirth.name}`;
      }

      if (data.tumorFeatures?.length > 0) {
        const features = data.tumorFeatures
          .map((feature) => feature.name.toLowerCase())
          .reduce((acc, curr, idx, arr) => {
            if (idx === 0) return curr;
            if (idx === arr.length - 1) return `${acc} and ${curr}`;
            return `${acc}, ${curr}`;
          }, "");
        prompt += `. ${
          data.perspective?.name === "I" ? "My" : "Their"
        } tumor characteristics or family history includes ${features}`;
      }

      prompt += ` I am interested in ${selectedInterests
        .map((id) =>
          interestOptions.find((opt) => opt.id === id).name.toLowerCase()
        )
        .reduce((acc, curr, idx, arr) => {
          if (idx === 0) return curr;
          if (idx === arr.length - 1) return `${acc} and ${curr}`;
          return `${acc}, ${curr}`;
        }, "")}`;

      prompt += `.\nCan you provide a curated list that would be most relevant and helpful for ${
        data.perspective?.name === "I" ? "me" : "them"
      }? *Important: Limit to 5 items or less and one or two sentences for each item. ${
        isRareSubtype
          ? `Since ${data.diagnosisType?.name.toLowerCase()} is a less common subtype, pay close attention to the type of kidney cancer when recommending resources and recommend at least one business unit that specializes in this subtype of kidney cancer if one exists.`
          : ""
      } \n\n`;
    }

    return prompt;
  };

  const onFormSubmit = async (data) => {
    try {
      const prompt = constructPromptFromData(data);

      onSubmit({
        formData: data,
        prompt,
        data: {
          perspective: data.perspective?.name,
          diagnosisType: data.diagnosisType?.name,
          diagnosisTime: data.diagnosisTime?.name,
          stage: data.stage?.name,
          location: data.location,
          tumorSize: data.tumorSize,
          tumorRemoved: data.tumorRemoved?.name,
          tumorRemovedTime: data.tumorRemovedTime?.name,
          knowledgeLevel: data.knowledgeLevel?.name,
          yearOfBirth: data.yearOfBirth?.name,
          tumorFeatures: data.tumorFeatures.map((feature) => feature.name),
          selectedWorkspace: data.selectedWorkspace,
          urlParams: urlParams,
          useVectorSearch: true,
          selectedInterests: selectedInterests,
        },
      });

      onClose();
    } catch (error) {
      console.error("Error processing form submission:", error);
      toast.error("Failed to save profile");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-8 max-w-[90%] md:max-w-[75%] w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <h2 className="text-3xl font-bold mb-2 text-center md:text-left">
            {isPersonalTenant ? "Welcome to Your Personal Workspace" : "Tell us about your experience"}
          </h2>
          <button
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <FaTimes className="h-5 w-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-8 text-center md:text-left">
          {isPersonalTenant 
            ? "Let's personalize your workspace to help you achieve your goals."
            : "Assists in pulling relevant resources to get you started."
          }
        </p>

        <form onSubmit={handleSubmit(onFormSubmit)}>
          <div className="space-y-8">
            {/* {workspaceOptions.length > 1 && (
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Workspace Selection
                </h3>
                <p className="text-gray-600 mb-4">
                  Choose the workspace that best fits your needs:
                </p>
                <Controller
                  name="selectedWorkspace"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {workspaceOptions.map((workspace) => (
                        <div
                          key={workspace.id}
                          onClick={() => field.onChange(workspace)}
                          className={`
                            relative p-4 rounded-xl border-2 transition-all cursor-pointer
                            ${
                              field.value?.id === workspace.id
                                ? "border-blue-500 bg-blue-50/50"
                                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">
                                {workspace.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {workspace.description}
                              </p>
                            </div>
                            {field.value?.id === workspace.id && (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                <FaCheck className="text-white text-sm" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </div>
            )} */}

            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {isPersonalTenant ? "Personal Information" : "Diagnosis Information"}
              </h3>

              <div className="flex flex-col md:flex-row gap-3">
                <div className="md:w-1/3 flex flex-col items-center justify-center">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center border-4 border-white shadow-lg mb-4 mx-auto">
                    <FaUser className="text-blue-500 text-6xl" />
                  </div>
                </div>

                <div className="md:w-2/3">
                  <div className="grid grid-cols-1 gap-4">
                    {!isPersonalTenant && (
                      <>
                        <div className="flex flex-col md:flex-row md:items-end gap-2">
                          <div className="w-full md:w-1/3">
                            <Controller
                              name="perspective"
                              control={control}
                              render={({ field }) => (
                                <SelectField
                                  label=""
                                  name="perspective"
                                  control={control}
                                  options={perspectiveOptions}
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              )}
                            />
                          </div>
                          <div className="w-full md:w-2/3 pb-[2px]">
                            <p className="text-gray-700 mt-2 md:mt-0">
                              was diagnosed with
                            </p>
                          </div>
                        </div>

                        <Controller
                          name="diagnosisType"
                          control={control}
                          render={({ field }) => (
                            <SelectField
                              label=""
                              name="diagnosisType"
                              control={control}
                              options={diagnosisTypes}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select cancer type"
                            />
                          )}
                        />
                      </>
                    )}

                    {!isPersonalTenant && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                          name="diagnosisTime"
                          control={control}
                          render={({ field }) => (
                            <SelectField
                              label="When"
                              name="diagnosisTime"
                              control={control}
                              options={diagnosisTimes}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select time since diagnosis"
                            />
                          )}
                        />

                        <Controller
                          name="stage"
                          control={control}
                          render={({ field }) => (
                            <SelectField
                              label="Cancer Stage"
                              name="stage"
                              control={control}
                              options={stageOptions}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select cancer stage"
                            />
                          )}
                        />
                      </div>
                    )}

                    {!isPersonalTenant && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Controller
                          name="tumorRemoved"
                          control={control}
                          render={({ field }) => (
                            <SelectField
                              label={`Has ${
                                perspective?.name === "I" ? "your" : "their"
                              } kidney tumor been removed?`}
                              name="tumorRemoved"
                              control={control}
                              options={tumorRemovedOptions}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select an option"
                            />
                          )}
                        />

                        {watch("tumorRemoved")?.id === "yes" && (
                          <Controller
                            name="tumorRemovedTime"
                            control={control}
                            render={({ field }) => (
                              <SelectField
                                label="When was the tumor removed?"
                                name="tumorRemovedTime"
                                control={control}
                                options={tumorRemovedTimes}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="Select time since removal"
                              />
                            )}
                          />
                        )}
                      </div>
                    )}

                    <Controller
                      name="knowledgeLevel"
                      control={control}
                      render={({ field }) => (
                        <SelectField
                          label={isPersonalTenant 
                            ? "How would you describe your experience level?"
                            : `How would you describe ${
                                perspective?.name === "I" ? "your" : "their"
                              } knowledge level about kidney cancer?`
                          }
                          name="knowledgeLevel"
                          control={control}
                          options={knowledgeLevelOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select knowledge level"
                        />
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                    <Controller
                      name="location"
                      control={control}
                      render={({ field }) => (
                        <InputField
                          id="location"
                          label={isPersonalTenant 
                            ? "Where are you located?"
                            : `${perspective?.name === "I" ? "I" : "They"} live in`
                          }
                          name="location"
                          placeholder="State, Country (e.g., Texas, USA)"
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />

                    {!isPersonalTenant && (
                      <Controller
                        name="tumorSize"
                        control={control}
                        render={({ field }) => (
                          <InputField
                            id="tumorSize"
                            label="Kidney Tumor Size in cm"
                            name="tumorSize"
                            placeholder="e.g., 4.5 cm"
                            helperText="At time of diagnosis if known"
                            type="number"
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    )}
                    <Controller
                      name="yearOfBirth"
                      control={control}
                      render={({ field }) => (
                        <SelectField
                          label={isPersonalTenant 
                            ? "Year of birth"
                            : `${perspective?.name === "I" ? "I was" : "They were"} born in`
                          }
                          name="yearOfBirth"
                          control={control}
                          options={yearOfBirthOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select year of birth"
                        />
                      )}
                    />
                  </div>
                  {!isPersonalTenant && (
                    <div className="bg-gray-50  rounded-xl mt-4">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        Tumor specific features or hereditary conditions
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Does {perspective?.name === "I" ? "your" : "their"} kidney
                        cancer have any specific features or hereditary
                        conditions?
                      </p>
                      <Controller
                        name="tumorFeatures"
                        control={control}
                        render={({ field }) => (
                          <MultiSelect
                            options={tumorFeaturesOptions}
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Select features or conditions"
                            className="w-full"
                          />
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                {isPersonalTenant 
                  ? "What are your main interests? (Select all that apply)"
                  : `What are ${perspective?.name === "I" ? "you" : "they"} most interested in? (Select all that apply)`
                }
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {interestOptions.map((interest) => (
                  <div
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`
                      relative p-5 rounded-xl border-2 transition-all cursor-pointer
                      ${
                        selectedInterests.includes(interest.id)
                          ? "border-blue-500 bg-blue-50/50"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        {interest.icon}
                      </div>
                      <div className="flex-grow">
                        <h4 className="text-md font-medium text-gray-900">
                          {interest.name}
                        </h4>
                      </div>
                      {selectedInterests.includes(interest.id) && (
                        <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <FaCheck className="text-white text-sm" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Skip for now
            </button>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Profile
              <svg
                className="ml-2 -mr-1 h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfileModal;
