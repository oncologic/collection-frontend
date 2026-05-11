"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCheckCircle,
  faStar,
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import IconBox from "./IconBox";

function Confirmation({ setState }) {
  const [isFileUploaded, setIsFileUploaded] = useState(false);

  const surveys = [
    {
      title: "Family History",
      id: 1,
      href: "/surveys/family-history",
      description:
        "Provide information about your family history of kidney or other cancers.",
    },
    {
      title: "Sequencing",
      id: 2,
      href: "/surveys/sequencing",
      description:
        "Share any sequencing you have had done. Let us know if you have had any NGS, WGS, WES, ctDNA, etc. If you haven't had any sequencing done, you can let us know if you'd be interested in sequencing in the future so if a study becomes available we can notify you.",
    },
    {
      title: "Exposures",
      id: 3,
      href: "/surveys/exposures",
      description:
        "Let us know about any exposures you've had to known carcinogens or toxins.",
    },
    {
      title: "Dietary / Lifestyle Survey",
      id: 4,
      href: "/surveys/dietary-lifestyle",
      description: "Share information about your diet and lifestyle.",
    },
    {
      title: "2025 Patient Requested Survey",
      id: 5,
      href: "/surveys/2025-patient-requested",
      description:
        "Questions suggested by patients and caregivers the chromophobe kidney cancer community. These questions are not required, but are a great way to help us understand your experience and the needs of the community.",
    },
  ];

  return (
    <div className="donation-options p-6  mb-10 h-full">
      <h2 className="text-4xl font-bold text-gray-600 text-center">
        Enrollment Complete
      </h2>
      <div className="flex flex-col items-center p-4 rounded-lg">
        <div className="flex justify-center items-center mb-8">
          <IconBox icon={faCheckCircle} variant="green" />
        </div>
        <p className="text-lg text-gray-600 text-center">
          Next, we will review your records, deidentify them, and begin the
          process of adding you to the registry.
        </p>
        <p className="text-gray-600 text-center text-sm">
          Due to the rarity of chromophobe RCC, we will update the registry
          three times a year or in batches of five or more to protect patient
          privacy.
        </p>
      </div>
      <div>
        <div
          className={`font-semibold mx-auto flex justify-center bg-blue-500 w-full text-white text-center rounded mt-4 mb-4 py-2 ${
            isFileUploaded ? "opacity-50" : ""
          }`}
        >
          Other Surveys or Registry Forms
        </div>
        <div className="mt-8 space-y-1">
          {surveys.map((record, index) => (
            <div key={index}>
              <div className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-700">
                    {record.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {record.description}
                  </p>
                </div>
                <div className="ml-4 flex justify-end">
                  <Link
                    href={record.href}
                    onClick={() => {
                      setState((prevState) => ({ ...prevState, step: 1 }));
                    }}
                    className="bg-blue-50 hover:bg-blue-100 w-40 text-center text-blue-600 rounded-lg px-4 py-2 transition-colors"
                  >
                    <span className="text-sm font-medium">Begin Survey</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end mt-12">
        <Link
          href="/dashboard"
          className={`text-white text-xl font-bold py-2 px-8 rounded bg-blue-500 hover:bg-blue-600"`}
          disabled={!isFileUploaded}
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export default Confirmation;
