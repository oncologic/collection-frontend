"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  useAccessSharedContent,
  useValidateEmailAccess,
} from "@/app/hooks/useSharedLinks";
import LoadingSkeleton from "@/app/components/LoadingSkeleton";
import SharedLinkEmailForm from "@/app/components/SharedLinkEmailForm";
import { getErrorMessage } from "@/app/utils/errorHandling";
import {
  FaExternalLinkAlt,
  FaLock,
  FaCalendarAlt,
  FaSearch,
  FaCalendar,
  FaFilter,
  FaVideo,
  FaPaperclip,
  FaBookOpen,
} from "react-icons/fa";
import CustomEditor from "@/app/components/common/CustomEditor";
import CollectionResourceCard from "@/app/components/cards/CollectionResourceCard";
import ExternalLinkCard from "@/app/components/cards/ExternalLinkCard";
import ExternalLinkDetails from "@/app/components/ExternalLinkDetails";
import Calendar from "@/app/components/events/Calendar";
import ResourceCard from "@/app/components/cards/ResourceCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faList, faTableCells } from "@fortawesome/free-solid-svg-icons";
import ResourcesGrid from "@/app/components/ResourcesGrid";
import StatusFilterMenu from "@/app/components/StatusFilterMenu";
import { STATUS_OPTIONS } from "@/app/components/forms/AddCollectionForm";
import VideoBrowser from "@/app/components/VideoBrowser";
import AttachmentsModal from "@/app/components/modals/AttachmentsModal";
import CalendarHoverInfo from "@/app/components/events/CalendarHoverInfo";
import GuideView from "@/app/components/GuideView";
import { DateTime } from "luxon";
import { getDateRangeValues } from "@/app/utils/general";
import { buildSortedExternalLinkTypeEntries } from "@/app/utils/externalLinkOrdering";
import { shouldBypassImageOptimization } from "@/app/utils/imageOptimization";
import Image from "next/image";
import LinkGroups from "@/app/components/LinkGroups";

const ResourceAttachmentsSection = ({ attachments = [] }) => {
  if (!attachments.length) {
    return null;
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <FaPaperclip className="text-blue-500" />
        <h2 className="text-xl font-semibold text-gray-800">Attachments</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attachments.map((attachment) => {
          const href = attachment.presignedUrl || attachment.url;
          const isImage = attachment.type === "image";

          return (
            <div
              key={attachment.id}
              className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50"
            >
              {isImage && href ? (
                <div className="relative h-40 bg-white">
                  <Image
                    src={href}
                    alt={attachment.title || "Attachment"}
                    fill
                    unoptimized={shouldBypassImageOptimization(href)}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                  />
                </div>
              ) : (
                <div className="h-40 bg-white flex items-center justify-center text-gray-400">
                  <FaPaperclip className="w-8 h-8" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <p className="font-medium text-gray-900">
                  {attachment.title || "Untitled attachment"}
                </p>
                {attachment.description && (
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {attachment.description.replace(/<[^>]*>/g, "")}
                  </p>
                )}
                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <FaExternalLinkAlt className="w-3 h-3" />
                    Open attachment
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function SharedContentPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [emailValidated, setEmailValidated] = useState(false);
  const [accessLevel, setAccessLevel] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCalendarView, setShowCalendarView] = useState(false);
  const calendarRef = useRef(null);
  const [viewMode, setViewMode] = useState("list");
  const [flippedCardId, setFlippedCardId] = useState(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterMenuRef = useRef(null);
  const [statusFilter, setStatusFilter] = useState(() => {
    return STATUS_OPTIONS.reduce((acc, status) => {
      acc[status.id] = !["completed", "archived"].includes(status.id);
      return acc;
    }, {});
  });
  const [showVideoBrowser, setShowVideoBrowser] = useState(false);
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [showCalendarHover, setShowCalendarHover] = useState(false);
  const calendarButtonRef = useRef(null);
  const handleEmailValidationRef = useRef(null);
  const [showNotationDates, setShowNotationDates] = useState(true);

  // Guide view state
  const [showGuideView, setShowGuideView] = useState(false);
  const [currentGuideStep, setCurrentGuideStep] = useState(0);

  // Email validation mutation
  const validateEmailMutation = useValidateEmailAccess();

  // Updated to include email parameter - only enabled when email is validated
  const { data, isLoading, isError } = useAccessSharedContent(id, token, email);

  // Add error logging for debugging
  useEffect(() => {
    if (isError) {
      console.error("Error accessing shared content:", isError);
    }
  }, [isError]);

  // Check if email is stored in localStorage and validate it
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get("token");
    const emailParam = urlParams.get("email"); // Get email from URL
    const viewMode = urlParams.get("view");

    if (tokenParam) {
      setToken(tokenParam);

      // Check if view=guide is set in the URL and enable guide view accordingly
      if (viewMode === "guide") {
        setShowGuideView(true);
      }

      // Check for email in URL first, then localStorage
      let emailToValidate = null;

      if (emailParam) {
        emailToValidate = emailParam;
      } else {
        // Check for globally stored email for shared links (not per-link)
        const storedEmail = localStorage.getItem("shared-links-email");
        if (storedEmail) {
          emailToValidate = storedEmail;
        }
      }

      if (emailToValidate) {
        // Pass the token directly instead of relying on state
        handleEmailValidationRef.current?.(emailToValidate, tokenParam);
      }
    } else {
      setError("No token found in URL");
    }
  }, [id]); // Added id as dependency

  // Email validation handler - updated to accept token parameter
  const handleEmailValidation = async (emailToValidate, tokenToUse = token) => {
    try {
      setError(null);

      // First validate email access
      // Note: If this is an external link within a collection, the backend should auto-resolve
      const validation = await validateEmailMutation.mutateAsync({
        linkId: id,
        email: emailToValidate,
        token: tokenToUse,
        // Pass collection context if we can determine it from the data
        collectionId: data?.content?.collections?.[0]?.id || null,
      });

      if (validation.hasAccess || validation.accessLevel === "public_only") {
        setEmail(emailToValidate);
        setEmailValidated(true);
        setAccessLevel(validation.accessLevel);

        // Store email globally for shared links (not per-link)
        localStorage.setItem("shared-links-email", emailToValidate);

        // Update URL to include email parameter for future navigation
        const url = new URL(window.location.href);
        url.searchParams.set("email", emailToValidate);
        window.history.replaceState({}, "", url.toString());
      } else {
        setError("Your email is not authorized to access this content.");
      }
    } catch (err) {
      // Enhanced error logging for debugging
      console.error("❌ Email validation failed:", {
        linkId: id,
        email: emailToValidate?.substring(0, 3) + "***",
        token: tokenToUse?.substring(0, 10) + "...",
        error: err.message,
        status: err.status,
        fullError: err,
      });

      const errorMessage = getErrorMessage(err);

      // Enhanced error handling for external links in collections
      if (errorMessage.includes("backend auto-resolution")) {
        setError(
          "Unable to access this content. This may be an external link within a collection that requires special handling. Please contact support if this issue persists."
        );
      } else if (
        errorMessage.includes("Shared link not found") ||
        errorMessage.includes("has expired")
      ) {
        // This is likely the auto-resolution scenario
        setError(
          `⚠️ Backend Auto-Resolution Required

This appears to be an external link within a shared collection, but the backend hasn't implemented auto-resolution yet.

Technical Details:
• External Link ID: ${id}
• Collection Token: ${tokenToUse?.substring(0, 20)}...
• Email: ${emailToValidate}

The backend needs to:
1. Find which collection contains this external link
2. Validate access using the collection's shared link settings
3. Return the external link data with collection context

Please share the BACKEND_REQUIREMENTS.md file with your backend team to implement this feature.`
        );
      } else {
        setError(errorMessage);
      }

      console.error("Email validation error:", err);
    }
  };
  handleEmailValidationRef.current = handleEmailValidation;

  // Handle email form submission
  const handleEmailSubmit = (submittedEmail) => {
    handleEmailValidation(submittedEmail, token);
  };

  // Clear email and reset access
  const clearEmail = () => {
    setEmail("");
    setEmailValidated(false);
    setAccessLevel(null);
    setError(null);
    localStorage.removeItem("shared-links-email");

    // Remove email from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("email");
    window.history.replaceState({}, "", url.toString());
  };

  // Check URL for guide view parameter on component mount
  useEffect(() => {
    const viewMode = searchParams.get("view");
    if (viewMode === "guide") {
      setShowGuideView(true);
    }
  }, [searchParams]);

  // Update URL when guide view is toggled
  const toggleGuideView = () => {
    const newState = !showGuideView;
    setShowGuideView(newState);

    // Update URL to reflect current guide view state
    const url = new URL(window.location.href);
    if (newState) {
      url.searchParams.set("view", "guide");
    } else {
      url.searchParams.delete("view");
    }

    // Update URL without reloading the page
    window.history.pushState({}, "", url.toString());

    if (!showGuideView) {
      const timer = setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 100);
      return () => clearTimeout(timer);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        filterMenuRef.current &&
        !filterMenuRef.current.contains(event.target)
      ) {
        setShowFilterMenu(false);
      }

      // Close calendar hover when clicking outside
      if (
        calendarButtonRef.current &&
        !calendarButtonRef.current.contains(event.target)
      ) {
        setShowCalendarHover(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterMenuRef, calendarButtonRef]);

  // Listen for calendar scroll event from CalendarHoverInfo
  useEffect(() => {
    const handleScrollToFullCalendar = () => {
      // Show calendar view
      setShowCalendarView(true);

      // Set the view mode to week through the custom event
      const event = new CustomEvent("setCalendarViewMode", {
        detail: {
          viewMode: "week",
          weekViewMode: "calendar",
        },
      });
      window.dispatchEvent(event);

      // Scroll to calendar after a small delay to ensure DOM is updated
      setTimeout(() => {
        if (calendarRef.current) {
          calendarRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    };

    window.addEventListener("scrollToFullCalendar", handleScrollToFullCalendar);
    return () => {
      window.removeEventListener(
        "scrollToFullCalendar",
        handleScrollToFullCalendar
      );
    };
  }, []);

  const combinedEvents = useMemo(() => {
    if (!data?.content) return [];

    const allEvents = [];
    const contentRange = getDateRangeValues(data.content || {});

    if (data.metadata?.type === "collection" && contentRange.startDate) {
      allEvents.push({
        id: `collection-${data.content.id}`,
        title: data.content.name || "Untitled Collection",
        startDate: contentRange.startDate,
        endDate: contentRange.endDate,
        type: "collection",
        status: data.content.status || "pending",
        description: data.content.description,
      });
    }

    // Add external links with dates
    if (data.content.externalLinks) {
      data.content.externalLinks.forEach((link) => {
        const linkRange = getDateRangeValues(link);
        if (linkRange.startDate) {
          allEvents.push({
            id: link.id,
            title: link.name || link.url || "Untitled Link",
            startDate: linkRange.startDate,
            endDate: linkRange.endDate,
            time: link.startTime,
            startTime: link.startTime,
            endTime: link.endTime,
            timezone: link.timezone,
            type: "external_link",
            status: link.status || "pending",
            url: link.url,
            description: link.description,
          });
        }

        // Add notations with dates if they exist
        if (link.notations) {
          link.notations.forEach((notation) => {
            const notationRange = getDateRangeValues(notation);
            if (notationRange.startDate) {
              allEvents.push({
                id: `${link.id}`,
                notationId: notation.id,
                title:
                  notation.title ||
                  `Note: ${
                    notation.content?.substring(0, 20) || "Untitled"
                  }...`,
                startDate: notationRange.startDate,
                endDate: notationRange.endDate,
                time: notation.startTime || "",
                type: "notation",
                status: notation.status || "pending",
                description: notation.notes,
                highlighted: notation.highlighted,
                startTime: notation.startTime || "",
                endTime: notation.endTime || "",
                timezone: notation.timezone || "",
              });
            }
          });
        }
      });
    }

    // Add collection-level events if they exist
    if (data.content.events) {
      data.content.events.forEach((event) => {
        allEvents.push({
          id: event.id,
          title: event.title || event.name || "Untitled Event",
          startDate: event.startDate || event.date,
          endDate: event.endDate || event.date,
          time: event.startTime,
          startTime: event.startTime,
          endTime: event.endTime,
          timezone: event.timezone,
          type: "event",
          status: event.status || "pending",
          description: event.description,
        });
      });
    }

    return allEvents;
  }, [data]);

  // Helper function for video URL validation - moved before getAllVideos
  const isVideoUrl = (url, videoUrl = null) => {
    const isUrlValid =
      url?.match(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/) ||
      url?.includes("zoom.us");

    if (videoUrl) {
      const isVideoUrlValid =
        videoUrl?.match(
          /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/
        ) || videoUrl?.includes("zoom.us");
      return isUrlValid || isVideoUrlValid;
    }

    return isUrlValid;
  };

  // Add helper functions for video and attachment processing
  const getAllVideos = useMemo(() => {
    if (!data?.content) return [];

    const allVideos = [];

    // Get videos from external links
    if (data.content.externalLinks) {
      data.content.externalLinks.forEach((link) => {
        if (isVideoUrl(link.url)) {
          allVideos.push({
            id: link.id,
            name: link.name,
            description: link.description,
            videoUrl: link.videoUrl || link.url,
            timestamps: link.timestamps || [],
            type: "external_link",
          });
        }
      });
    }

    // Get videos from resources if they exist
    if (data.content.resources) {
      data.content.resources.forEach((resource) => {
        if (isVideoUrl(resource.url)) {
          allVideos.push({
            ...resource,
            id: resource.id,
            name: resource.name,
            description: resource.description,
            videoUrl: resource.videoUrl || resource.url,
            type: "resource",
          });
        }
      });
    }

    return allVideos;
  }, [data]);

  const getAllAttachments = useMemo(() => {
    if (!data?.content?.externalLinks) return [];
    return data.content.externalLinks.reduce((acc, link) => {
      if (link.attachments) {
        return [...acc, ...link.attachments];
      }
      return acc;
    }, []);
  }, [data]);

  // Function to get image attachments
  const getExternalLinkAttachments = (link) => {
    return (link?.attachments || []).filter((attachment) =>
      attachment.type?.toLowerCase().includes("image")
    );
  };

  // Function to construct guide steps from content data
  const constructGuideSteps = () => {
    if (!data?.content || !data?.metadata) return [];

    const contentType = data.metadata.type;

    // For collection type
    if (contentType === "collection" && data.content.externalLinks) {
      // Use external links as steps in the collection
      return data.content.externalLinks.map((link) => ({
        id: link.id,
        name: link.name,
        description: link.description,
        url: link.url,
        date: link.startDate || link.date,
        startDate: link.startDate || link.date,
        endDate: link.endDate || link.startDate || link.date,
        status: link.status,
        attachments: link.attachments || [],
        notations: link.notations || [],
      }));
    }

    // For external link type
    if (contentType === "external_link") {
      // Create a single-step guide from the external link
      return [
        {
          id: data.content.id,
          name: data.content.name,
          description: data.content.description,
          url: data.content.url,
          date: data.content.startDate || data.content.date,
          startDate: data.content.startDate || data.content.date,
          endDate:
            data.content.endDate ||
            data.content.startDate ||
            data.content.date,
          status: data.content.status,
          attachments: data.content.attachments || [],
          notations: data.content.notations || [],
        },
      ];
    }

    // For resource type
    if (contentType === "resource") {
      // Create a single-step guide from the resource
      return [
        {
          id: data.content.id,
          name: data.content.name,
          description: data.content.description,
          url: data.content.url,
          date: data.content.date,
          status: data.content.status,
          attachments: data.content.attachments || [],
          notations: data.content.notations || [],
        },
      ];
    }

    return [];
  };

  const handleCalendarClick = () => {
    // First set calendar view to true
    setShowCalendarView(true);

    // Dispatch an event to set the calendar view mode to week
    const event = new CustomEvent("setCalendarViewMode", {
      detail: {
        viewMode: "week",
        weekViewMode: "calendar",
      },
    });
    window.dispatchEvent(event);

    // Use a longer timeout for mobile devices
    setTimeout(() => {
      if (calendarRef.current) {
        // Try different approaches for maximum compatibility

        // First attempt: element.scrollIntoView
        try {
          calendarRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        } catch (e) {
          console.error("scrollIntoView failed", e);
        }

        // Second attempt: window.scrollTo with element position
        try {
          const yOffset = -50; // Negative offset to account for fixed headers
          const y =
            calendarRef.current.getBoundingClientRect().top +
            window.pageYOffset +
            yOffset;

          window.scrollTo({
            top: y,
            behavior: "smooth",
          });
        } catch (e) {
          console.error("scrollTo failed", e);

          // Final fallback: simple scrollTo without smooth behavior
          try {
            const y =
              calendarRef.current.getBoundingClientRect().top +
              window.pageYOffset -
              50;
            window.scrollTo(0, y);
          } catch (e) {
            console.error("final scrollTo failed", e);
          }
        }
      }
    }, 500); // Longer timeout to ensure rendering is complete
  };

  const filteredContent = useMemo(() => {
    if (!data?.content?.externalLinks) return null;

    const searchLower = searchTerm.toLowerCase();
    const filteredLinks = data.content.externalLinks.filter((link) => {
      const linkStatus = link.status?.toLowerCase() || "pending";
      if (!statusFilter[linkStatus]) {
        return false;
      }

      return (
        !searchTerm ||
        link.name?.toLowerCase().includes(searchLower) ||
        link.url?.toLowerCase().includes(searchLower) ||
        link.description?.toLowerCase().includes(searchLower)
      );
    });
    const sortedEntries = buildSortedExternalLinkTypeEntries(
      filteredLinks,
      data.content.typeOrdering
    );

    return {
      ...data,
      content: {
        ...data.content,
        filteredExternalLinks: sortedEntries.flatMap(([, links]) => links),
      },
    };
  }, [data, searchTerm, statusFilter]);

  // Show loading state until we have confirmed data
  if ((emailValidated && isLoading) || (!emailValidated && !token)) {
    return (
      <div className="grid md:grid-cols-2 gap-6 mt-20 opacity-50">
        <LoadingSkeleton
          lines={5}
          height="32px"
          width={[70, 65, 70, 65]}
          spacing="1.5rem"
        />
      </div>
    );
  }

  // Show email form if token exists but email is not validated
  if (token && !emailValidated) {
    return (
      <SharedLinkEmailForm
        onEmailSubmit={handleEmailSubmit}
        loading={validateEmailMutation.isPending}
        error={error}
      />
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
            {error ||
              "This shared link is invalid, expired, or has been revoked."}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => router.push("/")}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Return to Home
            </button>
            {emailValidated && (
              <button
                onClick={clearEmail}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Try Different Email
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!data.content || !data.metadata) {
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

  const guideSteps = constructGuideSteps();
  const hasGuideContent = guideSteps.length > 0;

  // Always show guide view option if there's valid content for it
  const showGuideViewOption = hasGuideContent;

  const renderContent = () => {
    // If guide view is enabled and available, show it
    if (showGuideView && showGuideViewOption) {
      return (
        <GuideView
          collection={{
            name: content.name,
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
          sharedToken={token}
        />
      );
    }

    // Otherwise show the regular content
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
    // Handle external links collection
    if (collection.externalLinks?.length > 0) {
      // Update contentCount to consider only the filtered links
      const filteredContentCount =
        filteredContent.content.filteredExternalLinks.length;

      return (
        <div className="rounded-lg border border-slate-300 shadow-[0_0_50px_rgba(59,130,246,0.2)] text-slate-600">
          {/* Header Section - updated to match main version */}
          <div className="bg-slate-100 border border-slate-200 text-slate-800 rounded-t-lg p-8">
            <div className="flex flex-col gap-4 xl:flex-row md:items-center md:justify-between">
              {/* Title and description */}
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  {collection.name}
                </h1>
                <div className="text-slate-600 mt-2 max-h-[4.5em] overflow-y-auto">
                  <CustomEditor
                    content={collection.description}
                    readOnly={true}
                    transparent={true}
                    textColor="text-slate-700"
                    scrollable={true}
                    compact={true}
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 justify-end order-first md:order-last">
                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm border border-blue-200">
                  {collection.visibility === "public" ? (
                    <div className="flex items-center gap-2">Public</div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FaLock className="text-[10px]" />
                      Shared
                    </div>
                  )}
                </div>
                <button
                  onClick={() =>
                    setViewMode(viewMode === "card" ? "list" : "card")
                  }
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                  title={
                    viewMode === "card"
                      ? "Switch to List View"
                      : "Switch to Card View"
                  }
                >
                  <FontAwesomeIcon
                    icon={viewMode === "list" ? faTableCells : faList}
                    className="w-3 h-3"
                  />
                </button>
                <div className="relative" ref={calendarButtonRef}>
                  <button
                    onClick={handleCalendarClick}
                    onMouseEnter={() => {
                      // Only set on desktop devices (non-touch)
                      if (window.matchMedia("(hover: hover)").matches) {
                        setShowCalendarHover(true);
                      }
                    }}
                    onMouseLeave={() => {
                      // Add a small delay before hiding to allow moving to the popup
                      setTimeout(() => {
                        // Only hide if mouse is not over the popup area
                        const popup = document.querySelector(
                          ".calendar-hover-card"
                        );
                        if (popup && !popup.matches(":hover")) {
                          setShowCalendarHover(false);
                        } else if (!popup) {
                          setShowCalendarHover(false);
                        }
                      }, 100);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                    aria-label="View calendar"
                  >
                    <FaCalendar />
                  </button>
                  {showCalendarHover && combinedEvents?.length > 0 && (
                    <>
                      {/* Invisible bridge to prevent hover loss */}
                      <div className="absolute right-0 top-full w-full h-1 z-40"></div>
                      <div
                        className="absolute right-0 top-full mt-1 z-50 calendar-hover-card"
                        onMouseEnter={() => {
                          // Keep the popup open when hovering over it
                          setShowCalendarHover(true);
                        }}
                        onMouseLeave={() => {
                          // Hide when leaving the popup
                          setShowCalendarHover(false);
                        }}
                      >
                        <CalendarHoverInfo
                          events={combinedEvents}
                          onClose={() => setShowCalendarHover(false)}
                          isSharedView={true}
                        />
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowVideoBrowser(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                >
                  <FaVideo />
                  {getAllVideos.length > 0 && (
                    <span className="text-xs">{getAllVideos.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setShowAttachmentsModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                >
                  <FaPaperclip />
                  {getAllAttachments?.length > 0 && (
                    <span className="text-xs">{getAllAttachments?.length}</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
              <div className="relative flex-grow flex items-center">
                <div className="relative flex-grow">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search external links..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="relative ml-2" ref={filterMenuRef}>
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="p-4 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400/80 transition-colors flex items-center"
                    title="Filter options"
                  >
                    <FaFilter />
                  </button>

                  {showFilterMenu && (
                    <StatusFilterMenu
                      statusFilter={statusFilter}
                      onStatusFilterChange={setStatusFilter}
                      getStatusCount={(status) => {
                        return (collection.externalLinks || []).filter(
                          (link) =>
                            (link.status?.toLowerCase() || "pending") === status
                        ).length;
                      }}
                      STATUS_OPTIONS={STATUS_OPTIONS}
                    />
                  )}
                </div>
              </div>
            </div>

            {filteredContentCount === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No links found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <ResourcesGrid
                collection={collection}
                filteredCollectionResources={
                  filteredContent.content.filteredExternalLinks
                }
                resourceTypes={[]}
                flippedCardId={flippedCardId}
                setFlippedCardId={setFlippedCardId}
                isAdmin={false}
                handleDeleteResource={() => {}}
                handleDeleteExternalLink={() => {}}
                handleViewAllResources={() => {}}
                onUpdateExternalLink={() => {}}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isSharedView={true}
                sharedToken={token}
                externalTypeOrdering={collection.typeOrdering}
              />
            )}
          </div>

          {showCalendarView && combinedEvents.length > 0 && (
            <div
              ref={calendarRef}
              id="calendar-section"
              className="mt-8 bg-white rounded-lg shadow-md p-6 calendar-container scroll-mt-20"
            >
              <h2 className="text-2xl font-bold mb-4 text-slate-700">
                Collection Timeline
              </h2>
              <Calendar
                events={combinedEvents}
                organizations={[]}
                isExternal={true}
                initialView="week"
                onExternalLinkClick={(id) => {
                  if (id) {
                    const url = `/shared/${id}?token=${token}${
                      email ? `&email=${encodeURIComponent(email)}` : ""
                    }`;
                    window.open(url, "_blank");
                  }
                }}
              />
            </div>
          )}

          {showCalendarView && combinedEvents.length === 0 && (
            <div
              ref={calendarRef}
              id="calendar-section-empty"
              className="mt-8 bg-white rounded-lg shadow-md p-6 text-center calendar-container scroll-mt-20"
            >
              <h2 className="text-xl font-semibold mb-2 text-slate-700">
                No Dates Found
              </h2>
              <p className="text-gray-500">
                This collection doesn&apos;t have any external links with
                associated dates.
              </p>
            </div>
          )}
        </div>
      );
    }

    // Handle resources collection
    if (collection.resources?.length > 0) {
      const filteredResources = collection.resources.filter((resource) => {
        const resourceStatus = resource.status?.toLowerCase() || "pending";
        return statusFilter[resourceStatus];
      });

      return (
        <div className="rounded-lg border border-slate-300 shadow-[0_0_50px_rgba(59,130,246,0.2)] text-slate-600">
          {/* Header Section - updated to match main version */}
          <div className="bg-slate-100 border border-slate-200 text-slate-800 rounded-t-lg p-8">
            <div className="flex flex-col gap-4 xl:flex-row md:items-center md:justify-between">
              {/* Title and description */}
              <div>
                <h1 className="text-3xl font-bold text-slate-800">
                  {collection.name}
                </h1>
                <div className="text-slate-600 mt-2 max-h-[4.5em] overflow-y-auto">
                  <CustomEditor
                    content={collection.description}
                    readOnly={true}
                    transparent={true}
                    textColor="text-slate-700"
                    scrollable={true}
                    compact={true}
                  />
                </div>
              </div>

              {/* Action buttons - full width on mobile, aligned right on desktop */}
              <div className="flex items-center gap-2 justify-end order-first md:order-last">
                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm border border-blue-200">
                  {collection.visibility === "public" ? (
                    <div className="flex items-center gap-2">Public</div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FaLock className="text-[10px]" />
                      Shared
                    </div>
                  )}
                </div>
                <button
                  onClick={() =>
                    setViewMode(viewMode === "card" ? "list" : "card")
                  }
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                  title={
                    viewMode === "card"
                      ? "Switch to List View"
                      : "Switch to Card View"
                  }
                >
                  <FontAwesomeIcon
                    icon={viewMode === "list" ? faTableCells : faList}
                    className="w-3 h-3"
                  />
                </button>
                <div className="relative" ref={calendarButtonRef}>
                  <button
                    onClick={handleCalendarClick}
                    onMouseEnter={() => {
                      // Only set on desktop devices (non-touch)
                      if (window.matchMedia("(hover: hover)").matches) {
                        setShowCalendarHover(true);
                      }
                    }}
                    onMouseLeave={() => {
                      // Add a small delay before hiding to allow moving to the popup
                      setTimeout(() => {
                        // Only hide if mouse is not over the popup area
                        const popup = document.querySelector(
                          ".calendar-hover-card"
                        );
                        if (popup && !popup.matches(":hover")) {
                          setShowCalendarHover(false);
                        } else if (!popup) {
                          setShowCalendarHover(false);
                        }
                      }, 100);
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                    aria-label="View calendar"
                  >
                    <FaCalendar />
                  </button>
                  {showCalendarHover && combinedEvents?.length > 0 && (
                    <>
                      {/* Invisible bridge to prevent hover loss */}
                      <div className="absolute right-0 top-full w-full h-1 z-40"></div>
                      <div
                        className="absolute right-0 top-full mt-1 z-50 calendar-hover-card"
                        onMouseEnter={() => {
                          // Keep the popup open when hovering over it
                          setShowCalendarHover(true);
                        }}
                        onMouseLeave={() => {
                          // Hide when leaving the popup
                          setShowCalendarHover(false);
                        }}
                      >
                        <CalendarHoverInfo
                          events={combinedEvents}
                          onClose={() => setShowCalendarHover(false)}
                          isSharedView={true}
                        />
                      </div>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setShowVideoBrowser(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-md text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                >
                  <FaVideo />
                  {getAllVideos.length > 0 && (
                    <span className="text-xs">{getAllVideos.length}</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
              <div className="relative flex-grow flex items-center">
                <div className="relative flex-grow">
                  <FaSearch className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search resources..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="relative ml-2" ref={filterMenuRef}>
                  <button
                    onClick={() => setShowFilterMenu(!showFilterMenu)}
                    className="p-4 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400/80 transition-colors flex items-center"
                    title="Filter options"
                  >
                    <FaFilter />
                  </button>

                  {showFilterMenu && (
                    <StatusFilterMenu
                      statusFilter={statusFilter}
                      onStatusFilterChange={setStatusFilter}
                      getStatusCount={(status) => {
                        return collection.resources.filter(
                          (resource) =>
                            (resource.status?.toLowerCase() || "pending") ===
                            status
                        ).length;
                      }}
                      STATUS_OPTIONS={STATUS_OPTIONS}
                    />
                  )}
                </div>
              </div>
            </div>

            {filteredResources.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <div className="text-gray-400 mb-4">
                  <svg
                    className="mx-auto h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No resources found
                </h3>
                <p className="text-gray-500">
                  Try adjusting your search or filter criteria.
                </p>
              </div>
            ) : (
              <ResourcesGrid
                collection={collection}
                filteredCollectionResources={filteredResources}
                resourceTypes={[]}
                flippedCardId={flippedCardId}
                setFlippedCardId={setFlippedCardId}
                isAdmin={false}
                handleDeleteResource={() => {}}
                handleDeleteExternalLink={() => {}}
                handleViewAllResources={() => {}}
                onUpdateExternalLink={() => {}}
                viewMode={viewMode}
                setViewMode={setViewMode}
                isSharedView={true}
                sharedToken={token}
              />
            )}
          </div>

          {showCalendarView && combinedEvents.length > 0 && (
            <div
              ref={calendarRef}
              id="calendar-section"
              className="mt-8 bg-white rounded-lg shadow-md p-6 calendar-container scroll-mt-20"
            >
              <h2 className="text-2xl font-bold mb-4 text-slate-700">
                Collection Timeline
              </h2>
              <Calendar
                events={combinedEvents}
                organizations={[]}
                isExternal={false}
                initialView="week"
                onExternalLinkClick={(id) => {
                  if (id) {
                    const url = `/shared/${id}?token=${token}${
                      email ? `&email=${encodeURIComponent(email)}` : ""
                    }`;
                    window.open(url, "_blank");
                  }
                }}
              />
            </div>
          )}

          {showCalendarView && combinedEvents.length === 0 && (
            <div
              ref={calendarRef}
              id="calendar-section-empty"
              className="mt-8 bg-white rounded-lg shadow-md p-6 text-center calendar-container scroll-mt-20"
            >
              <h2 className="text-xl font-semibold mb-2 text-slate-700">
                No Dates Found
              </h2>
              <p className="text-gray-500">
                This collection doesn&apos;t have any resources with associated
                dates.
              </p>
            </div>
          )}
        </div>
      );
    }

    // Handle empty collection
    return (
      <div className="rounded-lg border border-slate-300 shadow-[0_0_50px_rgba(59,130,246,0.2)] text-slate-600">
        {/* Header Section - show collection info even when empty */}
        <div className="bg-slate-100 border border-slate-200 text-slate-800 rounded-t-lg p-8">
          <div className="flex flex-col gap-4 xl:flex-row md:items-center md:justify-between">
            {/* Title and description */}
            <div>
              <h1 className="text-3xl font-bold text-slate-800">
                {collection.name}
              </h1>
              <div className="text-slate-600 mt-2 max-h-[4.5em] overflow-y-auto">
                <CustomEditor
                  content={collection.description}
                  readOnly={true}
                  transparent={true}
                  textColor="text-slate-700"
                  scrollable={true}
                  compact={true}
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 justify-end order-first md:order-last">
              <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm border border-blue-200">
                {collection.visibility === "public" ? (
                  <div className="flex items-center gap-2">Public</div>
                ) : (
                  <div className="flex items-center gap-2">
                    <FaLock className="text-[10px]" />
                    Shared
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Empty state content */}
        <div className="p-8">
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 mb-4">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No content found in this collection
            </h3>
            <p className="text-gray-500 mb-4">
              This collection doesn&apos;t contain any external links or
              resources yet.
            </p>

            {/* Debug information - only show in development */}
            {process.env.NODE_ENV === "development" && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Debug Information:
                </h4>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    External Links: {collection.externalLinks?.length || 0}
                  </div>
                  <div>Resources: {collection.resources?.length || 0}</div>
                  <div>Collection ID: {collection.id}</div>
                  <div>Visibility: {collection.visibility}</div>
                  <div>Access Level: {accessLevel}</div>
                  <div>Email: {email}</div>
                  <div>Token: {token ? "Present" : "Missing"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResource = (resource) => {
    return (
      <div className="rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 rounded-t-lg">
          <h1 className="text-3xl font-bold mb-4">{resource.name}</h1>
          {resource.resourceType && (
            <span className="bg-blue-500/20 text-blue-100 px-3 py-1 rounded-full text-sm">
              {resource.resourceType?.name}
            </span>
          )}
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

          <ResourceAttachmentsSection attachments={resource.attachments} />

          {Object.keys(resource.linkGroups || {}).length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <FaExternalLinkAlt className="text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-800">
                  Related Links
                </h2>
              </div>
              <LinkGroups linkGroups={resource.linkGroups} editable={false} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderExternalLink = ({ content, metadata }) => {
    // Ensure we're passing all notations (don't filter by status)
    const modifiedContent = {
      ...content,
      // Make sure notations are not filtered
      notations: content.notations || [],
    };

    return (
      <div className="rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <ExternalLinkDetails
          externalLink={{ ...modifiedContent, metadata }}
          isReadOnly={true}
          sharedToken={token}
          sharedEmail={email}
          showAllNotations={true}
          pinnedItems={[]}
        />
      </div>
    );
  };

  return (
    <div className="w-full md:w-11/12 mx-auto p-4 md:p-8 mb-20">
      <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center mb-4 bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 gap-2">
        <div className="flex items-center">
          <FaCalendarAlt className="text-blue-500 mr-2" />
          <span className="font-medium">Shared content expires:</span>{" "}
          <span className="ml-1">
            {metadata?.expiresAt
              ? new Date(metadata.expiresAt).toLocaleDateString()
              : "Never"}
          </span>
        </div>

        {/* Access Level and Email Info */}
        <div className="flex items-center gap-2 sm:ml-4">
          <span
            className={`px-3 py-1 rounded-full text-xs ${
              accessLevel === "email_authorized"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {accessLevel === "email_authorized"
              ? "Full Access"
              : "Public Content Only"}
          </span>
          <span className="text-xs text-gray-600">({email})</span>
          <button
            onClick={clearEmail}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Change Email
          </button>
        </div>

        <div className="flex items-center gap-2 sm:ml-auto">
          {showGuideViewOption && (
            <button
              onClick={toggleGuideView}
              className={`flex items-center gap-1 px-3 py-1 ${
                showGuideView
                  ? "bg-blue-600 text-white"
                  : "bg-white text-blue-600"
              } rounded border ${
                showGuideView ? "border-blue-700" : "border-blue-300"
              } text-xs transition-colors`}
              title={showGuideView ? "Exit Guide View" : "Enter Guide View"}
            >
              <FaBookOpen className="text-xs" />
              <span>{showGuideView ? "Exit Guide" : "Guide View"}</span>
            </button>
          )}
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs">
            <FaLock className="inline-block mr-1 text-[10px]" />
            Shared
          </span>
        </div>
      </div>

      {/* Access Level Notice */}
      {accessLevel === "public_only" && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">
            <strong>Note:</strong> You&apos;re viewing public content only. Some
            items may be hidden. Contact the content owner if you need access to
            additional materials.
          </p>
        </div>
      )}

      {renderContent()}

      {/* Add VideoBrowser component */}
      <VideoBrowser
        videos={getAllVideos}
        isOpen={showVideoBrowser}
        onClose={() => setShowVideoBrowser(false)}
        onEdit={() => {}}
        onDelete={() => {}}
      />

      {/* Add AttachmentsModal component */}
      <AttachmentsModal
        isOpen={showAttachmentsModal}
        onClose={() => setShowAttachmentsModal(false)}
        attachments={getAllAttachments || []}
        isAdmin={false}
        title={`${data?.content?.name} Attachments`}
      />
    </div>
  );
}
