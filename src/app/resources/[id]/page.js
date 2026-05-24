"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FaEdit,
  FaInstagram,
  FaLock,
  FaStar,
  FaUser,
  FaExternalLinkAlt,
  FaPaperclip,
  FaPlus,
  FaChevronDown,
  FaEye,
  FaTrash,
  FaMagic,
  FaFileAlt,
  FaLink,
  FaPlay,
  FaGlobe,
  FaFlask,
  FaEnvelope,
  FaImage,
} from "react-icons/fa";
import Modal from "@/app/components/Modal";
import { useGetPublicResource } from "@/app/hooks/usePublicResources";
import Image from "next/image";
import {
  FaInfoCircle,
  FaShieldAlt,
  FaExclamationTriangle,
  FaGraduationCap,
} from "react-icons/fa";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import AddResourceForm from "@/app/components/forms/AddResource";
import { useOrganization } from "@clerk/nextjs";
import { useOrganizations } from "@/app/hooks/useOrganizations";
import {
  useExpertiseLevels,
  useResourceTypes,
  useSensitivityLevels,
  useTags,
} from "@/app/hooks/useMetadata";
import { useUpdateResource } from "@/app/hooks/useResources";
import CustomEditor from "@/app/components/common/CustomEditor";
import { usePublicAuth } from "@/app/hooks/usePublicAuth";
import TimestampModal from "@/app/components/TimestampModal";
import { ResourceSensitivityRating } from "@/app/components/ResourceSensitivityRating";
import { renderSensitivityIcon } from "@/components/cards/ResourceDetailCard";
import ImageModal from "@/app/components/ImageModal";
import {
  getPlayableVideoUrl,
  getVideoType,
  normalizeVideoUrl,
} from "@/app/utils/videoProviders";
import AddAttachmentForm from "@/app/components/forms/AddAttachmentForm";
import AttachmentAICreate from "@/app/components/AttachmentAICreate";
import AttachmentBrowser from "@/app/components/AttachmentBrowser";
import AddLinkCollectionForm from "@/app/components/forms/AddLinkCollectionForm";
import {
  useCreateAttachment,
  useDeleteAttachment,
  useUpdateAttachment,
} from "@/app/hooks/useAttachments";
import { toast } from "react-hot-toast";

// Component for placeholder avatar
const PlaceholderAvatar = ({ name, size = "w-16 h-16" }) => {
  const firstLetter = name?.charAt(0).toUpperCase() || "?";

  // Generate a consistent background color based on the name
  const getBackgroundColor = (str) => {
    const colors = [
      "bg-blue-200",
      "bg-green-200",
      "bg-purple-200",
      "bg-red-200",
      "bg-yellow-200",
      "bg-indigo-200",
      "bg-pink-200",
      "bg-gray-400",
    ];
    const hash =
      str?.split("").reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0) || 0;
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div
      className={`${size} rounded-lg shadow-lg border-2 border-white ${getBackgroundColor(
        name
      )} flex items-center justify-center`}
    >
      <span className="text-gray-700 font-bold text-xl">{firstLetter}</span>
    </div>
  );
};

const stripHtmlTags = (value = "") =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

const getAttachmentHref = (attachment) =>
  attachment?.presignedUrl || attachment?.url || "";

const isVideoAttachment = (attachment) => {
  const href = getAttachmentHref(attachment);
  return (
    attachment?.type === "video" ||
    /\.(mp4|mov|avi|webm|mpeg|mkv)(\?|$)/i.test(href)
  );
};

const getLinkGroupCategoryMeta = (category = "") => {
  switch (category.toLowerCase()) {
    case "video":
      return {
        Icon: FaPlay,
        iconClass: "text-red-600",
        bgClass: "bg-red-50",
        label: "Video",
      };
    case "article":
      return {
        Icon: FaFileAlt,
        iconClass: "text-blue-600",
        bgClass: "bg-blue-50",
        label: "Article",
      };
    case "image":
      return {
        Icon: FaImage,
        iconClass: "text-pink-600",
        bgClass: "bg-pink-50",
        label: "Image",
      };
    case "website":
      return {
        Icon: FaGlobe,
        iconClass: "text-emerald-600",
        bgClass: "bg-emerald-50",
        label: "Website",
      };
    case "email":
      return {
        Icon: FaEnvelope,
        iconClass: "text-amber-600",
        bgClass: "bg-amber-50",
        label: "Email",
      };
    case "document":
      return {
        Icon: FaFileAlt,
        iconClass: "text-violet-600",
        bgClass: "bg-violet-50",
        label: "Document",
      };
    case "trial":
      return {
        Icon: FaFlask,
        iconClass: "text-cyan-600",
        bgClass: "bg-cyan-50",
        label: "Trial",
      };
    default:
      return {
        Icon: FaExternalLinkAlt,
        iconClass: "text-slate-600",
        bgClass: "bg-slate-50",
        label: category || "Link",
      };
  }
};

const ResourceAttachmentsCard = ({
  attachments = [],
  canManage = false,
  viewerUserId = null,
  showAttachmentDropdown = false,
  attachmentDropdownRef,
  onToggleAttachmentDropdown,
  onBrowseAll,
  onOpenUpload,
  onOpenAI,
  onEditAttachment,
  onDeleteAttachment,
}) => {
  const previewAttachments = attachments.slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Attachments</h2>
            <p className="text-sm text-gray-600 mt-1">
              Files, screenshots, and supporting documents
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {attachments.length > 0 && (
              <button
                onClick={onBrowseAll}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <FaEye className="mr-2 text-gray-700" />
                Browse All
              </button>
            )}
            {canManage && (
              <div className="relative" ref={attachmentDropdownRef}>
                <button
                  onClick={onToggleAttachmentDropdown}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50"
                >
                  <FaPlus className="mr-2 text-gray-700" />
                  Add File
                  <FaChevronDown className="ml-2 h-3 w-3" />
                </button>
                {showAttachmentDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <button
                      onClick={onOpenUpload}
                      className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-t-lg border-b border-gray-100 transition-colors"
                    >
                      <FaPaperclip className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">Upload File</div>
                        <div className="text-xs text-gray-500">
                          Add a file manually
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={onOpenAI}
                      className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors"
                    >
                      <FaMagic className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium">AI Extract</div>
                        <div className="text-xs text-gray-500">
                          Create an attachment from text or image
                        </div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {previewAttachments.length > 0 ? (
          <div className="space-y-3">
            {previewAttachments.map((attachment) => {
              const href = getAttachmentHref(attachment);
              const isImage = attachment.type === "image";
              const canModify = attachment.userId === viewerUserId;

              return (
                <div
                  key={attachment.id}
                  className="group rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-white border border-gray-200">
                      {isImage && href ? (
                        <Image
                          src={href}
                          alt={attachment.title || "Attachment"}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                          {isVideoAttachment(attachment) ? (
                            <FaExternalLinkAlt className="w-4 h-4" />
                          ) : (
                            <FaFileAlt className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {attachment.title || "Untitled attachment"}
                          </p>
                          {attachment.description && (
                            <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                              {stripHtmlTags(attachment.description)}
                            </p>
                          )}
                          {href && (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 mt-2"
                            >
                              <FaExternalLinkAlt className="w-3 h-3" />
                              Open attachment
                            </a>
                          )}
                        </div>
                        {canModify && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => onEditAttachment(attachment)}
                              className="p-1 text-gray-400 hover:text-blue-600"
                              title="Edit attachment"
                            >
                              <FaEdit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteAttachment(attachment.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                              title="Delete attachment"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {attachments.length > previewAttachments.length && (
              <button
                onClick={onBrowseAll}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View all {attachments.length} attachments
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border border-gray-200">
                <FaPaperclip className="text-gray-400 text-xl" />
              </div>
            </div>
            <h3 className="text-gray-900 font-medium mb-1">No attachments yet</h3>
            <p className="text-gray-600 text-sm">
              {canManage
                ? "Use Add File to attach documents, screenshots, or supporting materials."
                : "No attachments are available for this resource."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ResourceLinkGroupsCard = ({
  linkGroups = {},
  canManage = false,
  onAddLinkGroup,
}) => {
  const allLinks = Object.entries(linkGroups || {}).flatMap(
    ([category, items]) =>
      (Array.isArray(items) ? items : []).map((item) => ({
        ...item,
        displayCategory: item.category || category,
      }))
  );
  const [showAllLinks, setShowAllLinks] = useState(false);
  const previewLinks = showAllLinks ? allLinks : allLinks.slice(0, 4);
  const hasLinks = allLinks.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <FaExternalLinkAlt className="text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900">Related Links</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Reference articles, videos, websites, and other related sources
          </p>
        </div>
        {canManage && (
          <button
            onClick={onAddLinkGroup}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50"
          >
            <FaPlus className="mr-2 text-gray-700" />
            Add Link
          </button>
        )}
      </div>

      {hasLinks ? (
        <div className="space-y-3">
          {previewLinks.map((item) => {
            const description = stripHtmlTags(item.description || "");
            const { Icon, iconClass, bgClass, label } =
              getLinkGroupCategoryMeta(item.displayCategory);

            return (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 bg-gray-50 p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`h-14 w-14 flex-shrink-0 rounded-lg border border-gray-200 ${bgClass} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${iconClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {item.name || "Untitled link"}
                        </p>
                        {description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                            {description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-600 border border-gray-200">
                            {label}
                          </span>
                          {item.date && (
                            <span className="text-xs text-gray-500">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 shrink-0"
                        >
                          <FaExternalLinkAlt className="w-3 h-3" />
                          Open
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {allLinks.length > previewLinks.length && (
            <button
              onClick={() => setShowAllLinks((prev) => !prev)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {showAllLinks
                ? "Show fewer links"
                : `View all ${allLinks.length} links`}
            </button>
          )}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border border-gray-200">
              <FaLink className="text-gray-400 text-xl" />
            </div>
          </div>
          <h3 className="text-gray-900 font-medium mb-1">No related links yet</h3>
          <p className="text-gray-600 text-sm">
            {canManage
              ? "Use Add Link to connect supporting references to this resource."
              : "No related links are available for this resource."}
          </p>
        </div>
      )}
    </div>
  );
};

const ResourcePage = () => {
  const router = useRouter();
  const { id } = useParams();
  const {
    isAdmin,
    isAdvocate,
    advocateTenants,
    adminTenants,
    isSignedIn,
    isPublicAccess,
    systemUser,
  } = usePublicAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [editingAttachment, setEditingAttachment] = useState(null);
  const [showAttachmentDropdown, setShowAttachmentDropdown] = useState(false);
  const [showAIAttachmentModal, setShowAIAttachmentModal] = useState(false);
  const [showAttachmentBrowser, setShowAttachmentBrowser] = useState(false);
  const [showLinkCollectionModal, setShowLinkCollectionModal] = useState(false);
  const attachmentDropdownRef = useRef(null);
  const { data: organizations = [], isLoading: orgsLoading } =
    useOrganizations();
  const { data: resourceTypes = [], isLoading: resourceTypesLoading } =
    useResourceTypes();

  const { data: sensitivityLevels = [] } = useSensitivityLevels();
  const { data: expertiseLevels = [] } = useExpertiseLevels();
  const { data: tags = [] } = useTags();

  const {
    data: resource,
    isLoading,
    isError,
    error,
    mutate: refreshResource,
  } = useGetPublicResource(id);

  const updateResource = useUpdateResource();
  const { mutateAsync: createAttachmentMutation } = useCreateAttachment();
  const { mutateAsync: updateAttachmentMutation } = useUpdateAttachment();
  const { mutateAsync: deleteAttachmentMutation } = useDeleteAttachment();

  // Add these state variables for the form
  const [formData, setFormData] = useState({
    organizations: [],
    resourceTypes: [],
    sensitivityLevels: [],
    expertiseLevels: [],
    targetAudiences: [],
    tags: [],
  });

  // Add loading state for form data
  const [isFormDataLoading, setIsFormDataLoading] = useState(true);

  const [showTimestamps, setShowTimestamps] = useState(false);

  // Fetch form data when editing is enabled
  useEffect(() => {
    if (isEditing) {
      const fetchFormData = async () => {
        try {
          const [
            organizations,
            resourceTypes,
            sensitivityLevels,
            expertiseLevels,
            tags,
          ] = await Promise.all([
            fetch("/api/business-units").then((res) => res.json()),
            fetch("/api/resource-types").then((res) => res.json()),
            fetch("/api/sensitivity-levels").then((res) => res.json()),
            fetch("/api/expertise-levels").then((res) => res.json()),
            fetch("/api/tags").then((res) => res.json()),
          ]);

          setFormData({
            organizations,
            resourceTypes,
            sensitivityLevels,
            expertiseLevels,
            tags,
          });
          setIsFormDataLoading(false);
        } catch (error) {
          console.error("Error fetching form data:", error);
          setIsFormDataLoading(false);
        }
      };

      fetchFormData();
    }
  }, [isEditing]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showAttachmentDropdown &&
        attachmentDropdownRef.current &&
        !attachmentDropdownRef.current.contains(event.target)
      ) {
        setShowAttachmentDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAttachmentDropdown]);

  const handleEditSubmit = async (data) => {
    try {
      // Check if data is FormData (when image is uploaded)
      if (data instanceof FormData) {
        // Extract the resource data from FormData
        const resourceJson = data.get("resource");
        const imageFile = data.get("image");

        if (resourceJson) {
          // Parse the resource JSON
          const resourceData = JSON.parse(resourceJson);

          // Create update object with image
          await updateResource.mutateAsync({
            id,
            image: imageFile,
            ...resourceData,
          });
        }
      } else {
        // For regular JSON data - clean up the data structure
        const dataToUpdate = {
          name: data.name,
          description: data.description,
          url: data.url,
          videoUrl: data.videoUrl,
          resourceDate: data.resourceDate,
          resourceUpdatedDate: data.resourceUpdatedDate,
          buttonName: data.buttonName,
          timestamps: data.timestamps,
          fullText: data.fullText,
          typeId: data.typeId?.id || data.typeId || null,
          sensitivityLevelId:
            data.sensitivityLevelId?.id || data.sensitivityLevelId || null,
          expertiseLevelId:
            data.expertiseLevelId?.id || data.expertiseLevelId || null,
          organizations:
            data.organizations?.map((org) =>
              typeof org === "object" ? org.id : org
            ) || [],
          tags:
            data.tags?.map((tag) => (typeof tag === "object" ? tag.id : tag)) ||
            [],
        };

        // Remove null/undefined fields that shouldn't be updated
        Object.keys(dataToUpdate).forEach((key) => {
          if (dataToUpdate[key] === undefined) {
            delete dataToUpdate[key];
          }
        });

        await updateResource.mutateAsync({
          id,
          ...dataToUpdate,
        });
      }
      setIsEditing(false);
      refreshResource();
    } catch (error) {
      console.error("Error updating resource:", error);
    }
  };

  const isAdvocateForSelectedTenant =
    Array.isArray(isAdvocate) && isAdvocate.length > 0;

  const canManageResourceChildContent =
    !isPublicAccess &&
    !!resource?.id &&
    (isAdmin ||
      isAdvocateForSelectedTenant ||
      systemUser?.id === resource?.addedByUserId ||
      systemUser?.id === resource?.userId);

  const handleSubmitAttachment = async (attachmentPayload) => {
    try {
      if (editingAttachment && attachmentPayload?.id) {
        await updateAttachmentMutation(attachmentPayload);
      } else {
        await createAttachmentMutation(attachmentPayload);
      }

      setShowAddAttachment(false);
      setEditingAttachment(null);
      await refreshResource();
    } catch (error) {
      console.error("Error saving resource attachment:", error);
      toast.error(error.message || "Failed to save attachment");
    }
  };

  const handleEditAttachment = (attachment) => {
    setEditingAttachment(attachment);
    setShowAddAttachment(true);
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm("Delete this attachment?")) {
      return;
    }

    try {
      await deleteAttachmentMutation({
        attachmentId,
        resourceId: resource.id,
      });
      await refreshResource();
    } catch (error) {
      console.error("Error deleting resource attachment:", error);
      toast.error(error.message || "Failed to delete attachment");
    }
  };

  // Reusing rating components from ResourceCard
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

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-11/12 mx-auto p-8">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push("/resources")}
            className="mb-4 text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-2"
          >
            ← Back to Resources
          </button>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mt-20 opacity-50">
          <LoadingSkeleton lines={5} height="32px" width={[70, 65, 70, 65]} />
          <LoadingSkeleton lines={5} height="32px" width={[70, 65, 70, 65]} />
        </div>
      </div>
    );
  }

  // Show error/not found state
  if (isError) {
    return (
      <div className="w-11/12 mx-auto p-8">
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.push("/resources")}
            className="mb-4 text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-2"
          >
            ← Back to Resources
          </button>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
            <div className="flex flex-col items-center justify-center">
              <FaLock className="text-gray-400 mb-4 w-8 h-8 text-center " />
              <h2 className="text-2xl font-bold text-gray-700 mb-4">
                Resource Not Available
              </h2>
              <p className="text-gray-600 mb-6">
                {!isSignedIn
                  ? "This resource is not publicly available. Only resources from the Kidney Cancer community can be viewed without signing in."
                  : "This resource might not exist or you may not have permission to view it. Please check your tenant selection or contact an administrator."}
              </p>
              <button
                onClick={() => router.push("/resources")}
                className="px-4 py-2 bg-blue-50 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors duration-200"
              >
                Return to Resources
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add a safety check at the start of the main render
  if (!resource?.id) {
    return (
      <div className="w-11/12 mx-auto p-8">{/* ... error content ... */}</div>
    );
  }

  const playableVideoUrl = getPlayableVideoUrl(resource.videoUrl, resource.url);
  const playableVideoType = getVideoType(playableVideoUrl);
  const normalizedPlayableVideoUrl = normalizeVideoUrl(playableVideoUrl);

  return (
    <div className="w-11/12 mx-auto p-8 mt-12">
      <div className="flex justify-between items-center">
        {/* Back Button */}
        <button
          onClick={() => router.push("/resources")}
          className="mb-4 text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-2"
        >
          ← Back to Resources
        </button>
        {(isAdmin || isAdvocateForSelectedTenant) && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white/80 sm:backdrop-blur-sm rounded-md mb-4
                border border-gray-200/80 hover:border-gray-300/80
                shadow-sm hover:shadow transition-all duration-200 
                text-gray-700 hover:text-gray-900
                text-sm font-medium ml-auto"
          >
            <FaEdit className="text-[15px] text-gray-500" />
            <span>Edit Resource</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="rounded-lgg">
        {/* Header Section */}
        <div className="bg-slate-700 text-white rounded-md py-3 sm:py-4 px-4 sm:px-6 mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {resource.organizations?.[0] && (
              <div className="flex justify-center sm:justify-start flex-wrap items-center gap-2 sm:gap-4 rounded-md md:bg-transparent">
                {resource.organizations[0].imageUrl ? (
                  <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 rounded-md bg-white">
                    <Image
                      src={resource.organizations[0].imageUrl}
                      alt={resource.organizations[0].name}
                      fill
                      sizes="(max-width: 640px) 48px, 64px"
                      className="object-contain"
                      priority
                    />
                  </div>
                ) : (
                  <PlaceholderAvatar
                    name={resource.organizations[0].name}
                    size="w-12 h-12 sm:w-16 sm:h-16"
                  />
                )}
              </div>
            )}
            <div className="flex-grow space-y-2">
              <h1 className="text-2xl font-bold">{resource.name}</h1>
              <div className="flex flex-wrap gap-2">
                {resource.tags?.map((tag) => (
                  <span
                    key={tag?.id}
                    className="inline-flex items-center rounded-full bg-blue-500 bg-opacity-30 px-2 py-0.5 text-xs sm:text-sm font-medium text-white ring-1 ring-inset ring-white/10"
                  >
                    {tag?.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto flex justify-center items-center px-4 py-2 bg-blue-500/20 border border-blue-100/40 hover:bg-blue-200/20 text-blue-200 rounded-lg transition-colors duration-200 text-sm font-medium"
              >
                {resource.buttonName || "Access Resource"}
              </a>
            </div>
          </div>
        </div>

        {/* Content Grid with integrated image */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Description (spans 2 columns on lg screens) */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg">
            <div className="p-6 h-full flex flex-col">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Description
              </h2>
              <div className="text-gray-600 flex-1 min-h-0">
                <CustomEditor
                  content={resource.description}
                  editor={false}
                  readOnly={true}
                  height="500px"
                  maxHeight="500px"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Resource Information and Admin Content */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Resource Information
                </h2>

                {/* Resource Image Thumbnail */}
                {resource.imageUrl && (
                  <div className="mb-4">
                    <div
                      className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100 cursor-pointer group"
                      onClick={() => setShowImageModal(true)}
                    >
                      <Image
                        src={resource.imageUrl}
                        alt={resource.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                          <svg
                            className="w-6 h-6 text-gray-700"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4 text-sm text-gray-600">
                  <div className="flex justify-between items-center">
                    <div className="text-base font-semibold">
                      {resource.resourceType?.name}
                    </div>
                    <span className="flex items-center gap-1">
                      <FaGraduationCap className="text-blue-600" />
                      {resource.expertiseLevel?.name}
                    </span>
                  </div>

                  {/* Business Unit Information */}
                  {resource.organizations?.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <p className="font-semibold text-gray-700 mb-2">
                        Business Unit{resource.organizations.length > 1 ? "s" : ""}
                        :
                      </p>
                      <div className="space-y-2">
                        {resource.organizations.map((org, index) => (
                          <div
                            key={org.id || index}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <a
                                href={`/business-units/${org.id}`}
                                className="text-gray-600 hover:text-blue-600 hover:underline transition-colors"
                              >
                                {org.name}
                              </a>
                            </div>
                            {org.imageUrl ? (
                              <div className="relative w-8 h-8 flex-shrink-0 rounded bg-gray-50">
                                <Image
                                  src={org.imageUrl}
                                  alt={org.name}
                                  width={32}
                                  height={32}
                                  className="object-contain"
                                />
                              </div>
                            ) : (
                              <PlaceholderAvatar
                                name={org.name}
                                size="w-8 h-8"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Premium Rating View */}
                  <div className="mt-4 p-4 bg-gradient-to-br from-slate-50 to-white rounded-lg border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">
                      Resource Rating Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Total Ratings:</span>
                        <span className="flex items-center gap-1">
                          <FaUser className="text-blue-300 w-3 h-3" />
                          <span className="font-medium">
                            {resource.rating?.count || 0}
                          </span>
                          <span className="text-slate-500 text-sm">
                            users have rated
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Distress Rating:</span>
                        <span className="flex items-center gap-2">
                          {renderSensitivityIcon(resource.sensitivityLevel)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <ResourceSensitivityRating
                    resourceId={resource.id}
                    initialRating={resource.sensitivityLevel?.value}
                  />

                  {playableVideoUrl &&
                    (playableVideoType === "instagram" ? (
                      <a
                        href={normalizedPlayableVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-pink-500/20 bg-pink-500/10 text-pink-600 transition-colors duration-200 hover:border-pink-500/40 hover:bg-pink-500/20"
                        title="Open on Instagram"
                        aria-label="Open on Instagram"
                      >
                        <FaInstagram className="h-5 w-5" />
                      </a>
                    ) : (
                      <button
                        onClick={() => setShowTimestamps(true)}
                        className="mb-4 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors duration-200 border border-blue-500/20 hover:border-blue-500/40 text-blue-600"
                      >
                        Watch Video
                      </button>
                    ))}

                  <div className="pt-4 space-y-2">
                    <p>
                      <span className="font-semibold">Date Added:</span>{" "}
                      {resource.resourceDate
                        ? new Date(resource.resourceDate).toLocaleDateString(
                            undefined,
                            {
                              timeZone: "UTC",
                              year: "numeric",
                              month: "numeric",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </p>
                    <p>
                      <span className="font-semibold">Last Updated:</span>{" "}
                      {resource.resourceUpdatedDate
                        ? new Date(
                            resource.resourceUpdatedDate
                          ).toLocaleDateString(undefined, {
                            timeZone: "UTC",
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                          })
                        : "N/A"}
                    </p>
                    {/* <p>
                    <span className="font-semibold">
                      Registration Required:
                    </span>{" "}
                    {resource.registrationRequired ? "Yes" : "No"}
                  </p> */}
                  </div>
                </div>
              </div>
            </div>

            {(canManageResourceChildContent ||
              (resource.attachments?.length || 0) > 0) && (
              <ResourceAttachmentsCard
                attachments={resource.attachments || []}
                canManage={canManageResourceChildContent}
                viewerUserId={systemUser?.id}
                showAttachmentDropdown={showAttachmentDropdown}
                attachmentDropdownRef={attachmentDropdownRef}
                onToggleAttachmentDropdown={() =>
                  setShowAttachmentDropdown((prev) => !prev)
                }
                onBrowseAll={() => setShowAttachmentBrowser(true)}
                onOpenUpload={() => {
                  setShowAttachmentDropdown(false);
                  setShowAddAttachment(true);
                }}
                onOpenAI={() => {
                  setShowAttachmentDropdown(false);
                  setShowAIAttachmentModal(true);
                }}
                onEditAttachment={handleEditAttachment}
                onDeleteAttachment={handleDeleteAttachment}
              />
            )}

            {(canManageResourceChildContent ||
              Object.values(resource.linkGroups || {}).some(
                (items) => Array.isArray(items) && items.length > 0
              )) && (
              <ResourceLinkGroupsCard
                linkGroups={resource.linkGroups || {}}
                canManage={canManageResourceChildContent}
                onAddLinkGroup={() => {
                  setShowLinkCollectionModal(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {isEditing && (
        <Modal
          isOpen={isEditing}
          onClose={() => setIsEditing(false)}
          maxWidth="lg:w-1/2 w-full"
        >
          <AddResourceForm
            organizations={organizations}
            onSubmit={handleEditSubmit}
            onClose={() => setIsEditing(false)}
            resourceTypes={resourceTypes}
            sensitivityLevels={sensitivityLevels}
            expertiseLevels={expertiseLevels}
            tags={tags}
            advocateTenants={advocateTenants}
            adminTenants={adminTenants}
            isAdmin={isAdmin}
            initialValues={{
              ...resource,
              organizations: resource.organizations || [],
              typeId: resource.resourceType || null,
              sensitivityLevelId: resource.sensitivityLevel || null,
              expertiseLevelId: resource.expertiseLevel || null,
              tags: resource.tags || [],
              imageUrl: resource.imageUrl || null,
            }}
          />
        </Modal>
      )}

      {(showAddAttachment || editingAttachment) && (
        <Modal
          isOpen={showAddAttachment || !!editingAttachment}
          onClose={() => {
            setShowAddAttachment(false);
            setEditingAttachment(null);
          }}
        >
          <AddAttachmentForm
            resourceId={resource.id}
            onSubmit={handleSubmitAttachment}
            onClose={() => {
              setShowAddAttachment(false);
              setEditingAttachment(null);
            }}
            initialValues={editingAttachment}
            isEditing={!!editingAttachment}
          />
        </Modal>
      )}

      {showAIAttachmentModal && (
        <Modal
          isOpen={showAIAttachmentModal}
          onClose={() => setShowAIAttachmentModal(false)}
          maxWidth="max-w-3xl"
        >
          <div className="p-4">
            <AttachmentAICreate
              onClose={() => setShowAIAttachmentModal(false)}
              onAttachmentCreated={async () => {
                await refreshResource();
              }}
              resourceId={resource.id}
            />
          </div>
        </Modal>
      )}

      {showLinkCollectionModal && (
        <Modal
          isOpen={showLinkCollectionModal}
          onClose={() => setShowLinkCollectionModal(false)}
        >
          <AddLinkCollectionForm
            onClose={() => setShowLinkCollectionModal(false)}
            onSaved={refreshResource}
            isAdmin={canManageResourceChildContent}
            linkingId={resource.id}
            linkingType="resource"
          />
        </Modal>
      )}

      {showAttachmentBrowser && (
        <Modal
          isOpen={showAttachmentBrowser}
          onClose={() => setShowAttachmentBrowser(false)}
          maxWidth="max-w-7xl"
        >
          <AttachmentBrowser
            attachments={resource.attachments || []}
            onClose={() => setShowAttachmentBrowser(false)}
            onDelete={handleDeleteAttachment}
            onEdit={handleEditAttachment}
            isAdmin={false}
            systemUserId={systemUser?.id}
            title="Resource Attachments"
          />
        </Modal>
      )}

      {/* Timestamp Modal with video viewer */}
      <TimestampModal
        isOpen={showTimestamps}
        onClose={() => setShowTimestamps(false)}
        timestamps={resource.timestamps}
        videoUrl={playableVideoUrl}
      />

      {/* Image Modal for full-size viewing */}
      <ImageModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        imageUrl={resource?.imageUrl}
        alt={resource?.name || "Resource Image"}
      />
    </div>
  );
};

export default ResourcePage;
