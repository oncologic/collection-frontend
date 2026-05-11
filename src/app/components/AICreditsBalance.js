"use client";

import { useRouter } from "next/navigation";
import { FaDollarSign, FaArrowRight } from "react-icons/fa";
import ZeroCreditsNotification from "./ZeroCreditsNotification";

const AICreditsBalance = ({ questionsRemaining }) => {
  const router = useRouter();

  const handleGoToProfile = () => {
    router.push("/profile");
  };

  return (
    <div className="mb-4 w-full">
      {questionsRemaining > 0 ? (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 w-full">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">
                AI Questions Balance
              </h2>
              <span className="text-lg md:text-xl font-bold text-blue-600">
                {questionsRemaining} Questions Remaining
              </span>
            </div>
            <button
              onClick={handleGoToProfile}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              <span>Buy more</span>
              <FaArrowRight className="text-xs" />
            </button>
          </div>
        </div>
      ) : (
        <ZeroCreditsNotification />
      )}
    </div>
  );
};

export default AICreditsBalance;
