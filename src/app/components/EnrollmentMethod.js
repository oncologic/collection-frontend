"use client";
import { useState } from "react";
import Layout from "../components/Layout";
import VideoEmbed from "./VideoEmbed";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";
function EnrollmentMethod() {
  const [selectedOption, setSelectedOption] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const handleContinue = () => {
    // Logic to move to the next step, e.g., redirect or update context
    // Example: window.location.href = "/next-step";
  };

  return (
    <div className="donation-options p-6 bg-white rounded-lg shadow-md mb-10 h-full">
      <h2 className="text-4xl font-bold mb-6 text-gray-600 text-center">
        Enrollment Method
      </h2>
      <div className="h-full mx-auto aspect-video w-3/4">
        <VideoEmbed videoId="YQHsXMglC9A" />
      </div>
      <div className="w-5/6 mx-auto options grid grid-cols-1 md:grid-cols-2 gap-12 text-gray-600 p-4 mt-5">
        <div
          className={`option-card h-64 p-4 border rounded-lg transition duration-300 ease-in-out transform 
          ${
            selectedOption === "consent" ? "bg-blue-100" : "hover:bg-blue-100"
          }`}
          onClick={() => setSelectedOption("consent")}
        >
          <div className="flex flex-row gap-3 items-center mb-4">
            <h3 className="text-2xl font-semibold text-center">
              Upload Your Records
            </h3>{" "}
            <div className="self-center h-full relative">
              <button
                onClick={() => setShowInfo(!showInfo)}
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
                className="text-blue-400 hover:text-blue-500"
              >
                <FontAwesomeIcon icon={faInfoCircle} />
              </button>

              {showInfo && (
                <div className="absolute bg-white border rounded-lg p-4 mt-2 shadow-lg w-64 z-10 top-full left-[-200px]">
                  <p className="font-semibold">Examples of Fields Collected</p>
                  <ul className="list-disc list-inside">
                    <li>Cancer Diagnosis</li>
                    <li>Treatment</li>
                    <li>Surgeries</li>
                    <li>Biopsies</li>
                    <li>Scans</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div>
            <p>
              Answer a few basic questions about your cancer diagnosis and
              upload your medical records.
            </p>
            <p className="mt-2">
              We will deidentify your records for the registry.
            </p>

            <p className="mt-2">
              You will have the opportunity to add more information to the
              registry through additional studies and surveys.
            </p>
          </div>
        </div>
        <div
          className={`option-card h-64 p-4 border-2 rounded-lg transition duration-300 ease-in-out transform  z-10
          ${
            selectedOption === "detailed" ? "bg-blue-100" : "hover:bg-blue-100"
          }`}
          onClick={() => {
            setSelectedOption("detailed");
          }}
        >
          <h3 className="text-2xl font-semibold text-center mb-4">
            Submit for Record Request
          </h3>
          <div>
            <p>
              Let us know what institutions you have been see at for your cancer
              and we will pull your records from each institution to populate
              your registry record. This option may require additional signed
              forms from your institution and may take a few months to process.
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-end mt-12">
        <button
          onClick={handleContinue}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold py-2 px-8 rounded"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default EnrollmentMethod;
