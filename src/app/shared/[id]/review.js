"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useAccessSharedContent,
  useSubmitUserInfo,
  useSubmitFeedback,
  useSubmitReview,
  useGetReviewData,
} from "@/app/hooks/useSharedLinks";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import {
  FaExternalLinkAlt,
  FaLock,
  FaCalendarAlt,
  FaEye,
  FaCheck,
  FaClock,
  FaCheckCircle,
  FaQuestion,
  FaTimes,
  FaUser,
  FaLink,
  FaComment,
  FaPaperPlane,
  FaSync,
  FaThumbsUp,
  FaThumbsDown,
  FaSyncAlt,
  FaQuestionCircle,
  FaTimesCircle,
  FaClipboardCheck,
  FaHistory,
  FaChevronDown,
  FaPlay,
  FaCog,
  FaSearch,
} from "react-icons/fa";
import CustomEditor from "@/app/components/common/CustomEditor";
import Image from "next/image";
import CollectionResourceCard from "@/app/components/cards/CollectionResourceCard";
import ExternalLinkCard from "@/app/components/cards/ExternalLinkCard";
import ExternalLinkDetails from "@/app/components/ExternalLinkDetails";
import SelectField from "@/app/components/inputs/SelectField";
import { toast } from "react-hot-toast";

export default function SharedContentPage() {
  const { id } = useParams();
  const router = useRouter();
  const [token, setToken] = useState("");
  const [error, setError] = useState(null);
  const [showUserInfoPopup, setShowUserInfoPopup] = useState(false);
  const [reviewers, setReviewers] = useState([]);
  const [currentItem, setCurrentItem] = useState(null);
  const [feedbackAction, setFeedbackAction] = useState("");
  const [feedbackNote, setFeedbackNote] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState({});
  const [showSubmitConfirmation, setShowSubmitConfirmation] = useState(false);
  const [expandedActions, setExpandedActions] = useState({});
  const [userInfo, setUserInfo] = useState({
    preferences: {
      enableBulkReview: false,
    },
  });
  const [storedUserEmails, setStoredUserEmails] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const reviewEmail = useMemo(
    () => storedUserEmails || userInfo?.email || userInfo?.userInfo?.email || "",
    [storedUserEmails, userInfo]
  );

  // Use the API hooks instead of local state
  const { mutate: submitUserInfo } = useSubmitUserInfo();
  const { mutate: submitFeedback } = useSubmitFeedback();
  const { mutate: submitReviewMutation, isLoading: apiIsSubmitting } =
    useSubmitReview();
  const { data, isLoading, isError } = useAccessSharedContent(
    id,
    token,
    reviewEmail
  );

  // Only fetch review data for collections after we have content type info
  const { data: reviewData, isLoading: isReviewDataLoading } = useGetReviewData(
    data?.metadata?.type === "collection" ? id : data?.metadata?.linkId,
    token,
    reviewEmail
  );

  const feedback = reviewData?.feedback || {};

  const isSubmitting = apiIsSubmitting;

  // Add search state
  const [searchTerm, setSearchTerm] = useState("");

  // Filter content based on search term
  const filteredContent = useMemo(() => {
    if (!searchTerm) return data;

    const searchLower = searchTerm.toLowerCase();
    return {
      ...data,
      content: {
        ...data.content,
        externalLinks: data.content.externalLinks?.filter(
          (link) =>
            link.name?.toLowerCase().includes(searchLower) ||
            link.url?.toLowerCase().includes(searchLower) ||
            link.description?.toLowerCase().includes(searchLower)
        ),
      },
    };
  }, [data, searchTerm]);

  useEffect(() => {
    // Extract token from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    const emailParam = urlParams.get("email");

    if (tokenParam) {
      setToken(tokenParam);
      if (emailParam) {
        setStoredUserEmails(emailParam);
        localStorage.setItem("reviewUserEmail", emailParam);
      }
    } else {
      setError("No token found in URL");
    }
  }, []); // Only run once on mount

  // Replace the existing useEffect with this updated version
  useEffect(() => {
    if (!token || isReviewDataLoading) {
      return;
    }

    if (reviewData) {
      // Decode the token to get the emails array
      const tokenPayload = JSON.parse(atob(token.split(".")[1]));
      const tokenEmails = Array.isArray(tokenPayload.email)
        ? tokenPayload.email
        : [tokenPayload.email]; // Handle both array and single email cases

      // Get single stored email from localStorage
      const storedEmail = localStorage.getItem(`reviewUserEmail`);
      setStoredUserEmails(storedEmail || "");

      setReviewers(reviewData.status.reviewers);

      // Find matching reviewer using any token email or mapped email
      const matchingReviewer = reviewData.status.reviewers.find((reviewer) => {
        const reviewerEmailLower = reviewer.email.toLowerCase();
        return (
          tokenEmails.some(
            (email) =>
              typeof email === "string" &&
              email.toLowerCase() === reviewerEmailLower
          ) && reviewerEmailLower === storedEmail?.toLowerCase()
        );
      });

      if (matchingReviewer) {
        // Preserve the bulk review preference when updating userInfo
        setUserInfo((prev) => ({
          ...matchingReviewer,
          reviewerId: matchingReviewer.id,
          preferences: {
            ...prev.preferences,
            enableBulkReview: prev.preferences?.enableBulkReview || false,
          },
        }));
      } else if (!storedEmail) {
        // Only show popup if we don't have a stored mapping
        setShowUserInfoPopup(true);
      }
    }
  }, [token, reviewData, isReviewDataLoading, id]);

  // Handle localStorage after component mounts
  useEffect(() => {
    const storedBulkReview =
      localStorage.getItem("bulkReviewEnabled") === "true";
    const existingUserInfo = localStorage.getItem("reviewUserInfo");
    const parsedUserInfo = existingUserInfo ? JSON.parse(existingUserInfo) : {};
    const storedEmail = localStorage.getItem("reviewUserEmail");

    setStoredUserEmails(storedEmail || parsedUserInfo?.email || "");
    setUserInfo({
      ...parsedUserInfo,
      preferences: {
        ...(parsedUserInfo?.preferences || {}),
        enableBulkReview: storedBulkReview,
      },
    });
  }, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    if (token && !reviewEmail) {
      setShowUserInfoPopup(true);
    }
  }, [reviewEmail, token]);

  // Update the calculateReviewProgress function
  const calculateReviewProgress = () => {
    if (!userInfo?.feedback) return 0;

    if (data?.metadata?.type === "collection") {
      if (!data.content?.externalLinks) return 0;
      const totalItems = data.content.externalLinks.length;
      if (totalItems === 0) return 100;
      const reviewedItems = Object.keys(userInfo.feedback).length;
      return Math.round((reviewedItems / totalItems) * 100);
    } else if (data?.metadata?.type === "external_link") {
      return userInfo.feedback[id] ? 100 : 0;
    }

    return 0;
  };

  // Get the available actions for review
  const getAvailableActions = () => {
    // In production, this would parse from token
    return ["approve", "decline", "requestRevision", "askQuestion", "comment"];
  };

  // Get review action options
  const getReviewActionOptions = () => {
    const availableActions = getAvailableActions();
    const options = [];

    if (availableActions.includes("approve")) {
      options.push({
        id: "approve",
        name: "Approve",
        icon: FaThumbsUp,
        color: "green",
      });
    }
    if (availableActions.includes("decline")) {
      options.push({
        id: "decline",
        name: "Decline",
        icon: FaThumbsDown,
        color: "red",
      });
    }
    if (availableActions.includes("requestRevision")) {
      options.push({
        id: "requestRevision",
        name: "Request Changes",
        icon: FaSync,
        color: "yellow",
      });
    }
    if (availableActions.includes("askQuestion")) {
      options.push({
        id: "askQuestion",
        name: "Ask Question",
        icon: FaQuestionCircle,
        color: "gray",
      });
    }
    if (availableActions.includes("comment")) {
      options.push({
        id: "comment",
        name: "Comment",
        icon: FaComment,
        color: "gray",
      });
    }

    return options;
  };

  // Handle action selection
  const handleActionSelect = (link, action) => {
    setCurrentItem(link);
    setFeedbackAction(action.id);
    setShowFeedbackModal(true);
  };

  // Update the handleUserInfoSubmit function
  const handleUserInfoSubmit = async (info) => {
    try {
      localStorage.setItem(`reviewUserEmail`, info.email);
      // Store the full userInfo object
      localStorage.setItem("reviewUserInfo", JSON.stringify(info));
      setStoredUserEmails(info.email);

      submitUserInfo(
        {
          linkId: id,
          token,
          userInfo: info,
        },
        {
          onSuccess: (data, variables) => {
            setUserInfo((prev) => ({
              ...data,
              id: data.reviewerId,
              preferences: {
                ...prev.preferences,
                enableBulkReview: prev.preferences?.enableBulkReview || false,
              },
            }));
            // Update stored userInfo with the server response
            localStorage.setItem("reviewUserInfo", JSON.stringify(data));
            setShowUserInfoPopup(false);
          },
          onError: (error) => {
            console.error("Failed to submit user info:", error);
            toast.error("Failed to submit user information");
          },
        }
      );
    } catch (error) {
      console.error("Failed to submit user info:", error);
      toast.error("Failed to submit user information");
    }
  };

  // Update the handleFeedbackSubmit function
  const handleFeedbackSubmit = useCallback(() => {
    if (!currentItem) return;

    if (!userInfo?.id) {
      const reviewer = reviewData?.reviewers?.find(
        (r) => r.email === userInfo?.userInfo?.email
      );
      if (reviewer?.id) {
        setUserInfo((prev) => ({ ...prev, id: reviewer.reviewerId }));
      } else {
        submitUserInfo({
          linkId: id,
          token,
          userInfo: info,
        });
      }
    }
    submitFeedback(
      {
        linkId:
          data?.metadata?.type === "collection" ? id : data?.metadata?.linkId,
        token,
        itemId: currentItem.id,
        reviewerId: userInfo.reviewerId,
        email: reviewEmail,
        action: feedbackAction,
        note: feedbackNote,
      },
      {
        onSuccess: () => {
          setShowFeedbackModal(false);
          setFeedbackNote("");
        },
        onError: (error) => {
          toast.error(error?.message || "Error submitting feedback");
        },
      }
    );
  }, [
    currentItem,
    userInfo,
    id,
    token,
    feedbackAction,
    feedbackNote,
    reviewEmail,
    submitFeedback,
  ]);

  // Update the submitReview function
  const submitReview = async () => {
    if (isSubmitting || !userInfo?.id) return;

    submitReviewMutation(
      {
        linkId: id,
        token,
        email: reviewEmail,
        reviewerId: userInfo.reviewerId,
        feedback,
      },
      {
        onSuccess: () => {
          setShowSubmitConfirmation(false);
          toast.success("Review submitted successfully!");
        },
        onError: (error) => {
          console.error("Failed to submit review:", error);
          toast.error("Failed to submit review");
        },
      }
    );
  };

  // Toggle expand/collapse for feedback actions
  const toggleActionsExpand = useCallback((linkId) => {
    setExpandedActions((prev) => ({
      ...prev,
      [linkId]: !prev[linkId],
    }));
  }, []);

  // Update the bulk review toggle handler
  const handleBulkReviewToggle = useCallback(() => {
    setUserInfo((prev) => {
      const newPreferences = {
        ...prev.preferences,
        enableBulkReview: !prev.preferences?.enableBulkReview,
      };
      // Store the preference in localStorage
      localStorage.setItem(
        "bulkReviewEnabled",
        newPreferences.enableBulkReview
      );
      return {
        ...prev,
        preferences: newPreferences,
      };
    });
  }, []);

  // Add this helper function to collect all feedback for an item
  const getAllFeedbackForItem = (reviewers, itemId) => {
    return (
      reviewers
        ?.flatMap((reviewer) => {
          const itemFeedback = reviewer.feedback?.[itemId] || [];
          return itemFeedback.map((feedback) => ({
            ...feedback,
            reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
            reviewerEmail: reviewer.email,
          }));
        })
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) || []
    );
  };

  // Show loading state until we have confirmed data
  if (isLoading || !data) {
    return (
      <div className="grid md:grid-cols-2 gap-6 mt-20 opacity-50">
        <LoadingSkeleton
          lines={5}
          height="32px"
          width={[70, 65, 70, 65]}
          spacing="1.5rem"
        />
        <LoadingSkeleton
          lines={5}
          height="32px"
          width={[70, 65, 70, 65]}
          spacing="1.5rem"
        />
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">
            <FaLock className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-red-700 mb-2">
            Access Denied
          </h1>
          <p className="text-red-600 mb-6">
            This shared link is invalid, expired, or has been revoked.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (!data.content) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-yellow-700 mb-2">
            Content Not Found
          </h1>
          <p className="text-yellow-600 mb-6">
            The requested content could not be found or is no longer available.
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const { content, metadata } = data;
  const contentType = metadata.type;

  const renderContent = () => {
    switch (contentType) {
      case "collection":
        return renderCollection(content);
      case "resource":
        return renderResource(content);
      case "external_link":
        return renderExternalLink({ content, metadata });
      default:
        return <div>Unknown content type</div>;
    }
  };

  const renderCollection = (collection) => {
    const availableActions = getAvailableActions();
    const actionOptions = getReviewActionOptions();

    // Filter collection links based on search term
    const filteredLinks = collection.externalLinks?.filter((link) => {
      if (!searchTerm) return true;

      const searchLower = searchTerm.toLowerCase();
      return (
        link.name?.toLowerCase().includes(searchLower) ||
        link.url?.toLowerCase().includes(searchLower) ||
        link.description?.toLowerCase().includes(searchLower) ||
        link.notations?.some((notation) =>
          notation.text?.toLowerCase().includes(searchLower)
        )
      );
    });

    return (
      <div className="bg-white/20 rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-slate-800 border border-slate-700 text-white rounded-t-lg p-8">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-3xl font-bold">{collection.name}</h1>
            </div>
            <p className="text-gray-300 h-[75px]">
              <CustomEditor
                content={collection.description}
                readonly={true}
                transparent={true}
                scrollable={true}
                textColor="text-slate-200"
              />
            </p>

            <div className="flex justify-end items-center mt-4 gap-2">
              {filteredLinks && filteredLinks.length > 0 && (
                <>
                  <div className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm border border-blue-500/20">
                    {filteredLinks.length}{" "}
                    {filteredLinks.length === 1 ? "Link" : "Links"}
                  </div>
                  <div className="bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm border border-blue-500/20">
                    {filteredLinks.reduce(
                      (total, link) => total + (link.notations?.length || 0),
                      0
                    )}{" "}
                    {filteredLinks.reduce(
                      (total, link) => total + (link.notations?.length || 0),
                      0
                    ) === 1
                      ? "Notation"
                      : "Notations"}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Moved search bar here */}
        <div className="px-6 py-4 border-b border-gray-100 w-full">
          <div className="relative w-full">
            <FaSearch className="absolute left-3  top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search links..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLinks?.map((link) => (
              <div key={link.id} className="flex flex-col">
                <div className="relative">
                  {/* Single status indicator */}
                  <div
                    className={`absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md ${
                      userInfo?.feedback?.[link.id]?.length > 0
                        ? "bg-green-500"
                        : "bg-yellow-100"
                    }`}
                  >
                    {userInfo?.feedback?.[link.id]?.length > 0 ? (
                      <FaCheckCircle className="text-white" />
                    ) : (
                      <FaClock className="text-yellow-500" />
                    )}
                  </div>

                  <ExternalLinkCard
                    icon={collection.icon}
                    id={link.id}
                    url={link.url}
                    name={link.name}
                    type={link.type}
                    notes={link.notations}
                    date={link.date}
                    dateAdded={link.dateAdded}
                    description={link.description}
                    imageUrl={link.imageUrl}
                    timestamps={link.timestamps}
                    isSharedView={true}
                    sharedToken={token}
                    onView={() => {
                      /* handle view if needed */
                    }}
                  />
                </div>

                {/* Modified Feedback section with single Review button by default */}
                <div className="mt-2">
                  <div className="flex items-center justify-between">
                    {/* New bulk review toggle - hidden by default */}
                    {userInfo?.preferences?.enableBulkReview && (
                      <button
                        className={`text-xs px-4 py-2 rounded-md transition-all duration-200 ${
                          expandedActions[link.id]
                            ? "bg-slate-500 text-white"
                            : "bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
                        }`}
                        onClick={() => toggleActionsExpand(link.id)}
                      >
                        {expandedActions[link.id]
                          ? "Hide Actions"
                          : "Show Actions"}
                      </button>
                    )}
                  </div>

                  {/* Default view - Single Review button - Updated container styling */}
                  {!userInfo?.preferences?.enableBulkReview && (
                    <button
                      onClick={() => {
                        // Get token from state or URL params as fallback
                        const currentToken =
                          token ||
                          new URLSearchParams(window.location.search).get(
                            "token"
                          );

                        // Get email from localStorage for shared links - use the review email key
                        const storedEmail =
                          localStorage.getItem("reviewUserEmail") ||
                          localStorage.getItem("shared-links-email");
                        const emailParam = storedEmail
                          ? `&email=${encodeURIComponent(storedEmail)}`
                          : "";

                        router.push(
                          `/shared/${link.id}?token=${currentToken}${emailParam}`
                        );
                      }}
                      className="mt-3 w-full py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow"
                    >
                      Review Content
                    </button>
                  )}

                  {/* Bulk review actions - Updated container styling */}
                  {userInfo?.preferences?.enableBulkReview &&
                    expandedActions[link.id] && (
                      <div className="mt-3 bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
                        {/* Existing action buttons */}
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-2">
                            {actionOptions.map((action) => (
                              <button
                                key={action.id}
                                onClick={() => handleActionSelect(link, action)}
                                className={`px-3 rounded-lg text-sm font-medium flex items-center shadow-sm hover:shadow-md transition-all
                                ${
                                  action.color === "green"
                                    ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                                    : action.color === "red"
                                    ? "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                                    : action.color === "yellow"
                                    ? "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100"
                                    : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
                                }`}
                              >
                                {action.icon && (
                                  <action.icon className="mr-1.5" />
                                )}
                                {action.name}
                              </button>
                            ))}
                          </div>
                        </div>
                        {/* Feedback History Section */}
                        {reviewData?.status?.reviewers && (
                          <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                            {getAllFeedbackForItem(
                              reviewData.status.reviewers,
                              link.id
                            ).map((item, idx) => {
                              // Choose appropriate styling based on action
                              let bgColor, iconColor, icon;
                              switch (item.action) {
                                case "approve":
                                  bgColor = "bg-green-50 border-green-100";
                                  iconColor = "text-green-500";
                                  icon = <FaThumbsUp />;
                                  break;
                                case "decline":
                                  bgColor = "bg-red-50 border-red-100";
                                  iconColor = "text-red-500";
                                  icon = <FaThumbsDown />;
                                  break;
                                case "requestRevision":
                                  bgColor = "bg-yellow-50 border-yellow-100";
                                  iconColor = "text-yellow-500";
                                  icon = <FaSync />;
                                  break;
                                case "askQuestion":
                                case "comment":
                                  bgColor = "bg-gray-50 border-gray-100";
                                  iconColor = "text-gray-500";
                                  icon =
                                    item.action === "askQuestion" ? (
                                      <FaQuestionCircle />
                                    ) : (
                                      <FaComment />
                                    );
                                  break;
                                default:
                                  bgColor = "bg-gray-50 border-gray-100";
                                  iconColor = "text-gray-500";
                                  icon = <FaComment />;
                              }

                              return (
                                <div
                                  key={idx}
                                  className={`${bgColor} p-3 rounded-lg border text-sm`}
                                >
                                  <div className="flex flex-col items-start justify-between mb-2">
                                    <span className="text-slate-500 text-xs">
                                      {new Date(item.timestamp).toLocaleString(
                                        undefined,
                                        {
                                          month: "short",
                                          day: "numeric",
                                          year: "numeric",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                          hour12: true,
                                        }
                                      )}
                                    </span>
                                    <span
                                      className={`font-medium capitalize flex items-center ${iconColor}`}
                                    >
                                      {item.action === "requestRevision"
                                        ? "Changes Requested"
                                        : item.action}
                                    </span>
                                  </div>
                                  {item.note && (
                                    <p className="mt-1 text-slate-700 bg-white/50 p-2 rounded border border-slate-100">
                                      {item.note}
                                    </p>
                                  )}
                                  <div className="text-xs text-slate-500 mt-2 flex items-center">
                                    <FaUser className="mr-1 text-slate-400" />
                                    {item.reviewerName}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>

          {(!filteredLinks || filteredLinks.length === 0) && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                {searchTerm
                  ? "No matching links found"
                  : "No content found in this collection"}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResource = (resource) => {
    return (
      <div className="rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-t-lg">
          <h1 className="text-3xl font-bold mb-4">{resource.name}</h1>
          <div className="flex flex-wrap gap-2 mb-4">
            {resource.resourceType && (
              <span className="bg-blue-500/20 text-blue-100 px-3 py-1 rounded-full text-sm">
                {resource.resourceType?.name}
              </span>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Description
            </h2>
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
              <CustomEditor
                content={resource.description}
                readonly={true}
                transparent={true}
              />
            </div>
          </div>

          {resource.content && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Content
              </h2>
              <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                <CustomEditor
                  content={resource.content}
                  readonly={true}
                  transparent={true}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExternalLink = ({ content, metadata }) => {
    const availableActions = getAvailableActions();
    const actionOptions = getReviewActionOptions();

    return (
      <div className="rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <ExternalLinkDetails
          externalLink={{ ...content, metadata }}
          isReadOnly={true}
          sharedToken={token}
          pinnedItems={[]}
        />
      </div>
    );
  };

  return (
    <div className="w-full md:w-11/12 mx-auto p-4 md:p-8 mb-20">
      {/* User Info Collection Popup with enhanced styling */}
      {showUserInfoPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md w-full border border-blue-100 animate-fade-in-up">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaClipboardCheck className="text-blue-600 text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Content Review
              </h2>
              <p className="text-slate-600">
                Please provide your information to begin reviewing the shared
                content.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const firstName = e.target.firstName.value;
                const lastName = e.target.lastName.value;
                const email = e.target.email.value;
                handleUserInfoSubmit({ firstName, lastName, email });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    First Name
                  </label>
                  <input
                    autoComplete="off"
                    id="firstName"
                    name="firstName"
                    type="text"
                    required
                    className="block w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    autoComplete="off"
                    id="lastName"
                    name="lastName"
                    type="text"
                    required
                    className="block w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 mb-1"
                  >
                    Email Address
                  </label>
                  <input
                    autoComplete="off"
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="block w-full rounded-lg border border-slate-200 px-4 py-3 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all"
                  />
                </div>
              </div>
              <div className="mt-8">
                <button
                  type="submit"
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center"
                >
                  Begin Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enhanced Feedback Modal */}
      {showFeedbackModal && currentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-md w-full border border-slate-100 animate-fade-in-up">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-slate-800 capitalize flex items-center">
                {feedbackAction === "approve" && (
                  <FaThumbsUp className="mr-2 text-green-500" />
                )}
                {feedbackAction === "decline" && (
                  <FaThumbsDown className="mr-2 text-red-500" />
                )}
                {feedbackAction === "requestRevision" && (
                  <FaSync className="mr-2 text-yellow-500" />
                )}

                {feedbackAction === "askQuestion"
                  ? "Ask a Question"
                  : feedbackAction === "requestRevision"
                  ? "Request Changes"
                  : `${feedbackAction} Item`}
              </h2>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-5 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <p className="text-slate-500 text-sm">Item</p>
              <p className="font-medium text-slate-800">{currentItem.name}</p>
              <div className="text-xs text-slate-500 mt-1 flex items-center">
                {currentItem.url}
              </div>
            </div>

            <div className="mb-6">
              <label
                htmlFor="feedbackNote"
                className="block text-sm font-medium text-slate-700 mb-2 flex items-center"
              >
                <FaComment className="mr-1.5 text-blue-500" />
                {feedbackAction === "askQuestion"
                  ? "Your Question"
                  : "Comments"}
                {feedbackAction !== "askQuestion" && (
                  <span className="text-slate-400 text-xs ml-1">
                    (Optional)
                  </span>
                )}
              </label>
              <textarea
                id="feedbackNote"
                value={feedbackNote}
                onChange={(e) => setFeedbackNote(e.target.value)}
                rows={4}
                className="w-full border border-slate-200 rounded-lg px-4 py-3 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all"
                placeholder={
                  feedbackAction === "askQuestion"
                    ? "Type your question here..."
                    : feedbackAction === "requestRevision"
                    ? "What changes would you like to see?"
                    : "Add any additional comments..."
                }
                required={feedbackAction === "askQuestion"}
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="px-5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleFeedbackSubmit}
                className={`px-5 py-2.5 rounded-lg text-white transition-colors flex items-center
                  ${
                    feedbackAction === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : feedbackAction === "decline"
                      ? "bg-red-600 hover:bg-red-700"
                      : feedbackAction === "requestRevision"
                      ? "bg-yellow-600 hover:bg-yellow-700"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                disabled={feedbackAction === "askQuestion" && !feedbackNote}
              >
                <FaCheck className="mr-1.5" />
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal before final submission */}
      {showSubmitConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl p-6 shadow-2xl max-w-lg w-full border border-slate-100 animate-fade-in-up">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <FaPaperPlane className="mr-2 text-blue-600" />
                Submit Review
              </h2>
              <button
                onClick={() => setShowSubmitConfirmation(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <FaTimes />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-slate-600 mb-4">
                You&apos;re about to submit your review. This action cannot be
                undone.
              </p>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Review Summary
                </h3>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600"
                        style={{ width: `${calculateReviewProgress()}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-blue-700">
                    {calculateReviewProgress()}% Complete
                  </div>
                </div>

                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-center">
                    <FaCheckCircle className="text-green-500 mr-2" />
                    {
                      Object.values(feedback)
                        .flat()
                        .filter((f) => f.action === "approve").length
                    }{" "}
                    Items Approved
                  </li>
                  <li className="flex items-center">
                    <FaTimesCircle className="text-red-500 mr-2" />
                    {
                      Object.values(feedback)
                        .flat()
                        .filter((f) => f.action === "decline").length
                    }{" "}
                    Items Declined
                  </li>
                  <li className="flex items-center">
                    <FaSyncAlt className="text-yellow-500 mr-2" />
                    {
                      Object.values(feedback)
                        .flat()
                        .filter((f) => f.action === "requestRevision").length
                    }{" "}
                    Revisions Requested
                  </li>
                  <li className="flex items-center">
                    <FaQuestionCircle className="text-blue-500 mr-2" />
                    {
                      Object.values(feedback)
                        .flat()
                        .filter((f) => f.action === "askQuestion").length
                    }{" "}
                    Questions Asked
                  </li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSubmitConfirmation(false)}
                className="px-5 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirmation(false);
                  submitReview();
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    <FaPaperPlane className="mr-1.5" />
                    Submit Review
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="text-sm text-gray-400 flex items-center mb-4">
        <FaCalendarAlt className="text-gray-500 mr-1.5" />
        Shared content expires:{" "}
        {metadata?.expiresAt &&
          new Date(metadata.expiresAt).toLocaleDateString()}
      </div>
      {/* Enhanced Review Status Bar with Shared Content Info */}
      {!showUserInfoPopup && data && data.content && (
        <div className="md:sticky top-0 z-40 bg-white shadow-md border-b border-gray-200 mb-6 rounded-sm">
          <div className="max-w-full mx-auto p-4">
            <div className="flex items-center justify-between md:flex-row flex-col">
              <div className="flex items-center gap-4 md:flex-row flex-col">
                <div className="flex items-center gap-2">
                  <FaClipboardCheck className="text-blue-600" />
                  <span className="font-medium">Review</span>
                  <span className="text-gray-500">•</span>
                  <span>{calculateReviewProgress()}% Complete</span>
                </div>
                <div className="text-sm text-gray-600 flex items-center capitalize mb-2 md:mb-0">
                  <FaUser className="text-gray-400 mr-1.5" />
                  {userInfo?.firstName} {userInfo?.lastName}
                </div>
              </div>

              <div className="flex items-center gap-3 md:flex-row flex-col">
                <div
                  className={`flex items-center px-4 py-2 rounded-lg border ${
                    userInfo?.reviewComplete ||
                    (calculateReviewProgress() === 100 &&
                      metadata?.type === "external_link")
                      ? "bg-green-50 text-green-700 border-green-100"
                      : "bg-blue-50 text-blue-700 border-blue-100"
                  }`}
                >
                  {calculateReviewProgress() === 100 ? (
                    <>
                      <FaCheckCircle className="mr-2" />
                      Review Complete
                    </>
                  ) : calculateReviewProgress() === 100 &&
                    metadata?.type === "external_link" ? (
                    <>
                      <FaCheckCircle className="mr-2" />
                      This Item Complete
                    </>
                  ) : (
                    <>
                      <FaClock className="mr-2" />
                      In Progress
                    </>
                  )}
                  {metadata?.type === "external_link" && (
                    <button
                      onClick={() => router.back()}
                      className="text-[10px] text-blue-600 hover:text-blue-800 transition-colors ml-2 border-l border-gray-200 pl-2"
                    >
                      Back to Collection
                    </button>
                  )}
                </div>

                {/* Add Bulk Review Toggle - Updated styling */}
                {metadata?.type === "collection" && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 flex items-center">
                      <FaCog className="mr-2" />
                      Bulk Review
                    </span>
                    <button
                      onClick={handleBulkReviewToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out ${
                        userInfo?.preferences?.enableBulkReview
                          ? "bg-blue-500"
                          : "bg-gray-200"
                      }`}
                      role="switch"
                      aria-checked={userInfo?.preferences?.enableBulkReview}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                          userInfo?.preferences?.enableBulkReview
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                )}

                {/* Existing buttons */}
                {data?.metadata?.type !== "collection" && (
                  <>
                    {userInfo?.reviewComplete ||
                    calculateReviewProgress() === 100 ? (
                      <button
                        onClick={() => setShowDetails((prev) => !prev)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        title="Toggle Review Actions"
                      >
                        <FaChevronDown
                          className={`transform transition-transform ${
                            showDetails ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    ) : (
                      <button
                        onClick={() => setShowDetails((prev) => !prev)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        Review
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Expandable Review Actions Section */}
            {showDetails && (
              <div className="mt-4 pt-4 border-t border-gray-100 animate-fadeIn">
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => {
                      handleActionSelect(content, {
                        id: "approve",
                        name: "Approve",
                      });
                      setShowDetails(false);
                    }}
                    className="px-4 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors flex items-center"
                  >
                    <FaThumbsUp className="mr-2" />
                    Approve
                  </button>

                  <button
                    onClick={() => {
                      handleActionSelect(content, {
                        id: "decline",
                        name: "Decline",
                      });
                      setShowDetails(false);
                    }}
                    className="px-4 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center"
                  >
                    <FaThumbsDown className="mr-2" />
                    Decline
                  </button>

                  <button
                    onClick={() => {
                      handleActionSelect(content, {
                        id: "requestRevision",
                        name: "Request Changes",
                      });
                      setShowDetails(false);
                    }}
                    className="px-3 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors flex items-center"
                  >
                    <FaSync className="mr-2" />
                    Request Changes
                  </button>

                  <button
                    onClick={() => {
                      handleActionSelect(content, {
                        id: "askQuestion",
                        name: "Ask Question",
                      });
                      setShowDetails(false);
                    }}
                    className="px-4 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
                  >
                    Question
                  </button>

                  <button
                    onClick={() => {
                      handleActionSelect(content, {
                        id: "comment",
                        name: "Comment",
                      });
                      setShowDetails(false);
                    }}
                    className="px-4 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors flex items-center"
                  >
                    Comment
                  </button>
                </div>

                {/* Add Feedback History Section */}
                {reviewData?.status.reviewers.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center">
                      <FaHistory className="mr-2 text-blue-500" />
                      Feedback History
                    </h4>
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                      {getAllFeedbackForItem(
                        reviewData.status.reviewers,
                        content.id
                      ).map((item, idx) => {
                        // Choose appropriate styling based on action
                        let bgColor, iconColor, icon;
                        switch (item.action) {
                          case "approve":
                            bgColor = "bg-green-50 border-green-100";
                            iconColor = "text-green-500";
                            icon = <FaThumbsUp />;
                            break;
                          case "decline":
                            bgColor = "bg-red-50 border-red-100";
                            iconColor = "text-red-500";
                            icon = <FaThumbsDown />;
                            break;
                          case "requestRevision":
                            bgColor = "bg-yellow-50 border-yellow-100";
                            iconColor = "text-yellow-500";
                            icon = <FaSync />;
                            break;
                          case "askQuestion":
                          case "comment":
                            bgColor = "bg-gray-50 border-gray-100";
                            iconColor = "text-gray-500";
                            icon =
                              item.action === "askQuestion" ? (
                                <FaQuestionCircle />
                              ) : (
                                <FaComment />
                              );
                            break;
                          default:
                            bgColor = "bg-gray-50 border-gray-100";
                            iconColor = "text-gray-500";
                            icon = <FaComment />;
                        }

                        return (
                          <div
                            key={idx}
                            className={`${bgColor} p-3 rounded-lg border text-sm`}
                          >
                            <div className="flex flex-col items-start justify-between mb-2">
                              <span className="text-slate-500 text-xs">
                                {new Date(item.timestamp).toLocaleString(
                                  undefined,
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  }
                                )}
                              </span>
                              <span
                                className={`font-medium capitalize flex items-center ${iconColor}`}
                              >
                                {item.action === "requestRevision"
                                  ? "Changes Requested"
                                  : item.action}
                              </span>
                            </div>
                            {item.note && (
                              <p className="mt-1 text-slate-700 bg-white/50 p-2 rounded border border-slate-100">
                                {item.note}
                              </p>
                            )}
                            <div className="text-xs text-slate-500 mt-2 flex items-center">
                              <FaUser className="mr-1 text-slate-400" />
                              {item.reviewerName}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {renderContent()}
    </div>
  );
}
