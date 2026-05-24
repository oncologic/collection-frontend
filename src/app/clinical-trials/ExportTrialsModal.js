"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  FaCheck,
  FaDownload,
  FaFilePdf,
  FaCopy,
  FaTimes,
  FaRobot,
  FaChevronDown,
} from "react-icons/fa";
import toast from "react-hot-toast";
import Modal from "../components/Modal";
import DOMPurify from "dompurify";

const ExportTrialsModal = ({ isOpen, onClose, selectedTrials = [] }) => {
  const [copied, setCopied] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [showLLMDropdown, setShowLLMDropdown] = useState(false);
  const llmDropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const generatePromptContentRef = useRef(null);
  const [exportOptions, setExportOptions] = useState({
    includeBasicInfo: true,
    includeStatus: true,
    includePhase: true,
    includeConditions: true,
    includeInterventions: true,
    includeSponsor: true,
    includeSummary: true,
    includeLocation: true,
    includeEligibility: true,
  });

  useEffect(() => {
    if (isOpen && selectedTrials.length > 0) {
      generatePromptContentRef.current?.();
    }
  }, [isOpen, selectedTrials, exportOptions]);

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showLLMDropdown &&
        llmDropdownRef.current &&
        !llmDropdownRef.current.contains(event.target)
      ) {
        setShowLLMDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLLMDropdown]);

  if (!isOpen || selectedTrials.length === 0) return null;

  const handleOpenLLM = (service) => {
    // Copy content to clipboard first
    navigator.clipboard.writeText(promptContent).then(() => {
      setCopied(true);
      toast.success("Content copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });

    // Open the LLM service in a new tab
    const urls = {
      chatgpt: "https://chat.openai.com/",
      grok: "https://x.ai/grok",
      claude: "https://claude.ai/",
      perplexity: "https://www.perplexity.ai/",
      openEvidence: "https://www.openevidence.com/",
    };

    if (urls[service]) {
      window.open(urls[service], "_blank", "noopener,noreferrer");
    }

    setShowLLMDropdown(false);
  };

  const stripHtml = (html) => {
    if (!html) return "";
    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  };

  const generatePromptContent = () => {
    let prompt = `# Clinical Trials Export\n\n`;
    prompt += `**Export Date:** ${new Date().toLocaleDateString()}\n`;
    prompt += `**Number of Trials:** ${selectedTrials.length}\n\n`;

    prompt += `I need help analyzing the following clinical trials. Can you provide an explaination of each to me in simple and easy to understand language? Can you also provide a few follow up questions that I can ask my care team or my doctor to get more information if I want to learn more about about if any of these trials are relevant to me?\n\n`;

    selectedTrials.forEach((trial, index) => {
      prompt += `## ${index + 1}. ${
        trial.BriefTitle?.[0] || trial.BriefTitle || "Clinical Trial"
      }\n\n`;

      if (exportOptions.includeBasicInfo) {
        if (trial.NCTId?.[0] || trial.NCTId) {
          prompt += `**NCT ID:** ${trial.NCTId?.[0] || trial.NCTId}\n`;
        }
        if (trial.StudyType?.[0] || trial.StudyType) {
          prompt += `**Study Type:** ${
            trial.StudyType?.[0] || trial.StudyType
          }\n`;
        }
        prompt += `\n`;
      }

      if (
        exportOptions.includeStatus &&
        (trial.OverallStatus?.[0] || trial.OverallStatus)
      ) {
        prompt += `**Status:** ${
          trial.OverallStatus?.[0] || trial.OverallStatus
        }\n`;
      }

      if (exportOptions.includePhase && (trial.Phase?.[0] || trial.Phase)) {
        prompt += `**Phase:** ${
          trial.Phase?.[0] || trial.Phase || "Not specified"
        }\n`;
      }

      if (exportOptions.includeConditions) {
        const conditions = Array.isArray(trial.Condition)
          ? trial.Condition.join(", ")
          : trial.Condition || "Not specified";
        prompt += `**Conditions:** ${conditions}\n`;
      }

      if (exportOptions.includeInterventions) {
        const interventions = Array.isArray(trial.InterventionName)
          ? trial.InterventionName.join(", ")
          : trial.InterventionName || "Not specified";
        prompt += `**Interventions:** ${interventions}\n`;
      }

      if (
        exportOptions.includeSponsor &&
        (trial.LeadSponsorName?.[0] || trial.LeadSponsorName)
      ) {
        prompt += `**Sponsor:** ${
          trial.LeadSponsorName?.[0] || trial.LeadSponsorName
        }\n`;
      }

      if (exportOptions.includeLocation) {
        const locations = [];
        if (trial.LocationFacility) {
          const facilities = Array.isArray(trial.LocationFacility)
            ? trial.LocationFacility
            : [trial.LocationFacility];
          facilities.forEach((facility, idx) => {
            const city = Array.isArray(trial.LocationCity)
              ? trial.LocationCity[idx]
              : trial.LocationCity;
            const state = Array.isArray(trial.LocationState)
              ? trial.LocationState[idx]
              : trial.LocationState;
            const country = Array.isArray(trial.LocationCountry)
              ? trial.LocationCountry[idx]
              : trial.LocationCountry;
            if (facility || city || state || country) {
              locations.push(
                [facility, city, state, country].filter(Boolean).join(", ")
              );
            }
          });
        }
        if (locations.length > 0) {
          prompt += `**Locations:** ${locations.join("; ")}\n`;
        }
      }

      if (
        exportOptions.includeEligibility &&
        (trial.EligibilityCriteria?.[0] || trial.EligibilityCriteria)
      ) {
        const criteria = stripHtml(
          trial.EligibilityCriteria?.[0] || trial.EligibilityCriteria || ""
        );
        if (criteria) {
          prompt += `**Eligibility Criteria:**\n${criteria}\n`;
        }
      }

      if (
        exportOptions.includeSummary &&
        (trial.BriefSummary?.[0] || trial.BriefSummary)
      ) {
        const summary = stripHtml(
          trial.BriefSummary?.[0] || trial.BriefSummary || ""
        );
        if (summary) {
          prompt += `**Brief Summary:**\n${summary}\n`;
        }
      }

      // Add URL
      const nctId = trial.NCTId?.[0] || trial.NCTId;
      if (nctId) {
        prompt += `**ClinicalTrials.gov URL:** https://clinicaltrials.gov/ct2/show/${nctId}\n`;
      }

      prompt += `\n---\n\n`;
    });

    setPromptContent(prompt);
  };
  generatePromptContentRef.current = generatePromptContent;

  const handleCopy = () => {
    navigator.clipboard
      .writeText(promptContent)
      .then(() => {
        setCopied(true);
        toast.success("Content copied to clipboard");
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => toast.error("Failed to copy content"));
  };

  const handleDownload = (format) => {
    if (format === "txt") {
      const blob = new Blob([promptContent], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clinical-trials-export-${
        new Date().toISOString().split("T")[0]
      }.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("File downloaded successfully");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-4xl">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Export Clinical Trials
          </h2>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Export {selectedTrials.length} selected trial
            {selectedTrials.length !== 1 ? "s" : ""} for use with LLMs or other
            tools.
          </p>

          {/* Export Options */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Include in Export:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(exportOptions).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={() =>
                      setExportOptions((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                    className="rounded text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    {key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())
                      .replace(/Include /, "")}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Note about LLM */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg pt-2 px-3 pb-2 mb-4">
          <p className="text-sm text-blue-800">
            You can copy the content below to create an LLM (ChatGPT etc.)
            prompt.
          </p>
          <p className="text-xs text-blue-700 ">
            * We cannot verify any outputs from LLMs. Always double-check LLM
            responses as they can make mistakes. This is not medical advice.
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
              {promptContent}
            </pre>
          </div>

          <div className="flex justify-center md:justify-between items-center">
            <div className="flex gap-2 flex-wrap justify-center md:justify-start">
              <button
                onClick={handleCopy}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <FaCopy className="mr-2" />
                {copied ? "Copied!" : "Copy to Clipboard"}
              </button>
              <button
                onClick={() => handleDownload("txt")}
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                <FaDownload className="mr-2" />
                Download TXT
              </button>
              <div className="relative" ref={llmDropdownRef}>
                <button
                  ref={buttonRef}
                  onClick={() => setShowLLMDropdown(!showLLMDropdown)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <FaRobot className="mr-2" />
                  Open in LLM
                  <FaChevronDown className="ml-2 h-3 w-3" />
                </button>

                {showLLMDropdown && (
                  <div className="absolute left-0 bottom-full mb-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[100] origin-bottom-left">
                    <button
                      onClick={() => handleOpenLLM("chatgpt")}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 font-medium"
                    >
                      ChatGPT
                    </button>
                    <button
                      onClick={() => handleOpenLLM("grok")}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 font-medium"
                    >
                      Grok
                    </button>
                    <button
                      onClick={() => handleOpenLLM("claude")}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 font-medium"
                    >
                      Claude
                    </button>
                    <button
                      onClick={() => handleOpenLLM("perplexity")}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 font-medium"
                    >
                      Perplexity
                    </button>
                    <button
                      onClick={() => handleOpenLLM("openEvidence")}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700 font-medium"
                    >
                      Open Evidence
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExportTrialsModal;
