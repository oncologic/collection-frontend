"use client";
import React, { useMemo, useState } from "react";
import Layout from "@/app/components/Layout";
import FlippableCard from "@/app/components/FlippableCard";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import ChatPrompt from "@/app/components/ChatPrompt";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChartBar } from "@fortawesome/free-solid-svg-icons";
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

// Import hooks for surveys, events, resources, and collections
import { useEvents } from "@/app/hooks/useEvents";
import {
  useGetAllCollections,
  useGetResources,
} from "@/app/hooks/useResources";
import { useFetchSurveys } from "@/app/hooks/useSurveys";
import { useOrganizations } from "@/app/hooks/useOrganizations";

// Helper function for safe localStorage access
const getLocalStorage = () => {
  if (typeof window !== "undefined") {
    return window.localStorage;
  }
  return null;
};

// Define a color array for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const CustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
  value,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="text-xs"
    >
      {name}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 border rounded shadow">
        <p className="font-semibold">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

// Updated StatDisplay component without percentage or color change indications.
const StatDisplay = ({ label, count, onViewDetails }) => {
  return (
    <div
      className={`flex items-center justify-between ${
        onViewDetails ? "cursor-pointer hover:underline" : ""
      }`}
      onClick={(e) => {
        e.stopPropagation();
        onViewDetails && onViewDetails();
      }}
    >
      <span className="text-gray-600">{label}</span>
      <span className="font-semibold text-gray-600">{count} total</span>
    </div>
  );
};

// --- DataDetailsModal for premium breakdown display ---
const DataDetailsModal = ({ title, data, columns, onClose }) => (
  <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg shadow-xl max-h-[80vh] overflow-auto p-6 w-full max-w-3xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">{title}</h2>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
          Close
        </button>
      </div>
      <table className="min-w-full table-auto">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-4 py-2 border-b">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              {columns.map((col, idx) => (
                <td key={idx} className="px-4 py-2 border-b">
                  {col.accessor(item)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// Define column setups for each data type
const resourceColumns = [
  { header: "Name", accessor: (item) => item.name || item.title },
  {
    header: "Created At",
    accessor: (item) => new Date(item.createdAt).toLocaleString(),
  },
  { header: "Type", accessor: (item) => item.resourceType?.name || "Other" },
];

// For collections, reference collection.name
const collectionColumns = [
  {
    header: "Name",
    accessor: (item) => item.name,
  },
  {
    header: "Created At",
    accessor: (item) => new Date(item.createdAt).toLocaleString(),
  },
];

const eventColumns = [
  { header: "Title", accessor: (item) => item.title },
  {
    header: "Start Date",
    accessor: (item) => new Date(item.startDate).toLocaleString(),
  },
  { header: "Location", accessor: (item) => item.location || "N/A" },
];

const organizationColumns = [
  { header: "Name", accessor: (item) => item.name },
  {
    header: "Created At",
    accessor: (item) => new Date(item.createdAt).toLocaleString(),
  },
];

// This function groups data by month, using "startDate" for events and "createdAt" for others.
const processMonthlyData = (items, isEvent = false) => {
  if (!Array.isArray(items)) return [];

  const monthlyData = items.reduce((acc, item) => {
    const date = new Date(isEvent ? item.startDate : item.createdAt);
    const monthYear = date.toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    acc[monthYear] = (acc[monthYear] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(monthlyData)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => new Date(a.month) - new Date(b.month));
};

const processTypeData = (items) => {
  if (!Array.isArray(items)) return [];

  const typeData = items.reduce((acc, item) => {
    const type = item.resourceType?.name || "Other";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(typeData).map(([name, value]) => ({ name, value }));
};

/**
 * Removed change calculations from resource statistics.
 * We only return counts for thisMonth and lastMonth.
 */
const calculateResourceStats = (items) => {
  if (!Array.isArray(items)) return { thisMonth: [], lastMonth: [] };

  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth());
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);

  return items.reduce(
    (acc, item) => {
      const itemDate = new Date(item.createdAt);
      const itemMonth = new Date(itemDate.getFullYear(), itemDate.getMonth());

      if (itemMonth.getTime() === thisMonth.getTime()) acc.thisMonth.push(item);
      if (itemMonth.getTime() === lastMonth.getTime()) acc.lastMonth.push(item);

      return acc;
    },
    { thisMonth: [], lastMonth: [] }
  );
};

export default function AdminDashboard() {
  // Fetch events data
  const { data: events, isLoading: eventsLoading } = useEvents();

  // Fetch resources data
  const { data: resources, isLoading: resourcesLoading } = useGetResources();

  // Fetch surveys data
  const { data: surveys, isLoading: surveysLoading } = useFetchSurveys();

  // Fetch collections data
  const { data: collections, isLoading: collectionsLoading } =
    useGetAllCollections();

  // Fetch organizations data
  const { data: organizations, isLoading: organizationsLoading } =
    useOrganizations();

  // --- Modal state to show detailed breakdown ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState([]);
  const [modalColumns, setModalColumns] = useState([]);

  const openDetailsModal = (title, data, columns) => {
    setModalTitle(title);
    setModalData(data);
    setModalColumns(columns);
    setModalOpen(true);
  };

  const closeDetailsModal = () => setModalOpen(false);

  // Memoized processed data
  const monthlyStats = useMemo(
    () => ({
      resources: processMonthlyData(resources),
      events: processMonthlyData(events, true),
      surveys: processMonthlyData(surveys),
    }),
    [resources, events, surveys]
  );

  const typeStats = useMemo(
    () => ({
      resources: processTypeData(resources),
      events: processTypeData(events),
    }),
    [resources, events]
  );

  const resourceStats = useMemo(
    () => calculateResourceStats(resources),
    [resources]
  );
  const collectionStats = useMemo(
    () => calculateResourceStats(collections),
    [collections]
  );
  const organizationStats = useMemo(
    () => calculateResourceStats(organizations),
    [organizations]
  );

  const eventStats = useMemo(() => {
    const calculateEventStats = (events) => {
      if (!Array.isArray(events))
        return { thisMonth: [], lastMonth: [], nextMonth: [] };

      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth());
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1);

      return events.reduce(
        (acc, event) => {
          const startDate = new Date(event.startDate);
          const eventMonth = new Date(
            startDate.getFullYear(),
            startDate.getMonth()
          );
          if (eventMonth.getTime() === thisMonth.getTime())
            acc.thisMonth.push(event);
          if (eventMonth.getTime() === lastMonth.getTime())
            acc.lastMonth.push(event);
          if (eventMonth.getTime() === nextMonth.getTime())
            acc.nextMonth.push(event);
          return acc;
        },
        { thisMonth: [], lastMonth: [], nextMonth: [] }
      );
    };

    return calculateEventStats(events);
  }, [events]);

  if (
    eventsLoading ||
    resourcesLoading ||
    surveysLoading ||
    collectionsLoading ||
    organizationsLoading
  ) {
    return (
      <div className="p-6">
        <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 relative mb-20">
      <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Resources Card */}
        <FlippableCard
          title="Resources"
          value={resources?.length || 0}
          frontStats={[
            {
              label: "This Month",
              component: (
                <StatDisplay
                  label="This Month"
                  count={resourceStats.thisMonth.length}
                  onViewDetails={() =>
                    openDetailsModal(
                      "Resources - This Month Details",
                      resourceStats.thisMonth,
                      resourceColumns
                    )
                  }
                />
              ),
            },
            {
              label: "Last Month",
              component: (
                <StatDisplay
                  label="Last Month"
                  count={resourceStats.lastMonth.length}
                  onViewDetails={() =>
                    openDetailsModal(
                      "Resources - Last Month Details",
                      resourceStats.lastMonth,
                      resourceColumns
                    )
                  }
                />
              ),
            },
          ]}
        >
          <div className="h-full">
            <div className="relative h-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDetailsModal(
                    "Resources Details",
                    resources,
                    resourceColumns
                  );
                }}
                className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded shadow z-50"
              >
                View Details
              </button>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeStats.resources}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={CustomLabel}
                    labelLine={false}
                    paddingAngle={2}
                  >
                    {typeStats.resources.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={CustomTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FlippableCard>

        {/* Events Card */}
        <FlippableCard
          title="Events"
          value={events?.length || 0}
          frontStats={[
            {
              label: "This Month",
              component: (
                <StatDisplay
                  label="This Month"
                  count={eventStats.thisMonth.length}
                  onViewDetails={() =>
                    openDetailsModal(
                      "Events - This Month Details",
                      eventStats.thisMonth,
                      eventColumns
                    )
                  }
                />
              ),
            },
            {
              label: "Last Month",
              component: (
                <StatDisplay
                  label="Last Month"
                  count={eventStats.lastMonth.length}
                  onViewDetails={() =>
                    openDetailsModal(
                      "Events - Last Month Details",
                      eventStats.lastMonth,
                      eventColumns
                    )
                  }
                />
              ),
            },
            {
              label: "Next Month",
              component: (
                <StatDisplay
                  label="Next Month"
                  count={eventStats.nextMonth.length}
                  onViewDetails={() =>
                    openDetailsModal(
                      "Events - Next Month Details",
                      eventStats.nextMonth,
                      eventColumns
                    )
                  }
                />
              ),
            },
          ]}
        >
          <div className="h-full">
            <div className="relative h-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDetailsModal("Events Details", events, eventColumns);
                }}
                className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded shadow z-50"
              >
                View Details
              </button>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats.events}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FlippableCard>

        {/* Collections Card */}
        <FlippableCard
          title="Collections"
          value={collections?.length || 0}
          frontStats={[
            {
              label: "This Month",
              component: (
                <StatDisplay
                  label="This Month"
                  count={collectionStats.thisMonth.length}
                  onViewDetails={() =>
                    openDetailsModal(
                      "Collections - This Month Details",
                      collectionStats.thisMonth,
                      collectionColumns
                    )
                  }
                />
              ),
            },
            {
              label: "Last Month",
              component: (
                <StatDisplay
                  label="Last Month"
                  count={collectionStats.lastMonth.length}
                  onViewDetails={() =>
                    openDetailsModal(
                      "Collections - Last Month Details",
                      collectionStats.lastMonth,
                      collectionColumns
                    )
                  }
                />
              ),
            },
          ]}
        >
          <div className="h-full">
            <div className="relative h-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDetailsModal(
                    "Collections Details",
                    collections,
                    collectionColumns
                  );
                }}
                className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded shadow z-50"
              >
                View Details
              </button>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={processMonthlyData(collections)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FlippableCard>

        {/* Organizations Card */}
        <FlippableCard
          title="Organizations"
          value={organizations?.length || 0}
          frontStats={[
            {
              label: "This Month",
              component: (
                <StatDisplay
                  label="This Month"
                  count={organizationStats.thisMonth.length}
                  onViewDetails={() =>
                    openDetailsModal(
                      "Organizations - This Month Details",
                      organizationStats.thisMonth,
                      organizationColumns
                    )
                  }
                />
              ),
            },
            {
              label: "Last Month",
              component: (
                <StatDisplay
                  label="Last Month"
                  count={organizationStats.lastMonth.length}
                  onViewDetails={() =>
                    openDetailsModal(
                      "Organizations - Last Month Details",
                      organizationStats.lastMonth,
                      organizationColumns
                    )
                  }
                />
              ),
            },
          ]}
        >
          <div className="h-full">
            <div className="relative h-full">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDetailsModal(
                    "Organizations Details",
                    organizations,
                    organizationColumns
                  );
                }}
                className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded shadow z-50"
              >
                View Details
              </button>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processMonthlyData(organizations)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: "#8884d8" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </FlippableCard>
      </div>
      <div className="mt-8">
        <ChatPrompt
          resources={resources}
          events={events}
          collections={collections}
        />
      </div>
      {modalOpen && (
        <DataDetailsModal
          title={modalTitle}
          data={modalData}
          columns={modalColumns}
          onClose={closeDetailsModal}
        />
      )}
    </div>
  );
}
