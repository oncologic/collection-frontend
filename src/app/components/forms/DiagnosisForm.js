"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import InputField from "../inputs/InputField";
import SelectField from "../inputs/SelectField";
import { useSurveyContext } from "../../context/SurveyContext";
import MultiSelect from "../inputs/MultiSelect";
import { FaFileMedical, FaIcons } from "react-icons/fa";
import {
  faBookMedical,
  faCircleInfo,
  faHospital,
  faNotesMedical,
  faStethoscope,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import IconBox from "../IconBox";
import { useUpdateSurveyResponse } from "@/app/hooks/useSurveys";
import toast from "react-hot-toast";
import ActionButton from "../common/ActionButton";

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

export default function DiagnosisForm() {
  const { register, handleSubmit, watch, setValue, control } = useForm();
  const [years, setYears] = useState([]);
  const [pageData, setPageData] = useState(null);
  const { state, setState } = useSurveyContext();
  const [query, setQuery] = useState("");
  const filteredYears = years.filter((year) =>
    year.toString().includes(query.toLowerCase())
  );
  const [isLoading, setIsLoading] = useState(true);
  const [biopsyFiles, setBiopsyFiles] = useState({});
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [selectedOtherBiopsyLocations, setSelectedOtherBiopsyLocations] =
    useState([]);
  const [otherBiopsies, setOtherBiopsies] = useState([
    { id: 1, date: "", location: "", files: [] },
  ]);

  const { mutate: updateSurveyResponse } = useUpdateSurveyResponse();

  // Add these watch calls to monitor biopsy responses
  const kidneyBiopsyResponse = watch("kidneyBiopsy");
  const otherBiopsyResponse = watch("otherBiopsy");

  // Add this watch call to monitor current stage
  const currentStageValue = watch("currentStage");

  const stages = [
    { id: "1", name: "Stage 1" },
    { id: "2", name: "Stage 2" },
    { id: "3", name: "Stage 3" },
    { id: "4", name: "Stage 4" },
    { id: "Unknown", name: "Unknown" },
  ];

  const lateralityOptions = [
    { value: "right", name: "Right" },
    { value: "left", name: "Left" },
    { value: "both", name: "Both" },
  ];

  const otherBiopsyLocations = [
    { value: "lymphNodes", name: "Lymph Nodes" },
    { value: "kidney", name: "Kidney" },
    { value: "bone", name: "Bone" },
    { value: "liver", name: "Liver" },
    { value: "lung", name: "Lung" },
    { value: "pancreas", name: "Pancreas" },
    { value: "brain", name: "Brain" },
    { value: "adrenalGland", name: "Adrenal Gland" },
    { value: "spleen", name: "Spleen" },
    { value: "retroperitoneum", name: "Retroperitoneum" },
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
      currentStage:
        data.currentStage.id === "unknown"
          ? null
          : Number(data.currentStage.id),
      stageAtDiagnosis:
        data.stageAtDiagnosis.id === "unknown"
          ? null
          : Number(data.stageAtDiagnosis.id),
      kidneyBiopsy: data.kidneyBiopsy === "yes" ? true : false,
      kidneyBiopsyDate: data.kidneyBiopsyDate,
      laterality: data.laterality.value === null ? null : data.laterality.value,
      sarcomatoidFeatures:
        data.sarcomatoidFeatures.id === "unknown"
          ? null
          : data.sarcomatoidFeatures.id,
      necrosis: data.necrosis.id === "unknown" ? null : data.necrosis.id,
      tumorSize: Number(data.tumorSize),
      largestTumorSize: Number(data.largestTumorSize),
      dateOfDiagnosis: data.dateOfDiagnosis,
      otherBiopsies: data.otherBiopsies?.map((biopsy) => ({
        ...biopsy,
        location: biopsy.location?.value || biopsy.location,
      })),
    };

    updateSurveyResponse(
      {
        formData: transformedData,
      },
      {
        onSuccess: (response) => {
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

  const handleFileChange = (event, recordTitle) => {
    const uploadedFiles = Array.from(event.target.files);
    setBiopsyFiles((prevFiles) => ({
      ...prevFiles,
      [recordTitle]: uploadedFiles,
    }));
    setIsFileUploaded(uploadedFiles.length > 0);
  };

  const addBiopsyEntry = () => {
    setOtherBiopsies([
      ...otherBiopsies,
      { id: otherBiopsies.length + 1, date: "", location: "", files: [] },
    ]);
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
          Basic Information
        </h1>
        <p className="text-gray-400 text-center w-full">
          The information you provide will be used to help us request your
          medical records and update you about the registry.
        </p>
        <p className="text-gray-400 text-center w-full text-xs">
          No identifiable information such as name, contact information, or
          individual addresses will be shared.
        </p>

        <div className="flex flex-col mt-8">
          <div className="flex flex-col text-gray-600 text-left w-full">
            <IconBox icon={faNotesMedical} />
            <div className="w-full mx-auto">
              <div className="w-full">
                <label className="block font-medium text-gray-600 mb-1 text-xl">
                  When were you diagnosed?
                </label>
                <p className="text-gray-400 text-sm">
                  Based on the date the cancer was first seen on imaging (MRI,
                  CT, etc.).
                </p>
                <input
                  type="date"
                  className="mt-1 block w-full py-2 px-4 text-semi-bold text-left  rounded-md border-gray-300 shadow-sm border  focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                  {...register("dateOfDiagnosis")}
                  defaultValue={filteredYears[0]?.toString()}
                />
              </div>
            </div>

            <h2 className="text-gray-600 text-left w-full text-2xl font-bold mt-8">
              Staging
            </h2>
            <p className="text-gray-400 text-md">
              A list of stages and definitions can be found{" "}
              <a
                href="https://www.cancer.org/cancer/cancer-stages.html"
                className="text-blue-500"
                target="_blank"
              >
                {" "}
                here.
              </a>
            </p>
            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto mt-4">
              {/* <div className="col-span-3">
                <label className="block font-medium text-gray-600 mb-1 text-lg">
                  Secondary Histology
                </label>
                <p className="text-gray-400 text-sm">
                  Often but not always listed in the pathology report.
                </p>
                <SelectField
                  id="secondaryHistology"
                  name="secondaryHistology"
                  required={true}
                  options={[
                    { id: "classic", name: "Classic Chromophobe" },
                    { id: "esinophilic", name: "Eosinophilic Chromophobe" },
                    { id: "other", name: "Other" },
                    { id: null, name: "Unknown" },
                  ]}
                  register={register}
                  control={control}
                />
              </div> */}
              <div className="col-span-1">
                <label className="block  font-medium text-gray-600 mb-1 text-lg">
                  What stage were you at the time of diagnosis?
                </label>

                <SelectField
                  key="stageAtDiagnosis"
                  id="stageAtDiagnosis"
                  name="stageAtDiagnosis"
                  required={true}
                  options={stages}
                  register={register}
                  control={control}
                />
              </div>
              <div className="col-span-1">
                <div className="relative flex items-center gap-2">
                  <label className="block font-medium text-gray-600  text-lg">
                    What is your current stage?
                  </label>

                  <div className="group relative">
                    <FontAwesomeIcon
                      icon={faCircleInfo}
                      className="text-gray-400 h-4 w-4"
                    />
                    <div className="invisible group-hover:visible absolute z-50 left-6 -top-2 w-60 p-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg">
                      This is the furthest stage your cancer has ever progressed
                      to. No Evidence of Disease (NED) is considered a disease
                      state instead of a stage.
                    </div>
                  </div>
                </div>

                <SelectField
                  key="currentStage"
                  id="currentStage"
                  name="currentStage"
                  required={true}
                  options={stages}
                  register={register}
                  control={control}
                  hoverText="This is the stage of your cancer at the time of diagnosis."
                />
              </div>
              <div className="col-span-1">
                <label className="block  font-medium text-gray-600 mb-1 text-lg">
                  Was it in your right kidney, left kidney, or both?
                </label>

                <SelectField
                  key="laterality"
                  id="laterality"
                  name="laterality"
                  required={true}
                  options={lateralityOptions}
                  register={register}
                  control={control}
                />
              </div>
              <div className="col-span-1">
                <InputField
                  key="tumorSize"
                  id="tumorSize"
                  name="tumorSize"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  label="Size of tumor on kidney at diagnosis? (cm)"
                  required={true}
                  register={register}
                  control={control}
                  placeholder="Enter tumor size in cm"
                />
              </div>

              {currentStageValue?.id === "4" && (
                <div className="col-span-1">
                  <InputField
                    key="largestTumorSize"
                    id="largestTumorSize"
                    name="largestTumorSize"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    label="Size of largest tumor (cm)"
                    required={true}
                    register={register}
                    control={control}
                    placeholder="Enter tumor size in cm"
                  />
                </div>
              )}
              <div className="col-span-1">
                <div className="relative flex items-center gap-2">
                  <label className="block font-medium text-gray-600 text-lg">
                    Did your tumor have sarcomatoid features?
                  </label>
                  <div className="group relative">
                    <FontAwesomeIcon
                      icon={faCircleInfo}
                      className="text-gray-400 h-4 w-4"
                    />
                    <div className="invisible group-hover:visible absolute z-50 left-6 -top-2 w-60 p-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg">
                      Sarcomatoid features are reported in the pathology report.
                    </div>
                  </div>
                </div>
                <SelectField
                  key="sarcomatoidFeatures"
                  id="sarcomatoidFeatures"
                  name="sarcomatoidFeatures"
                  required={true}
                  options={[
                    { id: true, name: "Yes" },
                    { id: false, name: "No" },
                    { id: null, name: "Unknown" },
                  ]}
                  register={register}
                  control={control}
                />
              </div>

              <div className="col-span-1">
                <div className="relative flex items-center gap-2">
                  <label className="block font-medium text-gray-600 text-lg">
                    Did your tumor have necrosis?
                  </label>
                  <div className="group relative">
                    <FontAwesomeIcon
                      icon={faCircleInfo}
                      className="text-gray-400 h-4 w-4"
                    />
                    <div className="invisible group-hover:visible absolute z-50 left-6 -top-2 w-60 p-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg">
                      Necrosis is reported in the pathology report.
                    </div>
                  </div>
                </div>
                <SelectField
                  key="necrosis"
                  id="necrosis"
                  name="necrosis"
                  required={true}
                  options={[
                    { id: true, name: "Yes" },
                    { id: false, name: "No" },
                    { id: null, name: "Unknown" },
                  ]}
                  register={register}
                  control={control}
                />
              </div>
            </div>

            <hr className="w-full border-gray-300 my-8" />

            <IconBox icon={faHospital} />

            <h2 className="text-gray-600 text-left w-full text-2xl font-bold mt-8">
              Biopsies
            </h2>
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto mt-4">
              <div
                className={`col-span-2 ${
                  kidneyBiopsyResponse === "yes"
                    ? "border border-gray-300 rounded-lg p-4"
                    : ""
                }`}
              >
                <label className="block font-medium text-gray-600 mb-1 text-lg">
                  Did you have a biopsy of the tumor in your kidney?
                </label>

                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="kidneyBiopsyYes"
                      name="kidneyBiopsy"
                      value="yes"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      {...register("kidneyBiopsy", { required: true })}
                    />
                    <label
                      htmlFor="kidneyBiopsyYes"
                      className="ml-2 text-gray-700"
                    >
                      Yes
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="kidneyBiopsyNo"
                      name="kidneyBiopsy"
                      value="no"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      {...register("kidneyBiopsy", { required: true })}
                    />
                    <label
                      htmlFor="kidneyBiopsyNo"
                      className="ml-2 text-gray-700"
                    >
                      No
                    </label>
                  </div>
                </div>
                {kidneyBiopsyResponse === "yes" && (
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto mt-4">
                    <div className="col-span-1">
                      <label className="block font-medium text-gray-600 mb-1">
                        When was the biopsy performed?
                      </label>
                      <input
                        type="date"
                        className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        {...register("kidneyBiopsyDate", { required: true })}
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block font-medium text-gray-600 mb-1">
                        Upload Pathology Report
                      </label>
                      <p className="text-sm text-gray-500 mt-1 mb-2">
                        From the biopsy, not surgery.
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
                            onChange={(e) =>
                              handleFileChange(e, "KidneyBiopsyReport")
                            }
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          />
                        </div>

                        {biopsyFiles["KidneyBiopsyReport"] &&
                          biopsyFiles["KidneyBiopsyReport"].length > 0 && (
                            <div className="mt-2 text-sm text-gray-500">
                              {biopsyFiles["KidneyBiopsyReport"]
                                .map((file) => file.name)
                                .join(", ")}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`col-span-2 ${
                  kidneyBiopsyResponse === "yes" ||
                  otherBiopsyResponse === "yes"
                    ? "border border-gray-300 rounded-lg p-4"
                    : ""
                }`}
              >
                <label className="block font-medium text-gray-600 mb-1 text-lg">
                  Have you had other locations biopsied related to your kidney
                  cancer?
                </label>

                <div className="flex gap-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="otherBiopsyYes"
                      name="otherBiopsy"
                      value="yes"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      {...register("otherBiopsy", { required: true })}
                    />
                    <label
                      htmlFor="otherBiopsyYes"
                      className="ml-2 text-gray-700"
                    >
                      Yes
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="otherBiopsyNo"
                      name="otherBiopsy"
                      value="no"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      {...register("otherBiopsy", { required: true })}
                    />
                    <label
                      htmlFor="otherBiopsyNo"
                      className="ml-2 text-gray-700"
                    >
                      No
                    </label>
                  </div>
                </div>
                {otherBiopsyResponse === "yes" && (
                  <div className="w-full space-y-4 mt-4">
                    {otherBiopsies.map((biopsy, index) => (
                      <div
                        key={biopsy.id}
                        className="border border-gray-200 rounded-lg p-4 space-y-4 bg-slate-50"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium text-gray-700">
                            Additional Biopsy #{index + 1}
                          </h3>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                setOtherBiopsies(
                                  otherBiopsies.filter(
                                    (b) => b.id !== biopsy.id
                                  )
                                )
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="col-span-1">
                            <label className="block font-medium text-gray-600 mb-1 pb-1">
                              When was this biopsy performed?
                            </label>
                            <input
                              type="date"
                              className="mt-1 block w-full py-3 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500 sm:text-base"
                              {...register(`otherBiopsies.${index}.date`, {
                                required: true,
                              })}
                            />
                          </div>

                          <div className="col-span-1">
                            <label className="block font-medium text-gray-600 mb-1">
                              Location biopsied
                            </label>
                            <SelectField
                              id={`otherBiopsies.${index}.location`}
                              name={`otherBiopsies.${index}.location`}
                              required={true}
                              options={otherBiopsyLocations}
                              register={register}
                              control={control}
                            />
                          </div>

                          <div className="col-span-2">
                            <label className="block font-medium text-gray-600 mb-1">
                              Upload Pathology Report
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
                                    handleFileChange(
                                      e,
                                      `otherBiopsy${biopsy.id}`
                                    )
                                  }
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                              </div>
                              {biopsyFiles[`otherBiopsy${biopsy.id}`]?.length >
                                0 && (
                                <div className="mt-2 text-sm text-gray-500">
                                  {biopsyFiles[`otherBiopsy${biopsy.id}`]
                                    .map((file) => file.name)
                                    .join(", ")}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addBiopsyEntry}
                      className="mt-4 text-blue-500 hover:text-blue-700 font-medium"
                    >
                      + Add Another Biopsy Location
                    </button>
                  </div>
                )}
              </div>
            </div>

            <hr className="w-full border-gray-300 my-8" />
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto mt-12 w-full">
              <InputField
                id="firstName"
                name="firstName"
                label="First Name"
                required={true}
                placeholder="Enter your first name"
                register={register}
              />
              <InputField
                id="middleName"
                name="middleName"
                label="Middle Name"
                required={false}
                placeholder="Enter your middle name"
                register={register}
              />
              <InputField
                id="lastName"
                name="lastName"
                label="Last Name"
                required={true}
                placeholder="Enter your last name"
                register={register}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 mx-auto text-gray-600 text-center gap-4 mt-5 w-full">
              <InputField
                id="email"
                name="email"
                label="Email"
                required={true}
                placeholder="Enter your email"
                register={register}
              />
              <InputField
                id="phoneNumber"
                name="phoneNumber"
                label="Phone Number"
                required={true}
                placeholder="Enter your phone number"
                register={register}
              />
            </div> */}
          </div>
          <div className="flex justify-end mt-12">
            <ActionButton
              variant="primary"
              type="submit"
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
