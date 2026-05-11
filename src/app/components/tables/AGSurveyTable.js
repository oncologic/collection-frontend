"use client";
import React, { useState, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Define custom theme with midnight colors
const customTheme = themeQuartz.withParams(
  {
    backgroundColor: "#ffffff",
    foregroundColor: "#374151", // gray-700 for good readability
    borderColor: "#e5e7eb", // gray-200 for subtle borders
    accentColor: "#6366f1", // indigo-500
    headerBackgroundColor: "#f9fafb", // gray-50
    rowHoverColor: "#f3f4f6", // gray-100
    selectedRowBackgroundColor: "#e5e7eb", // gray-200
    browserColorScheme: "light",
  },
  "light-mode"
);

export default function SurveyTableTwo({
  columns: userColumns,
  data,
  onFilteredDataChange,
  isDarkMode = true, // Add dark mode prop with default value
}) {
  const [gridApi, setGridApi] = useState(null);
  const [popupContent, setPopupContent] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  // Set theme mode based on prop
  React.useEffect(() => {
    document.body.dataset.agThemeMode = isDarkMode ? "dark-mode" : "light-mode";
  }, [isDarkMode]);

  // Simplified column definitions
  const columnDefs = userColumns.map((col) => ({
    field: col.accessorKey,
    headerName: col.header,
    sortable: true,
    filter: true,
    minWidth: 150,
    flex: 1,
    valueGetter: (params) => {
      const value = params.data[col.accessorKey];
      if (value === null || value === undefined) return "";

      // Handle arrays of objects
      if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (typeof item === "object") {
              return Object.entries(item)
                .map(([key, val]) => {
                  const formattedKey = key.replace(/([A-Z])/g, " $1").trim();
                  const formattedVal = Array.isArray(val)
                    ? val.join(", ")
                    : val;
                  return `${formattedKey}: ${formattedVal}`;
                })
                .join(" | ");
            }
            return item;
          })
          .join(" | "); // Changed from \n to | for horizontal layout
      }

      // Handle single objects
      if (typeof value === "object" && value !== null) {
        return Object.entries(value)
          .map(([key, val]) => {
            const formattedKey = key.replace(/([A-Z])/g, " $1").trim();
            const formattedVal = Array.isArray(val) ? val.join(", ") : val;
            return `${formattedKey}: ${formattedVal}`;
          })
          .join(" | "); // Changed from \n to | for horizontal layout
      }

      return value;
    },
    filterParams: {
      filterOptions: [
        "equals",
        "notEqual",
        "contains",
        "notContains",
        "startsWith",
        "endsWith",
        {
          displayKey: "blanks",
          displayName: "Blanks",
          predicate: (_, cellValue) => cellValue == null,
          numberOfInputs: 0,
        },
        {
          displayKey: "notBlanks",
          displayName: "Not Blank",
          predicate: (_, cellValue) => cellValue !== null && cellValue !== "",
          numberOfInputs: 0,
        },
      ],
      buttons: ["clear"],
      textCustomComparator: function (filter, value, filterText) {
        if (value === null || value === undefined) return false;
        const stringValue = String(value);
        return stringValue.toLowerCase().indexOf(filterText.toLowerCase()) >= 0;
      },
    },
  }));

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 150,
  };

  const onGridReady = (params) => {
    setGridApi(params.api);

    // Removed auto-sizing logic to prevent column squeezing
    // Only resize on window resize
    const updateColumnSize = () => {
      if (!params.api || !params.columnApi) return; // Add safety check

      const gridElement = document.querySelector(".ag-theme-alpine-dark");
      if (!gridElement) return; // Add safety check

      const gridWidth = gridElement.offsetWidth;
      const columnCount = params.columnApi.getAllColumns().length;
      const minColumnWidth = 150;

      // Only apply sizeColumnsToFit if we have enough space
      if (gridWidth / columnCount >= minColumnWidth) {
        params.api.sizeColumnsToFit();
      }
    };

    window.addEventListener("resize", updateColumnSize);
    // Initial sizing with longer delay to ensure grid is ready
    setTimeout(updateColumnSize, 300);

    // Cleanup resize listener
    return () => window.removeEventListener("resize", updateColumnSize);
  };

  // Handle filtered data changes
  const onFilterChanged = (params) => {
    const filteredData = [];
    params.api.forEachNodeAfterFilter((node) => {
      filteredData.push(node.data);
    });
    onFilteredDataChange(filteredData);
  };

  // Add search functionality
  const onSearchChange = useCallback(
    (e) => {
      if (gridApi) {
        gridApi.setGridOption("quickFilterText", e.target.value);
      }
    },
    [gridApi]
  );

  // Add cell click handler
  const onCellClicked = (params) => {
    const value = params.value;
    if (value) {
      setPopupContent(value);
      setShowPopup(true);
    }
  };

  // Add popup close handler
  const closePopup = () => {
    setShowPopup(false);
    setPopupContent(null);
  };

  return (
    <div className="w-full relative">
      <div className="mb-4">
        <input
          type="text"
          onChange={onSearchChange}
          placeholder="Search..."
          className="w-full border border-slate-300  text-slate-800 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-600"
        />
      </div>

      <div
        className="ag-theme-alpine-dark"
        style={{
          width: "100%",
          height: "600px",
          "--ag-background-color": "#ffffff",
          "--ag-header-background-color": "#f9fafb",
          "--ag-odd-row-background-color": "#f8fafc",
          "--ag-header-foreground-color": "#374151",
          "--ag-foreground-color": "#374151",
          "--ag-secondary-foreground-color": "#6b7280",
          "--ag-border-color": "#e5e7eb",
        }}
      >
        <AgGridReact
          theme={customTheme}
          rowData={data}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[5, 10, 20, 50]}
          onFilterChanged={onFilterChanged}
          onGridReady={onGridReady}
          enableCellTextSelection={true}
          suppressRowTransform={true}
          domLayout="normal"
          onCellClicked={onCellClicked}
        />
      </div>

      {/* Add Popup Modal */}
      {showPopup && (
        <div className="fixed inset-0 bg-gray-400      bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Details</h3>
              <button
                onClick={closePopup}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="text-gray-600 whitespace-pre-wrap">
              {typeof popupContent === "object"
                ? JSON.stringify(popupContent, null, 2)
                : String(popupContent)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
