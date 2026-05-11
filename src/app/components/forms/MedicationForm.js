"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import InputField from "../inputs/InputField";
import SelectField from "../inputs/SelectField";
import { useSurveyContext } from "../../context/SurveyContext";
import MedicationsDropdown from "../inputs/MedicationsDropdown";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faPills,
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

export default function MedicationForm() {
  const { register, handleSubmit, watch, control, setValue } = useForm();
  const [pageData, setPageData] = useState(null);
  const { state, setState } = useSurveyContext();
  const [isLoading, setIsLoading] = useState(true);
  const [medications, setMedications] = useState([
    {
      id: 1,
      startDate: "",
      endDate: "",
      type: "",
      sessions: "",
      files: [],
      currentlyTaking: false,
    },
  ]);

  const [isDropdownOpen, setIsDropdownOpen] = useState({});
  const [collapsedMedications, setCollapsedMedications] = useState({});
  const { mutate: updateSurveyResponse } = useUpdateSurveyResponse();

  const medicationResponse = watch("hadMedication");

  const kidneyCancerMedications = [
    {
      id: 1,
      nameBrand: "Afinitor",
      nameGeneric: "Everolimus",
      type: "mTOR inhibitor",
      administration: "pill",
    },
    {
      id: 2,
      nameBrand: "Keytruda",
      nameGeneric: "Pembrolizumab",
      type: "immunotherapy",
      administration: "infusion",
    },
    {
      id: 3,
      nameBrand: "Opdivo",
      nameGeneric: "Nivolumab",
      type: "immunotherapy",
      administration: "infusion",
    },
    {
      id: 4,
      nameBrand: "Lenvima",
      nameGeneric: "Lenvatinib",
      type: "TKI",
      administration: "pill",
    },
  ];

  const responseOptions = [
    { id: 1, value: "stable", name: "Stable Disease" },
    { id: 2, value: "reduction", name: "Reduction in Size or Qty of Tumors" },
    { id: 3, value: "growth", name: "Growth in Tumor Size or Qty" },
    { id: 4, value: "mixed", name: "Mixed Response" },
    { id: 5, value: "unknown", name: "Unknown" },
  ];

  const stoppingReasons = [
    { id: 1, value: "still_on_treatment", name: "Still on Treatment" },
    { id: 2, value: "finished_cycles", name: "Finished All Treatment Cycles" },
    { id: 3, value: "no_evidence", name: "No Evidence of Disease" },
    { id: 4, value: "side_effects", name: "Side Effects" },
    { id: 5, value: "progression", name: "Tumor Growth or Progression" },
    { id: 6, value: "other", name: "Other" },
  ];

  const frequencyOptions = [
    { id: 1, value: "daily", name: "Daily" },
    { id: 2, value: "twice_daily", name: "Twice Daily" },
    { id: 3, value: "three_times_daily", name: "Three Times Daily" },
    { id: 3, value: "every_other_day", name: "Every Other Day" },
    { id: 4, value: "weekly", name: "Weekly" },
    { id: 5, value: "every_two_weeks", name: "Every 2 Weeks" },
    { id: 4, value: "every_three_weeks", name: "Every 3 Weeks" },
    { id: 5, value: "every_four_weeks", name: "Every 4 Weeks" },
    { id: 6, value: "every_six_weeks", name: "Every 6 Weeks" },
    { id: 7, value: "every_eight_weeks", name: "Every 8 Weeks" },
    { id: 8, value: "every_twelve_weeks", name: "Every 12 Weeks" },
    { id: 9, value: "every_six_months", name: "Every 6 Months" },
    { id: 10, value: "yearly", name: "Yearly" },
  ];

  useEffect(() => {
    const loadPageData = async () => {
      const data = await fetchPageDetails();
      setPageData(data);
      setIsLoading(false);
    };
    loadPageData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".relative")) {
        setIsDropdownOpen({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const onSubmit = (data) => {
    const transformedData = {
      responseId: state.responseId,
      surveyId: "936e530f-1927-4d33-af46-e395a34145b5",
      systemicTreatment: data.hadMedication === "yes" ? true : false,
      medications: data.medications?.map((medication) => ({
        medicationId: medication.selectedMedication.id,
        brandName: medication.selectedMedication.nameBrand,
        genericName: medication.selectedMedication.nameGeneric,
        type: medication.selectedMedication.type,
        administration: medication.selectedMedication.administration,
        startDate: medication.startDate,
        endDate: medication.endDate === "" ? null : medication.endDate,
        currentlyTaking:
          medication.endDate === "" || medication.endDate === null
            ? true
            : false,
        response: medication.response.id,
        discontinuationReason: medication.discontinuationReason.id,
        notes: medication.notes,
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

  const handleMedicationChange = (selectedMedication, index) => {
    const updatedMedications = medications.map((med, i) => {
      if (i === index) {
        return {
          ...med,
          selectedMedication,
        };
      }
      return med;
    });
    setMedications(updatedMedications);

    setValue(`medications.${index}.selectedMedication`, selectedMedication);
  };

  const handleDateChange = (event, index, field) => {
    const updatedMedications = medications.map((med, i) => {
      if (i === index) {
        return {
          ...med,
          [field]: event.target.value,
        };
      }
      return med;
    });
    setMedications(updatedMedications);
  };

  const handleFileChange = (event, recordId) => {
    const uploadedFiles = Array.from(event.target.files);
    const updatedTreatments = medications.map((treatment) => {
      if (treatment.id === recordId) {
        return { ...treatment, files: uploadedFiles };
      }
      return treatment;
    });
    setMedications(updatedTreatments);
  };

  const addMedication = () => {
    // Collapse all existing medications
    const newCollapsedState = {};
    medications.forEach((med) => {
      newCollapsedState[med.id] = true;
    });

    // Add new medication and keep it expanded
    const newMedicationId = medications.length + 1;
    newCollapsedState[newMedicationId] = false;

    setCollapsedMedications(newCollapsedState);
    setMedications([
      ...medications,
      {
        id: newMedicationId,
        startDate: "",
        endDate: "",
        type: "",
        sessions: "",
        files: [],
        currentlyTaking: false,
      },
    ]);
  };

  const toggleMedicationCollapse = (medicationId) => {
    setCollapsedMedications((prev) => ({
      ...prev,
      [medicationId]: !prev[medicationId],
    }));
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
          Medication History
        </h1>
        <p className="text-gray-400 text-center w-full">
          Please provide information about any medications you have received for
          your kidney cancer.
        </p>

        <div className="flex flex-col">
          <div className="w-full mx-auto gap-4 mt-4">
            <IconBox icon={faPills} />
          </div>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto mt-4">
            <div className="col-span-2 text-center">
              <label className="block font-medium text-gray-600 mb-1 text-lg">
                Have you received medication for your kidney cancer?
              </label>

              <div className="flex gap-4 justify-center">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="medicationYes"
                    name="hadMedication"
                    value="yes"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    {...register("hadMedication", { required: true })}
                  />
                  <label htmlFor="medicationYes" className="ml-2 text-gray-700">
                    Yes
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="medicationNo"
                    name="hadMedication"
                    value="no"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    {...register("hadMedication", { required: true })}
                  />
                  <label htmlFor="medicationNo" className="ml-2 text-gray-700">
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>

          {medicationResponse === "yes" && (
            <div className="space-y-4 mt-4">
              {medications.map((medication, index) => (
                <div
                  key={medication.id}
                  className="border border-gray-300 rounded-lg p-4 shadow-sm bg-slate-50"
                >
                  <div
                    className="flex justify-between items-center mb-4 cursor-pointer"
                    onClick={() => toggleMedicationCollapse(medication.id)}
                  >
                    <h3 className="font-semibold text-gray-700">
                      Medication #{index + 1}
                      {medication.selectedMedication && (
                        <span className="ml-2 text-indigo-600">
                          - {medication.selectedMedication.nameBrand} (
                          {medication.selectedMedication.nameGeneric})
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-4">
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMedications(
                              medications.filter((t) => t.id !== medication.id)
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
                          toggleMedicationCollapse(medication.id);
                        }}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        <FontAwesomeIcon
                          icon={
                            collapsedMedications[medication.id]
                              ? faChevronDown
                              : faChevronUp
                          }
                        />
                      </button>
                    </div>
                  </div>

                  {!collapsedMedications[medication.id] && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <MedicationsDropdown
                          items={kidneyCancerMedications}
                          value={medications[index].selectedMedication}
                          onChange={(selected) =>
                            handleMedicationChange(selected, index)
                          }
                          placeholder="Type to search or click arrow to view all medications..."
                          index={index}
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-gray-600 mb-1">
                          <div className="pb-1">Start Date</div>
                        </label>
                        <input
                          type="date"
                          {...register(`medications.${index}.startDate`, {
                            required: true,
                            onChange: (e) =>
                              handleDateChange(e, index, "startDate"),
                          })}
                          value={medications[index].startDate}
                          className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="font-medium text-gray-600 mb-1 flex flex-row gap-2 items-center">
                          <div>End Date </div>
                          <div className="text-red-500">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                id={`currentlyTaking-${index}`}
                                checked={medications[index].currentlyTaking}
                                disabled={medications[index].endDate}
                                onChange={(e) => {
                                  const updatedMedications = medications.map(
                                    (med, i) => {
                                      if (i === index) {
                                        return {
                                          ...med,
                                          currentlyTaking: e.target.checked,
                                          endDate: e.target.checked
                                            ? null
                                            : med.endDate,
                                        };
                                      }
                                      return med;
                                    }
                                  );
                                  setMedications(updatedMedications);
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />

                              <label
                                htmlFor={`currentlyTaking-${index}`}
                                className="ml-2 text-sm text-gray-600"
                              >
                                Currently Taking
                              </label>
                            </div>
                          </div>
                        </label>
                        <div className="space-y-2 flex flex-row">
                          <input
                            type="date"
                            {...register(`medications.${index}.endDate`, {
                              required: !medications[index].currentlyTaking,
                              onChange: (e) =>
                                handleDateChange(e, index, "endDate"),
                            })}
                            value={medications[index].endDate || ""}
                            disabled={medications[index].currentlyTaking}
                            className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500 disabled:bg-slate-100"
                          />
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block font-medium text-gray-600 mb-1">
                          Response
                        </label>
                        <SelectField
                          id={`medications.${index}.response`}
                          name={`medications.${index}.response`}
                          required={true}
                          options={responseOptions}
                          register={register}
                          control={control}
                          placeholder="Select response..."
                        />
                      </div>

                      <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex gap-2 flex-col">
                          <label className="block font-medium text-gray-600">
                            Initial Dose
                          </label>
                          <InputField
                            id={`medications.${index}.customInitialDose`}
                            name={`medications.${index}.customInitialDose`}
                            register={register}
                            type="text"
                            control={control}
                            placeholder="Enter dose (e.g., 40mg)"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-gray-600 mb-2">
                            Frequency
                          </label>
                          <SelectField
                            id={`medications.${index}.frequency`}
                            name={`medications.${index}.frequency`}
                            required={true}
                            options={frequencyOptions}
                            register={register}
                            control={control}
                            placeholder="Select frequency..."
                          />
                        </div>
                      </div>

                      <div className="col-span-2">
                        <label className="block font-medium text-gray-600 mb-1">
                          Dose Reductions
                        </label>
                        {medications[index].doseReductions?.map(
                          (reduction, reductionIndex) => (
                            <div
                              key={reductionIndex}
                              className="flex flex-col gap-4 mb-4 p-4 bg-gray-400       rounded-lg"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-600 mb-1">
                                    Reduction Date
                                  </label>
                                  <input
                                    type="date"
                                    {...register(
                                      `medications.${index}.doseReductions.${reductionIndex}.date`,
                                      { required: true }
                                    )}
                                    className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                                  />
                                </div>
                                <div className="mt-3">
                                  <InputField
                                    id={`medications.${index}.doseReductions.${reductionIndex}.customNewDose`}
                                    name={`medications.${index}.doseReductions.${reductionIndex}.customNewDose`}
                                    register={register}
                                    type="text"
                                    control={control}
                                    placeholder="Enter dose (e.g., 15mg daily)"
                                    className="mt-2"
                                  />
                                </div>
                                <div className="mt-3 col-span-2">
                                  <label className="block font-medium text-gray-600 mb-1">
                                    Reason for Reduction
                                  </label>
                                  <InputField
                                    id={`medications.${index}.doseReductions.${reductionIndex}.reason`}
                                    name={`medications.${index}.doseReductions.${reductionIndex}.reason`}
                                    register={register}
                                    type="textarea"
                                    control={control}
                                    placeholder="Enter reason for reduction"
                                    className="mt-2"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const updatedMedications = medications.map(
                                    (med, i) => {
                                      if (i === index) {
                                        return {
                                          ...med,
                                          doseReductions:
                                            med.doseReductions.filter(
                                              (_, i) => i !== reductionIndex
                                            ),
                                        };
                                      }
                                      return med;
                                    }
                                  );
                                  setMedications(updatedMedications);
                                }}
                                className="text-red-500 hover:text-red-700 self-end"
                              >
                                Remove Reduction
                              </button>
                            </div>
                          )
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedMedications = medications.map(
                              (med, i) => {
                                if (i === index) {
                                  return {
                                    ...med,
                                    doseReductions: [
                                      ...(med.doseReductions || []),
                                      { date: "", newDose: null },
                                    ],
                                  };
                                }
                                return med;
                              }
                            );
                            setMedications(updatedMedications);
                          }}
                          className="text-blue-500 hover:text-blue-700 text-sm"
                        >
                          + Add Dose Reduction
                        </button>
                      </div>

                      <div className="col-span-2">
                        <label className="block font-medium text-gray-600 mb-1">
                          Discontinuation Reason
                        </label>
                        <SelectField
                          id={`medications.${index}.discontinuationReason`}
                          name={`medications.${index}.discontinuationReason`}
                          required={true}
                          options={stoppingReasons}
                          register={register}
                          control={control}
                          placeholder="Select discontinuation reason..."
                        />
                      </div>

                      <div className="col-span-2">
                        <InputField
                          id={`medications.${index}.notes`}
                          name={`medications.${index}.notes`}
                          required={true}
                          register={register}
                          type="text"
                          label="Notes"
                          control={control}
                          placeholder="Enter any notes about this medication"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block font-medium text-gray-600 mb-1">
                          Upload Medication Reports
                        </label>
                        <p className="text-sm text-gray-500 mt-1 mb-2">
                          Please upload any available medication lists or
                          summaries. Only the cancer related medications will be
                          included in this survery.
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
                                handleFileChange(e, medication.id)
                              }
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          {medication.files?.length > 0 && (
                            <div className="mt-2 text-sm text-gray-500">
                              {medication.files
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
                onClick={addMedication}
                className="mt-4 text-blue-500 hover:text-blue-700 font-medium"
              >
                + Add Another Medication
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
