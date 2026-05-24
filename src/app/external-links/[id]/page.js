"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
  FaChevronUp,
  FaChevronDown,
  FaBookOpen,
  FaUsers,
} from "react-icons/fa";
import Modal from "@/app/components/Modal";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import AddExternalLinkForm from "@/app/components/forms/AddExternalLinkForm";
import RoleSelectionModal from "@/app/components/RoleSelectionModal";
import PublicJsonSharingControl from "@/app/components/PublicJsonSharingControl";
import { useContextAuth } from "@/app/context/authContext";
import { useUser } from "@clerk/nextjs";
import {
  useGetExternalLinkById,
  useGetExternalLinkNotations,
  useAddExternalLinkNotation,
  useDeleteNotation,
  useUpdateExternalLinkInCollection,
  useUpdateNotation,
  useGetExternalLinkCollaborators,
  useInviteCollaborator,
} from "@/app/hooks/useCollections";

import {
  useCreateAttachment,
  useDeleteAttachment,
} from "@/app/hooks/useAttachments";

import { toast } from "react-hot-toast";
import TimestampModal from "@/app/components/TimestampModal";
import ExternalLinkDetails from "@/app/components/ExternalLinkDetails";
import {
  useGetSharedLinksByTypeAndId,
  useRevokeSharedLink,
  useGetExternalLinkPublicSharingStatus,
} from "@/app/hooks/useSharedLinks";
import { useGetPinnedItems } from "@/app/hooks/usePinned";
import AddLinkCollectionForm from "@/app/components/forms/AddLinkCollectionForm";
import GuideView from "@/app/components/GuideView";
import CollaboratorInviteModal from "@/app/components/CollaboratorInviteModal";
import { useQueryClient } from "@tanstack/react-query";
import { useAssociatedSocialMediaAccounts } from "@/app/hooks/useSocialMedia";
import SocialMediaModal from "@/app/components/social-media/SocialMediaModal";

const ExternalLinkPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const highlightNotationId = searchParams.get("highlightNotation");
  const contextCollectionId = searchParams.get("collectionId") || "";
  const {
    isAdmin,
    isAdvocate,
    systemUser,
    isLoaded: authIsLoaded,
  } = useContextAuth();
  const { user } = useUser();
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSharedLinks, setShowSharedLinks] = useState(false);
  const [showLinkCollectionModal, setShowLinkCollectionModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Public JSON sharing state
  const [showPublicJsonModal, setShowPublicJsonModal] = useState(false);

  // Social media state
  const [showSocialMediaModal, setShowSocialMediaModal] = useState(false);

  // Guide view state
  const [showGuideView, setShowGuideView] = useState(false);
  const [currentGuideStep, setCurrentGuideStep] = useState(0);

  const {
    data: externalLink,
    isLoading: linkLoading,
    refetch: refetchExternalLink,
  } = useGetExternalLinkById(id);
  const { data: sharedLinks, isLoading: isLoadingSharedLinks } =
    useGetSharedLinksByTypeAndId("external_link", id);
  const { data: collaborators, isLoading: isLoadingCollaborators } =
    useGetExternalLinkCollaborators(id);

  // Get public JSON sharing status
  const { data: publicSharingStatus } = useGetExternalLinkPublicSharingStatus([
    id,
  ]);

  // Get pinned items
  const { data: pinnedItems } = useGetPinnedItems();

  // Get associated social media accounts
  const {
    data: socialMediaAssociations = [],
    isLoading: isLoadingSocialMedia,
  } = useAssociatedSocialMediaAccounts(id, "collection_external_link");

  // Extract social media accounts from associations
  const socialMediaAccounts = socialMediaAssociations
    .map((association) => association.account)
    .filter(Boolean);

  const { mutate: revokeLink } = useRevokeSharedLink();
  const { mutate: uploadAttachment } = useCreateAttachment();
  const { mutate: deleteNotation } = useDeleteNotation();
  const addNotation = useAddExternalLinkNotation();
  const { mutate: updateExternalLink } = useUpdateExternalLinkInCollection();
  const { mutate: updateNotation } = useUpdateNotation();
  const { mutate: deleteAttachment } = useDeleteAttachment();

  // Check if guide view is requested in the URL
  useEffect(() => {
    const viewMode = searchParams.get("view");
    if (viewMode === "guide") {
      setShowGuideView(true);
    }
  }, [searchParams]);

  // Check if user has completed role setup
  useEffect(() => {
    if (authIsLoaded && user && !user.publicMetadata.roles) {
      setShowRoleModal(true);
    }
  }, [authIsLoaded, user, systemUser]);

  // Filter shared links for this specific external link
  const filteredSharedLinks =
    sharedLinks?.filter(
      (link) => link.linkType === "external_link" && link.linkId === id
    ) || [];

  // Function to construct guide steps from external link data
  const constructGuideSteps = () => {
    if (!externalLink) return [];

    // If the external link is already in guide steps format, use that
    if (externalLink.guideSteps) return externalLink.guideSteps;

    // Otherwise construct a single-step guide from the external link
    return [
      {
        id: externalLink.id,
        name: externalLink.name,
        description: externalLink.description,
        url: externalLink.url,
        date: externalLink.date,
        status: externalLink.status,
        attachments: externalLink.attachments || [],
        notations: externalLink.notations || [],
      },
    ];
  };

  const toggleGuideView = () => {
    setShowGuideView(!showGuideView);
    // Update URL when changing view mode
    const url = new URL(window.location);
    if (!showGuideView) {
      url.searchParams.set("view", "guide");
    } else {
      url.searchParams.delete("view");
    }
    window.history.replaceState({}, "", url);
  };

  const handleRevokeLink = (linkId) => {
    if (window.confirm("Are you sure you want to revoke this shared link?")) {
      revokeLink(linkId);
    }
  };

  // Get media-related helper functions
  const getExternalLinkAttachments = (link) => {
    return (link?.attachments || []).filter((attachment) =>
      attachment.type?.toLowerCase().includes("image")
    );
  };

  const isVideoUrl = (url) => {
    return Boolean(
      url?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/) ||
        url?.includes("zoom.us")
    );
  };

  if (linkLoading || !authIsLoaded) {
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

  const guideSteps = constructGuideSteps();

  return (
    <div className="container mx-auto md:px-4 py-8 w-full md:w-11/12">
      {showGuideView ? (
        <GuideView
          collection={{
            name: externalLink.name,
            // Add other props needed by GuideView
          }}
          guideSteps={guideSteps}
          currentGuideStep={currentGuideStep}
          setCurrentGuideStep={setCurrentGuideStep}
          toggleGuideView={toggleGuideView}
          getExternalLinkAttachments={getExternalLinkAttachments}
          isVideoUrl={isVideoUrl}
          setCurrentGuideImages={() => {}}
          setShowImageBrowser={() => {}}
          setCurrentGuideVideoUrl={() => {}}
          setShowGuideTimestamps={() => {}}
          showNotesSection={true}
          setShowNotesSection={() => {}}
          showAttachmentsSection={true}
          setShowAttachmentsSection={() => {}}
          setCurrentGuideFiles={() => {}}
          setShowFilesBrowser={() => {}}
        />
      ) : (
        <>
          {/* Public JSON Sharing Control - Only for Admins */}
          {isAdmin && showPublicJsonModal && (
            <div className="mb-6 rounded-lg border border-slate-300 shadow-lg">
              <div className="p-6 border-t border-slate-200">
                <PublicJsonSharingControl
                  type="external_link"
                  id={id}
                  isEnabled={
                    publicSharingStatus?.externalLinks?.[0]
                      ?.publicJsonEnabled || false
                  }
                  onToggle={(enabled) => {
                    // Refresh external link data to get updated status
                    refetchExternalLink();
                    // Refresh public sharing status
                    queryClient.invalidateQueries({
                      queryKey: ["externalLinkPublicSharingStatus", [id]],
                    });
                  }}
                />
              </div>
            </div>
          )}

          <ExternalLinkDetails
            externalLink={externalLink}
            isAdmin={isAdmin}
            isAdvocate={isAdvocate}
            systemUser={systemUser}
            router={router}
            uploadAttachment={uploadAttachment}
            deleteNotation={deleteNotation}
            addNotation={addNotation}
            updateExternalLink={updateExternalLink}
            updateNotation={updateNotation}
            deleteAttachment={deleteAttachment}
            collaborators={collaborators}
            isLoadingCollaborators={isLoadingCollaborators}
            pinnedItems={pinnedItems}
            refetchExternalLink={refetchExternalLink}
            highlightNotationId={highlightNotationId}
            contextCollectionId={contextCollectionId}
            publicJsonEnabled={
              publicSharingStatus?.externalLinks?.[0]?.publicJsonEnabled ||
              false
            }
            onShowPublicJsonModal={() =>
              setShowPublicJsonModal(!showPublicJsonModal)
            }
          />

          {isAdmin && (
            <div className="flex justify-center gap-2 mb-4">
              <button
                onClick={() => setShowSharedLinks(!showSharedLinks)}
                className={`px-4 py-2 bg-gray-400 ${
                  showSharedLinks ? "" : "mb-6"
                } text-white rounded-md hover:bg-gray-600 transition-colors flex items-center shadow-md`}
              >
                {showSharedLinks ? (
                  <>
                    <FaChevronUp className="mr-2" /> Hide Shared Links
                  </>
                ) : (
                  <>
                    <FaChevronDown className="mr-2" /> Show Shared Links (
                    {filteredSharedLinks.length})
                  </>
                )}
              </button>
            </div>
          )}

          {isAdmin && showSharedLinks && (
            <div className="mt-4 bg-white rounded-lg shadow-md p-6 w-11/12 mx-auto">
              {isLoadingSharedLinks ? (
                <div className="py-4 text-center">Loading shared links...</div>
              ) : filteredSharedLinks.length === 0 ? (
                <div className="py-4 text-center text-gray-500">
                  No shared links for this resource
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="md:hidden">
                    {/* Mobile view - card layout */}
                    {filteredSharedLinks.map((link) => (
                      <div
                        key={link.id}
                        className={`mb-4 p-3 rounded-lg border ${
                          !link.isActive ? "bg-gray-100" : "bg-white"
                        }`}
                      >
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <span className="text-xs font-medium text-gray-500">
                              Created:
                            </span>
                            <p className="text-sm">
                              {new Date(link.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">
                              Expires:
                            </span>
                            <p className="text-sm">
                              {link.expiresAt
                                ? new Date(link.expiresAt).toLocaleDateString()
                                : "Never"}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">
                              Shared With:
                            </span>
                            <p className="text-sm">
                              {link.visibility || "Anyone with link"}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">
                              Views:
                            </span>
                            <p className="text-sm">{link.viewCount || 0}</p>
                          </div>
                        </div>
                        {link.sharedWithEmail && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-500">
                              Email:
                            </span>
                            <p className="text-sm">{link.sharedWithEmail}</p>
                          </div>
                        )}
                        {link.description && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-500">
                              Description:
                            </span>
                            <p className="text-sm">{link.description}</p>
                          </div>
                        )}
                        {link.showGuideView && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-500 flex items-center">
                              <FaBookOpen className="mr-1 text-green-600" />{" "}
                              Guide View:
                            </span>
                            <p className="text-sm text-green-600">Enabled</p>
                          </div>
                        )}
                        <div className="mt-3 flex gap-2">
                          {link.isActive ? (
                            <>
                              <button
                                onClick={() =>
                                  navigator.clipboard
                                    .writeText(link.shareUrl)
                                    .then(() => toast.success("Link copied!"))
                                }
                                className="flex-1 text-center py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                              >
                                Copy Link
                              </button>
                              <button
                                onClick={() => handleRevokeLink(link.id)}
                                className="flex-1 text-center py-1.5 bg-red-100 text-red-500 rounded-md hover:bg-red-200 transition-colors text-sm"
                              >
                                <FaTimes className="inline mr-1 text-xs" />{" "}
                                Revoke
                              </button>
                            </>
                          ) : (
                            <span className="w-full text-center py-1.5 rounded-md text-sm font-medium bg-gray-200 text-gray-700">
                              <FaLock className="inline mr-1.5" /> Revoked
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
      {/* 
      <RoleSelectionModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
      /> */}

      {/* Social Media Modal */}
      <SocialMediaModal
        isOpen={showSocialMediaModal}
        onClose={() => setShowSocialMediaModal(false)}
        title="Social Media Accounts"
        entityName={externalLink?.name}
        accounts={socialMediaAccounts}
        loading={isLoadingSocialMedia}
      />
    </div>
  );
};

export default ExternalLinkPage;
