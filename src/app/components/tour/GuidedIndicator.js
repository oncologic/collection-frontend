"use client";

import { useState, useEffect } from "react";

const GuidedIndicator = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [hasSeenGuide, setHasSeenGuide] = useState(false);
  const [showFlyingDot, setShowFlyingDot] = useState(false);

  useEffect(() => {
    const guideSeen = localStorage.getItem("hasSeenChatGuide");
    if (guideSeen) {
      setHasSeenGuide(true);
    }
  }, []);

  useEffect(() => {
    if (hasSeenGuide) return;

    // Start with flying dot animation
    const flyingDotTimer = setTimeout(() => {
      setShowFlyingDot(true);

      // Show first step after dot animation
      const firstStepTimer = setTimeout(() => {
        setShowFlyingDot(false);
        setStep(1);
      }, 1000);

      return () => clearTimeout(firstStepTimer);
    }, 500);

    return () => clearTimeout(flyingDotTimer);
  }, [hasSeenGuide]);

  // Handle next button click
  const handleNext = () => {
    // Start flying dot animation to resources
    setShowFlyingDot(true);
    setStep(2);

    // After flying animation, show resource tooltip
    setTimeout(() => {
      setShowFlyingDot(false);
      setStep(3);
    }, 1000);
  };

  // Handle completion
  const handleComplete = () => {
    localStorage.setItem("hasSeenChatGuide", "true");
    setHasSeenGuide(true);
    onComplete?.();
  };

  if (hasSeenGuide) return null;

  return (
    <>
      {/* Flying Dot Animation */}
      {showFlyingDot && (
        <div
          className={`fixed w-4 h-4 bg-blue-500 rounded-full shadow-lg z-[60]
            ${
              step === 0
                ? "top-1/2 left-1/2 animate-fly-to-profile"
                : step === 2
                ? "bottom-82 right-32 animate-fly-to-chat-resources"
                : ""
            }
          `}
        />
      )}

      {/* Update Profile Indicator */}
      {step === 1 && (
        <div className="fixed top-40 right-8 flex items-center gap-2 animate-fade-in z-[60]">
          <div className="relative text-sm font-medium text-gray-700 bg-white px-4 py-3 rounded-xl shadow-xl max-w-[300px]">
            <div className="absolute -left-2 top-4 w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
            <div className="absolute -left-2 top-4 w-4 h-4 bg-blue-500/50 rounded-full animate-ping" />
            <div className="space-y-3">
              <p>Click to update your profile and load relevant resources</p>
              <button
                onClick={handleNext}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center gap-2 group"
              >
                Next
                <svg
                  className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            <div className="absolute inset-0 border-2 border-blue-200 rounded-xl animate-pulse pointer-events-none" />
          </div>
        </div>
      )}

      {/* Resource Selection Indicator */}
      {step === 3 && (
        <div className="fixed bottom-96 left-1/2 transform -translate-x-1/2 flex items-center gap-2 animate-fade-in z-[60]">
          <div className="relative text-sm font-medium text-gray-700 bg-white px-4 py-3 rounded-xl shadow-xl max-w-[300px]">
            <div className="absolute -left-2 top-4 w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
            <div className="absolute -left-2 top-4 w-4 h-4 bg-blue-500/50 rounded-full animate-ping" />
            <div className="space-y-3">
              <p>
                Select resources using these icons. The AI will use your
                selected resources to provide relevant answers.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={handleComplete}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors duration-200 flex items-center gap-1.5 group"
                >
                  Got it
                  <svg
                    className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="absolute inset-0 border-2 border-blue-200 rounded-xl animate-pulse pointer-events-none" />
          </div>
        </div>
      )}
    </>
  );
};

export default GuidedIndicator;
