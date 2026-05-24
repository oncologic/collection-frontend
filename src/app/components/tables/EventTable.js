"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  themeQuartz,
} from "ag-grid-community";
import { DateTime } from "luxon";
import Link from "next/link";
import { FaTrash, FaEdit, FaCog, FaFileExport } from "react-icons/fa";
import { useDeleteEvent } from "@/app/hooks/useEvents";
import { toast } from "react-hot-toast";

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const customTheme = themeQuartz.withParams(
  {
    backgroundColor: "#ffffff",
    foregroundColor: "#374151",
    borderColor: "#e5e7eb",
    accentColor: "#6366f1",
    headerBackgroundColor: "#f9fafb",
    rowHoverColor: "#f3f4f6",
    selectedRowBackgroundColor: "#e5e7eb",
    browserColorScheme: "light",
  },
  "light-mode"
);

const EventTable = ({
  events,
  onEventClick,
  userId,
  onDelete,
  onEdit,
  isAdmin,
  isAdvocate,
  onExport,
}) => {
  const { mutate: deleteEvent } = useDeleteEvent();
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);
  const settingsRef = useRef(null);
  const gridRef = useRef(null);

  // Handle selection changes
  const onSelectionChanged = useCallback(() => {
    if (gridRef.current?.api) {
      const selectedRows = gridRef.current.api.getSelectedRows();
      setSelectedCount(selectedRows.length);
    }
  }, []);

  // Handle export click
  const handleExportClick = useCallback(() => {
    if (gridRef.current?.api) {
      const selectedRows = gridRef.current.api.getSelectedRows();
      if (selectedRows.length === 0) {
        // If nothing selected, export all filtered
        const allRows = [];
        gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
          allRows.push(node.data);
        });
        onExport?.(allRows);
      } else {
        onExport?.(selectedRows);
      }
    }
  }, [onExport]);

  // Load saved column visibility from localStorage
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("eventTableColumns");
      if (saved) {
        return JSON.parse(saved);
      }
    }
    // Default visible columns
    return {
      title: true,
      startDate: true,
      startTime: true,
      endDate: true,
      endTime: true,
      organizations: true,
      tags: false,
      locationCity: false,
      locationState: true,
      timezone: false,
      eventType: false,
      expertiseLevel: false,
      virtualInPerson: false,
      registrationLink: false,
      professional: false,
    };
  });

  // Save column visibility when it changes
  useEffect(() => {
    localStorage.setItem("eventTableColumns", JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  // Close settings when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleColumn = (columnId) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };
  const allColumnDefs = [
    {
      headerCheckboxSelection: true,
      checkboxSelection: true,
      headerCheckboxSelectionFilteredOnly: true,
      width: 50,
      maxWidth: 50,
      pinned: "left",
      suppressMenu: true,
      sortable: false,
      filter: false,
      resizable: false,
    },
    {
      field: "title",
      headerName: "Event Name",
      sortable: true,
      filter: true,
      flex: 2,
      hide: !visibleColumns.title,
    },
    {
      field: "startDate",
      headerName: "Start Date",
      sortable: true,
      filter: true,
      flex: 1,
      hide: !visibleColumns.startDate,
      valueFormatter: (params) => {
        return DateTime.fromISO(params.value).toFormat("LLL dd, yyyy");
      },
    },
    {
      field: "startTime",
      headerName: "Start Time",
      sortable: true,
      filter: true,
      flex: 0.8,
      hide: !visibleColumns.startTime,
      valueGetter: (params) => {
        return params.data.startDate;
      },
      valueFormatter: (params) => {
        return DateTime.fromISO(params.value).toFormat("h:mm a");
      },
    },
    {
      field: "endDate",
      headerName: "End Date",
      sortable: true,
      filter: true,
      flex: 1,
      hide: !visibleColumns.endDate,
      valueFormatter: (params) => {
        return DateTime.fromISO(params.value).toFormat("LLL dd, yyyy");
      },
    },
    {
      field: "endTime",
      headerName: "End Time",
      sortable: true,
      filter: true,
      flex: 0.8,
      hide: !visibleColumns.endTime,
      valueGetter: (params) => {
        return params.data.endDate;
      },
      valueFormatter: (params) => {
        return DateTime.fromISO(params.value).toFormat("h:mm a");
      },
    },
    {
      field: "organizations",
      headerName: "Business Units",
      sortable: true,
      filter: true,
      flex: 1,
      hide: !visibleColumns.organizations,
      valueGetter: (params) => {
        return params.data.organizations?.map((org) => org.name).join(", ");
      },
    },
    {
      field: "tags",
      headerName: "Tags",
      sortable: true,
      filter: true,
      flex: 1,
      hide: !visibleColumns.tags,
      valueGetter: (params) => {
        return params.data.tags?.map((tag) => tag.name).join(", ");
      },
    },
    {
      field: "locationCity",
      headerName: "City",
      sortable: true,
      filter: true,
      flex: 0.8,
      hide: !visibleColumns.locationCity,
    },
    {
      field: "locationState",
      headerName: "State",
      sortable: true,
      filter: true,
      flex: 0.6,
      hide: !visibleColumns.locationState,
    },
    {
      field: "timezone",
      headerName: "Time Zone",
      sortable: true,
      filter: true,
      flex: 1,
      hide: !visibleColumns.timezone,
    },
    {
      field: "eventType",
      headerName: "Event Type",
      sortable: true,
      filter: true,
      flex: 1,
      hide: !visibleColumns.eventType,
      valueGetter: (params) => {
        // The event type might be stored as 'type' or 'eventType'
        return params.data.type?.name || params.data.eventType?.name || "";
      },
    },
    {
      field: "expertiseLevel",
      headerName: "Expertise Level",
      sortable: true,
      filter: true,
      flex: 1,
      hide: !visibleColumns.expertiseLevel,
      valueGetter: (params) => {
        return params.data.expertiseLevel?.name || "";
      },
    },
    {
      field: "virtualInPerson",
      headerName: "Format",
      sortable: true,
      filter: true,
      flex: 0.8,
      hide: !visibleColumns.virtualInPerson,
      valueGetter: (params) => {
        const formats = [];
        if (params.data.virtualEvent) formats.push("Virtual");
        if (params.data.inPersonEvent) formats.push("In-Person");
        return formats.join(", ") || "Not specified";
      },
    },
    {
      field: "registrationLink",
      headerName: "Registration",
      sortable: true,
      filter: true,
      flex: 0.8,
      hide: !visibleColumns.registrationLink,
      cellRenderer: (params) => {
        if (!params.value) return "";
        return (
          <a
            href={params.value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800"
            onClick={(e) => e.stopPropagation()}
          >
            Link
          </a>
        );
      },
    },
    {
      field: "professional",
      headerName: "Type",
      sortable: true,
      filter: true,
      flex: 0.8,
      hide: !visibleColumns.professional,
      valueGetter: (params) => {
        return params.data.professional ? "Professional" : "Community";
      },
    },
    {
      colId: "action",
      headerName: "Action",
      sortable: false,
      filter: false,
      width: 150,
      cellRenderer: (params) => (
        <Link
          href={`/events/${params.data.id}`}
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click event
            onEventClick?.(params.data);
          }}
          className="px-3 py-1 text-sm text-blue-500 "
        >
          View
        </Link>
      ),
    },
    {
      colId: "actions",
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filter: false,
      flex: 0.5,
      minWidth: 120,
      cellRenderer: (params) => {
        const event = params.data;
        const canDelete = event.addedByUserId === userId;
        // Only show edit button for advocates or admins
        const canEdit = isAdmin || (isAdvocate && isAdvocate.length > 0);

        return (
          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {canEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (onEdit) onEdit(event);
                }}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit event"
              >
                <FaEdit className="w-4 h-4" />
              </button>
            )}
            {canDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (
                    window.confirm(
                      "Are you sure you want to delete this event?"
                    )
                  ) {
                    deleteEvent(
                      { id: event.id },
                      {
                        onSuccess: () => {
                          toast.success("Event deleted successfully");
                          if (onDelete) onDelete();
                        },
                        onError: (error) => {
                          toast.error(
                            error.message || "Failed to delete event"
                          );
                        },
                      }
                    );
                  }
                }}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete event"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Filter out hidden columns
  const columnDefs = allColumnDefs.filter((col) => !col.hide);

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
  };

  const onGridReady = useCallback((params) => {
    params.api.sizeColumnsToFit();
    window.addEventListener("resize", () => params.api.sizeColumnsToFit());
  }, []);

  return (
    <div className="w-full h-full relative flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {selectedCount > 0 ? (
            <>
              <span className="font-medium text-blue-600">
                {selectedCount} selected
              </span>
              <button
                onClick={() => gridRef.current?.api?.deselectAll()}
                className="text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            </>
          ) : (
            <span>Select rows to export</span>
          )}
        </div>
        <button
          onClick={handleExportClick}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <FaFileExport className="w-3.5 h-3.5" />
          <span>Export{selectedCount > 0 ? ` (${selectedCount})` : ""}</span>
        </button>
      </div>

      {/* Settings button */}
      <div className="absolute top-12 right-2 z-10">
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            title="Column settings"
          >
            <FaCog className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">Columns</span>
          </button>

          {/* Settings dropdown */}
          {showSettings && (
            <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-h-96 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Show/Hide Columns
              </h3>
              <div className="space-y-2">
                {[
                  { id: "title", label: "Event Name", disabled: true },
                  { id: "startDate", label: "Start Date" },
                  { id: "startTime", label: "Start Time" },
                  { id: "endDate", label: "End Date" },
                  { id: "endTime", label: "End Time" },
                  { id: "organizations", label: "Business Units" },
                  { id: "tags", label: "Tags" },
                  { id: "locationCity", label: "City" },
                  { id: "locationState", label: "State" },
                  { id: "timezone", label: "Time Zone" },
                  { id: "eventType", label: "Event Type" },
                  { id: "expertiseLevel", label: "Expertise Level" },
                  {
                    id: "virtualInPerson",
                    label: "Format (Virtual/In-Person)",
                  },
                  { id: "registrationLink", label: "Registration Link" },
                  { id: "professional", label: "Professional/Community" },
                ].map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={visibleColumns[column.id]}
                      onChange={() => toggleColumn(column.id)}
                      disabled={column.disabled}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span
                      className={`text-sm ${
                        column.disabled ? "text-gray-400" : "text-gray-700"
                      }`}
                    >
                      {column.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-gray-200">
                <button
                  onClick={() => {
                    setVisibleColumns({
                      title: true,
                      startDate: true,
                      startTime: true,
                      endDate: true,
                      endTime: true,
                      organizations: true,
                      tags: false,
                      locationCity: false,
                      locationState: true,
                      timezone: false,
                      eventType: false,
                      expertiseLevel: false,
                      virtualInPerson: false,
                      registrationLink: false,
                      professional: false,
                    });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Reset to defaults
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="ag-theme-alpine-dark flex-1"
        style={{
          width: "100%",
          "--ag-background-color": "#ffffff",
          "--ag-header-background-color": "#f9fafb",
          "--ag-odd-row-background-color": "#f8fafc",
          "--ag-header-foreground-color": "#374151",
          "--ag-foreground-color": "#374151",
          "--ag-secondary-foreground-color": "#6b7280",
          "--ag-border-color": "#e5e7eb",
          "--ag-range-selection-border-color": "transparent",
          "--ag-cell-horizontal-border": "none",
          "--ag-selected-row-background-color": "transparent",
        }}
      >
        <AgGridReact
          ref={gridRef}
          theme={customTheme}
          rowData={events}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          pagination={true}
          paginationPageSize={10}
          paginationPageSizeSelector={[5, 10, 20, 50]}
          onGridReady={onGridReady}
          enableCellTextSelection={true}
          suppressRowTransform={true}
          domLayout="normal"
          rowSelection="multiple"
          suppressRowClickSelection={true}
          onSelectionChanged={onSelectionChanged}
          onCellClicked={(params) => {
            // Only navigate if not clicking on action columns or checkbox
            if (
              params.column.colId !== "actions" &&
              params.column.colId !== "action" &&
              !params.column.getColDef().checkboxSelection
            ) {
              onEventClick?.(params.data);
            }
          }}
        />
      </div>
    </div>
  );
};

export default EventTable;
