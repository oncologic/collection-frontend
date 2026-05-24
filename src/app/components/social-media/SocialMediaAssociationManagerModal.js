"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaExternalLinkAlt,
  FaFilter,
  FaGlobe,
  FaHashtag,
  FaLink,
  FaPlus,
  FaSearch,
  FaTimes,
  FaUnlink,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useContextAuth } from "@/app/context/authContext";
import {
  useAssociatedSocialMediaAccounts,
  useCreateSocialMediaAccount,
  useCreateSocialMediaAssociation,
  useCreateSocialMediaPlatform,
  useDeleteSocialMediaAssociation,
  useSocialMediaAccounts,
  useSocialMediaAccountTypes,
  useSocialMediaPlatforms,
} from "@/app/hooks/useSocialMedia";

const CREATE_NEW_PLATFORM_VALUE = "__create_new_platform__";

const blankAccount = {
  platformId: "",
  accountTypeId: "",
  name: "",
  handle: "",
  url: "",
  description: "",
  visibility: "private",
};

const normalizePlatformName = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const normalizeSearch = (value) => normalizePlatformName(value);

const inferPlatformIcon = (name) => {
  const normalizedName = normalizePlatformName(name);
  const knownIcons = [
    "instagram",
    "facebook",
    "twitter",
    "x",
    "linkedin",
    "youtube",
    "bluesky",
  ];

  return knownIcons.find((icon) => normalizedName === icon) || "globe";
};

const getDefaultPlatformId = (platforms) =>
  platforms[0]?.id || CREATE_NEW_PLATFORM_VALUE;

const isCreatingInlinePlatform = (account) =>
  account.platformId === CREATE_NEW_PLATFORM_VALUE;

const findPlatformByName = (platforms, name) => {
  const normalizedName = normalizePlatformName(name);

  if (!normalizedName) {
    return null;
  }

  return (
    platforms.find(
      (platform) => normalizePlatformName(platform.name) === normalizedName,
    ) || null
  );
};

const getAccountPlatform = (account, platforms) =>
  account.platform ||
  platforms.find((platform) => platform.id === account.platformId) ||
  (account.platformName
    ? {
        id: account.platformId,
        name: account.platformName,
        icon: account.platformIcon,
      }
    : null);

const getAccountTypeName = (account, accountTypes) =>
  account.accountTypeName ||
  account.accountType?.name ||
  accountTypes.find((type) => type.id === account.accountTypeId)?.name ||
  "";

const isEmailLike = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");

const normalizeAccountUrl = ({ url, handle, platform }) => {
  const trimmedUrl = url.trim();
  const trimmedHandle = handle.trim();
  const platformName = normalizeSearch(platform?.name);

  if (trimmedUrl) {
    return isEmailLike(trimmedUrl) ? `mailto:${trimmedUrl}` : trimmedUrl;
  }

  if (platformName.includes("email") && isEmailLike(trimmedHandle)) {
    return `mailto:${trimmedHandle}`;
  }

  return "";
};

export default function SocialMediaAssociationManagerModal({
  isOpen,
  onClose,
  entityId,
  entityType,
  entityName = "",
  title = "Social Media Accounts",
  hashtags = [],
}) {
  const router = useRouter();
  const { isAdmin } = useContextAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAccount, setNewAccount] = useState(blankAccount);
  const [newPlatformName, setNewPlatformName] = useState("");

  const { data: linkedAssociations = [], isLoading: linkedLoading } =
    useAssociatedSocialMediaAccounts(entityId, entityType, {
      enabled: isOpen && Boolean(entityId),
    });
  const { data: accountData = [], isLoading: accountsLoading } =
    useSocialMediaAccounts(false, { enabled: isOpen });
  const { data: platforms = [], isLoading: platformsLoading } =
    useSocialMediaPlatforms({ enabled: isOpen });
  const { data: accountTypes = [], isLoading: accountTypesLoading } =
    useSocialMediaAccountTypes({ enabled: isOpen });

  const createPlatform = useCreateSocialMediaPlatform();
  const createAccount = useCreateSocialMediaAccount();
  const createAssociation = useCreateSocialMediaAssociation();
  const deleteAssociation = useDeleteSocialMediaAssociation();

  const inlinePlatformMatch = useMemo(
    () => findPlatformByName(platforms, newPlatformName),
    [newPlatformName, platforms],
  );

  const trimmedNewPlatformName = newPlatformName.trim();
  const hasInlinePlatform = isCreatingInlinePlatform(newAccount)
    ? Boolean(trimmedNewPlatformName || inlinePlatformMatch)
    : Boolean(newAccount.platformId);

  const linkedAccountIds = useMemo(
    () =>
      new Set(
        linkedAssociations
          .map((association) => association.socialMediaAccountId)
          .filter(Boolean),
      ),
    [linkedAssociations],
  );

  const accounts = useMemo(() => {
    const sourceAccounts = Array.isArray(accountData) ? accountData : [];
    return sourceAccounts.map((account) => ({
      ...account,
      platform: getAccountPlatform(account, platforms),
      accountTypeName: getAccountTypeName(account, accountTypes),
    }));
  }, [accountData, accountTypes, platforms]);

  const linkedAccounts = useMemo(
    () =>
      linkedAssociations
        .map((association) => association.account)
        .filter(Boolean)
        .map((account) => ({
          ...account,
          platform: getAccountPlatform(account, platforms),
          accountTypeName: getAccountTypeName(account, accountTypes),
        })),
    [accountTypes, linkedAssociations, platforms],
  );

  const filteredAccounts = useMemo(() => {
    const search = normalizeSearch(searchTerm);

    return accounts.filter((account) => {
      const platform = getAccountPlatform(account, platforms);
      const typeName = getAccountTypeName(account, accountTypes);
      const matchesSearch =
        !search ||
        [
          account.name,
          account.handle,
          account.url,
          account.description,
          platform?.name,
          typeName,
        ]
          .map(normalizeSearch)
          .some((value) => value.includes(search));

      const matchesPlatform =
        !platformFilter ||
        account.platformId === platformFilter ||
        platform?.id === platformFilter;

      return matchesSearch && matchesPlatform;
    });
  }, [accountTypes, accounts, platformFilter, platforms, searchTerm]);

  const hasHashtags = Array.isArray(hashtags) && hashtags.length > 0;
  const isLoading =
    linkedLoading || accountsLoading || platformsLoading || accountTypesLoading;
  const isMutating =
    createPlatform.isPending ||
    createAccount.isPending ||
    createAssociation.isPending ||
    deleteAssociation.isPending;

  useEffect(() => {
    if (!isOpen || platformsLoading || accountTypesLoading) return;

    setNewAccount((current) => ({
      ...current,
      platformId: current.platformId || getDefaultPlatformId(platforms),
      accountTypeId: current.accountTypeId || accountTypes[0]?.id || "",
    }));
  }, [accountTypes, accountTypesLoading, isOpen, platforms, platformsLoading]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resetNewAccount = () => {
    setNewAccount({
      ...blankAccount,
      platformId: getDefaultPlatformId(platforms),
      accountTypeId: accountTypes[0]?.id || "",
    });
    setNewPlatformName("");
  };

  const handleToggleAssociation = async (account) => {
    if (!entityId || !entityType) return;

    const payload = {
      socialMediaAccountId: account.id,
      associatedId: entityId,
      associatedType: entityType,
    };

    if (linkedAccountIds.has(account.id)) {
      await deleteAssociation.mutateAsync(payload);
      return;
    }

    await createAssociation.mutateAsync(payload);
  };

  const resolvePlatformForNewAccount = async () => {
    if (!isCreatingInlinePlatform(newAccount)) {
      const platform = platforms.find(
        (item) => item.id === newAccount.platformId,
      );
      return { platformId: newAccount.platformId, platform };
    }

    if (!trimmedNewPlatformName) {
      toast.error("Platform name is required");
      return null;
    }

    if (inlinePlatformMatch) {
      return {
        platformId: inlinePlatformMatch.id,
        platform: inlinePlatformMatch,
      };
    }

    const createdPlatform = await createPlatform.mutateAsync({
      name: trimmedNewPlatformName,
      icon: inferPlatformIcon(trimmedNewPlatformName),
    });

    return {
      platformId: createdPlatform.id,
      platform: createdPlatform,
    };
  };

  const handleCreateAccount = async () => {
    if (
      !hasInlinePlatform ||
      !newAccount.accountTypeId ||
      !newAccount.name.trim()
    ) {
      toast.error("Platform, account type, and name are required");
      return;
    }

    if (!newAccount.url.trim() && !newAccount.handle.trim()) {
      toast.error("URL or email address is required");
      return;
    }

    const resolvedPlatform = await resolvePlatformForNewAccount();

    if (!resolvedPlatform) {
      return;
    }

    const { platformId, platform } = resolvedPlatform;
    const normalizedUrl = normalizeAccountUrl({
      url: newAccount.url,
      handle: newAccount.handle,
      platform,
    });

    if (!platformId) {
      toast.error("Platform is required");
      return;
    }

    if (!normalizedUrl) {
      toast.error("URL or email address is required");
      return;
    }

    const createdAccount = await createAccount.mutateAsync({
      platformId,
      accountTypeId: newAccount.accountTypeId,
      name: newAccount.name.trim(),
      handle: newAccount.handle.trim(),
      url: normalizedUrl,
      description: newAccount.description.trim(),
      visibility: newAccount.visibility,
    });

    if (createdAccount?.id) {
      await createAssociation.mutateAsync({
        socialMediaAccountId: createdAccount.id,
        associatedId: entityId,
        associatedType: entityType,
      });
      resetNewAccount();
      setShowCreateForm(false);
    }
  };

  const openHashtagSearch = () => {
    if (!hasHashtags) return;

    router.push(
      `/social-media/hashtags?hashtags=${encodeURIComponent(hashtags.join(","))}`,
    );
    onClose();
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-4">
              <div>
                <div className="flex items-center gap-2">
                  <FaGlobe className="text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    {title}
                  </h2>
                </div>
                {entityName && (
                  <p className="mt-1 text-sm text-gray-500">{entityName}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
                aria-label="Close social media accounts"
              >
                <FaTimes />
              </button>
            </div>

            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-6 py-5">
              {hasHashtags && (
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-blue-900">
                    <FaHashtag />
                    <span>{hashtags.length} collection hashtag(s)</span>
                  </div>
                  <button
                    type="button"
                    onClick={openHashtagSearch}
                    className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <FaExternalLinkAlt className="h-3 w-3" />
                    Search Hashtags
                  </button>
                </div>
              )}

              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Linked Accounts ({linkedAccounts.length})
                  </h3>
                  <p className="text-xs text-gray-500">
                    These accounts are connected to this collection.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateForm((current) => !current)}
                  className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  <FaPlus className="h-3 w-3" />
                  {showCreateForm ? "Cancel" : "New Account"}
                </button>
              </div>

              {showCreateForm && (
                <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900">
                    Create and Link Account
                  </h3>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-gray-700">
                        Platform
                      </span>
                      <select
                        value={newAccount.platformId}
                        onChange={(event) => {
                          const platformId = event.target.value;
                          setNewAccount((current) => ({
                            ...current,
                            platformId,
                          }));
                          if (platformId !== CREATE_NEW_PLATFORM_VALUE) {
                            setNewPlatformName("");
                          }
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        disabled={isMutating}
                      >
                        <option value="">Select platform</option>
                        {platforms.map((platform) => (
                          <option key={platform.id} value={platform.id}>
                            {platform.name}
                          </option>
                        ))}
                        <option value={CREATE_NEW_PLATFORM_VALUE}>
                          Add new platform...
                        </option>
                      </select>
                      {isCreatingInlinePlatform(newAccount) && (
                        <div className="mt-2 space-y-2">
                          <input
                            type="text"
                            value={newPlatformName}
                            onChange={(event) =>
                              setNewPlatformName(event.target.value)
                            }
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Platform name, e.g. Instagram"
                            disabled={isMutating}
                          />
                          {inlinePlatformMatch ? (
                            <p className="text-xs text-blue-700">
                              This will use the existing{" "}
                              {inlinePlatformMatch.name} platform.
                            </p>
                          ) : trimmedNewPlatformName ? (
                            <p className="text-xs text-gray-500">
                              This platform will be created before the account
                              is linked.
                            </p>
                          ) : null}
                        </div>
                      )}
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-gray-700">
                        Account Type
                      </span>
                      <select
                        value={newAccount.accountTypeId}
                        onChange={(event) =>
                          setNewAccount((current) => ({
                            ...current,
                            accountTypeId: event.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        disabled={isMutating}
                      >
                        <option value="">Select account type</option>
                        {accountTypes.map((type) => (
                          <option key={type.id} value={type.id}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-gray-700">
                        Name
                      </span>
                      <input
                        type="text"
                        value={newAccount.name}
                        onChange={(event) =>
                          setNewAccount((current) => ({
                            ...current,
                            name: event.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Account name"
                        disabled={isMutating}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-gray-700">
                        Handle or Email
                      </span>
                      <input
                        type="text"
                        value={newAccount.handle}
                        onChange={(event) =>
                          setNewAccount((current) => ({
                            ...current,
                            handle: event.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="@handle or name@example.com"
                        disabled={isMutating}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-gray-700">
                        URL or Email
                      </span>
                      <input
                        type="text"
                        value={newAccount.url}
                        onChange={(event) =>
                          setNewAccount((current) => ({
                            ...current,
                            url: event.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="https://... or name@example.com"
                        disabled={isMutating}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block font-medium text-gray-700">
                        Visibility
                      </span>
                      <select
                        value={newAccount.visibility}
                        onChange={(event) =>
                          setNewAccount((current) => ({
                            ...current,
                            visibility: event.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        disabled={isMutating || !isAdmin}
                      >
                        <option value="private">Private</option>
                        {isAdmin && <option value="public">Public</option>}
                      </select>
                    </label>
                    <label className="block text-sm md:col-span-2">
                      <span className="mb-1 block font-medium text-gray-700">
                        Description
                      </span>
                      <textarea
                        value={newAccount.description}
                        onChange={(event) =>
                          setNewAccount((current) => ({
                            ...current,
                            description: event.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        rows={2}
                        disabled={isMutating}
                      />
                    </label>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetNewAccount();
                        setShowCreateForm(false);
                      }}
                      className="rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
                      disabled={isMutating}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateAccount}
                      className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={
                        isMutating ||
                        !hasInlinePlatform ||
                        !newAccount.accountTypeId ||
                        !newAccount.name.trim()
                      }
                    >
                      {isMutating ? "Saving..." : "Create and Link"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
                <label className="relative block">
                  <FaSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search accounts by name, handle, platform, type, or URL"
                    className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm"
                  />
                </label>
                <label className="relative block">
                  <FaFilter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  <select
                    value={platformFilter}
                    onChange={(event) => setPlatformFilter(event.target.value)}
                    className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm"
                  >
                    <option value="">All platforms</option>
                    {platforms.map((platform) => (
                      <option key={platform.id} value={platform.id}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {isLoading ? (
                <div className="rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
                  Loading social media accounts...
                </div>
              ) : filteredAccounts.length === 0 ? (
                <div className="rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
                  {searchTerm || platformFilter
                    ? "No accounts match your search."
                    : "No social media accounts are available yet."}
                </div>
              ) : (
                <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
                  {filteredAccounts.map((account) => {
                    const linked = linkedAccountIds.has(account.id);
                    const platform = getAccountPlatform(account, platforms);
                    const accountTypeName = getAccountTypeName(
                      account,
                      accountTypes,
                    );

                    return (
                      <div
                        key={account.id}
                        className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-medium text-gray-900">
                              {account.name}
                            </h4>
                            {platform?.name && (
                              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                {platform.name}
                              </span>
                            )}
                            {accountTypeName && (
                              <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700">
                                {accountTypeName}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                            {account.handle && <span>{account.handle}</span>}
                            {account.url && (
                              <a
                                href={account.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                              >
                                <FaExternalLinkAlt className="h-3 w-3" />
                                Open
                              </a>
                            )}
                            <span className="capitalize">
                              {account.visibility || "private"}
                            </span>
                          </div>
                          {account.description && (
                            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                              {account.description}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleAssociation(account)}
                          disabled={isMutating}
                          className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${
                            linked
                              ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                              : "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                          }`}
                        >
                          {linked ? (
                            <>
                              <FaUnlink className="h-3 w-3" />
                              Unlink
                            </>
                          ) : (
                            <>
                              <FaLink className="h-3 w-3" />
                              Link
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
