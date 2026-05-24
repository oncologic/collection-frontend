import Link from "next/link";
import { FaArrowRight, FaChevronLeft } from "react-icons/fa";
import { useState } from "react";
import UpdateFeed from "./UpdateFeed";
import TextDisplay from "./common/TextDisplay";
import CustomEditor from "./common/CustomEditor";
import { getSurveyTypeById } from "../utils/general";
import Image from "next/image";

export const SurveyCard = ({ survey, onDismiss }) => {
  const isCompleted = survey?.hasResponded === true;
  const [isFlipped, setIsFlipped] = useState(false);
  const surveyType = getSurveyTypeById(survey?.surveyTypeId);

  // Function to generate a random pastel color based on the survey name
  const generatePastelColor = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Generate pastel color
    const h = hash % 360;
    return `hsl(${h}, 70%, 85%)`; // Pastel version using HSL
  };

  // Get first letter and background color
  const firstLetter = survey.name?.charAt(0).toUpperCase() || "?";
  const bgColor = generatePastelColor(survey.name);

  return (
    <div className="relative h-[350px] perspective">
      <div
        className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front of Card */}
        <div className="absolute w-full h-full backface-hidden">
          <div className="group relative flex flex-col h-full overflow-hidden rounded-lg bg-white shadow-sm transition-all hover:shadow-md">
            {/* Header Section with Background */}
            <div className="w-full bg-gradient-to-br from-slate-900 to-blue-950 p-4 text-white">
              <div className="flex items-center justify-between">
                {/* Logo */}
                <div className="w-16">
                  {survey?.organizations[0]?.imageUrl ? (
                    <Image
                      width={64}
                      height={64}
                      alt={
                        survey?.organizations[0]?.name || "Business Unit Logo"
                      }
                      src={survey?.organizations[0]?.imageUrl}
                      className="h-16 w-16 rounded-lg object-cover p-1"
                    />
                  ) : (
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-lg"
                      style={{ backgroundColor: bgColor }}
                    >
                      <span className="text-3xl font-semibold text-white">
                        {firstLetter}
                      </span>
                    </div>
                  )}
                </div>
                {/* Title centered in remaining space */}
                <div className="flex-grow text-center">
                  <span className="text-3xl font-semibold capitalize">
                    {surveyType.name}
                  </span>
                </div>
                {/* Spacer to balance the logo */}
                <div className="w-16"></div>
              </div>
            </div>

            {/* Content Section */}
            <div className="flex flex-col p-4 h-[calc(100%-160px)]">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {survey.name}
              </h3>
              <div className="flex-1 overflow-y-auto min-h-0">
                <TextDisplay
                  content={survey?.description}
                  maxLength={200}
                  className="prose max-w-none text-sm leading-relaxed"
                />
              </div>
            </div>

            {/* Actions Section */}
            <div className="mt-auto border-t border-gray-100">
              {isCompleted ? (
                <button
                  onClick={() => setIsFlipped(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-md font-medium text-green-500 hover:bg-green-50 transition-colors"
                >
                  View Updates
                </button>
              ) : (
                <Link
                  href={`/surveys/${survey.id}`}
                  className="flex items-center justify-center gap-2 px-4 py-3 text-md font-medium text-blue-500 hover:bg-gray-50 transition-colors"
                >
                  View Survey
                  <FaArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div className="group relative flex flex-col h-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="w-full bg-gradient-to-r from-green-400 to-emerald-400 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Updates</h3>
                <button
                  onClick={() => setIsFlipped(false)}
                  className="flex items-center gap-2 text-sm hover:text-white/80"
                >
                  <FaChevronLeft /> Back to Survey
                </button>
              </div>
            </div>
            <div className="flex-grow overflow-auto p-4">
              {survey?.updates?.length > 0 ? (
                <UpdateFeed updates={survey.updates} />
              ) : (
                <p className="text-sm text-gray-500 text-center">
                  No updates available.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add global styles for 3D transforms */}
      <style jsx global>{`
        .perspective {
          perspective: 2000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};
