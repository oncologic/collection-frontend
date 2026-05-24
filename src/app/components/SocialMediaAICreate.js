import React, { useState, useRef } from "react";
import {
  FaMagic,
  FaSpinner,
  FaEdit,
  FaTimes,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaUpload,
  FaImage,
  FaKeyboard,
  FaEye,
  FaLink,
  FaAt,
  FaBuilding,
  FaFolder,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useProcessImage } from "../hooks/useAI";
import {
  usePreviewSocialMediaAccounts,
  useConfirmSocialMediaAccounts,
} from "../hooks/useSocialMediaAI";
import { useQueryClient } from "@tanstack/react-query";
import { useContextAuth } from "../context/authContext";
import SelectField from "./inputs/SelectField";
import InputField from "./inputs/InputField";
import MultiSelect from "./inputs/MultiSelect";

const SocialMediaAICreate = ({
  onClose,
  onAccountsCreated,
  platforms = [],
  organizations = [],
  collections = [],
  externalLinks = [],
  accountTypes = [],
}) => {
  // Input state
  const [inputMode, setInputMode] = useState("text"); // "text" or "image"
  const [textInput, setTextInput] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Preview state
  const [previewAccounts, setPreviewAccounts] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [accountsExpanded, setAccountsExpanded] = useState(true);

  // Associations state
  const [associations, setAssociations] = useState({});

  // Loading states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Character count
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 4000;

  // @mention state
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionedItems, setMentionedItems] = useState([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);

  // Refs
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Hooks
  const { mutateAsync: processImageMutation } = useProcessImage();
  const { mutateAsync: previewAccountsMutation } =
    usePreviewSocialMediaAccounts();
  const { mutateAsync: confirmAccountsMutation } =
    useConfirmSocialMediaAccounts();
  const { getAuthHeader } = useContextAuth();
  const queryClient = useQueryClient();

  // Handle image file selection
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        toast.error("Please select a valid image file");
      }
    }
  };

  // Process image with AI
  const processImage = async () => {
    if (!imageFile) return;

    setIsProcessingImage(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result.split(",")[1];

        const result = await processImageMutation({
          imageData: base64,
          prompt:
            "Extract social media account information from this image. Include platform names, handles/usernames, URLs, descriptions, and any other relevant information. If there are multiple accounts, extract all of them.",
        });

        const content = result.content || result;
        const extractedText =
          content.extractedText ||
          content.data ||
          content.answer ||
          content.response ||
          content.message ||
          content;

        if (
          extractedText &&
          typeof extractedText === "string" &&
          extractedText.trim()
        ) {
          setTextInput(extractedText);
          setInputMode("text");
          toast.success("Image processed successfully");
          setCharCount(extractedText.length);
          setImageFile(null);
          setImagePreview(null);
        } else {
          toast.error("No text could be extracted from the image");
        }
      };
      reader.readAsDataURL(imageFile);
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
    } finally {
      setIsProcessingImage(false);
    }
  };

  // @mention functionality
  const handleTextChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;

    setTextInput(value);
    setCharCount(value.length);
    setCursorPosition(position);

    // Check for @mention trigger
    const beforeCursor = value.substring(0, position);
    const lastAtIndex = beforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const afterAt = beforeCursor.substring(lastAtIndex + 1);
      if (!afterAt.includes(" ")) {
        setMentionQuery(afterAt.toLowerCase());
        setShowMentionDropdown(true);
      } else {
        setShowMentionDropdown(false);
      }
    } else {
      setShowMentionDropdown(false);
    }
  };

  // Filter items for @mention dropdown
  const getMentionResults = () => {
    const allItems = [
      ...organizations.map((org) => ({
        ...org,
        type: "organization",
        icon: <FaBuilding className="w-3 h-3" />,
      })),
      ...collections.map((col) => ({
        ...col,
        type: "collection",
        icon: <FaFolder className="w-3 h-3" />,
      })),
      ...externalLinks.map((link) => ({
        ...link,
        type: "external_link",
        icon: <FaExternalLinkAlt className="w-3 h-3" />,
      })),
    ];

    if (!mentionQuery) return allItems.slice(0, 10);

    return allItems
      .filter((item) =>
        (item.name || item.title || "").toLowerCase().includes(mentionQuery)
      )
      .slice(0, 10);
  };

  // Handle mention selection
  const handleMentionSelect = (item) => {
    const beforeCursor = textInput.substring(0, cursorPosition);
    const lastAtIndex = beforeCursor.lastIndexOf("@");
    const beforeAt = textInput.substring(0, lastAtIndex);
    const afterCursor = textInput.substring(cursorPosition);

    const mentionText = `@${item.name || item.title}`;
    const newText = beforeAt + mentionText + " " + afterCursor;

    setTextInput(newText);
    setCharCount(newText.length);
    setMentionedItems([...mentionedItems, item]);
    setShowMentionDropdown(false);
    setMentionQuery("");

    // Focus back on textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
      const newPosition = (beforeAt + mentionText + " ").length;
      textareaRef.current.setSelectionRange(newPosition, newPosition);
    }
  };

  // Generate AI preview
  const handleGeneratePreview = async () => {
    const input = textInput.trim();

    if (!input) {
      toast.error("Please provide some text or upload an image");
      return;
    }

    setIsGenerating(true);
    try {
      // Prepare metadata for the preview request
      const metadata = {
        platforms: platforms.map((p) => ({ id: p.id, name: p.name })),
        organizations: organizations.map((o) => ({ id: o.id, name: o.name })),
        collections: collections.map((c) => ({
          id: c.id,
          name: c.name || c.title,
        })),
        externalLinks: externalLinks.map((e) => ({
          id: e.id,
          name: e.title || e.name,
        })),
        mentionedItems: mentionedItems.map((item) => ({
          id: item.id,
          name: item.name || item.title,
          type: item.type,
        })),
      };

      const result = await previewAccountsMutation({
        prompt: input,
        metadata,
      });

      if (result.accounts && Array.isArray(result.accounts)) {
        // Map the preview accounts to include platform names
        const mappedAccounts = result.accounts.map((account, index) => {
          const platform = platforms.find((p) => p.id === account.platformId);
          return {
            ...account,
            id: `preview-${index}`,
            platformName: platform?.name || account.platformName || "Unknown",
            visibility: account.visibility || "private",
          };
        });

        // Set up associations from the result
        const initialAssociations = {};
        if (result.associations) {
          result.associations.forEach((assoc, index) => {
            initialAssociations[index] = assoc || {
              organizations: [],
              collections: [],
              external_links: [],
            };
          });
        } else {
          // Default associations based on mentions
          mappedAccounts.forEach((account, index) => {
            initialAssociations[index] = {
              organizations: mentionedItems
                .filter((item) => item.type === "organization")
                .map((item) => item.id),
              collections: mentionedItems
                .filter((item) => item.type === "collection")
                .map((item) => item.id),
              external_links: mentionedItems
                .filter((item) => item.type === "external_link")
                .map((item) => item.id),
            };
          });
        }

        setPreviewAccounts(mappedAccounts);
        setAssociations(initialAssociations);
        setShowPreview(true);
        toast.success(`Found ${mappedAccounts.length} social media account(s)`);
      } else {
        toast.error("No accounts found in the provided text");
      }
    } catch (error) {
      console.error("Error generating preview:", error);
      toast.error("Failed to generate preview");
    } finally {
      setIsGenerating(false);
    }
  };

  // Update account field
  const updateAccountField = (index, field, value) => {
    setPreviewAccounts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Update associations
  const updateAssociations = (index, type, values) => {
    setAssociations((prev) => ({
      ...prev,
      [index]: {
        ...prev[index],
        [type]: values,
      },
    }));
  };

  // Remove account from preview
  const removeAccount = (index) => {
    setPreviewAccounts((prev) => prev.filter((_, i) => i !== index));
    setAssociations((prev) => {
      const updated = { ...prev };
      delete updated[index];
      // Re-index remaining associations
      const reindexed = {};
      Object.keys(updated).forEach((key) => {
        const keyIndex = parseInt(key);
        if (keyIndex > index) {
          reindexed[keyIndex - 1] = updated[key];
        } else {
          reindexed[key] = updated[key];
        }
      });
      return reindexed;
    });
  };

  // Confirm and create accounts
  const handleConfirm = async () => {
    if (previewAccounts.length === 0) {
      toast.error("No accounts to create");
      return;
    }

    setIsConfirming(true);
    try {
      // Prepare accounts data
      const accountsData = previewAccounts.map((account) => ({
        platformId: account.platformId,
        name: account.name,
        handle: account.handle,
        url: account.url,
        description: account.description,
        accountTypeId: account.accountTypeId,
        visibility: account.visibility,
      }));

      // Prepare associations data
      const associationsData = Object.keys(associations).map(
        (index) => associations[index]
      );

      const result = await confirmAccountsMutation({
        accounts: accountsData,
        associations: associationsData,
      });

      if (result.created && result.created.length > 0) {
        toast.success(
          `Successfully created ${result.created.length} account(s)`
        );

        // Invalidate queries
        queryClient.invalidateQueries(["socialMediaAccounts"]);
        queryClient.invalidateQueries(["socialMediaAssociations"]);

        if (onAccountsCreated) {
          onAccountsCreated(result.created);
        }

        onClose();
      } else if (result.results?.successful > 0) {
        // Handle bulk API response format
        toast.success(
          `Successfully created ${result.results.successful} account(s)`
        );

        // Invalidate queries
        queryClient.invalidateQueries(["socialMediaAccounts"]);
        queryClient.invalidateQueries(["socialMediaAssociations"]);

        if (onAccountsCreated) {
          onAccountsCreated(result.results.created);
        }

        onClose();
      } else {
        toast.error("Failed to create accounts");
      }

      // Show any errors
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach((error) => {
          toast.error(`${error.account}: ${error.message}`);
        });
      } else if (result.results?.errors?.length > 0) {
        result.results.errors.forEach((error) => {
          toast.error(`Row ${error.row}: ${error.error}`);
        });
      }
    } catch (error) {
      console.error("Error creating accounts:", error);
      toast.error("Failed to create accounts");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FaMagic className="text-blue-600" />
          AI Social Media Import
        </h2>

        {!showPreview ? (
          <>
            {/* Input Mode Selector */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMode("text")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  inputMode === "text"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaKeyboard className="inline-block mr-2" />
                Text Input
              </button>
              <button
                onClick={() => setInputMode("image")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  inputMode === "image"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <FaImage className="inline-block mr-2" />
                Upload Image
              </button>
            </div>

            {/* Text Input Mode */}
            {inputMode === "text" && (
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={textInput}
                    onChange={handleTextChange}
                    placeholder="Paste social media information here... Use @ to mention business units, collections, or links to associate"
                    className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={MAX_CHARS}
                  />
                  <div className="absolute bottom-2 right-2 text-sm text-gray-500">
                    {charCount}/{MAX_CHARS}
                  </div>

                  {/* @Mention Dropdown */}
                  {showMentionDropdown && (
                    <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto mt-1">
                      {getMentionResults().map((item, index) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => handleMentionSelect(item)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 ${
                            index === selectedMentionIndex ? "bg-gray-100" : ""
                          }`}
                        >
                          {item.icon}
                          <span className="font-medium">
                            {item.name || item.title}
                          </span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {item.type}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mentioned Items */}
                {mentionedItems.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {mentionedItems.map((item) => (
                      <span
                        key={`${item.type}-${item.id}`}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        <FaAt className="w-3 h-3" />
                        {item.name || item.title}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Image Input Mode */}
            {inputMode === "image" && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  {imagePreview ? (
                    <div className="space-y-4">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-64 mx-auto rounded-lg"
                      />
                      <p className="text-sm text-gray-600">
                        Click to change image
                      </p>
                    </div>
                  ) : (
                    <>
                      <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-600 mb-2">
                        Click to upload an image containing social media
                        information
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports: JPG, PNG, GIF (max 10MB)
                      </p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {imageFile && (
                  <button
                    onClick={processImage}
                    disabled={isProcessingImage}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessingImage ? (
                      <>
                        <FaSpinner className="inline-block mr-2 animate-spin" />
                        Processing Image...
                      </>
                    ) : (
                      <>
                        <FaMagic className="inline-block mr-2" />
                        Extract Text from Image
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Generate Preview Button */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleGeneratePreview}
                disabled={isGenerating || (!textInput.trim() && !imageFile)}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? (
                  <>
                    <FaSpinner className="inline-block mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <FaEye className="inline-block mr-2" />
                    Preview Accounts
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Preview Section */}
            <div className="space-y-6">
              {/* Accounts Section */}
              <div className="bg-gray-50 rounded-lg p-4">
                <button
                  onClick={() => setAccountsExpanded(!accountsExpanded)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900">
                    Social Media Accounts ({previewAccounts.length})
                  </h3>
                  {accountsExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </button>

                {accountsExpanded && (
                  <div className="mt-4 space-y-4">
                    {previewAccounts.map((account, index) => (
                      <div
                        key={account.id}
                        className="bg-white rounded-lg p-4 border border-gray-200"
                      >
                        {editingIndex === index ? (
                          <div className="space-y-3">
                            <SelectField
                              label="Platform"
                              value={platforms.find(
                                (p) => p.id === account.platformId
                              )}
                              onChange={(platform) =>
                                updateAccountField(
                                  index,
                                  "platformId",
                                  platform?.id
                                )
                              }
                              options={platforms}
                              getOptionLabel={(p) => p.name}
                              getOptionValue={(p) => p.id}
                            />
                            <InputField
                              label="Account Name"
                              value={account.name}
                              onChange={(e) =>
                                updateAccountField(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                            />
                            <InputField
                              label="Handle (without @)"
                              value={account.handle}
                              onChange={(e) =>
                                updateAccountField(
                                  index,
                                  "handle",
                                  e.target.value.replace("@", "")
                                )
                              }
                            />
                            <InputField
                              label="URL"
                              value={account.url}
                              onChange={(e) =>
                                updateAccountField(index, "url", e.target.value)
                              }
                            />
                            <textarea
                              placeholder="Description"
                              value={account.description}
                              onChange={(e) =>
                                updateAccountField(
                                  index,
                                  "description",
                                  e.target.value
                                )
                              }
                              className="w-full p-2 border border-gray-300 rounded-lg"
                              rows={3}
                            />
                            <SelectField
                              label="Account Type"
                              value={
                                accountTypes.find(
                                  (t) => t.id === account.accountTypeId
                                ) || null
                              }
                              onChange={(type) =>
                                updateAccountField(
                                  index,
                                  "accountTypeId",
                                  type?.id
                                )
                              }
                              options={accountTypes}
                              getOptionLabel={(t) => t.name}
                              getOptionValue={(t) => t.id}
                            />
                            <SelectField
                              label="Visibility"
                              value={{
                                id: account.visibility,
                                name: account.visibility,
                              }}
                              onChange={(vis) =>
                                updateAccountField(index, "visibility", vis?.id)
                              }
                              options={[
                                { id: "private", name: "Private" },
                                { id: "public", name: "Public" },
                              ]}
                              getOptionLabel={(v) => v.name}
                              getOptionValue={(v) => v.id}
                            />

                            {/* Associations */}
                            <div className="space-y-2">
                              <h4 className="font-medium text-gray-700">
                                Associations
                              </h4>
                              <MultiSelect
                                label="Business Units"
                                value={organizations.filter((org) =>
                                  associations[index]?.organizations?.includes(
                                    org.id
                                  )
                                )}
                                onChange={(selected) =>
                                  updateAssociations(
                                    index,
                                    "organizations",
                                    selected.map((s) => s.id)
                                  )
                                }
                                options={organizations}
                                getOptionLabel={(org) => org.name}
                                getOptionValue={(org) => org.id}
                                placeholder="Select business units..."
                              />
                              <MultiSelect
                                label="Collections"
                                value={collections.filter((col) =>
                                  associations[index]?.collections?.includes(
                                    col.id
                                  )
                                )}
                                onChange={(selected) =>
                                  updateAssociations(
                                    index,
                                    "collections",
                                    selected.map((s) => s.id)
                                  )
                                }
                                options={collections}
                                getOptionLabel={(col) => col.name || col.title}
                                getOptionValue={(col) => col.id}
                                placeholder="Select collections..."
                              />
                              <MultiSelect
                                label="External Links"
                                value={externalLinks.filter((link) =>
                                  associations[index]?.external_links?.includes(
                                    link.id
                                  )
                                )}
                                onChange={(selected) =>
                                  updateAssociations(
                                    index,
                                    "external_links",
                                    selected.map((s) => s.id)
                                  )
                                }
                                options={externalLinks}
                                getOptionLabel={(link) =>
                                  link.title || link.name
                                }
                                getOptionValue={(link) => link.id}
                                placeholder="Select external links..."
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingIndex(null)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                <FaCheck className="inline-block mr-1" /> Save
                              </button>
                              <button
                                onClick={() => removeAccount(index)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                <FaTimes className="inline-block mr-1" /> Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">
                                  {account.name}
                                </span>
                                {account.handle && (
                                  <span className="text-gray-500">
                                    @{account.handle}
                                  </span>
                                )}
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {account.platformName}
                                </span>
                              </div>
                              {account.url && (
                                <a
                                  href={account.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                                >
                                  <FaLink className="w-3 h-3" />
                                  {account.url}
                                </a>
                              )}
                              {account.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {account.description}
                                </p>
                              )}

                              {/* Show associations */}
                              {associations[index] && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {associations[index].organizations?.map(
                                    (orgId) => {
                                      const org = organizations.find(
                                        (o) => o.id === orgId
                                      );
                                      return org ? (
                                        <span
                                          key={orgId}
                                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                                        >
                                          <FaBuilding className="inline-block w-3 h-3 mr-1" />
                                          {org.name}
                                        </span>
                                      ) : null;
                                    }
                                  )}
                                  {associations[index].collections?.map(
                                    (colId) => {
                                      const col = collections.find(
                                        (c) => c.id === colId
                                      );
                                      return col ? (
                                        <span
                                          key={colId}
                                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                                        >
                                          <FaFolder className="inline-block w-3 h-3 mr-1" />
                                          {col.name || col.title}
                                        </span>
                                      ) : null;
                                    }
                                  )}
                                  {associations[index].external_links?.map(
                                    (linkId) => {
                                      const link = externalLinks.find(
                                        (l) => l.id === linkId
                                      );
                                      return link ? (
                                        <span
                                          key={linkId}
                                          className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded"
                                        >
                                          <FaExternalLinkAlt className="inline-block w-3 h-3 mr-1" />
                                          {link.title || link.name}
                                        </span>
                                      ) : null;
                                    }
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => setEditingIndex(index)}
                              className="ml-4 p-2 text-gray-600 hover:text-gray-800"
                            >
                              <FaEdit />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={isConfirming || previewAccounts.length === 0}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isConfirming ? (
                    <>
                      <FaSpinner className="inline-block mr-2 animate-spin" />
                      Creating Accounts...
                    </>
                  ) : (
                    <>
                      <FaCheck className="inline-block mr-2" />
                      Create {previewAccounts.length} Account
                      {previewAccounts.length !== 1 ? "s" : ""}
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setPreviewAccounts([]);
                    setAssociations({});
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Back to Edit
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SocialMediaAICreate;
