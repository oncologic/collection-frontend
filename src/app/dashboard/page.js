"use client";
import { Suspense } from "react";
import Fundraiser from "../components/cards/EventCard";
import {
  useEvents,
  useEventsForSubscriptions,
  useEventsPaginated,
} from "../hooks/useEvents";
import {
  useOrganizations,
  useUserSubscriptions,
} from "../hooks/useOrganizations";
import { useRouter, useSearchParams } from "next/navigation";
import { DateTime } from "luxon";

import { useFetchSurveys } from "../hooks/useSurveys";

import {
  useGetAllCollections,
  useGetResources,
  useResourcesForSubscriptions,
} from "../hooks/useResources";
import { useContextAuth } from "../context/authContext";
import { useState, useMemo, useRef, useEffect } from "react";
import Modal from "../components/Modal";
import LoadingSkeleton from "../components/LoadingSkeleton";
import ViewAllOrganizationsModal from "../components/modals/ViewAllOrganizationsModal";
import ViewAllSurveysModal from "../components/modals/ViewAllSurveysModal";
import ViewAllEventsModal from "../components/modals/ViewAllEventsModal";
import ViewAllResourcesModal from "../components/modals/ViewAllResourcesModal";

import UserProfileModal from "../components/modals/UserProfileModal";

import { toast } from "react-hot-toast";
import { useAIChat } from "../hooks/useAI";
import CustomChat from "../components/CustomChat";
import QuickActionsButton from "../components/QuickActionsButton";

import {
  FaArrowCircleUp,
  FaCheckCircle,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaThumbtack,
  FaCalendar,
  FaMagic,
} from "react-icons/fa";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";

import ExternalCollectionCard from "../components/cards/ExternalCollectionCard";
import CollectionCard from "../components/cards/CollectionCard";
import Link from "next/link";
import { useUpdateUser } from "../hooks/useUsers";
import { faLess } from "@fortawesome/free-brands-svg-icons";
import { useGetPinnedItems, useUnpinItems } from "../hooks/usePinned";
import Calendar from "../components/events/Calendar";
import PendingInvitationsNotification from "../components/PendingInvitationsNotification";
import {
  useGetPendingInvitations,
  useAcceptPendingInvitations,
} from "../hooks/useCollections";
import { useSocialMediaAccounts } from "../hooks/useSocialMedia";
import { getDateRangeValues } from "../utils/general";
import {
  createWorkflowInstanceFromTemplate,
  getWorkflowTimeline,
} from "../api/collectionsApi";

// Add this utility function near the top of the file, after imports
const formatHeaderText = (text) => {
  return text
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const WORKFLOW_INTENT_TERMS = [
  "app idea",
  "build an app",
  "build this project",
  "bring this project to life",
  "bring this idea to life",
  "new idea",
  "how long",
  "what will be needed",
  "what is needed",
  "what do i need",
  "what would be needed",
  "determine what will be needed",
  "timeline",
  "project plan",
  "workflow",
  "template",
];

const WORKFLOW_CREATION_TERMS = [
  "app",
  "application",
  "idea",
  "project",
  "product",
  "platform",
  "system",
  "tool",
  "website",
];

const WORKFLOW_PLANNING_TERMS = [
  "build",
  "create",
  "develop",
  "make",
  "launch",
  "bring",
  "needed",
  "requirements",
  "timeline",
  "how long",
  "project plan",
  "workflow",
  "template",
];

const PLANNER_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "and",
  "app",
  "are",
  "build",
  "can",
  "could",
  "for",
  "from",
  "have",
  "how",
  "idea",
  "into",
  "like",
  "long",
  "need",
  "project",
  "that",
  "the",
  "this",
  "time",
  "take",
  "will",
  "with",
]);

const DATE_MS = 24 * 60 * 60 * 1000;

const parsePlannerDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  const date = new Date(
    String(value).includes("T") ? value : `${value}T00:00:00`
  );
  return Number.isNaN(date.getTime()) ? null : date;
};

const toPlannerDateString = (value) => {
  const date = parsePlannerDate(value);
  if (!date) return "";
  return date.toISOString().slice(0, 10);
};

const addPlannerDays = (value, days) => {
  const date = parsePlannerDate(value);
  if (!date) return "";
  date.setDate(date.getDate() + days);
  return toPlannerDateString(date);
};

const plannerDayDelta = (start, end) => {
  const startDate = parsePlannerDate(start);
  const endDate = parsePlannerDate(end);
  if (!startDate || !endDate) return 0;
  return Math.round((endDate - startDate) / DATE_MS);
};

const plannerDaysBetweenInclusive = (start, end) => {
  const startDate = parsePlannerDate(start);
  const endDate = parsePlannerDate(end || start);
  if (!startDate || !endDate) return 1;
  return Math.max(1, Math.round((endDate - startDate) / DATE_MS) + 1);
};

const formatPlannerDate = (value) => {
  const date = parsePlannerDate(value);
  if (!date) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const tokenizePlannerText = (value) =>
  String(value || "")
    .toLowerCase()
    .split(/\W+/)
    .filter(
      (word) =>
        word.length > 2 &&
        !PLANNER_STOP_WORDS.has(word) &&
        !/^\d+$/.test(word)
    );

const isWorkflowPlanningPrompt = (prompt) => {
  const lower = String(prompt || "").toLowerCase();
  const hasExplicitIntent = WORKFLOW_INTENT_TERMS.some((term) =>
    lower.includes(term)
  );
  const hasCreationTerm = WORKFLOW_CREATION_TERMS.some((term) =>
    lower.includes(term)
  );
  const hasPlanningTerm = WORKFLOW_PLANNING_TERMS.some((term) =>
    lower.includes(term)
  );

  return hasCreationTerm && (hasExplicitIntent || hasPlanningTerm);
};

const isWorkflowTemplateCollection = (collection) => {
  const kind = String(collection?.workflowMetadata?.kind || "").toLowerCase();
  return (
    kind === "template" ||
    kind === "workflow_template" ||
    collection?.type === "workflow_template"
  );
};

const scoreWorkflowTemplate = (collection, prompt) => {
  const promptTokens = new Set(tokenizePlannerText(prompt));
  const templateTokens = tokenizePlannerText(
    [
      collection?.name,
      collection?.description,
      collection?.hashtags?.join?.(" "),
      collection?.workflowMetadata?.domain,
      collection?.workflowMetadata?.useCase,
    ]
      .filter(Boolean)
      .join(" ")
  );

  const overlapScore = templateTokens.reduce(
    (score, token) => score + (promptTokens.has(token) ? 1 : 0),
    0
  );

  return overlapScore + Number(collection?.externalLinksCount || 0) / 100;
};

const buildProjectNameFromPrompt = (prompt) => {
  const cleaned = String(prompt || "")
    .replace(
      /\b(how long|will it take|would it take|to build|build|app idea|project)\b/gi,
      ""
    )
    .replace(/[?.!]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return "New workflow project";
  return cleaned.length > 70 ? `${cleaned.slice(0, 67)}...` : cleaned;
};

const buildPlannerStepDrafts = (steps, projectStartDate, templateStartDate) => {
  const baseDate =
    toPlannerDateString(templateStartDate) ||
    toPlannerDateString(steps?.[0]?.startDate) ||
    projectStartDate;

  return (steps || []).reduce((drafts, step, index) => {
    const metadata = step.workflowMetadata || {};
    const hasRelativeStartDay = Number.isFinite(
      Number(metadata.relativeStartDay)
    );
    const relativeStartDay = hasRelativeStartDay
      ? Number(metadata.relativeStartDay)
      : Math.max(0, plannerDayDelta(baseDate, step.startDate));
    const durationDays =
      Number(step.estimatedDurationDays) ||
      Number(metadata.estimatedDurationDays) ||
      plannerDaysBetweenInclusive(step.startDate, step.endDate);
    const startDate = addPlannerDays(
      projectStartDate,
      hasRelativeStartDay ? relativeStartDay : relativeStartDay || index
    );

    drafts[step.id] = {
      startDate,
      endDate: addPlannerDays(startDate, Math.max(0, durationDays - 1)),
    };

    return drafts;
  }, {});
};

const DashboardContent = ({
  // Add props for data that was previously fetched
  subscribedEvents = [],
  subscribedOrganizations = [],
  organizations = [],
  surveys = [],
  subscribedResources = [],
  allResources = [],
  isAdmin,
  allEvents = [],
  isAdvocate,
  // Loading states if needed
  isLoading,
}) => {
  const { getToken } = useAuth();
  const { isSignedIn, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    isAdmin: contextAdmin,
    isAdvocate: contextAdvocate,
    systemUser,
    refetchUserData,
    getAuthHeader,
  } = useContextAuth();
  const queryClient = useQueryClient();

  // Redirect if not signed in
  useEffect(() => {
    if (user === null && !isLoading) {
      router.push("/sign-in");
    }
  }, [user, isLoading, router]);

  const [activeTab, setActiveTab] = useState("subscribed");
  const { mutateAsync: unpinItemsAsync } = useUnpinItems();

  const [chatHistory, setChatHistory] = useState([]);
  const [chatFilters, setChatFilters] = useState({});
  const [workflowPlanner, setWorkflowPlanner] = useState(null);
  const [isCreatingWorkflowProject, setIsCreatingWorkflowProject] =
    useState(false);

  // Add this new state for the user profile modal
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [urlParams, setUrlParams] = useState(null);

  // Check for URL parameters on component mount
  useEffect(() => {
    const plan = searchParams.get("plan");
    const tenant = searchParams.get("tenant");

    if (plan || tenant) {
      setUrlParams({
        plan,
        tenant,
      });

      // Auto-open profile modal if user came from pricing page or with tenant param
      setIsProfileModalOpen(true);

      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams, systemUser]);

  // Tenant selection modal is now handled in Layout.js for new users
  // and in tutorials page for users with only kidney tenant

  // Add this near other useState declarations (around line 31)
  const [includedCollections, setIncludedCollections] = useState(new Set());

  // Auto-acceptance logic for pending invitations
  const [hasAttemptedAutoAccept, setHasAttemptedAutoAccept] = useState(false);
  const { data: pendingInvitations } = useGetPendingInvitations();
  const { mutate: acceptAllInvitations } = useAcceptPendingInvitations();

  // Auto-accept pending invitations when user first loads dashboard
  useEffect(() => {
    if (
      !hasAttemptedAutoAccept &&
      pendingInvitations?.data?.length > 0 &&
      isSignedIn
    ) {
      setHasAttemptedAutoAccept(true);
      acceptAllInvitations(undefined, {
        onSuccess: (data) => {
          if (data.data.acceptedCount > 0) {
            toast.success(
              `Welcome! Accepted ${data.data.acceptedCount} pending collaborations.`,
              { duration: 4000 }
            );
          }
        },
        onError: (error) => {
          // Don't show error toast as user will see the pending invitations notification
        },
      });
    }
  }, [
    hasAttemptedAutoAccept,
    pendingInvitations,
    isSignedIn,
    acceptAllInvitations,
  ]);

  // Display memo
  const displayEvents = useMemo(
    () => (activeTab === "subscribed" ? subscribedEvents : allEvents),
    [activeTab, subscribedEvents, allEvents]
  );
  const displayResources = useMemo(
    () => (activeTab === "subscribed" ? subscribedResources : allResources),
    [activeTab, subscribedResources, allResources]
  );

  // State to track current calendar view month
  const [calendarMonth, setCalendarMonth] = useState(() => DateTime.now());

  // Calculate date range for events based on calendar month
  // Fetch events for current month + 1 month buffer on each side
  const eventDateRange = useMemo(() => {
    const startOfPrevMonth = calendarMonth
      .minus({ months: 1 })
      .startOf("month");
    const endOfNextMonth = calendarMonth.plus({ months: 1 }).endOf("month");

    return {
      filterStartDate: startOfPrevMonth.toISODate(),
      filterEndDate: endOfNextMonth.toISODate(),
    };
  }, [calendarMonth]);

  // Use paginated events with date range filtering
  const { data: paginatedEventsData, isLoading: eventsLoading } =
    useEventsPaginated({
      page: 1,
      limit: 100, // Maximum allowed by the API
      sortBy: "startDate",
      sortOrder: "asc", // Ascending order for calendar display
      ...eventDateRange, // Include date range filters
    });

  // Get events data, using empty array as fallback
  const allEventsData = paginatedEventsData?.data || [];

  const { data: allResourcesData } = useGetResources();
  const { data: allCollectionsData } = useGetAllCollections();
  const { data: allOrganizationsData } = useOrganizations();
  const { data: allSocialMediaAccountsData } = useSocialMediaAccounts();
  const { data: pinnedItems, refetch: refetchPinnedItems } =
    useGetPinnedItems();
  const { mutateAsync: updateUserAsync } = useUpdateUser();
  const [chatData, setChatData] = useState(null);

  // Separate state for resource search
  const [resourceSearchTerm, setResourceSearchTerm] = useState("");

  // Add state for section collapse
  const [collapsedSections, setCollapsedSections] = useState({
    collections: false, // Open by default
    resources: true,
    events: true,
    organizations: true,
    links: true,
  });

  // Add state for showing all categories
  const [showAllCategories, setShowAllCategories] = useState(false);

  // Group pinned items by type
  const groupedPinnedItems = useMemo(() => {
    if (!pinnedItems) return {};

    return pinnedItems.reduce((acc, item) => {
      // Determine the correct type based on available properties
      let type = item.type || "other";

      // Special handling for external links - look for the externalLinks object property
      if (item.externalLinks && Object.keys(item.externalLinks).length > 0) {
        type = "external_link";
      }

      if (!acc[type]) acc[type] = [];
      acc[type].push(item);
      return acc;
    }, {});
  }, [pinnedItems]);

  // Helper function to get the proper section key for collapsedSections
  const getSectionKey = (category) => {
    if (category === "external_link") return "links";
    if (category === "collection") return "collections";
    return category + "s";
  };

  // Helper function to get display title
  const getDisplayTitle = (category) => {
    if (category === "external_link") return "External Links";
    return formatHeaderText(category + "s");
  };

  // Determine default categories and ensure they're expanded
  const { defaultCategories, remainingCategories } = useMemo(() => {
    const availableCategories = Object.entries(groupedPinnedItems).filter(
      ([_, items]) => items?.length > 0
    );

    const defaultCats = [];
    const remainingCats = [];

    // Always try to show collections first if they exist
    if (groupedPinnedItems.collection?.length > 0) {
      defaultCats.push(["collection", groupedPinnedItems.collection]);
    }

    // If no collections, show the first available category
    if (defaultCats.length === 0 && availableCategories.length > 0) {
      defaultCats.push(availableCategories[0]);
    }

    // Add remaining categories to the "show more" list
    availableCategories.forEach(([category, items]) => {
      const isAlreadyDefault = defaultCats.some(
        ([defaultCat]) => defaultCat === category
      );
      if (!isAlreadyDefault) {
        remainingCats.push([category, items]);
      }
    });

    return {
      defaultCategories: defaultCats,
      remainingCategories: remainingCats,
    };
  }, [groupedPinnedItems]);

  // Ensure default categories are expanded
  useEffect(() => {
    if (defaultCategories.length > 0) {
      setCollapsedSections((prev) => {
        const newState = { ...prev };
        defaultCategories.forEach(([category]) => {
          const sectionKey = getSectionKey(category);
          newState[sectionKey] = false; // Ensure it's expanded
        });
        return newState;
      });
    }
  }, [defaultCategories.length]);

  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Modify the SectionHeader component to use the new formatting
  const SectionHeader = ({ title, count, isCollapsed, onToggle, items }) => (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 justify-between w-full">
        <div className="flex items-center gap-2">
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-gray-600"
          >
            {isCollapsed ? (
              <FaChevronRight className="w-3 h-3" />
            ) : (
              <FaChevronDown className="w-3 h-3" />
            )}
          </button>
          <h2 className="text-2xl font-bold">
            {formatHeaderText(title)}{" "}
            {count > 0 && (
              <span className="text-gray-400 text-base">({count})</span>
            )}
          </h2>
          {items?.length > 0 && (
            <button
              onClick={() => {
                const formattedItems = items.map((item) => ({
                  ...item,
                  type: title.toLowerCase().slice(0, -1), // Remove 's' from end
                }));
                chatRef.current?.selectAllResources(formattedItems);
                setIncludedCollections(
                  new Set([...includedCollections, ...items.map((i) => i.id)])
                );
                document.querySelector("textarea")?.focus();
              }}
              className="p-2 rounded-lg text-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title={`Add all pinned ${formatHeaderText(
                title
              ).toLowerCase()} to chat`}
            >
              <FaArrowCircleUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            setShowCalendar(!showCalendar);
            if (!showCalendar) {
              setTimeout(() => {
                document.getElementById("calendar-section")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }, 100);
            }
          }}
          className="text-blue-400 hover:text-blue-600 bg-blue-100 border border-blue-200 p-2 rounded-lg"
        >
          <FaCalendar className="w-4 h-4" />
          {/* <span>{showCalendar ? "Hide Calendar" : "Show Calendar"}</span> */}
        </button>
      </div>
    </div>
  );

  // Render pinned items section
  const renderPinnedItems = () => {
    if (!pinnedItems || pinnedItems.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No pinned items yet
        </div>
      );
    }

    const handleUnpin = async (itemId) => {
      try {
        // Proceed with unpinning
        await unpinItemsAsync([itemId]);
        await refetchPinnedItems();
      } catch (error) {
        toast.error("Failed to unpin item");
      }
    };

    const PinnedItemCard = ({ item, category }) => {
      // Add state for showing full title
      const [showFullTitle, setShowFullTitle] = useState(false);

      // Add click timer ref for distinguishing between single and double clicks
      const clickTimerRef = useRef(null);
      const clickCountRef = useRef(0);

      const handleClick = (e) => {
        e.preventDefault(); // Prevent default to handle navigation manually
        clickCountRef.current += 1;

        if (clickCountRef.current === 1) {
          clickTimerRef.current = setTimeout(() => {
            // Single click - navigate
            clickCountRef.current = 0;

            if (item.type === "external_link" && item.externalLinks?.id) {
              window.open(`/external-links/${item.externalLinks.id}`, "_blank");
            } else {
              // For other types, use the appropriate ID
              const navId = item.id || item.pinnedItemId;
              if (!navId) {
                toast.error("Cannot navigate: Missing ID");
                return;
              }
              window.open(
                `/${
                  category === "external_link" ? "external-link" : category
                }s/${navId}`,
                "_blank"
              );
            }
          }, 200); // Small delay to wait for potential second click
        } else if (clickCountRef.current === 2) {
          // Double click - show full title
          clearTimeout(clickTimerRef.current);
          clickCountRef.current = 0;
          setShowFullTitle(true);
          // Auto-hide the title after 2 seconds
          setTimeout(() => setShowFullTitle(false), 2000);
        }
      };

      // Format date from resourceDate or startDate for display
      const formattedDate = useMemo(() => {
        const dateValue = item.resourceDate || item.startDate;
        return dateValue
          ? DateTime.fromISO(dateValue).toFormat("LLL dd, yyyy")
          : null;
      }, [item]);

      // Truncate description for compact display
      const shortDescription = useMemo(() => {
        const description = item.description || "";
        // Strip HTML tags for plain text display
        const plainText = description.replace(/<[^>]*>?/gm, "");
        return plainText.length > 80
          ? plainText.substring(0, 80) + "..."
          : plainText;
      }, [item.description]);

      return (
        <div
          key={item.id}
          className="flex flex-col bg-white p-4 rounded-lg shadow-md shadow-blue-300"
        >
          <div className="flex justify-between items-start mb-1">
            <div className="relative flex-grow">
              {/* Title container with transition */}
              <div className="relative">
                <h2
                  onClick={handleClick}
                  className={`cursor-pointer font-medium transition-all duration-200 ${
                    showFullTitle ? "line-clamp-none" : "line-clamp-1"
                  }`}
                >
                  {item.type === "external_link"
                    ? item.externalLinks?.name ||
                      item.name ||
                      item.title ||
                      "External Link"
                    : item.name || item.title || "Unnamed Item"}
                </h2>
              </div>
            </div>

            <div className="flex flex-row gap-2 ml-2">
              <button
                onClick={() => {
                  chatRef.current?.selectAllResources(
                    [
                      {
                        ...item,
                        type: category,
                      },
                    ],
                    "append"
                  );
                  setIncludedCollections((prev) => new Set([...prev, item.id]));
                  document.querySelector("textarea")?.focus();
                }}
                className={`text-sm rounded-md transition-colors duration-200 ${
                  includedCollections.has(item.id)
                    ? "text-green-500 hover:text-green-700 hover:bg-green-50"
                    : "text-blue-400 hover:text-blue-600 hover:bg-blue-50"
                }`}
              >
                {includedCollections.has(item.id) ? (
                  <FaCheckCircle />
                ) : (
                  <FaArrowCircleUp />
                )}
              </button>
              <button
                onClick={() => {
                  // Use the appropriate ID based on item type
                  let idToUnpin;
                  if (item.type === "external_link" && item.externalLinks?.id) {
                    idToUnpin = item.externalLinks.id;
                  } else {
                    idToUnpin = item.id;
                  }

                  handleUnpin(idToUnpin);
                }}
                className="text-sm rounded-md transition-colors duration-200 text-red-300 hover:text-red-400"
                title="Unpin item"
              >
                <FaThumbtack />
              </button>
            </div>
          </div>

          {/* Date display */}
          {formattedDate && (
            <div className="text-xs text-gray-500 flex items-center mb-1">
              <svg
                className="w-3 h-3 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {formattedDate}
            </div>
          )}

          {/* Short description */}
          {shortDescription && (
            <p className="text-xs text-gray-600 line-clamp-2">
              {shortDescription}
            </p>
          )}
        </div>
      );
    };

    return (
      <div className="flex flex-col gap-8">
        {/* Default Categories - Show collections first, or first available category if no collections */}
        {defaultCategories.map(([category, items]) => {
          const sectionKey = getSectionKey(category);
          const displayTitle = getDisplayTitle(category);

          return (
            <div key={category} className="flex flex-col gap-4">
              <SectionHeader
                title={displayTitle}
                count={items.length}
                isCollapsed={collapsedSections[sectionKey]}
                onToggle={() => toggleSection(sectionKey)}
                items={items}
              />
              {!collapsedSections[sectionKey] && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => (
                    <PinnedItemCard
                      key={item.id}
                      item={item}
                      category={category}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Show more/less button - only show if there are remaining categories */}
        {remainingCategories.length > 0 && (
          <button
            onClick={() => {
              setShowAllCategories(!showAllCategories);
              // When showing more, expand all sections
              if (!showAllCategories) {
                setCollapsedSections((prev) => {
                  const newState = { ...prev };
                  remainingCategories.forEach(([category]) => {
                    const sectionKey = getSectionKey(category);
                    newState[sectionKey] = false;
                  });
                  return newState;
                });
              }
            }}
            className="text-sm text-gray-500 hover:text-gray-700 -mt-4 w-full text-left"
          >
            {showAllCategories
              ? "Show less"
              : `Show ${remainingCategories.length} more ${
                  remainingCategories.length === 1 ? "category" : "categories"
                }`}
          </button>
        )}

        {/* Remaining Categories - Only show when expanded */}
        {showAllCategories &&
          remainingCategories.map(([category, items]) => {
            const sectionKey = getSectionKey(category);
            const displayTitle = getDisplayTitle(category);

            return (
              <div key={category} className="flex flex-col gap-4">
                <SectionHeader
                  title={displayTitle}
                  count={items.length}
                  isCollapsed={collapsedSections[sectionKey]}
                  onToggle={() => toggleSection(sectionKey)}
                  items={items}
                />
                {!collapsedSections[sectionKey] && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map((item) => (
                      <PinnedItemCard
                        key={item.id}
                        item={item}
                        category={category}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    );
  };

  const handleChatComplete = (chatEntry) => {
    setChatHistory((prev) => [
      ...prev,
      {
        id: Date.now(),
        prompt: chatEntry.content?.prompt,
        answer: chatEntry.content?.answer,
        timestamp: chatEntry.timestamp,
        userInfo: chatEntry.userInfo,
      },
    ]);

    setChatData(chatEntry.content?.data);
  };

  const clearChatHistory = () => {
    setChatHistory([]);
    setChatFilters({});
    setAiFilteredResources([]);
    setAiFilteredEvents([]);
    setChatData(null);
  };

  const aiChat = useAIChat();

  const chatRef = useRef();

  const getSelectedPlannerTemplate = () => {
    if (!workflowPlanner) return null;
    return workflowPlanner.templates.find(
      (template) => template.id === workflowPlanner.selectedTemplateId
    );
  };

  const getSelectedPlannerSteps = (planner = workflowPlanner) => {
    if (!planner) return [];
    const template = planner.templates.find(
      (item) => item.id === planner.selectedTemplateId
    );
    if (!template) return [];

    return (template.timelineItems || [])
      .filter((step) => planner.selectedStepIds.includes(step.id))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  };

  const getPlannerSummary = (planner = workflowPlanner) => {
    const steps = getSelectedPlannerSteps(planner);
    const dates = steps.flatMap((step) => {
      const draft = planner?.stepDrafts?.[step.id];
      return [draft?.startDate, draft?.endDate || draft?.startDate].filter(
        Boolean
      );
    });
    const startDate = dates.sort((a, b) => parsePlannerDate(a) - parsePlannerDate(b))[0];
    const endDate = dates
      .sort((a, b) => parsePlannerDate(a) - parsePlannerDate(b))
      .at(-1);
    const totalDays = plannerDaysBetweenInclusive(startDate, endDate);

    return {
      steps,
      startDate,
      endDate,
      totalDays,
      totalWeeks: Math.max(1, Math.ceil(totalDays / 7)),
    };
  };

  const openWorkflowPlannerFromPrompt = async (prompt) => {
    const templateCandidates = (allCollectionsData || [])
      .filter(isWorkflowTemplateCollection)
      .map((collection) => ({
        ...collection,
        matchScore: scoreWorkflowTemplate(collection, prompt),
      }))
      .sort((a, b) => {
        if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
        return Number(b.externalLinksCount || 0) - Number(a.externalLinksCount || 0);
      })
      .slice(0, 5);

    if (templateCandidates.length === 0) {
      setChatHistory((prev) => [
        ...prev,
        {
          id: Date.now(),
          prompt,
          answer:
            "I could not find any workflow template collections yet. Create or seed a collection with workflow template metadata first, then ask again.",
          timestamp: Date.now(),
        },
      ]);
      return;
    }

    const headers = await getAuthHeader();
    const templates = await Promise.all(
      templateCandidates.map(async (template) => {
        try {
          const timeline = await getWorkflowTimeline(template.id, headers);
          return {
            ...template,
            timelineItems: timeline.items || [],
            timelineSummary: timeline.summary || {},
          };
        } catch (error) {
          return {
            ...template,
            timelineItems: [],
            timelineSummary: {},
          };
        }
      })
    );

    const selectedTemplate =
      templates.find((template) => template.timelineItems.length > 0) ||
      templates[0];
    const projectStartDate = toPlannerDateString(new Date());
    const selectedStepIds = (selectedTemplate.timelineItems || []).map(
      (step) => step.id
    );
    const stepDrafts = buildPlannerStepDrafts(
      selectedTemplate.timelineItems || [],
      projectStartDate,
      selectedTemplate.timelineSummary?.startDate
    );

    setWorkflowPlanner({
      prompt,
      templates,
      selectedTemplateId: selectedTemplate.id,
      selectedStepIds,
      stepDrafts,
      projectName: buildProjectNameFromPrompt(prompt),
      startDate: projectStartDate,
      includeResources: true,
    });

    const stepCount = selectedTemplate.timelineItems?.length || 0;
    const durationDays = getPlannerSummary({
      templates,
      selectedTemplateId: selectedTemplate.id,
      selectedStepIds,
      stepDrafts,
      startDate: projectStartDate,
    }).totalDays;

    setChatHistory((prev) => [
      ...prev,
      {
        id: Date.now(),
        prompt,
        answer: `I found ${templates.length} workflow template${
          templates.length === 1 ? "" : "s"
        }. The best match is "${selectedTemplate.name}" with ${stepCount} step${
          stepCount === 1 ? "" : "s"
        }, estimated at about ${Math.ceil(durationDays / 7)} week${
          Math.ceil(durationDays / 7) === 1 ? "" : "s"
        }. Review the template, choose the steps to copy, adjust dates, then create your project.`,
        timestamp: Date.now(),
      },
    ]);
  };

  const handleDashboardBeforeSend = async ({ query, cleanQuery }) => {
    const prompt = cleanQuery || query;
    if (!isWorkflowPlanningPrompt(prompt)) return false;

    try {
      await openWorkflowPlannerFromPrompt(prompt);
    } catch (error) {
      toast.error(error?.message || "Failed to prepare workflow planner");
    }

    return true;
  };

  const handlePlannerTemplateChange = (templateId) => {
    setWorkflowPlanner((prev) => {
      if (!prev) return prev;
      const template = prev.templates.find((item) => item.id === templateId);
      if (!template) return prev;
      const selectedStepIds = (template.timelineItems || []).map((step) => step.id);

      return {
        ...prev,
        selectedTemplateId: templateId,
        selectedStepIds,
        stepDrafts: buildPlannerStepDrafts(
          template.timelineItems || [],
          prev.startDate,
          template.timelineSummary?.startDate
        ),
      };
    });
  };

  const handlePlannerStartDateChange = (startDate) => {
    const nextStartDate = toPlannerDateString(startDate);
    if (!nextStartDate) return;

    setWorkflowPlanner((prev) => {
      if (!prev) return prev;
      const template = prev.templates.find(
        (item) => item.id === prev.selectedTemplateId
      );

      return {
        ...prev,
        startDate: nextStartDate,
        stepDrafts: buildPlannerStepDrafts(
          template?.timelineItems || [],
          nextStartDate,
          template?.timelineSummary?.startDate
        ),
      };
    });
  };

  const handlePlannerStepToggle = (stepId) => {
    setWorkflowPlanner((prev) => {
      if (!prev) return prev;
      const selectedStepIds = prev.selectedStepIds.includes(stepId)
        ? prev.selectedStepIds.filter((id) => id !== stepId)
        : [...prev.selectedStepIds, stepId];

      return {
        ...prev,
        selectedStepIds,
      };
    });
  };

  const handlePlannerStepDateChange = (stepId, field, value) => {
    const nextDate = toPlannerDateString(value);
    if (!nextDate) return;

    setWorkflowPlanner((prev) => {
      if (!prev) return prev;
      const currentDraft = prev.stepDrafts[stepId];
      if (!currentDraft) return prev;

      const nextDraft =
        field === "startDate"
          ? {
              startDate: nextDate,
              endDate: addPlannerDays(
                currentDraft.endDate || currentDraft.startDate,
                plannerDayDelta(currentDraft.startDate, nextDate)
              ),
            }
          : {
              ...currentDraft,
              endDate:
                parsePlannerDate(nextDate) < parsePlannerDate(currentDraft.startDate)
                  ? currentDraft.startDate
                  : nextDate,
            };

      return {
        ...prev,
        stepDrafts: {
          ...prev.stepDrafts,
          [stepId]: nextDraft,
        },
      };
    });
  };

  const handleCreateWorkflowProject = async () => {
    const planner = workflowPlanner;
    if (!planner) return;

    const selectedTemplate = getSelectedPlannerTemplate();
    const selectedSteps = getSelectedPlannerSteps(planner);
    if (!selectedTemplate || selectedSteps.length === 0) {
      toast.error("Select at least one workflow step");
      return;
    }

    setIsCreatingWorkflowProject(true);
    try {
      const headers = await getAuthHeader();
      const result = await createWorkflowInstanceFromTemplate(
        selectedTemplate.id,
        {
          name: planner.projectName || `${selectedTemplate.name} Project`,
          description: `Created from "${selectedTemplate.name}" based on dashboard planning prompt: ${planner.prompt}`,
          startDate: planner.startDate,
          includeResources: planner.includeResources,
          selectedStepIds: selectedSteps.map((step) => step.id),
          stepDateOverrides: selectedSteps.map((step) => ({
            templateStepId: step.id,
            externalLinkId: step.externalLinkId,
            startDate: planner.stepDrafts[step.id]?.startDate,
            endDate: planner.stepDrafts[step.id]?.endDate,
          })),
          workflowMetadata: {
            planningPrompt: planner.prompt,
            createdFromDashboardAssistant: true,
          },
        },
        headers
      );

      await queryClient.invalidateQueries({ queryKey: ["resourceCollections"] });
      setWorkflowPlanner(null);
      toast.success("Workflow project created");
      router.push(`/collections/${result.collection.id}`);
    } catch (error) {
      toast.error(error?.message || "Failed to create workflow project");
    } finally {
      setIsCreatingWorkflowProject(false);
    }
  };

  const handleProfileSubmit = async (profileData) => {
    try {
      // Update user profile with the submitted data
      await updateUserAsync({
        user: {
          id: systemUser?.id,
          userRole: profileData.data?.perspective,
          cancerType: profileData.data?.diagnosisType,
          yearOfBirth: profileData.data?.yearOfBirth?.name
            ? parseInt(profileData.data.yearOfBirth.name)
            : null,
          designation: profileData.data?.knowledgeLevel,
          promptContext: profileData.prompt,
        },
      });

      // Set the generated prompt in the chat
      if (chatRef.current && profileData.prompt) {
        chatRef.current.setPrompt(profileData.prompt);
      }

      // Select relevant resources based on user interests
      if (profileData.data?.interests && chatRef.current) {
        const relevantResources = [];

        // Add all collections by default for comprehensive recommendations
        if (
          allCollectionsData &&
          Array.isArray(allCollectionsData) &&
          allCollectionsData.length > 0
        ) {
          relevantResources.push(
            ...allCollectionsData.map((collection) => ({
              ...collection,
              type: "collection",
            }))
          );
        }

        // Add relevant resources based on interests
        if (allResourcesData?.length > 0) {
          relevantResources.push(
            ...allResourcesData.slice(0, 10).map((resource) => ({
              ...resource,
              type: "resource",
            }))
          );
        }

        // Add relevant events
        if (allEventsData?.length > 0) {
          relevantResources.push(
            ...allEventsData.slice(0, 5).map((event) => ({
              ...event,
              type: "event",
            }))
          );
        }

        // Add relevant organizations
        if (allOrganizationsData?.length > 0) {
          relevantResources.push(
            ...allOrganizationsData.slice(0, 5).map((org) => ({
              ...org,
              type: "organization",
            }))
          );
        }

        // Select the resources in the chat
        chatRef.current.selectAllResources(relevantResources, "replace");
      }

      // Set chat data for AI recommendations
      setChatData({
        prompt: profileData.prompt,
        filters: profileData.data,
        includedCollections: Array.from(includedCollections),
      });

      // Close the modal
      setIsProfileModalOpen(false);

      // Clear URL params after successful submission
      setUrlParams(null);

      toast.success(
        "Profile saved successfully! Your personalized prompt has been added to the chat."
      );
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    }
  };

  const [isSubscribedModalOpen, setIsSubscribedModalOpen] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [showNotationDates, setShowNotationDates] = useState(true);

  // Function to convert pinned items to calendar events
  const getPinnedItemsWithDates = () => {
    const events = [];

    // First, add all Google Calendar events from allEventsData
    if (allEventsData) {
      const googleCalendarEvents = allEventsData.filter(
        (event) => event.isGoogleCalendarEvent
      );
      googleCalendarEvents.forEach((event) => {
        events.push({
          id: event.id,
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate || event.startDate,
          type: "event",
          time: event.startTime, // Add time field
          startTime: event.startTime,
          endTime: event.endTime,
          timezone: event.timezone,
          status: event.status,
          organizations: event.organizations || [],
          isGoogleCalendarEvent: true,
        });
      });
    }

    // Then add pinned items with dates
    if (!pinnedItems) return events;

    const pinnedEvents = pinnedItems
      .filter((item) => {
        // Check for dates in different item types
        if (item.type === "event") {
          return item.startDate;
        } else if (item.type === "resource") {
          return (
            item.resourceDate ||
            (showNotationDates &&
              item.notations?.some((n) => getDateRangeValues(n).startDate))
          );
        } else if (item.type === "collection") {
          return (
            getDateRangeValues(item).startDate ||
            item.items?.some(
              (collectionItem) =>
                collectionItem.resource_date ||
                getDateRangeValues(collectionItem).startDate ||
                (showNotationDates &&
                  collectionItem.notations?.some(
                    (n) => getDateRangeValues(n).startDate
                  ))
            )
          );
        }
        return false;
      })
      .flatMap((item) => {
        const itemEvents = [];

        if (item.type === "event") {
          itemEvents.push({
            id: item.id,
            title: item.title,
            startDate: item.startDate,
            endDate: item.endDate || item.startDate,
            type: "event",
            time: item.startTime, // Add time field
            startTime: item.startTime,
            endTime: item.endTime,
            timezone: item.timezone,
            status: item.status,
            organizations: item.organizations || [],
          });
        } else if (item.type === "resource") {
          // Add resource date if exists
          if (item.resourceDate) {
            itemEvents.push({
              id: item.id,
              title: item.name,
              startDate: item.resourceDate,
              endDate: item.resourceDate,
              status: item?.status,
              type: "resource",
              time: item.startTime, // Map startTime to time for Calendar component
              startTime: item.startTime,
              endTime: item.endTime,
              timezone: item.timezone,
              organizations: item.organizations || [],
            });
          }
          // Add notation dates if enabled
          if (showNotationDates && item.notations) {
            item.notations.forEach((notation) => {
              const notationRange = getDateRangeValues(notation);
              if (notationRange.startDate) {
                itemEvents.push({
                  id: `${item.id}`,
                  title: notation.title || "Untitled Note",
                  notationTitle: notation.title || "Untitled Note",
                  parentTitle: item.name,
                  startDate: notationRange.startDate,
                  endDate: notationRange.endDate,
                  time: notation.startTime, // Map startTime to time for Calendar component
                  startTime: notation.startTime,
                  endTime: notation.endTime,
                  timezone: notation.timezone,
                  type: "notation",
                  notationId: notation.id,
                  status: notation.status,
                  organizations: item.organizations || [],
                  parentId: item.id,
                });
              }
            });
          }
        } else if (item.type === "collection") {
          const collectionRange = getDateRangeValues(item);
          if (collectionRange.startDate) {
            itemEvents.push({
              id: `collection-${item.id}`,
              title: item.name,
              startDate: collectionRange.startDate,
              endDate: collectionRange.endDate,
              type: "collection",
              status: item.status,
            });
          }

          // Process collection items
          item.items?.forEach((collectionItem) => {
            const collectionItemRange = getDateRangeValues(collectionItem);
            // Add item date if exists
            if (collectionItem.resource_date || collectionItemRange.startDate) {
              itemEvents.push({
                id: collectionItem.id,
                title: collectionItem.name,
                startDate:
                  collectionItem.resource_date || collectionItemRange.startDate,
                endDate:
                  collectionItem.resource_date || collectionItemRange.endDate,
                type: collectionItem.resource_date
                  ? "resource"
                  : "external_link",
                time: collectionItem.startTime, // Map startTime to time for Calendar component
                startTime: collectionItem.startTime,
                endTime: collectionItem.endTime,
                timezone: collectionItem.timezone,
                status: collectionItem.status,
                organizations: collectionItem.organizations || [],
              });
            }
            // Add notation dates if enabled
            if (showNotationDates && collectionItem.notations) {
              collectionItem.notations.forEach((notation) => {
                const notationRange = getDateRangeValues(notation);
                if (notationRange.startDate) {
                  itemEvents.push({
                    id: `${collectionItem.id}`,
                    title: notation.title || "Untitled Note",
                    notationTitle: notation.title || "Untitled Note",
                    parentTitle: collectionItem.name,
                    startDate: notationRange.startDate,
                    endDate: notationRange.endDate,
                    time: notation.startTime, // Map startTime to time for Calendar component
                    startTime: notation.startTime,
                    endTime: notation.endTime,
                    timezone: notation.timezone,
                    type: "notation",
                    notationId: notation.id,
                    status: notation?.status,
                    organizations: collectionItem.organizations || [],
                    parentId: collectionItem.id,
                  });
                }
              });
            }
          });
        }
        return itemEvents;
      });

    // Combine Google Calendar events with pinned events
    return [...events, ...pinnedEvents];
  };

  const calendarEvents = useMemo(
    () => getPinnedItemsWithDates(),
    [pinnedItems, showNotationDates, allEventsData]
  );

  // Helper function to check if URL is a video
  const isVideoUrl = (url) => {
    if (!url) return false;
    const videoExtensions = [".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm"];
    const videoHosts = ["youtube.com", "youtu.be", "vimeo.com", "zoom.us"];

    return (
      videoExtensions.some((ext) => url.toLowerCase().includes(ext)) ||
      videoHosts.some((host) => url.toLowerCase().includes(host))
    );
  };

  // Extract all videos from available data
  const allVideos = useMemo(() => {
    const videos = [];

    // Get videos from resources
    if (allResourcesData && Array.isArray(allResourcesData)) {
      const resourceVideos = allResourcesData
        .filter((resource) => isVideoUrl(resource.url))
        .map((resource) => ({
          ...resource,
          type: "video",
          videoUrl: resource.videoUrl || resource.url,
        }));
      videos.push(...resourceVideos);
    }

    // Get videos from collections' external links and resources
    if (allCollectionsData && Array.isArray(allCollectionsData)) {
      allCollectionsData.forEach((collection) => {
        // Videos from external links
        if (collection.externalLinks) {
          const externalLinkVideos = collection.externalLinks
            .filter((link) => isVideoUrl(link.url))
            .map((link) => ({
              id: `${collection.id}-${link.id}`,
              name: link.name,
              description: link.description,
              videoUrl: link.videoUrl || link.url,
              timestamps: link.timestamps || [],
              type: "video",
              collectionName: collection.name,
            }));
          videos.push(...externalLinkVideos);
        }

        // Videos from collection resources
        if (collection.resources) {
          const collectionResourceVideos = collection.resources
            .filter((resource) => isVideoUrl(resource.url))
            .map((resource) => ({
              ...resource,
              id: `${collection.id}-${resource.id}`,
              type: "video",
              videoUrl: resource.videoUrl || resource.url,
              collectionName: collection.name,
            }));
          videos.push(...collectionResourceVideos);
        }
      });
    }

    // Remove duplicates based on URL
    const uniqueVideos = videos.filter(
      (video, index, self) =>
        index === self.findIndex((v) => v.videoUrl === video.videoUrl)
    );

    return uniqueVideos;
  }, [allResourcesData, allCollectionsData]);

  // Extract all social media accounts
  const allSocialMediaAccounts = useMemo(() => {
    if (!allSocialMediaAccountsData) return [];

    // If the data is already in the correct format, return it
    if (Array.isArray(allSocialMediaAccountsData)) {
      return allSocialMediaAccountsData.map((account) => ({
        ...account,
        type: "social_media_account",
        title: account.name || account.handle || "Unnamed Account",
      }));
    }

    // If it's an object with accounts by platform, flatten it
    const accounts = [];
    Object.values(allSocialMediaAccountsData).forEach((platform) => {
      if (platform.accounts) {
        accounts.push(...platform.accounts);
      }
    });

    return accounts.map((account) => ({
      ...account,
      type: "social_media_account",
      title: account.name || account.handle || "Unnamed Account",
    }));
  }, [allSocialMediaAccountsData]);

  const selectedWorkflowTemplate = getSelectedPlannerTemplate();
  const workflowPlannerSummary = getPlannerSummary();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add the pending invitations notification */}
      <PendingInvitationsNotification />

      <div className="flex flex-col min-h-[calc(100vh-64px)] px-4">
        {/* Header with Calendar Toggle Button */}
        <div className="flex justify-end p-4 gap-2 w-11/12 "></div>

        {/* Main Chat Interface */}
        <div className="max-w-6xl mx-auto w-full pb-20 md:mt-16 mt-10">
          {/* Add Profile Button and Quick Actions Button */}
          <div className="flex justify-end mb-4 gap-3">
            <QuickActionsButton pinnedItems={pinnedItems || []} />
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 
                bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-sm
                transition-all duration-200 flex items-center gap-2 hover:shadow-md"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Prompt Generator</span>
            </button>
          </div>
          <CustomChat
            ref={chatRef}
            history={chatHistory}
            onChatComplete={handleChatComplete}
            onClearHistory={clearChatHistory}
            onBeforeSend={handleDashboardBeforeSend}
            chatData={chatData}
            aiChat={aiChat}
            allEvents={allEventsData}
            allResources={allResourcesData}
            allCollections={allCollectionsData}
            allOrganizations={allOrganizationsData}
            pinnedItems={pinnedItems}
            allVideos={allVideos}
            allSocialMediaAccounts={allSocialMediaAccounts}
          />
        </div>

        <div className="flex flex-col gap-4 max-w-6xl mx-auto w-full px-0 md:px-4 pb-20">
          {renderPinnedItems()}
        </div>

        {/* Calendar Section - Moved below pinned items */}
        {showCalendar && (
          <div
            id="calendar-section"
            className="max-w-6xl mx-auto w-full mb-8 bg-white rounded-lg shadow-md p-6 animate-fade-in-up"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-slate-700">
                Pinned Items Calendar
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  Show notation dates
                </span>
                <button
                  onClick={() => setShowNotationDates(!showNotationDates)}
                  className={`relative inline-flex h-5 w-8 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 ${
                    showNotationDates
                      ? "bg-blue-300 border border-blue-500"
                      : "bg-gray-200"
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform shadow-sm ${
                      showNotationDates ? "translate-x-4" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
            <Calendar
              events={calendarEvents}
              organizations={allOrganizationsData}
              isAdmin={isAdmin}
              onMonthChange={(newMonth) => {
                // Update the calendar month state to trigger new event fetch
                setCalendarMonth(newMonth);
              }}
              onExternalLinkClick={(id, event) => {
                if (event.type === "external_link") {
                  window.open(`/external-links/${id}`, "_blank");
                } else if (event.type === "event") {
                  window.open(`/events/${id}`, "_blank");
                } else if (event.type === "resource") {
                  window.open(`/resources/${id}`, "_blank");
                } else if (event.type === "collection") {
                  window.open(`/collections/${id}`, "_blank");
                } else if (event.type === "notation") {
                  window.open(`/external-links/${event.parentId}`, "_blank");
                } else if (event.type === "collection_item") {
                  window.open(`/collections/${event.id}`, "_blank");
                }
              }}
            />
          </div>
        )}

        {workflowPlanner && (
          <Modal
            isOpen={!!workflowPlanner}
            onClose={() => setWorkflowPlanner(null)}
            maxWidth="max-w-5xl"
          >
            <div className="p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                    <FaMagic className="h-4 w-4" />
                    <span>Project Template Planner</span>
                  </div>
                  <h2 className="mt-1 text-2xl font-semibold text-gray-900">
                    Create a project from a workflow template
                  </h2>
                </div>
                <div className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                  About {workflowPlannerSummary.totalWeeks} week
                  {workflowPlannerSummary.totalWeeks === 1 ? "" : "s"}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Matching templates
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {workflowPlanner.templates.map((template) => (
                        <button
                          type="button"
                          key={template.id}
                          onClick={() => handlePlannerTemplateChange(template.id)}
                          className={`rounded-lg border p-3 text-left transition-colors ${
                            workflowPlanner.selectedTemplateId === template.id
                              ? "border-blue-300 bg-blue-50"
                              : "border-gray-200 bg-white hover:bg-gray-50"
                          }`}
                        >
                          <div className="line-clamp-1 font-medium text-gray-800">
                            {template.name}
                          </div>
                          <div className="mt-1 line-clamp-2 text-xs text-gray-500">
                            {template.description || "Workflow template"}
                          </div>
                          <div className="mt-2 text-xs text-gray-400">
                            {template.timelineItems?.length || 0} steps
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                    <label className="block text-sm font-medium text-gray-700">
                      Project name
                      <input
                        type="text"
                        value={workflowPlanner.projectName}
                        onChange={(event) =>
                          setWorkflowPlanner((prev) =>
                            prev
                              ? { ...prev, projectName: event.target.value }
                              : prev
                          )
                        }
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                      Start date
                      <input
                        type="date"
                        value={workflowPlanner.startDate}
                        onChange={(event) =>
                          handlePlannerStartDateChange(event.target.value)
                        }
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-normal text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                      />
                    </label>
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={workflowPlanner.includeResources}
                      onChange={(event) =>
                        setWorkflowPlanner((prev) =>
                          prev
                            ? {
                                ...prev,
                                includeResources: event.target.checked,
                              }
                            : prev
                        )
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    Copy attached resources for selected steps
                  </label>

                  <div className="rounded-lg border border-gray-200 bg-white">
                    <div className="grid grid-cols-[minmax(0,1fr)_130px_130px_80px] gap-3 border-b border-gray-100 px-3 py-2 text-xs font-medium uppercase text-gray-500">
                      <div>Step</div>
                      <div>Start</div>
                      <div>End</div>
                      <div>Include</div>
                    </div>
                    <div className="max-h-[360px] divide-y divide-gray-100 overflow-y-auto">
                      {(selectedWorkflowTemplate?.timelineItems || []).map(
                        (step) => {
                          const isSelected =
                            workflowPlanner.selectedStepIds.includes(step.id);
                          const draft = workflowPlanner.stepDrafts[step.id];

                          return (
                            <div
                              key={step.id}
                              className={`grid grid-cols-[minmax(0,1fr)_130px_130px_80px] gap-3 px-3 py-3 text-sm ${
                                isSelected ? "bg-white" : "bg-gray-50"
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="truncate font-medium text-gray-800">
                                  {step.title}
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  {step.ownerRole || "Workflow step"}
                                  {step.resourcesCount
                                    ? ` · ${step.resourcesCount} resources`
                                    : ""}
                                </div>
                              </div>
                              <input
                                type="date"
                                value={draft?.startDate || ""}
                                disabled={!isSelected}
                                onChange={(event) =>
                                  handlePlannerStepDateChange(
                                    step.id,
                                    "startDate",
                                    event.target.value
                                  )
                                }
                                className="rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                              />
                              <input
                                type="date"
                                value={draft?.endDate || ""}
                                min={draft?.startDate || undefined}
                                disabled={!isSelected}
                                onChange={(event) =>
                                  handlePlannerStepDateChange(
                                    step.id,
                                    "endDate",
                                    event.target.value
                                  )
                                }
                                className="rounded-md border border-gray-200 px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100 disabled:text-gray-400"
                              />
                              <div className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handlePlannerStepToggle(step.id)}
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                </div>

                <aside className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Project preview
                  </h3>
                  <div className="mt-3 space-y-3 text-sm text-gray-600">
                    <div>
                      <div className="text-xs uppercase text-gray-400">
                        Template
                      </div>
                      <div className="font-medium text-gray-800">
                        {selectedWorkflowTemplate?.name || "No template"}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs uppercase text-gray-400">
                          Starts
                        </div>
                        <div className="font-medium text-gray-800">
                          {formatPlannerDate(workflowPlannerSummary.startDate)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs uppercase text-gray-400">
                          Ends
                        </div>
                        <div className="font-medium text-gray-800">
                          {formatPlannerDate(workflowPlannerSummary.endDate)}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-md border border-blue-100 bg-white p-3">
                      <div className="text-2xl font-semibold text-blue-700">
                        {workflowPlannerSummary.steps.length}
                      </div>
                      <div className="text-xs text-gray-500">
                        selected steps over {workflowPlannerSummary.totalDays} days
                      </div>
                    </div>
                    <div className="space-y-2">
                      {workflowPlannerSummary.steps.slice(0, 5).map((step) => {
                        const draft = workflowPlanner.stepDrafts[step.id];
                        return (
                          <div
                            key={step.id}
                            className="rounded-md bg-white px-3 py-2 text-xs"
                          >
                            <div className="line-clamp-1 font-medium text-gray-700">
                              {step.title}
                            </div>
                            <div className="text-gray-400">
                              {formatPlannerDate(draft?.startDate)} to{" "}
                              {formatPlannerDate(draft?.endDate)}
                            </div>
                          </div>
                        );
                      })}
                      {workflowPlannerSummary.steps.length > 5 && (
                        <div className="text-xs text-gray-400">
                          + {workflowPlannerSummary.steps.length - 5} more steps
                        </div>
                      )}
                    </div>
                  </div>
                </aside>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => setWorkflowPlanner(null)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateWorkflowProject}
                  disabled={
                    isCreatingWorkflowProject ||
                    workflowPlannerSummary.steps.length === 0
                  }
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreatingWorkflowProject ? "Creating..." : "Create project"}
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* User Profile Modal */}
        <UserProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setUrlParams(null); // Clear URL params when modal is closed
          }}
          onSubmit={handleProfileSubmit}
          urlParams={urlParams}
        />
      </div>
    </div>
  );
};

const Base = (props) => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardContent {...props} />
    </Suspense>
  );
};

export default Base;
