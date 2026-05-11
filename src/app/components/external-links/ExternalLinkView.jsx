import React, { useState } from "react";
import {
  FaEdit,
  FaExternalLinkAlt,
  FaFlask,
  FaCalendarAlt,
  FaBuilding,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaStar,
  FaPlay,
  FaFileArchive,
  FaFileAlt,
  FaStickyNote,
  FaPlus,
  FaRegStickyNote,
  FaLock,
  FaTag,
  FaCopy,
  FaCheck,
} from "react-icons/fa";
import Modal from "@/app/components/Modal";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import AddExternalLinkForm from "@/app/components/forms/AddExternalLinkForm";
import AddNotationForm from "@/app/components/forms/AddNotationForm";
import NotationsList from "@/app/components/notations/NotationsList";
import CustomEditor from "@/app/components/common/CustomEditor";
import AddAttachmentForm from "@/app/components/forms/AddAttachmentForm";
import ImageBrowser from "@/app/components/ImageBrowser/ImageBrowser";
import TimestampModal from "@/app/components/TimestampModal";
import { useExternalLinkTagsForLink } from "@/app/hooks/useTags";
import { toast } from "react-hot-toast";

const ExternalLinkView = ({
  externalLink,
  isLoading,
  isAdmin,
  isAdvocate,
  isEditing,
  setIsEditing,
  showAddNotation,
  setShowAddNotation,
  editingNotation,
  setEditingNotation,
  activeNotesTab,
  setActiveNotesTab,
  showAddAttachment,
  setShowAddAttachment,
  showTimestamps,
  setShowTimestamps,
  currentImageIndex,
  setCurrentImageIndex,
  handleSubmitNotation,
  handleSubmitAttachment,
  handleUpdateExternalLink,
  handleAttachmentClick,
  deleteNotation,
  onBackClick,
  readOnly = false,
}) => {
  // Add tags hook
  const { data: linkTags = [] } = useExternalLinkTagsForLink(externalLink?.id);
  const [copiedNotationId, setCopiedNotationId] = useState(null);

  const isYoutubeUrl = (url) => {
    return Boolean(
      url?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/)
    );
  };

  // Function to extract plain text from HTML content
  const extractTextFromHTML = (htmlContent) => {
    if (!htmlContent) return "";

    // Parse the HTML content to extract text without images
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    // Remove all img elements
    const images = doc.querySelectorAll("img");
    images.forEach(img => img.remove());

    // Get the text content
    let textContent = doc.body.textContent || "";

    // Clean up excessive whitespace
    textContent = textContent
      .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newline
      .trim();

    return textContent;
  };

  // Handle copy notation text
  const handleCopyNotation = async (notation) => {
    try {
      const textContent = extractTextFromHTML(notation.notes);

      if (!textContent) {
        toast.error("No text content to copy");
        return;
      }

      await navigator.clipboard.writeText(textContent);
      setCopiedNotationId(notation.id);
      toast.success("Notation text copied to clipboard!");

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedNotationId(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
      toast.error("Failed to copy text to clipboard");
    }
  };

  // Filter notations based on active tab
  const getFilteredNotations = () => {
    if (!externalLink?.notations) return [];

    switch (activeNotesTab) {
      case "all":
        return externalLink.notations.filter(
          (note) => {
            // If status is undefined or null, include the notation
            if (!note.status) return true;
            return note.status !== "Archived" && note.status !== "Canceled";
          }
        );
      case "active":
        return externalLink.notations.filter(
          (note) => {
            // If no status, consider it active
            if (!note.status) return true;
            return note.status !== "Completed" &&
                   note.status !== "Archived" &&
                   note.status !== "Canceled";
          }
        );
      case "completed":
        return externalLink.notations.filter(
          (note) => note.status === "Completed"
        );
      case "archived":
        return externalLink.notations.filter(
          (note) => note.status === "Archived" || note.status === "Canceled"
        );
      default:
        return externalLink.notations;
    }
  };

  const imageAttachments =
    externalLink?.attachments?.filter(
      (attachment) => attachment.type === "image"
    ) || [];

  const nonImageAttachments =
    externalLink?.attachments?.filter(
      (attachment) => attachment.type !== "image"
    ) || [];

  const filteredNotations = getFilteredNotations();

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6 mt-20 opacity-50">
        <LoadingSkeleton lines={5} height="32px" width={[70, 65, 70, 65]} />
        <LoadingSkeleton lines={5} height="32px" width={[70, 65, 70, 65]} />
      </div>
    );
  }

  if (!externalLink) {
    return <div></div>;
  }

  return (
    <div className="md:w-11/12 w-full mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        {onBackClick && (
          <button
            onClick={onBackClick}
            className="text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-50"
          >
            <FaChevronLeft className="text-sm" />
            <span>Back to Collections</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="relative">
          {/* Subtle top accent bar */}
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-purple-600 to-indigo-700"></div>

          <div className="pt-8 px-6 pb-6 bg-gradient-to-b from-purple-50/50 to-white">
            <div className="flex justify-between items-start flex-col md:flex-row gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                    <FaFlask className="mr-1.5 h-3 w-3" />
                    <span className="capitalize">
                      {externalLink.type.replace("_", " ")}
                    </span>
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                    <FaCalendarAlt className="mr-1.5 h-3 w-3" />
                    {new Date(externalLink.dateAdded).toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-700 border border-blue-500/30">
                    {externalLink.visibility === "public" ? (
                      <span className="flex items-center gap-1">Public</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <FaLock className="text-[10px]" />
                        {externalLink.visibility.charAt(0).toUpperCase() +
                          externalLink.visibility.slice(1)}
                      </span>
                    )}
                  </span>
                </div>

                {/* Tags Section */}
                {linkTags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {linkTags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border"
                        style={{
                          backgroundColor: `${tag.color}15`,
                          borderColor: `${tag.color}40`,
                          color: tag.color,
                        }}
                      >
                        <FaTag className="w-2.5 h-2.5" />
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}

                <h1 className="text-2xl font-bold text-gray-800">
                  {externalLink.name}
                </h1>
              </div>

              {!readOnly && (
                <div className="flex items-center gap-3 flex-wrap">
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddAttachment(true)}
                      className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors flex items-center gap-2 text-sm border border-purple-200 whitespace-nowrap"
                    >
                      <span>Add Attachment</span>
                    </button>
                  )}

                  {(isAdmin ||
                    (isAdvocate && externalLink.visibility === "private")) && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-3 py-2 bg-white rounded-md
                          border border-gray-200 hover:border-gray-300
                          shadow-sm hover:shadow transition-all duration-200 
                          text-gray-700 hover:text-gray-800
                          text-sm font-medium whitespace-nowrap"
                    >
                      <FaEdit className="text-[15px] text-gray-500" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Description Section - Refined */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">
                  Description
                </h2>
              </div>

              <div className="bg-gray-50 rounded-lg p-5 border border-gray-100 shadow-inner">
                <div className="text-gray-700 max-h-[400px] overflow-auto custom-scrollbar min-h-[200px]">
                  <CustomEditor
                    content={externalLink.description}
                    readOnly={true}
                    transparent={true}
                    className="text-gray-700"
                  />
                </div>
              </div>
            </section>

            {/* Attachments Section - Refined */}
            {externalLink.attachments &&
              externalLink.attachments.length > 0 && (
                <section>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-semibold text-gray-700">
                      Attachments
                    </h2>
                    {isYoutubeUrl(externalLink.url) && (
                      <button
                        onClick={() => setShowTimestamps(true)}
                        className="px-4 py-2 text-blue-600 bg-blue-500/10 hover:bg-blue-500/20 rounded-md transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40 text-sm flex items-center gap-2"
                      >
                        <FaPlay className="text-xs" />
                        <span>Watch Video</span>
                      </button>
                    )}
                  </div>

                  {imageAttachments.length > 0 && (
                    <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                      <ImageBrowser
                        images={imageAttachments}
                        onClose={() => {
                          setShowAddAttachment && setShowAddAttachment(false);
                          setCurrentImageIndex && setCurrentImageIndex(0);
                        }}
                      />
                    </div>
                  )}

                  {nonImageAttachments.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <FaFileArchive className="text-gray-500" />
                        <span>Documents & Files</span>
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {nonImageAttachments.map((attachment, index) => (
                          <div
                            key={index}
                            onClick={() =>
                              handleAttachmentClick &&
                              handleAttachmentClick(attachment)
                            }
                            className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-teal-500 transition-all duration-200 cursor-pointer hover:shadow-md group"
                          >
                            <div className="flex-shrink-0 w-10 h-10 bg-teal-50 rounded-md flex items-center justify-center text-teal-600 border border-teal-100">
                              <FaFileAlt />
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 group-hover:text-teal-700 transition-colors">
                                {attachment.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {attachment.description}
                              </div>
                            </div>
                            <div className="text-sm text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors">
                              Download
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}
          </div>

          {/* Notes Section - Refined */}
          <section className="mt-8 w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-700 flex items-center gap-2">
                <FaRegStickyNote className="text-gray-400 ml-1" />
                <span>Notes</span>
              </h2>
              {!readOnly &&
                (isAdmin ||
                  (isAdvocate && externalLink.visibility === "private")) && (
                  <button
                    onClick={() => setShowAddNotation(true)}
                    className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
                  >
                    <FaPlus className="text-sm" />
                    <span>Add Note</span>
                  </button>
                )}
            </div>

            {/* Notes Tabs */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveNotesTab("all")}
                className={`px-4 py-2 font-medium text-sm ${
                  activeNotesTab === "all"
                    ? "border-b-2 border-indigo-600 text-indigo-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveNotesTab("active")}
                className={`px-4 py-2 font-medium text-sm ${
                  activeNotesTab === "active"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setActiveNotesTab("completed")}
                className={`px-4 py-2 font-medium text-sm ${
                  activeNotesTab === "completed"
                    ? "border-b-2 border-green-600 text-green-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Completed
              </button>
              <button
                onClick={() => setActiveNotesTab("archived")}
                className={`px-4 py-2 font-medium text-sm ${
                  activeNotesTab === "archived"
                    ? "border-b-2 border-gray-600 text-gray-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Archived/Canceled
              </button>
            </div>

            {filteredNotations.length > 0 ? (
              <div className="space-y-4">
                {filteredNotations.map((notation, index) => (
                  <div
                    key={notation.id}
                    className="bg-gradient-to-br from-white via-white to-gray-50 rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <div className="p-6">
                      {/* Note Header with Tags */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {notation.highlighted && (
                          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-600">
                            <FaStar className="mr-2 h-4 w-4" /> Featured
                          </span>
                        )}
                        {notation.category && (
                          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-emerald-50 text-emerald-600">
                            {notation.category}
                          </span>
                        )}

                        {notation.status && (
                          <span
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium ${
                              notation.status === "Completed"
                                ? "bg-green-100 text-green-600"
                                : notation.status === "Archived" ||
                                  notation.status === "Canceled"
                                ? "bg-gray-200 text-gray-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {notation.status}
                          </span>
                        )}
                      </div>

                      {/* Note Title & Content */}
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        {notation.title}
                      </h3>
                      <div className="text-gray-600 bg-white p-4 rounded-lg border border-gray-100">
                        <CustomEditor
                          content={notation.notes}
                          readOnly={true}
                          transparent={true}
                        />
                      </div>

                      {/* Note Footer */}
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                        <span className="text-sm text-gray-500">
                          {new Date(notation.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          {/* Copy button */}
                          <button
                            onClick={() => handleCopyNotation(notation)}
                            className={`flex items-center gap-1 transition-colors ${
                              copiedNotationId === notation.id
                                ? "text-green-500 hover:text-green-600"
                                : "text-gray-500 hover:text-blue-500"
                            }`}
                            title="Copy text content (without images)"
                          >
                            {copiedNotationId === notation.id ? (
                              <>
                                <FaCheck className="text-sm" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <FaCopy className="text-sm" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          {!readOnly && (
                            <>
                              <button
                                onClick={() => setEditingNotation(notation)}
                                className="text-gray-500 hover:text-blue-500 flex items-center gap-1"
                              >
                                <FaEdit className="text-sm" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => deleteNotation(notation)}
                                className="text-gray-500 hover:text-red-500 flex items-center gap-1"
                              >
                                <FaTimes className="text-sm" />
                                <span>Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <p className="text-gray-500">
                  {activeNotesTab === "all"
                    ? "No notes found"
                    : activeNotesTab === "active"
                    ? "No active notes found"
                    : activeNotesTab === "completed"
                    ? "No completed notes found"
                    : "No archived or canceled notes found"}
                </p>
              </div>
            )}
          </section>

          <div className="mt-8 flex justify-end">
            <a
              href={externalLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-md font-medium rounded-lg flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow"
            >
              Visit Resource
              <FaExternalLinkAlt />
            </a>
          </div>
        </div>
      </div>

      {!readOnly && (
        <>
          {isEditing && (
            <Modal onClose={() => setIsEditing(false)}>
              <AddExternalLinkForm
                collectionTenantId={externalLink.tenantId}
                externalLinkId={externalLink.id}
                isAdmin={isAdmin}
                isAdvocate={isAdvocate}
                initialValues={externalLink}
                onSubmit={async (formData) => {
                  handleUpdateExternalLink(formData);
                  setIsEditing(false);
                }}
                onClose={() => setIsEditing(false)}
              />
            </Modal>
          )}

          {(showAddNotation || editingNotation) && (
            <Modal
              onClose={() => {
                setShowAddNotation(false);
                setEditingNotation(null);
              }}
              maxWidth="max-w-7xl"
            >
              <AddNotationForm
                onSubmit={handleSubmitNotation}
                onClose={() => {
                  setShowAddNotation(false);
                  setEditingNotation(null);
                }}
                initialValues={editingNotation}
                enableEnhancedEditor={true}
              />
            </Modal>
          )}

          {showAddAttachment && (
            <Modal onClose={() => setShowAddAttachment(false)}>
              <AddAttachmentForm
                externalLinkId={externalLink.id}
                onSubmit={handleSubmitAttachment}
                onClose={() => setShowAddAttachment(false)}
              />
            </Modal>
          )}
        </>
      )}

      {showTimestamps && (
        <TimestampModal
          isOpen={showTimestamps}
          onClose={() => setShowTimestamps(false)}
          timestamps={externalLink.timestamps}
          videoUrl={externalLink.url}
        />
      )}
    </div>
  );
};

export default ExternalLinkView;
