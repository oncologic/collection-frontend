import React, { useState, useRef, useEffect } from "react";
import {
  FaMicrophone,
  FaMicrophoneSlash,
  FaPlay,
  FaPause,
  FaStop,
  FaTrash,
  FaMagic,
  FaSpinner,
  FaEdit,
  FaTimes,
  FaCheck,
  FaPlus,
  FaPaperclip,
  FaChevronDown,
  FaChevronUp,
  FaImage,
  FaUpload,
} from "react-icons/fa";
import {
  usePreviewNotations,
  useConfirmNotations,
  useProcessImage,
} from "../hooks/useAI";
import { toast } from "react-hot-toast";
import SelectField from "./inputs/SelectField";
import InputField from "./inputs/InputField";
import CustomTimePicker from "./forms/CustomTimePicker";
import CustomEditor from "./common/CustomEditor";
import { formatLongDate, formatDayOfWeek } from "@/app/utils/general";
import { useCreateNotations } from "../hooks/useCollections";
import AddAttachmentForm from "@/app/components/forms/AddAttachmentForm";
import { useCreateAttachment } from "@/app/hooks/useAttachments";
import AttachmentAICreate from "./AttachmentAICreate";
import TagInput from "./inputs/TagInput";

const categories = [
  { id: "Idea", name: "Idea" },
  { id: "Action", name: "Action" },
  { id: "Thought", name: "Thought" },
  { id: "Question", name: "Question" },
  { id: "Observation", name: "Observation" },
];

const statuses = [
  { id: "Pending", name: "Pending" },
  { id: "In Progress", name: "In Progress" },
  { id: "Waiting", name: "Waiting" },
  { id: "Completed", name: "Completed" },
  { id: "Cancelled", name: "Cancelled" },
  { id: "Archived", name: "Archived" },
];

const highlightedOptions = [
  { id: "true", name: "Yes" },
  { id: "false", name: "No" },
];

const visibilityOptions = [
  { id: "private", name: "Only Me" },
  { id: "unlisted", name: "Collaborators" },
  { id: "public", name: "Public" },
];

const AIVoiceMemo = ({
  externalLinkId,
  collectionId,
  onNotationsCreated,
  onCancel,
  onNavigateToLink,
  onStartGeneration,
  isGenerating,
  isCollaborator = false,
  showAttachments = false,
}) => {
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // Text input state
  const [textInput, setTextInput] = useState("");
  const [inputMode, setInputMode] = useState("text"); // "text" or "voice"

  // Image input state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Preview state
  const [previewNotations, setPreviewNotations] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showAttachmentForm, setShowAttachmentForm] = useState(false);
  const [attachmentMode, setAttachmentMode] = useState(null); // null, "manual", or "ai"
  const [notationsExpanded, setNotationsExpanded] = useState(true);
  const [attachmentsExpanded, setAttachmentsExpanded] = useState(false);

  // Success state for navigation
  const [createdCount, setCreatedCount] = useState(0);

  // Add local loading states to prevent double-clicks
  const [isConfirming, setIsConfirming] = useState(false);
  const [isGeneratingLocally, setIsGeneratingLocally] = useState(false);

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const playTimeIntervalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Mutations
  const previewMutation = usePreviewNotations();
  const confirmMutation = useConfirmNotations();
  const { mutateAsync: processImageMutation } = useProcessImage();
  const { mutate: uploadAttachment, isLoading: isUploadingAttachment } =
    useCreateAttachment();

  // Filter visibility options based on user role
  const filteredVisibilityOptions = visibilityOptions.filter(
    (option) => !isCollaborator || option.id !== "public"
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current)
        clearInterval(durationIntervalRef.current);
      if (playTimeIntervalRef.current)
        clearInterval(playTimeIntervalRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Auto-expand attachments section when notations are first generated
  useEffect(() => {
    if (showPreview && previewNotations.length > 0 && showAttachments) {
      // Small delay to allow notations section to render first
      setTimeout(() => {
        setAttachmentsExpanded(false); // Start collapsed so user notices it's available
      }, 500);
    }
  }, [showPreview, previewNotations.length, showAttachments]);

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/wav" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Stop all tracks to turn off microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error(
        "Failed to start recording. Please check microphone permissions."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  };

  const deleteRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  // Audio playback
  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (playTimeIntervalRef.current) {
        clearInterval(playTimeIntervalRef.current);
        playTimeIntervalRef.current = null;
      }
    } else {
      audioRef.current.play();
      setIsPlaying(true);

      playTimeIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      }, 100);
    }
  };

  const onAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    if (playTimeIntervalRef.current) {
      clearInterval(playTimeIntervalRef.current);
      playTimeIntervalRef.current = null;
    }
  };

  // Image handling functions
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please select an image file");
      }
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processImageToText = async () => {
    if (!imageFile) return;

    setIsProcessingImage(true);
    try {
      // Convert image file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(",")[1];

        const result = await processImageMutation({
          imageData: base64,
          prompt:
            "Extract any text from this image. If it contains handwritten notes, typed text, or any readable content, please extract it accurately. Focus on the actual text content only.",
        });

        // Handle the response format from the API
        const extractedText =
          result.content?.answer ||
          result.content?.text ||
          result.extractedText ||
          "";

        if (extractedText) {
          // Append the extracted text to the existing text input
          setTextInput((prev) => {
            const newText = prev
              ? `${prev}\n\n${extractedText}`
              : extractedText;
            return newText;
          });
          toast.success("Text extracted from image");
          removeImage(); // Clear the image after extraction
        } else {
          toast.error("No text could be extracted from this image");
        }
        setIsProcessingImage(false);
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error("Failed to process image:", error);
      toast.error("Failed to process image");
      setIsProcessingImage(false);
    }
  };

  // AI Preview
  const generatePreview = async () => {
    let prompt = "";

    if (inputMode === "text") {
      if (!textInput.trim()) {
        toast.error("Please enter some text to generate notations");
        return;
      }
      prompt = textInput.trim();
    } else {
      if (!audioBlob) {
        toast.error("Please record audio or switch to text mode");
        return;
      }
      // For now, we'll use a placeholder for audio transcription
      // In a real implementation, you'd transcribe the audio first
      prompt =
        "Audio recording provided for transcription and notation generation";
    }

    // Call onStartGeneration callback if provided
    if (onStartGeneration) {
      onStartGeneration();
    }

    setIsGeneratingLocally(true);

    try {
      const result = await previewMutation.mutateAsync({
        prompt,
        externalLinkId,
        collectionId,
        contextDetails: {
          inputMode,
          hasAudio: !!audioBlob,
          recordingDuration: recordingDuration,
        },
      });

      // Handle the correct API response structure
      const notations = result.preview || result.notations || [];

      if (notations && notations.length > 0) {
        setPreviewNotations(notations);
        setShowPreview(true);

        // Show the AI's message if available
        if (result.message) {
          toast.success(result.message);
        }
      } else {
        toast.error(
          "No notations generated. Try being more specific in your input."
        );
      }
    } catch (error) {
      console.error("Error generating preview:", error);
    } finally {
      setIsGeneratingLocally(false);
    }
  };

  // Preview editing
  const updateNotation = (index, field, value) => {
    setPreviewNotations((prev) =>
      prev.map((notation, i) =>
        i === index ? { ...notation, [field]: value } : notation
      )
    );
  };

  const removeNotation = (index) => {
    setPreviewNotations((prev) => prev.filter((_, i) => i !== index));
  };

  const addEmptyNotation = () => {
    const newNotation = {
      title: "New Notation",
      notes: "",
      category: "Observation",
      status: "Pending",
      highlighted: false,
      visibility: isCollaborator ? "unlisted" : "private",
      date: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      tags: [],
    };
    setPreviewNotations((prev) => [...prev, newNotation]);
  };

  // Confirm creation
  const confirmCreation = async () => {
    if (previewNotations.length === 0) {
      toast.error("No notations to create");
      return;
    }

    // Prevent double-clicks
    if (isConfirming || confirmMutation.isLoading) {
      return;
    }

    setIsConfirming(true);

    try {
      const result = await confirmMutation.mutateAsync({
        notations: previewNotations,
        externalLinkId,
        collectionId,
      });

      const notationsCount = result.createdCount || previewNotations.length;
      setCreatedCount(notationsCount);

      // Always call the onNotationsCreated callback first to update the parent component
      if (onNotationsCreated) {
        onNotationsCreated(
          result.notations || result.createdNotations || previewNotations
        );
      }

      // Show success toast with navigation option if we have navigation callback and external link
      if (onNavigateToLink && externalLinkId) {
        toast(
          (t) => (
            <div className="flex items-center gap-4">
              <span>
                Successfully created {notationsCount} notation
                {notationsCount > 1 ? "s" : ""}!
              </span>
              <button
                onClick={() => {
                  handleNavigateToLink();
                  toast.dismiss(t.id);
                }}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium hover:bg-blue-200 transition-colors"
              >
                View External Link →
              </button>
            </div>
          ),
          {
            duration: 6000,
            style: {
              minWidth: "350px",
            },
          }
        );
      } else {
        // Show simple success toast for cases without navigation
        toast.success(
          `Successfully created ${notationsCount} notation${
            notationsCount > 1 ? "s" : ""
          }!`
        );
      }

      // Note: Removed setShowSuccessWithNavigation(true) and onCancel()
      // The modal closing is now handled by the parent component via onNotationsCreated callback
    } catch (error) {
      console.error("Error creating notations:", error);
    } finally {
      setIsConfirming(false);
    }
  };

  const handleNavigateToLink = () => {
    if (externalLinkId && onNavigateToLink) {
      onNavigateToLink(externalLinkId);
    }
  };

  const handleAttachmentSubmit = async (formData) => {
    try {
      // Ensure the external link ID is included in the FormData
      if (formData instanceof FormData) {
        // Check if externalLinkId is already in the FormData, if not add it
        if (!formData.get("externalLinkId") && externalLinkId) {
          formData.append("externalLinkId", externalLinkId);
        }
      } else {
        // For non-FormData payloads, ensure externalLinkId is included
        if (!formData.externalLinkId && externalLinkId) {
          formData.externalLinkId = externalLinkId;
        }
      }

      await uploadAttachment(formData);
      toast.success("Attachment added successfully!");
      setShowAttachmentForm(false);
      // Keep attachments section expanded and show success
      setAttachmentsExpanded(true);
    } catch (error) {
      console.error("Error uploading attachment:", error);
      toast.error("Failed to add attachment");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (showPreview) {
    return (
      <div className="bg-white rounded-lg md:p-6 p-2 max-w-4xl mx-auto md:max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            Review AI-Generated Notations
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6 mb-6">
          {/* Notations Section with Toggle */}
          <div className="border border-gray-200 rounded-lg">
            <button
              onClick={() => setNotationsExpanded(!notationsExpanded)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Generated Notations ({previewNotations.length})
                </h3>
              </div>
              {notationsExpanded ? (
                <FaChevronUp className="text-gray-500" />
              ) : (
                <FaChevronDown className="text-gray-500" />
              )}
            </button>

            {notationsExpanded && (
              <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                {previewNotations.map((notation, index) => (
                  <NotationCard
                    key={index}
                    notation={notation}
                    index={index}
                    isEditing={editingIndex === index}
                    onEdit={() =>
                      setEditingIndex(editingIndex === index ? null : index)
                    }
                    onUpdate={(field, value) =>
                      updateNotation(index, field, value)
                    }
                    onRemove={() => removeNotation(index)}
                    categories={categories}
                    statuses={statuses}
                    visibilityOptions={filteredVisibilityOptions}
                    highlightedOptions={highlightedOptions}
                    externalLinkId={externalLinkId}
                  />
                ))}

                <button
                  onClick={addEmptyNotation}
                  className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                >
                  <FaPlus className="mr-2" />
                  Add Another Notation
                </button>
              </div>
            )}
          </div>

          {/* Attachments Section with Toggle - Only show if showAttachments is true */}
          {showAttachments && (
            <div className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setAttachmentsExpanded(!attachmentsExpanded)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium text-gray-900">
                    Add Attachments (Optional)
                  </h3>
                </div>
                {attachmentsExpanded ? (
                  <FaChevronUp className="text-gray-500" />
                ) : (
                  <FaChevronDown className="text-gray-500" />
                )}
              </button>

              {attachmentsExpanded && (
                <div className="p-4">
                  {!attachmentMode ? (
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setAttachmentMode("manual");
                          setShowAttachmentForm(true);
                        }}
                        className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                      >
                        <FaPaperclip className="mr-2" />
                        Upload File
                      </button>
                      <button
                        onClick={() => {
                          setAttachmentMode("ai");
                          setShowAttachmentForm(true);
                        }}
                        className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 border border-blue-300 rounded-md hover:bg-blue-50"
                      >
                        <FaMagic className="mr-2" />
                        AI Extract
                      </button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {attachmentMode === "manual" ? (
                        <AddAttachmentForm
                          externalLinkId={externalLinkId}
                          onSubmit={handleAttachmentSubmit}
                          onClose={() => {
                            setShowAttachmentForm(false);
                            setAttachmentMode(null);
                          }}
                          isLoading={isUploadingAttachment}
                          isCollaborator={isCollaborator}
                        />
                      ) : (
                        <AttachmentAICreate
                          externalLinkId={externalLinkId}
                          collectionId={collectionId}
                          onClose={() => {
                            setShowAttachmentForm(false);
                            setAttachmentMode(null);
                          }}
                          onAttachmentCreated={() => {
                            setShowAttachmentForm(false);
                            setAttachmentMode(null);
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t bg-white">
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(false)}
              disabled={isConfirming || confirmMutation.isLoading}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back to Edit
            </button>
            <button
              onClick={confirmCreation}
              disabled={
                isConfirming ||
                confirmMutation.isLoading ||
                previewNotations.length === 0
              }
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {(isConfirming || confirmMutation.isLoading) && (
                <FaSpinner className="animate-spin mr-2" />
              )}
              {isConfirming || confirmMutation.isLoading ? (
                "Creating..."
              ) : (
                <>
                  Create {previewNotations.length} Notation
                  {previewNotations.length !== 1 ? "s" : ""}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg md:p-6 p-2 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">AI Voice Memo</h2>
      </div>

      {/* Input Mode Toggle */}
      <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setInputMode("text")}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            inputMode === "text"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Text Input
        </button>
        {/* <button
          onClick={() => setInputMode("voice")}
          className={`flex-1 py-2 px-4 rounded-md transition-colors ${
            inputMode === "voice"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Voice Recording
        </button> */}
      </div>

      {/* Content Area */}
      {inputMode === "text" ? (
        <div className="mb-6">
          {/* Optional Image Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optional: Extract text from an image
            </label>
            {!imagePreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <FaImage className="mx-auto text-2xl text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  Click to upload an image with text
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  AI will extract text from the image
                </p>
              </div>
            ) : (
              <div className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Image ready for text extraction
                  </span>
                  <button
                    onClick={removeImage}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    <FaTimes />
                  </button>
                </div>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 rounded mb-2"
                />
                <button
                  onClick={processImageToText}
                  disabled={isProcessingImage}
                  className="w-full py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {isProcessingImage ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Extracting Text...
                    </>
                  ) : (
                    <>
                      <FaMagic />
                      Extract Text from Image
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your ideas, tasks, or observations:
          </label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., 'I need to follow up with Dr. Smith about the study results, review the latest research paper on cardiology treatments, and schedule a meeting with the research team for next Tuesday at 2pm'"
          />
        </div>
      ) : (
        <div className="mb-6">
          {!audioUrl ? (
            <div className="text-center py-8">
              <div className="mb-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl transition-colors ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                >
                  {isRecording ? <FaStop /> : <FaMicrophone />}
                </button>
              </div>

              {isRecording && (
                <div className="text-lg font-medium text-red-600">
                  Recording... {formatTime(recordingDuration)}
                </div>
              )}

              {!isRecording && (
                <p className="text-gray-600">
                  Click to start recording your voice memo
                </p>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">
                  Recording ({formatTime(recordingDuration)})
                </span>
                <button
                  onClick={deleteRecording}
                  className="text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlayback}
                  className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600"
                >
                  {isPlaying ? <FaPause /> : <FaPlay />}
                </button>

                <div className="flex-1">
                  <div className="bg-gray-300 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${(currentTime / recordingDuration) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(recordingDuration)}</span>
                  </div>
                </div>
              </div>

              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={onAudioEnded}
                style={{ display: "none" }}
              />
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={generatePreview}
          disabled={
            isGeneratingLocally ||
            previewMutation.isLoading ||
            (isGenerating !== undefined && isGenerating) ||
            (inputMode === "text" && !textInput.trim()) ||
            (inputMode === "voice" && !audioBlob)
          }
          className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 min-w-[180px] justify-center"
        >
          {(isGeneratingLocally ||
            previewMutation.isLoading ||
            (isGenerating !== undefined && isGenerating)) && (
            <FaSpinner className="animate-spin mr-2" />
          )}
          {isGeneratingLocally ||
          previewMutation.isLoading ||
          (isGenerating !== undefined && isGenerating) ? (
            "Generating..."
          ) : (
            <>
              <FaMagic className="mr-2" />
              Generate Notations
            </>
          )}
        </button>
      </div>
    </div>
  );
};

// Notation Card Component for Preview
const NotationCard = ({
  notation,
  index,
  isEditing,
  onEdit,
  onUpdate,
  onRemove,
  categories,
  statuses,
  visibilityOptions,
  highlightedOptions,
  externalLinkId,
}) => {
  if (isEditing) {
    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={notation.title}
              onChange={(e) => onUpdate("title", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={notation.category}
                onChange={(e) => onUpdate("category", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={notation.status}
                onChange={(e) => onUpdate("status", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={notation.date}
                onChange={(e) => onUpdate("date", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={notation.startTime || ""}
                onChange={(e) => onUpdate("startTime", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={notation.endTime || ""}
                onChange={(e) => onUpdate("endTime", e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={notation.notes}
              onChange={(e) => onUpdate("notes", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>

          {/* Tags Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <TagInput
              value={notation.tags || []}
              onChange={(tags) => onUpdate("tags", tags)}
              externalLinkId={externalLinkId}
              placeholder="Add tags to categorize this notation..."
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notation.highlighted}
                  onChange={(e) => onUpdate("highlighted", e.target.checked)}
                  className="mr-2"
                />
                Highlighted
              </label>

              <select
                value={notation.visibility}
                onChange={(e) => onUpdate("visibility", e.target.value)}
                className="p-1 border border-gray-300 rounded text-sm"
              >
                {visibilityOptions.map((vis) => (
                  <option key={vis.id} value={vis.id}>
                    {vis.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={onEdit}
                className="flex-1 sm:flex-initial flex items-center justify-center px-3 py-1 text-green-600 border border-green-300 rounded hover:bg-green-50"
              >
                <FaCheck className="mr-1" />
                Save
              </button>
              <button
                onClick={() => onRemove()}
                className="flex-1 sm:flex-initial flex items-center justify-center px-3 py-1 text-red-600 border border-red-300 rounded hover:bg-red-50"
              >
                <FaTrash className="mr-1" />
                Remove
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-gray-900">{notation.title}</h3>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="text-blue-600 hover:text-blue-800"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => onRemove()}
            className="text-red-600 hover:text-red-800"
          >
            <FaTrash />
          </button>
        </div>
      </div>

      <p className="text-gray-700 text-sm mb-3">{notation.notes}</p>

      {/* Tags Display */}
      {notation.tags && notation.tags.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1.5">
            {notation.tags.map((tag, tagIndex) => (
              <span
                key={tag.id || tagIndex}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: tag.color ? `${tag.color}20` : "#3B82F620",
                  borderColor: tag.color || "#3B82F6",
                  color: tag.color || "#3B82F6",
                  border: "1px solid",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: tag.color || "#3B82F6" }}
                ></span>
                {tag.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
          {notation.category}
        </span>
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded">
          {notation.status &&
            notation.status.charAt(0).toUpperCase() + notation.status.slice(1)}
        </span>
        {notation.date && (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
            {formatLongDate(notation.date)}
          </span>
        )}
        {notation.startTime && (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">
            {(() => {
              try {
                const [hours, minutes] = notation.startTime.split(":");
                const hour = parseInt(hours, 10);
                const ampm = hour >= 12 ? "PM" : "AM";
                const hour12 = hour % 12 || 12;
                const formattedTime = `${hour12}:${minutes || "00"} ${ampm}`;
                return notation.endTime
                  ? (() => {
                      const [endHours, endMinutes] =
                        notation.endTime.split(":");
                      const endHour = parseInt(endHours, 10);
                      const endAmpm = endHour >= 12 ? "PM" : "AM";
                      const endHour12 = endHour % 12 || 12;
                      return `${formattedTime} - ${endHour12}:${
                        endMinutes || "00"
                      } ${endAmpm}`;
                    })()
                  : formattedTime;
              } catch (e) {
                return notation.startTime;
              }
            })()}
          </span>
        )}
        {notation.highlighted && (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
            ⭐ Highlighted
          </span>
        )}
      </div>
    </div>
  );
};

export default AIVoiceMemo;
