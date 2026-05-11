import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";

const Table = ({ data, columns, initialPageSize = 10 }) => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-x-auto rounded-t-lg shadow-md hover:shadow-lg transition-shadow bg-white">
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-slate-600">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="sticky top-0">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={`px-6 py-4 text-left text-sm font-semibold text-white uppercase ${
                        header.column.id === "description"
                          ? "w-64 whitespace-normal"
                          : ""
                      }`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`px-6 py-4 ${
                        cell.column.id === "description"
                          ? "w-64 whitespace-normal"
                          : "whitespace-nowrap"
                      }`}
                    >
                      {cell.column.id === "description" ? (
                        <div className="max-h-[120px] overflow-y-auto">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      ) : (
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-2 bg-slate-100 rounded-b-lg">
        <div className="flex mb-2 sm:mb-0">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-4 py-1 mr-2 rounded-md bg-blue-600 text-white font-medium disabled:opacity-50 transition-colors hover:bg-blue-700"
          >
            Previous
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-4 py-1 rounded-md bg-blue-600 text-white font-medium disabled:opacity-50 transition-colors hover:bg-blue-700"
          >
            Next
          </button>
        </div>
        <span className="text-sm text-gray-700">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </span>
      </div>
    </div>
  );
};

export default Table;
