"use client";

import { useState, useEffect, useCallback } from "react";
import Welcome from "../../components/Welcome";
import { useSurveyContext } from "../../context/SurveyContext";
import ContactInfo from "../../components/ContactInfo";
import Consent from "@/app/components/Consent";
import DiagnosisForm from "@/app/components/forms/DiagnosisForm";
import ContactInformationForm from "@/app/components/forms/ContactInformationForm";
import EnrollmentMethod from "@/app/components/EnrollmentMethod";
import FileUpload from "@/app/components/FileUpload";
import Confirmation from "@/app/components/Confirmation";
import { FaCheck } from "react-icons/fa";
import Stepper from "@/app/components/Stepper";
import EmptyState from "@/app/components/EmptyState";
// Mock API call function
const fetchPageDetails = async () => {
  // Simulating API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    title: "Chromophobe RCC Patient Registry",
  };
};

const steps = [
  { id: 1, name: "Welcome" },
  { id: 2, name: "Diagnosis Information" },
  { id: 3, name: "Consent Form" },
  { id: 4, name: "Contact Information" },
  // { id: 5, name: "Enrollment Method", href: "#", status: "upcoming" },
  { id: 5, name: "Document Upload" },
  { id: 6, name: "Confirmation" },
];

export default function SurveyPage() {
  const [pageData, setPageData] = useState(null);
  const { state, setState } = useSurveyContext();

  // Function to handle step click
  const handleStepClick = useCallback(
    (step) => {
      setState((prevState) => ({ ...prevState, step }));
    },
    [setState]
  );

  useEffect(() => {
    const loadPageData = async () => {
      const data = await fetchPageDetails();
      setPageData(data);
    };
    loadPageData();
  }, []);

  return (
    <div className="flex items-center justify-center flex-col">
      {pageData && (
        <Stepper
          steps={steps}
          handleStepClick={handleStepClick}
          currentStep={state.step}
        />
      )}
      <div className="bg-white rounded-lg shadow-lg md:p-8 p-4 w-11/12 text-gray-700">
        <EmptyState />
      </div>
    </div>
  );
}
