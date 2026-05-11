"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useGetUserSharedLinks,
  useRevokeSharedLink,
  useUpdateSharedLink,
} from "@/app/hooks/useSharedLinks";
import {
  FaLink,
  FaTrash,
  FaEye,
  FaCalendarAlt,
  FaEnvelope,
  FaCopy,
  FaEdit,
  FaExternalLinkAlt,
  FaTimes,
  FaChevronLeft,
  FaLock,
  FaHome,
  FaBookOpen,
} from "react-icons/fa";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import toast from "react-hot-toast";
import Modal from "@/app/components/Modal";
import InputField from "@/app/components/inputs/InputField";
import GuideView from "@/app/components/GuideView";

export default function SharedLinksPage() {
  const router = useRouter();
  const { data: sharedLinks, isLoading, isError } = useGetUserSharedLinks();
  const { mutate: revokeLink } = useRevokeSharedLink();
  const { mutate: updateLink } = useUpdateSharedLink();

  // Add searchParams parsing
  const [searchParams, setSearchParams] = useState(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams();
  });

  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedLink, setSelectedLink] = useState(null);
  const [newExpiryDays, setNewExpiryDays] = useState(30);

  // Guide view state
  const [showGuideView, setShowGuideView] = useState(false);
  const [currentGuideStep, setCurrentGuideStep] = useState(0);
  const [guideSteps, setGuideSteps] = useState([]);

  // Check URL for view=guide parameter on component mount
  useEffect(() => {
    const viewMode = searchParams.get("view");
    const linkId = searchParams.get("linkId");

    if (viewMode === "guide" && linkId && sharedLinks) {
      const link = sharedLinks.find((l) => l.id === linkId);
      if (link && link.showGuideView) {
        openGuideView(link);
      }
    }
  }, [sharedLinks, searchParams]);

  // Update URL when guide view is toggled
  useEffect(() => {
    if (typeof window !== "undefined") {
      const newUrl = new URL(window.location);

      if (showGuideView && selectedLink) {
        newUrl.searchParams.set("view", "guide");
        newUrl.searchParams.set("linkId", selectedLink.id);
      } else {
        newUrl.searchParams.delete("view");
        newUrl.searchParams.delete("linkId");
      }

      window.history.replaceState({}, "", newUrl);
    }
  }, [showGuideView, selectedLink]);

  const handleRevokeLink = () => {
    if (!selectedLink) return;

    revokeLink(selectedLink.id, {
      onSuccess: () => {
        setShowRevokeModal(false);
        setSelectedLink(null);
        toast.success("Link revoked successfully");
      },
    });
  };

  const handleUpdateLink = () => {
    if (!selectedLink) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(newExpiryDays));

    updateLink(
      {
        linkId: selectedLink.id,
        updates: { expiresAt },
      },
      {
        onSuccess: () => {
          setShowUpdateModal(false);
          setSelectedLink(null);
          toast.success("Link expiry updated successfully");
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

  // New function to handle opening guide view
  const openGuideView = (link) => {
    if (!link || !link.linkContent) return;

    setSelectedLink(link);
    // Convert the link content to guide steps format
    const content = link.linkContent;

    // This is a placeholder - actual implementation depends on your data structure
    // The structure should match what GuideView component expects
    if (Array.isArray(content)) {
      setGuideSteps(content);
    } else if (content.steps) {
      setGuideSteps(content.steps);
    } else {
      // If the content is not in the right format, try to convert it
      const steps = [
        {
          id: link.id,
          name: link.description || "Shared Content",
          url: link.url,
          attachments: content.attachments || [],
          description: content.description || "",
          notes: content.notes || "",
        },
      ];
      setGuideSteps(steps);
    }

    setCurrentGuideStep(0);
    setShowGuideView(true);
  };

  // Function to handle when the user is done with guide view
  const toggleGuideView = () => {
    setShowGuideView(!showGuideView);
  };

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-2 gap-6 mt-20 opacity-50">
        <LoadingSkeleton lines={5} height="32px" width={[70, 65, 70, 65]} />
        <LoadingSkeleton lines={5} height="32px" width={[70, 65, 70, 65]} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8 w-full md:w-11/12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">
            Failed to load shared links. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 w-full md:w-11/12">
      {/* Enterprise Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <button
                onClick={() => router.push("/")}
                className="text-gray-900 hover:text-gray-900 flex items-center gap-2"
              >
                <FaChevronLeft className="text-sm" />
                <span className="hidden sm:inline">Back</span>
              </button>

              {/* Breadcrumb */}
              <nav className="hidden md:flex items-center space-x-2 text-sm">
                <FaHome className="text-gray-600" />
                <span className="text-gray-600">/</span>
                <span className="text-gray-900 font-medium">Shared Links</span>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {showGuideView && selectedLink ? (
        <div className="mt-4 mb-4">
          <button
            onClick={toggleGuideView}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-100 mb-4"
          >
            <FaChevronLeft /> Back to Shared Links
          </button>
          <GuideView
            collection={{
              name: selectedLink.description || "Shared Content",
              // Add other props needed by GuideView
            }}
            guideSteps={guideSteps}
            currentGuideStep={currentGuideStep}
            setCurrentGuideStep={setCurrentGuideStep}
            toggleGuideView={toggleGuideView}
            getExternalLinkAttachments={(step) =>
              step.attachments?.filter((a) => a.type?.includes("image")) || []
            }
            isVideoUrl={(url) =>
              url?.includes("youtube") || url?.includes("vimeo")
            }
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
        </div>
      ) : (
        <>
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
            {/* Resource Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6 sm:mb-8">
              <div className="p-4 sm:p-6">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                  Manage Shared Links
                </h1>
                <p className="text-gray-600">
                  View and manage all your shared links in one place
                </p>
              </div>
            </div>

            {/* Shared Links Cards */}
            {sharedLinks && sharedLinks.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="overflow-x-auto">
                  {/* Mobile view - card layout */}
                  <div className="md:hidden">
                    {sharedLinks.map((link) => (
                      <div
                        key={link.id}
                        className={`mb-4 p-3 rounded-lg border ${
                          !link.isActive ? "bg-gray-100" : "bg-white"
                        }`}
                      >
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <span className="text-xs font-medium text-gray-500">
                              Type:
                            </span>
                            <p className="text-sm">
                              {link.linkType === "external_link"
                                ? "External Link"
                                : link.linkType === "collection"
                                ? "Collection"
                                : "Resource"}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">
                              Expires:
                            </span>
                            <p className="text-sm">
                              {new Date(link.expiresAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">
                              Shared With:
                            </span>
                            <p className="text-sm">
                              {link.email || "Anyone with link"}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs font-medium text-gray-500">
                              Views:
                            </span>
                            <p className="text-sm">{link.viewCount || 0}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-gray-500">
                            Content:
                          </span>
                          <p className="text-sm">
                            {link.description || "Shared content"}
                          </p>
                        </div>
                        {link.linkId && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-gray-500">
                              ID:
                            </span>
                            <p className="text-sm truncate">{link.linkId}</p>
                          </div>
                        )}
                        <div className="mt-3 flex gap-2 flex-wrap">
                          {link.isActive ? (
                            <>
                              <button
                                onClick={() => copyToClipboard(link.shareUrl)}
                                className="flex-1 text-center py-1.5 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                              >
                                Copy Link
                              </button>

                              {link.showGuideView && (
                                <button
                                  onClick={() => openGuideView(link)}
                                  className="flex-1 text-center py-1.5 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm flex items-center justify-center"
                                >
                                  <FaBookOpen className="mr-1.5" /> Guide View
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setSelectedLink(link);
                                  setShowUpdateModal(true);
                                  // Calculate days remaining
                                  const now = new Date();
                                  const expiry = new Date(link.expiresAt);
                                  const daysRemaining = Math.ceil(
                                    (expiry - now) / (1000 * 60 * 60 * 24)
                                  );
                                  setNewExpiryDays(Math.max(1, daysRemaining));
                                }}
                                className="flex-1 text-center py-1.5 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                                disabled={!link.isActive}
                              >
                                Update Expiry
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedLink(link);
                                  setShowRevokeModal(true);
                                }}
                                className="flex-1 text-center py-1.5 bg-red-100 text-red-500 rounded-md hover:bg-red-200 transition-colors text-sm"
                                disabled={!link.isActive}
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

                  {/* Desktop view - table layout */}
                  <div className="hidden md:block">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Content
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Shared With
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Expires
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Views
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sharedLinks.map((link) => (
                          <tr
                            key={link.id}
                            className={!link.isActive ? "bg-gray-100" : ""}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="ml-0">
                                  <div className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                                    {link.description || "Shared content"}
                                    {link.showGuideView && (
                                      <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        <FaBookOpen
                                          className="mr-1"
                                          size={10}
                                        />{" "}
                                        Guide
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-500 truncate max-w-[200px]">
                                    ID: {link.linkId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                {link.linkType === "external_link"
                                  ? "External Link"
                                  : link.linkType === "collection"
                                  ? "Collection"
                                  : "Resource"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {link.email ? (
                                <div className="flex items-center">
                                  <FaEnvelope className="text-gray-400 mr-2" />
                                  {link.email}
                                </div>
                              ) : (
                                <span className="text-gray-400">
                                  Anyone with the link
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <FaCalendarAlt className="text-gray-400 mr-2" />
                                {new Date(link.expiresAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <FaEye className="text-gray-400 mr-2" />
                                {link.viewCount}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {link.isActive ? (
                                link.isExpired ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                    Expired
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Active
                                  </span>
                                )
                              ) : (
                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                  Revoked
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {link.isActive ? (
                                <div className="flex space-x-2 gap-2">
                                  <button
                                    onClick={() =>
                                      copyToClipboard(link.shareUrl)
                                    }
                                    className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                                  >
                                    Copy Link
                                  </button>

                                  {link.showGuideView && (
                                    <button
                                      onClick={() => openGuideView(link)}
                                      className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                                    >
                                      <FaBookOpen className="mr-1.5" /> Guide
                                    </button>
                                  )}

                                  <button
                                    onClick={() => {
                                      setSelectedLink(link);
                                      setShowUpdateModal(true);
                                      // Calculate days remaining
                                      const now = new Date();
                                      const expiry = new Date(link.expiresAt);
                                      const daysRemaining = Math.ceil(
                                        (expiry - now) / (1000 * 60 * 60 * 24)
                                      );
                                      setNewExpiryDays(
                                        Math.max(1, daysRemaining)
                                      );
                                    }}
                                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                    disabled={!link.isActive}
                                  >
                                    <FaCalendarAlt className="mr-1.5 text-xs" />{" "}
                                    Update
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedLink(link);
                                      setShowRevokeModal(true);
                                    }}
                                    className="inline-flex items-center px-2 py-1 bg-red-100 text-red-500 rounded-md hover:bg-red-200 transition-colors"
                                    disabled={!link.isActive}
                                  >
                                    <FaTimes className="mr-1.5 text-xs" />{" "}
                                    Revoke
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-gray-200 text-gray-700">
                                  <FaLock className="mr-1.5" /> Revoked
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-gray-400 mb-4">
                  <FaLink className="mx-auto h-12 w-12" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No shared links found
                </h3>
                <p className="text-gray-500">
                  You haven&apos;t created any shared links yet.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {showRevokeModal && (
        <Modal onClose={() => setShowRevokeModal(false)}>
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Revoke Shared Link
            </h2>
            <p className="mb-6 text-gray-600">
              Are you sure you want to revoke this shared link? This action
              cannot be undone and the link will no longer be accessible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRevokeModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRevokeLink}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Revoke Link
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showUpdateModal && (
        <Modal onClose={() => setShowUpdateModal(false)}>
          <div className="p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Update Expiry Date
            </h2>
            <div className="mb-4">
              <label
                htmlFor="expiryDays"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Days until expiry
              </label>
              <InputField
                id="expiryDays"
                type="number"
                min="1"
                value={newExpiryDays}
                onChange={(e) => setNewExpiryDays(e.target.value)}
                className="w-full"
              />
              <p className="mt-2 text-sm text-gray-500">
                The link will expire on{" "}
                {new Date(
                  Date.now() + parseInt(newExpiryDays) * 24 * 60 * 60 * 1000
                ).toLocaleDateString()}
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLink}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Update Expiry
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
