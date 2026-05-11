"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useQuery } from "@tanstack/react-query"; // Ensure you use @tanstack/react-query if that's what you're using
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
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Toaster } from "react-hot-toast";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

// Mock Data (You can place this in a separate file if you like)
const mockPatients = [
  {
    id: 1,
    first_name: "Jane",
    last_name: "Doe",
    top_level_cancer_category: "kidney",
    cancer_subtype: "chromophobe",
    medications: [
      { medication_name: "DrugA", dosage: "50mg" },
      { medication_name: "DrugB", dosage: "100mg" },
    ],
    survey_data: {
      family_history: true,
      tags: ["tag_1", "tag_2"],
      questions: {
        question_1: { answer_value: true },
        question_attachments: {
          answer_value: ["https://example.com/report.pdf"],
        },
        question_severity: { answer_value: 7 },
      },
    },
  },
  {
    id: 2,
    first_name: "John",
    last_name: "Smith",
    top_level_cancer_category: "breast",
    cancer_subtype: "invasive ductal carcinoma",
    medications: [{ medication_name: "DrugC", dosage: "20mg" }],
    survey_data: {
      family_history: false,
      tags: ["tag_2"],
      questions: {
        question_1: { answer_value: false },
        question_attachments: { answer_value: [] },
        question_severity: { answer_value: 3 },
      },
    },
  },
  {
    id: 3,
    first_name: "Alice",
    last_name: "Johnson",
    top_level_cancer_category: "kidney",
    cancer_subtype: "clear cell",
    medications: [{ medication_name: "DrugA", dosage: "75mg" }],
    survey_data: {
      family_history: true,
      tags: ["tag_1"],
      questions: {
        question_1: { answer_value: true },
        question_attachments: {
          answer_value: ["https://example.com/image.png"],
        },
        question_severity: { answer_value: 5 },
      },
    },
  },
];

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Helper to determine field types from values
function determineType(val) {
  if (typeof val === "boolean") return "boolean";
  if (typeof val === "number") return "number";
  if (typeof val === "string") return "string";
  if (Array.isArray(val)) return "array";
  if (val && typeof val === "object") return "object";
  return "unknown";
}

// Recursively traverse survey_data to find fields
function extractSurveyFields(obj, prefix = "") {
  const fields = [];
  for (const key in obj) {
    const value = obj[key];
    const path = prefix ? prefix + "." + key : key;
    const t = determineType(value);
    if (t === "object") {
      // could be nested questions object
      fields.push(...extractSurveyFields(value, path));
    } else if (
      t === "array" ||
      t === "boolean" ||
      t === "number" ||
      t === "string"
    ) {
      // Direct field
      fields.push({ path, type: t });
    }
  }
  return fields;
}

// Helper to get value from nested path in survey_data
function getValueFromPath(data, path) {
  const parts = path.split(".");
  let current = data;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

// Add these helper functions after the existing helper functions
function getCancerCategoryData(patients) {
  const categoryCounts = patients.reduce((acc, patient) => {
    acc[patient.top_level_cancer_category] =
      (acc[patient.top_level_cancer_category] || 0) + 1;
    return acc;
  }, {});

  return {
    labels: Object.keys(categoryCounts),
    datasets: [
      {
        label: "Cancer Categories",
        data: Object.values(categoryCounts),
        backgroundColor: [
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(75, 192, 192, 0.6)",
        ],
      },
    ],
  };
}

function getMedicationData(patients) {
  const medCounts = patients.reduce((acc, patient) => {
    patient.medications.forEach((med) => {
      acc[med.medication_name] = (acc[med.medication_name] || 0) + 1;
    });
    return acc;
  }, {});

  return {
    labels: Object.keys(medCounts),
    datasets: [
      {
        label: "Medications",
        data: Object.values(medCounts),
        backgroundColor: "rgba(153, 102, 255, 0.6)",
      },
    ],
  };
}

// Add this helper function
function fuzzyMatch(searchTerm, value) {
  if (Array.isArray(value)) {
    // Handle arrays (like medications)
    return value.some((item) =>
      typeof item === "object"
        ? Object.values(item).some((v) =>
            String(v).toLowerCase().includes(searchTerm.toLowerCase())
          )
        : String(item).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }
  // Handle regular values
  return String(value).toLowerCase().includes(searchTerm.toLowerCase());
}

export default function Dashboard() {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPatientToDelete, setSelectedPatientToDelete] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  // Define table columns
  const columns = useMemo(
    () => [
      {
        accessorKey: "first_name",
        header: "First Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "last_name",
        header: "Last Name",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "top_level_cancer_category",
        header: "Cancer Category",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "cancer_subtype",
        header: "Cancer Subtype",
        cell: (info) => info.getValue(),
      },
      {
        accessorKey: "medications",
        header: "Medications",
        cell: (info) =>
          info
            .getValue()
            .map((m) => m.medication_name)
            .join(", "),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <button
            onClick={() => handleDeleteClick(row.original)}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        ),
      },
    ],
    []
  );

  // Initialize table with custom filter function
  const table = useReactTable({
    data: mockPatients,
    columns,
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, columnId, filterValue) => {
      const searchTerm = filterValue.toLowerCase();

      // Quick check for medications
      const meds = row.original.medications;
      if (
        meds.some((med) =>
          med.medication_name.toLowerCase().includes(searchTerm)
        )
      ) {
        return true;
      }

      // Check visible values
      const value = row.getValue(columnId);
      return value?.toString().toLowerCase().includes(searchTerm);
    },
  });

  const handleDeleteClick = (patient) => {
    setSelectedPatientToDelete(patient);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    setDeleteModalOpen(false);
    setSelectedPatientToDelete(null);
  };

  // Add these chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
    },
  };

  // Get filtered data for charts
  const filteredData = table
    .getFilteredRowModel()
    .rows.map((row) => row.original);
  const cancerData = getCancerCategoryData(filteredData);
  const medicationData = getMedicationData(filteredData);

  return (
    <div className="w-full min-h-screen p-8 bg-gradient-to-r from-blue-50 to-purple-50 pb-20">
      <Toaster position="top-right" />

      <h1 className="text-2xl font-bold mb-4">Basic Data Explorer</h1>

      {/* Add charts section after the search input and before the table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow h-[300px]">
          <Bar options={chartOptions} data={cancerData} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow h-[300px]">
          <Bar options={chartOptions} data={medicationData} />
        </div>
      </div>

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        message={`Are you sure you want to delete ${selectedPatientToDelete?.first_name} ${selectedPatientToDelete?.last_name}? This action cannot be undone.`}
      />

      <div className="mb-4">
        <input
          placeholder="Search all columns..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="p-2 border rounded w-full max-w-md"
        />
      </div>

      <div className="bg-white rounded-lg shadow overflow-scroll max-h-[500px]">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
