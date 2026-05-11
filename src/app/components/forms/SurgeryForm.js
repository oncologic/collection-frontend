"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import InputField from "../inputs/InputField";
import SelectField from "../inputs/SelectField";
import { useSurveyContext } from "../../context/SurveyContext";
import MultiSelect from "../inputs/MultiSelect";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBed,
  faChevronDown,
  faChevronUp,
  faHospital,
  faHospitalUser,
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

export default function SurgeryForm() {
  const { register, handleSubmit, watch, control, setValue } = useForm({
    defaultValues: {
      surgery: "",
      nephrectomy: "",
      nephrectomyType: "",
      nephrectomyDate: "",
      nephrectomyFiles: [],
      surgeries: [
        {
          id: "1",
          name: "",
          date: "",
          locations: [],
          files: [],
          notes: "",
        },
      ],
    },
  });
  const [years, setYears] = useState([]);
  const [pageData, setPageData] = useState(null);
  const { state, setState } = useSurveyContext();
  const [query, setQuery] = useState("");
  const filteredYears = years.filter((year) =>
    year.toString().includes(query.toLowerCase())
  );
  const [isLoading, setIsLoading] = useState(true);
  const [biopsyFiles, setBiopsyFiles] = useState({});
  const [selectedSurgeryLocations, setSelectedSurgeryLocations] = useState([]);
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [selectedOtherBiopsyLocations, setSelectedOtherBiopsyLocations] =
    useState([]);
  const [otherBiopsies, setOtherBiopsies] = useState([
    { id: 1, date: "", location: "", files: [] },
  ]);
  const [surgeries, setSurgeries] = useState([]);
  const [collapsedSurgeries, setCollapsedSurgeries] = useState({});
  const watchedSurgeries = watch("surgeries");
  const [nephrectomyFiles, setNephrectomyFiles] = useState([]);

  const { mutate: updateSurveyResponse } = useUpdateSurveyResponse();

  // Add these watch calls to monitor biopsy responses
  const surgeryResponse = watch("surgery");
  const nephrectomyResponse = watch("nephrectomy");
  const otherSurgeryResponse = watch("otherSurgery");

  // Add effect to sync form state with local state
  useEffect(() => {
    if (watchedSurgeries) {
      setSurgeries(watchedSurgeries);
    }
  }, [watchedSurgeries]);

  const handleSurgeryLocationChange = (selectedOptions, index) => {
    const updatedSurgeries = [...surgeries];
    updatedSurgeries[index] = {
      ...updatedSurgeries[index],
      locations: selectedOptions,
    };

    // Update both local state and form state
    setSurgeries(updatedSurgeries);
    setValue(`surgeries.${index}.locations`, selectedOptions);
  };

  const surgeryLocations = [
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
      hadSurgery: data.surgery === "yes" ? true : false,
      hadNephrectomy: data.nephrectomy === "yes" ? true : false,
      nephrectomyLaterality: data.laterality.id,
      nephrectomyDate: data.nephrectomyDate,
      nephrectomyType: data.nephrectomyType.id,
      otherSurgeries: data.surgeries?.map((surgery) => ({
        name: surgery.name,
        location: surgery.locations?.map((location) => location.value),
        notes: surgery.notes,
        date: surgery.date,
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

  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 75;
    const yearRange = Array.from(
      { length: currentYear - startYear + 1 },
      (_, index) => currentYear - index
    );
    setYears(yearRange);
  }, []);

  const handleFileChange = (event, surgeryId) => {
    const uploadedFiles = Array.from(event.target.files);
    const updatedSurgeries = surgeries.map((surgery) => {
      if (surgery.id === surgeryId) {
        return { ...surgery, files: uploadedFiles };
      }
      return surgery;
    });

    // Update both local state and form state
    setSurgeries(updatedSurgeries);

    // Find the index of the surgery being updated
    const surgeryIndex = surgeries.findIndex((s) => s.id === surgeryId);
    if (surgeryIndex !== -1) {
      setValue(`surgeries.${surgeryIndex}.files`, uploadedFiles);
    }
  };

  const addSurgeryEntry = () => {
    const newSurgeryId = (surgeries.length + 1).toString();
    const newSurgery = {
      id: newSurgeryId,
      name: "",
      date: "",
      locations: [],
      files: [],
      notes: "",
    };

    // Update both local state and form state
    setSurgeries((prev) => [...prev, newSurgery]);
    setValue("surgeries", [...surgeries, newSurgery]);

    // Collapse all existing surgeries except the new one
    setCollapsedSurgeries((prev) => ({
      ...surgeries.reduce(
        (acc, surgery) => ({
          ...acc,
          [surgery.id]: true,
        }),
        {}
      ),
      [newSurgeryId]: false,
    }));
  };

  const toggleSurgeryCollapse = (surgeryId) => {
    setCollapsedSurgeries((prev) => ({
      ...prev,
      [surgeryId]: !prev[surgeryId],
    }));
  };

  const handleSurgeryChange = (index, field, value) => {
    const updatedSurgeries = [...surgeries];
    updatedSurgeries[index] = {
      ...updatedSurgeries[index],
      [field]: value,
    };

    // Update both local state and form state
    setSurgeries(updatedSurgeries);
    setValue(`surgeries.${index}.${field}`, value);
  };

  //TODO: Move this into utils
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
    });
  };

  const handleNephrectomyFileChange = (event) => {
    const uploadedFiles = Array.from(event.target.files);

    // Update both local state and form state
    setNephrectomyFiles(uploadedFiles);
    setValue("nephrectomyFiles", uploadedFiles);
  };

  const handleNephrectomyDateChange = (date) => {
    setValue("nephrectomyDate", date);
  };

  const nephrectomyTypes = [
    { id: "full", name: "Full Nephrectomy" },
    { id: "partial", name: "Partial Nephrectomy" },
  ];

  const lateralityOptions = [
    { id: "right", name: "Right" },
    { id: "left", name: "Left" },
    { id: "bilateral", name: "Bilateral (both)" },
  ];

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
          Surgeries
        </h1>
        <p className="text-gray-400 text-center w-full">
          Please provide information about if you&apos;ve had a nephrectomy
          and/or any other surgeries related to your kidney cancer.
        </p>

        <div className="flex flex-col">
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto mt-4">
            <div className="col-span-2 text-center">
              <IconBox icon={faHospital} />
            </div>
            <div className="col-span-2 text-center">
              <label className="block font-medium text-gray-600 mb-1 text-lg">
                Have you had any surgeries related to your kidney cancer?
              </label>

              <div className="flex gap-4 justify-center">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="surgeryYes"
                    name="surgery"
                    value="yes"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    {...register("surgery", { required: true })}
                  />
                  <label htmlFor="surgeryYes" className="ml-2 text-gray-700">
                    Yes
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="radio"
                    id="surgeryNo"
                    name="surgery"
                    value="no"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    {...register("surgery", { required: true })}
                  />
                  <label htmlFor="surgeryNo" className="ml-2 text-gray-700">
                    No
                  </label>
                </div>
              </div>
              {surgeryResponse === "yes" && (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto mt-8 text-left">
                  <div className="col-span-2 border border-gray-300 rounded-lg p-4 shadow-sm">
                    <label className="block font-medium text-gray-600 mb-1 text-lg">
                      Have you had a full nephrectomy or partial nephrectomy?
                    </label>
                    <div className="flex gap-4">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="nephrectomyYes"
                          name="nephrectomy"
                          value="yes"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          {...register("nephrectomy", { required: true })}
                        />
                        <label
                          htmlFor="nephrectomyYes"
                          className="ml-2 text-gray-700"
                        >
                          Yes
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="radio"
                          id="nephrectomyNo"
                          name="nephrectomy"
                          value="no"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          {...register("nephrectomy", { required: true })}
                        />
                        <label
                          htmlFor="nephrectomyNo"
                          className="ml-2 text-gray-700"
                        >
                          No
                        </label>
                      </div>
                    </div>

                    {nephrectomyResponse === "yes" && (
                      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto mt-4">
                        <div className="col-span-1">
                          <SelectField
                            id="nephrectomyType"
                            name="nephrectomyType"
                            label="Type of Nephrectomy"
                            required={true}
                            options={nephrectomyTypes}
                            register={register}
                            control={control}
                            placeholder="Select type of nephrectomy..."
                          />
                        </div>
                        <div className="col-span-1">
                          <SelectField
                            id="laterality"
                            name="laterality"
                            label="Laterality"
                            required={true}
                            options={lateralityOptions}
                            register={register}
                            control={control}
                            placeholder="Which kidney was operated on?"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block font-medium text-gray-600 mb-1 text-lg">
                            Surgery Date
                          </label>
                          <input
                            type="date"
                            className="mt-1 block w-full py-2 px-4 text-semi-bold text-left text-lg rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            {...register("nephrectomyDate")}
                            onChange={(e) =>
                              handleNephrectomyDateChange(e.target.value)
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block font-medium text-gray-600 mb-1">
                            Upload Pathology Report and Surgical Reports
                          </label>
                          <p className="text-sm text-gray-500 mt-1 mb-2">
                            Pathology report from the surgery and any other
                            relevant reports.
                          </p>
                          <div className="relative cursor-pointer">
                            <div className="bg-blue-50 hover:bg-blue-100 w-40 text-center text-blue-600 rounded-lg px-4 py-2 transition-colors">
                              <span className="text-sm font-medium">
                                Choose Files
                              </span>
                              <input
                                type="file"
                                multiple
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleNephrectomyFileChange}
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                              />
                            </div>
                            {nephrectomyFiles.length > 0 && (
                              <div className="mt-2 text-sm text-gray-500">
                                {nephrectomyFiles
                                  .map((file) => file.name)
                                  .join(", ")}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Other Surgeries */}
                  <div className="col-span-2 gap-4 mt-4 border border-gray-300 rounded-lg p-4 shadow-sm">
                    <div className="col-span-2">
                      <label className="block font-medium text-gray-600 mb-1 text-lg">
                        Have you had any other surgeries related to your kidney
                        cancer?
                      </label>
                      <div className="flex gap-4">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="otherSurgeryYes"
                            name="otherSurgery"
                            value="yes"
                            {...register("otherSurgery")}
                          />
                          <label
                            htmlFor="otherSurgeryYes"
                            className="ml-2 text-gray-700"
                          >
                            Yes
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id="otherSurgeryNo"
                            name="otherSurgery"
                            value="no"
                            {...register("otherSurgery")}
                          />
                          <label
                            htmlFor="otherSurgeryNo"
                            className="ml-2 text-gray-700"
                          >
                            No
                          </label>
                        </div>
                      </div>
                    </div>
                    {otherSurgeryResponse === "yes" && (
                      <div className="space-y-4 mt-4 col-span-2 ">
                        {surgeries.map((surgery, index) => (
                          <div
                            key={surgery.id}
                            className="border border-gray-300 space-y-4 bg-slate-50 rounded-lg p-4 shadow-sm"
                          >
                            <div
                              className="flex justify-between items-center cursor-pointer"
                              onClick={() => toggleSurgeryCollapse(surgery.id)}
                            >
                              <h3 className="font-semibold text-gray-700">
                                Additional Surgery #{index + 1}
                                {surgery.name && (
                                  <span className="ml-2 text-indigo-600">
                                    - {surgery.name} |{" "}
                                    {formatDate(surgery.date)}
                                  </span>
                                )}
                              </h3>
                              <div className="flex items-center gap-4">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSurgeries(
                                      surgeries.filter(
                                        (s) => s.id !== surgery.id
                                      )
                                    );
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  Remove
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleSurgeryCollapse(surgery.id);
                                  }}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <FontAwesomeIcon
                                    icon={
                                      collapsedSurgeries[surgery.id]
                                        ? faChevronDown
                                        : faChevronUp
                                    }
                                  />
                                </button>
                              </div>
                            </div>

                            {!collapsedSurgeries[surgery.id] && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="col-span-2">
                                  <InputField
                                    label="Surgery Name"
                                    type="text"
                                    required={true}
                                    {...register(`surgeries.${index}.name`, {
                                      required: true,
                                    })}
                                    onChange={(e) =>
                                      handleSurgeryChange(
                                        index,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    value={surgery.name || ""}
                                    placeholder="e.g., Liver Resection, Lung Resection"
                                  />
                                </div>

                                <div className="col-span-1">
                                  <label className="block font-medium text-gray-600 mb-1">
                                    Surgery Date
                                  </label>
                                  <input
                                    type="date"
                                    className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    {...register(`surgeries.${index}.date`, {
                                      required: true,
                                    })}
                                    onChange={(e) =>
                                      handleSurgeryChange(
                                        index,
                                        "date",
                                        e.target.value
                                      )
                                    }
                                    value={surgery.date || ""}
                                  />
                                </div>

                                <div className="col-span-2">
                                  <label className="block font-medium text-gray-600 mb-1">
                                    Organs involved
                                  </label>

                                  <MultiSelect
                                    id={`surgeries.${index}.locations`}
                                    name={`surgeries.${index}.locations`}
                                    required={true}
                                    placeholder="Select all that apply"
                                    options={surgeryLocations.map((loc) => ({
                                      id: loc.value,
                                      name: loc.name,
                                      value: loc.value,
                                    }))}
                                    value={surgery.locations || []}
                                    onChange={(options) =>
                                      handleSurgeryLocationChange(
                                        options,
                                        index
                                      )
                                    }
                                  />
                                </div>

                                <div className="col-span-2">
                                  <label className="block font-medium text-gray-600 mb-1">
                                    Upload Pathology and Surgical Reports
                                  </label>
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
                                          handleFileChange(e, surgery.id)
                                        }
                                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                      />
                                    </div>
                                    {biopsyFiles[`otherSurgery${surgery.id}`]
                                      ?.length > 0 && (
                                      <div className="mt-2 text-sm text-gray-500">
                                        {biopsyFiles[
                                          `otherSurgery${surgery.id}`
                                        ]
                                          .map((file) => file.name)
                                          .join(", ")}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="col-span-2">
                                  <label className="block font-medium text-gray-600 mb-1">
                                    Notes
                                  </label>
                                  <textarea
                                    className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    {...register(`surgeries.${index}.notes`)}
                                    onChange={(e) =>
                                      handleSurgeryChange(
                                        index,
                                        "notes",
                                        e.target.value
                                      )
                                    }
                                    value={surgery.notes || ""}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={addSurgeryEntry}
                          className="mt-4 text-blue-500 hover:text-blue-700 font-medium"
                        >
                          + Add Another Surgery
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

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
