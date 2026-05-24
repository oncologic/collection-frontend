import React, { useState, useMemo } from "react";
import Table from "../Table";
import Modal from "../Modal";
import OrganizationCard from "../OrganizationCard";
import Image from "next/image";

const ViewAllOrganizationsModal = ({
  isOpen,
  onClose,
  organizations,
  subscribedOrganizations,
  activeTab,
  viewAllMode,
  setViewAllMode,
  searchTerm,
  setSearchTerm,
}) => {
  // Move organizations filtering logic into useMemo before conditional return
  const filteredOrganizations = useMemo(() => {
    const displayOrganizations =
      activeTab === "subscribed" ? subscribedOrganizations : organizations;

    return displayOrganizations.filter((org) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        searchTerm === "" ||
        org.name?.toLowerCase().includes(searchLower) ||
        org.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [activeTab, organizations, subscribedOrganizations, searchTerm]);

  // Move columns definition before conditional return
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "ORGANIZATION",
        cell: ({ row, getValue }) => {
          const value = getValue();
          const org = row.original;
          return (
            <div className="flex items-center gap-3">
              {org.imageUrl ? (
                <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center overflow-hidden">
                  <Image
                    width={40}
                    height={40}
                    src={org.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center">
                  {org.acronym?.slice(0, 3).toUpperCase() ||
                    org.name?.slice(0, 1)}
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">{value}</div>
                {org.acronym && (
                  <div className="text-sm text-gray-500">({org.acronym})</div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "category",
        header: "CATEGORY",
        cell: (info) => (
          <div className="text-sm capitalize">{info.getValue()}</div>
        ),
      },
      {
        accessorFn: (row) => {
          const parts = [row.city, row.state, row.country].filter(
            (part) => part && part !== "N/A" && part !== "NA"
          );
          return parts.join(", ");
        },
        id: "location",
        header: "LOCATION",
        cell: (info) => <div className="text-sm">{info.getValue()}</div>,
      },
      {
        accessorKey: "createdAt",
        header: "CREATED",
        cell: (info) => {
          const date = new Date(info.getValue());
          return <div className="text-sm">{date.toLocaleDateString()}</div>;
        },
      },
    ],
    []
  );

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} maxWidth="lg:w-3/4 w-full">
      <div className="text-gray-700 bg-gradient-to-br from-blue-50 to-purple-100 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-center p-8">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">All Business Units</h2>
          </div>
          <div className="flex rounded-lg border border-gray-300 p-1 bg-white">
            <button
              onClick={() => setViewAllMode("grid")}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewAllMode === "grid"
                  ? "bg-gray-800 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Grid
              </span>
            </button>
            <button
              onClick={() => setViewAllMode("table")}
              className={`px-4 py-2 rounded-md transition-colors ${
                viewAllMode === "table"
                  ? "bg-gray-800 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z"
                    clipRule="evenodd"
                  />
                </svg>
                Table
              </span>
            </button>
          </div>
        </div>

        <div className="pl-4 md:pl-8 pr-4 md:pr-8">
          <input
            type="text"
            placeholder="Search business units..."
            className="w-full px-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pl-4 md:pl-8 pr-4 md:pr-8 mt-8 mb-20">
          {viewAllMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
              {filteredOrganizations.map((org) => (
                <OrganizationCard key={org.id} org={org} />
              ))}
            </div>
          ) : (
            <div className="h-full">
              <Table data={filteredOrganizations} columns={columns} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ViewAllOrganizationsModal;
