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
  faHospital,
} from "@fortawesome/free-solid-svg-icons";
import IconBox from "../IconBox";
import { useUpdateSurveyResponse } from "@/app/hooks/useSurveys";
import ActionButton from "../common/ActionButton";
import toast from "react-hot-toast";

const fetchPageDetails = async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    title: "Other Procedures",
    buttonText: "Continue",
  };
};

export default function ProcedureForm() {
  const [pageData, setPageData] = useState(null);
  const { state, setState } = useSurveyContext();
  const { mutate: updateSurveyResponse } = useUpdateSurveyResponse();
  const [isLoading, setIsLoading] = useState(true);
  const [procedures, setProcedures] = useState([]);
  const [collapsedProcedures, setCollapsedProcedures] = useState({});

  const { register, handleSubmit, watch, control, setValue } = useForm({
    defaultValues: {
      procedures: [
        {
          id: "1",
          date: "",
          type: "",
          notes: "",
          locations: "",
          files: [],
        },
      ],
    },
  });

  const hadProcedures = watch("hadProcedures");
  const watchedProcedures = watch("procedures");

  const procedureLocations = [
    { value: "kidney", name: "Kidney" },
    { value: "liver", name: "Liver" },
    { value: "lung", name: "Lung" },
    { value: "bone", name: "Bone" },
    { value: "lymphNodes", name: "Lymph Nodes" },
    { value: "adrenalGland", name: "Adrenal Gland" },
    { value: "brain", name: "Brain" },
    { value: "other", name: "Other" },
  ];

  useEffect(() => {
    if (watchedProcedures) {
      setProcedures(watchedProcedures);
    }
  }, [watchedProcedures]);

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
      additionalProcedures: data.hadProcedures === "yes" ? true : false,
      procedures:
        data.hadProcedures === "yes"
          ? data.procedures?.map((procedure) => ({
              name: procedure.type,
              targetAreas: procedure.locations.map((loc) => loc.id),
              startDate: procedure.date,
              files: procedure.files,
              notes: procedure.notes,
            }))
          : [],
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

  const toggleProcedureCollapse = (procedureId) => {
    setCollapsedProcedures((prev) => ({
      ...prev,
      [procedureId]: !prev[procedureId],
    }));
  };

  const addProcedure = () => {
    const newProcedureId = (procedures.length + 1).toString();
    const newProcedure = {
      id: newProcedureId,
      date: "",
      type: "",
      notes: "",
      locations: "",
      files: [],
    };

    setProcedures((prev) => [...prev, newProcedure]);
    setValue("procedures", [...procedures, newProcedure]);

    setCollapsedProcedures((prev) => ({
      ...procedures.reduce(
        (acc, procedure) => ({
          ...acc,
          [procedure.id]: true,
        }),
        {}
      ),
      [newProcedureId]: false,
    }));
  };

  const handleProcedureChange = (index, field, value) => {
    const updatedProcedures = [...procedures];
    updatedProcedures[index] = {
      ...updatedProcedures[index],
      [field]: value,
    };

    setProcedures(updatedProcedures);
    setValue(`procedures.${index}.${field}`, value);
  };

  const handleFileChange = (event, recordId) => {
    const uploadedFiles = Array.from(event.target.files);
    const updatedProcedures = procedures.map((procedure) => {
      if (procedure.id === recordId) {
        return { ...procedure, files: uploadedFiles };
      }
      return procedure;
    });

    setProcedures(updatedProcedures);
    const procedureIndex = procedures.findIndex((p) => p.id === recordId);
    if (procedureIndex !== -1) {
      setValue(`procedures.${procedureIndex}.files`, uploadedFiles);
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

  const handleProcedureLocationChange = (selectedOptions, index) => {
    const updatedTreatments = [...procedures];
    updatedTreatments[index] = {
      ...updatedTreatments[index],
      locations: selectedOptions,
    };
    setProcedures(updatedTreatments);
    setValue(`procedures.${index}.locations`, selectedOptions);
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

  return (
    <div className="flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="text-gray-700 text-center md:text-left w-full mx-auto"
      >
        <h1 className="md:text-4xl text-2xl font-bold text-center text-gray-700">
          Other Treatment Procedures
        </h1>
        <p className="text-gray-400 text-center w-full">
          Please provide information about any other procedures you have
          received for your kidney cancer (such as ablations, embolizations,
          etc.).
        </p>

        <div className="flex flex-col">
          <div className="w-full mx-auto gap-4 mt-4">
            <IconBox icon={faHospital} />
          </div>
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mx-auto mt-4">
            <div className="col-span-2 text-center">
              <label className="block font-medium text-gray-600 mb-1 text-lg">
                Have you had any other treatment related procedures for your
                kidney cancer?
              </label>

              <div className="flex gap-4 justify-center">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="proceduresYes"
                    name="hadProcedures"
                    value="yes"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    {...register("hadProcedures", { required: true })}
                  />
                  <label htmlFor="proceduresYes" className="ml-2 text-gray-700">
                    Yes
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="proceduresNo"
                    name="hadProcedures"
                    value="no"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    {...register("hadProcedures", { required: true })}
                  />
                  <label htmlFor="proceduresNo" className="ml-2 text-gray-700">
                    No
                  </label>
                </div>
              </div>
            </div>
          </div>

          {hadProcedures === "yes" && (
            <div className="space-y-4 mt-4">
              {procedures.map((procedure, index) => (
                <div
                  key={procedure.id}
                  className="border border-gray-300 rounded-lg p-4 shadow-sm bg-slate-50"
                >
                  <div
                    className="flex justify-between items-center mb-4 cursor-pointer"
                    onClick={() => toggleProcedureCollapse(procedure.id)}
                  >
                    <h3 className="font-semibold text-gray-700">
                      Procedure #{index + 1}
                      {procedure.date && (
                        <span className="ml-2 text-indigo-500">
                          {formatDate(procedure.date)}
                        </span>
                      )}
                      {procedure.type && (
                        <span className="text-indigo-500">
                          {" | "}
                          {procedure.type}
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setProcedures(
                            procedures.filter((p) => p.id !== procedure.id)
                          );
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>

                      <FontAwesomeIcon
                        icon={
                          collapsedProcedures[procedure.id]
                            ? faChevronDown
                            : faChevronUp
                        }
                        className="text-gray-500"
                      />
                    </div>
                  </div>

                  {!collapsedProcedures[procedure.id] && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <InputField
                          id={`procedures.${index}.type`}
                          name={`procedures.${index}.type`}
                          label="Procedure Type"
                          required={hadProcedures === "yes"}
                          register={register}
                          placeholder="Enter procedure type..."
                          onChange={(e) =>
                            handleProcedureChange(index, "type", e.target.value)
                          }
                          value={procedure.type}
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-lg text-gray-600 mt-1">
                          Procedure Date
                        </label>
                        <input
                          type="date"
                          {...register(`procedures.${index}.date`, {
                            required: hadProcedures === "yes",
                          })}
                          onChange={(e) =>
                            handleProcedureChange(index, "date", e.target.value)
                          }
                          className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <MultiSelect
                          id={`procedures.${index}.locations`}
                          name={`procedures.${index}.locations`}
                          required={hadProcedures === "yes"}
                          placeholder="Select all that apply"
                          options={procedureLocations.map((loc) => ({
                            id: loc.value,
                            name: loc.name,
                            value: loc.value,
                          }))}
                          value={procedure.locations || []}
                          onChange={(options) =>
                            handleProcedureLocationChange(options, index)
                          }
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block font-medium text-lg text-gray-600 pb-1">
                          Additional Details
                        </label>
                        <textarea
                          {...register(`procedures.${index}.notes`)}
                          onChange={(e) =>
                            handleProcedureChange(
                              index,
                              "details",
                              e.target.value
                            )
                          }
                          className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                          rows={3}
                          placeholder="Enter any additional details about the procedure..."
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block font-medium text-gray-600 mb-1">
                          Upload Procedure Reports
                        </label>
                        <p className="text-sm text-gray-500 mt-1 mb-2">
                          Please upload any available procedure reports or
                          related documentation.
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
                                handleFileChange(e, procedure.id)
                              }
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                          </div>
                          {procedure.files?.length > 0 && (
                            <div className="mt-2 text-sm text-gray-500">
                              {procedure.files
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
                onClick={addProcedure}
                className="mt-4 text-blue-500 hover:text-blue-700 font-medium"
              >
                + Add Another Procedure
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
