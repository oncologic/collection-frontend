import React, { useState, useRef } from "react";
import {
  FaMagic,
  FaSpinner,
  FaEdit,
  FaTimes,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaUpload,
  FaImage,
  FaKeyboard,
  FaEye,
  FaFileAlt,
  FaPaperclip,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useProcessImage } from "../hooks/useAI";
import { useCreateAttachment } from "../hooks/useAttachments";
import { useQueryClient } from "@tanstack/react-query";
import InputField from "./inputs/InputField";

// Helper function to get file icon based on type
const getFileIcon = (fileType) => {
  if (!fileType) return FaFileAlt;

  if (fileType.includes("image")) return FaFileImage;
  if (fileType.includes("pdf")) return FaFilePdf;
  if (fileType.includes("word") || fileType.includes("doc")) return FaFileWord;
  if (fileType.includes("excel") || fileType.includes("spreadsheet"))
    return FaFileExcel;

  return FaFileAlt;
};

const AttachmentAICreate = ({
  onClose,
  onAttachmentCreated,
  externalLinkId,
  resourceId,
  collectionId,
}) => {
  // Input state
  const [inputMode, setInputMode] = useState("image"); // "text" or "image"
  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Preview state
  const [generatedContent, setGeneratedContent] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Loading states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Character count
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 4000;

  // Refs
  const fileInputRef = useRef(null);

  // Hooks
  const { mutateAsync: processImageMutation } = useProcessImage();
  const { mutateAsync: createAttachmentMutation } = useCreateAttachment();
  const queryClient = useQueryClient();

  // Handle image file selection
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

  // Process image to extract text and generate content
  const handleProcessImage = async () => {
    if (!imageFile) return;

    setIsProcessing(true);
    try {
      // Convert image file to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(",")[1];

        const result = await processImageMutation({
          imageData: base64,
          prompt:
            "Extract and summarize the key information from this image. If it contains text, extract it. If it's a diagram or chart, describe what it shows. Provide a clear title (max 100 chars) and a concise description (max 400 chars) focusing on the most important information.",
        });

        // Handle the response format from the API
        const extractedContent =
          result.content?.answer ||
          result.content?.text ||
          result.extractedText ||
          "";

        if (extractedContent) {
          // Try to extract a title and description from the AI response
          let title = "Untitled Attachment";
          let description = extractedContent;

          // If the response has markdown headers, extract the title
          const titleMatch = extractedContent.match(
            /^#+\s*\*?\*?(.+?)\*?\*?$/m
          );
          if (titleMatch) {
            title = titleMatch[1].trim();
            // Remove the title from the description
            description = extractedContent.replace(titleMatch[0], "").trim();
          }

          // Clean up the title - remove any markdown formatting
          title = title
            .replace(/\*\*/g, "")
            .replace(/###?\s*/g, "")
            .trim();

          // If the title is too generic or contains "Title:", extract a better one
          if (
            title.toLowerCase().includes("title:") ||
            title === "Untitled Attachment"
          ) {
            const betterTitleMatch = extractedContent.match(
              /(?:Event Title:|Title:|Event:)\s*\*?\*?(.+?)\*?\*?(?:\n|$)/i
            );
            if (betterTitleMatch) {
              title = betterTitleMatch[1].trim();
            }
          }

          setGeneratedContent({
            title: title.substring(0, 100), // Limit title length
            description: description.substring(0, 500), // Limit description to 500 chars
            extractedText: extractedContent,
            fileType: imageFile.type,
            fileName: imageFile.name,
            originalFile: imageFile, // Preserve the original file
          });

          setShowPreview(true);
          toast.success("Content extracted from image");
        } else {
          // Even if no text was extracted, allow the image to be attached
          setGeneratedContent({
            title: imageFile.name.replace(/\.[^/.]+$/, "").substring(0, 100), // Remove extension and limit length
            description: "Image attachment - no text content extracted",
            extractedText: "",
            fileType: imageFile.type,
            fileName: imageFile.name,
            originalFile: imageFile, // Preserve the original file
          });

          setShowPreview(true);
          toast("No text extracted, but you can still attach the image", {
            icon: "",
          });
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error("Failed to process image:", error);
      toast.error("Failed to process image");
      setIsProcessing(false);
    }
  };

  // Handle text input processing
  const handleProcessText = async () => {
    if (!textInput.trim()) {
      toast.error("Please enter some text");
      return;
    }

    setIsProcessing(true);
    try {
      // For text input, we'll create a simple attachment with the text as content
      const lines = textInput.split("\n").filter((line) => line.trim());
      const title = lines[0] || "Text Attachment";
      const description =
        lines.length > 1 ? lines.slice(1).join("\n") : textInput;

      setGeneratedContent({
        title: title.substring(0, 100), // Limit title length
        description: description.substring(0, 500), // Limit description to 500 chars
        extractedText: textInput,
        fileType: "text/plain",
        fileName: "text-content.txt",
      });

      setShowPreview(true);
      setIsProcessing(false);
    } catch (error) {
      console.error("Failed to process text:", error);
      toast.error("Failed to process text");
      setIsProcessing(false);
    }
  };

  // Handle text input change
  const handleTextChange = (value) => {
    if (value.length <= MAX_CHARS) {
      setTextInput(value);
      setCharCount(value.length);
    }
  };

  // Update generated content
  const updateGeneratedContent = (field, value) => {
    setGeneratedContent((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Create attachment
  const handleCreateAttachment = async () => {
    if (!generatedContent) {
      toast.error("No content to create attachment");
      return;
    }

    setIsCreating(true);

    try {
      // Create a blob from the content
      let fileBlob;
      let fileName;

      if (inputMode === "image" && generatedContent.originalFile) {
        // Use the original image file from generatedContent
        fileBlob = generatedContent.originalFile;
        fileName = generatedContent.fileName;
      } else {
        // Create a text file from the extracted content
        const textContent =
          generatedContent.extractedText || generatedContent.description;
        fileBlob = new Blob([textContent], { type: "text/plain" });
        fileName = `ai-generated-${Date.now()}.txt`;
      }

      // Ensure we have a file
      if (!fileBlob) {
        toast.error("No file to upload");
        setIsCreating(false);
        return;
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("attachment", fileBlob, fileName); // Changed from "file" to "attachment"
      formData.append("title", generatedContent.title);
      formData.append("description", generatedContent.description);
      formData.append("type", "ai_generated");

      if (externalLinkId) {
        formData.append("externalLinkId", externalLinkId);
      }
      if (resourceId) {
        formData.append("resourceId", resourceId);
      }
      if (collectionId) {
        formData.append("collectionId", collectionId);
      }

      // Create the attachment
      await createAttachmentMutation(formData);

      toast.success("Attachment created successfully");

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries(["external-link", externalLinkId]);
      queryClient.invalidateQueries(["attachments"]);
      queryClient.invalidateQueries({ queryKey: ["resources"] });
      queryClient.invalidateQueries({ queryKey: ["public-resource"] });
      queryClient.invalidateQueries({ queryKey: ["public-resources"] });

      // Call parent callback
      if (onAttachmentCreated) {
        onAttachmentCreated({
          title: generatedContent.title,
          description: generatedContent.description,
          type: "ai_generated",
        });
      }

      // Close modal
      onClose();
    } catch (error) {
      console.error("Failed to create attachment:", error);
      toast.error(error.message || "Failed to create attachment");
    } finally {
      setIsCreating(false);
    }
  };

  // Render content preview
  const renderPreview = () => {
    if (!generatedContent) return null;

    const FileIcon = getFileIcon(generatedContent.fileType);

    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <FileIcon className="text-blue-500 text-xl" />
            <span className="font-medium text-gray-700">
              Attachment Preview
            </span>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-1 text-gray-500 hover:text-blue-500"
            title={isEditing ? "Save" : "Edit"}
          >
            {isEditing ? <FaCheck /> : <FaEdit />}
          </button>
        </div>

        <div className="space-y-3">
          {isEditing ? (
            <>
              <InputField
                label="Title"
                value={generatedContent.title}
                onChange={(e) =>
                  updateGeneratedContent("title", e.target.value)
                }
                placeholder="Enter attachment title"
                required
                maxLength={100}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={generatedContent.description}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) {
                      updateGeneratedContent("description", e.target.value);
                    }
                  }}
                  placeholder="Add a description..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={6}
                  maxLength={500}
                />
                <div className="mt-1 text-sm text-gray-500 text-right">
                  {generatedContent.description.length} / 500
                </div>
              </div>
            </>
          ) : (
            <>
              <h3 className="font-semibold text-lg">
                {generatedContent.title}
              </h3>
              <div className="text-gray-600 text-sm whitespace-pre-wrap">
                {generatedContent.description}
              </div>
              {generatedContent.fileName && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <FaPaperclip className="text-xs" />
                  {generatedContent.fileName}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FaMagic className="text-blue-500" />
          AI Attachment Creator
        </h2>
        <p className="text-gray-600">
          Extract content from images or text to create attachments with AI
          assistance
        </p>
      </div>

      {/* Input Section */}
      {!showPreview && (
        <div className="space-y-4">
          {/* Input Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setInputMode("image")}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                inputMode === "image"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaImage />
              Image Upload
            </button>
            <button
              onClick={() => setInputMode("text")}
              className={`flex-1 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                inputMode === "text"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <FaKeyboard />
              Text Input
            </button>
          </div>

          {/* Image Input */}
          {inputMode === "image" && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                {imagePreview ? (
                  <div className="space-y-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <p className="text-gray-600">Click to change image</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FaUpload className="mx-auto text-4xl text-gray-400" />
                    <p className="text-gray-600">Click to upload an image</p>
                    <p className="text-sm text-gray-500">
                      AI will extract and summarize content from the image
                    </p>
                  </div>
                )}
              </div>
              {imageFile && (
                <button
                  onClick={handleProcessImage}
                  disabled={isProcessing}
                  className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Processing Image...
                    </>
                  ) : (
                    <>
                      <FaEye />
                      Extract Content from Image
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Text Input */}
          {inputMode === "text" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Enter content for the attachment
              </label>
              <textarea
                value={textInput}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Enter text content that will be converted into an attachment..."
                className="w-full h-64 px-4 py-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  AI will help format and organize your content
                </span>
                <span
                  className={`${
                    charCount > MAX_CHARS * 0.9
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {charCount} / {MAX_CHARS}
                </span>
              </div>
              <button
                onClick={handleProcessText}
                disabled={isProcessing || !textInput.trim()}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    Processing Text...
                  </>
                ) : (
                  <>
                    <FaMagic />
                    Generate Attachment
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Preview Section */}
      {showPreview && (
        <div className="space-y-4">
          {renderPreview()}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                setShowPreview(false);
                setGeneratedContent(null);
                setTextInput("");
                setImageFile(null);
                setImagePreview(null);
                setInputMode("image"); // Reset to default mode
                setIsEditing(false); // Reset edit state
              }}
              className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Start Over
            </button>
            <button
              onClick={handleCreateAttachment}
              disabled={isCreating}
              className="flex-1 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FaCheck />
                  Create Attachment
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttachmentAICreate;
