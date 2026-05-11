import { useState, useEffect } from "react";
import Modal from "@/app/components/Modal";
import {
  FaCopy,
  FaEnvelope,
  FaCalendarAlt,
  FaBookOpen,
  FaGlobe,
  FaUsers,
} from "react-icons/fa";
import {
  useCreateSharedLink,
  useToggleCollectionPublicJsonSharing,
  useToggleExternalLinkPublicJsonSharing,
} from "@/app/hooks/useSharedLinks";
import {
  useGetCollectionById,
  useGetExternalLinkById,
} from "@/app/hooks/useCollections";
import { useContextAuth } from "@/app/context/authContext";
import InputField from "@/app/components/inputs/InputField";
import EmailChips from "@/app/components/inputs/EmailChips";
import toast from "react-hot-toast";

const DIRECT_SHAREABLE_VISIBILITIES = ["public", "unlisted"];

const ShareContentModal = ({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentName,
  showGuide = false,
  publicJsonEnabled = false,
}) => {
  const { userId, isAdmin } = useContextAuth();
  const [expiryDays, setExpiryDays] = useState(30);
  const [emailList, setEmailList] = useState("");
  const [description, setDescription] = useState("");
  const [sharedLink, setSharedLink] = useState(null);
  const [enableGuideView, setEnableGuideView] = useState(false);

  // Only fetch collection data if this is a collection
  const shouldFetchCollection = contentType === "collection";
  const { data: collection, isLoading: isLoadingCollection } = useGetCollectionById(
    shouldFetchCollection ? contentId : null
  );

  // Always fetch external link data so the direct-link flow can validate visibility and ownership.
  const shouldFetchExternalLink = contentType === "external_link";
  const { data: externalLink, isLoading: isLoadingExternalLink } = useGetExternalLinkById(
    shouldFetchExternalLink ? contentId : null
  );

  const { mutate: createLink, isLoading: isCreatingSharedLink } =
    useCreateSharedLink();
  const collectionPublicSharing = useToggleCollectionPublicJsonSharing();
  const externalLinkPublicSharing = useToggleExternalLinkPublicJsonSharing();

  const collectionType = collection?.type;
  const resolvedVisibility =
    contentType === "collection" ? collection?.visibility : externalLink?.visibility;
  const resolvedPublicJsonEnabled =
    contentType === "collection"
      ? collection?.publicJsonEnabled === true
      : publicJsonEnabled || externalLink?.publicJsonEnabled === true;
  const isVisibilityEligibleForDirectShare =
    DIRECT_SHAREABLE_VISIBILITIES.includes(resolvedVisibility);
  const isExternalCollection =
    contentType === "collection" && collectionType === "external";
  const isResourceCollection =
    contentType === "collection" && collectionType === "resource";
  const isDirectShareCandidate =
    (contentType === "collection" &&
      ["resource", "external"].includes(collectionType)) ||
    contentType === "external_link";
  const isDirectShareFlow =
    isDirectShareCandidate && isVisibilityEligibleForDirectShare;
  const isDirectShareable = isDirectShareFlow && resolvedPublicJsonEnabled;
  const isLoadingContent = isLoadingCollection || isLoadingExternalLink;
  const isUpdatingDirectShare =
    collectionPublicSharing.isLoading || externalLinkPublicSharing.isLoading;
  const canEnableDirectShare =
    contentType === "collection"
      ? isAdmin || collection?.userId === userId
      : isAdmin || externalLink?.addedByUserId === userId;
  const directShareTypeLabel = isResourceCollection
    ? "Resource Collection"
    : isExternalCollection
    ? "External Link Collection"
    : "External Link";
  const directShareContentLabel = isExternalCollection
    ? "curated links and public details"
    : isResourceCollection
    ? "curated resources"
    : "public details";
  const publicUrl =
    isDirectShareFlow && typeof window !== "undefined"
      ? contentType === "collection"
        ? `${window.location.origin}/public/collections/${contentId}`
        : `${window.location.origin}/public/external-links/${contentId}`
      : null;
  const isShareActionDisabled =
    isLoadingContent ||
    isCreatingSharedLink ||
    isUpdatingDirectShare ||
    (isDirectShareFlow && !isDirectShareable && !canEnableDirectShare);

  useEffect(() => {
    if (isDirectShareable && publicUrl) {
      setSharedLink({
        shareUrl: publicUrl,
        expiresAt: null,
        isPublic: true,
      });
    }
  }, [isDirectShareable, publicUrl]);

  const handleEnableDirectShare = async () => {
    if (!publicUrl) {
      toast.error("Share link is not ready yet");
      return;
    }

    if (!canEnableDirectShare) {
      toast.error("Only the owner or an admin can enable this share link");
      return;
    }

    try {
      if (contentType === "collection") {
        await collectionPublicSharing.mutateAsync({
          collectionId: contentId,
          enabled: true,
        });
      } else {
        await externalLinkPublicSharing.mutateAsync({
          externalLinkId: contentId,
          enabled: true,
        });
      }

      setSharedLink({
        shareUrl: publicUrl,
        expiresAt: null,
        isPublic: true,
      });
    } catch (error) {
      toast.error(error.message || "Failed to enable direct sharing");
    }
  };

  const handleShare = async () => {
    if (isDirectShareFlow) {
      if (isDirectShareable && publicUrl) {
        setSharedLink({
          shareUrl: publicUrl,
          expiresAt: null,
          isPublic: true,
        });
      } else {
        await handleEnableDirectShare();
      }
      return;
    }

    createLink(
      {
        type: contentType,
        id: contentId,
        expiryDays: parseInt(expiryDays),
        emailList: emailList.trim() || undefined,
        description: description || undefined,
        showGuideView: showGuide && enableGuideView,
      },
      {
        onSuccess: (data) => {
          // Create formatted URL with guide view if enabled
          if (showGuide && enableGuideView) {
            try {
              const urlObj = new URL(data.shareUrl);
              urlObj.searchParams.set("view", "guide");
              data.shareUrl = urlObj.toString();
            } catch (error) {
              console.error("Error formatting URL:", error);
              // Fallback approach if URL constructor fails
              if (data.shareUrl.includes("?")) {
                data.shareUrl = `${data.shareUrl}&view=guide`;
              } else {
                data.shareUrl = `${data.shareUrl}?view=guide`;
              }
            }
          }
          setSharedLink(data);
        },
      }
    );
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 w-11/12 mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-5">
          Share {contentName || contentType}
        </h2>

        {!sharedLink ? (
          <>
            {isDirectShareFlow ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
                  <p className="font-medium text-blue-900">
                    Anyone with this link can view the shared page.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Content Type:</span>
                    <span className="font-medium text-gray-800">
                      {directShareTypeLabel}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-gray-500">Visible Content:</span>
                    <span className="font-medium text-gray-800">
                      {directShareContentLabel}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between">
                    <span className="text-gray-500">Share Access:</span>
                    <span className="font-medium text-gray-800">
                      {isDirectShareable
                        ? "Ready"
                        : canEnableDirectShare
                        ? "Needs one-time enable"
                        : "Owner or admin required"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="w-full flex flex-row gap-4">
                  <div className="mb-4 flex-1">
                    <label className="flex items-center  text-sm font-medium text-gray-700 mb-1">
                      <FaCalendarAlt className="text-gray-400 mr-2" />
                      Expiry (days)
                    </label>
                    <div className="flex items-center">
                      <InputField
                        type="number"
                        min="1"
                        max="365"
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="mb-4 flex-1">
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                      <FaEnvelope className="text-gray-400 mr-2" />
                      Authorized Emails (optional)
                    </label>
                    <EmailChips
                      value={emailList}
                      onChange={setEmailList}
                      className="w-full"
                      placeholder="user1@example.com, user2@example.com, user3@example.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter email addresses separated by commas. Users with
                      these emails will have access to non-private content.
                      Leave empty to allow public access only.
                    </p>
                  </div>
                </div>

                {showGuide && (
                  <div className="mb-4">
                    <div className="flex items-center">
                      <input
                        id="guideViewToggle"
                        type="checkbox"
                        checked={enableGuideView}
                        onChange={() => setEnableGuideView(!enableGuideView)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="guideViewToggle"
                        className="ml-2 flex items-center text-sm font-medium text-gray-700 cursor-pointer"
                      >
                        <FaBookOpen className="text-blue-500 mr-2" />
                        Enable Guide View for shared link
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      Recipients will see the content in an interactive guide
                      format with step-by-step navigation.
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <InputField
                    type="textarea"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows="5"
                    placeholder="Add a note about this shared content"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={isShareActionDisabled}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
              >
                {isDirectShareFlow
                  ? isLoadingContent
                    ? "Loading..."
                    : isUpdatingDirectShare
                    ? "Enabling..."
                    : isDirectShareable
                    ? "Get Share Link"
                    : canEnableDirectShare
                    ? "Enable Share Link"
                    : "Share Unavailable"
                  : isCreatingSharedLink
                  ? "Creating..."
                  : "Create Share Link"}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 shadow-sm">
              <div className="flex items-center mb-2">
                {sharedLink.isPublic ? (
                  <>
                    <FaGlobe className="text-blue-600 mr-2" />
                    <p className="text-sm text-blue-700 font-medium">
                      {directShareTypeLabel} link ready!
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-blue-700">
                    Your link has been created successfully!
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white border border-blue-200 rounded-md px-3 py-2 text-sm text-gray-600 truncate shadow-sm">
                  {sharedLink.shareUrl}
                </div>
                <button
                  onClick={() => copyToClipboard(sharedLink.shareUrl)}
                  className="p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  aria-label="Copy to clipboard"
                >
                  <FaCopy />
                </button>
              </div>
            </div>

            <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
              {sharedLink.isPublic ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Access:</span>
                    <span className="text-gray-700 font-medium flex items-center">
                      <FaUsers className="text-green-500 mr-1" />
                      Anyone with the link
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Content Type:</span>
                    <span className="text-gray-700 font-medium">
                      {directShareTypeLabel}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Indexing:</span>
                    <span className="text-gray-700 font-medium">
                      No-index requested
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Expires on:</span>
                    <span className="text-gray-700 font-medium">
                      {new Date(sharedLink.expiresAt).toLocaleDateString()}
                    </span>
                  </div>

                  {emailList.trim() && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Shared with:</span>
                      <span className="text-gray-700 font-medium">
                        {emailList.trim()}
                      </span>
                    </div>
                  )}

                  {showGuide && enableGuideView && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Guide View:</span>
                      <span className="text-gray-700 font-medium flex items-center">
                        <FaBookOpen className="text-blue-500 mr-1" />
                        Enabled
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end mt-2">
              <button
                onClick={onClose}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareContentModal;
