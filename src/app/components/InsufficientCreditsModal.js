"use client";

import { useRouter } from "next/navigation";
import {
  FaDollarSign,
  FaArrowRight,
  FaExclamationCircle,
} from "react-icons/fa";

const InsufficientCreditsModal = ({ isOpen, onClose }) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoToAccount = () => {
    router.push("/profile");
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden transform transition-all">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <FaExclamationCircle className="text-2xl flex-shrink-0" />
            <h2 className="text-xl font-bold">Insufficient Credits</h2>
          </div>
        </div>

        {/* Body content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6">
            You&apos;ve run out of credits to continue using AI chat. Purchase
            more credits to unlock additional conversations and insights.
          </p>

          {/* Credits illustration */}
          <div className="flex justify-center mb-6">
            <div className="bg-blue-50 p-4 rounded-full">
              <FaDollarSign className="text-4xl text-blue-500" />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleGoToAccount}
              className="w-full px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg flex items-center justify-center gap-2 hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <span>Go to Account</span>
              <FaArrowRight className="text-sm" />
            </button>

            <button
              onClick={onClose}
              className="w-full px-5 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsufficientCreditsModal;
