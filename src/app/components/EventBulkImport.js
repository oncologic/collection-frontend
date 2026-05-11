import React, { useState, useRef } from "react";
import {
  FaUpload,
  FaDownload,
  FaCheck,
  FaExclamationTriangle,
  FaSpinner,
  FaFileAlt,
  FaTimes,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import Papa from "papaparse";
import { useContextAuth } from "../context/authContext";
import { useBulkCreateEvents } from "../hooks/useEvents";

const EventBulkImport = ({
  onClose,
  eventTypes = [],
  organizations = [],
  tags = [],
}) => {
  const [csvFile, setCsvFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [currentStep, setCurrentStep] = useState("upload"); // upload, preview, importing, complete

  const fileInputRef = useRef(null);
  const { selectedTenants } = useContextAuth();
  const { mutateAsync: bulkCreateEventsMutation } = useBulkCreateEvents();

  // Required columns for validation
  const requiredColumns = [
    "title",
    "description",
    "startDate",
    "endDate",
    "eventTypeId",
  ];

  // Generate sample CSV for download
  const generateSampleCSV = () => {
    const sampleData = [
      {
        title: "Annual Kidney Cancer Awareness Walk",
        description:
          "Join us for our annual 5K walk to raise awareness and funds for kidney cancer research",
        startDate: "2024-05-15",
        endDate: "2024-05-15",
        eventTypeId: "1",
        organizations: "1,2",
        tenantId: "",
        registrationRequired: "true",
        registrationUrl: "https://example.com/register",
        maxAttendees: "200",
        locationName: "Central Park",
        locationAddress: "59th to 110th Street",
        locationCity: "New York",
        locationState: "NY",
        locationZip: "10019",
        locationCountry: "USA",
        timeStart: "09:00",
        timeEnd: "12:00",
        timezone: "America/New_York",
        virtualEventUrl: "",
        eventUrl: "https://example.com/event",
        featuredSpeakers: "Dr. Jane Smith, Dr. John Doe",
        tags: "1,3,5",
        imageKey: "",
      },
      {
        title: "Virtual Support Group Meeting",
        description:
          "Monthly virtual support group for cancer patients and caregivers",
        startDate: "2024-05-20",
        endDate: "2024-05-20",
        eventTypeId: "2",
        organizations: "3",
        tenantId: "tenant-123",
        registrationRequired: "false",
        registrationUrl: "",
        maxAttendees: "50",
        locationName: "Online",
        locationAddress: "",
        locationCity: "",
        locationState: "",
        locationZip: "",
        locationCountry: "",
        timeStart: "18:00",
        timeEnd: "19:30",
        timezone: "America/Chicago",
        virtualEventUrl: "https://zoom.us/j/123456789",
        eventUrl: "",
        featuredSpeakers: "",
        tags: "2,4",
        imageKey: "",
      },
    ];

    const csv = Papa.unparse(sampleData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "events_import_template.csv");
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      parseCSV(file);
    } else {
      toast.error("Please upload a valid CSV file");
    }
  };

  // Parse CSV file
  const parseCSV = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          toast.error("Error parsing CSV file");
          return;
        }

        setParsedData(results.data);
        validateData(results.data);
        setCurrentStep("preview");
      },
    });
  };

  // Validate parsed data
  const validateData = (data) => {
    const errors = [];

    data.forEach((row, index) => {
      const rowErrors = [];
      const rowNumber = index + 2; // +2 because of header row and 0-indexing

      // Check required columns
      requiredColumns.forEach((column) => {
        if (!row[column] || row[column].trim() === "") {
          rowErrors.push(`Missing required field: ${column}`);
        }
      });

      // Validate eventTypeId
      if (
        row.eventTypeId &&
        !eventTypes.find(
          (type) => type.id.toString() === row.eventTypeId.toString()
        )
      ) {
        rowErrors.push(`Invalid eventTypeId: ${row.eventTypeId}`);
      }

      // Validate date format
      if (row.startDate && !isValidDate(row.startDate)) {
        rowErrors.push(
          `Invalid start date format: ${row.startDate} (use YYYY-MM-DD)`
        );
      }

      if (row.endDate && !isValidDate(row.endDate)) {
        rowErrors.push(
          `Invalid end date format: ${row.endDate} (use YYYY-MM-DD)`
        );
      }

      // Validate that end date is not before start date
      if (
        row.startDate &&
        row.endDate &&
        isValidDate(row.startDate) &&
        isValidDate(row.endDate)
      ) {
        const startDate = new Date(row.startDate);
        const endDate = new Date(row.endDate);
        if (endDate < startDate) {
          rowErrors.push("End date cannot be before start date");
        }
      }

      // Validate URL formats
      if (
        row.registrationUrl &&
        row.registrationUrl.trim() &&
        !isValidURL(row.registrationUrl)
      ) {
        rowErrors.push(
          `Invalid registration URL format: ${row.registrationUrl}`
        );
      }

      if (
        row.virtualEventUrl &&
        row.virtualEventUrl.trim() &&
        !isValidURL(row.virtualEventUrl)
      ) {
        rowErrors.push(
          `Invalid virtual event URL format: ${row.virtualEventUrl}`
        );
      }

      if (row.eventUrl && row.eventUrl.trim() && !isValidURL(row.eventUrl)) {
        rowErrors.push(`Invalid event URL format: ${row.eventUrl}`);
      }

      // Validate organizations (should be comma-separated IDs or JSON array) - only if provided
      if (row.organizations && row.organizations.trim()) {
        let orgIds = [];

        // Check if it's a JSON array
        if (row.organizations.trim().startsWith("[")) {
          try {
            orgIds = JSON.parse(row.organizations);
          } catch (e) {
            rowErrors.push(
              `Invalid organizations format: ${row.organizations} (use comma-separated IDs or valid JSON array)`
            );
          }
        } else {
          // Treat as comma-separated
          orgIds = row.organizations.split(",").map((id) => id.trim());
        }

        orgIds.forEach((orgId) => {
          if (
            orgId &&
            !organizations.find(
              (org) =>
                org.id === orgId || org.id.toString() === orgId.toString()
            )
          ) {
            rowErrors.push(`Invalid organization ID: ${orgId}`);
          }
        });
      }

      // Validate tags (should be comma-separated IDs or JSON array) - only if provided
      if (row.tags && row.tags.trim()) {
        let tagIds = [];

        // Check if it's a JSON array
        if (row.tags.trim().startsWith("[")) {
          try {
            tagIds = JSON.parse(row.tags);
          } catch (e) {
            rowErrors.push(
              `Invalid tags format: ${row.tags} (use comma-separated IDs or valid JSON array)`
            );
          }
        } else {
          // Treat as comma-separated
          tagIds = row.tags.split(",").map((id) => id.trim());
        }

        tagIds.forEach((tagId) => {
          if (
            tagId &&
            !tags.find(
              (tag) =>
                tag.id === tagId || tag.id.toString() === tagId.toString()
            )
          ) {
            rowErrors.push(`Invalid tag ID: ${tagId}`);
          }
        });
      }

      // Validate tenantId if provided
      if (row.tenantId && row.tenantId.trim()) {
        const tenantExists = selectedTenants?.find(
          (tenant) => tenant.id === row.tenantId.trim()
        );
        if (!tenantExists) {
          rowErrors.push(
            `Invalid tenant ID: ${row.tenantId} (you don't have access to this tenant)`
          );
        }
      }

      // Validate time format (HH:MM)
      if (
        row.timeStart &&
        row.timeStart.trim() &&
        !isValidTime(row.timeStart)
      ) {
        rowErrors.push(
          `Invalid start time format: ${row.timeStart} (use HH:MM)`
        );
      }

      if (row.timeEnd && row.timeEnd.trim() && !isValidTime(row.timeEnd)) {
        rowErrors.push(`Invalid end time format: ${row.timeEnd} (use HH:MM)`);
      }

      // Validate maxAttendees is a positive number
      if (row.maxAttendees && row.maxAttendees.trim()) {
        const maxAttendees = parseInt(row.maxAttendees);
        if (isNaN(maxAttendees) || maxAttendees <= 0) {
          rowErrors.push(
            `Invalid maxAttendees: ${row.maxAttendees} (must be a positive number)`
          );
        }
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          errors: rowErrors,
        });
      }
    });

    setValidationErrors(errors);
  };

  // Helper validation functions
  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const isValidTime = (timeString) => {
    const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return regex.test(timeString);
  };

  const isValidURL = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  // Transform CSV row to event object
  const transformRowToEvent = (row) => {
    // Determine tenant ID with fallback logic
    let tenantId = "";
    if (row.tenantId && row.tenantId.trim()) {
      // Use specified tenant ID if provided and valid
      tenantId = row.tenantId.trim();
    } else if (selectedTenants?.[0]?.id) {
      // Use first selected tenant if available
      tenantId = selectedTenants[0].id;
    } else {
      // Fall back to community tenant
      tenantId = process.env.NEXT_PUBLIC_COMMUNITY_TENANT || "";
    }

    // Handle organizations - can be JSON array or comma-separated
    let orgIds = [];
    if (row.organizations && row.organizations.trim()) {
      if (row.organizations.trim().startsWith("[")) {
        try {
          orgIds = JSON.parse(row.organizations);
        } catch (e) {
          console.error("Failed to parse organizations JSON:", e);
        }
      } else {
        orgIds = row.organizations.split(",").map((id) => id.trim());
      }
    }

    // Combine date and time for startTime and endTime
    let startDateTime = row.startDate;
    let endDateTime = row.endDate;

    // If we have separate time fields, combine them with the date
    if (row.timeStart && row.timeStart.trim()) {
      startDateTime = `${row.startDate}T${row.timeStart}:00`;
    } else {
      // Default to start of day if no time specified
      startDateTime = `${row.startDate}T00:00:00`;
    }

    if (row.timeEnd && row.timeEnd.trim()) {
      endDateTime = `${row.endDate}T${row.timeEnd}:00`;
    } else {
      // Default to end of day if no time specified
      endDateTime = `${row.endDate}T23:59:59`;
    }

    const event = {
      title: row.title.trim(),
      description: row.description.trim(),
      startTime: startDateTime,
      endTime: endDateTime,
      typeId: parseInt(row.eventTypeId),
      organizations: orgIds,
      tenantId: tenantId,
      registrationRequired: row.registrationRequired?.toLowerCase() === "true",
    };

    // Add optional fields if they exist
    if (row.registrationUrl && row.registrationUrl.trim()) {
      event.registrationUrl = row.registrationUrl.trim();
    }

    if (row.maxAttendees && row.maxAttendees.trim()) {
      event.maxAttendees = parseInt(row.maxAttendees);
    }

    if (row.locationName && row.locationName.trim()) {
      event.locationName = row.locationName.trim();
    }

    if (row.locationAddress && row.locationAddress.trim()) {
      event.locationAddress = row.locationAddress.trim();
    }

    if (row.locationCity && row.locationCity.trim()) {
      event.locationCity = row.locationCity.trim();
    }

    if (row.locationState && row.locationState.trim()) {
      event.locationState = row.locationState.trim();
    }

    if (row.locationZip && row.locationZip.trim()) {
      event.locationZip = row.locationZip.trim();
    }

    if (row.locationCountry && row.locationCountry.trim()) {
      event.locationCountry = row.locationCountry.trim();
    }

    // Still include the separate time fields if needed by backend
    if (row.timeStart && row.timeStart.trim()) {
      event.timeStart = row.timeStart.trim();
    }

    if (row.timeEnd && row.timeEnd.trim()) {
      event.timeEnd = row.timeEnd.trim();
    }

    if (row.timezone && row.timezone.trim()) {
      event.timezone = row.timezone.trim();
    }

    if (row.virtualEventUrl && row.virtualEventUrl.trim()) {
      event.virtualEventUrl = row.virtualEventUrl.trim();
    }

    if (row.eventUrl && row.eventUrl.trim()) {
      event.eventUrl = row.eventUrl.trim();
    }

    if (row.featuredSpeakers && row.featuredSpeakers.trim()) {
      event.featuredSpeakers = row.featuredSpeakers.trim();
    }

    if (row.tags && row.tags.trim()) {
      // Handle tags - can be JSON array or comma-separated
      let tagIds = [];
      if (row.tags.trim().startsWith("[")) {
        try {
          tagIds = JSON.parse(row.tags);
        } catch (e) {
          console.error("Failed to parse tags JSON:", e);
        }
      } else {
        tagIds = row.tags.split(",").map((id) => id.trim());
      }
      event.tags = tagIds;
    }

    if (row.imageKey && row.imageKey.trim()) {
      event.imageKey = row.imageKey.trim();
    }

    return event;
  };

  // Import events
  const handleImport = async () => {
    if (validationErrors.length > 0) {
      toast.error("Please fix validation errors before importing");
      return;
    }

    setImporting(true);
    setCurrentStep("importing");

    const events = parsedData.map(transformRowToEvent);

    try {
      const result = await bulkCreateEventsMutation(events);

      setImportResults(result.results);
      setImporting(false);
      setCurrentStep("complete");

      if (result.results.successful > 0) {
        toast.success(
          `Successfully imported ${result.results.successful} events`
        );
      }

      if (result.results.failed > 0) {
        toast.error(`Failed to import ${result.results.failed} events`);
      }
    } catch (error) {
      setImporting(false);
      toast.error(error.message || "Failed to import events");
      console.error("Error importing events:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">
            Bulk Import Events
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
                <h3 className="text-lg font-semibold mb-2">Upload CSV File</h3>
                <p className="text-gray-600 mb-6">
                  Upload a CSV file containing your events data
                </p>
              </div>

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
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FaUpload className="mx-auto text-4xl text-blue-400 mb-4" />
                <p className="text-lg font-medium text-gray-700 mb-2">
                  Drop CSV file here or click to browse
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
                >
                  Select File
                </button>
              </div>

              {/* Required Columns Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">
                  Required Columns:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700">
                  {requiredColumns.map((column) => (
                    <div key={column} className="font-mono">
                      • {column}
                    </div>
                  ))}
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

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <FaExclamationTriangle className="text-red-500 mr-2" />
                    <h4 className="font-semibold text-red-800">
                      Validation Errors ({validationErrors.length} rows)
                    </h4>
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="text-sm text-red-700">
                        <strong>Row {error.row}:</strong>{" "}
                        {error.errors.join(", ")}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Preview */}
              <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="max-h-64 overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0 border-b border-gray-200">
                      <tr>
                        {parsedData.length > 0 &&
                          Object.keys(parsedData[0]).map((key) => (
                            <th
                              key={key}
                              className="px-4 py-2 text-left font-medium text-gray-700"
                            >
                              {key}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {parsedData.slice(0, 5).map((row, index) => (
                        <tr
                          key={index}
                          className="border-b border-gray-100 hover:bg-gray-50"
                        >
                          {Object.values(row).map((value, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-4 py-2 text-gray-600 max-w-xs truncate"
                            >
                              {value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                  Import {parsedData.length} Events
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
                Importing Events...
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
                {importResults.successful > 0 && (
                  <div className="flex items-center justify-center mb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mr-4">
                      <FaCheck className="text-2xl text-green-600" />
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-gray-900">
                        {importResults.successful}
                      </div>
                      <div className="text-gray-600">
                        Events Imported Successfully
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
                        Events Failed to Import
                      </div>
                    </div>
                  </div>
                )}
              </div>

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

export default EventBulkImport;
