"use client";

import React, { useState, useRef } from "react";
import {
  FaUpload,
  FaSpinner,
  FaEdit,
  FaTimes,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaDownload,
  FaFileAlt,
  FaExternalLinkAlt,
  FaLink,
  FaInfoCircle,
} from "react-icons/fa";
import { SiGooglesheets } from "react-icons/si";
import { toast } from "react-hot-toast";
import { useBulkCreateSocialMediaAccounts } from "../hooks/useSocialMedia";
import { useContextAuth } from "../context/authContext";
import SelectField from "./inputs/SelectField";
import InputField from "./inputs/InputField";

const SocialMediaCSVImport = ({
  onClose,
  onAccountsCreated,
  platforms = [],
  accountTypes = [],
  organizations = [],
  collections = [],
  externalLinks = [],
}) => {
  const [csvFile, setCsvFile] = useState(null);
  const [previewAccounts, setPreviewAccounts] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [accountsExpanded, setAccountsExpanded] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bulkVisibility, setBulkVisibility] = useState(null);
  const [bulkAccountType, setBulkAccountType] = useState(null);
  const [bulkAssociationType, setBulkAssociationType] = useState(null);
  const [bulkAssociationItem, setBulkAssociationItem] = useState(null);
  const [accountAssociations, setAccountAssociations] = useState({});

  const fileInputRef = useRef(null);
  const { isAdmin } = useContextAuth();
  const bulkCreateMutation = useBulkCreateSocialMediaAccounts();

  // CSV Template data
  const csvTemplate = `platform,account_type,visibility,name,handle,url,description
Email,Community,Private,John Doe,john@example.com,mailto:john@example.com,Example description
LinkedIn,Professional,Private,Jane Smith,janesmith,https://linkedin.com/in/janesmith,Healthcare Professional
X,Community,Private,Patient Advocate,patientadvocate,https://x.com/patientadvocate,Patient advocacy and support`;

  // Download CSV template
  const downloadTemplate = () => {
    const blob = new Blob([csvTemplate], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "social_media_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Template downloaded successfully");
  };

  // Open Google Sheets with template
  const openGoogleSheets = () => {
    // SETUP INSTRUCTIONS:
    // 1. Create a Google Sheet with the template data
    // 2. Share it as "Anyone with the link can view"
    // 3. Copy the Sheet ID from the URL and paste it below
    // 4. Users will be able to click "Make a copy" automatically

    const TEMPLATE_SHEET_ID = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_TEMPLATE_ID || null;

    if (TEMPLATE_SHEET_ID) {
      // Open the template with "Make a copy" - this creates a new copy for the user
      window.open(
        `https://docs.google.com/spreadsheets/d/${TEMPLATE_SHEET_ID}/copy`,
        "_blank"
      );
      toast.success("Opening template in Google Sheets - click 'Make a copy'");
    } else {
      // Fallback: Create the sheet content programmatically using Google Sheets URL API
      // This creates a new sheet with data pre-filled
      const rows = csvTemplate.split("\n");
      const headers = rows[0].split(",");
      const dataRows = rows.slice(1);

      // Build Google Sheets creation URL with cells parameter
      // Format: https://docs.google.com/spreadsheets/create?usp=sheets_web_extension_api
      const sheetData = {
        sheets: [
          {
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: rows.map(row => ({
                  values: row.split(",").map(cell => ({
                    userEnteredValue: { stringValue: cell.replace(/"/g, '') }
                  }))
                }))
              }
            ]
          }
        ]
      };

      // Alternative: Open sheets.new and show instructions
      window.open("https://sheets.new", "_blank");

      // Also download the CSV so they can import it
      downloadTemplate();

      toast.success(
        "New Google Sheet opened! Use File > Import to upload the downloaded CSV template"
      );
    }
  };

  // Parse CSV file
  const parseCSV = (text) => {
    const lines = text.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error("CSV file must contain at least a header row and one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim());
    const requiredHeaders = [
      "platform",
      "account_type",
      "visibility",
      "name",
      "url",
    ];

    // Validate headers
    const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(
        `Missing required columns: ${missingHeaders.join(", ")}`
      );
    }

    const accounts = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted CSV values
      const values = [];
      let current = "";
      let inQuotes = false;

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      // Remove quotes from values
      const cleanValues = values.map((v) =>
        v.startsWith('"') && v.endsWith('"') ? v.slice(1, -1) : v
      );

      const row = {};
      headers.forEach((header, index) => {
        row[header] = cleanValues[index] || "";
      });

      // Map to account object
      const platformName = row.platform?.trim();
      const accountTypeName = row.account_type?.trim();

      // Find platform ID
      const platform = platforms.find(
        (p) => p.name.toLowerCase() === platformName?.toLowerCase()
      );

      // Find account type ID
      const accountType = accountTypes.find(
        (t) => t.name.toLowerCase() === accountTypeName?.toLowerCase()
      );

      if (!platform) {
        console.warn(
          `Row ${i}: Platform "${platformName}" not found, skipping row`
        );
        continue;
      }

      if (!accountType) {
        console.warn(
          `Row ${i}: Account type "${accountTypeName}" not found, skipping row`
        );
        continue;
      }

      // Validate visibility
      const visibility = row.visibility?.toLowerCase();
      if (!["private", "public"].includes(visibility)) {
        console.warn(
          `Row ${i}: Invalid visibility "${row.visibility}", defaulting to private`
        );
      }

      const account = {
        id: `preview-${i}`,
        platformId: platform.id,
        platformName: platform.name,
        accountTypeId: accountType.id,
        accountTypeName: accountType.name,
        name: row.name?.trim() || "",
        handle: row.handle?.trim() || "",
        url: row.url?.trim() || "",
        description: row.description?.trim() || "",
        visibility: ["private", "public"].includes(visibility)
          ? visibility
          : "private",
        rowNumber: i + 1,
      };

      // Validate required fields
      if (!account.name || !account.url) {
        console.warn(`Row ${i}: Missing required fields (name or url), skipping row`);
        continue;
      }

      accounts.push(account);
    }

    return accounts;
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setCsvFile(file);
    setIsProcessing(true);

    try {
      const text = await file.text();
      const accounts = parseCSV(text);

      if (accounts.length === 0) {
        toast.error("No valid accounts found in CSV file");
        setIsProcessing(false);
        return;
      }

      setPreviewAccounts(accounts);
      setShowPreview(true);
      toast.success(`Found ${accounts.length} account(s) ready to import`);
    } catch (error) {
      console.error("Error parsing CSV:", error);
      toast.error(error.message || "Failed to parse CSV file");
      setCsvFile(null);
    } finally {
      setIsProcessing(false);
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

  // Remove account from preview
  const removeAccount = (index) => {
    setPreviewAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  // Apply bulk visibility to all accounts
  const applyBulkVisibility = () => {
    if (!bulkVisibility) {
      toast.error("Please select a visibility option");
      return;
    }

    setPreviewAccounts((prev) =>
      prev.map((account) => ({
        ...account,
        visibility: bulkVisibility.id,
      }))
    );

    toast.success(
      `Applied ${bulkVisibility.name} visibility to all ${previewAccounts.length} accounts`
    );
  };

  // Apply bulk account type to all accounts
  const applyBulkAccountType = () => {
    if (!bulkAccountType) {
      toast.error("Please select an account type");
      return;
    }

    setPreviewAccounts((prev) =>
      prev.map((account) => ({
        ...account,
        accountTypeId: bulkAccountType.id,
        accountTypeName: bulkAccountType.name,
      }))
    );

    toast.success(
      `Applied ${bulkAccountType.name} type to all ${previewAccounts.length} accounts`
    );
  };

  // Apply bulk association to all accounts
  const applyBulkAssociation = () => {
    if (!bulkAssociationType || !bulkAssociationItem) {
      toast.error("Please select both association type and item");
      return;
    }

    // Create associations for all accounts
    const newAssociations = {};
    previewAccounts.forEach((account, index) => {
      newAssociations[index] = {
        organizations: bulkAssociationType.id === "organization" ? [bulkAssociationItem.id] : [],
        collections: bulkAssociationType.id === "collection" ? [bulkAssociationItem.id] : [],
        external_links: bulkAssociationType.id === "external_link" ? [bulkAssociationItem.id] : [],
      };
    });

    setAccountAssociations(newAssociations);

    toast.success(
      `Associated all ${previewAccounts.length} accounts with ${bulkAssociationItem.name || bulkAssociationItem.title}`
    );
  };

  // Get association options based on type
  const getAssociationOptions = () => {
    if (!bulkAssociationType) return [];

    switch (bulkAssociationType.id) {
      case "organization":
        return organizations;
      case "collection":
        return collections;
      case "external_link":
        return externalLinks;
      default:
        return [];
    }
  };

  // Import accounts
  const handleImport = async () => {
    if (previewAccounts.length === 0) {
      toast.error("No accounts to import");
      return;
    }

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
    const associationsData = Object.keys(accountAssociations).map(
      (index) => accountAssociations[index]
    );

    try {
      const result = await bulkCreateMutation.mutateAsync({
        accounts: accountsData,
        associations: associationsData.length > 0 ? associationsData : undefined,
      });

      // Show errors if any
      if (result.results?.errors?.length > 0) {
        result.results.errors.forEach((error) => {
          toast.error(`Row ${error.row}: ${error.error}`);
        });
      }

      if (onAccountsCreated) {
        onAccountsCreated(result.results?.created || []);
      }

      onClose();
    } catch (error) {
      console.error("Error importing accounts:", error);
      // Error toast is already shown by the hook
    }
  };

  // Reset to file upload
  const resetToUpload = () => {
    setShowPreview(false);
    setPreviewAccounts([]);
    setCsvFile(null);
    setEditingIndex(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <FaFileAlt className="text-blue-600" />
          CSV Import
        </h2>

        {!showPreview ? (
          <div className="space-y-6">
            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <FaInfoCircle className="text-blue-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    How to import social media accounts
                  </h3>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Download the CSV template or open it in Google Sheets</li>
                    <li>Fill in your social media account information</li>
                    <li>Upload the completed CSV file</li>
                    <li>Review and edit the imported accounts</li>
                    <li>Click Import to add them to your directory</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Template Download Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Step 1: Get Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  onClick={downloadTemplate}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <FaDownload className="text-lg" />
                  <span className="font-medium">Download CSV Template</span>
                </button>

                <button
                  onClick={openGoogleSheets}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <SiGooglesheets className="text-lg" />
                  <span className="font-medium">
                    {process.env.NEXT_PUBLIC_GOOGLE_SHEETS_TEMPLATE_ID
                      ? "Make a Copy in Google Sheets"
                      : "Open in Google Sheets"}
                  </span>
                  <FaExternalLinkAlt className="text-sm" />
                </button>
              </div>
            </div>

            {/* CSV Format Reference */}
            <div className="space-y-2">
              <h3 className="font-semibold text-gray-900">CSV Format</h3>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto">
                <pre className="text-xs text-gray-700 font-mono whitespace-pre">
                  {csvTemplate.split("\n").slice(0, 2).join("\n")}
                </pre>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <strong>Required columns:</strong> platform, account_type,
                  visibility, name, url
                </p>
                <p>
                  <strong>Optional columns:</strong> handle, description
                </p>
                <p>
                  <strong>Platforms:</strong> Facebook, LinkedIn, Bluesky,
                  Instagram, X, YouTube, Email
                </p>
                <p>
                  <strong>Account Types:</strong>{" "}
                  {accountTypes.map((t) => t.name).join(", ")}
                </p>
                <p>
                  <strong>Visibility:</strong> Private{" "}
                  {isAdmin ? "or Public (admins only)" : "(only)"}
                </p>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">
                Step 2: Upload CSV File
              </h3>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <FaUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-700 mb-2 font-medium">
                  Click to upload your CSV file
                </p>
                <p className="text-sm text-gray-500">
                  {csvFile ? csvFile.name : "No file selected"}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center py-8">
                <FaSpinner className="animate-spin text-blue-600 text-3xl" />
                <span className="ml-3 text-gray-700">Processing CSV file...</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bulk Actions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-3">Bulk Actions</h3>
              <div className="space-y-3">
                {/* Bulk Account Type */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      Set Account Type for All
                    </label>
                    <SelectField
                      value={bulkAccountType}
                      onChange={setBulkAccountType}
                      options={accountTypes}
                      getOptionLabel={(t) => t.name}
                      getOptionValue={(t) => t.id}
                      placeholder="Select account type..."
                    />
                  </div>
                  <button
                    onClick={applyBulkAccountType}
                    disabled={!bulkAccountType}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
                  >
                    Apply to All
                  </button>
                </div>

                {/* Bulk Visibility */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-blue-800 mb-1">
                      Set Visibility for All Accounts
                    </label>
                    <SelectField
                      value={bulkVisibility}
                      onChange={setBulkVisibility}
                      options={
                        isAdmin
                          ? [
                              { id: "private", name: "Private" },
                              { id: "public", name: "Public" },
                            ]
                          : [{ id: "private", name: "Private" }]
                      }
                      getOptionLabel={(v) => v.name}
                      getOptionValue={(v) => v.id}
                      placeholder="Select visibility..."
                    />
                  </div>
                  <button
                    onClick={applyBulkVisibility}
                    disabled={!bulkVisibility}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
                  >
                    Apply to All
                  </button>
                </div>

                {/* Bulk Associations */}
                <div className="border-t border-blue-200 pt-3">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Associate All Accounts With
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <SelectField
                      value={bulkAssociationType}
                      onChange={(value) => {
                        setBulkAssociationType(value);
                        setBulkAssociationItem(null);
                      }}
                      options={[
                        { id: "organization", name: "Organization" },
                        { id: "collection", name: "Collection" },
                        { id: "external_link", name: "External Link" },
                      ]}
                      getOptionLabel={(t) => t.name}
                      getOptionValue={(t) => t.id}
                      placeholder="Select type..."
                    />
                    {bulkAssociationType && (
                      <SelectField
                        value={bulkAssociationItem}
                        onChange={setBulkAssociationItem}
                        options={getAssociationOptions()}
                        getOptionLabel={(item) => item.name || item.title}
                        getOptionValue={(item) => item.id}
                        placeholder={`Select ${bulkAssociationType.name.toLowerCase()}...`}
                      />
                    )}
                  </div>
                  <button
                    onClick={applyBulkAssociation}
                    disabled={!bulkAssociationType || !bulkAssociationItem}
                    className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Apply Association to All
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-gray-50 rounded-lg p-4">
              <button
                onClick={() => setAccountsExpanded(!accountsExpanded)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  Accounts to Import ({previewAccounts.length})
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
                              updateAccountField(index, "platformId", platform?.id)
                            }
                            options={platforms}
                            getOptionLabel={(p) => p.name}
                            getOptionValue={(p) => p.id}
                          />
                          <InputField
                            label="Account Name"
                            value={account.name}
                            onChange={(e) =>
                              updateAccountField(index, "name", e.target.value)
                            }
                          />
                          <InputField
                            label="Handle (optional)"
                            value={account.handle}
                            onChange={(e) =>
                              updateAccountField(index, "handle", e.target.value)
                            }
                          />
                          <InputField
                            label="URL"
                            value={account.url}
                            onChange={(e) =>
                              updateAccountField(index, "url", e.target.value)
                            }
                          />
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description (optional)
                            </label>
                            <textarea
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
                          </div>
                          <SelectField
                            label="Account Type"
                            value={accountTypes.find(
                              (t) => t.id === account.accountTypeId
                            )}
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
                              name:
                                account.visibility.charAt(0).toUpperCase() +
                                account.visibility.slice(1),
                            }}
                            onChange={(vis) =>
                              updateAccountField(index, "visibility", vis?.id)
                            }
                            options={
                              isAdmin
                                ? [
                                    { id: "private", name: "Private" },
                                    { id: "public", name: "Public" },
                                  ]
                                : [{ id: "private", name: "Private" }]
                            }
                            getOptionLabel={(v) => v.name}
                            getOptionValue={(v) => v.id}
                          />

                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => setEditingIndex(null)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              <FaCheck className="inline-block mr-1" /> Save
                            </button>
                            <button
                              onClick={() => removeAccount(index)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <FaTimes className="inline-block mr-1" /> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-medium text-gray-900">
                                {account.name}
                              </span>
                              {account.handle && (
                                <span className="text-gray-500 text-sm">
                                  @{account.handle}
                                </span>
                              )}
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {account.platformName}
                              </span>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                                {account.accountTypeName}
                              </span>
                              {account.visibility === "public" && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                  Public
                                </span>
                              )}
                            </div>
                            {account.url && (
                              <a
                                href={account.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline text-sm flex items-center gap-1 mt-1"
                              >
                                <FaLink className="w-3 h-3" />
                                {account.url}
                              </a>
                            )}
                            {account.description && (
                              <p className="text-sm text-gray-600 mt-2">
                                {account.description}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => setEditingIndex(index)}
                            className="ml-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
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
                onClick={handleImport}
                disabled={bulkCreateMutation.isPending || previewAccounts.length === 0}
                className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {bulkCreateMutation.isPending ? (
                  <>
                    <FaSpinner className="inline-block mr-2 animate-spin" />
                    Importing Accounts...
                  </>
                ) : (
                  <>
                    <FaCheck className="inline-block mr-2" />
                    Import {previewAccounts.length} Account
                    {previewAccounts.length !== 1 ? "s" : ""}
                  </>
                )}
              </button>
              <button
                onClick={resetToUpload}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Back to Upload
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SocialMediaCSVImport;
