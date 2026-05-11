"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import InputField from "../inputs/InputField";
import SelectField from "../inputs/SelectField";
import { useSurveyContext } from "../../context/SurveyContext";
import LoadingSkeleton from "../LoadingSkeleton";
import IconBox from "../IconBox";
import {
  faContactBook,
  faContactCard,
  faPills,
} from "@fortawesome/free-solid-svg-icons";
import { useCreateSurveyResponse } from "@/app/hooks/useSurveys";
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

export default function ContactInformationForm() {
  const { register, handleSubmit, watch, setValue } = useForm();
  const [years, setYears] = useState([]);
  const [pageData, setPageData] = useState(null);
  const { setState } = useSurveyContext();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const { mutate: createSurveyResponse } = useCreateSurveyResponse();

  const loadingBars = [
    { width: "5/6", height: "4", lineGap: "0" },
    { width: "5/6", height: "4", lineGap: "4" },
    { width: "full", height: "4", lineGap: "4" },
    { width: "full", height: "4", lineGap: "4" },
    { width: "5/6", height: "4", lineGap: "8" },
    { width: "5/6", height: "4", lineGap: "4" },
    { width: "full", height: "4", lineGap: "4" },
    { width: "full", height: "4", lineGap: "4" },
  ];

  useEffect(() => {
    const loadPageData = async () => {
      const data = await fetchPageDetails();
      setPageData(data);
    };
    loadPageData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const onSubmit = (data) => {
    // Transform form data into required shape
    const formattedData = {
      answers: Object.entries(data).map(([questionId, answer]) => ({
        questionId,
        answer: answer || "", // Handle undefined/null values
      })),
    };
    createSurveyResponse(
      {
        surveyId: "936e530f-1927-4d33-af46-e395a34145b5",
        formData: formattedData,
      },
      {
        onSuccess: (response) => {
          toast.success("Survey response created successfully");
          setState((prevState) => ({
            ...prevState,
            step: prevState.step + 1,
            responseId: response.id,
          }));
        },
        onError: (error) => {
          toast.error(`Failed to create survey response: ${error.message}`);
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

  if (!pageData) {
    return (
      <div className="min-h-1/2 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 md:w-5/6 w-full">
          <LoadingSkeleton backgroundHeight="h-96" bars={loadingBars} />
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
          Contact Information
        </h1>
        <p className="text-gray-400 text-center w-full">
          The information you provide will be used to help us request your
          medical records and update you about the registry.
        </p>
        <p className="text-gray-400 text-center w-full text-xs">
          No identifiable information such as name, contact information, or
          individual addresses will be shared.
        </p>

        <div className="w-full mx-auto gap-4 mt-4">
          <IconBox icon={faContactCard} />
        </div>
        <div className="flex flex-col mt-8">
          <div className="flex flex-col text-gray-600 text-center w-full">
            <div className="grid grid-cols-1 md:grid-cols-1 mx-auto text-gray-600 text-center gap-4 mt-5 w-full">
              <InputField
                id="address1"
                name="address1"
                label="Address"
                required={true}
                placeholder="Enter your address"
                register={register}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 mx-auto text-gray-600 text-center gap-4 mt-5 w-full ">
              <InputField
                id="city"
                name="city"
                label="City"
                required={false}
                placeholder="Enter your city"
                register={register}
              />
              <InputField
                id="state"
                name="state"
                label="State"
                required={false}
                placeholder="Enter your state"
                register={register}
              />
              <InputField
                id="postalCode"
                name="postalCode"
                label="Postal Code"
                required={false}
                placeholder="Enter your postal code"
                register={register}
              />

              <InputField
                id="country"
                name="country"
                label="Country"
                required={false}
                placeholder="Enter your country"
                register={register}
              />
            </div>
          </div>
          <div className="flex flex-col text-gray-600 text-center w-full">
            <h2 className="text-2xl font-bold mt-8">Authorized Contact</h2>
            <p className="text-gray-400 text-center w-full text-sm">
              This ensures that we can reach out for any important updates if
              you may not be available or if your contact information changes.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 mx-auto text-gray-600 text-center gap-4 mt-5 w-full ">
              <InputField
                id="authorizedContactFullName"
                name="authorizedContactFullName"
                label="Authorized Full Name"
                required={false}
                placeholder="Enter contact's full name"
                register={register}
              />
              <InputField
                id="authorizedContactRelationship"
                name="authorizedContactRelationship"
                label="Authorized Relationship"
                required={false}
                placeholder="Enter your contact's relationship"
                register={register}
              />
              <InputField
                id="authorizedContactPhone"
                name="authorizedContactPhone"
                label="Authorized Phone"
                required={false}
                placeholder="Enter your contact's phone number"
                register={register}
              />
              <InputField
                id="authorizedContactEmail"
                name="authorizedContactEmail"
                label="Authorized Email"
                required={false}
                placeholder="Enter your contact's email"
                register={register}
              />
            </div>
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
