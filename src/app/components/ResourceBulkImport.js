import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  FaUpload,
  FaDownload,
  FaCheck,
  FaExclamationTriangle,
  FaSpinner,
  FaFileAlt,
  FaTimes,
  FaBuilding,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Papa from "papaparse";
import { useContextAuth } from "../context/authContext";
import { useAuth } from "@clerk/nextjs";

const ResourceBulkImport = ({
  onClose,
  resourceTypes = [],
  organizations = [],
  sensitivityLevels = [],
  expertiseLevels = [],
  targetAudiences = [],
  tags = [],
  forcedOrganizationId = null, // New prop for forced organization
  selectedTenants = [],
}) => {
  const [csvFile, setCsvFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [currentStep, setCurrentStep] = useState("upload"); // upload, preview, importing, complete
  const [selectedTenant, setSelectedTenant] = useState(null);
  const [selectedPreviewResources, setSelectedPreviewResources] = useState(
    new Set()
  );
  const [bulkOrganizationName, setBulkOrganizationName] = useState("");
  const [backfillingEmbeddings, setBackfillingEmbeddings] = useState(false);
  const [embeddingBackfillStatus, setEmbeddingBackfillStatus] = useState(null);

  const fileInputRef = useRef(null);
  const { isAdmin, isAdvocate, getAuthHeader } = useContextAuth();
  const { getToken } = useAuth();
  const [previewData, setPreviewData] = useState(null);

  // Initialize selected tenant
  useEffect(() => {
    if (!selectedTenant && selectedTenants.length > 0) {
      // Check if Blood and Lymph System tenant is in the list
      const bloodTenant = selectedTenants.find(
        (t) =>
          t.id === "3197178c-9bce-4e06-8680-a4c0d52fcf8b" ||
          t.name === "Blood and Lymph System" ||
          t.name === "blood" ||
          t.name?.toLowerCase().includes("blood")
      );

      if (bloodTenant) {
        setSelectedTenant(bloodTenant);
      } else {
        // Fall back to first available tenant
        setSelectedTenant(selectedTenants[0]);
      }
    }
  }, [selectedTenant, selectedTenants]);

  // Filter organizations based on selected tenant
  const filteredOrganizations = useMemo(() => {
    if (!selectedTenant || !organizations.length) return organizations;

    return organizations.filter((org) => {
      return (
        org.tenantId === selectedTenant.id ||
        org.tenants?.some((tenant) => tenant.id === selectedTenant.id)
      );
    });
  }, [selectedTenant, organizations]);

  const bulkAssignmentOrganizations = useMemo(() => {
    const names = new Set();

    (filteredOrganizations.length > 0
      ? filteredOrganizations
      : organizations
    ).forEach((org) => {
      if (org?.name?.trim()) {
        names.add(org.name.trim());
      }
    });

    previewData?.organizations?.forEach((org) => {
      if (org?.name?.trim()) {
        names.add(org.name.trim());
      }
    });

    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [filteredOrganizations, organizations, previewData]);

  const areAllPreviewResourcesSelected = useMemo(() => {
    if (!previewData?.resources?.length) return false;
    return selectedPreviewResources.size === previewData.resources.length;
  }, [previewData, selectedPreviewResources]);

  const canBackfillTenantEmbeddings = useMemo(() => {
    if (isAdmin) {
      return true;
    }

    if (!selectedTenant?.id || !Array.isArray(isAdvocate)) {
      return false;
    }

    return isAdvocate.some((tenant) => tenant.tenantId === selectedTenant.id);
  }, [isAdmin, isAdvocate, selectedTenant?.id]);

  const embeddingBackfillSummary = useMemo(() => {
    if (!embeddingBackfillStatus) {
      return null;
    }

    if (embeddingBackfillStatus.state === "running") {
      return {
        tone: "blue",
        text: `Rebuilding embeddings: ${
          embeddingBackfillStatus.job?.processedCount || 0
        } of ${embeddingBackfillStatus.job?.totalCount || 0} resources processed.`,
      };
    }

    if (embeddingBackfillStatus.state === "queued") {
      return {
        tone: "blue",
        text: `Queued ${
          embeddingBackfillStatus.job?.totalCount || 0
        } resources for rebuild. Processing will begin shortly.`,
      };
    }

    if (embeddingBackfillStatus.state === "failed") {
      return {
        tone: "red",
        text:
          embeddingBackfillStatus.job?.error ||
          "Embedding rebuild failed for this tenant.",
      };
    }

    if (embeddingBackfillStatus.staleResources === 0) {
      return {
        tone: "green",
        text: `Embeddings are up to date for this tenant. ${embeddingBackfillStatus.embeddedResources} of ${embeddingBackfillStatus.totalResources} resources have vectors.`,
      };
    }

    return {
      tone: "amber",
      text: `${embeddingBackfillStatus.staleResources} resources still need embedding updates in this tenant.`,
    };
  }, [embeddingBackfillStatus]);

  useEffect(() => {
    setSelectedPreviewResources(new Set());
    setBulkOrganizationName("");
  }, [previewData?.resources?.length, csvFile?.name, selectedTenant?.id]);

  useEffect(() => {
    if (currentStep !== "preview" || !previewData) {
      setValidationErrors([]);
      return;
    }

    const errors = [];

    previewData.resources?.forEach((resource, index) => {
      const rowErrors = [];
      const rowNumber = index + 2;

      if (!resource.name?.trim()) {
        rowErrors.push("Missing resource name");
      }

      if (!resource.url?.trim()) {
        rowErrors.push("Missing resource URL");
      } else if (!isValidURL(resource.url)) {
        rowErrors.push(`Invalid URL format: ${resource.url}`);
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          errors: rowErrors,
        });
      }
    });

    setValidationErrors(errors);
  }, [currentStep, previewData]);

  useEffect(() => {
    if (!selectedTenant?.id || !canBackfillTenantEmbeddings) {
      setEmbeddingBackfillStatus(null);
      return;
    }

    let cancelled = false;
    let intervalId = null;

    const loadEmbeddingBackfillStatus = async () => {
      try {
        const headers = await getAuthHeader();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/import/resource-embeddings/status?tenantId=${selectedTenant.id}`,
          {
            headers,
          }
        );

        const result = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));

        if (!response.ok) {
          throw new Error(
            result.message || "Failed to fetch embedding rebuild status"
          );
        }

        if (!cancelled) {
          setEmbeddingBackfillStatus(result.status || null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Embedding status error:", error);
        }
      }
    };

    loadEmbeddingBackfillStatus();

    if (
      embeddingBackfillStatus?.state === "queued" ||
      embeddingBackfillStatus?.state === "running"
    ) {
      intervalId = setInterval(loadEmbeddingBackfillStatus, 3000);
    }

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [
    canBackfillTenantEmbeddings,
    embeddingBackfillStatus?.state,
    getAuthHeader,
    selectedTenant?.id,
  ]);

  // Required columns for validation
  const requiredColumns = [
    "name",
    "url",
    "description",
    "resourceDate",
    "resourceType",
  ];

  // Fuzzy matching function for organization names
  const findOrganizationByName = (orgName) => {
    if (!orgName || !orgName.trim()) return null;

    const searchName = orgName.toLowerCase().trim();
    const searchableOrgs =
      filteredOrganizations.length > 0 ? filteredOrganizations : organizations;

    // Exact match first
    let match = searchableOrgs.find(
      (org) => org.name.toLowerCase() === searchName
    );

    if (match) return match;

    // Check acronym match
    match = searchableOrgs.find(
      (org) => org.acronym && org.acronym.toLowerCase() === searchName
    );

    if (match) return match;

    // Partial match - organization name contains the search term
    match = searchableOrgs.find((org) =>
      org.name.toLowerCase().includes(searchName)
    );

    if (match) return match;

    // Reverse partial match - search term contains organization name
    match = searchableOrgs.find((org) =>
      searchName.includes(org.name.toLowerCase())
    );

    if (match) return match;

    // Abbreviation matching - check if search term matches org initials
    match = searchableOrgs.find((org) => {
      const initials = org.name
        .split(" ")
        .filter((word) => word.length > 0)
        .map((word) => word[0].toLowerCase())
        .join("");
      return initials === searchName;
    });

    return match || null;
  };

  // Find resource type by name
  const findResourceTypeByName = (typeName) => {
    if (!typeName || !typeName.trim()) return null;
    const searchName = typeName.toLowerCase().trim();
    return resourceTypes.find((rt) => rt.name.toLowerCase() === searchName);
  };

  // Find sensitivity level by name
  const findSensitivityLevelByName = (levelName) => {
    if (!levelName || !levelName.trim()) return null;
    const searchName = levelName.toLowerCase().trim();

    // Map common variations
    const levelMap = {
      low: 1,
      medium: 2,
      high: 3,
      pending: null,
      "not rated": null,
      "n/a": null,
    };

    if (levelMap.hasOwnProperty(searchName)) {
      return levelMap[searchName];
    }

    // Try to find in provided sensitivity levels
    const found = sensitivityLevels.find(
      (sl) => sl.name.toLowerCase() === searchName
    );
    return found ? found.id : null;
  };

  // Find expertise level by name
  const findExpertiseLevelByName = (levelName) => {
    if (!levelName || !levelName.trim()) return null;
    const searchName = levelName.toLowerCase().trim();
    return expertiseLevels.find((el) => el.name.toLowerCase() === searchName);
  };

  // Find target audience by name
  const findTargetAudienceByName = (audienceName) => {
    if (!audienceName || !audienceName.trim()) return null;
    const searchName = audienceName.toLowerCase().trim();
    return targetAudiences.find((ta) => ta.name.toLowerCase() === searchName);
  };

  // Find tag by name
  const findTagByName = (tagName) => {
    if (!tagName || !tagName.trim()) return null;
    const searchName = tagName.toLowerCase().trim();
    return tags.find((tag) => tag.name.toLowerCase() === searchName);
  };

  const normalizeImportName = (value) => value?.trim().toLowerCase() || "";

  const getImportTenantId = () =>
    selectedTenant?.id ||
    selectedTenants?.[0]?.id ||
    process.env.NEXT_PUBLIC_COMMUNITY_TENANT ||
    "";

  const stripHtmlPreviewText = (value) =>
    value
      ? value
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      : "";

  const formatPreviewFieldLabel = (key) =>
    key
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const previewFieldOrder = [
    "Resource Name",
    "name",
    "Assigned Organization",
    "Source Organization",
    "Organization",
    "organizations",
    "url",
    "Link",
    "description",
    "Description",
    "resourceDate",
    "Resource Date",
    "resourceType",
    "Resource Type",
    "tags",
    "Service",
    "targetAudience",
    "Target Audience",
    "demographics",
    "Demographics",
    "accessibility",
    "Accessibility",
    "email",
    "Email",
    "phone",
    "Phone number",
  ];

  const getRawPreviewEntries = (row) =>
    Object.entries(row)
      .filter(([, value]) => String(value ?? "").trim() !== "")
      .sort(([keyA], [keyB]) => {
        const orderA = previewFieldOrder.indexOf(keyA);
        const orderB = previewFieldOrder.indexOf(keyB);
        const normalizedOrderA = orderA === -1 ? Number.MAX_SAFE_INTEGER : orderA;
        const normalizedOrderB = orderB === -1 ? Number.MAX_SAFE_INTEGER : orderB;

        if (normalizedOrderA !== normalizedOrderB) {
          return normalizedOrderA - normalizedOrderB;
        }

        return keyA.localeCompare(keyB);
      });

  const isWidePreviewField = (key) =>
    [
      "url",
      "Link",
      "description",
      "Description",
      "fullText",
      "Full Text",
      "timestamps",
      "Timestamps",
    ].includes(key);

  const getSourcePreviewOrganizationName = (row) =>
    row.organizations?.trim() || row.Organization?.trim() || "";

  const getAssignedPreviewOrganizationName = (index) =>
    previewData?.resources?.[index]?.organizationName?.trim() || "";

  const getSourcePreviewEntries = (row, index) => {
    const assignedOrganizationName = getAssignedPreviewOrganizationName(index);
    const sourceOrganizationName = getSourcePreviewOrganizationName(row);
    const baseEntries = getRawPreviewEntries(row).filter(
      ([key]) => key !== "organizations" && key !== "Organization"
    );

    if (assignedOrganizationName || sourceOrganizationName) {
      baseEntries.unshift([
        "Assigned Organization",
        assignedOrganizationName || "Unassigned",
      ]);
    }

    if (
      sourceOrganizationName &&
      sourceOrganizationName !== assignedOrganizationName
    ) {
      baseEntries.splice(1, 0, [
        "Source Organization",
        sourceOrganizationName,
      ]);
    }

    return baseEntries;
  };

  const normalizePreviewImportData = (data) => {
    if (!data) {
      return null;
    }

    const resources = Array.isArray(data.resources)
      ? data.resources.map((resource) => ({
          ...resource,
          organizationName: resource.organizationName?.trim() || null,
        }))
      : [];

    const previewOrganizationLookup = new Map();

    (Array.isArray(data.organizations) ? data.organizations : []).forEach(
      (organization) => {
        const normalizedName = normalizeImportName(organization?.name);

        if (normalizedName && !previewOrganizationLookup.has(normalizedName)) {
          previewOrganizationLookup.set(normalizedName, {
            ...organization,
            name: organization.name.trim(),
          });
        }
      }
    );

    const organizationsToCreate = [];
    const seenOrganizations = new Set();

    resources.forEach((resource) => {
      const organizationName = resource.organizationName?.trim();
      const normalizedName = normalizeImportName(organizationName);

      if (!normalizedName || seenOrganizations.has(normalizedName)) {
        return;
      }

      seenOrganizations.add(normalizedName);

      if (findOrganizationByName(organizationName)) {
        return;
      }

      organizationsToCreate.push(
        previewOrganizationLookup.get(normalizedName) || {
          name: organizationName,
          description: resource.description || "",
          tenantId: getImportTenantId(),
          professional: true,
          tags: [],
        }
      );
    });

    return {
      ...data,
      resources,
      organizations: organizationsToCreate,
    };
  };

  // Generate sample CSV for download
  const generateSampleCSV = () => {
    const sampleData = [
      {
        name: "Mental Health Resources Guide",
        url: "https://example.com/mental-health-guide",
        description:
          "Comprehensive guide covering mental health topics and resources",
        resourceDate: "2024-01-15",
        resourceType: "Website", // Use type names instead of IDs
        organizations: "American Psychological Association, NAMI", // Organization names
        organizationAcronyms: "APA, NAMI", // Optional acronyms
        organizationCategories: "Professional, Advocacy", // Optional categories
        videoUrl: "",
        sensitivityLevel: "Low", // Use text values: Low, Medium, High, or leave empty for pending
        expertiseLevel: "Intermediate",
        targetAudience: "Patients",
        tags: "mental-health, support, education", // Use tag names instead of IDs
        timestamps: "0:00 Introduction\n2:30 Key Points\n5:45 Summary",
        fullText: "Full article content goes here...",
        featured: "false",
      },
      {
        name: "Trauma-Informed Care Training Video",
        url: "https://example.com/trauma-care",
        description: "Video training on trauma-informed care practices",
        resourceDate: "2024-01-20",
        resourceType: "Video",
        organizations: "National Child Traumatic Stress Network, SAMHSA",
        organizationAcronyms: "NCTSN, SAMHSA",
        organizationCategories: "Research, Government",
        videoUrl: "https://youtube.com/watch?v=example",
        sensitivityLevel: "Medium",
        expertiseLevel: "Beginner",
        targetAudience: "Healthcare Professionals",
        tags: "trauma, training, professional-development",
        timestamps: "0:00 Welcome\n1:15 Definition\n3:45 Best Practices",
        fullText: "Video transcript content...",
        featured: "true",
      },
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "resources_import_template.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const fileName = file.name.toLowerCase();

    // Accept CSV, TSV, and Excel files
    const validTypes = [
      "text/csv",
      "text/tab-separated-values",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (
      file &&
      (validTypes.includes(file.type) ||
        fileName.endsWith(".csv") ||
        fileName.endsWith(".tsv") ||
        fileName.endsWith(".txt") ||
        fileName.endsWith(".xlsx") ||
        fileName.endsWith(".xls"))
    ) {
      setCsvFile(file);
      parseCSV(file);
    } else {
      toast.error("Please upload a valid CSV, TSV, or Excel file");
    }
  };

  // Map backend TSV columns to frontend expected columns
  const mapTSVColumns = (row) => {
    // Handle the backend's TSV format with Organization, Service, Link columns
    const mappedRow = {};

    // Primary mappings for backend TSV format
    // Organization column is BOTH the resource name AND the organization to link/create
    mappedRow.name =
      row["Resource Name"] ||
      row["name"] ||
      row["Name"] ||
      row["Organization"] ||
      "";
    mappedRow.url = row["Link"] || row["url"] || row["Resource URL"] || "";
    mappedRow.description = row["Description"] || row["description"] || "";
    mappedRow.resourceDate =
      row["resourceDate"] ||
      row["Resource Date"] ||
      new Date().toISOString().split("T")[0];
    mappedRow.resourceType =
      row["resourceType"] || row["Resource Type"] || row["Type"] || "Website";

    // Map Service column to tags (filter out N/A)
    if (
      row["Service"] &&
      row["Service"] !== "N/A" &&
      row["Service"] !== "n/a"
    ) {
      mappedRow.tags = row["Service"];
    } else if (row["tags"] || row["Tags"]) {
      // Also filter N/A from tags field
      const tagValue = row["tags"] || row["Tags"];
      if (tagValue !== "N/A" && tagValue !== "n/a") {
        mappedRow.tags = tagValue;
      }
    }

    // IMPORTANT: For backend TSV format, Organization column means the resource belongs to that org
    // Map organizations - Organization column indicates the org this resource belongs to
    if (row["organizations"] || row["Organizations"]) {
      mappedRow.organizations = row["organizations"] || row["Organizations"];
    } else if (row["Organization"]) {
      // Organization column is the org this resource belongs to
      mappedRow.organizations = row["Organization"];
    }

    // Additional field mappings
    mappedRow.organizationAcronyms =
      row["organizationAcronyms"] || row["Acronym"] || "";
    mappedRow.organizationCategories =
      row["organizationCategories"] || row["Category"] || "";
    mappedRow.sensitivityLevel =
      row["sensitivityLevel"] ||
      row["Sensitivity"] ||
      row["Sensitivity Level"] ||
      "";
    mappedRow.expertiseLevel =
      row["expertiseLevel"] || row["Expertise"] || row["Expertise Level"] || "";
    mappedRow.targetAudience =
      row["targetAudience"] || row["Target Audience"] || "";
    mappedRow.videoUrl = row["videoUrl"] || row["Video URL"] || "";
    mappedRow.timestamps = row["timestamps"] || row["Timestamps"] || "";
    mappedRow.fullText = row["fullText"] || row["Full Text"] || "";
    mappedRow.featured = row["featured"] || row["Featured"] || "";

    // Handle additional backend TSV columns
    mappedRow.demographics = row["Demographics"] || "";
    mappedRow.accessibility = row["Accessibility"] || "";
    mappedRow.email = row["Email"] || "";
    mappedRow.phone = row["Phone number"] || "";

    return mappedRow;
  };

  // Parse CSV/TSV file and get preview from backend
  const parseCSV = async (file) => {
    const fileName = file.name.toLowerCase();
    const delimiter =
      fileName.endsWith(".tsv") || fileName.endsWith(".txt") ? "\t" : ",";

    Papa.parse(file, {
      header: true,
      delimiter: delimiter,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length > 0) {
          console.error("Parse errors:", results.errors);
          toast.error("Error parsing file: " + results.errors[0].message);
          return;
        }

        // Map the columns to expected format
        const mappedData = results.data.map(mapTSVColumns);
        setParsedData(mappedData);

        // Convert to TSV format for backend - use original data, not mapped
        const tsvContent = convertToTSV(results.data);

        // Get preview from backend
        try {
          const token = await getToken();
          const tenantId =
            selectedTenant?.id ||
            selectedTenants[0]?.id ||
            process.env.NEXT_PUBLIC_COMMUNITY_TENANT;

          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/import/preview`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                tsvContent: tsvContent,
                tenantId: tenantId,
              }),
            }
          );

          if (response.ok) {
            const preview = await response.json();
            setPreviewData(normalizePreviewImportData(preview.data));
            setCurrentStep("preview");
          } else {
            const error = await response
              .json()
              .catch(() => ({ message: "Unknown error" }));

            if (response.status === 401) {
              toast.error(
                "Authentication failed. Please refresh and try again."
              );
            } else if (response.status === 403) {
              toast.error(
                "You don't have permission to import to this tenant. Please select a different tenant or contact an admin."
              );
            } else {
              toast.error(
                "Failed to preview import: " +
                  (error.message || "Unknown error")
              );
            }
          }
        } catch (error) {
          console.error("Preview error:", error);
          toast.error("Failed to preview import: " + error.message);
        }
      },
      error: (error) => {
        console.error("Parse error:", error);
        toast.error("Failed to parse file: " + error.message);
      },
    });
  };

  // Convert parsed data to TSV format for backend
  const convertToTSV = (data) => {
    if (!data || data.length === 0) return "";

    // Create TSV with backend expected columns
    const headers = [
      "Resource Name",
      "Organization",
      "Service",
      "Link",
      "Description",
      "Email",
      "Phone number",
      "Demographics",
      "Accessibility",
    ];
    const rows = [headers.join("\t")];

    data.forEach((row, index) => {
      // Try to find Service column with various possible names (including with spaces)
      let service = "";
      const possibleServiceKeys = [
        "Service",
        "service",
        "Services",
        "Service ",
        " Service",
        "Service\t",
        "\tService",
      ];
      for (const key of possibleServiceKeys) {
        if (row[key]) {
          service = row[key];
          break;
        }
      }

      // If still no service, check all keys that contain 'service' (case insensitive)
      if (!service) {
        for (const key in row) {
          if (key.toLowerCase().includes("service")) {
            service = row[key];
            break;
          }
        }
      }

      // Clean up service value - if it's N/A or empty, use empty string
      if (
        service === "N/A" ||
        service === "n/a" ||
        !service ||
        service.trim() === ""
      ) {
        service = "";
      }

      const tsvRow = [
        row["Resource Name"] ||
          row["name"] ||
          row["Name"] ||
          row["Organization"] ||
          "",
        row["organizations"] ||
          row["Organizations"] ||
          row["Organization"] ||
          "",
        service, // Service column (empty if N/A)
        row["url"] || row["Link"] || "", // Map 'url' to 'Link'
        row["description"] || row["Description"] || "", // description
        row["Email"] || row["email"] || "", // Don't use N/A
        row["Phone number"] || "", // Don't use N/A
        row["Demographic"] || row["Demographics"] || "", // Don't use N/A
        row["Accessibility"] || "", // Don't use N/A
      ];
      rows.push(tsvRow.join("\t"));
    });

    return rows.join("\n");
  };

  // Helper validation functions
  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const isValidURL = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Transform CSV row to resource object
  const transformRowToResource = (row) => {
    // Use selected tenant
    const tenantId =
      selectedTenant?.id ||
      selectedTenants?.[0]?.id ||
      process.env.NEXT_PUBLIC_COMMUNITY_TENANT ||
      "";

    // Process organizations from CSV
    let organizationIds = [];
    const newOrganizations = [];

    if (row.organizations && row.organizations.trim()) {
      const orgEntries = row.organizations.split(",").map((org) => org.trim());
      const acronyms = row.organizationAcronyms
        ? row.organizationAcronyms.split(",").map((a) => a.trim())
        : [];
      const categories = row.organizationCategories
        ? row.organizationCategories.split(",").map((c) => c.trim())
        : [];

      orgEntries.forEach((orgEntry, index) => {
        if (orgEntry) {
          const foundOrg = findOrganizationByName(orgEntry);

          if (foundOrg) {
            organizationIds.push(foundOrg.id);
          } else {
            // Track new organizations that need to be created
            newOrganizations.push({
              name: orgEntry,
              acronym: acronyms[index] || null,
              category: categories[index] || null,
            });
          }
        }
      });
    }

    // Add forced organization ID if provided and not already included
    if (
      forcedOrganizationId &&
      !organizationIds.includes(forcedOrganizationId)
    ) {
      organizationIds.push(forcedOrganizationId);
    }

    // Find resource type
    const resourceType = findResourceTypeByName(row.resourceType);
    const typeId = resourceType ? resourceType.id : resourceTypes[0]?.id || 1;

    // Find sensitivity level
    const sensitivityLevel = findSensitivityLevelByName(row.sensitivityLevel);

    // Find expertise level
    const expertiseLevel = findExpertiseLevelByName(row.expertiseLevel);
    const expertiseLevelId = expertiseLevel
      ? expertiseLevel.id
      : expertiseLevels[0]?.id || 1;

    // Find target audience
    const targetAudience = findTargetAudienceByName(row.targetAudience);
    const targetAudienceId = targetAudience
      ? targetAudience.id
      : targetAudiences[0]?.id || null;

    // Build description from available fields
    let description = row.description || "";

    // Append demographics and accessibility info if present (from backend TSV)
    if (
      row.demographics &&
      row.demographics.trim() &&
      row.demographics !== "N/A"
    ) {
      description = description
        ? `${description}\n\nDemographics: ${row.demographics}`
        : `Demographics: ${row.demographics}`;
    }

    if (
      row.accessibility &&
      row.accessibility.trim() &&
      row.accessibility !== "N/A"
    ) {
      description = description
        ? `${description}\n\nAccessibility: ${row.accessibility}`
        : `Accessibility: ${row.accessibility}`;
    }

    // If still no description, create a basic one
    if (!description) {
      description = `Resource from ${row.name || "organization"}`;
    }

    const resource = {
      name: row.name.trim(),
      url: row.url.trim(),
      description: description.trim(),
      resourceDate: row.resourceDate || new Date().toISOString().split("T")[0],
      typeId: typeId,
      sensitivityLevelId: sensitivityLevel,
      expertiseLevelId: expertiseLevelId,
      targetAudienceId: targetAudienceId,
      organizations: organizationIds,
      tenantId: tenantId,
      newOrganizations: newOrganizations, // Track organizations to create
    };

    // Add optional fields if they exist
    if (row.videoUrl && row.videoUrl.trim()) {
      resource.videoUrl = row.videoUrl.trim();
    }

    if (row.resourceUpdatedDate && row.resourceUpdatedDate.trim()) {
      resource.resourceUpdatedDate = row.resourceUpdatedDate;
    }

    // Process tags by name
    if (row.tags && row.tags.trim()) {
      const tagNames = row.tags.split(",").map((tagName) => tagName.trim());
      const tagIds = [];

      tagNames.forEach((tagName) => {
        const tag = findTagByName(tagName);
        if (tag) {
          tagIds.push(tag.id);
        }
      });

      if (tagIds.length > 0) {
        resource.tags = tagIds;
      }
    }

    if (row.timestamps && row.timestamps.trim()) {
      resource.timestamps = row.timestamps.trim();
    }

    if (row.fullText && row.fullText.trim()) {
      resource.fullText = row.fullText.trim();
    }

    if (row.imageKey && row.imageKey.trim()) {
      resource.imageKey = row.imageKey.trim();
    }

    if (row.featured && row.featured.trim().toLowerCase() === "true") {
      resource.featured = true;
    }

    return resource;
  };

  // Import resources using backend TSV import service
  const handleImport = async () => {
    if (validationErrors.length > 0) {
      toast.error("Please fix validation errors before importing");
      return;
    }

    if (!previewData) {
      toast.error("No preview data available. Please re-upload the file.");
      return;
    }

    setImporting(true);
    setCurrentStep("importing");

    try {
      const token = await getToken();
      const tenantId =
        selectedTenant?.id ||
        selectedTenants[0]?.id ||
        process.env.NEXT_PUBLIC_COMMUNITY_TENANT;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/import/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            importData: previewData,
            tenantId: tenantId,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();

        // Transform backend results to match frontend format
        const importResults = {
          successful:
            result.summary.organizationsCreated +
            result.summary.resourcesCreated,
          failed: result.summary.errors,
          errors: result.results.errors || [],
          organizationsCreated: result.summary.organizationsCreated,
          organizationsSkipped: result.summary.organizationsSkipped,
          resourcesCreated: result.summary.resourcesCreated,
          resourcesSkipped: result.summary.resourcesSkipped,
          tagsCreated: result.summary.tagsCreated,
          tagsReused: result.summary.tagsReused,
        };

        setImportResults(importResults);
        setImporting(false);
        setCurrentStep("complete");

        if (importResults.organizationsCreated > 0) {
          toast.success(
            `Created ${importResults.organizationsCreated} new organizations`
          );
        }

        if (importResults.resourcesCreated > 0) {
          toast.success(
            `Successfully imported ${importResults.resourcesCreated} resources`
          );
        }

        if (importResults.failed > 0) {
          toast.error(`Failed to import ${importResults.failed} items`);
        }

      } else {
        const error = await response.json();
        console.error("Import error:", error);

        // Handle authorization errors specifically
        if (response.status === 401 || response.status === 403) {
          toast.error(
            "Authorization error: Please check your permissions for the selected tenant"
          );
        } else {
          toast.error(
            "Failed to import: " + (error.message || "Unknown error")
          );
        }

        setImportResults({
          successful: 0,
          failed: parsedData.length,
          errors: [{ row: 0, error: error.message || "Import failed" }],
        });
        setImporting(false);
        setCurrentStep("complete");
      }
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import: " + error.message);

      setImportResults({
        successful: 0,
        failed: parsedData.length,
        errors: [{ row: 0, error: error.message }],
      });
      setImporting(false);
      setCurrentStep("complete");
    }
  };

  const togglePreviewResourceSelection = (index) => {
    setSelectedPreviewResources((prev) => {
      const next = new Set(prev);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  };

  const toggleSelectAllPreviewResources = () => {
    if (!previewData?.resources?.length) {
      return;
    }

    setSelectedPreviewResources((prev) => {
      if (prev.size === previewData.resources.length) {
        return new Set();
      }

      return new Set(previewData.resources.map((_, index) => index));
    });
  };

  const updatePreviewResourceOrganizations = (mode, organizationName = "") => {
    if (!previewData?.resources?.length) {
      return;
    }

    const targetIndexes =
      mode === "all"
        ? new Set(previewData.resources.map((_, index) => index))
        : selectedPreviewResources;

    if (targetIndexes.size === 0) {
      toast.error("Select at least one resource first");
      return;
    }

    if (organizationName === null || organizationName === undefined) {
      organizationName = "";
    }

    if (!organizationName && mode !== "clear") {
      toast.error("Select an organization to apply");
      return;
    }

    setPreviewData((prev) => {
      if (!prev) return prev;

      return normalizePreviewImportData({
        ...prev,
        resources: prev.resources.map((resource, index) =>
          targetIndexes.has(index)
            ? {
                ...resource,
                organizationName: organizationName || null,
              }
            : resource
        ),
      });
    });

    const affectedCount = targetIndexes.size;

    if (organizationName) {
      toast.success(
        `Assigned ${organizationName} to ${affectedCount} resource${
          affectedCount === 1 ? "" : "s"
        }`
      );
    } else {
      toast.success(
        `Cleared organization assignment for ${affectedCount} resource${
          affectedCount === 1 ? "" : "s"
        }`
      );
    }
  };

  const handleBackfillResourceEmbeddings = async () => {
    if (!selectedTenant?.id) {
      toast.error("Select a tenant first");
      return;
    }

    setBackfillingEmbeddings(true);

    try {
      const headers = await getAuthHeader();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/import/resource-embeddings/backfill`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            tenantId: selectedTenant.id,
            forceAll: true,
          }),
        }
      );

      const result = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));

      if (!response.ok) {
        throw new Error(result.message || "Failed to queue embedding backfill");
      }

      toast.success(
        result.message ||
          `Queued ${result.queuedCount || 0} resource embedding updates. Search may take a few minutes to refresh.`
      );
      setEmbeddingBackfillStatus(result.status || null);
    } catch (error) {
      console.error("Backfill embeddings error:", error);
      toast.error(error.message || "Failed to queue embedding backfill");
    } finally {
      setBackfillingEmbeddings(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">
            Bulk Import Resources
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <div className="p-6">
          {/* Step 1: Upload */}
          {currentStep === "upload" && (
            <div className="space-y-6">
              <div className="text-center">
                <FaFileAlt className="mx-auto text-6xl text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Upload Import File
                </h3>
                <p className="text-gray-600 mb-6">
                  Upload a CSV, TSV, or Excel file containing your resources
                  data
                </p>
              </div>

              {/* Tenant Selection */}
              {selectedTenants && selectedTenants.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-blue-900 mb-2">
                    Select Tenant for Import
                  </label>
                  <select
                    value={selectedTenant?.id || ""}
                    onChange={(e) => {
                      const tenant = selectedTenants.find(
                        (t) => t.id === e.target.value
                      );
                      setSelectedTenant(tenant);
                    }}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {selectedTenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>
                        {tenant.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs text-blue-700">
                    Resources will be imported to this tenant. Organizations
                    will be filtered based on tenant selection.
                  </p>

                  {canBackfillTenantEmbeddings && (
                    <div className="mt-4 rounded-lg border border-blue-200 bg-white/80 p-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            Backfill Resource Search Embeddings
                          </p>
                          <p className="mt-1 text-xs text-blue-700">
                            Rebuild semantic search embeddings for resources in
                            this tenant. Search results may take a few minutes
                            to refresh.
                          </p>
                          {embeddingBackfillSummary && (
                            <div
                              className={`mt-2 rounded-md px-3 py-2 text-xs ${
                                embeddingBackfillSummary.tone === "green"
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : embeddingBackfillSummary.tone === "red"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : embeddingBackfillSummary.tone === "amber"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                            >
                              {embeddingBackfillSummary.text}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleBackfillResourceEmbeddings}
                          disabled={backfillingEmbeddings || !selectedTenant?.id}
                          className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-blue-200 disabled:bg-blue-300"
                        >
                          {backfillingEmbeddings ? (
                            <>
                              <FaSpinner className="mr-2 animate-spin" />
                              Queuing...
                            </>
                          ) : (
                            "Backfill Embeddings"
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Download Template Button */}
              <div className="flex justify-center mb-6">
                <button
                  onClick={generateSampleCSV}
                  className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 transition-colors font-medium"
                >
                  <FaDownload className="mr-2" />
                  Download CSV Template
                </button>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-blue-200 bg-blue-50/30 rounded-lg p-8 text-center hover:border-blue-300 hover:bg-blue-50/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FaUpload className="mx-auto text-4xl text-blue-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop CSV, TSV, or Excel file here or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
                >
                  Select File
                </button>
              </div>

              {/* Required and Optional Columns Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Required Columns:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700 mb-3">
                  {requiredColumns.map((column) => (
                    <div key={column} className="font-mono">
                      • {column}
                    </div>
                  ))}
                </div>

                <h4 className="font-semibold text-blue-800 mb-2 mt-4">
                  Optional Columns:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-600">
                  <div className="font-mono">• organizations</div>
                  <div className="font-mono">• organizationAcronyms</div>
                  <div className="font-mono">• organizationCategories</div>
                  <div className="font-mono">• sensitivityLevel</div>
                  <div className="font-mono">• expertiseLevel</div>
                  <div className="font-mono">• targetAudience</div>
                  <div className="font-mono">• videoUrl</div>
                  <div className="font-mono">• tags</div>
                  <div className="font-mono">• timestamps</div>
                  <div className="font-mono">• fullText</div>
                  <div className="font-mono">• featured</div>
                </div>
              </div>

              {/* Organization Handling Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">
                  <FaBuilding className="inline mr-2" />
                  Organization Mapping:
                </h4>
                <div className="text-sm text-green-700 space-y-1">
                  <div>
                    • Use organization names (e.g., &quot;NAMI, American Cancer
                    Society&quot;)
                  </div>
                  <div>
                    • Organization acronyms can be provided in a separate column
                  </div>
                  <div>
                    • Organization categories can be provided in a separate
                    column
                  </div>
                  <div>
                    • Fuzzy matching supported for abbreviations and acronyms
                  </div>
                  <div>
                    • Only existing organizations in the selected tenant will be
                    linked
                  </div>
                  {forcedOrganizationId && (
                    <div className="mt-2 font-medium">
                      • <strong>Note:</strong> All imported resources will
                      automatically include the selected organization
                    </div>
                  )}
                </div>
              </div>

              {/* Data Format Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-800 mb-2">
                  Data Format Guidelines:
                </h4>
                <div className="text-sm text-amber-700 space-y-1">
                  <div>
                    • <strong>TSV Format:</strong> Organization, Service, Link,
                    Description columns
                  </div>
                  <div>
                    • <strong>Organization Column:</strong> Name of organization
                    (will be created if doesn&apos;t exist)
                  </div>
                  <div>
                    • <strong>Service Column:</strong> Services/tags as
                    comma-separated values
                  </div>
                  <div>
                    • <strong>Link Column:</strong> Resource URL
                  </div>
                  <div>
                    • <strong>Additional columns:</strong> Email, Phone number,
                    Demographics, Accessibility
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview & Validation */}
          {currentStep === "preview" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Preview Data ({parsedData.length} rows)
                </h3>
                <button
                  onClick={() => setCurrentStep("upload")}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Upload Different File
                </button>
              </div>

              {/* Preview Summary from Backend */}
              {previewData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">
                    Import Preview Summary:
                  </h4>
                  <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-blue-600">
                        Organizations to create:
                      </span>
                      <span className="ml-2 font-semibold text-blue-900">
                        {previewData.organizations?.length || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-600">
                        Resources to create:
                      </span>
                      <span className="ml-2 font-semibold text-blue-900">
                        {previewData.resources?.length || 0}
                      </span>
                    </div>
                    <div>
                      <span className="text-blue-600">Unique tags found:</span>
                      <span className="ml-2 font-semibold text-blue-900">
                        {previewData.tags?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Display tags that will be processed */}
                  {previewData.tags && previewData.tags.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs font-semibold text-blue-800 mb-2">
                        Tags to be processed:
                      </p>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {previewData.tags.slice(0, 50).map((tag, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-white text-blue-700 border border-blue-300 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {previewData.tags.length > 50 && (
                          <span className="text-xs px-2 py-1 text-blue-600 italic">
                            +{previewData.tags.length - 50} more...
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {previewData.organizations &&
                    previewData.organizations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs text-blue-700">
                          <FaBuilding className="inline mr-1" />
                          The import will automatically create new organizations
                          and link resources to them.
                        </p>
                      </div>
                    )}
                </div>
              )}

              {previewData?.resources?.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Bulk Assign Organizations
                      </h4>
                      <p className="text-sm text-gray-600">
                        Select specific resources or use select all, then apply
                        one organization in a single action.
                      </p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {selectedPreviewResources.size} of{" "}
                      {previewData.resources.length} selected
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                    <select
                      value={bulkOrganizationName}
                      onChange={(e) => setBulkOrganizationName(e.target.value)}
                      className="w-full lg:max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select organization...</option>
                      {bulkAssignmentOrganizations.map((organizationName) => (
                        <option
                          key={organizationName}
                          value={organizationName}
                        >
                          {organizationName}
                        </option>
                      ))}
                    </select>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          updatePreviewResourceOrganizations(
                            "selected",
                            bulkOrganizationName
                          )
                        }
                        disabled={
                          !bulkOrganizationName ||
                          selectedPreviewResources.size === 0
                        }
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply to Selected
                      </button>
                      <button
                        onClick={() =>
                          updatePreviewResourceOrganizations(
                            "all",
                            bulkOrganizationName
                          )
                        }
                        disabled={
                          !bulkOrganizationName ||
                          !previewData.resources.length
                        }
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Apply to All
                      </button>
                      <button
                        onClick={() =>
                          updatePreviewResourceOrganizations("clear", "")
                        }
                        disabled={selectedPreviewResources.size === 0}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        Clear Selected
                      </button>
                    </div>
                  </div>

                  {bulkAssignmentOrganizations.length === 0 && (
                    <p className="mt-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                      No organizations are currently available in this tenant
                      for bulk assignment.
                    </p>
                  )}

                  <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-80 overflow-auto">
                      <table className="w-full min-w-[960px] table-fixed text-sm">
                        <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                          <tr>
                            <th className="w-14 px-4 py-3 text-left">
                              <input
                                type="checkbox"
                                checked={areAllPreviewResourcesSelected}
                                onChange={toggleSelectAllPreviewResources}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </th>
                            <th className="w-[42%] px-4 py-3 text-left font-medium text-gray-700">
                              Resource
                            </th>
                            <th className="w-[22%] px-4 py-3 text-left font-medium text-gray-700">
                              Current Organization
                            </th>
                            <th className="w-[36%] px-4 py-3 text-left font-medium text-gray-700">
                              URL
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {previewData.resources.map((resource, index) => (
                            <tr
                              key={`${resource.name}-${index}`}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={selectedPreviewResources.has(index)}
                                  onChange={() =>
                                    togglePreviewResourceSelection(index)
                                  }
                                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-4 py-3 align-top">
                                <div className="font-medium text-gray-900 break-words line-clamp-2">
                                  {stripHtmlPreviewText(resource.name) ||
                                    "Untitled Resource"}
                                </div>
                                {resource.description && (
                                  <div className="text-xs text-gray-500 mt-1 break-words line-clamp-3 leading-5">
                                    {stripHtmlPreviewText(resource.description)}
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 align-top">
                                <span
                                  className={`inline-flex max-w-full items-center px-2.5 py-1 rounded-full text-xs font-medium break-words whitespace-normal ${
                                    resource.organizationName
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : "bg-gray-100 text-gray-600 border border-gray-200"
                                  }`}
                                >
                                  {resource.organizationName || "Unassigned"}
                                </span>
                              </td>
                              <td className="px-4 py-3 align-top text-gray-600">
                                <div className="break-all line-clamp-3 leading-5">
                                  {resource.url || "No URL"}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <FaExclamationTriangle className="text-red-500 mr-2" />
                    <h4 className="font-semibold text-red-800">
                      Validation Errors ({validationErrors.length} rows)
                    </h4>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {validationErrors.map((error, index) => (
                      <div
                        key={index}
                        className="rounded-md border border-red-200 bg-white/70 px-3 py-2 text-sm text-red-700"
                      >
                        <strong>Row {error.row}:</strong>
                        <div className="mt-1 break-words">
                          {error.errors.join(", ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <h4 className="font-semibold text-gray-900">
                    Source File Preview
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    First 5 rows from the uploaded file, showing populated
                    columns only.
                  </p>
                </div>

                <div className="max-h-[28rem] overflow-y-auto divide-y divide-gray-200">
                  {parsedData.slice(0, 5).map((row, index) => {
                    const previewEntries = getSourcePreviewEntries(row, index);
                    const resourceLabel =
                      stripHtmlPreviewText(
                        row["Resource Name"] || row.name || row.Organization
                      ) || `Row ${index + 2}`;
                    const assignedOrganizationName =
                      getAssignedPreviewOrganizationName(index);

                    return (
                      <div key={index} className="bg-white p-4">
                        <div className="flex flex-col gap-2 border-b border-gray-100 pb-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
                              Row {index + 2}
                            </p>
                            <h5 className="mt-1 text-base font-semibold text-gray-900 break-words">
                              {resourceLabel}
                            </h5>
                          </div>
                          <span
                            className={`inline-flex max-w-full items-center rounded-full px-3 py-1 text-xs font-medium break-words whitespace-normal ${
                              assignedOrganizationName
                                ? "border border-blue-200 bg-blue-50 text-blue-700"
                                : "border border-gray-200 bg-gray-100 text-gray-600"
                            }`}
                          >
                            {assignedOrganizationName || "Unassigned"}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {previewEntries.map(([key, value]) => (
                            <div
                              key={key}
                              className={
                                isWidePreviewField(key)
                                  ? "md:col-span-2 xl:col-span-3"
                                  : ""
                              }
                            >
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                {formatPreviewFieldLabel(key)}
                              </p>
                              <div
                                className={`mt-1 text-sm text-gray-700 ${
                                  key === "url" || key === "Link"
                                    ? "break-all"
                                    : "break-words"
                                }`}
                              >
                                {key === "description" ||
                                key === "Description" ||
                                key === "name" ||
                                key === "Resource Name"
                                  ? stripHtmlPreviewText(String(value))
                                  : String(value)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {parsedData.length > 5 && (
                  <div className="p-2 bg-blue-50 text-center text-sm text-blue-700 border-t border-blue-200">
                    Showing first 5 rows of {parsedData.length} total rows
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={validationErrors.length > 0}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    validationErrors.length > 0
                      ? "bg-gray-400 cursor-not-allowed text-gray-200"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                  }`}
                >
                  <FaCheck className="w-4 h-4" />
                  Import {previewData?.resources?.length ||
                    parsedData.length}{" "}
                  Resource
                  {(previewData?.resources?.length || parsedData.length) !== 1
                    ? "s"
                    : ""}
                  {previewData?.organizations?.length > 0 &&
                    ` & Create ${previewData.organizations.length} Org${
                      previewData.organizations.length !== 1 ? "s" : ""
                    }`}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Importing */}
          {currentStep === "importing" && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
                <FaSpinner className="animate-spin text-4xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Importing Resources...
              </h3>
              <p className="text-gray-600">
                Please wait while we process your data
              </p>
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                  <div
                    className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Complete */}
          {currentStep === "complete" && importResults && (
            <div className="text-center py-8">
              <div className="mb-6">
                {importResults.organizationsCreated > 0 && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mr-4">
                      <FaBuilding className="text-2xl text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-gray-900">
                        {importResults.organizationsCreated}
                      </div>
                      <div className="text-gray-600">Organizations Created</div>
                    </div>
                  </div>
                )}

                {importResults.resourcesCreated > 0 && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mr-4">
                      <FaCheck className="text-2xl text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-gray-900">
                        {importResults.resourcesCreated}
                      </div>
                      <div className="text-gray-600">
                        Resources Imported Successfully
                      </div>
                    </div>
                  </div>
                )}

                {importResults.failed > 0 && (
                  <div className="flex items-center justify-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mr-4">
                      <FaExclamationTriangle className="text-2xl text-red-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-gray-900">
                        {importResults.failed}
                      </div>
                      <div className="text-gray-600">
                        Resources Failed to Import
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {canBackfillTenantEmbeddings && (
                <div className="mx-auto mb-6 max-w-2xl rounded-lg border border-blue-200 bg-blue-50 p-4 text-left">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className="font-semibold text-blue-900">
                        Refresh Search Embeddings
                      </h4>
                      <p className="mt-1 text-sm text-blue-700">
                        If older imports may have missed semantic indexing, queue
                        a tenant-wide backfill from here.
                      </p>
                      {embeddingBackfillSummary && (
                        <div
                          className={`mt-3 rounded-md px-3 py-2 text-xs ${
                            embeddingBackfillSummary.tone === "green"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : embeddingBackfillSummary.tone === "red"
                                ? "bg-red-50 text-red-700 border border-red-200"
                                : embeddingBackfillSummary.tone === "amber"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-blue-50 text-blue-700 border border-blue-200"
                          }`}
                        >
                          {embeddingBackfillSummary.text}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleBackfillResourceEmbeddings}
                      disabled={backfillingEmbeddings || !selectedTenant?.id}
                      className="inline-flex items-center justify-center rounded-lg border border-blue-300 bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:border-blue-200 disabled:bg-blue-300"
                    >
                      {backfillingEmbeddings ? (
                        <>
                          <FaSpinner className="mr-2 animate-spin" />
                          Queuing...
                        </>
                      ) : (
                        "Backfill Embeddings"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Error Details */}
              {importResults.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <h4 className="font-semibold text-red-800 mb-2">
                    Import Errors:
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {importResults.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        <strong>Row {error.row}:</strong> {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Organizations Found */}
              {importResults.newOrganizationsFound &&
                importResults.newOrganizationsFound.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
                    <h4 className="font-semibold text-amber-800 mb-2">
                      <FaBuilding className="inline mr-2" />
                      Missing Organizations (
                      {importResults.newOrganizationsFound.length}):
                    </h4>
                    <p className="text-sm text-amber-700 mb-3">
                      These organizations were referenced in your import but
                      don&apos;t exist yet. Resources were imported without
                      these organization links.
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {importResults.newOrganizationsFound.map((org, index) => (
                        <div key={index} className="text-sm text-amber-700">
                          • <strong>{org.name}</strong>
                          {org.acronym && ` (${org.acronym})`}
                          {org.category && ` - ${org.category}`}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-600 mt-3 font-medium">
                      💡 Tip: Create these organizations and then update the
                      resources to link them.
                    </p>
                  </div>
                )}

              <button
                onClick={onClose}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ResourceBulkImport;
