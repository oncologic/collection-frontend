import React, { useState, useEffect } from "react";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from "@tanstack/react-table";

// A simple global filter UI
function GlobalFilter({ globalFilter, setGlobalFilter, onFilteredDataChange }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Search:
      </label>
      <input
        value={globalFilter ?? ""}
        onChange={(e) => {
          setGlobalFilter(e.target.value);
        }}
        placeholder="Type to search..."
        className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
      />
    </div>
  );
}

export default function SurveyTable({
  columns: userColumns,
  data,
  onFilteredDataChange,
}) {
  // You can create a columnHelper, but it's optional if you already have
  // your columns set up. We'll still create it for demonstration.
  const columnHelper = createColumnHelper();

  // We’ll maintain these two pieces of state for global filtering & sorting
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);

  const table = useReactTable({
    data,
    columns: userColumns,
    state: {
      globalFilter,
      sorting,
    },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: "includesString",
  });
  const filteredRows = table.getFilteredRowModel().rows;

  // Add effect to watch filtered rows and update parent
  useEffect(() => {
    const filteredData = filteredRows.map((row) => row.original);
    onFilteredDataChange(filteredData);
  }, [filteredRows, onFilteredDataChange]);

  return (
    <div className="w-full bg-white shadow-md rounded-lg p-6">
      {/* Global Filter */}
      <GlobalFilter
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        onFilteredDataChange={onFilteredDataChange}
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="bg-gray-50 overflow-scroll">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={`
                        px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-700 uppercase tracking-wider
                        border-b-2 border-gray-200
                        ${canSort ? "cursor-pointer hover:bg-gray-100" : ""}
                      `}
                      onClick={
                        canSort
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      <div className="flex items-center space-x-1">
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </span>
                        <span>
                          {sortDirection === "asc" && " 🔼"}
                          {sortDirection === "desc" && " 🔽"}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-gray-900">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {"<<"}
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {"<"}
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {">"}
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            {">>"}
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">
            Page <strong>{table.getState().pagination.pageIndex + 1}</strong> of{" "}
            <strong>{table.getPageCount()}</strong>
          </span>

          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
            className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {[5, 10, 20, 50].map((size) => (
              <option key={size} value={size}>
                Show {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
