"use client";

import { useState, useEffect } from "react";
import VideoEmbed from "./VideoEmbed";
import { useSurveyContext } from "../context/SurveyContext";
import ActionButton from "./common/ActionButton";

// Mock API call function
const fetchPageDetails = async () => {
  // Simulating API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    title: "Chromophobe RCC Patient Registry",
    description: [
      "Chromophobe Renal Cell Carcinoma (RCC) is a rare subtype of kidney cancer, accounting for approximately 5% of all RCC cases. This registry aims to help advance our understanding of Chromophobe RCC by collecting valuable insights from patients.",
      "Your participation can contribute to improved treatments and care for those affected by this condition in the future.",
    ],
    videoId: "PLAKRE5uC2k",
    buttonText: "Get Started",
  };
};

export default function Welcome() {
  const [pageData, setPageData] = useState(null);
  const { setState } = useSurveyContext();

  useEffect(() => {
    const loadPageData = async () => {
      const data = await fetchPageDetails();
      setPageData(data);
    };
    loadPageData();
  }, []);

  const handleGetStarted = () => {
    setState((prevState) => ({
      ...prevState,
      step: prevState.step + 1,
    }));
  };

  if (!pageData) {
    return (
      <div className="min-h-1/2 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 md:w-5/6 w-full">
          <div className="w-3/4 h-8 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="w-full h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="w-5/6 h-4 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <div className="w-full h-96 bg-gray-200 rounded mb-6 animate-pulse"></div>
          <div className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 md:p-2 w-full">
      <div className="bg-blue-600 text-white rounded-md py-4 px-6 mb-8">
        <h1 className="text-2xl font-bold text-center md:text-left">
          {pageData.title}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            About the Registry
          </h3>
          <div className="space-y-4">
            {pageData.description.map((paragraph, index) => (
              <p key={index} className="text-gray-600">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Introduction Video
            </h3>
            <div className="aspect-video w-full">
              <VideoEmbed videoId={pageData.videoId} />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <ActionButton variant="primary" onClick={handleGetStarted}>
          {pageData.buttonText}
        </ActionButton>
      </div>
    </div>
  );
}
