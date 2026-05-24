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

const ExportPubMedModal = ({ isOpen, onClose, selectedPublications = [] }) => {
  const [copied, setCopied] = useState(false);
  const [promptContent, setPromptContent] = useState("");
  const [showLLMDropdown, setShowLLMDropdown] = useState(false);
  const llmDropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const generatePromptContentRef = useRef(null);
  const [exportOptions, setExportOptions] = useState({
    includeBasicInfo: true,
    includeAuthors: true,
    includeJournal: true,
    includePublicationDate: true,
    includeAbstract: true,
    includeKeywords: true,
    includeDOI: true,
    includePMID: true,
  });

  useEffect(() => {
    if (isOpen && selectedPublications.length > 0) {
      generatePromptContentRef.current?.();
    }
  }, [isOpen, selectedPublications, exportOptions]);

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

  if (!isOpen || selectedPublications.length === 0) return null;

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
    let prompt = `# PubMed Publications Export\n\n`;
    prompt += `**Export Date:** ${new Date().toLocaleDateString()}\n`;
    prompt += `**Number of Publications:** ${selectedPublications.length}\n\n`;

    prompt += `I need help analyzing the following research publications. Please review the details and provide insights.\n\n`;

    selectedPublications.forEach((pub, index) => {
      prompt += `## ${index + 1}. ${pub.title || "Untitled Publication"}\n\n`;

      if (exportOptions.includeBasicInfo) {
        if (exportOptions.includePMID && pub.pmid) {
          prompt += `**PMID:** ${pub.pmid}\n`;
        }
        if (exportOptions.includeDOI && pub.doi) {
          prompt += `**DOI:** ${pub.doi}\n`;
        }
        prompt += `\n`;
      }

      if (exportOptions.includeAuthors && pub.authors) {
        prompt += `**Authors:** ${pub.authors}\n`;
      }

      if (exportOptions.includeJournal && pub.journal) {
        prompt += `**Journal:** ${pub.journal}\n`;
      }

      if (exportOptions.includePublicationDate && pub.publicationDate) {
        prompt += `**Publication Date:** ${pub.publicationDate}\n`;
      }

      if (
        exportOptions.includeKeywords &&
        pub.keywords &&
        pub.keywords.length > 0
      ) {
        const keywords = Array.isArray(pub.keywords)
          ? pub.keywords.join(", ")
          : pub.keywords;
        prompt += `**Keywords:** ${keywords}\n`;
      }

      if (exportOptions.includeAbstract && pub.abstract) {
        const abstract = stripHtml(pub.abstract);
        if (abstract && abstract !== "No abstract available") {
          prompt += `**Abstract:**\n${abstract}\n`;
        }
      }

      // Add URL
      if (pub.url) {
        prompt += `**PubMed URL:** ${pub.url}\n`;
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
      a.download = `pubmed-export-${
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
            Export PubMed Publications
          </h2>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 mb-4">
            Export {selectedPublications.length} selected publication
            {selectedPublications.length !== 1 ? "s" : ""} for use with LLMs or
            other tools.
          </p>

          {/* Export Options */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Include in Export:
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
          <p className="text-xs text-blue-700">
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

export default ExportPubMedModal;
