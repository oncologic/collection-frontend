"use client";

import React, { useMemo, useState } from "react";
import Modal from "../Modal";
import Table from "../Table";
import Fundraiser from "../cards/EventCard";
import { DateTime } from "luxon";
import CustomEditor from "../common/CustomEditor";
import ChatHistory from "../ChatHistory";

const ViewAllEventsModal = ({
  isOpen,
  onClose,
  events,
  isAdmin,
  viewAllMode,
  setViewAllMode,
  searchTerm,
  setSearchTerm,
  prompt,
  answer,
}) => {
  const [showAnswer, setShowAnswer] = useState(false);

  // Define columns for the Table view - moved before the conditional return
  const columns = useMemo(
    () => [
      {
        accessorKey: "title",
        header: "EVENT",
        size: 250,
        cell: (info) => (
          <div className="font-medium text-gray-900">{info.getValue()}</div>
        ),
      },
      {
        accessorKey: "status",
        header: "STATUS",
        cell: (info) => {
          const event = info.row.original;
          const status =
            DateTime.fromISO(event.startDate) > DateTime.now()
              ? "Upcoming"
              : "Active";
          return <div className="text-sm">{status}</div>;
        },
      },
      {
        accessorKey: "startDate",
        header: "START DATE",
        cell: (info) => (
          <div className="text-sm">
            {DateTime.fromISO(info.getValue()).toLocaleString(
              DateTime.DATETIME_SHORT
            )}
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "DESCRIPTION",
        size: 400,
        cell: (info) => (
          <div className="text-sm text-gray-600 max-h-[60px] min-w-[300px] overflow-y-auto">
            <CustomEditor
              content={info.getValue()}
              transparent={true}
              editable={false}
            />
          </div>
        ),
      },

      {
        accessorKey: "organizations",
        header: "ORGANIZATIONS",
        cell: (info) => (
          <div className="text-sm">
            {info
              .getValue()
              ?.map((org) => org.name)
              .join(", ")}
          </div>
        ),
      },
    ],
    []
  );

  // Filter events based on search term and upcoming dates
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        searchTerm === "" ||
        event.title?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.organizations?.some((org) =>
          org.name.toLowerCase().includes(searchLower)
        )
      );
    });
  }, [events, searchTerm]);

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} maxWidth="lg:w-3/4 w-full">
      <div className="text-gray-700 bg-gradient-to-br from-blue-50 to-purple-100 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-8">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col gap-2 w-full max-h-[250px] overflow-y-auto">
              <h2 className="text-2xl font-bold">All Events</h2>
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
                      d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Table
                </span>
              </button>
            </div>
          </div>

          {prompt && (
            <div className="mt-4">
              <ChatHistory
                history={[
                  {
                    id: "current",
                    prompt: prompt,
                    answer: answer,
                    timestamp: new Date().toISOString(),
                  },
                ]}
              />
            </div>
          )}

          <div className="mt-4">
            <input
              type="text"
              placeholder="Search events..."
              className="w-full px-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pl-4 md:pl-8 pr-4 md:pr-8 mb-10">
          {viewAllMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 pb-4">
              {filteredEvents.map((event) => (
                <Fundraiser
                  key={event.id}
                  event={event}
                  isAdmin={isAdmin}
                  status={
                    DateTime.fromISO(event.startDate) > DateTime.now()
                      ? "Upcoming"
                      : "Active"
                  }
                />
              ))}
            </div>
          ) : (
            <div className="h-full">
              <Table data={filteredEvents} columns={columns} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ViewAllEventsModal;
