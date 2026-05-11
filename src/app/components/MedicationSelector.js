"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle, faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import SelectField from "./inputs/SelectField";
import { useForm } from "react-hook-form";

export default function MedicationSelector({
  medications,
  selectedMedications,
  onMedicationChange,
  treatmentPhase,
  maxSelections = 30,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const { register, control, getValues } = useForm({
    defaultValues: {
      medications: selectedMedications.map((med) => ({
        startDate: med.startDate || "",
        endDate: med.endDate || "",
        response: med.response || "",
        stoppingReason: med.stoppingReason || "",
      })),
    },
  });
  const [isEditing, setIsEditing] = useState(true);
  const [showResponseModal, setShowResponseModal] = useState(false);

  const stoppingReasons = [
    { id: 1, value: "still_on_treatment", name: "Still on Treatment" },
    { id: 2, value: "finished_cycles", name: "Finished All Treatment Cycles" },
    { id: 3, value: "no_evidence", name: "No Evidence of Disease" },
    { id: 4, value: "side_effects", name: "Side Effects" },
    { id: 5, value: "progression", name: "Tumor Growth or Progression" },
    { id: 6, value: "other", name: "Other" },
  ];

  // Filter medications based on search query
  const filteredMedications = medications.filter((medication) =>
    [
      medication.brandName,
      medication.genericName,
      medication.type,
      medication.administration,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleMedicationToggle = (medication) => {
    // Check if the medication is already selected
    const existingEntry = selectedMedications.find(
      (med) => med.medication.id === medication.id
    );

    if (existingEntry && isEditing) {
      // Added isEditing check
      // Remove the medication only if in edit mode
      setError("");
      onMedicationChange(
        selectedMedications.filter((med) => med.medication.id !== medication.id)
      );
    } else if (!existingEntry) {
      // Add new medication only if not already selected
      if (selectedMedications.length >= maxSelections) {
        setError(
          `Maximum of ${maxSelections} medication${
            maxSelections === 1 ? "" : "s"
          } allowed`
        );
        return;
      }

      setError("");
      onMedicationChange([
        ...selectedMedications,
        {
          medication: medication,
          phase: treatmentPhase,
          startDate: medication.startDate || null,
          endDate: medication.endDate || null,
          response: medication.response || null,
          stoppingReason: medication.stoppingReason || null,
        },
      ]);
    }
  };

  const handleSearchKeyDown = (e, medications) => {
    if (e.key === "Enter" && medications.length === 1) {
      // If there's exactly one medication in filtered results, select it
      handleMedicationToggle(medications[0]);
      setSearchQuery(""); // Clear search after selection
    }
  };

  const responseOptions = [
    { id: 1, value: "stable", name: "Stable Disease" },
    { id: 2, value: "reduction", name: "Reduction in Size or Qty of Tumors" },
    { id: 3, value: "growth", name: "Growth in Tumor Size or Qty" },
    { id: 4, value: "mixed", name: "Mixed Response" },
    { id: 5, value: "unknown", name: "Unknown" },
  ];

  const handleConfirmSelection = () => {
    setIsEditing(false);
    setSearchQuery("");
    setShowResponseModal(true);
    onMedicationChange(selectedMedications);
  };

  const handleModalSubmit = () => {
    const formData = getValues();

    // Create new array with form data included
    const updatedMedications = selectedMedications.map((selectedMed, index) => {
      // Get the specific medication's form data
      const medicationFormData = formData.medications?.[index];

      return {
        ...selectedMed,
        startDate: medicationFormData?.startDate || selectedMed.startDate,
        endDate: medicationFormData?.endDate || selectedMed.endDate,
        response: medicationFormData?.response || selectedMed.response,
        stoppingReason:
          medicationFormData?.stoppingReason || selectedMed.stoppingReason,
      };
    });

    onMedicationChange(updatedMedications);
    setShowResponseModal(false);
  };

  return (
    <div className="space-y-4 rounded-lg shadow-sm">
      {isEditing ? (
        <>
          {/* Search and Response Selection */}
          <div className="flex gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              {/* Response Selection */}

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => handleSearchKeyDown(e, filteredMedications)}
                placeholder="Search medications..."
                className="w-full px-4 py-2 rounded-lg 
                         border-2
                         focus:outline-none focus:border-transparent
                         focus:ring-2 focus:ring-offset-2 focus:ring-offset-white
                         border-gray-300
                         focus:[background:linear-gradient(#fff,#fff)padding-box,linear-gradient(120deg,#60a5fa,#a78bfa)border-box]
                         placeholder-blue-300 shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 
                             text-blue-400 hover:text-blue-600"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Add Confirm Button */}
          <div className="flex justify-start">
            <button
              onClick={handleConfirmSelection}
              className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition-colors"
              disabled={selectedMedications.length === 0}
            >
              Confirm Selection
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm font-medium px-2">{error}</div>
          )}

          {/* Medications Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredMedications.map((medication) => {
              const isSelected = selectedMedications.some(
                (med) => med.medication.id === medication.id
              );

              return (
                <div
                  key={medication.id}
                  onClick={() => handleMedicationToggle(medication)}
                  className={`
                    relative rounded-lg border-2 cursor-pointer transition-all overflow-hidden
                    shadow-sm hover:shadow-md border-transparent
                    ${
                      isSelected
                        ? "[background:linear-gradient(135deg,#fff,#fff)padding-box,linear-gradient(120deg,#3b82f6,#8b5cf6)border-box]"
                        : "[background:linear-gradient(#fff,#fff)padding-box,linear-gradient(120deg,#e2e8f0,#cbd5e1)border-box] hover:[background:linear-gradient(#fff,#fff)padding-box,linear-gradient(120deg,#93c5fd,#c4b5fd)border-box]"
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <FontAwesomeIcon
                        icon={faCheckCircle}
                        className="w-5 h-5 text-indigo-500"
                      />
                    </div>
                  )}
                  <div>
                    <div
                      className={`
                        py-1 text-center text-xs font-medium w-full
                        ${
                          medication.type === "TKI"
                            ? "bg-purple-100 text-purple-700 capitalize"
                            : medication.type === "immunotherapy"
                            ? "bg-green-100 text-green-700 capitalize"
                            : medication.type === "mTOR inhibitor"
                            ? "bg-orange-100 text-orange-700 capitalize"
                            : "bg-blue-100 text-blue-700 capitalize"
                        }
                      `}
                    >
                      {medication.type}
                    </div>

                    <div className="p-3 space-y-1">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-gray-700 shadow-sm capitalize">
                        {medication.administration}
                      </span>
                      <div className="font-bold text-lg text-gray-900">
                        {medication.brandName}
                      </div>
                      <div className="text-blue-600 capitalize">
                        {medication.genericName}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Edit Button */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faPencilAlt} className="w-4 h-4" />
              Edit Medications
            </button>
          </div>

          {/* Selected Medications Only */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {selectedMedications.map(({ medication }) => (
              <div
                key={medication.id}
                onClick={() => handleMedicationToggle(medication)}
                className={`
                  relative rounded-lg border-2 cursor-pointer transition-all overflow-hidden
                  shadow-sm hover:shadow-md border-transparent
                  [background:linear-gradient(135deg,#fff,#fff)padding-box,linear-gradient(120deg,#3b82f6,#8b5cf6)border-box]
                  hover:[background:linear-gradient(#fff,#fff)padding-box,linear-gradient(120deg,#93c5fd,#c4b5fd)border-box]
                `}
              >
                {selectedMedications.some(
                  (med) => med.medication.id === medication.id
                ) && (
                  <div className="absolute top-2 right-2">
                    <FontAwesomeIcon
                      icon={faCheckCircle}
                      className="w-5 h-5 text-indigo-500"
                    />
                  </div>
                )}
                <div>
                  <div
                    className={`
                      py-1 text-center text-xs font-medium w-full
                      ${
                        medication.type === "TKI"
                          ? "bg-purple-100 text-purple-700 capitalize"
                          : medication.type === "immunotherapy"
                          ? "bg-green-100 text-green-700 capitalize"
                          : medication.type === "mTOR inhibitor"
                          ? "bg-orange-100 text-orange-700 capitalize"
                          : "bg-blue-100 text-blue-700 capitalize"
                      }
                    `}
                  >
                    {medication.type}
                  </div>

                  <div className="p-3 space-y-1">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-gray-700 shadow-sm capitalize">
                      {medication.administration}
                    </span>
                    <div className="font-bold text-lg text-gray-900">
                      {medication.brandName}
                    </div>
                    <div className="text-blue-600 capitalize">
                      {medication.genericName}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Add Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 bg-gray-400      bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[800px] max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Treatment Details
            </h2>

            <div className="space-y-6">
              {selectedMedications.map((selectedMed, index) => (
                <div
                  key={selectedMed.medication.id}
                  className="p-4 border rounded-lg space-y-4 bg-slate-50"
                >
                  <h3 className="font-semibold text-lg text-gray-800">
                    {selectedMed.medication.brandName}{" "}
                    <span className="capitalize">
                      ({selectedMed.medication.genericName})
                    </span>
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        {...register(`medications.${index}.startDate`)}
                        defaultValue={selectedMed.startDate || ""}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        {...register(`medications.${index}.endDate`)}
                        defaultValue={selectedMed.endDate || ""}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <SelectField
                      name={`medications.${index}.response`}
                      label="Treatment Response"
                      options={responseOptions}
                      required={true}
                      className="w-full"
                      placeholder="Select Response"
                      centerSelected={false}
                      register={register}
                      control={control}
                      defaultValue={selectedMed.response || ""}
                    />
                  </div>

                  <div>
                    <SelectField
                      name={`medications.${index}.stoppingReason`}
                      label="Reason for Stopping"
                      options={stoppingReasons}
                      required={true}
                      className="w-full"
                      placeholder="Select Reason"
                      centerSelected={false}
                      register={register}
                      control={control}
                      defaultValue={selectedMed.stoppingReason || ""}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowResponseModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSubmit}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
