"use client";

import React, { useMemo } from "react";
import Modal from "../Modal";
import Table from "../Table";
import { SurveyCard } from "../SurveyCard";
import CustomEditor from "../common/CustomEditor";

const ViewAllSurveysModal = ({
  isOpen,
  onClose,
  surveys,
  viewAllMode,
  setViewAllMode,
  searchTerm,
  setSearchTerm,
}) => {
  // Move filteredSurveys into useMemo before conditional return
  const filteredSurveys = useMemo(() => {
    return surveys.filter((survey) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        searchTerm === "" ||
        survey.title?.toLowerCase().includes(searchLower) ||
        survey.description?.toLowerCase().includes(searchLower)
      );
    });
  }, [surveys, searchTerm]);

  // Move columns definition before conditional return
  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "SURVEY",
        size: 250,
        cell: (info) => (
          <div className="font-medium text-gray-900">{info.getValue()}</div>
        ),
      },
      {
        accessorKey: "description",
        header: "DESCRIPTION",
        size: 800,
        cell: (info) => (
          <div className="text-sm text-gray-600 max-h-[60px] min-w-[400px] overflow-y-auto">
            <CustomEditor
              content={info.getValue()}
              transparent={true}
              editable={false}
            />
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "CREATED",
        cell: (info) => {
          const date = new Date(info.getValue());
          return <div className="text-sm">{date.toLocaleDateString()}</div>;
        },
      },
      {
        accessorKey: "hasResponded",
        header: "STATUS",
        cell: (info) => (
          <div className="text-sm">
            {info.getValue() ? "Completed" : "Pending"}
          </div>
        ),
      },
    ],
    []
  );

  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} maxWidth="lg:w-3/4 w-full">
      <div className="text-gray-700 bg-gradient-to-br from-blue-50 to-purple-100 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with view mode toggle - moved p-8 to container */}
        <div className="flex flex-col md:flex-row justify-between items-center p-8">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold">All Surveys</h2>
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

        {/* Search input - updated padding */}
        <div className="pl-4 md:pl-8 pr-4 md:pr-8">
          <input
            type="text"
            placeholder="Search surveys..."
            className="w-full px-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Content - updated padding and mobile responsiveness */}
        <div className="flex-1 overflow-y-auto pl-4 md:pl-8 pr-4 md:pr-8 mt-8 mb-20">
          {viewAllMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
              {filteredSurveys.map((survey) => (
                <SurveyCard key={survey.id} survey={survey} />
              ))}
            </div>
          ) : (
            <div className="h-full">
              <Table data={filteredSurveys} columns={columns} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ViewAllSurveysModal;
