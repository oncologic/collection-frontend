"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  FaInfoCircle,
  FaShieldAlt,
  FaExclamationTriangle,
  FaGraduationCap,
  FaClock,
  FaArrowRight,
  FaTags,
  FaTimes,
  FaRegStickyNote,
  FaComment,
  FaCommentDots,
  FaTrash,
  FaCopy,
  FaPlay,
} from "react-icons/fa";
import toast from "react-hot-toast";
import CustomEditor from "../common/CustomEditor";
import ResourceDetails from "../details/ResourceDetails";
import { TagsPopover } from "../common/tagsPopover";
import { useRouter } from "next/navigation";
import TimestampModal from "../TimestampModal";

const ResourceCard = ({
  resource,
  additionalButtons,
  notes,
  onClose,
  deleteOption = false,
  deleteResource,
  isAdmin = false,
  resourceTypes,
  onCopyResource,
  featured = false,
  showCopyLink = false,
}) => {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const {
    resourceDate,
    name,
    description,
    updatedAt,
    image,
    type,
    tags,
    url,
    buttonName,
    registrationRequired,
    sensitivityLevel,
    expertiseLevel,
    organizations,
    patientRating,
    expertRating,
  } = resource;

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isInfoPopupOpen, setIsInfoPopupOpen] = useState(false);
  const [resourceType, setResourceType] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);
  //TODO: Update this with actual data
  const infoDetails = {
    organization: "COA",
    approvedBy: "Katie Coleman",
    dateAdded: "2023-01-01",
    dateScreened: "2023-01-02",
  };

  useEffect(() => {
    if (resource.typeName) {
      setResourceType(resource.typeName);
    }
  }, [resourceTypes, resource.typeId, resource.typeName]);

  const handleButtonClick = () => {
    router.push(`/resources/${resource.id}`);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const handleViewDetails = () => {
    router.push(`/resources/${resource.id}`);
  };

  const renderSensitivityIcon = (sensitivityLevel) => {
    const level = resource.rating?.rating || 0;
    switch (level) {
      case 3:
        return (
          <FaExclamationTriangle
            className="text-red-400"
            title="High Sensitivity"
          />
        );
      case 2:
        return (
          <FaExclamationTriangle
            className="text-yellow-400"
            title="Medium Sensitivity"
          />
        );
      case 1:
        return (
          <FaShieldAlt className="text-green-400" title="Low Sensitivity" />
        );
      default:
        return (
          <FaShieldAlt className="text-gray-400" title="Pending - Not Rated" />
        );
    }
  };

  // New Rating Components
  const PatientRating = ({ rating }) => (
    <span className="">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={index < rating ? "text-yellow-500" : "text-gray-300"}
        >
          ★
        </span>
      ))}
    </span>
  );

  const ExpertRating = ({ rating }) => (
    <span className="">
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          className={index < rating ? "text-yellow-500" : "text-gray-300"}
        >
          ★
        </span>
      ))}
    </span>
  );

  // --- Updated Copy Handler ---
  // When the admin clicks the copy icon, remove the resource's id and description,
  // then prepare and pass the remaining data along with form keys needed for selection fields.
  const handleCopyResource = (e) => {
    e.stopPropagation();
    // Destructure to remove id and description
    const { id, description, ...rest } = resource;
    const copiedResourceData = {
      ...rest,
      // Ensure the selections are in the right format for the form:
      organizations: resource.organizations || [],
      typeId: resource.resourceType || null,
      sensitivityLevelId: resource.sensitivityLevel || null,
      expertiseLevelId: resource.expertiseLevel || null,
      tags: resource.tags || [],
    };
    if (typeof onCopyResource === "function") {
      onCopyResource(copiedResourceData);
    } else {
      toast.error("Copy action not available.");
    }
  };

  const renderVideoButton = () => {
    if (
      (resource.typeName?.toLowerCase() === "video" ||
        resource.typeName?.toLowerCase() === "podcast") &&
      resource.videoUrl &&
      resource.timestamps
    ) {
      return (
        <FaPlay
          onClick={(e) => {
            e.stopPropagation();
            setShowVideoModal(true);
          }}
          className={`cursor-pointer z-[2] hover:text-gray-300 ${
            featured ? "text-blue-900" : "text-white"
          }`}
          title="Play Video"
        />
      );
    }
    return null;
  };

  return (
    <div className="relative h-[415px]">
      <div className="bg-gradient-to-br from-white via-white to-gray-50 rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-gray-100 hover:shadow-[0_0_25px_rgba(59,130,246,0.1)] transition-all duration-300 group relative overflow-hidden h-full flex flex-col">
        {/* Subtle glow effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-indigo-50/0 to-purple-50/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Resource Header */}
        <div className="p-4 sm:p-6 border-b border-gray-50/80 relative">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {organizations?.[0]?.imageUrl && (
                  <Image
                    src={organizations[0].imageUrl}
                    alt={organizations[0].name}
                    className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-md shadow-lg"
                    width={32}
                    height={32}
                    unoptimized
                  />
                )}
                <span className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-50/80 text-blue-700 shadow-sm">
                  {resource?.resourceType?.name ?? resource.typeName}
                </span>
                <span
                  className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-medium shadow-sm
                  ${
                    resource.rating?.rating === 0 || !resource.rating?.rating
                      ? "bg-gray-50/80 text-gray-400"
                      : resource.rating?.rating === 1
                      ? "bg-green-50/80 text-green-700"
                      : resource.rating?.rating === 2
                      ? "bg-yellow-50/80 text-yellow-700"
                      : "bg-red-50/80 text-red-700"
                  }`}
                >
                  {resource.rating?.rating === 0 || !resource.rating?.rating
                    ? "Pending - Not Rated"
                    : resource.rating?.rating === 1
                    ? "Low"
                    : resource.rating?.rating === 2
                    ? "Medium"
                    : "High"}{" "}
                  Sensitivity
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200">
                {name}
              </h2>

              <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
                <span className="flex items-center gap-1 sm:gap-2">
                  <FaClock className="w-3 h-3 sm:w-4 sm:h-4" />
                  {new Date(resourceDate).toLocaleDateString()}
                </span>
                {expertiseLevel && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 sm:gap-2">
                      <FaGraduationCap className="w-3 h-3 sm:w-4 sm:h-4" />
                      {expertiseLevel.name} Level
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions - moved to a row for better mobile display */}
            <div className="flex items-center gap-1 self-start mt-2 sm:mt-0">
              {notes && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNotesOpen(!isNotesOpen);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50/80 transition-all duration-200"
                >
                  <FaCommentDots className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              {renderVideoButton()}
              {isAdmin && showCopyLink && (
                <button
                  onClick={handleCopyResource}
                  className="p-2 text-gray-400 hover:text-blue-500 rounded-full hover:bg-blue-50/80 transition-all duration-200"
                >
                  <FaCopy className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Description Section - with flex-1 to take remaining space */}
        <div className="flex-1 px-4 sm:px-6 py-3 sm:py-4 overflow-hidden">
          <div className="relative max-h-[140px] sm:max-h-[150px] overflow-hidden">
            <CustomEditor
              content={description || "No description available"}
              editable={false}
              scrollable={false}
              transparent={true}
              textColor="text-gray-600"
            />
          </div>
        </div>

        {/* Footer Actions - now will stay at bottom and be more visible on mobile */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 mt-auto border-t border-gray-50/80">
          <div className="flex items-center justify-between">
            <button
              onClick={handleButtonClick}
              className="flex items-center gap-1 sm:gap-2 z-0 text-blue-600 hover:text-blue-700 transition-colors bg-blue-50/80 px-3 py-1.5 rounded-md"
            >
              {buttonName || "View Details"}
              <FaArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </button>
            {deleteOption && isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteResource(resource.id);
                }}
                className="text-red-300 hover:text-red-400 transition-colors z-20"
              >
                <FaTrash size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Details Popup */}
      {isDetailsOpen && !notes && (
        <ResourceDetails
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          info={infoDetails}
          resource={resource}
        />
      )}

      {/* Notes Drawer */}
      {notes && isNotesOpen && (
        <div className="absolute inset-0 z-10 flex justify-end overflow-hidden rounded-lg">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/10"
            onClick={() => setIsNotesOpen(false)}
          />

          {/* Drawer */}
          <div className="relative h-full w-full md:w-2/3 bg-white shadow-xl animate-slide-in">
            <div className="h-full p-6 bg-gradient-to-br from-gray-50 to-white">
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Notes for {resource.name}
                  </h3>
                  <button
                    onClick={() => setIsNotesOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaTimes className="text-gray-500" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto prose prose-sm max-w-none">
                  <CustomEditor
                    content={notes}
                    editable={false}
                    scrollable={true}
                    textColor="text-gray-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Icon Popup */}
      {isInfoPopupOpen && (
        <div className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden rounded-lg">
          <div
            className="absolute inset-0 bg-black/10"
            onClick={() => setIsInfoPopupOpen(false)}
          />
          <div className="relative bg-white p-6 rounded-lg shadow-xl w-full max-w-md m-4">
            <button
              onClick={() => setIsInfoPopupOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <FaTimes />
            </button>

            <h3 className="text-xl font-semibold mb-4">Resource Information</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Organization:</span>
                <span className="font-medium">{infoDetails.organization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Approved By:</span>
                <span className="font-medium">{infoDetails.approvedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date Added:</span>
                <span className="font-medium">
                  {new Date(infoDetails.dateAdded).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date Screened:</span>
                <span className="font-medium">
                  {new Date(infoDetails.dateScreened).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add TimestampModal */}
      {showVideoModal && (
        <TimestampModal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          videoUrl={resource.videoUrl}
          timestamps={resource.timestamps}
        />
      )}
    </div>
  );
};

export default ResourceCard;
