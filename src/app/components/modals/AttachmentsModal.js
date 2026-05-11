import { useState } from "react";
import {
  FaFileAlt,
  FaFileArchive,
  FaTrash,
  FaDownload,
  FaPaperclip,
} from "react-icons/fa";
import Modal from "@/app/components/Modal";
import ImageBrowser from "../ImageBrowser/ImageBrowser";

const AttachmentsModal = ({
  attachments = [],
  isOpen,
  onClose,
  isAdmin = false,
  onDelete,
  title = "Attachments",
}) => {
  // Separate attachments by type
  const imageAttachments = attachments.filter((att) => att.type === "image");
  const nonImageAttachments = attachments.filter((att) => att.type !== "image");

  const handleAttachmentClick = (attachment) => {
    window.open(attachment.presignedUrl, "_blank");
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (onDelete) {
      await onDelete(attachmentId);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose}>
      <div className="p-3 sm:p-6 max-w-4xl w-full mx-auto h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="flex justify-between items-center mb-4 z-10 py-2">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 flex items-center gap-2">
            <FaPaperclip className="text-gray-500" />
            <span className="pt-4 md:pt-0">{title}</span>
          </h2>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Image Attachments using ImageBrowser */}
          {imageAttachments.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 shadow-sm">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Images</h3>
              <ImageBrowser
                images={imageAttachments}
                onDelete={onDelete}
                isAdmin={isAdmin}
              />
            </div>
          )}

          {/* Non-Image Attachments */}
          {nonImageAttachments.length > 0 && (
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                <FaFileArchive className="text-gray-500" />
                <span>Documents & Files</span>
              </h3>
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {nonImageAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    onClick={() => handleAttachmentClick(attachment)}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:border-teal-500 transition-all duration-200 cursor-pointer hover:shadow-md group"
                  >
                    <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-teal-50 rounded-md flex items-center justify-center text-teal-600 border border-teal-100">
                      <FaFileAlt className="text-sm sm:text-base" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 group-hover:text-teal-700 transition-colors truncate">
                        {attachment.title}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 truncate">
                        {attachment.description}
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors whitespace-nowrap">
                      Download
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {attachments.length === 0 && (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              No attachments available
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default AttachmentsModal;
