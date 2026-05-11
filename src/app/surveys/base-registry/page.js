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
import SurgeryForm from "@/app/components/forms/SurgeryForm";
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
  { id: 3, name: "Surgery Information" },
  { id: 4, name: "Consent Form" },
  { id: 5, name: "Contact Information" },
  // { id: 5, name: "Enrollment Method", href: "#", status: "upcoming" },
  { id: 6, name: "Document Upload" },
  { id: 7, name: "Confirmation" },
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
        {state.step === 1 && <Welcome />}
        {/* {state.step === 1 && <ContactInfo />} */}
        {state.step === 4 && <Consent />}
        {state.step === 3 && <DiagnosisForm />}
        {state.step === 2 && <SurgeryForm />}
        {state.step === 5 && <ContactInformationForm />}
        {/* {state.step === 4 && <EnrollmentMethod />} */}
        {state.step === 6 && <FileUpload />}
        {state.step === 7 && <Confirmation setState={setState} />}
      </div>
    </div>
  );
}
