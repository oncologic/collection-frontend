"use client";

import { useRouter } from "next/navigation";
import { FaDollarSign, FaArrowRight } from "react-icons/fa";

const ZeroCreditsNotification = () => {
  const router = useRouter();

  const handleGoToProfile = () => {
    router.push("/profile");
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 mb-4">
      <div className="flex flex-col md:flex-row items-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-center md:w-16">
          <FaDollarSign className="text-2xl text-white" />
        </div>

        <div className="p-4 flex-grow">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            0 Questions Remaining
          </h3>
          <p className="text-gray-600 mb-4">
            Purchase more credits to continue using AI chat and unlock
            additional features.
          </p>

          <button
            onClick={handleGoToProfile}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <span>Purchase Credits</span>
            <FaArrowRight className="ml-2 text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ZeroCreditsNotification;
