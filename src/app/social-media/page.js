"use client";
import React, { useState, useMemo, useRef } from "react";
import {
  FaRss,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaGlobe,
  FaUserMd,
  FaHospital,
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaLock,
  FaGlobeAmericas,
  FaYoutube,
  FaSearch,
  FaCopy,
  FaLink,
  FaMagic,
  FaFileImport,
  FaUpload,
  FaImage,
} from "react-icons/fa";
import {
  useSocialMediaAccounts,
  useSocialMediaPlatforms,
  useSocialMediaPlatformCatalog,
  useSocialMediaAccountTypes,
  useCreateSocialMediaPlatform,
  useCreateSocialMediaAccount,
  useUpdateSocialMediaAccount,
  useDeleteSocialMediaAccount,
  useCreateSocialMediaAssociation,
  useSocialMediaAccountAssociations,
} from "../hooks/useSocialMedia";
import { usePreviewSocialMediaAccounts } from "../hooks/useSocialMediaAI";
import { useProcessImage } from "../hooks/useAI";

import SelectField from "../components/inputs/SelectField";
import SearchableDropdown from "../components/inputs/SearchableDropdown";
import SearchableEntitySelect from "../components/inputs/SearchableEntitySelect";
import SocialMediaAssociationModal from "../components/social-media/SocialMediaAssociationModal";
import SocialMediaAccountsList from "../components/social-media/SocialMediaAccountsList";
import SocialMediaAICreate from "../components/SocialMediaAICreate";
import SocialMediaCSVImport from "../components/SocialMediaCSVImport";
import Modal from "../components/Modal";
import { useForm, useController } from "react-hook-form";
import { useContextAuth } from "../context/authContext";
import { useOrganizations } from "../hooks/useOrganizations";
import { useGetAllCollections } from "../hooks/useResources";
import toast from "react-hot-toast";
import {
  findPlatformOptionFromParsedUrl,
  parseSocialMediaProfileAutofill,
} from "../utils/socialMediaProfileAutofill";

// Loading component
const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-12">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const PLATFORM_ORDER = [
  "instagram",
  "facebook",
  "twitter",
  "x",
  "linkedin",
  "youtube",
];

const PLATFORM_ICON_OPTIONS = [
  { id: "instagram", name: "Instagram" },
  { id: "facebook", name: "Facebook" },
  { id: "twitter", name: "Twitter" },
  { id: "x", name: "X" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "youtube", name: "YouTube" },
  { id: "bluesky", name: "Bluesky" },
  { id: "globe", name: "Website / Generic" },
];

const renderPlatformIcon = (platform, className = "") => {
  const rawCandidates = [
    typeof platform === "string" ? platform : platform?.icon,
    typeof platform === "string" ? platform : platform?.name,
  ]
    .filter(Boolean)
    .map((value) => value.toString().toLowerCase());

  if (
    rawCandidates.includes("instagram") ||
    rawCandidates.includes("fainstagram")
  ) {
    return <FaInstagram className={className || "text-pink-500"} />;
  }

  if (
    rawCandidates.includes("linkedin") ||
    rawCandidates.includes("falinkedin")
  ) {
    return <FaLinkedin className={className || "text-blue-600"} />;
  }

  if (rawCandidates.includes("twitter") || rawCandidates.includes("fatwitter")) {
    return <FaTwitter className={className || "text-blue-400"} />;
  }

  if (rawCandidates.includes("facebook") || rawCandidates.includes("fafacebook")) {
    return <FaFacebook className={className || "text-blue-600"} />;
  }

  if (rawCandidates.includes("youtube") || rawCandidates.includes("fayoutube")) {
    return <FaYoutube className={className || "text-red-600"} />;
  }

  if (
    rawCandidates.includes("bluesky") ||
    rawCandidates.includes("faglobeamericas")
  ) {
    return <FaGlobeAmericas className={className || "text-sky-500"} />;
  }

  if (
    rawCandidates.includes("globe") ||
    rawCandidates.includes("website") ||
    rawCandidates.includes("faglobe")
  ) {
    return <FaGlobe className={className || "text-gray-500"} />;
  }

  return <FaGlobe className={className || "text-gray-500"} />;
};

const SocialMediaPage = () => {
  const [activePlatform, setActivePlatform] = useState("");
  const [localPlatforms, setLocalPlatforms] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedHandle, setCopiedHandle] = useState(null);
  const [showAssociations, setShowAssociations] = useState(false);
  const [associationModalAccount, setAssociationModalAccount] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [autofillImageFile, setAutofillImageFile] = useState(null);
  const [autofillImagePreview, setAutofillImagePreview] = useState(null);
  const autofillImageInputRef = useRef(null);
  const [selectedCatalogPlatform, setSelectedCatalogPlatform] = useState(null);
  const [newPlatformName, setNewPlatformName] = useState("");
  const [newPlatformIcon, setNewPlatformIcon] = useState(
    PLATFORM_ICON_OPTIONS.find((option) => option.id === "globe")
  );
  const [newPlatformUrlPattern, setNewPlatformUrlPattern] = useState("");
  const {
    isAdmin,
    isSuperuser,
    userId,
    systemUser,
    isAdvocate,
    userTenantRoles,
    selectedTenants,
  } = useContextAuth();

  // Form state and react-hook-form setup
  const { control, setValue, handleSubmit, reset, getValues } = useForm({
    defaultValues: {
      platformId: null,
      accountTypeId: null,
      name: "",
      handle: "",
      url: "",
      description: "",
      visibility: { id: "private", name: "Private" },
      associationType: null,
      associatedId: null,
    },
  });

  // Extract form field controllers at the component top level
  const nameField = useController({
    name: "name",
    control,
    rules: { required: true },
  });
  const handleField = useController({ name: "handle", control });
  const urlField = useController({
    name: "url",
    control,
    rules: { required: true },
  });
  const descriptionField = useController({ name: "description", control });
  const visibilityField = useController({ name: "visibility", control });
  const associationTypeField = useController({
    name: "associationType",
    control,
  });
  const associatedIdField = useController({ name: "associatedId", control });

  // Get platforms and accounts using our custom hooks
  const {
    data: platforms = [],
    isLoading: platformsLoading,
    error: platformsError,
  } = useSocialMediaPlatforms();

  const canManagePlatformTypes = useMemo(
    () =>
      Boolean(
        isSuperuser ||
          isAdmin ||
          userTenantRoles?.some((tenant) => tenant.roles?.includes("admin"))
      ),
    [isAdmin, isSuperuser, userTenantRoles]
  );

  const {
    data: platformCatalog = [],
    isLoading: platformCatalogLoading,
    error: platformCatalogError,
  } = useSocialMediaPlatformCatalog({
    enabled: canManagePlatformTypes,
  });

  const {
    data: socialProfiles = {},
    isLoading: accountsLoading,
    error: accountsError,
  } = useSocialMediaAccounts(true);

  const {
    data: accountTypes = [],
    isLoading: accountTypesLoading,
    error: accountTypesError,
  } = useSocialMediaAccountTypes();

  // Get data for AI associations
  const { data: organizations = [] } = useOrganizations();
  const { data: collectionsData = [] } = useGetAllCollections();

  // Extract external links from collections
  const collections = collectionsData.filter(
    (col) => col.type !== "external_link"
  );
  const externalLinks = collectionsData.filter(
    (col) => col.type === "external_link"
  );

  // Set up mutation hooks
  const createPlatform = useCreateSocialMediaPlatform();
  const createAccount = useCreateSocialMediaAccount();
  const updateAccount = useUpdateSocialMediaAccount();
  const deleteAccount = useDeleteSocialMediaAccount();
  const createAssociation = useCreateSocialMediaAssociation();
  const processAutofillImage = useProcessImage();
  const previewAutofillAccount = usePreviewSocialMediaAccounts();

  const selectedTenantIdsKey = useMemo(
    () =>
      (selectedTenants || [])
        .map((tenant) => tenant.id)
        .sort()
        .join(","),
    [selectedTenants]
  );

  React.useEffect(() => {
    setLocalPlatforms([]);
  }, [selectedTenantIdsKey]);

  const effectivePlatforms = useMemo(() => {
    const platformMap = new Map();

    [...platforms, ...localPlatforms].forEach((platform) => {
      if (!platform?.name) {
        return;
      }

      const key = platform.name.toLowerCase();
      const existing = platformMap.get(key);

      if (!existing || (!existing.id && platform.id)) {
        platformMap.set(key, platform);
      }
    });

    return Array.from(platformMap.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [localPlatforms, platforms]);

  const platformNameSet = useMemo(
    () =>
      new Set(
        effectivePlatforms
          .filter((platform) => platform?.name)
          .map((platform) => platform.name.toLowerCase())
      ),
    [effectivePlatforms]
  );

  const reusablePlatformOptions = useMemo(
    () =>
      platformCatalog.filter(
        (platform) => !platformNameSet.has(platform.name.toLowerCase())
      ),
    [platformCatalog, platformNameSet]
  );

  const platformLookup = useMemo(() => {
    const map = new Map();
    effectivePlatforms.forEach((platform) => {
      const key = platform.name.toLowerCase();
      if (!map.has(key)) {
        map.set(key, platform);
      }
    });
    return map;
  }, [effectivePlatforms]);

  const availablePlatformNames = useMemo(() => {
    const names = new Set([
      ...effectivePlatforms.map((platform) => platform.name.toLowerCase()),
      ...Object.keys(socialProfiles),
    ]);

    return Array.from(names).sort((a, b) => {
      const aIndex = PLATFORM_ORDER.indexOf(a);
      const bIndex = PLATFORM_ORDER.indexOf(b);

      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [effectivePlatforms, socialProfiles]);

  const registerPlatformForCurrentTenant = (platform) => {
    if (!platform?.name) {
      return;
    }

    setLocalPlatforms((existing) => {
      const key = platform.name.toLowerCase();
      const remaining = existing.filter(
        (item) => item?.name?.toLowerCase() !== key
      );

      return [...remaining, platform].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );
    });

    setActivePlatform(platform.name.toLowerCase());
  };

  const isAutofillingAccountDraft =
    processAutofillImage.isPending || previewAutofillAccount.isPending;

  const readFileAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result;
        if (typeof result !== "string") {
          reject(new Error("Unable to read image"));
          return;
        }

        const [, base64 = ""] = result.split(",");
        resolve(base64);
      };
      reader.onerror = () => reject(new Error("Unable to read image"));
      reader.readAsDataURL(file);
    });

  const applyParsedAutofill = (parsed) => {
    if (!parsed) {
      return 0;
    }

    let appliedChanges = 0;
    const currentValues = getValues();
    const matchingPlatform = findPlatformOptionFromParsedUrl(
      effectivePlatforms,
      parsed
    );

    if (parsed.normalizedUrl && currentValues.url !== parsed.normalizedUrl) {
      setValue("url", parsed.normalizedUrl, { shouldDirty: true });
      appliedChanges += 1;
    }

    if (
      matchingPlatform &&
      (!currentValues.platformId ||
        currentValues.platformId.id !== matchingPlatform.id)
    ) {
      setValue("platformId", matchingPlatform, { shouldDirty: true });
      appliedChanges += 1;
    }

    if (parsed.handle && !currentValues.handle?.trim()) {
      setValue("handle", parsed.handle, { shouldDirty: true });
      appliedChanges += 1;
    }

    if (parsed.suggestedName && !currentValues.name?.trim()) {
      setValue("name", parsed.suggestedName, { shouldDirty: true });
      appliedChanges += 1;
    }

    return appliedChanges;
  };

  // Set active platform when data loads
  React.useEffect(() => {
    if (availablePlatformNames.length === 0) {
      setActivePlatform("");
      return;
    }

    if (availablePlatformNames.includes(activePlatform)) {
      return;
    }

    const firstPlatform =
      PLATFORM_ORDER.find((platform) =>
        availablePlatformNames.includes(platform)
      ) || availablePlatformNames[0];

    setActivePlatform(firstPlatform);
  }, [activePlatform, availablePlatformNames]);

  // Reset form data
  const resetForm = () => {
    const firstPlatform =
      effectivePlatforms.find(
        (platform) => platform.name?.toLowerCase() === activePlatform
      ) ||
      effectivePlatforms[0] ||
      null;
    // Get first account type
    const firstAccountType = accountTypes.length > 0 ? accountTypes[0] : null;

    reset({
      platformId: firstPlatform,
      accountTypeId: firstAccountType,
      name: "",
      handle: "",
      url: "",
      description: "",
      visibility: { id: "private", name: "Private" },
      associationType: null,
      associatedId: null,
    });
    setEditingAccount(null);
    setShowAssociations(false);
    setAutofillImageFile(null);
    setAutofillImagePreview(null);
  };

  const handleAutofillImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    setAutofillImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAutofillImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearAutofillImage = () => {
    setAutofillImageFile(null);
    setAutofillImagePreview(null);
    if (autofillImageInputRef.current) {
      autofillImageInputRef.current.value = "";
    }
  };

  const handleLinkAutofill = () => {
    const rawUrl = getValues("url");
    const parsed = parseSocialMediaProfileAutofill(rawUrl);

    if (!parsed) {
      toast.error("Paste a valid profile URL first");
      return;
    }

    const appliedChanges = applyParsedAutofill(parsed);

    if (appliedChanges === 0) {
      toast("Link details are already filled in");
      return;
    }

    toast.success("Filled available details from the link");
  };

  const handleAIAutofill = async () => {
    const rawUrl = getValues("url");
    const parsed = parseSocialMediaProfileAutofill(rawUrl);

    if (!parsed) {
      toast.error("Paste a valid profile URL first");
      return;
    }

    applyParsedAutofill(parsed);

    let extractedImageText = "";

    try {
      if (autofillImageFile) {
        const base64 = await readFileAsBase64(autofillImageFile);
        const imageResult = await processAutofillImage.mutateAsync({
          imageData: base64,
          mimeType: autofillImageFile.type || "image/jpeg",
          prompt:
            "Extract the visible profile name, bio, credentials, organization, and any identifying text from this social media profile header screenshot.",
        });

        const imageContent = imageResult?.content || imageResult;
        extractedImageText =
          imageContent?.extractedText ||
          imageContent?.data ||
          imageContent?.answer ||
          imageContent?.response ||
          imageContent?.message ||
          "";
      }

      const previewResult = await previewAutofillAccount.mutateAsync({
        prompt: [
          "Create exactly one social media account draft for the profile link below.",
          `Profile link: ${parsed.normalizedUrl || rawUrl}`,
          parsed.platformKey
            ? `Detected platform: ${parsed.platformKey}`
            : null,
          parsed.handle ? `Detected handle: ${parsed.handle}` : null,
          parsed.suggestedName
            ? `Suggested display name from the URL: ${parsed.suggestedName}`
            : null,
          extractedImageText
            ? `Header screenshot text:\n${extractedImageText}`
            : "No header screenshot text was provided.",
          "Return only the account that matches this link.",
          "Prefer the pasted link as the canonical URL.",
        ]
          .filter(Boolean)
          .join("\n\n"),
        metadata: {
          platforms: effectivePlatforms.map((platform) => ({
            id: platform.id,
            name: platform.name,
          })),
        },
      });

      const aiAccount = previewResult?.accounts?.[0];

      if (!aiAccount) {
        toast.error("AI could not build an account draft from that input");
        return;
      }

      const currentValues = getValues();
      const matchingPlatform =
        effectivePlatforms.find(
          (platform) => platform.id === aiAccount.platformId
        ) ||
        effectivePlatforms.find(
          (platform) =>
            platform.name?.toLowerCase() === aiAccount.platformName?.toLowerCase()
        ) ||
        findPlatformOptionFromParsedUrl(effectivePlatforms, parsed);

      const matchingAccountType =
        accountTypes.find((type) => type.id === aiAccount.accountTypeId) ||
        accountTypes.find(
          (type) =>
            type.name?.toLowerCase() === aiAccount.accountType?.toLowerCase()
        );

      if (
        matchingPlatform &&
        (!currentValues.platformId ||
          currentValues.platformId.id !== matchingPlatform.id)
      ) {
        setValue("platformId", matchingPlatform, { shouldDirty: true });
      }

      if (matchingAccountType) {
        setValue("accountTypeId", matchingAccountType, { shouldDirty: true });
      }

      if (aiAccount.name?.trim()) {
        setValue("name", aiAccount.name.trim(), { shouldDirty: true });
      }

      if (aiAccount.handle?.trim()) {
        setValue("handle", aiAccount.handle.trim().replace(/^@/, ""), {
          shouldDirty: true,
        });
      }

      setValue("url", aiAccount.url || parsed.normalizedUrl || rawUrl, {
        shouldDirty: true,
      });

      if (aiAccount.description?.trim()) {
        setValue("description", aiAccount.description.trim(), {
          shouldDirty: true,
        });
      }

      toast.success(
        autofillImageFile
          ? "Filled the draft from the link and header image"
          : "Filled the draft from the link"
      );
    } catch (error) {
      console.error("Error autofilling social media account:", error);
      toast.error(error.message || "Failed to autofill the account draft");
    }
  };

  // Delete social media account
  const deleteSocialMediaAccount = async (id) => {
    if (!confirm("Are you sure you want to delete this account?")) return;
    deleteAccount.mutate(id);
  };

  // Add new social media account
  const addSocialMediaAccount = async (data) => {
    // Transform SelectField formatted data to API format
    const apiData = {
      platformId: data.platformId?.id || "",
      name: data.name,
      handle: data.handle,
      url: data.url,
      description: data.description,
      accountTypeId: data.accountTypeId?.id || "",
      visibility: data.visibility?.id || "private",
    };

    createAccount.mutate(apiData, {
      onSuccess: (newAccount) => {
        // If association data is provided, create the association
        if (data.associationType && data.associatedId) {
          createAssociation.mutate({
            socialMediaAccountId: newAccount.id,
            associatedId: data.associatedId.id,
            associatedType: data.associationType.id,
          });
        }
        resetForm();
        setShowAddForm(false);
      },
    });
  };

  // Update social media account
  const updateSocialMediaAccount = (data) => {
    if (!editingAccount) return;

    // Transform SelectField formatted data to API format
    const apiData = {
      platformId: data.platformId?.id || "",
      name: data.name,
      handle: data.handle,
      url: data.url,
      description: data.description,
      accountTypeId: data.accountTypeId?.id || "",
      visibility: data.visibility?.id || "private",
    };

    updateAccount.mutate(
      {
        id: editingAccount,
        accountData: apiData,
      },
      {
        onSuccess: () => {
          // If association data is provided, create the association
          if (data.associationType && data.associatedId) {
            createAssociation.mutate({
              socialMediaAccountId: editingAccount,
              associatedId: data.associatedId.id,
              associatedType: data.associationType.id,
            });
          }
          resetForm();
          setShowAddForm(false);
        },
      }
    );
  };

  // Set up form for editing an account
  const setupEditForm = (account, type) => {
    // Find the platform ID based on the active platform name
    const platformObj = effectivePlatforms.find(
      (p) => p.name.toLowerCase() === activePlatform
    );

    // Find the account type object
    const accountTypeObj = account.accountTypeId
      ? accountTypes.find((t) => t.id === account.accountTypeId)
      : accountTypes.find((t) => t.name === account.accountTypeName);

    // Set values for the react-hook-form
    setValue("platformId", platformObj);
    setValue("accountTypeId", accountTypeObj);
    setValue("name", account.name);
    setValue("handle", account.handle || "");
    setValue("url", account.url);
    setValue("description", account.description || "");
    setValue(
      "visibility",
      getVisibilityOption(account.visibility || "private")
    );

    setEditingAccount(account.id);
    setShowAddForm(true);
  };

  // Helper to get visibility option
  const getVisibilityOption = (visibility) => {
    const options = [
      { id: "private", name: "Private" },
      { id: "public", name: "Public" },
    ];
    return options.find((opt) => opt.id === visibility) || options[0];
  };

  // Get visibility options based on user role
  const getVisibilityOptions = () => {
    const options = [{ id: "private", name: "Private" }];

    // Admins and advocates can add public accounts
    if (isAdmin || (isAdvocate && isAdvocate.length > 0)) {
      options.push({ id: "public", name: "Public" });
    }

    return options;
  };

  // Get current platform data
  const currentPlatformData = socialProfiles[activePlatform] || {};
  const activePlatformRecord = platformLookup.get(activePlatform);
  const activePlatformLabel =
    activePlatformRecord?.name ||
    (activePlatform
      ? activePlatform.charAt(0).toUpperCase() + activePlatform.slice(1)
      : "Platform");

  // Filter accounts based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return currentPlatformData;

    const searchLower = searchTerm.toLowerCase();
    const result = {};

    // Filter foundations
    if (currentPlatformData.foundations) {
      result.foundations = currentPlatformData.foundations.filter(
        (account) =>
          account.name.toLowerCase().includes(searchLower) ||
          (account.handle &&
            account.handle.toLowerCase().includes(searchLower)) ||
          (account.description &&
            account.description.toLowerCase().includes(searchLower))
      );
    }

    // Filter KOLs if they exist
    if (currentPlatformData.kols) {
      result.kols = { medical: [], advocates: [] };

      // Filter medical professionals
      if (currentPlatformData.kols.medical) {
        result.kols.medical = currentPlatformData.kols.medical.filter(
          (account) =>
            account.name.toLowerCase().includes(searchLower) ||
            (account.handle &&
              account.handle.toLowerCase().includes(searchLower)) ||
            (account.description &&
              account.description.toLowerCase().includes(searchLower)) ||
            (account.title && account.title.toLowerCase().includes(searchLower))
        );
      }

      // Filter patient advocates
      if (currentPlatformData.kols.advocates) {
        result.kols.advocates = currentPlatformData.kols.advocates.filter(
          (account) =>
            account.name.toLowerCase().includes(searchLower) ||
            (account.handle &&
              account.handle.toLowerCase().includes(searchLower)) ||
            (account.description &&
              account.description.toLowerCase().includes(searchLower)) ||
            (account.title && account.title.toLowerCase().includes(searchLower))
        );
      }
    }

    return result;
  }, [currentPlatformData, searchTerm]);

  // Loading state
  const isLoading =
    platformsLoading ||
    accountsLoading ||
    accountTypesLoading ||
    createPlatform.isPending ||
    createAccount.isPending ||
    updateAccount.isPending ||
    deleteAccount.isPending ||
    createAssociation.isPending;

  // Error state
  const error = platformsError || accountsError;

  // Set up form for opening add form
  const openAddForm = () => {
    const firstPlatform =
      effectivePlatforms.find(
        (platform) => platform.name?.toLowerCase() === activePlatform
      ) ||
      effectivePlatforms[0] ||
      null;
    // Get first account type
    const firstAccountType = accountTypes.length > 0 ? accountTypes[0] : null;

    // Initialize the form with the first platform
    reset({
      platformId: firstPlatform,
      accountTypeId: firstAccountType,
      name: "",
      handle: "",
      url: "",
      description: "",
      visibility: { id: "private", name: "Private" },
      associationType: null,
      associatedId: null,
    });

    setEditingAccount(null);
    setShowAddForm(true);
    setShowAssociations(false);
    clearAutofillImage();
  };

  const resetPlatformForm = () => {
    setSelectedCatalogPlatform(null);
    setNewPlatformName("");
    setNewPlatformIcon(
      PLATFORM_ICON_OPTIONS.find((option) => option.id === "globe")
    );
    setNewPlatformUrlPattern("");
  };

  const handleClosePlatformModal = () => {
    resetPlatformForm();
    setShowPlatformModal(false);
  };

  const handleCreatePlatform = (event) => {
    event.preventDefault();

    if (selectedCatalogPlatform) {
      createPlatform.mutate(
        { existingPlatformId: selectedCatalogPlatform.id },
        {
          onSuccess: (platform) => {
            registerPlatformForCurrentTenant(platform);
            handleClosePlatformModal();
          },
        }
      );
      return;
    }

    if (!newPlatformName.trim()) {
      toast.error("Choose an existing platform or enter a new platform name");
      return;
    }

    if (!newPlatformIcon?.id) {
      toast.error("Select an icon for the new platform");
      return;
    }

    createPlatform.mutate(
      {
        name: newPlatformName.trim(),
        icon: newPlatformIcon.id,
        urlPattern: newPlatformUrlPattern.trim() || undefined,
      },
      {
        onSuccess: (platform) => {
          registerPlatformForCurrentTenant(platform);
          handleClosePlatformModal();
        },
      }
    );
  };

  // Helper function to check if current user can edit/delete an account
  const canEditAccount = (account) => {
    // Admins can edit any account
    if (isAdmin) return true;

    // Check if user created this account
    const isCreator =
      account.userId === systemUser?.id ||
      account.userId === userId ||
      account.createdBy === systemUser?.id ||
      account.createdBy === userId;

    // Users can always edit accounts they created
    if (isCreator) return true;

    // Advocates can edit public accounts
    if (isAdvocate && isAdvocate.length > 0 && account.visibility === 'public') {
      return true;
    }

    return false;
  };

  // Helper function to copy handle to clipboard
  const copyHandle = async (handle) => {
    try {
      await navigator.clipboard.writeText(handle);
      setCopiedHandle(handle);
      setTimeout(() => setCopiedHandle(null), 2000); // Clear after 2 seconds
      toast.success(`Handle @${handle} copied to clipboard!`);
    } catch (err) {
      toast.error("Failed to copy handle");
    }
  };

  // Show loading spinner when loading
  if (
    (platformsLoading || accountsLoading) &&
    Object.keys(socialProfiles).length === 0
  ) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center mb-6">
          <FaRss className="mr-3 text-blue-500" />
          Social Media / Website Directory
        </h1>
        <LoadingSpinner />
      </div>
    );
  }

  // Show error message if there's an error
  if (error && Object.keys(socialProfiles).length === 0) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center mb-6">
          <FaRss className="mr-3 text-blue-500" />
          Social Media / Website Directory
        </h1>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error.message || "Error loading social media data"}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-6 mt-16">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between flex-col gap-2 md:flex-row">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              <FaRss className="mr-3 text-blue-500" />
              Social Media / Website Directory
            </h1>
            <div className="flex gap-2">
              {canManagePlatformTypes && (
                <button
                  onClick={() => setShowPlatformModal(true)}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg border-2 border-blue-500 shadow-sm flex items-center gap-2 transition-all duration-200 ease-in-out hover:bg-blue-50 hover:border-blue-600"
                  disabled={isLoading}
                >
                  <FaPlus className="h-4 w-4" />
                  <span>Add Platform Type</span>
                </button>
              )}
              <button
                onClick={openAddForm}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-md shadow-lg flex items-center gap-2 transition-all duration-200 ease-in-out hover:from-blue-700 hover:to-blue-800"
                disabled={isLoading || effectivePlatforms.length === 0}
              >
                <span>Add Account</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                onClick={() => setShowCSVModal(true)}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg border-2 border-blue-500 shadow-sm flex items-center gap-2 transition-all duration-200 ease-in-out hover:bg-blue-50 hover:border-blue-600"
                disabled={isLoading || effectivePlatforms.length === 0}
              >
                <FaFileImport className="h-4 w-4" />
                <span>CSV Import</span>
              </button>
              <button
                onClick={() => setShowAIModal(true)}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg border-2 border-blue-500 shadow-sm flex items-center gap-2 transition-all duration-200 ease-in-out hover:bg-blue-50 hover:border-blue-600"
                disabled={isLoading || effectivePlatforms.length === 0}
              >
                <FaMagic className="h-4 w-4" />
                <span>AI Import</span>
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="text-gray-600 max-w-3xl">
            Locates cancer organizations, healthcare professionals, and patient
            advocates on social media to follow. Not an endorsement of any
            organization, individual or their posts.
          </p>

          {/* Error message */}
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
              <p>{error.message || "Error loading social media data"}</p>
            </div>
          )}

          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="bg-gray-50 p-6 rounded-xl mb-6 border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                {editingAccount ? "Edit Account" : "Add New Account"}
              </h2>
              <form
                onSubmit={handleSubmit(
                  editingAccount
                    ? updateSocialMediaAccount
                    : addSocialMediaAccount
                )}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <SelectField
                      name="platformId"
                      control={control}
                      label="Platform"
                      options={effectivePlatforms}
                      disabled={isLoading}
                      placeholder="Select a platform"
                    />
                  </div>

                  <div>
                    <SelectField
                      name="accountTypeId"
                      control={control}
                      label="Account Type"
                      options={accountTypes}
                      disabled={isLoading}
                      placeholder="Select account type"
                    />
                  </div>

                  <div>
                    <SelectField
                      name="visibility"
                      control={control}
                      label="Visibility"
                      options={getVisibilityOptions()}
                      disabled={isLoading}
                      placeholder="Select visibility"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      {...nameField.field}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Handle (optional)
                    </label>
                    <input
                      type="text"
                      {...handleField.field}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      URL
                    </label>
                    <input
                      type="url"
                      {...urlField.field}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="md:col-span-3 rounded-lg border border-blue-100 bg-blue-50 p-4">
                    <div className="flex flex-col gap-3">
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Quick Autofill
                        </p>
                        <p className="text-xs text-blue-800">
                          Paste the profile link to infer the platform, handle,
                          and a suggested name. Add a header screenshot to let
                          AI fill the name and description more accurately.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleLinkAutofill}
                          disabled={isLoading || isAutofillingAccountDraft}
                          className="inline-flex items-center gap-2 rounded-md border border-blue-300 bg-white px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FaLink className="h-4 w-4" />
                          Autofill from Link
                        </button>

                        <button
                          type="button"
                          onClick={() => autofillImageInputRef.current?.click()}
                          disabled={isLoading || isAutofillingAccountDraft}
                          className="inline-flex items-center gap-2 rounded-md border border-blue-300 bg-white px-3 py-2 text-sm text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <FaUpload className="h-4 w-4" />
                          {autofillImageFile
                            ? "Change Header Image"
                            : "Add Header Image"}
                        </button>

                        <button
                          type="button"
                          onClick={handleAIAutofill}
                          disabled={isLoading || isAutofillingAccountDraft}
                          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                        >
                          {isAutofillingAccountDraft ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                          ) : (
                            <FaMagic className="h-4 w-4" />
                          )}
                          {autofillImageFile
                            ? "Autofill with AI + Image"
                            : "Autofill with AI"}
                        </button>

                        <input
                          ref={autofillImageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAutofillImageSelect}
                        />
                      </div>

                      {autofillImageFile && (
                        <div className="flex flex-col gap-3 rounded-md border border-blue-200 bg-white p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <FaImage className="h-4 w-4 text-blue-600" />
                              <span className="truncate">
                                {autofillImageFile.name}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={clearAutofillImage}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                          {autofillImagePreview && (
                            <img
                              src={autofillImagePreview}
                              alt="Header screenshot preview"
                              className="max-h-32 w-auto rounded-md border border-gray-200 object-contain"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      {...descriptionField.field}
                      rows="3"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      disabled={isLoading}
                    ></textarea>
                  </div>
                </div>

                {/* Associations Section - Collapsible */}
                <div className="mt-4 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAssociations(!showAssociations)}
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                  >
                    <svg
                      className={`w-4 h-4 mr-2 transition-transform ${
                        showAssociations ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    Associate with Collection or Organization (Optional)
                  </button>

                  {showAssociations && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <SelectField
                          name="associationType"
                          control={control}
                          label="Association Type"
                          options={[
                            { id: "organization", name: "Organization" },
                            { id: "collection", name: "Collection" },
                            { id: "external_link", name: "External Link" },
                          ]}
                          disabled={isLoading}
                          placeholder="Select type"
                          onChange={(value) => {
                            // Reset associated ID when type changes
                            setValue("associatedId", null);
                          }}
                        />
                      </div>

                      {associationTypeField.field.value && (
                        <div>
                          <SearchableEntitySelect
                            name="associatedId"
                            control={control}
                            label={`Select ${associationTypeField.field.value.name}`}
                            entityTypes={[associationTypeField.field.value.id]}
                            disabled={isLoading}
                            placeholder={`Type to search ${associationTypeField.field.value.name.toLowerCase()}...`}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowAddForm(false);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
                    disabled={isLoading}
                  >
                    {isLoading
                      ? "Saving..."
                      : editingAccount
                      ? "Update"
                      : "Save"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Platform Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto pb-1 hide-scrollbar">
              {availablePlatformNames.map((platform) => (
                  <button
                    key={platform}
                    onClick={() => setActivePlatform(platform)}
                    className={`px-4 py-2 mr-2 whitespace-nowrap font-medium text-sm rounded-t-lg border-b-2 flex items-center ${
                      activePlatform === platform
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                    disabled={isLoading}
                  >
                    <span className="mr-2">
                      {renderPlatformIcon(platformLookup.get(platform) || platform)}
                    </span>
                    {platformLookup.get(platform)?.name ||
                      (platform.charAt(0).toUpperCase() + platform.slice(1))}
                  </button>
                ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex items-center max-w-md bg-white rounded-lg px-2 py-1 border border-gray-300">
            <FaSearch className="text-gray-400" />
            <input
              type="text"
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2 focus:outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Content for Selected Platform */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              {renderPlatformIcon(activePlatformRecord || activePlatform)}
              <span className="ml-2">{activePlatformLabel} Accounts</span>
            </h2>

            <SocialMediaAccountsList
              socialProfiles={socialProfiles}
              activePlatform={activePlatform}
              searchTerm={searchTerm}
              isAdmin={isAdmin}
              systemUser={systemUser}
              onEdit={(account, accountType) =>
                setupEditForm(account, accountType)
              }
              onDelete={deleteSocialMediaAccount}
              onAssociations={setAssociationModalAccount}
              isLoading={isLoading}
              canEdit={canEditAccount}
              organizations={organizations}
              collections={collections}
              externalLinks={externalLinks}
            />
          </div>
        </div>
      </div>

      <Modal
        isOpen={showPlatformModal}
        onClose={handleClosePlatformModal}
        customClass="max-w-2xl"
      >
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Add Platform Type
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Reuse a platform type that already exists elsewhere, or create a new
            shared platform type for future tenants.
          </p>

          <form onSubmit={handleCreatePlatform} className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Reuse Existing Platform
              </h3>
              <SearchableDropdown
                label="Existing platform types"
                value={selectedCatalogPlatform}
                onChange={(platform) => {
                  setSelectedCatalogPlatform(platform);
                  if (platform) {
                    setNewPlatformName("");
                    setNewPlatformUrlPattern("");
                  }
                }}
                options={reusablePlatformOptions}
                placeholder="Search platform types used in other tenants..."
                disabled={platformCatalogLoading || createPlatform.isPending}
                sortBy="name"
              />
              {platformCatalogError && (
                <p className="mt-2 text-sm text-red-600">
                  {platformCatalogError.message ||
                    "Failed to load reusable platform types"}
                </p>
              )}
              {!platformCatalogLoading &&
                !platformCatalogError &&
                reusablePlatformOptions.length === 0 && (
                  <p className="mt-2 text-sm text-gray-500">
                    No additional platform types are available from other
                    tenants right now.
                  </p>
                )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Or Create New Shared Platform
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Platform name
                  </label>
                  <input
                    type="text"
                    value={newPlatformName}
                    onChange={(event) => {
                      setNewPlatformName(event.target.value);
                      if (event.target.value.trim()) {
                        setSelectedCatalogPlatform(null);
                      }
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    placeholder="e.g. Threads"
                    disabled={createPlatform.isPending}
                  />
                </div>

                <div>
                  <SelectField
                    label="Icon"
                    options={PLATFORM_ICON_OPTIONS}
                    value={newPlatformIcon}
                    onChange={setNewPlatformIcon}
                    placeholder="Select icon"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    URL pattern
                  </label>
                  <input
                    type="text"
                    value={newPlatformUrlPattern}
                    onChange={(event) => {
                      setNewPlatformUrlPattern(event.target.value);
                      if (event.target.value.trim()) {
                        setSelectedCatalogPlatform(null);
                      }
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500"
                    placeholder="https://example.com/{handle}"
                    disabled={createPlatform.isPending}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClosePlatformModal}
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
                disabled={createPlatform.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-300"
                disabled={createPlatform.isPending}
              >
                {createPlatform.isPending ? "Saving..." : "Add Platform"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Association Modal */}
      {associationModalAccount && (
        <AssociationModalWrapper
          account={associationModalAccount}
          isOpen={!!associationModalAccount}
          onClose={() => setAssociationModalAccount(null)}
        />
      )}

      {/* CSV Import Modal */}
      <Modal
        isOpen={showCSVModal}
        onClose={() => setShowCSVModal(false)}
        customClass="max-w-4xl"
      >
        <SocialMediaCSVImport
          onClose={() => setShowCSVModal(false)}
          onAccountsCreated={(accounts) => {
            setShowCSVModal(false);
            toast.success(
              `Successfully imported ${accounts.length} social media account(s)`
            );
          }}
          platforms={effectivePlatforms}
          accountTypes={accountTypes}
          organizations={organizations}
          collections={collections}
          externalLinks={externalLinks}
        />
      </Modal>

      {/* AI Import Modal */}
      <Modal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        customClass="max-w-6xl"
      >
        <SocialMediaAICreate
          onClose={() => setShowAIModal(false)}
          onAccountsCreated={(accounts) => {
            setShowAIModal(false);
            toast.success(
              `Successfully created ${accounts.length} social media account(s)`
            );
          }}
          platforms={effectivePlatforms}
          organizations={organizations}
          collections={collections}
          externalLinks={externalLinks}
          accountTypes={accountTypes}
        />
      </Modal>

      {/* Custom scroll hiding styles */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
};

// Wrapper component to handle fetching associations for the selected account
const AssociationModalWrapper = ({ account, isOpen, onClose }) => {
  const { data: associations = [] } = useSocialMediaAccountAssociations(
    account?.id,
    { enabled: !!account?.id }
  );

  return (
    <SocialMediaAssociationModal
      isOpen={isOpen}
      onClose={onClose}
      account={account}
      currentAssociations={associations}
    />
  );
};

export default SocialMediaPage;
