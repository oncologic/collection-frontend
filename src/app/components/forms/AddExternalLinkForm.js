import React, { useEffect, useRef, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import InputField from "@/app/components/inputs/InputField";
import SelectField from "@/app/components/inputs/SelectField";
import CustomEditor from "../common/CustomEditor";
import TagInput from "../inputs/TagInput";
import {
  FaGlobeAmericas,
  FaLink,
  FaLock,
  FaUsers,
  FaPlus,
  FaClock,
  FaArrowRight,
  FaTimes,
  FaInfoCircle,
  FaShareAlt,
  FaEdit,
} from "react-icons/fa";
import SearchableSelectField from "../inputs/SearchableSelectField";
import Modal from "@/app/components/Modal";
import CollaboratorInviteModal from "@/app/components/CollaboratorInviteModal";
import {
  useInviteCollaborator,
  useDeleteCollaborator,
} from "@/app/hooks/useCollections";
import {
  useExternalLinkTagsForLink,
  useAddTagsToExternalLink,
  useRemoveTagsFromExternalLink,
} from "@/app/hooks/useTags";
import {
  useSocialMediaAccounts,
  useSocialMediaPlatforms,
  useAssociatedSocialMediaAccounts,
  useCreateSocialMediaAssociation,
  useDeleteSocialMediaAssociation,
  useCreateSocialMediaAccount,
  useSocialMediaAccountTypes,
} from "@/app/hooks/useSocialMedia";
import CustomTimePicker from "./CustomTimePicker";
import { toast } from "react-hot-toast";
import HashtagInput from "../inputs/HashtagInput";
import { normalizeDateInputValue } from "@/app/utils/general";

const STATUS_OPTIONS = [
  { id: "pending", label: "Pending" },
  { id: "active", label: "Active" },
  { id: "completed", label: "Completed" },
  { id: "waiting", label: "Waiting" },
  { id: "large reference", label: "Large Reference" },
  { id: "archived", label: "Archived" },
].map(({ id, label }) => ({
  id,
  name: label,
}));

const getLinkStartDate = (values = {}) =>
  normalizeDateInputValue(values.startDate || values.start_date || values.date);

const getLinkEndDate = (values = {}) =>
  normalizeDateInputValue(
    values.endDate ||
      values.end_date ||
      values.startDate ||
      values.start_date ||
      values.date
  );

const buildDefaultFormValues = (initialValues, isEditMode, collectionTenantId) => ({
  ...initialValues,
  startDate: isEditMode ? getLinkStartDate(initialValues) : "",
  endDate: isEditMode ? getLinkEndDate(initialValues) : "",
  status: isEditMode
    ? STATUS_OPTIONS.find((option) => option.id === initialValues.status) ||
      STATUS_OPTIONS[0]
    : STATUS_OPTIONS[0],
  tenantId: collectionTenantId,
});

const AddExternalLinkForm = ({
  onSubmit,
  isAdmin,
  onClose,
  collectionTenantId,
  collectionData = null,
  isLoading = false,
  events = [],
  collaborators = [],
  isLoadingCollaborators = false,
  externalLinkId,
  onUpdateSingleField, // New prop for updating single fields
  initialValues = {
    name: "",
    url: "",
    type: "external",
    description: "",
    notes: "",
    imageUrl: "",
    visibility: "private",
    status: "pending",
    eventId: "",
    date: "",
    sortOrder: 0,
    allowPublicNotations: false,
  },
}) => {
  // Determine if we're in edit mode based on whether initialValues has actual content
  const isEditMode =
    initialValues &&
    (initialValues.name || initialValues.url || initialValues.description);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: buildDefaultFormValues(
      initialValues,
      isEditMode,
      collectionTenantId
    ),
  });

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSavingToggle, setIsSavingToggle] = useState(false);
  const { mutate: inviteCollaborator, isLoading: isInviting } =
    useInviteCollaborator();
  const { mutate: deleteCollaborator, isLoading: isDeleting } =
    useDeleteCollaborator();

  // Only reset form if in edit mode and the incoming initialValues have actually changed.
  const initialValuesRef = useRef(initialValues);
  useEffect(() => {
    if (
      isEditMode &&
      JSON.stringify(initialValuesRef.current) !== JSON.stringify(initialValues)
    ) {
      reset(buildDefaultFormValues(initialValues, isEditMode, collectionTenantId));
      initialValuesRef.current = initialValues;
    }
  }, [initialValues, reset, isEditMode, collectionTenantId]);

  const [eventOptions, setEventOptions] = useState([]);

  useEffect(() => {
    if (events?.length > 0) {
      const options = events.map((event) => ({
        id: event.id,
        name: event.title,
        date: event.startDate,
      }));
      setEventOptions(options);

      if (isEditMode && initialValues.eventId) {
        const defaultEvent = events.find(
          (event) => event.id === initialValues.eventId
        );
        if (defaultEvent) {
          setValue("eventId", {
            id: defaultEvent.id,
            name: defaultEvent.title,
          });
        }
      }
    }
  }, [events, initialValues.eventId, setValue, isEditMode]);

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    type: "link",
    description: "",
    notes: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    timezone: "",
    status: "pending",
    visibility: "private",
    sortOrder: 0,
    allowPublicNotations: false,
    // Only use initialValues when in edit mode
    ...(isEditMode
      ? {
          name: initialValues.name || "",
          url: initialValues.url || "",
          type: initialValues.type || "link",
          description: initialValues.description || "",
          notes: initialValues.notes || "",
          imageUrl: initialValues.imageUrl || "",
          startDate: getLinkStartDate(initialValues),
          endDate: getLinkEndDate(initialValues),
          startTime: initialValues.startTime || initialValues.time || "",
          endTime: initialValues.endTime || "",
          timezone: initialValues.timezone || "",
          visibility: initialValues.visibility || "private",
          status: initialValues.status || "pending",
          sortOrder: initialValues.sortOrder || 0,
          allowPublicNotations: Boolean(initialValues.allowPublicNotations),
        }
      : {}),
  });

  // Set default timezone if not provided AND either start or end time is set
  useEffect(() => {
    if ((formData.startTime || formData.endTime) && !formData.timezone) {
      setFormData((prev) => ({
        ...prev,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }));
    }
  }, [formData.startTime, formData.endTime, formData.timezone]);

  // Update this useEffect to only initialize formData with initialValues when in edit mode
  useEffect(() => {
    if (isEditMode) {
      setFormData((prevData) => ({
        ...prevData,
        name: initialValues.name || "",
        url: initialValues.url || "",
        type: initialValues.type || "link",
        description: initialValues.description || "",
        notes: initialValues.notes || "",
        imageUrl: initialValues.imageUrl || "",
        startDate: getLinkStartDate(initialValues),
        endDate: getLinkEndDate(initialValues),
        visibility: initialValues.visibility || "private",
        status: initialValues.status || "pending",
        startTime: initialValues.startTime || initialValues.time || "",
        endTime: initialValues.endTime || "",
        timezone: initialValues.timezone || "",
        sortOrder: initialValues.sortOrder || 0,
        allowPublicNotations: Boolean(initialValues.allowPublicNotations),
      }));

      // Specifically set timezone in form control if it exists in initialValues
      if (initialValues.timezone) {
        // Format timezone as an object with id and name properties for SelectField
        const timezoneObject = {
          id: initialValues.timezone,
          name: initialValues.timezone.replace(/_/g, " "),
        };
        setValue("timezone", timezoneObject);
      }
    }
  }, [initialValues, setValue, isEditMode]);

  // Update the handleFormDataChange function to properly update the form state
  const handleFormDataChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Also update the react-hook-form value
    setValue(field, value);
  };

  // Automatically set end time 1 hour after start time when start time changes
  const handleStartTimeChange = (time) => {
    setFormData((prev) => ({
      ...prev,
      startTime: time,
    }));

    // If we have a valid start time and no end time yet, set end time to start time + 1 hour
    if (time && !formData.endTime) {
      try {
        const [hours, minutes] = time.split(":");
        const hourInt = parseInt(hours, 10);
        const endHour = (hourInt + 1) % 24;
        const endTime = `${endHour.toString().padStart(2, "0")}:${minutes}`;

        setFormData((prev) => ({
          ...prev,
          endTime: endTime,
        }));
      } catch (e) {
        console.error("Error calculating end time:", e);
      }
    }
  };

  // Tag-related state and hooks
  const [selectedTags, setSelectedTags] = useState([]);
  const { data: linkTags = [], isLoading: isLoadingTags } =
    useExternalLinkTagsForLink(externalLinkId);
  const { mutate: addTags } = useAddTagsToExternalLink();
  const { mutate: removeTags } = useRemoveTagsFromExternalLink();

  // Social media-related state and hooks
  const [selectedSocialAccounts, setSelectedSocialAccounts] = useState([]);
  const [showSocialMediaSection, setShowSocialMediaSection] = useState(false);
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);
  const [socialMediaSearchTerm, setSocialMediaSearchTerm] = useState("");
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState("");
  const [externalLinkHashtags, setExternalLinkHashtags] = useState(
    initialValues.hashtags
      ? typeof initialValues.hashtags === "string"
        ? initialValues.hashtags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : initialValues.hashtags
      : []
  );
  const [newAccountData, setNewAccountData] = useState({
    platformId: "",
    accountTypeId: "",
    name: "",
    handle: "",
    url: "",
    description: "",
    visibility: "private",
  });
  const { data: socialMediaData = [], isLoading: isLoadingSocialAccounts } =
    useSocialMediaAccounts(false); // false for unformatted array data
  const { data: platforms = [], isLoading: isLoadingPlatforms } =
    useSocialMediaPlatforms();
  const { data: accountTypes = [], isLoading: isLoadingAccountTypes } =
    useSocialMediaAccountTypes();
  const {
    data: associatedSocialAccounts = [],
    isLoading: isLoadingAssociations,
  } = useAssociatedSocialMediaAccounts(
    externalLinkId,
    "collection_external_link"
  );
  const { mutate: createSocialAssociation } = useCreateSocialMediaAssociation();
  const { mutate: deleteSocialAssociation } = useDeleteSocialMediaAssociation();
  const { mutate: createSocialAccount, isPending: isCreatingAccount } =
    useCreateSocialMediaAccount();

  // Ensure socialMediaData is an array and enrich with platform info
  const socialMediaAccounts = useMemo(() => {
    const accounts = Array.isArray(socialMediaData) ? socialMediaData : [];
    return accounts.map((account) => ({
      ...account,
      platform: platforms.find((p) => p.id === account.platformId),
    }));
  }, [socialMediaData, platforms]);

  // Filter social media accounts based on search and platform
  const filteredSocialMediaAccounts = useMemo(() => {
    return socialMediaAccounts.filter((account) => {
      // Search filter
      const searchMatch =
        !socialMediaSearchTerm ||
        account.name
          .toLowerCase()
          .includes(socialMediaSearchTerm.toLowerCase()) ||
        (account.handle &&
          account.handle
            .toLowerCase()
            .includes(socialMediaSearchTerm.toLowerCase())) ||
        (account.platform?.name &&
          account.platform.name
            .toLowerCase()
            .includes(socialMediaSearchTerm.toLowerCase()));

      // Platform filter
      const platformMatch =
        !selectedPlatformFilter ||
        account.platformId === selectedPlatformFilter;

      return searchMatch && platformMatch;
    });
  }, [socialMediaAccounts, socialMediaSearchTerm, selectedPlatformFilter]);

  // Initialize tags when loading link data
  useEffect(() => {
    if (isEditMode && linkTags.length > 0) {
      setSelectedTags(linkTags);
    }
  }, [linkTags, isEditMode]);

  // Initialize social media accounts when loading link data
  useEffect(() => {
    if (isEditMode && associatedSocialAccounts.length > 0) {
      // Extract the account objects from the associations
      const accounts = associatedSocialAccounts
        .map((association) => association.account)
        .filter(Boolean);
      setSelectedSocialAccounts(accounts);
      if (accounts.length > 0) {
        setShowSocialMediaSection(true);
      }
    }
  }, [associatedSocialAccounts, isEditMode]);

  useEffect(() => {
    setNewAccountData((current) => ({
      ...current,
      platformId: current.platformId || platforms[0]?.id || "",
      accountTypeId: current.accountTypeId || accountTypes[0]?.id || "",
    }));
  }, [accountTypes, platforms]);

  const onSubmitWrapper = async (data) => {
    if (!data) {
      console.error("Form data is empty");
      return;
    }

    try {
      const startDate = data.startDate || formData.startDate || null;
      const endDate =
        data.endDate || formData.endDate || data.startDate || formData.startDate || null;
      const transformedData = {
        ...data,
        status: data.status?.id || data.status,
        eventId: data?.eventId?.id || data.eventId,
        date: startDate,
        startDate: startDate,
        endDate: endDate,
        // Add the time and timezone fields from formData
        startTime: formData.startTime || null,
        endTime: formData.endTime || null,
        timezone:
          formData.startTime || formData.endTime
            ? data.timezone?.id ||
              formData.timezone ||
              Intl.DateTimeFormat().resolvedOptions().timeZone
            : null,
        // For backward compatibility
        time: formData.startTime || null,
        sortOrder: formData.sortOrder || 0,
        hashtags: externalLinkHashtags.join(","),
        allowPublicNotations: Boolean(formData.allowPublicNotations),
      };

      // Submit the form first
      const result = await onSubmit(transformedData);

      // Handle tags if we have an external link ID (for both create and edit)
      const linkId = externalLinkId || result?.id;
      if (linkId && selectedTags.length > 0) {
        // Add tags to the external link
        const tagIds = selectedTags.map((tag) => tag.id);
        addTags({
          externalLinkId: linkId,
          tagIds: tagIds,
        });
      }

      // Handle social media associations
      if (linkId) {
        // Get current associated account IDs
        const currentAccountIds = associatedSocialAccounts
          .map((assoc) => assoc.account?.id)
          .filter(Boolean);
        const newAccountIds = selectedSocialAccounts.map((acc) => acc.id);

        // Find accounts to add and remove
        const accountsToAdd = newAccountIds.filter(
          (id) => !currentAccountIds.includes(id)
        );
        const accountsToRemove = currentAccountIds.filter(
          (id) => !newAccountIds.includes(id)
        );

        // Create new associations
        for (const accountId of accountsToAdd) {
          createSocialAssociation({
            socialMediaAccountId: accountId,
            associatedId: linkId,
            associatedType: "collection_external_link",
          });
        }

        // Remove old associations
        for (const accountId of accountsToRemove) {
          deleteSocialAssociation({
            socialMediaAccountId: accountId,
            associatedId: linkId,
            associatedType: "collection_external_link",
          });
        }
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Handle tag changes
  const handleTagsChange = (tags) => {
    setSelectedTags(tags);

    // If we're editing an existing link, immediately update tags
    if (externalLinkId) {
      const currentTagIds = linkTags.map((tag) => tag.id);
      const newTagIds = tags.map((tag) => tag.id);

      // Find tags to add and remove
      const tagsToAdd = newTagIds.filter((id) => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter(
        (id) => !newTagIds.includes(id)
      );

      // Add new tags
      if (tagsToAdd.length > 0) {
        addTags({
          externalLinkId: externalLinkId,
          tagIds: tagsToAdd,
        });
      }

      // Remove old tags
      if (tagsToRemove.length > 0) {
        removeTags({
          externalLinkId: externalLinkId,
          tagIds: tagsToRemove,
        });
      }
    }
  };

  const handleInviteCollaborator = (collaboratorData) => {
    if (externalLinkId) {
      return new Promise((resolve, reject) => {
        inviteCollaborator(
          {
            externalLinkId,
            collaboratorData,
          },
          {
            onSuccess: (data) => {
              // Don't close the modal immediately, let the modal handle the response
              resolve(data);
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });
    }
    return Promise.reject(new Error("External link ID is required"));
  };

  // Quick action: Mark as Completed
  const handleMarkAsCompleted = async () => {
    // Set status to completed and submit immediately
    setValue(
      "status",
      STATUS_OPTIONS.find((opt) => opt.id === "completed")
    );
    // Get current form values
    const values = {
      ...initialValues,
      ...control._formValues,
      status: "completed",
    };
    await onSubmitWrapper(values);
  };

  const handleDeleteCollaborator = (collaboratorUserId) => {
    if (window.confirm("Are you sure you want to remove this collaborator?")) {
      deleteCollaborator({
        externalLinkId,
        collaboratorUserId,
      });
    }
  };

  // Handle social media account selection changes
  const handleSocialAccountChange = (account, isChecked) => {
    let newSelectedAccounts;
    if (isChecked) {
      newSelectedAccounts = [...selectedSocialAccounts, account];
    } else {
      newSelectedAccounts = selectedSocialAccounts.filter(
        (acc) => acc.id !== account.id
      );
    }
    setSelectedSocialAccounts(newSelectedAccounts);

    // If we're editing an existing link, immediately update associations
    if (externalLinkId) {
      if (isChecked) {
        // Add association
        createSocialAssociation({
          socialMediaAccountId: account.id,
          associatedId: externalLinkId,
          associatedType: "collection_external_link",
        });
      } else {
        // Remove association
        deleteSocialAssociation({
          socialMediaAccountId: account.id,
          associatedId: externalLinkId,
          associatedType: "collection_external_link",
        });
      }
    }
  };

  // Handle creating new social media account
  const handleCreateSocialAccount = () => {
    if (
      !newAccountData.platformId ||
      !newAccountData.accountTypeId ||
      !newAccountData.name ||
      !newAccountData.url
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    createSocialAccount(
      {
        ...newAccountData,
        platformId: newAccountData.platformId,
      },
      {
        onSuccess: (newAccount) => {
          // Add platform info to the new account for display
          const accountWithPlatform = {
            ...newAccount,
            platform: platforms.find((p) => p.id === newAccountData.platformId),
          };

          // Add to selected accounts
          setSelectedSocialAccounts([
            ...selectedSocialAccounts,
            accountWithPlatform,
          ]);

          // If we're editing an existing link, create association immediately
          if (externalLinkId) {
            createSocialAssociation({
              socialMediaAccountId: newAccount.id,
              associatedId: externalLinkId,
              associatedType: "collection_external_link",
            });
          }

          // Reset form and close
          setNewAccountData({
            platformId: platforms[0]?.id || "",
            accountTypeId: accountTypes[0]?.id || "",
            name: "",
            handle: "",
            url: "",
            description: "",
            visibility: "private",
          });
          setShowAddAccountForm(false);
          toast.success("Social media account created successfully");
        },
        onError: (error) => {
          toast.error(error.message || "Failed to create social media account");
        },
      }
    );
  };

  // Add common timezones list
  const commonTimezones = [
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Phoenix",
    "America/Anchorage",
    "America/Honolulu",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];

  // Add user's timezone if not in the list
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (!commonTimezones.includes(userTimezone)) {
    commonTimezones.unshift(userTimezone);
  }

  // Handle auto-save for allowPublicNotations toggle
  const handleAllowPublicNotationsToggle = async (checked) => {
    // Update local state immediately
    handleFormDataChange("allowPublicNotations", checked);

    // Only auto-save if we're in edit mode and have an externalLinkId
    if (isEditMode && externalLinkId && onUpdateSingleField) {
      setIsSavingToggle(true);
      try {
        // Call the update function with just this field
        await onUpdateSingleField(externalLinkId, {
          allowPublicNotations: checked,
        });
        toast.success(
          checked
            ? "Public notation submissions enabled"
            : "Public notation submissions disabled"
        );
      } catch (error) {
        console.error("Error updating allowPublicNotations:", error);
        toast.error("Failed to update setting");
        // Revert local state on error
        handleFormDataChange("allowPublicNotations", !checked);
      } finally {
        setIsSavingToggle(false);
      }
    } else if (isEditMode && externalLinkId && !onUpdateSingleField) {
      // If we're in edit mode but don't have the update function, just update local state
      console.warn(
        "Auto-save not available - onUpdateSingleField function not provided"
      );
      // Don't revert the state in this case, let it be saved with the form submission
    }
  };

  return (
    <div className="flex items-center justify-center p-4 w-full mx-auto">
      <form
        onSubmit={handleSubmit(onSubmitWrapper)}
        className="text-gray-700 w-full bg-white rounded-lg p-8"
      >
        {/* Quick Action Button */}
        <div className="flex justify-end mb-2">
          <button
            type="button"
            onClick={handleMarkAsCompleted}
            className="px-4 py-1 rounded-md bg-green-500 text-white font-semibold shadow hover:bg-green-600 transition-colors text-sm"
            title="Mark as Completed"
          >
            Mark as Completed
          </button>
        </div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-700">
            {isEditMode
              ? "Edit External Reference"
              : "Add New External Reference"}
          </h1>
          {/* Visibility Selection */}
          <div className="flex justify-end">
            <div className="flex flex-wrap gap-3">
              {/* Public option - only for admins */}
              <Controller
                name="visibility"
                control={control}
                render={({ field }) => (
                  <>
                    <button
                      type="button"
                      onClick={() => field.onChange("private")}
                      className={`px-4 py-1 rounded-md flex items-center gap-2 transition-all ${
                        field.value === "private"
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-blue-50"
                      }`}
                    >
                      <FaLock className="text-sm" />
                      <span className="text-sm">Private</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("unlisted")}
                      className={`px-4 py-1 rounded-md flex items-center gap-2 transition-all ${
                        field.value === "unlisted"
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-blue-50"
                      }`}
                    >
                      <FaLink className="text-sm" />
                      <span className="text-sm">Unlisted</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange("public")}
                      disabled={!isAdmin}
                      className={`px-4 py-1 rounded-md flex items-center gap-2 transition-all ${
                        field.value === "public"
                          ? "bg-green-100 text-green-700 border border-green-300"
                          : "bg-gray-50 text-gray-500 border border-gray-200"
                      } ${
                        !isAdmin
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-green-50"
                      }`}
                    >
                      <FaGlobeAmericas className="text-sm" />
                      <span className="text-sm">Public</span>
                      {!isAdmin && (
                        <span className="text-xs">(Admin only)</span>
                      )}
                    </button>
                  </>
                )}
              />
            </div>
          </div>
        </div>

        {/* Auto-sync notification for collection collaborators */}
        {collectionData && collectionData.hasCollaborators && (
          <Controller
            name="visibility"
            control={control}
            render={({ field }) => {
              const showNotification =
                field.value === "public" || field.value === "unlisted";
              if (!showNotification) return null;

              return (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <FaInfoCircle className="text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">
                        Collection Collaborator Auto-sync
                      </p>
                      <p>
                        This {field.value} external link will automatically
                        inherit all collaborators from the collection. New
                        collaborators added to the collection will also get
                        access to this link.
                      </p>
                      {collectionData.collaboratorCount > 0 && (
                        <p className="mt-1 text-xs">
                          Currently {collectionData.collaboratorCount}{" "}
                          collection collaborator
                          {collectionData.collaboratorCount !== 1 ? "s" : ""}
                          will have access to this link.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            }}
          />
        )}

        {/* Public Notation Submission Settings */}
        <Controller
          name="visibility"
          control={control}
          render={({ field }) => {
            const isPublicOrUnlisted =
              field.value === "public" || field.value === "unlisted";
            if (!isPublicOrUnlisted) return null;

            return (
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FaEdit className="text-gray-600" />
                      <h3 className="text-sm font-medium text-gray-700">
                        Allow Public Notation Submissions
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600">
                      When enabled, visitors to the public link can submit
                      notations with any custom fields you&apos;ve configured.
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.allowPublicNotations}
                        onChange={(e) =>
                          handleAllowPublicNotationsToggle(e.target.checked)
                        }
                        disabled={isSavingToggle}
                      />
                      <div
                        className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${
                          isSavingToggle ? "opacity-50" : ""
                        }`}
                      ></div>
                    </label>
                    {isSavingToggle && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></span>
                        Saving...
                      </span>
                    )}
                  </div>
                </div>
                {formData.allowPublicNotations && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded">
                    <p className="text-xs text-amber-800">
                      <strong>Note:</strong> Public users will be able to submit
                      notations. These submissions will be marked as
                      &quot;pending&quot; and can include any custom fields
                      configured for this external link.
                    </p>
                  </div>
                )}
              </div>
            );
          }}
        />

        <div className="space-y-4">
          {/* Link Name */}
          <InputField
            id="name"
            name="name"
            label="Link Name"
            placeholder="Enter link name"
            register={register}
            required={true}
            error={errors.name}
            onChange={(e) => handleFormDataChange("name", e.target.value)}
            value={formData.name}
          />

          {/* Tags Section */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Tags
            </label>
            <TagInput
              value={selectedTags}
              onChange={handleTagsChange}
              externalLinkId={externalLinkId}
              placeholder="Add tags to categorize this link..."
              disabled={isLoadingTags}
            />
            {isLoadingTags && (
              <p className="text-xs text-gray-500">Loading tags...</p>
            )}
          </div>

          {/* Hashtags Section */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Social Media Hashtags
              </label>
              <div className="relative group">
                <FaInfoCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
                <div className="absolute left-0 top-6 z-50 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    How Hashtags Work:
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 font-bold">•</span>
                      <span>
                        Hashtags help categorize and track social media content
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 font-bold">•</span>
                      <span>
                        Use them to search across Twitter, Facebook, Instagram,
                        LinkedIn, and YouTube
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-500 mr-2 font-bold">•</span>
                      <span>
                        Examples: &quot;CancerResearch&quot;, &quot;ChRCC&quot;,
                        &quot;ASCO2025&quot;, &quot;PatientAdvocacy&quot;
                      </span>
                    </li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                    <span className="font-medium">Tip:</span> Don&apos;t include
                    the # symbol - it&apos;s added automatically!
                  </div>
                </div>
              </div>
            </div>
            <HashtagInput
              value={externalLinkHashtags}
              onChange={setExternalLinkHashtags}
              label=""
              placeholder="Add hashtags for social media tracking (e.g., CancerResearch, ChRCC, Clinical)"
            />
          </div>

          {/* Social Media Accounts Section */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">
                <FaShareAlt className="inline mr-2" /> Social Media Accounts
              </label>
              <button
                type="button"
                onClick={() =>
                  setShowSocialMediaSection(!showSocialMediaSection)
                }
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showSocialMediaSection ? "Hide" : "Show"}
              </button>
            </div>

            {showSocialMediaSection && (
              <div className="mt-2">
                {isLoadingSocialAccounts ||
                isLoadingPlatforms ||
                isLoadingAccountTypes ||
                isLoadingAssociations ? (
                  <p className="text-xs text-gray-500">
                    Loading social media accounts...
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-gray-600">
                        Associate social media accounts with this external link
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setShowAddAccountForm(!showAddAccountForm)
                        }
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <FaPlus className="w-3 h-3" />
                        {showAddAccountForm ? "Cancel" : "Add New Account"}
                      </button>
                    </div>

                    {/* Search and Filter Controls */}
                    <div className="flex gap-2 mb-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Search accounts..."
                          value={socialMediaSearchTerm}
                          onChange={(e) =>
                            setSocialMediaSearchTerm(e.target.value)
                          }
                          className="w-full text-sm py-1.5 px-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <select
                        value={selectedPlatformFilter}
                        onChange={(e) =>
                          setSelectedPlatformFilter(e.target.value)
                        }
                        className="text-sm py-1.5 px-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">All Platforms</option>
                        {platforms.map((platform) => (
                          <option key={platform.id} value={platform.id}>
                            {platform.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Add Account Form */}
                    {showAddAccountForm && (
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          Create New Social Media Account
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Platform *
                            </label>
                            <select
                              className="w-full text-sm py-1.5 px-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              value={newAccountData.platformId}
                              onChange={(e) =>
                                setNewAccountData({
                                  ...newAccountData,
                                  platformId: e.target.value,
                                })
                              }
                              disabled={isCreatingAccount}
                            >
                              <option value="">Select a platform</option>
                              {platforms.map((platform) => (
                                <option key={platform.id} value={platform.id}>
                                  {platform.name}
                                </option>
                              ))}
                            </select>
                          </div>

	                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Name *
                              </label>
                              <input
                                type="text"
                                className="w-full text-sm py-1.5 px-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Account name"
                                value={newAccountData.name}
                                onChange={(e) =>
                                  setNewAccountData({
                                    ...newAccountData,
                                    name: e.target.value,
                                  })
                                }
                                disabled={isCreatingAccount}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Handle
                              </label>
                              <input
                                type="text"
                                className="w-full text-sm py-1.5 px-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="@handle (optional)"
                                value={newAccountData.handle}
                                onChange={(e) =>
                                  setNewAccountData({
                                    ...newAccountData,
                                    handle: e.target.value,
                                  })
                                }
                                disabled={isCreatingAccount}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              URL *
                            </label>
                            <input
                              type="url"
                              className="w-full text-sm py-1.5 px-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              placeholder="https://..."
                              value={newAccountData.url}
                              onChange={(e) =>
                                setNewAccountData({
                                  ...newAccountData,
                                  url: e.target.value,
                                })
                              }
                              disabled={isCreatingAccount}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
	                              <label className="block text-xs font-medium text-gray-700 mb-1">
	                                Account Type *
	                              </label>
	                              <select
	                                className="w-full text-sm py-1.5 px-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
	                                value={newAccountData.accountTypeId}
	                                onChange={(e) =>
	                                  setNewAccountData({
	                                    ...newAccountData,
	                                    accountTypeId: e.target.value,
	                                  })
	                                }
	                                disabled={isCreatingAccount}
	                              >
	                                <option value="">Select account type</option>
	                                {accountTypes.map((type) => (
	                                  <option key={type.id} value={type.id}>
	                                    {type.name}
	                                  </option>
	                                ))}
	                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Visibility
                              </label>
                              <select
                                className="w-full text-sm py-1.5 px-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={newAccountData.visibility}
                                onChange={(e) =>
                                  setNewAccountData({
                                    ...newAccountData,
                                    visibility: e.target.value,
                                  })
                                }
                                disabled={isCreatingAccount || !isAdmin}
                              >
                                <option value="private">Private</option>
                                {isAdmin && (
                                  <option value="public">Public</option>
                                )}
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <textarea
                              className="w-full text-sm py-1.5 px-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                              rows="2"
                              placeholder="Optional description"
                              value={newAccountData.description}
                              onChange={(e) =>
                                setNewAccountData({
                                  ...newAccountData,
                                  description: e.target.value,
                                })
                              }
                              disabled={isCreatingAccount}
                            />
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowAddAccountForm(false);
                                setNewAccountData({
	                                  platformId: "",
	                                  accountTypeId: accountTypes[0]?.id || "",
	                                  name: "",
	                                  handle: "",
	                                  url: "",
	                                  description: "",
	                                  visibility: "private",
	                                });
                              }}
                              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                              disabled={isCreatingAccount}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleCreateSocialAccount}
                              disabled={
                                isCreatingAccount ||
	                                !newAccountData.platformId ||
	                                !newAccountData.accountTypeId ||
	                                !newAccountData.name ||
	                                !newAccountData.url
                              }
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              {isCreatingAccount ? (
                                <>
                                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></span>
                                  Creating...
                                </>
                              ) : (
                                "Create Account"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    {filteredSocialMediaAccounts.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">
                        {socialMediaSearchTerm || selectedPlatformFilter
                          ? "No accounts match your search criteria."
                          : "No social media accounts available. Add them in the Social Media section."}
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md p-2">
                        {filteredSocialMediaAccounts.map((account) => (
                          <label
                            key={account.id}
                            className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={selectedSocialAccounts.some(
                                (acc) => acc.id === account.id
                              )}
                              onChange={(e) =>
                                handleSocialAccountChange(
                                  account,
                                  e.target.checked
                                )
                              }
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm">
                                  {account.name}
                                </span>
                                {account.platform && (
                                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                                    {account.platform.name}
                                  </span>
                                )}
                              </div>
                              {account.handle && (
                                <span className="text-xs text-gray-500">
                                  {account.platform?.name?.toLowerCase() ===
                                  "email"
                                    ? account.handle
                                    : `@${account.handle}`}
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                    {selectedSocialAccounts.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="text-xs text-gray-600">Selected:</span>
                        {selectedSocialAccounts.map((account) => (
                          <span
                            key={account.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs"
                          >
                            {account.name}
                            <button
                              type="button"
                              onClick={() =>
                                handleSocialAccountChange(account, false)
                              }
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <FaTimes className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
            {/* Date field */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                {...register("startDate", {
                  onChange: (e) => {
                    handleFormDataChange("startDate", e.target.value);
                    if (!formData.endDate) {
                      handleFormDataChange("endDate", e.target.value);
                    }
                  },
                })}
                value={formData.startDate || ""}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                End Date
              </label>
              <input
                type="date"
                min={formData.startDate || undefined}
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                {...register("endDate", {
                  onChange: (e) => {
                    handleFormDataChange("endDate", e.target.value);
                  },
                })}
                value={formData.endDate || ""}
              />
            </div>

            {/* Time fields with CustomTimePicker - updated to include both start and end times */}
            <div className="space-y-4 md:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {/* Start Time field */}
                <CustomTimePicker
                  value={formData.startTime || ""}
                  onChange={handleStartTimeChange}
                  className="space-y-1"
                  label="Start Time (optional)"
                />

                {/* End Time field */}
                <CustomTimePicker
                  value={formData.endTime || ""}
                  onChange={(timeValue) =>
                    setFormData({ ...formData, endTime: timeValue })
                  }
                  className="space-y-1"
                  label="End Time (optional)"
                />
                {/* Timezone field - only show if either time is set */}
                {(formData.startTime || formData.endTime) && (
                  <div className="space-y-1">
                    <Controller
                      name="timezone"
                      control={control}
                      defaultValue={
                        formData.timezone
                          ? {
                              id: formData.timezone,
                              name: formData.timezone.replace(/_/g, " "),
                            }
                          : {
                              id: userTimezone,
                              name: userTimezone.replace(/_/g, " "),
                            }
                      }
                      render={({ field }) => (
                        <SelectField
                          label="Timezone"
                          options={commonTimezones.map((tz) => ({
                            id: tz,
                            name: tz.replace(/_/g, " "),
                          }))}
                          value={field.value}
                          onChange={(selectedTimezone) => {
                            field.onChange(selectedTimezone);
                            setFormData((prev) => ({
                              ...prev,
                              timezone:
                                selectedTimezone?.id || selectedTimezone,
                            }));
                          }}
                        >
                          {commonTimezones.map((tz) => (
                            <option key={tz} value={tz}>
                              {tz.replace(/_/g, " ")}
                            </option>
                          ))}
                        </SelectField>
                      )}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Selection - Admin Only */}
          {isAdmin && (
            <SelectField
              name="status"
              control={control}
              label="Status"
              options={STATUS_OPTIONS}
            />
          )}

          {/* Sort Order - Admin Only */}
          {isAdmin && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Sort Order
              </label>
              <input
                type="number"
                min="0"
                step="1"
                className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={formData.sortOrder || 0}
                onChange={(e) =>
                  handleFormDataChange(
                    "sortOrder",
                    parseInt(e.target.value) || 0
                  )
                }
                placeholder="0"
              />
              <p className="text-xs text-gray-500">
                Lower numbers appear first. Leave as 0 for automatic ordering.
              </p>
            </div>
          )}

          {/* URL */}
          <InputField
            id="url"
            name="url"
            label="URL"
            placeholder="https://example.com"
            register={register}
            required={false}
            error={errors.url}
            onChange={(e) => handleFormDataChange("url", e.target.value)}
            value={formData.url}
          />

          {/* Type */}
          {isAdmin && (
            <InputField
              id="type"
              name="type"
              label="Link Type"
              placeholder="Enter link type"
              register={register}
              error={errors.type}
              onChange={(e) => handleFormDataChange("type", e.target.value)}
              value={formData.type}
            />
          )}

          {/* Event Selection */}
          <SearchableSelectField
            name="eventId"
            control={control}
            label="Event"
            options={eventOptions}
            placeholder="Search for an event..."
          />

          {/* Collaborators Section */}
          {isAdmin && (
            <div className="my-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  <FaUsers className="inline mr-2" /> Collaborators
                </label>
                <button
                  type="button"
                  onClick={() =>
                    externalLinkId ? setShowInviteModal(true) : null
                  }
                  className={`flex items-center text-sm font-medium ${
                    externalLinkId
                      ? "text-blue-600 hover:text-blue-800 cursor-pointer"
                      : "text-gray-400 cursor-not-allowed"
                  }`}
                  disabled={!externalLinkId}
                  title={
                    externalLinkId
                      ? "Invite collaborators"
                      : "Save link first to invite collaborators"
                  }
                >
                  <FaPlus className="mr-1 text-xs" />
                  Invite
                </button>
              </div>
              {isLoadingCollaborators ? (
                <div className="py-2 text-gray-500">
                  Loading collaborators...
                </div>
              ) : collaborators && collaborators.length > 0 ? (
                <div className="border rounded-md p-3 bg-gray-50">
                  <div className="flex flex-wrap gap-2">
                    {collaborators.map((collaborator) => (
                      <div
                        key={collaborator.id}
                        className="bg-white px-3 py-1.5 rounded-full text-sm border border-gray-200 flex items-center gap-2"
                        title={collaborator.email}
                      >
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-medium">
                          {collaborator.name?.charAt(0) ||
                            collaborator.email?.charAt(0) ||
                            "?"}
                        </div>
                        <span className="font-medium">
                          {collaborator.name || collaborator.email}
                        </span>
                        {collaborator.role && (
                          <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                            {collaborator.role}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            handleDeleteCollaborator(collaborator.userId)
                          }
                          disabled={isDeleting}
                          className="ml-1 text-red-500 hover:text-red-700 text-xs p-1 hover:bg-red-50 rounded-full transition-colors"
                          title="Remove collaborator"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : externalLinkId ? (
                <div className="py-2 text-gray-500 flex items-center justify-between p-4 border border-dashed border-gray-300 rounded-md">
                  <span>No collaborators yet</span>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(true)}
                    className="text-blue-600 hover:text-blue-800 flex items-center font-medium"
                  >
                    <FaPlus className="mr-1 text-xs" />
                    Add collaborator
                  </button>
                </div>
              ) : (
                <div className="py-2 text-gray-500 p-4 border border-dashed border-gray-300 rounded-md flex items-center justify-center">
                  <FaUsers className="text-gray-400 mr-2" />
                  Save the link first to add collaborators
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <div className="w-full p-2 border rounded-md min-h-[300px] overflow-y-auto">
              <Controller
                name="description"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <CustomEditor
                    content={value || formData.description}
                    onChange={(newContent) => {
                      onChange(newContent);
                      handleFormDataChange("description", newContent);
                    }}
                    readOnly={false}
                    showBorder={true}
                  />
                )}
              />
            </div>
          </div>

          {/* Image URL */}
          <InputField
            id="imageUrl"
            name="imageUrl"
            label="Image URL"
            placeholder="https://example.com/image.jpg"
            register={register}
            error={errors.imageUrl}
            onChange={(e) => handleFormDataChange("imageUrl", e.target.value)}
            value={formData.imageUrl}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end mt-8 gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-700 text-lg font-medium rounded-lg hover:bg-gray-100 border border-gray-300 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-[#4263EB] hover:bg-[#3b5bd9] text-white text-lg font-medium rounded-lg flex items-center gap-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading
              ? "Saving..."
              : isEditMode
              ? "Update External Link"
              : "Create External Link"}
          </button>
        </div>
      </form>

      {/* Invite Collaborator Modal */}
      {showInviteModal && (
        <Modal onClose={() => setShowInviteModal(false)}>
          <CollaboratorInviteModal
            onClose={() => setShowInviteModal(false)}
            onSubmit={handleInviteCollaborator}
            isLoading={isInviting}
          />
        </Modal>
      )}
    </div>
  );
};

export default AddExternalLinkForm;
