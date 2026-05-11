"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import InputField from "../inputs/InputField";
import SelectField from "../inputs/SelectField";
import { useSurveyContext } from "../../context/SurveyContext";
import MultiSelect from "../inputs/MultiSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faCircleRadiation,
  faHospital,
  faHospitalUser,
  faRadiation,
} from "@fortawesome/free-solid-svg-icons";
import IconBox from "../IconBox";
import { useUpdateSurveyResponse } from "@/app/hooks/useSurveys";
import ActionButton from "../common/ActionButton";
import toast from "react-hot-toast";
// Mock API call function
const fetchPageDetails = async () => {
  // Simulating API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    title: "Diagnosis",
    videoId: "PLAKRE5uC2k",
    buttonText: "Get Started",
  };
};

export default function RadiationForm() {
  const [pageData, setPageData] = useState(null);
  const { state, setState } = useSurveyContext();
  const [isLoading, setIsLoading] = useState(true);
  const [radiationTreatments, setRadiationTreatments] = useState([]);
  const [collapsedRadiations, setCollapsedRadiations] = useState({});

  const { mutate: updateSurveyResponse } = useUpdateSurveyResponse();

  // Move useForm after radiationTreatments state is initialized
  const { register, handleSubmit, watch, control, setValue } = useForm({
    defaultValues: {
      radiationTreatments: [
        {
          id: "1",
          startDate: "",
          endDate: "",
          type: "",
          sessions: "",
          locations: [],
          files: [],
        },
      ],
    },
  });

  const radiationResponse = watch("hadRadiation");
  const watchedRadiationTreatments = watch("radiationTreatments");

  const radiationTypes = [
    { value: "sbrt", name: "SBRT (Stereotactic Body Radiation Therapy)" },
    { value: "ebrt", name: "EBRT (External Beam Radiation Therapy)" },
    { value: "imrt", name: "IMRT (Intensity Modulated Radiation Therapy)" },
    { value: "proton", name: "Proton Therapy" },
    { value: "unknown", name: "Unknown" },
    { value: "other", name: "Other" },
  ];

  const radiationLocations = [
    { value: "lymphNodes", name: "Lymph Nodes" },
    { value: "kidney", name: "Kidney" },
    { value: "bone", name: "Bone" },
    { value: "liver", name: "Liver" },
    { value: "lung", name: "Lung" },
    { value: "pancreas", name: "Pancreas" },
    { value: "brain", name: "Brain" },
    { value: "adrenalGland", name: "Adrenal Gland" },
    { value: "spleen", name: "Spleen" },
    { value: "other", name: "Other" },
  ];

  const handleRadiationLocationChange = (selectedOptions, index) => {
    const updatedTreatments = [...radiationTreatments];
    updatedTreatments[index] = {
      ...updatedTreatments[index],
      locations: selectedOptions,
    };
    setRadiationTreatments(updatedTreatments);
    setValue(`radiationTreatments.${index}.locations`, selectedOptions);
  };

  useEffect(() => {
    if (watchedRadiationTreatments) {
      setRadiationTreatments(watchedRadiationTreatments);
    }
  }, [watchedRadiationTreatments]);

  useEffect(() => {
    const loadPageData = async () => {
      const data = await fetchPageDetails();
      setPageData(data);
      setIsLoading(false);
    };
    loadPageData();
  }, []);

  const onSubmit = (data) => {
    const transformedData = {
      responseId: state.responseId,
      surveyId: "936e530f-1927-4d33-af46-e395a34145b5",
      radiationTreatment: data.hadRadiation === "yes" ? true : false,
      radiationCourses: data.radiationTreatments?.map((radiation) => ({
        type: radiation.type.value,
        targetAreas: radiation.locations.map((loc) => loc.id),
        startDate: radiation.startDate,
        endDate: radiation.endDate === "" ? null : radiation.endDate,
        sessions: radiation.sessions,
        files: radiation.files,
        notes: radiation.notes,
      })),
    };

    updateSurveyResponse(
      {
        formData: transformedData,
      },
      {
        onSuccess: () => {
          toast.success("Survey response updated successfully");
          setState((prevState) => ({
            ...prevState,
            step: prevState.step + 1,
          }));
        },
        onError: (error) => {
          toast.error("Error updating survey response");
        },
      }
    );
  };

  const toggleRadiationCollapse = (radiationId) => {
    setCollapsedRadiations((prev) => ({
      ...prev,
      [radiationId]: !prev[radiationId],
    }));
  };

  const addRadiationTreatment = () => {
    const newTreatmentId = (radiationTreatments.length + 1).toString();
    const newTreatment = {
      id: newTreatmentId,
      startDate: "",
      endDate: "",
      type: "",
      sessions: "",
      locations: [],
      files: [],
    };

    // Update both local state and form state
    setRadiationTreatments((prev) => [...prev, newTreatment]);
    setValue("radiationTreatments", [...radiationTreatments, newTreatment]);

    // Create new collapsed state with ALL treatments collapsed except the new one
    setCollapsedRadiations((prev) => ({
      ...radiationTreatments.reduce(
        (acc, treatment) => ({
          ...acc,
          [treatment.id]: true, // Collapse all existing treatments
        }),
        {}
      ),
      [newTreatmentId]: false, // Expand the new treatment
    }));
  };

  const handleTreatmentChange = (index, field, value) => {
    const updatedTreatments = [...radiationTreatments];
    updatedTreatments[index] = {
      ...updatedTreatments[index],
      [field]: value,
    };

    // Update both the local state and form state
    setRadiationTreatments(updatedTreatments);
    setValue(`radiationTreatments.${index}.${field}`, value);
  };

  const handleFileChange = (event, recordId) => {
    const uploadedFiles = Array.from(event.target.files);
    const updatedTreatments = radiationTreatments.map((treatment) => {
      if (treatment.id === recordId) {
        return { ...treatment, files: uploadedFiles };
      }
      return treatment;
    });

    // Update both local state and form state
    setRadiationTreatments(updatedTreatments);

    // Find the index of the treatment being updated
    const treatmentIndex = radiationTreatments.findIndex(
      (t) => t.id === recordId
    );
    if (treatmentIndex !== -1) {
      setValue(`radiationTreatments.${treatmentIndex}.files`, uploadedFiles);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-1/2 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 md:w-5/6 w-full h-96">
          <div className="w-3/4 h-8 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="w-full h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="w-5/6 h-4 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!pageData) {
    return (
      <div className="min-h-1/2 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 md:w-5/6 w-full">
          {/* Loading skeleton */}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="text-gray-700 text-center md:text-left w-full mx-auto"
      >
        <h1 className="md:text-4xl text-2xl font-bold text-center text-gray-700">
          Radiation Treatment
        </h1>
        <p className="text-gray-400 text-center w-full">
          Please provide information about any radiation treatments you have
          received for your kidney cancer.
        </p>

        <div className="flex flex-col">
          <div className="w-full mx-auto gap-4 mt-4">
            <IconBox icon={faHospitalUser} />
          </div>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto mt-4">
            <div className="col-span-2 text-center">
              <label className="block font-medium text-gray-600 mb-1 text-lg">
                Have you received radiation related to your kidney cancer?
              </label>

              <div className="flex gap-4 justify-center">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="radiationYes"
                    name="hadRadiation"
                    value="yes"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    {...register("hadRadiation", { required: true })}
                  />
                  <label htmlFor="radiationYes" className="ml-2 text-gray-700">
                    Yes
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="radiationNo"
                    name="hadRadiation"
                    value="no"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    {...register("hadRadiation", { required: true })}
                  />
                  <label htmlFor="radiationNo" className="ml-2 text-gray-700">
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>

          {radiationResponse === "yes" && (
            <div className="space-y-4 mt-4">
              {radiationTreatments.map((treatment, index) => (
                <div
                  key={treatment.id}
                  className="border border-gray-300 rounded-lg p-4 shadow-sm bg-slate-50"
                >
                  <div
                    className="flex justify-between items-center mb-4 cursor-pointer"
                    onClick={() => toggleRadiationCollapse(treatment.id)}
                  >
                    <h3 className="font-semibold text-gray-700">
                      Radiation Course #{index + 1}
                      {treatment.startDate && (
                        <span className="ml-2 text-indigo-500">
                          {formatDate(treatment.startDate)}
                        </span>
                      )}
                      {treatment.locations?.length > 0 && (
                        <span className="text-indigo-500">
                          {" | "}
                          {treatment.locations
                            .map(
                              (loc) =>
                                radiationLocations.find(
                                  (l) => l.value === loc.value
                                )?.name
                            )
                            .join(", ")}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-4">
                      {radiationTreatments.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRadiationTreatments(
                              radiationTreatments.filter(
                                (t) => t.id !== treatment.id
                              )
                            );
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRadiationCollapse(treatment.id);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FontAwesomeIcon
                          icon={
                            collapsedRadiations[treatment.id]
                              ? faChevronDown
                              : faChevronUp
                          }
                        />
                      </button>
                    </div>
                  </div>

                  {!collapsedRadiations[treatment.id] && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <SelectField
                          id={`radiationTreatments.${index}.type`}
                          name={`radiationTreatments.${index}.type`}
                          required={true}
                          options={radiationTypes}
                          register={register}
                          control={control}
                          placeholder="Select type..."
                          onChange={(value) =>
                            handleTreatmentChange(index, "type", value)
                          }
                          value={treatment.type}
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block font-medium text-gray-600 mb-1">
                          Target Areas
                        </label>
                        <MultiSelect
                          id={`radiationTreatments.${index}.locations`}
                          name={`radiationTreatments.${index}.locations`}
                          required={true}
                          placeholder="Select all that apply"
                          options={radiationLocations.map((loc) => ({
                            id: loc.value,
                            name: loc.name,
                            value: loc.value,
                          }))}
                          value={treatment.locations || []}
                          onChange={(options) =>
                            handleRadiationLocationChange(options, index)
                          }
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-gray-600 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          {...register(
                            `radiationTreatments.${index}.startDate`,
                            {
                              required: true,
                            }
                          )}
                          onChange={(e) =>
                            handleTreatmentChange(
                              index,
                              "startDate",
                              e.target.value
                            )
                          }
                          className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-gray-600 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          {...register(`radiationTreatments.${index}.endDate`, {
                            required: true,
                          })}
                          onChange={(e) =>
                            handleTreatmentChange(
                              index,
                              "endDate",
                              e.target.value
                            )
                          }
                          className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="col-span-2 md:col-span-1">
                        <InputField
                          id={`radiationTreatments.${index}.sessions`}
                          name={`radiationTreatments.${index}.sessions`}
                          type="number"
                          min={0}
                          label="Number of Sessions"
                          placeholder="Enter number of sessions"
                          value={treatment.sessions || ""}
                          onChange={(e) =>
                            handleTreatmentChange(
                              index,
                              "sessions",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block font-medium text-gray-600 mb-1">
                          Upload Radiation Reports
                        </label>
                        <p className="text-sm text-gray-500 mt-1 mb-2">
                          Please upload any available radiation treatment
                          summaries, treatment plans, or dosimetry reports.
                        </p>
                        <div className="relative cursor-pointer">
                          <div className="bg-blue-100 hover:bg-blue-200 w-40 text-center text-blue-600 rounded-lg px-4 py-2 transition-colors">
                            <span className="text-sm font-medium">
                              Choose Files
                            </span>
                            <input
                              type="file"
                              multiple
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) =>
                                handleFileChange(e, treatment.id)
                              }
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          {treatment.files?.length > 0 && (
                            <div className="mt-2 text-sm text-gray-500">
                              {treatment.files
                                .map((file) => file.name)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={addRadiationTreatment}
                className="mt-4 text-blue-500 hover:text-blue-700 font-medium"
              >
                + Add Another Radiation Treatment
              </button>
            </div>
          )}

          <div className="flex justify-end mt-12">
            <ActionButton
              type="submit"
              variant="primary"
              onClick={handleSubmit(onSubmit)}
            >
              Continue
            </ActionButton>
          </div>
        </div>
      </form>
    </div>
  );
}
