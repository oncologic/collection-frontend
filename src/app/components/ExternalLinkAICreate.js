import React, { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import {
  FaArrowRight,
  FaCalendarAlt,
  FaCheck,
  FaCopy,
  FaExternalLinkAlt,
  FaFileAlt,
  FaGlobe,
  FaImage,
  FaKeyboard,
  FaLink,
  FaMagic,
  FaMicrophone,
  FaMicrophoneSlash,
  FaRobot,
  FaSpinner,
  FaTags,
  FaTimes,
  FaTrash,
  FaUpload,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import {
  useConfirmExternalLinks,
  usePreviewExternalLinks,
  useProcessImage,
} from "../hooks/useAI";
import { useQueryClient } from "@tanstack/react-query";
import InputField from "./inputs/InputField";
import MultiSelect from "./inputs/MultiSelect";
import CustomEditor from "./common/CustomEditor";
import { sanitizeHtml } from "../utils/sanitizeHtml";
import {
  formatDateRangeShort,
  normalizeDateInputValue,
} from "../utils/general";

const MAX_CHARS = 4000;
const SPEECH_LANGUAGE = "en-US";
const IMPORT_ACCEPT = ".json,.csv,.tsv,application/json,text/csv,text/tab-separated-values";

const buildMergedPrompt = (
  currentValue,
  incomingValue,
  separator = "\n\n"
) => {
  const current = String(currentValue || "").trim();
  const incoming = String(incomingValue || "").trim();

  if (!incoming) {
    return current;
  }

  return [current, incoming].filter(Boolean).join(separator);
};

const stripRichText = (value = "") =>
  sanitizeHtml(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const getHostname = (value = "") => {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const normalizeUrlValue = (value = "") =>
  String(value || "").replace(/\s+/g, "").trim();

const isPlaceholderUrl = (value = "") =>
  getHostname(normalizeUrlValue(value)) === "example.com";

const hasFilledValue = (value) => {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (value && typeof value === "object") {
    return Object.keys(value).length > 0;
  }

  return Boolean(String(value || "").trim());
};

const firstFilledValue = (...values) =>
  values.find((value) => hasFilledValue(value)) || "";

const mergeDraftDescription = (description = "", notes = "") => {
  const normalizedParts = [description, notes]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return [...new Set(normalizedParts)].join("\n\n");
};

const parseTagNames = (value) => {
  if (Array.isArray(value)) {
    return value.flatMap((item) => parseTagNames(item));
  }

  if (value && typeof value === "object") {
    if (value.name) {
      return [String(value.name)];
    }
    return [];
  }

  const rawValue = String(value || "").trim();
  if (!rawValue) {
    return [];
  }

  if (rawValue.startsWith("[")) {
    try {
      const parsed = JSON.parse(rawValue);
      return parseTagNames(parsed);
    } catch {
      // fall through to delimiter parsing
    }
  }

  return rawValue
    .split(/[,;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const resolvePreviewTags = (inputTags = [], availableTags = []) => {
  const availableTagMap = new Map(
    availableTags.map((tag) => [String(tag.name || "").toLowerCase(), tag])
  );
  const matchedByKey = new Map();
  const unmatchedTags = [];

  parseTagNames(inputTags).forEach((tagName) => {
    const normalizedName = String(tagName || "").trim();
    if (!normalizedName) {
      return;
    }

    const matchedTag = availableTagMap.get(normalizedName.toLowerCase());
    if (matchedTag) {
      matchedByKey.set(matchedTag.id || matchedTag.name, matchedTag);
    } else if (!unmatchedTags.includes(normalizedName)) {
      unmatchedTags.push(normalizedName);
    }
  });

  return {
    matchedTags: Array.from(matchedByKey.values()),
    unmatchedTags,
  };
};

const extractImportRecords = (parsedValue) => {
  if (Array.isArray(parsedValue)) {
    return parsedValue;
  }

  if (!parsedValue || typeof parsedValue !== "object") {
    return [];
  }

  return (
    parsedValue.links ||
    parsedValue.data ||
    parsedValue.items ||
    parsedValue.records ||
    []
  );
};

const stripCodeFence = (value = "") =>
  String(value || "")
    .trim()
    .replace(/^```(?:json|csv|tsv)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

const escapeControlCharactersInJsonStrings = (value = "") =>
  String(value || "").replace(/("(?:\\.|[^"\\])*")/g, (match) =>
    match.replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/\t/g, "\\t")
  );

const normalizePreviewLink = (link = {}, availableTags = []) => {
  const startDate = normalizeDateInputValue(
    link.startDate || link.start_date || link.date
  );
  const endDate = normalizeDateInputValue(
    link.endDate ||
      link.end_date ||
      link.startDate ||
      link.start_date ||
      link.date
  );
  const { matchedTags, unmatchedTags } = resolvePreviewTags(
    link.tags || link.originalTags || [],
    availableTags
  );

  return {
    ...link,
    name: String(link.name || "").trim(),
    url: isPlaceholderUrl(link.url) ? "" : normalizeUrlValue(link.url),
    description: mergeDraftDescription(link.description, link.notes),
    notes: "",
    visibility: link.visibility || "private",
    type: link.type || "external",
    date: startDate || normalizeDateInputValue(link.date),
    startDate,
    endDate: endDate || startDate,
    tags: matchedTags,
    originalTags: Array.isArray(link.originalTags)
      ? [...new Set([...link.originalTags, ...unmatchedTags])]
      : unmatchedTags,
  };
};

const isLinkReady = (link = {}) =>
  Boolean(String(link.name || "").trim());

const getPreviewSnippet = (link = {}) => {
  const description = stripRichText(link.description);
  if (description) {
    return description;
  }

  return "Add a description so this draft has useful context.";
};

const ExternalLinkAICreate = ({
  onClose,
  onLinksCreated,
  tags = [],
  isBulkMode = false,
  collectionId = null,
}) => {
  const [inputMode, setInputMode] = useState("agent");
  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [previewLinks, setPreviewLinks] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState(0);

  const [originalPrompt, setOriginalPrompt] = useState("");
  const [previewMessage, setPreviewMessage] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [importText, setImportText] = useState("");
  const [importFileName, setImportFileName] = useState("");

  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const importFileInputRef = useRef(null);

  const { mutateAsync: previewExternalLinksMutation } =
    usePreviewExternalLinks();
  const { mutateAsync: confirmExternalLinksMutation } =
    useConfirmExternalLinks();
  const { mutateAsync: processImageMutation } = useProcessImage();
  const queryClient = useQueryClient();

  const charCount = textInput.length;
  const selectedLink = previewLinks[selectedPreviewIndex] || null;
  const readyCount = useMemo(
    () => previewLinks.filter((link) => isLinkReady(link)).length,
    [previewLinks]
  );
  const importPrompt = useMemo(() => {
    const tagInstruction =
      tags.length > 0
        ? `Use existing tag names when they clearly fit. Available tags include: ${tags
            .slice(0, 24)
            .map((tag) => tag.name)
            .join(", ")}${tags.length > 24 ? ", ..." : ""}.`
        : "Include tags only when they are clearly helpful.";

    return `Convert the source material into external link records for a bulk import.
Return ONLY valid JSON or CSV. Do not include commentary, markdown fences, or explanations.
Required field:
- name
Optional fields:
- url
- description
- startDate (YYYY-MM-DD)
- endDate (YYYY-MM-DD)
- tags (array in JSON, or comma-separated in CSV)
JSON format:
{
  "links": [
    {
      "name": "Example link",
      "url": "https://example.org",
      "description": "Useful context, summary, reminders, or notes about this link.",
      "startDate": "2026-03-20",
      "endDate": "2026-03-22",
      "tags": ["Kidney Cancer", "research"]
    }
  ]
}
CSV format headers:
name,url,description,startDate,endDate,tags
Rules:
- Keep description as the main context field.
- Leave url blank if it is not known.
- Do not invent fake URLs.
- Preserve one row/object per link.
- ${tagInstruction}`;
  }, [tags]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return undefined;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = SPEECH_LANGUAGE;

    recognition.onresult = (event) => {
      let nextFinalText = "";
      let nextInterimText = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0]?.transcript || "";
        if (event.results[index].isFinal) {
          nextFinalText += `${transcript} `;
        } else {
          nextInterimText += transcript;
        }
      }

      setInterimTranscript(nextInterimText.trim());

      if (nextFinalText.trim()) {
        setTextInput((currentValue) => {
          const mergedPrompt = buildMergedPrompt(
            currentValue,
            nextFinalText,
            " "
          );
          if (mergedPrompt.length > MAX_CHARS) {
            toast.error(
              "Prompt is at the maximum length. Edit it before adding more."
            );
          }
          return mergedPrompt.slice(0, MAX_CHARS);
        });
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed") {
        setVoiceError("Microphone permission is blocked in this browser.");
      } else {
        setVoiceError("Voice capture stopped. Try again or continue typing.");
      }
      setIsListening(false);
      setInterimTranscript("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    setSpeechSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!previewLinks.length) {
      setSelectedPreviewIndex(0);
      return;
    }

    if (selectedPreviewIndex > previewLinks.length - 1) {
      setSelectedPreviewIndex(previewLinks.length - 1);
    }
  }, [previewLinks, selectedPreviewIndex]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setInterimTranscript("");
  };

  const startListening = () => {
    if (!speechSupported || !recognitionRef.current) {
      toast.error("Voice dictation is not available in this browser.");
      return;
    }

    try {
      setVoiceError("");
      setInputMode("agent");
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start dictation:", error);
      setVoiceError("Voice capture could not start. Please try again.");
      setIsListening(false);
    }
  };

  const updatePrompt = (value) => {
    setTextInput(String(value || "").slice(0, MAX_CHARS));
  };

  const resetComposer = () => {
    stopListening();
    setTextInput("");
    setImageFile(null);
    setImagePreview(null);
    setPreviewLinks([]);
    setShowPreview(false);
    setSelectedPreviewIndex(0);
    setOriginalPrompt("");
    setPreviewMessage("");
    setVoiceError("");
    setInputMode("agent");
    setImportText("");
    setImportFileName("");
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessImage = async () => {
    if (!imageFile) {
      return;
    }

    setIsProcessingImage(true);

    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result?.split(",")[1] || "");
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const result = await processImageMutation({
        imageData: base64,
        mimeType: imageFile.type || "image/jpeg",
        prompt:
          "Extract any external links, URLs, names, and descriptions from this image. Preserve line breaks where possible.",
      });

      if (!result.extractedText) {
        toast.error("No text could be extracted from the image.");
        return;
      }

      const mergedPrompt = buildMergedPrompt(textInput, result.extractedText);
      if (mergedPrompt.length > MAX_CHARS) {
        toast.error("Extracted text was trimmed to fit the prompt area.");
      }

      setTextInput(mergedPrompt.slice(0, MAX_CHARS));
      setInputMode("agent");
      toast.success("Extracted text added to your agent brief.");
    } catch (error) {
      console.error("Failed to process image:", error);
      toast.error("Failed to process image.");
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleGeneratePreview = async () => {
    const prompt = textInput.trim();

    if (!prompt) {
      toast.error("Add a brief before asking the agent to draft links.");
      return;
    }

    setIsGenerating(true);
    setOriginalPrompt(prompt);

    try {
      const response = await previewExternalLinksMutation({
        prompt,
        metadata: {
          tags,
          isBulkMode,
        },
      });

      const normalizedPreview = Array.isArray(response.preview)
        ? response.preview.map((link) => normalizePreviewLink(link, tags))
        : [];

      if (!normalizedPreview.length) {
        toast.error("No external links could be generated from that request.");
        return;
      }

      setPreviewLinks(normalizedPreview);
      setSelectedPreviewIndex(0);
      setPreviewMessage(response.message || "");
      setShowPreview(true);
      toast.success(
        `Drafted ${normalizedPreview.length} external link${
          normalizedPreview.length === 1 ? "" : "s"
        }.`
      );
    } catch (error) {
      console.error("Failed to generate preview:", error);
      toast.error(error.message || "Failed to generate preview.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateLink = (index, field, value) => {
    setPreviewLinks((currentLinks) =>
      currentLinks.map((link, linkIndex) => {
        if (linkIndex !== index) {
          return link;
        }

        const nextLink = {
          ...link,
          [field]: value,
        };

        if (field === "date" || field === "startDate") {
          const normalizedStartDate = normalizeDateInputValue(value);
          nextLink.date = normalizedStartDate;
          nextLink.startDate = normalizedStartDate;

          if (!link.endDate || link.endDate < normalizedStartDate) {
            nextLink.endDate = normalizedStartDate;
          }
        }

        if (field === "endDate") {
          nextLink.endDate =
            normalizeDateInputValue(value) || link.startDate || link.date || "";
        }

        return nextLink;
      })
    );
  };

  const copyImportPrompt = async () => {
    try {
      await navigator.clipboard.writeText(importPrompt);
      toast.success("Import prompt copied");
    } catch (error) {
      console.error("Failed to copy import prompt:", error);
      toast.error("Failed to copy import prompt");
    }
  };

  const parseImportedLinks = (rawText) => {
    const cleanedText = stripCodeFence(rawText);
    if (!cleanedText) {
      return [];
    }

    if (cleanedText.startsWith("{") || cleanedText.startsWith("[")) {
      try {
        const parsedJson = JSON.parse(cleanedText);
        const records = extractImportRecords(parsedJson);
        if (!Array.isArray(records)) {
          throw new Error("Imported JSON must contain an array of links.");
        }

        return records;
      } catch (parseError) {
        try {
          const repairedJson = JSON.parse(
            escapeControlCharactersInJsonStrings(cleanedText)
          );
          const repairedRecords = extractImportRecords(repairedJson);
          if (!Array.isArray(repairedRecords)) {
            throw new Error("Imported JSON must contain an array of links.");
          }

          return repairedRecords;
        } catch {
          throw new Error(
            parseError?.message?.includes("control character")
              ? "This JSON has a raw line break inside a quoted value. Remove that break or paste it again and the importer will try to repair it."
              : "Could not parse import JSON. Check the structure and try again."
          );
        }
      }
    }

    const delimiter =
      cleanedText.includes("\t") && !cleanedText.includes(",") ? "\t" : undefined;
    const parsedCsv = Papa.parse(cleanedText, {
      header: true,
      skipEmptyLines: true,
      ...(delimiter ? { delimiter } : {}),
    });
    const blockingErrors = (parsedCsv.errors || []).filter(
      (error) => error.code !== "UndetectableDelimiter"
    );

    if (blockingErrors.length > 0) {
      throw new Error("Could not parse import data. Use JSON or CSV with headers.");
    }

    return parsedCsv.data || [];
  };

  const importRecordsToPreview = (records, sourceLabel = "imported data") => {
    const normalizedPreview = records
      .map((record) =>
        normalizePreviewLink(
          {
            name: firstFilledValue(
              record.name,
              record.title,
              record.label,
              record.linkName
            ),
            url: firstFilledValue(
              record.url,
              record.link,
              record.href,
              record.website,
              record.sourceUrl
            ),
            description: firstFilledValue(
              record.description,
              record.summary,
              record.details,
              record.context
            ),
            notes: firstFilledValue(record.notes, record.note, record.memo),
            startDate: firstFilledValue(
              record.startDate,
              record.start_date,
              record.date,
              record.linkDate
            ),
            endDate: firstFilledValue(
              record.endDate,
              record.end_date,
              record.finishDate,
              record.date
            ),
            tags: firstFilledValue(
              record.tags,
              record.tagNames,
              record.categories,
              record.keywords
            ),
            visibility: record.visibility || "private",
            type: record.type || "external",
          },
          tags
        )
      )
      .filter(
        (link) =>
          link.name || link.url || stripRichText(link.description || "").length
      );

    if (!normalizedPreview.length) {
      toast.error("No usable links were found in that import data.");
      return;
    }

    setPreviewLinks(normalizedPreview);
    setSelectedPreviewIndex(0);
    setPreviewMessage(
      `Imported ${normalizedPreview.length} draft link${
        normalizedPreview.length === 1 ? "" : "s"
      } from ${sourceLabel}.`
    );
    setOriginalPrompt("");
    setShowPreview(true);
    toast.success(
      `Imported ${normalizedPreview.length} link${
        normalizedPreview.length === 1 ? "" : "s"
      } into draft preview.`
    );
  };

  const handleImportData = () => {
    try {
      const records = parseImportedLinks(importText);
      importRecordsToPreview(records, importFileName || "pasted data");
    } catch (error) {
      console.error("Failed to import link data:", error);
      toast.error(error.message || "Failed to import data.");
    }
  };

  const handleImportFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      setImportText(text);
      setImportFileName(file.name);
      toast.success("Import file loaded");
    } catch (error) {
      console.error("Failed to read import file:", error);
      toast.error("Failed to read import file.");
    }
  };

  const removeLink = (index) => {
    const nextLinks = previewLinks.filter((_, linkIndex) => linkIndex !== index);
    setPreviewLinks(nextLinks);

    if (!nextLinks.length) {
      setShowPreview(false);
      setSelectedPreviewIndex(0);
      return;
    }

    setSelectedPreviewIndex((currentIndex) =>
      Math.max(
        0,
        Math.min(currentIndex > index ? currentIndex - 1 : currentIndex, nextLinks.length - 1)
      )
    );
  };

  const handleConfirmLinks = async () => {
    if (!previewLinks.length) {
      toast.error("No links are ready to create.");
      return;
    }

    const invalidLinks = previewLinks.filter((link) => !isLinkReady(link));
    if (invalidLinks.length > 0) {
      toast.error("Every draft needs a name before it can be created.");
      return;
    }

    setIsConfirming(true);

    try {
      const response = await confirmExternalLinksMutation({
        externalLinks: previewLinks.map((link) => ({
          ...link,
          collectionId,
          description: mergeDraftDescription(link.description, link.notes),
          notes: "",
          date: link.startDate || link.date || null,
          startDate: link.startDate || link.date || null,
          endDate: link.endDate || link.startDate || link.date || null,
        })),
      });

      if (response.results) {
        const { successful, failed, createdLinks } = response.results;

        if (successful > 0) {
          toast.success(
            `Created ${successful} external link${successful === 1 ? "" : "s"}.`
          );

          queryClient.invalidateQueries({ queryKey: ["collections"] });
          queryClient.invalidateQueries({ queryKey: ["externalLinks"] });

          if (onLinksCreated) {
            onLinksCreated(createdLinks);
          }

          onClose();
        }

        if (failed > 0) {
          toast.error(
            `Failed to create ${failed} external link${failed === 1 ? "" : "s"}.`
          );
        }
      }
    } catch (error) {
      console.error("Failed to create links:", error);
      toast.error(error.message || "Failed to create external links.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-1 pt-3 pb-2 sm:px-2 sm:pt-4 sm:pb-3">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-3 text-[28px] font-semibold tracking-tight text-slate-900 sm:text-[34px]">
            <FaMagic className="text-blue-500" />
            Create External Links
          </h2>
          <p className="mt-2 text-sm text-slate-500 sm:text-[15px]">
            {isBulkMode
              ? "Talk, type, upload an image, or import JSON/CSV."
              : "Talk, type, or upload an image."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-600"
          aria-label="Close"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      </div>

      {!showPreview ? (
        <section className="rounded-[26px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:auto-cols-max sm:grid-flow-col">
                {[
                  {
                    id: "agent",
                    label: "Talk or Type",
                    icon: FaKeyboard,
                  },
                  {
                    id: "image",
                    label: "Image Upload",
                    icon: FaImage,
                  },
                  ...(isBulkMode
                    ? [
                        {
                          id: "import",
                          label: "Prompt & Import",
                          icon: FaFileAlt,
                        },
                      ]
                    : []),
                ].map((option) => {
                  const Icon = option.icon;
                  const active = inputMode === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setInputMode(option.id)}
                      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {inputMode === "agent" && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  disabled={!speechSupported}
                  className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors sm:w-auto ${
                    isListening
                      ? "bg-red-50 text-red-600 ring-1 ring-red-200"
                      : speechSupported
                      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200 hover:bg-blue-100"
                      : "cursor-not-allowed bg-slate-100 text-slate-400"
                  }`}
                >
                  {isListening ? (
                    <FaMicrophoneSlash className="h-3.5 w-3.5" />
                  ) : (
                    <FaMicrophone className="h-3.5 w-3.5" />
                  )}
                  {isListening ? "Stop Listening" : "Speak"}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4 px-4 pt-4 pb-5 sm:px-6 sm:pt-5 sm:pb-6">
            {inputMode === "agent" ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                      isListening
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {isListening
                      ? "Listening"
                      : speechSupported
                      ? "Voice ready"
                      : "Voice unavailable"}
                  </span>
                  {interimTranscript && (
                    <span className="text-xs font-medium text-slate-500">
                      Capturing transcript
                    </span>
                  )}
                </div>

                {interimTranscript && (
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-600">
                    {interimTranscript}
                  </div>
                )}

                {voiceError && (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {voiceError}
                  </div>
                )}

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-slate-700">
                      Request
                    </label>
                    <span
                      className={`text-sm ${
                        charCount > MAX_CHARS * 0.9
                          ? "text-red-500"
                          : "text-slate-400"
                      }`}
                    >
                      {charCount} / {MAX_CHARS}
                    </span>
                  </div>
                  <textarea
                    value={textInput}
                    onChange={(event) => updatePrompt(event.target.value)}
                    placeholder={
                      isBulkMode
                        ? "Create links for the AACR trip, including the conference agenda, hotel booking portal, airline itinerary, and any other URLs in these notes."
                        : "Describe the external link you want created."
                    }
                    className="min-h-[160px] w-full resize-none rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-base leading-7 text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100 sm:min-h-[190px]"
                  />
                  {textInput && (
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => updatePrompt("")}
                        className="text-sm text-slate-400 transition-colors hover:text-slate-600"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : inputMode === "image" ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="w-full space-y-4">
                      <img
                        src={imagePreview}
                        alt="Uploaded preview"
                        className="mx-auto max-h-64 rounded-2xl border border-slate-200 shadow-sm"
                      />
                      <p className="text-sm text-slate-500">
                        Tap to replace
                      </p>
                    </div>
                  ) : (
                    <>
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm">
                        <FaUpload className="h-5 w-5" />
                      </span>
                      <h4 className="mt-4 text-lg font-semibold text-slate-900">
                        Upload image
                      </h4>
                    </>
                  )}
                </button>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleProcessImage}
                    disabled={!imageFile || isProcessingImage}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#4263EB] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3b5bd9] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isProcessingImage ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Extracting...
                      </>
                    ) : (
                      <>
                        <FaMagic />
                        Use image text
                      </>
                    )}
                  </button>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                    >
                      Remove image
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        LLM import prompt
                      </h4>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Copy this prompt into another model, then paste its JSON or
                        CSV response here for bulk import.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={copyImportPrompt}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      <FaCopy className="h-3.5 w-3.5" />
                      Copy prompt
                    </button>
                  </div>

                  <textarea
                    readOnly
                    value={importPrompt}
                    className="mt-4 h-[180px] w-full resize-none rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-[13px] leading-5 text-slate-600 shadow-sm outline-none"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-slate-700">
                      Paste JSON or CSV
                    </label>
                    <span className="text-xs text-slate-400">
                      {importFileName || "No file loaded"}
                    </span>
                  </div>
                  <textarea
                    value={importText}
                    onChange={(event) => setImportText(event.target.value)}
                    placeholder='Paste JSON like {"links":[...]} or CSV with headers name,url,description,startDate,endDate,tags'
                    className="min-h-[200px] w-full resize-none rounded-[22px] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                  <div className="mt-3 flex flex-wrap justify-between gap-3">
                    <div className="flex flex-wrap gap-3">
                      <input
                        ref={importFileInputRef}
                        type="file"
                        accept={IMPORT_ACCEPT}
                        onChange={handleImportFileSelect}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => importFileInputRef.current?.click()}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      >
                        <FaUpload className="h-3.5 w-3.5" />
                        Upload JSON/CSV
                      </button>
                      {importText && (
                        <button
                          type="button"
                          onClick={() => {
                            setImportText("");
                            setImportFileName("");
                            if (importFileInputRef.current) {
                              importFileInputRef.current.value = "";
                            }
                          }}
                          className="text-sm text-slate-400 transition-colors hover:text-slate-600"
                        >
                          Clear import data
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4 pb-1 sm:pb-2">
              <button
                type="button"
                onClick={inputMode === "import" ? handleImportData : handleGeneratePreview}
                disabled={
                  inputMode === "import"
                    ? !importText.trim()
                    : isGenerating || !textInput.trim()
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4263EB] px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3b5bd9] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {inputMode !== "import" && isGenerating ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Drafting links...
                  </>
                ) : (
                  <>
                    {inputMode === "import" ? <FaUpload /> : <FaMagic />}
                    {inputMode === "import"
                      ? "Import draft preview"
                      : "Generate draft preview"}
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      ) : (
        <div className="space-y-6">
          <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <FaCheck className="h-3.5 w-3.5" />
                  Draft ready
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                  Review {previewLinks.length} drafted external link
                  {previewLinks.length === 1 ? "" : "s"}
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                  {previewMessage ||
                    "The agent parsed your brief into structured links. Review each one before creating them."}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {readyCount}/{previewLinks.length} ready
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {previewLinks.filter((link) => link.tags?.length).length} tagged
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  {
                    previewLinks.filter(
                      (link) => link.startDate || link.date || link.endDate
                    ).length
                  }{" "}
                  dated
                </span>
              </div>
            </div>

            {originalPrompt && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Agent brief
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                  {originalPrompt}
                </p>
              </div>
            )}
          </section>

          <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.92fr)_minmax(0,1.08fr)]">
            <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-2 pb-3">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    Drafted links
                  </h4>
                  <p className="text-xs text-slate-500">
                    Select a card to refine its details.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="text-sm font-medium text-blue-600 transition-colors hover:text-blue-700"
                >
                  Back to prompt
                </button>
              </div>

              <div className="mt-4 max-h-[620px] space-y-3 overflow-y-auto pr-1">
                {previewLinks.map((link, index) => {
                  const active = index === selectedPreviewIndex;
                  const domain = getHostname(link.url);
                  const hasUsableUrl = Boolean(link.url);
                  const previewText = getPreviewSnippet(link);

                  return (
                    <div
                      key={`${link.url}-${index}`}
                      className={`rounded-2xl border p-4 transition ${
                        active
                          ? "border-blue-300 bg-blue-50/60 shadow-sm"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedPreviewIndex(index)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                                active
                                  ? "bg-white text-blue-600 shadow-sm"
                                  : "bg-slate-100 text-slate-500"
                              }`}
                            >
                              <FaLink className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {link.name || `Untitled link ${index + 1}`}
                                </p>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                    isLinkReady(link)
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {isLinkReady(link) ? "Ready" : "Needs name"}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-xs text-slate-500">
                                {hasUsableUrl
                                  ? domain || link.url
                                  : "URL optional"}
                              </p>
                              <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                                {previewText}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                {(link.startDate || link.date) && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                                    <FaCalendarAlt className="h-3 w-3" />
                                    {formatDateRangeShort(
                                      link.startDate || link.date,
                                      link.endDate || link.startDate || link.date
                                    )}
                                  </span>
                                )}
                                {link.tags?.slice(0, 2).map((tag, tagIndex) => (
                                  <span
                                    key={`${tag.name || tagIndex}-${index}`}
                                    className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
                                  >
                                    {tag.name || tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => removeLink(index)}
                          className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                          aria-label={`Remove link ${index + 1}`}
                        >
                          <FaTrash className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
              {selectedLink ? (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        Reviewing link {selectedPreviewIndex + 1} of{" "}
                        {previewLinks.length}
                      </p>
                      <h4 className="mt-1 text-xl font-semibold text-slate-900">
                        {selectedLink.name || "Untitled draft"}
                      </h4>
                    </div>

                    <a
                      href={selectedLink.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        selectedLink.url
                          ? "border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100"
                          : "pointer-events-none border border-slate-200 bg-slate-100 text-slate-400"
                      }`}
                    >
                      <FaGlobe className="h-3.5 w-3.5" />
                      Open URL
                    </a>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField
                      id={`name-${selectedPreviewIndex}`}
                      label="Name"
                      value={selectedLink.name}
                      onChange={(event) =>
                        updateLink(selectedPreviewIndex, "name", event.target.value)
                      }
                      placeholder="Enter link name"
                    />
                    <InputField
                      id={`url-${selectedPreviewIndex}`}
                      label="URL"
                      value={selectedLink.url}
                      onChange={(event) =>
                        updateLink(selectedPreviewIndex, "url", event.target.value)
                      }
                      placeholder="Optional URL"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField
                      id={`startDate-${selectedPreviewIndex}`}
                      type="date"
                      label="Start Date"
                      value={selectedLink.startDate || selectedLink.date || ""}
                      onChange={(event) =>
                        updateLink(
                          selectedPreviewIndex,
                          "startDate",
                          event.target.value
                        )
                      }
                    />
                    <InputField
                      id={`endDate-${selectedPreviewIndex}`}
                      type="date"
                      label="End Date"
                      min={selectedLink.startDate || selectedLink.date || undefined}
                      value={
                        selectedLink.endDate ||
                        selectedLink.startDate ||
                        selectedLink.date ||
                        ""
                      }
                      onChange={(event) =>
                        updateLink(
                          selectedPreviewIndex,
                          "endDate",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Description
                    </label>
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <CustomEditor
                        key={`draft-description-${selectedPreviewIndex}`}
                        content={selectedLink.description || ""}
                        onChange={(value) =>
                          updateLink(selectedPreviewIndex, "description", value)
                        }
                        readOnly={false}
                        showBorder={false}
                        height="180px"
                        maxHeight="240px"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                      <FaTags className="h-3.5 w-3.5 text-slate-400" />
                      Tags
                    </div>
                    <MultiSelect
                      value={selectedLink.tags || []}
                      onChange={(selectedTags) =>
                        updateLink(selectedPreviewIndex, "tags", selectedTags)
                      }
                      options={tags}
                      placeholder="Add tags..."
                      containerClassName="bg-white"
                    />
                    {selectedLink.originalTags?.length > 0 && (
                      <p className="mt-2 text-xs text-slate-400">
                        Agent also suggested: {selectedLink.originalTags.join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-400">
                  Select a drafted link to review it.
                </div>
              )}
            </section>
          </div>

          <section className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">
                {readyCount === previewLinks.length
                  ? "Everything looks ready."
                  : `${previewLinks.length - readyCount} draft${
                      previewLinks.length - readyCount === 1 ? "" : "s"
                    } still need a name.`}
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={resetComposer}
                  className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Start over
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLinks}
                  disabled={isConfirming || !previewLinks.length}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#4263EB] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3b5bd9] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isConfirming ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Creating links...
                    </>
                  ) : (
                    <>
                      Create {previewLinks.length} link
                      {previewLinks.length === 1 ? "" : "s"}
                      <FaArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default ExternalLinkAICreate;
