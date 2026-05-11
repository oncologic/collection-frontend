"use client";
import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  memo,
} from "react";
import Fundraiser from "../components/cards/EventCard";
import Calendar from "../components/events/Calendar";
import {
  useCreateEvent,
  useUpdateEvent,
  useEvents,
  useEventsPaginated,
  useSearchEvents,
} from "../hooks/useEvents";
import {
  useGetPublicEventsPaginated,
  useSearchPublicEvents,
} from "../hooks/usePublicEvents";
import { usePublicAuth } from "../hooks/usePublicAuth";
import { useOrganizations } from "../hooks/useOrganizations";
import { DateTime } from "luxon";
import Event from "../components/cards/EventCard";
import Modal from "../components/Modal";
import {
  useEventTypes,
  useExpertiseLevels,
  useResourceTypes,
  useTags,
} from "../hooks/useMetadata";
import AddEventForm from "../components/forms/AddEvent";
import toast from "react-hot-toast";
import { Dialog } from "@headlessui/react";
import Map from "../components/Map";
import { calculateDistance, getCoordinatesFromZipCode } from "../utils/general";
import SelectField from "../components/inputs/SelectField";
import { useForm } from "react-hook-form";
import EventTable from "../components/tables/EventTable";
import { useContextAuth } from "../context/authContext";
import {
  FaCog,
  FaFilter,
  FaSearch,
  FaCalendar,
  FaMapMarkerAlt,
  FaTimes,
  FaUpload,
  FaMagic,
} from "react-icons/fa";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MultiSelect from "../components/inputs/MultiSelect";
import EventsChat from "./EventsChat";
import { useRouter } from "next/navigation";
import { useGetResources, useGetAllCollections } from "../hooks/useResources";
import EventBulkImport from "../components/EventBulkImport";
import EventAICreate from "../components/EventAICreate";
import EventsCalendarPDF from "../components/EventsCalendarPDF";
import CalendarScreenshotView from "../components/CalendarScreenshotView";
import EventsExportModal from "../components/modals/EventsExportModal";
import { useQueryClient } from "@tanstack/react-query";

const STATE_CAPITALS = {
  AL: { lat: 32.3792, lng: -86.3077 }, // Montgomery
  AK: { lat: 58.3019, lng: -134.4197 }, // Juneau
  AZ: { lat: 33.4484, lng: -112.074 }, // Phoenix
  AR: { lat: 34.7465, lng: -92.2896 }, // Little Rock
  CA: { lat: 38.5816, lng: -121.4944 }, // Sacramento
  CO: { lat: 39.7392, lng: -104.9903 }, // Denver
  CT: { lat: 41.7658, lng: -72.6734 }, // Hartford
  DE: { lat: 39.1582, lng: -75.5244 }, // Dover
  FL: { lat: 30.4383, lng: -84.2807 }, // Tallahassee
  GA: { lat: 33.749, lng: -84.388 }, // Atlanta
  HI: { lat: 21.3069, lng: -157.8583 }, // Honolulu
  ID: { lat: 43.615, lng: -116.2023 }, // Boise
  IL: { lat: 39.7817, lng: -89.6501 }, // Springfield
  IN: { lat: 39.7684, lng: -86.1581 }, // Indianapolis
  IA: { lat: 41.591, lng: -93.6037 }, // Des Moines
  KS: { lat: 39.0473, lng: -95.6752 }, // Topeka
  KY: { lat: 38.1867, lng: -84.8753 }, // Frankfort
  LA: { lat: 30.4515, lng: -91.1871 }, // Baton Rouge
  ME: { lat: 44.3107, lng: -69.7795 }, // Augusta
  MD: { lat: 38.9784, lng: -76.4922 }, // Annapolis
  MA: { lat: 42.3601, lng: -71.0589 }, // Boston
  MI: { lat: 42.7325, lng: -84.5555 }, // Lansing
  MN: { lat: 44.9537, lng: -93.09 }, // St. Paul
  MS: { lat: 32.2988, lng: -90.1848 }, // Jackson
  MO: { lat: 38.5767, lng: -92.1735 }, // Jefferson City
  MT: { lat: 46.5891, lng: -112.0391 }, // Helena
  NE: { lat: 40.8136, lng: -96.7026 }, // Lincoln
  NV: { lat: 39.1638, lng: -119.7674 }, // Carson City
  NH: { lat: 43.2081, lng: -71.5376 }, // Concord
  NJ: { lat: 40.2206, lng: -74.7597 }, // Trenton
  NM: { lat: 35.687, lng: -105.9378 }, // Santa Fe
  NY: { lat: 42.6526, lng: -73.7562 }, // Albany
  NC: { lat: 35.7796, lng: -78.6382 }, // Raleigh
  ND: { lat: 46.8083, lng: -100.7837 }, // Bismarck
  OH: { lat: 39.9612, lng: -82.9988 }, // Columbus
  OK: { lat: 35.4676, lng: -97.5164 }, // Oklahoma City
  OR: { lat: 44.9429, lng: -123.0351 }, // Salem
  PA: { lat: 40.2732, lng: -76.8867 }, // Harrisburg
  RI: { lat: 41.824, lng: -71.4128 }, // Providence
  SC: { lat: 34.0007, lng: -81.0348 }, // Columbia
  SD: { lat: 44.3683, lng: -100.3516 }, // Pierre
  TN: { lat: 36.1627, lng: -86.7816 }, // Nashville
  TX: { lat: 30.2672, lng: -97.7431 }, // Austin
  UT: { lat: 40.7608, lng: -111.891 }, // Salt Lake City
  VT: { lat: 44.2601, lng: -72.5754 }, // Montpelier
  VA: { lat: 37.5407, lng: -77.436 }, // Richmond
  WA: { lat: 47.0379, lng: -122.9007 }, // Olympia
  WV: { lat: 38.3498, lng: -81.6326 }, // Charleston
  WI: { lat: 43.0731, lng: -89.4012 }, // Madison
  WY: { lat: 41.14, lng: -104.8202 }, // Cheyenne
};

// Memoized search input component to prevent re-renders
const SearchInput = memo(
  ({ searchInput, setSearchInput, searchLoading, searchTerm, onSearch }) => {
    const inputRef = useRef(null);

    // Keep focus on input during typing
    useEffect(() => {
      if (
        inputRef.current &&
        document.activeElement === inputRef.current &&
        searchInput
      ) {
        const cursorPosition = inputRef.current.selectionStart;
        requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
          }
        });
      }
    }, [searchInput]);

    const handleClear = useCallback(() => {
      setSearchInput("");
      onSearch(""); // Clear search results
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, [setSearchInput, onSearch]);

    const handleSearch = useCallback(() => {
      onSearch(searchInput);
    }, [searchInput, onSearch]);

    return (
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search events by name, description, organization, location..."
            value={searchInput}
            onChange={(e) => {
              const value = e.target.value;
              setSearchInput(value);
            }}
            onKeyDown={(e) => {
              // Trigger search on Enter key
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchInput && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={handleSearch}
          className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
        >
          <FaSearch className="w-4 h-4" />
          <span className="hidden sm:inline">Search</span>
          {searchLoading && searchTerm.length >= 2 && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          )}
        </button>
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";

const EventsPage = () => {
  const router = useRouter();
  const eventsChatRef = useRef(null);
  const queryClient = useQueryClient();

  // State management - declare all state first
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAIBulkMode, setIsAIBulkMode] = useState(false);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [socialPostText, setSocialPostText] = useState("");
  const [chatData, setChatData] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pinnedItems, setPinnedItems] = useState([]);
  const [chatFilters, setChatFilters] = useState({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [prefillEvent, setPrefillEvent] = useState(null);

  // New state for improved layout
  const [searchInput, setSearchInput] = useState(""); // Input field value
  const [searchTerm, setSearchTerm] = useState(""); // Debounced search value
  const [selectedEventTypes, setSelectedEventTypes] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedStates, setSelectedStates] = useState([]);
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [viewMode, setViewMode] = useState("calendar"); // table, grid, calendar
  const [showUpcoming, setShowUpcoming] = useState(true);
  const [dateFilter, setDateFilter] = useState("all"); // all, upcoming, past
  const [showGoogleCalendarEvents, setShowGoogleCalendarEvents] =
    useState(false);
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [eventsToExport, setEventsToExport] = useState([]);

  // Track the current calendar month
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(
    DateTime.now().startOf("month")
  );

  // State for table view pagination
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize] = useState(50);

  // Use paginated events with date filtering for calendar view
  const [dateRange, setDateRange] = useState(() => {
    const now = DateTime.now();
    return {
      filterStartDate: now.minus({ months: 1 }).startOf("month").toISODate(),
      filterEndDate: now.plus({ months: 1 }).endOf("month").toISODate(),
    };
  });

  // Get auth status FIRST before using it in hooks
  const { isSignedIn, isPublicAccess } = usePublicAuth();

  // Use public hooks when not signed in, regular hooks when signed in
  const publicPaginatedData = useGetPublicEventsPaginated(
    {
      page: 1,
      limit: 100,
      sortBy: "startDate",
      sortOrder: "asc",
      ...dateRange,
    },
    { enabled: isPublicAccess || !isSignedIn }
  );

  const authenticatedPaginatedData = useEventsPaginated(
    {
      page: 1,
      limit: 100,
      sortBy: "startDate",
      sortOrder: "asc",
      ...dateRange,
    },
    { enabled: isSignedIn && !isPublicAccess }
  );

  const { data: paginatedData, isLoading: eventsLoading } =
    isPublicAccess || !isSignedIn
      ? publicPaginatedData
      : authenticatedPaginatedData;

  const events = paginatedData?.data || [];

  // Fetch all events for table view (no date filtering)
  const publicAllEventsPaginated = useGetPublicEventsPaginated(
    {
      page: tablePage,
      limit: tablePageSize,
      sortBy: "startDate",
      sortOrder: "desc",
    },
    {
      enabled:
        (isPublicAccess || !isSignedIn) &&
        viewMode === "table" &&
        searchTerm.length < 2,
    }
  );

  const authenticatedAllEventsPaginated = useEventsPaginated(
    {
      page: tablePage,
      limit: tablePageSize,
      sortBy: "startDate",
      sortOrder: "desc",
    },
    {
      enabled:
        isSignedIn &&
        !isPublicAccess &&
        viewMode === "table" &&
        searchTerm.length < 2,
    }
  );

  const { data: allEventsPaginated, isLoading: allEventsLoading } =
    isPublicAccess || !isSignedIn
      ? publicAllEventsPaginated
      : authenticatedAllEventsPaginated;

  // Add search hook - use public search when not signed in
  const publicSearchResults = useSearchPublicEvents(searchTerm, {
    limit: 100,
    enabled: (isPublicAccess || !isSignedIn) && searchTerm.length >= 2,
  });

  const authenticatedSearchResults = useSearchEvents(searchTerm, {
    limit: 100,
    enabled: isSignedIn && !isPublicAccess && searchTerm.length >= 2,
  });

  const { data: searchResults = [], isLoading: searchLoading } =
    isPublicAccess || !isSignedIn
      ? publicSearchResults
      : authenticatedSearchResults;

  const { data: organizations = [], isLoading: orgsLoading } =
    useOrganizations();
  const { data: eventTypes = [], isLoading: eventTypesLoading } =
    useEventTypes();
  const { data: expertiseLevels = [] } = useExpertiseLevels();
  const { data: tags = [] } = useTags();
  const { mutate: createEvent } = useCreateEvent();
  const { mutate: updateEvent } = useUpdateEvent();
  const {
    isAdmin,
    isAdvocate,
    selectedTenants,
    userId,
    userDetails,
    systemUser,
  } = useContextAuth();

  // Add missing data fetching hooks
  const { data: allResources = [] } = useGetResources();
  const { data: allCollections = [] } = useGetAllCollections();

  const { control } = useForm({
    defaultValues: { state: "" },
  });

  // Calendar is the default view (set in useState above)
  // User's view preference will be saved to localStorage when they change views

  // Handle search function - triggered by button click or Enter key
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
  }, []);

  // Reset table page when view mode changes or search starts
  useEffect(() => {
    setTablePage(1);
  }, [viewMode, searchTerm]);

  // Add this check before the handleAddEvent handler
  const canAddEvent = useMemo(() => {
    if (!selectedTenants?.length) return false;
    // Admin or advocate can add events
    return isAdmin || (isAdvocate && isAdvocate.length > 0);
  }, [isAdmin, isAdvocate, selectedTenants]);

  // Handler for adding an event
  const handleAddEvent = useCallback(
    (event) => {
      if (!canAddEvent) {
        toast.error("Please select a tenant first");
        return;
      }

      createEvent(event, {
        onSuccess: () => {
          toast.success("Event added successfully!");
          setIsAddEventModalOpen(false);
          setPrefillEvent(null);
        },
        onError: (error) => {
          toast.error(
            error.message || "Failed to add event. Please try again."
          );
        },
      });
    },
    [createEvent, canAddEvent]
  );
  // Helper to map an event to AddEventForm initialValues (without id)
  const toFormInitialValues = useCallback((ev) => {
    if (!ev) return null;
    return {
      title: ev.title || "",
      description: ev.description || "",
      startDate: ev.startDate
        ? DateTime.fromISO(ev.startDate)
            .setZone(ev.timezone || "America/Chicago")
            .toFormat("yyyy-MM-dd")
        : "",
      startTime: ev.startDate
        ? DateTime.fromISO(ev.startDate)
            .setZone(ev.timezone || "America/Chicago")
            .toFormat("HH:mm")
        : "",
      endDate: ev.endDate
        ? DateTime.fromISO(ev.endDate)
            .setZone(ev.timezone || "America/Chicago")
            .toFormat("yyyy-MM-dd")
        : "",
      endTime: ev.endDate
        ? DateTime.fromISO(ev.endDate)
            .setZone(ev.timezone || "America/Chicago")
            .toFormat("HH:mm")
        : "",
      timezone: ev.timezone || "America/Chicago",
      organizations: ev.organizations || [],
      tags: ev.tags || [],
      expertiseLevelId: ev.expertiseLevelId || null,
      typeId: ev.typeId || null,
      professional:
        ev.professional === true
          ? { id: true, name: "Professional" }
          : { id: false, name: "Community" },
      registrationLink: ev.url || ev.registrationLink || "",
      tenantId: ev.tenantId || null,
      visibility: ev.visibility || "private",
      virtualEvent: ev.virtualEvent || false,
      inPersonEvent: ev.inPersonEvent || false,
      locationName: ev.locationName || "",
      locationAddress: ev.locationAddress || "",
      locationCity: ev.locationCity || "",
      locationState: ev.locationState?.trim() || "",
      locationPostal: ev.locationPostal || "",
      locationCountry: ev.locationCountry?.trim() || "",
    };
  }, []);

  // Handler for editing an event
  const handleEditEvent = useCallback((event) => {
    setEventToEdit(event);
    setIsEditModalOpen(true);
  }, []);

  // Handler for updating an event
  const handleUpdateEvent = useCallback(
    (updatedEvent) => {
      updateEvent(
        { id: eventToEdit.id, event: updatedEvent },
        {
          onSuccess: () => {
            toast.success("Event updated successfully!");
            setIsEditModalOpen(false);
            setEventToEdit(null);
          },
          onError: (error) => {
            toast.error(
              error.message || "Failed to update event. Please try again."
            );
          },
        }
      );
    },
    [updateEvent, eventToEdit]
  );

  // Process events and augment with DateTime objects
  const processedEvents = useMemo(() => {
    // Use search results if there's an active search
    if (searchTerm.length >= 2) {
      return searchResults.map((event) => ({
        ...event,
        startDateISO: event.startDate,
        endDateISO: event.endDate,
        startDateTime: DateTime.fromISO(event.startDate),
        endDateTime: DateTime.fromISO(event.endDate),
      }));
    }

    // For table view, use all events paginated data
    if (viewMode === "table" && allEventsPaginated?.data) {
      return allEventsPaginated.data.map((event) => ({
        ...event,
        startDateISO: event.startDate,
        endDateISO: event.endDate,
        startDateTime: DateTime.fromISO(event.startDate),
        endDateTime: DateTime.fromISO(event.endDate),
      }));
    }

    // For calendar/grid views, use date-filtered events
    return events.map((event) => ({
      ...event,
      startDateISO: event.startDate,
      endDateISO: event.endDate,
      startDateTime: DateTime.fromISO(event.startDate),
      endDateTime: DateTime.fromISO(event.endDate),
    }));
  }, [events, searchResults, searchTerm, viewMode, allEventsPaginated]);

  // Get unique states for filter
  const availableStates = useMemo(() => {
    const states = [
      ...new Set(
        processedEvents.map((event) => event.locationState).filter(Boolean)
      ),
    ];
    return states.sort().map((state) => ({ id: state, name: state }));
  }, [processedEvents]);

  // Filter events based on all criteria
  const filteredEvents = useMemo(() => {
    let filtered = [...processedEvents];

    // Skip client-side search filter if we're using server-side search
    // (searchTerm >= 2 characters means we're using the search API)
    if (searchTerm && searchTerm.length < 2) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.title?.toLowerCase().includes(searchLower) ||
          event.description?.toLowerCase().includes(searchLower) ||
          event.organizations?.some((org) =>
            org.name.toLowerCase().includes(searchLower)
          ) ||
          event.tags?.some((tag) =>
            tag.name.toLowerCase().includes(searchLower)
          ) ||
          event.locationCity?.toLowerCase().includes(searchLower) ||
          event.locationState?.toLowerCase().includes(searchLower)
      );
    }

    // Event type filter
    if (selectedEventTypes.length > 0) {
      filtered = filtered.filter((event) =>
        selectedEventTypes.some(
          (type) =>
            // Ensure both are compared as numbers to avoid type mismatch
            Number(type.id) === Number(event.typeId)
        )
      );
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter((event) =>
        event.tags?.some((tag) =>
          selectedTags.some(
            (selectedTag) =>
              // Ensure both are compared as numbers to avoid type mismatch
              Number(selectedTag.id) === Number(tag.id || tag.tagId)
          )
        )
      );
    }

    // State filter
    if (selectedStates.length > 0) {
      filtered = filtered.filter((event) =>
        selectedStates.some((state) => state.id === event.locationState)
      );
    }

    // Date filter
    const now = DateTime.now();
    if (dateFilter === "upcoming") {
      filtered = filtered.filter((event) => event.startDateTime > now);
    } else if (dateFilter === "past") {
      filtered = filtered.filter((event) => event.endDateTime < now);
    }

    // Google Calendar filter (only in table view)
    if (viewMode === "table" && !showGoogleCalendarEvents) {
      filtered = filtered.filter((event) => !event.isGoogleCalendarEvent);
    }

    return filtered.sort(
      (a, b) => a.startDateTime.toMillis() - b.startDateTime.toMillis()
    );
  }, [
    processedEvents,
    searchTerm,
    selectedEventTypes,
    selectedTags,
    selectedStates,
    dateFilter,
    viewMode,
    showGoogleCalendarEvents,
  ]);

  // Upcoming events for featured section - respects all filters including search
  const upcomingEvents = useMemo(() => {
    const now = DateTime.now();
    return filteredEvents
      .filter((event) => event.startDateTime > now)
      .sort((a, b) => a.startDateTime.toMillis() - b.startDateTime.toMillis())
      .slice(0, 4);
  }, [filteredEvents]);

  // Auto-scroll to current month events when view changes
  useEffect(() => {
    if (viewMode === "grid" || viewMode === "table") {
      // Find the first event in the current month
      const now = DateTime.now();
      const currentMonthEvent = filteredEvents.find((event) => {
        const eventDate = DateTime.fromISO(event.startDate);
        return (
          eventDate.hasSame(now, "month") && eventDate.hasSame(now, "year")
        );
      });

      if (currentMonthEvent) {
        // Small delay to ensure DOM is rendered
        setTimeout(() => {
          const eventElement = document.getElementById(
            `event-${currentMonthEvent.id}`
          );
          if (eventElement) {
            eventElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }, 300);
      }
    }
  }, [viewMode, filteredEvents]);

  // Auto-select events for chat context
  const autoSelectedEvents = useMemo(() => {
    const now = DateTime.now();
    const oneYearAgo = now.minus({ years: 1 });

    return processedEvents.filter(
      (event) => event.startDateTime > oneYearAgo || event.endDateTime > now
    );
  }, [processedEvents]);

  // Build social media post for the current calendar month
  const buildSocialPost = useCallback(() => {
    const monthName = currentCalendarMonth.toFormat("MMMM");
    const yearNum = currentCalendarMonth.year;
    const startOfMonth = currentCalendarMonth.startOf("month");
    const endOfMonth = currentCalendarMonth.endOf("month");

    const monthEvents = filteredEvents
      .filter((e) => {
        const d = DateTime.fromISO(e.startDate);
        return d >= startOfMonth && d <= endOfMonth;
      })
      .filter((e) =>
        showGoogleCalendarEvents ? true : !e.isGoogleCalendarEvent
      )
      .sort(
        (a, b) =>
          DateTime.fromISO(a.startDate).toMillis() -
          DateTime.fromISO(b.startDate).toMillis()
      );

    const urlFromDescription = (desc) => {
      if (!desc || typeof desc !== "string") return "";
      const match = desc.match(/https?:\/\/[^\s)]+/i);
      return match ? match[0] : "";
    };

    const lines = monthEvents.map((e) => {
      const startDt = DateTime.fromISO(e.startDate);
      const endDt = e.endDate ? DateTime.fromISO(e.endDate) : startDt;
      const isMulti = !endDt.hasSame(startDt, "day");
      const sameMonth = endDt.hasSame(startDt, "month");
      const rangeLabel = isMulti
        ? sameMonth
          ? `${startDt.toFormat("MMM d")}–${endDt.toFormat("d")}`
          : `${startDt.toFormat("MMM d")}–${endDt.toFormat("MMM d")}`
        : startDt.toFormat("MMM d");
      const candidate =
        e.registrationLink || e.url || urlFromDescription(e.description);
      const line = candidate
        ? `- ${rangeLabel}: ${e.title} – ${candidate}`
        : `- ${rangeLabel}: ${e.title}`;
      return line;
    });

    const text = [
      `${monthName} ${yearNum} events:`,
      ...lines,
      "",
      "Edit as needed before posting.",
    ].join("\n");
    return text;
  }, [filteredEvents, currentCalendarMonth, showGoogleCalendarEvents]);

  const handleOpenSocialPost = useCallback(() => {
    setSocialPostText(buildSocialPost());
    setIsSocialModalOpen(true);
  }, [buildSocialPost]);

  // Clear all filters
  const handleClearAllFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setSelectedEventTypes([]);
    setSelectedTags([]);
    setSelectedStates([]);
    setDateFilter("all");
    setShowGoogleCalendarEvents(true);
  };

  // Clear specific filter types
  const handleClearEventTypeFilters = () => setSelectedEventTypes([]);
  const handleClearTagFilters = () => setSelectedTags([]);
  const handleClearStateFilters = () => setSelectedStates([]);

  // Chat handlers
  const clearChatHistory = () => {
    setChatHistory([]);
    setChatFilters({});
  };

  const handleChatComplete = (chatEntry) => {
    const chatId = Date.now();

    setChatHistory((prev) => [
      ...prev,
      {
        id: `${chatId}-user`,
        prompt: chatEntry.content.prompt,
        isUser: true,
        timestamp: chatEntry.timestamp,
      },
      {
        id: `${chatId}-ai`,
        isUser: false,
        answer: chatEntry.content.answer,
        timestamp: chatEntry.timestamp,
        userInfo: chatEntry.userInfo,
        referencedItems:
          chatEntry.content.data &&
          (chatEntry.content.data.events?.length > 0 ||
            chatEntry.content.data.resources?.length > 0 ||
            chatEntry.content.data.collections?.length > 0 ||
            chatEntry.content.data.externalLinks?.length > 0 ||
            chatEntry.content.data.videos?.length > 0 ||
            chatEntry.content.data.attachments?.length > 0 ||
            chatEntry.content.data.organizations?.length > 0 ||
            chatEntry.content.data.notations?.length > 0),
      },
    ]);

    setChatData(chatEntry.content.data);
  };

  // Handle filtering to referenced events from chat
  const handleFilterToReferencedEvents = (referencedItems) => {
    if (!referencedItems || referencedItems.length === 0) {
      return;
    }

    const eventIds = referencedItems
      .filter((item) => item.type === "event")
      .map((item) => item.id);

    if (eventIds.length > 0) {
      toast.success(
        `Found ${eventIds.length} referenced event${
          eventIds.length !== 1 ? "s" : ""
        }`
      );
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="w-full min-h-screen pb-20 p-4">
      <div className="w-full mx-auto p-4 sm:p-6 bg-white shadow-md rounded-b-lg animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
        <div className="space-y-4">
          <div className="h-10 w-full bg-gray-200 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
            <div className="h-10 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
      <div className="mt-6">
        <div className="p-4">
          <div className="h-8 w-40 bg-gray-200 rounded mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4">
                <div className="h-40 bg-gray-200 rounded mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Show loading skeleton while data is being fetched
  if (
    eventsLoading ||
    orgsLoading ||
    (searchTerm.length >= 2 && searchLoading) ||
    (viewMode === "table" && allEventsLoading)
  ) {
    return <LoadingSkeleton />;
  }

  return (
    <div
      className={`min-h-screen pb-20 bg-gray-50 ${
        !isSignedIn || isPublicAccess ? "mt-24 pt-4" : "mt-16"
      }`}
    >
      {/* Add Event Modal */}
      {isAddEventModalOpen && canAddEvent && (
        <Modal
          isOpen={isAddEventModalOpen}
          onClose={() => setIsAddEventModalOpen(false)}
          maxWidth="lg:w-2/3 w-full"
          closeOnOutsideClick={false}
          className="!p-0 sm:!p-4"
        >
          <div className="text-gray-700 bg-white min-h-screen sm:min-h-0">
            <AddEventForm
              organizations={organizations}
              onSubmit={handleAddEvent}
              onClose={() => setIsAddEventModalOpen(false)}
              eventTypes={eventTypes}
              expertiseLevels={expertiseLevels}
              tags={tags}
              isAdmin={isAdmin}
              selectedTenants={selectedTenants}
              className="max-h-[100vh] sm:max-h-none overflow-y-auto"
              initialValues={prefillEvent || undefined}
            />
          </div>
        </Modal>
      )}

      {/* Edit Event Modal */}
      {isEditModalOpen && eventToEdit && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEventToEdit(null);
          }}
          maxWidth="lg:w-2/3 w-full"
          closeOnOutsideClick={false}
          className="!p-0 sm:!p-4"
        >
          <div className="text-gray-700 bg-white min-h-screen sm:min-h-0">
            <AddEventForm
              organizations={organizations}
              onSubmit={handleUpdateEvent}
              onClose={() => {
                setIsEditModalOpen(false);
                setEventToEdit(null);
              }}
              eventTypes={eventTypes}
              expertiseLevels={expertiseLevels}
              tags={tags}
              isAdmin={isAdmin}
              selectedTenants={selectedTenants}
              initialValues={{
                id: eventToEdit.id,
                title: eventToEdit.title || "",
                description: eventToEdit.description || "",
                startDate: eventToEdit.startDate
                  ? DateTime.fromISO(eventToEdit.startDate)
                      .setZone(eventToEdit.timezone || "America/Chicago")
                      .toFormat("yyyy-MM-dd")
                  : "",
                startTime: eventToEdit.startDate
                  ? DateTime.fromISO(eventToEdit.startDate)
                      .setZone(eventToEdit.timezone || "America/Chicago")
                      .toFormat("HH:mm")
                  : "",
                endDate: eventToEdit.endDate
                  ? DateTime.fromISO(eventToEdit.endDate)
                      .setZone(eventToEdit.timezone || "America/Chicago")
                      .toFormat("yyyy-MM-dd")
                  : "",
                endTime: eventToEdit.endDate
                  ? DateTime.fromISO(eventToEdit.endDate)
                      .setZone(eventToEdit.timezone || "America/Chicago")
                      .toFormat("HH:mm")
                  : "",
                timezone: eventToEdit.timezone || "America/Chicago",
                organizations: eventToEdit.organizations || [],
                tags: eventToEdit.tags || [],
                expertiseLevelId: eventToEdit.expertiseLevelId || null,
                typeId: eventToEdit.typeId || null,
                professional:
                  eventToEdit.professional === true
                    ? { id: true, name: "Professional" }
                    : { id: false, name: "Community" },
                registrationLink:
                  eventToEdit.url || eventToEdit.registrationLink || "",
                tenantId: eventToEdit.tenantId || null,
                visibility: eventToEdit.visibility || "private",
                virtualEvent: eventToEdit.virtualEvent || false,
                inPersonEvent: eventToEdit.inPersonEvent || false,
                locationName: eventToEdit.locationName || "",
                locationAddress: eventToEdit.locationAddress || "",
                locationCity: eventToEdit.locationCity || "",
                locationState: eventToEdit.locationState?.trim() || "",
                locationPostal: eventToEdit.locationPostal || "",
                locationCountry: eventToEdit.locationCountry?.trim() || "",
              }}
              className="max-h-[100vh] sm:max-h-none overflow-y-auto"
            />
          </div>
        </Modal>
      )}

      {/* Header with Search and Controls */}
      <div className="top-16 md:top-20 z-10 bg-white shadow-sm border-b border-gray-200">
        <div className="w-full mx-auto p-4 sm:p-6">
          {/* Title and Add Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Events
            </h1>
            {(isAdmin || (isAdvocate && isAdvocate.length > 0)) && (
              <div className="relative group">
                <button
                  onClick={() => {
                    if (!canAddEvent) {
                      toast.error("Please select a tenant first");
                      return;
                    }
                    setIsAddEventModalOpen(true);
                  }}
                  disabled={!canAddEvent}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                    !canAddEvent
                      ? "opacity-50 cursor-not-allowed bg-gray-400 text-white"
                      : "bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300"
                  }`}
                >
                  <span>Add Event</span>
                  <FontAwesomeIcon
                    icon={faChevronDown}
                    className="h-3 w-3 ml-1"
                  />
                </button>
                {canAddEvent && (
                  <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                    <button
                      onClick={() => {
                        setIsAddEventModalOpen(true);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-t-lg border-b border-gray-100 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="text-left">
                        <div className="font-medium">Create Event</div>
                        <div className="text-xs text-gray-500">
                          Add a single event manually
                        </div>
                      </div>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => setIsBulkImportOpen(true)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 border-b border-gray-100 transition-colors"
                      >
                        <FaUpload className="h-5 w-5 text-green-600" />
                        <div className="text-left">
                          <div className="font-medium">Bulk Import</div>
                          <div className="text-xs text-gray-500">
                            Import multiple events from CSV
                          </div>
                        </div>
                      </button>
                    )}
                    <div className="p-1">
                      <div className="px-3 py-1 text-xs text-gray-500 font-medium">
                        AI Options
                      </div>
                      <button
                        onClick={() => {
                          setIsAIBulkMode(false);
                          setIsAIModalOpen(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded transition-colors"
                      >
                        <FaMagic className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium">AI Single Event</div>
                          <div className="text-xs text-gray-500">
                            Create one event with AI
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={() => {
                          setIsAIBulkMode(true);
                          setIsAIModalOpen(true);
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors"
                      >
                        <FaMagic className="h-5 w-5 text-blue-600" />
                        <div className="text-left">
                          <div className="font-medium">AI Bulk Events</div>
                          <div className="text-xs text-gray-500">
                            Create multiple events with AI
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Search and Controls */}
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <SearchInput
              searchInput={searchInput}
              setSearchInput={setSearchInput}
              searchLoading={searchLoading}
              searchTerm={searchTerm}
              onSearch={handleSearch}
            />

            {/* View Mode Toggle and Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex rounded-lg border border-gray-300 p-1 bg-white">
                <button
                  onClick={() => {
                    setViewMode("table");
                    localStorage.setItem("eventsViewMode", "table");
                    setShowUpcoming(false); // Hide upcoming events in table view
                  }}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                    viewMode === "table"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode("grid");
                    localStorage.setItem("eventsViewMode", "grid");
                    setShowUpcoming(true); // Show upcoming events in grid view
                  }}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="hidden sm:inline">Grid</span>
                </button>
                <button
                  onClick={() => {
                    setViewMode("calendar");
                    localStorage.setItem("eventsViewMode", "calendar");
                    setShowUpcoming(true); // Show upcoming events in calendar view
                  }}
                  className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                    viewMode === "calendar"
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <FaCalendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </button>
              </div>

              {/* Filter Toggle - shows on mobile and desktop */}
              <button
                onClick={() => setIsFiltersVisible(!isFiltersVisible)}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 min-w-0"
              >
                <FaFilter className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Filters</span>
                {(selectedEventTypes.length > 0 ||
                  selectedTags.length > 0 ||
                  selectedStates.length > 0 ||
                  dateFilter !== "all") && (
                  <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                    {selectedEventTypes.length +
                      selectedTags.length +
                      selectedStates.length +
                      (dateFilter !== "all" ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedEventTypes.length > 0 ||
            selectedTags.length > 0 ||
            selectedStates.length > 0 ||
            dateFilter !== "all" ||
            (viewMode === "table" && !showGoogleCalendarEvents)) && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">
                Active filters:
              </span>

              {selectedEventTypes.map((type) => (
                <span
                  key={type.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {type.name}
                  <button
                    onClick={() =>
                      setSelectedEventTypes((prev) =>
                        prev.filter((t) => t.id !== type.id)
                      )
                    }
                    className="ml-1 hover:text-blue-600"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {tag.name}
                  <button
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.filter((t) => t.id !== tag.id)
                      )
                    }
                    className="ml-1 hover:text-green-600"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {selectedStates.map((state) => (
                <span
                  key={state.id}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                >
                  {state.name}
                  <button
                    onClick={() =>
                      setSelectedStates((prev) =>
                        prev.filter((s) => s.id !== state.id)
                      )
                    }
                    className="ml-1 hover:text-purple-600"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {dateFilter !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  {dateFilter === "upcoming" ? "Upcoming" : "Past"} Events
                  <button
                    onClick={() => setDateFilter("all")}
                    className="ml-1 hover:text-orange-600"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              )}

              {viewMode === "table" && !showGoogleCalendarEvents && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                  System events only
                  <button
                    onClick={() => setShowGoogleCalendarEvents(true)}
                    className="ml-1 hover:text-gray-600"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                onClick={handleClearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Mobile Filters Overlay */}
        <div
          className={`lg:hidden fixed inset-x-0 bg-white border-t border-gray-200 transition-all duration-300 ease-in-out z-10 ${
            isFiltersVisible
              ? "translate-y-0 opacity-100 pointer-events-auto"
              : "-translate-y-full opacity-0 pointer-events-none"
          }`}
        >
          <div className="max-h-[50vh] overflow-y-auto px-4 py-3">
            <div className="space-y-6">
              {/* Date Filter */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Date Range</h3>
                <div className="space-y-2">
                  {[
                    { id: "all", name: "All Events" },
                    { id: "upcoming", name: "Upcoming Events" },
                    { id: "past", name: "Past Events" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setDateFilter(option.id)}
                      className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 ${
                        dateFilter === option.id
                          ? "bg-blue-50 text-blue-600"
                          : ""
                      }`}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Event Types Filter */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Event Types</h3>
                <MultiSelect
                  options={eventTypes}
                  value={selectedEventTypes}
                  onChange={setSelectedEventTypes}
                  placeholder="Select event types..."
                  chipClassName="bg-blue-100 text-blue-800"
                />
                {selectedEventTypes.length > 0 && (
                  <button
                    onClick={handleClearEventTypeFilters}
                    className="text-xs text-gray-500 hover:text-blue-600 mt-1"
                  >
                    Clear event type filters
                  </button>
                )}
              </div>

              {/* Tags Filter */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                <MultiSelect
                  options={tags}
                  value={selectedTags}
                  onChange={setSelectedTags}
                  placeholder="Select tags..."
                  chipClassName="bg-green-100 text-green-800"
                />
                {selectedTags.length > 0 && (
                  <button
                    onClick={handleClearTagFilters}
                    className="text-xs text-gray-500 hover:text-blue-600 mt-1"
                  >
                    Clear tag filters
                  </button>
                )}
              </div>

              {/* States Filter */}
              <div>
                <h3 className="font-medium text-gray-900 mb-2">States</h3>
                <MultiSelect
                  options={availableStates}
                  value={selectedStates}
                  onChange={setSelectedStates}
                  placeholder="Select states..."
                  chipClassName="bg-purple-100 text-purple-800"
                />
                {selectedStates.length > 0 && (
                  <button
                    onClick={handleClearStateFilters}
                    className="text-xs text-gray-500 hover:text-blue-600 mt-1"
                  >
                    Clear state filters
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => setIsFiltersVisible(false)}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Content Area */}
        <div className="flex-1 p-6 lg:pr-5">
          <div className="">
            {/* Upcoming Events Section */}
            {showUpcoming && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent">
                    Upcoming Events{" "}
                    {upcomingEvents.length > 0 && `(${upcomingEvents.length})`}
                  </h2>
                  <button
                    onClick={() => setShowUpcoming(!showUpcoming)}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    {showUpcoming ? "Hide" : "Show"}
                    <FontAwesomeIcon
                      icon={showUpcoming ? faChevronUp : faChevronDown}
                      className="w-4 h-4"
                    />
                  </button>
                </div>
                {upcomingEvents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {upcomingEvents.map((event) => (
                      <Fundraiser
                        key={event.id}
                        event={event}
                        isAdmin={isAdmin}
                        userId={systemUser?.id}
                        status="Upcoming"
                        onCopy={(ev) => {
                          setPrefillEvent(toFormInitialValues(ev));
                          setIsAddEventModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-600">
                      {searchInput ||
                      selectedEventTypes.length > 0 ||
                      selectedTags.length > 0 ||
                      selectedStates.length > 0
                        ? "No upcoming events match your current filters."
                        : "No upcoming events at this time."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* All Events Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {searchTerm.length >= 2
                    ? `Search Results for "${searchTerm}" (${filteredEvents.length})`
                    : viewMode === "table" && allEventsPaginated
                    ? `All Events (${allEventsPaginated.pagination.totalCount} total)`
                    : `All Events (${filteredEvents.length})`}
                </h2>
                {searchTerm.length >= 2 && (
                  <span className="text-sm text-gray-500">
                    Searching across all events
                  </span>
                )}
              </div>

              {/* Content based on view mode */}
              {viewMode === "table" && (
                <div className="space-y-4">
                  
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div style={{ height: "600px" }}>
                      <EventTable
                        events={filteredEvents}
                        userId={systemUser?.id}
                        isAdmin={isAdmin}
                        isAdvocate={isAdvocate}
                        onEventClick={(event) =>
                          router.push(`/events/${event.id}`)
                        }
                        onEdit={handleEditEvent}
                        onExport={(selectedEvents) => {
                          setEventsToExport(selectedEvents);
                          setIsExportModalOpen(true);
                        }}
                      />
                    </div>
                  </div>

                  {/* Pagination controls for table view */}
                  {!searchTerm && allEventsPaginated && (
                    <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">
                          Page {allEventsPaginated.pagination.page} of{" "}
                          {allEventsPaginated.pagination.totalPages}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({allEventsPaginated.pagination.totalCount} total
                          events)
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            setTablePage(Math.max(1, tablePage - 1))
                          }
                          disabled={tablePage === 1}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>

                        <div className="flex items-center gap-1">
                          {/* Show page numbers */}
                          {Array.from(
                            {
                              length: Math.min(
                                5,
                                allEventsPaginated.pagination.totalPages
                              ),
                            },
                            (_, i) => {
                              const pageNum = i + 1;
                              if (
                                allEventsPaginated.pagination.totalPages <= 5
                              ) {
                                return pageNum;
                              }
                              // Show first 2, current, and last 2 pages
                              if (
                                pageNum <= 2 ||
                                pageNum >=
                                  allEventsPaginated.pagination.totalPages - 1
                              ) {
                                return pageNum;
                              }
                              if (Math.abs(pageNum - tablePage) <= 1) {
                                return pageNum;
                              }
                              return null;
                            }
                          )
                            .filter(Boolean)
                            .map((pageNum) => (
                              <button
                                key={pageNum}
                                onClick={() => setTablePage(pageNum)}
                                className={`px-3 py-2 text-sm font-medium rounded-md ${
                                  tablePage === pageNum
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            ))}
                        </div>

                        <button
                          onClick={() =>
                            setTablePage(
                              Math.min(
                                allEventsPaginated.pagination.totalPages,
                                tablePage + 1
                              )
                            )
                          }
                          disabled={!allEventsPaginated.pagination.hasMore}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <div key={event.id} id={`event-${event.id}`}>
                      <Fundraiser
                        event={event}
                        isAdmin={isAdmin}
                        userId={systemUser?.id}
                        status={
                          event.startDateTime > DateTime.now()
                            ? "Upcoming"
                            : "Active"
                        }
                        onCopy={(ev) => {
                          setPrefillEvent(toFormInitialValues(ev));
                          setIsAddEventModalOpen(true);
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}

              {viewMode === "calendar" && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="min-w-[300px]">
                    <Calendar
                      events={filteredEvents}
                      organizations={organizations}
                      isAdmin={isAdmin}
                      eventTypes={eventTypes}
                      tags={tags}
                      initialMonth={currentCalendarMonth}
                      onMonthChange={(newMonth) => {
                        // Update both the calendar month state and date range
                        setCurrentCalendarMonth(newMonth);
                        setDateRange({
                          filterStartDate: newMonth
                            .minus({ months: 1 })
                            .startOf("month")
                            .toISODate(),
                          filterEndDate: newMonth
                            .plus({ months: 1 })
                            .endOf("month")
                            .toISODate(),
                        });
                      }}
                      showGoogleCalendarEvents={showGoogleCalendarEvents}
                      showPublicOnly={showPublicOnly}
                      onGoogleCalendarToggle={setShowGoogleCalendarEvents}
                      onPublicOnlyToggle={setShowPublicOnly}
                    />
                  </div>
                  {/* Download Buttons */}
                  <div className="mt-4 flex justify-end gap-2 flex-wrap">
                    {/* Only show Generate Social Post button for advocates (signed in users with advocate access) */}
                    {isSignedIn &&
                    ((isAdvocate && isAdvocate.length > 0) || isAdmin) ? (
                      <button
                        onClick={handleOpenSocialPost}
                        className="px-2 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Generate Social Post
                      </button>
                    ) : null}
                    <CalendarScreenshotView
                      events={filteredEvents}
                      organizations={organizations}
                      month={currentCalendarMonth.month}
                      year={currentCalendarMonth.year}
                    />
                    {/* <EventsCalendarPDF
                      events={filteredEvents}
                      organizations={organizations}
                      month={currentCalendarMonth.month}
                      year={currentCalendarMonth.year}
                    /> */}
                  </div>
                </div>
              )}

              {filteredEvents.length === 0 && (
                <div className="text-center py-12">
                  <FaCalendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No events found
                  </h3>
                  <p className="text-gray-600">
                    {searchInput ||
                    selectedEventTypes.length > 0 ||
                    selectedTags.length > 0 ||
                    selectedStates.length > 0 ||
                    dateFilter !== "all"
                      ? "Try adjusting your filters or search terms."
                      : "There are no events available at the moment."}
                  </p>
                  {(searchInput ||
                    selectedEventTypes.length > 0 ||
                    selectedTags.length > 0 ||
                    selectedStates.length > 0 ||
                    dateFilter !== "all") && (
                    <button
                      onClick={handleClearAllFilters}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Filters - Right Sidebar */}
        {isFiltersVisible && (
          <div className="hidden lg:block w-64 flex-shrink-0 border-l border-gray-200 bg-white animate-slide-in-right">
            <div className="sticky top-32 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Filters</h3>
                  <button
                    onClick={() => setIsFiltersVisible(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-6">
                  {/* Date Filter */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Date Range
                    </h3>
                    <div className="space-y-2">
                      {[
                        {
                          id: "all",
                          name: "All Events",
                          count: processedEvents.length,
                        },
                        {
                          id: "upcoming",
                          name: "Upcoming",
                          count: processedEvents.filter(
                            (e) => e.startDateTime > DateTime.now()
                          ).length,
                        },
                        {
                          id: "past",
                          name: "Past Events",
                          count: processedEvents.filter(
                            (e) => e.endDateTime < DateTime.now()
                          ).length,
                        },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setDateFilter(option.id)}
                          className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 ${
                            dateFilter === option.id
                              ? "bg-blue-50 text-blue-600"
                              : ""
                          }`}
                        >
                          {option.name}
                          <span className="float-right text-gray-500 text-sm">
                            {option.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Event Types Filter */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">
                      Event Types
                    </h3>
                    <MultiSelect
                      options={eventTypes}
                      value={selectedEventTypes}
                      onChange={setSelectedEventTypes}
                      placeholder="Select types..."
                      chipClassName="bg-blue-100 text-blue-800"
                    />
                    {selectedEventTypes.length > 0 && (
                      <button
                        onClick={handleClearEventTypeFilters}
                        className="text-xs text-gray-500 hover:text-blue-600 mt-1"
                      >
                        Clear event type filters
                      </button>
                    )}
                  </div>

                  {/* Tags Filter */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Tags</h3>
                    <MultiSelect
                      options={tags}
                      value={selectedTags}
                      onChange={setSelectedTags}
                      placeholder="Select tags..."
                      chipClassName="bg-green-100 text-green-800"
                    />
                    {selectedTags.length > 0 && (
                      <button
                        onClick={handleClearTagFilters}
                        className="text-xs text-gray-500 hover:text-blue-600 mt-1"
                      >
                        Clear tag filters
                      </button>
                    )}
                  </div>

                  {/* States Filter */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">States</h3>
                    <MultiSelect
                      options={availableStates}
                      value={selectedStates}
                      onChange={setSelectedStates}
                      placeholder="Select states..."
                      chipClassName="bg-purple-100 text-purple-800"
                    />
                    {selectedStates.length > 0 && (
                      <button
                        onClick={handleClearStateFilters}
                        className="text-xs text-gray-500 hover:text-blue-600 mt-1"
                      >
                        Clear state filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Social Post Modal */}
      {isSocialModalOpen && (
        <Modal
          isOpen={isSocialModalOpen}
          onClose={() => setIsSocialModalOpen(false)}
          maxWidth="lg:w-2/3 w-full"
          className="!p-0 sm:!p-4"
        >
          <div className="text-gray-700 bg-white">
            <div className="px-6 pt-6 pb-2 text-lg font-semibold">
              Social post draft
            </div>
            <div className="px-6 pb-4 text-sm text-gray-500">
              A simple list of events for this month. Edit as needed before
              posting.
            </div>
            <div className="px-6 pb-6">
              <textarea
                value={socialPostText}
                onChange={(e) => setSocialPostText(e.target.value)}
                className="w-full h-64 border border-gray-300 rounded-lg p-3 font-mono text-sm"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard?.writeText(socialPostText);
                      toast.success("Copied to clipboard");
                    } catch (err) {
                      toast.error("Copy failed");
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Copy to clipboard
                </button>
                <button
                  onClick={() => setIsSocialModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* EventsChat Component */}
      <EventsChat
        ref={eventsChatRef}
        selectedEvents={autoSelectedEvents}
        onFilterToReferencedEvents={handleFilterToReferencedEvents}
        userDetails={userDetails}
        allCollections={allCollections}
        allResources={allResources}
        allOrganizations={organizations}
        allVideos={[]} // Add if you have videos
        history={chatHistory}
        onChatComplete={handleChatComplete}
        chatData={chatData}
        pinnedItems={pinnedItems}
        setPinnedItems={setPinnedItems}
      />

      {/* Loading Indicator */}
      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white p-6 rounded-lg shadow-xl flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0s" }}
              ></div>
              <div
                className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
            <span className="text-gray-700">Processing your request...</span>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkImportOpen && (
        <EventBulkImport
          onClose={() => setIsBulkImportOpen(false)}
          eventTypes={eventTypes}
          organizations={organizations}
          tags={tags}
        />
      )}

      {/* AI Event Creation Modal */}
      {isAIModalOpen && (
        <EventAICreate
          onClose={() => {
            setIsAIModalOpen(false);
            setIsAIBulkMode(false);
          }}
          onEventsCreated={(createdEvents) => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
            // Toast is already shown in EventAICreate component
            setIsAIModalOpen(false);
            setIsAIBulkMode(false);
          }}
          eventTypes={eventTypes}
          organizations={organizations}
          tags={tags}
          selectedTenants={selectedTenants}
          isBulkMode={isAIBulkMode}
        />
      )}

      {/* Events Export Modal */}
      <EventsExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setEventsToExport([]);
        }}
        events={eventsToExport.length > 0 ? eventsToExport : filteredEvents}
        preSelected={eventsToExport.length > 0}
      />

      {/* Add animation styles */}
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EventsPage;
