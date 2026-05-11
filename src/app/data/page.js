// ExampleParent.js
"use client";
import React, { useMemo, useState, useEffect } from "react";
import SurveyTable from "../components/SurveyTable";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useFetchSurveyResponseBySurveyId } from "../hooks/useSurveys";
import AGSurveyTable, { GridExample } from "../components/tables/AGSurveyTable";
import DarkAGGridTable from "../components/tables/AGSurveyTable";
import SurveyTableTwo from "../components/tables/AGSurveyTable";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import LoadingSkeleton from "../components/LoadingSkeleton";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function DataPage() {
  const [filteredData, setFilteredData] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(new Set());

  const {
    data: surveyResponse,
    isLoading,
    error,
  } = useFetchSurveyResponseBySurveyId("936e530f-1927-4d33-af46-e395a34145b5");

  // Add useEffect to initialize filteredData when surveyResponse loads
  useEffect(() => {
    if (surveyResponse) {
      setFilteredData(surveyResponse);
    }
  }, [surveyResponse]);

  // 3) Columns with v8 syntax
  const columns = useMemo(() => {
    const data = surveyResponse;

    if (isLoading || error || !data || data.error || data.length === 0)
      return [];

    const uniqueKeys = [
      ...new Set(data.flatMap((response) => Object.keys(response))),
    ];

    return uniqueKeys.map((key) => {
      return {
        accessorKey: key,
        header: key,
        cell: ({ getValue }) => {
          const value = getValue();
          if (!value) return null;

          // Handle arrays and objects
          if (Array.isArray(value)) {
            return (
              <div className="space-y-1">
                {value.map((item, index) => (
                  <div key={index} className="p-1 bg-gray-50 rounded">
                    {typeof item === "object"
                      ? Object.entries(item).map(([k, v]) => (
                          <div key={k} className="text-sm">
                            <span className="font-medium">{k}:</span> {v}
                          </div>
                        ))
                      : item}
                  </div>
                ))}
              </div>
            );
          }

          if (typeof value === "object") {
            return Object.entries(value)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ");
          }

          // Handle file URLs
          if (typeof value === "string" && value.startsWith("http")) {
            return (
              <a href={value} target="_blank" rel="noreferrer">
                View File
              </a>
            );
          }

          return value.toString();
        },
      };
    });
  }, [surveyResponse, isLoading, error]);

  // Initialize visible columns when columns are ready
  useEffect(() => {
    if (columns.length > 0) {
      const initialVisibleColumns = new Set(
        columns.map((col) => col.accessorKey)
      );
      setVisibleColumns(initialVisibleColumns);
    }
  }, [columns]);

  // Add new state for collapse
  const [isColumnSelectorVisible, setIsColumnSelectorVisible] = useState(true);

  // Modified ColumnSelector component
  const ColumnSelector = () => (
    <div className="mb-4 p-4 border rounded-lg bg-slate-700 text-white">
      <div className="flex justify-between items-center mb-2">
        <h3>Select Columns to Display</h3>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const allColumns = new Set(columns.map((col) => col.accessorKey));
              setVisibleColumns(allColumns);
            }}
            className="px-2 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded"
          >
            Select All
          </button>
          <button
            onClick={() => setVisibleColumns(new Set())}
            className="px-2 py-1 text-sm bg-slate-600 hover:bg-slate-500 rounded"
          >
            Deselect All
          </button>
          <button
            onClick={() => setIsColumnSelectorVisible(!isColumnSelectorVisible)}
            className="text-white hover:text-gray-300 transition-colors"
            aria-label={
              isColumnSelectorVisible
                ? "Collapse column selector"
                : "Expand column selector"
            }
          >
            <FontAwesomeIcon
              icon={isColumnSelectorVisible ? faChevronUp : faChevronDown}
              className="w-4 h-4"
            />
          </button>
        </div>
      </div>

      {isColumnSelectorVisible && (
        <div className="flex flex-wrap gap-2">
          {columns.map((col) => (
            <div
              key={col.accessorKey}
              className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm
                ${
                  visibleColumns.has(col.accessorKey)
                    ? "bg-blue-600"
                    : "bg-slate-600"
                }
                cursor-pointer hover:opacity-80
              `}
            >
              <span onClick={() => toggleColumn(col.accessorKey)}>
                {col.header}
              </span>
              <button
                className="ml-2 text-white hover:text-red-300"
                onClick={() => toggleColumn(col.accessorKey)}
                aria-label={`Toggle ${col.header} column`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const toggleColumn = (columnKey) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(columnKey)) {
        next.delete(columnKey);
      } else {
        next.add(columnKey);
      }
      return next;
    });
  };

  // Add new state for chart configuration
  const [selectedColumn, setSelectedColumn] = useState("");

  // Helper function to prepare chart data
  const getChartData = useMemo(() => {
    if (!selectedColumn || filteredData.length === 0) {
      return {
        labels: [],
        datasets: [
          {
            label: "",
            data: [],
            backgroundColor: "rgb(16, 185, 129, 0.7)",
            borderColor: "rgb(16, 185, 129)",
            borderWidth: 1,
          },
        ],
      };
    }

    const counts = filteredData.reduce((acc, item) => {
      let value = item[selectedColumn];

      // Handle arrays and objects
      if (Array.isArray(value)) {
        value = `${value.length} items`;
      } else if (typeof value === "object" && value !== null) {
        value = "Object";
      } else if (value === undefined || value === null) {
        value = "N/A";
      } else {
        value = value.toString();
      }

      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: Object.keys(counts),
      datasets: [
        {
          label: selectedColumn,
          data: Object.values(counts),
          backgroundColor: "rgb(99, 102, 241, 0.7)",
          borderColor: "rgb(99, 102, 241)",
          borderWidth: 1,
        },
      ],
    };
  }, [selectedColumn, filteredData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          color: "#ffffff",
        },
      },
      title: {
        display: true,
        text: `Distribution of ${selectedColumn}`,
        color: "#ffffff",
      },
    },
    scales: {
      x: {
        ticks: { color: "#ffffff" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
      y: {
        ticks: { color: "#ffffff" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
      },
    },
  };

  const exportToCSV = () => {
    if (!filteredData || filteredData.length === 0) return;

    // Get headers from the columns
    const headers = columns.map((col) => col.accessorKey);

    // Convert data to CSV format
    const csvContent = [
      // Headers row
      headers.join(" "),
      // Data rows
      ...filteredData.map((row) => {
        return headers
          .map((header) => {
            const value = row[header];
            // Handle different data types
            if (Array.isArray(value)) {
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            } else if (typeof value === "object" && value !== null) {
              return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            } else if (value === null || value === undefined) {
              return "";
            } else {
              return `"${String(value).replace(/"/g, '""')}"`;
            }
          })
          .join(" ");
      }),
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "survey_data.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add new state for dropdown
  const [isChartDropdownOpen, setIsChartDropdownOpen] = useState(false);

  return (
    <div className="w-11/12 mx-auto min-h-screen p-8  pb-20 mt-12">
      <h2 className="text-2xl font-bold mb-4">Survey Responses</h2>
      {isLoading && (
        <div className="grid md:grid-cols-2 gap-6 mt-20 opacity-50">
          {/* Left column */}
          <LoadingSkeleton
            lines={5}
            height="32px"
            width={[70, 65, 70, 65]}
            spacing="1.5rem"
          />

          {/* Right column */}
          <LoadingSkeleton
            lines={5}
            height="32px"
            width={[70, 65, 70, 65]}
            spacing="1.5rem"
          />
        </div>
      )}
      {error && <div>Error: {error.message}</div>}
      {!isLoading && !error && surveyResponse && (
        <>
          {/* Chart configuration section */}
          <div className="mb-8 p-4 rounded-lg shadow bg-slate-700">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold mb-2 text-slate-50">
                Chart Configuration
              </h3>
              <button
                onClick={exportToCSV}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Export to CSV
              </button>
            </div>

            <div className="relative">
              <div className="relative flex md:w-1/2 w-full">
                <input
                  type="text"
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  className="mt-1 block w-full py-2 px-4 rounded-md border-gray-300 shadow-sm border focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Select a column to visualize..."
                  onClick={() => setIsChartDropdownOpen(true)}
                />
                <button
                  type="button"
                  className="absolute right-0 top-1 h-full px-4 text-gray-400 hover:text-gray-600"
                  onClick={() => setIsChartDropdownOpen(!isChartDropdownOpen)}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>

              {(isChartDropdownOpen ||
                (selectedColumn &&
                  !columns.some(
                    (col) => col.accessorKey === selectedColumn
                  ))) && (
                <div className="absolute z-10 md:w-1/2 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {columns
                    .filter(
                      (col) =>
                        !selectedColumn ||
                        col.accessorKey
                          .toLowerCase()
                          .includes(selectedColumn.toLowerCase())
                    )
                    .map((col) => (
                      <div
                        key={col.accessorKey}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedColumn(col.accessorKey);
                          setIsChartDropdownOpen(false);
                        }}
                      >
                        {col.header}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Chart display */}
            {selectedColumn && (
              <div className="mt-4 h-[300px]">
                <Bar options={chartOptions} data={getChartData} />
              </div>
            )}
          </div>

          {/* Add ColumnSelector before the chart configuration */}
          <ColumnSelector />
        </>
      )}
      <SurveyTableTwo
        columns={columns.filter((col) => visibleColumns.has(col.accessorKey))}
        data={surveyResponse}
        onFilteredDataChange={setFilteredData}
      />
    </div>
  );
}

function flattenSurveyData(surveyData) {
  return surveyData.map((response) => {
    // Start with basic keys
    const flattened = {
      response_id: response.response_id,
      response_date: response.response_date,
    };

    // Add each question/answer to flattened object
    response.answers.forEach((ans) => {
      flattened[ans.question] = ans.answer;
    });

    return flattened;
  });
}
