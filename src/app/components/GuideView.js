import { useState, useRef } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaFileImage,
  FaPlay,
  FaPaperclip,
  FaLink,
  FaRegStickyNote,
  FaExternalLinkAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import CustomEditor from "@/app/components/common/CustomEditor";
import GuideNotes from "@/app/components/GuideNotes";

const GuideView = ({
  collection,
  guideSteps,
  currentGuideStep,
  setCurrentGuideStep,
  toggleGuideView,
  getExternalLinkAttachments,
  isVideoUrl,
  setCurrentGuideImages,
  setShowImageBrowser,
  setCurrentGuideVideoUrl,
  setShowGuideTimestamps,
  showNotesSection,
  setShowNotesSection,
  showAttachmentsSection,
  setShowAttachmentsSection,
  setCurrentGuideFiles,
  setShowFilesBrowser,
  sharedToken,
}) => {
  // Add ref for the notes section
  const notesRef = useRef(null);
  // Add state for mobile sidebar visibility
  const [showStepsSidebar, setShowStepsSidebar] = useState(false);

  // Function to filter files (non-image attachments)
  const getNonImageAttachments = (step) => {
    if (!step || !step.attachments) return [];

    return step.attachments.filter((attachment) => {
      const type = (attachment.type || "").toLowerCase();
      return !type.includes("image");
    });
  };

  const navigateGuide = (direction) => {
    if (direction === "next" && currentGuideStep < guideSteps.length - 1) {
      setCurrentGuideStep((prev) => prev + 1);
    } else if (direction === "prev" && currentGuideStep > 0) {
      setCurrentGuideStep((prev) => prev - 1);
    } else if (
      typeof direction === "number" &&
      direction >= 0 &&
      direction < guideSteps.length
    ) {
      setCurrentGuideStep(direction);
      // Close the sidebar on mobile after selecting a step
      if (showStepsSidebar) {
        setShowStepsSidebar(false);
      }
    }
  };

  // Function to scroll to notes section
  const scrollToNotes = () => {
    setShowNotesSection(true); // Make sure notes are visible
    setTimeout(() => {
      notesRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  // Helper to get link URL based on whether we're in shared mode
  const getLinkUrl = (step) => {
    if (sharedToken) {
      // Get email from localStorage for shared links
      const storedEmail = localStorage.getItem("shared-links-email");
      const emailParam = storedEmail
        ? `&email=${encodeURIComponent(storedEmail)}`
        : "";
      return `/shared/${step.id}?token=${sharedToken}${emailParam}`;
    }
    return `/external-links/${step.id}`;
  };

  return (
    <div className="rounded-lg border border-slate-300 shadow-lg overflow-hidden">
      {/* Guide View Header */}
      <div className="border border-blue-300 text-gray-800 p-4 sm:p-6 flex flex-wrap justify-between items-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold">
          {collection.name} - Guide View
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStepsSidebar(!showStepsSidebar)}
            className="md:hidden px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200 flex items-center gap-1.5"
            aria-label={showStepsSidebar ? "Hide Steps" : "Show Steps"}
          >
            {showStepsSidebar ? <FaTimes /> : <FaBars />}
            <span className="text-sm">Steps</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => navigateGuide("prev")}
              disabled={currentGuideStep === 0}
              className={`p-2 rounded-full ${
                currentGuideStep === 0
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-700"
              }`}
            >
              <FaArrowLeft />
            </button>
            <button
              onClick={() => navigateGuide("next")}
              disabled={currentGuideStep === guideSteps.length - 1}
              className={`p-2 rounded-full ${
                currentGuideStep === guideSteps.length - 1
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-700"
              }`}
            >
              <FaArrowRight />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Step Indicator */}
      <div className="md:hidden overflow-x-auto scrollbar-hide py-2 px-4 bg-gray-50 border-b border-gray-200">
        <div className="flex min-w-max">
          {guideSteps.map((step, index) => (
            <button
              key={`indicator-${step.id || index}`}
              onClick={() => navigateGuide(index)}
              className={`flex-shrink-0 w-8 h-8 mx-1 rounded-full flex items-center justify-center ${
                index === currentGuideStep
                  ? "bg-blue-500 text-white"
                  : index < currentGuideStep
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              {index < currentGuideStep ? <FaCheck size={12} /> : index + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Guide Content */}
      <div className="flex flex-col md:flex-row h-[calc(100vh-280px)] md:h-[calc(100vh-240px)] relative">
        {/* Steps Sidebar - Hidden on mobile by default, toggleable */}
        <div
          className={`${
            showStepsSidebar ? "block" : "hidden"
          } md:block w-full md:w-1/4 bg-gray-50 border-r border-gray-200 overflow-y-auto 
          md:static absolute z-10 top-0 left-0 right-0 h-full max-h-[70vh] md:max-h-none 
          shadow-lg md:shadow-none`}
        >
          {guideSteps.map((step, index) => (
            <div
              key={step.id || index}
              onClick={() => navigateGuide(index)}
              className={`p-3 sm:p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                index === currentGuideStep
                  ? "bg-blue-50 guide-step-active border-l-4 border-l-blue-500"
                  : "hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                    index < currentGuideStep
                      ? "bg-green-100 text-green-700"
                      : index === currentGuideStep
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  {index < currentGuideStep ? <FaCheck /> : index + 1}
                </div>
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-medium text-gray-800 truncate">
                    {step.name || "Step " + (index + 1)}
                  </h3>
                  {step.date && (
                    <p className="text-xs text-gray-500">
                      {new Date(step.date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Current Step Content - Larger on mobile when sidebar is hidden */}
        {guideSteps.length > 0 && (
          <div className="flex-1 overflow-y-auto bg-white p-4 sm:p-6">
            <div className="mx-auto">
              {/* Step Header - Larger and more prominent */}
              <div className="mb-4 sm:mb-6">
                {guideSteps[currentGuideStep].url ? (
                  <a
                    href={getLinkUrl(guideSteps[currentGuideStep])}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-block"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(
                        getLinkUrl(guideSteps[currentGuideStep]),
                        "_blank"
                      );
                    }}
                  >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800 group-hover:text-blue-600 transition-colors flex items-center gap-2">
                      {guideSteps[currentGuideStep].name ||
                        "Step " + (currentGuideStep + 1)}
                    </h2>
                  </a>
                ) : (
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
                    {guideSteps[currentGuideStep].name ||
                      "Step " + (currentGuideStep + 1)}
                  </h2>
                )}
                {guideSteps[currentGuideStep].date && (
                  <div className="text-sm text-gray-500 mb-2">
                    Date:{" "}
                    {new Date(
                      guideSteps[currentGuideStep].date
                    ).toLocaleDateString()}
                  </div>
                )}
                {guideSteps[currentGuideStep].status && (
                  <div className="inline-block px-2 py-1 text-xs capitalize rounded-full bg-blue-100 text-blue-700">
                    {guideSteps[currentGuideStep].status}
                  </div>
                )}
              </div>

              {/* Media Quick Access Buttons - Larger for better touch targets */}
              <div className="flex flex-wrap gap-2 mb-4">
                {getExternalLinkAttachments(guideSteps[currentGuideStep])
                  .length > 0 && (
                  <button
                    onClick={() => {
                      // Immediately prepare images and show the browser
                      const images = getExternalLinkAttachments(
                        guideSteps[currentGuideStep]
                      );
                      setCurrentGuideImages(images);
                      setShowImageBrowser(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-full border border-indigo-200 transition-colors text-sm"
                    title="View all images in a popup gallery"
                  >
                    <FaFileImage className="text-indigo-500" />
                    <span>
                      {
                        getExternalLinkAttachments(guideSteps[currentGuideStep])
                          .length
                      }{" "}
                      Images
                    </span>
                  </button>
                )}

                {isVideoUrl(guideSteps[currentGuideStep].url) && (
                  <button
                    onClick={() => {
                      setCurrentGuideVideoUrl(guideSteps[currentGuideStep].url);
                      setShowGuideTimestamps(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-full border border-red-200 transition-colors text-sm"
                  >
                    <FaPlay className="text-red-500" />
                    <span>Video</span>
                  </button>
                )}

                {guideSteps[currentGuideStep].attachments &&
                  guideSteps[currentGuideStep].attachments.length > 0 && (
                    <button
                      onClick={() => {
                        // Prepare non-image files and show the files browser
                        const files = getNonImageAttachments(
                          guideSteps[currentGuideStep]
                        );
                        setCurrentGuideFiles(files);
                        setShowFilesBrowser(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full border border-gray-200 transition-colors text-sm"
                      title="View all files in a popup browser"
                    >
                      <FaPaperclip className="text-gray-500" />
                      <span>
                        {
                          getNonImageAttachments(guideSteps[currentGuideStep])
                            .length
                        }{" "}
                        Files
                      </span>
                    </button>
                  )}

                {guideSteps[currentGuideStep].url &&
                  !isVideoUrl(guideSteps[currentGuideStep].url) && (
                    <a
                      href={guideSteps[currentGuideStep].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full border border-blue-200 transition-colors text-sm"
                    >
                      <FaLink className="text-blue-500" />
                      <span>Resource Link</span>
                    </a>
                  )}

                {guideSteps[currentGuideStep].notations &&
                  guideSteps[currentGuideStep].notations.length > 0 && (
                    <button
                      onClick={scrollToNotes}
                      className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200 transition-colors text-sm"
                    >
                      <FaRegStickyNote className="text-yellow-500" />
                      <span>
                        {guideSteps[currentGuideStep].notations.length} Notes
                      </span>
                    </button>
                  )}
              </div>

              {/* Step Content - Collapsible sections on mobile */}
              <div className="space-y-4 sm:space-y-6">
                {/* Description - Collapsible on mobile */}
                {guideSteps[currentGuideStep].description && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <details className="group" open>
                      <summary className="font-medium text-gray-800 cursor-pointer flex items-center justify-between md:cursor-default">
                        <span>Description</span>
                        <svg
                          className="w-4 h-4 transition-transform group-open:rotate-180 md:hidden"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </summary>
                      <div className="mt-3 prose max-w-none text-gray-600 guide-content-wrapper">
                        <CustomEditor
                          content={guideSteps[currentGuideStep].description}
                          readOnly={true}
                          transparent={true}
                          textColor="text-slate-700"
                          scrollable={false}
                          compact={true}
                        />
                      </div>
                    </details>
                  </div>
                )}

                {/* Notes - Expandable */}
                {showNotesSection && guideSteps[currentGuideStep].notes && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <details className="group">
                      <summary className="font-medium text-gray-800 cursor-pointer flex items-center justify-between">
                        <span className="mr-2">Notes</span>
                        <svg
                          className="w-4 h-4 transition-transform group-open:rotate-180"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </summary>
                      <div className="mt-3 prose max-w-none text-gray-600 guide-content-wrapper">
                        <CustomEditor
                          content={guideSteps[currentGuideStep].notes}
                          readOnly={true}
                          transparent={true}
                          textColor="text-slate-700"
                          scrollable={false}
                          compact={true}
                        />
                      </div>
                    </details>
                  </div>
                )}

                {/* Notes section */}
                {showNotesSection && guideSteps[currentGuideStep].notations && (
                  <div ref={notesRef}>
                    <GuideNotes
                      notations={guideSteps[currentGuideStep].notations}
                    />
                  </div>
                )}
              </div>

              {/* Navigation Buttons - Full width on mobile */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:justify-between mt-6 sm:mt-8">
                <button
                  onClick={() => navigateGuide("prev")}
                  disabled={currentGuideStep === 0}
                  className={`px-4 py-3 sm:py-2 flex items-center justify-center sm:justify-start gap-2 rounded-lg w-full sm:w-auto ${
                    currentGuideStep === 0
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  }`}
                >
                  <FaArrowLeft /> Previous Step
                </button>
                <button
                  onClick={() => navigateGuide("next")}
                  disabled={currentGuideStep === guideSteps.length - 1}
                  className={`px-4 py-3 sm:py-2 flex items-center justify-center sm:justify-start gap-2 rounded-lg w-full sm:w-auto ${
                    currentGuideStep === guideSteps.length - 1
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Next Step <FaArrowRight />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuideView;
